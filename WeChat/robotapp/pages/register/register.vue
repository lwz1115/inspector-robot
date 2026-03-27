<template>
    <view class="container" :style="'background:' + theme.bg + ';'">
        <view class="header" :style="'background:' + theme.bg + ';'">
            <text class="title" :style="'color:' + theme.text + ';'">物联网设备管理系统</text>
        </view>
        <view class="register-form" :style="'background:' + theme.card + ';border:1rpx solid ' + theme.border + ';'">
            <view class="form-title">
                <text class="title-text">用户注册</text>
            </view>
            
            <!-- 用户名输入 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">用户名</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        type="text" 
                        placeholder="请输入用户名"
                        v-model="username"
                        placeholder-class="placeholder"
                        maxlength="20"
                    />
                </view>
            </view>

            <!-- 密码输入 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">密码</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        :type="showPassword ? 'text' : 'password'" 
                        placeholder="请输入密码（6-15位字母数字）"
                        v-model="password"
                        placeholder-class="placeholder"
                        maxlength="15"
                    />
                    <view class="password-toggle" @click="togglePassword">
                        <text class="toggle-icon">{{ showPassword ? '🙈' : '👁' }}</text>
                    </view>
                </view>
            </view>

            <!-- 确认密码 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">确认密码</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        :type="showConfirmPassword ? 'text' : 'password'" 
                        placeholder="请再次输入密码"
                        v-model="confirmPassword"
                        placeholder-class="placeholder"
                        maxlength="15"
                    />
                    <view class="password-toggle" @click="toggleConfirmPassword">
                        <text class="toggle-icon">{{ showConfirmPassword ? '🙈' : '👁' }}</text>
                    </view>
                </view>
            </view>

            <!-- 手机号输入 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">手机号</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        type="number" 
                        placeholder="请输入手机号"
                        v-model="phone"
                        placeholder-class="placeholder"
                        maxlength="11"
                    />
                </view>
            </view>

            <!-- 昵称输入 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">昵称</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        type="text" 
                        placeholder="请输入昵称"
                        v-model="nickname"
                        placeholder-class="placeholder"
                        maxlength="20"
                    />
                </view>
            </view>

            <!-- 邮箱输入 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">邮箱</text>
                </view>
                <view class="input-container">
                    <input 
                        class="input" 
                        type="text" 
                        placeholder="请输入邮箱地址"
                        v-model="email"
                        placeholder-class="placeholder"
                    />
                </view>
            </view>

            <!-- 邮箱验证码 -->
            <view class="input-group">
                <view class="input-label">
                    <text class="input-label-text">邮箱验证码</text>
                </view>
                <view class="input-container code-container">
                    <input 
                        class="input code-input" 
                        type="number" 
                        placeholder="请输入验证码"
                        v-model="emailCode"
                        placeholder-class="placeholder"
                        maxlength="6"
                    />
                    <view class="send-code-btn"
                        :class="{disabled: codeCooldown > 0}"
                        :style="codeCooldown > 0 ? 'background:#cccccc;' : 'background:' + theme.primary + ';'"
                        @click="sendEmailCode">
                        <text class="send-code-text">{{ codeCooldown > 0 ? codeCooldown + 's后重发' : '发送验证码' }}</text>
                    </view>
                </view>
            </view>

            <!-- 用户协议 -->
            <view class="form-options">
                <view class="agreement" @click="toggleAgreement">
                    <view class="checkbox" :class="{checked: agreed}">
                        <text class="checkmark" v-if="agreed">✓</text>
                    </view>
                    <text class="option-text">同意</text>
                    <text class="link" @click.stop="showAgreementModal">用户协议</text>
                </view>
            </view>

            <view class="register-button" :class="{disabled: loading}"
                :style="'background:linear-gradient(135deg,' + theme.primary + ',' + theme.primary2 + ');'"
                @click="handleRegister">
                <text class="register-button-text">{{ loading ? '注册中...' : '注册' }}</text>
            </view>

            <!-- 登录链接 -->
            <view class="login-link">
                <text class="login-text">已有账号？</text>
                <text class="link" @click="goToLogin">立即登录</text>
            </view>
        </view>

        <!-- 底部版权信息 -->
        <view class="footer">
            <text class="copyright">©2025 南工物联2431 版权所有</text>
            <view class="about-link" @click="goToAbout">
                <text class="link">关于我们</text>
            </view>
        </view>
    </view>
</template>

<script>
import { BASE } from '@/config/server.js'
import { getThemeVars } from '@/config/theme.js'
import { errMsgFromCatch, toStr } from '@/utils/uts_helpers.js'

