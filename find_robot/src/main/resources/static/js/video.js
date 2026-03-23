// ── 摄像头 ────────────────────────────────────────────────
let camQuality = 25, camWidth = 320, camHeight = 240;

function setQuality(q, w, h) {
  camQuality = q; camWidth = w; camHeight = h;
  document.getElementById('qualitySlider').value = q;
  document.getElementById('qualityVal').textContent = q;
  ['low', 'mid', 'high'].forEach(k => document.getElementById('q-' + k).classList.remove('btn-primary'));
  if (q === 25) document.getElementById('q-low').classList.add('btn-primary');
  else if (q === 50) document.getElementById('q-mid').classList.add('btn-primary');
  else document.getElementById('q-high').classList.add('btn-primary');
  if (document.getElementById('camImg').style.display !== 'none') connectCamera();
}

function connectCamera() {
  const img = document.getElementById('camImg');
  const dot = document.getElementById('camDot');
  document.getElementById('camPlaceholder').style.display = 'none';
  document.getElementById('camError').style.display = 'none';
  dot.style.background = 'var(--warning)';
  dot.style.animation = 'pulse 2s infinite';
  document.getElementById('camStatus').textContent = '连接中...';
  img.onerror = () => {
    img.style.display = 'none';
    document.getElementById('camError').style.display = 'block';
    document.getElementById('camErrorMsg').textContent = '无法连接，请确认 Jetson 已启动 web_video_server';
    dot.style.background = 'var(--danger)';
    dot.style.animation = 'none';
    document.getElementById('camStatus').textContent = '连接失败';
    document.getElementById('camConnBtn').style.display = 'block';
    document.getElementById('camDiscBtn').style.display = 'none';
  };
  img.onload = null;
  img.src = CAM_STREAM + '&width=' + camWidth + '&height=' + camHeight + '&quality=' + document.getElementById('qualitySlider').value;
  img.style.display = 'block';
  document.getElementById('camConnBtn').style.display = 'none';
  document.getElementById('camDiscBtn').style.display = 'block';
  setTimeout(() => {
    if (img.naturalWidth > 0) {
      dot.style.background = 'var(--success)';
      dot.style.animation = 'none';
      document.getElementById('camStatus').textContent = '直播中';
    } else if (document.getElementById('camStatus').textContent === '连接中...') {
      dot.style.background = 'var(--warning)';
    }
  }, 3000);
}

function disconnectCamera() {
  const img = document.getElementById('camImg');
  img.src = ''; img.style.display = 'none';
  document.getElementById('camPlaceholder').style.display = 'block';
  document.getElementById('camDot').style.background = 'var(--text-muted)';
  document.getElementById('camDot').style.animation = 'none';
  document.getElementById('camStatus').textContent = '未连接';
  document.getElementById('camConnBtn').style.display = 'block';
  document.getElementById('camDiscBtn').style.display = 'none';
}

function takeSnapshot() {
  const img = document.getElementById('camImg');
  if (!img.src || img.style.display === 'none') { toast('请先连接摄像头', 'warning'); return; }
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || camWidth;
  canvas.height = img.naturalHeight || camHeight;
  canvas.getContext('2d').drawImage(img, 0, 0);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/jpeg');
  a.download = 'snapshot_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.jpg';
  a.click();
  toast('截图已保存', 'success');
}

// ── 人脸识别 & 训练 ───────────────────────────────────────
let faceSSE = null;
const faceHistoryList = [];
const MAX_HISTORY = 20;
let faceOverlayTimer = null;

function initFaceSSE() {
  if (faceSSE) return;
  faceSSE = new EventSource(BASE + '/face/events');
  faceSSE.addEventListener('connected', () => console.log('face SSE connected'));
  faceSSE.addEventListener('face', e => {
    try {
      const d = JSON.parse(e.data);
      if (d.type === 'face') { showFaceOverlay(d); addFaceHistory(d); }
      else if (d.type === 'train') handleTrainEvent(d);
      else if (d.type === 'node_status') updateFaceNodeStatus(d.status);
    } catch (_) {}
  });
  faceSSE.onerror = () => {
    document.getElementById('faceDot').style.background = 'var(--danger)';
    document.getElementById('faceStatus').textContent = '识别: 连接断开';
  };
}

