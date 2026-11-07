/**
 * BEASTS: Tactical Tabletop Arena - Game Engine
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Beast Catalog & Archetypes
  // ---------------------------------------------------------------------------
  const BEAST_TEMPLATES = {
    phoenix: {
      id: 'phoenix',
      name: 'Phoenix',
      element: 'fire',
      stars: 4,
      maxHp: 120,
      cardImg: 'Cards/Phoenix_Card.png',
      spriteBase: 'Sprites/Phoenix/Phoenix',
      sprites: {
        idle_down: 'Sprites/Phoenix/Phoenix_idle_down_256x256.png',
        idle_up: 'Sprites/Phoenix/Phoenix_idle_up_256x256.png',
        idle_left: 'Sprites/Phoenix/Phoenix_idle_left_256x256.png',
        idle_right: 'Sprites/Phoenix/Phoenix_idle_right_256x256.png',
        walk_down: 'Sprites/Phoenix/Phoenix_fly_down_256x256.png',
        walk_up: 'Sprites/Phoenix/Phoenix_fly_up_256x256.png',
        walk_left: 'Sprites/Phoenix/Phoenix_fly_left_256x256.png',
        walk_right: 'Sprites/Phoenix/Phoenix_fly_right_256x256.png',
        attack: 'Sprites/Phoenix/Phoenix_attack_flapping_256x256.png',
        attack_left: 'Sprites/Phoenix/Phoenix_attack_left_256x256.png',
        attack_right: 'Sprites/Phoenix/Phoenix_attack_right_256x256.png',
        attack_aoe: 'Sprites/Phoenix/Phoenix_attack_aoe_256x256.png',
        hurt: 'Sprites/Phoenix/Phoenix_hurt_flinch_256x256.png',
        defeated: 'Sprites/Phoenix/Phoenix_defeated_256x256.png'
      },
      baseMove: 3,
      skills: {
        atk1: { name: 'Flaming Talons', range: 1, dmg: 30, type: 'target', desc: 'Deals 30 damage.' },
        atk2: { name: 'Fire Orb', range: 0, type: 'counter_stance', desc: 'Curls into a ball and returns half damage to attacker.' },
        ability: { name: 'Trails of Fire', range: 0, type: 'passive', desc: 'Leaves tile in flame for 2 turns. Flame does 10 damage.' }
      },
      passiveHint: 'Ability: Trails of Fire — Leaves tile in flame for 2 turns. Flame does 10 damage.'
    },

    earth_golem: {
      id: 'earth_golem',
      name: 'Earth Golem',
      element: 'earth',
      stars: 4,
      maxHp: 200,
      cardImg: 'Cards/Earth_Golem_Card.png',
      spriteBase: 'Sprites/Earth_Golem/Earth_Golem',
      sprites: {
        idle_down: 'Sprites/Earth_Golem/Earth_Golem_idle_down_256x256.png',
        idle_up: 'Sprites/Earth_Golem/Earth_Golem_idle_up_256x256.png',
        idle_left: 'Sprites/Earth_Golem/Earth_Golem_idle_left_256x256.png',
        idle_right: 'Sprites/Earth_Golem/Earth_Golem_idle_right_256x256.png',
        walk_down: 'Sprites/Earth_Golem/Earth_Golem_walk_down_256x256.png',
        walk_up: 'Sprites/Earth_Golem/Earth_Golem_walk_up_256x256.png',
        walk_left: 'Sprites/Earth_Golem/Earth_Golem_walk_left_256x256.png',
        walk_right: 'Sprites/Earth_Golem/Earth_Golem_walk_right_256x256.png',
        attack: 'Sprites/Earth_Golem/Earth_Golem_attack_crushing_grip_256x256.png',
        attack_left: 'Sprites/Earth_Golem/Earth_Golem_attack_slam_left_256x256.png',
        attack_right: 'Sprites/Earth_Golem/Earth_Golem_attack_slam_right_256x256.png',
        attack_aoe: 'Sprites/Earth_Golem/Earth_Golem_attack_rock_barrier_256x256.png',
        hurt: 'Sprites/Earth_Golem/Earth_Golem_hurt_damaged_256x256.png',
        defeated: 'Sprites/Earth_Golem/Earth_Golem_defeated_crumbled_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Crushing Grip', range: 1, dmg: 20, immobilize: 1, type: 'target', desc: 'Deals 20 damage. Disables hostile movement on next turn.' },
        atk2: { name: 'Rock Barrier', range: 1, type: 'spawn_barrier', desc: 'Adds stone wall in any cardinal or diagonal direction (Earth-passable only).' },
        ability: { name: 'Terraform', range: 0, type: 'passive', desc: 'Gives an extra tile of movement when on own Rock Barriers.' }
      },
      passiveHint: 'Ability: Terraform — Gives an extra tile of movement when on own Rock Barriers.'
    },

    werewolf: {
      id: 'werewolf',
      name: 'Werewolf',
      element: 'earth',
      stars: 2,
      maxHp: 100,
      cardImg: 'Cards/Werewolf_Card.png',
      spriteBase: 'Sprites/Werewolf/Werewolf',
      sprites: {
        idle_down: 'Sprites/Werewolf/Werewolf_idle_down_256x256.png',
        idle_up: 'Sprites/Werewolf/Werewolf_idle_up_256x256.png',
        idle_left: 'Sprites/Werewolf/Werewolf_idle_left_256x256.png',
        idle_right: 'Sprites/Werewolf/Werewolf_idle_right_256x256.png',
        walk_down: 'Sprites/Werewolf/Werewolf_walk_down_256x256.png',
        walk_up: 'Sprites/Werewolf/Werewolf_walk_up_256x256.png',
        walk_left: 'Sprites/Werewolf/Werewolf_walk_left_256x256.png',
        walk_right: 'Sprites/Werewolf/Werewolf_walk_right_256x256.png',
        attack: 'Sprites/Werewolf/Werewolf_attack_claw_256x256.png',
        attack_left: 'Sprites/Werewolf/Werewolf_attack_left_256x256.png',
        attack_right: 'Sprites/Werewolf/Werewolf_attack_right_256x256.png',
        attack_aoe: 'Sprites/Werewolf/Werewolf_attack_howl_256x256.png',
        hurt: 'Sprites/Werewolf/Werewolf_hurt_reeling_256x256.png',
        defeated: 'Sprites/Werewolf/Werewolf_defeated_fallen_256x256.png'
      },
      baseMove: 3,
      skills: {
        atk1: { name: 'Rip Apart', range: 1, dmg: 20, type: 'target', desc: 'Deals 20 damage.' },
        atk2: { name: 'Retreat', range: 0, moveBuff: 1, type: 'self_move', desc: 'Gives 1 extra tile of movement.' },
        ability: { name: 'Howl', range: 0, atkBuff: 10, duration: 2, type: 'team_buff', desc: 'Boosts allied cards\' attack by 10 to each move.' }
      },
      passiveHint: 'Ability: Howl — Boosts allied cards\' attack by 10 to each move.'
    },

    hydra: {
      id: 'hydra',
      name: 'Hydra',
      element: 'poison',
      stars: 4,
      maxHp: 120,
      cardImg: 'Cards/Hydra_Card.png',
      spriteBase: 'Sprites/Hydra/Hydra',
      sprites: {
        idle_down: 'Sprites/Hydra/Hydra_idle_down_256x256.png',
        idle_up: 'Sprites/Hydra/Hydra_idle_up_256x256.png',
        idle_left: 'Sprites/Hydra/Hydra_idle_left_256x256.png',
        idle_right: 'Sprites/Hydra/Hydra_idle_right_256x256.png',
        walk_down: 'Sprites/Hydra/Hydra_slither_down_256x256.png',
        walk_up: 'Sprites/Hydra/Hydra_slither_up_256x256.png',
        walk_left: 'Sprites/Hydra/Hydra_slither_left_256x256.png',
        walk_right: 'Sprites/Hydra/Hydra_slither_right_256x256.png',
        attack: 'Sprites/Hydra/Hydra_attack_venom_spit_256x256.png',
        attack_left: 'Sprites/Hydra/Hydra_attack_bite_left_256x256.png',
        attack_right: 'Sprites/Hydra/Hydra_attack_bite_right_256x256.png',
        attack_aoe: 'Sprites/Hydra/Hydra_attack_thrash_aoe_256x256.png',
        hurt: 'Sprites/Hydra/Hydra_hurt_damaged_256x256.png',
        defeated: 'Sprites/Hydra/Hydra_defeated_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Venomous Bite', range: 1, dmg: 20, poison: 5, type: 'target', desc: 'Deals 20 damage. Target is poisoned (5 dmg/turn for 2 turns).' },
        atk2: { name: 'Regrowth', range: 0, type: 'passive', desc: 'If Hydra is damaged, it regains 20 HP at beginning of next turn.' },
        ability: { name: 'Swamp Regenerator', range: 0, type: 'passive', desc: 'Any allied card next to the hydra is healed 10 HP at beginning of next turn.' }
      },
      passiveHint: 'Regrowth: If damaged, regains 20 HP next turn. Swamp Regenerator: Adjacent allies heal 10 HP next turn.'
    },

    terra_mother: {
      id: 'terra_mother',
      name: 'Terra-Mother',
      element: 'earth',
      stars: 4,
      maxHp: 100,
      cardImg: 'Cards/Terra_Mother_Card.png',
      spriteBase: 'Sprites/Terra_Mother/Terra_Mother',
      sprites: {
        idle_down: 'Sprites/Terra_Mother/Terra_Mother_idle_down_256x256.png',
        idle_up: 'Sprites/Terra_Mother/Terra_Mother_idle_up_256x256.png',
        idle_left: 'Sprites/Terra_Mother/Terra_Mother_idle_left_256x256.png',
        idle_right: 'Sprites/Terra_Mother/Terra_Mother_idle_right_256x256.png',
        walk_down: 'Sprites/Terra_Mother/Terra_Mother_walk_down_256x256.png',
        walk_up: 'Sprites/Terra_Mother/Terra_Mother_walk_up_256x256.png',
        walk_left: 'Sprites/Terra_Mother/Terra_Mother_walk_left_256x256.png',
        walk_right: 'Sprites/Terra_Mother/Terra_Mother_walk_right_256x256.png',
        attack: 'Sprites/Terra_Mother/Terra_Mother_attack_root_crush_256x256.png',
        attack_left: 'Sprites/Terra_Mother/Terra_Mother_attack_charge_left_256x256.png',
        attack_right: 'Sprites/Terra_Mother/Terra_Mother_attack_charge_right_256x256.png',
        attack_aoe: 'Sprites/Terra_Mother/Terra_Mother_attack_ancient_saplings_256x256.png',
        hurt: 'Sprites/Terra_Mother/Terra_Mother_hurt_damaged_256x256.png',
        defeated: 'Sprites/Terra_Mother/Terra_Mother_defeated_slumped_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Root Crush', range: 1, dmg: 35, type: 'target', desc: 'Deals 35 damage.' },
        atk2: { name: 'Ram', range: 0, type: 'passive_ram', desc: 'After Terra-Mother moves, hostiles in front of her are knocked back 3 tiles.' },
        ability: { name: 'Thorn of Life', range: 0, type: 'passive', desc: 'When Terra-Mother stays in the same place for 3 turns in a row, Thorns grow in a random tile next to or diagonal her.' }
      },
      passiveHint: 'Ram: After moving, hostiles ahead are knocked back 3 tiles. Thorn of Life: Staying in place 3 turns grows Thorns.'
    }
  };

  // ---------------------------------------------------------------------------
  // Game State Engine
  // ---------------------------------------------------------------------------
  class BeastsGame {
    constructor() {
      this.VERSION = '1.11';
      this.COLS = 10;
      this.ROWS = 8;
      this.round = 1;
      this.currentTeam = 1; // 1 = Solar (Player), 2 = Lunar (AI or Hotseat)
      this.mode = 'ai'; // 'ai' or 'hotseat'
      this.units = [];
      this.hazards = {}; // key: `${x},${y}` -> { type, ownerTeam, duration }
      this.selectedUnit = null;
      this.actionMode = null; // 'move', 'atk1', 'atk2', 'ability'
      this.isAiThinking = false;

      // DOM Elements
      this.elCellsLayer = document.getElementById('cells-layer');
      this.elHazardsLayer = document.getElementById('hazards-layer');
      this.elUnitsLayer = document.getElementById('units-layer');
      this.elFxLayer = document.getElementById('fx-layer');
      this.elLog = document.getElementById('combat-log');
      this.elRoster = document.getElementById('roster-list');
      this.elWinnerModal = document.getElementById('winner-modal');

      const verEl = document.getElementById('game-version');
      if (verEl) verEl.textContent = `v${this.VERSION}`;

      this.initBoard();
      this.bindEvents();
      this.initDraft();
      this.openDraftModal();
    }

    // Initialize 10x8 tile grid
    initBoard() {
      this.elCellsLayer.innerHTML = '';
      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.dataset.x = c;
          cell.dataset.y = r;
          cell.addEventListener('click', () => this.handleCellClick(c, r));
          this.elCellsLayer.appendChild(cell);
        }
      }
    }

    // Spawn 6 beasts (3 for each team) from draft picks
    initUnits(team1Picks = ['phoenix', 'earth_golem', 'hydra'], team2Picks = ['werewolf', 'hydra', 'earth_golem']) {
      // 3 selections for each team:
      // Player's team (Team 1) starts on the left column (X = 0) in central tiles (Y = 2, 3, 4)
      // Hostile team (Team 2) starts on the far right column (X = 9) in central tiles (Y = 2, 3, 4)
      const centralRows = [2, 3, 4];
      this.units = [];

      team1Picks.forEach((tmplId, idx) => {
        const y = centralRows[idx] !== undefined ? centralRows[idx] : 2 + idx;
        this.units.push(this.createUnitInstance(tmplId, 1, 0, y));
      });

      team2Picks.forEach((tmplId, idx) => {
        const y = centralRows[idx] !== undefined ? centralRows[idx] : 2 + idx;
        this.units.push(this.createUnitInstance(tmplId, 2, 9, y));
      });
    }

    createUnitInstance(templateId, team, x, y) {
      const tmpl = BEAST_TEMPLATES[templateId];
      return {
        ...tmpl,
        instanceId: `${templateId}_${team}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        team: team,
        x: x,
        y: y,
        hp: tmpl.maxHp,
        shield: 0,
        movesLeft: tmpl.baseMove,
        hasActed: false,
        facing: team === 1 ? 'right' : 'left',
        animState: 'idle',
        stationaryTurns: 0,
        hasMovedThisTurn: false,
        status: {
          immobilized: 0,
          howlBuff: 0,
          poisoned: 0,
          tookDamageLastTurn: false
        }
      };
    }

    // -------------------------------------------------------------------------
    // Event Listeners & UI Binding
    // -------------------------------------------------------------------------
    bindEvents() {
      // Ability buttons
      document.getElementById('btn-move').addEventListener('click', () => this.setActionMode('move'));
      document.getElementById('btn-atk1').addEventListener('click', () => this.setActionMode('atk1'));
      document.getElementById('btn-atk2').addEventListener('click', () => {
        const u = this.selectedUnit;
        if (u && (u.skills.atk2.type === 'counter_stance' || u.skills.atk2.type === 'self_move' || u.skills.atk2.type === 'passive' || u.skills.atk2.type === 'passive_ram')) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        } else {
          this.setActionMode('atk2');
        }
      });
      document.getElementById('btn-ability').addEventListener('click', () => {
        const u = this.selectedUnit;
        if (u && (u.skills.ability.type === 'team_buff' || u.skills.ability.type === 'passive')) {
          this.attemptAbility(u, u.x, u.y);
        } else {
          this.setActionMode('ability');
        }
      });
      document.getElementById('btn-end-turn').addEventListener('click', () => this.endTurn());

      // Header controls
      document.getElementById('btn-mode').addEventListener('click', () => {
        this.mode = this.mode === 'ai' ? 'hotseat' : 'ai';
        document.getElementById('mode-label').textContent = this.mode === 'ai' ? 'Solo vs AI' : '2P Hotseat';
        this.log(`Game mode changed to ${this.mode === 'ai' ? 'Solo vs AI' : '2-Player Hotseat'}.`, 'system');
      });

      document.getElementById('btn-sound').addEventListener('click', (e) => {
        const enabled = window.sounds.toggle();
        e.target.textContent = enabled ? '🔊' : '🔇';
      });

      document.getElementById('btn-reset').addEventListener('click', () => this.resetMatch());
      document.getElementById('btn-rematch').addEventListener('click', () => this.resetMatch());
      document.getElementById('btn-clear-log').addEventListener('click', () => {
        this.elLog.innerHTML = '<div class="log-entry system">Log cleared.</div>';
      });

      // Mobile Drawer Controls
      const cardPanel = document.getElementById('card-panel');
      const logPanel = document.getElementById('log-panel');
      const drawerBackdrop = document.getElementById('drawer-backdrop');
      const btnToggleCard = document.getElementById('btn-toggle-card');
      const btnToggleLog = document.getElementById('btn-toggle-log');
      const btnCloseCard = document.getElementById('btn-close-card');
      const btnCloseLog = document.getElementById('btn-close-log');

      const closeAllDrawers = () => {
        cardPanel?.classList.remove('open');
        logPanel?.classList.remove('open');
        drawerBackdrop?.classList.add('hidden');
      };
      this.closeMobileDrawers = closeAllDrawers;

      if (btnToggleCard) {
        btnToggleCard.addEventListener('click', () => {
          const isOpen = cardPanel?.classList.contains('open');
          closeAllDrawers();
          if (!isOpen && cardPanel) {
            cardPanel.classList.add('open');
            drawerBackdrop?.classList.remove('hidden');
          }
        });
      }

      if (btnToggleLog) {
        btnToggleLog.addEventListener('click', () => {
          const isOpen = logPanel?.classList.contains('open');
          closeAllDrawers();
          if (!isOpen && logPanel) {
            logPanel.classList.add('open');
            drawerBackdrop?.classList.remove('hidden');
          }
        });
      }

      btnCloseCard?.addEventListener('click', closeAllDrawers);
      btnCloseLog?.addEventListener('click', closeAllDrawers);
      drawerBackdrop?.addEventListener('click', closeAllDrawers);

      // Option B: Quick beast switcher chips
      document.querySelectorAll('.beast-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const unitId = chip.dataset.unit;
          const target = this.units.find(u => u.id === unitId);
          if (target && target.hp > 0) {
            this.selectUnit(target);
          }
        });
      });

      // Keyboard shortcuts (Space = End Turn, 1..4 = Abilities)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          this.endTurn();
        } else if (e.key === '1') {
          this.setActionMode('move');
        } else if (e.key === '2') {
          this.setActionMode('atk1');
        } else if (e.key === '3') {
          const u = this.selectedUnit;
          if (u && (u.skills.atk2.type === 'counter_stance' || u.skills.atk2.type === 'self_move' || u.skills.atk2.type === 'passive' || u.skills.atk2.type === 'passive_ram')) {
            this.attemptAttack(u, 'atk2', u.x, u.y);
          } else {
            this.setActionMode('atk2');
          }
        } else if (e.key === '4') {
          const u = this.selectedUnit;
          if (u && (u.skills.ability.type === 'team_buff' || u.skills.ability.type === 'passive')) {
            this.attemptAbility(u, u.x, u.y);
          } else {
            this.setActionMode('ability');
          }
        }
      });
    }

    // -------------------------------------------------------------------------
    // Selection & Action Mode
    // -------------------------------------------------------------------------
    selectUnit(unit) {
      if (this.isAiThinking) return;
      this.selectedUnit = unit;
      window.sounds.playClick();
      this.updateCardDossier(unit);
      this.updateActionDock();

      // Automatically default to move mode when switching to a friendly beast with moves available
      if (unit && unit.team === this.currentTeam && unit.movesLeft > 0 && (!unit.status.immobilized || unit.status.immobilized === 0)) {
        this.setActionMode('move', true, true);
      } else {
        this.setActionMode(null, true, true);
      }
      this.render();
    }

    setActionMode(mode, force = false, silent = false) {
      if (!this.selectedUnit) return;
      if (this.selectedUnit.team !== this.currentTeam) {
        this.actionMode = null;
        this.renderHighlights();
        return;
      }

      if (!force && this.actionMode === mode) {
        this.actionMode = null; // Toggle off
      } else {
        this.actionMode = mode;
      }

      if (!silent) window.sounds.playClick();
      this.updateActionDockButtons();
      this.renderHighlights();
    }

    updateCardDossier(unit) {
      if (!unit) return;
      document.getElementById('card-img').src = unit.cardImg;
      const pct = Math.max(0, Math.min(100, Math.round((unit.hp / unit.maxHp) * 100)));
      const fill = document.getElementById('card-hp-fill');
      fill.style.width = `${pct}%`;
      fill.className = pct < 30 ? 'hp-bar-inner low' : 'hp-bar-inner';
      document.getElementById('card-hp-text').textContent = `${unit.hp} / ${unit.maxHp} HP ${unit.shield > 0 ? `(+${unit.shield} Guard)` : ''}`;

      document.getElementById('status-name').textContent = unit.name;
      const elTag = document.getElementById('status-element');
      elTag.textContent = unit.element;
      elTag.className = `element-tag ${unit.element}`;

      // Moves left indicator
      const movesTag = document.getElementById('status-moves-tag');
      if (movesTag) {
        if (unit.team !== this.currentTeam) {
          movesTag.textContent = 'Hostile (Inspect)';
          movesTag.className = 'moves-tag hostile';
        } else {
          movesTag.textContent = `${unit.movesLeft} Moves`;
          movesTag.className = unit.movesLeft > 0 ? 'moves-tag' : 'moves-tag spent';
        }
      }

      // Move briefs (Option B)
      const b1 = document.getElementById('brief-move1');
      const b2 = document.getElementById('brief-move2');
      const ba = document.getElementById('brief-ability');
      if (b1 && unit.skills.atk1) b1.innerHTML = `<b>⚔️ ${unit.skills.atk1.name}:</b> ${unit.skills.atk1.desc}`;
      if (b2 && unit.skills.atk2) b2.innerHTML = `<b>⚡ ${unit.skills.atk2.name}:</b> ${unit.skills.atk2.desc}`;
      if (ba && unit.skills.ability) ba.innerHTML = `<b>🌟 ${unit.skills.ability.name}:</b> ${unit.skills.ability.desc}`;

      // Update beast switcher chips active state
      document.querySelectorAll('.beast-chip').forEach(chip => {
        if (chip.dataset.instance) {
          chip.classList.toggle('active', chip.dataset.instance === unit.instanceId);
        } else {
          chip.classList.toggle('active', chip.dataset.unit === unit.id);
        }
      });

      // Populate buff badges
      const buffContainer = document.getElementById('status-buffs');
      buffContainer.innerHTML = '';
      if (unit.status.immobilized > 0) {
        buffContainer.innerHTML += `<span class="buff-badge debuff">⛓️ Immobilized (${unit.status.immobilized})</span>`;
      }
      if (unit.status.howlBuff > 0) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🐺 Howl (+10 Dmg)</span>`;
      }
      if (unit.status.poisoned > 0) {
        buffContainer.innerHTML += `<span class="buff-badge debuff">🧪 Poisoned (${unit.status.poisoned})</span>`;
      }
      if (unit.status.fireOrb) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🔥 Fire Orb (Reflect 50% Dmg)</span>`;
      }
      if (unit.shield > 0) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🛡️ Rock Shield (${unit.shield})</span>`;
      }
      if (buffContainer.innerHTML === '') {
        buffContainer.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">No active effects</span>';
      }
    }

    updateActionDock() {
      const u = this.selectedUnit;
      if (!u) {
        document.getElementById('active-avatar').style.backgroundImage = 'none';
        document.getElementById('active-name').textContent = 'Select a Beast';
        document.getElementById('active-moves-left').textContent = 'Moves: 0';
        document.getElementById('active-passive-hint').textContent = 'Click on any friendly piece to act.';
        return;
      }

      const isHostile = u.team !== this.currentTeam;

      document.getElementById('active-avatar').style.backgroundImage = `url(${u.sprites.idle_down})`;
      document.getElementById('active-name').textContent = isHostile ? `${u.name} (Hostile)` : u.name;
      document.getElementById('active-moves-left').textContent = isHostile ? `Hostile Beast` : `Moves: ${u.movesLeft}`;
      document.getElementById('active-passive-hint').textContent = isHostile 
        ? `Inspecting enemy beast (Viewing info only). Click any friendly beast to resume actions.` 
        : u.passiveHint;

      // Update button labels from template
      document.getElementById('atk1-title').textContent = u.skills.atk1.name;
      document.getElementById('atk1-desc').textContent = u.skills.atk1.desc;
      document.getElementById('atk2-title').textContent = u.skills.atk2.name;
      document.getElementById('atk2-desc').textContent = u.skills.atk2.desc;
      document.getElementById('ability-title').textContent = u.skills.ability.name;
      document.getElementById('ability-desc').textContent = u.skills.ability.desc;

      this.updateActionDockButtons();
    }

    updateActionDockButtons() {
      const u = this.selectedUnit;
      const isMyTurn = u && u.team === this.currentTeam && !this.isAiThinking;

      const btnMove = document.getElementById('btn-move');
      const btnAtk1 = document.getElementById('btn-atk1');
      const btnAtk2 = document.getElementById('btn-atk2');
      const btnAbility = document.getElementById('btn-ability');

      btnMove.disabled = !isMyTurn || u.movesLeft <= 0 || u.status.immobilized > 0;
      btnAtk1.disabled = !isMyTurn || u.hasActed;
      btnAtk2.disabled = !isMyTurn || u.hasActed;
      btnAbility.disabled = !isMyTurn || u.hasActed;

      // Toggle active visual state
      btnMove.classList.toggle('active', this.actionMode === 'move');
      btnAtk1.classList.toggle('active', this.actionMode === 'atk1');
      btnAtk2.classList.toggle('active', this.actionMode === 'atk2');
      btnAbility.classList.toggle('active', this.actionMode === 'ability');
    }

    // -------------------------------------------------------------------------
    // Cell Clicks & Action Execution
    // -------------------------------------------------------------------------
    handleCellClick(x, y) {
      if (this.isAiThinking) return;

      const unitAtCell = this.getUnitAt(x, y);

      // 1. If clicked on an ally, switch active control to that ally
      if (unitAtCell && unitAtCell.team === this.currentTeam) {
        this.selectUnit(unitAtCell);
        return;
      }

      // 2. If friendly unit is active and an action mode is engaged, attempt action if target is valid
      if (this.selectedUnit && this.selectedUnit.team === this.currentTeam && this.actionMode) {
        if (this.actionMode === 'atk1' || this.actionMode === 'atk2') {
          const skill = this.selectedUnit.skills[this.actionMode];
          const validTargets = this.getValidAttackTargets(this.selectedUnit, skill);
          if (validTargets.some(t => t.x === x && t.y === y)) {
            this.attemptAttack(this.selectedUnit, this.actionMode, x, y);
            return;
          }
        } else if (this.actionMode === 'move') {
          const validMoves = this.getValidMoves(this.selectedUnit);
          if (validMoves.some(m => m.x === x && m.y === y)) {
            this.attemptMove(this.selectedUnit, x, y);
            return;
          }
        } else if (this.actionMode === 'ability') {
          this.attemptAbility(this.selectedUnit, x, y);
          return;
        }
      }

      // 3. If clicked on an enemy / hostile beast at any time, select to view their info only!
      if (unitAtCell && unitAtCell.team !== this.currentTeam) {
        this.selectUnit(unitAtCell);
        return;
      }
    }

    // -------------------------------------------------------------------------
    // Movement Logic
    // -------------------------------------------------------------------------
    attemptMove(unit, targetX, targetY) {
      if (unit.movesLeft <= 0 || unit.status.immobilized > 0) {
        this.spawnFloatingText(unit.x, unit.y, 'IMMOBILIZED!', 'status');
        return;
      }

      const validMoves = this.getValidMoves(unit);
      const isTargetValid = validMoves.some(m => m.x === targetX && m.y === targetY);

      if (!isTargetValid) return;

      // Calculate path (Manhattan step-by-step for Trails of Fire and animations)
      const path = this.findPath(unit.x, unit.y, targetX, targetY, unit);
      if (!path || path.length === 0) return;

      this.executeUnitMove(unit, path);
    }

    executeUnitMove(unit, path, onComplete) {
      const stepInterval = this.isAiThinking ? 280 : 140;
      let stepIdx = 0;

      const moveStep = () => {
        if (stepIdx >= path.length) {
          unit.movesLeft = Math.max(0, unit.movesLeft - path.length);
          unit.animState = 'idle';
          unit.hasMovedThisTurn = true;
          unit.stationaryTurns = 0;

          // Terra-Mother Ram: After Terra-Mother moves, hostiles in front of her are knocked back 3 tiles!
          if (unit.id === 'terra_mother' && path.length > 0) {
            const dx = unit.facing === 'right' ? 1 : (unit.facing === 'left' ? -1 : 0);
            const dy = unit.facing === 'down' ? 1 : (unit.facing === 'up' ? -1 : 0);
            const frontX = unit.x + dx;
            const frontY = unit.y + dy;
            const target = this.getUnitAt(frontX, frontY);
            if (target && target.team !== unit.team && target.hp > 0) {
              let currX = target.x;
              let currY = target.y;
              let pushedTiles = 0;
              for (let k = 1; k <= 3; k++) {
                const nx = currX + dx;
                const ny = currY + dy;
                if (nx < 0 || nx >= this.COLS || ny < 0 || ny >= this.ROWS) break;
                const obsHazard = this.getHazardAt(nx, ny);
                if (obsHazard && obsHazard.type === 'rock_barrier') break;
                if (this.getUnitAt(nx, ny)) break;
                currX = nx;
                currY = ny;
                pushedTiles++;
              }
              if (pushedTiles > 0) {
                target.x = currX;
                target.y = currY;
                window.sounds.playRock();
                this.spawnFloatingText(target.x, target.y, `RAMMED! -${pushedTiles} TILES`, 'status');
                this.log(`💥 Ram: Terra-Mother rammed ${target.name}, knocking them back ${pushedTiles} tiles!`, 'attack');
                this.renderUnits();
              }
            }
          }

          // Terraform bonus: Earth Golem stepping onto a Rock Barrier gains +1 extra move!
          const hazardHere = this.getHazardAt(unit.x, unit.y);
          if (unit.id === 'earth_golem' && hazardHere && hazardHere.type === 'rock_barrier') {
            unit.movesLeft += 1;
            this.spawnFloatingText(unit.x, unit.y, '+1 TERRAFORM MOVE', 'status');
            this.log(`Earth Golem draws strength from the stone wall (+1 Move)!`, 'system');
          }

          // Check if landed on Fire Tile (Card: "Flame does 10 damage")
          if (hazardHere && hazardHere.type === 'fire' && unit.element !== 'fire') {
            unit.hp = Math.max(0, unit.hp - 10);
            window.sounds.playFire();
            this.spawnFloatingText(unit.x, unit.y, '-10 FIRE', 'damage');
            this.log(`${unit.name} stepped into fire taking 10 flame damage!`, 'attack');
          }

          // Check if landed on Thorns Tile (Thorn of Life)
          if (hazardHere && hazardHere.type === 'thorns' && unit.element !== 'earth') {
            unit.hp = Math.max(0, unit.hp - 15);
            window.sounds.playHit();
            this.spawnFloatingText(unit.x, unit.y, '-15 THORNS', 'damage');
            this.log(`${unit.name} stepped into sharp thorns taking 15 piercing damage!`, 'attack');
            // Heal Terra-Mother if on the opposing team
            const tmAllies = this.units.filter(u => u.id === 'terra_mother' && u.hp > 0 && u.team !== unit.team);
            tmAllies.forEach(tm => {
              tm.hp = Math.min(tm.maxHp, tm.hp + 15);
              this.spawnFloatingText(tm.x, tm.y, '+15 THORN LIFE', 'heal');
              this.log(`🌿 Thorn of Life restored 15 HP to Terra-Mother!`, 'system');
            });
          }

          this.render();
          this.updateCardDossier(unit);
          this.updateActionDock();

          if (unit.movesLeft === 0) {
            this.setActionMode(null);
            // If unit already acted and moves reached 0, shift to next ready beast
            if (unit.hasActed && unit.team === this.currentTeam && !this.isAiThinking) {
              const nextReady = this.units.find(u => u.team === this.currentTeam && u.hp > 0 && u !== unit && this.hasViableOptions(u));
              if (nextReady) {
                setTimeout(() => {
                  this.selectUnit(nextReady);
                  this.log(`Active command shifted to ${nextReady.name} (Ready to act).`, 'system');
                }, 350);
              } else {
                const endBtn = document.getElementById('btn-end-turn');
                if (endBtn) endBtn.classList.add('pulse-ready');
              }
            }
          } else {
            this.renderHighlights();
          }

          if (onComplete) onComplete();
          return;
        }

        const nextStep = path[stepIdx];
        const prevX = unit.x;
        const prevY = unit.y;

        // Facing direction & walk animation state
        unit.animState = 'walk';
        if (nextStep.x > prevX) unit.facing = 'right';
        else if (nextStep.x < prevX) unit.facing = 'left';
        else if (nextStep.y > prevY) unit.facing = 'down';
        else if (nextStep.y < prevY) unit.facing = 'up';

        // Phoenix Passive: Trails of Fire (leaves fire tile on vacated space)
        if (unit.id === 'phoenix') {
          this.addHazard(prevX, prevY, 'fire', 2);
          window.sounds.playFire();
        }

        unit.x = nextStep.x;
        unit.y = nextStep.y;
        window.sounds.playMove();

        this.renderUnits();
        stepIdx++;
        setTimeout(moveStep, stepInterval);
      };

      moveStep();
    }

    getValidMoves(unit) {
      if (unit.status.immobilized > 0 || unit.movesLeft <= 0) return [];
      const moves = [];
      const visited = new Set();
      const queue = [{ x: unit.x, y: unit.y, dist: 0 }];
      visited.add(`${unit.x},${unit.y}`);

      while (queue.length > 0) {
        const { x, y, dist } = queue.shift();
        if (dist > 0) {
          moves.push({ x, y });
        }

        if (dist < unit.movesLeft) {
          const neighbors = [
            { x: x + 1, y: y }, { x: x - 1, y: y },
            { x: x, y: y + 1 }, { x: x, y: y - 1 }
          ];

          for (const n of neighbors) {
            if (n.x >= 0 && n.x < this.COLS && n.y >= 0 && n.y < this.ROWS) {
              const key = `${n.x},${n.y}`;
              if (!visited.has(key)) {
                visited.add(key);
                // Check obstacle collision
                const unitObstacle = this.getUnitAt(n.x, n.y);
                const hazard = this.getHazardAt(n.x, n.y);

                // Rock Barrier blocks movement for non-Earth types!
                const isBlockedByBarrier = hazard && hazard.type === 'rock_barrier' && unit.element !== 'earth';

                if (!unitObstacle && !isBlockedByBarrier) {
                  queue.push({ x: n.x, y: n.y, dist: dist + 1 });
                }
              }
            }
          }
        }
      }
      return moves;
    }

    findPath(startX, startY, targetX, targetY, unit) {
      const queue = [[{ x: startX, y: startY }]];
      const visited = new Set([`${startX},${startY}`]);

      while (queue.length > 0) {
        const path = queue.shift();
        const curr = path[path.length - 1];

        if (curr.x === targetX && curr.y === targetY) {
          return path.slice(1); // Exclude starting position
        }

        const neighbors = [
          { x: curr.x + 1, y: curr.y }, { x: curr.x - 1, y: curr.y },
          { x: curr.x, y: curr.y + 1 }, { x: curr.x, y: curr.y - 1 }
        ];

        for (const n of neighbors) {
          if (n.x >= 0 && n.x < this.COLS && n.y >= 0 && n.y < this.ROWS) {
            const key = `${n.x},${n.y}`;
            if (!visited.has(key)) {
              visited.add(key);
              const unitObstacle = this.getUnitAt(n.x, n.y);
              const hazard = this.getHazardAt(n.x, n.y);
              const isBlockedByBarrier = hazard && hazard.type === 'rock_barrier' && unit.element !== 'earth';

              // Can only walk onto target if it's empty, and path cannot cross obstacles
              if ((!unitObstacle || (n.x === targetX && n.y === targetY)) && !isBlockedByBarrier) {
                queue.push([...path, n]);
              }
            }
          }
        }
      }
      return null;
    }

    // -------------------------------------------------------------------------
    // Combat & Ability Resolution
    // -------------------------------------------------------------------------
    attemptAttack(unit, skillKey, targetX, targetY) {
      if (unit.hasActed) return;
      const skill = unit.skills[skillKey];
      if (!skill) return;

      const validTargets = this.getValidAttackTargets(unit, skill);
      const isTargetValid = validTargets.some(t => t.x === targetX && t.y === targetY);

      if (!isTargetValid) return;

      // Special Phoenix Move 2: FIRE ORB (Counter Stance: "Curls into a ball and returns half damage to attacker")
      if (skill.type === 'counter_stance') {
        unit.status.fireOrb = true;
        window.sounds.playFire();
        unit.animState = 'attack_aoe';
        unit.hasActed = true;
        this.spawnFloatingText(unit.x, unit.y, 'FIRE ORB ACTIVE!', 'status');
        this.log(`🔥 ${unit.name} curls into a Fire Orb! Will return half damage to any attacker.`, 'system');
        this.finishAction(unit);
        return;
      }

      // Special Werewolf Move 2: RETREAT ("Gives 1 extra tile of movement")
      if (skill.type === 'self_move') {
        unit.movesLeft += (skill.moveBuff || 1);
        window.sounds.playMove();
        unit.animState = 'walk';
        unit.hasActed = true;
        this.spawnFloatingText(unit.x, unit.y, '+1 MOVE (RETREAT)', 'status');
        this.log(`🐺 ${unit.name} uses Retreat! Gains 1 extra tile of movement.`, 'system');
        this.finishAction(unit);
        return;
      }

      // Special Hydra Move 2: REGROWTH (Passive Check)
      if (skill.type === 'passive' && unit.id === 'hydra') {
        this.spawnFloatingText(unit.x, unit.y, 'REGROWTH PASSIVE', 'heal');
        this.log(`🐍 Hydra's Regrowth is passive: If damaged, it regains 20 HP at beginning of next turn.`, 'system');
        return;
      }

      // Special Terra-Mother Move 2: RAM (Passive Check)
      if (skill.type === 'passive_ram') {
        this.spawnFloatingText(unit.x, unit.y, 'RAM PASSIVE', 'status');
        this.log(`💥 Terra-Mother's Ram is passive: After moving, hostiles in front of her are knocked back 3 tiles!`, 'system');
        return;
      }

      // Special Rock Barrier Spawning (Earth Golem Move 2: "Adds a stone wall in any cardinal or diagonal direction")
      if (skill.type === 'spawn_barrier') {
        if (targetX > unit.x) unit.facing = 'right';
        else if (targetX < unit.x) unit.facing = 'left';
        else if (targetY > unit.y) unit.facing = 'down';
        else if (targetY < unit.y) unit.facing = 'up';

        this.addHazard(targetX, targetY, 'rock_barrier', 99);
        window.sounds.playRock();
        unit.animState = 'attack_aoe';
        unit.hasActed = true;
        this.spawnFloatingText(targetX, targetY, 'STONE WALL!', 'status');
        this.log(`🗿 ${unit.name} raised a Rock Barrier at (${targetX}, ${targetY}) that only Earth types can move on!`, 'barrier');
        this.finishAction(unit);
        return;
      }

      const targetUnit = this.getUnitAt(targetX, targetY);
      if (!targetUnit || targetUnit.team === unit.team) return;

      // Calculate Damage (+10 Howl buff if active)
      let damage = skill.dmg || 20;
      if (unit.status.howlBuff > 0) {
        damage += 10;
        this.log(`🐺 Howl boost amplified damage by +10!`, 'system');
      }

      // Play Sound & Sprite Animation
      if (unit.id === 'phoenix') window.sounds.playFire();
      else if (unit.id === 'earth_golem') window.sounds.playRock();
      else if (unit.id === 'werewolf') window.sounds.playHit();
      else if (unit.id === 'hydra') window.sounds.playPoison();
      else if (unit.id === 'terra_mother') window.sounds.playRock();

      // Orient attacker towards target
      if (targetX > unit.x) unit.facing = 'right';
      else if (targetX < unit.x) unit.facing = 'left';
      else if (targetY > unit.y) unit.facing = 'down';
      else if (targetY < unit.y) unit.facing = 'up';

      unit.animState = skill.type === 'aoe' ? 'attack_aoe' : 'attack';
      targetUnit.animState = 'hurt';

      this.dealDamage(targetUnit, damage, `${unit.name} (${skill.name})`, unit);

      // Crushing Grip: Disable hostile movement next turn!
      if (skill.immobilize) {
        targetUnit.status.immobilized = skill.immobilize;
        this.spawnFloatingText(targetUnit.x, targetUnit.y, 'IMMOBILIZED!', 'status');
        this.log(`⛓️ ${targetUnit.name} is trapped in Crushing Grip! Movement disabled on its next turn.`, 'attack');
      }

      // Venomous Bite: Acid poison (5 dmg/turn for 2 turns)
      if (skill.poison) {
        targetUnit.status.poisoned = 2;
        this.spawnFloatingText(targetUnit.x, targetUnit.y, 'POISONED (5/TURN)', 'status');
        this.log(`🧪 ${targetUnit.name} was poisoned by Venomous Bite! Takes 5 damage per turn for 2 turns.`, 'attack');
      }

      unit.hasActed = true;
      this.finishAction(unit);
    }

    attemptAbility(unit, targetX, targetY) {
      if (unit.hasActed) return;

      // Werewolf Ability: HOWL ("Boosts allied cards' attack by 10 to each move.")
      if (unit.id === 'werewolf') {
        window.sounds.playHowl();
        unit.animState = 'attack_aoe';
        const allies = this.units.filter(u => u.team === unit.team && u.hp > 0);
        allies.forEach(a => {
          a.status.howlBuff = 2;
          this.spawnFloatingText(a.x, a.y, 'HOWL BUFF (+10 ATK)', 'status');
        });
        this.log(`🐺 Werewolf lets loose a piercing HOWL! Boosts allied cards' attack by 10 to each move.`, 'heal');
        unit.hasActed = true;
        this.finishAction(unit);
        return;
      }

      // Phoenix Ability: TRAILS OF FIRE
      if (unit.id === 'phoenix') {
        window.sounds.playFire();
        this.spawnFloatingText(unit.x, unit.y, 'TRAILS OF FIRE', 'status');
        this.log(`🔥 Phoenix Ability — Trails of Fire: Leaves tile in flame for 2 turns. Flame does 10 damage.`, 'system');
        return;
      }

      // Earth Golem Ability: TERRAFORM
      if (unit.id === 'earth_golem') {
        window.sounds.playRock();
        this.spawnFloatingText(unit.x, unit.y, 'TERRAFORM ACTIVE', 'status');
        this.log(`🗿 Earth Golem Ability — Terraform: Gives an extra tile of movement when Earth Golem is on his own Rock Barriers.`, 'system');
        return;
      }

      // Hydra Ability: SWAMP REGENERATOR
      if (unit.id === 'hydra') {
        window.sounds.playHeal();
        this.spawnFloatingText(unit.x, unit.y, 'SWAMP REGEN ACTIVE', 'heal');
        this.log(`🌱 Hydra Ability — Swamp Regenerator: Any allied card next to the hydra is healed 10 HP at the beginning of next turn.`, 'system');
        return;
      }

      // Terra-Mother Ability: THORN OF LIFE
      if (unit.id === 'terra_mother') {
        window.sounds.playHeal();
        this.spawnFloatingText(unit.x, unit.y, 'THORN OF LIFE', 'heal');
        this.log(`🌹 Terra-Mother Ability — Thorn of Life: When staying in the same place for 3 turns in a row, Thorns grow in a random adjacent or diagonal tile.`, 'system');
        return;
      }
    }

    dealDamage(target, amount, sourceName, attacker = null) {
      let remaining = amount;
      if (target.shield > 0) {
        const absorbed = Math.min(target.shield, remaining);
        target.shield -= absorbed;
        remaining -= absorbed;
        this.spawnFloatingText(target.x, target.y, `-${absorbed} GUARD`, 'status');
      }

      if (remaining > 0) {
        target.hp = Math.max(0, target.hp - remaining);
        target.status.tookDamageLastTurn = true;
        this.spawnFloatingText(target.x, target.y, `-${remaining}`, 'damage');
        this.log(`${target.name} takes ${remaining} damage from ${sourceName}! (HP: ${target.hp}/${target.maxHp})`, 'attack');

        // Phoenix Card Move 2: FIRE ORB ("Curls into a ball and returns half damage to attacker")
        if (target.status.fireOrb && attacker && attacker !== target && attacker.hp > 0) {
          const returnedDmg = Math.max(1, Math.round(remaining / 2));
          attacker.hp = Math.max(0, attacker.hp - returnedDmg);
          attacker.status.tookDamageLastTurn = true;
          window.sounds.playFire();
          this.spawnFloatingText(attacker.x, attacker.y, `-${returnedDmg} REFLECT`, 'damage');
          this.log(`🔥 Phoenix's Fire Orb returned ${returnedDmg} damage (half damage) to ${attacker.name}!`, 'attack');
          if (attacker.hp === 0) {
            this.eliminateUnit(attacker);
          }
        }
      }

      if (target.hp === 0) {
        this.eliminateUnit(target);
      }
    }

    eliminateUnit(unit) {
      window.sounds.playDefeat();
      unit.animState = 'defeated';
      this.spawnFloatingText(unit.x, unit.y, 'DEFEATED!', 'damage');
      this.log(`☠️ ${unit.name} has crumbled and been eliminated!`, 'defeat');
      this.checkWinCondition();
    }

    hasMovementOptions(unit) {
      if (!unit || unit.hp <= 0) return false;
      if (unit.team !== this.currentTeam) return false;
      return unit.movesLeft > 0 && (!unit.status.immobilized || unit.status.immobilized === 0);
    }

    hasViableOptions(unit) {
      if (!unit || unit.hp <= 0) return false;
      // If it is not this unit's team's turn, it has no viable options right now
      if (unit.team !== this.currentTeam) return false;

      // Has movement available (and not immobilized)
      const canMove = this.hasMovementOptions(unit);

      // Has action/attack available
      const canAct = !unit.hasActed;

      return canMove || canAct;
    }

    finishAction(unit) {
      setTimeout(() => {
        if (unit.hp > 0) unit.animState = 'idle';
        this.renderUnits();
      }, 500);

      this.actionMode = null;

      // If playing on active player's team and this unit is out of options:
      if (unit.team === this.currentTeam && !this.hasViableOptions(unit) && !this.isAiThinking) {
        // Find next friendly beast that still has viable options
        const nextReady = this.units.find(u => u.team === this.currentTeam && u.hp > 0 && u !== unit && this.hasViableOptions(u));
        if (nextReady) {
          setTimeout(() => {
            this.selectUnit(nextReady);
            this.log(`Active command shifted to ${nextReady.name} (Ready to act).`, 'system');
          }, 350);
        } else {
          // All player beasts have finished!
          this.log(`All beasts have completed their turns. Ready to End Turn.`, 'system');
          const endBtn = document.getElementById('btn-end-turn');
          if (endBtn) endBtn.classList.add('pulse-ready');
        }
      }

      this.render();
      this.updateCardDossier(unit);
      this.updateActionDock();
    }

    getValidAttackTargets(unit, skill) {
      if (skill.range === 0 || skill.type === 'counter_stance' || skill.type === 'self_move' || skill.type === 'passive') {
        return [{ x: unit.x, y: unit.y }];
      }

      // Rock Barrier (Earth Golem Move 2):
      // Allows placement in all directions (Up, Down, Left, Right) as well as Diagonally!
      if (skill.type === 'spawn_barrier') {
        const barrierTargets = [];
        const directions = [
          { x: 0, y: -1 },  // Up (North)
          { x: 0, y: 1 },   // Down (South)
          { x: -1, y: 0 },  // Left (West)
          { x: 1, y: 0 },   // Right (East)
          { x: -1, y: -1 }, // Up-Left (North-West)
          { x: 1, y: -1 },  // Up-Right (North-East)
          { x: -1, y: 1 },  // Down-Left (South-West)
          { x: 1, y: 1 }    // Down-Right (South-East)
        ];

        directions.forEach(d => {
          const tx = unit.x + d.x;
          const ty = unit.y + d.y;
          if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
            if (!this.getUnitAt(tx, ty) && !this.getHazardAt(tx, ty)) {
              barrierTargets.push({ x: tx, y: ty });
            }
          }
        });
        return barrierTargets;
      }

      const targets = [];
      const range = skill.range || 1;

      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const dist = Math.abs(c - unit.x) + Math.abs(r - unit.y);
          if (dist > 0 && dist <= range) {
            // Valid on hostile beasts
            const targetUnit = this.getUnitAt(c, r);
            if (targetUnit && targetUnit.team !== unit.team && targetUnit.hp > 0) {
              targets.push({ x: c, y: r });
            }
          }
        }
      }
      return targets;
    }

    // -------------------------------------------------------------------------
    // Turn Management & Passives (Regrowth, Swamp Regen)
    // -------------------------------------------------------------------------
    endTurn() {
      if (this.isAiThinking) return;

      window.sounds.playClick();
      const endBtn = document.getElementById('btn-end-turn');
      if (endBtn) endBtn.classList.remove('pulse-ready');

      // Check stationary turns for Terra-Mother on the team ending their turn:
      const endingTeamUnits = this.units.filter(u => u.team === this.currentTeam && u.hp > 0);
      endingTeamUnits.forEach(u => {
        if (u.id === 'terra_mother') {
          if (!u.hasMovedThisTurn) {
            u.stationaryTurns = (u.stationaryTurns || 0) + 1;
            this.log(`🌿 Terra-Mother rooted in place (${u.stationaryTurns}/3 turns).`, 'system');
            if (u.stationaryTurns >= 3) {
              const candidates = [];
              for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                  if (dx === 0 && dy === 0) continue;
                  const nx = u.x + dx;
                  const ny = u.y + dy;
                  if (nx >= 0 && nx < this.COLS && ny >= 0 && ny < this.ROWS) {
                    if (!this.getHazardAt(nx, ny) && !this.getUnitAt(nx, ny)) {
                      candidates.push({ x: nx, y: ny });
                    }
                  }
                }
              }
              if (candidates.length > 0) {
                const chosen = candidates[Math.floor(Math.random() * candidates.length)];
                this.addHazard(chosen.x, chosen.y, 'thorns', 99);
                window.sounds.playRock();
                this.spawnFloatingText(chosen.x, chosen.y, 'THORN OF LIFE!', 'status');
                this.log(`🌹 Thorn of Life: Terra-Mother stayed in place 3 turns! Thorns sprouted at (${chosen.x}, ${chosen.y})!`, 'system');
              }
              u.stationaryTurns = 0;
            }
          } else {
            u.stationaryTurns = 0;
          }
          u.hasMovedThisTurn = false;
        }
      });

      this.currentTeam = this.currentTeam === 1 ? 2 : 1;
      if (this.currentTeam === 1) {
        this.round++;
        document.getElementById('round-num').textContent = this.round;
      }

      this.log(`--- Round ${this.round}: Team ${this.currentTeam === 1 ? 'Solar (1)' : 'Lunar (2)'} Turn ---`, 'system');

      // Update Turn Tracker UI
      document.getElementById('team1-badge').classList.toggle('active', this.currentTeam === 1);
      document.getElementById('team2-badge').classList.toggle('active', this.currentTeam === 2);

      // Start of Turn Processing for the active team
      const teamUnits = this.units.filter(u => u.team === this.currentTeam && u.hp > 0);
      teamUnits.forEach(u => {
        // Reset moves and action
        u.movesLeft = u.baseMove;
        u.hasActed = false;

        // Reset Fire Orb stance at start of turn
        if (u.id === 'phoenix') {
          u.status.fireOrb = false;
        }

        // Earth Golem Terraform: +1 Move if starting on a Rock Barrier
        const hazardHere = this.getHazardAt(u.x, u.y);
        if (u.id === 'earth_golem' && hazardHere && hazardHere.type === 'rock_barrier') {
          u.movesLeft += 1;
          this.spawnFloatingText(u.x, u.y, '+1 TERRAFORM MOVE', 'status');
          this.log(`🗿 Terraform: Earth Golem starts on a Rock Barrier gaining +1 movement!`, 'system');
        }

        // Process Poison Debuff
        if (u.status.poisoned > 0) {
          u.hp = Math.max(0, u.hp - 5);
          u.status.poisoned--;
          this.spawnFloatingText(u.x, u.y, '-5 POISON', 'damage');
          this.log(`${u.name} suffers 5 poison damage!`, 'attack');
        }

        // Process Immobilized Debuff
        if (u.status.immobilized > 0) {
          u.status.immobilized--;
          u.movesLeft = 0; // cannot move this turn
          this.spawnFloatingText(u.x, u.y, 'IMMOBILIZED', 'status');
        }

        // Decrement Howl Buff
        if (u.status.howlBuff > 0) {
          u.status.howlBuff--;
        }

        // Hydra Passives:
        // 1. Regrowth: If Hydra is damaged, it regains 20 HP at the beginning of next turn!
        if (u.id === 'hydra' && u.status.tookDamageLastTurn && u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + 20);
          window.sounds.playHeal();
          this.spawnFloatingText(u.x, u.y, '+20 REGROWTH', 'heal');
          this.log(`Hydra Regrowth triggered: regained 20 HP! (${u.hp}/${u.maxHp})`, 'heal');
          u.status.tookDamageLastTurn = false;
        }

        // 2. Swamp Regenerator: Any allied card next to the Hydra is healed 10 HP at beginning of next turn!
        if (u.id === 'hydra') {
          const adjAllies = this.getAdjacentUnits(u.x, u.y).filter(a => a.team === u.team && a !== u && a.hp < a.maxHp);
          adjAllies.forEach(a => {
            a.hp = Math.min(a.maxHp, a.hp + 10);
            window.sounds.playHeal();
            this.spawnFloatingText(a.x, a.y, '+10 SWAMP REGEN', 'heal');
            this.log(`Swamp Regenerator healed ally ${a.name} by +10 HP!`, 'heal');
          });
        }
      });

      // Age hazards (Fire fades after 2 rounds, Rock Barrier is permanent or durable)
      for (const key in this.hazards) {
        const h = this.hazards[key];
        if (h.type === 'fire') {
          h.duration--;
          if (h.duration <= 0) {
            delete this.hazards[key];
          }
        }
      }
      this.renderHazards();

      // Auto-select first active unit of this team
      const nextUnit = teamUnits[0];
      if (nextUnit) {
        this.selectUnit(nextUnit);
      } else {
        this.checkWinCondition();
      }

      // If AI Mode and it's Team 2's turn, trigger Tactical AI
      if (this.mode === 'ai' && this.currentTeam === 2) {
        this.runAiTurn();
      }
    }

    // -------------------------------------------------------------------------
    // Tactical AI (Team 2)
    // -------------------------------------------------------------------------
    runAiTurn() {
      this.isAiThinking = true;
      document.getElementById('active-passive-hint').textContent = 'AI is deliberating tactical maneuvers...';

      const aiUnits = this.units.filter(u => u.team === 2 && u.hp > 0);
      let unitIdx = 0;

      const stepAiUnit = () => {
        if (unitIdx >= aiUnits.length) {
          this.isAiThinking = false;
          setTimeout(() => this.endTurn(), 1000);
          return;
        }

        const u = aiUnits[unitIdx];
        this.selectUnit(u);
        this.render();

        // Pause briefly after selecting beast so the player can see who is active
        setTimeout(() => {
          if (u.hp <= 0) {
            unitIdx++;
            setTimeout(stepAiUnit, 800);
            return;
          }

          // Find nearest opponent
          const opponents = this.units.filter(o => o.team === 1 && o.hp > 0);
          if (opponents.length === 0) {
            this.isAiThinking = false;
            return;
          }

          let nearest = opponents[0];
          let minDist = 999;
          opponents.forEach(o => {
            const d = Math.abs(o.x - u.x) + Math.abs(o.y - u.y);
            if (d < minDist) {
              minDist = d;
              nearest = o;
            }
          });

          // 1. Check if Werewolf should Howl first
          if (u.id === 'werewolf' && u.status.howlBuff === 0 && minDist <= 3) {
            this.attemptAbility(u);
          }

          // 2. Movement Phase: Move towards nearest opponent
          const validMoves = this.getValidMoves(u);
          if (validMoves.length > 0 && minDist > 1) {
            // Pick tile that minimizes distance to nearest opponent
            let bestMove = validMoves[0];
            let bestDist = 999;
            validMoves.forEach(m => {
              const d = Math.abs(m.x - nearest.x) + Math.abs(m.y - nearest.y);
              if (d < bestDist) {
                bestDist = d;
                bestMove = m;
              }
            });

            const path = this.findPath(u.x, u.y, bestMove.x, bestMove.y, u);
            if (path && path.length > 0) {
              this.executeUnitMove(u, path, () => {
                // 3. Attack Phase: After moving, pause so player sees landing, then attack if in range
                setTimeout(() => {
                  this.executeAiAttack(u, nearest);
                  u.hasActed = true;
                  u.movesLeft = 0;
                  this.render();
                  unitIdx++;
                  setTimeout(stepAiUnit, 1200);
                }, 800);
              });
              return;
            }
          }

          // If didn't move, pause slightly then attack directly
          setTimeout(() => {
            this.executeAiAttack(u, nearest);
            u.hasActed = true;
            u.movesLeft = 0;
            this.render();
            unitIdx++;
            setTimeout(stepAiUnit, 1200);
          }, 600);
        }, 700);
      };

      setTimeout(stepAiUnit, 1000);
    }

    executeAiAttack(u, nearest) {
      const dist = Math.abs(nearest.x - u.x) + Math.abs(nearest.y - u.y);

      // Werewolf: Rip Apart (20 Dmg)
      if (u.id === 'werewolf' && dist <= (u.skills.atk1.range || 1)) {
        this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        // If wounded, use Move 2: Retreat (+1 Move)
        if (u.hp < 70 && !u.hasActed) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        }
      }
      // Hydra: Venomous Bite (20 Dmg + Poison)
      else if (u.id === 'hydra' && dist <= (u.skills.atk1.range || 1)) {
        this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
      }
      // Earth Golem: Crushing Grip (20 Dmg + Immobilize) or Rock Barrier
      else if (u.id === 'earth_golem') {
        if (dist <= 1) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        } else {
          const stepX = u.x + (nearest.x > u.x ? 1 : (nearest.x < u.x ? -1 : 0));
          const stepY = u.y + (nearest.y > u.y ? 1 : (nearest.y < u.y ? -1 : 0));
          if (!this.getUnitAt(stepX, stepY) && !this.getHazardAt(stepX, stepY)) {
            this.attemptAttack(u, 'atk2', stepX, stepY);
          }
        }
      }
      // Phoenix: Flaming Talons (30 Dmg) or Fire Orb
      else if (u.id === 'phoenix') {
        if (dist <= 1) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        } else if (u.hp < 60) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        }
      }
      // Standard Skill 1 if in range
      else if (dist <= (u.skills.atk1.range || 1)) {
        this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
      }
    }

    // -------------------------------------------------------------------------
    // Win Condition
    // -------------------------------------------------------------------------
    checkWinCondition() {
      const team1Alive = this.units.some(u => u.team === 1 && u.hp > 0);
      const team2Alive = this.units.some(u => u.team === 2 && u.hp > 0);

      if (!team1Alive || !team2Alive) {
        const winner = team1Alive ? 'Team 1 (Solar)' : 'Team 2 (Lunar)';
        const crest = team1Alive ? '☀️' : '🌙';
        document.getElementById('winner-crest').textContent = crest;
        document.getElementById('winner-title').textContent = `${winner.toUpperCase()} VICTORIOUS!`;
        document.getElementById('winner-message').textContent = `All opposing mythical beasts were defeated in Round ${this.round}.`;
        this.elWinnerModal.classList.remove('hidden');
        this.log(`🏆 VICTORY: ${winner} has won the match!`, 'system');
      }
    }

    resetMatch() {
      this.elWinnerModal.classList.add('hidden');
      this.openDraftModal();
    }

    // -------------------------------------------------------------------------
    // Mythical Beast Draft System (3 Selections Per Team)
    // -------------------------------------------------------------------------
    initDraft() {
      this.draftPoolTemplates = ['phoenix', 'earth_golem', 'werewolf', 'hydra', 'terra_mother'];
      this.draftState = {
        active: false,
        poolStock: { phoenix: 2, earth_golem: 2, werewolf: 2, hydra: 2, terra_mother: 2 },
        team1Picks: [],
        team2Picks: [],
        turnOrder: [],
        currentStep: 0,
        firstPickerTeam: 1,
        isAiPicking: false
      };

      const startBtn = document.getElementById('btn-start-match');
      if (startBtn) {
        startBtn.addEventListener('click', () => this.finalizeDraftAndStartMatch());
      }
    }

    openDraftModal() {
      const modal = document.getElementById('draft-modal');
      if (!modal) return;

      // Randomly determine who picks first (50% Solar / Team 1, 50% Lunar / Team 2)
      const firstPicker = Math.random() < 0.5 ? 1 : 2;
      const turnOrder = firstPicker === 1
        ? [1, 2, 1, 2, 1, 2]
        : [2, 1, 2, 1, 2, 1];

      this.draftState = {
        active: true,
        poolStock: { phoenix: 2, earth_golem: 2, werewolf: 2, hydra: 2, terra_mother: 2 },
        team1Picks: [],
        team2Picks: [],
        turnOrder: turnOrder,
        currentStep: 0,
        firstPickerTeam: firstPicker,
        isAiPicking: false
      };

      // Reset slot visuals
      for (let s = 0; s < 3; s++) {
        const slot1 = document.getElementById(`slot-1-${s}`);
        const slot2 = document.getElementById(`slot-2-${s}`);
        if (slot1) {
          slot1.className = 'draft-slot empty';
          slot1.innerHTML = `<span class="slot-num">Slot ${s + 1}</span>`;
        }
        if (slot2) {
          slot2.className = 'draft-slot empty';
          slot2.innerHTML = `<span class="slot-num">Slot ${s + 1}</span>`;
        }
      }

      const actionsBar = document.getElementById('draft-actions-bar');
      if (actionsBar) actionsBar.style.display = 'none';

      modal.classList.remove('hidden');

      const firstTeamName = firstPicker === 1 ? 'Solar Team (Player)' : (this.mode === 'ai' ? 'Lunar Team (AI)' : 'Lunar Team');
      this.log(`🪙 Draft initiated! Random Coin Toss awarded first pick to ${firstTeamName}.`, 'system');

      this.renderDraftUI();
      this.advanceDraftStep();
    }

    renderDraftUI() {
      const state = this.draftState;
      const currentTeam = state.turnOrder[state.currentStep] || 1;
      const isComplete = state.currentStep >= 6;

      // Update counters
      const count1 = document.getElementById('tray-count-1');
      const count2 = document.getElementById('tray-count-2');
      if (count1) count1.textContent = `${state.team1Picks.length} / 3`;
      if (count2) count2.textContent = `${state.team2Picks.length} / 3`;

      // Update tray active picking indicator
      const tray1 = document.getElementById('draft-tray-1');
      const tray2 = document.getElementById('draft-tray-2');
      if (tray1) tray1.classList.toggle('active-picker', !isComplete && currentTeam === 1);
      if (tray2) tray2.classList.toggle('active-picker', !isComplete && currentTeam === 2);

      // Update banner
      const banner = document.getElementById('draft-banner');
      const bannerText = document.getElementById('draft-turn-text');
      if (banner && bannerText) {
        banner.className = 'draft-banner';
        if (isComplete) {
          bannerText.textContent = '⚔️ DRAFT COMPLETE! PREPARING TABLETOP ARENA...';
          banner.classList.add('team-1-active');
        } else if (currentTeam === 1) {
          bannerText.textContent = `☀️ SOLAR TEAM: Select a Beast Card (Pick ${state.team1Picks.length + 1} of 3)`;
          banner.classList.add('team-1-active');
        } else {
          const t2Label = this.mode === 'ai' ? 'LUNAR TEAM (AI is deliberating...)' : 'LUNAR TEAM (Player 2 Pick)';
          bannerText.textContent = `🌙 ${t2Label} (Pick ${state.team2Picks.length + 1} of 3)`;
          banner.classList.add('team-2-active');
        }
      }

      // Render Slots
      state.team1Picks.forEach((tmplId, idx) => {
        const slot = document.getElementById(`slot-1-${idx}`);
        if (slot) {
          const tmpl = BEAST_TEMPLATES[tmplId];
          slot.className = 'draft-slot filled';
          slot.innerHTML = `
            <img src="${tmpl.cardImg}" alt="${tmpl.name}">
            <div class="slot-name-badge">${tmpl.name}</div>
          `;
        }
      });

      state.team2Picks.forEach((tmplId, idx) => {
        const slot = document.getElementById(`slot-2-${idx}`);
        if (slot) {
          const tmpl = BEAST_TEMPLATES[tmplId];
          slot.className = 'draft-slot filled';
          slot.innerHTML = `
            <img src="${tmpl.cardImg}" alt="${tmpl.name}">
            <div class="slot-name-badge">${tmpl.name}</div>
          `;
        }
      });

      // Render Cards Grid
      const grid = document.getElementById('draft-cards-grid');
      if (!grid) return;
      grid.innerHTML = '';

      const isHumanTurn = !isComplete && (currentTeam === 1 || this.mode === 'hotseat');

      this.draftPoolTemplates.forEach(tmplId => {
        const tmpl = BEAST_TEMPLATES[tmplId];
        const stock = state.poolStock[tmplId];
        const isSoldOut = stock <= 0;

        const cardItem = document.createElement('div');
        cardItem.className = `draft-card-item ${isSoldOut ? 'sold-out' : ''} ${!isHumanTurn ? 'disabled' : ''}`;
        
        let stockBadgeHTML = `<span class="draft-card-stock">${stock} Available</span>`;
        if (stock === 1) stockBadgeHTML = `<span class="draft-card-stock low">1 Left</span>`;
        else if (stock <= 0) stockBadgeHTML = `<span class="draft-card-stock empty">Sold Out</span>`;

        cardItem.innerHTML = `
          <img src="${tmpl.cardImg}" alt="${tmpl.name}">
          <div class="draft-card-footer">
            <div class="draft-card-name-row">
              <span class="draft-card-title">${tmpl.name}</span>
              <span class="draft-card-element element-tag ${tmpl.element}">${tmpl.element}</span>
            </div>
            ${stockBadgeHTML}
          </div>
        `;

        cardItem.addEventListener('click', () => {
          if (!state.active || isComplete || isSoldOut || !isHumanTurn) return;
          this.handleDraftPick(tmplId);
        });

        grid.appendChild(cardItem);
      });
    }

    handleDraftPick(tmplId) {
      if (!this.draftState.active || this.draftState.currentStep >= 6) return;
      if (this.draftState.poolStock[tmplId] <= 0) return;

      const currentTeam = this.draftState.turnOrder[this.draftState.currentStep];
      this.draftState.poolStock[tmplId]--;

      if (currentTeam === 1) {
        this.draftState.team1Picks.push(tmplId);
      } else {
        this.draftState.team2Picks.push(tmplId);
      }

      window.sounds.playClick();
      this.draftState.currentStep++;
      this.renderDraftUI();
      this.advanceDraftStep();
    }

    advanceDraftStep() {
      if (!this.draftState.active) return;

      if (this.draftState.currentStep >= 6) {
        this.draftState.active = false;
        window.sounds.playRock();
        const actionsBar = document.getElementById('draft-actions-bar');
        if (actionsBar) actionsBar.style.display = 'flex';

        setTimeout(() => {
          this.finalizeDraftAndStartMatch();
        }, 1100);
        return;
      }

      const nextTeam = this.draftState.turnOrder[this.draftState.currentStep];

      // If AI's turn to pick in Solo Mode
      if (this.mode === 'ai' && nextTeam === 2) {
        this.draftState.isAiPicking = true;
        this.renderDraftUI();

        setTimeout(() => {
          if (!this.draftState.active) return;
          const available = this.draftPoolTemplates.filter(id => this.draftState.poolStock[id] > 0);
          if (available.length > 0) {
            // Strategic AI pick: prefer distinct beasts
            const unpicked = available.filter(id => !this.draftState.team2Picks.includes(id));
            const pick = unpicked.length > 0 
              ? unpicked[Math.floor(Math.random() * unpicked.length)] 
              : available[Math.floor(Math.random() * available.length)];

            this.handleDraftPick(pick);
          }
        }, 750);
      } else {
        this.renderDraftUI();
      }
    }

    finalizeDraftAndStartMatch() {
      const modal = document.getElementById('draft-modal');
      if (modal) modal.classList.add('hidden');

      this.round = 1;
      this.currentTeam = 1;
      this.hazards = {};
      document.getElementById('round-num').textContent = '1';
      document.getElementById('team1-badge').classList.add('active');
      document.getElementById('team2-badge').classList.remove('active');

      const team1Picks = this.draftState.team1Picks.length === 3 ? this.draftState.team1Picks : ['phoenix', 'earth_golem', 'hydra'];
      const team2Picks = this.draftState.team2Picks.length === 3 ? this.draftState.team2Picks : ['werewolf', 'hydra', 'earth_golem'];

      this.initUnits(team1Picks, team2Picks);

      // Update header badges
      const t1Names = team1Picks.map(id => BEAST_TEMPLATES[id].name).join(' & ');
      const t2Names = team2Picks.map(id => BEAST_TEMPLATES[id].name).join(' & ');
      const t1El = document.getElementById('team1-beasts');
      const t2El = document.getElementById('team2-beasts');
      if (t1El) t1El.textContent = t1Names;
      if (t2El) t2El.textContent = t2Names;

      this.render();
      this.selectUnit(this.units[0]);

      this.log(`⚔️ Draft Complete! Solar Team [${t1Names}] vs Lunar Team [${t2Names}].`, 'system');
    }

    renderSwitcherChips() {
      const container = document.getElementById('beast-switcher-chips');
      if (!container) return;
      container.innerHTML = '';

      this.units.forEach(u => {
        if (u.hp <= 0) return;
        const btn = document.createElement('button');
        btn.className = `beast-chip team-${u.team} ${this.selectedUnit === u ? 'active' : ''}`;
        btn.dataset.instance = u.instanceId;
        btn.dataset.unit = u.id;
        const teamCrest = u.team === 1 ? '☀️' : '🌙';
        btn.innerHTML = `${teamCrest} ${u.name}`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectUnit(u);
        });
        container.appendChild(btn);
      });
    }

    // -------------------------------------------------------------------------
    // Rendering & Visuals
    // -------------------------------------------------------------------------
    render() {
      this.renderHazards();
      this.renderUnits();
      this.renderRoster();
      this.renderSwitcherChips();
      this.renderHighlights();
    }

    renderHazards() {
      this.elHazardsLayer.innerHTML = '';
      for (const key in this.hazards) {
        const [x, y] = key.split(',').map(Number);
        const h = this.hazards[key];
        const el = document.createElement('div');
        const durationClass = h.type === 'fire' ? `fire-turns-${h.duration}` : '';
        el.className = `hazard-sprite ${h.type.replace('_', '-')} ${durationClass}`.trim();
        el.style.left = `${x * 10}%`;
        el.style.top = `${y * 12.5}%`;

        const img = document.createElement('img');
        if (h.type === 'fire') {
          img.src = 'Sprites/Effects/Fire_Tile_256x256.png';
        } else if (h.type === 'rock_barrier') {
          img.src = 'Sprites/Effects/Rock_Barrier_Tile_256x256.png';
        } else if (h.type === 'thorns') {
          img.src = 'Sprites/Effects/Thorn_Tile_256x256.png';
        }
        el.appendChild(img);
        this.elHazardsLayer.appendChild(el);
      }
    }

    renderUnits() {
      this.elUnitsLayer.innerHTML = '';
      this.units.forEach(u => {
        if (u.hp <= 0 && u.animState !== 'defeated') return;

        const el = document.createElement('div');
        el.className = `unit-entity team-${u.team} anim-${u.animState}`;
        if (this.selectedUnit === u) el.classList.add('selected');
        el.style.left = `${u.x * 10}%`;
        el.style.top = `${u.y * 12.5}%`;

        // Determine correct sprite orientation
        let spriteSrc = u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        if (u.animState === 'walk') {
          spriteSrc = u.sprites[`walk_${u.facing}`] || u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        } else if (u.animState === 'attack') {
          spriteSrc = u.sprites[`attack_${u.facing}`] || u.sprites.attack || u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        } else if (u.animState === 'attack_aoe') {
          spriteSrc = u.sprites.attack_aoe || u.sprites.attack || u.sprites.idle_down;
        } else if (u.animState === 'hurt') {
          spriteSrc = u.sprites.hurt || u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        } else if (u.animState === 'defeated') {
          spriteSrc = u.sprites.defeated || u.sprites.idle_down;
        }

        const statusUnderHTML = this.renderUnitStatusUnder(u);
        const hasMoves = this.hasMovementOptions(u);
        const dotTitle = hasMoves
          ? `${u.name} (Moving): ${u.movesLeft} movement options available`
          : (u.team === this.currentTeam 
              ? `${u.name} (Movement Exhausted): 0 moves remaining${!u.hasActed ? ' (Action available)' : ''}` 
              : `${u.name}: Waiting for turn`);
        const turnDotHTML = `<div class="turn-indicator-dot ${hasMoves ? 'viable' : 'exhausted'}" title="${dotTitle}"></div>`;

        el.innerHTML = `
          <div class="unit-hud">
            ${turnDotHTML}
            <div class="unit-hp-bar">
              <div class="unit-hp-fill ${u.hp / u.maxHp < 0.3 ? 'low' : ''}" style="width: ${(u.hp / u.maxHp) * 100}%"></div>
            </div>
          </div>
          <div class="unit-sprite-box">
            <img src="${spriteSrc}" alt="${u.name}">
          </div>
          ${statusUnderHTML}
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleCellClick(u.x, u.y);
        });

        this.elUnitsLayer.appendChild(el);
      });
    }

    renderUnitStatusUnder(u) {
      const badges = [];

      // Howl Buff (+10 ATK)
      if (u.status.howlBuff > 0) {
        badges.push(`<span class="status-pill buff-howl" title="Howl: +10 Attack Damage">🐺 +10</span>`);
      }

      // Immobilized / Crushing Grip (Cannot move)
      if (u.status.immobilized > 0) {
        badges.push(`<span class="status-pill debuff-immobilized" title="Immobilized: Movement Disabled">⛓️ ROOT</span>`);
      }

      // Poisoned (Venomous Bite)
      if (u.status.poisoned > 0) {
        badges.push(`<span class="status-pill debuff-poison" title="Poisoned: -5 HP per turn">☠️ -5</span>`);
      }

      // Fire Orb (50% damage reflection)
      if (u.status.fireOrb) {
        badges.push(`<span class="status-pill buff-reflect" title="Fire Orb: 50% Damage Reflection">🔮 REF</span>`);
      }

      // Hydra Regrowth pending
      if (u.id === 'hydra' && u.status.tookDamageLastTurn && u.hp < u.maxHp) {
        badges.push(`<span class="status-pill buff-regen" title="Regrowth: +20 HP Next Turn">🌿 +20</span>`);
      }

      // Earth Golem Terraform (standing on Rock Barrier)
      const hazard = this.getHazardAt(u.x, u.y);
      if (u.id === 'earth_golem' && hazard && hazard.type === 'rock_barrier') {
        badges.push(`<span class="status-pill buff-terraform" title="Terraform: +1 Move on Barrier">⛰️ +1 MOV</span>`);
      }

      // Shield
      if (u.shield > 0) {
        badges.push(`<span class="status-pill buff-shield" title="Shielded">🛡️ ${u.shield}</span>`);
      }

      if (badges.length === 0) return '';
      return `<div class="unit-status-under">${badges.join('')}</div>`;
    }

    renderHighlights() {
      // Clear previous cell classes
      const cells = this.elCellsLayer.querySelectorAll('.grid-cell');
      cells.forEach(c => {
        c.className = 'grid-cell';
      });

      if (!this.selectedUnit || this.selectedUnit.team !== this.currentTeam || this.isAiThinking) {
        return;
      }

      if (this.actionMode === 'move') {
        const moves = this.getValidMoves(this.selectedUnit);
        moves.forEach(m => {
          const cell = this.getCellElement(m.x, m.y);
          if (cell) cell.classList.add('valid-move');
        });
      } else if (this.actionMode === 'atk1' || this.actionMode === 'atk2') {
        const skill = this.selectedUnit.skills[this.actionMode];
        const targets = this.getValidAttackTargets(this.selectedUnit, skill);
        targets.forEach(t => {
          const cell = this.getCellElement(t.x, t.y);
          if (cell) {
            if (skill.type === 'spawn_barrier') {
              cell.classList.add('valid-special');
            } else {
              cell.classList.add('valid-attack');
            }
          }
        });
      } else if (this.actionMode === 'ability') {
        // Self or team ability highlight
        const cell = this.getCellElement(this.selectedUnit.x, this.selectedUnit.y);
        if (cell) cell.classList.add('valid-special');
      }
    }

    renderRoster() {
      this.elRoster.innerHTML = '';
      this.units.forEach(u => {
        const card = document.createElement('div');
        card.className = `roster-card ${this.selectedUnit === u ? 'active' : ''} ${u.hp <= 0 ? 'defeated' : ''}`;
        card.innerHTML = `
          <img class="roster-thumb" src="${u.sprites.idle_down}" alt="${u.name}">
          <div class="roster-info">
            <div class="roster-name-row">
              <span class="roster-name">${u.name}</span>
              <span class="roster-hp-text">${u.hp}/${u.maxHp} HP</span>
            </div>
            <div class="roster-hp-bar">
              <div class="roster-hp-fill" style="width: ${(u.hp / u.maxHp) * 100}%"></div>
            </div>
          </div>
        `;
        card.addEventListener('click', () => {
          this.selectUnit(u);
          if (window.innerWidth <= 1024 && this.closeMobileDrawers) {
            this.closeMobileDrawers();
          }
        });
        this.elRoster.appendChild(card);
      });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    getCellElement(x, y) {
      return this.elCellsLayer.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
    }

    getUnitAt(x, y) {
      return this.units.find(u => u.x === x && u.y === y && u.hp > 0);
    }

    getAdjacentUnits(x, y) {
      return this.units.filter(u => {
        const d = Math.abs(u.x - x) + Math.abs(u.y - y);
        return d === 1 && u.hp > 0;
      });
    }

    getHazardAt(x, y) {
      return this.hazards[`${x},${y}`] || null;
    }

    addHazard(x, y, type, duration) {
      this.hazards[`${x},${y}`] = { type, duration };
      this.renderHazards();
    }

    spawnFloatingText(x, y, text, type = 'damage') {
      const el = document.createElement('div');
      el.className = `floating-text ${type}`;
      el.textContent = text;
      el.style.left = `${x * 10 + 5}%`;
      el.style.top = `${y * 12.5 + 4}%`;
      this.elFxLayer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }

    log(message, type = 'system') {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      entry.textContent = message;
      this.elLog.appendChild(entry);
      this.elLog.scrollTop = this.elLog.scrollHeight;
    }
  }

  // Launch Game
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new BeastsGame();
  });
})();
