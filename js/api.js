// ── API Client ─────────────────────────────────
const API = {
  // En prod → URL du backend Render. En local → vide (même serveur)
  baseURL: window.location.hostname === 'deblei.github.io'
    ? 'https://immo3d-backend.onrender.com'
    : '',
  token: localStorage.getItem('immo3d_token'),

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem('immo3d_token', t);
    else localStorage.removeItem('immo3d_token');
  },

  async request(method, path, body, isFormData = false) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    const res = await fetch(this.baseURL + path, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  },

  get(path)              { return this.request('GET', path); },
  post(path, body)       { return this.request('POST', path, body); },
  put(path, body)        { return this.request('PUT', path, body); },
  del(path)              { return this.request('DELETE', path); },
  upload(path, formData) { return this.request('POST', path, formData, true); },

  // Auth
  login(email, password)       { return this.post('/api/auth/login', { email, password }); },
  register(data)               { return this.post('/api/auth/register', data); },
  me()                         { return this.get('/api/auth/me'); },
  updateProfile(data)          { return this.put('/api/auth/profile', data); },
  changePassword(current, nouveau) { return this.put('/api/auth/password', { current, nouveau }); },
  uploadAvatar(fd)             { return this.upload('/api/auth/avatar', fd); },

  // Biens
  getBiens(params = {})   {
    const q = new URLSearchParams(params).toString();
    return this.get('/api/biens' + (q ? '?' + q : ''));
  },
  getBien(id)             { return this.get(`/api/biens/${id}`); },
  createBien(data)        { return this.post('/api/biens', data); },
  updateBien(id, data)    { return this.put(`/api/biens/${id}`, data); },
  deleteBien(id)          { return this.del(`/api/biens/${id}`); },
  uploadPhotos(id, fd)    { return this.upload(`/api/biens/${id}/photos`, fd); },

  // Scan 3D
  uploadScan(id, fd)          { return this.upload(`/api/biens/${id}/scan`, fd); },
  uploadScan360(id, fd)       { return this.upload(`/api/biens/${id}/scan`, fd); },
  getScanStatus(id)           { return this.get(`/api/biens/${id}/scan/status`); },
  requestScan(id, data)       { return this.post(`/api/biens/${id}/scan/request`, data); },
  requestScanPro(id, data)    { return this.post(`/api/biens/${id}/scan/request`, data); },

  // Agent
  getMyBiens()            { return this.get('/api/agent/biens'); },
  getAgentBiens()         { return this.get('/api/agent/biens'); },
  getStats()              { return this.get('/api/agent/stats'); },
  getLeads()              { return this.get('/api/agent/leads'); },
  updateLeadStatus(id, s) { return this.put(`/api/agent/leads/${id}/statut`, { statut: s }); },

  // Leads visiteur
  sendLead(data)          { return this.post('/api/leads', data); },

  // Favoris
  getFavoris()            { return this.get('/api/favoris'); },
  toggleFavori(id)        { return this.post(`/api/favoris/${id}`); },

  // Alertes
  getAlertes()            { return this.get('/api/alertes'); },
  createAlerte(data)      { return this.post('/api/alertes', data); },
  toggleAlerte(id)        { return this.put(`/api/alertes/${id}/toggle`); },
  deleteAlerte(id)        { return this.del(`/api/alertes/${id}`); },

  // Historique
  getHistorique()         { return this.get('/api/historique'); },
  logVisite(id)           { return this.post(`/api/historique/${id}`); },
};
