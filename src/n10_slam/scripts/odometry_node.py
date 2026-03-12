#!/usr/bin/env python3
import rospy
import math
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist, TransformStamped
from tf2_msgs.msg import TFMessage

class OdomNode:
    def __init__(self):
        rospy.init_node('odometry_node')
        
        self.x = 0.0
        self.y = 0.0
        self.th = 0.0
        self.vx = 0.0
        self.vth = 0.0
        self.last_time = rospy.Time.now()
        
        self.tf_pub = rospy.Publisher('/tf', TFMessage, queue_size=50)
        self.odom_pub = rospy.Publisher('/odom', Odometry, queue_size=50)
        rospy.Subscriber('/sensor/cmd_vel', Twist, self.vel_cb)
        
        rospy.loginfo("里程计启动 - 高频率发布")

    def vel_cb(self, msg):
        self.vx = -msg.linear.x
        self.vth = -msg.angular.z

    def update(self):
        now = rospy.Time.now()
        dt = (now - self.last_time).to_sec()
        if dt <= 0 or dt > 0.5:
            self.last_time = now
            return
        
        self.x += self.vx * math.cos(self.th) * dt
        self.y += self.vx * math.sin(self.th) * dt
        self.th += self.vth * dt
        
        if self.th > math.pi: self.th -= 2*math.pi
        if self.th < -math.pi: self.th += 2*math.pi
        
        self.last_time = now
        
        qz = math.sin(self.th/2)
        qw = math.cos(self.th/2)
        
        # 发布TF
        t = TransformStamped()
        t.header.stamp = now
        t.header.frame_id = 'odom'
        t.child_frame_id = 'base_link'
        t.transform.translation.x = self.x
        t.transform.translation.y = self.y
        t.transform.translation.z = 0.0
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = qz
        t.transform.rotation.w = qw
        
        tf_msg = TFMessage()
        tf_msg.transforms.append(t)
        self.tf_pub.publish(tf_msg)
        
        # 发布Odom
        odom = Odometry()
        odom.header.stamp = now
        odom.header.frame_id = 'odom'
        odom.child_frame_id = 'base_link'
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.position.z = 0.0
        odom.pose.pose.orientation.x = 0.0
        odom.pose.pose.orientation.y = 0.0
        odom.pose.pose.orientation.z = qz
        odom.pose.pose.orientation.w = qw
        odom.twist.twist.linear.x = self.vx
        odom.twist.twist.angular.z = self.vth
        self.odom_pub.publish(odom)
        
        rospy.loginfo_throttle(1, "Odom: x=%.2f y=%.2f th=%.0f vx=%.2f vth=%.2f", 
                              self.x, self.y, math.degrees(self.th), self.vx, self.vth)

    def run(self):
        # 提高到100Hz
        rate = rospy.Rate(100)
        while not rospy.is_shutdown():
            self.update()
            rate.sleep()

if __name__ == '__main__':
    try:
        OdomNode().run()
    except rospy.ROSInterruptException:
        pass
