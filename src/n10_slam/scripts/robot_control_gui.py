#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
巡检机器人控制面板 v3.0
功能：GPS、阿里云、人脸识别、SLAM建图、导航、小车控制
"""

import sys
import os
import subprocess
import signal
import math
import time
import json
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QPushButton, QLabel, QSlider, QGroupBox,
                             QGridLayout, QMessageBox, QLineEdit, QTextEdit,
                             QTabWidget, QFrame, QSplitter, QScrollArea)
from PyQt5.QtCore import Qt, QTimer, QPoint, pyqtSignal, QThread
from PyQt5.QtGui import QPainter, QColor, QBrush, QPen, QFont

# ROS
import rospy
from geometry_msgs.msg import Twist
from std_msgs.msg import String, Float32


class JoystickWidget(QWidget):
    """虚拟摇杆控件"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMinimumSize(180, 180)
        self.setMaximumSize(180, 180)
        
        self.center = QPoint(90, 90)
        self.current_pos = QPoint(90, 90)
        self.radius = 70
        self.knob_radius = 22
        self.pressed = False
        
        self.x_value = 0.0
        self.y_value = 0.0
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        painter.setPen(QPen(QColor(100, 100, 100), 3))
        painter.setBrush(QBrush(QColor(50, 50, 50)))
        painter.drawEllipse(self.center, self.radius, self.radius)
        
        painter.setPen(QPen(QColor(80, 80, 80), 1))
        painter.drawLine(self.center.x() - self.radius, self.center.y(),
                        self.center.x() + self.radius, self.center.y())
        painter.drawLine(self.center.x(), self.center.y() - self.radius,
                        self.center.x(), self.center.y() + self.radius)
        
        if self.pressed:
            painter.setBrush(QBrush(QColor(0, 150, 255)))
        else:
            painter.setBrush(QBrush(QColor(0, 120, 200)))
        painter.setPen(QPen(QColor(0, 180, 255), 2))
        painter.drawEllipse(self.current_pos, self.knob_radius, self.knob_radius)
        
        painter.setPen(QColor(150, 150, 150))
        painter.setFont(QFont("Arial", 9))
        painter.drawText(self.center.x() - 8, 18, "前")
        painter.drawText(self.center.x() - 8, 175, "后")
        painter.drawText(8, self.center.y() + 4, "左")
        painter.drawText(158, self.center.y() + 4, "右")
        
    def mousePressEvent(self, event):
        self.pressed = True
        self.updatePosition(event.pos())
        
    def mouseMoveEvent(self, event):
        if self.pressed:
            self.updatePosition(event.pos())
            
    def mouseReleaseEvent(self, event):
        self.pressed = False
        self.current_pos = self.center
        self.x_value = 0.0
        self.y_value = 0.0
        self.update()
        
    def updatePosition(self, pos):
        dx = pos.x() - self.center.x()
        dy = pos.y() - self.center.y()
        
        distance = math.sqrt(dx*dx + dy*dy)
        if distance > self.radius:
            dx = dx * self.radius / distance
            dy = dy * self.radius / distance
            
        self.current_pos = QPoint(int(self.center.x() + dx), int(self.center.y() + dy))
        self.x_value = dx / self.radius
        self.y_value = -dy / self.radius
        self.update()


class RobotControlGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # 进程管理
        self.processes = {
            'base': None,
            'face': None,
            'slam': None,
            'nav': None,
            'gps': None,
            'aliyun': None,
        }
        
        # 速度设置
        self.max_linear_speed = 0.3
        self.max_angular_speed = 1.0
        self.current_speed_level = 3
        
        self.key_linear = 0
        self.key_angular = 0
        
        # 传感器数据
        self.gps_data = "无数据"
        self.voltage_data = 0.0
        self.face_data = "无识别"
        
        # 初始化ROS
        try:
            rospy.init_node('robot_control_gui', anonymous=True, disable_signals=True)
            self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=1)
            self.ros_connected = True
            
            # 订阅传感器数据
            rospy.Subscriber('/gps_data', String, self.gps_callback)
            rospy.Subscriber('/battery_voltage', Float32, self.voltage_callback)
            rospy.Subscriber('/recognized_face_name', String, self.face_callback)
            
        except Exception as e:
            print("ROS初始化失败: %s" % e)
            self.ros_connected = False
            self.cmd_pub = None
        
        self.initUI()
        
        # 定时器
        self.control_timer = QTimer()
        self.control_timer.timeout.connect(self.publishVelocity)
        self.control_timer.start(50)
        
        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self.updateSensorDisplay)
        self.status_timer.start(1000)
        
    def initUI(self):
        self.setWindowTitle('🤖 巡检机器人控制面板 v3.0')
        self.setGeometry(50, 50, 1000, 700)
        self.setStyleSheet("""
            QMainWindow { background-color: #1e1e1e; }
            QGroupBox {
                color: #fff; font-size: 13px; font-weight: bold;
                border: 2px solid #444; border-radius: 8px;
                margin-top: 8px; padding-top: 8px;
            }
            QGroupBox::title { subcontrol-origin: margin; left: 10px; padding: 0 5px; }
            QPushButton {
                background-color: #363636; color: white;
                border: 1px solid #555; border-radius: 5px;
                padding: 8px 15px; font-size: 12px;
            }
            QPushButton:hover { background-color: #454545; }
            QPushButton:pressed { background-color: #555; }
            QPushButton:checked { background-color: #0a5f0a; border: 2px solid #0f0; }
            QPushButton:disabled { background-color: #2a2a2a; color: #666; }
            QLabel { color: #ddd; font-size: 11px; }
            QSlider::groove:horizontal { height: 6px; background: #363636; border-radius: 3px; }
            QSlider::handle:horizontal { background: #0078d4; width: 16px; margin: -5px 0; border-radius: 8px; }
            QLineEdit { background-color: #363636; color: white; border: 1px solid #555; border-radius: 4px; padding: 6px; }
            QTextEdit { background-color: #252525; color: #0f0; border: 1px solid #444; border-radius: 4px; font-family: Consolas; font-size: 10px; }
            QTabWidget::pane { border: 1px solid #444; background: #1e1e1e; }
            QTabBar::tab { background: #2a2a2a; color: #aaa; padding: 8px 16px; border: 1px solid #444; }
            QTabBar::tab:selected { background: #363636; color: #fff; }
        """)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        
        # ========== 左侧面板 ==========
        left_panel = QVBoxLayout()
        
        # 系统节点控制
        nodes_group = QGroupBox("🔌 系统节点")
        nodes_layout = QGridLayout()
        
        # GPS节点
        self.btn_gps = QPushButton("GPS节点")
        self.btn_gps.setCheckable(True)
        self.btn_gps.clicked.connect(lambda: self.toggleNode('gps'))
        nodes_layout.addWidget(self.btn_gps, 0, 0)
        
        # 阿里云节点
        self.btn_aliyun = QPushButton("阿里云")
        self.btn_aliyun.setCheckable(True)
        self.btn_aliyun.clicked.connect(lambda: self.toggleNode('aliyun'))
        nodes_layout.addWidget(self.btn_aliyun, 0, 1)
        
        # 串口通信
        self.btn_base = QPushButton("串口通信")
        self.btn_base.setCheckable(True)
        self.btn_base.clicked.connect(lambda: self.toggleNode('base'))
        nodes_layout.addWidget(self.btn_base, 1, 0)
        
        # 人脸识别
        self.btn_face = QPushButton("人脸识别")
        self.btn_face.setCheckable(True)
        self.btn_face.clicked.connect(lambda: self.toggleNode('face'))
        nodes_layout.addWidget(self.btn_face, 1, 1)
        
        # 一键启动/停止
        self.btn_start_all = QPushButton("▶ 一键启动")
        self.btn_start_all.setStyleSheet("background-color: #006400;")
        self.btn_start_all.clicked.connect(self.startAllNodes)
        nodes_layout.addWidget(self.btn_start_all, 2, 0)
        
        self.btn_stop_all = QPushButton("■ 全部停止")
        self.btn_stop_all.setStyleSheet("background-color: #640000;")
        self.btn_stop_all.clicked.connect(self.stopAllNodes)
        nodes_layout.addWidget(self.btn_stop_all, 2, 1)
        
        nodes_group.setLayout(nodes_layout)
        left_panel.addWidget(nodes_group)
        
        # SLAM/导航控制
        slam_group = QGroupBox("🗺️ SLAM / 导航")
        slam_layout = QVBoxLayout()
        
        slam_btn_layout = QHBoxLayout()
        self.btn_slam = QPushButton("启动建图")
        self.btn_slam.setCheckable(True)
        self.btn_slam.clicked.connect(lambda: self.toggleNode('slam'))
        slam_btn_layout.addWidget(self.btn_slam)
        
        self.btn_nav = QPushButton("启动导航")
        self.btn_nav.setCheckable(True)
        self.btn_nav.clicked.connect(lambda: self.toggleNode('nav'))
        slam_btn_layout.addWidget(self.btn_nav)
        slam_layout.addLayout(slam_btn_layout)
        
        self.btn_save_map = QPushButton("💾 保存地图")
        self.btn_save_map.clicked.connect(self.saveMap)
        slam_layout.addWidget(self.btn_save_map)
        
        slam_group.setLayout(slam_layout)
        left_panel.addWidget(slam_group)
        
        # 人脸录制
        face_group = QGroupBox("👤 人脸录制")
        face_layout = QVBoxLayout()
        
        name_layout = QHBoxLayout()
        name_layout.addWidget(QLabel("姓名:"))
        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("输入名称")
        name_layout.addWidget(self.name_input)
        face_layout.addLayout(name_layout)
        
        self.btn_train = QPushButton("📷 开始录制")
        self.btn_train.clicked.connect(self.startFaceTraining)
        face_layout.addWidget(self.btn_train)
        
        face_group.setLayout(face_layout)
        left_panel.addWidget(face_group)
        
        # 传感器数据显示
        sensor_group = QGroupBox("📊 传感器数据")
        sensor_layout = QVBoxLayout()
        
        self.label_gps = QLabel("🛰️ GPS: 无数据")
        self.label_voltage = QLabel("🔋 电压: 0.00V")
        self.label_face = QLabel("👤 人脸: 无识别")
        
        sensor_layout.addWidget(self.label_gps)
        sensor_layout.addWidget(self.label_voltage)
        sensor_layout.addWidget(self.label_face)
        
        sensor_group.setLayout(sensor_layout)
        left_panel.addWidget(sensor_group)
        
        left_panel.addStretch()
        main_layout.addLayout(left_panel, 1)
        
        # ========== 右侧面板 ==========
        right_panel = QVBoxLayout()
        
        # 摇杆控制
        joystick_group = QGroupBox("🎮 摇杆控制")
        joystick_layout = QVBoxLayout()
        
        joystick_container = QHBoxLayout()
        joystick_container.addStretch()
        self.joystick = JoystickWidget()
        joystick_container.addWidget(self.joystick)
        joystick_container.addStretch()
        joystick_layout.addLayout(joystick_container)
        
        self.speed_label = QLabel("线速度: 0.00 m/s  角速度: 0.00 rad/s")
        self.speed_label.setAlignment(Qt.AlignCenter)
        self.speed_label.setStyleSheet("font-size: 12px; color: #0af;")
        joystick_layout.addWidget(self.speed_label)
        
        joystick_group.setLayout(joystick_layout)
        right_panel.addWidget(joystick_group)
        
        # 速度档位
        speed_group = QGroupBox("⚡ 速度档位")
        speed_layout = QVBoxLayout()
        
        slider_layout = QHBoxLayout()
        slider_layout.addWidget(QLabel("慢"))
        self.speed_slider = QSlider(Qt.Horizontal)
        self.speed_slider.setMinimum(1)
        self.speed_slider.setMaximum(5)
        self.speed_slider.setValue(3)
        self.speed_slider.setTickPosition(QSlider.TicksBelow)
        self.speed_slider.valueChanged.connect(self.updateSpeedLevel)
        slider_layout.addWidget(self.speed_slider)
        slider_layout.addWidget(QLabel("快"))
        speed_layout.addLayout(slider_layout)
        
        self.level_label = QLabel("档位: 3 (最大: 0.30 m/s)")
        self.level_label.setAlignment(Qt.AlignCenter)
        speed_layout.addWidget(self.level_label)
        
        speed_btn_layout = QHBoxLayout()
        btn_down = QPushButton("◀ 减速")
        btn_down.clicked.connect(self.speedDown)
        speed_btn_layout.addWidget(btn_down)
        
        btn_stop = QPushButton("⬛ 急停")
        btn_stop.setStyleSheet("background-color: #8b0000; font-weight: bold;")
        btn_stop.clicked.connect(self.emergencyStop)
        speed_btn_layout.addWidget(btn_stop)
        
        btn_up = QPushButton("加速 ▶")
        btn_up.clicked.connect(self.speedUp)
        speed_btn_layout.addWidget(btn_up)
        speed_layout.addLayout(speed_btn_layout)
        
        speed_group.setLayout(speed_layout)
        right_panel.addWidget(speed_group)
        
        # 键盘控制
        keyboard_group = QGroupBox("⌨️ 键盘控制 (W/A/S/D)")
        keyboard_layout = QGridLayout()
        
        self.btn_forward = QPushButton("↑ W")
        self.btn_forward.setMinimumHeight(45)
        self.btn_backward = QPushButton("↓ S")
        self.btn_backward.setMinimumHeight(45)
        self.btn_left = QPushButton("← A")
        self.btn_left.setMinimumHeight(45)
        self.btn_right = QPushButton("→ D")
        self.btn_right.setMinimumHeight(45)
        self.btn_stop_key = QPushButton("■")
        self.btn_stop_key.setMinimumHeight(45)
        
        self.btn_forward.pressed.connect(lambda: self.setDirection(1, 0))
        self.btn_forward.released.connect(lambda: self.setDirection(0, 0))
        self.btn_backward.pressed.connect(lambda: self.setDirection(-1, 0))
        self.btn_backward.released.connect(lambda: self.setDirection(0, 0))
        self.btn_left.pressed.connect(lambda: self.setDirection(0, 1))
        self.btn_left.released.connect(lambda: self.setDirection(0, 0))
        self.btn_right.pressed.connect(lambda: self.setDirection(0, -1))
        self.btn_right.released.connect(lambda: self.setDirection(0, 0))
        self.btn_stop_key.clicked.connect(self.emergencyStop)
        
        keyboard_layout.addWidget(self.btn_forward, 0, 1)
        keyboard_layout.addWidget(self.btn_left, 1, 0)
        keyboard_layout.addWidget(self.btn_stop_key, 1, 1)
        keyboard_layout.addWidget(self.btn_right, 1, 2)
        keyboard_layout.addWidget(self.btn_backward, 2, 1)
        
        keyboard_group.setLayout(keyboard_layout)
        right_panel.addWidget(keyboard_group)
        
        # 日志显示
        log_group = QGroupBox("📋 系统日志")
        log_layout = QVBoxLayout()
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(120)
        log_layout.addWidget(self.log_text)
        log_group.setLayout(log_layout)
        right_panel.addWidget(log_group)
        
        main_layout.addLayout(right_panel, 1)
        
        # 状态栏
        self.statusBar().showMessage('就绪 - ROS: %s' % ('已连接' if self.ros_connected else '未连接'))
        self.statusBar().setStyleSheet("color: white; background-color: #2a2a2a;")
        
        self.log("系统初始化完成")
        
    def log(self, msg):
        """添加日志"""
        timestamp = time.strftime("%H:%M:%S")
        self.log_text.append("[%s] %s" % (timestamp, msg))
        self.log_text.verticalScrollBar().setValue(self.log_text.verticalScrollBar().maximum())
        
    def gps_callback(self, msg):
        """GPS数据回调"""
        try:
            data = msg.data
            if data.startswith('GPS:'):
                parts = data[4:].split(',')
                if len(parts) >= 6:
                    lat = parts[1] if parts[1] else "N/A"
                    lon = parts[3] if parts[3] else "N/A"
                    sats = parts[5] if parts[5] else "0"
                    self.gps_data = "卫星:%s 纬度:%s 经度:%s" % (sats, lat[:10], lon[:10])
        except:
            pass
            
    def voltage_callback(self, msg):
        """电压回调"""
        self.voltage_data = msg.data
        
    def face_callback(self, msg):
        """人脸识别回调"""
        try:
            data = msg.data
            if ':' in data:
                name = data.split(':')[0]
                self.face_data = name
            else:
                self.face_data = data
        except:
            pass
            
    def updateSensorDisplay(self):
        """更新传感器显示"""
        self.label_gps.setText("🛰️ GPS: %s" % self.gps_data)
        self.label_voltage.setText("🔋 电压: %.2fV" % self.voltage_data)
        self.label_face.setText("👤 人脸: %s" % self.face_data)
        
        # 电压颜色警告
        if self.voltage_data > 0:
            if self.voltage_data < 11.0:
                self.label_voltage.setStyleSheet("color: #f00;")
            elif self.voltage_data < 11.5:
                self.label_voltage.setStyleSheet("color: #ff0;")
            else:
                self.label_voltage.setStyleSheet("color: #0f0;")
                
    def toggleNode(self, node_name):
        """切换节点状态"""
        btn_map = {
            'gps': self.btn_gps,
            'aliyun': self.btn_aliyun,
            'base': self.btn_base,
            'face': self.btn_face,
            'slam': self.btn_slam,
            'nav': self.btn_nav,
        }
        
        cmd_map = {
            'gps': ['python3', '/home/jetson/catkin_ws/src/gps_driver/src/gps_publisher.py'],
            'aliyun': ['python3', '/home/jetson/catkin_ws/src/aliyun_pkg/src/aliyun_node.py'],
            'base': ['roslaunch', 'n10_slam', 'base_control.launch'],
            'face': ['roslaunch', 'camera_pkg', 'face.launch'],
            'slam': ['roslaunch', 'n10_slam', 'n10_gmapping.launch'],
            'nav': ['roslaunch', 'n10_slam', 'n10_navigation.launch'],
        }
        
        btn = btn_map.get(node_name)
        if not btn:
            return
            
        if btn.isChecked():
            # 启动节点
            # 特殊处理：SLAM和导航互斥
            if node_name == 'slam' and self.processes['nav']:
                self.btn_nav.setChecked(False)
                self.stopNode('nav')
            elif node_name == 'nav' and self.processes['slam']:
                self.btn_slam.setChecked(False)
                self.stopNode('slam')
                
            # SLAM/导航模式下关闭基础控制
            if node_name in ['slam', 'nav'] and self.processes['base']:
                self.btn_base.setChecked(False)
                self.stopNode('base')
                
            try:
                # 授权串口
                os.system('sudo chmod 666 /dev/ttyACM0 2>/dev/null')
                os.system('sudo chmod 666 /dev/ttyTHS1 2>/dev/null')
                os.system('sudo chmod 666 /dev/ttyUSB0 2>/dev/null')
                
                self.processes[node_name] = subprocess.Popen(
                    cmd_map[node_name],
                    preexec_fn=os.setsid,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                self.log("✅ 启动: %s" % node_name)
            except Exception as e:
                self.log("❌ 启动失败: %s - %s" % (node_name, str(e)))
                btn.setChecked(False)
        else:
            # 停止节点
            self.stopNode(node_name)
            
            # SLAM/导航关闭后恢复基础控制
            if node_name in ['slam', 'nav']:
                self.btn_base.setChecked(True)
                self.toggleNode('base')
                
    def stopNode(self, node_name):
        """停止节点"""
        if self.processes[node_name]:
            try:
                os.killpg(os.getpgid(self.processes[node_name].pid), signal.SIGTERM)
                time.sleep(0.3)
            except:
                pass
            self.processes[node_name] = None
            self.log("⏹️ 停止: %s" % node_name)
            
    def startAllNodes(self):
        """一键启动所有节点"""
        self.log("🚀 一键启动...")
        
        nodes_to_start = ['gps', 'base', 'aliyun']
        for node in nodes_to_start:
            btn_map = {'gps': self.btn_gps, 'base': self.btn_base, 'aliyun': self.btn_aliyun}
            if not self.processes[node]:
                btn_map[node].setChecked(True)
                self.toggleNode(node)
                time.sleep(1)
                
        self.log("✅ 一键启动完成")
        
    def stopAllNodes(self):
        """停止所有节点"""
        self.log("⏹️ 停止所有节点...")
        
        for node_name in self.processes.keys():
            if self.processes[node_name]:
                self.stopNode(node_name)
                
        # 重置所有按钮
        self.btn_gps.setChecked(False)
        self.btn_aliyun.setChecked(False)
        self.btn_base.setChecked(False)
        self.btn_face.setChecked(False)
        self.btn_slam.setChecked(False)
        self.btn_nav.setChecked(False)
        
        self.log("✅ 所有节点已停止")
        
    def startFaceTraining(self):
        """启动人脸录制"""
        name = self.name_input.text().strip()
        if not name:
            QMessageBox.warning(self, "提示", "请输入名称")
            return
        try:
            subprocess.Popen(['rosrun', 'camera_pkg', 'face_trainer.py'], preexec_fn=os.setsid)
            self.log("📷 人脸录制启动: %s" % name)
            QMessageBox.information(self, "提示", "已启动录制\n按 't' 开始，输入名称: %s" % name)
        except Exception as e:
            self.log("❌ 录制启动失败: %s" % str(e))
            
    def saveMap(self):
        """保存地图"""
        if not self.processes['slam']:
            QMessageBox.warning(self, "提示", "请先启动建图")
            return
        try:
            map_name = "map_%s" % time.strftime("%Y%m%d_%H%M%S")
            map_path = os.path.expanduser("~/%s" % map_name)
            subprocess.Popen(['rosrun', 'map_server', 'map_saver', '-f', map_path])
            self.log("💾 地图已保存: %s" % map_name)
            QMessageBox.information(self, "成功", "地图已保存:\n%s" % map_path)
        except Exception as e:
            self.log("❌ 保存失败: %s" % str(e))
            
    def setDirection(self, linear, angular):
        self.key_linear = linear
        self.key_angular = angular
        
    def updateSpeedLevel(self, value):
        self.current_speed_level = value
        self.max_linear_speed = 0.1 * value
        self.max_angular_speed = 0.4 * value
        self.level_label.setText("档位: %d (最大: %.2f m/s)" % (value, self.max_linear_speed))
        
    def speedUp(self):
        if self.current_speed_level < 5:
            self.speed_slider.setValue(self.current_speed_level + 1)
            
    def speedDown(self):
        if self.current_speed_level > 1:
            self.speed_slider.setValue(self.current_speed_level - 1)
            
    def emergencyStop(self):
        self.joystick.x_value = 0
        self.joystick.y_value = 0
        self.joystick.current_pos = self.joystick.center
        self.joystick.update()
        self.key_linear = 0
        self.key_angular = 0
        
        if self.cmd_pub:
            self.cmd_pub.publish(Twist())
        self.log("🛑 急停")
        
    def publishVelocity(self):
        if not self.cmd_pub:
            return
            
        twist = Twist()
        
        if abs(self.joystick.x_value) > 0.1 or abs(self.joystick.y_value) > 0.1:
            twist.linear.x = self.joystick.y_value * self.max_linear_speed
            twist.angular.z = -self.joystick.x_value * self.max_angular_speed
        elif self.key_linear != 0 or self.key_angular != 0:
            twist.linear.x = self.key_linear * self.max_linear_speed
            twist.angular.z = self.key_angular * self.max_angular_speed
            
        self.cmd_pub.publish(twist)
        
        self.speed_label.setText("线速度: %.2f m/s  角速度: %.2f rad/s" % 
                                 (twist.linear.x, twist.angular.z))
                
    def closeEvent(self, event):
        self.stopAllNodes()
        if self.cmd_pub:
            self.cmd_pub.publish(Twist())
        event.accept()
        
    def keyPressEvent(self, event):
        if not event.isAutoRepeat():
            if event.key() == Qt.Key_W or event.key() == Qt.Key_Up:
                self.setDirection(1, 0)
            elif event.key() == Qt.Key_S or event.key() == Qt.Key_Down:
                self.setDirection(-1, 0)
            elif event.key() == Qt.Key_A or event.key() == Qt.Key_Left:
                self.setDirection(0, 1)
            elif event.key() == Qt.Key_D or event.key() == Qt.Key_Right:
                self.setDirection(0, -1)
            elif event.key() == Qt.Key_Space:
                self.emergencyStop()
            elif event.key() == Qt.Key_Plus or event.key() == Qt.Key_Equal:
                self.speedUp()
            elif event.key() == Qt.Key_Minus:
                self.speedDown()
            
    def keyReleaseEvent(self, event):
        if not event.isAutoRepeat():
            if event.key() in [Qt.Key_W, Qt.Key_S, Qt.Key_A, Qt.Key_D,
                              Qt.Key_Up, Qt.Key_Down, Qt.Key_Left, Qt.Key_Right]:
                self.setDirection(0, 0)


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    window = RobotControlGUI()
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()