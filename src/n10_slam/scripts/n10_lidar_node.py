#!/usr/bin/env python3
import serial
import time
import rospy
import math
from sensor_msgs.msg import LaserScan

class N10Lidar:
    def __init__(self):
        rospy.init_node('n10_lidar_node')
        
        self.pub = rospy.Publisher('/scan', LaserScan, queue_size=10)
        self.port = rospy.get_param('~port', '/dev/ttyTHS1')
        self.frame_id = rospy.get_param('~frame_id', 'laser_frame')
        self.angle_offset = rospy.get_param('~angle_offset', 180.0)
        
        self.scan_data = [float('inf')] * 360
        self.scan_count = [0] * 360  # 用于滤波
        
        try:
            self.ser = serial.Serial(self.port, 230400, timeout=1)
            rospy.loginfo("激光雷达连接成功")
        except Exception as e:
            rospy.logerr("连接失败: %s", e)
            return

    def parse_data(self, data):
        if len(data) < 55 or data[0] != 0xA5 or data[1] != 0x5A or data[2] != 0x3A:
            return None
        try:
            start_angle = ((data[5] << 8) | data[6]) / 100.0
            end_angle = ((data[52] << 8) | data[53]) / 100.0
            distances = []
            for i in range(16):
                idx = 7 + i * 3
                dist = (data[idx] << 8) | data[idx + 1]
                distances.append(dist)
            return start_angle, distances, end_angle
        except:
            return None

    def update_scan(self, start_angle, distances, end_angle):
        if end_angle < start_angle:
            end_angle += 360.0
        n = len(distances)
        if n == 0:
            return
        angle_step = (end_angle - start_angle) / n
        
        for i, dist in enumerate(distances):
            angle = (start_angle + i * angle_step + self.angle_offset) % 360
            idx = int(angle)
            if 0 <= idx < 360:
                # 严格过滤：只保留15cm-2.5m的数据
                if 150 <= dist <= 2500:
                    self.scan_data[idx] = dist / 1000.0
                    self.scan_count[idx] = 3  # 有效计数
                else:
                    # 逐渐衰减无效点
                    if self.scan_count[idx] > 0:
                        self.scan_count[idx] -= 1
                    else:
                        self.scan_data[idx] = float('inf')

    def publish_scan(self):
        msg = LaserScan()
        msg.header.stamp = rospy.Time.now()
        msg.header.frame_id = self.frame_id
        
        # 前180度
        msg.angle_min = -math.pi / 2
        msg.angle_max = math.pi / 2
        msg.angle_increment = math.pi / 180
        msg.time_increment = 0
        msg.scan_time = 0.1
        msg.range_min = 0.15
        msg.range_max = 2.5
        
        ranges = []
        for i in range(270, 360):
            r = self.scan_data[i]
            # 只输出有效数据
            if self.scan_count[i] > 0 and 0.15 <= r <= 2.5:
                ranges.append(r)
            else:
                ranges.append(float('inf'))
        for i in range(0, 90):
            r = self.scan_data[i]
            if self.scan_count[i] > 0 and 0.15 <= r <= 2.5:
                ranges.append(r)
            else:
                ranges.append(float('inf'))
        
        msg.ranges = ranges
        self.pub.publish(msg)

    def run(self):
        rospy.loginfo("开始读取数据...")
        last_pub = rospy.Time.now()
        
        while not rospy.is_shutdown():
            try:
                b = self.ser.read(1)
                if b and b[0] == 0xA5:
                    b = self.ser.read(1)
                    if b and b[0] == 0x5A:
                        b = self.ser.read(1)
                        if b and b[0] == 0x3A:
                            data = self.ser.read(52)
                            if len(data) == 52:
                                full = bytearray([0xA5, 0x5A, 0x3A]) + data
                                result = self.parse_data(full)
                                if result:
                                    self.update_scan(*result)
                                    now = rospy.Time.now()
                                    if (now - last_pub).to_sec() > 0.1:
                                        self.publish_scan()
                                        last_pub = now
                time.sleep(0.001)
            except Exception as e:
                rospy.logerr("错误: %s", e)
                time.sleep(0.1)

if __name__ == '__main__':
    try:
        N10Lidar().run()
    except rospy.ROSInterruptException:
        pass
