package com.example.find_robot.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/map")
@CrossOrigin(origins = "*")
public class MapController {

    // 保存所有前端 SSE 连接
    private static final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // 缓存最新地图，新连接立即推一次
    private static volatile Map<String, Object> latestMap = null;

    /** 前端订阅 SSE */
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // 不超时
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(()    -> emitters.remove(emitter));
        emitter.onError(e      -> emitters.remove(emitter));

        // 新连接立即推最新地图
        if (latestMap != null) {
            try { emitter.send(latestMap); } catch (Exception ignored) {}
        }
        return emitter;
    }

    /** map_node.py 推送地图数据 */
    @PostMapping("/push")
    public Map<String, Object> push(@RequestBody Map<String, Object> body) {
        latestMap = body;
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(body);
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
        return Map.of("success", true);
    }
}
