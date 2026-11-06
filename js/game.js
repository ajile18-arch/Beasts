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
        atk1: { name: 'Flame Strike', range: 2, dmg: 25, type: 'target', desc: 'Ranged flame blast (25 Dmg)' },
        atk2: { name: 'Fire Blast AoE', range: 3, dmg: 20, splash: 10, type: 'aoe', desc: 'Explosive blast (20 Dmg + 10 Splash)' },
        ability: { name: 'Rebirth Flare', range: 0, heal: 25, aoeDmg: 15, type: 'self_aoe', desc: 'Heals 25 HP & burns adjacent enemies' }
      },
      passiveHint: 'Trails of Fire: Leaves burning fire tiles as it moves. Immune to flame.'
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
        atk1: { name: 'Crushing Grip', range: 1, dmg: 20, immobilize: 1, type: 'target', desc: 'Deals 20 Dmg & immobilizes enemy next turn' },
        atk2: { name: 'Rock Barrier', range: 1, type: 'spawn_barrier', desc: 'Summons a Stone Wall in front (Earth-passable only)' },
        ability: { name: 'Terraform Fortify', range: 0, shield: 30, type: 'self', desc: 'Reinforces stone armor (+30 Shield)' }
      },
      passiveHint: 'Terraform: Gains +1 movement when moving across Rock Barriers.'
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
        atk1: { name: 'Rip Apart', range: 1, dmg: 20, type: 'target', desc: 'Vicious melee strike (20 Dmg + Howl Bonus)' },
        atk2: { name: 'Retreat', range: 0, moveBuff: 1, type: 'self', desc: 'Disengage sprint (+1 extra tile of movement)' },
        ability: { name: 'Howl', range: 0, atkBuff: 10, duration: 2, type: 'team_buff', desc: 'Boosts all ally attacks by +10 Dmg for 2 turns' }
      },
      passiveHint: 'Pack Agility: Earth beast crossing rough terrain without penalty.'
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
        atk1: { name: 'Venom Spit', range: 2, dmg: 20, poison: 5, type: 'target', desc: 'Spits acid (20 Dmg + 5 Poison / turn)' },
        atk2: { name: 'Thrash AoE', range: 1, dmg: 18, type: 'adjacent_aoe', desc: 'Strikes all adjacent enemy beasts (18 Dmg)' },
        ability: { name: 'Regrowth Surge', range: 0, heal: 20, type: 'self', desc: 'Regenerates severed heads (+20 HP)' }
      },
      passiveHint: 'Regrowth: Heals 20 HP at start of turn if damaged. Swamp Regen: Heals adjacent allies 10 HP.'
    }
  };

  // ---------------------------------------------------------------------------
  // Game State Engine
  // ---------------------------------------------------------------------------
  class BeastsGame {
    constructor() {
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

      this.initBoard();
      this.initUnits();
      this.bindEvents();
      this.render();
      this.selectUnit(this.units[0]);
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

    // Spawn 4 beasts
    initUnits() {
      this.units = [
        // Team 1: Solar (Phoenix & Earth Golem)
        this.createUnitInstance('phoenix', 1, 2, 2),
        this.createUnitInstance('earth_golem', 1, 2, 5),

        // Team 2: Lunar (Werewolf & Hydra)
        this.createUnitInstance('werewolf', 2, 7, 2),
        this.createUnitInstance('hydra', 2, 7, 5)
      ];
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
      document.getElementById('btn-atk2').addEventListener('click', () => this.setActionMode('atk2'));
      document.getElementById('btn-ability').addEventListener('click', () => this.setActionMode('ability'));
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

      // Keyboard shortcuts (Space = End Turn, 1..4 = Abilities)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          this.endTurn();
        } else if (e.key === '1') {
          this.setActionMode('move');
        } else if (e.key === '2') {
          this.setActionMode('atk1');
        } else if (e.key === '3') {
          this.setActionMode('atk2');
        } else if (e.key === '4') {
          this.setActionMode('ability');
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

      // Automatically default to move mode if unit has moves remaining
      if (unit && unit.team === this.currentTeam && unit.movesLeft > 0 && !unit.hasActed) {
        this.setActionMode('move');
      } else {
        this.setActionMode(null);
      }
      this.render();
    }

    setActionMode(mode) {
      if (!this.selectedUnit) return;
      if (this.selectedUnit.team !== this.currentTeam) {
        this.actionMode = null;
        this.renderHighlights();
        return;
      }

      if (this.actionMode === mode) {
        this.actionMode = null; // Toggle off
      } else {
        this.actionMode = mode;
      }

      window.sounds.playClick();
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

      document.getElementById('active-avatar').style.backgroundImage = `url(${u.sprites.idle_down})`;
      document.getElementById('active-name').textContent = u.name;
      document.getElementById('active-moves-left').textContent = `Moves: ${u.movesLeft}`;
      document.getElementById('active-passive-hint').textContent = u.passiveHint;

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

      // If clicked on an ally, select that ally
      if (unitAtCell && unitAtCell.team === this.currentTeam) {
        this.selectUnit(unitAtCell);
        return;
      }

      // If in an action mode with active unit
      if (this.selectedUnit && this.selectedUnit.team === this.currentTeam) {
        if (this.actionMode === 'move') {
          this.attemptMove(this.selectedUnit, x, y);
        } else if (this.actionMode === 'atk1') {
          this.attemptAttack(this.selectedUnit, 'atk1', x, y);
        } else if (this.actionMode === 'atk2') {
          this.attemptAttack(this.selectedUnit, 'atk2', x, y);
        } else if (this.actionMode === 'ability') {
          this.attemptAbility(this.selectedUnit, x, y);
        }
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
      const stepInterval = 140;
      let stepIdx = 0;

      const moveStep = () => {
        if (stepIdx >= path.length) {
          unit.movesLeft = Math.max(0, unit.movesLeft - path.length);
          unit.animState = 'idle';

          // Terraform bonus: Earth Golem stepping onto a Rock Barrier gains +1 extra move!
          const hazardHere = this.getHazardAt(unit.x, unit.y);
          if (unit.id === 'earth_golem' && hazardHere && hazardHere.type === 'rock_barrier') {
            unit.movesLeft += 1;
            this.spawnFloatingText(unit.x, unit.y, '+1 TERRAFORM MOVE', 'status');
            this.log(`Earth Golem draws strength from the stone wall (+1 Move)!`, 'system');
          }

          // Check if landed on Fire Tile
          if (hazardHere && hazardHere.type === 'fire' && unit.element !== 'fire') {
            unit.hp = Math.max(0, unit.hp - 15);
            window.sounds.playFire();
            this.spawnFloatingText(unit.x, unit.y, '-15 FIRE', 'damage');
            this.log(`${unit.name} stepped into fire taking 15 burn damage!`, 'attack');
          }

          this.render();
          this.updateCardDossier(unit);
          this.updateActionDock();

          if (unit.movesLeft === 0) {
            this.setActionMode(null);
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

      // Special Rock Barrier Spawning (Earth Golem Move 2)
      if (skill.type === 'spawn_barrier') {
        this.addHazard(targetX, targetY, 'rock_barrier', 99);
        window.sounds.playRock();
        unit.animState = 'attack_aoe';
        unit.hasActed = true;
        this.spawnFloatingText(targetX, targetY, 'STONE WALL!', 'status');
        this.log(`${unit.name} raised a craggy Rock Barrier at (${targetX}, ${targetY})!`, 'barrier');
        this.finishAction(unit);
        return;
      }

      const targetUnit = this.getUnitAt(targetX, targetY);
      if (!targetUnit || targetUnit.team === unit.team) return;

      // Calculate Damage (+10 Howl buff if active)
      let damage = skill.dmg || 20;
      if (unit.status.howlBuff > 0) {
        damage += 10;
        this.log(`Howl boost amplified damage by +10!`, 'system');
      }

      // Play Sound & Sprite Animation
      if (unit.id === 'phoenix') window.sounds.playFire();
      else if (unit.id === 'earth_golem') window.sounds.playRock();
      else if (unit.id === 'werewolf') window.sounds.playHit();
      else if (unit.id === 'hydra') window.sounds.playPoison();

      // Orient attacker towards target
      if (targetX > unit.x) unit.facing = 'right';
      else if (targetX < unit.x) unit.facing = 'left';
      else if (targetY > unit.y) unit.facing = 'down';
      else if (targetY < unit.y) unit.facing = 'up';

      unit.animState = skill.type === 'aoe' ? 'attack_aoe' : 'attack';
      targetUnit.animState = 'hurt';

      this.dealDamage(targetUnit, damage, unit.name);

      // Crushing Grip: Disable hostile movement next turn!
      if (skill.immobilize) {
        targetUnit.status.immobilized = skill.immobilize;
        this.spawnFloatingText(targetUnit.x, targetUnit.y, 'IMMOBILIZED!', 'status');
        this.log(`${targetUnit.name} is trapped in Crushing Grip! Movement disabled on next turn.`, 'attack');
      }

      // Poison Spit: Acid burn
      if (skill.poison) {
        targetUnit.status.poisoned = 2;
        this.spawnFloatingText(targetUnit.x, targetUnit.y, 'POISONED!', 'status');
        this.log(`${targetUnit.name} was drenched in Hydra venom! Takes damage over 2 turns.`, 'attack');
      }

      // Splash AoE damage to adjacent units
      if (skill.splash) {
        const neighbors = this.getAdjacentUnits(targetX, targetY);
        for (const n of neighbors) {
          if (n !== targetUnit && n.team !== unit.team) {
            this.dealDamage(n, skill.splash, `${unit.name} Splash`);
          }
        }
      }

      unit.hasActed = true;
      this.finishAction(unit);
    }

    attemptAbility(unit, targetX, targetY) {
      if (unit.hasActed) return;
      const ability = unit.skills.ability;

      // Werewolf Howl: Boosts all allied attacks by +10 for 2 turns
      if (unit.id === 'werewolf') {
        window.sounds.playHowl();
        unit.animState = 'attack_aoe';
        const allies = this.units.filter(u => u.team === unit.team && u.hp > 0);
        allies.forEach(a => {
          a.status.howlBuff = 2;
          this.spawnFloatingText(a.x, a.y, 'HOWL BUFF (+10 ATK)', 'status');
        });
        this.log(`Werewolf lets loose a piercing HOWL! All ally attacks boosted by +10 for 2 turns.`, 'heal');
      }
      // Werewolf Retreat (if mapped as ability or skill)
      else if (ability.moveBuff) {
        unit.movesLeft += ability.moveBuff;
        window.sounds.playMove();
        this.spawnFloatingText(unit.x, unit.y, '+1 MOVE RETREAT', 'status');
        this.log(`${unit.name} springs backward with Retreat (+1 Move)!`, 'system');
      }
      // Hydra Regrowth Surge
      else if (unit.id === 'hydra') {
        window.sounds.playHeal();
        unit.hp = Math.min(unit.maxHp, unit.hp + 20);
        this.spawnFloatingText(unit.x, unit.y, '+20 REGROWTH', 'heal');
        this.log(`Hydra regenerates severed heads (+20 HP)!`, 'heal');
      }
      // Earth Golem Terraform Fortify
      else if (unit.id === 'earth_golem') {
        window.sounds.playRock();
        unit.shield += 30;
        this.spawnFloatingText(unit.x, unit.y, '+30 STONE GUARD', 'status');
        this.log(`Earth Golem fortifies itself with craggy stone (+30 Shield)!`, 'barrier');
      }
      // Phoenix Rebirth Flare
      else if (unit.id === 'phoenix') {
        window.sounds.playFire();
        window.sounds.playHeal();
        unit.hp = Math.min(unit.maxHp, unit.hp + 25);
        this.spawnFloatingText(unit.x, unit.y, '+25 REBIRTH', 'heal');
        // Burn adjacent enemies
        const enemies = this.getAdjacentUnits(unit.x, unit.y).filter(e => e.team !== unit.team);
        enemies.forEach(e => this.dealDamage(e, 15, 'Rebirth Flare'));
        this.log(`Phoenix flares in Rebirth! Heals +25 HP and scorches surrounding foes.`, 'attack');
      }

      unit.hasActed = true;
      this.finishAction(unit);
    }

    dealDamage(target, amount, sourceName) {
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

    finishAction(unit) {
      setTimeout(() => {
        if (unit.hp > 0) unit.animState = 'idle';
        this.renderUnits();
      }, 500);

      this.actionMode = null;
      this.render();
      this.updateCardDossier(unit);
      this.updateActionDock();
    }

    getValidAttackTargets(unit, skill) {
      const targets = [];
      const range = skill.range || 1;

      for (let r = 0; r < this.ROWS; r++) {
        for (let c = 0; c < this.COLS; c++) {
          const dist = Math.abs(c - unit.x) + Math.abs(r - unit.y);
          if (dist > 0 && dist <= range) {
            // If spawning a barrier, valid on any empty cell
            if (skill.type === 'spawn_barrier') {
              if (!this.getUnitAt(c, r) && !this.getHazardAt(c, r)) {
                targets.push({ x: c, y: r });
              }
            } else {
              // Valid on hostile beasts
              const targetUnit = this.getUnitAt(c, r);
              if (targetUnit && targetUnit.team !== unit.team && targetUnit.hp > 0) {
                targets.push({ x: c, y: r });
              }
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
          setTimeout(() => this.endTurn(), 400);
          return;
        }

        const u = aiUnits[unitIdx];
        this.selectUnit(u);

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
              // 3. Attack Phase: After moving, attack if in range
              setTimeout(() => {
                this.executeAiAttack(u, nearest);
                unitIdx++;
                setTimeout(stepAiUnit, 600);
              }, 400);
            });
            return;
          }
        }

        // If didn't move, attack directly
        this.executeAiAttack(u, nearest);
        unitIdx++;
        setTimeout(stepAiUnit, 600);
      };

      setTimeout(stepAiUnit, 600);
    }

    executeAiAttack(u, nearest) {
      const dist = Math.abs(nearest.x - u.x) + Math.abs(nearest.y - u.y);

      // Hydra Thrash if adjacent
      if (u.id === 'hydra' && dist === 1) {
        this.attemptAttack(u, 'atk2', nearest.x, nearest.y);
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
      this.round = 1;
      this.currentTeam = 1;
      this.hazards = {};
      document.getElementById('round-num').textContent = '1';
      document.getElementById('team1-badge').classList.add('active');
      document.getElementById('team2-badge').classList.remove('active');
      this.initUnits();
      this.render();
      this.selectUnit(this.units[0]);
      this.log(`Match restarted on Ancient Tabletop Arena.`, 'system');
    }

    // -------------------------------------------------------------------------
    // Rendering & Visuals
    // -------------------------------------------------------------------------
    render() {
      this.renderHazards();
      this.renderUnits();
      this.renderRoster();
      this.renderHighlights();
    }

    renderHazards() {
      this.elHazardsLayer.innerHTML = '';
      for (const key in this.hazards) {
        const [x, y] = key.split(',').map(Number);
        const h = this.hazards[key];
        const el = document.createElement('div');
        el.className = `hazard-sprite ${h.type.replace('_', '-')}`;
        el.style.left = `${x * 10}%`;
        el.style.top = `${y * 12.5}%`;

        const img = document.createElement('img');
        img.src = h.type === 'fire' 
          ? 'Sprites/Effects/Fire_Tile_256x256.png' 
          : 'Sprites/Effects/Rock_Barrier_Tile_256x256.png';
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

        el.innerHTML = `
          <div class="unit-hud">
            <div class="unit-hp-bar">
              <div class="unit-hp-fill ${u.hp / u.maxHp < 0.3 ? 'low' : ''}" style="width: ${(u.hp / u.maxHp) * 100}%"></div>
            </div>
            <div class="unit-icons">
              ${u.status.howlBuff > 0 ? '<span class="unit-icon-badge">🐺</span>' : ''}
              ${u.status.immobilized > 0 ? '<span class="unit-icon-badge">⛓️</span>' : ''}
              ${u.status.poisoned > 0 ? '<span class="unit-icon-badge">🧪</span>' : ''}
              ${u.shield > 0 ? '<span class="unit-icon-badge">🛡️</span>' : ''}
            </div>
          </div>
          <div class="unit-sprite-box">
            <img src="${spriteSrc}" alt="${u.name}">
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleCellClick(u.x, u.y);
        });

        this.elUnitsLayer.appendChild(el);
      });
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
          if (cell) cell.classList.add('valid-attack');
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
        card.addEventListener('click', () => this.selectUnit(u));
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
