export const FPS = 30;
export const TOTAL = 2685;

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export type Light = "day" | "golden";
export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: Light;
  tau: (t: number) => number;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 151, light: "day", tau: (t) => t },
  { id: 2, a: 151, b: 309, light: "day", tau: (t) => t },
  { id: 3, a: 309, b: 546, light: "day", tau: (t) => t },
  { id: 4, a: 546, b: 770, light: "day", tau: (t) => t },
  { id: 5, a: 770, b: 991, light: "day", tau: (t) => t },
  { id: 6, a: 991, b: 1422, light: "day", tau: (t) => t },
  { id: 7, a: 1422, b: 1833, light: "golden", tau: (t) => t },
  { id: 8, a: 1833, b: 2371, light: "golden", tau: (t) => t },
  { id: 9, a: 2371, b: TOTAL, light: "golden", tau: (t) => t },
];

export const XFADE: Record<number, number> = { 3: 6, 4: 6, 5: 6, 6: 6, 7: 8, 8: 8, 9: 8 };
export const FLASH_AT = 151;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export type Cam = { pos: V3; look: V3; fov: number; roll: number };

const pushK = (f: number, f0: number, rate: number) => {
  const x = Math.max(0, f - f0);
  return Math.exp(-rate * x);
};

const dolly = (pos: V3, look: V3, k: number, fov = 40, roll = 0): Cam => ({
  pos: [
    look[0] + (pos[0] - look[0]) * k,
    look[1] + (pos[1] - look[1]) * k,
    look[2] + (pos[2] - look[2]) * k,
  ],
  look,
  fov,
  roll,
});

/** Return camera parameters for a given shot id and frame f */
export const camAt = (id: number, f: number): Cam => {
  switch (id) {
    case 1: {
      // Shot 1: Jammu quarry ledge with title card "5.9M TONNES LITHIUM?"
      const k = pushK(f, 0, 0.0018);
      return dolly([0, 5.2, 11.0], [0, 4.8, 0], k, 42, 0);
    }
    case 2: {
      // Shot 2: Title card fractures; tight dramatic framing on Geologist
      const k = pushK(f, 151, 0.0015);
      return dolly([1.5, 4.9, 6.8], [0.6, 4.6, 0], k, 38, -0.035);
    }
    case 3: {
      // Shot 3: Macro view on the 583 ppm ore callout
      const k = pushK(f, 309, 0.0018);
      return dolly([0, 3.2, 8.2], [0, 3.2, 0], k, 36, 0);
    }
    case 4: {
      // Shot 4: Wide quarry vista with mining haul truck
      const k = pushK(f, 546, 0.0012);
      return dolly([14, 11, 20], [20, 4, -12], k, 44, 0.02);
    }
    case 5: {
      // Shot 5: Jaw crusher & 1000°C Rotary Kiln
      const k = pushK(f, 770, 0.0016);
      return dolly([-8, 7, 20], [4, 12, -8], k, 42, -0.03);
    }
    case 6: {
      // Shot 6: Chemical leaching reactors & battery pack
      const k = pushK(f, 991, 0.0014);
      return dolly([0, 9.2, 22], [0, 6, 2], k, 40, 0);
    }
    case 7: {
      // Shot 7: 3D Globe dual-hub map (China 65% & Indonesia 43%)
      const k = pushK(f, 1422, 0.0012);
      return dolly([18, 22, 24], [3, 2, 0], k, 45, 0.02);
    }
    case 8: {
      // Shot 8: ₹2,814 Cr Scheme Blueprint desk with 4 rising factories
      const k = pushK(f, 1833, 0.0015);
      return dolly([0, 16, 20], [0, 4.5, 0], k, 44, 0);
    }
    case 9:
    default: {
      // Shot 9: Completed Indian refinery, EV, sunset & final punchline
      const k = pushK(f, 2371, 0.0016);
      return dolly([0, 3.5, 16], [0, 5.0, -15], k, 42, 0.02);
    }
  }
};

/** Depth of field table */
export const dofAt = (f: number): { focus?: (f: number) => V3; cInf: number } => {
  const s = shotAt(f);
  switch (s.id) {
    case 1:
      return { cInf: 8 };
    case 2:
      return { cInf: 14 }; // Close up on Geologist face
    case 3:
      return { cInf: 12 };
    case 4:
      return { cInf: 4 }; // Wide quarry
    case 5:
      return { cInf: 10 };
    case 6:
      return { cInf: 10 };
    case 7:
      return { cInf: 6 };
    case 8:
      return { cInf: 8 };
    case 9:
      return { cInf: 6 };
    default:
      return { cInf: 6 };
  }
};

export const FLASH = 5.0;
export const D0 = 0;
export const PARK: V3 = [0, 0, 0];
export const ANCHOR: V3 = [0, 0, 0];
export const SNAP = 0;
export const DROP0 = 0;
export const DROP1 = 0;
export const DROP_H = 0;
export const bridgeState = () => ({ bounce: 0, drop: 0, snap: 0, collapsed: false });
export const deckY = () => 0;
export const dropW = () => 0;
export const shapeZ = () => 0;
export const snapEnd = () => [0, 0, 0] as V3;
export const front = () => 0;
export const BridgeState = {};
export const FOREGROUND = {};
export const marchPhase = () => 0;
export const stomp = () => 0;
export const dropU = () => 0;
