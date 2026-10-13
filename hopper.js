/**
 * Hopper: a tiered sorting hopper with four descending concentric rings
 * narrowing to a collection base. The tier under the pointer steps outward,
 * with its indicator notch highlighted, while neighbouring tiers settle with
 * a stagger. The slider sets the stagger in ms.
 *
 * Pattern: discrete tiers with tweens, staggered by distance, geometry-carried
 * status, and static hit testing along the rest centres.
 */
const {
  Cam, clamp, facing, fit, lerp, mk, place, pointer, poly,
  prism, proj, reflect, register, rings, rrect, seg,
  tdone, tset, tval, tween, disposer,
} = HL;

const N = 4;
const TIERS = [
  { w: 38, r: 10, z0: 64, z1: 76, dots: 7, name: "tier 1" },
  { w: 29, r: 8,  z0: 42, z1: 54, dots: 5, name: "tier 2" },
  { w: 20, r: 5,  z0: 20, z1: 32, dots: 3, name: "tier 3" },
  { w: 12, r: 3,  z0: 0,  z1: 12, dots: 1, name: "tier 4" },
];

const B_INSET = 1.3, BASE_W = 46, BASE_R = 12;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.48);
  fit(C, [
    [-BASE_W - 8, -BASE_W - 8, -8], [BASE_W + 18, BASE_W + 18, -8],
    [-48, -48, 84], [64, 64, 84], [-BASE_W, BASE_W, 0], [BASE_W, -BASE_W, 0],
  ], 200, 166);

  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // Ground base tray
  const [bOuter, bInner] = rings(-BASE_W, -BASE_W, BASE_W, BASE_W, BASE_R, 2.0);
  reflect(svg, g, P, front, bOuter, -6, 10);
  const baseSolid = prism(P, front, bOuter, bInner, -6, 0);
  mk("path", { d: baseSolid.sil, class: "lo" }, g);
  if (baseSolid.crease) mk("path", { d: baseSolid.crease, class: "nf lo" }, g);

  // Four corner guide shafts
  [[-34, -34], [34, -34], [-34, 34], [34, 34]].forEach(([sx, sy]) => {
    const sr = rrect(sx - 1.8, sy - 1.8, sx + 1.8, sy + 1.8, 0.6, 4);
    const sp = prism(P, front, sr, null, -6, 78);
    mk("path", { d: sp.sil, class: "lo" }, g);
  });

  // Tiers back to front (bottom to top)
  const tiers = [];
  for (let i = N - 1; i >= 0; i--) {
    const info = TIERS[i], grp = mk("g", {}, g);
    const sil = mk("path", { class: "sil" }, grp);
    const crease = mk("path", { class: "nf lo" }, grp);
    const notch = mk("path", { class: "nf lo" }, grp);

    const dotEls = [];
    for (let k = 0; k < info.dots; k++) {
      dotEls.push(mk("circle", { r: 1.1, class: (i === 0 && k === 3) ? "dot" : "dot off" }, grp));
    }

    tiers[i] = {
      ...info, index: i, grp, sil, crease, notch, dotEls,
      shift: tween(0), lift: tween(0),
    };
  }

  function drawTier(i, s, l) {
    const t = tiers[i], w = t.w, r = t.r;
    const [ring, inner] = rings(-w + s, -w + s, w + s, w + s, r, B_INSET);
    const z0 = t.z0 + l, z1 = t.z1 + l;

    const pr = prism(P, front, ring, inner, z0, z1);
    t.sil.setAttribute("d", pr.sil);
    t.crease.setAttribute("d", pr.crease);

    const nW = Math.min(w * 0.5, 10);
    t.notch.setAttribute("d", seg(P(-nW + s, w + s, z1 - 1.0), P(nW + s, w + s, z1 - 1.0)));

    const count = t.dots;
    for (let k = 0; k < count; k++) {
      const u = count === 1 ? s : lerp(-w * 0.6 + s, w * 0.6 + s, k / (count - 1));
      place(t.dotEls[k], P(u, w + s - 1.6, z1));
    }
  }

  for (let i = 0; i < N; i++) drawTier(i, 0, 0);
  read.textContent = "rest";

  const tierCentres = TIERS.map((t) => P(0, 0, (t.z0 + t.z1) / 2));

  function hit([x, y]) {
    let best = -1, bestDist = 42;
    for (let i = 0; i < N; i++) {
      const c = tierCentres[i];
      const dx = (x - c[0]) / (TIERS[i].w * 1.3), dy = (y - c[1]) / 13;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.0 && dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (let i = 0; i < N; i++) {
      const t = tiers[i];
      drawTier(i, tval(t.shift, now), tval(t.lift, now));
      if (!tdone(t.shift, now) || !tdone(t.lift, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : (act >= 0 ? act : 0);
    act = a;
    for (let i = 0; i < N; i++) {
      const t = tiers[i];
      const delay = Math.abs(i - from) * stag;
      const targetShift = a === i ? 14 : (a >= 0 ? clamp(6 - Math.abs(i - a) * 3, 0, 6) : 0);
      const targetLift = a === i ? 4 : 0;
      tset(t.shift, targetShift, now, delay);
      tset(t.lift, targetLift, now, delay);

      const isActive = (i === a);
      t.sil.classList.toggle("hi", isActive);
      t.notch.classList.toggle("hi", isActive || (a < 0 && i === 0));

      t.dotEls.forEach((dot, k) => {
        if (isActive) dot.setAttribute("class", "dot " + (k % 2 === 0 ? "" : "m"));
        else if (a < 0 && i === 0 && k === 3) dot.setAttribute("class", "dot");
        else dot.setAttribute("class", "dot off");
      });
    }
    read.textContent = a < 0 ? "rest" : TIERS[a].name;
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => setActive(hit(p)),
    leave: () => setActive(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "hopper",
  means: "A four-tier sorting hopper: the tier under the pointer steps outward, passing filtered beads down to the catchment.",
  rules: [1, 2, 4, 8, 9, 10],
  range: [0, 40, 80],
  tour: [[200, 95], [200, 140], [200, 185], [200, 230], null],
  mount,
});
