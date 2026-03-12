# 园区巡检机器人

![version](https://img.shields.io/badge/version-1.0.0-blue) ![ROS](https://img.shields.io/badge/ROS-Melodic-green) ![Ubuntu](https://img.shields.io/badge/Ubuntu-18.04-orange) ![license](https://img.shields.io/badge/license-MIT-green)

基于 Jetson Nano + STM32 的自主巡检机器人，支持 2D SLAM 建图、多模定位（AMCL+GPS）、动态避障、人脸识别，并通过后端将数据分发至 Web 与移动端。

✨ 核心功能

| 模块 | 功能描述 |
|---|---|
| 巡检导航 | 路径巡检、动态避障、实时重规划 |
| 建图定位 | 2D 激光 SLAM（GMapping）+ AMCL + GPS 融合 |
| 视觉感知 | 人脸检测/识别（MobileNet-SSD），关键帧上传 |
| 底层控制 | STM32 负责电机/编码器/IMU/GPS，Jetson 负责决策 |
| 数据分发 | Spring Boot 后端通过 WebSocket + REST 分发地图/视频/告警 |

🧱 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    STM32        │     │  Jetson Nano    │     │  后端/前端      │
│  - 电机控制     │◄───►│  (Ubuntu 18.04) │────►│  - 地图展示     │
│  - 编码器/IMU   │ 串口│  - SLAM/定位    │ RTSP│  - 视频流       │
│  - GPS采集      │     │  - 人脸识别     │ MQTT│  - 告警推送     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

📦 快速开始

环境要求
- 系统：Ubuntu 18.04（Jetson Nano）
- ROS 版本：Melodic
- Python：2.7（ROS Melodic 默认）或 3.6+（需额外配置）
- STM32：固件已烧录，串口可用

安装 ROS Melodic

```bash
# 如果还没装 ROS，先安装 Melodic
sudo apt update
sudo apt install -y ros-melodic-desktop-full
echo "source /opt/ros/melodic/setup.bash" >> ~/.bashrc
source ~/.bashrc

# 安装依赖工具
sudo apt install -y python-rosdep python-rosinstall python-rosinstall-generator python-wstool build-essential
sudo rosdep init || true
rosdep update || true
```

编译与运行

```bash
# 1. 克隆仓库
git clone https://github.com/yourname/patrol-robot.git
cd patrol-robot/ROS

# 2. 安装依赖
rosdep install --from-paths src --ignore-src -r -y

# 3. 编译
catkin_make
source devel/setup.bash

# 4. 给串口权限
sudo chmod 666 /dev/ttyACM0

# 5. 启动系统（示例）
roslaunch n10_slam complete.launch
```

🔧 Ubuntu 18.04 注意事项

- Python 版本：ROS Melodic 默认使用 Python 2.7；若需 Python3，请确保安装并使用对应的 `python3-rospy` 与虚拟环境。
- 摄像头驱动（USB 摄像头示例）：

```bash
sudo apt install -y ros-melodic-usb-cam
roslaunch usb_cam usb_cam-test.launch
```

- 激光雷达驱动（示例）：

```bash
# 例如 RPLIDAR
sudo apt install -y ros-melodic-rplidar-ros
roslaunch rplidar_ros rplidar.launch
```

📁 项目结构（适配 Melodic）

```
patrol-robot/
├── ROS/                      # ROS Melodic 工作空间
│   ├── src/
│   │   ├── camera_pkg/       # 摄像头与人脸识别（适配 Python 2/3）
│   │   ├── packet_pkg/       # 串口通信协议
│   │   ├── gps_driver/       # GPS 驱动（ros-melodic-nmea-navsat-driver）
│   │   └── n10_slam/         # SLAM + 导航（依赖 ros-melodic-slam-gmapping）
├── proto/                    # Protobuf 定义
├── backend/                  # Spring Boot 后端（与系统无关）
├── docs/                     # 详细文档
└── README.md                  # 本文件
```

📊 关键话题（与 ROS Melodic 兼容）

| 话题 | 类型 | 说明 |
|---|---|---|
| `/odom` | `nav_msgs/Odometry` | 里程计 |
| `/map` | `nav_msgs/OccupancyGrid` | SLAM 地图 |
| `/amcl_pose` | `geometry_msgs/PoseWithCovarianceStamped` | 定位位姿 |
| `/cmd_vel` | `geometry_msgs/Twist` | 速度指令 |
| `/face_event` | 自定义消息 | 人脸识别结果（需编译） |

