#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
map_node.py
订阅 gmapping 发布的 /map (nav_msgs/OccupancyGrid)
将地图转为 PNG base64，通过 HTTP POST 推送到 Spring Boot
Spring Boot 再通过 SSE 推送给前端
"""

import rospy
import threading
import base64
import json
import time
import numpy as np

try:
    import urllib2 as urllib_request
    from urllib2 import Request, urlopen
except ImportError:
    import urllib.request as urllib_request
    from urllib.request import Request, urlopen

from nav_msgs.msg import OccupancyGrid

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    rospy.logwarn("cv2 not found, using PIL fallback")
    from PIL import Image
    import io

# ── 配置（在 main 中从 ROS 参数读取，默认 localhost）──────
BACKEND_URL   = 'http://localhost:8080/api/map/push'
PUSH_INTERVAL = 1.0

_lock     = threading.Lock()
_map_data = None   # 最新地图消息
_last_seq = -1


def map_callback(msg):
    global _map_data
    with _lock:
        _map_data = msg


def occupancy_to_png_b64(msg):
    """将 OccupancyGrid 转为 PNG base64 字符串"""
    w = msg.info.width
    h = msg.info.height
    data = np.array(msg.data, dtype=np.int8).reshape((h, w))

    # 颜色映射：未知=-1→灰色127，空闲=0→白色255，占用=100→黑色0
    img = np.zeros((h, w), dtype=np.uint8)
    img[data == -1]  = 127   # 未探索：灰
    img[data == 0]   = 255   # 空闲：白
    img[data == 100] = 0     # 障碍：黑
    # 中间值（部分占用）线性映射
    mask = (data > 0) & (data < 100)
    img[mask] = (255 - data[mask] * 2).astype(np.uint8)

    # 上下翻转（ROS坐标系y轴朝上，图像y轴朝下）
    img = np.flipud(img)

    if HAS_CV2:
        _, buf = cv2.imencode('.png', img)
        return base64.b64encode(buf.tobytes()).decode('utf-8')
    else:
        pil_img = Image.fromarray(img, mode='L')
        buf = io.BytesIO()
        pil_img.save(buf, format='PNG')
        return base64.b64encode(buf.getvalue()).decode('utf-8')


def push_loop():
    global _last_seq
    rate = rospy.Rate(1.0 / PUSH_INTERVAL)
    while not rospy.is_shutdown():
        with _lock:
            msg = _map_data

        if msg is not None and msg.header.seq != _last_seq:
            _last_seq = msg.header.seq
            try:
                png_b64 = occupancy_to_png_b64(msg)
                payload = json.dumps({
                    "width":      msg.info.width,
                    "height":     msg.info.height,
                    "resolution": msg.info.resolution,
                    "origin_x":   msg.info.origin.position.x,
                    "origin_y":   msg.info.origin.position.y,
                    "image":      png_b64,
                    "timestamp":  int(time.time() * 1000)
                }).encode('utf-8')

                req  = Request(BACKEND_URL, data=payload,
                               headers={"Content-Type": "application/json"})
                urlopen(req, timeout=3)
                rospy.logdebug("地图推送成功 %dx%d", msg.info.width, msg.info.height)
            except Exception as e:
                rospy.logwarn("地图推送失败: %s", e)

        rate.sleep()


def main():
    rospy.init_node('map_node', anonymous=False)
    global BACKEND_URL, PUSH_INTERVAL
    BACKEND_URL   = rospy.get_param('~backend_url', 'http://localhost:8080/api/map/push')
    PUSH_INTERVAL = rospy.get_param('~push_interval', 1.0)
    rospy.Subscriber('/map', OccupancyGrid, map_callback)

    t = threading.Thread(target=push_loop)
    t.daemon = True
    t.start()

    rospy.loginfo("map_node 启动，推送地址: %s", BACKEND_URL)
    rospy.spin()


if __name__ == '__main__':
    main()
