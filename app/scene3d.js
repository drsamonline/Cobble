/* Cobble — the 3D city.
 *
 * A town you can walk around: drag to pan, scroll to zoom, hover to see what a
 * building is, click to open that district in the timeline. Zoom far enough out
 * and the camera lifts into cloud, so the town reads as a place inside a
 * landscape rather than a model on a table.
 *
 * Everything is generated — no models, no textures beyond two canvas gradients
 * — so the whole scene costs a few kilobytes of code. Counts are derived from
 * the archive, and capped, because a thousand people on a phone is a slideshow.
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

  const SKIN = [0xf0c9a6, 0xdca87d, 0xb9825a, 0x8d5a3b, 0x6b4128];
  const CLOTH = [0x7d92a8, 0xa8766b, 0x6f8f6a, 0xb59a79, 0x8a7fa8, 0xc2a05c, 0x5f7f86];
  const CAR_COLOUR = [0xb5563f, 0x4d6f8f, 0xd8c9a3, 0x5c6b58, 0x8a5a7a, 0x2f4858];

  let scene3d = null;
  let starting = false;
  let state = { counts: {}, total: 0, night: false };

  /* A tiny deterministic generator: the same archive always builds the same
     town, which matters because a street that rearranges on every render reads
     as a bug. */
  const rng = seed => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  };

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

  /* ── houses ───────────────────────────────────────────────────────
     Three kinds, so a district does not look like one building copied. A
     bungalow is wide and low with a pitched roof; a villa is two volumes and a
     terrace; a tower is the old box, for the busiest districts. */
  function addHouse(THREE, group, options) {
    const { x, z, height, width, depth, colour, kind, rotation, district, count } = options;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshLambertMaterial({ color: colour })
    );
    body.position.set(x, height / 2, z);
    body.rotation.y = rotation;
    body.userData.district = district;
    body.userData.count = count;
    group.add(body);
    group.userData.pickables.push(body);

    if (kind === 'bungalow') {
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(width, depth) * 0.78, height * 0.55, 4),
        new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.05, -0.12) })
      );
      roof.position.set(x, height + height * 0.26, z);
      roof.rotation.y = rotation + Math.PI / 4;
      group.add(roof);
    } else if (kind === 'villa') {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.6, height * 0.55, depth * 0.9),
        new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.04, 0.08) })
      );
      wing.position.set(x + width * 0.5, height * 0.275, z);
      wing.rotation.y = rotation;
      group.add(wing);
      const terrace = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.05, 0.08, depth * 1.05),
        new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.06, 0.14) })
      );
      terrace.position.set(x, height + 0.05, z);
      terrace.rotation.y = rotation;
      group.add(terrace);
    } else {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.04, 0.08, depth * 1.04),
        new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, -0.06, 0.12) })
      );
      cap.position.set(x, height + 0.04, z);
      cap.rotation.y = rotation;
      group.add(cap);
    }

    if (height > 2.2) {
      const rows = Math.max(1, Math.floor(height / 1.1));
      for (let r = 0; r < rows; r += 1) {
        const light = new THREE.Mesh(
          new THREE.PlaneGeometry(width * 0.55, 0.1),
          new THREE.MeshBasicMaterial({ color: 0xfff0cc, transparent: true, opacity: 0.75 })
        );
        light.position.set(
          x + Math.sin(rotation) * (depth / 2 + 0.01),
          0.9 + r * 1.05,
          z + Math.cos(rotation) * (depth / 2 + 0.01)
        );
        light.rotation.y = rotation;
        group.add(light);
      }
    }
  }

  function buildCity(THREE, counts) {
    const group = new THREE.Group();
    group.userData.pickables = [];
    const entries = Object.entries(counts).filter(([, n]) => n);
    if (!entries.length) return group;

    const cap = n => Math.min(n, n > 150 ? 96 : 48);
    const wantedCount = entries.reduce((sum, [, n]) => sum + cap(n), 0);

    /* a grid of slots with jitter, growing outward in rings */
    const slots = [];
    for (let ring = 0; ring < 14 && slots.length < wantedCount; ring += 1) {
      const radius = ring * 3.1;
      const count = ring === 0 ? 1 : Math.round(ring * 6.5);
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + ring * 0.45;
        const wobble = ((i * 37) % 11) / 11 - 0.5;
        slots.push([Math.cos(angle) * (radius + wobble * 0.6), Math.sin(angle) * (radius + wobble * 0.6)]);
      }
    }

    const random = rng(entries.reduce((sum, [, n]) => sum + n, 0) + 17);
    let slot = 0;

    for (const [key, count] of entries) {
      const colour = new THREE.Color(palette[key] || '#9aa79a');
      const shown = cap(count);
      for (let i = 0; i < shown; i += 1) {
        const [x, z] = slots[slot % slots.length];
        slot += 1;
        const busy = Math.min(count, 24);
        /* which kind of house: the quieter the district, the more bungalows */
        const roll = random();
        const kind = busy > 14 ? (roll < 0.62 ? 'tower' : roll < 0.85 ? 'villa' : 'bungalow')
          : busy > 6 ? (roll < 0.3 ? 'tower' : roll < 0.7 ? 'villa' : 'bungalow')
            : (roll < 0.15 ? 'tower' : roll < 0.5 ? 'villa' : 'bungalow');
        const height = kind === 'bungalow' ? 0.9 + random() * 0.5
          : kind === 'villa' ? 1.5 + random() * 1.1
            : 2.2 + busy * 0.22 + random() * 0.9;
        addHouse(THREE, group, {
          x, z,
          height,
          width: kind === 'bungalow' ? 1.25 + random() * 0.5 : 0.85 + random() * 0.35,
          depth: kind === 'bungalow' ? 1.15 + random() * 0.45 : 0.85 + random() * 0.35,
          colour,
          kind,
          rotation: random() * Math.PI,
          district: key,
          count
        });
      }
    }
    return group;
  }

  /* ── the landscape ────────────────────────────────────────────────
     Mountains on the horizon, a river cutting through, a pond with fish, and
     trees around the edge. All of it static except the fish. */
  function buildLandscape(THREE, spread) {
    const group = new THREE.Group();

    /* mountains: two ridges of low-poly cones, further and paler */
    for (let ridge = 0; ridge < 2; ridge += 1) {
      const distance = spread * 1.8 + 30 + ridge * 26;
      const colour = new THREE.Color(ridge ? 0x93a89a : 0x7d948a);
      const random = rng(ridge + 5);
      /* Two or three peaks per bearing, squashed on one axis and overlapping,
         so a ridge reads as a range rather than a ring of cones. */
      for (let i = 0; i < 10; i += 1) {
        const bearing = (i / 10) * Math.PI * 2 + ridge * 0.31;
        const peaks = ridge === 0 ? 3 : 2;
        for (let k = 0; k < peaks; k += 1) {
          const angle = bearing + (k - 1) * 0.11;
          const spreadOut = distance + (random() - 0.5) * 18;
          const height = (4 + random() * 5 + ridge * 2) * (k === 1 ? 1.25 : 0.85);
          const peak = new THREE.Mesh(
            new THREE.ConeGeometry(5 + random() * 5, height, 6),
            new THREE.MeshLambertMaterial({ color: colour.clone().offsetHSL(0, 0, (random() - 0.5) * 0.06) })
          );
          peak.position.set(Math.cos(angle) * spreadOut, height / 2 - 0.6, Math.sin(angle) * spreadOut);
          peak.rotation.y = random() * Math.PI;
          peak.scale.set(1, 1, 0.7 + random() * 0.7);
          group.add(peak);
          if (ridge === 0 && height > 8) {
            const cap = new THREE.Mesh(
              new THREE.ConeGeometry(1.4, height * 0.2, 6),
              new THREE.MeshLambertMaterial({ color: 0xf2f4ee })
            );
            cap.position.set(peak.position.x, height - height * 0.08, peak.position.z);
            cap.rotation.y = peak.rotation.y;
            cap.scale.set(1, 1, peak.scale.z);
            group.add(cap);
          }
        }
      }
    }

    /* a river: a long band curving past the town */
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-spread * 3.2, 0.02, spread * 1.5),
      new THREE.Vector3(-spread * 0.8, 0.02, spread * 2.1),
      new THREE.Vector3(spread * 1.2, 0.02, spread * 1.9),
      new THREE.Vector3(spread * 3.2, 0.02, spread * 1.2)
    ]);
    const river = new THREE.Mesh(
      new THREE.TubeGeometry(riverCurve, 40, 1.5, 8, false),
      new THREE.MeshLambertMaterial({ color: 0x6f9db0, transparent: true, opacity: 0.92 })
    );
    river.scale.set(1, 0.02, 1);
    river.position.y = 0.03;
    group.add(river);

    /* a pond, with fish under a translucent surface */
    const pondX = -spread * 1.5;
    const pondZ = -spread * 1.25;
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(spread * 0.24, 32),
      new THREE.MeshLambertMaterial({ color: 0x7aa8b8, transparent: true, opacity: 0.85 })
    );
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(pondX, 0.04, pondZ);
    group.add(pond);

    const fish = new THREE.Group();
    const fishMat = new THREE.MeshLambertMaterial({ color: 0xd98f5c });
    for (let i = 0; i < 7; i += 1) {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 5), fishMat);
      body.rotation.z = Math.PI / 2;
      body.position.set(0, 0.12, 0);
      fish.add(body);
    }
    fish.position.set(pondX, 0.05, pondZ);
    group.add(fish);
    group.userData.fish = { group: fish, radius: spread * 0.16, centre: { x: pondX, z: pondZ } };

    /* trees around the edge, denser than before */
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7d6247 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x6f8f6a });
    const random = rng(31);
    const treeCount = Math.min(90, Math.max(20, Math.round(spread * 2.2)));
    for (let i = 0; i < treeCount; i += 1) {
      const angle = (i / treeCount) * Math.PI * 2 + random() * 0.2;
      const radius = spread + 1.6 + random() * 5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 6), trunkMat);
      stem.position.set(x, 0.3, z);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.34 + random() * 0.12, 0.9 + random() * 0.4, 7), leafMat);
      crown.position.set(x, 1.0, z);
      group.add(stem, crown);
    }
    return group;
  }

  /* ── traffic, people, trains, planes ──────────────────────────────
     Each of these keeps a little state so the animation can move it: the tick
     loop reads `userData.motion` and does one line per prop. */
  function buildLife(THREE, spread, total) {
    const group = new THREE.Group();
    const random = rng(total + 91);
    const road = spread * 0.9;

    /* roads: two crossing strips with a dashed centre line */
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x6d6f68 });
    for (const rotation of [0, Math.PI / 2]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(road * 2.6, 2.2), roadMat);
      strip.rotation.x = -Math.PI / 2;
      strip.rotation.z = rotation;
      strip.position.y = 0.02;
      group.add(strip);
    }

    /* a rail line at the back, with a train that runs along it */
    const rail = new THREE.Mesh(
      new THREE.PlaneGeometry(road * 3, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x55564f })
    );
    rail.rotation.x = -Math.PI / 2;
    rail.position.set(0, 0.02, -spread * 1.35);
    group.add(rail);

    const train = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const carriage = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.9, 0.8),
        new THREE.MeshLambertMaterial({ color: i === 0 ? 0x8a5a4a : 0xa8846a })
      );
      carriage.position.set(i * 2.6 - 5, 0.55, 0);
      train.add(carriage);
      const window_ = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.28),
        new THREE.MeshBasicMaterial({ color: 0xffe9b8 })
      );
      window_.position.set(i * 2.6 - 5, 0.7, 0.41);
      train.add(window_);
    }
    train.position.set(0, 0, -spread * 1.35);
    train.userData.motion = { kind: 'train', span: road * 1.5, speed: 0.06 };
    group.add(train);

    /* vehicles: cars, a bus, two-wheelers */
    const vehicleCount = Math.min(14, Math.max(3, Math.round(total / 40)));
    for (let i = 0; i < vehicleCount; i += 1) {
      const isBus = i % 5 === 0;
      const isBike = i % 4 === 3;
      const colour = new THREE.Color(CAR_COLOUR[i % CAR_COLOUR.length]);
      const vehicle = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(isBus ? 2.4 : isBike ? 0.42 : 1.1, isBus ? 0.85 : isBike ? 0.3 : 0.42, isBus ? 0.9 : isBike ? 0.3 : 0.55),
        new THREE.MeshLambertMaterial({ color: colour })
      );
      body.position.y = isBus ? 0.6 : isBike ? 0.45 : 0.34;
      vehicle.add(body);
      if (!isBike) {
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(isBus ? 2.1 : 0.6, isBus ? 0.35 : 0.26, isBus ? 0.82 : 0.5),
          new THREE.MeshLambertMaterial({ color: 0xdfe7e2 })
        );
        cabin.position.y = isBus ? 1.15 : 0.62;
        vehicle.add(cabin);
      } else {
        const rider = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6), new THREE.MeshLambertMaterial({ color: CLOTH[i % CLOTH.length] }));
        rider.position.y = 0.78;
        vehicle.add(rider);
      }
      const alongZ = i % 2 === 0;
      const offset = (random() - 0.5) * spread * 1.2;
      vehicle.position.set(alongZ ? offset : (i % 4 === 0 ? -road : road) * 0.5, 0, alongZ ? (i % 4 === 0 ? -road : road) * 0.5 : offset);
      vehicle.rotation.y = alongZ ? 0 : Math.PI / 2;
      vehicle.userData.motion = {
        kind: 'vehicle',
        axis: alongZ ? 'x' : 'z',
        span: spread * 1.3,
        speed: (isBike ? 0.05 : isBus ? 0.03 : 0.04) * (i % 2 === 0 ? 1 : -1),
        fixed: alongZ ? vehicle.position.z : vehicle.position.x
      };
      group.add(vehicle);
    }

    /* people: adults and children, in small groups, walking the plaza */
    const peopleCount = Math.min(40, Math.max(6, Math.round(total / 12)));
    for (let i = 0; i < peopleCount; i += 1) {
      const child = i % 4 === 3;
      const person = new THREE.Group();
      const scale = child ? 0.62 : 1;
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11 * scale, 0.14 * scale, 0.42 * scale, 6),
        new THREE.MeshLambertMaterial({ color: CLOTH[i % CLOTH.length] })
      );
      torso.position.y = 0.21 * scale;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 * scale, 8, 6),
        new THREE.MeshLambertMaterial({ color: SKIN[i % SKIN.length] })
      );
      head.position.y = 0.5 * scale;
      person.add(torso, head);
      const radius = spread * (0.25 + random() * 0.6);
      const angle = random() * Math.PI * 2;
      person.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      person.userData.motion = {
        kind: 'person',
        radius,
        angle,
        speed: (0.0016 + random() * 0.0018) * (i % 2 ? 1 : -1),
        bob: random() * Math.PI * 2
      };
      group.add(person);
    }

    /* a plane, crossing high and slow */
    const plane = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 2.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xe8ece6 })
    );
    hull.rotation.z = Math.PI / 2;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 2.6), new THREE.MeshLambertMaterial({ color: 0xdfe4de }));
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.6), new THREE.MeshLambertMaterial({ color: 0xdfe4de }));
    tail.position.set(-0.9, 0.12, 0);
    plane.add(hull, wing, tail);
    plane.position.set(-spread * 1.8, spread * 1.2 + 14, -spread * 0.8);
    plane.userData.motion = { kind: 'plane', span: spread * 2.6, speed: 0.02 };
    group.add(plane);

    return group;
  }

  /* ── clouds, for the zoomed-out view ─────────────────────────────
     Flat billboards at altitude. They fade in as the camera pulls back, so the
     zoom out ends in weather rather than in empty grass. */
  function buildClouds(THREE, spread) {
    const group = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const random = rng(77);
    for (let i = 0; i < 18; i += 1) {
      const puff = new THREE.Mesh(
        new THREE.PlaneGeometry(14 + random() * 16, 6 + random() * 6),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false })
      );
      const angle = random() * Math.PI * 2;
      const radius = spread * (1.1 + random() * 1.4);
      puff.position.set(Math.cos(angle) * radius, 26 + random() * 20, Math.sin(angle) * radius);
      puff.userData.drift = 0.004 + random() * 0.008;
      group.add(puff);
    }
    return group;
  }

  function build(THREE, viewport) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xdfe9e4, 40, 140);

    const camera = new THREE.OrthographicCamera(-11, 11, 11, -11, -3000, 6000);
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
      new THREE.PlaneGeometry(1600, 900),
      new THREE.MeshBasicMaterial({ map: skyTexture })
    );
    backdrop.position.set(0, 120, -420);
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
    const landscape = new THREE.Group();
    const life = new THREE.Group();
    const clouds = new THREE.Group();
    scene.add(cityGroup, landscape, life, clouds);

    viewport.appendChild(renderer.domElement);
    renderer.domElement.className = 'city-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const instance = {
      renderer, scene, camera, cityGroup, landscape, life, clouds, sun, sky, birds, backdrop,
      frame: 0, t: 0, baseView: 11, zoom: 1, pan: { x: 0, z: 0 }, cloudPuffs: []
    };

    function applyFrustum() {
      const view = instance.baseView * instance.zoom;
      const a = Math.max(0.5, viewport.clientWidth / Math.max(1, viewport.clientHeight));
      camera.left = -view * a;
      camera.right = view * a;
      camera.top = view;
      camera.bottom = -view;
      camera.updateProjectionMatrix();
      camera.position.x = instance.pan.x;
      camera.position.z = 24 + instance.pan.z;
      camera.position.y = 10.5 + instance.baseView * 0.18;
      camera.lookAt(instance.pan.x, 3.2, instance.pan.z * 0.55);

      const scale = Math.max(1, view / 11);
      ground.scale.setScalar(scale);
      backdrop.position.set(instance.pan.x, 120 * scale, -420 * scale);
      scene.fog.near = 30 * scale;
      scene.fog.far = 150 * scale;

      /* the clouds arrive as the map pulls back: below 1.6× they are invisible */
      const cloudOpacity = Math.min(0.85, Math.max(0, (instance.zoom - 1.4) / 2.2));
      for (const puff of instance.cloudPuffs) puff.material.opacity = cloudOpacity * 0.8;
      clouds.visible = cloudOpacity > 0.02;
      /* and the town's own ground fades to haze so the horizon reads */
      ground.material.color.setHex(state.night ? 0x33453c : 0xffffff);
    }

    function fitTo(group) {
      let radius = 0;
      for (const child of group.children) {
        if (!child.userData || !child.userData.district) continue;
        radius = Math.max(radius, Math.hypot(child.position.x, child.position.z));
      }
      instance.baseView = Math.max(10, radius * 1.2 + 3);
      instance.zoom = 1;
      instance.pan.x = 0;
      instance.pan.z = 0;
      applyFrustum();
    }

    instance.setData = next => {
      /* A re-render must not throw away the view: the counts change when the
         archive does, not when the app repaints. Keep the zoom and the pan
         unless the town has actually grown or shrunk. */
      const previousView = instance.baseView;
      const previousZoom = instance.zoom;
      const previousPan = { ...instance.pan };
      state = { ...state, ...next };
      cityGroup.clear();
      landscape.clear();
      life.clear();
      clouds.clear();

      const city = buildCity(THREE, state.counts);
      cityGroup.add(city);

      let spread = 12;
      for (const child of city.children) {
        if (child.userData && child.userData.district) {
          spread = Math.max(spread, Math.hypot(child.position.x, child.position.z));
        }
      }
      landscape.add(buildLandscape(THREE, spread + 1.5));
      life.add(buildLife(THREE, spread + 2, state.total || 0));
      const puffs = buildClouds(THREE, spread + 1.5);
      instance.cloudPuffs = puffs.children.slice();
      clouds.add(puffs);
      fitTo(city);
      if (Math.abs(instance.baseView - previousView) < 0.6) {
        instance.baseView = previousView;
        instance.zoom = previousZoom;
        instance.pan = previousPan;
        applyFrustum();
      }
    };

    instance.setNight = night => {
      state.night = night;
      const bg = night ? 0x121a1d : 0xdfe9e4;
      scene.fog.color.setHex(bg);
      sky.intensity = night ? 0.35 : 0.85;
      sun.intensity = night ? 0.25 : 0.95;
      sun.color.setHex(night ? 0x9fb6d8 : 0xfff2d8);
      backdrop.material.color.setHex(night ? 0x2a3a44 : 0xffffff);
      ground.material.color.setHex(night ? 0x33453c : 0xffffff);
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
      instance.zoom = Math.max(0.35, Math.min(6, instance.zoom * factor));
      applyFrustum();
    }, { passive: false });

    renderer.domElement.addEventListener('dblclick', () => { instance.setData(state); });

    renderer.domElement.style.cursor = 'grab';
    instance.applyFrustum = applyFrustum;
    instance.debugPick = (clientX, clientY) => {
      const object = pick({ clientX, clientY });
      const pickables = cityGroup.children[0]?.userData?.pickables || [];
      return { pickables: pickables.length, hit: object ? object.userData : null, zoom: instance.zoom };
    };
    window.__scene3d = instance;
    return instance;
  }

  function start() {
    const viewport = document.querySelector('#city-viewport');
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
    const { renderer, scene, camera, sun, birds, life, clouds } = scene3d;

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

    for (const child of life.children) {
      const motion = child.userData && child.userData.motion;
      if (!motion) continue;
      if (motion.kind === 'person') {
        motion.angle += motion.speed;
        child.position.x = Math.cos(motion.angle) * motion.radius;
        child.position.z = Math.sin(motion.angle) * motion.radius;
        child.position.y = Math.abs(Math.sin(scene3d.t * 6 + motion.bob)) * 0.05;
        child.rotation.y = -motion.angle;
      } else if (motion.kind === 'vehicle') {
        if (motion.axis === 'x') {
          child.position.x += motion.speed;
          if (child.position.x > motion.span) child.position.x = -motion.span;
          if (child.position.x < -motion.span) child.position.x = motion.span;
        } else {
          child.position.z += motion.speed;
          if (child.position.z > motion.span) child.position.z = -motion.span;
          if (child.position.z < -motion.span) child.position.z = motion.span;
        }
      } else if (motion.kind === 'train') {
        child.position.x += motion.speed;
        if (child.position.x > motion.span) child.position.x = -motion.span;
      } else if (motion.kind === 'plane') {
        child.position.x += motion.speed;
        if (child.position.x > motion.span) child.position.x = -motion.span;
      }
    }

    /* fish circle the pond; clouds drift */
    const fish = scene3d.landscape.children[0]?.userData?.fish;
    if (fish) {
      fish.group.children.forEach((one, i) => {
        const angle = scene3d.t * (0.6 + i * 0.08) + i;
        one.position.set(Math.cos(angle) * fish.radius * (0.4 + (i % 3) * 0.2), 0.12, Math.sin(angle) * fish.radius * (0.4 + (i % 3) * 0.2));
        one.rotation.y = -angle;
      });
    }
    for (const puff of scene3d.cloudPuffs || []) {
      puff.position.x += puff.userData.drift;
      if (puff.position.x > 200) puff.position.x = -200;
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    if (!scene3d) return;
    const viewport = document.querySelector('#city-viewport');
    if (!viewport) return;
    scene3d.renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
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
