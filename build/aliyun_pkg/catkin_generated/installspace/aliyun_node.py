#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
阿里云ROS节点 - 接收目的地坐标并发布到ROS（JSON格式）
"""

import rospy
import time
import hashlib
import hmac
import json
import threading
import paho.mqtt.client as mqtt
from std_msgs.msg import String, Float32

class AliyunROSNode:
    def __init__(self):
        """初始化阿里云ROS节点"""
        rospy.init_node('aliyun_ros_node', anonymous=True)
        
        # 阿里云IoT配置
        self.options = {
            'productKey': 'j1nzhwCFtTs',
            'deviceName': 'find_robot',
            'deviceSecret': 'b2cabe2b59c49de7166949326ba1b791',
            'regionId': 'cn-shanghai'
        }
        
        self.HOST = 'iot-06z00h6fv9ahqgk.mqtt.iothub.aliyuncs.com'
        self.PORT = 1883
        self.PUB_TOPIC = "/j1nzhwCFtTs/find_robot/user/post"
        self.SUB_TOPIC = "/j1nzhwCFtTs/find_robot/user/get"
        
        # 数据缓存
        self.gps_data = {
            'latitude': 0.0,
            'longitude': 0.0,
            'altitude': 0.0,
            'satellites': 0,
            'speed_kph': 0.0,
            'utc_time': '',
            'timestamp': 0,
            'valid': False
        }
        
        self.voltage_data = {
            'voltage': 0.0,
            'timestamp': 0
        }
        
        self.face_data = {
            'face_count': 0,
            'recognized_faces': [],
            'timestamp': 0
        }
        
        # 目的地坐标
        self.destination_data = {
            'latitude': 0.0,
            'longitude': 0.0,
            'name': '',
            'timestamp': 0,
            'valid': False
        }
        
        self.data_lock = threading.Lock()
        self.mqtt_client = None
        self.connected = False
        
        # ROS发布器 - 只保留JSON格式发布器
        self.destination_pub = rospy.Publisher('/navigation/destination', String, queue_size=10)
        
        # ROS订阅器
        self.gps_sub = rospy.Subscriber('/gps_data', String, self.gps_callback)
        self.voltage_sub = rospy.Subscriber('/battery_voltage', Float32, self.voltage_callback)
        self.face_sub = rospy.Subscriber('/recognized_face_name', String, self.face_callback)
        
        # 初始化MQTT连接
        self.init_mqtt()
        
        # 定时发布器（每10秒发送一次）
        self.publish_timer = rospy.Timer(rospy.Duration(10.0), self.publish_data_timer)
        
        rospy.loginfo("阿里云ROS节点初始化完成")
        rospy.loginfo("设备: %s", self.options['deviceName'])
        rospy.loginfo("已创建ROS发布器: /navigation/destination")
    
    def hmacsha256(self, key, msg):
        """HMAC-SHA256加密"""
        return hmac.new(key.encode(), msg.encode(), hashlib.sha256).hexdigest()
    
    def getAliyunIoTClient(self):
        """获取阿里云IoT客户端"""
        timestamp = str(int(time.time() * 1000))
        CLIENT_ID = f"{self.options['productKey']}.{self.options['deviceName']}|securemode=2,signmethod=hmacsha256,timestamp={timestamp}|"
        CONTENT_STR_FORMAT = f"clientId{self.options['productKey']}.{self.options['deviceName']}deviceName{self.options['deviceName']}productKey{self.options['productKey']}timestamp{timestamp}"
        USER_NAME = f"{self.options['deviceName']}&{self.options['productKey']}"
        PWD = self.hmacsha256(self.options['deviceSecret'], CONTENT_STR_FORMAT)
        
        client = mqtt.Client(client_id=CLIENT_ID, clean_session=False)
        client.username_pw_set(USER_NAME, PWD)
        return client
    
    def init_mqtt(self):
        """初始化MQTT连接"""
        try:
            self.mqtt_client = self.getAliyunIoTClient()
            
            # 设置回调函数
            self.mqtt_client.on_connect = self.on_connect
            self.mqtt_client.on_message = self.on_message
            self.mqtt_client.on_publish = self.on_publish
            self.mqtt_client.on_subscribe = self.on_subscribe
            self.mqtt_client.on_disconnect = self.on_disconnect
            
            # 连接MQTT服务器
            rospy.loginfo("正在连接阿里云IoT平台: %s:%d", self.HOST, self.PORT)
            self.mqtt_client.connect(self.HOST, self.PORT, 60)
            self.mqtt_client.loop_start()
            
        except Exception as e:
            rospy.logerr("初始化MQTT连接失败: %s", str(e))
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT连接回调"""
        if rc == 0:
            self.connected = True
            rospy.loginfo("成功连接到阿里云IoT平台")
            client.subscribe(self.SUB_TOPIC, qos=1)
            rospy.loginfo("已订阅主题: %s", self.SUB_TOPIC)
        else:
            rospy.logerr("连接失败，错误码: %d", rc)
            self.connected = False
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT断开连接回调"""
        self.connected = False
        rospy.logwarn("MQTT连接断开，错误码: %d", rc)
    
    def on_message(self, client, userdata, msg):
        """接收到MQTT消息回调"""
        try:
            payload = msg.payload.decode('utf-8')
            rospy.loginfo("收到阿里云下行消息: %s", payload)
            
            # 解析JSON数据
            data = json.loads(payload)
            
            # 检查是否是目的地坐标
            if 'data' in data and 'destination' in data['data']:
                destination = data['data']['destination']
                longitude = destination.get('longitude', 0.0)
                latitude = destination.get('latitude', 0.0)
                name = destination.get('name', '目的地')
                
                rospy.loginfo("解析到目的地坐标: 经度=%.6f, 纬度=%.6f, 名称=%s", 
                             longitude, latitude, name)
                
                # 打包发布到ROS（JSON格式）
                self.publish_destination_json(longitude, latitude, name)
                
        except Exception as e:
            rospy.logerr("处理下行消息失败: %s", str(e))
    
    def publish_destination_json(self, longitude, latitude, name=""):
        """将目的地坐标打包为JSON格式发布到ROS"""
        try:
            # 构建JSON数据包
            destination_json = {
                'type': 'destination',
                'longitude': float(longitude),
                'latitude': float(latitude),
                'name': str(name),
                'timestamp': time.time(),
                'source': 'aliyun_cloud'
            }
            
            # 发布JSON字符串
            json_msg = String()
            json_msg.data = json.dumps(destination_json, ensure_ascii=False)
            self.destination_pub.publish(json_msg)
            
            rospy.loginfo("✅ 发布目的地JSON数据: %s", json_msg.data)
            
            # 保存到本地变量
            with self.data_lock:
                self.destination_data['longitude'] = longitude
                self.destination_data['latitude'] = latitude
                self.destination_data['name'] = name
                self.destination_data['timestamp'] = time.time()
                self.destination_data['valid'] = True
            
        except Exception as e:
            rospy.logerr("发布目的地JSON数据失败: %s", str(e))
    
    def on_publish(self, client, userdata, mid):
        """发布消息回调"""
        rospy.logdebug("消息发布成功, MID: %d", mid)
    
    def on_subscribe(self, client, userdata, mid, granted_qos):
        """订阅回调"""
        rospy.logdebug("订阅成功, MID: %d, QOS: %s", mid, granted_qos)
    
    def gps_callback(self, msg):
        """GPS数据回调"""
        try:
            data_str = msg.data
            rospy.logdebug("收到GPS数据: %s", data_str)
            
            if data_str.startswith('GPS:'):
                parts = data_str[4:].split(',')
                
                with self.data_lock:
                    # 重置数据
                    self.gps_data = {
                        'latitude': 0.0,
                        'longitude': 0.0,
                        'altitude': 0.0,
                        'satellites': 0,
                        'speed_kph': 0.0,
                        'utc_time': '',
                        'timestamp': time.time(),
                        'valid': False
                    }
                    
                    if len(parts) >= 10:
                        try:
                            # UTC时间
                            if parts[0]:
                                self.gps_data['utc_time'] = parts[0]
                            
                            # 纬度
                            if parts[1]:
                                try:
                                    self.gps_data['latitude'] = float(parts[1])
                                except:
                                    pass
                            
                            # 经度
                            if len(parts) > 3 and parts[3]:
                                try:
                                    self.gps_data['longitude'] = float(parts[3])
                                except:
                                    pass
                            
                            # 卫星数量
                            if len(parts) > 5 and parts[5]:
                                try:
                                    self.gps_data['satellites'] = int(parts[5])
                                except:
                                    self.gps_data['satellites'] = 0
                            
                            # 海拔高度
                            if len(parts) > 6 and parts[6]:
                                try:
                                    self.gps_data['altitude'] = float(parts[6])
                                except:
                                    self.gps_data['altitude'] = 0.0
                            
                            # 速度
                            if len(parts) > 9 and parts[9]:
                                try:
                                    self.gps_data['speed_kph'] = float(parts[9])
                                except:
                                    self.gps_data['speed_kph'] = 0.0
                            
                            # 有效性检查
                            self.gps_data['valid'] = (self.gps_data['satellites'] > 0)
                            
                            if self.gps_data['valid']:
                                rospy.logdebug("GPS数据: 纬度=%.6f, 经度=%.6f, 卫星=%d, 速度=%.1fkm/h",
                                              self.gps_data['latitude'], self.gps_data['longitude'],
                                              self.gps_data['satellites'], self.gps_data['speed_kph'])
                            
                        except Exception as e:
                            rospy.logwarn("GPS数据解析异常: %s", str(e))
                    
        except Exception as e:
            rospy.logwarn("GPS回调处理失败: %s", str(e))
    
    def voltage_callback(self, msg):
        """电压数据回调"""
        try:
            voltage_value = msg.data
            
            with self.data_lock:
                self.voltage_data['voltage'] = voltage_value
                self.voltage_data['timestamp'] = time.time()
            
            rospy.logdebug("电压数据: %.2fV", voltage_value)
            
        except Exception as e:
            rospy.logwarn("处理电压数据失败: %s", str(e))
    
    def face_callback(self, msg):
        """面部识别结果回调"""
        try:
            data_str = msg.data
            rospy.logdebug("收到面部识别数据: %s", data_str)
            
            with self.data_lock:
                # 重置数据
                self.face_data = {
                    'face_count': 0,
                    'recognized_faces': [],
                    'timestamp': time.time()
                }
                
                # 处理格式: "Alice:0.85:15"
                if ':' in data_str and '|' not in data_str:
                    parts = data_str.split(':')
                    if len(parts) >= 1 and parts[0]:
                        face_name = parts[0]
                        if face_name != "Unknown":
                            self.face_data['recognized_faces'].append(face_name)
                            self.face_data['face_count'] = 1
                
                if self.face_data['face_count'] > 0:
                    rospy.loginfo("识别到人脸: %s", self.face_data['recognized_faces'])
                    
        except Exception as e:
            rospy.logwarn("解析面部识别数据失败: %s", str(e))
    
    def publish_data_timer(self, event):
        """定时发布数据到阿里云"""
        if not self.connected:
            rospy.logwarn("MQTT未连接，跳过数据发布")
            return
        
        try:
            with self.data_lock:
                # 准备数据 - 匹配Java应用的格式
                current_time = int(time.time() * 1000)
                
                # 构建数据包 - 按照Java应用期望的格式
                data_payload = {}
                
                # 添加GPS数据
                if self.gps_data['valid']:
                    data_payload['gps'] = {
                        'satellites': self.gps_data['satellites'],
                        'altitude': self.gps_data['altitude'],
                        'speed_kph': self.gps_data['speed_kph'],
                        'utc_time': self.gps_data['utc_time'],
                        'latitude': self.gps_data['latitude'],
                        'longitude': self.gps_data['longitude']
                    }
                
                # 添加电压数据
                if self.voltage_data['voltage'] > 0:
                    data_payload['battery'] = {
                        'voltage': round(self.voltage_data['voltage'], 2),
                        'status': 'normal' if self.voltage_data['voltage'] > 11.0 else 'low'
                    }
                
                # 添加面部识别数据
                if self.face_data['face_count'] > 0:
                    data_payload['face'] = {
                        'face_count': self.face_data['face_count'],
                        'recognized_faces': self.face_data['recognized_faces']
                    }
                
                # 如果没有有效数据，跳过
                if not data_payload:
                    rospy.logdebug("没有有效数据，跳过发布")
                    return
                
                # 完整的数据包 - 匹配Java应用的格式
                payload_json = {
                    'data': data_payload,  # 你的Java应用期望这个字段
                    'id': current_time,    # 消息ID
                    'device': 'find_robot', # 设备名称
                    'timestamp': int(time.time())  # 时间戳
                }
            
            # 发布到阿里云
            json_str = json.dumps(payload_json, ensure_ascii=False)
            self.mqtt_client.publish(self.PUB_TOPIC, payload=json_str, qos=1)
            
            # 输出日志
            gps_info = ""
            if self.gps_data['valid']:
                gps_info = f"GPS({self.gps_data['satellites']}卫星, {self.gps_data['speed_kph']:.1f}km/h)"
            
            voltage_info = f"电压: {self.voltage_data['voltage']:.2f}V" if self.voltage_data['voltage'] > 0 else ""
            face_info = f"人脸: {self.face_data['face_count']}" if self.face_data['face_count'] > 0 else ""
            
            rospy.loginfo("✅ 数据已发送到阿里云: %s %s %s", 
                         gps_info, voltage_info, face_info)
            rospy.logdebug("发送的数据: %s", json_str)
            
        except Exception as e:
            rospy.logerr("发布数据到阿里云失败: %s", str(e))
    
    def run(self):
        """运行节点"""
        rospy.loginfo("阿里云节点开始运行...")
        rospy.spin()
        
        # 清理资源
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            rospy.loginfo("已断开阿里云连接")

if __name__ == '__main__':
    try:
        node = AliyunROSNode()
        node.run()
    except rospy.ROSInterruptException:
        rospy.loginfo("节点被中断")
    except Exception as e:
        rospy.logerr("节点运行错误: %s", str(e))