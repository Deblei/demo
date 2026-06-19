// ── Page Catalogue ──────────────────────────────
const PageCatalogue = {
  biens: [],
  filters: { type:'', transaction:'', quartier:'', sort:'recent', has_3d:'' },
  _initFilters: null,

  async render() {
    if (this._initFilters) { Object.assign(this.filters, this._initFilters); this._initFilters = null; }
    const el = document.getElementById('page-catalogue');
    el.innerHTML = `
    <div class="page-with-nav">
    <div class="cat-header">
      <div class="container"><h2>Catalogue des biens</h2><p>Abidjan et environs — Visite 3D disponible</p></div>
    </div>
    <div class="container" style="padding:24px 24px 60px">
      <div class="cat-toolbar">
        <div class="cat-filters">
          <select class="fsel" onchange="PageCatalogue.setFilter('type',this.value)">
            <option value="">Tout type</option>
            ${['villa','appartement','duplex','studio','bureau'].map(t=>`<option value="${t}" ${this.filters.type===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
          </select>
          <select class="fsel" onchange="PageCatalogue.setFilter('transaction',this.value)">
            <option value="">Vente & location</option>
            <option value="vente" ${this.filters.transaction==='vente'?'selected':''}>À vendre</option>
            <option value="location" ${this.filters.transaction==='location'?'selected':''}>À louer</option>
          </select>
          <select class="fsel" onchange="PageCatalogue.setFilter('quartier',this.value)">
            <option value="">Tout quartier</option>
            ${['Cocody','Plateau','Marcory','Bingerville','Angré','2 Plateaux','Yopougon'].map(q=>`<option value="${q}" ${this.filters.quartier===q?'selected':''}>${q}</option>`).join('')}
          </select>
          <label class="filter-chip ${this.filters.has_3d?'active':''}" onclick="PageCatalogue.toggleFilter3D()">
            <input type="checkbox" ${this.filters.has_3d?'checked':''} style="display:none"> ● Visite 3D
          </label>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span id="results-count" class="results-count"></span>
          <select class="fsel" onchange="PageCatalogue.setFilter('sort',this.value)">
            <option value="recent">Plus récents</option>
            <option value="prix_asc">Prix ↑</option>
            <option value="prix_desc">Prix ↓</option>
            <option value="surface">Surface</option>
          </select>
        </div>
      </div>
      <div id="cat-grid" class="cat-grid"><div class="skeleton-grid">${Array(6).fill('<div class="skeleton" style="height:300px;border-radius:14px"></div>').join('')}</div></div>
    </div>
    </div>`;
    await this.loadBiens();
  },

  async loadBiens() {
    const params = {};
    if (this.filters.type)        params.type = this.filters.type;
    if (this.filters.transaction) params.transaction = this.filters.transaction;
    if (this.filters.quartier)    params.quartier = this.filters.quartier;
    if (this.filters.has_3d)      params.has_3d = '1';
    if (this.filters.sort)        params.sort = this.filters.sort;
    try {
      this.biens = await API.getBiens(params);
      this.renderGrid();
    } catch (e) {
      document.getElementById('cat-grid').innerHTML = `<div style="text-align:center;padding:40px;color:var(--gris-3)">${e.message}</div>`;
    }
  },

  renderGrid() {
    const count = document.getElementById('results-count');
    if (count) count.innerHTML = `<strong>${this.biens.length}</strong> biens trouvés`;
    const grid = document.getElementById('cat-grid');
    if (!grid) return;
    if (!this.biens.length) {
      grid.innerHTML = UI.empty('🔍', 'Aucun bien trouvé', 'Modifiez vos filtres pour voir plus de résultats.', 'Tout voir', "PageCatalogue.resetFilters()");
      return;
    }
    grid.innerHTML = `<div class="cat-prop-grid">${this.biens.map(b => UI.propCard(b, App.favIds)).join('')}</div>`;
    setTimeout(() => this.biens.forEach(b => Canvas3D.initMini(`mini-${b.id}`, UI._colorFor(b.type))), 100);
  },

  setFilter(key, val) {
    this.filters[key] = val;
    this.loadBiens();
  },

  toggleFilter3D() {
    this.filters.has_3d = this.filters.has_3d ? '' : '1';
    const chip = document.querySelector('.filter-chip');
    chip?.classList.toggle('active', !!this.filters.has_3d);
    this.loadBiens();
  },

  resetFilters() {
    this.filters = { type:'', transaction:'', quartier:'', sort:'recent', has_3d:'' };
    this.render();
  },
};
