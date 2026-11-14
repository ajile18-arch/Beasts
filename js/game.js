/**
 * MYTHOS: Gwent-Style Tactical Card Game & Overworld Bridge
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Beast Catalog & Archetypes (Preserved for Overworld, Binder & Card Data)
  // ---------------------------------------------------------------------------
  const BEAST_TEMPLATES = {
    phoenix: {
      id: 'phoenix',
      name: 'Phoenix',
      element: 'fire',
      stars: 4,
      maxHp: 120,
      cardImg: 'Cards_Legacy/Phoenix_Card.png',
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
      cardImg: 'Cards_Legacy/Earth_Golem_Card.png',
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
      cardImg: 'Cards_Legacy/Werewolf_Card.png',
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
      cardImg: 'Cards_Legacy/Hydra_Card.png',
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
        atk2: { name: 'Regrowth', range: 0, type: 'passive', desc: 'If Hydra is damaged, it regains 10 HP at beginning of next turn.' },
        ability: { name: 'Swamp Regenerator', range: 0, type: 'passive', desc: 'Any allied card next to the hydra is healed 10 HP at beginning of next turn.' }
      },
      passiveHint: 'Regrowth: If damaged, regains 10 HP next turn. Swamp Regenerator: Adjacent allies heal 10 HP next turn.'
    },

    terra_mother: {
      id: 'terra_mother',
      name: 'Terra-Mother',
      element: 'earth',
      stars: 4,
      maxHp: 100,
      cardImg: 'Cards_Legacy/Terra_Mother_Card.png',
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
        atk2: { name: 'Ram', range: 0, dmg: 25, type: 'passive_ram', desc: 'Deals 25 damage. After Terra-Mother moves, hostiles in front of her are knocked back 2 tiles.' },
        ability: { name: 'Thorn of Life', range: 0, type: 'passive', desc: 'When Terra-Mother stays in the same place for 3 turns in a row, Thorns grow in a random tile next to or diagonal her.' }
      },
      passiveHint: 'Ram: Deals 25 damage and knocks hostiles ahead back 2 tiles after moving. Thorn of Life: Staying in place 3 turns grows Thorns.'
    },

    verdant_guardian: {
      id: 'verdant_guardian',
      name: 'Verdant Guardian',
      element: 'plant',
      stars: 2,
      maxHp: 160,
      cardImg: 'Cards_Legacy/Verdant_Guardian_Card.png',
      spriteBase: 'Sprites/Verdant_Guardian/Verdant_Guardian',
      sprites: {
        idle_down: 'Sprites/Verdant_Guardian/Verdant_Guardian_idle_down_256x256.png',
        idle_up: 'Sprites/Verdant_Guardian/Verdant_Guardian_idle_up_256x256.png',
        idle_left: 'Sprites/Verdant_Guardian/Verdant_Guardian_idle_left_256x256.png',
        idle_right: 'Sprites/Verdant_Guardian/Verdant_Guardian_idle_right_256x256.png',
        walk_down: 'Sprites/Verdant_Guardian/Verdant_Guardian_walk_down_256x256.png',
        walk_up: 'Sprites/Verdant_Guardian/Verdant_Guardian_walk_up_256x256.png',
        walk_left: 'Sprites/Verdant_Guardian/Verdant_Guardian_walk_left_256x256.png',
        walk_right: 'Sprites/Verdant_Guardian/Verdant_Guardian_walk_right_256x256.png',
        attack: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_branch_whip_256x256.png',
        attack_left: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_swipe_left_256x256.png',
        attack_right: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_swipe_right_256x256.png',
        attack_aoe: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_thorn_bush_256x256.png',
        hurt: 'Sprites/Verdant_Guardian/Verdant_Guardian_hurt_damaged_256x256.png',
        defeated: 'Sprites/Verdant_Guardian/Verdant_Guardian_defeated_slumped_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Branch Whip', range: 1, dmg: 20, type: 'target', desc: 'Deals 20 damage.' },
        atk2: { name: 'Thorn Bush', range: 0, dmg: 10, type: 'aoe_hazard', desc: 'AOE burst that hits all adjacent enemy beasts for 10 damage.' },
        ability: { name: 'Sapling Strength', range: 0, type: 'passive', desc: 'At 1/4 health or below (<= 40 HP), moves attack strength is doubled.' }
      },
      passiveHint: 'Ability: Sapling Strength — At 1/4 health or below (<= 40 HP), moves attack strength is doubled.'
    },

    dwarf_warden: {
      id: 'dwarf_warden',
      name: 'Dwarf Warden',
      element: 'earth',
      stars: 4,
      maxHp: 140,
      cardImg: 'Cards_Legacy/Dwarf_Warden_Card.png',
      spriteBase: 'Sprites/Dwarf_Warden/Dwarf_Warden',
      sprites: {
        idle: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_down_256x256.png',
        idle_down: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_down_256x256.png',
        idle_up: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_up_256x256.png',
        idle_left: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_left_256x256.png',
        idle_right: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_right_256x256.png',
        walk: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_down_256x256.png',
        walk_down: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_down_256x256.png',
        walk_up: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_up_256x256.png',
        walk_left: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_left_256x256.png',
        walk_right: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_right_256x256.png',
        attack: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_hammer_throw_256x256.png',
        attack_down: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_hammer_throw_256x256.png',
        attack_up: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_hammer_throw_256x256.png',
        attack_left: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_left_256x256.png',
        attack_right: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_right_256x256.png',
        aoe: 'Sprites/Dwarf_Warden/Dwarf_Warden_defend_bullwark_256x256.png',
        attack_aoe: 'Sprites/Dwarf_Warden/Dwarf_Warden_defend_bullwark_256x256.png',
        defend_bullwark: 'Sprites/Dwarf_Warden/Dwarf_Warden_defend_bullwark_256x256.png',
        ground_slam: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_ground_slam_256x256.png',
        endurance_aura: 'Sprites/Dwarf_Warden/Dwarf_Warden_endurance_aura_256x256.png',
        hurt: 'Sprites/Dwarf_Warden/Dwarf_Warden_hurt_damaged_256x256.png',
        defeated: 'Sprites/Dwarf_Warden/Dwarf_Warden_defeated_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Hammer Throw', range: 2, dmg: 25, type: 'line_pierce', desc: 'Damages the 2 tiles in front of Dwarf Warden for 25 damage each.' },
        atk2: { name: 'Bullwark', range: 0, cooldown: 5, type: 'bullwark_stance', desc: 'Fully negates an incoming attack. (5 turn cooldown)' },
        ability: { name: 'Endurance', range: 0, type: 'passive', desc: 'Passive. After turn 10, Dwarf Warden takes half damage from all incoming attacks.' }
      },
      passiveHint: 'Ability: Endurance — After turn 10, takes half damage from all attacks. Bullwark: Fully negates next incoming attack (5 turn cd).'
    },

    pegasus: {
      id: 'pegasus',
      name: 'Pegasus',
      element: 'air',
      stars: 3,
      maxHp: 120,
      cardImg: 'Cards_Legacy/Pegasus_Card.png',
      spriteBase: 'Sprites/Pegasus/Pegasus',
      sprites: {
        idle: 'Sprites/Pegasus/Pegasus_idle_down_256x256.png',
        idle_down: 'Sprites/Pegasus/Pegasus_idle_down_256x256.png',
        idle_up: 'Sprites/Pegasus/Pegasus_idle_up_256x256.png',
        idle_left: 'Sprites/Pegasus/Pegasus_idle_left_256x256.png',
        idle_right: 'Sprites/Pegasus/Pegasus_idle_right_256x256.png',
        walk: 'Sprites/Pegasus/Pegasus_walk_down_256x256.png',
        walk_down: 'Sprites/Pegasus/Pegasus_walk_down_256x256.png',
        walk_up: 'Sprites/Pegasus/Pegasus_walk_up_256x256.png',
        walk_left: 'Sprites/Pegasus/Pegasus_walk_left_256x256.png',
        walk_right: 'Sprites/Pegasus/Pegasus_walk_right_256x256.png',
        attack: 'Sprites/Pegasus/Pegasus_attack_trample_256x256.png',
        attack_down: 'Sprites/Pegasus/Pegasus_attack_down_256x256.png',
        attack_up: 'Sprites/Pegasus/Pegasus_attack_up_256x256.png',
        attack_left: 'Sprites/Pegasus/Pegasus_attack_left_256x256.png',
        attack_right: 'Sprites/Pegasus/Pegasus_attack_right_256x256.png',
        attack_aoe: 'Sprites/Pegasus/Pegasus_inspire_256x256.png',
        inspire: 'Sprites/Pegasus/Pegasus_inspire_256x256.png',
        defend: 'Sprites/Pegasus/Pegasus_defend_down_256x256.png',
        defend_down: 'Sprites/Pegasus/Pegasus_defend_down_256x256.png',
        defend_left: 'Sprites/Pegasus/Pegasus_defend_left_256x256.png',
        defend_right: 'Sprites/Pegasus/Pegasus_defend_right_256x256.png',
        hurt: 'Sprites/Pegasus/Pegasus_hurt_damaged_256x256.png',
        defeated: 'Sprites/Pegasus/Pegasus_defeated_256x256.png'
      },
      baseMove: 3,
      skills: {
        atk1: { name: 'Trample', range: 1, dmg: 30, type: 'target', desc: 'Charges forward with heavenly force, dealing 30 damage.' },
        atk2: { name: 'Inspire', range: 0, type: 'inspire', desc: 'Gives up Pegasus\'s movement for the turn to extend its allies\' movement by 2 tiles.' },
        ability: { name: 'Soar', range: 0, type: 'passive', desc: 'Can pass over tiles that have blocks as long as it lands on a free tile.' }
      },
      passiveHint: 'Ability: Soar — Can pass over tiles that have blocks as long as it lands on a free tile.'
    },

    dreadnaught: {
      id: 'dreadnaught',
      name: 'Dreadnaught',
      element: 'metal',
      stars: 2,
      maxHp: 160,
      cardImg: 'Cards_Legacy/Dreadnaught_Card.png',
      spriteBase: 'Sprites/Dreadnaught/Dreadnaught',
      sprites: {
        idle: 'Sprites/Dreadnaught/Dreadnaught_idle_down_256x256.png',
        idle_down: 'Sprites/Dreadnaught/Dreadnaught_idle_down_256x256.png',
        idle_up: 'Sprites/Dreadnaught/Dreadnaught_idle_up_256x256.png',
        idle_left: 'Sprites/Dreadnaught/Dreadnaught_idle_left_256x256.png',
        idle_right: 'Sprites/Dreadnaught/Dreadnaught_idle_right_256x256.png',
        walk: 'Sprites/Dreadnaught/Dreadnaught_walk_down_256x256.png',
        walk_down: 'Sprites/Dreadnaught/Dreadnaught_walk_down_256x256.png',
        walk_up: 'Sprites/Dreadnaught/Dreadnaught_walk_up_256x256.png',
        walk_left: 'Sprites/Dreadnaught/Dreadnaught_walk_left_256x256.png',
        walk_right: 'Sprites/Dreadnaught/Dreadnaught_walk_right_256x256.png',
        attack: 'Sprites/Dreadnaught/Dreadnaught_attack_magma_fist_256x256.png',
        attack_down: 'Sprites/Dreadnaught/Dreadnaught_attack_magma_fist_256x256.png',
        attack_up: 'Sprites/Dreadnaught/Dreadnaught_attack_up_256x256.png',
        attack_left: 'Sprites/Dreadnaught/Dreadnaught_attack_left_256x256.png',
        attack_right: 'Sprites/Dreadnaught/Dreadnaught_attack_right_256x256.png',
        attack_aoe: 'Sprites/Dreadnaught/Dreadnaught_attack_magma_fist_256x256.png',
        fortress: 'Sprites/Dreadnaught/Dreadnaught_defend_down_256x256.png',
        defend: 'Sprites/Dreadnaught/Dreadnaught_defend_down_256x256.png',
        defend_down: 'Sprites/Dreadnaught/Dreadnaught_defend_down_256x256.png',
        defend_left: 'Sprites/Dreadnaught/Dreadnaught_hurt_256x256.png',
        defend_right: 'Sprites/Dreadnaught/Dreadnaught_defend_up_256x256.png',
        hurt: 'Sprites/Dreadnaught/Dreadnaught_hurt_256x256.png',
        defeated: 'Sprites/Dreadnaught/Dreadnaught_defeated_256x256.png'
      },
      baseMove: 2,
      skills: {
        atk1: { name: 'Magma Fist', range: 1, dmg: 25, type: 'target_magma', desc: 'Deals 25 damage (35 with Burning Heart) and leaves a permanent boiling pool of magma. Non-Fire beasts in magma take 10 damage each turn.' },
        atk2: { name: 'Fortress', range: 1, type: 'fortress_guard', cooldown: 4, desc: 'Dreadnaught intercepts all damage for an ally within 3x3 for 1 turn (4t cd). With Burning Heart, targets self.' },
        ability: { name: 'Burning Heart', range: 0, type: 'passive', desc: 'If all allies are defeated, Magma Fist deals 35 damage and Dreadnaught can use Fortress on itself.' }
      },
      passiveHint: 'Ability: Burning Heart — If all allies are defeated, Magma Fist deals 35 damage and Dreadnaught can Fortress itself.'
    }
  };

  window.BEAST_TEMPLATES = BEAST_TEMPLATES;

  // ---------------------------------------------------------------------------
  // Gwent Card Registry Bridge (Defined in js/gwent_cards.js)
  // ---------------------------------------------------------------------------
  const CardReg = window.MythosGwentCards;
  const GWENT_CARDS = CardReg.CARDS;
  const STANDARD_DECK_RECIPE = CardReg.getDeckRecipe('standard');
  const ROW_ICONS = CardReg.ROW_ICONS;
  const ROW_LABELS = CardReg.ROW_LABELS;

  // ---------------------------------------------------------------------------
  // Main Gwent Engine + Overworld Bridge
  // ---------------------------------------------------------------------------
  class BeastsGame {
    constructor() {
      this.VERSION = '2.03';
      this.gameMode = 'ai'; // 'ai' | '2p'
      this.currentView = 'overworld';
      this.currentChallenger = null;
      this.isMatchOver = false;
      this.aiTimeout = null;

      this.state = null;
      this.elWinnerModal = document.getElementById('winner-modal');
      this.elLog = document.getElementById('combat-log');

      const verEl = document.getElementById('game-version');
      if (verEl) verEl.textContent = `v${this.VERSION}`;

      this.bindEvents();

      if (window.MythosOverworld) {
        this.overworld = new window.MythosOverworld((challenger, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) => {
          this.enterMythosArena(challenger, mapId, customPlayerTeam, customOpponentTeam);
        });
      } else {
        this.enterMythosArena();
      }
    }

    // -------------------------------------------------------------------------
    // Overworld <-> Arena Transitions
    // -------------------------------------------------------------------------
    enterMythosArena(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) {
      this.currentView = 'arena';
      this.currentChallenger = challenger;
      this._parkTourneyMatchRecorded = false;
      if (this.overworld) this.overworld.active = false;

      document.getElementById('btn-rematch')?.classList.remove('hidden');
      const returnOverworldBtn = document.getElementById('btn-return-overworld');
      if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🌲 Return to Overworld';

      document.querySelector('.game-header')?.classList.add('hidden');
      document.getElementById('overworld-view')?.classList.add('hidden');
      document.getElementById('overworld-toolbar')?.classList.add('hidden');
      document.getElementById('arena-view')?.classList.remove('hidden');
      document.getElementById('arena-turn-tracker')?.classList.remove('hidden');
      document.querySelectorAll('.arena-only-ctrl').forEach(el => el.classList.remove('hidden'));

      let subtitleText = 'Best of 3';
      const tourneyCtx = challenger?.tournamentContext;
      if (tourneyCtx?.type === 'park_monday_rr') {
        subtitleText = `Park Rnd ${tourneyCtx.round || 1}/3 vs ${challenger.name}`;
      } else if (challenger?.id === 'pluto') {
        subtitleText = 'vs. Pluto ($1.00 Wager)';
      } else if (challenger) {
        subtitleText = `vs. ${challenger.name}`;
      }
      const sub = document.getElementById('header-subtitle');
      if (sub) sub.textContent = subtitleText;
      const gwentSub = document.getElementById('gwent-arena-subtitle');
      if (gwentSub) gwentSub.textContent = subtitleText;

      const switchBtn = document.getElementById('btn-switch-view');
      if (switchBtn) switchBtn.innerHTML = '🗺️ Return to World';

      // Collect player's signature cards from customPlayerTeam or Overworld inventory/binder
      const invCards = (this.overworld?.inventory || [])
        .filter(i => i.type === 'mythos_card' && (i.beastId || i.id?.startsWith('card_')))
        .map(i => i.beastId || i.id.replace('card_', ''))
        .filter(id => GWENT_CARDS[id]);
      const binderCards = (this.overworld?.binderSlots || [])
        .filter(c => c && (c.beastId || (c.id && c.id.startsWith('card_'))))
        .map(c => c.beastId || c.id.replace('card_', ''))
        .filter(id => GWENT_CARDS[id]);

      const p1Guaranteed = (customPlayerTeam && customPlayerTeam.length)
        ? customPlayerTeam.filter(id => GWENT_CARDS[id])
        : Array.from(new Set([...invCards, ...binderCards])).slice(0, 3);

      const p2Guaranteed = (customOpponentTeam && customOpponentTeam.length)
        ? customOpponentTeam.filter(id => GWENT_CARDS[id])
        : [];

      this.startNewGwentMatch(p1Guaranteed, p2Guaranteed);
    }

    returnToOverworld() {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      this.currentView = 'overworld';
      this.elWinnerModal?.classList.add('hidden');
      document.getElementById('winner-modal')?.classList.add('hidden');
      document.getElementById('gwent-round-overlay')?.classList.add('hidden');
      document.getElementById('gwent-card-modal')?.classList.add('hidden');
      document.getElementById('draft-modal')?.classList.add('hidden');
      document.getElementById('coin-toss-modal')?.classList.add('hidden');

      document.querySelector('.game-header')?.classList.remove('hidden');
      document.getElementById('arena-view')?.classList.add('hidden');
      document.getElementById('arena-turn-tracker')?.classList.add('hidden');
      document.querySelectorAll('.arena-only-ctrl').forEach(el => el.classList.add('hidden'));

      document.getElementById('overworld-view')?.classList.remove('hidden');
      document.getElementById('overworld-toolbar')?.classList.remove('hidden');

      const sub = document.getElementById('header-subtitle');
      if (sub) sub.textContent = '';

      const switchBtn = document.getElementById('btn-switch-view');
      if (switchBtn) switchBtn.innerHTML = '🃏 Quick Duel';

      const challenger = this.currentChallenger;
      this.currentChallenger = null;

      if (this.overworld) {
        this.overworld.active = true;
        try {
          this.overworld.onReturnFromBattle(challenger);
        } catch (err) {
          console.error('onReturnFromBattle error:', err);
        }
        try {
          this.overworld.render();
        } catch (err) {
          console.error('Overworld render error on return:', err);
        }
      }
    }

    // -------------------------------------------------------------------------
    // Deck & Match Initialization
    // -------------------------------------------------------------------------
    buildDeck(guaranteedIds = [], customDeckIds = null) {
      let pool;
      if (Array.isArray(customDeckIds) && customDeckIds.length > 0) {
        pool = customDeckIds.filter(id => GWENT_CARDS[id]);
        if (pool.length < 12) {
          const hasManson = pool.includes('manson_wolf_father');
          const filler = STANDARD_DECK_RECIPE.filter(id => !(hasManson && id === 'manson_wolf_father'));
          for (let i = filler.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [filler[i], filler[j]] = [filler[j], filler[i]];
          }
          pool = [...pool, ...filler].slice(0, 12);
        }
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.map((id, idx) => this.createCardInstance(id, `${id}_${Math.random().toString(36).slice(2, 7)}_${idx}`));
      }

      pool = [...STANDARD_DECK_RECIPE];
      // Shuffle pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // Move guaranteed signature cards to the front so they are drawn into Round 1 hand
      const uniqueGuaranteed = Array.from(new Set(guaranteedIds)).filter(id => GWENT_CARDS[id]);
      const ordered = [];
      uniqueGuaranteed.forEach(gid => {
        const idx = pool.indexOf(gid);
        if (idx !== -1) pool.splice(idx, 1);
        ordered.push(gid);
      });
      const finalIds = [...ordered, ...pool].slice(0, Math.max(12, STANDARD_DECK_RECIPE.length));

      return finalIds.map((id, idx) => this.createCardInstance(id, `${id}_${Math.random().toString(36).slice(2, 7)}_${idx}`));
    }

    createCardInstance(cardId, uid = null) {
      const tmpl = GWENT_CARDS[cardId] || GWENT_CARDS.goblin_soldier;
      return {
        uid: uid || `${cardId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        id: tmpl.id,
        name: tmpl.name,
        role: tmpl.role || 'warrior',
        element: tmpl.element || 'earth',
        stars: tmpl.stars,
        rarity: tmpl.rarity,
        border: tmpl.border || tmpl.rarity,
        row: tmpl.row,
        basePower: tmpl.basePower,
        power: tmpl.basePower,
        armor: tmpl.armor || 0,
        cardImg: tmpl.cardImg,
        abilityTitle: tmpl.abilityTitle,
        abilityDesc: tmpl.abilityDesc,
        passiveTitle: tmpl.passiveTitle,
        passiveDesc: tmpl.passiveDesc,
        rebirthUsed: false,
        resilient: Boolean(tmpl.resilient),
        shield: Boolean(tmpl.shield),
        lifestealHeal: Boolean(tmpl.lifestealHeal),
        onKillPowerGain: tmpl.onKillPowerGain || 0,
        onKillMaxBonus: tmpl.onKillMaxBonus || 0,
        killBonusPower: 0,
        doubleHitIfRowRole: tmpl.doubleHitIfRowRole || null,
        boostRoleAbility: tmpl.boostRoleAbility ? { ...tmpl.boostRoleAbility } : null,
        mansonBoostedThisTurn: false,
        attackedThisTurn: false
      };
    }

    startNewGwentMatch(p1Guaranteed = [], p2Guaranteed = []) {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      this.isMatchOver = false;
      this.elWinnerModal?.classList.add('hidden');
      document.getElementById('gwent-round-overlay')?.classList.add('hidden');

      const playingDeckIds = (this.overworld?.playingDeck || []).filter(id => GWENT_CARDS[id]);
      const p1Deck = this.buildDeck(p1Guaranteed, playingDeckIds);
      const p2Deck = this.buildDeck(p2Guaranteed);

      const p1Hand = p1Deck.splice(0, 7);
      const p2Hand = p2Deck.splice(0, 7);

      const playerName = (this.overworld?.playerName && this.overworld.playerName.trim())
        ? this.overworld.playerName.trim()
        : 'You';

      const oppName = this.currentChallenger?.name
        ? this.currentChallenger.name
        : (this.gameMode === '2p' ? 'Player 2' : 'A.I.');

      const firstTeam = Math.random() < 0.5 ? 1 : 2;
      const starterName = firstTeam === 1 ? playerName : oppName;

      this.state = {
        round: 1,
        turnTeam: firstTeam,
        mulliganActive: true,
        mulliganLeft: 2,
        mulliganSelectedUids: [],
        playedCardThisTurn: false,
        selectedHandUid: null,
        selectedAttackerUid: null,
        inspectedCard: p1Hand[0] || this.createCardInstance('goblin_soldier'),
        players: {
          1: {
            name: playerName,
            gems: 2,
            passed: false,
            turnsThisRound: 0,
            deck: p1Deck,
            hand: p1Hand,
            graveyard: [],
            phoenixReborn: false,
            rows: { melee: [], ranged: [] }
          },
          2: {
            name: oppName,
            gems: 2,
            passed: false,
            turnsThisRound: 0,
            deck: p2Deck,
            hand: p2Hand,
            graveyard: [],
            phoenixReborn: false,
            rows: { melee: [], ranged: [] }
          }
        }
      };

      this.elLog.innerHTML = '';
      this.log(`🃏 Mythos Match started vs. ${oppName}! Draw 7 cards — up to 2 mulligans available.`, 'system');
      this.log(`🪙 Coin flip: ${starterName} won the flip and will go first in Round 1!`, 'system');
      if (p1Guaranteed.length) {
        this.log(`✨ Signature cards in opening hand: ${p1Guaranteed.map(id => GWENT_CARDS[id]?.name).join(', ')}.`, 'system');
      }

      this.render();
    }

    // -------------------------------------------------------------------------
    // Mulligan Phase
    // -------------------------------------------------------------------------
    mulliganCard(uid) {
      if (!this.state || !this.state.mulliganActive || this.state.mulliganLeft <= 0) return;
      const p1 = this.state.players[1];
      const card = p1.hand.find(c => c.uid === uid);
      if (!card || p1.deck.length === 0) return;

      const selected = this.state.mulliganSelectedUids;
      const existingIdx = selected.indexOf(uid);
      if (existingIdx !== -1) {
        selected.splice(existingIdx, 1);
      } else if (selected.length < this.state.mulliganLeft) {
        selected.push(uid);
      } else {
        this.log(`⏳ Up to ${this.state.mulliganLeft} cards can be selected for mulligan. Click a selected card to deselect it.`, 'team1');
        return;
      }

      this.state.inspectedCard = card;
      window.soundFX?.playClick?.();
      this.render();
    }

    confirmMulligan() {
      if (!this.state || !this.state.mulliganActive) return;
      const selected = this.state.mulliganSelectedUids || [];
      if (selected.length === 0) return;

      const p1 = this.state.players[1];
      const swappedCards = [];

      // Draw replacement cards into each selected slot before returning swapped cards to deck
      selected.forEach(uid => {
        const idx = p1.hand.findIndex(c => c.uid === uid);
        if (idx === -1 || p1.deck.length === 0) return;
        const [swapped] = p1.hand.splice(idx, 1);
        const drawn = p1.deck.shift();
        p1.hand.splice(idx, 0, drawn);
        swappedCards.push(swapped);
        this.state.inspectedCard = drawn;
        this.log(`🔄 Mulliganed ${swapped.name} → drew ${drawn.name}.`, 'team1');
      });

      // Return swapped cards to random positions in the deck
      swappedCards.forEach(swapped => {
        const insertAt = Math.floor(Math.random() * (p1.deck.length + 1));
        p1.deck.splice(insertAt, 0, swapped);
      });

      this.state.mulliganLeft = Math.max(0, this.state.mulliganLeft - swappedCards.length);
      this.state.mulliganSelectedUids = [];
      window.soundFX?.playCardFlipReveal?.(false);
      this.finishMulligan();
    }

    finishMulligan() {
      if (!this.state) return;
      this.state.mulliganActive = false;
      this.state.mulliganSelectedUids = [];
      this.state.selectedHandUid = null;
      window.soundFX?.playClick?.();
      const starterName = this.state.players[this.state.turnTeam]?.name || 'Player 1';
      this.log(`⚔️ Mulligan complete! ${starterName} moves first in Round 1.`, 'system');
      this.render();

      if (this.gameMode === 'ai' && this.state.turnTeam === 2) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      }
    }

    // -------------------------------------------------------------------------
    // Scoring Helpers
    // -------------------------------------------------------------------------
    getRowScore(team, rowKey) {
      const cards = this.state.players[team].rows[rowKey];
      return cards.reduce((sum, c) => sum + Math.max(0, c.power), 0);
    }

    getTotalScore(team) {
      const r = this.state.players[team].rows;
      return ['melee', 'ranged'].reduce((sum, k) => sum + this.getRowScore(team, k), 0);
    }

    getAllBoardCards(team) {
      const r = this.state.players[team].rows;
      return [...r.melee, ...r.ranged];
    }

    getBoostableAlliesFor(sourceCard, team) {
      if (!sourceCard?.boostRoleAbility) return [];
      const targetRole = sourceCard.boostRoleAbility.role;
      return this.getAllBoardCards(team).filter(c =>
        c.uid !== sourceCard.uid && c.role === targetRole && !c.mansonBoostedThisTurn
      );
    }

    hasRowRoleAlly(card, team, role) {
      if (!card || !role || !this.state?.players?.[team]?.rows) return false;
      const rows = this.state.players[team].rows;
      const rowKey = ['melee', 'ranged'].find(rk => rows[rk].some(c => c.uid === card.uid));
      if (!rowKey) return false;
      return rows[rowKey].some(c => c.uid !== card.uid && c.role === role);
    }

    canTeamAttackThisTurn(team) {
      return Boolean(this.state?.players?.[team]);
    }

    hasReadyAttackers(team) {
      const oppTeam = team === 1 ? 2 : 1;
      const canAttack = this.canTeamAttackThisTurn(team);
      const hasOpp = this.getAllBoardCards(oppTeam).length > 0;
      return this.getAllBoardCards(team).some(c =>
        (canAttack && !c.attackedThisTurn && hasOpp) || this.getBoostableAlliesFor(c, team).length > 0
      );
    }

    resetTurnAttackFlags(team) {
      if (!this.state) return;
      this.state.playedCardThisTurn = false;
      this.getAllBoardCards(team).forEach(c => {
        c.attackedThisTurn = false;
        c.mansonBoostedThisTurn = false;
      });
    }

    // -------------------------------------------------------------------------
    // Playing Cards & Resolving Mythos Abilities
    // -------------------------------------------------------------------------
    selectHandCard(uid) {
      if (this.isMatchOver || !this.state) return;
      const activeTeam = this.state.turnTeam;
      if (this.gameMode === 'ai' && activeTeam !== 1) return;

      if (this.state.mulliganActive) {
        this.mulliganCard(uid);
        return;
      }

      const player = this.state.players[activeTeam];
      const card = player.hand.find(c => c.uid === uid);
      if (!card) return;

      this.state.inspectedCard = card;
      window.soundFX?.playClick?.();

      if (player.passed || this.state.playedCardThisTurn) {
        this.state.selectedHandUid = null;
        this.showAbilityPopup(card);
        this.render();
        return;
      }

      // Double-click same non-agile card to auto-deploy to its row
      if (this.state.selectedHandUid === uid && card.row !== 'agile') {
        this.playCardToRow(activeTeam, uid, card.row);
        return;
      }

      this.state.selectedAttackerUid = null;
      this.state.selectedHandUid = uid;
      this.showAbilityPopup(card);
      this.render();
    }

    showAbilityPopup(card) {
      const popup = document.getElementById('gwent-ability-popup');
      if (!popup || !card) return;
      const nameEl = document.getElementById('ap-name');
      const roleEl = document.getElementById('ap-role');
      const rowEl = document.getElementById('ap-row');
      const pwrEl = document.getElementById('ap-power');
      const bodyEl = document.getElementById('ap-ability');

      if (nameEl) nameEl.textContent = card.name;
      if (roleEl) roleEl.textContent = card.role || 'Unit';
      if (rowEl) rowEl.textContent = `${ROW_ICONS[card.row]} ${ROW_LABELS[card.row]}`;
      if (pwrEl) pwrEl.textContent = `Base Power: ${card.power}${card.armor > 0 ? ` • 🛡️${card.armor}` : ''}`;
      if (bodyEl) {
        const passiveHtml = card.passiveDesc
          ? `<br><span style="color:#94a3b8;"><b>${card.passiveTitle}:</b> ${card.passiveDesc}</span>`
          : '';
        bodyEl.innerHTML = `<b>${card.abilityTitle}:</b> ${card.abilityDesc}${passiveHtml}`;
      }
      popup.classList.remove('hidden');
    }

    hideAbilityPopup() {
      document.getElementById('gwent-ability-popup')?.classList.add('hidden');
    }

    handleBoardCardClick(ownerTeam, card, rowKey) {
      if (!this.state) return;
      this.state.inspectedCard = card;
      this.renderInspector(card);

      if (this.isMatchOver || this.state.mulliganActive) return;
      const activeTeam = this.state.turnTeam;
      if (this.gameMode === 'ai' && activeTeam !== 1) return;
      if (this.state.players[activeTeam].passed) return;

      const oppTeam = activeTeam === 1 ? 2 : 1;

      if (ownerTeam === activeTeam) {
        const selectedCard = this.state.selectedAttackerUid
          ? this.getAllBoardCards(activeTeam).find(c => c.uid === this.state.selectedAttackerUid)
          : null;

        if (selectedCard && selectedCard.uid !== card.uid && selectedCard.boostRoleAbility) {
          const boostable = this.getBoostableAlliesFor(selectedCard, activeTeam);
          if (boostable.some(c => c.uid === card.uid)) {
            this.executeAllyBoost(activeTeam, selectedCard, card);
            return;
          }
        }

        if (this.state.selectedAttackerUid === card.uid) {
          this.state.selectedAttackerUid = null;
          window.soundFX?.playClick?.();
          this.render();
          return;
        }

        const canAttack = this.canTeamAttackThisTurn(activeTeam) && !card.attackedThisTurn && this.getAllBoardCards(oppTeam).length > 0;
        const canBoost = this.getBoostableAlliesFor(card, activeTeam).length > 0;
        if (!canAttack && !canBoost) {
          if (!this.canTeamAttackThisTurn(activeTeam)) {
            this.log(`⏳ Neither player can attack on their first turn of Round ${this.state.round}.`, activeTeam === 1 ? 'team1' : 'team2');
          } else if (card.attackedThisTurn) {
            this.log(`⏳ ${card.name} has already attacked this turn.`, activeTeam === 1 ? 'team1' : 'team2');
          } else {
            this.log(`⚔️ No opposing cards on the board to attack.`, 'system');
          }
          return;
        }
        this.state.selectedHandUid = null;
        this.state.selectedAttackerUid = card.uid;
        window.soundFX?.playClick?.();
        this.render();
      } else if (this.state.selectedAttackerUid) {
        const attacker = this.getAllBoardCards(activeTeam).find(c => c.uid === this.state.selectedAttackerUid);
        if (attacker && attacker.attackedThisTurn) {
          this.log(`⏳ ${attacker.name} has already attacked this turn. Click a glowing Wolf Pack ally to boost or click ${attacker.name} to cancel.`, activeTeam === 1 ? 'team1' : 'team2');
          return;
        }
        this.executeBoardAttack(activeTeam, this.state.selectedAttackerUid, ownerTeam, card, rowKey);
      }
    }

    executeAllyBoost(team, sourceCard, targetCard) {
      const amt = sourceCard.boostRoleAbility?.amount || 1;
      targetCard.power += amt;
      targetCard.mansonBoostedThisTurn = true;

      const battlefield = document.getElementById('gwent-battlefield');
      const tgtEl = battlefield?.querySelector(`.gwent-card[data-uid="${targetCard.uid}"]`);
      if (battlefield && tgtEl) {
        const bfRect = battlefield.getBoundingClientRect();
        const tRect = tgtEl.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'gwent-dmg-pop boost-pop';
        pop.textContent = `+${amt} 🐺`;
        pop.style.left = `${(tRect.left + tRect.width / 2) - bfRect.left}px`;
        pop.style.top = `${(tRect.top + tRect.height / 2) - bfRect.top}px`;
        battlefield.appendChild(pop);
        setTimeout(() => pop.remove(), 680);
      }

      window.soundFX?.playHowl?.();
      window.soundFX?.playHeal?.();
      this.log(`🐺 ${sourceCard.name} raised ${targetCard.name}'s Power by +${amt}!`, team === 1 ? 'team1' : 'team2');

      if (sourceCard.attackedThisTurn && this.getBoostableAlliesFor(sourceCard, team).length === 0) {
        this.state.selectedAttackerUid = null;
      }

      this.render();
      if (!(this.gameMode === 'ai' && team === 2)) {
        const player = this.state.players[team];
        if ((this.state.playedCardThisTurn || player.hand.length === 0) && !this.hasReadyAttackers(team)) {
          this.advanceTurn();
        }
      }
    }

    executeBoardAttack(attackerTeam, attackerUid, targetTeam, targetCard, targetRow) {
      if (!this.canTeamAttackThisTurn(attackerTeam)) return;
      const attacker = this.getAllBoardCards(attackerTeam).find(c => c.uid === attackerUid);
      if (!attacker || attacker.attackedThisTurn) return;

      const dmg = Math.max(1, attacker.power);
      attacker.attackedThisTurn = true;
      this.state.selectedAttackerUid = null;

      // Trigger line animation & attack sound before re-rendering
      this.playAttackLineAnimation(attacker.uid, targetCard.uid, dmg, attacker.element);
      window.soundFX?.playAttack?.();
      if (attacker.element === 'fire') window.soundFX?.playFire?.();
      else if (attacker.element === 'poison') window.soundFX?.playPoison?.();
      else if (attacker.element === 'plant') window.soundFX?.playWhip?.();
      else if (attacker.element === 'earth') window.soundFX?.playRock?.();

      const logType = attackerTeam === 1 ? 'team1' : 'team2';
      const hitTwice = Boolean(
        attacker.doubleHitIfRowRole && this.hasRowRoleAlly(attacker, attackerTeam, attacker.doubleHitIfRowRole)
      );
      this.log(`⚔️ ${attacker.name} attacked ${targetCard.name} for ${dmg} damage!`, logType);
      this.damageUnit(targetCard, dmg, targetTeam, targetRow);

      let targetDestroyed = !this.state.players[targetTeam]?.rows?.[targetRow]?.some(c => c.uid === targetCard.uid);
      if (hitTwice && !targetDestroyed) {
        this.log(`🔱 ${attacker.name}'s Twin Tide strikes ${targetCard.name} a second time for ${dmg} damage!`, logType);
        this.damageUnit(targetCard, dmg, targetTeam, targetRow);
        targetDestroyed = !this.state.players[targetTeam]?.rows?.[targetRow]?.some(c => c.uid === targetCard.uid);
      }
      if (targetDestroyed && attacker.onKillPowerGain > 0 && (attacker.killBonusPower || 0) < (attacker.onKillMaxBonus || 0)) {
        const remainingCap = (attacker.onKillMaxBonus || 0) - (attacker.killBonusPower || 0);
        const gain = Math.min(attacker.onKillPowerGain, remainingCap);
        if (gain > 0) {
          attacker.killBonusPower = (attacker.killBonusPower || 0) + gain;
          attacker.power += gain;
          window.soundFX?.playHeal?.();
          this.log(`😈 ${attacker.name} destroyed ${targetCard.name} and gained +${gain} Power (${attacker.killBonusPower}/${attacker.onKillMaxBonus} bonus)!`, logType);
        }
      }

      if (attacker.lifestealHeal && attacker.power < attacker.basePower) {
        const rawHeal = Math.max(1, Math.floor(dmg / 2));
        const healed = Math.min(attacker.basePower - attacker.power, rawHeal);
        if (healed > 0) {
          attacker.power += healed;
          const battlefield = document.getElementById('gwent-battlefield');
          const atkEl = battlefield?.querySelector(`.gwent-card[data-uid="${attacker.uid}"]`);
          if (battlefield && atkEl) {
            const bfRect = battlefield.getBoundingClientRect();
            const aRect = atkEl.getBoundingClientRect();
            const pop = document.createElement('div');
            pop.className = 'gwent-dmg-pop boost-pop';
            pop.textContent = `+${healed} 🩸`;
            pop.style.left = `${(aRect.left + aRect.width / 2) - bfRect.left}px`;
            pop.style.top = `${(aRect.top + aRect.height / 2) - bfRect.top}px`;
            battlefield.appendChild(pop);
            setTimeout(() => pop.remove(), 680);
          }
          window.soundFX?.playHeal?.();
          this.log(`🩸 ${attacker.name} drained ${healed} Power to heal itself!`, logType);
        }
      }

      this.render();
      if (!(this.gameMode === 'ai' && attackerTeam === 2)) {
        const player = this.state.players[attackerTeam];
        if ((this.state.playedCardThisTurn || player.hand.length === 0) && !this.hasReadyAttackers(attackerTeam)) {
          this.advanceTurn();
        }
      }
    }

    playAttackLineAnimation(attackerUid, targetUid, dmg, element = 'fire') {
      const battlefield = document.getElementById('gwent-battlefield');
      if (!battlefield) return;

      const atkEl = battlefield.querySelector(`.gwent-card[data-uid="${attackerUid}"]`);
      const tgtEl = battlefield.querySelector(`.gwent-card[data-uid="${targetUid}"]`);
      if (!atkEl || !tgtEl) return;

      const bfRect = battlefield.getBoundingClientRect();
      const aRect = atkEl.getBoundingClientRect();
      const tRect = tgtEl.getBoundingClientRect();

      const x1 = (aRect.left + aRect.width / 2) - bfRect.left;
      const y1 = (aRect.top + aRect.height / 2) - bfRect.top;
      const x2 = (tRect.left + tRect.width / 2) - bfRect.left;
      const y2 = (tRect.top + tRect.height / 2) - bfRect.top;
      const len = Math.max(10, Math.hypot(x2 - x1, y2 - y1));

      const colors = {
        fire: '#fb923c',
        earth: '#fbbf24',
        plant: '#4ade80',
        poison: '#c084fc',
        air: '#38bdf8',
        water: '#22d3ee',
        metal: '#f87171'
      };
      const strokeColor = colors[element] || '#f87171';

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'gwent-attack-svg');

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', 'gwent-attack-beam');
      line.style.color = strokeColor;
      line.style.stroke = strokeColor;
      line.style.strokeDasharray = `${len}`;
      line.style.setProperty('--beam-len', `${len}`);

      svg.appendChild(line);
      battlefield.appendChild(svg);

      const dmgPop = document.createElement('div');
      dmgPop.className = 'gwent-dmg-pop';
      dmgPop.textContent = `-${dmg}`;
      dmgPop.style.left = `${x2}px`;
      dmgPop.style.top = `${y2}px`;
      battlefield.appendChild(dmgPop);

      setTimeout(() => {
        svg.remove();
        dmgPop.remove();
      }, 680);
    }

    playCardToRow(team, uid, targetRow) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive) return;
      if (team !== this.state.turnTeam) return;

      const player = this.state.players[team];
      const oppTeam = team === 1 ? 2 : 1;
      const opp = this.state.players[oppTeam];
      if (player.passed) return;
      if (this.state.playedCardThisTurn) {
        this.log(`⏳ ${player.name} already deployed a card this turn. Attack with ready cards or click End Turn.`, team === 1 ? 'team1' : 'team2');
        return;
      }

      const idx = player.hand.findIndex(c => c.uid === uid);
      if (idx === -1) return;
      const card = player.hand[idx];

      if (card.row !== 'agile' && card.row !== targetRow) return;

      const prePlayMyScore = this.getTotalScore(team);
      const prePlayOppScore = this.getTotalScore(oppTeam);
      const alliesOnBoardBefore = this.getAllBoardCards(team).length;

      player.hand.splice(idx, 1);
      player.rows[targetRow].push(card);
      this.state.playedCardThisTurn = true;
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;
      this.state.inspectedCard = card;
      this.hideAbilityPopup();

      window.soundFX?.playCardFlipReveal?.(card.rarity === 'gold');
      const logType = team === 1 ? 'team1' : 'team2';
      this.log(`${team === 1 ? '☀️' : '🌙'} ${player.name} deployed ${card.name} (${card.power}) to ${ROW_LABELS[targetRow]}.`, logType);

      // Resolve Card Ability
      this.resolveCardAbility(team, card, targetRow, prePlayMyScore, prePlayOppScore, alliesOnBoardBefore);

      this.render();
      if (!(this.gameMode === 'ai' && team === 2) && !this.hasReadyAttackers(team)) {
        this.advanceTurn();
      }
    }

    damageUnit(targetCard, amount, ownerTeam, rowKey) {
      const battlefield = document.getElementById('gwent-battlefield');
      const tgtEl = battlefield?.querySelector(`.gwent-card[data-uid="${targetCard.uid}"]`);

      if (amount > 0 && targetCard.shield) {
        targetCard.shield = false;
        if (battlefield && tgtEl) {
          const bfRect = battlefield.getBoundingClientRect();
          const tRect = tgtEl.getBoundingClientRect();
          const pop = document.createElement('div');
          pop.className = 'gwent-dmg-pop shield-pop';
          pop.textContent = '🔰 SHIELD';
          pop.style.left = `${(tRect.left + tRect.width / 2) - bfRect.left}px`;
          pop.style.top = `${(tRect.top + tRect.height / 2) - bfRect.top}px`;
          battlefield.appendChild(pop);
          setTimeout(() => pop.remove(), 680);
        }
        window.soundFX?.playShieldBreak?.();
        this.log(`🔰 ${targetCard.name}'s Shield absorbed the damage and shattered!`, 'system');
        return;
      }

      if (battlefield && tgtEl) {
        const bfRect = battlefield.getBoundingClientRect();
        const tRect = tgtEl.getBoundingClientRect();
        const dmgPop = document.createElement('div');
        dmgPop.className = 'gwent-dmg-pop';
        dmgPop.textContent = `-${amount}`;
        dmgPop.style.left = `${(tRect.left + tRect.width / 2) - bfRect.left}px`;
        dmgPop.style.top = `${(tRect.top + tRect.height / 2) - bfRect.top}px`;
        battlefield.appendChild(dmgPop);
        setTimeout(() => dmgPop.remove(), 680);
      }

      if (targetCard.armor > 0) {
        targetCard.armor = Math.max(0, targetCard.armor - amount);
        window.soundFX?.playArmorHit?.();
        return;
      }
      if (amount > 0) {
        window.soundFX?.playHit?.();
        targetCard.power = Math.max(0, targetCard.power - amount);
      }
      if (targetCard.power <= 0) {
        const rowArr = this.state.players[ownerTeam].rows[rowKey];
        const i = rowArr.indexOf(targetCard);
        if (i !== -1) rowArr.splice(i, 1);
        this.state.players[ownerTeam].graveyard.push(targetCard);
        window.soundFX?.playDefeat?.();
        this.log(`💀 ${targetCard.name} was destroyed and sent to the Graveyard!`, 'system');
      }
    }

    findStrongestEnemy(oppTeam, allowedRows = ['melee', 'ranged']) {
      let best = null;
      allowedRows.forEach(rk => {
        this.state.players[oppTeam].rows[rk].forEach(c => {
          if (!best || c.power > best.card.power) {
            best = { card: c, rowKey: rk };
          }
        });
      });
      return best;
    }

    resolveCardAbility(team, card, targetRow, prePlayMyScore, prePlayOppScore, alliesOnBoardBefore) {
      const oppTeam = team === 1 ? 2 : 1;
      const logType = team === 1 ? 'team1' : 'team2';
      const cardDef = CardReg.getCard(card.id);
      if (!cardDef) return;
      CardReg.executeEffects(cardDef, {
        game: this,
        team,
        oppTeam,
        card,
        targetRow,
        prePlayMyScore,
        prePlayOppScore,
        alliesOnBoardBefore,
        logType
      });
    }

    // -------------------------------------------------------------------------
    // Passing, Turn Progression & Round Resolution
    // -------------------------------------------------------------------------
    endTurn(team = this.state?.turnTeam) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive) return;
      if (team !== this.state.turnTeam) return;
      if (this.gameMode === 'ai' && team !== 1) return;

      const player = this.state.players[team];
      if (player.passed) return;

      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;
      this.hideAbilityPopup();
      window.soundFX?.playClick?.();
      this.log(`⏭️ ${player.name} ended their turn.`, team === 1 ? 'team1' : 'team2');

      this.advanceTurn();
    }

    passRound(team = this.state?.turnTeam) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive) return;
      if (team !== this.state.turnTeam) return;

      const player = this.state.players[team];
      if (player.passed) return;

      player.passed = true;
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;
      this.hideAbilityPopup();
      window.soundFX?.playMove?.();
      this.log(`🏳️ ${player.name} passed Round ${this.state.round}.`, team === 1 ? 'team1' : 'team2');

      this.render();
      this.advanceTurn();
    }

    advanceTurn() {
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const finishedTeam = this.state.turnTeam;
      if (this.state.players[finishedTeam]) {
        this.state.players[finishedTeam].turnsThisRound = (this.state.players[finishedTeam].turnsThisRound || 0) + 1;
      }

      // Auto-pass if a player has 0 cards left in hand
      if (!p1.passed && p1.hand.length === 0) {
        p1.passed = true;
        this.log(`🏳️ ${p1.name} has no cards left and passes automatically.`, 'team1');
      }
      if (!p2.passed && p2.hand.length === 0) {
        p2.passed = true;
        this.log(`🏳️ ${p2.name} has no cards left and passes automatically.`, 'team2');
      }

      if (p1.passed && p2.passed) {
        this.endRound();
        return;
      }

      // Switch to other player if they haven't passed; otherwise keep current player's turn
      const nextTeam = this.state.turnTeam === 1 ? 2 : 1;
      if (!this.state.players[nextTeam].passed) {
        this.state.turnTeam = nextTeam;
      }

      // Reset per-turn attack & card-play state for the active player's new turn
      this.resetTurnAttackFlags(this.state.turnTeam);
      this.applyTurnStartBoardPassives(this.state.turnTeam);
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;

      this.render();

      if (this.gameMode === 'ai' && this.state.turnTeam === 2 && !this.isMatchOver) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      }
    }

    applyTurnStartBoardPassives(team) {
      const player = this.state?.players?.[team];
      if (!player || player.passed) return;
      const logType = team === 1 ? 'team1' : 'team2';
      let triggered = false;

      ['melee', 'ranged'].forEach(rk => {
        const rowArr = player.rows?.[rk] || [];
        for (let i = 0; i < rowArr.length - 1; i++) {
          if (rowArr[i]?.id === 'mothman' && rowArr[i + 1]) {
            rowArr[i + 1].armor = (rowArr[i + 1].armor || 0) + 1;
            this.log(`🦋 Mothman's Omen Carapace granted +1 Armor to ${rowArr[i + 1].name}!`, logType);
            triggered = true;
          }
        }
      });

      if (triggered) {
        window.soundFX?.playRock?.();
      }
    }

    endRound() {
      const s1 = this.getTotalScore(1);
      const s2 = this.getTotalScore(2);
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];

      let bannerTitle = '';
      if (s1 > s2) {
        p2.gems = Math.max(0, p2.gems - 1);
        bannerTitle = `☀️ ${p1.name.toUpperCase()} WINS ROUND ${this.state.round}!`;
        window.soundFX?.playHeal?.();
        this.log(`🏆 ${p1.name} won Round ${this.state.round} (${s1} vs ${s2})! ${p2.name} loses a Life Gem.`, 'system');
      } else if (s2 > s1) {
        p1.gems = Math.max(0, p1.gems - 1);
        bannerTitle = `🌙 ${p2.name.toUpperCase()} WINS ROUND ${this.state.round}`;
        window.soundFX?.playDefeat?.();
        this.log(`💀 ${p2.name} won Round ${this.state.round} (${s2} vs ${s1}). ${p1.name} loses a Life Gem.`, 'system');
      } else {
        p1.gems = Math.max(0, p1.gems - 1);
        p2.gems = Math.max(0, p2.gems - 1);
        bannerTitle = `⚖️ ROUND ${this.state.round} DRAW!`;
        window.soundFX?.playClick?.();
        this.log(`⚖️ Round ${this.state.round} ended in a draw (${s1} - ${s2}). Both sides lose a Life Gem.`, 'system');
      }

      const overlay = document.getElementById('gwent-round-overlay');
      const titleEl = document.getElementById('round-overlay-title');
      const subEl = document.getElementById('round-overlay-sub');
      if (overlay && titleEl && subEl) {
        titleEl.textContent = bannerTitle;
        subEl.textContent = `${p1.name} ${s1} — ${s2} ${p2.name}`;
        overlay.classList.remove('hidden');
      }

      this.render();

      setTimeout(() => {
        if (overlay) overlay.classList.add('hidden');
        if (p1.gems <= 0 || p2.gems <= 0) {
          this.finishMatch(p1.gems > p2.gems ? 1 : (p2.gems > p1.gems ? 2 : 2));
        } else {
          this.startNextRound(s1 >= s2 ? 1 : 2);
        }
      }, 1700);
    }

    startNextRound(startingTeam) {
      this.state.round += 1;
      this.state.turnTeam = startingTeam;
      this.state.playedCardThisTurn = false;
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;

      [1, 2].forEach(team => {
        const p = this.state.players[team];
        p.passed = false;
        p.turnsThisRound = 0;

        // Move non-resilient board cards to graveyard; keep resilient cards on the battlefield
        ['melee', 'ranged'].forEach(rk => {
          const survivors = [];
          while (p.rows[rk].length > 0) {
            const c = p.rows[rk].pop();
            if (c.resilient) {
              c.attackedThisTurn = false;
              survivors.unshift(c);
              this.log(`🛡️ ${p.name}'s ${c.name} is Resilient and stays on the battlefield!`, team === 1 ? 'team1' : 'team2');
            } else {
              c.power = c.basePower;
              c.armor = GWENT_CARDS[c.id]?.armor || 0;
              c.shield = Boolean(GWENT_CARDS[c.id]?.shield);
              c.mansonBoostedThisTurn = false;
              c.attackedThisTurn = false;
              if (c.id !== 'thorn_sapling') p.graveyard.push(c);
            }
          }
          p.rows[rk] = survivors;
        });

        // Phoenix Rebirth passive
        if (!p.phoenixReborn) {
          const phxIdx = p.graveyard.findIndex(c => c.id === 'phoenix');
          if (phxIdx !== -1) {
            const [phx] = p.graveyard.splice(phxIdx, 1);
            phx.power = 4;
            phx.rebirthUsed = true;
            p.phoenixReborn = true;
            p.rows.ranged.push(phx);
            this.log(`🔥 ${p.name}'s Phoenix rose from the Graveyard onto Ranged with 4 Power!`, team === 1 ? 'team1' : 'team2');
          }
        }

        // Draw 2 cards for the new round
        const drawn = p.deck.splice(0, 2);
        p.hand.push(...drawn);
      });

      window.soundFX?.playCardFlipReveal?.(false);
      const starterName = this.state.players[startingTeam]?.name || 'Player 1';
      this.log(`🃏 Round ${this.state.round} begins! Both players drew up to 2 cards. ${starterName} goes first.`, 'system');
      this.render();

      if (this.gameMode === 'ai' && this.state.turnTeam === 2) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      }
    }

    // -------------------------------------------------------------------------
    // Smart Gwent AI
    // -------------------------------------------------------------------------
    runAiTurn() {
      if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];

      if (p2.hand.length === 0) {
        this.passRound(2);
        return;
      }

      const myScore = this.getTotalScore(2);
      const oppScore = this.getTotalScore(1);

      // 1. If opponent already passed and AI is ahead, pass immediately!
      if (p1.passed && myScore > oppScore) {
        this.passRound(2);
        return;
      }

      // 2. If Round 1 or 2 (AI still has 2 gems) and trailing by 16+ with fewer cards, pass to save cards
      if (p2.gems === 2 && !p1.passed && (oppScore - myScore >= 16) && p2.hand.length <= p1.hand.length) {
        this.passRound(2);
        return;
      }

      // 3. If AI is ahead by 14+ in Round 1 and opponent hasn't passed, consider passing to force card disadvantage
      if (this.state.round === 1 && !p1.passed && (myScore - oppScore >= 14) && p2.hand.length <= 5) {
        this.passRound(2);
        return;
      }

      // 4. Pick best card & row
      let bestChoice = null;
      let bestValue = -999;

      p2.hand.forEach(card => {
        const candidateRows = card.row === 'agile' ? ['melee', 'ranged'] : [card.row];
        candidateRows.forEach(rk => {
          const est = CardReg.estimateCardValue(card, rk, {
            game: this,
            team: 2,
            oppTeam: 1,
            myScore,
            oppScore
          });

          // If opponent already passed, prefer the smallest card that still wins the round
          if (p1.passed) {
            const needed = (oppScore - myScore) + 1;
            if (est >= needed) {
              const efficiency = 100 - est;
              if (efficiency > bestValue) {
                bestValue = efficiency;
                bestChoice = { card, row: rk };
              }
            }
          } else if (est > bestValue) {
            bestValue = est;
            bestChoice = { card, row: rk };
          }
        });
      });

      if (!bestChoice) {
        // Fallback: if opponent passed and no single card can catch up, pass
        if (p1.passed) {
          this.passRound(2);
          return;
        }
        const fallback = p2.hand[0];
        bestChoice = { card: fallback, row: fallback.row === 'agile' ? 'melee' : fallback.row };
      }

      this.playCardToRow(2, bestChoice.card.uid, bestChoice.row);
      this.aiTimeout = setTimeout(() => {
        if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
        this.runAiAttacksAndEnd();
      }, 950);
    }

    runAiAttacksAndEnd() {
      if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;

      // Use any ally-boost abilities (e.g. Manson, Wolf Father) on unboosted allies first
      const booster = this.getAllBoardCards(2).find(c => this.getBoostableAlliesFor(c, 2).length > 0);
      if (booster) {
        const allyTarget = this.getBoostableAlliesFor(booster, 2)[0];
        this.aiTimeout = setTimeout(() => {
          if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
          this.executeAllyBoost(2, booster, allyTarget);
          this.runAiAttacksAndEnd();
        }, 850);
        return;
      }

      const readyAttackers = this.canTeamAttackThisTurn(2)
        ? this.getAllBoardCards(2).filter(c => !c.attackedThisTurn)
        : [];
      const oppTargets = [];
      ['melee', 'ranged'].forEach(rk => {
        this.state.players[1].rows[rk].forEach(c => oppTargets.push({ card: c, rowKey: rk }));
      });

      if (readyAttackers.length === 0 || oppTargets.length === 0) {
        this.aiTimeout = setTimeout(() => {
          if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
          this.advanceTurn();
        }, 650);
        return;
      }

      const attacker = readyAttackers[0];
      const dmg = Math.max(1, attacker.power);
      // Prefer a target that will be destroyed, otherwise the highest-power target
      oppTargets.sort((a, b) => {
        const aKills = (a.card.armor <= 0 && a.card.power <= dmg) ? 1 : 0;
        const bKills = (b.card.armor <= 0 && b.card.power <= dmg) ? 1 : 0;
        if (bKills !== aKills) return bKills - aKills;
        return b.card.power - a.card.power;
      });
      const target = oppTargets[0];

      this.aiTimeout = setTimeout(() => {
        if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
        this.executeBoardAttack(2, attacker.uid, 1, target.card, target.rowKey);
        this.runAiAttacksAndEnd();
      }, 950);
    }

    // -------------------------------------------------------------------------
    // Match End & Overworld Rewards Integration
    // -------------------------------------------------------------------------
    finishMatch(winningTeam) {
      this.isMatchOver = true;
      const isPlayerVictory = winningTeam === 1;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const winnerTitle = isPlayerVictory ? `${p1.name.toUpperCase()} WINS!` : `${p2.name.toUpperCase()} WINS!`;

      const titleEl = document.getElementById('winner-title');
      const msgEl = document.getElementById('winner-message');
      if (titleEl) titleEl.textContent = winnerTitle;

      // Preserve all Overworld challenger reward flows
      if (this.currentChallenger?.id === 'pluto' && msgEl) {
        if (isPlayerVictory) {
          const activeEvent = this.overworld?.getCurrentDayEvent?.();
          const isWagerTuesday = activeEvent?.id === 'wager_tuesday';
          const wagerAmt = isWagerTuesday ? '$2.00' : '$1.00';
          msgEl.innerHTML = `
            You outsmarted <b>Pluto</b> in Mythos (${p1.gems}–${p2.gems} Gems)!<br>
            <div style="margin-top: 14px; padding: 12px 16px; background: rgba(16, 185, 129, 0.22); border: 2px solid #34d399; border-radius: 12px; color: #6ee7b7; text-align: center;">
              🪙 <b>WAGER WON: +${wagerAmt} GOLD!</b><br>
              <span style="font-size: 13px; color: #f8fafc;">Pluto paid out his ${wagerAmt} bet!</span>
            </div>
          `;
          this.overworld?.handlePlutoBattleResult?.(true);
        } else {
          msgEl.innerHTML = `<b>Pluto</b> won the Mythos match.<br><div style="margin-top: 12px; color: #fca5a5;">🪙 You lost your wager to Pluto.</div>`;
          this.overworld?.handlePlutoBattleResult?.(false);
        }
      } else if (isPlayerVictory && this.currentChallenger?.id === 'maya' && msgEl) {
        msgEl.innerHTML = `You defeated <b>Maya</b> in Mythos!<br><div style="margin-top: 12px; color: #86efac;">🌿 Maya: "Breathtaking card synergy!"</div>`;
        this.overworld?.handleMayaBattleResult?.(true);
      } else if (isPlayerVictory && this.currentChallenger?.id === 'silas' && msgEl) {
        msgEl.innerHTML = `You defeated <b>Silas</b> in Mythos!<br><div style="margin-top: 12px; color: #fde68a;">⚙️ Earned +$2.00 & Dwarf Warden Foil Card!</div>`;
        this.overworld?.handleSilasBattleResult?.(true);
      } else if (isPlayerVictory && this.currentChallenger?.id === 'nova' && msgEl) {
        msgEl.innerHTML = `You defeated <b>Nova</b> in Mythos!<br><div style="margin-top: 12px; color: #e9d5ff;">✨ Earned +$2.00 & Pegasus Foil Card!</div>`;
        this.overworld?.handleNovaBattleResult?.(true);
      } else if (this.currentChallenger?.tournamentContext?.type === 'park_monday_rr' && msgEl) {
        document.getElementById('btn-rematch')?.classList.add('hidden');
        const returnOverworldBtn = document.getElementById('btn-return-overworld');
        if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🏆 View Tournament Bracket';
        const margin = (p1.gems - p2.gems) * 10;
        let summary = null;
        if (!this._parkTourneyMatchRecorded && this.overworld?.recordParkMondayMatchResult) {
          this._parkTourneyMatchRecorded = true;
          summary = this.overworld.recordParkMondayMatchResult(this.currentChallenger, isPlayerVictory, margin);
        }
        msgEl.innerHTML = isPlayerVictory
          ? `You defeated <b>${p2.name}</b> in Round ${this.currentChallenger.tournamentContext.round || 1} of the Monday Casual Round Robin!`
          : `<b>${p2.name}</b> won Round ${this.currentChallenger.tournamentContext.round || 1}.`;
        if (summary?.completed) {
          msgEl.innerHTML += `<br><div style="margin-top: 10px; color: #fde68a;">🏆 Tournament Complete! Rank: #${summary.playerRank}</div>`;
        }
      } else if (isPlayerVictory && this.currentChallenger && msgEl) {
        msgEl.innerHTML = `You defeated <b>${this.currentChallenger.name}</b> in Mythos!<br><div style="margin-top: 12px; color: #93c5fd;">🎁 Old Card Binder unlocked in Overworld!</div>`;
        this.overworld?.grantOldCardBinder?.(this.currentChallenger);
      } else if (msgEl) {
        msgEl.textContent = isPlayerVictory
          ? `You outscored ${p2.name} across ${this.state.round} rounds!`
          : `${p2.name} claimed victory in Round ${this.state.round}.`;
      }

      const activeEvent = this.overworld?.getCurrentDayEvent?.();
      if (isPlayerVictory && activeEvent?.id === 'league_night' && this.overworld && msgEl) {
        this.overworld.gold = Math.round(((this.overworld.gold || 0) + 1.50) * 100) / 100;
        this.overworld.saveWorldData?.(this.overworld.draftAppearance);
        this.overworld.updateHUDSaveInfo?.();
        msgEl.innerHTML += `<div style="margin-top: 10px; color: #93c5fd;">🏆 Friday Night Mythos League Bounty: +$1.50!</div>`;
      }

      this.elWinnerModal?.classList.remove('hidden');
      this.log(`🏆 MATCH OVER: ${winnerTitle}`, 'system');
    }

    resetMatch() {
      this.elWinnerModal?.classList.add('hidden');
      this.startNewGwentMatch();
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    render() {
      if (!this.state) return;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const s1 = this.getTotalScore(1);
      const s2 = this.getTotalScore(2);

      // Header tracker
      const roundNumEl = document.getElementById('round-num');
      if (roundNumEl) roundNumEl.textContent = `${this.state.round}/3`;
      const t1Beasts = document.getElementById('team1-beasts');
      const t2Beasts = document.getElementById('team2-beasts');
      if (t1Beasts) t1Beasts.textContent = `Power: ${s1} • ${'💎'.repeat(p1.gems)}`;
      if (t2Beasts) t2Beasts.textContent = `Power: ${s2} • ${'💎'.repeat(p2.gems)}`;
      document.getElementById('team1-badge')?.classList.toggle('active', this.state.turnTeam === 1);
      document.getElementById('team2-badge')?.classList.toggle('active', this.state.turnTeam === 2);

      // Left Sidebar Scoreboards
      document.getElementById('gwent-p1-name').textContent = p1.name;
      document.getElementById('gwent-p2-name').textContent = p2.name;
      document.getElementById('gwent-p1-score').textContent = s1;
      document.getElementById('gwent-p2-score').textContent = s2;
      document.getElementById('gwent-p1-hand-count').textContent = p1.hand.length;
      document.getElementById('gwent-p1-deck-count').textContent = p1.deck.length;
      document.getElementById('gwent-p2-hand-count').textContent = p2.hand.length;
      document.getElementById('gwent-p2-deck-count').textContent = p2.deck.length;

      document.getElementById('gwent-p1-box')?.classList.toggle('active-turn', this.state.turnTeam === 1 && !this.state.mulliganActive);
      document.getElementById('gwent-p2-box')?.classList.toggle('active-turn', this.state.turnTeam === 2 && !this.state.mulliganActive);
      document.getElementById('gwent-p1-passed')?.classList.toggle('hidden', !p1.passed);
      document.getElementById('gwent-p2-passed')?.classList.toggle('hidden', !p2.passed);
      document.getElementById('hud-opp-passed')?.classList.toggle('hidden', !p2.passed);
      document.querySelector('.gwent-side-player')?.classList.toggle('team-passed', Boolean(p1.passed));
      document.querySelector('.gwent-side-opp')?.classList.toggle('team-passed', Boolean(p2.passed));
      const showTurnHighlight = !this.state.mulliganActive && !this.isMatchOver;
      document.querySelector('.gwent-side-player')?.classList.toggle('active-turn-side', showTurnHighlight && this.state.turnTeam === 1);
      document.querySelector('.gwent-side-opp')?.classList.toggle('active-turn-side', showTurnHighlight && this.state.turnTeam === 2);

      this.renderGems('gwent-p1-gems', p1.gems);
      this.renderGems('gwent-p2-gems', p2.gems);

      document.getElementById('gwent-round-pill').textContent = `ROUND ${this.state.round} • BEST OF 3`;
      document.getElementById('gwent-center-badge').textContent = `MYTHOS • ROUND ${this.state.round}`;
      document.getElementById('gwent-turn-banner').textContent = this.state.mulliganActive
        ? `Opening Mulligan (${this.state.mulliganLeft} left)`
        : (this.state.turnTeam === 1 ? `☀️ ${p1.name}'s Turn` : `🌙 ${p2.name}'s Turn`);

      // End Turn & Pass Buttons (Sidebar + Floating HUD)
      const canAct = !this.isMatchOver && !this.state.mulliganActive && (this.gameMode === '2p' || this.state.turnTeam === 1) && !this.state.players[this.state.turnTeam].passed;
      const endTurnBtn = document.getElementById('btn-gwent-end-turn');
      if (endTurnBtn) endTurnBtn.disabled = !canAct;
      const hudEndTurnBtn = document.getElementById('hud-btn-end-turn');
      if (hudEndTurnBtn) hudEndTurnBtn.disabled = !canAct;
      const passBtn = document.getElementById('btn-gwent-pass');
      if (passBtn) passBtn.disabled = !canAct;
      const hudPassBtn = document.getElementById('hud-btn-pass');
      if (hudPassBtn) hudPassBtn.disabled = !canAct;

      const hudP1 = document.getElementById('hud-p1-score');
      if (hudP1) hudP1.textContent = s1;
      const hudP2 = document.getElementById('hud-p2-score');
      if (hudP2) hudP2.textContent = s2;
      const hudRnd = document.getElementById('hud-round-pill');
      if (hudRnd) hudRnd.textContent = `R${this.state.round}`;

      // Mulligan Bar
      const mullBar = document.getElementById('gwent-mulligan-bar');
      const mullSub = document.getElementById('mulligan-sub');
      const mullConfirmBtn = document.getElementById('btn-mulligan-confirm');
      const mullSelectedCount = (this.state.mulliganSelectedUids || []).length;
      if (mullBar) mullBar.classList.toggle('hidden', !this.state.mulliganActive);
      if (mullSub) mullSub.innerHTML = `Select up to <b>${this.state.mulliganLeft} card(s)</b> in your hand, then click <b>Mulligan</b> to redraw (or press Ready).`;
      if (mullConfirmBtn) {
        mullConfirmBtn.disabled = !this.state.mulliganActive || mullSelectedCount === 0;
        mullConfirmBtn.textContent = `🔄 Mulligan (${mullSelectedCount}/${this.state.mulliganLeft})`;
      }

      // Card Inspector
      this.renderInspector(this.state.inspectedCard);

      // Opponent Hand Strip (hidden backs)
      const oppHandEl = document.getElementById('gwent-opp-hand');
      if (oppHandEl) {
        oppHandEl.innerHTML = '';
        for (let i = 0; i < p2.hand.length; i++) {
          const back = document.createElement('img');
          back.src = 'Cards/Mythos_Card_Back.png';
          back.className = 'gwent-card-back-mini';
          back.alt = 'Hidden Card';
          oppHandEl.appendChild(back);
        }
      }

      // 6 Combat Rows
      const activePlayer = this.state.players[this.state.turnTeam];
      const selectedCard = activePlayer.hand.find(c => c.uid === this.state.selectedHandUid);
      const canPlaySelected = !this.isMatchOver
        && !this.state.mulliganActive
        && !activePlayer.passed
        && !this.state.playedCardThisTurn
        && !(this.gameMode === 'ai' && this.state.turnTeam !== 1)
        && Boolean(selectedCard);
      [1, 2].forEach(team => {
        ['melee', 'ranged'].forEach(rk => {
          const scoreEl = document.getElementById(`score-${team}-${rk}`);
          if (scoreEl) scoreEl.textContent = this.getRowScore(team, rk);

          const rowEl = document.getElementById(`row-${team}-${rk}`);
          const isValidDrop = canPlaySelected && team === this.state.turnTeam && (selectedCard.row === 'agile' || selectedCard.row === rk);
          if (rowEl) rowEl.classList.toggle('valid-drop', Boolean(isValidDrop));

          const cardsEl = document.getElementById(`cards-${team}-${rk}`);
          if (cardsEl) {
            cardsEl.innerHTML = '';
            this.state.players[team].rows[rk].forEach(c => {
              cardsEl.appendChild(this.createCardElement(c, true, team, rk));
            });
          }
        });
      });

      // Player Hand (shows active player's hand in 2P hotseat, or P1 during mulligan / AI mode)
      const viewingTeam = (!this.state.mulliganActive && this.gameMode === '2p') ? this.state.turnTeam : 1;
      const handEl = document.getElementById('gwent-player-hand');
      const hintEl = document.getElementById('gwent-hand-hint');
      if (hintEl) {
        const activeAttacker = this.state.selectedAttackerUid
          ? this.getAllBoardCards(this.state.turnTeam).find(c => c.uid === this.state.selectedAttackerUid)
          : null;
        if (this.state.mulliganActive) {
          const selCount = (this.state.mulliganSelectedUids || []).length;
          hintEl.textContent = `Mulligan: Click up to ${this.state.mulliganLeft} cards to select (${selCount} selected), then click Mulligan — or hold click to inspect.`;
        } else if (activeAttacker) {
          const boostTargets = this.getBoostableAlliesFor(activeAttacker, this.state.turnTeam);
          if (boostTargets.length > 0 && !activeAttacker.attackedThisTurn) {
            const atkDmg = Math.max(1, activeAttacker.power);
            hintEl.textContent = `🐺 ${activeAttacker.name} (${atkDmg} Dmg): Click a glowing Wolf Pack ally to give +1 Power, or click an enemy to attack.`;
          } else if (boostTargets.length > 0) {
            hintEl.textContent = `🐺 ${activeAttacker.name}: Click a glowing Wolf Pack ally to give +1 Power, or click ${activeAttacker.name} to cancel.`;
          } else {
            const atkDmg = Math.max(1, activeAttacker.power);
            hintEl.textContent = `⚔️ ${activeAttacker.name} ready (${atkDmg} Dmg): Click a glowing opposing card to attack, or click ${activeAttacker.name} again to cancel.`;
          }
        } else if (canPlaySelected) {
          hintEl.textContent = `Selected ${selectedCard.name}: Click a highlighted ${ROW_LABELS[selectedCard.row]} row to deploy (or click card again to quick-play).`;
        } else if (this.state.playedCardThisTurn) {
          hintEl.textContent = `Card deployed! Click a glowing board card to attack, or click ⏭️ End Turn.`;
        } else if (!this.canTeamAttackThisTurn(this.state.turnTeam)) {
          hintEl.textContent = `First turn of Round ${this.state.round}: Click a hand card to deploy (attacks unlock on your next turn).`;
        } else {
          hintEl.textContent = `Click a hand card to play, click a ready board card to attack, or hold click to view details.`;
        }
      }
      if (handEl) {
        handEl.innerHTML = '';
        this.state.players[viewingTeam].hand.forEach(c => {
          const el = this.createCardElement(c, false);
          if (c.uid === this.state.selectedHandUid) el.classList.add('selected');
          if (this.state.mulliganActive && (this.state.mulliganSelectedUids || []).includes(c.uid)) {
            el.classList.add('mulligan-selected');
          }
          el.addEventListener('click', () => {
            if (el.dataset.longPressTriggered === '1') {
              delete el.dataset.longPressTriggered;
              return;
            }
            this.selectHandCard(c.uid);
          });
          handEl.appendChild(el);
        });
      }

      // Graveyards
      this.renderGraveyard(1);
      this.renderGraveyard(2);
    }

    renderGems(elId, count) {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const span = document.createElement('span');
        span.className = `gem ${i < count ? 'intact' : 'broken'}`;
        span.textContent = '💎';
        el.appendChild(span);
      }
    }

    createCardElement(card, onBoard = false, ownerTeam = null, rowKey = null) {
      const el = document.createElement('div');
      let extraClasses = '';
      if (onBoard && this.state && !this.state.mulliganActive && !this.isMatchOver) {
        const activeTeam = this.state.turnTeam;
        const canControl = this.gameMode === '2p' || activeTeam === 1;
        const canAttack = this.canTeamAttackThisTurn(activeTeam);
        const hasOpp = this.getAllBoardCards(activeTeam === 1 ? 2 : 1).length > 0;
        const canAct = (canAttack && !card.attackedThisTurn && hasOpp) || this.getBoostableAlliesFor(card, activeTeam).length > 0;
        if (canControl && ownerTeam === activeTeam && canAct) {
          extraClasses += ' attack-ready';
        }
        if (this.state.selectedAttackerUid === card.uid) {
          extraClasses += ' attacker-selected';
        }
        const selectedCard = this.state.selectedAttackerUid
          ? this.getAllBoardCards(activeTeam).find(c => c.uid === this.state.selectedAttackerUid)
          : null;
        if (selectedCard && ownerTeam !== activeTeam && !selectedCard.attackedThisTurn) {
          extraClasses += ' attack-target';
        }
        if (selectedCard && ownerTeam === activeTeam && card.uid !== selectedCard.uid && this.getBoostableAlliesFor(selectedCard, activeTeam).some(c => c.uid === card.uid)) {
          extraClasses += ' boost-target';
        }
      }
      if (card.shield) {
        extraClasses += ' has-shield';
      }
      el.className = `gwent-card rarity-${card.border || card.rarity} ${onBoard ? 'board-card' : ''}${extraClasses}`;
      el.dataset.uid = card.uid;

      const powerClass = card.power > card.basePower ? 'boosted' : (card.power < card.basePower ? 'damaged' : '');
      const armorHtml = card.armor > 0 ? `<div class="gwent-card-armor">🛡️${card.armor}</div>` : '';
      const shieldHtml = card.shield ? `<div class="gwent-card-shield-badge" title="Shield: Ignores next instance of damage">🔰</div>` : '';

      el.innerHTML = `
        <img class="gwent-card-art" src="${card.cardImg}" alt="${card.name}">
        <div class="gwent-card-power ${powerClass}">${card.power}</div>
        ${armorHtml}
        ${shieldHtml}
        <div class="gwent-card-row-badge" title="${ROW_LABELS[card.row]}">${ROW_ICONS[card.row]}</div>
        <div class="gwent-card-name-strip">${card.name}</div>
      `;

      // Hold-down click (long press) to open full card details
      let holdTimer = null;
      const cancelHold = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
      };
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        delete el.dataset.longPressTriggered;
        cancelHold();
        holdTimer = setTimeout(() => {
          holdTimer = null;
          el.dataset.longPressTriggered = '1';
          if (this.state) {
            this.state.inspectedCard = card;
            this.renderInspector(card);
          }
          this.openCardModal(card);
        }, 350);
      });
      el.addEventListener('pointerup', cancelHold);
      el.addEventListener('pointerleave', cancelHold);
      el.addEventListener('pointercancel', cancelHold);

      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.openCardModal(card);
      });

      el.addEventListener('mouseenter', () => {
        if (this.state) {
          this.state.inspectedCard = card;
          this.renderInspector(card);
        }
      });
      if (onBoard) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (el.dataset.longPressTriggered === '1') {
            delete el.dataset.longPressTriggered;
            return;
          }
          this.handleBoardCardClick(ownerTeam, card, rowKey);
        });
      }
      return el;
    }

    openCardModal(card) {
      if (!card) return;
      const modal = document.getElementById('gwent-card-modal');
      if (!modal) return;

      const img = document.getElementById('gwent-modal-img');
      if (img) img.src = card.cardImg;
      const nameEl = document.getElementById('gwent-modal-name');
      if (nameEl) nameEl.textContent = card.name;

      const elemEl = document.getElementById('gwent-modal-element');
      if (elemEl) {
        const roleName = card.role || card.element || 'warrior';
        elemEl.textContent = roleName.charAt(0).toUpperCase() + roleName.slice(1);
        elemEl.className = `element-tag ${card.element || 'earth'}`;
      }

      const rowEl = document.getElementById('gwent-modal-row');
      if (rowEl) rowEl.textContent = `${ROW_ICONS[card.row]} ${ROW_LABELS[card.row]}`;

      const rarEl = document.getElementById('gwent-modal-rarity');
      if (rarEl) rarEl.textContent = `${card.stars}★ ${card.rarity.toUpperCase()}`;

      const pwrVal = card.power ?? card.basePower;
      const pwrEl = document.getElementById('gwent-modal-power');
      if (pwrEl) {
        pwrEl.textContent = pwrVal;
        pwrEl.className = 'stat-val ' + (pwrVal > card.basePower ? 'boosted' : (pwrVal < card.basePower ? 'damaged' : ''));
      }

      const armorEl = document.getElementById('gwent-modal-armor');
      if (armorEl) armorEl.textContent = card.armor || 0;

      const abTitle = document.getElementById('gwent-modal-ability-title');
      if (abTitle) abTitle.textContent = `⚔️ ${card.abilityTitle}`;
      const abDesc = document.getElementById('gwent-modal-ability-desc');
      if (abDesc) abDesc.textContent = card.abilityDesc;

      const pasTitle = document.getElementById('gwent-modal-passive-title');
      const pasDesc = document.getElementById('gwent-modal-passive-desc');
      const pasCard = pasTitle?.closest('.gwent-modal-ability-card');
      if (pasCard) pasCard.classList.toggle('hidden', !card.passiveDesc);
      if (pasTitle) pasTitle.textContent = card.passiveTitle ? `🌟 ${card.passiveTitle}` : '';
      if (pasDesc) pasDesc.textContent = card.passiveDesc || '';

      window.soundFX?.playClick?.();
      modal.classList.remove('hidden');
    }

    closeCardModal() {
      document.getElementById('gwent-card-modal')?.classList.add('hidden');
    }

    renderInspector(card) {
      if (!card) return;
      const img = document.getElementById('card-img');
      if (img) img.src = card.cardImg;
      const nameEl = document.getElementById('status-name');
      if (nameEl) nameEl.textContent = card.name;
      const elemEl = document.getElementById('status-element');
      if (elemEl) {
        elemEl.textContent = card.element.charAt(0).toUpperCase() + card.element.slice(1);
        elemEl.className = `element-tag ${card.element}`;
      }
      const rowTag = document.getElementById('status-moves-tag');
      if (rowTag) rowTag.textContent = `${ROW_ICONS[card.row]} ${ROW_LABELS[card.row]}`;
      const pwrEl = document.getElementById('inspect-power');
      if (pwrEl) pwrEl.textContent = `Power: ${card.power} (Base ${card.basePower})`;
      const rarEl = document.getElementById('inspect-rarity');
      if (rarEl) rarEl.textContent = `${card.stars}★ ${card.rarity.toUpperCase()}`;

      const abEl = document.getElementById('brief-ability');
      if (abEl) abEl.innerHTML = `<b>⚔️ ${card.abilityTitle}:</b> ${card.abilityDesc}`;
      const pasEl = document.getElementById('brief-passive');
      if (pasEl) pasEl.innerHTML = `<b>🌟 ${card.passiveTitle}:</b> ${card.passiveDesc}`;
    }

    renderGraveyard(team) {
      const gy = this.state.players[team].graveyard;
      const countEl = document.getElementById(`gy-p${team}-count`);
      const thumbsEl = document.getElementById(`gy-p${team}-thumbs`);
      if (countEl) countEl.textContent = gy.length;
      if (thumbsEl) {
        thumbsEl.innerHTML = '';
        gy.forEach(c => {
          const img = document.createElement('img');
          img.src = c.cardImg;
          img.alt = c.name;
          img.title = `${c.name} (${c.basePower})`;
          img.className = 'gy-thumb-img';
          img.addEventListener('click', () => {
            this.renderInspector(c);
            this.openCardModal(c);
          });
          thumbsEl.appendChild(img);
        });
      }
    }

    log(message, type = 'system') {
      if (!this.elLog) return;
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      entry.textContent = message;
      this.elLog.appendChild(entry);
      this.elLog.scrollTop = this.elLog.scrollHeight;
    }

    // -------------------------------------------------------------------------
    // UI & Event Wiring
    // -------------------------------------------------------------------------
    bindEvents() {
      document.getElementById('btn-switch-view')?.addEventListener('click', () => {
        if (this.currentView === 'overworld') {
          this.enterMythosArena();
        } else {
          this.returnToOverworld();
        }
      });

      document.getElementById('btn-return-overworld')?.addEventListener('click', () => this.returnToOverworld());
      document.getElementById('gwent-btn-world')?.addEventListener('click', () => this.returnToOverworld());
      document.getElementById('btn-rematch')?.addEventListener('click', () => this.resetMatch());
      document.getElementById('btn-reset')?.addEventListener('click', () => this.resetMatch());
      document.getElementById('gwent-btn-reset')?.addEventListener('click', () => this.resetMatch());
      document.getElementById('btn-mulligan-confirm')?.addEventListener('click', () => this.confirmMulligan());
      document.getElementById('btn-mulligan-done')?.addEventListener('click', () => this.finishMulligan());
      document.getElementById('btn-gwent-end-turn')?.addEventListener('click', () => this.endTurn());
      document.getElementById('hud-btn-end-turn')?.addEventListener('click', () => this.endTurn());
      document.getElementById('btn-gwent-pass')?.addEventListener('click', () => this.passRound());
      document.getElementById('hud-btn-pass')?.addEventListener('click', () => this.passRound());
      document.getElementById('btn-clear-log')?.addEventListener('click', () => {
        if (this.elLog) this.elLog.innerHTML = '';
      });

      // Card Detail Zoom Modal events
      document.getElementById('card-frame')?.addEventListener('click', () => {
        if (this.state?.inspectedCard) this.openCardModal(this.state.inspectedCard);
      });
      document.getElementById('btn-close-gwent-card-modal')?.addEventListener('click', () => this.closeCardModal());
      document.getElementById('gwent-card-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'gwent-card-modal') this.closeCardModal();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeCardModal();
      });

      const toggleModeHandler = () => {
        this.gameMode = this.gameMode === 'ai' ? '2p' : 'ai';
        const lbl = document.getElementById('mode-label');
        if (lbl) lbl.textContent = this.gameMode === 'ai' ? 'Solo vs AI' : '2P Hotseat';
        const gLbl = document.getElementById('gwent-mode-label');
        if (gLbl) gLbl.textContent = this.gameMode === 'ai' ? 'Solo AI' : '2P Hotseat';
        this.resetMatch();
      };
      document.getElementById('btn-mode')?.addEventListener('click', toggleModeHandler);
      document.getElementById('gwent-btn-mode')?.addEventListener('click', toggleModeHandler);

      const toggleSoundHandler = () => {
        if (window.soundFX) {
          const enabled = window.soundFX.toggle();
          const icon = enabled ? '🔊' : '🔇';
          const btn1 = document.getElementById('btn-sound');
          const btn2 = document.getElementById('gwent-btn-sound');
          if (btn1) btn1.textContent = icon;
          if (btn2) btn2.textContent = icon;
        }
      };
      document.getElementById('btn-sound')?.addEventListener('click', toggleSoundHandler);
      document.getElementById('gwent-btn-sound')?.addEventListener('click', toggleSoundHandler);

      // Row drop click handlers
      [1, 2].forEach(team => {
        ['melee', 'ranged'].forEach(rk => {
          document.getElementById(`row-${team}-${rk}`)?.addEventListener('click', () => {
            if (!this.state || this.state.mulliganActive) return;
            if (team !== this.state.turnTeam || !this.state.selectedHandUid) return;
            this.playCardToRow(team, this.state.selectedHandUid, rk);
          });
        });
      });

      // Menu Drawer, Chronicle floating window & mobile drawer toggles
      const cardPanel = document.getElementById('card-panel');
      const logPanel = document.getElementById('log-panel');
      const backdrop = document.getElementById('drawer-backdrop');
      const closeDrawers = () => {
        cardPanel?.classList.remove('open');
        logPanel?.classList.add('hidden');
        logPanel?.classList.remove('open');
        backdrop?.classList.add('hidden');
      };
      const toggleLeftMenu = (e) => {
        e?.stopPropagation();
        if (!cardPanel) return;
        const willOpen = !cardPanel.classList.contains('open');
        cardPanel.classList.toggle('open', willOpen);
        backdrop?.classList.toggle('hidden', !willOpen);
      };
      const toggleChronicle = () => {
        if (!logPanel) return;
        const willOpen = logPanel.classList.contains('hidden');
        logPanel.classList.toggle('hidden', !willOpen);
        logPanel.classList.toggle('open', willOpen);
      };
      document.getElementById('btn-gwent-menu')?.addEventListener('click', toggleLeftMenu);
      document.getElementById('btn-close-gwent-menu')?.addEventListener('click', closeDrawers);
      document.getElementById('btn-close-ap')?.addEventListener('click', () => this.hideAbilityPopup());
      document.getElementById('btn-open-chronicle')?.addEventListener('click', toggleChronicle);
      document.getElementById('btn-toggle-card')?.addEventListener('click', toggleLeftMenu);
      document.getElementById('btn-toggle-log')?.addEventListener('click', toggleChronicle);
      document.getElementById('btn-close-log')?.addEventListener('click', closeDrawers);
      backdrop?.addEventListener('click', closeDrawers);

      // Disable native mobile long-press copy/share/save context menu & selection
      window.addEventListener('contextmenu', (e) => {
        if (!e.target?.closest?.('input, textarea')) {
          e.preventDefault();
        }
      }, { passive: false });
      window.addEventListener('selectstart', (e) => {
        if (!e.target?.closest?.('input, textarea')) {
          e.preventDefault();
        }
      }, { passive: false });
      window.addEventListener('dragstart', (e) => {
        if (!e.target?.closest?.('input, textarea')) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }

  window.BeastsGame = BeastsGame;

  window.addEventListener('DOMContentLoaded', () => {
    window.game = new BeastsGame();
  });
})();
