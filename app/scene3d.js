/* Cobble — the 3D city.
 *
 * A rebuilt scene, not a repair of the old one. The previous attempt drew a
 * white ground plane with the buildings floating above it; this one is a lit
 * ground, boxes that sit on it, a camera whose frustum matches the viewport,
 * and a slow drift so the view is alive without moving under your eye.
 *
 * Loaded only when the browser has WebGL and the visitor has not turned it
 * off. Everything is generated from the same counts the CSS city uses, so the
 * two views agree about the shape of the archive.
 */
(() => {
  const THREE_URL = 'vendor/three.min.js';
  const STORAGE_KEY = 'cobble-scene-3d';

  const palette = {
    everyday: '#b59a79',
    people: '#cb8e79',
    nature: '#82a58a',
    ideas: '#8699b8',
    joy: '#d5aa64',
    milestone: '#aa86a0'
  };

  let scene3d = null;
  let state = { counts: {}, total: 0, night: false };

  const wanted = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'off') return false;
      if (stored === 'on') return true;
    } catch {}
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  };

  const loadThree = () => new Promise((resolve, reject) => {
    if (window.THREE) { resolve(window.THREE); return; }
    const script = document.createElement('script');
    script.src = THREE_URL;
    script.async = true;
    script.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error('no THREE')));
    script.onerror = () => reject(new Error('three.js did not load'));
    document.head.appendChild(script);
  });

  function buildCity(THREE, counts) {
    const group = new THREE.Group();
    const entries = Object.entries(counts).filter(([, n]) => n);
    if (!entries.length) return group;

    /* Lay the districts out in a spiral so the middle fills first and the
       town grows outward, the way a real one does. */
    const slots = [];
    for (let ring = 0; ring < 4 && slots.length < 90; ring += 1) {
      const radius = ring * 3.4;
      const count = ring === 0 ? 1 : ring * 6;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.4;
        slots.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
    }

    let slot = 0;
    for (const [key, count] of entries) {
      const colour = new THREE.Color(palette[key] || '#9aa79a');
      const shown = Math.min(count, 14);
      for (let i = 0; i < shown; i += 1) {
        const [x, z] = slots[slot % slots.length];
        slot += 1;
        const height = 1.1 + Math.min(count, 12) * 0.42 + (i % 3) * 0.35;
        const width = 0.9 + ((i * 7) % 5) * 0.12;
        const depth = 0.9 + ((i * 5) % 4) * 0.14;

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          new THREE.MeshLambertMaterial({ color: colour })
        );
        body.position.set(x, height / 2, z);
        body.rotation.y = (i * 0.7) % (Math.PI / 2);
        group.add(body);

        /* a lighter cap, so the roofs read at a distance */
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(width * 1.04, 0.08, depth * 1.04),
          new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.06, 0.12) })
        );
        roof.position.set(x, height + 0.04, z);
        roof.rotation.y = body.rotation.y;
        group.add(roof);

        /* windows: thin bright strips on the street-facing side */
        if (height > 2.2) {
          const rows = Math.max(1, Math.floor(height / 1.1));
          for (let r = 0; r < rows; r += 1) {
            const light = new THREE.Mesh(
              new THREE.PlaneGeometry(width * 0.55, 0.1),
              new THREE.MeshBasicMaterial({ color: 0xfff0cc, transparent: true, opacity: 0.75 })
            );
            light.position.set(
              x + Math.sin(body.rotation.y) * (depth / 2 + 0.01),
              0.9 + r * 1.05,
              z + Math.cos(body.rotation.y) * (depth / 2 + 0.01)
            );
            light.rotation.y = body.rotation.y;
            group.add(light);
          }
        }
      }
    }
    return group;
  }

  function buildTrees(THREE, spread) {
    const group = new THREE.Group();
    const trunk = new THREE.MeshLambertMaterial({ color: 0x7d6247 });
    const leaf = new THREE.MeshLambertMaterial({ color: 0x6f8f6a });
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2;
      const radius = spread + 1.2 + ((i * 13) % 5) * 0.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), trunk);
      stem.position.set(x, 0.3, z);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 7), leaf);
      crown.position.set(x, 1.0, z);
      group.add(stem, crown);
    }
    return group;
  }

  function build(THREE, viewport) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xdfe9e4, 26, 46);

    /* An orthographic camera with the frustum corrected for the viewport: the
       old one used a fixed 16×13 frustum regardless of shape, which is why the
       scene never sat right. */
    const aspect = Math.max(0.5, viewport.clientWidth / Math.max(1, viewport.clientHeight));
    const view = 11;
    const camera = new THREE.OrthographicCamera(-view * aspect, view * aspect, view, -view, 0.1, 120);
    camera.position.set(0, 10.5, 24);
    camera.lookAt(0, 3.2, 0);

    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 8; skyCanvas.height = 256;
    const sctx = skyCanvas.getContext('2d');
    const gradient = sctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#cfe2dc');
    gradient.addColorStop(0.55, '#e6efe4');
    gradient.addColorStop(1, '#f2f4e6');
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, 8, 256);
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 90),
      new THREE.MeshBasicMaterial({ map: skyTexture })
    );
    backdrop.position.set(0, 12, -46);
    scene.add(backdrop);

    const sky = new THREE.HemisphereLight(0xeaf2ec, 0x4a6350, 0.85);
    scene.add(sky);
    const sun = new THREE.DirectionalLight(0xfff2d8, 0.95);
    sun.position.set(9, 16, 7);
    scene.add(sun);

    const grass = document.createElement('canvas');
    grass.width = grass.height = 256;
    const gctx = grass.getContext('2d');
    gctx.fillStyle = '#8fae86';
    gctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i += 1) {
      const shade = 138 + Math.floor(Math.random() * 26);
      gctx.fillStyle = `rgba(${shade - 34}, ${shade + 12}, ${shade - 42}, ${0.05 + Math.random() * 0.09})`;
      gctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const grassTexture = new THREE.CanvasTexture(grass);
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(9, 9);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshLambertMaterial({ color: 0xffffff, map: grassTexture })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 40),
      new THREE.MeshLambertMaterial({ color: 0xc9d2b8 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.01;
    scene.add(plaza);

    /* two roads, so the town has streets rather than a field */
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x6b6f66 });
    for (const rotation of [0, Math.PI / 2]) {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(46, 1.5), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = rotation;
      road.position.y = 0.02;
      scene.add(road);
    }

    const birds = new THREE.Group();
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x3d4a44, transparent: true, opacity: 0.55 });
    for (let i = 0; i < 7; i += 1) {
      const bird = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 3), birdMat);
      bird.rotation.z = Math.PI / 2;
      bird.position.set(-9 + i * 2.6, 8 + (i % 3) * 0.8, -6 - (i % 4) * 2);
      birds.add(bird);
    }
    scene.add(birds);

    const cityGroup = new THREE.Group();
    const trees = buildTrees(THREE, 12);
    scene.add(cityGroup, trees);

    viewport.appendChild(renderer.domElement);
    renderer.domElement.className = 'city-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const instance = { renderer, scene, camera, cityGroup, trees, sun, sky, birds, backdrop, frame: 0, t: 0 };
    instance.setData = next => {
      state = { ...state, ...next };
      cityGroup.clear();
      cityGroup.add(buildCity(THREE, state.counts));
    };
    instance.setNight = night => {
      state.night = night;
      const bg = night ? 0x121a1d : 0xdfe9e4;
      scene.fog.color.setHex(bg);
      ground.material.color.setHex(night ? 0x33453c : 0x8fae86);
      plaza.material.color.setHex(night ? 0x3d4a3f : 0xb9c3a8);
      sky.intensity = night ? 0.35 : 0.85;
      if (instance.backdrop) instance.backdrop.material.color.setHex(night ? 0x2a3a44 : 0xffffff);
      sun.intensity = night ? 0.25 : 0.95;
      sun.color.setHex(night ? 0x9fb6d8 : 0xfff2d8);
      viewport.classList.toggle('is-night', night);
    };
    return instance;
  }

  function start() {
    const viewport = document.querySelector('#city-viewport');
    if (!viewport || scene3d) return;
    loadThree()
      .then(THREE => {
        scene3d = build(THREE, viewport);
        scene3d.setData(state);
        scene3d.setNight(state.night);
        viewport.classList.add('has-3d');
        document.body.classList.add('scene-3d');
        tick();
        window.addEventListener('resize', onResize);
      })
      .catch(() => {
        /* the illustrated city stays; that is the point of having two */
        document.body.classList.remove('scene-3d');
      });
  }

  function tick() {
    if (!scene3d) return;
    scene3d.frame = requestAnimationFrame(tick);
    scene3d.t += 0.004;
    const { camera, renderer, scene, sun, birds } = scene3d;
    /* a slow drift, never enough to make you wait for it */
    camera.position.x = Math.sin(scene3d.t * 0.5) * 1.6;
    camera.position.z = 24 + Math.cos(scene3d.t * 0.5) * 0.9;
    camera.lookAt(0, 1.2, 0);
    sun.position.x = 9 + Math.sin(scene3d.t * 0.3) * 3;
    birds.children.forEach((bird, i) => {
      bird.position.x += 0.012 + (i % 3) * 0.004;
      bird.position.y = 8 + (i % 3) * 0.8 + Math.sin(scene3d.t * 2 + i) * 0.25;
      bird.rotation.x = Math.sin(scene3d.t * 3 + i) * 0.4;
      if (bird.position.x > 14) bird.position.x = -14;
    });
    renderer.render(scene, camera);
  }

  function onResize() {
    if (!scene3d) return;
    const viewport = document.querySelector('#city-viewport');
    if (!viewport) return;
    const { renderer, camera } = scene3d;
    const aspect = Math.max(0.5, viewport.clientWidth / Math.max(1, viewport.clientHeight));
    const view = 11;
    camera.left = -view * aspect;
    camera.right = view * aspect;
    camera.top = view;
    camera.bottom = -view;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
  }

  window.addEventListener('cobble-data', event => {
    const detail = event.detail || {};
    state.counts = detail.counts || {};
    state.total = detail.total || 0;
    if (scene3d) scene3d.setData(state);
    else if (wanted()) start();
  });

  window.addEventListener('cobble-night', event => {
    state.night = !!event.detail?.night;
    if (scene3d) scene3d.setNight(state.night);
  });

  /* The toggle in the control deck. */
  window.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#scene-toggle');
    if (!button) return;
    const paint = () => {
      const on = document.body.classList.contains('scene-3d');
      button.setAttribute('aria-pressed', String(on));
      button.querySelector('.scene-toggle-label').textContent = on ? '3D city' : 'Flat city';
    };
    button.addEventListener('click', () => {
      const on = document.body.classList.contains('scene-3d');
      if (on) {
        document.body.classList.remove('scene-3d');
        document.querySelector('#city-viewport')?.classList.remove('has-3d');
        scene3d?.renderer?.domElement?.remove();
        if (scene3d?.frame) cancelAnimationFrame(scene3d.frame);
        scene3d = null;
        try { localStorage.setItem(STORAGE_KEY, 'off'); } catch {}
      } else {
        try { localStorage.setItem(STORAGE_KEY, 'on'); } catch {}
        start();
      }
      setTimeout(paint, 120);
    });
    if (wanted()) start();
    setTimeout(paint, 200);
  });
})();
