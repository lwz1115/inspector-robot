package com.example.find_robot.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.find_robot.entity.User;
import com.example.find_robot.service.UserService;
import com.example.find_robot.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class RegisterController {

    @Autowired
    private UserService userService;

    // 用户登录
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam String password) {

        Map<String, Object> result = new HashMap<>();
        try {
            if (username == null || username.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "用户名不能为空");
                return ResponseEntity.ok(result);
            }
            if (password == null || password.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "密码不能为空");
                return ResponseEntity.ok(result);
            }

            // 根据用户名查询用户
            User user = userService.findByUsername(username);
            if (user == null) {
                result.put("success", false);
                result.put("message", "用户不存在");
                return ResponseEntity.ok(result);
            }

            // 验证密码
            if (!((UserServiceImpl) userService).checkPassword(password, user.getPassword())) {
                result.put("success", false);
                result.put("message", "密码不正确");
                return ResponseEntity.ok(result);
            }

            result.put("success", true);
            result.put("message", "登录成功");
            result.put("user", user.getUsername());
            result.put("userId", user.getId());

        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "系统异常");
        }
        return ResponseEntity.ok(result);
    }

    // 用户注册
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String phone,
            @RequestParam(required = false) String nickname) {

        Map<String, Object> result = new HashMap<>();
        try {
            // 基础验证
            if (username == null || username.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "用户名不能为空");
                return ResponseEntity.ok(result);
            }
            if (password == null || password.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "密码不能为空");
                return ResponseEntity.ok(result);
            }
            if (phone == null || phone.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "手机号不能为空");
                return ResponseEntity.ok(result);
            }

            // 检查用户名是否已存在
            if (userService.findByUsername(username) != null) {
                result.put("success", false);
                result.put("message", "用户名已存在");
                return ResponseEntity.ok(result);
            }

            // 检查手机号是否已存在
            if (userService.existsByPhone(phone)) {
                result.put("success", false);
                result.put("message", "手机号已存在");
                return ResponseEntity.ok(result);
            }

            // 创建用户
            User user = new User();
            user.setUsername(username);
            user.setPassword(password);
            user.setPhone(phone);
            user.setNickname(nickname != null ? nickname : username);

            boolean isSuccess = userService.register(user);
            if (isSuccess) {
                result.put("success", true);
                result.put("message", "注册成功");
            } else {
                result.put("success", false);
                result.put("message", "注册失败");
            }
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "系统异常");
        }
        return ResponseEntity.ok(result);
    }

    // 获取用户列表
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUserList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Map<String, Object> result = new HashMap<>();
        try {
            Page<User> pageParam = new Page<>(page, size);
            IPage<User> userPage = userService.page(pageParam);

            Map<String, Object> data = new HashMap<>();
            data.put("total", userPage.getTotal());
            data.put("list", userPage.getRecords());

            result.put("success", true);
            result.put("data", data);
            result.put("message", "获取用户列表成功");
        } catch (Exception e) {
            e.printStackTrace();
            result.put("success", false);
            result.put("message", "获取用户列表失败");
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 检查token有效性（用于自动登录）
     */
    @GetMapping("/check-token")
    public Map<String, Object> checkToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> result = new HashMap<>();

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                result.put("success", false);
                result.put("message", "Token无效");
                return result;
            }

            String token = authHeader.substring(7);

            // 这里需要实现token验证逻辑
            // 1. 解析token
            // 2. 检查token是否过期
            // 3. 验证用户信息

            // 示例：简单的token验证（实际项目中应该使用JWT等机制）
            if (isValidToken(token)) {
                result.put("success", true);
                result.put("message", "Token有效");
                // 可以返回用户信息
                // result.put("user", userInfo);
            } else {
                result.put("success", false);
                result.put("message", "Token无效或已过期");
            }

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Token验证失败: " + e.getMessage());
        }

        return result;
    }

    private boolean isValidToken(String token) {
        // TODO: 实现实际的token验证逻辑
        // 可以检查数据库中的token有效性，或者解析JWT token
        // 这里返回true表示token有效
        return true;
    }
}