// Draws one curved arrow from the end of each ticked "Is this you?" line to the
// "This is me" column. The three trails merge into a single arrowhead.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.querySelector(".arrows");
  const main = document.querySelector("main");
  const lines = [...document.querySelectorAll(".checks li > span")];
  const target = document.querySelector(".me h1");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let drawn = false;

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  // Animates a path drawing itself in, after a delay.
  function growIn(path, delay) {
    if (still || drawn) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: 900, delay, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }
    );
  }

  function draw() {
    svg.replaceChildren();
    if (getComputedStyle(svg).display === "none") return;
    const box = main.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const tx = t.left - box.left - 14;
    const ty = t.top - box.top + t.height / 2;
    const reach = Math.max(24, tx - 24);

    lines.forEach((line, i) => {
      // Measure the words, not the span: as a grid item it fills the column.
      const range = document.createRange();
      range.selectNodeContents(line);
      const rects = range.getClientRects();
      const end = rects[rects.length - 1];
      const x0 = Math.min(end.right - box.left + 16, reach);
      const y0 = end.top - box.top + end.height / 2;
      const pull = (tx - x0) * 0.55;
      const d = `M${x0},${y0} C${x0 + pull},${y0} ${tx - pull},${ty} ${tx},${ty}`;
      svg.append(el("circle", { cx: x0, cy: y0, r: 3.5 }));
      const trail = el("path", { d, class: "trail" });
      svg.append(trail);
      growIn(trail, 450 + i * 260); // just after its tick
    });

    const head = el("path", { d: `M${tx - 9},${ty - 6} L${tx},${ty} L${tx - 9},${ty + 6}` });
    svg.append(head);
    if (!still && !drawn) {
      head.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 1750, fill: "backwards" });
    }
    drawn = true;
  }

  // Redraw whenever the layout moves: fonts arriving, resizes, reflow.
  // Wait for fonts first so the arrows grow in once, at their final positions.
  let ready = false;
  new ResizeObserver(() => ready && draw()).observe(main);
  document.fonts.ready.then(() => { ready = true; draw(); });
})();
