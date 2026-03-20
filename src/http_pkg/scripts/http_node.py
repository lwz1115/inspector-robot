#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
http_node.py — 替代 aliyun_node.py
订阅 GPS / 电压 / 人脸 topic，每隔 PUSH_INTERVAL 秒
直接 HTTP POST 到 Spring Boot /api/robot-data/push
"""

import rospy
import threading
import json
import time

try:
    import urllib2 as urllib_request   # Python 2
    from urllib2 import Request, urlopen, URLError
except ImportError:
    import urllib.request as urllib_request  # Python 3
    from urllib.request import Request, urlopen
    from urllib.error import URLError

from std_msgs.msg import String, Float32

# ── 配置 ──────────────────────────────────────────────────
BACKEND_URL  = "http://192.168.2.1:8080/api/robot-data/push"   # Spring Boot 地址
DEVICE_ID    = "find_robot"
PUSH_INTERVAL = 5.0   # 秒

# ── 数据缓存 ───────────────────────────────────────────────
_lock = threading.Lock()
_gps  = {}          # 解析后的GPS字段
_volt = 0.0         # 电压
_face = ""          # 最近识别到的人名
_temp = 0.0         # 温度 (℃)
_humi = 0.0         # 湿度 (%)
_smoke = 0          # 烟雾值


def gps_callback(msg):
    """解析 GPS:时间,纬度,N,经度,E,卫星,海拔,...,速度kph,... """
    global _gps
    raw = msg.data
    if not raw.startswith("GPS:"):
        return
    parts = raw[4:].split(",")
    try:
        with _lock:
            _gps = {
                "latitude":  float(parts[1]) if len(parts) > 1 and parts[1] else 0.0,
                "longitude": float(parts[3]) if len(parts) > 3 and parts[3] else 0.0,
                "satellites": int(parts[5])  if len(parts) > 5 and parts[5] else 0,
                "altitude":  float(parts[6]) if len(parts) > 6 and parts[6] else 0.0,
                "speed":     float(parts[9]) if len(parts) > 9 and parts[9] else 0.0,
            }
    except Exception as e:
        rospy.logwarn("GPS解析失败: %s", e)


def voltage_callback(msg):
    global _volt
    with _lock:
        _volt = round(float(msg.data), 2)


def face_callback(msg):
    global _face
    # 格式 "Alice:0.85:15" 或 "Unknown:..."
    name = msg.data.split(":")[0]
    if name and name != "Unknown":
        with _lock:
            _face = name


def temp_humi_callback(msg):
    """解析温湿度，格式: TEMP:25.3,HUM:60.5"""
    global _temp, _humi
    raw = msg.data
    try:
        parts = raw.split(",")
        for p in parts:
            if p.startswith("TEMP:"):
                with _lock:
                    _temp = round(float(p[5:]), 1)
            elif p.startswith("HUM:"):
                with _lock:
                    _humi = round(float(p[4:]), 1)
    except Exception as e:
        rospy.logwarn("温湿度解析失败: %s", e)


def smoke_callback(msg):
    """烟雾传感器原始值"""
    global _smoke
    with _lock:
        _smoke = int(msg.data)


def push_loop():
    """定时推送线程"""
    rate = rospy.Rate(1.0 / PUSH_INTERVAL)
    while not rospy.is_shutdown():
        with _lock:
            payload = {
                "device_id": DEVICE_ID,
                "timestamp": int(time.time() * 1000),
                "voltage":   _volt,
                "temperature": _temp,
                "humidity":    _humi,
                "smoke_value": _smoke,
            }
            payload.update(_gps)
            if _face:
                payload["alert_message"] = u"识别到: " + _face

        try:
            body = json.dumps(payload).encode("utf-8")
            req  = Request(BACKEND_URL, data=body,
                           headers={"Content-Type": "application/json"})
            resp = urlopen(req, timeout=4)
            rospy.logdebug("推送成功: %s", resp.read())
        except Exception as e:
            rospy.logwarn("推送失败: %s", e)

        rate.sleep()


def main():
    rospy.init_node("http_node", anonymous=False)

    rospy.Subscriber("/gps_data",             String,  gps_callback)
    rospy.Subscriber("/battery_voltage",      Float32, voltage_callback)
    rospy.Subscriber("/recognized_face_name", String,  face_callback)
    rospy.Subscriber("/temp_humi_data",       String,  temp_humi_callback)
    rospy.Subscriber("/smoke_value",          Float32, smoke_callback)

    t = threading.Thread(target=push_loop)
    t.daemon = True
    t.start()

    rospy.loginfo("http_node 启动，推送地址: %s，间隔: %.0fs", BACKEND_URL, PUSH_INTERVAL)
    rospy.spin()


if __name__ == "__main__":
    main()
