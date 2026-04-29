import * as THREE from "three";
import fragmentShader from "./fragmentShader";
import vertexShader from "./vertexShader";

const rawPalette = ["#ecffe6", "#ddffdd", "#FFFF99", "#fff9e7"]; // Light pink, green, yellow, blue
const colorPalette: THREE.Color[] = rawPalette.map(
  (hex) => new THREE.Color(hex),
);

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

interface SketchOptions {
  dom: HTMLElement;
}

export default class Sketch {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private material!: THREE.ShaderMaterial;
  private geometry!: THREE.PlaneGeometry;
  private plane!: THREE.Mesh;
  private time = 0;
  private isPlaying = true;
  private container: HTMLElement;

  // perf helpers (minimal change to your render loop)
  private lastRenderMs: number | null = null; // for dt-based time stepping
  private targetMobileFPS = 30; // throttle target on mobile
  private visHandler: (() => void) | null = null;
  private io: IntersectionObserver | null = null;

  constructor(options: SketchOptions) {
    this.container = options.dom;

    // --- scene + renderer (keep your structure; optimize options) ---
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.applyPixelRatio(); // set DPR based on device
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.setClearColor(0xeeeeee);
    this.container.appendChild(this.renderer.domElement);

    // --- camera (unchanged) ---
    this.camera = new THREE.PerspectiveCamera(
      10,
      this.container.clientWidth / this.container.clientHeight,
      0.001,
      1000,
    );
    this.camera.position.set(0, 0, 9);
    // --- build your scene (kept) ---
    this.addObjects();
    this.addLights();

    // --- events ---
    window.addEventListener("resize", this.onResize);
    this.visHandler = () => {
      // pause when tab hidden; resume when visible
      this.isPlaying = !document.hidden && this.inViewport; // combine with IO flag
      if (this.isPlaying && this.lastRenderMs === null) {
        // reset timing when resuming to avoid dt spikes
        this.lastRenderMs = performance.now();
        this.render();
      }
    };
    document.addEventListener("visibilitychange", this.visHandler);

    // Pause when not in viewport (cheap battery/GPU saver)
    let inView = true;
    this.io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        this.inViewport = inView;
        this.isPlaying = inView && !document.hidden;
        if (this.isPlaying && this.lastRenderMs === null) {
          this.lastRenderMs = performance.now();
          this.render();
        }
      },
      { root: null, threshold: 0 },
    );
    this.io.observe(this.container);

    // initial layout + start
    this.onResize();
    this.render();
  }

  // track viewport state (used with visibilitychange)
  private inViewport = true;

  private applyPixelRatio() {
    const dpr = isMobile() ? 1 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dpr);
  }

  private addObjects() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uColor: { value: colorPalette },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader,
      fragmentShader,
    });

    // reduce segments on mobile; keep your original 300 on desktop
    const segs = isMobile() ? 60 : 400;
    this.geometry = new THREE.PlaneGeometry(4.5, 3, segs, segs);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  private addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(0.1, 1, 0.866);
    this.scene.add(dir);
  }

  private onResize = () => {
    // update DPR (important when rotating a device or zoom level changes)
    this.applyPixelRatio();

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    // keep resolution uniform useful for your shader
    const dpr = this.renderer.getPixelRatio();
    this.material.uniforms.resolution.value.set(w * dpr, h * dpr, w, h);
  };

  public stop() {
    this.isPlaying = false;

    // remove listeners
    window.removeEventListener("resize", this.onResize);
    if (this.visHandler)
      document.removeEventListener("visibilitychange", this.visHandler);
    this.io?.disconnect();
    this.io = null;

    // dispose resources
    this.scene.remove(this.plane);
    this.geometry?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();

    // detach canvas
    if (this.renderer?.domElement?.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // --- render loop (kept, with mobile throttle + dt time) ---
  private render = (now?: number) => {
    if (!this.isPlaying) {
      this.lastRenderMs = null;
      return;
    }

    const t = now ?? performance.now();
    // mobile throttle: only update/draw if enough time elapsed for ~30fps
    if (isMobile() && this.lastRenderMs !== null) {
      const elapsed = t - this.lastRenderMs;
      const minStep = 1000 / this.targetMobileFPS;
      if (elapsed < minStep) {
        requestAnimationFrame(this.render);
        return;
      }
    }

    // dt-based time advance to keep animation speed consistent across FPS
    let dtSec = 0;
    if (this.lastRenderMs !== null) dtSec = (t - this.lastRenderMs) / 1000;
    this.lastRenderMs = t;

    // Your original per-frame increment was 0.00012 per frame at ~60fps.
    // That's ~0.0072 per second. Advance by real dt to keep the look:
    this.time += 0.0372 * dtSec;

    // uniforms + draw
    this.material.uniforms.time.value = this.time;
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render);
  };
}
