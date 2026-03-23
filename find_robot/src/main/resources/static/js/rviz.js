// ── 室内建图 Web RViz ─────────────────────────────────────
/* global THREE, JETSON_IP, toast */
let rvizWS = null;
let rvizMap = null;
let rvizMapDirty = false;
let rvizView = { x: 0, y: 0, scale: 50 };
let rvizDrag = null;
let robotPose = { x: 0, y: 0, yaw: 0 };
let hasPose = false;
let robotPath = [];
const MAX_PATH = 3000;
const SCAN_FRAMES_DEFAULT = 5;
const scanFrames = [];
let scanPoints = [];
let scanFramesMax = SCAN_FRAMES_DEFAULT;
let showScan = true, showPath = true, showGrid = true;
let rvizMapCache = null;
// 缓存常用 DOM 引用（initRviz 后填充）
const _el = {};

// ── TF ────────────────────────────────────────────────────
const tfCache = {};

function tfSet(parent, child, tx, ty, yaw) {
  if (!parent || !child) return;
  tfCache[parent + '->' + child] = { tx, ty, yaw };
}

function tfCompose(t1, t2) {
  const c = Math.cos(t1.yaw), s = Math.sin(t1.yaw);
  return {
    tx: t1.tx + c * t2.tx - s * t2.ty,
    ty: t1.ty + s * t2.tx + c * t2.ty,
    yaw: t1.yaw + t2.yaw
  };
}

// BFS 最多3跳，防止循环
function tfGet(parent, child) {
  if (!parent || !child) return null;
  const key = parent + '->' + child;
  if (tfCache[key]) return tfCache[key];
  const keys = Object.keys(tfCache);
  // 1-hop
  for (const k1 of keys) {
    const sep = k1.indexOf('->');
    if (k1.slice(0, sep) !== parent) continue;
    const mid1 = k1.slice(sep + 2);
    if (mid1 === child) return tfCache[k1]; // direct (already checked above, safety)
    const k2 = mid1 + '->' + child;
    if (tfCache[k2]) return tfCompose(tfCache[k1], tfCache[k2]);
    // 2-hop
    for (const k2b of keys) {
      const sep2 = k2b.indexOf('->');
      if (k2b.slice(0, sep2) !== mid1) continue;
      const mid2 = k2b.slice(sep2 + 2);
      if (mid2 === parent || mid2 === mid1) continue; // avoid trivial cycles
      const k3 = mid2 + '->' + child;
      if (tfCache[k3]) return tfCompose(tfCompose(tfCache[k1], tfCache[k2b]), tfCache[k3]);
    }
  }
  return null;
}

function quatToYaw(q) {
  if (!q) return 0;
  return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
}

// ── 连接 ──────────────────────────────────────────────────
function rvizInitUrl() {
  const ip = (typeof JETSON_IP !== 'undefined' && JETSON_IP) || window.location.hostname;
  if (_el.rvcUrl) _el.rvcUrl.value = 'ws://' + ip + ':9090';
}

function rvizConnect() {
  const url = (_el.rvcUrl && _el.rvcUrl.value.trim()) || '';
  if (!url) return;
  if (!/^wss?:\/\/.+/.test(url)) { toast('WebSocket 地址格式错误', 'error'); return; }
  if (rvizWS) { rvizWS.onclose = null; rvizWS.close(); rvizWS = null; }
  try {
    rvizWS = new WebSocket(url);
  } catch (e) {
    toast('无法创建连接: ' + e.message, 'error');
    return;
  }
  rvizWS.onopen  = () => { setRvcStatus(true);  toast('rosbridge 已连接', 'success'); rvizSubscribeAll(); };
  rvizWS.onclose = () => { setRvcStatus(false); rvizWS = null; };
  rvizWS.onerror = () => { setRvcStatus(false); toast('rosbridge 连接失败', 'error'); };
  rvizWS.onmessage = e => { try { rvizHandleMsg(JSON.parse(e.data)); } catch (_) {} };
}

function rvizDisconnect() {
  if (rvizWS) { rvizWS.onclose = null; rvizWS.close(); rvizWS = null; }
  setRvcStatus(false);
}

