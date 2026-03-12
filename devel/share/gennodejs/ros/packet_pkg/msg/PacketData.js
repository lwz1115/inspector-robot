// Auto-generated. Do not edit!

// (in-package packet_pkg.msg)


"use strict";

const _serializer = _ros_msg_utils.Serialize;
const _arraySerializer = _serializer.Array;
const _deserializer = _ros_msg_utils.Deserialize;
const _arrayDeserializer = _deserializer.Array;
const _finder = _ros_msg_utils.Find;
const _getByteLength = _ros_msg_utils.getByteLength;
let std_msgs = _finder('std_msgs');

//-----------------------------------------------------------

class PacketData {
  constructor(initObj={}) {
    if (initObj === null) {
      // initObj === null is a special case for deserialization where we don't initialize fields
      this.header = null;
      this.face_name = null;
      this.face_confidence = null;
      this.face_detected = null;
      this.utc_time = null;
      this.latitude = null;
      this.longitude = null;
      this.lat_direction = null;
      this.lon_direction = null;
      this.satellite_count = null;
      this.altitude = null;
      this.speed_kph = null;
      this.heading_true = null;
      this.heading_magnetic = null;
      this.cpu_usage = null;
      this.memory_usage = null;
      this.frame_count = null;
      this.checksum = null;
    }
    else {
      if (initObj.hasOwnProperty('header')) {
        this.header = initObj.header
      }
      else {
        this.header = new std_msgs.msg.Header();
      }
      if (initObj.hasOwnProperty('face_name')) {
        this.face_name = initObj.face_name
      }
      else {
        this.face_name = '';
      }
      if (initObj.hasOwnProperty('face_confidence')) {
        this.face_confidence = initObj.face_confidence
      }
      else {
        this.face_confidence = 0.0;
      }
      if (initObj.hasOwnProperty('face_detected')) {
        this.face_detected = initObj.face_detected
      }
      else {
        this.face_detected = false;
      }
      if (initObj.hasOwnProperty('utc_time')) {
        this.utc_time = initObj.utc_time
      }
      else {
        this.utc_time = '';
      }
      if (initObj.hasOwnProperty('latitude')) {
        this.latitude = initObj.latitude
      }
      else {
        this.latitude = 0.0;
      }
      if (initObj.hasOwnProperty('longitude')) {
        this.longitude = initObj.longitude
      }
      else {
        this.longitude = 0.0;
      }
      if (initObj.hasOwnProperty('lat_direction')) {
        this.lat_direction = initObj.lat_direction
      }
      else {
        this.lat_direction = '';
      }
      if (initObj.hasOwnProperty('lon_direction')) {
        this.lon_direction = initObj.lon_direction
      }
      else {
        this.lon_direction = '';
      }
      if (initObj.hasOwnProperty('satellite_count')) {
        this.satellite_count = initObj.satellite_count
      }
      else {
        this.satellite_count = 0;
      }
      if (initObj.hasOwnProperty('altitude')) {
        this.altitude = initObj.altitude
      }
      else {
        this.altitude = 0.0;
      }
      if (initObj.hasOwnProperty('speed_kph')) {
        this.speed_kph = initObj.speed_kph
      }
      else {
        this.speed_kph = 0.0;
      }
      if (initObj.hasOwnProperty('heading_true')) {
        this.heading_true = initObj.heading_true
      }
      else {
        this.heading_true = 0.0;
      }
      if (initObj.hasOwnProperty('heading_magnetic')) {
        this.heading_magnetic = initObj.heading_magnetic
      }
      else {
        this.heading_magnetic = 0.0;
      }
      if (initObj.hasOwnProperty('cpu_usage')) {
        this.cpu_usage = initObj.cpu_usage
      }
      else {
        this.cpu_usage = 0.0;
      }
      if (initObj.hasOwnProperty('memory_usage')) {
        this.memory_usage = initObj.memory_usage
      }
      else {
        this.memory_usage = 0.0;
      }
      if (initObj.hasOwnProperty('frame_count')) {
        this.frame_count = initObj.frame_count
      }
      else {
        this.frame_count = 0;
      }
      if (initObj.hasOwnProperty('checksum')) {
        this.checksum = initObj.checksum
      }
      else {
        this.checksum = 0;
      }
    }
  }

