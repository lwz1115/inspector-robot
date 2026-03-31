# 园区巡检机器人

![version](https://img.shields.io/badge/version-1.0.0-blue)
![ROS](https://img.shields.io/badge/ROS-Melodic-brightgreen?logo=ros)
![Ubuntu](https://img.shields.io/badge/Ubuntu-18.04-E95420?logo=ubuntu&logoColor=white)
![Java](https://img.shields.io/badge/Java-18-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-2.7.7-6DB33F?logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![UniApp](https://img.shields.io/badge/UniApp-Vue2-2B9939?logo=vuedotjs&logoColor=white)
![license](https://img.shields.io/badge/license-MIT-green)

基于 Jetson Nano + STM32 的自主巡检机器人，支持 2D SLAM 建图、多模定位（AMCL+GPS）、动态避障、人脸识别，并通过 Spring Boot 后端将数据分发至微信小程序端。

## ✨ 核心功能

- **巡检导航**：路径巡检、动态避障、实时重规划（move_base + DWA）
- **建图定位**：2D 激光 SLAM（GMapping）+ AMCL + GPS 融合定位
- **视觉感知**：人脸检测/识别（MobileNet-SSD），关键帧上传
- **底层控制**：STM32 负责电机/编码器/IMU/GPS，Jetson 负责决策
- **数据分发**：Spring Boot 后端通过 HTTP REST + SSE 分发地图/传感器/告警
- **移动端**：UniApp 微信小程序，实时展示机器人状态、地图导航、人脸事件

## 🧱 系统架构

```
┌─────────────────┐     串口      ┌──────────────────────┐     HTTP/WS     ┌──────────────────────┐
│    STM32        │◄────────────►│    Jetson Nano        │────────────────►│   Spring Boot 后端    │
│  - 电机/编码器  │              │  (Ubuntu 18.04 ROS)   │                 │   :8080               │
│  - IMU (MPU6050)│              │  - SLAM / move_base   │  rosbridge:9090 │  - REST API           │
│  - GPS (NMEA)   │              │  - 人脸识别 (OpenCV)  │◄───────────────►│  - SSE 推送           │
│  - 烟雾/温湿度  │              │  - http_node 推送数据 │                 │  - MySQL 存储         │
└─────────────────┘              └──────────────────────┘                 └──────────┬───────────┘
                                                                                      │ HTTP REST
                                                                          ┌───────────▼───────────┐
                                                                          │   UniApp 微信小程序    │
                                                                          │  - 设备数据实时展示    │
                                                                          │  - 高德地图导航        │
                                                                          │  - 人脸识别事件        │
                                                                          └───────────────────────┘
```

## 📦 快速开始

### 环境要求

- 系统：Ubuntu 18.04（Jetson Nano）
- ROS 版本：Melodic（ROS 1）
- Python：2.7（ROS Melodic 默认）或 3.6+
- STM32：代码使用 KEIL5 打开，烧录到 STM32F407 开发板
- Java 18 + Maven（后端）
- MySQL 8.0（后端数据库）
- 所有设备需要在同一局域网内

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/lwz1115/inspector-robot.git
   cd inspector-robot/ROS
   ```

2. **编译 ROS 工作空间**
   ```bash
   rosdep install --from-paths src --ignore-src -r -y
   catkin_make
   source devel/setup.bash
   sudo chmod 666 /dev/ttyACM0 /dev/ttyUSB0
   ```

3. **启动后端**
   ```bash
   # 使用 IntelliJ IDEA 打开 ROS/find_robot 目录
   # 确保 application.properties 中 IP 配置正确
   mvn spring-boot:run
   # 后端运行在 http://0.0.0.0:8080
   ```

4. **启动 ROS 节点**
   ```bash
   # 启动 SLAM + 导航
   roslaunch n10_slam n10_navigation.launch

   # 启动数据推送节点（另开终端）
   rosrun http_pkg http_node.py

   # 启动摄像头/人脸识别（另开终端）
   roslaunch camera_pkg face.launch
   ```

5. **配置前端并运行**
   ```bash
   # 修改 IP 配置
   # 编辑 ROS/WeChat/robotapp/config/server.js
   # 将 SERVER_IP 改为后端服务器实际 IP

   # 用 HBuilderX 打开 ROS/WeChat/robotapp 运行到微信开发者工具
   ```

6. **STM32 代码**
   ```bash
   # 使用 KEIL5 打开 ROS/STM32 目录下的项目
   # 编译并烧录到 STM32F407 开发板
   ```

7. **访问方式**
   - **Web 端**：直接在浏览器输入后端服务器 IP，例如 `http://192.168.1.100:8080`
   - **微信小程序**：通过 HBuilderX 运行到微信开发者工具或真机

## 📁 项目结构

```
patrol-robot/
├── ROS/
│   ├── src/                        # ROS Melodic 工作空间
│   │   ├── camera_pkg/             # 摄像头 + 人脸识别
│   │   ├── gps_driver/             # GPS 驱动
│   │   ├── http_pkg/               # HTTP 推送节点
│   │   ├── lsx10/                  # 镭神激光雷达驱动
│   │   ├── n10_pkg/                # 导航控制器
│   │   ├── n10_slam/               # SLAM + 导航
│   │   └── packet_pkg/             # STM32 串口通信协议
│   ├── find_robot/                 # Spring Boot 后端（使用 IntelliJ IDEA 打开）
│   ├── WeChat/                     # UniApp 微信小程序前端
│   ├── STM32/                      # STM32 代码（使用 KEIL5 打开，烧录到 STM32F407）
│   └── launch/                     # 一键启动 launch 文件
```

## 🌐 内网穿透（可选）

由于项目默认要求所有设备在同一局域网内，若需要外网访问，可以使用内网穿透工具。以下是快速设置方法：

1. **使用 ngrok**
   ```bash
   # 下载并安装 ngrok
   # 注册账号并获取授权 token
   ngrok http 8080
   # 会生成一个外网访问地址，如 https://xxxx.ngrok.io
   ```

2. **使用 frp**
   ```bash
   # 下载 frp 客户端和服务端
   # 配置 frpc.ini 文件指向服务端
   ./frpc -c frpc.ini
   # 通过服务端 IP 和端口访问
   ```

## 🚀 ROS 1 环境搭建

1. **安装 ROS Melodic**
   ```bash
   sudo apt update
   sudo apt install -y ros-melodic-desktop-full
   echo "source /opt/ros/melodic/setup.bash" >> ~/.bashrc
   source ~/.bashrc
   ```

2. **安装依赖**
   ```bash
   sudo apt install -y python-rosdep python-rosinstall python-rosinstall-generator python-wstool build-essential
   sudo rosdep init || true
   rosdep update || true
   ```

3. **创建工作空间**
   ```bash
   mkdir -p ~/catkin_ws/src
   cd ~/catkin_ws
   catkin_make
   source devel/setup.bash
   ```

## 👤 作者

李文卓 · 物联2431 · © 2026 （用于毕业设计）
