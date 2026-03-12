;; Auto-generated. Do not edit!


(when (boundp 'packet_pkg::PacketData)
  (if (not (find-package "PACKET_PKG"))
    (make-package "PACKET_PKG"))
  (shadow 'PacketData (find-package "PACKET_PKG")))
(unless (find-package "PACKET_PKG::PACKETDATA")
  (make-package "PACKET_PKG::PACKETDATA"))

(in-package "ROS")
;;//! \htmlinclude PacketData.msg.html
(if (not (find-package "STD_MSGS"))
  (ros::roseus-add-msgs "std_msgs"))


(defclass packet_pkg::PacketData
  :super ros::object
  :slots (_header _face_name _face_confidence _face_detected _utc_time _latitude _longitude _lat_direction _lon_direction _satellite_count _altitude _speed_kph _heading_true _heading_magnetic _cpu_usage _memory_usage _frame_count _checksum ))

(defmethod packet_pkg::PacketData
  (:init
   (&key
    ((:header __header) (instance std_msgs::Header :init))
    ((:face_name __face_name) "")
    ((:face_confidence __face_confidence) 0.0)
    ((:face_detected __face_detected) nil)
    ((:utc_time __utc_time) "")
    ((:latitude __latitude) 0.0)
    ((:longitude __longitude) 0.0)
    ((:lat_direction __lat_direction) "")
    ((:lon_direction __lon_direction) "")
    ((:satellite_count __satellite_count) 0)
    ((:altitude __altitude) 0.0)
    ((:speed_kph __speed_kph) 0.0)
    ((:heading_true __heading_true) 0.0)
    ((:heading_magnetic __heading_magnetic) 0.0)
    ((:cpu_usage __cpu_usage) 0.0)
    ((:memory_usage __memory_usage) 0.0)
    ((:frame_count __frame_count) 0)
    ((:checksum __checksum) 0)
    )
   (send-super :init)
   (setq _header __header)
   (setq _face_name (string __face_name))
   (setq _face_confidence (float __face_confidence))
   (setq _face_detected __face_detected)
   (setq _utc_time (string __utc_time))
   (setq _latitude (float __latitude))
   (setq _longitude (float __longitude))
   (setq _lat_direction (string __lat_direction))
   (setq _lon_direction (string __lon_direction))
   (setq _satellite_count (round __satellite_count))
   (setq _altitude (float __altitude))
   (setq _speed_kph (float __speed_kph))
   (setq _heading_true (float __heading_true))
   (setq _heading_magnetic (float __heading_magnetic))
   (setq _cpu_usage (float __cpu_usage))
   (setq _memory_usage (float __memory_usage))
   (setq _frame_count (round __frame_count))
   (setq _checksum (round __checksum))
   self)
  (:header
   (&rest __header)
   (if (keywordp (car __header))
       (send* _header __header)
     (progn
       (if __header (setq _header (car __header)))
       _header)))
  (:face_name
   (&optional __face_name)
   (if __face_name (setq _face_name __face_name)) _face_name)
  (:face_confidence
   (&optional __face_confidence)
   (if __face_confidence (setq _face_confidence __face_confidence)) _face_confidence)
  (:face_detected
   (&optional __face_detected)
   (if __face_detected (setq _face_detected __face_detected)) _face_detected)
  (:utc_time
   (&optional __utc_time)
   (if __utc_time (setq _utc_time __utc_time)) _utc_time)
  (:latitude
   (&optional __latitude)
   (if __latitude (setq _latitude __latitude)) _latitude)
  (:longitude
   (&optional __longitude)
   (if __longitude (setq _longitude __longitude)) _longitude)
  (:lat_direction
   (&optional __lat_direction)
   (if __lat_direction (setq _lat_direction __lat_direction)) _lat_direction)
  (:lon_direction
   (&optional __lon_direction)
   (if __lon_direction (setq _lon_direction __lon_direction)) _lon_direction)
  (:satellite_count
   (&optional __satellite_count)
   (if __satellite_count (setq _satellite_count __satellite_count)) _satellite_count)
  (:altitude
   (&optional __altitude)
   (if __altitude (setq _altitude __altitude)) _altitude)
  (:speed_kph
   (&optional __speed_kph)
   (if __speed_kph (setq _speed_kph __speed_kph)) _speed_kph)
  (:heading_true
   (&optional __heading_true)
   (if __heading_true (setq _heading_true __heading_true)) _heading_true)
  (:heading_magnetic
   (&optional __heading_magnetic)
   (if __heading_magnetic (setq _heading_magnetic __heading_magnetic)) _heading_magnetic)
  (:cpu_usage
   (&optional __cpu_usage)
   (if __cpu_usage (setq _cpu_usage __cpu_usage)) _cpu_usage)
  (:memory_usage
   (&optional __memory_usage)
   (if __memory_usage (setq _memory_usage __memory_usage)) _memory_usage)
  (:frame_count
   (&optional __frame_count)
   (if __frame_count (setq _frame_count __frame_count)) _frame_count)
  (:checksum
   (&optional __checksum)
   (if __checksum (setq _checksum __checksum)) _checksum)
  (:serialization-length
   ()
   (+
    ;; std_msgs/Header _header
    (send _header :serialization-length)
    ;; string _face_name
    4 (length _face_name)
    ;; float32 _face_confidence
    4
    ;; bool _face_detected
    1
    ;; string _utc_time
    4 (length _utc_time)
    ;; float64 _latitude
    8
    ;; float64 _longitude
    8
    ;; string _lat_direction
    4 (length _lat_direction)
    ;; string _lon_direction
    4 (length _lon_direction)
    ;; uint8 _satellite_count
    1
    ;; float32 _altitude
    4
    ;; float32 _speed_kph
    4
    ;; float32 _heading_true
    4
    ;; float32 _heading_magnetic
    4
    ;; float32 _cpu_usage
    4
    ;; float32 _memory_usage
    4
    ;; uint32 _frame_count
    4
    ;; uint32 _checksum
    4
    ))
  (:serialize
   (&optional strm)
   (let ((s (if strm strm
              (make-string-output-stream (send self :serialization-length)))))
     ;; std_msgs/Header _header
       (send _header :serialize s)
     ;; string _face_name
       (write-long (length _face_name) s) (princ _face_name s)
     ;; float32 _face_confidence
       (sys::poke _face_confidence (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; bool _face_detected
       (if _face_detected (write-byte -1 s) (write-byte 0 s))
     ;; string _utc_time
       (write-long (length _utc_time) s) (princ _utc_time s)
     ;; float64 _latitude
       (sys::poke _latitude (send s :buffer) (send s :count) :double) (incf (stream-count s) 8)
     ;; float64 _longitude
       (sys::poke _longitude (send s :buffer) (send s :count) :double) (incf (stream-count s) 8)
     ;; string _lat_direction
       (write-long (length _lat_direction) s) (princ _lat_direction s)
     ;; string _lon_direction
       (write-long (length _lon_direction) s) (princ _lon_direction s)
     ;; uint8 _satellite_count
       (write-byte _satellite_count s)
     ;; float32 _altitude
       (sys::poke _altitude (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; float32 _speed_kph
       (sys::poke _speed_kph (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; float32 _heading_true
       (sys::poke _heading_true (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; float32 _heading_magnetic
       (sys::poke _heading_magnetic (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; float32 _cpu_usage
       (sys::poke _cpu_usage (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; float32 _memory_usage
       (sys::poke _memory_usage (send s :buffer) (send s :count) :float) (incf (stream-count s) 4)
     ;; uint32 _frame_count
       (write-long _frame_count s)
     ;; uint32 _checksum
       (write-long _checksum s)
     ;;
     (if (null strm) (get-output-stream-string s))))
  (:deserialize
   (buf &optional (ptr- 0))
   ;; std_msgs/Header _header
     (send _header :deserialize buf ptr-) (incf ptr- (send _header :serialization-length))
   ;; string _face_name
     (let (n) (setq n (sys::peek buf ptr- :integer)) (incf ptr- 4) (setq _face_name (subseq buf ptr- (+ ptr- n))) (incf ptr- n))
   ;; float32 _face_confidence
     (setq _face_confidence (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; bool _face_detected
     (setq _face_detected (not (= 0 (sys::peek buf ptr- :char)))) (incf ptr- 1)
   ;; string _utc_time
     (let (n) (setq n (sys::peek buf ptr- :integer)) (incf ptr- 4) (setq _utc_time (subseq buf ptr- (+ ptr- n))) (incf ptr- n))
   ;; float64 _latitude
     (setq _latitude (sys::peek buf ptr- :double)) (incf ptr- 8)
   ;; float64 _longitude
     (setq _longitude (sys::peek buf ptr- :double)) (incf ptr- 8)
   ;; string _lat_direction
     (let (n) (setq n (sys::peek buf ptr- :integer)) (incf ptr- 4) (setq _lat_direction (subseq buf ptr- (+ ptr- n))) (incf ptr- n))
   ;; string _lon_direction
     (let (n) (setq n (sys::peek buf ptr- :integer)) (incf ptr- 4) (setq _lon_direction (subseq buf ptr- (+ ptr- n))) (incf ptr- n))
   ;; uint8 _satellite_count
     (setq _satellite_count (sys::peek buf ptr- :char)) (incf ptr- 1)
   ;; float32 _altitude
     (setq _altitude (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; float32 _speed_kph
     (setq _speed_kph (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; float32 _heading_true
     (setq _heading_true (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; float32 _heading_magnetic
     (setq _heading_magnetic (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; float32 _cpu_usage
     (setq _cpu_usage (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; float32 _memory_usage
     (setq _memory_usage (sys::peek buf ptr- :float)) (incf ptr- 4)
   ;; uint32 _frame_count
     (setq _frame_count (sys::peek buf ptr- :integer)) (incf ptr- 4)
   ;; uint32 _checksum
     (setq _checksum (sys::peek buf ptr- :integer)) (incf ptr- 4)
   ;;
   self)
  )

(setf (get packet_pkg::PacketData :md5sum-) "3537c672e01f284539612933c30ef10e")
(setf (get packet_pkg::PacketData :datatype-) "packet_pkg/PacketData")
(setf (get packet_pkg::PacketData :definition-)
      "Header header

# 人脸识别数据
string face_name
float32 face_confidence
bool face_detected

# GPS数据
string utc_time
float64 latitude
float64 longitude
string lat_direction
string lon_direction
uint8 satellite_count
float32 altitude
float32 speed_kph
float32 heading_true
float32 heading_magnetic

# 系统状态
float32 cpu_usage
float32 memory_usage
uint32 frame_count

# 数据校验
uint32 checksum
================================================================================
MSG: std_msgs/Header
# Standard metadata for higher-level stamped data types.
# This is generally used to communicate timestamped data 
# in a particular coordinate frame.
# 
# sequence ID: consecutively increasing ID 
uint32 seq
#Two-integer timestamp that is expressed as:
# * stamp.sec: seconds (stamp_secs) since epoch (in Python the variable is called 'secs')
# * stamp.nsec: nanoseconds since stamp_secs (in Python the variable is called 'nsecs')
# time-handling sugar is provided by the client library
time stamp
#Frame this data is associated with
string frame_id

")



(provide :packet_pkg/PacketData "3537c672e01f284539612933c30ef10e")


