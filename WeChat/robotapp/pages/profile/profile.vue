<template>
  <view class="page" :style="'background:' + theme.bg + ';'">
    <!-- 顶部安全区域 -->
    <view class="safe-area-top"></view>
    
    <!-- 顶部轮播背景 -->
    <view class="top-bg">
      <!-- 轮播图 -->
      <swiper class="swiper" :autoplay="true" :interval="5000" :duration="500" :circular="true">
        <swiper-item v-for="(image, index) in bannerImages" :key="index">
          <image :src="image" class="swiper-image" mode="aspectFill"></image>
        </swiper-item>
      </swiper>
      <!-- 覆盖层 -->
      <view class="bg-overlay"></view>
      <!-- 用户信息 -->
      <view class="head-box">
        <view class="avatar-section">
          <image class="head-img" :src="userAvatar" mode="aspectFill"></image>
        </view>
        <view class="user-info">
          <text class="tip">{{ tipText }}</text>
          <text class="user-id" v-if="userId.length > 0">ID: {{userId}}</text>
        </view>
      </view>
    </view>

    <!-- 菜单卡片 -->
    <view class="box" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
      <view class="menu-section">
        <view class="row" @click="goToPage('theme')">
          <view class="row-content" :style="'border-bottom:1rpx solid ' + theme.border + ';'">
            <text class="icon">🎨</text>
            <text class="text" :style="'color:' + theme.text + ';'">更改主题</text>
            <text class="arrow" :style="'color:' + theme.textSub + ';'">></text>
          </view>
        </view>

        <view class="row" @click="goToPage('about')">
          <view class="row-content" :style="'border-bottom:1rpx solid ' + theme.border + ';'">
            <text class="icon">ℹ️</text>
            <text class="text" :style="'color:' + theme.text + ';'">关于我们</text>
            <text class="arrow" :style="'color:' + theme.textSub + ';'">></text>
          </view>
        </view>

        <view class="share-wrapper">
          <button open-type="share" class="share-btn">
            <view class="row-content" :style="'border-bottom:1rpx solid ' + theme.border + ';'">
              <text class="icon">🔗</text>
              <text class="text" :style="'color:' + theme.text + ';'">分享好友</text>
              <text class="arrow" :style="'color:' + theme.textSub + ';'">></text>
            </view>
          </button>
        </view>

        <view class="row" @click="contactService">
          <view class="row-content" :style="'border-bottom:1rpx solid ' + theme.border + ';'">
            <text class="icon">💬</text>
            <text class="text" :style="'color:' + theme.text + ';'">在线客服</text>
            <text class="arrow" :style="'color:' + theme.textSub + ';'">></text>
          </view>
        </view>

        <view class="row" @click="goToFeedback">
          <view class="row-content last-row">
            <text class="icon">📝</text>
            <text class="text" :style="'color:' + theme.text + ';'">匿名反馈</text>
            <text class="arrow" :style="'color:' + theme.textSub + ';'">></text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="end" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
      <view class="row action-btn" v-if="isLoggedIn" @click="logout">
        <view class="row-content last-row">
          <text class="icon">🚪</text>
          <text class="text" :style="'color:' + theme.danger + ';'">退出登录</text>
        </view>
      </view>
      <view class="row action-btn" v-else @click="goToLogin">
        <view class="login-btn-inner" :style="'background:linear-gradient(135deg,' + theme.primary + ',' + theme.primary2 + ');'">
          <text class="icon">🔑</text>
          <text class="login-btn-text">立即登录</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text :style="'color:' + theme.textSub + ';'">©网络小程序个人中心 (Naval)</text>
    </view>
    
    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script>
import { BASE } from '@/config/server.js'
import { getThemeVars } from '@/config/theme.js'
import { storageString, toStr } from '@/utils/uts_helpers.js'

