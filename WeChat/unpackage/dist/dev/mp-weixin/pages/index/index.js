"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      username: "",
      password: "",
      captcha: "",
      rememberPassword: false,
      captchaUrl: "",
      baseUrl: "http://10.223.113.245:8080"
    };
  },
  onLoad() {
    this.refreshCaptcha();
    const savedUsername = common_vendor.index.getStorageSync("currentUsername");
    if (savedUsername) {
      this.username = savedUsername;
    }
    this.checkAutoLogin();
  },
  methods: {
    // 简化的自动登录逻辑
    checkAutoLogin() {
      try {
        const username = common_vendor.index.getStorageSync("currentUsername");
        const userId = common_vendor.index.getStorageSync("userId");
        const loginTime = common_vendor.index.getStorageSync("loginTime");
        common_vendor.index.__f__("log", "at pages/index/index.uvue:158", "检查自动登录信息:", new UTSJSONObject({ username, userId, loginTime }));
        if (username && userId) {
          const now = (/* @__PURE__ */ new Date()).getTime();
          const oneDay = 1 * 24 * 60 * 60 * 1e3;
          if (loginTime && now - loginTime < oneDay) {
            common_vendor.index.__f__("log", "at pages/index/index.uvue:167", "自动跳转到主界面");
            common_vendor.index.showLoading({
              title: "自动登录中...",
              mask: true
            });
            setTimeout(() => {
              common_vendor.index.hideLoading();
              common_vendor.index.switchTab({
                url: "/pages/device/device"
              });
            }, 1e3);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.uvue:183", "检查自动登录失败:", error);
      }
    },
    // 切换记住密码状态
    toggleRemember() {
      this.rememberPassword = !this.rememberPassword;
    },
    // 刷新验证码
    refreshCaptcha() {
      try {
        const timestamp = (/* @__PURE__ */ new Date()).getTime();
        this.captchaUrl = `${this.baseUrl}/api/auth/captcha?t=${timestamp}`;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.uvue:198", "刷新验证码失败:", error);
        common_vendor.index.showToast({
          title: "验证码加载失败",
          icon: "none"
        });
      }
    },
    // 验证码加载错误处理
    onCaptchaError() {
      common_vendor.index.__f__("error", "at pages/index/index.uvue:208", "验证码图片加载失败");
      this.captchaUrl = "";
    },
    // 处理登录
    handleLogin() {
      var _a, _b, _c;
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (!this.username.trim()) {
          common_vendor.index.showToast({ title: "请输入用户名", icon: "none" });
          return Promise.resolve(null);
        }
        if (!this.password) {
          common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
          return Promise.resolve(null);
        }
        if (!this.captcha.trim()) {
          common_vendor.index.showToast({ title: "请输入验证码", icon: "none" });
          return Promise.resolve(null);
        }
        common_vendor.index.showLoading({ title: "登录中...", mask: true });
        try {
          const response = yield common_vendor.index.request({
            url: `${this.baseUrl}/api/auth/login`,
            method: "POST",
            data: `username=${encodeURIComponent(this.username.trim())}&password=${encodeURIComponent(this.password)}&captcha=${encodeURIComponent(this.captcha.trim())}`,
            header: new UTSJSONObject({ "Content-Type": "application/x-www-form-urlencoded" }),
            timeout: 1e4
          });
          common_vendor.index.hideLoading();
          if (response.statusCode === 200) {
            const result = response.data;
            if (result.success) {
              common_vendor.index.__f__("log", "at pages/index/index.uvue:247", "登录成功:", result);
              common_vendor.index.setStorageSync("currentUsername", this.username);
              const userId = result.userId || result.data && result.data.userId || "";
              common_vendor.index.setStorageSync("userId", userId.toString());
              common_vendor.index.setStorageSync("loginTime", (/* @__PURE__ */ new Date()).getTime());
              common_vendor.index.showToast({
                title: "登录成功！",
                icon: "success",
                duration: 1500
              });
              setTimeout(() => {
                common_vendor.index.switchTab({ url: "/pages/device/device" });
              }, 1500);
            } else {
              common_vendor.index.showToast({
                title: result.message || "登录失败",
                icon: "none"
              });
              this.refreshCaptcha();
              this.captcha = "";
            }
          } else {
            common_vendor.index.showToast({
              title: ((_a = response.data) === null || _a === void 0 ? null : _a.message) || `服务器错误: ${response.statusCode}`,
              icon: "none",
              duration: 3e3
            });
          }
        } catch (error) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/index/index.uvue:284", "登录请求失败:", error);
          let errorMessage = "登录失败，请重试";
          if ((_b = error.errMsg) === null || _b === void 0 ? null : _b.includes("timeout"))
            errorMessage = "请求超时";
          if ((_c = error.errMsg) === null || _c === void 0 ? null : _c.includes("fail"))
            errorMessage = "无法连接到服务器";
          common_vendor.index.showToast({ title: errorMessage, icon: "none", duration: 3e3 });
          this.refreshCaptcha();
          this.captcha = "";
        }
      });
    },
    // 忘记密码
    forgotPassword() {
      common_vendor.index.showModal(new UTSJSONObject({
        title: "忘记密码",
        content: "请联系系统管理员重置密码",
        showCancel: false,
        confirmText: "知道了"
      }));
    },
    // 跳转到关于我们页面
    goToAbout() {
      common_vendor.index.navigateTo({ url: "/pages/about/about" });
    },
    // 跳转到注册页面
    goToRegister() {
      common_vendor.index.navigateTo({ url: "/pages/register/register" });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: common_assets._imports_1,
    c: common_assets._imports_2,
    d: $data.username,
    e: common_vendor.o(($event) => $data.username = $event.detail.value),
    f: $data.password,
    g: common_vendor.o(($event) => $data.password = $event.detail.value),
    h: $data.captcha,
    i: common_vendor.o(($event) => $data.captcha = $event.detail.value),
    j: $data.captchaUrl
  }, $data.captchaUrl ? {
    k: $data.captchaUrl,
    l: common_vendor.o((...args) => $options.onCaptchaError && $options.onCaptchaError(...args))
  } : {}, {
    m: common_vendor.o((...args) => $options.refreshCaptcha && $options.refreshCaptcha(...args)),
    n: $data.rememberPassword
  }, $data.rememberPassword ? {} : {}, {
    o: $data.rememberPassword ? 1 : "",
    p: common_vendor.o((...args) => $options.toggleRemember && $options.toggleRemember(...args)),
    q: common_vendor.o((...args) => $options.forgotPassword && $options.forgotPassword(...args)),
    r: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    s: common_vendor.o((...args) => $options.goToRegister && $options.goToRegister(...args)),
    t: common_vendor.o((...args) => $options.goToAbout && $options.goToAbout(...args)),
    v: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-00a60067"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