function setRvcStatus(ok) {
  if (_el.rvcDot)    { _el.rvcDot.style.background  = ok ? 'var(--success)' : 'var(--danger)'; _el.rvcDot.style.animation = ok ? 'pulse 2s infinite' : 'none'; }
  if (_el.rvcStatus) _el.rvcStatus.textContent = ok ? 'rosbridge 已连接' : 'rosbridge 已断开';
  if (_el.rvcConnBtn) _el.rvcConnBtn.style.display = ok ? 'none'  : 'block';
  if (_el.rvcDiscBtn) _el.rvcDiscBtn.style.display = ok ? 'block' : 'none';
}

function rvizSend(obj) {
  if (rvizWS && rvizWS.readyState === WebSocket.OPEN) {
    try { rvizWS.send(JSON.stringify(obj)); } catch (_) {}
  }
}

function rvizSubscribeAll() {
  // /map 1秒一次足够（建图慢），/scan 降到30ms逼近雷达帧率（N10约10Hz=100ms，30ms不会过载）
  // queue_length:1 丢弃积压帧，只保留最新，避免消息堆积造成的"假延迟"
  rvizSend({ op: 'subscribe', topic: '/map',       type: 'nav_msgs/OccupancyGrid', throttle_rate: 1000, queue_length: 1 });
  rvizSend({ op: 'subscribe', topic: '/tf',        type: 'tf2_msgs/TFMessage',     throttle_rate: 30,   queue_length: 1 });
  rvizSend({ op: 'subscribe', topic: '/tf_static', type: 'tf2_msgs/TFMessage',     throttle_rate: 0                    });
  rvizSend({ op: 'subscribe', topic: '/scan',      type: 'sensor_msgs/LaserScan',  throttle_rate: 30,   queue_length: 1 });
}

// ── 消息处理 ──────────────────────────────────────────────
function rvizHandleMsg(msg) {
  if (!msg || msg.op !== 'publish' || !msg.msg) return;
  const d = msg.msg;

  if (msg.topic === '/map') {
    const info = d.info;
    if (!info || !info.width || !info.height || !info.resolution || !Array.isArray(d.data)) return;
    const firstMap = !rvizMap;
    rvizMap = {
      width: info.width, height: info.height, res: info.resolution,
      origin_x: (info.origin && info.origin.position) ? info.origin.position.x : 0,
      origin_y: (info.origin && info.origin.position) ? info.origin.position.y : 0,
      data: d.data
    };
    rvizMapDirty = true;
    if (_el.mapDot)    { _el.mapDot.style.background = 'var(--success)'; _el.mapDot.style.animation = 'pulse 2s infinite'; }
    if (_el.mapStatus) _el.mapStatus.textContent = '建图中';
    if (_el.mapRes)    _el.mapRes.textContent  = info.resolution.toFixed(3) + ' m';
    if (_el.mapSize)   _el.mapSize.textContent = info.width + '×' + info.height;
    if (firstMap) rvizAutoFit();

  } else if (msg.topic === '/tf' || msg.topic === '/tf_static') {
    const transforms = d.transforms;
    if (!Array.isArray(transforms)) return;
    for (const t of transforms) {
      if (!t || !t.header || !t.transform) continue;
      const parent = t.header.frame_id.replace(/^\//, '');
      const child  = t.child_frame_id.replace(/^\//, '');
      const tr = t.transform.translation, ro = t.transform.rotation;
      if (!tr || !ro) continue;
      tfSet(parent, child, tr.x || 0, tr.y || 0, quatToYaw(ro));
    }
    const tf = tfGet('map', 'base_link');
    if (tf) {
      robotPose.x = tf.tx; robotPose.y = tf.ty; robotPose.yaw = tf.yaw;
      hasPose = true;
      const last = robotPath[robotPath.length - 1];
      if (!last || Math.hypot(robotPose.x - last.x, robotPose.y - last.y) > 0.02) {
        robotPath.push({ x: robotPose.x, y: robotPose.y });
        if (robotPath.length > MAX_PATH) robotPath.shift();
      }
      if (_el.odomX)     _el.odomX.textContent     = robotPose.x.toFixed(3) + ' m';
      if (_el.odomY)     _el.odomY.textContent     = robotPose.y.toFixed(3) + ' m';
      if (_el.odomYaw)   _el.odomYaw.textContent   = (robotPose.yaw * 180 / Math.PI).toFixed(1) + '°';
      if (_el.pathCount) _el.pathCount.textContent = robotPath.length;
    }

  } else if (msg.topic === '/scan') {
    if (!hasPose) return;
    const ranges = d.ranges;
    if (!Array.isArray(ranges) || ranges.length === 0) return;
    const amin = d.angle_min || 0, ainc = d.angle_increment || 0;
    const rmax = (d.range_max > 0 && isFinite(d.range_max)) ? d.range_max : 3.5;
    // 雷达装反180°，用 robotPose.yaw + π 补偿
    const laserYaw = robotPose.yaw + Math.PI;
    const cos_l = Math.cos(laserYaw), sin_l = Math.sin(laserYaw);
    const rx = robotPose.x, ry = robotPose.y;
    const frame = [];
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!isFinite(r) || r < 0.05 || r > rmax) continue;
      const a = amin + i * ainc;
      const lx = r * Math.cos(a), ly = r * Math.sin(a);
      frame.push({
        x: rx + lx * cos_l - ly * sin_l,
        y: ry + lx * sin_l + ly * cos_l
      });
    }
    // 增量维护 scanPoints：移除最旧帧的点数，追加新帧
    if (scanFrames.length >= scanFramesMax) {
      const removed = scanFrames.shift();
      scanPoints.splice(0, removed.length);
    }
    scanFrames.push(frame);
    for (let i = 0; i < frame.length; i++) scanPoints.push(frame[i]);
    if (_el.scanCount) _el.scanCount.textContent = frame.length;
  }
}

