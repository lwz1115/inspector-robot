cmake_minimum_required(VERSION 3.0.2)
project(n10_slam)

add_compile_options(-std=c++17)

find_package(catkin REQUIRED COMPONENTS
  roscpp
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

# C++ 里程计节点
add_executable(odometry_node src/odometry_node.cpp)
target_link_libraries(odometry_node ${catkin_LIBRARIES})
add_dependencies(odometry_node ${catkin_EXPORTED_TARGETS})

install(TARGETS odometry_node
  RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

# 安装Python脚本（保留 jetbot_serial_control，删除已替换的节点）
catkin_install_python(PROGRAMS
  scripts/jetbot_serial_control.py
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