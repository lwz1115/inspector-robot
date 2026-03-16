package com.example.find_robot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 人脸识别事件 SSE 广播服务
 * RosbridgeSubscriber 收到识别结果后调用 broadcast()，推送给所有前端连接
 */
@Service
public class FaceEventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(FaceEventBroadcaster.class);
    private static final long SSE_TIMEOUT = 10 * 60 * 1000L; // 10分钟

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final AtomicLong idGen = new AtomicLong(0);

    /** 前端调用，建立 SSE 长连接 */
    public SseEmitter subscribe() {
        long id = idGen.incrementAndGet();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        emitter.onCompletion(() -> emitters.remove(id));
        emitter.onTimeout(()    -> emitters.remove(id));
        emitter.onError(e       -> emitters.remove(id));
        emitters.put(id, emitter);
        log.info("SSE 客户端连接 id={}, 当前连接数={}", id, emitters.size());
        // 发送初始心跳，避免浏览器超时
        try {
            emitter.send(SseEmitter.event().name("connected").data("{\"status\":\"ok\"}"));
        } catch (IOException e) {
            emitters.remove(id);
        }
        return emitter;
    }

    /** 广播人脸事件 JSON 给所有前端 */
    public void broadcast(String json) {
        if (emitters.isEmpty()) return;
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name("face").data(json));
            } catch (IOException e) {
                emitters.remove(id);
            }
        });
    }

    public int connectionCount() { return emitters.size(); }
}
