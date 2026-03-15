#!/usr/bin/env python
# -*- coding: utf-8 -*-
import rospy
import time
import threading
from std_msgs.msg import Header, String
from packet_pkg.msg import PacketData

class PacketNode:
    def __init__(self):
        rospy.init_node('packet_node')
        
        # 数据缓冲区
        self.face_data = {
            'name': 'Unknown',
            'confidence': 0.0,
            'detected': False,
            'timestamp': 0
        }
        
        self.gps_data = {
            'utc_time': '',
            'latitude': 0.0,
            'longitude': 0.0,
            'lat_direction': 'N',
            'lon_direction': 'E',
            'satellite_count': 0,
            'altitude': 0.0,
            'speed_kph': 0.0,
            'heading_true': 0.0,
            'heading_magnetic': 0.0,
            'valid': False,
            'timestamp': 0
        }
        
        self.frame_count = 0
        self.data_lock = threading.Lock()
        
        # 发布者
        self.packet_pub = rospy.Publisher('/packet_data', PacketData, queue_size=10)
        
        # 订阅者 - 只订阅人脸识别结果和GPS数据
        rospy.Subscriber('/recognized_face_name', String, self.face_callback)
        rospy.Subscriber('/gps_data', String, self.gps_callback)
        
        # 移除了对 /image 的订阅
        
        rospy.loginfo("Packet Node Started - Subscribing to face recognition and GPS data only")
        
    def face_callback(self, msg):
        """处理人脸识别数据"""
        try:
            if ':' in msg.data:
                parts = msg.data.split(':')
                if len(parts) >= 2:
                    name = parts[0]
                    confidence = float(parts[1])
                    
                    with self.data_lock:
                        self.face_data['name'] = name
                        self.face_data['confidence'] = confidence
                        self.face_data['detected'] = True
                        self.face_data['timestamp'] = time.time()
                        self.frame_count += 1  # 使用人脸识别次数作为帧计数
                        
                    rospy.logdebug("Face data updated: %s (%.2f)", name, confidence)
                        
        except Exception as e:
            rospy.logwarn("Failed to parse face data: %s", str(e))
    
    def gps_callback(self, msg):
        """处理GPS数据"""
        try:
            if msg.data.startswith('GPS:'):
                gps_parts = msg.data[4:].split(',')  # 去掉"GPS:"前缀
                if len(gps_parts) >= 10:
                    with self.data_lock:
                        self.gps_data['utc_time'] = gps_parts[0]
                        self.gps_data['latitude'] = float(gps_parts[1])
                        self.gps_data['lat_direction'] = gps_parts[2]
                        self.gps_data['longitude'] = float(gps_parts[3])
                        self.gps_data['lon_direction'] = gps_parts[4]
                        self.gps_data['satellite_count'] = int(gps_parts[5])
                        self.gps_data['altitude'] = float(gps_parts[6])
                        self.gps_data['speed_kph'] = float(gps_parts[7])
                        self.gps_data['heading_true'] = float(gps_parts[8])
                        self.gps_data['heading_magnetic'] = float(gps_parts[9])
                        self.gps_data['valid'] = True
                        self.gps_data['timestamp'] = time.time()
                        
                    rospy.logdebug("GPS data updated: %.6f, %.6f", 
                                  float(gps_parts[1]), float(gps_parts[3]))
                        
        except Exception as e:
            rospy.logwarn("Failed to parse GPS data: %s", str(e))
    
    def create_packet(self):
        """创建数据包"""
        packet = PacketData()
        packet.header = Header()
        packet.header.stamp = rospy.Time.now()
        packet.header.frame_id = "packet_data"
        
        with self.data_lock:
            # 人脸数据
            packet.face_name = self.face_data['name']
            packet.face_confidence = self.face_data['confidence']
            packet.face_detected = self.face_data['detected']
            
            # GPS数据
            packet.utc_time = self.gps_data['utc_time']
            packet.latitude = self.gps_data['latitude']
            packet.longitude = self.gps_data['longitude']
            packet.lat_direction = self.gps_data['lat_direction']
            packet.lon_direction = self.gps_data['lon_direction']
            packet.satellite_count = self.gps_data['satellite_count']
            packet.altitude = self.gps_data['altitude']
            packet.speed_kph = self.gps_data['speed_kph']
            packet.heading_true = self.gps_data['heading_true']
            packet.heading_magnetic = self.gps_data['heading_magnetic']
            
            # 系统数据
            packet.frame_count = self.frame_count
        
        # 系统状态（简化）
        packet.cpu_usage = self.get_cpu_usage()
        packet.memory_usage = self.get_memory_usage()
        packet.checksum = self.calculate_checksum(packet)
        
        return packet
    
    def get_cpu_usage(self):
        """获取CPU使用率"""
        try:
            with open('/proc/stat', 'r') as f:
                lines = f.readlines()
            for line in lines:
                if line.startswith('cpu '):
                    parts = line.split()
                    total = sum(int(x) for x in parts[1:])
                    idle = int(parts[4])
                    return float(total - idle) / total * 100
        except:
            pass
        return 25.0  # 默认值
    
    def get_memory_usage(self):
        """获取内存使用率"""
        try:
            with open('/proc/meminfo', 'r') as f:
                lines = f.readlines()
            mem_total = 0
            mem_available = 0
            for line in lines:
                if line.startswith('MemTotal:'):
                    mem_total = int(line.split()[1])
                elif line.startswith('MemAvailable:'):
                    mem_available = int(line.split()[1])
            if mem_total > 0:
                return (1 - float(mem_available) / mem_total) * 100
        except:
            pass
        return 45.0  # 默认值
    
    def calculate_checksum(self, packet):
        """计算校验和"""
        data_str = "{}{:.2f}{:.6f}{:.6f}{}".format(
            packet.face_name,
            packet.face_confidence,
            packet.latitude,
            packet.longitude,
            packet.frame_count
        )
        checksum = 0
        for char in data_str:
            checksum = (checksum + ord(char)) % 256
        return checksum
    
    def run(self):
        """运行节点"""
        rate = rospy.Rate(5)  # 降低到5Hz，减少资源占用
        
        last_log_time = time.time()
        
        while not rospy.is_shutdown():
            try:
                packet = self.create_packet()
                self.packet_pub.publish(packet)
                
                # 每5秒输出一次日志，避免过于频繁
                current_time = time.time()
                if current_time - last_log_time >= 5.0:
                    rospy.loginfo("📦 Packet: %s (%.2f) | 🛰️ GPS: %.6f%s, %.6f%s | 📊 Frame: %d", 
                                 packet.face_name, packet.face_confidence,
                                 packet.latitude, packet.lat_direction,
                                 packet.longitude, packet.lon_direction,
                                 packet.frame_count)
                    last_log_time = current_time
                
                rate.sleep()
                
            except Exception as e:
                rospy.logerr("Packet publish error: %s", str(e))
                rate.sleep()

if __name__ == '__main__':
    try:
        node = PacketNode()
        node.run()
    except rospy.ROSInterruptException:
        pass