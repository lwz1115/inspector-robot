// ── API 模块 ──────────────────────────────────────────────
const API = {
  BASE: 'http://localhost:8080/api',

  async get(path) {
    const res = await fetch(this.BASE + path, {
      headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(this.BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  getRobotData()          { return this.get('/robot-data'); },
  setDestination(payload) { return this.post('/destination/set', payload); },
  login(u, p)             { return this.post('/auth/login', { username: u, password: p }); },
  logout()                { return this.post('/auth/logout', {}); }
};
