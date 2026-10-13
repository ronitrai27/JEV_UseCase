/**
 * Agent: an autonomous agent execution core with four satellite tool pods.
 * Continuous data pulses route through conduits while the core executes;
 * hovering inspects individual sub-agents and tool execution registers.
 */
const {
  Cam, clamp, facing, fit, lerp, mk, place, pointer,
  prism, proj, reflect, register, rings, rrect, seg,
  tdone, tset, tval, tween, disposer,
} = HL;

const PODS = [
  { x: -32, y: -32, name: "plan", w: 14, r: 4, h: 14 },
  { x: 32, y: -32, name: "search", w: 14, r: 4, h: 14 },
  { x: 32, y: 32, name: "code", w: 14, r: 4, h: 14 },
  { x: -32, y: 32, name: "eval", w: 14, r: 4, h: 14 },
];

const CORE_W = 20, CORE_R = 6, CORE_H = 22;

function mount({ stage, svg, read }) {
  const bag = disposer();

  const C = Cam(45, 0.5, 1.58);
  fit(C, [
    [-48, -48, -4], [48, 48, -4],
    [-48, -48, 28], [48, 48, 28],
    [-CORE_W, CORE_W, CORE_H + 8], [CORE_W, -CORE_W, CORE_H + 8],
  ], 200, 160);

  const P = proj(C), front = facing(C), g = mk("g", {}, svg);

  // Ground base bus platform
  const [baseOut, baseIn] = rings(-44, -44, 44, 44, 12, 1.8);
  reflect(svg, g, P, front, baseOut, -4, 8);
  const basePrism = prism(P, front, baseOut, baseIn, -4, 0);
  mk("path", { d: basePrism.sil, class: "lo" }, g);
  if (basePrism.crease) mk("path", { d: basePrism.crease, class: "nf lo" }, g);

  // Bus conduit lines connecting pods to core
  const conduits = PODS.map((p) => {
    const d = seg(P(p.x * 0.45, p.y * 0.45, 0), P(p.x * 0.85, p.y * 0.85, 0));
    return mk("path", { d, class: "nf dash" }, g);
  });

  // Animated execution pulse beads traveling along conduits
  const pulses = PODS.map((_p) => mk("circle", { r: 1.2, class: "dot" }, g));

  // Satellite Tool Pods
  const podNodes = PODS.map((p, i) => {
    const grp = mk("g", {}, g);
    const sil = mk("path", { class: "sil" }, grp);
    const cr = mk("path", { class: "nf lo" }, grp);
    const notch = mk("path", { class: "nf lo" }, grp);
    const indicator = mk("circle", { r: 1.0, class: "dot off" }, grp);

    return {
      ...p, index: i, grp, sil, cr, notch, indicator,
      lift: tween(0),
    };
  });

  // Central Agent Execution Core
  const coreGrp = mk("g", {}, g);
  const coreSil = mk("path", { class: "sil hi" }, coreGrp);
  const coreCr = mk("path", { class: "nf lo" }, coreGrp);
  const coreHalo = mk("path", { class: "nf" }, coreGrp);
  const corePulse = mk("circle", { r: 1.3, class: "dot" }, coreGrp);
  const coreLift = tween(0);

  function drawPod(i, lift) {
    const pod = podNodes[i];
    const w = pod.w, r = pod.r, h = pod.h;
    const [ring, inner] = rings(pod.x - w / 2, pod.y - w / 2, pod.x + w / 2, pod.y + w / 2, r, 1.2);
    const pr = prism(P, front, ring, inner, 0, h + lift);
    pod.sil.setAttribute("d", pr.sil);
    pod.cr.setAttribute("d", pr.crease);

    const np0 = P(pod.x - w * 0.35, pod.y + w / 2, h + lift - 1.0);
    const np1 = P(pod.x + w * 0.35, pod.y + w / 2, h + lift - 1.0);
    pod.notch.setAttribute("d", seg(np0, np1));
    place(pod.indicator, P(pod.x, pod.y + w / 2 - 1.4, h + lift));
  }

  function drawCore(lift, time) {
    const [ring, inner] = rings(-CORE_W / 2, -CORE_W / 2, CORE_W / 2, CORE_W / 2, CORE_R, 1.4);
    const pr = prism(P, front, ring, inner, 0, CORE_H + lift);
    coreSil.setAttribute("d", pr.sil);
    coreCr.setAttribute("d", pr.crease);

    // Floating status ring above the core
    const haloR = 7 + Math.sin(time * 3) * 0.8;
    const haloZ = CORE_H + lift + 4 + Math.cos(time * 3) * 1.2;
    const haloRing = rings(-haloR, -haloR, haloR, haloR, haloR, 0.8)[0];
    coreHalo.setAttribute("d", prism(P, front, haloRing, null, haloZ, haloZ + 1.2).sil);

    place(corePulse, P(0, CORE_W / 2 - 1.5, CORE_H + lift));
  }

  // Draw initial frame
  for (let i = 0; i < PODS.length; i++) drawPod(i, 0);
  drawCore(0, 0);
  read.textContent = "executing";

  let act = -1;
  let animTime = 0;

  const B = register(stage, (dt, now) => {
    animTime += dt;

    // Ambient auto execution pulse: cycles through subagents
    const cycle = (animTime * 0.9) % PODS.length;
    const ambientActive = Math.floor(cycle);
    const subProgress = cycle - ambientActive;

    // Update pod lift & pulse dots
    PODS.forEach((p, i) => {
      const isTarget = act === i || (act === -1 && ambientActive === i);
      const targetLift = isTarget ? 3.5 : 0;
      tset(podNodes[i].lift, targetLift, now, 0);

      drawPod(i, tval(podNodes[i].lift, now));

      // Pulse traveling along conduit
      const prog = (animTime * 0.8 + i * 0.25) % 1;
      const pulsePos = [
        lerp(0, p.x * 0.85, prog),
        lerp(0, p.y * 0.85, prog),
        0.5,
      ];
      place(pulses[i], P(pulsePos[0], pulsePos[1], pulsePos[2]));

      podNodes[i].sil.classList.toggle("hi", isTarget);
      podNodes[i].notch.classList.toggle("hi", isTarget);
      podNodes[i].indicator.setAttribute("class", isTarget ? "dot" : "dot off");
      conduits[i].classList.toggle("hi", isTarget);
    });

    const isCoreTarget = act === 4 || act === -1;
    tset(coreLift, act === 4 ? 4 : Math.sin(animTime * 2.5) * 1.0, now, 0);
    drawCore(tval(coreLift, now), animTime);
    coreSil.classList.toggle("hi", isCoreTarget);

    return true; // Continuous ambient execution
  });
  bag.add(B.unregister);

  function hit([x, y]) {
    // Check core
    const corePt = P(0, 0, CORE_H / 2);
    if (Math.hypot(x - corePt[0], y - corePt[1]) < 22) return 4;

    // Check satellite pods
    for (let i = 0; i < PODS.length; i++) {
      const pt = P(PODS[i].x, PODS[i].y, PODS[i].h / 2);
      if (Math.hypot(x - pt[0], y - pt[1]) < 18) return i;
    }
    return -1;
  }

  function setActive(a) {
    if (a === act) return;
    act = a;
    if (a >= 0 && a < PODS.length) {
      read.textContent = `agent · ${PODS[a].name}`;
    } else if (a === 4) {
      read.textContent = "agent · core";
    } else {
      read.textContent = "executing";
    }
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => setActive(hit(p)),
    leave: () => setActive(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: () => {},
    destroy: bag.dispose,
  };
}

hairline({
  name: "agent",
  means: "An autonomous agent execution core with satellite tool pods: continuous data pulses route through conduits as it executes.",
  rules: [1, 4, 7, 8, 9, 10],
  range: [0, 50, 100],
  tour: [[200, 160], [150, 130], [250, 130], [250, 190], [150, 190], null],
  mount,
});
