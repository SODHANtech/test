import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, GEOLOGIST, fxShadow, fxContact, fxBlob,
  fxLithiumHook, fxLithiumCrack, fx583Ppm, fxKilnSign, fxLeachSign,
  fxChinaCard, fxIndonesiaCard, fxSchemeCard, fxPunchlineCard,
  Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import { FPS, SHOTS, V3 } from "./story";
import { NOINK } from "./ink";
import { cardShade, blobMaterial } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];

  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }

  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r); else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();

const geom = new THREE.PlaneGeometry(1, 1);

export class Actor {
  readonly root = new THREE.Group();
  private mesh = new THREE.Mesh(geom);
  private mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }));
  private blob = blobMaterial(blank);
  private r?: Req;

  constructor(parent: THREE.Group) {
    this.mesh.layers.set(NOINK);
    this.mesh.material = this.mat;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.root.add(this.mesh);
    parent.add(this.root);
  }

  place(p: Place, pool: Pool, d: number) {
    const k = d < 4 ? 2.0 : d < 9 ? 1.4 : 0.8;
    const cw = Math.round(600 * k), ch = Math.round(1000 * k);
    this.r = pool.req(p.key, cw, ch, k, p.draw);
    this.root.position.set(p.x, p.y + 0.95 * (p.scale ?? 1.8), p.z);
    this.root.scale.set(1.15 * (p.scale ?? 1.8), 1.9 * (p.scale ?? 1.8), 1);
    if (p.yaw != null) this.root.rotation.set(0, p.yaw, 0);
    this.root.visible = true;
  }

  bind() {
    const t = this.r?.tex;
    if (!t) return;
    this.mat.map = t;
    this.mesh.material = this.mat;
  }

  hide() {
    this.root.visible = false;
  }
}

export class Fx {
  readonly root = new THREE.Group();
  private mesh = new THREE.Mesh(geom);
  private mat = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false });
  private r?: Req;

  constructor(parent: THREE.Group) {
    this.mesh.layers.set(NOINK);
    this.mesh.material = this.mat;
    this.root.add(this.mesh);
    parent.add(this.root);
  }

  place(p: FxPlace, pool: Pool) {
    this.r = pool.req(p.key, p.cw, p.ch, 1, p.draw);
    this.root.position.set(p.x, p.y, p.z);
    this.root.scale.set(p.w, p.h, 1);
    if (p.flat) {
      this.root.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
    } else if (p.rot != null) {
      this.root.rotation.set(0, 0, p.rot);
    }
    this.root.visible = true;
  }

  bind() {
    const t = this.r?.tex;
    if (!t) return;
    this.mat.map = t;
  }

  hide() {
    this.root.visible = false;
  }
}

export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  yaw?: number;
};

export type FxPlace = {
  key: string;
  cw: number;
  ch: number;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  flat?: boolean;
  rot?: number;
};

export type Stage = { places: Place[]; fx: FxPlace[] };