// ── 坐标变换 ──────────────────────────────────────────────
// ROS: X右Y上；屏幕: X右Y下 → 只翻转Y
function w2c(wx, wy) {
  const c = _el.canvas2d;
  if (!c) return { x: 0, y: 0 };
  return {
    x: c.width  / 2 + (wx - rvizView.x) * rvizView.scale,
    y: c.height / 2 - (wy - rvizView.y) * rvizView.scale
  };
}

// ── 渲染 ──────────────────────────────────────────────────
function rvizRender() {
  requestAnimationFrame(rvizRender);
  if (is3D) return; // 3D模式下跳过2D渲染
  const canvas = _el.canvas2d;
  const container = _el.container;
  if (!canvas || !container) return;
  const cw = container.clientWidth, ch = container.clientHeight;
  if (!cw || !ch) return;
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw; canvas.height = ch;
    rvizMapCache = null;
  }
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111318';
  ctx.fillRect(0, 0, cw, ch);

  // 网格
  if (showGrid && rvizView.scale > 10) {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    const ox = Math.floor(rvizView.x), oy = Math.floor(rvizView.y);
    ctx.beginPath();
    for (let wx = ox - Math.ceil(cw / rvizView.scale); wx < ox + Math.ceil(cw / rvizView.scale) + 2; wx++) {
      const px = w2c(wx, 0).x; ctx.moveTo(px, 0); ctx.lineTo(px, ch);
    }
    for (let wy = oy - Math.ceil(ch / rvizView.scale); wy < oy + Math.ceil(ch / rvizView.scale) + 2; wy++) {
      const py = w2c(0, wy).y; ctx.moveTo(0, py); ctx.lineTo(cw, py);
    }
    ctx.stroke();
    const o = w2c(0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(o.x - 10, o.y); ctx.lineTo(o.x + 10, o.y);
    ctx.moveTo(o.x, o.y - 10); ctx.lineTo(o.x, o.y + 10);
    ctx.stroke();
  }

  // 地图
  if (rvizMap) {
    if (rvizMapDirty || !rvizMapCache) {
      const off = document.createElement('canvas');
      off.width = rvizMap.width; off.height = rvizMap.height;
      const octx = off.getContext('2d');
      const img = octx.createImageData(rvizMap.width, rvizMap.height);
      const data = rvizMap.data, W = rvizMap.width, H = rvizMap.height;
      for (let row = 0; row < H; row++) {
        for (let col = 0; col < W; col++) {
          const v = data[(H - 1 - row) * W + col];
          let r, g, b;
          if (v < 0)        { r = 99;  g = 99;  b = 117; }
          else if (v === 0) { r = 236; g = 236; b = 236; }
          else              { r = 20;  g = 20;  b = 20;  }
          const idx = (row * W + col) * 4;
          img.data[idx] = r; img.data[idx+1] = g; img.data[idx+2] = b; img.data[idx+3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      rvizMapCache = off;
      rvizMapDirty = false;
    }
    const mapW_px = rvizMap.width  * rvizMap.res * rvizView.scale;
    const mapH_px = rvizMap.height * rvizMap.res * rvizView.scale;
    const tl = w2c(rvizMap.origin_x, rvizMap.origin_y + rvizMap.height * rvizMap.res);
    ctx.imageSmoothingEnabled = rvizView.scale < 6;
    ctx.drawImage(rvizMapCache, tl.x, tl.y, mapW_px, mapH_px);

    if (window._rvizDebug) {
      ctx.font = '11px monospace';
      [
        { wx: rvizMap.origin_x, wy: rvizMap.origin_y, label: 'BL' },
        { wx: rvizMap.origin_x + rvizMap.width * rvizMap.res, wy: rvizMap.origin_y, label: 'BR' },
        { wx: rvizMap.origin_x, wy: rvizMap.origin_y + rvizMap.height * rvizMap.res, label: 'TL' },
        { wx: rvizMap.origin_x + rvizMap.width * rvizMap.res, wy: rvizMap.origin_y + rvizMap.height * rvizMap.res, label: 'TR' },
      ].forEach(c => {
        const p = w2c(c.wx, c.wy);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.fillText(c.label + '(' + c.wx.toFixed(1) + ',' + c.wy.toFixed(1) + ')', p.x + 5, p.y + 4);
      });
    }
  }

  // 轨迹
  if (showPath && robotPath.length > 1) {
    ctx.beginPath(); ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
    ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
    const p0 = w2c(robotPath[0].x, robotPath[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < robotPath.length; i++) {
      const p = w2c(robotPath[i].x, robotPath[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  // 雷达点云
  if (showScan && scanPoints.length > 0) {
    const dot = Math.max(1, Math.min(3, rvizView.scale * 0.01));
    ctx.fillStyle = '#ff6b35'; ctx.globalAlpha = 0.75;
    for (const pt of scanPoints) {
      const p = w2c(pt.x, pt.y);
      ctx.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
  }

  // 小车模型（两轮差速，椭圆底盘 18×15.5cm，轮径65mm）
  if (hasPose || rvizMap) {
    const rp = w2c(robotPose.x, robotPose.y);
    const sc = rvizView.scale;
    const BL = 0.18, BW = 0.155, WR = 0.0325, WW = 0.022;
    const bl = Math.max(10, BL * sc), bw = Math.max(8, BW * sc);
    const wr = Math.max(2, WR * sc), ww = Math.max(1.5, WW * sc);
    ctx.save();
    ctx.translate(rp.x, rp.y);
    ctx.rotate(-robotPose.yaw);
    ctx.shadowColor = 'rgba(255,64,129,0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, bl / 2, bw / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#cc2255'; ctx.fill();
    ctx.strokeStyle = '#ff80ab'; ctx.lineWidth = Math.max(1, sc * 0.004); ctx.stroke();
    ctx.shadowBlur = 0;
    const wheelOffset = bw / 2 + ww * 0.4;
    ctx.fillStyle = '#444466'; ctx.strokeStyle = '#8888aa'; ctx.lineWidth = Math.max(0.5, sc * 0.002);
    ctx.beginPath(); ctx.rect(-wr, -(wheelOffset + ww), wr * 2, ww); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-wr, wheelOffset, wr * 2, ww); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, sc * 0.003);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bl * 0.42, 0); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, sc * 0.012), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 比例尺
  if (_el.rvizScale) {
    const m = rvizView.scale >= 80 ? 0.5 : rvizView.scale >= 20 ? 1 : 2;
    _el.rvizScale.textContent = m + 'm = ' + (m * rvizView.scale).toFixed(0) + 'px  ×' + rvizView.scale.toFixed(0);
  }

  // 调试叠加
  if (window._rvizDebug && rvizMap && hasPose) {
    ctx.font = '11px monospace';
    const lines = [
      'robot: (' + robotPose.x.toFixed(3) + ', ' + robotPose.y.toFixed(3) + ') yaw=' + (robotPose.yaw * 180 / Math.PI).toFixed(1) + '°',
      'laser TF: ' + (() => { const t = tfGet('map', 'laser_frame'); return t ? '(' + t.tx.toFixed(3) + ',' + t.ty.toFixed(3) + ') yaw=' + (t.yaw * 180 / Math.PI).toFixed(1) + '°' : 'null'; })(),
      'map origin: (' + rvizMap.origin_x.toFixed(3) + ', ' + rvizMap.origin_y.toFixed(3) + ') res=' + rvizMap.res,
      'scan[0]: ' + (scanPoints[0] ? '(' + scanPoints[0].x.toFixed(3) + ',' + scanPoints[0].y.toFixed(3) + ')' : 'none'),
    ];
    lines.forEach((l, i) => {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8 + i * 16, ctx.measureText(l).width + 6, 14);
      ctx.fillStyle = '#ffff00';
      ctx.fillText(l, 11, 20 + i * 16);
    });
    const rp = w2c(robotPose.x, robotPose.y);
    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rp.x - 15, rp.y); ctx.lineTo(rp.x + 15, rp.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rp.x, rp.y - 15); ctx.lineTo(rp.x, rp.y + 15); ctx.stroke();
    const tfL = tfGet('map', 'laser_frame');
    if (tfL) {
      const lp = w2c(tfL.tx, tfL.ty);
      ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(lp.x, lp.y, 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// ── 视图控制 ──────────────────────────────────────────────
function rvizAutoFit() {
  if (!rvizMap) return;
  const canvas = _el.canvas2d;
  if (!canvas || !canvas.width) return;
  const mw = rvizMap.width * rvizMap.res, mh = rvizMap.height * rvizMap.res;
  if (!mw || !mh) return;
  rvizView.scale = Math.min(canvas.width / mw, canvas.height / mh) * 0.88;
  rvizView.x = rvizMap.origin_x + mw / 2;
  rvizView.y = rvizMap.origin_y + mh / 2;
}

function rvizResetView() {
  if (rvizMap) { rvizAutoFit(); return; }
  rvizView = { x: 0, y: 0, scale: 50 };
}

function rvizToggleScan() {
  showScan = !showScan;
  const el = document.getElementById('scanToggleLabel');
  if (el) el.textContent = '📡 雷达 ' + (showScan ? '✓' : '✗');
}
function rvizTogglePath() {
  showPath = !showPath;
  const el = document.getElementById('pathToggleLabel');
  if (el) el.textContent = '🛤️ 轨迹 ' + (showPath ? '✓' : '✗');
}
function rvizToggleGrid() {
  showGrid = !showGrid;
  const el = document.getElementById('gridToggleLabel');
  if (el) el.textContent = '⊞ 网格 ' + (showGrid ? '✓' : '✗');
}
function rvizClearPath() {
  robotPath = [];
  if (_el.pathCount) _el.pathCount.textContent = '0';
}

function saveMap() {
  if (!rvizMap) { toast('暂无地图数据', 'warning'); return; }
  const canvas = _el.canvas2d;
  if (!canvas) return;
  const a = document.createElement('a');
  a.download = 'map_' + Date.now() + '.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function setScanFrames(n) {
  const v = Math.max(1, parseInt(n) || SCAN_FRAMES_DEFAULT);
  scanFramesMax = v;
  while (scanFrames.length > v) scanFrames.shift();
  // 重建 scanPoints（帧数调整时才需要 flat，不在热路径上）
  scanPoints = scanFrames.flat();
}

// ── 鼠标/触摸交互 ─────────────────────────────────────────
(function () {
  // 延迟绑定，等 DOM 就绪
  function bindEvents() {
    const el = document.getElementById('rvizContainer');
    if (!el) return;

    el.addEventListener('wheel', e => {
      e.preventDefault();
      if (is3D) return;
      const rect = el.getBoundingClientRect();
      const canvas = _el.canvas2d;
      if (!canvas) return;
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const wx = rvizView.x + (mx - canvas.width / 2) / rvizView.scale;
      const wy = rvizView.y - (my - canvas.height / 2) / rvizView.scale;
      const f = e.deltaY < 0 ? 1.12 : 0.89;
      rvizView.scale = Math.max(4, Math.min(800, rvizView.scale * f));
      rvizView.x = wx - (mx - canvas.width / 2) / rvizView.scale;
      rvizView.y = wy + (my - canvas.height / 2) / rvizView.scale;
    }, { passive: false });

    el.addEventListener('mousedown', e => {
      if (is3D) return;
      rvizDrag = { sx: e.clientX, sy: e.clientY, vx: rvizView.x, vy: rvizView.y };
      el.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if (!rvizDrag || is3D) return;
      rvizView.x = rvizDrag.vx - (e.clientX - rvizDrag.sx) / rvizView.scale;
      rvizView.y = rvizDrag.vy + (e.clientY - rvizDrag.sy) / rvizView.scale;
    });
    window.addEventListener('mouseup', () => {
      rvizDrag = null;
      if (el) el.style.cursor = 'grab';
    });

    el.addEventListener('mousemove', e => {
      if (is3D) return;
      const rect = el.getBoundingClientRect();
      const canvas = _el.canvas2d;
      if (!canvas) return;
      const wx = rvizView.x + (e.clientX - rect.left - canvas.width / 2) / rvizView.scale;
      const wy = rvizView.y - (e.clientY - rect.top  - canvas.height / 2) / rvizView.scale;
      if (_el.rvizCoords) _el.rvizCoords.textContent = 'x: ' + wx.toFixed(2) + '  y: ' + wy.toFixed(2);
    });

    let lastDist = 0;
    el.addEventListener('touchstart', e => {
      if (is3D) return;
      if (e.touches.length === 1)
        rvizDrag = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, vx: rvizView.x, vy: rvizView.y };
      else if (e.touches.length === 2)
        lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      if (is3D) return;
      if (e.touches.length === 1 && rvizDrag) {
        rvizView.x = rvizDrag.vx - (e.touches[0].clientX - rvizDrag.sx) / rvizView.scale;
        rvizView.y = rvizDrag.vy + (e.touches[0].clientY - rvizDrag.sy) / rvizView.scale;
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastDist > 0) rvizView.scale = Math.max(4, Math.min(800, rvizView.scale * d / lastDist));
        lastDist = d;
      }
    }, { passive: true });
    el.addEventListener('touchend', () => { rvizDrag = null; lastDist = 0; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindEvents);
  else bindEvents();
})();

// ── 初始化入口 ────────────────────────────────────────────
function initRviz() {
  // 缓存 DOM 引用
  _el.canvas2d   = document.getElementById('rvizCanvas');
  _el.canvas3d   = document.getElementById('rviz3dCanvas');
  _el.container  = document.getElementById('rvizContainer');
  _el.rvcUrl     = document.getElementById('rvcUrl');
  _el.rvcDot     = document.getElementById('rvcDot');
  _el.rvcStatus  = document.getElementById('rvcStatus');
  _el.rvcConnBtn = document.getElementById('rvcConnBtn');
  _el.rvcDiscBtn = document.getElementById('rvcDiscBtn');
  _el.mapDot     = document.getElementById('mapDot');
  _el.mapStatus  = document.getElementById('mapStatus');
  _el.mapRes     = document.getElementById('map-resolution');
  _el.mapSize    = document.getElementById('map-size');
  _el.odomX      = document.getElementById('odom-x');
  _el.odomY      = document.getElementById('odom-y');
  _el.odomYaw    = document.getElementById('odom-yaw');
  _el.pathCount  = document.getElementById('path-count');
  _el.scanCount  = document.getElementById('scan-count');
  _el.rvizScale  = document.getElementById('rvizScale');
  _el.rvizCoords = document.getElementById('rvizCoords');

  rvizInitUrl();
  if (!initRviz._started) {
    initRviz._started = true;
    requestAnimationFrame(rvizRender);
  }
}

// ── 伪3D模式 ──────────────────────────────────────────────
let is3D = false;
let three = null;
// 用于 3D 地图更新的版本号
let _mapVersion = 0;

function rvizToggle3D() {
  is3D = !is3D;
  const btn = document.getElementById('btn3dToggle');
  const c2d = _el.canvas2d, c3d = _el.canvas3d;
  if (!c2d || !c3d) return;
  if (is3D) {
    if (btn) { btn.style.background = 'rgba(0,212,255,0.2)'; btn.style.borderColor = '#00d4ff'; }
    c2d.style.display = 'none';
    c3d.style.display = 'block';
    if (!three) init3D();
    else resize3D();
  } else {
    if (btn) { btn.style.background = ''; btn.style.borderColor = ''; }
    c2d.style.display = 'block';
    c3d.style.display = 'none';
  }
}

function init3D() {
  if (typeof THREE === 'undefined') {
    toast('Three.js 未加载，无法启用3D视图', 'error');
    is3D = false;
    return;
  }
  const canvas = _el.canvas3d;
  const container = _el.container;
  if (!canvas || !container) return;
  const W = container.clientWidth || 600, H = container.clientHeight || 400;
  canvas.width = W; canvas.height = H;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.06);

  const camera = new THREE.PerspectiveCamera(55, W / H, 0.01, 50);
  camera.position.set(0, 4, 5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x334466, 2.5));
  const dir = new THREE.DirectionalLight(0x88ccff, 1.5);
  dir.position.set(3, 6, 4); dir.castShadow = true;
  scene.add(dir);
  scene.add(new THREE.PointLight(0x00d4ff, 1.2, 10));

  scene.add(new THREE.GridHelper(20, 60, 0x1a2540, 0x1a2540));
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);

  const robotGroup = makeRobot3D();
  scene.add(robotGroup);

  const pillarGroup = new THREE.Group();
  scene.add(pillarGroup);

  const mapMesh = { obj: null, tex: null };

  // 视角控制（闭包内，不污染全局）
  let sph = { theta: 0.4, phi: 0.65, r: 7 };
  let tgt = new THREE.Vector3(0, 0.3, 0);
  let drag3d = null;

  function onMouseDown(e) {
    drag3d = { x: e.clientX, y: e.clientY, sph: { ...sph }, tgt: tgt.clone(), right: e.button === 2 };
  }
  function onMouseMove(e) {
    if (!drag3d) return;
    const dx = e.clientX - drag3d.x, dy = e.clientY - drag3d.y;
    if (drag3d.right) {
      tgt.x = drag3d.tgt.x - dx * 0.005;
      tgt.z = drag3d.tgt.z - dy * 0.005;
    } else {
      sph.theta = drag3d.sph.theta - dx * 0.008;
      sph.phi = Math.max(0.1, Math.min(1.45, drag3d.sph.phi - dy * 0.008));
    }
  }
  function onMouseUp() { drag3d = null; }
  function onWheel(e) { sph.r = Math.max(1.5, Math.min(20, sph.r + e.deltaY * 0.005)); }
  function onCtxMenu(e) { e.preventDefault(); }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('contextmenu', onCtxMenu);
  canvas.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  let lastTouchDist = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1)
      drag3d = { x: e.touches[0].clientX, y: e.touches[0].clientY, sph: { ...sph }, tgt: tgt.clone(), right: false };
    else if (e.touches.length === 2)
      lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && drag3d) {
      sph.theta = drag3d.sph.theta - (e.touches[0].clientX - drag3d.x) * 0.008;
      sph.phi = Math.max(0.1, Math.min(1.45, drag3d.sph.phi - (e.touches[0].clientY - drag3d.y) * 0.008));
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastTouchDist > 0) sph.r = Math.max(1.5, Math.min(20, sph.r * lastTouchDist / d));
      lastTouchDist = d;
    }
  }, { passive: true });
  canvas.addEventListener('touchend', () => { drag3d = null; lastTouchDist = 0; });

  let lastScanLen = -1, lastMapVer = -1;
  // 用帧数而非点数检测 scan 更新（增量追加后长度可能相同）
  let lastScanFrameCount = -1;

  function animate3D() {
    if (!is3D) {
      // 清理全局事件监听
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      return;
    }
    requestAnimationFrame(animate3D);

    if (hasPose) {
      robotGroup.position.set(robotPose.x, 0, -robotPose.y);
      robotGroup.rotation.y = robotPose.yaw;
      tgt.set(robotPose.x, 0.3, -robotPose.y);
    }

    if (scanPoints.length !== lastScanLen || scanFrames.length !== lastScanFrameCount) {
      lastScanLen = scanPoints.length;
      lastScanFrameCount = scanFrames.length;
      rebuild3DPillars(pillarGroup, scanPoints);
    }

    if (rvizMap && rvizMapDirty && _mapVersion !== lastMapVer) {
      lastMapVer = _mapVersion;
      update3DMap(scene, mapMesh, rvizMap);
    }

    camera.position.set(
      tgt.x + sph.r * Math.sin(sph.phi) * Math.sin(sph.theta),
      tgt.y + sph.r * Math.cos(sph.phi),
      tgt.z + sph.r * Math.sin(sph.phi) * Math.cos(sph.theta)
    );
    camera.lookAt(tgt);

    const cw = container.clientWidth, ch = container.clientHeight;
    if (cw && ch && (canvas.width !== cw || canvas.height !== ch)) {
      canvas.width = cw; canvas.height = ch;
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  three = { renderer, scene, camera, robotGroup, pillarGroup, mapMesh };
  animate3D();
}

function resize3D() {
  if (!three || !_el.canvas3d || !_el.container) return;
  const W = _el.container.clientWidth, H = _el.container.clientHeight;
  if (!W || !H) return;
  _el.canvas3d.width = W; _el.canvas3d.height = H;
  three.renderer.setSize(W, H);
  three.camera.aspect = W / H;
  three.camera.updateProjectionMatrix();
}

// 两轮差速小车 3D 模型（18×15.5cm，轮径65mm）
function makeRobot3D() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.06, 32),
    new THREE.MeshStandardMaterial({ color: 0xcc2255, roughness: 0.4, metalness: 0.3, emissive: 0x330011 })
  );
  body.scale.set(1, 1, 0.155 / 0.18);
  body.position.y = 0.05; body.castShadow = true;
  g.add(body);

  const lidar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
    new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.3, emissive: 0x003344, emissiveIntensity: 0.5 })
  );
  lidar.position.y = 0.1;
  g.add(lidar);

  const wheelGeo = new THREE.CylinderGeometry(0.0325, 0.0325, 0.022, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
  [-1, 1].forEach(side => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(0, 0.0325, side * (0.155 / 2 + 0.011));
    w.castShadow = true;
    g.add(w);
  });

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.02, 0.06, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x888888 })
  );
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(0.1, 0.1, 0);
  g.add(arrow);
  return g;
}

