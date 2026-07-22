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

  let heartProgress = 0, heartFill = 0, heartScale = 0;

  const HEART_RES = 256;
  const hpx = new Float32Array(HEART_RES);
  const hpy = new Float32Array(HEART_RES);

  function buildHeartPts() {
    for (let i = 0; i < HEART_RES; i++) {
      const t = (i / HEART_RES) * Math.PI * 2;
      hpx[i] = 16 * Math.pow(Math.sin(t), 3);
      hpy[i] = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    }
  }

  function computeHeartScale(now) {
    const base = (Math.min(W, H) * 0.38) / 32;
    const cycle = (now * 0.0013) % 1;
    let pulse = 0;
    if (cycle < 0.12) pulse = Math.sin((cycle / 0.12) * Math.PI);
    else if (cycle > 0.18 && cycle < 0.35) pulse = 0.5 * Math.sin(((cycle - 0.18) / 0.17) * Math.PI);
    return base * (1 + pulse * 0.12);
  }

  function drawBigHeart(cx, cy, hs, progress, fill, now) {
    if (progress <= 0) return;
    const maxMult = Math.min(W, H) * 0.88 / (32 * hs);
    const BM = Math.min(1.9, maxMult);
    const s = hs * BM;
    const pts = Math.min(HEART_RES, (progress * HEART_RES + 1) | 0);

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.moveTo(hpx[0] * s, hpy[0] * s);
    for (let i = 1; i < pts; i++) ctx.lineTo(hpx[i] * s, hpy[i] * s);
    if (progress >= .99) ctx.closePath();

    if (fill > 0) {
      const fillPulse = Math.sin(now * .005) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(220, 20, 60, ${fill * fillPulse})`;
      ctx.fill();
    }

    const strokeAlpha = progress >= .99
      ? 0.7 + Math.sin(now * .003) * .3
      : 0.8;
    ctx.strokeStyle = `rgba(255,100,100,${strokeAlpha.toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(255, 0, 0, 1)';
    ctx.shadowBlur = 25;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(hpx[0] * s, hpy[0] * s);
    for (let i = 1; i < pts; i++) ctx.lineTo(hpx[i] * s, hpy[i] * s);
    if (progress >= .99) ctx.closePath();
    const glowGrad = ctx.createLinearGradient(-s * 16, 0, s * 16, 0);
    glowGrad.addColorStop(0, 'rgba(255,0,0,.8)');
    glowGrad.addColorStop(.5, 'rgba(255,100,100,.8)');
    glowGrad.addColorStop(1, 'rgba(255,0,0,.8)');
    ctx.strokeStyle = glowGrad;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.restore();
  }

  const N = 350, F = 10;
  const pA = new Float32Array(N * F), pB = new Float32Array(N * F);
  const ptBuf = new Float32Array(N * 3);

  function resetP(arr, i, ox, oy) {
    const o = i * F, a = Math.random() * 6.2832, r = Math.random() * 38 + 8;
    arr[o] = ox + Math.cos(a) * r; arr[o + 1] = oy + Math.sin(a) * r;
    arr[o + 2] = (Math.random() - .5) * .55; arr[o + 3] = (Math.random() - .5) * .55;
    arr[o + 4] = Math.random() * .5 + .5; arr[o + 5] = Math.random() * .0038 + .002;
    arr[o + 6] = Math.random() * 1.3 + .35;
    arr[o + 7] = Math.random() * 6.2832; arr[o + 8] = Math.random() * 36 + 8;
    arr[o + 9] = (Math.random() - .5) * .013;
  }
  function initParticles() {
    for (let i = 0; i < N; i++) { resetP(pA, i, soulA.x, soulA.y); resetP(pB, i, soulB.x, soulB.y); }
  }

  function updateDrawParticles() {
    ctx.globalCompositeOperation = 'screen';
    let c = 0;
    for (let i = 0; i < N; i++) {
      const o = i * F; let vx = pA[o + 2], vy = pA[o + 3];
      pA[o + 7] += pA[o + 9];
      vx += (soulA.x + Math.cos(pA[o + 7]) * pA[o + 8] - pA[o]) * .04;
      vy += (soulA.y + Math.sin(pA[o + 7]) * pA[o + 8] - pA[o + 1]) * .04;
      pA[o + 2] = vx * .88; pA[o + 3] = vy * .88; pA[o] += pA[o + 2]; pA[o + 1] += pA[o + 3];
      pA[o + 4] -= pA[o + 5];
      if (pA[o + 4] <= 0) { resetP(pA, i, soulA.x, soulA.y); continue; }
      ptBuf[c * 3] = pA[o]; ptBuf[c * 3 + 1] = pA[o + 1]; ptBuf[c * 3 + 2] = pA[o + 6]; c++;
    }
    ctx.fillStyle = 'rgba(255,105,180,.8)'; ctx.beginPath();
    for (let i = 0; i < c; i++) { const r = ptBuf[i * 3 + 2]; ctx.moveTo(ptBuf[i * 3] + r, ptBuf[i * 3 + 1]); ctx.arc(ptBuf[i * 3], ptBuf[i * 3 + 1], r, 0, 6.2832); }
    ctx.fill();
    c = 0;
    for (let i = 0; i < N; i++) {
      const o = i * F; let vx = pB[o + 2], vy = pB[o + 3];
      pB[o + 7] += pB[o + 9];
      vx += (soulB.x + Math.cos(pB[o + 7]) * pB[o + 8] - pB[o]) * .04;
      vy += (soulB.y + Math.sin(pB[o + 7]) * pB[o + 8] - pB[o + 1]) * .04;
      pB[o + 2] = vx * .88; pB[o + 3] = vy * .88; pB[o] += pB[o + 2]; pB[o + 1] += pB[o + 3];
      pB[o + 4] -= pB[o + 5];
      if (pB[o + 4] <= 0) { resetP(pB, i, soulB.x, soulB.y); continue; }
      ptBuf[c * 3] = pB[o]; ptBuf[c * 3 + 1] = pB[o + 1]; ptBuf[c * 3 + 2] = pB[o + 6]; c++;
    }
    ctx.fillStyle = 'rgba(255,60,60,.8)'; ctx.beginPath();
    for (let i = 0; i < c; i++) { const r = ptBuf[i * 3 + 2]; ctx.moveTo(ptBuf[i * 3] + r, ptBuf[i * 3 + 1]); ctx.arc(ptBuf[i * 3], ptBuf[i * 3 + 1], r, 0, 6.2832); }
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

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
    heartScale = computeHeartScale(now);

    soulA.x += (soulA.tx - soulA.x) * .07; soulA.y += (soulA.ty - soulA.y) * .07;
    soulB.x += (soulB.tx - soulB.x) * .07; soulB.y += (soulB.ty - soulB.y) * .07;

    updateDrawParticles();

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
    buildHeartPts();
    initStars();
    placeSouls();
    initParticles();
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(render);
})();
