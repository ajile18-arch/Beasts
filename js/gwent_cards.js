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
  // Card Registry (New Mythos Card Set)
  // ---------------------------------------------------------------------------
  const CARDS = {
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
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'pull_copies_from_deck', cardId: 'goblin_soldier', sound: 'howl', label: '🧌 Goblin Muster' }
      ]
    },

    goblin_archer: {
      id: 'goblin_archer',
      name: 'Goblin Archer',
      role: 'Goblin Army',
      element: 'earth',
      stars: 1,
      rarity: 'bronze',
      row: 'ranged',
      basePower: 1,
      armor: 0,
      cardImg: 'Cards/Goblin_Archer_Card.jpg',
      abilityTitle: 'Archer Muster',
      abilityDesc: 'Pulls all other Goblin Archers from your deck into your hand.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'pull_copies_from_deck', cardId: 'goblin_archer', sound: 'whip', label: '🏹 Archer Muster' }
      ]
    },

    orc_infantry: {
      id: 'orc_infantry',
      name: 'Orc Infantry',
      role: 'Orc Army',
      element: 'metal',
      stars: 2,
      rarity: 'bronze',
      border: 'silver',
      row: 'melee',
      basePower: 2,
      armor: 2,
      cardImg: 'Cards/Orc_Infantry_Card.jpg',
      abilityTitle: 'Orcish Shield Wall',
      abilityDesc: 'Adds +1 Armor to an adjacent card on the row if it is part of the Orc Army.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'grant_adjacent_role_armor', role: 'Orc Army', amount: 1, sound: 'rock', label: '🛡️ Shield Wall' }
      ]
    },

    orc_slinger: {
      id: 'orc_slinger',
      name: 'Orc Slinger',
      role: 'Orc Army',
      element: 'metal',
      stars: 2,
      rarity: 'bronze',
      border: 'silver',
      row: 'ranged',
      basePower: 2,
      armor: 1,
      cardImg: 'Cards/Orc_Slinger_Card.jpg',
      abilityTitle: 'Orcish Volley',
      abilityDesc: 'Gives any other Orc Army card in your Ranged row +1 Power.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'boost_role_allies', roles: ['Orc Army'], rows: ['ranged'], amount: 1, excludeSelf: true, sound: 'whip', label: '🪨 Orcish Volley' }
      ]
    },

    werewolf_pup: {
      id: 'werewolf_pup',
      name: 'Werewolf Pup',
      role: 'Wolf Pack',
      element: 'earth',
      stars: 1,
      rarity: 'bronze',
      border: 'bronze',
      row: 'melee',
      basePower: 2,
      armor: 0,
      cardImg: 'Cards/Werewolf_Pup_Card.jpg',
      abilityTitle: 'Howl',
      abilityDesc: 'Doubles the power of all Wolf Pack cards on your side of the board. Stackable with additional Werewolf Pups.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'double_role_power', roles: ['Wolf Pack'], excludeSelf: true, sound: 'howl', label: '🐺 Howl' }
      ]
    },

    minerva_wolf_mother: {
      id: 'minerva_wolf_mother',
      name: 'Minerva, Wolf Mother',
      role: 'Wolf Pack',
      element: 'earth',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'melee',
      basePower: 3,
      armor: 2,
      cardImg: 'Cards/Minerva_Wolf_Mother_Card.jpg',
      abilityTitle: "Mother's Aegis",
      abilityDesc: 'When deployed, give all other Wolf Pack cards on your side of the board +2 Armor.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'grant_role_armor', roles: ['Wolf Pack'], amount: 2, excludeSelf: true, sound: 'rock', label: "🛡️ Mother's Aegis" }
      ]
    },

    rust_bucket: {
      id: 'rust_bucket',
      name: 'Rust Bucket',
      role: 'Machine',
      element: 'metal',
      stars: 1,
      rarity: 'bronze',
      border: 'bronze',
      row: 'melee',
      basePower: 1,
      armor: 2,
      resilient: true,
      cardImg: 'Cards/Rust_Bucket_Card.jpg',
      abilityTitle: 'Resilient',
      abilityDesc: 'Stays on the battlefield at the end of the round instead of moving to the Graveyard.',
      passiveTitle: 'Resilient',
      passiveDesc: 'Persists into the next round.',
      effects: []
    },

    scrap_heap: {
      id: 'scrap_heap',
      name: 'Scrap Heap',
      role: 'Machine',
      element: 'metal',
      stars: 2,
      rarity: 'silver',
      border: 'silver',
      row: 'melee',
      basePower: 2,
      armor: 2,
      shield: true,
      cardImg: 'Cards/Scrap_Heap_Card.jpg',
      abilityTitle: 'Shield',
      abilityDesc: 'Ignores the next instance of damage, then the Shield breaks and is removed.',
      passiveTitle: 'Shield',
      passiveDesc: 'Absorbs one incoming hit.',
      effects: []
    },

    manson_wolf_father: {
      id: 'manson_wolf_father',
      name: 'Manson, Wolf Father',
      role: 'Wolf Pack',
      element: 'earth',
      stars: 4,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'agile',
      basePower: 4,
      armor: 0,
      boostRoleAbility: { role: 'Wolf Pack', amount: 1 },
      cardImg: 'Cards/Manson_Wolf_Father_Card.jpg',
      abilityTitle: "Alpha's Command",
      abilityDesc: 'Select Manson on the board, then click each allied Wolf Pack member once per turn to raise their Power by +1.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per deck.',
      effects: []
    },

    vampire_thrall: {
      id: 'vampire_thrall',
      name: 'Vampire Thrall',
      role: 'Vampire',
      element: 'poison',
      stars: 2,
      rarity: 'silver',
      border: 'silver',
      row: 'melee',
      basePower: 2,
      armor: 0,
      lifestealHeal: true,
      cardImg: 'Cards/Vampire_Thrall_Card.jpg',
      abilityTitle: 'Blood Leech',
      abilityDesc: 'Attacking returns half of the attack damage dealt to heal Vampire Thrall (up to its Base Power).',
      passiveTitle: 'Lifesteal',
      passiveDesc: 'Sustains itself in melee combat.',
      effects: []
    },

    gooba_goblin_king: {
      id: 'gooba_goblin_king',
      name: 'Gooba, Goblin King',
      role: 'Goblin Army',
      element: 'earth',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      row: 'ranged',
      basePower: 5,
      armor: 2,
      cardImg: 'Cards/Gooba_Goblin_King_Card.jpg',
      abilityTitle: 'Royal Decree',
      abilityDesc: 'When played, also play any 1- or 2-star Goblin Army card from your hand.',
      passiveTitle: 'Goblin Sovereign',
      passiveDesc: 'Commands the Goblin Army from the Ranged row.',
      effects: [],
      onPlay(ctx) {
        const { game, team, targetRow, logType } = ctx;
        const player = game.state?.players?.[team];
        if (!player || !Array.isArray(player.hand) || player.hand.length === 0) return;

        // Prefer highest-star (2-star then 1-star), highest-power eligible Goblin Army card in hand
        let bestIdx = -1;
        let bestScore = -1;
        player.hand.forEach((c, idx) => {
          const def = CARDS[c.id];
          const role = c.role || def?.role;
          const stars = Number(c.stars ?? def?.stars ?? 0);
          if (role === 'Goblin Army' && (stars === 1 || stars === 2)) {
            const score = stars * 100 + (c.power || 0);
            if (score > bestScore) {
              bestScore = score;
              bestIdx = idx;
            }
          }
        });

        if (bestIdx === -1) return;

        const [bonusCard] = player.hand.splice(bestIdx, 1);
        const bonusRow = bonusCard.row === 'agile'
          ? (targetRow || 'ranged')
          : (bonusCard.row || 'melee');
        const bonusPreMyScore = game.getTotalScore(team);
        const bonusPreOppScore = game.getTotalScore(team === 1 ? 2 : 1);
        const bonusAlliesBefore = game.getAllBoardCards(team).length;

        player.rows[bonusRow].push(bonusCard);
        playSound('howl');
        game.log(
          `👑 Royal Decree! Gooba, Goblin King also plays ${bonusCard.name} (${bonusCard.power}) to ${ROW_LABELS[bonusRow] || bonusRow}!`,
          logType
        );
        game.resolveCardAbility(team, bonusCard, bonusRow, bonusPreMyScore, bonusPreOppScore, bonusAlliesBefore);
      },
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const player = game.state?.players?.[team];
        let est = 5 + 1; // 5 power + 2 armor value
        const hasGoblinInHand = (player?.hand || []).some(c => {
          const def = CARDS[c.id];
          const role = c.role || def?.role;
          const stars = Number(c.stars ?? def?.stars ?? 0);
          return role === 'Goblin Army' && (stars === 1 || stars === 2);
        });
        if (hasGoblinInHand) est += 4;
        return est;
      }
    },

    mothman: {
      id: 'mothman',
      name: 'Mothman',
      role: 'Monster',
      element: 'air',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      maxDeckCopies: 2,
      row: 'agile',
      basePower: 3,
      armor: 1,
      cardImg: 'Cards/Mothman_Card.jpg',
      abilityTitle: 'Omen Carapace',
      abilityDesc: 'Boosts the Armor of the creature to its right by +1 each turn while Mothman is on the board.',
      passiveTitle: 'Deck Limit: 2',
      passiveDesc: 'Limited to 2 copies per playing deck.',
      effects: [],
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const rowArr = game.state?.players?.[team]?.rows?.[rowKey] || [];
        // Value is higher when played to the left of an existing unit or early in a round
        return 3 + 0.5 + (rowArr.length === 0 ? 2 : 1);
      }
    },

    jersey_devil: {
      id: 'jersey_devil',
      name: 'Jersey Devil',
      role: 'Monster',
      element: 'fire',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      maxDeckCopies: 1,
      row: 'agile',
      basePower: 2,
      armor: 0,
      onKillPowerGain: 1,
      onKillMaxBonus: 3,
      cardImg: 'Cards/Jersey_Devil_Card.jpg',
      abilityTitle: 'Pine Barrens Stalker',
      abilityDesc: 'When Jersey Devil destroys an enemy, it gains +1 Power (up to +3 additional Power).',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      estimateAiValue() {
        return 2 + 1.5;
      }
    },

    merfolk: {
      id: 'merfolk',
      name: 'Merfolk',
      role: 'Water Tribe',
      element: 'water',
      stars: 1,
      rarity: 'bronze',
      border: 'bronze',
      maxDeckCopies: 3,
      row: 'agile',
      basePower: 1,
      armor: 1,
      doubleHitIfRowRole: 'Water Tribe',
      cardImg: 'Cards/Merfolk_Card.jpg',
      abilityTitle: 'Twin Tide',
      abilityDesc: 'Hits twice when attacking if another Water Tribe character is in its row.',
      passiveTitle: 'Deck Limit: 3',
      passiveDesc: 'Limited to 3 copies per playing deck.',
      effects: [],
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const rowArr = game.state?.players?.[team]?.rows?.[rowKey] || [];
        const hasWaterTribe = rowArr.some(c => c.role === 'Water Tribe');
        return 1 + 0.5 + (hasWaterTribe ? 1 : 0);
      }
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
      'goblin_soldier', 'goblin_soldier', 'goblin_soldier',
      'goblin_archer', 'goblin_archer', 'goblin_archer',
      'orc_infantry', 'orc_infantry',
      'orc_slinger', 'orc_slinger',
      'werewolf_pup', 'werewolf_pup',
      'minerva_wolf_mother',
      'rust_bucket', 'rust_bucket',
      'scrap_heap', 'scrap_heap',
      'manson_wolf_father',
      'vampire_thrall', 'vampire_thrall',
      'gooba_goblin_king',
      'mothman', 'mothman',
      'jersey_devil',
      'merfolk', 'merfolk', 'merfolk'
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
          const targetRows = eff.rows || ['melee', 'ranged'];
          let count = 0;
          targetRows.forEach(rk => {
            (myRows[rk] || []).forEach(c => {
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
        case 'grant_adjacent_role_armor': {
          const rowArr = myRows[targetRow] || [];
          const idx = rowArr.indexOf(card);
          const neighbors = [rowArr[idx - 1], rowArr[idx + 1]].filter(Boolean);
          const match = neighbors.find(n => n.role === eff.role);
          if (match) {
            match.armor = (match.armor || 0) + (eff.amount || 1);
            playSound(eff.sound || 'rock');
            game.log(`${eff.label || '🛡️ Fortify'} granted +${eff.amount || 1} Armor to adjacent ${match.name}!`, logType);
          }
          break;
        }
        case 'double_role_power': {
          const allowedRoles = eff.roles || [];
          let count = 0;
          ['melee', 'ranged'].forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if ((!eff.excludeSelf || c.uid !== card.uid) && allowedRoles.includes(c.role)) {
                c.power *= 2;
                count++;
              }
            });
          });
          if (count > 0) {
            playSound(eff.sound || 'howl');
            game.log(`${eff.label || '🐺 Howl'} doubled the power of ${count} Wolf Pack unit(s)!`, logType);
          }
          break;
        }
        case 'grant_role_armor': {
          const allowedRoles = eff.roles || [];
          const amt = eff.amount || 2;
          let count = 0;
          ['melee', 'ranged'].forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if ((!eff.excludeSelf || c.uid !== card.uid) && allowedRoles.includes(c.role)) {
                c.armor = (c.armor || 0) + amt;
                count++;
              }
            });
          });
          if (count > 0) {
            playSound(eff.sound || 'rock');
            game.log(`${eff.label || '🛡️ Pack Armor'} granted +${amt} Armor to ${count} Wolf Pack unit(s)!`, logType);
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
    if (cardDef?.resilient && game.state?.round < 3) {
      est += card.power + (card.armor || 0) * 0.5;
    }
    if (cardDef?.shield) {
      est += 2;
    }
    if (cardDef?.boostRoleAbility) {
      const roleAllies = game.getAllBoardCards(team).filter(c => c.role === cardDef.boostRoleAbility.role).length;
      est += roleAllies * (cardDef.boostRoleAbility.amount || 1);
    }
    if (cardDef?.lifestealHeal) {
      est += 1;
    }
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
          const targetRows = eff.rows || ['melee', 'ranged'];
          let matches = 0;
          targetRows.forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if (eff.roles ? allowed.includes(c.role) : allowed.includes(c.element)) matches++;
            });
          });
          est += matches * eff.amount;
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
        case 'grant_adjacent_role_armor': {
          const rowArr = myRows[rowKey] || [];
          const last = rowArr[rowArr.length - 1];
          if (last && last.role === eff.role) est += (eff.amount || 1);
          break;
        }
        case 'double_role_power': {
          const allowedRoles = eff.roles || [];
          const wolfPower = game.getAllBoardCards(team)
            .filter(c => allowedRoles.includes(c.role))
            .reduce((s, c) => s + c.power, 0);
          est += wolfPower + (eff.excludeSelf ? 0 : card.power);
          break;
        }
        case 'grant_role_armor': {
          const allowedRoles = eff.roles || [];
          const amt = eff.amount || 2;
          const matches = game.getAllBoardCards(team).filter(c => allowedRoles.includes(c.role)).length;
          est += matches * amt + (eff.excludeSelf ? 0 : amt);
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
