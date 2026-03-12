#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
路径规划节点
订阅：GPS当前位置 + 阿里云目标位置
发布：规划路径（点序列）
使用A*算法进行全局路径规划
"""

import rospy
import json
import math
from std_msgs.msg import String
from geometry_msgs.msg import PoseStamped, Point
from nav_msgs.msg import Path
import heapq
from typing import List, Tuple, Dict
import numpy as np

class Node:
    """A*算法节点"""
    def __init__(self, x, y, g=0, h=0):
        self.x = x
        self.y = y
        self.g = g  # 从起点到当前节点的代价
        self.h = h  # 到终点的启发式代价
        self.f = g + h  # 总代价
        self.parent = None
    
    def __lt__(self, other):
        return self.f < other.f
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

class PathPlanner:
    def __init__(self):
        rospy.init_node('path_planner', anonymous=True)
        
        # 订阅GPS当前位置
        self.gps_sub = rospy.Subscriber('/gps_data', String, self.gps_callback)
        
        # 订阅阿里云目标位置
        self.destination_sub = rospy.Subscriber('/navigation/destination', String, self.destination_callback)
        
        # 发布规划路径
        self.path_pub = rospy.Publisher('/planned_path', Path, queue_size=10)
        
        # 当前GPS位置
        self.current_position = None
        self.current_lat = 0.0
        self.current_lon = 0.0
        
        # 目标位置
        self.target_position = None
        self.target_lat = 0.0
        self.target_lon = 0.0
        
        # 路径规划参数
        self.grid_resolution = 10.0  # 10米网格
        self.grid_size = 100  # 100x100网格
        self.obstacle_grid = np.zeros((self.grid_size, self.grid_size), dtype=bool)
        
        # 初始化障碍物（可以根据实际地图更新）
        self.initialize_obstacles()
        
        rospy.loginfo("路径规划节点已启动")
        rospy.loginfo("等待GPS数据和目标位置...")
    
    def initialize_obstacles(self):
        """初始化障碍物网格（示例）"""
        # 示例：在地图中心添加一些障碍物
        center = self.grid_size // 2
        # 添加一个矩形障碍区域
        self.obstacle_grid[center-10:center+10, center-5:center+5] = True
    
    def gps_callback(self, msg):
        """处理GPS数据"""
        try:
            data_str = msg.data
            if data_str.startswith('GPS:'):
                parts = data_str[4:].split(',')
                if len(parts) >= 4:
                    # 解析纬度和经度
                    lat_str = parts[1]  # 纬度
                    lon_str = parts[3]  # 经度
                    
                    if lat_str and lon_str:
                        self.current_lat = float(lat_str)
                        self.current_lon = float(lon_str)
                        
                        # 转换为网格坐标
                        self.current_position = self.latlon_to_grid(self.current_lat, self.current_lon)
                        
                        rospy.loginfo_throttle(30, "GPS位置: 纬度=%.6f, 经度=%.6f", 
                                               self.current_lat, self.current_lon)
                        
                        # 如果有目标位置，进行路径规划
                        if self.target_position:
                            self.plan_path()
                    
        except Exception as e:
            rospy.logwarn("GPS数据解析失败: %s", str(e))
    
    def destination_callback(self, msg):
        """处理目标位置数据"""
        try:
            data = json.loads(msg.data)
            if data.get('type') == 'destination':
                self.target_lat = data['latitude']
                self.target_lon = data['longitude']
                target_name = data.get('name', '目的地')
                
                self.target_position = self.latlon_to_grid(self.target_lat, self.target_lon)
                
                rospy.loginfo("收到目标位置: %s (纬度=%.6f, 经度=%.6f)", 
                             target_name, self.target_lat, self.target_lon)
                
                # 如果有当前位置，进行路径规划
                if self.current_position:
                    self.plan_path()
                    
        except Exception as e:
            rospy.logwarn("目标位置解析失败: %s", str(e))
    
    def latlon_to_grid(self, lat, lon):
        """将经纬度转换为网格坐标（简化版本）"""
        # 注意：这里使用简化转换，实际应用中需要更精确的投影转换
        # 假设1度经纬度约等于111公里
        lat_km = (lat - 30.0) * 111.0  # 以30度纬度作为参考原点
        lon_km = (lon - 120.0) * 111.0 * math.cos(math.radians(lat))  # 以120度经度作为参考原点
        
        # 转换为网格坐标
        grid_x = int(lat_km * 1000 / self.grid_resolution) + self.grid_size // 2
        grid_y = int(lon_km * 1000 / self.grid_resolution) + self.grid_size // 2
        
        # 确保在网格范围内
        grid_x = max(0, min(self.grid_size - 1, grid_x))
        grid_y = max(0, min(self.grid_size - 1, grid_y))
        
        return (grid_x, grid_y)
    
    def grid_to_latlon(self, grid_x, grid_y):
        """将网格坐标转换为经纬度"""
        # 反向转换
        lat_km = (grid_x - self.grid_size // 2) * self.grid_resolution / 1000.0
        lon_km = (grid_y - self.grid_size // 2) * self.grid_resolution / 1000.0
        
        lat = 30.0 + lat_km / 111.0
        lon = 120.0 + lon_km / (111.0 * math.cos(math.radians(lat)))
        
        return (lat, lon)
    
    def heuristic(self, a, b):
        """A*启发式函数（欧几里得距离）"""
        return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    
    def get_neighbors(self, node):
        """获取相邻节点"""
        neighbors = []
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0),  # 上下左右
                     (1, 1), (1, -1), (-1, 1), (-1, -1)]  # 对角线
        
        for dx, dy in directions:
            nx, ny = node.x + dx, node.y + dy
            
            # 检查边界和障碍物
            if (0 <= nx < self.grid_size and 0 <= ny < self.grid_size and 
                not self.obstacle_grid[nx][ny]):
                
                # 对角线移动代价更高
                cost = 1.0 if abs(dx) + abs(dy) == 1 else 1.414
                neighbors.append(((nx, ny), cost))
        
        return neighbors
    
    def a_star_search(self, start, goal):
        """A*路径搜索算法"""
        if start == goal:
            return [start]
        
        open_set = []
        heapq.heappush(open_set, Node(start[0], start[1], 0, self.heuristic(start, goal)))
        
        came_from = {}
        g_score = {start: 0}
        
        closed_set = set()
        
        while open_set:
            current = heapq.heappop(open_set)
            current_pos = (current.x, current.y)
            
            if current_pos == goal:
                # 重建路径
                path = []
                while current_pos in came_from:
                    path.append(current_pos)
                    current_pos = came_from[current_pos]
                path.append(start)
                path.reverse()
                return path
            
            closed_set.add(current_pos)
            
            for neighbor, cost in self.get_neighbors(current):
                neighbor_pos = neighbor
                
                if neighbor_pos in closed_set:
                    continue
                
                tentative_g = g_score[current_pos] + cost
                
                if neighbor_pos not in g_score or tentative_g < g_score[neighbor_pos]:
                    came_from[neighbor_pos] = current_pos
                    g_score[neighbor_pos] = tentative_g
                    f_score = tentative_g + self.heuristic(neighbor_pos, goal)
                    
                    # 检查是否已在open_set中
                    in_open = False
                    for node in open_set:
                        if (node.x, node.y) == neighbor_pos:
                            in_open = True
                            if tentative_g < node.g:
                                node.g = tentative_g
                                node.f = f_score
                                heapq.heapify(open_set)
                            break
                    
                    if not in_open:
                        heapq.heappush(open_set, Node(neighbor_pos[0], neighbor_pos[1], 
                                                      tentative_g, self.heuristic(neighbor_pos, goal)))
        
        rospy.logwarn("无法找到路径从 %s 到 %s", start, goal)
        return None
    
    def plan_path(self):
        """执行路径规划"""
        if not self.current_position or not self.target_position:
            return
        
        start = self.current_position
        goal = self.target_position
        
        rospy.loginfo("开始路径规划: 从 %s 到 %s", start, goal)
        
        # 执行A*搜索
        grid_path = self.a_star_search(start, goal)
        
        if grid_path:
            rospy.loginfo("路径规划成功，路径点数: %d", len(grid_path))
            
            # 转换为ROS Path消息
            path_msg = Path()
            path_msg.header.stamp = rospy.Time.now()
            path_msg.header.frame_id = "map"
            
            for i, grid_point in enumerate(grid_path):
                # 将网格坐标转换为经纬度
                lat, lon = self.grid_to_latlon(grid_point[0], grid_point[1])
                
                # 创建路径点
                pose = PoseStamped()
                pose.header.stamp = rospy.Time.now()
                pose.header.frame_id = "map"
                pose.pose.position.x = lon  # 使用经度作为x坐标
                pose.pose.position.y = lat  # 使用纬度作为y坐标
                pose.pose.position.z = 0.0
                
                path_msg.poses.append(pose)
            
            # 发布路径
            self.path_pub.publish(path_msg)
            
            # 记录路径信息
            rospy.loginfo("已发布规划路径，包含 %d 个路径点", len(path_msg.poses))
        else:
            rospy.logwarn("路径规划失败")
    
    def run(self):
        """运行节点"""
        rospy.spin()

if __name__ == '__main__':
    try:
        planner = PathPlanner()
        planner.run()
    except rospy.ROSInterruptException:
        rospy.loginfo("路径规划节点已停止")
    except Exception as e:
        rospy.logerr("路径规划节点错误: %s", str(e))