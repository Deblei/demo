// ── Page Publier ───────────────────────────────
const PagePublish = {
  step: 1,
  bienId: null,
  data: {},
  photos: [],

  async render(existingId) {
    if (!App.user) { UI.openAuth(); return; }
    if (App.user.role !== 'agent') {
      document.getElementById('page-publish').innerHTML = `
      <div class="page-with-nav container section">
        ${UI.empty('🔒', 'Réservé aux agents', 'Créez un compte agent pour publier vos biens.', 'Devenir agent', "UI.openAuth('register')")}
      </div>`;
      return;
    }
    if (existingId) { this.bienId = existingId; this.step = 3; }
    else { this.step = 1; this.bienId = null; this.data = {}; this.photos = []; }
    this._render();
  },

  _render() {
    const el = document.getElementById('page-publish');
    const stepLabels = ['Informations','Équipements','Photos','Scan 3D'];
    el.innerHTML = `
    <div class="page-with-nav">
    <div class="publish-page">
      <button class="btn btn-outline btn-sm" onclick="App.goPage('dashboard-agent')" style="margin-bottom:24px">← Tableau de bord</button>
      <h2 style="margin-bottom:32px">Publier un bien</h2>
      <!-- Stepper -->
      <div class="stepper">
        ${stepLabels.map((l,i)=>`
        <div class="step-wrap">
          <div class="step-circle ${i+1<this.step?'done':i+1===this.step?'active':''}">${i+1<this.step?'✓':i+1}</div>
          <div class="step-lbl">${l}</div>
        </div>
        ${i<3?`<div class="step-line ${i+1<this.step?'done':''}"></div>`:''}`).join('')}
      </div>
      <div id="pub-step-content">${this._renderStep()}</div>
    </div>
    </div>`;
  },

  _renderStep() {
    if (this.step === 1) return `
    <div class="pub-card">
      <h3>Informations du bien</h3>
      <p style="margin-bottom:24px;font-size:.875rem;color:var(--gris-3)">Décrivez votre bien avec précision pour attirer les bons acheteurs.</p>
      <div class="form-group mb-14"><label class="form-label">Titre de l'annonce *</label>
        <input class="form-input" id="pub-titre" placeholder="Ex : Villa 5 chambres avec piscine — Cocody Riviera" value="${this.data.titre||''}"></div>
      <div class="form-grid-2">
        <div class="form-group mb-14"><label class="form-label">Type de bien *</label>
          <select class="form-input" id="pub-type">
            ${['villa','appartement','duplex','studio','bureau','terrain','commerce'].map(t=>`<option value="${t}" ${this.data.type===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
          </select></div>
        <div class="form-group mb-14"><label class="form-label">Transaction *</label>
          <select class="form-input" id="pub-trans">
            <option value="vente" ${this.data.transaction==='vente'?'selected':''}>À vendre</option>
            <option value="location" ${this.data.transaction==='location'?'selected':''}>À louer</option>
          </select></div>
        <div class="form-group mb-14"><label class="form-label">Prix (FCFA) *</label>
          <input type="number" class="form-input" id="pub-prix" placeholder="85000000" value="${this.data.prix||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Surface (m²)</label>
          <input type="number" class="form-input" id="pub-surface" placeholder="150" value="${this.data.surface||''}"></div>
        <div class="form-group mb-14"><label class="form-label">Chambres</label>
          <select class="form-input" id="pub-ch">${[0,1,2,3,4,5,6].map(n=>`<option value="${n}" ${this.data.chambres==n?'selected':''}>${n===0?'Studio/bureau':n}</option>`).join('')}</select></div>
        <div class="form-group mb-14"><label class="form-label">Salles de bain</label>
          <select class="form-input" id="pub-sdb">${[1,2,3,4].map(n=>`<option value="${n}" ${this.data.sdb==n?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="form-group mb-14"><label class="form-label">Quartier *</label>
          <select class="form-input" id="pub-quartier">
            ${['Cocody','Plateau','2 Plateaux','Marcory','Bingerville','Angré','Yopougon','Treichville','Adjamé','Port-Bouët','Abobo'].map(q=>`<option value="${q}" ${this.data.quartier===q?'selected':''}>${q}</option>`).join('')}
          </select></div>
        <div class="form-group mb-14"><label class="form-label">Commune</label>
          <input class="form-input" id="pub-commune" placeholder="Abidjan" value="${this.data.commune||'Abidjan'}"></div>
      </div>
      <div class="form-group mb-14"><label class="form-label">Adresse précise</label>
        <input class="form-input" id="pub-adresse" placeholder="Rue des Cocotiers, Villa 12" value="${this.data.adresse||''}"></div>
      <div class="form-group mb-20"><label class="form-label">Description</label>
        <textarea class="form-input" id="pub-desc" rows="4" placeholder="Décrivez les points forts : luminosité, matériaux, environnement, accès…">${this.data.description||''}</textarea></div>
      <div class="step-nav">
        <div></div>
        <button class="btn btn-primary" onclick="PagePublish.nextStep1()">Suivant →</button>
      </div>
    </div>`;

    if (this.step === 2) return `
    <div class="pub-card">
      <h3>Équipements & prestations</h3>
      <p style="margin-bottom:20px;font-size:.875rem;color:var(--gris-3)">Sélectionnez tout ce qui correspond à votre bien.</p>
      <div class="equip-grid">
        ${['Piscine','Garage','Jardin','Groupe électrogène','Climatisation','Cuisine équipée','Terrasse','Sécurité 24/7','Meublé','Internet fibre','Domotique','Piscine à débordement','Vue mer/lagune','Ascenseur','Salle de sport','Parking','Balcon','Cave'].map(eq=>`
        <label class="equip-item ${(this.data.equipements||[]).includes(eq)?'on':''}">
          <input type="checkbox" style="display:none" ${(this.data.equipements||[]).includes(eq)?'checked':''} onchange="PagePublish.toggleEquip('${eq}',this.checked)">
          ${eq}
        </label>`).join('')}
      </div>
      <div class="step-nav">
        <button class="btn btn-outline" onclick="PagePublish.prevStep()">← Retour</button>
        <button class="btn btn-primary" onclick="PagePublish.nextStep2()">Suivant →</button>
      </div>
    </div>`;

    if (this.step === 3) return `
    <div class="pub-card">
      <h3>Photos du bien</h3>
      <p style="margin-bottom:20px;font-size:.875rem;color:var(--gris-3)">Ajoutez au minimum 3 photos de qualité. Les biens avec photos reçoivent 4× plus de contacts.</p>
      <div class="photo-dropzone" onclick="document.getElementById('photo-input').click()"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondrop="event.preventDefault();this.classList.remove('drag-over');PagePublish.handlePhotoDrop(event)">
        <div style="font-size:2.5rem;margin-bottom:8px">📷</div>
        <div class="fw-600">Glissez vos photos ici ou cliquez</div>
        <div style="font-size:.8rem;color:var(--gris-3);margin-top:4px">JPG, PNG — Max 30 Mo par photo</div>
        <input type="file" id="photo-input" accept="image/*" multiple style="display:none" onchange="PagePublish.handlePhotoFiles(this.files)">
      </div>
      <div id="photo-previews" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px">
        ${this.photos.length > 0 ? this.photos.map((f,i)=>`
        <div style="position:relative;width:120px">
          <div style="width:120px;height:85px;border-radius:8px;background:var(--gris-1);overflow:hidden;border:2px solid var(--terre)">
            <img id="prev-${i}" style="width:100%;height:100%;object-fit:cover">
          </div>
          <button onclick="PagePublish.removePhoto(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rouge);color:#fff;border:none;font-size:11px;cursor:pointer">×</button>
        </div>`).join('') : ''}
      </div>
      <div id="upload-progress" class="hidden" style="margin-top:16px">
        <div class="progress-bar-wrap"><div class="progress-bar" id="pub-progress" style="width:0%"></div></div>
        <p style="font-size:.875rem;color:var(--gris-3);text-align:center;margin-top:8px" id="pub-progress-text">Upload…</p>
      </div>
      <div class="step-nav">
        <button class="btn btn-outline" onclick="PagePublish.prevStep()">← Retour</button>
        <button class="btn btn-primary" onclick="PagePublish.nextStep3()">Suivant →</button>
      </div>
    </div>`;

    if (this.step === 4) return `
    <div class="pub-card">
      <h3>Visite 3D — Scan du bien</h3>
      <p style="margin-bottom:20px;font-size:.875rem;color:var(--gris-3)">Ajoutez une visite 3D pour multiplier vos contacts par 3.</p>
      <div class="scan-cta-grid">
        <div class="scan-cta-card" onclick="App.goPage('scan','${this.bienId}')">
          <div style="font-size:2.5rem;margin-bottom:12px">📷</div>
          <h4>Ajouter le scan 3D maintenant</h4>
          <p style="font-size:.875rem;margin-top:8px">Uploadez vos photos 360° ou demandez notre équipe professionnelle.</p>
          <button class="btn btn-primary" style="margin-top:16px">Configurer la visite 3D →</button>
        </div>
        <div class="scan-cta-card later" onclick="PagePublish.finishLater()">
          <div style="font-size:2.5rem;margin-bottom:12px">⏰</div>
          <h4>Publier sans visite 3D</h4>
          <p style="font-size:.875rem;margin-top:8px">Vous pourrez ajouter la visite 3D plus tard depuis votre tableau de bord.</p>
          <button class="btn btn-outline" style="margin-top:16px">Publier sans scan →</button>
        </div>
      </div>
      <div class="step-nav">
        <button class="btn btn-outline" onclick="PagePublish.prevStep()">← Retour</button>
      </div>
    </div>`;

    return '';
  },

  async nextStep1() {
    const titre     = document.getElementById('pub-titre').value.trim();
    const type      = document.getElementById('pub-type').value;
    const trans     = document.getElementById('pub-trans').value;
    const prix      = document.getElementById('pub-prix').value;
    const surface   = document.getElementById('pub-surface').value;
    const chambres  = document.getElementById('pub-ch').value;
    const sdb       = document.getElementById('pub-sdb').value;
    const quartier  = document.getElementById('pub-quartier').value;
    const commune   = document.getElementById('pub-commune').value;
    const adresse   = document.getElementById('pub-adresse').value;
    const desc      = document.getElementById('pub-desc').value;
    if (!titre || !prix || !quartier) { UI.toast('Titre, prix et quartier sont obligatoires', 'error'); return; }
    Object.assign(this.data, { titre, type, transaction: trans, prix: Number(prix), surface: surface||null, chambres: Number(chambres), sdb: Number(sdb), quartier, commune, adresse, description: desc });
    // Créer le bien en DB
    if (!this.bienId) {
      UI.loading(true, 'Création du bien…');
      try {
        const res = await API.createBien(this.data);
        this.bienId = res.id;
        UI.loading(false);
      } catch (e) { UI.loading(false); UI.toast(e.message, 'error'); return; }
    } else {
      // Mise à jour
      await API.updateBien(this.bienId, this.data).catch(e => UI.toast(e.message, 'error'));
    }
    this.step = 2; this._refreshContent();
  },

  toggleEquip(eq, checked) {
    if (!this.data.equipements) this.data.equipements = [];
    if (checked) { if (!this.data.equipements.includes(eq)) this.data.equipements.push(eq); }
    else { this.data.equipements = this.data.equipements.filter(e => e !== eq); }
  },

  async nextStep2() {
    if (this.bienId) {
      await API.updateBien(this.bienId, { ...this.data, statut:'brouillon' }).catch(() => {});
    }
    this.step = 3; this._refreshContent();
  },

  handlePhotoFiles(files) { Array.from(files).forEach(f => this.photos.push(f)); this._renderPhotoPreviews(); },
  handlePhotoDrop(e) { this.handlePhotoFiles(e.dataTransfer.files); },

  _renderPhotoPreviews() {
    const c = document.getElementById('photo-previews');
    if (!c) return;
    c.innerHTML = this.photos.map((f, i) => `
    <div style="position:relative;width:120px">
      <div style="width:120px;height:85px;border-radius:8px;background:var(--gris-1);overflow:hidden;border:2px solid var(--terre)">
        <img id="prev-${i}" style="width:100%;height:100%;object-fit:cover">
      </div>
      <button onclick="PagePublish.removePhoto(${i})" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--rouge);color:#fff;border:none;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:bold">×</button>
    </div>`).join('');
    this.photos.forEach((f, i) => {
      const r = new FileReader();
      r.onload = e => { const img = document.getElementById(`prev-${i}`); if (img) img.src = e.target.result; };
      r.readAsDataURL(f);
    });
  },

  removePhoto(i) { this.photos.splice(i, 1); this._renderPhotoPreviews(); },

  async nextStep3() {
    if (this.photos.length > 0) {
      const fd = new FormData();
      this.photos.forEach(f => fd.append('photos', f));
      const prog = document.getElementById('upload-progress');
      const fill = document.getElementById('pub-progress');
      const text = document.getElementById('pub-progress-text');
      prog.classList.remove('hidden');
      let pct = 0;
      const iv = setInterval(() => { pct = Math.min(92, pct + Math.random() * 18); fill.style.width = pct + '%'; text.textContent = `Upload… ${Math.round(pct)}%`; }, 300);
      try {
        await API.uploadPhotos(this.bienId, fd);
        clearInterval(iv); fill.style.width = '100%'; text.textContent = 'Photos uploadées ✓';
        await new Promise(r => setTimeout(r, 800));
        prog.classList.add('hidden');
      } catch (e) {
        clearInterval(iv); prog.classList.add('hidden');
        UI.toast(e.message, 'error'); return;
      }
    }
    this.step = 4; this._refreshContent();
  },

  prevStep() { if (this.step > 1) { this.step--; this._refreshContent(); } },

  _refreshContent() {
    document.getElementById('pub-step-content').innerHTML = this._renderStep();
    // Réafficher les photos existantes
    if (this.step === 3 && this.photos.length > 0) {
      setTimeout(() => this._renderPhotoPreviews(), 50);
    }
    // Update stepper visual
    document.querySelectorAll('.step-circle').forEach((c, i) => {
      c.className = `step-circle ${i+1<this.step?'done':i+1===this.step?'active':''}`;
      c.textContent = i+1<this.step ? '✓' : i+1;
    });
    document.querySelectorAll('.step-line').forEach((l, i) => l.classList.toggle('done', i+1<this.step));
  },

  finishLater() {
    UI.toast('Bien publié ! Vous pouvez ajouter la visite 3D depuis votre tableau de bord.', 'success');
    setTimeout(() => App.goPage('dashboard-agent'), 1500);
  },
};
