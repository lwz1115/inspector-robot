#!/usr/bin/env python
# -*- coding: utf-8 -*-
import cv2
import rospy
from sensor_msgs.msg import Image
from cv_bridge import CvBridge

class CameraNode:
    def __init__(self):
        rospy.init_node('camera_node')
        self.pub = rospy.Publisher('/image', Image, queue_size=1)
        self.bridge = CvBridge()
        
        rospy.loginfo("Starting camera...")
        
        self.cap = cv2.VideoCapture(0)
        
        if not self.cap.isOpened():
            rospy.logerr("Cannot open camera!")
            return
        
        # 设置分辨率
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        
        # 验证实际分辨率
        width = self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        
        rospy.loginfo("Camera opened - Resolution: %dx%d" % (width, height))
        
        self.rate = rospy.Rate(25)  # 15Hz
        self.frame_count = 0

    def run(self):
        while not rospy.is_shutdown():
            ret, frame = self.cap.read()
            if ret:
                self.frame_count += 1
                
                try:
                    msg = self.bridge.cv2_to_imgmsg(frame, "bgr8")
                    self.pub.publish(msg)
                    
                    if self.frame_count % 100 == 0:
                        rospy.loginfo("Published %d frames" % self.frame_count)
                        
                except Exception as e:
                    rospy.logwarn("Publish error: %s" % str(e))
            else:
                rospy.logwarn("Failed to read frame")
            
            self.rate.sleep()
        
        self.cap.release()
        rospy.loginfo("Camera node stopped after %d frames" % self.frame_count)

if __name__ == '__main__':
    try:
        node = CameraNode()
        node.run()
    except rospy.ROSInterruptException:
        pass
    except Exception as e:
        rospy.logerr("Camera node error: %s" % str(e))