/**
 * MYTHOS GWENT — Modular Card & Ability Framework
 *
 * To add a new card:
 *   1. Add an entry to `CARDS` below (or call `window.MythosGwentCards.registerCard({...})`).
 *   2. Use built-in `effects` descriptors and/or a custom `onPlay(ctx)` hook.
 *   3. Add the card's `id` to a deck in `DECK_RECIPES` (e.g., `standard`).
 *
 * Built-in `effects` types:
 *   - { type: 'damage_row', rows: ['melee'], amount: 2, sound: 'fire' }
 *   - { type: 'damage_strongest_enemy', rows: ['melee','ranged'], amount: 3, sound: 'poison' }
 *   - { type: 'boost_row_allies', amount: 2, excludeSelf: true, sound: 'rock' }
 *   - { type: 'boost_self_if_ally', allyId: 'werewolf', sameRowOnly: true, amount: 2 }
 *   - { type: 'boost_self_if_trailing', amount: 4, sound: 'heal' }
 *   - { type: 'boost_self_if_alone', amount: 5 }
 *   - { type: 'summon_token', tokenId: 'thorn_sapling', row: 'melee', sound: 'heal' }
 *   - { type: 'boost_role_allies', roles: ['tank','warrior'], amount: 1, excludeSelf: true }
 *   - { type: 'draw_cards', count: 1 }
 */

