"use strict";
const common_vendor = require("../common/vendor.js");
const tabSwipe = {
  data() {
    return {
      startX: 0,
      startY: 0,
      // 新增：滑动偏移量
      translateX: 0,
      // 缓存窗口宽度，避免重复调用API
      windowWidth: 0,
      // tab 配置映射
      tabConfig: [
        { path: "/pages/device/device", index: 0 },
        { path: "/pages/navigation/navigation", index: 1 },
        { path: "/pages/profile/profile", index: 2 }
      ]
    };
  },
  onLoad() {
    this.getWindowWidth();
  },
  onShow() {
    this.translateX = 0;
    this.syncTabBar();
  },
  methods: {
    // 兼容获取窗口宽度的方法
    getWindowWidth() {
      try {
        if (common_vendor.wx$1.getWindowInfo) {
          const windowInfo = common_vendor.wx$1.getWindowInfo();
          this.windowWidth = windowInfo.windowWidth;
        } else if (common_vendor.wx$1.getSystemInfoSync) {
          const systemInfo = common_vendor.wx$1.getSystemInfoSync();
          this.windowWidth = systemInfo.windowWidth;
        } else {
          this.windowWidth = 375;
        }
      } catch (e) {
        this.windowWidth = 375;
      }
    },
    // 同步当前页面的 tabBar 选中状态 - 兼容所有版本
    syncTabBar() {
      try {
        let currentPath = "";
        const pages = getCurrentPages();
        if (pages && pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          currentPath = "/" + currentPage.route;
        }
        if (!currentPath) {
          currentPath = this.pagePath || "";
        }
        const tabItem = this.tabConfig.find((item) => item.path === currentPath);
        if (tabItem) {
          this.setTabBarActive(tabItem.index);
        }
      } catch (e) {
        common_vendor.index.__f__("warn", "at mixins/tabSwipe.js:73", "同步tabBar状态失败:", e);
      }
    },
    // 兼容所有版本的tabBar选中状态设置方法
    setTabBarActive(activeIndex) {
      this.tabConfig.forEach((item, index) => {
        common_vendor.index.setTabBarItem({
          index,
          selected: index === activeIndex
        });
      });
    },
    // 触摸开始
    onTouchStart(e) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.translateX = 0;
    },
    // 新增：触摸移动 - 实时更新位移（修复废弃API）
    onTouchMove(e) {
      const moveX = e.touches[0].clientX;
      const diffX = moveX - this.startX;
      const diffY = e.touches[0].clientY - this.startY;
      if (Math.abs(diffY) > Math.abs(diffX))
        return;
      const maxTranslate = this.windowWidth * 0.3;
      if (Math.abs(diffX) <= maxTranslate) {
        this.translateX = diffX;
      }
    },
    // 触摸结束
    onTouchEnd(e) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - this.startX;
      const diffY = endY - this.startY;
      this.translateX = 0;
      if (Math.abs(diffY) > Math.abs(diffX))
        return;
      if (Math.abs(diffX) > 50) {
        this.handleSwipe(diffX);
      }
    },
    // 处理滑动逻辑（需要在具体页面实现）
    handleSwipe(diffX) {
    }
  }
};
exports.tabSwipe = tabSwipe;
//# sourceMappingURL=../../.sourcemap/mp-weixin/mixins/tabSwipe.js.map
