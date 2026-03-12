#!/usr/bin/env python2
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
from std_msgs.msg import String

# 强制导入 Python2 版本的 dlib
import sys
sys.path.append('/home/jetson/.local/lib/python2.7/site-packages')

try:
    import dlib
    print("dlib imported successfully!")
except ImportError as e:
    print("dlib import failed:", e)
    sys.exit(1)

class FaceRecognizer:
    def __init__(self):
        rospy.init_node('face_recognizer')
        self.bridge = CvBridge()
        
        # 数据路径
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.data_dir = os.path.join(self.script_dir, 'face_data')
        if not os.path.exists(self.data_dir):
            rospy.logwarn("Face data directory not found! Please run face trainer first.")
            sys.exit(1)
        
        # 🚀 使用 dlib HOG 检测器
        self.detector = dlib.get_frontal_face_detector()
        rospy.loginfo("dlib HOG detector loaded")
        
        # 🎯 平衡性能与检测精度
        self.frame_skip = 5
        self.frame_count = 0
        self.process_scale = 0.8
        self.upsample_num_times = 1
        
        # 加载训练数据
        self.label_ids = {}
        self.face_data = {}
        self.load_training_data()
        
        # 识别参数
        self.confidence_threshold = 0.6
        self.recognition_history = {}
        self.history_size = 5
        
        # 🆕 连续识别参数
        self.continuous_recognition_threshold = 20  # 连续识别帧数阈值
        self.continuous_confidence_threshold = 0.6  # 置信度阈值
        self.face_recognition_records = {}  # 记录每个人脸的连续识别情况
        self.last_published_name = None     # 上次发布的人脸名称
        
        # 🆕 发布者 - 用于发布识别到的人脸名称
        self.face_name_pub = rospy.Publisher('/recognized_face_name', String, queue_size=10)
        
        # 性能监控
        self.fps = 0
        self.last_time = time.time()
        self.recognition_count = 0
        
        # 订阅
        rospy.Subscriber('/image', Image, self.process_image)
        
        rospy.loginfo("Face Recognizer Started - Loaded %d persons" % len(self.label_ids))
        rospy.loginfo("Press 'q' to quit, 'r' to reload data")

    def load_training_data(self):
        """加载训练数据和标签"""
        # 加载标签
        labels_path = os.path.join(self.data_dir, 'labels.pickle')
        if os.path.exists(labels_path):
            try:
                with open(labels_path, 'rb') as f:
                    self.label_ids = pickle.load(f)
                rospy.loginfo("Loaded %d persons: %s" % (len(self.label_ids), str(self.label_ids)))
            except Exception as e:
                rospy.logerr("Failed to load labels: %s" % str(e))
                self.label_ids = {}
        else:
            rospy.logwarn("No labels found! Please run face trainer first.")
            return
        
        # 加载人脸数据
        self.face_data = {}
        for person_id, person_name in self.label_ids.items():
            person_faces = []
            # 查找该人物的所有训练图片
            for filename in os.listdir(self.data_dir):
                if filename.startswith("%d_" % person_id) and filename.endswith('.jpg'):
                    img_path = os.path.join(self.data_dir, filename)
                    try:
                        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                        if img is not None:
                            # 提取HOG特征
                            hog_features = self.extract_hog_features(img)
                            if hog_features is not None:
                                person_faces.append(hog_features)
                    except Exception as e:
                        rospy.logwarn("Failed to load image %s: %s" % (filename, str(e)))
            
            if person_faces:
                # 确保所有特征向量长度相同
                feature_lengths = [len(f) for f in person_faces]
                if len(set(feature_lengths)) != 1:
                    rospy.logwarn("Inconsistent feature lengths for %s, using first length" % person_name)
                    target_length = feature_lengths[0]
                    for i in range(len(person_faces)):
                        if len(person_faces[i]) != target_length:
                            if len(person_faces[i]) > target_length:
                                person_faces[i] = person_faces[i][:target_length]
                            else:
                                person_faces[i] = np.pad(person_faces[i], (0, target_length - len(person_faces[i])), 'constant')
                
                self.face_data[person_id] = {
                    'name': person_name,
                    'features': person_faces,
                    'avg_features': np.mean(person_faces, axis=0)
                }
                rospy.loginfo("Loaded %d faces for %s (feature dim: %d)" % (len(person_faces), person_name, len(person_faces[0])))
        
        if not self.face_data:
            rospy.logwarn("No face data found! Please run face trainer first.")

    def extract_hog_features(self, image):
        """提取HOG特征 - 修复版本"""
        try:
            # 确保图像尺寸合适且为64x128（HOG标准尺寸）
            resized_img = cv2.resize(image, (64, 128))
            
            # 创建HOG描述符
            win_size = (64, 128)
            block_size = (16, 16)
            block_stride = (8, 8)
            cell_size = (8, 8)
            nbins = 9
            
            hog = cv2.HOGDescriptor(win_size, block_size, block_stride, cell_size, nbins)
            
            # 计算HOG特征
            features = hog.compute(resized_img)
            
            if features is not None:
                return features.flatten()
            else:
                return None
                
        except Exception as e:
            rospy.logwarn("HOG feature extraction failed: %s" % str(e))
            return None

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

    def recognize_face(self, face_roi):
        """识别人脸"""
        if not self.face_data:
            return "Unknown", 0.0
        
        try:
            # 转换为灰度图
            gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            
            # 提取HOG特征
            current_features = self.extract_hog_features(gray_face)
            if current_features is None:
                return "Unknown", 0.0
            
            best_match = "Unknown"
            best_similarity = 0.0
            
            # 与每个人物的特征进行比较
            for person_id, person_data in self.face_data.items():
                # 确保特征维度匹配
                if len(current_features) != len(person_data['avg_features']):
                    rospy.logwarn("Feature dimension mismatch: %d vs %d" % (len(current_features), len(person_data['avg_features'])))
                    continue
                
                # 计算与平均特征的余弦相似度
                similarity = self.cosine_similarity(current_features, person_data['avg_features'])
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = person_data['name']
            
            # 应用阈值
            if best_similarity > self.confidence_threshold:
                return best_match, best_similarity
            else:
                return "Unknown", best_similarity
                
        except Exception as e:
            rospy.logwarn("Face recognition error: %s" % str(e))
            return "Unknown", 0.0

    def cosine_similarity(self, vec1, vec2):
        """计算余弦相似度"""
        try:
            # 确保向量非零
            if np.all(vec1 == 0) or np.all(vec2 == 0):
                return 0.0
                
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
                
            similarity = dot_product / (norm1 * norm2)
            # 确保相似度在合理范围内
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            rospy.logwarn("Cosine similarity error: %s" % str(e))
            return 0.0

    def update_recognition_history(self, face_id, name, confidence):
        """更新识别历史"""
        if face_id not in self.recognition_history:
            self.recognition_history[face_id] = []
        
        self.recognition_history[face_id].append((name, confidence))
        
        # 保持历史记录大小
        if len(self.recognition_history[face_id]) > self.history_size:
            self.recognition_history[face_id].pop(0)
        
        # 返回历史中最常见的识别结果
        if len(self.recognition_history[face_id]) >= 3:
            names = [item[0] for item in self.recognition_history[face_id]]
            most_common = max(set(names), key=names.count)
            matching_confidences = [item[1] for item in self.recognition_history[face_id] if item[0] == most_common]
            avg_confidence = np.mean(matching_confidences) if matching_confidences else confidence
            return most_common, avg_confidence
        
        return name, confidence

    def update_continuous_recognition(self, face_id, name, confidence):
        """更新连续识别记录并检查是否满足发布条件"""
        if name == "Unknown" or confidence < self.continuous_confidence_threshold:
            # 如果不满足条件，重置该人脸的记录
            if face_id in self.face_recognition_records:
                del self.face_recognition_records[face_id]
            return False
        
        # 更新或创建该人脸的识别记录
        if face_id not in self.face_recognition_records:
            self.face_recognition_records[face_id] = {
                'name': name,
                'count': 0,
                'start_time': time.time(),
                'avg_confidence': 0.0
            }
        
        record = self.face_recognition_records[face_id]
        
        # 如果人脸名称发生变化，重置记录
        if record['name'] != name:
            self.face_recognition_records[face_id] = {
                'name': name,
                'count': 1,
                'start_time': time.time(),
                'avg_confidence': confidence
            }
            return False
        
        # 更新计数和平均置信度
        record['count'] += 1
        record['avg_confidence'] = (record['avg_confidence'] * (record['count'] - 1) + confidence) / record['count']
        
        # 检查是否满足发布条件
        if record['count'] >= self.continuous_recognition_threshold:
            # 发布人脸名称
            self.publish_face_name(name, record['avg_confidence'], record['count'])
            # 重置记录，避免重复发布
            del self.face_recognition_records[face_id]
            return True
        
        return False

    def publish_face_name(self, name, confidence, count):
        """发布识别到的人脸名称"""
        try:
            # 创建消息
            message = "{}:{:.2f}:{}".format(name, confidence, count)
            
            # 发布消息
            self.face_name_pub.publish(message)
            
            # 记录日志
            rospy.loginfo("🎯 PUBLISHED: {} (Avg: {:.1f}%, Frames: {})".format(
                name, confidence * 100, count))
            
            self.last_published_name = name
            
        except Exception as e:
            rospy.logwarn("Failed to publish face name: %s" % str(e))

    def process_image(self, msg):
        self.frame_count += 1
        if self.frame_count % self.frame_skip != 0:
            return
            
        try:
            start_time = time.time()
            
            frame = self.bridge.imgmsg_to_cv2(msg, "bgr8")
            
            # 🎯 人脸检测
            faces = self.detect_faces_dlib_balanced(frame)
            
            # 识别人脸
            recognized_faces = []
            for i, (x, y, w, h) in enumerate(faces):
                face_roi = frame[y:y+h, x:x+w]
                
                if face_roi.size > 0 and face_roi.shape[0] > 20 and face_roi.shape[1] > 20:
                    # 识别人脸
                    name, confidence = self.recognize_face(face_roi)
                    
                    # 使用历史记录平滑识别结果
                    name, confidence = self.update_recognition_history(i, name, confidence)
                    
                    # 🆕 更新连续识别记录
                    should_publish = self.update_continuous_recognition(i, name, confidence)
                    
                    recognized_faces.append((x, y, w, h, name, confidence, should_publish))
                    
                    # 记录成功的识别
                    if name != "Unknown":
                        self.recognition_count += 1
                        if self.recognition_count % 10 == 0:  # 每10次成功识别记录一次
                            rospy.loginfo("Recognized: %s (%.1f%%)" % (name, confidence * 100))
            
            # 在图像上绘制结果
            for (x, y, w, h, name, confidence, should_publish) in recognized_faces:
                # 选择颜色
                if name == "Unknown":
                    color = (0, 255, 255)  # 黄色表示未知
                else:
                    if should_publish:
                        color = (0, 0, 255)  # 红色表示已发布
                    else:
                        color = (0, 255, 0)  # 绿色表示已知但未发布
                
                # 绘制人脸框
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                
                # 绘制识别结果
                label = "%s (%.1f%%)" % (name, confidence * 100)
                if should_publish:
                    label += " PUBLISHED"
                
                cv2.putText(frame, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
                # 🆕 显示连续识别进度
                if name != "Unknown" and i in self.face_recognition_records:
                    record = self.face_recognition_records[i]
                    progress = min(record['count'] / self.continuous_recognition_threshold, 1.0)
                    progress_text = "Progress: {}/{}".format(record['count'], self.continuous_recognition_threshold)
                    cv2.putText(frame, progress_text, (x, y+h+20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
            # 🚀 性能统计
            processing_time = (time.time() - start_time) * 1000
            current_time = time.time()
            if current_time - self.last_time >= 1.0:
                self.fps = self.frame_count / (current_time - self.last_time)
                self.frame_count = 0
                self.last_time = current_time
            
            # 显示状态信息
            status_lines = [
                "Faces: %d" % len(faces),
                "Known: %d" % len([f for f in recognized_faces if f[4] != "Unknown"]),
                "FPS: %.1f" % self.fps,
                "Time: %.1fms" % processing_time,
                "Persons: %d" % len(self.face_data),
                "Continuous: %d" % len(self.face_recognition_records)
            ]
            
            for i, text in enumerate(status_lines):
                cv2.putText(frame, text, (10, 30 + i*25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 2)
            
            # 显示检测提示
            if len(faces) == 0:
                cv2.putText(frame, "No faces detected - Move closer", (frame.shape[1]//2-150, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 2)
            elif len([f for f in recognized_faces if f[4] != "Unknown"]) == 0:
                cv2.putText(frame, "No known faces - Train more faces", (frame.shape[1]//2-150, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 2)
            
            cv2.imshow('Face Recognizer', frame)
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                rospy.signal_shutdown("Quit")
            elif key == ord('r'):
                rospy.loginfo("Reloading face data...")
                self.load_training_data()
            elif key == ord('1'):
                # 调试：调整参数
                self.confidence_threshold = max(0.1, self.confidence_threshold - 0.1)
                rospy.loginfo("Confidence threshold: %.1f" % self.confidence_threshold)
            elif key == ord('2'):
                self.confidence_threshold = min(1.0, self.confidence_threshold + 0.1)
                rospy.loginfo("Confidence threshold: %.1f" % self.confidence_threshold)
            elif key == ord('3'):
                self.process_scale = max(0.3, self.process_scale - 0.1)
                rospy.loginfo("Scale: %.1f" % self.process_scale)
            elif key == ord('4'):
                self.process_scale = min(1.0, self.process_scale + 0.1)
                rospy.loginfo("Scale: %.1f" % self.process_scale)
            elif key == ord('5'):
                # 🆕 调整连续识别阈值
                self.continuous_recognition_threshold = max(5, self.continuous_recognition_threshold - 5)
                rospy.loginfo("Continuous threshold: %d frames" % self.continuous_recognition_threshold)
            elif key == ord('6'):
                self.continuous_recognition_threshold = min(100, self.continuous_recognition_threshold + 5)
                rospy.loginfo("Continuous threshold: %d frames" % self.continuous_recognition_threshold)
                
        except Exception as e:
            rospy.logwarn("Process error: %s" % str(e))

    def run(self):
        rospy.spin()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    recognizer = FaceRecognizer()
    recognizer.run()