/**
 * MYTHOS — Variation 3B: Sleek Anime Duelist (HD Painted Chibi Engine)
 * Smooth high-resolution vector & gradient character renderer with:
 * - 2.5-head athletic chibi trainer proportions
 * - Articulated swinging sleeves, fingerless duelist gloves & high-top sneakers
 * - Sharp lashed anime eyes with gradient irises & catchlight
 * - 5 sculpted anime hairstyles with glossy hair-halo shine
 * - 4 duelist outfit styles & 5 headgear/accessory options
 */

(function () {
  'use strict';

  const SKIN_TONES = [
    { id: 'light', name: 'Fair Peach', hi: '#fff3e6', base: '#ffdfc4', shadow: '#d49b72', ink: '#29150e' },
    { id: 'warm', name: 'Warm Honey', hi: '#fce3c8', base: '#f5c496', shadow: '#c28551', ink: '#29150e' },
    { id: 'olive', name: 'Golden Olive', hi: '#f2cba0', base: '#e0ac79', shadow: '#ab7340', ink: '#241208' },
    { id: 'tan', name: 'Sunlit Tan', hi: '#dba063', base: '#c68642', shadow: '#8f5519', ink: '#211004' },
    { id: 'brown', name: 'Rich Umber', hi: '#ab6e38', base: '#8d5524', shadow: '#59300c', ink: '#1a0b02' },
    { id: 'deep', name: 'Deep Espresso', hi: '#784c33', base: '#5c3824', shadow: '#361d10', ink: '#120702' }
  ];

  const HAIR_COLORS = [
    { id: 'chestnut', name: 'Chestnut Brown', hi: '#c27846', base: '#854720', dark: '#47210a' },
    { id: 'blonde', name: 'Golden Blonde', hi: '#fef08a', base: '#eab308', dark: '#854d0e' },
    { id: 'crimson', name: 'Ruby Flame', hi: '#fca5a5', base: '#dc2626', dark: '#7f1d1d' },
    { id: 'midnight', name: 'Midnight Blue', hi: '#64748b', base: '#1e293b', dark: '#090d16' },
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
    { id: 'cobalt', name: 'Duelist Blue', hi: '#60a5fa', base: '#2563eb', dark: '#172554', accent: '#fbbf24' },
    { id: 'crimson', name: 'Valor Red', hi: '#f87171', base: '#dc2626', dark: '#450a0a', accent: '#fde047' },
    { id: 'ranger', name: 'Emerald Seeker', hi: '#4ade80', base: '#15803d', dark: '#052e16', accent: '#fbbf24' },
    { id: 'royal', name: 'Twilight Purple', hi: '#c084fc', base: '#7e22ce', dark: '#2e1065', accent: '#38bdf8' },
    { id: 'charcoal', name: 'Shadow Jet', hi: '#94a3b8', base: '#334155', dark: '#0f172a', accent: '#f43f5e' },
    { id: 'gold', name: 'Solar Champion', hi: '#fde047', base: '#ca8a04', dark: '#713f12', accent: '#38bdf8' }
  ];

  const PANTS_COLORS = [
    { id: 'denim', name: 'Slate Denim', base: '#334155', dark: '#0f172a' },
    { id: 'dark', name: 'Obsidian Black', base: '#18181b', dark: '#09090b' },
    { id: 'khaki', name: 'Sand Khaki', base: '#a3834f', dark: '#5c4522' },
    { id: 'crimson', name: 'Track Red', base: '#7f1d1d', dark: '#450a0a' }
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

  /**
   * Draws Variation 3B (Sleek Anime Duelist) directly onto target canvas context
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} app - Appearance configuration
   * @param {number} cx - Center X coordinate
   * @param {number} footY - Bottom foot Y coordinate
   * @param {string} dir - 'down' | 'up' | 'left' | 'right'
   * @param {number} walkTick - Continuous walk animation phase (0 = idle)
   * @param {number} scale - Scale factor (e.g. 1.05 for overworld, 2.3 for creator preview)
   */
  function drawVariation3B(ctx, app, cx, footY, dir = 'down', walkTick = 0, scale = 1.0) {
    const skin = findById(SKIN_TONES, app.skin);
    const hair = findById(HAIR_COLORS, app.hairColor);
    const eye = findById(EYE_COLORS, app.eyeColor);
    const outfit = findById(OUTFIT_COLORS, app.outfitColor);
    const pants = findById(PANTS_COLORS, app.pantsColor);
    const hairStyle = app.hairStyle || 'spiky';
    const outfitStyle = app.outfitStyle || 'jacket';
    const hatStyle = app.hatStyle || 'none';

    const isWalking = walkTick > 0;
    const stride = isWalking ? Math.sin(walkTick * 2.2) * 5.2 : 0;
    const bob = isWalking ? Math.abs(Math.sin(walkTick * 2.2)) * 2.2 : 0;

    ctx.save();
    ctx.translate(cx, footY);
    ctx.scale(scale, scale);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.0;

    // -------------------------------------------------------------------------
    // 0. Back-Layer Hair / Ponytail / Trench Coat Tails (behind legs/torso)
    // -------------------------------------------------------------------------
    if (hairStyle === 'long' && dir !== 'up') {
      const hBackGrad = ctx.createLinearGradient(0, -48, 0, -16);
      hBackGrad.addColorStop(0, hair.base);
      hBackGrad.addColorStop(1, hair.dark);
      ctx.fillStyle = hBackGrad;
      ctx.beginPath();
      ctx.moveTo(-13, -42 - bob);
      ctx.quadraticCurveTo(-17, -26 - bob, -14, -17 - bob);
      ctx.lineTo(14, -17 - bob);
      ctx.quadraticCurveTo(17, -26 - bob, 13, -42 - bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (hairStyle === 'ponytail' && dir !== 'down') {
      const tailX = dir === 'left' ? 12 : (dir === 'right' ? -12 : 0);
      const sway = Math.sin(walkTick * 2.2) * 2;
      ctx.fillStyle = hair.base;
      ctx.beginPath();
      ctx.moveTo(tailX, -48 - bob);
      ctx.quadraticCurveTo(tailX + (dir === 'left' ? 10 : -10) + sway, -44 - bob, tailX + (dir === 'left' ? 8 : -8) + sway, -31 - bob);
      ctx.quadraticCurveTo(tailX, -33 - bob, tailX, -44 - bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (outfitStyle === 'coat') {
      const sway = stride * 0.35;
      ctx.fillStyle = outfit.dark;
      ctx.beginPath();
      ctx.moveTo(-9, -20 - bob);
      ctx.lineTo(-13 + sway, -6 - bob);
      ctx.lineTo(13 + sway, -6 - bob);
      ctx.lineTo(9, -20 - bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // -------------------------------------------------------------------------
    // 1. Athletic Legs & High-Top Duelist Sneakers
    // -------------------------------------------------------------------------
    const lY = stride > 0 ? -3.2 : 0.4;
    const rY = stride < 0 ? -3.2 : 0.4;

    if (dir === 'down' || dir === 'up') {
      ctx.fillStyle = pants.dark;
      ctx.beginPath(); ctx.roundRect(-7.5, -16 + lY, 5.5, 11, 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(2, -16 + rY, 5.5, 11, 2); ctx.fill(); ctx.stroke();

      // High-top sneakers with white soles & accent tongue
      [[-8, lY], [1.5, rY]].forEach(([sx, sy]) => {
        ctx.fillStyle = outfit.base;
        ctx.beginPath(); ctx.roundRect(sx, -7 + sy, 6.5, 6.5, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = outfit.accent;
        ctx.fillRect(sx + 1.5, -6.5 + sy, 3.5, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + 0.5, -2.5 + sy, 5.5, 2);
      });
    } else {
      // Side profile stepping legs
      const frontOffset = stride * 0.7;
      [[-frontOffset, rY], [frontOffset, lY]].forEach(([lx, ly]) => {
        ctx.fillStyle = pants.dark;
        ctx.beginPath(); ctx.roundRect(-3 + lx, -16 + ly, 6, 11, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = outfit.base;
        ctx.beginPath(); ctx.roundRect(-3.5 + lx, -7 + ly, 7, 6.5, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3 + lx, -2.5 + ly, 6, 2);
      });
    }

    ctx.translate(0, -bob);

    // -------------------------------------------------------------------------
    // 2. Articulated Swinging Arms & Fingerless Duelist Gloves (Left & Right)
    // -------------------------------------------------------------------------
    const drawArm = (side) => {
      const swing = (side === -1 ? stride : -stride) * 0.45;
      ctx.save();
      ctx.translate(side * 10, -29);
      ctx.rotate(swing * 0.08);

      // Sleeve (bare arm with wristband if 'vest', full sleeve otherwise)
      ctx.fillStyle = outfitStyle === 'vest' ? skin.base : outfit.base;
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6, 11, 2.5);
      ctx.fill();
      ctx.stroke();

      // Fingerless duelist glove
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2.6, 7.5, 5.2, 3);
      ctx.fillStyle = outfit.accent;
      ctx.fillRect(-2.6, 7.2, 5.2, 1.2);

      // Hand
      ctx.fillStyle = skin.base;
      ctx.beginPath();
      ctx.arc(0, 12, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    if (dir === 'down' || dir === 'up') {
      drawArm(-1);
      drawArm(1);
    } else if (dir === 'left') {
      drawArm(-1);
    } else if (dir === 'right') {
      drawArm(1);
    }

    // -------------------------------------------------------------------------
    // 3. Fitted Torso / Jacket / Hoodie / Vest / Trench
    // -------------------------------------------------------------------------
    const jGrad = ctx.createLinearGradient(0, -32, 0, -14);
    jGrad.addColorStop(0, outfit.hi);
    jGrad.addColorStop(1, outfit.dark);
    ctx.fillStyle = jGrad;
    ctx.beginPath();
    ctx.roundRect(-9, -31, 18, 17, 3);
    ctx.fill();
    ctx.stroke();

    if (dir !== 'up') {
      const ox = dir === 'left' ? -2 : (dir === 'right' ? 2 : 0);
      if (outfitStyle === 'jacket' || outfitStyle === 'coat') {
        // Crisp inner white tee + gold jacket zipper trim
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-3.5 + ox, -30, 7, 14);
        ctx.strokeStyle = outfit.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4 + ox, -30); ctx.lineTo(-4 + ox, -15);
        ctx.moveTo(4 + ox, -30); ctx.lineTo(4 + ox, -15);
        ctx.stroke();
        ctx.strokeStyle = '#18181b';
      } else if (outfitStyle === 'hoodie') {
        // Street Hoodie V-neck + drawstrings + kangaroo pocket
        ctx.fillStyle = outfit.accent;
        ctx.beginPath();
        ctx.roundRect(-8, -31.5, 16, 4.5, 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-2.5 + ox, -27); ctx.lineTo(-2.5 + ox, -21);
        ctx.moveTo(2.5 + ox, -27); ctx.lineTo(2.5 + ox, -21);
        ctx.stroke();
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.0;
      } else if (outfitStyle === 'vest') {
        // Academy Vest with gold emblem crest & belt
        ctx.fillStyle = outfit.accent;
        ctx.beginPath();
        ctx.moveTo(ox, -28);
        ctx.lineTo(3.5 + ox, -24);
        ctx.lineTo(ox, -20);
        ctx.lineTo(-3.5 + ox, -24);
        ctx.closePath();
        ctx.fill();
      }

      // Glowing Mythos Deck Holster on hip!
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(5.5, -18, 4, 5.5);
      ctx.strokeRect(5.5, -18, 4, 5.5);
    }

    // Popped Jacket Collar
    if (outfitStyle === 'jacket' || outfitStyle === 'coat') {
      ctx.fillStyle = outfit.base;
      ctx.beginPath();
      ctx.moveTo(-8, -30); ctx.lineTo(-10.5, -34.5); ctx.lineTo(-4, -31); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, -30); ctx.lineTo(10.5, -34.5); ctx.lineTo(4, -31); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    // Foreground arm when facing left/right
    if (dir === 'left') drawArm(1);
    if (dir === 'right') drawArm(-1);

    // -------------------------------------------------------------------------
    // 4. Sculpted Anime Chibi Head & Sharp Lashed Eyes
    // -------------------------------------------------------------------------
    const headGrad = ctx.createLinearGradient(0, -54, 0, -31);
    headGrad.addColorStop(0, skin.hi);
    headGrad.addColorStop(0.7, skin.base);
    headGrad.addColorStop(1, skin.shadow);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(-12.5, -46);
    ctx.quadraticCurveTo(-12.5, -54, 0, -54);
    ctx.quadraticCurveTo(12.5, -54, 12.5, -46);
    ctx.quadraticCurveTo(12.5, -32, 0, -31);
    ctx.quadraticCurveTo(-12.5, -32, -12.5, -46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (dir !== 'up') {
      const ex = dir === 'left' ? -3.2 : (dir === 'right' ? 3.2 : 0);

      // Sharp Anime Eyes with upper lash bar, gradient iris & star catchlight
      [-5 + ex, 5 + ex].forEach((eyeX) => {
        // White sclera
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(eyeX - 2.8, -44, 5.6, 5.5, 2);
        ctx.fill();

        // Multi-stop gradient iris
        const iGrad = ctx.createLinearGradient(eyeX, -44, eyeX, -38.5);
        iGrad.addColorStop(0, eye.dark);
        iGrad.addColorStop(0.55, eye.base);
        iGrad.addColorStop(1, eye.hi);
        ctx.fillStyle = iGrad;
        ctx.beginPath();
        ctx.ellipse(eyeX, -41.2, 2.2, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark pupil center
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(eyeX, -41.2, 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Bold upper eyelash wing
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(eyeX - 3.1, -44.6, 6.2, 1.9);

        // Specular anime catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX - 0.9, -42.5, 1.05, 0, Math.PI * 2);
        ctx.fill();

        // Expressive eyebrow
        ctx.strokeStyle = hair.dark;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(eyeX - 2.8, -46.2);
        ctx.lineTo(eyeX + 2.8, -45.8);
        ctx.stroke();
      });

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.8;

      // Confident anime duelist smirk
      ctx.beginPath();
      ctx.moveTo(-1.5 + ex, -35);
      ctx.quadraticCurveTo(1 + ex, -34, 2.5 + ex, -35.5);
      ctx.stroke();
      ctx.lineWidth = 2.0;
    }

    // -------------------------------------------------------------------------
    // 5. Sculpted Anime Hairstyles + Glossy Hair Halo
    // -------------------------------------------------------------------------
    const hGrad = ctx.createLinearGradient(0, -61, 0, -35);
    hGrad.addColorStop(0, hair.hi);
    hGrad.addColorStop(0.5, hair.base);
    hGrad.addColorStop(1, hair.dark);
    ctx.fillStyle = hGrad;

    ctx.beginPath();
    if (dir === 'up') {
      // Back of head hair silhouette
      ctx.moveTo(-14, -44);
      ctx.quadraticCurveTo(-16, -60, 0, -60);
      ctx.quadraticCurveTo(16, -60, 14, -44);
      if (hairStyle === 'spiky' || hairStyle === 'swept') {
        ctx.lineTo(16, -36);
        ctx.lineTo(9, -37);
        ctx.lineTo(6, -32);
        ctx.lineTo(0, -36);
        ctx.lineTo(-6, -32);
        ctx.lineTo(-9, -37);
        ctx.lineTo(-16, -36);
      } else if (hairStyle === 'long') {
        ctx.lineTo(15, -18);
        ctx.quadraticCurveTo(0, -14, -15, -18);
      } else {
        ctx.quadraticCurveTo(14, -32, 0, -32);
        ctx.quadraticCurveTo(-14, -32, -14, -44);
      }
      ctx.closePath();
    } else if (hairStyle === 'spiky' || hairStyle === 'ponytail') {
      // Dynamic spiky anime bangs & side spikes
      ctx.moveTo(-13.5, -42);
      ctx.lineTo(-17, -47);
      ctx.lineTo(-13, -51);
      ctx.lineTo(-15, -56);
      ctx.quadraticCurveTo(0, -62, 15, -56);
      ctx.lineTo(13, -51);
      ctx.lineTo(17, -47);
      ctx.lineTo(13.5, -42);
      ctx.lineTo(11, -37);
      ctx.lineTo(8, -45);
      ctx.lineTo(3, -39);
      ctx.lineTo(0, -46);
      ctx.lineTo(-4, -39);
      ctx.lineTo(-9, -45);
      ctx.lineTo(-11, -37);
      ctx.closePath();
    } else if (hairStyle === 'swept') {
      // Wind-swept asymmetrical ace bangs
      ctx.moveTo(-14, -41);
      ctx.quadraticCurveTo(-15, -59, 2, -60);
      ctx.quadraticCurveTo(16, -59, 16, -43);
      ctx.lineTo(12, -35);
      ctx.lineTo(9, -44);
      ctx.lineTo(2, -38);
      ctx.lineTo(-2, -45);
      ctx.lineTo(-9, -41);
      ctx.lineTo(-12, -35);
      ctx.closePath();
    } else if (hairStyle === 'bob' || hairStyle === 'long') {
      // Sleek anime bob / long framing locks
      ctx.moveTo(-14, -35);
      ctx.quadraticCurveTo(-15.5, -58, 0, -58);
      ctx.quadraticCurveTo(15.5, -58, 14, -35);
      ctx.lineTo(10.5, -34);
      ctx.lineTo(9.5, -45);
      ctx.lineTo(4, -40);
      ctx.lineTo(0, -45);
      ctx.lineTo(-4, -40);
      ctx.lineTo(-9.5, -45);
      ctx.lineTo(-10.5, -34);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // High Ponytail Knot on top if 'ponytail'
    if (hairStyle === 'ponytail') {
      ctx.fillStyle = outfit.accent;
      ctx.beginPath();
      ctx.roundRect(-4, -60, 8, 3.5, 1.5);
      ctx.fill();
      ctx.stroke();
      if (dir === 'down' || dir === 'up') {
        ctx.fillStyle = hair.hi;
        ctx.beginPath();
        ctx.ellipse(0, -63, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // -------------------------------------------------------------------------
    // 6. Headgear / Glossy Anime Hair Halo
    // -------------------------------------------------------------------------
    if (hatStyle === 'none') {
      // Signature glossy anime hair shine arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -46, 9.5, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    } else if (hatStyle === 'cap') {
      // Sleek Duelist Visor Cap
      ctx.fillStyle = outfit.dark;
      ctx.beginPath();
      ctx.roundRect(-13, -57, 26, 9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = outfit.base;
      ctx.beginPath();
      ctx.roundRect(-11, -56, 22, 5, 2.5);
      ctx.fill();
      ctx.fillStyle = outfit.accent;
      ctx.fillRect(-5, -53.5, 10, 2.5);
    } else if (hatStyle === 'goggles') {
      // Classic Anime TCG Forehead Aviator Goggles!
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-13, -52.5, 26, 3.5);
      [[-5.5, -51], [5.5, -51]].forEach(([gx, gy]) => {
        ctx.fillStyle = outfit.accent;
        ctx.beginPath();
        ctx.roundRect(gx - 5, gy - 4, 10, 7.5, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(gx - 3.5, gy - 2.5, 7, 4.5, 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx - 2.5, gy - 2, 2, 1.5);
      });
    } else if (hatStyle === 'headband') {
      // Champion Battle Headband with side tails
      ctx.fillStyle = outfit.base;
      ctx.beginPath();
      ctx.roundRect(-13.5, -50.5, 27, 4, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = outfit.accent;
      ctx.fillRect(-4, -50, 8, 3);
    } else if (hatStyle === 'crown') {
      // Mythos Golden Circlet with Arcane Gem
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(-10.5, -51, 21, 3.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(3, -49.5);
      ctx.lineTo(0, -46);
      ctx.lineTo(-3, -49.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Wrapper class used by Overworld and Character Creator
   */
  class CharacterSpriteSheet {
    constructor(appearance = {}) {
      this.setAppearance(appearance);
    }

    setAppearance(appearance = {}) {
      this.appearance = { ...DEFAULT_APPEARANCE, ...appearance };
    }

    /**
     * Draw smooth Variation 3B character onto target canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} centerX
     * @param {number} footY
     * @param {string} dir - 'down' | 'up' | 'left' | 'right'
     * @param {number} walkProgress - Continuous walk phase (0 = idle)
     * @param {number} scale - Compatibility scale (mapped cleanly to 3B proportions)
     */
    draw(ctx, centerX, footY, dir = 'down', walkProgress = 0, scale = 2.5) {
      // Map legacy pixel scale (2.5 in overworld, 4.2 in creator, 2.0 in save slot) to 3B vector scale
      const vectorScale = scale * 0.48;
      drawVariation3B(ctx, this.appearance, centerX, footY, dir, walkProgress, vectorScale);
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
