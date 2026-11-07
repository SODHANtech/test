import * as THREE from "three";
import { twoTone } from "./shade";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();

  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = src.clone();
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x);
    else this.g.set(mat, [x]);
  }

  build(root: THREE.Group) {
    for (const [mat, geos] of this.g.entries()) {
      if (geos.length === 0) continue;
      // Simple merge: combine positions, normals, uvs
      const merged = new THREE.BufferGeometry();
      let totalVerts = 0;
      for (const g of geos) totalVerts += g.attributes.position.count;

      const pos = new Float32Array(totalVerts * 3);
      const norm = new Float32Array(totalVerts * 3);
      const uv = new Float32Array(totalVerts * 2);

      let offset = 0;
      for (const g of geos) {
        const p = g.attributes.position.array;
        const n = g.attributes.normal?.array;
        const u = g.attributes.uv?.array;
        pos.set(p, offset * 3);
        if (n) norm.set(n, offset * 3);
        if (u) uv.set(u, offset * 2);
        offset += g.attributes.position.count;
      }

      merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      merged.setAttribute("normal", new THREE.BufferAttribute(norm, 3));
      merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    }
  }
}

// Materials for the Lithium Story World
export const createLithiumMaterials = () => {
  return {
    // Terracotta bauxite / laterite rock (quarry)
    lateriteDark: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#7c2d18") })),
    lateriteMid: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#a84b2e") })),
    lateriteLight: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#c26544") })),
    quarryFloor: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#8f3b20") })),
    
    // Industrial structures
    factorySteel: twoTone(new THREE.MeshPhongMaterial({ color: new THREE.Color("#334155"), specular: "#64748b", shininess: 40 })),
    corrugatedRoof: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#475569") })),
    concretePlinth: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#94a3b8") })),
    smokestack: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#cbd5e1") })),
    smokeStripe: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#ef4444") })),
    
    // Machinery & Kiln
    kilnExterior: twoTone(new THREE.MeshPhongMaterial({ color: new THREE.Color("#475569"), specular: "#94a3b8", shininess: 50 })),
    kilnGlowingCore: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff4500") }),
    crusherYellow: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#eab308") })),
    heavyTruckBody: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#f59e0b") })),
    truckTire: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#0f172a") })),
    
    // Chemical plant & Leaching
    stainlessTank: twoTone(new THREE.MeshPhongMaterial({ color: new THREE.Color("#e2e8f0"), specular: "#ffffff", shininess: 90 })),
    pipework: twoTone(new THREE.MeshPhongMaterial({ color: new THREE.Color("#38bdf8"), specular: "#7dd3fc", shininess: 60 })),
    leachLiquid: new THREE.MeshLambertMaterial({ color: new THREE.Color("#06b6d4"), transparent: true, opacity: 0.8 }),
    batteryPowder: new THREE.MeshLambertMaterial({ color: new THREE.Color("#f8fafc") }),
    batteryCellBlue: new THREE.MeshPhongMaterial({ color: new THREE.Color("#2563eb"), emissive: new THREE.Color("#1d4ed8"), emissiveIntensity: 0.3 }),
    
    // Geopolitical globe & blueprint
    oceanBase: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#0f172a") })),
    continentLand: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#334155") })),
    chinaRed: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#dc2626") })),
    indonesiaGreen: twoTone(new THREE.MeshLambertMaterial({ color: new THREE.Color("#059669") })),
    blueprintGrid: new THREE.MeshBasicMaterial({ color: new THREE.Color("#0284c7") }),
    futureGlass: new THREE.MeshPhongMaterial({ color: new THREE.Color("#38bdf8"), transparent: true, opacity: 0.6 }),
    evCarWhite: twoTone(new THREE.MeshPhongMaterial({ color: new THREE.Color("#f8fafc"), specular: "#ffffff", shininess: 80 })),
  };
};