export default {
  data() {
    return {
      username: '',
      userAvatar: '/static/logo.png',
      userId: '',
      isLoggedIn: false,
      theme: getThemeVars(),
      bannerImages: [
        '/static/hear1.jpg',
        '/static/hear2.jpg',
        '/static/hear3.jpg',
        '/static/hear4.jpg',
        '/static/hear5.jpg',
        '/static/hear6.jpg',
        '/static/hear7.jpg',
        '/static/hear8.jpg'
      ]
    }
  },

  computed: {
    profileHeaderStyle() {
      const h = this.theme.headerBg
      const useGrad = h.indexOf('linear') === 0
      return useGrad ? ('background:' + h + ';') : ('background:' + this.theme.primary + ';')
    },
    tipText() {
      if (this.isLoggedIn !== true) {
        return '当前未登录，请登录！'
      }
      return this.username.length > 0 ? this.username : '欢迎回来'
    }
  },

  onLoad() { this.loadUserInfo() },
  onShow()  { this.theme = getThemeVars(); this.loadUserInfo() },

  methods: {
    loadUserInfo() {
      try {
        const nameStr = storageString('currentUsername')
        const idStr = storageString('userId')
        if (nameStr.length > 0 && idStr.length > 0) {
          this.username = nameStr
          this.userId = idStr
          this.isLoggedIn = true
          this.fetchAvatarFromServer()
        } else {
          this.resetToDefault()
        }
      } catch (e) { this.resetToDefault() }
    },

    async fetchAvatarFromServer() {
      const uid = toStr(this.userId)
      if (uid.length === 0) return
      try {
        const res = await uni.request({ url: BASE + '/auth/user/' + uid, method: 'GET', timeout: 5000 })
        const code = res.statusCode
        const body = res.data
        if (code === 200 && body != null && body.success === true) {
          const inner = body.data
          if (inner != null) {
            const av = inner.avatar
            if (av != null && toStr(av).length > 0) {
              const url = toStr(av)
              this.userAvatar = url
              uni.setStorageSync('userAvatar_' + uid, url)
            }
          }
        }
      } catch (e) {
        const cached = storageString('userAvatar_' + uid)
        if (cached.length > 0) {
          this.userAvatar = cached
        }
      }
    },

    goToPage(page) {
      const isPublic = page === 'about' || page === 'theme'
      if (this.isLoggedIn !== true && isPublic !== true) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        setTimeout(() => { uni.navigateTo({ url: '/pages/index/index' }) }, 1500)
        return
      }
      if (page === 'theme') {
        uni.navigateTo({ url: '/pages/theme/theme' })
        return
      }
      if (page === 'about') {
        uni.navigateTo({ url: '/pages/about/about' })
      }
    },

    contactService() {
      uni.showModal({ title: '联系客服', content: '邮箱：3397214850@qq.com\n电话：13865571613', showCancel: false, confirmText: '知道了' })
    },

    goToFeedback() {
      uni.showModal({ title: '匿名反馈', content: '请将您的反馈发送至：\n3397214850@qq.com\n我们会认真阅读每一条建议。', showCancel: false, confirmText: '知道了' })
    },

    goToLogin() { uni.navigateTo({ url: '/pages/index/index' }) },

    logout() {
      uni.showModal({
        title: '提示', content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('currentUsername')
            uni.removeStorageSync('userId')
            uni.removeStorageSync('loginTime')
            this.resetToDefault()
            uni.showToast({ title: '已退出登录', icon: 'success' })
            setTimeout(() => { uni.navigateTo({ url: '/pages/index/index' }) }, 1500)
          }
        }
      })
    },

    resetToDefault() {
      this.username   = ''
      this.userAvatar = '/static/logo.png'
      this.userId     = ''
      this.isLoggedIn = false
    }
  }
}
</script>

<style scoped>
.page {
  position: relative;
}

/* 安全区域适配 */
.safe-area-top {
  height: env(safe-area-inset-top);
  width: 100%;
  background: transparent;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  width: 100%;
  background: #f5f5f5;
}

.top-bg {
  height: 450rpx;
  position: relative;
  overflow: hidden;
}

/* 轮播图 */
.swiper {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.swiper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 卡片悬停效果 */
.box {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.box:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.end {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.end:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

/* 覆盖层 */
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4));
  z-index: 5;
}

/* 用户信息 */
.head-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  padding-top: 80rpx;
  padding-bottom: 30rpx;
}

.avatar-section {
  position: relative;
  margin-bottom: 20rpx;
}

.head-img {
  width: 140rpx;
  height: 140rpx;
  overflow: hidden;
  border-radius: 70rpx;
  border: 6rpx solid white;
  box-shadow: 0 6rpx 18rpx rgba(0,0,0,0.15);
  background-color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tip {
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  text-shadow: 0 1rpx 3rpx rgba(0,0,0,0.2);
  padding: 0 30rpx;
}

.user-id {
  font-size: 22rpx;
  color: rgba(255,255,255,0.9);
  background: rgba(0,0,0,0.15);
  padding: 6rpx 16rpx;
  border-radius: 10rpx;
  text-align: center;
}

.box {
  margin: 90rpx 20rpx 0; border-radius: 20rpx;
  padding: 20rpx 0; position: relative; z-index: 5;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}
.menu-section { padding: 0; }
.row { padding: 0; margin: 0; }
.row-content {
  display: flex; flex-direction: row; align-items: center;
  justify-content: space-between; padding: 28rpx 20rpx;
  font-size: 28rpx; min-height: 70rpx;
}
.last-row { border-bottom: none !important; }

.share-wrapper { margin: 0; padding: 0; }
.share-btn {
  background: transparent !important; border: none !important;
  padding: 0 !important; margin: 0 !important;
  line-height: 70rpx !important; display: flex !important; width: 100% !important;
  height: 70rpx !important;
  align-items: center !important;
  justify-content: flex-start !important;
}
.share-btn::after { border: none !important; }
.share-btn .row-content {
  width: 100% !important;
  height: 70rpx !important;
  align-items: center !important;
}

.icon { font-size: 36rpx; margin-right: 15rpx; width: 40rpx; text-align: center; }
.text { font-size: 28rpx; flex: 1; text-align: left; }
.arrow { font-size: 28rpx; font-weight: bold; margin-left: auto; }

.end {
  margin: 30rpx 20rpx 0; border-radius: 20rpx;
  padding: 0 20rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}
.action-btn { width: 100%; border: none; padding: 0; margin: 0; }
.login-btn-inner {
  flex-direction: row; align-items: center; justify-content: center;
  border-radius: 12rpx; margin: 20rpx 0; padding: 25rpx 15rpx;
}
.login-btn-text { font-size: 30rpx; font-weight: bold; color: white; }

.footer {
  display: flex; justify-content: center; align-items: center;
  padding: 30rpx 0; font-size: 22rpx; margin: 25rpx 0 0;
}
</style>
