#!/usr/bin/env python
# -*- coding: utf-8 -*-

import serial
import time
import os
import sys

class BatteryMonitor:
    def __init__(self):
        # 只使用固定的 ttyJETBOT 设备名
        self.port = '/dev/ttyJETBOT'
        self.baudrate = 115200
        self.ser = None
        self.FRAME_HEADER = 0x7B
        self.FRAME_TAIL = 0x7D
        self.FRAME_SIZE = 30
        self.low_voltage_count = 0
        self.LOW_VOLTAGE_THRESHOLD = 10.85
        self.CONSECUTIVE_LOW_COUNT = 5  # 连续5次低电压才关机
    
    def setup_serial(self):
        """设置串口连接"""
        try:
            # 检查设备是否存在
            if not os.path.exists(self.port):
                print("设备 %s 不存在" % self.port)
                return False
                
            # 设置权限
            os.system('sudo chmod 666 %s' % self.port)
            
            # 打开串口
            self.ser = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1
            )
            print("串口打开成功: %s" % self.port)
            return True
            
        except Exception as e:
            print("串口打开失败: %s" % e)
            return False
    
    def parse_voltage(self, data):
        """从数据帧中解析电池电压"""
        if len(data) != self.FRAME_SIZE:
            return None
            
        # 检查帧头和帧尾
        if data[0] != self.FRAME_HEADER or data[29] != self.FRAME_TAIL:
            return None
        
        # 校验字节验证
        checksum = 0
        for b in data[:26]:
            checksum ^= b
        if checksum != data[26]:
            return None

        # 提取电压数据 (字节20-21)
        voltage_high = data[20]
        voltage_low = data[21]
        voltage = ((voltage_high << 8) | voltage_low) / 1000.0
        
        return voltage
    
    def safe_shutdown(self):
        """安全关机流程"""
        print("电池电压过低，开始安全关机...")
        
        try:
            # 同步文件系统
            print("同步文件系统...")
            os.system('sync')
            
            # 直接关机
            print("正在关机...")
            os.system('sudo shutdown -h now')
            
        except Exception as e:
            print("关机过程中出错: %s" % e)
            os.system('sudo poweroff')
    
    def monitor_battery(self):
        """主监控循环"""
        print("开始监控电池电压...")
        buffer = bytearray()
        
        while True:
            try:
                if self.ser.in_waiting > 0:
                    data = self.ser.read(self.ser.in_waiting)
                    buffer.extend(data)
                    
                    # 处理完整数据帧
                    while len(buffer) >= self.FRAME_SIZE:
                        if buffer[0] != self.FRAME_HEADER:
                            buffer.pop(0)
                            continue
                        
                        frame = buffer[:self.FRAME_SIZE]
                        
                        voltage = self.parse_voltage(frame)
                        if voltage is not None:
                            buffer = buffer[self.FRAME_SIZE:]
                            print("当前电池电压: %.2fV" % voltage)
                            
                            # 检查电压是否过低
                            if voltage < self.LOW_VOLTAGE_THRESHOLD:
                                self.low_voltage_count += 1
                                print("低电压警告 %d/%d" % (self.low_voltage_count, self.CONSECUTIVE_LOW_COUNT))
                                
                                if self.low_voltage_count >= self.CONSECUTIVE_LOW_COUNT:
                                    self.safe_shutdown()
                                    return
                            else:
                                self.low_voltage_count = 0  # 重置计数器
                        else:
                            buffer.pop(0)  # 解析失败，丢弃1字节重新对齐
                else:
                    time.sleep(0.1)
                    
            except Exception as e:
                print("监控错误: %s" % e)
                time.sleep(1)
                
                # 尝试重新连接串口
                if not self.ser or not self.ser.is_open:
                    print("尝试重新连接串口...")
                    if self.setup_serial():
                        buffer = bytearray()

def main():
    print("=== Jetson Nano 电池监控程序 ===")
    print("程序启动中...")
    
    # 等待系统启动完成
    time.sleep(10)
    
    # 创建监控实例
    monitor = BatteryMonitor()
    
    # 尝试连接串口，最多重试10次
    max_retries = 10
    for i in range(max_retries):
        print("尝试连接串口... (%d/%d)" % (i+1, max_retries))
        if monitor.setup_serial():
            break
        time.sleep(5)
    else:
        print("无法连接串口，程序退出")
        sys.exit(1)
    
    # 开始监控
    try:
        monitor.monitor_battery()
    except KeyboardInterrupt:
        print("监控程序被用户中断")
    except Exception as e:
        print("监控程序异常: %s" % e)
    finally:
        if monitor.ser and monitor.ser.is_open:
            monitor.ser.close()
            print("串口已关闭")

if __name__ == "__main__":
    main()
