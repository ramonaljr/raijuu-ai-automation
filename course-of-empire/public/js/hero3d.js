/* The Course of Empire — 3D hero (prototype).

   The museum hall is a real 3D scene: the photograph of the hall is projected
   onto simple geometry (wall, frame, floor, side wings), so it keeps its look
   but has true depth. The painting is a window: scrolling flies the camera to
   the frame and through it, into the film. At the end the camera comes back
   out of the last painting into the same hall, now in ruins; scrolling on
   rebuilds it into the first hall, and the film starts again: a circle.

   three.js r186, WebGLRenderer. No build step. */
import * as THREE from './vendor/three.module.min.js';
import { buildContent } from './content3d.js?v=18';
import { buildHall } from './hall.js?v=10';

/* ---------- The hall, measured on the plate (assets/hall/plate.webp, in its pixels) ---------- */
const PLATE = { w: 2688, h: 1520 };
const EYE = { px: 1344, py: 1140, f: 2400 };       // where the photo was "taken" from: principal point (the floor seams meet at its height) and focal length
const FLOOR_V = 1265;                               // where the wall meets the floor
const AP = { l: 722, t: 318, r: 1975, b: 1023 };    // the canvas inside the frame
const FR = { l: 662, t: 262, r: 2030, b: 1070 };    // the outside of the frame
const WALL = { l: 300, r: 2400 };                   // the flat back wall ends here; the wings begin
const FRAME_OUT = 26;                               // how far the frame stands out from the wall
const WINDOW_DEPTH = 450;                           // how far behind the wall the picture sits while we look from the hall
const FLOOR_STRIP = { top: 1248, h: 272 };          // assets/hall/plate-floor-base.webp: these rows of the plate with the floor's surface detail taken out

/* World units are plate pixels at the depth of the wall. The eye of the photo is the origin, looking down -z. */
const F = EYE.f;
const X = (u) => u - EYE.px;
const Y = (v) => EYE.py - v;
const FLOOR_Y = Y(FLOOR_V);
const ap = { l: X(AP.l), r: X(AP.r), t: Y(AP.t), b: Y(AP.b) };
const fr = { l: X(FR.l), r: X(FR.r), t: Y(FR.t), b: Y(FR.b) };
ap.w = ap.r - ap.l; ap.h = ap.t - ap.b; ap.cx = (ap.l + ap.r) / 2; ap.cy = (ap.t + ap.b) / 2;

const $ = (s) => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const sstep = (a, b, v) => smooth(clamp((v - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Timeline, in seconds of scroll ---------- */
const FILM_AT_PORTAL = 44;   // the frame of chapter I at which the film is entered: the first frames, where it only sets off from the whole painting, are not shown
const FILM_ORIGIN = 20;      // the frame the texts and the sound of chapter I count their seconds from (where the film used to be entered)
const CH1_END = 351, CH2_END = 290;
const CH3_EXIT = 240;        // last frame of chapter III: the camera has pulled back to the whole of the last painting and is still easing back
const REAL_HALL = new URLSearchParams(location.search).get('hall') !== 'photo';   // the hall is real geometry (js/hall.js); ?hall=photo shows the earlier one, a photograph on flat planes
const LENS = 0.45;             // (the real hall) how much wider the lens is at the frame than across the hall: 0.45 → 1.45 times
/* (The real hall) The flight keeps to the axis of the hall. The camera sinks to just above the floor, runs along it,
   then climbs over the rope and into the painting. Shares are of the way to the frame (0 the start, 1 the frame). */
const FLIGHT = { low: 40, lowBy: 0.2, climbFrom: 0.44, climbTo: 0.95, tilt: 0.85, rise: 18 * Math.PI / 180 };   // height above the floor at the lowest; when it is down; when it climbs; how much it looks up at the painting from below (1: keeps it where it was on screen)
const flightDrop = (e, line) => lerp(lerp(0, FLOOR_Y + FLIGHT.low, sstep(0, FLIGHT.lowBy, e)), line, sstep(FLIGHT.climbFrom, FLIGHT.climbTo, e)) - line;   // how far below its old line (a steady climb) the camera is
const START_PACE = 0.5;       // how fast the flight in sets off, against its average pace: the camera answers the first touch of scroll
/* The way in has two parts. First the flight across the hall to the frame. Then the camera does not stop: it goes on
   into the painting itself, towards one place in it, until that place fills the screen (the dive). All that time the
   picture is the painting, as sharp as it is; the film is not shown until the dive is over, and then comes up out of it. */
const DIVE = {
  from: 0.68,                // share of the way in at which the frame is reached and the dive begins
  // Where the dive ends is where the film begins: on frame FILM_AT_PORTAL the film's own camera has moved in until it shows
  // just this part of the painting (measured by tools/film_in_painting.py, which finds each frame in the painting). So the
  // painting, enlarged `by` times about the point `focus`, lies exactly under that frame, and one is exchanged for the other.
  by: 1.508,                 // how many times larger than the screen the painting is there
  focus: [0.479, 0.007],     // the point of the painting that stays where it is on screen as it grows (0…1 from the left, 0…1 from the bottom)
  push: 0.0189,              // how fast the film is moving in on that frame (the logarithm of its growth, per frame): the dive arrives at this pace, and the painting keeps to it under the film while any of it is seen
  develop: 0,                // film frames over which the film comes up out of the painting (short: the film's camera is moving fast, and what is near it soon stands otherwise than in the painting)
};
const SWAP_OUT = [0.42, 0.86];   // on the way out the film's last frame is exchanged for the painting while it is small on screen, where the two cannot be told apart
/* How far chapter I has pushed in by its frame p (log of its scale against the painting), measured on the film. */
const pushIn = (p) => 0.002464 * p + 0.00012456 * p * p;
const pushRate = (p) => 0.002464 + 0.00024912 * p;
const PULL_OUT = 0.040;          // how fast chapter III is still pulling back on its last frame, per second
const FILM = { w: 854, h: 480 };   // the unit the registers below are measured in (the films themselves may be larger)
/* painting = s × film + t (in film pixels): how the film frame sits against the painting at each portal, measured */
const REG_IN = { s: 1.0169, tx: 2.39, ty: 0.86 };
const REG_OUT = { s: 1.0049, tx: 6.02, ty: 2.57 };
const REG_FROM = 3, REG_TO = 18;   // film frames over which the register is let go on the way in (the film is pushing in by then)
/* Where two clips meet, the first slows into the join and the next picks up again: the camera all but stops and
   starts. So the film runs faster across the join (frames per frame of scroll, by film frame) and the pace holds. */
const RATE = {
  ch2: (f) => 1 + 1.2 * sstep(254, 290, f),
  ch3: (f) => 1 + 0.42 * (1 - sstep(0, 16, f)),
};
/* On an upright screen only the middle of the film is in view. Where the subject of a scene stands to one side,
   the picture is slid across to it: [film frame, the point of the frame's width that is brought to the centre]. */
const FOCUS = {
  ch1: [[120, 0.5], [150, 0.66], [180, 0.7], [196, 0.5]],     // the conqueror on his elephant
  ch2: [[108, 0.5], [136, 0.7], [210, 0.67], [224, 0.5]],     // the headless guardian
  ch3: [[118, 0.5], [138, 0.33], [205, 0.33], [240, 0.5]],    // the last column; back to the middle before the way out
};
const SEGS = [
  { id: 'hero', dur: 0.4 },                                                            // the hall at rest: a touch of scroll and the camera is on its way
  { id: 'in', dur: 8.6 },                                                              // the flight to the frame, and on into the painting
  { id: 'ch1', dur: (CH1_END - FILM_AT_PORTAL) / 24, film: 0, from: FILM_AT_PORTAL, to: CH1_END, origin: FILM_ORIGIN },
  { id: 'ch2', dur: CH2_END / 24, film: 1, from: 0, to: CH2_END },
  { id: 'ch3', dur: CH3_EXIT / 24, film: 2, from: 0, to: CH3_EXIT },
  { id: 'out', dur: 5.5 },                                                             // back out through the frame, into the ruined hall
  { id: 'finale', dur: 6.4 },                                                          // the ruined hall at rest
  { id: 'return', dur: 5.5 },                                                          // the hall is rebuilt; ends exactly as 'hero' begins
];
/* Where each of the film's first frames sits in the painting (tools/film_in_painting.py): [frame, how many times the
   film's camera has moved in, then the part of the painting the frame shows: left, top, width, height, as shares of the
   painting]. Up to the frame the film is entered on, the film is the painting seen from nearer and nearer, so each of
   these frames can be laid over the painting exactly where it belongs. */
const FILM_IN_PAINTING = [[0, 0.9847, 0.0023, 0.0123, 1.0156, 1.0102], [4, 0.9921, 0.0067, 0.0217, 1.0080, 1.0027], [8, 1.0051, 0.0134, 0.0354, 0.9949, 0.9897], [12, 1.0243, 0.0224, 0.0534, 0.9763, 0.9712], [16, 1.0500, 0.0336, 0.0756, 0.9523, 0.9473], [20, 1.0832, 0.0471, 0.1020, 0.9232, 0.9183], [24, 1.1247, 0.0626, 0.1325, 0.8891, 0.8844], [28, 1.1756, 0.0798, 0.1667, 0.8506, 0.8461], [32, 1.2374, 0.0987, 0.2045, 0.8081, 0.8039], [36, 1.3119, 0.1188, 0.2456, 0.7623, 0.7583], [40, 1.4011, 0.1398, 0.2895, 0.7137, 0.7100], [42, 1.4521, 0.1506, 0.3125, 0.6886, 0.6850], [44, 1.5079, 0.1614, 0.3361, 0.6632, 0.6597]];   // (a smooth curve through the measurements, which scatter a little from frame to frame: laid by the raw figures the film would tremble on the painting and run unevenly)
function filmInPainting(p) {   // …for any moment between them
  const T = FILM_IN_PAINTING; let i = 1;
  while (i < T.length - 1 && T[i][0] < p) i++;
  const a = T[i - 1], b = T[i], k = clamp((p - a[0]) / (b[0] - a[0]));
  return [lerp(a[2], b[2], k), lerp(a[3], b[3], k), lerp(a[4], b[4], k), lerp(a[5], b[5], k)];
}
function frameMovedIn(zoom) {   // the frame on which the film's camera has moved in this far
  const T = FILM_IN_PAINTING; let i = 1;
  while (i < T.length - 1 && T[i][1] < zoom) i++;
  const a = T[i - 1], b = T[i];
  return lerp(a[0], b[0], clamp((zoom - a[1]) / (b[1] - a[1])));
}
/* A film part keeps a clock: the moment (in film frames of scroll) at which each of its frames is on screen. */
for (const g of SEGS) {
  if (g.film == null) continue;
  const rate = RATE[g.id] || (() => 1);
  g.clock = new Float32Array(g.to - g.from + 1);
  for (let i = 1; i < g.clock.length; i++) g.clock[i] = g.clock[i - 1] + 1 / rate(g.from + i - 0.5);
  g.dur = g.clock[g.clock.length - 1] / 24;
}
/* The film frame on screen `sec` seconds into a film part, and the other way round. */
function frameAt(g, sec) {
  const c = g.clock, x = sec * 24;
  let lo = 0, hi = c.length - 1;
  if (x >= c[hi]) return g.to;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] <= x) lo = mid; else hi = mid; }
  return g.from + lo + (x - c[lo]) / (c[hi] - c[lo]);
}
function secondsAt(g, frames) {   // `frames` film frames into the part → seconds of scroll
  const c = g.clock, n = c.length - 1, i = Math.min(n - 1, Math.max(0, Math.floor(frames)));
  return (c[i] + (c[i + 1] - c[i]) * (frames - i)) / 24;
}
let T_TOTAL = 0;
for (const g of SEGS) { g.start = T_TOTAL; T_TOTAL += g.dur; }
const T_FLY = SEGS[1].dur;
/* A moment on the timeline, in seconds: `sec` seconds into the part `id`. Inside a film `sec` counts seconds of
   film (24 frames each), so a text set to 5.9 comes up on that frame however the film's pace is bent around it. */
const moment = (id, sec = 0) => { const g = SEGS.find((x) => x.id === id); return g.start + (g.clock ? secondsAt(g, Math.max(0, sec * 24 - (g.from - (g.origin ?? g.from)))) : sec); };   // (a film entered later than it used to be keeps its texts on their frames)
const hermite = (a, m0, m1) => (a * a * a - 2 * a * a + a) * m0 + (-2 * a * a * a + 3 * a * a) + (a * a * a - a * a) * m1;   // 0 → 1 with given end slopes
const run = (a, m0, m1) => { const a3 = a * a * a, a4 = a3 * a, a5 = a4 * a;   // the same, but starting and stopping without a jerk: a slower start, a faster middle
  return (a - 6 * a3 + 8 * a4 - 3 * a5) * m0 + (10 * a3 - 15 * a4 + 6 * a5) + (-4 * a3 + 7 * a4 - 3 * a5) * m1; };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const phone = matchMedia('(max-width: 767px), (orientation: landscape) and (max-height: 560px)');   // the phone layout (css/hero3d-responsive.css)
const smallScreen = !finePointer && Math.min(screen.width, screen.height) < 600;   // a phone: it gets the films at 720p (a third of the weight to load, decode and hold) and a lighter hall