export default {
    data() {
        return {
            username: '',
            password: '',
            confirmPassword: '',
            phone: '',
            nickname: '',
            email: '',
            emailCode: '',
            agreed: false,
            showPassword: false,
            showConfirmPassword: false,
            loading: false,
            codeCooldown: 0,
            codeTimer: null,
            theme: getThemeVars()
        }
    },
    onShow() { this.theme = getThemeVars() },

    onUnload() {
        if (this.codeTimer != null) clearInterval(this.codeTimer)
    },

    methods: {
        togglePassword() { this.showPassword = !this.showPassword },
        toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword },
        toggleAgreement() { this.agreed = !this.agreed },

        showAgreementModal() {
            uni.showModal({
                title: '用户协议',
                content: '本系统仅供授权用户使用，请遵守相关法律法规，合理使用系统功能。',
                showCancel: false,
                confirmText: '知道了'
            })
        },

        validateForm() {
            const username = toStr(this.username).trim()
            const password = toStr(this.password)
            const phone = toStr(this.phone).trim()
            const email = toStr(this.email).trim()
            const code = toStr(this.emailCode).trim()

            if (username.length === 0) { uni.showToast({ title: '请输入用户名', icon: 'none' }); return false }
            if (username.length < 2) { uni.showToast({ title: '用户名至少2位', icon: 'none' }); return false }
            if (password.length === 0) { uni.showToast({ title: '请输入密码', icon: 'none' }); return false }
            if (password.length < 6) { uni.showToast({ title: '密码至少6位', icon: 'none' }); return false }
            if (password !== toStr(this.confirmPassword)) { uni.showToast({ title: '两次密码不一致', icon: 'none' }); return false }
            if (phone.length === 0 || !/^1[3-9]\d{9}$/.test(phone)) { uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return false }
            if (email.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { uni.showToast({ title: '请输入正确的邮箱', icon: 'none' }); return false }
            if (code.length === 0) { uni.showToast({ title: '请输入邮箱验证码', icon: 'none' }); return false }
            if (this.agreed !== true) { uni.showToast({ title: '请同意用户协议', icon: 'none' }); return false }
            return true
        },

        async sendEmailCode() {
            if (this.codeCooldown > 0) return
            const email = toStr(this.email).trim()
            if (email.length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                uni.showToast({ title: '请先输入正确的邮箱', icon: 'none' })
                return
            }

            uni.showLoading({ title: '发送中...', mask: true })
            try {
                const res = await uni.request({
                    url: BASE + '/auth/email/send',
                    method: 'POST',
                    data: 'email=' + encodeURIComponent(email),
                    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 10000
                })
                uni.hideLoading()
                const status = res.statusCode
                const result = res.data
                if (status === 200 && result != null && result.success === true) {
                    uni.showToast({ title: '验证码已发送', icon: 'success' })
                    this.startCooldown()
                } else {
                    let sendErr = '发送失败'
                    if (result != null) {
                      const m = result.message
                      if (m != null && toStr(m).length > 0) {
                        sendErr = toStr(m)
                      }
                    }
                    uni.showToast({ title: sendErr, icon: 'none', duration: 2500 })
                }
            } catch (e) {
                uni.hideLoading()
                const msg = errMsgFromCatch(e)
                if (msg.indexOf('timeout') >= 0) uni.showToast({ title: '请求超时', icon: 'none' })
                else uni.showToast({ title: '无法连接到服务器', icon: 'none' })
            }
        },

        startCooldown() {
            this.codeCooldown = 60
            this.codeTimer = setInterval(() => {
                this.codeCooldown--
                if (this.codeCooldown <= 0) {
                    clearInterval(this.codeTimer)
                    this.codeTimer = null
                    this.codeCooldown = 0
                }
            }, 1000)
        },

        async handleRegister() {
            if (this.validateForm() !== true) return
            if (this.loading) return

            this.loading = true
            uni.showLoading({ title: '注册中...', mask: true })

            try {
                const nickTrim = toStr(this.nickname).trim()
                const unameTrim = toStr(this.username).trim()
                const res = await uni.request({
                    url: BASE + '/auth/register',
                    method: 'POST',
                    data: {
                        username: unameTrim,
                        password: toStr(this.password),
                        phone: toStr(this.phone).trim(),
                        nickname: nickTrim.length > 0 ? nickTrim : unameTrim,
                        email: toStr(this.email).trim(),
                        emailCode: toStr(this.emailCode).trim()
                    },
                    header: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 10000
                })
                uni.hideLoading()
                const status = res.statusCode
                const result = res.data
                if (status === 200 && result != null && result.success === true) {
                    uni.showToast({ title: '注册成功！', icon: 'success', duration: 2000 })
                    setTimeout(() => {
                        uni.redirectTo({ url: '/pages/index/index?username=' + encodeURIComponent(unameTrim) })
                    }, 2000)
                } else {
                    let regErr = '注册失败'
                    if (result != null) {
                      const m = result.message
                      if (m != null && toStr(m).length > 0) {
                        regErr = toStr(m)
                      }
                    }
                    uni.showToast({ title: regErr, icon: 'none', duration: 3000 })
                }
            } catch (e) {
                uni.hideLoading()
                const msg = errMsgFromCatch(e)
                if (msg.indexOf('timeout') >= 0) uni.showToast({ title: '请求超时，请检查网络', icon: 'none', duration: 2500 })
                else uni.showToast({ title: '无法连接到服务器', icon: 'none', duration: 2500 })
            } finally {
                this.loading = false
            }
        },

        goToLogin() { uni.redirectTo({ url: '/pages/index/index' }) },
        goToAbout() { uni.navigateTo({ url: '/pages/about/about' }) }
    }
}
</script>