/** Build the Jammu Bauxite / Laterite Quarry environment (Shots 1, 2, 4) */
export const buildQuarryEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Tiered quarry terraces (Opencast mine benches)
  // Base floor
  b.add(new THREE.BoxGeometry(400, 2, 400), m.quarryFloor, new THREE.Matrix4().makeTranslation(0, -1, 0));

  // Stepped quarry walls & benches
  for (let tier = 0; tier < 6; tier++) {
    const y = tier * 3.5;
    const zOffset = -25 - tier * 18;
    const width = 350;
    const depth = 22;
    const mat = tier % 2 === 0 ? m.lateriteMid : m.lateriteDark;
    b.add(new THREE.BoxGeometry(width, 3.5, depth), mat, new THREE.Matrix4().makeTranslation(0, y + 1.75, zOffset));

    // Jagged outcrop blocks along the ledge
    for (let j = -6; j <= 6; j++) {
      const rockX = j * 24 + ((tier * 7) % 11);
      const rockH = 1.8 + ((j + tier) % 3) * 0.9;
      const rockW = 8 + (j % 4) * 2;
      b.add(
        new THREE.BoxGeometry(rockW, rockH, 6),
        m.lateriteLight,
        new THREE.Matrix4().makeTranslation(rockX, y + 3.5 + rockH / 2, zOffset + depth / 2 - 3)
      );
    }
  }

  // Geologist's viewing ledge at (0, 3.5, 0)
  b.add(new THREE.BoxGeometry(24, 3.5, 20), m.lateriteMid, new THREE.Matrix4().makeTranslation(0, 1.75, 0));
  // Decorative rock cluster on the ledge
  b.add(new THREE.BoxGeometry(3.5, 1.4, 2.5), m.lateriteLight, new THREE.Matrix4().makeTranslation(4.5, 3.5 + 0.7, 2));
  b.add(new THREE.BoxGeometry(2.0, 1.0, 1.8), m.lateriteDark, new THREE.Matrix4().makeTranslation(-4.2, 3.5 + 0.5, 1.5));

  // Distant Industrial Chemical Refinery (z = -140)
  for (let k = -2; k <= 2; k++) {
    const px = k * 35;
    // Tall chimneys
    b.add(new THREE.CylinderGeometry(2.2, 3.0, 48, 16), m.smokestack, new THREE.Matrix4().makeTranslation(px, 44, -140));
    // Red hazard rings at top of chimneys
    b.add(new THREE.CylinderGeometry(2.25, 2.3, 4, 16), m.smokeStripe, new THREE.Matrix4().makeTranslation(px, 64, -140));
    // Factory buildings
    b.add(new THREE.BoxGeometry(26, 18, 22), m.factorySteel, new THREE.Matrix4().makeTranslation(px, 9, -125));
    b.add(new THREE.ConeGeometry(18, 7, 4), m.corrugatedRoof, new THREE.Matrix4().makeTranslation(px, 21.5, -125).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 4)));
    // Cylindrical acid storage silos
    b.add(new THREE.CylinderGeometry(6, 6, 20, 16), m.stainlessTank, new THREE.Matrix4().makeTranslation(px + 14, 10, -112));
  }

  // Mining Haul Truck (on quarry floor at x = 22, z = -12)
  const truckM = new THREE.Matrix4().makeTranslation(22, 0, -12);
  // Wheels (4 big tires)
  for (const wx of [-5, 5]) {
    for (const wz of [-3.5, 3.5]) {
      const tireGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.8, 16);
      tireGeo.rotateZ(Math.PI / 2);
      b.add(tireGeo, m.truckTire, new THREE.Matrix4().makeTranslation(wx, 2.2, wz).premultiply(truckM));
    }
  }
  // Truck chassis & cab
  b.add(new THREE.BoxGeometry(13, 2, 8), m.truckTire, new THREE.Matrix4().makeTranslation(0, 3, 0).premultiply(truckM));
  b.add(new THREE.BoxGeometry(4, 4.5, 4.5), m.heavyTruckBody, new THREE.Matrix4().makeTranslation(4.5, 5.5, 1.5).premultiply(truckM));
  // Tilting dump bed filled with red ore chunks
  b.add(new THREE.BoxGeometry(8.5, 3.8, 7.5), m.heavyTruckBody, new THREE.Matrix4().makeTranslation(-2.2, 5.8, 0).premultiply(truckM));
  b.add(new THREE.BoxGeometry(7.5, 1.8, 6.8), m.lateriteDark, new THREE.Matrix4().makeTranslation(-2.2, 7.4, 0).premultiply(truckM));

  b.build(group);
};

