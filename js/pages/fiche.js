// ── Page Fiche Bien ─────────────────────────────
const PageFiche = {
  bien: null,
  viewer3DState: null,

  async render(id) {
    const el = document.getElementById('page-fiche');
    el.innerHTML = `<div class="page-with-nav container section"><div class="skeleton" style="height:500px;border-radius:16px"></div></div>`;
    try {
      this.bien = await API.getBien(id);
      if (App.user) API.logVisite(id).catch(() => {});
      this._render();
    } catch (e) {
      el.innerHTML = `<div class="page-with-nav container section">${UI.empty('🏠', 'Bien introuvable', e.message, 'Retour catalogue', "App.goPage('catalogue')")}</div>`;
    }
  },

  _render() {
    const b = this.bien;
    const isFav = App.favIds.includes(b.id);
    const photos360 = b.photos_360 || [];
    const rooms = ['Salon','Chambre','Cuisine','Salle de bain','Terrasse'];
    const el = document.getElementById('page-fiche');
    el.innerHTML = `
    <div class="page-with-nav">
    <div class="container" style="padding-top:24px;padding-bottom:60px">
      <nav class="breadcrumb">
        <a onclick="App.goPage('home')">Accueil</a><span>/</span>
        <a onclick="App.goPage('catalogue')">Catalogue</a><span>/</span>
        <span>${b.titre}</span>
      </nav>
      <div class="fiche-layout">
        <!-- Main -->
        <div class="fiche-main">
          <div class="fiche-header">
            <h2>${b.titre}</h2>
            <div class="fiche-meta">
              <div class="fiche-price">${UI.fmtPrice(b)}</div>
              <div class="fiche-loc">📍 ${b.quartier}, ${b.commune}</div>
              ${b.has_3d ? '<span class="pill pill-green" style="font-size:11px">● Visite 3D</span>' : ''}
            </div>
          </div>

          <!-- 3D VIEWER -->
          <div class="viewer-3d" id="viewer-wrap">
            <canvas id="fiche-canvas" class="viewer-canvas" style="width:100%;height:100%"></canvas>
            <!-- Rooms -->
            <div class="viewer-rooms">
              ${rooms.map((r,i)=>`<div class="room-btn ${i===0?'active':''}" onclick="PageFiche.switchRoom(${i},this)">${r}</div>`).join('')}
            </div>
            <!-- Controls -->
            <div class="viewer-controls">
              <button class="v-btn" onclick="Canvas3D.rotateLeft(PageFiche.viewer3DState)">←</button>
              <button class="v-btn" onclick="Canvas3D.zoomIn(PageFiche.viewer3DState)">+</button>
              <button class="v-btn" onclick="Canvas3D.toggleTop(PageFiche.viewer3DState)" title="Vue plan">⊞</button>
              <button class="v-btn" onclick="Canvas3D.zoomOut(PageFiche.viewer3DState)">−</button>
              <button class="v-btn" onclick="Canvas3D.rotateRight(PageFiche.viewer3DState)">→</button>
              <button class="v-btn" id="light-btn" onclick="PageFiche.toggleLight()" title="Lumière">☀</button>
            </div>
            <!-- Info overlay -->
            <div class="viewer-info">
              <div id="current-room" class="viewer-room-lbl">Salon</div>
              ${b.has_3d ? '<div class="viewer-live-badge"><span class="live-dot"></span> Visite 3D</div>' : ''}
            </div>
            <!-- Photos 360 count -->
            ${photos360.length > 0 ? `<div class="viewer-photo-count">📷 ${photos360.length} photo${photos360.length>1?'s':''} 360°</div>` : ''}
          </div>

          <!-- Tabs -->
          <div class="fiche-tabs">
            ${['Description','Équipements','Localisation'].map((t,i)=>`<div class="fiche-tab ${i===0?'active':''}" onclick="PageFiche.switchTab(${i},this)">${t}</div>`).join('')}
          </div>
          <div id="ftab-0" class="fiche-tab-content active">
            <p style="line-height:1.8;margin-bottom:20px">${b.description || 'Aucune description disponible.'}</p>
            <div class="specs-row">
              <div class="spec-box"><div class="spec-val">${b.surface||'—'}</div><div class="spec-lbl">m²</div></div>
              <div class="spec-box"><div class="spec-val">${b.chambres||'—'}</div><div class="spec-lbl">Chambres</div></div>
              <div class="spec-box"><div class="spec-val">${b.sdb||'—'}</div><div class="spec-lbl">Salles de bain</div></div>
              <div class="spec-box"><div class="spec-val">${b.type.charAt(0).toUpperCase()+b.type.slice(1)}</div><div class="spec-lbl">Type</div></div>
            </div>
          </div>
          <div id="ftab-1" class="fiche-tab-content hidden">
            <div class="feats-grid">${(b.equipements||[]).map(eq=>`<div class="feat-item">✓ ${eq}</div>`).join('') || '<p style="color:var(--gris-3)">Aucun équipement renseigné</p>'}</div>
          </div>
          <div id="ftab-2" class="fiche-tab-content hidden">
            <div class="map-placeholder">
              <div class="map-pin"></div>
              <div class="map-label">📍 ${b.quartier}, ${b.commune}</div>
            </div>
          </div>

          <!-- Biens similaires -->
          <div style="margin-top:36px"><h3 style="margin-bottom:20px">Biens similaires</h3><div id="similars-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px"></div></div>
        </div>

        <!-- Sidebar contact -->
        <aside class="fiche-sidebar">
          <!-- Agent card -->
          <div class="contact-card">
            <div class="agent-preview">
              <div class="agent-av" style="background:var(--terre)">${(b.agent_prenom||'A')[0]+b.agent_nom[0]}</div>
              <div>
                <div style="font-weight:700;font-size:.95rem">${b.agent_prenom||''} ${b.agent_nom}</div>
                <div style="font-size:.8rem;color:var(--gris-3)">${b.agent_agence||'Agent indépendant'}</div>
                <span class="pill pill-green" style="font-size:10px;margin-top:4px">✓ Certifié Immo3D CI</span>
              </div>
            </div>
            <!-- Contact tabs -->
            <div class="contact-tabs">
              ${['Message','Visio','Visite'].map((t,i)=>`<div class="contact-tab ${i===0?'active':''}" onclick="PageFiche.switchContact(${i},this)">${t}</div>`).join('')}
            </div>
            <div class="contact-body">
              <!-- Message -->
              <div id="ctab-0">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="contact-nom" placeholder="Aya Koné" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Téléphone / WhatsApp</label><input class="form-input" id="contact-tel" placeholder="+225 07 …" value="${App.user?.telephone||''}"></div>
                <div class="form-group mb-14"><label class="form-label">Message</label><textarea class="form-input" id="contact-msg" rows="3" placeholder="Bonjour, je suis intéressé(e) par ce bien…"></textarea></div>
                <button class="btn btn-primary" style="width:100%" onclick="PageFiche.sendMessage('message')">Envoyer →</button>
                <button class="btn" style="width:100%;margin-top:8px;background:#25D366;color:#fff;border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;gap:7px" onclick="PageFiche.sendMessage('whatsapp')">${ICO.whatsapp} WhatsApp</button>
              </div>
              <!-- Visio -->
              <div id="ctab-1" class="hidden">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="visio-nom" placeholder="Aya Koné" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Date souhaitée</label><input type="date" class="form-input" id="visio-date" min="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group mb-14"><label class="form-label">Heure</label>
                  <select class="form-input" id="visio-heure">${['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00'].map(h=>`<option>${h}</option>`).join('')}</select>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="PageFiche.sendMessage('visio')">Planifier la visio →</button>
              </div>
              <!-- Visite physique -->
              <div id="ctab-2" class="hidden">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="visite-nom" placeholder="Aya Koné" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Téléphone</label><input class="form-input" id="visite-tel" placeholder="+225 07 …"></div>
                <div class="form-group mb-14"><label class="form-label">Date souhaitée</label><input type="date" class="form-input" id="visite-date" min="${new Date().toISOString().split('T')[0]}"></div>
                <button class="btn btn-primary" style="width:100%" onclick="PageFiche.sendMessage('visite')">Demander une visite →</button>
              </div>
            </div>
            <div class="guarantees">
              <div class="gar-item">✅ Réponse sous 2h</div>
              <div class="gar-item">✅ Agent certifié</div>
              <div class="gar-item">✅ Visite 3D vérifiée</div>
            </div>
          </div>
          <!-- Save + ref -->
          <div class="fiche-actions-card">
            <button class="btn btn-outline" style="width:100%" onclick="App.toggleFav('${b.id}',this)">
              ${isFav?'♥':'♡'} ${isFav?'Sauvegardé':'Sauvegarder'}
            </button>
            <div style="margin-top:12px;font-size:.8rem;color:var(--gris-3)">Réf. ${b.id.slice(0,8).toUpperCase()} · Publié le ${UI.fmtDate(b.created_at)}</div>
            <div style="font-size:.8rem;color:var(--gris-3);margin-top:4px">👁 ${b.vues} vues</div>
          </div>
        </aside>
      </div>
    </div>
    </div>`;

    // Init 3D viewer
    setTimeout(() => {
      const canvas = document.getElementById('fiche-canvas');
      if (!canvas) return;
      const wrap = document.getElementById('viewer-wrap');
      canvas.width  = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      this.viewer3DState = Canvas3D.initViewer('fiche-canvas', { ...b, color: UI._colorFor(b.type) });
    }, 100);

    // Charger biens similaires
    API.getBiens({ type: b.type }).then(similars => {
      const grid = document.getElementById('similars-grid');
      if (!grid) return;
      const others = similars.filter(s => s.id !== b.id).slice(0, 2);
      if (!others.length) { grid.innerHTML = '<p style="grid-column:span 2;color:var(--gris-3)">Aucun bien similaire</p>'; return; }
      grid.innerHTML = others.map(s => UI.propCard(s, App.favIds)).join('');
      setTimeout(() => others.forEach(s => Canvas3D.initMini(`mini-${s.id}`, UI._colorFor(s.type))), 100);
    }).catch(() => {});
  },

  switchTab(i, el) {
    document.querySelectorAll('.fiche-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    [0,1,2].forEach(j => { const c = document.getElementById('ftab-'+j); if(c) c.classList.toggle('hidden', j!==i); c?.classList.toggle('active', j===i); });
  },

  switchContact(i, el) {
    document.querySelectorAll('.contact-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    [0,1,2].forEach(j => { const c = document.getElementById('ctab-'+j); if(c) c.classList.toggle('hidden', j!==i); });
  },

  switchRoom(i, el) {
    document.querySelectorAll('.room-btn').forEach(r => r.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('current-room').textContent = el.textContent;
    Canvas3D.switchRoom(this.viewer3DState, i);
  },

  toggleLight() {
    Canvas3D.toggleLight(this.viewer3DState);
    const btn = document.getElementById('light-btn');
    if (btn) btn.textContent = this.viewer3DState?.lightMode === 'evening' ? '🌙' : '☀';
  },

  async sendMessage(type) {
    let nom, tel, message = '', date = '', heure = '';
    if (type === 'message' || type === 'whatsapp') {
      nom = document.getElementById('contact-nom')?.value;
      tel = document.getElementById('contact-tel')?.value;
      message = document.getElementById('contact-msg')?.value;
    } else if (type === 'visio') {
      nom = document.getElementById('visio-nom')?.value;
      date = document.getElementById('visio-date')?.value;
      heure = document.getElementById('visio-heure')?.value;
      tel = App.user?.telephone || '';
      message = `Demande de visio guidée le ${date} à ${heure}`;
    } else if (type === 'visite') {
      nom = document.getElementById('visite-nom')?.value;
      tel = document.getElementById('visite-tel')?.value;
      date = document.getElementById('visite-date')?.value;
      message = `Demande de visite physique le ${date}`;
    }
    if (!nom) { UI.toast('Indiquez votre nom', 'error'); return; }
    try {
      await API.sendLead({ bien_id: this.bien.id, nom, email: App.user?.email, telephone: tel, message, type });
      const msgs = {
        message: 'Message envoyé ! L\'agent vous répond sous 2h. 📱',
        whatsapp: 'Demande WhatsApp envoyée à l\'agent.',
        visio: `Visio planifiée pour le ${date} à ${heure} ! L'agent confirmera.`,
        visite: `Visite physique demandée pour le ${date}. Confirmation par SMS.`,
      };
      UI.toast(msgs[type], 'success');
    } catch (e) { UI.toast(e.message, 'error'); }
  },
};
