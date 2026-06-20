// ── UI Helpers ─────────────────────────────────
const UI = {

  // ── Toast ──────────────────────────────────
  toast(msg, type = '') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${{success:'✓',error:'✕',gold:'★'}[type]||'ℹ'}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 400); }, 3500);
  },

  // ── Loading overlay ─────────────────────────
  loading(show, text = 'Chargement…') {
    const el = document.getElementById('loading-overlay');
    document.getElementById('loading-text').textContent = text;
    el.classList.toggle('hidden', !show);
  },

  // ── Auth Modal ──────────────────────────────
  openAuth(tab = 'login') {
    document.getElementById('auth-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
    App.renderAuthModal(tab);
  },
  closeAuth() {
    document.getElementById('auth-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  },

  // ── Format helpers ──────────────────────────
  fmtPrice(bien) {
    const n = bien.prix;
    const s = n >= 1000000
      ? (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' M'
      : (n / 1000).toFixed(0) + ' k';
    return s + ' FCFA' + (bien.type_transaction === 'location' || bien.transaction === 'location' ? '/mois' : '');
  },
  fmtDate(str) {
    if (!str) return '';
    return new Date(str).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  },
  timeAgo(str) {
    const diff = Date.now() - new Date(str).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  },
  truncate(str, n = 80) { return str?.length > n ? str.slice(0, n) + '…' : str; },

  // ── Prop Card ───────────────────────────────
  propCard(b, favIds = []) {
    const isFav = favIds.includes(b.id);
    const color = this._colorFor(b.type);
    return `
    <div class="prop-card" onclick="App.goPage('fiche', '${b.id}')">
      <div class="prop-image" style="background:linear-gradient(135deg,${color}DD,${color}66)">
        <canvas id="mini-${b.id}" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
        <div class="prop-badge-3d">${b.has_3d ? '● 3D' : '📷'}</div>
        <button class="prop-fav ${isFav?'active':''}" onclick="event.stopPropagation();App.toggleFav('${b.id}',this)">${isFav?'♥':'♡'}</button>
      </div>
      <div class="prop-info">
        <div class="prop-price">${this.fmtPrice(b)}</div>
        <div class="prop-title">${b.titre}</div>
        <div class="prop-location">📍 ${b.quartier}, ${b.commune || 'Abidjan'}</div>
        <div class="prop-features">
          ${b.surface ? `<span>📐 ${b.surface}m²</span>` : ''}
          ${b.chambres > 0 ? `<span>🛏 ${b.chambres}</span>` : ''}
          ${b.sdb > 0 ? `<span>🚿 ${b.sdb}</span>` : ''}
        </div>
      </div>
    </div>`;
  },

  _colorFor(type) {
    return {villa:'#042C53',appartement:'#0C447C',duplex:'#185FA5',studio:'#0A1628',bureau:'#1E3A5F'}[type] || '#042C53';
  },

  // ── Status pill ─────────────────────────────
  statusPill(statut) {
    const map = {
      actif: ['Actif','pill-green'],
      brouillon: ['Brouillon','pill-gray'],
      suspendu: ['Suspendu','pill-orange'],
      supprime: ['Supprimé','pill-red'],
      processing: ['Scan en cours…','pill-orange'],
      done: ['3D OK','pill-green'],
      requested: ['Scan demandé','pill-blue'],
      none: ['Pas de scan','pill-gray'],
    };
    const [label, cls] = map[statut] || [statut, 'pill-gray'];
    return `<span class="pill ${cls}">${label}</span>`;
  },

  // ── Scan status indicator ────────────────────
  scanIndicator(bien) {
    if (bien.has_3d) return `<span class="pill pill-green">● Visite 3D active</span>`;
    if (bien.scan_status === 'processing') return `<span class="pill pill-orange">⟳ Traitement 3D…</span>`;
    if (bien.scan_status === 'requested') return `<span class="pill pill-blue">📅 Scan planifié</span>`;
    return `<span class="pill pill-gray">Pas de visite 3D</span>`;
  },

  // ── Empty state ─────────────────────────────
  empty(icon, title, sub, btnLabel, btnAction) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h4>${title}</h4>
      <p>${sub}</p>
      ${btnLabel ? `<button class="btn btn-primary mt-16" onclick="${btnAction}">${btnLabel}</button>` : ''}
    </div>`;
  },

  // ── Confirm dialog ──────────────────────────
  confirm(msg) { return window.confirm(msg); },
};

// ── Icons ─────────────────────────────────────
const ICO = {
  home:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search:   `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  heart:    `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
  user:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  logout:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  plus:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  settings: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  bell:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  msg:      `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  chart:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  camera:   `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  cube:     `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  check:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:        `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  arrow_r:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  upload:   `<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>`,
  whatsapp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  map:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  eye:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  scan3d:   `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4M15 3h4a2 2 0 012 2v4M15 21h4a2 2 0 002-2v-4"/><circle cx="12" cy="12" r="3"/></svg>`,
  home2:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  people:   `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  star:     `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};
