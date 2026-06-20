// ── Immo3D CI — Viewer 3D Immersif Style Matterport ──────────
const Canvas3D = {
  instances: {},

  // ── Mini canvas pour les cartes de biens ─────────────────
  initMini(canvasId, colorHex) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || this.instances[canvasId]) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 280;
    const W = canvas.width, H = canvas.height;
    let frame = 0;
    const [br, bg, bb] = this._hex2rgb(colorHex || '#042C53');

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Fond dégradé bleu
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, `rgb(${br},${bg},${bb})`);
      grad.addColorStop(1, `rgb(${Math.max(0,br-20)},${Math.max(0,bg-20)},${Math.max(0,bb-20)})`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Grille perspective subtile
      ctx.strokeStyle = 'rgba(55,138,221,.08)'; ctx.lineWidth = 1;
      const cx = W*.5, cy = H*.4, sx = W*.22, sy = H*.45;
      for (let i = 0; i <= 8; i++) {
        const t = i/8, x = cx - sx + t*sx*2;
        ctx.beginPath(); ctx.moveTo(x, cy-sy*.5); ctx.lineTo(cx+(x-cx)*.1, cy+sy*.2); ctx.stroke();
      }
      for (let j = 0; j <= 4; j++) {
        const t = j/4;
        ctx.beginPath(); ctx.moveTo(cx-sx*(1-t*.9), cy-sy*.5+t*sy*.7);
        ctx.lineTo(cx+sx*(1-t*.9), cy-sy*.5+t*sy*.7); ctx.stroke();
      }

      // Fenêtre lumineuse cyan
      const a = Math.sin(frame*.02)*.1 + .4;
      ctx.strokeStyle = `rgba(0,212,255,${a})`; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx-sx*.18, cy-sy*.42, sx*.36, sy*.42);
      const lg = ctx.createRadialGradient(cx, cy-sy*.2, 0, cx, cy-sy*.2, sx*.5);
      lg.addColorStop(0, `rgba(0,212,255,${a*.15})`); lg.addColorStop(1, 'rgba(0,212,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

      // Hotspots pulsants
      const spots = [{x:cx*.72,y:cy+.1*sy},{x:cx*1.28,y:cy+.18*sy},{x:cx,y:cy-sy*.12}];
      spots.forEach((sp, i) => {
        const p = Math.sin((frame+i*40)*.05)*.5+.5;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 8+p*4, 0, Math.PI*2);
        ctx.fillStyle = `rgba(0,212,255,${.15+p*.2})`; ctx.fill();
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(0,212,255,.9)'; ctx.fill();
      });

      frame++;
      this.instances[canvasId] = requestAnimationFrame(draw);
    };
    draw();
  },

  // ── Viewer immersif principal ────────────────────────────
  initViewer(canvasId, bien) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const wrap = canvas.parentElement;
      canvas.width = wrap ? wrap.clientWidth : 800;
      canvas.height = wrap ? wrap.clientHeight : 450;
    };
    resize();
    window.addEventListener('resize', resize);

    const photos360 = bien?.photos_360 || [];
    const hasReal = photos360.length > 0;

    const state = {
      angle: 0, pitch: .5, zoom: 1,
      dragging: false, lastX: 0, lastY: 0,
      room: 0, lightMode: 'day', topView: false,
      frame: 0, color: '#042C53',
      transitioning: false, transAlpha: 1,
      velocity: 0,
    };

    // Rooms / pièces
    const rooms = [
      { name: 'Entrée',     color: '#042C53', furniture: 'entry' },
      { name: 'Salon',      color: '#0A1A3A', furniture: 'living' },
      { name: 'Cuisine',    color: '#0C2244', furniture: 'kitchen' },
      { name: 'Chambre',    color: '#061830', furniture: 'bedroom' },
      { name: 'Salle de bain', color: '#0D2040', furniture: 'bathroom' },
      { name: 'Terrasse',   color: '#0A2850', furniture: 'exterior' },
    ];

    if (hasReal) {
      this._initPanoViewer(canvas, ctx, photos360, state, rooms);
    } else {
      this._initSyntheticViewer(canvas, ctx, state, rooms);
    }

    // Interactions souris
    const onDown = (x, y) => { state.dragging = true; state.lastX = x; state.lastY = y; state.velocity = 0; };
    const onMove = (x, y) => {
      if (!state.dragging) return;
      const dx = x - state.lastX, dy = y - state.lastY;
      state.velocity = dx * .007;
      state.angle += state.velocity;
      state.pitch = Math.max(.1, Math.min(.9, state.pitch - dy * .003));
      state.lastX = x; state.lastY = y;
    };
    const onUp = () => { state.dragging = false; };

    canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', e => { const t = e.touches[0]; onDown(t.clientX, t.clientY); }, {passive:true});
    canvas.addEventListener('touchmove', e => { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY); }, {passive:false});
    canvas.addEventListener('touchend', onUp, {passive:true});

    // Zoom molette
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      state.zoom = Math.max(.5, Math.min(2, state.zoom - e.deltaY * .001));
    }, {passive:false});

    state._cleanup = () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.removeEventListener('mouseup', onUp);
    };

    return state;
  },

  // ── Viewer panoramique avec vraies photos 360° ───────────
  _initPanoViewer(canvas, ctx, photos, state, rooms) {
    const images = photos.map(src => {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src;
      return img;
    });

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const idx = Math.min(state.room, images.length - 1);
      const img = images[idx];

      ctx.clearRect(0, 0, W, H);

      if (img.complete && img.naturalWidth > 0) {
        this._drawEquirectangular(ctx, img, W, H, state);
      } else {
        this._drawSyntheticRoom(ctx, W, H, state, rooms);
        // Loader
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '14px DM Sans';
        ctx.textAlign = 'center'; ctx.fillText('Chargement…', W/2, H/2);
      }
      this._drawOverlay(ctx, W, H, state, rooms);
      // Inertie
      if (!state.dragging) state.angle += state.velocity * .92;
      state.velocity *= .92;
      state.frame++;
      this.instances[canvas.id] = requestAnimationFrame(draw);
    };
    draw();
  },

  // ── Projection équirectangulaire réelle ─────────────────
  _drawEquirectangular(ctx, img, W, H, state) {
    const fov = (Math.PI / 1.8) / state.zoom;
    const srcW = img.naturalWidth, srcH = img.naturalHeight;
    const centerX = ((state.angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
    const centerY = state.pitch;
    const srcX = Math.floor((centerX / (Math.PI*2)) * srcW - (fov/(Math.PI*2)) * srcW/2);
    const srcY = Math.floor((centerY - fov/(Math.PI*2)) * srcH);
    const srcCropW = Math.floor((fov/(Math.PI*2)) * srcW);
    const srcCropH = Math.floor((fov/Math.PI) * srcH);

    if (srcX + srcCropW <= srcW && srcX >= 0) {
      ctx.drawImage(img, Math.max(0,srcX), Math.max(0,srcY), srcCropW, Math.max(1,srcCropH), 0, 0, W, H);
    } else {
      const w1 = srcW - ((srcX + srcW) % srcW);
      const w2 = srcCropW - w1;
      ctx.drawImage(img, (srcX+srcW)%srcW, Math.max(0,srcY), w1, Math.max(1,srcCropH), 0, 0, W*(w1/srcCropW), H);
      ctx.drawImage(img, 0, Math.max(0,srcY), w2, Math.max(1,srcCropH), W*(w1/srcCropW), 0, W*(w2/srcCropW), H);
    }
    // Vignette
    const vign = ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,W*.7);
    vign.addColorStop(0,'rgba(0,0,0,0)'); vign.addColorStop(1,'rgba(0,0,0,.35)');
    ctx.fillStyle = vign; ctx.fillRect(0,0,W,H);
  },

  // ── Viewer synthétique style architectural ───────────────
  _initSyntheticViewer(canvas, ctx, state, rooms) {
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      this._drawSyntheticRoom(ctx, W, H, state, rooms);
      this._drawOverlay(ctx, W, H, state, rooms);
      if (!state.dragging) state.angle += state.velocity * .92;
      state.velocity *= .92;
      // Auto-rotation lente si pas d'interaction
      if (!state.dragging && Math.abs(state.velocity) < .001) state.angle += .003;
      state.frame++;
      this.instances[canvas.id] = requestAnimationFrame(draw);
    };
    draw();
  },

  _drawSyntheticRoom(ctx, W, H, state, rooms) {
    const room = rooms[state.room] || rooms[0];
    const cos = Math.cos(state.angle), sin = Math.sin(state.angle);
    const pitch = state.topView ? .9 : state.pitch;
    const z = state.zoom;
    const dim = state.lightMode === 'evening' ? .5 : 1;

    const pr = (x, y, zz) => {
      const rx = x*cos - y*sin, ry = x*sin + y*cos;
      const pz = ry * pitch;
      return [rx*W*.38*z - pz*.3, -zz*H*.38*z*.68 + pz*H*.38*z*.5];
    };

    const [br, bg, bb] = this._hex2rgb(room.color);

    // Sky
    const skyG = ctx.createLinearGradient(0, 0, 0, H);
    skyG.addColorStop(0, `rgba(${Math.round(br*.4*dim)},${Math.round(bg*.4*dim)},${Math.round(bb*.4*dim)},1)`);
    skyG.addColorStop(1, `rgba(${Math.round(br*.15*dim)},${Math.round(bg*.15*dim)},${Math.round(bb*.15*dim)},1)`);
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H);

    ctx.save(); ctx.translate(W/2, H/2);

    const v = {
      BFL:pr(-1,-1,0), BFR:pr(1,-1,0), BBL:pr(-1,1,0), BBR:pr(1,1,0),
      TFL:pr(-1,-1,1), TFR:pr(1,-1,1), TBL:pr(-1,1,1), TBR:pr(1,1,1)
    };

    const poly = (pts, fill, alpha=1) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0],p[1]));
      ctx.closePath(); ctx.globalAlpha=alpha; ctx.fillStyle=fill; ctx.fill();
      ctx.strokeStyle='rgba(55,138,221,.06)'; ctx.lineWidth=.5; ctx.stroke();
      ctx.globalAlpha=1;
    };

    const wall = `rgb(${Math.round(180*dim)},${Math.round(188*dim)},${Math.round(200*dim)})`;
    const floor = `rgb(${Math.round(br*.8*dim+40)},${Math.round(bg*.8*dim+50)},${Math.round(bb*.8*dim+60)})`;
    const ceil  = `rgb(${Math.round(br*.3*dim)},${Math.round(bg*.3*dim)},${Math.round(bb*.3*dim)})`;

    poly([v.TFL,v.TFR,v.TBR,v.TBL], ceil);
    poly([v.BFL,v.BFR,v.BBR,v.BBL], floor);
    if (Math.sin(state.angle) < .3) poly([v.TBL,v.TBR,v.BBR,v.BBL], `rgba(160,170,185,${dim})`);
    if (Math.cos(state.angle+.3)>0) poly([v.TFL,v.TBL,v.BBL,v.BFL], wall);
    if (Math.cos(state.angle-.3)<0) poly([v.TFR,v.TBR,v.BBR,v.BFR], `rgba(185,192,205,${dim})`);
    poly([v.TFL,v.TFR,v.BFR,v.BFL], `rgba(195,202,215,${dim})`);

    // Fenêtre avec lumière
    const fw = pr(-.2,-1,.25), fww = pr(.2,-1,.25), fwb = pr(.2,-1,.75), fwbl = pr(-.2,-1,.75);
    const lightC = state.lightMode==='day' ? 'rgba(180,220,255,.85)' : 'rgba(255,180,80,.7)';
    ctx.fillStyle=lightC; ctx.globalAlpha=.55;
    ctx.beginPath(); ctx.moveTo(fw[0],fw[1]); ctx.lineTo(fww[0],fww[1]); ctx.lineTo(fwb[0],fwb[1]); ctx.lineTo(fwbl[0],fwbl[1]); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
    // Croix de fenêtre
    ctx.strokeStyle=`rgba(150,200,255,.4)`; ctx.lineWidth=1;
    const mx=(fw[0]+fww[0])/2, my=(fw[1]+fwb[1])/2;
    ctx.beginPath(); ctx.moveTo(mx,fw[1]); ctx.lineTo(mx,fwb[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fw[0],my); ctx.lineTo(fww[0],my); ctx.stroke();

    // Lumière ambiante
    const lc = pr(0,-1,.5);
    const la = state.lightMode==='day' ? .08 : .12;
    const lColor = state.lightMode==='day' ? 'rgba(180,220,255,' : 'rgba(255,160,80,';
    const lGrad = ctx.createRadialGradient(lc[0],lc[1],0,lc[0],lc[1],W*.5*z);
    lGrad.addColorStop(0,lColor+la*4+')'); lGrad.addColorStop(1,lColor+'0)');
    ctx.fillStyle=lGrad; ctx.fillRect(-W/2,-H/2,W,H);

    // Mobilier selon la pièce
    this._drawFurniture(ctx, room.furniture, pr, dim, state.frame, state.lightMode);

    // Hotspots de navigation au sol (pour changer de pièce)
    const hotspots = [
      {x:.3,y:.4,z:.02,room:1,label:'Salon'},
      {x:-.4,y:.3,z:.02,room:2,label:'Cuisine'},
      {x:.1,y:.6,z:.02,room:3,label:'Chambre'},
    ].filter(h => h.room !== state.room);

    hotspots.forEach((h) => {
      const pt = pr(h.x, h.y, h.z);
      const pulse = .7 + .3*Math.sin((state.frame+40)*.06);
      // Cercle extérieur pulsant
      ctx.beginPath(); ctx.arc(pt[0],pt[1],18*pulse,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,212,255,${.08*pulse})`; ctx.fill();
      // Anneau
      ctx.beginPath(); ctx.arc(pt[0],pt[1],14,0,Math.PI*2);
      ctx.strokeStyle=`rgba(0,212,255,.6)`; ctx.lineWidth=1.5; ctx.stroke();
      // Point central
      ctx.beginPath(); ctx.arc(pt[0],pt[1],5,0,Math.PI*2);
      ctx.fillStyle='rgba(0,212,255,.9)'; ctx.fill();
      // Label
      ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='bold 10px DM Sans';
      ctx.textAlign='center'; ctx.fillText(h.label, pt[0], pt[1]+26);
    });

    ctx.restore();
  },

  _drawFurniture(ctx, type, pr, dim, frame, lightMode) {
    const c1 = `rgba(80,100,130,${dim*.7})`;
    const c2 = `rgba(100,120,150,${dim*.6})`;
    if (type==='living') {
      // Canapé
      const s = [pr(-.5,.2,0),pr(.5,.2,0),pr(.5,.6,0),pr(-.5,.6,0)];
      ctx.fillStyle=c1; ctx.globalAlpha=.8;
      ctx.beginPath(); s.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      // Dossier
      const d = [pr(-.5,.2,.3),pr(.5,.2,.3),pr(.5,.2,0),pr(-.5,.2,0)];
      ctx.beginPath(); d.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      // Table basse
      const t = [pr(-.25,-.15,.05),pr(.25,-.15,.05),pr(.25,.15,.05),pr(-.25,.15,.05)];
      ctx.fillStyle=c2;
      ctx.beginPath(); t.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    if (type==='bedroom') {
      const bed = [pr(-.45,.1,0),pr(.45,.1,0),pr(.45,.75,0),pr(-.45,.75,0)];
      ctx.fillStyle=`rgba(200,210,225,${dim*.7})`; ctx.globalAlpha=.85;
      ctx.beginPath(); bed.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      // Tête de lit
      const h = [pr(-.45,.73,.4),pr(.45,.73,.4),pr(.45,.73,0),pr(-.45,.73,0)];
      ctx.fillStyle=c1;
      ctx.beginPath(); h.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    if (type==='kitchen') {
      for(let k=-2;k<=2;k++){
        const cp=pr(k*.22,.8,.5);
        ctx.fillStyle=`rgba(150,165,185,${dim*.7})`;
        ctx.fillRect(cp[0]-9,cp[1]-14,18,28);
        // Façade
        ctx.strokeStyle=`rgba(100,120,150,${dim*.4})`; ctx.lineWidth=1;
        ctx.strokeRect(cp[0]-7,cp[1]-12,14,24);
      }
      // Plan de travail
      const pt=[pr(-1.1,.78,.55),pr(1.1,.78,.55),pr(1.1,.78,.5),pr(-1.1,.78,.5)];
      ctx.fillStyle=`rgba(180,195,215,${dim*.8})`; ctx.globalAlpha=.9;
      ctx.beginPath(); pt.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    if (type==='exterior') {
      // Balustrade
      for(let k=-3;k<=3;k++){
        const bp=pr(k*.3,.95,.1);
        ctx.fillStyle=`rgba(100,130,180,${dim*.5})`;
        ctx.fillRect(bp[0]-2,bp[1]-20,4,20);
      }
      // Main courante
      const mc=[pr(-1,.94,.35),pr(1,.94,.35)];
      ctx.strokeStyle=`rgba(130,160,200,${dim*.6})`; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(mc[0][0],mc[0][1]); ctx.lineTo(mc[1][0],mc[1][1]); ctx.stroke();
    }
  },

  // ── Overlay UI (compass, infos) ──────────────────────────
  _drawOverlay(ctx, W, H, state, rooms) {
    // Compass en haut à gauche (petit)
    const cx=40, cy=40, cr=18;
    ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2);
    ctx.fillStyle='rgba(4,44,83,.7)'; ctx.fill();
    ctx.strokeStyle='rgba(55,138,221,.4)'; ctx.lineWidth=1; ctx.stroke();
    const na=-state.angle;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(na);
    ctx.fillStyle='rgba(255,80,80,.9)'; ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(3,0); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(0,12); ctx.lineTo(3,0); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle='rgba(255,255,255,.5)'; ctx.font='7px DM Sans'; ctx.textAlign='center';
    const nx=cx+Math.sin(na)*12, ny=cy-Math.cos(na)*12;
    ctx.fillText('N', nx, ny+2.5);
  },

  // ── Méthodes de contrôle exposées ───────────────────────
  rotateLeft(state)  { if(state) { state.velocity = -.08; } },
  rotateRight(state) { if(state) { state.velocity =  .08; } },
  zoomIn(state)      { if(state) state.zoom = Math.min(2.2, state.zoom*1.15); },
  zoomOut(state)     { if(state) state.zoom = Math.max(.5,  state.zoom*.87); },
  toggleTop(state)   { if(!state) return; state.topView=!state.topView; state.pitch=state.topView?.88:.5; },
  toggleLight(state) { if(!state) return; state.lightMode=state.lightMode==='day'?'evening':'day'; },
  switchRoom(state, i, total) {
    if (!state) return;
    state.room = Math.max(0, Math.min(i, (total||6)-1));
    state.angle = 0; state.zoom = 1; state.topView = false; state.pitch = .5; state.velocity = 0;
  },

  // ── Utilitaires ─────────────────────────────────────────
  _hex2rgb(hex) {
    if (!hex || hex.length < 7) return [4, 44, 83];
    return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  },
  _colorFor(type) {
    return {villa:'#042C53',appartement:'#0C447C',duplex:'#185FA5',studio:'#0A1628',bureau:'#1E3A5F'}[type]||'#042C53';
  },
  destroy(canvasId) {
    if (this.instances[canvasId]) { cancelAnimationFrame(this.instances[canvasId]); delete this.instances[canvasId]; }
  },
};
