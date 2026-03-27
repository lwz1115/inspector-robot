if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const SERVER_IP = "192.168.31.163";
  const SERVER_PORT = "8080";
  const BASE = "http://" + SERVER_IP + ":" + SERVER_PORT + "/api";
  function toStr(v) {
    if (v == null)
      return "";
    return "" + v;
  }
  function storageString(key) {
    try {
      return toStr(uni.getStorageSync(key));
    } catch (e) {
      return "";
    }
  }
  function errMsgFromCatch(e) {
    if (e == null)
      return "";
    return toStr(e.errMsg);
  }
  const CLASSIC = {
    id: "classic",
    name: "经典青绿",
    primary: "#008c8c",
    primary2: "#00a8a8",
    bg: "#f1f1f1",
    card: "#ffffff",
    text: "#333333",
    textSub: "#666666",
    border: "#e8e8e8",
    inputBg: "#f8f9fa",
    headerBg: "linear-gradient(135deg,#008c8c,#00a8a8)",
    tabActive: "#008c8c",
    btnText: "#ffffff",
    danger: "#ff4d4f"
  };
  const MIDNIGHT = {
    id: "midnight",
    name: "深夜极光",
    primary: "#7c3aed",
    primary2: "#a78bfa",
    bg: "#0d1117",
    card: "#161b22",
    text: "#e6edf3",
    textSub: "#8b949e",
    border: "#30363d",
    inputBg: "#21262d",
    headerBg: "linear-gradient(135deg,#1e1b4b,#312e81)",
    tabActive: "#a78bfa",
    btnText: "#ffffff",
    danger: "#f85149"
  };
  const SAKURA = {
    id: "sakura",
    name: "樱花物语",
    primary: "#ec4899",
    primary2: "#f472b6",
    bg: "#fff0f6",
    card: "#ffffff",
    text: "#4a1942",
    textSub: "#9d4e8a",
    border: "#fce7f3",
    inputBg: "#fff5f9",
    headerBg: "linear-gradient(135deg,#f472b6,#ec4899)",
    tabActive: "#ec4899",
    btnText: "#ffffff",
    danger: "#e11d48"
  };
  function themeById(id) {
    if (id === "midnight")
      return MIDNIGHT;
    if (id === "sakura")
      return SAKURA;
    return CLASSIC;
  }
  function getThemeVars() {
    try {
      const id = storageString("appTheme") || "classic";
      return themeById(id);
    } catch (e) {
      return CLASSIC;
    }
  }
  function withMeta(base, desc, swatches) {
    return { ...base, desc, swatches };
  }
  function getThemeList() {
    return [
      withMeta(CLASSIC, "沉稳清爽的默认风格，青绿主色调，适合日常使用", ["#008c8c", "#00a8a8", "#f1f1f1", "#ffffff"]),
      withMeta(MIDNIGHT, "深色背景配霓虹紫蓝，科技感十足，护眼夜间模式", ["#0d1117", "#161b22", "#7c3aed", "#a78bfa"]),
      withMeta(SAKURA, "粉白渐变，温柔细腻，清新少女风格", ["#fff0f6", "#ffffff", "#ec4899", "#f472b6"])
    ];
  }
  const _imports_0$1 = "/static/1.jpg";
  const _imports_1 = "/static/2.jpg";
  const _imports_2 = "/static/3.jpg";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$7 = {
    data() {
      return {
        username: "",
        password: "",
        rememberPassword: false,
        loading: false,
        theme: getThemeVars()
      };
    },
    computed: {
      cardStyle() {
        return "background:" + this.theme.card + ";";
      },
      textStyle() {
        return "color:" + this.theme.text + ";";
      },
      subTextStyle() {
        return "color:" + this.theme.textSub + ";";
      },
      linkStyle() {
        return "color:" + this.theme.primary + ";font-size:26rpx;";
      },
      inputWrapStyle() {
        return "border:2rpx solid " + this.theme.border + ";background:" + this.theme.inputBg + ";";
      },
      inputTextStyle() {
        return "color:" + this.theme.text + ";";
      },
      accentLineStyle() {
        return "background:linear-gradient(90deg," + this.theme.primary + "," + this.theme.primary2 + ");";
      },
      btnStyle() {
        return "background:linear-gradient(135deg," + this.theme.primary + "," + this.theme.primary2 + ");";
      },
      checkedStyle() {
        return "background:" + this.theme.primary + ";border-color:" + this.theme.primary + ";";
      }
    },
    onShow() {
      this.theme = getThemeVars();
    },
    onLoad() {
      try {
        const saved = storageString("rememberedUser");
        if (saved.length > 0) {
          this.username = saved;
          this.rememberPassword = true;
        }
      } catch (e) {
      }
      this.checkAutoLogin();
    },
    methods: {
      checkAutoLogin() {
        try {
          const userIdStr = storageString("userId");
          const loginTimeStr = storageString("loginTime");
          if (userIdStr.length === 0 || loginTimeStr.length === 0) {
            return;
          }
          const loginTime = parseFloat(loginTimeStr);
          if (isNaN(loginTime)) {
            return;
          }
          if (Date.now() - loginTime < 24 * 3600 * 1e3) {
            uni.switchTab({ url: "/pages/device/device" });
          }
        } catch (e) {
        }
      },
      toggleRemember() {
        this.rememberPassword = !this.rememberPassword;
      },
      forgotPassword() {
        uni.showModal({ title: "忘记密码", content: "请通过 Web 端使用邮箱验证码找回密码", showCancel: false, confirmText: "知道了" });
      },
      async handleLogin() {
        const username = toStr(this.username).trim();
        const password = toStr(this.password);
        if (username.length === 0) {
          uni.showToast({ title: "请输入用户名", icon: "none" });
          return;
        }
        if (password.length === 0) {
          uni.showToast({ title: "请输入密码", icon: "none" });
          return;
        }
        if (this.loading)
          return;
        this.loading = true;
        uni.showLoading({ title: "登录中...", mask: true });
        try {
          const res = await uni.request({
            url: BASE + "/auth/login",
            method: "POST",
            data: "username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password),
            header: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 1e4
          });
          uni.hideLoading();
          const status = res.statusCode;
          const result = res.data;
          if (status === 200 && result != null && result.success === true) {
            if (this.rememberPassword)
              uni.setStorageSync("rememberedUser", username);
            else {
              try {
                uni.removeStorageSync("rememberedUser");
              } catch (e) {
              }
            }
            const savedUserId = result.userId != null ? toStr(result.userId) : "";
            const unameRaw = result.username;
            const savedUsername = unameRaw != null && toStr(unameRaw).length > 0 ? toStr(unameRaw) : username;
            uni.setStorageSync("userId", savedUserId);
            uni.setStorageSync("currentUsername", savedUsername);
            uni.setStorageSync("loginTime", Date.now());
            uni.showToast({ title: "登录成功", icon: "success", duration: 1500 });
            setTimeout(() => {
              uni.switchTab({ url: "/pages/device/device" });
            }, 1500);
          } else {
            let errTitle = "用户名或密码错误";
            if (result != null) {
              const m = result.message;
              if (m != null && toStr(m).length > 0) {
                errTitle = toStr(m);
              }
            }
            uni.showToast({ title: errTitle, icon: "none", duration: 2500 });
          }
        } catch (e) {
          uni.hideLoading();
          const msg = errMsgFromCatch(e);
          if (msg.indexOf("timeout") >= 0)
            uni.showToast({ title: "请求超时，请检查网络", icon: "none", duration: 2500 });
          else
            uni.showToast({ title: "无法连接到服务器", icon: "none", duration: 2500 });
        } finally {
          this.loading = false;
        }
      },
      goToAbout() {
        uni.navigateTo({ url: "/pages/about/about" });
      },
      goToRegister() {
        uni.navigateTo({ url: "/pages/register/register" });
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
      vue.createElementVNode("view", { class: "safe-area-top" }),
      vue.createElementVNode("view", { class: "main-content" }, [
        vue.createElementVNode("view", { class: "swiper-container" }, [
          vue.createElementVNode("swiper", {
            class: "swiper",
            "indicator-dots": "true",
            "indicator-active-color": "#ffffff",
            autoplay: "true",
            interval: "3000",
            duration: "500",
            circular: "true"
          }, [
            vue.createElementVNode("swiper-item", null, [
              vue.createElementVNode("image", {
                class: "swiper-image",
                src: _imports_0$1,
                mode: "aspectFill"
              })
            ]),
            vue.createElementVNode("swiper-item", null, [
              vue.createElementVNode("image", {
                class: "swiper-image",
                src: _imports_1,
                mode: "aspectFill"
              })
            ]),
            vue.createElementVNode("swiper-item", null, [
              vue.createElementVNode("image", {
                class: "swiper-image",
                src: _imports_2,
                mode: "aspectFill"
              })
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "page-title-box" }, [
          vue.createElementVNode(
            "text",
            {
              class: "page-title",
              style: vue.normalizeStyle($options.textStyle)
            },
            "巡检机器人管理系统",
            4
            /* STYLE */
          )
        ]),
        vue.createElementVNode(
          "view",
          {
            class: "login-form",
            style: vue.normalizeStyle($options.cardStyle)
          },
          [
            vue.createElementVNode("view", { class: "form-title" }, [
              vue.createElementVNode(
                "text",
                {
                  class: "title-text",
                  style: vue.normalizeStyle($options.textStyle)
                },
                "用户登录",
                4
                /* STYLE */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: "title-line",
                  style: vue.normalizeStyle($options.accentLineStyle)
                },
                null,
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "input-icon-wrap",
                  style: vue.normalizeStyle($options.inputWrapStyle)
                },
                [
                  vue.createElementVNode("text", { class: "input-icon" }, "👤"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "input",
                      style: vue.normalizeStyle($options.inputTextStyle),
                      type: "text",
                      placeholder: "请输入用户名",
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.username = $event),
                      "placeholder-class": "placeholder"
                    },
                    null,
                    4
                    /* STYLE */
                  ), [
                    [vue.vModelText, $data.username]
                  ])
                ],
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "input-icon-wrap",
                  style: vue.normalizeStyle($options.inputWrapStyle)
                },
                [
                  vue.createElementVNode("text", { class: "input-icon" }, "🔒"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "input",
                      style: vue.normalizeStyle($options.inputTextStyle),
                      type: "password",
                      placeholder: "请输入密码",
                      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.password = $event),
                      "placeholder-class": "placeholder"
                    },
                    null,
                    4
                    /* STYLE */
                  ), [
                    [vue.vModelText, $data.password]
                  ])
                ],
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode("view", { class: "form-options" }, [
              vue.createElementVNode("view", {
                class: "remember-me",
                onClick: _cache[2] || (_cache[2] = (...args) => $options.toggleRemember && $options.toggleRemember(...args))
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "checkbox",
                    style: vue.normalizeStyle($data.rememberPassword ? $options.checkedStyle : "")
                  },
                  [
                    $data.rememberPassword ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "checkmark"
                    }, "✓")) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "text",
                  {
                    class: "option-text",
                    style: vue.normalizeStyle($options.subTextStyle)
                  },
                  "记住密码",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", {
                onClick: _cache[3] || (_cache[3] = (...args) => $options.forgotPassword && $options.forgotPassword(...args))
              }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: "option-text",
                    style: vue.normalizeStyle($options.linkStyle)
                  },
                  "忘记密码？",
                  4
                  /* STYLE */
                )
              ])
            ]),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["login-button", { disabled: $data.loading }]),
                style: vue.normalizeStyle($options.btnStyle),
                onClick: _cache[4] || (_cache[4] = (...args) => $options.handleLogin && $options.handleLogin(...args))
              },
              [
                vue.createElementVNode(
                  "text",
                  { class: "login-button-text" },
                  vue.toDisplayString($data.loading ? "登录中..." : "立即登录"),
                  1
                  /* TEXT */
                )
              ],
              6
              /* CLASS, STYLE */
            ),
            vue.createElementVNode("view", { class: "register-link" }, [
              vue.createElementVNode(
                "text",
                {
                  class: "register-text",
                  style: vue.normalizeStyle($options.subTextStyle)
                },
                "还没有账号？",
                4
                /* STYLE */
              ),
              vue.createElementVNode(
                "text",
                {
                  style: vue.normalizeStyle($options.linkStyle),
                  onClick: _cache[5] || (_cache[5] = (...args) => $options.goToRegister && $options.goToRegister(...args))
                },
                "立即注册",
                4
                /* STYLE */
              )
            ])
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode("text", { class: "copyright" }, "© 2025 李文卓 · 物联2431"),
          vue.createElementVNode("view", {
            class: "about-link",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.goToAbout && $options.goToAbout(...args))
          }, [
            vue.createElementVNode(
              "text",
              {
                style: vue.normalizeStyle($options.linkStyle)
              },
              "关于我们",
              4
              /* STYLE */
            )
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "safe-area-bottom" })
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-1cf27b2a"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/index/index.vue"]]);
  const _imports_0 = "/static/banner-list.jpg";
  const _sfc_main$6 = {
    data() {
      return {
        latitude: 32.12934755,
        longitude: 118.95012178,
        markers: [{
          id: 1,
          latitude: 32.12934755,
          longitude: 118.95012178,
          title: "南京工业职业技术大学",
          width: 30,
          height: 30
        }],
        theme: getThemeVars()
      };
    },
    onShow() {
      this.theme = getThemeVars();
    },
    methods: {
      // 返回上一页
      goBack() {
        uni.navigateBack();
      },
      // 打开系统地图查看详细位置（与页面方法名避免与内置符号冲突）
      handleOpenMapLocation() {
        uni.openLocation({
          latitude: this.latitude,
          longitude: this.longitude,
          name: "南京工业职业技术大学",
          address: "江苏省南京市栖霞区仙林大学城羊山北路1号",
          scale: 18
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "container",
        style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: "nav-header",
            style: vue.normalizeStyle("background:" + $data.theme.card + ";border-bottom:1rpx solid " + $data.theme.border + ";")
          },
          [
            vue.createElementVNode("view", {
              class: "nav-back",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
            }, [
              vue.createElementVNode(
                "text",
                {
                  class: "back-text",
                  style: vue.normalizeStyle("color:" + $data.theme.primary + ";")
                },
                "‹",
                4
                /* STYLE */
              ),
              vue.createElementVNode(
                "text",
                {
                  class: "back-label",
                  style: vue.normalizeStyle("color:" + $data.theme.primary + ";")
                },
                "返回",
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode(
              "text",
              {
                class: "nav-title",
                style: vue.normalizeStyle("color:" + $data.theme.text + ";")
              },
              "关于我们",
              4
              /* STYLE */
            ),
            vue.createElementVNode("view", { class: "nav-placeholder" })
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode("scroll-view", {
          class: "content",
          "scroll-y": "true"
        }, [
          vue.createElementVNode("view", { class: "image-section" }, [
            vue.createElementVNode("image", {
              class: "campus-image",
              src: _imports_0,
              mode: "aspectFill"
            }),
            vue.createElementVNode("view", { class: "image-overlay" }, [
              vue.createElementVNode(
                "text",
                {
                  class: "overlay-title",
                  style: vue.normalizeStyle("color:" + $data.theme.card + ";")
                },
                "南京工业职业技术大学",
                4
                /* STYLE */
              ),
              vue.createElementVNode(
                "text",
                {
                  class: "overlay-subtitle",
                  style: vue.normalizeStyle("color:" + $data.theme.card + ";")
                },
                "Nanjing Vocational University of Industry Technology",
                4
                /* STYLE */
              )
            ])
          ]),
          vue.createElementVNode(
            "view",
            {
              class: "info-card",
              style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
            },
            [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "header-icon" }, "🏫"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "header-title",
                    style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                  },
                  "学校信息",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "contact-list" }, [
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "📞"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "联系电话"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "025-85864009",
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "🎓"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "招生咨询电话"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "025-85861136",
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "📠"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "传真"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "025-84498778",
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "📧"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "E-mail"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "nlit@nlit.edu.cn",
                      4
                      /* STYLE */
                    )
                  ])
                ])
              ])
            ],
            4
            /* STYLE */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "map-card",
              style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
            },
            [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "header-icon" }, "📍"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "header-title",
                    style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                  },
                  "学校位置",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "map-container" }, [
                vue.createElementVNode("map", {
                  class: "map",
                  latitude: $data.latitude,
                  longitude: $data.longitude,
                  markers: $data.markers,
                  scale: "16",
                  "show-location": "",
                  onTap: _cache[1] || (_cache[1] = (...args) => $options.handleOpenMapLocation && $options.handleOpenMapLocation(...args))
                }, null, 40, ["latitude", "longitude", "markers"]),
                vue.createElementVNode("view", {
                  class: "map-overlay",
                  onClick: _cache[2] || (_cache[2] = (...args) => $options.handleOpenMapLocation && $options.handleOpenMapLocation(...args))
                }, [
                  vue.createElementVNode("text", { class: "map-address" }, "点击查看详细位置")
                ])
              ]),
              vue.createElementVNode(
                "text",
                {
                  class: "location-text",
                  style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                },
                "江苏省南京市栖霞区仙林大学城羊山北路1号",
                4
                /* STYLE */
              )
            ],
            4
            /* STYLE */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "team-card",
              style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
            },
            [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "header-icon" }, "👥"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "header-title",
                    style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                  },
                  "开发团队",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode(
                "text",
                {
                  class: "team-info",
                  style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                },
                "李文卓",
                4
                /* STYLE */
              ),
              vue.createElementVNode("view", { class: "contact-list team-contact" }, [
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "📞"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "电话"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "13865571613",
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "📧"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "邮箱"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "3397214850@qq.com",
                      4
                      /* STYLE */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "contact-item" }, [
                  vue.createElementVNode("text", { class: "contact-icon" }, "💬"),
                  vue.createElementVNode("view", { class: "contact-info" }, [
                    vue.createElementVNode("text", { class: "contact-label" }, "微信"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "contact-value",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "liwenzhuo1115",
                      4
                      /* STYLE */
                    )
                  ])
                ])
              ])
            ],
            4
            /* STYLE */
          ),
          vue.createElementVNode("view", { class: "bottom-info" }, [
            vue.createElementVNode(
              "text",
              {
                class: "copyright",
                style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
              },
              "©2025 南京工业职业技术大学 版权所有",
              4
              /* STYLE */
            )
          ])
        ])
      ],
      4
      /* STYLE */
    );
  }
  const PagesAboutAbout = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-13a78ac6"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/about/about.vue"]]);
  const _sfc_main$5 = {
    data() {
      return {
        username: "",
        password: "",
        confirmPassword: "",
        phone: "",
        nickname: "",
        email: "",
        emailCode: "",
        agreed: false,
        showPassword: false,
        showConfirmPassword: false,
        loading: false,
        codeCooldown: 0,
        codeTimer: null,
        theme: getThemeVars()
      };
    },
    onShow() {
      this.theme = getThemeVars();
    },
    onUnload() {
      if (this.codeTimer != null)
        clearInterval(this.codeTimer);
    },
    methods: {
      togglePassword() {
        this.showPassword = !this.showPassword;
      },
      toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
      },
      toggleAgreement() {
        this.agreed = !this.agreed;
      },
      showAgreementModal() {
        uni.showModal({
          title: "用户协议",
          content: "本系统仅供授权用户使用，请遵守相关法律法规，合理使用系统功能。",
          showCancel: false,
          confirmText: "知道了"
        });
      },
      validateForm() {
        const username = toStr(this.username).trim();
        const password = toStr(this.password);
        const phone = toStr(this.phone).trim();
        const email = toStr(this.email).trim();
        const code = toStr(this.emailCode).trim();
        if (username.length === 0) {
          uni.showToast({ title: "请输入用户名", icon: "none" });
          return false;
        }
        if (username.length < 2) {
          uni.showToast({ title: "用户名至少2位", icon: "none" });
          return false;
        }
        if (password.length === 0) {
          uni.showToast({ title: "请输入密码", icon: "none" });
          return false;
        }
        if (password.length < 6) {
          uni.showToast({ title: "密码至少6位", icon: "none" });
          return false;
        }
        if (password !== toStr(this.confirmPassword)) {
          uni.showToast({ title: "两次密码不一致", icon: "none" });
          return false;
        }
        if (phone.length === 0 || !/^1[3-9]\d{9}$/.test(phone)) {
          uni.showToast({ title: "请输入正确的手机号", icon: "none" });
          return false;
        }
        if (email.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          uni.showToast({ title: "请输入正确的邮箱", icon: "none" });
          return false;
        }
        if (code.length === 0) {
          uni.showToast({ title: "请输入邮箱验证码", icon: "none" });
          return false;
        }
        if (this.agreed !== true) {
          uni.showToast({ title: "请同意用户协议", icon: "none" });
          return false;
        }
        return true;
      },
      async sendEmailCode() {
        if (this.codeCooldown > 0)
          return;
        const email = toStr(this.email).trim();
        if (email.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          uni.showToast({ title: "请先输入正确的邮箱", icon: "none" });
          return;
        }
        uni.showLoading({ title: "发送中...", mask: true });
        try {
          const res = await uni.request({
            url: BASE + "/auth/email/send",
            method: "POST",
            data: "email=" + encodeURIComponent(email),
            header: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 1e4
          });
          uni.hideLoading();
          const status = res.statusCode;
          const result = res.data;
          if (status === 200 && result != null && result.success === true) {
            uni.showToast({ title: "验证码已发送", icon: "success" });
            this.startCooldown();
          } else {
            let sendErr = "发送失败";
            if (result != null) {
              const m = result.message;
              if (m != null && toStr(m).length > 0) {
                sendErr = toStr(m);
              }
            }
            uni.showToast({ title: sendErr, icon: "none", duration: 2500 });
          }
        } catch (e) {
          uni.hideLoading();
          const msg = errMsgFromCatch(e);
          if (msg.indexOf("timeout") >= 0)
            uni.showToast({ title: "请求超时", icon: "none" });
          else
            uni.showToast({ title: "无法连接到服务器", icon: "none" });
        }
      },
      startCooldown() {
        this.codeCooldown = 60;
        this.codeTimer = setInterval(() => {
          this.codeCooldown--;
          if (this.codeCooldown <= 0) {
            clearInterval(this.codeTimer);
            this.codeTimer = null;
            this.codeCooldown = 0;
          }
        }, 1e3);
      },
      async handleRegister() {
        if (this.validateForm() !== true)
          return;
        if (this.loading)
          return;
        this.loading = true;
        uni.showLoading({ title: "注册中...", mask: true });
        try {
          const nickTrim = toStr(this.nickname).trim();
          const unameTrim = toStr(this.username).trim();
          const res = await uni.request({
            url: BASE + "/auth/register",
            method: "POST",
            data: {
              username: unameTrim,
              password: toStr(this.password),
              phone: toStr(this.phone).trim(),
              nickname: nickTrim.length > 0 ? nickTrim : unameTrim,
              email: toStr(this.email).trim(),
              emailCode: toStr(this.emailCode).trim()
            },
            header: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 1e4
          });
          uni.hideLoading();
          const status = res.statusCode;
          const result = res.data;
          if (status === 200 && result != null && result.success === true) {
            uni.showToast({ title: "注册成功！", icon: "success", duration: 2e3 });
            setTimeout(() => {
              uni.redirectTo({ url: "/pages/index/index?username=" + encodeURIComponent(unameTrim) });
            }, 2e3);
          } else {
            let regErr = "注册失败";
            if (result != null) {
              const m = result.message;
              if (m != null && toStr(m).length > 0) {
                regErr = toStr(m);
              }
            }
            uni.showToast({ title: regErr, icon: "none", duration: 3e3 });
          }
        } catch (e) {
          uni.hideLoading();
          const msg = errMsgFromCatch(e);
          if (msg.indexOf("timeout") >= 0)
            uni.showToast({ title: "请求超时，请检查网络", icon: "none", duration: 2500 });
          else
            uni.showToast({ title: "无法连接到服务器", icon: "none", duration: 2500 });
        } finally {
          this.loading = false;
        }
      },
      goToLogin() {
        uni.redirectTo({ url: "/pages/index/index" });
      },
      goToAbout() {
        uni.navigateTo({ url: "/pages/about/about" });
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "container",
        style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: "header",
            style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
          },
          [
            vue.createElementVNode(
              "text",
              {
                class: "title",
                style: vue.normalizeStyle("color:" + $data.theme.text + ";")
              },
              "物联网设备管理系统",
              4
              /* STYLE */
            )
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode(
          "view",
          {
            class: "register-form",
            style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
          },
          [
            vue.createElementVNode("view", { class: "form-title" }, [
              vue.createElementVNode("text", { class: "title-text" }, "用户注册")
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "用户名")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    type: "text",
                    placeholder: "请输入用户名",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.username = $event),
                    "placeholder-class": "placeholder",
                    maxlength: "20"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.username]
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "密码")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode("input", {
                  class: "input",
                  type: $data.showPassword ? "text" : "password",
                  placeholder: "请输入密码（6-15位字母数字）",
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.password = $event),
                  "placeholder-class": "placeholder",
                  maxlength: "15"
                }, null, 8, ["type"]), [
                  [vue.vModelDynamic, $data.password]
                ]),
                vue.createElementVNode("view", {
                  class: "password-toggle",
                  onClick: _cache[2] || (_cache[2] = (...args) => $options.togglePassword && $options.togglePassword(...args))
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "toggle-icon" },
                    vue.toDisplayString($data.showPassword ? "🙈" : "👁"),
                    1
                    /* TEXT */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "确认密码")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode("input", {
                  class: "input",
                  type: $data.showConfirmPassword ? "text" : "password",
                  placeholder: "请再次输入密码",
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.confirmPassword = $event),
                  "placeholder-class": "placeholder",
                  maxlength: "15"
                }, null, 8, ["type"]), [
                  [vue.vModelDynamic, $data.confirmPassword]
                ]),
                vue.createElementVNode("view", {
                  class: "password-toggle",
                  onClick: _cache[4] || (_cache[4] = (...args) => $options.toggleConfirmPassword && $options.toggleConfirmPassword(...args))
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "toggle-icon" },
                    vue.toDisplayString($data.showConfirmPassword ? "🙈" : "👁"),
                    1
                    /* TEXT */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "手机号")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    type: "number",
                    placeholder: "请输入手机号",
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.phone = $event),
                    "placeholder-class": "placeholder",
                    maxlength: "11"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.phone]
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "昵称")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    type: "text",
                    placeholder: "请输入昵称",
                    "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.nickname = $event),
                    "placeholder-class": "placeholder",
                    maxlength: "20"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.nickname]
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "邮箱")
              ]),
              vue.createElementVNode("view", { class: "input-container" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input",
                    type: "text",
                    placeholder: "请输入邮箱地址",
                    "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.email = $event),
                    "placeholder-class": "placeholder"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.email]
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "input-group" }, [
              vue.createElementVNode("view", { class: "input-label" }, [
                vue.createElementVNode("text", { class: "input-label-text" }, "邮箱验证码")
              ]),
              vue.createElementVNode("view", { class: "input-container code-container" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "input code-input",
                    type: "number",
                    placeholder: "请输入验证码",
                    "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $data.emailCode = $event),
                    "placeholder-class": "placeholder",
                    maxlength: "6"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $data.emailCode]
                ]),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["send-code-btn", { disabled: $data.codeCooldown > 0 }]),
                    style: vue.normalizeStyle($data.codeCooldown > 0 ? "background:#cccccc;" : "background:" + $data.theme.primary + ";"),
                    onClick: _cache[9] || (_cache[9] = (...args) => $options.sendEmailCode && $options.sendEmailCode(...args))
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      { class: "send-code-text" },
                      vue.toDisplayString($data.codeCooldown > 0 ? $data.codeCooldown + "s后重发" : "发送验证码"),
                      1
                      /* TEXT */
                    )
                  ],
                  6
                  /* CLASS, STYLE */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "form-options" }, [
              vue.createElementVNode("view", {
                class: "agreement",
                onClick: _cache[11] || (_cache[11] = (...args) => $options.toggleAgreement && $options.toggleAgreement(...args))
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["checkbox", { checked: $data.agreed }])
                  },
                  [
                    $data.agreed ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "checkmark"
                    }, "✓")) : vue.createCommentVNode("v-if", true)
                  ],
                  2
                  /* CLASS */
                ),
                vue.createElementVNode("text", { class: "option-text" }, "同意"),
                vue.createElementVNode("text", {
                  class: "link",
                  onClick: _cache[10] || (_cache[10] = vue.withModifiers((...args) => $options.showAgreementModal && $options.showAgreementModal(...args), ["stop"]))
                }, "用户协议")
              ])
            ]),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["register-button", { disabled: $data.loading }]),
                style: vue.normalizeStyle("background:linear-gradient(135deg," + $data.theme.primary + "," + $data.theme.primary2 + ");"),
                onClick: _cache[12] || (_cache[12] = (...args) => $options.handleRegister && $options.handleRegister(...args))
              },
              [
                vue.createElementVNode(
                  "text",
                  { class: "register-button-text" },
                  vue.toDisplayString($data.loading ? "注册中..." : "注册"),
                  1
                  /* TEXT */
                )
              ],
              6
              /* CLASS, STYLE */
            ),
            vue.createElementVNode("view", { class: "login-link" }, [
              vue.createElementVNode("text", { class: "login-text" }, "已有账号？"),
              vue.createElementVNode("text", {
                class: "link",
                onClick: _cache[13] || (_cache[13] = (...args) => $options.goToLogin && $options.goToLogin(...args))
              }, "立即登录")
            ])
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode("text", { class: "copyright" }, "©2025 南工物联2431 版权所有"),
          vue.createElementVNode("view", {
            class: "about-link",
            onClick: _cache[14] || (_cache[14] = (...args) => $options.goToAbout && $options.goToAbout(...args))
          }, [
            vue.createElementVNode("text", { class: "link" }, "关于我们")
          ])
        ])
      ],
      4
      /* STYLE */
    );
  }
  const PagesRegisterRegister = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-bac4a35d"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/register/register.vue"]]);
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function emptyRobotData() {
    return {
      latitude: "",
      longitude: "",
      altitude: null,
      speed: null,
      roll: null,
      pitch: null,
      yaw: null,
      lidarOnline: false,
      lidarMinDist: null,
      lidarPoints: null,
      cameraOnline: false,
      cameraResolution: "",
      cpuUsage: null,
      memUsage: null,
      uptime: "",
      temperature: null,
      humidity: null,
      smoke: null,
      gas: null,
      light: null,
      pressure: null
    };
  }
  function normalizeRobotData(raw) {
    const d = emptyRobotData();
    if (raw == null)
      return d;
    d.latitude = toStrField(raw, "latitude");
    d.longitude = toStrField(raw, "longitude");
    d.altitude = toNumOrNull(raw, "altitude");
    d.speed = toNumOrNull(raw, "speed");
    d.roll = toNumOrNull(raw, "roll");
    d.pitch = toNumOrNull(raw, "pitch");
    d.yaw = toNumOrNull(raw, "yaw");
    d.lidarOnline = toBool(raw, "lidarOnline");
    d.lidarMinDist = toNumOrNull(raw, "lidarMinDist");
    d.lidarPoints = toNumOrNull(raw, "lidarPoints");
    d.cameraOnline = toBool(raw, "cameraOnline");
    d.cameraResolution = toStrField(raw, "cameraResolution");
    d.cpuUsage = toNumOrNull(raw, "cpuUsage");
    d.memUsage = toNumOrNull(raw, "memUsage");
    d.uptime = toStrField(raw, "uptime");
    d.temperature = toNumOrNull(raw, "temperature");
    d.humidity = toNumOrNull(raw, "humidity");
    d.smoke = toNumOrNull(raw, "smoke");
    d.gas = toNumOrNull(raw, "gas");
    d.light = toNumOrNull(raw, "light");
    d.pressure = toNumOrNull(raw, "pressure");
    return d;
  }
  function toStrField(o, key) {
    const v = o[key];
    return v == null ? "" : "" + v;
  }
  function toNumOrNull(o, key) {
    const v = o[key];
    if (v == null)
      return null;
    const n = parseFloat("" + v);
    return isNaN(n) ? null : n;
  }
  function toBool(o, key) {
    const v = o[key];
    return v === true;
  }
  const POLL_INTERVAL = 3e3;
  const _sfc_main$4 = {
    data() {
      return {
        loading: false,
        connected: false,
        lastUpdate: "",
        pollTimer: null,
        robotData: emptyRobotData(),
        theme: getThemeVars()
      };
    },
    computed: {
      headerBarStyle() {
        const h = this.theme.headerBg;
        const useGrad = h.indexOf("linear") === 0;
        return useGrad ? "background:" + h + ";" : "background:" + this.theme.primary + ";";
      },
      latText() {
        const s = this.robotData.latitude;
        return s.length > 0 ? s : "--";
      },
      lonText() {
        const s = this.robotData.longitude;
        return s.length > 0 ? s : "--";
      },
      camResText() {
        const s = this.robotData.cameraResolution;
        return s.length > 0 ? s : "--";
      },
      cardStyle() {
        return "background:" + this.theme.card + ";border:1rpx solid " + this.theme.border + ";";
      },
      cardHdStyle() {
        return "background:" + this.theme.inputBg + ";border-bottom:1rpx solid " + this.theme.border + ";";
      },
      labelStyle() {
        return "color:" + this.theme.textSub + ";";
      },
      valueStyle() {
        return "color:" + this.theme.text + ";";
      }
    },
    onShow() {
      this.theme = getThemeVars();
      this.fetchData();
      this.startPolling();
    },
    onHide() {
      this.stopPolling();
    },
    onUnload() {
      this.stopPolling();
    },
    methods: {
      startPolling() {
        this.stopPolling();
        this.pollTimer = setInterval(() => {
          this.fetchData();
        }, POLL_INTERVAL);
      },
      stopPolling() {
        if (this.pollTimer != null) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
      },
      async fetchData() {
        if (this.loading)
          return;
        this.loading = true;
        uni.showLoading({ title: "获取数据中...", mask: true });
        try {
          const apiEndpoints = [
            BASE + "/robot/data",
            BASE + "/robot-data",
            BASE + "/api/robot/data",
            BASE + "/data/robot"
          ];
          let success = false;
          for (const endpoint of apiEndpoints) {
            try {
              const res = await uni.request({
                url: endpoint,
                method: "GET",
                timeout: 1e4
              });
              uni.hideLoading();
              const code = res.statusCode;
              const raw = res.data;
              formatAppLog("log", "at pages/device/device.vue:262", "从", endpoint, "获取数据:", code, raw);
              if (code === 200 && raw != null) {
                let data = null;
                if (raw.success === true) {
                  data = raw.data;
                } else {
                  data = raw;
                }
                if (data != null) {
                  if (Array.isArray(data) && data.length > 0) {
                    data = data[0];
                  }
                  if (data.lat)
                    data.latitude = data.lat;
                  if (data.lng)
                    data.longitude = data.lng;
                  if (data.lon)
                    data.longitude = data.lon;
                  if (data.latitude)
                    data.latitude = data.latitude.toString();
                  if (data.longitude)
                    data.longitude = data.longitude.toString();
                  if (data.battery)
                    data.battery = data.battery;
                  if (data.voltage)
                    data.voltage = data.voltage;
                  if (data.batt)
                    data.battery = data.batt;
                  if (data.volt)
                    data.voltage = data.volt;
                  this.robotData = normalizeRobotData(data);
                  this.connected = true;
                  const now = /* @__PURE__ */ new Date();
                  const mm = now.getMinutes();
                  const ss = now.getSeconds();
                  const mmStr = mm < 10 ? "0" + mm : "" + mm;
                  const ssStr = ss < 10 ? "0" + ss : "" + ss;
                  this.lastUpdate = now.getHours() + ":" + mmStr + ":" + ssStr;
                  success = true;
                  formatAppLog("log", "at pages/device/device.vue:301", "成功从", endpoint, "获取数据:", data);
                  formatAppLog("log", "at pages/device/device.vue:302", "处理后的数据:", this.robotData);
                  break;
                }
              } else {
                formatAppLog("warn", "at pages/device/device.vue:306", "从", endpoint, "获取数据失败:", code, raw);
              }
            } catch (e) {
              formatAppLog("warn", "at pages/device/device.vue:309", "从", endpoint, "获取数据失败:", e.message);
            }
          }
          if (!success) {
            uni.hideLoading();
            this.connected = false;
            formatAppLog("error", "at pages/device/device.vue:316", "所有API接口都获取数据失败");
            uni.showToast({ title: "无法获取设备数据", icon: "none", duration: 2500 });
          }
        } catch (e) {
          uni.hideLoading();
          formatAppLog("error", "at pages/device/device.vue:321", "获取数据失败:", e);
          this.connected = false;
          uni.showToast({ title: "网络错误", icon: "none", duration: 2500 });
        } finally {
          this.loading = false;
        }
      },
      formatAngle(val) {
        if (val == null)
          return "--";
        const n = parseFloat("" + val);
        if (isNaN(n))
          return "--";
        return n.toFixed(2) + "°";
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "page",
        style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
      },
      [
        vue.createElementVNode("view", { class: "safe-area-top" }),
        vue.createElementVNode(
          "view",
          {
            class: "header",
            style: vue.normalizeStyle($options.headerBarStyle)
          },
          [
            vue.createElementVNode("text", { class: "header-title" }, "设备监控"),
            vue.createElementVNode("view", {
              class: "refresh-btn",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.fetchData && $options.fetchData(...args))
            }, [
              vue.createElementVNode(
                "text",
                { class: "refresh-icon" },
                vue.toDisplayString($data.loading ? "⏳" : "🔄"),
                1
                /* TEXT */
              )
            ])
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["status-bar", $data.connected ? "connected" : "disconnected"])
          },
          [
            vue.createElementVNode("text", { class: "status-dot" }, "●"),
            vue.createElementVNode(
              "text",
              { class: "status-text" },
              vue.toDisplayString($data.connected ? "已连接" : "未连接"),
              1
              /* TEXT */
            ),
            $data.lastUpdate.length > 0 ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 0,
                class: "status-time"
              },
              "更新: " + vue.toDisplayString($data.lastUpdate),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true)
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode("scroll-view", {
          class: "scroll-area",
          "scroll-y": ""
        }, [
          vue.createElementVNode("view", { class: "card-grid" }, [
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "📍"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "纬度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($options.latText),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "📍"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "经度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($options.lonText),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "🏔️"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "海拔",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.altitude != null ? $data.robotData.altitude + " m" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "🚀"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "速度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.speed != null ? $data.robotData.speed + " km/h" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "🌡️"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "温度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.temperature != null ? $data.robotData.temperature + " °C" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "💧"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "湿度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.humidity != null ? $data.robotData.humidity + " %" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "🔥"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "烟雾值",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.smoke != null ? $data.robotData.smoke : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "💨"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "气体浓度",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.gas != null ? $data.robotData.gas : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "🔋"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "电量",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.battery != null ? $data.robotData.battery + " %" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card card-half" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-icon" }, "⚡"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "card-title",
                    style: vue.normalizeStyle($options.valueStyle)
                  },
                  "电压",
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "card-body" }, [
                vue.createElementVNode("view", { class: "data-row" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: "data-value large",
                      style: vue.normalizeStyle($options.valueStyle)
                    },
                    vue.toDisplayString($data.robotData.voltage != null ? $data.robotData.voltage + " V" : "--"),
                    5
                    /* TEXT, STYLE */
                  )
                ])
              ])
            ])
          ]),
          vue.createElementVNode("view", { style: { "height": "100rpx" } })
        ])
      ],
      4
      /* STYLE */
    );
  }
  const PagesDeviceDevice = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-165c9ab9"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/device/device.vue"]]);
  const AMAP_KEY = "50af93566ee2e3f73192d2735b9b1aab";
  const _sfc_main$3 = {
    data() {
      return {
        latitude: 32.1230155,
        longitude: 118.93069167,
        scale: 16,
        markers: [],
        searchKeyword: "",
        mapContext: null
      };
    },
    onShow() {
      this.initMap();
    },
    onHide() {
      this.mapContext = null;
    },
    methods: {
      initMap() {
        this.mapContext = uni.createMapContext("myMap", this);
        this.getCurrentLocation();
      },
      getCurrentLocation() {
        uni.getLocation({
          type: "gcj02",
          success: (res) => {
            this.latitude = res.latitude;
            this.longitude = res.longitude;
            if (this.mapContext)
              this.mapContext.moveToLocation();
          },
          fail: () => {
            uni.showToast({ title: "获取位置失败，请检查权限", icon: "none" });
          }
        });
      },
      locateMe() {
        this.getCurrentLocation();
      },
      zoomIn() {
        if (this.scale < 20)
          this.scale++;
      },
      zoomOut() {
        if (this.scale > 3)
          this.scale--;
      },
      onMarkerTap(e) {
        const marker = this.markers.find((m) => m.id === e.markerId);
        if (marker) {
          uni.showModal({
            title: marker.title || "位置",
            content: "纬度: " + marker.latitude.toFixed(6) + "\n经度: " + marker.longitude.toFixed(6),
            showCancel: false,
            confirmText: "知道了"
          });
        }
      },
      onRegionChange(e) {
        if (e.type === "end" && this.mapContext) {
          this.mapContext.getCenterLocation({
            success: (res) => {
              this.latitude = res.latitude;
              this.longitude = res.longitude;
            }
          });
        }
      },
      searchPlace() {
        const kw = (this.searchKeyword || "").trim();
        if (!kw) {
          uni.showToast({ title: "请输入搜索关键词", icon: "none" });
          return;
        }
        uni.showLoading({ title: "搜索中..." });
        uni.request({
          url: "https://restapi.amap.com/v3/place/text",
          method: "GET",
          data: { keywords: kw, key: AMAP_KEY, output: "json", offset: 5 },
          timeout: 8e3,
          success: (res) => {
            uni.hideLoading();
            if (res.data && res.data.status === "1" && res.data.pois && res.data.pois.length > 0) {
              const poi = res.data.pois[0];
              const parts = poi.location.split(",");
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              this.latitude = lat;
              this.longitude = lng;
              this.scale = 16;
              uni.showToast({ title: "已定位到: " + poi.name, icon: "none", duration: 2e3 });
            } else {
              uni.showToast({ title: "未找到相关地点", icon: "none" });
            }
          },
          fail: () => {
            uni.hideLoading();
            uni.showToast({ title: "搜索失败，请检查网络", icon: "none" });
          }
        });
      },
      // 地图加载完成回调
      onMapLoad() {
        formatAppLog("log", "at pages/navigation/navigation.vue:180", "地图加载完成");
        uni.showToast({ title: "地图加载完成", icon: "success" });
      },
      // 页面加载时执行
      onLoad() {
        formatAppLog("log", "at pages/navigation/navigation.vue:186", "导航页面加载");
        formatAppLog("log", "at pages/navigation/navigation.vue:187", "AMAP_KEY:", AMAP_KEY);
        formatAppLog("log", "at pages/navigation/navigation.vue:188", "默认位置:", this.latitude, this.longitude);
      },
      // 地图加载错误回调
      onMapError(e) {
        formatAppLog("error", "at pages/navigation/navigation.vue:193", "地图加载错误:", e);
        uni.showToast({ title: "地图加载失败", icon: "none" });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "safe-area-top" }),
      vue.createElementVNode("view", { class: "map-container" }, [
        vue.createElementVNode("map", {
          id: "myMap",
          class: "map",
          latitude: $data.latitude,
          longitude: $data.longitude,
          scale: $data.scale,
          markers: $data.markers,
          "show-location": "",
          "show-compass": "",
          "enable-zoom": "",
          "enable-scroll": "",
          onMarkertap: _cache[0] || (_cache[0] = (...args) => $options.onMarkerTap && $options.onMarkerTap(...args)),
          onRegionchange: _cache[1] || (_cache[1] = (...args) => $options.onRegionChange && $options.onRegionChange(...args)),
          onLoad: _cache[2] || (_cache[2] = (...args) => $options.onMapLoad && $options.onMapLoad(...args)),
          onError: _cache[3] || (_cache[3] = (...args) => $options.onMapError && $options.onMapError(...args))
        }, null, 40, ["latitude", "longitude", "scale", "markers"]),
        vue.createElementVNode("view", { class: "map-controls" }, [
          vue.createElementVNode("view", {
            class: "control-btn",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.locateMe && $options.locateMe(...args))
          }, [
            vue.createElementVNode("text", { class: "icon" }, "📍"),
            vue.createElementVNode("text", { class: "text" }, "定位")
          ]),
          vue.createElementVNode("view", {
            class: "control-btn",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.zoomIn && $options.zoomIn(...args))
          }, [
            vue.createElementVNode("text", { class: "icon" }, "➕"),
            vue.createElementVNode("text", { class: "text" }, "放大")
          ]),
          vue.createElementVNode("view", {
            class: "control-btn",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.zoomOut && $options.zoomOut(...args))
          }, [
            vue.createElementVNode("text", { class: "icon" }, "➖"),
            vue.createElementVNode("text", { class: "text" }, "缩小")
          ])
        ]),
        vue.createElementVNode("view", { class: "search-container" }, [
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "search-input",
              placeholder: "搜索地点或地址",
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.searchKeyword = $event),
              onConfirm: _cache[8] || (_cache[8] = (...args) => $options.searchPlace && $options.searchPlace(...args))
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $data.searchKeyword]
          ]),
          vue.createElementVNode("view", {
            class: "search-btn",
            onClick: _cache[9] || (_cache[9] = (...args) => $options.searchPlace && $options.searchPlace(...args))
          }, [
            vue.createElementVNode("text", { class: "search-icon" }, "🔍")
          ])
        ])
      ]),
      vue.createElementVNode("view", { class: "bottom-info" }, [
        vue.createElementVNode("view", { class: "info-content" }, [
          vue.createElementVNode(
            "text",
            { class: "coord" },
            "纬度: " + vue.toDisplayString($data.latitude.toFixed(6)),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "coord" },
            "经度: " + vue.toDisplayString($data.longitude.toFixed(6)),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "scale-text" },
            "缩放: " + vue.toDisplayString($data.scale),
            1
            /* TEXT */
          )
        ])
      ])
    ]);
  }
  const PagesNavigationNavigation = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-b0045dab"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/navigation/navigation.vue"]]);
  const _sfc_main$2 = {
    data() {
      return {
        username: "",
        userAvatar: "/static/logo.png",
        userId: "",
        isLoggedIn: false,
        theme: getThemeVars(),
        bannerImages: [
          "/static/hear1.jpg",
          "/static/hear2.jpg",
          "/static/hear3.jpg",
          "/static/hear4.jpg",
          "/static/hear5.jpg",
          "/static/hear6.jpg",
          "/static/hear7.jpg",
          "/static/hear8.jpg"
        ]
      };
    },
    computed: {
      profileHeaderStyle() {
        const h = this.theme.headerBg;
        const useGrad = h.indexOf("linear") === 0;
        return useGrad ? "background:" + h + ";" : "background:" + this.theme.primary + ";";
      },
      tipText() {
        if (this.isLoggedIn !== true) {
          return "当前未登录，请登录！";
        }
        return this.username.length > 0 ? this.username : "欢迎回来";
      }
    },
    onLoad() {
      this.loadUserInfo();
    },
    onShow() {
      this.theme = getThemeVars();
      this.loadUserInfo();
    },
    methods: {
      loadUserInfo() {
        try {
          const nameStr = storageString("currentUsername");
          const idStr = storageString("userId");
          if (nameStr.length > 0 && idStr.length > 0) {
            this.username = nameStr;
            this.userId = idStr;
            this.isLoggedIn = true;
            this.fetchAvatarFromServer();
          } else {
            this.resetToDefault();
          }
        } catch (e) {
          this.resetToDefault();
        }
      },
      async fetchAvatarFromServer() {
        const uid = toStr(this.userId);
        if (uid.length === 0)
          return;
        try {
          const res = await uni.request({ url: BASE + "/auth/user/" + uid, method: "GET", timeout: 5e3 });
          const code = res.statusCode;
          const body = res.data;
          if (code === 200 && body != null && body.success === true) {
            const inner = body.data;
            if (inner != null) {
              const av = inner.avatar;
              if (av != null && toStr(av).length > 0) {
                const url = toStr(av);
                this.userAvatar = url;
                uni.setStorageSync("userAvatar_" + uid, url);
              }
            }
          }
        } catch (e) {
          const cached = storageString("userAvatar_" + uid);
          if (cached.length > 0) {
            this.userAvatar = cached;
          }
        }
      },
      goToPage(page) {
        const isPublic = page === "about" || page === "theme";
        if (this.isLoggedIn !== true && isPublic !== true) {
          uni.showToast({ title: "请先登录", icon: "none" });
          setTimeout(() => {
            uni.navigateTo({ url: "/pages/index/index" });
          }, 1500);
          return;
        }
        if (page === "theme") {
          uni.navigateTo({ url: "/pages/theme/theme" });
          return;
        }
        if (page === "about") {
          uni.navigateTo({ url: "/pages/about/about" });
        }
      },
      contactService() {
        uni.showModal({ title: "联系客服", content: "邮箱：3397214850@qq.com\n电话：13865571613", showCancel: false, confirmText: "知道了" });
      },
      goToFeedback() {
        uni.showModal({ title: "匿名反馈", content: "请将您的反馈发送至：\n3397214850@qq.com\n我们会认真阅读每一条建议。", showCancel: false, confirmText: "知道了" });
      },
      goToLogin() {
        uni.navigateTo({ url: "/pages/index/index" });
      },
      logout() {
        uni.showModal({
          title: "提示",
          content: "确定要退出登录吗？",
          success: (res) => {
            if (res.confirm) {
              uni.removeStorageSync("currentUsername");
              uni.removeStorageSync("userId");
              uni.removeStorageSync("loginTime");
              this.resetToDefault();
              uni.showToast({ title: "已退出登录", icon: "success" });
              setTimeout(() => {
                uni.navigateTo({ url: "/pages/index/index" });
              }, 1500);
            }
          }
        });
      },
      resetToDefault() {
        this.username = "";
        this.userAvatar = "/static/logo.png";
        this.userId = "";
        this.isLoggedIn = false;
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "page",
        style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
      },
      [
        vue.createElementVNode("view", { class: "safe-area-top" }),
        vue.createElementVNode("view", { class: "top-bg" }, [
          vue.createElementVNode("swiper", {
            class: "swiper",
            autoplay: true,
            interval: 5e3,
            duration: 500,
            circular: true
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.bannerImages, (image, index) => {
                return vue.openBlock(), vue.createElementBlock("swiper-item", { key: index }, [
                  vue.createElementVNode("image", {
                    src: image,
                    class: "swiper-image",
                    mode: "aspectFill"
                  }, null, 8, ["src"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "bg-overlay" }),
          vue.createElementVNode("view", { class: "head-box" }, [
            vue.createElementVNode("view", { class: "avatar-section" }, [
              vue.createElementVNode("image", {
                class: "head-img",
                src: $data.userAvatar,
                mode: "aspectFill"
              }, null, 8, ["src"])
            ]),
            vue.createElementVNode("view", { class: "user-info" }, [
              vue.createElementVNode(
                "text",
                { class: "tip" },
                vue.toDisplayString($options.tipText),
                1
                /* TEXT */
              ),
              $data.userId.length > 0 ? (vue.openBlock(), vue.createElementBlock(
                "text",
                {
                  key: 0,
                  class: "user-id"
                },
                "ID: " + vue.toDisplayString($data.userId),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true)
            ])
          ])
        ]),
        vue.createElementVNode(
          "view",
          {
            class: "box",
            style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
          },
          [
            vue.createElementVNode("view", { class: "menu-section" }, [
              vue.createElementVNode("view", {
                class: "row",
                onClick: _cache[0] || (_cache[0] = ($event) => $options.goToPage("theme"))
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "row-content",
                    style: vue.normalizeStyle("border-bottom:1rpx solid " + $data.theme.border + ";")
                  },
                  [
                    vue.createElementVNode("text", { class: "icon" }, "🎨"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "text",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "更改主题",
                      4
                      /* STYLE */
                    ),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "arrow",
                        style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                      },
                      ">",
                      4
                      /* STYLE */
                    )
                  ],
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", {
                class: "row",
                onClick: _cache[1] || (_cache[1] = ($event) => $options.goToPage("about"))
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "row-content",
                    style: vue.normalizeStyle("border-bottom:1rpx solid " + $data.theme.border + ";")
                  },
                  [
                    vue.createElementVNode("text", { class: "icon" }, "ℹ️"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "text",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "关于我们",
                      4
                      /* STYLE */
                    ),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "arrow",
                        style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                      },
                      ">",
                      4
                      /* STYLE */
                    )
                  ],
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", { class: "share-wrapper" }, [
                vue.createElementVNode("button", {
                  "open-type": "share",
                  class: "share-btn"
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "row-content",
                      style: vue.normalizeStyle("border-bottom:1rpx solid " + $data.theme.border + ";")
                    },
                    [
                      vue.createElementVNode("text", { class: "icon" }, "🔗"),
                      vue.createElementVNode(
                        "text",
                        {
                          class: "text",
                          style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                        },
                        "分享好友",
                        4
                        /* STYLE */
                      ),
                      vue.createElementVNode(
                        "text",
                        {
                          class: "arrow",
                          style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                        },
                        ">",
                        4
                        /* STYLE */
                      )
                    ],
                    4
                    /* STYLE */
                  )
                ])
              ]),
              vue.createElementVNode("view", {
                class: "row",
                onClick: _cache[2] || (_cache[2] = (...args) => $options.contactService && $options.contactService(...args))
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "row-content",
                    style: vue.normalizeStyle("border-bottom:1rpx solid " + $data.theme.border + ";")
                  },
                  [
                    vue.createElementVNode("text", { class: "icon" }, "💬"),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "text",
                        style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                      },
                      "在线客服",
                      4
                      /* STYLE */
                    ),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "arrow",
                        style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                      },
                      ">",
                      4
                      /* STYLE */
                    )
                  ],
                  4
                  /* STYLE */
                )
              ]),
              vue.createElementVNode("view", {
                class: "row",
                onClick: _cache[3] || (_cache[3] = (...args) => $options.goToFeedback && $options.goToFeedback(...args))
              }, [
                vue.createElementVNode("view", { class: "row-content last-row" }, [
                  vue.createElementVNode("text", { class: "icon" }, "📝"),
                  vue.createElementVNode(
                    "text",
                    {
                      class: "text",
                      style: vue.normalizeStyle("color:" + $data.theme.text + ";")
                    },
                    "匿名反馈",
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode(
                    "text",
                    {
                      class: "arrow",
                      style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
                    },
                    ">",
                    4
                    /* STYLE */
                  )
                ])
              ])
            ])
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode(
          "view",
          {
            class: "end",
            style: vue.normalizeStyle("background:" + $data.theme.card + ";border:1rpx solid " + $data.theme.border + ";")
          },
          [
            $data.isLoggedIn ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "row action-btn",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.logout && $options.logout(...args))
            }, [
              vue.createElementVNode("view", { class: "row-content last-row" }, [
                vue.createElementVNode("text", { class: "icon" }, "🚪"),
                vue.createElementVNode(
                  "text",
                  {
                    class: "text",
                    style: vue.normalizeStyle("color:" + $data.theme.danger + ";")
                  },
                  "退出登录",
                  4
                  /* STYLE */
                )
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "row action-btn",
              onClick: _cache[5] || (_cache[5] = (...args) => $options.goToLogin && $options.goToLogin(...args))
            }, [
              vue.createElementVNode(
                "view",
                {
                  class: "login-btn-inner",
                  style: vue.normalizeStyle("background:linear-gradient(135deg," + $data.theme.primary + "," + $data.theme.primary2 + ");")
                },
                [
                  vue.createElementVNode("text", { class: "icon" }, "🔑"),
                  vue.createElementVNode("text", { class: "login-btn-text" }, "立即登录")
                ],
                4
                /* STYLE */
              )
            ]))
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode("view", { class: "footer" }, [
          vue.createElementVNode(
            "text",
            {
              style: vue.normalizeStyle("color:" + $data.theme.textSub + ";")
            },
            "©网络小程序个人中心 (Naval)",
            4
            /* STYLE */
          )
        ]),
        vue.createElementVNode("view", { class: "safe-area-bottom" })
      ],
      4
      /* STYLE */
    );
  }
  const PagesProfileProfile = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-dd383ca2"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/profile/profile.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        currentId: "classic",
        theme: getThemeVars(),
        themeList: getThemeList()
      };
    },
    computed: {
      bannerBgStyle() {
        const h = this.theme.headerBg;
        const useGrad = h.indexOf("linear") === 0;
        return useGrad ? "background:" + h + ";" : "background:" + this.theme.primary + ";";
      }
    },
    onLoad() {
      const raw = storageString("appTheme");
      this.currentId = raw.length > 0 ? raw : "classic";
      this.theme = getThemeVars();
    },
    onShow() {
      const raw = storageString("appTheme");
      this.currentId = raw.length > 0 ? raw : "classic";
      this.theme = getThemeVars();
    },
    methods: {
      phoneHeaderStyle(t) {
        const h = t.headerBg;
        const useGrad = h.indexOf("linear") === 0;
        return useGrad ? "background:" + h + ";" : "background:" + t.primary + ";";
      },
      cardBorderStyle(t) {
        const active = this.currentId === t.id;
        const borderCol = active ? t.primary : t.border;
        const shadow = active ? "box-shadow:0 4rpx 24rpx " + t.primary + "44;" : "box-shadow:0 4rpx 16rpx rgba(0,0,0,0.07);";
        return "background:" + t.card + ";border:3rpx solid " + borderCol + ";" + shadow;
      },
      goBack() {
        uni.navigateBack();
      },
      findThemeById(id) {
        const list = this.themeList;
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (item.id === id) {
            return item;
          }
        }
        return list[0];
      },
      previewThemeById(id) {
        const t = this.findThemeById(id);
        this.currentId = t.id;
        this.theme = t;
      },
      applyThemeById(id) {
        const t = this.findThemeById(id);
        this.currentId = t.id;
        this.theme = t;
        try {
          uni.setStorageSync("appTheme", t.id);
        } catch (e) {
        }
        uni.showToast({ title: "主题已应用", icon: "success", duration: 1500 });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "page",
        style: vue.normalizeStyle("background:" + $data.theme.bg + ";")
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: "nav-bar",
            style: vue.normalizeStyle("background:" + $data.theme.card + ";border-bottom:1rpx solid " + $data.theme.border + ";")
          },
          [
            vue.createElementVNode("view", {
              class: "nav-back",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
            }, [
              vue.createElementVNode(
                "text",
                {
                  class: "nav-back-icon",
                  style: vue.normalizeStyle("color:" + $data.theme.primary + ";")
                },
                "‹",
                4
                /* STYLE */
              )
            ]),
            vue.createElementVNode(
              "text",
              {
                class: "nav-title",
                style: vue.normalizeStyle("color:" + $data.theme.text + ";")
              },
              "主题设置",
              4
              /* STYLE */
            ),
            vue.createElementVNode("view", { class: "nav-placeholder" })
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode(
          "view",
          {
            class: "current-banner",
            style: vue.normalizeStyle($options.bannerBgStyle)
          },
          [
            vue.createElementVNode("view", { class: "banner-inner" }, [
              vue.createElementVNode("view", { class: "banner-icon-wrap" }, [
                vue.createElementVNode("text", { class: "banner-icon" }, "🎨")
              ]),
              vue.createElementVNode("view", { class: "banner-info" }, [
                vue.createElementVNode("text", { class: "banner-label" }, "当前主题"),
                vue.createElementVNode(
                  "text",
                  { class: "banner-name" },
                  vue.toDisplayString($data.theme.name),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "banner-check" }, [
                vue.createElementVNode("text", { class: "banner-check-icon" }, "✓")
              ])
            ])
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode("scroll-view", {
          "scroll-y": "",
          class: "theme-scroll"
        }, [
          vue.createElementVNode("view", { class: "theme-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.themeList, (t) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: t.id,
                  class: "theme-card",
                  style: vue.normalizeStyle($options.cardBorderStyle(t)),
                  onClick: ($event) => $options.previewThemeById(t.id)
                }, [
                  vue.createElementVNode("view", { class: "preview-wrap" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "phone-frame",
                        style: vue.normalizeStyle("border-color:" + t.border + ";")
                      },
                      [
                        vue.createElementVNode(
                          "view",
                          {
                            class: "phone-status",
                            style: vue.normalizeStyle("background:" + t.primary + ";")
                          },
                          null,
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode(
                          "view",
                          {
                            class: "phone-header",
                            style: vue.normalizeStyle($options.phoneHeaderStyle(t))
                          },
                          [
                            vue.createElementVNode(
                              "view",
                              {
                                class: "ph-avatar",
                                style: vue.normalizeStyle("background:rgba(255,255,255,0.35);")
                              },
                              null,
                              4
                              /* STYLE */
                            ),
                            vue.createElementVNode("view", { class: "ph-lines" }, [
                              vue.createElementVNode(
                                "view",
                                {
                                  class: "ph-line ph-line-w",
                                  style: vue.normalizeStyle("background:rgba(255,255,255,0.9);")
                                },
                                null,
                                4
                                /* STYLE */
                              ),
                              vue.createElementVNode(
                                "view",
                                {
                                  class: "ph-line ph-line-s",
                                  style: vue.normalizeStyle("background:rgba(255,255,255,0.55);")
                                },
                                null,
                                4
                                /* STYLE */
                              )
                            ])
                          ],
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode(
                          "view",
                          {
                            class: "phone-body",
                            style: vue.normalizeStyle("background:" + t.bg + ";")
                          },
                          [
                            vue.createElementVNode(
                              "view",
                              {
                                class: "pb-card",
                                style: vue.normalizeStyle("background:" + t.card + ";border-color:" + t.border + ";")
                              },
                              [
                                (vue.openBlock(), vue.createElementBlock(
                                  vue.Fragment,
                                  null,
                                  vue.renderList(3, (i) => {
                                    return vue.createElementVNode("view", {
                                      class: "pb-row",
                                      key: i
                                    }, [
                                      vue.createElementVNode(
                                        "view",
                                        {
                                          class: "pb-dot",
                                          style: vue.normalizeStyle("background:" + t.primary + ";")
                                        },
                                        null,
                                        4
                                        /* STYLE */
                                      ),
                                      vue.createElementVNode(
                                        "view",
                                        {
                                          class: "pb-bar",
                                          style: vue.normalizeStyle("background:" + t.border + ";")
                                        },
                                        null,
                                        4
                                        /* STYLE */
                                      ),
                                      vue.createElementVNode(
                                        "text",
                                        {
                                          class: "pb-arrow",
                                          style: vue.normalizeStyle("color:" + t.textSub + ";")
                                        },
                                        "›",
                                        4
                                        /* STYLE */
                                      )
                                    ]);
                                  }),
                                  64
                                  /* STABLE_FRAGMENT */
                                ))
                              ],
                              4
                              /* STYLE */
                            ),
                            vue.createElementVNode(
                              "view",
                              {
                                class: "pb-btn",
                                style: vue.normalizeStyle("background:" + t.primary + ";")
                              },
                              null,
                              4
                              /* STYLE */
                            )
                          ],
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode(
                          "view",
                          {
                            class: "phone-tab",
                            style: vue.normalizeStyle("background:" + t.card + ";border-color:" + t.border + ";")
                          },
                          [
                            (vue.openBlock(), vue.createElementBlock(
                              vue.Fragment,
                              null,
                              vue.renderList(3, (j) => {
                                return vue.createElementVNode("view", {
                                  class: "pt-item",
                                  key: j
                                }, [
                                  vue.createElementVNode(
                                    "view",
                                    {
                                      class: "pt-dot",
                                      style: vue.normalizeStyle("background:" + (j === 2 ? t.primary : t.border) + ";")
                                    },
                                    null,
                                    4
                                    /* STYLE */
                                  )
                                ]);
                              }),
                              64
                              /* STABLE_FRAGMENT */
                            ))
                          ],
                          4
                          /* STYLE */
                        )
                      ],
                      4
                      /* STYLE */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "theme-info" }, [
                    vue.createElementVNode("view", { class: "theme-name-row" }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: "theme-name",
                          style: vue.normalizeStyle("color:" + t.text + ";")
                        },
                        vue.toDisplayString(t.name),
                        5
                        /* TEXT, STYLE */
                      ),
                      $data.currentId === t.id ? (vue.openBlock(), vue.createElementBlock(
                        "view",
                        {
                          key: 0,
                          class: "active-badge",
                          style: vue.normalizeStyle("background:" + t.primary + ";")
                        },
                        [
                          vue.createElementVNode("text", { class: "active-badge-text" }, "使用中")
                        ],
                        4
                        /* STYLE */
                      )) : vue.createCommentVNode("v-if", true)
                    ]),
                    vue.createElementVNode(
                      "text",
                      {
                        class: "theme-desc",
                        style: vue.normalizeStyle("color:" + t.textSub + ";")
                      },
                      vue.toDisplayString(t.desc),
                      5
                      /* TEXT, STYLE */
                    ),
                    vue.createElementVNode("view", { class: "color-swatches" }, [
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList(t.swatches, (c, ci) => {
                          return vue.openBlock(), vue.createElementBlock(
                            "view",
                            {
                              class: "swatch",
                              key: ci,
                              style: vue.normalizeStyle("background:" + c + ";")
                            },
                            null,
                            4
                            /* STYLE */
                          );
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ]),
                    vue.createElementVNode("view", {
                      class: "apply-btn",
                      style: vue.normalizeStyle("background:" + t.primary + ";opacity:" + ($data.currentId === t.id ? "0.5" : "1") + ";"),
                      onClick: vue.withModifiers(($event) => $options.applyThemeById(t.id), ["stop"])
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "apply-btn-text" },
                        vue.toDisplayString($data.currentId === t.id ? "已应用" : "应用主题"),
                        1
                        /* TEXT */
                      )
                    ], 12, ["onClick"])
                  ])
                ], 12, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])
      ],
      4
      /* STYLE */
    );
  }
  const PagesThemeTheme = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-b6c9bfaa"], ["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/pages/theme/theme.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/about/about", PagesAboutAbout);
  __definePage("pages/register/register", PagesRegisterRegister);
  __definePage("pages/device/device", PagesDeviceDevice);
  __definePage("pages/navigation/navigation", PagesNavigationNavigation);
  __definePage("pages/profile/profile", PagesProfileProfile);
  __definePage("pages/theme/theme", PagesThemeTheme);
  const _sfc_main = {
    onLaunch() {
      formatAppLog("log", "at App.vue:6", "App Launch");
    },
    onShow() {
      formatAppLog("log", "at App.vue:9", "App Show");
    },
    onHide() {
      formatAppLog("log", "at App.vue:12", "App Hide");
    },
    onExit() {
      formatAppLog("log", "at App.vue:27", "App Exit");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "C:/Users/Administrator/Desktop/catkin_lwz/ROS/WeChat/robotapp/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