/** Stage the Geologist and Infographics for each shot */
export const stage = (
  root: THREE.Group,
  pool: Pool,
  id: number,
  f: number,
  cam: { pos: THREE.Vector3; right: THREE.Vector3 },
  light: "day" | "golden"
): Stage => {
  const out: Stage = { places: [], fx: [] };
  const t = f / FPS;

  // Face camera angle
  const camAngle = Math.atan2(cam.pos.x, cam.pos.z);

  // 1. Position the Geologist based on Shot ID
  if (id === 1) {
    // Shot 1: Jammu quarry ledge, Geologist on the left, Title card on the right
    out.places.push({
      key: `geo|1|neutral`,
      x: -0.85,
      y: 3.5,
      z: 0,
      scale: 1.7,
      yaw: camAngle,
      draw: (p) => bodyFront(p, GEOLOGIST, { expr: "neutral", blink: (f % 60 < 4 ? 1 : 0), mode: "stand", lift: 0, seed: 1 }),
    });

    out.fx.push({
      key: "blob|geoshadow1",
      cw: 128,
      ch: 128,
      x: -0.85,
      y: 3.52,
      z: 0,
      w: 1.4,
      h: 1.0,
      flat: true,
      draw: (p) => fxBlob(p, "#2a151b"),
    });

    out.fx.push({
      key: "fx|lithiumHook",
      cw: 780,
      ch: 460,
      x: 0.95,
      y: 5.6,
      z: -0.5,
      w: 2.5,
      h: 1.48,
      draw: (p) => fxLithiumHook(p),
    });
  } else if (id === 2) {
    // Shot 2: Title card fractures; dramatic centered framing on Geologist
    out.places.push({
      key: `geo|2|stern`,
      x: 0,
      y: 3.4,
      z: 0,
      scale: 1.75,
      yaw: camAngle,
      draw: (p) => bodyFront(p, GEOLOGIST, { expr: "stern", blink: (f % 60 < 4 ? 1 : 0), mode: "stand", lift: 0, seed: 1 }),
    });

    out.fx.push({
      key: "blob|geoshadow2",
      cw: 128,
      ch: 128,
      x: 0,
      y: 3.42,
      z: 0,
      w: 1.4,
      h: 1.0,
      flat: true,
      draw: (p) => fxBlob(p, "#2a151b"),
    });

    out.fx.push({
      key: "fx|lithiumCrack",
      cw: 780,
      ch: 460,
      x: 0,
      y: 6.3,
      z: -0.6,
      w: 2.7,
      h: 1.58,
      draw: (p) => fxLithiumCrack(p),
    });
  } else if (id === 3) {
    // Shot 3: 583 ppm Ore Callout
    out.fx.push({
      key: "fx|583ppm",
      cw: 680,
      ch: 380,
      x: 0,
      y: 3.2,
      z: 0,
      w: 2.8,
      h: 1.55,
      draw: (p) => fx583Ppm(p),
    });
  } else if (id === 4) {
    // Shot 4: Geologist observing mining haul truck
    out.places.push({
      key: "geo|shot4",
      x: 8,
      y: 3.5,
      z: -4,
      scale: 1.7,
      yaw: camAngle,
      draw: (p) => bodyFront(p, GEOLOGIST, { expr: "smile_closed", blink: 0, mode: "stand", lift: 0, seed: 2 }),
    });
  } else if (id === 5) {
    // Shot 5: 1000°C Rotary Kiln Sign
    out.fx.push({
      key: "fx|kilnSign",
      cw: 680,
      ch: 340,
      x: 2.5,
      y: 16.5,
      z: -6,
      w: 3.5,
      h: 1.75,
      draw: (p) => fxKilnSign(p),
    });
  } else if (id === 6) {
    // Shot 6: >99.5% Battery Grade Chemical Sign
    out.fx.push({
      key: "fx|leachSign",
      cw: 680,
      ch: 340,
      x: 0,
      y: 9.8,
      z: 4,
      w: 3.4,
      h: 1.7,
      draw: (p) => fxLeachSign(p),
    });
  } else if (id === 7) {
    // Shot 7: Geopolitical Dual-Hub Cards
    out.fx.push({
      key: "fx|chinaCard",
      cw: 640,
      ch: 300,
      x: 2.5,
      y: 11.5,
      z: -5,
      w: 2.8,
      h: 1.35,
      draw: (p) => fxChinaCard(p),
    });
    out.fx.push({
      key: "fx|indoCard",
      cw: 640,
      ch: 300,
      x: 5.5,
      y: 9.2,
      z: 3,
      w: 2.8,
      h: 1.35,
      draw: (p) => fxIndonesiaCard(p),
    });
  } else if (id === 8) {
    // Shot 8: ₹2,814 Cr Scheme Stamp
    out.fx.push({
      key: "fx|schemeCard",
      cw: 780,
      ch: 400,
      x: 0,
      y: 9.8,
      z: -1,
      w: 4.2,
      h: 2.15,
      draw: (p) => fxSchemeCard(p),
    });
    // Geologist reviewing blueprint
    out.places.push({
      key: "geo|blueprint",
      x: -8,
      y: 0,
      z: 0,
      scale: 1.8,
      yaw: camAngle,
      draw: (p) => bodyFront(p, GEOLOGIST, { expr: "smile", blink: (f % 70 < 4 ? 1 : 0), mode: "stand", lift: 0, seed: 3 }),
    });
  } else if (id === 9) {
    // Shot 9: Completed Indian Refinery, Geologist & Final Punchline
    out.places.push({
      key: "geo|final",
      x: -1.8,
      y: 0,
      z: 0,
      scale: 1.85,
      yaw: camAngle,
      draw: (p) => bodyFront(p, GEOLOGIST, { expr: "laugh", blink: 0, mode: "stand", lift: 0, seed: 4 }),
    });
    // Punchline Banner
    out.fx.push({
      key: "fx|punchlineCard",
      cw: 880,
      ch: 380,
      x: 0,
      y: 7.2,
      z: -10,
      w: 4.8,
      h: 2.1,
      draw: (p) => fxPunchlineCard(p),
    });
  }

  return out;
};

export const SIGN_AT = 0;
export const SU_SWING = 0;
export const splashFx = () => {};
export const snapFx = () => {};
export const creakFx = () => {};
