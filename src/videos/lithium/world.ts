import * as THREE from "three";
import {
  Kit, V, createLithiumMaterials,
  buildQuarryEnvironment, buildKilnEnvironment, buildLeachingEnvironment,
  buildGlobeEnvironment, buildBlueprintEnvironment, buildFutureRefineryEnvironment
} from "./build";
import { LIGHTS, LOOK } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { FPS, SHOTS, camAt, ShotDef } from "./story";

export const loadKit = async (): Promise<Kit> => {
  return {};
};

export class World {
  readonly root = new THREE.Group();
  private quarryGroup = new THREE.Group();
  private kilnGroup = new THREE.Group();
  private leachingGroup = new THREE.Group();
  private globeGroup = new THREE.Group();
  private blueprintGroup = new THREE.Group();
  private futureGroup = new THREE.Group();

  private hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
  private sun = new THREE.DirectionalLight(0xffffff, 1.8);
  private fill = new THREE.DirectionalLight(0xffffff, 0.4);
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private sky: THREE.Mesh;

  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];

  constructor(kit: Kit) {
    const R = this.root;
    R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 400;
    this.sun.shadow.camera.left = -60;
    this.sun.shadow.camera.right = 60;
    this.sun.shadow.camera.top = 60;
    this.sun.shadow.camera.bottom = -60;

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(800, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#5e93d9"),
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.layers.set(NOINK);
    R.add(this.sky);

    // Initialize Materials & Environments
    const mats = createLithiumMaterials();
    buildQuarryEnvironment(this.quarryGroup, mats);
    buildKilnEnvironment(this.kilnGroup, mats);
    buildLeachingEnvironment(this.leachingGroup, mats);
    buildGlobeEnvironment(this.globeGroup, mats);
    buildBlueprintEnvironment(this.blueprintGroup, mats);
    buildFutureRefineryEnvironment(this.futureGroup, mats);

    R.add(
      this.quarryGroup,
      this.kilnGroup,
      this.leachingGroup,
      this.globeGroup,
      this.blueprintGroup,
      this.futureGroup
    );
  }

  private actor(i: number) {
    while (this.actors.length <= i) this.actors.push(new Actor(this.root));
    return this.actors[i];
  }

  private fx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new Fx(this.root));
    return this.fxs[i];
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const t = f / FPS;
    const s = SHOTS[id - 1] ?? SHOTS[0];
    const L = LIGHTS[s.light] ?? LIGHTS.day;

    // 1. Camera positioning from story.ts
    const c = camAt(id, f);
    cam.position.set(...c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...c.look);
    cam.rotateZ(c.roll);
    cam.fov = c.fov;
    cam.near = 0.2;
    cam.far = 1500;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const lookTarget = V(...c.look);

    // 2. Toggle Environment Groups according to Shot
    this.quarryGroup.visible = (id === 1 || id === 2 || id === 3 || id === 4);
    this.kilnGroup.visible = (id === 5);
    this.leachingGroup.visible = (id === 6);
    this.globeGroup.visible = (id === 7);
    this.blueprintGroup.visible = (id === 8);
    this.futureGroup.visible = (id === 9);

    // 3. Lighting & Atmosphere
    this.hemi.color.set(L.sky);
    this.hemi.groundColor.set(L.ground);
    this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol);
    this.sun.intensity = L.sunI;
    this.sun.position.set(cam.position.x + 40, cam.position.y + 60, cam.position.z + 40);
    this.sun.target.position.copy(lookTarget);

    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;
    scene.background = null;

    this.sky.position.copy(cam.position);

    // 4. Staging Actors & Infographic Cards
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const stg = stage(this.root, this.pool, id, f, { pos: cam.position, right: camRight }, s.light);

    // Place Actors
    for (let i = 0; i < stg.places.length; i++) {
      const p = stg.places[i];
      const a = this.actor(i);
      const d = cam.position.distanceTo(V(p.x, p.y, p.z));
      a.place(p, this.pool, d);
    }
    for (let i = stg.places.length; i < this.actors.length; i++) {
      this.actors[i].hide();
    }

    // Place Fx Cards
    for (let i = 0; i < stg.fx.length; i++) {
      const p = stg.fx[i];
      const card = this.fx(i);
      card.place(p, this.pool);
    }
    for (let i = stg.fx.length; i < this.fxs.length; i++) {
      this.fxs[i].hide();
    }

    // Flush & Bind Canvases
    this.pool.flush();
    for (let i = 0; i < stg.places.length; i++) this.actors[i].bind();
    for (let i = 0; i < stg.fx.length; i++) this.fxs[i].bind();

    return lookTarget;
  }
}
