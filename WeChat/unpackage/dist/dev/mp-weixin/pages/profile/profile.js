"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = common_vendor.defineComponent({
  data() {
    return {
      username: "",
      userAvatar: "/static/logo.png",
      userId: null,
      isLoggedIn: false,
      showAvatarModal: false,
      avatarList: [
        "/static/hear1.jpg",
        "/static/hear2.jpg",
        "/static/hear3.jpg",
        "/static/hear4.jpg",
        "/static/hear5.jpg",
        "/static/hear6.jpg",
        "/static/hear7.jpg",
        "/static/hear8.jpg"
      ],
      avatarLoadError: new UTSJSONObject({}),
      initialAvatarIndex: 0,
      // 滑动相关数据
      translateX: 0,
      startX: 0,
      startY: 0,
      isTouching: false,
      windowWidth: 375,
      swipeThreshold: 50,
      // 下拉相关数据
      pullDownDistance: 0,
      isPulling: false,
      bgHeight: 320,
      originalBgHeight: 320,
      maxPullDistance: 150,
      startPullY: 0,
      pullBackTimer: null
    };
  },
  onLoad() {
    this.loadUserInfo();
    this.getWindowWidth();
  },
  onShow() {
    this.loadUserInfo();
    this.resetSwipe();
    this.syncTabBar();
  },
  onUnload() {
    if (this.pullBackTimer) {
      clearTimeout(this.pullBackTimer);
    }
  },
  methods: {
    getWindowWidth() {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        this.windowWidth = systemInfo.windowWidth || 375;
      } catch (error) {
        this.windowWidth = 375;
      }
    },
    syncTabBar() {
      try {
        common_vendor.index.setTabBarItem({ index: 2, selected: true });
      } catch (error) {
      }
    },
    onTouchStart(e = null) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.startPullY = this.startY;
      this.isTouching = true;
    },
    onTouchMove(e = null) {
      if (!this.isTouching)
        return null;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - this.startX;
      const diffY = currentY - this.startY;
      if (diffY > 0) {
        e.preventDefault();
        this.isPulling = true;
        let pullDistance = diffY * 0.6;
        if (pullDistance > this.maxPullDistance * 0.7) {
          pullDistance = this.maxPullDistance * 0.7 + (pullDistance - this.maxPullDistance * 0.7) * 0.3;
        }
        if (pullDistance > this.maxPullDistance) {
          pullDistance = this.maxPullDistance + (pullDistance - this.maxPullDistance) * 0.2;
        }
        this.pullDownDistance = Math.min(pullDistance, this.maxPullDistance * 1.5);
        this.bgHeight = this.originalBgHeight + this.pullDownDistance * 1.5;
        return null;
      }
      if (Math.abs(diffY) > Math.abs(diffX) * 2)
        return null;
      if (diffX > 0) {
        this.translateX = Math.min(diffX, this.windowWidth * 0.3);
      }
    },
    onTouchEnd(e = null) {
      if (this.isPulling) {
        this.isPulling = false;
        if (this.pullBackTimer) {
          clearTimeout(this.pullBackTimer);
        }
        const startTime = Date.now();
        const startPull = this.pullDownDistance;
        const duration = 600;
        const animateBack = () => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutElastic = (t = null) => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
          };
          const easedProgress = easeOutElastic(progress);
          this.pullDownDistance = startPull * (1 - easedProgress);
          this.bgHeight = this.originalBgHeight + this.pullDownDistance * 1.5;
          if (progress < 1) {
            this.pullBackTimer = setTimeout(animateBack, 16);
          } else {
            this.pullDownDistance = 0;
            this.bgHeight = this.originalBgHeight;
          }
        };
        animateBack();
        return null;
      }
      this.isTouching = false;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - this.startX;
      if (diffX > this.swipeThreshold) {
        this.handleSwipeRight();
      } else {
        this.resetSwipe();
      }
    },
    handleSwipeRight() {
      this.translateX = this.windowWidth;
      setTimeout(() => {
        common_vendor.index.switchTab({
          url: "/pages/navigation/navigation",
          success: () => {
            common_vendor.index.setTabBarItem({ index: 1, selected: true });
          }
        });
      }, 150);
    },
    resetSwipe() {
      this.translateX = 0;
    },
    loadUserInfo() {
      try {
        const username = common_vendor.index.getStorageSync("currentUsername");
        const userId = common_vendor.index.getStorageSync("userId");
        if (username && userId) {
          this.username = username;
          this.userId = userId;
          this.isLoggedIn = true;
          this.loadUserAvatar();
        } else {
          this.resetToDefault();
        }
      } catch (error) {
        this.resetToDefault();
      }
    },
    loadUserAvatar() {
      try {
        let avatarPath = common_vendor.index.getStorageSync(`userAvatar_${this.userId}`);
        if (avatarPath) {
          this.userAvatar = avatarPath;
          this.initialAvatarIndex = this.getAvatarIndexForUser();
          return null;
        }
        const avatarIndex = this.getAvatarIndexForUser();
        this.initialAvatarIndex = avatarIndex;
        avatarPath = this.avatarList[avatarIndex];
        common_vendor.index.setStorageSync(`userAvatar_${this.userId}`, avatarPath);
        this.userAvatar = avatarPath;
      } catch (error) {
        this.userAvatar = "/static/logo.png";
      }
    },
    getAvatarIndexForUser() {
      if (!this.userId)
        return 0;
      try {
        const userIdStr = this.userId.toString();
        let hash = 0;
        for (let i = 0; i < userIdStr.length; i++) {
          const char = userIdStr.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash) % this.avatarList.length;
      } catch (error) {
        return 0;
      }
    },
    showAvatarSelector() {
      if (!this.isLoggedIn) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateTo({ url: "/pages/index/index" });
        }, 1500);
        return null;
      }
      this.showAvatarModal = true;
    },
    closeAvatarModal() {
      this.showAvatarModal = false;
    },
    selectAvatar(avatarPath = null) {
      if (!this.isLoggedIn || !this.userId) {
        common_vendor.index.showToast({ title: "用户信息异常", icon: "error" });
        return null;
      }
      this.userAvatar = avatarPath;
      common_vendor.index.setStorageSync(`userAvatar_${this.userId}`, avatarPath);
      common_vendor.index.showToast({ title: "头像已更换", icon: "success" });
      this.closeAvatarModal();
    },
    handleAvatarError(index = null) {
      this.$set(this.avatarLoadError, index, true);
    },
    goToPage(page = null) {
      if (!this.isLoggedIn) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateTo({ url: "/pages/index/index" });
        }, 1500);
        return null;
      }
      const routes = new UTSJSONObject({
        "device": "/pages/device/device",
        "about": "/pages/about/about"
      });
      if (routes[page]) {
        common_vendor.index.navigateTo({ url: routes[page] });
      }
    },
    contactService() {
      common_vendor.index.showToast({ title: "在线客服功能", icon: "none" });
    },
    goToFeedback() {
      common_vendor.index.showToast({ title: "匿名反馈功能", icon: "none" });
    },
    goToLogin() {
      common_vendor.index.navigateTo({ url: "/pages/index/index" });
    },
    logout() {
      common_vendor.index.showModal(new UTSJSONObject({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.removeStorageSync("currentUsername");
            common_vendor.index.removeStorageSync("userId");
            common_vendor.index.removeStorageSync("loginTime");
            this.resetToDefault();
            common_vendor.index.showToast({ title: "已退出登录", icon: "success" });
            setTimeout(() => {
              common_vendor.index.navigateTo({ url: "/pages/index/index" });
            }, 1500);
          }
        }
      }));
    },
    resetToDefault() {
      this.username = "";
      this.userAvatar = "/static/logo.png";
      this.userId = null;
      this.isLoggedIn = false;
      this.showAvatarModal = false;
      this.avatarLoadError = new UTSJSONObject({});
      this.initialAvatarIndex = 0;
      this.pullDownDistance = 0;
      this.isPulling = false;
      this.bgHeight = this.originalBgHeight;
      if (this.pullBackTimer) {
        clearTimeout(this.pullBackTimer);
        this.pullBackTimer = null;
      }
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.userAvatar,
    b: common_vendor.o((...args) => $options.showAvatarSelector && $options.showAvatarSelector(...args)),
    c: common_vendor.t($data.isLoggedIn ? $data.username || "欢迎回来" : "当前未登录，请登录！"),
    d: $data.userId
  }, $data.userId ? {
    e: common_vendor.t($data.userId)
  } : {}, {
    f: $data.bgHeight + "rpx",
    g: common_vendor.o(($event) => $options.goToPage("device")),
    h: common_vendor.o(($event) => $options.goToPage("about")),
    i: common_vendor.o((...args) => $options.contactService && $options.contactService(...args)),
    j: common_vendor.o((...args) => $options.goToFeedback && $options.goToFeedback(...args)),
    k: $data.isLoggedIn
  }, $data.isLoggedIn ? {
    l: common_vendor.o((...args) => $options.logout && $options.logout(...args))
  } : {
    m: common_vendor.o((...args) => $options.goToLogin && $options.goToLogin(...args))
  }, {
    n: "translateY(" + $data.pullDownDistance + "px)",
    o: $data.isPulling ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    p: $data.showAvatarModal
  }, $data.showAvatarModal ? common_vendor.e({
    q: common_vendor.o((...args) => $options.closeAvatarModal && $options.closeAvatarModal(...args)),
    r: common_vendor.t($data.username),
    s: $data.userId
  }, $data.userId ? {
    t: common_vendor.t($data.userId)
  } : {}, {
    v: common_vendor.f($data.avatarList, (avatar, index, i0) => {
      return {
        a: avatar,
        b: $data.userAvatar === avatar ? 1 : "",
        c: common_vendor.o(($event) => $options.handleAvatarError(index), index),
        d: common_vendor.t(index + 1),
        e: index,
        f: common_vendor.o(($event) => $options.selectAvatar(avatar), index)
      };
    }),
    w: common_vendor.o(() => {
    }),
    x: common_vendor.o((...args) => $options.closeAvatarModal && $options.closeAvatarModal(...args))
  }) : {}, {
    y: common_vendor.sei(common_vendor.gei(_ctx, ""), "view"),
    z: "translateX(" + $data.translateX + "px)",
    A: $data.isTouching ? "none" : "transform 0.3s ease",
    B: common_vendor.o((...args) => $options.onTouchStart && $options.onTouchStart(...args)),
    C: common_vendor.o((...args) => $options.onTouchMove && $options.onTouchMove(...args)),
    D: common_vendor.o((...args) => $options.onTouchEnd && $options.onTouchEnd(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a67938aa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
