#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import serial
import time
import rospy
import threading
import struct
from geometry_msgs.msg import Twist
from sensor_msgs.msg import Imu
from std_msgs.msg import Float32, Header

class JetBotSerialControl:
    def __init__(self, port='/dev/ttyACM0', baudrate=115200):
        rospy.init_node('jetbot_serial_control', anonymous=True)
        
        # 串口初始化
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
        
        # 订阅控制指令
        self.cmd_vel_sub = rospy.Subscriber('/cmd_vel', Twist, self.cmd_vel_callback)
        
        # 发布传感器数据
        self.cmd_vel_pub = rospy.Publisher('/sensor/cmd_vel', Twist, queue_size=10)
        self.imu_pub = rospy.Publisher('/imu/data', Imu, queue_size=10)
        self.voltage_pub = rospy.Publisher('/battery_voltage', Float32, queue_size=10)
        
        # 控制状态
        self.current_cmd = Twist()
        self.cmd_lock = threading.Lock()
        self.last_cmd_time = time.time()
        
        # 串口数据解析
        self.rx_buffer = bytearray()
        self.FRAME_HEADER = 0x7B
        self.FRAME_TAIL = 0x7D
        self.FRAME_SIZE = 24
        
        # 控制参数
        self.control_rate = 20  # Hz
        self.timeout = 0.5  # 控制指令超时时间
        
        # 等待小车初始化（根据STM32代码需要10秒）
        rospy.loginfo("等待小车初始化完成（10秒）...")
        rospy.sleep(11)
        rospy.loginfo("小车初始化完成，开始控制")
    
    def float_to_int16(self, value):
        """浮点数转换为有符号16位整数（放大1000倍）"""
        int_val = int(value * 1000)
        # 限制在16位有符号范围
        if int_val > 32767:
            int_val = 32767
        elif int_val < -32768:
            int_val = -32768
        return int_val
    
    def int16_to_bytes(self, value):
        """有符号16位整数转换为2字节（考虑负数）"""
        if value < 0:
            value = 65536 + value  # 转换为无符号表示
        return [(value >> 8) & 0xFF, value & 0xFF]
    
    def cmd_vel_callback(self, msg):
        """接收控制指令回调"""
        with self.cmd_lock:
            self.current_cmd = msg
            self.last_cmd_time = time.time()
            
        # 立即发送控制指令（测试用）
        # self.send_control_command(msg.linear.x, msg.angular.z)
        rospy.loginfo("收到控制: linear.x=%.3f, angular.z=%.3f", 
                     msg.linear.x, msg.angular.z)
    
    def send_control_command(self, linear_x, angular_z):
        """发送控制指令到STM32"""
        try:
            # 转换为整型（放大1000倍）
            x_val = self.float_to_int16(linear_x)
            y_val = self.float_to_int16(0.0)  # Y轴设为0
            z_val = self.float_to_int16(angular_z)
            
            # 转换为字节
            x_bytes = self.int16_to_bytes(x_val)
            y_bytes = self.int16_to_bytes(y_val)
            z_bytes = self.int16_to_bytes(z_val)
            
            # 构建数据帧（11字节）
            frame = bytearray()
            
            # 帧头
            frame.append(0x7B)  # FRAME_HEADER
            
            # 保留字节
            frame.append(0x00)
            frame.append(0x00)
            
            # X轴速度
            frame.append(x_bytes[0])
            frame.append(x_bytes[1])
            
            # Y轴速度
            frame.append(y_bytes[0])
            frame.append(y_bytes[1])
            
            # Z轴速度
            frame.append(z_bytes[0])
            frame.append(z_bytes[1])
            
            # 校验和（前9字节异或）
            checksum = 0
            for i in range(9):
                checksum ^= frame[i]
            frame.append(checksum)
            
            # 帧尾
            frame.append(0x7D)  # FRAME_TAIL
            
            # 验证帧长度
            if len(frame) != 11:
                rospy.logwarn("帧长度错误: %d", len(frame))
                return
            
            # 发送数据
            if self.ser and self.ser.is_open:
                self.ser.write(frame)
                rospy.loginfo("发送控制帧: X=%d, Z=%d", x_val, z_val)
                
                # 调试输出
                hex_str = ' '.join([f'{b:02X}' for b in frame])
                rospy.logdebug("十六进制: %s", hex_str)
                
        except Exception as e:
            rospy.logerr("发送控制命令失败: %s", e)
    
    def parse_sensor_frame(self, data):
        """解析传感器数据帧（24字节）"""
        if len(data) != self.FRAME_SIZE:
            return None
        
        # 检查帧头和帧尾
        if data[0] != self.FRAME_HEADER or data[23] != self.FRAME_TAIL:
            return None
        
        try:
            # 解析数据
            parsed = {}
            
            # 标志位
            parsed['flag'] = data[1]
            
            # 速度（有符号16位，放大1000倍）
            parsed['vx'] = struct.unpack('>h', data[2:4])[0] / 1000.0
            parsed['vy'] = struct.unpack('>h', data[4:6])[0] / 1000.0
            parsed['vz'] = struct.unpack('>h', data[6:8])[0] / 1000.0
            
            # 加速度（有符号16位，放大1000倍）
            parsed['ax'] = struct.unpack('>h', data[8:10])[0] / 1000.0
            parsed['ay'] = struct.unpack('>h', data[10:12])[0] / 1000.0
            parsed['az'] = struct.unpack('>h', data[12:14])[0] / 1000.0
            
            # 角速度（有符号16位，放大1000倍）
            parsed['gx'] = struct.unpack('>h', data[14:16])[0] / 1000.0
            parsed['gy'] = struct.unpack('>h', data[16:18])[0] / 1000.0
            parsed['gz'] = struct.unpack('>h', data[18:20])[0] / 1000.0
            
            # 电压（无符号16位，放大1000倍）
            parsed['voltage'] = struct.unpack('>H', data[20:22])[0] / 1000.0
            
            # 校验和
            parsed['checksum'] = data[22]
            
            return parsed
            
        except Exception as e:
            rospy.logerr("解析传感器数据失败: %s", e)
            return None
    
    def publish_sensor_data(self, data):
        """发布传感器数据到ROS"""
        try:
            # 发布速度
            twist = Twist()
            twist.linear.x = data['vx']
            twist.linear.y = data['vy']
            twist.angular.z = data['vz']
            self.cmd_vel_pub.publish(twist)
            
            # 发布IMU
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
            
            # 发布电压
            voltage = Float32()
            voltage.data = data['voltage']
            self.voltage_pub.publish(voltage)
            
            # 定期输出日志
            rospy.loginfo_throttle(2.0, "传感器: V=%.2fm/s, 电压=%.2fV", 
                                  data['vx'], data['voltage'])
            
        except Exception as e:
            rospy.logerr("发布传感器数据失败: %s", e)
    
    def control_loop(self):
        """控制循环 - 发送控制指令"""
        rate = rospy.Rate(self.control_rate)
        
        while not rospy.is_shutdown():
            try:
                current_time = time.time()
                
                with self.cmd_lock:
                    # 检查是否超时
                    if current_time - self.last_cmd_time > self.timeout:
                        # 超时，发送停止命令
                        rospy.logdebug("控制超时，发送停止命令")
                        self.send_control_command(0, 0)
                    else:
                        # 发送当前控制指令
                        self.send_control_command(self.current_cmd.linear.x, 
                                                 self.current_cmd.angular.z)
                
                rate.sleep()
                
            except Exception as e:
                rospy.logerr("控制循环错误: %s", e)
                rate.sleep()
    
    def receive_loop(self):
        """接收循环 - 读取传感器数据"""
        while not rospy.is_shutdown():
            try:
                if self.ser and self.ser.is_open:
                    # 读取串口数据
                    data = self.ser.read(self.ser.in_waiting or 1)
                    if data:
                        self.rx_buffer.extend(data)
                        
                        # 查找完整帧
                        while len(self.rx_buffer) >= self.FRAME_SIZE:
                            # 查找帧头
                            if self.rx_buffer[0] != self.FRAME_HEADER:
                                self.rx_buffer.pop(0)
                                continue
                            
                            # 检查是否有完整帧
                            if len(self.rx_buffer) < self.FRAME_SIZE:
                                break
                            
                            # 提取一帧
                            frame = self.rx_buffer[:self.FRAME_SIZE]
                            
                            # 解析数据
                            sensor_data = self.parse_sensor_frame(frame)
                            if sensor_data:
                                self.publish_sensor_data(sensor_data)
                            
                            # 移除已处理的数据
                            self.rx_buffer = self.rx_buffer[self.FRAME_SIZE:]
                else:
                    rospy.sleep(0.1)
                    
            except Exception as e:
                rospy.logerr("接收循环错误: %s", e)
                rospy.sleep(0.1)
    
    def test_control(self):
        """测试控制功能"""
        rospy.loginfo("开始控制测试...")
        
        # 测试前进
        rospy.loginfo("测试前进0.2m/s...")
        self.send_control_command(0.2, 0.0)
        rospy.sleep(2.0)
        
        # 测试停止
        rospy.loginfo("测试停止...")
        self.send_control_command(0.0, 0.0)
        rospy.sleep(1.0)
        
        # 测试左转
        rospy.loginfo("测试左转0.5rad/s...")
        self.send_control_command(0.0, 0.5)
        rospy.sleep(2.0)
        
        # 测试停止
        rospy.loginfo("测试停止...")
        self.send_control_command(0.0, 0.0)
        
        rospy.loginfo("控制测试完成")
    
    def run(self):
        """运行主循环"""
        # 启动控制线程
        control_thread = threading.Thread(target=self.control_loop)
        control_thread.daemon = True
        control_thread.start()
        
        # 启动接收线程
        receive_thread = threading.Thread(target=self.receive_loop)
        receive_thread.daemon = True
        receive_thread.start()
        
        # 先运行测试
        self.test_control()
        
        rospy.loginfo("节点运行中...")
        rospy.spin()
    
    def shutdown(self):
        """关闭节点"""
        rospy.loginfo("关闭节点...")
        
        # 发送停止命令
        try:
            self.send_control_command(0, 0)
        except:
            pass
        
        # 关闭串口
        if self.ser and self.ser.is_open:
            self.ser.close()
            rospy.loginfo("串口已关闭")

if __name__ == "__main__":
    node = None
    try:
        # 设置串口权限
        import os
        os.system("sudo chmod 666 /dev/ttyACM0 2>/dev/null")
        
        # 创建节点
        node = JetBotSerialControl('/dev/ttyACM0', 115200)
        
        # 运行节点
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