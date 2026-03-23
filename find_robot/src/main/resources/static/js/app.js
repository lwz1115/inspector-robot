// ── 全局状态 ──────────────────────────────────────────────
const BASE = window.location.protocol + '//' + window.location.hostname + ':8080/api';
let JETSON_IP = localStorage.getItem('jetson_ip') || window.location.hostname;
let CAM_STREAM = window.location.protocol + '//' + JETSON_IP + ':8081/stream?topic=/image';

fetch(BASE + '/config/jetson-ip').then(r => r.json()).then(d => {
  if (d.ips && d.ips.length > 0) {
    const matched = d.ips.find(ip => ip === window.location.hostname);
    JETSON_IP = matched || d.ips[0];
    CAM_STREAM = window.location.protocol + '//' + JETSON_IP + ':8081/stream?topic=/image';
  }
}).catch(() => {});

let robotData = {};

// ── 工具函数 ──────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function parseCoords(str) {
  const p = str.split(',').map(s => parseFloat(s.trim()));
  return (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) ? { lng: p[0], lat: p[1] } : null;
}

function timeSince(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 1000);
  if (sec < 10) return '刚刚';
  if (sec < 60) return sec + '秒前';
  if (sec < 3600) return Math.floor(sec / 60) + '分钟前';
  return Math.floor(sec / 3600) + '小时前';
}

function fmtTime(ts) {
  if (!ts) return '--';
  return new Date(ts < 1e12 ? ts * 1000 : ts).toLocaleTimeString();
}

// ── 导航 ──────────────────────────────────────────────────
const pageTitles = { dashboard: '数据监控', video: '视频监控', location: '位置检测', indoormap: '室内建图', profile: '个人中心' };
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('page-' + item.dataset.page).classList.add('active');
    document.getElementById('page-title').textContent = pageTitles[item.dataset.page] || '';
    if (item.dataset.page === 'location' && !mapReady) initMap();
    if (item.dataset.page === 'indoormap') initRviz();
    if (item.dataset.page === 'profile') loadProfile();
  });
});

// ── 用户菜单 ──────────────────────────────────────────────
const uname = localStorage.getItem('currentUsername') || '用户';
document.getElementById('username').textContent = uname;
const _avatarEl = document.getElementById('avatar');
_avatarEl.textContent = uname.charAt(0).toUpperCase();

const _userBtn = document.getElementById('userBtn');
const _dropdown = document.getElementById('dropdown');

function showDropdown() {
  const rect = _userBtn.getBoundingClientRect();
  _dropdown.style.top  = (rect.bottom + 6) + 'px';
  _dropdown.style.right = (window.innerWidth - rect.right) + 'px';
  _dropdown.classList.add('show');
}
function hideDropdown() { _dropdown.classList.remove('show'); }

_userBtn.addEventListener('click', e => {
  e.stopPropagation();
  _dropdown.classList.contains('show') ? hideDropdown() : showDropdown();
});
document.addEventListener('click', hideDropdown);

document.getElementById('profileBtn').addEventListener('click', () => {
  hideDropdown();
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-profile').classList.add('active');
  document.getElementById('page-title').textContent = '个人中心';
  loadProfile();
});

document.getElementById('logoutBtn').addEventListener('click', doLogout);

function doLogout() {
  try { fetch(BASE + '/auth/logout', { method: 'POST' }); } catch (_) {}
  localStorage.clear();
  window.location.href = 'login.html';
}

// ── 个人中心 ──────────────────────────────────────────────

// ── 头像图片上传 ──────────────────────────────────────────
function triggerAvatarUpload() {
  document.getElementById('avatarFileInput').click();
}

function onAvatarFileChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('图片不能超过 2MB', 'error'); return; }

  const userId = localStorage.getItem('userId');
  if (!userId) { toast('请先登录', 'error'); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const s = Math.min(img.width, img.height);
      const ox = (img.width - s) / 2, oy = (img.height - s) / 2;
      ctx.drawImage(img, ox, oy, s, s, 0, 0, 200, 200);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      fetch(BASE + '/auth/user/' + userId + '/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: base64 })
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          applyAvatarImage(base64);
          toast('头像已更新', 'success');
        } else {
          toast(res.message || '上传失败', 'error');
        }
      })
      .catch(() => toast('网络异常', 'error'));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function applyAvatarImage(src) {
  const bigEl = document.getElementById('profile-avatar-big');
  if (bigEl) {
    bigEl.style.background = 'none';
    bigEl.innerHTML = '<img src="' + src + '" alt="avatar">';
  }
  const smallEl = document.getElementById('avatar');
  if (smallEl) {
    smallEl.style.background = 'none';
    smallEl.innerHTML = '<img src="' + src + '" alt="avatar">';
  }
  const removeBtn = document.getElementById('avatarRemoveBtn');
  if (removeBtn) removeBtn.style.display = 'inline-block';
}

