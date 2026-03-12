#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
导航控制节点 - 修复版本（订阅路径规划）
"""
import rospy
import math
import json
from geometry_msgs.msg import Twist, PoseStamped
from nav_msgs.msg import Path
from sensor_msgs.msg import LaserScan
from std_msgs.msg import String

class NavigationController:
    def __init__(self):
        rospy.init_node('navigation_controller', anonymous=True)
        
        # 订阅GPS位置
        self.gps_sub = rospy.Subscriber('/gps_data', String, self.gps_callback)
        
        # 订阅阿里云目标
        self.destination_sub = rospy.Subscriber('/navigation/destination', String, self.destination_callback)
        
        # 订阅规划路径 ⭐ 新增
        self.path_sub = rospy.Subscriber('/planned_path', Path, self.path_callback)
        
        # 订阅雷达数据
        self.scan_sub = rospy.Subscriber('/scan', LaserScan, self.scan_callback)
        
        # 发布控制指令
        self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=10)
        
        # 当前状态
        self.current_position = None  # (longitude, latitude)
        self.target_position = None   # (longitude, latitude)
        self.current_path = None      # 规划路径
        self.path_index = 0           # 当前跟踪的路径点索引
        self.laser_data = None
        
        # 控制参数
        self.max_speed = 0.3  # m/s
        self.max_angular = 0.5  # rad/s
        self.safe_distance = 1.0  # 安全距离
        self.path_tolerance = 0.00001  # 路径点容差（约1米）
        
        rospy.loginfo("导航控制节点已启动（带路径跟踪）")
        
        # 开始控制循环
        self.control_loop()
    
    def gps_callback(self, msg):
        """处理GPS数据"""
        try:
            if msg.data.startswith('GPS:'):
                parts = msg.data[4:].split(',')
                if len(parts) >= 4:
                    lat = float(parts[1]) if parts[1] else 0.0
                    lon = float(parts[3]) if parts[3] else 0.0
                    self.current_position = (lon, lat)  # x=经度, y=纬度
                    
        except Exception as e:
            rospy.logdebug("GPS解析错误: %s", e)
    
    def destination_callback(self, msg):
        """处理目标位置"""
        try:
            data = json.loads(msg.data)
            if data.get('type') == 'destination':
                self.target_position = (data['longitude'], data['latitude'])
                rospy.loginfo("设置目标: 经度=%.6f, 纬度=%.6f", 
                             data['longitude'], data['latitude'])
                # 重置路径跟踪状态
                self.current_path = None
                self.path_index = 0
                
        except Exception as e:
            rospy.logwarn("目标解析失败: %s", e)
    
    def path_callback(self, msg):
        """处理规划路径 ⭐ 新增方法"""
        if msg.poses:
            self.current_path = msg.poses
            self.path_index = 0
            rospy.loginfo("收到规划路径，包含 %d 个路径点", len(self.current_path))
    
    def scan_callback(self, msg):
        """处理雷达数据"""
        self.laser_data = msg
    
    def follow_path(self):
        """路径跟踪控制"""
        if not self.current_position or not self.current_path or self.path_index >= len(self.current_path):
            return 0.0, 0.0
        
        # 获取当前路径点
        current_waypoint = self.current_path[self.path_index]
        target_lon = current_waypoint.pose.position.x
        target_lat = current_waypoint.pose.position.y
        
        current_lon, current_lat = self.current_position
        
        # 计算到当前路径点的距离
        distance = math.sqrt((target_lon - current_lon)**2 + (target_lat - current_lat)**2)
        
        # 如果到达当前路径点，切换到下一个
        if distance < self.path_tolerance:
            self.path_index += 1
            if self.path_index < len(self.current_path):
                next_waypoint = self.current_path[self.path_index]
                rospy.loginfo("到达路径点 %d，前进到下一个", self.path_index - 1)
            else:
                rospy.loginfo("已到达路径终点")
                return 0.0, 0.0
        
        # 计算朝向当前路径点的角度
        delta_lon = target_lon - current_lon
        delta_lat = target_lat - current_lat
        
        # 计算控制指令
        desired_angle = math.atan2(delta_lat, delta_lon)
        
        # 简单的PD控制
        linear_speed = min(self.max_speed, distance * 0.5)
        angular_speed = desired_angle * 2.0
        
        # 限幅
        linear_speed = max(-self.max_speed, min(self.max_speed, linear_speed))
        angular_speed = max(-self.max_angular, min(self.max_angular, angular_speed))
        
        return linear_speed, angular_speed
    
    def calculate_simple_control(self):
        """如果没有路径，使用简单控制"""
        if self.current_path:
            # 使用路径跟踪
            return self.follow_path()
        
        # 原来的简单控制逻辑（作为备用）
        if not self.current_position or not self.target_position:
            return 0.0, 0.0
        
        lon1, lat1 = self.current_position
        lon2, lat2 = self.target_position
        
        delta_lon = lon2 - lon1
        delta_lat = lat2 - lat1
        
        linear_speed = 0.0
        angular_speed = 0.0
        
        if abs(delta_lon) > 0.0001:
            angular_speed = -0.3 if delta_lon > 0 else 0.3
            linear_speed = 0.1
        
        elif abs(delta_lat) > 0.0001:
            linear_speed = 0.2 if delta_lat > 0 else -0.2
        
        linear_speed = max(-self.max_speed, min(self.max_speed, linear_speed))
        angular_speed = max(-self.max_angular, min(self.max_angular, angular_speed))
        
        return linear_speed, angular_speed
    
    def check_obstacle(self):
        """检查障碍物"""
        if not self.laser_data:
            return False, float('inf')
        
        ranges = self.laser_data.ranges
        if not ranges:
            return False, float('inf')
        
        num_ranges = len(ranges)
        center_index = num_ranges // 2
        check_range = num_ranges // 4
        
        start_idx = max(0, center_index - check_range // 2)
        end_idx = min(num_ranges - 1, center_index + check_range // 2)
        
        min_dist = float('inf')
        for i in range(start_idx, end_idx + 1):
            dist = ranges[i]
            if self.laser_data.range_min < dist < self.laser_data.range_max:
                if dist < min_dist:
                    min_dist = dist
        
        return min_dist < self.safe_distance, min_dist
    
    def control_loop(self):
        """主控制循环"""
        rate = rospy.Rate(5)
        
        while not rospy.is_shutdown():
            try:
                # 计算控制指令
                linear_vel, angular_vel = self.calculate_simple_control()
                
                # 检查障碍物
                obstacle_detected, obstacle_dist = self.check_obstacle()
                
                # 避障处理
                if obstacle_detected:
                    rospy.loginfo("障碍物距离: %.2f米，进行避障", obstacle_dist)
                    if obstacle_dist < 0.5:
                        linear_vel = 0.0
                        angular_vel = 0.5
                    else:
                        linear_vel *= 0.3
                        angular_vel = 0.3
                
                # 创建并发布控制指令
                cmd_vel = Twist()
                cmd_vel.linear.x = linear_vel
                cmd_vel.angular.z = angular_vel
                
                self.cmd_pub.publish(cmd_vel)
                
                # 显示当前跟踪状态
                if self.current_path:
                    status = f"跟踪路径点 {self.path_index}/{len(self.current_path)}"
                else:
                    status = "无路径，使用简单导航"
                
                rospy.loginfo("%s | 控制: 速度=%.2f m/s, 转向=%.2f rad/s", 
                             status, linear_vel, angular_vel)
                
            except Exception as e:
                rospy.logerr("控制循环错误: %s", str(e))
            
            rate.sleep()

if __name__ == '__main__':
    try:
        nav = NavigationController()
    except rospy.ROSInterruptException:
        rospy.loginfo("导航节点已停止")
    except Exception as e:
        rospy.logerr("导航节点错误: %s", e)