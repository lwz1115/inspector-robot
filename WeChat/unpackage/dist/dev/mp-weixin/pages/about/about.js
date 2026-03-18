"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      latitude: 32.12934755,
      longitude: 118.95012178,
      markers: [new UTSJSONObject({
        id: 1,
        latitude: 32.12934755,
        longitude: 118.95012178,
        title: "南京工业职业技术大学",
        width: 30,
        height: 30
      })]
    };
  },
  methods: {
    // 返回上一页
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 打开地图查看详细位置
    openLocation() {
      common_vendor.index.openLocation({
        latitude: this.latitude,
        longitude: this.longitude,
        name: "南京工业职业技术大学",
        address: "江苏省南京市栖霞区仙林大学城羊山北路1号",
        scale: 18
      });
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_assets._imports_0$1,
    c: $data.latitude,
    d: $data.longitude,
    e: $data.markers,
    f: common_vendor.o((...args) => $options.openLocation && $options.openLocation(...args)),
    g: common_vendor.o((...args) => $options.openLocation && $options.openLocation(...args)),
    h: common_vendor.sei(common_vendor.gei(_ctx, ""), "view")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-fe428a0d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/about/about.js.map
