// ── Dashboard Agent ────────────────────────────
const PageDashAgent = {
  section: 'overview',
  stats: null,

  async render() {
    if (!App.user) { UI.openAuth(); return; }
    if (App.user.role !== 'agent') { App.goPage('dashboard-visitor'); return; }
    const el = document.getElementById('page-dashboard-agent');
    el.innerHTML = `
    <div class="dashboard-layout page-with-nav">
      <aside class="dash-sidebar" style="display:flex;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;width:100%;height:auto;position:static;padding:8px 10px;gap:4px;background:var(--bleu-1)">
        ${[
          ['overview','📊','Accueil'],
          ['biens','🏠','Biens'],
          ['leads','👥','Leads'],
          ['stats','📈','Stats'],
          ['tarifs','💳','Plans'],
          ['profil','👤','Profil'],
        ].map(([k,i,l])=>`<button onclick="PageDashAgent.switchSection('${k}')" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border:none;border-radius:8px;background:${this.section===k?'rgba(55,138,221,.3)':'transparent'};color:${this.section===k?'#fff':'rgba(255,255,255,.6)'};cursor:pointer;border-bottom:2px solid ${this.section===k?'#378ADD':'transparent'};font-size:.65rem;font-weight:600;min-width:48px"><span style="font-size:1.1rem">${i}</span><span>${l}</span></button>`).join('')}
        <button onclick="App.goPage('publish')" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border:none;border-radius:8px;background:transparent;color:rgba(255,255,255,.6);cursor:pointer;font-size:.65rem;font-weight:600;min-width:48px"><span style="font-size:1.1rem">➕</span><span>Publier</span></button>
        <button onclick="App.logout()" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border:none;border-radius:8px;background:transparent;color:rgba(226,75,74,.8);cursor:pointer;font-size:.65rem;font-weight:600;min-width:48px"><span style="font-size:1.1rem">🚪</span><span>Exit</span></button>
      </aside>
      <main class="dash-main" id="agent-main">
        <div class="skeleton" style="height:300px;border-radius:16px"></div>
      </main>
    </div>`;
    await this._loadSection();
  },

  async switchSection(s) {
    this.section = s;
    document.querySelectorAll('#page-dashboard-agent .dash-nav-item').forEach(el => {
      el.classList.toggle('active',
        (s==='overview' && el.textContent.includes('Tableau')) ||
        (s==='biens' && el.textContent.includes('biens')) ||
        (s==='leads' && el.textContent.includes('Leads')) ||
        (s==='stats' && el.textContent.includes('Stat')) ||
        (s==='tarifs' && el.textContent.includes('Abonn')) ||
        (s==='profil' && el.textContent.includes('profil'))
      );
    });
    await this._loadSection();
  },

  async _loadSection() {
    const main = document.getElementById('agent-main');
    if (!main) return;
    main.innerHTML = '<div class="skeleton" style="height:300px;border-radius:16px"></div>';
    try {
      if (this.section === 'overview') await this._renderOverview(main);
      if (this.section === 'biens')    await this._renderBiens(main);
      if (this.section === 'leads')    await this._renderLeads(main);
      if (this.section === 'stats')    await this._renderStats(main);
      if (this.section === 'tarifs')   this._renderTarifs(main);
      if (this.section === 'profil')   this._renderProfil(main);
    } catch (e) { main.innerHTML = `<div class="empty-state">${e.message}</div>`; }
  },

  async _renderOverview(main) {
    const [stats, leads] = await Promise.all([API.getStats(), API.getLeads()]);
    this.stats = stats;
    main.innerHTML = `
    <div class="dash-header">
      <h3>Bonjour, ${App.user.prenom} 👋</h3>
      <p>Voici vos performances en temps réel</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Biens actifs</div><div class="kpi-value">${stats.biens_actifs}</div><div class="kpi-change" style="color:var(--gris-3)">dont ${stats.biens_3d} en 3D</div></div>
      <div class="kpi-card"><div class="kpi-label">Vues totales</div><div class="kpi-value">${stats.total_vues}</div></div>
      <div class="kpi-card"><div class="kpi-label">Leads reçus</div><div class="kpi-value">${stats.total_leads}</div><div class="kpi-change" style="color:var(--orange)">${stats.leads_new} non traités</div></div>
      <div class="kpi-card"><div class="kpi-label">Taux de contact</div><div class="kpi-value">${stats.taux_contact}%</div><div class="kpi-change" style="color:var(--gris-3)">Moy. secteur: 2.1%</div></div>
    </div>
    <!-- Quick actions -->
    <div class="quick-actions">
      <button class="qa-btn" onclick="App.goPage('publish')">${ICO.plus}<span>Nouveau bien</span></button>
      <button class="qa-btn" onclick="PageDashAgent.switchSection('leads')">${ICO.people}<span>Voir leads</span></button>
      <button class="qa-btn" onclick="PageDashAgent.switchSection('biens')">${ICO.home2}<span>Mes biens</span></button>
      <button class="qa-btn" onclick="PageDashAgent.switchSection('stats')">${ICO.chart}<span>Statistiques</span></button>
    </div>
    <!-- Derniers leads -->
    <div class="dash-section">
      <div class="dash-section-hd"><h4>Leads récents</h4><button class="btn btn-outline btn-sm" onclick="PageDashAgent.switchSection('leads')">Voir tout</button></div>
      ${leads.slice(0,4).map(l=>this._leadCard(l)).join('') || '<p style="text-align:center;padding:16px;color:var(--gris-3)">Aucun lead pour l\'instant</p>'}
    </div>`;
  },

  async _renderBiens(main) {
    const biens = await API.getMyBiens();
    main.innerHTML = `
    <div class="dash-header" style="display:flex;align-items:flex-start;justify-content:space-between">
      <div><h3>🏠 Mes biens</h3><p>${biens.length} annonce${biens.length!==1?'s':''}</p></div>
      <button class="btn btn-primary btn-sm" onclick="App.goPage('publish')">${ICO.plus} Publier</button>
    </div>
    ${biens.length ? biens.map(b=>`
    <div class="bien-row">
      <div class="bien-row-info">
        <div class="fw-600">${b.titre}</div>
        <div style="font-size:.8rem;color:var(--gris-3)">${b.quartier} · ${UI.fmtPrice(b)}</div>
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          ${UI.statusPill(b.statut)}
          ${UI.scanIndicator(b)}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:.8rem;color:var(--gris-3)">👁 ${b.vues} vues · 📞 ${b.nb_leads} leads</div>
        <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="App.goPage('fiche','${b.id}')">Voir</button>
          <button class="btn btn-outline btn-sm" onclick="App.goPage('scan','${b.id}')">${ICO.scan3d} 3D</button>
          <button class="btn btn-outline btn-sm" onclick="App.goPage('publish','${b.id}')">Modifier</button>
          <button class="btn btn-outline btn-sm" style="color:var(--rouge);border-color:var(--rouge)" onclick="PageDashAgent.deleteBien('${b.id}')">×</button>
        </div>
      </div>
    </div>`).join('') : UI.empty('🏠','Aucun bien publié','Publiez votre premier bien et activez la visite 3D.','Publier un bien',"App.goPage('publish')")}`;
  },

  async deleteBien(id) {
    if (!UI.confirm('Supprimer ce bien ? Cette action est irréversible.')) return;
    await API.deleteBien(id);
    UI.toast('Bien supprimé', 'success');
    this.switchSection('biens');
  },

  async _renderLeads(main) {
    const leads = await API.getLeads();
    main.innerHTML = `
    <div class="dash-header"><h3>👥 Leads clients</h3><p>${leads.length} lead${leads.length!==1?'s':''} reçus</p></div>
    <div class="dash-section">
      ${leads.length ? leads.map(l=>`
      <div class="lead-row">
        ${this._leadCard(l)}
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          ${['nouveau','en_cours','traite'].map(s=>`
          <button class="btn btn-outline btn-sm ${l.statut===s?'active-pill':''}" onclick="PageDashAgent.updateLead('${l.id}','${s}')">
            ${s==='nouveau'?'Nouveau':s==='en_cours'?'En cours':'Traité'}
          </button>`).join('')}
        </div>
        <div style="height:1px;background:var(--gris-1);margin:12px 0"></div>
      </div>`).join('') : '<p style="text-align:center;padding:24px;color:var(--gris-3)">Aucun lead pour l\'instant</p>'}
    </div>`;
  },

  _leadCard(l) {
    const typeIcons = { message:'💬', visio:'📹', visite:'🏠', whatsapp:'📱' };
    return `
    <div class="lead-card">
      <div class="lead-avatar">${l.visiteur_nom[0]}</div>
      <div class="lead-info">
        <div class="lead-name">${l.visiteur_nom} ${typeIcons[l.type]||'💬'}</div>
        <div class="lead-detail">${l.bien_titre || ''} · ${UI.timeAgo(l.created_at)}</div>
        ${l.message ? `<div style="font-size:.8rem;color:var(--gris-3);margin-top:2px;font-style:italic">"${UI.truncate(l.message, 60)}"</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        ${l.visiteur_tel ? `<a class="btn btn-sm" style="background:#25D366;color:#fff;border-radius:var(--r-full);display:flex;align-items:center;gap:4px" href="https://wa.me/${l.visiteur_tel.replace(/\D/g,'')}" target="_blank">${ICO.whatsapp}</a>` : ''}
        <span class="pill ${l.statut==='nouveau'?'pill-orange':l.statut==='en_cours'?'pill-blue':'pill-green'}">${l.statut?.replace('_',' ')||'nouveau'}</span>
      </div>
    </div>`;
  },

  async updateLead(id, statut) {
    await API.updateLeadStatus(id, statut);
    UI.toast('Statut mis à jour', 'success');
    this.switchSection('leads');
  },

  async _renderStats(main) {
    const stats = await API.getStats();
    const biens = await API.getMyBiens();
    const barData = biens.map(b => b.vues);
    const maxBar  = Math.max(...barData, 1);
    main.innerHTML = `
    <div class="dash-header"><h3>📈 Statistiques</h3></div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Vues totales</div><div class="kpi-value">${stats.total_vues}</div></div>
      <div class="kpi-card"><div class="kpi-label">Leads</div><div class="kpi-value">${stats.total_leads}</div></div>
      <div class="kpi-card"><div class="kpi-label">Taux de contact</div><div class="kpi-value">${stats.taux_contact}%</div></div>
      <div class="kpi-card"><div class="kpi-label">Biens en 3D</div><div class="kpi-value">${stats.biens_3d}</div></div>
    </div>
    <div class="dash-section">
      <h4 style="margin-bottom:16px">Vues par bien</h4>
      <div class="bar-chart">
        ${biens.map((b,i)=>`
        <div class="bar-col" title="${b.titre}: ${b.vues} vues">
          <div class="bar-val">${b.vues}</div>
          <div class="bar-fill" style="height:${Math.max(8,(b.vues/maxBar)*100)}%"></div>
          <div class="bar-lbl">${b.quartier.slice(0,6)}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="dash-section">
      <h4 style="margin-bottom:12px">Conseils pour améliorer vos performances</h4>
      <div class="tips-list">
        ${[
          {ok:stats.biens_3d>0,txt:'Activez la visite 3D sur tous vos biens — +3× de contacts'},
          {ok:stats.total_vues>100,txt:'Publiez plus de biens pour augmenter votre visibilité'},
          {ok:Number(stats.taux_contact)>5,txt:'Répondez aux leads en moins de 2h pour mieux convertir'},
        ].map(t=>`<div class="tip-item ${t.ok?'ok':''}">${t.ok?'✅':'💡'} ${t.txt}</div>`).join('')}
      </div>
    </div>`;
  },

  _renderTarifs(main) {
    main.innerHTML = `
    <div class="dash-header"><h3>💳 Abonnement</h3><p>Plan actuel : <strong>Starter</strong></p></div>
    <div class="tarifs-grid">
      ${[
        {name:'Starter',price:'50 000',feat:['5 biens','Photos standard','Support email'],active:true,featured:false},
        {name:'Pro',price:'100 000',feat:['20 biens','Scan 3D ×2 inclus','Support prioritaire','Stats avancées','Mise en avant diaspora'],active:false,featured:true},
        {name:'Premium',price:'150 000',feat:['Illimité','Scan 3D illimité','Manager dédié','API + intégrations','Multi-agents ×5'],active:false,featured:false},
      ].map(p=>`
      <div class="tarif-card ${p.featured?'featured':''}">
        ${p.featured?'<div class="tarif-pop">Le plus populaire</div>':''}
        <h4>${p.name}</h4>
        <div class="tarif-price">${p.price} <span>FCFA/mois</span></div>
        <div class="tarif-feats">${p.feat.map(f=>`<div>${ICO.check} ${f}</div>`).join('')}</div>
        <button class="btn ${p.featured?'btn-gold':'btn-outline'}" style="width:100%" onclick="${p.active?'UI.toast(\'Déjà votre plan actuel\',\'gold\')':'UI.toast(\'Redirection vers le paiement…\')'}">
          ${p.active?'Plan actuel ✓':'Choisir ce plan'}
        </button>
      </div>`).join('')}
    </div>
    <div class="dash-section" style="margin-top:24px">
      <h4 style="margin-bottom:12px">Service de scan 3D professionnel</h4>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        ${[
          {label:'Petit bien (< 100m²)',price:'30 000 FCFA'},
          {label:'Bien moyen (100–200m²)',price:'50 000 FCFA'},
          {label:'Grande villa (> 200m²)',price:'75 000 FCFA'},
        ].map(s=>`<div class="scan-price-card"><div class="fw-600">${s.label}</div><div class="scan-price">${s.price}</div></div>`).join('')}
      </div>
    </div>`;
  },

  _renderProfil(main) {
    const u = App.user;
    main.innerHTML = `
    <div class="dash-header"><h3>👤 Mon profil agent</h3></div>
    <div class="dash-section" style="max-width:540px">
      <div class="form-grid-2">
        <div class="form-group mb-14"><label class="form-label">Prénom</label><input class="form-input" id="ap-prenom" value="${u.prenom||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Nom</label><input class="form-input" id="ap-nom" value="${u.nom||''}"></div>
        <div class="form-group mb-14" style="grid-column:span 2"><label class="form-label">Nom de l'agence</label><input class="form-input" id="ap-agence" placeholder="Prestige Immo Abidjan" value="${u.agence||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Email</label><input class="form-input" value="${u.email}" disabled style="background:var(--gris-1)"></div>
        <div class="form-group mb-14"><label class="form-label">Téléphone WhatsApp</label><input class="form-input" id="ap-tel" value="${u.telephone||''}" placeholder="+225 07 …"></div>
      </div>
      <button class="btn btn-primary" onclick="PageDashAgent.saveProfile()">Enregistrer</button>
      <hr style="margin:24px 0;border:none;border-top:1px solid var(--gris-1)">
      <h4 style="margin-bottom:14px">Changer le mot de passe</h4>
      <div class="form-group mb-14"><label class="form-label">Mot de passe actuel</label><input type="password" class="form-input" id="ap-pwd-cur" placeholder="••••••••"></div>
      <div class="form-group mb-14"><label class="form-label">Nouveau mot de passe</label><input type="password" class="form-input" id="ap-pwd-new" placeholder="min 6 caractères"></div>
      <button class="btn btn-outline btn-sm" onclick="PageDashAgent.changePassword()">Mettre à jour</button>
    </div>`;
  },

  async saveProfile() {
    const prenom = document.getElementById('ap-prenom').value.trim();
    const nom    = document.getElementById('ap-nom').value.trim();
    const agence = document.getElementById('ap-agence').value.trim();
    const tel    = document.getElementById('ap-tel').value.trim();
    UI.loading(true, 'Enregistrement…');
    try {
      await API.updateProfile({ prenom, nom, agence, telephone: tel });
      App.user = { ...App.user, prenom, nom, agence, telephone: tel };
      App.renderNavbar();
      UI.loading(false); UI.toast('Profil mis à jour !', 'success');
    } catch (e) { UI.loading(false); UI.toast(e.message, 'error'); }
  },

  async changePassword() {
    const current = document.getElementById('ap-pwd-cur').value;
    const nouveau = document.getElementById('ap-pwd-new').value;
    if (!current || !nouveau) { UI.toast('Remplissez les deux champs', 'error'); return; }
    UI.loading(true, 'Mise à jour…');
    try {
      await API.changePassword(current, nouveau);
      UI.loading(false); UI.toast('Mot de passe mis à jour !', 'success');
    } catch (e) { UI.loading(false); UI.toast(e.message, 'error'); }
  },
};
