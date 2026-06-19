// ── Page Scan 3D — Upload photos 360° → Visite immersive IA ──
const PageScan = {
  bien: null,
  files: [],
  mode: 'upload', // 'upload' | 'pro'
  uploadProgress: 0,
  processingInterval: null,

  async render(bienId) {
    if (!App.user || App.user.role !== 'agent') {
      UI.toast('Accès réservé aux agents', 'error');
      App.goPage('home');
      return;
    }
    const el = document.getElementById('page-scan');
    el.innerHTML = `<div class="scan-page"><div class="scan-hero"><div class="container"><div class="pill pill-gold" style="margin-bottom:12px">⬟ Intelligence Artificielle</div><h1>Créez votre visite 3D</h1><p>Uploadez vos photos 360°. Notre IA génère une visite immersive en quelques secondes.</p></div></div><div class="container" style="padding:40px 0 80px" id="scan-body"><div class="skeleton" style="height:300px;border-radius:16px"></div></div></div>`;

    // Charger le bien si ID fourni
    if (bienId) {
      try {
        this.bien = await API.getBien(bienId);
      } catch {
        this.bien = null;
      }
    } else {
      // Charger les biens de l'agent pour choisir
      await this._renderBienPicker();
      return;
    }

    this._renderMain();
  },

  async _renderBienPicker() {
    const body = document.getElementById('scan-body');
    try {
      const biens = await API.getAgentBiens();
      const actifs = biens.filter(b => b.statut !== 'supprime');
      if (!actifs.length) {
        body.innerHTML = `<div class="empty-state"><div class="empty-icon">🏠</div><h4>Aucun bien publié</h4><p>Publiez d'abord un bien pour y ajouter une visite 3D.</p><br><button class="btn btn-primary" onclick="App.goPage('publish')">Publier un bien</button></div>`;
        return;
      }
      body.innerHTML = `
        <h3 style="margin-bottom:20px">Choisissez le bien à scanner</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
          ${actifs.map(b => `
            <div onclick="PageScan.bien=null;App.goPage('scan','${b.id}')" style="background:var(--blanc);border:1.5px solid var(--gris-5);border-radius:16px;padding:20px;cursor:pointer;transition:all .2s" onmouseenter="this.style.borderColor='var(--vert)';this.style.boxShadow='0 4px 16px rgba(28,58,46,.12)'" onmouseleave="this.style.borderColor='var(--gris-5)';this.style.boxShadow=''">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
                <h4 style="font-size:.95rem;line-height:1.3">${b.titre}</h4>
                ${b.has_3d ? '<span class="pill pill-green" style="font-size:10px;flex-shrink:0">3D ✓</span>' : ''}
              </div>
              <p style="font-size:.8rem;color:var(--gris-3);margin-bottom:12px">📍 ${b.quartier} · ${UI.fmtPrice(b)}</p>
              ${b.has_3d
                ? '<button class="btn btn-outline btn-sm" style="width:100%">🔄 Améliorer le scan</button>'
                : '<button class="btn btn-primary btn-sm" style="width:100%">📷 Ajouter un scan 3D</button>'}
            </div>`).join('')}
        </div>`;
    } catch (e) {
      body.innerHTML = `<div class="empty-state"><p>Erreur : ${e.message}</p></div>`;
    }
  },

  _renderMain() {
    const b = this.bien;
    const body = document.getElementById('scan-body');
    const scanStatus = b?.scan_status || 'none';

    // Si scan en cours → afficher le polling
    if (scanStatus === 'processing') {
      this._renderProcessing();
      App.startScanPoll(b.id, s => {
        if (s.scan_status === 'done') this._renderSuccess();
      });
      return;
    }

    // Si scan terminé → afficher résultat
    if (b?.has_3d && scanStatus === 'done') {
      this._renderSuccess();
      return;
    }

    body.innerHTML = `
      ${b ? `
      <div style="background:var(--blanc);border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid var(--gris-6);display:flex;align-items:center;gap:16px">
        <div style="font-size:1.6rem">🏠</div>
        <div>
          <div style="font-weight:700;font-size:.95rem">${b.titre}</div>
          <div style="font-size:.8rem;color:var(--gris-3)">📍 ${b.quartier}, ${b.commune} · ${UI.fmtPrice(b)}</div>
        </div>
        <a onclick="App.goPage('scan')" style="margin-left:auto;font-size:.8rem;color:var(--gris-3);cursor:pointer">Changer →</a>
      </div>` : ''}

      <!-- Mode tabs -->
      <div class="scan-mode-tabs">
        <div class="scan-tab active" id="stab-upload" onclick="PageScan.setMode('upload')">
          <div class="scan-tab-icon">📷</div>
          <div class="scan-tab-title">Upload photos 360°</div>
          <div class="scan-tab-desc">Uploadez vos photos, l'IA génère la visite</div>
        </div>
        <div class="scan-tab" id="stab-pro" onclick="PageScan.setMode('pro')">
          <div class="scan-tab-icon">👨‍💼</div>
          <div class="scan-tab-title">Scan professionnel</div>
          <div class="scan-tab-desc">Notre équipe se déplace avec un équipement pro</div>
        </div>
      </div>

      <!-- Upload mode -->
      <div id="mode-upload">
        <div class="alert-info">
          <strong>Comment ça marche :</strong> Uploadez 8 à 30 photos prises dans chaque pièce. Notre IA analyse les angles, les espaces et la luminosité pour générer une visite 3D immersive complète.
        </div>
        
        <!-- Dropzone -->
        <div class="photo-dropzone" id="dropzone" onclick="document.getElementById('scan-input').click()" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="PageScan.handleDrop(event)">
          <input type="file" id="scan-input" multiple accept="image/*,.jpg,.jpeg,.png" style="display:none" onchange="PageScan.handleFiles(this.files)">
          <div class="dz-icon">📸</div>
          <div class="dz-title">Glissez vos photos ici</div>
          <div class="dz-sub">ou cliquez pour sélectionner · JPG, PNG · Max 30MB par photo</div>
          <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
            <span class="pill pill-gray">💡 Photos avec bonne lumière</span>
            <span class="pill pill-gray">📐 Angles à 360° de chaque pièce</span>
            <span class="pill pill-gray">🚪 Minimum 8 photos</span>
          </div>
        </div>

        <!-- Prévisualisation -->
        <div id="photo-preview-grid" class="photo-preview-grid"></div>
        
        <!-- Info tips -->
        <div id="scan-tips" style="margin-top:20px">
          <h4 style="margin-bottom:14px">📖 Conseils pour un scan optimal</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${[
              {i:'💡', t:'Lumière naturelle', d:'Photographiez en journée, ouvrez toutes les fenêtres'},
              {i:'📐', t:'Angles complets', d:'3 à 5 photos par pièce : entrée, coins et centre'},
              {i:'🚶', t:'Déplacez-vous', d:'Photographiez depuis différentes positions dans chaque pièce'},
              {i:'🔍', t:'Détails importants', d:'Capturez cuisine, SDB, extérieur et détails spéciaux'},
            ].map(c=>`
            <div style="display:flex;gap:12px;padding:14px;background:var(--blanc);border-radius:10px;border:1px solid var(--gris-6)">
              <span style="font-size:1.4rem;flex-shrink:0">${c.i}</span>
              <div><div style="font-weight:700;font-size:.85rem;margin-bottom:2px">${c.t}</div><div style="font-size:.78rem;color:var(--gris-3)">${c.d}</div></div>
            </div>`).join('')}
          </div>
        </div>
        
        <!-- Bouton upload -->
        <div id="upload-btn-wrap" style="display:none;margin-top:24px">
          <div style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:.85rem;font-weight:600" id="upload-count">0 photo(s) sélectionnée(s)</span>
              <span style="font-size:.85rem;color:var(--gris-3)" id="upload-status">Prêt</span>
            </div>
            <div class="progress-bar-wrap"><div class="progress-bar" id="upload-progress" style="width:0%"></div></div>
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="PageScan.startUpload()" id="upload-btn">
            🚀 Générer ma visite 3D avec l'IA →
          </button>
        </div>
      </div>

      <!-- Pro mode -->
      <div id="mode-pro" style="display:none">
        <div class="scan-info-box">
          <div style="display:flex;gap:14px;align-items:flex-start">
            <span style="font-size:2rem">🎯</span>
            <div>
              <div style="font-weight:700;margin-bottom:4px">Scan professionnel Immo3D CI</div>
              <p style="font-size:.88rem;color:var(--gris-2)">Notre équipe se déplace avec un équipement de scan 3D Matterport professionnel. Résultat : une visite immersive de qualité commerciale en 24-48h.</p>
            </div>
          </div>
        </div>
        
        <div class="scan-cta-grid">
          ${[
            {i:'⚡',t:'Résultat sous 24h',d:'Scan le matin → visite 3D disponible le soir même'},
            {i:'📐',t:'Précision millimétrique',d:'Plans 2D automatiques inclus avec chaque scan'},
            {i:'🌍',t:'Compatible diaspora',d:'Lien partageable, visible depuis n\'importe où dans le monde'},
            {i:'🎨',t:'Retouche virtuelle',d:'Option home staging virtuel pour valoriser votre bien'},
          ].map(c=>`
          <div class="scan-cta-card">
            <div class="scan-cta-icon">${c.i}</div>
            <div class="scan-cta-title">${c.t}</div>
            <div class="scan-cta-desc">${c.d}</div>
          </div>`).join('')}
        </div>
        
        <!-- Tarifs -->
        <div style="background:var(--blanc);border-radius:16px;padding:24px;border:1px solid var(--gris-6);margin-bottom:24px">
          <h4 style="margin-bottom:16px">Tarifs scan professionnel</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
            ${[
              {t:'Studio / Appart',p:'75 000',u:'≤ 80m²'},
              {t:'Villa / Duplex',p:'120 000',u:'80-250m²'},
              {t:'Grande villa',p:'180 000',u:'250m²+'},
            ].map(p=>`
            <div style="text-align:center;padding:16px;border:1.5px solid var(--gris-5);border-radius:12px">
              <div style="font-weight:700;font-size:.85rem;margin-bottom:4px">${p.t}</div>
              <div style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:800;color:var(--vert)">${p.p}</div>
              <div style="font-size:.7rem;color:var(--gris-3)">FCFA · ${p.u}</div>
            </div>`).join('')}
          </div>
        </div>
        
        <!-- Formulaire demande -->
        <h4 style="margin-bottom:16px">Demander un scan professionnel</h4>
        <div style="background:var(--blanc);border-radius:16px;padding:24px;border:1px solid var(--gris-6)">
          <div class="form-grid-2 mb-14">
            <div class="form-group"><label class="form-label">Votre nom</label><input class="form-input" id="pro-nom" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}" placeholder="Adjoua Kouamé"></div>
            <div class="form-group"><label class="form-label">Téléphone / WhatsApp</label><input class="form-input" id="pro-tel" placeholder="+225 07 …" value="${App.user?.telephone||''}"></div>
          </div>
          <div class="form-group mb-14"><label class="form-label">Adresse précise du bien</label><input class="form-input" id="pro-adresse" placeholder="Rue des Jardins, Cocody, Abidjan" value="${b?.adresse||''}"></div>
          <div class="form-group mb-14"><label class="form-label">Vos disponibilités</label>
            <select class="form-input" id="pro-dispo">
              <option value="">Choisir un créneau…</option>
              <option>Cette semaine (lun-ven, 8h-17h)</option>
              <option>La semaine prochaine</option>
              <option>Samedi matin</option>
              <option>Flexible — me contacter</option>
            </select>
          </div>
          <div class="form-group mb-20"><label class="form-label">Informations complémentaires</label><textarea class="form-input" id="pro-note" rows="3" placeholder="Surface approximative, accès, gardien, code portail…"></textarea></div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="PageScan.sendProRequest()">
            📅 Demander un devis gratuit →
          </button>
          <p style="text-align:center;font-size:.78rem;color:var(--gris-3);margin-top:10px">Notre équipe vous rappelle sous 2h pour confirmer le créneau</p>
        </div>
      </div>`;

    // Rétablir l'état des fichiers si déjà sélectionnés
    if (this.files.length) this._renderPreviews();
  },

  setMode(mode) {
    this.mode = mode;
    document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('stab-' + mode).classList.add('active');
    document.getElementById('mode-upload').style.display = mode === 'upload' ? 'block' : 'none';
    document.getElementById('mode-pro').style.display = mode === 'pro' ? 'block' : 'none';
  },

  handleDrop(e) {
    e.preventDefault();
    document.getElementById('dropzone').classList.remove('drag-over');
    this.handleFiles(e.dataTransfer.files);
  },

  handleFiles(fileList) {
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    this.files = [...this.files, ...newFiles].slice(0, 30); // max 30 photos
    this._renderPreviews();
  },

  _renderPreviews() {
    const grid = document.getElementById('photo-preview-grid');
    const btnWrap = document.getElementById('upload-btn-wrap');
    const count = document.getElementById('upload-count');
    if (!grid) return;

    grid.innerHTML = this.files.map((f, i) => {
      const url = URL.createObjectURL(f);
      return `<div class="photo-preview-item">
        <img src="${url}" alt="Photo ${i+1}">
        <button class="photo-remove" onclick="PageScan.removePhoto(${i},event)">✕</button>
      </div>`;
    }).join('');

    if (count) count.textContent = `${this.files.length} photo(s) sélectionnée(s)`;
    if (btnWrap) btnWrap.style.display = this.files.length >= 1 ? 'block' : 'none';

    // Masquer les tips si on a des photos
    const tips = document.getElementById('scan-tips');
    if (tips) tips.style.display = this.files.length > 0 ? 'none' : 'block';
  },

  removePhoto(i, e) {
    e?.stopPropagation();
    this.files.splice(i, 1);
    this._renderPreviews();
  },

  async startUpload() {
    if (!this.bien) { UI.toast('Aucun bien sélectionné', 'error'); return; }
    if (this.files.length < 1) { UI.toast('Sélectionnez au moins 1 photo', 'error'); return; }

    const btn = document.getElementById('upload-btn');
    const statusEl = document.getElementById('upload-status');
    const progressBar = document.getElementById('upload-progress');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

    try {
      // Simulation de progression upload
      let prog = 0;
      const progInterval = setInterval(() => {
        prog = Math.min(prog + Math.random() * 15, 90);
        if (progressBar) progressBar.style.width = prog + '%';
        if (statusEl) {
          if (prog < 30) statusEl.textContent = 'Envoi des photos…';
          else if (prog < 60) statusEl.textContent = 'Compression et analyse…';
          else statusEl.textContent = 'Traitement IA…';
        }
      }, 300);

      const fd = new FormData();
      this.files.forEach(f => fd.append('photos360', f));
      
      const res = await API.uploadScan360(this.bien.id, fd);
      
      clearInterval(progInterval);
      if (progressBar) progressBar.style.width = '100%';
      if (statusEl) statusEl.textContent = 'Upload terminé !';

      setTimeout(() => {
        this._renderProcessing();
        // Polling du statut de traitement
        App.startScanPoll(this.bien.id, status => {
          if (status.scan_status === 'done') {
            this.bien.has_3d = 1;
            this.bien.scan_status = 'done';
            this._renderSuccess();
          }
        });
      }, 800);

    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = '🚀 Générer ma visite 3D avec l\'IA →'; }
      UI.toast('Erreur upload : ' + e.message, 'error');
    }
  },

  _renderProcessing() {
    const body = document.getElementById('scan-body');
    const steps = [
      { icon: '📤', label: 'Photos reçues et vérifiées', done: true },
      { icon: '🔍', label: 'Détection des pièces et espaces', done: false, active: true },
      { icon: '📐', label: 'Reconstruction géométrique 3D', done: false },
      { icon: '🎨', label: 'Application des textures et matériaux', done: false },
      { icon: '💡', label: 'Calcul de la lumière et des ombres', done: false },
      { icon: '🔗', label: 'Génération des hotspots de navigation', done: false },
      { icon: '✅', label: 'Visite 3D prête', done: false },
    ];

    body.innerHTML = `
      ${this.bien ? `<div style="background:var(--blanc);border-radius:12px;padding:14px 20px;margin-bottom:24px;border:1px solid var(--gris-6);display:flex;align-items:center;gap:14px"><span style="font-size:1.4rem">🏠</span><div style="font-weight:700;font-size:.9rem">${this.bien.titre}</div></div>` : ''}
      <div class="scan-processing-ui">
        <div style="margin-bottom:24px">
          <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;margin-bottom:6px">🤖 L'IA génère votre visite 3D…</div>
          <p style="color:rgba(255,255,255,.7);font-size:.9rem">Environ 15-30 secondes. Ne fermez pas cette page.</p>
        </div>
        <!-- Anneau de progression animé -->
        <div style="margin:24px auto;width:100px;height:100px;position:relative">
          <svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg)">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="6"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--or)" stroke-width="6" stroke-linecap="round" stroke-dasharray="264" id="processing-ring" style="animation:scan-rotate 2s linear infinite"/>
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.8rem">🧠</div>
        </div>
        <div id="ai-steps" class="ai-steps-list">
          ${steps.map(s=>`
          <div class="ai-step ${s.done?'done':s.active?'active':''}">
            <span class="ai-step-icon">${s.done ? '✅' : s.active ? '⏳' : '⬜'}</span>
            <span>${s.label}</span>
            ${s.active ? '<span style="margin-left:auto;font-size:.75rem;opacity:.7">En cours…</span>' : ''}
          </div>`).join('')}
        </div>
      </div>`;

    // Animer les étapes une par une
    let currentStep = 1;
    const stepsEls = () => document.querySelectorAll('#ai-steps .ai-step');
    
    this.processingInterval = setInterval(() => {
      const els = stepsEls();
      if (!els.length || currentStep >= steps.length) {
        clearInterval(this.processingInterval);
        return;
      }
      // Marquer l'étape précédente comme done
      if (els[currentStep - 1]) {
        els[currentStep - 1].classList.remove('active');
        els[currentStep - 1].classList.add('done');
        els[currentStep - 1].querySelector('.ai-step-icon').textContent = '✅';
        const span = els[currentStep - 1].querySelector('span:last-child');
        if (span && span.textContent.includes('En cours')) span.remove();
      }
      // Activer l'étape suivante
      if (els[currentStep]) {
        els[currentStep].classList.add('active');
        els[currentStep].querySelector('.ai-step-icon').textContent = '⏳';
        const sp = document.createElement('span');
        sp.style.cssText = 'margin-left:auto;font-size:.75rem;opacity:.7';
        sp.textContent = 'En cours…';
        els[currentStep].appendChild(sp);
      }
      currentStep++;
    }, 2200);
  },

  _renderSuccess() {
    if (this.processingInterval) clearInterval(this.processingInterval);
    const body = document.getElementById('scan-body');
    
    body.innerHTML = `
      ${this.bien ? `<div style="background:var(--blanc);border-radius:12px;padding:14px 20px;margin-bottom:24px;border:1px solid var(--gris-6);display:flex;align-items:center;gap:14px"><span style="font-size:1.4rem">🏠</span><div style="font-weight:700;font-size:.9rem">${this.bien.titre}</div><span class="pill pill-green" style="margin-left:auto">● 3D Active</span></div>` : ''}
      <div class="alert-success">
        ✅ <strong>Visite 3D générée avec succès !</strong> Votre bien est maintenant visible en immersif par vos clients.
      </div>
      <!-- Aperçu du viewer 3D -->
      <div class="scan-result-preview" style="margin-bottom:24px">
        <div style="background:var(--vert);padding:14px 20px;display:flex;align-items:center;justify-content:space-between">
          <span style="color:#fff;font-weight:700;font-size:.9rem">● Aperçu de votre visite 3D</span>
          <span class="pill pill-gold" style="font-size:10px">IA Immo3D CI</span>
        </div>
        <div style="height:360px;position:relative;overflow:hidden">
          <canvas id="success-viewer" style="width:100%;height:100%;display:block;cursor:grab"></canvas>
          <div class="viewer-rooms" style="z-index:10">
            ${['Salon','Chambre princ.','Cuisine','SDB','Extérieur'].map((r,i)=>`<button class="room-btn ${i===0?'active':''}" onclick="this.parentElement.querySelectorAll('.room-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${r}</button>`).join('')}
          </div>
          <div class="viewer-controls">
            <button class="v-btn" title="Tourner gauche" onclick="Canvas3D.rotateLeft(PageScan._viewerState)">←</button>
            <button class="v-btn" title="Zoom +" onclick="Canvas3D.zoomIn(PageScan._viewerState)">+</button>
            <button class="v-btn" title="Vue plan" onclick="Canvas3D.toggleTop(PageScan._viewerState)">⊞</button>
            <button class="v-btn" title="Zoom -" onclick="Canvas3D.zoomOut(PageScan._viewerState)">−</button>
            <button class="v-btn" title="Tourner droite" onclick="Canvas3D.rotateRight(PageScan._viewerState)">→</button>
          </div>
          <div style="position:absolute;top:14px;left:14px;background:rgba(13,26,20,.85);backdrop-filter:blur(8px);border-radius:8px;padding:8px 12px;color:#fff;font-size:.78rem">
            <div style="font-weight:700">Naviguez librement</div>
            <div style="opacity:.7">Glissez pour pivoter · Molette pour zoomer</div>
          </div>
        </div>
      </div>
      <!-- Stats de la visite -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px">
        ${[
          {i:'📷',v:`${this.files.length || '12'}`,l:'Photos analysées'},
          {i:'🏠',v:'5',l:'Pièces détectées'},
          {i:'📐',v:`${this.bien?.surface||'—'} m²`,l:'Surface modélisée'},
        ].map(s=>`
        <div style="background:var(--blanc);border-radius:12px;padding:20px;text-align:center;border:1px solid var(--gris-6)">
          <div style="font-size:1.6rem;margin-bottom:6px">${s.i}</div>
          <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:var(--vert)">${s.v}</div>
          <div style="font-size:.75rem;color:var(--gris-3)">${s.l}</div>
        </div>`).join('')}
      </div>
      <!-- Actions -->
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary btn-lg" onclick="App.goPage('fiche','${this.bien?.id}')">👁 Voir la fiche complète →</button>
        <button class="btn btn-outline" onclick="PageScan.files=[];PageScan._renderMain()">🔄 Re-scanner ce bien</button>
        <button class="btn btn-ghost" onclick="App.goPage('dashboard-agent')">← Retour au tableau de bord</button>
      </div>`;

    // Lancer le viewer 3D de démonstration
    setTimeout(() => {
      const canvas = document.getElementById('success-viewer');
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      this._viewerState = Canvas3D.initViewer('success-viewer', {
        ...this.bien,
        color: UI._colorFor(this.bien?.type || 'villa')
      });
    }, 100);
  },

  async sendProRequest() {
    const nom = document.getElementById('pro-nom')?.value;
    const tel = document.getElementById('pro-tel')?.value;
    const adresse = document.getElementById('pro-adresse')?.value;
    const dispo = document.getElementById('pro-dispo')?.value;
    const note = document.getElementById('pro-note')?.value;

    if (!nom || !tel || !adresse || !dispo) {
      UI.toast('Remplissez tous les champs obligatoires', 'error');
      return;
    }
    UI.loading(true, 'Envoi de votre demande…');
    try {
      if (this.bien) {
        await API.requestScanPro(this.bien.id, { telephone: tel, adresse_precise: adresse, disponibilite: dispo });
      }
      UI.loading(false);
      const body = document.getElementById('scan-body');
      body.innerHTML = `
        <div style="text-align:center;padding:60px 24px">
          <div style="font-size:4rem;margin-bottom:16px">✅</div>
          <h2 style="margin-bottom:10px">Demande envoyée !</h2>
          <p style="color:var(--gris-3);max-width:400px;margin:0 auto 24px">Notre équipe de scan va vous contacter au <strong>${tel}</strong> dans les 2 heures pour confirmer le créneau.</p>
          <div style="background:var(--creme);border-radius:16px;padding:24px;max-width:400px;margin:0 auto 24px;text-align:left">
            <h4 style="margin-bottom:12px">Récapitulatif</h4>
            <div style="font-size:.88rem;display:flex;flex-direction:column;gap:6px">
              <div>👤 <strong>${nom}</strong></div>
              <div>📍 ${adresse}</div>
              <div>📅 ${dispo}</div>
              ${note ? `<div>💬 ${note}</div>` : ''}
            </div>
          </div>
          <button class="btn btn-primary" onclick="App.goPage('dashboard-agent')">← Retour au tableau de bord</button>
        </div>`;
    } catch (e) {
      UI.loading(false);
      UI.toast('Erreur : ' + e.message, 'error');
    }
  },
};
