#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
N10激光雷达节点 - 简化版（不使用tf）
"""
import serial
import time
import rospy
import math
from sensor_msgs.msg import LaserScan

class N10LidarReader:
    def __init__(self):
        # 初始化ROS节点
        rospy.init_node('n10_lidar_node', anonymous=True)
        
        # 创建激光数据发布者
        self.laser_pub = rospy.Publisher('/scan', LaserScan, queue_size=10)
        
        # 获取参数
        self.port = rospy.get_param('~port', '/dev/ttyTHS1')
        self.baudrate = rospy.get_param('~baudrate', 230400)
        self.frame_id = rospy.get_param('~frame_id', 'laser_frame')
        
        # 雷达参数
        self.range_min = rospy.get_param('~range_min', 0.05)  # 5cm
        self.range_max = rospy.get_param('~range_max', 5.0)   # 5m
        
        # 数据缓存
        self.scan_data = [float('inf')] * 360  # 360度数据缓存
        self.scan_count = 0
        
        # 串口连接
        self.connect_serial()
        
        rospy.loginfo("N10激光雷达节点启动完成")
    
    def connect_serial(self):
        """连接串口"""
        try:
            self.ser = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1
            )
            rospy.loginfo("成功连接到激光雷达: %s", self.port)
        except Exception as e:
            rospy.logerr("串口连接失败: %s", e)
            rospy.signal_shutdown("串口连接失败")
    
    def parse_n10_data(self, data):
        """解析N10雷达数据包"""
        try:
            if len(data) < 55:
                return None
                
            # 检查数据包头
            if data[0] != 0xA5 or data[1] != 0x5A or data[2] != 0x3A:
                return None
            
            # 解析数据
            speed = (data[3] << 8) | data[4]
            start_angle = ((data[5] << 8) | data[6]) / 100.0
            
            distances = []
            intensities = []
            
            for i in range(16):
                idx = 7 + i * 3
                distance = (data[idx] << 8) | data[idx + 1]
                intensity = data[idx + 2]
                distances.append(distance)
                intensities.append(intensity)
            
            end_angle = ((data[52] << 8) | data[53]) / 100.0
            
            return speed, start_angle, distances, intensities, end_angle
            
        except Exception as e:
            return None
    
    def update_scan_data(self, start_angle, distances, end_angle):
        """更新扫描数据"""
        try:
            if end_angle < start_angle:
                end_angle += 360.0
            
            angle_range = end_angle - start_angle
            angle_increment = angle_range / len(distances)
            
            for i, distance in enumerate(distances):
                angle = start_angle + i * angle_increment
                angle = angle % 360
                
                idx = int(angle)
                if 0 <= idx < 360:
                    # 转换为米，过滤无效数据
                    if 50 <= distance <= 5000:
                        self.scan_data[idx] = distance / 1000.0  # mm转m
                    else:
                        self.scan_data[idx] = float('inf')
                        
        except Exception as e:
            rospy.logdebug("更新扫描数据错误: %s", e)
    
    def publish_laser_scan(self):
        """发布激光扫描数据"""
        try:
            scan_msg = LaserScan()
            scan_msg.header.stamp = rospy.Time.now()
            scan_msg.header.frame_id = self.frame_id
            
            # 设置扫描参数
            scan_msg.angle_min = 0.0
            scan_msg.angle_max = 2 * math.pi
            scan_msg.angle_increment = 2 * math.pi / 360
            scan_msg.time_increment = 0.0
            scan_msg.scan_time = 0.1
            scan_msg.range_min = self.range_min
            scan_msg.range_max = self.range_max
            
            # 复制数据
            scan_msg.ranges = self.scan_data[:]
            
            # 添加强度数据（可选）
            scan_msg.intensities = []
            
            self.laser_pub.publish(scan_msg)
            
            # 定期输出日志
            valid_points = sum(1 for r in self.scan_data 
                             if self.range_min <= r <= self.range_max)
            self.scan_count += 1
            
            if self.scan_count % 20 == 0:
                rospy.loginfo("发布激光数据: %d个有效点", valid_points)
                
        except Exception as e:
            rospy.logwarn("发布激光数据错误: %s", e)
    
    def run(self):
        """主循环"""
        rospy.loginfo("开始读取激光雷达数据...")
        
        last_publish_time = rospy.Time.now()
        
        while not rospy.is_shutdown():
            try:
                # 查找数据包头
                data = self.ser.read(1)
                if data and data[0] == 0xA5:
                    data = self.ser.read(1)
                    if data and data[0] == 0x5A:
                        data = self.ser.read(1)
                        if data and data[0] == 0x3A:
                            # 读取剩余数据
                            data = self.ser.read(52)
                            if len(data) == 52:
                                # 组成完整数据包
                                full_data = bytearray([0xA5, 0x5A, 0x3A]) + data
                                
                                # 解析数据
                                result = self.parse_n10_data(full_data)
                                if result:
                                    speed, start_angle, distances, intensities, end_angle = result
                                    
                                    # 更新扫描数据
                                    self.update_scan_data(start_angle, distances, end_angle)
                                    
                                    # 定期发布数据
                                    current_time = rospy.Time.now()
                                    if (current_time - last_publish_time).to_sec() > 0.1:
                                        self.publish_laser_scan()
                                        last_publish_time = current_time
                
                # 控制循环频率
                time.sleep(0.001)
                
            except serial.SerialException as e:
                rospy.logerr("串口错误: %s", e)
                time.sleep(1)
            except Exception as e:
                rospy.logerr("运行错误: %s", e)
                time.sleep(0.1)

if __name__ == '__main__':
    try:
        lidar = N10LidarReader()
        lidar.run()
    except rospy.ROSInterruptException:
        rospy.loginfo("雷达节点已停止")
    except Exception as e:
        rospy.logerr("雷达节点错误: %s", e)