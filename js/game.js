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
      cardImg: 'Cards/Verdant_Guardian_Card.png',
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
      cardImg: 'Cards/Dwarf_Warden_Card.png',
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
      cardImg: 'Cards/Pegasus_Card.png',
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
      cardImg: 'Cards/Dreadnaught_Card.png',
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

  // Expose BEAST_TEMPLATES globally for overworld, binder & creature inspect systems
  window.BEAST_TEMPLATES = BEAST_TEMPLATES;

  // ---------------------------------------------------------------------------
  // Tactical Maps Registry
  // ---------------------------------------------------------------------------
  const MAP_TEMPLATES = {
    standard_10x8: {
      id: 'standard_10x8',
      name: 'Mythos Valley (3v3)',
      cols: 10,
      rows: 8,
      aspectRatio: '10 / 8',
      aspectMultiplier: 1.25,
      bgImg: 'Game_Board_Playable_Grid_2560x2048.png',
      teamSize: 3,
      cssClass: 'map-standard',
      spawnRows: [2, 3, 4]
    },
    Base2v2: {
      id: 'Base2v2',
      name: 'Base2v2 (2v2)',
      cols: 6,
      rows: 6,
      aspectRatio: '1 / 1',
      aspectMultiplier: 1.0,
      bgImg: 'Base2v2.png',
      teamSize: 2,
      cssClass: 'map-base2v2',
      spawnRows: [2, 3]
    }
  };
  window.MAP_TEMPLATES = MAP_TEMPLATES;

  // ---------------------------------------------------------------------------
  // Game State Engine
  // ---------------------------------------------------------------------------
  class BeastsGame {
    constructor() {
      this.VERSION = '1.42';
      this.currentMap = MAP_TEMPLATES.standard_10x8;
      this.COLS = this.currentMap.cols;
      this.ROWS = this.currentMap.rows;
      this.round = 1;
      this.currentTeam = 1; // 1 = Solar (Player), 2 = Lunar (AI or Hotseat)
      this.mode = 'ai'; // 'ai' or 'hotseat'
      this.units = [];
      this.hazards = {}; // key: `${x},${y}` -> { type, ownerTeam, duration }
      this.selectedUnit = null;
      this.actionMode = null; // 'move', 'atk1', 'atk2', 'ability'
      this.isAiThinking = false;
      this.currentChallenger = null;

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

      // Start in the Open-World Courtyard by default
      this.currentView = 'overworld'; // 'overworld' | 'arena'
      if (window.MythosOverworld) {
        this.overworld = new window.MythosOverworld((challenger, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) => {
          this.enterMythosArena(challenger, mapId, customPlayerTeam, customOpponentTeam);
        });
      } else {
        this.enterMythosArena();
      }
    }

    // Switch between Arena Maps (Standard 10x8 or Base2v2 6x6)
    setMap(mapId = 'standard_10x8') {
      const mapData = MAP_TEMPLATES[mapId] || MAP_TEMPLATES.standard_10x8;
      this.currentMap = mapData;
      this.COLS = mapData.cols;
      this.ROWS = mapData.rows;

      const boardGrid = document.getElementById('board-grid');
      if (boardGrid) {
        boardGrid.className = `board-grid ${mapData.cssClass}`;
        boardGrid.style.setProperty('--board-cols', mapData.cols);
        boardGrid.style.setProperty('--board-rows', mapData.rows);
        boardGrid.style.setProperty('--board-aspect', mapData.aspectRatio);
        boardGrid.style.setProperty('--board-aspect-multiplier', mapData.aspectMultiplier);
        const bgImg = boardGrid.querySelector('.board-bg');
        if (bgImg) {
          bgImg.src = mapData.bgImg;
          bgImg.alt = mapData.name;
        }
      }

      this.initBoard();
    }

    // Switch from Overworld into the Mythos Tabletop Minigame
    enterMythosArena(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) {
      this.currentView = 'arena';
      this.currentChallenger = challenger;
      this._parkTourneyMatchRecorded = false;
      if (this.overworld) this.overworld.active = false;

      const rematchBtn = document.getElementById('btn-rematch');
      if (rematchBtn) rematchBtn.classList.remove('hidden');
      const returnOverworldBtn = document.getElementById('btn-return-overworld');
      if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🌲 Return to Overworld';

      this.setMap(mapId);

      document.getElementById('overworld-view')?.classList.add('hidden');
      document.getElementById('overworld-toolbar')?.classList.add('hidden');
      document.getElementById('arena-view')?.classList.remove('hidden');
      document.getElementById('arena-turn-tracker')?.classList.remove('hidden');
      document.querySelectorAll('.arena-only-ctrl').forEach(el => el.classList.remove('hidden'));

      const is2v2 = mapId === 'Base2v2';
      const tourneyCtx = challenger?.tournamentContext;
      const sub = document.getElementById('header-subtitle');
      if (sub) {
        if (tourneyCtx?.type === 'park_monday_rr') {
          sub.textContent = `Monday Central Park Casual (Round ${tourneyCtx.round || 1}/3) vs. ${challenger.name}`;
        } else if (challenger?.id === 'pluto') {
          sub.textContent = is2v2 
            ? 'Tabletop 2v2 vs. Pluto ($1.00 Wager Match on Base2v2)'
            : 'Tabletop Duel vs. Pluto ($1.00 Wager Match)';
        } else if (challenger) {
          sub.textContent = is2v2
            ? `Tabletop 2v2 vs. ${challenger.name} (Base2v2)`
            : `Tabletop Duel vs. ${challenger.name}`;
        } else {
          sub.textContent = is2v2 ? 'Base2v2 Tactical 2v2 Arena' : 'Tactical Tabletop Arena';
        }
      }

      const switchBtn = document.getElementById('btn-switch-view');
      if (switchBtn) switchBtn.innerHTML = '🗺️ Return to World';

      if (is2v2) {
        // Fast 2v2 Match on Base2v2
        let playerTeam = (customPlayerTeam && customPlayerTeam.length >= 2)
          ? customPlayerTeam.slice(0, 2)
          : null;

        if (!playerTeam) {
          // Fallback to cards in inventory or binder
          const invCards = (this.overworld?.inventory || [])
            .filter(i => i.type === 'mythos_card' && (i.beastId || i.id.startsWith('card_')))
            .map(i => i.beastId || i.id.replace('card_', ''))
            .filter(id => BEAST_TEMPLATES[id]);

          const binderCards = (this.overworld?.binderSlots || [])
            .filter(c => c && (c.beastId || (c.id && c.id.startsWith('card_'))))
            .map(c => c.beastId || c.id.replace('card_', ''))
            .filter(id => BEAST_TEMPLATES[id]);

          const allPlayerBeasts = Array.from(new Set([...invCards, ...binderCards]));
          playerTeam = allPlayerBeasts.length >= 2 ? allPlayerBeasts.slice(0, 2) : ['phoenix', 'earth_golem'];
        }

        const remainingPool = ['phoenix', 'earth_golem', 'werewolf', 'hydra', 'terra_mother', 'verdant_guardian', 'dwarf_warden', 'pegasus']
          .filter(id => !playerTeam.includes(id));
        const opponentTeam = (customOpponentTeam && customOpponentTeam.length >= 2)
          ? customOpponentTeam.slice(0, 2)
          : (remainingPool.length >= 2 ? remainingPool.slice(0, 2) : ['werewolf', 'hydra']);

        this.draftState.active = false;
        this.draftState.team1Picks = playerTeam;
        this.draftState.team2Picks = opponentTeam;
        this.finalizeDraftAndStartMatch();

        const pNames = playerTeam.map(id => BEAST_TEMPLATES[id]?.name || id).join(' & ');
        const oNames = opponentTeam.map(id => BEAST_TEMPLATES[id]?.name || id).join(' & ');
        if (challenger?.id === 'pluto') {
          this.log(`🃏 Pluto accepted your $1.00 wager on Base2v2! [${pNames}] vs [${oNames}]! Win: +$1.00, Lose: -$1.00!`, 'system');
        } else {
          this.log(`🏟️ Base2v2 match begun! Solar Team [${pNames}] vs Lunar Team [${oNames}].`, 'system');
        }
        return;
      }

      // If challenged by Mike or AJ after opening your booster pack, use the 3 cards you pulled in your inventory or binder!
      const invCards = (this.overworld?.inventory || [])
        .filter(i => i.type === 'mythos_card' && (i.beastId || i.id.startsWith('card_')))
        .map(i => i.beastId || i.id.replace('card_', ''))
        .filter(id => BEAST_TEMPLATES[id]);

      const binderCards = (this.overworld?.binderSlots || [])
        .filter(c => c && (c.beastId || (c.id && c.id.startsWith('card_'))))
        .map(c => c.beastId || c.id.replace('card_', ''))
        .filter(id => BEAST_TEMPLATES[id]);

      const allPlayerBeasts = Array.from(new Set([...invCards, ...binderCards]));

      if (challenger && (allPlayerBeasts.length >= 3 || (customPlayerTeam && customPlayerTeam.length >= 3))) {
        const playerTeam = (customPlayerTeam && customPlayerTeam.length >= 3)
          ? customPlayerTeam.slice(0, 3)
          : allPlayerBeasts.slice(0, 3);
        const remainingPool = ['phoenix', 'earth_golem', 'werewolf', 'hydra', 'terra_mother', 'verdant_guardian', 'dwarf_warden', 'pegasus']
          .filter(id => !playerTeam.includes(id));
        const opponentTeam = (customOpponentTeam && customOpponentTeam.length >= 3)
          ? customOpponentTeam.slice(0, 3)
          : (remainingPool.length >= 3 ? remainingPool.slice(0, 3) : ['werewolf', 'hydra', 'earth_golem']);

        this.draftState.active = false;
        this.draftState.team1Picks = playerTeam;
        this.draftState.team2Picks = opponentTeam;
        this.finalizeDraftAndStartMatch();
        if (challenger?.tournamentContext?.type === 'park_monday_rr') {
          this.log(`🏆 Oakhaven Central Park Monday Casual — Round ${challenger.tournamentContext.round || 1} vs. ${challenger.name}!`, 'system');
        } else if (challenger.id === 'pluto') {
          this.log(`🃏 Pluto accepted your $1.00 wager match at Pluto's House! Win: +$1.00, Lose: -$1.00!`, 'system');
        } else {
          this.log(`🃏 ${challenger.name} challenged you at ${challenger.name}'s House using the 3 cards from your Booster Packs!`, 'system');
        }
      } else {
        this.openDraftModal();
      }
    }

    // Switch from Mythos Tabletop Minigame back to the Open World
    returnToOverworld() {
      this.currentView = 'overworld';
      this.draftState.active = false;
      document.getElementById('draft-modal')?.classList.add('hidden');
      document.getElementById('coin-toss-modal')?.classList.add('hidden');
      this.elWinnerModal?.classList.add('hidden');
      document.getElementById('btn-rematch')?.classList.remove('hidden');
      const returnOverworldBtn = document.getElementById('btn-return-overworld');
      if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🌲 Return to Overworld';

      document.getElementById('arena-view')?.classList.add('hidden');
      document.getElementById('arena-turn-tracker')?.classList.add('hidden');
      document.querySelectorAll('.arena-only-ctrl').forEach(el => el.classList.add('hidden'));

      document.getElementById('overworld-view')?.classList.remove('hidden');
      document.getElementById('overworld-toolbar')?.classList.remove('hidden');

      const sub = document.getElementById('header-subtitle');
      if (sub) sub.textContent = 'Open-World Card RPG';

      const switchBtn = document.getElementById('btn-switch-view');
      if (switchBtn) switchBtn.innerHTML = '🃏 Quick Duel';

      if (this.overworld) {
        this.overworld.active = true;
        this.overworld.onReturnFromBattle(this.currentChallenger);
      }
      this.currentChallenger = null;
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

    // Spawn beasts (2v2 or 3v3) from draft picks or selection
    initUnits(team1Picks = ['phoenix', 'earth_golem'], team2Picks = ['werewolf', 'hydra']) {
      const spawnRows = this.currentMap?.spawnRows || (this.ROWS === 6 ? [2, 3] : [2, 3, 4]);
      const enemySpawnX = this.COLS - 1;
      this.units = [];

      team1Picks.forEach((tmplId, idx) => {
        const y = spawnRows[idx] !== undefined ? spawnRows[idx] : Math.min(this.ROWS - 1, 1 + idx);
        this.units.push(this.createUnitInstance(tmplId, 1, 0, y));
      });

      team2Picks.forEach((tmplId, idx) => {
        const y = spawnRows[idx] !== undefined ? spawnRows[idx] : Math.min(this.ROWS - 1, 1 + idx);
        this.units.push(this.createUnitInstance(tmplId, 2, enemySpawnX, y));
      });
    }

    createUnitInstance(templateId, team, x, y) {
      const tmpl = BEAST_TEMPLATES[templateId];
      let maxHp = tmpl.maxHp;
      let baseMove = tmpl.baseMove;

      // Weekly Calendar Active Event Battle Modifiers
      const activeEvent = this.overworld?.getCurrentDayEvent?.();
      if (activeEvent?.id === 'botanical_bloom') {
        // Thursday: Maya's Botanical Bloom - +15 Max HP to Earth / Nature beasts
        if (tmpl.element?.toLowerCase() === 'earth' || templateId === 'earth_golem') {
          maxHp += 15;
        }
      } else if (activeEvent?.id === 'stargazer_astronomy') {
        // Sunday: Nova's Stargazer Astronomy - +1 Move Range to Celestial / Flying beasts
        if (tmpl.element?.toLowerCase() === 'celestial' || templateId === 'phoenix' || templateId === 'pegasus') {
          baseMove += 1;
        }
      }

      return {
        ...tmpl,
        instanceId: `${templateId}_${team}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        team: team,
        x: x,
        y: y,
        hp: maxHp,
        maxHp: maxHp,
        shield: 0,
        baseMove: baseMove,
        movesLeft: baseMove,
        hasActed: false,
        facing: team === 1 ? 'right' : 'left',
        animState: 'idle',
        stationaryTurns: 0,
        hasMovedThisTurn: false,
        status: {
          immobilized: 0,
          howlBuff: 0,
          poisoned: 0,
          tookDamageLastTurn: false,
          bullwark: false,
          bullwarkCooldown: 0,
          fortressCooldown: 0,
          fortressSelf: false,
          guardedByDreadnaught: null
        }
      };
    }

    // -------------------------------------------------------------------------
    // Event Listeners & UI Binding
    // -------------------------------------------------------------------------
    isSkillPassive(skill) {
      if (!skill) return false;
      return skill.type === 'passive' || skill.type === 'passive_ram';
    }

    bindEvents() {
      // Ability buttons
      document.getElementById('btn-move').addEventListener('click', () => this.setActionMode('move'));
      document.getElementById('btn-atk1').addEventListener('click', () => {
        const u = this.selectedUnit;
        if (u && this.isSkillPassive(u.skills.atk1)) return;
        this.setActionMode('atk1');
      });
      document.getElementById('btn-atk2').addEventListener('click', () => {
        const u = this.selectedUnit;
        if (!u || this.isSkillPassive(u.skills.atk2)) return;
        const isSelfTargeting = u.skills.atk2.type === 'counter_stance' || u.skills.atk2.type === 'self_move' || u.skills.atk2.type === 'aoe_hazard' || u.skills.atk2.type === 'bullwark_stance' || u.skills.atk2.type === 'inspire';
        const isLoneFortress = u.skills.atk2.type === 'fortress_guard' && this.units.filter(a => a.team === u.team && a.hp > 0 && a !== u).length === 0;
        if (isSelfTargeting || isLoneFortress) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        } else {
          this.setActionMode('atk2');
        }
      });
      document.getElementById('btn-ability').addEventListener('click', () => {
        const u = this.selectedUnit;
        if (!u || this.isSkillPassive(u.skills.ability)) return;
        if (u.skills.ability.type === 'team_buff') {
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
      document.getElementById('btn-return-overworld')?.addEventListener('click', () => this.returnToOverworld());
      document.getElementById('btn-switch-view')?.addEventListener('click', () => {
        if (this.currentView === 'overworld') {
          this.enterMythosArena();
        } else {
          this.returnToOverworld();
        }
      });
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
        if (this.currentView !== 'arena' || (this.draftState && this.draftState.active)) return;
        if (e.key === 'Enter' || e.key === ' ') {
          this.endTurn();
        } else if (e.key === '1') {
          this.setActionMode('move');
        } else if (e.key === '2') {
          const u = this.selectedUnit;
          if (u && !this.isSkillPassive(u.skills.atk1)) this.setActionMode('atk1');
        } else if (e.key === '3') {
          const u = this.selectedUnit;
          if (u && !this.isSkillPassive(u.skills.atk2)) {
            const isSelfTargeting = u.skills.atk2.type === 'counter_stance' || u.skills.atk2.type === 'self_move' || u.skills.atk2.type === 'aoe_hazard' || u.skills.atk2.type === 'bullwark_stance' || u.skills.atk2.type === 'inspire';
            const isLoneFortress = u.skills.atk2.type === 'fortress_guard' && this.units.filter(a => a.team === u.team && a.hp > 0 && a !== u).length === 0;
            if (isSelfTargeting || isLoneFortress) {
              this.attemptAttack(u, 'atk2', u.x, u.y);
            } else {
              this.setActionMode('atk2');
            }
          }
        } else if (e.key === '4') {
          const u = this.selectedUnit;
          if (u && !this.isSkillPassive(u.skills.ability)) {
            if (u.skills.ability.type === 'team_buff') {
              this.attemptAbility(u, u.x, u.y);
            } else {
              this.setActionMode('ability');
            }
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
      if (unit.status.bullwark) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🛡️ Bullwark (Active)</span>`;
      } else if (unit.status.bullwarkCooldown > 0) {
        buffContainer.innerHTML += `<span class="buff-badge debuff">⏳ Bullwark (${unit.status.bullwarkCooldown}t cd)</span>`;
      }
      if (unit.id === 'dwarf_warden' && this.round > 10) {
        buffContainer.innerHTML += `<span class="buff-badge buff">💪 Endurance (50% Dmg Reduction)</span>`;
      }
      if (unit.status.fortressSelf) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🛡️ Fortress Self (Active)</span>`;
      } else if (unit.status.fortressCooldown > 0) {
        buffContainer.innerHTML += `<span class="buff-badge debuff">⏳ Fortress (${unit.status.fortressCooldown}t cd)</span>`;
      }
      if (unit.status.guardedByDreadnaught) {
        buffContainer.innerHTML += `<span class="buff-badge buff">🛡️ Fortress Guarded</span>`;
      }
      if (unit.id === 'dreadnaught') {
        const livingAllies = this.units.filter(a => a.team === unit.team && a.hp > 0 && a !== unit);
        if (livingAllies.length === 0) {
          buffContainer.innerHTML += `<span class="buff-badge buff">🔥 Burning Heart (35 Dmg Fist + Self Fortress)</span>`;
        }
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

      const atk1Passive = u ? this.isSkillPassive(u.skills.atk1) : false;
      const atk2Passive = u ? this.isSkillPassive(u.skills.atk2) : false;
      const abilityPassive = u ? this.isSkillPassive(u.skills.ability) : false;

      btnMove.disabled = !isMyTurn || u.movesLeft <= 0 || u.status.immobilized > 0;
      btnAtk1.disabled = !isMyTurn || u.hasActed || atk1Passive;
      btnAtk2.disabled = !isMyTurn || u.hasActed || atk2Passive;
      btnAbility.disabled = !isMyTurn || u.hasActed || abilityPassive;

      if (u && u.id === 'dwarf_warden') {
        if (u.status.bullwarkCooldown > 0) {
          btnAtk2.disabled = true;
          btnAtk2.title = `Bullwark on cooldown (${u.status.bullwarkCooldown} turns remaining)`;
        } else if (u.status.bullwark) {
          btnAtk2.disabled = true;
          btnAtk2.title = 'Bullwark is currently active';
        }
      }

      if (u && u.id === 'dreadnaught') {
        if (u.status.fortressCooldown > 0) {
          btnAtk2.disabled = true;
          btnAtk2.title = `Fortress on cooldown (${u.status.fortressCooldown} turns remaining)`;
        } else if (u.status.fortressSelf) {
          btnAtk2.disabled = true;
          btnAtk2.title = 'Fortress Self is currently active';
        }
      }

      btnAtk1.classList.toggle('is-passive', atk1Passive);
      btnAtk2.classList.toggle('is-passive', atk2Passive);
      btnAbility.classList.toggle('is-passive', abilityPassive);

      // Tooltips indicating passive or active
      btnAtk1.title = atk1Passive ? `${u.skills.atk1.name} (Passive - Triggers automatically)` : '';
      btnAtk2.title = atk2Passive ? `${u.skills.atk2.name} (Passive - Triggers automatically)` : '';
      btnAbility.title = abilityPassive ? `${u.skills.ability.name} (Passive - Triggers automatically)` : '';

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

          // Terra-Mother Ram: After Terra-Mother moves, hostiles in front of her are knocked back 2 tiles!
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
              for (let k = 1; k <= 2; k++) {
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
                // Apply 25 Ram damage
                const ramDmg = 25;
                target.hp = Math.max(0, target.hp - ramDmg);
                target.animState = 'hurt';
                target.status.tookDamageLastTurn = true;
                this.spawnFloatingText(target.x, target.y, `-${ramDmg} RAMMED!`, 'damage');
                this.log(`💥 Ram: Terra-Mother rammed ${target.name} for 25 damage, knocking them back ${pushedTiles} tiles! (${target.hp}/${target.maxHp} HP)`, 'attack');
                if (target.hp <= 0) {
                  this.handleUnitDefeat(target);
                }
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

          // Check if landed on Magma Tile ("Any creature in that magma not of fire type receives 10 damage each turn")
          if (hazardHere && hazardHere.type === 'magma' && unit.element !== 'fire') {
            unit.hp = Math.max(0, unit.hp - 10);
            if (window.sounds?.playFire) window.sounds.playFire();
            this.spawnFloatingText(unit.x, unit.y, '-10 MAGMA', 'damage');
            this.log(`🌋 ${unit.name} stepped into boiling magma taking 10 heat damage!`, 'attack');
            if (unit.hp <= 0) {
              this.handleUnitDefeat(unit);
            }
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
            if (unit.hp <= 0) {
              this.handleUnitDefeat(unit);
            }
          }

          // Check if landed on Thorn Bush Tile (Verdant Guardian Thorn Bush)
          if (hazardHere && hazardHere.type === 'thorn_bush' && unit.element !== 'plant') {
            unit.hp = Math.max(0, unit.hp - 10);
            window.sounds.playHit();
            this.spawnFloatingText(unit.x, unit.y, '-10 THORN BUSH', 'damage');
            this.log(`${unit.name} stepped into a dense thorn bush taking 10 nature damage!`, 'attack');
            if (unit.hp <= 0) {
              this.handleUnitDefeat(unit);
            }
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
          const unitObstacle = this.getUnitAt(x, y);
          const hazard = this.getHazardAt(x, y);
          const isBlockedByBarrier = hazard && hazard.type === 'rock_barrier' && unit.element !== 'earth';
          // Can only land on a free, unobstructed tile
          if (!unitObstacle && !isBlockedByBarrier) {
            moves.push({ x, y });
          }
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
                const unitObstacle = this.getUnitAt(n.x, n.y);
                const hazard = this.getHazardAt(n.x, n.y);
                const isBlockedByBarrier = hazard && hazard.type === 'rock_barrier' && unit.element !== 'earth';

                // Pegasus Ability: Soar — can pass over tiles with blocks or beasts as long as landing on a free tile
                if (unit.id === 'pegasus') {
                  queue.push({ x: n.x, y: n.y, dist: dist + 1 });
                } else if (!unitObstacle && !isBlockedByBarrier) {
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

              // Pegasus Ability: Soar — flies freely over obstacles/blocks en route to destination
              const canPass = (unit.id === 'pegasus') || ((!unitObstacle || (n.x === targetX && n.y === targetY)) && !isBlockedByBarrier);
              if (canPass) {
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
        this.log(`🐍 Hydra's Regrowth is passive: If damaged, it regains 10 HP at beginning of next turn.`, 'system');
        return;
      }

      // Special Terra-Mother Move 2: RAM (Passive Check)
      if (skill.type === 'passive_ram') {
        this.spawnFloatingText(unit.x, unit.y, 'RAM PASSIVE', 'status');
        this.log(`💥 Terra-Mother's Ram is passive: After moving, hostiles in front of her are knocked back 2 tiles!`, 'system');
        return;
      }

      // Special Dwarf Warden Move 2: BULLWARK ("Fully negates an incoming attack. (5 turn cooldown)")
      if (skill.type === 'bullwark_stance') {
        if (unit.status.bullwark) {
          this.spawnFloatingText(unit.x, unit.y, 'ALREADY ACTIVE!', 'status');
          return;
        }
        if (unit.status.bullwarkCooldown > 0) {
          this.spawnFloatingText(unit.x, unit.y, `COOLDOWN (${unit.status.bullwarkCooldown}t)`, 'status');
          return;
        }

        unit.status.bullwark = true;
        unit.status.bullwarkCooldown = skill.cooldown || 5;
        window.sounds.playRock();
        unit.animState = 'attack_aoe';
        unit.hasActed = true;
        this.spawnFloatingText(unit.x, unit.y, 'BULLWARK ACTIVE!', 'status');
        this.log(`🛡️ ${unit.name} braces behind his runic shield with Bullwark! Next incoming attack will be fully negated (5-turn cooldown).`, 'barrier');
        this.finishAction(unit);
        return;
      }

      // Special Dwarf Warden Move 1: HAMMER THROW ("Damages the 2 tiles in front of Dwarf Warden for 25 damage each.")
      if (skill.type === 'line_pierce') {
        let dx = 0;
        let dy = 0;
        if (targetX > unit.x) dx = 1;
        else if (targetX < unit.x) dx = -1;
        else if (targetY > unit.y) dy = 1;
        else if (targetY < unit.y) dy = -1;

        if (dx === 1) unit.facing = 'right';
        else if (dx === -1) unit.facing = 'left';
        else if (dy === 1) unit.facing = 'down';
        else if (dy === -1) unit.facing = 'up';

        unit.animState = 'attack';
        window.sounds.playRock();

        let damage = skill.dmg || 25;
        if (unit.status.howlBuff > 0) {
          damage += 10;
          this.log(`🐺 Howl boost amplified Hammer Throw by +10!`, 'system');
        }

        let enemiesHit = 0;
        for (let step = 1; step <= (skill.range || 2); step++) {
          const tx = unit.x + dx * step;
          const ty = unit.y + dy * step;
          if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
            this.spawnFloatingText(tx, ty, '🔨', 'status');
            const targetUnit = this.getUnitAt(tx, ty);
            if (targetUnit && targetUnit.team !== unit.team && targetUnit.hp > 0) {
              enemiesHit++;
              targetUnit.animState = 'hurt';
              this.dealDamage(targetUnit, damage, `${unit.name} (Hammer Throw)`, unit);
            }
          }
        }

        this.spawnFloatingText(unit.x, unit.y, 'HAMMER THROW!', 'status');
        this.log(`🔨 ${unit.name} hurled his warhammer! Pierced 2 tiles dealing ${damage} damage each (Hit ${enemiesHit} enemies).`, 'attack');
        unit.hasActed = true;
        this.finishAction(unit);
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

      // Special Verdant Guardian Move 2: THORN BUSH (Instant AOE attack on adjacent enemies)
      if (skill.type === 'aoe_hazard' && unit.id === 'verdant_guardian') {
        unit.animState = 'attack_aoe';
        if (window.sounds.playWhip) window.sounds.playWhip();
        else window.sounds.playHit();

        const isSaplingActive = unit.hp <= Math.floor(unit.maxHp / 4);
        let baseDmg = skill.dmg || 10;
        if (isSaplingActive) {
          baseDmg *= 2;
          this.log(`🌿 Sapling Strength active! Thorn Bush damage doubled to ${baseDmg}!`, 'system');
        }
        if (unit.status.howlBuff > 0) {
          baseDmg += 10;
          this.log(`🐺 Howl boost amplified Thorn Bush by +10!`, 'system');
        }

        let enemiesHit = 0;
        const directions = [
          { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
          { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
        ];

        directions.forEach(d => {
          const tx = unit.x + d.x;
          const ty = unit.y + d.y;
          if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
            // Spawn temporary visual burst (does not persist across turns)
            this.spawnThornBurst(tx, ty);

            // Strike ONLY enemy beasts
            const targetUnit = this.getUnitAt(tx, ty);
            if (targetUnit && targetUnit.team !== unit.team) {
              enemiesHit++;
              targetUnit.animState = 'hurt';
              this.dealDamage(targetUnit, baseDmg, `${unit.name} (Thorn Bush)`, unit);
            }
          }
        });

        this.spawnFloatingText(unit.x, unit.y, isSaplingActive ? 'THORN BUSH (x2 DMG!)' : 'THORN BUSH!', 'status');
        this.log(`🌿 ${unit.name} unleashed Thorn Bush! Hit ${enemiesHit} opposing enemies for ${baseDmg} nature damage.`, 'attack');
        unit.hasActed = true;
        this.finishAction(unit);
        return;
      }

      // Special Pegasus Move 2: INSPIRE (Gives up Pegasus's movement to extend all allies' movement by 2 tiles)
      if (skill.type === 'inspire' || (unit.id === 'pegasus' && skillKey === 'atk2')) {
        unit.animState = 'attack_aoe';
        if (window.sounds?.playHowl) window.sounds.playHowl();
        else window.sounds.playMove();

        unit.movesLeft = 0;
        const allies = this.units.filter(u => u.team === unit.team && u.hp > 0 && u !== unit);
        allies.forEach(ally => {
          ally.movesLeft += 2;
          this.spawnFloatingText(ally.x, ally.y, '+2 MOVE (INSPIRED)', 'status');
          this.log(`✨ ${ally.name} gained +2 Movement from Pegasus's Inspire! (${ally.movesLeft} moves ready)`, 'system');
        });

        this.spawnFloatingText(unit.x, unit.y, 'INSPIRE!', 'status');
        this.log(`✨ ${unit.name} used Inspire! Sacrificed remaining movement to extend ${allies.length} allies' movement by +2 tiles.`, 'attack');
        unit.hasActed = true;
        this.finishAction(unit);
        return;
      }

      // Special Dreadnaught Move 2: FORTRESS ("Blocks for an ally within 3x3. Dreadnaught receives damage. 4t cooldown.")
      if (skill.type === 'fortress_guard' || (unit.id === 'dreadnaught' && skillKey === 'atk2')) {
        if (unit.status.fortressCooldown > 0) {
          this.spawnFloatingText(unit.x, unit.y, `COOLDOWN (${unit.status.fortressCooldown}t)`, 'status');
          return;
        }

        const livingAllies = this.units.filter(u => u.team === unit.team && u.hp > 0 && u !== unit);
        if (livingAllies.length === 0 && targetX === unit.x && targetY === unit.y) {
          // Burning Heart: Can use Fortress on self!
          unit.status.fortressSelf = true;
          unit.status.fortressCooldown = skill.cooldown || 4;
          unit.animState = 'fortress';
          unit.hasActed = true;
          if (window.sounds?.playRock) window.sounds.playRock();
          this.spawnFloatingText(unit.x, unit.y, 'FORTRESS LOCKDOWN!', 'status');
          this.log(`🛡️ Burning Heart: Lone Dreadnaught fortifies itself, deflecting incoming attacks this round! (4-turn cooldown)`, 'barrier');
          this.finishAction(unit);
          return;
        }

        const allyTarget = this.getUnitAt(targetX, targetY);
        if (allyTarget && allyTarget.team === unit.team && allyTarget !== unit) {
          allyTarget.status.guardedByDreadnaught = unit.instanceId;
          unit.status.fortressCooldown = skill.cooldown || 4;
          unit.animState = 'fortress';
          unit.hasActed = true;
          if (window.sounds?.playRock) window.sounds.playRock();
          this.spawnFloatingText(allyTarget.x, allyTarget.y, 'FORTRESS GUARDED', 'status');
          this.spawnFloatingText(unit.x, unit.y, 'INTERCEPTING FOR ' + allyTarget.name.toUpperCase(), 'status');
          this.log(`🛡️ Fortress: Dreadnaught establishes guard over ${allyTarget.name}! Dreadnaught will intercept all damage dealt to ${allyTarget.name} for 1 turn (4-turn cooldown).`, 'barrier');
          this.finishAction(unit);
          return;
        }
        return;
      }

      // Special Dreadnaught Move 1: MAGMA FIST ("25 damage, creates a permanent pool of magma. If all allies defeated, 35 damage.")
      if (skill.type === 'target_magma' || (unit.id === 'dreadnaught' && skillKey === 'atk1')) {
        const targetUnit = this.getUnitAt(targetX, targetY);
        if (!targetUnit || targetUnit.team === unit.team) return;

        const livingAllies = this.units.filter(u => u.team === unit.team && u.hp > 0 && u !== unit);
        const isBurningHeart = livingAllies.length === 0;
        let damage = isBurningHeart ? 35 : (skill.dmg || 25);

        if (unit.status.howlBuff > 0) {
          damage += 10;
          this.log(`🐺 Howl boost amplified Magma Fist by +10!`, 'system');
        }

        if (targetX > unit.x) unit.facing = 'right';
        else if (targetX < unit.x) unit.facing = 'left';
        else if (targetY > unit.y) unit.facing = 'down';
        else if (targetY < unit.y) unit.facing = 'up';

        unit.animState = 'attack_magma_fist';
        targetUnit.animState = 'hurt';
        if (window.sounds?.playFire) window.sounds.playFire();
        if (window.sounds?.playHit) window.sounds.playHit();

        this.dealDamage(targetUnit, damage, `${unit.name} (Magma Fist)`, unit);

        // Spawn permanent pool of magma on the tile
        this.addHazard(targetX, targetY, 'magma', Infinity);
        this.spawnFloatingText(targetX, targetY, 'MAGMA POOL', 'status');
        this.log(`🌋 ${unit.name} strikes with Magma Fist dealing ${damage} damage${isBurningHeart ? ' (Burning Heart Boost!)' : ''} and creates a permanent pool of boiling Magma!`, 'attack');

        unit.hasActed = true;
        this.finishAction(unit);
        return;
      }

      const targetUnit = this.getUnitAt(targetX, targetY);
      if (!targetUnit || targetUnit.team === unit.team) return;

      // Calculate Damage (+10 Howl buff if active)
      let damage = skill.dmg || 20;

      // Verdant Guardian Passive: Sapling Strength (Double damage at <= 1/4 HP / <= 40 HP)
      if (unit.id === 'verdant_guardian' && unit.hp <= Math.floor(unit.maxHp / 4)) {
        damage *= 2;
        this.log(`🌿 Sapling Strength active! Attack damage doubled to ${damage}!`, 'system');
      }

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
      else if (unit.id === 'verdant_guardian') {
        if (window.sounds.playWhip) window.sounds.playWhip();
        else window.sounds.playHit();
      }

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

      // Verdant Guardian Ability: SAPLING STRENGTH
      if (unit.id === 'verdant_guardian') {
        const isSaplingActive = unit.hp <= Math.floor(unit.maxHp / 4);
        this.spawnFloatingText(unit.x, unit.y, isSaplingActive ? 'SAPLING STRENGTH ACTIVE!' : 'SAPLING STRENGTH (PASSIVE)', 'status');
        this.log(`🌿 Verdant Guardian Ability — Sapling Strength: At 1/4 health or below (<= 40 HP), attack moves deal doubled damage. Current Status: ${isSaplingActive ? 'ACTIVE (x2 DMG)' : `Inactive (${unit.hp}/${unit.maxHp} HP)`}.`, 'system');
        return;
      }

      // Dwarf Warden Ability: ENDURANCE (Passive. After turn 10 he takes 1/2 damage)
      if (unit.id === 'dwarf_warden') {
        const isEnduranceActive = this.round > 10;
        this.spawnFloatingText(unit.x, unit.y, isEnduranceActive ? 'ENDURANCE ACTIVE (1/2 DMG)' : 'ENDURANCE (AFTER TURN 10)', 'status');
        this.log(`💪 Dwarf Warden Ability — Endurance: Passive. After turn 10, takes half damage from all incoming attacks. Current Round: ${this.round} (${isEnduranceActive ? 'ACTIVE: 1/2 Damage' : 'Activates in Round 11'}).`, 'system');
        return;
      }
    }

    dealDamage(target, amount, sourceName, attacker = null) {
      // Dreadnaught Fortress Self (Burning Heart Lone Survivor Shield)
      if (target.id === 'dreadnaught' && target.status.fortressSelf) {
        if (window.sounds?.playRock) window.sounds.playRock();
        target.animState = 'fortress';
        this.spawnFloatingText(target.x, target.y, 'FORTRESS DEFLECTED!', 'status');
        this.log(`🛡️ Fortress! Lone Dreadnaught completely deflected incoming ${amount} damage from ${sourceName}!`, 'barrier');
        this.renderUnits();
        this.updateCardDossier(target);
        setTimeout(() => {
          if (target.hp > 0 && target.animState === 'fortress') {
            target.animState = 'idle';
            this.renderUnits();
          }
        }, 600);
        return;
      }

      // Dreadnaught Fortress Interception ("Dreadnaught receives any damage that would be taken by that ally for a turn")
      if (target.status.guardedByDreadnaught) {
        const dread = this.units.find(u => u.instanceId === target.status.guardedByDreadnaught && u.hp > 0);
        if (dread) {
          this.spawnFloatingText(target.x, target.y, 'INTERCEPTED!', 'status');
          this.log(`🛡️ Fortress: Dreadnaught intercepts and absorbs ${amount} damage meant for ${target.name}!`, 'barrier');
          this.dealDamage(dread, amount, `${sourceName} (Intercepted for ${target.name})`, attacker);
          return;
        } else {
          target.status.guardedByDreadnaught = null;
        }
      }

      // Dwarf Warden Bullwark: Fully negate an incoming attack!
      if (target.id === 'dwarf_warden' && target.status.bullwark) {
        target.status.bullwark = false;
        target.animState = 'attack_aoe';
        window.sounds.playRock();
        this.spawnFloatingText(target.x, target.y, 'BULLWARK NEGATED!', 'status');
        this.log(`🛡️ Bullwark! Dwarf Warden completely negated the incoming ${amount} damage from ${sourceName}!`, 'barrier');
        this.renderUnits();
        this.updateCardDossier(target);
        setTimeout(() => {
          if (target.hp > 0 && target.animState === 'attack_aoe') {
            target.animState = 'idle';
            this.renderUnits();
          }
        }, 600);
        return;
      }

      let remaining = amount;

      // Dwarf Warden Ability: Endurance (After turn 10 he takes 1/2 damage)
      if (target.id === 'dwarf_warden' && this.round > 10) {
        const originalDmg = remaining;
        remaining = Math.ceil(remaining / 2);
        this.log(`💪 Endurance active! ${target.name} halved incoming damage from ${originalDmg} to ${remaining}!`, 'system');
      }
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
      if (skill.range === 0 || skill.type === 'counter_stance' || skill.type === 'self_move' || skill.type === 'passive' || skill.type === 'aoe_hazard' || skill.type === 'bullwark_stance') {
        return [{ x: unit.x, y: unit.y }];
      }

      // Fortress (Dreadnaught Move 2: Blocks for ally within 3x3 range centered on itself, or self if lone survivor)
      if (skill.type === 'fortress_guard') {
        if (unit.status.fortressCooldown > 0) return [];
        const livingAllies = this.units.filter(u => u.team === unit.team && u.hp > 0 && u !== unit);
        if (livingAllies.length === 0) {
          // Burning Heart: lone survivor can Fortress self!
          return [{ x: unit.x, y: unit.y }];
        }
        const targets = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const tx = unit.x + dx;
            const ty = unit.y + dy;
            if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
              const uAt = this.getUnitAt(tx, ty);
              if (uAt && uAt.team === unit.team && uAt.hp > 0) {
                targets.push({ x: tx, y: ty });
              }
            }
          }
        }
        return targets;
      }

      // Hammer Throw (Dwarf Warden Move 1): Straight-line piercing attack in 4 cardinal directions
      if (skill.type === 'line_pierce') {
        const lineTargets = [];
        const directions = [
          { x: 0, y: -1 }, // Up
          { x: 0, y: 1 },  // Down
          { x: -1, y: 0 }, // Left
          { x: 1, y: 0 }   // Right
        ];
        directions.forEach(d => {
          let hasEnemy = false;
          for (let step = 1; step <= (skill.range || 2); step++) {
            const tx = unit.x + d.x * step;
            const ty = unit.y + d.y * step;
            if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
              const uAt = this.getUnitAt(tx, ty);
              if (uAt && uAt.team !== unit.team && uAt.hp > 0) {
                hasEnemy = true;
              }
            }
          }
          if (hasEnemy) {
            for (let step = 1; step <= (skill.range || 2); step++) {
              const tx = unit.x + d.x * step;
              const ty = unit.y + d.y * step;
              if (tx >= 0 && tx < this.COLS && ty >= 0 && ty < this.ROWS) {
                lineTargets.push({ x: tx, y: ty });
              }
            }
          }
        });
        return lineTargets;
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

        // Decrement Bullwark Cooldown for Dwarf Warden
        if (u.status.bullwarkCooldown > 0) {
          u.status.bullwarkCooldown--;
          if (u.status.bullwarkCooldown === 0) {
            this.log(`🛡️ Bullwark is ready to use again for ${u.name}!`, 'system');
          }
        }

        // Dreadnaught Magma Hazard Check at start of turn ("Any creature in that magma not of fire type receives 10 damage each turn")
        if (hazardHere && hazardHere.type === 'magma' && u.element !== 'fire' && u.hp > 0) {
          u.hp = Math.max(0, u.hp - 10);
          if (window.sounds?.playFire) window.sounds.playFire();
          this.spawnFloatingText(u.x, u.y, '-10 MAGMA', 'damage');
          this.log(`🌋 ${u.name} starts turn standing in boiling magma taking 10 heat damage! (${u.hp}/${u.maxHp} HP)`, 'attack');
          if (u.hp <= 0) {
            this.handleUnitDefeat(u);
          }
        }

        // Decrement Fortress Cooldown for Dreadnaught
        if (u.status.fortressCooldown > 0) {
          u.status.fortressCooldown--;
          if (u.status.fortressCooldown === 0) {
            this.log(`🛡️ Fortress is ready to use again for ${u.name}!`, 'system');
          }
        }

        // Clear fortressSelf at start of its turn
        u.status.fortressSelf = false;

        // Clear guardedByDreadnaught if the protecting Dreadnaught is defeated or has started its new turn
        if (u.status.guardedByDreadnaught) {
          const dread = this.units.find(d => d.instanceId === u.status.guardedByDreadnaught && d.hp > 0);
          if (!dread || dread.team === this.currentTeam) {
            u.status.guardedByDreadnaught = null;
          }
        }

        // Hydra Passives:
        // 1. Regrowth: If Hydra is damaged, it regains 10 HP at the beginning of next turn!
        if (u.id === 'hydra' && u.status.tookDamageLastTurn && u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + 10);
          window.sounds.playHeal();
          this.spawnFloatingText(u.x, u.y, '+10 REGROWTH', 'heal');
          this.log(`Hydra Regrowth triggered: regained 10 HP! (${u.hp}/${u.maxHp})`, 'heal');
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
      // Verdant Guardian: Thorn Bush (AOE) or Branch Whip (20 Dmg)
      else if (u.id === 'verdant_guardian') {
        const enemiesAdj = this.getAdjacentUnits(u.x, u.y).filter(t => t.team !== u.team);
        if (enemiesAdj.length >= 2) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        } else if (dist <= 1) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        } else if (enemiesAdj.length >= 1) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        }
      }
      // Dwarf Warden: Hammer Throw (2 tiles cardinal) or Bullwark stance
      else if (u.id === 'dwarf_warden') {
        const isCardinal = (nearest.x === u.x || nearest.y === u.y);
        if (isCardinal && dist <= 2) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        } else if (!u.status.bullwark && u.status.bullwarkCooldown === 0 && dist <= 3) {
          this.attemptAttack(u, 'atk2', u.x, u.y);
        }
      }
      // Pegasus: Trample (30 Dmg) if in range 1, or Inspire if allies can benefit
      else if (u.id === 'pegasus') {
        if (dist <= 1) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
        } else {
          const allies = this.units.filter(ally => ally.team === u.team && ally.hp > 0 && ally !== u);
          if (allies.length > 0) {
            this.attemptAttack(u, 'atk2', u.x, u.y);
          }
        }
      }
      // Dreadnaught: Magma Fist (25/35 Dmg + Magma pool) or Fortress
      else if (u.id === 'dreadnaught') {
        const livingAllies = this.units.filter(a => a.team === u.team && a.hp > 0 && a !== u);
        if (u.status.fortressCooldown === 0) {
          if (livingAllies.length === 0) {
            // Burning Heart: lone survivor locks down with Fortress on self
            this.attemptAttack(u, 'atk2', u.x, u.y);
            return;
          } else {
            // Find ally within 3x3 to protect
            const alliesInRange = livingAllies.filter(a => Math.abs(a.x - u.x) <= 1 && Math.abs(a.y - u.y) <= 1);
            if (alliesInRange.length > 0) {
              alliesInRange.sort((a, b) => a.hp - b.hp);
              this.attemptAttack(u, 'atk2', alliesInRange[0].x, alliesInRange[0].y);
              return;
            }
          }
        }
        if (dist <= (u.skills.atk1.range || 1)) {
          this.attemptAttack(u, 'atk1', nearest.x, nearest.y);
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
        const isPlayerVictory = team1Alive;
        const winner = isPlayerVictory ? 'Team 1 (Solar)' : 'Team 2 (Lunar)';
        const crest = isPlayerVictory ? '☀️' : '🌙';
        document.getElementById('winner-crest').textContent = crest;
        document.getElementById('winner-title').textContent = `${winner.toUpperCase()} VICTORIOUS!`;

        if (this.currentChallenger && this.currentChallenger.id === 'pluto') {
          const activeEvent = this.overworld?.getCurrentDayEvent?.();
          const plutoWager = activeEvent?.id === 'pluto_double_wager' ? 2.00 : 1.00;
          const plutoWagerStr = plutoWager.toFixed(2);
          const plutoWagerTag = activeEvent?.id === 'pluto_double_wager' ? ' 💰 (Tuesday Double Wager!)' : '';
          if (isPlayerVictory) {
            document.getElementById('winner-message').innerHTML = `
              All of <b>Pluto's</b> mythical beasts were defeated in Round ${this.round}!<br>
              <div style="margin-top: 14px; padding: 12px 16px; background: rgba(34, 197, 94, 0.22); border: 2px solid #22c55e; border-radius: 12px; color: #86efac; text-align: center;">
                💵 <b>+$${plutoWagerStr} WON FROM PLUTO!${plutoWagerTag}</b><br>
                <span style="font-size: 13px; color: #f8fafc;">Pluto: "Well played! You won the wager fair and square — here is your $${plutoWagerStr}!"</span>
              </div>
            `;
            if (this.overworld) {
              this.overworld.handlePlutoBattleResult(true);
            }
          } else {
            document.getElementById('winner-message').innerHTML = `
              <b>Pluto</b> defeated your team in Round ${this.round}!<br>
              <div style="margin-top: 14px; padding: 12px 16px; background: rgba(239, 68, 68, 0.22); border: 2px solid #ef4444; border-radius: 12px; color: #fca5a5; text-align: center;">
                💸 <b>-$${plutoWagerStr} LOST TO PLUTO!${plutoWagerTag}</b><br>
                <span style="font-size: 13px; color: #f8fafc;">Pluto: "Good game! That's $${plutoWagerStr} for the winner! Return to my house for a rematch whenever you're ready."</span>
              </div>
            `;
            if (this.overworld) {
              this.overworld.handlePlutoBattleResult(false);
            }
          }
        } else if (isPlayerVictory && this.currentChallenger?.id === 'maya') {
          const fName = this.currentChallenger.name || 'Maya';
          document.getElementById('winner-message').innerHTML = `
            All of <b>${fName}'s</b> mythical beasts were defeated in Round ${this.round}!<br>
            <div style="margin-top: 14px; padding: 12px 16px; background: rgba(34, 197, 94, 0.15); border: 1.5px solid #4ade80; border-radius: 12px; color: #86efac; text-align: center;">
              🌿 <b>BOTANICAL CONSERVATORY VICTORY</b><br>
              <span style="font-size: 13px; color: #f8fafc;">Maya: "Breathtaking tactics! Your beasts flourished like a wild canopy! Come back to the greenhouse anytime for another friendly match!"</span>
            </div>
          `;
          if (this.overworld) {
            this.overworld.handleMayaBattleResult(true);
          }
        } else if (isPlayerVictory && this.currentChallenger?.id === 'silas') {
          const fName = this.currentChallenger.name || 'Silas';
          document.getElementById('winner-message').innerHTML = `
            All of <b>${fName}'s</b> mythical beasts were defeated in Round ${this.round}!<br>
            <div style="margin-top: 14px; padding: 12px 16px; background: rgba(245, 158, 11, 0.22); border: 2px solid #fbbf24; border-radius: 12px; color: #fde68a; text-align: center;">
              ⚙️ <b>CLOCKWORK ARTISAN REWARD: +$2.00 & Dwarf Warden Foil Card!</b><br>
              <span style="font-size: 13px; color: #f8fafc;">Silas: "Fine craftsmanship in your maneuvering! You worked through my defenses like clockwork! Take this $2.00 purse and my reinforced Dwarf Warden card!"</span>
            </div>
          `;
          if (this.overworld) {
            this.overworld.handleSilasBattleResult(true);
          }
        } else if (isPlayerVictory && this.currentChallenger?.id === 'nova') {
          const fName = this.currentChallenger.name || 'Nova';
          document.getElementById('winner-message').innerHTML = `
            All of <b>${fName}'s</b> mythical beasts were defeated in Round ${this.round}!<br>
            <div style="margin-top: 14px; padding: 12px 16px; background: rgba(168, 85, 247, 0.22); border: 2px solid #c084fc; border-radius: 12px; color: #e9d5ff; text-align: center;">
              ✨ <b>STARGAZER CELESTIAL REWARD: +$2.00 & Pegasus Foil Card!</b><br>
              <span style="font-size: 13px; color: #f8fafc;">Nova: "Written in the constellations! What brilliant celestial synergy! Here is your $2.00 prize and a celestial Pegasus foil card!"</span>
            </div>
          `;
          if (this.overworld) {
            this.overworld.handleNovaBattleResult(true);
          }
        } else if (this.currentChallenger?.tournamentContext?.type === 'park_monday_rr') {
          document.getElementById('btn-rematch')?.classList.add('hidden');
          const returnOverworldBtn = document.getElementById('btn-return-overworld');
          if (returnOverworldBtn) returnOverworldBtn.innerHTML = '🏆 View Tournament Bracket';

          const t1Hp = this.units.filter(u => u.team === 1).reduce((s, u) => s + Math.max(0, u.hp || 0), 0);
          const t2Hp = this.units.filter(u => u.team === 2).reduce((s, u) => s + Math.max(0, u.hp || 0), 0);
          const hpMargin = t1Hp - t2Hp;

          let summary = null;
          if (!this._parkTourneyMatchRecorded && this.overworld?.recordParkMondayMatchResult) {
            this._parkTourneyMatchRecorded = true;
            summary = this.overworld.recordParkMondayMatchResult(this.currentChallenger, isPlayerVictory, hpMargin);
          }

          const oppName = this.currentChallenger.name || 'Opponent';
          const roundNum = this.currentChallenger.tournamentContext.round || 1;
          const headline = isPlayerVictory
            ? `You defeated <b>${oppName}</b> in Round ${roundNum} of the Monday Casual Round Robin!`
            : `<b>${oppName}</b> won Round ${roundNum} of the Monday Casual Round Robin.`;

          let detailHtml = '';
          if (summary?.completed) {
            const rankLabel = summary.playerRank === 1 ? '🥇 1st Place' : summary.playerRank === 2 ? '🥈 2nd Place' : `${summary.playerRank}th Place`;
            const prizeHtml = summary.playerPrize > 0
              ? `You earned <b>$${summary.playerPrize.toFixed(2)}</b>!`
              : 'No cash prize this week — come back next Monday for another shot!';
            detailHtml = `
              <div style="margin-top: 14px; padding: 12px 16px; background: rgba(245, 158, 11, 0.2); border: 2px solid #f59e0b; border-radius: 12px; color: #fde68a; text-align: center;">
                🏆 <b>TOURNAMENT COMPLETE — ${rankLabel}!</b><br>
                <span style="font-size: 13px; color: #f8fafc;">${prizeHtml} (Champion: ${summary.championName} • Runner-up: ${summary.runnerUpName})</span>
              </div>
            `;
          } else {
            const npcText = summary?.npcMatchSummary ? `<br><span style="font-size: 12px; color: #cbd5e1;">Other table: ${summary.npcMatchSummary}</span>` : '';
            detailHtml = `
              <div style="margin-top: 14px; padding: 12px 16px; background: rgba(56, 189, 248, 0.18); border: 2px solid #38bdf8; border-radius: 12px; color: #bae6fd; text-align: center;">
                📋 <b>ROUND ${roundNum} OF 3 RECORDED</b>${npcText}<br>
                <span style="font-size: 13px; color: #f8fafc;">Click <b>View Tournament Bracket</b> below to inspect standings and start the next round.</span>
              </div>
            `;
          }
          document.getElementById('winner-message').innerHTML = `${headline}<br>${detailHtml}`;
        } else if (isPlayerVictory && this.currentChallenger) {
          const fName = this.currentChallenger.name || 'Your Friend';
          document.getElementById('winner-message').innerHTML = `
            All of <b>${fName}'s</b> mythical beasts were defeated in Round ${this.round}!<br>
            <div style="margin-top: 14px; padding: 12px 16px; background: rgba(59, 130, 246, 0.22); border: 2px solid #60a5fa; border-radius: 12px; color: #93c5fd; text-align: center;">
              🎁 <b>REWARD EARNED: "Old Card Binder"</b><br>
              <span style="font-size: 13px; color: #f8fafc;">${fName} surrendered his well-loved 9-pocket card binder to you! Return to the overworld to claim it!</span>
            </div>
          `;
          if (this.overworld) {
            this.overworld.grantOldCardBinder(this.currentChallenger);
          }
        } else {
          document.getElementById('winner-message').textContent = `All opposing mythical beasts were defeated in Round ${this.round}.`;
        }

        // Friday Night Mythos League Event Bounty
        const activeEvent = this.overworld?.getCurrentDayEvent?.();
        if (isPlayerVictory && activeEvent?.id === 'league_night' && this.overworld) {
          this.overworld.gold = Math.round(((this.overworld.gold || 0) + 1.50) * 100) / 100;
          this.overworld.saveWorldData(this.overworld.draftAppearance);
          this.overworld.updateHUDSaveInfo();
          const winMsgEl = document.getElementById('winner-message');
          if (winMsgEl) {
            winMsgEl.innerHTML += `
              <div style="margin-top: 12px; padding: 10px 16px; background: rgba(59, 130, 246, 0.22); border: 2px solid #3b82f6; border-radius: 12px; color: #93c5fd; text-align: center;">
                🏆 <b>FRIDAY NIGHT MYTHOS LEAGUE PURSE: +$1.50!</b><br>
                <span style="font-size: 13px; color: #f8fafc;">Earned an extra <b>+$1.50</b> bounty for winning during the Friday League event!</span>
              </div>
            `;
          }
        }

        this.elWinnerModal.classList.remove('hidden');
        this.log(`🏆 VICTORY: ${winner} has won the match!`, 'system');
      }
    }

    resetMatch() {
      this.elWinnerModal.classList.add('hidden');
      if (this.currentMap && this.currentMap.id === 'Base2v2') {
        if (this.overworld) {
          this.overworld.open2v2BeastSelect(this.currentChallenger);
        } else {
          this.enterMythosArena(this.currentChallenger, 'Base2v2');
        }
      } else {
        this.openDraftModal();
      }
    }

    // -------------------------------------------------------------------------
    // Mythical Beast Draft System (3 Selections Per Team)
    // -------------------------------------------------------------------------
    initDraft() {
      this.draftPoolTemplates = ['phoenix', 'earth_golem', 'werewolf', 'hydra', 'terra_mother', 'verdant_guardian', 'dwarf_warden', 'pegasus', 'dreadnaught'];
      this.draftState = {
        active: false,
        poolStock: { phoenix: 1, earth_golem: 1, werewolf: 1, hydra: 1, terra_mother: 1, verdant_guardian: 1, dwarf_warden: 1, pegasus: 1, dreadnaught: 1 },
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
        poolStock: { phoenix: 1, earth_golem: 1, werewolf: 1, hydra: 1, terra_mother: 1, verdant_guardian: 1, dwarf_warden: 1, pegasus: 1, dreadnaught: 1 },
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
        
        let stockBadgeHTML = `<span class="draft-card-stock">Available</span>`;
        if (isSoldOut) stockBadgeHTML = `<span class="draft-card-stock empty">Drafted</span>`;

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
      this.hazards = {};
      document.getElementById('round-num').textContent = '1';

      const is2v2 = this.currentMap && this.currentMap.teamSize === 2;
      const expectedTeamSize = is2v2 ? 2 : 3;
      const fallbackT1 = is2v2 ? ['phoenix', 'earth_golem'] : ['phoenix', 'earth_golem', 'hydra'];
      const fallbackT2 = is2v2 ? ['werewolf', 'hydra'] : ['werewolf', 'hydra', 'earth_golem'];

      const team1Picks = this.draftState.team1Picks.length === expectedTeamSize ? this.draftState.team1Picks : fallbackT1;
      const team2Picks = this.draftState.team2Picks.length === expectedTeamSize ? this.draftState.team2Picks : fallbackT2;

      this.initUnits(team1Picks, team2Picks);

      // Update header badges
      const t1Names = team1Picks.map(id => BEAST_TEMPLATES[id]?.name || id).join(' & ');
      const t2Names = team2Picks.map(id => BEAST_TEMPLATES[id]?.name || id).join(' & ');
      const t1El = document.getElementById('team1-beasts');
      const t2El = document.getElementById('team2-beasts');
      if (t1El) t1El.textContent = t1Names;
      if (t2El) t2El.textContent = t2Names;

      this.render();

      this.log(`⚔️ Match Initialized! Solar Team [${t1Names}] vs Lunar Team [${t2Names}].`, 'system');

      // Mythos Coin Toss determines who goes first!
      this.startCoinToss((firstTeam) => {
        this.currentTeam = firstTeam;
        document.getElementById('team1-badge').classList.toggle('active', firstTeam === 1);
        document.getElementById('team2-badge').classList.toggle('active', firstTeam === 2);

        const activeUnits = this.units.filter(u => u.team === firstTeam && u.hp > 0);
        if (activeUnits.length > 0) {
          this.selectUnit(activeUnits[0]);
        }
        this.renderSwitcherChips();
        this.render();

        const firstTeamLabel = firstTeam === 1 ? '☀️ Solar Team' : `🌙 Lunar Team (${this.currentChallenger?.name || 'Opponent'})`;
        this.log(`🪙 Mythos Coin Toss: ${firstTeamLabel} goes first!`, 'system');

        if (firstTeam === 2 && this.mode === 'ai') {
          setTimeout(() => this.runAiTurn(), 700);
        }
      });
    }

    startCoinToss(onComplete) {
      const modal = document.getElementById('coin-toss-modal');
      const coin = document.getElementById('mythos-coin');
      const shadow = document.getElementById('mythos-coin-shadow');
      const team1Card = document.getElementById('coin-team-1');
      const team2Card = document.getElementById('coin-team-2');
      const team1NameEl = document.getElementById('coin-team1-name');
      const team2NameEl = document.getElementById('coin-team2-name');
      const statusEl = document.getElementById('coin-toss-status');
      const btnFlip = document.getElementById('btn-flip-coin');
      const btnStart = document.getElementById('btn-start-battle-coin');

      if (!modal || !coin || !btnFlip) {
        if (onComplete) onComplete(Math.random() < 0.5 ? 1 : 2);
        return;
      }

      const pName = this.overworld?.playerName || this.overworld?.draftAppearance?.name || this.overworld?.worldSave?.playerAppearance?.name || 'Player';
      const oppName = this.currentChallenger?.name || (this.mode === 'ai' ? 'Opponent AI' : 'Team Lunar');
      if (team1NameEl) team1NameEl.textContent = `${pName} (Team Solar)`;
      if (team2NameEl) team2NameEl.textContent = `${oppName} (Team Lunar)`;

      const coinSolarSub = document.getElementById('coin-solar-sub');
      const coinLunarSub = document.getElementById('coin-lunar-sub');
      if (coinSolarSub) coinSolarSub.textContent = pName.toUpperCase();
      if (coinLunarSub) coinLunarSub.textContent = oppName.toUpperCase();

      // Reset state & classes
      coin.className = 'mythos-coin';
      if (shadow) shadow.className = 'mythos-coin-shadow';
      if (team1Card) team1Card.classList.remove('winner-glow');
      if (team2Card) team2Card.classList.remove('winner-glow');
      if (statusEl) {
        statusEl.className = 'coin-toss-status';
        statusEl.innerHTML = `Flip the Mythos coin to determine who takes Turn 1!`;
      }
      btnFlip.classList.remove('hidden');
      btnFlip.disabled = false;
      if (btnStart) btnStart.classList.add('hidden');

      modal.classList.remove('hidden');

      let hasFlipped = false;
      let autoAdvanceTimer = null;

      const finishCoinToss = (winnerTeam) => {
        if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
        modal.classList.add('hidden');
        if (onComplete) onComplete(winnerTeam);
      };

      const executeFlip = () => {
        if (hasFlipped) return;
        hasFlipped = true;
        btnFlip.disabled = true;

        // 50/50 randomized decision
        const winnerTeam = Math.random() < 0.5 ? 1 : 2;

        if (statusEl) {
          statusEl.innerHTML = `Tossing the celestial coin into the air...`;
        }

        // Trigger fluttering spin audio & CSS animation
        if (window.sounds?.playCoinFlip) window.sounds.playCoinFlip();

        coin.className = 'mythos-coin ' + (winnerTeam === 1 ? 'flipping-solar' : 'flipping-lunar');
        if (shadow) shadow.className = 'mythos-coin-shadow tossing';

        // When flip finishes (1.8s)
        setTimeout(() => {
          if (window.sounds?.playCoinLand) window.sounds.playCoinLand();

          if (statusEl) {
            statusEl.className = 'coin-toss-status ' + (winnerTeam === 1 ? 'winner-solar' : 'winner-lunar');
            statusEl.innerHTML = winnerTeam === 1
              ? `☀️ <b>SOLAR WINS!</b> ${pName} takes Turn 1!`
              : `🌙 <b>LUNAR WINS!</b> ${oppName} takes Turn 1!`;
          }

          if (winnerTeam === 1 && team1Card) team1Card.classList.add('winner-glow');
          if (winnerTeam === 2 && team2Card) team2Card.classList.add('winner-glow');

          btnFlip.classList.add('hidden');
          if (btnStart) {
            btnStart.classList.remove('hidden');
            btnStart.onclick = () => finishCoinToss(winnerTeam);
          }

          // Auto-commence after 2.2s so match flows smoothly
          autoAdvanceTimer = setTimeout(() => {
            finishCoinToss(winnerTeam);
          }, 2200);
        }, 1800);
      };

      btnFlip.onclick = () => executeFlip();
      coin.onclick = () => executeFlip();
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
      const colPct = 100 / this.COLS;
      const rowPct = 100 / this.ROWS;
      for (const key in this.hazards) {
        const [x, y] = key.split(',').map(Number);
        const h = this.hazards[key];
        const el = document.createElement('div');
        const durationClass = h.type === 'fire' ? `fire-turns-${h.duration}` : '';
        el.className = `hazard-sprite ${h.type.replace('_', '-')} ${durationClass}`.trim();
        el.style.left = `${x * colPct}%`;
        el.style.top = `${y * rowPct}%`;

        const img = document.createElement('img');
        if (h.type === 'fire') {
          img.src = 'Sprites/Effects/Fire_Tile_256x256.png';
        } else if (h.type === 'rock_barrier') {
          img.src = 'Sprites/Effects/Rock_Barrier_Tile_256x256.png';
        } else if (h.type === 'thorns') {
          img.src = 'Sprites/Effects/Thorn_Tile_256x256.png';
        } else if (h.type === 'thorn_bush') {
          img.src = 'Sprites/Effects/Thorn_Bush_Tile_256x256.png';
        } else if (h.type === 'magma') {
          img.src = 'Sprites/Effects/Magma_Tile_256x256.png';
        }
        el.appendChild(img);
        this.elHazardsLayer.appendChild(el);
      }
    }

    renderUnits() {
      this.elUnitsLayer.innerHTML = '';
      const colPct = 100 / this.COLS;
      const rowPct = 100 / this.ROWS;
      this.units.forEach(u => {
        if (u.hp <= 0 && u.animState !== 'defeated') return;

        const el = document.createElement('div');
        el.className = `unit-entity team-${u.team} anim-${u.animState} unit-${u.id}`;
        el.dataset.unit = u.id;
        if (this.selectedUnit === u) el.classList.add('selected');
        if (u.status && u.status.bullwark) el.classList.add('bullwark-active');
        if (u.id === 'dwarf_warden' && this.round > 10) el.classList.add('endurance-active');
        el.style.left = `${u.x * colPct}%`;
        el.style.top = `${u.y * rowPct}%`;

        // Determine correct sprite orientation
        let spriteSrc = u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        if (u.status && u.status.bullwark && u.animState === 'idle' && u.sprites.defend_bullwark) {
          spriteSrc = u.sprites.defend_bullwark;
        } else if (u.animState === 'walk') {
          spriteSrc = u.sprites[`walk_${u.facing}`] || u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        } else if (u.animState === 'attack') {
          spriteSrc = u.sprites[`attack_${u.facing}`] || u.sprites.attack || u.sprites[`idle_${u.facing}`] || u.sprites.idle_down;
        } else if (u.animState === 'attack_aoe') {
          spriteSrc = u.sprites.attack_aoe || u.sprites.defend_bullwark || u.sprites.attack || u.sprites.idle_down;
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
        badges.push(`<span class="status-pill buff-regen" title="Regrowth: +10 HP Next Turn">🌿 +10</span>`);
      }

      // Verdant Guardian Sapling Strength (active at <= 1/4 HP)
      if (u.id === 'verdant_guardian' && u.hp <= Math.floor(u.maxHp / 4)) {
        badges.push(`<span class="status-pill buff-sapling" title="Sapling Strength: Double Attack Damage (<=40 HP)">🌿 x2 ATK</span>`);
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

      // Dwarf Warden Bullwark (Negates incoming attack)
      if (u.status.bullwark) {
        badges.push(`<span class="status-pill buff-shield" title="Bullwark: Negates Next Incoming Attack">🛡️ BLK</span>`);
      }

      // Dwarf Warden Endurance (50% damage reduction after turn 10)
      if (u.id === 'dwarf_warden' && this.round > 10) {
        badges.push(`<span class="status-pill buff-shield" title="Endurance: 50% Damage Reduction (Round > 10)">💪 1/2</span>`);
      }

      // Pegasus Soar (Flies over blocks/obstacles)
      if (u.id === 'pegasus') {
        badges.push(`<span class="status-pill buff-soar" title="Ability: Soar — Can pass over blocked tiles as long as landing on a free tile">🪽 Soar</span>`);
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
      const colPct = 100 / this.COLS;
      const rowPct = 100 / this.ROWS;
      const el = document.createElement('div');
      el.className = `floating-text ${type}`;
      el.textContent = text;
      el.style.left = `${x * colPct + (colPct * 0.5)}%`;
      el.style.top = `${y * rowPct + (rowPct * 0.3)}%`;
      this.elFxLayer.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }

    spawnThornBurst(x, y) {
      const colPct = 100 / this.COLS;
      const rowPct = 100 / this.ROWS;
      const el = document.createElement('div');
      el.className = 'thorn-bush-burst';
      el.style.left = `${x * colPct}%`;
      el.style.top = `${y * rowPct}%`;
      const img = document.createElement('img');
      img.src = 'Sprites/Effects/Thorn_Bush_Tile_256x256.png';
      el.appendChild(img);
      this.elFxLayer.appendChild(el);
      setTimeout(() => el.remove(), 800);
    }

    log(message, type = 'system') {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      entry.textContent = message;
      this.elLog.appendChild(entry);
      this.elLog.scrollTop = this.elLog.scrollHeight;
    }
  }

  window.BeastsGame = BeastsGame;

  // Launch Game
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new BeastsGame();
  });
})();
