// ── Application Core ───────────────────────────
const App = {
  user: null,
  currentPage: 'home',
  favIds: [],
  scanPollers: {},

  // ── Init ──────────────────────────────────
  async init() {
    this.renderNavbar();
    this.renderFooter();
    this.renderAuthModal();

    // Restaurer session
    if (API.token) {
      try {
        const user = await API.me();
        this.user = user;
        if (this.user.role === 'visiteur') {
          const favs = await API.getFavoris().catch(() => []);
          this.favIds = favs.map(b => b.id);
        }
      } catch {
        API.setToken(null);
      }
    }

    this.renderNavbar();
    this.goPage('home');

    // Scroll navbar
    window.addEventListener('scroll', () => {
      const nb = document.getElementById('navbar');
      if (!nb) return;
      if (window.scrollY > 10) nb.classList.add('scrolled');
      else nb.classList.remove('scrolled');
      if (this.currentPage === 'home' && window.scrollY < 10) nb.classList.add('transparent');
      else nb.classList.remove('transparent');
    });

    // ESC → fermer modal
    document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeAuth(); });
    document.getElementById('auth-backdrop').addEventListener('click', e => {
      if (e.target === e.currentTarget) UI.closeAuth();
    });
  },

  // ── Navigation ─────────────────────────────
  async goPage(page, id) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.updateNavActive();
    this.renderNavbar();
    const nb = document.getElementById('navbar');
    if (page === 'home') nb.classList.add('transparent');
    else nb.classList.remove('transparent');
    // Rendu de la page
    try {
      if (page === 'home')               await PageHome.render();
      else if (page === 'catalogue')     await PageCatalogue.render();
      else if (page === 'fiche')         await PageFiche.render(id);
      else if (page === 'dashboard-visitor') await PageDashVisitor.render();
      else if (page === 'dashboard-agent')   await PageDashAgent.render();
      else if (page === 'publish')       await PagePublish.render(id);
      else if (page === 'scan')          await PageScan.render(id);
    } catch (e) {
      console.error('Erreur page', page, e);
      UI.toast('Erreur lors du chargement de la page', 'error');
    }
  },

  updateNavActive() {
    document.querySelectorAll('.nav-link[data-page]').forEach(l => {
      l.classList.toggle('active', l.dataset.page === this.currentPage);
    });
  },

  // ── Auth ───────────────────────────────────
  async logout() {
    API.setToken(null);
    this.user = null;
    this.favIds = [];
    this.renderNavbar();
    UI.toast('Déconnecté avec succès');
    this.goPage('home');
  },

  async toggleFav(id, btn) {
    if (!this.user) { UI.openAuth(); return; }
    try {
      const res = await API.toggleFavori(id);
      if (res.favori) {
        this.favIds.push(id);
        btn.textContent = '♥';
        btn.classList.add('active');
        UI.toast('Ajouté aux favoris ❤️', 'gold');
      } else {
        this.favIds = this.favIds.filter(f => f !== id);
        btn.textContent = '♡';
        btn.classList.remove('active');
        UI.toast('Retiré des favoris');
      }
    } catch (e) { UI.toast(e.message, 'error'); }
  },

  // ── Navbar ─────────────────────────────────
  renderNavbar() {
    const u = this.user;
    document.getElementById('navbar').innerHTML = `
    <div class="nav-inner container">
      <a class="nav-logo" onclick="App.goPage('home')">
        <div class="logo-cube">${ICO.cube}</div>
        <span>Immo3D <em>CI</em></span>
      </a>
      <nav class="nav-links">
        <a class="nav-link" data-page="home" onclick="App.goPage('home')">Accueil</a>
        <a class="nav-link" data-page="catalogue" onclick="App.goPage('catalogue')">Catalogue</a>
      </nav>
      <div class="nav-right">
        ${u ? `
          ${u.role === 'agent' ? `<button class="btn btn-primary btn-sm" onclick="App.goPage('publish')">${ICO.plus} Publier</button>` : ''}
          <div class="nav-avatar" onclick="App.toggleDropdown()" title="${u.prenom} ${u.nom}">${(u.prenom[0]+u.nom[0]).toUpperCase()}</div>
          <div class="nav-dropdown" id="nav-dropdown">
            <div class="dropdown-header">
              <div class="d-name">${u.prenom} ${u.nom}</div>
              <div class="d-email">${u.email}</div>
              ${u.role === 'agent' ? '<span class="pill pill-orange" style="margin-top:6px;font-size:10px">Agent</span>' : '<span class="pill pill-green" style="margin-top:6px;font-size:10px">Visiteur</span>'}
            </div>
            <a class="dd-item" onclick="App.goPage('${u.role==='agent'?'dashboard-agent':'dashboard-visitor'}');App.toggleDropdown()">
              ${ICO.user} Mon espace
            </a>
            ${u.role === 'agent' ? `
            <a class="dd-item" onclick="App.goPage('publish');App.toggleDropdown()">${ICO.plus} Publier un bien</a>
            ` : ''}
            <a class="dd-item" onclick="App.goPage('${u.role==='agent'?'dashboard-agent':'dashboard-visitor'}');App.toggleDropdown()">${ICO.settings} Paramètres</a>
            <a class="dd-item danger" onclick="App.logout()">${ICO.logout} Déconnexion</a>
          </div>
        ` : `
          <button class="btn btn-outline btn-sm" onclick="UI.openAuth('login')">Se connecter</button>
          <button class="btn btn-primary btn-sm" onclick="UI.openAuth('register')">Créer un compte</button>
        `}
        <button class="nav-burger" onclick="App.toggleDrawer()" id="burger">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>`;
    this.updateNavActive();
    // Close dropdown outside click
    document.removeEventListener('click', App._closeDD);
    App._closeDD = e => { if (!e.target.closest('.nav-avatar') && !e.target.closest('.nav-dropdown')) document.getElementById('nav-dropdown')?.classList.remove('open'); };
    document.addEventListener('click', App._closeDD);
  },

  toggleDropdown() { document.getElementById('nav-dropdown')?.classList.toggle('open'); },

  toggleDrawer() {
    document.getElementById('nav-drawer').classList.toggle('open');
    document.getElementById('burger')?.classList.toggle('open');
  },

  // ── Footer ─────────────────────────────────
  renderFooter() {
    document.getElementById('footer').innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">Immo3D <em>CI</em></div>
          <p>La 1ère plateforme de visite immobilière 3D en Côte d'Ivoire. Pour la diaspora et les acheteurs locaux.</p>
          <div class="socials">
            <a href="#" class="social-icon">f</a>
            <a href="#" class="social-icon">in</a>
            <a href="#" class="social-icon">${ICO.whatsapp}</a>
          </div>
        </div>
        <div>
          <h5>Plateforme</h5>
          <a onclick="App.goPage('catalogue')">Tous les biens</a>
          <a onclick="App.goPage('catalogue')">Visites 3D</a>
          <a onclick="App.user?App.goPage('dashboard-visitor'):UI.openAuth()">Mes favoris</a>
        </div>
        <div>
          <h5>Agents</h5>
          <a onclick="App.goPage('publish')">Publier un bien</a>
          <a onclick="App.user?.role==='agent'?App.goPage('dashboard-agent'):UI.openAuth('register')">Espace agent</a>
          <a href="#">Tarifs</a>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:contact@immo3d.ci">contact@immo3d.ci</a>
          <a href="#">+225 07 00 00 00 00</a>
          <a href="#">Abidjan, CI</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 Immo3D CI — Fait avec ❤️ à Abidjan</span>
        <div class="footer-links"><a href="#">CGU</a><a href="#">Confidentialité</a></div>
      </div>
    </div>`;
  },

  // ── Auth Modal ─────────────────────────────
  renderAuthModal(tab = 'login') {
    document.getElementById('auth-modal').innerHTML = `
    <div class="modal-header">
      <div>
        <h3 id="auth-title">${tab==='login'?'Bon retour !':'Créer un compte'}</h3>
        <p id="auth-sub">${tab==='login'?'Connectez-vous à votre espace':'Rejoignez Immo3D CI'}</p>
      </div>
      <button class="btn-icon" onclick="UI.closeAuth()">${ICO.x}</button>
    </div>
    <div class="modal-body">
      <div class="auth-tabs">
        <div class="auth-tab ${tab==='login'?'active':''}" onclick="App.switchAuthTab('login')">Connexion</div>
        <div class="auth-tab ${tab==='register'?'active':''}" onclick="App.switchAuthTab('register')">Inscription</div>
      </div>
      <!-- Social -->
      <div class="social-btns">
        <button class="social-btn" onclick="App.socialAuth('google')">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </button>
        <button class="social-btn" onclick="App.socialAuth('facebook')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Continuer avec Facebook
        </button>
      </div>
      <div class="auth-sep"><span>ou avec votre email</span></div>
      <!-- Login -->
      <div id="auth-login" class="${tab==='login'?'':'hidden'}">
        <div class="form-group mb-14">
          <label class="form-label">Adresse email</label>
          <input type="email" class="form-input" id="login-email" placeholder="vous@example.com" value="agent@immo3d.ci">
        </div>
        <div class="form-group mb-20">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label class="form-label" style="margin-bottom:0">Mot de passe</label>
            <a style="font-size:.8rem;color:var(--terre);cursor:pointer">Oublié ?</a>
          </div>
          <input type="password" class="form-input" id="login-pwd" placeholder="••••••••" value="demo1234">
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="App.doLogin()">Se connecter →</button>
        <p style="font-size:.75rem;color:var(--gris-3);text-align:center;margin-top:12px">Comptes démo disponibles (email pré-rempli)</p>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="document.getElementById('login-email').value='agent@immo3d.ci';document.getElementById('login-pwd').value='demo1234'">👔 Agent</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="document.getElementById('login-email').value='visiteur@immo3d.ci';document.getElementById('login-pwd').value='demo1234'">🏠 Visiteur</button>
        </div>
      </div>
      <!-- Register -->
      <div id="auth-register" class="${tab==='register'?'':'hidden'}">
        <div class="form-grid-2">
          <div class="form-group mb-14"><label class="form-label">Prénom</label><input class="form-input" id="reg-prenom" placeholder="Aya"></div>
          <div class="form-group mb-14"><label class="form-label">Nom</label><input class="form-input" id="reg-nom" placeholder="Koné"></div>
        </div>
        <div class="form-group mb-14"><label class="form-label">Email</label><input type="email" class="form-input" id="reg-email" placeholder="vous@example.com"></div>
        <div class="form-group mb-14"><label class="form-label">Téléphone</label><input class="form-input" id="reg-tel" placeholder="+225 07 00 00 00 00"></div>
        <div class="form-group mb-14"><label class="form-label">Mot de passe <span style="color:var(--gris-3);font-weight:400">(min 6 caractères)</span></label><input type="password" class="form-input" id="reg-pwd" placeholder="••••••••"></div>
        <div class="form-group mb-14">
          <label class="form-label">Je suis…</label>
          <div class="role-selector">
            <div class="role-opt active" id="role-visiteur" onclick="App.selectRole('visiteur')"><div class="r-icon">🏠</div><div class="r-name">Visiteur</div><div class="r-desc">Je cherche un bien</div></div>
            <div class="role-opt" id="role-agent" onclick="App.selectRole('agent')"><div class="r-icon">📋</div><div class="r-name">Agent</div><div class="r-desc">Je publie des biens</div></div>
          </div>
        </div>
        <div id="reg-agence-wrap" class="form-group mb-14 hidden"><label class="form-label">Nom de l'agence</label><input class="form-input" id="reg-agence" placeholder="Prestige Immo Abidjan"></div>
        <button class="btn btn-primary" style="width:100%" onclick="App.doRegister()">Créer mon compte →</button>
      </div>
    </div>`;
  },

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.textContent.trim().toLowerCase().includes(tab==='login'?'connexion':'inscrip')));
    document.getElementById('auth-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('auth-register').classList.toggle('hidden', tab !== 'register');
    document.getElementById('auth-title').textContent = tab==='login'?'Bon retour !':'Créer un compte';
  },

  _selectedRole: 'visiteur',
  selectRole(role) {
    this._selectedRole = role;
    document.getElementById('role-visiteur').classList.toggle('active', role==='visiteur');
    document.getElementById('role-agent').classList.toggle('active', role==='agent');
    document.getElementById('reg-agence-wrap').classList.toggle('hidden', role!=='agent');
  },

  async doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pwd   = document.getElementById('login-pwd').value;
    if (!email || !pwd) { UI.toast('Remplissez tous les champs', 'error'); return; }
    UI.loading(true, 'Connexion…');
    try {
      const res = await API.login(email, pwd);
      API.setToken(res.token);
      this.user = res.user;
      if (this.user.role === 'visiteur') {
        const favs = await API.getFavoris().catch(() => []);
        this.favIds = favs.map(b => b.id);
      }
      UI.closeAuth();
      this.renderNavbar();
      UI.toast(`Bienvenue, ${res.user.prenom} ! 👋`, 'success');
      this.goPage(res.user.role === 'agent' ? 'dashboard-agent' : 'dashboard-visitor');
    } catch (e) {
      UI.toast(e.message, 'error');
    } finally { UI.loading(false); }
  },

  async doRegister() {
    const prenom = document.getElementById('reg-prenom').value.trim();
    const nom    = document.getElementById('reg-nom').value.trim();
    const email  = document.getElementById('reg-email').value.trim();
    const tel    = document.getElementById('reg-tel').value.trim();
    const pwd    = document.getElementById('reg-pwd').value;
    const role   = this._selectedRole;
    const agence = document.getElementById('reg-agence')?.value.trim();
    if (!prenom || !nom || !email || !pwd) { UI.toast('Remplissez tous les champs obligatoires', 'error'); return; }
    UI.loading(true, 'Création du compte…');
    try {
      const res = await API.register({ prenom, nom, email, telephone: tel, password: pwd, role, agence });
      API.setToken(res.token);
      this.user = res.user;
      UI.closeAuth();
      this.renderNavbar();
      UI.toast(`Compte créé ! Bienvenue, ${prenom} 🎉`, 'success');
      this.goPage(role === 'agent' ? 'dashboard-agent' : 'dashboard-visitor');
    } catch (e) {
      UI.toast(e.message, 'error');
    } finally { UI.loading(false); }
  },

  async socialAuth(provider) {
    // Demo : connexion rapide avec compte visiteur
    UI.toast('Auth sociale — utilisation du compte visiteur de démo', 'gold');
    document.getElementById('login-email').value = 'visiteur@immo3d.ci';
    document.getElementById('login-pwd').value = 'demo1234';
    this.switchAuthTab('login');
  },

  // ── Polling scan 3D ─────────────────────────
  startScanPoll(bienId, callback) {
    if (this.scanPollers[bienId]) return;
    let tries = 0;
    this.scanPollers[bienId] = setInterval(async () => {
      tries++;
      try {
        const status = await API.getScanStatus(bienId);
        callback(status);
        if (status.scan_status === 'done' || tries > 30) {
          clearInterval(this.scanPollers[bienId]);
          delete this.scanPollers[bienId];
        }
      } catch { clearInterval(this.scanPollers[bienId]); delete this.scanPollers[bienId]; }
    }, 2000);
  },
};

// ── Start ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => App.init());
