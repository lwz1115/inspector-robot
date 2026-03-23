package com.example.find_robot.controller;

import com.example.find_robot.entity.User;
import com.example.find_robot.service.EmailCodeService;
import com.example.find_robot.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class RegisterController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailCodeService emailCodeService;

    /** 统一构造响应 */
    private Map<String, Object> ok(String msg, Object... extras) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", true);
        r.put("message", msg);
        for (int i = 0; i + 1 < extras.length; i += 2) r.put(String.valueOf(extras[i]), extras[i + 1]);
        return r;
    }

    private Map<String, Object> fail(String msg) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", false);
        r.put("message", msg);
        return r;
    }

    // ── 登录 ──────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam String password) {
        try {
            if (!StringUtils.hasText(username)) return ResponseEntity.ok(fail("用户名不能为空"));
            if (!StringUtils.hasText(password)) return ResponseEntity.ok(fail("密码不能为空"));

            User user = userService.login(username.trim(), password);
            if (user == null) return ResponseEntity.ok(fail("用户名或密码错误"));

            return ResponseEntity.ok(ok("登录成功",
                    "username", user.getUsername(),
                    "userId",   user.getId(),
                    "nickname", user.getNickname(),
                    "role",     user.getRole()));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常，请稍后重试"));
        }
    }

    // ── 发送邮箱验证码 ────────────────────────────────────
    @PostMapping("/email/send")
    public ResponseEntity<Map<String, Object>> sendEmailCode(@RequestParam String email) {
        String err = emailCodeService.sendCode(email);
        return ResponseEntity.ok(err == null ? ok("验证码已发送，请查收邮件") : fail(err));
    }

    // ── 忘记密码：发送验证码到绑定邮箱 ──────────────────
    @PostMapping("/forgot/send")
    public ResponseEntity<Map<String, Object>> forgotSend(@RequestParam String username) {
        try {
            if (!StringUtils.hasText(username)) return ResponseEntity.ok(fail("请输入用户名"));
            User user = userService.findByUsername(username.trim());
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            if (!StringUtils.hasText(user.getEmail())) return ResponseEntity.ok(fail("该账号未绑定邮箱，无法找回密码"));
            String err = emailCodeService.sendCode(user.getEmail());
            if (err != null) return ResponseEntity.ok(fail(err));
            // 只返回脱敏邮箱，不暴露完整地址
            String masked = maskEmail(user.getEmail());
            return ResponseEntity.ok(ok("验证码已发送至 " + masked, "maskedEmail", masked));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常，请稍后重试"));
        }
    }

    // ── 忘记密码：验证码校验并重置密码 ──────────────────
    @PostMapping("/forgot/reset")
    public ResponseEntity<Map<String, Object>> forgotReset(
            @RequestParam String username,
            @RequestParam String emailCode,
            @RequestParam String newPassword) {
        try {
            if (!StringUtils.hasText(username))    return ResponseEntity.ok(fail("用户名不能为空"));
            if (!StringUtils.hasText(emailCode))   return ResponseEntity.ok(fail("请输入验证码"));
            if (!StringUtils.hasText(newPassword)) return ResponseEntity.ok(fail("请输入新密码"));
            if (newPassword.length() < 6)          return ResponseEntity.ok(fail("密码至少6位"));

            User user = userService.findByUsername(username.trim());
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            if (!StringUtils.hasText(user.getEmail())) return ResponseEntity.ok(fail("该账号未绑定邮箱"));

            if (!emailCodeService.verify(user.getEmail(), emailCode.trim())) {
                return ResponseEntity.ok(fail("验证码错误或已过期"));
            }

            user.setPassword(newPassword);
            userService.updateById(user);
            return ResponseEntity.ok(ok("密码重置成功，请重新登录"));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常，请稍后重试"));
        }
    }

    /** 邮箱脱敏：abc***@qq.com */
    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return email;
        int show = Math.min(3, at);
        return email.substring(0, show) + "***" + email.substring(at);
    }

    // ── 查询用户信息 ──────────────────────────────────────
    @GetMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        try {
            User user = userService.getById(id);
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            Map<String, Object> data = new HashMap<>();
            data.put("id",         user.getId());
            data.put("username",   user.getUsername());
            data.put("nickname",   user.getNickname());
            data.put("phone",      user.getPhone());
            data.put("email",      user.getEmail());
            data.put("role",       user.getRole());
            data.put("avatar",     user.getAvatar());
            data.put("createTime", user.getCreateTime() != null ? user.getCreateTime().toString() : null);
            return ResponseEntity.ok(ok("ok", "data", data));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常"));
        }
    }

    // ── 更新用户资料 ──────────────────────────────────────
    @PutMapping("/user/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            User user = userService.getById(id);
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            String nickname = body.get("nickname");
            String phone    = body.get("phone");
            String email    = body.get("email");
            if (StringUtils.hasText(nickname)) user.setNickname(nickname.trim());
            if (StringUtils.hasText(phone)) {
                if (!phone.trim().matches("^1[3-9]\\d{9}$")) return ResponseEntity.ok(fail("手机号格式不正确"));
                // 检查手机号是否被其他用户占用
                User exist = userService.findByPhone(phone.trim());
                if (exist != null && !exist.getId().equals(id)) return ResponseEntity.ok(fail("手机号已被其他账号使用"));
                user.setPhone(phone.trim());
            }
            if (StringUtils.hasText(email)) user.setEmail(email.trim());
            userService.updateById(user);
            return ResponseEntity.ok(ok("保存成功"));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常"));
        }
    }

    // ── 修改密码 ──────────────────────────────────────────
    @PutMapping("/user/{id}/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String oldPwd = body.get("oldPassword");
            String newPwd = body.get("newPassword");
            if (!StringUtils.hasText(oldPwd)) return ResponseEntity.ok(fail("请输入当前密码"));
            if (!StringUtils.hasText(newPwd)) return ResponseEntity.ok(fail("请输入新密码"));
            if (newPwd.length() < 6)          return ResponseEntity.ok(fail("新密码至少6位"));
            User user = userService.getById(id);
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            if (!user.getPassword().equals(oldPwd)) return ResponseEntity.ok(fail("当前密码不正确"));
            user.setPassword(newPwd);
            userService.updateById(user);
            return ResponseEntity.ok(ok("密码修改成功"));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常"));
        }
    }

    // ── 头像上传（Base64）────────────────────────────────
    @PostMapping("/user/{id}/avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            User user = userService.getById(id);
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            String base64 = body.get("avatar");
            if (!StringUtils.hasText(base64)) return ResponseEntity.ok(fail("头像数据不能为空"));
            // 简单校验：必须是 data:image/ 开头的 Base64
            if (!base64.startsWith("data:image/")) return ResponseEntity.ok(fail("格式不正确，请上传图片"));
            // 限制大小：Base64 约比原文件大 33%，200x200 JPEG 压缩后约 15KB，Base64 约 20KB
            if (base64.length() > 200 * 1024) return ResponseEntity.ok(fail("图片太大，请压缩后上传"));
            user.setAvatar(base64);
            userService.updateById(user);
            return ResponseEntity.ok(ok("头像已更新", "avatar", base64));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常"));
        }
    }

    // ── 删除头像 ──────────────────────────────────────────
    @DeleteMapping("/user/{id}/avatar")
    public ResponseEntity<Map<String, Object>> deleteAvatar(@PathVariable Long id) {
        try {
            User user = userService.getById(id);
            if (user == null) return ResponseEntity.ok(fail("用户不存在"));
            user.setAvatar(null);
            userService.updateById(user);
            return ResponseEntity.ok(ok("头像已移除"));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常"));
        }
    }

    // ── 注册 ──────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String username,
            @RequestParam String password,
            @RequestParam String phone,
            @RequestParam String email,
            @RequestParam String emailCode,
            @RequestParam(required = false) String nickname) {
        try {
            if (!StringUtils.hasText(username))  return ResponseEntity.ok(fail("用户名不能为空"));
            if (username.trim().length() < 3)    return ResponseEntity.ok(fail("用户名至少3个字符"));
            if (username.trim().length() > 50)   return ResponseEntity.ok(fail("用户名不能超过50个字符"));
            if (!StringUtils.hasText(password))  return ResponseEntity.ok(fail("密码不能为空"));
            if (password.length() < 6)           return ResponseEntity.ok(fail("密码至少6位"));
            if (!StringUtils.hasText(phone))     return ResponseEntity.ok(fail("手机号不能为空"));
            if (!phone.trim().matches("^1[3-9]\\d{9}$")) return ResponseEntity.ok(fail("手机号格式不正确"));
            if (!StringUtils.hasText(email))     return ResponseEntity.ok(fail("邮箱不能为空"));
            if (!StringUtils.hasText(emailCode)) return ResponseEntity.ok(fail("请输入邮箱验证码"));

            // 验证邮箱验证码
            if (!emailCodeService.verify(email.trim(), emailCode.trim())) {
                return ResponseEntity.ok(fail("验证码错误或已过期"));
            }

            if (userService.findByUsername(username.trim()) != null) return ResponseEntity.ok(fail("用户名已存在"));
            if (userService.existsByPhone(phone.trim()))             return ResponseEntity.ok(fail("手机号已被注册"));

            User user = new User();
            user.setUsername(username.trim());
            user.setPassword(password);
            user.setPhone(phone.trim());
            user.setEmail(email.trim());
            user.setNickname(StringUtils.hasText(nickname) ? nickname.trim() : username.trim());

            if (!userService.register(user)) return ResponseEntity.ok(fail("注册失败，请重试"));
            return ResponseEntity.ok(ok("注册成功"));
        } catch (Exception e) {
            return ResponseEntity.ok(fail("系统异常，请稍后重试"));
        }
    }
}
