/* Cobble landing page — the skyline is drawn from a seed, not an image. */
(() => {
  const districts = {
    everyday: { label: 'Everyday detail', colour: '#b59a79' },
    people: { label: 'People & connection', colour: '#cb8e79' },
    nature: { label: 'Outside & nature', colour: '#82a58a' },
    ideas: { label: 'Thoughts & ideas', colour: '#8699b8' },
    joy: { label: 'Small joys', colour: '#d5aa64' },
    milestone: { label: 'Something meaningful', colour: '#aa86a0' }
  };
  const keys = Object.keys(districts);

  /* deterministic pseudo-random so the hero looks the same on every visit */
  const makeRandom = seed => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const buildBlock = (districtKey, { height, width, roof, count }) => {
    const block = document.createElement('div');
    block.className = 'block';
    block.style.setProperty('--c', districts[districtKey].colour);
    block.style.setProperty('--h', `${height}px`);
    block.style.setProperty('--w', `${width}px`);
    if (roof) block.dataset.roof = 'point';
    const tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = `${districts[districtKey].label} · ${count} ${count === 1 ? 'moment' : 'moments'}`;
    block.appendChild(tip);
    return block;
  };

  /* ── hero skyline ──────────────────────────────────────── */
  const skyline = document.getElementById('skyline');
  const blocks = document.getElementById('blocks');
  if (skyline && blocks) {
    const random = makeRandom(20261118);
    const plan = [0, 2, 4, 1, 3, 5, 0, 2, 1, 4, 3, 0, 2, 5, 1];
    let total = 0;
    const fragment = document.createDocumentFragment();
    plan.forEach((index, position) => {
      const key = keys[index];
      const count = 1 + Math.floor(random() * 4);
      total += count;
      fragment.appendChild(buildBlock(key, {
        height: 46 + Math.floor(random() * 148),
        width: 22 + Math.floor(random() * 26),
        roof: random() > 0.66,
        count
      }));
    });
    blocks.appendChild(fragment);
    const counter = document.getElementById('stage-count');
    if (counter) counter.textContent = total.toLocaleString();
    requestAnimationFrame(() => skyline.classList.add('is-ready'));
  }

  /* ── the grow demo ─────────────────────────────────────── */
  const growStage = document.getElementById('grow-blocks');
  const growTotal = document.getElementById('grow-total');
  const growReset = document.getElementById('grow-reset');
  let grown = 0;
  const growRandom = makeRandom(7);

  const renderEmpty = () => {
    if (!growStage) return;
    if (!grown) {
      growStage.innerHTML = '<span class="empty">nothing built yet — pick a district</span>';
    }
  };

  document.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => {
      if (!growStage) return;
      const key = button.dataset.add;
      if (!districts[key]) return;
      if (!grown) growStage.innerHTML = '';
      if (grown >= 14) {
        growStage.firstElementChild?.remove();
      } else {
        grown += 1;
      }
      const block = buildBlock(key, {
        height: 34 + Math.floor(growRandom() * 120),
        width: 20 + Math.floor(growRandom() * 22),
        roof: growRandom() > 0.6,
        count: 1
      });
      growStage.appendChild(block);
      if (growTotal) growTotal.textContent = String(grown);
    });
  });

  growReset?.addEventListener('click', () => {
    grown = 0;
    if (growStage) growStage.innerHTML = '';
    if (growTotal) growTotal.textContent = '0';
    renderEmpty();
  });
  renderEmpty();

  /* ── day / night ───────────────────────────────────────── */
  const timeToggle = document.getElementById('time-toggle');
  const applyTime = night => {
    document.documentElement.dataset.time = night ? 'night' : 'day';
    const icon = timeToggle?.querySelector('.time-icon');
    const label = timeToggle?.querySelector('.time-label');
    if (icon) icon.textContent = night ? '☾' : '☀';
    if (label) label.textContent = night ? 'Day' : 'Night';
    timeToggle?.setAttribute('aria-pressed', String(night));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#10171a' : '#f6f4ef');
  };
  timeToggle?.addEventListener('click', () => {
    applyTime(document.documentElement.dataset.time !== 'night');
  });

  /* ── copy the UPI id ───────────────────────────────────── */
  const copyButton = document.getElementById('copy-upi');
  copyButton?.addEventListener('click', async () => {
    const id = document.getElementById('upi-id')?.textContent?.trim() || 'drsohilboi@ybl';
    try {
      await navigator.clipboard.writeText(id);
      copyButton.textContent = 'copied';
    } catch {
      copyButton.textContent = id;
    }
    setTimeout(() => { copyButton.textContent = 'copy'; }, 1800);
  });

  /* ── scroll reveal ─────────────────────────────────────── */
  const targets = document.querySelectorAll('.section-head, .rule-card, .district, .shot, .grow-demo, .privacy-card, .support');
  if ('IntersectionObserver' in window) {
    targets.forEach(node => node.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(node => observer.observe(node));
  }
})();
