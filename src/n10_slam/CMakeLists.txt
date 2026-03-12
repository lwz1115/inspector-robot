cmake_minimum_required(VERSION 3.0.2)
project(n10_slam)

find_package(catkin REQUIRED COMPONENTS
  rospy
  std_msgs
  sensor_msgs
  nav_msgs
  geometry_msgs
  tf2_ros
  tf2_geometry_msgs
)

catkin_package()

include_directories(${catkin_INCLUDE_DIRS})

# 安装Python脚本
catkin_install_python(PROGRAMS
  scripts/n10_lidar_node.py
  scripts/jetbot_serial_control.py
  scripts/odometry_node.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

# 安装launch文件
install(DIRECTORY launch/
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}/launch
)

# 安装rviz配置
install(DIRECTORY rviz/
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}/rviz
)