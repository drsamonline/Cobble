/* Cobble — the 3D city.
 *
 * A town you can walk around rather than look at: drag to pan, scroll to zoom,
 * hover to see what a building is, click to open that district in the timeline.
 * The camera fits the city it is given, so a large archive is shown as a larger
 * town instead of overflowing the frame.
 *
 * Loaded only when the browser has WebGL and the visitor has not turned it off.
 * Everything is generated from the same counts the CSS city uses, so the two
 * views agree about the shape of the archive.
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

  const labels = {
    everyday: 'Everyday detail',
    people: 'People & connection',
    nature: 'Outside & nature',
    ideas: 'Thoughts & ideas',
    joy: 'Small joys',
    milestone: 'Something meaningful'
  };

  let scene3d = null;
  let starting = false;
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

  /* A grid of slots that grows outward in rings, with a little jitter so the
     town is not a chessboard. */
  function makeSlots(needed) {
    const slots = [];
    for (let ring = 0; ring < 12 && slots.length < needed; ring += 1) {
      const radius = ring * 3.1;
      const count = ring === 0 ? 1 : Math.round(ring * 6.5);
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.45;
        const wobble = ((i * 37) % 11) / 11 - 0.5;
        slots.push([
          Math.cos(angle) * (radius + wobble * 0.6),
          Math.sin(angle) * (radius + wobble * 0.6)
        ]);
      }
    }
    return slots;
  }

  function buildCity(THREE, counts) {
    const group = new THREE.Group();
    group.userData.pickables = [];
    const entries = Object.entries(counts).filter(([, n]) => n);
    if (!entries.length) return group;

    const wanted = entries.reduce((sum, [, n]) => sum + Math.min(n, n > 150 ? 96 : 48), 0);
    const slots = makeSlots(wanted);
    let slot = 0;

    for (const [key, count] of entries) {
      const colour = new THREE.Color(palette[key] || '#9aa79a');
      /* a big archive earns a denser town, up to a point where the frame
         would turn into confetti */
      const shown = Math.min(count, count > 150 ? 96 : 48);
      for (let i = 0; i < shown; i += 1) {
        const [x, z] = slots[slot % slots.length];
        slot += 1;
        /* taller for a busier district, but with a ceiling so one district
           cannot make the rest unreadable */
        const height = 1.1 + Math.min(count, 24) * 0.28 + (i % 3) * 0.3;
        const width = 0.85 + ((i * 7) % 5) * 0.1;
        const depth = 0.85 + ((i * 5) % 4) * 0.12;

        const material = new THREE.MeshLambertMaterial({ color: colour });
        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        body.position.set(x, height / 2, z);
        body.rotation.y = (i * 0.7) % (Math.PI / 2);
        body.userData.district = key;
        body.userData.count = count;
        group.add(body);
        group.userData.pickables.push(body);

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(width * 1.04, 0.08, depth * 1.04),
          new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.06, 0.12) })
        );
        roof.position.set(x, height + 0.04, z);
        roof.rotation.y = body.rotation.y;
        group.add(roof);

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
    const count = Math.max(18, Math.min(70, Math.round(spread * 3)));
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = spread + 1.4 + ((i * 13) % 5) * 0.5;
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
    scene.fog = new THREE.Fog(0xdfe9e4, 40, 90);

    const aspect = Math.max(0.5, viewport.clientWidth / Math.max(1, viewport.clientHeight));
    const camera = new THREE.OrthographicCamera(-11 * aspect, 11 * aspect, 11, -11, 0.1, 260);
    camera.position.set(0, 10.5, 24);
    camera.lookAt(0, 3.2, 0);

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
    grassTexture.repeat.set(180, 180);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2400, 2400),
      new THREE.MeshLambertMaterial({ color: 0xffffff, map: grassTexture })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

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
      new THREE.PlaneGeometry(600, 320),
      new THREE.MeshBasicMaterial({ map: skyTexture })
    );
    backdrop.position.set(0, 40, -160);
    scene.add(backdrop);

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
    const trees = new THREE.Group();
    scene.add(cityGroup, trees);

    viewport.querySelectorAll('.city-canvas').forEach(node => node.remove());
    viewport.appendChild(renderer.domElement);
    renderer.domElement.className = 'city-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const instance = {
      renderer, scene, camera, cityGroup, trees, sun, sky, birds, backdrop,
      frame: 0, t: 0, baseView: 11, zoom: 1, pan: { x: 0, z: 0 }, aspect
    };

    /* ── the camera fits whatever it is given ─────────────────────────
       The old scene had a fixed frustum, so a large archive simply ran off
       the edges. The view is now derived from the radius of the town. */
    function applyFrustum() {
      const view = instance.baseView * instance.zoom;
      const a = Math.max(0.5, viewport.clientWidth / Math.max(1, viewport.clientHeight));
      camera.left = -view * a;
      camera.right = view * a;
      camera.top = view;
      camera.bottom = -view;
      /* an orthographic camera may look behind itself: without this the near
         half of the ground is clipped away and the frame ends in a flat band */
      camera.near = -3000;
      camera.far = 6000;
      camera.updateProjectionMatrix();
      camera.position.x = instance.pan.x;
      camera.position.z = 24 + instance.pan.z;
      camera.lookAt(instance.pan.x, 3.2, instance.pan.z * 0.55);
      /* the ground and the sky have to reach the new horizon */
      ground.scale.setScalar(Math.max(1, view / 11));
      backdrop.position.set(instance.pan.x, 40 * Math.max(1, view / 11), -160 * Math.max(1, view / 11));
      scene.fog.near = 30 * Math.max(1, view / 11);
      scene.fog.far = 90 * Math.max(1, view / 11);
    }

    function fitTo(group) {
      let radius = 0;
      for (const child of group.children) {
        if (!child.userData || !child.userData.district) continue;
        radius = Math.max(radius, Math.hypot(child.position.x, child.position.z));
      }
      instance.baseView = Math.max(9, radius * 1.05 + 2);
      instance.zoom = 1;
      instance.pan.x = 0;
      instance.pan.z = 0;
      camera.position.y = 10.5 + instance.baseView * 0.18;
      applyFrustum();
    }

    instance.setData = next => {
      state = { ...state, ...next };
      cityGroup.clear();
      const city = buildCity(THREE, state.counts);
      cityGroup.add(city);
      trees.clear();
      let spread = 12;
      for (const child of city.children) {
        if (child.userData && child.userData.district) {
          spread = Math.max(spread, Math.hypot(child.position.x, child.position.z));
        }
      }
      trees.add(buildTrees(THREE, spread + 1.5));
      fitTo(city);
    };

    instance.setNight = night => {
      state.night = night;
      const bg = night ? 0x121a1d : 0xdfe9e4;
      scene.fog.color.setHex(bg);
      ground.material.color.setHex(night ? 0x33453c : 0xffffff);
      sky.intensity = night ? 0.35 : 0.85;
      sun.intensity = night ? 0.25 : 0.95;
      sun.color.setHex(night ? 0x9fb6d8 : 0xfff2d8);
      backdrop.material.color.setHex(night ? 0x2a3a44 : 0xffffff);
      viewport.classList.toggle('is-night', night);
    };

    /* ── walking around ─────────────────────────────────────────────── */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;
    let dragging = false;
    let moved = 0;
    let last = { x: 0, y: 0 };

    function pick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(cityGroup.children[0]?.userData?.pickables || [], false);
      return hits[0]?.object || null;
    }

    function setHover(object) {
      if (hovered === object) return;
      if (hovered) hovered.material.emissive?.setHex(0x000000);
      hovered = object;
      if (hovered) {
        hovered.material.emissive?.setHex(0x2c2a1e);
        renderer.domElement.style.cursor = 'pointer';
        renderer.domElement.title = `${labels[hovered.userData.district] || hovered.userData.district} — ${hovered.userData.count} ${hovered.userData.count === 1 ? 'moment' : 'moments'}. Click to open.`;
      } else {
        renderer.domElement.style.cursor = 'grab';
        renderer.domElement.removeAttribute('title');
      }
    }

    /* Dragging is tracked on the window: a pointer capture on the canvas
       swallowed the pointerup in some browsers, which is how a click came out
       as nothing at all. */
    function startDrag(event) {
      dragging = true;
      moved = 0;
      last = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    }

    function movePointer(event) {
      if (!dragging) {
        if (event.target === renderer.domElement) setHover(pick(event));
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      last = { x: event.clientX, y: event.clientY };
      const scale = (instance.baseView * instance.zoom) / 300;
      instance.pan.x -= dx * scale;
      instance.pan.z -= dy * scale;
      const limit = instance.baseView * 1.6;
      instance.pan.x = Math.max(-limit, Math.min(limit, instance.pan.x));
      instance.pan.z = Math.max(-limit, Math.min(limit, instance.pan.z));
      applyFrustum();
    }

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      if (moved > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) return;
      const hit = pick(event);
      if (!hit) return;
      window.dispatchEvent(new CustomEvent('cobble-building', {
        detail: { district: hit.userData.district, count: hit.userData.count }
      }));
    }

    renderer.domElement.addEventListener('pointerdown', startDrag);
    renderer.domElement.addEventListener('pointermove', movePointer);
    renderer.domElement.addEventListener('pointerleave', () => { if (!dragging) setHover(null); });
    window.addEventListener('pointermove', event => { if (dragging) movePointer(event); });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', () => { dragging = false; renderer.domElement.style.cursor = 'grab'; });

    renderer.domElement.addEventListener('wheel', event => {
      event.preventDefault();
      const factor = Math.exp(event.deltaY * 0.0012);
      instance.zoom = Math.max(0.35, Math.min(3.2, instance.zoom * factor));
      applyFrustum();
    }, { passive: false });

    renderer.domElement.addEventListener('dblclick', () => { instance.setData(state); });

    renderer.domElement.style.cursor = 'grab';
    instance.applyFrustum = applyFrustum;
    instance.debugPick = (clientX, clientY) => {
      const object = pick({ clientX, clientY });
      const pickables = cityGroup.children[0]?.userData?.pickables || [];
      return {
        pickables: pickables.length,
        hit: object ? object.userData : null,
        camera: { l: camera.left, r: camera.right, t: camera.top, b: camera.bottom, x: camera.position.x, y: camera.position.y, z: camera.position.z }
      };
    };
    /* A handle for the browser check: it hovers and clicks a known point and
       reads back what was hit. Not used by the app itself. */
    window.__scene3d = instance;
    return instance;
  }

  function start() {
    const viewport = document.querySelector('#city-viewport');
    /* two calls can arrive before the first one has loaded three.js — one from
       the first render, one from DOMContentLoaded — and that built two canvases,
       with the pointer listeners on the one underneath */
    if (!viewport || scene3d || starting) return;
    starting = true;
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
        document.body.classList.remove('scene-3d');
      })
      .finally(() => { starting = false; });
  }

  function tick() {
    if (!scene3d) return;
    scene3d.frame = requestAnimationFrame(tick);
    scene3d.t += 0.004;
    const { renderer, scene, camera, sun, birds } = scene3d;
    /* a slow drift around the look-at point, never enough to fight the pan */
    const drift = Math.sin(scene3d.t * 0.5) * 0.9;
    camera.position.x = scene3d.pan.x + drift;
    camera.position.z = 24 + scene3d.pan.z + Math.cos(scene3d.t * 0.5) * 0.5;
    camera.lookAt(scene3d.pan.x, 3.2, scene3d.pan.z * 0.55);
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
    const { renderer } = scene3d;
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    scene3d.applyFrustum();
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

  window.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#scene-toggle');
    if (!button) return;
    const paint = () => {
      const on = document.body.classList.contains('scene-3d');
      button.setAttribute('aria-pressed', String(on));
      const dict = window.CobbleI18n;
      const label = on
        ? (dict && dict.t('deck.3d')) || '3D city'
        : (dict && dict.t('deck.flat')) || 'Flat city';
      button.querySelector('.scene-toggle-label').textContent = label;
      button.setAttribute('aria-label', label);
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
    window.addEventListener('cobble-lang', () => setTimeout(paint, 0));
    if (wanted()) start();
    setTimeout(paint, 200);
  });
})();