(function () {
  'use strict';

  const ROW_ICONS = {
    melee: '⚔️',
    ranged: '🏹',
    agile: '🦅'
  };

  const ROW_LABELS = {
    melee: 'Melee',
    ranged: 'Ranged',
    agile: 'Agile'
  };

  // ---------------------------------------------------------------------------
  // Card Registry (Current 9 Mythos Cards + Summoned Tokens)
  // ---------------------------------------------------------------------------
  const CARDS = {
    phoenix: {
      id: 'phoenix',
      name: 'Phoenix',
      role: 'mage',
      element: 'fire',
      stars: 4,
      rarity: 'gold',
      row: 'ranged',
      basePower: 8,
      armor: 0,
      cardImg: 'Cards/Phoenix_Card.png',
      abilityTitle: 'Trails of Fire',
      abilityDesc: 'Deals 2 damage to every enemy unit on the opposing Melee row.',
      passiveTitle: 'Rebirth',
      passiveDesc: 'At the start of Round 2 or 3, if in Graveyard, revives onto your Ranged row with 4 Power (once per match).',
      effects: [
        { type: 'damage_row', rows: ['melee'], amount: 2, sound: 'fire', label: '🔥 Trails of Fire' }
      ],
      rebirthPower: 4,
      rebirthRow: 'ranged'
    },

    earth_golem: {
      id: 'earth_golem',
      name: 'Earth Golem',
      role: 'tank',
      element: 'earth',
      stars: 4,
      rarity: 'gold',
      row: 'melee',
      basePower: 10,
      armor: 0,
      cardImg: 'Cards/Earth_Golem_Card.png',
      abilityTitle: 'Rock Barrier',
      abilityDesc: 'Boosts all other allied units on your Melee row by +2 Power.',
      passiveTitle: 'Terraform',
      passiveDesc: 'Frontline Earth titan with massive base power.',
      effects: [
        { type: 'boost_row_allies', amount: 2, excludeSelf: true, sound: 'rock', label: '🪨 Rock Barrier' }
      ]
    },

    werewolf: {
      id: 'werewolf',
      name: 'Werewolf',
      role: 'warrior',
      element: 'earth',
      stars: 2,
      rarity: 'bronze',
      row: 'melee',
      basePower: 5,
      armor: 0,
      cardImg: 'Cards/Werewolf_Card.png',
      abilityTitle: 'Howl',
      abilityDesc: 'Boosts all other allied units on your Melee row by +1 Power.',
      passiveTitle: 'Pack Bond',
      passiveDesc: 'Gains +2 Power if another Werewolf is already on your Melee row.',
      effects: [
        { type: 'boost_row_allies', amount: 1, excludeSelf: true, sound: 'howl', label: '🐺 Howl' },
        { type: 'boost_self_if_ally', allyId: 'werewolf', sameRowOnly: true, amount: 2, label: '🐺 Pack Bond' }
      ]
    },

    hydra: {
      id: 'hydra',
      name: 'Hydra',
      role: 'assassin',
      element: 'poison',
      stars: 4,
      rarity: 'gold',
      row: 'ranged',
      basePower: 7,
      armor: 0,
      cardImg: 'Cards/Hydra_Card.png',
      abilityTitle: 'Venomous Bite',
      abilityDesc: 'Deals 3 damage to the strongest enemy unit on the board.',
      passiveTitle: 'Swamp Regenerator',
      passiveDesc: 'Boosts all other allied units on your Ranged row by +1 Power.',
      effects: [
        { type: 'damage_strongest_enemy', rows: ['melee', 'ranged'], amount: 3, sound: 'poison', label: '🐍 Venomous Bite' },
        { type: 'boost_row_allies', amount: 1, excludeSelf: true, label: '🌿 Swamp Regenerator' }
      ]
    },

    terra_mother: {
      id: 'terra_mother',
      name: 'Terra-Mother',
      role: 'summoner',
      element: 'earth',
      stars: 4,
      rarity: 'gold',
      row: 'ranged',
      basePower: 7,
      armor: 0,
      cardImg: 'Cards/Terra_Mother_Card.png',
      abilityTitle: 'Thorn of Life',
      abilityDesc: 'Summons a 3-Power Thorn Sapling onto your Melee row.',
      passiveTitle: 'Nature Blessing',
      passiveDesc: 'Boosts all Earth & Plant allies on your side of the board by +1 Power.',
      effects: [
        { type: 'summon_token', tokenId: 'thorn_sapling', row: 'melee', sound: 'heal', label: '🌱 Thorn of Life' },
        { type: 'boost_element_allies', elements: ['earth', 'plant'], amount: 1, excludeSelf: true, label: '🌿 Nature Blessing' }
      ]
    },

    verdant_guardian: {
      id: 'verdant_guardian',
      name: 'Verdant Guardian',
      role: 'warrior',
      element: 'plant',
      stars: 2,
      rarity: 'bronze',
      row: 'melee',
      basePower: 6,
      armor: 0,
      cardImg: 'Cards/Verdant_Guardian_Card.png',
      abilityTitle: 'Thorn Bush',
      abilityDesc: 'Deals 2 damage to the strongest enemy unit on the opposing Melee row.',
      passiveTitle: 'Sapling Strength',
      passiveDesc: 'Gains +4 Power if your total score is lower than your opponent\'s when played.',
      effects: [
        { type: 'damage_strongest_enemy', rows: ['melee'], amount: 2, sound: 'whip', label: '🌿 Thorn Bush' },
        { type: 'boost_self_if_trailing', amount: 4, sound: 'heal', label: '💪 Sapling Strength' }
      ]
    },

    dwarf_warden: {
      id: 'dwarf_warden',
      name: 'Dwarf Warden',
      role: 'tank',
      element: 'earth',
      stars: 4,
      rarity: 'gold',
      row: 'ranged',
      basePower: 7,
      armor: 2,
      cardImg: 'Cards/Dwarf_Warden_Card.png',
      abilityTitle: 'Hammer Throw',
      abilityDesc: 'Deals 3 damage to the strongest enemy unit on the opposing Ranged row.',
      passiveTitle: 'Bullwark',
      passiveDesc: 'Enters play with 2 Armor that absorbs incoming damage first.',
      effects: [
        { type: 'damage_strongest_enemy', rows: ['ranged'], amount: 3, sound: 'hit', label: '🔨 Hammer Throw' }
      ]
    },

    pegasus: {
      id: 'pegasus',
      name: 'Pegasus',
      role: 'support',
      element: 'air',
      stars: 3,
      rarity: 'silver',
      row: 'agile',
      basePower: 6,
      armor: 0,
      cardImg: 'Cards/Pegasus_Card.png',
      abilityTitle: 'Soar (Agile)',
      abilityDesc: 'Can be deployed onto Melee or Ranged.',
      passiveTitle: 'Inspire',
      passiveDesc: 'Boosts all other allied units on the chosen row by +2 Power.',
      effects: [
        { type: 'boost_row_allies', amount: 2, excludeSelf: true, sound: 'heal', label: '🦅 Inspire' }
      ]
    },

    dreadnaught: {
      id: 'dreadnaught',
      name: 'Dreadnaught',
      role: 'tank',
      element: 'metal',
      stars: 2,
      rarity: 'bronze',
      row: 'melee',
      basePower: 6,
      armor: 0,
      cardImg: 'Cards/Dreadnaught_Card.png',
      abilityTitle: 'Magma Fist',
      abilityDesc: 'Deals 2 damage to the strongest enemy unit on the board.',
      passiveTitle: 'Burning Heart',
      passiveDesc: 'Gains +5 Power if Dreadnaught is the only unit on your side when played.',
      effects: [
        { type: 'damage_strongest_enemy', rows: ['melee', 'ranged'], amount: 2, sound: 'fire', label: '🌋 Magma Fist' },
        { type: 'boost_self_if_alone', amount: 5, label: '❤️‍🔥 Burning Heart' }
      ]
    },

    goblin_soldier: {
      id: 'goblin_soldier',
      name: 'Goblin Soldier',
      role: 'Goblin Army',
      element: 'earth',
      stars: 1,
      rarity: 'bronze',
      row: 'melee',
      basePower: 1,
      armor: 0,
      cardImg: 'Cards/Goblin_Soldier_Card.jpg',
      abilityTitle: 'Goblin Muster',
      abilityDesc: 'Pulls all other Goblin Soldiers from your deck into your hand.',
      passiveTitle: 'Swarm Tactics',
      passiveDesc: 'Thin your deck and flood the Melee row with reinforcements.',
      effects: [
        { type: 'pull_copies_from_deck', cardId: 'goblin_soldier', sound: 'howl', label: '🧌 Goblin Muster' }
      ]
    },

    thorn_sapling: {
      id: 'thorn_sapling',
      name: 'Thorn Sapling',
      role: 'summon',
      element: 'plant',
      stars: 1,
      rarity: 'bronze',
      row: 'melee',
      basePower: 3,
      armor: 0,
      cardImg: 'Sprites/Effects/Thorn_Bush_Tile_256x256.png',
      abilityTitle: 'Summoned Token',
      abilityDesc: 'Conjured by Terra-Mother to reinforce the Melee line.',
      passiveTitle: 'Rooted',
      passiveDesc: 'Counted as a Plant ally.',
      isToken: true,
      effects: []
    }
  };

  // ---------------------------------------------------------------------------
  // Deck Recipes
  // ---------------------------------------------------------------------------
  const DECK_RECIPES = {
    standard: [
      'phoenix', 'earth_golem', 'hydra', 'terra_mother', 'dwarf_warden',
      'pegasus',
      'werewolf',
      'verdant_guardian',
      'dreadnaught',
      'goblin_soldier', 'goblin_soldier', 'goblin_soldier'
    ]
  };

  function playSound(soundName) {
    const fx = window.soundFX;
    if (!fx || !soundName) return;
    const map = {
      fire: () => fx.playFire?.(),
      rock: () => fx.playRock?.(),
      howl: () => fx.playHowl?.(),
      poison: () => fx.playPoison?.(),
      whip: () => fx.playWhip?.(),
      heal: () => fx.playHeal?.(),
      hit: () => fx.playHit?.()
    };
    map[soundName]?.();
  }

  // ---------------------------------------------------------------------------
  // Reusable Effect Engine
  // ---------------------------------------------------------------------------
  function executeEffects(cardDef, ctx) {
    const {
      game, team, oppTeam, card, targetRow,
      prePlayMyScore, prePlayOppScore, alliesOnBoardBefore, logType
    } = ctx;

    const myRows = game.state.players[team].rows;
    const oppRows = game.state.players[oppTeam].rows;
    const effects = cardDef?.effects || [];

    effects.forEach(eff => {
      switch (eff.type) {
        case 'damage_row': {
          const rows = eff.rows || ['melee'];
          let hitCount = 0;
          rows.forEach(rk => {
            const targets = [...(oppRows[rk] || [])];
            targets.forEach(t => {
              game.damageUnit(t, eff.amount, oppTeam, rk);
              hitCount++;
            });
          });
          if (hitCount > 0) {
            playSound(eff.sound);
            game.log(`${eff.label || '⚔️ Strike'} hit ${hitCount} enemy unit(s) for ${eff.amount} damage!`, logType);
          }
          break;
        }
        case 'damage_strongest_enemy': {
          const target = game.findStrongestEnemy(oppTeam, eff.rows || ['melee', 'ranged']);
          if (target) {
            playSound(eff.sound);
            game.damageUnit(target.card, eff.amount, oppTeam, target.rowKey);
            game.log(`${eff.label || '⚔️ Strike'} dealt ${eff.amount} damage to ${target.card.name}!`, logType);
          }
          break;
        }
        case 'boost_row_allies': {
          const allies = (myRows[targetRow] || []).filter(c => !eff.excludeSelf || c.uid !== card.uid);
          if (allies.length > 0) {
            playSound(eff.sound);
            allies.forEach(a => { a.power += eff.amount; });
            game.log(`${eff.label || '✨ Rally'} boosted ${allies.length} ${ROW_LABELS[targetRow]} ally(s) by +${eff.amount} Power!`, logType);
          }
          break;
        }
        case 'boost_self_if_ally': {
          const pool = eff.sameRowOnly ? (myRows[targetRow] || []) : game.getAllBoardCards(team);
          const hasAlly = pool.some(c => c.uid !== card.uid && c.id === eff.allyId);
          if (hasAlly) {
            playSound(eff.sound);
            card.power += eff.amount;
            game.log(`${eff.label || '🤝 Bond'}! ${card.name} gained +${eff.amount} Power (${card.power}).`, logType);
          }
          break;
        }
        case 'boost_self_if_trailing': {
          if (prePlayMyScore < prePlayOppScore) {
            playSound(eff.sound);
            card.power += eff.amount;
            game.log(`${eff.label || '💪 Surge'}! Trailing in score, ${card.name} gained +${eff.amount} Power (${card.power})!`, logType);
          }
          break;
        }
        case 'boost_self_if_alone': {
          if (alliesOnBoardBefore === 0) {
            playSound(eff.sound);
            card.power += eff.amount;
            game.log(`${eff.label || '🔥 Lone Stand'}! Standing alone, ${card.name} gained +${eff.amount} Power (${card.power})!`, logType);
          }
          break;
        }
        case 'summon_token': {
          const token = game.createCardInstance(eff.tokenId);
          const destRow = eff.row || targetRow;
          if (myRows[destRow]) {
            myRows[destRow].push(token);
            playSound(eff.sound);
            game.log(`${eff.label || '✨ Summon'} conjured a ${token.power}-Power ${token.name} onto ${ROW_LABELS[destRow]}!`, logType);
          }
          break;
        }
        case 'boost_role_allies':
        case 'boost_element_allies': {
          const allowedRoles = eff.roles || eff.elements || [];
          let count = 0;
          ['melee', 'ranged'].forEach(rk => {
            myRows[rk].forEach(c => {
              const match = eff.roles ? allowedRoles.includes(c.role) : allowedRoles.includes(c.element);
              if ((!eff.excludeSelf || c.uid !== card.uid) && match) {
                c.power += eff.amount;
                count++;
              }
            });
          });
          if (count > 0) {
            playSound(eff.sound);
            game.log(`${eff.label || '🌿 Blessing'} boosted ${count} ally(s) by +${eff.amount} Power!`, logType);
          }
          break;
        }
        case 'draw_cards': {
          const deck = game.state.players[team].deck;
          const drawn = deck.splice(0, eff.count || 1);
          if (drawn.length > 0) {
            game.state.players[team].hand.push(...drawn);
            playSound(eff.sound || 'heal');
            game.log(`${eff.label || '🃏 Draw'} drew ${drawn.length} card(s)!`, logType);
          }
          break;
        }
        case 'pull_copies_from_deck': {
          const targetId = eff.cardId || card.id;
          const deck = game.state.players[team].deck;
          const hand = game.state.players[team].hand;
          const pulled = [];
          for (let i = deck.length - 1; i >= 0; i--) {
            if (deck[i].id === targetId) {
              pulled.push(deck.splice(i, 1)[0]);
            }
          }
          if (pulled.length > 0) {
            hand.push(...pulled);
            playSound(eff.sound || 'howl');
            game.log(`${eff.label || '🧌 Muster'} pulled ${pulled.length} ${card.name}(s) from deck to hand!`, logType);
          }
          break;
        }
      }
    });

    if (typeof cardDef?.onPlay === 'function') {
      cardDef.onPlay(ctx);
    }
  }

  // ---------------------------------------------------------------------------
  // Automatic AI Value Estimator (works for all existing & future cards)
  // ---------------------------------------------------------------------------
  function estimateCardValue(card, rowKey, ctx) {
    const { game, team, oppTeam, myScore, oppScore } = ctx;
    const cardDef = CARDS[card.id];
    if (typeof cardDef?.estimateAiValue === 'function') {
      return cardDef.estimateAiValue(rowKey, ctx);
    }

    let est = card.power;
    const myRows = game.state.players[team].rows;
    const oppRows = game.state.players[oppTeam].rows;
    const effects = cardDef?.effects || [];

    effects.forEach(eff => {
      switch (eff.type) {
        case 'damage_row':
          (eff.rows || ['melee']).forEach(rk => {
            est += (oppRows[rk]?.length || 0) * eff.amount;
          });
          break;
        case 'damage_strongest_enemy':
          if (game.findStrongestEnemy(oppTeam, eff.rows || ['melee', 'ranged'])) {
            est += eff.amount;
          }
          break;
        case 'boost_row_allies':
          est += (myRows[rowKey]?.length || 0) * eff.amount;
          break;
        case 'boost_self_if_ally': {
          const pool = eff.sameRowOnly ? (myRows[rowKey] || []) : game.getAllBoardCards(team);
          if (pool.some(c => c.id === eff.allyId)) est += eff.amount;
          break;
        }
        case 'boost_self_if_trailing':
          if (myScore < oppScore) est += eff.amount;
          break;
        case 'boost_self_if_alone':
          if (game.getAllBoardCards(team).length === 0) est += eff.amount;
          break;
        case 'summon_token':
          est += (CARDS[eff.tokenId]?.basePower || 3);
          break;
        case 'boost_role_allies':
        case 'boost_element_allies': {
          const allowed = eff.roles || eff.elements || [];
          est += game.getAllBoardCards(team).filter(c => eff.roles ? allowed.includes(c.role) : allowed.includes(c.element)).length * eff.amount;
          break;
        }
        case 'draw_cards':
          est += (eff.count || 1) * 5;
          break;
        case 'pull_copies_from_deck': {
          const targetId = eff.cardId || card.id;
          const copiesInDeck = game.state.players[team].deck.filter(c => c.id === targetId).length;
          est += copiesInDeck * 3;
          break;
        }
      }
    });

    return est;
  }

  window.MythosGwentCards = {
    CARDS,
    DECK_RECIPES,
    ROW_ICONS,
    ROW_LABELS,
    registerCard(cardDef) {
      if (cardDef && cardDef.id) {
        CARDS[cardDef.id] = cardDef;
      }
    },
    registerDeck(deckId, cardIds) {
      if (deckId && Array.isArray(cardIds)) {
        DECK_RECIPES[deckId] = cardIds;
      }
    },
    getCard(id) {
      return CARDS[id] || null;
    },
    getDeckRecipe(deckId = 'standard') {
      return [...(DECK_RECIPES[deckId] || DECK_RECIPES.standard)];
    },
    executeEffects,
    estimateCardValue
  };
})();