/** Build the Industrial Rotary Kiln & Crusher Scene (Shot 5) */
export const buildKilnEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Factory concrete floor & steel structural columns
  b.add(new THREE.BoxGeometry(120, 1.5, 120), m.concretePlinth, new THREE.Matrix4().makeTranslation(0, -0.75, 0));

  for (const cx of [-25, 25]) {
    for (const cz of [-30, 0, 30]) {
      b.add(new THREE.BoxGeometry(1.6, 26, 1.6), m.factorySteel, new THREE.Matrix4().makeTranslation(cx, 13, cz));
    }
  }

  // Heavy steel Jaw Crusher (on left side)
  const crusherM = new THREE.Matrix4().makeTranslation(-14, 0, 12);
  b.add(new THREE.BoxGeometry(10, 8, 8), m.crusherYellow, new THREE.Matrix4().makeTranslation(0, 4, 0).premultiply(crusherM));
  // Crusher hopper funnel
  b.add(new THREE.CylinderGeometry(5.5, 3.5, 4, 4), m.factorySteel, new THREE.Matrix4().makeTranslation(0, 10, 0).premultiply(crusherM));

  // Inclined Conveyor Belt from Crusher to Kiln mouth
  const conveyorGeo = new THREE.BoxGeometry(2.5, 0.8, 26);
  conveyorGeo.rotateX(0.18);
  b.add(conveyorGeo, m.factorySteel, new THREE.Matrix4().makeTranslation(-7, 7, -2));

  // The Giant Rotary Kiln: Cylinder angled at 4 degrees
  const kilnLength = 36;
  const kilnRadius = 3.6;
  const kilnGeo = new THREE.CylinderGeometry(kilnRadius, kilnRadius, kilnLength, 24, 1, true);
  kilnGeo.rotateZ(Math.PI / 2);
  kilnGeo.rotateX(0.08); // Slight angle for industrial material flow

  const kilnM = new THREE.Matrix4().makeTranslation(6, 11, -8);
  b.add(kilnGeo, m.kilnExterior, kilnM);

  // Riding rings & steel support trunnions
  for (const rz of [-10, 10]) {
    const ringGeo = new THREE.TorusGeometry(kilnRadius + 0.35, 0.45, 12, 24);
    ringGeo.rotateY(Math.PI / 2);
    ringGeo.rotateX(0.08);
    b.add(ringGeo, m.factorySteel, new THREE.Matrix4().makeTranslation(6, 11, -8 + rz));
    // Support piers
    b.add(new THREE.BoxGeometry(3, 8, 3), m.concretePlinth, new THREE.Matrix4().makeTranslation(6, 4, -8 + rz));
  }

  // Glowing orange-red interior disc representing 1000°C thermal roast
  const glowGeo = new THREE.CircleGeometry(kilnRadius - 0.2, 24);
  glowGeo.rotateY(-Math.PI / 2);
  glowGeo.rotateX(0.08);
  b.add(glowGeo, m.kilnGlowingCore, new THREE.Matrix4().makeTranslation(6 - kilnLength / 2 + 0.5, 11, -8));

  b.build(group);
};

