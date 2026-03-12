; Auto-generated. Do not edit!


(cl:in-package packet_pkg-msg)


;//! \htmlinclude PacketData.msg.html

(cl:defclass <PacketData> (roslisp-msg-protocol:ros-message)
  ((header
    :reader header
    :initarg :header
    :type std_msgs-msg:Header
    :initform (cl:make-instance 'std_msgs-msg:Header))
   (face_name
    :reader face_name
    :initarg :face_name
    :type cl:string
    :initform "")
   (face_confidence
    :reader face_confidence
    :initarg :face_confidence
    :type cl:float
    :initform 0.0)
   (face_detected
    :reader face_detected
    :initarg :face_detected
    :type cl:boolean
    :initform cl:nil)
   (utc_time
    :reader utc_time
    :initarg :utc_time
    :type cl:string
    :initform "")
   (latitude
    :reader latitude
    :initarg :latitude
    :type cl:float
    :initform 0.0)
   (longitude
    :reader longitude
    :initarg :longitude
    :type cl:float
    :initform 0.0)
   (lat_direction
    :reader lat_direction
    :initarg :lat_direction
    :type cl:string
    :initform "")
   (lon_direction
    :reader lon_direction
    :initarg :lon_direction
    :type cl:string
    :initform "")
   (satellite_count
    :reader satellite_count
    :initarg :satellite_count
    :type cl:fixnum
    :initform 0)
   (altitude
    :reader altitude
    :initarg :altitude
    :type cl:float
    :initform 0.0)
   (speed_kph
    :reader speed_kph
    :initarg :speed_kph
    :type cl:float
    :initform 0.0)
   (heading_true
    :reader heading_true
    :initarg :heading_true
    :type cl:float
    :initform 0.0)
   (heading_magnetic
    :reader heading_magnetic
    :initarg :heading_magnetic
    :type cl:float
    :initform 0.0)
   (cpu_usage
    :reader cpu_usage
    :initarg :cpu_usage
    :type cl:float
    :initform 0.0)
   (memory_usage
    :reader memory_usage
    :initarg :memory_usage
    :type cl:float
    :initform 0.0)
   (frame_count
    :reader frame_count
    :initarg :frame_count
    :type cl:integer
    :initform 0)
   (checksum
    :reader checksum
    :initarg :checksum
    :type cl:integer
    :initform 0))
)

(cl:defclass PacketData (<PacketData>)
  ())

(cl:defmethod cl:initialize-instance :after ((m <PacketData>) cl:&rest args)
  (cl:declare (cl:ignorable args))
  (cl:unless (cl:typep m 'PacketData)
    (roslisp-msg-protocol:msg-deprecation-warning "using old message class name packet_pkg-msg:<PacketData> is deprecated: use packet_pkg-msg:PacketData instead.")))

(cl:ensure-generic-function 'header-val :lambda-list '(m))
(cl:defmethod header-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:header-val is deprecated.  Use packet_pkg-msg:header instead.")
  (header m))

(cl:ensure-generic-function 'face_name-val :lambda-list '(m))
(cl:defmethod face_name-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:face_name-val is deprecated.  Use packet_pkg-msg:face_name instead.")
  (face_name m))

(cl:ensure-generic-function 'face_confidence-val :lambda-list '(m))
(cl:defmethod face_confidence-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:face_confidence-val is deprecated.  Use packet_pkg-msg:face_confidence instead.")
  (face_confidence m))

(cl:ensure-generic-function 'face_detected-val :lambda-list '(m))
(cl:defmethod face_detected-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:face_detected-val is deprecated.  Use packet_pkg-msg:face_detected instead.")
  (face_detected m))

(cl:ensure-generic-function 'utc_time-val :lambda-list '(m))
(cl:defmethod utc_time-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:utc_time-val is deprecated.  Use packet_pkg-msg:utc_time instead.")
  (utc_time m))

(cl:ensure-generic-function 'latitude-val :lambda-list '(m))
(cl:defmethod latitude-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:latitude-val is deprecated.  Use packet_pkg-msg:latitude instead.")
  (latitude m))

(cl:ensure-generic-function 'longitude-val :lambda-list '(m))
(cl:defmethod longitude-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:longitude-val is deprecated.  Use packet_pkg-msg:longitude instead.")
  (longitude m))

(cl:ensure-generic-function 'lat_direction-val :lambda-list '(m))
(cl:defmethod lat_direction-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:lat_direction-val is deprecated.  Use packet_pkg-msg:lat_direction instead.")
  (lat_direction m))

(cl:ensure-generic-function 'lon_direction-val :lambda-list '(m))
(cl:defmethod lon_direction-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:lon_direction-val is deprecated.  Use packet_pkg-msg:lon_direction instead.")
  (lon_direction m))

(cl:ensure-generic-function 'satellite_count-val :lambda-list '(m))
(cl:defmethod satellite_count-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:satellite_count-val is deprecated.  Use packet_pkg-msg:satellite_count instead.")
  (satellite_count m))

(cl:ensure-generic-function 'altitude-val :lambda-list '(m))
(cl:defmethod altitude-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:altitude-val is deprecated.  Use packet_pkg-msg:altitude instead.")
  (altitude m))

(cl:ensure-generic-function 'speed_kph-val :lambda-list '(m))
(cl:defmethod speed_kph-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:speed_kph-val is deprecated.  Use packet_pkg-msg:speed_kph instead.")
  (speed_kph m))

(cl:ensure-generic-function 'heading_true-val :lambda-list '(m))
(cl:defmethod heading_true-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:heading_true-val is deprecated.  Use packet_pkg-msg:heading_true instead.")
  (heading_true m))

(cl:ensure-generic-function 'heading_magnetic-val :lambda-list '(m))
(cl:defmethod heading_magnetic-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:heading_magnetic-val is deprecated.  Use packet_pkg-msg:heading_magnetic instead.")
  (heading_magnetic m))

(cl:ensure-generic-function 'cpu_usage-val :lambda-list '(m))
(cl:defmethod cpu_usage-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:cpu_usage-val is deprecated.  Use packet_pkg-msg:cpu_usage instead.")
  (cpu_usage m))

(cl:ensure-generic-function 'memory_usage-val :lambda-list '(m))
(cl:defmethod memory_usage-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:memory_usage-val is deprecated.  Use packet_pkg-msg:memory_usage instead.")
  (memory_usage m))

(cl:ensure-generic-function 'frame_count-val :lambda-list '(m))
(cl:defmethod frame_count-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:frame_count-val is deprecated.  Use packet_pkg-msg:frame_count instead.")
  (frame_count m))

(cl:ensure-generic-function 'checksum-val :lambda-list '(m))
(cl:defmethod checksum-val ((m <PacketData>))
  (roslisp-msg-protocol:msg-deprecation-warning "Using old-style slot reader packet_pkg-msg:checksum-val is deprecated.  Use packet_pkg-msg:checksum instead.")
  (checksum m))
(cl:defmethod roslisp-msg-protocol:serialize ((msg <PacketData>) ostream)
  "Serializes a message object of type '<PacketData>"
  (roslisp-msg-protocol:serialize (cl:slot-value msg 'header) ostream)
  (cl:let ((__ros_str_len (cl:length (cl:slot-value msg 'face_name))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) __ros_str_len) ostream))
  (cl:map cl:nil #'(cl:lambda (c) (cl:write-byte (cl:char-code c) ostream)) (cl:slot-value msg 'face_name))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'face_confidence))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:write-byte (cl:ldb (cl:byte 8 0) (cl:if (cl:slot-value msg 'face_detected) 1 0)) ostream)
  (cl:let ((__ros_str_len (cl:length (cl:slot-value msg 'utc_time))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) __ros_str_len) ostream))
  (cl:map cl:nil #'(cl:lambda (c) (cl:write-byte (cl:char-code c) ostream)) (cl:slot-value msg 'utc_time))
  (cl:let ((bits (roslisp-utils:encode-double-float-bits (cl:slot-value msg 'latitude))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 32) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 40) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 48) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 56) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-double-float-bits (cl:slot-value msg 'longitude))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 32) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 40) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 48) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 56) bits) ostream))
  (cl:let ((__ros_str_len (cl:length (cl:slot-value msg 'lat_direction))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) __ros_str_len) ostream))
  (cl:map cl:nil #'(cl:lambda (c) (cl:write-byte (cl:char-code c) ostream)) (cl:slot-value msg 'lat_direction))
  (cl:let ((__ros_str_len (cl:length (cl:slot-value msg 'lon_direction))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) __ros_str_len) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) __ros_str_len) ostream))
  (cl:map cl:nil #'(cl:lambda (c) (cl:write-byte (cl:char-code c) ostream)) (cl:slot-value msg 'lon_direction))
  (cl:write-byte (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'satellite_count)) ostream)
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'altitude))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'speed_kph))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'heading_true))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'heading_magnetic))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'cpu_usage))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:let ((bits (roslisp-utils:encode-single-float-bits (cl:slot-value msg 'memory_usage))))
    (cl:write-byte (cl:ldb (cl:byte 8 0) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 8) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 16) bits) ostream)
    (cl:write-byte (cl:ldb (cl:byte 8 24) bits) ostream))
  (cl:write-byte (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'frame_count)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 8) (cl:slot-value msg 'frame_count)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 16) (cl:slot-value msg 'frame_count)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 24) (cl:slot-value msg 'frame_count)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'checksum)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 8) (cl:slot-value msg 'checksum)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 16) (cl:slot-value msg 'checksum)) ostream)
  (cl:write-byte (cl:ldb (cl:byte 8 24) (cl:slot-value msg 'checksum)) ostream)
)
(cl:defmethod roslisp-msg-protocol:deserialize ((msg <PacketData>) istream)
  "Deserializes a message object of type '<PacketData>"
  (roslisp-msg-protocol:deserialize (cl:slot-value msg 'header) istream)
    (cl:let ((__ros_str_len 0))
      (cl:setf (cl:ldb (cl:byte 8 0) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:slot-value msg 'face_name) (cl:make-string __ros_str_len))
      (cl:dotimes (__ros_str_idx __ros_str_len msg)
        (cl:setf (cl:char (cl:slot-value msg 'face_name) __ros_str_idx) (cl:code-char (cl:read-byte istream)))))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'face_confidence) (roslisp-utils:decode-single-float-bits bits)))
    (cl:setf (cl:slot-value msg 'face_detected) (cl:not (cl:zerop (cl:read-byte istream))))
    (cl:let ((__ros_str_len 0))
      (cl:setf (cl:ldb (cl:byte 8 0) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:slot-value msg 'utc_time) (cl:make-string __ros_str_len))
      (cl:dotimes (__ros_str_idx __ros_str_len msg)
        (cl:setf (cl:char (cl:slot-value msg 'utc_time) __ros_str_idx) (cl:code-char (cl:read-byte istream)))))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 32) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 40) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 48) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 56) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'latitude) (roslisp-utils:decode-double-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 32) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 40) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 48) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 56) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'longitude) (roslisp-utils:decode-double-float-bits bits)))
    (cl:let ((__ros_str_len 0))
      (cl:setf (cl:ldb (cl:byte 8 0) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:slot-value msg 'lat_direction) (cl:make-string __ros_str_len))
      (cl:dotimes (__ros_str_idx __ros_str_len msg)
        (cl:setf (cl:char (cl:slot-value msg 'lat_direction) __ros_str_idx) (cl:code-char (cl:read-byte istream)))))
    (cl:let ((__ros_str_len 0))
      (cl:setf (cl:ldb (cl:byte 8 0) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) __ros_str_len) (cl:read-byte istream))
      (cl:setf (cl:slot-value msg 'lon_direction) (cl:make-string __ros_str_len))
      (cl:dotimes (__ros_str_idx __ros_str_len msg)
        (cl:setf (cl:char (cl:slot-value msg 'lon_direction) __ros_str_idx) (cl:code-char (cl:read-byte istream)))))
    (cl:setf (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'satellite_count)) (cl:read-byte istream))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'altitude) (roslisp-utils:decode-single-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'speed_kph) (roslisp-utils:decode-single-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'heading_true) (roslisp-utils:decode-single-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'heading_magnetic) (roslisp-utils:decode-single-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'cpu_usage) (roslisp-utils:decode-single-float-bits bits)))
    (cl:let ((bits 0))
      (cl:setf (cl:ldb (cl:byte 8 0) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 8) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 16) bits) (cl:read-byte istream))
      (cl:setf (cl:ldb (cl:byte 8 24) bits) (cl:read-byte istream))
    (cl:setf (cl:slot-value msg 'memory_usage) (roslisp-utils:decode-single-float-bits bits)))
    (cl:setf (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'frame_count)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 8) (cl:slot-value msg 'frame_count)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 16) (cl:slot-value msg 'frame_count)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 24) (cl:slot-value msg 'frame_count)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 0) (cl:slot-value msg 'checksum)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 8) (cl:slot-value msg 'checksum)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 16) (cl:slot-value msg 'checksum)) (cl:read-byte istream))
    (cl:setf (cl:ldb (cl:byte 8 24) (cl:slot-value msg 'checksum)) (cl:read-byte istream))
  msg
)
(cl:defmethod roslisp-msg-protocol:ros-datatype ((msg (cl:eql '<PacketData>)))
  "Returns string type for a message object of type '<PacketData>"
  "packet_pkg/PacketData")
(cl:defmethod roslisp-msg-protocol:ros-datatype ((msg (cl:eql 'PacketData)))
  "Returns string type for a message object of type 'PacketData"
  "packet_pkg/PacketData")
(cl:defmethod roslisp-msg-protocol:md5sum ((type (cl:eql '<PacketData>)))
  "Returns md5sum for a message object of type '<PacketData>"
  "3537c672e01f284539612933c30ef10e")
(cl:defmethod roslisp-msg-protocol:md5sum ((type (cl:eql 'PacketData)))
  "Returns md5sum for a message object of type 'PacketData"
  "3537c672e01f284539612933c30ef10e")
(cl:defmethod roslisp-msg-protocol:message-definition ((type (cl:eql '<PacketData>)))
  "Returns full string definition for message of type '<PacketData>"
  (cl:format cl:nil "Header header~%~%# 人脸识别数据~%string face_name~%float32 face_confidence~%bool face_detected~%~%# GPS数据~%string utc_time~%float64 latitude~%float64 longitude~%string lat_direction~%string lon_direction~%uint8 satellite_count~%float32 altitude~%float32 speed_kph~%float32 heading_true~%float32 heading_magnetic~%~%# 系统状态~%float32 cpu_usage~%float32 memory_usage~%uint32 frame_count~%~%# 数据校验~%uint32 checksum~%================================================================================~%MSG: std_msgs/Header~%# Standard metadata for higher-level stamped data types.~%# This is generally used to communicate timestamped data ~%# in a particular coordinate frame.~%# ~%# sequence ID: consecutively increasing ID ~%uint32 seq~%#Two-integer timestamp that is expressed as:~%# * stamp.sec: seconds (stamp_secs) since epoch (in Python the variable is called 'secs')~%# * stamp.nsec: nanoseconds since stamp_secs (in Python the variable is called 'nsecs')~%# time-handling sugar is provided by the client library~%time stamp~%#Frame this data is associated with~%string frame_id~%~%~%"))
(cl:defmethod roslisp-msg-protocol:message-definition ((type (cl:eql 'PacketData)))
  "Returns full string definition for message of type 'PacketData"
  (cl:format cl:nil "Header header~%~%# 人脸识别数据~%string face_name~%float32 face_confidence~%bool face_detected~%~%# GPS数据~%string utc_time~%float64 latitude~%float64 longitude~%string lat_direction~%string lon_direction~%uint8 satellite_count~%float32 altitude~%float32 speed_kph~%float32 heading_true~%float32 heading_magnetic~%~%# 系统状态~%float32 cpu_usage~%float32 memory_usage~%uint32 frame_count~%~%# 数据校验~%uint32 checksum~%================================================================================~%MSG: std_msgs/Header~%# Standard metadata for higher-level stamped data types.~%# This is generally used to communicate timestamped data ~%# in a particular coordinate frame.~%# ~%# sequence ID: consecutively increasing ID ~%uint32 seq~%#Two-integer timestamp that is expressed as:~%# * stamp.sec: seconds (stamp_secs) since epoch (in Python the variable is called 'secs')~%# * stamp.nsec: nanoseconds since stamp_secs (in Python the variable is called 'nsecs')~%# time-handling sugar is provided by the client library~%time stamp~%#Frame this data is associated with~%string frame_id~%~%~%"))
(cl:defmethod roslisp-msg-protocol:serialization-length ((msg <PacketData>))
  (cl:+ 0
     (roslisp-msg-protocol:serialization-length (cl:slot-value msg 'header))
     4 (cl:length (cl:slot-value msg 'face_name))
     4
     1
     4 (cl:length (cl:slot-value msg 'utc_time))
     8
     8
     4 (cl:length (cl:slot-value msg 'lat_direction))
     4 (cl:length (cl:slot-value msg 'lon_direction))
     1
     4
     4
     4
     4
     4
     4
     4
     4
))
(cl:defmethod roslisp-msg-protocol:ros-message-to-list ((msg <PacketData>))
  "Converts a ROS message object to a list"
  (cl:list 'PacketData
    (cl:cons ':header (header msg))
    (cl:cons ':face_name (face_name msg))
    (cl:cons ':face_confidence (face_confidence msg))
    (cl:cons ':face_detected (face_detected msg))
    (cl:cons ':utc_time (utc_time msg))
    (cl:cons ':latitude (latitude msg))
    (cl:cons ':longitude (longitude msg))
    (cl:cons ':lat_direction (lat_direction msg))
    (cl:cons ':lon_direction (lon_direction msg))
    (cl:cons ':satellite_count (satellite_count msg))
    (cl:cons ':altitude (altitude msg))
    (cl:cons ':speed_kph (speed_kph msg))
    (cl:cons ':heading_true (heading_true msg))
    (cl:cons ':heading_magnetic (heading_magnetic msg))
    (cl:cons ':cpu_usage (cpu_usage msg))
    (cl:cons ':memory_usage (memory_usage msg))
    (cl:cons ':frame_count (frame_count msg))
    (cl:cons ':checksum (checksum msg))
))
