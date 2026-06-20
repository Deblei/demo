// ── 3D Canvas Engine ───────────────────────────
const Canvas3D = {
  instances: {},

  // Animation de fond pour les cartes de biens (mini)
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
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, `rgb(${br},${bg},${bb})`);
      grad.addColorStop(1, `rgb(${Math.max(0,br-40)},${Math.max(0,bg-40)},${Math.max(0,bb-40)})`);
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // Grille perspective
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      const cx = W * .5, cy = H * .4, sx = W * .22, sy = H * .45;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = cx - sx + t * sx * 2;
        ctx.beginPath(); ctx.moveTo(x, cy - sy * .5); ctx.lineTo(cx + (x - cx) * .1, cy + sy * .2); ctx.stroke();
      }
      for (let j = 0; j <= 4; j++) {
        const t = j / 4, shrink = t;
        ctx.beginPath(); ctx.moveTo(cx - sx * (1 - shrink * .9), cy - sy * .5 + t * sy * .7);
        ctx.lineTo(cx + sx * (1 - shrink * .9), cy - sy * .5 + t * sy * .7); ctx.stroke();
      }
      // Murs
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(cx-sx*.75, cy-sy*.5); ctx.lineTo(cx+sx*.75, cy-sy*.5); ctx.lineTo(cx+sx*.75, cy+sy*.1); ctx.lineTo(cx-sx*.75, cy+sy*.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Fenêtre lumineuse
      const a = Math.sin(frame * .02) * .1 + .4;
      ctx.strokeStyle = `rgba(212,168,67,${a})`; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - sx * .18, cy - sy * .42, sx * .36, sy * .42);
      const lg = ctx.createRadialGradient(cx, cy - sy * .2, 0, cx, cy - sy * .2, sx * .5);
      lg.addColorStop(0, `rgba(212,168,67,${a * .2})`); lg.addColorStop(1, 'rgba(212,168,67,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      // Points chauds pulsants
      const spots = [{x:cx*.72,y:cy+.1*sy},{x:cx*1.28,y:cy+.18*sy},{x:cx,y:cy-sy*.12}];
      spots.forEach((sp, i) => {
        const p = Math.sin((frame + i * 40) * .05) * .5 + .5;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 7 + p * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,168,67,${.15 + p * .2})`; ctx.fill();
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,168,67,.85)'; ctx.fill();
      });
      frame++;
      this.instances[canvasId] = requestAnimationFrame(draw);
    };
    draw();
  },

  // Viewer immersif 3D — utilise les photos 360° uploadées ou génère un environnement synthétique
  initViewer(canvasId, bien) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 450;

    const photos360 = bien?.photos_360 || [];
    const hasRealPhotos = photos360.length > 0;

    const state = {
      angle: 0, pitch: .22, zoom: 1,
      dragging: false, lastX: 0, lastY: 0,
      room: 0, lightMode: 'day', topView: false,
      frame: 0, autoAnim: null,
      color: bien?.color || '#042C53'
    };

    const rooms = ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Terrasse'];

    // Si photos 360 réelles → essayer de les afficher en projection équirectangulaire
    if (hasRealPhotos) {
      this._initEquirectangular(canvas, ctx, photos360, state);
    } else {
      this._initSynthetic(canvas, ctx, state, rooms);
    }

    // Interactions
    canvas.addEventListener('mousedown', e => { state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY; clearInterval(state.autoAnim); });
    window.addEventListener('mousemove', e => {
      if (!state.dragging) return;
      state.angle += (e.clientX - state.lastX) * .007;
      state.pitch = Math.max(.05, Math.min(.95, state.pitch - (e.clientY - state.lastY) * .004));
      state.lastX = e.clientX; state.lastY = e.clientY;
    });
    window.addEventListener('mouseup', () => { state.dragging = false; });
    canvas.addEventListener('touchstart', e => { const t = e.touches[0]; state.dragging=true; state.lastX=t.clientX; state.lastY=t.clientY; clearInterval(state.autoAnim); }, {passive:true});
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      state.angle += (t.clientX - state.lastX) * .007;
      state.pitch = Math.max(.05, Math.min(.95, state.pitch - (t.clientY - state.lastY) * .004));
      state.lastX = t.clientX; state.lastY = t.clientY;
    }, {passive:false});
    canvas.addEventListener('touchend', () => { state.dragging = false; }, {passive:true});

    return state;
  },

  rotateLeft(state)  { if(state) state.angle -= .15; },
  rotateRight(state) { if(state) state.angle += .15; },
  zoomIn(state)      { if(state) state.zoom = Math.min(2.2, state.zoom * 1.12); },
  zoomOut(state)     { if(state) state.zoom = Math.max(.5, state.zoom * .88); },
  toggleTop(state)   { if(!state) return; state.topView = !state.topView; state.pitch = state.topView ? .9 : .22; },
  toggleLight(state) { if(!state) return; state.lightMode = state.lightMode === 'day' ? 'evening' : 'day'; },
  switchRoom(state, i) { if(state) { state.room = i; state.angle = 0; state.zoom = 1; state.topView = false; state.pitch = .22; } },

  // Projection équirectangulaire réelle pour les photos 360°
  _initEquirectangular(canvas, ctx, photos, state) {
    const images = [];
    const loaded = [];
    photos.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { loaded[i] = true; };
      img.onerror = () => { loaded[i] = false; };
      img.src = src;
      images.push(img);
    });

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const imgIdx = state.room % images.length;
      const img = images[imgIdx];

      if (loaded[imgIdx] && img.complete && img.naturalWidth > 0) {
        // Rendu équirectangulaire simplifié (projection panoramique)
        ctx.clearRect(0, 0, W, H);
        const fovH = Math.PI / (1 + (state.zoom - 1) * .5);
        const aspect = W / H;
        const fovV = fovH / aspect;
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        // Calculer la région source en fonction de l'angle et du pitch
        const centerX = ((state.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const centerY = (.5 - (state.pitch - .22) * .3);
        const srcX = ((centerX / (Math.PI * 2)) * srcW - (fovH / (Math.PI * 2)) * srcW / 2 + srcW) % srcW;
        const srcY = Math.max(0, Math.min(srcH - 1, (centerY - fovV / (Math.PI) * srcH / 2)));
        const srcCropW = (fovH / (Math.PI * 2)) * srcW;
        const srcCropH = Math.min(srcH * .8, (fovV / Math.PI) * srcH * 2);

        // Gérer le wrap horizontal
        if (srcX + srcCropW <= srcW) {
          ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, 0, 0, W, H);
        } else {
          const w1 = srcW - srcX;
          const w2 = srcCropW - w1;
          ctx.drawImage(img, srcX, srcY, w1, srcCropH, 0, 0, W * (w1 / srcCropW), H);
          ctx.drawImage(img, 0, srcY, w2, srcCropH, W * (w1 / srcCropW), 0, W * (w2 / srcCropW), H);
        }
        // Overlay léger
        const vgTop = ctx.createLinearGradient(0, 0, 0, H * .3);
        vgTop.addColorStop(0, 'rgba(0,0,0,.35)'); vgTop.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = vgTop; ctx.fillRect(0, 0, W, H * .3);
        const vgBot = ctx.createLinearGradient(0, H * .7, 0, H);
        vgBot.addColorStop(0, 'rgba(0,0,0,0)'); vgBot.addColorStop(1, 'rgba(0,0,0,.4)');
        ctx.fillStyle = vgBot; ctx.fillRect(0, H * .7, W, H * .3);
      } else {
        // Fallback synthétique pendant le chargement
        this._drawSynthetic(ctx, W, H, state);
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '14px DM Sans';
        ctx.textAlign = 'center'; ctx.fillText('Chargement de la photo 360°…', W/2, H/2);
      }
      state.frame++;
      requestAnimationFrame(draw);
    };
    draw();
  },

  // Rendu synthétique WebGL-style
  _initSynthetic(canvas, ctx, state, rooms) {
    const draw = () => {
      this._drawSynthetic(ctx, canvas.width, canvas.height, state);
      state.frame++;
      requestAnimationFrame(draw);
    };
    draw();
  },

  _drawSynthetic(ctx, W, H, state) {
    const cos = Math.cos(state.angle), sin = Math.sin(state.angle);
    const p = state.topView ? .9 : state.pitch;
    const z = state.zoom;

    function pr(x, y, zz) {
      const rx = x * cos - y * sin, ry = x * sin + y * cos;
      const pz = ry * p;
      return [rx * W * .38 * z - pz * .3, -zz * H * .38 * z * .68 + pz * H * .38 * z * .5];
    }

    const [br, bg, bb] = Canvas3D._hex2rgb(state.color);
    const dim = state.lightMode === 'evening' ? .55 : 1;

    // Sky/ceiling
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, `rgba(${Math.round(br*dim*.4)},${Math.round(bg*dim*.4)},${Math.round(bb*dim*.4)},1)`);
    skyGrad.addColorStop(1, `rgba(${Math.round(br*dim*.15)},${Math.round(bg*dim*.15)},${Math.round(bb*dim*.15)},1)`);
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);

    ctx.save(); ctx.translate(W/2, H/2);

    const v = {
      BFL:pr(-1,-1,0),BFR:pr(1,-1,0),BBL:pr(-1,1,0),BBR:pr(1,1,0),
      TFL:pr(-1,-1,1),TFR:pr(1,-1,1),TBL:pr(-1,1,1),TBR:pr(1,1,1)
    };

    function poly(pts, fill, alpha = 1) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(pt => ctx.lineTo(pt[0], pt[1]));
      ctx.closePath(); ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = .5; ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const wallClr = `rgb(${Math.round(210*dim)},${Math.round(205*dim)},${Math.round(195*dim)})`;
    const floorClr = `rgb(${Math.round(br*dim*.9)},${Math.round(bg*dim*.7)},${Math.round(bb*dim*.5)})`;
    const ceilClr = `rgb(${Math.round(br*dim*.3)},${Math.round(bg*dim*.3)},${Math.round(bb*dim*.3)})`;

    // Plafond
    poly([v.TFL,v.TFR,v.TBR,v.TBL], ceilClr);
    // Sol
    poly([v.BFL,v.BFR,v.BBR,v.BBL], floorClr);
    // Murs
    if (Math.sin(state.angle) < .3)
      poly([v.TBL,v.TBR,v.BBR,v.BBL], `rgba(${Math.round(190*dim)},${Math.round(185*dim)},${Math.round(175*dim)},1)`);
    if (Math.cos(state.angle + .3) > 0)
      poly([v.TFL,v.TBL,v.BBL,v.BFL], wallClr);
    if (Math.cos(state.angle - .3) < 0)
      poly([v.TFR,v.TBR,v.BBR,v.BFR], `rgba(${Math.round(200*dim)},${Math.round(195*dim)},${Math.round(185*dim)},1)`);
    poly([v.TFL,v.TFR,v.BFR,v.BFL], `rgba(${Math.round(215*dim)},${Math.round(210*dim)},${Math.round(200*dim)},1)`);

    // Fenêtre lumineuse
    const fw = pr(-.15, -1, .3), fww = pr(.15, -1, .3), fwb = pr(.15, -1, .75), fwbl = pr(-.15, -1, .75);
    const light = state.lightMode === 'day' ? 'rgba(200,220,255,.9)' : 'rgba(255,160,80,.7)';
    ctx.fillStyle = light; ctx.globalAlpha = .6;
    ctx.beginPath(); ctx.moveTo(fw[0],fw[1]); ctx.lineTo(fww[0],fww[1]); ctx.lineTo(fwb[0],fwb[1]); ctx.lineTo(fwbl[0],fwbl[1]); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;

    // Rayons de lumière
    const lightAlpha = state.lightMode === 'day' ? .04 : .07;
    const lightColor = state.lightMode === 'day' ? 'rgba(255,240,200,' : 'rgba(255,140,60,';
    const lightCenter = pr(0, -1, .5);
    const lightGrad = ctx.createRadialGradient(lightCenter[0], lightCenter[1], 0, lightCenter[0], lightCenter[1], W * .6 * z);
    lightGrad.addColorStop(0, lightColor + (lightAlpha * 4) + ')');
    lightGrad.addColorStop(1, lightColor + '0)');
    ctx.fillStyle = lightGrad; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(lightCenter[0], lightCenter[1], W * .6 * z, 0, Math.PI * 2); ctx.fill();

    // Mobilier selon la pièce
    Canvas3D._drawFurniture(ctx, state.room, pr, dim, state.frame);

    // Points chauds pulsants
    const hotspots = [
      {x:.25,y:.55,z:.1,label:'Parquet'},
      {x:.6,y:.3,z:.6,label:'Fenêtre'},
      {x:-.5,y:-.1,z:.3,label:'Mur'}
    ];
    hotspots.forEach((h, i) => {
      const pt = pr(h.x, h.y, h.z);
      const pulse = .7 + .3 * Math.sin((state.frame + i * 40) * .05);
      ctx.beginPath(); ctx.arc(pt[0], pt[1], 9 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,168,67,${.2 * pulse})`; ctx.fill();
      ctx.beginPath(); ctx.arc(pt[0], pt[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212,168,67,.9)'; ctx.fill();
      // Label
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.font = '10px DM Sans';
      ctx.textAlign = 'center'; ctx.fillText(h.label, pt[0], pt[1] + 16);
    });

    ctx.restore();
  },

  _drawFurniture(ctx, room, pr, dim, frame) {
    const acc = `rgba(180,140,60,${dim})`;
    if (room === 0) { // Salon
      const sofaPts = [pr(-.4,.15,0),pr(.4,.15,0),pr(.4,.55,0),pr(-.4,.55,0)];
      const sofaTop = [pr(-.4,.15,.22),pr(.4,.15,.22),pr(.4,.55,.22),pr(-.4,.55,.22)];
      ctx.fillStyle=acc; ctx.globalAlpha=.8;
      ctx.beginPath(); sofaPts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.beginPath(); sofaTop.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    if (room === 1) { // Chambre
      const bedBase = [pr(-.45,.1,0),pr(.45,.1,0),pr(.45,.7,0),pr(-.45,.7,0)];
      ctx.fillStyle=`rgba(240,235,225,${dim})`; ctx.globalAlpha=.85;
      ctx.beginPath(); bedBase.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill();
      ctx.globalAlpha=1;
    }
    if (room === 2) { // Cuisine
      for(let k=-2;k<=2;k++){
        const cp=pr(k*.2,.8,0); ctx.fillStyle=`rgba(180,175,170,${dim})`;
        ctx.fillRect(cp[0]-8,cp[1]-4,16,8);
      }
    }
  },

  _hex2rgb(hex) {
    return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  },

  destroy(canvasId) {
    if (this.instances[canvasId]) {
      cancelAnimationFrame(this.instances[canvasId]);
      delete this.instances[canvasId];
    }
  }
};
