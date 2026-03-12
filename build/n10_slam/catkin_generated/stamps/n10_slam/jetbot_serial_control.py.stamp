#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STM32串口通信节点
"""
import serial
import time
import rospy
import threading
import struct
from geometry_msgs.msg import Twist
from sensor_msgs.msg import Imu
from std_msgs.msg import Float32, Header

class JetBotSerialControl:
    def __init__(self):
        rospy.init_node('jetbot_serial_control', anonymous=True)
        
        port = rospy.get_param('~port', '/dev/ttyACM0')
        baudrate = rospy.get_param('~baudrate', 115200)
        
        self.ser = None
        try:
            self.ser = serial.Serial(
                port=port,
                baudrate=baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=0.1
            )
            rospy.loginfo("串口打开成功: %s", port)
        except Exception as e:
            rospy.logerr("串口打开失败: %s", e)
            rospy.signal_shutdown("串口连接失败")
            return
        
        self.cmd_vel_sub = rospy.Subscriber('/cmd_vel', Twist, self.cmd_vel_callback)
        self.cmd_vel_pub = rospy.Publisher('/sensor/cmd_vel', Twist, queue_size=10)
        self.imu_pub = rospy.Publisher('/imu/data', Imu, queue_size=10)
        self.voltage_pub = rospy.Publisher('/battery_voltage', Float32, queue_size=10)
        
        self.current_cmd = Twist()
        self.cmd_lock = threading.Lock()
        self.last_cmd_time = time.time()
        
        self.rx_buffer = bytearray()
        self.FRAME_HEADER = 0x7B
        self.FRAME_TAIL = 0x7D
        self.FRAME_SIZE = 24
        
        self.control_rate = 20
        self.timeout = 0.5
        
        rospy.loginfo("等待小车初始化完成...")
        rospy.sleep(3)
        rospy.loginfo("小车初始化完成")
    
    def float_to_int16(self, value):
        int_val = int(value * 1000)
        if int_val > 32767:
            int_val = 32767
        elif int_val < -32768:
            int_val = -32768
        return int_val
    
    def int16_to_bytes(self, value):
        if value < 0:
            value = 65536 + value
        return [(value >> 8) & 0xFF, value & 0xFF]
    
    def cmd_vel_callback(self, msg):
        with self.cmd_lock:
            self.current_cmd = msg
            self.last_cmd_time = time.time()
        rospy.logdebug("收到控制: linear.x=%.3f, angular.z=%.3f", 
                      msg.linear.x, msg.angular.z)
    
    def send_control_command(self, linear_x, angular_z):
        try:
            x_val = self.float_to_int16(-linear_x)
            y_val = self.float_to_int16(0.0)
            z_val = self.float_to_int16(-angular_z)
            
            x_bytes = self.int16_to_bytes(x_val)
            y_bytes = self.int16_to_bytes(y_val)
            z_bytes = self.int16_to_bytes(z_val)
            
            frame = bytearray()
            frame.append(0x7B)
            frame.append(0x00)
            frame.append(0x00)
            frame.append(x_bytes[0])
            frame.append(x_bytes[1])
            frame.append(y_bytes[0])
            frame.append(y_bytes[1])
            frame.append(z_bytes[0])
            frame.append(z_bytes[1])
            
            checksum = 0
            for i in range(9):
                checksum ^= frame[i]
            frame.append(checksum)
            frame.append(0x7D)
            
            if self.ser and self.ser.is_open:
                self.ser.write(frame)
        except Exception as e:
            rospy.logerr("发送控制命令失败: %s", e)
    
    def parse_sensor_frame(self, data):
        if len(data) != self.FRAME_SIZE:
            return None
        if data[0] != self.FRAME_HEADER or data[23] != self.FRAME_TAIL:
            return None
        
        try:
            parsed = {}
            parsed['flag'] = data[1]
            parsed['vx'] = struct.unpack('>h', data[2:4])[0] / 1000.0
            parsed['vy'] = struct.unpack('>h', data[4:6])[0] / 1000.0
            parsed['vz'] = struct.unpack('>h', data[6:8])[0] / 1000.0
            parsed['ax'] = struct.unpack('>h', data[8:10])[0] / 1000.0
            parsed['ay'] = struct.unpack('>h', data[10:12])[0] / 1000.0
            parsed['az'] = struct.unpack('>h', data[12:14])[0] / 1000.0
            parsed['gx'] = struct.unpack('>h', data[14:16])[0] / 1000.0
            parsed['gy'] = struct.unpack('>h', data[16:18])[0] / 1000.0
            parsed['gz'] = struct.unpack('>h', data[18:20])[0] / 1000.0
            parsed['voltage'] = struct.unpack('>H', data[20:22])[0] / 1000.0
            parsed['checksum'] = data[22]
            return parsed
        except Exception as e:
            rospy.logerr("解析传感器数据失败: %s", e)
            return None
    
    def publish_sensor_data(self, data):
        try:
            twist = Twist()
            twist.linear.x = data['vx']
            twist.linear.y = data['vy']
            twist.angular.z = data['vz']
            self.cmd_vel_pub.publish(twist)
            
            imu = Imu()
            imu.header = Header()
            imu.header.stamp = rospy.Time.now()
            imu.header.frame_id = "imu_link"
            imu.linear_acceleration.x = data['ax']
            imu.linear_acceleration.y = data['ay']
            imu.linear_acceleration.z = data['az']
            imu.angular_velocity.x = data['gx']
            imu.angular_velocity.y = data['gy']
            imu.angular_velocity.z = data['gz']
            self.imu_pub.publish(imu)
            
            voltage = Float32()
            voltage.data = data['voltage']
            self.voltage_pub.publish(voltage)
            
            rospy.loginfo_throttle(2.0, "传感器: V=%.2fm/s, 电压=%.2fV", 
                                  data['vx'], data['voltage'])
        except Exception as e:
            rospy.logerr("发布传感器数据失败: %s", e)
    
    def control_loop(self):
        rate = rospy.Rate(self.control_rate)
        while not rospy.is_shutdown():
            try:
                current_time = time.time()
                with self.cmd_lock:
                    if current_time - self.last_cmd_time > self.timeout:
                        self.send_control_command(0, 0)
                    else:
                        self.send_control_command(self.current_cmd.linear.x, 
                                                 self.current_cmd.angular.z)
                rate.sleep()
            except Exception as e:
                rospy.logerr("控制循环错误: %s", e)
                rate.sleep()
    
    def receive_loop(self):
        while not rospy.is_shutdown():
            try:
                if self.ser and self.ser.is_open:
                    data = self.ser.read(self.ser.in_waiting or 1)
                    if data:
                        self.rx_buffer.extend(data)
                        
                        while len(self.rx_buffer) >= self.FRAME_SIZE:
                            if self.rx_buffer[0] != self.FRAME_HEADER:
                                self.rx_buffer.pop(0)
                                continue
                            
                            if len(self.rx_buffer) < self.FRAME_SIZE:
                                break
                            
                            frame = self.rx_buffer[:self.FRAME_SIZE]
                            sensor_data = self.parse_sensor_frame(frame)
                            if sensor_data:
                                self.publish_sensor_data(sensor_data)
                            
                            self.rx_buffer = self.rx_buffer[self.FRAME_SIZE:]
                else:
                    rospy.sleep(0.1)
            except Exception as e:
                rospy.logerr("接收循环错误: %s", e)
                rospy.sleep(0.1)
    
    def run(self):
        control_thread = threading.Thread(target=self.control_loop)
        control_thread.daemon = True
        control_thread.start()
        
        receive_thread = threading.Thread(target=self.receive_loop)
        receive_thread.daemon = True
        receive_thread.start()
        
        rospy.loginfo("串口通信节点运行中...")
        rospy.spin()
    
    def shutdown(self):
        rospy.loginfo("关闭节点...")
        try:
            self.send_control_command(0, 0)
        except:
            pass
        if self.ser and self.ser.is_open:
            self.ser.close()

if __name__ == "__main__":
    node = None
    try:
        node = JetBotSerialControl()
        node.run()
    except KeyboardInterrupt:
        rospy.loginfo("程序被用户中断")
    except rospy.ROSInterruptException:
        rospy.loginfo("ROS中断")
    except Exception as e:
        rospy.logerr("程序错误: %s", e)
    finally:
        if node:
            node.shutdown()