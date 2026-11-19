(() => {
  'use strict';

  const CardReg = window.MythosGwentCards;
  const CARDS = CardReg.CARDS;
  const simGame = new window.BeastsGame({ headless: true, gameMode: 'sim' });

  const NPC_LABELS = {
    pluto: 'Pluto (Machine)',
    silas: 'Silas (Orc Army)',
    best_friend: 'Best Friend (Goblin Army)',
    rowan: 'Rowan (Monster)',
    chloe: 'Chloe (Wolf Pack)',
    clara: 'Clara (Wolf Pack)',
    bram: 'Bram (Orc Army)',
    mayor_donald: 'Mayor Donald (Lizard)',
    mom: 'Mom (Water Tribe)',
    shopkeeper: 'Shopkeeper (Monster)',
    chef_marco: 'Chef Marco (Lizard)',
    shaun: 'Shaun (Vampire)'
  };

  const ROLES = Array.from(new Set(Object.values(CARDS).filter(c => !c.isToken).map(c => c.role))).sort();
  const ELEMENTS = Array.from(new Set(Object.values(CARDS).filter(c => !c.isToken).map(c => c.element))).sort();
  const CARD_LIST = Object.values(CARDS).filter(c => !c.isToken).sort((a, b) => a.stars - b.stars || a.name.localeCompare(b.name));

  let isRunning = false;
  let cancelRequested = false;
  let lastResults = null;
  let sortState = { key: 'playedWr', dir: 'desc' };

  function buildFocusedRoleDeck(roleName) {
    const roleCards = CARD_LIST.filter(c => c.role === roleName).sort((a, b) => b.stars - a.stars);
    const deck = [];
    let stars = 0;
    const minCards = 18;
    const maxStars = 40;
    roleCards.forEach(c => {
      const limit = CardReg.getMaxDeckCopies ? CardReg.getMaxDeckCopies(c.id) : (c.stars >= 4 ? 1 : (c.maxDeckCopies ?? 3));
      for (let i = 0; i < limit; i++) {
        const rem = Math.max(0, minCards - (deck.length + 1));
        if (stars + c.stars + rem <= maxStars && deck.length < 22) {
          deck.push(c.id);
          stars += c.stars;
        }
      }
    });
    return deck;
  }

  function buildFocusedCardDeck(cardId) {
    const c = CARDS[cardId];
    if (!c) return null;
    const limit = CardReg.getMaxDeckCopies ? CardReg.getMaxDeckCopies(cardId) : (c.stars >= 4 ? 1 : (c.maxDeckCopies ?? 3));
    const deck = [];
    for (let i = 0; i < limit; i++) deck.push(cardId);
    return deck;
  }

  function resolveDeckOption(value) {
    if (!value || value === 'random') return null;
    if (value.startsWith('npc:')) {
      const npcId = value.slice(4);
      return simGame.getNpcSetDeck(npcId);
    }
    if (value.startsWith('role:')) {
      return buildFocusedRoleDeck(value.slice(5));
    }
    if (value.startsWith('card:')) {
      return buildFocusedCardDeck(value.slice(5));
    }
    return null;
  }

  function formatOptionLabel(value) {
    if (!value || value === 'random') return 'Random Legal Deck';
    if (value.startsWith('npc:')) return NPC_LABELS[value.slice(4)] || value.slice(4);
    if (value.startsWith('role:')) return `${value.slice(5)} Focus`;
    if (value.startsWith('card:')) return `${CARDS[value.slice(5)]?.name || value.slice(5)} Focus`;
    return value;
  }

  function createEmptyStats(totalGames, p1Label, p2Label) {
    const cardStats = {};
    CARD_LIST.forEach(c => {
      cardStats[c.id] = {
        id: c.id,
        name: c.name,
        role: c.role,
        element: c.element,
        stars: c.stars,
        rarity: c.rarity,
        basePower: c.basePower,
        armor: c.armor || 0,
        deckAppearances: 0,
        deckWins: 0,
        timesPlayed: 0,
        playedWins: 0,
        matchesPlayedIn: 0,
        matchesPlayedWins: 0
      };
    });

    const roleStats = {};
    ROLES.forEach(r => { roleStats[r] = { name: r, played: 0, wins: 0 }; });

    const elementStats = {};
    ELEMENTS.forEach(e => { elementStats[e] = { name: e, played: 0, wins: 0 }; });

    const starStats = {};
    [1, 2, 3, 4, 5].forEach(s => { starStats[s] = { name: `${s}★`, stars: s, played: 0, wins: 0 }; });

    return {
      totalGames,
      completedGames: 0,
      p1Label,
      p2Label,
      p1Wins: 0,
      p2Wins: 0,
      firstMoverWins: 0,
      secondMoverWins: 0,
      sweeps20: 0,
      threeRounders: 0,
      totalRounds: 0,
      roundScoreSums: { 1: { s1: 0, s2: 0, count: 0 }, 2: { s1: 0, s2: 0, count: 0 }, 3: { s1: 0, s2: 0, count: 0 } },
      cardStats,
      roleStats,
      elementStats,
      starStats,
      pairStats: {},
      openerStats: {},
      stackStats: {},
      passStats: {
        r1Timing: {
          dry: { label: 'Dry Pass (0 turns)', games: 0, wins: 0 },
          early: { label: 'Early Pass (1–3 turns)', games: 0, wins: 0 },
          mid: { label: 'Mid Pass (4–5 turns)', games: 0, wins: 0 },
          deep: { label: 'Deep / Exhausted (6+ turns)', games: 0, wins: 0 }
        },
        context: {
          r1Ahead: { label: 'R1 Tempo Pass (Passed Ahead)', games: 0, wins: 0 },
          r1Behind: { label: 'R1 Concede Pass (Passed Behind)', games: 0, wins: 0 },
          r2DryPass: { label: 'R2 Dry Pass (0 turns in R2)', games: 0, wins: 0 },
          autoEmpty: { label: 'Auto-Pass (Out of Cards)', games: 0, wins: 0 }
        },
        r1WinnerHandSum: 0,
        r1WinnerHandCount: 0,
        r1LoserHandSum: 0,
        r1LoserHandCount: 0
      },
      macroStats: {
        r1WinMatchWins: 0,
        r1WinMatches: 0,
        r1LossMatchWins: 0,
        r1LossMatches: 0,
        handAdv1PlusWins: 0,
        handAdv1PlusGames: 0,
        handAdv2PlusWins: 0,
        handAdv2PlusGames: 0,
        r1LossAdv1Wins: 0,
        r1LossAdv1Games: 0,
        r1LossAdv2Wins: 0,
        r1LossAdv2Games: 0,
        r1LossAdv3Wins: 0,
        r1LossAdv3Games: 0,
        r1LossNoAdvWins: 0,
        r1LossNoAdvGames: 0,
        r3AdvBuckets: {
          '-3-': { games: 0, wins: 0 },
          '-2': { games: 0, wins: 0 },
          '-1': { games: 0, wins: 0 },
          '0': { games: 0, wins: 0 },
          '+1': { games: 0, wins: 0 },
          '+2': { games: 0, wins: 0 },
          '+3+': { games: 0, wins: 0 }
        },
        resilientCarryWins: 0,
        resilientCarryGames: 0,
        maxRoundScore: 0,
        maxRoundScoreInfo: '',
        maxCardPower: 0,
        maxCardPowerInfo: '',
        stepLimitHits: 0
      },
      elapsedMs: 0
    };
  }

  function recordMatch(stats, res) {
    stats.completedGames++;
    if (res.hitStepLimit) stats.macroStats.stepLimitHits++;
    if (res.winner === 1) stats.p1Wins++;
    else stats.p2Wins++;

    if (res.winner === res.firstTeam) stats.firstMoverWins++;
    else stats.secondMoverWins++;

    if (res.roundsPlayed <= 2) stats.sweeps20++;
    else stats.threeRounders++;

    stats.totalRounds += res.roundsPlayed;
    res.roundScores.forEach(rs => {
      const bucket = stats.roundScoreSums[rs.round];
      if (bucket) {
        bucket.s1 += rs.s1;
        bucket.s2 += rs.s2;
        bucket.count++;
      }
      if (rs.s1 > stats.macroStats.maxRoundScore) {
        stats.macroStats.maxRoundScore = rs.s1;
        stats.macroStats.maxRoundScoreInfo = `R${rs.round} (${rs.s1} vs ${rs.s2})`;
      }
      if (rs.s2 > stats.macroStats.maxRoundScore) {
        stats.macroStats.maxRoundScore = rs.s2;
        stats.macroStats.maxRoundScoreInfo = `R${rs.round} (${rs.s2} vs ${rs.s1})`;
      }
      if ((rs.p1MaxPwr || 0) > stats.macroStats.maxCardPower) {
        stats.macroStats.maxCardPower = rs.p1MaxPwr;
        stats.macroStats.maxCardPowerInfo = `P1 in R${rs.round}`;
      }
      if ((rs.p2MaxPwr || 0) > stats.macroStats.maxCardPower) {
        stats.macroStats.maxCardPower = rs.p2MaxPwr;
        stats.macroStats.maxCardPowerInfo = `P2 in R${rs.round}`;
      }
    });

    // Passing technique telemetry
    (res.passEvents || []).forEach(ev => {
      const won = ev.team === res.winner;
      const ps = stats.passStats;

      if (ev.round === 1) {
        const t = ev.turnsPlayed;
        const bucket = t === 0 ? ps.r1Timing.dry : (t <= 3 ? ps.r1Timing.early : (t <= 5 ? ps.r1Timing.mid : ps.r1Timing.deep));
        bucket.games++;
        if (won) bucket.wins++;

        if (won) {
          ps.r1WinnerHandSum += ev.handLeft;
          ps.r1WinnerHandCount++;
        } else {
          ps.r1LoserHandSum += ev.handLeft;
          ps.r1LoserHandCount++;
        }

        if (!ev.oppPassed && !ev.autoOutOfCards) {
          if (ev.ahead) {
            ps.context.r1Ahead.games++;
            if (won) ps.context.r1Ahead.wins++;
          } else if (ev.behind) {
            ps.context.r1Behind.games++;
            if (won) ps.context.r1Behind.wins++;
          }
        }
      }

      if (ev.round === 2 && ev.turnsPlayed === 0 && !ev.oppPassed && !ev.autoOutOfCards) {
        ps.context.r2DryPass.games++;
        if (won) ps.context.r2DryPass.wins++;
      }

      if (ev.autoOutOfCards) {
        ps.context.autoEmpty.games++;
        if (won) ps.context.autoEmpty.wins++;
      }
    });

    // Macro: Round 1 winner, Hand advantage entering R2, Resilient carryover
    const r1 = res.roundScores[0];
    if (r1) {
      if (r1.s1 > r1.s2) {
        stats.macroStats.r1WinMatches++;
        if (res.winner === 1) stats.macroStats.r1WinMatchWins++;
        stats.macroStats.r1LossMatches++;
        if (res.winner === 2) stats.macroStats.r1LossMatchWins++;
      } else if (r1.s2 > r1.s1) {
        stats.macroStats.r1WinMatches++;
        if (res.winner === 2) stats.macroStats.r1WinMatchWins++;
        stats.macroStats.r1LossMatches++;
        if (res.winner === 1) stats.macroStats.r1LossMatchWins++;
      }

      if (typeof r1.p1HandAfter === 'number' && typeof r1.p2HandAfter === 'number') {
        const diff1 = r1.p1HandAfter - r1.p2HandAfter;
        const diff2 = r1.p2HandAfter - r1.p1HandAfter;
        if (diff1 >= 1) {
          stats.macroStats.handAdv1PlusGames++;
          if (res.winner === 1) stats.macroStats.handAdv1PlusWins++;
        }
        if (diff2 >= 1) {
          stats.macroStats.handAdv1PlusGames++;
          if (res.winner === 2) stats.macroStats.handAdv1PlusWins++;
        }
        if (diff1 >= 2) {
          stats.macroStats.handAdv2PlusGames++;
          if (res.winner === 1) stats.macroStats.handAdv2PlusWins++;
        }
        if (diff2 >= 2) {
          stats.macroStats.handAdv2PlusGames++;
          if (res.winner === 2) stats.macroStats.handAdv2PlusWins++;
        }

        // Specifically when a side LOST Round 1, track its win rate by card advantage entering R2
        if (r1.s1 !== r1.s2) {
          const r1Loser = r1.s1 < r1.s2 ? 1 : 2;
          const loserAdv = r1Loser === 1 ? diff1 : diff2;
          const loserWonMatch = res.winner === r1Loser;
          if (loserAdv >= 1) {
            stats.macroStats.r1LossAdv1Games++;
            if (loserWonMatch) stats.macroStats.r1LossAdv1Wins++;
          }
          if (loserAdv >= 2) {
            stats.macroStats.r1LossAdv2Games++;
            if (loserWonMatch) stats.macroStats.r1LossAdv2Wins++;
          }
          if (loserAdv >= 3) {
            stats.macroStats.r1LossAdv3Games++;
            if (loserWonMatch) stats.macroStats.r1LossAdv3Wins++;
          }
          if (loserAdv <= 0) {
            stats.macroStats.r1LossNoAdvGames++;
            if (loserWonMatch) stats.macroStats.r1LossNoAdvWins++;
          }
        }
      }

      if ((r1.p1Resilient || 0) > 0) {
        stats.macroStats.resilientCarryGames++;
        if (res.winner === 1) stats.macroStats.resilientCarryWins++;
      }
      if ((r1.p2Resilient || 0) > 0) {
        stats.macroStats.resilientCarryGames++;
        if (res.winner === 2) stats.macroStats.resilientCarryWins++;
      }
    }

    const r2 = res.roundScores[1];
    if (r2 && res.roundsPlayed >= 3 && typeof r2.p1HandAfter === 'number' && typeof r2.p2HandAfter === 'number') {
      const bucketKey = (diff) => {
        if (diff <= -3) return '-3-';
        if (diff === -2) return '-2';
        if (diff === -1) return '-1';
        if (diff === 0) return '0';
        if (diff === 1) return '+1';
        if (diff === 2) return '+2';
        return '+3+';
      };
      const d1 = r2.p1HandAfter - r2.p2HandAfter;
      const d2 = -d1;
      const b1 = stats.macroStats.r3AdvBuckets[bucketKey(d1)];
      const b2 = stats.macroStats.r3AdvBuckets[bucketKey(d2)];
      b1.games++;
      if (res.winner === 1) b1.wins++;
      b2.games++;
      if (res.winner === 2) b2.wins++;
    }

    // Deck presence (count unique card appearances per team-match)
    const recordDeckPresence = (deckIds, teamWon) => {
      const seen = new Set(deckIds);
      seen.forEach(id => {
        const cs = stats.cardStats[id];
        if (!cs) return;
        cs.deckAppearances++;
        if (teamWon) cs.deckWins++;
      });
    };
    recordDeckPresence(res.p1DeckIds, res.winner === 1);
    recordDeckPresence(res.p2DeckIds, res.winner === 2);

    // Cards actually played during the match
    const playedPerTeam = { 1: new Set(), 2: new Set() };
    const playCountsPerTeam = { 1: {}, 2: {} };
    const r1Opener = { 1: null, 2: null };

    res.cardsPlayed.forEach(ev => {
      const cs = stats.cardStats[ev.id];
      if (!cs) return;
      const won = ev.team === res.winner;
      cs.timesPlayed++;
      if (won) cs.playedWins++;
      playedPerTeam[ev.team].add(ev.id);
      playCountsPerTeam[ev.team][ev.id] = (playCountsPerTeam[ev.team][ev.id] || 0) + 1;
      if (ev.round === 1 && !r1Opener[ev.team]) {
        r1Opener[ev.team] = ev.id;
      }

      const rs = stats.roleStats[cs.role];
      if (rs) {
        rs.played++;
        if (won) rs.wins++;
      }
      const es = stats.elementStats[cs.element];
      if (es) {
        es.played++;
        if (won) es.wins++;
      }
      const ss = stats.starStats[cs.stars];
      if (ss) {
        ss.played++;
        if (won) ss.wins++;
      }
    });

    [1, 2].forEach(t => {
      const won = res.winner === t;
      const uniqueIds = Array.from(playedPerTeam[t]).sort();
      uniqueIds.forEach(id => {
        const cs = stats.cardStats[id];
        if (!cs) return;
        cs.matchesPlayedIn++;
        if (won) cs.matchesPlayedWins++;

        // Copy-stacking stats (1 copy played vs 2+ copies played)
        const cnt = playCountsPerTeam[t][id] || 1;
        if (!stats.stackStats[id]) {
          stats.stackStats[id] = { id, name: cs.name, oneGames: 0, oneWins: 0, multiGames: 0, multiWins: 0 };
        }
        if (cnt >= 2) {
          stats.stackStats[id].multiGames++;
          if (won) stats.stackStats[id].multiWins++;
        } else {
          stats.stackStats[id].oneGames++;
          if (won) stats.stackStats[id].oneWins++;
        }
      });

      // Round 1 opener stats
      const opId = r1Opener[t];
      if (opId && stats.cardStats[opId]) {
        if (!stats.openerStats[opId]) {
          stats.openerStats[opId] = { id: opId, name: stats.cardStats[opId].name, role: stats.cardStats[opId].role, games: 0, wins: 0 };
        }
        stats.openerStats[opId].games++;
        if (won) stats.openerStats[opId].wins++;
      }

      // 2-Card Combo Synergy stats
      for (let i = 0; i < uniqueIds.length; i++) {
        for (let j = i + 1; j < uniqueIds.length; j++) {
          const a = uniqueIds[i];
          const b = uniqueIds[j];
          const key = `${a}|${b}`;
          if (!stats.pairStats[key]) {
            stats.pairStats[key] = { a, b, games: 0, wins: 0 };
          }
          stats.pairStats[key].games++;
          if (won) stats.pairStats[key].wins++;
        }
      }
    });
  }

  function pct(num, den) {
    if (!den) return 0;
    return (num / den) * 100;
  }

  function fmtPct(num, den) {
    if (!den) return '—';
    return `${((num / den) * 100).toFixed(1)}%`;
  }

  function renderResults(stats) {
    lastResults = stats;
    const n = stats.completedGames || 1;

    document.getElementById('kpi-games').textContent = stats.completedGames.toLocaleString();
    document.getElementById('kpi-speed').textContent = stats.elapsedMs > 0
      ? `${Math.round((stats.completedGames / stats.elapsedMs) * 1000).toLocaleString()} games/sec`
      : '—';

    document.getElementById('kpi-p1-win').textContent = fmtPct(stats.p1Wins, n);
    document.getElementById('kpi-p1-sub').textContent = `${stats.p1Wins}W – ${stats.p2Wins}L (${stats.p1Label})`;

    document.getElementById('kpi-first-win').textContent = fmtPct(stats.firstMoverWins, n);
    document.getElementById('kpi-first-sub').textContent = `2nd Player: ${fmtPct(stats.secondMoverWins, n)}`;

    document.getElementById('kpi-rounds').textContent = (stats.totalRounds / n).toFixed(2);
    document.getElementById('kpi-rounds-sub').textContent = `2–0 Sweeps: ${fmtPct(stats.sweeps20, n)} • 2–1: ${fmtPct(stats.threeRounders, n)}`;

    const r1 = stats.roundScoreSums[1];
    const r2 = stats.roundScoreSums[2];
    const r3 = stats.roundScoreSums[3];
    const avgScoreStr = [
      r1.count ? `R1: ${((r1.s1 + r1.s2) / (2 * r1.count)).toFixed(1)}` : null,
      r2.count ? `R2: ${((r2.s1 + r2.s2) / (2 * r2.count)).toFixed(1)}` : null,
      r3.count ? `R3: ${((r3.s1 + r3.s2) / (2 * r3.count)).toFixed(1)}` : null
    ].filter(Boolean).join(' • ');
    document.getElementById('kpi-scores').textContent = r1.count ? `${((r1.s1 + r1.s2) / (2 * r1.count)).toFixed(1)}` : '—';
    document.getElementById('kpi-scores-sub').textContent = avgScoreStr || 'Avg score per side';

    renderBreakdownBars('role-breakdown', Object.values(stats.roleStats));
    renderBreakdownBars('element-breakdown', Object.values(stats.elementStats));
    renderBreakdownBars('star-breakdown', Object.values(stats.starStats), true);
    renderPassingInsights(stats);
    renderExploitsAndInsights(stats);
    renderCardTable(stats);

    document.getElementById('results-section').classList.remove('hidden');
  }

  function renderPassingInsights(stats) {
    const ps = stats.passStats;
    const renderPassRows = (elId, items) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = items.map(item => {
        const wr = item.games ? pct(item.wins, item.games) : 0;
        const cls = !item.games ? 'neutral' : (wr >= 55 ? 'high' : (wr <= 45 ? 'low' : 'neutral'));
        return `
          <div class="bar-row">
            <div class="bar-label" style="min-width:175px;" title="${item.label}">${item.label}</div>
            <div class="bar-track">
              <div class="bar-fill ${cls}" style="width: ${Math.min(100, wr).toFixed(1)}%"></div>
            </div>
            <div class="bar-val ${cls}">${item.games ? wr.toFixed(1) + '%' : '—'}</div>
            <div class="bar-count">${item.games.toLocaleString()}</div>
          </div>
        `;
      }).join('');
    };

    renderPassRows('pass-timing-breakdown', Object.values(ps.r1Timing));
    renderPassRows('pass-context-breakdown', Object.values(ps.context));

    const handSummaryEl = document.getElementById('pass-hand-summary');
    if (handSummaryEl) {
      const wAvg = ps.r1WinnerHandCount ? (ps.r1WinnerHandSum / ps.r1WinnerHandCount).toFixed(2) : '—';
      const lAvg = ps.r1LoserHandCount ? (ps.r1LoserHandSum / ps.r1LoserHandCount).toFixed(2) : '—';
      handSummaryEl.textContent = `Avg cards remaining in hand on R1 pass — Match Winners: ${wAvg} cards • Match Losers: ${lAvg} cards`;
    }
  }

  function renderExploitsAndInsights(stats) {
    const m = stats.macroStats;
    const minSample = Math.max(5, Math.floor(stats.completedGames * 0.04));

    // Macro Strategy KPIs
    const macroEl = document.getElementById('macro-insights');
    if (macroEl) {
      const r1WinWr = fmtPct(m.r1WinMatchWins, m.r1WinMatches);
      const r1LossWr = fmtPct(m.r1LossMatchWins, m.r1LossMatches);
      const hand1Wr = fmtPct(m.handAdv1PlusWins, m.handAdv1PlusGames);
      const hand2Wr = fmtPct(m.handAdv2PlusWins, m.handAdv2PlusGames);
      const resWr = fmtPct(m.resilientCarryWins, m.resilientCarryGames);

      macroEl.innerHTML = `
        <div class="insight-item">
          <div class="insight-lbl">Win Round 1 → Win Match</div>
          <div class="insight-val">${r1WinWr}</div>
          <div class="insight-sub">Lose R1 comeback: ${r1LossWr} (${m.r1WinMatches} decided R1s)</div>
        </div>
        <div class="insight-item">
          <div class="insight-lbl">Card Advantage Entering R2 (+1 / +2 Cards)</div>
          <div class="insight-val">${hand1Wr} / ${hand2Wr}</div>
          <div class="insight-sub">+1 card: ${m.handAdv1PlusGames} games • +2 cards: ${m.handAdv2PlusGames} games</div>
        </div>
        <div class="insight-item">
          <div class="insight-lbl">Lost R1 + Card Adv (+1 / +2 / +3+)</div>
          <div class="insight-val">${fmtPct(m.r1LossAdv1Wins, m.r1LossAdv1Games)} / ${fmtPct(m.r1LossAdv2Wins, m.r1LossAdv2Games)} / ${fmtPct(m.r1LossAdv3Wins, m.r1LossAdv3Games)}</div>
          <div class="insight-sub">+1: ${m.r1LossAdv1Games}g • +2: ${m.r1LossAdv2Games}g • +3+: ${m.r1LossAdv3Games}g • ≤0: ${fmtPct(m.r1LossNoAdvWins, m.r1LossNoAdvGames)} (${m.r1LossNoAdvGames}g)</div>
        </div>
        <div class="insight-item">
          <div class="insight-lbl">Entering R3 Card Adv (+1 / +2 / +3+ / Even)</div>
          <div class="insight-val">${fmtPct(m.r3AdvBuckets['+1'].wins, m.r3AdvBuckets['+1'].games)} / ${fmtPct(m.r3AdvBuckets['+2'].wins, m.r3AdvBuckets['+2'].games)} / ${fmtPct(m.r3AdvBuckets['+3+'].wins, m.r3AdvBuckets['+3+'].games)} / ${fmtPct(m.r3AdvBuckets['0'].wins, m.r3AdvBuckets['0'].games)}</div>
          <div class="insight-sub">+1: ${m.r3AdvBuckets['+1'].games}s • +2: ${m.r3AdvBuckets['+2'].games}s • +3+: ${m.r3AdvBuckets['+3+'].games}s • Even: ${m.r3AdvBuckets['0'].games}s</div>
        </div>
        <div class="insight-item">
          <div class="insight-lbl">Resilient Carryover After R1</div>
          <div class="insight-val">${resWr}</div>
          <div class="insight-sub">${m.resilientCarryGames} sides carried a Resilient unit into R2</div>
        </div>
        <div class="insight-item">
          <div class="insight-lbl">Peak Snowball / Extremes</div>
          <div class="insight-val">${m.maxRoundScore} pts</div>
          <div class="insight-sub">Max round (${m.maxRoundScoreInfo || '—'}) • Max unit: ${m.maxCardPower} pwr (${m.maxCardPowerInfo || '—'})</div>
        </div>
      `;
    }

    // 2-Card Combos (sorted by win rate, filtered by minSample)
    const pairList = Object.values(stats.pairStats)
      .filter(p => p.games >= minSample)
      .map(p => {
        const wr = pct(p.wins, p.games);
        const aWr = stats.cardStats[p.a]?.matchesPlayedIn ? pct(stats.cardStats[p.a].matchesPlayedWins, stats.cardStats[p.a].matchesPlayedIn) : 50;
        const bWr = stats.cardStats[p.b]?.matchesPlayedIn ? pct(stats.cardStats[p.b].matchesPlayedWins, stats.cardStats[p.b].matchesPlayedIn) : 50;
        const expected = (aWr + bWr) / 2;
        const lift = wr - expected;
        return {
          ...p,
          nameA: stats.cardStats[p.a]?.name || p.a,
          nameB: stats.cardStats[p.b]?.name || p.b,
          wr,
          lift
        };
      })
      .sort((a, b) => b.wr - a.wr || b.lift - a.lift)
      .slice(0, 12);

    const comboBody = document.getElementById('combo-table-body');
    if (comboBody) {
      comboBody.innerHTML = pairList.length ? pairList.map(p => `
        <tr>
          <td><strong>${p.nameA}</strong> + <strong>${p.nameB}</strong></td>
          <td class="num">${p.games}</td>
          <td class="num"><span class="wr-pill ${p.wr >= 65 ? 'high' : (p.wr <= 45 ? 'low' : 'mid')}">${p.wr.toFixed(1)}%</span></td>
          <td class="num ${p.lift >= 4 ? 'pos' : (p.lift <= -4 ? 'neg' : '')}">${p.lift >= 0 ? '+' : ''}${p.lift.toFixed(1)}%</td>
        </tr>
      `).join('') : `<tr><td colspan="4" style="color:var(--muted);">Simulate more games (need ≥ ${minSample} games per pair) to detect combos.</td></tr>`;
    }

    // Round-1 Openers
    const openerList = Object.values(stats.openerStats)
      .filter(o => o.games >= Math.max(3, Math.floor(minSample * 0.6)))
      .map(o => ({ ...o, wr: pct(o.wins, o.games) }))
      .sort((a, b) => b.wr - a.wr)
      .slice(0, 10);

    const openerBody = document.getElementById('opener-table-body');
    if (openerBody) {
      openerBody.innerHTML = openerList.length ? openerList.map(o => `
        <tr>
          <td><strong>${o.name}</strong> <span style="color:var(--muted);font-size:11px;">(${o.role})</span></td>
          <td class="num">${o.games}</td>
          <td class="num"><span class="wr-pill ${o.wr >= 60 ? 'high' : (o.wr <= 42 ? 'low' : 'mid')}">${o.wr.toFixed(1)}%</span></td>
        </tr>
      `).join('') : `<tr><td colspan="3" style="color:var(--muted);">Not enough games yet.</td></tr>`;
    }

    // Multi-Copy Stacking (1 copy vs 2+ copies played)
    const stackList = Object.values(stats.stackStats)
      .filter(s => s.oneGames >= 3 && s.multiGames >= 3)
      .map(s => {
        const oneWr = pct(s.oneWins, s.oneGames);
        const multiWr = pct(s.multiWins, s.multiGames);
        return { ...s, oneWr, multiWr, lift: multiWr - oneWr };
      })
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 10);

    const stackBody = document.getElementById('stack-table-body');
    if (stackBody) {
      stackBody.innerHTML = stackList.length ? stackList.map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td class="num">${s.oneWr.toFixed(1)}% <span style="color:var(--muted);font-size:11px;">(${s.oneGames})</span></td>
          <td class="num"><span class="wr-pill ${s.multiWr >= 62 ? 'high' : (s.multiWr <= 45 ? 'low' : 'mid')}">${s.multiWr.toFixed(1)}%</span> <span style="color:var(--muted);font-size:11px;">(${s.multiGames})</span></td>
          <td class="num ${s.lift >= 5 ? 'pos' : (s.lift <= -5 ? 'neg' : '')}">${s.lift >= 0 ? '+' : ''}${s.lift.toFixed(1)}%</td>
        </tr>
      `).join('') : `<tr><td colspan="4" style="color:var(--muted);">Simulate more games to compare 1-copy vs 2+-copy stacking.</td></tr>`;
    }

    // Auto-detected Exploit & Outlier Alerts
    const alertsEl = document.getElementById('exploit-alerts');
    if (alertsEl) {
      const alerts = [];
      const opCards = Object.values(stats.cardStats)
        .filter(c => c.matchesPlayedIn >= Math.max(8, minSample))
        .map(c => ({ ...c, wr: pct(c.matchesPlayedWins, c.matchesPlayedIn) }))
        .sort((a, b) => b.wr - a.wr);

      opCards.filter(c => c.wr >= 62).slice(0, 3).forEach(c => {
        alerts.push(`🔥 <strong>Overpowered Card:</strong> <b>${c.name}</b> (${c.stars}★ ${c.role}) has a <b>${c.wr.toFixed(1)}%</b> played win rate across ${c.matchesPlayedIn} games.`);
      });
      opCards.filter(c => c.wr <= 38).slice(-2).forEach(c => {
        alerts.push(`⚠️ <strong>Underperforming Card:</strong> <b>${c.name}</b> (${c.stars}★ ${c.role}) is only winning <b>${c.wr.toFixed(1)}%</b> of ${c.matchesPlayedIn} games.`);
      });
      if (pairList[0] && pairList[0].wr >= 68) {
        alerts.push(`💥 <strong>Top Combo Exploit:</strong> <b>${pairList[0].nameA} + ${pairList[0].nameB}</b> wins <b>${pairList[0].wr.toFixed(1)}%</b> together (${pairList[0].games} games, ${pairList[0].lift >= 0 ? '+' : ''}${pairList[0].lift.toFixed(1)}% synergy lift).`);
      }
      if (openerList[0] && openerList[0].wr >= 60) {
        alerts.push(`⚡ <strong>Strongest Turn-1 Opener:</strong> Opening Round 1 with <b>${openerList[0].name}</b> wins <b>${openerList[0].wr.toFixed(1)}%</b> (${openerList[0].games} games).`);
      }
      if (stackList[0] && stackList[0].lift >= 10) {
        alerts.push(`📚 <strong>Copy-Stacking Spike:</strong> Playing 2+ copies of <b>${stackList[0].name}</b> jumps win rate by <b>+${stackList[0].lift.toFixed(1)}%</b> (${stackList[0].oneWr.toFixed(1)}% → ${stackList[0].multiWr.toFixed(1)}%).`);
      }
      if (m.handAdv2PlusGames >= 5 && pct(m.handAdv2PlusWins, m.handAdv2PlusGames) >= 70) {
        alerts.push(`🃏 <strong>Card-Advantage Snowball:</strong> Entering Round 2 with +2 cards in hand wins <b>${fmtPct(m.handAdv2PlusWins, m.handAdv2PlusGames)}</b> (${m.handAdv2PlusGames} games).`);
      }
      if (m.stepLimitHits > 0) {
        alerts.push(`🛑 <strong>Infinite/Stall Warning:</strong> ${m.stepLimitHits} match(es) hit the 250-step safety limit.`);
      }

      alertsEl.innerHTML = alerts.length
        ? alerts.map(a => `<div class="alert-pill">${a}</div>`).join('')
        : `<div class="alert-pill" style="color:var(--muted);">No extreme outliers detected in this sample (try 250–1,000 games for stronger signals).</div>`;
    }
  }

  function renderBreakdownBars(containerId, items, keepOrder = false) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const list = keepOrder
      ? [...items]
      : [...items].sort((a, b) => pct(b.wins, b.played) - pct(a.wins, a.played));

    el.innerHTML = list.map(item => {
      const wr = item.played ? pct(item.wins, item.played) : 0;
      const wrClass = !item.played ? 'neutral' : (wr >= 54 ? 'high' : (wr <= 46 ? 'low' : 'neutral'));
      return `
        <div class="bar-row">
          <div class="bar-label">${item.name}</div>
          <div class="bar-track">
            <div class="bar-fill ${wrClass}" style="width: ${Math.min(100, wr).toFixed(1)}%"></div>
          </div>
          <div class="bar-val ${wrClass}">${item.played ? wr.toFixed(1) + '%' : '—'}</div>
          <div class="bar-count">${item.played.toLocaleString()} plays</div>
        </div>
      `;
    }).join('');
  }

  function renderCardTable(stats) {
    const tbody = document.getElementById('card-table-body');
    if (!tbody) return;
    const roleFilter = document.getElementById('filter-role')?.value || 'all';
    const elemFilter = document.getElementById('filter-element')?.value || 'all';
    const search = (document.getElementById('filter-search')?.value || '').trim().toLowerCase();

    const rows = Object.values(stats.cardStats)
      .filter(c => roleFilter === 'all' || c.role === roleFilter)
      .filter(c => elemFilter === 'all' || c.element === elemFilter)
      .filter(c => !search || c.name.toLowerCase().includes(search) || c.role.toLowerCase().includes(search))
      .map(c => {
        const playedWr = c.matchesPlayedIn ? pct(c.matchesPlayedWins, c.matchesPlayedIn) : -1;
        const deckWr = c.deckAppearances ? pct(c.deckWins, c.deckAppearances) : -1;
        const delta = playedWr >= 0 ? playedWr - 50 : -999;
        return { ...c, playedWr, deckWr, delta };
      });

    rows.sort((a, b) => {
      const k = sortState.key;
      const dir = sortState.dir === 'asc' ? 1 : -1;
      const av = a[k];
      const bv = b[k];
      if (typeof av === 'string') return av.localeCompare(bv) * dir;
      return ((av ?? -999) - (bv ?? -999)) * dir;
    });

    tbody.innerHTML = rows.map(c => {
      const wrBadge = c.playedWr < 0
        ? `<span class="wr-pill neutral">—</span>`
        : `<span class="wr-pill ${c.playedWr >= 55 ? 'high' : (c.playedWr <= 45 ? 'low' : 'mid')}">${c.playedWr.toFixed(1)}%</span>`;
      const deltaStr = c.playedWr < 0
        ? '—'
        : `${c.delta >= 0 ? '+' : ''}${c.delta.toFixed(1)}%`;
      const deltaClass = c.playedWr < 0 ? '' : (c.delta >= 4 ? 'pos' : (c.delta <= -4 ? 'neg' : ''));
      const deckWrStr = c.deckWr < 0 ? '—' : `${c.deckWr.toFixed(1)}%`;

      return `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td>${c.role}</td>
          <td class="cap">${c.element}</td>
          <td class="num">${c.stars}★</td>
          <td class="num">${c.basePower} / 🛡️${c.armor}</td>
          <td class="num">${c.timesPlayed.toLocaleString()}</td>
          <td class="num">${c.deckAppearances.toLocaleString()}</td>
          <td class="num">${deckWrStr}</td>
          <td class="num">${wrBadge}</td>
          <td class="num ${deltaClass}">${deltaStr}</td>
        </tr>
      `;
    }).join('');
  }

  function populateSelectors() {
    const fillDeckSelect = (selId, defaultVal) => {
      const sel = document.getElementById(selId);
      if (!sel) return;
      const html = [
        `<option value="random">🎲 Random Legal Deck (18 cards, ≤40★)</option>`,
        `<optgroup label="NPC Archetype Decks">`,
        ...Object.entries(NPC_LABELS).map(([id, label]) => `<option value="npc:${id}">${label}</option>`),
        `</optgroup>`,
        `<optgroup label="Role / Faction Focus">`,
        ...ROLES.map(r => `<option value="role:${r}">${r} Focus</option>`),
        `</optgroup>`,
        `<optgroup label="Single Card Focus (Max Copies + Random)">`,
        ...CARD_LIST.map(c => `<option value="card:${c.id}">${c.name} (${c.stars}★)</option>`),
        `</optgroup>`
      ].join('');
      sel.innerHTML = html;
      sel.value = defaultVal;
    };

    fillDeckSelect('sim-deck-1', 'random');
    fillDeckSelect('sim-deck-2', 'random');

    const roleSel = document.getElementById('filter-role');
    if (roleSel) {
      roleSel.innerHTML = `<option value="all">All Roles</option>` + ROLES.map(r => `<option value="${r}">${r}</option>`).join('');
    }
    const elemSel = document.getElementById('filter-element');
    if (elemSel) {
      elemSel.innerHTML = `<option value="all">All Elements</option>` + ELEMENTS.map(e => `<option value="${e}">${e}</option>`).join('');
    }
  }

  function runBatch() {
    if (isRunning) return;
    const countInput = document.getElementById('sim-count');
    const totalGames = Math.max(1, Math.min(10000, parseInt(countInput?.value || '200', 10) || 200));
    const d1Val = document.getElementById('sim-deck-1')?.value || 'random';
    const d2Val = document.getElementById('sim-deck-2')?.value || 'random';
    const p1Pass = document.getElementById('sim-pass-1')?.value || 'standard';
    const p2Pass = document.getElementById('sim-pass-2')?.value || 'standard';
    const summoningSickness = Boolean(document.getElementById('sim-summoning-sickness')?.checked);
    const prevLoserDraw3 = Boolean(document.getElementById('sim-prev-loser-draw3')?.checked);

    const deck1Template = resolveDeckOption(d1Val);
    const deck2Template = resolveDeckOption(d2Val);
    const p1Label = `${formatOptionLabel(d1Val)} [${p1Pass}]`;
    const p2Label = `${formatOptionLabel(d2Val)} [${p2Pass}]`;

    isRunning = true;
    cancelRequested = false;

    const btnRun = document.getElementById('btn-run-sim');
    const btnStop = document.getElementById('btn-stop-sim');
    const progWrap = document.getElementById('sim-progress-wrap');
    const progBar = document.getElementById('sim-progress-bar');
    const progText = document.getElementById('sim-progress-text');

    if (btnRun) btnRun.disabled = true;
    if (btnStop) btnStop.disabled = false;
    progWrap?.classList.remove('hidden');

    const stats = createEmptyStats(totalGames, p1Label, p2Label);
    const t0 = performance.now();
    const BATCH_SIZE = 25;

    const step = () => {
      if (cancelRequested) {
        finishRun();
        return;
      }

      const end = Math.min(totalGames, stats.completedGames + BATCH_SIZE);
      while (stats.completedGames < end) {
        const res = simGame.simulateMatch({
          deck1: deck1Template,
          deck2: deck2Template,
          name1: p1Label,
          name2: p2Label,
          passProfile1: p1Pass,
          passProfile2: p2Pass,
          summoningSickness,
          prevLoserDraw3
        });
        recordMatch(stats, res);
      }

      stats.elapsedMs = performance.now() - t0;
      const pctDone = ((stats.completedGames / totalGames) * 100).toFixed(0);
      if (progBar) progBar.style.width = `${pctDone}%`;
      if (progText) {
        progText.textContent = `Simulated ${stats.completedGames.toLocaleString()} / ${totalGames.toLocaleString()} games (${pctDone}%)`;
      }

      if (stats.completedGames < totalGames) {
        requestAnimationFrame(step);
      } else {
        finishRun();
      }
    };

    const finishRun = () => {
      isRunning = false;
      if (btnRun) btnRun.disabled = false;
      if (btnStop) btnStop.disabled = true;
      renderResults(stats);
    };

    requestAnimationFrame(step);
  }

  function exportCsv() {
    if (!lastResults) return;
    const headers = ['ID', 'Name', 'Role', 'Element', 'Stars', 'BasePower', 'Armor', 'TimesPlayed', 'DeckAppearances', 'InDeckWinRatePct', 'WhenPlayedWinRatePct', 'DeltaVs50Pct'];
    const lines = [headers.join(',')];
    Object.values(lastResults.cardStats).forEach(c => {
      const deckWr = c.deckAppearances ? pct(c.deckWins, c.deckAppearances).toFixed(2) : '';
      const playedWr = c.matchesPlayedIn ? pct(c.matchesPlayedWins, c.matchesPlayedIn).toFixed(2) : '';
      const delta = c.matchesPlayedIn ? (pct(c.matchesPlayedWins, c.matchesPlayedIn) - 50).toFixed(2) : '';
      lines.push([
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.role}"`,
        c.element,
        c.stars,
        c.basePower,
        c.armor,
        c.timesPlayed,
        c.deckAppearances,
        deckWr,
        playedWr,
        delta
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mythos_sim_${lastResults.completedGames}_games.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    if (!lastResults) return;
    const blob = new Blob([JSON.stringify(lastResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mythos_sim_${lastResults.completedGames}_games.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  window.addEventListener('DOMContentLoaded', () => {
    populateSelectors();

    document.getElementById('btn-run-sim')?.addEventListener('click', runBatch);
    document.getElementById('btn-stop-sim')?.addEventListener('click', () => { cancelRequested = true; });
    document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);
    document.getElementById('btn-export-json')?.addEventListener('click', exportJson);

    document.querySelectorAll('.preset-count').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('sim-count');
        if (input) input.value = btn.dataset.count;
      });
    });

    ['filter-role', 'filter-element', 'filter-search'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        if (lastResults) renderCardTable(lastResults);
      });
    });

    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (sortState.key === key) {
          sortState.dir = sortState.dir === 'desc' ? 'asc' : 'desc';
        } else {
          sortState.key = key;
          sortState.dir = key === 'name' || key === 'role' || key === 'element' ? 'asc' : 'desc';
        }
        document.querySelectorAll('th[data-sort]').forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(sortState.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
        if (lastResults) renderCardTable(lastResults);
      });
    });

    // Expose programmatic API for headless CLI/automation runs
    window.MythosSimulator = {
      runSync(totalGames = 200, deck1Opt = 'random', deck2Opt = 'random', pass1 = 'standard', pass2 = 'standard', summoningSickness = false, prevLoserDraw3 = false, r3DrawCount = 2, fillHandTo5 = false, bothDraw3 = false, starterMode = 'winner', startHandSize = 7) {
        const d1 = resolveDeckOption(deck1Opt);
        const d2 = resolveDeckOption(deck2Opt);
        const stats = createEmptyStats(totalGames, `${formatOptionLabel(deck1Opt)} [${pass1}]`, `${formatOptionLabel(deck2Opt)} [${pass2}]`);
        const t0 = performance.now();
        for (let i = 0; i < totalGames; i++) {
          const res = simGame.simulateMatch({ deck1: d1, deck2: d2, passProfile1: pass1, passProfile2: pass2, summoningSickness, prevLoserDraw3, r3DrawCount, fillHandTo5, bothDraw3, starterMode, startHandSize });
          recordMatch(stats, res);
        }
        stats.elapsedMs = performance.now() - t0;
        renderResults(stats);
        return stats;
      }
    };

    const params = new URLSearchParams(window.location.search);
    const autoCount = parseInt(params.get('autorun') || '0', 10);
    if (autoCount > 0) {
      const d1 = params.get('d1') || 'random';
      const d2 = params.get('d2') || 'random';
      const p1 = params.get('p1') || 'standard';
      const p2 = params.get('p2') || 'standard';
      const ss = params.get('ss') === '1' || params.get('ss') === 'true';
      const pl3 = params.get('prevl3') === '1' || params.get('prevl3') === 'true';
      const r3d = params.has('r3draw') ? parseInt(params.get('r3draw'), 10) : 2;
      const fill5 = params.get('fill5') === '1' || params.get('fill5') === 'true';
      const draw3 = params.get('draw3') === '1' || params.get('draw3') === 'true';
      const starter = params.get('starter') || 'winner';
      const startHand = params.has('start') ? parseInt(params.get('start'), 10) : 7;
      const s1 = document.getElementById('sim-deck-1');
      const s2 = document.getElementById('sim-deck-2');
      const ps1 = document.getElementById('sim-pass-1');
      const ps2 = document.getElementById('sim-pass-2');
      const ssEl = document.getElementById('sim-summoning-sickness');
      const pl3El = document.getElementById('sim-prev-loser-draw3');
      const cIn = document.getElementById('sim-count');
      if (s1) s1.value = d1;
      if (s2) s2.value = d2;
      if (ps1) ps1.value = p1;
      if (ps2) ps2.value = p2;
      if (ssEl) ssEl.checked = ss;
      if (pl3El) pl3El.checked = pl3;
      if (cIn) cIn.value = String(autoCount);
      window.MythosSimulator.runSync(autoCount, d1, d2, p1, p2, ss, pl3, Number.isNaN(r3d) ? 2 : r3d, fill5, draw3, starter, Number.isNaN(startHand) ? 7 : startHand);
    }
  });
})();