function removeAvatar() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  fetch(BASE + '/auth/user/' + userId + '/avatar', { method: 'DELETE' })
    .then(r => r.json())
    .then(res => {
      if (!res.success) { toast(res.message || '移除失败', 'error'); return; }
      const nick = document.getElementById('profile-nickname').textContent || '?';
      const bigEl = document.getElementById('profile-avatar-big');
      const smallEl = document.getElementById('avatar');
      if (bigEl) { bigEl.style.background = ''; bigEl.innerHTML = nick.charAt(0).toUpperCase(); }
      if (smallEl) { smallEl.style.background = ''; smallEl.innerHTML = nick.charAt(0).toUpperCase(); }
      const removeBtn = document.getElementById('avatarRemoveBtn');
      if (removeBtn) removeBtn.style.display = 'none';
      toast('已移除自定义头像', 'info');
    })
    .catch(() => toast('网络异常', 'error'));
}

function loadProfile() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  fetch(BASE + '/auth/user/' + userId)
    .then(r => r.json())
    .then(res => {
      if (!res.success) return;
      const u = res.data;
      const nick = u.nickname || u.username;
      const bigEl = document.getElementById('profile-avatar-big');
      if (bigEl) { bigEl.style.background = ''; bigEl.innerHTML = nick.charAt(0).toUpperCase(); }
      document.getElementById('profile-nickname').textContent   = nick;
      document.getElementById('profile-username-show').textContent = '@' + u.username;
      const isAdmin = u.role === 'ADMIN';
      document.getElementById('profile-role-badge').textContent = isAdmin ? '🔑 管理员' : '👤 普通用户';
      document.getElementById('profile-role-badge').style.background = isAdmin ? 'rgba(250,173,20,.12)' : 'rgba(0,212,255,.12)';
      document.getElementById('profile-role-badge').style.color = isAdmin ? 'var(--warning)' : 'var(--accent)';
      document.getElementById('pi-username').textContent  = u.username;
      document.getElementById('pi-nickname').textContent  = u.nickname || '--';
      document.getElementById('pi-phone').textContent     = maskPhone(u.phone);
      document.getElementById('pi-email').textContent     = u.email || '--';
      document.getElementById('pi-role').textContent      = isAdmin ? '管理员' : '普通用户';
      document.getElementById('pi-createTime').textContent = u.createTime ? u.createTime.replace('T', ' ').slice(0, 16) : '--';
      localStorage.setItem('profileData', JSON.stringify(u));
      if (u.avatar) {
        applyAvatarImage(u.avatar);
      }
      const removeBtn = document.getElementById('avatarRemoveBtn');
      if (removeBtn) removeBtn.style.display = u.avatar ? 'inline-block' : 'none';
    }).catch(() => {});

  // 统计数据（本地计算）
  const loginTime = parseInt(localStorage.getItem('loginTime') || Date.now());
  const onlineMin = Math.floor((Date.now() - loginTime) / 60000);
  document.getElementById('stat-sessions').textContent = localStorage.getItem('todaySessions') || '1';
  document.getElementById('stat-online').textContent   = onlineMin;
  document.getElementById('stat-robots').textContent   = Object.keys(robotData).length || '--';
  document.getElementById('stat-alerts').textContent   = document.getElementById('d-alerts') ? document.getElementById('d-alerts').textContent : '0';

  renderLoginHistory();
}

function renderLoginHistory() {
  const list = document.getElementById('login-history-list');
  if (!list) return;
  let history = [];
  try { history = JSON.parse(localStorage.getItem('loginHistory') || '[]'); } catch(_) {}
  if (!history.length) {
    list.innerHTML = '<div class="empty" style="padding:20px"><div class="icon">📋</div>暂无记录</div>';
    return;
  }
  list.innerHTML = history.slice(0, 5).map((item, i) =>
    '<div class="profile-login-item">' +
    '<div class="profile-login-dot" style="background:' + (i === 0 ? 'var(--accent)' : 'var(--success)') + '"></div>' +
    '<div class="profile-login-time">' + item.time + '<span style="color:var(--text-muted);margin-left:8px;font-size:11px">' + item.ip + '</span></div>' +
    '<div class="profile-login-tag' + (i === 0 ? ' current' : '') + '">' + (i === 0 ? '本次' : '正常') + '</div>' +
    '</div>'
  ).join('');
}

