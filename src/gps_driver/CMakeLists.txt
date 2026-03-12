cmake_minimum_required(VERSION 3.0.2)
project(gps_driver)

find_package(catkin REQUIRED COMPONENTS
  rospy
  std_msgs
)

catkin_package(
  CATKIN_DEPENDS rospy std_msgs
)

include_directories(
  ${catkin_INCLUDE_DIRS}
)

# 安装Python脚本 - 修正路径
catkin_install_python(PROGRAMS
  src/gps_publisher.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)