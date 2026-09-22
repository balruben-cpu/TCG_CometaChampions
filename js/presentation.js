/**
 * Cometa Champions TCG - Presentation & Showcase Engine
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentMode: 'presentation', // 'presentation' | 'showcase'
    currentSlide: 0,
    totalSlides: 8,
    activeReverso: 'oro',
    catalogFilters: {
      category: 'all',
      clan: 'all',
      search: ''
    },
    audioEnabled: true
  };

  // Theme Management (Day / Night Mode) - Inspired by Apple & Cometa Rivals
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = current === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem('cometa_theme', nextTheme);
    playSound('click');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (theme === 'light') {
      if (icon) icon.textContent = '☀️';
      if (label) label.textContent = 'Day';
    } else {
      if (icon) icon.textContent = '🌙';
      if (label) label.textContent = 'Night';
    }
  }

  // Web Audio Synth for Game FX
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSound(type) {
    if (!state.audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'tear') {
        // Noise buffer for pack tear
        const bufferSize = ctx.sampleRate * 0.35;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'legendary') {
        // Arpeggiated chord
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0, now + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.8);
        });
      }
    } catch (e) {
      console.warn('Audio FX note:', e);
    }
  }

  // DOM Elements
  const presView = document.getElementById('presentation-view');
  const showView = document.getElementById('showcase-view');
  const battleView = document.getElementById('battle-view');
  const btnModePres = document.getElementById('btn-mode-presentation');
  const btnModeShow = document.getElementById('btn-mode-showcase');
  const btnModeBattle = document.getElementById('btn-mode-battle');
  const btnPrevSlide = document.getElementById('btn-prev-slide');
  const btnNextSlide = document.getElementById('btn-next-slide');
  const slideCounter = document.getElementById('slide-counter-text');
  const slideDotsContainer = document.getElementById('slide-dots');
  const cardsGrid = document.getElementById('cards-grid');
  const searchInput = document.getElementById('search-cards-input');
  const reversoSelect = document.getElementById('reverso-select');
  const modalOverlay = document.getElementById('card-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Mode Switching
  function setMode(mode) {
    state.currentMode = mode;
    playSound('click');

    // Hide all views first
    if (presView) presView.style.display = 'none';
    if (showView) showView.style.display = 'none';
    if (battleView) battleView.style.display = 'none';

    if (btnModePres) btnModePres.classList.remove('active');
    if (btnModeShow) btnModeShow.classList.remove('active');
    if (btnModeBattle) btnModeBattle.classList.remove('active');

    if (mode === 'presentation') {
      if (presView) presView.style.display = 'flex';
      if (btnModePres) btnModePres.classList.add('active');
      goToSlide(state.currentSlide);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (mode === 'showcase') {
      if (showView) showView.style.display = 'block';
      if (btnModeShow) btnModeShow.classList.add('active');
      renderCardsCatalog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (mode === 'battle') {
      if (battleView) battleView.style.display = 'block';
      if (btnModeBattle) btnModeBattle.classList.add('active');
      if (window.CometaBattle && window.CometaBattle.start) {
        window.CometaBattle.start();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Slide Engine
  function goToSlide(index) {
    if (index < 0 || index >= state.totalSlides) return;
    state.currentSlide = index;

    const slides = document.querySelectorAll('.slide');
    slides.forEach((s, idx) => {
      if (idx === index) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    // Update Counter
    if (slideCounter) {
      slideCounter.innerHTML = `<span>${index + 1}</span> / ${state.totalSlides}`;
    }

    // Update Nav Buttons
    if (btnPrevSlide) btnPrevSlide.disabled = index === 0;
    if (btnNextSlide) btnNextSlide.disabled = index === state.totalSlides - 1;

    // Update Dots
    if (slideDotsContainer) {
      const dots = slideDotsContainer.querySelectorAll('.slide-dot');
      dots.forEach((d, idx) => {
        if (idx === index) d.classList.add('active');
        else d.classList.remove('active');
      });
    }

    playSound('click');
  }

  function initSlideDots() {
    if (!slideDotsContainer) return;
    slideDotsContainer.innerHTML = '';
    for (let i = 0; i < state.totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = `slide-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(i));
      slideDotsContainer.appendChild(dot);
    }
  }

  // Get active reverso image path
  function getActiveReversoPath() {
    const rev = REVERSOS_INFO.find(r => r.id === state.activeReverso);
    return rev ? rev.file : 'Reverso_Export/reverso_Oro.png';
  }

  // Render Catalog Grid
  function renderCardsCatalog() {
    if (!cardsGrid) return;

    const { category, clan, search } = state.catalogFilters;
    const q = search.trim().toLowerCase();

    const filtered = CARDS_DATABASE.filter(card => {
      // Category filter
      if (category !== 'all' && card.category !== category) return false;
      // Clan filter
      if (clan !== 'all' && card.clan !== clan) return false;
      // Search filter
      if (q) {
        const matchName = card.name.toLowerCase().includes(q);
        const matchClan = card.clan.toLowerCase().includes(q);
        const matchRarity = (card.rarity || '').toLowerCase().includes(q);
        const matchDesc = (card.description || card.effect || card.lore || '').toLowerCase().includes(q);
        if (!matchName && !matchClan && !matchRarity && !matchDesc) return false;
      }
      return true;
    });

    // Update Stats Bar
    const statsBar = document.getElementById('catalog-stats-count');
    if (statsBar) {
      statsBar.innerHTML = `Mostrando <strong>${filtered.length}</strong> de <strong>${CARDS_DATABASE.length}</strong> cartas del Set Base`;
    }

    if (filtered.length === 0) {
      cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">No se encontraron cartas</h3>
          <p style="margin-top: 0.5rem;">Intenta cambiar los filtros de clan o categoría.</p>
        </div>
      `;
      return;
    }

    const reversoPath = getActiveReversoPath();

    cardsGrid.innerHTML = filtered.map(card => {
      const clanData = CLANS_INFO[card.clan] || CLANS_INFO.neutral;
      return `
        <div class="card-item-wrapper" data-card-id="${card.id}">
          <div class="card-container" id="card-elem-${card.id}">
            <div class="card-shine"></div>
            <!-- Face Front -->
            <div class="card-face card-front">
              <img src="${encodeURI(card.image)}" alt="${card.name}" loading="lazy" />
            </div>
            <!-- Face Back -->
            <div class="card-face card-back">
              <img src="${encodeURI(reversoPath)}" alt="Reverso" loading="lazy" />
            </div>
          </div>
          <div class="card-meta">
            <div class="card-title-group">
              <div class="card-item-name" title="${card.name}">${card.name}</div>
              <div class="card-item-sub">
                <span>${clanData.symbol}</span>
                <span>${clanData.name}</span>
                <span>•</span>
                <span>${card.rarity || 'Set Base'}</span>
              </div>
            </div>
            <div class="card-btn-actions">
              <button class="btn-card-action btn-flip" title="Voltear Carta (Ver Reverso)" data-id="${card.id}">
                🔄
              </button>
              <button class="btn-card-action btn-inspect" title="Ver en Detalle" data-id="${card.id}">
                🔍
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach 3D tilt & flip listeners
    attachCardInteractions();
  }

  // 3D Card Tilt and Hover Shimmer
  function attachCardInteractions() {
    const cardContainers = document.querySelectorAll('.card-container');

    cardContainers.forEach(container => {
      container.addEventListener('mousemove', e => {
        if (container.classList.contains('is-flipped')) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        container.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`;
        container.style.setProperty('--shine-x', `${(x / rect.width) * 100}%`);
        container.style.setProperty('--shine-y', `${(y / rect.height) * 100}%`);
      });

      container.addEventListener('mouseleave', () => {
        if (container.classList.contains('is-flipped')) {
          container.style.transform = 'rotateY(180deg)';
        } else {
          container.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        }
      });

      // Click card to open modal
      container.addEventListener('click', e => {
        // Prevent trigger if clicking on something else
        const id = container.id.replace('card-elem-', '');
        openCardModal(id);
      });
    });

    // Flip Buttons
    document.querySelectorAll('.btn-flip').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const container = document.getElementById(`card-elem-${id}`);
        if (container) {
          container.classList.toggle('is-flipped');
          playSound('flip');
        }
      });
    });

    // Inspect Buttons
    document.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openCardModal(id);
      });
    });
  }

  // Modal Card Inspector
  function openCardModal(cardId) {
    const card = CARDS_DATABASE.find(c => c.id === cardId);
    if (!card || !modalOverlay) return;

    const clanData = CLANS_INFO[card.clan] || CLANS_INFO.neutral;
    const reversoPath = getActiveReversoPath();

    document.getElementById('modal-card-front-img').src = encodeURI(card.image);
    document.getElementById('modal-card-back-img').src = encodeURI(reversoPath);
    document.getElementById('modal-card-flipper').classList.remove('is-flipped');

    document.getElementById('modal-card-name').textContent = card.name;
    document.getElementById('modal-card-id').textContent = card.id;

    // Clan Badge
    const clanBadge = document.getElementById('modal-card-clan');
    clanBadge.className = `badge-clan ${card.clan}`;
    clanBadge.innerHTML = `${clanData.symbol} ${clanData.name}`;

    // Category Badge
    document.getElementById('modal-card-category').textContent = card.categoryName;
    document.getElementById('modal-card-rarity').textContent = card.rarity || 'Set Base';

    // Stats Section
    const statsContainer = document.getElementById('modal-card-stats');
    if (card.category === 'champions' || card.category === 'kombat') {
      statsContainer.style.display = 'flex';
      statsContainer.innerHTML = `
        <div class="stat-chip">
          <span class="stat-chip-label">Energía</span>
          <span class="stat-chip-val" style="color: #10b981;">🟢 ${card.cost}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-label">Ataque</span>
          <span class="stat-chip-val" style="color: #ef4444;">⚔️ ${card.attack}</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-label">Defensa</span>
          <span class="stat-chip-val" style="color: #06b6d4;">🛡️ ${card.defense}</span>
        </div>
      `;
    } else if (card.category === 'trompos') {
      statsContainer.style.display = 'flex';
      statsContainer.innerHTML = `
        <div class="stat-chip">
          <span class="stat-chip-label">Energía</span>
          <span class="stat-chip-val" style="color: #10b981;">🟢 ${card.cost}</span>
        </div>
        <div class="stat-chip" style="flex: 2;">
          <span class="stat-chip-label">Tipo de Magia</span>
          <span class="stat-chip-val" style="font-size: 1rem; color: #f59e0b; padding-top: 0.25rem;">🌀 ${card.cardType || 'Objeto'}</span>
        </div>
      `;
    } else if (card.category === 'arenas') {
      statsContainer.style.display = 'flex';
      statsContainer.innerHTML = `
        <div class="stat-chip">
          <span class="stat-chip-label">Costo Invocación</span>
          <span class="stat-chip-val" style="color: #10b981;">🟢 ${card.cost}</span>
        </div>
        <div class="stat-chip" style="flex: 2;">
          <span class="stat-chip-label">Efecto Pasivo</span>
          <span class="stat-chip-val" style="font-size: 1rem; color: #a855f7; padding-top: 0.25rem;">🏛️ Global de Mesa</span>
        </div>
      `;
    }

    // Effect / Ability
    const effectSection = document.getElementById('modal-card-effect-section');
    const effectText = document.getElementById('modal-card-effect');
    const mainDesc = card.effect || card.description || card.lore || '';
    if (mainDesc) {
      effectSection.style.display = 'block';
      effectText.textContent = mainDesc;
    } else {
      effectSection.style.display = 'none';
    }

    // Flavor / Lore Quote
    const flavorSection = document.getElementById('modal-card-flavor-section');
    const flavorText = document.getElementById('modal-card-flavor');
    const subDesc = card.quote || card.realProductFlavor || card.lore || '';
    if (subDesc) {
      flavorSection.style.display = 'block';
      flavorText.textContent = subDesc;
    } else {
      flavorSection.style.display = 'none';
    }

    modalOverlay.classList.add('open');
    playSound('flip');
  }

  function closeModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      playSound('click');
    }
  }

  // Clan Wheel Interaction (Slide 3)
  function initClanWheel() {
    const wheelNodes = document.querySelectorAll('.clan-wheel-node');
    const detailsContainer = document.getElementById('clan-detail-display');

    function selectClan(clanKey) {
      const clan = CLANS_INFO[clanKey];
      if (!clan) return;

      wheelNodes.forEach(node => {
        if (node.getAttribute('data-clan') === clanKey) {
          node.classList.add('active');
        } else {
          node.classList.remove('active');
        }
      });

      const targetClan = CLANS_INFO[clan.beats];
      const counterClan = CLANS_INFO[clan.beatenBy];

      if (detailsContainer) {
        detailsContainer.innerHTML = `
          <div style="border-left: 4px solid ${clan.color}; padding-left: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <span style="font-size: 2rem;">${clan.symbol}</span>
              <h3 style="font-size: 1.5rem; font-weight: 800; color: ${clan.color};">Clan ${clan.name}</h3>
            </div>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem;">
              ${clan.description}
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem;">
              <div style="background: rgba(48, 209, 88, 0.12); border: 1px solid rgba(48, 209, 88, 0.3); padding: 0.5rem 0.75rem; border-radius: 8px; color: var(--clan-milenarios);">
                ⚔️ <strong>Ventaja Táctica (+1 Daño):</strong> Tiene ventaja contra <strong>${targetClan ? targetClan.name : 'Ninguno'}</strong> (${targetClan ? targetClan.symbol : ''}).
              </div>
              <div style="background: rgba(255, 69, 58, 0.12); border: 1px solid rgba(255, 69, 58, 0.3); padding: 0.5rem 0.75rem; border-radius: 8px; color: var(--clan-depredadores);">
                🛡️ <strong>Vulnerable ante:</strong> Es débil ante <strong>${counterClan ? counterClan.name : 'Ninguno'}</strong> (${counterClan ? counterClan.symbol : ''}).
              </div>
            </div>
          </div>
        `;
      }
      playSound('click');
    }

    wheelNodes.forEach(node => {
      node.addEventListener('click', () => {
        selectClan(node.getAttribute('data-clan'));
      });
    });

    // Default select Milenarios
    selectClan('milenarios');
  }

  // Booster Pack Opening Simulator (Slide 6)
  function initBoosterPackSimulator() {
    const btnOpenPack = document.getElementById('btn-open-pack');
    const packCover = document.getElementById('booster-pack-sealed');
    const packResultArea = document.getElementById('booster-pack-revealed');

    if (!btnOpenPack || !packCover || !packResultArea) return;

    btnOpenPack.addEventListener('click', () => {
      playSound('tear');

      packCover.style.display = 'none';
      packResultArea.style.display = 'block';

      // Pick 5 random cards from CARDS_DATABASE
      const pickedCards = [];
      const tempDB = [...CARDS_DATABASE];
      for (let i = 0; i < 5; i++) {
        const randIdx = Math.floor(Math.random() * tempDB.length);
        pickedCards.push(tempDB.splice(randIdx, 1)[0]);
      }

      let hasLegendary = pickedCards.some(c => c.rarity === 'Legendaria');
      if (hasLegendary) {
        setTimeout(() => playSound('legendary'), 800);
      }

      const reversoPath = getActiveReversoPath();

      packResultArea.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.4rem; font-weight: 800; color: #fbbf24;">✨ ¡Sobre Abierto con Éxito!</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Haz clic sobre cada carta para revelarla:</p>
        </div>
        <div class="booster-cards-revealed">
          ${pickedCards.map((card, idx) => `
            <div class="card-item-wrapper" style="width: 170px;">
              <div class="card-container is-flipped" id="pack-card-${idx}" style="max-width: 170px;">
                <div class="card-face card-front">
                  <img src="${encodeURI(card.image)}" alt="${card.name}" />
                </div>
                <div class="card-face card-back">
                  <img src="${encodeURI(reversoPath)}" alt="Reverso" />
                </div>
              </div>
              <div style="font-size: 0.8rem; font-weight: 700; margin-top: 0.5rem; text-align: center;">
                <span class="pack-card-tag" style="opacity: 0; color: #fbbf24; transition: opacity 0.3s;" id="pack-tag-${idx}">
                  ${card.name} (${card.rarity || 'Común'})
                </span>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <button id="btn-reopen-pack" class="btn-primary">
            🔄 Abrir Otro Sobre
          </button>
        </div>
      `;

      // Listeners to flip pack cards
      pickedCards.forEach((c, idx) => {
        const elem = document.getElementById(`pack-card-${idx}`);
        const tag = document.getElementById(`pack-tag-${idx}`);
        if (elem) {
          elem.addEventListener('click', () => {
            elem.classList.toggle('is-flipped');
            if (!elem.classList.contains('is-flipped')) {
              tag.style.opacity = '1';
              if (c.rarity === 'Legendaria') playSound('legendary');
              else playSound('flip');
            }
          });
        }
      });

      const btnReopen = document.getElementById('btn-reopen-pack');
      if (btnReopen) {
        btnReopen.addEventListener('click', () => {
          packResultArea.style.display = 'none';
          packCover.style.display = 'flex';
          playSound('click');
        });
      }
    });
  }

  // Keyboard Shortcuts
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // If any modal is open, ESC closes it
      if (e.key === 'Escape') {
        if (modalOverlay && modalOverlay.classList.contains('open')) {
          closeModal();
          return;
        }
        const helpModal = document.getElementById('battle-help-modal');
        if (helpModal && helpModal.classList.contains('open')) {
          helpModal.classList.remove('open');
          return;
        }
        const gameOverModal = document.getElementById('battle-gameover-modal');
        if (gameOverModal && gameOverModal.classList.contains('open')) {
          gameOverModal.classList.remove('open');
          return;
        }
      }

      if (state.currentMode === 'presentation') {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          goToSlide(state.currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          goToSlide(state.currentSlide - 1);
        } else if (e.key.toLowerCase() === 'f') {
          toggleFullScreen();
        } else if (e.key.toLowerCase() === 'm') {
          setMode('showcase');
        }
      } else {
        if (e.key.toLowerCase() === 'm') {
          setMode('presentation');
        }
      }
    });
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // Event Listeners Initialization
  function initEvents() {
    // Mode Switchers
    if (btnModePres) btnModePres.addEventListener('click', () => setMode('presentation'));
    if (btnModeShow) btnModeShow.addEventListener('click', () => setMode('showcase'));
    if (btnModeBattle) btnModeBattle.addEventListener('click', () => setMode('battle'));

    // Slide Nav
    if (btnPrevSlide) btnPrevSlide.addEventListener('click', () => goToSlide(state.currentSlide - 1));
    if (btnNextSlide) btnNextSlide.addEventListener('click', () => goToSlide(state.currentSlide + 1));

    // Fullscreen button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) btnFullscreen.addEventListener('click', toggleFullScreen);

    // Audio toggle button
    const btnAudio = document.getElementById('btn-toggle-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        btnAudio.textContent = state.audioEnabled ? '🔊 Sonido' : '🔇 Mute';
        playSound('click');
      });
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
      modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
      });
    }
    const modalFlipper = document.getElementById('modal-card-flipper');
    if (modalFlipper) {
      modalFlipper.addEventListener('click', () => {
        modalFlipper.classList.toggle('is-flipped');
        playSound('flip');
      });
    }

    // Showcase Category Tabs
    document.querySelectorAll('.tab-btn[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-category]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.catalogFilters.category = btn.getAttribute('data-category');
        renderCardsCatalog();
        playSound('click');
      });
    });

    // Showcase Clan Tabs
    document.querySelectorAll('.tab-btn[data-clan]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-clan]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.catalogFilters.clan = btn.getAttribute('data-clan');
        renderCardsCatalog();
        playSound('click');
      });
    });

    // Search Input
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.catalogFilters.search = e.target.value;
        renderCardsCatalog();
      });
    }

    // Reverso Selector
    if (reversoSelect) {
      reversoSelect.addEventListener('change', e => {
        state.activeReverso = e.target.value;
        renderCardsCatalog();
        playSound('click');
      });
    }

    // Jump-to buttons in slides
    document.querySelectorAll('[data-action="go-to-showcase"]').forEach(el => {
      el.addEventListener('click', () => setMode('showcase'));
    });

    // Clan battle test in Slide 3
    const selectAttacker = document.getElementById('calc-attacker-clan');
    const selectDefender = document.getElementById('calc-defender-clan');
    const calcResult = document.getElementById('calc-battle-result');

    function calculateBattleAdvantage() {
      if (!selectAttacker || !selectDefender || !calcResult) return;
      const atk = selectAttacker.value;
      const def = selectDefender.value;
      const atkData = CLANS_INFO[atk];
      const defData = CLANS_INFO[def];

      if (atk === def) {
        calcResult.innerHTML = `
          <div style="color: var(--text-muted);">Duelo entre el mismo clan <strong>${atkData.name}</strong>. Sin bonificación de daño elemental (+0 ⚔️).</div>
        `;
      } else if (atkData.beats === def) {
        calcResult.innerHTML = `
          <div style="color: var(--clan-milenarios); font-weight: 700; font-size: 1.05rem;">
            🔥 ¡VENTAJA ELEMENTAL! ${atkData.name} vence a ${defData.name}.<br/>
            <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-main);">Otorga <strong>+1 de Daño (⚔️)</strong> adicional en cada ataque.</span>
          </div>
        `;
      } else if (atkData.beatenBy === def) {
        calcResult.innerHTML = `
          <div style="color: var(--clan-depredadores); font-weight: 700; font-size: 1.05rem;">
            ⚠️ DESVENTAJA TÁCTICA. ${defData.name} tiene resistencia contra ${atkData.name}.<br/>
            <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-main);">El defensor te contragolpea con <strong>+1 de Daño (⚔️)</strong>.</span>
          </div>
        `;
      } else {
        calcResult.innerHTML = `
          <div style="color: var(--accent-gold);">Combate cruzado neutral entre <strong>${atkData.name}</strong> y <strong>${defData.name}</strong>. Daño base estándar.</div>
        `;
      }
    }

    if (selectAttacker && selectDefender) {
      selectAttacker.addEventListener('change', calculateBattleAdvantage);
      selectDefender.addEventListener('change', calculateBattleAdvantage);
      calculateBattleAdvantage();
    }

    // Theme toggle button
    const btnTheme = document.getElementById('theme-toggle-btn');
    if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
  }

  // Boot Application
  document.addEventListener('DOMContentLoaded', () => {
    // Restore saved theme (dark or light)
    const savedTheme = localStorage.getItem('cometa_theme') || 'dark';
    applyTheme(savedTheme);

    initSlideDots();
    initClanWheel();
    initBoosterPackSimulator();
    setupKeyboardShortcuts();
    initEvents();
    renderCardsCatalog();
    goToSlide(0);
  });
})();
