const PageHome = {
  async render() {
    const el = document.getElementById('page-home');
    el.innerHTML = `
    <section class="hero">
      <div class="hero-canvas-bg"><canvas id="hero-canvas"></canvas></div>
      <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;padding-top:40px;padding-bottom:80px">
        <div class="hero-content">
          <div class="pill pill-gold" style="margin-bottom:18px">🏆 Plateforme N°1 de visite 3D en Côte d'Ivoire</div>
          <h1>Visitez depuis<br>votre salon,<br><em>comme si vous y étiez.</em></h1>
          <p class="hero-sub">Des visites immobilières 3D immersives pour la diaspora et les acheteurs locaux. Explorez chaque pièce depuis votre téléphone.</p>
          <div class="hero-ctas">
            <button class="btn btn-gold btn-lg" onclick="App.goPage('catalogue')">Voir les biens 3D →</button>
            <button class="btn btn-outline btn-lg" style="border-color:rgba(255,255,255,.4);color:#fff" onclick="UI.openAuth('register')">Espace agent</button>
          </div>
          <div class="hero-stats">
            <div><div class="hero-stat-val">250+</div><div class="hero-stat-lbl">Biens en 3D</div></div>
            <div><div class="hero-stat-val">40+</div><div class="hero-stat-lbl">Agences</div></div>
            <div><div class="hero-stat-val">98%</div><div class="hero-stat-lbl">Clients satisfaits</div></div>
          </div>
        </div>
        <div class="hero-3d-preview" style="height:360px;background:rgba(255,255,255,.05);border-radius:20px;border:1px solid rgba(255,255,255,.1);overflow:hidden;position:relative">
          <canvas id="hero-preview-canvas" style="width:100%;height:100%;display:block"></canvas>
          <div style="position:absolute;bottom:16px;left:16px;background:rgba(13,26,20,.85);backdrop-filter:blur(8px);border-radius:10px;padding:10px 14px;color:#fff">
            <div style="font-weight:700;font-size:.88rem">Villa Prestige — Cocody</div>
            <div style="font-size:.75rem;color:rgba(255,255,255,.6);margin-top:2px">● Visite 3D disponible</div>
          </div>
        </div>
      </div>
      <!-- Search bar -->
      <div style="background:rgba(0,0,0,.2);border-top:1px solid rgba(255,255,255,.08);padding:20px 0">
        <div class="container">
          <div class="search-bar">
            <select id="hero-trans"><option value="">Tout</option><option value="vente">À vendre</option><option value="location">À louer</option></select>
            <select id="hero-type"><option value="">Tous types</option><option value="villa">Villa</option><option value="appartement">Appartement</option><option value="duplex">Duplex</option><option value="studio">Studio</option><option value="bureau">Bureau</option></select>
            <input id="hero-search" placeholder="Quartier, commune…" onkeydown="if(event.key==='Enter')PageHome.search()">
            <button class="btn btn-gold" onclick="PageHome.search()">🔍 Rechercher</button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA cards -->
    <section class="section">
      <div class="container">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
          <div style="background:var(--creme);border:1.5px solid var(--gris-6);border-radius:20px;padding:32px;cursor:pointer;transition:all .2s" onmouseenter="this.style.boxShadow='0 8px 32px rgba(28,58,46,.12)'" onmouseleave="this.style.boxShadow=''" onclick="App.goPage('catalogue')">
            <div style="font-size:2.5rem;margin-bottom:12px">🏠</div>
            <h3 style="margin-bottom:8px">Je cherche un bien</h3>
            <p style="font-size:.9rem;margin-bottom:20px">Explorez des centaines de biens en visite 3D immersive. Filtrez, comparez, contactez l'agent.</p>
            <button class="btn btn-primary">Voir le catalogue →</button>
          </div>
          <div style="background:var(--vert);border-radius:20px;padding:32px;cursor:pointer;transition:all .2s" onmouseenter="this.style.filter='brightness(1.1)'" onmouseleave="this.style.filter=''" onclick="${App.user?.role==='agent'?'App.goPage(\'dashboard-agent\')':'UI.openAuth(\'register\')'}">
            <div style="font-size:2.5rem;margin-bottom:12px">📋</div>
            <h3 style="color:#fff;margin-bottom:8px">Je suis agent / propriétaire</h3>
            <p style="color:rgba(255,255,255,.7);font-size:.9rem;margin-bottom:20px">Publiez vos biens avec scan 3D, gérez vos leads et suivez vos stats en temps réel.</p>
            <button class="btn btn-gold">Espace agent →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Biens vedettes -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header" style="display:flex;align-items:flex-end;justify-content:space-between;text-align:left">
          <div>
            <div class="eyebrow">Sélection</div>
            <h2>Biens en vedette</h2>
            <p>Avec visite 3D immersive</p>
          </div>
          <button class="btn btn-outline" onclick="App.goPage('catalogue')">Voir tout →</button>
        </div>
        <div class="prop-grid" id="featured-grid">
          ${[1,2,3].map(()=>`<div class="skeleton" style="height:320px;border-radius:16px"></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Comment ça marche -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="eyebrow">Comment ça marche</div>
          <h2>Simple, rapide, immersif</h2>
          <p>De la recherche à la signature en quelques clics</p>
        </div>
        <div class="hiw-grid">
          ${[
            {icon:'🔍',n:'1',t:'Recherchez',p:'Filtrez par quartier, budget et type. Chaque bien a une visite 3D.'},
            {icon:'🥽',n:'2',t:'Visitez en 3D',p:'Naviguez pièce par pièce depuis votre téléphone ou ordinateur, comme si vous y étiez.'},
            {icon:'🤝',n:'3',t:'Contactez & concluez',p:'Échangez avec l\'agent, planifiez une visio ou une visite physique directement depuis la plateforme.'},
          ].map(s=>`
          <div class="hiw-card">
            <div class="hiw-num">${s.n}</div>
            <div class="hiw-icon">${s.icon}</div>
            <h4>${s.t}</h4>
            <p style="font-size:.87rem">${s.p}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Témoignages -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <div class="eyebrow">Avis clients</div>
          <h2>Ils nous font confiance</h2>
        </div>
        <div class="testi-grid">
          ${[
            {n:'Aminata K.',r:'Diaspora — Paris',bg:'#1565C0',t:'J\'ai acheté mon appartement au Plateau sans même venir en Côte d\'Ivoire. La visite 3D était tellement réelle !'},
            {n:'Koffi Adjoumani',r:'Agent — AGEMA Immobilier',bg:'#2E7D32',t:'Depuis Immo3D CI, nos biens se vendent 2× plus vite. Les clients arrivent déjà convaincus de leur choix.'},
            {n:'Fatou Diallo',r:'Acheteuse — Abidjan',bg:'#E65100',t:'Enfin une plateforme qui comprend le marché ivoirien. Simple, belle, et vraiment utile pour comparer.'},
          ].map(t=>`
          <div class="testi-card">
            <div class="testi-stars">⭐⭐⭐⭐⭐</div>
            <p class="testi-text">"${t.t}"</p>
            <div class="testi-author">
              <div class="testi-avatar" style="background:${t.bg}">${t.n[0]}</div>
              <div><div class="testi-name">${t.n}</div><div class="testi-from">${t.r}</div></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Banner agent -->
    <section class="section">
      <div class="container">
        <div class="agent-cta">
          <div>
            <div class="pill pill-gold" style="margin-bottom:14px">Pour les agents & agences</div>
            <h2>Publiez avec visite 3D,<br>touchez la diaspora</h2>
            <p style="margin-top:10px">1,5 million d'Ivoiriens à l'étranger cherchent à investir à distance. Donnez-leur une expérience immersive.</p>
            <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
              <div class="pill pill-gold">Starter · 50k FCFA/mois</div>
              <div class="pill pill-gold">Pro · 100k FCFA/mois</div>
              <div class="pill pill-gold">Premium · 150k FCFA/mois</div>
            </div>
          </div>
          <button class="btn btn-gold btn-lg" onclick="UI.openAuth('register')">Commencer gratuitement →</button>
        </div>
      </div>
    </section>`;

    setTimeout(() => {
      Canvas3D.initMini('hero-canvas', '#1C3A2E');
      Canvas3D.initMini('hero-preview-canvas', '#1C3A2E');
    }, 50);

    try {
      const biens = await API.getBiens({ sort: 'recent' });
      const grid = document.getElementById('featured-grid');
      const top = biens.filter(b => b.has_3d).slice(0, 3);
      if (!top.length) {
        grid.innerHTML = `<div style="grid-column:span 3" class="empty-state"><div class="empty-icon">🏠</div><p>Aucun bien disponible pour le moment.</p></div>`;
        return;
      }
      grid.innerHTML = top.map(b => UI.propCard(b, App.favIds)).join('');
      setTimeout(() => top.forEach(b => Canvas3D.initMini(`mini-${b.id}`, UI._colorFor(b.type))), 100);
    } catch {}
  },

  search() {
    const q = document.getElementById('hero-search').value;
    const trans = document.getElementById('hero-trans').value;
    const type = document.getElementById('hero-type').value;
    PageCatalogue._initFilters = { search: q, transaction: trans, type };
    App.goPage('catalogue');
  },
};
