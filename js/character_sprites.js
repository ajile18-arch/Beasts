/**
 * MYTHOS — Illustrated 16-Bit/32-Bit RPG Pixel-Art Character Renderer
 * Combines high-detail normalized 4x4 PNG character sheets (Sprites/Characters/)
 * with Canvas2D modular palette tinting (zero getImageData for file:/// safety)
 * and cached full-sheet compositing for 60 FPS Character Creator & Overworld playback.
 */

(function () {
  'use strict';

  const SKIN_TONES = [
    { id: 'light', name: 'Fair Peach', hi: '#ffe4cf', base: '#ffd4b4', shadow: '#cc926b', ink: '#24140e' },
    { id: 'warm', name: 'Warm Honey', hi: '#fce2c4', base: '#f0b884', shadow: '#b87a46', ink: '#24140e' },
    { id: 'olive', name: 'Golden Olive', hi: '#edc394', base: '#d99e68', shadow: '#9c6634', ink: '#221208' },
    { id: 'tan', name: 'Sunlit Tan', hi: '#d6995b', base: '#c27f3b', shadow: '#874d18', ink: '#201004' },
    { id: 'brown', name: 'Rich Umber', hi: '#a86a38', base: '#8c5324', shadow: '#542c0d', ink: '#1a0b02' },
    { id: 'deep', name: 'Deep Espresso', hi: '#784b31', base: '#5e3824', shadow: '#361c0f', ink: '#120702' }
  ];

  const HAIR_COLORS = [
    { id: 'chestnut', name: 'Chestnut Brown', hi: '#b57249', base: '#7d4627', dark: '#3e2010' },
    { id: 'blonde', name: 'Golden Blonde', hi: '#fef08a', base: '#eab308', dark: '#854d0e' },
    { id: 'crimson', name: 'Ruby Flame', hi: '#fca5a5', base: '#dc2626', dark: '#7f1d1d' },
    { id: 'midnight', name: 'Midnight Blue', hi: '#64748b', base: '#334155', dark: '#111827' },
    { id: 'ginger', name: 'Copper Ginger', hi: '#fdba74', base: '#ea580c', dark: '#7c2d12' },
    { id: 'silver', name: 'Moonlit Silver', hi: '#ffffff', base: '#cbd5e1', dark: '#475569' },
    { id: 'emerald', name: 'Forest Emerald', hi: '#86efac', base: '#16a34a', dark: '#14532d' },
    { id: 'amethyst', name: 'Mystic Lavender', hi: '#e9d5ff', base: '#9333ea', dark: '#4c1d95' }
  ];

  const EYE_COLORS = [
    { id: 'blue', name: 'Sapphire', hi: '#93c5fd', base: '#2563eb', dark: '#172554' },
    { id: 'emerald', name: 'Emerald', hi: '#86efac', base: '#16a34a', dark: '#052e16' },
    { id: 'amber', name: 'Amber Gold', hi: '#fde047', base: '#d97706', dark: '#451a03' },
    { id: 'brown', name: 'Dark Hazel', hi: '#b47b4d', base: '#6b3e1b', dark: '#29150e' },
    { id: 'violet', name: 'Amethyst', hi: '#e879f9', base: '#7e22ce', dark: '#3b0764' },
    { id: 'crimson', name: 'Crimson', hi: '#fca5a5', base: '#dc2626', dark: '#450a0a' }
  ];

  const OUTFIT_COLORS = [
    { id: 'cobalt', name: 'Duelist Blue', hi: '#7892e6', base: '#4d65ba', dark: '#29376e', accent: '#fbbf24' },
    { id: 'crimson', name: 'Valor Red', hi: '#f87171', base: '#d63333', dark: '#7f1d1d', accent: '#fde047' },
    { id: 'ranger', name: 'Emerald Seeker', hi: '#4ade80', base: '#1e9e52', dark: '#064e3b', accent: '#fbbf24' },
    { id: 'royal', name: 'Twilight Purple', hi: '#c084fc', base: '#8234d4', dark: '#3b0764', accent: '#38bdf8' },
    { id: 'charcoal', name: 'Shadow Jet', hi: '#94a3b8', base: '#475569', dark: '#1e242e', accent: '#f43f5e' },
    { id: 'gold', name: 'Solar Champion', hi: '#fde047', base: '#d49611', dark: '#713f12', accent: '#38bdf8' }
  ];

  const PANTS_COLORS = [
    { id: 'denim', name: 'Slate Denim', base: '#4e5f7a', dark: '#242c3a' },
    { id: 'dark', name: 'Obsidian Black', base: '#363c48', dark: '#161920' },
    { id: 'khaki', name: 'Sand Khaki', base: '#ad8c54', dark: '#5c4522' },
    { id: 'crimson', name: 'Track Red', base: '#8c2828', dark: '#450a0a' },
    { id: 'navy', name: 'Deep Navy', base: '#344970', dark: '#19243b' }
  ];

  const HAIR_STYLES = [
    { id: 'spiky', name: 'Spiky Duelist' },
    { id: 'swept', name: 'Wind-Swept Ace' },
    { id: 'bob', name: 'Sleek Bob' },
    { id: 'long', name: 'Flowing Locks' },
    { id: 'ponytail', name: 'Battle Ponytail' }
  ];

  const OUTFIT_STYLES = [
    { id: 'jacket', name: 'Popped Jacket' },
    { id: 'hoodie', name: 'Street Hoodie' },
    { id: 'vest', name: 'Academy Vest' },
    { id: 'coat', name: 'Champion Trench' }
  ];

  const HAT_STYLES = [
    { id: 'none', name: 'No Hat (Halo)' },
    { id: 'cap', name: 'Duelist Visor' },
    { id: 'goggles', name: 'Ace Goggles' },
    { id: 'headband', name: 'Battle Band' },
    { id: 'crown', name: 'Mythos Circlet' }
  ];

  const DEFAULT_APPEARANCE = {
    name: 'Asher',
    worldName: 'Oakhaven',
    skin: 'light',
    hairStyle: 'spiky',
    hairColor: 'chestnut',
    eyeColor: 'blue',
    outfitStyle: 'jacket',
    outfitColor: 'cobalt',
    pantsColor: 'denim',
    hatStyle: 'none'
  };

  function findById(list, id) {
    return list.find(x => x.id === id) || list[0];
  }

  // Sprite sheet assets & metadata (each sheet is 384x384, 4x4 of 96x96 cells, feet at y=91)
  const SHEET_SIZE = 384;
  const CELL = 96;
  const ARCHETYPE_KEYS = ['jacket', 'hoodie', 'vest', 'trench'];
  const LAYER_NAMES = ['ink', 'skin', 'hair', 'eyes', 'outfit', 'pants'];
  const OUTFIT_TO_KEY = { jacket: 'jacket', hoodie: 'hoodie', vest: 'vest', coat: 'trench' };
  const HAIR_TO_KEY = { spiky: 'jacket', swept: 'hoodie', bob: 'vest', long: 'vest', ponytail: 'trench' };
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

  const spriteBank = {};
  let pendingRedrawTimer = null;

  function scheduleCreatorRefresh() {
    if (pendingRedrawTimer) return;
    pendingRedrawTimer = setTimeout(() => {
      pendingRedrawTimer = null;
      composedCache.clear();
      if (window.mythosOverworld && typeof window.mythosOverworld.renderCreatorPreview === 'function') {
        window.mythosOverworld.renderCreatorPreview();
      }
    }, 30);
  }

  function preloadCharacterSheets() {
    for (const arch of ARCHETYPE_KEYS) {
      spriteBank[arch] = {};
      for (const layer of LAYER_NAMES) {
        const img = new Image();
        img.src = `Sprites/Characters/hero_${arch}_${layer}.png`;
        img.onload = scheduleCreatorRefresh;
        spriteBank[arch][layer] = img;
      }
    }
  }
  preloadCharacterSheets();

  function isArchReady(arch) {
    const set = spriteBank[arch];
    if (!set) return false;
    for (const layer of LAYER_NAMES) {
      const img = set[layer];
      if (!img || !img.complete || img.naturalWidth === 0) return false;
    }
    return true;
  }

  // Reusable scratch canvases (never call getImageData — 100% file:/// safe)
  let workCanvas = null;
  let workCtx = null;
  let hairSilCanvas = null;
  let hairSilCtx = null;
  let hairOutCanvas = null;
  let hairOutCtx = null;

  function ensureScratch() {
    if (!workCanvas) {
      workCanvas = document.createElement('canvas');
      workCanvas.width = SHEET_SIZE;
      workCanvas.height = SHEET_SIZE;
      workCtx = workCanvas.getContext('2d');
      workCtx.imageSmoothingEnabled = false;

      hairSilCanvas = document.createElement('canvas');
      hairSilCanvas.width = SHEET_SIZE;
      hairSilCanvas.height = SHEET_SIZE;
      hairSilCtx = hairSilCanvas.getContext('2d');
      hairSilCtx.imageSmoothingEnabled = false;

      hairOutCanvas = document.createElement('canvas');
      hairOutCanvas.width = SHEET_SIZE;
      hairOutCanvas.height = SHEET_SIZE;
      hairOutCtx = hairOutCanvas.getContext('2d');
      hairOutCtx.imageSmoothingEnabled = false;
    }
  }

  function renderTintedLayerToWork(maskImg, tintHex) {
    workCtx.globalCompositeOperation = 'source-over';
    workCtx.clearRect(0, 0, SHEET_SIZE, SHEET_SIZE);
    workCtx.fillStyle = tintHex;
    workCtx.fillRect(0, 0, SHEET_SIZE, SHEET_SIZE);
    workCtx.globalCompositeOperation = 'multiply';
    workCtx.drawImage(maskImg, 0, 0, SHEET_SIZE, SHEET_SIZE);
    workCtx.globalCompositeOperation = 'destination-in';
    workCtx.drawImage(maskImg, 0, 0, SHEET_SIZE, SHEET_SIZE);
    workCtx.globalCompositeOperation = 'source-over';
  }

  function drawFlowingLongLocks(ctx, hair, dirRow) {
    const px = (cx, cy, x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(cx + x, cy + y, w, h);
    };
    const INK = '#1e1410';
    for (let col = 0; col < 4; col++) {
      const cx = col * CELL;
      const cy = dirRow * CELL;
      const bob = (col === 1 || col === 3) ? -1 : 0;
      const y0 = cy + bob;
      if (dirRow === 0) {
        // Soft shoulder-length flowing tendrils behind shoulders
        px(cx, y0, 26, 39, 8, 22, INK);
        px(cx, y0, 27, 40, 6, 20, hair.dark);
        px(cx, y0, 28, 41, 4, 17, hair.base);
        px(cx, y0, 62, 39, 8, 22, INK);
        px(cx, y0, 63, 40, 6, 20, hair.dark);
        px(cx, y0, 64, 41, 4, 17, hair.base);
      } else if (dirRow === 1) {
        px(cx, y0, 48, 38, 12, 23, INK);
        px(cx, y0, 49, 39, 10, 21, hair.dark);
        px(cx, y0, 50, 40, 8, 18, hair.base);
      } else if (dirRow === 2) {
        px(cx, y0, 36, 38, 12, 23, INK);
        px(cx, y0, 37, 39, 10, 21, hair.dark);
        px(cx, y0, 38, 40, 8, 18, hair.base);
      } else if (dirRow === 3) {
        // Rich cascading back locks over upper coat/jacket
        px(cx, y0, 30, 34, 36, 28, INK);
        px(cx, y0, 32, 35, 32, 25, hair.dark);
        px(cx, y0, 34, 36, 28, 22, hair.base);
        px(cx, y0, 38, 38, 20, 10, hair.hi);
      }
    }
  }

  const composedCache = new Map();
  const MAX_CACHE_SIZE = 48;

  function getComposedSheet(app) {
    const outfitKey = OUTFIT_TO_KEY[app.outfitStyle || 'jacket'] || 'jacket';
    const hairStyle = app.hairStyle || 'spiky';
    const hairKey = HAIR_TO_KEY[hairStyle] || 'jacket';
    if (!isArchReady(outfitKey) || !isArchReady(hairKey)) return null;

    const skin = findById(SKIN_TONES, app.skin);
    const hair = findById(HAIR_COLORS, app.hairColor);
    const eye = findById(EYE_COLORS, app.eyeColor);
    const outfit = findById(OUTFIT_COLORS, app.outfitColor);
    const pants = findById(PANTS_COLORS, app.pantsColor);

    const cacheKey = `${outfitKey}|${hairStyle}|${hair.id}|${skin.id}|${eye.id}|${outfit.id}|${pants.id}`;
    if (composedCache.has(cacheKey)) {
      return composedCache.get(cacheKey);
    }

    ensureScratch();
    const out = document.createElement('canvas');
    out.width = SHEET_SIZE;
    out.height = SHEET_SIZE;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;

    const ob = spriteBank[outfitKey];
    const hb = spriteBank[hairKey];
    const nativeMatch = (hairKey === outfitKey && hairStyle !== 'long');

    // Optional back flowing locks behind body for 'long' front/sides
    if (hairStyle === 'long') {
      drawFlowingLongLocks(octx, hair, 0);
      drawFlowingLongLocks(octx, hair, 1);
      drawFlowingLongLocks(octx, hair, 2);
    }

    // Composite body layers in strict depth order
    renderTintedLayerToWork(ob.pants, pants.base);
    octx.drawImage(workCanvas, 0, 0);

    renderTintedLayerToWork(ob.outfit, outfit.base);
    octx.drawImage(workCanvas, 0, 0);

    renderTintedLayerToWork(ob.skin, skin.base);
    octx.drawImage(workCanvas, 0, 0);

    renderTintedLayerToWork(ob.eyes, eye.base);
    octx.drawImage(workCanvas, 0, 0);

    if (nativeMatch) {
      // Exact native hair + hand-inked sheet outline
      renderTintedLayerToWork(hb.hair, hair.base);
      octx.drawImage(workCanvas, 0, 0);
      octx.drawImage(ob.ink, 0, 0, SHEET_SIZE, SHEET_SIZE);
    } else {
      // Keep body, collar, eyes, boots ink below crown line (y >= 31 in each 96x96 cell)
      for (let r = 0; r < 4; r++) {
        const cy = r * CELL;
        octx.drawImage(ob.ink, 0, cy + 31, SHEET_SIZE, CELL - 31, 0, cy + 31, SHEET_SIZE, CELL - 31);
      }

      if (hairStyle === 'long') {
        drawFlowingLongLocks(octx, hair, 3);
      }

      // Render tinted cross-archetype hair with crisp 1px dark RPG pixel outline
      renderTintedLayerToWork(hb.hair, hair.base);
      hairOutCtx.clearRect(0, 0, SHEET_SIZE, SHEET_SIZE);
      hairOutCtx.drawImage(workCanvas, 0, 0);

      hairSilCtx.globalCompositeOperation = 'source-over';
      hairSilCtx.clearRect(0, 0, SHEET_SIZE, SHEET_SIZE);
      hairSilCtx.fillStyle = '#1b1210';
      hairSilCtx.fillRect(0, 0, SHEET_SIZE, SHEET_SIZE);
      hairSilCtx.globalCompositeOperation = 'destination-in';
      hairSilCtx.drawImage(hb.hair, 0, 0, SHEET_SIZE, SHEET_SIZE);
      hairSilCtx.globalCompositeOperation = 'source-over';

      octx.drawImage(hairSilCanvas, -1, 0);
      octx.drawImage(hairSilCanvas, 1, 0);
      octx.drawImage(hairSilCanvas, 0, -1);
      octx.drawImage(hairSilCanvas, 0, 1);
      octx.drawImage(hairOutCanvas, 0, 0);
    }

    if (composedCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = composedCache.keys().next().value;
      composedCache.delete(oldestKey);
    }
    composedCache.set(cacheKey, out);
    return out;
  }

  // Draw crisp RPG accessories (cap, goggles, headband, crown) aligned in screen coords over head
  function drawHatOverlay(ctx, hatStyle, outfit, cx, footY, drawW, drawH, dir, phase) {
    if (!hatStyle || hatStyle === 'none') return;
    const p = drawW / CELL; // pixel scale relative to 96px frame
    const bob = (phase === 1 || phase === 3) ? -2 : 0;
    const ox = Math.round(cx - drawW / 2);
    const oy = Math.round(footY - (91 * p)); // cell y=0..96 maps footY at y=91
    const r = (gx, gy, gw, gh, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(
        Math.round(ox + gx * p),
        Math.round(oy + (gy + bob) * p),
        Math.max(1, Math.round(gw * p)),
        Math.max(1, Math.round(gh * p))
      );
    };
    const INK = '#1c1210';

    if (hatStyle === 'cap') {
      // Shaded Duelist Visor Cap seated cleanly at head crown (y=11..26)
      r(28, 12, 40, 14, INK);
      r(30, 13, 36, 11, outfit.base);
      r(32, 13, 32, 5, outfit.hi);
      r(35, 19, 26, 4, outfit.dark);
      if (dir === 'down') {
        r(30, 23, 36, 5, INK);
        r(32, 24, 32, 3, outfit.dark);
        r(43, 15, 10, 4, outfit.accent);
      } else if (dir === 'left') {
        r(22, 22, 20, 5, INK);
        r(24, 23, 18, 3, outfit.dark);
      } else if (dir === 'right') {
        r(54, 22, 20, 5, INK);
        r(54, 23, 18, 3, outfit.dark);
      } else {
        r(38, 22, 20, 4, '#f8fafc');
      }
    } else if (hatStyle === 'goggles') {
      r(29, 17, 38, 6, INK);
      r(30, 18, 36, 4, '#6b4226');
      if (dir !== 'up') {
        const shift = dir === 'left' ? -5 : (dir === 'right' ? 5 : 0);
        r(31 + shift, 14, 15, 10, INK);
        r(50 + shift, 14, 15, 10, INK);
        r(32 + shift, 15, 13, 8, '#b47a44');
        r(51 + shift, 15, 13, 8, '#b47a44');
        r(34 + shift, 16, 9, 6, '#38bdf8');
        r(53 + shift, 16, 9, 6, '#38bdf8');
        r(35 + shift, 16, 4, 2, '#e0f2fe');
        r(54 + shift, 16, 4, 2, '#e0f2fe');
      }
    } else if (hatStyle === 'headband') {
      r(29, 18, 38, 6, INK);
      r(30, 19, 36, 4, outfit.accent);
      r(32, 19, 32, 2, '#fffbeb');
      if (dir !== 'down') {
        const tx = dir === 'left' ? 66 : (dir === 'right' ? 24 : 52);
        r(tx, 21, 7, 11, INK);
        r(tx + 1, 22, 5, 9, outfit.accent);
      }
    } else if (hatStyle === 'crown') {
      r(33, 6, 30, 12, INK);
      r(35, 11, 26, 6, '#facc15');
      r(35, 7, 5, 5, '#fef08a');
      r(45, 5, 6, 7, '#fef08a');
      r(56, 7, 5, 5, '#fef08a');
      if (dir !== 'up') {
        r(46, 12, 4, 4, '#ef4444');
      }
    }
  }

  function drawVariation3B(ctx, app, cx, footY, dir = 'down', walkTick = 0, scale = 1.0) {
    const resolved = { ...DEFAULT_APPEARANCE, ...app };
    const sheet = getComposedSheet(resolved);
    const isWalking = walkTick > 0;
    const phase = isWalking ? (Math.floor(walkTick * 2.4) % 4) : 0; // 0=idle, 1=stepL, 2=idle, 3=stepR
    const cellDrawSize = Math.max(24, Math.round(CELL * scale * 0.36));

    // Soft warm RPG elliptical ground shadow anchored at feet
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(20, 14, 10, 0.36)';
    ctx.beginPath();
    ctx.ellipse(
      Math.round(cx),
      Math.round(footY + Math.max(1, scale * 0.9)),
      Math.round(cellDrawSize * 0.25),
      Math.max(3, Math.round(cellDrawSize * 0.085)),
      0, 0, Math.PI * 2
    );
    ctx.fill();

    const drawX = Math.round(cx - cellDrawSize / 2);
    const drawY = Math.round(footY - (91 / CELL) * cellDrawSize);

    if (sheet) {
      const row = DIR_ROW[dir] ?? 0;
      const sx = phase * CELL;
      const sy = row * CELL;
      ctx.drawImage(sheet, sx, sy, CELL, CELL, drawX, drawY, cellDrawSize, cellDrawSize);
      const outfit = findById(OUTFIT_COLORS, resolved.outfitColor);
      drawHatOverlay(ctx, resolved.hatStyle, outfit, cx, footY, cellDrawSize, cellDrawSize, dir, phase);
    } else {
      // Minimal warm silhouette placeholder only for the milliseconds while PNGs decode
      const outfit = findById(OUTFIT_COLORS, resolved.outfitColor);
      const skin = findById(SKIN_TONES, resolved.skin);
      ctx.fillStyle = outfit.base;
      ctx.beginPath();
      ctx.roundRect(Math.round(cx - cellDrawSize * 0.16), Math.round(footY - cellDrawSize * 0.45), Math.round(cellDrawSize * 0.32), Math.round(cellDrawSize * 0.38), 4);
      ctx.fill();
      ctx.fillStyle = skin.base;
      ctx.beginPath();
      ctx.arc(Math.round(cx), Math.round(footY - cellDrawSize * 0.56), Math.round(cellDrawSize * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  class CharacterSpriteSheet {
    constructor(appearance = {}) {
      this.setAppearance(appearance);
    }

    setAppearance(appearance = {}) {
      this.appearance = { ...DEFAULT_APPEARANCE, ...appearance };
    }

    draw(ctx, centerX, footY, dir = 'down', walkProgress = 0, scale = 2.5) {
      drawVariation3B(ctx, this.appearance, centerX, footY, dir, walkProgress, scale);
    }
  }

  window.MythosCharacterSprites = {
    SKIN_TONES,
    HAIR_COLORS,
    EYE_COLORS,
    OUTFIT_COLORS,
    PANTS_COLORS,
    HAIR_STYLES,
    HAT_STYLES,
    OUTFIT_STYLES,
    DEFAULT_APPEARANCE,
    CharacterSpriteSheet,
    drawVariation3B
  };
})();
