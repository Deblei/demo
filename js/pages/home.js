const PageHome = {
  async render() {
    const el = document.getElementById('page-home');
    el.innerHTML = `
    <section class="hero">
      <div class="hero-canvas-bg"><canvas id="hero-canvas"></canvas></div>
      <div class="container" style="padding-top:40px;padding-bottom:80px">
        <div class="hero-grid">
          <div>
            <div class="pill pill-cyan" style="margin-bottom:20px;font-size:.78rem">🏆 Plateforme N°1 de visite 3D en Côte d'Ivoire</div>
            <h1>Visitez depuis<br>votre salon,<br><em>comme si<br>vous y étiez.</em></h1>
            <p class="hero-sub">Des visites immobilières 3D immersives pour la diaspora et les acheteurs locaux. Explorez chaque pièce depuis votre téléphone.</p>
            <div class="hero-ctas">
              <button class="btn btn-cyan btn-lg" onclick="App.goPage('catalogue')">Voir les biens 3D →</button>
              <button class="btn btn-lg" style="border:1.5px solid rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.08);backdrop-filter:blur(8px)" onclick="UI.openAuth('register')">Espace agent</button>
            </div>
            <div class="hero-stats">
              <div><div class="hero-stat-val">250+</div><div class="hero-stat-lbl">Biens en 3D</div></div>
              <div><div class="hero-stat-val">40+</div><div class="hero-stat-lbl">Agences</div></div>
              <div><div class="hero-stat-val">98%</div><div class="hero-stat-lbl">Satisfaits</div></div>
            </div>
          </div>
          <div class="hero-3d-preview" style="height:380px">
            <canvas id="hero-preview-canvas" style="width:100%;height:100%;display:block"></canvas>
            <div style="position:absolute;bottom:16px;left:16px;background:rgba(4,44,83,.9);backdrop-filter:blur(8px);border-radius:12px;padding:12px 16px;border:1px solid rgba(55,138,221,.3)">
              <div style="font-weight:700;font-size:.9rem;color:#fff">Villa Prestige — Cocody</div>
              <div style="font-size:.75rem;color:rgba(0,212,255,.8);margin-top:3px">● Visite 3D disponible</div>
            </div>
            <div style="position:absolute;top:16px;right:16px;background:rgba(0,212,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(0,212,255,.3);border-radius:8px;padding:8px 12px;color:var(--cyan);font-size:.72rem;font-weight:700">LIVE 3D</div>
          </div>
        </div>
        <!-- Search bar -->
        <div class="search-bar" style="margin-top:44px">
          <select id="hero-trans"><option value="">Tout</option><option value="vente">À vendre</option><option value="location">À louer</option></select>
          <select id="hero-type"><option value="">Tous types</option><option value="villa">Villa</option><option value="appartement">Appartement</option><option value="duplex">Duplex</option><option value="studio">Studio</option><option value="bureau">Bureau</option></select>
          <input id="hero-search" placeholder="Quartier, commune, type de bien…" onkeydown="if(event.key==='Enter')PageHome.search()">
          <button class="btn btn-cyan" onclick="PageHome.search()">🔍 Rechercher</button>
        </div>
      </div>
    </section>

    <!-- CTA cards -->
    <section class="section">
      <div class="container">
        <div class="cta-grid">
          <!-- Carte visiteur -->
          <div style="background:linear-gradient(135deg,#0A1E3D 0%,#0D2A52 100%);border:1.5px solid rgba(55,138,221,.2);border-radius:20px;padding:36px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden" onmouseenter="this.style.borderColor='rgba(55,138,221,.5)';this.style.boxShadow='0 8px 32px rgba(55,138,221,.2)';this.style.transform='translateY(-4px)'" onmouseleave="this.style.borderColor='rgba(55,138,221,.2)';this.style.boxShadow='';this.style.transform=''" onclick="App.goPage('catalogue')">
            <div style="position:absolute;top:-40px;left:-40px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(55,138,221,.1) 0%,transparent 70%)"></div>
            <div style="width:56px;height:56px;background:rgba(55,138,221,.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:18px;border:1px solid rgba(55,138,221,.3)">🏠</div>
            <h3 style="color:#fff;margin-bottom:10px">Je cherche un bien</h3>
            <p style="color:rgba(255,255,255,.65);font-size:.9rem;margin-bottom:24px">Explorez des centaines de biens en visite 3D immersive. Filtrez, comparez, contactez l'agent en direct.</p>
            <button class="btn btn-primary">Voir le catalogue →</button>
          </div>
          <!-- Carte agent -->
          <div style="background:linear-gradient(135deg,var(--bleu-1) 0%,var(--bleu-2) 100%);border-radius:20px;padding:36px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px rgba(4,44,83,.35)'" onmouseleave="this.style.transform='';this.style.boxShadow=''" onclick="${App.user?.role==='agent'?'App.goPage(\'dashboard-agent\')':'UI.openAuth(\'register\')'}">
            <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,.1) 0%,transparent 70%)"></div>
            <div style="width:56px;height:56px;background:rgba(55,138,221,.2);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:18px;border:1px solid rgba(55,138,221,.3)">📋</div>
            <h3 style="color:#fff;margin-bottom:10px">Je suis agent / propriétaire</h3>
            <p style="color:rgba(255,255,255,.65);font-size:.9rem;margin-bottom:24px">Publiez vos biens avec scan 3D, gérez vos leads et suivez vos statistiques en temps réel.</p>
            <button class="btn btn-cyan">Espace agent →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Biens vedettes -->
    <section class="section section-alt">
      <div class="container">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px;flex-wrap:wrap;gap:16px">
          <div>
            <div class="eyebrow">Sélection du moment</div>
            <h2 style="margin-top:6px">Biens en vedette</h2>
            <p style="margin-top:6px">Avec visite 3D immersive disponible</p>
          </div>
          <button class="btn btn-outline" onclick="App.goPage('catalogue')">Voir tout →</button>
        </div>
        <div class="prop-grid" id="featured-grid">
          ${[1,2,3].map(()=>`<div class="skeleton" style="height:340px;border-radius:16px"></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Comment ça marche -->
    <section class="section">
      <div class="container">
        <div class="section-header">
          <div class="eyebrow">Comment ça marche</div>
          <h2 style="margin-top:8px">Simple, rapide, immersif</h2>
          <p>De la recherche à la signature en quelques clics</p>
        </div>
        <div class="hiw-grid">
          ${[
            {icon:'🔍',n:'1',t:'Recherchez',p:'Filtrez par quartier, budget et type. Chaque bien a une visite 3D interactive.'},
            {icon:'🥽',n:'2',t:'Visitez en 3D',p:'Naviguez pièce par pièce depuis votre téléphone ou ordinateur, comme si vous y étiez réellement.'},
            {icon:'🤝',n:'3',t:'Contactez & concluez',p:'Échangez avec l\'agent, planifiez une visio ou une visite physique directement depuis la fiche.'},
          ].map(s=>`
          <div class="hiw-card">
            <div class="hiw-num">${s.n}</div>
            <div class="hiw-icon">${s.icon}</div>
            <h4 style="margin-bottom:8px">${s.t}</h4>
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
          <h2 style="margin-top:8px">Ils nous font confiance</h2>
        </div>
        <div class="testi-grid">
          ${[
            {n:'Aminata K.',r:'Diaspora — Paris',bg:'linear-gradient(135deg,#185FA5,#378ADD)',t:'J\'ai acheté mon appartement au Plateau sans même venir en Côte d\'Ivoire. La visite 3D était tellement réelle !'},
            {n:'Koffi Adjoumani',r:'Agent — AGEMA Immobilier',bg:'linear-gradient(135deg,#0C447C,#185FA5)',t:'Depuis Immo3D CI, nos biens se vendent 2× plus vite. Les clients arrivent déjà convaincus.'},
            {n:'Fatou Diallo',r:'Acheteuse — Abidjan',bg:'linear-gradient(135deg,#042C53,#0C447C)',t:'Enfin une plateforme qui comprend le marché ivoirien. Simple, belle, et vraiment utile.'},
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
          <div style="position:relative;z-index:1">
            <div class="eyebrow" style="background:rgba(0,212,255,.15);color:var(--cyan);border:1px solid rgba(0,212,255,.2)">Pour les agents & agences</div>
            <h2 style="margin-top:12px">Publiez avec visite 3D,<br>touchez la diaspora</h2>
            <p style="margin-top:12px">1,5 million d'Ivoiriens à l'étranger cherchent à investir à distance. Donnez-leur une expérience immersive.</p>
            <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
              <div class="pill" style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.15)">Starter · 50k FCFA/mois</div>
              <div class="pill" style="background:rgba(0,212,255,.15);color:var(--cyan);border:1px solid rgba(0,212,255,.25)">Pro · 100k FCFA/mois</div>
              <div class="pill" style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.15)">Premium · 150k FCFA/mois</div>
            </div>
          </div>
          <button class="btn btn-cyan btn-lg" style="position:relative;z-index:1;flex-shrink:0" onclick="UI.openAuth('register')">Commencer gratuitement →</button>
        </div>
      </div>
    </section>`;

    setTimeout(() => {
      Canvas3D.initMini('hero-canvas', '#042C53');
      const heroCanvas = document.getElementById('hero-preview-canvas');
      if (heroCanvas) {
        heroCanvas.width = heroCanvas.parentElement.clientWidth;
        heroCanvas.height = heroCanvas.parentElement.clientHeight;
        Canvas3D.initViewer('hero-preview-canvas', {type:'villa',color:'#042C53'});
      }
    }, 50);

    try {
      const biens = await API.getBiens({ sort: 'recent' });
      const grid = document.getElementById('featured-grid');
      const top = biens.filter(b => b.has_3d).slice(0, 3);
      if (!top.length) {
        grid.innerHTML = `<div style="grid-column:span 3" class="empty-state"><div class="empty-icon">🏠</div><p>Aucun bien disponible.</p></div>`;
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
