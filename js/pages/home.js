const PageHome = {
  async render() {
    const el = document.getElementById('page-home');
    el.innerHTML = `
    <!-- HERO PREMIUM -->
    <section style="min-height:100vh;background:#050A14;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding-top:var(--nav-h)">

      <!-- Halo de lumière cyan en arrière-plan -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(0,212,255,.08) 0%,transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;top:20%;right:10%;width:300px;height:300px;background:radial-gradient(circle,rgba(55,138,221,.06) 0%,transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:20%;left:5%;width:200px;height:200px;background:radial-gradient(circle,rgba(0,212,255,.04) 0%,transparent 70%);pointer-events:none"></div>

      <!-- Grille de fond subtile -->
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(55,138,221,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(55,138,221,.03) 1px,transparent 1px);background-size:60px 60px;pointer-events:none"></div>

      <div class="container" style="position:relative;z-index:2;padding-top:40px;padding-bottom:80px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center">

          <!-- Texte gauche -->
          <div>
            <!-- Badge -->
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.2);border-radius:99px;padding:6px 16px;margin-bottom:32px">
              <span style="width:6px;height:6px;border-radius:50%;background:#00D4FF;animation:pulse-dot 2s infinite"></span>
              <span style="color:#00D4FF;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Plateforme N°1 en Côte d'Ivoire</span>
            </div>

            <!-- Titre massif -->
            <h1 style="font-family:'Syne',sans-serif;font-size:clamp(3rem,6vw,5rem);font-weight:800;line-height:1.05;letter-spacing:-.03em;color:#fff;margin-bottom:24px">
              Visitez<br>
              <span style="color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.3)">depuis</span><br>
              <span style="background:linear-gradient(135deg,#378ADD,#00D4FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent">votre salon.</span>
            </h1>

            <p style="color:rgba(255,255,255,.5);font-size:1.05rem;line-height:1.7;max-width:420px;margin-bottom:40px">
              Des visites immobilières 3D immersives pour la diaspora et les acheteurs locaux. Explorez chaque pièce depuis votre téléphone.
            </p>

            <!-- CTAs -->
            <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:56px">
              <button onclick="App.goPage('catalogue')" style="display:flex;align-items:center;gap:10px;padding:14px 28px;background:linear-gradient(135deg,#378ADD,#00D4FF);border:none;border-radius:99px;color:#050A14;font-weight:700;font-size:.95rem;cursor:pointer;box-shadow:0 8px 32px rgba(0,212,255,.3);transition:all .2s" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 40px rgba(0,212,255,.45)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 8px 32px rgba(0,212,255,.3)'">
                Explorer les biens 3D →
              </button>
              <button onclick="UI.openAuth('register')" style="display:flex;align-items:center;gap:10px;padding:14px 28px;background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:99px;color:rgba(255,255,255,.8);font-weight:600;font-size:.95rem;cursor:pointer;transition:all .2s" onmouseenter="this.style.borderColor='rgba(255,255,255,.4)';this.style.color='#fff'" onmouseleave="this.style.borderColor='rgba(255,255,255,.15)';this.style.color='rgba(255,255,255,.8)'">
                Espace agent
              </button>
            </div>

            <!-- Stats -->
            <div style="display:flex;gap:40px">
              ${[['250+','Biens en 3D'],['40+','Agences'],['98%','Satisfaits']].map(([v,l])=>`
              <div>
                <div style="font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:#00D4FF">${v}</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.4);margin-top:2px">${l}</div>
              </div>`).join('')}
            </div>
          </div>

          <!-- Viewer 3D flottant droite -->
          <div style="position:relative">
            <!-- Halo derrière le viewer -->
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;background:radial-gradient(circle,rgba(0,212,255,.12) 0%,transparent 65%);pointer-events:none;z-index:0"></div>

            <!-- Carte viewer flottante -->
            <div style="position:relative;z-index:1;border-radius:24px;overflow:hidden;border:1px solid rgba(0,212,255,.15);box-shadow:0 0 80px rgba(0,212,255,.12),0 32px 64px rgba(0,0,0,.5);animation:float 4s ease-in-out infinite">
              <div style="height:400px;background:#061428;position:relative">
                <canvas id="hero-preview-canvas" style="width:100%;height:100%;display:block"></canvas>
                <!-- Overlay info -->
                <div style="position:absolute;bottom:0;left:0;right:0;padding:20px;background:linear-gradient(transparent,rgba(5,10,20,.95))">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                      <div style="font-weight:700;font-size:.95rem;color:#fff">Villa Prestige — Cocody</div>
                      <div style="font-size:.75rem;color:rgba(0,212,255,.8);margin-top:3px">● Visite 3D disponible</div>
                    </div>
                    <div style="background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);border-radius:8px;padding:6px 12px;color:#00D4FF;font-size:.72rem;font-weight:700">85 M FCFA</div>
                  </div>
                </div>
                <!-- Badge LIVE -->
                <div style="position:absolute;top:16px;right:16px;background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);border-radius:6px;padding:5px 10px;color:#00D4FF;font-size:.7rem;font-weight:700;display:flex;align-items:center;gap:5px">
                  <span style="width:6px;height:6px;border-radius:50%;background:#00D4FF;animation:pulse-dot 1.5s infinite"></span>
                  LIVE 3D
                </div>
              </div>
            </div>

            <!-- Carte flottante stats -->
            <div style="position:absolute;top:-20px;left:-30px;background:rgba(5,10,20,.9);border:1px solid rgba(55,138,221,.2);border-radius:14px;padding:14px 18px;backdrop-filter:blur(12px);z-index:2;animation:float 4s ease-in-out infinite 1s">
              <div style="font-size:.72rem;color:rgba(255,255,255,.5);margin-bottom:4px">Vues aujourd'hui</div>
              <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#00D4FF">+127</div>
            </div>

            <!-- Carte flottante lead -->
            <div style="position:absolute;bottom:-20px;right:-20px;background:rgba(5,10,20,.9);border:1px solid rgba(55,138,221,.2);border-radius:14px;padding:14px 18px;backdrop-filter:blur(12px);z-index:2;animation:float 4s ease-in-out infinite 2s">
              <div style="font-size:.72rem;color:rgba(255,255,255,.5);margin-bottom:4px">Nouveau lead</div>
              <div style="font-size:.85rem;font-weight:600;color:#fff">Aminata K. — Paris 🇫🇷</div>
            </div>
          </div>
        </div>

        <!-- Search bar -->
        <div style="margin-top:60px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;display:flex;overflow:hidden;max-width:700px">
          <select id="hero-trans" style="border:none;outline:none;padding:16px 18px;font-size:.9rem;background:transparent;color:rgba(255,255,255,.7);border-right:1px solid rgba(255,255,255,.08);min-width:120px">
            <option value="" style="background:#050A14">Tout</option>
            <option value="vente" style="background:#050A14">À vendre</option>
            <option value="location" style="background:#050A14">À louer</option>
          </select>
          <select id="hero-type" style="border:none;outline:none;padding:16px 18px;font-size:.9rem;background:transparent;color:rgba(255,255,255,.7);border-right:1px solid rgba(255,255,255,.08);min-width:120px">
            <option value="" style="background:#050A14">Tous types</option>
            <option value="villa" style="background:#050A14">Villa</option>
            <option value="appartement" style="background:#050A14">Appartement</option>
            <option value="duplex" style="background:#050A14">Duplex</option>
            <option value="studio" style="background:#050A14">Studio</option>
            <option value="bureau" style="background:#050A14">Bureau</option>
          </select>
          <input id="hero-search" placeholder="Quartier, commune, type de bien…" onkeydown="if(event.key==='Enter')PageHome.search()" style="flex:1;border:none;outline:none;padding:16px 18px;font-size:.9rem;background:transparent;color:#fff">
          <button onclick="PageHome.search()" style="padding:16px 24px;background:linear-gradient(135deg,#378ADD,#00D4FF);border:none;color:#050A14;font-weight:700;font-size:.9rem;cursor:pointer;white-space:nowrap">
            🔍 Rechercher
          </button>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,.3);font-size:.72rem;animation:bounce 2s ease infinite">
        <span>Défiler</span>
        <span style="font-size:1rem">↓</span>
      </div>
    </section>

    <!-- SECTION DUAL CTA -->
    <section style="padding:100px 0;background:#07101F">
      <div class="container">
        <div class="cta-grid">
          <div style="background:linear-gradient(135deg,#0A1E3D,#0C2A52);border:1px solid rgba(55,138,221,.15);border-radius:24px;padding:40px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden" onmouseenter="this.style.borderColor='rgba(55,138,221,.4)';this.style.transform='translateY(-6px)';this.style.boxShadow='0 20px 60px rgba(55,138,221,.15)'" onmouseleave="this.style.borderColor='rgba(55,138,221,.15)';this.style.transform='';this.style.boxShadow=''" onclick="App.goPage('catalogue')">
            <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(55,138,221,.08) 0%,transparent 70%)"></div>
            <div style="width:60px;height:60px;background:rgba(55,138,221,.1);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:20px;border:1px solid rgba(55,138,221,.2)">🏠</div>
            <h3 style="color:#fff;margin-bottom:10px;font-size:1.3rem">Je cherche un bien</h3>
            <p style="color:rgba(255,255,255,.5);font-size:.9rem;margin-bottom:24px;line-height:1.7">Explorez des centaines de biens en visite 3D immersive. Filtrez, comparez, contactez l'agent.</p>
            <button style="padding:12px 24px;background:linear-gradient(135deg,#185FA5,#378ADD);border:none;border-radius:99px;color:#fff;font-weight:600;font-size:.88rem;cursor:pointer">Voir le catalogue →</button>
          </div>

          <div style="background:linear-gradient(135deg,#061020,#0A1830);border:1px solid rgba(0,212,255,.12);border-radius:24px;padding:40px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden" onmouseenter="this.style.borderColor='rgba(0,212,255,.35)';this.style.transform='translateY(-6px)';this.style.boxShadow='0 20px 60px rgba(0,212,255,.1)'" onmouseleave="this.style.borderColor='rgba(0,212,255,.12)';this.style.transform='';this.style.boxShadow=''" onclick="${App.user?.role==='agent'?'App.goPage('dashboard-agent')':'UI.openAuth('register')'}">
            <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(0,212,255,.06) 0%,transparent 70%)"></div>
            <div style="width:60px;height:60px;background:rgba(0,212,255,.08);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:20px;border:1px solid rgba(0,212,255,.15)">📋</div>
            <h3 style="color:#fff;margin-bottom:10px;font-size:1.3rem">Je suis agent / propriétaire</h3>
            <p style="color:rgba(255,255,255,.5);font-size:.9rem;margin-bottom:24px;line-height:1.7">Publiez vos biens avec scan 3D, gérez vos leads et suivez vos stats en temps réel.</p>
            <button style="padding:12px 24px;background:linear-gradient(135deg,#00B8E0,#00D4FF);border:none;border-radius:99px;color:#050A14;font-weight:700;font-size:.88rem;cursor:pointer">Espace agent →</button>
          </div>
        </div>
      </div>
    </section>

    <!-- BIENS EN VEDETTE -->
    <section style="padding:100px 0;background:#050A14">
      <div class="container">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:48px;flex-wrap:wrap;gap:16px">
          <div>
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:99px;padding:5px 14px;margin-bottom:12px">
              <span style="color:#00D4FF;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Sélection</span>
            </div>
            <h2 style="color:#fff;margin-bottom:6px">Biens en vedette</h2>
            <p style="color:rgba(255,255,255,.4)">Avec visite 3D immersive disponible</p>
          </div>
          <button onclick="App.goPage('catalogue')" style="padding:10px 22px;background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:99px;color:rgba(255,255,255,.7);font-size:.88rem;font-weight:500;cursor:pointer;transition:all .2s" onmouseenter="this.style.borderColor='rgba(255,255,255,.4)';this.style.color='#fff'" onmouseleave="this.style.borderColor='rgba(255,255,255,.15)';this.style.color='rgba(255,255,255,.7)'">Voir tout →</button>
        </div>
        <div class="prop-grid" id="featured-grid">
          ${[1,2,3].map(()=>'<div class="skeleton" style="height:340px;border-radius:16px;background:rgba(255,255,255,.05)"></div>').join('')}
        </div>
      </div>
    </section>

    <!-- COMMENT CA MARCHE -->
    <section style="padding:100px 0;background:#07101F">
      <div class="container">
        <div style="text-align:center;margin-bottom:64px">
          <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:99px;padding:5px 14px;margin-bottom:12px">
            <span style="color:#00D4FF;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Comment ça marche</span>
          </div>
          <h2 style="color:#fff;margin-bottom:8px">Simple, rapide, immersif</h2>
          <p style="color:rgba(255,255,255,.4)">De la recherche à la signature en quelques clics</p>
        </div>
        <div class="hiw-grid">
          ${[
            {icon:'🔍',n:'01',t:'Recherchez',p:'Filtrez par quartier, budget et type. Chaque bien a une visite 3D interactive.'},
            {icon:'🥽',n:'02',t:'Visitez en 3D',p:'Naviguez pièce par pièce depuis votre téléphone, comme si vous y étiez réellement.'},
            {icon:'🤝',n:'03',t:'Contactez',p:'Échangez avec l'agent, planifiez une visio ou une visite physique directement.'},
          ].map(s=>`
          <div style="text-align:center;padding:40px 24px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:20px;transition:all .25s" onmouseenter="this.style.borderColor='rgba(0,212,255,.2)';this.style.background='rgba(0,212,255,.03)'" onmouseleave="this.style.borderColor='rgba(255,255,255,.06)';this.style.background='rgba(255,255,255,.02)'">
            <div style="width:56px;height:56px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:#00D4FF">${s.n}</div>
            <div style="font-size:2rem;margin-bottom:12px">${s.icon}</div>
            <h4 style="color:#fff;margin-bottom:8px">${s.t}</h4>
            <p style="color:rgba(255,255,255,.4);font-size:.87rem;line-height:1.7">${s.p}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- TÉMOIGNAGES -->
    <section style="padding:100px 0;background:#050A14">
      <div class="container">
        <div style="text-align:center;margin-bottom:56px">
          <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:99px;padding:5px 14px;margin-bottom:12px">
            <span style="color:#00D4FF;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Avis clients</span>
          </div>
          <h2 style="color:#fff">Ils nous font confiance</h2>
        </div>
        <div class="testi-grid">
          ${[
            {n:'Aminata K.',r:'Diaspora — Paris 🇫🇷',t:'J'ai acheté mon appartement au Plateau sans même venir en Côte d'Ivoire. La visite 3D était tellement réelle !'},
            {n:'Koffi Adjoumani',r:'Agent — AGEMA Immobilier',t:'Depuis Immo3D CI, nos biens se vendent 2× plus vite. Les clients arrivent déjà convaincus.'},
            {n:'Fatou Diallo',r:'Acheteuse — Abidjan',t:'Enfin une plateforme qui comprend le marché ivoirien. Simple, belle, et vraiment utile.'},
          ].map((t,idx)=>`
          <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:28px;transition:all .25s" onmouseenter="this.style.borderColor='rgba(0,212,255,.2)';this.style.transform='translateY(-4px)'" onmouseleave="this.style.borderColor='rgba(255,255,255,.06)';this.style.transform=''">
            <div style="color:#00D4FF;font-size:1.1rem;margin-bottom:14px">★★★★★</div>
            <p style="color:rgba(255,255,255,.7);font-size:.9rem;line-height:1.8;margin-bottom:20px;font-style:italic">"${t.t}"</p>
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--bleu-3),var(--bleu-4));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.88rem">${t.n[0]}</div>
              <div>
                <div style="font-weight:700;font-size:.88rem;color:#fff">${t.n}</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.4)">${t.r}</div>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- BANNER AGENT -->
    <section style="padding:100px 0;background:#07101F">
      <div class="container">
        <div style="background:linear-gradient(135deg,#061428,#0A1E3D);border:1px solid rgba(0,212,255,.15);border-radius:28px;padding:64px 56px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap">
          <div style="position:absolute;top:-60px;right:-60px;width:400px;height:400px;background:radial-gradient(circle,rgba(0,212,255,.06) 0%,transparent 70%)"></div>
          <div style="position:relative;z-index:1">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:99px;padding:5px 14px;margin-bottom:16px">
              <span style="color:#00D4FF;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Pour les agents</span>
            </div>
            <h2 style="color:#fff;margin-bottom:12px">Publiez avec visite 3D,<br>touchez la diaspora</h2>
            <p style="color:rgba(255,255,255,.5);max-width:480px;line-height:1.7">1,5 million d'Ivoiriens à l'étranger cherchent à investir à distance.</p>
            <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
              ${[['Starter','50k'],['Pro','100k'],['Premium','150k']].map(([n,p])=>`<div style="background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.15);border-radius:99px;padding:5px 14px;color:rgba(0,212,255,.8);font-size:.75rem;font-weight:600">${n} · ${p} FCFA/mois</div>`).join('')}
            </div>
          </div>
          <button onclick="UI.openAuth('register')" style="flex-shrink:0;padding:16px 36px;background:linear-gradient(135deg,#00B8E0,#00D4FF);border:none;border-radius:99px;color:#050A14;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:0 8px 32px rgba(0,212,255,.3);position:relative;z-index:1;transition:all .2s" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 40px rgba(0,212,255,.45)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 8px 32px rgba(0,212,255,.3)'">Commencer gratuitement →</button>
        </div>
      </div>
    </section>`;

    // Animations CSS
    if (!document.getElementById('home-animations')) {
      const style = document.createElement('style');
      style.id = 'home-animations';
      style.textContent = \`
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
      \`;
      document.head.appendChild(style);
    }

    // Init viewer 3D preview
    setTimeout(() => {
      const canvas = document.getElementById('hero-preview-canvas');
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      Canvas3D.initViewer('hero-preview-canvas', { type: 'villa', color: '#042C53' });
    }, 100);

    // Biens vedettes
    try {
      const biens = await API.getBiens({ sort: 'recent' });
      const grid = document.getElementById('featured-grid');
      const top = biens.filter(b => b.has_3d).slice(0, 3);
      if (!top.length) {
        grid.innerHTML = '<div style="grid-column:span 3;text-align:center;color:rgba(255,255,255,.4);padding:40px">Aucun bien disponible</div>';
        return;
      }
      grid.innerHTML = top.map(b => UI.propCard(b, App.favIds)).join('');
      setTimeout(() => top.forEach(b => Canvas3D.initMini('mini-' + b.id, UI._colorFor(b.type))), 100);
    } catch(e) {}
  },

  search() {
    const q = document.getElementById('hero-search').value;
    const trans = document.getElementById('hero-trans').value;
    const type = document.getElementById('hero-type').value;
    PageCatalogue._initFilters = { search: q, transaction: trans, type };
    App.goPage('catalogue');
  },
};
