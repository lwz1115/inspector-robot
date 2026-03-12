#!/usr/bin/env python2
# -*- coding: utf-8 -*-
# GPS ROS节点 - 只保留ROS发布功能

import rospy
import time
import serial
import re
import threading
from std_msgs.msg import String

# 使用你的全局变量（尽量不改动你的代码结构）
utctime = ''
lat = ''
ulat = ''
lon = ''
ulon = ''
numSv = ''
msl = ''
cogt = ''
cogm = ''
sog = ''
kph = ''
gps_t = 0

# ROS相关
gps_pub = None
data_lock = threading.Lock()

def Convert_to_degrees(in_data1, in_data2):
    """将GPS坐标转换为度格式 - 完全保持你的代码"""
    len_data1 = len(in_data1)
    str_data2 = "%05d" % int(in_data2)
    temp_data = int(in_data1)
    symbol = 1
    if temp_data < 0:
        symbol = -1
    degree = int(temp_data / 100.0)
    str_decimal = str(in_data1[len_data1-2]) + str(in_data1[len_data1-1]) + str(str_data2)
    f_degree = int(str_decimal)/60.0/100000.0
    if symbol > 0:
        result = degree + f_degree
    else:
        result = degree - f_degree
    return result

def GPS_read(ser):
    """读取GPS数据 - 完全保持你的代码逻辑，只添加数据锁"""
    global utctime, lat, ulat, lon, ulon, numSv, msl, cogt, cogm, sog, kph, gps_t
    
    if not ser.inWaiting():
        return False
        
    try:
        if ser.read(1) == b'G':
            if ser.inWaiting():
                if ser.read(1) == b'N':
                    if ser.inWaiting():
                        choice = ser.read(1)
                        if choice == b'G':
                            if ser.inWaiting():
                                if ser.read(1) == b'G':
                                    if ser.inWaiting():
                                        if ser.read(1) == b'A':
                                            # 读取GGA数据
                                            GGA = ser.read(70)
                                            GGA_g = re.findall(r"\w+(?=,)|(?<=,)\w+", str(GGA))
                                            if len(GGA_g) < 13:
                                                rospy.logdebug("GPS no fix")
                                                with data_lock:
                                                    gps_t = 0
                                                return False
                                            else:
                                                with data_lock:
                                                    utctime = GGA_g[0]
                                                    lat = "%.8f" % Convert_to_degrees(str(GGA_g[2]), str(GGA_g[3]))
                                                    ulat = GGA_g[4]
                                                    lon = "%.8f" % Convert_to_degrees(str(GGA_g[5]), str(GGA_g[6]))
                                                    ulon = GGA_g[7]
                                                    numSv = GGA_g[9]
                                                    msl = GGA_g[12]+'.'+GGA_g[13]+GGA_g[14]
                                                    gps_t = 1
                                                return True
                        elif choice == b'V':
                            if ser.inWaiting():
                                if ser.read(1) == b'T':
                                    if ser.inWaiting():
                                        if ser.read(1) == b'G':
                                            with data_lock:
                                                if gps_t == 1:
                                                    VTG = ser.read(40)
                                                    VTG_g = re.findall(r"\w+(?=,)|(?<=,)\w+", str(VTG))
                                                    cogt = VTG_g[0]+'.'+VTG_g[1]+'T'
                                                    if VTG_g[3] == 'M':
                                                        cogm = '0.00'
                                                        sog = VTG_g[4]+'.'+VTG_g[5]
                                                        kph = VTG_g[7]+'.'+VTG_g[8]
                                                    elif VTG_g[3] != 'M':
                                                        cogm = VTG_g[3]+'.'+VTG_g[4]
                                                        sog = VTG_g[6]+'.'+VTG_g[7]
                                                        kph = VTG_g[9]+'.'+VTG_g[10]
                                            return True
    except Exception as e:
        rospy.logwarn("GPS parsing error: %s", str(e))
        
    return False

def publish_gps_data():
    """发布GPS数据到ROS（在单独线程中运行）"""
    global gps_pub
    
    rate = rospy.Rate(1)  # 1Hz发布频率
    last_log_time = 0
    
    while not rospy.is_shutdown():
        try:
            with data_lock:
                current_time = time.time()
                
                # 只有在有数据时才发布
                if gps_t == 1 and numSv and int(numSv) > 0:
                    # 准备要发布的数据
                    gps_str = "GPS:{},{},{},{},{},{},{},{},{},{},{}".format(
                        utctime,
                        lat,
                        ulat,
                        lon,
                        ulon,
                        numSv,
                        msl,
                        cogt if cogt else "0.0T",
                        cogm if cogm else "0.0",
                        kph if kph else "0.0",
                        sog if sog else "0.0"
                    )
                    
                    # 发布到ROS
                    gps_pub.publish(gps_str)
                    
                    # 定期输出日志（每10秒一次）
                    if current_time - last_log_time > 10.0:
                        try:
                            satellites = int(numSv)
                            speed = float(kph) if kph else 0.0
                            rospy.loginfo("GPS: %d satellites, Speed: %.1f km/h, Alt: %s m", 
                                         satellites, speed, msl)
                            last_log_time = current_time
                        except:
                            pass
            
            rate.sleep()
            
        except Exception as e:
            rospy.logerr("GPS publish error: %s", str(e))
            rate.sleep()

def main():
    global gps_pub
    
    # 初始化ROS节点
    rospy.init_node('gps_node', anonymous=True, log_level=rospy.INFO)
    
    # 初始化发布者
    gps_pub = rospy.Publisher('/gps_data', String, queue_size=10)
    
    # 初始化串口
    try:
        ser = serial.Serial("/dev/ttyUSB0", 9600)
        if ser.isOpen():
            rospy.loginfo("GPS Serial Opened! Baudrate=9600")
        else:
            rospy.logerr("GPS Serial Open Failed!")
            return
    except Exception as e:
        rospy.logerr("Failed to open GPS serial: %s", str(e))
        return
    
    # 启动发布线程
    publish_thread = threading.Thread(target=publish_gps_data)
    publish_thread.daemon = True
    publish_thread.start()
    
    rospy.loginfo("GPS Node started. Reading data...")
    
    try:
        # 主循环 - 只读取数据，不打印
        while not rospy.is_shutdown():
            GPS_read(ser)
            time.sleep(0.01)
            
    except KeyboardInterrupt:
        rospy.loginfo("Keyboard interrupt received")
    except rospy.ROSInterruptException:
        rospy.loginfo("ROS interrupt received")
    except Exception as e:
        rospy.logerr("Unexpected error: %s", str(e))
    finally:
        # 清理
        ser.close()
        rospy.loginfo("GPS serial closed")

if __name__ == '__main__':
    main()