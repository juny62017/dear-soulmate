(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });

  let W, H, dpr;
  let tiltX = 0, tiltY = 0;

  const NS = 160;
  const stX = new Float32Array(NS), stY = new Float32Array(NS),
    stR = new Float32Array(NS), stSp = new Float32Array(NS),
    stOf = new Float32Array(NS), stPr = new Float32Array(NS);
  function initStars() {
    for (let i = 0; i < NS; i++) {
      stX[i] = Math.random() * W; stY[i] = Math.random() * H;
      stR[i] = Math.random() * .9 + .2; stSp[i] = Math.random() * .01 + .003;
      stOf[i] = Math.random() * 6.28; stPr[i] = Math.random() * .25 + .05;
    }
  }
  function drawStars(t) {
    ctx.fillStyle = '#fff'; ctx.globalAlpha = .55; ctx.beginPath();
    for (let i = 0; i < NS; i++) {
      const tw = Math.sin(t * stSp[i] * 60 + stOf[i]) * .22 + .78;
      const px = stX[i] + tiltX * stPr[i], py = stY[i] + tiltY * stPr[i];
      const rr = stR[i] * tw;
      ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, 6.2832);
    }
    ctx.fill(); ctx.globalAlpha = 1;
  }

  const soulA = {
    x: 0, y: 0, tx: 0, ty: 0, radius: 20, isDragging: false, touchId: null,
    r: 255, g: 105, b: 180, scaredVx: 0, scaredVy: 0, scared: false
  };
  const soulB = {
    x: 0, y: 0, tx: 0, ty: 0, radius: 20, isDragging: false, touchId: null,
    r: 255, g: 60, b: 60, scaredVx: 0, scaredVy: 0, scared: false
  };

  function placeSouls() {
    if (W < H) { soulA.x = W * .5; soulA.y = H * .28; soulB.x = W * .5; soulB.y = H * .72; }
    else { soulA.x = W * .28; soulA.y = H * .5; soulB.x = W * .72; soulB.y = H * .5; }
    soulA.tx = soulA.x; soulA.ty = soulA.y; soulB.tx = soulB.x; soulB.ty = soulB.y;
  }

  function drawSoul(s, now) {
    const pulse = Math.sin(now * .002) * .1 + .9;
    const x = s.x, y = s.y, r = s.radius;
    const rc = s.r, gc = s.g, bc = s.b;
    const g1 = ctx.createRadialGradient(x, y, 0, x, y, r * 4 * pulse);
    g1.addColorStop(0, `rgba(${rc},${gc},${bc},.15)`);
    g1.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
    ctx.beginPath(); ctx.arc(x, y, r * 4 * pulse, 0, 6.2832); ctx.fillStyle = g1; ctx.fill();
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
    g2.addColorStop(0, 'rgba(255,255,255,.95)');
    g2.addColorStop(.35, `rgba(${rc},${gc},${bc},1)`);
    g2.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
    ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 6.2832); ctx.fillStyle = g2; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * .42, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
  }

  function render(now) {
    requestAnimationFrame(render);
    ctx.fillStyle = 'rgba(0,0,15,.15)';
    ctx.fillRect(0, 0, W, H);

    drawStars(now);

    soulA.x += (soulA.tx - soulA.x) * .07; soulA.y += (soulA.ty - soulA.y) * .07;
    soulB.x += (soulB.tx - soulB.x) * .07; soulB.y += (soulB.ty - soulB.y) * .07;

    ctx.globalCompositeOperation = 'screen';
    drawSoul(soulA, now); drawSoul(soulB, now);
    ctx.globalCompositeOperation = 'source-over';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#00000f'; ctx.fillRect(0, 0, W, H);
    initStars();
    placeSouls();
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(render);
})();
