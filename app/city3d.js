/* Optional WebGL city layer. The illustrated CSS city remains available if WebGL/CDN is unavailable. */
(() => {
  /* Experimental, and off by default.
   *
   * The WebGL layer renders a white floor and floats its buildings above it on
   * the machines this was tested on. Until that is fixed it is behind a flag,
   * so the illustrated CSS city is what everyone sees:
   *
   *     app/?3d=1     or     app/#3d
   *
   * The camera below already corrects the aspect ratio, which the original
   * did not; the floor and lighting are still unresolved. See ENHANCEMENTS.md.
   */
  const wanted = /[?&]3d=1(&|$)/.test(location.search) || location.hash.includes('3d');
  if (!wanted) return;

  const script = document.createElement('script');
  script.src = 'vendor/three.min.js';
  script.async = true;
  script.onload = () => {
    if (!window.THREE) return;
    try {
      start();
    } catch (error) {
      console.warn('3D city unavailable; using illustrated fallback.', error);
    }
  };
  script.onerror = () => console.info('3D city library unavailable; using illustrated fallback.');
  document.head.appendChild(script);

  function start() {
    const THREE = window.THREE;
    const viewport = document.querySelector('#city-viewport');
    const pan = document.querySelector('#city-pan');
    if (!viewport || !pan || !window.WebGLRenderingContext) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'city-three-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    viewport.appendChild(canvas);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(viewport.clientWidth, viewport.clientHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    const aspect = Math.max(0.6, viewport.clientWidth / Math.max(1, viewport.clientHeight));
    const camera = new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 6.5, -6.5, .1, 160);
    // A higher, pulled-back strategy-game view keeps the whole neighborhood in frame.
    camera.position.set(0, 27, 19);
    camera.lookAt(0, .5, 0);
    const ambient = new THREE.HemisphereLight(0xfff3d9, 0x587361, 0.85);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffedcf, 0.75);
    sun.position.set(-8, 17, 10);
    scene.add(sun);

    const tiles = new Map();
    const moving = [];
    const palette = ['#77928a', '#b27e67', '#778ea0', '#a1829a', '#bd9b62', '#7c9a72', '#d2aa7c'];
    let tileWidth = 16;
    let viewportWidth = 1;
    let activeCounts = {};
    let totalEntries = 0;
    let centerIndex = 0;
    let pixelOffset = 0;
    let night = false;
    let mood = 'serene';
    let lastRender = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const mat = (color, roughness = .88, extra = {}) => new THREE.MeshStandardMaterial({
      color,
      roughness,
      ...extra
    });
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const sphereGeo = new THREE.SphereGeometry(1, 9, 7);
    const coneGeo = new THREE.ConeGeometry(1, 1, 5);
    const groundMat = mat('#78966f');
    const parkMat = mat('#6f986d');
    const pathMat = mat('#c9bd91');
    const roadMat = mat('#485b5a');
    const laneMat = mat('#f1dca6', .8, {
      emissive: '#473c1f',
      emissiveIntensity: .08
    });
    const waterMat = mat('#73a9a8', .35, {
      metalness: .08
    });
    const trunkMat = mat('#795943');
    const windowMat = mat('#ffe3a0', .45, {
      emissive: '#e2a94e',
      emissiveIntensity: .48
    });
    const darkWindowMat = mat('#a9c9c0', .5, {
      emissive: '#425d68',
      emissiveIntensity: .08
    });
    const peopleMat = ['#c8795c', '#445b73', '#d3af65', '#a87f9b'].map(color => mat(color));
    const wheelMat = mat('#273b3c');
    const sharedMaterials = new Set([
      groundMat, parkMat, pathMat, roadMat, laneMat, waterMat, trunkMat,
      windowMat, darkWindowMat, wheelMat, ...peopleMat
    ]);
    const moodLight = {
      serene: { ambient: 1.55, sun: 2.05, exposure: 1.0, tint: '#fff3df' },
      curious: { ambient: 1.7, sun: 2.15, exposure: 1.04, tint: '#fff2d7' },
      dreamy: { ambient: 1.8, sun: 1.65, exposure: 1.06, tint: '#d9dcff' },
      festive: { ambient: 1.75, sun: 2.2, exposure: 1.08, tint: '#ffe2b3' },
      tranquil: { ambient: 1.45, sun: 1.7, exposure: .98, tint: '#d9f0e8' }
    };
    const themeLight = {
      meadow: '#fff3df', coastal: '#d8edff', amber: '#ffe1bf',
      lavender: '#e8ddff', midnight: '#c2d2ff'
    };
    const targetAmbientColor = new THREE.Color('#fff3df');
    const targetSunColor = new THREE.Color('#ffedcf');
    let targetAmbientIntensity = 1.55;
    let targetSunIntensity = 2.05;
    let targetExposure = 1;
    let targetWindowGlow = .48;
    let targetDarkWindowGlow = .02;

    function seeded(seed) {
      let state = (Math.abs(seed * 2654435761) + 0x9e3779b9) >>> 0;
      return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
      };
    }

    function addBox(parent, width, height, depth, material, x, y, z) {
      const mesh = new THREE.Mesh(boxGeo, material);
      mesh.scale.set(width, height, depth);
      mesh.position.set(x, y + height / 2, z);
      parent.add(mesh);
      return mesh;
    }

    function addTree(parent, x, z, scale = 1) {
      addBox(parent, .15 * scale, .52 * scale, .15 * scale, trunkMat, x, .03, z);
      const crown = new THREE.Mesh(sphereGeo, mat(['#759969', '#89a46e', '#658e78'][Math.floor(Math.random() * 3)]));
      crown.scale.set(.48 * scale, .5 * scale, .46 * scale);
      crown.position.set(x, .68 * scale, z);
      parent.add(crown);
    }

    function makeBuilding(parent, x, z, width, height, depth, color, random, style) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      parent.add(group);
      const bodyMat = mat(color);
      const trimMat = mat(new THREE.Color(color).lerp(new THREE.Color('#f8e5c6'), .28));
      const sideMat = mat(new THREE.Color(color).lerp(new THREE.Color('#263a3c'), .28));
      addBox(group, width, height, depth, bodyMat, 0, 0, 0);
      // Shaded side and roof give each block a miniature isometric-game silhouette.
      addBox(group, width * .25, height, depth * .12, sideMat, width * .38, 0, depth * .53);
      if (style === 0) {
        const roof = new THREE.Mesh(coneGeo, trimMat);
        roof.scale.set(width * .72, Math.min(1.05, width * .34), depth * .72);
        roof.position.set(0, height + .42, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
      } else if (style === 1) {
        addBox(group, width + .16, .16, depth + .15, trimMat, 0, height, 0);
        addBox(group, width * .28, .38, depth * .28, sideMat, 0, height + .16, -.04);
      } else {
        addBox(group, width + .1, .12, depth + .1, trimMat, 0, height, 0);
      }
      const columns = Math.max(1, Math.floor(width / .42));
      const rows = Math.max(1, Math.floor((height - .45) / .58));
      const paneWidth = Math.min(.19, width / (columns * 2.4));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const lit = night || random() > .6;
          const pane = new THREE.Mesh(boxGeo, lit ? windowMat : darkWindowMat);
          pane.scale.set(paneWidth, .24, .045);
          pane.position.set((col - (columns - 1) / 2) * (width / (columns + .25)), .45 + row * .56, depth / 2 + .035);
          group.add(pane);
        }
      }
      addBox(group, .22, .43, .05, mat('#534a43'), 0, .02, depth / 2 + .04);
      // A soft ground shadow, made from a flattened transparent oval.
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({
        color: '#263a36',
        transparent: true,
        opacity: .18,
        depthWrite: false
      }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(width * .76, depth * .68, 1);
      shadow.position.set(0, .025, .1);
      group.add(shadow);
    }

    function makeTile(index) {
      const root = new THREE.Group();
      root.position.x = index * tileWidth;
      root.userData.districtIndex = index;
      const random = seeded(index + totalEntries * 13 + Object.values(activeCounts).reduce((sum, n) => sum + n, 0));
      const floor = new THREE.Mesh(new THREE.BoxGeometry(tileWidth, .34, 13), groundMat);
      floor.position.set(tileWidth / 2, -.18, -1.5);
      root.add(floor);
      // A curving, foreground boulevard anchors the isometric streetscape.
      const road = new THREE.Mesh(new THREE.BoxGeometry(tileWidth * 1.02, .09, 2.35), roadMat);
      road.position.set(tileWidth / 2, .015, 3.15);
      root.add(road);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(tileWidth * .9, .025, .055), laneMat);
      stripe.position.set(tileWidth / 2, .075, 3.15);
      root.add(stripe);
      const kinds = ['everyday', 'people', 'nature', 'ideas', 'joy', 'milestone'].filter(key => activeCounts[key]);
      const buildCount = totalEntries ? 3 + Math.floor(random() * 3) : 1;
      for (let i = 0; i < buildCount; i++) {
        const category = kinds.length ? kinds[Math.floor(random() * kinds.length)] : 'everyday';
        const width = tileWidth * (.075 + random() * .045);
        const height = 1.35 + random() * (1.2 + Math.min(2, (activeCounts[category] || 0) * .08));
        const x = tileWidth * (.12 + i * (.76 / Math.max(buildCount - 1, 1))) + (random() - .5) * tileWidth * .08;
        const z = -.8 - random() * 3.6;
        const color = palette[(Math.floor(random() * palette.length) + Math.max(0, kinds.indexOf(category))) % palette.length];
        makeBuilding(root, x, z, width, height, .75 + random() * .45, color, random, Math.floor(random() * 3));
      }
      // Every neighborhood has a different green space, waterside, or small plaza.
      const feature = Math.abs(index % 4);
      if (feature === 0 || feature === 2) {
        const park = new THREE.Mesh(new THREE.CylinderGeometry(tileWidth * .18, tileWidth * .22, .12, 20), parkMat);
        park.scale.z = .44;
        park.position.set(tileWidth * (feature === 0 ? .18 : .81), .04, .2);
        root.add(park);
        addTree(root, tileWidth * (feature === 0 ? .14 : .77), -.03, .85);
        addTree(root, tileWidth * (feature === 0 ? .23 : .87), .12, .68);
        const path = new THREE.Mesh(new THREE.BoxGeometry(tileWidth * .2, .025, .17), pathMat);
        path.position.set(tileWidth * (feature === 0 ? .18 : .81), .11, .2);
        root.add(path);
      } else if (feature === 1) {
        const water = new THREE.Mesh(new THREE.BoxGeometry(tileWidth * .27, .08, 1.7), waterMat);
        water.position.set(tileWidth * .15, .08, -.55);
        root.add(water);
        addTree(root, tileWidth * .37, .18, .8);
      } else {
        const plaza = new THREE.Mesh(new THREE.CylinderGeometry(tileWidth * .18, tileWidth * .2, .12, 6), pathMat);
        plaza.scale.z = .54;
        plaza.position.set(tileWidth * .5, .05, -.05);
        root.add(plaza);
        const fountain = new THREE.Mesh(new THREE.CylinderGeometry(.3, .4, .3, 8), waterMat);
        fountain.position.set(tileWidth * .5, .24, -.05);
        root.add(fountain);
      }
      // A few varied trees and shrubs soften the block edges.
      for (let i = 0; i < 3; i++) addTree(root, tileWidth * (.07 + random() * .86), -4.2 + random() * 1.5, .45 + random() * .38);
      // Small cars move along the road, but remain attached to this district as it wraps.
      for (let i = 0; i < 2; i++) {
        const car = new THREE.Group();
        const bodyColor = mat(i ? '#d7b26e' : '#cf8169');
        addBox(car, .95, .3, .48, bodyColor, 0, .1, 0);
        addBox(car, .47, .23, .4, mat('#b9d4cf'), 0, .4, 0);
        for (const side of [-1, 1])
          for (const front of [-1, 1]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .09, 8), wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(front * .29, .1, side * .24);
            car.add(wheel);
          }
        car.position.set(random() * tileWidth, .08, 3.15 + (i ? .48 : -.48));
        car.userData = {
          baseX: car.position.x,
          speed: (i ? -1 : 1) * (.55 + random() * .45),
          span: tileWidth
        };
        root.add(car);
        moving.push(car);
      }
      // Tiny walkers add life without crowding the buildings.
      const walker = new THREE.Group();
      const person = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, .48, 7), peopleMat[Math.floor(random() * peopleMat.length)]);
      person.position.y = .28;
      walker.add(person);
      const head = new THREE.Mesh(sphereGeo, mat('#d8ae88'));
      head.scale.set(.12, .12, .12);
      head.position.y = .59;
      walker.add(head);
      walker.position.set(tileWidth * (.4 + random() * .35), .03, 1.75);
      walker.userData.walker = true;
      root.add(walker);
      moving.push(walker);
      scene.add(root);
      tiles.set(index, root);
    }

    function rebuild() {
      for (const [index, group] of tiles) {
        scene.remove(group);
        const disposedMaterials = new Set();
        group.traverse(object => {
          if (object.geometry !== boxGeo && object.geometry !== sphereGeo && object.geometry !== coneGeo) object.geometry?.dispose?.();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach(material => {
            if (!sharedMaterials.has(material) && !disposedMaterials.has(material)) {
              material.dispose();
              disposedMaterials.add(material);
            }
          });
        });
      }
      tiles.clear();
      moving.length = 0;
      for (let index = centerIndex - 3; index <= centerIndex + 3; index++) makeTile(index);
      updateCamera();
    }

    function resize() {
      const width = Math.max(1, viewport.clientWidth);
      const height = Math.max(1, viewport.clientHeight);
      viewportWidth = width;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.25 : 1.6));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      // A larger orthographic frame creates a deliberate zoomed-out, bird's-eye view.
      const halfHeight = 9.2;
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      const nextTileWidth = halfHeight * 2 * aspect;
      if (Math.abs(nextTileWidth - tileWidth) > .01) {
        tileWidth = nextTileWidth;
        rebuild();
      } else updateCamera();
    }

    function updateCamera() {
      camera.position.x = centerIndex * tileWidth - (pixelOffset / viewportWidth) * tileWidth;
      camera.lookAt(camera.position.x, .5, 0);
    }

    function setData(event) {
      activeCounts = event.detail?.counts || {};
      totalEntries = event.detail?.total || 0;
      centerIndex = event.detail?.centerIndex || 0;
      rebuild();
    }
    window.elsewhereCity3D = {
      setData,
      setPan(center, offset, width) {
        centerIndex = center;
        pixelOffset = offset;
        viewportWidth = Math.max(1, width);
        updateCamera();
        const low = center - 3;
        const high = center + 3;
        if (!tiles.has(low) || !tiles.has(high)) rebuild();
      },
      setAtmosphere(state = {}) {
        night = Boolean(state.night);
        mood = state.mood || 'serene';
        const moodStyle = moodLight[mood] || moodLight.serene;
        const themeTint = new THREE.Color(themeLight[state.theme] || themeLight.meadow);
        const moodTint = new THREE.Color(moodStyle.tint);
        targetAmbientColor.copy(themeTint).lerp(moodTint, .58);
        targetSunColor.copy(themeTint).lerp(new THREE.Color('#fff0d4'), .68);
        targetAmbientIntensity = night ? .82 : moodStyle.ambient;
        targetSunIntensity = night ? .62 : moodStyle.sun;
        targetExposure = night ? .94 : moodStyle.exposure;
        targetWindowGlow = night ? 1.45 : .48;
        targetDarkWindowGlow = night ? .32 : .02;
      }
    };
    window.addEventListener('elsewhere-city-data', setData);
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    resize();
    setData({
      detail: {
        counts: {},
        total: 0,
        centerIndex: 0
      }
    });
    const initial = viewport.dataset;
    window.elsewhereCity3D.setAtmosphere({
      mood: initial.mood,
      night: viewport.classList.contains('is-night')
    });
    viewport.classList.add('has-three-city');

    let last = 0;

    function animate(time) {
      requestAnimationFrame(animate);
      if (document.hidden || (time - last < 32)) return;
      const delta = Math.min(.06, (time - last) / 1000 || .033);
      last = time;
      if (!reducedMotion.matches) {
        for (const object of moving) {
          if (object.userData.walker) object.position.x += Math.sin(time * .0012) * delta * .12;
          else object.position.x = ((object.userData.baseX + time * .0001 * object.userData.speed * 100) % tileWidth + tileWidth) % tileWidth;
        }
      }
      // Ease lighting and window glow instead of rebuilding the entire city when a control changes.
      const atmosphereEase = 1 - Math.exp(-delta * 2.8);
      ambient.color.lerp(targetAmbientColor, atmosphereEase);
      sun.color.lerp(targetSunColor, atmosphereEase);
      ambient.intensity += (targetAmbientIntensity - ambient.intensity) * atmosphereEase;
      sun.intensity += (targetSunIntensity - sun.intensity) * atmosphereEase;
      renderer.toneMappingExposure += (targetExposure - renderer.toneMappingExposure) * atmosphereEase;
      windowMat.emissiveIntensity += (targetWindowGlow - windowMat.emissiveIntensity) * atmosphereEase;
      darkWindowMat.emissiveIntensity += (targetDarkWindowGlow - darkWindowMat.emissiveIntensity) * atmosphereEase;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
})();
