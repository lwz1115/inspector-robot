#!/usr/bin/env python
# -*- coding: utf-8 -*-
import cv2
import rospy
import numpy as np
import os
import pickle
import time
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import sys
import select

# 强制导入 Python2 版本的 dlib
import sys
sys.path.append('/home/jetson/.local/lib/python2.7/site-packages')

try:
    import dlib
    print("dlib imported successfully!")
except ImportError as e:
    print("dlib import failed:", e)
    sys.exit(1)

class FaceTrainer:
    def __init__(self):
        rospy.init_node('face_trainer')
        self.bridge = CvBridge()
        
        # 数据路径
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.script_dir, 'face_data')
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
        
        # 🚀 使用 dlib HOG 检测器
        self.detector = dlib.get_frontal_face_detector()
        rospy.loginfo("dlib HOG detector loaded")
        
        # 🎯 平衡性能与检测精度
        self.frame_skip = 5 # 每2帧处理1帧
        self.frame_count = 0
        self.process_scale = 0.8  # 稍微降低分辨率
        self.upsample_num_times = 1  # 轻微上采样提高检测率
        
        # 训练数据
        self.label_ids = {}
        self.load_labels()
        
        # 训练状态
        self.training = False
        self.training_name = ""
        self.training_id = 0
        self.training_count = 0
        self.target_count = 10
        
        # 缓存
        self.last_faces = []
        self.detect_counter = 0
        
        # 性能监控
        self.fps = 0
        self.last_time = time.time()
        
        # 订阅
        rospy.Subscriber('/image', Image, self.process_image)
        
        rospy.loginfo("Face Trainer Started (Balanced)")
        rospy.loginfo("Press 't' to train, 'q' to quit")

    def load_labels(self):
        """加载标签 - 兼容 Python2"""
        labels_path = os.path.join(self.data_dir, 'labels.pickle')
        if os.path.exists(labels_path):
            try:
                with open(labels_path, 'rb') as f:
                    self.label_ids = pickle.load(f)
                rospy.loginfo("Loaded %d persons" % len(self.label_ids))
            except Exception as e:
                rospy.logwarn("Failed to load labels, starting fresh: %s" % str(e))
                self.label_ids = {}
        else:
            rospy.loginfo("No labels found, starting fresh")
            self.label_ids = {}

    def save_labels(self):
        """保存标签 - 使用 Python2 兼容的协议"""
        labels_path = os.path.join(self.data_dir, 'labels.pickle')
        try:
            with open(labels_path, 'wb') as f:
                pickle.dump(self.label_ids, f, protocol=2)
            rospy.loginfo("Labels saved successfully")
        except Exception as e:
            rospy.logerr("Failed to save labels: %s" % str(e))

    def detect_faces_dlib_balanced(self, frame):
        """平衡性能与精度的人脸检测"""
        try:
            # 🎯 稍微降低分辨率，保持检测精度
            height, width = frame.shape[:2]
            new_width = int(width * self.process_scale)
            new_height = int(height * self.process_scale)
            
            small_frame = cv2.resize(frame, (new_width, new_height))
            
            # 转换为 RGB (dlib 需要)
            rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
            
            # 🎯 轻微上采样提高检测率
            faces = self.detector(rgb_frame, self.upsample_num_times)
            
            # 转换格式并缩放回原尺寸
            face_rects = []
            for face in faces:
                x = int(face.left() / self.process_scale)
                y = int(face.top() / self.process_scale)
                w = int((face.right() - face.left()) / self.process_scale)
                h = int((face.bottom() - face.top()) / self.process_scale)
                
                # 确保坐标在图像范围内
                x = max(0, min(x, width - 1))
                y = max(0, min(y, height - 1))
                w = min(w, width - x)
                h = min(h, height - y)
                
                if w > 20 and h > 20:  # 过滤太小的人脸
                    face_rects.append((x, y, w, h))
            
            return face_rects
            
        except Exception as e:
            rospy.logwarn("Dlib detection error: %s" % str(e))
            return []

    def process_image(self, msg):
        self.frame_count += 1
        if self.frame_count % self.frame_skip != 0:
            return
            
        try:
            start_time = time.time()
            
            frame = self.bridge.imgmsg_to_cv2(msg, "bgr8")
            
            # 🎯 每次都检测，但使用优化的参数
            faces = self.detect_faces_dlib_balanced(frame)
            self.last_faces = faces
            
            # 在图像上显示调试信息
            debug_text = []
            
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, "Face", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                
                if self.training:
                    # 保存人脸图片
                    face_img = frame[y:y+h, x:x+w]
                    if face_img.size > 0:
                        face_resized = cv2.resize(face_img, (100, 100))
                        
                        img_path = os.path.join(self.data_dir, "%d_%d.jpg" % (self.training_id, self.training_count))
                        cv2.imwrite(img_path, face_resized)
                        
                        self.training_count += 1
                        rospy.loginfo("Saved %d/%d images for %s" % (self.training_count, self.target_count, self.training_name))
                        
                        if self.training_count >= self.target_count:
                            self.finish_training()
            
            # 🚀 性能统计
            processing_time = (time.time() - start_time) * 1000
            current_time = time.time()
            if current_time - self.last_time >= 1.0:
                self.fps = self.frame_count / (current_time - self.last_time)
                self.frame_count = 0
                self.last_time = current_time
            
            # 显示状态
            status = "Training: " + self.training_name if self.training else "Ready - Press 't' to train"
            cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, "Faces: %d" % len(faces), (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, "FPS: %.1f" % self.fps, (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, "Time: %.1fms" % processing_time, (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, "Scale: %.1f" % self.process_scale, (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # 显示检测提示
            if len(faces) == 0:
                cv2.putText(frame, "No faces detected - Move closer", (frame.shape[1]//2-150, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            cv2.imshow('Face Trainer', frame)
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                rospy.signal_shutdown("Quit")
            elif key == ord('t') and not self.training:
                self.start_training()
            elif key == ord('1'):
                # 调试：调整参数
                self.process_scale = max(0.3, self.process_scale - 0.1)
                rospy.loginfo("Scale: %.1f" % self.process_scale)
            elif key == ord('2'):
                self.process_scale = min(1.0, self.process_scale + 0.1)
                rospy.loginfo("Scale: %.1f" % self.process_scale)
                
        except Exception as e:
            rospy.logwarn("Process error: %s" % str(e))

    def start_training(self):
        rospy.loginfo("Enter name:")
        try:
            name = input().strip()
        except:
            name = input().strip()
            
        if name:
            self.training = True
            self.training_name = name
            self.training_id = max(self.label_ids.keys()) + 1 if self.label_ids else 0
            self.training_count = 0
            self.label_ids[self.training_id] = name
            rospy.loginfo("Started training: %s (ID: %d)" % (name, self.training_id))

    def finish_training(self):
        self.save_labels()
        rospy.loginfo("Training completed: %s" % self.training_name)
        self.training = False
        self.training_name = ""

    def run(self):
        rospy.spin()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    trainer = FaceTrainer()
    trainer.run()