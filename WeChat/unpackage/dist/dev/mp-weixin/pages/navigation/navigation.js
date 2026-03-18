"use strict";
const common_vendor = require("../../common/vendor.js");
const mixins_tabSwipe = require("../../mixins/tabSwipe.js");
const AMAP_KEY = "YOUR_AMAP_KEY_HERE";
const _sfc_main = common_vendor.defineComponent({
  mixins: [mixins_tabSwipe.tabSwipe],
  data() {
    return {
      pagePath: "/pages/navigation/navigation",
      // 地图基础设置
      latitude: 32.1230155,
      longitude: 118.93069167,
      scale: 16,
      mapType: 0,
      // 地图标记
      markers: [
        new UTSJSONObject({
          id: 1,
          latitude: 32.1230155,
          longitude: 118.93069167,
          title: "园区中心",
          iconPath: "/static/map/marker.png",
          width: 30,
          height: 40,
          callout: new UTSJSONObject({
            content: "园区智能监控中心\n点击查看详情",
            color: "#333333",
            fontSize: 14,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#008c8c",
            bgColor: "#ffffff",
            padding: 8,
            display: "ALWAYS"
          })
        }),
        new UTSJSONObject({
          id: 2,
          latitude: 32.1232155,
          longitude: 118.93089167,
          title: "机器人A",
          iconPath: "/static/map/robot.png",
          width: 35,
          height: 35,
          label: new UTSJSONObject({
            content: "🔋85%",
            color: "#008c8c",
            fontSize: 12,
            bgColor: "#ffffff",
            borderRadius: 8,
            padding: 4,
            borderWidth: 1,
            borderColor: "#008c8c"
          })
        })
      ],
      // 路径规划
      polyline: [],
      routeInfo: new UTSJSONObject({
        distance: 0,
        duration: 0,
        mode: "步行"
      }),
      // 地图控件
      controls: [
        new UTSJSONObject({
          id: 1,
          iconPath: "/static/map/locate.png",
          position: new UTSJSONObject({
            left: 10,
            top: 10,
            width: 40,
            height: 40
          }),
          clickable: true
        })
      ],
      // 搜索
      searchKeyword: "",
      searchResults: [],
      showSearchResults: false,
      // 目的地设置
      showDestinationPanel: false,
      currentPosition: "",
      destination: "",
      destinationMarker: null,
      // 底部信息
      showBottomInfo: true
    };
  },
  computed: {
    mapTypeText() {
      return this.mapType === 0 ? "标准" : "卫星";
    }
  },
  onShow() {
    if (this.translateX !== void 0) {
      this.translateX = 0;
    }
    this.syncTabBar();
    this.initMap();
  },
  onHide() {
    if (this.mapContext) {
      this.mapContext = null;
    }
  },
  methods: {
    handleSwipe(diffX = null) {
      if (diffX > 0) {
        common_vendor.index.switchTab({
          url: "/pages/device/device",
          success: () => {
            this.setTabBarActive(0);
          },
          fail: (err) => {
            common_vendor.index.__f__("warn", "at pages/navigation/navigation.uvue:280", "切换tab失败:", err);
          }
        });
      } else if (diffX < 0) {
        common_vendor.index.switchTab({
          url: "/pages/profile/profile",
          success: () => {
            this.setTabBarActive(2);
          },
          fail: (err) => {
            common_vendor.index.__f__("warn", "at pages/navigation/navigation.uvue:290", "切换tab失败:", err);
          }
        });
      }
    },
    // 初始化地图
    initMap() {
      this.mapContext = common_vendor.index.createMapContext("myMap", this);
      this.getCurrentLocation();
      this.addDefaultMarkers();
    },
    // 获取当前位置
    getCurrentLocation() {
      common_vendor.index.getLocation(new UTSJSONObject({
        type: "gcj02",
        success: (res) => {
          this.latitude = res.latitude;
          this.longitude = res.longitude;
          this.currentPosition = `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`;
          this.mapContext.moveToLocation();
        },
        fail: (err) => {
          common_vendor.index.__f__("log", "at pages/navigation/navigation.uvue:321", "获取位置失败:", err);
          common_vendor.index.showToast({
            title: "获取位置失败",
            icon: "none"
          });
        }
      }));
    },
    // 添加默认标记
    addDefaultMarkers() {
    },
    // 标记点击事件
    onMarkerTap(e = null) {
      const markerId = e.markerId;
      const marker = this.markers.find((m = null) => {
        return m.id === markerId;
      });
      if (marker) {
        common_vendor.index.showModal(new UTSJSONObject({
          title: marker.title || "位置信息",
          content: `经纬度: ${marker.latitude.toFixed(6)}, ${marker.longitude.toFixed(6)}`,
          showCancel: false,
          confirmText: "设为目的地"
        }));
      }
    },
    // 控件点击事件
    onControlTap(e = null) {
      const controlId = e.controlId;
      if (controlId === 1) {
        this.locateMe();
      }
    },
    // 区域变化事件
    onRegionChange(e = null) {
      if (e.type === "end") {
        this.mapContext.getCenterLocation(new UTSJSONObject({
          success: (res = null) => {
            this.latitude = res.latitude;
            this.longitude = res.longitude;
          }
        }));
      }
    },
    // 定位到我的位置
    locateMe() {
      this.getCurrentLocation();
      common_vendor.index.showToast({
        title: "定位到当前位置",
        icon: "success"
      });
    },
    // 切换地图类型
    toggleMapType() {
      this.mapType = this.mapType === 0 ? 1 : 0;
      common_vendor.index.showToast({
        title: `切换到${this.mapTypeText}地图`,
        icon: "none"
      });
    },
    // 放大
    zoomIn() {
      if (this.scale < 20) {
        this.scale += 1;
      }
    },
    // 缩小
    zoomOut() {
      if (this.scale > 3) {
        this.scale -= 1;
      }
    },
    // 搜索地点
    searchPlace() {
      if (!this.searchKeyword.trim()) {
        common_vendor.index.showToast({
          title: "请输入搜索关键词",
          icon: "none"
        });
        return null;
      }
      common_vendor.index.showLoading({
        title: "搜索中..."
      });
      this.searchWithAmap(this.searchKeyword);
    },
    // 使用高德地图搜索（需要服务器代理）
    searchWithAmap(keyword = null) {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        try {
          const response = yield common_vendor.index.request({
            url: `https://your-server.com/api/search?keyword=${encodeURIComponent(keyword)}&key=${AMAP_KEY}`,
            method: "GET"
          });
          if (response.data.status === "1") {
            this.searchResults = response.data.pois;
            this.showSearchResults = true;
          } else {
            common_vendor.index.showToast({
              title: "搜索失败",
              icon: "none"
            });
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/navigation/navigation.uvue:445", "搜索出错:", error);
          common_vendor.index.showToast({
            title: "网络错误",
            icon: "none"
          });
        } finally {
          common_vendor.index.hideLoading();
        }
      });
    },
    // 搜索框聚焦
    onSearchFocus() {
      this.showSearchResults = true;
    },
    // 搜索框失焦
    onSearchBlur() {
      setTimeout(() => {
        this.showSearchResults = false;
      }, 200);
    },
    // 打开目的地面板
    openDestinationPanel() {
      this.showDestinationPanel = true;
    },
    // 关闭目的地面板
    closeDestinationPanel() {
      this.showDestinationPanel = false;
    },
    // 在地图上选择
    selectOnMap() {
      common_vendor.index.showToast({
        title: "请点击地图上的位置",
        icon: "none"
      });
    },
    // 确认目的地
    confirmDestination() {
      if (this.destination.trim()) {
        this.parseDestination(this.destination);
      }
    },
    // 解析目的地
    parseDestination(input = null) {
      const coordPattern = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      if (coordPattern.test(input)) {
        const _a = common_vendor.__read(input.split(",").map(Number), 2), lat = _a[0], lng = _a[1];
        this.addDestinationMarker(lat, lng);
      } else {
        this.geocodeAddress(input);
      }
    },
    // 添加目的地标记
    addDestinationMarker(latitude = null, longitude = null) {
      this.markers = this.markers.filter((m = null) => {
        return m.id !== 999;
      });
      this.markers.push(new UTSJSONObject({
        id: 999,
        latitude,
        longitude,
        title: "目的地",
        iconPath: "/static/map/destination.png",
        width: 40,
        height: 40
      }));
      this.destinationMarker = new UTSJSONObject({
        latitude,
        longitude
      });
      common_vendor.index.showToast({
        title: "已设置目的地",
        icon: "success"
      });
    },
    // 地址地理编码（需要服务器代理）
    geocodeAddress(address = null) {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        common_vendor.index.showLoading({
          title: "解析地址中..."
        });
        try {
          const response = yield common_vendor.index.request({
            url: `https://your-server.com/api/geocode?address=${encodeURIComponent(address)}&key=${AMAP_KEY}`,
            method: "GET"
          });
          if (response.data.status === "1" && response.data.geocodes.length > 0) {
            const location_1 = response.data.geocodes[0].location;
            const _a = common_vendor.__read(location_1.split(",").map(Number), 2), lng = _a[0], lat = _a[1];
            this.addDestinationMarker(lat, lng);
            this.destination = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          } else {
            common_vendor.index.showToast({
              title: "地址解析失败",
              icon: "none"
            });
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/navigation/navigation.uvue:563", "地址解析出错:", error);
          common_vendor.index.showToast({
            title: "网络错误",
            icon: "none"
          });
        } finally {
          common_vendor.index.hideLoading();
        }
      });
    },
    // 规划路线
    planRoute() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        if (!this.currentPosition || !this.destinationMarker) {
          common_vendor.index.showToast({
            title: "请先设置起点和目的地",
            icon: "none"
          });
          return Promise.resolve(null);
        }
        common_vendor.index.showLoading({
          title: "路线规划中..."
        });
        try {
          const origin_1 = this.currentPosition.split(",").map(Number).reverse().join(",");
          const destination = `${this.destinationMarker.longitude},${this.destinationMarker.latitude}`;
          const response = yield common_vendor.index.request({
            url: `https://your-server.com/api/direction/walking?origin=${origin_1}&destination=${destination}&key=${AMAP_KEY}`,
            method: "GET"
          });
          if (response.data.status === "1" && response.data.route.paths.length > 0) {
            const path = response.data.route.paths[0];
            this.routeInfo = new UTSJSONObject({
              distance: (path.distance / 1e3).toFixed(2),
              duration: Math.ceil(path.duration / 60),
              mode: "步行"
            });
            this.drawRoute(path.steps);
            common_vendor.index.showToast({
              title: "路线规划成功",
              icon: "success"
            });
          } else {
            common_vendor.index.showToast({
              title: "路线规划失败",
              icon: "none"
            });
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/navigation/navigation.uvue:621", "路线规划出错:", error);
          common_vendor.index.showToast({
            title: "网络错误",
            icon: "none"
          });
        } finally {
          common_vendor.index.hideLoading();
        }
      });
    },
    // 绘制路线
    drawRoute(steps = null) {
      const points = [];
      steps.forEach((step = null) => {
        const polyline = step.polyline.split(";");
        polyline.forEach((point = null) => {
          const _a = common_vendor.__read(point.split(",").map(Number), 2), lng = _a[0], lat = _a[1];
          points.push({
            latitude: lat,
            longitude: lng
          });
        });
      });
      this.polyline = [new UTSJSONObject({
        points,
        color: "#008c8c",
        width: 6,
        dottedLine: false
      })];
    },
    // 发送到设备
    sendToDevice() {
      if (!this.routeInfo.distance) {
        common_vendor.index.showToast({
          title: "请先规划路线",
          icon: "none"
        });
        return null;
      }
      common_vendor.index.showModal(new UTSJSONObject({
        title: "发送目的地",
        content: `将目的地(${this.destinationMarker.latitude.toFixed(6)}, ${this.destinationMarker.longitude.toFixed(6)})发送到巡检机器人？`,
        success: (res) => {
          if (res.confirm) {
            this.sendDestinationToRobot();
          }
        }
      }));
    },
    // 发送目的地到机器人（需要后端API）
    sendDestinationToRobot() {
      return common_vendor.__awaiter(this, void 0, void 0, function* () {
        common_vendor.index.showLoading({
          title: "发送中..."
        });
        try {
          const response = yield common_vendor.index.request({
            url: "https://your-server.com/api/robot/destination",
            method: "POST",
            data: new UTSJSONObject({
              longitude: this.destinationMarker.longitude,
              latitude: this.destinationMarker.latitude,
              distance: this.routeInfo.distance,
              duration: this.routeInfo.duration
            })
          });
          if (response.data.success) {
            common_vendor.index.showToast({
              title: "目的地已发送",
              icon: "success"
            });
          } else {
            common_vendor.index.showToast({
              title: "发送失败",
              icon: "none"
            });
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/navigation/navigation.uvue:705", "发送目的地出错:", error);
          common_vendor.index.showToast({
            title: "网络错误",
            icon: "none"
          });
        } finally {
          common_vendor.index.hideLoading();
        }
      });
    },
    // 清除路线
    clearRoute() {
      this.polyline = [];
      this.routeInfo = new UTSJSONObject({
        distance: 0,
        duration: 0,
        mode: "步行"
      });
      this.markers = this.markers.filter((m = null) => {
        return m.id !== 999;
      });
      this.destinationMarker = null;
      this.destination = "";
      common_vendor.index.showToast({
        title: "已清除路线",
        icon: "success"
      });
    },
    // 切换底部信息显示
    toggleBottomInfo() {
      this.showBottomInfo = !this.showBottomInfo;
    }
  }
});
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.sei("myMap", "map"),
    b: $data.latitude,
    c: $data.longitude,
    d: $data.scale,
    e: $data.markers,
    f: $data.polyline,
    g: $data.controls,
    h: common_vendor.o((...args) => $options.onMarkerTap && $options.onMarkerTap(...args)),
    i: common_vendor.o((...args) => $options.onControlTap && $options.onControlTap(...args)),
    j: common_vendor.o((...args) => $options.onRegionChange && $options.onRegionChange(...args)),
    k: common_vendor.o((...args) => $options.locateMe && $options.locateMe(...args)),
    l: common_vendor.t($options.mapTypeText),
    m: common_vendor.o((...args) => $options.toggleMapType && $options.toggleMapType(...args)),
    n: common_vendor.o((...args) => $options.zoomIn && $options.zoomIn(...args)),
    o: common_vendor.o((...args) => $options.zoomOut && $options.zoomOut(...args)),
    p: common_vendor.o((...args) => $options.searchPlace && $options.searchPlace(...args)),
    q: common_vendor.o((...args) => $options.onSearchFocus && $options.onSearchFocus(...args)),
    r: common_vendor.o((...args) => $options.onSearchBlur && $options.onSearchBlur(...args)),
    s: $data.searchKeyword,
    t: common_vendor.o(($event) => $data.searchKeyword = $event.detail.value),
    v: common_vendor.o((...args) => $options.searchPlace && $options.searchPlace(...args)),
    w: $data.showDestinationPanel
  }, $data.showDestinationPanel ? common_vendor.e({
    x: common_vendor.o((...args) => $options.closeDestinationPanel && $options.closeDestinationPanel(...args)),
    y: $data.currentPosition,
    z: common_vendor.o(($event) => $data.currentPosition = $event.detail.value),
    A: common_vendor.o((...args) => $options.confirmDestination && $options.confirmDestination(...args)),
    B: $data.destination,
    C: common_vendor.o(($event) => $data.destination = $event.detail.value),
    D: common_vendor.o((...args) => $options.getCurrentLocation && $options.getCurrentLocation(...args)),
    E: common_vendor.o((...args) => $options.selectOnMap && $options.selectOnMap(...args)),
    F: $data.routeInfo.distance
  }, $data.routeInfo.distance ? {
    G: common_vendor.t($data.routeInfo.distance),
    H: common_vendor.t($data.routeInfo.duration),
    I: common_vendor.t($data.routeInfo.mode)
  } : {}, {
    J: common_vendor.o((...args) => $options.planRoute && $options.planRoute(...args)),
    K: common_vendor.o((...args) => $options.sendToDevice && $options.sendToDevice(...args)),
    L: !$data.routeInfo.distance ? 1 : "",
    M: common_vendor.o((...args) => $options.clearRoute && $options.clearRoute(...args))
  }) : {}, {
    N: $data.showBottomInfo
  }, $data.showBottomInfo ? {
    O: common_vendor.t($data.latitude.toFixed(6)),
    P: common_vendor.t($data.longitude.toFixed(6)),
    Q: common_vendor.t($data.scale),
    R: common_vendor.t($data.markers.length),
    S: common_vendor.t($data.showBottomInfo ? "👇" : "👆"),
    T: common_vendor.o((...args) => $options.toggleBottomInfo && $options.toggleBottomInfo(...args))
  } : {}, {
    U: common_vendor.sei(common_vendor.gei(_ctx, ""), "view"),
    V: `translateX(${_ctx.translateX}px)`,
    W: common_vendor.o((...args) => _ctx.onTouchStart && _ctx.onTouchStart(...args)),
    X: common_vendor.o((...args) => _ctx.onTouchMove && _ctx.onTouchMove(...args)),
    Y: common_vendor.o((...args) => _ctx.onTouchEnd && _ctx.onTouchEnd(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b45088b6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/navigation/navigation.js.map