/* ---------- Renderer ---------- */
const canvas = $('#gl');
let renderer;
try {
  // In the real hall the canvas itself is not smoothed: the hall is drawn into its own picture and smoothed there, and
  // the film is one flat picture. (A smoothed canvas holds four times the memory and is resolved on every frame.)
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !REAL_HALL, powerPreference: 'high-performance' });
} catch (e) {
  $('#noGl').classList.add('is-on');
  throw e;
}
renderer.setClearColor(0x0f0b08, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();   // its projection is set by hand every frame (an off-axis, "shift lens" frustum)
camera.matrixAutoUpdate = true;

/* ---------- Shaders ---------- */
const NOISE = /* glsl */`
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
  float wisp(vec2 p) { float n = fbm(p); return pow(1.0 - abs(2.0 * n - 1.0), 2.4); }   // thin bright filaments instead of soft blobs
`;
const WORLD_VERT = /* glsl */`
  varying vec3 vWorld; varying vec2 vUv;
  void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const OUT = /* glsl */`
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/* The photograph, projected from the eye onto whatever geometry it hits. */
const plateMaterial = new THREE.ShaderMaterial({
  uniforms: { tPlate: { value: null }, tRuin: { value: null }, tBase: { value: null }, uCam: { value: new THREE.Vector3() }, uRestore: { value: 1 }, uEye: { value: new THREE.Vector3(EYE.px, EYE.py, F) }, uSize: { value: new THREE.Vector2(PLATE.w, PLATE.h) }, uGlow: { value: 0 }, uDim: { value: 1 } },
  vertexShader: WORLD_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tPlate, tRuin, tBase; uniform vec3 uEye, uCam; uniform vec2 uSize; uniform float uGlow, uDim, uRestore;
    varying vec3 vWorld;
    ${NOISE}
    vec2 toPlate(vec3 p) { float d = max(1.0, -p.z); return vec2(uEye.x + uEye.z * p.x / d, uEye.y - uEye.z * p.y / d); }
    vec2 plateUv(vec2 px) { return vec2(px.x / uSize.x, 1.0 - px.y / uSize.y); }
    // the plate with the floor's surface detail (tile seams, veining) taken out: what is left on the floor is the reflection
    vec3 smoothPlate(vec2 px) {
      vec3 c = texture2D(tPlate, plateUv(px)).rgb;
      float v = (px.y - ${FLOOR_STRIP.top.toFixed(1)}) / ${FLOOR_STRIP.h.toFixed(1)};
      if (v > 0.0 && v < 1.0 && px.x > 0.0 && px.x < uSize.x) c = texture2D(tBase, vec2(px.x / uSize.x, 1.0 - v)).rgb;
      return c;
    }
    void main() {
      vec2 px = toPlate(vWorld);
      vec2 uv = plateUv(px);
      // The polished floor is two things at once. Its reflections are a mirror image of the wall, so they are drawn
      // where the mirror image is: on the wall carried on below the floor line (this geometry). Its surface (seams,
      // veining, dust) lies on the floor itself: for that, find the point of the real floor seen through this pixel.
      // From where the photo was taken both fall on the same pixel of the plate; once the camera moves, the surface
      // slides under the reflections, as on a real floor.
      vec2 pf = px;
      float onFloor = 0.0;
      if (vWorld.y < ${FLOOR_Y.toFixed(1)}) {
        vec3 dir = vWorld - uCam;
        vec3 f = uCam + dir * ((${FLOOR_Y.toFixed(1)} - uCam.y) / min(dir.y, -0.001));
        onFloor = smoothstep(430.0, 760.0, px.x) * smoothstep(2258.0, 1928.0, px.x);   // not under the colonnades: they are flat, the floor there stays with them
        pf = mix(px, toPlate(f), onFloor);
        onFloor = 1.0;
      }
      // The hall as it was (tPlate) and in ruins (tRuin). uRestore 0 → ruins, 1 → restored; in between the
      // restored hall spreads outwards from the painting behind a ragged edge of light.
      float rr = length((px - vec2(${((AP.l + AP.r) / 2).toFixed(1)}, ${((AP.t + AP.b) / 2).toFixed(1)})) / vec2(1500.0, 1000.0)) + (fbm(px * 0.004) - 0.5) * 0.5;
      float front = mix(-0.7, 2.6, uRestore);
      float m = 1.0 - smoothstep(front - 0.18, front + 0.18, rr);
      vec3 whole = texture2D(tPlate, uv).rgb;
      if (onFloor > 0.5) whole = max(vec3(0.0), smoothPlate(px) + texture2D(tPlate, plateUv(pf)).rgb - smoothPlate(pf));
      vec3 ruin = texture2D(tRuin, plateUv(pf)).rgb;   // the ruined floor is dull: all of it lies on the floor
      vec3 c = mix(ruin, whole, m);
      c += vec3(0.30, 0.21, 0.09) * (1.0 - abs(m * 2.0 - 1.0)) * 0.55;
      // light spilling out of the painting onto the wall and the floor around it as it comes alive
      float r = length((vWorld.xy - vec2(${ap.cx.toFixed(1)}, ${ap.cy.toFixed(1)})) / vec2(${(ap.w * 0.9).toFixed(1)}, ${(ap.h * 1.1).toFixed(1)}));
      c += c * uGlow * 1.4 * exp(-r * r * 1.6) + vec3(0.10, 0.085, 0.06) * uGlow * exp(-r * r * 2.4);
      gl_FragColor = vec4(c * uDim, 1.0);
      ${OUT}
    }`,
  side: THREE.DoubleSide,
});

/* The inner faces of the frame, seen only when the camera is off axis or passing through. */
const lipMaterial = new THREE.ShaderMaterial({
  uniforms: { uGlow: { value: 0 } },
  vertexShader: WORLD_VERT,
  fragmentShader: /* glsl */`
    uniform float uGlow; varying vec3 vWorld;
    void main() {
      float depth = clamp((-vWorld.z - ${(F - FRAME_OUT).toFixed(1)}) / ${FRAME_OUT.toFixed(1)}, 0.0, 1.0);
      vec3 gold = mix(vec3(0.46, 0.30, 0.10), vec3(0.16, 0.10, 0.035), depth);
      gl_FragColor = vec4(gold * (1.0 + uGlow * 1.5), 1.0);
      ${OUT}
    }`,
  side: THREE.DoubleSide,
});

/* The picture in the window: the painting, then the film coming alive in its place. */
const pictureMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tPainting: { value: null }, tPainting2: { value: null }, uPaint: { value: 0 },
    tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uLive: { value: 0 }, uAlpha: { value: 1 },
    uCrop: { value: 1 }, uShift: { value: new THREE.Vector2() }, uReg: { value: 1 }, uRegS: { value: REG_IN.s }, uRegT: { value: new THREE.Vector2(REG_IN.tx, REG_IN.ty) },
    uTexel: { value: new THREE.Vector2(1 / 1920, 1 / 1080) }, uSharp: { value: 0.55 }, uTurn: { value: 0 },
    uInto: { value: 1 }, uFocus: { value: new THREE.Vector2(DIVE.focus[0], DIVE.focus[1]) }, uFilmZoom: { value: 1 }, uDevelop: { value: 0 }, tNoise: { value: null },
    uRect: { value: new THREE.Vector4() }, uHole: { value: new THREE.Vector4(0.4930, 0.3340, 1.5078, 1.5158) },   // uHole: the middle of what the film's first shown frame shows of the painting (from the left, from the bottom), and one over its width and height
  },
  vertexShader: WORLD_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tPainting, tPainting2, tA, tB, tNoise; uniform float uMix, uLive, uCrop, uReg, uPaint, uRegS, uSharp, uTurn, uAlpha, uInto, uFilmZoom, uDevelop; uniform vec2 uRegT, uTexel, uShift, uFocus; uniform vec4 uRect, uHole; varying vec2 vUv;
    vec3 frameAt(vec2 p) { p.y = mix(p.y, 1.0 - p.y, uTurn); return mix(texture2D(tA, p).rgb, texture2D(tB, p).rgb, uMix); }
    ${NOISE}
    void main() {
      vec2 uv = (vUv - 0.5) / uCrop + 0.5 + uShift;   // uCrop > 1 shows a tighter part of the picture; uShift slides it (the window's parallax)
      // Two paintings hang here in turn: the first (uPaint 0) and the last (uPaint 1). Between them one
      // replaces the other from the centre outwards, behind a ragged edge.
      // The dive: past the frame the camera goes on towards one place in the painting (uFocus), and the painting is
      // seen uInto times larger, that place staying where it is on screen.
      vec2 at = uFocus + (uv - uFocus) / uInto;
      float rr = length((at - 0.5) * vec2(1.0, 0.6)) * 2.0 + (fbm(at * 5.0) - 0.5) * 0.6;
      float front = mix(2.0, -0.6, uPaint);
      vec3 still = mix(texture2D(tPainting, at).rgb, texture2D(tPainting2, at).rgb, smoothstep(front - 0.15, front + 0.15, rr));
      // That close, what is seen is the painted surface itself: the weave of the canvas under the paint, the fine
      // cracks of old varnish, the paint lying thicker and thinner. (It is also what keeps the picture from being
      // only an enlarged photograph of itself.)
      float near = smoothstep(2.6, 5.0, uInto);   // (only on a deep dive: where the film is entered now the painting is not enlarged that far, and a weave that fine would only shimmer)
      if (near > 0.0) {
        vec2 q = at * vec2(${(2688 / 1520).toFixed(4)}, 1.0);
        float weave = sin(q.x * 3800.0) * sin(q.y * 3800.0);
        float cracks = smoothstep(0.72, 1.0, texture2D(tNoise, q * 7.0).g), body = texture2D(tNoise, q * 2.3 + 0.4).r - 0.5;
        still *= 1.0 + near * (0.045 * weave + 0.16 * body - 0.2 * cracks);
      }
      // where this point of the painting is in the film frame; uReg 1 → in register with the painting, 0 → the whole frame
      vec2 top = vec2(uv.x, 1.0 - uv.y);
      vec2 size = vec2(${FILM.w.toFixed(1)}, ${FILM.h.toFixed(1)});
      vec2 fuv = mix(top, (top * size - uRegT) / uRegS / size, uReg); fuv.y = 1.0 - fuv.y;
      // …or, on the way in (uRect: the part of the painting this frame of the film shows), laid over the painting exactly where it belongs
      if (uRect.z > 0.0) { fuv = (vec2(at.x, 1.0 - at.y) - uRect.xy) / uRect.zw; fuv.y = 1.0 - fuv.y; }
      // The film is shown larger than it was rendered, so it is sharpened a little as it is drawn: each point is
      // pushed away from the average of its four neighbours, but never beyond the range they span (no halos).
      vec3 film = frameAt(fuv);
      vec3 n = frameAt(fuv + vec2(0.0, uTexel.y)), s = frameAt(fuv - vec2(0.0, uTexel.y)), e = frameAt(fuv + vec2(uTexel.x, 0.0)), w = frameAt(fuv - vec2(uTexel.x, 0.0));
      vec3 lo = min(film, min(min(n, s), min(e, w))), hi = max(film, max(max(n, s), max(e, w)));
      film = clamp(film + (film - (n + s + e + w) * 0.25) * uSharp, lo - (hi - lo) * 0.25, hi + (hi - lo) * 0.25);
      // How the film takes the painting's place. On the way out: evenly (the two are the same picture there). On the
      // way in (uDevelop) the painting opens onto the film the way the dark opened onto the hall after Enter: from the
      // place the camera is making for outwards, in spreading blots behind a ragged edge with a thin warm line of
      // light along it. Both sides of the edge are the same city, in the same place: on one side painted, on the
      // other alive. (The cloud that makes the edge ragged stands still on the painting; only the level rises.)
      float live = uLive; vec3 rim = vec3(0.0);
      if (uDevelop > 0.5 && uLive > 0.001 && uLive < 0.999) {
        vec2 m = (at - uHole.xy) * uHole.zw * vec2(1.7778, 1.0);
        float cloud = texture2D(tNoise, m * 0.5 + 0.37).r * 0.72 + texture2D(tNoise, m * 2.1 + 0.11).r * 0.28;
        float edge = length(m) / 2.0398 * 1.26 + cloud * 0.62 - mix(0.13, 1.13, uLive);   // above 0: still the painting
        live = 1.0 - smoothstep(0.0, 0.006, edge);
        // The edge: a fine bright line with a soft warm glow on the painting's side, and a little of it inside. And
        // so that the opening is seen for what it is (the two sides are the same view), the painting around it goes
        // a little dull and yellow, as under old varnish, while what has opened is clear and bright.
        float on = smoothstep(0.0, 0.12, uLive) * (1.0 - smoothstep(0.86, 1.0, uLive));
        rim = vec3(1.0, 0.66, 0.34) * on * ((0.6 * exp(-max(edge, 0.0) / 0.007) + 0.26 * exp(-max(edge, 0.0) / 0.05)) * (1.0 - live) + 0.16 * exp(min(edge, 0.0) / 0.03) * live);
        still = mix(still, (still * 0.84 + 0.02) * vec3(1.0, 0.94, 0.8), 0.75 * smoothstep(0.0, 0.3, uLive));
      }
      gl_FragColor = vec4(mix(still, film, live) + rim, uAlpha);   // uAlpha is 1, except while the real hall is drawn for its lens (below): there 0 marks the picture, to be left as it is. Never 0 on screen: the canvas would show through.
      ${OUT}
    }`,
});

/* Fog. One shader, three sheets: falling down the wall, spreading over the floor, standing in the window. */
function fogMaterial(kind) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 1 } },
    vertexShader: WORLD_VERT,
    fragmentShader: /* glsl */`
      uniform float uTime, uAmount; varying vec2 vUv;
      ${NOISE}
      void main() {
        float t = uTime;
        float a = 0.0;
        ${kind === 'wall' ? /* glsl */`
          // vUv.y = 1 just above the frame's bottom rail, 0 at the floor. The fog pours over the rail in four
          // thin falls (two pairs, as in the painting), streaked along its way down, and curls into a low bank.
          float dir = 1.0;
          float x = vUv.x, y = vUv.y, drop = 1.0 - y;
          float falls = 0.0;
          for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float c = (i == 0 ? 0.372 : i == 1 ? 0.432 : i == 2 ? 0.608 : 0.700);
            float sway = (fbm(vec2(y * 3.0 + t * 0.05 * dir, fi * 7.3)) - 0.5) * 0.085 * drop;   // each fall wanders as it comes down
            float w = (i == 1 || i == 2 ? 0.010 : 0.014) + 0.030 * drop * drop;                  // …and opens out near the floor
            falls += exp(-pow((x - c - sway) / w, 2.0)) * (0.75 + 0.25 * sin(t * 0.3 + fi * 2.1));
          }
          float streak = wisp(vec2(x * 46.0, y * 3.2 + t * 0.26 * dir) + fbm(vec2(x * 9.0, y * 2.0 + t * 0.05)) * 2.0);
          float fall = falls * (0.35 + 0.95 * streak) * smoothstep(1.0, 0.94, y);
          vec2 q = vec2(x * 13.0, y * 7.0 + t * 0.02 * dir);   // one field for the whole bank: no seam down the middle
          float curl = wisp(q + fbm(q * 0.45 + t * 0.012) * 2.2);
          float bank = smoothstep(0.34, 0.02, y) * (0.12 + 1.05 * curl) * (0.55 + 0.45 * smoothstep(0.0, 0.5, falls + 0.25));
          float sides = smoothstep(0.0, 0.07, x) * smoothstep(1.0, 0.93, x);
          a = clamp(fall + bank${REAL_HALL ? ' * 0.3 * smoothstep(0.0, 0.16, y)' : ''}, 0.0, 1.0) * sides * 0.9;
        ` : kind === 'floor' ? /* glsl */`
          // vUv.y = 0 at the wall, 1 towards the camera. Long wisps creep out over the floor and thin away.
          float dir = 1.0;
          vec2 q = vec2(vUv.x * 5.5, vUv.y * 13.0 - t * 0.07 * dir);
          float n = wisp(q + fbm(q * 0.4 + vec2(t * 0.012, 0.0)) * 2.4);
          float soft = fbm(vec2(vUv.x * 4.0, vUv.y * 5.0 - t * 0.04 * dir));
          float reach = pow(1.0 - vUv.y, 1.5);
          float sides = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
          a = (n * 0.85 + smoothstep(0.45, 0.8, soft) * 0.35) * (0.12 + 0.88 * reach) * sides * 0.8 * smoothstep(1.0, 0.72, vUv.y);   // gone before the sheet's own edge, or the edge shows as a line
        ` : /* glsl */`
          // the window itself: a thin luminous mist along the bottom of the picture, thickest where the falls begin
          vec2 p = vec2(vUv.x * 6.0 + t * 0.02, vUv.y * 3.0 - t * 0.035);
          float n = fbm(p + fbm(p * 0.7) * 1.2);
          float src = 0.5 + 0.5 * (exp(-pow((vUv.x - 0.31) / 0.12, 2.0)) + exp(-pow((vUv.x - 0.78) / 0.14, 2.0)));
          a = smoothstep(0.26, 0.72, n) * smoothstep(0.22, 0.0, vUv.y) * src * 0.7;
        `}
        vec3 c = vec3(0.93, 0.88, 0.80);
        gl_FragColor = vec4(c, a * uAmount);
        ${OUT}
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

/* Dust in the light. Each mote is a small quad drawn from where it was on screen a moment ago to where it is now:
   at rest a soft dot, a streak when the camera flies past it. */
const dustMaterial = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uAmount: { value: 1 }, uPrev: { value: new THREE.Matrix4() }, uRes: { value: new THREE.Vector2(1, 1) }, uShutter: { value: 1 } },
  vertexShader: /* glsl */`
    attribute vec3 offset; attribute vec4 seed;
    uniform float uTime, uScale, uShutter; uniform mat4 uPrev; uniform vec2 uRes;
    varying vec2 vL; varying float vA, vR, vH;
    void main() {
      vec3 p = offset;
      p.x += sin(uTime * 0.11 + seed.x * 6.28) * 26.0; p.y += sin(uTime * 0.07 + seed.y * 6.28) * 18.0 + uTime * 1.6 * (seed.z - 0.3); p.z += cos(uTime * 0.09 + seed.z * 6.28) * 30.0;
      p.y = mod(p.y - ${FLOOR_Y.toFixed(1)}, 1300.0) + ${FLOOR_Y.toFixed(1)};
      vec4 cur = projectionMatrix * viewMatrix * vec4(p, 1.0);
      vec4 was = uPrev * vec4(p, 1.0);
      float depth = cur.w;
      float r = min(uScale * (1.2 + seed.w * 2.2) * 500.0 / max(60.0, depth), uScale * 4.0);   // radius, in pixels
      vec2 c = cur.xy / max(cur.w, 0.001);
      vec2 d = (c - was.xy / max(was.w, 0.001)) * 0.5 * uRes * uShutter;     // how far it moved on screen during the exposure
      if (was.w < 20.0 || cur.w < 20.0) d = vec2(0.0);
      float len = min(length(d), 0.2 * uRes.y);
      vec2 dir = len > 0.01 ? d / length(d) : vec2(1.0, 0.0);
      float h = len * 0.5;
      vec2 at = c - dir * h / (0.5 * uRes) + (dir * position.x * (h + r) + vec2(-dir.y, dir.x) * position.y * r) / (0.5 * uRes);
      gl_Position = cur.w > 20.0 ? vec4(at * cur.w, cur.z, cur.w) : vec4(2.0, 2.0, 2.0, 1.0);
      vL = vec2(position.x * (h + r), position.y * r); vH = h; vR = r;
      // close to the lens a mote is a large, faint, out-of-focus disc; a streak spreads the same light over its length
      vA = (0.25 + 0.75 * seed.x) * smoothstep(40.0, 240.0, depth) * min(1.0, pow(5.0 / r, 1.5)) * (r / (r + 0.22 * h));
    }`,
  fragmentShader: /* glsl */`
    uniform float uAmount; varying vec2 vL; varying float vA, vR, vH;
    void main() {
      float dist = length(vec2(max(abs(vL.x) - vH, 0.0), vL.y)) / vR;
      gl_FragColor = vec4(vec3(1.0, 0.88, 0.68) * smoothstep(1.0, 0.0, dist) * vA * 0.3 * uAmount, 1.0);
      ${OUT}
    }`,
  transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,   // added to what is behind; the alpha (the picture's mark) is left alone
});

/* Haze hanging in the air of the hall, in sheets one behind another. Standing still they are barely there; flying
   through them is what tells the eye the camera is travelling and not zooming. */
const hazeMaterial = new THREE.ShaderMaterial({
  uniforms: { tNoise: { value: null }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uAmount: { value: 1 }, uTint: { value: new THREE.Color(1.0, 0.86, 0.66) } },
  vertexShader: /* glsl */`
    attribute float layer; varying vec3 vWorld; varying float vLayer;
    uniform vec3 uCam; uniform float uAmount;
    void main() {
      vLayer = layer; vWorld = position;
      float ahead = uCam.z - position.z;   // a sheet far ahead or already passed shows nothing (see "near" below): it is not drawn at all
      gl_Position = uAmount > 0.001 && ahead > 60.0 && ahead < 1000.0 ? projectionMatrix * viewMatrix * vec4(position, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tNoise; uniform vec3 uCam, uTint; uniform float uTime, uAmount;
    varying vec3 vWorld; varying float vLayer;
    void main() {
      float ahead = uCam.z - vWorld.z;                                   // how far in front of the camera this sheet hangs
      float near = smoothstep(60.0, 330.0, ahead) * (1.0 - smoothstep(420.0, 1000.0, ahead));   // seen only as the camera comes up to it, gone as it passes: the far wall stays clear
      float sheet = floor(vLayer + 0.5);   // which sheet this is: a whole number, but it arrives interpolated and may be a hair off (1.9999 must not read as "odd")
      float side = mod(sheet, 2.0) * 2.0 - 1.0;
      vec2 q = vWorld.xy / 1100.0 + sheet * vec2(0.37, 0.61) + vec2(uTime * 0.0035 * side, uTime * 0.0012);
      vec4 n1 = texture2D(tNoise, q), n2 = texture2D(tNoise, q * 2.6 + 0.31);
      float cloud = smoothstep(0.34, 0.78, n1.r * 0.68 + n2.r * 0.32);
      float a = cloud * (0.12 + 0.88 * n2.g * n2.g);   // thin lit filaments, not a veil
      float height = vWorld.y - ${FLOOR_Y.toFixed(1)};
      a *= 0.16 + 0.84 * exp(-height / 430.0);                           // it lies low and thins upwards
      a *= smoothstep(0.0, 26.0, height);
      // seen against the wall: keep the canvas clear, and light the haze by the lamps over the painting
      vec3 dir = vWorld - uCam;
      vec3 w = uCam + dir * ((${(-F).toFixed(1)} - uCam.z) / min(dir.z, -0.001));
      vec2 b = abs(w.xy - vec2(${ap.cx.toFixed(1)}, ${ap.cy.toFixed(1)})) / vec2(${(ap.w * 0.5).toFixed(1)}, ${(ap.h * 0.5).toFixed(1)});
      a *= 1.0 - 0.9 * (1.0 - smoothstep(0.9, 1.25, max(b.x, b.y)));
      vec2 l = (w.xy - vec2(${ap.cx.toFixed(1)}, ${(ap.b - 60).toFixed(1)})) / vec2(1500.0, 620.0);
      float lit = 0.22 + 0.78 * exp(-dot(l, l));
      gl_FragColor = vec4(uTint * lit * a * near * uAmount * 0.3, 1.0);
      ${OUT}
    }`,
  transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, side: THREE.DoubleSide,
});

/* ---------- Geometry ---------- */
function quads(list) {   // each quad: four corners [x, y, z], counter-clockwise or not (materials are double sided)
  const pos = [];
  for (const [a, b, c, d] of list) pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
const zW = -F;                 // the wall
const zF = -F + FRAME_OUT;     // the front of the frame
const k = (F - FRAME_OUT) / F; // a point of the plate on the frame's front is this much closer to the axis
const TOP = 2200;              // everything is built far above the picture's top edge
const BOTTOM = FLOOR_Y - 1700; // …and far below the floor line: the polished floor is a mirror, so what it shows (the wall and the
                               // wings, reflected) lies at their depth, not on the floor plane. Drawn this way reflections stay under their lights.
const wl = X(WALL.l), wr = X(WALL.r);
const wingDir = [139, 197];    // the wings turn towards the camera at about 35°
const wingLen = 9;
const hall = quads([
  // wall, around the opening for the picture
  [[wl, BOTTOM, zW], [ap.l, BOTTOM, zW], [ap.l, TOP, zW], [wl, TOP, zW]],
  [[ap.r, BOTTOM, zW], [wr, BOTTOM, zW], [wr, TOP, zW], [ap.r, TOP, zW]],
  [[ap.l, ap.t, zW], [ap.r, ap.t, zW], [ap.r, TOP, zW], [ap.l, TOP, zW]],
  [[ap.l, BOTTOM, zW], [ap.r, BOTTOM, zW], [ap.r, ap.b, zW], [ap.l, ap.b, zW]],
  // frame: its front, standing out from the wall
  [[fr.l * k, fr.b * k, zF], [ap.l * k, ap.b * k, zF], [ap.l * k, ap.t * k, zF], [fr.l * k, fr.t * k, zF]],
  [[ap.r * k, ap.b * k, zF], [fr.r * k, ap.b * k, zF], [fr.r * k, ap.t * k, zF], [ap.r * k, ap.t * k, zF]],
  [[fr.l * k, fr.t * k, zF], [ap.l * k, ap.t * k, zF], [ap.r * k, ap.t * k, zF], [fr.r * k, fr.t * k, zF]],
  [[fr.l * k, fr.b * k, zF], [ap.l * k, ap.b * k, zF], [ap.r * k, ap.b * k, zF], [fr.r * k, fr.b * k, zF]],
  // frame: its outer sides
  [[fr.l, fr.b, zW], [fr.l * k, fr.b * k, zF], [fr.l * k, fr.t * k, zF], [fr.l, fr.t, zW]],
  [[fr.r, fr.b, zW], [fr.r * k, fr.b * k, zF], [fr.r * k, fr.t * k, zF], [fr.r, fr.t, zW]],
  [[fr.l, fr.t, zW], [fr.l * k, fr.t * k, zF], [fr.r * k, fr.t * k, zF], [fr.r, fr.t, zW]],
  [[fr.l, fr.b, zW], [fr.l * k, fr.b * k, zF], [fr.r * k, fr.b * k, zF], [fr.r, fr.b, zW]],
  // wings: the columns and arches on both sides, each a flat plane turned towards the camera
  [[wl, BOTTOM, zW], [wl - wingDir[0] * wingLen, BOTTOM, zW + wingDir[1] * wingLen], [wl - wingDir[0] * wingLen, TOP, zW + wingDir[1] * wingLen], [wl, TOP, zW]],
  [[wr, BOTTOM, zW], [wr + wingDir[0] * wingLen, BOTTOM, zW + wingDir[1] * wingLen], [wr + wingDir[0] * wingLen, TOP, zW + wingDir[1] * wingLen], [wr, TOP, zW]],
]);
const hallMesh = new THREE.Mesh(hall, plateMaterial);
hallMesh.frustumCulled = false;

const zB = zW;
const lip = quads([   // the inner faces of the frame, from its front back to the wall
  [[ap.l * k, ap.b * k, zF], [ap.l, ap.b, zB], [ap.l, ap.t, zB], [ap.l * k, ap.t * k, zF]],
  [[ap.r * k, ap.b * k, zF], [ap.r, ap.b, zB], [ap.r, ap.t, zB], [ap.r * k, ap.t * k, zF]],
  [[ap.l * k, ap.t * k, zF], [ap.l, ap.t, zB], [ap.r, ap.t, zB], [ap.r * k, ap.t * k, zF]],
  [[ap.l * k, ap.b * k, zF], [ap.l, ap.b, zB], [ap.r, ap.b, zB], [ap.r * k, ap.b * k, zF]],
]);
const lipMesh = new THREE.Mesh(lip, lipMaterial);
lipMesh.frustumCulled = false;

const picture = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pictureMaterial);
picture.frustumCulled = false;

function sheet(material, x0, x1, a, b, plane) {   // a flat sheet with uv 0…1; plane 'xy' at depth b.z or 'xz' at height
  const g = new THREE.BufferGeometry();
  const p = plane === 'xy'
    ? [x0, a.y0, a.z, x1, a.y0, a.z, x1, a.y1, a.z, x0, a.y1, a.z]
    : [x0, a.y, a.z0, x1, a.y, a.z0, x1, a.y, a.z1, x0, a.y, a.z1];
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const m = new THREE.Mesh(g, material);
  m.frustumCulled = false;
  return m;
}
const fogWall = sheet(fogMaterial('wall'), -1100, 1100, { y0: FLOOR_Y, y1: ap.b + 26, z: zF + 8 }, null, 'xy');
const fogFloor = sheet(fogMaterial('floor'), -1500, 1500, { y: FLOOR_Y + 3, z0: zF + 10, z1: -1150 }, null, 'xz');
const fogWindow = sheet(fogMaterial('window'), ap.l, ap.r, { y0: ap.b, y1: ap.t, z: zW - 2 }, null, 'xy');
fogWall.renderOrder = 4; fogFloor.renderOrder = 3; fogWindow.renderOrder = 2;

/* Dust: some of it all through the hall, most of it along the way the camera flies, so there is always some close by. */
const DUST_HALL = 380, DUST_WAY = 1100, DUST = DUST_HALL + DUST_WAY;
const dustGeo = new THREE.InstancedBufferGeometry();
{
  const p = new Float32Array(DUST * 3), s = new Float32Array(DUST * 4);
  let seedv = 7;
  const rnd = () => { seedv = (seedv * 16807) % 2147483647; return seedv / 2147483647; };
  for (let i = 0; i < DUST; i++) {
    if (i < DUST_HALL) {
      p[i * 3] = lerp(-1000, 1000, rnd()); p[i * 3 + 1] = lerp(FLOOR_Y, FLOOR_Y + 1150, rnd()); p[i * 3 + 2] = lerp(-F + 40, -500, rnd());
    } else {   // around the line from where the photo was taken to the middle of the canvas
      const along = lerp(-0.08, 1.25, rnd()), ang = rnd() * 6.2832, rad = REAL_HALL ? 60 + 400 * Math.sqrt(rnd()) : 40 + 300 * Math.sqrt(rnd()), a = clamp(along);
      const rise = ap.cy * (1 - (1 - smooth(a)) * (1 - 0.52 * a));   // the camera climbs to the middle of the canvas as it goes
      const sy = REAL_HALL ? flightDrop(a, rise) : 0;   // …and in the real hall first runs low along the floor, and goes further in
      p[i * 3] = ap.cx * a + Math.cos(ang) * rad * 1.5; p[i * 3 + 1] = Math.max(FLOOR_Y + 6, rise + sy + Math.sin(ang) * rad); p[i * 3 + 2] = -F * (REAL_HALL ? 0.68 : 0.52) * along;
    }
    s[i * 4] = rnd(); s[i * 4 + 1] = rnd(); s[i * 4 + 2] = rnd(); s[i * 4 + 3] = rnd();
  }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  dustGeo.setIndex([0, 1, 2, 0, 2, 3]);
  dustGeo.setAttribute('offset', new THREE.InstancedBufferAttribute(p, 3));
  dustGeo.setAttribute('seed', new THREE.InstancedBufferAttribute(s, 4));
  dustGeo.instanceCount = REAL_HALL ? DUST_HALL + 460 : DUST;   // thinner along the way in the real hall: the camera looks through all of it at once
}
const dust = new THREE.Mesh(dustGeo, dustMaterial);
dust.frustumCulled = false; dust.renderOrder = 6;

const HAZE_AT = [-1700, -1490, -1280, -1070, -860, -650, -450, -260];   // far to near, so they are drawn in the right order
const hazeGeo = new THREE.BufferGeometry();
{
  const pos = [], layer = [], idx = [];
  HAZE_AT.forEach((z, i) => {
    const x = 2600, y0 = FLOOR_Y, y1 = FLOOR_Y + 1700, o = i * 4;
    pos.push(-x, y0, z, x, y0, z, x, y1, z, -x, y1, z); layer.push(i, i, i, i); idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  hazeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hazeGeo.setAttribute('layer', new THREE.Float32BufferAttribute(layer, 1));
  hazeGeo.setIndex(idx);
}
const haze = new THREE.Mesh(hazeGeo, hazeMaterial);
haze.frustumCulled = false; haze.renderOrder = 5;

/* A tiling noise picture for the haze: soft cloud in red, thin filaments in green. Made once, at start. */
function noiseTexture(size) {
  let seedv = 20261;
  const rnd = () => { seedv = (seedv * 16807) % 2147483647; return seedv / 2147483647; };
  const layerOf = (period) => { const g = new Float32Array(period * period); for (let i = 0; i < g.length; i++) g[i] = rnd(); return { g, period }; };
  const sample = ({ g, period }, x, y) => {
    const fx = x * period, fy = y * period, ix = Math.floor(fx), iy = Math.floor(fy);
    let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const x0 = ix % period, x1 = (ix + 1) % period, y0 = (iy % period) * period, y1 = ((iy + 1) % period) * period;
    return lerp(lerp(g[y0 + x0], g[y0 + x1], tx), lerp(g[y1 + x0], g[y1 + x1], tx), ty);
  };
  const octaves = (first) => [first, first * 2, first * 4, first * 8, first * 16].map(layerOf);
  const soft = octaves(3), fine = octaves(4);
  const fbm = (set, x, y) => { let a = 0.5, v = 0; for (const o of set) { v += a * sample(o, x, y); a *= 0.5; } return v / 0.96875; };
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = i / size, y = j / size, k = (j * size + i) * 4;
    data[k] = 255 * fbm(soft, x, y);
    data[k + 1] = 255 * Math.pow(1 - Math.abs(2 * fbm(fine, x, y) - 1), 2.4);
    data[k + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
hazeMaterial.uniforms.tNoise.value = pictureMaterial.uniforms.tNoise.value = noiseTexture(512);

/* The hall itself is real geometry (js/hall.js). Add ?hall=photo to the address to see the earlier one,
   the photograph projected onto flat planes, for comparison. */
const FLOAT_TYPE = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;   // a picture with more range than a screen has, where the GPU can draw into one
const hall3d = REAL_HALL ? buildHall(THREE, { F, FLOOR_Y, ap, fr, floatType: FLOAT_TYPE }) : null;
if (hall3d) renderer.shadowMap.enabled = true;
const hallBody = hall3d ? [hall3d.group] : [hallMesh, lipMesh];
scene.add(...hallBody, picture, fogWindow, fogFloor, fogWall, haze, dust);
const hallParts = [...hallBody, fogWindow, fogFloor, fogWall, haze, dust];

/* ---------- How much is drawn: fitted to the machine ----------
   The hall is the heavy part of the site: a lit room drawn twice a frame (once for the mirror in the floor), then put
   through a lens. What that costs depends on the number of points drawn, so the hall is drawn into a picture of its
   own, of a size the machine can keep up with, and enlarged onto the screen; the painting is then put back at the
   screen's full sharpness (see the lens, below), and the film never goes through any of this.
   Each level, from the finest:
     canvas  the most the screen itself holds, in millions of points (never more than 2 per CSS pixel)
     hall    the most the hall's own picture holds, in millions of points
     samples how finely its edges are smoothed
     mirror  the floor's mirror, as a share of the hall's picture along each side (0: no mirror, plain dark stone)
     every   the mirror is redrawn on every n-th frame (it changes slowly, and is shown blurred)
     shade   the soft shade in corners and under ledges;  bloom: the glow around what is bright
   Where it starts: a computer on the first, a tablet on the fourth, a phone on the fifth. Behind the preloader the
   machine is timed drawing the hall and moved down until a frame fits (calibrate, below); while the site runs it is
   moved down again if frames start to be missed (frame, below), and never back up, so it does not hunt.
   Add ?q=0 … ?q=6 to the address to fix the level (0 for a recording at full quality, whatever the machine). */
const QUALITY = [
  { canvas: 8.3, hall: 3.4, samples: 4, mirror: 0.5, every: 2, shade: true, bloom: true },
  { canvas: 8.3, hall: 2.7, samples: 4, mirror: 0.5, every: 2, shade: true, bloom: true },
  { canvas: 6.2, hall: 2.1, samples: 4, mirror: 0.55, every: 2, shade: true, bloom: true },
  { canvas: 4.2, hall: 1.5, samples: 4, mirror: 0.55, every: 2, shade: true, bloom: true },
  { canvas: 3.2, hall: 1.0, samples: 4, mirror: 0.55, every: 2, shade: true, bloom: true },
  { canvas: 2.4, hall: 0.62, samples: 2, mirror: 0.45, every: 3, shade: false, bloom: true },
  { canvas: 1.8, hall: 0.4, samples: 2, mirror: 0, every: 1, shade: false, bloom: false },
];
const askedLevel = new URLSearchParams(location.search).get('q');
const fixedLevel = askedLevel !== null && askedLevel !== '' && !!QUALITY[+askedLevel];
let level = fixedLevel ? +askedLevel : smallScreen ? 4 : finePointer ? 0 : 3;
const FRAME_MS = 13.5;   // a frame of the hall has to be drawn within this for 60 a second, with a little room left for the browser

/* ---------- (The real hall) What a lens, film and soft light add.
   The hall is drawn into a picture first, with more range than a screen has (a lamp can be brighter than white) and
   with its depth kept. From the depth: the soft shade that gathers in corners and under ledges, where light does not
   reach (it is what makes stone sit on stone instead of looking cut out). From the picture: its brightest parts and
   a little of all of it, blurred wide and laid back over, as a lens blooms and softens. Then the colours are eased:
   highlights rolled off, shadows lifted a touch, a little less saturation. That is put together at the size of the
   hall's own picture; last, it is enlarged onto the screen, the corners darkened and a fine grain added at the
   screen's own sharpness.
   The painting itself is marked (alpha 0) and left exactly as it is; where the hall's picture is smaller than the
   screen, the fine detail the painting lost by that is put back from the painting drawn once more on its own at full
   size. And all of this is let go of as the painting fills the screen, so the film takes over from the very same picture. ---------- */
const post = hall3d ? (() => {
  const LEVELS = 5;
  const sceneRT = new THREE.WebGLRenderTarget(4, 4, { type: FLOAT_TYPE, samples: 4, depthTexture: new THREE.DepthTexture(4, 4) });
  const plain = { type: FLOAT_TYPE, depthBuffer: false };
  const onScreen = { depthBuffer: false, colorSpace: THREE.SRGBColorSpace };   // kept as a screen keeps it (finer steps in the dark, a quarter of the memory); read back as light
  const whole = new THREE.WebGLRenderTarget(4, 4, onScreen), alone = new THREE.WebGLRenderTarget(4, 4, onScreen);   // the hall through the lens; the painting on its own
  const down = [], up = [], shade = [new THREE.WebGLRenderTarget(4, 4, plain), new THREE.WebGLRenderTarget(4, 4, plain)];
  for (let i = 0; i < LEVELS; i++) { down.push(new THREE.WebGLRenderTarget(4, 4, plain)); if (i < LEVELS - 1) up.push(new THREE.WebGLRenderTarget(4, 4, plain)); }
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false;
  const stage = new THREE.Scene(); stage.add(quad);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const pass = (uniforms, body) => new THREE.ShaderMaterial({ uniforms: { t: { value: null }, px: { value: new THREE.Vector2() }, ...uniforms }, vertexShader: VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
      vec4 four(vec2 d) { return (texture2D(t, vUv + px * d * vec2(-1.0, -1.0)) + texture2D(t, vUv + px * d * vec2(1.0, -1.0)) + texture2D(t, vUv + px * d * vec2(-1.0, 1.0)) + texture2D(t, vUv + px * d)) * 0.25; }
      ${body}` });
  // the shade of corners: for each point, how much of what is around it stands in front of its own surface
  const corners = pass({ uInv: { value: camera.projectionMatrixInverse }, uProj: { value: camera.projectionMatrix } }, `
    uniform mat4 uInv, uProj;
    vec3 at(vec2 uv) { vec4 p = uInv * vec4(uv * 2.0 - 1.0, texture2D(t, uv).r * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
    void main() {
      vec3 P = at(vUv);
      vec3 a = at(vUv + vec2(px.x, 0.0)) - P, b = P - at(vUv - vec2(px.x, 0.0)), c = at(vUv + vec2(0.0, px.y)) - P, d = P - at(vUv - vec2(0.0, px.y));
      vec3 N = cross(abs(a.z) < abs(b.z) ? a : b, abs(c.z) < abs(d.z) ? c : d);
      N = dot(N, N) > 1e-12 ? normalize(N) : vec3(0.0, 0.0, 1.0);
      float depth = -P.z;
      const float R = 64.0;
      vec2 rad = min(0.5 * R * vec2(uProj[0][0], uProj[1][1]) / depth, vec2(0.09));
      float turn = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2832, sum = 0.0;
      for (int i = 0; i < 14; i++) {
        float f = (float(i) + 0.5) / 14.0, th = float(i) * 2.39996 + turn;
        vec3 v = at(vUv + vec2(cos(th), sin(th)) * rad * sqrt(f)) - P;
        sum += max(0.0, dot(v, N) - 1.2 - 0.0012 * depth) / (dot(v, v) + 50.0);
      }
      gl_FragColor = vec4(clamp(1.0 - sum * R * 0.2, 0.0, 1.0), depth, 0.0, 1.0);
    }`);
  const smooth2 = pass({ dir: { value: new THREE.Vector2() } }, `
    uniform vec2 dir;
    void main() {
      vec2 c = texture2D(t, vUv).rg; float sum = c.r * 0.22, w = 0.22;
      for (int i = 1; i <= 3; i++) {
        float k = i == 1 ? 0.18 : i == 2 ? 0.13 : 0.08;
        for (int s = -1; s <= 1; s += 2) { vec2 q = texture2D(t, vUv + dir * px * float(i * s) * 1.4).rg; float m = k * max(0.0, 1.0 - abs(q.g - c.g) / (0.02 * c.g + 3.0)); sum += q.r * m; w += m; }
      }
      gl_FragColor = vec4(sum / w, c.g, 0.0, 1.0);
    }`);
  const bright = pass({}, `void main() { vec4 c = four(vec2(0.5)); if (isnan(c.r + c.g + c.b + c.a)) c = vec4(0.0); c = max(c, 0.0); float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(min(c.rgb * c.a * (smoothstep(0.82, 1.6, l) + 0.075), vec3(16.0)), 1.0); }`);   // one bad point (not a number, or below zero) must not be spread into a blot
  const smaller = pass({}, `void main() { gl_FragColor = vec4(four(vec2(1.0)).rgb, 1.0); }`);
  const larger = pass({ tAdd: { value: null } }, `uniform sampler2D tAdd; void main() { gl_FragColor = vec4((four(vec2(1.0)) * 0.5 + four(vec2(2.0, 0.0)) * 0.25 + four(vec2(0.0, 2.0)) * 0.25).rgb + texture2D(tAdd, vUv).rgb, 1.0); }`);
  // the hall through the lens, at the size of the hall's own picture
  const lens = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, tBloom: { value: null }, tShade: { value: null }, uFx: { value: 1 }, uShow: { value: 0 }, uShade: { value: 1 }, uBloom: { value: 1 },
      tDepth: { value: null }, tNoise: { value: null }, uInv: { value: camera.projectionMatrixInverse }, uCamW: { value: camera.matrixWorld }, uCamP: { value: camera.position }, uFog: { value: 0 }, uClock: { value: 0 } }, vertexShader: VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t, tBloom, tShade, tDepth, tNoise; uniform float uFx, uShow, uFog, uClock, uShade, uBloom; uniform mat4 uInv, uCamW; uniform vec3 uCamP; varying vec2 vUv;
      /* The fog that pours out of the painting lies on the floor as a volume: thick at the foot of the wall, thinning
         upwards and out towards the camera. For each point of the picture, how much of it lies between the eye and
         what is seen there (worked out exactly: its thickness falls off evenly with height and with distance from
         the wall). So it has no edge from any side, and from low over the floor the eye looks along it. */
      float fogBetween(vec3 C, vec3 P) {
        const float H = 44.0, L = 600.0;
        vec3 d = P - C;
        float a = max(C.y - ${FLOOR_Y.toFixed(1)}, 0.0) / H + max(C.z + ${F.toFixed(1)}, 0.0) / L, b = d.y / H + d.z / L;
        float along = abs(b) > 1e-3 ? (exp(-a) - exp(-a - b)) / b : exp(-a);
        return 0.0034 * length(d) * max(along, 0.0);
      }
      void main() {
        vec4 s = texture2D(t, vUv); if (isnan(s.r + s.g + s.b + s.a)) s = vec4(0.0, 0.0, 0.0, 1.0); s = clamp(s, 0.0, 64.0); vec3 c = s.rgb;
        float hall = s.a * uFx;                                         // 1 on the hall, 0 on the painting
        float shade = uShade > 0.5 ? texture2D(tShade, vUv).r : 1.0;
        c *= mix(1.0, 0.16 + 0.84 * shade, s.a);
        if (uFog > 0.001) {
          vec4 v = uInv * vec4(vUv * 2.0 - 1.0, texture2D(tDepth, vUv).r * 2.0 - 1.0, 1.0);
          vec3 P = (uCamW * vec4(v.xyz / v.w, 1.0)).xyz;
          float billow = texture2D(tNoise, P.xz / 820.0 + vec2(uClock * 0.004, uClock * 0.007)).r * 0.6 + texture2D(tNoise, vec2(P.x + P.z * 0.4, P.y * 2.2) / 560.0 - vec2(0.0, uClock * 0.006)).r * 0.4;
          float tau = fogBetween(uCamP, P) * (0.3 + 1.7 * smoothstep(0.22, 0.8, billow)) * exp(-(P.x / 1050.0) * (P.x / 1050.0));   // squared by hand: pow() of a negative number is undefined, and on some GPUs gives no number at all
          vec3 lit = vec3(0.93, 0.88, 0.8) * (0.4 + 0.5 * exp(-max(P.z + ${F.toFixed(1)}, 0.0) / 1100.0));   // brighter near the painting it comes from
          c = mix(c, lit, (1.0 - exp(-tau)) * uFog);
        }
        vec3 glow = uBloom > 0.5 ? texture2D(tBloom, vUv).rgb * 0.15 : vec3(0.0);
        c += glow * uFx;
        vec3 g = c * 1.22 / (1.0 + 0.22 * c);                           // highlights rolled off, the dark lifted a little
        g = mix(g, g * g * (3.0 - 2.0 * g), 0.24 * step(g, vec3(1.0)));   // a little more contrast: the dark deeper, the light lighter (not above white, where the lamps are)
        g = mix(vec3(dot(g, vec3(0.2126, 0.7152, 0.0722))), g, 0.95);   // a little less saturation
        c = mix(c, g, hall);
        if (uShow > 0.5 && uShow < 1.5) c = vec3(shade); else if (uShow > 1.5 && uShow < 2.5) c = glow; else if (uShow > 2.5) c = s.rgb;   // for looking at the parts on their own
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0 - s.a);             // alpha: how much of this point is the painting (see below)
      }` });
  // the streaks of the rush (see the screen pass): each point gathers what lies between it and the middle of the picture
  const PULL = '0.09';   // how far back towards the middle a streak reaches at the edge of the screen, as a share of the way there
  const smear = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, uRush: { value: 0 }, uAspect: { value: 1 }, uZoom: { value: 1 } }, vertexShader: VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t; uniform float uRush, uAspect, uZoom; varying vec2 vUv;
      void main() {
        vec2 d = vUv - 0.5, m = d * vec2(uAspect, 1.0) * uZoom;
        float pull = uRush * ${PULL} * smoothstep(0.42, 1.1, dot(m, m));
        vec3 sum = vec3(0.0), wsum = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          float f = (float(i) + 0.5) / 8.0;
          vec3 w = vec3(0.4 + 0.9 * f, 0.85, 1.3 - 0.9 * f);   // red from further in along the streak, blue from nearer: the colours part
          sum += texture2D(t, vUv - d * pull * f).rgb * w; wsum += w;
        }
        gl_FragColor = vec4(sum / wsum, 1.0);
      }` });
  const streak = new THREE.WebGLRenderTarget(4, 4, onScreen);
  const streaks = (source) => {
    const u = smear.uniforms; u.uRush.value = rush; u.uAspect.value = screen.uniforms.uAspect.value; u.uZoom.value = lerp(dive.zoom, 1, dive.through);
    run(smear, source, streak); screen.uniforms.tStreak.value = streak.texture;
  };
  // …and onto the screen
  const screen = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, tAlone: { value: null }, tNoise: { value: null }, uLow: { value: new THREE.Vector2() }, uDetail: { value: 0 }, uFx: { value: 1 }, uTime: { value: 0 },
      uRush: { value: 0 }, uOpen: { value: 1 }, uAspect: { value: 1 }, uInk: { value: new THREE.Color(0x0f0b08) }, uZoom: { value: 1 }, uWarp: { value: 0 }, uVeil: { value: 0 }, uThrough: { value: 0 }, uClock: { value: 0 }, tStreak: { value: null }, uCrisp: { value: 0 } }, vertexShader: VERT, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D t, tAlone, tNoise, tStreak; uniform vec2 uLow; uniform float uDetail, uFx, uTime, uRush, uOpen, uAspect, uZoom, uWarp, uVeil, uThrough, uClock, uCrisp; uniform vec3 uInk; varying vec2 vUv;
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        /* Falling into the painting. Past the frame the camera does not stop at the canvas: the picture goes on
           growing (uZoom), and the paint itself starts to move, as if it were still wet and one were sinking into
           it (uWarp: every point is carried a little way along a slow, drifting current). The mist that pours out
           of the painting closes over it (uVeil, below), and inside the mist the grown, swimming paint gives way to
           the film at its true size (uThrough), which then comes out of the mist. */
        vec2 flow = vec2(0.0);
        if (uWarp > 0.001) {
          vec2 w = (vUv - 0.5) * vec2(uAspect, 1.0);
          flow = vec2(texture2D(tNoise, w * 0.42 + vec2(uClock * 0.011, 0.13)).r, texture2D(tNoise, w * 0.42 + vec2(0.61, uClock * 0.009)).r) - 0.5;
          flow += (vec2(texture2D(tNoise, w * 1.3 + vec2(0.27, uClock * 0.017)).r, texture2D(tNoise, w * 1.3 + vec2(uClock * 0.015, 0.83)).r) - 0.5) * 0.4;
          flow *= vec2(1.0 / uAspect, 1.0) * 0.11 * uWarp;
        }
        if (uRush > 0.002) {   // being drawn in: towards the edges the picture is pulled together, as into a funnel (and the streaks, below, run down it)
          vec2 m = (vUv - 0.5) * vec2(uAspect, 1.0);
          float k = 0.07 * uRush * uRush, corner = 0.25 * (uAspect * uAspect + 1.0);
          flow += (vUv - 0.5) * k * (dot(m, m) - corner) / (1.0 + k * corner);   // the corners stay the corners: nothing is drawn in from beyond the picture, the middle comes nearer instead
        }
        vec2 uvIn = (vUv - 0.5 + flow) / uZoom + 0.5, uvOut = vUv + flow * 0.5;
        uvIn = 1.0 - abs(1.0 - abs(uvIn));   // what is drawn in from beyond the edge of the picture is the picture turned back on itself, not its last line pulled out into stripes
        vec2 uv = mix(uvIn, uvOut, uThrough);
        vec4 s = texture2D(t, uvIn);
        if (uThrough > 0.001) s = mix(s, texture2D(t, uvOut), uThrough);
        vec3 c = s.rgb;
        /* The hall was drawn smaller than the screen and has just been enlarged, which softens it. Its edges are
           drawn firm again (uCrisp): each point is pushed away from the average of its four neighbours in the smaller
           picture, but never beyond the range they span, so nothing rings and nothing glows that did not. */
        if (uCrisp > 0.0 && s.a < 0.996) {
          vec2 T = uLow * 2.0;
          vec3 n = texture2D(t, uv + vec2(0.0, T.y)).rgb, so = texture2D(t, uv - vec2(0.0, T.y)).rgb, ea = texture2D(t, uv + vec2(T.x, 0.0)).rgb, we = texture2D(t, uv - vec2(T.x, 0.0)).rgb;
          vec3 lo = min(c, min(min(n, so), min(ea, we))), hi = max(c, max(max(n, so), max(ea, we)));
          c = mix(c, clamp(c + (c - (n + so + ea + we) * 0.25) * uCrisp, lo, hi), 1.0 - s.a);
        }
        /* The painting, where it shows (s.a), was drawn at the hall's size and has just been enlarged: soft. The
           same painting drawn alone at the screen's size has all its detail; what the smaller picture could not
           hold is the difference between that and its own average over one point of the smaller picture. Added back,
           the painting is as sharp as the screen, with the dust, the fog and the light of the hall still over it. */
        if (uDetail > 0.0 && s.a > 0.004) {
          vec4 p = texture2D(tAlone, uv);
          vec4 a = texture2D(tAlone, uv - uLow), b = texture2D(tAlone, uv + vec2(uLow.x, -uLow.y)), d = texture2D(tAlone, uv + vec2(-uLow.x, uLow.y)), e = texture2D(tAlone, uv + uLow);
          float inside = min(p.a, min(min(a.a, b.a), min(d.a, e.a)));   // not at the painting's own edge (behind the frame anyway)
          c += (p.rgb - (a.rgb + b.rgb + d.rgb + e.rgb) * 0.25) * s.a * inside * uDetail;
        }
        /* The rush through the frame (uRush, 0…1): everything streaks away from the middle of the screen, the more
           the further out, as it does to a camera that is suddenly moving fast; the middle, where the eye is going,
           stays sharp. Along each streak the colours come apart a little (red reaches furthest, blue least), as
           they do at the edge of a lens. The streaks were drawn in a pass of their own (smear, above); here the
           gaps between its steps are filled in. */
        if (uRush > 0.002) {
          vec2 d = uv - 0.5, m = (vUv - 0.5) * vec2(uAspect, 1.0);
          float pull = uRush * ${PULL} * smoothstep(0.42, 1.1, dot(m, m));
          vec3 sum = vec3(0.0);
          float part = uRush * 0.01 * smoothstep(0.3, 1.0, dot(m, m));   // …and at the edges red and blue are thrown apart, as by a lens pushed past what it can hold together
          for (int i = 0; i < 4; i++) {
            vec2 at = uv - d * pull * (float(i) + 0.5) / 32.0;
            sum += vec3(texture2D(tStreak, at - d * part).r, texture2D(tStreak, at).g, texture2D(tStreak, at + d * part).b);
          }
          c = mix(c, sum * 0.25, clamp(pull * 70.0, 0.0, 1.0));
        }
        if (uVeil > 0.001) {   // the light at the bottom of the fall: the picture brightens from within and a warm haze drifts over it; it never hides the picture
          vec2 w = (vUv - 0.5) * vec2(uAspect, 1.0);
          float bank = texture2D(tNoise, w * 0.55 + vec2(uClock * 0.02, -uClock * 0.013)).r;
          float light = 0.55 + 0.45 * exp(-dot(w - vec2(0.0, 0.12), w - vec2(0.0, 0.12)) * 1.6);
          c = c * (1.0 + 0.3 * uVeil) + vec3(1.0, 0.92, 0.78) * uVeil * light * (0.13 + 0.3 * bank);
        }
        vec2 q = (vUv - 0.5) * vec2(1.0, 0.86);
        c *= 1.0 - 0.4 * uFx * smoothstep(0.3, 0.82, length(q));
        c += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * 0.018 * uFx * (0.35 + 0.65 * smoothstep(0.0, 0.25, max(c.r, c.g)));
        /* Enter (uOpen, 0 → 1): the dark of the preloader is not faded, it is eaten away. Every point has a number,
           low in the middle of the screen and rising outwards, made ragged by a cloud that stands still; a point
           comes through when the rising level passes its number. So the hall opens from the middle in spreading
           blots, with a thin warm line of lamplight along their edge (both sides are dark: without it the edge
           would not be seen), and the lamps come up as it opens. */
        if (uOpen < 0.999) {
          vec2 m = (vUv - 0.5) * vec2(uAspect, 1.0);
          float cloud = texture2D(tNoise, m * 0.5 + 0.37).r * 0.72 + texture2D(tNoise, m * 2.1 + 0.11).r * 0.28;
          float e = length(m) / length(vec2(uAspect, 1.0)) * 1.26 + cloud * 0.62 - mix(0.13, 1.13, uOpen);   // above 0: still dark (the corners come through last, on a screen of any shape)
          c *= mix(0.5, 1.0, uOpen * uOpen);
          vec3 edge = vec3(1.0, 0.74, 0.46) * 0.42 * exp(-max(e, 0.0) / 0.011) * smoothstep(0.0, 0.25, uOpen) * (1.0 - smoothstep(0.75, 1.0, uOpen));
          c = mix(c, uInk + edge, smoothstep(0.0, 0.005, e));
        }
        gl_FragColor = vec4(max(c, 0.0), 1.0);
        ${OUT}
      }` });
  const size = new THREE.Vector2();
  const run = (mat, source, target) => { const w = source.isTexture ? sceneRT.width : source.width, h = source.isTexture ? sceneRT.height : source.height; mat.uniforms.t.value = source.isTexture ? source : source.texture; if (mat.uniforms.px) mat.uniforms.px.value.set(1 / w, 1 / h); quad.material = mat; renderer.setRenderTarget(target); renderer.render(stage, flat); };
  let q = QUALITY[level], sharpen = false;
  return {
    width: 4, height: 4,
    show(v) { lens.uniforms.uShow.value = v; },   // for looking at the shade on its own
    resize(to) {
      q = to;
      renderer.getDrawingBufferSize(size);
      const k = Math.min(1, Math.sqrt(q.hall * 1e6 / (size.x * size.y)));   // the hall's own picture against the screen, along each side
      const w = this.width = Math.max(2, Math.round(size.x * k)), h = this.height = Math.max(2, Math.round(size.y * k));
      sharpen = k < 0.97;
      screen.uniforms.uCrisp.value = sharpen ? Math.min(0.8, 1 / k - 1) : 0;   // more the more it was enlarged, but not so much that a slanting edge turns into steps
      if (sceneRT.samples !== q.samples) { sceneRT.samples = q.samples; sceneRT.dispose(); }
      sceneRT.setSize(w, h); whole.setSize(w, h);
      alone.setSize(size.x, size.y); streak.setSize(Math.max(2, size.x >> 1), Math.max(2, size.y >> 1));
      screen.uniforms.uAspect.value = size.x / size.y;
      screen.uniforms.uLow.value.set(0.5 / w, 0.5 / h);
      for (const rt of shade) rt.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1));
      for (let i = 0; i < LEVELS; i++) { const bw = Math.max(2, w >> (i + 1)), bh = Math.max(2, h >> (i + 1)); down[i].setSize(bw, bh); if (up[i]) up[i].setSize(bw, bh); }
    },
    render(fx, time) {
      pictureMaterial.uniforms.uAlpha.value = 0;   // the picture is marked only in this drawing
      renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
      pictureMaterial.uniforms.uAlpha.value = 1;
      if (q.shade) {
        run(corners, sceneRT.depthTexture, shade[0]);
        smooth2.uniforms.dir.value.set(1, 0); run(smooth2, shade[0], shade[1]);
        smooth2.uniforms.dir.value.set(0, 1); run(smooth2, shade[1], shade[0]);
      }
      let acc = down[LEVELS - 1];
      if (q.bloom) {
        run(bright, sceneRT, down[0]);
        for (let i = 1; i < LEVELS; i++) run(smaller, down[i - 1], down[i]);
        for (let i = LEVELS - 2; i >= 0; i--) { larger.uniforms.tAdd.value = down[i].texture; run(larger, acc, up[i]); acc = up[i]; }
      }
      const lu = lens.uniforms;
      lu.tBloom.value = acc.texture; lu.tShade.value = shade[0].texture; lu.uShade.value = q.shade ? 1 : 0; lu.uBloom.value = q.bloom ? 1 : 0; lu.uFx.value = fx;
      lu.tDepth.value = sceneRT.depthTexture; lu.tNoise.value = hazeMaterial.uniforms.tNoise.value; lu.uFog.value = fogNow; lu.uClock.value = time;
      run(lens, sceneRT, whole);
      if (sharpen) {   // the painting on its own, at the size of the screen
        const was = scene.children.map((o) => o.visible);
        for (const o of scene.children) o.visible = o === picture;
        renderer.setRenderTarget(alone); renderer.setClearAlpha(0); renderer.clear(); renderer.render(scene, camera); renderer.setClearAlpha(1);
        scene.children.forEach((o, i) => { o.visible = was[i]; });
      }
      const su = screen.uniforms;
      su.tAlone.value = alone.texture; su.tNoise.value = hazeMaterial.uniforms.tNoise.value; su.uDetail.value = sharpen ? 1 : 0; su.uFx.value = fx; su.uTime.value = time; su.uRush.value = rush; su.uOpen.value = opened;
      su.uZoom.value = dive.zoom; su.uWarp.value = dive.warp; su.uVeil.value = dive.veil; su.uThrough.value = dive.through; su.uClock.value = time;
      if (rush > 0) streaks(whole);
      run(screen, whole, null);
    },
    /* Inside the film, for the moments just after the frame is crossed (and just before it is crossed again on the
       way out): the film's picture, with the rush still dying away over it. */
    film(time) {
      renderer.setRenderTarget(alone); renderer.setClearAlpha(0); renderer.clear(); renderer.render(scene, camera); renderer.setClearAlpha(1);
      const su = screen.uniforms;
      su.tNoise.value = hazeMaterial.uniforms.tNoise.value; su.uDetail.value = 0; su.uFx.value = 0; su.uTime.value = time; su.uRush.value = rush; su.uOpen.value = 1; const crisp = su.uCrisp.value; su.uCrisp.value = 0;
      su.uZoom.value = dive.zoom; su.uWarp.value = dive.warp; su.uVeil.value = dive.veil; su.uThrough.value = dive.through; su.uClock.value = time;
      if (rush > 0) streaks(alone);
      run(screen, alone, null);
      su.uCrisp.value = crisp;
    },
  };
})() : null;
let fogNow = 0;   // the fog on the floor, as the lens draws it (0…1)
let fx = 1;   // how much of that is on: all of it in the hall, none by the time the painting fills the screen
let rush = 0;      // the rush through the frame, 0…1 (see the screen pass)
let opened = 1;    // Enter: 0 the dark of the preloader, 1 the hall (see the screen pass)
const dive = { zoom: 1, warp: 0, veil: 0, through: 0, on: false };   // falling into the painting (see the screen pass)

/* ---------- Film: a packed frame sequence (tools/pack_frames.py), frames become textures on demand ---------- */
const decodedFrames = [];
let decodedBytes = 0;
/* A frame is asked for exactly as the GPU wants it (flipped, straight alpha, no colour conversion), so its upload is
   a plain copy. Not every browser does all of that (older Safari takes no options, or does not flip), so it is tried
   once on a two-pixel picture: whatever comes back, the film is decoded the way that works and drawn the right way up. */
let bitmapOptions = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
async function probeBitmaps() {
  let flipped = false;
  try {
    const c = document.createElement('canvas'); c.width = 2; c.height = 2;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, 2, 1); x.fillStyle = '#000'; x.fillRect(0, 1, 2, 1);   // white above, black below
    const blob = await new Promise((done) => c.toBlob(done, 'image/png'));
    let bitmap;
    try { bitmap = await createImageBitmap(blob, bitmapOptions); }
    catch (e) { bitmapOptions = null; bitmap = await createImageBitmap(blob); }
    x.clearRect(0, 0, 2, 2); x.drawImage(bitmap, 0, 0);
    flipped = x.getImageData(0, 0, 1, 1).data[0] < 128;   // black on top now: the flip was done
    if (bitmap.close) bitmap.close();
  } catch (e) { bitmapOptions = null; }
  pictureMaterial.uniforms.uTurn.value = flipped ? 0 : 1;
}
const DECODED_MAX = smallScreen ? 90e6 : finePointer ? 340e6 : 200e6;   // memory for decoded frames, across all films: about 40 frames of 1080p on a computer, 24 on a tablet, 24 of 720p on a phone
class Film {
  constructor(buffer) {
    const view = new DataView(buffer);
    this.count = view.getUint32(0, true);
    this.offsets = new Uint32Array(buffer, 4, this.count + 1);
    this.bytes = new Uint8Array(buffer);
    this.textures = new Map();
    this.pending = new Set();
  }
  get(i) { return this.textures.get(i) || null; }
  behind(i, dir = 1) { for (let d = 1; d < 40; d++) { const a = this.textures.get(i - d * dir); if (a) return a; } return null; }   // the nearest frame already passed
  nearest(i, dir = 1) { for (let d = 1; d < 40; d++) { const a = this.textures.get(i - d * dir) || this.textures.get(i + d * dir); if (a) return a; } return null; }   // the frame just behind first: never a step back
  want(i, dir = 1, step = 1) {
    // The frames ahead, nearest first; when the scroll runs faster than the film, only every `step`-th of them.
    this.at = i; this.step = step;
    for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, -1]) {
      const n = i + k * dir * step;
      if (n < 0 || n >= this.count || this.textures.has(n) || this.pending.has(n)) continue;
      if (this.pending.size >= 5) break;
      this.pending.add(n);
      const blob = new Blob([this.bytes.subarray(this.offsets[n], this.offsets[n + 1])], { type: 'image/webp' });
      (bitmapOptions ? createImageBitmap(blob, bitmapOptions) : createImageBitmap(blob)).then((bitmap) => {
        if (Math.abs(n - this.at) > 12 * this.step + 6) { bitmap.close(); return; }   // the scroll has moved on: not worth keeping
        const t = new THREE.Texture(bitmap);
        t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.premultiplyAlpha = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true;
        t.userData.bytes = bitmap.width * bitmap.height * 4; t.userData.frame = n;
        this.textures.set(n, t); decodedFrames.push([this, n]); decodedBytes += t.userData.bytes;
        while (decodedBytes > DECODED_MAX && decodedFrames.length > 12) {   // the oldest go first, never the ones on screen
          const [f, old] = decodedFrames.shift(); const tx = f.textures.get(old);
          if (tx && (tx === pictureMaterial.uniforms.tA.value || tx === pictureMaterial.uniforms.tB.value)) { decodedFrames.push([f, old]); break; }
          if (tx) { decodedBytes -= tx.userData.bytes; tx.dispose(); if (tx.image && tx.image.close) tx.image.close(); f.textures.delete(old); }
        }
        dirty = true;
      }).catch(() => {}).finally(() => this.pending.delete(n));
    }
  }
}

/* ---------- Loading ---------- */
const loader = new THREE.TextureLoader();
function loadTexture(src, mirror) {
  return loader.loadAsync(src).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (mirror) { t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; }
    return t;
  });
}
const films = [];
let dirty = true;

/* ---------- Camera ---------- */
const view = { W: 1, H: 1, F: 1, u0: 0, v0: 0, fill: 1 };
const OVERSCAN = 1.035;   // the picture is drawn a little larger than the screen, so its edges never show while the camera drifts
let sizedFor = '';
function resize() {
  const W = canvas.clientWidth || window.innerWidth, H = canvas.clientHeight || window.innerHeight;   // the stage: the window, or on a phone the screen with the browser's bars away
  const q = QUALITY[level];
  const ratio = Math.max(0.5, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(q.canvas * 1e6 / (W * H))));   // device pixels per CSS pixel: the screen's own, at most 2, and no more points in all than this level holds
  const key = `${W}x${H}@${ratio.toFixed(3)}/${level}`;
  if (key === sizedFor) return;   // nothing has changed (a phone sends "resize" every time its bars slide away): every buffer stays as it is
  sizedFor = key;
  renderer.setPixelRatio(ratio);
  renderer.setSize(W, H, false);
  const s = Math.max(W / PLATE.w, H / PLATE.h) * OVERSCAN;   // the plate covers the screen, like background-size: cover
  view.W = W; view.H = H; view.F = F * s;
  view.u0 = W / 2 + (EYE.px - PLATE.w / 2) * s;
  view.v0 = H / 2 + (EYE.py - PLATE.h / 2) * s;
  view.fill = Math.min(ap.w * view.F / W, ap.h * view.F / H) * 0.992;   // distance to the wall at which the canvas fills the screen
  if (post) { post.resize(q); hall3d.setMirror({ share: q.mirror, samples: q.samples }); hall3d.resize(post.width, post.height); }
  // the dust is sized in points of the picture it is drawn into: the hall's own, or the screen
  const dw = post ? post.width : renderer.domElement.width, dh = post ? post.height : renderer.domElement.height;
  dustMaterial.uniforms.uScale.value = dh / 900;
  dustMaterial.uniforms.uRes.value.set(dw, dh);
  mirrorDue = true; dirty = true;
}
function project(cx, cy, cz, u0, v0, Fs) {
  const { W, H } = view, n = 4, fa = 12000;
  camera.position.set(cx, cy, cz);
  camera.projectionMatrix.set(
    2 * Fs / W, 0, 1 - 2 * u0 / W, 0,
    0, 2 * Fs / H, 2 * v0 / H - 1, 0,
    0, 0, -(fa + n) / (fa - n), -2 * fa * n / (fa - n),
    0, 0, -1, 0);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

/* ---------- Pointer ---------- */
const pointer = { x: 0, y: 0, sx: 0, sy: 0, px: -100, py: -100, seen: false, onUI: false };
const cursor = $('#cursor');
if (finePointer) {
  document.documentElement.classList.add('has-cursor');
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.px = e.clientX; pointer.py = e.clientY;
    if (!pointer.seen) { pointer.seen = true; cursor.classList.add('is-on'); }
    cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    pointer.onUI = !!(e.target.closest && e.target.closest('button, a'));
    cursor.classList.toggle('is-hover', pointer.onUI);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.seen = false; cursor.classList.remove('is-on'); });
}
// [element, horizontal travel in px, vertical travel in px]: these drift a little with the pointer
const domLayers = [[$('#titles'), 9, 5], [$('#bodies'), 13, 7], [$('#centers'), 9, 5], [$('#card'), 13, 8], [$('.overlay__figure'), -18, -12], [$('.overlay__left'), 9, 5], [$('.overlay__right'), 9, 5]];

/* ---------- Interface: the texts, the card, the rail, the original painting ---------- */
const el = (id) => document.getElementById(id);
const pos = (id, sec = 0) => moment(id, sec) / T_TOTAL;   // a moment as a scroll position, 0…1
const filmsFrom = pos('ch1'), filmsTo = pos('out'), lastFrom = pos('out', 3.2), lastTo = pos('return', 0.3);   // where the scroll is given more weight (see update)
const { CHAPTERS, CARD_RANGES, RAIL_RANGE, SCENES, AGAIN_RANGE, AGAIN_MS, HINT_AGAIN_RANGE, TOUCH_RANGES } = buildContent(pos, 1);
const inRange = (p, [a, b]) => p >= a && p < b;
const stage = el('stage'), card = el('card'), cardImg = el('cardImg'), cardCap = el('cardCap'), againBtn = el('againBtn'), hintWord = el('hintWord'), overlay = el('overlay');
const railItems = [...document.querySelectorAll('.rail__item')];
const unit = (n) => `calc(var(--u) * ${n})`;
for (const scene of SCENES) {
  if (scene.type === 'center') {
    scene.el = Object.assign(document.createElement('p'), { className: 'center', textContent: scene.text });
    if (scene.phoneWidth) scene.el.style.setProperty('--wm', `${scene.phoneWidth}px`);
    el('centers').append(scene.el);
    continue;
  }
  scene.el = Object.assign(document.createElement('div'), { className: 'title' + (scene.id === 'hero' || scene.id === 'finale' ? ' title--dim' : '') });
  scene.el.innerHTML = `<p class="title__label">${scene.label}</p><p class="title__text display">${scene.title}</p>`;
  scene.bodyEl = Object.assign(document.createElement('p'), { className: 'body', innerHTML: scene.body });
  scene.bodyEl.style.width = unit(scene.width);
  if (scene.phoneWidth) scene.bodyEl.style.setProperty('--wm', `${scene.phoneWidth}px`);
  el('titles').append(scene.el); el('bodies').append(scene.bodyEl);
}
let chapterIndex = -1, lastUI = -1;
function updateUI(p) {
  for (const scene of SCENES) {
    const on = (scene.ranges || [scene.range]).some((r) => inRange(p, r));
    scene.el.classList.toggle('is-on', on);
    if (scene.bodyEl) scene.bodyEl.classList.toggle('is-on', scene.bodyRange ? inRange(p, scene.bodyRange) : on);
  }
  stage.classList.toggle('has-rail', inRange(p, RAIL_RANGE));
  const cardOn = CARD_RANGES.some((r) => inRange(p, r));   // a painting is on screen (not the way between two)
  card.classList.toggle('is-on', cardOn); stage.classList.toggle('has-card', cardOn);
  let ci = 0;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (p >= CHAPTERS[i].start) { ci = i; break; }
  if (ci !== chapterIndex) {
    chapterIndex = ci;
    cardImg.src = CHAPTERS[ci].thumb; cardCap.textContent = CHAPTERS[ci].cardCaption;
    railItems.forEach((item, i) => item.classList.toggle('is-current', i === ci));
  }
  railItems.forEach((item, i) => item.style.setProperty('--p', clamp((p - CHAPTERS[i].start) / (CHAPTERS[i].end - CHAPTERS[i].start)).toFixed(4)));
  againBtn.classList.toggle('is-on', inRange(p, AGAIN_RANGE));
  const word = inRange(p, HINT_AGAIN_RANGE) ? 'watch again' : 'step inside';
  if (word !== hintWord.textContent) hintWord.textContent = word;
}

// Navigation
let leap = false;   // the page has been sent somewhere (a chapter in the rail, the logo): the picture goes there at once, the films' and the last hall's weight is not put on it
function scrollToProgress(p) {
  leap = true;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: p * max, behavior: reducedMotion ? 'auto' : 'smooth' });
}
// On a phone there is no card: the chapter you are in shows "Click to view" on its thumbnail and opens the original.
railItems.forEach((item, i) => item.addEventListener('click', () => {
  if (phone.matches && i === chapterIndex && stage.classList.contains('has-card')) openOverlay(CHAPTERS[i].overlay); else scrollToProgress(CHAPTERS[i].start + 0.021);
}));
el('logo').addEventListener('click', (e) => { e.preventDefault(); scrollToProgress(0); });
// "Watch again" does not jump: it plays the return to the first hall at its own pace. Any input takes the scroll back.
let glide = null;
function glideToEnd(ms) {
  if (reducedMotion) return window.scrollTo(0, 0);
  // The ruined hall stands still until the return begins, so the wait is skipped: the page is put at the first
  // moment of the return (nothing on screen changes) and sets off from there at once.
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const from = Math.max(window.scrollY, pos('return') * max);
  if (from > window.scrollY) { window.scrollTo(0, from); current = target = from / max; }
  glide = { from, to: max, start: performance.now(), ms };
}
function stepGlide(now) {
  if (!glide) return;
  const u = clamp((now - glide.start) / glide.ms);
  window.scrollTo(0, glide.from + (glide.to - glide.from) * (u + 0.6 * u * (1 - u)));   // off at once and easing to a stop: the return has its own soft start
  if (u >= 1) glide = null;
}
['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, () => { glide = null; leap = false; }, { passive: true }));
againBtn.addEventListener('click', () => glideToEnd(AGAIN_MS));

// The original painting
let entered = false;   // the preloader is gone and the hall is on screen
let lastFocus = null;
function openOverlay(data) {
  el('ovYear').textContent = data.year; el('ovTitle').textContent = data.title; el('ovLabel').innerHTML = data.label.join('<br>');
  Object.assign(el('ovImg'), { src: data.image, alt: data.alt || '' });
  el('ovText').innerHTML = data.text.map((t) => `<p>${t}</p>`).join('');
  lastFocus = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('is-locked');
  stage.classList.add('is-veiled');   // the interface steps aside: only the picture stays behind the overlay
  requestAnimationFrame(() => overlay.classList.add('is-on'));
  el('ovClose').focus({ preventScroll: true });
}
function closeOverlay() {
  if (overlay.hidden) return;
  overlay.classList.remove('is-on');
  document.body.classList.remove('is-locked');
  stage.classList.remove('is-veiled');
  setTimeout(() => { overlay.hidden = true; }, 500);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
card.addEventListener('click', () => openOverlay(CHAPTERS[Math.max(0, chapterIndex)].overlay));
el('ovClose').addEventListener('click', closeOverlay);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
  if (e.key === 'Tab' && !overlay.hidden) {   // keep focus inside the dialog
    const items = [...overlay.querySelectorAll('button')], first = items[0], lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Frame ---------- */
const fogs = [fogWall.material, fogFloor.material, fogWindow.material];
let target = 0, current = 0, lastTime = 0, elapsed = 0, lastT = -1, lastDrawn = -1;
let hold = null;                       // { t, time, dt }: a fixed moment to draw, for making recordings frame by frame
const seen = new THREE.Matrix4();      // the camera of the frame drawn last, for the streaks of the dust
let seenValid = false;
let lastFilm = null, lastP = 0, onFilm = false, heldOf = null;   // onFilm: the picture's two frames are frames of a film (not the painting)
const shift = new THREE.Matrix4();

function update(dt) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  target = max > 0 ? clamp(window.scrollY / max) : 0;
  if (reducedMotion) current = target;
  else {
    // The picture follows the scroll with a little weight. Inside a film more of it, and no faster than a film can be
    // watched: the scroll is a hand on the reel, not a switch. In the last hall slower still, so that each of its two
    // screens (the closing words; "Watch again") is come to and seen, and not run past on the momentum of a flick.
    const was = current, ahead = (target - current) * T_TOTAL;                                          // how far the scroll is ahead, in seconds of the timeline
    const inFilms = current >= filmsFrom && current < filmsTo, inLast = current >= lastFrom && current < lastTo;
    current += (target - current) * (1 - Math.exp(-dt * (inFilms ? 2.3 : inLast ? 2.6 : 4)));
    if (leap && Math.abs(ahead) < 0.05) leap = false;
    const most = glide || leap || Math.abs(ahead) > 14 ? Infinity : inLast && ahead > 0 ? 1.6 : inFilms ? 3.4 : Infinity;   // seconds of the timeline per second (a jump from far away, or "Watch again", is not held back)
    if (Math.abs(current - was) * T_TOTAL > most * dt) current = was + Math.sign(current - was) * most * dt / T_TOTAL;
  }
  if (Math.abs(target - current) < 0.00002) current = target;
  // The film is a circle: its end is the hall it began in. Reaching the end puts the page back at the top, unseen.
  if (current >= 0.9995 && target >= 0.9995) { glide = null; window.scrollTo(0, 0); current = target = 0; }
  if (hold) current = target = clamp(hold.t / T_TOTAL);

  const k2 = 1 - Math.exp(-dt * 3.2);
  pointer.sx += (pointer.x - pointer.sx) * k2; pointer.sy += (pointer.y - pointer.sy) * k2;

  const t = current * T_TOTAL;
  let g = SEGS[SEGS.length - 1];
  for (const x of SEGS) if (t < x.start + x.dur) { g = x; break; }
  const u = clamp((t - g.start) / g.dur);
  const jumped = Math.abs(t - lastT) > 1.2;   // the page was moved in one go (back to the top, a jump): not a movement of the camera
  const before = lastT;

  // What this moment looks like. The defaults are the first hall at rest.
  let e = 0;          // camera: how much of the way from where the photo was taken to the frame it has travelled
  let wide = 1;       // the lens: above 1 it takes in a little more than the photo's own angle
  let live = 0;       // the picture: 0 the painting, 1 the film
  let paint = 0;      // which painting hangs here: 0 the first, 1 the last
  let restore = 1;    // the hall: 0 in ruins, 1 as it was
  let fog = 1, dustAmount = 1, hazeAmount = 0.4, glow = 0, reg = 0, regSet = REG_IN;
  let film = null, p = 0, inFilm = false;
  let into = 1, nearer = 1, dove = 0, develop = 0, filmZoom = 1, rect = null;   // the dive into the painting (see DIVE)

  switch (g.id) {
    case 'in': {
      // What the eye follows is the painting growing, and it grows in one run that never stops: across the hall up to
      // the frame, where the flight is at its fastest, and on into the painting, faster still: a fall. (Counted the
      // way the eye counts it: by how many times larger the painting has become.)
      const toFrame = Math.log((F + WINDOW_DEPTH) / (view.fill + WINDOW_DEPTH)), further = Math.log(DIVE.by);
      const fly = clamp(u / DIVE.from);
      dove = clamp((u - DIVE.from) / (1 - DIVE.from));
      // The dive is a being-drawn-in: it sets off slowly (the camera all but hangs before the painting for a moment)
      // and gathers speed more and more, to end at exactly the pace the film is moving in at.
      const pace = 0.3, end = Math.max(1.2, DIVE.push * 24 * (1 - DIVE.from) * T_FLY / further), power = (end - pace) / (1 - pace);
      const flyEnd = clamp(pace * further * DIVE.from / (toFrame * (1 - DIVE.from)), 0.45, 2.4);   // the flight reaches the frame at the pace the dive sets off with: one run, no change of step
      const grown = toFrame * run(fly, START_PACE, flyEnd) + further * (pace * dove + (1 - pace) * Math.pow(dove, power));
      e = clamp((F - ((F + WINDOW_DEPTH) * Math.exp(-Math.min(grown, toFrame)) - WINDOW_DEPTH)) / (F - view.fill));
      nearer = Math.exp(Math.max(0, grown - toFrame));   // past the frame: how many times nearer than the place from which the painting fills the screen
      // …and as it is drawn in, the painting opens onto the film. The film's first frames are the painting itself seen
      // from nearer and nearer, so the frame shown is the one on which the film's camera is as near as ours is now: the
      // film moves because we move, and lies exactly over the painting all the way.
      film = films[0]; p = frameMovedIn(nearer * (1 + 0.0085 * dove * dove) / 1.0085);
      live = smooth(clamp((dove - 0.14) / 0.84)); develop = 1; rect = filmInPainting(p);
      // nothing else stirs: the fog keeps falling as it was and is left below, the dust hangs where it hung
      fog = 1 - sstep(0.62, 0.96, fly); dustAmount = 1 - sstep(0.86, 1, fly); hazeAmount = lerp(0.4, 1.6, sstep(0, 0.3, fly)) * dustAmount;
      glow = sstep(0.6, 1, fly) * 0.5;
      break;
    }
    case 'ch1': case 'ch2': case 'ch3':
      e = 1; live = 1; inFilm = true; fog = 0; paint = g.id === 'ch1' ? 0 : 1;
      film = films[g.film]; p = frameAt(g, t - g.start);
      // the next film is made ready before it is needed, and the one before on the way back: a chapter never begins on an empty picture
      if (p > g.to - 36 && films[g.film + 1]) films[g.film + 1].want(SEGS.find((x) => x.film === g.film + 1).from, 1);
      if (p < g.from + 36 && g.film > 0) films[g.film - 1].want(SEGS.find((x) => x.film === g.film - 1).to - 1, -1);
      break;
    case 'out':
      // the film was pulling back; the camera takes over at the same speed and rolls to a stop in the hall
      e = 1 - run(u, PULL_OUT * g.dur * (view.fill + WINDOW_DEPTH) / (F - view.fill), 0);
      film = films[2]; p = CH3_EXIT; regSet = REG_OUT; reg = sstep(0, 0.3, u);   // the frozen last frame settles onto the painting's exact place before the two are exchanged
      live = 1 - sstep(SWAP_OUT[0], SWAP_OUT[1], u);
      paint = 1; restore = 0; fog = 0; dustAmount = 0.7 * sstep(0.04, 0.3, u); hazeAmount = 0.6 * sstep(0.04, 0.3, u);
      break;
    case 'finale':
      paint = 1; restore = 0; fog = 0; dustAmount = 0.7; hazeAmount = 0.6;
      break;
    case 'return':
      // first the painting turns back into the first one, then the hall around it, then the fog returns
      paint = 1 - sstep(0, 0.5, u); restore = sstep(0.14, 0.86, u); fog = sstep(0.5, 1, u);
      dustAmount = lerp(0.7, 1, u); hazeAmount = lerp(0.6, 0.4, u); glow = Math.sin(Math.PI * clamp(u / 0.75)) * 0.3;
      break;
  }

  // (The real hall only.) A camera, not a zoom. Its lens opens as it closes in: for the picture to grow the same way
  // it has to come almost twice as near, so the hall stretches away past the edges of the screen and the camera goes
  // through the frame instead of stopping before it. The picture itself grows exactly as it did, so the film still
  // takes over without a seam.
  const lens = hall3d ? 1 + LENS * sstep(0.05, 0.95, e) : 1;
  // In the real hall the painting hangs in its frame, as a painting does (hung = true), and the camera comes right up
  // to it: the frame leaves the screen at the very moment the canvas fills it. Inside the film nothing of the hall is
  // seen, and the picture stands as it always did.
  const hung = !!hall3d && !inFilm;
  const dist = hung ? lerp(F, view.fill / 1.003, e) / lens : (lerp(F, view.fill, e) + WINDOW_DEPTH) / lens - WINDOW_DEPTH;   // distance to the wall
  const Fv = view.F / (wide * lens);                                           // the focal length on screen at this moment

  // Where the centre of the canvas sits on screen: from its place in the photo to the centre of the screen.
  const uA0 = view.u0 + view.F * ap.cx / F, vA0 = view.v0 - view.F * ap.cy / F;
  const along = smooth(e);
  const uT = lerp(uA0, view.W / 2, along), vT = lerp(vA0, view.H / 2, along);

  // Pointer and a slow drift move the camera sideways; the lens shifts back most of the way, so the wall
  // stays nearly put while the wings, the frame and the picture in the window slide against it. On the run
  // the camera holds its line.
  const free = finePointer && !reducedMotion ? Math.pow(1 - e, 3) : 0;
  const ox = (pointer.sx * 120 + Math.sin(elapsed * 0.21) * 14) * free;
  const oy = (-pointer.sy * 52 + Math.sin(elapsed * 0.17 + 1.3) * 8) * free;
  const KEEP = 0.86;
  let cx, cy, cz, pv = view.v0;
  if (g.id === 'in' && !(hall3d && !reducedMotion)) into = nearer;   // where the camera cannot make the dive itself (the photograph hall, reduced movement), the painting is enlarged instead
  if (hall3d && g.id === 'in' && !reducedMotion) {
    // The way in, in the real hall: straight in. From where it stands the camera goes along one straight line to the
    // place in the painting where the film begins, level all the way, neither sinking to the floor nor looking up; the
    // painting simply comes nearer until the camera is inside it. (The lens, set a little low while the hall is at
    // rest, so that the painting hangs above the middle of the screen, comes to the middle as it goes.)
    const far = dist / nearer / (1 + 0.0085 * dove * dove);                                 // from the camera to the wall (the last touch brings the painting to the very size it has under the film: measured)
    const aimX = ap.l + (DIVE.focus[0] + (0.5 - DIVE.focus[0]) / DIVE.by) * ap.w, aimY = ap.b + (DIVE.focus[1] + (0.5 - DIVE.focus[1]) / DIVE.by - 0.0006) * ap.h;   // where on the wall the line ends: the middle of what the film's first frame shows
    const farEnd = view.fill / 1.003 / (1 + LENS) / DIVE.by / 1.0085;                       // …and how far from the wall
    const gone = clamp((F - far) / (F - farEnd));                                           // share of the line behind the camera
    cx = lerp(ap.cx, aimX, gone) + ox; cy = aimY * gone + oy; cz = -F + far;
    pv = lerp(view.v0, view.H / 2, smooth(gone));
    camera.rotation.set(0, 0, 0);
  } else {
    // …and it flies: straight down the hall, low over the floor at first, then up over the rope and in. From below it
    // looks up at the painting, and levels as it climbs. (The way out, and the way in where movement is reduced.)
    const line = ap.cy - (view.v0 - vT) * dist / Fv;   // the old line: a steady climb from eye level to the middle of the canvas
    const drop = hall3d && !reducedMotion ? flightDrop(e, line) : 0;
    cx = ap.cx - (uT - view.u0) * dist / Fv + ox;
    cy = line + oy + drop;
    cz = -(F - dist);
    camera.rotation.set(-FLIGHT.tilt * Math.atan(drop / dist), 0, 0);
  }
  project(cx, cy, cz, view.u0 + KEEP * ox * Fv / dist, pv - KEEP * oy * Fv / dist, Fv);
  plateMaterial.uniforms.uCam.value.set(cx, cy, cz); hazeMaterial.uniforms.uCam.value.set(cx, cy, cz);

  // The picture is a window: what it shows stands still, a fixed way behind the wall, and is just large enough
  // to fill the opening when the camera reaches the frame. From across the hall the frame hides its edges; as
  // the camera comes up, the frame opens around it and more of it comes into view, as through a real window.
  const full = (view.fill + WINDOW_DEPTH) / view.fill * 1.003;
  let slide = 0;
  if (inFilm && view.H > view.W && FOCUS[g.id]) {
    const keys = FOCUS[g.id];
    let focus = keys[keys.length - 1][1];
    if (p <= keys[0][0]) focus = keys[0][1];
    else for (let i = 1; i < keys.length; i++) if (p < keys[i][0]) { focus = lerp(keys[i - 1][1], keys[i][1], sstep(keys[i - 1][0], keys[i][0], p)); break; }
    const spare = Math.max(0, (ap.w * full - view.W * (dist + WINDOW_DEPTH) / Fv) / 2);   // how much of the film is out of view on each side
    slide = clamp((0.5 - focus) * ap.w * full, -spare, spare);
  }
  const pu = pictureMaterial.uniforms;
  if (hung) {
    // On the wall, the size of the opening, and all of it shown, always: the painting is fixed in its frame. Neither
    // the camera's flight nor the pointer moves it behind the frame.
    picture.position.set(ap.cx, ap.cy, -F - 6);
    picture.scale.set(ap.w * 1.004, ap.h * 1.004, 1);
    pu.uCrop.value = 1; pu.uShift.value.set(0, 0);
  } else {
    picture.position.set(ap.cx + (ap.cx - (cx - ox)) * WINDOW_DEPTH / dist + slide, ap.cy + (ap.cy - (cy - oy)) * WINDOW_DEPTH / dist, -F - WINDOW_DEPTH);
    picture.scale.set(ap.w * full, ap.h * full, 1);
    pu.uCrop.value = 1; pu.uShift.value.set(0, 0);
  }
  pu.uPaint.value = paint;
  if (film) {
    p = clamp(p, 0, film.count - 1.001);
    const i = Math.floor(p);
    const dir = t >= lastT ? 1 : -1;
    const pace = film === lastFilm ? Math.abs(p - lastP) : 0;   // film frames per drawn frame
    lastFilm = film; lastP = p;
    film.want(i, dir, pace > 1.5 ? Math.min(4, Math.round(pace)) : 1);
    // at speed no in-between frames: one picture per drawn frame, whichever is ready and nearest behind
    // The frame for this moment; while it is not ready yet, the nearest one already passed, or simply the one on
    // screen. Never one from further on: when the right frame arrived the film would step back (seen as a jerk in the
    // film's first frames, where the scroll is often still fast).
    const exact = film.get(i);
    let A = exact || film.behind(i, dir);
    if (!A && onFilm && heldOf === film) A = pu.tA.value;
    if (!A) A = film.nearest(i, dir);
    const B = exact && pace <= 0.75 ? film.get(i + 1) || A : A;
    if (A) {
      pu.tA.value = A; pu.tB.value = B; pu.uMix.value = B === A ? 0 : p - i; pu.uTexel.value.set(1 / A.image.width, 1 / A.image.height); onFilm = true; heldOf = film;
      if (rect) rect = filmInPainting((A.userData.frame ?? i) + pu.uMix.value);   // …and it is laid on the painting where that frame belongs, not where the wanted one would
    }
    // No frame of this film is ready yet (a chapter reached in one jump): the frame that was on screen stays until
    // one is. The painting is never put there instead: it would flash.
    pu.uLive.value = A || onFilm ? live : 0;
    pu.uReg.value = reg; pu.uRegS.value = regSet.s; pu.uRegT.value.set(regSet.tx, regSet.ty);
  } else {
    pu.uLive.value = 0; onFilm = false;
  }
  pu.uInto.value = into; pu.uDevelop.value = develop; pu.uFilmZoom.value = filmZoom;
  if (rect) pu.uRect.value.set(rect[0], rect[1], rect[2], rect[3]); else pu.uRect.value.set(0, 0, 0, 0);
  lastT = t;
  Sound.update(t);

  for (const m of fogs) { m.uniforms.uTime.value = elapsed; m.uniforms.uAmount.value = fog; }
  fogWindow.material.uniforms.uAmount.value = fog * (1 - 0.6 * live);
  fogNow = fog;
  dustMaterial.uniforms.uTime.value = elapsed; dustMaterial.uniforms.uAmount.value = dustAmount;
  // the dust is streaked by how far the camera moved since the frame before, as if the shutter stayed open 1/28 s
  if (!seenValid || jumped) { seen.multiplyMatrices(camera.projectionMatrix, shift.makeTranslation(-cx, -cy, -cz)); seenValid = true; }
  dustMaterial.uniforms.uPrev.value.copy(seen); dustMaterial.uniforms.uShutter.value = clamp((1 / 28) / Math.max(dt, 0.004), 0.5, 4);
  hazeMaterial.uniforms.uTime.value = elapsed; hazeMaterial.uniforms.uAmount.value = hazeAmount;
  hazeMaterial.uniforms.uTint.value.setRGB(lerp(0.62, 1.0, restore), lerp(0.66, 0.86, restore), lerp(0.7, 0.66, restore));
  plateMaterial.uniforms.uGlow.value = glow; plateMaterial.uniforms.uRestore.value = restore;
  if (hall3d) hall3d.setState(glow, restore);
  fx = 1 - sstep(0.62, 0.96, e);
  // The rush through the frame: it gathers over the last stretch of the flight, is at its height on the frame itself and
  // dies away over the film's first frames (and the same, turned round, on the way out). It is there only while the
  // camera is really moving: stop the scroll and it settles.
  let close = 0;
  if (g.id === 'in') close = sstep(DIVE.from - 0.05, 0.99, u);   // the painting is seen whole and sharp as the frame is reached; the streaks gather as the dive sets off
  else if (g.id === 'out') close = sstep(0.6, 0.99, e);
  else if (g.id === 'ch1') close = 1 - sstep(0, 30, p - FILM_AT_PORTAL);
  else if (g.id === 'ch3') close = sstep(CH3_EXIT - 18, CH3_EXIT, p);
  const moving = hold ? 1 : jumped ? 0 : clamp(Math.abs(t - before) / Math.max(dt, 0.004) / 0.45);   // the timeline's seconds per second: from under half the natural pace it is all there
  const rushGoal = hall3d && !reducedMotion ? close * moving : 0;
  rush = hold ? rushGoal : rush + (rushGoal - rush) * (1 - Math.exp(-dt * 8));
  if (rush < 0.001) rush = 0;
  // Falling into the painting, as the lens shows it (the growing itself is the picture's own: `into`, above). It is
  // placed on the timeline, not on the clock, so it can be scrolled through, held and run backwards.
  //   the paint starts to move as the dive begins, most at its deepest, and settles as the film comes up;
  //   a light swells out of the painting at the deepest point, where the film begins to show, and fades as it clears.
  dive.zoom = 1; dive.through = 0; dive.warp = 0; dive.veil = 0;
  if (hall3d && !reducedMotion && !plainHall && (g.id === 'in' || g.id === 'ch1')) {
    const since = g.id === 'ch1' ? p - FILM_AT_PORTAL : 0;
    dive.warp = 0;   // the paint does not move: the painting stays as sharp as it is until the film has taken its place   // lightly: the film has to be seen to lie exactly over the painting
    dive.veil = 0.14 * (g.id === 'in' ? sstep(0.4, 1, dove) : 1 - sstep(0, 24, since));   // a breath of light, no more
  }
  dive.on = (dive.zoom > 1.0005 && dive.through < 0.999) || dive.warp > 0.001 || dive.veil > 0.001;
  lipMaterial.uniforms.uGlow.value = live * 0.6 * restore;
  for (const part of hallParts) part.visible = !inFilm;
  fogWall.visible = fogFloor.visible = fogWindow.visible = !inFilm && fog > 0.001;
  if (hall3d && !plainHall) fogFloor.visible = false;   // in the real hall the fog on the floor is a volume (the lens, above), not a sheet

  // Interface
  if (current !== lastUI) { updateUI(current); lastUI = current; }
  // Over the painting in the hall the cursor is the museum's notice. Where the canvas is on screen right now:
  const sx = view.u0 + KEEP * ox * Fv / dist, sy = view.v0 - KEEP * oy * Fv / dist, k3 = Fv / dist;
  const overPainting = entered && pointer.seen && !pointer.onUI && overlay.hidden && TOUCH_RANGES.some((r) => inRange(current, r))
    && pointer.px > sx + (ap.l - cx) * k3 && pointer.px < sx + (ap.r - cx) * k3 && pointer.py > sy - (ap.t - cy) * k3 && pointer.py < sy - (ap.b - cy) * k3;
  if (overPainting !== cursor.classList.contains('is-touch')) cursor.classList.toggle('is-touch', overPainting);
  if (finePointer && !reducedMotion) for (const [layer, ax, ay] of domLayers) layer.style.translate = `${(pointer.sx * ax).toFixed(2)}px ${(pointer.sy * ay).toFixed(2)}px`;

  return inFilm;
}

let warmed = 0, drawn = 0, mirrorDue = true;
let plainHall = false;   // the lens gave a wrong picture on this GPU (see looksRight): the hall is drawn straight to the screen
const mirrorHide = [haze, dust, fogWall];
function drawHall() {   // the hall: its mirror in the floor first (not on every frame), then the picture through the lens
  const q = QUALITY[level];
  if (q.mirror > 0 && (mirrorDue || hold || drawn % q.every === 0)) { hall3d.reflect(renderer, scene, camera, mirrorHide); mirrorDue = false; }
  if (plainHall) { renderer.setRenderTarget(null); renderer.render(scene, camera); } else post.render(fx, elapsed);
  drawn++;
}

/* Behind the preloader the machine is timed: the hall is drawn a few times and a point of the last frame read back, which
   waits until the GPU has really finished them all. If a frame takes longer than there is time for, the level goes down
   and it is timed again; so the level is settled before Enter, and nobody watches it being found. */
const tune = { done: fixedLevel || !hall3d, settle: 2, checked: !hall3d, ms: 0 };
const onePoint = new Uint8Array(4);
function calibrate() {
  if (tune.settle > 0) { drawHall(); tune.settle--; return; }   // after a change of size: the buffers are made and filled first
  const gl = renderer.getContext(), from = performance.now(), N = 6, last = QUALITY.length - 1;
  for (let i = 0; i < N; i++) drawHall();
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, onePoint);   // six frames one after another, as the running site sends them, then wait for the last
  tune.ms = (performance.now() - from) / N;
  if (tune.ms > FRAME_MS && level < last) {
    level = tune.ms > FRAME_MS * 6 ? last : Math.min(last, level + (tune.ms > FRAME_MS * 2.2 ? 2 : 1));   // far too slow: do not try every step in between
    resize(); tune.settle = 2; return;
  }
  tune.done = true;
}
/* …and the lens is checked once against the hall drawn plainly, straight to the screen: fifteen places of the picture
   are compared. A GPU on which the lens goes wrong (a buffer it cannot draw into, a number it cannot work out) shows
   black where the plain drawing shows the hall; then the plain drawing is what is shown. */
function looksRight() {
  const gl = renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, cell = new Uint8Array(64);
  const look = () => {
    const out = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
      gl.readPixels(Math.floor(W * (i + 0.5) / 5) - 2, Math.floor(H * (j + 0.5) / 3) - 2, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, cell);
      let sum = 0; for (let k = 0; k < 64; k += 4) sum += cell[k] + cell[k + 1] + cell[k + 2];
      out.push(sum / 48);
    }
    return out;
  };
  renderer.setRenderTarget(null); renderer.render(scene, camera); const direct = look();
  mirrorDue = true; drawHall(); const through = look();
  let lit = 0, lost = 0;
  for (let i = 0; i < 15; i++) if (direct[i] > 14) { lit++; if (through[i] < direct[i] * 0.12) lost++; }
  return lit < 3 || lost < 3;
}
/* While the site runs: if the hall starts to miss frames (a busy machine, a laptop that has warmed up), the level
   goes down one step. A frame counts as missed when it took clearly longer than the screen's own pace, which is
   measured while nothing is drawn (behind the preloader); a browser that is holding everything to 30 a second to
   save power is not "slow". */
const pace = { rest: [], limit: 25, n: 0, slow: 0, skip: 30 };
const OPEN_MS = 1900, OPEN_AFTER = 260;   // the opening: how long it takes, and how long after Enter it starts (the button has gone by then)
let opening = 0;

function frame(now) {
  const took = now - lastTime;
  // (The real hall.) Behind the preloader nothing is seen: once the hall has been drawn twice (every shader built,
  // every picture sent to the GPU) it is timed and checked, and then rests until Enter; the loading is not slowed by it.
  if (hall3d && !entered && !hold && warmed >= 2) {
    lastTime = now;
    if (!tune.done) calibrate();
    else if (!tune.checked) { tune.checked = true; if (!looksRight()) { plainHall = true; console.warn('The Course of Empire: the lens is off on this GPU, the hall is drawn plainly.'); } dirty = true; }
    else if (took > 2 && took < 60) {
      pace.rest.push(took); if (pace.rest.length > 40) pace.rest.shift();
      if (pace.rest.length >= 10) pace.limit = Math.max(25, 1.6 * [...pace.rest].sort((a, b) => a - b)[pace.rest.length >> 1]);
    }
    return;
  }
  let dt = Math.min(0.1, took / 1000 || 0);
  lastTime = now; elapsed += dt;
  if (hold) { dt = hold.dt; elapsed = hold.time; }
  stepGlide(performance.now());
  const still = update(dt);
  if (opening) {   // Enter was pressed: the dark is eaten away (1.9 s, eased in and out)
    const a = clamp((performance.now() - opening) / OPEN_MS);
    opened = a < 0.5 ? 2 * a * a : 1 - Math.pow(-2 * a + 2, 2) / 2;
    if (a >= 1) { opening = 0; opened = 1; }
  }
  if (hall3d && !still && !hold && entered && !fixedLevel && !document.hidden && took < 250) {   // (a frame a quarter of a second late is a tab held back by the browser, not a slow drawing)
    if (pace.skip > 0) pace.skip--; else { pace.n++; if (took > pace.limit) pace.slow++; }
    if (pace.n >= 90) {
      if (pace.slow > 30 && level < QUALITY.length - 1) { level++; resize(); pace.skip = 30; }
      pace.n = pace.slow = 0;
    }
  }
  // In the hall something always moves (fog, dust). Inside the film the picture only changes with the scroll.
  if (!still || dirty || current !== lastDrawn || rush > 0 || dive.on) {   // (the mist and the moving paint go on moving while the scroll stands)
    if (hall3d && !still) drawHall();
    else if (hall3d && (rush > 0 || dive.on) && !plainHall) post.film(elapsed);
    else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
    dirty = false; lastDrawn = current; warmed++;
    seen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  }
}

/* A phone may take the GPU away from a page left in the background. When it is given back, three.js sends everything
   again by itself; what was worked out once on the GPU (the hall's surroundings, its shadows, its mirror) is done again here. */
canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
canvas.addEventListener('webglcontextrestored', () => {
  if (hall3d && sizedFor) { hall3d.renew(renderer, scene); update(0); }
  mirrorDue = true; dirty = true;
});

/* ---------- Sound: three looped beds, cross-faded along the timeline ---------- */
const at = moment;   // a moment: `sec` seconds into a part
const SOUND_MASTER = 0.7;
const SOUND_TRACKS = [
  { src: 'assets/audio/night.m4a', points: [[0, 0.6], [at('in', 2), 0.6], [at('in', 5.2), 0], [at('ch3', 3), 0], [at('ch3', 6.5), 1], [at('return', 1.5), 1], [T_TOTAL, 0.6]] },
  { src: 'assets/audio/noon.m4a', points: [[at('in', 2), 0], [at('in', 5.2), 1], [at('ch1', 9.5), 1], [at('ch1', 12.4), 0]] },
  { src: 'assets/audio/storm.m4a', points: [[at('ch1', 10.5), 0], [at('ch2', 0.3), 1], [at('ch2', 8.6), 1], [at('ch2', 10.1), 0.06], [at('ch3', 2.5), 0]] },
];
const Sound = (() => {
  let on = true, ctx = null, master = null;
  const tracks = SOUND_TRACKS.map((t) => ({ ...t, gain: null }));
  const buttons = [...document.querySelectorAll('[data-sound-toggle]')];
  const show = () => buttons.forEach((b) => { b.setAttribute('aria-pressed', String(on)); b.querySelector('[data-sound-label]').textContent = `Sound [${on ? 'on' : 'off'}]`; });
  buttons.forEach((b) => b.addEventListener('click', () => { on = !on; show(); if (master) master.gain.setTargetAtTime(on ? SOUND_MASTER : 0, ctx.currentTime, 0.25); }));
  show();
  function level(points, t) {
    if (t <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i];
      if (t <= x1) { const [x0, y0] = points[i - 1]; return y0 + (y1 - y0) * ((t - x0) / (x1 - x0 || 1)); }
    }
    return points[points.length - 1][1];
  }
  async function load(track) {
    try {
      const res = await fetch(track.src);
      if (!res.ok) return;
      const source = ctx.createBufferSource();
      source.buffer = await ctx.decodeAudioData(await res.arrayBuffer());
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(master);
      source.start();
      track.gain = gain;
    } catch (e) { /* a missing or undecodable track is simply silent */ }
  }
  return {
    start() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (ctx || !AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = on ? SOUND_MASTER : 0;
      master.connect(ctx.destination);
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});   // Safari may hand over a context that is not running yet
      tracks.forEach(load);
    },
    update(t) { if (ctx) for (const tr of tracks) if (tr.gain) tr.gain.gain.setTargetAtTime(clamp(level(tr.points, t)), ctx.currentTime, 0.2); },
  };
})();

/* ---------- Start: load everything behind the preloader, then Enter ---------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const pre = el('preloader'), preCount = el('preCount'), preStatus = el('preStatus');
const arrived = [];     // share of each file downloaded, 0…1
function track(promise) { const k = arrived.push(0) - 1; return promise.then((v) => { arrived[k] = 1; return v; }); }
function bin(src) {     // a film, reporting how much of it has arrived
  const k = arrived.push(0) - 1;
  return fetch(src, { cache: 'no-cache' }).then(async (res) => {
    const size = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !size) { const b = await res.arrayBuffer(); arrived[k] = 1; return b; }
    const reader = res.body.getReader(), chunks = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; arrived[k] = Math.min(0.99, got / size); }
    const data = new Uint8Array(got); let o = 0;
    for (const c of chunks) { data.set(c, o); o += c.length; }
    arrived[k] = 1;
    return data.buffer;
  });
}
let sceneReady = false, shown = 0;
const PRELOAD_MIN_MS = 4200, preStart = performance.now();
function tickPreloader(now) {
  const actual = arrived.reduce((a, b) => a + b, 0) / arrived.length * 100;
  const u = clamp((now - preStart) / PRELOAD_MIN_MS);
  const goal = Math.min(actual, (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) * 100);
  shown += (goal - shown) * 0.07;
  if (goal >= 100 && shown > 99.6) shown = 100;
  const n = Math.floor(shown);
  preCount.textContent = String(n).padStart(3, '0');
  preStatus.textContent = n < 34 ? 'Rising' : n < 90 ? 'Reigning' : 'Falling';
  pre.style.setProperty('--load', shown.toFixed(2));
  if (shown >= 100 && sceneReady) return preloaderReady();
  requestAnimationFrame(tickPreloader);
}
function preloaderReady() {
  pre.classList.add('is-full');
  setTimeout(() => {   // the frame draws in to become the Enter button
    el('preEnter').hidden = false; el('preHint').hidden = false;
    const frame = el('preFrame'), r = el('enterBtn').getBoundingClientRect();
    frame.style.left = `${r.left + r.width / 2}px`; frame.style.top = `${r.top + r.height / 2}px`;
    frame.style.width = `${r.width}px`; frame.style.height = `${r.height}px`;
    pre.classList.add('is-morph');
    setTimeout(() => pre.classList.add('is-ready'), reducedMotion ? 0 : 1300);
  }, 1700);
}
el('enterBtn').addEventListener('click', () => {
  window.scrollTo(0, 0);
  if (hall3d && !plainHall && !reducedMotion) {
    // The canvas takes the dark over from the preloader (the same colour, drawn before the preloader lets go of its
    // own), and then opens it from the middle.
    opened = 0; opening = performance.now() + OPEN_AFTER;
    update(0); drawHall();
    pre.classList.add('is-dissolve');
  }
  pre.classList.add('is-done');
  document.body.classList.remove('is-loading');
  entered = true;
  Sound.start();
});
requestAnimationFrame(tickPreloader);

Promise.all([
  REAL_HALL ? null : track(loadTexture('assets/hall/plate.webp', true)),          // the photograph of the hall: only for ?hall=photo
  REAL_HALL ? null : track(loadTexture('assets/hall/plate-ruin.webp', true)),
  REAL_HALL ? null : track(loadTexture('assets/hall/plate-floor-base.webp', false)),
  track(loadTexture('assets/hall/painting.webp', false)),
  track(loadTexture('assets/hall/painting-desolation.webp', false)),
  ...['ch1', 'ch2', 'ch3'].map((name) => bin(`assets/film/${name}-3d-${smallScreen ? '720' : 'hd'}.bin`)),
  probeBitmaps(),
  // the real hall: the pictures for its materials and the bust for its niches
  ...(REAL_HALL ? [...['floor', 'marble', 'plaster', 'bust', 'bust-normal', 'frame', 'frame-normal', 'frame-arm'].map((name) => track(loadTexture(`assets/hall/${name}.webp`, false))), track(fetch('assets/hall/bust.bin').then((r) => r.arrayBuffer()))] : []),
]).then(async ([plate, ruin, floorBase, painting, painting2, ch1, ch2, ch3, , floor, marble, plaster, bustMap, bustNormal, frameMap, frameNormal, frameArm, bust]) => {
  const buffers = [ch1, ch2, ch3];
  plateMaterial.uniforms.tPlate.value = plate; plateMaterial.uniforms.tRuin.value = ruin; plateMaterial.uniforms.tBase.value = floorBase;
  const pu = pictureMaterial.uniforms;
  pu.tPainting.value = painting; pu.tPainting2.value = painting2; pu.tA.value = painting; pu.tB.value = painting;
  for (const buffer of buffers) films.push(new Film(buffer));
  films[0].want(0, 1);
  resize();
  window.addEventListener('resize', resize);
  if (hall3d) hall3d.setAssets({ floor, marble, plaster, bustMap, bustNormal, frame: frameMap, frameNormal, frameArm, bust });
  update(0);
  if (hall3d) hall3d.bakeEnv(renderer, scene);
  await renderer.compileAsync(scene, camera);   // build every shader before the first frame, so nothing stalls later
  renderer.setAnimationLoop(frame);
  sceneReady = true;
  window.__hero3d = { renderer, scene, camera, post, view, T_TOTAL, SEGS, pose(t, time, dt = 1 / 30) { hold = t == null ? null : { t, time, dt }; dirty = true; },
    // for looking into how it runs: the level in use, how long the hall took to draw when it was timed, the sizes of the screen and of the hall's own picture
    get quality() { return { level, fixed: fixedLevel, timed: +tune.ms.toFixed(2), settled: tune.done, plain: plainHall, missedAbove: +pace.limit.toFixed(1), screen: [renderer.domElement.width, renderer.domElement.height], hall: post ? [post.width, post.height] : null }; },
    setLevel(n) { level = Math.max(0, Math.min(QUALITY.length - 1, n)); resize(); }, drawHall,
    open(v) { opening = 0; opened = v; } };   // the opening after Enter, held at a given point (0 dark … 1 open)
}).catch((err) => {
  console.error(err);
  preStatus.textContent = 'Could not load';
});