function maskPhone(p) {
  if (!p || p.length < 7) return p || '--';
  return p.slice(0, 3) + '****' + p.slice(-4);
}

function openEditModal() {
  const u = JSON.parse(localStorage.getItem('profileData') || '{}');
  document.getElementById('edit-nickname').value = u.nickname || '';
  document.getElementById('edit-phone').value    = u.phone    || '';
  document.getElementById('edit-email').value    = u.email    || '';
  document.getElementById('editModal').style.display = 'flex';
}
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

function saveProfile() {
  const userId   = localStorage.getItem('userId');
  const nickname = document.getElementById('edit-nickname').value.trim();
  const phone    = document.getElementById('edit-phone').value.trim();
  const email    = document.getElementById('edit-email').value.trim();
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) { toast('手机号格式不正确', 'error'); return; }
  if (email && !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(email)) { toast('邮箱格式不正确', 'error'); return; }
  fetch(BASE + '/auth/user/' + userId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, phone, email })
  }).then(r => r.json()).then(res => {
    if (res.success) {
      toast('保存成功', 'success');
      closeEditModal();
      if (nickname) {
        localStorage.setItem('nickname', nickname);
        document.getElementById('username').textContent = nickname;
        document.getElementById('avatar').innerHTML = nickname.charAt(0).toUpperCase();
      }
      loadProfile();
    } else {
      toast(res.message || '保存失败', 'error');
    }
  }).catch(() => toast('网络异常', 'error'));
}

function openPwdModal() {
  document.getElementById('pwd-old').value = '';
  document.getElementById('pwd-new').value = '';
  document.getElementById('pwd-new2').value = '';
  document.getElementById('pwdModal').style.display = 'flex';
}
function closePwdModal() { document.getElementById('pwdModal').style.display = 'none'; }

function savePassword() {
  const userId  = localStorage.getItem('userId');
  const oldPwd  = document.getElementById('pwd-old').value;
  const newPwd  = document.getElementById('pwd-new').value;
  const newPwd2 = document.getElementById('pwd-new2').value;
  if (!oldPwd)           { toast('请输入当前密码', 'error'); return; }
  if (!newPwd)           { toast('请输入新密码', 'error'); return; }
  if (newPwd.length < 6) { toast('新密码至少6位', 'error'); return; }
  if (newPwd !== newPwd2){ toast('两次密码不一致', 'error'); return; }
  fetch(BASE + '/auth/user/' + userId + '/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
  }).then(r => r.json()).then(res => {
    if (res.success) {
      toast('密码修改成功，请重新登录', 'success');
      closePwdModal();
      setTimeout(doLogout, 1500);
    } else {
      toast(res.message || '修改失败', 'error');
    }
  }).catch(() => toast('网络异常', 'error'));
}

// ── 时钟 ──────────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clockTime');
  if (el) el.textContent = new Date().toLocaleTimeString();
}
updateClock();
setInterval(updateClock, 1000);

// ── 状态指示 ──────────────────────────────────────────────
function setStatus(ok) {
  const color = ok ? 'var(--success)' : 'var(--danger)';
  const apiDot = document.getElementById('apiDot');
  const mqttDot = document.getElementById('mqttDot');
  if (apiDot) apiDot.style.background = color;
  if (mqttDot) mqttDot.style.background = ok ? 'var(--success)' : 'var(--warning)';
  document.getElementById('apiStatus').textContent = ok ? 'API: 已连接' : 'API: 连接失败';
  document.getElementById('mqttStatus').textContent = ok ? 'MQTT: 实时数据' : 'MQTT: 无数据';
}

// ── 数据轮询 ──────────────────────────────────────────────
async function fetchData() {
  try {
    const res = await fetch(BASE + '/robot-data', { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const map = {};
    data.forEach(d => {
      const id = d.deviceId || 'robot';
      if (!map[id] || d.timestamp > map[id].timestamp) map[id] = d;
    });
    robotData = map;
    const robots = Object.values(map);
    updateDashboard(robots);
    updateLocation(robots);
    setStatus(true);
  } catch (e) {
    setStatus(false);
  }
}

fetchData();
setInterval(fetchData, 3000);
