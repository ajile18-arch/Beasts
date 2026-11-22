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
    { id: 'brown', name: 'Oak Brown', hi: '#a16b44', base: '#6b4226', dark: '#361e0e' },
    { id: 'auburn', name: 'Warm Auburn', hi: '#c2593f', base: '#8c3320', dark: '#451409' },
    { id: 'blonde', name: 'Golden Blonde', hi: '#fef08a', base: '#eab308', dark: '#854d0e' },
    { id: 'crimson', name: 'Ruby Flame', hi: '#fca5a5', base: '#dc2626', dark: '#7f1d1d' },
    { id: 'midnight', name: 'Midnight Blue', hi: '#64748b', base: '#334155', dark: '#111827' },
    { id: 'black', name: 'Obsidian Black', hi: '#475569', base: '#1e293b', dark: '#090d16' },
    { id: 'ginger', name: 'Copper Ginger', hi: '#fdba74', base: '#ea580c', dark: '#7c2d12' },
    { id: 'silver', name: 'Moonlit Silver', hi: '#ffffff', base: '#cbd5e1', dark: '#475569' },
    { id: 'emerald', name: 'Forest Emerald', hi: '#86efac', base: '#16a34a', dark: '#14532d' },
    { id: 'amethyst', name: 'Mystic Lavender', hi: '#e9d5ff', base: '#9333ea', dark: '#4c1d95' }
  ];

  const EYE_COLORS = [
    { id: 'blue', name: 'Sapphire', hi: '#93c5fd', base: '#2563eb', dark: '#172554' },
    { id: 'sapphire', name: 'Royal Sapphire', hi: '#93c5fd', base: '#1d4ed8', dark: '#172554' },
    { id: 'emerald', name: 'Emerald', hi: '#86efac', base: '#16a34a', dark: '#052e16' },
    { id: 'green', name: 'Forest Green', hi: '#86efac', base: '#15803d', dark: '#052e16' },
    { id: 'amber', name: 'Amber Gold', hi: '#fde047', base: '#d97706', dark: '#451a03' },
    { id: 'brown', name: 'Dark Hazel', hi: '#b47b4d', base: '#6b3e1b', dark: '#29150e' },
    { id: 'slate', name: 'Steel Slate', hi: '#cbd5e1', base: '#64748b', dark: '#1e293b' },
    { id: 'violet', name: 'Amethyst', hi: '#e879f9', base: '#7e22ce', dark: '#3b0764' },
    { id: 'crimson', name: 'Crimson', hi: '#fca5a5', base: '#dc2626', dark: '#450a0a' }
  ];

  const OUTFIT_COLORS = [
    { id: 'cobalt', name: 'Duelist Blue', hi: '#7892e6', base: '#4d65ba', dark: '#29376e', accent: '#fbbf24' },
    { id: 'navy', name: 'Harbor Navy', hi: '#60a5fa', base: '#1e3a8a', dark: '#0f172a', accent: '#fbbf24' },
    { id: 'crimson', name: 'Valor Red', hi: '#f87171', base: '#d63333', dark: '#7f1d1d', accent: '#fde047' },
    { id: 'ranger', name: 'Emerald Seeker', hi: '#4ade80', base: '#1e9e52', dark: '#064e3b', accent: '#fbbf24' },
    { id: 'forest', name: 'Deep Forest', hi: '#34d399', base: '#166534', dark: '#064e3b', accent: '#fde047' },
    { id: 'royal', name: 'Twilight Purple', hi: '#c084fc', base: '#8234d4', dark: '#3b0764', accent: '#38bdf8' },
    { id: 'amethyst', name: 'Arcane Violet', hi: '#d8b4fe', base: '#7e22ce', dark: '#3b0764', accent: '#38bdf8' },
    { id: 'charcoal', name: 'Shadow Jet', hi: '#94a3b8', base: '#475569', dark: '#1e242e', accent: '#f43f5e' },
    { id: 'cream', name: 'Clinic Coat White', hi: '#ffffff', base: '#e7e5e4', dark: '#a8a29e', accent: '#0d9488' },
    { id: 'gold', name: 'Solar Champion', hi: '#fde047', base: '#d49611', dark: '#713f12', accent: '#38bdf8' }
  ];

  const PANTS_COLORS = [
    { id: 'denim', name: 'Slate Denim', base: '#4e5f7a', dark: '#242c3a' },
    { id: 'dark', name: 'Obsidian Black', base: '#363c48', dark: '#161920' },
    { id: 'charcoal', name: 'Slate Charcoal', base: '#3f4754', dark: '#1c2026' },
    { id: 'khaki', name: 'Sand Khaki', base: '#ad8c54', dark: '#5c4522' },
    { id: 'crimson', name: 'Track Red', base: '#8c2828', dark: '#450a0a' },
    { id: 'navy', name: 'Deep Navy', base: '#344970', dark: '#19243b' },
    { id: 'teal', name: 'Clinical Teal', base: '#0f766e', dark: '#134e4a' }
  ];

  const HAIR_STYLES = [
    { id: 'spiky', name: 'Spiky Duelist' },
    { id: 'swept', name: 'Wind-Swept Ace' },
    { id: 'bob', name: 'Sleek Bob' },
    { id: 'long', name: 'Flowing Locks' },
    { id: 'ponytail', name: 'Battle Ponytail' }
  ];

  const BARBER_HAIR_STYLES = [
    { id: 'buzz_fade',    name: 'Clean Buzz Fade',      price: 1, tier: 'Classic Trim',  icon: '✂️', desc: 'Crisp close-cropped buzz with clean tapered temples.' },
    { id: 'side_part',    name: 'Dapper Side Part',     price: 1, tier: 'Classic Trim',  icon: '💈', desc: 'Neat gentleman’s side part with a smooth swept fringe.' },
    { id: 'curtain_wave', name: 'Curtain Waves',        price: 2, tier: 'Styled Cut',    icon: '🌊', desc: 'Center-parted soft waves framing both sides of the face.' },
    { id: 'high_top',     name: 'Flat-Top Fade',        price: 2, tier: 'Styled Cut',    icon: '📐', desc: 'Sharp geometric flat-top box fade with razor-clean edges.' },
    { id: 'curly_fro',    name: 'Cloud Afro',           price: 3, tier: 'Bold Volume',   icon: '☁️', desc: 'Lush, full-volume rounded afro with layered curls.' },
    { id: 'pompadour',    name: 'Rockabilly Pompadour', price: 3, tier: 'Bold Volume',   icon: '🎸', desc: 'High swept-forward wave crest with a glossy highlight.' },
    { id: 'punk_mohawk',  name: 'Razor Mohawk',         price: 4, tier: 'Statement Cut', icon: '⚡', desc: 'Tall jagged central crest with closely shaved sides.' },
    { id: 'twin_drills',  name: 'Starlight Twin-Tails', price: 4, tier: 'Statement Cut', icon: '✨', desc: 'High-tied flowing twin tails with golden hair clasps.' },
    { id: 'samurai_knot', name: 'Shogun Topknot',       price: 5, tier: 'Extravagant',   icon: '⚔️', desc: 'Swept-back warrior knot bound in a crimson-and-gold cord.' },
    { id: 'royal_mane',   name: 'Sovereign Flame Mane', price: 5, tier: 'Extravagant',   icon: '👑', desc: 'Dramatic multi-tiered champion mane with a golden crest clasp.' }
  ];
  const BARBER_HAIR_SET = new Set(BARBER_HAIR_STYLES.map(s => s.id));

  const APPAREL_SHIRTS = [
    { id: 'plain_tee',      name: 'Everyday Cotton Tee',    price: 1,  tier: 'Everyday',     icon: '👕', sleeves: 'short',   pattern: 'plain',   desc: 'Soft crew-neck cotton tee tucked neatly for daily Oakhaven errands.',           colors: { base: '#e2e8f0', hi: '#ffffff', dark: '#94a3b8', trim: '#cbd5e1', accent: '#64748b' } },
    { id: 'striped_tee',    name: 'Harbor Striped Tee',     price: 2,  tier: 'Everyday',     icon: '⚓', sleeves: 'short',   pattern: 'stripes', desc: 'Crisp nautical horizontal stripes in deep harbor navy and chalk white.',        colors: { base: '#1e3a8a', hi: '#3b82f6', dark: '#172554', trim: '#f8fafc', accent: '#f8fafc' } },
    { id: 'classic_polo',   name: 'Meadow Knit Polo',       price: 3,  tier: 'Smart Casual', icon: '⛳', sleeves: 'short',   pattern: 'polo',    desc: 'Breathable meadow-green collar knit with contrast ivory placket trim.',         colors: { base: '#15803d', hi: '#4ade80', dark: '#14532d', trim: '#f8fafc', accent: '#fef08a' } },
    { id: 'plaid_flannel',  name: 'Oakhaven Flannel',       price: 4,  tier: 'Smart Casual', icon: '🪓', sleeves: 'long',    pattern: 'plaid',   desc: 'Brushed lumberjack crimson check with rolled charcoal pocket accents.',         colors: { base: '#b91c1c', hi: '#f87171', dark: '#450a0a', trim: '#1e293b', accent: '#fca5a5' } },
    { id: 'aloha_shirt',    name: 'Tidal Aloha Shirt',      price: 5,  tier: 'Statement',    icon: '🌺', sleeves: 'short',   pattern: 'aloha',   desc: 'Breezy teal resort shirt dotted with sunlit coral and gold blossoms.',          colors: { base: '#0d9488', hi: '#2dd4bf', dark: '#115e59', trim: '#fef08a', accent: '#fb7185' } },
    { id: 'dress_shirt',    name: 'Crisp Oxford & Tie',     price: 6,  tier: 'Tailored',     icon: '👔', sleeves: 'long',    pattern: 'tie',     desc: 'Tailored pearl-white button-down finished with a sharp scarlet silk tie.',      colors: { base: '#f1f5f9', hi: '#ffffff', dark: '#cbd5e1', trim: '#dc2626', accent: '#991b1b' } },
    { id: 'varsity_jacket', name: 'Oakhaven Varsity',       price: 7,  tier: 'Tailored',     icon: '🏈', sleeves: 'varsity', pattern: 'varsity', desc: 'Cobalt wool-blend letterman jacket with cream sleeves and golden snaps.',      colors: { base: '#1d4ed8', hi: '#60a5fa', dark: '#1e3a8a', trim: '#fef3c7', accent: '#facc15' } },
    { id: 'duelist_jersey', name: 'Mythos Pro Jersey',      price: 8,  tier: 'Signature',    icon: '⚡', sleeves: 'short',   pattern: 'chevron', desc: 'Pro-circuit tournament jersey featuring electric cyan & gold chevrons.',        colors: { base: '#1e293b', hi: '#475569', dark: '#0f172a', trim: '#38bdf8', accent: '#facc15' } },
    { id: 'velvet_blazer',  name: 'Crimson Velvet Blazer',  price: 9,  tier: 'Luxury',       icon: '🌹', sleeves: 'long',    pattern: 'blazer',  desc: 'Evening burgundy velvet tailored jacket with gilded peak lapels.',               colors: { base: '#881337', hi: '#be123c', dark: '#4c0519', trim: '#facc15', accent: '#fef3c7' } },
    { id: 'sovereign_coat', name: 'Sovereign Gold Regalia', price: 10, tier: 'Extravagant',  icon: '👑', sleeves: 'long',    pattern: 'regalia', desc: 'Grand royal plum coat adorned with braided gold epaulets and a sapphire clasp.', colors: { base: '#581c87', hi: '#9333ea', dark: '#3b0764', trim: '#facc15', accent: '#38bdf8' } }
  ];

  const APPAREL_PANTS = [
    { id: 'gym_shorts',       name: 'Classic Gym Shorts',      kind: 'shorts', price: 1,  tier: 'Shorts • Everyday',    icon: '🩳', pattern: 'stripe',  desc: 'Lightweight charcoal athletic shorts with crisp white side piping.',           colors: { base: '#334155', hi: '#64748b', dark: '#0f172a', trim: '#f8fafc' } },
    { id: 'chino_shorts',     name: 'Sunlit Chino Shorts',     kind: 'shorts', price: 2,  tier: 'Shorts • Casual',      icon: '☀️', pattern: 'cuff',    desc: 'Relaxed sandy chino shorts hemmed cleanly just above the knee.',              colors: { base: '#c29b61', hi: '#e5c48c', dark: '#7c5d32', trim: '#a17c46' } },
    { id: 'classic_jeans',    name: 'Indigo Denim Jeans',      kind: 'pants',  price: 3,  tier: 'Pants • Everyday',     icon: '👖', pattern: 'cuff',    desc: 'Sturdy indigo selvedge jeans with neat sky-blue turned ankle cuffs.',          colors: { base: '#2b4c7e', hi: '#567ebb', dark: '#182b49', trim: '#93c5fd' } },
    { id: 'cargo_shorts',     name: 'Trail Cargo Shorts',      kind: 'shorts', price: 4,  tier: 'Shorts • Utility',     icon: '🧭', pattern: 'pocket',  desc: 'Field-ready olive shorts packed with dual buttoned side pockets.',             colors: { base: '#4d6b3c', hi: '#73995c', dark: '#2c4022', trim: '#a3b18a' } },
    { id: 'track_pants',      name: 'Velocity Track Pants',    kind: 'pants',  price: 5,  tier: 'Pants • Athletic',     icon: '🏃', pattern: 'stripe',  desc: 'Sleek jet-black warm-up trousers split by blazing crimson racing stripes.',    colors: { base: '#18181b', hi: '#3f3f46', dark: '#09090b', trim: '#ef4444' } },
    { id: 'board_shorts',     name: 'Reef Board Shorts',       kind: 'shorts', price: 6,  tier: 'Shorts • Statement',   icon: '🌊', pattern: 'wave',    desc: 'Vibrant cerulean swim-style shorts accented with sunlit gold wave bands.',     colors: { base: '#0284c7', hi: '#38bdf8', dark: '#075985', trim: '#facc15' } },
    { id: 'cargo_pants',      name: 'Ranger Cargo Pants',      kind: 'pants',  price: 7,  tier: 'Pants • Utility',      icon: '🥾', pattern: 'pocket',  desc: 'Heavy forest-slate explorer pants reinforced with tan knee utility flaps.',    colors: { base: '#3f4f44', hi: '#647d6c', dark: '#232e26', trim: '#d6b98c' } },
    { id: 'checker_pants',    name: 'Checkered Skater Pants',  kind: 'pants',  price: 8,  tier: 'Pants • Statement',    icon: '🏁', pattern: 'checker', desc: 'Bold monochrome racing checkerboard slacks built to stand out downtown.',     colors: { base: '#1e293b', hi: '#f8fafc', dark: '#020617', trim: '#f8fafc' } },
    { id: 'velvet_slacks',    name: 'Tuxedo Satin Slacks',     kind: 'pants',  price: 9,  tier: 'Pants • Luxury',       icon: '🎩', pattern: 'stripe',  desc: 'Formal midnight slacks tailored with lustrous gold satin leg stripes.',        colors: { base: '#111827', hi: '#374151', dark: '#030712', trim: '#facc15' } },
    { id: 'champion_greaves', name: 'Gilded Duelist Trousers', kind: 'pants',  price: 10, tier: 'Pants • Extravagant',  icon: '✨', pattern: 'greaves', desc: 'Indigo tournament trousers plated with ornamental golden knee guards.',         colors: { base: '#1e1b4b', hi: '#4338ca', dark: '#0f0d2e', trim: '#facc15' } }
  ];

  const APPAREL_SHOES = [
    { id: 'canvas_sneaks',    name: 'Canvas Low-Tops',       price: 2,  tier: 'Everyday',    icon: '👟', style: 'lowtop',  desc: 'Crisp cobalt canvas sneakers with bright chalk-white rubber soles.',       colors: { base: '#1d4ed8', hi: '#60a5fa', dark: '#1e3a8a', sole: '#f8fafc', accent: '#ffffff' } },
    { id: 'crimson_hightops', name: 'Flame High-Tops',       price: 4,  tier: 'Streetwear',  icon: '🔥', style: 'hightop', desc: 'High-ankle crimson court kicks laced with sunlit gold eye-stays.',         colors: { base: '#dc2626', hi: '#f87171', dark: '#7f1d1d', sole: '#f8fafc', accent: '#facc15' } },
    { id: 'suede_loafers',    name: 'Espresso Loafers',      price: 6,  tier: 'Tailored',    icon: '👞', style: 'loafer',  desc: 'Hand-burnished espresso suede slip-ons clasped with a gold penny bar.',    colors: { base: '#5c3317', hi: '#8b5a2b', dark: '#2f190b', sole: '#1c1210', accent: '#facc15' } },
    { id: 'ranger_boots',     name: 'Trailblazer Boots',     price: 8,  tier: 'Signature',   icon: '🥾', style: 'boot',    desc: 'Tall olive-moss leather boots ruggedly lugged for forest trails.',         colors: { base: '#3f6212', hi: '#65a30d', dark: '#1a2e05', sole: '#292524', accent: '#d6b98c' } },
    { id: 'winged_kicks',     name: 'Sovereign Winged Kicks',price: 10, tier: 'Extravagant', icon: '🪽', style: 'winged',  desc: 'Gilded championship high-tops fitted with crisp crimson-and-ivory wings.', colors: { base: '#facc15', hi: '#fef9c3', dark: '#a16207', sole: '#f8fafc', accent: '#dc2626' } }
  ];

  const APPAREL_SHIRT_MAP = new Map(APPAREL_SHIRTS.map(s => [s.id, s]));
  const APPAREL_PANTS_MAP = new Map(APPAREL_PANTS.map(s => [s.id, s]));
  const APPAREL_SHOE_MAP = new Map(APPAREL_SHOES.map(s => [s.id, s]));

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
    hatStyle: 'none',
    shirtStyle: null,
    pantsStyle: null,
    shoeStyle: null,
    customSprite: null
  };

  function findById(list, id) {
    return list.find(x => x.id === id) || list[0];
  }

  // Sprite sheet assets & metadata (each sheet is 384x384, 4x4 of 96x96 cells, feet at y=91)
  const SHEET_SIZE = 384;
  const CELL = 96;
  const ARCHETYPE_KEYS = ['jacket', 'hoodie', 'vest', 'trench'];
  const LAYER_NAMES = ['ink', 'skin', 'hair', 'eyes', 'outfit', 'pants'];
  const OUTFIT_TO_KEY = { jacket: 'jacket', hoodie: 'hoodie', vest: 'vest', coat: 'trench', tunic: 'vest' };
  const HAIR_TO_KEY = {
    spiky: 'jacket',
    swept: 'hoodie',
    bob: 'vest',
    long: 'long',
    ponytail: 'trench',
    short: 'hoodie',
    parted: 'vest',
    bun: 'trench'
  };
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

  const spriteBank = {};
  let pendingRedrawTimer = null;

  function scheduleCreatorRefresh() {
    if (pendingRedrawTimer) return;
    pendingRedrawTimer = setTimeout(() => {
      pendingRedrawTimer = null;
      composedCache.clear();
      if (window.mythosOverworld) {
        if (typeof window.mythosOverworld.renderCreatorPreview === 'function') {
          window.mythosOverworld.renderCreatorPreview();
        }
        if (typeof window.mythosOverworld.refreshIntroScreen === 'function') {
          const introModal = document.getElementById('intro-modal');
          if (introModal && !introModal.classList.contains('hidden')) {
            window.mythosOverworld.refreshIntroScreen();
          }
        }
      }
    }, 30);
  }

  function preloadCharacterSheets() {
    spriteBank.base = {};
    for (const layer of ['skin', 'eyes', 'ink']) {
      const img = new Image();
      img.src = `Sprites/Characters/hero_base_${layer}.png`;
      img.onload = scheduleCreatorRefresh;
      spriteBank.base[layer] = img;
    }
    for (const arch of ARCHETYPE_KEYS) {
      spriteBank[arch] = {};
      for (const layer of LAYER_NAMES) {
        const img = new Image();
        img.src = `Sprites/Characters/hero_${arch}_${layer}.png`;
        img.onload = scheduleCreatorRefresh;
        spriteBank[arch][layer] = img;
      }
    }
    // Dedicated 'long' hair sheets (shares vest face skin & eyes, replaces hair + hair ink cleanly)
    const longHair = new Image();
    longHair.src = 'Sprites/Characters/hero_long_hair.png';
    longHair.onload = scheduleCreatorRefresh;
    const longInk = new Image();
    longInk.src = 'Sprites/Characters/hero_long_ink.png';
    longInk.onload = scheduleCreatorRefresh;
    spriteBank.long = {
      hair: longHair,
      ink: longInk,
      skin: spriteBank.vest.skin,
      eyes: spriteBank.vest.eyes
    };
  }
  preloadCharacterSheets();

  const CUSTOM_SPRITE_VER = '2';
  const customSpriteBank = new Map();
  function getCustomSpriteImage(id) {
    if (!id) return null;
    let entry = customSpriteBank.get(id);
    if (!entry) {
      const img = new Image();
      entry = { img, loaded: false, failed: false };
      img.onload = () => {
        entry.loaded = true;
        scheduleCreatorRefresh();
      };
      img.onerror = () => {
        entry.failed = true;
      };
      img.src = `Sprites/Characters/${id}.png?v=${CUSTOM_SPRITE_VER}`;
      customSpriteBank.set(id, entry);
    }
    return (entry.loaded && entry.img.naturalWidth > 0) ? entry.img : null;
  }
  getCustomSpriteImage('player_hero_d');
  getCustomSpriteImage('maya_d');

  function isArchReady(arch) {
    const set = spriteBank[arch];
    if (!set) return false;
    const requiredLayers = arch === 'base'
      ? ['skin', 'eyes', 'ink']
      : (arch === 'long' ? ['hair', 'ink', 'skin', 'eyes'] : LAYER_NAMES);
    for (const layer of requiredLayers) {
      const img = set[layer];
      if (!img || !img.complete || img.naturalWidth === 0) return false;
    }
    return true;
  }

  // Reusable scratch canvas (never calls getImageData — 100% file:/// safe)
  let workCanvas = null;
  let workCtx = null;

  function ensureScratch() {
    if (!workCanvas) {
      workCanvas = document.createElement('canvas');
      workCanvas.width = SHEET_SIZE;
      workCanvas.height = SHEET_SIZE;
      workCtx = workCanvas.getContext('2d');
      workCtx.imageSmoothingEnabled = false;
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

  // Uniform neck-seam split bounds and per-archetype alignment tables so every head matches its own eyes/hair/ink
  const BODY_SKIN_MIN_Y = 56;
  const HEAD_HAIR_MAX_Y = 52;
  const HEAD_SPLIT_SPEC = {
    jacket: { skinMaxY: 47, inkMaxY: 47 },
    hoodie: { skinMaxY: 46, inkMaxY: 46 },
    vest:   { skinMaxY: 46, inkMaxY: 46 },
    long:   { skinMaxY: 46, inkMaxY: 46, hairMaxY: 60 },
    trench: { skinMaxY: 43, inkMaxY: 43, hairMaxY: 50 }
  };
  const BODY_INK_MIN_Y = {
    jacket: [49, 50, 50, 48],
    hoodie: [48, 48, 48, 47],
    vest:   [48, 48, 48, 47],
    trench: [48, 48, 48, 47]
  };
  const FLIPPED_COL3_ARCHES = new Set(['vest', 'trench', 'long']);

  const BODY_ROW_DX = {
    jacket: [0, 0, 0, 0],
    hoodie: [1, 0, 0, 1],
    vest:   [0, 1, -1, 0],
    trench: [4, 0, 0, 1]
  };
  const HAIR_ROW_OFFSET = {
    jacket: { dx: [0, 0, 0, 0], dy: [0, 0, 0, 0] },
    hoodie: { dx: [1, 0, 0, 0], dy: [4, 3, 3, 3] },
    vest:   { dx: [0, 0, 0, 0], dy: [4, 4, 4, 5] },
    long:   { dx: [0, 0, 0, 0], dy: [4, 4, 4, 3] },
    trench: { dx: [0, 0, 0, 0], dy: [4, 3, 3, 3] }
  };
  function drawRowAlignedBodySlice(octx, srcImg, rowDx, minYByRow, maxY = CELL) {
    for (let r = 0; r < 4; r++) {
      const cy = r * CELL;
      const dx = rowDx ? (rowDx[r] || 0) : 0;
      const minY = Array.isArray(minYByRow) ? (minYByRow[r] || 0) : (minYByRow || 0);
      const h = Math.min(CELL, maxY) - minY;
      if (h <= 0) continue;
      for (let c = 0; c < 4; c++) {
        octx.drawImage(srcImg, c * CELL, cy + minY, CELL, h, c * CELL + dx, cy + minY, CELL, h);
      }
    }
  }

  function drawCellSlices(octx, srcImg, sliceHeight, fixCol3Flip = false) {
    for (let r = 0; r < 4; r++) {
      const cy = r * CELL;
      for (let c = 0; c < 4; c++) {
        const srcC = (fixCol3Flip && (r === 1 || r === 2) && c === 3) ? 1 : c;
        octx.drawImage(srcImg, srcC * CELL, cy, CELL, sliceHeight, c * CELL, cy, CELL, sliceHeight);
      }
    }
  }

  function drawHairWithMaskedInk(octx, hb, hairKey, hairColorHex, hairMaxY, fixFlip, hairOffsets) {
    const dxArr = hairOffsets?.dx || [0, 0, 0, 0];
    const dyArr = hairOffsets?.dy || [0, 0, 0, 0];

    renderTintedLayerToWork(hb.hair, hairColorHex);
    for (let r = 0; r < 4; r++) {
      const cy = r * CELL;
      const dx = dxArr[r] || 0;
      const dy = dyArr[r] || 0;
      const srcH = Math.min(hairMaxY, CELL - Math.max(0, dy));
      for (let c = 0; c < 4; c++) {
        const srcC = (fixFlip && (r === 1 || r === 2) && c === 3) ? 1 : c;
        octx.drawImage(workCanvas, srcC * CELL, cy, CELL, srcH, c * CELL + dx, cy + dy, CELL, srcH);
      }
    }

    // Build opaque 1px 8-directional dilated hair silhouette so crisp outer contour ink never breaks or grabs distant specks
    ensureScratch();
    workCtx.globalCompositeOperation = 'source-over';
    workCtx.clearRect(0, 0, SHEET_SIZE, SHEET_SIZE);
    const offsets = [
      [0, 0],
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    for (let r = 0; r < 4; r++) {
      const cy = r * CELL;
      for (let c = 0; c < 4; c++) {
        const srcC = (fixFlip && (r === 1 || r === 2) && c === 3) ? 1 : c;
        for (let pass = 0; pass < 3; pass++) {
          for (const [ox, oy] of offsets) {
            workCtx.drawImage(hb.hair, srcC * CELL, cy, CELL, hairMaxY + 2, c * CELL + ox, cy + oy, CELL, hairMaxY + 2);
          }
        }
      }
    }
    // Clear inner face eye box on rows 0..2 so foreign brow/eye ink from other archetypes never bleeds in
    workCtx.globalCompositeOperation = 'destination-out';
    const eyeTop = hairKey === 'jacket' ? 40 : 35;
    for (let c = 0; c < 4; c++) {
      const cx = c * CELL;
      workCtx.fillRect(cx + 37, eyeTop, 22, 16);
      workCtx.fillRect(cx + 33, CELL + eyeTop, 18, 16);
      workCtx.fillRect(cx + 45, 2 * CELL + eyeTop, 18, 16);
    }

    workCtx.globalCompositeOperation = 'source-in';
    drawCellSlices(workCtx, hb.ink, hairMaxY + 2, fixFlip);
    workCtx.globalCompositeOperation = 'source-over';

    for (let r = 0; r < 4; r++) {
      const cy = r * CELL;
      const dx = dxArr[r] || 0;
      const dy = dyArr[r] || 0;
      const srcH = Math.min(hairMaxY, CELL - Math.max(0, dy));
      for (let c = 0; c < 4; c++) {
        octx.drawImage(workCanvas, c * CELL, cy, CELL, srcH, c * CELL + dx, cy + dy, CELL, srcH);
      }
    }
  }

  const BARBER_HAIR_DY = {
    short: 9,
    buzz_fade: 9,
    side_part: 8,
    curtain_wave: 6,
    high_top: 7,
    curly_fro: 6,
    pompadour: 7,
    punk_mohawk: 7,
    twin_drills: 6,
    samurai_knot: 7,
    royal_mane: 5
  };

  function drawBarberHairCell(octx, styleId, hair, r, c) {
    const bob = (c === 1 || c === 3) ? -1 : 0;
    const styleDy = BARBER_HAIR_DY[styleId] ?? 7;
    const INK = '#241612';
    const GOLD = '#facc15';
    const RUBY = '#dc2626';
    const px = (gx, gy, gw, gh, col) => {
      const rx = (r === 2) ? (CELL - gx - gw) : gx;
      octx.fillStyle = col;
      octx.fillRect(Math.round(c * CELL + rx), Math.round(r * CELL + gy + styleDy + bob), gw, gh);
    };

    if (styleId === 'short') {
      if (r === 0) {
        px(36, 13, 24, 2, INK);
        px(34, 15, 28, 13, INK);
        px(35, 15, 26, 11, hair.base);
        px(38, 14, 20, 4, hair.hi);
        px(36, 25, 24, 3, hair.base);
        px(40, 26, 10, 3, hair.hi);
        px(35, 23, 3, 7, hair.dark);
        px(58, 23, 3, 7, hair.dark);
      } else if (r === 1 || r === 2) {
        px(36, 13, 20, 2, INK);
        px(33, 15, 25, 14, INK);
        px(34, 15, 23, 11, hair.base);
        px(37, 14, 17, 4, hair.hi);
        px(34, 24, 9, 4, hair.base);
        px(50, 24, 7, 10, hair.dark);
      } else {
        px(36, 13, 24, 2, INK);
        px(34, 15, 28, 20, INK);
        px(35, 15, 26, 16, hair.base);
        px(38, 15, 20, 4, hair.hi);
        px(35, 30, 26, 4, hair.dark);
      }
      return;
    }

    if (styleId === 'buzz_fade') {
      if (r === 0) {
        px(38, 15, 20, 2, INK);
        px(35, 16, 26, 2, INK);
        px(34, 18, 28, 10, INK);
        px(36, 17, 24, 9, hair.base);
        px(38, 16, 20, 3, hair.hi);
        px(35, 22, 3, 9, hair.dark);
        px(58, 22, 3, 9, hair.dark);
        px(38, 25, 20, 2, hair.dark);
      } else if (r === 1 || r === 2) {
        px(37, 15, 17, 2, INK);
        px(35, 16, 21, 2, INK);
        px(34, 18, 24, 11, INK);
        px(35, 17, 22, 9, hair.base);
        px(37, 16, 16, 3, hair.hi);
        px(50, 22, 7, 11, hair.dark);
        px(35, 24, 16, 2, hair.dark);
      } else {
        px(38, 15, 20, 2, INK);
        px(35, 16, 26, 2, INK);
        px(34, 18, 28, 19, INK);
        px(35, 17, 26, 14, hair.base);
        px(38, 16, 20, 4, hair.hi);
        px(35, 30, 26, 6, hair.dark);
      }
      return;
    }

    if (styleId === 'side_part') {
      if (r === 0) {
        px(38, 12, 20, 2, INK);
        px(35, 13, 26, 3, INK);
        px(34, 15, 28, 13, INK);
        px(44, 25, 16, 5, INK);
        px(35, 14, 26, 12, hair.base);
        px(38, 13, 20, 4, hair.hi);
        px(40, 15, 2, 7, hair.dark);
        px(42, 23, 17, 5, hair.base);
        px(46, 24, 11, 2, hair.hi);
        px(35, 24, 3, 8, hair.dark);
        px(58, 24, 3, 8, hair.dark);
      } else if (r === 1 || r === 2) {
        px(37, 12, 18, 2, INK);
        px(32, 14, 26, 15, INK);
        px(33, 14, 24, 12, hair.base);
        px(37, 13, 17, 4, hair.hi);
        px(33, 23, 8, 5, hair.base);
        px(50, 24, 7, 11, hair.dark);
      } else {
        px(38, 12, 20, 2, INK);
        px(34, 14, 28, 24, INK);
        px(35, 14, 26, 19, hair.base);
        px(38, 14, 20, 4, hair.hi);
        px(35, 32, 26, 5, hair.dark);
      }
      return;
    }

    if (styleId === 'curtain_wave') {
      if (r === 0) {
        px(37, 11, 22, 2, INK);
        px(34, 12, 28, 3, INK);
        px(31, 14, 34, 13, INK);
        px(30, 24, 11, 16, INK);
        px(55, 24, 11, 16, INK);
        px(32, 13, 32, 12, hair.base);
        px(36, 12, 24, 4, hair.hi);
        px(47, 19, 2, 7, hair.dark);
        px(31, 24, 9, 14, hair.base);
        px(56, 24, 9, 14, hair.base);
        px(32, 25, 3, 10, hair.hi);
        px(61, 25, 3, 10, hair.hi);
        px(32, 36, 7, 3, hair.dark);
        px(57, 36, 7, 3, hair.dark);
      } else if (r === 1 || r === 2) {
        px(34, 11, 24, 3, INK);
        px(31, 14, 29, 14, INK);
        px(31, 24, 9, 15, INK);
        px(49, 24, 11, 16, INK);
        px(32, 13, 27, 13, hair.base);
        px(35, 12, 21, 4, hair.hi);
        px(32, 24, 7, 13, hair.base);
        px(50, 24, 9, 14, hair.base);
        px(33, 26, 3, 8, hair.hi);
        px(50, 35, 9, 3, hair.dark);
      } else {
        px(34, 11, 28, 3, INK);
        px(31, 14, 34, 26, INK);
        px(32, 13, 32, 25, hair.base);
        px(35, 13, 26, 4, hair.hi);
        px(32, 34, 32, 4, hair.dark);
      }
      return;
    }

    if (styleId === 'high_top') {
      if (r === 0) {
        px(31, 5, 34, 21, INK);
        px(34, 25, 28, 4, INK);
        px(33, 7, 30, 17, hair.base);
        px(33, 7, 30, 4, hair.hi);
        px(35, 22, 26, 5, hair.dark);
        px(34, 26, 3, 6, hair.dark);
        px(59, 26, 3, 6, hair.dark);
      } else if (r === 1 || r === 2) {
        px(32, 5, 27, 21, INK);
        px(49, 25, 10, 9, INK);
        px(34, 7, 23, 17, hair.base);
        px(34, 7, 23, 4, hair.hi);
        px(34, 22, 23, 4, hair.dark);
        px(50, 26, 8, 7, hair.dark);
      } else {
        px(31, 5, 34, 23, INK);
        px(34, 27, 28, 8, INK);
        px(33, 7, 30, 19, hair.base);
        px(33, 7, 30, 4, hair.hi);
        px(35, 26, 26, 8, hair.dark);
      }
      return;
    }

    if (styleId === 'curly_fro') {
      if (r === 0) {
        px(28, 4, 40, 6, INK);
        px(23, 8, 50, 21, INK);
        px(21, 14, 16, 24, INK);
        px(59, 14, 16, 24, INK);
        px(25, 7, 46, 20, hair.base);
        px(22, 14, 15, 22, hair.base);
        px(59, 14, 15, 22, hair.base);
        px(29, 6, 38, 5, hair.base);
        px(31, 8, 9, 5, hair.hi);
        px(45, 6, 10, 5, hair.hi);
        px(58, 10, 8, 5, hair.hi);
        px(24, 19, 6, 5, hair.hi);
        px(66, 20, 6, 5, hair.hi);
        px(23, 32, 13, 4, hair.dark);
        px(60, 32, 13, 4, hair.dark);
      } else if (r === 1 || r === 2) {
        px(28, 4, 34, 6, INK);
        px(25, 8, 41, 22, INK);
        px(47, 16, 21, 24, INK);
        px(26, 7, 38, 21, hair.base);
        px(48, 17, 18, 21, hair.base);
        px(30, 7, 12, 5, hair.hi);
        px(48, 9, 11, 5, hair.hi);
        px(57, 21, 7, 6, hair.hi);
        px(49, 34, 16, 4, hair.dark);
      } else {
        px(28, 4, 40, 6, INK);
        px(21, 8, 54, 31, INK);
        px(23, 7, 50, 30, hair.base);
        px(29, 6, 38, 5, hair.base);
        px(30, 9, 11, 5, hair.hi);
        px(46, 7, 11, 5, hair.hi);
        px(60, 12, 9, 5, hair.hi);
        px(23, 33, 50, 4, hair.dark);
      }
      return;
    }

    if (styleId === 'pompadour') {
      if (r === 0) {
        px(38, 2, 20, 5, INK);
        px(34, 6, 28, 20, INK);
        px(36, 5, 24, 19, hair.base);
        px(39, 3, 18, 5, hair.base);
        px(40, 5, 16, 5, hair.hi);
        px(35, 22, 3, 12, hair.dark);
        px(58, 22, 3, 12, hair.dark);
        px(37, 22, 22, 3, hair.dark);
      } else if (r === 1 || r === 2) {
        px(23, 7, 22, 13, INK);
        px(28, 3, 28, 18, INK);
        px(33, 14, 26, 15, INK);
        px(48, 24, 10, 12, INK);
        px(25, 8, 22, 10, hair.base);
        px(29, 5, 25, 16, hair.base);
        px(35, 16, 22, 12, hair.base);
        px(27, 6, 21, 5, hair.hi);
        px(49, 25, 8, 9, hair.dark);
      } else {
        px(38, 2, 20, 5, INK);
        px(34, 6, 28, 26, INK);
        px(42, 31, 12, 10, INK);
        px(36, 5, 24, 25, hair.base);
        px(40, 4, 16, 5, hair.hi);
        px(43, 30, 10, 9, hair.dark);
      }
      return;
    }

    if (styleId === 'punk_mohawk') {
      if (r === 0) {
        px(45, 0, 6, 6, INK);
        px(42, 4, 12, 12, INK);
        px(40, 11, 16, 17, INK);
        px(46, 1, 4, 7, hair.base);
        px(43, 6, 10, 11, hair.base);
        px(42, 13, 12, 13, hair.base);
        px(46, 4, 4, 16, hair.hi);
        px(42, 24, 12, 3, hair.dark);
      } else if (r === 1 || r === 2) {
        px(30, 4, 10, 14, INK);
        px(38, 0, 14, 18, INK);
        px(48, 6, 13, 18, INK);
        px(54, 18, 9, 17, INK);
        px(31, 6, 10, 12, hair.base);
        px(40, 2, 11, 16, hair.base);
        px(48, 8, 12, 16, hair.base);
        px(55, 19, 7, 15, hair.base);
        px(34, 7, 5, 6, hair.hi);
        px(42, 3, 6, 8, hair.hi);
        px(51, 10, 5, 8, hair.hi);
        px(42, 17, 12, 7, hair.dark);
      } else {
        px(45, 0, 6, 6, INK);
        px(42, 5, 12, 36, INK);
        px(46, 1, 4, 6, hair.base);
        px(43, 6, 10, 33, hair.base);
        px(46, 4, 4, 24, hair.hi);
        px(44, 34, 8, 5, hair.dark);
      }
      return;
    }

    if (styleId === 'twin_drills') {
      if (r === 0) {
        px(36, 13, 24, 3, INK);
        px(34, 15, 28, 13, INK);
        px(35, 15, 26, 12, hair.base);
        px(38, 14, 20, 4, hair.hi);
        px(35, 24, 6, 4, hair.dark);
        px(55, 24, 6, 4, hair.dark);
        px(28, 16, 8, 8, INK);
        px(60, 16, 8, 8, INK);
        px(29, 17, 6, 6, GOLD);
        px(61, 17, 6, 6, GOLD);
        px(21, 18, 11, 20, INK);
        px(64, 18, 11, 20, INK);
        px(19, 32, 12, 17, INK);
        px(65, 32, 12, 17, INK);
        px(22, 47, 7, 7, INK);
        px(67, 47, 7, 7, INK);
        px(22, 19, 9, 18, hair.base);
        px(65, 19, 9, 18, hair.base);
        px(20, 33, 10, 15, hair.base);
        px(66, 33, 10, 15, hair.base);
        px(23, 47, 5, 6, hair.dark);
        px(68, 47, 5, 6, hair.dark);
        px(23, 24, 4, 10, hair.hi);
        px(69, 24, 4, 10, hair.hi);
      } else if (r === 1 || r === 2) {
        px(36, 13, 20, 3, INK);
        px(33, 15, 25, 14, INK);
        px(34, 15, 23, 12, hair.base);
        px(37, 14, 17, 4, hair.hi);
        px(51, 16, 8, 8, INK);
        px(52, 17, 6, 6, GOLD);
        px(55, 18, 12, 20, INK);
        px(58, 32, 12, 17, INK);
        px(60, 47, 7, 7, INK);
        px(56, 19, 10, 18, hair.base);
        px(59, 33, 10, 15, hair.base);
        px(61, 47, 5, 6, hair.dark);
        px(59, 24, 4, 12, hair.hi);
      } else {
        px(36, 13, 24, 3, INK);
        px(34, 15, 28, 22, INK);
        px(35, 15, 26, 20, hair.base);
        px(38, 14, 20, 4, hair.hi);
        px(28, 16, 8, 8, INK);
        px(60, 16, 8, 8, INK);
        px(29, 17, 6, 6, GOLD);
        px(61, 17, 6, 6, GOLD);
        px(21, 18, 11, 20, INK);
        px(64, 18, 11, 20, INK);
        px(19, 32, 12, 17, INK);
        px(65, 32, 12, 17, INK);
        px(22, 47, 7, 7, INK);
        px(67, 47, 7, 7, INK);
        px(22, 19, 9, 18, hair.base);
        px(65, 19, 9, 18, hair.base);
        px(20, 33, 10, 15, hair.base);
        px(66, 33, 10, 15, hair.base);
        px(23, 47, 5, 6, hair.dark);
        px(68, 47, 5, 6, hair.dark);
      }
      return;
    }

    if (styleId === 'samurai_knot') {
      if (r === 0) {
        px(42, 1, 12, 11, INK);
        px(40, 4, 16, 7, INK);
        px(41, 11, 14, 6, INK);
        px(35, 15, 26, 12, INK);
        px(36, 16, 24, 9, hair.base);
        px(39, 16, 18, 3, hair.dark);
        px(42, 12, 12, 4, RUBY);
        px(45, 12, 6, 4, GOLD);
        px(42, 3, 12, 8, hair.base);
        px(44, 3, 8, 3, hair.hi);
        px(35, 23, 3, 9, hair.dark);
        px(58, 23, 3, 9, hair.dark);
      } else if (r === 1 || r === 2) {
        px(50, 2, 16, 12, INK);
        px(56, 7, 13, 10, INK);
        px(48, 10, 9, 7, INK);
        px(35, 15, 24, 15, INK);
        px(36, 16, 21, 11, hair.base);
        px(51, 24, 7, 10, hair.dark);
        px(49, 11, 7, 5, RUBY);
        px(51, 11, 4, 5, GOLD);
        px(52, 4, 13, 9, hair.base);
        px(58, 8, 9, 7, hair.dark);
        px(54, 4, 8, 3, hair.hi);
        px(61, 15, 5, 10, RUBY);
      } else {
        px(42, 1, 12, 11, INK);
        px(41, 11, 14, 6, INK);
        px(35, 15, 26, 21, INK);
        px(43, 16, 10, 19, INK);
        px(36, 16, 24, 17, hair.base);
        px(42, 12, 12, 4, RUBY);
        px(45, 12, 6, 4, GOLD);
        px(43, 3, 10, 8, hair.base);
        px(45, 3, 6, 3, hair.hi);
        px(44, 16, 8, 17, hair.base);
        px(45, 30, 6, 5, hair.dark);
      }
      return;
    }

    if (styleId === 'royal_mane') {
      if (r === 0) {
        px(44, 0, 8, 10, INK);
        px(34, 4, 28, 14, INK);
        px(24, 9, 48, 17, INK);
        px(18, 16, 19, 21, INK);
        px(59, 16, 19, 21, INK);
        px(22, 31, 14, 17, INK);
        px(60, 31, 14, 17, INK);
        px(45, 2, 6, 9, hair.base);
        px(35, 6, 26, 13, hair.base);
        px(26, 11, 44, 14, hair.base);
        px(20, 18, 16, 17, hair.base);
        px(60, 18, 16, 17, hair.base);
        px(24, 32, 11, 14, hair.dark);
        px(61, 32, 11, 14, hair.dark);
        px(38, 22, 6, 7, hair.base);
        px(52, 22, 6, 7, hair.base);
        px(44, 4, 8, 8, hair.hi);
        px(28, 12, 9, 5, hair.hi);
        px(59, 12, 9, 5, hair.hi);
        px(44, 18, 8, 7, INK);
        px(45, 19, 6, 5, GOLD);
        px(47, 20, 2, 3, RUBY);
      } else if (r === 1 || r === 2) {
        px(42, 0, 10, 10, INK);
        px(33, 5, 32, 14, INK);
        px(28, 12, 46, 16, INK);
        px(49, 20, 29, 21, INK);
        px(54, 34, 20, 15, INK);
        px(43, 2, 8, 9, hair.base);
        px(35, 7, 28, 13, hair.base);
        px(30, 14, 42, 12, hair.base);
        px(50, 22, 26, 17, hair.base);
        px(56, 35, 16, 12, hair.dark);
        px(43, 4, 8, 7, hair.hi);
        px(58, 15, 11, 5, hair.hi);
        px(36, 19, 5, 5, GOLD);
      } else {
        px(44, 0, 8, 10, INK);
        px(34, 4, 28, 14, INK);
        px(22, 9, 52, 22, INK);
        px(18, 17, 60, 22, INK);
        px(24, 35, 48, 15, INK);
        px(45, 2, 6, 9, hair.base);
        px(35, 6, 26, 14, hair.base);
        px(24, 11, 48, 22, hair.base);
        px(20, 19, 56, 18, hair.base);
        px(26, 36, 44, 12, hair.dark);
        px(44, 4, 8, 8, hair.hi);
        px(28, 13, 12, 5, hair.hi);
        px(56, 13, 12, 5, hair.hi);
      }
    }
  }

  function drawApparelShirtCell(octx, shirt, skin, r, c) {
    if (!shirt) return;
    const bob = (c === 1 || c === 3) ? -1 : 0;
    const col = shirt.colors || {};
    const INK = '#1c1210';
    const px = (gx, gy, gw, gh, fill) => {
      const rx = (r === 2) ? (CELL - gx - gw) : gx;
      octx.fillStyle = fill;
      octx.fillRect(Math.round(c * CELL + rx), Math.round(r * CELL + gy + bob), gw, gh);
    };
    const pat = shirt.pattern;

    // Close the open jacket front gap on closed-chest shirts (tees, polo, flannel, aloha, tie, jersey)
    if (r === 0 && ['plain', 'stripes', 'polo', 'plaid', 'aloha', 'tie', 'chevron'].includes(pat)) {
      px(41, 49, 14, 16, col.base);
    }

    // Sleeve cuff styling (bare lower arms on short-sleeved cuts, cream leather on varsity)
    if (shirt.sleeves === 'short') {
      if (r === 0 || r === 3) {
        px(31, 56, 6, 2, col.dark);
        px(59, 56, 6, 2, col.dark);
        px(31, 58, 5, 7, skin.base);
        px(60, 58, 5, 7, skin.base);
        px(31, 58, 2, 6, skin.shadow);
        px(63, 58, 2, 6, skin.shadow);
      } else {
        px(44, 56, 8, 2, col.dark);
        px(44, 58, 7, 7, skin.base);
        px(44, 58, 2, 6, skin.shadow);
      }
    } else if (shirt.sleeves === 'varsity') {
      if (r === 0 || r === 3) {
        px(31, 51, 6, 13, col.trim);
        px(59, 51, 6, 13, col.trim);
        px(31, 63, 6, 2, col.base);
        px(59, 63, 6, 2, col.base);
      } else {
        px(44, 51, 8, 13, col.trim);
        px(44, 63, 8, 2, col.base);
      }
    }

    // Torso pattern art across front/side/back views
    if (r === 0) {
      if (pat === 'plain') {
        px(44, 50, 8, 2, col.dark);
        px(41, 53, 14, 3, col.hi);
      } else if (pat === 'stripes') {
        px(38, 51, 20, 2, col.trim);
        px(38, 55, 20, 2, col.trim);
        px(38, 59, 20, 2, col.trim);
        px(38, 63, 20, 2, col.trim);
      } else if (pat === 'polo') {
        px(41, 49, 14, 3, col.trim);
        px(46, 51, 4, 7, col.trim);
        px(47, 52, 2, 2, col.dark);
        px(47, 55, 2, 2, col.accent);
      } else if (pat === 'plaid') {
        px(39, 51, 18, 2, col.dark);
        px(39, 57, 18, 2, col.dark);
        px(39, 62, 18, 2, col.trim);
        px(42, 50, 2, 15, col.dark);
        px(52, 50, 2, 15, col.dark);
        px(47, 50, 2, 15, col.trim);
      } else if (pat === 'aloha') {
        px(44, 50, 8, 2, col.dark);
        px(40, 52, 3, 3, col.accent);
        px(41, 53, 1, 1, col.trim);
        px(52, 54, 4, 3, col.trim);
        px(53, 55, 2, 1, col.accent);
        px(43, 58, 4, 3, col.trim);
        px(44, 59, 2, 1, col.accent);
        px(51, 61, 3, 3, col.accent);
        px(39, 60, 3, 3, col.hi);
      } else if (pat === 'tie') {
        px(42, 49, 12, 3, col.hi);
        px(46, 51, 4, 3, col.trim);
        px(47, 54, 2, 9, col.trim);
        px(46, 62, 4, 2, col.accent);
      } else if (pat === 'varsity') {
        px(39, 49, 18, 16, col.base);
        px(46, 50, 4, 15, col.trim);
        px(47, 52, 2, 2, col.accent);
        px(47, 56, 2, 2, col.accent);
        px(47, 60, 2, 2, col.accent);
        px(40, 53, 4, 4, col.accent);
        px(39, 64, 18, 2, col.trim);
      } else if (pat === 'chevron') {
        px(39, 52, 18, 3, col.hi);
        px(40, 55, 5, 3, col.trim);
        px(51, 55, 5, 3, col.trim);
        px(44, 57, 8, 3, col.trim);
        px(46, 52, 4, 3, col.accent);
        px(39, 63, 18, 2, col.trim);
      } else if (pat === 'blazer') {
        px(39, 49, 18, 16, col.base);
        px(41, 50, 4, 10, col.hi);
        px(51, 50, 4, 10, col.hi);
        px(45, 50, 6, 11, col.accent);
        px(47, 56, 2, 3, col.trim);
        px(41, 61, 14, 2, col.dark);
      } else if (pat === 'regalia') {
        px(39, 49, 18, 16, col.base);
        px(34, 49, 8, 4, col.trim);
        px(54, 49, 8, 4, col.trim);
        px(46, 50, 4, 15, col.trim);
        px(45, 52, 6, 4, INK);
        px(46, 53, 4, 2, col.accent);
        px(39, 63, 18, 2, col.trim);
      }
    } else if (r === 1 || r === 2) {
      if (pat === 'stripes') {
        px(41, 53, 14, 2, col.trim);
        px(41, 58, 14, 2, col.trim);
        px(41, 63, 14, 2, col.trim);
      } else if (pat === 'polo') {
        px(41, 50, 12, 2, col.trim);
      } else if (pat === 'plaid') {
        px(41, 53, 14, 2, col.dark);
        px(41, 59, 14, 2, col.trim);
        px(46, 50, 2, 14, col.dark);
      } else if (pat === 'aloha') {
        px(43, 53, 3, 3, col.accent);
        px(48, 59, 4, 3, col.trim);
      } else if (pat === 'tie') {
        px(40, 52, 3, 9, col.trim);
      } else if (pat === 'varsity') {
        px(41, 64, 14, 2, col.trim);
      } else if (pat === 'chevron') {
        px(41, 55, 14, 3, col.trim);
        px(45, 54, 4, 3, col.accent);
      } else if (pat === 'blazer') {
        px(41, 51, 5, 8, col.hi);
        px(42, 61, 12, 2, col.trim);
      } else if (pat === 'regalia') {
        px(42, 49, 12, 3, col.trim);
        px(41, 63, 14, 2, col.trim);
      }
    } else {
      if (pat === 'stripes') {
        px(38, 52, 20, 2, col.trim);
        px(38, 57, 20, 2, col.trim);
        px(38, 62, 20, 2, col.trim);
      } else if (pat === 'plaid') {
        px(39, 52, 18, 2, col.dark);
        px(39, 58, 18, 2, col.trim);
        px(44, 50, 2, 15, col.dark);
        px(50, 50, 2, 15, col.dark);
      } else if (pat === 'aloha') {
        px(41, 53, 4, 3, col.trim);
        px(51, 56, 3, 3, col.accent);
        px(43, 60, 4, 3, col.hi);
      } else if (pat === 'varsity' || pat === 'chevron') {
        px(41, 54, 14, 3, col.trim);
        px(39, 63, 18, 2, col.trim);
      } else if (pat === 'blazer' || pat === 'regalia') {
        px(39, 50, 18, 15, col.base);
        px(47, 51, 2, 13, col.dark);
        px(39, 63, 18, 2, col.trim);
        if (pat === 'regalia') {
          px(34, 49, 8, 4, col.trim);
          px(54, 49, 8, 4, col.trim);
        }
      }
    }
  }

  function drawApparelPantsCell(octx, pantsItem, skin, r, c) {
    if (!pantsItem) return;
    const bob = (c === 1 || c === 3) ? -1 : 0;
    const col = pantsItem.colors || {};
    const INK = '#1c1210';
    const px = (gx, gy, gw, gh, fill) => {
      const rx = (r === 2) ? (CELL - gx - gw) : gx;
      octx.fillStyle = fill;
      octx.fillRect(Math.round(c * CELL + rx), Math.round(r * CELL + gy + bob), gw, gh);
    };

    const isShorts = pantsItem.kind === 'shorts';
    const pat = pantsItem.pattern;

    if (r === 0 || r === 3) {
      if (pat === 'stripe') {
        px(37, 65, 2, 12, col.trim);
        px(57, 65, 2, 12, col.trim);
      } else if (pat === 'cuff') {
        px(37, 74, 10, 3, col.trim);
        px(49, 74, 10, 3, col.trim);
      } else if (pat === 'pocket') {
        px(37, 68, 4, 5, col.trim);
        px(55, 68, 4, 5, col.trim);
      } else if (pat === 'wave') {
        px(37, 69, 10, 2, col.trim);
        px(49, 69, 10, 2, col.trim);
      } else if (pat === 'checker') {
        for (let cy = 65; cy <= 75; cy += 3) {
          px(((cy % 6) === 5) ? 38 : 41, cy, 4, 3, col.hi);
          px(((cy % 6) === 5) ? 54 : 51, cy, 4, 3, col.hi);
        }
      } else if (pat === 'greaves') {
        px(38, 69, 8, 5, INK);
        px(39, 70, 6, 3, col.trim);
        px(50, 69, 8, 5, INK);
        px(51, 70, 6, 3, col.trim);
      }

      if (isShorts) {
        px(37, 70, 10, 2, col.dark);
        px(49, 70, 10, 2, col.dark);
        px(38, 72, 8, 6, skin.base);
        px(50, 72, 8, 6, skin.base);
        px(38, 72, 2, 6, skin.shadow);
        px(50, 72, 2, 6, skin.shadow);
        px(37, 72, 1, 6, INK);
        px(46, 72, 1, 6, INK);
        px(49, 72, 1, 6, INK);
        px(58, 72, 1, 6, INK);
      }
    } else {
      const sideX = (c === 1 || c === 3) ? 45 : 46;
      if (pat === 'stripe') {
        px(sideX, 65, 3, 12, col.trim);
      } else if (pat === 'cuff') {
        px(40, 74, 16, 3, col.trim);
      } else if (pat === 'pocket') {
        px(44, 67, 6, 5, col.trim);
      } else if (pat === 'wave') {
        px(40, 69, 16, 2, col.trim);
      } else if (pat === 'checker') {
        px(41, 66, 4, 3, col.hi);
        px(49, 66, 4, 3, col.hi);
        px(45, 70, 4, 3, col.hi);
      } else if (pat === 'greaves') {
        px(43, 69, 8, 5, INK);
        px(44, 70, 6, 3, col.trim);
      }

      if (isShorts) {
        if (c === 1 || c === 3) {
          px(35, 70, 9, 2, col.dark);
          px(51, 70, 9, 2, col.dark);
          px(36, 72, 7, 6, skin.base);
          px(52, 72, 7, 6, skin.base);
          px(36, 72, 2, 6, skin.shadow);
          px(52, 72, 2, 6, skin.shadow);
        } else {
          px(41, 70, 14, 2, col.dark);
          px(42, 72, 11, 6, skin.base);
          px(42, 72, 2, 6, skin.shadow);
          px(41, 72, 1, 6, INK);
          px(53, 72, 1, 6, INK);
        }
      }
    }
  }

  function drawApparelShoeCell(octx, shoe, r, c) {
    if (!shoe) return;
    const col = shoe.colors || {};
    const st = shoe.style;
    const INK = '#1c1210';
    const px = (gx, gy, gw, gh, fill) => {
      const rx = (r === 2) ? (CELL - gx - gw) : gx;
      octx.fillStyle = fill;
      octx.fillRect(Math.round(c * CELL + rx), Math.round(r * CELL + gy), gw, gh);
    };

    const drawPairFoot = (fx, fy, w, h) => {
      px(fx - 1, fy, w + 2, h, INK);
      px(fx, fy + 1, w, h - 3, col.base);
      px(fx + 1, fy + 1, Math.max(2, w - 4), 2, col.hi);
      px(fx, fy + h - 3, w, 2, col.sole);
      if (st === 'hightop' || st === 'boot') {
        px(fx, fy - 2, w, 3, col.dark);
        px(fx + 2, fy + 2, Math.max(2, w - 4), 2, col.accent);
      } else if (st === 'loafer') {
        px(fx + 2, fy + 2, Math.max(2, w - 4), 2, col.accent);
      } else if (st === 'winged') {
        px(fx - 2, fy + 1, 3, 4, col.accent);
        px(fx + w - 1, fy + 1, 3, 4, col.accent);
        px(fx + 2, fy + 2, Math.max(2, w - 4), 2, col.sole);
      } else {
        px(fx + 2, fy + 2, Math.max(2, w - 4), 2, col.accent);
      }
    };

    if (r === 0 || r === 3) {
      const lLift = (c === 1) ? -2 : 0;
      const rLift = (c === 3) ? -2 : 0;
      drawPairFoot(38, 82 + lLift, 8, 8);
      drawPairFoot(50, 82 + rLift, 8, 8);
    } else if (c === 1 || c === 3) {
      drawPairFoot(33, 82, 9, 7);
      drawPairFoot(52, 82, 9, 7);
    } else {
      drawPairFoot(41, 82, 11, 8);
    }
  }

  const composedCache = new Map();
  const MAX_CACHE_SIZE = 48;

  function getComposedSheet(app) {
    const rawOutfit = app.outfitStyle || 'jacket';
    const isBaseBody = rawOutfit === 'none';
    const outfitKey = isBaseBody ? 'jacket' : (OUTFIT_TO_KEY[rawOutfit] || 'jacket');
    const hairStyle = app.hairStyle || 'spiky';
    const isBald = hairStyle === 'bald';
    const isModularCut = !isBald && (BARBER_HAIR_SET.has(hairStyle) || hairStyle === 'short');
    const hairKey = (isBald || isModularCut) ? 'jacket' : (HAIR_TO_KEY[hairStyle] || 'jacket');
    if (!isArchReady('base') || !isArchReady('jacket') || !isArchReady(outfitKey) || !isArchReady(hairKey)) return null;

    const skin = findById(SKIN_TONES, app.skin);
    const hair = findById(HAIR_COLORS, app.hairColor);
    const eye = findById(EYE_COLORS, app.eyeColor);
    const outfit = findById(OUTFIT_COLORS, app.outfitColor);
    const pants = findById(PANTS_COLORS, app.pantsColor);
    const customShirt = app.shirtStyle ? APPAREL_SHIRT_MAP.get(app.shirtStyle) : null;
    const customPants = app.pantsStyle ? APPAREL_PANTS_MAP.get(app.pantsStyle) : null;
    const customShoe = app.shoeStyle ? APPAREL_SHOE_MAP.get(app.shoeStyle) : null;

    const cacheKey = `${isBaseBody ? 'base' : outfitKey}|${hairStyle}|${hair.id}|${skin.id}|${eye.id}|${outfit.id}|${pants.id}|${app.shirtStyle || ''}|${app.pantsStyle || ''}|${app.shoeStyle || ''}`;
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
    const nativeJacketHero = (
      !isBaseBody && !isBald && !isModularCut && !customShirt && !customPants && !customShoe &&
      eye.id === 'blue' && outfitKey === 'jacket' && hairKey === 'jacket'
    );

    if (nativeJacketHero) {
      // Exact native player hero_jacket composition
      renderTintedLayerToWork(ob.pants, pants.base);
      octx.drawImage(workCanvas, 0, 0);
      renderTintedLayerToWork(ob.outfit, outfit.base);
      octx.drawImage(workCanvas, 0, 0);
      renderTintedLayerToWork(ob.skin, skin.base);
      octx.drawImage(workCanvas, 0, 0);
      renderTintedLayerToWork(ob.hair, hair.base);
      octx.drawImage(workCanvas, 0, 0);
      octx.drawImage(ob.ink, 0, 0, SHEET_SIZE, SHEET_SIZE);
    } else {
      // Unified paper-doll pipeline
      const base = spriteBank.base;
      const bodyDx = BODY_ROW_DX[outfitKey] || BODY_ROW_DX.jacket;
      const bodyInkMins = BODY_INK_MIN_Y[outfitKey];

      // 1. Neutral Body / Archetype Pants + Torso Base Layer (y = 48..96)
      if (isBaseBody && !customShirt && !customPants) {
        renderTintedLayerToWork(base.skin, skin.base);
        drawRowAlignedBodySlice(octx, workCanvas, [0, 0, 0, 0], 48);
        drawRowAlignedBodySlice(octx, base.ink, [0, 0, 0, 0], 48, customShoe ? 82 : CELL);
      } else {
        const effOutfit = customShirt ? spriteBank.jacket : ob;
        const effDx = customShirt ? [0, 0, 0, 0] : bodyDx;
        const effInkMins = customShirt ? BODY_INK_MIN_Y.jacket : bodyInkMins;

        renderTintedLayerToWork(effOutfit.pants, customPants ? customPants.colors.base : pants.base);
        drawRowAlignedBodySlice(octx, workCanvas, effDx, 0);

        renderTintedLayerToWork(effOutfit.outfit, customShirt ? customShirt.colors.base : outfit.base);
        drawRowAlignedBodySlice(octx, workCanvas, effDx, effInkMins);

        renderTintedLayerToWork(effOutfit.skin, skin.base);
        drawRowAlignedBodySlice(octx, workCanvas, effDx, BODY_SKIN_MIN_Y);
        drawRowAlignedBodySlice(octx, effOutfit.ink, effDx, effInkMins, customShoe ? 82 : CELL);
      }

      // 2. Modular Apparel Clothing & Shoes Layer
      if (customPants || customShirt || customShoe) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (customPants) drawApparelPantsCell(octx, customPants, skin, r, c);
            if (customShirt) drawApparelShirtCell(octx, customShirt, skin, r, c);
            if (customShoe) drawApparelShoeCell(octx, customShoe, r, c);
          }
        }
      }

      // 3. Canonical Bald Base Head (rounded cranium + hero_jacket face & recolorable eyes)
      renderTintedLayerToWork(base.skin, skin.base);
      drawCellSlices(octx, workCanvas, 50, false);
      renderTintedLayerToWork(base.eyes, eye.base);
      drawCellSlices(octx, workCanvas, 50, false);
      drawCellSlices(octx, base.ink, 50, false);

      // 4. Modular Hair Layer ('bald' draws nothing, barber/crew cuts draw pixel hair, archetypes draw masked hair)
      if (isModularCut) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            drawBarberHairCell(octx, hairStyle, hair, r, c);
          }
        }
      } else if (!isBald && hairKey === 'jacket') {
        const jb = spriteBank.jacket;
        renderTintedLayerToWork(jb.hair, hair.base);
        drawCellSlices(octx, workCanvas, 47, false);
        workCtx.globalCompositeOperation = 'source-over';
        workCtx.clearRect(0, 0, SHEET_SIZE, SHEET_SIZE);
        workCtx.drawImage(jb.ink, 0, 0, SHEET_SIZE, SHEET_SIZE);
        workCtx.globalCompositeOperation = 'destination-out';
        for (let c = 0; c < 4; c++) {
          const cx = c * CELL;
          workCtx.fillRect(cx + 39, 41, 18, 7);
          workCtx.fillRect(cx + 37, CELL + 37, 8, 7);
          workCtx.fillRect(cx + 51, 2 * CELL + 37, 8, 7);
        }
        workCtx.globalCompositeOperation = 'source-over';
        drawCellSlices(octx, workCanvas, 47, false);
      } else if (!isBald) {
        const hairMaxY = HEAD_SPLIT_SPEC[hairKey]?.hairMaxY || HEAD_HAIR_MAX_Y;
        drawHairWithMaskedInk(
          octx,
          hb,
          hairKey,
          hair.base,
          hairMaxY,
          FLIPPED_COL3_ARCHES.has(hairKey),
          HAIR_ROW_OFFSET[hairKey]
        );
      }
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
    } else if (hatStyle === 'fire_helmet') {
      // Firefighter Helmet seated cleanly over short hair above brows (y=19..34)
      r(31, 19, 34, 12, INK);
      r(33, 20, 30, 9, '#b91c1c');
      r(35, 20, 26, 4, '#ef4444');
      r(27, 29, 42, 5, INK);
      r(29, 30, 38, 3, '#991b1b');
      if (dir === 'down') {
        r(43, 22, 10, 8, INK);
        r(44, 23, 8, 6, '#facc15');
        r(45, 23, 6, 2, '#fef08a');
      } else if (dir === 'left') {
        r(26, 30, 14, 3, '#ef4444');
        r(34, 23, 4, 6, '#facc15');
      } else if (dir === 'right') {
        r(56, 30, 14, 3, '#ef4444');
        r(58, 23, 4, 6, '#facc15');
      }
    } else if (hatStyle === 'police_cap') {
      // Peaked Police Officer Cap seated cleanly above brows (y=20..34)
      r(29, 20, 38, 12, INK);
      r(31, 21, 34, 9, '#1e3a8a');
      r(33, 21, 30, 4, '#3b82f6');
      r(30, 29, 36, 4, '#0f172a');
      if (dir === 'down') {
        r(32, 31, 32, 4, INK);
        r(34, 32, 28, 2, '#1e293b');
        r(44, 22, 8, 6, '#facc15');
        r(45, 22, 6, 2, '#fef08a');
      } else if (dir === 'left') {
        r(24, 30, 15, 4, INK);
        r(26, 31, 13, 2, '#1e293b');
        r(35, 23, 4, 5, '#facc15');
      } else if (dir === 'right') {
        r(57, 30, 15, 4, INK);
        r(57, 31, 13, 2, '#1e293b');
        r(57, 23, 4, 5, '#facc15');
      }
    }
  }

  const CUSTOM_DIR_COL = { down: 0, left: 1, right: 2, up: 3 };

  function drawVariation3B(ctx, app, cx, footY, dir = 'down', walkTick = 0, scale = 1.0) {
    const resolved = { ...DEFAULT_APPEARANCE, ...app };
    const isWalking = walkTick > 0;
    const cellDrawSize = Math.max(24, Math.round(CELL * scale * 0.36));

    if (resolved.customSprite) {
      const cImg = getCustomSpriteImage(resolved.customSprite);
      const isGrid4x4 = Boolean(cImg && cImg.naturalHeight >= cImg.naturalWidth * 0.75);
      const hop = (!isGrid4x4 && isWalking) ? Math.abs(Math.sin(walkTick * 4.8)) * 2 : 0;

      ctx.save();
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

      if (cImg) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        if (isGrid4x4) {
          const frameW = Math.round(cImg.naturalWidth / 4);
          const frameH = Math.round(cImg.naturalHeight / 4);
          const phase = isWalking ? (Math.floor(walkTick * 0.55) % 4) : 0;
          const row = DIR_ROW[dir] ?? 0;
          const drawX = Math.round(cx - cellDrawSize / 2);
          const drawY = Math.round(footY - (122 / 128) * cellDrawSize);
          ctx.drawImage(
            cImg,
            phase * frameW, row * frameH, frameW, frameH,
            drawX, drawY, cellDrawSize, cellDrawSize
          );
        } else {
          const frameW = Math.round(cImg.naturalWidth / 4);
          const frameH = cImg.naturalHeight;
          const col = CUSTOM_DIR_COL[dir] ?? 0;
          const drawX = Math.round(cx - cellDrawSize / 2);
          const drawY = Math.round(footY - hop - (122 / 128) * cellDrawSize);
          ctx.drawImage(
            cImg,
            col * frameW, 0, frameW, frameH,
            drawX, drawY, cellDrawSize, cellDrawSize
          );
        }
      } else {
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
      return;
    }

    const sheet = getComposedSheet(resolved);
    const phase = isWalking ? (Math.floor(walkTick * 2.4) % 4) : 0; // 0=idle, 1=stepL, 2=idle, 3=stepR

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
    BARBER_HAIR_STYLES,
    APPAREL_SHIRTS,
    APPAREL_PANTS,
    APPAREL_SHOES,
    HAT_STYLES,
    OUTFIT_STYLES,
    DEFAULT_APPEARANCE,
    CharacterSpriteSheet,
    drawVariation3B
  };
})();
