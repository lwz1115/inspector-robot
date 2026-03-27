<template>
    <view class="container">
        <!-- 顶部安全区域 -->
        <view class="safe-area-top"></view>
        
        <!-- 主内容区 -->
        <view class="main-content">
            <!-- 顶部轮播图 -->
            <view class="swiper-container">
                <swiper class="swiper" indicator-dots="true" indicator-active-color="#ffffff"
                    autoplay="true" interval="3000" duration="500" circular="true">
                    <swiper-item>
                        <image class="swiper-image" src="/static/1.jpg" mode="aspectFill"></image>
                    </swiper-item>
                    <swiper-item>
                        <image class="swiper-image" src="/static/2.jpg" mode="aspectFill"></image>
                    </swiper-item>
                    <swiper-item>
                        <image class="swiper-image" src="/static/3.jpg" mode="aspectFill"></image>
                    </swiper-item>
                </swiper>
            </view>

            <!-- 标题区 -->
            <view class="page-title-box">
                <text class="page-title" :style="textStyle">巡检机器人管理系统</text>
            </view>

            <view class="login-form" :style="cardStyle">
                <view class="form-title">
                    <text class="title-text" :style="textStyle">用户登录</text>
                    <view class="title-line" :style="accentLineStyle"></view>
                </view>
                <view class="input-group">
                    <view class="input-icon-wrap" :style="inputWrapStyle">
                        <text class="input-icon">👤</text>
                        <input class="input" :style="inputTextStyle" type="text"
                            placeholder="请输入用户名" v-model="username" placeholder-class="placeholder"/>
                    </view>
                </view>
                <view class="input-group">
                    <view class="input-icon-wrap" :style="inputWrapStyle">
                        <text class="input-icon">🔒</text>
                        <input class="input" :style="inputTextStyle" type="password"
                            placeholder="请输入密码" v-model="password" placeholder-class="placeholder"/>
                    </view>
                </view>
                <view class="form-options">
                    <view class="remember-me" @click="toggleRemember">
                        <view class="checkbox" :style="rememberPassword ? checkedStyle : ''">
                            <text class="checkmark" v-if="rememberPassword">✓</text>
                        </view>
                        <text class="option-text" :style="subTextStyle">记住密码</text>
                    </view>
                    <view @click="forgotPassword">
                        <text class="option-text" :style="linkStyle">忘记密码？</text>
                    </view>
                </view>
                <view class="login-button" :class="{disabled: loading}" :style="btnStyle" @click="handleLogin">
                    <text class="login-button-text">{{ loading ? '登录中...' : '立即登录' }}</text>
                </view>
                <view class="register-link">
                    <text class="register-text" :style="subTextStyle">还没有账号？</text>
                    <text :style="linkStyle" @click="goToRegister">立即注册</text>
                </view>
            </view>

            <view class="footer">
                <text class="copyright">© 2025 李文卓 · 物联2431</text>
                <view class="about-link" @click="goToAbout">
                    <text :style="linkStyle">关于我们</text>
                </view>
            </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="safe-area-bottom"></view>
    </view>
</template>

<script>
import { BASE } from '@/config/server.js'
import { getThemeVars } from '@/config/theme.js'
import { errMsgFromCatch, storageString, toStr } from '@/utils/uts_helpers.js'