  static serialize(obj, buffer, bufferOffset) {
    // Serializes a message object of type PacketData
    // Serialize message field [header]
    bufferOffset = std_msgs.msg.Header.serialize(obj.header, buffer, bufferOffset);
    // Serialize message field [face_name]
    bufferOffset = _serializer.string(obj.face_name, buffer, bufferOffset);
    // Serialize message field [face_confidence]
    bufferOffset = _serializer.float32(obj.face_confidence, buffer, bufferOffset);
    // Serialize message field [face_detected]
    bufferOffset = _serializer.bool(obj.face_detected, buffer, bufferOffset);
    // Serialize message field [utc_time]
    bufferOffset = _serializer.string(obj.utc_time, buffer, bufferOffset);
    // Serialize message field [latitude]
    bufferOffset = _serializer.float64(obj.latitude, buffer, bufferOffset);
    // Serialize message field [longitude]
    bufferOffset = _serializer.float64(obj.longitude, buffer, bufferOffset);
    // Serialize message field [lat_direction]
    bufferOffset = _serializer.string(obj.lat_direction, buffer, bufferOffset);
    // Serialize message field [lon_direction]
    bufferOffset = _serializer.string(obj.lon_direction, buffer, bufferOffset);
    // Serialize message field [satellite_count]
    bufferOffset = _serializer.uint8(obj.satellite_count, buffer, bufferOffset);
    // Serialize message field [altitude]
    bufferOffset = _serializer.float32(obj.altitude, buffer, bufferOffset);
    // Serialize message field [speed_kph]
    bufferOffset = _serializer.float32(obj.speed_kph, buffer, bufferOffset);
    // Serialize message field [heading_true]
    bufferOffset = _serializer.float32(obj.heading_true, buffer, bufferOffset);
    // Serialize message field [heading_magnetic]
    bufferOffset = _serializer.float32(obj.heading_magnetic, buffer, bufferOffset);
    // Serialize message field [cpu_usage]
    bufferOffset = _serializer.float32(obj.cpu_usage, buffer, bufferOffset);
    // Serialize message field [memory_usage]
    bufferOffset = _serializer.float32(obj.memory_usage, buffer, bufferOffset);
    // Serialize message field [frame_count]
    bufferOffset = _serializer.uint32(obj.frame_count, buffer, bufferOffset);
    // Serialize message field [checksum]
    bufferOffset = _serializer.uint32(obj.checksum, buffer, bufferOffset);
    return bufferOffset;
  }

  static deserialize(buffer, bufferOffset=[0]) {
    //deserializes a message object of type PacketData
    let len;
    let data = new PacketData(null);
    // Deserialize message field [header]
    data.header = std_msgs.msg.Header.deserialize(buffer, bufferOffset);
    // Deserialize message field [face_name]
    data.face_name = _deserializer.string(buffer, bufferOffset);
    // Deserialize message field [face_confidence]
    data.face_confidence = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [face_detected]
    data.face_detected = _deserializer.bool(buffer, bufferOffset);
    // Deserialize message field [utc_time]
    data.utc_time = _deserializer.string(buffer, bufferOffset);
    // Deserialize message field [latitude]
    data.latitude = _deserializer.float64(buffer, bufferOffset);
    // Deserialize message field [longitude]
    data.longitude = _deserializer.float64(buffer, bufferOffset);
    // Deserialize message field [lat_direction]
    data.lat_direction = _deserializer.string(buffer, bufferOffset);
    // Deserialize message field [lon_direction]
    data.lon_direction = _deserializer.string(buffer, bufferOffset);
    // Deserialize message field [satellite_count]
    data.satellite_count = _deserializer.uint8(buffer, bufferOffset);
    // Deserialize message field [altitude]
    data.altitude = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [speed_kph]
    data.speed_kph = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [heading_true]
    data.heading_true = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [heading_magnetic]
    data.heading_magnetic = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [cpu_usage]
    data.cpu_usage = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [memory_usage]
    data.memory_usage = _deserializer.float32(buffer, bufferOffset);
    // Deserialize message field [frame_count]
    data.frame_count = _deserializer.uint32(buffer, bufferOffset);
    // Deserialize message field [checksum]
    data.checksum = _deserializer.uint32(buffer, bufferOffset);
    return data;
  }

