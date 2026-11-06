// Draws the tree-ring cross-section behind the page and grows it once on load.
(() => {
  const canvas = document.getElementById("rings");
  const ctx = canvas.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const SAP = css.getPropertyValue("--sap").trim();
  const DEEP = css.getPropertyValue("--leaf-deep").trim();
  const BUD = css.getPropertyValue("--bud").trim();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Seeded so the same tree grows on every visit.
  function seeded(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = seeded(1987);

  // Shared lobes give the trunk its shape; each year nudges them a little.
  const lobes = [2, 3, 5, 7].map((k, i) => ({
    k,
    amp: [0.035, 0.022, 0.009, 0.005][i],
    phase: rand() * Math.PI * 2,
  }));

  // Growth years: mostly steady, some fat wet summers, some thin dry ones.
  const years = [];
  for (let i = 0; i < 140; i++) {
    let w = 0.55 + rand() * 0.75;
    if (rand() < 0.14) w *= 0.35;
    if (rand() < 0.08) w *= 1.6;
    years.push({ w, drift: (rand() - 0.5) * 0.4, late: rand() < 0.22 });
  }

  let rings = [];
  let cx = 0, cy = 0, reach = 0;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const narrow = w < 700;
    cx = narrow ? w * 0.66 : w * 0.72;
    cy = narrow ? h * 0.27 : h * 0.44;
    reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.05;
    const unit = Math.min(w, h) / (narrow ? 34 : 40);

    rings = [];
    let r = unit * 0.6;
    for (const y of years) {
      r += y.w * unit;
      rings.push({ r, drift: y.drift, late: y.late });
      if (r > reach) break;
    }
  }

  function ringPath({ r, drift }) {
    // The pith sits off-centre: the tree grew faster on its sunny side.
    const ox = cx - r * 0.07, oy = cy + r * 0.035;
    const steps = 200;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      let d = 1;
      for (const l of lobes) d += l.amp * Math.sin(l.k * a + l.phase + drift * 0.3);
      d += 0.004 * Math.sin(11 * a + drift * 9);
      const x = ox + Math.cos(a) * r * d, y = oy + Math.sin(a) * r * d;
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function draw(upTo) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const ring of rings) {
      if (ring.r > upTo) break;
      const fade = 1 - Math.min(1, ring.r / reach) * 0.55;
      ringPath(ring);
      if (ring.late) {
        ctx.strokeStyle = DEEP;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.strokeStyle = SAP;
      ctx.globalAlpha = (ring.late ? 0.2 : 0.11) * fade;
      ctx.lineWidth = ring.late ? 1.25 : 0.9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = BUD;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3, Math.min(innerWidth, innerHeight) / 160), 0, Math.PI * 2);
    ctx.fill();
  }

  function grow() {
    if (still) return draw(Infinity);
    const start = performance.now(), dur = 2200;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      draw((1 - Math.pow(1 - t, 3)) * reach);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  let timer;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { layout(); draw(Infinity); }, 120);
  });

  layout();
  grow();
})();