// 重建点云柱体（复用 InstancedMesh，只在点数变化时重建，否则只更新矩阵）
const _pillars3D = { mesh: null, geo: null, mat: null, capacity: 0 };
function rebuild3DPillars(group, points) {
  const n = points.length;
  if (n === 0) {
    if (_pillars3D.mesh) _pillars3D.mesh.visible = false;
    return;
  }
  const h = 0.3;
  // 容量不足时才重建 InstancedMesh（避免频繁 GPU 分配）
  if (!_pillars3D.mesh || n > _pillars3D.capacity) {
    // dispose 旧资源
    if (_pillars3D.mesh) { group.remove(_pillars3D.mesh); _pillars3D.mesh.dispose && _pillars3D.mesh.dispose(); }
    if (_pillars3D.geo)  _pillars3D.geo.dispose();
    if (_pillars3D.mat)  _pillars3D.mat.dispose();
    // 预留20%余量，减少重建频率
    const cap = Math.ceil(n * 1.2);
    _pillars3D.geo = new THREE.CylinderGeometry(0.012, 0.012, h, 5);
    _pillars3D.mat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.5, emissive: 0xff3300, emissiveIntensity: 0.2 });
    _pillars3D.mesh = new THREE.InstancedMesh(_pillars3D.geo, _pillars3D.mat, cap);
    _pillars3D.mesh.castShadow = true;
    _pillars3D.capacity = cap;
    group.add(_pillars3D.mesh);
  }
  // 只更新矩阵，不重建
  const dummy = new THREE.Object3D();
  _pillars3D.mesh.count = n;
  _pillars3D.mesh.visible = true;
  for (let i = 0; i < n; i++) {
    dummy.position.set(points[i].x, h / 2, -points[i].y);
    dummy.updateMatrix();
    _pillars3D.mesh.setMatrixAt(i, dummy.matrix);
  }
  _pillars3D.mesh.instanceMatrix.needsUpdate = true;
}

