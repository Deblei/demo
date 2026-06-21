// ═══════════════════════════════════════════════════════════════
// IMMO3D CI — Viewer 3D Haut de Gamme (Three.js + Panorama 360°)
// Option C : Three.js photorealistic SANS photos
//            Panorama 360° réel AVEC photos uploadées
// ═══════════════════════════════════════════════════════════════

const Viewer3D = {
  scene: null, camera: null, renderer: null,
  currentRoom: 0, bien: null, isFullscreen: false,
  animFrame: null, clock: null,
  rooms: [],
  panoramaMode: false,
  photos360: [],

  ROOMS_CONFIG: [
    { name: 'Salon',        wallColor: 0x1a2744, floorColor: 0x2a1f0e, ceilColor: 0x0d1a33, furniture: 'living',   lightColor: 0x4488ff, lightInt: 1.2 },
    { name: 'Chambre',      wallColor: 0x1a1a2e, floorColor: 0x1a0f05, ceilColor: 0x0d0d1a, furniture: 'bedroom',  lightColor: 0x8866ff, lightInt: 0.9 },
    { name: 'Cuisine',      wallColor: 0x1a2a1a, floorColor: 0x1a1500, ceilColor: 0x0d150d, furniture: 'kitchen',  lightColor: 0x44ffaa, lightInt: 1.1 },
    { name: 'Salle de bain',wallColor: 0x0d2233, floorColor: 0x0a1520, ceilColor: 0x071018, furniture: 'bathroom', lightColor: 0x00d4ff, lightInt: 1.3 },
    { name: 'Entrée',       wallColor: 0x1a1a1a, floorColor: 0x0d0d0d, ceilColor: 0x080808, furniture: 'entry',    lightColor: 0xffffff, lightInt: 1.0 },
    { name: 'Terrasse',     wallColor: 0x0a1a2a, floorColor: 0x1a1000, ceilColor: 0x000000, furniture: 'exterior', lightColor: 0xffdd88, lightInt: 1.5 },
  ],

  async init(containerId, bien) {
    this.bien = bien;
    this.photos360 = bien?.photos_360 || [];
    this.currentRoom = 0;

    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // Attendre que Three.js soit chargé
    if (typeof THREE === 'undefined') {
      await this._loadThreeJS();
    }

    this._initScene(container);
    this._buildRoom(0);
    this._animate();

    // Si on a des photos 360°, proposer le mode panorama
    if (this.photos360.length > 0) {
      this._addPanoramaToggle(container);
    }
  },

  async _loadThreeJS() {
    return new Promise((resolve, reject) => {
      if (typeof THREE !== 'undefined') { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  _initScene(container) {
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 480;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050d1a, 0.08);
    this.clock = new THREE.Clock();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, W/H, 0.1, 100);
    this.camera.position.set(0, 1.6, 0); // hauteur des yeux

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Resize
    const resizeObs = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      this.camera.aspect = w/h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    resizeObs.observe(container);

    // Controls — rotation à la souris / tactile
    this._initControls(this.renderer.domElement);
  },

  // ── Construction d'une pièce 3D ──────────────────────────
  _buildRoom(roomIdx) {
    // Nettoyer la scène
    while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0]);

    const cfg = this.ROOMS_CONFIG[roomIdx] || this.ROOMS_CONFIG[0];
    const W = 8, H = 3.2, D = 10; // largeur, hauteur, profondeur

    // ── Sol ──
    const floorGeo = new THREE.PlaneGeometry(W, D, 20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: cfg.floorColor, roughness: 0.8, metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // ── Plafond ──
    const ceilGeo = new THREE.PlaneGeometry(W, D);
    const ceilMat = new THREE.MeshStandardMaterial({ color: cfg.ceilColor, roughness: 1 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI/2;
    ceil.position.y = H;
    this.scene.add(ceil);

    // ── Murs ──
    const wallMat = new THREE.MeshStandardMaterial({ color: cfg.wallColor, roughness: 0.9, metalness: 0.05 });
    const walls = [
      { pos:[0,H/2,-D/2], rot:[0,0,0],         size:[W,H] }, // devant
      { pos:[0,H/2, D/2], rot:[0,Math.PI,0],   size:[W,H] }, // derrière
      { pos:[-W/2,H/2,0], rot:[0,Math.PI/2,0], size:[D,H] }, // gauche
      { pos:[ W/2,H/2,0], rot:[0,-Math.PI/2,0],size:[D,H] }, // droite
    ];
    walls.forEach(w => {
      const geo = new THREE.PlaneGeometry(w.size[0], w.size[1]);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(...w.pos);
      mesh.rotation.set(...w.rot);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // ── Fenêtre (mur devant) ──
    this._addWindow(cfg);

    // ── Lumières ──
    const ambient = new THREE.AmbientLight(cfg.lightColor, 0.3);
    this.scene.add(ambient);

    const mainLight = new THREE.PointLight(cfg.lightColor, cfg.lightInt, 20);
    mainLight.position.set(0, 2.8, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.radius = 8;
    this.scene.add(mainLight);

    // Lumière fenêtre
    const winLight = new THREE.SpotLight(0xaaccff, 1.5, 15, Math.PI/4, 0.5);
    winLight.position.set(0, 2.5, -4.5);
    winLight.target.position.set(0, 0, 0);
    winLight.castShadow = true;
    this.scene.add(winLight);
    this.scene.add(winLight.target);

    // ── Mobilier ──
    this._addFurniture(cfg.furniture, W, H, D);

    // ── Hotspots de navigation ──
    this._addHotspots(roomIdx);

    // ── Particules de poussière ──
    this._addDustParticles();
  },

  _addWindow(cfg) {
    // Cadre fenêtre
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.3, metalness: 0.7 });
    const frameGeo = new THREE.BoxGeometry(2.2, 1.8, 0.05);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 1.8, -4.95);
    this.scene.add(frame);

    // Vitre (semi-transparente)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88bbff, transparent: true, opacity: 0.15,
      roughness: 0, metalness: 0.9,
    });
    const glassGeo = new THREE.PlaneGeometry(2.0, 1.6);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.8, -4.93);
    this.scene.add(glass);

    // Lumière extérieure simulée
    const skyLight = new THREE.RectAreaLight(0xaaddff, 3, 2, 1.6);
    skyLight.position.set(0, 1.8, -4.9);
    skyLight.rotation.y = Math.PI;
    this.scene.add(skyLight);
  },

  _addFurniture(type, W, H, D) {
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.8, metalness: 0.1 });
    const fabric = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 1.0 });
    const white = new THREE.MeshStandardMaterial({ color: 0xddddee, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.2, metalness: 0.9 });

    if (type === 'living') {
      // Canapé
      this._box([0, 0.45, 1.5], [2.2, 0.5, 0.9], fabric);       // assise
      this._box([0, 0.85, 1.95], [2.2, 0.5, 0.15], fabric);      // dossier
      this._box([-1.05, 0.6, 1.5], [0.15, 0.6, 0.9], fabric);    // accoudoir G
      this._box([1.05, 0.6, 1.5], [0.15, 0.6, 0.9], fabric);     // accoudoir D
      // Table basse
      this._box([0, 0.22, 0], [1.1, 0.05, 0.6], wood);
      this._box([-0.45, 0.1, -0.22], [0.06, 0.2, 0.06], metal);
      this._box([0.45, 0.1, -0.22], [0.06, 0.2, 0.06], metal);
      this._box([-0.45, 0.1, 0.22], [0.06, 0.2, 0.06], metal);
      this._box([0.45, 0.1, 0.22], [0.06, 0.2, 0.06], metal);
      // TV murale
      const tvMat = new THREE.MeshStandardMaterial({ color: 0x000011, roughness: 0.1, metalness: 0.9, emissive: 0x001133, emissiveIntensity: 0.5 });
      this._box([0, 1.4, -4.8], [1.6, 0.9, 0.05], tvMat);
      // Cadre TV
      this._box([0, 1.4, -4.77], [1.65, 0.95, 0.03], metal);
    }

    if (type === 'bedroom') {
      // Lit
      this._box([0, 0.15, 1.5], [1.8, 0.2, 2.0], wood);         // base
      this._box([0, 0.42, 1.5], [1.8, 0.25, 2.0], white);        // matelas
      this._box([0, 0.6, 2.45], [1.8, 0.1, 0.5], white);         // oreiller
      this._box([0, 0.85, 2.48], [1.8, 0.55, 0.08], fabric);     // tête de lit
      // Tables de chevet
      this._box([-1.1, 0.35, 1.5], [0.45, 0.5, 0.45], wood);
      this._box([1.1, 0.35, 1.5], [0.45, 0.5, 0.45], wood);
      // Lampes de chevet
      const lampMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffeedd, emissiveIntensity: 0.8 });
      this._box([-1.1, 0.72, 1.5], [0.15, 0.25, 0.15], lampMat);
      this._box([1.1, 0.72, 1.5], [0.15, 0.25, 0.15], lampMat);
      // Armoire
      this._box([-2.8, 1.2, -1], [1.2, 2.2, 0.6], wood);
    }

    if (type === 'kitchen') {
      // Meubles bas
      for (let x = -3; x <= 3; x += 0.8) {
        this._box([x, 0.45, -4.5], [0.75, 0.85, 0.55], wood);
      }
      // Plan de travail
      this._box([0, 0.9, -4.5], [6.5, 0.05, 0.55], metal);
      // Meubles hauts
      for (let x = -2.5; x <= 2.5; x += 0.8) {
        this._box([x, 2.1, -4.5], [0.75, 0.7, 0.35], wood);
      }
      // Hotte
      this._box([0, 1.8, -4.5], [0.9, 0.3, 0.4], metal);
      // Evier
      const sinkMat = new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0.1, metalness: 0.95 });
      this._box([1.5, 0.88, -4.5], [0.7, 0.05, 0.45], sinkMat);
      // Table
      this._box([0, 0.76, 1], [1.2, 0.04, 0.8], wood);
      // Chaises
      [-0.4, 0.4].forEach(x => {
        this._box([x, 0.45, 1.6], [0.35, 0.04, 0.35], wood);
        this._box([x, 0.7, 1.95], [0.35, 0.5, 0.04], wood);
      });
    }

    if (type === 'bathroom') {
      const ceram = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.05, metalness: 0.1 });
      // Baignoire
      this._box([-2, 0.35, 2], [1.6, 0.55, 0.75], ceram);
      // WC
      this._box([2.5, 0.4, 2], [0.55, 0.45, 0.65], ceram);
      this._box([2.5, 0.85, 2.3], [0.55, 0.12, 0.25], ceram);
      // Vasque
      this._box([0, 0.85, -4.5], [0.7, 0.12, 0.5], ceram);
      this._box([0, 0.5, -4.5], [0.7, 0.7, 0.55], wood);
      // Miroir
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0, metalness: 1, envMapIntensity: 1 });
      this._box([0, 1.5, -4.92], [0.8, 0.7, 0.02], mirrorMat);
    }

    if (type === 'exterior') {
      // Sol extérieur
      const tileMat = new THREE.MeshStandardMaterial({ color: 0x333322, roughness: 0.9 });
      this._box([0, -0.01, 0], [W, 0.02, D], tileMat);
      // Balustrade
      for (let x = -3.5; x <= 3.5; x += 0.8) {
        this._box([x, 0.5, -4.5], [0.06, 0.9, 0.06], metal);
      }
      this._box([0, 0.95, -4.5], [7, 0.06, 0.06], metal);
      // Chaises de terrasse
      [-1, 1].forEach(x => {
        this._box([x, 0.45, 0], [0.6, 0.05, 0.6], wood);
        this._box([x, 0.7, 0.3], [0.6, 0.5, 0.05], wood);
      });
      // Table ronde
      const tableGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
      const table = new THREE.Mesh(tableGeo, wood);
      table.position.set(0, 0.76, 0);
      table.castShadow = true;
      this.scene.add(table);
    }
  },

  _box(pos, size, mat) {
    const geo = new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  },

  // ── Hotspots de navigation ───────────────────────────────
  _addHotspots(currentRoom) {
    const totalRooms = this.ROOMS_CONFIG.length;
    const nextRoom = (currentRoom + 1) % totalRooms;
    const prevRoom = (currentRoom - 1 + totalRooms) % totalRooms;

    [
      { pos:[1.5, 0.01, -1], room: nextRoom, label: this.ROOMS_CONFIG[nextRoom].name },
      { pos:[-1.5, 0.01, -1], room: prevRoom, label: this.ROOMS_CONFIG[prevRoom].name },
    ].forEach(h => {
      // Anneau au sol
      const ringGeo = new THREE.RingGeometry(0.2, 0.32, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI/2;
      ring.position.set(h.pos[0], h.pos[1]+0.01, h.pos[2]);
      ring.userData = { hotspot: true, targetRoom: h.room };
      this.scene.add(ring);

      // Point central
      const dotGeo = new THREE.CircleGeometry(0.08, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.rotation.x = -Math.PI/2;
      dot.position.set(h.pos[0], h.pos[1]+0.02, h.pos[2]);
      this.scene.add(dot);

      // Label flottant
      const sprite = this._makeLabel(h.label);
      sprite.position.set(h.pos[0], 0.6, h.pos[2]);
      sprite.userData = { hotspot: true, targetRoom: h.room };
      this.scene.add(sprite);
    });

    // Raycaster pour clic sur hotspot
    this._setupRaycaster();
  },

  _makeLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(4,44,83,0.85)';
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.8)';
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.stroke();
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.3, 1);
    return sprite;
  },

  _setupRaycaster() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvas = this.renderer.domElement;

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      for (const i of intersects) {
        if (i.object.userData?.hotspot) {
          this.goToRoom(i.object.userData.targetRoom);
          break;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchend', onClick, {passive:true});
  },

  // ── Particules de poussière ──────────────────────────────
  _addDustParticles() {
    const count = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 8;
      positions[i*3+1] = Math.random() * 3;
      positions[i*3+2] = (Math.random() - 0.5) * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x4488ff, size: 0.015, transparent: true, opacity: 0.4 });
    const dust = new THREE.Points(geo, mat);
    dust.userData.isDust = true;
    this.scene.add(dust);
  },

  // ── Contrôles de rotation ────────────────────────────────
  _initControls(canvas) {
    let isDragging = false, lastX = 0, lastY = 0;
    let yaw = 0, pitch = 0;
    let velX = 0;

    const onDown = (x, y) => { isDragging = true; lastX = x; lastY = y; velX = 0; };
    const onMove = (x, y) => {
      if (!isDragging) return;
      const dx = x - lastX, dy = y - lastY;
      velX = dx * 0.004;
      yaw   -= dx * 0.004;
      pitch -= dy * 0.003;
      pitch  = Math.max(-0.8, Math.min(0.8, pitch));
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = yaw;
      this.camera.rotation.x = pitch;
      lastX = x; lastY = y;
    };
    const onUp = () => { isDragging = false; };

    canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', e => { const t=e.touches[0]; onDown(t.clientX, t.clientY); }, {passive:true});
    canvas.addEventListener('touchmove', e => { e.preventDefault(); const t=e.touches[0]; onMove(t.clientX, t.clientY); }, {passive:false});
    canvas.addEventListener('touchend', onUp, {passive:true});

    // Inertie
    const applyInertia = () => {
      if (!isDragging && Math.abs(velX) > 0.0005) {
        yaw -= velX;
        velX *= 0.92;
        this.camera.rotation.y = yaw;
      }
      requestAnimationFrame(applyInertia);
    };
    applyInertia();

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', () => canvas.style.cursor = 'grabbing');
    canvas.addEventListener('mouseup', () => canvas.style.cursor = 'grab');
  },

  // ── Boucle d'animation ───────────────────────────────────
  _animate() {
    const loop = () => {
      this.animFrame = requestAnimationFrame(loop);
      const t = this.clock ? this.clock.getElapsedTime() : 0;

      // Animer les particules de poussière
      this.scene.children.forEach(obj => {
        if (obj.userData?.isDust) {
          const pos = obj.geometry.attributes.position.array;
          for (let i = 0; i < pos.length; i += 3) {
            pos[i+1] += 0.001;
            if (pos[i+1] > 3.2) pos[i+1] = 0;
            pos[i] += Math.sin(t + i) * 0.0005;
          }
          obj.geometry.attributes.position.needsUpdate = true;
        }
      });

      this.renderer?.render(this.scene, this.camera);
    };
    loop();
  },

  // ── Navigation entre pièces ──────────────────────────────
  goToRoom(idx) {
    if (idx === this.currentRoom) return;
    this.currentRoom = Math.max(0, Math.min(idx, this.ROOMS_CONFIG.length - 1));
    this._buildRoom(this.currentRoom);

    // Mettre à jour le label de la pièce
    const lbl = document.getElementById('room-label');
    if (lbl) lbl.textContent = this.ROOMS_CONFIG[this.currentRoom].name;

    // Mettre à jour les boutons
    document.querySelectorAll('.room-nav-btn').forEach((btn, i) => {
      const active = i === this.currentRoom;
      btn.style.borderColor = active ? 'rgba(0,212,255,.8)' : 'rgba(255,255,255,.2)';
      btn.style.background  = active ? 'rgba(0,212,255,.2)' : 'rgba(4,44,83,.6)';
      btn.style.color       = active ? '#00D4FF' : 'rgba(255,255,255,.75)';
    });

    UI.toast(`${this.ROOMS_CONFIG[this.currentRoom].name} →`, '');
  },

  // ── Contrôles externes ───────────────────────────────────
  rotateLeft()  { this.camera.rotation.y += 0.2; },
  rotateRight() { this.camera.rotation.y -= 0.2; },
  zoomIn()      { this.camera.fov = Math.max(40, this.camera.fov - 5); this.camera.updateProjectionMatrix(); },
  zoomOut()     { this.camera.fov = Math.min(100, this.camera.fov + 5); this.camera.updateProjectionMatrix(); },
  toggleLight() {
    this.scene.children.forEach(c => {
      if (c.isPointLight) c.intensity = c.intensity > 0.5 ? 0.3 : 1.2;
      if (c.isAmbientLight) c.intensity = c.intensity > 0.2 ? 0.1 : 0.3;
    });
  },
  toggleFullscreen(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  },

  // ── Mode Panorama 360° ───────────────────────────────────
  _addPanoramaToggle(container) {
    const btn = document.createElement('button');
    btn.textContent = '🌐 Voir panorama 360°';
    btn.style.cssText = 'position:absolute;bottom:70px;left:16px;padding:8px 14px;background:rgba(4,44,83,.85);backdrop-filter:blur(8px);border:1px solid rgba(0,212,255,.4);border-radius:99px;color:#00D4FF;font-size:.78rem;font-weight:700;cursor:pointer;z-index:10';
    btn.onclick = () => this._initPanorama(container);
    container.style.position = 'relative';
    container.appendChild(btn);
  },

  _initPanorama(container) {
    if (typeof THREE === 'undefined') return;
    // Supprimer la scène actuelle
    cancelAnimationFrame(this.animFrame);
    while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0]);

    const photo = this.photos360[this.currentRoom % this.photos360.length];
    const texture = new THREE.TextureLoader().load(photo);
    const geo = new THREE.SphereGeometry(50, 64, 32);
    geo.scale(-1, 1, 1); // retourner la sphère
    const mat = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geo, mat);
    this.scene.add(sphere);

    this.camera.position.set(0, 0, 0);
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();

    this.panoramaMode = true;
    this._animate();
    UI.toast('Mode panorama 360° activé — glissez pour regarder autour', 'success');
  },

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.renderer) { this.renderer.dispose(); this.renderer.domElement?.remove(); }
    this.scene = null; this.camera = null; this.renderer = null;
  },
};
