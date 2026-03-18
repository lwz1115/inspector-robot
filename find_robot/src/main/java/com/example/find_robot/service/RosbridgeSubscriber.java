package com.example.find_robot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.ByteBuffer;
import java.util.concurrent.*;

/**
 * 连接 Jetson rosbridge_server (ws://IP:9090)
 * - 订阅 /recognized_face_name → SSE 推送识别结果
 * - 订阅 /face_train_status    → SSE 推送训练进度
 * - 提供 publish() 方法向 /face_cmd / /face_train_cmd 发布命令
 */
@Service
public class RosbridgeSubscriber {

    private static final Logger log = LoggerFactory.getLogger(RosbridgeSubscriber.class);

    @Value("${rosbridge.url:ws://10.234.236.100:9090}")
    private String rosbridgeUrl;

    private final FaceEventBroadcaster broadcaster;
    private final ObjectMapper mapper = new ObjectMapper();

    private WebSocket ws;
    private volatile boolean running = true;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    // 等待 WS 就绪的队列（connect 是异步的）
    private final BlockingQueue<Boolean> readySignal = new LinkedBlockingQueue<>(1);

    public RosbridgeSubscriber(FaceEventBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @PostConstruct
    public void start() {
        scheduler.schedule(this::connect, 3, TimeUnit.SECONDS);
    }

    // ── 连接 ──────────────────────────────────────────────
    private void connect() {
        if (!running) return;
        readySignal.clear();
        try {
            log.info("连接 rosbridge: {}", rosbridgeUrl);
            ws = HttpClient.newHttpClient()
                    .newWebSocketBuilder()
                    .buildAsync(URI.create(rosbridgeUrl), new WsListener())
                    .get(10, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("rosbridge 连接失败: {}，10s 后重试", e.getMessage());
            scheduler.schedule(this::connect, 10, TimeUnit.SECONDS);
        }
    }

    // ── 订阅 topic ────────────────────────────────────────
    private void subscribeAll(WebSocket webSocket) {
        subscribeTopic(webSocket, "/recognized_face_name", "std_msgs/String");
        subscribeTopic(webSocket, "/face_train_status",    "std_msgs/String");
        subscribeTopic(webSocket, "/face_node_status",     "std_msgs/String");
    }

    private void subscribeTopic(WebSocket webSocket, String topic, String type) {
        try {
            ObjectNode msg = mapper.createObjectNode();
            msg.put("op",    "subscribe");
            msg.put("topic", topic);
            msg.put("type",  type);
            webSocket.sendText(mapper.writeValueAsString(msg), true);
            log.info("已订阅 {}", topic);
        } catch (Exception e) {
            log.error("订阅 {} 失败: {}", topic, e.getMessage());
        }
    }

    // ── 发布命令到 ROS topic（供 Controller 调用）─────────
    public boolean publish(String topic, String type, String data) {
        if (ws == null) {
            log.warn("rosbridge 未连接，无法发布到 {}", topic);
            return false;
        }
        try {
            ObjectNode msgNode = mapper.createObjectNode();
            msgNode.put("data", data);

            ObjectNode frame = mapper.createObjectNode();
            frame.put("op",    "publish");
            frame.put("topic", topic);
            frame.put("type",  type);
            frame.set("msg",   msgNode);

            ws.sendText(mapper.writeValueAsString(frame), true);
            log.info("发布到 {}: {}", topic, data);
            return true;
        } catch (Exception e) {
            log.error("发布失败: {}", e.getMessage());
            return false;
        }
    }

    /** 发送人脸识别命令 */
    public boolean sendFaceCmd(String cmd) {
        return publish("/face_cmd", "std_msgs/String", cmd);
    }

    /** 发送人脸训练命令 */
    public boolean sendTrainCmd(String cmd) {
        return publish("/face_train_cmd", "std_msgs/String", cmd);
    }

    public boolean isConnected() {
        return ws != null;
    }

    // ── 消息处理 ──────────────────────────────────────────
    private void handleMessage(String text) {
        try {
            JsonNode root = mapper.readTree(text);
            if (!"publish".equals(root.path("op").asText())) return;

            String topic = root.path("topic").asText();
            String data  = root.path("msg").path("data").asText();
            if (data.isEmpty()) return;

            switch (topic) {
                case "/recognized_face_name":
                    handleFaceResult(data);
                    break;
                case "/face_train_status":
                    handleTrainStatus(data);
                    break;
                case "/face_node_status":
                    handleNodeStatus(data);
                    break;
            }
        } catch (Exception e) {
            log.warn("解析消息失败: {}", e.getMessage());
        }
    }

    private void handleFaceResult(String data) throws Exception {
        // 格式: "name:confidence:frameCount"
        String[] parts = data.split(":");
        String name   = parts.length > 0 ? parts[0] : "Unknown";
        double conf   = parts.length > 1 ? parseDouble(parts[1]) : 0.0;
        int    frames = parts.length > 2 ? parseInt(parts[2])    : 0;

        ObjectNode ev = mapper.createObjectNode();
        ev.put("type",       "face");
        ev.put("name",       name);
        ev.put("confidence", Math.round(conf * 1000.0) / 10.0);
        ev.put("frames",     frames);
        ev.put("timestamp",  System.currentTimeMillis());
        ev.put("known",      !"Unknown".equals(name));
        broadcaster.broadcast(mapper.writeValueAsString(ev));
    }

    private void handleTrainStatus(String data) throws Exception {
        // 格式: "progress:name:n/total" | "done:name" | "error:msg" | "idle"
        ObjectNode ev = mapper.createObjectNode();
        ev.put("type", "train");
        ev.put("raw",  data);

        if (data.startsWith("progress:")) {
            String[] p = data.split(":");
            ev.put("status", "progress");
            ev.put("name",   p.length > 1 ? p[1] : "");
            ev.put("detail", p.length > 2 ? p[2] : "");
        } else if (data.startsWith("done:")) {
            ev.put("status", "done");
            ev.put("name",   data.substring(5));
        } else if (data.startsWith("error:")) {
            ev.put("status", "error");
            ev.put("detail", data.substring(6));
        } else {
            ev.put("status", data); // "idle"
        }
        broadcaster.broadcast(mapper.writeValueAsString(ev));
    }

    private void handleNodeStatus(String data) throws Exception {
        ObjectNode ev = mapper.createObjectNode();
        ev.put("type",   "node_status");
        ev.put("status", data);
        broadcaster.broadcast(mapper.writeValueAsString(ev));
    }

    private double parseDouble(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; }
    }
    private int parseInt(String s) {
        try { return Integer.parseInt(s); } catch (Exception e) { return 0; }
    }

    @PreDestroy
    public void stop() {
        running = false;
        scheduler.shutdownNow();
        if (ws != null) ws.abort();
    }

    // ── WebSocket 监听器 ──────────────────────────────────
    private class WsListener implements WebSocket.Listener {
        private final StringBuilder buf = new StringBuilder();

        @Override
        public void onOpen(WebSocket webSocket) {
            log.info("rosbridge WS 已连接");
            ws = webSocket;          // 先赋值，再订阅
            webSocket.request(1);
            subscribeAll(webSocket);
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            buf.append(data);
            if (last) {
                handleMessage(buf.toString());
                buf.setLength(0);
            }
            webSocket.request(1);
            return null;
        }

        @Override
        public CompletionStage<?> onPing(WebSocket webSocket, ByteBuffer message) {
            webSocket.sendPong(message);
            webSocket.request(1);
            return null;
        }

        @Override
        public void onError(WebSocket webSocket, Throwable error) {
            log.warn("rosbridge WS 错误: {}，10s 后重连", error.getMessage());
            ws = null;
            if (running) scheduler.schedule(RosbridgeSubscriber.this::connect, 10, TimeUnit.SECONDS);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            log.warn("rosbridge WS 关闭 {} {}，10s 后重连", statusCode, reason);
            ws = null;
            if (running) scheduler.schedule(RosbridgeSubscriber.this::connect, 10, TimeUnit.SECONDS);
            return null;
        }
    }
}
