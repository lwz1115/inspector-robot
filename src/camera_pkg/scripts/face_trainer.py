#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
人脸训练节点
- 订阅 /image 获取摄像头画面
- 订阅 /face_train_cmd (std_msgs/String):
    "start:{name}"  — 开始采集该人的人脸（采集30张）
    "stop"          — 中止当前训练
- 训练进度/结果发布到 /face_train_status (std_msgs/String):
    "progress:{name}:{count}/{total}"
    "done:{name}"
    "error:{msg}"
    "idle"
"""
import cv2
import rospy
import numpy as np
import os
import pickle
import time
from sensor_msgs.msg import Image
from std_msgs.msg import String
from cv_bridge import CvBridge
import sys

sys.path.append('/home/jetson/.local/lib/python2.7/site-packages')
try:
    import dlib
except ImportError as e:
    rospy.logerr("dlib import failed: %s" % e)
    sys.exit(1)


class FaceTrainer:
    def __init__(self):
        rospy.init_node('face_trainer', anonymous=False)

        self.bridge = CvBridge()
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.script_dir, 'face_data')
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

        self.detector = dlib.get_frontal_face_detector()

        # 检测参数
        self.frame_skip = 3
        self.frame_count = 0
        self.process_scale = 0.8
        self.target_count = 30   # 每人采集30张

        # 训练状态
        self.training = False
        self.training_name = ''
        self.training_id = 0
        self.collected = 0

        # 标签
        self.label_ids = {}
        self._load_labels()

        # 发布者
        self.status_pub = rospy.Publisher('/face_train_status', String, queue_size=5)

        # 订阅者
        rospy.Subscriber('/image', Image, self.cb_image)
        rospy.Subscriber('/face_train_cmd', String, self.cb_cmd)

        self.status_pub.publish('idle')
        rospy.loginfo("face_trainer ready. Send 'start:{name}' to /face_train_cmd")

    # ── 命令控制 ──────────────────────────────────────────
    def cb_cmd(self, msg):
        cmd = msg.data.strip()
        if cmd.startswith('start:'):
            name = cmd[6:].strip()
            if not name:
                self.status_pub.publish('error:name is empty')
                return
            self._begin(name)
        elif cmd == 'stop':
            self.training = False
            self.status_pub.publish('idle')
            rospy.loginfo("face_trainer: stopped by command")

    def _begin(self, name):
        self._load_labels()
        # 分配 ID
        if self.label_ids:
            self.training_id = max(self.label_ids.keys()) + 1
        else:
            self.training_id = 0
        self.label_ids[self.training_id] = name
        self.training_name = name
        self.collected = 0
        self.training = True
        rospy.loginfo("face_trainer: start collecting '%s' (id=%d)" % (name, self.training_id))
        self.status_pub.publish('progress:%s:0/%d' % (name, self.target_count))

    # ── 标签持久化 ────────────────────────────────────────
    def _load_labels(self):
        p = os.path.join(self.data_dir, 'labels.pickle')
        if os.path.exists(p):
            try:
                with open(p, 'rb') as f:
                    self.label_ids = pickle.load(f)
            except:
                self.label_ids = {}

    def _save_labels(self):
        p = os.path.join(self.data_dir, 'labels.pickle')
        with open(p, 'wb') as f:
            pickle.dump(self.label_ids, f, protocol=2)

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

    # ── 图像回调 ──────────────────────────────────────────
    def cb_image(self, msg):
        if not self.training:
            return
        self.frame_count += 1
        if self.frame_count % self.frame_skip != 0:
            return
        try:
            frame = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
            faces = self._detect(frame)
            if not faces:
                return
            # 取最大人脸
            x, y, w, h = max(faces, key=lambda r: r[2]*r[3])
            roi = frame[y:y+h, x:x+w]
            if roi.size == 0:
                return
            roi_resized = cv2.resize(roi, (100, 100))
            path = os.path.join(self.data_dir, '%d_%d.jpg' % (self.training_id, self.collected))
            cv2.imwrite(path, roi_resized)
            self.collected += 1
            self.status_pub.publish('progress:%s:%d/%d' % (
                self.training_name, self.collected, self.target_count))
            rospy.loginfo("Collected %d/%d for '%s'" % (
                self.collected, self.target_count, self.training_name))
            if self.collected >= self.target_count:
                self._finish()
        except Exception as e:
            rospy.logwarn("cb_image error: %s" % e)
            self.status_pub.publish('error:%s' % str(e))

    def _finish(self):
        self.training = False
        self._save_labels()
        self.status_pub.publish('done:%s' % self.training_name)
        rospy.loginfo("face_trainer: done '%s'" % self.training_name)

    def run(self):
        rospy.spin()


if __name__ == '__main__':
    FaceTrainer().run()