// 地图平面（dispose 旧资源，版本号驱动更新）
function update3DMap(scene, mapMesh, map) {
  if (mapMesh.obj) {
    scene.remove(mapMesh.obj);
    if (mapMesh.obj.geometry) mapMesh.obj.geometry.dispose();
    if (mapMesh.obj.material) mapMesh.obj.material.dispose();
    mapMesh.obj = null;
  }
  if (mapMesh.tex) { mapMesh.tex.dispose(); mapMesh.tex = null; }
  // 增加版本号，供 animate3D 检测
  _mapVersion++;

  const W = map.width, H = map.height;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W; offCanvas.height = H;
  const ctx = offCanvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      const v = map.data[(H - 1 - row) * W + col];
      let r, g, b, a;
      if (v < 0)        { r = 99;  g = 99;  b = 117; a = 180; }
      else if (v === 0) { r = 220; g = 220; b = 220; a = 255; }
      else              { r = 20;  g = 20;  b = 20;  a = 255; }
      const idx = (row * W + col) * 4;
      img.data[idx] = r; img.data[idx+1] = g; img.data[idx+2] = b; img.data[idx+3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(offCanvas);
  const mw = W * map.res, mh = H * map.res;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(mw, mh),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85 })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(map.origin_x + mw / 2, 0.001, -(map.origin_y + mh / 2));
  scene.add(plane);
  mapMesh.obj = plane;
  mapMesh.tex = tex;
}
