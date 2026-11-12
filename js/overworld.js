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

      // 16x12 visible grid @ 64px per tile (1024x768 viewport)
      this.COLS = 16;
      this.ROWS = 12;
      this.EXT_ROWS = 18.5; // Expanded South Block neighborhood height
      this.EXT_COLS = 26;   // Expanded East Central Park width (1664px)
      this.cameraY = 0;
      this.cameraX = 0;
      this.cobblePattern = null;
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
      this._gold = this.worldSave?.gold ?? 0;
      this.hasMomBoosterMoney = this.worldSave?.hasMomBoosterMoney ?? false;
      this.hasBoughtCardShopPacks = this.worldSave?.hasBoughtCardShopPacks ?? false;
      this.hasBoughtBase2v2Map = this.worldSave?.hasBoughtBase2v2Map ?? false;
      this.hasOpenedStarterPack = this.worldSave?.hasOpenedStarterPack ?? false;
      this.friendWaitingAtHouse = this.worldSave?.friendWaitingAtHouse ?? false;
      this.hasOldCardBinder = this.worldSave?.hasOldCardBinder ?? false;
      this.duoSelectedBeasts = [];
      this.migratedMom25 = this.worldSave?.migratedMom25 ?? false;

      // Weekly Calendar & Sleep System (starts on Monday, Day 1)
      this.dayNumber = this.worldSave?.dayNumber || 1;
      this._isSleeping = false;
      this.DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      this.WEEKLY_CALENDAR = [
        {
          id: 'leo_restock',
          dayIndex: 0,
          dayName: 'Monday',
          shortDay: 'Mon',
          title: "Leo's Booster Restock",
          icon: '🃏',
          highlight: 'Foil Holo Surge (+25% Holo Rate)',
          desc: "Shopkeeper Leo restocks the card shop shelves with fresh foil inventory. Booster packs opened today have +25% increased rare foil chances!",
          perk: "Booster packs have boosted Holo drop rates"
        },
        {
          id: 'pluto_double_wager',
          dayIndex: 1,
          dayName: 'Tuesday',
          shortDay: 'Tue',
          title: "Pluto's Double Wager",
          icon: '💰',
          highlight: 'Double Stakes ($2.00 Wager & Prize)',
          desc: "Pluto is feeling competitive! Friendly duels against Pluto double from $1.00 to $2.00 for both victory payouts and loss stakes.",
          perk: "Pluto duels pay $2.00 on win ($2.00 wager on loss)"
        },
        {
          id: 'silas_woodcraft',
          dayIndex: 2,
          dayName: 'Wednesday',
          shortDay: 'Wed',
          title: "Silas's Woodcraft Fair",
          icon: '🪵',
          highlight: 'Battle Maps Half-Price (50% Off)',
          desc: "Silas hosts his woodworking display at the local shop! The Base2v2 Tactical Battle Map is discounted by 50% ($7.50 instead of $15.00).",
          perk: "50% off Base2v2 Battle Map in Leo's Card Shop ($7.50)"
        },
        {
          id: 'botanical_bloom',
          dayIndex: 3,
          dayName: 'Thursday',
          shortDay: 'Thu',
          title: "Maya's Botanical Bloom",
          icon: '🌿',
          highlight: 'Nature Fortitude (+15 Max HP)',
          desc: "Maya's rare garden blooms fill the air with vital botanical pollen. All Earth and Nature-element beasts gain +15 bonus Max HP in battle!",
          perk: "+15 Max HP for Earth/Nature beasts in duels"
        },
        {
          id: 'league_night',
          dayIndex: 4,
          dayName: 'Friday',
          shortDay: 'Fri',
          title: "Friday Night Mythos League",
          icon: '🏆',
          highlight: 'League Bounty (+$1.50 Win Bonus)',
          desc: "The Friday Night Mythos community tournament is active! Defeat any challenger today to claim a bonus +$1.50 league victory purse.",
          perk: "+$1.50 bonus gold reward on any duel victory"
        },
        {
          id: 'weekend_market',
          dayIndex: 5,
          dayName: 'Saturday',
          shortDay: 'Sat',
          title: "Weekend Town Market",
          icon: '🏷️',
          highlight: 'Booster Sale ($8.00 per pack)',
          desc: "The weekend outdoor market brings discounts to Leo's Card Shop! 1st-Edition Booster Packs are on sale for $8.00 (regularly $10.00).",
          perk: "Booster packs discounted to $8.00"
        },
        {
          id: 'stargazer_astronomy',
          dayIndex: 6,
          dayName: 'Sunday',
          shortDay: 'Sun',
          title: "Nova's Stargazer Astronomy",
          icon: '🌌',
          highlight: 'Cosmic Tailwind (+1 Move Range)',
          desc: "Nova's telescope reveals an aligned celestial transit. Celestial and Flying beasts gain +1 Move Range in battle today!",
          perk: "+1 Move Range for Celestial & Flying beasts in duels"
        }
      ];

      // Ensure existing saves receive the +$5 if Mom gave them money under the old $20 rule
      if (this.hasMomBoosterMoney && !this.migratedMom25) {
        this._gold = (this._gold || 0) + 5;
        this.migratedMom25 = true;
      }
      this.activeChallengerFor2v2 = null;
      this.beastSelectFilter = 'all';
      this.friendDefeatedRewardPending = false;
      this._autoSaveTimer = null;
      this._autosaveToastTimer = null;
      this._initialized = false;

      const rawInv = Array.isArray(this.worldSave?.inventory) ? [...this.worldSave.inventory] : [];
      this.inventory = this.wrapReactiveArray(rawInv.map(i => this.wrapReactiveItem(i)), 'inventory');
      this.selectedInventoryItemId = null;

      // 9-Pocket Trading Card Binder
      const rawBinder = Array.isArray(this.worldSave?.binderSlots)
        ? [...this.worldSave.binderSlots]
        : Array(9).fill(null);
      while (rawBinder.length < 9) rawBinder.push(null);
      this.binderSlots = this.wrapReactiveArray(rawBinder.map(s => s ? this.wrapReactiveItem(s) : null), 'binder');
      this.inspectingCard = null;
      this.inspectingSlotIndex = null;
      this.inspectingPose = 'idle';
      this.binderPickerTargetIndex = null;

      // Ensure progressed players receive Pegasus and Dreadnaught cards to test immediately
      if (this.hasOpenedStarterPack && !this.inventory.some(i => i.beastId === 'pegasus') && !this.binderSlots?.some(s => s && s.beastId === 'pegasus')) {
        const pegasusDef = this.getBaseSetCardCatalog().find(c => c.beastId === 'pegasus');
        if (pegasusDef) {
          this.inventory.push(this.wrapReactiveItem({
            id: pegasusDef.id,
            beastId: pegasusDef.beastId,
            name: pegasusDef.name,
            shortName: pegasusDef.shortName,
            element: pegasusDef.element,
            stars: pegasusDef.stars,
            cardImg: pegasusDef.cardImg,
            type: 'mythos_card',
            qty: 1,
            desc: pegasusDef.desc
          }));
        }
      }

      if (this.hasOpenedStarterPack && !this.inventory.some(i => i.beastId === 'dreadnaught') && !this.binderSlots?.some(s => s && s.beastId === 'dreadnaught')) {
        const dreadDef = this.getBaseSetCardCatalog().find(c => c.beastId === 'dreadnaught');
        if (dreadDef) {
          this.inventory.push(this.wrapReactiveItem({
            id: dreadDef.id,
            beastId: dreadDef.beastId,
            name: dreadDef.name,
            shortName: dreadDef.shortName,
            element: dreadDef.element,
            stars: dreadDef.stars,
            cardImg: dreadDef.cardImg,
            type: 'mythos_card',
            qty: 1,
            desc: dreadDef.desc
          }));
        }
      }

      this.playerSprite = new CS.CharacterSpriteSheet(this.draftAppearance);
      this.shopkeeperNpc = this.createShopkeeperNpc();
      this.plutoNpc = this.createPlutoNpc();
      this.novaNpc = this.createNovaNpc();
      this.silasNpc = this.createSilasNpc();
      this.mayaNpc = this.createMayaNpc();
      this.chloeNpc = this.createChloeNpc();
      this.rowanNpc = this.createRowanNpc();
      this.jasperNpc = this.createJasperNpc();
      this.npcs = [
        this.createFriendNpc(this.friendName),
        this.plutoNpc,
        this.novaNpc,
        this.silasNpc,
        this.mayaNpc,
        this.chloeNpc,
        this.rowanNpc,
        this.jasperNpc
      ];

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
      // 'intro_bored' -> 'tv_commercial' -> 'both_excited' -> 'free_roam' (Mom walks in) -> 'mom_gave_money'
      this.storyState = 'intro_waiting';
      this.activeDialogueNpc = null;
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
      this.activeDialogueNpc = null;
      this.currentShopTab = 'buy';

      this.touchBeacon = null;

      this.canvas = document.getElementById('overworld-canvas');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

      if (this.canvas) {
        this.canvas.width = this.COLS * this.TILE;
        this.canvas.height = this.ROWS * this.TILE;
        this.bindEvents();
        this.initTouchControls();
        this.initIntroAndCreatorUI();
        this.loop();
      }
      this._initialized = true;
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

    createPlutoNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'pluto',
        name: 'Pluto',
        x: 6.2,
        y: 5.25,
        dir: 'down',
        walkTick: 0,
        bubble: '💻',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Pluto',
          skin: 'light',
          hairStyle: 'spiky',
          hairColor: 'midnight',
          eyeColor: 'violet',
          outfitStyle: 'hoodie',
          outfitColor: 'royal',
          pantsColor: 'dark',
          hatStyle: 'goggles'
        })
      };
    }

    createNovaNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'nova',
        name: 'Nova',
        x: 6.2,
        y: 5.35,
        dir: 'down',
        walkTick: 0,
        bubble: '✨',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Nova',
          skin: 'light',
          hairStyle: 'ponytail',
          hairColor: 'midnight',
          eyeColor: 'violet',
          outfitStyle: 'hoodie',
          outfitColor: 'royal',
          pantsColor: 'dark',
          hatStyle: 'none'
        })
      };
    }

    createSilasNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'silas',
        name: 'Silas',
        x: 6.2,
        y: 5.35,
        dir: 'down',
        walkTick: 0,
        bubble: '🪵',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Silas',
          skin: 'warm',
          hairStyle: 'swept',
          hairColor: 'silver',
          eyeColor: 'amber',
          outfitStyle: 'vest',
          outfitColor: 'ranger',
          pantsColor: 'khaki',
          hatStyle: 'none'
        })
      };
    }

    createMayaNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'maya',
        name: 'Maya',
        x: 6.2,
        y: 5.35,
        dir: 'down',
        walkTick: 0,
        bubble: '🌿',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Maya',
          skin: 'olive',
          hairStyle: 'long',
          hairColor: 'emerald',
          eyeColor: 'emerald',
          outfitStyle: 'jacket',
          outfitColor: 'ranger',
          pantsColor: 'denim',
          hatStyle: 'none'
        })
      };
    }

    createChloeNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'chloe',
        name: 'Chloe',
        x: 19.5,
        y: 7.1,
        dir: 'down',
        walkTick: 0,
        bubble: '🧺',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Chloe',
          skin: 'warm',
          hairStyle: 'ponytail',
          hairColor: 'chestnut',
          eyeColor: 'amber',
          outfitStyle: 'vest',
          outfitColor: 'gold',
          pantsColor: 'khaki',
          hatStyle: 'none'
        })
      };
    }

    createRowanNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'rowan',
        name: 'Rowan',
        x: 23.6,
        y: 7.7,
        dir: 'left',
        walkTick: 0,
        bubble: '🃏',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Rowan',
          skin: 'light',
          hairStyle: 'swept',
          hairColor: 'midnight',
          eyeColor: 'blue',
          outfitStyle: 'jacket',
          outfitColor: 'royal',
          pantsColor: 'dark',
          hatStyle: 'cap'
        })
      };
    }

    createJasperNpc() {
      const CS = window.MythosCharacterSprites;
      return {
        id: 'jasper',
        name: 'Jasper',
        x: 21.1,
        y: 11.2,
        dir: 'up',
        walkTick: 0,
        bubble: '🎨',
        sprite: new CS.CharacterSpriteSheet({
          name: 'Jasper',
          skin: 'olive',
          hairStyle: 'spiky',
          hairColor: 'silver',
          eyeColor: 'emerald',
          outfitStyle: 'hoodie',
          outfitColor: 'ranger',
          pantsColor: 'denim',
          hatStyle: 'goggles'
        })
      };
    }

    // -------------------------------------------------------------------------
    // Weekly Calendar & Sleep Methods
    // -------------------------------------------------------------------------
    getCurrentDayIndex() {
      return (((this.dayNumber || 1) - 1) % 7 + 7) % 7;
    }

    getCurrentDayName() {
      return this.DAYS_OF_WEEK[this.getCurrentDayIndex()];
    }

    getCurrentDayEvent() {
      return this.WEEKLY_CALENDAR[this.getCurrentDayIndex()];
    }

    toggleCalendarModal(force) {
      const modal = document.getElementById('calendar-modal');
      if (!modal) return;
      const shouldOpen = force !== undefined ? !!force : modal.classList.contains('hidden');
      if (shouldOpen) {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.renderCalendarModal();
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    renderCalendarModal() {
      const bannerSpan = document.getElementById('cal-current-day-banner');
      const todayTitle = document.getElementById('cal-today-title');
      const todayDesc = document.getElementById('cal-today-desc');
      const grid = document.getElementById('calendar-week-grid');

      const currentIdx = this.getCurrentDayIndex();
      const currentDay = this.getCurrentDayName();
      const currentEvent = this.getCurrentDayEvent();

      if (bannerSpan) {
        bannerSpan.textContent = `${currentDay}, Day ${this.dayNumber || 1}`;
      }
      if (todayTitle) {
        todayTitle.innerHTML = `${currentEvent.icon} ${currentEvent.title} <span style="font-size: 13px; color: #a7f3d0; font-weight: 600; margin-left: 6px;">(${currentEvent.highlight})</span>`;
      }
      if (todayDesc) {
        todayDesc.textContent = currentEvent.desc;
      }

      if (grid) {
        grid.innerHTML = '';
        this.WEEKLY_CALENDAR.forEach((dayEv, idx) => {
          const isToday = idx === currentIdx;
          const card = document.createElement('div');
          card.className = `calendar-day-card${isToday ? ' active-today' : ''}`;
          card.innerHTML = `
            ${isToday ? '<div class="cal-card-today-badge">✨ TODAY</div>' : ''}
            <div class="cal-card-day-name">${dayEv.dayName}</div>
            <div class="cal-card-icon">${dayEv.icon}</div>
            <div class="cal-card-event-name">${dayEv.title}</div>
            <div class="cal-card-perk-pill">${dayEv.highlight}</div>
          `;
          grid.appendChild(card);
        });
      }
    }

    sleepInBed() {
      if (this._isSleeping) return;
      this._isSleeping = true;

      if (window.sounds?.playSleepChime) {
        window.sounds.playSleepChime();
      }

      const overlay = document.getElementById('sleep-fade-overlay');
      if (overlay) {
        overlay.classList.remove('hidden');
      }

      const bar = document.getElementById('ow-dialog-bar');
      if (bar) bar.classList.add('hidden');

      setTimeout(() => {
        // Advance day
        this.dayNumber = (this.dayNumber || 1) + 1;
        this.saveWorldData(this.draftAppearance);
        this.updateHUDSaveInfo();

        if (overlay) {
          overlay.classList.add('hidden');
        }

        if (window.sounds?.playMorningChime) {
          window.sounds.playMorningChime();
        }

        const wakeModal = document.getElementById('morning-wake-modal');
        const heading = document.getElementById('morning-day-heading');
        const eventName = document.getElementById('morning-event-name');
        const eventDesc = document.getElementById('morning-event-desc');

        const ev = this.getCurrentDayEvent();
        if (heading) {
          heading.textContent = `${this.getCurrentDayName()} • Day ${this.dayNumber}`;
        }
        if (eventName) {
          eventName.innerHTML = `${ev.icon} ${ev.title}`;
        }
        if (eventDesc) {
          eventDesc.textContent = `${ev.desc} (${ev.highlight})`;
        }

        if (wakeModal) {
          wakeModal.classList.remove('hidden');
        }
      }, 1250);
    }

    closeMorningWakeModal() {
      const wakeModal = document.getElementById('morning-wake-modal');
      if (wakeModal) wakeModal.classList.add('hidden');
      this._isSleeping = false;
      this.updateFreeRoamPrompt();
      this.showAutosaveIndicator(`☀️ Good Morning! It's ${this.getCurrentDayName()}!`);
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
          badgeLabel: '🔥 FIRE ELEMENT • 120 HP',
          cardImg: 'Cards/Phoenix_Card.png',
          desc: '<b>Phoenix (Fire • 120 HP)</b> — Base Set Mythos Card. Moves: <b>Flaming Talons</b> (30 Dmg), <b>Fire Orb</b> (50% Reflect), &amp; <b>Trails of Fire</b> (10 Dmg Flame Hazard).'
        },
        {
          id: 'card_earth_golem',
          beastId: 'earth_golem',
          name: 'Earth Golem (Mythos Card)',
          shortName: 'Earth Golem',
          element: 'Earth',
          stars: 4,
          badgeLabel: '🪨 EARTH ELEMENT • 200 HP',
          cardImg: 'Cards/Earth_Golem_Card.png',
          desc: '<b>Earth Golem (Earth • 200 HP)</b> — Base Set Mythos Card. Moves: <b>Crushing Grip</b> (20 Dmg + Immobilize), <b>Rock Barrier</b>, &amp; <b>Terraform</b>.'
        },
        {
          id: 'card_hydra',
          beastId: 'hydra',
          name: 'Hydra (Mythos Card)',
          shortName: 'Hydra',
          element: 'Poison',
          stars: 4,
          badgeLabel: '🐍 POISON ELEMENT • 120 HP',
          cardImg: 'Cards/Hydra_Card.png',
          desc: '<b>Hydra (Poison • 120 HP)</b> — Base Set Mythos Card. Moves: <b>Venomous Bite</b> (20 Dmg + Poison), <b>Regrowth</b> (+10 HP/turn), &amp; <b>Swamp Regenerator</b>.'
        },
        {
          id: 'card_terra_mother',
          beastId: 'terra_mother',
          name: 'Terra-Mother (Mythos Card)',
          shortName: 'Terra-Mother',
          element: 'Earth',
          stars: 4,
          badgeLabel: '🌿 EARTH ELEMENT • 100 HP',
          cardImg: 'Cards/Terra_Mother_Card.png',
          desc: '<b>Terra-Mother (Earth • 100 HP)</b> — Base Set Mythos Card. Moves: <b>Root Crush</b> (35 Dmg), <b>Ram</b> (25 Dmg + 2-tile knockback), &amp; <b>Thorn of Life</b>.'
        },
        {
          id: 'card_werewolf',
          beastId: 'werewolf',
          name: 'Werewolf (Mythos Card)',
          shortName: 'Werewolf',
          element: 'Earth',
          stars: 2,
          badgeLabel: '🐺 EARTH ELEMENT • 100 HP',
          cardImg: 'Cards/Werewolf_Card.png',
          desc: '<b>Werewolf (Earth • 100 HP)</b> — Base Set Mythos Card. Moves: <b>Rip Apart</b> (20 Dmg), <b>Retreat</b> (+1 Move), &amp; <b>Howl</b> (+10 Team Attack Buff).'
        },
        {
          id: 'card_verdant_guardian',
          beastId: 'verdant_guardian',
          name: 'Verdant Guardian (Mythos Card)',
          shortName: 'Verdant Guardian',
          element: 'Plant',
          stars: 2,
          badgeLabel: '🍃 PLANT ELEMENT • 160 HP',
          cardImg: 'Cards/Verdant_Guardian_Card.png',
          desc: '<b>Verdant Guardian (Plant • 160 HP)</b> — Base Set Mythos Card. Moves: <b>Branch Whip</b> (20 Dmg), <b>Thorn Bush</b> (10 Dmg AOE), &amp; <b>Sapling Strength</b> (2× Dmg at ≤1/4 HP).'
        },
        {
          id: 'card_dwarf_warden',
          beastId: 'dwarf_warden',
          name: 'Dwarf Warden (Mythos Card)',
          shortName: 'Dwarf Warden',
          element: 'Earth',
          stars: 4,
          badgeLabel: '🪨 EARTH ELEMENT • 140 HP',
          cardImg: 'Cards/Dwarf_Warden_Card.png',
          desc: '<b>Dwarf Warden (Earth • 140 HP)</b> — Base Set Mythos Card. Moves: <b>Hammer Throw</b> (25 Dmg front 2 tiles), <b>Bullwark</b> (Negates incoming attack, 5t cd), &amp; <b>Endurance</b> (Halves damage after turn 10).'
        },
        {
          id: 'card_pegasus',
          beastId: 'pegasus',
          name: 'Pegasus (Mythos Card)',
          shortName: 'Pegasus',
          element: 'Air',
          stars: 3,
          badgeLabel: '☁️ AIR ELEMENT • 120 HP',
          cardImg: 'Cards/Pegasus_Card.png',
          desc: '<b>Pegasus (Air • 120 HP)</b> — Base Set Mythos Card. Moves: <b>Trample</b> (30 Dmg), <b>Inspire</b> (gives up turn movement to give +2 moves to allies), &amp; <b>Soar</b> (flies over blocked tiles as long as landing on a free tile).'
        },
        {
          id: 'card_dreadnaught',
          beastId: 'dreadnaught',
          name: 'Dreadnaught (Mythos Card)',
          shortName: 'Dreadnaught',
          element: 'Metal',
          stars: 2,
          badgeLabel: '⚙️ METAL ELEMENT • 160 HP',
          cardImg: 'Cards/Dreadnaught_Card.png',
          desc: '<b>Dreadnaught (Metal • 160 HP)</b> — Base Set Mythos Card. Moves: <b>Magma Fist</b> (25 Dmg + permanent Magma Pool), <b>Fortress</b> (intercepts damage for ally within 3x3 for 1t), &amp; <b>Burning Heart</b> (if alone, deals 35 Dmg and can Fortress self).'
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
          beastId: itemDef.beastId || itemDef.id.replace('card_', ''),
          name: itemDef.name,
          shortName: itemDef.shortName || itemDef.name,
          element: itemDef.element || 'Fire',
          stars: itemDef.stars || 4,
          qty: itemDef.qty || 1,
          icon: itemDef.icon || '🃏',
          cardImg: itemDef.cardImg || null,
          rarity: itemDef.rarity || null,
          type: itemDef.type || 'pack',
          desc: itemDef.desc || ''
        });
      }
      this.selectedInventoryItemId = itemDef.id;
      this.autoSave('item_added');
      this.renderInventoryModal();
      this.updateHUDSaveInfo();
    }

    getTotalInventoryCount() {
      return (this.inventory || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    }

    getSlottedBinderCount() {
      return (this.binderSlots || []).filter(s => Boolean(s)).length;
    }

    // -------------------------------------------------------------------------
    // Mythos Creature Catalog & High-Res Standalone Beast Database
    // -------------------------------------------------------------------------
    getCreatureData(beastId) {
      if (!beastId) return null;
      const cleanId = String(beastId).toLowerCase().replace('card_', '').trim();

      const catalog = {
        phoenix: {
          id: 'phoenix',
          name: 'Phoenix',
          element: 'fire',
          stars: 4,
          maxHp: 120,
          baseMove: 3,
          cardImg: 'Cards/Phoenix_Card.png',
          sprites: {
            idle: 'Sprites/Phoenix/Phoenix_idle_down_256x256.png',
            attack: 'Sprites/Phoenix/Phoenix_attack_flapping_256x256.png',
            walk: 'Sprites/Phoenix/Phoenix_fly_down_256x256.png',
            aoe: 'Sprites/Phoenix/Phoenix_attack_aoe_256x256.png'
          },
          skills: {
            atk1: { name: 'Flaming Talons', range: 1, dmg: 30, type: 'Target Attack', desc: 'Rakes the foe with searing solar talons, inflicting 30 fire damage.' },
            atk2: { name: 'Fire Orb', range: 0, dmg: '50% Reflect', type: 'Counter Stance', desc: 'Curls into a blazing sphere of incandescent flame, returning 50% of incoming attack damage back to the attacker.' },
            ability: { name: 'Trails of Fire', type: 'Passive Grid Hazard', desc: 'Leaves every traversed grid tile engulfed in roaring flames for 2 turns. Hostile creatures stepping on or ending their turn in a flame tile suffer 10 fire damage.' }
          },
          elementLore: 'A noble solar avian of legendary power. Commands supreme mastery of fire hazards, burning movement lanes, and punishing counter-strikes.'
        },
        earth_golem: {
          id: 'earth_golem',
          name: 'Earth Golem',
          element: 'earth',
          stars: 4,
          maxHp: 200,
          baseMove: 2,
          cardImg: 'Cards/Earth_Golem_Card.png',
          sprites: {
            idle: 'Sprites/Earth_Golem/Earth_Golem_idle_down_256x256.png',
            attack: 'Sprites/Earth_Golem/Earth_Golem_attack_crushing_grip_256x256.png',
            walk: 'Sprites/Earth_Golem/Earth_Golem_walk_down_256x256.png',
            aoe: 'Sprites/Earth_Golem/Earth_Golem_attack_rock_barrier_256x256.png'
          },
          skills: {
            atk1: { name: 'Crushing Grip', range: 1, dmg: 20, type: 'Immobilize', desc: 'Squeezes the opponent with colossal granite pressure for 20 damage and disables all enemy movement on their next turn.' },
            atk2: { name: 'Rock Barrier', range: 1, dmg: 'Stone Redoubt', type: 'Spawn Barrier', desc: 'Erects solid stone barrier walls on adjacent tiles (passable only by Earth elementals).' },
            ability: { name: 'Terraform', type: 'Passive Mobility Buff', desc: 'Draws seismic energy from stone fortifications, granting an extra +1 tile of movement whenever traversing Rock Barriers.' }
          },
          elementLore: 'A monolithic titan crafted from primeval bedrock. Boasts unmatched 200 HP resilience, battlefield lockdown, and terrain shaping.'
        },
        werewolf: {
          id: 'werewolf',
          name: 'Werewolf',
          element: 'earth',
          stars: 2,
          maxHp: 100,
          baseMove: 3,
          cardImg: 'Cards/Werewolf_Card.png',
          sprites: {
            idle: 'Sprites/Werewolf/Werewolf_idle_down_256x256.png',
            attack: 'Sprites/Werewolf/Werewolf_attack_claw_256x256.png',
            walk: 'Sprites/Werewolf/Werewolf_walk_down_256x256.png',
            aoe: 'Sprites/Werewolf/Werewolf_attack_howl_256x256.png'
          },
          skills: {
            atk1: { name: 'Rip Apart', range: 1, dmg: 20, type: 'Melee Strike', desc: 'Savagely slashes the opponent with vicious claws, dealing 20 damage.' },
            atk2: { name: 'Retreat', range: 0, dmg: '+1 Speed', type: 'Self Move Buff', desc: 'Leaps with predatory reflex, instantly granting 1 extra tile of movement this turn.' },
            ability: { name: 'Howl', type: 'Active Team Buff', desc: 'Unleashes an intimidating battle cry that boosts all allied cards\' attack damage by +10 to every move for 2 turns.' }
          },
          elementLore: 'A ferocious hunter of the wild woods. Specializes in rapid movement bursts, hit-and-run tactics, and team-wide damage buffs.'
        },
        hydra: {
          id: 'hydra',
          name: 'Hydra',
          element: 'poison',
          stars: 4,
          maxHp: 120,
          baseMove: 2,
          cardImg: 'Cards/Hydra_Card.png',
          sprites: {
            idle: 'Sprites/Hydra/Hydra_idle_down_256x256.png',
            attack: 'Sprites/Hydra/Hydra_attack_venom_spit_256x256.png',
            walk: 'Sprites/Hydra/Hydra_slither_down_256x256.png',
            aoe: 'Sprites/Hydra/Hydra_attack_thrash_aoe_256x256.png'
          },
          skills: {
            atk1: { name: 'Venomous Bite', range: 1, dmg: 20, type: 'Poison DOT', desc: 'Bites target with corrosive venom for 20 damage and inflicts poison (5 damage per turn for 2 turns).' },
            atk2: { name: 'Regrowth', range: 0, dmg: '+10 Heal', type: 'Passive Regeneration', desc: 'If the Hydra sustains any damage in a round, it regenerates +10 HP at the beginning of the next turn.' },
            ability: { name: 'Swamp Regenerator', type: 'Passive Healing Aura', desc: 'Radiates life-giving swamp vitality, restoring +10 HP at the beginning of each turn to any allied beast stationed on adjacent tiles.' }
          },
          elementLore: 'A multi-headed reptilian horror of the murky bayou. Inflicts lethal lingering poison while continuously rejuvenating itself and nearby allies.'
        },
        terra_mother: {
          id: 'terra_mother',
          name: 'Terra-Mother',
          element: 'earth',
          stars: 4,
          maxHp: 100,
          baseMove: 2,
          cardImg: 'Cards/Terra_Mother_Card.png',
          sprites: {
            idle: 'Sprites/Terra_Mother/Terra_Mother_idle_down_256x256.png',
            attack: 'Sprites/Terra_Mother/Terra_Mother_attack_root_crush_256x256.png',
            walk: 'Sprites/Terra_Mother/Terra_Mother_walk_down_256x256.png',
            aoe: 'Sprites/Terra_Mother/Terra_Mother_attack_ancient_saplings_256x256.png'
          },
          skills: {
            atk1: { name: 'Root Crush', range: 1, dmg: 35, type: 'Target Attack', desc: 'Summons subterranean primeval roots to crush the target for a devastating 35 damage.' },
            atk2: { name: 'Ram', range: 0, dmg: 25, type: 'Knockback', desc: 'Charges forward with immense mass for 25 damage, knocking hostiles directly ahead back 2 tiles.' },
            ability: { name: 'Thorn of Life', type: 'Passive Area Trap', desc: 'When staying stationed in the same tile for 3 consecutive turns, sharp thorns automatically sprout in a random adjacent tile.' }
          },
          elementLore: 'Ancient matriarch of forest ecology. Wields immense single-target crushing power, battlefield displacement, and organic thorn traps.'
        },
        verdant_guardian: {
          id: 'verdant_guardian',
          name: 'Verdant Guardian',
          element: 'plant',
          stars: 2,
          maxHp: 160,
          baseMove: 2,
          cardImg: 'Cards/Verdant_Guardian_Card.png',
          sprites: {
            idle: 'Sprites/Verdant_Guardian/Verdant_Guardian_idle_down_256x256.png',
            attack: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_branch_whip_256x256.png',
            walk: 'Sprites/Verdant_Guardian/Verdant_Guardian_walk_down_256x256.png',
            aoe: 'Sprites/Verdant_Guardian/Verdant_Guardian_attack_thorn_bush_256x256.png'
          },
          skills: {
            atk1: { name: 'Branch Whip', range: 1, dmg: 20, type: 'Target Attack', desc: 'Strikes enemy with heavy oak branches, dealing 20 plant damage.' },
            atk2: { name: 'Thorn Bush', range: 0, dmg: 10, type: 'AOE Burst', desc: 'Releases a sudden 360-degree burst of razor thorns, dealing 10 damage to all adjacent enemy beasts.' },
            ability: { name: 'Sapling Strength', type: 'Crisis Power Doubler', desc: 'When weakened to 1/4 health or below (≤ 40 HP), primordial sapling fury activates, doubling the damage of all moves!' }
          },
          elementLore: 'An ancient sentient ironwood tree. Endures heavy enemy fire with 160 HP and doubles its offensive potency when pushed to the brink of defeat.'
        },
        dwarf_warden: {
          id: 'dwarf_warden',
          name: 'Dwarf Warden',
          element: 'earth',
          stars: 4,
          maxHp: 140,
          baseMove: 2,
          cardImg: 'Cards/Dwarf_Warden_Card.png',
          sprites: {
            idle: 'Sprites/Dwarf_Warden/Dwarf_Warden_idle_down_256x256.png',
            attack: 'Sprites/Dwarf_Warden/Dwarf_Warden_attack_hammer_throw_256x256.png',
            walk: 'Sprites/Dwarf_Warden/Dwarf_Warden_walk_down_256x256.png',
            aoe: 'Sprites/Dwarf_Warden/Dwarf_Warden_defend_bullwark_256x256.png'
          },
          skills: {
            atk1: { name: 'Hammer Throw', range: 2, dmg: 25, type: 'Line Pierce', desc: 'Hurls an enchanted dwarven warhammer that penetrates the 2 tiles directly ahead, dealing 25 damage to each enemy beast.' },
            atk2: { name: 'Bullwark', range: 0, cooldown: 5, type: 'Defensive Stance', desc: 'Raises an impervious runic bulwark, completely negating the next incoming hostile attack (5-turn cooldown).' },
            ability: { name: 'Endurance', type: 'Late-Game Damage Halver', desc: 'Ancient subterranean grit. After turn 10, Dwarf Warden takes half damage from all incoming hostile strikes.' }
          },
          elementLore: 'A battle-hardened guardian of the subterranean mountain holds. Combines penetrating hammer throws with impenetrable runic shields and late-battle damage reduction.'
        },
        pegasus: {
          id: 'pegasus',
          name: 'Pegasus',
          element: 'air',
          stars: 3,
          maxHp: 120,
          baseMove: 3,
          cardImg: 'Cards/Pegasus_Card.png',
          sprites: {
            idle: 'Sprites/Pegasus/Pegasus_idle_down_256x256.png',
            attack: 'Sprites/Pegasus/Pegasus_attack_trample_256x256.png',
            walk: 'Sprites/Pegasus/Pegasus_walk_down_256x256.png',
            aoe: 'Sprites/Pegasus/Pegasus_inspire_256x256.png'
          },
          skills: {
            atk1: { name: 'Trample', range: 1, dmg: 30, type: 'Target Attack', desc: 'Charges forward with heavenly force, dealing 30 air damage.' },
            atk2: { name: 'Inspire', range: 0, type: 'Team Move Extension', desc: 'Gives up Pegasus\'s movement for the turn to extend all allies\' movement by 2 tiles.' },
            ability: { name: 'Soar', type: 'Flight Mobility', desc: 'Soars high above obstacles, flying over blocked tiles as long as it lands on a free tile.' }
          },
          elementLore: 'A winged steed of celestial sky realms. Endowed with soaring flight that bypasses ground blockades and inspires teammates to move with boundless haste.'
        },
        dreadnaught: {
          id: 'dreadnaught',
          name: 'Dreadnaught',
          element: 'metal',
          stars: 2,
          maxHp: 160,
          baseMove: 2,
          cardImg: 'Cards/Dreadnaught_Card.png',
          sprites: {
            idle: 'Sprites/Dreadnaught/Dreadnaught_idle_down_256x256.png',
            attack: 'Sprites/Dreadnaught/Dreadnaught_attack_magma_fist_256x256.png',
            walk: 'Sprites/Dreadnaught/Dreadnaught_walk_down_256x256.png',
            aoe: 'Sprites/Dreadnaught/Dreadnaught_attack_magma_fist_256x256.png'
          },
          skills: {
            atk1: { name: 'Magma Fist', range: 1, dmg: 25, type: 'Target & Hazard', desc: 'Deals 25 damage (35 when alone) and creates a permanent magma pool that burns non-fire units for 10 damage each turn.' },
            atk2: { name: 'Fortress', range: 1, cooldown: 4, type: 'Intercept Guard', desc: 'Blocks for an ally within a 3x3 range, intercepting all damage dealt to that ally for 1 turn (4-turn cooldown).' },
            ability: { name: 'Burning Heart', type: 'Last Stand Empowerment', desc: 'If all allies are defeated, Magma Fist damage increases to 35 and Dreadnaught can target itself with Fortress.' }
          },
          elementLore: 'A towering fortress of molten volcanic iron. Channels volcanic magma fist strikes, shields allies with impenetrable guard, and unleashes Burning Heart fury when fighting as the last defender standing.'
        }
      };

      return catalog[cleanId] || (window.BEAST_TEMPLATES && window.BEAST_TEMPLATES[cleanId]) || null;
    }

    // -------------------------------------------------------------------------
    // Player Backpack & Inventory Modal
    // -------------------------------------------------------------------------
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
      const putBinderBtn = document.getElementById('btn-inv-put-binder');
      const inspectBtn = document.getElementById('btn-inv-inspect');

      const totalCount = this.getTotalInventoryCount();
      if (badgeEl) badgeEl.textContent = String(totalCount);
      if (walletEl) walletEl.textContent = `💵 ${this.formatMoney(this.gold || 0)}`;
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
          if (actionsEl) actionsEl.classList.remove('hidden');
          if (openPackBtn) {
            openPackBtn.classList.remove('hidden');
            openPackBtn.onclick = () => this.startBoosterPackOpening(selectedItem.id);
          }
          putBinderBtn?.classList.add('hidden');
          inspectBtn?.classList.add('hidden');
        } else if (selectedItem.type === 'mythos_card' && selectedItem.cardImg) {
          artEl.innerHTML = `
            <div class="inv-card-art-thumb" style="width: 58px; height: 76px;">
              <img src="${selectedItem.cardImg}" alt="${selectedItem.name}">
            </div>
          `;
          if (actionsEl) actionsEl.classList.remove('hidden');
          openPackBtn?.classList.add('hidden');
          if (putBinderBtn) {
            if (this.hasOldCardBinder) {
              putBinderBtn.classList.remove('hidden');
              putBinderBtn.onclick = () => {
                this.insertCardIntoBinder(selectedItem.id);
                this.toggleInventoryModal(false);
                this.toggleBinderModal(true);
              };
            } else {
              putBinderBtn.classList.add('hidden');
            }
          }
          if (inspectBtn) {
            inspectBtn.classList.remove('hidden');
            inspectBtn.onclick = () => {
              this.toggleInventoryModal(false);
              this.openCreatureInspect(selectedItem, null);
            };
          }
        } else if (selectedItem.type === 'battle_map' || selectedItem.id === 'map_base2v2') {
          artEl.innerHTML = `
            <div class="inv-card-art-thumb" style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid #38bdf8;">
              <img src="${selectedItem.cardImg || 'Base2v2.png'}" alt="${selectedItem.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
          `;
          if (actionsEl) actionsEl.classList.remove('hidden');
          openPackBtn?.classList.add('hidden');
          putBinderBtn?.classList.add('hidden');
          if (inspectBtn) {
            inspectBtn.classList.remove('hidden');
            inspectBtn.textContent = '⚔️ Play 2v2 Match';
            inspectBtn.onclick = () => {
              this.toggleInventoryModal(false);
              this.open2v2BeastSelect();
            };
          }
        } else if (selectedItem.id === 'old_card_binder') {
          artEl.innerHTML = `<span style="font-size: 38px;">📖</span>`;
          if (actionsEl) actionsEl.classList.remove('hidden');
          openPackBtn?.classList.add('hidden');
          putBinderBtn?.classList.add('hidden');
          if (inspectBtn) {
            inspectBtn.classList.remove('hidden');
            inspectBtn.textContent = '📖 Open Old Card Binder';
            inspectBtn.onclick = () => {
              this.toggleInventoryModal(false);
              this.toggleBinderModal(true);
            };
          }
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
        descEl.textContent = "Your backpack has no items yet. Ask Mom for $25 and head to Leo's Card Shop on the far east block of the south road to buy your first Booster Pack!";
      }
    }

    // -------------------------------------------------------------------------
    // Currency & Shopkeeper Leo's Buy & Sell Counter
    // -------------------------------------------------------------------------
    formatMoney(val) {
      const num = Number(val) || 0;
      return `$${num.toFixed(2)}`;
    }

    getCardSellPrice(card) {
      const stars = Number(card?.stars) || 1;
      if (stars <= 1) return 0.10;
      if (stars === 2) return 0.20;
      if (stars === 3) return 0.35;
      return 0.50; // 4 stars and above
    }

    toggleShopModal(forceOpen, initialTab) {
      if (!this.hasBoughtCardShopPacks) {
        if (window.sounds?.playClick) window.sounds.playClick();
        return;
      }
      const modal = document.getElementById('shop-modal');
      if (!modal) return;
      const shouldOpen = forceOpen !== undefined ? forceOpen : modal.classList.contains('hidden');
      if (window.sounds?.playClick) window.sounds.playClick();
      if (shouldOpen) {
        if (initialTab) {
          this.currentShopTab = initialTab;
        }
        this.renderShopModal();
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    buyBaseCardPack() {
      const activeEvent = this.getCurrentDayEvent();
      const isDiscountDay = activeEvent?.id === 'weekend_market';
      const cost = isDiscountDay ? 8.00 : 10.00;
      if ((this.gold || 0) < cost) {
        if (window.sounds?.playClick) window.sounds.playClick();
        const statusEl = document.getElementById('shop-buy-status');
        if (statusEl) {
          statusEl.textContent = `⚠️ You don't have enough money! A Base Card Pack costs ${this.formatMoney(cost)}.`;
          statusEl.className = 'shop-buy-status error';
        }
        return;
      }

      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.gold = Math.round(((this.gold || 0) - cost) * 100) / 100;
      this.hasBoughtCardShopPacks = true;

      // Add 1 Unopened Mythos Base Set Booster Pack to Inventory
      this.addInventoryItem({
        id: 'unopened_base_pack',
        name: 'Unopened Mythos Base Card Pack',
        qty: 1,
        icon: '🃏',
        cardImg: 'Cards/Mythos_Card_Back.png',
        type: 'booster_pack',
        desc: `<b>Unopened Mythos Base Set Booster Pack (1st Edition)</b> — A factory-sealed foil booster pack featuring <b>The Seal of Mythos</b> and <b>3 Mythos Game Cards</b> inside. Click <b>✨ Open Booster Pack</b> to break the seal! <i>(Purchased at Leo's Card Shop for ${this.formatMoney(cost)})</i>`
      });

      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderShopModal();
      this.renderInventoryModal();

      const statusEl = document.getElementById('shop-buy-status');
      if (statusEl) {
        statusEl.textContent = `🎉 Purchased 1x 1st-Edition Mythos Base Card Pack for ${this.formatMoney(cost)}! Rip it open below or from your backpack.`;
        statusEl.className = 'shop-buy-status success';
      }

      const footerMsg = document.getElementById('shop-footer-msg');
      if (footerMsg) {
        footerMsg.innerHTML = `🛒 Purchased 1x Base Card Pack for ${this.formatMoney(cost)}! Remaining Wallet: <b>${this.formatMoney(this.gold)}</b>`;
        footerMsg.className = 'shop-footer-hint highlight';
      }
    }

    buyBase2v2Map() {
      const activeEvent = this.getCurrentDayEvent();
      const isDiscountDay = activeEvent?.id === 'silas_woodcraft';
      const cost = isDiscountDay ? 7.50 : 15.00;
      const statusEl = document.getElementById('shop-map-buy-status') || document.getElementById('shop-buy-status');

      if (this.hasBoughtBase2v2Map) {
        if (window.sounds?.playClick) window.sounds.playClick();
        if (statusEl) {
          statusEl.textContent = `ℹ️ You already own the Base2v2 Tactical Battle Map! Click "Play Base2v2 Now" to duel.`;
          statusEl.className = 'shop-buy-status success';
        }
        return;
      }

      if ((this.gold || 0) < cost) {
        if (window.sounds?.playClick) window.sounds.playClick();
        if (statusEl) {
          statusEl.textContent = `⚠️ You don't have enough money! The Base2v2 Battle Map costs ${this.formatMoney(cost)}. (Short ${this.formatMoney(cost - (this.gold || 0))})`;
          statusEl.className = 'shop-buy-status error';
        }
        return;
      }

      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.gold = Math.round(((this.gold || 0) - cost) * 100) / 100;
      this.hasBoughtBase2v2Map = true;

      // Add Base2v2 Battle Map to backpack inventory
      this.addInventoryItem({
        id: 'map_base2v2',
        name: 'Base2v2 Battle Map',
        qty: 1,
        icon: '🏟️',
        cardImg: 'Base2v2.png',
        type: 'battle_map',
        mapId: 'Base2v2',
        desc: `<b>Base2v2 Tactical Battle Map</b> — Official 6×6 tabletop arena bordered by ancient stones and wild ivy. Designed for fast-paced <b>2v2 Beast Duels</b>. Click <b>⚔️ Play 2v2 Match</b> to select 2 beasts from your backpack or binder and battle!`
      });

      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderShopModal();
      this.renderInventoryModal();

      if (statusEl) {
        statusEl.textContent = `🎉 Purchased Base2v2 Battle Map for ${this.formatMoney(cost)}! Choose 2 beasts from your inventory or binder to duel!`;
        statusEl.className = 'shop-buy-status success';
      }

      const footerMsg = document.getElementById('shop-footer-msg');
      if (footerMsg) {
        footerMsg.innerHTML = `🛒 Purchased Base2v2 Battle Map for ${this.formatMoney(cost)}! Remaining Wallet: <b>${this.formatMoney(this.gold)}</b>`;
        footerMsg.className = 'shop-footer-hint highlight';
      }
    }

    sellCardToShop(cardId, sellAll = false) {
      const itemIndex = (this.inventory || []).findIndex(i => i.id === cardId && i.type === 'mythos_card' && i.qty > 0);
      if (itemIndex < 0) return;

      const item = this.inventory[itemIndex];
      const unitPrice = this.getCardSellPrice(item);
      const qtyToSell = sellAll ? item.qty : 1;
      const totalEarned = Math.round(unitPrice * qtyToSell * 100) / 100;

      if (item.qty > qtyToSell) {
        item.qty -= qtyToSell;
      } else {
        this.inventory.splice(itemIndex, 1);
      }

      this.gold = Math.round(((this.gold || 0) + totalEarned) * 100) / 100;

      if (window.sounds?.playClick) window.sounds.playClick();

      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderShopModal();
      this.renderInventoryModal();

      const footerMsg = document.getElementById('shop-footer-msg');
      if (footerMsg) {
        footerMsg.innerHTML = `✅ Sold <b>${qtyToSell}× ${item.name}</b> to Leo for <b>+${this.formatMoney(totalEarned)}</b>! Wallet: <b>${this.formatMoney(this.gold)}</b>`;
        footerMsg.className = 'shop-footer-hint highlight';
      }
    }

    renderShopModal() {
      const modal = document.getElementById('shop-modal');
      if (!modal) return;

      const walletEl = document.getElementById('shop-wallet-display');
      if (walletEl) {
        walletEl.textContent = `💵 Wallet: ${this.formatMoney(this.gold || 0)}`;
      }

      const buyTabBtn = document.getElementById('shop-tab-buy');
      const sellTabBtn = document.getElementById('shop-tab-sell');
      const buyPanel = document.getElementById('shop-panel-buy');
      const sellPanel = document.getElementById('shop-panel-sell');

      const isBuy = this.currentShopTab === 'buy';
      buyTabBtn?.classList.toggle('active', isBuy);
      sellTabBtn?.classList.toggle('active', !isBuy);
      buyPanel?.classList.toggle('hidden', !isBuy);
      sellPanel?.classList.toggle('hidden', isBuy);

      // Buy Section - Booster Pack
      const buyBtn = document.getElementById('btn-shop-buy-pack');
      const ripNowBtn = document.getElementById('btn-shop-rip-now');
      const activeEvent = this.getCurrentDayEvent();
      const packCost = activeEvent?.id === 'weekend_market' ? 8.00 : 10.00;
      const hasMoneyForPack = (this.gold || 0) >= packCost;
      if (buyBtn) {
        buyBtn.disabled = !hasMoneyForPack;
        const discountTag = activeEvent?.id === 'weekend_market' ? ' 🏷️ [Saturday Sale!]' : '';
        buyBtn.innerHTML = hasMoneyForPack
          ? `🛒 Buy Base Card Pack (${this.formatMoney(packCost)})${discountTag}`
          : `🔒 Need ${this.formatMoney(packCost)} (Short ${this.formatMoney(packCost - (this.gold || 0))})`;
      }

      const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
      if (ripNowBtn) {
        ripNowBtn.classList.toggle('hidden', !hasUnopenedPack);
      }

      // Buy Section - Base2v2 Battle Map
      const mapBuyBtn = document.getElementById('btn-shop-buy-map');
      const mapPlayBtn = document.getElementById('btn-shop-play-map');
      const mapCost = activeEvent?.id === 'silas_woodcraft' ? 7.50 : 15.00;
      if (mapBuyBtn) {
        if (this.hasBoughtBase2v2Map) {
          mapBuyBtn.disabled = true;
          mapBuyBtn.innerHTML = `✅ Already Owned`;
          mapBuyBtn.classList.add('disabled');
          mapPlayBtn?.classList.remove('hidden');
        } else {
          const hasMoneyForMap = (this.gold || 0) >= mapCost;
          mapBuyBtn.disabled = !hasMoneyForMap;
          mapBuyBtn.classList.toggle('disabled', !hasMoneyForMap);
          const mapDiscountTag = activeEvent?.id === 'silas_woodcraft' ? ' 🪵 [Wednesday 50% Off!]' : '';
          mapBuyBtn.innerHTML = hasMoneyForMap
            ? `🛒 Buy Base2v2 Map (${this.formatMoney(mapCost)})${mapDiscountTag}`
            : `🔒 Need ${this.formatMoney(mapCost)} (Short ${this.formatMoney(mapCost - (this.gold || 0))})`;
          mapPlayBtn?.classList.add('hidden');
        }
      }

      // Sell Section (Strictly cards in backpack inventory, excluding binder slots)
      const looseCards = (this.inventory || []).filter(i => i.type === 'mythos_card' && i.qty > 0);
      const totalLooseCount = looseCards.reduce((s, i) => s + (i.qty || 0), 0);

      const countPill = document.getElementById('shop-sell-count-pill');
      if (countPill) {
        countPill.textContent = String(totalLooseCount);
      }

      const gridEl = document.getElementById('shop-sell-cards-grid');
      if (gridEl) {
        gridEl.innerHTML = '';
        if (looseCards.length === 0) {
          gridEl.innerHTML = `
            <div class="shop-empty-sell">
              <span class="shop-empty-icon">🎒</span>
              <p class="shop-empty-title">No Loose Cards in Backpack</p>
              <p class="shop-empty-desc">
                You have no Mythos cards in your backpack to sell right now.
                Cards stored safely in your <b>📖 Old Card Binder</b> are protected and cannot be sold unless you remove them to your backpack first!
              </p>
            </div>
          `;
        } else {
          looseCards.forEach(card => {
            const unitPrice = this.getCardSellPrice(card);
            const stars = Number(card.stars) || 1;
            const starText = '★'.repeat(stars);

            const row = document.createElement('div');
            row.className = 'shop-sell-row';

            const artSrc = card.cardImg || 'Cards/Mythos_Card_Back.png';
            const elementName = card.element || 'Mythos';

            row.innerHTML = `
              <div class="shop-sell-card-left">
                <div class="shop-sell-card-thumb shop-sell-thumb-box" title="Click to inspect ${card.name} in high-res">
                  <img src="${artSrc}" alt="${card.name}" class="shop-sell-thumb" onerror="this.src='Cards/Mythos_Card_Back.png'">
                  <span class="shop-sell-qty-badge">x${card.qty}</span>
                </div>
                <div class="shop-sell-card-info">
                  <div class="shop-sell-card-name" title="${card.name}">${card.name}</div>
                  <div class="shop-sell-card-badges">
                    <span class="shop-sell-badge element-${elementName.toLowerCase()}">${elementName}</span>
                    <span class="shop-sell-badge stars">${starText} (${stars}★)</span>
                    <span class="shop-sell-badge qty">x${card.qty} loose</span>
                  </div>
                  <div class="shop-sell-price-tag">Leo's Offer: <b>${this.formatMoney(unitPrice)}</b> each</div>
                </div>
              </div>
              <div class="shop-sell-card-actions">
                <button type="button" class="ui-btn primary-btn shop-sell-btn sell-one">
                  💵 Sell 1 (+${this.formatMoney(unitPrice)})
                </button>
                ${card.qty > 1 ? `
                  <button type="button" class="ui-btn secondary shop-sell-btn sell-all">
                    Sell All x${card.qty} (+${this.formatMoney(unitPrice * card.qty)})
                  </button>
                ` : ''}
              </div>
            `;

            const thumbEl = row.querySelector('.shop-sell-card-thumb');
            thumbEl?.addEventListener('click', (ev) => {
              ev.stopPropagation();
              this.toggleShopModal(false);
              this.openCreatureInspect(card, null);
            });

            const sellOneBtn = row.querySelector('.sell-one');
            sellOneBtn?.addEventListener('click', (ev) => {
              ev.stopPropagation();
              this.sellCardToShop(card.id, false);
            });

            const sellAllBtn = row.querySelector('.sell-all');
            sellAllBtn?.addEventListener('click', (ev) => {
              ev.stopPropagation();
              this.sellCardToShop(card.id, true);
            });

            gridEl.appendChild(row);
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // BASE2V2 2v2 BEAST SELECTION SYSTEM (Inventory & Binder)
    // -------------------------------------------------------------------------
    getPlayerAllBeasts() {
      const beasts = [];

      // 1. From Backpack Inventory
      (this.inventory || []).forEach(item => {
        if (item.type === 'mythos_card' && item.qty > 0) {
          const bId = item.beastId || (item.id && item.id.replace('card_', ''));
          if (bId && window.BEAST_TEMPLATES && window.BEAST_TEMPLATES[bId]) {
            const tmpl = window.BEAST_TEMPLATES[bId];
            for (let q = 0; q < Math.min(item.qty, 2); q++) {
              beasts.push({
                uniqueKey: `inv_${item.id}_${q}`,
                beastId: bId,
                name: item.name || tmpl.name,
                element: item.element || tmpl.element,
                stars: item.stars || tmpl.stars || 1,
                hp: tmpl.maxHp,
                cardImg: item.cardImg || tmpl.cardImg,
                source: 'backpack',
                sourceLabel: '🎒 Backpack'
              });
            }
          }
        }
      });

      // 2. From Binder Slots
      (this.binderSlots || []).forEach((slotCard, idx) => {
        if (slotCard) {
          const bId = slotCard.beastId || (slotCard.id && slotCard.id.replace('card_', ''));
          if (bId && window.BEAST_TEMPLATES && window.BEAST_TEMPLATES[bId]) {
            const tmpl = window.BEAST_TEMPLATES[bId];
            beasts.push({
              uniqueKey: `binder_${idx}_${bId}`,
              beastId: bId,
              name: slotCard.name || tmpl.name,
              element: slotCard.element || tmpl.element,
              stars: slotCard.stars || tmpl.stars || 1,
              hp: tmpl.maxHp,
              cardImg: slotCard.cardImg || tmpl.cardImg,
              source: 'binder',
              sourceLabel: `📖 Binder #${idx + 1}`
            });
          }
        }
      });

      return beasts;
    }

    open2v2BeastSelect(challenger = null) {
      this.activeChallengerFor2v2 = challenger;
      this.duoSelectedBeasts = [];
      this.beastSelectFilter = 'all';

      const modal = document.getElementById('beast-select-2v2-modal');
      if (!modal) return;

      // Auto-prefill first 2 available beasts if available for player convenience
      const allBeasts = this.getPlayerAllBeasts();
      if (allBeasts.length >= 1) this.duoSelectedBeasts.push(allBeasts[0]);
      if (allBeasts.length >= 2) this.duoSelectedBeasts.push(allBeasts[1]);

      this.render2v2BeastSelect();
      modal.classList.remove('hidden');
      if (window.sounds?.playClick) window.sounds.playClick();
    }

    close2v2BeastSelect() {
      const modal = document.getElementById('beast-select-2v2-modal');
      if (modal) modal.classList.add('hidden');
      this.activeChallengerFor2v2 = null;
      if (window.sounds?.playClick) window.sounds.playClick();
    }

    render2v2BeastSelect() {
      const allBeasts = this.getPlayerAllBeasts();
      const filteredBeasts = this.beastSelectFilter === 'all'
        ? allBeasts
        : allBeasts.filter(b => b.source === this.beastSelectFilter);

      // Update Filter counts
      const countAll = document.getElementById('filter-count-all');
      const countBp = document.getElementById('filter-count-backpack');
      const countBi = document.getElementById('filter-count-binder');
      if (countAll) countAll.textContent = String(allBeasts.length);
      if (countBp) countBp.textContent = String(allBeasts.filter(b => b.source === 'backpack').length);
      if (countBi) countBi.textContent = String(allBeasts.filter(b => b.source === 'binder').length);

      // Update Filter tabs active state
      document.querySelectorAll('.filter-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === this.beastSelectFilter);
      });

      // Render Duo Slots (Slot 0 and Slot 1)
      for (let s = 0; s < 2; s++) {
        const slotBox = document.getElementById(`duo-slot-${s}`);
        const contentEl = document.getElementById(`duo-content-${s}`);
        const selected = this.duoSelectedBeasts[s];

        if (slotBox && contentEl) {
          if (selected) {
            slotBox.classList.add('filled');
            contentEl.className = 'duo-slot-content has-card';
            contentEl.innerHTML = `
              <div class="duo-slot-thumb">
                <img src="${selected.cardImg}" alt="${selected.name}">
              </div>
              <div class="duo-slot-details">
                <div class="duo-slot-name">${selected.name}</div>
                <div class="duo-slot-meta">
                  <span class="element-tag ${selected.element}">${selected.element}</span>
                  <span>HP: ${selected.hp}</span>
                  <span>${selected.sourceLabel}</span>
                </div>
              </div>
              <button type="button" class="duo-slot-remove-btn" title="Remove from Duo">✕</button>
            `;
            const removeBtn = contentEl.querySelector('.duo-slot-remove-btn');
            if (removeBtn) {
              removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.duoSelectedBeasts.splice(s, 1);
                this.render2v2BeastSelect();
              });
            }
          } else {
            slotBox.classList.remove('filled');
            contentEl.className = 'duo-slot-content empty';
            contentEl.innerHTML = `
              <span class="duo-empty-plus">+</span>
              <span class="duo-empty-text">Select Beast ${s + 1}</span>
            `;
          }
        }
      }

      // Render Beasts Cards Grid
      const grid = document.getElementById('beast-select-cards-grid');
      if (grid) {
        grid.innerHTML = '';
        if (allBeasts.length === 0) {
          grid.innerHTML = `
            <div class="beast-select-empty-box">
              <div class="beast-select-empty-icon">🎒</div>
              <p><b>No Beasts Available!</b></p>
              <p style="font-size: 13px;">You don't have any Mythos cards in your Backpack or Old Card Binder yet. Open your booster packs to discover beasts!</p>
            </div>
          `;
        } else if (filteredBeasts.length === 0) {
          grid.innerHTML = `
            <div class="beast-select-empty-box">
              <p>No beasts found in this tab.</p>
            </div>
          `;
        } else {
          filteredBeasts.forEach(beast => {
            const isSelectedIdx = this.duoSelectedBeasts.findIndex(b => b.uniqueKey === beast.uniqueKey);
            const isSelected = isSelectedIdx !== -1;

            const cardItem = document.createElement('div');
            cardItem.className = `beast-select-card-item ${isSelected ? 'selected' : ''}`;

            cardItem.innerHTML = `
              <div class="beast-select-card-art">
                <img src="${beast.cardImg}" alt="${beast.name}">
                <span class="beast-select-source-tag">${beast.sourceLabel}</span>
                ${isSelected ? `<span class="beast-select-selected-badge">${isSelectedIdx + 1}</span>` : ''}
              </div>
              <div class="beast-select-card-info">
                <div class="beast-select-card-name">${beast.name}</div>
                <div class="beast-select-card-meta">
                  <span class="element-tag ${beast.element}">${beast.element}</span>
                  <span>HP ${beast.hp}</span>
                </div>
              </div>
            `;

            cardItem.addEventListener('click', () => {
              if (window.sounds?.playClick) window.sounds.playClick();
              if (isSelected) {
                // Deselect
                this.duoSelectedBeasts.splice(isSelectedIdx, 1);
              } else {
                // If fewer than 2 selected, add
                if (this.duoSelectedBeasts.length < 2) {
                  this.duoSelectedBeasts.push(beast);
                } else {
                  // Replace Slot 2
                  this.duoSelectedBeasts[1] = beast;
                }
              }
              this.render2v2BeastSelect();
            });

            grid.appendChild(cardItem);
          });
        }
      }

      // Update Launch Button
      const launchBtn = document.getElementById('btn-launch-2v2');
      if (launchBtn) {
        const isReady = this.duoSelectedBeasts.length === 2;
        launchBtn.disabled = !isReady;
        if (isReady) {
          const b1 = this.duoSelectedBeasts[0].name;
          const b2 = this.duoSelectedBeasts[1].name;
          launchBtn.innerHTML = `⚔️ Enter Base2v2 Arena (${b1} & ${b2})`;
        } else {
          const needed = 2 - this.duoSelectedBeasts.length;
          launchBtn.innerHTML = `⚔️ Enter Base2v2 Arena (Select ${needed} More Beast${needed > 1 ? 's' : ''})`;
        }
      }
    }

    launch2v2Match() {
      if (this.duoSelectedBeasts.length < 2) return;
      const b1 = this.duoSelectedBeasts[0].beastId;
      const b2 = this.duoSelectedBeasts[1].beastId;
      const challenger = this.activeChallengerFor2v2;

      this.close2v2BeastSelect();

      if (window.sounds?.playRock) {
        window.sounds.playRock();
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.triggerDuel(challenger, 'Base2v2', [b1, b2]);
    }

    // -------------------------------------------------------------------------
    // OLD CARD BINDER (9 Protective Card Pocket Sleeves - Awarded Upon Friend Defeat)
    // -------------------------------------------------------------------------
    grantOldCardBinder(challenger) {
      this.hasOldCardBinder = true;
      this.friendDefeatedRewardPending = true;

      // Add "Old Card Binder" to inventory backpack if not already present
      if (!this.inventory.some(i => i.id === 'old_card_binder')) {
        this.inventory.unshift({
          id: 'old_card_binder',
          name: 'Old Card Binder',
          qty: 1,
          icon: '📖',
          type: 'binder_item',
          desc: '<b>Old Card Binder</b> — A well-loved 9-pocket collector card binder awarded to you by your friend after you defeated him in battle. Holds 9 cards in clear protective sleeves and unlocks <b>Creature Inspect Mode</b> to analyze moves, types, and abilities!'
        });
      }

      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
    }

    handlePlutoBattleResult(won) {
      const activeEvent = this.getCurrentDayEvent();
      const wager = activeEvent?.id === 'pluto_double_wager' ? 2.00 : 1.00;
      if (won) {
        this.gold = Math.round(((this.gold || 0) + wager) * 100) / 100;
        this.plutoBattleResult = 'won';
      } else {
        this.gold = Math.max(0, Math.round(((this.gold || 0) - wager) * 100) / 100);
        this.plutoBattleResult = 'lost';
      }
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
    }

    handleMayaBattleResult(won) {
      this.mayaBattleResult = won ? 'won' : 'lost';
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
    }

    handleSilasBattleResult(won) {
      if (won) {
        this.gold = Math.round(((this.gold || 0) + 2.00) * 100) / 100;
        this.silasBattleResult = 'won';
        if (!this.inventory.some(i => i.id === 'card_dwarf_warden')) {
          this.inventory.push({
            id: 'card_dwarf_warden',
            beastId: 'dwarf_warden',
            name: 'Dwarf Warden (Holo)',
            qty: 1,
            icon: '🛡️',
            type: 'mythos_card',
            desc: '<b>Dwarf Warden (Holo)</b> — Signature foil card gifted by Silas from his Workshop. Features unbreakable Shield Wall defense.'
          });
        }
      } else {
        this.silasBattleResult = 'lost';
      }
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
    }

    handleNovaBattleResult(won) {
      if (won) {
        this.gold = Math.round(((this.gold || 0) + 2.00) * 100) / 100;
        this.novaBattleResult = 'won';
        if (!this.inventory.some(i => i.id === 'card_pegasus')) {
          this.inventory.push({
            id: 'card_pegasus',
            beastId: 'pegasus',
            name: 'Pegasus (Holo)',
            qty: 1,
            icon: '🪽',
            type: 'mythos_card',
            desc: '<b>Pegasus (Holo)</b> — Signature celestial card gifted by Nova at the Stargazer Observatory. Can soar across any terrain hazard.'
          });
        }
      } else {
        this.novaBattleResult = 'lost';
      }
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
    }

    onReturnFromBattle(challenger) {
      if (challenger?.id === 'pluto') {
        if (this.plutoNpc) {
          this.plutoNpc.bubble = this.plutoBattleResult === 'won' ? '🤝' : '😏';
        }
        if (this.plutoBattleResult === 'won') {
          if (window.sounds?.playVictory) window.sounds.playVictory();
        } else if (this.plutoBattleResult === 'lost') {
          if (window.sounds?.playHit) window.sounds.playHit();
        }
        this.activeDialogueNpc = 'pluto';
        this.updateFreeRoamPrompt();
        return;
      }
      if (challenger?.id === 'nova' || challenger?.id === 'silas' || challenger?.id === 'maya') {
        if (window.sounds?.playVictory) window.sounds.playVictory();
        this.activeDialogueNpc = challenger.id;
        this.updateFreeRoamPrompt();
        return;
      }
      if (this.friendDefeatedRewardPending) {
        this.friendDefeatedRewardPending = false;
        const fName = challenger?.name || this.friendName || 'Mike';

        // Friend stands facing player with celebratory gift bubble
        this.storyState = 'friend_defeated_celebration';
        if (this.npcs[0]) {
          this.npcs[0].bubble = '🎁';
          this.npcs[0].dir = 'right';
        }

        if (window.sounds?.playVictory) {
          window.sounds.playVictory();
        }

        this.renderDialogueUI();
      }
    }

    toggleBinderModal(forceOpen) {
      if (!this.hasOldCardBinder) {
        if (window.sounds?.playClick) window.sounds.playClick();
        alert(`🔒 The Old Card Binder is locked!\n\nBattle and defeat ${this.friendName || 'your friend'} in Mythos at his house to win his "Old Card Binder"!`);
        return;
      }
      const modal = document.getElementById('binder-modal');
      if (!modal) return;
      const shouldOpen = forceOpen !== undefined ? forceOpen : modal.classList.contains('hidden');
      if (window.sounds?.playClick) window.sounds.playClick();
      if (shouldOpen) {
        this.renderBinderModal();
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    renderBinderModal() {
      const gridEl = document.getElementById('binder-slots-grid');
      const counterPill = document.getElementById('binder-counter-pill');
      const binderBadgeEl = document.getElementById('binder-badge-count');

      const slottedCount = this.getSlottedBinderCount();
      if (counterPill) {
        counterPill.textContent = `${slottedCount} / 9 Sleeves Filled`;
      }
      if (binderBadgeEl) {
        binderBadgeEl.textContent = String(slottedCount);
      }
      if (!gridEl) return;

      gridEl.innerHTML = '';

      for (let i = 0; i < 9; i++) {
        const card = this.binderSlots[i];
        const slotEl = document.createElement('div');

        if (card) {
          slotEl.className = 'binder-slot slotted';
          slotEl.innerHTML = `
            <div class="binder-card-thumb-wrap">
              <img src="${card.cardImg}" alt="${card.name}" class="binder-card-thumb-img">
            </div>
            <div class="binder-card-info-row">
              <span class="binder-card-name">${card.shortName || card.name}</span>
              <span class="binder-card-element-pill ${card.element?.toLowerCase() || 'fire'}">${card.element || 'Beast'}</span>
            </div>
            <div class="binder-slot-hover-bar">
              <button type="button" class="binder-slot-btn inspect">🔍 Inspect</button>
              <button type="button" class="binder-slot-btn remove">📤 To Inventory</button>
            </div>
          `;

          // Clicking anywhere on the card or the inspect button opens Creature Inspect Mode!
          slotEl.addEventListener('click', (ev) => {
            if (ev.target.closest('.binder-slot-btn.remove')) return;
            if (window.sounds?.playClick) window.sounds.playClick();
            this.openCreatureInspect(card, i);
          });

          const removeBtn = slotEl.querySelector('.binder-slot-btn.remove');
          if (removeBtn) {
            removeBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              this.removeCardFromBinder(i);
            });
          }
        } else {
          slotEl.className = 'binder-slot empty';
          slotEl.innerHTML = `
            <div class="binder-empty-btn">
              <span style="font-size: 20px;">➕</span>
              <span>Insert Card</span>
            </div>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Sleeve #${i + 1}</span>
          `;

          slotEl.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.openBinderCardPicker(i);
          });
        }

        gridEl.appendChild(slotEl);
      }
    }

    // Binder Card Picker Modal (Select card from backpack to insert into sleeve)
    openBinderCardPicker(targetSlotIndex) {
      this.binderPickerTargetIndex = targetSlotIndex;
      const modal = document.getElementById('binder-picker-modal');
      const targetLabel = document.getElementById('binder-picker-target-label');
      const grid = document.getElementById('binder-picker-cards-grid');

      if (!modal || !grid) return;

      if (targetLabel) {
        targetLabel.textContent = `Sleeve #${targetSlotIndex + 1}`;
      }

      grid.innerHTML = '';
      const cardItems = (this.inventory || []).filter(item => item.type === 'mythos_card' && item.qty > 0);

      if (cardItems.length === 0) {
        grid.innerHTML = `
          <div style="color: var(--text-muted); padding: 24px; text-align: center; grid-column: 1 / -1; font-size: 13px;">
            🎒 No unslotted Mythos cards in your backpack!<br>
            <span style="font-size: 11px; opacity: 0.8;">Open more Booster Packs at Leo's Card Shop or remove cards from your binder to insert here.</span>
          </div>
        `;
      } else {
        cardItems.forEach(cardItem => {
          const opt = document.createElement('div');
          opt.className = 'picker-card-option';
          opt.innerHTML = `
            <div class="picker-card-thumb">
              <img src="${cardItem.cardImg}" alt="${cardItem.name}">
            </div>
            <div class="picker-card-name">${cardItem.shortName || cardItem.name}</div>
            <span style="font-size: 10px; color: #fde047;">(x${cardItem.qty} in bag)</span>
          `;
          opt.addEventListener('click', () => {
            this.insertCardIntoBinder(cardItem.id, this.binderPickerTargetIndex);
          });
          grid.appendChild(opt);
        });
      }

      modal.classList.remove('hidden');
    }

    closeBinderCardPicker() {
      const modal = document.getElementById('binder-picker-modal');
      modal?.classList.add('hidden');
      this.binderPickerTargetIndex = null;
    }

    // Insert a single card from Inventory into a designated binder slot
    insertCardIntoBinder(cardId, targetSlotIndex = null) {
      let destIndex = targetSlotIndex;
      if (destIndex === null || destIndex === undefined || destIndex < 0 || destIndex >= 9) {
        destIndex = this.binderSlots.findIndex(s => !s);
      }
      if (destIndex === -1) {
        alert('All 9 binder sleeves are full! Remove a card to make room.');
        return;
      }

      const invIndex = this.inventory.findIndex(i => i.id === cardId && i.qty > 0);
      if (invIndex === -1) return;

      const item = this.inventory[invIndex];

      // Remove 1 quantity from inventory
      item.qty -= 1;
      if (item.qty <= 0) {
        this.inventory.splice(invIndex, 1);
      }

      // Slip into binder sleeve
      this.binderSlots[destIndex] = {
        id: item.id,
        beastId: item.beastId || item.id.replace('card_', ''),
        name: item.name,
        shortName: item.shortName || item.name,
        element: item.element || 'Fire',
        stars: item.stars || 4,
        cardImg: item.cardImg,
        desc: item.desc || ''
      };

      if (window.sounds?.playCardFlipReveal) {
        window.sounds.playCardFlipReveal(false);
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      this.saveWorldData(this.draftAppearance);
      this.closeBinderCardPicker();
      this.renderBinderModal();
      this.renderInventoryModal();
      this.updateHUDSaveInfo();
    }

    // Remove a single card from the binder and return it to backpack inventory
    removeCardFromBinder(slotIndex) {
      if (slotIndex < 0 || slotIndex >= 9) return;
      const card = this.binderSlots[slotIndex];
      if (!card) return;

      this.binderSlots[slotIndex] = null;

      // Add back into player's inventory
      this.addInventoryItem({
        id: card.id,
        beastId: card.beastId,
        name: card.name,
        shortName: card.shortName,
        element: card.element,
        stars: card.stars,
        qty: 1,
        icon: '🃏',
        cardImg: card.cardImg,
        type: 'mythos_card',
        desc: card.desc
      });

      if (window.sounds?.playClick) window.sounds.playClick();

      this.saveWorldData(this.draftAppearance);
      this.renderBinderModal();
      this.renderInventoryModal();
      this.updateHUDSaveInfo();
    }

    // -------------------------------------------------------------------------
    // CREATURE INSPECT MODE (Very Large Standalone Creature Picture, Moves & Abilities)
    // -------------------------------------------------------------------------
    openCreatureInspect(card, slotIndex = null) {
      if (!card) return;
      this.inspectingCard = card;
      this.inspectingSlotIndex = slotIndex;
      this.inspectingPose = 'idle';

      const beast = this.getCreatureData(card.beastId || card.id);
      if (!beast) return;

      const modal = document.getElementById('creature-inspect-modal');
      const crestEl = document.getElementById('inspect-element-crest');
      const tagEl = document.getElementById('inspect-element-tag');
      const nameEl = document.getElementById('inspect-creature-name');
      const circleEl = document.getElementById('inspect-magic-circle');
      const hpVal = document.getElementById('inspect-hp-val');
      const moveVal = document.getElementById('inspect-move-val');
      const starsVal = document.getElementById('inspect-stars-val');

      const elBoxName = document.getElementById('inspect-element-full');
      const elBoxDesc = document.getElementById('inspect-element-desc');

      const m1Name = document.getElementById('inspect-move1-name');
      const m1Dmg = document.getElementById('inspect-move1-dmg');
      const m1Range = document.getElementById('inspect-move1-range');
      const m1Desc = document.getElementById('inspect-move1-desc');

      const m2Name = document.getElementById('inspect-move2-name');
      const m2Dmg = document.getElementById('inspect-move2-dmg');
      const m2Range = document.getElementById('inspect-move2-range');
      const m2Desc = document.getElementById('inspect-move2-desc');

      const abName = document.getElementById('inspect-ability-name');
      const abDesc = document.getElementById('inspect-ability-desc');

      const removeBtn = document.getElementById('btn-inspect-remove-from-binder');

      const elIcons = { fire: '🔥', earth: '🪨', poison: '🐍', plant: '🍃', air: '☁️' };
      const elColors = { fire: '#ef4444', earth: '#eab308', poison: '#a855f7', plant: '#22c55e', air: '#38bdf8' };
      const elKey = beast.element.toLowerCase();

      if (crestEl) crestEl.textContent = elIcons[elKey] || '✨';
      if (tagEl) {
        tagEl.textContent = `${beast.element.toUpperCase()} ELEMENT`;
        tagEl.style.borderColor = elColors[elKey] || '#fbbf24';
        tagEl.style.color = elColors[elKey] || '#fbbf24';
      }
      if (nameEl) nameEl.textContent = beast.name.toUpperCase();
      if (circleEl) {
        circleEl.style.borderColor = elColors[elKey] || '#fbbf24';
        circleEl.style.boxShadow = `0 0 24px ${elColors[elKey] || '#fbbf24'}, inset 0 0 16px ${elColors[elKey] || '#fbbf24'}`;
      }

      if (hpVal) hpVal.textContent = `${beast.maxHp} HP`;
      if (moveVal) moveVal.textContent = `${beast.baseMove} Tiles / Turn`;
      if (starsVal) starsVal.textContent = '★'.repeat(beast.stars || 4);

      if (elBoxName) elBoxName.innerHTML = `${elIcons[elKey] || '✨'} ${beast.element.toUpperCase()} ELEMENT BEAST`;
      if (elBoxDesc) elBoxDesc.textContent = beast.elementLore || '';

      // Moves
      const atk1 = beast.skills.atk1 || {};
      const atk2 = beast.skills.atk2 || {};
      const ability = beast.skills.ability || {};

      if (m1Name) m1Name.textContent = atk1.name || 'Attack 1';
      if (m1Dmg) m1Dmg.textContent = typeof atk1.dmg === 'number' ? `${atk1.dmg} DMG` : (atk1.dmg || 'Special');
      if (m1Range) m1Range.textContent = `Range: ${atk1.range ?? 1}`;
      if (m1Desc) m1Desc.textContent = atk1.desc || '';

      if (m2Name) m2Name.textContent = atk2.name || 'Attack 2';
      if (m2Dmg) m2Dmg.textContent = typeof atk2.dmg === 'number' ? `${atk2.dmg} DMG` : (atk2.dmg || atk2.type || 'Special');
      if (m2Range) m2Range.textContent = `Range: ${atk2.range ?? 0}`;
      if (m2Desc) m2Desc.textContent = atk2.desc || '';

      // Ability
      if (abName) abName.textContent = ability.name || 'Special Ability';
      if (abDesc) abDesc.textContent = ability.desc || '';

      // Large standalone creature picture (NOT IN CARD FORM!)
      this.updateInspectCreatureImage();

      // Configure Remove from Binder button
      if (removeBtn) {
        if (slotIndex !== null && slotIndex !== undefined) {
          removeBtn.classList.remove('hidden');
          removeBtn.innerHTML = `📤 Remove from Sleeve #${slotIndex + 1} to Inventory`;
          removeBtn.onclick = () => {
            this.removeCardFromBinder(slotIndex);
            this.closeCreatureInspect();
          };
        } else {
          removeBtn.classList.remove('hidden');
          removeBtn.innerHTML = `📖 Place Card into Binder Sleeve`;
          removeBtn.onclick = () => {
            this.insertCardIntoBinder(card.id);
            this.closeCreatureInspect();
            this.toggleBinderModal(true);
          };
        }
      }

      if (modal) modal.classList.remove('hidden');
    }

    setInspectPose(pose) {
      this.inspectingPose = pose;
      document.querySelectorAll('#inspect-pose-buttons .pose-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.pose === pose);
      });
      this.updateInspectCreatureImage();
      if (window.sounds?.playClick) window.sounds.playClick();
    }

    updateInspectCreatureImage() {
      const imgEl = document.getElementById('inspect-creature-img');
      if (!imgEl || !this.inspectingCard) return;

      const beast = this.getCreatureData(this.inspectingCard.beastId || this.inspectingCard.id);
      if (!beast || !beast.sprites) return;

      const poseKey = this.inspectingPose || 'idle';
      const spritePath = beast.sprites[poseKey] || beast.sprites.idle || beast.sprites.idle_down;
      if (spritePath) {
        imgEl.src = spritePath;
        imgEl.alt = `${beast.name} Standalone Artwork (${poseKey})`;
      }
    }

    closeCreatureInspect() {
      const modal = document.getElementById('creature-inspect-modal');
      modal?.classList.add('hidden');
      this.inspectingCard = null;
      this.inspectingSlotIndex = null;
      this.renderBinderModal();
    }

    // -------------------------------------------------------------------------
    // Theatrical & Suspenseful Booster Pack Opening Ritual (3 Cards Per Pack)
    // -------------------------------------------------------------------------
    rollThreePackCards() {
      const catalog = this.getBaseSetCardCatalog();
      // Shuffle a copy of the Base Set catalog and draw 3 cards for this Booster Pack
      const pool = [...catalog];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const drawn = pool.slice(0, 3).map(c => ({ ...c }));
      const activeEvent = this.getCurrentDayEvent();
      if (activeEvent?.id === 'leo_restock') {
        // Monday: Leo's Booster Restock - +25% Holo & Rare Foil Surge!
        drawn.forEach((c, idx) => {
          if (idx === 0 || Math.random() < 0.5) {
            c.isHolo = true;
          }
        });
      }
      return drawn;
    }

    startBoosterPackOpening(packItemId = 'unopened_base_pack') {
      const packItem = this.inventory.find(i => i.id === packItemId && i.qty > 0);
      if (!packItem) return;

      // Close the inventory or shop modal so the full-screen Pack Opening Stage takes center stage
      this.toggleInventoryModal(false);
      this.toggleShopModal(false);

      this.packOpeningState = {
        packItemId,
        chargeClicks: 0,
        isRipping: false,
        cardsDealt: false,
        pulledCards: this.rollThreePackCards(),
        currentCardIndex: 0,
        flippedIndices: new Set(),
        collected: false
      };

      const modal = document.getElementById('pack-opening-modal');
      const badgeEl = document.getElementById('pack-stage-badge');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const sealedZone = document.getElementById('pack-sealed-zone');
      const wrapper = document.getElementById('sealed-booster-wrapper');
      const ring = document.getElementById('pack-energy-ring');
      const cardsRow = document.getElementById('pack-cards-reveal-row');
      const nextBtn = document.getElementById('btn-pack-next-card');
      const viewAllBtn = document.getElementById('btn-pack-view-all');
      const collectBtn = document.getElementById('btn-pack-collect');
      const flashBang = document.getElementById('pack-flash-bang');

      if (!modal || !wrapper || !sealedZone || !cardsRow) return;

      // Reset stage UI to Phase 1 (Sealed Booster Pack)
      if (badgeEl) badgeEl.textContent = '✨ MYTHOS BASE SET • 1ST EDITION BOOSTER ✨';
      if (titleEl) titleEl.textContent = 'BREAK THE SEAL OF MYTHOS';
      if (subEl) {
        subEl.innerHTML = 'Click the sealed Booster Pack <b>3 times</b> to charge <b>The Seal of Mythos</b> and tear open the foil!';
      }
      sealedZone.classList.remove('hidden');
      wrapper.className = 'sealed-booster-wrapper';
      if (ring) ring.className = 'pack-energy-ring';
      ['seal-pip-1', 'seal-pip-2', 'seal-pip-3'].forEach(id => {
        document.getElementById(id)?.classList.remove('lit');
      });

      cardsRow.innerHTML = '';
      cardsRow.className = 'pack-cards-reveal-row hidden';
      nextBtn?.classList.add('hidden');
      viewAllBtn?.classList.add('hidden');
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
        if (titleEl) titleEl.textContent = 'THE SEAL OF MYTHOS AWAKENS...';
        if (subEl) subEl.innerHTML = 'Golden runes are glowing beneath the foil! Click <b>2 more times</b> to unseal!';
      } else if (st.chargeClicks === 2) {
        if (window.sounds?.playPackSuspense) window.sounds.playPackSuspense();
        wrapper?.classList.remove('charge-shake-1');
        wrapper?.classList.add('charge-shake-2');
        ring?.classList.remove('charge-1');
        ring?.classList.add('charge-2');
        if (titleEl) titleEl.textContent = 'THE SEAL OF MYTHOS SURGES!!';
        if (subEl) subEl.innerHTML = 'The pack is trembling with elemental energy! Click <b>1 final time</b> to RIP IT OPEN!';
      } else if (st.chargeClicks >= 3) {
        // RIP OPEN THE FOIL PACK!
        st.isRipping = true;
        if (window.sounds?.playPackRip) window.sounds.playPackRip();
        wrapper?.classList.remove('charge-shake-1', 'charge-shake-2');
        wrapper?.classList.add('ripping');

        const flashBang = document.getElementById('pack-flash-bang');
        if (flashBang) {
          flashBang.classList.remove('hidden');
          setTimeout(() => {
            flashBang.classList.add('hidden');
          }, 780);
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
          this.presentSinglePackCard(0);
        }, 560);
      }
    }

    // -------------------------------------------------------------------------
    // Phase 2: Show Each Card 1 At A Time Before Moving To The Next
    // -------------------------------------------------------------------------
    presentSinglePackCard(idx) {
      const st = this.packOpeningState;
      if (!st) return;
      st.cardsDealt = true;
      st.currentCardIndex = idx;

      const sealedZone = document.getElementById('pack-sealed-zone');
      const cardsRow = document.getElementById('pack-cards-reveal-row');
      const badgeEl = document.getElementById('pack-stage-badge');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const nextBtn = document.getElementById('btn-pack-next-card');
      const viewAllBtn = document.getElementById('btn-pack-view-all');
      const collectBtn = document.getElementById('btn-pack-collect');
      const flashBang = document.getElementById('pack-flash-bang');

      flashBang?.classList.add('hidden');
      sealedZone?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      viewAllBtn?.classList.add('hidden');
      collectBtn?.classList.add('hidden');

      const card = st.pulledCards[idx];
      const isFinal = (idx === st.pulledCards.length - 1);

      if (badgeEl) {
        badgeEl.textContent = `✨ MYTHOS BASE SET • CARD ${idx + 1} OF ${st.pulledCards.length} ✨`;
      }
      if (titleEl) {
        titleEl.textContent = isFinal ? '✨ FINAL CARD OF THE PACK ✨' : `CARD ${idx + 1} OF ${st.pulledCards.length}`;
      }
      if (subEl) {
        subEl.innerHTML = 'Hover or tap to feel its energy — <b>Click the card to unseal & reveal!</b>';
      }

      if (!cardsRow) return;
      cardsRow.innerHTML = '';
      cardsRow.className = 'pack-cards-reveal-row single-card-mode';
      cardsRow.classList.remove('hidden');

      const slot = document.createElement('div');
      slot.className = 'pack-card-slot single-pack-card rarity-mythic';
      slot.id = 'active-pack-card';

      slot.innerHTML = `
        <div class="pack-card-inner">
          <!-- Face-Down Back using Cleaned Mythos_Card_Back.png -->
          <div class="pack-card-face pack-card-back">
            <img src="Cards/Mythos_Card_Back.png" alt="Mythos Card Back">
            <div class="pack-card-back-prompt">✨ CLICK TO REVEAL</div>
          </div>
          <!-- Face-Up Revealed Beast Card -->
          <div class="pack-card-face pack-card-front">
            <span class="pack-card-rarity-banner mythic">${card.badgeLabel}</span>
            <img src="${card.cardImg}" alt="${card.name}">
            <div class="pack-card-holo-glint"></div>
          </div>
        </div>
      `;

      slot.addEventListener('click', () => {
        this.flipCurrentPackCard(idx, slot);
      });

      cardsRow.appendChild(slot);
      this.updateMobileActionLabel();
    }

    flipCurrentPackCard(idx, slotEl) {
      const st = this.packOpeningState;
      if (!st || !st.cardsDealt || st.flippedIndices.has(idx)) return;

      st.flippedIndices.add(idx);
      const card = st.pulledCards[idx];
      slotEl.classList.add('flipped');

      if (window.sounds?.playCardFlipReveal) {
        window.sounds.playCardFlipReveal(true);
      }

      const badgeEl = document.getElementById('pack-stage-badge');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const nextBtn = document.getElementById('btn-pack-next-card');
      const viewAllBtn = document.getElementById('btn-pack-view-all');
      const collectBtn = document.getElementById('btn-pack-collect');

      if (badgeEl) {
        badgeEl.textContent = `✨ CARD ${idx + 1} REVEALED • ${card.badgeLabel} ✨`;
      }
      if (titleEl) {
        titleEl.textContent = `✨ ${card.shortName.toUpperCase()} REVEALED! ✨`;
      }
      if (subEl) {
        subEl.innerHTML = `<b>${card.name}</b> • <span class="element-tag ${card.element}">${card.element.toUpperCase()}</span> • ${card.stars}★<br><span style="font-size: 12.5px; color: var(--text-muted);">${card.desc}</span>`;
      }

      // Check if there are more cards to open in this pack
      if (idx < st.pulledCards.length - 1) {
        if (nextBtn) {
          nextBtn.textContent = `Next Card ▸ (Open Card ${idx + 2} of ${st.pulledCards.length})`;
          nextBtn.classList.remove('hidden');
        }
      } else {
        // All 3 cards have been opened!
        if (viewAllBtn) {
          viewAllBtn.classList.remove('hidden');
        }
        if (collectBtn) {
          collectBtn.classList.remove('hidden');
        }
      }
      this.updateMobileActionLabel();
    }

    advanceToNextPackCard() {
      const st = this.packOpeningState;
      if (!st || st.currentCardIndex >= st.pulledCards.length - 1) return;

      if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      const activeSlot = document.getElementById('active-pack-card');
      if (activeSlot) {
        activeSlot.classList.add('sliding-out');
        setTimeout(() => {
          this.presentSinglePackCard(st.currentCardIndex + 1);
        }, 220);
      } else {
        this.presentSinglePackCard(st.currentCardIndex + 1);
      }
    }

    showPackSummaryAllCards() {
      const st = this.packOpeningState;
      if (!st) return;

      if (window.sounds?.playClick) {
        window.sounds.playClick();
      }

      const badgeEl = document.getElementById('pack-stage-badge');
      const titleEl = document.getElementById('pack-stage-title');
      const subEl = document.getElementById('pack-stage-subtitle');
      const nextBtn = document.getElementById('btn-pack-next-card');
      const viewAllBtn = document.getElementById('btn-pack-view-all');
      const collectBtn = document.getElementById('btn-pack-collect');
      const cardsRow = document.getElementById('pack-cards-reveal-row');

      if (badgeEl) badgeEl.textContent = '✨ BOOSTER PACK COMPLETE ✨';
      if (titleEl) titleEl.textContent = '✨ ALL 3 CARDS PULLED! ✨';
      if (subEl) subEl.innerHTML = 'All 3 Mythos Cards unsealed! Collect them to add them to your backpack inventory:';

      nextBtn?.classList.add('hidden');
      viewAllBtn?.classList.add('hidden');
      collectBtn?.classList.remove('hidden');

      if (!cardsRow) return;
      cardsRow.innerHTML = '';
      cardsRow.className = 'pack-cards-reveal-row summary-mode';

      st.pulledCards.forEach((card, idx) => {
        const slot = document.createElement('div');
        slot.className = 'pack-card-slot flipped rarity-mythic';
        slot.style.animationDelay = `${idx * 0.12}s`;
        slot.innerHTML = `
          <div class="pack-card-inner">
            <div class="pack-card-face pack-card-front">
              <span class="pack-card-rarity-banner mythic">${card.badgeLabel}</span>
              <img src="${card.cardImg}" alt="${card.name}">
              <div class="pack-card-holo-glint"></div>
            </div>
          </div>
        `;
        cardsRow.appendChild(slot);
      });
      this.updateMobileActionLabel();
    }

    revealAllRemainingPackCards() {
      const st = this.packOpeningState;
      if (!st || !st.cardsDealt) return;
      const activeSlot = document.getElementById('active-pack-card');
      if (activeSlot && !st.flippedIndices.has(st.currentCardIndex)) {
        this.flipCurrentPackCard(st.currentCardIndex, activeSlot);
      }
    }

    collectPulledCardsToInventory() {
      const st = this.packOpeningState;
      if (!st || st.collected) return;
      st.collected = true;

      if (window.sounds?.playVictory) {
        window.sounds.playVictory();
      }

      // Add each of the 3 pulled Mythos Cards directly into the Player's Inventory!
      st.pulledCards.forEach(card => {
        this.addInventoryItem({
          id: card.id,
          beastId: card.beastId,
          name: card.name,
          shortName: card.shortName,
          element: card.element,
          stars: card.stars,
          qty: 1,
          icon: '🃏',
          cardImg: card.cardImg,
          type: 'mythos_card',
          desc: card.desc
        });
      });

      this.hasOpenedStarterPack = true;
      this.storyState = 'friend_challenges_after_pack';
      this.excitedBounceTicks = 110;
      if (this.npcs[0]) {
        this.npcs[0].bubble = '⚔️';
        this.npcs[0].dir = 'left';
      }
      if (this.shopkeeperNpc) {
        this.shopkeeperNpc.bubble = '🤩';
      }
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderInventoryModal();
      this.renderShopModal();

      const modal = document.getElementById('pack-opening-modal');
      modal?.classList.add('hidden');

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
      this.dayNumber = 1;
      this.hasMomBoosterMoney = false;
      this.migratedMom25 = false;
      this.hasBoughtCardShopPacks = false;
      this.hasBoughtBase2v2Map = false;
      this.hasOpenedStarterPack = false;
      this.friendWaitingAtHouse = false;
      this.hasOldCardBinder = false;
      this.friendDefeatedRewardPending = false;
      this.inventory = [];
      this.selectedInventoryItemId = null;
      this.binderSlots = Array(9).fill(null);
      this.npcs = [this.createFriendNpc(this.friendName)];
      this.saveWorldData(this.draftAppearance);
      this.renderInventoryModal();
      this.renderBinderModal();

      this.storyState = 'intro_waiting';
      this.activeDialogueNpc = null;
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
        // Player's Mother steps right inside from work and walks into the living room in real time!
        if (window.sounds?.playMove) window.sounds.playMove();
        const mom = this.createMomNpc();
        if (!this.npcs.some(n => n.id === 'mom')) {
          this.npcs.push(mom);
        }
        this.storyState = 'free_roam';
        this.activeDialogueNpc = null;
        this.player.dir = 'down';
        if (this.npcs[0]) {
          this.npcs[0].dir = 'down';
          this.npcs[0].bubble = '🤩';
        }
        this.renderDialogueUI();
      } else if (this.storyState === 'mom_gave_money') {
        this.storyState = 'free_roam';
        this.activeDialogueNpc = null;
        this.renderDialogueUI();
      } else if (this.storyState === 'shop_bought_packs') {
        this.storyState = 'free_roam';
        this.activeDialogueNpc = null;
        this.renderDialogueUI();
      } else if (this.storyState === 'must_open_pack_before_leaving') {
        const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
        if (hasUnopenedPack) {
          this.startBoosterPackOpening('unopened_base_pack');
        } else {
          this.storyState = 'free_roam';
          this.activeDialogueNpc = null;
          this.renderDialogueUI();
        }
      } else if (this.storyState === 'friend_challenges_after_pack') {
        this.storyState = 'free_roam';
        this.activeDialogueNpc = null;
        const friend = this.npcs[0];
        if (friend) {
          friend.following = false;
          friend.leavingForHouse = true;
          friend.bubble = '🏃';
          friend.targetX = 9.8;
          friend.targetY = 10.45;
        }
        this.renderDialogueUI();
      } else if (this.storyState === 'friend_defeated_celebration') {
        this.storyState = 'free_roam';
        this.activeDialogueNpc = null;
        if (this.npcs[0]) {
          this.npcs[0].bubble = '⚔️';
        }
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
        desc: `<b>Unopened Mythos Base Set Booster Pack (1st Edition)</b> — A factory-sealed foil booster pack featuring <b>The Seal of Mythos</b> and <b>3 Mythos Game Cards</b> inside. Click <b>✨ Open Booster Pack</b> below to break the seal! <i>(Purchased at Leo's Card Shop with ${this.friendName}, who got the other pack!)</i>`
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
      this.gold = (this.gold || 0) + 25; // $25 added to player inventory (leaves $5 after buying $20 packs)!
      this.migratedMom25 = true;
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

    isNpc(interactable) {
      if (!interactable) return false;
      const id = interactable.id;
      return id === 'friend' || id === 'best_friend' || id === 'friend_duel' || id === 'mom' || id === 'shopkeeper' || id === 'pluto' || id === 'nova' || id === 'silas' || id === 'maya' || id === 'chloe' || id === 'rowan' || id === 'jasper' || interactable === this.npcs[0] || interactable === this.shopkeeperNpc || interactable === this.plutoNpc || interactable === this.novaNpc || interactable === this.silasNpc || interactable === this.mayaNpc || interactable === this.chloeNpc || interactable === this.rowanNpc || interactable === this.jasperNpc;
    }

    startTalkingToNpc(npcId) {
      if (window.sounds?.playClick) window.sounds.playClick();
      const actualId = (npcId === 'friend' || npcId === 'best_friend' || npcId === this.friendName || (this.npcs[0] && npcId === this.npcs[0].id))
        ? (this.currentArea === 'friend_interior' ? 'friend_duel' : 'friend')
        : npcId;

      this.activeDialogueNpc = actualId;

      if (this.storyState === 'intro_waiting' && (actualId === 'friend' || actualId === 'best_friend' || actualId === this.friendName)) {
        this.storyState = 'intro_bored';
        this.renderDialogueUI();
        return;
      }

      this.lastShopPromptKey = null;
      this.updateFreeRoamPrompt();
    }

    closeDialogue() {
      this.activeDialogueNpc = null;
      if (this.storyState === 'intro_bored') {
        this.storyState = 'intro_waiting';
      }
      this.lastShopPromptKey = null;
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

      bar.classList.remove('top-position');
      const friendName = this.npcs[0].name;
      const playerName = this.draftAppearance?.name || 'Asher';

      if (this.storyState === 'intro_waiting') {
        this.updateFreeRoamPrompt();
        this.updateMobileActionLabel();
        return;
      }

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
        textEl.innerHTML = `<b>${friendName}:</b> "NO WAY!! Did you see those Beasts?! <b>MYTHOS</b> looks incredible — we HAVE to get Booster Packs right now!"<br><b>${playerName}:</b> "Totally!! If we can get enough money for <b>2 Booster Packs</b> at <b>Leo's Card Shop</b>, we can both build a deck!"`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Continue ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'mom_gave_money') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        bar.classList.add('top-position');
        speakerEl.textContent = '💝 MOM (+$25 ADDED TO INVENTORY)';
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.innerHTML = `<b>Mom:</b> "Two <b>MYTHOS Booster Packs</b> so you and ${friendName} can play together? Better than being bored on Day 2 of summer! Here's <b>$25</b> — that leaves you with <b>$5</b> to spare after getting both packs! Head down the road to <b>Leo's Card Shop</b> and pick them out!"`;

        choicesEl.classList.add('hidden');
        nextBtn.textContent = 'Awesome, Thanks Mom! ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'shop_bought_packs') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `🃏 SHOPKEEPER LEO & ${friendName.toUpperCase()} (PACKS ACQUIRED!!)`;
        speakerEl.className = 'ow-speaker-tag tv';
        textEl.innerHTML = `<b>Shopkeeper Leo:</b> "Two <b>1st-Edition MYTHOS Base Set Booster Packs</b> coming right up! One for you, ${playerName}, and one for ${friendName}! Go ahead and rip your pack open right here in <b>Leo's Card Shop</b>!"<br><b>🎒 Inventory Updated:</b> <b>1× Unopened Mythos Base Card Pack</b> added to your Backpack!`;

        choicesEl.innerHTML = '';
        const openNowBtn = document.createElement('button');
        openNowBtn.type = 'button';
        openNowBtn.className = 'ow-choice-btn';
        openNowBtn.innerHTML = `✨ "Let's open my <b>Mythos Base Card Pack</b> right now!"`;
        openNowBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.startBoosterPackOpening('unopened_base_pack');
        });
        choicesEl.appendChild(openNowBtn);
        choicesEl.classList.remove('hidden');

        nextBtn.textContent = 'Continue ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'must_open_pack_before_leaving') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `🃏 ${friendName.toUpperCase()} & SHOPKEEPER LEO`;
        speakerEl.className = 'ow-speaker-tag tv';
        textEl.innerHTML = `<b>${friendName}:</b> "Whoa, hold up ${playerName}! Don't leave <b>Leo's Card Shop</b> without opening the <b>Mythos Base Card Pack</b> you just got from Leo!"<br><b>Shopkeeper Leo:</b> "That's the best part! Break <b>The Seal of Mythos</b> and see which 3 cards you pulled before you head out!"`;

        choicesEl.innerHTML = '';
        const openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'ow-choice-btn';
        openBtn.innerHTML = `✨ "You're right! Let's open my <b>Mythos Base Card Pack</b> right now!"`;
        openBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.startBoosterPackOpening('unopened_base_pack');
        });
        choicesEl.appendChild(openBtn);
        choicesEl.classList.remove('hidden');

        nextBtn.textContent = '✨ Open Booster Pack ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'friend_challenges_after_pack') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `⚔️ ${friendName.toUpperCase()} (CHALLENGES YOU TO A BATTLE!!)`;
        speakerEl.className = 'ow-speaker-tag friend';
        const pulledList = (this.inventory || [])
          .filter(i => i.type === 'mythos_card')
          .map(i => `<b>${i.name.replace(' (Mythos Card)', '')}</b>`)
          .join(', ');
        textEl.innerHTML = `<b>${friendName}:</b> "NO WAY!! You pulled ${pulledList || '3 awesome cards'}?! I just opened my pack from Leo too! I'm heading back to <b>my house</b> right now to set up the tabletop board — come meet me there for a <b>MYTHOS Battle</b> whenever you're ready!"`;

        choicesEl.innerHTML = '';
        const acceptBtn = document.createElement('button');
        acceptBtn.type = 'button';
        acceptBtn.className = 'ow-choice-btn';
        acceptBtn.innerHTML = `⚔️ "You're on, ${friendName}! Head to <b>${friendName}'s House</b> and I'll meet you there for our battle!"`;
        acceptBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.advanceStoryStep();
        });
        const viewCardsBtn = document.createElement('button');
        viewCardsBtn.type = 'button';
        viewCardsBtn.className = 'ow-choice-btn';
        viewCardsBtn.innerHTML = `🎒 Inspect My 3 Pulled Cards in Inventory (I)`;
        viewCardsBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.toggleInventoryModal(true);
        });
        choicesEl.appendChild(acceptBtn);
        choicesEl.appendChild(viewCardsBtn);
        choicesEl.classList.remove('hidden');

        nextBtn.textContent = "Let's Go! ▸";
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else if (this.storyState === 'friend_defeated_celebration') {
        bar.classList.remove('hidden');
        bar.classList.remove('tv-broadcast');
        speakerEl.textContent = `🎁 ${friendName.toUpperCase()} — DEFEATED IN MYTHOS BATTLE!`;
        speakerEl.className = 'ow-speaker-tag friend';
        textEl.innerHTML = `<b>${friendName}:</b> "Whoa, ${playerName}... that was unbelievable!! You completely wiped out my team! A promise is a promise — here is my brother's <b>Old Card Binder</b>! It has 9 protective sleeves to keep your cards safe and inspect their moves, types, and abilities anytime you want!"`;

        choicesEl.innerHTML = '';
        const openBinderBtn = document.createElement('button');
        openBinderBtn.type = 'button';
        openBinderBtn.className = 'ow-choice-btn';
        openBinderBtn.innerHTML = `📖 Open the <b>Old Card Binder</b> (Press B)`;
        openBinderBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.advanceStoryStep();
          this.toggleBinderModal(true);
        });
        const thankBtn = document.createElement('button');
        thankBtn.type = 'button';
        thankBtn.className = 'ow-choice-btn';
        thankBtn.innerHTML = `🤝 "Thanks, ${friendName}! That was an epic battle!"`;
        thankBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.advanceStoryStep();
        });
        choicesEl.appendChild(openBinderBtn);
        choicesEl.appendChild(thankBtn);
        choicesEl.classList.remove('hidden');

        nextBtn.textContent = 'Claim Reward ▸';
        nextBtn.classList.remove('hidden');
        challengeBtn.classList.add('hidden');
      } else {
        this.updateFreeRoamPrompt();
      }
      this.updateMobileActionLabel();
    }

    updateFreeRoamPrompt() {
      if (this.storyState !== 'free_roam' && this.storyState !== 'intro_waiting') return;
      const bar = document.getElementById('ow-dialog-bar');
      const speakerEl = document.getElementById('ow-speaker-tag');
      const textEl = document.getElementById('ow-dialog-text');
      const choicesEl = document.getElementById('ow-choices-container');
      const nextBtn = document.getElementById('ow-btn-next');
      const challengeBtn = document.getElementById('ow-btn-challenge');
      if (!bar) return;

      if (challengeBtn) {
        challengeBtn.onclick = null;
      }
      if (nextBtn) {
        nextBtn.onclick = null;
      }

      bar.classList.remove('top-position');
      choicesEl?.classList.add('hidden');
      nextBtn?.classList.add('hidden');

      if (this.currentArea === 'interior') {
        this.lastShopPromptKey = null;
        const friend = this.npcs[0];
        const mom = this.npcs.find(n => n.id === 'mom');
        const distToMom = mom ? Math.hypot(this.player.x - mom.x, this.player.y - mom.y) : 999;
        const distToFriend = (friend && !this.friendWaitingAtHouse) ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;
        const distToTv = Math.hypot(this.player.x - 7.3, this.player.y - 4.3);
        const distToBed = Math.hypot(this.player.x - 3.2, this.player.y - 5.3);

        if (mom && distToMom < 1.85) {
          this.nearInteractable = mom;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          bar.classList.add('top-position');
          speakerEl.textContent = '💼 MOM';
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'mom') {
            challengeBtn.classList.remove('ow-talk-btn');
            if (!this.hasMomBoosterMoney) {
              textEl.textContent = `"Hey sweetheart! You and ${friend.name} look like you're about to burst with excitement. Did you want to ask me something?"`;
              challengeBtn.textContent = '💵 Ask Mom for Booster Money ($25)';
              challengeBtn.classList.remove('hidden');
            } else if (this.hasOpenedStarterPack) {
              textEl.textContent = `"You pulled 3 MYTHOS cards from Leo's Card Shop? Have fun battling ${friend.name} next door at his house!"`;
              challengeBtn.classList.add('hidden');
            } else {
              textEl.textContent = `"Have fun at Leo's Card Shop down the road! You'll still have $5 left over after buying both booster packs with that $25!"`;
              challengeBtn.classList.add('hidden');
            }
          } else {
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Mom</b>.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToFriend < 1.8) {
          this.nearInteractable = friend;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          if (this.player.y >= 7.5 || friend.y >= 7.5) {
            bar.classList.add('top-position');
          }
          speakerEl.textContent = friend.name.toUpperCase();
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.storyState === 'intro_waiting') {
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>${friend.name}</b>.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          } else if (this.activeDialogueNpc === 'friend' || this.activeDialogueNpc === friend.name) {
            challengeBtn.classList.remove('ow-talk-btn');
            if (!this.hasMomBoosterMoney) {
              textEl.textContent = `"Dude, your Mom just got home from work! Go ask her if we can get enough money to buy 2 MYTHOS Booster Packs at Leo's Card Shop!"`;
            } else if (this.hasOpenedStarterPack) {
              textEl.textContent = `"We both pulled 3 awesome cards from Leo's Card Shop! Let's head next door to my house so we can battle!"`;
            } else {
              textEl.textContent = `"YES!! Your Mom gave us $25! That's enough for both $10 packs plus $5 left over! Let's head out the front door, walk south, and follow the road east to Leo's Card Shop!"`;
            }
            challengeBtn.classList.add('hidden');
          } else {
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>${friend.name}</b>.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToTv < 1.6) {
          this.nearInteractable = { id: 'tv', name: 'TV' };
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.remove('hidden');
          bar.classList.add('tv-broadcast');
          speakerEl.textContent = '📺 LIVING ROOM TV';
          speakerEl.className = 'ow-speaker-tag tv';
          textEl.innerHTML = `<i>"🔥 MYTHOS BOOSTER PACKS: Just $10 a pack at Leo's Card Shop! Collect Phoenix, Earth Golem, Hydra, Werewolf & more!"</i>`;
          challengeBtn.classList.add('hidden');
        } else if (distToBed < 1.7) {
          this.nearInteractable = { id: 'player_bed', name: 'Bed' };
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          bar.classList.remove('top-position');
          speakerEl.textContent = '🛏️ YOUR BED';
          speakerEl.className = 'ow-speaker-tag friend';
          const nextDayIdx = (this.getCurrentDayIndex() + 1) % 7;
          const nextDayName = this.DAYS_OF_WEEK[nextDayIdx];
          const nextDayNum = (this.dayNumber || 1) + 1;
          const nextEvent = this.WEEKLY_CALENDAR[nextDayIdx];
          textEl.innerHTML = `Your bed looks warm and cozy. Rest for the night and advance the town calendar to <b>${nextDayName} (Day ${nextDayNum})</b>? <i>(Next event: ${nextEvent.title})</i>`;
          challengeBtn.textContent = '💤 Sleep & Advance Day (Space)';
          challengeBtn.classList.remove('hidden');
        } else {
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'friend_interior') {
        const fName = this.friendName || 'Mike';
        const pName = this.draftAppearance?.name || 'Asher';
        const friend = this.npcs[0];
        const distToFriend = friend ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;
        const distToTable = Math.hypot(this.player.x - 5.5, this.player.y - 6.8);

        if (distToFriend < 2.2 || distToTable < 1.85) {
          this.nearInteractable = { id: 'friend_duel', name: fName };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `⚔️ ${fName.toUpperCase()} — READY TO BATTLE AT ${fName.toUpperCase()}'S HOUSE!`;
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'friend_duel') {
            challengeBtn.classList.remove('ow-talk-btn');
            const friendDuelKey = `friend_interior_duel_${fName}_${pName}_${this.hasOldCardBinder}`;
            if (this.lastShopPromptKey !== friendDuelKey) {
              this.lastShopPromptKey = friendDuelKey;
              choicesEl.innerHTML = '';
              if (this.hasOldCardBinder) {
                textEl.innerHTML = `<b>${fName}:</b> "That was such an awesome match, ${pName}! How is that <b>Old Card Binder</b> working out for you? You can slot up to 9 cards into it, inspect their standalone art, and test new builds in battle! Want a rematch?!"`;
                const binderBtn = document.createElement('button');
                binderBtn.type = 'button';
                binderBtn.className = 'ow-choice-btn';
                binderBtn.innerHTML = `📖 Open the <b>Old Card Binder</b> (Press B)`;
                binderBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.toggleBinderModal(true);
                });
                const rematchBtn = document.createElement('button');
                rematchBtn.type = 'button';
                rematchBtn.className = 'ow-choice-btn';
                rematchBtn.innerHTML = `⚔️ "I'm ready for a rematch, ${fName}! Let's battle!"`;
                rematchBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.triggerDuel();
                });
                choicesEl.appendChild(binderBtn);
                choicesEl.appendChild(rematchBtn);
              } else {
                textEl.innerHTML = `<b>${fName}:</b> "Welcome to my house, ${pName}!! I've got the <b>MYTHOS Tabletop Arena</b> set up right here on my table with the 3 cards I pulled from Leo's pack! Defeat me and I'll give you my brother's <b>Old Card Binder</b>! Ready to battle?!"`;
                const duelBtn = document.createElement('button');
                duelBtn.type = 'button';
                duelBtn.className = 'ow-choice-btn';
                duelBtn.innerHTML = `⚔️ "I'm ready, ${fName}! Let's battle in <b>MYTHOS</b>!"`;
                duelBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.triggerDuel();
                });
                choicesEl.appendChild(duelBtn);
              }
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = this.hasOldCardBinder ? `⚔️ Rematch ${fName}!` : `⚔️ Battle ${fName}!`;
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>${fName}</b> at the duel table.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
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
          speakerEl.textContent = "🃏 SHOPKEEPER LEO — LEO'S CARD SHOP";
          speakerEl.className = 'ow-speaker-tag tv';

          if (this.activeDialogueNpc === 'shopkeeper') {
            challengeBtn.classList.remove('ow-talk-btn');

            if (!this.hasBoughtCardShopPacks) {
              // ---------------------------------------------------------------
              // INTRO QUEST: Buy 2 Booster Packs ($20) for Asher & Best Friend
              // ---------------------------------------------------------------
              const hasMoney = (this.gold || 0) >= 20;
              const shopKey = `keeper_intro_${hasMoney}_${pName}_${fName}`;
              if (this.lastShopPromptKey !== shopKey) {
                this.lastShopPromptKey = shopKey;
                textEl.innerHTML = `"Welcome to <b>Leo's Card Shop</b>, ${pName} and ${fName}!! Have you seen the new <b>MYTHOS</b> game?! It's unbelievable — elemental Beasts, tactical grid movement, and high-impact abilities! Every duelist in town is losing their minds over the Base Set!"`;
                choicesEl.innerHTML = '';

                const buyBtn = document.createElement('button');
                buyBtn.type = 'button';
                buyBtn.className = 'ow-choice-btn primary';
                if (hasMoney) {
                  buyBtn.innerHTML = `💬 "We saw the commercial! Can we buy <b>2 MYTHOS Base Set Booster Packs ($20)</b> — one for me and one for ${fName}?"`;
                  buyBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.buyTwoBoosterPacks();
                  });
                } else {
                  buyBtn.innerHTML = `💬 "We want to buy 2 Booster Packs ($20), one for me and one for ${fName}! <i>(Need $20 — ask Mom at home first!)</i>"`;
                  buyBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (window.sounds?.playClick) window.sounds.playClick();
                  });
                }
                choicesEl.appendChild(buyBtn);
              }
              choicesEl.classList.remove('hidden');
              challengeBtn.textContent = hasMoney ? '💵 Buy 2 Packs ($20)' : '💵 Need $20';
              challengeBtn.classList.toggle('hidden', !hasMoney);
            } else {
              // ---------------------------------------------------------------
              // UNLOCKED: Leo's Buy & Sell Counter ($10 packs / 10¢-50¢ buyback)
              // ---------------------------------------------------------------
              const hasMoneyForPack = (this.gold || 0) >= 10;
              const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
              const looseCardCount = (this.inventory || []).filter(i => i.type === 'mythos_card' && i.qty > 0).reduce((s, i) => s + (i.qty || 0), 0);

              const shopKey = `keeper_unlocked_${hasMoneyForPack}_${hasUnopenedPack}_${looseCardCount}_${pName}_${fName}`;
              if (this.lastShopPromptKey !== shopKey) {
                this.lastShopPromptKey = shopKey;
                textEl.innerHTML = `"Welcome back to the counter, ${pName}! Now that you and ${fName} have your starter packs, feel free to use our <b>Buy &amp; Sell Counter</b>: grab more 1st-Edition <b>Mythos Base Card Packs for $10</b>, or trade in extra cards from your backpack for cash (10¢ for 1★ up to 50¢ for 4★)!"`;

                choicesEl.innerHTML = '';

                // Choice 1: Open Shop (Buy & Sell)
                const openShopBtn = document.createElement('button');
                openShopBtn.type = 'button';
                openShopBtn.className = 'ow-choice-btn primary';
                openShopBtn.innerHTML = `🛒 "Let's check out your <b>Buy &amp; Sell Counter</b>!"`;
                openShopBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.toggleShopModal(true);
                });
                choicesEl.appendChild(openShopBtn);

                // Choice 2: Buy Base Card Pack ($10)
                const buyPackBtn = document.createElement('button');
                buyPackBtn.type = 'button';
                buyPackBtn.className = 'ow-choice-btn';
                if (hasMoneyForPack) {
                  buyPackBtn.innerHTML = `📦 "I'd like to buy a <b>1st-Edition Base Card Pack ($10.00)</b>!"`;
                  buyPackBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.buyBaseCardPack();
                  });
                } else {
                  buyPackBtn.innerHTML = `📦 "I'd like a Base Card Pack ($10.00)..." <i>(Wallet: ${this.formatMoney(this.gold || 0)} — need $10.00)</i>`;
                  buyPackBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.toggleShopModal(true, 'buy');
                  });
                }
                choicesEl.appendChild(buyPackBtn);

                // Choice 3: Sell Cards (if player has loose cards)
                if (looseCardCount > 0) {
                  const sellCardsBtn = document.createElement('button');
                  sellCardsBtn.type = 'button';
                  sellCardsBtn.className = 'ow-choice-btn';
                  sellCardsBtn.innerHTML = `💵 "I have <b>${looseCardCount} card${looseCardCount > 1 ? 's' : ''}</b> in my backpack to sell!"`;
                  sellCardsBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.toggleShopModal(true, 'sell');
                  });
                  choicesEl.appendChild(sellCardsBtn);
                }

                // Choice 4: Rip Unopened Pack (if player has unopened pack)
                if (hasUnopenedPack) {
                  const openPackChoice = document.createElement('button');
                  openPackChoice.type = 'button';
                  openPackChoice.className = 'ow-choice-btn';
                  openPackChoice.innerHTML = `✨ "Let's rip open my <b>Mythos Base Card Pack</b> right here!"`;
                  openPackChoice.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.startBoosterPackOpening('unopened_base_pack');
                  });
                  choicesEl.appendChild(openPackChoice);
                }
              }

              choicesEl.classList.remove('hidden');
              challengeBtn.textContent = '🛒 Buy & Sell Counter (Space)';
              challengeBtn.classList.remove('hidden');
            }
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Shopkeeper Leo</b> across the counter.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToCase < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'booster_display', name: 'Booster Pack Display Shelf' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '✨ 1ST-EDITION MYTHOS DISPLAY RACK';
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `Rows of gleaming foil <b>MYTHOS Base Set Booster Packs</b> ($10 each, 3 Cards per pack) and collector starter boxes line the shelves of <b>Leo's Card Shop</b>.`;
          challengeBtn.classList.add('hidden');
        } else if (distToTable < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'duel_table', name: 'In-Store Duel Table' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = '⚔️ IN-STORE MYTHOS DUEL TABLE';
          speakerEl.className = 'ow-speaker-tag friend';
          if (this.hasOpenedStarterPack) {
            textEl.innerHTML = `<b>Shopkeeper Leo:</b> "${fName} just ran ahead to <b>${fName}'s House</b> to set up his tabletop board! Head out the door and walk up to his house whenever you're ready to battle him!"`;
          } else {
            textEl.innerHTML = `<b>${fName}:</b> "${this.hasBoughtCardShopPacks ? 'Whoa, Leo has an official Mythos tabletop mat set up! Open your Booster Pack first so we can see what 3 cards you got!' : 'Look at this tabletop mat! Let\'s talk to Shopkeeper Leo at the counter and grab our 2 Booster Packs first!'}"`;
          }
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'pluto_interior') {
        const pName = this.draftAppearance?.name || 'Asher';
        const pluto = this.plutoNpc;
        const distToPluto = pluto ? Math.hypot(this.player.x - pluto.x, this.player.y - (pluto.y + 0.85)) : 999;
        const distToDesk = Math.hypot(this.player.x - 6.2, this.player.y - 5.6);
        const distToBed = Math.hypot(this.player.x - 3.2, this.player.y - 5.4);
        const distToWardrobe = Math.hypot(this.player.x - 12.2, this.player.y - 5.0);

        if (distToPluto < 1.95 || distToDesk < 1.4) {
          this.nearInteractable = pluto;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "💻 PLUTO — BEDROOM COMPUTER DESK";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'pluto') {
            challengeBtn.classList.remove('ow-talk-btn');
            const hasDollar = (this.gold || 0) >= 1.00;
            const res = this.plutoBattleResult;
            const plutoKey = `pluto_dialogue_${pName}_${hasDollar}_${res || 'none'}`;

            if (this.lastShopPromptKey !== plutoKey) {
              this.lastShopPromptKey = plutoKey;
              choicesEl.innerHTML = '';

              if (res === 'won') {
                textEl.innerHTML = `<b>Pluto:</b> "Whoa, amazing match, ${pName}! You completely outplayed my Beasts! Here is your <b>+$1.00</b> stake! Want a rematch for another dollar?"`;
                this.plutoBattleResult = null;
              } else if (res === 'lost') {
                textEl.innerHTML = `<b>Pluto:</b> "Good game, ${pName}! My deck held strong this round! That'll be <b>-$1.00</b> for the wager! Ready to try again and win your dollar back?"`;
                this.plutoBattleResult = null;
              } else {
                textEl.innerHTML = `<b>Pluto:</b> "Hey ${pName}! Welcome to my room! I was just researching Mythos card deck strategies on my computer. How about a tabletop duel right now? Let's set the stakes to <b>$1.00</b> — if you win you get <b>$1.00</b>, and if you lose you lose <b>$1.00</b>! Ready?"`;
              }

              const btnDuel = document.createElement('button');
              btnDuel.type = 'button';
              btnDuel.className = 'ow-choice-btn primary';
              if (hasDollar) {
                btnDuel.innerHTML = `⚔️ "You're on, Pluto! Let's battle in <b>MYTHOS for $1.00</b>!"`;
                btnDuel.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  this.triggerDuel(this.plutoNpc);
                });
              } else {
                btnDuel.innerHTML = `⚔️ "Let's battle for $1.00!" <i>(Need $1.00 — Wallet: ${this.formatMoney(this.gold || 0)})</i>`;
                btnDuel.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  if (window.sounds?.playClick) window.sounds.playClick();
                  textEl.innerHTML = `<b>Pluto:</b> "Looks like you don't have $1.00 on you right now! <i>(Wallet: ${this.formatMoney(this.gold || 0)})</i> Go sell an extra card to Shopkeeper Leo down the road or ask Mom for allowance first, then come back!"`;
                });
              }
              choicesEl.appendChild(btnDuel);

              // 2v2 Wager Option if Base2v2 map is owned
              if (this.hasBoughtBase2v2Map) {
                const btn2v2 = document.createElement('button');
                btn2v2.type = 'button';
                btn2v2.className = 'ow-choice-btn primary';
                if (hasDollar) {
                  btn2v2.innerHTML = `🏟️ "Let's duel on <b>Base2v2 for $1.00</b> (Select 2 Beasts)!"`;
                  btn2v2.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    this.open2v2BeastSelect(this.plutoNpc);
                  });
                } else {
                  btn2v2.innerHTML = `🏟️ "Let's duel on Base2v2 for $1.00!" <i>(Need $1.00)</i>`;
                  btn2v2.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (window.sounds?.playClick) window.sounds.playClick();
                    textEl.innerHTML = `<b>Pluto:</b> "We need at least $1.00 each for the wager! Go sell an extra card to Shopkeeper Leo or earn some cash, then let's play Base2v2!"`;
                  });
                }
                choicesEl.appendChild(btn2v2);
              }

              const btnComputer = document.createElement('button');
              btnComputer.type = 'button';
              btnComputer.className = 'ow-choice-btn';
              btnComputer.innerHTML = `💻 "What are you researching on your computer?"`;
              btnComputer.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Pluto:</b> "I have Leo's Card Shop catalog open and a spreadsheet of Beast stats! Phoenix has 120 HP with 30-damage Flaming Talons, while Earth Golem has a massive 200 HP pool. Ready to test your deck against mine for $1.00?"`;
              });
              choicesEl.appendChild(btnComputer);

              const btnRoom = document.createElement('button');
              btnRoom.type = 'button';
              btnRoom.className = 'ow-choice-btn';
              btnRoom.innerHTML = `🏠 "Your bedroom looks really cozy!"`;
              btnRoom.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Pluto:</b> "Thanks! My bed is super comfortable, and I like having my computer desk set up right here in my room. Whenever you want to wager that dollar, let's battle!"`;
              });
              choicesEl.appendChild(btnRoom);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = hasDollar ? '⚔️ Battle Pluto ($1.00 Wager)' : '💵 Need $1.00 Wager';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Pluto</b> at his computer desk.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToBed < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'pluto_bed', name: "Pluto's Bed" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🛏️ PLUTO'S BED";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A cozy carved wooden bed dressed in a warm blue and green plaid quilt with plump sleeping pillows.`;
          challengeBtn.classList.add('hidden');
        } else if (distToWardrobe < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'pluto_wardrobe', name: "Pluto's Wardrobe" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🚪 BEDROOM WARDROBE & DRESSER";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A solid oak wardrobe and chest of drawers with polished brass handles, a wooden clock, and a potted houseplant on top.`;
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'nova_interior') {
        const pName = this.draftAppearance?.name || 'Asher';
        const nova = this.novaNpc;
        const distToNova = nova ? Math.hypot(this.player.x - nova.x, this.player.y - (nova.y + 0.85)) : 999;
        const distToScope = Math.hypot(this.player.x - 6.2, this.player.y - 4.8);
        const distToBed = Math.hypot(this.player.x - 3.2, this.player.y - 5.4);
        const distToCharts = Math.hypot(this.player.x - 12.2, this.player.y - 5.0);

        if (distToNova < 1.95 || distToScope < 1.4) {
          this.nearInteractable = nova;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "✨ NOVA — STARGAZER OBSERVATORY";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'nova') {
            challengeBtn.classList.remove('ow-talk-btn');
            const novaKey = `nova_dialogue_${pName}`;
            if (this.lastShopPromptKey !== novaKey) {
              this.lastShopPromptKey = novaKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Nova:</b> "Greetings, ${pName}! Welcome to my observatory home! The celestial currents are shimmering today. Are you here to study constellation card affinities, or would you like to test your deck in a <b>MYTHOS Tabletop Battle</b>?"`;

              const btnDuel = document.createElement('button');
              btnDuel.type = 'button';
              btnDuel.className = 'ow-choice-btn primary';
              btnDuel.innerHTML = `⚔️ "Let's battle in <b>MYTHOS</b>, Nova!"`;
              btnDuel.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.triggerDuel(this.novaNpc);
              });
              choicesEl.appendChild(btnDuel);

              const btnScope = document.createElement('button');
              btnScope.type = 'button';
              btnScope.className = 'ow-choice-btn';
              btnScope.innerHTML = `🔭 "What constellations are you tracking today?"`;
              btnScope.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Nova:</b> "I am tracking the <b>Pegasus Star Cluster</b>! In MYTHOS lore, aerial beasts gain unmatched flight mobility when the wind stars align. If you pair Pegasus with high-speed tactical moves, your opponent won't be able to pin you down!"`;
              });
              choicesEl.appendChild(btnScope);

              const btnDeck = document.createElement('button');
              btnDeck.type = 'button';
              btnDeck.className = 'ow-choice-btn';
              btnDeck.innerHTML = `✨ "What strategy do you recommend for deck building?"`;
              btnDeck.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Nova:</b> "Synergy over brute force! Having both flying agility like <b>Pegasus</b> and raw tank power like <b>Dreadnaught</b> creates tactical balance. Don't be afraid to experiment with different beast pairings!"`;
              });
              choicesEl.appendChild(btnDeck);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '⚔️ Battle Nova!';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Nova</b> by her brass telescope and star charts.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToBed < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'nova_bed', name: "Nova's Bed" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🛏️ NOVA'S BED";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A soft celestial four-poster bed draped in deep midnight velvet with glowing embroidered moon phases.`;
          challengeBtn.classList.add('hidden');
        } else if (distToCharts < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'nova_charts', name: "Astronomy Desk" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "📜 ASTRONOMY DESK & ORRERY";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `An antique brass orrery surrounded by celestial sky charts, star-beast scrolls, and a glowing crystal prism.`;
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'silas_interior') {
        const pName = this.draftAppearance?.name || 'Asher';
        const silas = this.silasNpc;
        const distToSilas = silas ? Math.hypot(this.player.x - silas.x, this.player.y - (silas.y + 0.85)) : 999;
        const distToBench = Math.hypot(this.player.x - 3.2, this.player.y - 5.4);
        const distToFire = Math.hypot(this.player.x - 6.2, this.player.y - 4.8);
        const distToShelf = Math.hypot(this.player.x - 12.2, this.player.y - 5.0);

        if (distToSilas < 1.95 || distToFire < 1.4) {
          this.nearInteractable = silas;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🪵 SILAS — CRAFTSMAN WORKSHOP";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'silas') {
            challengeBtn.classList.remove('ow-talk-btn');
            const silasKey = `silas_dialogue_${pName}`;
            if (this.lastShopPromptKey !== silasKey) {
              this.lastShopPromptKey = silasKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Silas:</b> "Welcome, ${pName}! Come warm yourself by the hearth. I've been hand-planing cedar deck boxes all morning. How's your collection looking? Up for a friendly <b>MYTHOS Tabletop Battle</b>?"`;

              const btnDuel = document.createElement('button');
              btnDuel.type = 'button';
              btnDuel.className = 'ow-choice-btn primary';
              btnDuel.innerHTML = `⚔️ "Let's battle in <b>MYTHOS</b>, Silas!"`;
              btnDuel.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.triggerDuel(this.silasNpc);
              });
              choicesEl.appendChild(btnDuel);

              const btnCarving = document.createElement('button');
              btnCarving.type = 'button';
              btnCarving.className = 'ow-choice-btn';
              btnCarving.innerHTML = `🪵 "What are you carving at your workbench?"`;
              btnCarving.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Silas:</b> "I'm sculpting a miniature <b>Dreadnaught</b> out of heartwood oak! Centuries ago, ancient builders carved colossal stone Dreadnaughts to protect the mountain passes. Their ironclad armor plate remains unmatched!"`;
              });
              choicesEl.appendChild(btnCarving);

              const btnRelics = document.createElement('button');
              btnRelics.type = 'button';
              btnRelics.className = 'ow-choice-btn';
              btnRelics.innerHTML = `🛡️ "Any advice for battling with heavy Beasts?"`;
              btnRelics.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Silas:</b> "Patience, lad! A heavy tank like Dreadnaught doesn't need to rush across the board. Position your fortress on high ground and let your opponent break their claws against your armor!"`;
              });
              choicesEl.appendChild(btnRelics);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '⚔️ Battle Silas!';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Silas</b> by his stone hearth and artisan woodworking bench.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToBench < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'silas_bench', name: "Woodworking Bench" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🔨 ARTISAN WORKBENCH";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A heavy maple workbench strewn with hand-carved oak card cases, brass calipers, wood shavings, and a polished Dreadnaught figurine.`;
          challengeBtn.classList.add('hidden');
        } else if (distToShelf < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'silas_shelf', name: "Grandfather Clock & Relics" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🕰️ CLOCK & ANTIQUE RELICS";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A tall mahogany grandfather clock ticking with a rhythmic brass pendulum, flanked by vintage card frames and antique beast crests.`;
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'maya_interior') {
        const pName = this.draftAppearance?.name || 'Asher';
        const maya = this.mayaNpc;
        const distToMaya = maya ? Math.hypot(this.player.x - maya.x, this.player.y - (maya.y + 0.85)) : 999;
        const distToBench = Math.hypot(this.player.x - 3.2, this.player.y - 5.4);
        const distToGreenhouse = Math.hypot(this.player.x - 6.2, this.player.y - 4.8);
        const distToDesk = Math.hypot(this.player.x - 12.2, this.player.y - 5.0);

        if (distToMaya < 1.95 || distToGreenhouse < 1.4) {
          this.nearInteractable = maya;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🌿 MAYA — BOTANICAL CONSERVATORY";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'maya') {
            challengeBtn.classList.remove('ow-talk-btn');
            const mayaKey = `maya_dialogue_${pName}`;
            if (this.lastShopPromptKey !== mayaKey) {
              this.lastShopPromptKey = mayaKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Maya:</b> "Hey ${pName}! Take a deep breath—fresh sweet jasmine and fern moss! I've been cultivating botanicals that nourish earth Beasts. Are you ready for a spirited <b>MYTHOS Tabletop Battle</b>?"`;

              const btnDuel = document.createElement('button');
              btnDuel.type = 'button';
              btnDuel.className = 'ow-choice-btn primary';
              btnDuel.innerHTML = `⚔️ "Let's battle in <b>MYTHOS</b>, Maya!"`;
              btnDuel.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.triggerDuel(this.mayaNpc);
              });
              choicesEl.appendChild(btnDuel);

              const btnFlora = document.createElement('button');
              btnFlora.type = 'button';
              btnFlora.className = 'ow-choice-btn';
              btnFlora.innerHTML = `🌿 "What species are you researching right now?"`;
              btnFlora.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Maya:</b> "I am studying spore vitality from the <b>Verdant Guardian</b>'s grove! Earth and nature beasts possess tremendous regenerative stamina. If you anchor your defenses early, nature will outlast any aggressive push!"`;
              });
              choicesEl.appendChild(btnFlora);

              const btnTips = document.createElement('button');
              btnTips.type = 'button';
              btnTips.className = 'ow-choice-btn';
              btnTips.innerHTML = `🌸 "How do you preserve your foil cards from humidity?"`;
              btnTips.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Maya:</b> "Double-sleeving in hard-shell matte sleeves! Silas made me airtight cedar cases so my rarest Mythos cards stay in gem-mint condition even in the greenhouse!"`;
              });
              choicesEl.appendChild(btnTips);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '⚔️ Battle Maya!';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Maya</b> in her sunlit greenhouse conservatory.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distToBench < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'maya_bench', name: "Potting Workbench" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🪴 POTTING WORKBENCH";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `Terracotta flower pots overflowing with rare blooming orchids, polished copper watering cans, and seedling peat trays.`;
          challengeBtn.classList.add('hidden');
        } else if (distToDesk < 1.55) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'maya_desk', name: "Botanical Research Desk" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🔬 HERBARIUM & MICROSCOPE";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `A brass botanical microscope, pressed herbarium folios, glass specimen vials with glowing moss spores, and field research journals.`;
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else {
        // Exterior Neighborhood & Far-East Block Leo's Card Shop Avenue Prompt (Zoomed-out view)
        const pName = this.draftAppearance?.name || 'Asher';
        const fName = this.friendName || 'Mike';
        const wName = this.draftAppearance?.worldName || 'Oakhaven';
        const friend = this.npcs[0];
        const distFriendExt = (friend && friend.following) ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;

        const distFriendMailbox = Math.hypot(this.player.x - 8.15, this.player.y - 3.95);
        const distPlayerMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 3.95);
        const distPlayerDoor = Math.hypot(this.player.x - 1.98, this.player.y - 2.85);
        const distFriendDoor = Math.hypot(this.player.x - 10.05, this.player.y - 2.95);
        const distPlutoDoor = Math.hypot(this.player.x - 1.98, this.player.y - 8.85);
        const distPlutoMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 9.25);
        const distRoadSign = Math.hypot(this.player.x - 7.35, this.player.y - 5.45);
        const distEastSign = Math.hypot(this.player.x - 10.65, this.player.y - 9.25);
        const distCardShopDoor = Math.hypot(this.player.x - 13.65, this.player.y - 9.25);
        const distNovaDoor = Math.hypot(this.player.x - 1.98, this.player.y - 14.10);
        const distNovaMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 14.50);
        const distSilasDoor = Math.hypot(this.player.x - 7.60, this.player.y - 14.10);
        const distSilasMailbox = Math.hypot(this.player.x - 6.45, this.player.y - 14.50);
        const distMayaDoor = Math.hypot(this.player.x - 12.68, this.player.y - 14.10);
        const distMayaMailbox = Math.hypot(this.player.x - 11.35, this.player.y - 14.50);
        const distSouthSign = Math.hypot(this.player.x - 7.35, this.player.y - 14.50);
        const distChloe = this.chloeNpc ? Math.hypot(this.player.x - this.chloeNpc.x, this.player.y - this.chloeNpc.y) : 999;
        const distRowan = this.rowanNpc ? Math.hypot(this.player.x - this.rowanNpc.x, this.player.y - this.rowanNpc.y) : 999;
        const distJasper = this.jasperNpc ? Math.hypot(this.player.x - this.jasperNpc.x, this.player.y - this.jasperNpc.y) : 999;
        const distParkFountain = Math.hypot(this.player.x - 21.1, this.player.y - 9.0);
        const distParkSign = Math.hypot(this.player.x - 16.6, this.player.y - 9.25);

        if (distFriendExt < 1.55) {
          this.lastShopPromptKey = null;
          this.nearInteractable = friend;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = fName.toUpperCase();
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'friend' || this.activeDialogueNpc === fName) {
            challengeBtn.classList.remove('ow-talk-btn');
            if (this.hasOpenedStarterPack) {
              textEl.innerHTML = `<b>${fName}:</b> "I can't wait to battle you at my house! Head north up the road to <b>${fName}'s House</b>!"`;
            } else if (this.hasBoughtCardShopPacks) {
              textEl.innerHTML = `<b>${fName}:</b> "We got our packs! Let's open them or head inside my house to duel!"`;
            } else {
              textEl.innerHTML = `<b>${fName}:</b> "We're on our way to <b>Leo's Card Shop</b>! Follow the road east to grab our 2 Booster Packs!"`;
            }
            challengeBtn.classList.add('hidden');
          } else {
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>${fName}</b>.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distCardShopDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'card_shop', name: "Leo's Card Shop" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🃏 LEO'S CARD SHOP`;
          speakerEl.className = 'ow-speaker-tag tv';
          textEl.innerHTML = this.hasOpenedStarterPack
            ? `<b>Leo's Card Shop</b> — ${fName} already headed back to <b>${fName}'s House</b> on the north residential road to wait for your Mythos Battle!`
            : `<b>${fName}:</b> "We made it to <b>Leo's Card Shop</b> on the far east block!! Walk right up through the front doors to head inside!"`;
          challengeBtn.classList.add('hidden');
        } else if (distEastSign < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'east_sign', name: 'East Block Sign' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🪧 EAST MARKET BLOCK`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West:</b> ${wName} Connector Ave &nbsp;|&nbsp; <b>► East Block:</b> Leo's Card Shop`;
          challengeBtn.classList.add('hidden');
        } else if (distFriendMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'friend_mailbox', name: `${fName}'s Mailbox` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 104 ${wName.toUpperCase()} LANE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"${fName}'s House"</b> — Hand-painted on the wooden post. ${this.hasOpenedStarterPack ? `<b>${fName}</b> is waiting inside his house for your Mythos Battle!` : `Inside is a flyer for the <b>MYTHOS Summer Launch Event at Leo's Card Shop</b>!`}`;
          challengeBtn.classList.add('hidden');
        } else if (distPlayerMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'player_mailbox', name: `${pName}'s Mailbox` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 102 ${wName.toUpperCase()} LANE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"${pName}'s House"</b> — Your family mailbox. No new mail since morning.`;
          challengeBtn.classList.add('hidden');
        } else if (distPlayerDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'player_door', name: `${pName}'s Front Door` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 ${pName.toUpperCase()}'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Your House</b> — Press Space or walk through the screen door to head inside (Auto-Saves game).`;
          challengeBtn.classList.add('hidden');
        } else if (distFriendDoor < 1.1) {
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'friend_door', name: `${fName}'s Front Door` };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 ${fName.toUpperCase()}'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          if (this.hasOpenedStarterPack) {
            const doorKey = `friend_door_ready_${fName}`;
            if (this.lastShopPromptKey !== doorKey) {
              this.lastShopPromptKey = doorKey;
              textEl.innerHTML = `<b>${fName} (from inside):</b> "Come on in, ${pName}!! Walk through the front door to my table or click below to start our <b>MYTHOS Battle</b> right now!"`;
              choicesEl.innerHTML = '';
              const battleDoorBtn = document.createElement('button');
              battleDoorBtn.type = 'button';
              battleDoorBtn.className = 'ow-choice-btn';
              battleDoorBtn.innerHTML = `⚔️ "I'm ready, ${fName}! Let's battle in <b>MYTHOS</b>!"`;
              battleDoorBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.triggerDuel();
              });
              choicesEl.appendChild(battleDoorBtn);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = `⚔️ Battle ${fName}!`;
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.textContent = `${fName}: "We don't need anything from my house right now — let's follow the road south and walk two blocks east to Leo's Card Shop!"`;
            challengeBtn.classList.add('hidden');
          }
        } else if (distRoadSign < 1.05) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'road_sign', name: 'Crossroads Sign' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🪧 ${wName.toUpperCase()} CROSSROADS`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West / East ►:</b> ${wName} Residential Lane &nbsp;|&nbsp; <b>▼ South to East Market Block:</b> Leo's Card Shop`;
          challengeBtn.classList.add('hidden');
        } else if (distPlutoDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'pluto_door', name: "Pluto's House" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 PLUTO'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Pluto's House</b> — A sleek craftsman cottage with deep cosmic-indigo shingles and glowing cyan windowpanes. Step through the front door to visit Pluto in his bedroom!`;
          challengeBtn.textContent = "🚪 Enter Pluto's House (Space)";
          challengeBtn.classList.remove('hidden');
        } else if (distPlutoMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'pluto_mailbox', name: "Pluto's Mailbox" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 201 SOUTH CONNECTOR AVE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"Pluto's House"</b> — Sleek purple metallic mailbox with digital address readouts and tech decals.`;
          challengeBtn.classList.add('hidden');
        } else if (distNovaDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'nova_door', name: "Nova's House" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 NOVA'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Nova's House</b> — A handsome celestial navy craftsman cottage with starlight-glowing windows. Step through the front door to visit Nova in her observatory!`;
          challengeBtn.textContent = "🚪 Enter Nova's House (Space)";
          challengeBtn.classList.remove('hidden');
        } else if (distNovaMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'nova_mailbox', name: "Nova's Mailbox" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 301 SOUTH COBBLESTONE WAY`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"Nova's House"</b> — Midnight-blue painted mailbox adorned with celestial constellation decals.`;
          challengeBtn.classList.add('hidden');
        } else if (distSilasDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'silas_door', name: "Silas's House" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 SILAS'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Silas's House</b> — A warm cedar craftsman cottage with a stone hearth chimney and hand-carved gables. Step through the front door to visit Silas in his workshop!`;
          challengeBtn.textContent = "🚪 Enter Silas's House (Space)";
          challengeBtn.classList.remove('hidden');
        } else if (distSilasMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'silas_mailbox', name: "Silas's Mailbox" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 303 SOUTH COBBLESTONE WAY`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"Silas's House"</b> — Solid heartwood oak mailbox hand-carved with Dreadnaught and ancient beast motifs.`;
          challengeBtn.classList.add('hidden');
        } else if (distMayaDoor < 1.15) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'maya_door', name: "Maya's House" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🚪 MAYA'S HOUSE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Maya's House</b> — A vibrant sage cottage framed by blooming orchid flower boxes and a glass conservatory. Step through the front door to visit Maya!`;
          challengeBtn.textContent = "🚪 Enter Maya's House (Space)";
          challengeBtn.classList.remove('hidden');
        } else if (distMayaMailbox < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'maya_mailbox', name: "Maya's Mailbox" };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `📬 MAILBOX — 305 SOUTH COBBLESTONE WAY`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>"Maya's House"</b> — Cheerful emerald mailbox twined with sweet-pea vines and miniature clay pots.`;
          challengeBtn.classList.add('hidden');
        } else if (distSouthSign < 1.0) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'south_sign', name: 'South Block Signpost' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = `🪧 SOUTH BLOCK RESIDENTIAL AVENUE`;
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West:</b> Nova's House &nbsp;|&nbsp; <b>▲ North:</b> Leo's Card Shop & Town Green &nbsp;|&nbsp; <b>► East:</b> Silas's & Maya's Houses`;
          challengeBtn.classList.add('hidden');
        } else if (distChloe < 1.6) {
          this.lastShopPromptKey = null;
          this.nearInteractable = this.chloeNpc;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🧺 CHLOE — PARK COURTYARD PICNIC";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'chloe') {
            challengeBtn.classList.remove('ow-talk-btn');
            const chloeKey = `chloe_dialogue_${pName}`;
            if (this.lastShopPromptKey !== chloeKey) {
              this.lastShopPromptKey = chloeKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Chloe:</b> "Oh, hello ${pName}! It's such a gorgeous sunny afternoon in Central Park! I packed a whole basket of lemon bars and berry iced tea. Are you out exploring the town?"`;

              const btnSnack = document.createElement('button');
              btnSnack.type = 'button';
              btnSnack.className = 'ow-choice-btn primary';
              btnSnack.innerHTML = `1. 🍋 "That picnic spread looks delicious, Chloe!"`;
              btnSnack.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Chloe:</b> "Help yourself to a lemon bar! There's nothing better than fresh baked treats outdoors while watching the water fountain shimmer in the breeze."`;
              });
              choicesEl.appendChild(btnSnack);

              const btnPark = document.createElement('button');
              btnPark.type = 'button';
              btnPark.className = 'ow-choice-btn';
              btnPark.innerHTML = `2. 🌳 "What brings you to Central Park today?"`;
              btnPark.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Chloe:</b> "I love the fresh air and the peaceful courtyard! Rowan over at table two has been deep into his card binders, and Jasper's sketching ducks by the north pond. It's the liveliest spot in town!"`;
              });
              choicesEl.appendChild(btnPark);

              const btnTips = document.createElement('button');
              btnTips.type = 'button';
              btnTips.className = 'ow-choice-btn';
              btnTips.innerHTML = `3. 🌸 "Do you collect Mythos cards too?"`;
              btnTips.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Chloe:</b> "I love the Flora and Nature-type cards! Maya showed me some rare floral beast cards earlier this week. They have such gentle, beautiful foil art!"`;
              });
              choicesEl.appendChild(btnTips);

              const btnLeave = document.createElement('button');
              btnLeave.type = 'button';
              btnLeave.className = 'ow-choice-btn';
              btnLeave.innerHTML = `4. 👋 "Enjoy your picnic, Chloe! (Leave)"`;
              btnLeave.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                this.activeDialogueNpc = null;
                this.lastShopPromptKey = null;
                this.updateFreeRoamPrompt();
              });
              choicesEl.appendChild(btnLeave);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '👋 Leave (Space)';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Chloe</b> at the picnic table.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distRowan < 1.6) {
          this.lastShopPromptKey = null;
          this.nearInteractable = this.rowanNpc;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🃏 ROWAN — MYTHOS DECK THEORIST";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'rowan') {
            challengeBtn.classList.remove('ow-talk-btn');
            const rowanKey = `rowan_dialogue_${pName}`;
            if (this.lastShopPromptKey !== rowanKey) {
              this.lastShopPromptKey = rowanKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Rowan:</b> "Hey ${pName}! Check out this spread — I'm organizing my tactical beast pairings for the upcoming Oakhaven tournament. What kind of deck archetype are you running?"`;

              const btnCombos = document.createElement('button');
              btnCombos.type = 'button';
              btnCombos.className = 'ow-choice-btn primary';
              btnCombos.innerHTML = `1. 🃏 "What cards are you sorting through?"`;
              btnCombos.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Rowan:</b> "I'm testing an aerial mobility combo with <b>Pegasus</b> and frontline pressure with <b>Dreadnaught</b>. If you control the center tiles and protect your backline, you dictate the entire tempo of the match!"`;
              });
              choicesEl.appendChild(btnCombos);

              const btnCoin = document.createElement('button');
              btnCoin.type = 'button';
              btnCoin.className = 'ow-choice-btn';
              btnCoin.innerHTML = `2. 🪙 "How do you decide who goes first in matches?"`;
              btnCoin.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Rowan:</b> "The official Mythos coin flip! Whoever calls the golden coin gets first strike advantage. But going second gives you defensive counter-positioning, so both sides have a strong gameplan!"`;
              });
              choicesEl.appendChild(btnCoin);

              const btnLeo = document.createElement('button');
              btnLeo.type = 'button';
              btnLeo.className = 'ow-choice-btn';
              btnLeo.innerHTML = `3. 🏪 "Have you been to Leo's Card Shop today?"`;
              btnLeo.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Rowan:</b> "Leo's got fresh booster packs just west of here! If you haven't opened a Base Set pack yet, you definitely should. Nothing beats the thrill of peeling a rare foil card!"`;
              });
              choicesEl.appendChild(btnLeo);

              const btnLeave = document.createElement('button');
              btnLeave.type = 'button';
              btnLeave.className = 'ow-choice-btn';
              btnLeave.innerHTML = `4. 👋 "Good luck with your deck, Rowan! (Leave)"`;
              btnLeave.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                this.activeDialogueNpc = null;
                this.lastShopPromptKey = null;
                this.updateFreeRoamPrompt();
              });
              choicesEl.appendChild(btnLeave);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '👋 Leave (Space)';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Rowan</b> by his card binder and deckboxes.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distJasper < 1.6) {
          this.lastShopPromptKey = null;
          this.nearInteractable = this.jasperNpc;
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🎨 JASPER — WILDLIFE SKETCHER";
          speakerEl.className = 'ow-speaker-tag friend';

          if (this.activeDialogueNpc === 'jasper') {
            challengeBtn.classList.remove('ow-talk-btn');
            const jasperKey = `jasper_dialogue_${pName}`;
            if (this.lastShopPromptKey !== jasperKey) {
              this.lastShopPromptKey = jasperKey;
              choicesEl.innerHTML = '';
              textEl.innerHTML = `<b>Jasper:</b> "Shh... look over toward the north pond reed beds! A mallard duck and four little ducklings just paddled past the water lilies. I'm finishing up a wildlife sketch. Want to see?"`;

              const btnSketch = document.createElement('button');
              btnSketch.type = 'button';
              btnSketch.className = 'ow-choice-btn primary';
              btnSketch.innerHTML = `1. 🎨 "What are you sketching right now, Jasper?"`;
              btnSketch.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Jasper:</b> "I'm drawing field studies of the park birds and imagining them as winged Mythos beasts! Look at those feathers and wing spans — nature gives the best inspiration for beast card artwork."`;
              });
              choicesEl.appendChild(btnSketch);

              const btnBinoc = document.createElement('button');
              btnBinoc.type = 'button';
              btnBinoc.className = 'ow-choice-btn';
              btnBinoc.innerHTML = `2. 🔭 "Can I borrow your binoculars to look at the pond?"`;
              btnBinoc.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Jasper:</b> "Sure! Focus near the weeping willow branches. If you look closely across the lily pads, you can see golden dragonflies darting over the pond ripples."`;
              });
              choicesEl.appendChild(btnBinoc);

              const btnPark = document.createElement('button');
              btnPark.type = 'button';
              btnPark.className = 'ow-choice-btn';
              btnPark.innerHTML = `3. 🌳 "How long have you been in the park courtyard?"`;
              btnPark.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                textEl.innerHTML = `<b>Jasper:</b> "Since early morning! The morning light on the fountain stones was breathtaking. This courtyard is the heart of Oakhaven — everyone passes through sooner or later."`;
              });
              choicesEl.appendChild(btnPark);

              const btnLeave = document.createElement('button');
              btnLeave.type = 'button';
              btnLeave.className = 'ow-choice-btn';
              btnLeave.innerHTML = `4. 👋 "Keep up the great sketching, Jasper! (Leave)"`;
              btnLeave.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (window.sounds?.playClick) window.sounds.playClick();
                this.activeDialogueNpc = null;
                this.lastShopPromptKey = null;
                this.updateFreeRoamPrompt();
              });
              choicesEl.appendChild(btnLeave);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = '👋 Leave (Space)';
            challengeBtn.classList.remove('hidden');
          } else {
            this.lastShopPromptKey = null;
            textEl.innerHTML = `Press <b>Talk</b> to speak with <b>Jasper</b> by his wildlife sketchpad.`;
            challengeBtn.textContent = '💬 Talk (Space)';
            challengeBtn.classList.add('ow-talk-btn');
            challengeBtn.classList.remove('hidden');
          }
        } else if (distParkFountain < 1.45) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'park_fountain', name: 'Courtyard Fountain' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "⛲ CENTRAL PARK WATER FOUNTAIN";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>Courtyard Fountain</b> — A grand multi-tiered carved limestone fountain. Crystal-clear water cascades into the stone pool, bubbling cheerfully in the afternoon sunlight.`;
          challengeBtn.classList.add('hidden');
        } else if (distParkSign < 1.1) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          this.nearInteractable = { id: 'park_sign', name: 'Central Park Sign' };
          bar.classList.remove('hidden');
          bar.classList.remove('tv-broadcast');
          speakerEl.textContent = "🪧 OAKHAVEN CENTRAL PARK";
          speakerEl.className = 'ow-speaker-tag friend';
          textEl.innerHTML = `<b>◄ West:</b> Leo's Card Shop & Town Center &nbsp;|&nbsp; <b>► East:</b> Courtyard Picnic Tables & Duck Pond`;
          challengeBtn.classList.add('hidden');
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      }
      this.updateMobileActionLabel();
    }

    // -------------------------------------------------------------------------
    // Mobile Touch Virtual Gamepad & Dynamic Context Action Logic
    // -------------------------------------------------------------------------
    updateMobileActionLabel() {
      const btnA = document.getElementById('ow-btn-a');
      const labelEl = document.getElementById('ow-btn-a-label');
      if (!labelEl) return;

      // Pack Opening Stage controls
      const packModal = document.getElementById('pack-opening-modal');
      if (packModal && !packModal.classList.contains('hidden')) {
        const st = this.packOpeningState;
        btnA?.classList.add('dialogue-mode');
        if (st && !st.cardsDealt && !st.isRipping) {
          labelEl.textContent = 'RIP ⚡';
        } else if (st && st.cardsDealt) {
          const activeCard = document.getElementById('active-pack-card');
          if (activeCard && !activeCard.classList.contains('flipped')) {
            labelEl.textContent = 'FLIP ✨';
          } else if (st.currentCardIndex < st.pulledCards.length - 1) {
            labelEl.textContent = 'NEXT ▸';
          } else {
            labelEl.textContent = 'PACK 🎒';
          }
        }
        return;
      }

      const dialogBar = document.getElementById('ow-dialog-bar');
      const isDialogVisible = dialogBar && !dialogBar.classList.contains('hidden');

      if (!this.nearInteractable) {
        labelEl.textContent = 'TALK';
        btnA?.classList.remove('dialogue-mode');
        return;
      }

      if (this.isNpc(this.nearInteractable) && !this.activeDialogueNpc) {
        labelEl.textContent = 'TALK 💬';
        btnA?.classList.remove('dialogue-mode');
        return;
      }

      if (isDialogVisible) {
        labelEl.textContent = 'NEXT ▸';
        btnA?.classList.add('dialogue-mode');
        return;
      }

      btnA?.classList.remove('dialogue-mode');

      const id = this.nearInteractable.id;
      if (id === 'tv') {
        labelEl.textContent = 'WATCH 📺';
      } else if (id === 'mom') {
        labelEl.textContent = this.hasMomBoosterMoney ? 'TALK 💬' : 'ASK 💵';
      } else if (id === 'shopkeeper') {
        labelEl.textContent = !this.hasBoughtCardShopPacks ? 'BUY 🃏' : 'TALK 💬';
      } else if (id === 'friend_duel' || id === 'best_friend') {
        labelEl.textContent = 'DUEL ⚔️';
      } else if (id === 'friend_door') {
        labelEl.textContent = this.hasOpenedStarterPack ? 'DUEL ⚔️' : 'DOOR 🚪';
      } else if (id === 'booster_display') {
        labelEl.textContent = 'VIEW ✨';
      } else if (id === 'card_shop' || id === 'pluto_door' || id === 'nova_door' || id === 'silas_door' || id === 'maya_door') {
        labelEl.textContent = 'ENTER 🚪';
      } else if (id === 'pluto' || id === 'nova' || id === 'silas' || id === 'maya' || id === 'chloe' || id === 'rowan' || id === 'jasper') {
        labelEl.textContent = 'TALK 💬';
      } else {
        labelEl.textContent = 'CHECK 💬';
      }
    }

    triggerActionButtonA() {
      if (window.sounds?.playClick) window.sounds.playClick();
      if (window.navigator?.vibrate) {
        try { window.navigator.vibrate(12); } catch (_) {}
      }

      // Check Pack Opening Stage
      const packModal = document.getElementById('pack-opening-modal');
      if (packModal && !packModal.classList.contains('hidden')) {
        const st = this.packOpeningState;
        if (st && !st.cardsDealt && !st.isRipping) {
          this.handleSealedPackClick();
          return;
        } else if (st && st.cardsDealt) {
          const activeCard = document.getElementById('active-pack-card');
          if (activeCard && !activeCard.classList.contains('flipped')) {
            activeCard.click();
            return;
          }
          const nextBtn = document.getElementById('btn-pack-next-card');
          if (nextBtn && !nextBtn.classList.contains('hidden')) {
            nextBtn.click();
            return;
          }
          const collectBtn = document.getElementById('btn-pack-collect');
          if (collectBtn && !collectBtn.classList.contains('hidden')) {
            collectBtn.click();
            return;
          }
        }
        return;
      }

      if (this.nearInteractable && this.isNpc(this.nearInteractable) && !this.activeDialogueNpc) {
        this.startTalkingToNpc(this.nearInteractable.id);
        return;
      }

      const dialogBar = document.getElementById('ow-dialog-bar');
      const isDialogVisible = dialogBar && !dialogBar.classList.contains('hidden');

      if (isDialogVisible) {
        const challengeBtn = document.getElementById('ow-btn-challenge');
        if (challengeBtn && !challengeBtn.classList.contains('hidden') && !challengeBtn.classList.contains('ow-talk-btn')) {
          challengeBtn.click();
          return;
        }
        const nextBtn = document.getElementById('ow-btn-next');
        if (nextBtn && !nextBtn.classList.contains('hidden')) {
          nextBtn.click();
          return;
        }
        const choices = document.querySelectorAll('#ow-choices-container .ow-choice-btn');
        if (choices.length > 0) {
          choices[0].click();
          return;
        }
        this.advanceStoryStep();
        return;
      }

      if (this.storyState === 'free_roam' || this.storyState === 'intro_waiting') {
        if (this.nearInteractable) {
          const id = this.nearInteractable.id;
          if (id === 'tv') {
            this.storyState = 'tv_commercial';
            this.renderDialogueUI();
          } else if (id === 'mom') {
            if (!this.hasMomBoosterMoney) {
              this.askMomForBoosterMoney();
            } else {
              this.renderDialogueUI();
            }
          } else if (id === 'shopkeeper') {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('shopkeeper');
            } else if (!this.hasBoughtCardShopPacks) {
              if ((this.gold || 0) >= 20) {
                this.buyTwoBoosterPacks();
              }
            } else {
              this.toggleShopModal(true);
            }
          } else if (id === 'friend_duel' || id === 'best_friend' || id === 'friend_door') {
            this.triggerDuel();
          } else if (id === 'pluto') {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('pluto');
            } else if ((this.gold || 0) >= 1.00) {
              this.triggerDuel(this.plutoNpc);
            }
          } else if (id === 'pluto_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'pluto_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (id === 'player_bed') {
            this.sleepInBed();
          } else if (id === 'player_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'interior';
            this.player.x = 9.8;
            this.player.y = 9.4;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
            this.saveWorldData(this.draftAppearance);
            this.showAutosaveIndicator('💾 Game Saved — Home');
          } else if (id === 'nova_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'nova_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (id === 'silas_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'silas_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (id === 'maya_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'maya_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          }

    initTouchControls() {
      const leftWing = document.getElementById('ow-left-wing');
      const rightWing = document.getElementById('ow-right-wing');
      const dpad = document.getElementById('ow-dpad');
      const btnA = document.getElementById('ow-btn-a');
      const btnB = document.getElementById('ow-btn-b');
      const dpadToggleBtn = document.getElementById('btn-mob-dpad-toggle');

      if (!dpad && !btnA) return;

      // Auto-detect mobile / touch device or viewport <= 820px
      const isMobileOrTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 820);
      if (isMobileOrTouch) {
        leftWing?.classList.remove('hidden');
        rightWing?.classList.remove('hidden');
        dpadToggleBtn?.classList.add('active');
      }

      // Toggle virtual gamepad button
      if (dpadToggleBtn) {
        dpadToggleBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const isHidden = leftWing ? leftWing.classList.toggle('hidden') : false;
          rightWing?.classList.toggle('hidden', isHidden);
          dpadToggleBtn.classList.toggle('active', !isHidden);
        });
      }

      // Virtual D-Pad Touch / Pointer Tracking
      if (dpad) {
        let activePointerId = null;
        let currentDir = null;

        const setDir = (dir) => {
          if (currentDir === dir) return;
          this.keys['arrowup'] = false;
          this.keys['arrowdown'] = false;
          this.keys['arrowleft'] = false;
          this.keys['arrowright'] = false;
          currentDir = dir;

          dpad.querySelectorAll('.dpad-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.dir === dir);
          });

          if (dir === 'up') this.keys['arrowup'] = true;
          else if (dir === 'down') this.keys['arrowdown'] = true;
          else if (dir === 'left') this.keys['arrowleft'] = true;
          else if (dir === 'right') this.keys['arrowright'] = true;
        };

        const clearDir = () => {
          setDir(null);
          activePointerId = null;
        };

        const updateFromCoords = (clientX, clientY) => {
          const rect = dpad.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = clientX - cx;
          const dy = clientY - cy;
          const dist = Math.hypot(dx, dy);

          if (dist < 12) {
            setDir(null); // deadzone
            return;
          }

          const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180
          if (angle >= -45 && angle <= 45) {
            setDir('right');
          } else if (angle > 45 && angle < 135) {
            setDir('down');
          } else if (angle >= 135 || angle <= -135) {
            setDir('left');
          } else {
            setDir('up');
          }
        };

        dpad.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          activePointerId = e.pointerId;
          try { dpad.setPointerCapture(e.pointerId); } catch (_) {}
          updateFromCoords(e.clientX, e.clientY);
          if (window.navigator?.vibrate) {
            try { window.navigator.vibrate(10); } catch (_) {}
          }
        });

        dpad.addEventListener('pointermove', (e) => {
          if (e.pointerId === activePointerId) {
            e.preventDefault();
            updateFromCoords(e.clientX, e.clientY);
          }
        });

        dpad.addEventListener('pointerup', (e) => {
          if (e.pointerId === activePointerId) {
            e.preventDefault();
            clearDir();
          }
        });

        dpad.addEventListener('pointercancel', (e) => {
          if (e.pointerId === activePointerId) {
            clearDir();
          }
        });
      }

      // Action Button A (Interact / Dialogue / Choice)
      if (btnA) {
        btnA.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          btnA.classList.add('active');
          this.triggerActionButtonA();
        });
        btnA.addEventListener('pointerup', () => btnA.classList.remove('active'));
        btnA.addEventListener('pointercancel', () => btnA.classList.remove('active'));
      }

      // Action Button B (Quick Inventory / Backpack)
      if (btnB) {
        btnB.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          btnB.classList.add('active');
          this.toggleInventoryModal();
        });
        btnB.addEventListener('pointerup', () => btnB.classList.remove('active'));
        btnB.addEventListener('pointercancel', () => btnB.classList.remove('active'));
      }

      // Mobile Quick Access HUD Bar buttons
      const mobInvBtn = document.getElementById('btn-mob-inventory');
      if (mobInvBtn) {
        mobInvBtn.addEventListener('click', () => this.toggleInventoryModal());
      }

      const mobBinderBtn = document.getElementById('btn-mob-binder');
      if (mobBinderBtn) {
        mobBinderBtn.addEventListener('click', () => this.toggleBinderModal());
      }

      const mobCreatorBtn = document.getElementById('btn-mob-creator');
      if (mobCreatorBtn) {
        mobCreatorBtn.addEventListener('click', () => this.openCharacterCreator(false));
      }

      // Landscape Wing Quick Nav buttons
      const lsInvBtn = document.getElementById('btn-ls-inventory');
      if (lsInvBtn) {
        lsInvBtn.addEventListener('click', () => this.toggleInventoryModal());
      }

      const lsBinderBtn = document.getElementById('btn-ls-binder');
      if (lsBinderBtn) {
        lsBinderBtn.addEventListener('click', () => this.toggleBinderModal());
      }

      const lsCreatorBtn = document.getElementById('btn-ls-creator');
      if (lsCreatorBtn) {
        lsCreatorBtn.addEventListener('click', () => this.openCharacterCreator(false));
      }

      const lsSoundBtn = document.getElementById('btn-ls-sound');
      if (lsSoundBtn) {
        lsSoundBtn.addEventListener('click', () => document.getElementById('btn-sound')?.click());
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

    get playerName() {
      return this.draftAppearance?.name || this.worldSave?.playerAppearance?.name || 'Player';
    }

    get gold() {
      return this._gold ?? 0;
    }

    set gold(val) {
      const rounded = Math.round((Number(val) || 0) * 100) / 100;
      const changed = this._gold !== rounded;
      this._gold = rounded;
      if (this._initialized && changed) {
        this.autoSave('money');
      }
    }

    wrapReactiveArray(arr, category = 'items') {
      const self = this;
      return new Proxy(arr, {
        set(target, prop, val, receiver) {
          const oldLen = target.length;
          const oldVal = target[prop];
          const finalVal = (val && typeof val === 'object' && !val._isProxy)
            ? self.wrapReactiveItem(val)
            : val;
          const result = Reflect.set(target, prop, finalVal, receiver);
          if (self._initialized && (prop === 'length' ? target.length !== oldLen : oldVal !== val)) {
            self.autoSave(category);
          }
          return result;
        },
        deleteProperty(target, prop) {
          const result = Reflect.deleteProperty(target, prop);
          if (self._initialized) {
            self.autoSave(category);
          }
          return result;
        }
      });
    }

    wrapReactiveItem(item) {
      if (!item || typeof item !== 'object' || item._isProxy) return item;
      const self = this;
      try {
        Object.defineProperty(item, '_isProxy', { value: true, enumerable: false, writable: true });
      } catch (e) {
        item._isProxy = true;
      }
      return new Proxy(item, {
        set(target, prop, val, receiver) {
          const oldVal = target[prop];
          const result = Reflect.set(target, prop, val, receiver);
          if (self._initialized && oldVal !== val && (prop === 'qty' || prop === 'stars' || prop === 'name')) {
            self.autoSave('item_property');
          }
          return result;
        }
      });
    }

    autoSave(reason = 'change') {
      if (!this._initialized) return;
      if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = setTimeout(() => {
        this.saveWorldData(this.draftAppearance);
        this.showAutosaveIndicator('💾 Auto-Saved');
      }, 50);
    }

    showAutosaveIndicator(message = '💾 Auto-Saved') {
      let toast = document.getElementById('ow-autosave-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ow-autosave-toast';
        toast.className = 'ow-autosave-toast';
        document.body.appendChild(toast);
      }
      toast.innerHTML = message;
      toast.classList.add('visible');
      if (this._autosaveToastTimer) clearTimeout(this._autosaveToastTimer);
      this._autosaveToastTimer = setTimeout(() => {
        toast.classList.remove('visible');
      }, 1800);
    }

    saveWorldData(appearance = this.draftAppearance) {
      const app = appearance || this.draftAppearance || {};
      const cleanInventory = Array.isArray(this.inventory)
        ? this.inventory.map(i => {
            const copy = { ...i };
            delete copy._isProxy;
            return copy;
          })
        : [];
      const cleanBinderSlots = Array.isArray(this.binderSlots)
        ? this.binderSlots.map(s => {
            if (!s) return null;
            const copy = { ...s };
            delete copy._isProxy;
            return copy;
          })
        : Array(9).fill(null);

      const saveObj = {
        worldName: app.worldName || 'Oakhaven',
        playerAppearance: { ...app },
        friendName: this.friendName,
        gold: this.gold ?? 0,
        dayNumber: this.dayNumber || 1,
        hasMomBoosterMoney: this.hasMomBoosterMoney ?? false,
        migratedMom25: this.migratedMom25 ?? false,
        hasBoughtCardShopPacks: this.hasBoughtCardShopPacks ?? false,
        hasBoughtBase2v2Map: this.hasBoughtBase2v2Map ?? false,
        hasOpenedStarterPack: this.hasOpenedStarterPack ?? false,
        friendWaitingAtHouse: this.friendWaitingAtHouse ?? false,
        hasOldCardBinder: this.hasOldCardBinder ?? false,
        inventory: cleanInventory,
        binderSlots: cleanBinderSlots,
        storyState: this.storyState,
        currentArea: this.currentArea,
        playerPos: {
          x: Math.round((this.player?.x ?? 9.8) * 100) / 100,
          y: Math.round((this.player?.y ?? 9.4) * 100) / 100,
          dir: this.player?.dir || 'down'
        },
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
      const binderBadgeEl = document.getElementById('binder-badge-count');
      const calDayLabel = document.getElementById('calendar-btn-day-label');
      const calDayNum = document.getElementById('calendar-btn-day-num');
      if (calDayLabel) calDayLabel.textContent = this.getCurrentDayName();
      if (calDayNum) calDayNum.textContent = String(this.dayNumber || 1);
      if (badgeEl) {
        badgeEl.textContent = String(this.getTotalInventoryCount());
      }
      if (binderBadgeEl) {
        binderBadgeEl.textContent = String(this.getSlottedBinderCount());
      }
      const openBinderBtn = document.getElementById('btn-open-binder');
      if (openBinderBtn) {
        if (this.hasOldCardBinder) {
          openBinderBtn.classList.remove('locked');
          openBinderBtn.title = 'Open Old Card Binder (Key: B)';
          openBinderBtn.innerHTML = `📖 Old Card Binder <span id="binder-badge-count" class="inv-badge-pill">${this.getSlottedBinderCount()}</span>`;
        } else {
          openBinderBtn.classList.add('locked');
          openBinderBtn.title = `Defeat ${this.friendName || 'your friend'} in battle to earn the Old Card Binder!`;
          openBinderBtn.innerHTML = `🔒 Old Card Binder`;
        }
      }
      if (locPill) {
        const pName = this.draftAppearance?.name || 'Asher';
        const wName = this.draftAppearance?.worldName || 'Oakhaven';
        let areaLabel = `🌲 ${wName}`;
        if (this.currentArea === 'interior') {
          areaLabel = `🏠 ${pName}'s House`;
        } else if (this.currentArea === 'friend_interior') {
          areaLabel = `🏠 ${this.friendName}'s House`;
        } else if (this.currentArea === 'card_shop_interior') {
          areaLabel = `🃏 Leo's Card Shop`;
        } else if (this.currentArea === 'pluto_interior') {
          areaLabel = `🏠 Pluto's House`;
        } else if (this.currentArea === 'nova_interior') {
          areaLabel = `🏠 Nova's House`;
        } else if (this.currentArea === 'silas_interior') {
          areaLabel = `🏠 Silas's House`;
        } else if (this.currentArea === 'maya_interior') {
          areaLabel = `🏠 Maya's House`;
        } else if (this.currentArea === 'exterior' && this.player && this.player.x >= 16.0) {
          areaLabel = `🌳 Central Park Courtyard`;
        }
        const packCount = (this.inventory || [])
          .filter(i => i.type === 'booster_pack')
          .reduce((s, i) => s + (i.qty || 0), 0);
        const cardCount = (this.inventory || [])
          .filter(i => i.type === 'mythos_card')
          .reduce((s, i) => s + (i.qty || 0), 0);
        const packSummary = packCount > 0 ? ` • 📦 ${packCount} Pack${packCount > 1 ? 's' : ''}` : '';
        const cardSummary = cardCount > 0 ? ` • 🃏 ${cardCount} Card${cardCount > 1 ? 's' : ''}` : '';
        locPill.textContent = `${areaLabel} • 📅 ${this.getCurrentDayName()} (Day ${this.dayNumber || 1}) • Friend: ${this.friendName} • 🎒 ${this.formatMoney(this.gold || 0)}${packSummary}${cardSummary}`;
      }

      // Sync Mobile HUD Elements
      const mobLocTag = document.getElementById('ow-mobile-loc-tag');
      const mobInvBadge = document.getElementById('mob-inv-badge');
      const mobBinderBadge = document.getElementById('mob-binder-badge');
      const mobBinderBtn = document.getElementById('btn-mob-binder');

      if (mobLocTag) {
        let shortArea = '🌲 Town';
        if (this.currentArea === 'interior') shortArea = '🏠 Home';
        else if (this.currentArea === 'friend_interior') shortArea = `🏠 ${this.friendName}'s`;
        else if (this.currentArea === 'card_shop_interior') shortArea = `🃏 Leo's Shop`;
        else if (this.currentArea === 'pluto_interior') shortArea = `🏠 Pluto's`;
        else if (this.currentArea === 'nova_interior') shortArea = `🏠 Nova's`;
        else if (this.currentArea === 'silas_interior') shortArea = `🏠 Silas's`;
        else if (this.currentArea === 'maya_interior') shortArea = `🏠 Maya's`;
        else if (this.currentArea === 'exterior' && this.player && this.player.x >= 16.0) shortArea = `🌳 Park`;
        mobLocTag.textContent = `${shortArea} • 🎒 ${this.formatMoney(this.gold || 0)}`;
      }

      if (mobInvBadge) {
        mobInvBadge.textContent = String(this.getTotalInventoryCount());
      }
      if (mobBinderBadge) {
        mobBinderBadge.textContent = String(this.getSlottedBinderCount());
      }
      if (mobBinderBtn) {
        mobBinderBtn.classList.toggle('locked', !this.hasOldCardBinder);
        mobBinderBtn.title = this.hasOldCardBinder ? 'Open Old Card Binder' : 'Old Card Binder (Locked)';
      }

      // Sync Landscape Wing Badges
      const lsInvBadge = document.getElementById('ls-inv-badge');
      const lsBinderBadge = document.getElementById('ls-binder-badge');
      const lsBinderBtn = document.getElementById('btn-ls-binder');

      if (lsInvBadge) {
        lsInvBadge.textContent = String(this.getTotalInventoryCount());
      }
      if (lsBinderBadge) {
        lsBinderBadge.textContent = String(this.getSlottedBinderCount());
      }
      if (lsBinderBtn) {
        lsBinderBtn.classList.toggle('locked', !this.hasOldCardBinder);
        lsBinderBtn.title = this.hasOldCardBinder ? 'Open Old Card Binder' : 'Old Card Binder (Locked)';
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
          introModal?.classList.add('hidden');
          this.continueSavedWorld();
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

      // Calendar & Daily Event Button Handlers
      const openCalBtn = document.getElementById('btn-open-calendar');
      if (openCalBtn) {
        openCalBtn.addEventListener('click', () => this.toggleCalendarModal(true));
      }
      const closeCalBtn = document.getElementById('btn-close-calendar');
      if (closeCalBtn) {
        closeCalBtn.addEventListener('click', () => this.toggleCalendarModal(false));
      }
      const doneCalBtn = document.getElementById('btn-done-calendar');
      if (doneCalBtn) {
        doneCalBtn.addEventListener('click', () => this.toggleCalendarModal(false));
      }
      const wakeUpBtn = document.getElementById('btn-wake-up');
      if (wakeUpBtn) {
        wakeUpBtn.addEventListener('click', () => this.closeMorningWakeModal());
      }

      const closeInvBtn = document.getElementById('btn-close-inventory');
      if (closeInvBtn) {
        closeInvBtn.addEventListener('click', () => this.toggleInventoryModal(false));
      }

      // Card Binder Button Handlers
      const openBinderBtn = document.getElementById('btn-open-binder');
      if (openBinderBtn) {
        openBinderBtn.addEventListener('click', () => this.toggleBinderModal(true));
      }

      const closeBinderBtn = document.getElementById('btn-close-binder');
      if (closeBinderBtn) {
        closeBinderBtn.addEventListener('click', () => this.toggleBinderModal(false));
      }

      const binderDoneBtn = document.getElementById('btn-binder-done');
      if (binderDoneBtn) {
        binderDoneBtn.addEventListener('click', () => this.toggleBinderModal(false));
      }

      const binderToInvBtn = document.getElementById('btn-binder-to-inv');
      if (binderToInvBtn) {
        binderToInvBtn.addEventListener('click', () => {
          this.toggleBinderModal(false);
          this.toggleInventoryModal(true);
        });
      }

      const invToBinderBtn = document.getElementById('btn-inv-to-binder');
      if (invToBinderBtn) {
        invToBinderBtn.addEventListener('click', () => {
          this.toggleInventoryModal(false);
          this.toggleBinderModal(true);
        });
      }

      const closePickerBtn = document.getElementById('btn-close-binder-picker');
      if (closePickerBtn) {
        closePickerBtn.addEventListener('click', () => this.closeBinderCardPicker());
      }

      const cancelPickerBtn = document.getElementById('btn-cancel-binder-picker');
      if (cancelPickerBtn) {
        cancelPickerBtn.addEventListener('click', () => this.closeBinderCardPicker());
      }

      const closeInspectBtn = document.getElementById('btn-close-inspect');
      if (closeInspectBtn) {
        closeInspectBtn.addEventListener('click', () => this.closeCreatureInspect());
      }

      const backInspectBtn = document.getElementById('btn-inspect-back-bottom');
      if (backInspectBtn) {
        backInspectBtn.addEventListener('click', () => this.closeCreatureInspect());
      }

      document.querySelectorAll('#inspect-pose-buttons .pose-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setInspectPose(btn.dataset.pose);
        });
      });

      this.renderBinderModal();

      const sealedBoosterEl = document.getElementById('sealed-booster-wrapper');
      if (sealedBoosterEl) {
        sealedBoosterEl.addEventListener('click', () => this.handleSealedPackClick());
      }

      const nextCardBtn = document.getElementById('btn-pack-next-card');
      if (nextCardBtn) {
        nextCardBtn.addEventListener('click', () => this.advanceToNextPackCard());
      }

      const viewAllBtn = document.getElementById('btn-pack-view-all');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => this.showPackSummaryAllCards());
      }

      const revealAllBtn = document.getElementById('btn-pack-reveal-all');
      if (revealAllBtn) {
        revealAllBtn.addEventListener('click', () => this.revealAllRemainingPackCards());
      }

      const collectCardsBtn = document.getElementById('btn-pack-collect');
      if (collectCardsBtn) {
        collectCardsBtn.addEventListener('click', () => this.collectPulledCardsToInventory());
      }

      // Shopkeeper Leo's Buy & Sell Counter Modal Controls
      const shopBuyTabBtn = document.getElementById('shop-tab-buy');
      if (shopBuyTabBtn) {
        shopBuyTabBtn.addEventListener('click', () => {
          this.currentShopTab = 'buy';
          this.renderShopModal();
        });
      }

      const shopSellTabBtn = document.getElementById('shop-tab-sell');
      if (shopSellTabBtn) {
        shopSellTabBtn.addEventListener('click', () => {
          this.currentShopTab = 'sell';
          this.renderShopModal();
        });
      }

      const shopBuyPackBtn = document.getElementById('btn-shop-buy-pack');
      if (shopBuyPackBtn) {
        shopBuyPackBtn.addEventListener('click', () => this.buyBaseCardPack());
      }

      const shopRipNowBtn = document.getElementById('btn-shop-rip-now');
      if (shopRipNowBtn) {
        shopRipNowBtn.addEventListener('click', () => this.startBoosterPackOpening('unopened_base_pack'));
      }

      const shopBuyMapBtn = document.getElementById('btn-shop-buy-map');
      if (shopBuyMapBtn) {
        shopBuyMapBtn.addEventListener('click', () => this.buyBase2v2Map());
      }

      const shopPlayMapBtn = document.getElementById('btn-shop-play-map');
      if (shopPlayMapBtn) {
        shopPlayMapBtn.addEventListener('click', () => {
          this.toggleShopModal(false);
          this.open2v2BeastSelect();
        });
      }

      const closeShopBtn = document.getElementById('btn-close-shop');
      if (closeShopBtn) {
        closeShopBtn.addEventListener('click', () => this.toggleShopModal(false));
      }

      const closeShopXBtn = document.getElementById('btn-close-shop-x');
      if (closeShopXBtn) {
        closeShopXBtn.addEventListener('click', () => this.toggleShopModal(false));
      }

      // Base2v2 2v2 Beast Select Modal Listeners
      const close2v2Btn = document.getElementById('btn-close-2v2-select');
      if (close2v2Btn) {
        close2v2Btn.addEventListener('click', () => this.close2v2BeastSelect());
      }

      const cancel2v2Btn = document.getElementById('btn-cancel-2v2-select');
      if (cancel2v2Btn) {
        cancel2v2Btn.addEventListener('click', () => this.close2v2BeastSelect());
      }

      const launch2v2Btn = document.getElementById('btn-launch-2v2');
      if (launch2v2Btn) {
        launch2v2Btn.addEventListener('click', () => this.launch2v2Match());
      }

      ['all', 'backpack', 'binder'].forEach(f => {
        const fBtn = document.getElementById(`btn-filter-${f}`);
        if (fBtn) {
          fBtn.addEventListener('click', () => {
            this.beastSelectFilter = f;
            this.render2v2BeastSelect();
          });
        }
      });

      this.renderShopModal();
      this.renderInventoryModal();
      this.buildCreatorControls();
    }

    refreshIntroScreen() {
      const continueCard = document.getElementById('continue-world-card');
      const continueMeta = document.getElementById('continue-world-meta');
      const thumbCanvas = document.getElementById('continue-avatar-canvas');

      this.worldSave = this.loadSaveData() || this.worldSave;

      if (this.worldSave && continueCard) {
        continueCard.classList.remove('hidden');
        const app = this.worldSave.playerAppearance || {};
        const fName = this.worldSave.friendName || 'Mike';
        if (continueMeta) {
          const invCount = Array.isArray(this.worldSave.inventory)
            ? this.worldSave.inventory.reduce((acc, i) => acc + (i.qty || 1), 0)
            : 0;
          const goldStr = (this.worldSave.gold ?? 0).toFixed(2);
          continueMeta.innerHTML = `
            <div class="save-slot-title">${app.name || 'Asher'} — ${this.worldSave.worldName || 'Oakhaven'}</div>
            <div class="save-slot-sub">Friend: ${fName} • Cash: $${goldStr} • Cards: ${invCount}</div>
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

    continueSavedWorld() {
      this.worldSave = this.loadSaveData() || this.worldSave;
      if (!this.worldSave) {
        this.startOpeningCutscene(false);
        return;
      }

      const app = this.worldSave.playerAppearance || {};
      this.draftAppearance = {
        ...window.MythosCharacterSprites.DEFAULT_APPEARANCE,
        ...app
      };
      this.friendName = this.worldSave.friendName || 'Mike';
      this.playerSprite.setAppearance(this.draftAppearance);

      this._gold = this.worldSave.gold ?? 0;
      this.hasMomBoosterMoney = this.worldSave.hasMomBoosterMoney ?? false;
      this.migratedMom25 = this.worldSave.migratedMom25 ?? true;
      this.hasBoughtCardShopPacks = this.worldSave.hasBoughtCardShopPacks ?? false;
      this.hasBoughtBase2v2Map = this.worldSave.hasBoughtBase2v2Map ?? false;
      this.hasOpenedStarterPack = this.worldSave.hasOpenedStarterPack ?? false;
      this.friendWaitingAtHouse = this.worldSave.friendWaitingAtHouse ?? false;
      this.hasOldCardBinder = this.worldSave.hasOldCardBinder ?? false;
      this.dayNumber = this.worldSave.dayNumber || 1;
      this.friendDefeatedRewardPending = false;

      // Restore Inventory & Reactive Proxy
      const rawInv = Array.isArray(this.worldSave.inventory) ? [...this.worldSave.inventory] : [];
      this.inventory = this.wrapReactiveArray(rawInv.map(i => this.wrapReactiveItem(i)), 'inventory');
      this.selectedInventoryItemId = null;

      // Restore 9-Pocket Card Binder & Reactive Proxy
      const rawBinder = Array.isArray(this.worldSave.binderSlots)
        ? [...this.worldSave.binderSlots]
        : Array(9).fill(null);
      while (rawBinder.length < 9) rawBinder.push(null);
      this.binderSlots = this.wrapReactiveArray(rawBinder.map(s => s ? this.wrapReactiveItem(s) : null), 'binder');

      // Restore Area & Story State
      this.currentArea = this.worldSave.currentArea || 'interior';
      this.storyState = this.worldSave.storyState || (this.hasMomBoosterMoney ? 'free_roam' : 'intro_waiting');

      // Restore Player Coordinates
      if (this.worldSave.playerPos && typeof this.worldSave.playerPos.x === 'number') {
        this.player.x = this.worldSave.playerPos.x;
        this.player.y = this.worldSave.playerPos.y;
        this.player.dir = this.worldSave.playerPos.dir || 'down';
      } else if (this.currentArea === 'interior') {
        this.player.x = 9.8;
        this.player.y = 9.4;
        this.player.dir = 'up';
      } else {
        this.player.x = 1.98;
        this.player.y = 3.4;
        this.player.dir = 'down';
      }
      this.player.targetX = null;
      this.player.targetY = null;

      // Restore NPCs based on area and story progress
      const friend = this.createFriendNpc(this.friendName);
      const mom = this.createMomNpc();

      if (this.currentArea === 'interior') {
        if (this.hasMomBoosterMoney) {
          mom.x = 14.8;
          mom.y = 6.2;
          mom.dir = 'left';
          mom.bubble = '🍳';

          if (!this.hasOpenedStarterPack && !this.friendWaitingAtHouse) {
            friend.following = true;
            friend.x = 10.6;
            friend.y = 9.5;
            friend.dir = 'up';
            friend.bubble = null;
            this.npcs = [friend, mom];
          } else {
            friend.following = false;
            this.npcs = [mom];
          }
        } else {
          // Opening table scene
          this.player.x = 8.6;
          this.player.y = 6.7;
          this.player.dir = 'right';
          friend.x = 11.7;
          friend.y = 6.7;
          friend.dir = 'left';
          friend.bubble = '😩';
          this.npcs = [friend];
        }
      } else {
        // Exterior
        if (this.hasOpenedStarterPack || this.friendWaitingAtHouse) {
          friend.following = false;
          friend.leavingForHouse = false;
          this.friendWaitingAtHouse = true;
          friend.x = 4.1;
          friend.y = 6.8;
          friend.dir = 'right';
          friend.bubble = '⚔️';
        } else if (this.hasMomBoosterMoney) {
          friend.following = true;
          friend.x = this.player.x;
          friend.y = this.player.y + 0.6;
          friend.dir = 'up';
        }
        this.npcs = [friend, mom];
      }

      this.active = true;
      this._initialized = true;

      this.updateHUDSaveInfo();
      this.renderInventoryModal();
      this.renderBinderModal();
      this.renderDialogueUI();

      this.showAutosaveIndicator('💾 Game Loaded');
    }

    openCharacterCreator(isNewWorld = false) {
      this.active = false;
      this.isCreatingNewWorld = isNewWorld;
      const modal = document.getElementById('creator-modal');
      if (!modal) return;
      modal.classList.remove('hidden');

      const CS = window.MythosCharacterSprites;
      if (isNewWorld && CS?.DEFAULT_APPEARANCE) {
        this.draftAppearance = {
          ...CS.DEFAULT_APPEARANCE,
          name: 'Asher',
          worldName: 'Oakhaven'
        };
        this.playerSprite.setAppearance(this.draftAppearance);
      }

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
            document.getElementById('creator-modal')?.classList.add('hidden');
            this.active = true;
            this.startOpeningCutscene(true);
          } else {
            this.saveWorldData(this.draftAppearance);
            document.getElementById('creator-modal')?.classList.add('hidden');
            this.active = true;
          }
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

        // If the theatrical Pack Opening Stage is active, Space/Enter charges the pack or flips/advances/collects cards!
        const packModal = document.getElementById('pack-opening-modal');
        if (packModal && !packModal.classList.contains('hidden')) {
          if (k === ' ' || k === 'enter') {
            e.preventDefault();
            const st = this.packOpeningState;
            if (st && !st.cardsDealt && !st.isRipping) {
              this.handleSealedPackClick();
            } else if (st && st.cardsDealt) {
              const activeCard = document.getElementById('active-pack-card');
              if (activeCard && !activeCard.classList.contains('flipped')) {
                activeCard.click();
              } else {
                const nextBtn = document.getElementById('btn-pack-next-card');
                if (nextBtn && !nextBtn.classList.contains('hidden')) {
                  nextBtn.click();
                } else {
                  const collectBtn = document.getElementById('btn-pack-collect');
                  if (collectBtn && !collectBtn.classList.contains('hidden')) {
                    collectBtn.click();
                  }
                }
              }
            }
          }
          return;
        }

        if (k === 'i') {
          e.preventDefault();
          this.toggleInventoryModal();
          return;
        }
        if (k === 'b') {
          e.preventDefault();
          this.toggleBinderModal();
          return;
        }
        if (k === 'c') {
          e.preventDefault();
          this.toggleCalendarModal();
          return;
        }
        const wakeModal = document.getElementById('morning-wake-modal');
        if (wakeModal && !wakeModal.classList.contains('hidden')) {
          if (k === ' ' || k === 'enter' || k === 'escape') {
            e.preventDefault();
            this.closeMorningWakeModal();
            return;
          }
        }
        if (k === 'escape') {
          const calModal = document.getElementById('calendar-modal');
          if (calModal && !calModal.classList.contains('hidden')) {
            e.preventDefault();
            this.toggleCalendarModal(false);
            return;
          }
          if (this.activeDialogueNpc) {
            e.preventDefault();
            this.closeDialogue();
            return;
          }
          const inspectModal = document.getElementById('creature-inspect-modal');
          if (inspectModal && !inspectModal.classList.contains('hidden')) {
            e.preventDefault();
            this.closeCreatureInspect();
            return;
          }
          const pickerModal = document.getElementById('binder-picker-modal');
          if (pickerModal && !pickerModal.classList.contains('hidden')) {
            e.preventDefault();
            this.closeBinderCardPicker();
            return;
          }
          const binderModal = document.getElementById('binder-modal');
          if (binderModal && !binderModal.classList.contains('hidden')) {
            e.preventDefault();
            this.toggleBinderModal(false);
            return;
          }
          const invModal = document.getElementById('inventory-modal');
          if (invModal && !invModal.classList.contains('hidden')) {
            e.preventDefault();
            this.toggleInventoryModal(false);
            return;
          }
          const shopModal = document.getElementById('shop-modal');
          if (shopModal && !shopModal.classList.contains('hidden')) {
            e.preventDefault();
            this.toggleShopModal(false);
            return;
          }
        }

        if (this.storyState === 'intro_bored' && ['1', '2', '3'].includes(k)) {
          e.preventDefault();
          this.handlePlayerResponse(Number(k) - 1);
          return;
        }

        // Active NPC dialogue choice selection via keys 1, 2, 3, 4
        if (this.activeDialogueNpc && ['1', '2', '3', '4'].includes(k)) {
          const choices = document.querySelectorAll('#ow-choices-container .ow-choice-btn');
          const idx = Number(k) - 1;
          if (choices[idx]) {
            e.preventDefault();
            choices[idx].click();
            return;
          }
        }

        // Escape or Space to leave NPC dialogue
        if (this.activeDialogueNpc && (k === 'escape' || ((this.activeDialogueNpc === 'chloe' || this.activeDialogueNpc === 'rowan' || this.activeDialogueNpc === 'jasper') && (k === ' ' || k === 'enter')))) {
          e.preventDefault();
          this.activeDialogueNpc = null;
          this.lastShopPromptKey = null;
          this.updateFreeRoamPrompt();
          return;
        }

        if (['tv_commercial', 'both_excited', 'mom_gave_money', 'shop_bought_packs', 'must_open_pack_before_leaving', 'friend_challenges_after_pack', 'friend_defeated_celebration'].includes(this.storyState) && (k === ' ' || k === 'enter')) {
          e.preventDefault();
          this.advanceStoryStep();
          return;
        }

        this.keys[k] = true;

        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
          e.preventDefault();
        }

        if ((k === ' ' || k === 'enter' || k === 'e') && (this.storyState === 'free_roam' || this.storyState === 'intro_waiting') && this.nearInteractable) {
          e.preventDefault();
          if (this.isNpc(this.nearInteractable) && !this.activeDialogueNpc) {
            this.startTalkingToNpc(this.nearInteractable.id);
            return;
          }
          if (this.nearInteractable.id === 'tv') {
            this.storyState = 'tv_commercial';
            this.renderDialogueUI();
          } else if (this.nearInteractable.id === 'player_bed') {
            this.sleepInBed();
          } else if (this.nearInteractable.id === 'mom' && !this.hasMomBoosterMoney) {
            this.askMomForBoosterMoney();
          } else if (this.nearInteractable.id === 'shopkeeper') {
            if (!this.hasBoughtCardShopPacks) {
              if ((this.gold || 0) >= 20) {
                this.buyTwoBoosterPacks();
              }
            } else {
              this.toggleShopModal(true);
            }
          } else if (this.nearInteractable.id === 'friend_duel' || (this.nearInteractable.id === 'friend_door' && this.hasOpenedStarterPack)) {
            this.triggerDuel();
          } else if (this.nearInteractable.id === 'pluto') {
            if ((this.gold || 0) >= 1.00) {
              this.triggerDuel(this.plutoNpc);
            }
          } else if (this.nearInteractable.id === 'player_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'interior';
            this.player.x = 9.8;
            this.player.y = 9.4;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
            this.saveWorldData(this.draftAppearance);
            this.showAutosaveIndicator('💾 Game Saved — Home');
          } else if (this.nearInteractable.id === 'pluto_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'pluto_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable.id === 'nova_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'nova_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable.id === 'silas_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'silas_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable.id === 'maya_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'maya_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (window.sounds?.playClick) {
            window.sounds.playClick();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });

      const handleCanvasTap = (clientX, clientY) => {
        if (!this.active) return;
        if (this.storyState !== 'free_roam' && this.storyState !== 'intro_waiting') return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx = (clientX - rect.left) * scaleX;
        const cy = (clientY - rect.top) * scaleY;
        const tx = (cx + (this.currentArea === 'exterior' ? (this.cameraX || 0) : 0)) / this.TILE;
        const ty = (cy + (this.currentArea === 'exterior' ? (this.cameraY || 0) : 0)) / this.TILE;

        // Visual golden destination beacon on touch/click
        this.touchBeacon = { x: tx, y: ty, tick: 0 };

        const mom = this.npcs.find(n => n.id === 'mom');
        if (this.currentArea === 'interior' && mom && Math.hypot(tx - mom.x, ty - mom.y) < 1.4) {
          if (Math.hypot(this.player.x - mom.x, this.player.y - mom.y) < 1.85) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('mom');
              return;
            }
          }
        }

        const keeper = this.shopkeeperNpc;
        if (this.currentArea === 'card_shop_interior' && keeper && Math.hypot(tx - keeper.x, ty - keeper.y) < 1.6) {
          if (Math.hypot(this.player.x - keeper.x, this.player.y - (keeper.y + 1.05)) < 1.9) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('shopkeeper');
              return;
            }
          }
        }

        const pluto = this.plutoNpc;
        if (this.currentArea === 'pluto_interior' && pluto && Math.hypot(tx - pluto.x, ty - pluto.y) < 1.6) {
          if (Math.hypot(this.player.x - pluto.x, this.player.y - (pluto.y + 0.85)) < 1.95) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('pluto');
              return;
            }
          }
        }

        const nova = this.novaNpc;
        if (this.currentArea === 'nova_interior' && nova && Math.hypot(tx - nova.x, ty - nova.y) < 1.6) {
          if (Math.hypot(this.player.x - nova.x, this.player.y - (nova.y + 0.85)) < 1.95) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('nova');
              return;
            }
          }
        }

        const silas = this.silasNpc;
        if (this.currentArea === 'silas_interior' && silas && Math.hypot(tx - silas.x, ty - silas.y) < 1.6) {
          if (Math.hypot(this.player.x - silas.x, this.player.y - (silas.y + 0.85)) < 1.95) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('silas');
              return;
            }
          }
        }

        const maya = this.mayaNpc;
        if (this.currentArea === 'maya_interior' && maya && Math.hypot(tx - maya.x, ty - maya.y) < 1.6) {
          if (Math.hypot(this.player.x - maya.x, this.player.y - (maya.y + 0.85)) < 1.95) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc('maya');
              return;
            }
          }
        }

        const friend = this.npcs[0];
        if (friend && Math.hypot(tx - friend.x, ty - friend.y) < 1.5) {
          if (Math.hypot(this.player.x - friend.x, this.player.y - friend.y) < 2.0) {
            if (!this.activeDialogueNpc) {
              this.startTalkingToNpc(this.currentArea === 'friend_interior' ? 'friend_duel' : 'friend');
              return;
            }
          }
        }

        this.player.targetX = tx;
        this.player.targetY = ty;
      };

      this.canvas.addEventListener('click', (e) => {
        handleCanvasTap(e.clientX, e.clientY);
      });

      this.canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') {
          handleCanvasTap(e.clientX, e.clientY);
        }
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
          if (this.nearInteractable && this.isNpc(this.nearInteractable) && !this.activeDialogueNpc) {
            this.startTalkingToNpc(this.nearInteractable.id);
            return;
          }
          if (this.activeDialogueNpc === 'chloe' || this.activeDialogueNpc === 'rowan' || this.activeDialogueNpc === 'jasper') {
            this.activeDialogueNpc = null;
            this.lastShopPromptKey = null;
            this.updateFreeRoamPrompt();
            return;
          }
          if (this.nearInteractable?.id === 'player_bed') {
            this.sleepInBed();
            return;
          }
          if (this.nearInteractable?.id === 'mom' && !this.hasMomBoosterMoney) {
            this.askMomForBoosterMoney();
          } else if (this.nearInteractable?.id === 'shopkeeper') {
            if (!this.hasBoughtCardShopPacks) {
              if ((this.gold || 0) >= 20) {
                this.buyTwoBoosterPacks();
              }
            } else {
              this.toggleShopModal(true);
            }
          } else if (this.nearInteractable?.id === 'friend_duel' || (this.nearInteractable?.id === 'friend_door' && this.hasOpenedStarterPack)) {
            this.triggerDuel();
          } else if (this.nearInteractable?.id === 'pluto' || (this.currentArea === 'pluto_interior' && this.activeDialogueNpc === 'pluto')) {
            if ((this.gold || 0) >= 1.00) {
              this.triggerDuel(this.plutoNpc);
            } else if (window.sounds?.playClick) {
              window.sounds.playClick();
            }
          } else if (this.nearInteractable?.id === 'pluto_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'pluto_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable?.id === 'nova_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'nova_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable?.id === 'silas_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'silas_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          } else if (this.nearInteractable?.id === 'maya_door') {
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'maya_interior';
            this.player.x = 9.8;
            this.player.y = 9.3;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          }
        });
      }
    }

    triggerDuel(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null) {
      if (window.sounds?.playClick) window.sounds.playClick();
      this.storyState = 'free_roam';
      this.keys = {};
      this.player.targetX = null;
      this.player.targetY = null;
      const target = challenger || (this.currentArea === 'pluto_interior' ? this.plutoNpc : this.npcs[0]);
      if (this.onStartDuel) {
        this.onStartDuel(target, mapId, customPlayerTeam);
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
      } else if (this.currentArea === 'friend_interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // North-Wall Collector Shelf & Stone Fireplace Hearth (x: 2.2..11.4, y: 4.1..4.85)
        if (tx <= 11.4 && ty < 4.85) return true;
        // Right-side Bed (x: 11.4..13.8, y: 4.1..6.6)
        if (tx > 11.35 && ty < 6.6) return true;
        // Left/Center-Left Round Mythos Duel Table & Chairs (center at x: 5.5, y: 6.8)
        if (Math.hypot(tx - 5.5, ty - 6.8) < 1.18) return true;
        for (const n of this.npcs) {
          if (n.id !== 'best_friend') continue;
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
      } else if (this.currentArea === 'pluto_interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // Bedroom Bed on West Wall (x: 2.2..4.5, y: 4.1..6.6)
        if (tx < 4.5 && ty < 6.6) return true;
        // Pluto's Computer Desk Battlestation & Gaming Chair (x: 4.7..7.7, y: 4.1..5.85)
        if (tx >= 4.7 && tx <= 7.7 && ty < 5.85) return true;
        // East Server Rack & Electronics Workbench (x: 11.2..13.8, y: 4.1..5.6)
        if (tx >= 11.2 && ty < 5.6) return true;
        return false;
      } else if (this.currentArea === 'nova_interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // West Wall Four-Poster Bed (x: 2.2..4.5, y: 4.1..6.6)
        if (tx < 4.5 && ty < 6.6) return true;
        // North Wall Telescope & Star Chart Desk (x: 4.7..7.7, y: 4.1..5.85)
        if (tx >= 4.7 && tx <= 7.7 && ty < 5.85) return true;
        // East Wall Astronomy Orrery & Bookshelf (x: 11.2..13.8, y: 4.1..5.6)
        if (tx >= 11.2 && ty < 5.6) return true;
        return false;
      } else if (this.currentArea === 'silas_interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // West Wall Woodworking Artisan Workbench (x: 2.2..4.5, y: 4.1..6.6)
        if (tx < 4.5 && ty < 6.6) return true;
        // North Wall Stone Fireplace & Grandfather Clock (x: 4.7..7.7, y: 4.1..5.85)
        if (tx >= 4.7 && tx <= 7.7 && ty < 5.85) return true;
        // East Wall Leather Armchair & Antique Relic Shelves (x: 11.2..13.8, y: 4.1..5.6)
        if (tx >= 11.2 && ty < 5.6) return true;
        return false;
      } else if (this.currentArea === 'maya_interior') {
        // Cutaway room floor bounds
        if (tx < 2.2 || tx > 13.8 || ty < 4.15 || ty > 10.35) return true;
        // West Wall Potting Workbench & Orchid Displays (x: 2.2..4.5, y: 4.1..6.6)
        if (tx < 4.5 && ty < 6.6) return true;
        // North Wall Greenhouse Tiered Plant Stands (x: 4.7..7.7, y: 4.1..5.85)
        if (tx >= 4.7 && tx <= 7.7 && ty < 5.85) return true;
        // East Wall Botanical Microscope Research Desk (x: 11.2..13.8, y: 4.1..5.6)
        if (tx >= 11.2 && ty < 5.6) return true;
        return false;
      } else {
        // Wider Zoomed-Out Exterior World Bounds with Expanded South Block & Central Park East (Cols 0.5..25.4, Rows 0.5..17.8)
        if (tx < 0.5 || tx > 25.4 || ty < 0.5 || ty > 17.8) return true;

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

        // 4. PLUTO'S COTTAGE (South-West Block: x = 1.1..4.3, y = 5.95..8.85)
        if (tx >= 1.1 && tx <= 4.3 && ty >= 5.95 && ty <= 8.85) {
          // Right-side open wooden patio deck is walkable (x: 2.85..4.2, y: 7.75..8.45)
          if (tx >= 2.85 && tx <= 4.2 && ty >= 7.75) {
            if (tx >= 3.15 && tx <= 3.85 && ty >= 7.8 && ty <= 8.3) return true;
            return false;
          }
          // Left front door threshold (x: 1.65..2.35, y: 7.9..8.85) -> steps inside!
          if (tx >= 1.65 && tx <= 2.35 && ty >= 7.9) return false;
          return true;
        }
        // Pluto's front balustrade railing & brick foundation (x: 1.1..4.3, y: 8.85..9.28)
        if (tx >= 1.1 && tx <= 4.3 && ty > 8.85 && ty <= 9.28) {
          if (tx >= 1.65 && tx <= 2.35) return false; // Front wooden steps
          return true;
        }

        // 5. SOUTH BLOCK COTTAGES:
        // NOVA'S COTTAGE (South-West Plot: x = 1.1..4.3, y = 11.20..14.10)
        if (tx >= 1.1 && tx <= 4.3 && ty >= 11.20 && ty <= 14.10) {
          // Right-side open wooden patio deck is walkable (x: 2.85..4.2, y: 13.00..13.70)
          if (tx >= 2.85 && tx <= 4.2 && ty >= 13.00 && ty <= 13.70) return false;
          // Left front door threshold (x: 1.65..2.35, y: 13.15..14.10) -> steps inside!
          if (tx >= 1.65 && tx <= 2.35 && ty >= 13.15) return false;
          return true;
        }
        if (tx >= 1.1 && tx <= 4.3 && ty > 14.10 && ty <= 14.48) {
          if (tx >= 1.65 && tx <= 2.35) return false; // Front wooden steps
          return true;
        }

        // SILAS'S COTTAGE (South-Center Plot: x = 6.85..9.85, y = 11.20..14.10)
        if (tx >= 6.85 && tx <= 9.85 && ty >= 11.20 && ty <= 14.10) {
          if (tx >= 8.45 && tx <= 9.75 && ty >= 13.00 && ty <= 13.70) return false;
          // Front door threshold (x: 7.25..7.95, y: 13.15..14.10) -> steps inside!
          if (tx >= 7.25 && tx <= 7.95 && ty >= 13.15) return false;
          return true;
        }
        if (tx >= 6.85 && tx <= 9.85 && ty > 14.10 && ty <= 14.48) {
          if (tx >= 7.25 && tx <= 7.95) return false; // Front wooden steps
          return true;
        }

        // MAYA'S COTTAGE (South-East Plot: x = 11.8..15.0, y = 11.20..14.10)
        if (tx >= 11.8 && tx <= 15.0 && ty >= 11.20 && ty <= 14.10) {
          if (tx >= 13.55 && tx <= 14.90 && ty >= 13.00 && ty <= 13.70) return false;
          // Front door threshold (x: 12.35..13.05, y: 13.15..14.10) -> steps inside!
          if (tx >= 12.35 && tx <= 13.05 && ty >= 13.15) return false;
          return true;
        }
        if (tx >= 11.8 && tx <= 15.0 && ty > 14.10 && ty <= 14.48) {
          if (tx >= 12.35 && tx <= 13.05) return false; // Front wooden steps
          return true;
        }

        // 6. Mailboxes, Tree Stump, Gazebo Bench & Signpost Collisions
        if (Math.hypot(tx - 4.75, ty - 3.95) < 0.28) return true; // Player Mailbox
        if (Math.hypot(tx - 8.15, ty - 3.95) < 0.28) return true; // Mike/AJ Mailbox
        if (Math.hypot(tx - 4.75, ty - 9.25) < 0.28) return true; // Pluto Mailbox
        if (Math.hypot(tx - 4.75, ty - 14.50) < 0.28) return true; // Nova Mailbox
        if (Math.hypot(tx - 6.45, ty - 14.50) < 0.28) return true; // Silas Mailbox
        if (Math.hypot(tx - 11.35, ty - 14.50) < 0.28) return true; // Maya Mailbox
        if (Math.hypot(tx - 0.85, ty - 3.65) < 0.30) return true; // Cut Tree Stump
        if (Math.hypot(tx - 7.35, ty - 5.45) < 0.28) return true; // Upper Intersection Signpost
        if (Math.hypot(tx - 10.65, ty - 9.25) < 0.28) return true; // East Market Block Signpost
        if (Math.hypot(tx - 7.35, ty - 14.50) < 0.28) return true; // South Block Signpost

        // 7. Central Park Courtyard, Fountain, Picnic Tables, Duck Pond & Signpost
        // Central Stone Tiered Water Fountain (center at x: 21.1, y: 9.0)
        if (Math.hypot(tx - 21.1, ty - 9.0) < 0.85) return true;
        // Picnic Table 1 (NW / Chloe's Picnic Table: x: 18.8..20.2, y: 7.3..8.1)
        if (tx >= 18.8 && tx <= 20.2 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 2 (NE / Rowan's Card Table: x: 22.1..23.5, y: 7.3..8.1)
        if (tx >= 22.1 && tx <= 23.5 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 3 (S / Jasper's Sketchbook Table: x: 20.4..21.8, y: 10.1..10.9)
        if (tx >= 20.4 && tx <= 21.8 && ty >= 10.1 && ty <= 10.9) return true;
        // North Duck Pond Water Basin (x: 21.8..25.4, y: 1.6..4.6)
        if (tx >= 21.8 && tx <= 25.4 && ty >= 1.6 && ty <= 4.6) return true;
        // Park Welcome Signpost
        if (Math.hypot(tx - 16.6, ty - 9.25) < 0.28) return true;

        return false;
      }
    }

    update() {
      if (!this.active) return;

      if (this.shakeTicks > 0) this.shakeTicks--;
      if (this.tvFlashTicks > 0) this.tvFlashTicks--;
      if (this.excitedBounceTicks > 0) this.excitedBounceTicks--;
      if (this.areaTransitionCooldown > 0) this.areaTransitionCooldown--;

      // Animate scripted NPCs (e.g., Mom walking inside after work, or Mike/AJ leaving Leo's Card Shop for his house!)
      for (const n of this.npcs) {
        if (n.targetX !== undefined && n.targetX !== null && n.targetY !== undefined && n.targetY !== null) {
          const ndx = n.targetX - n.x;
          const ndy = n.targetY - n.y;
          const dist = Math.hypot(ndx, ndy);
          if (dist > 0.08) {
            const spd = n.leavingForHouse ? 0.085 : 0.055;
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
            if (n.leavingForHouse) {
              n.leavingForHouse = false;
              n.following = false;
              this.friendWaitingAtHouse = true;
              this.saveWorldData(this.draftAppearance);
            } else if (n.id === 'mom') {
              n.dir = 'right';
              n.bubble = '💬';
            } else {
              n.dir = 'right';
            }
          }
        }
      }

      if (['intro_bored', 'tv_commercial', 'both_excited', 'mom_gave_money', 'shop_bought_packs', 'must_open_pack_before_leaving', 'friend_challenges_after_pack'].includes(this.storyState)) {
        this.player.moving = false;
        const isBouncing = ['both_excited', 'shop_bought_packs', 'friend_challenges_after_pack'].includes(this.storyState);
        this.player.walkTick = isBouncing ? (this.tick * 0.25) : 0;
        if (this.npcs[0]) {
          this.npcs[0].walkTick = isBouncing ? (this.tick * 0.25) : 0;
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

        // If player walks toward the front door inside (before opening starter pack), Mike/AJ automatically starts following you out!
        if (this.currentArea === 'interior' && !this.hasOpenedStarterPack && this.player.y > 8.4 && this.npcs[0]) {
          this.npcs[0].following = true;
        }
      } else {
        this.player.moving = false;
        this.player.walkTick = 0;
      }

      // Companion Follow AI: Mike or AJ follows right behind you until you open your initial card pack and he leaves for his house!
      const friend = this.npcs[0];
      if (friend && !this.hasOpenedStarterPack && !this.friendWaitingAtHouse && !friend.leavingForHouse && this.currentArea !== 'friend_interior' && (friend.following || this.currentArea === 'exterior' || this.currentArea === 'card_shop_interior')) {
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

      // Check Doorway Transitions between House Interior, Friend's House, Zoomed-Out Neighborhood Exterior, and Leo's Card Shop!
      if (this.areaTransitionCooldown === 0) {
        if (this.currentArea === 'interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          if (this.storyState === 'intro_waiting') {
            this.player.y = 9.85;
            this.player.targetY = null;
            const bar = document.getElementById('ow-dialog-bar');
            const speakerEl = document.getElementById('ow-speaker-tag');
            const textEl = document.getElementById('ow-dialog-text');
            if (bar && speakerEl && textEl) {
              bar.classList.remove('hidden');
              speakerEl.textContent = '💡 ' + (this.draftAppearance?.name || 'Asher').toUpperCase();
              speakerEl.className = 'ow-speaker-tag tv';
              textEl.innerHTML = `I should talk to <b>${this.friendName || 'my friend'}</b> by the table before heading outside!`;
            }
            return;
          }
          // Step out onto your Left Cottage's Front Wooden Porch Steps
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 1.98;
          this.player.y = 3.48;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend && !this.hasOpenedStarterPack && !this.friendWaitingAtHouse) {
            friend.following = true;
            friend.x = 1.98;
            friend.y = 3.05;
            friend.dir = 'down';
            friend.bubble = null;
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 1.65 && this.player.x <= 2.3 && this.player.y <= 2.75) {
          // Step back inside your House through the Screen Door
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'interior';
          this.player.x = 9.8;
          this.player.y = 9.4;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend && !this.hasOpenedStarterPack && !this.friendWaitingAtHouse) {
            friend.x = 10.6;
            friend.y = 9.5;
            friend.dir = 'up';
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();

          // Save game upon entering player's house
          this.saveWorldData(this.draftAppearance);
          this.showAutosaveIndicator('💾 Game Saved — Home');
        } else if (this.currentArea === 'exterior' && this.hasOpenedStarterPack && this.player.x >= 9.7 && this.player.x <= 10.35 && this.player.y <= 2.85) {
          // Step inside Mike's / AJ's House for your Mythos Battle!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'friend_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.following = false;
            friend.leavingForHouse = false;
            this.friendWaitingAtHouse = true;
            friend.x = 4.1;
            friend.y = 6.8;
            friend.dir = 'right';
            friend.bubble = '⚔️';
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'friend_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of Mike's / AJ's House back onto the Upper Residential Road — Mike/AJ stays at his house!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 10.05;
          this.player.y = 3.48;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend) {
            friend.following = false;
            this.friendWaitingAtHouse = true;
          }

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 13.25 && this.player.x <= 14.05 && this.player.y <= 9.05 && this.player.y >= 8.3) {
          // Step inside Leo's Card Shop on the Far-East Block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'card_shop_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          if (friend && !this.hasOpenedStarterPack && !this.friendWaitingAtHouse) {
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
          // If the player received their Booster Pack from Leo and attempts to leave Leo's Card Shop without opening it,
          // stop them at the door and trigger a dialogue to open the card pack!
          const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
          if (this.hasBoughtCardShopPacks && (hasUnopenedPack || !this.hasOpenedStarterPack)) {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.player.y = 9.6;
            this.player.dir = 'up';
            this.player.targetX = null;
            this.player.targetY = null;
            this.keys = {};
            this.storyState = 'must_open_pack_before_leaving';
            this.areaTransitionCooldown = 20;
            this.renderDialogueUI();
          } else {
            // Step out of Leo's Card Shop back onto the Far-East Block of the South Road!
            if (window.sounds?.playMove) window.sounds.playMove();
            this.currentArea = 'exterior';
            this.player.x = 13.65;
            this.player.y = 9.45;
            this.player.dir = 'down';
            this.player.targetX = null;
            this.player.targetY = null;

            if (friend) {
              if (this.hasOpenedStarterPack) {
                friend.following = false;
                friend.leavingForHouse = false;
                friend.targetX = null;
                friend.targetY = null;
                this.friendWaitingAtHouse = true;
              } else {
                friend.following = true;
                friend.x = 13.65;
                friend.y = 9.05;
                friend.dir = 'down';
                friend.bubble = null;
              }
            }

            this.areaTransitionCooldown = 25;
            this.updateHUDSaveInfo();
          }
        } else if (this.currentArea === 'exterior' && this.player.x >= 1.65 && this.player.x <= 2.35 && this.player.y <= 9.05 && this.player.y >= 8.3) {
          // Step inside Pluto's House on the South-West block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'pluto_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'pluto_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of Pluto's House back onto the South-West block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 1.98;
          this.player.y = 9.25;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 1.65 && this.player.x <= 2.35 && this.player.y <= 14.25 && this.player.y >= 13.50) {
          // Step inside Nova's House on the South-West block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'nova_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'nova_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of Nova's House back onto the South-West block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 1.98;
          this.player.y = 14.45;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 7.25 && this.player.x <= 7.95 && this.player.y <= 14.25 && this.player.y >= 13.50) {
          // Step inside Silas's House on the South-Center block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'silas_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'silas_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of Silas's House back onto the South-Center block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 7.60;
          this.player.y = 14.45;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'exterior' && this.player.x >= 12.35 && this.player.x <= 13.05 && this.player.y <= 14.25 && this.player.y >= 13.50) {
          // Step inside Maya's House on the South-East block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'maya_interior';
          this.player.x = 9.8;
          this.player.y = 9.3;
          this.player.dir = 'up';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        } else if (this.currentArea === 'maya_interior' && this.player.x >= 9.0 && this.player.x <= 10.6 && this.player.y >= 10.05) {
          // Step out of Maya's House back onto the South-East block!
          if (window.sounds?.playMove) window.sounds.playMove();
          this.currentArea = 'exterior';
          this.player.x = 12.68;
          this.player.y = 14.45;
          this.player.dir = 'down';
          this.player.targetX = null;
          this.player.targetY = null;

          this.areaTransitionCooldown = 25;
          this.updateHUDSaveInfo();
        }
      }

      // Smooth camera scroll for the expanded exterior world (both X and Y)
      if (this.currentArea === 'exterior') {
        const maxCamY = (this.EXT_ROWS - this.ROWS) * this.TILE;
        const targetCamY = Math.max(0, Math.min(maxCamY, this.player.y * this.TILE - this.canvas.height / 2));
        this.cameraY += (targetCamY - this.cameraY) * 0.18;

        const maxCamX = (this.EXT_COLS - this.COLS) * this.TILE;
        const targetCamX = Math.max(0, Math.min(maxCamX, this.player.x * this.TILE - this.canvas.width / 2));
        this.cameraX += (targetCamX - this.cameraX) * 0.18;

        const inPark = this.player.x >= 16.0;
        if (this._lastInPark !== inPark) {
          this._lastInPark = inPark;
          this.updateHUDSaveInfo();
        }
      } else {
        this.cameraY = 0;
        this.cameraX = 0;
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

      // Stacked Books / Mythos Starter Decks on the Round Table
      ctx.fillStyle = '#6e2b3b';
      ctx.fillRect(tbX + 12, tbY - 16, 26, 28);
      ctx.strokeRect(tbX + 12, tbY - 16, 26, 28);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(tbX + 14, tbY + 4, 22, 6);
      ctx.strokeRect(tbX + 14, tbY + 4, 22, 6);
    }

    // =========================================================================
    // FRIEND'S HOUSE INTERIOR (Distinct Mirrored Architecture, Stone Fireplace,
    // Sage-Celadon Plaster Walls, Cherry Wood Planks, Right-Side Bed & Gaming Nook,
    // and Left-Side Crimson Duelist Arena Rug & Mythos Battle Table!)
    // =========================================================================
    renderFriendHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;
      const fName = this.friendName || 'Mike';
      const isAJ = fName === 'AJ';

      // 1. Deep Twilight-Slate Cutaway Void Background (#4b6478)
      ctx.fillStyle = '#4b6478';
      ctx.fillRect(0, 0, W, H);

      // Room coordinates (matching the cutaway architectural shell)
      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4

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

      // 2. Rich Warm Cherry / Mahogany Wood Plank Floor (#734432 / #683c2b)
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

      ctx.fillStyle = '#734432';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      const plankH = 36;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#754634' : '#693d2c';
        ctx.fillRect(rx, y, rw, plankH);

        // Subtle cherry wood grain streaks
        ctx.fillStyle = '#593122';
        ctx.fillRect(rx + 40, y + 10, rw - 80, 2);
        ctx.fillRect(rx + 90, y + 23, rw - 160, 2);

        // Dark mahogany plank seam
        ctx.fillStyle = '#3d2015';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);

        // Staggered vertical plank joints
        const shift = (row * 150) % 220;
        for (let x = rx + 60 + shift; x < rx + rw - 40; x += 220) {
          ctx.fillRect(x, y, 2, plankH);
        }
      }

      // Bottom Espresso Wooden Threshold Border
      ctx.fillStyle = '#4a2a1d';
      ctx.fillRect(rx, ry + rh - 18, rw, 18);
      ctx.strokeStyle = '#29150d';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx, ry + rh - 18, rw, 18);

      // 3. Large Crimson & Gold Chamfered Duelist Arena Rug on Left/Center-Left Floor!
      const rugX = rx + 48;
      const rugY = floorTop + 26;
      const rugW = 390;
      const rugH = 348;
      const ch = 26;

      ctx.fillStyle = '#581c28'; // Deep Crimson-Burgundy
      drawChamferedRect(rugX, rugY, rugW, rugH, ch);
      ctx.fill();
      ctx.strokeStyle = '#2e0d14';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Ornate Gold Duelist Inner Border & Center Emblem Ring
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      drawChamferedRect(rugX + 12, rugY + 12, rugW - 24, rugH - 24, ch - 5);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rugX + rugW / 2, rugY + rugH / 2, 74, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary Cozy Navy Runner Rug by the Right-Side Bed & Gaming Nook
      const bRugX = rx + rw - 245;
      const bRugY = floorTop + 58;
      ctx.fillStyle = '#1e3a5f';
      drawChamferedRect(bRugX, bRugY, 175, 220, 16);
      ctx.fill();
      ctx.strokeStyle = '#0f233d';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      drawChamferedRect(bRugX + 8, bRugY + 8, 159, 204, 12);
      ctx.stroke();

      ctx.restore();

      // 4. Cool Sage-Celadon Plaster North Wall (#c7d4c0, matching Mike/AJ's Sage Exterior!)
      ctx.fillStyle = '#c7d4c0';
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
      ctx.strokeStyle = '#2d3b32';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Wainscoting Wood Paneling along the lower half of the North Wall
      const wainTop = floorTop - 68;
      ctx.fillStyle = '#5c3d28';
      ctx.beginPath();
      ctx.moveTo(rx + 28, wainTop + 26);
      ctx.lineTo(rx + 68, wainTop);
      ctx.lineTo(rx + rw - 68, wainTop);
      ctx.lineTo(rx + rw - 28, wainTop + 26);
      ctx.lineTo(rx + rw - 28, floorTop + 14);
      ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.lineTo(rx + 68, floorTop - 12);
      ctx.lineTo(rx + 28, floorTop + 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#362114';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Recessed Wainscoting Vertical Panel Ribs across North Wall
      for (let px = rx + 82; px < rx + rw - 95; px += 46) {
        ctx.strokeStyle = '#422818';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, wainTop + 8, 34, 40);
      }

      // Angled Wing Wall vertical corner lines
      ctx.strokeStyle = '#8fa387';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // Dark Espresso Baseboard along north wall and wing walls
      ctx.fillStyle = '#3d2516';
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
      ctx.strokeStyle = '#24140b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Deep Walnut Top-Cap Wall Molding & Side Cutaway Pillars (#4f3524)
      ctx.fillStyle = '#593b28';
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
      ctx.strokeStyle = '#29180e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Lower Sage Plaster Side-Wall Cutaway Pillars (Left & Right bottom walls)
      [rx, rx + rw - 28].forEach(px => {
        ctx.fillStyle = '#c7d4c0';
        ctx.fillRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        ctx.strokeStyle = '#29180e';
        ctx.strokeRect(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18);
        ctx.fillStyle = '#d7e3d0';
        ctx.strokeStyle = '#8fa387';
        ctx.fillRect(px + 4, floorTop + 245, 20, 14);
        ctx.strokeRect(px + 4, floorTop + 245, 20, 14);
      });

      // 6. Bottom Stone Doorstep Threshold + Two Dark Post Blocks (exit to Outside!)
      const doorX = 9.3 * S;
      const doorY = ry + rh - 22;
      ctx.fillStyle = '#1c1610';
      ctx.fillRect(doorX - 18, doorY - 6, 18, 20);
      ctx.fillRect(doorX + 86, doorY - 6, 18, 20);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(doorX, doorY + 4, 86, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(doorX + 6, doorY + 8, 74, 10);

      // 7. Left North Wall: Framed Mythos Collector Banner + Trophy & Card Display Cabinet!
      // Framed Crimson & Gold "SOLAR PHOENIX" Collector Poster on Far-Left North Wall
      const pstX = rx + 76;
      const pstY = ry + 48;
      const pstW = 72;
      const pstH = 92;
      ctx.fillStyle = '#3b2314';
      ctx.fillRect(pstX, pstY, pstW, pstH);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(pstX, pstY, pstW, pstH);
      const pGrad = ctx.createLinearGradient(pstX, pstY, pstX, pstY + pstH);
      pGrad.addColorStop(0, '#7c2d12');
      pGrad.addColorStop(0.5, '#b91c1c');
      pGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = pGrad;
      ctx.fillRect(pstX + 5, pstY + 5, pstW - 10, pstH - 10);
      // Golden Phoenix Silhouette Emblem inside Poster
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(pstX + pstW / 2, pstY + 18);
      ctx.lineTo(pstX + pstW - 14, pstY + 34);
      ctx.lineTo(pstX + pstW / 2 + 6, pstY + 46);
      ctx.lineTo(pstX + pstW / 2, pstY + 64);
      ctx.lineTo(pstX + pstW / 2 - 6, pstY + 46);
      ctx.lineTo(pstX + 14, pstY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 8px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('MYTHOS', pstX + pstW / 2, pstY + pstH - 11);

      // Wide Collector Trophy & Deck Showcase Shelf next to Poster
      const shX = pstX + pstW + 18;
      const shY = ry + 64;
      const shW = 148;
      const shH = 142;
      ctx.fillStyle = '#5c3a24';
      ctx.fillRect(shX, shY, shW, shH);
      ctx.strokeStyle = '#29160c';
      ctx.lineWidth = 2;
      ctx.strokeRect(shX, shY, shW, shH);
      // Top crown cap
      ctx.fillStyle = '#73482d';
      ctx.fillRect(shX - 3, shY, shW + 6, 18);
      ctx.strokeRect(shX - 3, shY, shW + 6, 18);

      // Golden Championship Trophy sitting atop the collector shelf!
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(shX + shW / 2, shY - 12, 10, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(shX + shW / 2 - 3, shY - 6, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(shX + shW / 2 - 10, shY - 4, 20, 4);

      // 3 Display Shelves holding Graded Card Slabs, Deck Boxes & Beast Figurines
      const deckColors = ['#ef4444', '#38bdf8', '#eab308', '#a855f7', '#22c55e'];
      for (let s = 0; s < 3; s++) {
        const sy = shY + 24 + s * 36;
        ctx.fillStyle = '#331d10';
        ctx.fillRect(shX + 8, sy, shW - 16, 28);
        for (let c = 0; c < 5; c++) {
          ctx.fillStyle = deckColors[(c + s * 2) % deckColors.length];
          ctx.fillRect(shX + 14 + c * 25, sy + 6, 16, 20);
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(shX + 14 + c * 25, sy + 6, 16, 20);
        }
      }

      // 8. Center-Left North Wall: Arched Diamond-Lattice Leaded Window
      const winX = shX + shW + 26;
      const winY = ry + 52;
      const winW = 68;
      const winH = 94;

      ctx.strokeStyle = '#29180e';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#5c3a24';
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 34, winW / 2, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 36, winW / 2 - 8, Math.PI, 0);
      ctx.lineTo(winX + winW - 8, winY + winH - 10);
      ctx.lineTo(winX + 8, winY + winH - 10);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = this.settings.timeOfDay === 'night' ? '#1e293b' : '#bae6fd';
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeStyle = '#472d1b';
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

      // 9. Center-Right North Wall: Rustic Stone Fireplace & Chimney Hearth (Matching Exterior Chimney!)
      const fpX = winX + winW + 28;
      const fpY = ry + 32;
      const fpW = 142;
      const fpH = 182;

      // Stone Chimney Breast & Ashlar Masonry Blocks
      ctx.fillStyle = '#64748b';
      ctx.fillRect(fpX, fpY, fpW, fpH);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(fpX, fpY, fpW, fpH);

      // Individual Cobblestone / Ashlar Bricks on the Chimney Breast
      const stoneShades = ['#78879c', '#58677a', '#6c7c91', '#8494a8'];
      for (let sr = 0; sr < 6; sr++) {
        const sy = fpY + 6 + sr * 24;
        const offset = (sr % 2) * 18;
        for (let sc = 0; sc < 4; sc++) {
          const sx = fpX + 6 + offset + sc * 34;
          if (sx + 28 <= fpX + fpW - 4) {
            ctx.fillStyle = stoneShades[(sr + sc) % stoneShades.length];
            ctx.fillRect(sx, sy, 28, 18);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(sx, sy, 28, 18);
          }
        }
      }

      // Carved Walnut Fireplace Mantelpiece & Mounted Mythos Crossed-Swords Shield Crest above Mantel!
      ctx.fillStyle = '#5c3a24';
      ctx.fillRect(fpX - 8, fpY + 76, fpW + 16, 16);
      ctx.strokeStyle = '#24140b';
      ctx.lineWidth = 2;
      ctx.strokeRect(fpX - 8, fpY + 76, fpW + 16, 16);

      // Mounted Heraldic Shield Above Mantel
      const shCx = fpX + fpW / 2;
      const shCy = fpY + 42;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(shCx - 18, shCy - 18);
      ctx.lineTo(shCx + 18, shCy - 18);
      ctx.lineTo(shCx + 18, shCy + 2);
      ctx.lineTo(shCx, shCy + 22);
      ctx.lineTo(shCx - 18, shCy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Stone Hearth Slab protruding onto floor
      ctx.fillStyle = '#475569';
      ctx.fillRect(fpX - 10, fpY + fpH - 8, fpW + 20, 22);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(fpX - 10, fpY + fpH - 8, fpW + 20, 22);

      // Arched Dark Firebox Opening + Animated Crackling Flames!
      const fbX = fpX + 26;
      const fbY = fpY + 102;
      const fbW = fpW - 52;
      const fbH = 74;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(fbX + fbW / 2, fbY + 28, fbW / 2, Math.PI, 0);
      ctx.lineTo(fbX + fbW, fbY + fbH);
      ctx.lineTo(fbX, fbY + fbH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Charred Firewood Logs & Flickering Orange/Gold Hearth Fire
      ctx.fillStyle = '#451a03';
      ctx.fillRect(fbX + 14, fbY + fbH - 14, fbW - 28, 8);
      const fPulse = Math.sin(this.tick * 0.24) * 5;
      const fPulse2 = Math.cos(this.tick * 0.31) * 4;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(fbX + 16, fbY + fbH - 10);
      ctx.quadraticCurveTo(fbX + fbW * 0.35, fbY + 20 + fPulse, fbX + fbW / 2, fbY + 16 - fPulse);
      ctx.quadraticCurveTo(fbX + fbW * 0.7, fbY + 22 - fPulse2, fbX + fbW - 16, fbY + fbH - 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(fbX + 26, fbY + fbH - 10);
      ctx.quadraticCurveTo(fbX + fbW / 2, fbY + 28 + fPulse2, fbX + fbW - 26, fbY + fbH - 10);
      ctx.closePath();
      ctx.fill();

      // 10. Far-Right Corner: Mike/AJ's Bed & Nightstand (Mirrored Opposite from Player's Left-Side Bed!)
      const bedW = 108;
      const bedH = 176;
      const bedX = rx + rw - bedW - 58;
      const bedY = ry + 114;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bedX + 4, bedY + 8, bedW, bedH);

      // Dark Walnut Headboard & Corner Posts
      ctx.fillStyle = '#5c3a24';
      ctx.strokeStyle = '#24140b';
      ctx.lineWidth = 2;
      ctx.fillRect(bedX, bedY, bedW, 34);
      ctx.strokeRect(bedX, bedY, bedW, 34);
      ctx.fillStyle = '#73482d';
      ctx.fillRect(bedX, bedY - 6, 16, 26);
      ctx.strokeRect(bedX, bedY - 6, 16, 26);
      ctx.fillRect(bedX + bedW - 16, bedY - 6, 16, 26);
      ctx.strokeRect(bedX + bedW - 16, bedY - 6, 16, 26);

      // Mattress & Crisp Pillow
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(bedX + 4, bedY + 26, bedW - 8, 36);
      ctx.strokeRect(bedX + 4, bedY + 26, bedW - 8, 36);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bedX + 18, bedY + 16, bedW - 36, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Bold Crimson-Red (Mike) or Emerald-Green (AJ) Quilted Duvet with Gold Stripe!
      ctx.fillStyle = isAJ ? '#15803d' : '#b91c1c';
      ctx.fillRect(bedX + 4, bedY + 56, bedW - 8, 92);
      ctx.strokeRect(bedX + 4, bedY + 56, bedW - 8, 92);
      ctx.fillStyle = isAJ ? '#16a34a' : '#dc2626';
      ctx.fillRect(bedX + 8, bedY + 60, bedW - 16, 80);
      // Gold horizontal racing stripe across blanket
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bedX + 6, bedY + 92, bedW - 12, 12);

      // Footboard & Lower Posts
      ctx.fillStyle = '#5c3a24';
      ctx.fillRect(bedX, bedY + 144, bedW, 32);
      ctx.strokeRect(bedX, bedY + 144, bedW, 32);
      ctx.fillStyle = '#73482d';
      ctx.fillRect(bedX, bedY + 136, 16, 40);
      ctx.strokeRect(bedX, bedY + 136, 16, 40);
      ctx.fillRect(bedX + bedW - 16, bedY + 136, 16, 40);
      ctx.strokeRect(bedX + bedW - 16, bedY + 136, 16, 40);

      // 11. Left/Center-Left Floor: Mike/AJ's Round Wooden Mythos Duel Table & Two Crimson-Cushioned Chairs!
      const tbX = 5.5 * S;
      const tbY = 6.8 * S;

      // Left & Right Wooden Chairs with Crimson-Gold Duelist Cushions
      [tbX - 98, tbX + 64].forEach((chX, idx) => {
        const chY = tbY - 22;
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(chX + 3, chY + 6, 34, 48);
        ctx.fillStyle = '#5c3a24';
        ctx.strokeStyle = '#24140b';
        ctx.lineWidth = 2;
        ctx.fillRect(chX, chY + 16, 34, 32);
        ctx.strokeRect(chX, chY + 16, 34, 32);
        // Crimson seat cushion (#991b1b)
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(chX + 4, chY + 18, 26, 20);
        ctx.strokeRect(chX + 4, chY + 18, 26, 20);
        // Tall Chair Backrest post on outer edge
        const backX = idx === 0 ? chX : chX + 26;
        ctx.fillStyle = '#73482d';
        ctx.fillRect(backX, chY - 12, 8, 56);
        ctx.strokeRect(backX, chY - 12, 8, 56);
      });

      // Duel Table Shadow & Legs
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 16, 72, 54, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a2c1a';
      ctx.fillRect(tbX - 48, tbY + 26, 10, 26);
      ctx.strokeRect(tbX - 48, tbY + 26, 10, 26);
      ctx.fillRect(tbX + 38, tbY + 26, 10, 26);
      ctx.strokeRect(tbX + 38, tbY + 26, 10, 26);

      // Dark Walnut Duel Table Top Bevel & Surface
      ctx.fillStyle = '#5c3a24';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 5, 72, 52, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7c4f32';
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 72, 52, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      // Official Mythos Two-Player Tabletop Battle Playmat & 6 Pulled Cards Laid Out Ready for Battle!
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.fillRect(tbX - 42, tbY - 24, 84, 48);
      ctx.strokeRect(tbX - 42, tbY - 24, 84, 48);
      // Center Arena Divider Line
      ctx.beginPath();
      ctx.moveTo(tbX, tbY - 24);
      ctx.lineTo(tbX, tbY + 24);
      ctx.stroke();

      // 3 Friend Cards (Left) & 3 Player Cards (Right) laid out on the playmat!
      [-15, -3, 9].forEach(ryOff => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(tbX - 32, tbY + ryOff, 14, 9);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(tbX + 18, tbY + ryOff, 14, 9);
      });
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
    // PLUTO'S HOUSE INTERIOR RENDERER (Warm Cozy Residential Home with Bedroom Desk)
    // =========================================================================
    renderPlutoHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;  // 1024
      const H = this.canvas.height; // 768

      // 1. Muted Slate-Blue Cutaway Void Background (#658296) matching the neighborhood architectural style
      ctx.fillStyle = '#658296';
      ctx.fillRect(0, 0, W, H);

      // Room coordinates (matching cutaway architectural shell)
      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4

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

      // 2. Cutaway Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      drawChamferedRect(rx + 16, ry + 16, rw, rh, 18);
      ctx.fill();

      // 3. Wide-Plank Warm Honey-Oak Hardwood Floor (#8a6544)
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

      ctx.fillStyle = '#8a6544';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      // Horizontal wide floorboards + dark plank lines (#543b24) + natural grain streaks
      const plankH = 36;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#8e6947' : '#825f3f';
        ctx.fillRect(rx, y, rw, plankH);

        // Subtle horizontal wood grain streaks
        ctx.fillStyle = '#6e4f32';
        ctx.fillRect(rx + 30, y + 10, rw - 60, 1.8);
        ctx.fillRect(rx + 90, y + 24, rw - 160, 1.8);

        // Dark plank seam
        ctx.fillStyle = '#543b24';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);

        // Staggered vertical plank joints
        const shift = (row * 125) % 230;
        for (let x = rx + 60 + shift; x < rx + rw - 40; x += 230) {
          ctx.fillRect(x, y, 2, plankH);
        }
      }

      // Cozy woven navy & cream braided oval rug in center of the bedroom
      const rugX = rx + 3.2 * S;
      const rugY = floorTop + 1.25 * S;
      const rugW = 6.6 * S;
      const rugH = 4.2 * S;

      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, rugW, rugH, 18);
      ctx.fill();
      ctx.strokeStyle = '#d6cdb8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner woven cream braided border
      ctx.strokeStyle = '#4a627a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(rugX + 10, rugY + 10, rugW - 20, rugH - 20, 14);
      ctx.stroke();

      // Soft woven diamond pattern in rug center
      const rcx = rugX + rugW / 2;
      const rcy = rugY + rugH / 2;
      ctx.fillStyle = 'rgba(214, 205, 184, 0.18)';
      ctx.beginPath();
      ctx.moveTo(rcx, rcy - 24);
      ctx.lineTo(rcx + 32, rcy);
      ctx.lineTo(rcx, rcy + 24);
      ctx.lineTo(rcx - 32, rcy);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 4. Warm Buttercream / Soft Amber Plaster North Wall (#ded8c3)
      ctx.fillStyle = '#ded8c3';
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
      ctx.strokeStyle = '#543b24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // White crown molding at top & dark oak baseboard along bottom of wall
      ctx.fillStyle = '#f8f6f0';
      ctx.fillRect(rx + 68, ry + 30, rw - 136, 6);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 68, ry + 30, rw - 136, 6);

      ctx.fillStyle = '#543b24';
      ctx.fillRect(rx + 68, floorTop - 14, rw - 136, 7);
      ctx.strokeRect(rx + 68, floorTop - 14, rw - 136, 7);

      // Angled wing wall corner lines
      ctx.strokeStyle = '#aba67c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // 5. Two Sunny 6-Pane Bedroom Windows with Curtains (Left of Desk & Right of Desk)
      const drawHomeWindow = (wx, wy, ww, wh) => {
        // Window casing trim
        ctx.fillStyle = '#f8f6f0';
        ctx.strokeStyle = '#543b24';
        ctx.lineWidth = 2;
        ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
        ctx.strokeRect(wx - 4, wy - 4, ww + 8, wh + 8);

        // Sunny daylight sky glass
        const winGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        winGrad.addColorStop(0, '#7dd3fc');
        winGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = winGrad;
        ctx.fillRect(wx, wy, ww, wh);

        // Window muntins (6 panes)
        ctx.strokeStyle = '#f8f6f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
        ctx.moveTo(wx + ww / 3, wy); ctx.lineTo(wx + ww / 3, wy + wh);
        ctx.moveTo(wx + (ww * 2) / 3, wy); ctx.lineTo(wx + (ww * 2) / 3, wy + wh);
        ctx.stroke();

        // Cheerful fabric curtains tied back on sides
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(wx - 8, wy - 4);
        ctx.lineTo(wx + 8, wy - 4);
        ctx.lineTo(wx + 2, wy + wh);
        ctx.lineTo(wx - 8, wy + wh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(wx + ww + 8, wy - 4);
        ctx.lineTo(wx + ww - 8, wy - 4);
        ctx.lineTo(wx + ww - 2, wy + wh);
        ctx.lineTo(wx + ww + 8, wy + wh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Window sill
        ctx.fillStyle = '#f8f6f0';
        ctx.fillRect(wx - 7, wy + wh + 2, ww + 14, 5);
        ctx.strokeRect(wx - 7, wy + wh + 2, ww + 14, 5);

        // Gentle sunlight beam cast onto the floor
        ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
        ctx.beginPath();
        ctx.moveTo(wx, wy + wh + 6);
        ctx.lineTo(wx + ww, wy + wh + 6);
        ctx.lineTo(wx + ww + 38, floorTop + 65);
        ctx.lineTo(wx - 15, floorTop + 65);
        ctx.closePath();
        ctx.fill();
      };

      drawHomeWindow(rx + 1.25 * S, ry + 42, 54, 76);
      drawHomeWindow(rx + rw - 2.15 * S, ry + 42, 54, 76);

      // Wall-mounted Bookshelf above the desk with colorful reading books
      const bsX = 5.2 * S;
      const bsY = ry + 48;
      ctx.fillStyle = '#7a5230';
      ctx.strokeStyle = '#422814';
      ctx.lineWidth = 1.8;
      ctx.fillRect(bsX, bsY + 28, 128, 6);
      ctx.strokeRect(bsX, bsY + 28, 128, 6);
      // Potted succulent on shelf
      ctx.fillStyle = '#d97706';
      ctx.fillRect(bsX + 6, bsY + 18, 10, 10);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(bsX + 11, bsY + 16, 6, 0, Math.PI * 2); ctx.fill();

      // Row of colorful book spines
      const bSpines = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0284c7'];
      bSpines.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(bsX + 22 + idx * 14, bsY + 12, 10, 16);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.strokeRect(bsX + 22 + idx * 14, bsY + 12, 10, 16);
      });

      // Framed picture on wall next to window
      const picX = rx + 2.45 * S;
      const picY = ry + 46;
      ctx.fillStyle = '#543b24';
      ctx.strokeStyle = '#3b2512';
      ctx.lineWidth = 2;
      ctx.fillRect(picX, picY, 36, 44);
      ctx.strokeRect(picX, picY, 36, 44);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(picX + 4, picY + 4, 28, 36);
      // Mountain landscape drawing
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(picX + 24, picY + 14, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(picX + 4, picY + 40);
      ctx.lineTo(picX + 16, picY + 22);
      ctx.lineTo(picX + 28, picY + 40);
      ctx.closePath();
      ctx.fill();

      // 6. PLUTO'S COZY BEDROOM BED (West Wall, x: 2.2..4.4*S, y: 4.1..6.5*S)
      const bedX = 2.2 * S;
      const bedY = 4.1 * S;
      const bedW = 2.2 * S; // 140.8px
      const bedH = 2.35 * S; // 150.4px

      // Bed shadow on floor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.fillRect(bedX + 4, bedY + bedH - 2, bedW, 10);

      // Warm Oak Bed Frame
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#4f351f';
      ctx.lineWidth = 2;
      ctx.fillRect(bedX, bedY, bedW, bedH);
      ctx.strokeRect(bedX, bedY, bedW, bedH);

      // Carved Wooden Headboard with Vertical Slats
      ctx.fillStyle = '#785030';
      ctx.fillRect(bedX - 4, bedY - 18, bedW + 8, 22);
      ctx.strokeRect(bedX - 4, bedY - 18, bedW + 8, 22);
      for (let sx = bedX + 8; sx < bedX + bedW - 8; sx += 14) {
        ctx.fillStyle = '#543b24';
        ctx.fillRect(sx, bedY - 14, 6, 16);
      }

      // Two Plump White Sleeping Pillows
      [bedX + 10, bedX + bedW / 2 + 6].forEach(px => {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(px, bedY + 8, bedW / 2 - 16, 26, 6);
        ctx.fill();
        ctx.stroke();
      });

      // Cozy Blue & Forest Green Plaid Bed Quilt
      const qGrad = ctx.createLinearGradient(bedX, bedY + 40, bedX, bedY + bedH);
      qGrad.addColorStop(0, '#1e3a5f');
      qGrad.addColorStop(1, '#152942');
      ctx.fillStyle = qGrad;
      ctx.fillRect(bedX + 4, bedY + 40, bedW - 8, bedH - 44);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bedX + 4, bedY + 40, bedW - 8, bedH - 44);

      // Plaid blanket stripes
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.lineWidth = 1.5;
      for (let px = bedX + 16; px < bedX + bedW - 10; px += 24) {
        ctx.beginPath(); ctx.moveTo(px, bedY + 40); ctx.lineTo(px, bedY + bedH - 4); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      for (let py = bedY + 54; py < bedY + bedH - 8; py += 24) {
        ctx.beginPath(); ctx.moveTo(bedX + 4, py); ctx.lineTo(bedX + bedW - 4, py); ctx.stroke();
      }

      // Bedside Nightstand with Drawer & Warm Brass Table Lamp
      const nsX = bedX + bedW + 6;
      const nsY = bedY + 8;
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#4f351f';
      ctx.lineWidth = 1.6;
      ctx.fillRect(nsX, nsY, 32, 38);
      ctx.strokeRect(nsX, nsY, 32, 38);
      // Drawer with brass knob
      ctx.fillStyle = '#785030';
      ctx.fillRect(nsX + 3, nsY + 8, 26, 12);
      ctx.strokeRect(nsX + 3, nsY + 8, 26, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(nsX + 16, nsY + 14, 2.2, 0, Math.PI * 2); ctx.fill();

      // Brass Bedside Lamp with Fabric Shade
      ctx.fillStyle = '#d97706';
      ctx.fillRect(nsX + 14, nsY - 6, 4, 12);
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(nsX + 8, nsY - 6);
      ctx.lineTo(nsX + 24, nsY - 6);
      ctx.lineTo(nsX + 28, nsY - 20);
      ctx.lineTo(nsX + 4, nsY - 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Warm golden lamp glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.beginPath();
      ctx.arc(nsX + 16, nsY - 12, 22, 0, Math.PI * 2);
      ctx.fill();

      // 7. WARDROBE & CLOTHES DRESSER (East Wall, x: 11.4..13.6*S, y: 4.1..5.6*S)
      const wardX = 11.4 * S;
      const wardY = 4.1 * S;
      const wardW = 2.2 * S; // 140.8px
      const wardH = 1.45 * S; // 92.8px

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(wardX + 4, wardY + wardH - 4, wardW, 12);

      // Solid Oak Wardrobe Cabinet Body
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#4f351f';
      ctx.lineWidth = 2;
      ctx.fillRect(wardX, wardY, wardW, wardH);
      ctx.strokeRect(wardX, wardY, wardW, wardH);

      // Crown molding at top
      ctx.fillStyle = '#785030';
      ctx.fillRect(wardX - 3, wardY, wardW + 6, 10);
      ctx.strokeRect(wardX - 3, wardY, wardW + 6, 10);

      // Dual wardrobe panel doors with brass pull handles
      const dwW = (wardW - 14) / 2;
      [wardX + 5, wardX + 9 + dwW].forEach((dx, idx) => {
        ctx.fillStyle = '#785030';
        ctx.strokeStyle = '#4f351f';
        ctx.lineWidth = 1.3;
        ctx.fillRect(dx, wardY + 14, dwW, wardH - 20);
        ctx.strokeRect(dx, wardY + 14, dwW, wardH - 20);

        // Recessed inner door panel
        ctx.fillStyle = '#6b4526';
        ctx.fillRect(dx + 4, wardY + 18, dwW - 8, wardH - 28);

        // Brass handle
        const hx = idx === 0 ? (dx + dwW - 6) : (dx + 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(hx, wardY + wardH / 2 - 4, 2.5, 8);
      });

      // Top of dresser: alarm clock & potted fern
      const ckX = wardX + 16;
      const ckY = wardY - 10;
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.arc(ckX, ckY, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.arc(ckX, ckY, 5.5, 0, Math.PI * 2); ctx.fill();

      // Potted green fern on top of wardrobe
      const ptX = wardX + wardW - 24;
      const ptY = wardY - 8;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(ptX - 6, ptY, 12, 10);
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(ptX, ptY - 4, 10, 0, Math.PI * 2);
      ctx.fill();

      // 8. PLUTO'S BEDROOM COMPUTER DESK BACKGROUND & SWIVEL CHAIR
      // High-back comfortable swivel desk chair behind Pluto (x: 6.2*S, y: 4.85*S)
      const chX = 6.2 * S;
      const chY = 4.85 * S;
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      // Headrest
      ctx.beginPath();
      ctx.roundRect(chX - 14, chY - 28, 28, 18, 6);
      ctx.fill();
      ctx.stroke();
      // Cushioned backrest
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(chX - 18, chY - 8, 36, 24, 6);
      ctx.fill();
      ctx.stroke();

      // 9. Front Entrance Doorway & Welcome Mat
      const dwX = 9.8 * S;
      const dwY = ry + rh - 18;
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, dwY, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, dwY, rw, 18);

      // Wooden threshold & Natural Coir Welcome Mat
      ctx.fillStyle = '#8f6542';
      ctx.fillRect(dwX - 24, dwY - 4, 48, 22);
      ctx.strokeStyle = '#4f351f';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(dwX - 24, dwY - 4, 48, 22);

      ctx.fillStyle = '#b48a58';
      ctx.beginPath();
      ctx.roundRect(dwX - 22, dwY - 22, 44, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#6b4e32';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#4f351f';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WELCOME', dwX, dwY - 11);
    }

    // =========================================================================
    // PLUTO'S COMPUTER DESK FOREGROUND RENDERER
    // Renders a normal, cozy bedroom wooden computer desk with desktop monitor,
    // keyboard, mousepad, pen cup, warm mug, and desktop computer in front of Pluto!
    // =========================================================================
    renderPlutoDeskForeground() {
      const ctx = this.ctx;
      const S = this.TILE;
      const cntX = 4.85 * S;  // 310.4px
      const cntY = 5.35 * S;  // 342.4px
      const cntW = 2.75 * S;  // 176px
      const cntH = 46;
      const nearPluto = this.nearInteractable?.id === 'pluto';

      // Desk drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(cntX + 4, cntY + 8, cntW, cntH);

      // Solid Oak Computer Desk Base
      ctx.fillStyle = '#8f6542';
      ctx.strokeStyle = '#4f351f';
      ctx.lineWidth = 2.2;
      ctx.fillRect(cntX, cntY, cntW, cntH);
      ctx.strokeRect(cntX, cntY, cntW, cntH);

      // Polished Wood Desktop Surface Trim
      ctx.fillStyle = '#a67853';
      ctx.fillRect(cntX - 3, cntY, cntW + 6, 18);
      ctx.strokeStyle = nearPluto ? '#60a5fa' : '#4f351f';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(cntX - 3, cntY, cntW + 6, 18);

      // Left Desk Drawer with Brass Knob
      ctx.fillStyle = '#785030';
      ctx.fillRect(cntX + 8, cntY + 22, 42, 18);
      ctx.strokeRect(cntX + 8, cntY + 22, 42, 18);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(cntX + 29, cntY + 31, 2.4, 0, Math.PI * 2); ctx.fill();

      // Neat Charcoal Desk Mousepad across the center
      const padX = cntX + 44;
      const padY = cntY + 4;
      const padW = cntW - 84;
      const padH = 34;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(padX, padY, padW, padH, 4);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Modern Desktop Keyboard
      const kbX = padX + 8;
      const kbY = padY + 12;
      const kbW = 48;
      const kbH = 17;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.1;
      ctx.fillRect(kbX, kbY, kbW, kbH);
      ctx.strokeRect(kbX, kbY, kbW, kbH);

      // White/grey keyboard keys
      ctx.fillStyle = '#e2e8f0';
      for (let k = 0; k < 5; k++) {
        ctx.fillRect(kbX + 4 + k * 8, kbY + 3, 6, 4);
        ctx.fillRect(kbX + 4 + k * 8, kbY + 9, 6, 4);
      }

      // Desktop Optical Mouse
      const msX = kbX + kbW + 10;
      const msY = padY + 13;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(msX, msY, 12, 16, 5);
      ctx.fill();
      ctx.stroke();

      // Cozy Ceramic Red Mug with Warm Steam on a wooden coaster
      const mugX = cntX + 16;
      const mugY = cntY + 6;
      ctx.fillStyle = '#785030';
      ctx.beginPath(); ctx.arc(mugX + 6, mugY + 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.2;
      ctx.fillRect(mugX, mugY, 12, 12);
      ctx.strokeRect(mugX, mugY, 12, 12);
      // Steam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mugX + 4, mugY - 2);
      ctx.quadraticCurveTo(mugX + 8, mugY - 6, mugX + 4, mugY - 10);
      ctx.stroke();

      // Desktop Pen Holder / Pencil Cup
      const cupX = cntX + cntW - 68;
      const cupY = cntY + 4;
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.1;
      ctx.fillRect(cupX, cupY + 6, 12, 14);
      ctx.strokeRect(cupX, cupY + 6, 12, 14);
      // Pens sticking out
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cupX + 2, cupY - 2, 2, 8);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(cupX + 6, cupY - 4, 2, 10);

      // Desktop PC Tower tucked neatly on the right side of the desk
      const pcX = cntX + cntW - 36;
      const pcY = cntY - 24;
      const pcW = 32;
      const pcH = 62;

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.fillRect(pcX, pcY, pcW, pcH);
      ctx.strokeRect(pcX, pcY, pcW, pcH);

      // Power button & front drive slot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(pcX + 16, pcY + 8, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillRect(pcX + 6, pcY + 16, 20, 3);

      // 27-INCH WIDESCREEN DESKTOP MONITOR ON MONITOR STAND
      const standX = cntX + cntW / 2 - 16;
      ctx.fillStyle = '#475569';
      ctx.fillRect(standX, cntY - 12, 32, 12);

      const monX = cntX + 42;
      const monY = cntY - 34;
      const monW = 86;
      const monH = 44;

      // Monitor outer bezel
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.fillRect(monX, monY, monW, monH);
      ctx.strokeRect(monX, monY, monW, monH);

      // Screen glass with light blue desktop wallpaper & Mythos window
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(monX + 3, monY + 3, monW - 6, monH - 6);

      // Browser / Mythos Card Deck window on screen
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(monX + 6, monY + 6, monW - 12, monH - 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(monX + 6, monY + 6, monW - 12, 5);

      // Mini card images on the web page
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(monX + 10, monY + 15, 14, 16);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(monX + 28, monY + 15, 14, 16);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(monX + 46, monY + 15, 14, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(monX + 64, monY + 12, 12, 16);
    }

    // =========================================================================
    // PROCEDURAL COBBLESTONE PAVERS PATTERN ENGINE
    // Generates an authentic textured cobblestone street pattern with rounded
    // paver stones, dark mortar lines, 3D specular rim highlights, and stone bevels!
    // =========================================================================
    initCobblestonePattern() {
      if (this.cobblePattern) return;
      const pw = 128;
      const ph = 68;
      const cvs = document.createElement('canvas');
      cvs.width = pw;
      cvs.height = ph;
      const pctx = cvs.getContext('2d');
      if (!pctx) return;

      // Dark basalt/slate mortar crevices
      pctx.fillStyle = '#1e242d';
      pctx.fillRect(0, 0, pw, ph);

      const rows = 8;
      const rowH = ph / rows; // 8.5px
      const paverW = 16;
      const palette = ['#475569', '#334155', '#3f4756', '#525c6e', '#394250', '#4a5568', '#404a5c'];

      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        const xOffset = (r % 2 === 0) ? 0 : (paverW / 2);
        for (let x = -paverW; x < pw + paverW; x += paverW) {
          const colIdx = Math.floor(Math.abs(Math.sin(r * 13 + x * 7)) * palette.length) % palette.length;
          pctx.fillStyle = palette[colIdx];
          const px = x + xOffset + 1.2;
          const py = y + 1.2;
          const pw_actual = paverW - 2.4;
          const ph_actual = rowH - 2.4;

          pctx.beginPath();
          pctx.roundRect(px, py, pw_actual, ph_actual, 2.2);
          pctx.fill();

          // Top specular rim highlight
          pctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          pctx.lineWidth = 1;
          pctx.beginPath();
          pctx.moveTo(px + 1.5, py + ph_actual - 1);
          pctx.lineTo(px + 1.5, py + 1.5);
          pctx.lineTo(px + pw_actual - 1.5, py + 1.5);
          pctx.stroke();

          // Bottom drop shadow bevel
          pctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
          pctx.beginPath();
          pctx.moveTo(px + pw_actual - 1, py + 1.5);
          pctx.lineTo(px + pw_actual - 1, py + ph_actual - 1);
          pctx.lineTo(px + 1.5, py + ph_actual - 1);
          pctx.stroke();
        }
      }

      this.cobblePattern = this.ctx.createPattern(cvs, 'repeat');
    }

    // =========================================================================
    // NOVA'S HOUSE INTERIOR (Celestial Stargazer Observatory & Study)
    // =========================================================================
    renderNovaHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE;
      const W = this.canvas.width;
      const H = this.canvas.height;

      // Slate midnight void
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, W, H);

      const rx = 1.5 * S;
      const ry = 0.8 * S;
      const rw = 13.0 * S;
      const rh = 9.9 * S;
      const floorTop = 3.85 * S;

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

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawChamferedRect(rx + 16, ry + 16, rw, rh, 18);
      ctx.fill();

      // Deep Midnight Stained Oak Hardwood Floor
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

      ctx.fillStyle = '#1e2638';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      const plankH = 36;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#253046' : '#1c2436';
        ctx.fillRect(rx, y, rw, plankH);
        ctx.fillStyle = '#111827';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);
      }

      // Grand Celestial Constellation Circular Rug
      const rugX = rx + rw / 2;
      const rugY = floorTop + 2.7 * S;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(rugX, rugY, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner zodiac orbit rings
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rugX, rugY, 82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.beginPath();
      ctx.arc(rugX, rugY, 48, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing gold star in center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const angle = (s * Math.PI) / 4;
        const r1 = s % 2 === 0 ? 24 : 10;
        const sx = rugX + Math.cos(angle) * r1;
        const sy = rugY + Math.sin(angle) * r1;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // North Wall: Deep Twilight Indigo Plaster
      ctx.fillStyle = '#1e1b4b';
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
      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Grand Arched Observatory Skylight Window (Center of North Wall)
      const winX = rx + 4.6 * S;
      const winY = ry + 22;
      const winW = 3.8 * S;
      const winH = 110;

      // Night sky glass with cosmic nebula
      const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#312e81');
      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.roundRect(winX, winY, winW, winH, [40, 40, 6, 6]);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Twinkling stars in observatory window
      for (let i = 0; i < 28; i++) {
        const starX = winX + 14 + ((i * 37) % (winW - 28));
        const starY = winY + 12 + ((i * 23) % (winH - 24));
        const starSize = 1.0 + Math.sin(this.tick * 0.08 + i) * 0.6;
        ctx.fillStyle = i % 3 === 0 ? '#fef08a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(starX, starY, Math.max(0.6, starSize), 0, Math.PI * 2);
        ctx.fill();
      }
      // Glowing Crescent Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(winX + winW - 32, winY + 36, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      ctx.arc(winX + winW - 38, winY + 32, 12, 0, Math.PI * 2);
      ctx.fill();

      // Brass Stargazer Telescope on Mahogany Tripod
      const telX = 6.2 * S;
      const telY = floorTop + 14;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(telX, telY - 32); ctx.lineTo(telX - 22, telY + 18);
      ctx.moveTo(telX, telY - 32); ctx.lineTo(telX + 22, telY + 18);
      ctx.moveTo(telX, telY - 32); ctx.lineTo(telX, telY + 22);
      ctx.stroke();

      // Brass telescope barrel pointing upward toward the stars
      ctx.save();
      ctx.translate(telX, telY - 34);
      ctx.rotate(-0.55);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-8, -6, 42, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(28, -8, 12, 16);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-8, -6, 42, 12);
      ctx.strokeRect(28, -8, 12, 16);
      ctx.restore();

      // West Wall Four-Poster Bed with Midnight Velvet Quilt
      const bedX = 2.2 * S;
      const bedY = 4.1 * S;
      const bedW = 2.2 * S;
      const bedH = 2.35 * S;
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#4338ca';
      ctx.lineWidth = 2;
      ctx.fillRect(bedX, bedY, bedW, bedH);
      ctx.strokeRect(bedX, bedY, bedW, bedH);

      // Velvet Quilt with Moon & Star embroidery
      const bqGrad = ctx.createLinearGradient(bedX, bedY + 34, bedX, bedY + bedH);
      bqGrad.addColorStop(0, '#312e81');
      bqGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bqGrad;
      ctx.fillRect(bedX + 4, bedY + 34, bedW - 8, bedH - 38);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bedX + 4, bedY + 34, bedW - 8, bedH - 38);

      // East Wall Astronomy Study Desk & Orrery
      const deskX = 11.2 * S;
      const deskY = 4.1 * S;
      const deskW = 2.4 * S;
      const deskH = 2.1 * S;
      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = '#1c0a02';
      ctx.lineWidth = 2;
      ctx.fillRect(deskX, deskY, deskW, deskH);
      ctx.strokeRect(deskX, deskY, deskW, deskH);

      // Star map scrolls and glowing crystal orrery on desk
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(deskX + 12, deskY + 12, 44, 26);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.strokeRect(deskX + 12, deskY + 12, 44, 26);
      // Glowing crystal globe
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(deskX + deskW - 28, deskY + 28, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.stroke();

      // Front screen door & welcome mat
      const dwX = 9.8 * S;
      const dwY = ry + rh - 18;
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, dwY, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, dwY, rw, 18);

      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(dwX - 22, dwY - 22, 44, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#f5f3ff';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOVA', dwX, dwY - 11);
    }

    // =========================================================================
    // SILAS'S HOUSE INTERIOR (Craftsman Woodworking Parlor & Hearth)
    // =========================================================================
    renderSilasHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE;
      const W = this.canvas.width;
      const H = this.canvas.height;

      // Warm timber void
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 0, W, H);

      const rx = 1.5 * S;
      const ry = 0.8 * S;
      const rw = 13.0 * S;
      const rh = 9.9 * S;
      const floorTop = 3.85 * S;

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

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      drawChamferedRect(rx + 16, ry + 16, rw, rh, 18);
      ctx.fill();

      // Hand-Scraped Honey-Cedar Wide Plank Floor
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

      ctx.fillStyle = '#92400e';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      const plankH = 34;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#9a3412' : '#854d0e';
        ctx.fillRect(rx, y, rw, plankH);
        ctx.fillStyle = '#542d06';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);
      }

      // Traditional Forest Green & Bronze Woven Rug
      const rugX = rx + rw / 2 - 140;
      const rugY = floorTop + 1.25 * S;
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, 280, 190, 16);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      // North Wall: Warm Buttercream Plaster & Stone Masonry Fireplace
      ctx.fillStyle = '#fef3c7';
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
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Stone Hearth Fireplace in center of North Wall
      const fpX = 5.2 * S;
      const fpY = ry + 22;
      const fpW = 2.6 * S;
      const fpH = floorTop - ry - 14;
      ctx.fillStyle = '#57534e';
      ctx.fillRect(fpX, fpY, fpW, fpH);
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2;
      ctx.strokeRect(fpX, fpY, fpW, fpH);

      // Fireplace hearth cavity with crackling animated flame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fpX + 22, fpY + 38, fpW - 44, fpH - 42);
      const flameH = 14 + Math.sin(this.tick * 0.16) * 5;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(fpX + fpW / 2, fpY + fpH - 8, flameH, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(fpX + fpW / 2, fpY + fpH - 6, flameH * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Grandfather Clock beside Fireplace (Ticking swinging pendulum!)
      const gcX = fpX + fpW + 16;
      const gcY = ry + 26;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(gcX, gcY, 36, fpH + 8);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(gcX, gcY, 36, fpH + 8);
      // Clock dial
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath(); ctx.arc(gcX + 18, gcY + 20, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1c1917'; ctx.stroke();
      // Swinging brass pendulum
      const pSwing = Math.sin(this.tick * 0.08) * 6;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gcX + 18, gcY + 36);
      ctx.lineTo(gcX + 18 + pSwing, gcY + fpH - 10);
      ctx.stroke();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(gcX + 18 + pSwing, gcY + fpH - 10, 5, 0, Math.PI * 2);
      ctx.fill();

      // West Wall Woodworking Workbench with carved Dreadnaught figurine
      const wbX = 2.2 * S;
      const wbY = 4.1 * S;
      const wbW = 2.4 * S;
      const wbH = 2.2 * S;
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.fillRect(wbX, wbY, wbW, wbH);
      ctx.strokeRect(wbX, wbY, wbW, wbH);
      // Miniature Carved Wooden Dreadnaught statue on bench!
      ctx.fillStyle = '#b45309';
      ctx.fillRect(wbX + 22, wbY + 16, 28, 18);
      ctx.strokeStyle = '#451a03';
      ctx.strokeRect(wbX + 22, wbY + 16, 28, 18);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(wbX + 28, wbY + 10, 16, 8);

      // East Wall Leather Armchair & Antique Relic Shelves
      const arX = 11.4 * S;
      const arY = 4.1 * S;
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.roundRect(arX + 12, arY + 14, 58, 64, 12);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Front door threshold & welcome mat
      const dwX = 9.8 * S;
      const dwY = ry + rh - 18;
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, dwY, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, dwY, rw, 18);

      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.roundRect(dwX - 22, dwY - 22, 44, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#fff7ed';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SILAS', dwX, dwY - 11);
    }

    // =========================================================================
    // MAYA'S HOUSE INTERIOR (Sunlit Botanical Conservatory & Herbarium)
    // =========================================================================
    renderMayaHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE;
      const W = this.canvas.width;
      const H = this.canvas.height;

      // Deep botanical moss void
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, W, H);

      const rx = 1.5 * S;
      const ry = 0.8 * S;
      const rw = 13.0 * S;
      const rh = 9.9 * S;
      const floorTop = 3.85 * S;

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

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      drawChamferedRect(rx + 16, ry + 16, rw, rh, 18);
      ctx.fill();

      // Sun-Bleached Birch Plank Floor
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

      ctx.fillStyle = '#d6cbba';
      ctx.fillRect(rx, floorTop - 30, rw, rh);

      const plankH = 34;
      for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
        ctx.fillStyle = row % 2 === 0 ? '#ded4c5' : '#c9bea9';
        ctx.fillRect(rx, y, rw, plankH);
        ctx.fillStyle = '#8c7d67';
        ctx.fillRect(rx, y + plankH - 2, rw, 2);
      }

      // Botanical Leaf & Clover Rug
      const rugX = rx + rw / 2 - 130;
      const rugY = floorTop + 1.25 * S;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, 260, 190, 16);
      ctx.fill();
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      // North Wall: Floor-to-Ceiling Greenhouse Conservatory Windows & Hanging Ivy
      ctx.fillStyle = '#d1fae5';
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
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 4 Large Conservatory Glass Panes with Sunlit Sky
      const ghX = rx + 3.2 * S;
      const ghY = ry + 24;
      const ghW = 6.6 * S;
      const ghH = floorTop - ry - 16;
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(ghX, ghY, ghW, ghH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(ghX, ghY, ghW, ghH);
      // Window panes grid
      for (let x = ghX + ghW / 4; x < ghX + ghW; x += ghW / 4) {
        ctx.beginPath(); ctx.moveTo(x, ghY); ctx.lineTo(x, ghY + ghH); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(ghX, ghY + ghH / 2); ctx.lineTo(ghX + ghW, ghY + ghH / 2); ctx.stroke();

      // Hanging macrame ivy planters swinging gently
      [ghX + 40, ghX + ghW / 2, ghX + ghW - 40].forEach((ix, idx) => {
        const sway = Math.sin(this.tick * 0.06 + idx) * 3;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(ix, ghY); ctx.lineTo(ix + sway, ghY + 36); ctx.stroke();
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(ix + sway, ghY + 40, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath(); ctx.arc(ix + sway, ghY + 42, 14, 0, Math.PI * 2); ctx.fill();
      });

      // West Wall Potting Workbench with blooming sun-orchids
      const pbX = 2.2 * S;
      const pbY = 4.1 * S;
      const pbW = 2.4 * S;
      const pbH = 2.2 * S;
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.fillRect(pbX, pbY, pbW, pbH);
      ctx.strokeRect(pbX, pbY, pbW, pbH);
      // Terracotta orchid pots
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(pbX + 16, pbY + 12, 18, 16);
      ctx.fillRect(pbX + 44, pbY + 12, 18, 16);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath(); ctx.arc(pbX + 25, pbY + 8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(pbX + 53, pbY + 8, 8, 0, Math.PI * 2); ctx.fill();

      // East Wall Botanical Microscope & Herbarium Desk
      const mdX = 11.2 * S;
      const mdY = 4.1 * S;
      const mdW = 2.4 * S;
      const mdH = 2.1 * S;
      ctx.fillStyle = '#5c3a21';
      ctx.strokeStyle = '#29170a';
      ctx.lineWidth = 2;
      ctx.fillRect(mdX, mdY, mdW, mdH);
      ctx.strokeRect(mdX, mdY, mdW, mdH);
      // Brass microscope
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(mdX + 24, mdY + 16, 8, 22);
      ctx.fillRect(mdX + 18, mdY + 34, 20, 6);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(mdX + 24, mdY + 16, 8, 22);

      // Front door threshold & welcome mat
      const dwX = 9.8 * S;
      const dwY = ry + rh - 18;
      ctx.fillStyle = '#6b4e32';
      ctx.fillRect(rx, dwY, rw, 18);
      ctx.strokeStyle = '#3b2816';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx, dwY, rw, 18);

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(dwX - 22, dwY - 22, 44, 16, 4);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MAYA', dwX, dwY - 11);
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
      const EXT_W = Math.round(this.EXT_COLS * S); // 1664px (Expanded East Central Park)
      const EXT_H = Math.round(this.EXT_ROWS * S); // 1184px (Expanded South Block)
      const pName = this.draftAppearance?.name || 'Asher';
      const fName = this.friendName || 'Mike';

      // 1. Lush Deep Forest Grass Base across the expanded neighborhood & Central Park
      const gGrad = ctx.createLinearGradient(0, 0, 0, EXT_H);
      gGrad.addColorStop(0, '#1f4f16');
      gGrad.addColorStop(0.35, '#2b6e1d');
      gGrad.addColorStop(0.70, '#26641a');
      gGrad.addColorStop(1, '#1b4513');
      ctx.fillStyle = gGrad;
      ctx.fillRect(0, 0, EXT_W, EXT_H);

      // Grass texture blades across the full neighborhood & Central Park
      for (let i = 0; i < 420; i++) {
        const gx = Math.floor(this.hash(i, 11) * (EXT_W - 24)) + 12;
        const gy = Math.floor(this.hash(i, 22) * (EXT_H - 24)) + 12;
        ctx.fillStyle = i % 2 === 0 ? '#3b8528' : '#184210';
        ctx.fillRect(gx, gy, 2.2, 4.5);
        ctx.fillRect(gx + 2, gy - 1.5, 1.8, 3.8);
      }

      // 2. EXPANDED COBBLESTONE ROAD NETWORK:
      // - Upper Residential East-West Road:  y = 4.20*S .. 5.25*S
      // - Middle Commercial East-West Road:  y = 9.55*S .. 10.70*S
      // - Lower South Residential Avenue:    y = 14.80*S .. 15.95*S
      // - 1st North-South Connector Road:    x = 5.55*S .. 6.65*S, y = 4.20*S .. 15.95*S
      // - 2nd North-South Connector Road:    x = 9.95*S .. 10.95*S, y = 4.20*S .. 15.95*S
      const road1Y = 4.20 * S;
      const road1H = 1.05 * S;     // Ends at 5.25 * S
      const south1X = 5.55 * S;
      const south1W = 1.10 * S;    // Ends at 6.65 * S
      const south2X = 9.95 * S;
      const south2W = 1.00 * S;    // Ends at 10.95 * S
      const road2Y = 9.55 * S;
      const road2H = 1.15 * S;     // Ends at 10.70 * S
      const road3Y = 14.80 * S;
      const road3H = 1.15 * S;     // Ends at 15.95 * S
      const fullConnH = (road3Y + road3H) - road1Y;

      // Dark Basalt/Slate Road Base & Mortar Subgrade (#1e242d)
      ctx.fillStyle = '#1e242d';
      ctx.fillRect(0, road1Y - 4, W, road1H + 8);
      ctx.fillRect(0, road2Y - 4, W, road2H + 8);
      ctx.fillRect(0, road3Y - 4, W, road3H + 8);
      ctx.fillRect(south1X - 4, road1Y - 4, south1W + 8, fullConnH + 8);
      ctx.fillRect(south2X - 4, road1Y - 4, south2W + 8, fullConnH + 8);

      // Procedural Textured Cobblestone Street Surface across all road segments
      this.initCobblestonePattern();
      ctx.fillStyle = this.cobblePattern || '#334155';
      ctx.fillRect(0, road1Y, W, road1H);
      ctx.fillRect(0, road2Y, W, road2H);
      ctx.fillRect(0, road3Y, W, road3H);
      ctx.fillRect(south1X, road1Y, south1W, fullConnH);
      ctx.fillRect(south2X, road1Y, south2W, fullConnH);

      // Subtle Street Vignette / Road Wear Shading
      const drawRoadVignette = (ry, rh) => {
        const vGrad = ctx.createLinearGradient(0, ry, 0, ry + rh);
        vGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
        vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
        vGrad.addColorStop(1, 'rgba(15, 23, 42, 0.32)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, ry, W, rh);
      };
      drawRoadVignette(road1Y, road1H);
      drawRoadVignette(road2Y, road2H);
      drawRoadVignette(road3Y, road3H);

      // Walkways connecting all house porch stairs & shop to the cobblestone avenues
      const drawDrivewayPath = (px, py, pw, ph) => {
        ctx.fillStyle = '#1e242d';
        ctx.fillRect(px - 2.5, py, pw + 5, ph);
        ctx.fillStyle = this.cobblePattern || '#475569';
        ctx.fillRect(px, py, pw, ph);

        // Flagstone paver slabs
        for (let sy = py + 6; sy < py + ph - 4; sy += 14) {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.roundRect(px + 4, sy, pw - 8, 8, 2);
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      };

      // Player house walkway -> Upper E-W Road
      drawDrivewayPath(1.71 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      // Mike/AJ house walkway -> Upper E-W Road
      drawDrivewayPath(9.79 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      // Pluto's house walkway -> Middle E-W Road (Middle-West Block)
      drawDrivewayPath(1.71 * S, 8.85 * S, 0.50 * S, road2Y - 8.85 * S + 4);
      // Card Shop front plaza walkway -> Middle E-W Road (Far-East Block)
      drawDrivewayPath(13.25 * S, 9.05 * S, 0.80 * S, road2Y - 9.05 * S + 4);
      // Nova's house walkway -> Southern Avenue (South-West Block)
      drawDrivewayPath(1.71 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);
      // Silas's house walkway -> Southern Avenue (South-Center Block)
      drawDrivewayPath(7.35 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);
      // Maya's house walkway -> Southern Avenue (South-East Block)
      drawDrivewayPath(12.43 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);

      // Polished Granite Stone Curbs along all avenues with gaps for walkways and intersections
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = '#94a3b8';

      // Upper Road Top Curbs
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: (9.79 - 2.21) * S },
        { x: 10.29 * S, w: W - 10.29 * S }
      ].forEach(c => {
        ctx.fillRect(c.x, road1Y - 4, c.w, 4);
        ctx.strokeRect(c.x, road1Y - 4, c.w, 4);
      });

      // Upper Road Bottom Curbs
      [
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: W - (south2X + south2W) }
      ].forEach(c => {
        ctx.fillRect(c.x, road1Y + road1H, c.w, 4);
        ctx.strokeRect(c.x, road1Y + road1H, c.w, 4);
      });

      // Middle Road Top Curbs
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: south1X - 2.21 * S },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: (13.25 * S) - (south2X + south2W) },
        { x: 14.05 * S, w: W - 14.05 * S }
      ].forEach(c => {
        ctx.fillRect(c.x, road2Y - 4, c.w, 4);
        ctx.strokeRect(c.x, road2Y - 4, c.w, 4);
      });

      // Middle Road Bottom Curbs (leaving gaps for Connector 1 and Connector 2)
      [
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: W - (south2X + south2W) }
      ].forEach(c => {
        ctx.fillRect(c.x, road2Y + road2H, c.w, 4);
        ctx.strokeRect(c.x, road2Y + road2H, c.w, 4);
      });

      // Southern Avenue Top Curbs (leaving gaps for Nova, Silas, Maya walkways & Connector roads)
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: south1X - 2.21 * S },
        { x: south1X + south1W, w: (7.35 * S) - (south1X + south1W) },
        { x: 7.85 * S, w: south2X - 7.85 * S },
        { x: south2X + south2W, w: (12.43 * S) - (south2X + south2W) },
        { x: 12.93 * S, w: W - 12.93 * S }
      ].forEach(c => {
        ctx.fillRect(c.x, road3Y - 4, c.w, 4);
        ctx.strokeRect(c.x, road3Y - 4, c.w, 4);
      });

      // Southern Avenue Bottom Continuous Curb
      ctx.fillRect(0, road3Y + road3H, W, 4);
      ctx.strokeRect(0, road3Y + road3H, W, 4);

      // Vertical Curbs along North-South Connector Roads
      const connMidH = road2Y - (road1Y + road1H);
      const connSouthH = road3Y - (road2Y + road2H);
      [south1X - 4, south1X + south1W, south2X - 4, south2X + south2W].forEach(vx => {
        ctx.fillRect(vx, road1Y + road1H, 4, connMidH);
        ctx.strokeRect(vx, road1Y + road1H, 4, connMidH);
        ctx.fillRect(vx, road2Y + road2H, 4, connSouthH);
        ctx.strokeRect(vx, road2Y + road2H, 4, connSouthH);
      });

      // Limestone Crosswalk Paving Bars at street intersections
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.1;

      const drawCrosswalkRow = (x, y, w, isHoriz) => {
        if (isHoriz) {
          for (let cy = y + 6; cy < y + w - 5; cy += 12) {
            ctx.fillRect(x, cy, 11, 6.5);
            ctx.strokeRect(x, cy, 11, 6.5);
          }
        } else {
          for (let cx = x + 6; cx < x + w - 5; cx += 13) {
            ctx.fillRect(cx, y, 7.5, 11);
            ctx.strokeRect(cx, y, 7.5, 11);
          }
        }
      };

      // Upper Road Crosswalks
      drawCrosswalkRow(south1X - 14, road1Y, road1H, true);
      drawCrosswalkRow(south1X + south1W + 3, road1Y, road1H, true);
      // Middle Road Crosswalks
      drawCrosswalkRow(south1X - 14, road2Y, road2H, true);
      drawCrosswalkRow(south1X + south1W + 3, road2Y, road2H, true);
      drawCrosswalkRow(south2X - 14, road2Y, road2H, true);
      drawCrosswalkRow(south2X + south2W + 3, road2Y, road2H, true);
      drawCrosswalkRow(13.02 * S, road2Y, road2H, true); // Card shop entrance
      // Southern Avenue Crosswalks
      drawCrosswalkRow(south1X - 14, road3Y, road3H, true);
      drawCrosswalkRow(south1X + south1W + 3, road3Y, road3H, true);
      drawCrosswalkRow(south2X - 14, road3Y, road3H, true);
      drawCrosswalkRow(south2X + south2W + 3, road3Y, road3H, true);

      // 3. REUSABLE CRAFTSMAN / VICTORIAN GABLE COTTAGE RENDERER
      const drawNeighborhoodCottage = (cfg) => {
        const {
          hx, hy, hw,
          mirror = false,
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

        // Optional Stone Chimney
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

        // Brick Foundation Base
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

        // Porch Deck
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

        // Clapboard Siding Helper
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

        // Window Helper
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

        drawWin(wingX + 9, rwY + 9, 16, 21, false);
        drawWin(wingX + wingW - 25, rwY + 9, 16, 21, false);
        drawSconce(wingX + wingW * 0.43, rwY + 15);
        drawSconce(wingX + wingW * 0.57, rwY + 15);

        drawWin(gableX + 14, lwY + 11, 16, 20, true);
        drawWin(gableX + gableW - 30, lwY + 11, 16, 20, true);
        drawSconce(gableX + 8, lwY + 18);
        drawSconce(gableX + gableW - 8, lwY + 18);

        // Front Door & Welcome Mat
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

        ctx.fillStyle = doorMatCol;
        ctx.beginPath();
        ctx.roundRect(doorX - 5, doorY + doorH + 1.5, doorW + 10, 10, 5);
        ctx.fill();
        ctx.strokeStyle = '#1b2e1a';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Patio Furniture
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

        // Shingled Roofs
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

        // Front Gable Attic Triangle
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
        drawWin(peakX - 15, peakY + 21, 13, 21, false);
        drawWin(peakX + 2, peakY + 21, 13, 21, false);
        ctx.restore();

        // Overhanging Roof Slopes
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

        // Columns & Porch Stairs
        const stairL = doorX - 7;
        const stairR = doorX + doorW + 7;
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
      };

      // 4A. PLAYER'S COTTAGE (North-West Plot)
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

      // 4B. FRIEND'S (MIKE/AJ) COTTAGE (North-Central Plot)
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

      // 4C. PLUTO'S COTTAGE (Middle-West Plot)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 5.95 * S,
        hw: 3.2 * S,
        mirror: false,
        roofDark: '#1e1b4b',
        roofMid: '#2e1065',
        roofLight: '#3b0764',
        sidingCol: '#cbd5e1',
        sidingLineCol: '#94a3b8',
        trimCol: '#f8fafc',
        doorMatCol: '#7c3aed',
        hasChimney: false,
        glowWindows: true
      });

      // 4D. MIDDLE BLOCK TOWN GREEN / PARK PLAZA & FOUNTAIN
      const drawMiddleTownBlock = () => {
        const bx = 6.95 * S;
        const by = 6.05 * S;
        const bw = 2.75 * S;
        const bh = 2.95 * S;

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

        const cx = bx + bw / 2;
        const cy = by + bh / 2;
        ctx.fillStyle = '#9ca3af';
        ctx.beginPath();
        ctx.arc(cx, cy, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.8;
        ctx.stroke();

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

      // 5. MYTHOS CARD SHOP (Middle-East Plot)
      const drawMythosCardShop = () => {
        const sx = 11.8 * S;
        const sy = 5.95 * S;
        const sw = 3.55 * S;
        const sh = 3.30 * S;
        const roofH = 1.35 * S;
        const wallY = sy + roofH;
        const wallH = sh - roofH - 18;
        const deckY = sy + sh - 18;
        const nearShop = this.nearInteractable?.id === 'card_shop';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(sx - 6, sy + roofH + 10, sw + 14, sh - roofH);

        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx, deckY, sw, 18);
        ctx.strokeRect(sx, deckY, sw, 18);

        ctx.fillStyle = '#d6c7ac';
        ctx.fillRect(sx + 2, wallY, sw - 4, wallH);
        ctx.fillStyle = '#b3a286';
        for (let wy = wallY + 5; wy < wallY + wallH - 4; wy += 5) {
          ctx.fillRect(sx + 2, wy, sw - 4, 1);
        }

        ctx.fillStyle = '#5c3c22';
        ctx.strokeStyle = '#24160b';
        ctx.lineWidth = 1.4;
        [sx, sx + 1.25 * S, sx + 2.35 * S, sx + sw - 8].forEach(px => {
          ctx.fillRect(px, wallY, 8, wallH);
          ctx.strokeRect(px, wallY, 8, wallH);
        });
        ctx.fillRect(sx, wallY, sw, 8);
        ctx.strokeRect(sx, wallY, sw, 8);

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

        ctx.fillStyle = nearShop ? '#7dd3fc' : '#38bdf8';
        ctx.fillRect(doorX + 3, doorY + 4, 13, 22);
        ctx.fillRect(doorX + 20, doorY + 4, 13, 22);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(doorX + 3, doorY + 4, 13, 22);
        ctx.strokeRect(doorX + 20, doorY + 4, 13, 22);

        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(doorX + 14.5, doorY + 28, 2, 6);
        ctx.fillRect(doorX + 19.5, doorY + 28, 2, 6);

        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.roundRect(doorX - 6, deckY + 3, doorW + 12, 12, 5);
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = '#784f2d';
        ctx.strokeStyle = '#26170c';
        ctx.fillRect(doorX - 8, deckY + 14, doorW + 16, 12);
        ctx.strokeRect(doorX - 8, deckY + 14, doorW + 16, 12);

        const rGrad = ctx.createLinearGradient(sx, sy, sx, wallY);
        rGrad.addColorStop(0, '#1e1b4b');
        rGrad.addColorStop(0.55, '#312e81');
        rGrad.addColorStop(1, '#3730a3');
        ctx.fillStyle = rGrad;
        ctx.fillRect(sx - 4, sy, sw + 8, roofH);

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

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px Cinzel, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText("LEO'S CARD SHOP", signX + signW / 2 + 8, signY + 15);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText('MYTHOS BOOSTER PACKS • DECKS', signX + signW / 2 + 8, signY + 25.5);
      };
      drawMythosCardShop();

      // =======================================================================
      // 4E, 4F, 4G: THE 3 NEW SOUTH BLOCK HOUSES
      // =======================================================================
      // NOVA'S COTTAGE (South-West Plot)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 11.20 * S,
        hw: 3.2 * S,
        mirror: false,
        roofDark: '#0f172a',
        roofMid: '#1e293b',
        roofLight: '#334155',
        sidingCol: '#94a3b8',
        sidingLineCol: '#64748b',
        trimCol: '#f8fafc',
        doorMatCol: '#7c3aed',
        hasChimney: false,
        glowWindows: true
      });

      // SILAS'S COTTAGE (South-Center Plot)
      drawNeighborhoodCottage({
        hx: 6.85 * S,
        hy: 11.20 * S,
        hw: 3.0 * S,
        mirror: true,
        roofDark: '#14532d',
        roofMid: '#166534',
        roofLight: '#15803d',
        sidingCol: '#d97706',
        sidingLineCol: '#b45309',
        trimCol: '#fef3c7',
        doorMatCol: '#9a3412',
        hasChimney: true,
        glowWindows: false
      });

      // MAYA'S COTTAGE (South-East Plot)
      drawNeighborhoodCottage({
        hx: 11.8 * S,
        hy: 11.20 * S,
        hw: 3.2 * S,
        mirror: false,
        roofDark: '#4c0519',
        roofMid: '#881337',
        roofLight: '#9f1239',
        sidingCol: '#a7f3d0',
        sidingLineCol: '#6ee7b7',
        trimCol: '#fffbeb',
        doorMatCol: '#059669',
        hasChimney: false,
        glowWindows: true
      });

      // 6. READABLE ROADSIDE MAILBOXES ACROSS ALL 3 BLOCKS
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
      const nearPlutoMb = this.nearInteractable?.id === 'pluto_mailbox';
      const nearNovaMb = this.nearInteractable?.id === 'nova_mailbox';
      const nearSilasMb = this.nearInteractable?.id === 'silas_mailbox';
      const nearMayaMb = this.nearInteractable?.id === 'maya_mailbox';

      drawMailbox(4.75 * S, 3.95 * S, `📬 ${pName}'s House`, '#2563eb', nearPlayerMb);
      drawMailbox(8.15 * S, 3.95 * S, `📬 ${fName}'s House`, '#dc2626', nearFriendMb);
      drawMailbox(4.75 * S, 9.25 * S, `📬 Pluto's House`, '#9333ea', nearPlutoMb);
      drawMailbox(4.75 * S, 14.50 * S, `📬 Nova's House`, '#3b82f6', nearNovaMb);
      drawMailbox(6.45 * S, 14.50 * S, `📬 Silas's House`, '#15803d', nearSilasMb);
      drawMailbox(11.35 * S, 14.50 * S, `📬 Maya's House`, '#f43f5e', nearMayaMb);

      // 7. DIRECTIONAL SIGNPOSTS
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
      drawSignpost(7.35 * S, 14.50 * S);

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
        { x: 11.4 * S, y: 8.7 * S, c: '#eab308' },
        { x: 5.0 * S, y: 11.8 * S, c: '#38bdf8' },
        { x: 5.0 * S, y: 13.8 * S, c: '#a855f7' },
        { x: 10.2 * S, y: 11.8 * S, c: '#eab308' },
        { x: 10.2 * S, y: 13.8 * S, c: '#f43f5e' },
        { x: 15.2 * S, y: 12.2 * S, c: '#38bdf8' }
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

      // 9. Lush Forest Trees & Shrubs framing the Full 3-Block Neighborhood
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

      // Trees in North Block
      drawLushBushCluster(6.0 * S, 0.9 * S, 24, true);
      drawLushBushCluster(6.0 * S, 2.0 * S, 22, false);
      drawLushBushCluster(6.0 * S, 3.0 * S, 20, false);
      drawLushBushCluster(0.45 * S, 0.9 * S, 23, false);
      drawLushBushCluster(0.55 * S, 2.2 * S, 22, true);
      drawLushBushCluster(12.2 * S, 0.9 * S, 24, false);
      drawLushBushCluster(14.5 * S, 1.2 * S, 25, true);
      drawLushBushCluster(13.4 * S, 2.6 * S, 23, false);
      drawLushBushCluster(15.2 * S, 3.1 * S, 22, false);

      // Trees in Middle Block (framing Pluto's House)
      drawLushBushCluster(0.45 * S, 6.2 * S, 22, false);
      drawLushBushCluster(0.50 * S, 8.2 * S, 22, true);
      drawLushBushCluster(2.2 * S, 5.55 * S, 18, false);
      drawLushBushCluster(3.8 * S, 5.55 * S, 18, true);
      drawLushBushCluster(4.9 * S, 6.6 * S, 22, false);
      drawLushBushCluster(5.0 * S, 8.2 * S, 20, false);

      // Trees in South Block (framing Nova, Silas, and Maya's houses)
      drawLushBushCluster(0.45 * S, 11.5 * S, 24, false);
      drawLushBushCluster(0.50 * S, 13.5 * S, 23, true);
      drawLushBushCluster(2.2 * S, 10.8 * S, 18, false);
      drawLushBushCluster(3.8 * S, 10.8 * S, 18, true);
      drawLushBushCluster(4.9 * S, 12.2 * S, 20, false);
      drawLushBushCluster(10.2 * S, 12.5 * S, 20, true);
      drawLushBushCluster(15.2 * S, 11.5 * S, 24, false);
      drawLushBushCluster(15.2 * S, 13.5 * S, 23, true);

      // Deep Southern Forest Border below Southern Avenue
      drawLushBushCluster(1.5 * S, 16.7 * S, 26, false);
      drawLushBushCluster(4.5 * S, 16.8 * S, 24, true);
      drawLushBushCluster(7.5 * S, 16.8 * S, 26, false);
      drawLushBushCluster(10.8 * S, 16.7 * S, 24, true);
      drawLushBushCluster(13.8 * S, 16.8 * S, 26, false);

      // South Edge Park Bench
      const sBenchX = 7.35 * S - 20;
      const sBenchY = 16.45 * S;
      ctx.fillStyle = '#784f2d';
      ctx.strokeStyle = '#26170c';
      ctx.lineWidth = 1.3;
      ctx.fillRect(sBenchX, sBenchY, 40, 10);
      ctx.strokeRect(sBenchX, sBenchY, 40, 10);
      ctx.fillStyle = '#5c3c22';
      ctx.fillRect(sBenchX, sBenchY - 4, 40, 4);
      ctx.strokeRect(sBenchX, sBenchY - 4, 40, 4);

      // -----------------------------------------------------------------------
      // 10. CENTRAL PARK & COURTYARD OF PICNIC TABLES (East Expansion: x = 16.0..26.0)
      // -----------------------------------------------------------------------
      const parkStartX = 16.0 * S;

      // Manicured park lawn stripes across Central Park
      for (let px = parkStartX; px < EXT_W; px += 36) {
        ctx.fillStyle = (Math.floor(px / 36) % 2 === 0) ? 'rgba(38, 107, 29, 0.28)' : 'rgba(45, 122, 34, 0.28)';
        ctx.fillRect(px, 0, 36, EXT_H);
      }

      // Grand Flagstone Promenade from Road into Courtyard
      const promY = road2Y;
      const promH = road2H;
      ctx.fillStyle = '#1e242d';
      ctx.fillRect(parkStartX - 4, promY - 4, 2.5 * S + 8, promH + 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(parkStartX, promY, 2.5 * S, promH);

      // Flagstone paver grid on promenade
      for (let fx = parkStartX + 6; fx < parkStartX + 2.5 * S - 4; fx += 18) {
        for (let fy = promY + 6; fy < promY + promH - 4; fy += 16) {
          ctx.fillStyle = (Math.floor((fx + fy) / 16) % 2 === 0) ? '#64748b' : '#475569';
          ctx.fillRect(fx, fy, 15, 13);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(fx, fy, 15, 13);
        }
      }

      // Courtyard Plaza Base Paving (x = 18.2*S .. 24.2*S, y = 6.4*S .. 11.8*S)
      const plazaX = 18.2 * S;
      const plazaY = 6.4 * S;
      const plazaW = 6.0 * S;
      const plazaH = 5.4 * S;

      // North path connecting plaza to Duck Pond
      ctx.fillStyle = '#1e242d';
      ctx.fillRect(21.8 * S - 4, 4.4 * S - 4, 1.6 * S + 8, 2.0 * S + 8);
      ctx.fillStyle = '#475569';
      ctx.fillRect(21.8 * S, 4.4 * S, 1.6 * S, 2.0 * S);
      for (let px = 21.8 * S + 4; px < 23.4 * S - 4; px += 16) {
        for (let py = 4.4 * S + 4; py < 6.4 * S - 4; py += 15) {
          ctx.fillStyle = (Math.floor((px + py) / 15) % 2 === 0) ? '#64748b' : '#475569';
          ctx.fillRect(px, py, 14, 12);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, 14, 12);
        }
      }

      // Plaza Stone Curb & Pavers
      ctx.fillStyle = '#1e242d';
      ctx.beginPath();
      ctx.roundRect(plazaX - 6, plazaY - 6, plazaW + 12, plazaH + 12, 18);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(plazaX - 3, plazaY - 3, plazaW + 6, plazaH + 6, 15);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(plazaX, plazaY, plazaW, plazaH, 12);
      ctx.fill();

      // Courtyard Octagonal / Grid Flagstone Pavers
      for (let cx = plazaX + 6; cx < plazaX + plazaW - 8; cx += 22) {
        for (let cy = plazaY + 6; cy < plazaY + plazaH - 8; cy += 20) {
          const paverCol = (Math.floor(cx / 22) + Math.floor(cy / 20)) % 3;
          ctx.fillStyle = paverCol === 0 ? '#64748b' : (paverCol === 1 ? '#475569' : '#526071');
          ctx.fillRect(cx, cy, 19, 17);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.1;
          ctx.strokeRect(cx, cy, 19, 17);
        }
      }

      // Boxwood Hedges and Flower Beds outlining Courtyard
      const drawHedge = (hx, hy, hw, hh) => {
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.roundRect(hx, hy, hw, hh, 5);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(hx + 2, hy + 2, hw - 4, hh - 5, 4);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        for (let fx = hx + 5; fx < hx + hw - 4; fx += 12) {
          ctx.beginPath();
          ctx.arc(fx, hy + 4, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // Flower bed dots
      const drawFlowers = (fx, fy, count, palette) => {
        for (let i = 0; i < count; i++) {
          const col = palette[i % palette.length];
          const ox = ((i * 7) % 24) - 12;
          const oy = ((i * 11) % 18) - 9;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(fx + ox, fy + oy, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fx + ox, fy + oy, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // West hedges flanking entrance into courtyard
      drawHedge(plazaX - 8, plazaY, 8, (promY - plazaY));
      drawHedge(plazaX - 8, promY + promH, 8, (plazaY + plazaH) - (promY + promH));
      // North and South courtyard hedges
      drawHedge(plazaX, plazaY - 8, 3.6 * S, 8);
      drawHedge(plazaX + 5.2 * S, plazaY - 8, 0.8 * S, 8);
      drawHedge(plazaX, plazaY + plazaH, plazaW, 8);
      // East courtyard hedge
      drawHedge(plazaX + plazaW, plazaY, 8, plazaH);

      // Colorful blooming flower clusters
      const flowers1 = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6']; // Roses/Peonies
      const flowers2 = ['#eab308', '#facc15', '#fde047', '#fb923c']; // Marigolds
      const flowers3 = ['#a855f7', '#c084fc', '#818cf8', '#38bdf8']; // Lavender/Hydrangeas
      drawFlowers(plazaX + 16, plazaY - 14, 8, flowers1);
      drawFlowers(plazaX + 1.8 * S, plazaY - 14, 9, flowers2);
      drawFlowers(plazaX + 16, plazaY + plazaH + 14, 8, flowers3);
      drawFlowers(plazaX + 3.0 * S, plazaY + plazaH + 14, 9, flowers1);
      drawFlowers(plazaX + 5.2 * S, plazaY + plazaH + 14, 8, flowers2);
      drawFlowers(plazaX + plazaW + 14, plazaY + 1.5 * S, 7, flowers3);
      drawFlowers(plazaX + plazaW + 14, plazaY + 3.5 * S, 8, flowers1);

      // 4 Ornate Victorian Street Lamps at Plaza Corners
      const drawVictorianLamp = (lx, ly) => {
        // Warm ambient light glow
        const lampGlow = ctx.createRadialGradient(lx, ly - 26, 4, lx, ly - 26, 42);
        lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.40)');
        lampGlow.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
        lampGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lx, ly - 26, 42, 0, Math.PI * 2);
        ctx.fill();

        // Cast-iron base & fluted pole
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx - 5, ly - 3, 10, 4);
        ctx.fillRect(lx - 2.5, ly - 24, 5, 22);
        // Cross arm & lantern bracket
        ctx.fillRect(lx - 6, ly - 22, 12, 2.5);
        // Lantern head
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(lx - 6, ly - 32, 12, 10, 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - 4, ly - 30, 8, 6);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx - 6, ly - 34, 12, 2.5);
        ctx.fillRect(lx - 2, ly - 37, 4, 3);
      };

      drawVictorianLamp(plazaX + 12, plazaY + 12);
      drawVictorianLamp(plazaX + plazaW - 12, plazaY + 12);
      drawVictorianLamp(plazaX + 12, plazaY + plazaH - 12);
      drawVictorianLamp(plazaX + plazaW - 12, plazaY + plazaH - 12);

      // Park Entrance Gate at x = 16.0*S
      const gateTopY = road2Y - 16;
      const gateBotY = road2Y + road2H + 16;
      // North & South Masonry Gate Pillars
      const drawGatePillar = (gx, gy) => {
        ctx.fillStyle = '#1e242d';
        ctx.fillRect(gx - 2, gy - 2, 26, 38);
        ctx.fillStyle = '#475569';
        ctx.fillRect(gx, gy, 22, 34);
        // Stone quoin blocks
        ctx.fillStyle = '#64748b';
        ctx.fillRect(gx + 2, gy + 3, 18, 7);
        ctx.fillRect(gx + 2, gy + 14, 18, 7);
        ctx.fillRect(gx + 2, gy + 25, 18, 7);
        // Copper cap
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.moveTo(gx - 3, gy);
        ctx.lineTo(gx + 11, gy - 8);
        ctx.lineTo(gx + 25, gy);
        ctx.closePath();
        ctx.fill();
      };
      drawGatePillar(parkStartX - 10, gateTopY - 26);
      drawGatePillar(parkStartX - 10, gateBotY);

      // Decorative Overhead Arch spanning into Central Park
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(parkStartX + 1, road2Y + road2H / 2, (gateBotY - gateTopY + 16) / 2, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();

      // Suspended Welcome Banner Sign
      const archSignX = parkStartX + 6;
      const archSignY = road2Y + road2H / 2 - 12;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(archSignX, archSignY - 11, 168, 22, 4);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = 'bold 9.5px Inter, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('🌳 OAKHAVEN CENTRAL PARK 🌳', archSignX + 84, archSignY + 4);

      // Welcome Signpost near gate
      const signX = 16.6 * S;
      const signY = 9.25 * S;
      ctx.fillStyle = '#5c3c22';
      ctx.fillRect(signX - 2.5, signY - 14, 5, 20);
      ctx.fillStyle = '#784f2d';
      ctx.beginPath();
      ctx.roundRect(signX - 18, signY - 26, 36, 14, 2);
      ctx.fill();
      ctx.strokeStyle = '#26170c';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('PARK', signX, signY - 16);

      // -----------------------------------------------------------------------
      // NORTH DUCK POND (x = 21.8*S .. 25.4*S, y = 1.6*S .. 4.4*S)
      // -----------------------------------------------------------------------
      const pondX = 23.6 * S;
      const pondY = 3.0 * S;
      const pondRadiusX = 1.7 * S;
      const pondRadiusY = 1.35 * S;

      // River stones and mossy boulders along shoreline
      for (let a = 0; a < Math.PI * 2; a += 0.32) {
        const sx = pondX + Math.cos(a) * (pondRadiusX + 5);
        const sy = pondY + Math.sin(a) * (pondRadiusY + 5);
        ctx.fillStyle = ((Math.floor(a * 10) % 2 === 0) ? '#475569' : '#64748b');
        ctx.beginPath();
        ctx.ellipse(sx, sy, 7, 5, a, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pond Water Basin
      const pGrad = ctx.createRadialGradient(pondX, pondY, 12, pondX, pondY, pondRadiusX);
      pGrad.addColorStop(0, '#38bdf8');
      pGrad.addColorStop(0.35, '#0284c7');
      pGrad.addColorStop(0.75, '#0369a1');
      pGrad.addColorStop(1, '#075985');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(pondX, pondY, pondRadiusX, pondRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Animated Water Waves / Ripples
      const wavePhase = (this.tick * 0.05) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 3; r++) {
        const wrX = 22 + r * 28 + Math.sin(wavePhase + r) * 6;
        const wrY = 14 + r * 18 + Math.sin(wavePhase + r) * 4;
        ctx.beginPath();
        ctx.ellipse(pondX - 10, pondY + 4, wrX, wrY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Water Lily Pads & Lotus Flowers
      const lilyPads = [
        { x: pondX - 55, y: pondY - 25, r: 8, lotus: true },
        { x: pondX - 35, y: pondY + 30, r: 10, lotus: false },
        { x: pondX + 45, y: pondY - 20, r: 9, lotus: true },
        { x: pondX + 30, y: pondY + 32, r: 8, lotus: false },
        { x: pondX - 70, y: pondY + 10, r: 7, lotus: true }
      ];
      lilyPads.forEach(pad => {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, pad.r, 0.25, Math.PI * 2 - 0.25);
        ctx.lineTo(pad.x, pad.y);
        ctx.fill();
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (pad.lotus) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(pad.x, pad.y - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pad.x, pad.y - 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Swimming Ducks in the Pond (Mother Mallard + 3 Tiny Ducklings)
      const duckBob = Math.sin(this.tick * 0.09) * 2;
      const duckX = pondX + Math.sin(this.tick * 0.02) * 25;
      const duckY = pondY - 8 + duckBob;

      // Mother Duck
      ctx.fillStyle = '#78350f'; // body
      ctx.beginPath();
      ctx.ellipse(duckX, duckY, 9, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#065f46'; // iridescent head
      ctx.beginPath();
      ctx.arc(duckX - 7, duckY - 4, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15'; // beak
      ctx.beginPath();
      ctx.moveTo(duckX - 11, duckY - 3);
      ctx.lineTo(duckX - 14, duckY - 4);
      ctx.lineTo(duckX - 11, duckY - 5);
      ctx.closePath();
      ctx.fill();

      // 3 Ducklings paddling behind
      for (let di = 1; di <= 3; di++) {
        const dkx = duckX + di * 12;
        const dky = duckY + di * 3 + Math.sin(this.tick * 0.09 + di) * 1.5;
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.ellipse(dkx, dky, 4.5, 3.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(dkx - 3.5, dky - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Weeping Willow on West Bank of Pond
      const willowX = 21.4 * S;
      const willowY = 2.4 * S;
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(willowX - 8, willowY + 36);
      ctx.quadraticCurveTo(willowX - 14, willowY + 12, willowX - 4, willowY - 14);
      ctx.quadraticCurveTo(willowX + 10, willowY + 14, willowX + 8, willowY + 36);
      ctx.closePath();
      ctx.fill();

      // Willow Drooping Foliage Tendrils
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(willowX - 4, willowY - 16, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.8;
      for (let ti = -24; ti <= 24; ti += 7) {
        ctx.beginPath();
        ctx.moveTo(willowX + ti, willowY - 14);
        const sway = Math.sin(this.tick * 0.04 + ti) * 4;
        ctx.quadraticCurveTo(willowX + ti + sway, willowY + 10, willowX + ti + sway * 1.5, willowY + 28);
        ctx.stroke();
      }

      // -----------------------------------------------------------------------
      // CENTRAL WATER FOUNTAIN (x = 21.1*S, y = 9.0*S)
      // -----------------------------------------------------------------------
      const ftx = 21.1 * S;
      const fty = 9.0 * S;

      // Outer stone basin & coping
      ctx.fillStyle = '#1e242d';
      ctx.beginPath();
      ctx.arc(ftx, fty, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(ftx, fty, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fountain pool water
      const fWaterGrad = ctx.createRadialGradient(ftx, fty, 4, ftx, fty, 38);
      fWaterGrad.addColorStop(0, '#38bdf8');
      fWaterGrad.addColorStop(0.5, '#0284c7');
      fWaterGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = fWaterGrad;
      ctx.beginPath();
      ctx.arc(ftx, fty, 38, 0, Math.PI * 2);
      ctx.fill();

      // Concentric water ripples
      const fRip = (this.tick * 0.08) % (Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ftx, fty, 16 + Math.sin(fRip) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ftx, fty, 28 + Math.cos(fRip) * 5, 0, Math.PI * 2);
      ctx.stroke();

      // Middle stone pedestal & tier
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(ftx, fty, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(ftx, fty, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top tiered spire
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(ftx, fty, 10, 0, Math.PI * 2);
      ctx.fill();

      // Gushing Animated Water Plume & Sparkling Splashes
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(ftx, fty - 5 + Math.sin(this.tick * 0.25) * 2, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // Water spray particles
      for (let sp = 0; sp < 6; sp++) {
        const sAng = sp * (Math.PI / 3) + this.tick * 0.12;
        const sDist = 10 + Math.sin(this.tick * 0.3 + sp) * 4;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.75)';
        ctx.beginPath();
        ctx.arc(ftx + Math.cos(sAng) * sDist, fty + Math.sin(sAng) * sDist, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // -----------------------------------------------------------------------
      // 3 PICNIC TABLES IN THE COURTYARD
      // -----------------------------------------------------------------------
      const drawPicnicTableBase = (tx, ty) => {
        // Wooden top & bottom benches
        const tw = 80;
        const th = 38;
        const bw = 86;
        const bh = 9;

        // Top bench
        ctx.fillStyle = '#451a03';
        ctx.fillRect(tx - bw / 2 - 1, ty - th / 2 - bh - 2, bw + 2, bh + 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - bw / 2, ty - th / 2 - bh - 1, bw, bh);
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - bw / 2, ty - th / 2 - bh - 1, bw, bh);

        // Bottom bench
        ctx.fillStyle = '#451a03';
        ctx.fillRect(tx - bw / 2 - 1, ty + th / 2 + 1, bw + 2, bh + 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - bw / 2, ty + th / 2 + 2, bw, bh);
        ctx.strokeRect(tx - bw / 2, ty + th / 2 + 2, bw, bh);

        // Wooden table surface frame
        ctx.fillStyle = '#3a1a06';
        ctx.fillRect(tx - tw / 2 - 2, ty - th / 2 - 2, tw + 4, th + 4);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(tx - tw / 2, ty - th / 2, tw, th);
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(tx - tw / 2, ty - th / 2, tw, th);
      };

      // TABLE 1 (NW / Chloe's Picnic Table) at x = 19.5*S, y = 7.7*S
      const t1x = 19.5 * S;
      const t1y = 7.7 * S;
      drawPicnicTableBase(t1x, t1y);

      // Red-and-White Checkered Tablecloth
      const t1w = 74;
      const t1h = 32;
      const checkSize = 7.4;
      ctx.save();
      ctx.beginPath();
      ctx.rect(t1x - t1w / 2, t1y - t1h / 2, t1w, t1h);
      ctx.clip();
      for (let rx = t1x - t1w / 2; rx < t1x + t1w / 2; rx += checkSize) {
        for (let ry = t1y - t1h / 2; ry < t1y + t1h / 2; ry += checkSize) {
          const isRed = (Math.floor((rx - (t1x - t1w / 2)) / checkSize) + Math.floor((ry - (t1y - t1h / 2)) / checkSize)) % 2 === 0;
          ctx.fillStyle = isRed ? '#dc2626' : '#ffffff';
          ctx.fillRect(rx, ry, checkSize, checkSize);
        }
      }
      ctx.restore();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1;
      ctx.strokeRect(t1x - t1w / 2, t1y - t1h / 2, t1w, t1h);

      // Props on Table 1: Picnic Basket, Lemonade Pitcher, Cookies
      // Wicker Picnic Basket
      const bskX = t1x - 22;
      const bskY = t1y - 3;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(bskX - 10, bskY - 8, 20, 16, 3);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Straw weave texture
      ctx.strokeStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(bskX - 9, bskY); ctx.lineTo(bskX + 9, bskY);
      ctx.stroke();
      // Lemonade Glass Pitcher
      const pitX = t1x + 8;
      const pitY = t1y - 2;
      ctx.fillStyle = '#fef08a'; // yellow lemonade
      ctx.beginPath();
      ctx.roundRect(pitX - 6, pitY - 7, 12, 14, 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8'; // glass outline
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Ice cubes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pitX - 3, pitY - 5, 3, 3);
      ctx.fillRect(pitX + 1, pitY - 2, 3, 3);
      // Drinking glass with red straw
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(t1x + 22, t1y - 5, 5, 9);
      ctx.strokeStyle = '#ef4444'; // straw
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(t1x + 24, t1y - 10); ctx.lineTo(t1x + 24, t1y + 2);
      ctx.stroke();
      // Plate of berry cookies
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(t1x - 4, t1y + 5, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(t1x - 7, t1y + 3, 3, 3);
      ctx.fillRect(t1x - 2, t1y + 3, 3, 3);
      ctx.fillRect(t1x + 2, t1y + 3, 3, 3);

      // TABLE 2 (NE / Rowan's Mythos Duel Table) at x = 22.8*S, y = 7.7*S
      const t2x = 22.8 * S;
      const t2y = 7.7 * S;
      drawPicnicTableBase(t2x, t2y);

      // Forest Green Duelist Playmat
      const t2w = 74;
      const t2h = 32;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(t2x - t2w / 2, t2y - t2h / 2, t2w, t2h, 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Open 9-Pocket Trading Card Binder
      const bdrX = t2x - 15;
      const bdrY = t2y;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(bdrX - 16, bdrY - 10, 32, 20);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.strokeRect(bdrX - 16, bdrY - 10, 32, 20);
      // Mini cards in 9-pocket sleeves
      const miniColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#06b6d4'];
      for (let mx = 0; mx < 3; mx++) {
        for (let my = 0; my < 2; my++) {
          ctx.fillStyle = miniColors[(mx + my * 3) % miniColors.length];
          ctx.fillRect(bdrX - 13 + mx * 9, bdrY - 8 + my * 8, 7, 6);
        }
      }

      // Two Tournament Deck Boxes (Ruby Red & Royal Blue)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(t2x + 12, t2y - 10, 9, 12);
      ctx.strokeStyle = '#fef08a';
      ctx.strokeRect(t2x + 12, t2y - 10, 9, 12);

      ctx.fillStyle = '#2563eb';
      ctx.fillRect(t2x + 23, t2y - 10, 9, 12);
      ctx.strokeStyle = '#fef08a';
      ctx.strokeRect(t2x + 23, t2y - 10, 9, 12);

      // Polyhedral Dice & Token Markers
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(t2x + 16, t2y + 6, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(t2x + 24, t2y + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // TABLE 3 (South / Jasper's Wildlife Sketch Table) at x = 21.1*S, y = 10.5*S
      const t3x = 21.1 * S;
      const t3y = 10.5 * S;
      drawPicnicTableBase(t3x, t3y);

      // Cedar wood plank lines on Table 3
      ctx.strokeStyle = '#5c3c22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t3x - 36, t3y - 6); ctx.lineTo(t3x + 36, t3y - 6);
      ctx.moveTo(t3x - 36, t3y + 4); ctx.lineTo(t3x + 36, t3y + 4);
      ctx.stroke();

      // Heavy Brass Field Binoculars
      const binX = t3x - 18;
      const binY = t3y - 2;
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(binX - 6, binY - 7, 5, 14);
      ctx.fillRect(binX + 1, binY - 7, 5, 14);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(binX - 2, binY - 4, 4, 8); // center bridge
      ctx.fillStyle = '#38bdf8'; // lenses
      ctx.fillRect(binX - 6, binY + 5, 5, 2);
      ctx.fillRect(binX + 1, binY + 5, 5, 2);

      // Open Leatherbound Wildlife Sketchbook
      const sktX = t3x + 6;
      const sktY = t3y;
      ctx.fillStyle = '#78350f'; // leather cover
      ctx.fillRect(sktX - 14, sktY - 9, 28, 18);
      ctx.fillStyle = '#fef3c7'; // parchment pages
      ctx.fillRect(sktX - 12, sktY - 8, 11, 16);
      ctx.fillRect(sktX + 1, sktY - 8, 11, 16);
      // Sketch drawing lines of a bird/beast
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sktX - 10, sktY - 3);
      ctx.lineTo(sktX - 4, sktY - 5);
      ctx.lineTo(sktX - 2, sktY + 2);
      ctx.stroke();
      // Graphite pencil
      ctx.fillStyle = '#eab308';
      ctx.fillRect(sktX + 16, sktY - 7, 2.5, 15);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sktX + 16, sktY - 9, 2.5, 2);

      // Fresh Red Orchard Apple
      const appX = t3x + 28;
      const appY = t3y + 4;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(appX, appY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e'; // leaf
      ctx.beginPath();
      ctx.ellipse(appX + 2, appY - 4, 2, 1, 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Perimeter Trees framing Central Park
      drawLushBushCluster(18.0 * S, 1.2 * S, 26, false);
      drawLushBushCluster(19.8 * S, 0.8 * S, 24, true);
      drawLushBushCluster(25.2 * S, 1.2 * S, 26, false);
      drawLushBushCluster(25.5 * S, 5.8 * S, 26, true);
      drawLushBushCluster(25.4 * S, 8.5 * S, 25, false);
      drawLushBushCluster(25.5 * S, 11.8 * S, 26, true);
      drawLushBushCluster(25.2 * S, 14.5 * S, 26, false);
      drawLushBushCluster(18.0 * S, 16.6 * S, 26, false);
      drawLushBushCluster(21.5 * S, 16.7 * S, 26, true);
      drawLushBushCluster(24.5 * S, 16.6 * S, 26, false);
    }
    drawEntity(entity) {
      if (!entity || !entity.sprite) return;
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

      const isTargetNpcNear = this.nearInteractable && (
        this.nearInteractable.id === entity.id ||
        (entity.id === 'friend' && this.nearInteractable.id === 'friend_duel') ||
        (entity.id === 'best_friend' && (this.nearInteractable.id === 'friend_duel' || this.nearInteractable.id === 'friend')) ||
        (this.nearInteractable === entity)
      );
      const showTalkBubble = isTargetNpcNear && !this.activeDialogueNpc;
      const bubbleText = showTalkBubble ? '💬' : entity.bubble;

      if (bubbleText) {
        const by = footY - (isExt ? 62 : 96) - Math.sin(this.tick * 0.09) * 4;
        ctx.fillStyle = showTalkBubble ? '#fef08a' : '#ffffff';
        ctx.beginPath();
        ctx.roundRect(cx - (showTalkBubble ? 16 : 14), by, (showTalkBubble ? 32 : 28), 22, 6);
        ctx.fill();
        ctx.strokeStyle = showTalkBubble ? '#ca8a04' : '#0f172a';
        ctx.lineWidth = showTalkBubble ? 2.5 : 2;
        ctx.stroke();
        ctx.font = isExt ? '12.5px sans-serif' : '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bubbleText, cx, by + 15.5);
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

      if (this.currentArea === 'interior' || this.currentArea === 'friend_interior' || this.currentArea === 'card_shop_interior') {
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

    getActiveNpcsForArea(area = this.currentArea) {
      const active = [];

      if (area === 'interior') {
        let mom = this.npcs.find(n => n.id === 'mom');
        if (mom) {
          active.push(mom);
        } else if (this.hasMomBoosterMoney) {
          mom = this.createMomNpc();
          mom.x = 14.8;
          mom.y = 6.2;
          mom.dir = 'left';
          mom.bubble = '🍳';
          this.npcs.push(mom);
          active.push(mom);
        }

        const friend = this.npcs.find(n => n.id === 'best_friend' || n.id === 'friend');
        if (friend) {
          if (!this.hasMomBoosterMoney || (!this.hasOpenedStarterPack && !this.friendWaitingAtHouse)) {
            active.push(friend);
          }
        }
      } else if (area === 'friend_interior') {
        let friend = this.npcs.find(n => n.id === 'best_friend' || n.id === 'friend');
        if (!friend) {
          friend = this.createFriendNpc(this.friendName);
          this.npcs.unshift(friend);
        }
        friend.x = 4.1;
        friend.y = 6.8;
        friend.dir = 'right';
        friend.bubble = '⚔️';
        active.push(friend);
      } else if (area === 'card_shop_interior') {
        if (!this.shopkeeperNpc) this.shopkeeperNpc = this.createShopkeeperNpc();
        active.push(this.shopkeeperNpc);
      } else if (area === 'pluto_interior') {
        if (!this.plutoNpc) this.plutoNpc = this.createPlutoNpc();
        this.plutoNpc.x = 6.2;
        this.plutoNpc.y = 4.95;
        this.plutoNpc.dir = 'down';
        active.push(this.plutoNpc);
      } else if (area === 'nova_interior') {
        if (!this.novaNpc) this.novaNpc = this.createNovaNpc();
        this.novaNpc.x = 6.2;
        this.novaNpc.y = 5.35;
        this.novaNpc.dir = 'down';
        active.push(this.novaNpc);
      } else if (area === 'silas_interior') {
        if (!this.silasNpc) this.silasNpc = this.createSilasNpc();
        this.silasNpc.x = 6.2;
        this.silasNpc.y = 5.35;
        this.silasNpc.dir = 'down';
        active.push(this.silasNpc);
      } else if (area === 'maya_interior') {
        if (!this.mayaNpc) this.mayaNpc = this.createMayaNpc();
        this.mayaNpc.x = 6.2;
        this.mayaNpc.y = 5.35;
        this.mayaNpc.dir = 'down';
        active.push(this.mayaNpc);
      } else if (area === 'exterior') {
        const friend = this.npcs.find(n => n.id === 'best_friend' || n.id === 'friend');
        if (friend && friend.following && !this.friendWaitingAtHouse) {
          active.push(friend);
        }
        if (!this.chloeNpc) this.chloeNpc = this.createChloeNpc();
        if (!this.rowanNpc) this.rowanNpc = this.createRowanNpc();
        if (!this.jasperNpc) this.jasperNpc = this.createJasperNpc();
        active.push(this.chloeNpc, this.rowanNpc, this.jasperNpc);
      }

      return active;
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

      const isExt = this.currentArea === 'exterior';

      if (this.currentArea === 'interior') {
        this.renderCutawayInterior();
      } else if (this.currentArea === 'friend_interior') {
        this.renderFriendHouseInterior();
      } else if (this.currentArea === 'card_shop_interior') {
        this.renderCardShopInterior();
      } else if (this.currentArea === 'pluto_interior') {
        this.renderPlutoHouseInterior();
      } else if (this.currentArea === 'nova_interior') {
        this.renderNovaHouseInterior();
      } else if (this.currentArea === 'silas_interior') {
        this.renderSilasHouseInterior();
      } else if (this.currentArea === 'maya_interior') {
        this.renderMayaHouseInterior();
      } else {
        ctx.save();
        ctx.translate(-Math.round(this.cameraX || 0), -Math.round(this.cameraY || 0));
        this.renderCraftsmanExterior();
      }

      const activeNpcs = this.getActiveNpcsForArea(this.currentArea);

      const entities = [
        ...activeNpcs.map(n => ({
          id: n.id,
          x: n.x,
          y: n.y,
          dir: n.dir,
          walkTick: n.walkTick || 0,
          name: n.name,
          bubble: n.bubble,
          sprite: n.sprite
        })),
        {
          id: 'player',
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

      if (this.currentArea === 'card_shop_interior') {
        this.renderShopCounterForeground();
      } else if (this.currentArea === 'pluto_interior') {
        this.renderPlutoDeskForeground();
      }

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

      if (this.touchBeacon) {
        this.touchBeacon.tick++;
        const bx = this.touchBeacon.x * S;
        const by = this.touchBeacon.y * S;
        const prog = this.touchBeacon.tick / 24;
        if (prog < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 6 + prog * 18, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - prog) * 0.9})`;
          ctx.lineWidth = 2.5 * (1 - prog);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(bx, by, 3 * (1 - prog), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(254, 240, 138, ${(1 - prog) * 0.95})`;
          ctx.fill();
          ctx.restore();
        } else {
          this.touchBeacon = null;
        }
      }

      if (isExt) {
        ctx.restore();
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