export default {
    data() {
        return {
            username: '',
            password: '',
            rememberPassword: false,
            loading: false,
            theme: getThemeVars()
        }
    },
    computed: {
        cardStyle()       { return 'background:' + this.theme.card + ';' },
        textStyle()       { return 'color:' + this.theme.text + ';' },
        subTextStyle()    { return 'color:' + this.theme.textSub + ';' },
        linkStyle()       { return 'color:' + this.theme.primary + ';font-size:26rpx;' },
        inputWrapStyle()  { return 'border:2rpx solid ' + this.theme.border + ';background:' + this.theme.inputBg + ';' },
        inputTextStyle()  { return 'color:' + this.theme.text + ';' },
        accentLineStyle() { return 'background:linear-gradient(90deg,' + this.theme.primary + ',' + this.theme.primary2 + ');' },
        btnStyle()        { return 'background:linear-gradient(135deg,' + this.theme.primary + ',' + this.theme.primary2 + ');' },
        checkedStyle()    { return 'background:' + this.theme.primary + ';border-color:' + this.theme.primary + ';' }
    },
    onShow() { this.theme = getThemeVars() },
    onLoad() {
        try {
            const saved = storageString('rememberedUser')
            if (saved.length > 0) {
              this.username = saved
              this.rememberPassword = true
            }
        } catch (e) {}
        this.checkAutoLogin()
    },
    methods: {
        checkAutoLogin() {
            try {
                const userIdStr = storageString('userId')
                const loginTimeStr = storageString('loginTime')
                if (userIdStr.length === 0 || loginTimeStr.length === 0) {
                  return
                }
                const loginTime = parseFloat(loginTimeStr)
                if (isNaN(loginTime)) {
                  return
                }
                if ((Date.now() - loginTime) < 24 * 3600 * 1000) {
                    uni.switchTab({ url: '/pages/device/device' })
                }
            } catch (e) {}
        },
        toggleRemember() { this.rememberPassword = !this.rememberPassword },
        forgotPassword() {
            uni.showModal({ title: '忘记密码', content: '请通过 Web 端使用邮箱验证码找回密码', showCancel: false, confirmText: '知道了' })
        },
        async handleLogin() {
            const username = toStr(this.username).trim()
            const password = toStr(this.password)
            if (username.length === 0) { uni.showToast({ title: '请输入用户名', icon: 'none' }); return }
            if (password.length === 0) { uni.showToast({ title: '请输入密码',   icon: 'none' }); return }
            if (this.loading) return
            this.loading = true
            uni.showLoading({ title: '登录中...', mask: true })
            try {
                const res = await uni.request({
                    url: BASE + '/auth/login', method: 'POST',
                    data: 'username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
                    header: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000
                })
                uni.hideLoading()
                const status = res.statusCode
                const result = res.data
                if (status === 200 && result != null && result.success === true) {
                    if (this.rememberPassword) uni.setStorageSync('rememberedUser', username)
                    else { try { uni.removeStorageSync('rememberedUser') } catch (e) {} }
                    const savedUserId = (result.userId != null) ? toStr(result.userId) : ''
                    const unameRaw = result.username
                    const savedUsername = (unameRaw != null && toStr(unameRaw).length > 0)
                        ? toStr(unameRaw)
                        : username
                    uni.setStorageSync('userId', savedUserId)
                    uni.setStorageSync('currentUsername', savedUsername)
                    uni.setStorageSync('loginTime', Date.now())
                    uni.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
                    setTimeout(() => { uni.switchTab({ url: '/pages/device/device' }) }, 1500)
                } else {
                    let errTitle = '用户名或密码错误'
                    if (result != null) {
                      const m = result.message
                      if (m != null && toStr(m).length > 0) {
                        errTitle = toStr(m)
                      }
                    }
                    uni.showToast({ title: errTitle, icon: 'none', duration: 2500 })
                }
            } catch (e) {
                uni.hideLoading()
                const msg = errMsgFromCatch(e)
                if (msg.indexOf('timeout') >= 0) uni.showToast({ title: '请求超时，请检查网络', icon: 'none', duration: 2500 })
                else uni.showToast({ title: '无法连接到服务器', icon: 'none', duration: 2500 })
            } finally { this.loading = false }
        },
        goToAbout()    { uni.navigateTo({ url: '/pages/about/about' }) },
        goToRegister() { uni.navigateTo({ url: '/pages/register/register' }) }
    }
}
</script>

<style scoped>
.container { flex: 1; background: #ffffff; display: flex; flex-direction: column; position: relative; }

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 20rpx;
}

/* 安全区域适配 */
.safe-area-top {
  height: env(safe-area-inset-top);
  width: 100%;
  background: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}

.safe-area-bottom {
  height: env(safe-area-inset-bottom);
  width: 100%;
  background: #ffffff;
  position: relative;
  z-index: 10;
}

/* 轮播图 */
.swiper-container {
    margin: 100rpx 24rpx 0;
    height: 320rpx;
    border-radius: 24rpx;
    overflow: hidden;
    position: relative;
    box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.14);
}
.swiper { width: 100%; height: 100%; }
.swiper-image { width: 100%; height: 100%; }

/* 标题区 */
.page-title-box {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 36rpx 0 40rpx;
}
.page-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    letter-spacing: 2rpx;
    text-align: center;
}

.login-form {
    margin: 0 36rpx 40rpx;
    border-radius: 24rpx;
    padding: 48rpx 40rpx 40rpx;
    box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.10);
    position: relative; z-index: 10;
}
.form-title { margin-bottom: 44rpx; align-items: center; }
.title-text { font-size: 32rpx; font-weight: bold; }
.title-line { width: 48rpx; height: 6rpx; border-radius: 3rpx; margin-top: 10rpx; }

.input-group { margin-bottom: 32rpx; }
.input-icon-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 14rpx;
    padding: 22rpx 24rpx;
}
.input-icon { font-size: 30rpx; margin-right: 18rpx; width: 36rpx; text-align: center; }
.input { flex: 1; font-size: 28rpx; }
.placeholder { color: #b0b8c4; font-size: 28rpx; }

.form-options {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 44rpx;
}
.remember-me {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #ccc;
    border-radius: 6rpx;
    margin-right: 14rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}
.checkmark { color: #fff; font-size: 22rpx; font-weight: bold; }
.option-text { font-size: 26rpx; }

.login-button {
    border-radius: 14rpx;
    padding: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28rpx;
    box-shadow: 0 6rpx 20rpx rgba(21,101,192,0.3);
}
.login-button:active { opacity: 0.88; }
.login-button.disabled { opacity: 0.6; }
.login-button-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
    letter-spacing: 2rpx;
    text-align: center;
}

.register-link {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin-bottom: 30rpx;
}
.register-text { font-size: 26rpx; margin-right: 8rpx; }

.footer {
    margin-top: 100rpx;
    padding: 0 0 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.copyright { font-size: 22rpx; color: #aaa; margin-bottom: 14rpx; }
.about-link {
    padding: 8rpx 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