/** Build the Chemical Leaching & Battery Module Scene (Shot 6) */
export const buildLeachingEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Clean industrial tiled laboratory/refinery floor
  b.add(new THREE.BoxGeometry(80, 1.2, 80), m.concretePlinth, new THREE.Matrix4().makeTranslation(0, -0.6, 0));

  // 3 Stainless Steel Acid Leaching Reactors
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 14;
    // Main vessel
    b.add(new THREE.CylinderGeometry(4.5, 4.5, 14, 24), m.stainlessTank, new THREE.Matrix4().makeTranslation(x, 8, -6));
    // Dome top
    b.add(new THREE.SphereGeometry(4.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.stainlessTank, new THREE.Matrix4().makeTranslation(x, 15, -6));
    // Heavy support legs
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2;
      b.add(new THREE.CylinderGeometry(0.4, 0.4, 6, 8), m.factorySteel, new THREE.Matrix4().makeTranslation(x + Math.cos(ang) * 4.2, 3, -6 + Math.sin(ang) * 4.2));
    }
  }

  // Interconnecting blue chemical pipework
  const pipe1 = new THREE.CylinderGeometry(0.5, 0.5, 28, 12);
  pipe1.rotateZ(Math.PI / 2);
  b.add(pipe1, m.pipework, new THREE.Matrix4().makeTranslation(0, 16.5, -6));

  // Output Chute pouring white battery chemical powder
  b.add(new THREE.CylinderGeometry(1.8, 0.8, 5, 16), m.stainlessTank, new THREE.Matrix4().makeTranslation(0, 7.5, 5));
  // White purified battery powder mound
  b.add(new THREE.ConeGeometry(2.4, 1.5, 16), m.batteryPowder, new THREE.Matrix4().makeTranslation(0, 4.5, 5));

  // EV Battery Pack Module (in front)
  const batteryPackM = new THREE.Matrix4().makeTranslation(0, 1.5, 7.5);
  b.add(new THREE.BoxGeometry(10, 1.6, 6.5), m.factorySteel, batteryPackM);
  // Grid of blue battery cells inside
  for (let r = -2; r <= 2; r++) {
    for (let c = -1; c <= 1; c++) {
      b.add(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 12), m.batteryCellBlue, new THREE.Matrix4().makeTranslation(r * 1.6, 0.9, c * 1.6).premultiply(batteryPackM));
    }
  }

  b.build(group);
};

/** Build the Geopolitical Dual-Hub Globe Platform (Shot 7) */
export const buildGlobeEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Dark pedestal stage
  b.add(new THREE.CylinderGeometry(24, 26, 3, 32), m.oceanBase, new THREE.Matrix4().makeTranslation(0, -1.5, 0));

  // 3D low-poly continents / landmasses
  // Eurasia / India landmass
  b.add(new THREE.BoxGeometry(14, 1.2, 10), m.continentLand, new THREE.Matrix4().makeTranslation(2, 0.6, -2));
  // Americas
  b.add(new THREE.BoxGeometry(8, 1.2, 18), m.continentLand, new THREE.Matrix4().makeTranslation(-14, 0.6, 2));
  // Australia
  b.add(new THREE.BoxGeometry(7, 1.2, 6), m.continentLand, new THREE.Matrix4().makeTranslation(12, 0.6, 8));

  // Dual Chokepoints:
  // 1. CHINA (Red industrial hub tower at x = 4, z = -5)
  const chinaM = new THREE.Matrix4().makeTranslation(4, 1.2, -5);
  b.add(new THREE.BoxGeometry(4, 10, 4), m.chinaRed, new THREE.Matrix4().makeTranslation(0, 5, 0).premultiply(chinaM));
  b.add(new THREE.CylinderGeometry(0.6, 0.6, 16, 12), m.factorySteel, new THREE.Matrix4().makeTranslation(1, 8, 1).premultiply(chinaM));

  // 2. INDONESIA (Emerald island refining hub at x = 7, z = 3)
  const indoM = new THREE.Matrix4().makeTranslation(7, 1.2, 3);
  b.add(new THREE.CylinderGeometry(3.5, 4.0, 7, 6), m.indonesiaGreen, new THREE.Matrix4().makeTranslation(0, 3.5, 0).premultiply(indoM));
  b.add(new THREE.CylinderGeometry(0.5, 0.5, 12, 12), m.factorySteel, new THREE.Matrix4().makeTranslation(0, 6, 0).premultiply(indoM));

  b.build(group);
};

