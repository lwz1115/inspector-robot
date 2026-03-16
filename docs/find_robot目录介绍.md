# find_robot 项目目录介绍

> Spring Boot 后端 + 静态前端，端口 8080  
> 访问地址：`http://localhost:8080`

---

## 项目结构总览

```
find_robot/
├── pom.xml                          # Maven 依赖配置
└── src/main/
    ├── java/com/example/find_robot/
    │   ├── FindRobotApplication.java
    │   ├── config/                  # 配置类
    │   ├── controller/              # REST 接口
    │   ├── entity/                  # 数据实体
    │   ├── repository/              # MyBatis-Plus Mapper
    │   └── service/                 # 业务逻辑
    └── resources/
        ├── application.properties   # 应用配置
        └── static/                  # 前端静态文件
            ├── index.html           # 主页面
            ├── login.html           # 登录页
            └── register.html        # 注册页
```

---

## config/ 配置类

| 文件 | 说明 |
|------|------|
| `SecurityConfig.java` | Spring Security 配置，全部放行，禁用 CSRF，禁用 X-Frame-Options |
| `AmapConfig.java` | 高德地图 API Key 配置 |
| `MyBatisPlusConfig.java` | MyBatis-Plus 分页插件配置 |

---

## controller/ 接口层

| 文件 | 路径前缀 | 说明 |
|------|----------|------|
| `RobotDataController.java` | `/api/robot-data` | 机器人数据查询、HTTP 推送接收 |
| `FaceEventController.java` | `/api/face` | 人脸识别 SSE 事件流、启停控制、训练控制 |
| `CameraController.java` | `/api/camera` | 摄像头流地址信息 |
| `StreamProxyController.java` | `/api/camera/stream` | MJPEG 流反向代理（解决跨域备用） |
| `DestinationController.java` | `/api/destination` | 发送目的地坐标到机器人 |
| `LocationController.java` | `/api/location` | 高德地图 POI 搜索、逆地理编码、周边搜索 |
| `RouteController.java` | `/api/route` | 路线规划（模拟） |
| `RegisterController.java` | `/api/auth` | 用户登录、注册、退出 |
| `CaptchaController.java` | `/api/auth/captcha` | 验证码图片生成 |
| `TestController.java` | `/api/test` | 服务存活检测 |

---

## entity/ 数据实体

| 文件 | 说明 |
|------|------|
| `RobotData.java` | 机器人上报数据（GPS、电压、速度、警报等），对应数据库表 |
| `User.java` | 用户实体（用户名、密码、手机号） |
| `Location.java` | 位置坐标实体 |
| `LocationSearchDTO.java` | POI 搜索请求参数 |
| `ReverseGeocodeDTO.java` | 逆地理编码请求参数 |
| `AmapResponse.java` | 高德 API 响应封装 |

---

## repository/ 数据访问层

| 文件 | 说明 |
|------|------|
| `RobotDataMapper.java` | MyBatis-Plus Mapper，操作机器人数据表 |
| `UserMapper.java` | MyBatis-Plus Mapper，操作用户表 |

---

## service/ 业务层

| 文件 | 说明 |
|------|------|
| `RobotDataService.java` / `impl/` | 机器人数据增删查业务 |
| `UserService.java` / `impl/` | 用户登录注册业务，BCrypt 密码加密 |
| `LocationService.java` / `impl/` | 调用高德 REST API 的位置服务 |
| `RosbridgeSubscriber.java` | 连接 Jetson rosbridge（ws://192.168.2.235:9090），订阅人脸识别和训练 topic，转发给 SSE |
| `FaceEventBroadcaster.java` | SSE 广播器，维护所有前端 SSE 连接，推送人脸事件 |
| `MqttRobotSubscriber.java` | 原阿里云 MQTT 订阅（已禁用），保留类结构 |

---

## static/ 前端页面

| 文件 | 说明 |
|------|------|
| `index.html` | 主控制台，侧边栏导航，包含数据监控、视频监控、位置检测、设备控制四个页面 |
| `login.html` | 登录页 |
| `register.html` | 注册页 |

### index.html 功能模块

| 模块 | 说明 |
|------|------|
| 数据监控 | 轮询 `/api/robot-data`，展示 GPS、电压、速度、卫星数、警报 |
| 视频监控 | 直连 `http://192.168.2.235:8081` MJPEG 流，支持分辨率切换，人脸识别叠加显示 |
| 位置检测 | 高德地图展示机器人实时位置，支持步行路线规划和目的地发送 |
| 设备控制 | 预留，开发中 |

---

## application.properties 关键配置

```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/lwz
camera.stream.url=http://192.168.2.235:8081
rosbridge.url=ws://192.168.2.235:9090
```

---

## 数据流向

```
Jetson http_node.py
  └─ POST /api/robot-data/push ──► 数据库 ──► GET /api/robot-data ──► 前端数据监控

Jetson rosbridge :9090
  └─ RosbridgeSubscriber ──► FaceEventBroadcaster ──► SSE /api/face/events ──► 前端视频监控

前端视频监控
  └─ 直连 http://192.168.2.235:8081/stream?topic=/image ──► 画面显示
```
