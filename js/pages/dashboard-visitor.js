// ── Dashboard Visiteur ─────────────────────────
const PageDashVisitor = {
  section: 'favoris',

  async render() {
    if (!App.user) { UI.openAuth(); return; }
    if (App.user.role === 'agent') { App.goPage('dashboard-agent'); return; }
    const el = document.getElementById('page-dashboard-visitor');
    el.innerHTML = `
    <div class="dashboard-layout page-with-nav">
      <aside class="dash-sidebar">
        <div class="dash-user">
          <div class="dash-avatar">${App.user.prenom[0]+App.user.nom[0]}</div>
          <div class="dash-name">${App.user.prenom} ${App.user.nom}</div>
          <div class="dash-role">Visiteur</div>
        </div>
        <nav class="dash-nav">
          ${[
            ['favoris','❤️','Mes favoris'],
            ['historique','🕐','Historique 3D'],
            ['alertes','🔔','Mes alertes'],
            ['profil','👤','Mon profil'],
          ].map(([k,i,l])=>`<div class="dash-nav-item ${this.section===k?'active':''}" onclick="PageDashVisitor.switchSection('${k}')">${i} ${l}</div>`).join('')}
          <div class="dash-nav-item" onclick="App.goPage('catalogue')">🔍 Chercher un bien</div>
          <div class="dash-nav-item danger" onclick="App.logout()">${ICO.logout} Déconnexion</div>
        </nav>
      </aside>
      <main class="dash-main" id="visitor-main">
        <div class="skeleton" style="height:200px;border-radius:16px"></div>
      </main>
    </div>`;
    await this._loadSection();
  },

  async switchSection(s) {
    this.section = s;
    document.querySelectorAll('.dash-nav-item').forEach(el => el.classList.toggle('active', el.textContent.includes(s==='favoris'?'favoris':s==='historique'?'Historique':s==='alertes'?'alertes':'profil')));
    await this._loadSection();
  },

  async _loadSection() {
    const main = document.getElementById('visitor-main');
    if (!main) return;
    main.innerHTML = '<div class="skeleton" style="height:300px;border-radius:16px"></div>';
    try {
      if (this.section === 'favoris')    await this._renderFavoris(main);
      if (this.section === 'historique') await this._renderHistorique(main);
      if (this.section === 'alertes')    await this._renderAlertes(main);
      if (this.section === 'profil')     this._renderProfil(main);
    } catch (e) { main.innerHTML = `<div class="empty-state">${e.message}</div>`; }
  },

  async _renderFavoris(main) {
    const favs = await API.getFavoris();
    App.favIds = favs.map(b => b.id);
    main.innerHTML = `
    <div class="dash-header"><h3>❤️ Mes favoris</h3><p>${favs.length} bien${favs.length!==1?'s':''} sauvegardé${favs.length!==1?'s':''}</p></div>
    ${favs.length ? `<div class="fav-grid">${favs.map(b=>UI.propCard(b,App.favIds)).join('')}</div>` : UI.empty('❤️','Aucun favori','Parcourez le catalogue et sauvegardez vos coups de cœur.','Explorer','App.goPage(\'catalogue\')')}`;
    setTimeout(() => favs.forEach(b => Canvas3D.initMini(`mini-${b.id}`, UI._colorFor(b.type))), 100);
  },

  async _renderHistorique(main) {
    const hist = await API.getHistorique();
    main.innerHTML = `
    <div class="dash-header"><h3>🕐 Historique des visites 3D</h3><p>${hist.length} visite${hist.length!==1?'s':''}</p></div>
    <div class="dash-section">
      ${hist.length ? hist.map(h=>`
      <div class="lead-card">
        <div class="lead-avatar" style="background:${UI._colorFor(h.type)};color:#fff">${h.titre[0]}</div>
        <div class="lead-info">
          <div class="lead-name">${h.titre}</div>
          <div class="lead-detail">📍 ${h.quartier} · ${UI.fmtDate(h.created_at)}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="App.goPage('fiche','${h.bien_id}')">Revoir →</button>
      </div>`).join('') : '<p style="text-align:center;color:var(--gris-3);padding:24px">Aucune visite pour l\'instant</p>'}
    </div>`;
  },

  async _renderAlertes(main) {
    const alertes = await API.getAlertes();
    main.innerHTML = `
    <div class="dash-header" style="display:flex;align-items:flex-start;justify-content:space-between">
      <div><h3>🔔 Mes alertes</h3><p>Recevez un email quand un bien correspond à vos critères</p></div>
      <button class="btn btn-primary btn-sm" onclick="PageDashVisitor.newAlerte()">+ Nouvelle alerte</button>
    </div>
    <div class="dash-section">
      ${alertes.length ? alertes.map(a=>`
      <div class="alert-row">
        <div>
          <div style="font-weight:600;font-size:.9rem">${a.label}</div>
          <div style="font-size:.78rem;color:var(--gris-3)">Créée le ${UI.fmtDate(a.created_at)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <label class="toggle"><input type="checkbox" ${a.actif?'checked':''} onchange="PageDashVisitor.toggleAlerte('${a.id}',this)"><span class="toggle-slider"></span></label>
          <button class="btn btn-outline btn-sm" style="color:var(--rouge);border-color:var(--rouge)" onclick="PageDashVisitor.deleteAlerte('${a.id}')">×</button>
        </div>
      </div>`).join('') : '<p style="text-align:center;color:var(--gris-3);padding:24px">Aucune alerte créée</p>'}
    </div>
    <!-- Nouvelle alerte -->
    <div id="new-alerte-form" class="hidden dash-section" style="margin-top:16px">
      <h4 style="margin-bottom:16px">Nouvelle alerte</h4>
      <div class="form-grid-2">
        <div class="form-group mb-14"><label class="form-label">Label</label><input class="form-input" id="alerte-label" placeholder="Ex : Villas Cocody -100M"></div>
        <div class="form-group mb-14"><label class="form-label">Type</label>
          <select class="form-input" id="alerte-type"><option value="">Tout type</option>${['villa','appartement','duplex','studio','bureau'].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div class="form-group mb-14"><label class="form-label">Transaction</label>
          <select class="form-input" id="alerte-trans"><option value="">Vente & location</option><option value="vente">Vente</option><option value="location">Location</option></select></div>
        <div class="form-group mb-14"><label class="form-label">Quartier</label>
          <select class="form-input" id="alerte-q"><option value="">Tout</option>${['Cocody','Plateau','Marcory','Bingerville','Angré','2 Plateaux'].map(q=>`<option>${q}</option>`).join('')}</select></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="PageDashVisitor.saveAlerte()">Créer l'alerte</button>
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('new-alerte-form').classList.add('hidden')">Annuler</button>
    </div>`;
  },

  newAlerte() { document.getElementById('new-alerte-form')?.classList.remove('hidden'); },

  async saveAlerte() {
    const label = document.getElementById('alerte-label').value.trim();
    const type  = document.getElementById('alerte-type').value;
    const trans = document.getElementById('alerte-trans').value;
    const q     = document.getElementById('alerte-q').value;
    if (!label) { UI.toast('Donnez un nom à votre alerte', 'error'); return; }
    await API.createAlerte({ label, criteres: { type, transaction: trans, quartier: q } });
    UI.toast('Alerte créée !', 'success');
    this.switchSection('alertes');
  },

  async toggleAlerte(id, el) {
    await API.toggleAlerte(id).catch(e => { UI.toast(e.message,'error'); el.checked = !el.checked; });
  },

  async deleteAlerte(id) {
    if (!UI.confirm('Supprimer cette alerte ?')) return;
    await API.deleteAlerte(id);
    UI.toast('Alerte supprimée');
    this.switchSection('alertes');
  },

  _renderProfil(main) {
    const u = App.user;
    main.innerHTML = `
    <div class="dash-header"><h3>👤 Mon profil</h3></div>
    <div class="dash-section" style="max-width:480px">
      <div class="form-grid-2">
        <div class="form-group mb-14"><label class="form-label">Prénom</label><input class="form-input" id="p-prenom" value="${u.prenom||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Nom</label><input class="form-input" id="p-nom" value="${u.nom||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Email</label><input class="form-input" value="${u.email}" disabled style="background:var(--gris-1)"></div>
        <div class="form-group mb-14"><label class="form-label">Téléphone</label><input class="form-input" id="p-tel" value="${u.telephone||''}" placeholder="+225 07 …"></div>
      </div>
      <button class="btn btn-primary" onclick="PageDashVisitor.saveProfile()">Enregistrer</button>
      <hr style="margin:24px 0;border:none;border-top:1px solid var(--gris-1)">
      <h4 style="margin-bottom:14px">Changer le mot de passe</h4>
      <div class="form-group mb-14"><label class="form-label">Mot de passe actuel</label><input type="password" class="form-input" id="p-pwd-cur" placeholder="••••••••"></div>
      <div class="form-group mb-14"><label class="form-label">Nouveau mot de passe</label><input type="password" class="form-input" id="p-pwd-new" placeholder="•••••• (min 6 car.)"></div>
      <button class="btn btn-outline btn-sm" onclick="PageDashVisitor.changePassword()">Mettre à jour</button>
    </div>`;
  },

  async saveProfile() {
    const prenom = document.getElementById('p-prenom').value.trim();
    const nom    = document.getElementById('p-nom').value.trim();
    const tel    = document.getElementById('p-tel').value.trim();
    UI.loading(true, 'Enregistrement…');
    try {
      await API.updateProfile({ prenom, nom, telephone: tel, agence: App.user.agence });
      App.user = { ...App.user, prenom, nom, telephone: tel };
      App.renderNavbar();
      UI.loading(false); UI.toast('Profil mis à jour !', 'success');
    } catch (e) { UI.loading(false); UI.toast(e.message, 'error'); }
  },

  async changePassword() {
    const current = document.getElementById('p-pwd-cur').value;
    const nouveau = document.getElementById('p-pwd-new').value;
    if (!current || !nouveau) { UI.toast('Remplissez les deux champs', 'error'); return; }
    UI.loading(true, 'Mise à jour…');
    try {
      await API.changePassword(current, nouveau);
      UI.loading(false); UI.toast('Mot de passe mis à jour !', 'success');
      document.getElementById('p-pwd-cur').value = '';
      document.getElementById('p-pwd-new').value = '';
    } catch (e) { UI.loading(false); UI.toast(e.message, 'error'); }
  },
};