/** Build the ₹2,814 Cr Scheme Blueprint Scene (Shot 8) */
export const buildBlueprintEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Architectural drafting table base
  b.add(new THREE.BoxGeometry(18, 2, 22), m.factorySteel, new THREE.Matrix4().makeTranslation(0, 0, 0));
  // Cyan blueprint table surface
  b.add(new THREE.BoxGeometry(16, 0.1, 20), m.blueprintGrid, new THREE.Matrix4().makeTranslation(0, 1.05, 0));

  // Drafting grid lines across the blueprint
  for (let gx = -7; gx <= 7; gx += 2) {
    b.add(new THREE.BoxGeometry(0.08, 0.12, 19), m.leachLiquid, new THREE.Matrix4().makeTranslation(gx, 1.06, 0));
  }
  for (let gz = -9; gz <= 9; gz += 2) {
    b.add(new THREE.BoxGeometry(15, 0.12, 0.08), m.leachLiquid, new THREE.Matrix4().makeTranslation(0, 1.06, gz));
  }

  // 4 3D Processing Plants rising in the blueprint center:
  // Plant 1 & 2: Lithium plants (Blue accents, 30 kt) on the left
  for (const [x, z] of [[-2.4, -2.5], [-2.4, 2.5]]) {
    const pM = new THREE.Matrix4().makeTranslation(x, 1.1, z);
    b.add(new THREE.BoxGeometry(3.2, 3.8, 2.8), m.concretePlinth, new THREE.Matrix4().makeTranslation(0, 1.9, 0).premultiply(pM));
    b.add(new THREE.CylinderGeometry(0.7, 0.7, 5.5, 12), m.pipework, new THREE.Matrix4().makeTranslation(0.8, 2.5, 0.6).premultiply(pM));
  }

  // Plant 3 & 4: Nickel plants (Green accents, 50 kt) on the right
  for (const [x, z] of [[2.4, -2.5], [2.4, 2.5]]) {
    const pM = new THREE.Matrix4().makeTranslation(x, 1.1, z);
    b.add(new THREE.BoxGeometry(3.2, 4.2, 2.8), m.concretePlinth, new THREE.Matrix4().makeTranslation(0, 2.1, 0).premultiply(pM));
    b.add(new THREE.CylinderGeometry(0.8, 0.8, 6.0, 12), m.indonesiaGreen, new THREE.Matrix4().makeTranslation(-0.8, 2.8, 0.6).premultiply(pM));
  }

  b.build(group);
};

/** Build the Future Indian Refinery & EV Scene (Shot 9) */
export const buildFutureRefineryEnvironment = (group: THREE.Group, m: ReturnType<typeof createLithiumMaterials>) => {
  const b = new Batch();

  // Ground landscape & sleek modern road
  b.add(new THREE.BoxGeometry(200, 2, 200), m.concretePlinth, new THREE.Matrix4().makeTranslation(0, -1, 0));
  b.add(new THREE.BoxGeometry(20, 0.05, 160), m.factorySteel, new THREE.Matrix4().makeTranslation(0, 0.03, 0)); // Road

  // State-of-the-art gleaming Indian critical mineral refinery in background (z = -45)
  const refM = new THREE.Matrix4().makeTranslation(0, 0, -45);
  b.add(new THREE.BoxGeometry(60, 22, 20), m.stainlessTank, new THREE.Matrix4().makeTranslation(0, 11, 0).premultiply(refM));
  b.add(new THREE.BoxGeometry(62, 2, 22), m.futureGlass, new THREE.Matrix4().makeTranslation(0, 23, 0).premultiply(refM));
  // 4 modern exhaust stacks with glowing blue efficiency filters
  for (let k = -2; k <= 2; k++) {
    b.add(new THREE.CylinderGeometry(1.5, 1.8, 32, 16), m.stainlessTank, new THREE.Matrix4().makeTranslation(k * 14, 24, 0).premultiply(refM));
  }

  // Sleek White Electric Vehicle gliding on the road (at x = 0, y = 0, z = -10)
  const evM = new THREE.Matrix4().makeTranslation(0, 0, -10);
  // Wheels
  for (const wx of [-2.4, 2.4]) {
    for (const wz of [-1.8, 1.8]) {
      const wGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.6, 16);
      wGeo.rotateZ(Math.PI / 2);
      b.add(wGeo, m.truckTire, new THREE.Matrix4().makeTranslation(wx, 0.85, wz).premultiply(evM));
    }
  }
  // Aerodynamic body & cockpit
  b.add(new THREE.BoxGeometry(3.6, 1.2, 7.5), m.evCarWhite, new THREE.Matrix4().makeTranslation(0, 1.2, 0).premultiply(evM));
  b.add(new THREE.BoxGeometry(3.0, 1.1, 4.0), m.futureGlass, new THREE.Matrix4().makeTranslation(0, 2.2, -0.4).premultiply(evM));

  b.build(group);
};
