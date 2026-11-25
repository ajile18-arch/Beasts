/**
 * MYTHOS — Procedural Card Grading, Multi-Variant Defect Engine & Deterioration System
 * Renders authentic centering, corner, edge, and surface defects via CSS + inline SVG
 * without duplicating any card artwork.
 */
(function () {
  'use strict';

  const GRADE_INFO = {
    10:  { grade: 10,  isPristine: true,  label: 'PRISTINE 10',      short: 'PRISTINE 10', tier: 'pristine', mult: 4.00, color: '#fef08a', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #090d16 100%)' },
    9.5: { grade: 9.5, isPristine: false, label: 'GEM MINT 9.5',     short: '9.5',         tier: 'gem',      mult: 2.80, color: '#fde047', bg: 'linear-gradient(135deg, #ca8a04 0%, #eab308 50%, #a16207 100%)' },
    9:   { grade: 9,   isPristine: false, label: 'MINT 9',           short: '9',           tier: 'mint',     mult: 2.00, color: '#f8fafc', bg: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #334155 100%)' },
    8:  { grade: 8,  isPristine: false, label: 'NEAR MINT 8',      short: '8',           tier: 'nm',       mult: 1.40, color: '#bae6fd', bg: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #075985 100%)' },
    7:  { grade: 7,  isPristine: false, label: 'GREAT 7',          short: '7',           tier: 'great',    mult: 1.00, color: '#93c5fd', bg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e3a8a 100%)' },
    6:  { grade: 6,  isPristine: false, label: 'GOOD 6',           short: '6',           tier: 'good',     mult: 0.85, color: '#a7f3d0', bg: 'linear-gradient(135deg, #047857 0%, #059669 50%, #065f46 100%)' },
    5:  { grade: 5,  isPristine: false, label: 'PLAYED 5',         short: '5',           tier: 'played',   mult: 0.70, color: '#fde68a', bg: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #92400e 100%)' },
    4:  { grade: 4,  isPristine: false, label: 'WORN 4',           short: '4',           tier: 'worn',     mult: 0.55, color: '#fed7aa', bg: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #9a3412 100%)' },
    3:  { grade: 3,  isPristine: false, label: 'HEAVILY WORN 3',   short: '3',           tier: 'worn',     mult: 0.40, color: '#fecaca', bg: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #7f1d1d 100%)' },
    2:  { grade: 2,  isPristine: false, label: 'ROUGH 2',          short: '2',           tier: 'low',      mult: 0.30, color: '#fca5a5', bg: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #450a0a 100%)' },
    1:  { grade: 1,  isPristine: false, label: 'DAMAGED 1',        short: '1',           tier: 'low',      mult: 0.20, color: '#f87171', bg: 'linear-gradient(135deg, #57534e 0%, #44403c 50%, #292524 100%)' }
  };

  function mulberry32(seed) {
    let a = (Number(seed) >>> 0) || 1;
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function normalizeGrade(grade, fallback = 7) {
    const n = Number(grade);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    if (n >= 9.25 && n < 9.75) return 9.5;
    return clamp(Math.round(n), 1, 10);
  }

  function getGradeMeta(grade, _unused = false) {
    const g = normalizeGrade(grade, 7);
    return GRADE_INFO[g] || GRADE_INFO[7];
  }

  function computeRawGrade(subgrades) {
    const c = clamp(Math.round(Number(subgrades?.centering ?? 10)), 1, 10);
    const co = clamp(Math.round(Number(subgrades?.corners ?? 10)), 1, 10);
    const e = clamp(Math.round(Number(subgrades?.edges ?? 10)), 1, 10);
    const s = clamp(Math.round(Number(subgrades?.surface ?? 10)), 1, 10);
    if (c === 10 && co === 10 && e === 10 && s === 10) return 10;
    const minSub = Math.min(c, co, e, s);
    if (minSub >= 9 && (c + co + e + s) >= 39) return 9.5;
    const weighted = s * 0.30 + co * 0.25 + e * 0.25 + c * 0.20;
    return clamp(Math.round(Math.min(weighted, minSub + 1)), 1, 9);
  }

  const CORNERS = ['TL', 'TR', 'BL', 'BR'];
  const EDGES = ['T', 'B', 'L', 'R'];

  function makeCornerDefect(rng, corner, variant, severity = 1) {
    return {
      cat: 'corner',
      corner,
      variant, // 'pinpoint_fleck' | 'jagged_flake' | 'blunted_rub' | 'layer_split' | 'corner_pinch'
      size: +(clamp((4 + rng() * 11) * severity, 3, 28)).toFixed(1),
      asym: +(0.65 + rng() * 0.7).toFixed(2),
      angle: Math.round(25 + rng() * 40),
      opacity: +(clamp(0.72 + rng() * 0.24, 0.55, 0.96)).toFixed(2),
      jag: [+(rng()).toFixed(2), +(rng()).toFixed(2), +(rng()).toFixed(2)]
    };
  }

  function makeEdgeDefect(rng, edge, variant, severity = 1) {
    const pos = +(0.12 + rng() * 0.68).toFixed(3);
    const span = +(clamp((0.10 + rng() * 0.28) * severity, 0.08, 0.58)).toFixed(3);
    const specks = [];
    const count = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < count; i++) {
      specks.push({
        t: +(rng()).toFixed(2),
        r: +(1.0 + rng() * 1.6 * severity).toFixed(2)
      });
    }
    return {
      cat: 'edge',
      edge,
      variant, // 'edge_silvering' | 'micro_nicks' | 'edge_dent' | 'factory_burr'
      pos,
      span,
      depth: +(clamp((1.8 + rng() * 2.5) * severity, 1.5, 7)).toFixed(1),
      opacity: +(clamp(0.62 + rng() * 0.3, 0.5, 0.92)).toFixed(2),
      specks
    };
  }

  function makeSurfaceDefect(rng, variant, severity = 1, isFactory = false) {
    if (variant === 'print_line') {
      const horiz = rng() < 0.45;
      return {
        cat: 'surface',
        variant: 'print_line',
        factory: true,
        horiz,
        pos: +(0.14 + rng() * 0.72).toFixed(3),
        opacity: +(0.12 + rng() * 0.11).toFixed(2)
      };
    }
    if (variant === 'printer_hickey') {
      return {
        cat: 'surface',
        variant: 'printer_hickey',
        factory: true,
        x: Math.round(35 + rng() * 230),
        y: Math.round(40 + rng() * 340),
        r: +(2.6 + rng() * 2.6).toFixed(1),
        opacity: +(0.52 + rng() * 0.22).toFixed(2)
      };
    }
    if (variant === 'matte_cloud') {
      return {
        cat: 'surface',
        variant: 'matte_cloud',
        x: Math.round(55 + rng() * 190),
        y: Math.round(70 + rng() * 270),
        rx: Math.round(22 + rng() * 28 * severity),
        ry: Math.round(16 + rng() * 22 * severity),
        opacity: +(clamp(0.16 + rng() * 0.14 * severity, 0.14, 0.36)).toFixed(2)
      };
    }
    if (variant === 'crease') {
      const startSide = rng() < 0.5 ? 'L' : 'T';
      const x1 = startSide === 'L' ? 0 : Math.round(25 + rng() * 140);
      const y1 = startSide === 'L' ? Math.round(70 + rng() * 250) : 0;
      const x2 = startSide === 'L' ? 300 : Math.round(140 + rng() * 155);
      const y2 = startSide === 'L' ? Math.round(90 + rng() * 250) : Math.round(180 + rng() * 240);
      return {
        cat: 'surface',
        variant: 'crease',
        x1, y1, x2, y2,
        bend: Math.round((rng() - 0.5) * 44),
        jag: +(rng()).toFixed(2),
        opacity: +(clamp(0.68 + rng() * 0.22, 0.62, 0.92)).toFixed(2)
      };
    }
    // Scratch variants: 'hairline_scratch' | 'curved_scratch' | 'scuff_cluster'
    const x1 = Math.round(32 + rng() * 220);
    const y1 = Math.round(42 + rng() * 320);
    const ang = rng() * Math.PI * 2;
    const len = (variant === 'scuff_cluster' ? 16 + rng() * 18 : 28 + rng() * 58) * clamp(severity, 0.75, 1.5);
    const x2 = clamp(Math.round(x1 + Math.cos(ang) * len), 10, 290);
    const y2 = clamp(Math.round(y1 + Math.sin(ang) * len), 10, 410);
    return {
      cat: 'surface',
      variant,
      x1, y1, x2, y2,
      bend: Math.round((rng() - 0.5) * 32),
      count: variant === 'scuff_cluster' ? (2 + Math.floor(rng() * 3)) : 1,
      opacity: +(clamp((variant === 'hairline_scratch' ? 0.38 : 0.48) + rng() * 0.24 * severity, 0.32, 0.82)).toFixed(2)
    };
  }

  function rollCondition(seedInput = null) {
    const seed = Number.isFinite(seedInput) && seedInput > 0
      ? (seedInput >>> 0)
      : (Math.floor(Math.random() * 0x7fffffff) + 1);
    const rng = mulberry32(seed);

    // Direct per-grade pack-pull distribution:
    // 10 Pristine (1.5%), 9.5 Gem Mint (3%), 9 Mint (15.5%), 8 Near Mint (29.5%), 7 Great (25.5%), 6 Good (13%), 5 Played (7%), 4 Worn (5%)
    const roll = rng();
    let targetGrade;
    if (roll < 0.015) targetGrade = 10;
    else if (roll < 0.045) targetGrade = 9.5;
    else if (roll < 0.20) targetGrade = 9;
    else if (roll < 0.495) targetGrade = 8;
    else if (roll < 0.75) targetGrade = 7;
    else if (roll < 0.88) targetGrade = 6;
    else if (roll < 0.95) targetGrade = 5;
    else targetGrade = 4;

    const subgrades = { centering: 10, corners: 10, edges: 10, surface: 10 };
    if (targetGrade < 10) {
      const keys = ['centering', 'corners', 'edges', 'surface'];
      const bias = [0.25 + rng(), 0.25 + rng(), 0.25 + rng(), 0.25 + rng()];
      let guard = 0;
      while (computeRawGrade(subgrades) > targetGrade && guard < 80) {
        guard++;
        // Weighted pick among subgrades that can drop by 1 without undershooting targetGrade
        const candidates = [];
        let wTotal = 0;
        for (let i = 0; i < 4; i++) {
          const k = keys[i];
          if (subgrades[k] <= 1) continue;
          const test = { ...subgrades, [k]: subgrades[k] - 1 };
          if (computeRawGrade(test) >= targetGrade) {
            candidates.push({ k, w: bias[i] });
            wTotal += bias[i];
          }
        }
        if (candidates.length === 0) break;
        let pickR = rng() * wTotal;
        let chosen = candidates[0].k;
        for (const cand of candidates) {
          pickR -= cand.w;
          if (pickR <= 0) {
            chosen = cand.k;
            break;
          }
        }
        subgrades[chosen] -= 1;
      }
    }

    const defects = [];

    // 1. Centering defect (permanent factory trait)
    const cDeficit = 10 - subgrades.centering;
    if (cDeficit >= 1) {
      const cModes = ['shift_axis', 'shift_diag', 'diamond_twist'];
      const cVar = cModes[Math.floor(rng() * cModes.length)];
      const mag = clamp(cDeficit * 1.25, 0.8, 7.0);
      const sxSign = rng() < 0.5 ? -1 : 1;
      const sySign = rng() < 0.5 ? -1 : 1;
      let shiftX = 0;
      let shiftY = 0;
      let twistDeg = 0;
      if (cVar === 'shift_axis') {
        if (rng() < 0.5) shiftX = +(sxSign * mag).toFixed(1);
        else shiftY = +(sySign * mag).toFixed(1);
      } else if (cVar === 'shift_diag') {
        shiftX = +(sxSign * mag * 0.85).toFixed(1);
        shiftY = +(sySign * mag * 0.85).toFixed(1);
      } else {
        shiftX = +(sxSign * mag * 0.55).toFixed(1);
        shiftY = +(sySign * mag * 0.55).toFixed(1);
        twistDeg = +((rng() < 0.5 ? -1 : 1) * clamp(cDeficit * 0.22, 0.3, 1.25)).toFixed(2);
      }
      defects.push({
        cat: 'centering',
        variant: cVar,
        factory: true,
        shiftX,
        shiftY,
        twistDeg
      });
    }

    // 2. Corner defects (multi-variant, random corners)
    const coDeficit = 10 - subgrades.corners;
    if (coDeficit >= 1) {
      const cornerOrder = [...CORNERS].sort(() => rng() - 0.5);
      const nCorners = clamp(Math.ceil(coDeficit / 1.4), 1, 4);
      const sev = clamp(coDeficit / 2.8, 0.7, 1.7);
      for (let i = 0; i < nCorners; i++) {
        let pool;
        if (coDeficit >= 5 && i === 0) pool = ['corner_pinch', 'jagged_flake', 'layer_split', 'blunted_rub'];
        else if (coDeficit >= 2) pool = ['jagged_flake', 'blunted_rub', 'layer_split', 'pinpoint_fleck'];
        else pool = ['pinpoint_fleck', 'blunted_rub', 'jagged_flake'];
        const variant = pool[Math.floor(rng() * pool.length)];
        defects.push(makeCornerDefect(rng, cornerOrder[i], variant, sev));
      }
    }

    // 3. Edge defects (multi-variant, random sides)
    const eDeficit = 10 - subgrades.edges;
    if (eDeficit >= 1) {
      const edgeOrder = [...EDGES].sort(() => rng() - 0.5);
      const nEdges = clamp(Math.ceil(eDeficit / 1.5), 1, 4);
      const sev = clamp(eDeficit / 2.8, 0.7, 1.65);
      const ePool = eDeficit >= 3
        ? ['edge_silvering', 'micro_nicks', 'edge_dent', 'factory_burr']
        : ['micro_nicks', 'edge_silvering', 'factory_burr'];
      for (let i = 0; i < nEdges; i++) {
        const variant = ePool[Math.floor(rng() * ePool.length)];
        defects.push(makeEdgeDefect(rng, edgeOrder[i], variant, sev));
      }
    }

    // 4. Surface defects (multi-variant)
    const sDeficit = 10 - subgrades.surface;
    if (sDeficit >= 1) {
      const nSurf = clamp(Math.ceil(sDeficit / 1.35), 1, 5);
      const sev = clamp(sDeficit / 2.6, 0.75, 1.65);
      const sPool = ['hairline_scratch', 'curved_scratch', 'scuff_cluster', 'print_line', 'printer_hickey', 'matte_cloud'];
      for (let i = 0; i < nSurf; i++) {
        const variant = (subgrades.surface <= 4 && i === 0)
          ? 'crease'
          : sPool[Math.floor(rng() * sPool.length)];
        defects.push(makeSurfaceDefect(rng, variant, sev));
      }
    }

    const vRoll = rng();
    const graderVariance = targetGrade === 10 ? 0 : (vRoll < 0.12 ? -1 : (vRoll > 0.88 ? 1 : 0));

    return {
      seed,
      isGraded: false,
      grade: null,
      isPristine: false,
      graderVariance,
      rawGrade: computeRawGrade(subgrades),
      subgrades,
      defects
    };
  }

  function normalizeSleeveTier(tier) {
    if (tier === 'clear_sleeve' || tier === 'pro_sleeve' || tier === 'slab') return tier;
    return 'none';
  }

  function ensureHydratedCondition(cond) {
    if (!cond || typeof cond !== 'object') {
      return rollCondition();
    }
    if (cond.subgrades && Array.isArray(cond.defects)) {
      ['centering', 'corners', 'edges', 'surface'].forEach(k => {
        cond.subgrades[k] = clamp(Math.round(Number(cond.subgrades[k] ?? 10)), 1, 10);
      });
      cond.rawGrade = computeRawGrade(cond.subgrades);
      cond.sleeveTier = cond.isGraded ? 'none' : normalizeSleeveTier(cond.sleeveTier);
      if (cond.isGraded) {
        cond.grade = normalizeGrade(cond.grade, cond.rawGrade);
        cond.isPristine = cond.grade === 10;
      }
      return cond;
    }
    const base = rollCondition(cond.seed || null);
    base.sleeveTier = cond.isGraded ? 'none' : normalizeSleeveTier(cond.sleeveTier);
    if (cond.isGraded) {
      base.isGraded = true;
      base.grade = normalizeGrade(cond.grade, base.rawGrade);
      base.isPristine = base.grade === 10;
    }
    return base;
  }

  const WEAR_BASE_CHANCE = {
    transfer: 0.05,
    duel_deck: 0.025,
    duel_played: 0.10,
    loose_overnight: 0.05
  };

  const PROTECTION_RANK = {
    none: 0,
    clear_sleeve: 1,
    pro_sleeve: 2,
    slab: 3
  };

  const PROTECTION_MULT = {
    none: 1.0,
    clear_sleeve: 0.25,
    pro_sleeve: 0.05,
    slab: 0
  };

  function applyWear(condInput, context = 'transfer', protectionTier = 'none') {
    const cond = ensureHydratedCondition(condInput);
    const cardTier = normalizeSleeveTier(cond.sleeveTier);
    const argTier = normalizeSleeveTier(protectionTier);
    const effTier = (PROTECTION_RANK[cardTier] || 0) >= (PROTECTION_RANK[argTier] || 0) ? cardTier : argTier;
    if (cond.isGraded || effTier === 'slab') {
      return { damaged: false, summary: null, condition: cond };
    }
    const baseProb = WEAR_BASE_CHANCE[context] ?? 0.05;
    const protMult = PROTECTION_MULT[effTier] ?? 1.0;
    const chance = baseProb * protMult;
    if (Math.random() >= chance) {
      return { damaged: false, summary: null, condition: cond };
    }

    const rng = mulberry32((cond.seed ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    const isProtected = effTier === 'clear_sleeve' || effTier === 'pro_sleeve';
    const sub = cond.subgrades;

    // Pick wear category based on context (never alters permanent factory centering or print lines)
    let catPick;
    if (context === 'transfer') {
      catPick = rng() < 0.55 ? 'corner' : 'edge';
    } else if (context === 'loose_overnight') {
      catPick = rng() < 0.5 ? 'edge' : 'surface';
    } else if (context === 'duel_deck') {
      catPick = rng() < 0.5 ? 'edge' : 'surface';
    } else {
      const r = rng();
      catPick = r < 0.34 ? 'corner' : (r < 0.66 ? 'edge' : 'surface');
    }

    let summary = 'minor wear';
    if (catPick === 'corner') {
      const existingCorner = cond.defects.find(d => d.cat === 'corner' && d.variant === 'pinpoint_fleck');
      if (existingCorner && !isProtected) {
        existingCorner.variant = rng() < 0.5 ? 'jagged_flake' : 'blunted_rub';
        existingCorner.size = +(Math.min(24, existingCorner.size + 3.5)).toFixed(1);
        sub.corners = clamp(Math.round(sub.corners) - 1, 1, 10);
        summary = `${existingCorner.corner} corner wear`;
      } else {
        const usedCorners = new Set(cond.defects.filter(d => d.cat === 'corner').map(d => d.corner));
        const free = CORNERS.filter(c => !usedCorners.has(c));
        const corner = free.length ? free[Math.floor(rng() * free.length)] : CORNERS[Math.floor(rng() * CORNERS.length)];
        let variant = 'pinpoint_fleck';
        if (!isProtected && context === 'duel_played' && rng() < 0.12) variant = 'corner_pinch';
        else if (!isProtected && rng() < 0.45) variant = rng() < 0.5 ? 'blunted_rub' : 'jagged_flake';
        cond.defects.push(makeCornerDefect(rng, corner, variant, 0.9));
        sub.corners = clamp(Math.round(sub.corners) - 1, 1, 10);
        summary = variant === 'corner_pinch' ? `${corner} corner ding` : `${corner} corner fleck`;
      }
    } else if (catPick === 'edge') {
      const usedEdges = new Set(cond.defects.filter(d => d.cat === 'edge').map(d => d.edge));
      const free = EDGES.filter(e => !usedEdges.has(e));
      const edge = free.length ? free[Math.floor(rng() * free.length)] : EDGES[Math.floor(rng() * EDGES.length)];
      const variant = isProtected
        ? 'micro_nicks'
        : (rng() < 0.45 ? 'micro_nicks' : (rng() < 0.75 ? 'edge_silvering' : 'edge_dent'));
      cond.defects.push(makeEdgeDefect(rng, edge, variant, 0.85));
      sub.edges = clamp(Math.round(sub.edges) - 1, 1, 10);
      summary = 'edge wear';
    } else {
      const pool = isProtected
        ? ['hairline_scratch']
        : ['hairline_scratch', 'curved_scratch', 'scuff_cluster', 'matte_cloud'];
      const variant = pool[Math.floor(rng() * pool.length)];
      cond.defects.push(makeSurfaceDefect(rng, variant, 0.85));
      sub.surface = clamp(Math.round(sub.surface) - 1, 1, 10);
      summary = variant === 'matte_cloud' ? 'surface dulling' : 'surface scratch';
    }

    cond.rawGrade = computeRawGrade(sub);
    return { damaged: true, summary, condition: cond };
  }

  function gradeCard(condInput) {
    const cond = ensureHydratedCondition(condInput);
    const sub = cond.subgrades;
    const isPristine = (
      sub.centering === 10 &&
      sub.corners === 10 &&
      sub.edges === 10 &&
      sub.surface === 10
    );
    let finalGrade;
    if (isPristine) {
      finalGrade = 10;
    } else {
      const raw = computeRawGrade(sub);
      const minSub = Math.min(sub.centering, sub.corners, sub.edges, sub.surface);
      const v = Math.round(Number(cond.graderVariance) || 0);
      if (raw === 9.5) {
        finalGrade = v < 0 ? 9 : 9.5;
      } else if (raw === 9 && minSub >= 9 && v > 0) {
        finalGrade = 9.5;
      } else {
        finalGrade = clamp(raw + v, 1, Math.min(9, minSub + 1));
      }
    }
    cond.isGraded = true;
    cond.sleeveTier = 'none';
    cond.grade = finalGrade;
    cond.isPristine = isPristine;
    cond.gradedAt = Date.now();
    return {
      condition: cond,
      meta: getGradeMeta(finalGrade, isPristine)
    };
  }

  function crackSlab(condInput) {
    const cond = ensureHydratedCondition(condInput);
    cond.isGraded = false;
    cond.grade = null;
    cond.isPristine = false;
    return cond;
  }

  function buildGradeSummary(condInput) {
    const cond = ensureHydratedCondition(condInput);
    const sub = cond.subgrades || { centering: 8, corners: 8, edges: 8, surface: 8 };
    const defects = cond.defects || [];
    const raw = computeRawGrade(sub);
    const finalGrade = cond.isGraded ? cond.grade : raw;
    const isPristine = Boolean(cond.isPristine);
    const meta = getGradeMeta(finalGrade, isPristine);

    // 1. Centering
    const centScore = Number(sub.centering) || 10;
    const centDefs = defects.filter(d => d.cat === 'centering');
    let centNote = 'Dead-center borders with crisp, balanced margins.';
    if (centScore < 10 && centDefs.length > 0) {
      const notes = [];
      centDefs.forEach(d => {
        if (d.variant === 'diamond_twist') {
          const deg = Math.abs(Number(d.twistDeg) || 0).toFixed(1);
          notes.push(`diamond-cut rotation (~${deg}° twist) with skewed borders`);
        } else if (d.variant === 'shift_diag') {
          const horiz = (Number(d.shiftX) || 0) >= 0 ? 'right' : 'left';
          const vert = (Number(d.shiftY) || 0) >= 0 ? 'down' : 'up';
          notes.push(`diagonal border shift (${horiz} & ${vert})`);
        } else {
          const sx = Math.abs(Number(d.shiftX) || 0);
          const sy = Math.abs(Number(d.shiftY) || 0);
          if (sx >= sy) {
            notes.push(`left/right margin imbalance (shifted ${(Number(d.shiftX) || 0) >= 0 ? 'right' : 'left'})`);
          } else {
            notes.push(`top/bottom margin imbalance (shifted ${(Number(d.shiftY) || 0) >= 0 ? 'down' : 'up'})`);
          }
        }
      });
      centNote = notes.join('; ') + '.';
      centNote = centNote.charAt(0).toUpperCase() + centNote.slice(1);
    } else if (centScore < 10) {
      centNote = `Slight print margin variance (${centScore}/10).`;
    }

    // 2. Corners
    const cornScore = Number(sub.corners) || 10;
    const cornDefs = defects.filter(d => d.cat === 'corner');
    const cornerNames = { TL: 'Top-Left', TR: 'Top-Right', BL: 'Bottom-Left', BR: 'Bottom-Right' };
    const cornerVariants = {
      pinpoint_fleck: 'pinpoint whitening fleck',
      jagged_flake: 'chipped corner flake',
      blunted_rub: 'softened/blunted corner',
      layer_split: 'cardstock layer separation',
      corner_pinch: 'corner pinch crease'
    };
    let cornNote = 'Razor-sharp factory corners with zero whitening.';
    if (cornScore < 10 && cornDefs.length > 0) {
      const counts = new Map();
      cornDefs.forEach(d => {
        const cName = cornerNames[d.corner] || 'Corner';
        const vName = cornerVariants[d.variant] || 'corner wear';
        const key = `${cName}: ${vName}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const parts = Array.from(counts.entries()).map(([label, n]) => (n > 1 ? `${label} (×${n})` : label));
      cornNote = parts.join(' • ') + '.';
    } else if (cornScore < 10) {
      cornNote = `Minor microscopic corner tip softness (${cornScore}/10).`;
    }

    // 3. Edges
    const edgeScore = Number(sub.edges) || 10;
    const edgeDefs = defects.filter(d => d.cat === 'edge');
    const edgeNames = { T: 'Top edge', B: 'Bottom edge', L: 'Left edge', R: 'Right edge' };
    const edgeVariants = {
      edge_silvering: 'border silvering',
      micro_nicks: 'micro edge nicks',
      edge_dent: 'edge indentation',
      factory_burr: 'rough factory cut burr'
    };
    let edgeNote = 'Clean factory-cut borders with no nicks or silvering.';
    if (edgeScore < 10 && edgeDefs.length > 0) {
      const counts = new Map();
      edgeDefs.forEach(d => {
        const eName = edgeNames[d.edge] || 'Edge';
        const vName = edgeVariants[d.variant] || 'edge wear';
        const key = `${eName}: ${vName}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const parts = Array.from(counts.entries()).map(([label, n]) => (n > 1 ? `${label} (×${n})` : label));
      edgeNote = parts.join(' • ') + '.';
    } else if (edgeScore < 10) {
      edgeNote = `Faint factory border roughness (${edgeScore}/10).`;
    }

    // 4. Surface
    const surfScore = Number(sub.surface) || 10;
    const surfDefs = defects.filter(d => d.cat === 'surface');
    const surfVariants = {
      print_line: 'factory print line',
      printer_hickey: 'ink printer hickey',
      matte_cloud: 'gloss dulling/clouding',
      crease: 'structural surface crease',
      hairline_scratch: 'hairline surface scratch',
      curved_scratch: 'curved handling scratch',
      scuff_cluster: 'handling scuff cluster'
    };
    let surfNote = 'Mirror-clean gloss with zero scratches, print lines, or clouding.';
    if (surfScore < 10 && surfDefs.length > 0) {
      const counts = new Map();
      surfDefs.forEach(d => {
        const vName = surfVariants[d.variant] || 'surface wear';
        counts.set(vName, (counts.get(vName) || 0) + 1);
      });
      const parts = Array.from(counts.entries()).map(([label, n]) => (n > 1 ? `${n}× ${label}` : label));
      const str = parts.join(', ');
      surfNote = str.charAt(0).toUpperCase() + str.slice(1) + '.';
    } else if (surfScore < 10) {
      surfNote = `Light gloss micro-haze visible under angled light (${surfScore}/10).`;
    }

    const categories = [
      { key: 'centering', label: 'Centering', score: centScore, notes: centNote },
      { key: 'corners', label: 'Corners', score: cornScore, notes: cornNote },
      { key: 'edges', label: 'Edges', score: edgeScore, notes: edgeNote },
      { key: 'surface', label: 'Surface', score: surfScore, notes: surfNote }
    ];

    const minScore = Math.min(...categories.map(c => c.score));
    const lowestCats = categories.filter(c => c.score === minScore);
    const lowestLabel = lowestCats.map(c => `${c.label} (${c.score}/10)`).join(' & ');

    let verdict;
    if (isPristine) {
      verdict = "Perfect 10 across Centering, Corners, Edges, and Surface — earned Mike's top MGS Pristine 10 seal.";
    } else if (finalGrade === 9.5) {
      if (raw === 9.5) {
        verdict = `Three perfect 10 sub-grades held back only by ${lowestLabel} — awarded MGS Gem Mint 9.5.`;
      } else {
        verdict = `Clean 9+ sub-grades across the board elevated to MGS Gem Mint 9.5 on strong overall eye appeal.`;
      }
    } else {
      verdict = `${lowestLabel} ${lowestCats.length > 1 ? 'were' : 'was'} the primary drag on this MGS score, capping the overall grade near the weakest sub-grade.`;
      if (cond.isGraded && Number(finalGrade) !== Number(raw)) {
        const diff = Number(finalGrade) - Number(raw);
        if (diff > 0) {
          verdict += ` Mike's final eye-appeal review nudged the grade +${diff} from a raw ${raw}.`;
        } else {
          verdict += ` Mike's strict final inspection held the grade ${diff} below raw ${raw}.`;
        }
      }
    }

    return {
      headline: meta.label,
      grade: finalGrade,
      verdict,
      categories
    };
  }

  function getValueMultiplier(condInput) {
    if (!condInput || !condInput.isGraded) return 1.0;
    const meta = getGradeMeta(condInput.grade, condInput.isPristine);
    return meta.mult || 1.0;
  }

  function getCardImgStyle(condInput) {
    if (!condInput) return '';
    const cond = ensureHydratedCondition(condInput);
    const cDef = cond.defects.find(d => d.cat === 'centering');
    const surf = Number(cond.subgrades?.surface ?? 10);

    let transform = '';
    if (cDef) {
      const sx = cDef.shiftX || 0;
      const sy = cDef.shiftY || 0;
      const rot = cDef.twistDeg || 0;
      const sc = +(1 + Math.min(0.05, (Math.abs(sx) + Math.abs(sy) + Math.abs(rot) * 2) * 0.0045)).toFixed(3);
      transform = `transform: translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${sc});`;
    }

    let filter = '';
    if (surf >= 9.5) {
      filter = 'filter: contrast(1.03) saturate(1.04);';
    } else if (surf < 8.0) {
      const wear = clamp((8.0 - surf) / 7.0, 0, 1);
      const contrast = +(1.0 - wear * 0.16).toFixed(2);
      const sat = +(1.0 - wear * 0.34).toFixed(2);
      const sepia = +(wear * 0.22).toFixed(2);
      const bright = +(1.0 - wear * 0.06).toFixed(2);
      filter = `filter: contrast(${contrast}) saturate(${sat}) sepia(${sepia}) brightness(${bright});`;
    }
    return `${transform} ${filter}`.trim();
  }

  function renderCornerSvg(d) {
    const s = d.size || 8;
    const op = d.opacity ?? 0.85;
    const j = d.jag || [0.4, 0.6, 0.5];
    const ax = s * (d.asym || 1);
    const ay = s / (d.asym || 1);

    // Map canonical TL coordinates (0,0 -> ax,ay) into the target corner
    const mapPt = (x, y) => {
      if (d.corner === 'TL') return `${x.toFixed(1)},${y.toFixed(1)}`;
      if (d.corner === 'TR') return `${(300 - x).toFixed(1)},${y.toFixed(1)}`;
      if (d.corner === 'BL') return `${x.toFixed(1)},${(420 - y).toFixed(1)}`;
      return `${(300 - x).toFixed(1)},${(420 - y).toFixed(1)}`;
    };

    if (d.variant === 'pinpoint_fleck') {
      const p = `${mapPt(0, 0)} ${mapPt(ax * 0.7, 0)} ${mapPt(ax * 0.45, ay * 0.35)} ${mapPt(0, ay * 0.65)}`;
      return `<polygon points="${p}" fill="#efe6d2" opacity="${op}"/>`;
    }
    if (d.variant === 'jagged_flake') {
      const p1 = mapPt(0, 0);
      const p2 = mapPt(ax * 1.15, 0);
      const p3 = mapPt(ax * (0.65 + j[0] * 0.3), ay * (0.3 + j[1] * 0.2));
      const p4 = mapPt(ax * (0.35 + j[2] * 0.2), ay * (0.62 + j[0] * 0.25));
      const p5 = mapPt(0, ay * 1.12);
      return `
        <polygon points="${p1} ${p2} ${p3} ${p4} ${p5}" fill="#ebe2cd" opacity="${op}"/>
        <polyline points="${p2} ${p3} ${p4} ${p5}" fill="none" stroke="#2c2219" stroke-width="0.9" opacity="0.62"/>
      `;
    }
    if (d.variant === 'layer_split') {
      const tri = `${mapPt(0, 0)} ${mapPt(ax * 0.9, 0)} ${mapPt(0, ay * 0.9)}`;
      const l1 = `${mapPt(2, ay * 1.15)} ${mapPt(ax * 1.15, 2)}`;
      const l2 = `${mapPt(2, ay * 1.45)} ${mapPt(ax * 1.45, 2)}`;
      return `
        <polygon points="${tri}" fill="#dfd3b8" opacity="${op}"/>
        <polyline points="${l1}" fill="none" stroke="#f5edd9" stroke-width="1.2" opacity="0.82"/>
        <polyline points="${l2}" fill="none" stroke="#291f14" stroke-width="0.85" opacity="0.58"/>
      `;
    }
    if (d.variant === 'corner_pinch') {
      const k = Math.max(14, s * 1.45);
      const foldPts = `${mapPt(0, k)} ${mapPt(k, 0)} ${mapPt(0, 0)}`;
      const pA = mapPt(0, k);
      const pB = mapPt(k, 0);
      return `
        <polygon points="${foldPts}" fill="#dcd0b5" opacity="${(op * 0.45).toFixed(2)}"/>
        <polyline points="${pA} ${pB}" fill="none" stroke="rgba(18,14,10,0.68)" stroke-width="2.0" stroke-linecap="round"/>
        <polyline points="${mapPt(1, k - 1)} ${mapPt(k - 1, 1)}" fill="none" stroke="rgba(248,242,226,0.82)" stroke-width="1.1" stroke-linecap="round"/>
      `;
    }
    // 'blunted_rub'
    const rx = d.corner.includes('L') ? 0 : 300;
    const ry = d.corner.includes('T') ? 0 : 420;
    return `<circle cx="${rx}" cy="${ry}" r="${(s * 1.15).toFixed(1)}" fill="#e3d7bc" opacity="${(op * 0.58).toFixed(2)}"/>`;
  }

  function renderEdgeSvg(d) {
    const op = d.opacity ?? 0.75;
    const horiz = d.edge === 'T' || d.edge === 'B';
    const len = horiz ? 300 : 420;
    const start = d.pos * len;
    const end = Math.min(len - 10, start + d.span * len);
    const fixed = (d.edge === 'T' || d.edge === 'L') ? 1.5 : (horiz ? 418.5 : 298.5);
    const inward = (d.edge === 'T' || d.edge === 'L') ? 1 : -1;

    if (d.variant === 'edge_silvering') {
      const p = horiz
        ? `M${start.toFixed(1)},${fixed} L${end.toFixed(1)},${fixed}`
        : `M${fixed},${start.toFixed(1)} L${fixed},${end.toFixed(1)}`;
      return `<path d="${p}" fill="none" stroke="#efe6d2" stroke-width="${Math.min(3.5, d.depth || 2).toFixed(1)}" stroke-dasharray="6 3 11 2" opacity="${op}"/>`;
    }
    if (d.variant === 'edge_dent') {
      const mid = (start + end) * 0.5;
      const dep = Math.max(3, (d.depth || 3) * 1.4) * inward;
      const pts = horiz
        ? `${(mid - 5).toFixed(1)},${fixed} ${mid.toFixed(1)},${(fixed + dep).toFixed(1)} ${(mid + 5).toFixed(1)},${fixed}`
        : `${fixed},${(mid - 5).toFixed(1)} ${(fixed + dep).toFixed(1)},${mid.toFixed(1)} ${fixed},${(mid + 5).toFixed(1)}`;
      return `
        <polygon points="${pts}" fill="#17110b" opacity="0.82"/>
        <polyline points="${pts}" fill="none" stroke="#efe6d0" stroke-width="1.0" opacity="0.78"/>
      `;
    }
    if (d.variant === 'factory_burr') {
      const p = horiz
        ? `M${start.toFixed(1)},${fixed} Q${((start + end) * 0.5).toFixed(1)},${(fixed + inward * 2.2).toFixed(1)} ${end.toFixed(1)},${fixed}`
        : `M${fixed},${start.toFixed(1)} Q${(fixed + inward * 2.2).toFixed(1)},${((start + end) * 0.5).toFixed(1)} ${fixed},${end.toFixed(1)}`;
      return `<path d="${p}" fill="none" stroke="#e8dcc4" stroke-width="1.4" stroke-dasharray="2 2" opacity="${op}"/>`;
    }
    // 'micro_nicks'
    return (d.specks || []).map(sp => {
      const c = start + sp.t * (end - start);
      const cx = horiz ? c : fixed + inward * 0.6;
      const cy = horiz ? fixed + inward * 0.6 : c;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${sp.r}" fill="#ebe2ce" opacity="${op}"/>`;
    }).join('');
  }

  function renderSurfaceSvg(d) {
    const op = d.opacity ?? 0.55;
    if (d.variant === 'print_line') {
      const coords = d.horiz
        ? `x1="4" y1="${(d.pos * 420).toFixed(1)}" x2="296" y2="${(d.pos * 420).toFixed(1)}"`
        : `x1="${(d.pos * 300).toFixed(1)}" y1="4" x2="${(d.pos * 300).toFixed(1)}" y2="416"`;
      return {
        tilt: true,
        svg: `<line ${coords} stroke="rgba(255,255,255,${op})" stroke-width="0.95"/>`
      };
    }
    if (d.variant === 'printer_hickey') {
      return {
        tilt: false,
        svg: `
          <circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="none" stroke="#f4ecd8" stroke-width="1.1" opacity="${op}"/>
          <circle cx="${d.x}" cy="${d.y}" r="${(d.r * 0.34).toFixed(1)}" fill="#1b2430" opacity="${(op * 0.72).toFixed(2)}"/>
        `
      };
    }
    if (d.variant === 'matte_cloud') {
      return {
        tilt: false,
        svg: `<ellipse cx="${d.x}" cy="${d.y}" rx="${d.rx}" ry="${d.ry}" fill="#dcd5c6" opacity="${op}"/>`
      };
    }
    if (d.variant === 'crease') {
      const mx = (d.x1 + d.x2) * 0.5 + (d.bend || 0);
      const my = (d.y1 + d.y2) * 0.5 + (d.bend || 0);
      const pathD = `M${d.x1},${d.y1} Q${mx},${my} ${d.x2},${d.y2}`;
      const hiD = `M${d.x1},${d.y1 - 1.4} Q${mx},${my - 1.4} ${d.x2},${d.y2 - 1.4}`;
      return {
        tilt: false,
        svg: `
          <path d="${pathD}" fill="none" stroke="rgba(16,11,6,${op})" stroke-width="2.6" stroke-linecap="round"/>
          <path d="${hiD}" fill="none" stroke="rgba(244,236,216,${Math.min(0.92, op + 0.1)})" stroke-width="1.3" stroke-linecap="round"/>
        `
      };
    }
    if (d.variant === 'curved_scratch') {
      const mx = (d.x1 + d.x2) * 0.5 + (d.bend || 14);
      const my = (d.y1 + d.y2) * 0.5 - (d.bend || 14);
      return {
        tilt: true,
        svg: `
          <path d="M${d.x1},${d.y1} Q${mx},${my} ${d.x2},${d.y2}" fill="none" stroke="rgba(18,22,30,${op})" stroke-width="1.1" stroke-linecap="round"/>
          <path d="M${d.x1 + 0.8},${d.y1 - 0.8} Q${mx + 0.8},${my - 0.8} ${d.x2 + 0.8},${d.y2 - 0.8}" fill="none" stroke="rgba(255,250,238,${Math.min(0.85, op + 0.14)})" stroke-width="0.8" stroke-linecap="round"/>
        `
      };
    }
    if (d.variant === 'scuff_cluster') {
      const cnt = d.count || 3;
      let out = '';
      for (let i = 0; i < cnt; i++) {
        const off = i * 4.5;
        out += `
          <line x1="${d.x1 + off}" y1="${d.y1 + off}" x2="${d.x2 + off}" y2="${d.y2 + off}" stroke="rgba(18,22,30,${op})" stroke-width="0.95"/>
          <line x1="${d.x1 + off}" y1="${d.y1 + off - 0.8}" x2="${d.x2 + off}" y2="${d.y2 + off - 0.8}" stroke="rgba(255,250,238,${op})" stroke-width="0.65"/>
        `;
      }
      return { tilt: true, svg: out };
    }
    // 'hairline_scratch'
    return {
      tilt: true,
      svg: `
        <line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="rgba(16,18,24,${op})" stroke-width="1.05" stroke-linecap="round"/>
        <line x1="${d.x1 + 0.7}" y1="${d.y1 - 0.7}" x2="${d.x2 + 0.7}" y2="${d.y2 - 0.7}" stroke="rgba(255,248,232,${Math.min(0.82, op + 0.14)})" stroke-width="0.75" stroke-linecap="round"/>
      `
    };
  }

  function renderConditionOverlayHtml(condInput, opts = {}) {
    if (!condInput) return '';
    const cond = ensureHydratedCondition(condInput);
    const compact = Boolean(opts.compact);
    const showSlabBadge = opts.showSlabBadge !== false;
    const showDefects = opts.showDefects !== false;
    const includeTiltGlare = Boolean(opts.includeTiltGlare);

    const staticParts = [];
    const tiltParts = [];
    if (showDefects) {
      for (const d of (cond.defects || [])) {
        if (d.cat === 'corner') {
          staticParts.push(renderCornerSvg(d));
        } else if (d.cat === 'edge') {
          staticParts.push(renderEdgeSvg(d));
        } else if (d.cat === 'surface') {
          const res = renderSurfaceSvg(d);
          if (res.tilt) tiltParts.push(res.svg);
          else staticParts.push(res.svg);
        }
      }
    }

    const surf = Number(cond.subgrades?.surface ?? 10);
    const vigOp = (showDefects && surf < 7.5) ? clamp((7.5 - surf) * 0.065, 0, 0.38).toFixed(2) : 0;
    const vignetteHtml = Number(vigOp) > 0
      ? `<div class="card-grade-vignette" style="opacity:${vigOp};"></div>`
      : '';

    const slabHtml = (showSlabBadge && cond.isGraded)
      ? (() => {
          const meta = getGradeMeta(cond.grade, cond.isPristine);
          return `<span class="card-slab-badge tier-${meta.tier}${compact ? ' compact' : ''}" title="${meta.label} (Official Graded Slab — ${meta.mult}x Value)">${compact ? meta.short : meta.label}</span>`;
        })()
      : '';

    const glareHtml = includeTiltGlare ? `<div class="card-tilt-glare"></div>` : '';

    const sleeveHtml = (!cond.isGraded && (cond.sleeveTier === 'clear_sleeve' || cond.sleeveTier === 'pro_sleeve'))
      ? `<span class="card-sleeve-badge${cond.sleeveTier === 'pro_sleeve' ? ' is-matte' : ''}${compact ? ' compact' : ''}" title="${cond.sleeveTier === 'pro_sleeve' ? 'Pro Matte Sleeve (95% wear block)' : 'Pro Sleeve (75% wear block)'}">${cond.sleeveTier === 'pro_sleeve' ? '✨' : '🛡️'}</span>`
      : '';

    const svgHtml = showDefects
      ? `<svg class="card-defect-svg" viewBox="0 0 300 420" preserveAspectRatio="none" aria-hidden="true">
        <g class="defect-static-layer">${staticParts.join('')}</g>
        <g class="defect-tilt-layer">${tiltParts.join('')}</g>
      </svg>`
      : '';

    return `
      ${vignetteHtml}
      ${svgHtml}
      ${glareHtml}
      ${slabHtml}
      ${sleeveHtml}
    `;
  }

  function attachInspectTilt(stageEl) {
    if (!stageEl || stageEl._tiltBound) return;
    stageEl._tiltBound = true;
    const reset = () => {
      stageEl.style.setProperty('--tilt-x', '0deg');
      stageEl.style.setProperty('--tilt-y', '0deg');
      stageEl.style.setProperty('--glare-x', '50%');
      stageEl.style.setProperty('--glare-y', '30%');
      stageEl.style.setProperty('--glare-op', '0');
    };
    const applyPoint = (clientX, clientY) => {
      const rect = stageEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = clamp((clientX - rect.left) / rect.width, 0, 1);
      const ny = clamp((clientY - rect.top) / rect.height, 0, 1);
      const tiltY = ((nx - 0.5) * 14).toFixed(2);
      const tiltX = ((0.5 - ny) * 14).toFixed(2);
      stageEl.style.setProperty('--tilt-x', `${tiltX}deg`);
      stageEl.style.setProperty('--tilt-y', `${tiltY}deg`);
      stageEl.style.setProperty('--glare-x', `${(nx * 100).toFixed(1)}%`);
      stageEl.style.setProperty('--glare-y', `${(ny * 100).toFixed(1)}%`);
      stageEl.style.setProperty('--glare-op', '1');
    };
    reset();
    stageEl.addEventListener('pointerdown', (e) => {
      applyPoint(e.clientX, e.clientY);
      if (e.pointerType === 'touch') {
        stageEl.setPointerCapture?.(e.pointerId);
      }
    });
    stageEl.addEventListener('pointermove', (e) => {
      applyPoint(e.clientX, e.clientY);
    });
    stageEl.addEventListener('pointerup', reset);
    stageEl.addEventListener('pointerleave', reset);
    stageEl.addEventListener('pointercancel', reset);
  }

  window.MythosCardGrading = {
    GRADE_INFO,
    rollCondition,
    ensureHydratedCondition,
    computeRawGrade,
    getGradeMeta,
    applyWear,
    gradeCard,
    crackSlab,
    buildGradeSummary,
    getValueMultiplier,
    getCardImgStyle,
    renderConditionOverlayHtml,
    attachInspectTilt
  };
})();
