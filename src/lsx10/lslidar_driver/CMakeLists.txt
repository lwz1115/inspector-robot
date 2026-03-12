cmake_minimum_required(VERSION 2.8.3)
project(lslidar_driver)
add_compile_options(-std=c++14)
set( CMAKE_CXX_STANDARD 14)
set(libpcap_LIBRARIES -lpcap)
find_package(catkin REQUIRED COMPONENTS
  roscpp
  rospy
  sensor_msgs
  diagnostic_updater
  nodelet
  pcl_ros
  pcl_conversions
  lslidar_msgs
)
find_package(Boost REQUIRED)
catkin_package(
  INCLUDE_DIRS include
  CATKIN_DEPENDS
    roscpp diagnostic_updater nodelet
    pcl_ros pcl_conversions
    lslidar_msgs
  DEPENDS
    Boost
)
include_directories(
  include
  ${Boost_INCLUDE_DIR}
  ${catkin_INCLUDE_DIRS}
)
link_directories(
  ${catkin_LIBRARY_DIRS}
)

# 库文件
add_library(lslidar_input src/input.cc)
add_library(lslidar_serial src/lsiosr.cpp)
add_library(lslidar_driver src/lslidar_driver.cc)

# 关键：添加消息依赖，确保消息先生成！
add_dependencies(lslidar_input ${catkin_EXPORTED_TARGETS} lslidar_msgs_generate_messages_cpp)
add_dependencies(lslidar_serial ${catkin_EXPORTED_TARGETS})
add_dependencies(lslidar_driver ${catkin_EXPORTED_TARGETS} lslidar_msgs_generate_messages_cpp)

target_link_libraries(lslidar_input ${catkin_LIBRARIES} ${libpcap_LIBRARIES})
target_link_libraries(lslidar_serial ${catkin_LIBRARIES})
target_link_libraries(lslidar_driver lslidar_input lslidar_serial ${catkin_LIBRARIES})

# 可执行文件
add_executable(lslidar_driver_node src/lslidar_driver_node.cc)
add_dependencies(lslidar_driver_node ${catkin_EXPORTED_TARGETS} lslidar_msgs_generate_messages_cpp)
target_link_libraries(lslidar_driver_node lslidar_driver lslidar_input lslidar_serial ${catkin_LIBRARIES})

install(TARGETS lslidar_input lslidar_driver_node lslidar_serial
  ARCHIVE DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  LIBRARY DESTINATION ${CATKIN_PACKAGE_LIB_DESTINATION}
  RUNTIME DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
install(DIRECTORY launch DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION})
