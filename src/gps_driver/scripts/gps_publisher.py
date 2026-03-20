#!/usr/bin/env python
# -*- coding: utf-8 -*-
# GPS ROS节点 - 带坐标系转换（WGS84 -> GCJ02）

import rospy
import time
import serial
import threading
import math
from std_msgs.msg import String

# GPS数据全局变量
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

# 转换后的坐标（GCJ-02）
lat_gcj = ''
lon_gcj = ''

# ROS相关
gps_pub = None
data_lock = threading.Lock()

# ==================== 坐标转换类 ====================
class CoordinateTransform:
    """WGS-84 到 GCJ-02 坐标转换"""
    
    PI = 3.1415926535897932384626
    A = 6378245.0  # 长半轴
    EE = 0.00669342162296594323  # 偏心率平方
    
    @classmethod
    def outOfChina(cls, lat, lon):
        """判断是否在中国境外"""
        if lon < 72.004 or lon > 137.8347:
            return True
        if lat < 0.8293 or lat > 55.8271:
            return True
        return False
    
    @classmethod
    def transformLat(cls, x, y):
        """纬度转换"""
        ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * math.sqrt(abs(x))
        ret += (20.0 * math.sin(6.0 * x * cls.PI) + 20.0 * math.sin(2.0 * x * cls.PI)) * 2.0 / 3.0
        ret += (20.0 * math.sin(y * cls.PI) + 40.0 * math.sin(y / 3.0 * cls.PI)) * 2.0 / 3.0
        ret += (160.0 * math.sin(y / 12.0 * cls.PI) + 320 * math.sin(y * cls.PI / 30.0)) * 2.0 / 3.0
        return ret
    
    @classmethod
    def transformLon(cls, x, y):
        """经度转换"""
        ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * math.sqrt(abs(x))
        ret += (20.0 * math.sin(6.0 * x * cls.PI) + 20.0 * math.sin(2.0 * x * cls.PI)) * 2.0 / 3.0
        ret += (20.0 * math.sin(x * cls.PI) + 40.0 * math.sin(x / 3.0 * cls.PI)) * 2.0 / 3.0
        ret += (150.0 * math.sin(x / 12.0 * cls.PI) + 300.0 * math.sin(x / 30.0 * cls.PI)) * 2.0 / 3.0
        return ret
    
    @classmethod
    def wgs84_to_gcj02(cls, wgs_lat, wgs_lon):
        """
        WGS-84 转 GCJ-02（火星坐标系）
        用于高德地图、腾讯地图
        
        参数:
            wgs_lat: WGS-84纬度
            wgs_lon: WGS-84经度
        返回:
            (gcj_lat, gcj_lon): GCJ-02坐标
        """
        if cls.outOfChina(wgs_lat, wgs_lon):
            # 国外不转换
            return wgs_lat, wgs_lon
        
        dLat = cls.transformLat(wgs_lon - 105.0, wgs_lat - 35.0)
        dLon = cls.transformLon(wgs_lon - 105.0, wgs_lat - 35.0)
        
        radLat = wgs_lat / 180.0 * cls.PI
        magic = math.sin(radLat)
        magic = 1 - cls.EE * magic * magic
        sqrtMagic = math.sqrt(magic)
        
        dLat = (dLat * 180.0) / ((cls.A * (1 - cls.EE)) / (magic * sqrtMagic) * cls.PI)
        dLon = (dLon * 180.0) / (cls.A / sqrtMagic * math.cos(radLat) * cls.PI)
        
        gcj_lat = wgs_lat + dLat
        gcj_lon = wgs_lon + dLon
        
        return gcj_lat, gcj_lon
    
    @classmethod
    def gcj02_to_bd09(cls, gcj_lat, gcj_lon):
        """
        GCJ-02 转 BD-09（百度坐标系）
        用于百度地图
        
        参数:
            gcj_lat: GCJ-02纬度
            gcj_lon: GCJ-02经度
        返回:
            (bd_lat, bd_lon): BD-09坐标
        """
        x = gcj_lon
        y = gcj_lat
        z = math.sqrt(x * x + y * y) + 0.00002 * math.sin(y * cls.PI)
        theta = math.atan2(y, x) + 0.000003 * math.cos(x * cls.PI)
        bd_lon = z * math.cos(theta) + 0.0065
        bd_lat = z * math.sin(theta) + 0.006
        return bd_lat, bd_lon


# ==================== GPS数据解析 ====================
def Convert_to_degrees(in_data1, in_data2):
    """
    将GPS NMEA格式坐标转换为度格式（WGS-84）
    
    NMEA格式: ddmm.mmmm (度分.分的小数)
    输出格式: dd.dddddd (度.度的小数)
    
    例如: 2429.53531 -> 24 + (29.53531/60) = 24.49225517
    """
    len_data1 = len(in_data1)
    str_data2 = "%05d" % int(in_data2)
    temp_data = int(in_data1)
    symbol = 1
    if temp_data < 0:
        symbol = -1
    
    # 提取度数部分
    degree = int(temp_data / 100.0)
    
    # 提取分数部分并转换
    str_decimal = str(in_data1[len_data1-2]) + str(in_data1[len_data1-1]) + str(str_data2)
    f_degree = int(str_decimal) / 60.0 / 100000.0
    
    if symbol > 0:
        result = degree + f_degree
    else:
        result = degree - f_degree
    return result


