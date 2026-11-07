/**
 * MYTHOS — Open-World RPG Overworld Engine
 * - Interior: Inspired directly by the cutaway room reference (slate-blue void,
 *   chamfered wood-capped walls, cream plaster wall with subtle stone cracks,
 *   wide-plank wood floor, dark chamfered rug, bed, 4-drawer dresser, carved wood
 *   TV armoire, diamond-lattice arched window, wall clock, bookcase, and round
 *   wooden table with two cushioned chairs).
 * - Exterior: Craftsman Timber Cottage (half-timbered cream walls, cedar shingle
 *   roof with dormer, stone chimney with smoke, flower boxes, and front yard).
 */

(function () {
  'use strict';

  const SAVE_KEY = 'mythos_world_save_v1';

  class MythosOverworld {
    constructor(onStartDuel) {
      this.onStartDuel = onStartDuel;
      this.active = false;

      // 16x12 grid @ 64px per tile (1024x768 canvas)
      this.COLS = 16;
      this.ROWS = 12;
      this.LOGICAL_TILE = 32;
      this.RENDER_SCALE = 2;
      this.TILE = this.LOGICAL_TILE * this.RENDER_SCALE; // 64px

      this.settings = {
        timeOfDay: 'day',
        shadersEnabled: true,
        showGrid: false
      };

      // Current area: 'interior' (House Inside) or 'exterior' (Craftsman Timber Yard)
      this.currentArea = 'interior';

      const CS = window.MythosCharacterSprites;

      this.worldSave = this.loadSaveData();
      this.draftAppearance = {
        ...CS.DEFAULT_APPEARANCE,
        ...(this.worldSave ? this.worldSave.playerAppearance : {})
      };

      // Equal 50/50 chance for friend NPC to be named Mike or AJ
      this.friendName = this.worldSave?.friendName || (Math.random() < 0.5 ? 'Mike' : 'AJ');
      this.gold = this.worldSave?.gold ?? 0;
      this.hasMomBoosterMoney = this.worldSave?.hasMomBoosterMoney ?? false;
      this.hasBoughtCardShopPacks = this.worldSave?.hasBoughtCardShopPacks ?? false;
      this.inventory = Array.isArray(this.worldSave?.inventory) ? [...this.worldSave.inventory] : [];
      this.selectedInventoryItemId = null;

      this.playerSprite = new CS.CharacterSpriteSheet(this.draftAppearance);
      this.shopkeeperNpc = this.createShopkeeperNpc();
      this.npcs = [this.createFriendNpc(this.friendName)];

      // Player starts by the round wooden table facing Mike/AJ
      this.player = {
        x: 8.6,
        y: 6.7,
        dir: 'right',
        walkTick: 0,
        moving: false,
        targetX: null,
        targetY: null
      };

      // Story state:
      // 'intro_bored' -> 'tv_commercial' -> 'both_excited' -> 'mom_enters' -> 'free_roam' -> 'mom_gave_money'
      this.storyState = 'intro_bored';
      this.tvOn = false;
      this.tvFlashTicks = 0;
      this.shakeTicks = 0;
      this.excitedBounceTicks = 0;
      this.areaTransitionCooldown = 0;

      this.creatorDir = 'down';
      this.creatorWalking = true;

      this.keys = {};
      this.tick = 0;
      this.nearInteractable = null;

      this.canvas = document.getElementById('overworld-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      if (this.canvas) {
        this.canvas.width = this.COLS * this.TILE;
        this.canvas.height = this.ROWS * this.TILE;
        this.bindEvents();
        this.initIntroAndCreatorUI();
        this.loop();
      }
    }

    createFriendNpc(friendName) {
      const CS = window.MythosCharacterSprites;
      const isMike = friendName === 'Mike';
      return {
        id: 'best_friend',
        name: friendName,
        x: 11.7,
        y: 6.7,
        dir: 'left',
        walkTick: 0,
        bubble: '💬',
        sprite: new CS.CharacterSpriteSheet({
          name: friendName,
          skin: isMike ? 'warm' : 'light',
          hairStyle: isMike ? 'swept' : 'spiky',
          hairColor: isMike ? 'blonde' : 'midnight',
          eyeColor: isMike ? 'emerald' : 'amber',
          outfitStyle: isMike ? 'hoodie' : 'jacket',
          outfitColor: isMike ? 'ranger' : 'crimson',
          pantsColor: 'dark',
          hatStyle: isMike ? 'goggles' : 'cap'
        })
      };
    }

    createMomNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'mom',
        name: 'Mom',
        x: 9.8,
        y: 10.2,
        targetX: 6.4,
        targetY: 8.2,
        dir: 'up',
        walkTick: 0,
        bubble: '💼',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Mom',
          skin: this.draftAppearance?.skin || 'light',
          hairStyle: 'ponytail',
          hairColor: 'chestnut',
          eyeColor: 'emerald',
          outfitStyle: 'vest',
          outfitColor: 'amethyst',
          pantsColor: 'navy',
          hatStyle: 'none'
        })
      };
    }

    createShopkeeperNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'shopkeeper',
        name: 'Shopkeeper Leo',
        x: 6.2,
        y: 4.55,
        dir: 'down',
        walkTick: 0,
        bubble: '🤩',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Leo',
          skin: 'olive',
          hairStyle: 'swept',
          hairColor: 'silver',
          eyeColor: 'amber',
          outfitStyle: 'vest',
          outfitColor: 'gold',
          pantsColor: 'dark',
          hatStyle: 'goggles'
        })
      };
    }

    // -------------------------------------------------------------------------
    // Player Inventory, Base Set Card Catalog & Theatrical Pack Opening System
    // -------------------------------------------------------------------------
    getBaseSetCardCatalog() {
      return [
        {
          id: 'card_phoenix',
          beastId: 'phoenix',
          name: 'Phoenix (Mythos Card)',
          shortName: 'Phoenix',
          element: 'Fire',
          stars: 4,
          rarity: 'mythic',
          rarityLabel: '★★★★ MYTHIC HOLO',
          cardImg: 'Cards/Phoenix_Card.png',
          desc: '<b>Phoenix (★★★★ Fire • 120 HP)</b> — Base Set Holographic Card. Moves: <b>Flaming Talons</b> (30 Dmg), <b>Fire Orb</b> (50% Reflect), &amp; <b>Trails of Fire</b> (10 Dmg Flame Hazard).'
        },
        {
          id: 'card_earth_golem',
          beastId: 'earth_golem',
          name: 'Earth Golem (Mythos Card)',
          shortName: 'Earth Golem',
          element: 'Earth',
          stars: 4,
          rarity: 'mythic',
          rarityLabel: '★★★★ MYTHIC HOLO',
          cardImg: 'Cards/Earth_Golem_Card.png',
          desc: '<b>Earth Golem (★★★★ Earth • 200 HP)</b> — Base Set Holographic Card. Moves: <b>Crushing Grip</b> (20 Dmg + Immobilize), <b>Rock Barrier</b>, &amp; <b>Terraform</b>.'
        },
        {
          id: 'card_hydra',
          beastId: 'hydra',
          name: 'Hydra (Mythos Card)',
          shortName: 'Hydra',
          element: 'Poison',
          stars: 4,
          rarity: 'mythic',
          rarityLabel: '★★★★ MYTHIC HOLO',
          cardImg: 'Cards/Hydra_Card.png',
          desc: '<b>Hydra (★★★★ Poison • 120 HP)</b> — Base Set Holographic Card. Moves: <b>Venomous Bite</b> (20 Dmg + Poison), <b>Regrowth</b> (+10 HP/turn), &amp; <b>Swamp Regenerator</b>.'
        },
        {
          id: 'card_terra_mother',
          beastId: 'terra_mother',
          name: 'Terra-Mother (Mythos Card)',
          shortName: 'Terra-Mother',
          element: 'Earth',
          stars: 4,
          rarity: 'mythic',
          rarityLabel: '★★★★ MYTHIC HOLO',
          cardImg: 'Cards/Terra_Mother_Card.png',
          desc: '<b>Terra-Mother (★★★★ Earth • 100 HP)</b> — Base Set Holographic Card. Moves: <b>Root Crush</b> (35 Dmg), <b>Ram</b> (25 Dmg + 2-tile knockback), &amp; <b>Thorn of Life</b>.'
        },
        {
          id: 'card_werewolf',
          beastId: 'werewolf',
          name: 'Werewolf (Mythos Card)',
          shortName: 'Werewolf',
          element: 'Earth',
          stars: 2,
          rarity: 'rare',
          rarityLabel: '★★ RARE FOIL',
          cardImg: 'Cards/Werewolf_Card.png',
          desc: '<b>Werewolf (★★ Earth • 100 HP)</b> — Base Set Card. Moves: <b>Rip Apart</b> (20 Dmg), <b>Retreat</b> (+1 Move), &amp; <b>Howl</b> (+10 Team Attack Buff).'
        },
        {
          id: 'card_verdant_guardian',
          beastId: 'verdant_guardian',
          name: 'Verdant Guardian (Mythos Card)',
          shortName: 'Verdant Guardian',
          element: 'Plant',
          stars: 2,
          rarity: 'rare',
          rarityLabel: '★★ RARE FOIL',
          cardImg: 'Cards/Verdant_Guardian_Card.png',
          desc: '<b>Verdant Guardian (★★ Plant • 160 HP)</b> — Base Set Card. Moves: <b>Branch Whip</b> (20 Dmg), <b>Thorn Bush</b> (10 Dmg AOE), &amp; <b>Sapling Strength</b> (2× Dmg at ≤1/4 HP).'
        }
      ];
    }

    addInventoryItem(itemDef) {
      const existing = this.inventory.find(i => i.id === itemDef.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + (itemDef.qty || 1);
      } else {
        this.inventory.push({
          id: itemDef.id,
          name: itemDef.name,
          qty: itemDef.qty || 1,
          icon: itemDef.icon || '🃏',
          cardImg: itemDef.cardImg || null,
          rarity: itemDef.rarity || null,
          type: itemDef.type || 'pack',
          desc: itemDef.desc || ''
        });
      }
      this.selectedInventoryItemId = itemDef.id;
      this.saveWorldData(this.draftAppearance);
      this.renderInventoryModal();
    }

    getTotalInventoryCount() {
      return (this.inventory || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    }

    toggleInventoryModal(forceOpen) {
      const modal = document.getElementById('inventory-modal');
      if (!modal) return;
      const shouldOpen = forceOpen !== undefined ? forceOpen : modal.classList.contains('hidden');
      if (window.sounds?.playClick) window.sounds.playClick();
      if (shouldOpen) {
        this.renderInventoryModal();
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    renderInventoryModal() {
      const gridEl = document.getElementById('inventory-items-grid');
      const walletEl = document.getElementById('inv-wallet-display');
      const badgeEl = document.getElementById('inv-badge-count');
      const artEl = document.getElementById('inv-detail-art');
      const nameEl = document.getElementById('inv-detail-name');
      const qtyEl = document.getElementById('inv-detail-qty');
      const descEl = document.getElementById('inv-detail-desc');
      const actionsEl = document.getElementById('inv-detail-actions');
      const openPackBtn = document.getElementById('btn-inv-open-pack');

      const totalCount = this.getTotalInventoryCount();
      if (badgeEl) badgeEl.textContent = String(totalCount);
      if (walletEl) walletEl.textContent = `💵 $${this.gold || 0}`;
      if (!gridEl) return;

      gridEl.innerHTML = '';
      const totalSlots = Math.max(8, Math.ceil((this.inventory.length + 1) / 4) * 4);

      if (this.inventory.length > 0 && !this.inventory.some(i => i.id === this.selectedInventoryItemId)) {
        this.selectedInventoryItemId = this.inventory[0].id;
      }

      for (let s = 0; s < totalSlots; s++) {
        const item = this.inventory[s];
        const slot = document.createElement('div');
        if (item) {
          const isSelected = item.id === this.selectedInventoryItemId;
          slot.className = `inv-slot filled${isSelected ? ' active' : ''}`;
          if (item.type === 'booster_pack') {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div class="inv-pack-art-thumb">
                <img src="${item.cardImg || 'Cards/Mythos_Card_Back.png'}" alt="${item.name}">
              </div>
              <div class="inv-slot-name">${item.name}</div>
            `;
          } else if (item.type === 'mythos_card' && item.cardImg) {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div class="inv-card-art-thumb">
                <img src="${item.cardImg}" alt="${item.name}">
              </div>
              <div class="inv-slot-name">${item.name}</div>
            `;
          } else {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div style="font-size: 28px;">${item.icon || '📦'}</div>
              <div class="inv-slot-name">${item.name}</div>
            `;
          }
          slot.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.selectedInventoryItemId = item.id;
            this.renderInventoryModal();
          });
        } else {
          slot.className = 'inv-slot empty';
          slot.innerHTML = `<span style="font-size: 18px; opacity: 0.35;">•</span><div class="inv-slot-name" style="color: var(--text-muted);">Empty Slot</div>`;
        }
        gridEl.appendChild(slot);
      }

      const selectedItem = this.inventory.find(i => i.id === this.selectedInventoryItemId);
      if (selectedItem && nameEl && descEl && artEl && qtyEl) {
        if (selectedItem.type === 'booster_pack') {
          artEl.innerHTML = `
            <div class="inv-pack-art-thumb" style="width: 58px; height: 76px;">
              <img src="${selectedItem.cardImg || 'Cards/Mythos_Card_Back.png'}" alt="${selectedItem.name}">
            </div>
          `;
          if (actionsEl && openPackBtn) {
            actionsEl.classList.remove('hidden');
            openPackBtn.onclick = () => this.startBoosterPackOpening(selectedItem.id);
          }
        } else if (selectedItem.type === 'mythos_card' && selectedItem.cardImg) {
          artEl.innerHTML = `
            <div class="inv-card-art-thumb" style="width: 58px; height: 76px;">
              <img src="${selectedItem.cardImg}" alt="${selectedItem.name}">
            </div>
          `;
          actionsEl?.classList.add('hidden');
        } else {
          artEl.textContent = selectedItem.icon || '📦';
          actionsEl?.classList.add('hidden');
        }
        nameEl.textContent = selectedItem.name;
        qtyEl.textContent = `x${selectedItem.qty}`;
        qtyEl.classList.remove('hidden');
        descEl.innerHTML = selectedItem.desc;
      } else if (nameEl && descEl && artEl && qtyEl) {
        artEl.textContent = '🎒';
        nameEl.textContent = 'Backpack Empty';
        qtyEl.classList.add('hidden');
        actionsEl?.classList.add('hidden');
        descEl.textContent = 'Your backpack has no items yet. Ask Mom for $20 and head to the Mythos Card Shop on the far east block of the south road to buy your first Booster Pack!';
      }
    }

    // -------------------------------------------------------------------------
    // Theatrical & Suspenseful Booster Pack Opening Ritual
    // -------------------------------------------------------------------------
    rollFivePackCards() {
      const catalog = this.getBaseSetCardCatalog();
      // Shuffle a copy of the 6 Base Set cards and draw 5 distinct cards so every pack feels super rewarding!
      const pool = [...catalog];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const drawn = pool.slice(0, 5);
      // Sort so the 2-star Rare cards are on the left and the 4-star Mythic Holo cards build up to the grand finale on the right!
      drawn.sort((a, b) => a.stars - b.stars);
      return drawn;
    }

    startBoosterPackOpening(packItemId = 'unopened_base_pack') {
      const packItem = this.inventory.find(i => i.id === packItemId && i.qty > 0);
      if (!packItem) return;

      // Close the inventory modal so the full-screen Pack Opening Stage takes center stage
      this.toggleInventoryModal(false);

      this.packOpeningState = {
        packItemId,
        chargeClicks: 0,
        isRipping: false,
        cardsDealt: false,
        pulledCards: this.rollFivePackCards(),
        flippedIndices: new Set(),
        collected: false
      };

      const modal = document.getElementById('pack-opening-modal');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const sealedZone = document.getElementById('pack-sealed-zone');
      const wrapper = document.getElementById('sealed-booster-wrapper');
      const ring = document.getElementById('pack-energy-ring');
      const cardsRow = document.getElementById('pack-cards-reveal-row');
      const revealAllBtn = document.getElementById('btn-pack-reveal-all');
      const collectBtn = document.getElementById('btn-pack-collect');
      const flashBang = document.getElementById('pack-flash-bang');

      if (!modal || !wrapper || !sealedZone || !cardsRow) return;

      // Reset stage UI to Phase 1 (Sealed Booster Pack)
      if (titleEl) titleEl.textContent = 'BREAK THE CELESTIAL SEAL';
      if (subEl) {
        subEl.innerHTML = 'Click the sealed Booster Pack <b>3 times</b> to charge the Ouroboros runes and tear open the foil!';
      }
      sealedZone.classList.remove('hidden');
      wrapper.className = 'sealed-booster-wrapper';
      if (ring) ring.className = 'pack-energy-ring';
      ['seal-pip-1', 'seal-pip-2', 'seal-pip-3'].forEach(id => {
        document.getElementById(id)?.classList.remove('lit');
      });

      cardsRow.innerHTML = '';
      cardsRow.classList.add('hidden');
      revealAllBtn?.classList.add('hidden');
      collectBtn?.classList.add('hidden');
      flashBang?.classList.add('hidden');

      modal.classList.remove('hidden');
      if (window.sounds?.playPackSuspense) {
        window.sounds.playPackSuspense();
      }
    }

    handleSealedPackClick() {
      const st = this.packOpeningState;
      if (!st || st.isRipping || st.cardsDealt) return;

      st.chargeClicks++;
      const wrapper = document.getElementById('sealed-booster-wrapper');
      const ring = document.getElementById('pack-energy-ring');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const pip = document.getElementById(`seal-pip-${st.chargeClicks}`);
      if (pip) pip.classList.add('lit');

      if (st.chargeClicks === 1) {
        if (window.sounds?.playPackSuspense) window.sounds.playPackSuspense();
        wrapper?.classList.add('charge-shake-1');
        ring?.classList.add('charge-1');
        if (titleEl) titleEl.textContent = 'THE OUROBOROS SEAL AWAKENS...';
        if (subEl) subEl.innerHTML = 'Golden runes are glowing beneath the foil! Click <b>2 more times</b> to unseal!';
      } else if (st.chargeClicks === 2) {
        if (window.sounds?.playPackSuspense) window.sounds.playPackSuspense();
        wrapper?.classList.remove('charge-shake-1');
        wrapper?.classList.add('charge-shake-2');
        ring?.classList.remove('charge-1');
        ring?.classList.add('charge-2');
        if (titleEl) titleEl.textContent = 'MAXIMUM CELESTIAL RESONANCE!!';
        if (subEl) subEl.innerHTML = 'The pack is trembling with Mythic energy! Click <b>1 final time</b> to RIP IT OPEN!';
      } else if (st.chargeClicks >= 3) {
        // RIP OPEN THE FOIL PACK!
        st.isRipping = true;
        if (window.sounds?.playPackRip) window.sounds.playPackRip();
        wrapper?.classList.remove('charge-shake-1', 'charge-shake-2');
        wrapper?.classList.add('ripping');

        const flashBang = document.getElementById('pack-flash-bang');
        if (flashBang) {
          flashBang.classList.remove('hidden');
        }

        // Consume 1 Unopened Booster Pack from Inventory right as the seal is broken!
        const idx = this.inventory.findIndex(i => i.id === st.packItemId);
        if (idx !== -1) {
          this.inventory[idx].qty -= 1;
          if (this.inventory[idx].qty <= 0) {
            this.inventory.splice(idx, 1);
          }
          this.saveWorldData(this.draftAppearance);
        }

        setTimeout(() => {
          this.dealFiveFaceDownCards();
        }, 560);
      }
    }

    dealFiveFaceDownCards() {
      const st = this.packOpeningState;
      if (!st) return;
      st.cardsDealt = true;

      const sealedZone = document.getElementById('pack-sealed-zone');
      const cardsRow = document.getElementById('pack-cards-reveal-row');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const revealAllBtn = document.getElementById('btn-pack-reveal-all');

      sealedZone?.classList.add('hidden');
      if (titleEl) titleEl.textContent = '5 MYTHOS CARDS PULLED!';
      if (subEl) {
        subEl.innerHTML = 'Hover over each card to feel its <b>Rarity Aura</b> (Blue = Rare, Gold = 4★ Mythic) — Click each card to flip and reveal!';
      }

      if (!cardsRow) return;
      cardsRow.innerHTML = '';
      cardsRow.classList.remove('hidden');
      revealAllBtn?.classList.remove('hidden');

      st.pulledCards.forEach((card, idx) => {
        const slot = document.createElement('div');
        slot.className = `pack-card-slot rarity-${card.rarity}`;
        slot.style.animationDelay = `${idx * 0.11}s`;

        slot.innerHTML = `
          <div class="pack-card-inner">
            <!-- Face-Down Back using Cleaned Mythos_Card_Back.png -->
            <div class="pack-card-face pack-card-back">
              <img src="Cards/Mythos_Card_Back.png" alt="Mythos Card Back">
              <div class="pack-card-back-prompt">✨ CLICK TO REVEAL</div>
            </div>
            <!-- Face-Up Revealed Beast Card -->
            <div class="pack-card-face pack-card-front">
              <span class="pack-card-rarity-banner ${card.rarity}">${card.rarityLabel}</span>
              <img src="${card.cardImg}" alt="${card.name}">
              <div class="pack-card-holo-glint"></div>
            </div>
          </div>
        `;

        slot.addEventListener('click', () => {
          this.flipPackCard(idx, slot);
        });

        cardsRow.appendChild(slot);
      });
    }

    flipPackCard(idx, slotEl) {
      const st = this.packOpeningState;
      if (!st || !st.cardsDealt || st.flippedIndices.has(idx)) return;

      st.flippedIndices.add(idx);
      const card = st.pulledCards[idx];
      slotEl.classList.add('flipped');

      const isMythic = card.rarity === 'mythic';
      if (window.sounds?.playCardFlipReveal) {
        window.sounds.playCardFlipReveal(isMythic);
      }

      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      if (titleEl) {
        titleEl.textContent = isMythic
          ? `🔥 MYTHIC PULL: ${card.shortName.toUpperCase()} (${card.stars}★)!!`
          : `✨ REVEALED: ${card.shortName.toUpperCase()} (${card.stars}★)!`;
      }
      if (subEl) {
        subEl.innerHTML = card.desc;
      }

      // Check if all 5 cards have now been flipped!
      if (st.flippedIndices.size >= st.pulledCards.length) {
        const revealAllBtn = document.getElementById('btn-pack-reveal-all');
        const collectBtn = document.getElementById('btn-pack-collect');
        revealAllBtn?.classList.add('hidden');
        collectBtn?.classList.remove('hidden');
      }
    }

    revealAllRemainingPackCards() {
      const st = this.packOpeningState;
      if (!st || !st.cardsDealt) return;
      const slots = document.querySelectorAll('#pack-cards-reveal-row .pack-card-slot');
      slots.forEach((slotEl, idx) => {
        if (!st.flippedIndices.has(idx)) {
          setTimeout(() => {
            this.flipPackCard(idx, slotEl);
          }, idx * 160);
        }
      });
    }

    collectPulledCardsToInventory() {
      const st = this.packOpeningState;
      if (!st || st.collected) return;
      st.collected = true;

      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      }

      // Add each of the 5 pulled Mythos Cards directly into the Player's Inventory!
      st.pulledCards.forEach(card => {
        this.addInventoryItem({
          id: card.id,
          name: card.name,
          qty: 1,
          icon: '🃏',
          cardImg: card.cardImg,
          rarity: card.rarity,
          type: 'mythos_card',
          desc: card.desc
        });
      });

      const modal = document.getElementById('pack-opening-modal');
      modal?.classList.add('hidden');

      // Open the Inventory Modal so the player immediately sees their newly collected cards in their Backpack!
      this.toggleInventoryModal(true);
      this.renderDialogueUI();
    }

    // -------------------------------------------------------------------------
    // Opening Cutscene & Story Progression (TV -> Excited -> Mom Enters -> Booster Money)
    // -------------------------------------------------------------------------
    startOpeningCutscene(rollNewFriend = false) {
      this.currentArea = 'interior';
      if (rollNewFriend) {
        this.friendName = Math.random() < 0.5 ? 'Mike' : 'AJ';
      }

      this.gold = 0;
      this.hasMomBoosterMoney = false;
      this.hasBoughtCardShopPacks = false;
      this.inventory = [];
      this.selectedInventoryItemId = null;
      this.npcs = [this.createFriendNpc(this.friendName)];
      this.saveWorldData(this.draftAppearance);
      this.renderInventoryModal();

      this.storyState = 'intro_bored';
      this.tvOn = false;
      this.tvFlashTicks = 0;
      this.shakeTicks = 0;
      this.excitedBounceTicks = 0;

      // Position Player and Mike/AJ around the round wooden table on the right side of the room
      this.player.x = 8.6;
      this.player.y = 6.7;
      this.player.dir = 'right';
      this.player.targetX = null;
      this.player.targetY = null;

      const friend = this.npcs[0];
      friend.x = 11.7;
      friend.y = 6.7;
      friend.dir = 'left';
      friend.bubble = '😩';

      this.updateHUDSaveInfo();
      this.renderDialogueUI();
    }

    handlePlayerResponse(choiceIdx) {
      if (this.storyState !== 'intro_bored') return;

      // All 3 responses cause the TV to loudly turn on with the Mythos commercial!
      this.storyState = 'tv_commercial';
      this.tvOn = true;
      this.tvFlashTicks = 35;
      this.shakeTicks = 28;

      if (window.sounds?.playTvCommercial) {
        window.sounds.playTvCommercial();
      }

      // Both turn toward the wooden TV armoire on the north wall!
      this.player.dir = 'up';
      this.npcs[0].dir = 'up';
      this.npcs[0].bubble = '‼️';

      this.renderDialogueUI();
    }

    advanceStoryStep() {
      if (window.sounds?.playClick) window.sounds.playClick();

      if (this.storyState === 'tv_commercial') {
        // Both Player and Mike/AJ get super excited after the commercial!
        this.storyState = 'both_excited';
        this.excitedBounceTicks = 120;
        this.player.dir = 'right';
        this.npcs[0].dir = 'left';
        this.npcs[0].bubble = '🤩';
        this.renderDialogueUI();
      } else if (this.storyState === 'both_excited') {
        // Player's Mother enters the house through the bottom doorstep from work!
        if (window.sounds?.playMove) window.sounds.playMove();
        this.storyState = 'mom_enters';
        const mom = this.createMomNpc();
        this.npcs = [this.npcs[0], mom];
        this.player.dir = 'down';
        this.npcs[0].dir = 'down';
        this.npcs[0].bubble = '👋';
        this.renderDialogueUI();
      } else if (this.storyState === 'mom_enters') {
        this.storyState = 'free_roam';
        const mom = this.npcs.find(n => n.id === 'mom');
        if (mom) {
          mom.dir = 'right';
          mom.bubble = '💬';
        }
        this.npcs[0].dir = 'left';
        this.npcs[0].bubble = '🤩';
        this.renderDialogueUI();
      } else if (this.storyState === 'mom_gave_money') {
        this.storyState = 'free_roam';
        this.renderDialogueUI();
      } else if (this.storyState === 'shop_bought_packs') {
        this.storyState = 'free_roam';
        this.renderDialogueUI();
      }
    }

    buyTwoBoosterPacks() {
      if (this.hasBoughtCardShopPacks) return;
      if ((this.gold || 0) < 20) {
        if (window.sounds?.playClick) window.sounds.playClick();
        return;
      }

      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.gold = Math.max(0, (this.gold || 0) - 20);
      this.hasBoughtCardShopPacks = true;
      this.storyState = 'shop_bought_packs';

      // Add 1 Unopened Mythos Base Set Booster Pack to your Inventory (the 2nd pack goes to Mike/AJ!)
      this.addInventoryItem({
        id: 'unopened_base_pack',
        name: 'Unopened Mythos Base Card Pack',
        qty: 1,
        icon: '🃏',
        cardImg: 'Cards/Mythos_Card_Back.png',
        type: 'booster_pack',
        desc: `<b>Unopened Mythos Base Set Booster Pack (1st Edition)</b> — A factory-sealed foil booster pack featuring the celestial Ouroboros seal and <b>5 Mythos Game Cards</b> inside. Click <b>✨ Open Booster Pack</b> below to break the seal! <i>(Purchased at the Card Shop with ${this.friendName}, who got the other pack!)</i>`
      });

      if (this.shopkeeperNpc) {
        this.shopkeeperNpc.bubble = '🎉';
      }
      if (this.npcs[0]) {
        this.npcs[0].bubble = '🤩';
      }

      this.saveWorldData(this.draftAppearance);
      this.renderDialogueUI();
    }

    askMomForBoosterMoney() {
      if (this.hasMomBoosterMoney) return;
      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.hasMomBoosterMoney = true;
      this.gold = (this.gold || 0) + 20; // $20 added to player inventory!
      this.storyState = 'mom_gave_money';

      const mom = this.npcs.find(n => n.id === 'mom');
      if (mom) {
        mom.bubble = '💝';
      }
      // Mike/AJ is now ready to follow you as you leave the house!
      this.npcs[0].following = true;
      this.npcs[0].bubble = '🔥';

      this.saveWorldData(this.draftAppearance);
      this.renderDialogueUI();
    }

    renderDialogueUI() {
      const bar = document.getElementById('ow-dialog-bar');
      const speakerEl = document.getElementById('ow-speaker-tag');
      const textEl = document.getElementById('ow-dialog-text');
      const choicesEl = document.getElementById('ow-choices-container');
      const nextBtn = document.getElementById('ow-btn-next');
      const challengeBtn = document.getElementById('ow-btn-challenge');

      if (!bar || !speakerEl || !textEl || !choicesEl || !nextBtn || !challengeBtn) return;

      const friendName = this.npcs[0].name;
      const playerName = this.draftAppearance?.name || 'Asher';

      if (this.storyState === 'intro_bored') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = friendName.toUpperCase();
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.textContent = `"It's only day 2 of summer and we are already bored!"`;

        const responses = [
          '1. "Tell me about it... we\'ve already done everything in town."',
          '2. "Seriously! Two whole months of summer left and nothing to do."',
          '3. "Wait, did you hear that static? Something\'s up with the TV..."'
        ];
        choicesEl.innerHTML = '';
        responses.forEach((respText, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ow-choice-btn';
          btn.textContent = respText;
          btn.addEventListener('click', () => this.handlePlayerResponse(idx));
          choicesEl.appendChild(btn);
        });
        choicesEl.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'tv_commercial') {
        bar.classList.remove('hidden');
        bar.classList.add('tv-broadcast');
        speakerEl.textContent = '📺 TV COMMERCIAL (LOUD!!)';
        speakerEl.className = 'ow-speaker-tag tv';
        textEl.innerHTML = `<b>⚡ BZZZT—CRACKLE!!</b> The TV on the wooden armoire blasts on at max volume!<br><i>"TIRED OF A BORING SUMMER?! Rip open Booster Packs, discover legendary Beasts, and conquer the tabletop in <b>MYTHOS</b> — in card stores TODAY!"</i>`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Continue ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'both_excited') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `${playerName.toUpperCase()} & ${friendName.toUpperCase()} (EXCITED!!)`;
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.innerHTML = `<b>${friendName}:</b> "NO WAY!! Did you see those Beasts?! <b>MYTHOS</b> looks incredible — we HAVE to get Booster Packs right now!"<br><b>${playerName}:</b> "Totally!! If we can get enough money for <b>2 Booster Packs</b> at the Card Store, we can both build a deck!"`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Hear Front Door Open ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'mom_enters') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = '💼 MOM (HOME FROM WORK)';
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.innerHTML = `<i>*Click—creak!*</i> Your mother steps inside from work and sets down her bag.<br><b>Mom:</b> "Phew, what a busy shift! Hey ${playerName}, hi ${friendName} — I could hear the TV all the way from the porch! What are you two so hyped about?"`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Walk Over & Talk to Mom ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'mom_gave_money') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = '💝 MOM (+$20 ADDED TO INVENTORY)';
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.innerHTML = `<b>Mom:</b> "Two <b>MYTHOS Booster Packs</b> so you and ${friendName} can play together? Better than being bored on Day 2 of summer! Here's <b>$20</b> — head down the road to the Card Store and pick out your packs!"`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Awesome, Thanks Mom! ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'shop_bought_packs') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `🃏 SHOPKEEPER LEO & ${friendName.toUpperCase()} (PACKS ACQUIRED!!)`;
        speakerEl.className = 'ow-speaker-tag tv';
        textEl.innerHTML = `<b>Shopkeeper Leo:</b> "Two <b>1st-Edition MYTHOS Base Set Booster Packs</b> coming right up! One for you, ${playerName}, and one for ${friendName}! May you both pull legendary Beasts!"<br><b>🎒 Inventory Updated:</b> <b>1× Unopened Mythos Base Card Pack</b> added to your Backpack (press <b>I</b> or click <b>🎒 Inventory</b> to inspect)!`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Awesome!! Check Backpack (I) ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else {
        this.updateFreeRoamPrompt();
      }
    }

    updateFreeRoamPrompt() {
      if (this.storyState !== 'free_roam') return;
      const bar = document.getElementById('ow-dialog-bar');
      const speakerEl = document.getElementById('ow-speaker-tag');
      const textEl = document.getElementById('ow-dialog-text');
      const choicesEl = document.getElementById('ow-choices-container');
      const nextBtn = document.getElementById('ow-btn-next');
      const challengeBtn = document.getElementById('ow-btn-challenge');
      if (!bar) return;

      choicesEl?.classList.add('hidden');
      nextBtn?.classList.add('hidden');

      if (this.currentArea === 'interior') {
        const friend = this.npcs[0];
        const mom = this.npcs.find(n => n.id === 'mom');
        const distToMom = mom ? Math.hypot(this.player.x - mom.x, this.player.y - mom.y) : 999;
        const distToFriend = Math.hypot(this.player.x - friend.x, this.player.y - friend.y);
        const distToTv = Math.hypot(this.player.x - 7.3, this.player.y - 4.3);

        if (mom && distToMom < 1.85) {
          this.nearInteractable = mom;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '💼 MOM';
          speakerEl.className = 'ow-speaker-tag friend';
          if (!this.hasMomBoosterMoney) {
            textEl.textContent = `"Hey sweetheart! You and ${friend.name} look like you're about to burst with excitement. Did you want to ask me something?"`;
            challengeBtn.textContent = '💵 Ask Mom for 2 Booster Packs ($20)';
            challengeBtn.classList.remove('hidden');
          } else {
            textEl.textContent = `"Have fun at the Card Store down the road! Make sure you and ${friend.name} each get a MYTHOS Booster Pack with that $20!"`;
            challengeBtn.classList.add('hidden');
          }
        } else if (distToFriend < 1.8) {
          this.nearInteractable = friend;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = friend.name.toUpperCase();
          speakerEl.className = 'ow-speaker-tag friend';
          if (!this.hasMomBoosterMoney) {
            textEl.textContent = `"Dude, your Mom just got home from work! Go ask her if we can get enough money to buy 2 MYTHOS Booster Packs at the Card Store!"`;
          } else {
            textEl.textContent = `"YES!! Your Mom gave us $20 for 2 Booster Packs! Let's head out the front door, walk south, and follow the road east to the Card Store!"`;
          }
          challengeBtn.classList.add('hidden');
        } else if (distToTv < 1.6) {
          this.nearInteractable = { id: 'tv', name: 'TV' };
          bar.classList.remove('hidden');
          bar.classList.add('tv-broadcast');
          speakerEl.textContent = '📺 LIVING ROOM TV';
          speakerEl.className = 'ow-speaker-tag tv';
          textEl.innerHTML = `<i>"🔥 MYTHOS BOOSTER PACKS: Just $10 a pack at your local Card Store! Collect Phoenix, Earth Golem, Hydra, Werewolf & more!"</i>`;
          challengeBtn.classList.add('hidden');
        } else {
          this.nearInteractable = null;
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'card_shop_interior') {
        const fName = this.friendName || 'Mike';
        const pName = this.draftAppearance?.name || 'Asher';
        const keeper = this.shopkeeperNpc;
        // Player can talk to Shopkeeper Leo across the wooden counter (x: 4.5..8.4, y: 4.6..6.5)
        const distToKeeper = keeper ? Math.hypot(this.player.x - keeper.x, this.player.y - (keeper.y + 1.05)) : 999;
        const distToCase = Math.hypot(this.player.x - 11.8, this.player.y - 5.2);
        const distToTable = Math.hypot(this.player.x - 10.6, this.player.y - 7.1);

        if (distToKeeper < 1.9) {
          this.nearInteractable = { id: 'shopkeeper', name: 'Shopkeeper Leo' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '🃏 SHOPKEEPER LEO (EXCITED!!)';
          speakerEl.className = 'ow-speaker-tag tv';

          if (!this.hasBoughtCardShopPacks) {
            textEl.innerHTML = `"Welcome to the Card Shop, ${pName} and ${fName}!! Have you seen the new <b>MYTHOS</b> game?! It's unbelievable — elemental Beasts, tactical grid movement, and high-impact abilities! Every duelist in town is losing their minds over the Base Set!"`;
            choicesEl.innerHTML = '';
            const buyBtn = document.createElement('button');
            buyBtn.type = 'button';
            buyBtn.className = 'ow-choice-btn';
            if ((this.gold || 0) >= 20) {
              buyBtn.innerHTML = `💬 "We saw the commercial! Can we buy <b>2 MYTHOS Base Set Booster Packs ($20)</b> — one for me and one for ${fName}?"`;
              buyBtn.addEventListener('click', () => this.buyTwoBoosterPacks());
            } else {
              buyBtn.innerHTML = `💬 "We want to buy 2 Booster Packs ($20), one for me and one for ${fName}! <i>(Need $20 — ask Mom at home first!)</i>"`;
              buyBtn.addEventListener('click', () => {
                if (window.sounds?.playClick) window.sounds.playClick();
              });
            }
            choicesEl.appendChild(buyBtn);
            choicesEl.classList.remove('hidden');
            challengeBtn.classList.add('hidden');
          } else {
            const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
            if (hasUnopenedPack) {
              textEl.innerHTML = `"I still can't get over how awesome <b>MYTHOS</b> is! You and ${fName} each have your own <b>Unopened Base Set Booster Pack</b> — open your <b>🎒 Inventory (I)</b> or click below to rip yours open right now!"`;
              challengeBtn.textContent = '✨ Rip Open Booster Pack!';
            } else {
              textEl.innerHTML = `"Whoa, those 5 <b>MYTHOS Base Set Cards</b> you pulled from your Booster Pack are incredible!! Check your <b>🎒 Inventory (I)</b> anytime to inspect your cards!"`;
              challengeBtn.textContent = '🎒 Open Inventory (I)';
            }
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToCase < 1.55) {
          this.nearInteractable = { id: 'booster_display', name: 'Booster Pack Display Shelf' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '✨ 1ST-EDITION MYTHOS DISPLAY RACK';
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `Rows of gleaming foil <b>MYTHOS Base Set Booster Packs</b> ($10 each) and collector starter boxes line the carved wooden shelves.`;
          challengeBtn.classList.add('hidden');
        } else if (distToTable < 1.55) {
          this.nearInteractable = { id: 'duel_table', name: 'In-Store Duel Table' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '⚔️ IN-STORE MYTHOS DUEL TABLE';
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>${fName}:</b> "${this.hasBoughtCardShopPacks ? 'Whoa, they have an official Mythos tabletop mat set up right here in the shop!' : 'Look at this tabletop mat! Let\'s talk to the Shopkeeper at the counter and grab our 2 Booster Packs first!'}"`;
          challengeBtn.classList.add('hidden');
        } else {
          this.nearInteractable = null;
          bar.classList.add('hidden');
        }
      } else {
        // Exterior Neighborhood & Far-East Block Card Shop Avenue Prompt (Zoomed-out view)
        const pName = this.draftAppearance?.name || 'Asher';
        const fName = this.friendName || 'Mike';
        const wName = this.draftAppearance?.worldName || 'Oakhaven';

        const distFriendMailbox = Math.hypot(this.player.x - 8.15, this.player.y - 3.95);
        const distPlayerMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 3.95);
        const distFriendDoor = Math.hypot(this.player.x - 10.05, this.player.y - 2.95);
        const distRoadSign = Math.hypot(this.player.x - 7.35, this.player.y - 5.45);
        const distEastSign = Math.hypot(this.player.x - 10.65, this.player.y - 9.25);
        const distCardShopDoor = Math.hypot(this.player.x - 13.65, this.player.y - 9.25);

        if (distCardShopDoor < 1.15) {
          this.nearInteractable = { id: 'card_shop', name: 'Mythos Card Shop' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🃏 ${wName.toUpperCase()} CARD SHOP — "MYTHOS EMPORIUM"`;
          speakerEl.className = 'ow-speaker-tag tv';
          textEl.innerHTML = `<b>${fName}:</b> "We made it to the Card Shop on the far east block!! Walk right up through the front doors to head inside!"`;
          challengeBtn.classList.add('hidden');
        } else if (distEastSign < 1.0) {
          this.nearInteractable = { id: 'east_sign', name: 'East Block Sign' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🪧 EAST MARKET BLOCK`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West:</b> ${wName} Connector Ave &nbsp;|&nbsp; <b>► East Block:</b> MYTHOS Card Shop`;
          challengeBtn.classList.add('hidden');
        } else if (distFriendMailbox < 1.0) {
          this.nearInteractable = { id: 'friend_mailbox', name: `${fName}'s Mailbox` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 104 ${wName.toUpperCase()} LANE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"${fName}'s House"</b> — Hand-painted on the wooden post. Inside is a flyer for the <b>MYTHOS Summer Launch Event</b>!`;
          challengeBtn.classList.add('hidden');
        } else if (distPlayerMailbox < 1.0) {
          this.nearInteractable = { id: 'player_mailbox', name: `${pName}'s Mailbox` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 102 ${wName.toUpperCase()} LANE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"${pName}'s House"</b> — Your family mailbox. No new mail since morning.`;
          challengeBtn.classList.add('hidden');
        } else if (distFriendDoor < 0.95) {
          this.nearInteractable = { id: 'friend_door', name: `${fName}'s Front Door` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 ${fName.toUpperCase()}'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.textContent = `${fName}: "We don't need anything from my house right now — let's follow the road south and walk two blocks east to the Card Shop!"`;
          challengeBtn.classList.add('hidden');
        } else if (distRoadSign < 1.05) {
          this.nearInteractable = { id: 'road_sign', name: 'Crossroads Sign' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🪧 ${wName.toUpperCase()} CROSSROADS`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West / East ►:</b> ${wName} Residential Lane &nbsp;|&nbsp; <b>▼ South to East Market Block:</b> MYTHOS Card Shop`;
          challengeBtn.classList.add('hidden');
        } else {
          this.nearInteractable = null;
          bar.classList.add('hidden');
        }
      }
    }

    // -------------------------------------------------------------------------
    // World Save & Character Creator System
    // -------------------------------------------------------------------------
    loadSaveData() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    saveWorldData(appearance) {
      const saveObj = {
        worldName: appearance.worldName || 'Oakhaven',
        playerAppearance: { ...appearance },
        friendName: this.friendName,
        gold: this.gold ?? 0,
        hasMomBoosterMoney: this.hasMomBoosterMoney ?? false,
        hasBoughtCardShopPacks: this.hasBoughtCardShopPacks ?? false,
        inventory: Array.isArray(this.inventory) ? [...this.inventory] : [],
        wins: this.worldSave?.wins ?? 0,
        updatedAt: new Date().toLocaleDateString()
      };
      this.worldSave = saveObj;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveObj));
      } catch (e) {
        // Ignore storage errors
      }
      this.updateHUDSaveInfo();
    }

    updateHUDSaveInfo() {
      const locPill = document.getElementById('ow-location-pill');
      const badgeEl = document.getElementById('inv-badge-count');
      if (badgeEl) {
        badgeEl.textContent = String(this.getTotalInventoryCount());
      }
      if (locPill) {
        const pName = this.draftAppearance?.name || 'Asher';
        const wName = this.draftAppearance?.worldName || 'Oakhaven';
        let areaLabel = `🌲 ${wName}`;
        if (this.currentArea === 'interior') {
          areaLabel = `🏠 ${pName}'s House`;
        } else if (this.currentArea === 'card_shop_interior') {
          areaLabel = `🃏 ${wName} Card Shop`;
        }
        const packCount = (this.inventory || [])
          .filter(i => i.type === 'booster_pack')
          .reduce((s, i) => s + (i.qty || 0), 0);
        const cardCount = (this.inventory || [])
          .filter(i => i.type === 'mythos_card')
          .reduce((s, i) => s + (i.qty || 0), 0);
        const packSummary = packCount > 0 ? ` • 📦 ${packCount} Pack${packCount > 1 ? 's' : ''}` : '';
        const cardSummary = cardCount > 0 ? ` • 🃏 ${cardCount} Card${cardCount > 1 ? 's' : ''}` : '';
        locPill.textContent = `${areaLabel} • Friend: ${this.friendName} • 🎒 $${this.gold || 0}${packSummary}${cardSummary}`;
      }
    }

    initIntroAndCreatorUI() {
      const introModal = document.getElementById('intro-modal');
      const continueBtn = document.getElementById('btn-continue-world');
      const newWorldBtn = document.getElementById('btn-new-world');

      this.refreshIntroScreen();

      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          if (!this.worldSave) return;
          if (window.sounds?.playClick) window.sounds.playClick();
          this.draftAppearance = { ...this.worldSave.playerAppearance };
          this.friendName = this.worldSave.friendName || (Math.random() < 0.5 ? 'Mike' : 'AJ');
          this.playerSprite.setAppearance(this.draftAppearance);
          this.npcs[0] = this.createFriendNpc(this.friendName);
          introModal?.classList.add('hidden');
          this.active = true;
          this.startOpeningCutscene(false);
        });
      }

      if (newWorldBtn) {
        newWorldBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          introModal?.classList.add('hidden');
          this.openCharacterCreator(true);
        });
      }

      const editCharBtn = document.getElementById('btn-open-creator');
      if (editCharBtn) {
        editCharBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.openCharacterCreator(false);
        });
      }

      const replayBtn = document.getElementById('btn-replay-intro');
      if (replayBtn) {
        replayBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.startOpeningCutscene(true);
        });
      }

      const openInvBtn = document.getElementById('btn-open-inventory');
      if (openInvBtn) {
        openInvBtn.addEventListener('click', () => this.toggleInventoryModal(true));
      }

      const closeInvBtn = document.getElementById('btn-close-inventory');
      if (closeInvBtn) {
        closeInvBtn.addEventListener('click', () => this.toggleInventoryModal(false));
      }

      const sealedBoosterEl = document.getElementById('sealed-booster-wrapper');
      if (sealedBoosterEl) {
        sealedBoosterEl.addEventListener('click', () => this.handleSealedPackClick());
      }

      const revealAllBtn = document.getElementById('btn-pack-reveal-all');
      if (revealAllBtn) {
        revealAllBtn.addEventListener('click', () => this.revealAllRemainingPackCards());
      }

      const collectCardsBtn = document.getElementById('btn-pack-collect');
      if (collectCardsBtn) {
        collectCardsBtn.addEventListener('click', () => this.collectPulledCardsToInventory());
      }

      this.renderInventoryModal();
      this.buildCreatorControls();
    }

    refreshIntroScreen() {
      const continueCard = document.getElementById('continue-world-card');
      const continueMeta = document.getElementById('continue-world-meta');
      const thumbCanvas = document.getElementById('continue-avatar-canvas');

      if (this.worldSave && continueCard) {
        continueCard.classList.remove('hidden');
        const app = this.worldSave.playerAppearance;
        const fName = this.worldSave.friendName || 'Mike';
        if (continueMeta) {
          continueMeta.innerHTML = `
            <div class="save-slot-title">${app.name} — ${this.worldSave.worldName}</div>
            <div class="save-slot-sub">Friend: ${fName} • Day 2 of Summer</div>
          `;
        }
        if (thumbCanvas) {
          const tctx = thumbCanvas.getContext('2d');
          tctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
          const tempSheet = new window.MythosCharacterSprites.CharacterSpriteSheet(app);
          tempSheet.draw(tctx, thumbCanvas.width / 2, thumbCanvas.height - 4, 'down', 0, 2);
        }
      } else if (continueCard) {
        continueCard.classList.add('hidden');
      }
    }

    openCharacterCreator(isNewWorld = false) {
      this.active = false;
      this.isCreatingNewWorld = isNewWorld;
      const modal = document.getElementById('creator-modal');
      if (!modal) return;
      modal.classList.remove('hidden');

      const nameInput = document.getElementById('cc-player-name');
      const worldInput = document.getElementById('cc-world-name');
      if (nameInput) nameInput.value = this.draftAppearance.name || 'Asher';
      if (worldInput) worldInput.value = this.draftAppearance.worldName || 'Oakhaven';

      this.syncCreatorUI();
    }

    buildCreatorControls() {
      const CS = window.MythosCharacterSprites;

      const makeColorSwatches = (containerId, list, key, colorProp) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '';
        list.forEach(item => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cc-swatch-btn';
          btn.dataset.key = key;
          btn.dataset.val = item.id;
          btn.title = item.name;
          btn.style.backgroundColor = item[colorProp];
          btn.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.draftAppearance[key] = item.id;
            this.playerSprite.setAppearance(this.draftAppearance);
            this.syncCreatorUI();
          });
          el.appendChild(btn);
        });
      };

      const makePillButtons = (containerId, list, key) => {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '';
        list.forEach(item => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cc-pill-btn';
          btn.dataset.key = key;
          btn.dataset.val = item.id;
          btn.textContent = item.name;
          btn.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.draftAppearance[key] = item.id;
            this.playerSprite.setAppearance(this.draftAppearance);
            this.syncCreatorUI();
          });
          el.appendChild(btn);
        });
      };

      makeColorSwatches('cc-skin-swatches', CS.SKIN_TONES, 'skin', 'base');
      makePillButtons('cc-hair-styles', CS.HAIR_STYLES, 'hairStyle');
      makeColorSwatches('cc-hair-colors', CS.HAIR_COLORS, 'hairColor', 'base');
      makeColorSwatches('cc-eye-colors', CS.EYE_COLORS, 'eyeColor', 'base');
      makePillButtons('cc-outfit-styles', CS.OUTFIT_STYLES, 'outfitStyle');
      makeColorSwatches('cc-outfit-colors', CS.OUTFIT_COLORS, 'outfitColor', 'base');
      makeColorSwatches('cc-pants-colors', CS.PANTS_COLORS, 'pantsColor', 'base');
      makePillButtons('cc-hat-styles', CS.HAT_STYLES, 'hatStyle');

      document.querySelectorAll('.cc-dir-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.creatorDir = btn.dataset.dir;
          document.querySelectorAll('.cc-dir-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
      });

      const walkChk = document.getElementById('cc-toggle-walk');
      if (walkChk) {
        walkChk.addEventListener('change', (e) => {
          this.creatorWalking = e.target.checked;
        });
      }

      const randBtn = document.getElementById('btn-cc-random');
      if (randBtn) {
        randBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const pick = arr => arr[Math.floor(Math.random() * arr.length)].id;
          this.draftAppearance.skin = pick(CS.SKIN_TONES);
          this.draftAppearance.hairStyle = pick(CS.HAIR_STYLES);
          this.draftAppearance.hairColor = pick(CS.HAIR_COLORS);
          this.draftAppearance.eyeColor = pick(CS.EYE_COLORS);
          this.draftAppearance.outfitStyle = pick(CS.OUTFIT_STYLES);
          this.draftAppearance.outfitColor = pick(CS.OUTFIT_COLORS);
          this.draftAppearance.pantsColor = pick(CS.PANTS_COLORS);
          this.draftAppearance.hatStyle = pick(CS.HAT_STYLES);
          this.playerSprite.setAppearance(this.draftAppearance);
          this.syncCreatorUI();
        });
      }

      const backBtn = document.getElementById('btn-cc-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          document.getElementById('creator-modal')?.classList.add('hidden');
          this.refreshIntroScreen();
          document.getElementById('intro-modal')?.classList.remove('hidden');
        });
      }

      const startWorldBtn = document.getElementById('btn-cc-start');
      if (startWorldBtn) {
        startWorldBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const nameInput = document.getElementById('cc-player-name');
          const worldInput = document.getElementById('cc-world-name');
          this.draftAppearance.name = (nameInput?.value || 'Asher').trim() || 'Asher';
          this.draftAppearance.worldName = (worldInput?.value || 'Oakhaven').trim() || 'Oakhaven';
          this.playerSprite.setAppearance(this.draftAppearance);

          if (this.isCreatingNewWorld || !this.worldSave) {
            this.friendName = Math.random() < 0.5 ? 'Mike' : 'AJ';
            this.npcs[0] = this.createFriendNpc(this.friendName);
          }

          this.saveWorldData(this.draftAppearance);
          document.getElementById('creator-modal')?.classList.add('hidden');
          this.active = true;
          this.startOpeningCutscene(false);
        });
      }
    }

    syncCreatorUI() {
      document.querySelectorAll('.cc-swatch-btn, .cc-pill-btn').forEach(btn => {
        const k = btn.dataset.key;
        const v = btn.dataset.val;
        btn.classList.toggle('active', this.draftAppearance[k] === v);
      });
    }

    renderCreatorPreview() {
      const modal = document.getElementById('creator-modal');
      if (!modal || modal.classList.contains('hidden')) return;
      const pCanvas = document.getElementById('cc-preview-canvas');
      if (!pCanvas) return;
      const pctx = pCanvas.getContext('2d');
      const W = pCanvas.width;
      const H = pCanvas.height;

      pctx.clearRect(0, 0, W, H);

      const grad = pctx.createRadialGradient(W / 2, H * 0.65, 10, W / 2, H * 0.65, 90);
      grad.addColorStop(0, '#2e3852');
      grad.addColorStop(1, '#0f1420');
      pctx.fillStyle = grad;
      pctx.fillRect(0, 0, W, H);

      pctx.fillStyle = 'rgba(0,0,0,0.45)';
      pctx.beginPath();
      pctx.ellipse(W / 2, H - 24, 42, 14, 0, 0, Math.PI * 2);
      pctx.fill();

      const walkFrame = this.creatorWalking ? (this.tick * 0.06) : 0;
      this.playerSprite.draw(pctx, W / 2, H - 20, this.creatorDir, walkFrame, 4.2);
    }

    // -------------------------------------------------------------------------
    // Input, Collisions & Door Transitions (Interior <-> Craftsman Exterior)
    // -------------------------------------------------------------------------
    hash(x, y, s = 1) {
      const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
      return n - Math.floor(n);
    }

    bindEvents() {
      window.addEventListener('keydown', (e) => {
        if (!this.active) return;
        if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        const k = e.key.toLowerCase();

        // If the theatrical Pack Opening Stage is active, Space/Enter charges the pack or flips/collects cards!
        const packModal = document.getElementById('pack-opening-modal');
        if (packModal && !packModal.classList.contains('hidden')) {
          if (k === ' ' || k === 'enter') {
            e.preventDefault();
            const st = this.packOpeningState;
            if (st && !st.cardsDealt && !st.isRipping) {
              this.handleSealedPackClick();
            } else if (st && st.cardsDealt && st.flippedIndices.size < st.pulledCards.length) {
              this.revealAllRemainingPackCards();
            } else if (st && st.cardsDealt && st.flippedIndices.size >= st.pulledCards.length) {
              this.collectPulledCardsToInventory();
            }
          }
          return;
        }

        if (k === 'i' || k === 'b') {
          e.preventDefault();
          this.toggleInventoryModal();
          return;
        }
        if (k === 'escape') {
          const invModal = document.getElementById('inventory-modal');
          if (invModal && !invModal.classList.contains('hidden')) {
            e.preventDefault();
            this.toggleInventoryModal(false);
            return;
          }
        }

        if (this.storyState === 'intro_bored' && ['1', '2', '3'].includes(k)) {
          e.preventDefault();
          this.handlePlayerResponse(Number(k) - 1);
          return;
        }

        if (['tv_commercial', 'both_excited', 'mom_enters', 'mom_gave_money', 'shop_bought_packs'].includes(this.storyState) && (k === ' ' || k === 'enter')) {
          e.preventDefault();
          this.advanceStoryStep();
          return;
        }

        this.keys[k] = true;

        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
          e.preventDefault();
        }

        if ((k === ' ' || k === 'enter' || k === 'e' || k === '1') && this.storyState === 'free_roam' && this.nearInteractable) {
          e.preventDefault();
          if (this.nearInteractable.id === 'tv') {
            this.storyState = 'tv_commercial';
            this.renderDialogueUI();
          } else if (this.nearInteractable.id === 'mom' && !this.hasMomBoosterMoney) {
            this.askMomForBoosterMoney();
          } else if (this.nearInteractable.id === 'shopkeeper') {
            if (!this.hasBoughtCardShopPacks && (this.gold || 0) >= 20) {
              this.buyTwoBoosterPacks();
            } else if (this.hasBoughtCardShopPacks) {
              this.toggleInventoryModal(true);
            }
          } else if (window.sounds?.playClick) {
            window.sounds.playClick();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });

      this.canvas.addEventListener('click', (e) => {
        if (!this.active) return;
        if (this.storyState !== 'free_roam') return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx = (e.clientX - rect.left) * scaleX;
        const cy = (e.clientY - rect.top) * scaleY;
        const tx = cx / this.TILE;
        const ty = cy / this.TILE;

        const mom = this.npcs.find(n => n.id === 'mom');
        if (this.currentArea === 'interior' && mom && !this.hasMomBoosterMoney && Math.hypot(tx - mom.x, ty - mom.y) < 1.2 && Math.hypot(this.player.x - mom.x, this.player.y - mom.y) < 2.0) {
          this.askMomForBoosterMoney();
          return;
        }

        const keeper = this.shopkeeperNpc;
        if (this.currentArea === 'card_shop_interior' && keeper && !this.hasBoughtCardShopPacks && Math.hypot(tx - keeper.x, ty - keeper.y) < 1.5 && Math.hypot(this.player.x - keeper.x, this.player.y - (keeper.y + 1.05)) < 2.1) {
          if ((this.gold || 0) >= 20) {
            this.buyTwoBoosterPacks();
            return;
          }
        }

        this.player.targetX = tx;
        this.player.targetY = ty;
      });

      const timeSel = document.getElementById('ow-time-select');
      if (timeSel) {
        timeSel.addEventListener('change', (e) => {
          this.settings.timeOfDay = e.target.value;
        });
      }

      const shaderChk = document.getElementById('ow-toggle-shaders');
      if (shaderChk) {
        shaderChk.addEventListener('change', (e) => {
          this.settings.shadersEnabled = e.target.checked;
        });
      }

      const gridChk = document.getElementById('ow-toggle-grid');
      if (gridChk) {
        gridChk.addEventListener('change', (e) => {
          this.settings.showGrid = e.target.checked;
        });
      }

      const nextBtn = document.getElementById('ow-btn-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.advanceStoryStep());
      }

      const challengeBtn = document.getElementById('ow-btn-challenge');
      if (challengeBtn) {
        challengeBtn.addEventListener('click', () => {
          if (this.nearInteractable?.id === 'mom' && !this.hasMomBoosterMoney) {
            this.askMomForBoosterMoney();
          } else if (this.nearInteractable?.id === 'shopkeeper') {
            if (!this.hasBoughtCardShopPacks && (this.gold || 0) >= 20) {
              this.buyTwoBoosterPacks();
            } else {
              const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
              if (hasUnopenedPack) {
                this.startBoosterPackOpening('unopened_base_pack');
              } else {
                this.toggleInventoryModal(true);
              }
            }
          }
        });
      }
    }

    triggerDuel() {
      if (window.sounds?.playClick) window.sounds.playClick();
      this.storyState = 'free_roam';
      this.keys = {};
      this.player.targetX = null;
      this.player.targetY = null;
      if (this.onStartDuel) {
        this.onStartDuel(this.npcs[0]);
      }
    }

    isBlocked(tx, ty) {
      if (this.currentArea === 'interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // Top-left Bed (x: 2.2..4.2, y: 4.1..6.6)
        if (tx < 4.25 && ty < 6.55) return true;
        // Dresser & Wooden TV Armoire along North Wall (x: 4.3..8.3, y: 4.1..4.75)
        if (tx >= 4.2 && tx <= 8.4 && ty < 4.75) return true;
        // Bookcase (x: 11.6..13.8, y: 4.1..4.75)
        if (tx >= 11.5 && ty < 4.75) return true;
        // Round Wooden Table & Chairs (center at x: 10.2, y: 6.6)
        if (Math.hypot(tx - 10.2, ty - 6.6) < 1.15) return true;
        // NPC collision (only Mom blocks movement when Mike/AJ is following you!)
        for (const n of this.npcs) {
          if (n.following) continue;
          if (Math.hypot(tx - n.x, ty - n.y) < 0.65) return true;
        }
        return false;
      } else if (this.currentArea === 'card_shop_interior') {
        // Cutaway Card Shop floor bounds (same cutaway shell as the house interior!)
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // Left Booster Display Shelves & Collector Racks (x: 2.2..4.3, y: 4.15..5.8)
        if (tx < 4.3 && ty < 5.8) return true;
        // Main Shopkeeper Counter & Glass Booster Showcase (x: 4.4..8.4, y: 4.15..5.95)
        if (tx >= 4.4 && tx <= 8.4 && ty < 5.95) return true;
        // Right Single-Card & Starter Box Bookcase (x: 11.4..13.8, y: 4.15..4.85)
        if (tx >= 11.4 && ty < 4.85) return true;
        // Round In-Store Mythos Duel Table & Chairs on Right Floor (center at x: 10.5, y: 6.8)
        if (Math.hypot(tx - 10.5, ty - 6.8) < 1.18) return true;
        return false;
      } else {
        // Wider Zoomed-Out Exterior World Bounds (Cols 0.5..15.5, Rows 0.5..11.6)
        if (tx < 0.5 || tx > 15.5 || ty < 0.5 || ty > 11.6) return true;

        // 1. PLAYER'S COTTAGE (North-West Plot: x = 1.1..4.3, y = 0.45..2.95)
        if (tx >= 1.1 && tx <= 4.3 && ty >= 0.45 && ty <= 2.95) {
          // Right-side open wooden patio deck is walkable (x: 2.85..4.2, y: 2.25..2.95)
          if (tx >= 2.85 && tx <= 4.2 && ty >= 2.25) {
            if (tx >= 3.15 && tx <= 3.85 && ty >= 2.3 && ty <= 2.8) return true;
            return false;
          }
          // Left front door threshold (x: 1.7..2.25, y: 2.4..2.95) -> steps inside!
          if (tx >= 1.7 && tx <= 2.25 && ty >= 2.4) return false;
          return true;
        }
        // Player's front balustrade railing & brick foundation (x: 1.1..4.3, y: 2.95..3.38)
        if (tx >= 1.1 && tx <= 4.3 && ty > 2.95 && ty <= 3.38) {
          if (tx >= 1.65 && tx <= 2.3) return false; // Front wooden steps
          return true;
        }

        // 2. FRIEND'S (MIKE'S / AJ'S) COTTAGE (Upper-Middle Plot: x = 7.7..10.9, y = 0.45..2.95)
        if (tx >= 7.7 && tx <= 10.9 && ty >= 0.45 && ty <= 2.95) {
          // Left-side open wooden patio deck is walkable (x: 7.8..9.15, y: 2.25..2.95)
          if (tx >= 7.8 && tx <= 9.15 && ty >= 2.25) {
            if (tx >= 8.15 && tx <= 8.85 && ty >= 2.3 && ty <= 2.8) return true;
            return false;
          }
          // Right front porch up to Friend's locked front door (x: 9.75..10.3, y: 2.6..2.95)
          if (tx >= 9.75 && tx <= 10.3 && ty >= 2.6) return false;
          return true;
        }
        // Friend's front balustrade railing & brick foundation (x: 7.7..10.9, y: 2.95..3.38)
        if (tx >= 7.7 && tx <= 10.9 && ty > 2.95 && ty <= 3.38) {
          if (tx >= 9.7 && tx <= 10.35) return false;
          return true;
        }

        // 3. MYTHOS CARD SHOP Moved One More Block East on the Lower East-West Road!
        // Footprint: x = 11.8..15.35, y = 5.95..9.25 (Front porch & door at x: 13.25..14.05, y: 8.55..9.35)
        if (tx >= 11.8 && tx <= 15.35 && ty >= 5.95 && ty <= 9.25) {
          if (tx >= 13.25 && tx <= 14.05 && ty >= 8.55) return false;
          return true;
        }

        // 4. Mailboxes, Tree Stump, Gazebo Bench & Crossroads Signpost Collisions
        if (Math.hypot(tx - 4.75, ty - 3.95) < 0.28) return true; // Player Mailbox
        if (Math.hypot(tx - 8.15, ty - 3.95) < 0.28) return true; // Mike/AJ Mailbox
        if (Math.hypot(tx - 0.85, ty - 3.65) < 0.30) return true; // Cut Tree Stump
        if (Math.hypot(tx - 7.35, ty - 5.45) < 0.28) return true; // Upper Intersection Signpost
        if (Math.hypot(tx - 10.65, ty - 9.25) < 0.28) return true; // East Market Block Signpost

        return false;
      }
    }

    update() {
      if (!this.active) return;

      if (this.shakeTicks > 0) this.shakeTicks--;
      if (this.tvFlashTicks > 0) this.tvFlashTicks--;
      if (this.excitedBounceTicks > 0) this.excitedBounceTicks--;
      if (this.areaTransitionCooldown > 0) this.areaTransitionCooldown--;

      // Animate scripted NPCs (e.g., Mom walking inside from the front doorstep after work!)
      for (const n of this.npcs) {
        if (n.targetX !== undefined && n.targetX !== null && n.targetY !== undefined && n.targetY !== null) {
          const ndx = n.targetX - n.x;
          const ndy = n.targetY - n.y;
          const dist = Math.hypot(ndx, ndy);
          if (dist > 0.08) {
            const spd = 0.055;
            n.x += (ndx / dist) * spd;
            n.y += (ndy / dist) * spd;
            n.walkTick = (n.walkTick || 0) + 0.16;
            if (Math.abs(ndx) > Math.abs(ndy)) {
              n.dir = ndx > 0 ? 'right' : 'left';
            } else {
              n.dir = ndy > 0 ? 'down' : 'up';
            }
          } else {
            n.x = n.targetX;
            n.y = n.targetY;
            n.targetX = null;
            n.targetY = null;
            n.walkTick = 0;
            n.dir = 'right';
          }
        }
      }

      if (['intro_bored', 'tv_commercial', 'both_excited', 'mom_enters', 'mom_gave_money', 'shop_bought_packs'].includes(this.storyState)) {
        this.player.moving = false;
        this.player.walkTick = (this.storyState === 'both_excited' || this.storyState === 'shop_bought_packs') ? (this.tick * 0.25) : 0;
        if (this.npcs[0]) {
          this.npcs[0].walkTick = (this.storyState === 'both_excited' || this.storyState === 'shop_bought_packs') ? (this.tick * 0.25) : 0;
        }
        return;
      }

      let dx = 0;
      let dy = 0;

      if (this.keys['w'] || this.keys['arrowup']) { dy = -1; this.player.dir = 'up'; this.player.targetX = null; }
      else if (this.keys['s'] || this.keys['arrowdown']) { dy = -1 * -1; this.player.dir = 'down'; this.player.targetX = null; }
      else if (this.keys['a'] || this.keys['arrowleft']) { dx = -1; this.player.dir = 'left'; this.player.targetX = null; }
      else if (this.keys['d'] || this.keys['arrowright']) { dx = 1; this.player.dir = 'right'; this.player.targetX = null; }
      else if (this.player.targetX !== null && this.player.targetY !== null) {
        const diffX = this.player.targetX - this.player.x;
        const diffY = this.player.targetY - this.player.y;
        if (Math.hypot(diffX, diffY) > 0.15) {
          if (Math.abs(diffX) > Math.abs(diffY)) {
            dx = Math.sign(diffX);
            this.player.dir = dx > 0 ? 'right' : 'left';
          } else {
            dy = Math.sign(diffY);
            this.player.dir = dy > 0 ? 'down' : 'up';
          }
        } else {
          this.player.targetX = null;
          this.player.targetY = null;
        }
      }

      if (dx !== 0 || dy !== 0) {
        this.player.moving = true;
        this.player.walkTick += 0.16;
        const speed = this.currentArea === 'exterior' ? 0.068 : 0.075;
        const nx = this.player.x + dx * speed;
        const ny = this.player.y + dy * speed;
        if (!this.isBlocked(nx, this.player.y)) this.player.x = nx;
        if (!this.isBlocked(this.player.x, ny)) this.player.y = ny;

        // If player walks toward the front door inside, Mike/AJ automatically starts following you out!
        if (this.currentArea === 'interior' && this.player.y > 8.4 && this.npcs[0]) {
          this.npcs[0].following = true;
        }
      } else {
        this.player.moving = false;
        this.player.walkTick = 0;
      }

      // Companion Follow AI: Mike or AJ follows right behind you as you leave the house, explore outside, and visit the Card Shop!
      const friend = this.npcs[0];
      if (friend && (friend.following || this.currentArea === 'exterior' || this.currentArea === 'card_shop_interior')) {
        const fdx = this.player.x - friend.x;
        const fdy = this.player.y - friend.y;
        const fdist = Math.hypot(fdx, fdy);
        const followThreshold = this.currentArea === 'exterior' ? 0.78 : 1.25;

        if (fdist > followThreshold) {
          const fSpeed = this.currentArea === 'exterior' ? 0.062 : 0.07;
          friend.x += (fdx / fdist) * fSpeed;
          friend.y += (fdy / fdist) * fSpeed;
          friend.walkTick = (friend.walkTick || 0) + 0.16;
          if (Math.abs(fdx) > Math.abs(fdy)) {
            friend.dir = fdx > 0 ? 'right' : 'left';
          } else {
            friend.dir = fdy > 0 ? 'down' : 'up';
          }
        } else {
          friend.walkTick = 0;
        }
      }

      // Check Doorway Transitions between House Interior, Zoomed-Out Neighborhood Exterior, and Card Shop Interior!
      if (this.areaTransitionCooldown === 0) {
        if (this.currentArea === 'interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out onto your Left Cottage's Front Wooden Porch Steps — Mike/AJ follows you out!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 1.98;
          this.player.y = 3.48;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.following = true;
            friend.x = 1.98;
            friend.y = 3.05;
            friend.dir = 'down';
            friend.bubble = null;
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 1.65 && this.player.x <= 2.3 && this.player.y <= 2.75) {
          // Step back inside your House through the Screen Door — Mike/AJ follows you back in!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'interior';
          this.player.x = 9.8;
          this.player.y = 9.4;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.x = 10.6;
            friend.y = 9.5;
            friend.dir = 'up';
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 13.25 && this.player.x <= 14.05 && this.player.y <= 9.05 && this.player.y >= 8.3) {
          // Step inside the MYTHOS Card Shop on the Far-East Block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'card_shop_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.following = true;
            friend.x = 10.7;
            friend.y = 9.4;
            friend.dir = 'up';
            friend.bubble = '🤩';
          }
          if (this.shopkeeperNpc) {
            this.shopkeeperNpc.bubble = this.hasBoughtCardShopPacks ? '🎉' : '🤩';
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'card_shop_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of the MYTHOS Card Shop back onto the Far-East Block of the South Road!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 13.65;
          this.player.y = 9.45;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.following = true;
            friend.x = 13.65;
            friend.y = 9.05;
            friend.dir = 'down';
            friend.bubble = null;
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        }
      }

      this.updateFreeRoamPrompt();
    }

    // =========================================================================
    // INTERIOR RENDERER (Inspired directly by the Cutaway Room Reference Image)
    // =========================================================================
    renderCutawayInterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;

      // 1. Muted Slate-Blue Cutaway Void Background (#658296)
      ctx.fillStyle = '#658296';
      ctx.fillRect(0, 0, W, H);

      // Room coordinates
      const rx = 1.5 * S;      // 96
      const ry = 0.8 * S;      // 51.2
      const rw = 13.0 * S;     // 832
      const rh = 9.9 * S;      // 633.6
      const floorTop = 3.85 * S; // 246.4

      // 2. Wide-Plank Warm Brown Wood Floor (#876645) with Chamfered Room Polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rx + 42, floorTop - 24);
      ctx.lineTo(rx + rw - 42, floorTop - 24);
      ctx.lineTo(rx + rw, floorTop + 16);
      ctx.lineTo(rx + rw, ry + rh - 24);
      ctx.lineTo(rx + rw - 28, ry + rh);
      ctx.lineTo(rx + 28, ry + rh);
      ctx.lineTo(rx, ry + rh - 24);
      ctx.lineTo(rx, floorTop + 16);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = '#876645';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      // Horizontal wide floorboards + dark plank lines (#4f3923) + subtle wood grain
      const plankH = 38;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#876645' : '#7d5d3e';
        ctx.fillRect(rx, y, rw, plankH);

        // Subtle horizontal wood grain streaks
        ctx.fillStyle = '#6e5034';
        ctx.fillRect(rx + 30, y + 11, rw - 60, 2);
        ctx.fillRect(rx + 80, y + 25, rw - 140, 2);

        // Dark plank bottom seam
        ctx.fillStyle = '#4f3923';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);

        // Staggered vertical plank joints
        const shift = (row * 130) % 240;
        for (let x = rx + 70 + shift; x < rx + rw - 40; x += 240) {
          ctx.fillRect(x, y, 2, plankH);
        }
      }

      // Bottom Wooden Threshold Border
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, ry + rh - 18, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx, ry + rh - 18, rw, 18);

      // 3. Dark Espresso/Charcoal Rug on Left Side with Chamfered Corners (#362f26)
      const rugX = rx + 44;
      const rugY = floorTop + 8;
      const rugW = 310;
      const rugH = 385;
      const ch = 22;

      const drawChamferedRect = (x, y, w, h, c) => {
        ctx.beginPath();
        ctx.moveTo(x + c, y);
        ctx.lineTo(x + w - c, y);
        ctx.lineTo(x + w, y + c);
        ctx.lineTo(x + w, y + h - c);
        ctx.lineTo(x + w - c, y + h);
        ctx.lineTo(x + c, y + h);
        ctx.lineTo(x, y + h - c);
        ctx.lineTo(x, y + c);
        ctx.closePath();
      };

      ctx.fillStyle = '#362f26';
      drawChamferedRect(rugX, rugY, rugW, rugH, ch);
      ctx.fill();
      ctx.strokeStyle = '#241e18';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner lighter brown inset border line (#574c3f)
      ctx.strokeStyle = '#574c3f';
      ctx.lineWidth = 2.5;
      drawChamferedRect(rugX + 10, rugY + 10, rugW - 20, rugH - 20, ch - 4);
      ctx.stroke();

      ctx.restore();

      // 4. Cream Plaster North Wall (#e3e0b6) with Angled Wing Walls & Baseboard
      ctx.fillStyle = '#e3e0b6';
      ctx.beginPath();
      ctx.moveTo(rx + 28, ry + 56);
      ctx.lineTo(rx + 68, ry + 30);
      ctx.lineTo(rx + rw - 68, ry + 30);
      ctx.lineTo(rx + rw - 28, ry + 56);
      ctx.lineTo(rx + rw - 28, floorTop + 14);
      ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.lineTo(rx + 68, floorTop - 12);
      ctx.lineTo(rx + 28, floorTop + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4f3923';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Angled Wing Wall vertical corner lines & baseboard trim
      ctx.strokeStyle = '#aba67c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // Subtle weathered plaster bricks & crack lines on the cream wall (matching reference!)
      ctx.strokeStyle = '#b8b388';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx + 215, ry + 66, 26, 16);
      ctx.beginPath();
      ctx.moveTo(rx + 228, ry + 82); ctx.lineTo(rx + 228, ry + 115);
      ctx.moveTo(rx + 218, ry + 96); ctx.lineTo(rx + 236, ry + 96);
      ctx.stroke();

      // Dark wood baseboard along north wall and wing walls
      ctx.fillStyle = '#6e5034';
      ctx.beginPath();
      ctx.moveTo(rx + 28, floorTop + 2);
      ctx.lineTo(rx + 68, floorTop - 24);
      ctx.lineTo(rx + rw - 68, floorTop - 24);
      ctx.lineTo(rx + rw - 28, floorTop + 2);
      ctx.lineTo(rx + rw - 28, floorTop + 14);
      ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.lineTo(rx + 68, floorTop - 12);
      ctx.lineTo(rx + 28, floorTop + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Thick Wooden Top-Cap Wall Molding & Side Cutaway Pillars (matching reference!)
      ctx.fillStyle = '#78583a';
      ctx.beginPath();
      ctx.moveTo(rx, floorTop + 180);
      ctx.lineTo(rx, ry + 26);
      ctx.lineTo(rx + 36, ry);
      ctx.lineTo(rx + rw - 36, ry);
      ctx.lineTo(rx + rw, ry + 26);
      ctx.lineTo(rx + rw, floorTop + 180);
      ctx.lineTo(rx + rw - 28, floorTop + 180);
      ctx.lineTo(rx + rw - 28, ry + 48);
      ctx.lineTo(rx + rw - 64, ry + 28);
      ctx.lineTo(rx + 64, ry + 28);
      ctx.lineTo(rx + 28, ry + 48);
      ctx.lineTo(rx + 28, floorTop + 180);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lower Cream Plaster Side-Wall Cutaway Pillars (Left & Right bottom walls)
      [rx, rx + rw - 28].forEach(px => {
        ctx.fillStyle = '#e3e0b6';
        ctx.fillRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        ctx.strokeStyle = '#3b2816';
        ctx.strokeRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        // Protruding stone block detail
        ctx.fillStyle = '#ebe8c5';
        ctx.strokeStyle = '#aba67c';
        ctx.fillRect(px + 4, floorTop + 245, 20, 14);
        ctx.strokeRect(px + 4, floorTop + 245, 20, 14);
      });

      // 6. Bottom Stone Doorstep Threshold + Two Dark Post Blocks (exit to Outside!)
      const doorX = 9.3 * S;
      const doorY = ry + rh - 22;
      ctx.fillStyle = '#1c1610';
      ctx.fillRect(doorX - 18, doorY - 6, 18, 20);
      ctx.fillRect(doorX + 86, doorY - 6, 18, 20);
      ctx.fillStyle = '#6c7075';
      ctx.beginPath();
      ctx.roundRect(doorX, doorY + 4, 86, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#2b2d30';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#8b9096';
      ctx.fillRect(doorX + 6, doorY + 8, 74, 10);

      // 7. Furniture Piece 1: Wooden Bed in Top-Left Corner (with white pillow & slate-blue blanket)
      const bedX = rx + 62;
      const bedY = ry + 112;
      const bedW = 104;
      const bedH = 178;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bedX + 4, bedY + 8, bedW, bedH);

      // Headboard & Corner Posts
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.fillRect(bedX, bedY, bedW, 34);
      ctx.strokeRect(bedX, bedY, bedW, 34);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(bedX, bedY - 6, 16, 26);
      ctx.strokeRect(bedX, bedY - 6, 16, 26);
      ctx.fillRect(bedX + bedW - 16, bedY - 6, 16, 26);
      ctx.strokeRect(bedX + bedW - 16, bedY - 6, 16, 26);

      // Mattress & White Pillow (#d8dee3)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bedX + 4, bedY + 26, bedW - 8, 36);
      ctx.strokeRect(bedX + 4, bedY + 26, bedW - 8, 36);
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(bedX + 18, bedY + 16, bedW - 36, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Slate-Blue Blanket (#35566e)
      ctx.fillStyle = '#35566e';
      ctx.fillRect(bedX + 4, bedY + 56, bedW - 8, 92);
      ctx.strokeRect(bedX + 4, bedY + 56, bedW - 8, 92);
      ctx.fillStyle = '#436985';
      ctx.fillRect(bedX + 8, bedY + 60, bedW - 16, 80);

      // Footboard & Lower Posts
      ctx.fillStyle = '#8f6542';
      ctx.fillRect(bedX, bedY + 144, bedW, 34);
      ctx.strokeRect(bedX, bedY + 144, bedW, 34);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(bedX, bedY + 136, 16, 42);
      ctx.strokeRect(bedX, bedY + 136, 16, 42);
      ctx.fillRect(bedX + bedW - 16, bedY + 136, 16, 42);
      ctx.strokeRect(bedX + bedW - 16, bedY + 136, 16, 42);

      // 8. Furniture Piece 2: 4-Drawer Wooden Dresser next to Bed
      const drX = bedX + bedW + 18;
      const drY = ry + 112;
      const drW = 118;
      const drH = 98;
      ctx.fillStyle = '#946a45';
      ctx.fillRect(drX, drY, drW, drH);
      ctx.strokeRect(drX, drY, drW, drH);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(drX - 2, drY, drW + 4, 24);
      ctx.strokeRect(drX - 2, drY, drW + 4, 24);

      // 4 Drawers with silver handles
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const dx = drX + 8 + c * 54;
          const dy = drY + 30 + r * 30;
          ctx.fillStyle = '#825b38';
          ctx.fillRect(dx, dy, 48, 24);
          ctx.strokeRect(dx, dy, 48, 24);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(dx + 16, dy + 10, 16, 3);
        }
      }
      // Small wooden Mythos Deck Box sitting on top of the dresser!
      ctx.fillStyle = '#5c3b20';
      ctx.fillRect(drX + 10, drY - 8, 30, 22);
      ctx.strokeRect(drX + 10, drY - 8, 30, 22);

      // 9. Furniture Piece 3: Tall Carved Wooden TV Armoire (Combining the Reference Wardrobe + Living Room TV!)
      const arX = drX + drW + 12;
      const arY = ry + 64;
      const arW = 132;
      const arH = 146;
      ctx.fillStyle = '#8f6542';
      ctx.fillRect(arX, arY, arW, arH);
      ctx.strokeRect(arX, arY, arW, arH);
      // Top crown cap
      ctx.fillStyle = '#a67853';
      ctx.fillRect(arX - 3, arY, arW + 6, 24);
      ctx.strokeRect(arX - 3, arY, arW + 6, 24);
      // Bottom drawer with silver knob
      ctx.fillStyle = '#7d5636';
      ctx.fillRect(arX + 8, arY + arH - 28, arW - 16, 22);
      ctx.strokeRect(arX + 8, arY + arH - 28, arW - 16, 22);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.arc(arX + arW / 2, arY + arH - 17, 3.5, 0, Math.PI * 2); ctx.fill();

      // Wide-Screen TV mounted inside the upper wooden armoire bay!
      const tvX = arX + 8;
      const tvY = arY + 28;
      const tvW = arW - 16;
      const tvH = 82;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tvX, tvY, tvW, tvH);
      ctx.strokeStyle = this.tvOn ? '#38bdf8' : '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(tvX, tvY, tvW, tvH);

      if (!this.tvOn) {
        const offG = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY + tvH);
        offG.addColorStop(0, '#090d16');
        offG.addColorStop(0.5, '#1e293b');
        offG.addColorStop(1, '#090d16');
        ctx.fillStyle = offG;
        ctx.fillRect(tvX + 4, tvY + 4, tvW - 8, tvH - 8);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(tvX + tvW - 8, tvY + tvH - 4, 2.5, 0, Math.PI * 2); ctx.fill();
      } else {
        const pulse = Math.sin(this.tick * 0.2) * 0.5 + 0.5;
        const commG = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY + tvH);
        commG.addColorStop(0, '#0284c7');
        commG.addColorStop(0.5, '#1e1b4b');
        commG.addColorStop(1, '#b45309');
        ctx.fillStyle = commG;
        ctx.fillRect(tvX + 4, tvY + 4, tvW - 8, tvH - 8);

        const cCols = ['#ef4444', '#fbbf24', '#22c55e'];
        for (let i = 0; i < 3; i++) {
          const b = Math.sin(this.tick * 0.18 + i * 1.4) * 4;
          ctx.fillStyle = cCols[i];
          ctx.fillRect(tvX + 14 + i * 32, tvY + 12 + b, 22, 32);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(tvX + 14 + i * 32, tvY + 12 + b, 22, 32);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(tvX + 4, tvY + tvH - 22, tvW - 8, 18);
        ctx.fillStyle = pulse > 0.5 ? '#fde047' : '#38bdf8';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ PLAY MYTHOS! ⚡', tvX + tvW / 2, tvY + tvH - 9);
      }

      // 10. Arched Diamond-Lattice Leaded Window + Square Wooden Wall Clock (matching reference!)
      const winX = arX + arW + 48;
      const winY = ry + 54;
      const winW = 64;
      const winH = 92;

      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#825b38';
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 32, winW / 2, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold keystone dot on window arch
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(winX + winW / 2, winY + 8, 3, 0, Math.PI * 2); ctx.fill();

      // Inner Diamond-Lattice Glass Panes
      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 34, winW / 2 - 8, Math.PI, 0);
      ctx.lineTo(winX + winW - 8, winY + winH - 10);
      ctx.lineTo(winX + 8, winY + winH - 10);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = this.settings.timeOfDay === 'night' ? '#334155' : '#9cb3c2';
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeStyle = '#5c4028';
      ctx.lineWidth = 2;
      for (let d = -winH; d < winW + winH; d += 16) {
        ctx.beginPath();
        ctx.moveTo(winX + d, winY);
        ctx.lineTo(winX + d + winH, winY + winH);
        ctx.moveTo(winX + d, winY + winH);
        ctx.lineTo(winX + d + winH, winY);
        ctx.stroke();
      }
      ctx.restore();

      // Square Wooden-Framed Wall Clock next to window!
      const clkX = winX + winW + 22;
      const clkY = ry + 66;
      ctx.fillStyle = '#825b38';
      ctx.beginPath(); ctx.roundRect(clkX, clkY, 34, 36, 4); ctx.fill();
      ctx.strokeStyle = '#3b2816'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9cb3c2';
      ctx.beginPath(); ctx.arc(clkX + 17, clkY + 18, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(clkX + 17, clkY + 18); ctx.lineTo(clkX + 17, clkY + 10);
      ctx.moveTo(clkX + 17, clkY + 18); ctx.lineTo(clkX + 23, clkY + 21);
      ctx.stroke();

      // 11. Tall 4-Shelf Wooden Bookcase on Right North Wall
      const bkX = clkX + 54;
      const bkY = ry + 68;
      const bkW = 116;
      const bkH = 138;
      ctx.fillStyle = '#946a45';
      ctx.fillRect(bkX, bkY, bkW, bkH);
      ctx.strokeRect(bkX, bkY, bkW, bkH);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(bkX - 2, bkY, bkW + 4, 20);
      ctx.strokeRect(bkX - 2, bkY, bkW + 4, 20);

      const bookPalette = ['#5e3a73', '#2e6f73', '#6e2b3b', '#3a6e4c', '#8f5e38', '#35566e'];
      for (let s = 0; s < 4; s++) {
        const sy = bkY + 26 + s * 26;
        ctx.fillStyle = '#472f1b';
        ctx.fillRect(bkX + 10, sy, bkW - 20, 22);
        for (let b = 0; b < 8; b++) {
          ctx.fillStyle = bookPalette[(b + s * 3) % bookPalette.length];
          ctx.fillRect(bkX + 12 + b * 11.5, sy + 3, 9.5, 19);
          ctx.strokeRect(bkX + 12 + b * 11.5, sy + 3, 9.5, 19);
        }
      }

      // 12. Round Wooden Table & Two Cushioned Wooden Chairs on Right Floor (matching reference!)
      const tbX = 10.2 * S;
      const tbY = 6.6 * S;

      // Left & Right Wooden Chairs with Slate-Grey Cushions
      [tbX - 96, tbX + 64].forEach((chX, idx) => {
        const chY = tbY - 22;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(chX + 3, chY + 6, 34, 48);
        // Chair legs & seat frame
        ctx.fillStyle = '#8f6542';
        ctx.strokeStyle = '#3b2816';
        ctx.lineWidth = 2;
        ctx.fillRect(chX, chY + 16, 34, 32);
        ctx.strokeRect(chX, chY + 16, 34, 32);
        // Slate-grey seat cushion (#6c7073)
        ctx.fillStyle = '#6c7073';
        ctx.fillRect(chX + 4, chY + 18, 26, 20);
        ctx.strokeRect(chX + 4, chY + 18, 26, 20);
        // Tall Chair Backrest post on outer edge
        const backX = idx === 0 ? chX : chX + 26;
        ctx.fillStyle = '#a67853';
        ctx.fillRect(backX, chY - 12, 8, 56);
        ctx.strokeRect(backX, chY - 12, 8, 56);
      });

      // Round Wooden Table Shadow & Legs
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 16, 68, 52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7d5636';
      ctx.fillRect(tbX - 48, tbY + 26, 10, 26);
      ctx.strokeRect(tbX - 48, tbY + 26, 10, 26);
      ctx.fillRect(tbX + 38, tbY + 26, 10, 26);
      ctx.strokeRect(tbX + 38, tbY + 26, 10, 26);

      // Round Table Top Bevel & Surface (#a37650)
      ctx.fillStyle = '#7d5636';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 5, 68, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a37653';
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 68, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Stacked Books / Mythos Starter Decks on the Round Table (matching reference!)
      ctx.fillStyle = '#6e2b3b';
      ctx.fillRect(tbX + 12, tbY - 16, 26, 28);
      ctx.strokeRect(tbX + 12, tbY - 16, 26, 28);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(tbX + 14, tbY + 4, 22, 6);
      ctx.strokeRect(tbX + 14, tbY + 4, 22, 6);
    }

    // =========================================================================
    // CARD SHOP INTERIOR RENDERER (Same Cutaway Architectural Style!)
    // - Muted slate-blue void (#658296), chamfered wood-capped walls (#78583a),
    //   cream plaster north wall (#e3e0b6), wide-plank wood floor (#876645),
    //   chamfered collector rug (#282338), wooden Booster Pack display shelves,
    //   Shopkeeper Leo's glass-top Booster Counter, framed Mythos Beast posters,
    //   arched diamond-lattice window, wall clock, 4-shelf Card Binder bookcase,
    //   and a round wooden In-Store Mythos Duel Table with two cushioned chairs!
    // =========================================================================
    renderCardShopInterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;

      // 1. Muted Slate-Blue Cutaway Void Background (#658296)
      ctx.fillStyle = '#658296';
      ctx.fillRect(0, 0, W, H);

      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4

      // 2. Wide-Plank Warm Brown Wood Floor (#876645) with Chamfered Room Polygon
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rx + 42, floorTop - 24);
      ctx.lineTo(rx + rw - 42, floorTop - 24);
      ctx.lineTo(rx + rw, floorTop + 16);
      ctx.lineTo(rx + rw, ry + rh - 24);
      ctx.lineTo(rx + rw - 28, ry + rh);
      ctx.lineTo(rx + 28, ry + rh);
      ctx.lineTo(rx, ry + rh - 24);
      ctx.lineTo(rx, floorTop + 16);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = '#876645';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      const plankH = 38;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#876645' : '#7d5d3e';
        ctx.fillRect(rx, y, rw, plankH);
        ctx.fillStyle = '#6e5034';
        ctx.fillRect(rx + 30, y + 11, rw - 60, 2);
        ctx.fillRect(rx + 80, y + 25, rw - 140, 2);
        ctx.fillStyle = '#4f3923';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);

        const shift = (row * 130) % 240;
        for (let x = rx + 70 + shift; x < rx + rw - 40; x += 240) {
          ctx.fillRect(x, y, 2, plankH);
        }
      }

      // Bottom Wooden Threshold Border
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, ry + rh - 18, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx, ry + rh - 18, rw, 18);

      // 3. Dark Indigo/Espresso Chamfered Shop Rug on Left Counter Area (#2c2538)
      const rugX = rx + 44;
      const rugY = floorTop + 18;
      const rugW = 395;
      const rugH = 370;
      const ch = 22;

      const drawChamferedRect = (x, y, w, h, c) => {
        ctx.beginPath();
        ctx.moveTo(x + c, y);
        ctx.lineTo(x + w - c, y);
        ctx.lineTo(x + w, y + c);
        ctx.lineTo(x + w, y + h - c);
        ctx.lineTo(x + w - c, y + h);
        ctx.lineTo(x + c, y + h);
        ctx.lineTo(x, y + h - c);
        ctx.lineTo(x, y + c);
        ctx.closePath();
      };

      ctx.fillStyle = '#2d2638';
      drawChamferedRect(rugX, rugY, rugW, rugH, ch);
      ctx.fill();
      ctx.strokeStyle = '#1b1624';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.strokeStyle = '#7c6340';
      ctx.lineWidth = 2.5;
      drawChamferedRect(rugX + 10, rugY + 10, rugW - 20, rugH - 20, ch - 4);
      ctx.stroke();

      // Subtle Golden Mythos Diamond Emblem woven into the center of the shop rug
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rugX + rugW / 2, rugY + 145);
      ctx.lineTo(rugX + rugW / 2 + 54, rugY + 195);
      ctx.lineTo(rugX + rugW / 2, rugY + 245);
      ctx.lineTo(rugX + rugW / 2 - 54, rugY + 195);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      // 4. Cream Plaster North Wall (#e3e0b6) with Angled Wing Walls & Baseboard
      ctx.fillStyle = '#e3e0b6';
      ctx.beginPath();
      ctx.moveTo(rx + 28, ry + 56);
      ctx.lineTo(rx + 68, ry + 30);
      ctx.lineTo(rx + rw - 68, ry + 30);
      ctx.lineTo(rx + rw - 28, ry + 56);
      ctx.lineTo(rx + rw - 28, floorTop + 14);
      ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.lineTo(rx + 68, floorTop - 12);
      ctx.lineTo(rx + 28, floorTop + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#4f3923';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = '#aba67c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // Subtle weathered plaster bricks on the cream wall
      ctx.strokeStyle = '#b8b388';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx + 205, ry + 58, 26, 15);
      ctx.strokeRect(rx + 565, ry + 64, 24, 14);

      // Dark wood baseboard along north wall and wing walls
      ctx.fillStyle = '#6e5034';
      ctx.beginPath();
      ctx.moveTo(rx + 28, floorTop + 2);
      ctx.lineTo(rx + 68, floorTop - 24);
      ctx.lineTo(rx + rw - 68, floorTop - 24);
      ctx.lineTo(rx + rw - 28, floorTop + 2);
      ctx.lineTo(rx + rw - 28, floorTop + 14);
      ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.lineTo(rx + 68, floorTop - 12);
      ctx.lineTo(rx + 28, floorTop + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Thick Wooden Top-Cap Wall Molding & Side Cutaway Pillars
      ctx.fillStyle = '#78583a';
      ctx.beginPath();
      ctx.moveTo(rx, floorTop + 180);
      ctx.lineTo(rx, ry + 26);
      ctx.lineTo(rx + 36, ry);
      ctx.lineTo(rx + rw - 36, ry);
      ctx.lineTo(rx + rw, ry + 26);
      ctx.lineTo(rx + rw, floorTop + 180);
      ctx.lineTo(rx + rw - 28, floorTop + 180);
      ctx.lineTo(rx + rw - 28, ry + 48);
      ctx.lineTo(rx + rw - 64, ry + 28);
      ctx.lineTo(rx + 64, ry + 28);
      ctx.lineTo(rx + 28, ry + 48);
      ctx.lineTo(rx + 28, floorTop + 180);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      [rx, rx + rw - 28].forEach(px => {
        ctx.fillStyle = '#e3e0b6';
        ctx.fillRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        ctx.strokeStyle = '#3b2816';
        ctx.strokeRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        ctx.fillStyle = '#ebe8c5';
        ctx.strokeStyle = '#aba67c';
        ctx.fillRect(px + 4, floorTop + 245, 20, 14);
        ctx.strokeRect(px + 4, floorTop + 245, 20, 14);
      });

      // 6. Bottom Stone Doorstep Threshold + Two Dark Post Blocks (exit back to South Road!)
      const doorX = 9.3 * S;
      const doorY = ry + rh - 22;
      ctx.fillStyle = '#1c1610';
      ctx.fillRect(doorX - 18, doorY - 6, 18, 20);
      ctx.fillRect(doorX + 86, doorY - 6, 18, 20);
      ctx.fillStyle = '#6c7075';
      ctx.beginPath();
      ctx.roundRect(doorX, doorY + 4, 86, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#2b2d30';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#8b9096';
      ctx.fillRect(doorX + 6, doorY + 8, 74, 10);

      // 7. Left North Wall: Carved Wooden Booster Pack Display Cabinet (x: rx+62, y: ry+68)
      const cabX = rx + 62;
      const cabY = ry + 68;
      const cabW = 114;
      const cabH = 142;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(cabX + 4, cabY + 8, cabW, cabH);
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.fillRect(cabX, cabY, cabW, cabH);
      ctx.strokeRect(cabX, cabY, cabW, cabH);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(cabX - 3, cabY, cabW + 6, 22);
      ctx.strokeRect(cabX - 3, cabY, cabW + 6, 22);

      // 3 Tiered Shelves stocked with Foil Mythos Booster Boxes!
      const packColors = ['#f59e0b', '#38bdf8', '#a855f7', '#22c55e', '#ef4444'];
      for (let s = 0; s < 3; s++) {
        const sy = cabY + 28 + s * 34;
        ctx.fillStyle = '#472f1b';
        ctx.fillRect(cabX + 8, sy, cabW - 16, 28);
        for (let p = 0; p < 4; p++) {
          const px = cabX + 13 + p * 23;
          ctx.fillStyle = packColors[(p + s * 2) % packColors.length];
          ctx.fillRect(px, sy + 4, 18, 22);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(px, sy + 4, 18, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 3, sy + 8, 12, 6);
        }
      }

      // 8. North Wall Banner Behind Counter: Framed "MYTHOS BASE SET — $10 / PACK" Signboard
      const banX = cabX + cabW + 24;
      const banY = ry + 52;
      const banW = 228;
      const banH = 68;
      ctx.fillStyle = '#825b38';
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.fillRect(banX, banY, banW, banH);
      ctx.strokeRect(banX, banY, banW, banH);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(banX + 6, banY + 6, banW - 12, banH - 12);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(banX + 6, banY + 6, banW - 12, banH - 12);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('🃏 MYTHOS — 1ST EDITION', banX + banW / 2, banY + 28);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.fillText('BASE SET BOOSTER PACKS: $10 EACH', banX + banW / 2, banY + 46);

      // 9. Arched Diamond-Lattice Leaded Window + Square Wooden Wall Clock (matching house interior!)
      const winX = banX + banW + 34;
      const winY = ry + 54;
      const winW = 64;
      const winH = 92;

      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#825b38';
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 32, winW / 2, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(winX + winW / 2, winY + 8, 3, 0, Math.PI * 2); ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 34, winW / 2 - 8, Math.PI, 0);
      ctx.lineTo(winX + winW - 8, winY + winH - 10);
      ctx.lineTo(winX + 8, winY + winH - 10);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = this.settings.timeOfDay === 'night' ? '#334155' : '#9cb3c2';
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeStyle = '#5c4028';
      ctx.lineWidth = 2;
      for (let d = -winH; d < winW + winH; d += 16) {
        ctx.beginPath();
        ctx.moveTo(winX + d, winY);
        ctx.lineTo(winX + d + winH, winY + winH);
        ctx.moveTo(winX + d, winY + winH);
        ctx.lineTo(winX + d + winH, winY);
        ctx.stroke();
      }
      ctx.restore();

      const clkX = winX + winW + 20;
      const clkY = ry + 66;
      ctx.fillStyle = '#825b38';
      ctx.beginPath(); ctx.roundRect(clkX, clkY, 34, 36, 4); ctx.fill();
      ctx.strokeStyle = '#3b2816'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9cb3c2';
      ctx.beginPath(); ctx.arc(clkX + 17, clkY + 18, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(clkX + 17, clkY + 18); ctx.lineTo(clkX + 17, clkY + 10);
      ctx.moveTo(clkX + 17, clkY + 18); ctx.lineTo(clkX + 23, clkY + 21);
      ctx.stroke();

      // 10. Right North Wall: Tall 4-Shelf Card Binders & Collector Box Bookcase
      const bkX = clkX + 50;
      const bkY = ry + 68;
      const bkW = 116;
      const bkH = 138;
      ctx.fillStyle = '#946a45';
      ctx.fillRect(bkX, bkY, bkW, bkH);
      ctx.strokeRect(bkX, bkY, bkW, bkH);
      ctx.fillStyle = '#a67853';
      ctx.fillRect(bkX - 2, bkY, bkW + 4, 20);
      ctx.strokeRect(bkX - 2, bkY, bkW + 4, 20);

      const binderPalette = ['#f59e0b', '#38bdf8', '#a855f7', '#22c55e', '#ef4444', '#eab308'];
      for (let s = 0; s < 4; s++) {
        const sy = bkY + 26 + s * 26;
        ctx.fillStyle = '#472f1b';
        ctx.fillRect(bkX + 10, sy, bkW - 20, 22);
        for (let b = 0; b < 8; b++) {
          ctx.fillStyle = binderPalette[(b + s * 3) % binderPalette.length];
          ctx.fillRect(bkX + 12 + b * 11.5, sy + 3, 9.5, 19);
          ctx.strokeRect(bkX + 12 + b * 11.5, sy + 3, 9.5, 19);
        }
      }

      // 11. Round Wooden In-Store Mythos Duel Table & Two Cushioned Chairs on Right Floor!
      const tbX = 10.5 * S;
      const tbY = 6.8 * S;

      [tbX - 96, tbX + 64].forEach((chX, idx) => {
        const chY = tbY - 22;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(chX + 3, chY + 6, 34, 48);
        ctx.fillStyle = '#8f6542';
        ctx.strokeStyle = '#3b2816';
        ctx.lineWidth = 2;
        ctx.fillRect(chX, chY + 16, 34, 32);
        ctx.strokeRect(chX, chY + 16, 34, 32);
        ctx.fillStyle = '#6c7073';
        ctx.fillRect(chX + 4, chY + 18, 26, 20);
        ctx.strokeRect(chX + 4, chY + 18, 26, 20);
        const backX = idx === 0 ? chX : chX + 26;
        ctx.fillStyle = '#a67853';
        ctx.fillRect(backX, chY - 12, 8, 56);
        ctx.strokeRect(backX, chY - 12, 8, 56);
      });

      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 16, 68, 52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7d5636';
      ctx.fillRect(tbX - 48, tbY + 26, 10, 26);
      ctx.strokeRect(tbX - 48, tbY + 26, 10, 26);
      ctx.fillRect(tbX + 38, tbY + 26, 10, 26);
      ctx.strokeRect(tbX + 38, tbY + 26, 10, 26);

      ctx.fillStyle = '#7d5636';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 5, 68, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a37653';
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 68, 50, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Official Mythos Playmat laid out on the Round In-Store Table!
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.fillRect(tbX - 38, tbY - 22, 76, 44);
      ctx.strokeRect(tbX - 38, tbY - 22, 76, 44);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(tbX - 28, tbY - 14, 14, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(tbX + 14, tbY - 14, 14, 20);
    }

    // Renders the Carved Wooden & Glass Booster Counter in front of Shopkeeper Leo
    // so Leo stands behind the counter and the player walks up in front of it!
    renderShopCounterForeground() {
      const ctx = this.ctx;
      const S = this.TILE;
      const cntX = 4.55 * S;
      const cntY = 4.65 * S;
      const cntW = 3.65 * S; // 233.6 px
      const cntH = 56;
      const nearKeeper = this.nearInteractable?.id === 'shopkeeper';

      // Counter drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(cntX + 4, cntY + 8, cntW, cntH);

      // Carved Warm Wood Counter Base (#8f6542)
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.2;
      ctx.fillRect(cntX, cntY, cntW, cntH);
      ctx.strokeRect(cntX, cntY, cntW, cntH);

      // Top Polished Wood Trim
      ctx.fillStyle = '#a67853';
      ctx.fillRect(cntX - 3, cntY, cntW + 6, 22);
      ctx.strokeRect(cntX - 3, cntY, cntW + 6, 22);

      // Recessed Front Wood Panels
      ctx.fillStyle = '#7d5636';
      ctx.fillRect(cntX + 10, cntY + 26, 98, 22);
      ctx.strokeRect(cntX + 10, cntY + 26, 98, 22);
      ctx.fillRect(cntX + 120, cntY + 26, 102, 22);
      ctx.strokeRect(cntX + 120, cntY + 26, 102, 22);

      // Glass Display Case inset on Left of Counter showing Single Rare Beast Cards!
      const glX = cntX + 12;
      const glY = cntY + 3;
      const glW = 94;
      const glH = 16;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(glX, glY, glW, glH);
      ctx.strokeStyle = nearKeeper ? '#38bdf8' : '#9cb3c2';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(glX, glY, glW, glH);

      ['#ef4444', '#22c55e', '#38bdf8', '#eab308'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(glX + 8 + i * 21, glY + 3, 14, 10);
      });

      // Open MYTHOS Base Set Booster Box on the Counter (with 2 Foil Packs ready if not yet bought!)
      const boxX = cntX + 126;
      const boxY = cntY - 8;
      ctx.fillStyle = '#4c1d95';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.6;
      ctx.fillRect(boxX, boxY, 46, 24);
      ctx.strokeRect(boxX, boxY, 46, 24);

      if (!this.hasBoughtCardShopPacks) {
        // Two gleaming Foil Booster Packs sitting side-by-side on the counter!
        [boxX + 6, boxX + 24].forEach((px, idx) => {
          const bounce = Math.sin(this.tick * 0.1 + idx) * 1.2;
          ctx.fillStyle = idx === 0 ? '#f59e0b' : '#38bdf8';
          ctx.fillRect(px, boxY - 6 + bounce, 14, 20);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(px, boxY - 6 + bounce, 14, 20);
        });
      }

      // Classic Brass Cash Register on Right End of Counter
      const regX = cntX + cntW - 42;
      const regY = cntY - 12;
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 1.6;
      ctx.fillRect(regX, regY, 30, 26);
      ctx.strokeRect(regX, regY, 30, 26);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(regX + 5, regY + 4, 20, 8);
      ctx.strokeRect(regX + 5, regY + 4, 20, 8);
    }

    // =========================================================================
    // EXTERIOR RENDERER — Zoomed-Out Neighborhood, Dual East-West Roads & Card Shop:
    // - Zoomed-out camera perspective showing the full neighborhood & commercial district:
    //   1. Upper Residential East-West Lane with Player's Cottage (Left) & Mike/AJ's Cottage (Right)
    //   2. Central North-South Connector Road running south from the residential intersection
    //   3. Lower East-West Commercial Avenue running across the south section of town
    //   4. MYTHOS Card Shop on the East section of the lower East-West road!
    // =========================================================================
    renderCraftsmanExterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;  // 1024
      const H = this.canvas.height; // 768
      const pName = this.draftAppearance?.name || 'Asher';
      const fName = this.friendName || 'Mike';

      // 1. Lush Deep Forest Grass Base
      const gGrad = ctx.createLinearGradient(0, 0, 0, H);
      gGrad.addColorStop(0, '#1f4f16');
      gGrad.addColorStop(0.55, '#2b6e1d');
      gGrad.addColorStop(1, '#1e4d14');
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, 0, W, H);

      // Grass texture blades across the neighborhood
      for (let i = 0; i < 165; i++) {
        const gx = Math.floor(this.hash(i, 11) * (W - 24)) + 12;
        const gy = Math.floor(this.hash(i, 22) * (H - 24)) + 12;
        ctx.fillStyle = i % 2 === 0 ? '#3b8528' : '#184210';
        ctx.fillRect(gx, gy, 2.2, 4.5);
        ctx.fillRect(gx + 2, gy - 1.5, 1.8, 3.8);
      }

      // 2. ZOOMED-OUT DUAL EAST-WEST ROADS + TWO NORTH-SOUTH BLOCK AVENUES!
      // - Upper Residential East-West Road:  y = 4.20*S .. 5.25*S
      // - 1st North-South Connector Road:    x = 5.55*S .. 6.65*S, y = 5.25*S .. 9.55*S
      // - 2nd East-Block North-South Road:   x = 9.95*S .. 10.95*S, y = 5.25*S .. 9.55*S (separates the middle block from the Card Shop block!)
      // - Lower Commercial East-West Road:   y = 9.55*S .. 10.70*S
      const road1Y = 4.20 * S;
      const road1H = 1.05 * S;     // Ends at 5.25 * S
      const south1X = 5.55 * S;
      const south1W = 1.10 * S;    // Ends at 6.65 * S
      const south2X = 9.95 * S;
      const south2W = 1.00 * S;    // Ends at 10.95 * S (One more block east!)
      const road2Y = 9.55 * S;
      const road2H = 1.15 * S;     // Ends at 10.70 * S
      const connH = road2Y - (road1Y + road1H);

      // Outer Stone Curbs / Dirt Shoulders for all road segments
      ctx.fillStyle = '#574c3f';
      ctx.fillRect(0, road1Y - 5, W, road1H + 10);
      ctx.fillRect(south1X - 5, road1Y + road1H - 3, south1W + 10, connH + 6);
      ctx.fillRect(south2X - 5, road1Y + road1H - 3, south2W + 10, connH + 6);
      ctx.fillRect(0, road2Y - 5, W, road2H + 10);

      // Warm Compacted Dirt & Cobble Road Surfaces (#8a623e)
      const rSurf1 = ctx.createLinearGradient(0, road1Y, 0, road1Y + road1H);
      rSurf1.addColorStop(0, '#785230');
      rSurf1.addColorStop(0.5, '#8f653e');
      rSurf1.addColorStop(1, '#754f2e');
      ctx.fillStyle = rSurf1;
      ctx.fillRect(0, road1Y, W, road1H);

      ctx.fillStyle = '#865e39';
      ctx.fillRect(south1X, road1Y + road1H - 4, south1W, connH + 8);
      ctx.fillRect(south2X, road1Y + road1H - 4, south2W, connH + 8);

      const rSurf2 = ctx.createLinearGradient(0, road2Y, 0, road2Y + road2H);
      rSurf2.addColorStop(0, '#785230');
      rSurf2.addColorStop(0.5, '#916740');
      rSurf2.addColorStop(1, '#754f2e');
      ctx.fillStyle = rSurf2;
      ctx.fillRect(0, road2Y, W, road2H);

      // Walkways connecting Player's Porch Stairs (x: 1.98*S), Friend's Porch Stairs (x: 10.05*S),
      // and the MYTHOS Card Shop Front Entrance (x: 13.65*S, one more block east!) to the roads!
      const drawDrivewayPath = (px, py, pw, ph) => {
        ctx.fillStyle = '#6b533b';
        ctx.fillRect(px - 2.5, py, pw + 5, ph);
        ctx.fillStyle = '#856443';
        ctx.fillRect(px, py, pw, ph);
        for (let sy = py + 8; sy < py + ph - 5; sy += 15) {
          ctx.fillStyle = '#9ca3af';
          ctx.beginPath();
          ctx.roundRect(px + 5, sy, pw - 10, 8, 2.5);
          ctx.fill();
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      };
      // Player house walkway -> Upper E-W Road
      drawDrivewayPath(1.71 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      // Mike/AJ house walkway -> Upper E-W Road
      drawDrivewayPath(9.79 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      // Card Shop front plaza walkway -> Lower E-W Road (Far-East Block!)
      drawDrivewayPath(13.25 * S, 9.05 * S, 0.80 * S, road2Y - 9.05 * S + 4);

      // Stone Curb Borders along Upper Road, Both Connector Roads & Lower Road
      ctx.strokeStyle = '#3d352b';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = '#9ca3af';

      // Upper Road Top Curbs (leaving gaps for the two house walkways)
      const topCurbs1 = [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: (9.79 - 2.21) * S },
        { x: 10.29 * S, w: W - 10.29 * S }
      ];
      topCurbs1.forEach(c => {
        ctx.fillRect(c.x, road1Y - 4, c.w, 4);
        ctx.strokeRect(c.x, road1Y - 4, c.w, 4);
      });

      // Upper Road Bottom Curbs (leaving gaps for 1st Connector Road and 2nd East Block Road)
      const botCurbs1 = [
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: W - (south2X + south2W) }
      ];
      botCurbs1.forEach(c => {
        ctx.fillRect(c.x, road1Y + road1H, c.w, 4);
        ctx.strokeRect(c.x, road1Y + road1H, c.w, 4);
      });

      // Vertical Curbs along both North-South Connector Roads
      [south1X - 4, south1X + south1W, south2X - 4, south2X + south2W].forEach(vx => {
        ctx.fillRect(vx, road1Y + road1H, 4, connH);
        ctx.strokeRect(vx, road1Y + road1H, 4, connH);
      });

      // Lower Road Top Curbs (leaving gaps for 1st Connector, 2nd Connector, and Card Shop Walkway)
      const topCurbs2 = [
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: (13.25 * S) - (south2X + south2W) },
        { x: 14.05 * S, w: W - 14.05 * S }
      ];
      topCurbs2.forEach(c => {
        ctx.fillRect(c.x, road2Y - 4, c.w, 4);
        ctx.strokeRect(c.x, road2Y - 4, c.w, 4);
      });

      // Lower Road Bottom Continuous Curb
      ctx.fillRect(0, road2Y + road2H, W, 4);
      ctx.strokeRect(0, road2Y + road2H, W, 4);

      // Subtle Road Pebbles & Cobble Texture
      ctx.fillStyle = 'rgba(55, 35, 18, 0.30)';
      for (let i = 0; i < 65; i++) {
        const rx = (i * 73) % (W - 20) + 10;
        const ry1 = road1Y + 8 + ((i * 23) % (road1H - 16));
        ctx.beginPath(); ctx.ellipse(rx, ry1, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        const ry2 = road2Y + 8 + ((i * 29) % (road2H - 16));
        ctx.beginPath(); ctx.ellipse((rx + 41) % (W - 20) + 10, ry2, 7.5, 2.8, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 26; i++) {
        const rx1 = south1X + 8 + ((i * 37) % (south1W - 16));
        const rx2 = south2X + 8 + ((i * 31) % (south2W - 16));
        const ry = road1Y + road1H + 6 + ((i * 29) % (connH - 12));
        ctx.beginPath(); ctx.ellipse(rx1, ry, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(rx2, ry, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Stone Crosswalk Paving Bars at Both Block Intersections & the Card Shop Entrance!
      ctx.fillStyle = '#b5aea4';
      ctx.strokeStyle = '#4b463f';
      ctx.lineWidth = 1.1;
      for (let cy = road1Y + 7; cy < road1Y + road1H - 5; cy += 12) {
        ctx.fillRect(south1X - 14, cy, 11, 6.5);
        ctx.strokeRect(south1X - 14, cy, 11, 6.5);
        ctx.fillRect(south1X + south1W + 3, cy, 11, 6.5);
        ctx.strokeRect(south1X + south1W + 3, cy, 11, 6.5);
      }
      [
        { x: south1X, w: south1W },
        { x: south2X, w: south2W }
      ].forEach(st => {
        for (let cx = st.x + 6; cx < st.x + st.w - 5; cx += 13) {
          ctx.fillRect(cx, road1Y + road1H + 4, 7.5, 11);
          ctx.strokeRect(cx, road1Y + road1H + 4, 7.5, 11);
          ctx.fillRect(cx, road2Y - 15, 7.5, 11);
          ctx.strokeRect(cx, road2Y - 15, 7.5, 11);
        }
      });
      // Crosswalks across the Lower Road at the 2nd Block Intersection and in front of the Card Shop
      for (let cy = road2Y + 7; cy < road2Y + road2H - 5; cy += 12) {
        ctx.fillRect(south2X - 14, cy, 11, 6.5);
        ctx.strokeRect(south2X - 14, cy, 11, 6.5);
        ctx.fillRect(13.02 * S, cy, 11, 6.5);
        ctx.strokeRect(13.02 * S, cy, 11, 6.5);
      }

      // 3. REUSABLE CRAFTSMAN / VICTORIAN GABLE COTTAGE RENDERER (More Zoomed-Out 3.2x2.55 Tile Scale)
      const drawNeighborhoodCottage = (cfg) => {
        const {
          hx, hy, hw,
          mirror = false,        // false = Gable on Left (Player), true = Gable on Right (Mike/AJ)
          roofDark, roofMid, roofLight,
          sidingCol, sidingLineCol, trimCol,
          doorMatCol, hasChimney = false, glowWindows = false
        } = cfg;

        const gableW = hw * 0.54;
        const wingW = hw - gableW;
        const gableX = mirror ? (hx + wingW) : hx;
        const wingX = mirror ? hx : (hx + gableW);

        const deckY = hy + 1.88 * S;
        const railY = hy + 2.48 * S;
        const brickY = railY + 7;
        const foundH = 9;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.fillRect(hx - 4, deckY + 6, hw + 10, (railY - deckY) + foundH + 8);

        // Optional Stone Chimney with Smoke on Mike/AJ's House
        if (hasChimney) {
          const chX = mirror ? (hx + hw - 22) : (hx + 10);
          const chY = hy - 8;
          ctx.fillStyle = '#57534e';
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 1.4;
          ctx.fillRect(chX, chY, 16, 38);
          ctx.strokeRect(chX, chY, 16, 38);
          for (let s = 0; s < 3; s++) {
            const smokeY = chY - 6 - ((this.tick * 0.28 + s * 9) % 22);
            ctx.fillStyle = 'rgba(226, 232, 240, 0.32)';
            ctx.beginPath();
            ctx.arc(chX + 8 + Math.sin(this.tick * 0.05 + s) * 3, smokeY, 3.5 + s * 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3A. Red-Brown Brick Foundation Base
        ctx.fillStyle = '#7c3f2c';
        ctx.fillRect(hx, brickY, hw, foundH);
        ctx.strokeStyle = '#2b1810';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(hx, brickY, hw, foundH);
        ctx.fillStyle = '#592b1d';
        ctx.fillRect(hx, brickY + 4, hw, 1);
        for (let bx = hx + 7; bx < hx + hw - 4; bx += 12) {
          ctx.fillRect(bx, brickY, 1, 4);
          ctx.fillRect(bx + 6, brickY + 4, 1, 5);
        }

        // 3B. Wrap-Around Vertical-Plank Dark Wood Porch & Open Patio Deck
        ctx.fillStyle = '#5c3c22';
        ctx.fillRect(hx, deckY, hw, railY - deckY + 7);
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(hx, deckY, hw, railY - deckY + 7);
        ctx.fillStyle = '#3d2614';
        for (let px = hx + 6; px < hx + hw; px += 6) {
          ctx.fillRect(px, deckY, 1, railY - deckY + 7);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        ctx.fillRect(hx, deckY, hw, 7);

        // 3C. Horizontal Clapboard Siding Helper
        const drawWall = (wx, wy, ww, wh, shadeSide = false) => {
          ctx.fillStyle = sidingCol;
          ctx.fillRect(wx, wy, ww, wh);
          ctx.fillStyle = sidingLineCol;
          for (let sy = wy + 4.5; sy < wy + wh - 4; sy += 4.5) {
            ctx.fillRect(wx, sy, ww, 1);
          }
          if (shadeSide) {
            ctx.fillStyle = 'rgba(0,0,0,0.16)';
            const sx = mirror ? (wx + ww - 14) : wx;
            ctx.fillRect(sx, wy, 14, wh);
          }
          ctx.fillStyle = trimCol;
          ctx.strokeStyle = '#2b241b';
          ctx.lineWidth = 1.1;
          ctx.fillRect(wx, wy, 5, wh);
          ctx.strokeRect(wx, wy, 5, wh);
          ctx.fillRect(wx + ww - 5, wy, 5, wh);
          ctx.strokeRect(wx + ww - 5, wy, 5, wh);
          ctx.fillRect(wx, wy + wh - 4, ww, 4);
          ctx.strokeRect(wx, wy + wh - 4, ww, 4);
        };

        const rwY = hy + 0.92 * S;
        const rwH = deckY - rwY + 3;
        drawWall(wingX - (mirror ? 0 : 2), rwY, wingW + 2, rwH, true);

        const lwY = hy + 1.32 * S;
        const lwH = deckY - lwY + 8;
        drawWall(gableX, lwY, gableW, lwH, false);

        // 3D. 6-Pane Cottage Window Helper
        const drawWin = (wx, wy, ww, wh, flowerBox = false) => {
          ctx.fillStyle = trimCol;
          ctx.strokeStyle = '#2b241b';
          ctx.lineWidth = 1.1;
          ctx.fillRect(wx - 2.5, wy - 3, ww + 5, 3);
          ctx.strokeRect(wx - 2.5, wy - 3, ww + 5, 3);
          ctx.fillRect(wx - 1.5, wy, ww + 3, wh + 1.5);
          ctx.strokeRect(wx - 1.5, wy, ww + 3, wh + 1.5);

          ctx.fillStyle = glowWindows ? '#38bdf8' : '#2c3540';
          ctx.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
          ctx.strokeRect(wx + 1, wy + 1, ww - 2, wh - 2);

          ctx.fillStyle = trimCol;
          ctx.fillRect(wx + ww / 2 - 0.7, wy + 1, 1.4, wh - 2);
          ctx.fillRect(wx + 1, wy + wh * 0.34, ww - 2, 1.2);
          ctx.fillRect(wx + 1, wy + wh * 0.67, ww - 2, 1.2);

          if (flowerBox) {
            ctx.fillStyle = '#d8cfb8';
            ctx.fillRect(wx - 3, wy + wh + 1, ww + 6, 5.5);
            ctx.strokeRect(wx - 3, wy + wh + 1, ww + 6, 5.5);
            for (let f = 0; f < 3; f++) {
              const fx = wx + 2 + f * ((ww - 4) / 2);
              const fy = wy + wh + 1;
              ctx.fillStyle = '#2d6a1e';
              ctx.beginPath(); ctx.arc(fx, fy, 3.0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = mirror ? '#fbbf24' : '#ffffff';
              ctx.beginPath(); ctx.arc(fx, fy - 0.8, 1.2, 0, Math.PI * 2); ctx.fill();
            }
          }
        };

        const drawSconce = (sx, sy) => {
          ctx.fillStyle = '#3b2f22';
          ctx.fillRect(sx - 1.2, sy, 2.4, 5.5);
          ctx.fillStyle = '#fde047';
          ctx.beginPath(); ctx.arc(sx, sy + 2, 2.0, 0, Math.PI * 2); ctx.fill();
        };

        // Side Wing Windows + Sconces
        drawWin(wingX + 9, rwY + 9, 16, 21, false);
        drawWin(wingX + wingW - 25, rwY + 9, 16, 21, false);
        drawSconce(wingX + wingW * 0.43, rwY + 15);
        drawSconce(wingX + wingW * 0.57, rwY + 15);

        // Porch Windows with Flower Boxes flanking the Screen Door
        drawWin(gableX + 14, lwY + 11, 16, 20, true);
        drawWin(gableX + gableW - 30, lwY + 11, 16, 20, true);
        drawSconce(gableX + 8, lwY + 18);
        drawSconce(gableX + gableW - 8, lwY + 18);

        // 3E. Front Screen Door & Welcome Mat
        const doorW = 23;
        const doorH = 34;
        const doorX = gableX + gableW / 2 - doorW / 2;
        const doorY = lwY + 8;

        ctx.fillStyle = trimCol;
        ctx.strokeStyle = '#2b251d';
        ctx.lineWidth = 1.2;
        ctx.fillRect(doorX - 3, doorY - 5, doorW + 6, doorH + 5);
        ctx.strokeRect(doorX - 3, doorY - 5, doorW + 6, doorH + 5);

        ctx.fillStyle = '#4a463f';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeRect(doorX, doorY, doorW, doorH);
        ctx.fillStyle = '#b5ab96';
        ctx.fillRect(doorX, doorY + 19, doorW, 2.5);
        ctx.strokeRect(doorX, doorY + 19, doorW, 2.5);

        // Welcome Mat
        ctx.fillStyle = doorMatCol;
        ctx.beginPath();
        ctx.roundRect(doorX - 5, doorY + doorH + 1.5, doorW + 10, 10, 5);
        ctx.fill();
        ctx.strokeStyle = '#1b2e1a';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 3F. Open Patio Deck Furniture (Outdoor Dining Table & 4 Slatted Chairs)
        const tbW = 38, tbH = 19;
        const tbX = wingX + wingW / 2 - tbW / 2;
        const tbY = deckY + 9;

        const drawMiniChair = (cx, cy) => {
          ctx.fillStyle = '#cfc5b0';
          ctx.strokeStyle = '#2b241b';
          ctx.lineWidth = 1.1;
          ctx.fillRect(cx, cy, 10, 9.5);
          ctx.strokeRect(cx, cy, 10, 9.5);
        };
        drawMiniChair(tbX + 4, tbY - 6.5);
        drawMiniChair(tbX + tbW - 14, tbY - 6.5);

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(tbX + 2, tbY + 3, tbW, tbH);
        ctx.fillStyle = '#dfd6c3';
        ctx.strokeStyle = '#2b241b';
        ctx.fillRect(tbX, tbY, tbW, tbH);
        ctx.strokeRect(tbX, tbY, tbW, tbH);

        drawMiniChair(tbX + 4, tbY + tbH - 2.5);
        drawMiniChair(tbX + tbW - 14, tbY + tbH - 2.5);

        // Potted Deck Plants
        [wingX + 9, wingX + wingW - 9].forEach(px => {
          const py = deckY + 14;
          ctx.fillStyle = '#d8cfb8';
          ctx.strokeStyle = '#2b241b';
          ctx.fillRect(px - 3.5, py + 4, 7, 6.5);
          ctx.strokeRect(px - 3.5, py + 4, 7, 6.5);
          ctx.fillStyle = '#2d6a1e';
          ctx.beginPath(); ctx.arc(px, py + 1, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });

        // 3G. Shingled Roofs, Scalloped Trim & Steep Front Gable
        const drawShingles = (rx, ry, rw, rh) => {
          const rGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
          rGrad.addColorStop(0, roofDark);
          rGrad.addColorStop(0.5, roofMid);
          rGrad.addColorStop(1, roofLight);
          ctx.fillStyle = rGrad;
          ctx.fillRect(rx, ry, rw, rh);

          ctx.strokeStyle = 'rgba(10, 20, 12, 0.45)';
          ctx.lineWidth = 1;
          for (let sy = ry + 6.5; sy < ry + rh; sy += 6.5) {
            ctx.beginPath(); ctx.moveTo(rx, sy); ctx.lineTo(rx + rw, sy); ctx.stroke();
            const shift = ((Math.round(sy - ry)) % 13 === 0) ? 0 : 5;
            for (let sx = rx + shift; sx < rx + rw; sx += 10) {
              ctx.beginPath(); ctx.moveTo(sx, sy - 6.5); ctx.lineTo(sx, sy); ctx.stroke();
            }
          }
          ctx.strokeStyle = '#142018';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(rx, ry, rw, rh);
        };

        const drawScallops = (sx, sy, sw) => {
          ctx.fillStyle = trimCol;
          ctx.strokeStyle = '#2b241b';
          ctx.lineWidth = 1;
          ctx.fillRect(sx, sy, sw, 3);
          ctx.strokeRect(sx, sy, sw, 3);
          for (let x = sx + 3.5; x < sx + sw - 2.5; x += 6) {
            ctx.beginPath();
            ctx.arc(x, sy + 3, 2.0, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        };

        const wingRoofX = mirror ? (wingX - 5) : (wingX - 6);
        drawShingles(wingRoofX, hy, wingW + 11, rwY - hy + 2.5);
        drawScallops(wingRoofX, rwY + 1, wingW + 11);

        const porchRoofY = hy + 0.86 * S;
        drawShingles(gableX + 2.5, porchRoofY, gableW - 5, lwY - porchRoofY + 4);
        drawScallops(gableX + 2.5, lwY + 1, gableW - 5);

        // Steep Front Gable Attic Triangle & Double Attic Window
        const peakX = gableX + gableW / 2;
        const peakY = hy - 2;
        const baseY = porchRoofY + 11;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(peakX, peakY + 11);
        ctx.lineTo(gableX + gableW + 4, baseY);
        ctx.lineTo(gableX - 4, baseY);
        ctx.closePath();
        ctx.clip();

        drawWall(gableX + 3, peakY + 7, gableW - 6, baseY - peakY, false);

        ctx.fillStyle = trimCol;
        ctx.strokeStyle = '#2b241b';
        ctx.lineWidth = 1.1;
        ctx.fillRect(peakX - 34, peakY + 32, 4, 44);
        ctx.strokeRect(peakX - 34, peakY + 32, 4, 44);
        ctx.fillRect(peakX + 30, peakY + 32, 4, 44);
        ctx.strokeRect(peakX + 30, peakY + 32, 4, 44);

        drawWin(peakX - 15, peakY + 21, 13, 21, false);
        drawWin(peakX + 2, peakY + 21, 13, 21, false);
        ctx.restore();

        // Overhanging Gable Roof Slopes
        ctx.fillStyle = roofMid;
        ctx.strokeStyle = '#142018';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(gableX - 8, hy);
        ctx.lineTo(peakX, hy);
        ctx.lineTo(peakX, peakY + 11);
        ctx.lineTo(gableX - 8, baseY + 11);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(peakX, hy);
        ctx.lineTo(gableX + gableW + 8, hy);
        ctx.lineTo(gableX + gableW + 8, baseY + 11);
        ctx.lineTo(peakX, peakY + 11);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.strokeStyle = trimCol;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(gableX - 7, baseY + 10);
        ctx.lineTo(peakX, peakY + 10);
        ctx.lineTo(gableX + gableW + 7, baseY + 10);
        ctx.stroke();
        ctx.strokeStyle = '#2b241b';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // 3H. Porch Columns, Turned White Spindle Balustrade & Front Porch Stairs
        const drawCol = (cx, ty, by) => {
          ctx.fillStyle = trimCol;
          ctx.strokeStyle = '#2b241b';
          ctx.lineWidth = 1.1;
          ctx.fillRect(cx - 2, ty, 4, by - ty);
          ctx.strokeRect(cx - 2, ty, 4, by - ty);
          ctx.fillStyle = '#cfc6b0';
          ctx.fillRect(cx - 3.5, by - 8, 7, 8);
          ctx.strokeRect(cx - 3.5, by - 8, 7, 8);
        };

        const stairL = doorX - 7;
        const stairR = doorX + doorW + 7;
        drawCol(gableX + 4, lwY + 4, brickY);
        drawCol(stairL, lwY + 4, brickY);
        drawCol(stairR, lwY + 4, brickY);
        drawCol(gableX + gableW - 4, lwY + 4, brickY);
        drawCol(mirror ? (hx + 4) : (hx + hw - 4), brickY - 13, brickY);

        const drawBalustrade = (bx1, bx2, by) => {
          if (bx2 - bx1 < 5) return;
          ctx.fillStyle = '#6e4726';
          ctx.strokeStyle = '#26170c';
          ctx.lineWidth = 1.1;
          ctx.fillRect(bx1, by - 11.5, bx2 - bx1, 3);
          ctx.strokeRect(bx1, by - 11.5, bx2 - bx1, 3);
          ctx.fillRect(bx1, by - 3, bx2 - bx1, 3);
          ctx.strokeRect(bx1, by - 3, bx2 - bx1, 3);

          for (let sx = bx1 + 4; sx < bx2 - 2.5; sx += 5.8) {
            ctx.fillStyle = trimCol;
            ctx.fillRect(sx - 1, by - 8.5, 2, 5.5);
            ctx.strokeRect(sx - 1, by - 8.5, 2, 5.5);
          }
        };

        drawBalustrade(hx + 5, stairL - 2.5, brickY);
        drawBalustrade(stairR + 2.5, hx + hw - 5, brickY);

        // Front Wooden Porch Stairs
        const stW = stairR - stairL;
        const stY = brickY - 7;
        const stH = 22;
        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.2;
        ctx.fillRect(stairL, stY, stW, stH);
        ctx.strokeRect(stairL, stY, stW, stH);
        for (let s = 0; s < 3; s++) {
          const stepY = stY + 7 + s * 5;
          ctx.fillStyle = s % 2 === 0 ? '#784f2d' : '#634024';
          ctx.fillRect(stairL + 1.5, stepY, stW - 3, 5);
          ctx.strokeRect(stairL + 1.5, stepY, stW - 3, 5);
        }

        // Foundation Flower Planter Boxes
        [wingX + 6, wingX + wingW - 44].forEach(px => {
          const py = brickY + 5;
          ctx.fillStyle = '#d8cfb8';
          ctx.strokeStyle = '#2b241b';
          ctx.fillRect(px, py, 38, 8);
          ctx.strokeRect(px, py, 38, 8);
          for (let f = 0; f < 3; f++) {
            const fx = px + 6.5 + f * 12.5;
            ctx.fillStyle = '#2d6a1e';
            ctx.beginPath(); ctx.arc(fx, py - 1, 3.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = mirror ? '#f43f5e' : '#ffffff';
            ctx.beginPath(); ctx.arc(fx + 0.8, py - 1.8, 1.3, 0, Math.PI * 2); ctx.fill();
          }
        });
      };

      // 4A. Render PLAYER'S HOUSE on the North-West Plot (x: 1.1*S .. 4.3*S, width 3.2 tiles)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 0.45 * S,
        hw: 3.2 * S,
        mirror: false,
        roofDark: '#1e3818',
        roofMid: '#2b4f21',
        roofLight: '#39662c',
        sidingCol: '#c9be9f',
        sidingLineCol: '#9c9276',
        trimCol: '#e3dcc8',
        doorMatCol: '#388e26',
        hasChimney: false,
        glowWindows: this.tvOn
      });

      // 4B. Render MIKE'S / AJ'S HOUSE on the North-Central Plot (x: 7.7*S .. 10.9*S, width 3.2 tiles)
      drawNeighborhoodCottage({
        hx: 7.7 * S,
        hy: 0.45 * S,
        hw: 3.2 * S,
        mirror: true,
        roofDark: '#1e293b',
        roofMid: '#334155',
        roofLight: '#475569',
        sidingCol: '#b8c4b0',
        sidingLineCol: '#8b9982',
        trimCol: '#f1ede4',
        doorMatCol: '#b45309',
        hasChimney: true,
        glowWindows: false
      });

      // 4C. Render the MIDDLE BLOCK TOWN GREEN / PARK PLAZA between the 1st & 2nd N-S Roads (x: 6.8*S .. 9.8*S, y: 5.7*S .. 9.2*S)
      // This makes it visually unmistakable that the Card Shop is ONE FULL BLOCK past the first south road!
      const drawMiddleTownBlock = () => {
        const bx = 6.95 * S;
        const by = 6.05 * S;
        const bw = 2.75 * S;
        const bh = 2.95 * S;

        // Hedged Park Lawn border
        ctx.fillStyle = '#1e4d14';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 12);
        ctx.fill();
        ctx.strokeStyle = '#12300b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#2d6a1e';
        ctx.beginPath();
        ctx.roundRect(bx + 6, by + 6, bw - 12, bh - 12, 9);
        ctx.fill();

        //Cobblestone Center Plaza Circle inside the Middle Block
        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Craftsman Wooden Park Gazebo / Fountain Monument in center of the Middle Block
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Animated water ripple in the middle block fountain
        const ripple = 14 + Math.sin(this.tick * 0.08) * 2;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, ripple * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Wooden Park Bench at the south edge of the Middle Block facing the Lower Road
        const benchX = cx - 20;
        const benchY = by + bh - 18;
        ctx.fillStyle = '#784f2d';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.3;
        ctx.fillRect(benchX, benchY, 40, 10);
        ctx.strokeRect(benchX, benchY, 40, 10);
        ctx.fillStyle = '#5c3c22';
        ctx.fillRect(benchX, benchY - 4, 40, 4);
        ctx.strokeRect(benchX, benchY - 4, 40, 4);
      };
      drawMiddleTownBlock();

      // 5. MYTHOS CARD SHOP Moved ONE MORE BLOCK EAST on the Lower East-West Road!
      // Footprint: x = 11.8*S .. 15.35*S, y = 5.95*S .. 9.25*S (faces South onto the lower road at y = 9.55*S, door at x = 13.65*S)
      const drawMythosCardShop = () => {
        const sx = 11.8 * S;
        const sy = 5.95 * S;
        const sw = 3.55 * S; // 227.2 px
        const sh = 3.30 * S; // 211.2 px (bottom at 9.25 * S)
        const roofH = 1.35 * S;
        const wallY = sy + roofH;
        const wallH = sh - roofH - 18;
        const deckY = sy + sh - 18;
        const nearShop = this.nearInteractable?.id === 'card_shop';

        // Ground shadow beneath the Card Shop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(sx - 6, sy + roofH + 10, sw + 14, sh - roofH);

        // Red-brick & dark stone commercial foundation + front wooden boardwalk
        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx, deckY, sw, 18);
        ctx.strokeRect(sx, deckY, sw, 18);
        ctx.fillStyle = '#3d2614';
        for (let px = sx + 7; px < sx + sw; px += 7) {
          ctx.fillRect(px, deckY, 1, 18);
        }

        // Craftsman Timber & Warm Sandstone Siding Walls
        ctx.fillStyle = '#d6c7ac';
        ctx.fillRect(sx + 2, wallY, sw - 4, wallH);
        ctx.fillStyle = '#b3a286';
        for (let wy = wallY + 5; wy < wallY + wallH - 4; wy += 5) {
          ctx.fillRect(sx + 2, wy, sw - 4, 1);
        }
        // Heavy Craftsman Timber Corner & Center Pillars
        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#24160b';
        ctx.lineWidth = 1.4;
        [sx, sx + 1.25 * S, sx + 2.35 * S, sx + sw - 8].forEach(px => {
          ctx.fillRect(px, wallY, 8, wallH);
          ctx.strokeRect(px, wallY, 8, wallH);
        });
        // Horizontal Timber Beam above Storefront Windows
        ctx.fillRect(sx, wallY, sw, 8);
        ctx.strokeRect(sx, wallY, sw, 8);

        // Double Storefront Entrance Doors (Centered at x = 13.65*S)
        const doorW = 36;
        const doorH = 44;
        const doorX = 13.65 * S - doorW / 2;
        const doorY = deckY - doorH + 2;

        ctx.fillStyle = '#f1ede4';
        ctx.fillRect(doorX - 4, doorY - 4, doorW + 8, doorH + 4);
        ctx.strokeRect(doorX - 4, doorY - 4, doorW + 8, doorH + 4);

        ctx.fillStyle = '#3b2414';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        ctx.strokeRect(doorX, doorY, doorW, doorH);
        // Double glass door panes glowing warm gold/cyan inside
        ctx.fillStyle = nearShop ? '#7dd3fc' : '#38bdf8';
        ctx.fillRect(doorX + 3, doorY + 4, 13, 22);
        ctx.fillRect(doorX + 20, doorY + 4, 13, 22);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(doorX + 3, doorY + 4, 13, 22);
        ctx.strokeRect(doorX + 20, doorY + 4, 13, 22);
        // Brass door handles
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(doorX + 14.5, doorY + 28, 2, 6);
        ctx.fillRect(doorX + 19.5, doorY + 28, 2, 6);

        // Royal Purple & Gold Welcome Mat in front of the Card Shop Door
        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.roundRect(doorX - 6, deckY + 3, doorW + 12, 12, 5);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Front Porch Steps leading down to the Card Shop Walkway
        ctx.fillStyle = '#784f2d';
        ctx.strokeStyle = '#26170c';
        ctx.fillRect(doorX - 8, deckY + 14, doorW + 16, 12);
        ctx.strokeRect(doorX - 8, deckY + 14, doorW + 16, 12);

        // Left & Right Glowing Card Shop Display Windows (Showcasing Giant Booster Boxes & Mythos Cards!)
        const drawShopWindow = (wx, wy, ww, wh, isRight) => {
          ctx.fillStyle = '#f1ede4';
          ctx.strokeStyle = '#26170c';
          ctx.lineWidth = 1.4;
          ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
          ctx.strokeRect(wx - 3, wy - 3, ww + 6, wh + 6);

          const winGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
          winGrad.addColorStop(0, '#0f172a');
          winGrad.addColorStop(0.5, '#1e1b4b');
          winGrad.addColorStop(1, '#312e81');
          ctx.fillStyle = winGrad;
          ctx.fillRect(wx, wy, ww, wh);

          // Mini Displayed Booster Packs / Mythos Cards on Pedestals inside the window!
          const cards = isRight
            ? [{ x: wx + 6, c: '#f59e0b' }, { x: wx + 22, c: '#38bdf8' }]
            : [{ x: wx + 8, c: '#22c55e' }, { x: wx + 28, c: '#eab308' }];
          cards.forEach((cd, idx) => {
            const cy = wy + 8 + Math.sin(this.tick * 0.06 + idx) * 1.5;
            ctx.fillStyle = cd.c;
            ctx.fillRect(cd.x, cy, 13, 18);
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(cd.x, cy, 13, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cd.x + 2.5, cy + 3, 8, 6);
          });

          // Window glass reflection slash
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wx + 5, wy + wh - 4);
          ctx.lineTo(wx + 18, wy + 4);
          ctx.stroke();
        };

        drawShopWindow(sx + 16, wallY + 16, 48, 32, false);
        drawShopWindow(sx + 2.50 * S, wallY + 16, 44, 32, true);

        // Striped Red/Gold & Royal-Blue Storefront Awning over the Windows & Door
        const awnY = wallY + 4;
        const awnH = 13;
        const stripeCount = 16;
        const stripeW = (sw - 8) / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#fef3c7';
          ctx.fillRect(sx + 4 + i * stripeW, awnY, stripeW + 0.5, awnH);
          ctx.beginPath();
          ctx.arc(sx + 4 + (i + 0.5) * stripeW, awnY + awnH, stripeW / 2, 0, Math.PI);
          ctx.fill();
        }
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(sx + 4, awnY, sw - 8, awnH);

        // Shingled Commercial Slate-Indigo & Timber Roof with Central Gable Peak!
        const rGrad = ctx.createLinearGradient(sx, sy, sx, wallY);
        rGrad.addColorStop(0, '#1e1b4b');
        rGrad.addColorStop(0.55, '#312e81');
        rGrad.addColorStop(1, '#3730a3');
        ctx.fillStyle = rGrad;
        ctx.fillRect(sx - 4, sy, sw + 8, roofH);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.lineWidth = 1;
        for (let ry = sy + 7; ry < wallY; ry += 7) {
          ctx.beginPath(); ctx.moveTo(sx - 4, ry); ctx.lineTo(sx + sw + 4, ry); ctx.stroke();
          const shift = ((Math.round(ry - sy)) % 14 === 0) ? 0 : 6;
          for (let rx = sx + shift; rx < sx + sw; rx += 12) {
            ctx.beginPath(); ctx.moveTo(rx, ry - 7); ctx.lineTo(rx, ry); ctx.stroke();
          }
        }
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(sx - 4, sy, sw + 8, roofH);

        // Central Storefront Gable Peak above the Entrance
        const gPeakX = 13.65 * S;
        const gPeakY = sy - 8;
        const gHalfW = 52;
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.moveTo(gPeakX, gPeakY);
        ctx.lineTo(gPeakX + gHalfW, wallY + 4);
        ctx.lineTo(gPeakX - gHalfW, wallY + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f1ede4';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Large Marquee Signboard on the Roof: "🃏 MYTHOS CARD SHOP"
        const signW = 190;
        const signH = 30;
        const signX = sx + sw / 2 - signW / 2;
        const signY = wallY - 34;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(signX, signY, signW, signH, 6);
        ctx.fill();
        ctx.strokeStyle = nearShop ? '#38bdf8' : '#fbbf24';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Mini glowing Mythos Card Emblem on the left of the sign
        ctx.save();
        ctx.translate(signX + 18, signY + 15);
        ctx.rotate(-0.12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-7, -10, 14, 20);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-7, -10, 14, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px Cinzel, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('MYTHOS CARD SHOP', signX + signW / 2 + 8, signY + 15);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText('BOOSTER PACKS • STARTER DECKS', signX + signW / 2 + 8, signY + 25.5);
      };

      drawMythosCardShop();

      // 6. READABLE ROADSIDE MAILBOXES (Player's Mailbox & Mike's/AJ's Mailbox on the Upper Road!)
      const drawMailbox = (mx, my, labelText, boxColor, isHighlighted) => {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(mx, my + 2.5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#784f2d';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.3;
        ctx.fillRect(mx - 2.5, my - 17, 5, 19);
        ctx.strokeRect(mx - 2.5, my - 17, 5, 19);

        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.roundRect(mx - 9.5, my - 28, 19, 12, [5, 5, 2, 2]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(mx - 6, my - 23, 12, 2.5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(mx + 7.5, my - 32, 2, 9);
        ctx.fillRect(mx + 7.5, my - 32, 5, 3.8);
        ctx.strokeRect(mx + 7.5, my - 32, 5, 3.8);

        ctx.font = 'bold 9.5px Inter, sans-serif';
        const plateW = Math.max(66, ctx.measureText(labelText).width + 12);
        const plateX = mx - plateW / 2;
        const plateY = my - 48;

        ctx.fillStyle = isHighlighted ? '#fef08a' : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(plateX, plateY, plateW, 14, 3.5);
        ctx.fill();
        ctx.strokeStyle = isHighlighted ? '#d97706' : '#1e293b';
        ctx.lineWidth = isHighlighted ? 1.8 : 1.2;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, mx, plateY + 10.2);
      };

      const nearPlayerMb = this.nearInteractable?.id === 'player_mailbox';
      const nearFriendMb = this.nearInteractable?.id === 'friend_mailbox';

      drawMailbox(4.75 * S, 3.95 * S, `📬 ${pName}'s House`, '#2563eb', nearPlayerMb);
      drawMailbox(8.15 * S, 3.95 * S, `📬 ${fName}'s House`, '#dc2626', nearFriendMb);

      // 7. DIRECTIONAL SIGNPOSTS at the 1st and 2nd Block Intersections
      const drawSignpost = (sgX, sgY) => {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(sgX, sgY + 2.5, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.4;
        ctx.fillRect(sgX - 2.5, sgY - 26, 5, 28);
        ctx.strokeRect(sgX - 2.5, sgY - 26, 5, 28);
        ctx.fillStyle = '#dfd6c3';
        ctx.fillRect(sgX - 16, sgY - 24, 32, 7.5);
        ctx.strokeRect(sgX - 16, sgY - 24, 32, 7.5);
        ctx.fillStyle = '#c28d53';
        ctx.fillRect(sgX - 12, sgY - 14, 24, 7);
        ctx.strokeRect(sgX - 12, sgY - 14, 24, 7);
      };
      drawSignpost(7.35 * S, 5.45 * S);
      drawSignpost(10.65 * S, 9.25 * S);

      // 8. Cut Wooden Tree Stump in Player's Front Yard & Neighborhood Flowers
      const stmpX = 0.85 * S, stmpY = 3.65 * S;
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath(); ctx.ellipse(stmpX, stmpY + 5, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e4726';
      ctx.strokeStyle = '#2b1810';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(stmpX - 11, stmpY + 5);
      ctx.lineTo(stmpX - 7, stmpY - 6);
      ctx.lineTo(stmpX + 7, stmpY - 6);
      ctx.lineTo(stmpX + 11, stmpY + 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c28d53';
      ctx.beginPath(); ctx.ellipse(stmpX, stmpY - 6, 7, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      const flowerSpots = [
        { x: 3.1 * S, y: 3.75 * S, c: '#eab308' },
        { x: 3.5 * S, y: 3.90 * S, c: '#eab308' },
        { x: 8.75 * S, y: 3.75 * S, c: '#38bdf8' },
        { x: 9.15 * S, y: 3.90 * S, c: '#38bdf8' },
        { x: 5.0 * S, y: 6.2 * S, c: '#eab308' },
        { x: 5.0 * S, y: 8.6 * S, c: '#a855f7' },
        { x: 11.4 * S, y: 6.8 * S, c: '#f43f5e' },
        { x: 11.4 * S, y: 8.7 * S, c: '#eab308' }
      ];
      flowerSpots.forEach(fl => {
        ctx.fillStyle = '#1e4d14';
        ctx.beginPath(); ctx.arc(fl.x, fl.y, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3b8528';
        ctx.beginPath(); ctx.arc(fl.x, fl.y - 1, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = fl.c;
        ctx.fillRect(fl.x - 1.2, fl.y - 5, 2.5, 4);
        ctx.fillRect(fl.x - 3, fl.y - 3, 1.8, 3);
        ctx.fillRect(fl.x + 1.2, fl.y - 3.5, 1.8, 3);
      });

      // 9. Lush Forest Trees & Shrubs framing the Zoomed-Out Neighborhood, Middle Block & Card Shop
      const drawLushBushCluster = (bx, by, r, isAutumn = false) => {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath(); ctx.ellipse(bx, by + r * 0.65, r * 1.1, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();

        const darkCol = isAutumn ? '#6e320e' : '#183d11';
        const midCol = isAutumn ? '#9a4714' : '#29631c';
        const hiCol = isAutumn ? '#c25e1d' : '#438f2d';

        ctx.fillStyle = darkCol;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.arc(bx - r * 0.65, by + r * 0.2, r * 0.78, 0, Math.PI * 2);
        ctx.arc(bx + r * 0.65, by + r * 0.2, r * 0.78, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0d2108';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = midCol;
        ctx.beginPath();
        ctx.arc(bx, by - r * 0.15, r * 0.82, 0, Math.PI * 2);
        ctx.arc(bx - r * 0.55, by + r * 0.1, r * 0.62, 0, Math.PI * 2);
        ctx.arc(bx + r * 0.55, by + r * 0.1, r * 0.62, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hiCol;
        ctx.beginPath();
        ctx.arc(bx - r * 0.2, by - r * 0.35, r * 0.48, 0, Math.PI * 2);
        ctx.arc(bx + r * 0.35, by - r * 0.1, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      };

      // Trees between Player's House & Mike/AJ's House (x: 6.0*S)
      drawLushBushCluster(6.0 * S, 0.9 * S, 24, true);
      drawLushBushCluster(6.0 * S, 2.0 * S, 22, false);
      drawLushBushCluster(6.0 * S, 3.0 * S, 20, false);

      // Left & Right outer forest border above the upper road
      drawLushBushCluster(0.45 * S, 0.9 * S, 23, false);
      drawLushBushCluster(0.55 * S, 2.2 * S, 22, true);
      drawLushBushCluster(12.2 * S, 0.9 * S, 24, false);
      drawLushBushCluster(14.5 * S, 1.2 * S, 25, true);
      drawLushBushCluster(13.4 * S, 2.6 * S, 23, false);
      drawLushBushCluster(15.2 * S, 3.1 * S, 22, false);

      // West Parkland between Upper Road (y=5.25) and Lower Road (y=9.55)
      drawLushBushCluster(1.2 * S, 6.2 * S, 26, false);
      drawLushBushCluster(3.4 * S, 6.8 * S, 24, true);
      drawLushBushCluster(1.8 * S, 8.3 * S, 28, false);
      drawLushBushCluster(4.2 * S, 8.5 * S, 24, false);

      // Southern edge trees below the Lower East-West Road (y = 11.35*S)
      drawLushBushCluster(1.5 * S, 11.45 * S, 24, false);
      drawLushBushCluster(4.5 * S, 11.5 * S, 22, true);
      drawLushBushCluster(8.8 * S, 11.45 * S, 24, false);
      drawLushBushCluster(13.8 * S, 11.45 * S, 25, true);
    }

    drawEntity(entity) {
      const ctx = this.ctx;
      const S = this.TILE;
      const isExt = this.currentArea === 'exterior';
      const spriteScale = isExt ? 1.52 : 2.5;
      const cx = Math.round(entity.x * S);
      const footY = Math.round(entity.y * S + (isExt ? 10 : 18));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.beginPath();
      ctx.ellipse(cx, footY - 2, isExt ? 11 : 18, isExt ? 4.2 : 7, 0, 0, Math.PI * 2);
      ctx.fill();

      entity.sprite.draw(ctx, cx, footY, entity.dir, entity.walkTick || 0, spriteScale);

      if (entity.name) {
        ctx.font = isExt ? 'bold 9.5px Inter, sans-serif' : 'bold 12px Inter, sans-serif';
        const textW = Math.max(isExt ? 38 : 54, ctx.measureText(entity.name).width + 10);
        const tagH = isExt ? 13 : 17;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.fillRect(cx - textW / 2, footY + 2, textW, tagH);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - textW / 2, footY + 2, textW, tagH);
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(entity.name, cx, footY + (isExt ? 11.5 : 15));
      }

      if (entity.bubble) {
        const by = footY - (isExt ? 62 : 96) - Math.sin(this.tick * 0.09) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cx - 14, by, 28, 22, 6);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = isExt ? '12.5px sans-serif' : '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(entity.bubble, cx, by + 15.5);
      }
    }

    drawShaderPass() {
      const ctx = this.ctx;
      const S = this.TILE;
      const { timeOfDay, shadersEnabled } = this.settings;

      if (timeOfDay === 'sunset') {
        ctx.fillStyle = shadersEnabled ? 'rgba(67, 20, 7, 0.22)' : 'rgba(120, 53, 15, 0.12)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else if (timeOfDay === 'night') {
        ctx.fillStyle = shadersEnabled ? 'rgba(15, 23, 42, 0.52)' : 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      if (!shadersEnabled) return;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      if (this.currentArea === 'interior' || this.currentArea === 'card_shop_interior') {
        // Warm Sunlight Beam from the Arched Diamond-Pane Window!
        if (timeOfDay !== 'night') {
          const sunGrad = ctx.createLinearGradient(9.8 * S, 2.2 * S, 11.2 * S, 6.8 * S);
          sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
          sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.moveTo(9.4 * S, 2.8 * S);
          ctx.lineTo(10.4 * S, 2.8 * S);
          ctx.lineTo(11.8 * S, 7.0 * S);
          ctx.lineTo(8.8 * S, 7.0 * S);
          ctx.closePath();
          ctx.fill();
        }

        // Volumetric TV Commercial Light Cone from the Wooden TV Armoire!
        if (this.currentArea === 'interior' && this.tvOn) {
          const flicker = 0.85 + Math.sin(this.tick * 0.35) * 0.15;
          const tvCenterX = 7.35 * S;
          const tvBottomY = 3.6 * S;

          const tvCone = ctx.createRadialGradient(tvCenterX, tvBottomY, 10, tvCenterX, tvBottomY + 140, 260);
          tvCone.addColorStop(0, `rgba(56, 189, 248, ${0.55 * flicker})`);
          tvCone.addColorStop(0.45, `rgba(250, 204, 21, ${0.28 * flicker})`);
          tvCone.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = tvCone;
          ctx.beginPath();
          ctx.moveTo(tvCenterX - 60, tvBottomY);
          ctx.lineTo(tvCenterX + 60, tvBottomY);
          ctx.lineTo(tvCenterX + 210, 8.8 * S);
          ctx.lineTo(tvCenterX - 210, 8.8 * S);
          ctx.closePath();
          ctx.fill();
        }

        if (this.currentArea === 'interior' && this.tvFlashTicks > 0) {
          ctx.fillStyle = `rgba(186, 230, 253, ${(this.tvFlashTicks / 35) * 0.55})`;
          ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }

      ctx.restore();
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const S = this.TILE;

      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.shakeTicks > 0) {
        const mag = (this.shakeTicks / 28) * 9;
        const sx = (Math.random() - 0.5) * mag * 2;
        const sy = (Math.random() - 0.5) * mag * 2;
        ctx.translate(sx, sy);
      }

      if (this.currentArea === 'interior') {
        this.renderCutawayInterior();
      } else if (this.currentArea === 'card_shop_interior') {
        this.renderCardShopInterior();
        // Render Shopkeeper Leo standing behind the wooden checkout counter first!
        if (this.shopkeeperNpc) {
          this.drawEntity({
            x: this.shopkeeperNpc.x,
            y: this.shopkeeperNpc.y,
            dir: this.shopkeeperNpc.dir,
            walkTick: this.shopkeeperNpc.walkTick || 0,
            name: this.shopkeeperNpc.name,
            bubble: this.shopkeeperNpc.bubble,
            sprite: this.shopkeeperNpc.sprite
          });
        }
        // Render the wooden Card Shop Counter + Booster Box + Cash Register in front of Shopkeeper Leo's waist
        this.renderShopCounterForeground();
      } else {
        this.renderCraftsmanExterior();
      }

      const entities = [
        ...this.npcs
          .filter(n => this.currentArea === 'interior' || n.id === 'best_friend')
          .map(n => ({
            x: n.x,
            y: n.y,
            dir: n.dir,
            walkTick: n.walkTick || 0,
            name: n.name,
            bubble: n.bubble,
            sprite: n.sprite
          })),
        {
          x: this.player.x,
          y: this.player.y,
          dir: this.player.dir,
          walkTick: this.player.walkTick,
          name: this.draftAppearance.name || 'You',
          bubble: this.storyState === 'tv_commercial'
            ? '‼️'
            : (this.storyState === 'both_excited' ? '🤩' : null),
          sprite: this.playerSprite
        }
      ].sort((a, b) => a.y - b.y);

      entities.forEach(e => this.drawEntity(e));

      if (this.settings.showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1;
        for (let c = 0; c <= this.COLS; c++) {
          ctx.beginPath(); ctx.moveTo(c * S, 0); ctx.lineTo(c * S, this.canvas.height); ctx.stroke();
        }
        for (let r = 0; r <= this.ROWS; r++) {
          ctx.beginPath(); ctx.moveTo(0, r * S); ctx.lineTo(this.canvas.width, r * S); ctx.stroke();
        }
      }

      this.drawShaderPass();
      ctx.restore();
    }

    loop() {
      this.tick++;
      this.update();
      this.render();
      this.renderCreatorPreview();
      requestAnimationFrame(() => this.loop());
    }
  }

  window.MythosOverworld = MythosOverworld;
})();
