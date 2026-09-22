/**
 * Cometa Champions TCG - Battle Simulator Engine
 * Inspired by MARVEL SNAP & Pokémon TCG Pocket
 * 3 Simultaneous Arenas, 6 Progressive Turns, Clan Advantage System
 */

(function () {
  'use strict';

  // Game State
  const game = {
    turn: 1,
    maxTurn: 6,
    playerEnergy: 1,
    playerMaxEnergy: 1,
    aiEnergy: 1,
    aiMaxEnergy: 1,
    arenas: [], // 3 Arena Card objects
    playerLanes: [[], [], []], // up to 4 cards per lane
    aiLanes: [[], [], []],     // up to 4 cards per lane
    turnPlays: { player: [], ai: [] }, // cards played in current turn (for undo)
    playerDeck: [],
    playerHand: [],
    aiDeck: [],
    aiHand: [],
    selectedHandIndex: null,
    gameOver: false,
    winner: null,
    history: []
  };

  // Clan Counter Matrix for Círculo Cometa
  const CLAN_BEATS = {
    milenarios: 'fugitivos',
    fugitivos: 'depredadores',
    depredadores: 'miticos',
    miticos: 'milenarios'
  };

  // Sound FX via Web Audio API (integrates with main audio context if available)
  function playBattleSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'deploy') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'lead') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.8);
        });
      } else if (type === 'defeat') {
        [440, 415.30, 392, 369.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.15, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.3);
        });
      }
    } catch (e) {
      console.warn('Battle audio note:', e);
    }
  }

  // Shuffle Helper
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Build Balance Decks from Database
  function generateDeck() {
    // Collect champions, kombat beasts, and trompos (exclude arenas)
    const validCards = CARDS_DATABASE.filter(c => c.category !== 'arenas');
    const shuffled = shuffleArray(validCards);
    // 12-card deck (like Marvel Snap)
    return shuffled.slice(0, 12);
  }

  // Pick 3 Distinct Arenas
  function pickArenas() {
    const allArenas = CARDS_DATABASE.filter(c => c.category === 'arenas');
    const shuffled = shuffleArray(allArenas);
    return shuffled.slice(0, 3);
  }

  // Calculate Power of a single Card in a Lane (including Arena & Clan Counters)
  function getCardEffectivePower(card, laneIndex, isPlayer) {
    let power = card.attack || 0;
    // Trompos functioning as support items grant their cost as power plus bonus
    if (card.category === 'trompos') {
      power = Math.max(2, card.cost + 1);
    }

    const arena = game.arenas[laneIndex];
    if (!arena) return power;

    // Arena Modifiers
    // 1. Clan Affinity Bonus
    if (arena.clan && arena.clan === card.clan) {
      power += 1;
    }
    // 2. Specific Arena Rules
    if (arena.name.includes('Llanuras del Tirano')) {
      power += 2;
    } else if (arena.name.includes('La Pista de Carreras') && (card.name.includes('Turbo') || card.name.includes('turbo'))) {
      power += 2;
    } else if (arena.name.includes('Templo Milenario') && card.clan === 'milenarios') {
      power += 1;
    } else if (arena.name.includes('Campamento Panther') && card.clan === 'depredadores') {
      power += 1;
    }

    // Clan Counter Advantage (Pokémon Pocket / Círculo Cometa):
    // Compare against opposing cards in this lane
    const opposingCards = isPlayer ? game.aiLanes[laneIndex] : game.playerLanes[laneIndex];
    const targetClan = CLAN_BEATS[card.clan];
    if (targetClan && opposingCards.some(op => op.clan === targetClan)) {
      power += 1; // +1 Elemental Advantage
    }

    return Math.max(0, power);
  }

  // Calculate Total Power for a Player/AI in a Lane
  function getLanePower(laneIndex, isPlayer) {
    const cards = isPlayer ? game.playerLanes[laneIndex] : game.aiLanes[laneIndex];
    return cards.reduce((sum, card) => sum + getCardEffectivePower(card, laneIndex, isPlayer), 0);
  }

  // Start / Reset Game
  function initBattleGame() {
    game.turn = 1;
    game.maxTurn = 6;
    game.playerMaxEnergy = 1;
    game.playerEnergy = 1;
    game.aiMaxEnergy = 1;
    game.aiEnergy = 1;
    game.playerLanes = [[], [], []];
    game.aiLanes = [[], [], []];
    game.turnPlays = { player: [], ai: [] };
    game.selectedHandIndex = null;
    game.gameOver = false;
    game.winner = null;

    // Pick 3 Arenas
    game.arenas = pickArenas();

    // Generate Decks
    game.playerDeck = generateDeck();
    game.aiDeck = generateDeck();

    // Draw initial hand of 4 cards
    game.playerHand = game.playerDeck.splice(0, 4);
    game.aiHand = game.aiDeck.splice(0, 4);

    renderBattleUI();
  }

  // Draw Card
  function drawCard(isPlayer) {
    if (isPlayer) {
      if (game.playerDeck.length > 0 && game.playerHand.length < 7) {
        game.playerHand.push(game.playerDeck.shift());
      }
    } else {
      if (game.aiDeck.length > 0 && game.aiHand.length < 7) {
        game.aiHand.push(game.aiDeck.shift());
      }
    }
  }

  // Play Card to Lane (Player)
  function playCardToLane(handIndex, laneIndex) {
    if (game.gameOver) return;
    const card = game.playerHand[handIndex];
    if (!card) return;

    // Check Energy
    if (game.playerEnergy < card.cost) {
      alert(`No tienes suficiente energía (🟢 ${game.playerEnergy} disponible, requiere 🟢 ${card.cost}).`);
      return;
    }

    // Check Lane Capacity (Max 4 cards)
    if (game.playerLanes[laneIndex].length >= 4) {
      alert('Esta arena ya está llena (máximo 4 cartas).');
      return;
    }

    // Deduct energy & move card
    game.playerEnergy -= card.cost;
    game.playerHand.splice(handIndex, 1);
    game.playerLanes[laneIndex].push(card);

    // Track for undo
    game.turnPlays.player.push({ card, laneIndex });
    game.selectedHandIndex = null;

    playBattleSound('deploy');
    renderBattleUI();
  }

  // Undo Player Play in current turn
  function undoPlayerPlay(laneIndex, cardIndex) {
    if (game.gameOver) return;
    const card = game.playerLanes[laneIndex][cardIndex];
    if (!card) return;

    // Check if this card was played in the current turn
    const playIdx = game.turnPlays.player.findIndex(p => p.card === card && p.laneIndex === laneIndex);
    if (playIdx === -1) {
      // Locked from previous turns
      return;
    }

    // Refund energy and return to hand
    game.turnPlays.player.splice(playIdx, 1);
    game.playerLanes[laneIndex].splice(cardIndex, 1);
    game.playerEnergy += card.cost;
    game.playerHand.push(card);

    playBattleSound('deploy');
    renderBattleUI();
  }

  // AI Decision Engine (Marvel Snap style smart bot)
  function executeAiTurn() {
    // AI tries to play affordable cards into the lanes where it benefits most
    let energyLeft = game.aiEnergy;
    let availableHand = [...game.aiHand];

    // Sort hand by priority: high power / good cost curve
    availableHand.sort((a, b) => b.cost - a.cost);

    for (let i = availableHand.length - 1; i >= 0; i--) {
      const card = availableHand[i];
      if (card.cost <= energyLeft) {
        // Choose best lane:
        // Priority 1: A lane where playing this card flips the lead from player to AI
        // Priority 2: Lane with fewest AI cards and available space
        const laneScores = [0, 1, 2].map(l => {
          if (game.aiLanes[l].length >= 4) return -999;
          const pPower = getLanePower(l, true);
          const aiPower = getLanePower(l, false);
          const effPower = getCardEffectivePower(card, l, false);
          
          let score = 10;
          if (aiPower <= pPower && aiPower + effPower > pPower) {
            score += 50; // Winning swing!
          } else if (aiPower > pPower) {
            score += 15; // Solidifying lead
          }
          // Clan bonus
          if (game.arenas[l].clan === card.clan) score += 10;
          return { lane: l, score };
        }).sort((a, b) => b.score - a.score);

        const bestLane = laneScores[0];
        if (bestLane && bestLane.score > -900) {
          // Play card
          energyLeft -= card.cost;
          const realIdx = game.aiHand.indexOf(card);
          if (realIdx !== -1) {
            game.aiHand.splice(realIdx, 1);
            game.aiLanes[bestLane.lane].push(card);
            game.turnPlays.ai.push({ card, laneIndex: bestLane.lane });
          }
        }
      }
    }
    game.aiEnergy = energyLeft;
  }

  // End Turn Button Action
  function endTurn() {
    if (game.gameOver) return;

    // AI plays its cards
    executeAiTurn();

    // Check if sounds need to play for lane lead swings
    playBattleSound('lead');

    // Clear current turn undo history
    game.turnPlays.player = [];
    game.turnPlays.ai = [];

    // Check End of Game (after Turn 6)
    if (game.turn >= game.maxTurn) {
      resolveGameOver();
      return;
    }

    // Advance to next turn
    game.turn += 1;
    game.playerMaxEnergy = game.turn;
    game.playerEnergy = game.playerMaxEnergy;
    game.aiMaxEnergy = game.turn;
    game.aiEnergy = game.aiMaxEnergy;

    // Draw 1 card each
    drawCard(true);
    drawCard(false);

    renderBattleUI();
  }

  // Resolve Game Over & Calculate Victory
  function resolveGameOver() {
    game.gameOver = true;

    let playerWins = 0;
    let aiWins = 0;
    let playerTotalPower = 0;
    let aiTotalPower = 0;

    for (let l = 0; l < 3; l++) {
      const p = getLanePower(l, true);
      const a = getLanePower(l, false);
      playerTotalPower += p;
      aiTotalPower += a;

      if (p > a) playerWins++;
      else if (a > p) aiWins++;
    }

    if (playerWins > aiWins) {
      game.winner = 'player';
      playBattleSound('victory');
    } else if (aiWins > playerWins) {
      game.winner = 'ai';
      playBattleSound('defeat');
    } else {
      // Tie breaker by total power
      if (playerTotalPower > aiTotalPower) {
        game.winner = 'player';
        playBattleSound('victory');
      } else if (aiTotalPower > playerTotalPower) {
        game.winner = 'ai';
        playBattleSound('defeat');
      } else {
        game.winner = 'tie';
      }
    }

    renderBattleUI();
    showGameOverModal(playerWins, aiWins, playerTotalPower, aiTotalPower);
  }

  // Show Game Over Modal
  function showGameOverModal(playerWins, aiWins, playerTotal, aiTotal) {
    const modal = document.getElementById('battle-gameover-modal');
    if (!modal) return;

    const titleElem = document.getElementById('battle-modal-title');
    const descElem = document.getElementById('battle-modal-desc');
    const statsElem = document.getElementById('battle-modal-stats');

    if (game.winner === 'player') {
      titleElem.textContent = '🏆 ¡VICTORIA ABSOLUTA!';
      titleElem.style.color = '#30d158';
      descElem.textContent = '¡Has dominado el tablero y conquistado las arenas legendarias de Cometa Champions!';
    } else if (game.winner === 'ai') {
      titleElem.textContent = '💀 DERROTA';
      titleElem.style.color = '#ff453a';
      descElem.textContent = 'El Rival Cometa ha asegurado el control de las zonas. ¡Ajusta tu estrategia para la revancha!';
    } else {
      titleElem.textContent = '🤝 EMPATE HEROICO';
      titleElem.style.color = '#f5c518';
      descElem.textContent = 'Ambos estrategas igualaron el poder en el campo de batalla.';
    }

    statsElem.innerHTML = `
      <div style="display: flex; justify-content: space-around; margin: 1.5rem 0; font-size: 1.1rem;">
        <div style="text-align: center;">
          <div style="font-weight: 800; font-size: 2rem; color: #30d158;">${playerWins}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">Tus Arenas (${playerTotal} ⚔️)</div>
        </div>
        <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-muted); align-self: center;">VS</div>
        <div style="text-align: center;">
          <div style="font-weight: 800; font-size: 2rem; color: #ff453a;">${aiWins}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">Arenas Rival (${aiTotal} ⚔️)</div>
        </div>
      </div>
    `;

    modal.classList.add('open');
  }

  // Render Entire Battle Interface
  function renderBattleUI() {
    const battleView = document.getElementById('battle-view');
    if (!battleView || battleView.style.display === 'none') return;

    // Header updates
    const turnText = document.getElementById('battle-turn-indicator');
    if (turnText) {
      turnText.innerHTML = `Turno <strong>${game.turn}</strong> de <strong>${game.maxTurn}</strong>`;
    }

    const energyText = document.getElementById('battle-player-energy');
    if (energyText) {
      energyText.innerHTML = `🟢 <strong>${game.playerEnergy}</strong> / ${game.playerMaxEnergy}`;
    }

    // Lane Controls Count
    let pLanesWon = 0;
    let aLanesWon = 0;
    for (let l = 0; l < 3; l++) {
      const p = getLanePower(l, true);
      const a = getLanePower(l, false);
      if (p > a) pLanesWon++;
      else if (a > p) aLanesWon++;
    }

    const scoreElem = document.getElementById('battle-lanes-score');
    if (scoreElem) {
      scoreElem.innerHTML = `
        <span style="color: #30d158; font-weight: 800;">${pLanesWon}</span>
        <span style="color: var(--text-muted);"> vs </span>
        <span style="color: #ff453a; font-weight: 800;">${aLanesWon}</span>
      `;
    }

    // Render Arenas & Lanes
    const lanesContainer = document.getElementById('battle-lanes-container');
    if (lanesContainer) {
      lanesContainer.innerHTML = game.arenas.map((arena, lIdx) => {
        const pPower = getLanePower(lIdx, true);
        const aPower = getLanePower(lIdx, false);
        const playerLeads = pPower > aPower;
        const aiLeads = aPower > pPower;

        const pCards = game.playerLanes[lIdx];
        const aCards = game.aiLanes[lIdx];

        return `
          <div class="battle-lane-column ${playerLeads ? 'lane-player-lead' : ''} ${aiLeads ? 'lane-ai-lead' : ''}" data-lane="${lIdx}">
            
            <!-- AI Cards (Top) -->
            <div class="lane-cards-zone ai-zone">
              <div class="lane-slots-grid">
                ${[0, 1, 2, 3].map(slotIdx => {
                  const card = aCards[slotIdx];
                  if (!card) return `<div class="lane-card-slot empty"></div>`;
                  const effP = getCardEffectivePower(card, lIdx, false);
                  return `
                    <div class="lane-card-slot occupied" title="${card.name} (Poder: ${effP})">
                      <img src="${encodeURI(card.image)}" alt="${card.name}" />
                      <div class="lane-card-badge">${effP}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Central Arena Header & Score -->
            <div class="lane-arena-center" style="background-image: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url('${encodeURI(arena.image)}');">
              <div class="lane-arena-title">${arena.name}</div>
              <div class="lane-arena-effect">${arena.effect || 'Arena oficial de combate'}</div>

              <div class="lane-score-meter">
                <div class="meter-val ai ${aiLeads ? 'leader' : ''}">${aPower}</div>
                <div class="meter-vs">⚡</div>
                <div class="meter-val player ${playerLeads ? 'leader' : ''}">${pPower}</div>
              </div>

              <div class="lane-status-text">
                ${playerLeads ? '👑 ¡Lideras esta zona!' : aiLeads ? '⚠️ Rival en ventaja' : '⚔️ Empate'}
              </div>

              <!-- Button to Deploy into this Arena if Hand Card Selected -->
              ${game.selectedHandIndex !== null && pCards.length < 4 ? `
                <button class="btn-deploy-to-lane" data-lane="${lIdx}">
                  ➕ Desplegar Aquí
                </button>
              ` : ''}
            </div>

            <!-- Player Cards (Bottom) -->
            <div class="lane-cards-zone player-zone">
              <div class="lane-slots-grid">
                ${[0, 1, 2, 3].map(slotIdx => {
                  const card = pCards[slotIdx];
                  if (!card) return `<div class="lane-card-slot empty"></div>`;
                  const effP = getCardEffectivePower(card, lIdx, true);
                  const isCurrentPlay = game.turnPlays.player.some(p => p.card === card && p.laneIndex === lIdx);
                  return `
                    <div class="lane-card-slot occupied ${isCurrentPlay ? 'can-undo' : ''}" data-lane="${lIdx}" data-slot="${slotIdx}" title="${card.name} (${isCurrentPlay ? 'Toca para deshacer' : 'Fijada'})">
                      <img src="${encodeURI(card.image)}" alt="${card.name}" />
                      <div class="lane-card-badge">${effP}</div>
                      ${isCurrentPlay ? `<div class="undo-pill">✕</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>
        `;
      }).join('');
    }

    // Render Player Hand
    const handContainer = document.getElementById('battle-player-hand');
    if (handContainer) {
      if (game.playerHand.length === 0) {
        handContainer.innerHTML = `<div style="color: var(--text-muted); padding: 1.5rem; text-align: center; width: 100%;">Mano vacía. Espera al próximo turno.</div>`;
      } else {
        handContainer.innerHTML = game.playerHand.map((card, idx) => {
          const isSelected = game.selectedHandIndex === idx;
          const isAffordable = game.playerEnergy >= card.cost;
          return `
            <div class="battle-hand-card ${isSelected ? 'selected' : ''} ${isAffordable ? 'affordable' : 'unaffordable'}" data-hand-idx="${idx}">
              <div class="hand-card-cost">🟢 ${card.cost}</div>
              <div class="hand-card-power">⚔️ ${card.attack || (card.cost + 1)}</div>
              <img src="${encodeURI(card.image)}" alt="${card.name}" />
              <div class="hand-card-name">${card.name}</div>
            </div>
          `;
        }).join('');
      }
    }

    // Attach Event Listeners
    attachBattleEvents();
  }

  // Attach Interaction Events
  function attachBattleEvents() {
    // Hand Card Selection
    document.querySelectorAll('.battle-hand-card').forEach(elem => {
      elem.addEventListener('click', () => {
        const idx = parseInt(elem.getAttribute('data-hand-idx'), 10);
        if (game.selectedHandIndex === idx) {
          game.selectedHandIndex = null; // deselect
        } else {
          game.selectedHandIndex = idx;
        }
        playBattleSound('deploy');
        renderBattleUI();
      });
    });

    // Deploy Buttons in Lanes
    document.querySelectorAll('.btn-deploy-to-lane').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lIdx = parseInt(btn.getAttribute('data-lane'), 10);
        if (game.selectedHandIndex !== null) {
          playCardToLane(game.selectedHandIndex, lIdx);
        }
      });
    });

    // Direct Lane Click to deploy if hand card selected
    document.querySelectorAll('.battle-lane-column').forEach(col => {
      col.addEventListener('click', (e) => {
        if (e.target.closest('.lane-card-slot.occupied')) return;
        const lIdx = parseInt(col.getAttribute('data-lane'), 10);
        if (game.selectedHandIndex !== null && game.playerLanes[lIdx].length < 4) {
          playCardToLane(game.selectedHandIndex, lIdx);
        }
      });
    });

    // Undo Click on Player Slot
    document.querySelectorAll('.lane-card-slot.occupied.can-undo').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const lIdx = parseInt(slot.getAttribute('data-lane'), 10);
        const sIdx = parseInt(slot.getAttribute('data-slot'), 10);
        undoPlayerPlay(lIdx, sIdx);
      });
    });
  }

  // Help Modal Functions
  function openHelpModal() {
    const modal = document.getElementById('battle-help-modal');
    if (modal) {
      modal.classList.add('open');
      playBattleSound('deploy');
    }
  }

  function closeHelpModal() {
    const modal = document.getElementById('battle-help-modal');
    if (modal) {
      modal.classList.remove('open');
      playBattleSound('deploy');
    }
  }

  // Global Simulator API
  window.CometaBattle = {
    start: initBattleGame,
    endTurn: endTurn,
    openHelp: openHelpModal,
    closeHelp: closeHelpModal,
    reset: () => {
      const modal = document.getElementById('battle-gameover-modal');
      if (modal) modal.classList.remove('open');
      initBattleGame();
    }
  };

  // Event Listeners for Battle Buttons
  document.addEventListener('DOMContentLoaded', () => {
    const btnEndTurn = document.getElementById('btn-battle-end-turn');
    if (btnEndTurn) {
      btnEndTurn.addEventListener('click', endTurn);
    }

    const btnRestart = document.getElementById('btn-battle-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        const modal = document.getElementById('battle-gameover-modal');
        if (modal) modal.classList.remove('open');
        initBattleGame();
      });
    }

    const btnModalRestart = document.getElementById('battle-modal-restart-btn');
    if (btnModalRestart) {
      btnModalRestart.addEventListener('click', () => {
        const modal = document.getElementById('battle-gameover-modal');
        if (modal) modal.classList.remove('open');
        initBattleGame();
      });
    }

    // Help Modal Triggers
    const btnBattleHelp = document.getElementById('btn-battle-help');
    if (btnBattleHelp) btnBattleHelp.addEventListener('click', openHelpModal);

    const btnGlobalHelp = document.getElementById('btn-global-help');
    if (btnGlobalHelp) btnGlobalHelp.addEventListener('click', openHelpModal);

    const btnHelpClose = document.getElementById('battle-help-close-btn');
    if (btnHelpClose) btnHelpClose.addEventListener('click', closeHelpModal);

    const btnHelpGotIt = document.getElementById('battle-help-gotit-btn');
    if (btnHelpGotIt) btnHelpGotIt.addEventListener('click', closeHelpModal);

    const helpModal = document.getElementById('battle-help-modal');
    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) closeHelpModal();
      });
    }
  });

})();
