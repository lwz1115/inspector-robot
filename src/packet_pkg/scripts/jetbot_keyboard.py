#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import rospy
import serial
import struct
import threading
from geometry_msgs.msg import Twist
from std_msgs.msg import Header
import sys
import select
import termios
import tty

class JetBotKeyboardControl:
    def __init__(self, port='/dev/ttyACM0', baudrate=115200):
        # 串口初始化
        self.ser = None
        try:
            self.ser = serial.Serial(port, baudrate, timeout=1)
            print("串口打开成功: %s" % port)
        except Exception as e:
            print("串口打开失败: %s" % e)
            sys.exit(1)
        
        # ROS初始化
        rospy.init_node('jetbot_keyboard_control')
        self.cmd_vel_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=10)
        
        # 控制参数
        self.linear_speed = 0.4  # 线速度 m/s
        self.angular_speed = 2.0  # 角速度 rad/s
        self.move_x = 0.0
        self.move_y = 0.0
        self.move_z = 0.0
        
        # 键盘设置
        self.settings = termios.tcgetattr(sys.stdin)
        
    def send_to_stm32(self, x, y, z):
        """发送控制指令到STM32"""
        try:
            # 数据包结构 (根据您的STM32代码)
            frame_header = 0x7B
            frame_tail = 0x7D
            
            # 将浮点数转换为两个字节 (放大1000倍)
            x_data = int(x * 1000)
            y_data = int(y * 1000) 
            z_data = int(z * 1000)
            
            # 构建数据包 (11字节)
            data = bytearray(11)
            data[0] = frame_header  # 帧头
            
            # 控制模式标志位
            data[1] = 0x00  # 保留
            data[2] = 0x00  # 保留
            
            # 三轴速度数据 (各2字节)
            data[3] = (x_data >> 8) & 0xFF  # X高字节
            data[4] = x_data & 0xFF         # X低字节
            data[5] = (y_data >> 8) & 0xFF  # Y高字节  
            data[6] = y_data & 0xFF         # Y低字节
            data[7] = (z_data >> 8) & 0xFF  # Z高字节
            data[8] = z_data & 0xFF         # Z低字节
            
            # 校验和
            checksum = 0
            for i in range(9):
                checksum ^= data[i]
            data[9] = checksum
            
            # 帧尾
            data[10] = frame_tail
            
            # 发送数据
            if self.ser and self.ser.is_open:
                self.ser.write(data)
                # print("发送数据: ", [hex(b) for b in data])
                
        except Exception as e:
            print("发送数据错误: %s" % e)
    
    def get_key(self):
        """获取键盘输入"""
        tty.setraw(sys.stdin.fileno())
        rlist, _, _ = select.select([sys.stdin], [], [], 0.1)
        if rlist:
            key = sys.stdin.read(1)
        else:
            key = ''
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)
        return key
    
    def print_instructions(self):
        """打印控制说明"""
        print("\n=== JetBot 键盘控制 ===")
        print("控制键:")
        print("  w: 前进")
        print("  s: 后退") 
        print("  a: 左转")
        print("  d: 右转")
        print("  q: 左平移")
        print("  e: 右平移")
        print("  x: 停止")
        print("  c: 退出程序")
        print("=====================\n")
    
    def run_keyboard_control(self):
        """键盘控制主循环"""
        self.print_instructions()
        
        while not rospy.is_shutdown():
            key = self.get_key()
            
            if key == 'w':  # 前进
                self.move_x = self.linear_speed
                self.move_y = 0.0
                self.move_z = 0.0
                print("前进")
                
            elif key == 's':  # 后退
                self.move_x = -self.linear_speed
                self.move_y = 0.0
                self.move_z = 0.0
                print("后退")
                
            elif key == 'a':  # 左转
                self.move_x = 0.0
                self.move_y = 0.0
                self.move_z = self.angular_speed
                print("左转")
                
            elif key == 'd':  # 右转
                self.move_x = 0.0
                self.move_y = 0.0
                self.move_z = -self.angular_speed
                print("右转")
                
            elif key == 'q':  # 左平移
                self.move_x = 0.0
                self.move_y = self.linear_speed
                self.move_z = 0.0
                print("左平移")
                
            elif key == 'e':  # 右平移
                self.move_x = 0.0
                self.move_y = -self.linear_speed
                self.move_z = 0.0
                print("右平移")
                
            elif key == 'x':  # 停止
                self.move_x = 0.0
                self.move_y = 0.0
                self.move_z = 0.0
                print("停止")
                
            elif key == 'c':  # 退出
                print("退出程序")
                break
            
            # 发布ROS消息
            twist_msg = Twist()
            twist_msg.linear.x = self.move_x
            twist_msg.linear.y = self.move_y
            twist_msg.angular.z = self.move_z
            self.cmd_vel_pub.publish(twist_msg)
            
            # 发送到STM32
            self.send_to_stm32(self.move_x, self.move_y, self.move_z)
            
            # 短暂延迟
            rospy.sleep(0.1)
    
    def close(self):
        """清理资源"""
        if self.ser and self.ser.is_open:
            # 发送停止指令
            self.send_to_stm32(0, 0, 0)
            self.ser.close()
            print("串口已关闭")
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, self.settings)

if __name__ == "__main__":
    try:
        # 创建控制实例
        controller = JetBotKeyboardControl('/dev/ttyACM0', 115200)
        
        # 运行键盘控制
        controller.run_keyboard_control()
        
    except Exception as e:
        print("程序错误: %s" % e)
    finally:
        if 'controller' in locals():
            controller.close()