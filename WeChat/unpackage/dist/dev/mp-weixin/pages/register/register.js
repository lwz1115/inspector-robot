"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      username: "",
      password: "",
      confirmPassword: "",
      phone: "",
      nickname: "",
      agreed: false,
      showPassword: false,
      showConfirmPassword: false,
      loading: false,
      baseUrl: "http://localhost:8080"
    };
  },
  methods: {
    // 处理注册
    handleRegister() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (!this.validateForm()) {
          return Promise.resolve(null);
        }
        this.loading = true;
        common_vendor.index.showLoading({
          title: "注册中...",
          mask: true
        });
        try {
          common_vendor.index.__f__("log", "at pages/register/register.uvue:167", "开始注册请求...");
          const response = yield common_vendor.index.request({
            url: `${this.baseUrl}/api/auth/register`,
            method: "POST",
            data: new UTSJSONObject({
              username: this.username.trim(),
              password: this.password,
              phone: this.phone.trim(),
              nickname: this.nickname.trim() || this.username.trim()
            }),
            header: new UTSJSONObject({
              "Content-Type": "application/x-www-form-urlencoded"
            }),
            timeout: 1e4
          });
          common_vendor.index.hideLoading();
          this.loading = false;
          common_vendor.index.__f__("log", "at pages/register/register.uvue:188", "注册响应:", response);
          if (response.statusCode === 200) {
            const result = response.data;
            if (result.success) {
              common_vendor.index.__f__("log", "at pages/register/register.uvue:194", "注册成功:", result);
              common_vendor.index.showToast({
                title: "注册成功！",
                icon: "success",
                duration: 2e3
              });
              setTimeout(() => {
                common_vendor.index.redirectTo({
                  url: "/pages/index/index?username=" + encodeURIComponent(this.username)
                });
              }, 2e3);
            } else {
              common_vendor.index.__f__("log", "at pages/register/register.uvue:210", "注册失败:", result.message);
              common_vendor.index.showToast({
                title: result.message || "注册失败",
                icon: "none",
                duration: 3e3
              });
            }
          } else {
            common_vendor.index.__f__("error", "at pages/register/register.uvue:218", "HTTP错误:", response.statusCode);
            common_vendor.index.showToast({
              title: `服务器错误: ${response.statusCode}`,
              icon: "none",
              duration: 3e3
            });
          }
        } catch (error) {
          common_vendor.index.hideLoading();
          this.loading = false;
          common_vendor.index.__f__("error", "at pages/register/register.uvue:229", "注册请求失败:", error);
          let errorMessage = "注册失败，请重试";
          if (error.errMsg && error.errMsg.includes("timeout")) {
            errorMessage = "请求超时，请检查网络连接";
          } else if (error.errMsg && error.errMsg.includes("fail")) {
            errorMessage = "无法连接到服务器，请检查后端服务是否启动";
          }
          common_vendor.index.showToast({
            title: errorMessage,
            icon: "none",
            duration: 3e3
          });
        }
      });
    },
    // 跳转到登录页面
    goToLogin() {
      common_vendor.index.redirectTo({
        url: "/pages/index/index"
      });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.username,
    b: common_vendor.o(($event) => $data.username = $event.detail.value),
    c: $data.showPassword ? "text" : "password",
    d: $data.password,
    e: common_vendor.o(($event) => $data.password = $event.detail.value),
    f: common_vendor.t($data.showPassword ? "🙈" : "👁"),
    g: common_vendor.o((...args) => _ctx.togglePassword && _ctx.togglePassword(...args)),
    h: $data.showConfirmPassword ? "text" : "password",
    i: $data.confirmPassword,
    j: common_vendor.o(($event) => $data.confirmPassword = $event.detail.value),
    k: common_vendor.t($data.showConfirmPassword ? "🙈" : "👁"),
    l: common_vendor.o((...args) => _ctx.toggleConfirmPassword && _ctx.toggleConfirmPassword(...args)),
    m: $data.phone,
    n: common_vendor.o(($event) => $data.phone = $event.detail.value),
    o: $data.nickname,
    p: common_vendor.o(($event) => $data.nickname = $event.detail.value),
    q: $data.agreed
  }, $data.agreed ? {} : {}, {
    r: $data.agreed ? 1 : "",
    s: common_vendor.o((...args) => _ctx.showAgreement && _ctx.showAgreement(...args)),
    t: common_vendor.o((...args) => _ctx.toggleAgreement && _ctx.toggleAgreement(...args)),
    v: common_vendor.t($data.loading ? "注册中..." : "注册"),
    w: common_vendor.o((...args) => $options.handleRegister && $options.handleRegister(...args)),
    x: common_vendor.o((...args) => $options.goToLogin && $options.goToLogin(...args)),
    y: common_vendor.o((...args) => _ctx.goToAbout && _ctx.goToAbout(...args)),
    z: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-6c2a468c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/register.js.map
