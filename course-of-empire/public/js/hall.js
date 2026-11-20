/* The Course of Empire — the museum hall as a real 3D scene.

   Everything here is geometry: the floor, the wall the painting hangs on, its frame, two rows of giant columns the
   camera flies between, the arcades behind them with their niches, the ceiling. Nothing is painted on a flat plane,
   so when the camera moves, things pass it, hide one another and catch the light as they would in a room.

   Materials: cream marble for the stonework, dark plaster for the walls, gilding for the frame and the capitals,
   and a floor of polished black marble that mirrors the hall (it is drawn a second time from under the floor,
   see reflect()). The pictures for them are made by tools/hall_textures.py; the busts in the niches are
   "Marble Bust 01" from Poly Haven (CC0), packed by tools/pack_model.py.

   Units and axes are those of js/hero3d.js: the camera of the first frame stands at the origin and looks down -z;
   the wall is at z = -F; one unit is one pixel of the old photograph at the depth of the wall (about 8 mm). */
export function buildHall(THREE, m) {
  const { F, FLOOR_Y, ap, fr } = m;   // m.floatType: the kind of picture the GPU can draw into with more range than a screen has
  const zW = -F;                     // the wall the painting hangs on
  const HALF = 1070;                 // the hall is this wide on each side of its axis
  const CEIL = 1500;                 // the ceiling
  const NEAR = 700;                  // the hall goes on this far behind the camera
  const COL_X = 900;                 // the rows of columns stand this far from the axis…
  const COL_Z = [-2030, -1650, -1270, -890, -510, -130, 250];   // …at these depths: the camera passes one pair after another
  const BAY = 380;                   // from one column to the next
  const ENT = { y0: 880 };            // the underside of the beam the columns carry
  const group = new THREE.Group();

  /* ---- Materials ---- */
  /* Stone has no unwrapped surface to paint on: its picture is laid on from three sides, by where each point is in the room. */
  const painted = [];   // [material, which picture]
  /* o.gain, o.tint: how the picture colours the surface (gain brings its average to 1; tint 1 = fully, less = a wash).
     o.mid, o.rough: its lighter and darker places are a little smoother and rougher (mid: its average).
     o.bump: the same picture read as relief, this many units from its darkest to its lightest: the grain of plaster, the veins of stone. o.extra: more shader. */
  const triplanar = (mat, picture, size, o = {}) => {
    const u = mat.userData.u = { tTri: { value: null }, uTri: { value: 1 / size }, uUp: { value: 0 } };
    const f = (x) => Number(x).toFixed(3);
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTriP; varying vec3 vTriN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriP = (modelMatrix * vec4(transformed, 1.0)).xyz; vTriN = mat3(modelMatrix) * objectNormal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tTri; uniform float uTri, uUp; varying vec3 vTriP; varying vec3 vTriN;')
        .replace('#include <map_fragment>', `
          vec3 triN = normalize(vTriN + vec3(0.0, 1e-6, 0.0)); vec3 tw = pow(abs(triN), vec3(4.0)); tw /= max(tw.x + tw.y + tw.z, 1e-5);
          vec3 tp = vTriP * uTri;
          vec3 triC = (texture2D(tTri, tp.zy) * tw.x + texture2D(tTri, tp.xz) * tw.y + texture2D(tTri, tp.xy) * tw.z).rgb;
          float triV = dot(triC, vec3(0.3333));
          diffuseColor.rgb *= mix(vec3(1.0), triC * ${f(o.gain ?? 1)}, ${f(o.tint ?? 1)});`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = clamp(roughnessFactor + (${f(o.mid ?? 0.5)} - triV) * ${f(o.rough ?? 0)}, 0.08, 1.0);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          ${o.bump ? `{
            vec2 dH = vec2(dFdx(triV), dFdy(triV)) * ${f(o.bump)};
            vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);   // in the hall's own units, so the relief is the same at any size of screen
            vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
            float det = dot(sx, r1) * faceDirection;
            if (abs(det) > 1e-12) normal = normalize(abs(det) * normal - sign(det) * (dH.x * r1 + dH.y * r2));
          }` : ''}`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (o.extra || ''));
    };
    mat.customProgramCacheKey = () => 'tri' + JSON.stringify(o).length + JSON.stringify(o);
    painted.push([mat, picture]);
    return mat;
  };
  /* The columns are lit from their pedestals: a warm light that climbs the shaft and dies away, deeper in the flutes. */
  const UPLIGHT = `{
    float h = vTriP.y - ${(FLOOR_Y + 222).toFixed(1)};
    vec2 axis = vec2(sign(vTriP.x) * ${COL_X.toFixed(1)}, floor((vTriP.z - ${COL_Z[0].toFixed(1)}) / ${BAY.toFixed(1)} + 0.5) * ${BAY.toFixed(1)} + ${COL_Z[0].toFixed(1)});
    float face = dot(normalize(triN.xz + 1e-5), normalize(vTriP.xz - axis + 1e-4));
    totalEmissiveRadiance += vec3(1.0, 0.72, 0.46) * uUp * (0.75 * exp(-max(h, 0.0) / 190.0) + 0.25 * exp(-max(h, 0.0) / 520.0)) * (0.35 + 0.65 * smoothstep(0.45, 1.0, face)) * diffuseColor.rgb;
  }`;
  const stone = (side, extra) => triplanar(new THREE.MeshStandardMaterial({ color: 0xece4d6, roughness: 0.44, metalness: 0, side, envMapIntensity: 0.55 }), 'marble', 640, { extra, gain: 1.12, mid: 0.72, rough: 0.9, bump: 0.3 });
  const clay = stone(THREE.FrontSide), sheet = stone(THREE.DoubleSide), shaftMat = stone(THREE.FrontSide, UPLIGHT);
  const wallMat = triplanar(new THREE.MeshStandardMaterial({ color: 0x7c6b5e, roughness: 0.9, metalness: 0, envMapIntensity: 0.4 }), 'plaster', 1500, { gain: 2, mid: 0.5, rough: 0.3, bump: 1.5 });
  const darkMat = triplanar(new THREE.MeshStandardMaterial({ color: 0x57483d, roughness: 0.94, metalness: 0, envMapIntensity: 0.3 }), 'plaster', 1500, { gain: 2, mid: 0.5, rough: 0.2, bump: 1.2 });   // ceiling and the walls above the cornice
  /* Gilding, old and matt: the moulding of the frame is a strip cut from a real gilded frame (colour, relief, wear),
     run along each side; the capitals are the same gold, washed with the mottle of the plaster so it is not one flat yellow. */
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0.55, side: THREE.DoubleSide, envMapIntensity: 1 });
  const bronze = triplanar(new THREE.MeshStandardMaterial({ color: 0xb39562, roughness: 0.6, metalness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.75 }), 'plaster', 210, { gain: 2, tint: 0.55, mid: 0.5, rough: 0.5, bump: 0.5 });
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x1b1714, roughness: 0.3, metalness: 0, envMapIntensity: 0.5 });   // black stone at the foot of the wall
  const brass = new THREE.MeshStandardMaterial({ color: 0xc2a468, roughness: 0.4, metalness: 0.85, envMapIntensity: 0.85 });
  const velvet = new THREE.MeshStandardMaterial({ color: 0x5a1016, roughness: 0.97, metalness: 0, envMapIntensity: 0.2 });
  const bustMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0, envMapIntensity: 0.5 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffdcb0, emissiveIntensity: 6 });
  /* The floor: polished black marble. What it mirrors is the hall drawn from under the floor (reflect(), below),
     found for each point of the floor and laid over the stone: faint looking straight down, strong at a glance. */
  const refl = { tRefl: { value: null }, uReflM: { value: new THREE.Matrix4() }, uReflK: { value: 1 } };
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0, envMapIntensity: 0 });
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, refl);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uReflM; varying vec4 vRefl;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRefl = uReflM * modelMatrix * vec4(transformed, 1.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRefl; uniform float uReflK; varying vec4 vRefl;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          vec2 ruv = vRefl.xy / vRefl.w;
          float cosT = clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0);
          float fres = 0.07 + 0.7 * pow(1.0 - cosT, 3.5);   // polished stone, not a looking-glass: even at a glance it keeps some of its own dark
          vec3 rc = texture2D(tRefl, ruv, 1.0).rgb * 0.3
            + (texture2D(tRefl, ruv + vec2(0.0, 0.005), 1.5).rgb + texture2D(tRefl, ruv - vec2(0.0, 0.005), 1.5).rgb) * 0.2
            + (texture2D(tRefl, ruv + vec2(0.0, 0.013), 2.5).rgb + texture2D(tRefl, ruv - vec2(0.0, 0.013), 2.5).rgb) * 0.15;   // smeared a little up and down, as a floor does
          totalEmissiveRadiance += max(rc, 0.0) * fres * uReflK * step(0.0, vRefl.w);
        }`);
  };

  const add = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  const box = (x0, x1, y0, y1, z0, z1, mat = clay, shadow = true) =>
    add(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, shadow);

  /* Many boxes as one mesh (mouldings, dentils): [x0, x1, y0, y1, z0, z1] each. */
  const boxes = (list, mat = clay) => {
    const pos = [];
    for (const [x0, x1, y0, y1, z0, z1] of list) {
      const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
      for (const [a, b, d, e] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]]) pos.push(...c[a], ...c[b], ...c[d], ...c[a], ...c[d], ...c[e]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    return add(g, mat === clay ? sheet : mat);
  };
  /* A modelled part put together from surfaces: grids of points (smooth across each grid) and ready geometries. */
  const builder = () => {
    const pos = [], idx = [];
    return {
      grid(nu, nv, f) {
        const o = pos.length / 3;
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = o + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      },
      lathe(pts, seg = 40) { this.grid(seg, pts.length - 1, (u, v) => { const [r, y] = pts[Math.round(v * (pts.length - 1))], th = u * Math.PI * 2; return [Math.cos(th) * r, y, Math.sin(th) * r]; }); },
      append(g, m) {
        if (m) g.applyMatrix4(m);
        const o = pos.length / 3, p = g.attributes.position;
        for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i), p.getZ(i));
        if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(o + g.index.getX(i)); else for (let i = 0; i < p.count; i++) idx.push(o + i);
      },
      geo(y = 0) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.translate(0, y, 0);
        return g;
      },
    };
  };

  /* ---- Floor and ceiling ---- */
  const SLABS = 1040;   // one picture of the floor is 2 x 2 slabs and covers this much
  const floor = (() => {
    const w = 2 * (HALF + 160), d = NEAR - zW;
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * w / SLABS, uv.getY(i) * d / SLABS);   // a seam runs down the middle of the hall
    const c = new THREE.PlaneGeometry(w, d); c.rotateX(Math.PI / 2);
    add(c, darkMat, 0, CEIL, (NEAR + zW) / 2, false);
    for (let z = zW + BAY; z < NEAR; z += BAY) box(-HALF, HALF, CEIL - 70, CEIL, z - 28, z + 28, darkMat, false);   // beams across the ceiling
    return add(g, floorMat, 0, FLOOR_Y, (NEAR + zW) / 2, false);
  })();

  /* ---- The wall with the painting: an opening for the picture, a skirting, the soffit with its four lamps ---- */
  {
    const s = new THREE.Shape();
    const W = HALF + 160;
    s.moveTo(-W, FLOOR_Y); s.lineTo(W, FLOOR_Y); s.lineTo(W, CEIL); s.lineTo(-W, CEIL); s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(ap.l, ap.b); hole.lineTo(ap.l, ap.t); hole.lineTo(ap.r, ap.t); hole.lineTo(ap.r, ap.b); hole.closePath();
    s.holes.push(hole);
    add(new THREE.ShapeGeometry(s), wallMat, 0, 0, zW, false);
    box(-HALF, HALF, FLOOR_Y, FLOOR_Y + 46, zW, zW + 14, skirtMat);   // dark, like the floor: a light one is mirrored in the floor as a bright band
    box(-HALF, HALF, FLOOR_Y + 46, FLOOR_Y + 58, zW, zW + 20, skirtMat);
    box(-840, 840, 1105, CEIL, zW, zW + 190, darkMat);              // the soffit above the painting
    box(-860, 860, 1090, 1105, zW, zW + 205);
    // the wall is dressed: a rail and plaster panels below the painting, a cornice under the soffit
    const rail = FLOOR_Y + 150;
    boxes([[-HALF, HALF, rail, rail + 6, zW, zW + 9], [-HALF, HALF, rail + 6, rail + 15, zW, zW + 14], [-HALF, HALF, rail + 15, rail + 19, zW, zW + 9]], wallMat);
    boxes([[-838, 838, 1036, 1052, zW, zW + 12], [-838, 838, 1052, 1070, zW, zW + 24], [-838, 838, 1070, 1090, zW, zW + 38]]);
    const panels = [];
    for (let i = -3; i < 3; i++) {
      const x0 = i * 330 + 22, x1 = x0 + 286, y0 = FLOOR_Y + 76, y1 = rail - 16, t = 7, d = zW + 6;
      panels.push([x0, x1, y0, y0 + t, zW, d], [x0, x1, y1 - t, y1, zW, d], [x0, x0 + t, y0, y1, zW, d], [x1 - t, x1, y0, y1, zW, d]);
    }
    boxes(panels, wallMat);
  }
  const SPOT_X = [-378, -148, 143, 370];
  for (const x of SPOT_X) add(new THREE.CylinderGeometry(20, 20, 6, 20), lampMat, x, 1088, zW + 100, false);

  /* ---- The frame: a moulding lofted round the canvas (how far out from the canvas edge, how far off the wall).
          The gilded strip runs along each side; across it, 0 is the edge at the canvas and 1 the edge at the wall. ---- */
  {
    const profile = [[0, 0], [0, 18], [0.07, 27], [0.3, 33], [0.34, 24], [0.6, 22], [0.66, 34], [0.8, 44], [0.93, 46], [1, 34], [1, 0]];
    const wide = ((fr.r - fr.l) - (ap.r - ap.l) + (fr.t - fr.b) - (ap.t - ap.b)) / 4;   // the moulding's width
    const across = [0];
    for (let i = 1; i < profile.length; i++) across.push(across[i - 1] + Math.hypot((profile[i][0] - profile[i - 1][0]) * wide, profile[i][1] - profile[i - 1][1]));
    const total = across[across.length - 1], tile = total * 1172 / 271;   // the strip is 1172 x 271: this long in the hall
    const ring = ([f, h]) => {
      const l = ap.l + (fr.l - ap.l) * f, r = ap.r + (fr.r - ap.r) * f, t = ap.t + (fr.t - ap.t) * f, b = ap.b + (fr.b - ap.b) * f, z = zW + h;
      return [[l, b, z], [r, b, z], [r, t, z], [l, t, z]];
    };
    const pos = [], uv = [];
    for (let i = 0; i < profile.length - 1; i++) {
      const a = ring(profile[i]), b = ring(profile[i + 1]), va = across[i] / total, vb = across[i + 1] / total;
      for (let k = 0; k < 4; k++) {
        const n = (k + 1) % 4, along = (p) => p[k % 2] / tile;   // bottom and top run along x, the sides along y
        pos.push(...a[k], ...a[n], ...b[n], ...a[k], ...b[n], ...b[k]);
        uv.push(along(a[k]), va, along(a[n]), va, along(b[n]), vb, along(a[k]), va, along(b[n]), vb, along(b[k]), vb);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    add(g, frameMat);
  }

  /* ---- A giant column on its pedestal: fluted shaft, moulded base, a Corinthian capital (a bell, two rows of
          leaves, scrolls under the corners of a slab with hollowed sides) ---- */
  const R = 48, SHAFT_Y0 = FLOOR_Y + 258, CAP_H = 108, ABACUS = 16, SHAFT_Y1 = ENT.y0 - CAP_H - ABACUS;
  const shaftGeo = (() => {
    const N = 120, FLUTES = 20, rows = 9, pos = [], idx = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, y = SHAFT_Y0 + (SHAFT_Y1 - SHAFT_Y0) * v;
      const taper = 1 - 0.15 * Math.pow(Math.max(0, v - 0.3) / 0.7, 1.6);   // straight for the first third, then drawing in
      for (let i = 0; i < N; i++) {
        const th = i / N * Math.PI * 2;
        const r = R * taper * (1 - 0.075 * Math.pow(0.5 - 0.5 * Math.cos(th * FLUTES), 0.7));
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < N; i++) {
      const a = j * N + i, b = j * N + (i + 1) % N, c = a + N, d = b + N;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  })();
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const baseGeo = (() => {   // the classical base: a square slab, a fat ring, a hollow, a thinner ring
    const b = builder();
    b.lathe([[0, 8], [61, 8], ...arc(61, 15, 7, -90, 90, 8), [58, 22], ...arc(60.5, 26.5, 5, 205, 90, 6).map(([r, y]) => [r - 4, y]), ...arc(54, 32, 3.6, -90, 90, 6), [49.5, 36], [0, 36]], 48);
    b.append(new THREE.BoxGeometry(142, 8, 142), new THREE.Matrix4().makeTranslation(0, 4, 0));
    return b.geo(FLOOR_Y + 222);
  })();
  const capGeo = (() => {
    const b = builder(), H = CAP_H, r0 = R * 0.85;
    const bell = (y) => r0 - 1 + 19 * Math.pow(Math.min(1, Math.max(0, y / H)), 3);
    b.lathe([[0, 0], [r0, 0], ...arc(r0, 4.5, 4.5, -90, 90, 6), [r0 - 1, 9], ...Array.from({ length: 12 }, (_, i) => [bell(9 + (H - 9) * i / 11), 9 + (H - 9) * i / 11]), [0, H]], 48);
    // a leaf: runs up the bell, peels away from it and droops at the tip; hollowed along the middle, scalloped at the edges
    const leaf = (th0, h, spread) => b.grid(10, 20, (u, v) => {
      const a = u * 2 - 1;
      const y = 8 + h * (v < 0.74 ? v / 0.74 : 1 - 0.3 * Math.pow((v - 0.74) / 0.26, 1.5));
      const out = v < 0.5 ? 1.5 + 4 * v : 3.5 + 0.46 * h * Math.pow((v - 0.5) / 0.5, 1.8);
      const width = Math.pow(Math.sin(Math.PI * Math.pow(0.05 + 0.95 * v, 0.8)), 0.55) * (1 + 0.06 * Math.cos(v * Math.PI * 5)) * (0.7 + 0.3 * (1 - v));
      const r = bell(y) + out + 4 * a * a * (1 - 0.4 * v) - 1.6 * Math.pow(1 - Math.abs(a), 3);
      const th = th0 + a * spread * width;
      return [Math.cos(th) * r, y, Math.sin(th) * r];
    });
    for (let k = 0; k < 8; k++) leaf(k * Math.PI / 4 + Math.PI / 8, 0.4 * H, 0.36);
    for (let k = 0; k < 8; k++) leaf(k * Math.PI / 4, 0.66 * H, 0.33);
    // the scrolls: a stalk rising from behind the leaves and curling under each corner of the slab
    for (let k = 0; k < 4; k++) {
      const th = k * Math.PI / 2 + Math.PI / 4, dx = Math.cos(th), dz = Math.sin(th), pts = [];
      for (let i = 0; i <= 8; i++) { const q = i / 8; pts.push(new THREE.Vector3(dx * (bell(H * (0.55 + 0.3 * q)) + 3 + 10 * q * q), H * (0.55 + 0.37 * q), dz * (bell(H * (0.55 + 0.3 * q)) + 3 + 10 * q * q))); }
      const c0 = pts[pts.length - 1], cr = c0.x * dx + c0.z * dz, cy = c0.y - 15;
      for (let i = 1; i <= 26; i++) { const q = i / 26, ang = Math.PI / 2 - q * Math.PI * 3.3, rad = 15 * (1 - 0.82 * q); pts.push(new THREE.Vector3(dx * (cr + 2 + Math.cos(ang) * rad), cy + Math.sin(ang) * rad, dz * (cr + 2 + Math.cos(ang) * rad))); }
      b.append(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, 3.6, 7));
      for (const s of [-1, 1]) {   // and the two smaller ones that meet in the middle of each face
        const tf = th + s * Math.PI / 4, fx = Math.cos(tf), fz = Math.sin(tf), tx = -s * Math.sin(tf) * -1, tz = s * Math.cos(tf) * -1, q2 = [];
        for (let i = 0; i <= 6; i++) { const q = i / 6; q2.push(new THREE.Vector3(dx * (bell(H * 0.6) + 2) * (1 - q) + (fx * (bell(H * 0.86) + 5) + tx * 13) * q, H * (0.58 + 0.26 * q), dz * (bell(H * 0.6) + 2) * (1 - q) + (fz * (bell(H * 0.86) + 5) + tz * 13) * q)); }
        const e0 = q2[q2.length - 1];
        for (let i = 1; i <= 16; i++) { const q = i / 16, ang = Math.PI / 2 - q * Math.PI * 2.6, rad = 7 * (1 - 0.8 * q); q2.push(new THREE.Vector3(e0.x - tx * (7 - Math.cos(ang) * rad) * 0 - tx * Math.cos(ang) * rad + tx * 0, e0.y - 7 + Math.sin(ang) * rad, e0.z - tz * Math.cos(ang) * rad)); }
        b.append(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q2), 44, 2.4, 6));
      }
      const rose = new THREE.SphereGeometry(8, 12, 8); rose.scale(1, 1, 0.55);   // a flower in the middle of each face of the slab
      b.append(rose, new THREE.Matrix4().makeRotationY(-(th + Math.PI / 4) + Math.PI / 2).setPosition(Math.cos(th + Math.PI / 4) * 59, H + 8, Math.sin(th + Math.PI / 4) * 59));
    }
    // the slab: a square with hollowed sides and cut corners, in two steps
    const slab = (half, mid, y0, y1) => {
      const s2 = new THREE.Shape(), c = 9;
      s2.moveTo(-half + c, -half);
      s2.quadraticCurveTo(0, -mid, half - c, -half); s2.lineTo(half, -half + c);
      s2.quadraticCurveTo(mid, 0, half, half - c); s2.lineTo(half - c, half);
      s2.quadraticCurveTo(0, mid, -half + c, half); s2.lineTo(-half, half - c);
      s2.quadraticCurveTo(-mid, 0, -half, -half + c); s2.closePath();
      const g = new THREE.ExtrudeGeometry(s2, { depth: y1 - y0, bevelEnabled: false, curveSegments: 10 });
      g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
      b.append(g);
    };
    slab(72, 56, H, H + 9); slab(77, 60, H + 9, H + ABACUS);
    return b.geo(SHAFT_Y1);
  })();
  function column(x, z) {
    const y = FLOOR_Y, sq = (h, y0, y1) => [x - h, x + h, y + y0, y + y1, z - h, z + h];
    boxes([sq(86, 0, 22), sq(81, 22, 30), sq(77, 30, 38), sq(73, 38, 190), sq(77, 190, 200), sq(82, 200, 212), sq(86, 212, 222)]);
    add(baseGeo, clay, x, 0, z); add(shaftGeo, shaftMat, x, 0, z); add(capGeo, bronze, x, 0, z);
  }

  /* ---- The two sides: columns, the beam they carry, and behind them a wall of arches with a figure in each ---- */
  const arcade = (() => {   // one bay of the side wall, seen from the hall: a slab with an arched opening
    const s = new THREE.Shape(), w = BAY / 2, y0 = FLOOR_Y, half = 112, spring = 330;
    s.moveTo(-w, y0); s.lineTo(w, y0); s.lineTo(w, CEIL); s.lineTo(-w, CEIL); s.closePath();
    const h = new THREE.Path();
    h.moveTo(-half, y0); h.lineTo(-half, spring); h.absarc(0, spring, half, Math.PI, 0, true); h.lineTo(half, y0); h.closePath();
    s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth: 150, bevelEnabled: false, curveSegments: 24 });
  })();
  const trim = (() => {   // what stands out of that slab into the hall: the band round the arch, the blocks it springs from, the keystone
    const s = new THREE.Shape(), in0 = 112, out0 = 136, spring = 330, y0 = FLOOR_Y;
    s.moveTo(-out0, y0); s.lineTo(-out0, spring); s.absarc(0, spring, out0, Math.PI, 0, true); s.lineTo(out0, y0);
    s.lineTo(in0, y0); s.lineTo(in0, spring); s.absarc(0, spring, in0, 0, Math.PI, false); s.lineTo(-in0, y0); s.closePath();
    const b = builder();
    const band = new THREE.ExtrudeGeometry(s, { depth: 9, bevelEnabled: false, curveSegments: 24 }); band.translate(0, 0, -9);
    b.append(band);
    for (const sx of [-1, 1]) b.append(new THREE.BoxGeometry(34, 16, 18), new THREE.Matrix4().makeTranslation(sx * (in0 + 12), spring - 8, -9));
    b.append(new THREE.BoxGeometry(30, 46, 20), new THREE.Matrix4().makeTranslation(0, spring + in0 + 14, -10));
    return b.geo();
  })();
  const plinth = (() => {   // what a bust stands on, in each niche
    const b = builder();
    b.append(new THREE.BoxGeometry(96, 118, 96), new THREE.Matrix4().makeTranslation(0, 59, 0));
    b.append(new THREE.BoxGeometry(108, 12, 108), new THREE.Matrix4().makeTranslation(0, 124, 0));
    b.append(new THREE.BoxGeometry(108, 10, 108), new THREE.Matrix4().makeTranslation(0, 5, 0));
    return b.geo();
  })();
  const niches = [];   // [x, z, which side]
  const sconces = [];
  for (const side of [-1, 1]) {
    for (const z of COL_Z) column(side * COL_X, z);
    // the beam on the columns, with its cornice, running the length of the hall
    const back = side * (HALF + 150), at = (inset) => side * (COL_X - inset), run = (inset, y0, y1) => [Math.min(at(inset), back), Math.max(at(inset), back), y0, y1, zW, NEAR];
    boxes([run(58, 880, 902), run(62, 902, 928), run(66, 928, 952), run(73, 952, 959),          // the beam: three bands, each standing a little further out, and a fillet
      run(60, 959, 1012),                                                                        // the plain course above it
      run(68, 1012, 1020), run(100, 1036, 1054), run(108, 1054, 1061), run(114, 1061, 1068)]);   // the cornice
    const teeth = [];
    for (let z = zW + 6; z < NEAR - 14; z += 23) teeth.push([Math.min(at(82), back), Math.max(at(82), back), 1020, 1036, z, z + 14]);
    boxes(teeth);
    box(side * (COL_X - 40), back, 1068, CEIL, zW, NEAR, darkMat);
    // the wall of arches: one bay between each pair of columns, and the back of its niche
    for (let z = zW + BAY / 2 - 10; z < NEAR; z += BAY) {
      const bay = add(arcade, clay, side * HALF, 0, z);
      bay.rotation.y = side * Math.PI / 2;   // the slab runs along the hall and is thick outwards
      const t = add(trim, sheet, side * HALF, 0, z); t.rotation.y = side * Math.PI / 2;
      add(plinth, sheet, side * (HALF + 80), FLOOR_Y, z); niches.push([side * (HALF + 80), z, side]);
      add(new THREE.SphereGeometry(11, 12, 8), lampMat, side * (HALF - 14), 250, z + BAY / 2, false);
      if (z < -1300) { const l = new THREE.PointLight(0xffc995, 1, 1100, 1.5); l.position.set(side * (HALF - 60), 255, z + BAY / 2); group.add(l); sconces.push(l); }
    }
    box(side * (HALF + 150), side * (HALF + 160), FLOOR_Y, CEIL, zW, NEAR, wallMat, false);   // behind the niches
  }

  /* ---- The rope in front of the painting: posts and a sagging cord. The camera flies over it. ---- */
  if (m.rope !== false) {
    const zR = zW + 900, top = FLOOR_Y + 118, xs = [-770, -462, -154, 154, 462, 770];
    for (const x of xs) {
      add(new THREE.CylinderGeometry(24, 27, 7, 32), brass, x, FLOOR_Y + 3.5, zR);
      add(new THREE.CylinderGeometry(5, 5, 112, 16), brass, x, FLOOR_Y + 60, zR);
      add(new THREE.SphereGeometry(9.5, 20, 14), brass, x, top, zR);
    }
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i] + 6, b = xs[i + 1] - 6, y = top - 10;
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(a, y, zR), new THREE.Vector3(a + (b - a) * 0.25, y - 22, zR), new THREE.Vector3((a + b) / 2, y - 30, zR), new THREE.Vector3(a + (b - a) * 0.75, y - 22, zR), new THREE.Vector3(b, y, zR)]);
      add(new THREE.TubeGeometry(curve, 32, 4.2, 10), velvet);
    }
  }

  /* ---- Light. The hall is dark and warm: four lamps wash the wall and the painting, the columns are lit from their
          pedestals, sconces glow in the arcades. One soft light from high behind the camera gives the stone its
          form and throws the shadows. ---- */
  const sky = new THREE.HemisphereLight(0xffe9cf, 0x2a2018, 1);
  group.add(sky);
  const spots = SPOT_X.map((x) => {
    const l = new THREE.SpotLight(0xffe2c0, 1, 0, 0.56, 1, 0);
    l.position.set(x, 1080, zW + 190); l.target.position.set(x * 1.18, 380, zW);
    group.add(l, l.target);
    return l;
  });
  const key = new THREE.DirectionalLight(0xffefdc, 1);
  key.position.set(-1500, 1900, 500); key.target.position.set(160, FLOOR_Y, -1500);   // from high on one side, not from behind the camera: a column has a lit side and a side in shade, and so a body
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -1500, right: 1500, top: 1900, bottom: -1900, near: 200, far: 5200 });
  key.shadow.bias = -0.002; key.shadow.normalBias = 12;   // generous: a shadow that starts a hand's breadth late is not seen, speckle on every wall is
  key.shadow.autoUpdate = false; key.shadow.needsUpdate = true;   // nothing in the hall moves: the shadows are worked out once
  group.add(key, key.target);
  const glowLight = new THREE.PointLight(0xffe2b0, 0, 2600, 1);    // the painting coming alive lights the hall in front of it
  glowLight.position.set(ap.cx, ap.cy, zW + 320);
  group.add(glowLight);
  /* The beams of the four lamps in the dusty air: a soft cone of light under each. */
  const beamMat = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 256;
    const x = c.getContext('2d'), img = x.createImageData(128, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 128; i++) {
      const v = j / 255, u = (i / 127 - 0.5) * 2, w = 0.16 + 0.62 * v;
      const a = Math.pow(1 - v, 1.9) * Math.exp(-Math.pow(u / w, 2) * 1.5) * Math.min(1, v * 9);
      img.data.set([255, 255, 255, 255 * a], (j * 128 + i) * 4);
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    return new THREE.MeshBasicMaterial({ map: t, color: 0xffdcb4, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });   // added to what is behind; the picture's mark in the alpha is left alone (see the lens in hero3d.js)
  })();
  for (const x of SPOT_X) { const b = add(new THREE.PlaneGeometry(560, 760), beamMat, x * 1.06, 1084 - 380, zW + 96, false); b.receiveShadow = false; b.renderOrder = 1; }

  /* ---- What arrives later: the pictures for the materials and the busts (called once they are loaded) ---- */
  function setAssets(a) {
    for (const t of [a.marble, a.plaster, a.floor]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; t.needsUpdate = true; }
    for (const [mat, picture] of painted) mat.userData.u.tTri.value = a[picture];
    floorMat.map = a.floor; floorMat.needsUpdate = true;
    for (const t of [a.frame, a.frameNormal, a.frameArm]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = 16; t.needsUpdate = true; }   // row 0 of the strip is the edge at the canvas
    a.frameNormal.colorSpace = a.frameArm.colorSpace = THREE.NoColorSpace;
    Object.assign(frameMat, { map: a.frame, normalMap: a.frameNormal, roughnessMap: a.frameArm, aoMap: a.frameArm });
    frameMat.normalScale.set(1.3, -1.3); frameMat.needsUpdate = true;
    a.bustNormal.colorSpace = THREE.NoColorSpace; a.bustMap.flipY = a.bustNormal.flipY = false;   // as glTF has them
    a.bustMap.needsUpdate = a.bustNormal.needsUpdate = true;
    bustMat.map = a.bustMap; bustMat.normalMap = a.bustNormal; bustMat.needsUpdate = true;
    const head = new Uint32Array(a.bust, 0, 2), nv = head[0], ni = head[1];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a.bust, 8, nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(a.bust, 8 + nv * 12, nv * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(a.bust, 8 + nv * 24, nv * 2), 2));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(a.bust, 8 + nv * 32, ni), 1));
    for (const [x, z, side] of niches) {
      if (z > -700) continue;   // the niches behind the camera's start are never seen
      const bust = add(g, bustMat, x, FLOOR_Y + 130, z);
      bust.scale.setScalar(205); bust.rotation.y = -side * 0.95;   // facing the hall, turned a little towards whoever comes in
    }
    consolidate();
    key.shadow.needsUpdate = true;
  }

  /* ---- Nothing in the hall moves, so everything made of one material is handed to the GPU as one mesh: some twenty
          draws for the whole hall instead of two hundred (and the hall is drawn twice a frame: once for the mirror).
          The floor stays on its own: it is hidden while its mirror is drawn. ---- */
  function consolidate() {
    const sets = new Map(), v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const mesh of group.children) {
      if (!mesh.isMesh || mesh === floor) continue;
      const k = `${mesh.material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}|${mesh.renderOrder}`;
      if (!sets.has(k)) sets.set(k, []);
      sets.get(k).push(mesh);
    }
    const used = new Set();
    for (const list of sets.values()) {
      if (list.length < 2) continue;
      let nv = 0, ni = 0;
      const withUv = list.every((o) => o.geometry.attributes.uv);
      for (const o of list) { const g = o.geometry; if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = withUv ? new Float32Array(nv * 2) : null, idx = new Uint32Array(ni);
      let vo = 0, io = 0;
      for (const o of list) {
        o.updateMatrix();
        const g = o.geometry, p = g.attributes.position, n = g.attributes.normal, t = g.attributes.uv, ix = g.index;
        const flip = o.matrix.determinant() < 0;   // a mirrored part: its faces would turn inside out
        nm.getNormalMatrix(o.matrix);
        for (let i = 0; i < p.count; i++) {
          const a = (vo + i) * 3;
          v.fromBufferAttribute(p, i).applyMatrix4(o.matrix); pos[a] = v.x; pos[a + 1] = v.y; pos[a + 2] = v.z;
          v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor[a] = v.x; nor[a + 1] = v.y; nor[a + 2] = v.z;
          if (uv) { uv[(vo + i) * 2] = t.getX(i); uv[(vo + i) * 2 + 1] = t.getY(i); }
        }
        const count = ix ? ix.count : p.count;
        for (let i = 0; i < count; i += 3) {
          const a = ix ? ix.getX(i) : i, b = ix ? ix.getX(i + 1) : i + 1, c = ix ? ix.getX(i + 2) : i + 2;
          idx[io++] = vo + a; idx[io++] = vo + (flip ? c : b); idx[io++] = vo + (flip ? b : c);
        }
        vo += p.count; used.add(g); group.remove(o);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      const one = new THREE.Mesh(g, list[0].material);
      one.castShadow = list[0].castShadow; one.receiveShadow = list[0].receiveShadow; one.renderOrder = list[0].renderOrder; one.frustumCulled = false;
      group.add(one);
    }
    for (const g of used) g.dispose();
  }

  /* ---- The hall as its own surroundings: what the gilding and the polished stone reflect. Taken once, from where
          the visitor stands. ---- */
  let envOf = null;
  function bakeEnv(renderer, scene) {
    const pm = new THREE.PMREMGenerator(renderer);
    const was = floor.visible; floor.visible = false;
    scene.environment = pm.fromScene(scene, 0.03, 10, 9000).texture;
    floor.visible = was; pm.dispose(); envOf = scene;
    setState(0, 1);
  }

  /* ---- The mirror in the floor: the hall seen from as far under the floor as the camera is above it ---- */
  const mirror = new THREE.PerspectiveCamera(64, 1.7, 8, 12000);
  const reflRT = new THREE.WebGLRenderTarget(960, 540, { samples: 4, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, type: m.floatType ?? THREE.HalfFloatType });   // fine and smoothed: a thin bright edge up on the wall must not shimmer in the floor
  refl.tRefl.value = reflRT.texture;
  /* The mirror is drawn smaller than the hall's own picture (share: how much smaller along each side): the floor shows
     it blurred, so it has to be fine enough that nothing in it shimmers and no finer. share 0 → no mirror: plain dark stone. */
  let share = 0.6, mirrorOn = 1, lastGlow = 0, lastRestore = 1;
  function setMirror(o) {
    share = o.share; mirrorOn = o.share > 0 ? 1 : 0;
    if (reflRT.samples !== o.samples) { reflRT.samples = o.samples; reflRT.dispose(); }
    setState(lastGlow, lastRestore);
  }
  function resize(w, h) { const k = share || 0.1; reflRT.setSize(Math.max(64, Math.round(w * k)), Math.max(36, Math.round(h * k))); }
  const toUv = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  function reflect(renderer, scene, camera, hide = []) {
    mirror.position.set(camera.position.x, 2 * FLOOR_Y - camera.position.y, camera.position.z);
    mirror.rotation.set(0.16, 0, 0);
    mirror.updateMatrixWorld();
    refl.uReflM.value.copy(toUv).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);
    const was = hide.map((o) => o.visible), target = renderer.getRenderTarget();
    for (const o of hide) o.visible = false;
    floor.visible = false;
    renderer.setRenderTarget(reflRT); renderer.render(scene, mirror); renderer.setRenderTarget(target);
    floor.visible = true;
    hide.forEach((o, i) => { o.visible = was[i]; });
  }

  const cool = new THREE.Color(0x8ea0c4), warm = new THREE.Color(0xffe9cf), white = new THREE.Color(0xffefdc);
  /* glow: the painting coming alive (0…1). restore: 1 the hall as it was, lamps lit; 0 in ruins, by moonlight. */
  function setState(glow, restore) {
    lastGlow = glow; lastRestore = restore;
    sky.intensity = 0.13 + 0.06 * restore; sky.color.copy(cool).lerp(warm, restore);   // little light from everywhere: it is what makes a room flat and grey
    key.intensity = 0.5 + 0.55 * restore; key.color.copy(cool).lerp(white, restore);
    for (const l of spots) l.intensity = 5.6 * restore;
    for (const l of sconces) l.intensity = 2000 * restore;
    lampMat.emissiveIntensity = 6 * restore;
    beamMat.opacity = 0.26 * restore;
    shaftMat.userData.u.uUp.value = 1.0 * restore;
    refl.uReflK.value = (0.35 + 0.65 * restore) * mirrorOn;
    if (envOf) envOf.environmentIntensity = 0.3 + 0.62 * restore;
    glowLight.intensity = 1400 * glow;
  }
  setState(0, 1);

  /* After the GPU was taken away and given back: what was worked out once is worked out again. */
  function renew(renderer, scene) { bakeEnv(renderer, scene); key.shadow.needsUpdate = true; }

  return { group, setState, setAssets, bakeEnv, reflect, resize, setMirror, renew };
}
