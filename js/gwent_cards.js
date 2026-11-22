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
 *   - { type: 'summon_token', tokenId: '<token_id>', row: 'melee', sound: 'heal' }
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

  /** Deploy an eligible Goblin Army card from hand onto the board and resolve its ability. */
  function playExtraGoblinArmyFromHand(ctx, { sourceName, title, sound = 'howl', maxStars = Infinity, optional = false }) {
    const { game, team, targetRow, logType } = ctx;
    if (game?.state?._suppressExtraGoblinPlay) return;
    const player = game.state?.players?.[team];
    if (!player || !Array.isArray(player.hand) || player.hand.length === 0) return;

    const candidates = [];
    let bestIdx = -1;
    let bestScore = -1;
    player.hand.forEach((c, idx) => {
      const def = CARDS[c.id];
      const role = c.role || def?.role;
      const stars = Number(c.stars ?? def?.stars ?? 0);
      if (role === 'Goblin Army' && stars <= maxStars) {
        candidates.push(c);
        const score = stars * 100 + (c.power || 0);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }
    });

    if (bestIdx === -1) return;

    const isAi = game.isAiTeam ? game.isAiTeam(team) : (game.gameMode === 'ai' && team === 2);
    if (optional && !isAi && typeof game.promptOptionalHandPlay === 'function') {
      game.promptOptionalHandPlay({
        team,
        targetRow,
        logType,
        sourceName,
        title,
        sound,
        candidates
      });
      return;
    }

    const [bonusCard] = player.hand.splice(bestIdx, 1);
    if (game._simSummoningSickness) bonusCard.attackedThisTurn = true;
    const bonusRow = bonusCard.row === 'agile'
      ? (targetRow || 'ranged')
      : (bonusCard.row || 'melee');
    const bonusPreMyScore = game.getTotalScore(team);
    const bonusPreOppScore = game.getTotalScore(team === 1 ? 2 : 1);
    const bonusAlliesBefore = game.getAllBoardCards(team).length;

    player.rows[bonusRow].push(bonusCard);
    if (typeof playSound === 'function') playSound(sound);
    game.log(
      `${title}! ${sourceName} also plays ${bonusCard.name} (${bonusCard.power}) to ${ROW_LABELS[bonusRow] || bonusRow}!`,
      logType
    );
    game.state._suppressExtraGoblinPlay = true;
    try {
      game.resolveCardAbility(team, bonusCard, bonusRow, bonusPreMyScore, bonusPreOppScore, bonusAlliesBefore);
    } finally {
      game.state._suppressExtraGoblinPlay = false;
    }
  }

  /** Shared AI score estimator for regular and animated Gooba cards. */
  function estimateGoobaAiValue(ctx) {
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

  /** Shared Blood Thrall onPlay handler for regular and animated Lothar cards. */
  function lotharOnPlay(ctx) {
    const { game, team, oppTeam, card, logType } = ctx;
    const myPlayer = game.state?.players?.[team];
    const oppPlayer = game.state?.players?.[oppTeam];
    if (!myPlayer || !oppPlayer) return;
    const eligible = [];
    ['melee', 'ranged'].forEach(rk => {
      (oppPlayer.rows[rk] || []).forEach(c => {
        const def = CARDS[c.id];
        const stars = Number(c.stars ?? def?.stars ?? 0);
        if (stars === 1 || stars === 2) {
          eligible.push({ card: c, rowKey: rk });
        }
      });
    });
    if (eligible.length === 0) {
      game.log(`🧛 ${card.name}'s Blood Thrall found no 1★ or 2★ enemy creatures to turn.`, logType);
      return;
    }
    const turnEnemyToAlly = (chosen) => {
      if (!chosen || !chosen.card) return;
      const rk = chosen.rowKey || 'melee';
      const list = oppPlayer.rows[rk] || [];
      const idx = list.findIndex(c => c.uid === chosen.card.uid);
      if (idx === -1) return;
      const [turned] = list.splice(idx, 1);
      if (!turned._originalOwnerTeam) turned._originalOwnerTeam = oppTeam;
      myPlayer.rows[rk].push(turned);
      window.soundFX?.playPoison?.();
      game.log(`🧛 ${card.name} turned ${turned.name} (${turned.power}) to your side for the rest of the round!`, logType);
    };
    if (game.isAiTeam ? game.isAiTeam(team) : (game.gameMode === 'ai' && team === 2)) {
      eligible.sort((a, b) => (b.card.power || 0) - (a.card.power || 0));
      turnEnemyToAlly(eligible[0]);
    } else {
      game.promptEnemyTargetChoice({
        team,
        logType,
        sourceName: card.name,
        title: '🧛 Blood Thrall — Turn an Enemy Creature',
        subtitle: `Choose a 1★ or 2★ enemy creature for <strong>${card.name}</strong> to turn to your side for the rest of the round:`,
        skipLog: `🧛 ${card.name} held Blood Thrall in reserve.`,
        accentColor: '#f43f5e',
        candidates: eligible,
        onSelect: turnEnemyToAlly
      });
    }
  }

  /** Shared AI score estimator for regular and animated Lothar cards. */
  function lotharAiScore(ctx) {
    const { game, oppTeam } = ctx;
    const oppRows = game.state?.players?.[oppTeam]?.rows;
    let bestEnemy = 0;
    if (oppRows) {
      ['melee', 'ranged'].forEach(rk => {
        (oppRows[rk] || []).forEach(c => {
          const s = Number(c.stars ?? CARDS[c.id]?.stars ?? 0);
          if (s === 1 || s === 2) bestEnemy = Math.max(bestEnemy, c.power || 0);
        });
      });
    }
    return 5 + 2 + bestEnemy * 2;
  }

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
      traditionalCardImg: 'Cards/Goblin_Soldier_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Goblin_Archer_Traditional.jpg',
      abilityTitle: 'Archer Muster',
      abilityDesc: 'When deployed, also play an extra Goblin Army card from your hand.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [],
      onPlay(ctx) {
        playExtraGoblinArmyFromHand(ctx, {
          sourceName: 'Goblin Archer',
          title: '🏹 Archer Muster',
          sound: 'whip',
          maxStars: Infinity
        });
      },
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const player = game.state?.players?.[team];
        const hasGoblinInHand = (player?.hand || []).some(c => {
          const def = CARDS[c.id];
          return (c.role || def?.role) === 'Goblin Army';
        });
        return 1 + (hasGoblinInHand ? 2 : 0);
      }
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
      traditionalCardImg: 'Cards/Orc_Infantry_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Orc_Slinger_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Werewolf_Pup_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Minerva_Wolf_Mother_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Rust_Bucket_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Scrap_Heap_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Manson_Wolf_Father_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Vampire_Thrall_Traditional.jpg',
      abilityTitle: 'Blood Leech',
      abilityDesc: 'Attacking returns half of the attack damage dealt to heal Vampire Thrall (up to its Base Power).',
      passiveTitle: 'Lifesteal',
      passiveDesc: 'Sustains itself in melee combat.',
      effects: []
    },

    vampire_bat: {
      id: 'vampire_bat',
      name: 'Vampire Bat',
      role: 'Vampire',
      element: 'poison',
      stars: 1,
      rarity: 'bronze',
      border: 'bronze',
      row: 'agile',
      basePower: 2,
      armor: 0,
      spawnOnDeath: { cardId: 'vampire_bat', count: 2, spawnPower: 1 },
      cardImg: 'Cards/Vampire_Bat_Card.jpg',
      traditionalCardImg: 'Cards/Vampire_Bat_Traditional.jpg',
      abilityTitle: 'Bat Swarm',
      abilityDesc: 'When killed, spawns 2 Vampire Bats at half Power (1). Spawned bats cannot split again.',
      passiveTitle: 'Split',
      passiveDesc: 'Spawns 2 half-health Vampire Bats once on death.',
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
      traditionalCardImg: 'Cards/Gooba_Goblin_King_Traditional.jpg',
      abilityTitle: 'Royal Decree',
      abilityDesc: 'When played, you may also play a 1- or 2-star Goblin Army card from your hand.',
      passiveTitle: 'Goblin Sovereign',
      passiveDesc: 'Commands the Goblin Army from the Ranged row.',
      effects: [],
      onPlay(ctx) {
        playExtraGoblinArmyFromHand(ctx, {
          sourceName: 'Gooba, Goblin King',
          title: '👑 Royal Decree',
          sound: 'howl',
          maxStars: 2,
          optional: true
        });
      },
      estimateAiValue(rowKey, ctx) {
        return estimateGoobaAiValue(ctx);
      }
    },

    gooba_goblin_king_animated: {
      id: 'gooba_goblin_king_animated',
      name: 'Gooba, Goblin King (Animated)',
      baseCardId: 'gooba_goblin_king',
      isAnimatedSpecial: true,
      role: 'Goblin Army',
      element: 'earth',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      row: 'ranged',
      basePower: 5,
      armor: 2,
      cardImg: 'Cards/Gooba_Goblin_King_Card.jpg',
      traditionalCardImg: 'Cards/Gooba_Goblin_King_Traditional.jpg',
      animatedCardVideo: 'Cards_Animated/Gooba_Goblin_King_Full_Art_Special.mp4',
      animatedTraditionalVideo: 'Cards_Animated/Gooba_Goblin_King_Traditional_Special.mp4',
      abilityTitle: 'Royal Decree',
      abilityDesc: 'When played, you may also play a 1- or 2-star Goblin Army card from your hand.',
      passiveTitle: 'Goblin Sovereign',
      passiveDesc: 'Commands the Goblin Army from the Ranged row.',
      effects: [],
      onPlay(ctx) {
        playExtraGoblinArmyFromHand(ctx, {
          sourceName: 'Gooba, Goblin King',
          title: '👑 Royal Decree',
          sound: 'howl',
          maxStars: 2,
          optional: true
        });
      },
      estimateAiValue(rowKey, ctx) {
        return estimateGoobaAiValue(ctx);
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
      traditionalCardImg: 'Cards/Mothman_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Jersey_Devil_Traditional.jpg',
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
      traditionalCardImg: 'Cards/Merfolk_Traditional.jpg',
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

    sea_dragon: {
      id: 'sea_dragon',
      name: 'Sea Dragon',
      role: 'Water Tribe',
      element: 'water',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'agile',
      basePower: 3,
      armor: 4,
      allowsMeleeWaterTribeToAttackRanged: true,
      cardImg: 'Cards/Sea_Dragon_Card.jpg',
      traditionalCardImg: 'Cards/Sea_Dragon_Traditional.jpg',
      abilityTitle: 'Tidal Charge',
      abilityDesc: "While in Melee, Sea Dragon and Water Tribe allies in Melee can attack the enemy's Ranged row.",
      passiveTitle: "Merman's Steed",
      passiveDesc: 'Grants ranged reach from Melee to itself and Water Tribe allies when in the Melee row.',
      effects: [],
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const meleeArr = game.state?.players?.[team]?.rows?.melee || [];
        const waterAllies = meleeArr.filter(c => c.role === 'Water Tribe').length;
        return 3 + 2 + (rowKey === 'melee' ? waterAllies * 1.0 : 0);
      }
    },

    pyromanda: {
      id: 'pyromanda',
      name: 'PyroManda',
      role: 'Lizard',
      element: 'fire',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      maxDeckCopies: 2,
      row: 'melee',
      basePower: 2,
      armor: 1,
      endOfTurnRandomAttacks: { count: 2, damage: 1 },
      cardImg: 'Cards/PyroManda_Card.jpg',
      traditionalCardImg: 'Cards/PyroManda_Traditional.jpg',
      abilityTitle: 'Ember Volley',
      abilityDesc: 'At the end of your turn, performs 2 attacks dealing 1 damage each to random enemy units.',
      passiveTitle: 'Ember Barrage',
      passiveDesc: 'Fires 2x 1-damage ember strikes at random enemies at turn end.',
      effects: [],
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const oppTeam = team === 1 ? 2 : 1;
        const hasEnemies = game.getAllBoardCards(oppTeam).length > 0;
        return 2 + 1 + (hasEnemies ? 2 : 0);
      }
    },

    frost_skink: {
      id: 'frost_skink',
      name: 'Frost Skink',
      role: 'Lizard',
      element: 'water',
      stars: 2,
      rarity: 'silver',
      border: 'silver',
      row: 'melee',
      basePower: 2,
      armor: 1,
      cardImg: 'Cards/Frost_Skink_Card.jpg',
      traditionalCardImg: 'Cards/Frost_Skink_Traditional.jpg',
      abilityTitle: 'Freeze',
      abilityDesc: 'When played, freezes a target enemy unit, stopping it from attacking on its next turn.',
      passiveTitle: 'Glacial Chill',
      passiveDesc: 'Frozen enemies cannot attack on their next turn.',
      effects: [
        {
          type: 'custom',
          run(ctx) {
            const { game, team, oppTeam, card, logType } = ctx;
            const oppRows = game.state?.players?.[oppTeam]?.rows;
            if (!oppRows) return;
            const enemies = [];
            ['melee', 'ranged'].forEach(rk => {
              (oppRows[rk] || []).forEach(c => {
                if (c && c.power > 0) enemies.push({ card: c, rowKey: rk });
              });
            });
            if (enemies.length === 0) {
              game.log(`❄️ ${card.name}'s Freeze found no enemy units to target.`, logType);
              return;
            }
            const applyFreeze = (targetCard) => {
              if (!targetCard) return;
              targetCard.frozenTurns = Math.max(targetCard.frozenTurns || 0, 1);
              window.soundFX?.playShieldBreak?.();
              game.log(`❄️ ${card.name} froze ${targetCard.name}! It cannot attack on its next turn.`, logType);
            };
            if (game.isAiTeam ? game.isAiTeam(team) : (game.gameMode === 'ai' && team === 2)) {
              const nonFrozen = enemies.filter(e => !(e.card.frozenTurns > 0));
              const pool = nonFrozen.length > 0 ? nonFrozen : enemies;
              pool.sort((a, b) => b.card.power - a.card.power);
              applyFreeze(pool[0].card);
            } else {
              game.promptEnemyTargetChoice({
                team,
                logType,
                sourceName: card.name,
                title: '❄️ Freeze — Choose an Enemy to Freeze',
                candidates: enemies,
                onSelect: (chosen) => applyFreeze(chosen.card)
              });
            }
          }
        }
      ],
      estimateAiValue(rowKey, ctx) {
        const { game, team } = ctx;
        const oppTeam = team === 1 ? 2 : 1;
        const hasEnemies = game.getAllBoardCards(oppTeam).length > 0;
        return 2 + 0.5 + (hasEnemies ? 2 : 0);
      }
    },

    krythos_the_basilisk: {
      id: 'krythos_the_basilisk',
      name: 'Krythos the Basilisk',
      role: 'Lizard',
      element: 'poison',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'melee',
      basePower: 4,
      armor: 4,
      cardImg: 'Cards/Krythos_the_Basilisk_Card.jpg',
      traditionalCardImg: 'Cards/Krythos_the_Basilisk_Traditional.jpg',
      abilityTitle: 'Corrosive Gaze',
      abilityDesc: 'When played, strips all Armor from every enemy unit in a chosen enemy row.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, team, oppTeam, card, logType } = ctx;
        const oppRows = game.state?.players?.[oppTeam]?.rows;
        if (!oppRows) return;
        const rowArmor = (rk) => (oppRows[rk] || []).reduce((sum, c) => sum + (c.armor || 0), 0);
        const totalArmor = rowArmor('melee') + rowArmor('ranged');
        if (totalArmor === 0) {
          game.log(`🦎 ${card.name}'s Corrosive Gaze found no enemy Armor to strip.`, logType);
          return;
        }
        const stripRow = (rk) => {
          const list = oppRows[rk] || [];
          let stripped = 0;
          list.forEach(c => {
            if (c.armor > 0) {
              stripped += c.armor;
              c.armor = 0;
            }
          });
          if (stripped > 0) {
            window.soundFX?.playShieldBreak?.();
            game.log(`🦎 ${card.name}'s Corrosive Gaze stripped ${stripped} Armor from the enemy ${rk === 'melee' ? 'Melee' : 'Ranged'} row!`, logType);
          }
        };
        if (game.isAiTeam ? game.isAiTeam(team) : (game.gameMode === 'ai' && team === 2)) {
          stripRow(rowArmor('melee') >= rowArmor('ranged') ? 'melee' : 'ranged');
        } else {
          game.promptEnemyRowChoice({
            team,
            oppTeam,
            logType,
            sourceName: card.name,
            title: '🦎 Corrosive Gaze — Strip Enemy Row Armor',
            subtitle: `Choose an enemy row for <strong>${card.name}</strong> to strip all Armor from:`,
            onSelect: (rk) => stripRow(rk)
          });
        }
      },
      estimateAiValue(rowKey, ctx) {
        const { game, oppTeam } = ctx;
        const oppRows = game.state?.players?.[oppTeam]?.rows;
        if (!oppRows) return 6;
        const mArmor = (oppRows.melee || []).reduce((s, c) => s + (c.armor || 0), 0);
        const rArmor = (oppRows.ranged || []).reduce((s, c) => s + (c.armor || 0), 0);
        return 4 + 2 + Math.max(mArmor, rArmor);
      }
    },

    lothar_vampire_prince: {
      id: 'lothar_vampire_prince',
      name: 'Lothar, Vampire Prince',
      role: 'Vampire',
      element: 'poison',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'melee',
      basePower: 5,
      armor: 2,
      cardImg: 'Cards/Lothar_Vampire_Prince_Card.jpg',
      traditionalCardImg: 'Cards/Lothar_Vampire_Prince_Traditional.jpg',
      abilityTitle: 'Blood Thrall',
      abilityDesc: 'When played, turns a 1★ or 2★ enemy creature to your side of the board for the rest of the round.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay: lotharOnPlay,
      aiScore: lotharAiScore
    },

    lothar_vampire_prince_animated: {
      id: 'lothar_vampire_prince_animated',
      name: 'Lothar, Vampire Prince (Animated)',
      baseCardId: 'lothar_vampire_prince',
      isAnimatedSpecial: true,
      role: 'Vampire',
      element: 'poison',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'melee',
      basePower: 5,
      armor: 2,
      cardImg: 'Cards/Lothar_Vampire_Prince_Card.jpg',
      traditionalCardImg: 'Cards/Lothar_Vampire_Prince_Traditional.jpg',
      animatedCardVideo: 'Cards_Animated/Lothar_Vampire_Prince_Full_Art_Special.mp4',
      animatedTraditionalVideo: 'Cards_Animated/Lothar_Vampire_Prince_Traditional_Special.mp4',
      abilityTitle: 'Blood Thrall',
      abilityDesc: 'When played, turns a 1★ or 2★ enemy creature to your side of the board for the rest of the round.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay: lotharOnPlay,
      aiScore: lotharAiScore
    },

    oscar_orc_giant: {
      id: 'oscar_orc_giant',
      name: 'Oscar, Orc Giant',
      role: 'Orc Army',
      element: 'metal',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'melee',
      basePower: 7,
      armor: 1,
      cardImg: 'Cards/Oscar_Orc_Giant_Card.jpg',
      traditionalCardImg: 'Cards/Oscar_Orc_Giant_Traditional.jpg',
      abilityTitle: "Titan's Rally",
      abilityDesc: 'Whenever an Orc Army card is deployed to his row, Oscar is healed to full health.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      aiScore() {
        return 6 + 2 + 1 + 2;
      }
    },

    armantha_the_witch: {
      id: 'armantha_the_witch',
      name: 'Armantha the Witch',
      role: 'Witch',
      element: 'magic',
      stars: 4,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'agile',
      basePower: 3,
      armor: 3,
      deflectOnce: true,
      cardImg: 'Cards/Armantha_the_Witch_Card.jpg',
      traditionalCardImg: 'Cards/Armantha_the_Witch_Traditional.jpg',
      abilityTitle: 'Hex Mirror',
      abilityDesc: 'Deflects the first attack sent at her back to a random enemy in either lane.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay(ctx) {
        if (ctx?.card) ctx.card.deflectOnce = true;
        const { game, team, card, logType } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        if (myRows && card) {
          const hasZavela = ['melee', 'ranged'].some(rk => (myRows[rk] || []).some(c => c.id === 'zavela_the_witch'));
          if (hasZavela) {
            card.shield = true;
            playSound('heal');
            game.log(`🔰 Zavela's Coven Ward granted a Shield to ${card.name}!`, logType);
          }
        }
      },
      aiScore() {
        return 3 + 3 + 3;
      }
    },

    zavela_the_witch: {
      id: 'zavela_the_witch',
      name: 'Zavela the Witch',
      role: 'Witch',
      element: 'magic',
      stars: 4,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'ranged',
      basePower: 2,
      armor: 3,
      cardImg: 'Cards/Zavela_the_Witch_Card.jpg',
      traditionalCardImg: 'Cards/Zavela_the_Witch_Traditional.jpg',
      abilityTitle: 'Coven Ward',
      abilityDesc: 'Grants a Shield to Armantha the Witch when Zavela is deployed or when Armantha is played.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, team, card, logType } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        if (!myRows) return;
        let shielded = 0;
        ['melee', 'ranged'].forEach(rk => {
          (myRows[rk] || []).forEach(c => {
            if (c && c.id === 'armantha_the_witch') {
              c.shield = true;
              shielded++;
            }
          });
        });
        if (shielded > 0) {
          playSound('heal');
          game.log(`🔰 ${card.name}'s Coven Ward granted a Shield to Armantha the Witch!`, logType);
        } else {
          game.log(`🌿 ${card.name} readies Coven Ward for Armantha the Witch.`, logType);
        }
      },
      aiScore(ctx) {
        const { game, team } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        const hasArmantha = myRows && ['melee', 'ranged'].some(rk => (myRows[rk] || []).some(c => c.id === 'armantha_the_witch'));
        return 2 + 3 + (hasArmantha ? 3 : 1);
      }
    },

    the_nieces: {
      id: 'the_nieces',
      name: 'The Nieces',
      role: 'Witch',
      element: 'magic',
      stars: 2,
      rarity: 'silver',
      border: 'silver',
      maxDeckCopies: 2,
      row: 'melee',
      basePower: 3,
      armor: 0,
      cardImg: 'Cards/The_Nieces_Card.jpg',
      traditionalCardImg: 'Cards/The_Nieces_Traditional.jpg',
      abilityTitle: 'Triple Mischief',
      abilityDesc: 'Deals 1 damage to 3 random enemies when played (+1 damage per other Witch on your board).',
      passiveTitle: 'Deck Limit: 2',
      passiveDesc: 'Limited to 2 copies per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, team, oppTeam, card, logType } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        const oppRows = game?.state?.players?.[oppTeam]?.rows;
        if (!oppRows) return;

        let otherWitches = 0;
        if (myRows) {
          ['melee', 'ranged'].forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if (c && c.role === 'Witch' && c.uid !== card?.uid) otherWitches++;
            });
          });
        }
        const dmg = 1 + otherWitches;

        const pool = [];
        ['melee', 'ranged'].forEach(rk => {
          (oppRows[rk] || []).forEach(u => {
            if (u) pool.push({ unit: u, rowKey: rk });
          });
        });
        if (pool.length === 0) return;

        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const picks = pool.slice(0, 3);
        playSound('magic');
        picks.forEach(p => game.damageUnit(p.unit, dmg, oppTeam, p.rowKey));
        game.log(`✨ ${card.name}'s Triple Mischief dealt ${dmg} damage to ${picks.length} enemy unit(s)!`, logType);
      },
      aiScore(ctx) {
        const { game, team, oppTeam } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        const oppRows = game?.state?.players?.[oppTeam]?.rows;
        let otherWitches = 0;
        if (myRows) {
          ['melee', 'ranged'].forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if (c && c.role === 'Witch') otherWitches++;
            });
          });
        }
        const enemyCount = oppRows ? ((oppRows.melee?.length || 0) + (oppRows.ranged?.length || 0)) : 0;
        return 3 + Math.min(3, enemyCount) * (1 + otherWitches);
      }
    },

    baby_lucia: {
      id: 'baby_lucia',
      name: 'Baby Lucia',
      role: 'Witch',
      element: 'magic',
      stars: 2,
      rarity: 'silver',
      border: 'silver',
      maxDeckCopies: 2,
      row: 'melee',
      basePower: 1,
      armor: 0,
      cardImg: 'Cards/Baby_Lucia_Card.jpg',
      traditionalCardImg: 'Cards/Baby_Lucia_Traditional.jpg',
      abilityTitle: 'Innocent Ward',
      abilityDesc: 'Unattackable through 3 turns after being played.',
      passiveTitle: 'Deck Limit: 2',
      passiveDesc: 'Limited to 2 copies per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, card, logType } = ctx || {};
        if (!card) return;
        card.unattackableTurns = 3;
        playSound('magic');
        game?.log(`✨ ${card.name} is protected by Innocent Ward and cannot be attacked for 3 turns!`, logType);
      },
      aiScore() {
        return 1 + 2;
      }
    },

    jank: {
      id: 'jank',
      name: 'Jank',
      role: 'Machine',
      element: 'metal',
      stars: 3,
      rarity: 'silver',
      border: 'silver',
      maxDeckCopies: 2,
      row: 'agile',
      basePower: 2,
      armor: 4,
      cardImg: 'Cards/Jank_Card.jpg',
      traditionalCardImg: 'Cards/Jank_Traditional.jpg',
      abilityTitle: 'Jury-Rig',
      abilityDesc: 'Grants Resilience to Scrap Heap when deployed while Scrap Heap is on your board.',
      passiveTitle: 'Deck Limit: 2',
      passiveDesc: 'Limited to 2 copies per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, team, card, logType } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        if (!myRows) return;
        let granted = 0;
        ['melee', 'ranged'].forEach(rk => {
          (myRows[rk] || []).forEach(c => {
            if (c && c.id === 'scrap_heap') {
              c.resilient = true;
              granted++;
            }
          });
        });
        if (granted > 0) {
          playSound('metal');
          game.log(`🛡️ ${card.name}'s Jury-Rig granted Resilience to Scrap Heap!`, logType);
        } else {
          game.log(`⚙️ ${card.name} sparked to life, but no Scrap Heap was on the board.`, logType);
        }
      },
      aiScore(ctx) {
        const { game, team } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        const hasScrapHeap = myRows && ['melee', 'ranged'].some(rk => (myRows[rk] || []).some(c => c.id === 'scrap_heap'));
        return 2 + 4 + (hasScrapHeap ? 3 : 0);
      }
    },

    jallopy: {
      id: 'jallopy',
      name: 'Jallopy',
      role: 'Machine',
      element: 'metal',
      stars: 5,
      rarity: 'gold',
      border: 'decorative-gold',
      maxDeckCopies: 1,
      row: 'ranged',
      basePower: 4,
      armor: 2,
      cardImg: 'Cards/Jallopy_Card.jpg',
      traditionalCardImg: 'Cards/Jallopy_Traditional.jpg',
      abilityTitle: 'Spare Bolts',
      abilityDesc: 'Grants +2 Armor to all allied Machines on your board when played.',
      passiveTitle: 'Deck Limit: 1',
      passiveDesc: 'Limited to 1 copy per playing deck.',
      effects: [],
      onPlay(ctx) {
        const { game, team, card, logType } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        if (!myRows) return;
        let buffed = 0;
        ['melee', 'ranged'].forEach(rk => {
          (myRows[rk] || []).forEach(c => {
            if (c && c.role === 'Machine' && c.uid !== card?.uid) {
              c.armor = (c.armor || 0) + 2;
              buffed++;
            }
          });
        });
        if (buffed > 0) {
          playSound('metal');
          game.log(`🔩 ${card.name}'s Spare Bolts granted +2 Armor to ${buffed} allied Machine(s) on your board!`, logType);
        } else {
          game.log(`⚙️ ${card.name} rattled into position with Spare Bolts ready.`, logType);
        }
      },
      aiScore(ctx) {
        const { game, team } = ctx || {};
        const myRows = game?.state?.players?.[team]?.rows;
        const alliedMachines = myRows
          ? ['melee', 'ranged'].reduce((sum, rk) => sum + (myRows[rk] || []).filter(c => c && c.role === 'Machine').length, 0)
          : 0;
        return 4 + 2 + alliedMachines * 2;
      }
    },

    koda_brother_bear: {
      id: 'koda_brother_bear',
      name: 'Koda, Brother Bear',
      role: 'Bear Family',
      element: 'earth',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'melee',
      basePower: 3,
      armor: 4,
      cardImg: 'Cards/Koda_Brother_Bear_Card.jpg',
      traditionalCardImg: 'Cards/Koda_Brother_Bear_Traditional.jpg',
      frameImg: 'Cards/Koda_Brother_Bear_Frame.png',
      abilityTitle: "Brother's Shield",
      abilityDesc: 'When deployed, add a Shield to any Bear Family cards to his immediate left and right.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'grant_adjacent_role_shield', roles: ['Bear Family'], sound: 'rock', label: "🔰 Brother's Shield" }
      ]
    },

    treena_sister_bear: {
      id: 'treena_sister_bear',
      name: 'Treena, Sister Bear',
      role: 'Bear Family',
      element: 'earth',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'ranged',
      basePower: 3,
      armor: 3,
      boostRoleAbility: { role: 'Bear Family', stat: 'armor', amount: 1, replacesAttack: true, icon: '🛡️' },
      cardImg: 'Cards/Treena_Sister_Bear_Card.jpg',
      traditionalCardImg: 'Cards/Treena_Sister_Bear_Traditional.jpg',
      frameImg: 'Cards/Treena_Sister_Bear_Frame.png',
      abilityTitle: "Sister's Ward",
      abilityDesc: 'Each turn, either attack or select an allied Bear Family card to give it +1 Armor.',
      passiveTitle: '',
      passiveDesc: '',
      effects: []
    },

    ralph_brother_bear: {
      id: 'ralph_brother_bear',
      name: 'Ralph, Brother Bear',
      role: 'Bear Family',
      element: 'earth',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'melee',
      basePower: 2,
      armor: 2,
      cardImg: 'Cards/Ralph_Brother_Bear_Card.jpg',
      traditionalCardImg: 'Cards/Ralph_Brother_Bear_Traditional.jpg',
      frameImg: 'Cards/Ralph_Brother_Bear_Frame.png',
      abilityTitle: 'Flank Formation',
      abilityDesc: 'On deploy, give +1 Power to Bear Family cards to his left and +1 Armor to those to his right.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [
        { type: 'directional_role_buff', roles: ['Bear Family'], leftPower: 1, rightArmor: 1, sound: 'rock', label: '🐻 Flank Formation' }
      ]
    },

    zorbo_brother_bear: {
      id: 'zorbo_brother_bear',
      name: 'Zorbo, Brother Bear',
      role: 'Bear Family',
      element: 'earth',
      stars: 3,
      rarity: 'gold',
      border: 'gold',
      row: 'melee',
      basePower: 2,
      armor: 1,
      cardImg: 'Cards/Zorbo_Brother_Bear_Card.jpg',
      traditionalCardImg: 'Cards/Zorbo_Brother_Bear_Traditional.jpg',
      frameImg: 'Cards/Zorbo_Brother_Bear_Frame.png',
      abilityTitle: 'Lazy Swipe',
      abilityDesc: 'On deploy, deal 1 damage to 3 adjoining enemy cards.',
      passiveTitle: '',
      passiveDesc: '',
      effects: [],
      onPlay(ctx) {
        const { game, team, oppTeam, card, logType } = ctx;
        const oppRows = game.state?.players?.[oppTeam]?.rows;
        if (!oppRows) return;
        const candidates = [];
        ['melee', 'ranged'].forEach(rk => {
          (oppRows[rk] || []).forEach(c => candidates.push({ card: c, rowKey: rk }));
        });
        if (candidates.length === 0) {
          game.log(`🐻 ${card.name} yawned — no enemy cards on the board to swat.`, logType);
          return;
        }
        const getCluster = (chosen) => {
          const rowArr = oppRows[chosen.rowKey] || [];
          const idx = rowArr.indexOf(chosen.card);
          if (idx === -1) return [];
          return [rowArr[idx - 1], rowArr[idx], rowArr[idx + 1]].filter(Boolean);
        };
        const strikeCluster = (chosen) => {
          const targets = getCluster(chosen);
          if (targets.length === 0) return;
          targets.forEach(t => game.damageUnit(t, 1, oppTeam, chosen.rowKey));
          playSound('rock');
          game.log(`🐻 ${card.name}'s Lazy Swipe dealt 1 damage to ${targets.map(t => t.name).join(', ')}!`, logType);
        };
        if (game.isAiTeam ? game.isAiTeam(team) : (game.gameMode === 'ai' && team === 2)) {
          let best = candidates[0];
          let bestScore = -1;
          candidates.forEach(cand => {
            const cl = getCluster(cand);
            const score = cl.length * 100 + cl.reduce((s, u) => s + (u.power || 0), 0);
            if (score > bestScore) {
              bestScore = score;
              best = cand;
            }
          });
          strikeCluster(best);
        } else {
          game.promptEnemyTargetChoice({
            team,
            logType,
            sourceName: card.name,
            title: '🐻 Lazy Swipe — Choose Center Target',
            subtitle: 'Select an enemy card to deal 1 damage to it and the cards immediately to its left and right (up to 3 adjoining cards):',
            skipLog: '🐻 Zorbo yawned and skipped Lazy Swipe.',
            accentColor: '#f59e0b',
            candidates,
            onSelect: strikeCluster
          });
        }
      },
      aiScore(ctx) {
        const { game, oppTeam } = ctx || {};
        const oppRows = game?.state?.players?.[oppTeam]?.rows;
        let bestCluster = 0;
        if (oppRows) {
          ['melee', 'ranged'].forEach(rk => {
            const len = (oppRows[rk] || []).length;
            if (len > 0) bestCluster = Math.max(bestCluster, Math.min(3, len));
          });
        }
        return 2 + 0.5 + bestCluster;
      }
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
      'vampire_bat', 'vampire_bat',
      'gooba_goblin_king',
      'mothman', 'mothman',
      'jersey_devil',
      'merfolk', 'merfolk', 'merfolk',
      'sea_dragon',
      'pyromanda',
      'frost_skink', 'frost_skink',
      'krythos_the_basilisk',
      'lothar_vampire_prince',
      'oscar_orc_giant',
      'armantha_the_witch',
      'zavela_the_witch',
      'the_nieces', 'the_nieces',
      'baby_lucia', 'baby_lucia',
      'jank', 'jank',
      'jallopy',
      'koda_brother_bear',
      'treena_sister_bear',
      'ralph_brother_bear',
      'zorbo_brother_bear'
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

    // Passive: Oscar, Orc Giant heals to full health whenever an Orc Army card is deployed to his row
    const playedRole = cardDef?.role || card?.role;
    if (playedRole === 'Orc Army' && targetRow && myRows[targetRow]) {
      myRows[targetRow].forEach(ally => {
        if (ally && ally.id === 'oscar_orc_giant' && ally.uid !== card?.uid) {
          const fullPower = Number(ally.basePower) || 7;
          if ((ally.power || 0) < fullPower) {
            const healed = fullPower - (ally.power || 0);
            ally.power = fullPower;
            playSound('heal');
            game.log(`🛡️ ${ally.name}'s Titan's Rally healed him by +${healed} back to full health (${fullPower} Power)!`, logType);
          }
        }
      });
    }

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
            game.log(`${eff.label || '🐺 Howl'} doubled the Power of ${count} Wolf Pack unit(s)!`, logType);
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
            game.log(`${eff.label || '🛡️ Pack Armor'} granted +${amt} Armor to ${count} ${allowedRoles.join('/')} unit(s)!`, logType);
          }
          break;
        }
        case 'grant_role_shield': {
          const allowedRoles = eff.roles || [];
          let count = 0;
          ['melee', 'ranged'].forEach(rk => {
            (myRows[rk] || []).forEach(c => {
              if ((!eff.excludeSelf || c.uid !== card.uid) && allowedRoles.includes(c.role) && !c.shield) {
                c.shield = true;
                count++;
              }
            });
          });
          if (count > 0) {
            playSound(eff.sound || 'rock');
            game.log(`${eff.label || '🔰 Shield'} granted Shield to ${count} ${allowedRoles.join('/')} unit(s)!`, logType);
          }
          break;
        }
        case 'grant_adjacent_role_shield': {
          const allowedRoles = eff.roles || [];
          const rowArr = myRows[targetRow] || [];
          const idx = rowArr.indexOf(card);
          const neighbors = idx === -1 ? [] : [rowArr[idx - 1], rowArr[idx + 1]].filter(Boolean);
          const shieldedNames = [];
          neighbors.forEach(n => {
            if (allowedRoles.includes(n.role) && !n.shield) {
              n.shield = true;
              shieldedNames.push(n.name);
            }
          });
          if (shieldedNames.length > 0) {
            playSound(eff.sound || 'rock');
            game.log(`${eff.label || '🔰 Shield'} granted Shield to adjacent ${shieldedNames.join(' & ')}!`, logType);
          }
          break;
        }
        case 'directional_role_buff': {
          const allowedRoles = eff.roles || [];
          const rowArr = myRows[targetRow] || [];
          const idx = rowArr.indexOf(card);
          const leftPower = eff.leftPower || 0;
          const rightArmor = eff.rightArmor || 0;
          let leftCount = 0;
          let rightCount = 0;
          if (idx !== -1) {
            for (let i = 0; i < idx; i++) {
              const ally = rowArr[i];
              if (ally && allowedRoles.includes(ally.role) && leftPower > 0) {
                ally.power += leftPower;
                leftCount++;
              }
            }
            for (let i = idx + 1; i < rowArr.length; i++) {
              const ally = rowArr[i];
              if (ally && allowedRoles.includes(ally.role) && rightArmor > 0) {
                ally.armor = (ally.armor || 0) + rightArmor;
                rightCount++;
              }
            }
          }
          if (leftCount > 0 || rightCount > 0) {
            playSound(eff.sound || 'rock');
            const parts = [];
            if (leftCount > 0) parts.push(`+${leftPower} Power to ${leftCount} Bear Family ally left`);
            if (rightCount > 0) parts.push(`+${rightArmor} Armor to ${rightCount} Bear Family ally right`);
            game.log(`${eff.label || '🐻 Flank Formation'} granted ${parts.join(' and ')}!`, logType);
          }
          break;
        }
        case 'custom': {
          if (typeof eff.run === 'function') {
            eff.run(ctx);
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
    if (typeof cardDef?.aiScore === 'function') {
      return cardDef.aiScore(ctx);
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

    // Passive valuation: Oscar, Orc Giant heals to full health whenever an Orc Army card is deployed to his row
    const playedRole = cardDef?.role || card?.role;
    if (playedRole === 'Orc Army' && rowKey && myRows[rowKey]) {
      myRows[rowKey].forEach(ally => {
        if (ally && ally.id === 'oscar_orc_giant' && ally.uid !== card?.uid) {
          const fullPower = Number(ally.basePower) || 7;
          if ((ally.power || 0) < fullPower) {
            est += fullPower - (ally.power || 0);
          }
        }
      });
    }

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
        case 'grant_role_shield': {
          const allowedRoles = eff.roles || [];
          const matches = game.getAllBoardCards(team).filter(c => allowedRoles.includes(c.role) && !c.shield).length;
          est += matches * 2 + (eff.excludeSelf ? 0 : 2);
          break;
        }
        case 'grant_adjacent_role_shield': {
          const allowedRoles = eff.roles || [];
          const rowArr = myRows[rowKey] || [];
          const last = rowArr[rowArr.length - 1];
          if (last && allowedRoles.includes(last.role) && !last.shield) est += 2;
          break;
        }
        case 'directional_role_buff': {
          const allowedRoles = eff.roles || [];
          const rowArr = myRows[rowKey] || [];
          const matches = rowArr.filter(c => allowedRoles.includes(c.role)).length;
          est += matches * (eff.leftPower || 1);
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
    getMaxDeckCopies(cardOrId) {
      const def = typeof cardOrId === 'string' ? CARDS[cardOrId] : cardOrId;
      if (!def) return 3;
      const starLimit = (Number(def.stars) || 1) >= 4 ? 1 : 3;
      return typeof def.maxDeckCopies === 'number' ? Math.min(def.maxDeckCopies, starLimit) : starLimit;
    },
    getCanonicalCardId(cardOrId) {
      const def = typeof cardOrId === 'string' ? CARDS[cardOrId] : cardOrId;
      return def?.baseCardId || def?.id || (typeof cardOrId === 'string' ? cardOrId : '');
    },
    getAnimatedVariantId(baseId) {
      const match = Object.values(CARDS).find(c => c && c.isAnimatedSpecial && c.baseCardId === baseId);
      return match?.id || null;
    },
    executeEffects,
    estimateCardValue,
    /** Plays a card animation video once (never loops), falling back to muted if unmuted autoplay is blocked. */
    playCardVideoOnce(videoEl, { onEnded } = {}) {
      if (!videoEl) return;
      videoEl.loop = false;
      videoEl.playsInline = true;
      videoEl.setAttribute('playsinline', '');
      videoEl.muted = false;

      if (videoEl._mythosEndedHandler) {
        videoEl.removeEventListener('ended', videoEl._mythosEndedHandler);
      }
      const handleEnded = () => {
        videoEl._mythosEndedHandler = null;
        if (typeof onEnded === 'function') onEnded(videoEl);
      };
      videoEl._mythosEndedHandler = handleEnded;
      videoEl.addEventListener('ended', handleEnded, { once: true });

      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {
            if (typeof onEnded === 'function') onEnded(videoEl);
          });
        });
      }
    }
  };
})();
