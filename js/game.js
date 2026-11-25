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
    constructor(options = {}) {
      this.VERSION = '2.75';
      this.headless = Boolean(options?.headless);
      this.gameMode = options?.gameMode || 'ai'; // 'ai' | '2p' | 'sim'
      this.currentView = 'overworld';
      this.currentChallenger = null;
      this.isMatchOver = false;
      this.winnerTeam = null;
      this.aiTimeout = null;
      this.autoEndTimeout = null;
      this.turnBannerTimeout = null;

      this.state = null;
      if (this.headless) {
        this.elWinnerModal = null;
        this.elLog = null;
        return;
      }

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

    isAiTeam(team) {
      return this.gameMode === 'sim' || (this.gameMode === 'ai' && team === 2);
    }

    // -------------------------------------------------------------------------
    // Overworld <-> Arena Transitions
    // -------------------------------------------------------------------------
    enterMythosArena(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) {
      this.currentView = 'arena';
      this.currentChallenger = challenger;
      this._parkTourneyMatchRecorded = false;
      this._phoneDuelRecorded = false;
      this._leagueMatchRecorded = false;
      this._firstBattleRewardChecked = false;
      this._barnClubRewardChecked = false;
      if (this.overworld) this.overworld.active = false;

      document.getElementById('btn-rematch')?.classList.remove('hidden');
      const returnOverworldBtn = document.getElementById('btn-return-overworld');
      if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🌲 Return to Overworld';

      document.querySelector('.game-header')?.classList.add('hidden');
      document.getElementById('header-menu-dropdown')?.classList.add('hidden');
      document.getElementById('btn-header-menu')?.setAttribute('aria-expanded', 'false');
      document.getElementById('overworld-view')?.classList.add('hidden');
      document.getElementById('overworld-toolbar')?.classList.add('hidden');
      document.getElementById('arena-view')?.classList.remove('hidden');
      document.getElementById('arena-turn-tracker')?.classList.remove('hidden');
      document.querySelectorAll('.arena-only-ctrl').forEach(el => el.classList.remove('hidden'));
      window.sounds?.stopIntroMusic?.();
      window.sounds?.playBgm?.('battle');

      let subtitleText = 'Best of 3';
      const tourneyCtx = challenger?.tournamentContext;
      if (tourneyCtx?.type === 'park_monday_rr') {
        subtitleText = `Park Rnd ${tourneyCtx.round || 1}/3 vs ${challenger.name}`;
      } else if (tourneyCtx?.type === 'booster_bash') {
        subtitleText = `Booster Bash Rnd ${tourneyCtx.round || 1}/3 vs ${challenger.name}`;
      } else if (tourneyCtx?.type === 'phone_duel_challenge') {
        subtitleText = `📞 Duel Challenge vs ${challenger.name}`;
      } else if (tourneyCtx?.type === 'oakhaven_league') {
        subtitleText = tourneyCtx.stage === 'group'
          ? `🏆 Oakhaven League W${tourneyCtx.week} M${tourneyCtx.matchNum}`
          : `🏆 League ${tourneyCtx.stage === 'final' ? 'Grand Final' : 'Semifinal'}`;
      } else if (challenger?.isTutorial) {
        subtitleText = '🎓 Mythos Tutorial';
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

      const validCustomOpponent = (customOpponentTeam && customOpponentTeam.length)
        ? customOpponentTeam.filter(id => GWENT_CARDS[id])
        : [];
      const p2Guaranteed = validCustomOpponent;
      const p2CustomDeck = validCustomOpponent.length > 0
        ? validCustomOpponent
        : this.getNpcSetDeck(challenger?.id);

      this.startNewGwentMatch(p1Guaranteed, p2Guaranteed, p2CustomDeck);
    }

    returnToOverworld() {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      this.clearAutoEndTimers();
      this.tutorialState = null;
      this.clearTutorialFocusGlow();
      document.getElementById('gwent-tutorial-banner')?.classList.add('hidden');
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
      const areaTrack = this.overworld?.getBgmTrackForArea?.() || 'overworld';
      if (this.overworld) this.overworld._lastBgmArea = this.overworld.currentArea;
      window.sounds?.playBgm?.(areaTrack);

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
    // -------------------------------------------------------------------------
    // NPC Set Decks (18–24 cards, <= 40 stars, 1 large 4★–5★ card + same class)
    // -------------------------------------------------------------------------
    getNpcDeckArchetypes() {
      return {
        berto:        { signature: 'krythos_the_basilisk',  role: 'Lizard',      targetSize: 19, filler: ['vampire_thrall', 'vampire_bat', 'goblin_soldier', 'goblin_archer', 'werewolf_pup'] },
        maya:         { signature: 'manson_wolf_father',    role: 'Wolf Pack',   targetSize: 19, filler: ['goblin_soldier', 'goblin_archer', 'merfolk', 'rust_bucket', 'vampire_bat'] },
        nova:         { signature: 'zavela_the_witch',      role: 'Monster',     targetSize: 19, filler: ['the_nieces', 'vampire_thrall', 'vampire_bat', 'merfolk', 'goblin_archer', 'werewolf_pup'] },
        evelyn:       { signature: 'gooba_goblin_king',     role: 'Water Tribe', targetSize: 20, filler: ['frost_skink', 'goblin_soldier', 'goblin_archer', 'werewolf_pup', 'rust_bucket'] },
        jasper:       { signature: 'krythos_the_basilisk',  role: 'Lizard',      targetSize: 19, filler: ['jersey_devil', 'goblin_soldier', 'goblin_archer', 'werewolf_pup', 'merfolk'] },
        pluto:        { signature: 'jallopy',               role: 'Machine',     targetSize: 19, filler: ['orc_infantry', 'orc_slinger', 'goblin_soldier', 'goblin_archer', 'merfolk'] },
        silas:        { signature: 'oscar_orc_giant',       role: 'Orc Army',    targetSize: 19, filler: ['scrap_heap', 'rust_bucket', 'goblin_soldier', 'goblin_archer', 'werewolf_pup'] },
        best_friend:  { signature: 'gooba_goblin_king',     role: 'Goblin Army', targetSize: 19, filler: ['minerva_wolf_mother', 'werewolf_pup', 'rust_bucket', 'merfolk', 'vampire_bat'] },
        friend:       { signature: 'gooba_goblin_king',     role: 'Goblin Army', targetSize: 19, filler: ['minerva_wolf_mother', 'werewolf_pup', 'rust_bucket', 'merfolk', 'vampire_bat'] },
        friend_duel:  { signature: 'gooba_goblin_king',     role: 'Goblin Army', targetSize: 19, filler: ['minerva_wolf_mother', 'werewolf_pup', 'rust_bucket', 'merfolk', 'vampire_bat'] },
        rowan:        { signature: 'armantha_the_witch',    role: 'Monster',     targetSize: 19, filler: ['baby_lucia', 'vampire_thrall', 'vampire_bat', 'rust_bucket', 'goblin_soldier', 'goblin_archer'] },
        chloe:        { signature: 'manson_wolf_father',    role: 'Wolf Pack',   targetSize: 18, filler: ['sea_dragon', 'merfolk', 'goblin_soldier', 'goblin_archer', 'frost_skink'] },
        clara:        { signature: 'manson_wolf_father',    role: 'Wolf Pack',   targetSize: 18, filler: ['goblin_soldier', 'goblin_archer', 'merfolk', 'vampire_bat', 'rust_bucket'] },
        bram:         { signature: 'oscar_orc_giant',       role: 'Orc Army',    targetSize: 19, filler: ['scrap_heap', 'rust_bucket', 'werewolf_pup', 'goblin_soldier', 'goblin_archer'] },
        mayor_donald: { signature: 'krythos_the_basilisk',  role: 'Lizard',      targetSize: 20, filler: ['orc_infantry', 'scrap_heap', 'merfolk', 'goblin_soldier', 'goblin_archer', 'rust_bucket'] },
        mom:          { signature: 'zavela_the_witch',      role: 'Water Tribe', targetSize: 18, filler: ['minerva_wolf_mother', 'werewolf_pup', 'goblin_soldier', 'goblin_archer', 'rust_bucket'] },
        shopkeeper:   { signature: 'gooba_goblin_king',     role: 'Monster',     targetSize: 19, filler: ['goblin_soldier', 'goblin_archer', 'merfolk', 'werewolf_pup', 'vampire_bat'] },
        chef_marco:   { signature: 'krythos_the_basilisk',  role: 'Lizard',      targetSize: 18, filler: ['orc_infantry', 'merfolk', 'goblin_soldier', 'goblin_archer', 'rust_bucket'] },
        shaun:        { signature: 'lothar_vampire_prince', role: 'Vampire',     targetSize: 18, filler: ['scrap_heap', 'rust_bucket', 'goblin_soldier', 'goblin_archer', 'werewolf_pup'] },
        barn_kid_toby:  { signature: 'gooba_goblin_king',   role: 'Goblin Army', targetSize: 18, filler: ['goblin_soldier', 'goblin_archer', 'werewolf_pup', 'rust_bucket', 'merfolk'] },
        barn_kid_daisy: { signature: 'sea_dragon',          role: 'Water Tribe', targetSize: 18, filler: ['merfolk', 'frost_skink', 'goblin_soldier', 'goblin_archer', 'werewolf_pup'] },
        barn_kid_owen:  { signature: 'krythos_the_basilisk',role: 'Lizard',      targetSize: 18, filler: ['pyromanda', 'frost_skink', 'goblin_soldier', 'goblin_archer', 'rust_bucket'] },
        barn_kid_poppy: { signature: 'manson_wolf_father',  role: 'Wolf Pack',   targetSize: 18, filler: ['werewolf_pup', 'goblin_soldier', 'goblin_archer', 'merfolk', 'vampire_bat'] },
        farmstand_hazel:{ signature: 'manson_wolf_father',  role: 'Wolf Pack',   targetSize: 18, filler: ['werewolf_pup', 'goblin_soldier', 'goblin_archer', 'rust_bucket', 'merfolk'] },
        fishmonger_marina:{ signature: 'sea_dragon',        role: 'Water Tribe', targetSize: 18, filler: ['merfolk', 'frost_skink', 'mersoldier', 'goblin_soldier', 'rust_bucket'] }
      };
    }

    getNpcSetDeck(npcId) {
      if (!npcId) return null;
      const spec = this.getNpcDeckArchetypes()[npcId];
      if (!spec) return null;

      const maxStars = 40;
      const minCards = 18;
      const maxLargeCards = 1;
      const targetSize = Math.max(minCards, Math.min(24, spec.targetSize || 18));
      const deck = [];
      const counts = {};
      let totalStars = 0;
      let largeCount = 0;

      const copyLimit = (id) => {
        const def = GWENT_CARDS[id];
        if (!def) return 0;
        return CardReg.getMaxDeckCopies
          ? CardReg.getMaxDeckCopies(def)
          : ((Number(def.stars) || 1) >= 4 ? 1 : (def.maxDeckCopies ?? 3));
      };

      const tryAdd = (id, maxCopies = null) => {
        const def = GWENT_CARDS[id];
        if (!def || def.isToken || deck.length >= 24) return false;
        const limit = maxCopies === null ? copyLimit(id) : Math.min(maxCopies, copyLimit(id));
        if ((counts[id] || 0) >= limit) return false;
        const stars = Math.max(1, Number(def.stars) || 1);
        const isLarge = stars >= 4;
        if (isLarge && largeCount >= maxLargeCards) return false;
        const remainingSlotsAfter = Math.max(0, minCards - (deck.length + 1));
        // Reserve at least 1 star per remaining required card so we always reach 18+ cards under 40 stars
        if (totalStars + stars + remainingSlotsAfter > maxStars) return false;
        deck.push(id);
        counts[id] = (counts[id] || 0) + 1;
        totalStars += stars;
        if (isLarge) largeCount++;
        return true;
      };

      // 1. High-star signature card
      if (spec.signature) tryAdd(spec.signature, copyLimit(spec.signature));

      // 2. All cards of that same class (role), highest-star first
      const sameClass = Object.values(GWENT_CARDS)
        .filter(c => c && !c.isToken && !c.isAnimatedSpecial && c.role === spec.role)
        .sort((a, b) => (b.stars || 1) - (a.stars || 1));
      for (const c of sameClass) {
        while (deck.length < targetSize && tryAdd(c.id)) {}
      }

      // 3. Deterministic themed filler cards, then any valid 1-star fallback if still under 18
      for (const id of (spec.filler || [])) {
        while (deck.length < targetSize && tryAdd(id)) {}
      }
      if (deck.length < minCards) {
        const fallbacks = Object.values(GWENT_CARDS)
          .filter(c => c && !c.isToken && !c.isAnimatedSpecial)
          .sort((a, b) => (a.stars || 1) - (b.stars || 1));
        for (const c of fallbacks) {
          while (deck.length < minCards && tryAdd(c.id)) {}
        }
      }
      return deck;
    }

    buildDeck(guaranteedIds = [], customDeckIds = null, maxStars = 40, maxLargeCards = Infinity) {
      const minCards = 18;
      const maxCards = 24;
      const getCanon = (id) => (CardReg.getCanonicalCardId ? CardReg.getCanonicalCardId(id) : id);
      const parseEntry = (e) => typeof e === 'string'
        ? { id: e, condition: null, deckIndex: null }
        : { id: e?.id || e?.beastId || '', condition: e?.condition || null, deckIndex: e?.deckIndex ?? null };
      const fillRandomToTarget = (baseEntries) => {
        const result = baseEntries.map(parseEntry).filter(e => e.id);
        const counts = {};
        let totalStars = 0;
        let largeCount = 0;
        result.forEach(entry => {
          const canonId = getCanon(entry.id);
          counts[canonId] = (counts[canonId] || 0) + 1;
          const stars = Math.max(1, Number(GWENT_CARDS[entry.id]?.stars) || 1);
          totalStars += stars;
          if (stars >= 4) largeCount++;
        });
        const allIds = Object.keys(GWENT_CARDS).filter(id => !GWENT_CARDS[id]?.isToken && !GWENT_CARDS[id]?.isAnimatedSpecial);
        let guard = 0;
        while (result.length < minCards && allIds.length > 0 && guard < 600) {
          guard++;
          const pick = allIds[Math.floor(Math.random() * allIds.length)];
          const stars = Math.max(1, Number(GWENT_CARDS[pick]?.stars) || 1);
          const isLarge = stars >= 4;
          if (isLarge && largeCount >= maxLargeCards) continue;
          const remAfter = Math.max(0, minCards - (result.length + 1));
          const limit = CardReg.getMaxDeckCopies ? CardReg.getMaxDeckCopies(pick) : ((stars >= 4) ? 1 : (GWENT_CARDS[pick]?.maxDeckCopies ?? 3));
          const canonPick = getCanon(pick);
          if ((counts[canonPick] || 0) < limit && (totalStars + stars + remAfter <= maxStars)) {
            result.push({ id: pick, condition: null });
            counts[canonPick] = (counts[canonPick] || 0) + 1;
            totalStars += stars;
            if (isLarge) largeCount++;
          }
        }
        return result;
      };

      if (Array.isArray(customDeckIds) && customDeckIds.length > 0) {
        const customCounts = {};
        let totalStars = 0;
        let largeCount = 0;
        let pool = [];
        customDeckIds.forEach(rawEntry => {
          const entry = parseEntry(rawEntry);
          const id = entry.id;
          if (!id || !GWENT_CARDS[id] || pool.length >= maxCards) return;
          const stars = Math.max(1, Number(GWENT_CARDS[id]?.stars) || 1);
          const isLarge = stars >= 4;
          if (isLarge && largeCount >= maxLargeCards) return;
          const limit = CardReg.getMaxDeckCopies ? CardReg.getMaxDeckCopies(id) : ((stars >= 4) ? 1 : (GWENT_CARDS[id]?.maxDeckCopies ?? 3));
          const remAfter = Math.max(0, minCards - (pool.length + 1));
          const canonId = getCanon(id);
          if ((customCounts[canonId] || 0) < limit && totalStars + stars + remAfter <= maxStars) {
            pool.push(entry);
            customCounts[canonId] = (customCounts[canonId] || 0) + 1;
            totalStars += stars;
            if (isLarge) largeCount++;
          }
        });
        if (pool.length < minCards) {
          pool = fillRandomToTarget(pool);
        }
        pool = pool.slice(0, maxCards);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.map((entry, idx) => this.createCardInstance(entry.id, `${entry.id}_${Math.random().toString(36).slice(2, 7)}_${idx}`, entry.condition, entry.deckIndex));
      }

      // When no 18-card deck is built yet, generate a fresh random 18-card deck under 40 stars
      let guaranteedLarge = 0;
      const uniqueGuaranteed = Array.from(new Set(guaranteedIds)).filter(id => {
        if (!GWENT_CARDS[id]) return false;
        const isLarge = (Number(GWENT_CARDS[id]?.stars) || 1) >= 4;
        if (isLarge && guaranteedLarge >= maxLargeCards) return false;
        if (isLarge) guaranteedLarge++;
        return true;
      });
      let pool = fillRandomToTarget(uniqueGuaranteed);
      const rest = pool.slice(uniqueGuaranteed.length);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const finalEntries = [...uniqueGuaranteed.map(parseEntry), ...rest].slice(0, maxCards);

      return finalEntries.map((entry, idx) => this.createCardInstance(entry.id, `${entry.id}_${Math.random().toString(36).slice(2, 7)}_${idx}`, entry.condition, entry.deckIndex));
    }

    createCardInstance(cardId, uid = null, condition = null, deckIndex = null) {
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
        animatedCardVideo: tmpl.animatedCardVideo || null,
        animatedTraditionalVideo: tmpl.animatedTraditionalVideo || null,
        condition: condition ? JSON.parse(JSON.stringify(condition)) : null,
        deckIndex: Number.isInteger(deckIndex) ? deckIndex : null,
        _playedInMatch: false,
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
        allowsMeleeWaterTribeToAttackRanged: Boolean(tmpl.allowsMeleeWaterTribeToAttackRanged),
        endOfTurnRandomAttacks: tmpl.endOfTurnRandomAttacks ? { ...tmpl.endOfTurnRandomAttacks } : null,
        boostRoleAbility: tmpl.boostRoleAbility ? { ...tmpl.boostRoleAbility } : null,
        mansonBoostedThisTurn: false,
        attackedThisTurn: false,
        frozenTurns: 0
      };
    }

    getBinderCardEntries() {
      const entries = [];
      (this.overworld?.binderSlots || []).forEach(slot => {
        if (!slot) return;
        const id = slot.beastId || (slot.id && slot.id.startsWith('card_') ? slot.id.replace('card_', '') : null);
        if (!id || !GWENT_CARDS[id] || GWENT_CARDS[id].isToken) return;
        const qty = Math.max(1, Number(slot.qty) || 1);
        for (let i = 0; i < qty; i++) {
          entries.push({ id, condition: slot.copies?.[i] || null });
        }
      });
      return entries;
    }

    getBinderCardIds() {
      return this.getBinderCardEntries().map(e => e.id);
    }

    startNewGwentMatch(p1Guaranteed = [], p2Guaranteed = [], p2CustomDeck = null) {
      if (this.aiTimeout) clearTimeout(this.aiTimeout);
      this.clearAutoEndTimers();
      this.overworld?.applyEquippedBoardTheme?.();
      this.isMatchOver = false;
      this.elWinnerModal?.classList.add('hidden');
      document.getElementById('gwent-round-overlay')?.classList.add('hidden');
      document.getElementById('gwent-optional-play-modal')?.remove();
      document.getElementById('gwent-forced-pass-modal')?.remove();

      const isTutorial = !!this.currentChallenger?.isTutorial;
      this._wearAppliedThisMatch = false;
      const playingDeckEntries = (this.overworld?.playingDeck || [])
        .map((e, idx) => (typeof e === 'string'
          ? { id: e, condition: null, deckIndex: idx }
          : { id: e?.id || e?.beastId || '', condition: e?.condition || null, deckIndex: idx }))
        .filter(e => e.id && GWENT_CARDS[e.id]);
      let effectivePlayerDeckEntries = playingDeckEntries;
      if (!isTutorial && effectivePlayerDeckEntries.length < 18) {
        const binderEntries = this.getBinderCardEntries();
        if (effectivePlayerDeckEntries.length + binderEntries.length >= 18) {
          effectivePlayerDeckEntries = [...effectivePlayerDeckEntries, ...binderEntries];
        }
      }
      const p1Deck = isTutorial
        ? ['goblin_soldier', 'orc_slinger', 'merfolk', 'rust_bucket', 'werewolf_pup', 'vampire_bat', 'goblin_archer'].map((id, idx) => this.createCardInstance(id, `tut_p1d_${idx}`))
        : this.buildDeck(p1Guaranteed, effectivePlayerDeckEntries);
      const p2Deck = isTutorial
        ? ['goblin_soldier', 'werewolf_pup', 'merfolk', 'rust_bucket', 'vampire_thrall', 'orc_slinger'].map((id, idx) => this.createCardInstance(id, `tut_p2d_${idx}`))
        : this.buildDeck(p2Guaranteed, p2CustomDeck, 40, this.gameMode === 'ai' ? 1 : Infinity);
      this._lastOpponentDeckIds = p2Deck.map(c => c.id);
      this._firstBattleRewardChecked = false;
      this._barnClubRewardChecked = false;

      const p1Hand = isTutorial
        ? ['goblin_soldier', 'goblin_archer', 'orc_infantry', 'rust_bucket', 'werewolf_pup', 'merfolk', 'vampire_bat'].map((id, idx) => this.createCardInstance(id, `tut_p1h_${idx}`))
        : p1Deck.splice(0, 7);
      const p2Hand = isTutorial
        ? ['goblin_soldier', 'orc_slinger', 'werewolf_pup', 'merfolk', 'vampire_thrall', 'rust_bucket'].map((id, idx) => this.createCardInstance(id, `tut_p2h_${idx}`))
        : p2Deck.splice(0, 7);

      const playerName = (this.overworld?.playerName && this.overworld.playerName.trim())
        ? this.overworld.playerName.trim()
        : 'You';

      const oppName = this.currentChallenger?.name
        ? this.currentChallenger.name
        : (this.gameMode === '2p' ? 'Player 2' : 'A.I.');

      const firstTeam = isTutorial ? 1 : (Math.random() < 0.5 ? 1 : 2);
      const starterName = firstTeam === 1 ? playerName : oppName;

      this.state = {
        round: 1,
        turnTeam: firstTeam,
        mulliganActive: !isTutorial,
        mulliganLeft: isTutorial ? 0 : 2,
        mulliganSelectedUids: [],
        playedCardThisTurn: false,
        selectedHandUid: null,
        selectedAttackerUid: null,
        inspectedCard: p1Hand[0] || this.createCardInstance('goblin_soldier'),
        players: {
          1: {
            name: playerName,
            gems: 2,
            roundWins: 0,
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
            roundWins: 0,
            passed: false,
            turnsThisRound: 0,
            deck: p2Deck,
            hand: p2Hand,
            graveyard: [],
            phoenixReborn: false,
            rows: {
              melee: [],
              ranged: []
            }
          }
        }
      };

      this.elLog.innerHTML = '';
      if (isTutorial) {
        this.tutorialState = { active: true, step: 0 };
        this.log(`🎓 Head-to-Head Tutorial started vs. ${oppName}! Follow the walkthrough at the top right.`, 'system');
        this.applyTutorialStepState(0);
        this.renderTutorialBanner();
      } else {
        this.tutorialState = null;
        document.getElementById('gwent-tutorial-banner')?.classList.add('hidden');
        this.log(`🃏 Mythos Match started vs. ${oppName}! Draw 7 cards — up to 2 mulligans available.`, 'system');
        this.log(`🪙 Coin flip: ${starterName} won the flip and will go first in Round 1!`, 'system');
        if (p1Guaranteed.length) {
          this.log(`✨ Signature cards in opening hand: ${p1Guaranteed.map(id => GWENT_CARDS[id]?.name).join(', ')}.`, 'system');
        }
      }

      this.render();
    }

    // -------------------------------------------------------------------------
    // Comprehensive Head-to-Head Tutorial Walkthrough
    // -------------------------------------------------------------------------
    getTutorialSteps() {
      const oppName = this.currentChallenger?.name || 'Rocky';
      return [
        {
          title: '1. How Rounds Are Won',
          focusIds: ['board-total-score-1', 'board-total-score-2'],
          body: `Best of 3 rounds (<b>2 Gems</b> each). When both players pass, the <b>highest total monster Power</b> (Melee + Ranged) wins the round!`,
          tip: 'Look at the glowing score circles on the left — they add both your rows together.'
        },
        {
          title: '2. Active Turn & Auto-End',
          focusIds: ['gwent-p1-box', 'hud-btn-end-turn'],
          body: `The <b>highlighted player</b> is whose turn it is. Play <b>1 card</b> and <b>attack</b> if possible — if no plays or attacks remain, your turn <b>ends automatically</b>.`,
          tip: 'Always check for board attacks before your turn finishes!'
        },
        {
          title: '3. Playing to Melee & Ranged',
          focusIds: ['gwent-row-1-melee'],
          body: `Click <b>Orc Infantry</b> in your hand, then click your glowing <b>Melee row</b> to deploy it (or click <b>Next ▸</b>).`,
          tip: 'Melee cards go in front; Ranged cards go in back. Each adds its Power to your total.'
        },
        {
          title: '4. Melee Row Protects Ranged',
          placement: 'bottom',
          focusIds: ['gwent-row-2-melee', 'gwent-row-2-ranged'],
          body: `${oppName} deployed <b>Goblin Soldier</b> in <b>Melee</b> and <b>Orc Slinger</b> in <b>Ranged</b>. While an enemy has units in their <b>Melee row</b>, their <b>Ranged row is protected</b> — clear Melee first!`,
          tip: 'Tactic: Keep a unit in your Melee row to shield fragile Ranged units. If Melee is empty, attackers can hit Ranged!'
        },
        {
          title: '5. Ranged Attacks & Scoring',
          focusIds: ['gwent-row-1-ranged'],
          body: `<b>Ranged</b> units (like your <b>Goblin Archer</b>) add Power safely behind your Melee line and can attack the enemy front line. Once the enemy <b>Melee row is empty</b>, any unit can strike their <b>Ranged row</b>! Click Goblin Archer to attack, or click <b>Next ▸</b>.`,
          tip: 'Tactic: Damaging or defeating enemy monsters directly lowers their round total.'
        },
        {
          title: '6. Armor, Shields & Synergies',
          focusIds: ['gwent-row-1-melee'],
          body: `• <b>Armor</b> absorbs hits before Power is lost.<br>• <b>Shield</b> (Rust Bucket) blocks the first hit.<br>• Matching classes (e.g. <b>Goblin Army</b>) trigger synergies.`,
          tip: 'Tactic: Play Shielded or Armored units early to soak enemy attacks.'
        },
        {
          title: '7. Card Disadvantage Trap',
          placement: 'bottom',
          focusIds: ['board-total-score-2', 'gwent-p2-hand-count'],
          body: `${oppName} leads <b>16–10</b> and <b>Passed</b> with <b>4 cards</b> left. You have <b>5 cards</b> — and you do <b>NOT</b> draw a full new hand each round!`,
          tip: 'Tactic: Burning 2–3 cards just to win Round 1 leaves you down 2 vs. 4 in Round 2 (Card Disadvantage)!'
        },
        {
          title: '8. Passing to Save Your Hand',
          focusIds: ['hud-btn-pass', 'btn-gwent-pass'],
          body: `Click <b>🏳️ Pass</b> (or <b>Next ▸</b>) to concede Round 1 on purpose and carry all <b>5 cards</b> into Round 2 against ${oppName}'s <b>4</b>!`,
          tip: 'Tactic: Losing Round 1 with extra cards lets you control Rounds 2 & 3.'
        },
        {
          title: '9. Passing Ahead (Force Over-Extend)',
          focusIds: ['hud-btn-pass', 'btn-gwent-pass'],
          body: `Now you lead <b>18–6</b>! Passing while far ahead forces ${oppName} to either give up the round OR <b>over-extend 2–3 cards</b> to steal it.`,
          tip: 'Tactic: Don\'t waste extra cards on a round you already control!'
        },
        {
          title: '10. Round 2 — Card Advantage!',
          focusIds: ['gwent-player-hand'],
          body: `It's <b>Round 2</b> and you hold <b>5 cards vs. ${oppName}'s 4</b>! Finish this practice match or click <b>Skip</b> / <b>🗺️ World</b> to duel for real.`,
          tip: 'Summary: Total Power wins rounds • Melee row protects Ranged • Protect Card Advantage!',
          isFinal: true
        }
      ];
    }

    applyTutorialStepState(stepIdx) {
      if (!this.state) return;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const oppName = p2.name || 'Rocky';

      // Ensure turn belongs to player during guided steps
      this.state.turnTeam = 1;
      this.state.playedCardThisTurn = false;
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;
      p1.passed = false;

      if (stepIdx === 0) {
        p1.rows = { melee: [], ranged: [] };
        p2.rows = { melee: [], ranged: [] };
        p2.passed = false;
        this.log(`📖 Step 1: Total Power across Melee + Ranged wins each Best-of-3 round.`, 'system');
      } else if (stepIdx === 1) {
        this.log(`📖 Step 2: The highlighted player is active. Play 1 card + attack if possible; otherwise your turn auto-ends.`, 'system');
      } else if (stepIdx === 2) {
        if (p1.rows.melee.length === 0 && p1.rows.ranged.length === 0) {
          this.log(`📖 Step 3: Select Orc Infantry from your hand and place it on the Melee row.`, 'system');
        }
      } else if (stepIdx === 3) {
        // Ensure player has Orc Infantry on melee if they clicked Next without playing
        if (p1.rows.melee.length === 0) {
          const idx = p1.hand.findIndex(c => c.id === 'orc_infantry');
          const card = idx !== -1 ? p1.hand.splice(idx, 1)[0] : this.createCardInstance('orc_infantry', 'tut_p1_orc');
          p1.rows.melee.push(card);
        }
        if (p2.rows.melee.length === 0) {
          p2.rows.melee.push(this.createCardInstance('goblin_soldier', 'tut_p2_gob'));
        }
        if (p2.rows.ranged.length === 0) {
          const idx2 = p2.hand.findIndex(c => c.id === 'orc_slinger');
          const oppRanged = idx2 !== -1 ? p2.hand.splice(idx2, 1)[0] : this.createCardInstance('orc_slinger', 'tut_p2_slinger');
          p2.rows.ranged.push(oppRanged);
        }
        this.log(`🌙 ${oppName} deployed Goblin Soldier (Melee) and Orc Slinger (Ranged)! Enemy Melee protects Ranged until cleared.`, 'team2');
      } else if (stepIdx === 4) {
        // Put Goblin Archer on player's ranged row so they can see Ranged attacks & Melee protection
        if (!p1.rows.ranged.some(c => c.id === 'goblin_archer')) {
          const idx = p1.hand.findIndex(c => c.id === 'goblin_archer');
          const archer = idx !== -1 ? p1.hand.splice(idx, 1)[0] : this.createCardInstance('goblin_archer', 'tut_p1_archer');
          archer.attackedThisTurn = false;
          p1.rows.ranged.push(archer);
        }
        if (p2.rows.melee.length === 0) {
          p2.rows.melee.push(this.createCardInstance('goblin_soldier', 'tut_p2_gob'));
        }
        this.log(`☀️ Your Goblin Archer is on the Ranged row — clear the enemy Melee row to open up attacks on their Ranged row!`, 'team1');
      } else if (stepIdx === 5) {
        if (!p1.rows.melee.some(c => c.id === 'rust_bucket')) {
          const idx = p1.hand.findIndex(c => c.id === 'rust_bucket');
          const rb = idx !== -1 ? p1.hand.splice(idx, 1)[0] : this.createCardInstance('rust_bucket', 'tut_p1_rb');
          p1.rows.melee.push(rb);
        }
        if (!p1.rows.melee.some(c => c.id === 'goblin_soldier')) {
          const idx = p1.hand.findIndex(c => c.id === 'goblin_soldier');
          const gs = idx !== -1 ? p1.hand.splice(idx, 1)[0] : this.createCardInstance('goblin_soldier', 'tut_p1_gs');
          p1.rows.melee.push(gs);
        }
        this.log(`🛡️ Rust Bucket brings Shield (blocks first hit), and Goblin Soldier + Goblin Archer share Goblin Army synergy!`, 'system');
      } else if (stepIdx === 6) {
        // Set up clear Card Disadvantage example: Rocky 16 power & Passed with 4 cards; Player 10 power with 5 cards
        p1.rows.melee = [
          this.createCardInstance('orc_infantry', 'tut_cd_p1_1'),
          this.createCardInstance('goblin_soldier', 'tut_cd_p1_2')
        ];
        p1.rows.melee[0].power = 6;
        p1.rows.melee[1].power = 4;
        p1.rows.ranged = [];
        p1.hand = [
          this.createCardInstance('werewolf_pup', 'tut_cd_h1'),
          this.createCardInstance('merfolk', 'tut_cd_h2'),
          this.createCardInstance('vampire_bat', 'tut_cd_h3'),
          this.createCardInstance('goblin_archer', 'tut_cd_h4'),
          this.createCardInstance('rust_bucket', 'tut_cd_h5')
        ];
        p2.rows.melee = [
          this.createCardInstance('orc_infantry', 'tut_cd_p2_1'),
          this.createCardInstance('goblin_soldier', 'tut_cd_p2_2')
        ];
        p2.rows.melee[0].power = 7;
        p2.rows.melee[1].power = 4;
        p2.rows.ranged = [
          this.createCardInstance('orc_slinger', 'tut_cd_p2_3')
        ];
        p2.rows.ranged[0].power = 5;
        p2.hand = [
          this.createCardInstance('werewolf_pup', 'tut_cd_o1'),
          this.createCardInstance('merfolk', 'tut_cd_o2'),
          this.createCardInstance('vampire_thrall', 'tut_cd_o3'),
          this.createCardInstance('rust_bucket', 'tut_cd_o4')
        ];
        p2.passed = true;
        this.log(`⚠️ Card Disadvantage Example: ${oppName} leads 16–10 and Passed with 4 cards left. Don't burn your 5 cards chasing Round 1!`, 'system');
      } else if (stepIdx === 7) {
        this.log(`🏳️ Smart Play: Pass Round 1 to preserve your 5-card vs. 4-card advantage for Rounds 2 & 3!`, 'system');
      } else if (stepIdx === 8) {
        // Reverse example: Player is winning 18-6; passing forces Rocky to either concede or over-extend
        p1.rows.melee = [
          this.createCardInstance('orc_infantry', 'tut_oa_p1_1'),
          this.createCardInstance('goblin_soldier', 'tut_oa_p1_2')
        ];
        p1.rows.melee[0].power = 8;
        p1.rows.melee[1].power = 5;
        p1.rows.ranged = [
          this.createCardInstance('goblin_archer', 'tut_oa_p1_3')
        ];
        p1.rows.ranged[0].power = 5;
        p1.hand = [
          this.createCardInstance('werewolf_pup', 'tut_oa_h1'),
          this.createCardInstance('merfolk', 'tut_oa_h2'),
          this.createCardInstance('vampire_bat', 'tut_oa_h3'),
          this.createCardInstance('rust_bucket', 'tut_oa_h4')
        ];
        p2.rows.melee = [
          this.createCardInstance('goblin_soldier', 'tut_oa_p2_1')
        ];
        p2.rows.melee[0].power = 6;
        p2.rows.ranged = [];
        p2.hand = [
          this.createCardInstance('werewolf_pup', 'tut_oa_o1'),
          this.createCardInstance('merfolk', 'tut_oa_o2'),
          this.createCardInstance('vampire_thrall', 'tut_oa_o3'),
          this.createCardInstance('rust_bucket', 'tut_oa_o4')
        ];
        p2.passed = false;
        this.log(`🎯 Leading 18–6! Passing now forces ${oppName} to either lose the round or over-extend 2–3 cards to steal it.`, 'system');
      } else if (stepIdx === 9) {
        // Transition to Round 2 with player holding 5 cards vs Rocky's 4 cards
        this.state.round = 2;
        p1.gems = 1;
        p2.gems = 2;
        p2.roundWins = 1;
        p1.passed = false;
        p2.passed = false;
        p1.hand = [
          this.createCardInstance('werewolf_pup', 'tut_r2_h1'),
          this.createCardInstance('merfolk', 'tut_r2_h2'),
          this.createCardInstance('vampire_bat', 'tut_r2_h3'),
          this.createCardInstance('goblin_archer', 'tut_r2_h4'),
          this.createCardInstance('rust_bucket', 'tut_r2_h5')
        ];
        p1.rows = { melee: [], ranged: [] };
        p2.rows = { melee: [], ranged: [] };
        this.log(`🔔 Round 2 Started! You kept 5 cards vs. ${oppName}'s 4 — you now hold Card Advantage!`, 'system');
      }
      this.render();
    }

    clearTutorialFocusGlow() {
      document.querySelectorAll('.tut-focus-glow').forEach(el => el.classList.remove('tut-focus-glow'));
    }

    renderTutorialBanner() {
      const banner = document.getElementById('gwent-tutorial-banner');
      if (!banner) return;
      this.clearTutorialFocusGlow();
      if (!this.tutorialState?.active) {
        banner.classList.add('hidden');
        return;
      }
      const steps = this.getTutorialSteps();
      const idx = Math.max(0, Math.min(steps.length - 1, this.tutorialState.step || 0));
      const step = steps[idx];
      const pillEl = document.getElementById('tut-step-pill');
      const titleEl = document.getElementById('tut-title');
      const bodyEl = document.getElementById('tut-body');
      const tipEl = document.getElementById('tut-tip');
      const nextBtn = document.getElementById('tut-btn-next');
      const prevBtn = document.getElementById('tut-btn-prev');
      const progressFill = document.getElementById('tut-progress-fill');
      if (pillEl) pillEl.textContent = `🎓 Step ${idx + 1} / ${steps.length}`;
      if (titleEl) titleEl.textContent = step.title;
      if (bodyEl) bodyEl.innerHTML = step.body;
      if (tipEl) tipEl.textContent = step.tip;
      if (nextBtn) nextBtn.textContent = step.isFinal ? 'Finish & Play! ▸' : 'Next ▸';
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (progressFill) progressFill.style.width = `${((idx + 1) / steps.length) * 100}%`;
      banner.dataset.placement = step.placement || 'top';
      banner.classList.remove('collapsed');
      const collapseBtn = document.getElementById('tut-btn-collapse');
      if (collapseBtn) collapseBtn.textContent = '👁️ View Board';
      banner.classList.remove('hidden');
      if (Array.isArray(step.focusIds)) {
        step.focusIds.forEach(id => {
          document.getElementById(id)?.classList.add('tut-focus-glow');
        });
      }
    }

    prevTutorialStep() {
      if (!this.tutorialState?.active) return;
      if (this.tutorialState.step <= 0) return;
      this.tutorialState.step -= 1;
      if (window.sounds?.playClick) window.sounds.playClick();
      this.applyTutorialStepState(this.tutorialState.step);
      this.renderTutorialBanner();
    }

    advanceTutorialStep() {
      if (!this.tutorialState?.active) return;
      const steps = this.getTutorialSteps();
      if (this.tutorialState.step + 1 >= steps.length) {
        this.closeTutorialBanner(true);
        return;
      }
      this.tutorialState.step += 1;
      if (window.sounds?.playClick) window.sounds.playClick();
      this.applyTutorialStepState(this.tutorialState.step);
      this.renderTutorialBanner();
    }

    closeTutorialBanner(markCompleted = true) {
      this.clearTutorialFocusGlow();
      if (this.tutorialState) {
        this.tutorialState.active = false;
      }
      document.getElementById('gwent-tutorial-banner')?.classList.add('hidden');
      if (markCompleted && this.overworld) {
        this.overworld.hasCompletedTutorial = true;
        this.overworld.saveWorldData?.(this.overworld.draftAppearance);
      }
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

      if (!this.headless && this.gameMode === 'ai' && this.state.turnTeam === 2) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      } else if (!this.headless) {
        this.checkAutoEndTurn(this.state.turnTeam);
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
      const cfg = sourceCard.boostRoleAbility;
      if (cfg.replacesAttack && sourceCard.attackedThisTurn) return [];
      const targetRole = cfg.role;
      return this.getAllBoardCards(team).filter(c =>
        c.uid !== sourceCard.uid &&
        c.role === targetRole &&
        (cfg.replacesAttack || !c.mansonBoostedThisTurn)
      );
    }

    hasRowRoleAlly(card, team, role) {
      if (!card || !role || !this.state?.players?.[team]?.rows) return false;
      const rows = this.state.players[team].rows;
      const rowKey = ['melee', 'ranged'].find(rk => rows[rk].some(c => c.uid === card.uid));
      if (!rowKey) return false;
      return rows[rowKey].some(c => c.uid !== card.uid && c.role === role);
    }

    isDoubleHitActive(card, team) {
      const role = card?.doubleHitIfRowRole || GWENT_CARDS[card?.id]?.doubleHitIfRowRole;
      return Boolean(role && this.hasRowRoleAlly(card, team, role));
    }

    canAttackKillTarget(attacker, attackerTeam, targetCard) {
      if (!attacker || !targetCard) return false;
      const dmg = Math.max(1, attacker.power);
      const hits = this.isDoubleHitActive(attacker, attackerTeam) ? 2 : 1;
      let deflect = Boolean(targetCard.deflectOnce);
      let shield = Boolean(targetCard.shield);
      let armor = targetCard.armor || 0;
      let power = targetCard.power || 0;
      for (let i = 0; i < hits; i++) {
        if (power <= 0) break;
        if (deflect) { deflect = false; continue; }
        if (shield) { shield = false; continue; }
        if (armor > 0) { armor = Math.max(0, armor - dmg); continue; }
        power = Math.max(0, power - dmg);
      }
      return power <= 0;
    }

    getCardRowKey(team, cardUid) {
      const rows = this.state?.players?.[team]?.rows;
      if (!rows) return null;
      for (const rk of ['melee', 'ranged']) {
        if ((rows[rk] || []).some(c => c.uid === cardUid)) return rk;
      }
      return null;
    }

    canCardAttackTargetRow(attackerTeam, attackerUid, targetRow) {
      const attackerRow = this.getCardRowKey(attackerTeam, attackerUid);
      if (targetRow === 'ranged') {
        const oppTeam = attackerTeam === 1 ? 2 : 1;
        const oppMelee = this.state?.players?.[oppTeam]?.rows?.melee || [];
        const attackerRowList = this.state?.players?.[attackerTeam]?.rows?.[attackerRow] || [];
        const attacker = attackerRowList.find(c => c.uid === attackerUid);
        const meleeRow = this.state?.players?.[attackerTeam]?.rows?.melee || [];
        const hasSeaDragon = attackerRow === 'melee' && meleeRow.some(c => c.id === 'sea_dragon' || c.allowsMeleeWaterTribeToAttackRanged);
        const isTidal = attacker && (attacker.id === 'sea_dragon' || attacker.allowsMeleeWaterTribeToAttackRanged || (hasSeaDragon && attacker.role === 'Water Tribe'));
        if (oppMelee.length > 0 && !isTidal) {
          return false;
        }
      }
      return true;
    }

    getValidAttackTargets(attackerTeam, attackerUid) {
      const oppTeam = attackerTeam === 1 ? 2 : 1;
      const rows = this.state?.players?.[oppTeam]?.rows;
      if (!rows) return [];
      const targets = [];
      ['melee', 'ranged'].forEach(rk => {
        if (this.canCardAttackTargetRow(attackerTeam, attackerUid, rk)) {
          (rows[rk] || []).forEach(c => {
            if (!(c.unattackableTurns > 0)) {
              targets.push({ card: c, rowKey: rk });
            }
          });
        }
      });
      return targets;
    }

    canTeamAttackThisTurn(team) {
      return Boolean(this.state?.players?.[team]);
    }

    canPlaceAnyCard(team) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive || this.state.pendingOptionalPlay) {
        return false;
      }
      if (team !== this.state.turnTeam) return false;
      const player = this.state.players?.[team];
      if (!player || player.passed || this.state.playedCardThisTurn) {
        return false;
      }
      return (player.hand || []).some(card =>
        card && (card.row === 'agile' || card.row === 'melee' || card.row === 'ranged')
      );
    }

    canPerformAnyAttack(team) {
      if (!this.canTeamAttackThisTurn(team)) return false;
      return this.getAllBoardCards(team).some(c =>
        !c.attackedThisTurn && this.getValidAttackTargets(team, c.uid).length > 0
      );
    }

    canUseAnyAbility(team) {
      if (this.state?.pendingOptionalPlay) return true;
      return this.getAllBoardCards(team).some(c =>
        this.getBoostableAlliesFor(c, team).length > 0
      );
    }

    hasReadyAttackers(team) {
      return this.canPerformAnyAttack(team) || this.getAllBoardCards(team).some(c =>
        this.getBoostableAlliesFor(c, team).length > 0
      );
    }

    hasAnyAvailableAction(team) {
      return this.canPlaceAnyCard(team) || this.canUseAnyAbility(team) || this.canPerformAnyAttack(team);
    }

    clearAutoEndTimers() {
      if (this.autoEndTimeout) {
        clearTimeout(this.autoEndTimeout);
        this.autoEndTimeout = null;
      }
      if (this.turnBannerTimeout) {
        clearTimeout(this.turnBannerTimeout);
        this.turnBannerTimeout = null;
      }
      if (this.state) this.state.autoEndingTurn = false;
      document.getElementById('gwent-turn-switch-banner')?.classList.add('hidden');
    }

    showTurnSwitchBanner(reasonText, nextText, nextTeam = null, durationMs = 2600) {
      if (this.headless) return;
      const banner = document.getElementById('gwent-turn-switch-banner');
      const reasonEl = document.getElementById('gwent-turn-switch-banner-reason');
      const nextEl = document.getElementById('gwent-turn-switch-banner-next');
      if (!banner || !reasonEl || !nextEl) return;

      if (this.turnBannerTimeout) {
        clearTimeout(this.turnBannerTimeout);
        this.turnBannerTimeout = null;
      }

      reasonEl.textContent = reasonText || 'NO VALID MOVES LEFT';
      nextEl.textContent = nextText || '';
      banner.classList.remove('hidden', 'to-team1', 'to-team2');
      if (nextTeam === 1) banner.classList.add('to-team1');
      else if (nextTeam === 2) banner.classList.add('to-team2');
      void banner.offsetWidth;

      this.turnBannerTimeout = setTimeout(() => {
        banner.classList.add('hidden');
        this.turnBannerTimeout = null;
      }, durationMs);
    }

    /** Automatically end the active turn when no card placements, abilities, or attacks remain. */
    checkAutoEndTurn(team = this.state?.turnTeam) {
      if (this.autoEndTimeout) return true;
      if (this.isMatchOver || !this.state || this.state.mulliganActive || this.state.pendingOptionalPlay) {
        return false;
      }
      if (team !== this.state.turnTeam) return false;
      if (this.headless) return false;
      if (this.isAiTeam(team)) return false;
      const player = this.state.players?.[team];
      if (!player || player.passed) return false;
      if (this.hasAnyAvailableAction(team)) return false;

      const hasPlaceableHandCard = (player.hand || []).some(
        c => c && (c.row === 'agile' || c.row === 'melee' || c.row === 'ranged')
      );
      let reasonText = 'NO VALID MOVES LEFT';
      if (!this.state.playedCardThisTurn && !hasPlaceableHandCard) {
        reasonText = 'OUT OF CARDS — AUTO-PASSED';
      } else if (this.state.playedCardThisTurn && !this.canTeamAttackThisTurn(team)) {
        reasonText = 'CARD DEPLOYED — ATTACKS UNLOCK NEXT TURN';
      }

      const oppTeam = team === 1 ? 2 : 1;
      const opp = this.state.players?.[oppTeam];
      const playerWillAutoPass = !hasPlaceableHandCard;
      let nextText = '';
      let bannerTeam = null;
      if (opp?.passed && playerWillAutoPass) {
        nextText = '⚖️ Resolving Round...';
      } else if (!opp?.passed && opp) {
        bannerTeam = oppTeam;
        nextText = `${oppTeam === 1 ? '☀️ ' : '🌙 '}${opp.name}'s Turn`;
      } else {
        bannerTeam = team;
        nextText = `${team === 1 ? '☀️ ' : '🌙 '}${player.name}'s Next Turn`;
      }

      this.state.autoEndingTurn = true;
      window.soundFX?.playMove?.();
      this.showTurnSwitchBanner(reasonText, nextText, bannerTeam, 2600);
      this.render();
      this.log(`⏭️ ${player.name}: ${reasonText} — switching turn.`, team === 1 ? 'team1' : 'team2');

      this.autoEndTimeout = setTimeout(() => {
        this.autoEndTimeout = null;
        if (!this.state || this.isMatchOver || this.state.turnTeam !== team) return;
        this.state.autoEndingTurn = false;
        this.advanceTurn();
      }, 950);
      return true;
    }

    resetTurnAttackFlags(team) {
      if (!this.state) return;
      this.state.playedCardThisTurn = false;
      this.getAllBoardCards(team).forEach(c => {
        if (c.frozenTurns > 0) {
          c.frozenTurns -= 1;
          c.isFrozenThisTurn = true;
          c.attackedThisTurn = true;
          this.log(`❄️ ${c.name} is frozen and cannot attack this turn!`, team === 1 ? 'team1' : 'team2');
        } else {
          c.isFrozenThisTurn = false;
          c.attackedThisTurn = false;
        }
        c.mansonBoostedThisTurn = false;
      });
    }

    // -------------------------------------------------------------------------
    // Playing Cards & Resolving Mythos Abilities
    // -------------------------------------------------------------------------
    selectHandCard(uid) {
      if (this.isMatchOver || !this.state) return;
      if (this.state.mulliganActive) {
        this.mulliganCard(uid);
        return;
      }

      const activeTeam = this.state.turnTeam;
      if (this.gameMode === 'ai' && activeTeam !== 1) return;

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

    handleBoardCardClick(ownerTeam, card, rowKey, clickEvent = null) {
      if (!this.state) return;
      this.state.inspectedCard = card;
      this.renderInspector(card);

      if (this.isMatchOver || this.state.mulliganActive) return;
      const activeTeam = this.state.turnTeam;
      if (this.gameMode === 'ai' && activeTeam !== 1) return;
      if (this.state.players[activeTeam].passed) return;

      // If a hand card is selected for deployment, clicking left/right side of a board card in a valid row places it on that side
      if (ownerTeam === activeTeam && this.state.selectedHandUid && !this.state.playedCardThisTurn) {
        const selectedHandCard = this.state.players[activeTeam].hand.find(c => c.uid === this.state.selectedHandUid);
        if (selectedHandCard && (selectedHandCard.row === 'agile' || selectedHandCard.row === rowKey)) {
          const rect = clickEvent?.currentTarget?.getBoundingClientRect?.();
          const rowCards = this.state.players[activeTeam].rows[rowKey] || [];
          const cardIdx = rowCards.findIndex(c => c.uid === card.uid);
          if (cardIdx !== -1) {
            const placeLeft = rect ? (clickEvent.clientX - rect.left) < (rect.width / 2) : false;
            this.playCardToRow(activeTeam, this.state.selectedHandUid, rowKey, placeLeft ? cardIdx : cardIdx + 1);
            return;
          }
        }
      }

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

        const hasAnyOpp = this.getAllBoardCards(oppTeam).length > 0;
        const validTargets = this.getValidAttackTargets(activeTeam, card.uid);
        const canAttack = this.canTeamAttackThisTurn(activeTeam) && !card.attackedThisTurn && validTargets.length > 0;
        const canBoost = this.getBoostableAlliesFor(card, activeTeam).length > 0;
        if (!canAttack && !canBoost) {
          if (!this.canTeamAttackThisTurn(activeTeam)) {
            this.log(`⏳ Neither player can attack on their first turn of Round ${this.state.round}.`, activeTeam === 1 ? 'team1' : 'team2');
          } else if (card.attackedThisTurn) {
            this.log(`⏳ ${card.name} has already attacked this turn.`, activeTeam === 1 ? 'team1' : 'team2');
          } else if (hasAnyOpp) {
            this.log(`🛡️ ${card.name} has no valid targets — opposing cards are protected or untargetable.`, activeTeam === 1 ? 'team1' : 'team2');
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
        if (attacker && !this.canCardAttackTargetRow(activeTeam, attacker.uid, rowKey)) {
          this.log(`🛡️ Opponent's Melee row protects their Ranged row — clear Melee first!`, activeTeam === 1 ? 'team1' : 'team2');
          return;
        }
        this.executeBoardAttack(activeTeam, this.state.selectedAttackerUid, ownerTeam, card, rowKey);
      }
    }

    executeAllyBoost(team, sourceCard, targetCard) {
      const cfg = sourceCard.boostRoleAbility || {};
      const amt = cfg.amount || 1;
      const isArmor = cfg.stat === 'armor';
      if (isArmor) {
        targetCard.armor = (targetCard.armor || 0) + amt;
      } else {
        targetCard.power += amt;
      }
      if (cfg.replacesAttack) {
        sourceCard.attackedThisTurn = true;
      } else {
        targetCard.mansonBoostedThisTurn = true;
      }

      const icon = cfg.icon || (isArmor ? '🛡️' : '🐺');
      const battlefield = document.getElementById('gwent-battlefield');
      const tgtEl = battlefield?.querySelector(`.gwent-card[data-uid="${targetCard.uid}"]`);
      if (battlefield && tgtEl) {
        const bfRect = battlefield.getBoundingClientRect();
        const tRect = tgtEl.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'gwent-dmg-pop boost-pop';
        pop.textContent = `+${amt} ${icon}`;
        pop.style.left = `${(tRect.left + tRect.width / 2) - bfRect.left}px`;
        pop.style.top = `${(tRect.top + tRect.height / 2) - bfRect.top}px`;
        battlefield.appendChild(pop);
        setTimeout(() => pop.remove(), 680);
      }

      if (isArmor) {
        window.soundFX?.playRock?.();
        this.log(
          `${icon} ${sourceCard.name} granted ${targetCard.name} +${amt} Armor${cfg.replacesAttack ? ' (in place of attacking)' : ''}!`,
          team === 1 ? 'team1' : 'team2'
        );
      } else {
        window.soundFX?.playHowl?.();
        window.soundFX?.playHeal?.();
        this.log(`🐺 ${sourceCard.name} raised ${targetCard.name}'s Power by +${amt}!`, team === 1 ? 'team1' : 'team2');
      }

      const noAttacksLeftForSource = sourceCard.attackedThisTurn || this.getValidAttackTargets(team, sourceCard.uid).length === 0;
      if (noAttacksLeftForSource && this.getBoostableAlliesFor(sourceCard, team).length === 0) {
        this.state.selectedAttackerUid = null;
      }

      this.render();
      this.checkAutoEndTurn(team);
    }

    executeBoardAttack(attackerTeam, attackerUid, targetTeam, targetCard, targetRow) {
      if (!this.canTeamAttackThisTurn(attackerTeam)) return;
      if (!this.canCardAttackTargetRow(attackerTeam, attackerUid, targetRow)) return;
      const attacker = this.getAllBoardCards(attackerTeam).find(c => c.uid === attackerUid);
      if (!attacker || attacker.attackedThisTurn) return;
      if (targetCard?.unattackableTurns > 0) return;

      const dmg = Math.max(1, attacker.power);
      attacker.attackedThisTurn = true;
      this.state.selectedAttackerUid = null;

      // Capture positions before damageUnit/render in case Twin Tide triggers a second visual strike
      const srcMetrics = this.getBattlefieldCardMetrics(attacker.uid);
      const tgtMetrics = this.getBattlefieldCardMetrics(targetCard.uid);

      // Trigger line animation & class/element-matched attack sound before re-rendering
      this.playAttackLineAnimation(attacker.uid, targetCard.uid, dmg, attacker.element);
      window.soundFX?.playElementAttack?.(attacker.element);

      const logType = attackerTeam === 1 ? 'team1' : 'team2';
      const hitTwice = this.isDoubleHitActive(attacker, attackerTeam);
      this.log(`⚔️ ${attacker.name} attacked ${targetCard.name} for ${dmg} damage!`, logType);
      this.damageUnit(targetCard, dmg, targetTeam, targetRow);

      let targetDestroyed = !this.state.players[targetTeam]?.rows?.[targetRow]?.some(c => c.uid === targetCard.uid);
      if (hitTwice && !targetDestroyed) {
        this.log(`🔱 ${attacker.name}'s Twin Tide strikes ${targetCard.name} a second time for ${dmg} damage!`, logType);
        this.damageUnit(targetCard, dmg, targetTeam, targetRow);
        targetDestroyed = !this.state.players[targetTeam]?.rows?.[targetRow]?.some(c => c.uid === targetCard.uid);

        if (srcMetrics && tgtMetrics) {
          setTimeout(() => {
            if (!srcMetrics.battlefield.isConnected) return;
            this.spawnAttackBeam(srcMetrics.battlefield, srcMetrics.x, srcMetrics.y, tgtMetrics.x, tgtMetrics.y, 'water', 950, '#38bdf8');
            this.spawnAttackRing(srcMetrics.battlefield, tgtMetrics, 'gwent-attack-target-ring', '#38bdf8', 950);
            const pop = document.createElement('div');
            pop.className = 'gwent-dmg-pop twin-tide-pop';
            pop.textContent = `🔱 -${dmg}`;
            pop.style.left = `${tgtMetrics.x}px`;
            pop.style.top = `${tgtMetrics.y - 26}px`;
            srcMetrics.battlefield.appendChild(pop);
            setTimeout(() => pop.remove(), 950);
            window.soundFX?.playElementAttack?.(attacker.element);
          }, 260);
        }
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
            pop.textContent = `+${healed} ❤️`;
            pop.style.left = `${(aRect.left + aRect.width / 2) - bfRect.left}px`;
            pop.style.top = `${(aRect.top + aRect.height / 2) - bfRect.top}px`;
            battlefield.appendChild(pop);
            setTimeout(() => pop.remove(), 680);
          }
          window.soundFX?.playHeal?.();
          this.log(`🩸 ${attacker.name} drained ${healed} HP to heal itself!`, logType);
        }
      }

      this.render();
      this.checkAutoEndTurn(attackerTeam);
    }

    getBattlefieldCardMetrics(uid) {
      const battlefield = document.getElementById('gwent-battlefield');
      const cardEl = battlefield?.querySelector(`.gwent-card[data-uid="${uid}"]`);
      if (!battlefield || !cardEl) return null;
      const bfRect = battlefield.getBoundingClientRect();
      const rect = cardEl.getBoundingClientRect();
      return {
        battlefield,
        x: (rect.left + rect.width / 2) - bfRect.left,
        y: (rect.top + rect.height / 2) - bfRect.top,
        width: rect.width,
        height: rect.height
      };
    }

    getElementBeamColor(element = 'fire') {
      const colors = {
        fire: '#fb923c',
        earth: '#eab308',
        plant: '#4ade80',
        poison: '#c084fc',
        air: '#bae6fd',
        water: '#06b6d4',
        metal: '#cbd5e1'
      };
      return colors[element] || '#f87171';
    }

    spawnAttackBeam(battlefield, x1, y1, x2, y2, element = 'fire', durationMs = 1150, colorOverride = null) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.max(10, Math.hypot(dx, dy));
      const pullback = Math.min(12, dist * 0.2);
      const endX = x2 - (dx / dist) * pullback;
      const endY = y2 - (dy / dist) * pullback;
      const len = Math.max(10, Math.hypot(endX - x1, endY - y1));
      const strokeColor = colorOverride || this.getElementBeamColor(element);
      const markerId = `gwent-beam-arrow-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'gwent-attack-svg');

      const defs = document.createElementNS(svgNS, 'defs');
      const marker = document.createElementNS(svgNS, 'marker');
      marker.setAttribute('id', markerId);
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '5');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'strokeWidth');
      const arrowPath = document.createElementNS(svgNS, 'path');
      arrowPath.setAttribute('d', 'M 0 0.5 L 6 3 L 0 5.5 z');
      arrowPath.setAttribute('fill', strokeColor);
      marker.appendChild(arrowPath);
      defs.appendChild(marker);
      svg.appendChild(defs);

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('class', 'gwent-attack-beam');
      line.setAttribute('marker-end', `url(#${markerId})`);
      line.style.color = strokeColor;
      line.style.stroke = strokeColor;
      line.style.strokeDasharray = `${len}`;
      line.style.setProperty('--beam-len', `${len}`);

      svg.appendChild(line);
      battlefield.appendChild(svg);
      setTimeout(() => svg.remove(), durationMs);
    }

    spawnAttackRing(battlefield, metrics, className, color, durationMs = 1150) {
      if (!battlefield || !metrics) return;
      const ring = document.createElement('div');
      ring.className = className;
      ring.style.color = color;
      ring.style.left = `${metrics.x}px`;
      ring.style.top = `${metrics.y}px`;
      ring.style.width = `${metrics.width + 10}px`;
      ring.style.height = `${metrics.height + 10}px`;
      battlefield.appendChild(ring);
      setTimeout(() => ring.remove(), durationMs);
    }

    clearAttackTargetPreviewLine() {
      document.getElementById('gwent-target-preview-svg')?.remove();
    }

    renderAttackTargetPreviewLine() {
      this.clearAttackTargetPreviewLine();
      if (!this.state || this.isMatchOver || this.state.mulliganActive || !this.state.selectedAttackerUid) return;

      const activeTeam = this.state.turnTeam;
      const attacker = this.getAllBoardCards(activeTeam).find(c => c.uid === this.state.selectedAttackerUid);
      if (!attacker) return;

      let enemyTarget = null;
      if (!attacker.attackedThisTurn && this.canTeamAttackThisTurn(activeTeam)) {
        const validTargets = this.getValidAttackTargets(activeTeam, attacker.uid);
        if (validTargets && validTargets.length > 0) {
          const meleeTargets = validTargets.filter(t => t.rowKey === 'melee');
          const pool = meleeTargets.length > 0 ? meleeTargets : validTargets;
          enemyTarget = pool[Math.floor((pool.length - 1) / 2)]?.card || null;
        }
      }

      const boostableAllies = this.getBoostableAlliesFor(attacker, activeTeam);
      const allyTarget = boostableAllies.length > 0
        ? boostableAllies[Math.floor((boostableAllies.length - 1) / 2)]
        : null;

      if (!enemyTarget && !allyTarget) return;

      const from = this.getBattlefieldCardMetrics(attacker.uid);
      if (!from) return;

      const enemyTo = enemyTarget ? this.getBattlefieldCardMetrics(enemyTarget.uid) : null;
      const allyTo = allyTarget ? this.getBattlefieldCardMetrics(allyTarget.uid) : null;
      if (!enemyTo && !allyTo) return;

      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('id', 'gwent-target-preview-svg');
      svg.setAttribute('class', 'gwent-attack-svg gwent-target-preview-svg');

      const defs = document.createElementNS(svgNS, 'defs');
      const createArrowMarker = (id, fill) => {
        const marker = document.createElementNS(svgNS, 'marker');
        marker.setAttribute('id', id);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '7');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        const arrowPath = document.createElementNS(svgNS, 'path');
        arrowPath.setAttribute('d', 'M 0 0.5 L 8 3.5 L 0 6.5 z');
        arrowPath.setAttribute('fill', fill);
        marker.appendChild(arrowPath);
        return marker;
      };
      defs.appendChild(createArrowMarker('gwent-attack-arrow-red', '#ef4444'));
      defs.appendChild(createArrowMarker('gwent-ally-arrow-green', '#22c55e'));
      svg.appendChild(defs);

      const appendTargetLine = (to, isAlly) => {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) return false;

        const pullback = Math.min(16, dist * 0.25);
        const endX = to.x - (dx / dist) * pullback;
        const endY = to.y - (dy / dist) * pullback;
        const variantClass = isAlly ? ' ally-target' : '';

        const glowLine = document.createElementNS(svgNS, 'line');
        glowLine.setAttribute('x1', from.x);
        glowLine.setAttribute('y1', from.y);
        glowLine.setAttribute('x2', endX);
        glowLine.setAttribute('y2', endY);
        glowLine.setAttribute('class', `gwent-target-line-glow${variantClass}`);
        svg.appendChild(glowLine);

        const coreLine = document.createElementNS(svgNS, 'line');
        coreLine.setAttribute('x1', from.x);
        coreLine.setAttribute('y1', from.y);
        coreLine.setAttribute('x2', endX);
        coreLine.setAttribute('y2', endY);
        coreLine.setAttribute('class', `gwent-target-line-core${variantClass}`);
        coreLine.setAttribute('marker-end', `url(#${isAlly ? 'gwent-ally-arrow-green' : 'gwent-attack-arrow-red'})`);
        svg.appendChild(coreLine);

        const reticle = document.createElementNS(svgNS, 'circle');
        reticle.setAttribute('cx', to.x);
        reticle.setAttribute('cy', to.y);
        reticle.setAttribute('r', '13');
        reticle.setAttribute('class', `gwent-target-reticle${variantClass}`);
        svg.appendChild(reticle);

        return true;
      };

      const drewEnemy = enemyTo ? appendTargetLine(enemyTo, false) : false;
      const drewAlly = allyTo ? appendTargetLine(allyTo, true) : false;
      if (!drewEnemy && !drewAlly) return;

      if (drewEnemy && drewAlly) {
        const allyDot = document.createElementNS(svgNS, 'circle');
        allyDot.setAttribute('cx', from.x);
        allyDot.setAttribute('cy', from.y);
        allyDot.setAttribute('r', '7.5');
        allyDot.setAttribute('class', 'gwent-target-dot ally-target');
        svg.appendChild(allyDot);

        const enemyDot = document.createElementNS(svgNS, 'circle');
        enemyDot.setAttribute('cx', from.x);
        enemyDot.setAttribute('cy', from.y);
        enemyDot.setAttribute('r', '5');
        enemyDot.setAttribute('class', 'gwent-target-dot');
        svg.appendChild(enemyDot);
      } else {
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', from.x);
        dot.setAttribute('cy', from.y);
        dot.setAttribute('r', '5.5');
        dot.setAttribute('class', drewAlly ? 'gwent-target-dot ally-target' : 'gwent-target-dot');
        svg.appendChild(dot);
      }

      from.battlefield.appendChild(svg);
    }

    playAttackLineAnimation(attackerUid, targetUid, dmg, element = 'fire') {
      const src = this.getBattlefieldCardMetrics(attackerUid);
      const tgt = this.getBattlefieldCardMetrics(targetUid);
      if (!src || !tgt) return;

      const durationMs = 1150;
      const color = '#ef4444';
      this.spawnAttackRing(src.battlefield, src, 'gwent-attack-source-ring', color, durationMs);
      this.spawnAttackRing(src.battlefield, tgt, 'gwent-attack-target-ring', color, durationMs);
      this.spawnAttackBeam(src.battlefield, src.x, src.y, tgt.x, tgt.y, element, durationMs, color);

      const dmgPop = document.createElement('div');
      dmgPop.className = 'gwent-dmg-pop';
      dmgPop.textContent = `-${dmg}`;
      dmgPop.style.left = `${tgt.x}px`;
      dmgPop.style.top = `${tgt.y}px`;
      src.battlefield.appendChild(dmgPop);

      setTimeout(() => {
        dmgPop.remove();
      }, durationMs);
    }

    playAbilitySourceFlare(sourceMetrics, label = '🔥 Ember Volley', durationMs = 820) {
      if (this.headless || !sourceMetrics?.battlefield) return;
      const { battlefield, x, y, width, height } = sourceMetrics;

      const halo = document.createElement('div');
      halo.className = 'gwent-ability-source-halo';
      halo.style.left = `${x}px`;
      halo.style.top = `${y}px`;
      halo.style.width = `${width + 8}px`;
      halo.style.height = `${height + 8}px`;
      battlefield.appendChild(halo);

      const tag = document.createElement('div');
      tag.className = 'gwent-ability-source-tag';
      tag.textContent = label;
      tag.style.left = `${x}px`;
      tag.style.top = `${Math.max(8, y - height / 2 - 6)}px`;
      battlefield.appendChild(tag);

      setTimeout(() => {
        halo.remove();
        tag.remove();
      }, durationMs);
    }

    playEmberProjectileAnimation(sourceMetrics, targetMetrics, element = 'fire', delayMs = 0) {
      if (this.headless || !sourceMetrics?.battlefield || !targetMetrics) return;
      const { battlefield, x: x1, y: y1 } = sourceMetrics;
      const { x: x2, y: y2 } = targetMetrics;

      setTimeout(() => {
        if (!battlefield.isConnected) return;
        this.spawnAttackBeam(battlefield, x1, y1, x2, y2, element, 560);

        const orb = document.createElement('div');
        orb.className = 'gwent-ember-orb';
        orb.style.left = `${x1}px`;
        orb.style.top = `${y1}px`;
        orb.style.setProperty('--dx', `${x2 - x1}px`);
        orb.style.setProperty('--dy', `${y2 - y1}px`);
        battlefield.appendChild(orb);

        window.soundFX?.playFire?.();

        setTimeout(() => {
          orb.remove();
          if (!battlefield.isConnected) return;
          const impact = document.createElement('div');
          impact.className = 'gwent-ember-impact';
          impact.style.left = `${x2}px`;
          impact.style.top = `${y2}px`;
          battlefield.appendChild(impact);
          setTimeout(() => impact.remove(), 360);
        }, 240);
      }, delayMs);
    }

    playCardToRow(team, uid, targetRow, insertIndex = null) {
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
      if (this._simSummoningSickness) {
        card.attackedThisTurn = true;
      }
      if (typeof insertIndex === 'number' && !Number.isNaN(insertIndex)) {
        const clampedIdx = Math.max(0, Math.min(player.rows[targetRow].length, insertIndex));
        player.rows[targetRow].splice(clampedIdx, 0, card);
      } else {
        player.rows[targetRow].push(card);
      }
      card._playBoardAnim = true;
      card._playedInMatch = true;
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

      if (team === 1 && this.tutorialState?.active && this.tutorialState.step === 2) {
        this.advanceTutorialStep();
      }

      this.render();
      this.checkAutoEndTurn(team);
    }

    promptOptionalHandPlay({ team, targetRow, logType, sourceName, title, sound = 'howl', candidates = [] }) {
      if (!this.state || !Array.isArray(candidates) || candidates.length === 0) return;
      const player = this.state.players[team];
      if (!player) return;

      this.state.pendingOptionalPlay = true;
      document.getElementById('gwent-optional-play-modal')?.remove();
      document.getElementById('gwent-forced-pass-modal')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'gwent-optional-play-modal';
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '125';

      const cardsHtml = candidates.map(c => {
        const imgSrc = c.traditionalCardImg || c.cardImg || 'Cards/Mythos_Card_Back.png';
        const rowLabel = ROW_LABELS[c.row] || c.row || 'Melee';
        return `
          <button type="button" class="ui-btn" data-opt-uid="${c.uid}" style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px; width:118px; background:rgba(30,22,16,0.95); border:1.5px solid #b45309; border-radius:10px; color:#fef3c7;">
            <img src="${imgSrc}" alt="${c.name}" style="width:86px; height:115px; object-fit:cover; border-radius:6px;">
            <div style="font-size:12px; font-weight:700; line-height:1.2; text-align:center;">${c.name}</div>
            <div style="font-size:11px; color:#fcd34d;">⚔️ ${c.power} • ${rowLabel}</div>
          </button>
        `;
      }).join('');

      overlay.innerHTML = `
        <div style="max-width:520px; width:92%; background:linear-gradient(180deg,#1f1812,#120e0a); border:2px solid #d97706; border-radius:14px; padding:18px; box-shadow:0 18px 48px rgba(0,0,0,0.85); color:#fef3c7;">
          <div style="font-family:'Cinzel',serif; font-size:17px; font-weight:800; color:#fde68a; margin-bottom:4px;">${title}</div>
          <div style="font-size:13px; color:#d6cbb8; margin-bottom:14px;">${sourceName}: Choose a 1- or 2-star Goblin Army card to also play from your hand, or skip.</div>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-bottom:14px;">${cardsHtml}</div>
          <div style="display:flex; justify-content:flex-end;">
            <button type="button" id="btn-optional-play-skip" class="ui-btn" style="padding:8px 16px;">Skip (Keep in Hand)</button>
          </div>
        </div>
      `;

      const cleanup = () => {
        overlay.remove();
        if (this.state) this.state.pendingOptionalPlay = false;
      };

      overlay.querySelectorAll('[data-opt-uid]').forEach(btn => {
        btn.addEventListener('click', () => {
          const chosenUid = btn.dataset.optUid;
          cleanup();
          const handIdx = player.hand.findIndex(c => c.uid === chosenUid);
          if (handIdx !== -1) {
            const [bonusCard] = player.hand.splice(handIdx, 1);
            const bonusRow = bonusCard.row === 'agile'
              ? (targetRow || 'ranged')
              : (bonusCard.row || 'melee');
            const bonusPreMyScore = this.getTotalScore(team);
            const bonusPreOppScore = this.getTotalScore(team === 1 ? 2 : 1);
            const bonusAlliesBefore = this.getAllBoardCards(team).length;
            player.rows[bonusRow].push(bonusCard);
            window.soundFX?.playCardFlipReveal?.(bonusCard.rarity === 'gold');
            this.log(
              `${title}! ${sourceName} also plays ${bonusCard.name} (${bonusCard.power}) to ${ROW_LABELS[bonusRow] || bonusRow}!`,
              logType
            );
            this.state._suppressExtraGoblinPlay = true;
            try {
              this.resolveCardAbility(team, bonusCard, bonusRow, bonusPreMyScore, bonusPreOppScore, bonusAlliesBefore);
            } finally {
              this.state._suppressExtraGoblinPlay = false;
            }
          }
          this.render();
          this.checkAutoEndTurn(team);
        });
      });

      overlay.querySelector('#btn-optional-play-skip')?.addEventListener('click', () => {
        cleanup();
        window.soundFX?.playClick?.();
        this.log(`${title}: ${sourceName} holds the Goblin Army in reserve.`, logType);
        this.render();
        this.checkAutoEndTurn(team);
      });

      document.body.appendChild(overlay);
    }

    promptEnemyTargetChoice({ team, logType, sourceName, title, subtitle = null, skipLog = null, accentColor = '#38bdf8', candidates = [], onSelect }) {
      if (!this.state || !Array.isArray(candidates) || candidates.length === 0) return;

      this.state.pendingOptionalPlay = true;
      document.getElementById('gwent-optional-play-modal')?.remove();
      document.getElementById('gwent-forced-pass-modal')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'gwent-optional-play-modal';
      overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(8,10,16,0.78); display:flex; align-items:center; justify-content:center; padding:16px;';

      const cardsHtml = candidates.map(({ card, rowKey }) => {
        const imgSrc = card.cardImg || card.traditionalCardImg || '';
        const rowLabel = ROW_LABELS[rowKey] || rowKey || 'Melee';
        const frozenTag = card.frozenTurns > 0 ? ' • ❄️ Frozen' : '';
        return `
          <button type="button" class="ui-btn" data-target-uid="${card.uid}" style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px; width:122px; background:rgba(20,30,46,0.95); border:1.5px solid #38bdf8; border-radius:10px; color:#e0f2fe;">
            <img src="${imgSrc}" alt="${card.name}" style="width:86px; height:115px; object-fit:cover; border-radius:6px;">
            <span style="font-size:12px; font-weight:700; text-align:center; line-height:1.2;">${card.name}</span>
            <span style="font-size:11px; color:#bae6fd;">⚔️ ${card.power} • 🛡️ ${card.armor || 0}</span>
            <span style="font-size:10px; color:#7dd3fc;">${rowLabel}${frozenTag}</span>
          </button>
        `;
      }).join('');

      overlay.innerHTML = `
        <div style="max-width:560px; width:100%; background:#0f172a; border:2px solid ${accentColor}; border-radius:14px; padding:18px; box-shadow:0 18px 48px rgba(0,0,0,0.7); color:#e0f2fe;">
          <div style="font-size:16px; font-weight:800; color:${accentColor}; margin-bottom:6px;">${title}</div>
          <div style="font-size:13px; color:#bae6fd; margin-bottom:14px;">${subtitle || `Choose an enemy unit for <strong>${sourceName}</strong> to freeze for its next turn:`}</div>
          <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin-bottom:14px;">${cardsHtml}</div>
          <div style="display:flex; justify-content:flex-end;">
            <button type="button" id="btn-enemy-target-skip" class="ui-btn" style="padding:7px 14px; background:rgba(71,85,105,0.45); border:1px solid #94a3b8; border-radius:8px; color:#e2e8f0; font-size:12px; font-weight:700;">Skip</button>
          </div>
        </div>
      `;

      const cleanup = () => {
        if (this.state) this.state.pendingOptionalPlay = false;
        overlay.remove();
      };

      overlay.querySelectorAll('[data-target-uid]').forEach(btn => {
        btn.addEventListener('click', () => {
          const uid = btn.getAttribute('data-target-uid');
          const chosen = candidates.find(c => c.card.uid === uid);
          cleanup();
          if (chosen && typeof onSelect === 'function') {
            onSelect(chosen);
          }
          this.render();
          this.checkAutoEndTurn(team);
        });
      });

      overlay.querySelector('#btn-enemy-target-skip')?.addEventListener('click', () => {
        cleanup();
        window.soundFX?.playClick?.();
        this.log(skipLog || `❄️ ${sourceName} held its Freeze in reserve.`, logType);
        this.render();
        this.checkAutoEndTurn(team);
      });

      document.body.appendChild(overlay);
    }

    promptEnemyRowChoice({
      team, oppTeam, logType, sourceName, title, subtitle, onSelect,
      skipLog = null,
      accentColor = '#4ade80',
      bgColor = '#0f1f14',
      titleColor = '#86efac',
      textColor = '#bbf7d0',
      btnBgColor = 'rgba(20,36,24,0.95)',
      rowMetaFn = null
    }) {
      const oppRows = this.state?.players?.[oppTeam]?.rows;
      if (!this.state || !oppRows) return;

      this.state.pendingOptionalPlay = true;
      document.getElementById('gwent-optional-play-modal')?.remove();
      document.getElementById('gwent-forced-pass-modal')?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'gwent-optional-play-modal';
      overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(8,10,16,0.78); display:flex; align-items:center; justify-content:center; padding:16px;';

      const rowSummary = (rk, label) => {
        const list = oppRows[rk] || [];
        const armorSum = list.reduce((s, c) => s + (c.armor || 0), 0);
        const metaText = typeof rowMetaFn === 'function'
          ? rowMetaFn(rk, list, oppRows)
          : `${list.length} unit(s) • 🛡️ ${armorSum} total Armor`;
        return `
          <button type="button" class="ui-btn" data-target-row="${rk}" style="flex:1; min-width:170px; padding:12px 14px; background:${btnBgColor}; border:1.5px solid ${accentColor}; border-radius:10px; color:${textColor}; display:flex; flex-direction:column; align-items:center; gap:4px;">
            <span style="font-size:14px; font-weight:800;">${label}</span>
            <span style="font-size:12px; color:${textColor}; opacity:0.92;">${metaText}</span>
          </button>
        `;
      };

      overlay.innerHTML = `
        <div style="max-width:460px; width:100%; background:${bgColor}; border:2px solid ${accentColor}; border-radius:14px; padding:18px; box-shadow:0 18px 48px rgba(0,0,0,0.7); color:${textColor};">
          <div style="font-size:16px; font-weight:800; color:${titleColor}; margin-bottom:6px;">${title}</div>
          <div style="font-size:13px; color:${textColor}; margin-bottom:14px;">${subtitle}</div>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
            ${rowSummary('melee', '⚔️ Enemy Melee Row')}
            ${rowSummary('ranged', '🏹 Enemy Ranged Row')}
          </div>
          <div style="display:flex; justify-content:flex-end;">
            <button type="button" id="btn-enemy-row-skip" class="ui-btn" style="padding:7px 14px; background:rgba(71,85,105,0.45); border:1px solid #94a3b8; border-radius:8px; color:#e2e8f0; font-size:12px; font-weight:700;">Skip</button>
          </div>
        </div>
      `;

      const cleanup = () => {
        if (this.state) this.state.pendingOptionalPlay = false;
        overlay.remove();
      };

      overlay.querySelectorAll('[data-target-row]').forEach(btn => {
        btn.addEventListener('click', () => {
          const rk = btn.getAttribute('data-target-row');
          cleanup();
          if (rk && typeof onSelect === 'function') {
            onSelect(rk);
          }
          this.render();
          this.checkAutoEndTurn(team);
        });
      });

      overlay.querySelector('#btn-enemy-row-skip')?.addEventListener('click', () => {
        cleanup();
        window.soundFX?.playClick?.();
        this.log(skipLog || `🦎 ${sourceName} held Corrosive Gaze in reserve.`, logType);
        this.render();
        this.checkAutoEndTurn(team);
      });

      document.body.appendChild(overlay);
    }

    damageUnit(targetCard, amount, ownerTeam, rowKey, _fromDeflect = false) {
      if (amount > 0 && targetCard?.deflectOnce && !_fromDeflect) {
        targetCard.deflectOnce = false;
        const oppTeam = ownerTeam === 1 ? 2 : 1;
        const oppRows = this.state?.players?.[oppTeam]?.rows;
        const oppTargets = [];
        if (oppRows) {
          ['melee', 'ranged'].forEach(rk => {
            (oppRows[rk] || []).forEach(c => oppTargets.push({ card: c, rowKey: rk }));
          });
        }
        window.soundFX?.playShieldBreak?.();
        if (oppTargets.length > 0) {
          const pick = oppTargets[Math.floor(Math.random() * oppTargets.length)];
          this.log(`🪞 ${targetCard.name}'s Hex Mirror deflected ${amount} damage back to ${pick.card.name}!`, 'system');
          this.damageUnit(pick.card, amount, oppTeam, pick.rowKey, true);
        } else {
          this.log(`🪞 ${targetCard.name}'s Hex Mirror deflected the attack into thin air!`, 'system');
        }
        return;
      }

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
        if (!targetCard.isToken) {
          this.state.players[ownerTeam].graveyard.push(targetCard);
        }
        window.soundFX?.playDefeat?.();
        this.log(`💀 ${targetCard.name} was destroyed and sent to the Graveyard!`, 'system');

        const spawnCfg = targetCard.isSpawnedCopy ? null : (targetCard.spawnOnDeath || CardReg.getCard(targetCard.id)?.spawnOnDeath);
        if (spawnCfg) {
          const insertAt = i !== -1 ? i : rowArr.length;
          const spawnPower = spawnCfg.spawnPower ?? Math.max(1, Math.floor((targetCard.basePower || 2) / 2));
          const count = spawnCfg.count || 2;
          for (let s = 0; s < count; s++) {
            const spawnId = spawnCfg.cardId || targetCard.id;
            const spawned = this.createCardInstance(
              spawnId,
              `${spawnId}_spawn_${Date.now()}_${s}_${Math.random().toString(36).slice(2, 5)}`
            );
            if (spawned) {
              spawned.power = spawnPower;
              spawned.basePower = spawnPower;
              spawned.armor = 0;
              spawned.isSpawnedCopy = true;
              spawned.isToken = true;
              spawned.spawnOnDeath = null;
              rowArr.splice(insertAt + s, 0, spawned);
            }
          }
          this.log(`🦇 ${targetCard.name} split into ${count} Vampire Bats (${spawnPower} Base Power each)!`, ownerTeam === 1 ? 'team1' : 'team2');
        }
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
      if (this.isMatchOver || !this.state || this.state.mulliganActive || this.state.autoEndingTurn) return;
      if (team !== this.state.turnTeam) return;
      if (this.gameMode === 'ai' && team !== 1) return;

      const player = this.state.players[team];
      if (player.passed) return;

      if (!this.state.playedCardThisTurn) {
        this.showForcedPassWarning(team);
        return;
      }

      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;
      this.hideAbilityPopup();
      window.soundFX?.playClick?.();
      this.log(`⏭️ ${player.name} ended their turn.`, team === 1 ? 'team1' : 'team2');

      this.advanceTurn();
    }

    showForcedPassWarning(team = this.state?.turnTeam) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive) return;
      const player = this.state.players[team];
      const oppTeam = team === 1 ? 2 : 1;
      const opp = this.state.players[oppTeam];
      if (!player || player.passed) return;

      const myScore = this.getTotalScore(team);
      const oppScore = this.getTotalScore(oppTeam);
      const oppPassed = Boolean(opp?.passed);

      let outcomeBadge = '';
      let outcomeColor = '#fcd34d';
      let outcomeBg = 'rgba(245, 158, 11, 0.14)';
      let outcomeBorder = 'rgba(251, 191, 36, 0.55)';
      let outcomeDetail = '';

      if (myScore > oppScore) {
        outcomeBadge = oppPassed ? '🏆 YOU WOULD WIN THIS ROUND' : '📈 CURRENTLY WINNING (AHEAD)';
        outcomeColor = '#86efac';
        outcomeBg = 'rgba(22, 163, 74, 0.16)';
        outcomeBorder = 'rgba(74, 222, 128, 0.55)';
        outcomeDetail = oppPassed
          ? `${opp.name} has already passed. Passing now ends Round ${this.state.round} and you <b>WIN</b> (${myScore} vs ${oppScore})!`
          : `You are ahead (${myScore} vs ${oppScore}) and would <b>WIN</b> if the round ended now, though ${opp.name} can still play cards.`;
      } else if (myScore < oppScore) {
        outcomeBadge = oppPassed ? '💀 YOU WOULD LOSE THIS ROUND' : '⚠️ CURRENTLY LOSING (BEHIND)';
        outcomeColor = '#fca5a5';
        outcomeBg = 'rgba(220, 38, 38, 0.16)';
        outcomeBorder = 'rgba(248, 113, 113, 0.55)';
        outcomeDetail = oppPassed
          ? `${opp.name} has already passed. Passing now ends Round ${this.state.round} and you <b>LOSE</b> (${myScore} vs ${oppScore}), costing you a Life Gem!`
          : `You are behind (${myScore} vs ${oppScore}) and would <b>LOSE</b> Round ${this.state.round} if forced to pass now (and ${opp.name} can still play more cards).`;
      } else {
        outcomeBadge = oppPassed ? '⚖️ ROUND WOULD END IN A DRAW' : '⚖️ CURRENTLY TIED (DRAW)';
        outcomeColor = '#fde68a';
        outcomeBg = 'rgba(234, 179, 8, 0.16)';
        outcomeBorder = 'rgba(250, 204, 21, 0.55)';
        outcomeDetail = oppPassed
          ? `${opp.name} has already passed. Passing now ends Round ${this.state.round} in a <b>DRAW</b> (${myScore} – ${oppScore}) — both sides lose a Life Gem.`
          : `The score is tied (${myScore} – ${oppScore}). A draw costs both sides a Life Gem, and ${opp.name} can still play cards.`;
      }

      document.getElementById('gwent-forced-pass-modal')?.remove();
      window.soundFX?.playClick?.();

      const overlay = document.createElement('div');
      overlay.id = 'gwent-forced-pass-modal';
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '130';
      overlay.innerHTML = `
        <div style="max-width:460px; width:92%; background:linear-gradient(180deg,#231912,#120d09); border:2px solid #d97706; border-radius:14px; padding:20px; box-shadow:0 20px 54px rgba(0,0,0,0.88), inset 0 1px 0 rgba(254,243,199,0.14); color:#fef3c7;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <span style="font-size:24px; line-height:1;">⚠️</span>
            <div>
              <div style="font-family:'Cinzel',serif; font-size:17px; font-weight:800; color:#fde68a; letter-spacing:0.4px;">FORCED PASS WARNING</div>
              <div style="font-size:12px; color:#d6cbb8;">No card played from your hand this turn</div>
            </div>
          </div>
          <p style="font-size:13.5px; line-height:1.45; color:#e7dcc8; margin:0 0 12px 0;">
            You did not play a card this turn. Ending your turn now will <b>force you to pass</b> for the rest of Round ${this.state.round}.
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.35); border:1px solid rgba(217,119,6,0.35); border-radius:10px; padding:10px 14px; margin-bottom:12px;">
            <div style="text-align:center; flex:1;">
              <div style="font-size:11px; color:#cbbba0; text-transform:uppercase;">${player.name}</div>
              <div style="font-size:22px; font-weight:800; color:#fde68a;">${myScore}</div>
            </div>
            <div style="font-size:12px; font-weight:700; color:#a89880; padding:0 10px;">VS</div>
            <div style="text-align:center; flex:1;">
              <div style="font-size:11px; color:#cbbba0; text-transform:uppercase;">${opp.name}${oppPassed ? ' (Passed)' : ''}</div>
              <div style="font-size:22px; font-weight:800; color:#93c5fd;">${oppScore}</div>
            </div>
          </div>
          <div style="background:${outcomeBg}; border:1.5px solid ${outcomeBorder}; border-radius:10px; padding:10px 12px; margin-bottom:16px;">
            <div style="font-size:12.5px; font-weight:800; color:${outcomeColor}; letter-spacing:0.3px; margin-bottom:4px;">${outcomeBadge}</div>
            <div style="font-size:12.5px; line-height:1.4; color:#f5ebd6;">${outcomeDetail}</div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
            <button type="button" id="btn-forced-pass-cancel" class="ui-btn secondary" style="padding:8px 14px;">Keep Playing</button>
            <button type="button" id="btn-forced-pass-confirm" class="ui-btn primary-btn" style="padding:8px 16px; background:linear-gradient(135deg,#b45309,#d97706); border-color:#fbbf24;">Confirm Forced Pass</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector('#btn-forced-pass-cancel')?.addEventListener('click', () => {
        window.soundFX?.playClick?.();
        overlay.remove();
      });
      overlay.querySelector('#btn-forced-pass-confirm')?.addEventListener('click', () => {
        overlay.remove();
        this.passRound(team);
      });
    }

    passRound(team = this.state?.turnTeam) {
      if (this.isMatchOver || !this.state || this.state.mulliganActive || this.state.autoEndingTurn) return;
      if (team !== this.state.turnTeam) return;

      if (team === 1 && this.tutorialState?.active && [6, 7, 8].includes(this.tutorialState.step)) {
        const nextStep = this.tutorialState.step === 8 ? 9 : 8;
        this.tutorialState.step = nextStep;
        this.applyTutorialStepState(nextStep);
        this.renderTutorialBanner();
        return;
      }

      const player = this.state.players[team];
      if (player.passed) return;

      if (this.headless && Array.isArray(this._simPassEvents)) {
        const oppTeam = team === 1 ? 2 : 1;
        const myScore = this.getTotalScore(team);
        const oppScore = this.getTotalScore(oppTeam);
        this._simPassEvents.push({
          round: this.state.round,
          team,
          myScore,
          oppScore,
          ahead: myScore > oppScore,
          behind: myScore < oppScore,
          tied: myScore === oppScore,
          turnsPlayed: player.turnsThisRound || 0,
          handLeft: player.hand.length,
          oppPassed: Boolean(this.state.players[oppTeam]?.passed),
          autoOutOfCards: player.hand.length === 0
        });
      }

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
      this.state.autoEndingTurn = false;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const finishedTeam = this.state.turnTeam;
      if (this.state.players[finishedTeam] && !this.state.players[finishedTeam].passed) {
        this.applyTurnEndBoardPassives(finishedTeam);
      }
      if (this.state.players[finishedTeam]) {
        this.state.players[finishedTeam].turnsThisRound = (this.state.players[finishedTeam].turnsThisRound || 0) + 1;
      }

      // Auto-pass when a player has no placeable cards left (preserving remaining board attacks/abilities if turn just passed to them)
      const hasPlaceableHandCard = (teamNum) => (this.state.players[teamNum]?.hand || []).some(
        c => c && (c.row === 'agile' || c.row === 'melee' || c.row === 'ranged')
      );
      let autoPassedName = null;
      if (!p1.passed && !hasPlaceableHandCard(1) && (finishedTeam === 1 || !this.hasReadyAttackers(1))) {
        p1.passed = true;
        autoPassedName = p1.name;
        this.log(`🏳️ ${p1.name} has no cards left and passes automatically.`, 'team1');
      }
      const p2CanActBeforePass = this.gameMode === '2p' && finishedTeam !== 2 && this.hasReadyAttackers(2);
      if (!p2.passed && !hasPlaceableHandCard(2) && !p2CanActBeforePass) {
        p2.passed = true;
        autoPassedName = p2.name;
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

      if (autoPassedName && !this.turnBannerTimeout) {
        this.showTurnSwitchBanner(
          `${autoPassedName.toUpperCase()} OUT OF CARDS — AUTO-PASSED`,
          `${this.state.turnTeam === 1 ? '☀️' : '🌙'} ${this.state.players[this.state.turnTeam].name}'s Turn`,
          this.state.turnTeam,
          2600
        );
      }

      // Reset per-turn attack & card-play state for the active player's new turn
      this.resetTurnAttackFlags(this.state.turnTeam);
      this.applyTurnStartBoardPassives(this.state.turnTeam);
      this.state.selectedHandUid = null;
      this.state.selectedAttackerUid = null;

      this.render();

      if (!this.headless && this.gameMode === 'ai' && this.state.turnTeam === 2 && !this.isMatchOver) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      } else if (!this.headless) {
        this.checkAutoEndTurn(this.state.turnTeam);
      }
    }

    applyTurnStartBoardPassives(team) {
      const player = this.state?.players?.[team];
      if (!player || player.passed) return;
      const logType = team === 1 ? 'team1' : 'team2';
      let triggered = false;

      ['melee', 'ranged'].forEach(rk => {
        const rowArr = player.rows?.[rk] || [];
        rowArr.forEach(c => {
          if (c && c.unattackableTurns > 0) {
            c.unattackableTurns -= 1;
            if (c.unattackableTurns === 0) {
              this.log(`✨ ${c.name}'s Innocent Ward wore off — she can now be attacked.`, logType);
            }
          }
        });
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

    applyTurnEndBoardPassives(team) {
      const player = this.state?.players?.[team];
      if (!player || player.passed) return;
      const oppTeam = team === 1 ? 2 : 1;
      const logType = team === 1 ? 'team1' : 'team2';
      let triggered = false;

      ['melee', 'ranged'].forEach(rk => {
        const rowArr = [...(player.rows?.[rk] || [])];
        rowArr.forEach(card => {
          const spec = card?.endOfTurnRandomAttacks;
          if (!spec || card.power <= 0) return;
          const count = spec.count || 3;
          const dmg = spec.damage || 1;
          const sourceMetrics = this.getBattlefieldCardMetrics(card.uid);
          let cardTriggered = false;

          for (let i = 0; i < count; i++) {
            const oppRows = this.state?.players?.[oppTeam]?.rows;
            if (!oppRows) break;
            const candidates = [];
            ['melee', 'ranged'].forEach(ork => {
              (oppRows[ork] || []).forEach(enemy => {
                if (enemy && enemy.power > 0) {
                  candidates.push({ card: enemy, rowKey: ork });
                }
              });
            });
            if (candidates.length === 0) break;
            const pick = candidates[Math.floor(Math.random() * candidates.length)];
            const targetMetrics = this.getBattlefieldCardMetrics(pick.card.uid);
            if (sourceMetrics && targetMetrics) {
              if (!cardTriggered) {
                this.playAbilitySourceFlare(sourceMetrics, `🔥 ${card.abilityTitle || 'Ember Volley'}`);
              }
              this.playEmberProjectileAnimation(sourceMetrics, targetMetrics, card.element || 'fire', i * 150);
            }
            this.log(`🔥 ${card.name}'s ${card.abilityTitle || 'Ember Volley'} strikes ${pick.card.name} for ${dmg} damage!`, logType);
            this.damageUnit(pick.card, dmg, oppTeam, pick.rowKey);
            cardTriggered = true;
            triggered = true;
          }
        });
      });

      if (triggered) {
        window.soundFX?.playFire?.();
      }
    }

    endRound() {
      this.clearAutoEndTimers();
      const s1 = this.getTotalScore(1);
      const s2 = this.getTotalScore(2);
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];

      let bannerTitle = '';
      if (s1 > s2) {
        p2.gems = Math.max(0, p2.gems - 1);
        p1.roundWins = (p1.roundWins || 0) + 1;
        bannerTitle = `☀️ ${p1.name.toUpperCase()} WINS ROUND ${this.state.round}!`;
        window.soundFX?.playHeal?.();
        this.log(`🏆 ${p1.name} won Round ${this.state.round} (${s1} vs ${s2})! ${p2.name} loses a Life Gem.`, 'system');
      } else if (s2 > s1) {
        p1.gems = Math.max(0, p1.gems - 1);
        p2.roundWins = (p2.roundWins || 0) + 1;
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

      if (this.state.round === 1) {
        this.state.round1LoserTeam = s1 > s2 ? 2 : (s2 > s1 ? 1 : null);
      }
      this.state.lastRoundLoserTeam = s1 > s2 ? 2 : (s2 > s1 ? 1 : null);

      this.render();

      const proceedNext = () => {
        if (overlay) overlay.classList.add('hidden');
        if (p1.gems <= 0 || p2.gems <= 0) {
          this.finishMatch(p1.gems > p2.gems ? 1 : (p2.gems > p1.gems ? 2 : 2));
        } else {
          let nextStarter = s1 >= s2 ? 1 : 2;
          if (this.headless && this._simStarterMode) {
            if (this._simStarterMode === 'loser') {
              nextStarter = s1 > s2 ? 2 : (s2 > s1 ? 1 : (this.state.round % 2 === 0 ? 1 : 2));
            } else if (this._simStarterMode === 'alternate') {
              nextStarter = this._simLastRoundStarter === 1 ? 2 : 1;
            } else if (this._simStarterMode === 'random') {
              nextStarter = Math.random() < 0.5 ? 1 : 2;
            }
            this._simLastRoundStarter = nextStarter;
          }
          this.startNextRound(nextStarter);
        }
      };

      if (this.headless) {
        if (Array.isArray(this._simRoundScores)) {
          const b1 = this.getAllBoardCards(1);
          const b2 = this.getAllBoardCards(2);
          const maxP = (arr) => arr.reduce((m, c) => Math.max(m, c.power || 0), 0);
          const resCount = (arr) => arr.filter(c => c.resilient).length;
          this._simRoundScores.push({
            round: this.state.round,
            s1,
            s2,
            p1HandAfter: p1.hand.length,
            p2HandAfter: p2.hand.length,
            p1MaxPwr: maxP(b1),
            p2MaxPwr: maxP(b2),
            p1BoardCount: b1.length,
            p2BoardCount: b2.length,
            p1Resilient: resCount(b1),
            p2Resilient: resCount(b2)
          });
        }
        proceedNext();
      } else {
        setTimeout(proceedNext, 1700);
      }
    }

    startNextRound(startingTeam) {
      this.state.round += 1;
      this.state.turnTeam = startingTeam;
      this.state.playedCardThisTurn = false;
      this.state.pendingOptionalPlay = false;
      document.getElementById('gwent-optional-play-modal')?.remove();
      document.getElementById('gwent-forced-pass-modal')?.remove();
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
              if (!c.isToken) p.graveyard.push(c);
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

        // Round 1 loser draws 3 cards entering Round 2; Round 3 draws 2 cards (or _simR3DrawCount / _simFillHandTo5 if testing)
        const isR1LoserDraw = this.state.round === 2 && this.state.round1LoserTeam === team;
        const isPrevLoserDraw = this._simPrevLoserDraw3 && this.state.lastRoundLoserTeam === team;
        let drawCount = (isR1LoserDraw || isPrevLoserDraw) ? 3 : 2;
        if (this.state.round === 3 && typeof this._simR3DrawCount === 'number') {
          drawCount = this._simR3DrawCount;
        }
        if (this._simBothDraw3) {
          drawCount = 3;
        }
        if (this._simFillHandTo5) {
          drawCount = Math.max(0, 5 - p.hand.length);
        }
        const drawn = p.deck.splice(0, drawCount);
        p.hand.push(...drawn);
      });

      window.soundFX?.playCardFlipReveal?.(false);
      const starterName = this.state.players[startingTeam]?.name || 'Player 1';
      if (this.state.round === 2 && this.state.round1LoserTeam) {
        const loserTeam = this.state.round1LoserTeam;
        const winnerTeam = loserTeam === 1 ? 2 : 1;
        const loserName = this.state.players[loserTeam]?.name || 'Round 1 Loser';
        const winnerName = this.state.players[winnerTeam]?.name || 'Round 1 Winner';
        this.log(`🃏 Round 2 begins! ${loserName} drew up to 3 cards and ${winnerName} drew up to 2 cards. ${starterName} goes first.`, 'system');
      } else {
        this.log(`🃏 Round ${this.state.round} begins! Both players drew up to 2 cards. ${starterName} goes first.`, 'system');
      }
      this.render();

      if (!this.headless && this.gameMode === 'ai' && this.state.turnTeam === 2) {
        this.aiTimeout = setTimeout(() => this.runAiTurn(), 1300);
      } else if (!this.headless) {
        this.checkAutoEndTurn(this.state.turnTeam);
      }
    }

    // -------------------------------------------------------------------------
    // Smart Gwent AI
    // -------------------------------------------------------------------------
    shouldPassRound2ToSaveLastCard(team, oppTeam, myScore, oppScore) {
      if (!this.state || this.state.round !== 2) return false;
      const me = this.state.players[team];
      // Only save for Round 3 when AI still has 2 gems (won Round 1); never concede a must-win Round 2 at 1 gem
      if (!me || me.gems < 2 || me.hand.length !== 1) return false;

      const lastCard = me.hand[0];
      const candidateRows = lastCard.row === 'agile' ? ['melee', 'ranged'] : [lastCard.row];
      let bestEst = -Infinity;
      candidateRows.forEach(rk => {
        const est = CardReg.estimateCardValue(lastCard, rk, {
          game: this,
          team,
          oppTeam,
          myScore,
          oppScore
        });
        if (est > bestEst) bestEst = est;
      });

      // Include any ready board boost or attack swing available this turn
      let boardSwing = 0;
      const boardCards = this.getAllBoardCards(team);
      boardCards.forEach(c => {
        if (this.getBoostableAlliesFor(c, team).length > 0) {
          boardSwing += (c.allyBoostAmount || 2);
        }
      });
      if (this.canTeamAttackThisTurn(team)) {
        boardCards.forEach(c => {
          if (!c.attackedThisTurn) {
            const targets = this.getValidAttackTargets(team, c.uid);
            if (targets.length > 0) {
              const dmg = Math.max(1, c.power);
              const bestHit = targets.reduce((mx, t) => Math.max(mx, Math.min(t.card.power || 0, dmg)), 0);
              boardSwing += bestHit;
            }
          }
        });
      }

      return (myScore + bestEst + boardSwing) <= oppScore;
    }

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

      // 2b. Round 2 with 1 card left & 2 gems: if playing the last card cannot win the round, pass to save it for Round 3
      if (this.shouldPassRound2ToSaveLastCard(2, 1, myScore, oppScore)) {
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

      this._pendingDeployAnimUntil = 0;
      this.playCardToRow(2, bestChoice.card.uid, bestChoice.row);
      const aiDelay = Math.max(950, (this._pendingDeployAnimUntil || 0) - Date.now() + 220);
      this.aiTimeout = setTimeout(() => {
        if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
        this.runAiAttacksAndEnd();
      }, aiDelay);
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
        ? this.getAllBoardCards(2).filter(c => !c.attackedThisTurn && this.getValidAttackTargets(2, c.uid).length > 0)
        : [];

      if (readyAttackers.length === 0) {
        this.aiTimeout = setTimeout(() => {
          if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
          this.advanceTurn();
        }, 650);
        return;
      }

      const attacker = readyAttackers[0];
      const oppTargets = this.getValidAttackTargets(2, attacker.uid);
      // Prefer a target that will be destroyed (accounting for Twin Tide double-hit), otherwise highest-power target
      oppTargets.sort((a, b) => {
        const aKills = this.canAttackKillTarget(attacker, 2, a.card) ? 1 : 0;
        const bKills = this.canAttackKillTarget(attacker, 2, b.card) ? 1 : 0;
        if (bKills !== aKills) return bKills - aKills;
        return b.card.power - a.card.power;
      });
      const target = oppTargets[0];

      this.aiTimeout = setTimeout(() => {
        if (this.isMatchOver || !this.state || this.state.turnTeam !== 2) return;
        this.executeBoardAttack(2, attacker.uid, 1, target.card, target.rowKey);
        this.runAiAttacksAndEnd();
      }, 1250);
    }

    /**
     * Synchronous AI turn for either team (1 or 2), used by the batch simulator.
     */
    runAiTurnSync(team) {
      if (this.isMatchOver || !this.state || this.state.turnTeam !== team) return;
      const oppTeam = team === 1 ? 2 : 1;
      const me = this.state.players[team];
      const opp = this.state.players[oppTeam];

      if (me.passed) {
        this.advanceTurn();
        return;
      }

      if (me.hand.length === 0) {
        // Still use any ready board attackers before passing
        this._runAiBoardActionsSync(team, oppTeam);
        if (!this.isMatchOver && this.state.turnTeam === team && !me.passed) {
          this.passRound(team);
        }
        return;
      }

      const myScore = this.getTotalScore(team);
      const oppScore = this.getTotalScore(oppTeam);
      const passProfile = (this._simPassProfiles && this._simPassProfiles[team]) || 'standard';

      // 1. If opponent already passed and AI is ahead, pass immediately
      if (opp.passed && myScore > oppScore) {
        this.passRound(team);
        return;
      }

      // 1b. Round 2 with 1 card left & 2 gems: if playing the last card cannot win the round, pass to save it for Round 3
      if (passProfile !== 'never_early' && passProfile !== 'r2_bleed' && this.shouldPassRound2ToSaveLastCard(team, oppTeam, myScore, oppScore)) {
        this.passRound(team);
        return;
      }

      // Profile-specific passing rules (when opponent hasn't passed yet)
      if (!opp.passed) {
        if (passProfile === 'r1_dry_pass' && this.state.round === 1) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r1_two_card_bait' && this.state.round === 1 && (me.turnsThisRound || 0) >= 2) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r2_dry_pass_after_r1_win' && this.state.round === 2 && me.gems === 2 && opp.gems === 1) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r1_resilient_bail' && this.state.round === 1 && this.getAllBoardCards(team).some(c => c.resilient)) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'hand_advantage_lock' && me.gems === 2 && me.hand.length < opp.hand.length) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'micro_lead_pass' && this.state.round === 1 && (me.turnsThisRound || 0) >= 1 && myScore > oppScore) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r1_concede_behind' && me.gems === 2 && (oppScore - myScore >= 8)) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r1_tempo_bleed' && this.state.round === 1 && (myScore - oppScore >= 8) && me.hand.length <= 6) {
          this.passRound(team);
          return;
        }
        if (passProfile === 'r2_bleed' && this.state.round === 2 && me.gems === 2 && opp.gems === 1) {
          // Push Round 2 aggressively after winning Round 1: never pass early
        } else if (passProfile !== 'never_early') {
          // 2. Standard concede: Round 1 or 2 (AI still has 2 gems) and trailing by 16+ with fewer/equal cards
          if (me.gems === 2 && (oppScore - myScore >= 16) && me.hand.length <= opp.hand.length) {
            this.passRound(team);
            return;
          }
          // 3. Standard tempo pass: ahead by 14+ in Round 1
          if (this.state.round === 1 && (myScore - oppScore >= 14) && me.hand.length <= 5) {
            this.passRound(team);
            return;
          }
        }
      }

      // 4. Pick best card & row
      let bestChoice = null;
      let bestValue = -999;

      me.hand.forEach(card => {
        const candidateRows = card.row === 'agile' ? ['melee', 'ranged'] : [card.row];
        candidateRows.forEach(rk => {
          const est = CardReg.estimateCardValue(card, rk, {
            game: this,
            team,
            oppTeam,
            myScore,
            oppScore
          });

          if (opp.passed) {
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
        if (opp.passed) {
          this.passRound(team);
          return;
        }
        const fallback = me.hand[0];
        bestChoice = { card: fallback, row: fallback.row === 'agile' ? 'melee' : fallback.row };
      }

      if (Array.isArray(this._simCardsPlayed)) {
        this._simCardsPlayed.push({
          id: bestChoice.card.id,
          team,
          round: this.state.round
        });
      }

      this.playCardToRow(team, bestChoice.card.uid, bestChoice.row);
      this._runAiBoardActionsSync(team, oppTeam);

      if (!this.isMatchOver && this.state.turnTeam === team && !me.passed) {
        this.advanceTurn();
      }
    }

    _runAiBoardActionsSync(team, oppTeam) {
      let guard = 0;
      while (!this.isMatchOver && guard < 30) {
        guard++;
        const booster = this.getAllBoardCards(team).find(c => this.getBoostableAlliesFor(c, team).length > 0);
        if (!booster) break;
        const allyTarget = this.getBoostableAlliesFor(booster, team)[0];
        this.executeAllyBoost(team, booster, allyTarget);
      }

      guard = 0;
      while (!this.isMatchOver && guard < 40) {
        guard++;
        if (!this.canTeamAttackThisTurn(team)) break;
        const readyAttackers = this.getAllBoardCards(team).filter(
          c => !c.attackedThisTurn && this.getValidAttackTargets(team, c.uid).length > 0
        );
        if (readyAttackers.length === 0) break;

        const attacker = readyAttackers[0];
        const oppTargets = this.getValidAttackTargets(team, attacker.uid);
        oppTargets.sort((a, b) => {
          const aKills = this.canAttackKillTarget(attacker, team, a.card) ? 1 : 0;
          const bKills = this.canAttackKillTarget(attacker, team, b.card) ? 1 : 0;
          if (bKills !== aKills) return bKills - aKills;
          return b.card.power - a.card.power;
        });
        const target = oppTargets[0];
        this.executeBoardAttack(team, attacker.uid, oppTeam, target.card, target.rowKey);
      }
    }

    /**
     * Runs a complete Best-of-3 AI vs AI match synchronously and returns telemetry.
     */
    simulateMatch({ deck1 = null, deck2 = null, name1 = 'P1 AI', name2 = 'P2 AI', starterTeam = null, passProfile1 = 'standard', passProfile2 = 'standard', summoningSickness = false, prevLoserDraw3 = false, r3DrawCount = 2, fillHandTo5 = false, bothDraw3 = false, starterMode = 'winner', startHandSize = 7 } = {}) {
      this.headless = true;
      this.gameMode = 'sim';
      this.isMatchOver = false;
      this.winnerTeam = null;
      this._simRoundScores = [];
      this._simCardsPlayed = [];
      this._simPassEvents = [];
      this._simPassProfiles = { 1: passProfile1, 2: passProfile2 };
      this._simSummoningSickness = Boolean(summoningSickness);
      this._simPrevLoserDraw3 = Boolean(prevLoserDraw3);
      this._simR3DrawCount = typeof r3DrawCount === 'number' ? r3DrawCount : 2;
      this._simFillHandTo5 = Boolean(fillHandTo5);
      this._simBothDraw3 = Boolean(bothDraw3);
      this._simStarterMode = starterMode || 'winner';

      const p1Deck = this.buildDeck([], deck1);
      const p2Deck = this.buildDeck([], deck2);
      const p1DeckIds = p1Deck.map(c => c.id);
      const p2DeckIds = p2Deck.map(c => c.id);

      const handCount = Math.max(3, Math.min(12, Number(startHandSize) || 7));
      const p1Hand = p1Deck.splice(0, handCount);
      const p2Hand = p2Deck.splice(0, handCount);
      const firstTeam = (starterTeam === 1 || starterTeam === 2) ? starterTeam : (Math.random() < 0.5 ? 1 : 2);
      this._simLastRoundStarter = firstTeam;

      this.state = {
        round: 1,
        turnTeam: firstTeam,
        mulliganActive: false,
        mulliganLeft: 0,
        mulliganSelectedUids: [],
        playedCardThisTurn: false,
        selectedHandUid: null,
        selectedAttackerUid: null,
        inspectedCard: null,
        players: {
          1: {
            name: name1,
            gems: 2,
            roundWins: 0,
            passed: false,
            turnsThisRound: 0,
            deck: p1Deck,
            hand: p1Hand,
            graveyard: [],
            phoenixReborn: false,
            rows: { melee: [], ranged: [] }
          },
          2: {
            name: name2,
            gems: 2,
            roundWins: 0,
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

      let steps = 0;
      while (!this.isMatchOver && steps < 250) {
        steps++;
        this.runAiTurnSync(this.state.turnTeam);
      }

      if (!this.isMatchOver) {
        const g1 = this.state.players[1].gems;
        const g2 = this.state.players[2].gems;
        this.winnerTeam = g1 >= g2 ? 1 : 2;
        this.isMatchOver = true;
      }

      return {
        winner: this.winnerTeam,
        firstTeam,
        steps,
        hitStepLimit: steps >= 250,
        roundsPlayed: this._simRoundScores.length || this.state.round,
        roundScores: this._simRoundScores,
        p1Gems: this.state.players[1].gems,
        p2Gems: this.state.players[2].gems,
        p1DeckIds,
        p2DeckIds,
        cardsPlayed: this._simCardsPlayed,
        passEvents: this._simPassEvents
      };
    }

    // -------------------------------------------------------------------------
    // Match End & Overworld Rewards Integration
    // -------------------------------------------------------------------------
    finishMatch(winningTeam) {
      this.isMatchOver = true;
      this.winnerTeam = winningTeam;
      if (this.headless) return;
      const isPlayerVictory = winningTeam === 1;
      const p1 = this.state.players[1];
      const p2 = this.state.players[2];
      const winnerTitle = isPlayerVictory ? `${p1.name.toUpperCase()} WINS!` : `${p2.name.toUpperCase()} WINS!`;

      const titleEl = document.getElementById('winner-title');
      const msgEl = document.getElementById('winner-message');
      if (titleEl) titleEl.textContent = winnerTitle;

      // Preserve all Overworld challenger & tournament reward flows
      if (this.currentChallenger?.isTutorial && msgEl) {
        this.closeTutorialBanner(true);
        const returnOverworldBtn = document.getElementById('btn-return-overworld');
        if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🏠 Return to Rocky\'s House';
        msgEl.innerHTML = isPlayerVictory
          ? `🎓 <b>Tutorial Complete!</b> You won the practice match against <b>${p2.name}</b> — head back to challenge him for real!`
          : `🎓 <b>Tutorial Complete!</b> Great practice run against <b>${p2.name}</b> — now you're ready to challenge him for real!`;
      } else if (this.currentChallenger?.tournamentContext?.type === 'booster_bash' && msgEl) {
        document.getElementById('btn-rematch')?.classList.add('hidden');
        const returnOverworldBtn = document.getElementById('btn-return-overworld');
        if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🃏 Return to Leo\'s Shop';
        if (!this._parkTourneyMatchRecorded && this.overworld?.recordBoosterBashMatchResult) {
          this._parkTourneyMatchRecorded = true;
          this.overworld.recordBoosterBashMatchResult(isPlayerVictory);
        }
        msgEl.innerHTML = isPlayerVictory
          ? `🏆 You defeated <b>${p2.name}</b> in Match ${this.currentChallenger.tournamentContext.round || 1}/3 of the <b>Booster Bash</b>!`
          : `⚔️ <b>${p2.name}</b> won Match ${this.currentChallenger.tournamentContext.round || 1}/3 of the <b>Booster Bash</b>!`;
      } else if (this.currentChallenger?.tournamentContext?.type === 'phone_duel_challenge' && msgEl) {
        const ctx = this.currentChallenger.tournamentContext;
        document.getElementById('btn-rematch')?.classList.add('hidden');
        if (!this._phoneDuelRecorded && this.overworld?.handlePhoneDuelChallengeResult) {
          this._phoneDuelRecorded = true;
          this.overworld.handlePhoneDuelChallengeResult(ctx.meetupId, isPlayerVictory);
        }
        if (isPlayerVictory) {
          let rewardBanner = '';
          if (ctx.rewardType === 'money' && ctx.rewardMoney > 0) {
            const moneyTxt = this.overworld?.formatMoney ? this.overworld.formatMoney(ctx.rewardMoney) : `$${Number(ctx.rewardMoney).toFixed(2)}`;
            rewardBanner = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(16, 185, 129, 0.2); border: 1.5px solid #34d399; border-radius: 10px; color: #6ee7b7;">💵 <b>CASH PRIZE WON: +${moneyTxt}!</b></div>`;
          } else if (ctx.rewardType === 'card_pick') {
            rewardBanner = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(245, 158, 11, 0.2); border: 1.5px solid #facc15; border-radius: 10px; color: #fde68a;">🃏 <b>CARD REWARD READY!</b> Return to the Overworld to pick 1 of 3 cards ${p2.name} used!</div>`;
          } else if (ctx.rewardType === 'standard_pack') {
            rewardBanner = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(59, 130, 246, 0.2); border: 1.5px solid #60a5fa; border-radius: 10px; color: #bfdbfe;">📦 <b>STANDARD PACK WON!</b> 1× Mythos Base Booster Pack added to your Inventory!</div>`;
          } else if (ctx.rewardType === 'premium_pack') {
            rewardBanner = `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(168, 85, 247, 0.22); border: 1.5px solid #e879f9; border-radius: 10px; color: #f5d0fe;">💎 <b>PREMIUM PACK WON!</b> 1× 1st-Edition Premium Pack added to your Inventory!</div>`;
          } else {
            rewardBanner = `<div style="margin-top: 10px; color: #93c5fd;">🤝 Friendly Meetup Complete (+Bond)!</div>`;
          }
          msgEl.innerHTML = `🏆 You defeated <b>${p2.name}</b> in your scheduled Duel Challenge (${p1.gems}–${p2.gems} Gems)!${rewardBanner}`;
        } else {
          msgEl.innerHTML = `⚔️ <b>${p2.name}</b> took this scheduled Duel Challenge (${p1.gems}–${p2.gems} Gems).<div style="margin-top: 10px; color: #cbd5e1;">Good match! Your bond grew slightly (+Bond).</div>`;
        }
      } else if (this.currentChallenger?.tournamentContext?.type === 'oakhaven_league' && msgEl) {
        const ctx = this.currentChallenger.tournamentContext;
        document.getElementById('btn-rematch')?.classList.add('hidden');
        const returnOverworldBtn = document.getElementById('btn-return-overworld');
        if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🏆 View League Standings';
        if (!this._leagueMatchRecorded && this.overworld?.recordOakhavenLeagueMatchResult) {
          this._leagueMatchRecorded = true;
          this.overworld.recordOakhavenLeagueMatchResult(ctx, isPlayerVictory, p1.gems, p2.gems);
        }
        const stageTxt = ctx.stage === 'group'
          ? `Week ${ctx.week} Match ${ctx.matchNum}`
          : (ctx.stage === 'final' ? 'Grand Final' : 'Semifinal');
        msgEl.innerHTML = isPlayerVictory
          ? `🏆 You defeated <b>${p2.name}</b> in Oakhaven League ${stageTxt} (${p1.gems}–${p2.gems} Rounds Won)!<div style="margin-top: 10px; color: #fde68a;">✨ Earned <b>+1 Pt</b> &amp; <b>+${p1.gems} Tiebreak Rounds</b>!</div>`
          : `⚔️ <b>${p2.name}</b> won Oakhaven League ${stageTxt} (${p1.gems}–${p2.gems}).<div style="margin-top: 10px; color: #cbd5e1;">Added <b>+${p1.gems}</b> tiebreak round${p1.gems === 1 ? '' : 's'} to your Season total.</div>`;
      } else if (this.currentChallenger?.id === 'pluto' && msgEl) {
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
        msgEl.innerHTML = `You defeated <b>Silas</b> in Mythos!<br><div style="margin-top: 12px; color: #fde68a;">🪵 Silas: "Fine craftsmanship in your maneuvering!"</div>`;
        this.overworld?.handleSilasBattleResult?.(true);
      } else if (isPlayerVictory && this.currentChallenger?.id === 'nova' && msgEl) {
        msgEl.innerHTML = `You defeated <b>Nova</b> in Mythos!<br><div style="margin-top: 12px; color: #e9d5ff;">✨ Earned +$2.00 & Pegasus Foil Card!</div>`;
        this.overworld?.handleNovaBattleResult?.(true);
      } else if (this.currentChallenger?.id === 'berto' && msgEl) {
        document.getElementById('btn-rematch')?.classList.add('hidden');
        if (isPlayerVictory) {
          msgEl.innerHTML = `You defeated <b>Berto</b> in Mythos!<br><div style="margin-top: 12px; color: #fde68a;">🃏 Berto: "Alright, alright—you backed it up! Return to the Bistro to claim 1 of 3 cards before I blow this joint!"</div>`;
          this.overworld?.handleBertoBattleResult?.(true);
        } else {
          msgEl.innerHTML = `<b>Berto</b> won the Mythos match.<br><div style="margin-top: 12px; color: #fca5a5;">😏 Berto: "Told you! Still undefeated on Tuesdays—don't bother asking for a rematch today!"</div>`;
          this.overworld?.handleBertoBattleResult?.(false);
        }
      } else if (this.currentChallenger?.id === 'evelyn' && msgEl) {
        if (isPlayerVictory) {
          msgEl.innerHTML = `You defeated <b>Ms. Evelyn</b> in Mythos!<br><div style="margin-top: 12px; color: #fde68a;">🏫 Ms. Evelyn: "Splendid strategy and poise! Oakhaven Elementary is proud to have a duelist of your caliber."</div>`;
        } else {
          msgEl.innerHTML = `<b>Ms. Evelyn</b> won the Academy exhibition match.<br><div style="margin-top: 12px; color: #cbd5e1;">🏫 Ms. Evelyn: "A thoughtful effort! Adjust your deck synergies in the Binder and challenge me again anytime."</div>`;
        }
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
        const unlockedBinderNow = !this.overworld?.hasOldCardBinder;
        if (unlockedBinderNow) {
          this.overworld?.grantOldCardBinder?.(this.currentChallenger, { showCelebration: true });
        }
        msgEl.innerHTML = unlockedBinderNow
          ? `You defeated <b>${this.currentChallenger.name}</b> in Mythos!<br><div style="margin-top: 12px; color: #93c5fd;">🎁 Old Card Binder unlocked in Overworld!</div>`
          : `You defeated <b>${this.currentChallenger.name}</b> in Mythos!`;
      } else if (msgEl) {
        msgEl.textContent = isPlayerVictory
          ? `You outscored ${p2.name} across ${this.state.round} rounds!`
          : `${p2.name} claimed victory in Round ${this.state.round}.`;
      }

      const activeEvent = this.overworld?.getCurrentDayEvent?.();
      if (!this.currentChallenger?.isTutorial && isPlayerVictory && activeEvent?.id === 'league_night' && this.overworld && msgEl) {
        this.overworld.gold = Math.round(((this.overworld.gold || 0) + 1.50) * 100) / 100;
        this.overworld.updateHUDSaveInfo?.();
        msgEl.innerHTML += `<div style="margin-top: 10px; color: #93c5fd;">🏆 Friday Night Mythos League Bounty: +$1.50!</div>`;
      }

      if (
        !this._firstBattleRewardChecked &&
        !this.currentChallenger?.isTutorial &&
        isPlayerVictory &&
        this.gameMode === 'ai' &&
        this.currentChallenger?.id &&
        this.overworld?.grantFirstBattleReward
      ) {
        this._firstBattleRewardChecked = true;
        const firstReward = this.overworld.grantFirstBattleReward(this.currentChallenger, this._lastOpponentDeckIds || []);
        if (firstReward && msgEl) {
          let rewardLine = '';
          if (firstReward.type === 'money') {
            rewardLine = `💵 <b>+$${firstReward.amount.toFixed(2)}</b> cash bonus!`;
          } else if (firstReward.type === 'base_pack') {
            rewardLine = `🃏 <b>1× Unopened Mythos Base Card Pack</b> added to your bag!`;
          } else if (firstReward.type === 'premium_pack') {
            rewardLine = `💎 <b>1× 1st-Edition Mythos Premium Pack</b> added to your bag!`;
          } else if (firstReward.type === 'card_pick') {
            rewardLine = `⭐ <b>Rare 5% Drop!</b> Pick a <b>3★–5★</b> card from ${firstReward.npcName}'s deck upon returning to Overworld!`;
          }
          if (rewardLine) {
            msgEl.innerHTML += `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(245, 158, 11, 0.16); border: 1px solid #f59e0b; border-radius: 10px; color: #fef3c7;">🎁 <b>First Battle Reward:</b> ${rewardLine}</div>`;
          }
        }
      }

      if (
        !this._barnClubRewardChecked &&
        !this.currentChallenger?.isTutorial &&
        this.gameMode === 'ai' &&
        this.overworld?.currentArea === 'haystack_barn_club_interior' &&
        this.overworld?.grantBarnClubhouseReward
      ) {
        this._barnClubRewardChecked = true;
        const barnReward = this.overworld.grantBarnClubhouseReward(this.currentChallenger, isPlayerVictory);
        if (barnReward && msgEl) {
          if (barnReward.outcome === 'win') {
            msgEl.innerHTML += `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(234, 179, 8, 0.16); border: 1px solid #eab308; border-radius: 10px; color: #fef9c3;">${barnReward.icon} <b>Barn Clubhouse Prize (${barnReward.streak}-Win Streak):</b> <b>${barnReward.label}</b> added to your bag!</div>`;
          } else {
            msgEl.innerHTML += `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(99, 102, 241, 0.16); border: 1px solid #818cf8; border-radius: 10px; color: #e0e7ff;">🫐 <b>Barn Clubhouse Consolation Prize:</b> <b>1× Basket of Berries</b> added to your bag!</div>`;
          }
        }
      }

      if (
        !this.currentChallenger?.isTutorial &&
        isPlayerVictory &&
        this.gameMode === 'ai' &&
        this.currentChallenger?.id === 'pier_finn' &&
        this.overworld?.grantOldFinnFishingPole?.()
      ) {
        if (msgEl) {
          msgEl.innerHTML += `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(14, 165, 233, 0.18); border: 1px solid #38bdf8; border-radius: 10px; color: #e0f2fe;">🎣 <b>Old Finn's Gift:</b> You received <b>Old Finn's Oak Fishing Pole</b>! Equip it from your Inventory to cast into Meadowbrook Lake!</div>`;
        }
      }

      if (
        !this.currentChallenger?.isTutorial &&
        isPlayerVictory &&
        this.gameMode === 'ai' &&
        this.currentChallenger?.id === 'arcade_zeke' &&
        this.overworld?.onArcadeZekeQuestVictory?.()
      ) {
        if (msgEl) {
          msgEl.innerHTML += `<div style="margin-top: 12px; padding: 10px 14px; background: rgba(245, 158, 11, 0.18); border: 1px solid #f59e0b; border-radius: 10px; color: #fef3c7;">📦 <b>Missing Booster Shipment:</b> Zeke handed over <b>Leo's 1st-Edition Booster Crate</b>! Check in with <b>Chief Miller</b> at the Police Station before returning it to Leo.</div>`;
        }
      }

      if (!this.currentChallenger?.isTutorial && this.gameMode === 'ai' && this.overworld) {
        if (isPlayerVictory) {
          this.overworld.wins = (this.overworld.wins || 0) + 1;
        } else {
          this.overworld.losses = (this.overworld.losses || 0) + 1;
        }
        if (!this._wearAppliedThisMatch && window.MythosCardGrading?.applyWear && Array.isArray(this.overworld.playingDeck)) {
          this._wearAppliedThisMatch = true;
          const sleeveTier = this.overworld.deckSleeveTier || 'none';
          const allP1Cards = [
            ...(p1.deck || []),
            ...(p1.hand || []),
            ...(p1.graveyard || []),
            ...(p1.rows?.melee || []),
            ...(p1.rows?.ranged || []),
            ...(p1.rows?.siege || [])
          ];
          const wornNames = [];
          for (const bc of allP1Cards) {
            if (!Number.isInteger(bc?.deckIndex)) continue;
            const deckEntry = this.overworld.playingDeck[bc.deckIndex];
            if (!deckEntry || !deckEntry.condition) continue;
            const cardSleeveTier = deckEntry.condition.sleeveTier || sleeveTier || 'none';
            const res = window.MythosCardGrading.applyWear(
              deckEntry.condition,
              bc._playedInMatch ? 'duel_played' : 'duel_deck',
              cardSleeveTier
            );
            if (res?.damaged) {
              wornNames.push(`${bc.name} (${res.summary})`);
            }
          }
          if (wornNames.length > 0 && msgEl) {
            const hasAnyUnsleeved = allP1Cards.some(bc => {
              const entry = Number.isInteger(bc?.deckIndex) ? this.overworld.playingDeck[bc.deckIndex] : null;
              return entry?.condition && !entry.condition.isGraded && (!entry.condition.sleeveTier || entry.condition.sleeveTier === 'none') && sleeveTier === 'none';
            });
            const sleeveHint = hasAnyUnsleeved ? ' • Tip: sleeve cards with Pro Sleeves ($0.50) or Pro Matte ($1.00)!' : '';
            msgEl.innerHTML += `<div style="margin-top: 10px; padding: 8px 12px; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(248, 113, 113, 0.45); border-radius: 9px; font-size: 12px; color: #fecaca;">⚠️ <b>Play Wear:</b> ${wornNames.slice(0, 3).join(', ')}${wornNames.length > 3 ? ` +${wornNames.length - 3} more` : ''}${sleeveHint}</div>`;
          }
        }
        this.overworld.saveWorldData?.(this.overworld.draftAppearance);
        this.overworld.refreshIntroScreen?.();
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
    syncBorderCometOverlay(el, active, color = 'gold', radius = 10) {
      if (!el) return;
      const existing = el.querySelector(':scope > svg.gwent-border-runner-svg');
      if (!active) {
        if (existing) existing.remove();
        return;
      }

      const palette = color === 'red'
        ? {
            track: 'rgba(239, 68, 68, 0.24)',
            glow: 'rgba(239, 68, 68, 0.55)',
            core: '#fca5a5',
            shadow: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.95))'
          }
        : {
            track: 'rgba(251, 191, 36, 0.24)',
            glow: 'rgba(251, 191, 36, 0.55)',
            core: '#fef08a',
            shadow: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.95))'
          };

      let svg = existing;
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'gwent-border-runner-svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML =
          '<rect class="gwent-border-runner-track"></rect>' +
          '<rect class="gwent-border-runner-glow"></rect>' +
          '<rect class="gwent-border-runner-core"></rect>';
        el.prepend(svg);
      }

      const applyGeomAndColors = () => {
        const curSvg = el.querySelector(':scope > svg.gwent-border-runner-svg');
        if (!curSvg) return;
        const w = Math.max(40, Math.round(el.clientWidth + 2));
        const h = Math.max(24, Math.round(el.clientHeight + 2));
        const stroke = 2.6;
        const inset = stroke / 2;
        const rx = Math.max(2, Math.min(radius, h / 2 - 2));
        const rw = Math.max(4, w - stroke);
        const rh = Math.max(4, h - stroke);

        curSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const rects = curSvg.querySelectorAll('rect');
        rects.forEach(r => {
          r.setAttribute('x', inset);
          r.setAttribute('y', inset);
          r.setAttribute('width', rw);
          r.setAttribute('height', rh);
          r.setAttribute('rx', rx);
          r.setAttribute('ry', rx);
          r.setAttribute('pathLength', '100');
        });

        const [track, glow, core] = rects;
        if (track) {
          track.setAttribute('stroke', palette.track);
          track.setAttribute('stroke-width', stroke);
        }
        if (glow) {
          glow.setAttribute('stroke', palette.glow);
          glow.setAttribute('stroke-width', 6.5);
        }
        if (core) {
          core.setAttribute('stroke', palette.core);
          core.setAttribute('stroke-width', stroke);
          core.style.filter = palette.shadow;
        }
      };

      applyGeomAndColors();

      if (!el._cometRO && typeof ResizeObserver === 'function') {
        el._cometRO = new ResizeObserver(() => applyGeomAndColors());
        el._cometRO.observe(el);
      }
    }

    render() {
      if (this.headless || !this.state) return;
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
      const isAutoEnding = Boolean(this.state.autoEndingTurn);
      const turnTeam = this.state.turnTeam;
      const turnPlayer = this.state.players[turnTeam];
      const isControllableTurn = showTurnHighlight && !isAutoEnding && (this.gameMode === '2p' || turnTeam === 1) && !turnPlayer.passed;
      const hasPlaceableHand = (turnPlayer.hand || []).some(c => c && (c.row === 'agile' || c.row === 'melee' || c.row === 'ranged'));
      const canPlayCardNow = isControllableTurn && !this.state.playedCardThisTurn && hasPlaceableHand;
      const canAttackTurn = this.canTeamAttackThisTurn(turnTeam);
      const readyBoardActionCount = isControllableTurn
        ? this.getAllBoardCards(turnTeam).filter(c =>
            (canAttackTurn && !c.attackedThisTurn && this.getValidAttackTargets(turnTeam, c.uid).length > 0) ||
            this.getBoostableAlliesFor(c, turnTeam).length > 0
          ).length
        : 0;

      const p1SideEl = document.querySelector('.gwent-side-player');
      const p2SideEl = document.querySelector('.gwent-side-opp');
      const handTrayEl = document.querySelector('.gwent-hand-tray');
      const p1HasActions = isControllableTurn && turnTeam === 1 && readyBoardActionCount > 0;
      const p2HasActions = isControllableTurn && turnTeam === 2 && readyBoardActionCount > 0;

      p1SideEl?.classList.toggle('active-turn-side', showTurnHighlight && turnTeam === 1);
      p2SideEl?.classList.toggle('active-turn-side', showTurnHighlight && turnTeam === 2);
      p1SideEl?.classList.toggle('has-board-actions', p1HasActions);
      p2SideEl?.classList.toggle('has-board-actions', p2HasActions);
      handTrayEl?.classList.toggle('can-play-card', canPlayCardNow);

      this.syncBorderCometOverlay(p1SideEl, p1HasActions, 'red', 10);
      this.syncBorderCometOverlay(p2SideEl, p2HasActions, 'red', 10);
      this.syncBorderCometOverlay(handTrayEl, canPlayCardNow, 'gold', 10);

      const checklistEl = document.getElementById('gwent-turn-checklist');
      const playPillEl = document.getElementById('phase-pill-play');
      const attackPillEl = document.getElementById('phase-pill-attack');
      if (checklistEl) {
        checklistEl.classList.toggle('hidden', !isControllableTurn);
        if (isControllableTurn) {
          if (playPillEl) {
            if (this.state.playedCardThisTurn) {
              playPillEl.className = 'gwent-phase-pill phase-done';
              playPillEl.textContent = '✅ Card Played';
            } else if (canPlayCardNow) {
              playPillEl.className = 'gwent-phase-pill phase-gold-ready';
              playPillEl.textContent = '🃏 Play a Card';
            } else {
              playPillEl.className = 'gwent-phase-pill phase-locked';
              playPillEl.textContent = '🃏 No Cards Left';
            }
          }
          if (attackPillEl) {
            if (readyBoardActionCount > 0) {
              attackPillEl.className = 'gwent-phase-pill phase-attack-ready';
              attackPillEl.textContent = `⚔️ ${readyBoardActionCount} Action${readyBoardActionCount === 1 ? '' : 's'} Ready`;
            } else if (!canAttackTurn) {
              attackPillEl.className = 'gwent-phase-pill phase-locked';
              attackPillEl.textContent = '⏳ Attacks Next Turn';
            } else {
              attackPillEl.className = 'gwent-phase-pill phase-done';
              attackPillEl.textContent = '✅ Board Actions Done';
            }
          }
        }
      }

      this.renderGems('gwent-p1-gems', p1.gems);
      this.renderGems('gwent-p2-gems', p2.gems);
      this.renderBoardRounds(p1, p2);

      document.getElementById('gwent-round-pill').textContent = `ROUND ${this.state.round} • BEST OF 3`;
      document.getElementById('gwent-center-badge').textContent = `MYTHOS • ROUND ${this.state.round}`;
      document.getElementById('gwent-turn-banner').textContent = this.state.mulliganActive
        ? `Opening Mulligan (${this.state.mulliganLeft} left)`
        : (this.state.turnTeam === 1 ? `☀️ ${p1.name}'s Turn` : `🌙 ${p2.name}'s Turn`);

      // End Turn & Pass Buttons (Sidebar + Floating HUD)
      const canAct = !this.isMatchOver && !this.state.mulliganActive && !isAutoEnding && (this.gameMode === '2p' || this.state.turnTeam === 1) && !this.state.players[this.state.turnTeam].passed;
      const endTurnBtn = document.getElementById('btn-gwent-end-turn');
      if (endTurnBtn) {
        endTurnBtn.disabled = !canAct;
        endTurnBtn.classList.toggle('auto-ending', isAutoEnding);
        endTurnBtn.textContent = isAutoEnding ? '⏭️ AUTO-ENDING...' : '⏭️ END TURN';
      }
      const hudEndTurnBtn = document.getElementById('hud-btn-end-turn');
      if (hudEndTurnBtn) {
        hudEndTurnBtn.disabled = !canAct;
        hudEndTurnBtn.classList.toggle('auto-ending', isAutoEnding);
        hudEndTurnBtn.textContent = isAutoEnding ? '⏭️ Auto-Ending...' : '⏭️ End Turn';
      }
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
        const boardTotalEl = document.getElementById(`board-total-score-${team}`);
        if (boardTotalEl) boardTotalEl.textContent = this.getTotalScore(team);

        ['melee', 'ranged'].forEach(rk => {
          const scoreEl = document.getElementById(`score-${team}-${rk}`);
          if (scoreEl) scoreEl.textContent = this.getRowScore(team, rk);

          const rowEl = document.getElementById(`row-${team}-${rk}`);
          const isValidDrop = canPlaySelected && team === this.state.turnTeam && (selectedCard.row === 'agile' || selectedCard.row === rk);
          if (rowEl) rowEl.classList.toggle('valid-drop', Boolean(isValidDrop));

          const cardsEl = document.getElementById(`cards-${team}-${rk}`);
          if (cardsEl) {
            cardsEl.innerHTML = '';
            const rowCards = this.state.players[team].rows[rk];
            const showInsertSlots = Boolean(isValidDrop) && rowCards.length > 0;
            cardsEl.classList.toggle('insert-spread', showInsertSlots);

            const makeInsertSlot = (insertIdx) => {
              const slot = document.createElement('div');
              slot.className = 'gwent-insert-slot';
              slot.title = `Place ${selectedCard.name} here`;
              slot.textContent = '+';
              slot.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playCardToRow(team, this.state.selectedHandUid, rk, insertIdx);
              });
              return slot;
            };

            if (showInsertSlots) cardsEl.appendChild(makeInsertSlot(0));
            rowCards.forEach((c, idx) => {
              cardsEl.appendChild(this.createCardElement(c, true, team, rk));
              if (showInsertSlots) cardsEl.appendChild(makeInsertSlot(idx + 1));
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
          const cfg = activeAttacker.boostRoleAbility || {};
          const boostStatLabel = cfg.stat === 'armor' ? 'Armor' : 'Power';
          const boostAmt = cfg.amount || 1;
          const boostIcon = cfg.icon || (cfg.stat === 'armor' ? '🛡️' : '🐺');
          const boostRoleName = cfg.role || 'ally';
          if (boostTargets.length > 0 && !activeAttacker.attackedThisTurn) {
            const atkDmg = Math.max(1, activeAttacker.power);
            const insteadNote = cfg.replacesAttack ? ' (in place of attacking)' : '';
            hintEl.textContent = `${boostIcon} ${activeAttacker.name} (${atkDmg} Dmg): Click a glowing ${boostRoleName} ally to give +${boostAmt} ${boostStatLabel}${insteadNote}, or click an enemy to attack.`;
          } else if (boostTargets.length > 0) {
            hintEl.textContent = `${boostIcon} ${activeAttacker.name}: Click a glowing ${boostRoleName} ally to give +${boostAmt} ${boostStatLabel}, or click ${activeAttacker.name} to cancel.`;
          } else {
            const atkDmg = Math.max(1, activeAttacker.power);
            hintEl.textContent = `⚔️ ${activeAttacker.name} ready (${atkDmg} Dmg): Click a glowing opposing card to attack, or click ${activeAttacker.name} again to cancel.`;
          }
        } else if (canPlaySelected) {
          hintEl.textContent = `Selected ${selectedCard.name}: Click the left or right side of a board card (or a highlighted ${ROW_LABELS[selectedCard.row]} row) to deploy.`;
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

      requestAnimationFrame(() => this.renderAttackTargetPreviewLine());
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

    renderBoardRounds(p1, p2) {
      const p1Wins = typeof p1?.roundWins === 'number' ? p1.roundWins : Math.max(0, 2 - (p2?.gems ?? 2));
      const p2Wins = typeof p2?.roundWins === 'number' ? p2.roundWins : Math.max(0, 2 - (p1?.gems ?? 2));
      const showTurnHighlight = Boolean(this.state) && !this.state.mulliganActive && !this.isMatchOver;
      const isP1Turn = showTurnHighlight && this.state.turnTeam === 1;
      const isP2Turn = showTurnHighlight && this.state.turnTeam === 2;

      const p1NameEl = document.getElementById('board-p1-name');
      const p2NameEl = document.getElementById('board-p2-name');
      const p1Display = p1?.name === 'You' ? 'YOU' : (p1?.name || 'YOU');
      const p2Display = p2?.name || 'OPP';
      if (p1NameEl) {
        p1NameEl.textContent = p1Display;
        p1NameEl.classList.toggle('active-turn', isP1Turn);
      }
      if (p2NameEl) {
        p2NameEl.textContent = p2Display;
        p2NameEl.classList.toggle('active-turn', isP2Turn);
      }

      const p1WinsEl = document.getElementById('board-p1-wins');
      const p2WinsEl = document.getElementById('board-p2-wins');
      if (p1WinsEl) p1WinsEl.textContent = String(p1Wins);
      if (p2WinsEl) p2WinsEl.textContent = String(p2Wins);

      const p1Side = document.getElementById('board-rounds-p1');
      const p2Side = document.getElementById('board-rounds-p2');
      if (p1Side) {
        p1Side.classList.toggle('has-win', p1Wins > 0);
        p1Side.classList.toggle('active-turn', isP1Turn);
        p1Side.classList.toggle('waiting-turn', showTurnHighlight && !isP1Turn);
        p1Side.classList.toggle('is-passed', Boolean(p1?.passed));
        p1Side.title = `${p1?.name || 'You'}${isP1Turn ? ' — Current Turn' : (p1?.passed ? ' — Passed' : '')}: ${p1Wins}/2 rounds won`;
      }
      if (p2Side) {
        p2Side.classList.toggle('has-win', p2Wins > 0);
        p2Side.classList.toggle('active-turn', isP2Turn);
        p2Side.classList.toggle('waiting-turn', showTurnHighlight && !isP2Turn);
        p2Side.classList.toggle('is-passed', Boolean(p2?.passed));
        p2Side.title = `${p2?.name || 'Opponent'}${isP2Turn ? ' — Current Turn' : (p2?.passed ? ' — Passed' : '')}: ${p2Wins}/2 rounds won`;
      }

      const p1Pips = document.getElementById('board-p1-pips');
      if (p1Pips) {
        const pips = p1Pips.querySelectorAll('.board-round-pip');
        pips.forEach((pip, idx) => pip.classList.toggle('won', idx < p1Wins));
      }

      const p2Pips = document.getElementById('board-p2-pips');
      if (p2Pips) {
        const pips = p2Pips.querySelectorAll('.board-round-pip');
        // Light up from the inner pip outward toward the moon crest
        pips.forEach((pip, idx) => pip.classList.toggle('won', idx >= (pips.length - p2Wins)));
      }
    }

    createCardElement(card, onBoard = false, ownerTeam = null, rowKey = null) {
      const el = document.createElement('div');
      let extraClasses = '';
      if (onBoard && this.state && !this.state.mulliganActive && !this.isMatchOver) {
        const activeTeam = this.state.turnTeam;
        const canControl = this.gameMode === '2p' || activeTeam === 1;
        const canAttack = this.canTeamAttackThisTurn(activeTeam);
        const hasValidTargets = this.getValidAttackTargets(activeTeam, card.uid).length > 0;
        const canAttackCard = canAttack && !card.attackedThisTurn && hasValidTargets;
        const canBoostCard = this.getBoostableAlliesFor(card, activeTeam).length > 0;
        const canAct = canAttackCard || canBoostCard;
        if (canControl && ownerTeam === activeTeam) {
          extraClasses += canAct ? ' attack-ready' : ' attack-spent';
        }
        if (this.state.selectedAttackerUid === card.uid) {
          extraClasses += ' attacker-selected';
        }
        const selectedCard = this.state.selectedAttackerUid
          ? this.getAllBoardCards(activeTeam).find(c => c.uid === this.state.selectedAttackerUid)
          : null;
        if (selectedCard && ownerTeam !== activeTeam && !selectedCard.attackedThisTurn && this.canCardAttackTargetRow(activeTeam, selectedCard.uid, rowKey)) {
          extraClasses += ' attack-target';
        }
        if (selectedCard && ownerTeam === activeTeam && card.uid !== selectedCard.uid && this.getBoostableAlliesFor(selectedCard, activeTeam).some(c => c.uid === card.uid)) {
          extraClasses += ' boost-target';
        }
      }
      if (card.shield) {
        extraClasses += ' has-shield';
      }
      const isFrozen = (card.frozenTurns || 0) > 0 || Boolean(card.isFrozenThisTurn);
      if (isFrozen) {
        extraClasses += ' is-frozen';
      }
      const factionClass = card.role === 'Wolf Pack' ? ' faction-wolf-pack' : '';
      el.className = `gwent-card rarity-${card.border || card.rarity}${factionClass} ${onBoard ? 'board-card' : ''}${extraClasses}`;
      el.dataset.uid = card.uid;

      const powerClass = card.power > card.basePower ? 'boosted' : (card.power < card.basePower ? 'damaged' : '');
      const twinTideActive = onBoard && ownerTeam != null && this.isDoubleHitActive(card, ownerTeam);
      const twinTideHtml = twinTideActive
        ? `<div class="gwent-card-double-hit" title="Twin Tide Active: Hits twice when attacking!">🔱×2</div>`
        : '';
      const armorHtml = card.armor > 0 ? `<div class="gwent-card-armor">🛡️${card.armor}</div>` : '';
      const shieldHtml = card.shield ? `<div class="gwent-card-shield-badge" title="Shield: Ignores next instance of damage">🔰</div>` : '';
      const defensesHtml = (card.armor > 0 || card.shield || twinTideActive)
        ? `<div class="gwent-card-defenses">${twinTideHtml}${shieldHtml}${armorHtml}</div>`
        : '';
      const iceBorderHtml = isFrozen ? `<div class="gwent-card-ice-overlay" title="Frozen: Cannot attack on its next turn"></div>` : '';

      const CG = window.MythosCardGrading;
      const artStyle = CG?.getCardImgStyle ? CG.getCardImgStyle(card.condition) : '';
      const defectOverlay = CG?.renderConditionOverlayHtml ? CG.renderConditionOverlayHtml(card.condition, { compact: true }) : '';

      el.innerHTML = `
        <img class="gwent-card-art" src="${card.cardImg}" alt="${card.name}" style="${artStyle}">
        ${defectOverlay}
        <div class="gwent-card-power ${powerClass}" title="Power: ${card.power}">${card.power}</div>
        <div class="gwent-card-row-badge" title="${ROW_LABELS[card.row]}">${ROW_ICONS[card.row]}</div>
        ${defensesHtml}
        ${iceBorderHtml}
        <div class="gwent-card-name-strip">${card.name}</div>
      `;

      const animBoardSrc = onBoard && card._playBoardAnim
        ? (card.animatedCardVideo || GWENT_CARDS[card.id]?.animatedCardVideo || null)
        : null;
      if (animBoardSrc) {
        if (!this._activeBoardVideos) this._activeBoardVideos = new Map();
        let vid = this._activeBoardVideos.get(card.uid);
        if (!vid) {
          vid = document.createElement('video');
          vid.className = 'gwent-card-art gwent-card-video';
          vid.src = animBoardSrc;
          vid.poster = card.cardImg || '';
          vid.preload = 'auto';
          this._activeBoardVideos.set(card.uid, vid);
        }
        const baseImg = el.querySelector('.gwent-card-art');
        if (baseImg) baseImg.insertAdjacentElement('afterend', vid);
        else el.prepend(vid);

        window.MythosGwentCards?.playCardVideoOnce?.(vid, {
          onEnded: () => {
            card._playBoardAnim = false;
            this._activeBoardVideos?.delete(card.uid);
            vid.remove();
          }
        });
      }

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
          this.handleBoardCardClick(ownerTeam, card, rowKey, e);
        });
      }
      return el;
    }

    ensureCardModalStackStage() {
      const modal = document.getElementById('gwent-card-modal');
      const dialog = document.getElementById('gwent-card-modal-dialog');
      if (!modal || !dialog) return null;

      let stage = document.getElementById('gwent-inspect-stack-stage');
      if (!stage) {
        stage = document.createElement('div');
        stage.id = 'gwent-inspect-stack-stage';
        stage.className = 'gwent-inspect-stack-stage';
        stage.innerHTML = `
          <button type="button" class="gwent-stack-arrow prev hidden" id="btn-gwent-stack-prev" aria-label="Previous card in stack">◀</button>
          <div class="gwent-stack-cards-host" id="gwent-stack-cards-host">
            <div class="gwent-stack-backdrop" id="gwent-stack-backdrop"></div>
          </div>
          <button type="button" class="gwent-stack-arrow next hidden" id="btn-gwent-stack-next" aria-label="Next card in stack">▶</button>
          <div class="gwent-stack-counter hidden" id="gwent-stack-counter"></div>
        `;
        modal.appendChild(stage);
        const host = stage.querySelector('#gwent-stack-cards-host');
        if (host && dialog.parentElement !== host) {
          host.appendChild(dialog);
        }
        stage.querySelector('#btn-gwent-stack-prev')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cycleCardModalStack(-1);
        });
        stage.querySelector('#btn-gwent-stack-next')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.cycleCardModalStack(1);
        });
      }
      if (!modal._stackWheelBound) {
        modal._stackWheelBound = true;
        modal.addEventListener('wheel', (e) => {
          if (modal.classList.contains('hidden')) return;
          if (!this._activeCardStackCtx || !Array.isArray(this._activeCardStackCtx.copies) || this._activeCardStackCtx.copies.length <= 1) return;
          e.preventDefault();
          const now = performance.now();
          if (now - (this._lastStackWheelAt || 0) < 220) return;
          this._lastStackWheelAt = now;
          const delta = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) >= 0 ? 1 : -1;
          this.cycleCardModalStack(delta);
        }, { passive: false });
      }
      return stage;
    }

    cycleCardModalStack(delta) {
      const ctx = this._activeCardStackCtx;
      const card = this._activeCardStackCard;
      if (!ctx || !Array.isArray(ctx.copies) || ctx.copies.length <= 1 || !card) return;

      const outgoingCond = ctx.copies[0];
      const len = ctx.copies.length;
      if (delta > 0) {
        const first = ctx.copies.shift();
        ctx.copies.push(first);
        ctx.displayPos = ((ctx.displayPos || 0) + 1) % len;
      } else {
        const last = ctx.copies.pop();
        ctx.copies.unshift(last);
        ctx.displayPos = ((ctx.displayPos || 0) - 1 + len) % len;
      }

      if (typeof ctx.onStackChanged === 'function') {
        ctx.onStackChanged(ctx.copies, delta);
      }
      this.openCardModal({ ...card, condition: ctx.copies[0] }, ctx);

      const host = document.getElementById('gwent-stack-cards-host');
      const dialog = document.getElementById('gwent-card-modal-dialog');
      if (host && dialog) {
        clearTimeout(this._stackShuffleTimer);
        host.querySelectorAll('.gwent-stack-ghost-out').forEach(el => el.remove());

        const CG = window.MythosCardGrading;
        const def = window.MythosGwentCards?.CARDS?.[card.id];
        const tradImg = card.traditionalCardImg || def?.traditionalCardImg || null;
        const ghost = document.createElement('div');
        ghost.className = `gwent-stack-ghost-out ${delta > 0 ? 'to-prev' : 'to-next'}${outgoingCond?.isGraded ? ' is-slabbed' : ''}`;
        const outStyle = CG?.getCardImgStyle ? CG.getCardImgStyle(outgoingCond) : '';
        const outOverlay = CG?.renderConditionOverlayHtml ? CG.renderConditionOverlayHtml(outgoingCond, { compact: true }) : '';
        ghost.innerHTML = `
          <img src="${tradImg || card.cardImg}" alt="${card.name}" style="${outStyle}" draggable="false">
          ${outOverlay}
        `;
        host.appendChild(ghost);

        dialog.classList.remove('shuffle-in-next', 'shuffle-in-prev');
        void dialog.offsetWidth;
        dialog.classList.add(delta > 0 ? 'shuffle-in-next' : 'shuffle-in-prev');

        const cleanup = () => {
          ghost.remove();
          dialog.classList.remove('shuffle-in-next', 'shuffle-in-prev');
        };
        ghost.addEventListener('animationend', cleanup, { once: true });
        this._stackShuffleTimer = setTimeout(cleanup, 380);
      }
    }

    openCardModal(card, stackCtx = null) {
      if (!card) return;
      this.ensureCardModalStackStage();
      const modal = document.getElementById('gwent-card-modal');
      const dialog = document.getElementById('gwent-card-modal-dialog');
      if (!modal || !dialog) return;

      const hasStack = Boolean(stackCtx && Array.isArray(stackCtx.copies) && stackCtx.copies.length > 1);
      if (stackCtx && stackCtx.displayPos === undefined) stackCtx.displayPos = 0;
      this._activeCardStackCtx = hasStack ? stackCtx : null;
      this._activeCardStackCard = card;

      const stars = Math.max(1, Number(card.stars) || 1);
      const tierClass = stars >= 4
        ? 'tier-diamond'
        : (stars === 3 ? 'tier-gold' : (stars === 2 ? 'tier-silver' : 'tier-bronze'));
      dialog.classList.remove('tier-bronze', 'tier-silver', 'tier-gold', 'tier-diamond', 'has-traditional-img', 'faction-wolf-pack');
      dialog.classList.add('traditional-card', tierClass);
      if (card.role === 'Wolf Pack') {
        dialog.classList.add('faction-wolf-pack');
      }

      const pwrVal = card.power ?? card.basePower;
      const armorVal = card.armor || 0;
      const def = window.MythosGwentCards?.CARDS?.[card.id];
      const tradImg = card.traditionalCardImg || def?.traditionalCardImg || null;

      const img = document.getElementById('gwent-modal-img');
      const CG = window.MythosCardGrading;
      if (img) {
        img.src = tradImg || card.cardImg;
        img.style.cssText = CG?.getCardImgStyle ? CG.getCardImgStyle(card.condition) : '';
      }

      document.getElementById('gwent-modal-defect-overlay')?.remove();
      document.getElementById('gwent-modal-grade-strip')?.remove();
      let frontStatus = 'Raw';
      if (card.condition && CG?.renderConditionOverlayHtml) {
        const defectWrap = document.createElement('div');
        defectWrap.id = 'gwent-modal-defect-overlay';
        defectWrap.className = 'gwent-modal-defect-overlay';
        defectWrap.innerHTML = CG.renderConditionOverlayHtml(card.condition, { includeTiltGlare: true });
        dialog.appendChild(defectWrap);
        CG.attachInspectTilt?.(dialog);

        const cond = CG.ensureHydratedCondition(card.condition);
        const strip = document.createElement('div');
        strip.id = 'gwent-modal-grade-strip';
        if (cond.isGraded) {
          const gMeta = CG.getGradeMeta(cond.grade, cond.isPristine);
          const sg = cond.subgrades || {};
          strip.className = 'gwent-modal-grade-strip is-graded';
          strip.style.background = gMeta.bg;
          strip.style.color = gMeta.color;
          strip.innerHTML = `<span>🏆 ${gMeta.label}</span><span>C ${sg.centering} • Co ${sg.corners} • E ${sg.edges} • S ${sg.surface}</span>`;
          frontStatus = gMeta.label;
        } else {
          const sleevePrefix = cond.sleeveTier === 'pro_sleeve'
            ? '✨ Pro Matte • '
            : (cond.sleeveTier === 'clear_sleeve' ? '🛡️ Pro Sleeve • ' : '');
          strip.className = 'gwent-modal-grade-strip is-raw';
          strip.textContent = `🔍 ${sleevePrefix}Raw Card • Tilt cursor to inspect centering, corners, edges & surface`;
          frontStatus = cond.sleeveTier === 'pro_sleeve'
            ? 'Raw • Pro Matte'
            : (cond.sleeveTier === 'clear_sleeve' ? 'Raw • Pro Sleeve' : 'Raw');
        }
        dialog.appendChild(strip);
      }

      const backdrop = document.getElementById('gwent-stack-backdrop');
      const prevBtn = document.getElementById('btn-gwent-stack-prev');
      const nextBtn = document.getElementById('btn-gwent-stack-next');
      const counterEl = document.getElementById('gwent-stack-counter');
      if (backdrop) {
        backdrop.innerHTML = '';
        if (hasStack) {
          const copies = stackCtx.copies;
          const len = copies.length;
          let slots = [];
          if (len === 2) {
            slots = [{ idx: 1, cls: 'pos-next-1', dir: 1 }];
          } else if (len === 3) {
            slots = [
              { idx: 2, cls: 'pos-prev-1', dir: -1 },
              { idx: 1, cls: 'pos-next-1', dir: 1 }
            ];
          } else {
            slots = [
              { idx: len - 2, cls: 'pos-prev-2', dir: -1 },
              { idx: 2, cls: 'pos-next-2', dir: 1 },
              { idx: len - 1, cls: 'pos-prev-1', dir: -1 },
              { idx: 1, cls: 'pos-next-1', dir: 1 }
            ];
          }
          slots.forEach(({ idx, cls, dir }) => {
            const bgCond = copies[idx];
            if (!bgCond) return;
            const peek = document.createElement('div');
            peek.className = `gwent-stack-peek-card ${cls}${bgCond.isGraded ? ' is-slabbed' : ''}`;
            const bgStyle = CG?.getCardImgStyle ? CG.getCardImgStyle(bgCond) : '';
            const bgOverlay = CG?.renderConditionOverlayHtml ? CG.renderConditionOverlayHtml(bgCond, { compact: true }) : '';
            peek.innerHTML = `
              <img src="${tradImg || card.cardImg}" alt="${card.name}" style="${bgStyle}" draggable="false">
              ${bgOverlay}
            `;
            peek.addEventListener('click', (e) => {
              e.stopPropagation();
              this.cycleCardModalStack(dir);
            });
            backdrop.appendChild(peek);
          });
          prevBtn?.classList.remove('hidden');
          nextBtn?.classList.remove('hidden');
          if (counterEl) {
            counterEl.classList.remove('hidden');
            const labelPrefix = stackCtx.label ? `${stackCtx.label} • ` : '';
            counterEl.innerHTML = `<span>${labelPrefix}<b>Card ${(stackCtx.displayPos || 0) + 1} / ${len}</b> • Top of Stack: <b>${frontStatus}</b></span>`;
          }
        } else {
          prevBtn?.classList.add('hidden');
          nextBtn?.classList.add('hidden');
          counterEl?.classList.add('hidden');
        }
      }

      let modalVideo = document.getElementById('gwent-modal-video');
      if (!modalVideo && img) {
        modalVideo = document.createElement('video');
        modalVideo.id = 'gwent-modal-video';
        modalVideo.className = 'trad-card-bg-img hidden';
        modalVideo.preload = 'auto';
        img.insertAdjacentElement('afterend', modalVideo);
      }
      const animModalSrc = card.animatedTraditionalVideo
        || def?.animatedTraditionalVideo
        || card.animatedCardVideo
        || def?.animatedCardVideo
        || null;
      if (modalVideo) {
        modalVideo.pause();
        if (animModalSrc) {
          modalVideo.src = animModalSrc;
          modalVideo.poster = tradImg || card.cardImg || '';
          modalVideo.currentTime = 0;
          modalVideo.classList.remove('hidden');
          window.MythosGwentCards?.playCardVideoOnce?.(modalVideo, {
            onEnded: () => {
              modalVideo.classList.add('hidden');
            }
          });
        } else {
          modalVideo.removeAttribute('src');
          modalVideo.classList.add('hidden');
        }
      }

      const liveBadge = document.getElementById('gwent-modal-live-badge');
      if (tradImg) {
        dialog.classList.add('has-traditional-img');
        if (liveBadge) {
          const isModified = pwrVal !== card.basePower;
          liveBadge.classList.toggle('hidden', !isModified);
          if (isModified) {
            liveBadge.textContent = `⚔️ ${pwrVal} PWR`;
          }
        }
      } else if (liveBadge) {
        liveBadge.classList.add('hidden');
      }

      const crestEl = document.getElementById('gwent-modal-crest-icon');
      if (crestEl) {
        const elemIcons = { fire: '🔥', water: '💧', earth: '🪨', air: '🌪️', plant: '🌿', metal: '⚙️' };
        crestEl.textContent = elemIcons[card.element] || ROW_ICONS[card.row] || '⚔️';
      }

      const nameEl = document.getElementById('gwent-modal-name');
      if (nameEl) nameEl.textContent = card.name;

      const pwrEl = document.getElementById('gwent-modal-power');
      if (pwrEl) {
        pwrEl.textContent = pwrVal;
        pwrEl.className = 'stat-val ' + (pwrVal > card.basePower ? 'boosted' : (pwrVal < card.basePower ? 'damaged' : ''));
      }

      const armorEl = document.getElementById('gwent-modal-armor');
      if (armorEl) armorEl.textContent = armorVal;

      const abTitle = document.getElementById('gwent-modal-ability-title');
      if (abTitle) abTitle.textContent = `${ROW_ICONS[card.row] || '⚔️'} ${card.abilityTitle}`;
      const abDesc = document.getElementById('gwent-modal-ability-desc');
      if (abDesc) abDesc.textContent = card.abilityDesc;

      const pasTitle = document.getElementById('gwent-modal-passive-title');
      const pasDesc = document.getElementById('gwent-modal-passive-desc');
      const pasCard = pasTitle?.closest('.gwent-modal-ability-card');
      if (pasCard) pasCard.classList.toggle('hidden', !card.passiveDesc);
      if (pasTitle) pasTitle.textContent = card.passiveTitle ? `🌟 ${card.passiveTitle}` : '';
      if (pasDesc) pasDesc.textContent = card.passiveDesc || '';

      const roleRowEl = document.getElementById('gwent-modal-role-row');
      if (roleRowEl) {
        const roleLabel = card.role || def?.role || card.element || 'Beast';
        const rowLabel = ROW_LABELS[card.row] || card.row || 'Agile';
        roleRowEl.textContent = `${roleLabel} • ${rowLabel}`;
      }

      const starsEl = document.getElementById('gwent-modal-stars');
      if (starsEl) {
        starsEl.textContent = '★'.repeat(stars);
      }

      window.soundFX?.playClick?.();
      modal.classList.remove('hidden');
    }

    closeCardModal() {
      const modalVideo = document.getElementById('gwent-modal-video');
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.classList.add('hidden');
      }
      clearTimeout(this._stackShuffleTimer);
      document.querySelectorAll('.gwent-stack-ghost-out').forEach(el => el.remove());
      document.getElementById('gwent-card-modal-dialog')?.classList.remove('shuffle-in-next', 'shuffle-in-prev');
      this._activeCardStackCtx = null;
      this._activeCardStackCard = null;
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
      if (this.headless || !this.elLog) return;
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
      document.getElementById('tut-btn-prev')?.addEventListener('click', () => this.prevTutorialStep());
      document.getElementById('tut-btn-next')?.addEventListener('click', () => this.advanceTutorialStep());
      document.getElementById('tut-btn-skip')?.addEventListener('click', () => this.closeTutorialBanner(true));
      document.getElementById('tut-btn-collapse')?.addEventListener('click', () => {
        const banner = document.getElementById('gwent-tutorial-banner');
        const btn = document.getElementById('tut-btn-collapse');
        if (!banner) return;
        const isCollapsed = banner.classList.toggle('collapsed');
        if (btn) btn.textContent = isCollapsed ? '📖 Show Guide' : '👁️ View Board';
      });
      document.getElementById('btn-clear-log')?.addEventListener('click', () => {
        if (this.elLog) this.elLog.innerHTML = '';
      });

      // Card Detail Zoom Modal events
      document.getElementById('card-frame')?.addEventListener('click', () => {
        if (this.state?.inspectedCard) this.openCardModal(this.state.inspectedCard);
      });
      document.getElementById('btn-close-gwent-card-modal')?.addEventListener('click', () => this.closeCardModal());
      document.getElementById('gwent-card-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'gwent-card-modal' || e.target.id === 'gwent-inspect-stack-stage') this.closeCardModal();
      });
      window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('gwent-card-modal');
        if (modal && !modal.classList.contains('hidden')) {
          if (e.key === 'Escape') {
            this.closeCardModal();
            return;
          }
          if (this._activeCardStackCtx && e.key === 'ArrowLeft') {
            e.preventDefault();
            this.cycleCardModalStack(-1);
            return;
          }
          if (this._activeCardStackCtx && e.key === 'ArrowRight') {
            e.preventDefault();
            this.cycleCardModalStack(1);
            return;
          }
        }
      });
      window.addEventListener('resize', () => this.renderAttackTargetPreviewLine());

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
          document.getElementById(`row-${team}-${rk}`)?.addEventListener('click', (e) => {
            if (!this.state || this.state.mulliganActive) return;
            if (team !== this.state.turnTeam || !this.state.selectedHandUid) return;
            const cardsEl = document.getElementById(`cards-${team}-${rk}`);
            const firstCardEl = cardsEl?.querySelector('.gwent-card');
            let insertIdx = null;
            if (firstCardEl && e.clientX < firstCardEl.getBoundingClientRect().left) {
              insertIdx = 0;
            }
            this.playCardToRow(team, this.state.selectedHandUid, rk, insertIdx);
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

      // Swipe-down top bar & menu-body swipe-down gesture to exit Arena Menu, Chronicle & Card Modal
      const attachArenaSwipeToExit = ({ frameEl, headerEl, onClose }) => {
        if (!frameEl || typeof onClose !== 'function') return;
        let swipeBar = frameEl.querySelector(':scope > .phone-swipe-top-bar');
        if (!swipeBar) {
          swipeBar = document.createElement('div');
          swipeBar.className = 'phone-swipe-top-bar menu-swipe-top-bar';
          swipeBar.title = 'Swipe down or tap to exit';
          swipeBar.innerHTML = '<div class="phone-swipe-handle-pill"></div><span class="phone-swipe-hint">⌄ Swipe down to exit</span>';
          frameEl.insertBefore(swipeBar, frameEl.firstChild);
        }

        const setDragTransform = (dy) => {
          frameEl.style.setProperty('transform', `translate(0px, ${Math.min(240, dy)}px)`, 'important');
        };
        const resetDragTransform = () => {
          frameEl.style.transition = '';
          frameEl.style.removeProperty('transform');
        };

        [swipeBar, headerEl].filter(Boolean).forEach(barEl => {
          let startY = null;
          let currentDeltaY = 0;

          barEl.addEventListener('pointerdown', (e) => {
            if (barEl !== swipeBar && e.target?.closest?.('button, input, select, textarea, a')) return;
            startY = e.clientY;
            currentDeltaY = 0;
            frameEl.style.transition = 'none';
            try { barEl.setPointerCapture(e.pointerId); } catch (_) {}
          });

          barEl.addEventListener('pointermove', (e) => {
            if (startY === null) return;
            currentDeltaY = Math.max(0, e.clientY - startY);
            if (currentDeltaY > 0) {
              setDragTransform(currentDeltaY);
            }
          });

          const endSwipe = () => {
            if (startY === null) return;
            const dragged = currentDeltaY;
            startY = null;
            currentDeltaY = 0;
            resetDragTransform();
            if (dragged > 28 || (barEl === swipeBar && dragged <= 10)) {
              onClose();
            }
          };

          barEl.addEventListener('pointerup', endSwipe);
          barEl.addEventListener('pointercancel', () => {
            startY = null;
            currentDeltaY = 0;
            resetDragTransform();
          });
        });

        const isScrolledDown = (target) => {
          let cur = target instanceof Element ? target : null;
          while (cur && cur !== frameEl.parentElement) {
            if (cur.scrollTop > 4) return true;
            cur = cur.parentElement;
          }
          return frameEl.scrollTop > 4;
        };

        let bodyStartX = 0;
        let bodyStartY = 0;
        let canBodySwipe = false;
        let isDraggingBody = false;
        let bodyDeltaY = 0;

        frameEl.addEventListener('touchstart', (e) => {
          if (e.touches.length !== 1) return;
          if (e.target?.closest?.('.phone-swipe-top-bar, input, select, textarea')) return;
          if (isScrolledDown(e.target)) {
            canBodySwipe = false;
            return;
          }
          canBodySwipe = true;
          isDraggingBody = false;
          bodyDeltaY = 0;
          bodyStartX = e.touches[0].clientX;
          bodyStartY = e.touches[0].clientY;
        }, { passive: true });

        frameEl.addEventListener('touchmove', (e) => {
          if (!canBodySwipe || e.touches.length !== 1) return;
          const dx = e.touches[0].clientX - bodyStartX;
          const dy = e.touches[0].clientY - bodyStartY;
          if (!isDraggingBody) {
            if (dy < -8 || (Math.abs(dx) > 10 && Math.abs(dx) > dy) || isScrolledDown(e.target)) {
              canBodySwipe = false;
              return;
            }
            if (dy > 14 && dy > Math.abs(dx) * 1.25) {
              isDraggingBody = true;
              frameEl.style.transition = 'none';
            }
          }
          if (isDraggingBody) {
            if (e.cancelable) e.preventDefault();
            bodyDeltaY = Math.max(0, dy);
            setDragTransform(bodyDeltaY);
          }
        }, { passive: false });

        const finishBodySwipe = () => {
          if (isDraggingBody) {
            const dragged = bodyDeltaY;
            resetDragTransform();
            if (dragged > 42) {
              onClose();
            }
          }
          canBodySwipe = false;
          isDraggingBody = false;
          bodyDeltaY = 0;
        };

        frameEl.addEventListener('touchend', finishBodySwipe, { passive: true });
        frameEl.addEventListener('touchcancel', finishBodySwipe, { passive: true });
      };

      attachArenaSwipeToExit({
        frameEl: logPanel,
        headerEl: logPanel?.querySelector('.log-header'),
        onClose: closeDrawers
      });

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
    if (!window.MYTHOS_HEADLESS_SIM) {
      window.game = new BeastsGame();
    }
  });
})();