def GPS_read(ser):
    """读取并解析GPS NMEA数据（readline按行读取，split解析）"""
    global utctime, lat, ulat, lon, ulon, numSv, msl, cogt, cogm, sog, kph, gps_t
    global lat_gcj, lon_gcj

    if not ser.inWaiting():
        return False

    try:
        line = ser.readline().decode('ascii', errors='ignore').strip()
        if not line.startswith('$'):
            return False

        fields = line.split(',')
        # 去掉最后一个字段的校验和部分（*XX）
        if fields:
            fields[-1] = fields[-1].split('*')[0]

        sentence_type = fields[0]  # e.g. $GNGGA, $GNVTG

        if sentence_type in ('$GNGGA', '$GPGGA') and len(fields) >= 14:
            fix_type = fields[6]
            if fix_type == '0' or fix_type == '':
                rospy.logdebug("GPS no fix")
                with data_lock:
                    gps_t = 0
                return False

            with data_lock:
                utctime = fields[1]

                # 转换为WGS-84度格式
                wgs_lat = Convert_to_degrees(fields[2], fields[3])
                wgs_lon = Convert_to_degrees(fields[4], fields[5])

                # 转换为GCJ-02（高德地图坐标）
                gcj_lat, gcj_lon = CoordinateTransform.wgs84_to_gcj02(wgs_lat, wgs_lon)

                lat = "%.8f" % wgs_lat
                lon = "%.8f" % wgs_lon
                lat_gcj = "%.8f" % gcj_lat
                lon_gcj = "%.8f" % gcj_lon

                ulat = fields[3]   # N/S
                ulon = fields[5]   # E/W
                numSv = fields[7]
                msl = fields[9] + fields[10] + fields[11]  # 海拔+单位
                gps_t = 1
            return True

        elif sentence_type in ('$GNVTG', '$GPVTG') and len(fields) >= 9:
            with data_lock:
                if gps_t == 1:
                    cogt = fields[1] + 'T'
                    cogm = fields[3] if fields[3] else '0.00'
                    sog = fields[5]   # 速度（节）
                    kph = fields[7]   # 速度（km/h）
            return True

    except Exception as e:
        rospy.logwarn("GPS parsing error: %s", str(e))

    return False


def publish_gps_data():
    """发布GPS数据到ROS（使用GCJ-02坐标）"""
    global gps_pub
    
    rate = rospy.Rate(1)  # 1Hz发布频率
    last_log_time = 0
    
    while not rospy.is_shutdown():
        try:
            with data_lock:
                current_time = time.time()
                
                # 只有在有数据时才发布
                if gps_t == 1 and numSv and int(numSv) > 0:
                    # 使用GCJ-02坐标（高德地图适用）
                    # 格式: GPS:时间,纬度,N/S,经度,E/W,卫星数,海拔,航向T,航向M,速度kph,速度节
                    gps_str = "GPS:{},{},{},{},{},{},{},{},{},{},{}".format(
                        utctime,
                        lat_gcj,  # GCJ-02纬度（高德地图用）
                        ulat,
                        lon_gcj,  # GCJ-02经度（高德地图用）
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
                            rospy.loginfo("GPS: %d卫星, %.1fkm/h, WGS84(%s,%s) -> GCJ02(%s,%s)", 
                                         satellites, speed, lat, lon, lat_gcj, lon_gcj)
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
    
    rospy.loginfo("========================================")
    rospy.loginfo("GPS节点启动 - 带坐标系转换")
    rospy.loginfo("WGS-84 -> GCJ-02 (高德/腾讯地图)")
    rospy.loginfo("========================================")
    
    # 初始化串口
    try:
        ser = serial.Serial("/dev/ttyUSB0", 9600)
        if ser.isOpen():
            rospy.loginfo("GPS串口打开成功: /dev/ttyUSB0 @ 9600")
        else:
            rospy.logerr("GPS串口打开失败!")
            return
    except Exception as e:
        rospy.logerr("打开GPS串口失败: %s", str(e))
        return
    
    # 启动发布线程
    publish_thread = threading.Thread(target=publish_gps_data)
    publish_thread.daemon = True
    publish_thread.start()
    
    rospy.loginfo("GPS节点运行中，等待卫星定位...")
    
    try:
        # 主循环 - 读取数据（readline阻塞等待，无需sleep）
        while not rospy.is_shutdown():
            GPS_read(ser)
            
    except KeyboardInterrupt:
        rospy.loginfo("键盘中断")
    except rospy.ROSInterruptException:
        rospy.loginfo("ROS中断")
    except Exception as e:
        rospy.logerr("错误: %s", str(e))
    finally:
        ser.close()
        rospy.loginfo("GPS串口已关闭")


if __name__ == '__main__':
    main()