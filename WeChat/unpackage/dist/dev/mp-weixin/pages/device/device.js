"use strict";
const common_vendor = require("../../common/vendor.js");
const mixins_tabSwipe = require("../../mixins/tabSwipe.js");
const _sfc_main = common_vendor.defineComponent({
  mixins: [mixins_tabSwipe.tabSwipe],
  data() {
    return {
      pagePath: "/pages/device/device"
    };
  },
  onShow() {
    if (this.translateX !== void 0) {
      this.translateX = 0;
    }
    this.syncTabBar();
  },
  methods: {
    handleSwipe(diffX = null) {
      if (diffX < 0) {
        common_vendor.index.switchTab({
          url: "/pages/navigation/navigation",
          success: () => {
            this.setTabBarActive(1);
          },
          fail: (err) => {
            common_vendor.index.__f__("warn", "at pages/device/device.uvue:40", "切换tab失败:", err);
          }
        });
      }
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.sei(common_vendor.gei(_ctx, ""), "view"),
    b: `translateX(${_ctx.translateX}px)`,
    c: common_vendor.o((...args) => _ctx.onTouchStart && _ctx.onTouchStart(...args)),
    d: common_vendor.o((...args) => _ctx.onTouchMove && _ctx.onTouchMove(...args)),
    e: common_vendor.o((...args) => _ctx.onTouchEnd && _ctx.onTouchEnd(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-916d27a3"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/device/device.js.map