async function startFace() {
  try {
    initFaceSSE();
    const res = await fetch(BASE + '/face/start', { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      document.getElementById('faceStartBtn').style.display = 'none';
      document.getElementById('faceStopBtn').style.display = 'block';
      document.getElementById('faceDot').style.background = 'var(--warning)';
      document.getElementById('faceDot').style.animation = 'pulse 2s infinite';
      document.getElementById('faceStatus').textContent = '识别: 启动中...';
      toast('人脸识别已启动', 'success');
    } else {
      toast(d.message || '启动失败', 'error');
    }
  } catch (e) {
    toast('启动失败: ' + e.message, 'error');
  }
}

async function stopFace() {
  try {
    await fetch(BASE + '/face/stop', { method: 'POST' });
  } catch (_) {}
  document.getElementById('faceStartBtn').style.display = 'block';
  document.getElementById('faceStopBtn').style.display = 'none';
  document.getElementById('faceDot').style.background = 'var(--text-muted)';
  document.getElementById('faceDot').style.animation = 'none';
  document.getElementById('faceStatus').textContent = '识别: 已停止';
  document.getElementById('faceOverlay').innerHTML = '';
  toast('识别已停止', 'info');
}

function updateFaceNodeStatus(status) {
  const dot = document.getElementById('faceDot');
  if (status === 'running') {
    dot.style.background = 'var(--success)';
    dot.style.animation = 'pulse 2s infinite';
    document.getElementById('faceStatus').textContent = '识别: 运行中';
  } else if (status === 'stopped') {
    dot.style.background = 'var(--text-muted)';
    dot.style.animation = 'none';
    document.getElementById('faceStatus').textContent = '识别: 已停止';
  }
}

function showFaceOverlay(d) {
  const overlay = document.getElementById('faceOverlay');
  const color = d.known ? 'var(--success)' : 'var(--warning)';
  const icon = d.known ? '✅' : '❓';
  overlay.innerHTML = `<div style="background:rgba(0,0,0,.75);border:1px solid ${color};border-radius:6px;padding:8px 14px;font-size:13px;color:${color};backdrop-filter:blur(4px)">
    ${icon} <b>${d.name}</b><span style="color:var(--text-muted);font-size:11px;margin-left:8px">${d.confidence.toFixed(1)}%</span></div>`;
  clearTimeout(faceOverlayTimer);
  faceOverlayTimer = setTimeout(() => { overlay.innerHTML = ''; }, 3000);
}

function addFaceHistory(d) {
  faceHistoryList.unshift(d);
  if (faceHistoryList.length > MAX_HISTORY) faceHistoryList.pop();
  const el = document.getElementById('faceHistory');
  el.innerHTML = faceHistoryList.map(r => {
    const color = r.known ? 'var(--success)' : 'var(--warning)';
    const time = new Date(r.timestamp).toLocaleTimeString();
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:var(--bg-dark);border-radius:4px;font-size:12px">
      <span style="color:${color}">${r.known ? '✅' : '❓'} ${r.name}</span>
      <span style="color:var(--text-muted)">${r.confidence.toFixed(1)}% · ${time}</span></div>`;
  }).join('');
}

// ── 训练 ──────────────────────────────────────────────────
function showTrainDialog() {
  document.getElementById('trainModal').style.display = 'flex';
  document.getElementById('trainNameInput').value = '';
  setTimeout(() => document.getElementById('trainNameInput').focus(), 100);
}

function closeTrainModal() {
  document.getElementById('trainModal').style.display = 'none';
}

async function confirmTrain() {
  const name = document.getElementById('trainNameInput').value.trim();
  if (!name) { toast('请输入姓名', 'warning'); return; }
  closeTrainModal();
  try {
    initFaceSSE();
    const res = await fetch(BASE + '/face/train/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const d = await res.json();
    if (d.success) {
      document.getElementById('trainStartBtn').style.display = 'none';
      document.getElementById('trainStopBtn').style.display = 'block';
      document.getElementById('trainProgress').style.display = 'block';
      document.getElementById('trainProgressText').textContent = '0/30';
      document.getElementById('trainProgressBar').style.width = '0%';
      toast('开始采集 ' + name + ' 的人脸', 'success');
    } else {
      toast(d.message || '启动失败', 'error');
    }
  } catch (e) {
    toast('启动失败: ' + e.message, 'error');
  }
}

async function stopTrain() {
  await fetch(BASE + '/face/train/stop', { method: 'POST' });
  resetTrainUI();
  toast('训练已中止', 'info');
}

function resetTrainUI() {
  document.getElementById('trainStartBtn').style.display = 'block';
  document.getElementById('trainStopBtn').style.display = 'none';
  document.getElementById('trainProgress').style.display = 'none';
}

function handleTrainEvent(d) {
  if (d.status === 'progress') {
    const parts = (d.detail || '0/30').split('/');
    const cur = parseInt(parts[0]) || 0;
    const total = parseInt(parts[1]) || 30;
    document.getElementById('trainProgressText').textContent = d.detail;
    document.getElementById('trainProgressBar').style.width = Math.round(cur / total * 100) + '%';
  } else if (d.status === 'done') {
    resetTrainUI();
    toast('✅ ' + d.name + ' 训练完成！', 'success');
  } else if (d.status === 'error') {
    resetTrainUI();
    toast('训练出错: ' + d.detail, 'error');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('trainModal').style.display === 'flex') confirmTrain();
  if (e.key === 'Escape') closeTrainModal();
});