  static getMessageSize(object) {
    let length = 0;
    length += std_msgs.msg.Header.getMessageSize(object.header);
    length += object.face_name.length;
    length += object.utc_time.length;
    length += object.lat_direction.length;
    length += object.lon_direction.length;
    return length + 70;
  }

  static datatype() {
    // Returns string type for a message object
    return 'packet_pkg/PacketData';
  }

  static md5sum() {
    //Returns md5sum for a message object
    return '3537c672e01f284539612933c30ef10e';
  }

  static messageDefinition() {
    // Returns full string definition for message
    return `
    Header header
    
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
    
    `;
  }

  static Resolve(msg) {
    // deep-construct a valid message object instance of whatever was passed in
    if (typeof msg !== 'object' || msg === null) {
      msg = {};
    }
    const resolved = new PacketData(null);
    if (msg.header !== undefined) {
      resolved.header = std_msgs.msg.Header.Resolve(msg.header)
    }
    else {
      resolved.header = new std_msgs.msg.Header()
    }

    if (msg.face_name !== undefined) {
      resolved.face_name = msg.face_name;
    }
    else {
      resolved.face_name = ''
    }

    if (msg.face_confidence !== undefined) {
      resolved.face_confidence = msg.face_confidence;
    }
    else {
      resolved.face_confidence = 0.0
    }

    if (msg.face_detected !== undefined) {
      resolved.face_detected = msg.face_detected;
    }
    else {
      resolved.face_detected = false
    }

    if (msg.utc_time !== undefined) {
      resolved.utc_time = msg.utc_time;
    }
    else {
      resolved.utc_time = ''
    }

    if (msg.latitude !== undefined) {
      resolved.latitude = msg.latitude;
    }
    else {
      resolved.latitude = 0.0
    }

    if (msg.longitude !== undefined) {
      resolved.longitude = msg.longitude;
    }
    else {
      resolved.longitude = 0.0
    }

    if (msg.lat_direction !== undefined) {
      resolved.lat_direction = msg.lat_direction;
    }
    else {
      resolved.lat_direction = ''
    }

    if (msg.lon_direction !== undefined) {
      resolved.lon_direction = msg.lon_direction;
    }
    else {
      resolved.lon_direction = ''
    }

    if (msg.satellite_count !== undefined) {
      resolved.satellite_count = msg.satellite_count;
    }
    else {
      resolved.satellite_count = 0
    }

    if (msg.altitude !== undefined) {
      resolved.altitude = msg.altitude;
    }
    else {
      resolved.altitude = 0.0
    }

    if (msg.speed_kph !== undefined) {
      resolved.speed_kph = msg.speed_kph;
    }
    else {
      resolved.speed_kph = 0.0
    }

    if (msg.heading_true !== undefined) {
      resolved.heading_true = msg.heading_true;
    }
    else {
      resolved.heading_true = 0.0
    }

    if (msg.heading_magnetic !== undefined) {
      resolved.heading_magnetic = msg.heading_magnetic;
    }
    else {
      resolved.heading_magnetic = 0.0
    }

    if (msg.cpu_usage !== undefined) {
      resolved.cpu_usage = msg.cpu_usage;
    }
    else {
      resolved.cpu_usage = 0.0
    }

    if (msg.memory_usage !== undefined) {
      resolved.memory_usage = msg.memory_usage;
    }
    else {
      resolved.memory_usage = 0.0
    }

    if (msg.frame_count !== undefined) {
      resolved.frame_count = msg.frame_count;
    }
    else {
      resolved.frame_count = 0
    }

    if (msg.checksum !== undefined) {
      resolved.checksum = msg.checksum;
    }
    else {
      resolved.checksum = 0
    }

    return resolved;
    }
};

module.exports = PacketData;