<style scoped>
.container {
    flex: 1;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
}

/* 系统标题 */
.header {
    padding: 40rpx 0 40rpx 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
}

.title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333333;
    text-align: center;
}

/* 注册表单 */
.register-form {
    margin: 0 40rpx 40rpx;
    background: #ffffff;
    border-radius: 20rpx;
    padding: 36rpx 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.form-title {
    margin-bottom: 30rpx;
    align-items: center;
}

.title-text {
    font-size: 30rpx;
    font-weight: bold;
    color: #333333;
}

/* 输入框组 */
.input-group {
    margin-bottom: 24rpx;
}

.input-label {
    margin-bottom: 12rpx;
}

.input-label-text {
    font-size: 26rpx;
    color: #333333;
    font-weight: 400;
}

.input-container {
    border: 2rpx solid #e0e0e0;
    border-radius: 12rpx;
    padding: 18rpx 24rpx;
    background: #f8f9fa;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.input {
    font-size: 26rpx;
    color: #333333;
    flex: 1;
}

.placeholder {
    color: #999999;
    font-size: 26rpx;
}

/* 密码显示切换 */
.password-toggle {
    padding: 10rpx;
    margin-left: 20rpx;
}

.toggle-icon {
    font-size: 32rpx;
}

/* 验证码行 */
.code-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0 0 0 24rpx;
}

.code-input {
    flex: 1;
    padding: 24rpx 0;
}

.send-code-btn {
    background: #1890ff;
    border-radius: 10rpx;
    padding: 20rpx 24rpx;
    margin-left: 16rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}

.send-code-btn.disabled {
    background: #cccccc;
}

.send-code-text {
    font-size: 24rpx;
    color: #ffffff;
    white-space: nowrap;
    text-align: center;
}

/* 表单选项 */
.form-options {
    margin-bottom: 30rpx;
}

.agreement {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #cccccc;
    border-radius: 6rpx;
    margin-right: 10rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}

.option-text {
    font-size: 26rpx;
    color: #666666;
    margin-right: 20rpx;
}

.link {
    color: #1890ff;
    font-size: 26rpx;
    margin-left: auto;
}

.checkbox.checked {
    background: #1890ff;
    border-color: #1890ff;
}

.checkmark {
    color: #ffffff;
    font-size: 24rpx;
    font-weight: bold;
}

.option-text {
    font-size: 26rpx;
    color: #666666;
    margin-right: 10rpx;
}

.link {
    color: #1890ff;
    font-size: 26rpx;
}

/* 注册按钮 */
.register-button {
    background: #1890ff;
    border-radius: 12rpx;
    padding: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
}

.register-button:active {
    opacity: 0.9;
    background: #096dd9;
}

.register-button.disabled {
    opacity: 0.6;
}

.register-button-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #ffffff;
    text-align: center;
}

/* 登录链接 */
.login-link {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    margin-top: 20rpx;
}

.login-text {
    font-size: 26rpx;
    color: #666666;
    margin-right: 10rpx;
}

/* 底部版权 */
.footer {
    margin-top: auto;
    padding: 0 0 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.copyright {
    font-size: 24rpx;
    color: #666666;
    margin-bottom: 20rpx;
    text-align: center;
}

.about-link {
    padding: 10rpx 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
}

.about-link .link {
    font-size: 24rpx;
    color: #1890ff;
    text-align: center;
}
</style>
