/**
 * Lep's Treasure Vault - Master Game Logic
 * 15-Level Interactive Adventure Guess The Number Quest
 */

(function () {
  'use strict';

  /* ==========================================================================
     Level Configuration & World Data (15 Levels across 5 Worlds)
     ========================================================================== */
  const WORLDS = [
    { id: 1, name: "Clover Meadows", icon: "🍀", levels: [1, 2, 3] },
    { id: 2, name: "Emerald Forest", icon: "🌲", levels: [4, 5, 6] },
    { id: 3, name: "Golden Ruins", icon: "🏛️", levels: [7, 8, 9] },
    { id: 4, name: "Leprechaun Caverns", icon: "🌋", levels: [10, 11, 12] },
    { id: 5, name: "Rainbow Citadel", icon: "🌈", levels: [13, 14, 15] }
  ];

  const LEVELS = [
    // World 1: Clover Meadows
    { level: 1, world: 1, title: "Wooden Chest", icon: "🪵", min: 1, max: 50, keys: 9, goldReward: 70 },
    { level: 2, world: 1, title: "Clover Cache", icon: "🍀", min: 1, max: 60, keys: 8, goldReward: 85 },
    { level: 3, world: 1, title: "Mossy Vault", icon: "🌿", min: 1, max: 75, keys: 8, goldReward: 100 },

    // World 2: Emerald Forest
    { level: 4, world: 2, title: "Bronze Coffer", icon: "🥉", min: 1, max: 100, keys: 8, goldReward: 120 },
    { level: 5, world: 2, title: "Lep's Stash", icon: "🍄", min: 1, max: 100, keys: 7, goldReward: 140 },
    { level: 6, world: 2, title: "Emerald Relic", icon: "🟢", min: 1, max: 120, keys: 7, goldReward: 160 },

    // World 3: Golden Ruins
    { level: 7, world: 3, title: "Gilded Trunk", icon: "📦", min: 1, max: 150, keys: 7, goldReward: 180 },
    { level: 8, world: 3, title: "Sunken Strongbox", icon: "🔱", min: 1, max: 160, keys: 6, goldReward: 200 },
    { level: 9, world: 3, title: "Pharaoh's Gold", icon: "👑", min: 1, max: 180, keys: 6, goldReward: 230 },

    // World 4: Leprechaun Caverns
    { level: 10, world: 4, title: "Crystal Safe", icon: "💎", min: 1, max: 200, keys: 6, goldReward: 260 },
    { level: 11, world: 4, title: "Magma Vault", icon: "🌋", min: 1, max: 220, keys: 5, goldReward: 300 },
    { level: 12, world: 4, title: "Pot of Gold", icon: "🍯", min: 1, max: 250, keys: 5, goldReward: 350 },

    // World 5: Rainbow Citadel
    { level: 13, world: 5, title: "Astral Lockbox", icon: "✨", min: 1, max: 250, keys: 5, goldReward: 400 },
    { level: 14, world: 5, title: "Archmage Cache", icon: "🔮", min: 1, max: 280, keys: 5, goldReward: 450 },
    { level: 15, world: 5, title: "Grand Rainbow Vault", icon: "🌈", min: 1, max: 300, keys: 5, goldReward: 600 }
  ];

  const ACHIEVEMENTS_DEF = [
    { id: 'first_win', icon: '🔓', title: 'First Lock Picked', desc: 'Crack open your very first treasure chest (Beat Level 1).' },
    { id: 'sniper', icon: '🎯', title: 'Deadeye Guess', desc: 'Unlock any treasure chest in 2 or fewer attempts.' },
    { id: 'boiling', icon: '💥', title: 'Red Hot Instinct', desc: 'Unlock a chest immediately following a Boiling Hot hint.' },
    { id: 'gold_300', icon: '🪙', title: 'Purse Filler', desc: 'Accumulate 300 total gold coins.' },
    { id: 'gold_1000', icon: '💰', title: 'Lep\'s Fortune', desc: 'Accumulate 1,000 total gold coins.' },
    { id: 'all_stars_w1', icon: '⭐', title: 'Clover Perfectionist', desc: 'Earn 3 stars on all World 1 levels.' },
    { id: 'world_2', icon: '🌲', title: 'Forest Delver', desc: 'Conquer World 2 and crack Level 6.' },
    { id: 'world_3', icon: '🏛️', title: 'Ruins Explorer', desc: 'Conquer World 3 and crack Level 9.' },
    { id: 'world_4', icon: '🌋', title: 'Cavern Master', desc: 'Conquer World 4 and crack Level 12.' },
    { id: 'game_complete', icon: '👑', title: 'Grand Rainbow King', desc: 'Crack open all 15 treasure vaults!' },
    { id: 'potions_used', icon: '🧪', title: 'Alchemist Apprentice', desc: 'Use 3 power-up potions across your adventure.' },
    { id: 'clutch_win', icon: '⚡', title: 'Down To The Wire', desc: 'Crack the chest on your very last remaining golden key!' }
  ];

  /* ==========================================================================
     Game State & Storage
     ========================================================================== */
  const STORAGE_KEY = 'LEPS_TREASURE_VAULT_DATA_V1';

  let gameState = {
    gold: 150,
    unlockedLevels: [1],
    levelStars: {}, // { [level]: 1..3 }
    currentLevelNum: 1,
    soundEnabled: true,
    potions: {
      clover: 2,
      orb: 2,
      key: 1
    },
    achievements: [],
    potionsUsedCount: 0
  };

  // Active Play Session State
  let session = {
    levelData: null,
    secretNumber: 0,
    keysRemaining: 0,
    maxKeys: 0,
    attempts: 0,
    minBound: 1,
    maxBound: 50,
    history: [],
    lastProximityWasBoiling: false,
    specialCluesGiven: []
  };

  /* ==========================================================================
     Audio Synthesizer (Web Audio API - No External Asset Latency)
     ========================================================================== */
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, delay = 0, gainVal = 0.15) {
    if (!gameState.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);

    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
  }

  const Sound = {
    click: () => {
      playTone(600, 'sine', 0.05, 0, 0.1);
    },
    rattle: () => {
      playTone(180, 'triangle', 0.08, 0, 0.2);
      playTone(140, 'square', 0.08, 0.06, 0.15);
      playTone(220, 'triangle', 0.08, 0.12, 0.2);
    },
    highLow: (isHigh) => {
      if (isHigh) {
        // High pitched descending
        playTone(520, 'sine', 0.12, 0, 0.15);
        playTone(380, 'sine', 0.15, 0.08, 0.12);
      } else {
        // Low pitched ascending
        playTone(280, 'sine', 0.12, 0, 0.15);
        playTone(420, 'sine', 0.15, 0.08, 0.12);
      }
    },
    boiling: () => {
      playTone(880, 'triangle', 0.1, 0, 0.15);
      playTone(1100, 'sine', 0.15, 0.08, 0.2);
    },
    openChest: () => {
      // Triumphant Fanfare
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((n, idx) => {
        playTone(n, 'triangle', 0.3, idx * 0.12, 0.25);
      });
      setTimeout(() => {
        playTone(880, 'sine', 0.6, 0, 0.3);
        playTone(1108.73, 'triangle', 0.7, 0.05, 0.25);
        playTone(1318.51, 'sine', 0.8, 0.1, 0.2);
      }, 500);
    },
    defeat: () => {
      playTone(330, 'sawtooth', 0.2, 0, 0.15);
      playTone(293.66, 'sawtooth', 0.25, 0.18, 0.15);
      playTone(220, 'sawtooth', 0.45, 0.38, 0.2);
    },
    coin: () => {
      playTone(987.77, 'sine', 0.08, 0, 0.18);
      playTone(1318.51, 'sine', 0.25, 0.06, 0.2);
    },
    powerup: () => {
      playTone(523.25, 'sine', 0.1, 0, 0.15);
      playTone(659.25, 'triangle', 0.1, 0.08, 0.15);
      playTone(783.99, 'sine', 0.1, 0.16, 0.15);
      playTone(1046.50, 'triangle', 0.25, 0.24, 0.2);
    },
    achievement: () => {
      playTone(659.25, 'sine', 0.15, 0, 0.2);
      playTone(880, 'sine', 0.15, 0.12, 0.2);
      playTone(1046.50, 'triangle', 0.4, 0.24, 0.25);
    }
  };

  /* ==========================================================================
     Particle Physics Engine (Canvas)
     ========================================================================== */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrameId = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type; // 'coin', 'clover', 'star', 'confetti'
      this.size = type === 'coin' ? 14 : (type === 'clover' ? 16 : Math.random() * 8 + 6);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - (Math.random() * 5 + 4);
      
      this.gravity = 0.28;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 12;
      this.opacity = 1;
      this.decay = Math.random() * 0.008 + 0.008;
      
      const colors = ['#ffca28', '#ff8f00', '#4caf50', '#76ff03', '#e040fb', '#00e5ff', '#ff3d00'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotSpeed;
      this.opacity -= this.decay;
    }

    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, this.opacity);
      c.translate(this.x, this.y);
      c.rotate((this.rotation * Math.PI) / 180);

      if (this.type === 'coin') {
        c.fillStyle = '#ffb300';
        c.strokeStyle = '#fff9c4';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, this.size, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = '#3e2723';
        c.font = 'bold 10px Fredoka, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('🪙', 0, 0);
      } else if (this.type === 'clover') {
        c.font = `${this.size * 1.5}px sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('🍀', 0, 0);
      } else if (this.type === 'star') {
        c.font = `${this.size * 1.5}px sans-serif`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('⭐', 0, 0);
      } else {
        c.fillStyle = this.color;
        c.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      }

      c.restore();
    }
  }

  function spawnParticles(x, y, count, types = ['coin', 'clover', 'star', 'confetti']) {
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      particles.push(new Particle(x, y, type));
    }
    if (!animFrameId) {
      renderParticles();
    }
  }

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.opacity <= 0 || p.y > canvas.height + 50) {
        particles.splice(i, 1);
      }
    }
    if (particles.length > 0) {
      animFrameId = requestAnimationFrame(renderParticles);
    } else {
      animFrameId = null;
    }
  }

  /* ==========================================================================
     DOM Elements Cache
     ========================================================================== */
  const DOM = {
    // Header Stats & Nav
    goldCounter: document.getElementById('goldCounter'),
    starCounter: document.getElementById('starCounter'),
    openTrophiesBtn: document.getElementById('openTrophiesBtn'),
    openShopBtn: document.getElementById('openShopBtn'),
    toggleSoundBtn: document.getElementById('toggleSoundBtn'),
    soundIcon: document.getElementById('soundIcon'),
    trophyNotificationDot: document.getElementById('trophyNotificationDot'),

    // Views
    mapView: document.getElementById('mapView'),
    gameView: document.getElementById('gameView'),
    worldTabs: document.getElementById('worldTabs'),
    levelsGrid: document.getElementById('levelsGrid'),
    playNextLevelBtn: document.getElementById('playNextLevelBtn'),

    // Game Arena
    backToMapBtn: document.getElementById('backToMapBtn'),
    currentWorldName: document.getElementById('currentWorldName'),
    currentLevelTitle: document.getElementById('currentLevelTitle'),
    keyTracker: document.getElementById('keyTracker'),

    // Mascot & Hints
    mascotAvatar: document.getElementById('mascotAvatar'),
    mascotFace: document.getElementById('mascotFace'),
    mascotSpeech: document.getElementById('mascotSpeech'),
    speechRange: document.getElementById('speechRange'),
    rangeClueDesc: document.getElementById('rangeClueDesc'),
    thermalFill: document.getElementById('thermalFill'),
    thermalLabel: document.getElementById('thermalLabel'),
    specialClueItem: document.getElementById('specialClueItem'),
    specialClueTitle: document.getElementById('specialClueTitle'),
    specialClueDesc: document.getElementById('specialClueDesc'),
    minPossibleVal: document.getElementById('minPossibleVal'),
    maxPossibleVal: document.getElementById('maxPossibleVal'),

    // Chest & Stage
    treasureStage: document.getElementById('treasureStage'),
    chestSunburst: document.getElementById('chestSunburst'),
    chestModel: document.getElementById('chestModel'),
    lockPlate: document.getElementById('lockPlate'),
    lockNumberDisplay: document.getElementById('lockNumberDisplay'),
    reactionFloat: document.getElementById('reactionFloat'),

    // Controls
    guessInput: document.getElementById('guessInput'),
    guessSlider: document.getElementById('guessSlider'),
    sliderMinTag: document.getElementById('sliderMinTag'),
    sliderMaxTag: document.getElementById('sliderMaxTag'),
    stepDownBtn: document.getElementById('stepDownBtn'),
    stepUpBtn: document.getElementById('stepUpBtn'),
    submitGuessBtn: document.getElementById('submitGuessBtn'),

    // Power-ups
    cloverPowerBtn: document.getElementById('cloverPowerBtn'),
    orbPowerBtn: document.getElementById('orbPowerBtn'),
    keyPowerBtn: document.getElementById('keyPowerBtn'),
    cloverQty: document.getElementById('cloverQty'),
    orbQty: document.getElementById('orbQty'),
    keyQty: document.getElementById('keyQty'),

    // History & Numpad
    historyList: document.getElementById('historyList'),
    attemptCountBadge: document.getElementById('attemptCountBadge'),
    toggleNumpadBtn: document.getElementById('toggleNumpadBtn'),
    virtualNumpad: document.getElementById('virtualNumpad'),

    // Modals
    victoryModal: document.getElementById('victoryModal'),
    victoryStars: document.getElementById('victoryStars'),
    victoryTitle: document.getElementById('victoryTitle'),
    victorySubtitle: document.getElementById('victorySubtitle'),
    victoryCodeNumber: document.getElementById('victoryCodeNumber'),
    rewardCoins: document.getElementById('rewardCoins'),
    rewardGuesses: document.getElementById('rewardGuesses'),
    rewardBonus: document.getElementById('rewardBonus'),
    victoryAchievementBanner: document.getElementById('victoryAchievementBanner'),
    victoryAchieveTitle: document.getElementById('victoryAchieveTitle'),
    victoryAchieveDesc: document.getElementById('victoryAchieveDesc'),
    victoryMapBtn: document.getElementById('victoryMapBtn'),
    victoryNextBtn: document.getElementById('victoryNextBtn'),

    gameOverModal: document.getElementById('gameOverModal'),
    defeatSecretNumber: document.getElementById('defeatSecretNumber'),
    defeatMapBtn: document.getElementById('defeatMapBtn'),
    defeatRetryBtn: document.getElementById('defeatRetryBtn'),

    trophyModal: document.getElementById('trophyModal'),
    closeTrophyModalBtn: document.getElementById('closeTrophyModalBtn'),
    trophyFillBar: document.getElementById('trophyFillBar'),
    trophyCountTag: document.getElementById('trophyCountTag'),
    trophiesGrid: document.getElementById('trophiesGrid'),

    shopModal: document.getElementById('shopModal'),
    closeShopModalBtn: document.getElementById('closeShopModalBtn'),
    shopGoldDisplay: document.getElementById('shopGoldDisplay'),

    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     Persistence & Storage Helpers
     ========================================================================== */
  function loadSavedData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        gameState = Object.assign({}, gameState, parsed);
      }
    } catch (e) {
      console.warn("Could not load saved data from localStorage", e);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.warn("Could not save data to localStorage", e);
    }
  }

  /* ==========================================================================
     Achievement Management Engine
     ========================================================================== */
  function unlockAchievement(achieveId) {
    if (gameState.achievements.includes(achieveId)) return; // already unlocked

    const def = ACHIEVEMENTS_DEF.find(a => a.id === achieveId);
    if (!def) return;

    gameState.achievements.push(achieveId);
    saveData();
    updateHUD();

    Sound.achievement();

    // Show Toast
    showToast(`🏆 Achievement Unlocked: ${def.title}!`);

    // Mark badge dot on trophy button
    if (DOM.trophyNotificationDot) {
      DOM.trophyNotificationDot.classList.add('active');
    }

    // Spawn confetti celebration
    spawnParticles(window.innerWidth / 2, 100, 25, ['star', 'clover', 'confetti']);
  }

  function checkTrophyConditions(eventType, context = {}) {
    // First win
    if (eventType === 'level_win' && context.level === 1) {
      unlockAchievement('first_win');
    }

    // Sniper (2 or fewer guesses)
    if (eventType === 'level_win' && context.attempts <= 2) {
      unlockAchievement('sniper');
    }

    // Clutch win (last remaining key)
    if (eventType === 'level_win' && context.keysRemaining === 0) {
      unlockAchievement('clutch_win');
    }

    // Boiling hot instinct
    if (eventType === 'level_win' && context.lastProximityWasBoiling) {
      unlockAchievement('boiling');
    }

    // Gold milestones
    if (gameState.gold >= 300) {
      unlockAchievement('gold_300');
    }
    if (gameState.gold >= 1000) {
      unlockAchievement('gold_1000');
    }

    // World completions
    if (eventType === 'level_win') {
      if (context.level === 6) unlockAchievement('world_2');
      if (context.level === 9) unlockAchievement('world_3');
      if (context.level === 12) unlockAchievement('world_4');
      if (context.level === 15) unlockAchievement('game_complete');

      // Check all 3 stars in World 1
      if (
        gameState.levelStars[1] === 3 &&
        gameState.levelStars[2] === 3 &&
        gameState.levelStars[3] === 3
      ) {
        unlockAchievement('all_stars_w1');
      }
    }

    // Potions used
    if (gameState.potionsUsedCount >= 3) {
      unlockAchievement('potions_used');
    }
  }

  function renderTrophiesModal() {
    DOM.trophiesGrid.innerHTML = '';
    let unlockedCount = 0;

    ACHIEVEMENTS_DEF.forEach(achieve => {
      const isUnlocked = gameState.achievements.includes(achieve.id);
      if (isUnlocked) unlockedCount++;

      const card = document.createElement('div');
      card.className = `trophy-card-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="trophy-item-icon">${isUnlocked ? achieve.icon : '🔒'}</div>
        <div class="trophy-item-title">${achieve.title}</div>
        <div class="trophy-item-desc">${achieve.desc}</div>
      `;
      DOM.trophiesGrid.appendChild(card);
    });

    const percent = Math.round((unlockedCount / ACHIEVEMENTS_DEF.length) * 100);
    DOM.trophyFillBar.style.width = `${percent}%`;
    DOM.trophyCountTag.textContent = `${unlockedCount} / ${ACHIEVEMENTS_DEF.length} Unlocked (${percent}%)`;
  }

  /* ==========================================================================
     HUD & UI Updates
     ========================================================================== */
  function updateHUD() {
    DOM.goldCounter.textContent = gameState.gold;
    DOM.shopGoldDisplay.textContent = gameState.gold;

    // Calculate total stars earned
    let totalStars = 0;
    Object.values(gameState.levelStars).forEach(s => {
      totalStars += s;
    });
    DOM.starCounter.textContent = `${totalStars}/45`;

    // Power-up count badges
    DOM.cloverQty.textContent = `x${gameState.potions.clover}`;
    DOM.orbQty.textContent = `x${gameState.potions.orb}`;
    DOM.keyQty.textContent = `x${gameState.potions.key}`;

    DOM.cloverPowerBtn.disabled = gameState.potions.clover <= 0;
    DOM.orbPowerBtn.disabled = gameState.potions.orb <= 0;
    DOM.keyPowerBtn.disabled = gameState.potions.key <= 0;

    // Sound Icon
    DOM.soundIcon.textContent = gameState.soundEnabled ? '🔊' : '🔇';
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(15px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function showReactionFloat(text, color = '#ffca28') {
    DOM.reactionFloat.textContent = text;
    DOM.reactionFloat.style.color = color;
    DOM.reactionFloat.classList.add('show');
    setTimeout(() => {
      DOM.reactionFloat.classList.remove('show');
    }, 1200);
  }

  function setMascotExpression(face, speech) {
    DOM.mascotFace.textContent = face;
    DOM.mascotSpeech.innerHTML = speech;
  }

  /* ==========================================================================
     Map View & Level Select Renderer
     ========================================================================== */
  let activeWorldTab = 1;

  function renderWorldTabs() {
    DOM.worldTabs.innerHTML = '';
    WORLDS.forEach(w => {
      const tab = document.createElement('button');
      tab.className = `world-tab ${w.id === activeWorldTab ? 'active' : ''}`;
      tab.innerHTML = `<span>${w.icon}</span><span>World ${w.id}: ${w.name}</span>`;
      tab.addEventListener('click', () => {
        activeWorldTab = w.id;
        Sound.click();
        renderWorldTabs();
        renderLevelsGrid();
      });
      DOM.worldTabs.appendChild(tab);
    });
  }

  function renderLevelsGrid() {
    DOM.levelsGrid.innerHTML = '';
    const worldObj = WORLDS.find(w => w.id === activeWorldTab);
    if (!worldObj) return;

    worldObj.levels.forEach(lvlNum => {
      const lvlData = LEVELS.find(l => l.level === lvlNum);
      if (!lvlData) return;

      const isUnlocked = gameState.unlockedLevels.includes(lvlNum);
      const starsEarned = gameState.levelStars[lvlNum] || 0;
      const isCurrent = isUnlocked && lvlNum === Math.max(...gameState.unlockedLevels);

      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? '' : 'locked'} ${isCurrent ? 'current-active' : ''}`;
      
      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        starsHtml += `<span class="${s <= starsEarned ? 'star-earned' : ''}">★</span>`;
      }

      card.innerHTML = `
        <div class="level-badge-num">${lvlNum}</div>
        <div class="level-chest-preview">${isUnlocked ? lvlData.icon : '🔒'}</div>
        <div class="level-title">${lvlData.title}</div>
        <div class="level-range-info">Scope: 1 – ${lvlData.max}</div>
        <div class="level-stars">${starsHtml}</div>
        ${!isUnlocked ? '<div class="level-lock-tag">🔒 Locked</div>' : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          Sound.click();
          startLevel(lvlNum);
        });
      }

      DOM.levelsGrid.appendChild(card);
    });
  }

  function switchView(viewName) {
    if (viewName === 'map') {
      DOM.gameView.classList.remove('active-view');
      DOM.mapView.classList.add('active-view');
      renderWorldTabs();
      renderLevelsGrid();
    } else if (viewName === 'game') {
      DOM.mapView.classList.remove('active-view');
      DOM.gameView.classList.add('active-view');
    }
  }

  /* ==========================================================================
     Level Playfield & Session Engine
     ========================================================================== */
  function startLevel(lvlNum) {
    const lvl = LEVELS.find(l => l.level === lvlNum);
    if (!lvl) return;

    gameState.currentLevelNum = lvlNum;
    session.levelData = lvl;
    session.secretNumber = Math.floor(Math.random() * (lvl.max - lvl.min + 1)) + lvl.min;
    session.maxKeys = lvl.keys;
    session.keysRemaining = lvl.keys;
    session.attempts = 0;
    session.minBound = lvl.min;
    session.maxBound = lvl.max;
    session.history = [];
    session.lastProximityWasBoiling = false;
    session.specialCluesGiven = [];

    console.log(`[Lep's Secret]: Level ${lvlNum} Code is: ${session.secretNumber}`);

    // Update Header Arena Info
    const worldObj = WORLDS.find(w => w.id === lvl.world);
    DOM.currentWorldName.textContent = `World ${lvl.world}: ${worldObj.name}`;
    DOM.currentLevelTitle.textContent = `Level ${lvl.level} - ${lvl.title}`;

    // Reset Chest Model
    DOM.chestModel.className = 'chest-model';
    DOM.chestSunburst.classList.remove('burst-active');
    DOM.lockNumberDisplay.textContent = '???';

    // Controls Reset
    DOM.guessInput.min = lvl.min;
    DOM.guessInput.max = lvl.max;
    DOM.guessInput.value = Math.floor((lvl.min + lvl.max) / 2);
    DOM.guessSlider.min = lvl.min;
    DOM.guessSlider.max = lvl.max;
    DOM.guessSlider.value = DOM.guessInput.value;
    DOM.sliderMinTag.textContent = lvl.min;
    DOM.sliderMaxTag.textContent = lvl.max;

    // Reset Clues & Bounds
    DOM.speechRange.textContent = `${lvl.min} and ${lvl.max}`;
    DOM.rangeClueDesc.textContent = `Secret number is between ${lvl.min} and ${lvl.max}`;
    DOM.minPossibleVal.textContent = lvl.min;
    DOM.maxPossibleVal.textContent = lvl.max;
    DOM.thermalFill.style.width = '0%';
    DOM.thermalLabel.textContent = 'Standby';
    DOM.thermalLabel.style.color = '#78909c';
    DOM.specialClueItem.style.display = 'none';

    setMascotExpression('🧙‍♂️', `"Top of the morning! Crack the lock between <strong>${lvl.min} and ${lvl.max}</strong> to claim the shiny loot!"`);

    // Reset History
    DOM.historyList.innerHTML = '<li class="history-empty"><span>No attempts yet. Take a guess to unlock the vault!</span></li>';
    DOM.attemptCountBadge.textContent = '0 Tries';

    // Render Keys
    renderKeyTracker();
    updateHUD();
    switchView('game');
  }

  function renderKeyTracker() {
    DOM.keyTracker.innerHTML = '';
    for (let i = 0; i < session.maxKeys; i++) {
      const keySpan = document.createElement('span');
      keySpan.className = `key-icon ${i < session.keysRemaining ? 'key-active' : 'key-used'}`;
      keySpan.textContent = '🗝️';
      keySpan.title = i < session.keysRemaining ? 'Golden Key Ready' : 'Key Expended';
      DOM.keyTracker.appendChild(keySpan);
    }
  }

  /* ==========================================================================
     Guess Processing, Hint Algorithms & Proximity Radar
     ========================================================================== */
  function handleGuessSubmit() {
    const val = parseInt(DOM.guessInput.value, 10);
    const lvl = session.levelData;

    if (isNaN(val) || val < lvl.min || val > lvl.max) {
      showToast(`Please enter a valid number between ${lvl.min} and ${lvl.max}!`);
      return;
    }

    if (session.keysRemaining <= 0) return;

    session.attempts++;
    const secret = session.secretNumber;
    const diff = Math.abs(val - secret);

    // Shake chest
    DOM.chestModel.classList.remove('shake');
    void DOM.chestModel.offsetWidth; // trigger reflow
    DOM.chestModel.classList.add('shake');
    Sound.rattle();

    // Check WIN
    if (val === secret) {
      handleLevelWin();
      return;
    }

    // Deduct key
    session.keysRemaining--;
    renderKeyTracker();

    // High / Low Direction
    const isHigh = val > secret;
    const directionTag = isHigh ? 'Too High 🔻' : 'Too Low 🔺';
    const tagClass = isHigh ? 'tag-high' : 'tag-low';

    // Update Bounds
    if (isHigh && val < session.maxBound) {
      session.maxBound = val - 1;
    } else if (!isHigh && val > session.minBound) {
      session.minBound = val + 1;
    }
    DOM.minPossibleVal.textContent = session.minBound;
    DOM.maxPossibleVal.textContent = session.maxBound;

    // Thermal Radar Calculation
    let thermalText = '';
    let thermalColor = '';
    let thermalPercent = 0;
    let isBoiling = false;

    if (diff <= 2) {
      thermalText = '💥 BOILING HOT!';
      thermalColor = '#d500f9';
      thermalPercent = 100;
      isBoiling = true;
      Sound.boiling();
      showReactionFloat("💥 BOILING HOT!", "#ff4081");
      setMascotExpression('🤩', `"By the blarney stone, you're RIGHT NEXT to it! Only 1 or 2 away!"`);
    } else if (diff <= 8) {
      thermalText = '🔥 Very Hot';
      thermalColor = '#ff3d00';
      thermalPercent = 80;
      Sound.highLow(isHigh);
      showReactionFloat("🔥 Very Hot!", "#ff6e40");
      setMascotExpression('😃', `"Ooh, sizzling close! Narrow your aim just a wee bit!"`);
    } else if (diff <= 20) {
      thermalText = '🌤️ Warm';
      thermalColor = '#ffb300';
      thermalPercent = 55;
      Sound.highLow(isHigh);
      showReactionFloat(directionTag, "#ffd54f");
      setMascotExpression('🧐', `"Getting warmer! The chest's lock is feeling your energy."`);
    } else if (diff <= 45) {
      thermalText = '❄️ Cold';
      thermalColor = '#29b6f6';
      thermalPercent = 30;
      Sound.highLow(isHigh);
      showReactionFloat(directionTag, "#81d4fa");
      setMascotExpression('🤔', `"Chilly breeze... Try ${isHigh ? 'guessing lower' : 'guessing higher'}!"`);
    } else {
      thermalText = '🥶 Freezing';
      thermalColor = '#00e5ff';
      thermalPercent = 12;
      Sound.highLow(isHigh);
      showReactionFloat(directionTag, "#80deea");
      setMascotExpression('🥶', `"Brrr! Freezing cold! The secret number is far ${isHigh ? 'below' : 'above'} that!"`);
    }

    session.lastProximityWasBoiling = isBoiling;

    DOM.thermalFill.style.width = `${thermalPercent}%`;
    DOM.thermalLabel.textContent = thermalText;
    DOM.thermalLabel.style.color = thermalColor;

    // Generate Dynamic Lore / Math Clue on certain failed attempts
    generateDynamicClue(session.attempts);

    // Append to Attempt History
    addHistoryEntry(val, directionTag, tagClass, thermalText);

    // Check LOSE
    if (session.keysRemaining <= 0) {
      setTimeout(() => {
        handleLevelLose();
      }, 700);
    }
  }

  function generateDynamicClue(attemptNum) {
    const secret = session.secretNumber;

    if (attemptNum === 2 && !session.specialCluesGiven.includes('parity')) {
      const isEven = secret % 2 === 0;
      showSpecialClue("Fairy Whisper", `The lock runes reveal: The secret is an <strong>${isEven ? 'EVEN ⚡' : 'ODD ✨'}</strong> number!`);
      session.specialCluesGiven.push('parity');
    } else if (attemptNum === 4 && !session.specialCluesGiven.includes('divisibility')) {
      let divClue = "";
      if (secret % 5 === 0) divClue = "It is a multiple of 5!";
      else if (secret % 3 === 0) divClue = "It is evenly divisible by 3!";
      else if (secret % 7 === 0) divClue = "It is divisible by lucky number 7!";
      else {
        const sumDigits = secret.toString().split('').reduce((a, b) => parseInt(a, 10) + parseInt(b, 10), 0);
        divClue = `The sum of its digits equals <strong>${sumDigits}</strong>!`;
      }
      showSpecialClue("Lep's Ancient Scroll", divClue);
      session.specialCluesGiven.push('divisibility');
    }
  }

  function showSpecialClue(title, htmlDesc) {
    DOM.specialClueTitle.textContent = title;
    DOM.specialClueDesc.innerHTML = htmlDesc;
    DOM.specialClueItem.style.display = 'flex';
  }

  function addHistoryEntry(guessVal, dirTag, tagClass, thermalText) {
    const emptyLi = DOM.historyList.querySelector('.history-empty');
    if (emptyLi) emptyLi.remove();

    const li = document.createElement('li');
    li.className = 'history-entry';
    li.innerHTML = `
      <span class="history-guess-val">#${guessVal}</span>
      <div style="display:flex; gap:6px; align-items:center;">
        <span class="history-feedback-tag ${tagClass}">${dirTag}</span>
        <span style="font-size:0.75rem; font-weight:700; color:#5d4037;">(${thermalText})</span>
      </div>
    `;
    DOM.historyList.prepend(li);
    DOM.attemptCountBadge.textContent = `${session.attempts} ${session.attempts === 1 ? 'Try' : 'Tries'}`;
  }

  /* ==========================================================================
     Win & Loss Handlers
     ========================================================================== */
  function handleLevelWin() {
    Sound.openChest();
    DOM.chestModel.classList.add('opened');
    DOM.chestSunburst.classList.add('burst-active');
    DOM.lockNumberDisplay.textContent = session.secretNumber;

    setMascotExpression('🎉', `"HURRAH! You picked the lock! Look at all that dazzling treasure!"`);

    // Particles explosion from chest
    const rect = DOM.treasureStage.getBoundingClientRect();
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 50, ['coin', 'clover', 'star', 'confetti']);

    // Calculate Star Rating
    const keysUsed = session.attempts;
    let stars = 1;
    if (keysUsed <= 3) stars = 3;
    else if (keysUsed <= 5) stars = 2;

    // Save Stars
    const prevStars = gameState.levelStars[session.levelData.level] || 0;
    if (stars > prevStars) {
      gameState.levelStars[session.levelData.level] = stars;
    }

    // Unlock Next Level
    const nextLvl = session.levelData.level + 1;
    if (nextLvl <= 15 && !gameState.unlockedLevels.includes(nextLvl)) {
      gameState.unlockedLevels.push(nextLvl);
    }

    // Gold Reward Calculation
    const baseGold = session.levelData.goldReward;
    const starBonus = stars * 25;
    const totalGoldEarned = baseGold + starBonus;
    gameState.gold += totalGoldEarned;

    saveData();
    updateHUD();

    // Check Achievements
    checkTrophyConditions('level_win', {
      level: session.levelData.level,
      attempts: session.attempts,
      keysRemaining: session.keysRemaining,
      lastProximityWasBoiling: session.lastProximityWasBoiling
    });

    // Populate Victory Modal
    setTimeout(() => {
      DOM.victoryCodeNumber.textContent = session.secretNumber;
      DOM.rewardCoins.textContent = `+${totalGoldEarned} Gold`;
      DOM.rewardGuesses.textContent = `${session.attempts} ${session.attempts === 1 ? 'Guess' : 'Guesses'}`;
      DOM.rewardBonus.textContent = `+${starBonus} Star Bonus`;

      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        starsHtml += `<span class="star-anim star-${s}" style="color:${s <= stars ? '#ffb300' : '#bdbdbd'}">⭐</span>`;
      }
      DOM.victoryStars.innerHTML = starsHtml;

      DOM.victoryModal.classList.add('active');
    }, 1200);
  }

  function handleLevelLose() {
    Sound.defeat();
    DOM.defeatSecretNumber.textContent = session.secretNumber;
    setMascotExpression('🤦‍♂️', `"Alas! The lock snapped shut and sealed itself! Let's give it another go!"`);
    DOM.gameOverModal.classList.add('active');
  }

  /* ==========================================================================
     Power-Ups System
     ========================================================================== */
  function useCloverPowerup() {
    if (gameState.potions.clover <= 0) {
      showToast("You don't have any Clover Scopes left! Buy more in the shop.");
      return;
    }

    gameState.potions.clover--;
    gameState.potionsUsedCount++;
    saveData();
    updateHUD();
    Sound.powerup();

    // Eliminate 30% of wrong range
    const secret = session.secretNumber;
    const currentSpan = session.maxBound - session.minBound;
    const cutAmount = Math.max(2, Math.floor(currentSpan * 0.25));

    if (secret - session.minBound > session.maxBound - secret) {
      session.minBound = Math.min(secret - 1, session.minBound + cutAmount);
    } else {
      session.maxBound = Math.max(secret + 1, session.maxBound - cutAmount);
    }

    DOM.minPossibleVal.textContent = session.minBound;
    DOM.maxPossibleVal.textContent = session.maxBound;
    showToast(`🍀 Clover Scope activated! Range narrowed to ${session.minBound} - ${session.maxBound}!`);
    showSpecialClue("Clover Scope Activated", `The lucky four-leaf clover banished impossible numbers! Target range: <strong>${session.minBound} to ${session.maxBound}</strong>.`);
    checkTrophyConditions('potion_used');
  }

  function useOrbPowerup() {
    if (gameState.potions.orb <= 0) {
      showToast("You don't have any Mystic Orbs left! Buy more in the shop.");
      return;
    }

    gameState.potions.orb--;
    gameState.potionsUsedCount++;
    saveData();
    updateHUD();
    Sound.powerup();

    const secret = session.secretNumber;
    const isPrime = checkIsPrime(secret);
    const lastDigit = secret % 10;

    const orbClues = [
      `The Mystic Orb reveals: The secret code ends with the digit <strong>${lastDigit}</strong>!`,
      `The Mystic Orb pulses: The secret is <strong>${isPrime ? 'a PRIME number ✨' : 'a COMPOSITE number 🔮'}</strong>!`
    ];
    const chosenClue = orbClues[Math.floor(Math.random() * orbClues.length)];

    showSpecialClue("🔮 Mystic Orb Vision", chosenClue);
    showToast("🔮 Mystic Orb revealed a deep mathematical secret!");
    checkTrophyConditions('potion_used');
  }

  function useKeyPowerup() {
    if (gameState.potions.key <= 0) {
      showToast("You don't have any Skeleton Keys left! Buy more in the shop.");
      return;
    }

    gameState.potions.key--;
    gameState.potionsUsedCount++;
    session.keysRemaining++;
    session.maxKeys++;
    saveData();
    updateHUD();
    Sound.powerup();

    renderKeyTracker();
    showToast("🗝️ Skeleton Key used! +1 Extra Key added!");
    showReactionFloat("+1 Key! 🗝️", "#76ff03");
    checkTrophyConditions('potion_used');
  }

  function checkIsPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  /* ==========================================================================
     Shop Engine
     ========================================================================== */
  function buyShopItem(itemType, cost) {
    if (gameState.gold < cost) {
      showToast("Not enough gold coins in your purse!");
      Sound.defeat();
      return;
    }

    gameState.gold -= cost;
    gameState.potions[itemType] = (gameState.potions[itemType] || 0) + 1;
    saveData();
    updateHUD();
    Sound.coin();

    const itemNames = {
      clover: 'Lucky Clover Scope',
      orb: 'Mystic Divination Orb',
      key: 'Skeleton Key'
    };
    showToast(`Purchased 1x ${itemNames[itemType]}!`);
  }

  /* ==========================================================================
     Event Listeners & Setup
     ========================================================================== */
  function attachEventListeners() {
    // Nav & HUD
    DOM.toggleSoundBtn.addEventListener('click', () => {
      gameState.soundEnabled = !gameState.soundEnabled;
      saveData();
      updateHUD();
      if (gameState.soundEnabled) Sound.click();
    });

    DOM.openTrophiesBtn.addEventListener('click', () => {
      Sound.click();
      if (DOM.trophyNotificationDot) DOM.trophyNotificationDot.classList.remove('active');
      renderTrophiesModal();
      DOM.trophyModal.classList.add('active');
    });

    DOM.closeTrophyModalBtn.addEventListener('click', () => {
      DOM.trophyModal.classList.remove('active');
    });

    DOM.openShopBtn.addEventListener('click', () => {
      Sound.click();
      DOM.shopModal.classList.add('active');
    });

    DOM.closeShopModalBtn.addEventListener('click', () => {
      DOM.shopModal.classList.remove('active');
    });

    // Map Screen Actions
    DOM.playNextLevelBtn.addEventListener('click', () => {
      Sound.click();
      const currentHighest = Math.max(...gameState.unlockedLevels);
      startLevel(currentHighest);
    });

    DOM.backToMapBtn.addEventListener('click', () => {
      Sound.click();
      switchView('map');
    });

    // Input Step Buttons
    DOM.stepDownBtn.addEventListener('click', () => {
      Sound.click();
      let val = parseInt(DOM.guessInput.value, 10) || session.minBound;
      if (val > session.levelData.min) val--;
      DOM.guessInput.value = val;
      DOM.guessSlider.value = val;
    });

    DOM.stepUpBtn.addEventListener('click', () => {
      Sound.click();
      let val = parseInt(DOM.guessInput.value, 10) || session.minBound;
      if (val < session.levelData.max) val++;
      DOM.guessInput.value = val;
      DOM.guessSlider.value = val;
    });

    // Range Slider
    DOM.guessSlider.addEventListener('input', (e) => {
      DOM.guessInput.value = e.target.value;
    });

    DOM.guessInput.addEventListener('input', (e) => {
      DOM.guessSlider.value = e.target.value;
    });

    DOM.guessInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleGuessSubmit();
      }
    });

    DOM.submitGuessBtn.addEventListener('click', handleGuessSubmit);

    // Power-up Buttons
    DOM.cloverPowerBtn.addEventListener('click', useCloverPowerup);
    DOM.orbPowerBtn.addEventListener('click', useOrbPowerup);
    DOM.keyPowerBtn.addEventListener('click', useKeyPowerup);

    // Shop Buy Buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost, 10);
        buyShopItem(item, cost);
      });
    });

    // Virtual Numpad
    DOM.toggleNumpadBtn.addEventListener('click', () => {
      Sound.click();
      const isHidden = DOM.virtualNumpad.style.display === 'none';
      DOM.virtualNumpad.style.display = isHidden ? 'block' : 'none';
      DOM.toggleNumpadBtn.textContent = isHidden ? '📱 Hide On-Screen Keypad' : '📱 Toggle On-Screen Keypad';
    });

    DOM.virtualNumpad.addEventListener('click', (e) => {
      const target = e.target;
      if (!target.classList.contains('num-key')) return;

      Sound.click();
      const val = target.dataset.val;
      const action = target.dataset.action;
      let cur = DOM.guessInput.value.toString();

      if (action === 'clear') {
        DOM.guessInput.value = '';
        DOM.guessSlider.value = session.minBound;
      } else if (action === 'backspace') {
        cur = cur.slice(0, -1);
        DOM.guessInput.value = cur;
        if (cur) DOM.guessSlider.value = cur;
      } else if (val !== undefined) {
        if (cur === '0' || cur === '') cur = val;
        else cur += val;
        DOM.guessInput.value = cur;
        DOM.guessSlider.value = cur;
      }
    });

    // Victory Modal Buttons
    DOM.victoryMapBtn.addEventListener('click', () => {
      DOM.victoryModal.classList.remove('active');
      switchView('map');
    });

    DOM.victoryNextBtn.addEventListener('click', () => {
      DOM.victoryModal.classList.remove('active');
      const nextLvl = session.levelData.level + 1;
      if (nextLvl <= 15) {
        startLevel(nextLvl);
      } else {
        switchView('map');
      }
    });

    // Defeat Modal Buttons
    DOM.defeatMapBtn.addEventListener('click', () => {
      DOM.gameOverModal.classList.remove('active');
      switchView('map');
    });

    DOM.defeatRetryBtn.addEventListener('click', () => {
      DOM.gameOverModal.classList.remove('active');
      startLevel(session.levelData.level);
    });

    // Close Modals on Backdrop Click
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    loadSavedData();
    updateHUD();
    renderWorldTabs();
    renderLevelsGrid();
    attachEventListeners();

    // Check initial gold trophies
    checkTrophyConditions('init');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
