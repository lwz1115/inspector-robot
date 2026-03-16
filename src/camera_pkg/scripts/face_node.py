#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
人脸识别节点
- 订阅 /image 获取摄像头画面
- 订阅 /face_cmd (std_msgs/String) 控制启停: "start" / "stop"
- 识别结果实时发布到 /recognized_face_name (std_msgs/String)
  格式: "name:confidence:frameCount"
- 无 cv2.imshow，纯后台运行
"""
import sys
import os
import pickle
import time
import cv2
import numpy as np
import rospy
from sensor_msgs.msg import Image
from std_msgs.msg import String
from cv_bridge import CvBridge

sys.path.append('/home/jetson/.local/lib/python2.7/site-packages')
try:
    import dlib
except ImportError as e:
    print("dlib import failed: %s" % e)
    sys.exit(1)


class FaceRecognizer:
    def __init__(self):
        rospy.init_node('face_recognizer', anonymous=False)

        self.bridge = CvBridge()
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.script_dir, 'face_data')

        self.detector = dlib.get_frontal_face_detector()

        # 运行状态（由 /face_cmd 控制）
        self.running = False

        # 检测参数
        self.frame_skip = 3
        self.frame_count = 0
        self.process_scale = 0.8
        self.confidence_threshold = 0.6
        self.continuous_threshold = 10   # 连续N帧才发布，降低到10帧更灵敏

        # 数据
        self.label_ids = {}
        self.face_data = {}
        self.recognition_history = {}
        self.face_records = {}

        self.load_training_data()

        # 发布者
        self.result_pub = rospy.Publisher('/recognized_face_name', String, queue_size=5)
        self.status_pub = rospy.Publisher('/face_node_status', String, queue_size=5)

        # 订阅者
        rospy.Subscriber('/image', Image, self.cb_image)
        rospy.Subscriber('/face_cmd', String, self.cb_cmd)

        rospy.loginfo("face_node ready. Send 'start'/'stop' to /face_cmd")

    # ── 命令控制 ──────────────────────────────────────────
    def cb_cmd(self, msg):
        cmd = msg.data.strip().lower()
        if cmd == 'start':
            self.running = True
            self.face_records.clear()
            self.recognition_history.clear()
            self.load_training_data()   # 重新加载，支持训练后立即识别
            self.status_pub.publish('running')
            rospy.loginfo("face_node: started")
        elif cmd == 'stop':
            self.running = False
            self.status_pub.publish('stopped')
            rospy.loginfo("face_node: stopped")
        elif cmd == 'reload':
            self.load_training_data()
            self.status_pub.publish('reloaded:%d' % len(self.face_data))

    # ── 训练数据加载 ──────────────────────────────────────
    def load_training_data(self):
        if not os.path.exists(self.data_dir):
            rospy.logwarn("face_data dir not found")
            return
        labels_path = os.path.join(self.data_dir, 'labels.pickle')
        if not os.path.exists(labels_path):
            rospy.logwarn("No labels.pickle found")
            return
        try:
            with open(labels_path, 'rb') as f:
                self.label_ids = pickle.load(f)
        except Exception as e:
            rospy.logerr("Load labels failed: %s" % e)
            return

        self.face_data = {}
        for pid, pname in self.label_ids.items():
            feats = []
            for fn in os.listdir(self.data_dir):
                if fn.startswith('%d_' % pid) and fn.endswith('.jpg'):
                    img = cv2.imread(os.path.join(self.data_dir, fn), cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        f = self._hog(img)
                        if f is not None:
                            feats.append(f)
            if feats:
                self.face_data[pid] = {
                    'name': pname,
                    'avg': np.mean(feats, axis=0)
                }
        rospy.loginfo("Loaded %d persons" % len(self.face_data))

    # ── HOG 特征 ──────────────────────────────────────────
    def _hog(self, img):
        try:
            img = cv2.resize(img, (64, 128))
            hog = cv2.HOGDescriptor((64,128),(16,16),(8,8),(8,8),9)
            f = hog.compute(img)
            return f.flatten() if f is not None else None
        except:
            return None

    # ── 人脸检测 ──────────────────────────────────────────
    def _detect(self, frame):
        h, w = frame.shape[:2]
        nw, nh = int(w * self.process_scale), int(h * self.process_scale)
        small = cv2.resize(frame, (nw, nh))
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        rects = []
        for face in self.detector(rgb, 1):
            x = max(0, int(face.left()   / self.process_scale))
            y = max(0, int(face.top()    / self.process_scale))
            fw = min(int((face.right()-face.left()) / self.process_scale), w-x)
            fh = min(int((face.bottom()-face.top()) / self.process_scale), h-y)
            if fw > 20 and fh > 20:
                rects.append((x, y, fw, fh))
        return rects

    # ── 识别 ──────────────────────────────────────────────
    def _recognize(self, roi):
        if not self.face_data:
            return 'Unknown', 0.0
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        feat = self._hog(gray)
        if feat is None:
            return 'Unknown', 0.0
        best_name, best_sim = 'Unknown', 0.0
        for pid, pd in self.face_data.items():
            avg = pd['avg']
            if len(feat) != len(avg):
                continue
            n1, n2 = np.linalg.norm(feat), np.linalg.norm(avg)
            if n1 == 0 or n2 == 0:
                continue
            sim = float(np.dot(feat, avg) / (n1 * n2))
            sim = max(0.0, min(1.0, sim))
            if sim > best_sim:
                best_sim, best_name = sim, pd['name']
        if best_sim < self.confidence_threshold:
            return 'Unknown', best_sim
        return best_name, best_sim

    # ── 平滑历史 ──────────────────────────────────────────
    def _smooth(self, fid, name, conf):
        hist = self.recognition_history.setdefault(fid, [])
        hist.append((name, conf))
        if len(hist) > 5:
            hist.pop(0)
        if len(hist) >= 3:
            names = [x[0] for x in hist]
            mc = max(set(names), key=names.count)
            confs = [x[1] for x in hist if x[0] == mc]
            return mc, float(np.mean(confs))
        return name, conf

    # ── 连续帧计数 → 发布 ─────────────────────────────────
    def _check_publish(self, fid, name, conf):
        if name == 'Unknown' or conf < self.confidence_threshold:
            self.face_records.pop(fid, None)
            return
        rec = self.face_records.setdefault(fid, {'name': name, 'count': 0, 'conf_sum': 0.0})
        if rec['name'] != name:
            self.face_records[fid] = {'name': name, 'count': 1, 'conf_sum': conf}
            return
        rec['count'] += 1
        rec['conf_sum'] += conf
        if rec['count'] >= self.continuous_threshold:
            avg_conf = rec['conf_sum'] / rec['count']
            msg = '%s:%.2f:%d' % (name, avg_conf, rec['count'])
            self.result_pub.publish(msg)
            rospy.loginfo("RECOGNIZED: %s (%.1f%%)" % (name, avg_conf * 100))
            self.face_records.pop(fid)  # 重置，避免重复发布

    # ── 图像回调 ──────────────────────────────────────────
    def cb_image(self, msg):
        if not self.running:
            return
        self.frame_count += 1
        if self.frame_count % self.frame_skip != 0:
            return
        try:
            frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
            faces = self._detect(frame)
            for i, (x, y, w, h) in enumerate(faces):
                roi = frame[y:y+h, x:x+w]
                if roi.size == 0:
                    continue
                name, conf = self._recognize(roi)
                name, conf = self._smooth(i, name, conf)
                self._check_publish(i, name, conf)
        except Exception as e:
            rospy.logwarn("cb_image error: %s" % e)

    def run(self):
        rospy.spin()


if __name__ == '__main__':
    FaceRecognizer().run()
