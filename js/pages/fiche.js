const PageFiche = {
  bien: null,
  viewerState: null,
  currentRoom: 0,
  rooms: ['Entrée','Salon','Cuisine','Chambre','Salle de bain','Terrasse'],

  async render(id) {
    const el = document.getElementById('page-fiche');
    el.innerHTML = `<div class="page-with-nav container section"><div class="skeleton" style="height:500px;border-radius:16px"></div></div>`;
    try {
      this.bien = await API.getBien(id);
      if (App.user) API.logVisite(id).catch(()=>{});
      this._render();
    } catch(e) {
      el.innerHTML = `<div class="page-with-nav container section">${UI.empty('🏠','Bien introuvable',e.message,'Retour catalogue',"App.goPage('catalogue')")}</div>`;
    }
  },

  _render() {
    const b = this.bien;
    const isFav = App.favIds.includes(b.id);
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
            <h2 style="margin-bottom:8px">${b.titre}</h2>
            <div class="fiche-meta">
              <div class="fiche-price">${UI.fmtPrice(b)}</div>
              <div class="fiche-loc">📍 ${b.quartier}, ${b.commune || 'Abidjan'}</div>
              ${b.has_3d ? '<span class="pill pill-cyan">● Visite 3D</span>' : ''}
            </div>
          </div>

          <!-- VIEWER 3D IMMERSIF -->
          <div id="viewer-wrap" style="position:relative;width:100%;height:480px;border-radius:16px;overflow:hidden;background:#050D1A;box-shadow:0 8px 40px rgba(4,44,83,.3)">
            <canvas id="fiche-canvas" style="width:100%;height:100%;display:block;cursor:grab"></canvas>

            <!-- Hint de navigation -->
            <div id="viewer-hint" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(4,44,83,.5);backdrop-filter:blur(4px);transition:opacity .5s;pointer-events:none">
              <div style="text-align:center;color:#fff">
                <div style="font-size:2.5rem;margin-bottom:8px">👆</div>
                <div style="font-weight:700;font-size:1rem">Glissez pour explorer</div>
                <div style="font-size:.82rem;opacity:.7;margin-top:4px">Cliquez sur les points • pour changer de pièce</div>
              </div>
            </div>

            <!-- Nom de la pièce courante -->
            <div style="position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:8px">
              <div style="background:rgba(4,44,83,.85);backdrop-filter:blur(8px);border:1px solid rgba(55,138,221,.3);border-radius:99px;padding:7px 14px;color:#fff;font-weight:700;font-size:.82rem" id="room-label">
                ${this.rooms[0]}
              </div>
              ${b.has_3d ? '<div style="background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);border-radius:99px;padding:5px 12px;color:#00D4FF;font-size:.72rem;font-weight:700;display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;border-radius:50%;background:#00D4FF;animation:pulse 1.5s infinite" id="live-dot"></span>LIVE 3D</div>' : ''}
            </div>

            <!-- Contrôles -->
            <div style="position:absolute;top:16px;right:16px;display:flex;flex-direction:column;gap:6px">
              <button class="v-btn" onclick="Canvas3D.rotateLeft(PageFiche.viewerState)" title="Rotation gauche">◀</button>
              <button class="v-btn" onclick="Canvas3D.zoomIn(PageFiche.viewerState)" title="Zoom +">+</button>
              <button class="v-btn" onclick="Canvas3D.toggleTop(PageFiche.viewerState)" title="Vue plan">⊞</button>
              <button class="v-btn" onclick="Canvas3D.zoomOut(PageFiche.viewerState)" title="Zoom -">−</button>
              <button class="v-btn" onclick="Canvas3D.rotateRight(PageFiche.viewerState)" title="Rotation droite">▶</button>
              <button class="v-btn" id="light-btn" onclick="PageFiche.toggleLight()" title="Lumière">☀️</button>
              <button class="v-btn" onclick="PageFiche.toggleFullscreen()" title="Plein écran">⛶</button>
            </div>

            <!-- Navigation pièces en bas -->
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(4,44,83,.95));padding:28px 16px 16px">
              <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none" id="rooms-bar">
                ${this.rooms.map((r,i)=>`
                <button onclick="PageFiche.switchRoom(${i})" id="room-btn-${i}" style="flex-shrink:0;padding:8px 16px;border-radius:99px;border:1.5px solid ${i===0?'rgba(0,212,255,.8)':'rgba(255,255,255,.2)'};background:${i===0?'rgba(0,212,255,.2)':'rgba(4,44,83,.6)'};color:${i===0?'#00D4FF':'rgba(255,255,255,.75)'};font-size:.8rem;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);transition:all .2s;white-space:nowrap">
                  ${r}
                </button>`).join('')}
              </div>
            </div>

            <!-- Miniplan (placeholder) -->
            <div style="position:absolute;bottom:70px;right:16px;width:80px;height:60px;background:rgba(4,44,83,.85);backdrop-filter:blur(8px);border:1px solid rgba(55,138,221,.3);border-radius:8px;overflow:hidden">
              <canvas id="miniplan-canvas" style="width:100%;height:100%"></canvas>
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:.65rem;text-align:center">Plan<br>2D</div>
            </div>
          </div>

          <!-- Tabs infos -->
          <div class="fiche-tabs">
            ${['Description','Équipements','Localisation'].map((t,i)=>`<div class="fiche-tab ${i===0?'active':''}" onclick="PageFiche.switchTab(${i},this)">${t}</div>`).join('')}
          </div>
          <div class="fiche-tab-content">
            <div id="ftab-0">
              <p style="line-height:1.85;margin-bottom:22px">${b.description || 'Aucune description disponible.'}</p>
              <div class="specs-row">
                <div class="spec-box"><div class="spec-val">${b.surface||'—'}</div><div class="spec-lbl">m²</div></div>
                <div class="spec-box"><div class="spec-val">${b.chambres||'—'}</div><div class="spec-lbl">Chambres</div></div>
                <div class="spec-box"><div class="spec-val">${b.sdb||'—'}</div><div class="spec-lbl">SDB</div></div>
                <div class="spec-box"><div class="spec-val">${b.type?.charAt(0).toUpperCase()+b.type?.slice(1)}</div><div class="spec-lbl">Type</div></div>
              </div>
            </div>
            <div id="ftab-1" class="hidden">
              <div class="feats-grid">
                ${(b.equipements||[]).length ? (b.equipements||[]).map(eq=>`<div class="feat-item">✓ ${eq}</div>`).join('') : '<p style="color:var(--gris-3)">Aucun équipement renseigné</p>'}
              </div>
            </div>
            <div id="ftab-2" class="hidden">
              <div class="map-placeholder"><div style="font-size:2rem;margin-bottom:8px">📍</div><div style="font-weight:600">${b.quartier}, ${b.commune||'Abidjan'}</div></div>
            </div>
          </div>

          <!-- Biens similaires -->
          <div style="margin-top:36px">
            <h3 style="margin-bottom:20px">Biens similaires</h3>
            <div id="similars-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px"></div>
          </div>
        </div>

        <!-- Sidebar contact -->
        <aside class="fiche-sidebar">
          <div class="contact-card">
            <div class="agent-preview">
              <div class="agent-av">${(b.agent_prenom||'A')[0]+b.agent_nom[0]}</div>
              <div>
                <div style="font-weight:700;font-size:.95rem">${b.agent_prenom||''} ${b.agent_nom}</div>
                <div style="font-size:.8rem;color:var(--gris-3)">${b.agent_agence||'Agent indépendant'}</div>
                <span class="pill pill-green" style="font-size:.68rem;margin-top:5px">✓ Certifié Immo3D CI</span>
              </div>
            </div>
            <div class="contact-tabs">
              ${['Message','Visio','Visite'].map((t,i)=>`<div class="contact-tab ${i===0?'active':''}" onclick="PageFiche.switchContact(${i},this)">${t}</div>`).join('')}
            </div>
            <div style="padding-top:4px">
              <div id="ctab-0">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="contact-nom" placeholder="Aya Koné" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Téléphone / WhatsApp</label><input class="form-input" id="contact-tel" placeholder="+225 07 …" value="${App.user?.telephone||''}"></div>
                <div class="form-group mb-16"><label class="form-label">Message</label><textarea class="form-input" id="contact-msg" rows="3" placeholder="Bonjour, je suis intéressé(e) par ce bien…"></textarea></div>
                <button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="PageFiche.sendMessage('message')">Envoyer →</button>
                <button class="btn" style="width:100%;background:#25D366;color:#fff;border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;gap:7px" onclick="PageFiche.sendMessage('whatsapp')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              </div>
              <div id="ctab-1" class="hidden">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="visio-nom" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Date souhaitée</label><input type="date" class="form-input" id="visio-date" min="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group mb-16"><label class="form-label">Heure</label>
                  <select class="form-input" id="visio-heure">${['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00'].map(h=>`<option>${h}</option>`).join('')}</select>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="PageFiche.sendMessage('visio')">Planifier la visio →</button>
              </div>
              <div id="ctab-2" class="hidden">
                <div class="form-group mb-12"><label class="form-label">Votre nom</label><input class="form-input" id="visite-nom" value="${App.user?`${App.user.prenom} ${App.user.nom}`:''}"></div>
                <div class="form-group mb-12"><label class="form-label">Téléphone</label><input class="form-input" id="visite-tel" placeholder="+225 07 …"></div>
                <div class="form-group mb-16"><label class="form-label">Date souhaitée</label><input type="date" class="form-input" id="visite-date" min="${new Date().toISOString().split('T')[0]}"></div>
                <button class="btn btn-primary" style="width:100%" onclick="PageFiche.sendMessage('visite')">Demander une visite →</button>
              </div>
            </div>
            <div class="guarantees">
              <div class="gar-item">✅ Réponse sous 2h</div>
              <div class="gar-item">✅ Agent certifié Immo3D CI</div>
              <div class="gar-item">✅ Visite 3D vérifiée</div>
            </div>
          </div>
          <div class="fiche-actions-card">
            <button class="btn btn-outline" style="width:100%" onclick="App.toggleFav('${b.id}',this)">
              ${isFav?'♥':'♡'} ${isFav?'Sauvegardé':'Sauvegarder'}
            </button>
            <div style="margin-top:12px;font-size:.78rem;color:var(--gris-3)">Réf. ${b.id.slice(0,8).toUpperCase()} · ${UI.fmtDate(b.created_at)}</div>
            <div style="font-size:.78rem;color:var(--gris-3);margin-top:4px">👁 ${b.vues} vues</div>
          </div>
        </aside>
      </div>
    </div>
    </div>`;

    // Init viewer 3D
    setTimeout(() => {
      const canvas = document.getElementById('fiche-canvas');
      const wrap = document.getElementById('viewer-wrap');
      if (!canvas || !wrap) return;
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      this.viewerState = Canvas3D.initViewer('fiche-canvas', b);

      // Masquer le hint au premier drag
      canvas.addEventListener('mousedown', () => {
        const hint = document.getElementById('viewer-hint');
        if (hint) { hint.style.opacity = '0'; setTimeout(()=>hint.style.display='none',500); }
      }, {once:true});
      canvas.addEventListener('touchstart', () => {
        const hint = document.getElementById('viewer-hint');
        if (hint) { hint.style.opacity = '0'; setTimeout(()=>hint.style.display='none',500); }
      }, {once:true});
    }, 100);

    // Biens similaires
    API.getBiens({type: b.type}).then(similars => {
      const grid = document.getElementById('similars-grid');
      if (!grid) return;
      const others = similars.filter(s=>s.id!==b.id).slice(0,2);
      if (!others.length) { grid.innerHTML='<p style="grid-column:span 2;color:var(--gris-3)">Aucun bien similaire</p>'; return; }
      grid.innerHTML = others.map(s=>UI.propCard(s,App.favIds)).join('');
      setTimeout(()=>others.forEach(s=>Canvas3D.initMini(`mini-${s.id}`,UI._colorFor(s.type))),100);
    }).catch(()=>{});
  },

  switchRoom(i) {
    this.currentRoom = i;
    Canvas3D.switchRoom(this.viewerState, i, this.rooms.length);
    // Update label
    const lbl = document.getElementById('room-label');
    if (lbl) lbl.textContent = this.rooms[i];
    // Update buttons
    this.rooms.forEach((_,j) => {
      const btn = document.getElementById(`room-btn-${j}`);
      if (!btn) return;
      const active = j===i;
      btn.style.borderColor = active ? 'rgba(0,212,255,.8)' : 'rgba(255,255,255,.2)';
      btn.style.background  = active ? 'rgba(0,212,255,.2)' : 'rgba(4,44,83,.6)';
      btn.style.color       = active ? '#00D4FF' : 'rgba(255,255,255,.75)';
    });
  },

  switchTab(i, el) {
    document.querySelectorAll('.fiche-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    [0,1,2].forEach(j => {
      const c = document.getElementById('ftab-'+j);
      if(c) c.classList.toggle('hidden', j!==i);
    });
  },

  switchContact(i, el) {
    document.querySelectorAll('.contact-tab').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    [0,1,2].forEach(j => { const c=document.getElementById('ctab-'+j); if(c) c.classList.toggle('hidden',j!==i); });
  },

  toggleLight() {
    Canvas3D.toggleLight(this.viewerState);
    const btn = document.getElementById('light-btn');
    if (btn) btn.textContent = this.viewerState?.lightMode==='evening' ? '🌙' : '☀️';
  },

  toggleFullscreen() {
    const wrap = document.getElementById('viewer-wrap');
    if (!wrap) return;
    if (!document.fullscreenElement) {
      wrap.requestFullscreen().catch(()=>{});
    } else {
      document.exitFullscreen();
    }
  },

  async sendMessage(type) {
    let nom, tel, message='';
    if (type==='message'||type==='whatsapp') {
      nom = document.getElementById('contact-nom')?.value;
      tel = document.getElementById('contact-tel')?.value;
      message = document.getElementById('contact-msg')?.value;
    } else if (type==='visio') {
      nom = document.getElementById('visio-nom')?.value;
      const date = document.getElementById('visio-date')?.value;
      const heure = document.getElementById('visio-heure')?.value;
      tel = App.user?.telephone||'';
      message = `Demande de visio guidée le ${date} à ${heure}`;
    } else if (type==='visite') {
      nom = document.getElementById('visite-nom')?.value;
      tel = document.getElementById('visite-tel')?.value;
      const date = document.getElementById('visite-date')?.value;
      message = `Demande de visite physique le ${date}`;
    }
    if (!nom) { UI.toast('Indiquez votre nom','error'); return; }
    try {
      await API.sendLead({ bien_id:this.bien.id, nom, email:App.user?.email, telephone:tel, message, type });
      const msgs = { message:'Message envoyé ! L\'agent vous répond sous 2h. 📱', whatsapp:'Demande WhatsApp envoyée.', visio:'Visio planifiée ! L\'agent confirmera par SMS.', visite:'Visite physique demandée. Confirmation par SMS.' };
      UI.toast(msgs[type]||'Envoyé !','success');
    } catch(e) { UI.toast(e.message,'error'); }
  },
};
