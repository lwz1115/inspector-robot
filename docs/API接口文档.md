# API 接口文档

> 服务地址：`http://localhost:8080`  
> 所有接口均以 `/api` 为前缀，跨域已全局放行，无需认证。

---

## 认证模块 `/api/auth`

### 用户登录
- **POST** `/api/auth/login`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

```json
{ "success": true, "message": "登录成功", "user": "admin", "userId": 1 }
```

### 用户注册
- **POST** `/api/auth/register`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |
| phone | string | ✅ | 手机号 |
| nickname | string | ❌ | 昵称 |

### 退出登录
- **POST** `/api/auth/logout`

---

## 机器人数据 `/api/robot-data`

### 获取最新 100 条
- **GET** `/api/robot-data`

### 按设备 ID 查询
- **GET** `/api/robot-data/device/{deviceId}`

### 获取最新一条
- **GET** `/api/robot-data/latest`

### 获取警报数据
- **GET** `/api/robot-data/alerts`

### 按时间范围查询
- **GET** `/api/robot-data/time-range?start=<ms>&end=<ms>`

### HTTP 节点推送数据（Jetson → Spring Boot）
- **POST** `/api/robot-data/push`
- Body（JSON）：

```json
{
  "device_id": "find_robot",
  "timestamp": 1710000000000,
  "voltage": 11.8,
  "latitude": 32.123016,
  "longitude": 118.930692,
  "satellites": 8,
  "altitude": 12.5,
  "speed": 0.5,
  "alert_message": "识别到: 张三"
}
```

> 由 Jetson 上的 `http_node.py` 每 5 秒自动调用，后端地址配置在 `http_node.py` 的 `BACKEND_URL`。

---

## 目的地控制 `/api/destination`

### 发送目的地坐标
- **POST** `/api/destination/set`
- Body（JSON）：

```json
{ "longitude": 118.930692, "latitude": 32.123016, "name": "目标点" }
```

```json
{ "success": true, "message": "目的地坐标已发送到机器人" }
```

### 查询连接状态
- **GET** `/api/destination/status`

---

## 摄像头 `/api/camera`

### 获取流地址信息
- **GET** `/api/camera/info`

```json
{
  "mjpeg":    "http://192.168.2.235:8081/stream?topic=/image&quality=25&width=320&height=240",
  "mjpeg_hd": "http://192.168.2.235:8081/stream?topic=/image&quality=50&width=640&height=480",
  "snapshot": "http://192.168.2.235:8081/snapshot?topic=/image"
}
```

### 直连 Jetson 视频流（推荐）
前端直接访问，无需经过 Spring Boot：
```
http://192.168.2.235:8081/stream?topic=/image&width=640&height=480&quality=50&framerate=15
```

| 参数 | 说明 | 默认 |
|------|------|------|
| topic | ROS 图像话题 | `/image` |
| width / height | 分辨率 | 320 / 240 |
| quality | 画质 1-100 | 25 |
| framerate | 帧率上限 | 不限 |

---

## 人脸识别 `/api/face`

> 依赖 Jetson 上运行 `roslaunch camera_pkg face.launch`（含 rosbridge 端口 9090）

### 订阅事件流（SSE）
- **GET** `/api/face/events`
- 前端用 `EventSource` 接收，`Content-Type: text/event-stream`

事件格式（event name: `face`）：

```json
// 识别结果
{ "type": "face", "name": "张三", "confidence": 85.3, "frames": 15, "timestamp": 1710000000000, "known": true }

// 训练进度
{ "type": "train", "status": "progress", "name": "张三", "detail": "15/30" }
{ "type": "train", "status": "done",     "name": "张三" }
{ "type": "train", "status": "error",    "detail": "错误信息" }

// 节点状态
{ "type": "node_status", "status": "running" }
{ "type": "node_status", "status": "stopped" }
```

### 启动人脸识别
- **POST** `/api/face/start`

```json
{ "success": true, "message": "人脸识别已启动" }
```

### 停止人脸识别
- **POST** `/api/face/stop`

### 开始人脸训练
- **POST** `/api/face/train/start`
- Body（JSON）：

```json
{ "name": "张三" }
```

进度通过 SSE `/api/face/events` 实时推送，采集 30 张后自动完成。

### 停止人脸训练
- **POST** `/api/face/train/stop`

### 查询 SSE 连接数
- **GET** `/api/face/status`

```json
{ "connections": 1, "status": "ok" }
```

---

## 位置服务 `/api/location`

### 逆地理编码
- **POST** `/api/location/reverse-geocode`

```json
{ "longitude": 118.930692, "latitude": 32.123016 }
```

### 关键字搜索 POI
- **POST** `/api/location/search`

### 周边搜索
- **GET** `/api/location/around?longitude=&latitude=&radius=3000&keyword=`

### 输入提示
- **GET** `/api/location/input-tips?keywords=南京&city=南京`

---

## 路线规划

### 高德步行路线（前端直调）
```
GET https://restapi.amap.com/v3/direction/walking
  ?origin=<lng,lat>
  &destination=<lng,lat>
  &key=c216de193661bf95f9891763d1837c8f
```

---

## 端口一览

| 服务 | 地址 | 说明 |
|------|------|------|
| Spring Boot | `localhost:8080` | 后端 API + 静态页面 |
| web_video_server | `192.168.2.235:8081` | Jetson MJPEG 视频流 |
| rosbridge | `192.168.2.235:9090` | ROS WebSocket 桥接 |
