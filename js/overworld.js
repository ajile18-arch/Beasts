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
      this.EXT_ZOOM = 1.28; // Cozy RPG closer framing (~12.5x9.4 tiles) matching illustrated pixel style
      this.cameraY = 0;
      this.cameraX = 0;
      this.cobblePattern = null;
      this.woodFloorPattern = null;
      this.owSprites = {};
      this.LOGICAL_TILE = 32;
      this.RENDER_SCALE = 2;
      this.TILE = this.LOGICAL_TILE * this.RENDER_SCALE; // 64px

      this.loadOverworldSprites();

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
      this.hasBoughtBase2v2Map = false;
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
          highlight: 'Handcrafted Card Frames',
          desc: "Silas hosts his woodworking display at the local shop! Stop by his cabin or the shop to admire his carved Mythos display frames.",
          perk: "Woodcraft showcase at Leo's Card Shop"
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
          highlight: 'Booster Sale ($4.00 per pack)',
          desc: "The weekend outdoor market brings discounts to Leo's Card Shop! 1st-Edition Booster Packs are on sale for $4.00 (regularly $5.00).",
          perk: "Booster packs discounted to $4.00"
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

      const rawInv = Array.isArray(this.worldSave?.inventory)
        ? this.worldSave.inventory.filter(i => i && i.id !== 'map_base2v2' && i.type !== 'battle_map')
        : [];
      this.inventory = this.wrapReactiveArray(rawInv.map(i => this.wrapReactiveItem(i)), 'inventory');
      this.selectedInventoryItemId = null;

      // 9-Pocket Trading Card Binder
      const rawBinder = Array.isArray(this.worldSave?.binderSlots)
        ? [...this.worldSave.binderSlots]
        : Array(9).fill(null);
      while (rawBinder.length < 9) rawBinder.push(null);
      this.binderSlots = this.wrapReactiveArray(rawBinder.map(s => s ? this.wrapReactiveItem(s) : null), 'binder');
      this.consolidateBinderStacks();
      this.inspectingCard = null;
      this.inspectingSlotIndex = null;
      this.inspectingPose = 'idle';
      this.binderPickerTargetIndex = null;
      this.playingDeck = Array.isArray(this.worldSave?.playingDeck)
        ? [...this.worldSave.playingDeck]
        : [];

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
      this.lastParkTourneyCompletedDay = this.worldSave?.lastParkTourneyCompletedDay ?? 0;
      this.activeParkTourney = this.worldSave?.activeParkTourney
        ? JSON.parse(JSON.stringify(this.worldSave.activeParkTourney))
        : null;
      if (this.activeParkTourney && (!this.isMondayToday() || this.activeParkTourney.dayNumber !== (this.dayNumber || 1))) {
        this.activeParkTourney = null;
      }
      this.shopkeeperNpc = this.createShopkeeperNpc();
      this.plutoNpc = this.createPlutoNpc();
      this.novaNpc = this.createNovaNpc();
      this.silasNpc = this.createSilasNpc();
      this.mayaNpc = this.createMayaNpc();
      this.chloeNpc = this.createChloeNpc();
      this.rowanNpc = this.createRowanNpc();
      this.jasperNpc = this.createJasperNpc();
      this.syncParkNpcBubbles();
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
        targetY: null,
        path: null
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
        this.initPhoneSystem();
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
        y: 4.42,
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
        if (this.activeParkTourney && this.activeParkTourney.dayNumber !== this.dayNumber) {
          this.activeParkTourney = null;
        }
        this.syncParkNpcBubbles();
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
          const todayMeetups = (this.scheduledMeetups || []).filter(
            m => m.status === 'scheduled' && m.scheduledDay === this.dayNumber
          );
          const meetupNote = todayMeetups.length > 0
            ? ` | 🤝 Meetups Today (${todayMeetups.length}): ${todayMeetups.map(m => `${m.npcName} @ ${m.shortVenueLabel || m.venueLabel} (${m.cardName})`).join(', ')}`
            : '';
          const parkNote = this.isMondayToday()
            ? ` | 🏆 Oakhaven Central Park Monday Casual Round Robin is open! Talk to Chloe, Rowan, or Jasper (1st: $10.00, 2nd: $5.00).`
            : '';
          eventDesc.textContent = `${ev.desc} (${ev.highlight})${parkNote}${meetupNote}`;
        }
        this.updateMeetupBadgeCount?.();

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
    // Mythos Mobile Smartphone System (Apps: Contacts, Card Exchange, Shop Alerts, Tournaments)
    // -------------------------------------------------------------------------
    initPhoneSystem() {
      this.currentPhoneApp = 'home';
      this.activeChatContactId = null;
      this.marketTab = 'buy'; // 'buy' | 'sell' | 'meetups'
      this.activeNegotiation = null;
      this.phoneUnreadShop = this.worldSave?.phoneUnreadShop ?? true;
      this.phoneChatHistories = this.worldSave?.phoneChatHistories || {};
      this.phoneListingsBought = this.worldSave?.phoneListingsBought || [];
      this.phoneListingsSold = this.worldSave?.phoneListingsSold || [];
      this.scheduledMeetups = Array.isArray(this.worldSave?.scheduledMeetups)
        ? this.worldSave.scheduledMeetups.map(m => ({ ...m }))
        : [];
      this.registeredTournaments = this.worldSave?.registeredTournaments || [];
      this.updateMeetupBadgeCount();
    }

    /** Known Oakhaven landmarks selectable as card meetup locations. */
    getKnownMarketLandmarks() {
      return [
        {
          id: 'park_fountain',
          name: 'Central Park Fountain',
          shortName: 'Park Fountain',
          icon: '⛲',
          area: 'exterior',
          meetupPos: { x: 19.7, y: 9.0, dir: 'right' }
        },
        {
          id: 'crossroads_sign',
          name: 'Oakhaven Crossroads Sign',
          shortName: 'Crossroads Sign',
          icon: '🪧',
          area: 'exterior',
          meetupPos: { x: 8.4, y: 5.5, dir: 'down' }
        },
        {
          id: 'leo_shop',
          name: "Leo's Card Shop",
          shortName: "Leo's Shop",
          icon: '🏪',
          area: 'card_shop_interior',
          meetupPos: { x: 12.2, y: 8.4, dir: 'left' }
        }
      ];
    }

    /** Home area metadata for every Card Exchange NPC with an enterable cottage. */
    getNpcHomeMeetupInfo(npcId) {
      const friendName = this.friendName || 'Mike';
      const homes = {
        maya: {
          name: 'Maya',
          avatar: '🌿',
          houseLabel: "Maya's House (305 Cobblestone Way)",
          area: 'maya_interior'
        },
        silas: {
          name: 'Silas',
          avatar: '⚒️',
          houseLabel: "Silas's House (303 Cobblestone Way)",
          area: 'silas_interior'
        },
        pluto: {
          name: 'Pluto',
          avatar: '💻',
          houseLabel: "Pluto's House (201 South Connector Ave)",
          area: 'pluto_interior'
        },
        nova: {
          name: 'Nova',
          avatar: '✨',
          houseLabel: "Nova's House (301 Cobblestone Way)",
          area: 'nova_interior'
        },
        friend: {
          name: friendName,
          avatar: '🧢',
          houseLabel: `${friendName}'s House (101 Sunny Brook Ln)`,
          area: 'friend_interior'
        }
      };
      return homes[npcId] || homes.maya;
    }

    getNpcSpriteForMeetup(npcId) {
      if (npcId === 'pluto') {
        if (!this.plutoNpc) this.plutoNpc = this.createPlutoNpc();
        return this.plutoNpc.sprite;
      }
      if (npcId === 'nova') {
        if (!this.novaNpc) this.novaNpc = this.createNovaNpc();
        return this.novaNpc.sprite;
      }
      if (npcId === 'silas') {
        if (!this.silasNpc) this.silasNpc = this.createSilasNpc();
        return this.silasNpc.sprite;
      }
      if (npcId === 'maya') {
        if (!this.mayaNpc) this.mayaNpc = this.createMayaNpc();
        return this.mayaNpc.sprite;
      }
      const friend = this.getFriendNpc() || this.createFriendNpc(this.friendName);
      return friend?.sprite || this.playerSprite;
    }

    roundQuarterDollar(amount) {
      return Math.max(0.50, Math.round(Number(amount) * 4) / 4);
    }

    /**
     * Venue-adjusted card price: lower when meeting at NPC's house (0.80x),
     * baseline at a town landmark (1.00x), and higher when NPC travels to player's house (1.25x).
     */
    getVenueAdjustedPrice(basePrice, venueType) {
      const multipliers = {
        npc_house: 0.80,
        landmark: 1.00,
        player_house: 1.25
      };
      const mult = multipliers[venueType] ?? 1.00;
      return this.roundQuarterDollar(basePrice * mult);
    }

    getMeetupTargetDetails(npcId, venueType, landmarkId) {
      const home = this.getNpcHomeMeetupInfo(npcId);
      if (venueType === 'npc_house') {
        return {
          venueType: 'npc_house',
          landmarkId: null,
          area: home.area,
          venueLabel: `🏠 ${home.houseLabel}`,
          shortVenueLabel: `${home.name}'s House`,
          meetupPos: null,
          usesExistingNpc: true
        };
      }
      if (venueType === 'player_house') {
        return {
          venueType: 'player_house',
          landmarkId: null,
          area: 'interior',
          venueLabel: "🏡 Your House (Living Room)",
          shortVenueLabel: 'Your House',
          meetupPos: { x: 6.2, y: 7.6, dir: 'right' },
          usesExistingNpc: false
        };
      }
      const landmarks = this.getKnownMarketLandmarks();
      const landmark = landmarks.find(l => l.id === landmarkId) || landmarks[0];
      return {
        venueType: 'landmark',
        landmarkId: landmark.id,
        area: landmark.area,
        venueLabel: `${landmark.icon} ${landmark.name}`,
        shortVenueLabel: landmark.shortName,
        meetupPos: { ...landmark.meetupPos },
        usesExistingNpc: false
      };
    }

    getScheduledMeetupsForNpc(npcId, area, day = (this.dayNumber || 1)) {
      return (this.scheduledMeetups || []).filter(m =>
        m.status === 'scheduled' &&
        m.scheduledDay === day &&
        m.npcId === npcId &&
        m.area === area
      );
    }

    getActiveMeetupVisitorsForArea(area = this.currentArea) {
      if (this.storyState !== 'free_roam') return [];
      const day = this.dayNumber || 1;
      const matches = (this.scheduledMeetups || []).filter(m =>
        m.status === 'scheduled' &&
        m.scheduledDay === day &&
        m.area === area &&
        m.venueType !== 'npc_house'
      );
      return matches.map((m, idx) => {
        const target = this.getMeetupTargetDetails(m.npcId, m.venueType, m.landmarkId);
        const base = m.meetupPos || target.meetupPos || { x: 6.2, y: 7.6, dir: 'right' };
        let px = base.x;
        if (area === 'card_shop_interior') {
          px = Math.min(13.8, base.x + idx * 0.85);
        } else if (m.landmarkId === 'crossroads_sign') {
          px = base.x + idx * 0.9;
        } else {
          px = base.x - idx * 0.9;
        }
        return {
          id: `meetup_${m.id}`,
          meetupId: m.id,
          isMeetupVisitor: true,
          npcId: m.npcId,
          name: m.npcName,
          x: px,
          y: base.y,
          dir: base.dir || 'down',
          sprite: this.getNpcSpriteForMeetup(m.npcId),
          bubble: '🤝',
          meetup: m
        };
      });
    }

    updateMeetupBadgeCount() {
      const badge = document.getElementById('market-meetups-count');
      if (!badge) return;
      const active = (this.scheduledMeetups || []).filter(m => m.status === 'scheduled');
      badge.textContent = active.length > 0 ? `(${active.length})` : '';
    }

    getTownContactsList() {
      const fName = this.friendName || 'Mike';
      const pName = this.playerName;
      return [
        {
          id: 'friend',
          name: fName,
          title: 'Best Friend & Duelist',
          avatar: '👦',
          color: '#3b82f6',
          location: `${fName}'s Cottage (104 Oakhaven Lane)`,
          preview: this.hasOpenedStarterPack
            ? `Ready for our battle at my house whenever you are, ${pName}!`
            : `Let's get those packs at Leo's Card Shop!`,
          chat: [
            { sender: 'npc', text: `Yo ${pName}! Welcome to summer vacation!` },
            { sender: 'npc', text: this.hasOpenedStarterPack
                ? `I built my deck with Werewolf and Hydra. Come over to my house to battle!`
                : `Mom gave us money for booster packs at Leo's Card Shop! Text me when you're there!` }
          ],
          replies: [
            { text: `⚔️ "Are you ready to duel right now, ${fName}?"`, reply: `You know it! Head to my bedroom whenever you want to test out your cards!` },
            { text: `🃏 "What's the best beast card you pulled?"`, reply: `My Werewolf is insanely fast! But I hear there are foils like Dreadnaught and Pegasus floating around town!` },
            { text: `📅 "Let's enter the Friday Night Mythos League together!"`, reply: `Deal! Check the Tournaments app on your phone so we don't miss check-in!` }
          ]
        },
        {
          id: 'shopkeeper',
          name: 'Shopkeeper Leo',
          title: "Leo's Card Shop Owner",
          avatar: '🃏',
          color: '#f59e0b',
          location: "Leo's Card Shop (Far East Commercial Block)",
          preview: `Fresh 1st-Edition Booster Packs in stock!`,
          chat: [
            { sender: 'npc', text: `Hello ${pName}! Thanks for stopping by the shop.` },
            { sender: 'npc', text: `Check the Leo's Alerts app anytime to see when we restock or run pack sales!` }
          ],
          replies: [
            { text: `📦 "Do you have any foil packs left in stock?"`, reply: `Always! Base Set boosters are $5.00 each, and remember that Mondays have a +25% Foil Holo surge rate!` },
            { text: `💵 "Do you buy duplicate singles from players?"`, reply: `Yes! You can sell to me directly at my shop counter or post listings on the Card Exchange app to find town buyers!` }
          ]
        },
        {
          id: 'pluto',
          name: 'Pluto',
          title: 'Tech Prodigy & Collector',
          avatar: '💻',
          color: '#a855f7',
          location: "Pluto's Cottage (201 South Connector Ave)",
          preview: `Analyzing beast combat algorithms and high-stakes wagers.`,
          chat: [
            { sender: 'npc', text: `Greetings, ${pName}. My deck analytics are clocking peak efficiency.` }
          ],
          replies: [
            { text: `⚔️ "Want to test your deck in a wager duel?"`, reply: `I wager $1.00 on my battles! On Tuesdays, my wager doubles to $2.00. Drop by my house if you have the funds!` },
            { text: `💻 "Have you checked the Card Exchange app today?"`, reply: `Affirmative. I'm frequently looking to buy tech and combo cards to complete my algorithm testing.` }
          ]
        },
        {
          id: 'nova',
          name: 'Nova',
          title: 'Stargazer & Celestial Master',
          avatar: '✨',
          color: '#38bdf8',
          location: "Nova's Observatory (301 South Cobblestone Way)",
          preview: `The constellations align over Oakhaven tonight.`,
          chat: [
            { sender: 'npc', text: `Hello ${pName}! Have you gazed at the stars from the observatory yet?` }
          ],
          replies: [
            { text: `✨ "How do Celestial beasts fight?"`, reply: `Pegasus can soar across all ground hazards! On Sundays, all flying beasts gain +1 Move Range under the astral transit.` },
            { text: `🔭 "Are you competing in the town tournaments?"`, reply: `I am! Look for me in the Oakhaven Summer Open and Friday League.` }
          ]
        },
        {
          id: 'silas',
          name: 'Silas',
          title: 'Master Craftsman & Dwarf Warden',
          avatar: '⚒️',
          color: '#10b981',
          location: "Silas's Workshop (303 South Cobblestone Way)",
          preview: `Carving new tournament tables and sturdy shield tokens.`,
          chat: [
            { sender: 'npc', text: `Ho there, ${pName}! Hammer and woodcraft wait for no duelist.` }
          ],
          replies: [
            { text: `🛡️ "Tell me about Dwarf Warden's defense."`, reply: `Runic Shield Wall blocks incoming attacks from all sides! Solid heartwood strength, just like my furniture.` },
            { text: `🤝 "Any woodworking meetups planned?"`, reply: `Wednesdays at Leo's shop! Drop by or check my listings on Card Exchange.` }
          ]
        },
        {
          id: 'maya',
          name: 'Maya',
          title: 'Botanist & Nature Duelist',
          avatar: '🌿',
          color: '#22c55e',
          location: "Maya's Conservatory (305 South Cobblestone Way)",
          preview: `Tending to orchid blooms and sweet-pea vines.`,
          chat: [
            { sender: 'npc', text: `Hi ${pName}! The flowers in the conservatory are blooming beautifully today.` }
          ],
          replies: [
            { text: `🌿 "What happens during Botanical Bloom on Thursdays?"`, reply: `My rare orchid pollen gives all Earth and Nature beasts +15 bonus Max HP in duels! Earth Golem becomes an absolute titan!` },
            { text: `🌸 "Are you trading any floral beast cards?"`, reply: `Check the Card Exchange app! I occasionally trade Terra Mother and Verdant Guardian duplicates.` }
          ]
        },
        {
          id: 'chloe',
          name: 'Chloe',
          title: 'Central Park Courtyard Host',
          avatar: '🧺',
          color: '#f43f5e',
          location: 'Central Park Courtyard (Picnic Table 1)',
          preview: `Picnicking by the park fountain with berry iced tea!`,
          chat: [
            { sender: 'npc', text: `Hi ${pName}! Whenever you need a break from dueling, meet us at the picnic tables!` }
          ],
          replies: [
            { text: `🍋 "What's happening at the park today?"`, reply: `Rowan is trading cards at table two, and Jasper is drawing wildlife in his sketchbook. Drop by anytime!` }
          ]
        },
        {
          id: 'rowan',
          name: 'Rowan',
          title: 'Tactical Card Trader',
          avatar: '🃏',
          color: '#6366f1',
          location: 'Central Park Courtyard (Picnic Table 2)',
          preview: `Organizing binder spreads for the upcoming tournament.`,
          chat: [
            { sender: 'npc', text: `Hey ${pName}! I'm always looking to swap cards and arrange meetups.` }
          ],
          replies: [
            { text: `🤝 "Got any advice on trading cards in town?"`, reply: `Check the Card Exchange app on your phone right now! Maya, Silas, Pluto, Nova, and ${this.friendName || 'Mike'} all negotiate prices and arrange meetups across town.` }
          ]
        },
        {
          id: 'jasper',
          name: 'Jasper',
          title: 'Wildlife Artist & Naturalist',
          avatar: '🎨',
          color: '#eab308',
          location: 'Central Park Courtyard (Picnic Table 3)',
          preview: `Sketching songbirds in the park treetops.`,
          chat: [
            { sender: 'npc', text: `Hey ${pName}! Nature is filled with incredible beast ideas if you watch closely.` }
          ],
          replies: [
            { text: `🎨 "What are you working on next?"`, reply: `A field study of winged celestial beasts! Meet me at the park picnic tables if you want to see the sketchbook.` }
          ]
        }
      ];
    }

    getMarketplaceListings() {
      const friendName = this.friendName || 'Mike';
      const cards = window.MythosGwentCards?.CARDS || {};
      const formatCardMeta = (cardId, fallbackLabel) => {
        const c = cards[cardId];
        if (!c) return { cardName: fallbackLabel, element: '🃏 Mythos Card', img: 'Cards/Mythos_Card_Back.png' };
        const armorTxt = c.armor > 0 ? ` • 🛡️${c.armor}` : '';
        return {
          cardName: c.name,
          element: `${'★'.repeat(c.stars || 1)} ${c.role || 'Unit'} • ${c.basePower} PWR${armorTxt}`,
          img: c.cardImg
        };
      };

      const buySpecs = [
        {
          id: 'mkt_buy_1',
          npcId: 'maya',
          beastId: 'werewolf_pup',
          fallback: 'Werewolf Pup',
          price: 4.50,
          seller: 'Maya',
          avatar: '🌿',
          location: "Maya's House, Landmark, or Yours",
          note: 'Pulled a spare Werewolf Pup from a 5-card booster! Great for Wolf Pack decks.'
        },
        {
          id: 'mkt_buy_2',
          npcId: 'silas',
          beastId: 'scrap_heap',
          fallback: 'Scrap Heap',
          price: 6.50,
          seller: 'Silas',
          avatar: '⚒️',
          location: "Silas's House, Landmark, or Yours",
          note: 'Silver-border Machine with Shield & 2 Armor. Pick a day & venue and send an offer!'
        },
        {
          id: 'mkt_buy_3',
          npcId: 'pluto',
          beastId: 'orc_infantry',
          fallback: 'Orc Infantry',
          price: 6.00,
          seller: 'Pluto',
          avatar: '💻',
          location: "Pluto's House, Landmark, or Yours",
          note: 'Boosts all Melee Orc Army allies by +1 Power. Open to counter-offers!'
        },
        {
          id: 'mkt_buy_4',
          npcId: 'nova',
          beastId: 'minerva_wolf_mother',
          fallback: 'Minerva, Wolf Mother',
          price: 11.50,
          seller: 'Nova',
          avatar: '✨',
          location: "Nova's House, Landmark, or Yours",
          note: '3★ Gold Wolf Pack matriarch — grants +2 Armor to your pack on deploy!'
        },
        {
          id: 'mkt_buy_5',
          npcId: 'silas',
          beastId: 'rust_bucket',
          fallback: 'Rust Bucket',
          price: 4.00,
          seller: 'Silas',
          avatar: '⚒️',
          location: "Silas's House, Landmark, or Yours",
          note: 'Resilient Machine that stays on the board between rounds!'
        }
      ];

      const sellSpecs = [
        {
          id: 'mkt_sell_1',
          npcId: 'friend',
          beastId: 'manson_wolf_father',
          fallback: 'Manson, Wolf Father',
          payout: 14.00,
          buyer: friendName,
          avatar: '🧢',
          location: `${friendName}'s House, Landmark, or Yours`,
          note: 'Looking to buy 1x Manson, Wolf Father (4★ Decorative Gold) for my Wolf Pack deck!'
        },
        {
          id: 'mkt_sell_2',
          npcId: 'pluto',
          beastId: 'orc_slinger',
          fallback: 'Orc Slinger',
          payout: 5.50,
          buyer: 'Pluto',
          avatar: '💻',
          location: "Pluto's House, Landmark, or Yours",
          note: 'Need a Ranged Orc Army unit to pair with my Orc Infantry.'
        },
        {
          id: 'mkt_sell_3',
          npcId: 'maya',
          beastId: 'goblin_archer',
          fallback: 'Goblin Archer',
          payout: 3.50,
          buyer: 'Maya',
          avatar: '🌿',
          location: "Maya's House, Landmark, or Yours",
          note: 'Looking for an extra Goblin Archer for Ranged Goblin Army synergy!'
        },
        {
          id: 'mkt_sell_4',
          npcId: 'silas',
          beastId: 'goblin_soldier',
          fallback: 'Goblin Soldier',
          payout: 3.50,
          buyer: 'Silas',
          avatar: '⚒️',
          location: "Silas's House, Landmark, or Yours",
          note: 'Buying spare Goblin Soldiers for quick Melee swarm builds.'
        }
      ];

      return [
        ...buySpecs.map(s => {
          const meta = formatCardMeta(s.beastId, s.fallback);
          return {
            id: s.id,
            type: 'buy',
            npcId: s.npcId,
            beastId: s.beastId,
            cardName: meta.cardName,
            element: meta.element,
            basePrice: s.price,
            price: s.price,
            seller: s.seller,
            avatar: s.avatar,
            location: s.location,
            note: s.note,
            img: meta.img
          };
        }),
        ...sellSpecs.map(s => {
          const meta = formatCardMeta(s.beastId, s.fallback);
          return {
            id: s.id,
            type: 'sell',
            npcId: s.npcId,
            beastId: s.beastId,
            cardName: meta.cardName,
            element: meta.element,
            basePrice: s.payout,
            payout: s.payout,
            buyer: s.buyer,
            avatar: s.avatar,
            location: s.location,
            note: s.note,
            img: meta.img
          };
        })
      ];
    }

    getShopAlertsFeed() {
      const curDay = this.getCurrentDayName();
      const curEvent = this.getCurrentDayEvent();
      const alerts = [
        {
          id: 'feed_today',
          title: `TODAY: ${curEvent.title}`,
          tag: 'ACTIVE EVENT',
          time: 'Updated this morning',
          icon: curEvent.icon,
          highlight: true,
          text: `<b>${curEvent.desc}</b> Perk: <i>${curEvent.perk}</i>. Visit Leo's Card Shop or battle town duelists today to take advantage!`
        },
        {
          id: 'feed_1st_ed',
          title: '1st-Edition Mythos Boosters Restocked',
          tag: 'INVENTORY UPDATE',
          time: 'Official Store Bulletin',
          icon: '📦',
          highlight: false,
          text: 'Factory-sealed 1st-Edition foil booster packs ($5.00 each) are fully stocked on our showcase racks. Every pack guarantees 5 collectible Mythos cards with chances at rare foils!'
        },
        {
          id: 'feed_singles',
          title: 'Singles Buy-Back Counter Open',
          tag: 'TRADE DESK',
          time: 'Standing Service',
          icon: '💵',
          highlight: false,
          text: 'Got duplicates from opening booster packs? Leo buys back singles for cash instantly at the counter, or trade directly with friends via your phone Card Exchange!'
        }
      ];
      return alerts;
    }

    getTournamentSchedule() {
      return [
        {
          id: 'tourney_fri',
          name: 'Friday Night Mythos League',
          badge: 'WEEKLY LEAGUE',
          badgeClass: 'purple',
          dayText: 'Every Friday • 6:00 PM',
          fee: 'Free Entry',
          prize: '+$1.50 Gold Bounty per win + League Trophy',
          format: '1v1 Tabletop Duels',
          location: "Leo's Card Shop — Duel Tables",
          desc: 'The official community dueling league! Bring your best beasts to Leo\'s Card Shop. Every victory earns bonus prize purse cash and league points.'
        },
        {
          id: 'tourney_weekend',
          name: 'Oakhaven Summer Grand Prix',
          badge: 'CHAMPIONSHIP',
          badgeClass: 'gold',
          dayText: 'Saturday & Sunday • All Day',
          fee: '$2.00 Buy-in',
          prize: '$10.00 Grand Purse + Ultra Rare Holo',
          format: 'Best-of-3 Elimination',
          location: 'Central Park Courtyard & Promenade',
          desc: 'The premier summer tournament attracting all master duelists across Oakhaven. Silas, Nova, Pluto, and Maya compete for the championship banner!'
        },
        {
          id: 'tourney_park',
          name: 'Oakhaven Central Park Monday Casual',
          badge: 'EVERY MONDAY',
          badgeClass: 'gold',
          dayText: 'Every Monday • 4-Player Round Robin',
          fee: 'Free Entry',
          prize: '1st: $10.00 • 2nd: $5.00',
          format: '3-Round Round Robin (You, Rowan, Chloe & Jasper)',
          location: 'Oakhaven Central Park (Talk to Chloe, Rowan, or Jasper)',
          desc: 'Weekly Monday casual Round Robin at Oakhaven Central Park! Play all 3 rounds against Chloe, Rowan, and Jasper. Winner earns $10.00 and 2nd place earns $5.00 — redoable once every Monday.'
        }
      ];
    }

    togglePhoneModal(force) {
      const modal = document.getElementById('phone-modal');
      if (!modal) return;
      const shouldOpen = force !== undefined ? !!force : modal.classList.contains('hidden');
      if (shouldOpen) {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('home');
        modal.classList.remove('hidden');
      } else {
        if (window.sounds?.playClick) window.sounds.playClick();
        modal.classList.add('hidden');
      }
    }

    openPhoneApp(appName) {
      this.currentPhoneApp = appName;
      const views = ['home', 'contacts', 'market', 'shopfeed', 'tournaments'];
      views.forEach(v => {
        const el = document.getElementById(`phone-view-${v}`);
        if (el) {
          if (v === appName) {
            el.classList.remove('hidden');
            el.classList.add('active');
          } else {
            el.classList.add('hidden');
            el.classList.remove('active');
          }
        }
      });

      // Update Phone Status Bar
      const timeEl = document.getElementById('phone-status-time');
      const locEl = document.getElementById('phone-status-loc');
      const dayLabel = document.getElementById('phone-home-day-label');
      const walletVal = document.getElementById('phone-wallet-val');
      const widgetTitle = document.getElementById('phone-widget-title');
      const widgetDesc = document.getElementById('phone-widget-desc');

      if (timeEl) timeEl.textContent = '2:30 PM';
      if (locEl) locEl.textContent = this.draftAppearance?.worldName || 'Oakhaven';
      if (dayLabel) dayLabel.textContent = `${this.getCurrentDayName()}, Day ${this.dayNumber || 1}`;
      if (walletVal) walletVal.textContent = this.formatMoney(this.gold || 0);

      const curEv = this.getCurrentDayEvent();
      if (widgetTitle) widgetTitle.textContent = `${curEv.icon} ${curEv.title}`;
      if (widgetDesc) widgetDesc.textContent = curEv.highlight;

      // Clear alert dots if visiting that app
      if (appName === 'shopfeed') {
        this.phoneUnreadShop = false;
        const dot = document.getElementById('dot-shopfeed');
        if (dot) dot.classList.add('hidden');
        const badge = document.getElementById('phone-alert-badge');
        if (badge) badge.classList.add('hidden');
        const mobBadge = document.getElementById('mob-phone-badge');
        if (mobBadge) mobBadge.classList.add('hidden');
      }

      // Render corresponding app view
      if (appName !== 'market') {
        this.activeNegotiation = null;
      }
      if (appName === 'contacts') {
        this.renderContactsApp();
      } else if (appName === 'market') {
        this.renderMarketApp();
      } else if (appName === 'shopfeed') {
        this.renderShopFeedApp();
      } else if (appName === 'tournaments') {
        this.renderTournamentsApp();
      }
    }

    renderContactsApp() {
      const listEl = document.getElementById('phone-contacts-list');
      const chatPane = document.getElementById('phone-chat-pane');
      if (!listEl || !chatPane) return;

      if (!this.activeChatContactId) {
        listEl.classList.remove('hidden');
        chatPane.classList.add('hidden');
      } else {
        listEl.classList.add('hidden');
        chatPane.classList.remove('hidden');
        this.renderChatPane(this.activeChatContactId);
        return;
      }

      const contacts = this.getTownContactsList();
      listEl.innerHTML = '';

      contacts.forEach(c => {
        const row = document.createElement('div');
        row.className = 'phone-contact-row';
        row.innerHTML = `
          <div class="phone-contact-avatar" style="border-color: ${c.color};">${c.avatar}</div>
          <div class="phone-contact-meta">
            <div class="phone-contact-name-row">
              <span class="phone-contact-name">${c.name}</span>
              <span class="phone-contact-loc">${c.title}</span>
            </div>
            <div class="phone-contact-preview">${c.preview}</div>
          </div>
        `;
        row.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.activeChatContactId = c.id;
          this.renderContactsApp();
        });
        listEl.appendChild(row);
      });
    }

    renderChatPane(contactId) {
      const contacts = this.getTownContactsList();
      const contact = contacts.find(c => c.id === contactId) || contacts[0];
      const chatPane = document.getElementById('phone-chat-pane');
      const listEl = document.getElementById('phone-contacts-list');
      const avatarEl = document.getElementById('phone-chat-avatar');
      const nameEl = document.getElementById('phone-chat-name');
      const statusEl = document.getElementById('phone-chat-status');
      const msgsEl = document.getElementById('phone-chat-messages');
      const repliesEl = document.getElementById('phone-chat-replies');

      if (avatarEl) avatarEl.textContent = contact.avatar;
      if (nameEl) nameEl.textContent = contact.name;
      if (statusEl) statusEl.textContent = `● Active in ${contact.location}`;

      // Initialize saved history for contact if none exists
      if (!this.phoneChatHistories[contact.id]) {
        this.phoneChatHistories[contact.id] = [...contact.chat];
      }

      if (msgsEl) {
        msgsEl.innerHTML = '';
        this.phoneChatHistories[contact.id].forEach(m => {
          const bubble = document.createElement('div');
          bubble.className = `phone-chat-bubble ${m.sender}`;
          bubble.innerHTML = m.text;
          msgsEl.appendChild(bubble);
        });
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }

      if (repliesEl) {
        repliesEl.innerHTML = '';
        contact.replies.forEach(r => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'phone-reply-btn';
          btn.textContent = r.text;
          btn.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            // Append player message
            this.phoneChatHistories[contact.id].push({ sender: 'player', text: r.text });
            this.renderChatPane(contact.id);

            // NPC replies after brief realistic texting delay
            setTimeout(() => {
              if (window.sounds?.playNotification) window.sounds.playNotification();
              this.phoneChatHistories[contact.id].push({ sender: 'npc', text: r.reply });
              this.saveWorldData(this.draftAppearance);
              this.renderChatPane(contact.id);
            }, 600);
          });
          repliesEl.appendChild(btn);
        });
      }
    }

    getScheduledMeetupForListing(listingId) {
      return (this.scheduledMeetups || []).find(m => m.listingId === listingId && m.status === 'scheduled') || null;
    }

    getDayMetadataForNumber(dayNum) {
      const days = this.DAYS_OF_WEEK || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const cal = this.WEEKLY_CALENDAR || [{ icon: '✨' }];
      const idx = ((dayNum - 1) % days.length + days.length) % days.length;
      const dayName = days[idx];
      const ev = cal[idx] || cal[0];
      const curDay = this.dayNumber || 1;
      const diff = dayNum - curDay;
      const relLabel = diff === 0 ? 'Today' : (diff === 1 ? 'Tomorrow' : `In ${diff}d`);
      return { dayNum, dayName, shortDay: dayName.slice(0, 3), icon: ev.icon, relLabel };
    }

    computeNegotiationBounds(type, venuePrice) {
      if (type === 'buy') {
        const openOffer = this.roundQuarterDollar(venuePrice * 1.10);
        return {
          venuePrice,
          openOffer,
          fairTarget: this.roundQuarterDollar(venuePrice * 0.92),
          walkLimit: this.roundQuarterDollar(venuePrice * 0.80),
          draftOffer: Math.max(0.50, this.roundQuarterDollar(openOffer - 0.50))
        };
      }
      const openOffer = this.roundQuarterDollar(venuePrice * 0.90);
      return {
        venuePrice,
        openOffer,
        fairTarget: this.roundQuarterDollar(venuePrice * 1.08),
        walkLimit: this.roundQuarterDollar(venuePrice * 1.20),
        draftOffer: this.roundQuarterDollar(openOffer + 0.50)
      };
    }

    renderMarketApp() {
      const browseEl = document.getElementById('phone-market-browse');
      const negEl = document.getElementById('phone-negotiate-pane');
      const container = document.getElementById('phone-listings-container');
      const noticeEl = document.getElementById('phone-market-notice');
      const tabBuy = document.getElementById('tab-market-buy');
      const tabSell = document.getElementById('tab-market-sell');
      const tabMeetups = document.getElementById('tab-market-meetups');
      if (!container) return;

      this.updateMeetupBadgeCount();

      if (this.activeNegotiation && browseEl && negEl) {
        browseEl.classList.add('hidden');
        negEl.classList.remove('hidden');
        this.renderNegotiationPane();
        return;
      }

      if (browseEl && negEl) {
        browseEl.classList.remove('hidden');
        negEl.classList.add('hidden');
      }

      const tabMap = { buy: tabBuy, sell: tabSell, meetups: tabMeetups };
      Object.entries(tabMap).forEach(([key, el]) => {
        if (el) el.classList.toggle('active', this.marketTab === key);
      });

      if (noticeEl) {
        noticeEl.textContent = this.marketTab === 'meetups'
          ? 'Visit your scheduled spot on the agreed day and talk to the NPC (🤝) to exchange cards & cash!'
          : 'Pick a Day & Meetup Place and negotiate the price! Lower at NPC\'s house (-20%), baseline at a landmark, higher at your house (+25%).';
      }

      container.innerHTML = '';

      if (this.marketTab === 'meetups') {
        this.renderMeetupsTab(container);
        return;
      }

      const currentListings = this.getMarketplaceListings().filter(l => l.type === this.marketTab);
      currentListings.forEach(item => {
        container.appendChild(this.buildMarketplaceListingCard(item));
      });
    }

    buildMarketplaceListingCard(item) {
      const isBuy = item.type === 'buy';
      const personName = isBuy ? item.seller : item.buyer;
      const doneList = isBuy ? this.phoneListingsBought : this.phoneListingsSold;
      const isDone = doneList.includes(item.id);
      const scheduled = this.getScheduledMeetupForListing(item.id);
      const hasCard = isBuy || (this.inventory || []).some(i => i.beastId === item.beastId && (i.qty || 1) > 0);
      const npcPrice = this.getVenueAdjustedPrice(item.basePrice, 'npc_house');
      const landmarkPrice = this.getVenueAdjustedPrice(item.basePrice, 'landmark');
      const homePrice = this.getVenueAdjustedPrice(item.basePrice, 'player_house');

      const cardEl = document.createElement('div');
      cardEl.className = 'phone-listing-card';

      let btnLabel = isBuy
        ? `💬 Negotiate & Arrange (${this.formatMoney(landmarkPrice)})`
        : `💬 Negotiate Sale (+${this.formatMoney(landmarkPrice)})`;
      let btnStyle = isBuy
        ? ''
        : 'style="background: linear-gradient(135deg, #059669, #10b981); border-color: #34d399;"';
      let disabledAttr = '';

      if (isDone) {
        btnLabel = isBuy ? '✅ Purchased & Collected' : '✅ Fulfilled & Paid';
        btnStyle = 'style="background: #334155; border-color: #475569; cursor: default;"';
        disabledAttr = 'disabled';
      } else if (scheduled) {
        btnLabel = `📅 Scheduled Day ${scheduled.scheduledDay} (${this.formatMoney(scheduled.agreedPrice)})`;
        btnStyle = 'style="background: linear-gradient(135deg, #4f46e5, #6366f1); border-color: #818cf8;"';
      } else if (!hasCard) {
        btnLabel = '❌ Card Not in Backpack';
        btnStyle = 'style="background: #334155; border-color: #475569; cursor: default;"';
        disabledAttr = 'disabled';
      }

      cardEl.innerHTML = `
        <div class="phone-listing-top">
          <div>
            <span class="phone-listing-card-title">${item.cardName}</span>
            <div style="font-size: 10px; color: #94a3b8;">${isBuy ? item.element : `Wanted by ${personName}`}</div>
          </div>
          <span class="phone-listing-price">${isBuy ? '' : '+'}${this.formatMoney(landmarkPrice)}</span>
        </div>
        <div class="phone-listing-seller">
          ${item.avatar} ${isBuy ? 'Seller' : 'Buyer'}: <strong>${personName}</strong>
        </div>
        <div class="phone-listing-meetup">
          📍 Rates: <b>🏠 ${this.formatMoney(npcPrice)}</b> • ⛲ ${this.formatMoney(landmarkPrice)} • 🏡 <b>${this.formatMoney(homePrice)}</b>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; font-style: italic;">"${item.note}"</div>
        <button class="phone-listing-btn" id="btn-market-${item.id}" ${disabledAttr} ${btnStyle}>
          ${btnLabel}
        </button>
      `;

      const actionBtn = cardEl.querySelector(`#btn-market-${item.id}`);
      if (actionBtn && !disabledAttr) {
        actionBtn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          if (scheduled) {
            this.marketTab = 'meetups';
            this.renderMarketApp();
          } else {
            this.startListingNegotiation(item);
          }
        });
      }
      return cardEl;
    }

    renderMeetupsTab(container) {
      const curDay = this.dayNumber || 1;
      const activeMeetups = (this.scheduledMeetups || [])
        .filter(m => m.status === 'scheduled')
        .sort((a, b) => {
          const rank = d => (d === curDay ? 0 : d > curDay ? 1 : 2);
          const ra = rank(a.scheduledDay);
          const rb = rank(b.scheduledDay);
          return ra !== rb ? ra - rb : a.scheduledDay - b.scheduledDay;
        });

      if (activeMeetups.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'phone-listing-card';
        empty.innerHTML = `
          <div class="phone-listing-card-title">No Card Meetups Scheduled</div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">
            Pick any listing in <b>Buy</b> or <b>Sell</b> to negotiate a price and schedule a meetup day &amp; location!
          </div>
        `;
        container.appendChild(empty);
        return;
      }

      activeMeetups.forEach(m => {
        const dayMeta = this.getDayMetadataForNumber(m.scheduledDay);
        const isToday = m.scheduledDay === curDay;
        const isMissed = m.scheduledDay < curDay;
        const statusCls = isToday ? 'today' : (isMissed ? 'missed' : 'upcoming');
        const statusText = isToday
          ? `🤝 TODAY (Day ${m.scheduledDay})`
          : (isMissed ? `⚠️ MISSED (Day ${m.scheduledDay})` : `📆 Day ${m.scheduledDay} • ${dayMeta.shortDay}`);
        const isBuy = m.type === 'buy';

        const cardEl = document.createElement('div');
        cardEl.className = 'phone-listing-card';
        cardEl.innerHTML = `
          <div class="phone-listing-top">
            <div>
              <span class="phone-listing-card-title">${isBuy ? '🛒 Buy' : '💰 Sell'} ${m.cardName}</span>
              <div style="font-size: 10px; color: #cbd5e1;">with ${m.npcAvatar || '🤝'} <b>${m.npcName}</b></div>
            </div>
            <span class="phone-meetup-status-pill ${statusCls}">${statusText}</span>
          </div>
          <div class="phone-listing-meetup">
            📍 Location: <b>${m.venueLabel}</b><br/>
            💵 Agreed Price: <b style="color:#4ade80;">${isBuy ? '' : '+'}${this.formatMoney(m.agreedPrice)}</b>
          </div>
          <div class="phone-neg-actions-row">
            <button class="phone-neg-btn-send" data-action="reschedule">📅 Reschedule</button>
            <button class="phone-neg-btn-cancel" data-action="cancel">✖ Cancel</button>
          </div>
        `;

        cardEl.querySelector('[data-action="reschedule"]')?.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const listing = this.getMarketplaceListings().find(l => l.id === m.listingId) || {
            id: m.listingId,
            type: m.type,
            npcId: m.npcId,
            beastId: m.beastId,
            cardName: m.cardName,
            element: '',
            basePrice: m.basePrice || m.agreedPrice,
            seller: m.npcName,
            buyer: m.npcName,
            avatar: m.npcAvatar || '🤝'
          };
          this.startListingNegotiation(listing, m);
        });

        cardEl.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.cancelScheduledMeetup(m.id);
        });

        container.appendChild(cardEl);
      });
    }

    startListingNegotiation(item, existingMeetup = null) {
      const isBuy = item.type === 'buy';
      const npcId = item.npcId || 'maya';
      const home = this.getNpcHomeMeetupInfo(npcId);
      const npcName = (isBuy ? item.seller : item.buyer) || home.name;
      const basePrice = item.basePrice || (isBuy ? item.price : item.payout) || 5.0;
      const venueType = existingMeetup?.venueType || 'landmark';
      const landmarkId = existingMeetup?.landmarkId || 'park_fountain';
      const curDay = this.dayNumber || 1;
      const scheduledDay = existingMeetup
        ? Math.max(curDay, existingMeetup.scheduledDay || curDay)
        : curDay;

      const venuePrice = this.getVenueAdjustedPrice(basePrice, venueType);
      const bounds = this.computeNegotiationBounds(item.type, venuePrice);
      const target = this.getMeetupTargetDetails(npcId, venueType, landmarkId);

      const openingMsg = existingMeetup
        ? `Rescheduling ${item.cardName} (${this.formatMoney(existingMeetup.agreedPrice)})! Pick a new day or switch places for an updated quote.`
        : (isBuy
            ? `Hey! My ${item.cardName} runs cheaper at my house (-20%), fair at landmarks, or +25% if I come to yours. Right now at ${target.shortVenueLabel} I'm asking ${this.formatMoney(bounds.openOffer)} — what's your offer?`
            : `I'd love your ${item.cardName}! Coming to your house pays +25% extra convenience bonus, or less at my house (-20%). Starting at ${this.formatMoney(bounds.openOffer)} for ${target.shortVenueLabel} — counter me!`);

      this.activeNegotiation = {
        listingId: item.id,
        type: item.type,
        beastId: item.beastId,
        cardName: item.cardName,
        element: item.element || '',
        npcId,
        npcName,
        npcAvatar: item.avatar || home.avatar,
        basePrice,
        venueType,
        landmarkId,
        scheduledDay,
        venuePrice: bounds.venuePrice,
        npcCurrentOffer: bounds.openOffer,
        npcFairTarget: bounds.fairTarget,
        npcWalkAwayLimit: bounds.walkLimit,
        playerDraftOffer: bounds.draftOffer,
        patience: 3,
        maxPatience: 3,
        status: existingMeetup ? 'agreed' : 'negotiating',
        agreedPrice: existingMeetup ? existingMeetup.agreedPrice : null,
        editingMeetupId: existingMeetup?.id || null,
        messages: [{ sender: 'npc', text: openingMsg }]
      };
      this.renderMarketApp();
    }

    recalculateNegotiationForVenue(neg) {
      const venuePrice = this.getVenueAdjustedPrice(neg.basePrice, neg.venueType);
      const bounds = this.computeNegotiationBounds(neg.type, venuePrice);
      const target = this.getMeetupTargetDetails(neg.npcId, neg.venueType, neg.landmarkId);

      neg.venuePrice = bounds.venuePrice;
      neg.npcCurrentOffer = bounds.openOffer;
      neg.npcFairTarget = bounds.fairTarget;
      neg.npcWalkAwayLimit = bounds.walkLimit;
      neg.playerDraftOffer = bounds.draftOffer;
      neg.patience = neg.maxPatience;
      neg.status = 'negotiating';
      neg.agreedPrice = null;

      const reason = neg.venueType === 'player_house'
        ? (neg.type === 'buy' ? 'Travel to your house adds +25%' : 'Delivery bonus to your house adds +25%')
        : (neg.venueType === 'npc_house'
            ? 'Meeting at my house cuts the rate by -20%'
            : `Meeting at ${target.shortVenueLabel} keeps the standard landmark price`);
      neg.messages.push({
        sender: 'npc',
        text: `${reason}! Updated opening offer for ${target.shortVenueLabel}: ${this.formatMoney(neg.npcCurrentOffer)}.`
      });
    }

    renderNegotiationPane() {
      const pane = document.getElementById('phone-negotiate-pane');
      const neg = this.activeNegotiation;
      if (!pane || !neg) return;

      const curDay = this.dayNumber || 1;
      const isBuy = neg.type === 'buy';
      const npcPrice = this.getVenueAdjustedPrice(neg.basePrice, 'npc_house');
      const landmarkPrice = this.getVenueAdjustedPrice(neg.basePrice, 'landmark');
      const homePrice = this.getVenueAdjustedPrice(neg.basePrice, 'player_house');
      const target = this.getMeetupTargetDetails(neg.npcId, neg.venueType, neg.landmarkId);
      const dayMeta = this.getDayMetadataForNumber(neg.scheduledDay);

      const dayButtonsHtml = [0, 1, 2, 3].map(offset => {
        const d = this.getDayMetadataForNumber(curDay + offset);
        const active = neg.scheduledDay === d.dayNum ? 'active' : '';
        return `
          <button class="phone-neg-pill ${active}" data-day="${d.dayNum}">
            <span>${d.icon} ${d.relLabel}</span>
            <small>Day ${d.dayNum} (${d.shortDay})</small>
          </button>
        `;
      }).join('');

      const landmarksHtml = neg.venueType === 'landmark'
        ? `<div class="phone-neg-grid-3">${this.getKnownMarketLandmarks().map(lm => `
            <button class="phone-neg-pill ${neg.landmarkId === lm.id ? 'active' : ''}" data-landmark="${lm.id}">
              <span>${lm.icon} ${lm.shortName}</span>
            </button>
          `).join('')}</div>`
        : '';

      const statusHeaderText = neg.status === 'agreed'
        ? `🤝 Agreed: ${this.formatMoney(neg.agreedPrice)}`
        : (neg.status === 'walked'
            ? '💔 Walked Away'
            : `Patience ${'❤️'.repeat(neg.patience)}${'🖤'.repeat(Math.max(0, neg.maxPatience - neg.patience))}`);

      const chatHtml = neg.messages.map(msg =>
        `<div class="phone-neg-bubble ${msg.sender}">${msg.text}</div>`
      ).join('');

      let controlsHtml = '';
      if (neg.status === 'negotiating') {
        const lowFundsNote = isBuy && (this.gold || 0) < neg.npcCurrentOffer
          ? `<div style="font-size:10px; color:#fbbf24;">Note: Wallet is ${this.formatMoney(this.gold || 0)} — you can schedule ahead and earn cash before meetup day!</div>`
          : '';
        controlsHtml = `
          ${lowFundsNote}
          <div class="phone-neg-offer-row">
            <button class="phone-neg-step-btn" data-step="-0.50">-$0.50</button>
            <button class="phone-neg-step-btn" data-step="-0.25">-$0.25</button>
            <input type="number" step="0.25" min="0.50" id="market-counter-input" class="phone-neg-input" value="${Number(neg.playerDraftOffer).toFixed(2)}" />
            <button class="phone-neg-step-btn" data-step="0.25">+$0.25</button>
            <button class="phone-neg-step-btn" data-step="0.50">+$0.50</button>
          </div>
          <div class="phone-neg-actions-row">
            <button class="phone-neg-btn-send" id="btn-neg-send">💬 Counter Offer</button>
            <button class="phone-neg-btn-accept" id="btn-neg-accept">🤝 Accept ${this.formatMoney(neg.npcCurrentOffer)}</button>
          </div>
        `;
      } else if (neg.status === 'agreed') {
        controlsHtml = `
          <div style="font-size:11px; color:#86efac; background:rgba(16,185,129,0.12); border:1px solid rgba(52,211,153,0.4); border-radius:8px; padding:6px 8px;">
            ✅ Deal Agreed at <b>${this.formatMoney(neg.agreedPrice)}</b> for <b>${dayMeta.relLabel} (Day ${dayMeta.dayNum})</b> @ <b>${target.shortVenueLabel}</b>!
          </div>
          <div class="phone-neg-actions-row">
            <button class="phone-neg-btn-accept" id="btn-neg-confirm">📅 Confirm &amp; Schedule Meetup</button>
            <button class="phone-neg-btn-cancel" id="btn-neg-reopen">💬 Re-negotiate</button>
          </div>
        `;
      } else {
        controlsHtml = `
          <div style="font-size:10.5px; color:#fca5a5;">${neg.npcName} paused talks. Switch meeting place or reopen negotiation!</div>
          <div class="phone-neg-actions-row">
            <button class="phone-neg-btn-send" id="btn-neg-reopen">🔄 Re-open Negotiation</button>
          </div>
        `;
      }

      pane.innerHTML = `
        <div class="phone-neg-section">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <button class="phone-neg-step-btn" id="btn-neg-back">‹ Listings</button>
            <div style="text-align:right;">
              <div style="font-size:12px; font-weight:800; color:#f8fafc;">${isBuy ? '🛒 Buy' : '💰 Sell'} ${neg.cardName}</div>
              <div style="font-size:10px; color:#94a3b8;">${neg.npcAvatar} with ${neg.npcName} • Base ${this.formatMoney(neg.basePrice)}</div>
            </div>
          </div>
        </div>

        <div class="phone-neg-section">
          <div class="phone-neg-label"><span>1. Choose Meetup Day</span><span>Day ${neg.scheduledDay} (${dayMeta.shortDay})</span></div>
          <div class="phone-neg-grid-4">${dayButtonsHtml}</div>
        </div>

        <div class="phone-neg-section">
          <div class="phone-neg-label"><span>2. Choose Meetup Place</span><span>${this.formatMoney(neg.venuePrice)} base</span></div>
          <div class="phone-neg-grid-3">
            <button class="phone-neg-pill ${neg.venueType === 'npc_house' ? 'active' : ''}" data-venue="npc_house">
              <span>🏠 NPC's House</span>
              <small class="cheaper">${this.formatMoney(npcPrice)} (Less)</small>
            </button>
            <button class="phone-neg-pill ${neg.venueType === 'landmark' ? 'active' : ''}" data-venue="landmark">
              <span>⛲ Landmark</span>
              <small>${this.formatMoney(landmarkPrice)} (Base)</small>
            </button>
            <button class="phone-neg-pill ${neg.venueType === 'player_house' ? 'active' : ''}" data-venue="player_house">
              <span>🏡 Your House</span>
              <small class="pricier">${this.formatMoney(homePrice)} (More)</small>
            </button>
          </div>
          ${landmarksHtml}
        </div>

        <div class="phone-neg-section">
          <div class="phone-neg-label">
            <span>3. Price Negotiation</span>
            <span>${statusHeaderText}</span>
          </div>
          <div class="phone-neg-chat" id="phone-neg-chat-log">${chatHtml}</div>
          ${controlsHtml}
        </div>
      `;

      const chatLog = pane.querySelector('#phone-neg-chat-log');
      if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;

      pane.querySelector('#btn-neg-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeNegotiation = null;
        this.renderMarketApp();
      });

      pane.querySelectorAll('[data-day]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          neg.scheduledDay = Number(btn.getAttribute('data-day'));
          this.renderNegotiationPane();
        });
      });

      pane.querySelectorAll('[data-venue]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const newVenue = btn.getAttribute('data-venue');
          if (newVenue !== neg.venueType) {
            neg.venueType = newVenue;
            this.recalculateNegotiationForVenue(neg);
            this.renderNegotiationPane();
          }
        });
      });

      pane.querySelectorAll('[data-landmark]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const newLm = btn.getAttribute('data-landmark');
          if (newLm !== neg.landmarkId) {
            neg.landmarkId = newLm;
            this.recalculateNegotiationForVenue(neg);
            this.renderNegotiationPane();
          }
        });
      });

      const counterInput = pane.querySelector('#market-counter-input');
      if (counterInput) {
        counterInput.addEventListener('input', () => {
          const val = parseFloat(counterInput.value);
          if (!Number.isNaN(val)) neg.playerDraftOffer = val;
        });
        counterInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.submitNegotiationOffer(counterInput.value);
          } else if (e.key === 'Escape') {
            counterInput.blur();
          }
        });
      }

      pane.querySelectorAll('[data-step]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          const delta = parseFloat(btn.getAttribute('data-step')) || 0;
          const curVal = counterInput ? parseFloat(counterInput.value) : neg.playerDraftOffer;
          const next = Math.max(0.50, Math.round(((Number.isNaN(curVal) ? neg.playerDraftOffer : curVal) + delta) * 100) / 100);
          neg.playerDraftOffer = next;
          if (counterInput) counterInput.value = next.toFixed(2);
        });
      });

      pane.querySelector('#btn-neg-send')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        const raw = counterInput ? counterInput.value : neg.playerDraftOffer;
        this.submitNegotiationOffer(raw);
      });

      pane.querySelector('#btn-neg-accept')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.acceptCurrentNegotiationPrice();
      });

      pane.querySelector('#btn-neg-confirm')?.addEventListener('click', () => {
        if (window.sounds?.playCollect) window.sounds.playCollect();
        this.confirmAgreedMeetup();
      });

      pane.querySelector('#btn-neg-reopen')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.recalculateNegotiationForVenue(neg);
        this.renderNegotiationPane();
      });
    }

    submitNegotiationOffer(rawOffer) {
      const neg = this.activeNegotiation;
      if (!neg || neg.status !== 'negotiating') return;

      const parsed = parseFloat(rawOffer);
      if (Number.isNaN(parsed) || parsed <= 0) {
        if (window.sounds?.playError) window.sounds.playError();
        return;
      }

      const offer = this.roundQuarterDollar(parsed);
      neg.playerDraftOffer = offer;
      const target = this.getMeetupTargetDetails(neg.npcId, neg.venueType, neg.landmarkId);
      neg.messages.push({ sender: 'player', text: `How about ${this.formatMoney(offer)}?` });

      const isBuy = neg.type === 'buy';
      const immediateOk = isBuy ? (offer >= neg.npcCurrentOffer) : (offer <= neg.npcCurrentOffer);
      const fairOk = isBuy ? (offer >= neg.npcFairTarget) : (offer <= neg.npcFairTarget);
      const withinWalkLimit = isBuy ? (offer >= neg.npcWalkAwayLimit) : (offer <= neg.npcWalkAwayLimit);

      if (immediateOk || fairOk) {
        neg.agreedPrice = offer;
        neg.status = 'agreed';
        neg.messages.push({
          sender: 'npc',
          text: `Deal! ${this.formatMoney(offer)} sounds great for ${target.shortVenueLabel}. Confirm the meetup when ready!`
        });
        if (window.sounds?.playCollect) window.sounds.playCollect();
      } else if (withinWalkLimit) {
        let counter;
        if (isBuy) {
          counter = Math.min(this.roundQuarterDollar((neg.npcCurrentOffer + offer) / 2), neg.npcCurrentOffer - 0.25);
          counter = Math.max(offer, neg.npcWalkAwayLimit, counter);
        } else {
          counter = Math.max(this.roundQuarterDollar((neg.npcCurrentOffer + offer) / 2), neg.npcCurrentOffer + 0.25);
          counter = Math.min(offer, neg.npcWalkAwayLimit, counter);
        }
        if (counter === offer) {
          neg.agreedPrice = offer;
          neg.status = 'agreed';
          neg.messages.push({
            sender: 'npc',
            text: `You drive a smart bargain — let's lock in ${this.formatMoney(offer)} at ${target.shortVenueLabel}!`
          });
          if (window.sounds?.playCollect) window.sounds.playCollect();
        } else {
          neg.npcCurrentOffer = counter;
          neg.playerDraftOffer = counter;
          neg.messages.push({
            sender: 'npc',
            text: `${this.formatMoney(offer)} is a bit tight — can you meet me at ${this.formatMoney(counter)}?`
          });
        }
      } else {
        neg.patience = Math.max(0, neg.patience - 1);
        if (window.sounds?.playError) window.sounds.playError();
        if (neg.patience <= 0) {
          neg.status = 'walked';
          neg.messages.push({
            sender: 'npc',
            text: `No can do — ${this.formatMoney(offer)} is too far from my ${this.formatMoney(neg.npcWalkAwayLimit)} limit. Try switching places or reopen talks!`
          });
        } else {
          const nudge = isBuy
            ? Math.max(neg.npcWalkAwayLimit, this.roundQuarterDollar(neg.npcCurrentOffer - 0.25))
            : Math.min(neg.npcWalkAwayLimit, this.roundQuarterDollar(neg.npcCurrentOffer + 0.25));
          neg.npcCurrentOffer = nudge;
          neg.playerDraftOffer = nudge;
          neg.messages.push({
            sender: 'npc',
            text: `Whoa, ${this.formatMoney(offer)} won't cover it! Best I can move to is ${this.formatMoney(nudge)} (${neg.patience}/${neg.maxPatience} patience left).`
          });
        }
      }

      this.renderNegotiationPane();
    }

    acceptCurrentNegotiationPrice() {
      const neg = this.activeNegotiation;
      if (!neg || neg.status !== 'negotiating') return;
      neg.agreedPrice = neg.npcCurrentOffer;
      neg.status = 'agreed';
      neg.messages.push({
        sender: 'player',
        text: `Agreed — ${this.formatMoney(neg.agreedPrice)} works for me!`
      });
      neg.messages.push({
        sender: 'npc',
        text: `Awesome! Click Confirm & Schedule Meetup below and I'll see you on Day ${neg.scheduledDay}!`
      });
      if (window.sounds?.playCollect) window.sounds.playCollect();
      this.renderNegotiationPane();
    }

    confirmAgreedMeetup() {
      const neg = this.activeNegotiation;
      if (!neg || neg.status !== 'agreed' || !neg.agreedPrice) return;

      const target = this.getMeetupTargetDetails(neg.npcId, neg.venueType, neg.landmarkId);
      const meetupRecord = {
        id: neg.editingMeetupId || `mp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        listingId: neg.listingId,
        type: neg.type,
        beastId: neg.beastId,
        cardName: neg.cardName,
        npcId: neg.npcId,
        npcName: neg.npcName,
        npcAvatar: neg.npcAvatar,
        basePrice: neg.basePrice,
        agreedPrice: neg.agreedPrice,
        scheduledDay: neg.scheduledDay,
        venueType: target.venueType,
        landmarkId: target.landmarkId,
        area: target.area,
        venueLabel: target.venueLabel,
        shortVenueLabel: target.shortVenueLabel,
        meetupPos: target.meetupPos,
        status: 'scheduled'
      };

      this.scheduledMeetups = (this.scheduledMeetups || []).filter(
        m => !(m.status === 'scheduled' && (m.id === meetupRecord.id || m.listingId === neg.listingId))
      );
      this.scheduledMeetups.push(meetupRecord);
      this.activeNegotiation = null;
      this.marketTab = 'meetups';

      this.saveWorldData(this.draftAppearance);
      this.updateMeetupBadgeCount();
      this.renderMarketApp();
      this.showAutosaveIndicator(
        `📅 Meetup Scheduled: ${meetupRecord.npcName} @ ${meetupRecord.shortVenueLabel} on Day ${meetupRecord.scheduledDay}!`
      );
    }

    cancelScheduledMeetup(meetupId) {
      this.scheduledMeetups = (this.scheduledMeetups || []).filter(m => m.id !== meetupId);
      this.saveWorldData(this.draftAppearance);
      this.updateMeetupBadgeCount();
      this.renderMarketApp();
      this.showAutosaveIndicator('❌ Card Meetup Cancelled');
    }

    completeScheduledMeetup(meetupId) {
      const m = (this.scheduledMeetups || []).find(item => item.id === meetupId && item.status === 'scheduled');
      if (!m) {
        return { ok: false, message: 'That card meetup was already completed or cancelled.' };
      }

      if (m.type === 'buy') {
        if ((this.gold || 0) < m.agreedPrice) {
          if (window.sounds?.playError) window.sounds.playError();
          return {
            ok: false,
            message: `You need ${this.formatMoney(m.agreedPrice)} to complete this trade (Wallet: ${this.formatMoney(this.gold || 0)}). Earn more cash and talk to me again today!`
          };
        }
        this.gold = Math.round(((this.gold || 0) - m.agreedPrice) * 100) / 100;
        if (!this.phoneListingsBought.includes(m.listingId)) {
          this.phoneListingsBought.push(m.listingId);
        }
        const cardDef = this.getBaseSetCardCatalog().find(c => c.beastId === m.beastId);
        if (cardDef) {
          this.addCardToInventory(cardDef);
        }
        m.status = 'completed';
        if (window.sounds?.playCollect) window.sounds.playCollect();
        this.saveWorldData(this.draftAppearance);
        this.updateHUDSaveInfo();
        this.renderInventoryModal?.();
        this.updateMeetupBadgeCount();
        this.showAutosaveIndicator(`🤝 Bought ${m.cardName} from ${m.npcName} for ${this.formatMoney(m.agreedPrice)}!`);
        const buySuccessMsg = `Awesome meeting up at ${m.shortVenueLabel}! Here's your <b>${m.cardName}</b> card for <b>${this.formatMoney(m.agreedPrice)}</b>!`;
        this._justCompletedMeetup = { meetup: m, message: buySuccessMsg };
        return {
          ok: true,
          message: buySuccessMsg
        };
      }

      // Sell completion
      const idx = (this.inventory || []).findIndex(i => i.beastId === m.beastId && (i.qty || 1) > 0);
      if (idx === -1) {
        if (window.sounds?.playError) window.sounds.playError();
        return {
          ok: false,
          message: `Wait — you don't have a <b>${m.cardName}</b> in your backpack right now! Move it out of your card binder first if it's slotted there.`
        };
      }
      const invItem = this.inventory[idx];
      if (invItem.qty && invItem.qty > 1) {
        invItem.qty--;
      } else {
        this.inventory.splice(idx, 1);
      }
      this.gold = Math.round(((this.gold || 0) + m.agreedPrice) * 100) / 100;
      if (!this.phoneListingsSold.includes(m.listingId)) {
        this.phoneListingsSold.push(m.listingId);
      }
      m.status = 'completed';
      if (window.sounds?.playCoins) window.sounds.playCoins();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderInventoryModal?.();
      this.updateMeetupBadgeCount();
      this.showAutosaveIndicator(`💰 Sold ${m.cardName} to ${m.npcName} for +${this.formatMoney(m.agreedPrice)}!`);
      const sellSuccessMsg = `Thanks for meeting at ${m.shortVenueLabel}! Here's your <b>+${this.formatMoney(m.agreedPrice)}</b> for the <b>${m.cardName}</b> card!`;
      this._justCompletedMeetup = { meetup: m, message: sellSuccessMsg };
      return {
        ok: true,
        message: sellSuccessMsg
      };
    }

    renderShopFeedApp() {
      const body = document.getElementById('phone-shopfeed-body');
      if (!body) return;
      const alerts = this.getShopAlertsFeed();
      body.innerHTML = '';

      alerts.forEach(a => {
        const card = document.createElement('div');
        card.className = `phone-alert-card${a.highlight ? ' highlight' : ''}`;
        card.innerHTML = `
          <div class="phone-alert-icon">${a.icon}</div>
          <div class="phone-alert-content">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="phone-alert-title">${a.title}</span>
              <span class="phone-alert-time">${a.tag}</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">${a.time}</div>
            <div class="phone-alert-text">${a.text}</div>
          </div>
        `;
        body.appendChild(card);
      });
    }

    renderTournamentsApp() {
      const body = document.getElementById('phone-tournaments-body');
      if (!body) return;
      const tournaments = this.getTournamentSchedule();
      body.innerHTML = '';

      tournaments.forEach(t => {
        const isRegistered = this.registeredTournaments.includes(t.id);
        const isParkMonday = t.id === 'tourney_park';
        const isMon = this.isMondayToday();
        const parkDoneToday = this.isParkMondayTourneyCompletedToday();
        const isLiveToday = isParkMonday
          ? (isMon && !parkDoneToday)
          : (t.id === 'tourney_fri' && this.getCurrentDayIndex() === 4);
        const daysUntilMon = isMon ? 7 : (7 - this.getCurrentDayIndex());
        const statusLine = isParkMonday
          ? (isMon
            ? (parkDoneToday
              ? '✅ Completed this Monday • Next Monday opens in 7 days'
              : '🟢 LIVE TODAY in Central Park! Talk to Chloe, Rowan, or Jasper')
            : `📅 Next Monday in ${daysUntilMon} day${daysUntilMon > 1 ? 's' : ''}`)
          : '';
        const card = document.createElement('div');
        card.className = `phone-tourney-card${isLiveToday ? ' live-today' : ''}`;
        card.innerHTML = `
          <div class="phone-tourney-header">
            <div>
              <div class="phone-tourney-name">${t.name}</div>
              <div style="font-size: 10.5px; color: #a78bfa; font-weight: 700;">${t.dayText}</div>
            </div>
            <span class="phone-tourney-badge ${t.badgeClass}">${t.badge}</span>
          </div>
          <div class="phone-tourney-meta">
            <span>🎟️ ${t.fee}</span>
            <span>🏆 ${t.prize}</span>
          </div>
          <div style="font-size: 10.5px; color: #94a3b8;">📍 Venue: <b>${t.location}</b></div>
          ${statusLine ? `<div style="font-size: 10.5px; color: #fde68a; font-weight: 700; margin-top: 3px;">${statusLine}</div>` : ''}
          <div class="phone-tourney-desc">${t.desc}</div>
          <button class="phone-tourney-btn" id="btn-reg-${t.id}" ${isRegistered ? 'disabled style="background: #334155; border-color: #475569; cursor: default;"' : ''}>
            ${isRegistered ? '✅ Checked-In & Registered' : '📋 Register & RSVP Entry'}
          </button>
        `;
        const regBtn = card.querySelector(`#btn-reg-${t.id}`);
        if (regBtn && !isRegistered) {
          regBtn.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.registeredTournaments.push(t.id);
            this.saveWorldData(this.draftAppearance);
            this.renderTournamentsApp();
            this.showAutosaveIndicator(`🏆 Registered for ${t.name}! Check in at ${t.location}`);
          });
        }
        body.appendChild(card);
      });
    }

    // -------------------------------------------------------------------------
    // Player Inventory, Base Set Card Catalog & Theatrical Pack Opening System
    // -------------------------------------------------------------------------
    getMythosPackCatalog() {
      const reg = window.MythosGwentCards;
      if (!reg?.CARDS) return [];
      const rowIcons = reg.ROW_ICONS || { melee: '⚔️', ranged: '🏹', agile: '🌀' };
      return Object.values(reg.CARDS)
        .filter(c => !c.isToken)
        .map(c => {
          const armorTxt = c.armor > 0 ? ` • 🛡️${c.armor}` : '';
          const abilityTxt = c.abilityDesc ? `${c.abilityTitle}: ${c.abilityDesc}` : (c.passiveDesc || 'Mythos Unit Card');
          return {
            id: `card_${c.id}`,
            beastId: c.id,
            name: `${c.name} (Mythos Card)`,
            shortName: c.name,
            element: c.role || c.element || 'Unit',
            stars: c.stars || 1,
            badgeLabel: `${rowIcons[c.row] || '🃏'} ${c.role || 'Unit'} • ${c.basePower} PWR${armorTxt}`,
            cardImg: c.cardImg,
            desc: `<b>${c.name} (${c.role || 'Unit'} • ${c.basePower} Power${c.armor > 0 ? `, ${c.armor} Armor` : ''})</b> — ${abilityTxt}`
          };
        });
    }

    getBaseSetCardCatalog() {
      const legacy = [
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
      const mythosCards = this.getMythosPackCatalog();
      const seen = new Set(mythosCards.map(c => c.id));
      return [...mythosCards, ...legacy.filter(c => !seen.has(c.id))];
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

    addCardToInventory(cardDef) {
      if (!cardDef) return;
      this.addInventoryItem({
        ...cardDef,
        type: 'mythos_card',
        qty: 1
      });
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

      const found = catalog[cleanId] || (window.BEAST_TEMPLATES && window.BEAST_TEMPLATES[cleanId]);
      if (found) return found;

      const mythosCard = window.MythosGwentCards?.CARDS?.[cleanId];
      if (mythosCard) {
        const rowLabel = mythosCard.row
          ? mythosCard.row.charAt(0).toUpperCase() + mythosCard.row.slice(1)
          : 'Agile';
        const armorText = mythosCard.armor ? ` • 🛡️ ${mythosCard.armor} Armor` : '';
        return {
          id: mythosCard.id,
          name: mythosCard.name,
          element: mythosCard.element || 'earth',
          stars: mythosCard.stars || 1,
          isMythosCard: true,
          maxHp: mythosCard.basePower ?? 1,
          baseMove: rowLabel,
          cardImg: mythosCard.cardImg,
          sprites: {
            idle: mythosCard.cardImg,
            attack: mythosCard.cardImg,
            walk: mythosCard.cardImg,
            aoe: mythosCard.cardImg
          },
          skills: {
            atk1: {
              name: `${rowLabel} Power`,
              range: rowLabel,
              dmg: `${mythosCard.basePower ?? 1} PWR${armorText}`,
              type: mythosCard.role || 'Unit',
              desc: `${mythosCard.rarity ? mythosCard.rarity.toUpperCase() + ' ' : ''}${mythosCard.role || 'Mythos Unit'} deployed to the ${rowLabel} row.`
            },
            atk2: {
              name: mythosCard.passiveTitle || 'No Passive',
              range: rowLabel,
              dmg: mythosCard.passiveTitle ? 'Passive' : '—',
              type: 'Passive',
              desc: mythosCard.passiveDesc || 'No passive effect.'
            },
            ability: {
              name: mythosCard.abilityTitle || 'No Ability',
              type: 'Card Ability',
              desc: mythosCard.abilityDesc || 'No special ability.'
            }
          },
          elementLore: `${mythosCard.role || 'Mythos Unit'} (${(mythosCard.rarity || 'bronze').toUpperCase()}) • ${rowLabel} Row • Base Power ${mythosCard.basePower ?? 1}${armorText}`
        };
      }

      return null;
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

    /** Classify an inventory item into satchel category and element/type metadata. */
    getInventoryItemMeta(item) {
      if (!item) return { category: 'gear', kindAttr: 'gear', tagLabel: 'Item', elemAttr: '', detailTags: [] };
      if (item.type === 'booster_pack') {
        return {
          category: 'pack',
          kindAttr: 'pack',
          tagLabel: 'Pack',
          elemAttr: '',
          detailTags: ['📦 Booster Pack', '✨ 1st Edition']
        };
      }
      if (item.type === 'mythos_card') {
        const catalogDef = item.beastId
          ? this.getBaseSetCardCatalog?.().find(c => c.beastId === item.beastId)
          : null;
        const elem = (item.element || catalogDef?.element || 'Neutral');
        const stars = Number(item.stars || catalogDef?.stars || 0);
        const elemKey = elem.toLowerCase();
        const detailTags = [`🃏 Mythos Card`, elem];
        if (stars > 0) detailTags.push('★'.repeat(stars));
        return {
          category: 'card',
          kindAttr: 'card',
          tagLabel: elem,
          elemAttr: elemKey,
          detailTags
        };
      }
      return {
        category: 'gear',
        kindAttr: 'gear',
        tagLabel: item.type === 'battle_map' ? 'Arena Map' : 'Relic',
        elemAttr: '',
        detailTags: [item.type === 'battle_map' ? '🗺️ Arena Board' : '🎒 Key Gear']
      };
    }

    renderInventoryModal() {
      const gridEl = document.getElementById('inventory-items-grid');
      const walletEl = document.getElementById('inv-wallet-display');
      const badgeEl = document.getElementById('inv-badge-count');
      const slotSummaryEl = document.getElementById('inv-slot-summary');
      const artEl = document.getElementById('inv-detail-art');
      const nameEl = document.getElementById('inv-detail-name');
      const qtyEl = document.getElementById('inv-detail-qty');
      const tagsEl = document.getElementById('inv-detail-tags');
      const descEl = document.getElementById('inv-detail-desc');
      const actionsEl = document.getElementById('inv-detail-actions');
      const openPackBtn = document.getElementById('btn-inv-open-pack');
      const putBinderBtn = document.getElementById('btn-inv-put-binder');
      const inspectBtn = document.getElementById('btn-inv-inspect');

      const totalCount = this.getTotalInventoryCount();
      const filter = this.inventoryFilter || 'all';
      if (badgeEl) badgeEl.textContent = String(totalCount);
      if (walletEl) walletEl.textContent = `💵 ${this.formatMoney(this.gold || 0)}`;
      if (slotSummaryEl) {
        slotSummaryEl.textContent = `${this.inventory.length} Item${this.inventory.length === 1 ? '' : 's'} • ${totalCount} Total`;
      }
      document.querySelectorAll('#inv-filter-tabs .inv-filter-tab').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.filter || 'all') === filter);
      });
      if (!gridEl) return;

      const visibleItems = filter === 'all'
        ? this.inventory
        : this.inventory.filter(item => this.getInventoryItemMeta(item).category === filter);

      gridEl.innerHTML = '';
      const totalSlots = Math.max(8, Math.ceil((visibleItems.length + 1) / 4) * 4);

      if (visibleItems.length > 0 && !visibleItems.some(i => i.id === this.selectedInventoryItemId)) {
        this.selectedInventoryItemId = visibleItems[0].id;
      }

      for (let s = 0; s < totalSlots; s++) {
        const item = visibleItems[s];
        const slot = document.createElement('div');
        if (item) {
          const meta = this.getInventoryItemMeta(item);
          const isSelected = item.id === this.selectedInventoryItemId;
          slot.className = `inv-slot filled${isSelected ? ' active' : ''}`;
          slot.dataset.kind = meta.kindAttr;
          if (meta.elemAttr) slot.dataset.element = meta.elemAttr;
          const kindPillHtml = `<span class="inv-slot-kind-tag">${meta.tagLabel}</span>`;
          if (item.type === 'booster_pack') {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div class="inv-pack-art-thumb">
                <img src="${item.cardImg || 'Cards/Mythos_Card_Back.png'}" alt="${item.name}">
              </div>
              <div class="inv-slot-name">${item.name}</div>
              ${kindPillHtml}
            `;
          } else if (item.type === 'mythos_card' && item.cardImg) {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div class="inv-card-art-thumb">
                <img src="${item.cardImg}" alt="${item.name}">
              </div>
              <div class="inv-slot-name">${item.name}</div>
              ${kindPillHtml}
            `;
          } else {
            slot.innerHTML = `
              <span class="inv-slot-qty">x${item.qty}</span>
              <div style="font-size: 28px;">${item.icon || '📦'}</div>
              <div class="inv-slot-name">${item.name}</div>
              ${kindPillHtml}
            `;
          }
          slot.addEventListener('click', () => {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.selectedInventoryItemId = item.id;
            this.renderInventoryModal();
          });
        } else {
          slot.className = 'inv-slot empty';
          slot.innerHTML = `<span style="font-size: 16px; opacity: 0.3;">✦</span><div class="inv-slot-name" style="color: var(--text-muted); opacity: 0.7;">Empty Pocket</div>`;
        }
        gridEl.appendChild(slot);
      }

      const selectedItem = visibleItems.find(i => i.id === this.selectedInventoryItemId);
      if (selectedItem && nameEl && descEl && artEl && qtyEl) {
        const meta = this.getInventoryItemMeta(selectedItem);
        if (tagsEl) {
          tagsEl.innerHTML = meta.detailTags
            .map(t => `<span class="inv-detail-tag-pill">${t}</span>`)
            .join('');
        }
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
            inspectBtn.textContent = '🔍 Inspect Creature';
            inspectBtn.onclick = () => {
              this.toggleInventoryModal(false);
              this.openCreatureInspect(selectedItem, null);
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
        artEl.innerHTML = `<img src="Sprites/Overworld/backpack_icon.png" class="inventory-backpack-emblem" alt="Backpack">`;
        nameEl.textContent = this.inventory.length > 0 ? 'No Items in Filter' : 'Backpack Empty';
        qtyEl.classList.add('hidden');
        if (tagsEl) tagsEl.innerHTML = '';
        actionsEl?.classList.add('hidden');
        descEl.textContent = this.inventory.length > 0
          ? "No items match this satchel filter. Switch tabs above to view all pockets."
          : "Your backpack has no items yet. Ask Mom for $25 and head to Leo's Card Shop on the far east block of the south road to buy your first Booster Pack!";
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
      const cost = isDiscountDay ? 4.00 : 5.00;
      if ((this.gold || 0) < cost) {
        if (window.sounds?.playClick) window.sounds.playClick();
        const statusEl = document.getElementById('shop-buy-status');
        if (statusEl) {
          statusEl.textContent = `⚠️ You don't have enough money! A Base Card Pack costs ${this.formatMoney(cost)}.`;
          statusEl.className = 'shop-buy-status error';
        }
        return false;
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
      return true;
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
      const packCost = activeEvent?.id === 'weekend_market' ? 4.00 : 5.00;
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

    /** True when the current in-game day is Monday (`dayIndex === 0`). */
    isMondayToday() {
      return this.getCurrentDayIndex() === 0;
    }

    /** True when the player has already finished this Monday's Central Park Round Robin. */
    isParkMondayTourneyCompletedToday() {
      return this.isMondayToday() && Number(this.lastParkTourneyCompletedDay || 0) === Number(this.dayNumber || 1);
    }

    /** True when the Monday Oakhaven Central Park Round Robin can be started or resumed today. */
    isParkMondayTourneyAvailable() {
      return this.isMondayToday() && !this.isParkMondayTourneyCompletedToday();
    }

    /** Update overhead bubbles for Chloe, Rowan, and Jasper based on Monday tournament status. */
    syncParkNpcBubbles() {
      const available = this.isParkMondayTourneyAvailable();
      if (this.chloeNpc) this.chloeNpc.bubble = available ? '🏆' : '🧺';
      if (this.rowanNpc) this.rowanNpc.bubble = available ? '🏆' : '🃏';
      if (this.jasperNpc) this.jasperNpc.bubble = available ? '🏆' : '🎨';
    }

    /** Return participant metadata and casual signature 3v3 teams for the Park Round Robin. */
    getParkTourneyParticipants() {
      const pName = this.draftAppearance?.name || 'Asher';
      return [
        { id: 'player', name: pName, avatar: '⭐', isPlayer: true, basePower: 3 },
        { id: 'chloe', name: 'Chloe', avatar: '🧺', team: ['terra_mother', 'verdant_guardian', 'phoenix'], flavor: 'Nature & Sunny Balance', basePower: 2 },
        { id: 'jasper', name: 'Jasper', avatar: '🎨', team: ['werewolf', 'hydra', 'earth_golem'], flavor: 'Wildpack & Stone Sketchbook', basePower: 2 },
        { id: 'rowan', name: 'Rowan', avatar: '🃏', team: ['pegasus', 'dreadnaught', 'dwarf_warden'], flavor: 'Aerial & Citadel Tactics', basePower: 3 }
      ];
    }

    /** Create a fresh 4-player, 3-round Round Robin state where every contender faces each other once. */
    createParkMondayTourneyState(hostedBy = 'chloe') {
      const defaultOrder = ['chloe', 'jasper', 'rowan'];
      const opponents = defaultOrder.includes(hostedBy)
        ? [hostedBy, ...defaultOrder.filter(id => id !== hostedBy)]
        : defaultOrder;
      const [opp1, opp2, opp3] = opponents;

      return {
        id: 'park_monday_rr',
        dayNumber: this.dayNumber || 1,
        hostedBy,
        currentRound: 1,
        completed: false,
        prizeAwarded: false,
        championName: null,
        runnerUpName: null,
        playerRank: null,
        playerPrize: 0,
        finalStandings: null,
        rounds: [
          {
            round: 1,
            matches: [
              { id: 'r1_m1', a: 'player', b: opp1, isPlayerMatch: true, completed: false, winnerId: null, loserId: null, hpMargin: 0 },
              { id: 'r1_m2', a: opp2, b: opp3, isPlayerMatch: false, completed: false, winnerId: null, loserId: null, hpMargin: 0 }
            ]
          },
          {
            round: 2,
            matches: [
              { id: 'r2_m1', a: 'player', b: opp2, isPlayerMatch: true, completed: false, winnerId: null, loserId: null, hpMargin: 0 },
              { id: 'r2_m2', a: opp1, b: opp3, isPlayerMatch: false, completed: false, winnerId: null, loserId: null, hpMargin: 0 }
            ]
          },
          {
            round: 3,
            matches: [
              { id: 'r3_m1', a: 'player', b: opp3, isPlayerMatch: true, completed: false, winnerId: null, loserId: null, hpMargin: 0 },
              { id: 'r3_m2', a: opp1, b: opp2, isPlayerMatch: false, completed: false, winnerId: null, loserId: null, hpMargin: 0 }
            ]
          }
        ]
      };
    }

    /** Retrieve today's Monday Round Robin state, creating one only if it is Monday and available. */
    getOrCreateParkMondayTourney(hostedBy = 'chloe') {
      if (!this.isMondayToday()) return null;
      const today = this.dayNumber || 1;
      if (this.activeParkTourney && this.activeParkTourney.dayNumber === today) {
        return this.activeParkTourney;
      }
      if (this.isParkMondayTourneyCompletedToday()) {
        return null;
      }
      this.activeParkTourney = this.createParkMondayTourneyState(hostedBy);
      this.saveWorldData(this.draftAppearance);
      return this.activeParkTourney;
    }

    /** Compute Round Robin standings sorted by wins, H2H / mini-league tiebreaks, and HP differential. */
    computeParkMondayStandings(tourney) {
      const participants = this.getParkTourneyParticipants();
      const map = new Map();
      participants.forEach((p, idx) => {
        map.set(p.id, {
          ...p,
          orderIndex: idx,
          wins: 0,
          losses: 0,
          played: 0,
          hpDiff: 0
        });
      });

      const h2hWins = new Set(); // "winner|loser"
      const completedMatches = [];
      (tourney?.rounds || []).forEach(r => {
        (r.matches || []).forEach(m => {
          if (!m.completed || !m.winnerId || !m.loserId) return;
          completedMatches.push(m);
          const wRow = map.get(m.winnerId);
          const lRow = map.get(m.loserId);
          const margin = Math.max(0, Math.round(m.hpMargin || 0));
          if (wRow) {
            wRow.wins += 1;
            wRow.played += 1;
            wRow.hpDiff += margin;
          }
          if (lRow) {
            lRow.losses += 1;
            lRow.played += 1;
            lRow.hpDiff -= margin;
          }
          h2hWins.add(`${m.winnerId}|${m.loserId}`);
        });
      });

      const rankBucket = (rows) => {
        if (rows.length <= 1) return rows;
        if (rows.length === 2) {
          const [rA, rB] = rows;
          const aBeatB = h2hWins.has(`${rA.id}|${rB.id}`);
          const bBeatA = h2hWins.has(`${rB.id}|${rA.id}`);
          if (aBeatB && !bBeatA) return [rA, rB];
          if (bBeatA && !aBeatB) return [rB, rA];
        } else {
          const memberIds = new Set(rows.map(r => r.id));
          const miniWins = new Map(rows.map(r => [r.id, 0]));
          completedMatches.forEach(m => {
            if (memberIds.has(m.winnerId) && memberIds.has(m.loserId)) {
              miniWins.set(m.winnerId, (miniWins.get(m.winnerId) || 0) + 1);
            }
          });
          const distinctMini = new Set(miniWins.values());
          if (distinctMini.size > 1) {
            const groupedMini = [...distinctMini].sort((a, b) => b - a);
            const ordered = [];
            groupedMini.forEach(score => {
              const sub = rows.filter(r => miniWins.get(r.id) === score);
              ordered.push(...rankBucket(sub));
            });
            return ordered;
          }
        }
        return [...rows].sort((a, b) => {
          if (b.hpDiff !== a.hpDiff) return b.hpDiff - a.hpDiff;
          if (a.isPlayer !== b.isPlayer) return a.isPlayer ? -1 : 1;
          return a.orderIndex - b.orderIndex;
        });
      };

      const rows = Array.from(map.values());
      const distinctWins = [...new Set(rows.map(r => r.wins))].sort((a, b) => b - a);
      const sorted = [];
      distinctWins.forEach(w => {
        sorted.push(...rankBucket(rows.filter(r => r.wins === w)));
      });

      return sorted.map((row, idx) => {
        const rank = idx + 1;
        const prize = rank === 1 ? 10 : (rank === 2 ? 5 : 0);
        return { ...row, rank, prize };
      });
    }

    /** Simulate a casual NPC vs NPC Round Robin match using contender strength and variance. */
    resolveSimulatedParkNpcMatch(match, participantsById) {
      if (!match || match.completed) return;
      const pA = participantsById.get(match.a);
      const pB = participantsById.get(match.b);
      const scoreA = (pA?.basePower || 2) + Math.random() * 2.5;
      const scoreB = (pB?.basePower || 2) + Math.random() * 2.5;
      const aWins = scoreA >= scoreB;
      match.winnerId = aWins ? match.a : match.b;
      match.loserId = aWins ? match.b : match.a;
      match.hpMargin = 20 + Math.floor(Math.random() * 55);
      match.completed = true;
    }

    /** Record the outcome of a player's Monday Park Round Robin match and advance or conclude the event. */
    recordParkMondayMatchResult(challenger, playerWon, rawHpMargin = 0) {
      const tourney = this.activeParkTourney;
      if (!tourney || tourney.dayNumber !== (this.dayNumber || 1)) return null;

      if (tourney.completed) {
        return {
          completed: true,
          playerRank: tourney.playerRank,
          playerPrize: tourney.playerPrize,
          championName: tourney.championName,
          runnerUpName: tourney.runnerUpName
        };
      }

      const roundNum = challenger?.tournamentContext?.round || tourney.currentRound || 1;
      const roundObj = tourney.rounds.find(r => r.round === roundNum);
      if (!roundObj) return null;

      const playerMatch = roundObj.matches.find(m => m.isPlayerMatch);
      if (!playerMatch) return null;

      if (!playerMatch.completed) {
        const oppId = playerMatch.a === 'player' ? playerMatch.b : playerMatch.a;
        const margin = Math.max(10, Math.round(Math.abs(rawHpMargin || 20)));
        playerMatch.winnerId = playerWon ? 'player' : oppId;
        playerMatch.loserId = playerWon ? oppId : 'player';
        playerMatch.hpMargin = margin;
        playerMatch.completed = true;
      }

      const participants = this.getParkTourneyParticipants();
      const byId = new Map(participants.map(p => [p.id, p]));
      const npcMatch = roundObj.matches.find(m => !m.isPlayerMatch);
      let npcMatchSummary = '';
      if (npcMatch) {
        this.resolveSimulatedParkNpcMatch(npcMatch, byId);
        const wName = byId.get(npcMatch.winnerId)?.name || npcMatch.winnerId;
        const lName = byId.get(npcMatch.loserId)?.name || npcMatch.loserId;
        npcMatchSummary = `${wName} def. ${lName}`;
      }

      const allCompleted = tourney.rounds.every(r => r.matches.every(m => m.completed));
      if (!allCompleted) {
        const nextRound = tourney.rounds.find(r => r.matches.some(m => !m.completed));
        tourney.currentRound = nextRound ? nextRound.round : (roundNum + 1);
        this.saveWorldData(this.draftAppearance);
        this.updateHUDSaveInfo();
        return {
          completed: false,
          round: roundNum,
          nextRound: tourney.currentRound,
          npcMatchSummary
        };
      }

      tourney.completed = true;
      tourney.currentRound = 3;
      this.lastParkTourneyCompletedDay = tourney.dayNumber;
      const standings = this.computeParkMondayStandings(tourney);
      const playerEntry = standings.find(s => s.id === 'player');
      const champion = standings[0];
      const runnerUp = standings[1];

      tourney.finalStandings = standings.map(s => ({
        id: s.id,
        name: s.name,
        rank: s.rank,
        wins: s.wins,
        losses: s.losses,
        hpDiff: s.hpDiff,
        prize: s.prize
      }));
      tourney.playerRank = playerEntry?.rank || 4;
      tourney.playerPrize = playerEntry?.prize || 0;
      tourney.championName = champion?.name || 'Winner';
      tourney.runnerUpName = runnerUp?.name || 'Runner-up';

      if (!tourney.prizeAwarded && tourney.playerPrize > 0) {
        tourney.prizeAwarded = true;
        this.gold = Math.round(((this.gold || 0) + tourney.playerPrize) * 100) / 100;
      }

      this.syncParkNpcBubbles();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      return {
        completed: true,
        round: roundNum,
        npcMatchSummary,
        playerRank: tourney.playerRank,
        playerPrize: tourney.playerPrize,
        championName: tourney.championName,
        runnerUpName: tourney.runnerUpName
      };
    }

    /** Open the Monday Park Round Robin modal from Chloe, Rowan, or Jasper's dialogue. */
    openParkTournamentFromDialogue(npcId = 'chloe') {
      if (!this.isMondayToday()) return;
      if (!this.isParkMondayTourneyCompletedToday()) {
        this.getOrCreateParkMondayTourney(npcId);
      }
      this.closeDialogue();
      this.toggleParkTournamentModal(true);
    }

    /** Open or close the Oakhaven Central Park Monday Casual Round Robin bracket modal. */
    toggleParkTournamentModal(force) {
      const modal = document.getElementById('park-tournament-modal');
      if (!modal) return;
      const shouldOpen = typeof force === 'boolean' ? force : modal.classList.contains('hidden');
      if (shouldOpen) {
        if (window.sounds?.playClick) window.sounds.playClick();
        if (this.isMondayToday() && !this.isParkMondayTourneyCompletedToday() && !this.activeParkTourney) {
          this.getOrCreateParkMondayTourney('chloe');
        }
        this.renderParkTournamentModal();
        modal.classList.remove('hidden');
        this.keys = {};
      } else {
        modal.classList.add('hidden');
        this.keys = {};
      }
    }

    /** Populate the Round Robin standings, 3-round schedule, and action button in #park-tournament-modal. */
    renderParkTournamentModal() {
      const bannerEl = document.getElementById('park-tourney-status-banner');
      const standingsEl = document.getElementById('park-tourney-standings');
      const roundsEl = document.getElementById('park-tourney-rounds');
      const actionBtn = document.getElementById('btn-start-park-tourney-match');
      const subtitleEl = document.getElementById('park-tourney-subtitle');
      if (!bannerEl || !standingsEl || !roundsEl || !actionBtn) return;

      const isMon = this.isMondayToday();
      const doneToday = this.isParkMondayTourneyCompletedToday();
      const today = this.dayNumber || 1;
      const tourney = (this.activeParkTourney && this.activeParkTourney.dayNumber === today)
        ? this.activeParkTourney
        : this.createParkMondayTourneyState('chloe');

      const participants = this.getParkTourneyParticipants();
      const byId = new Map(participants.map(p => [p.id, p]));
      const standings = this.computeParkMondayStandings(tourney);

      if (subtitleEl) {
        subtitleEl.textContent = `${this.getCurrentDayName()} (Day ${today}) • 4-Player Round Robin • 1st: $10.00 • 2nd: $5.00`;
      }

      const nextRoundObj = tourney.rounds.find(r => r.matches.some(m => m.isPlayerMatch && !m.completed));
      const nextPlayerMatch = nextRoundObj?.matches.find(m => m.isPlayerMatch);
      const nextOpp = nextPlayerMatch
        ? byId.get(nextPlayerMatch.a === 'player' ? nextPlayerMatch.b : nextPlayerMatch.a)
        : null;

      bannerEl.classList.remove('completed', 'locked');
      if (!isMon) {
        const daysLeft = 7 - this.getCurrentDayIndex();
        bannerEl.classList.add('locked');
        bannerEl.innerHTML = `
          <div>
            <div class="tourney-status-main">📅 Closed Today — Opens Every Monday</div>
            <div class="tourney-status-sub">Today is ${this.getCurrentDayName()}. Sleep at home ${daysLeft} night${daysLeft > 1 ? 's' : ''} to reach next Monday in Oakhaven Central Park!</div>
          </div>
          <div class="tourney-prize-pills">
            <span class="tourney-prize-pill">🥇 1st: $10.00</span>
            <span class="tourney-prize-pill silver">🥈 2nd: $5.00</span>
          </div>
        `;
      } else if (tourney.completed || doneToday) {
        bannerEl.classList.add('completed');
        const pEntry = standings.find(s => s.id === 'player');
        const rankText = pEntry?.rank === 1 ? '🥇 1st Place' : pEntry?.rank === 2 ? '🥈 2nd Place' : `${pEntry?.rank || '-'}th Place`;
        const prizeNote = (pEntry?.prize || 0) > 0
          ? `Prize Awarded: $${pEntry.prize.toFixed(2)}`
          : 'No cash prize this Monday';
        bannerEl.innerHTML = `
          <div>
            <div class="tourney-status-main">🏁 This Monday's Round Robin is Complete!</div>
            <div class="tourney-status-sub">Your finish: <b>${rankText}</b> (${pEntry?.wins || 0}-${pEntry?.losses || 0}) • ${prizeNote} • Redoable next Monday!</div>
          </div>
          <div class="tourney-prize-pills">
            <span class="tourney-prize-pill">🥇 1st: $10.00</span>
            <span class="tourney-prize-pill silver">🥈 2nd: $5.00</span>
          </div>
        `;
      } else {
        bannerEl.innerHTML = `
          <div>
            <div class="tourney-status-main">🏆 Monday Open — Round ${nextRoundObj?.round || 1} of 3 Ready</div>
            <div class="tourney-status-sub">Next Match: <b>You vs. ${nextOpp?.name || 'Challenger'}</b> (${nextOpp?.flavor || 'Casual Deck'})</div>
          </div>
          <div class="tourney-prize-pills">
            <span class="tourney-prize-pill">🥇 1st: $10.00</span>
            <span class="tourney-prize-pill silver">🥈 2nd: $5.00</span>
          </div>
        `;
      }

      const tableRows = standings.map(s => {
        const rankCls = s.rank === 1 ? 'rank-1' : (s.rank === 2 ? 'rank-2' : '');
        const prizeTag = ((tourney.completed || doneToday) && s.prize > 0) ? ` <span style="color:#fde047; font-size:11px;">(+$${s.prize})</span>` : '';
        const hpStr = s.hpDiff > 0 ? `+${s.hpDiff}` : `${s.hpDiff}`;
        return `
          <tr class="${s.isPlayer ? 'is-player' : ''}">
            <td><span class="tourney-rank-badge ${rankCls}">#${s.rank}</span></td>
            <td>${s.avatar} ${s.name}${prizeTag}</td>
            <td><b>${s.wins}-${s.losses}</b></td>
            <td>${hpStr}</td>
          </tr>
        `;
      }).join('');

      standingsEl.innerHTML = `
        <table class="tourney-standings-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Contender</th>
              <th>W-L</th>
              <th>HP±</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;

      roundsEl.innerHTML = (tourney.rounds || []).map(r => {
        const isCurrent = isMon && !tourney.completed && r.round === (nextRoundObj?.round || 1);
        const isDone = r.matches.every(m => m.completed);
        const matchesHtml = r.matches.map(m => {
          const pA = byId.get(m.a);
          const pB = byId.get(m.b);
          let badge = 'Upcoming';
          let badgeCls = '';
          if (!isMon) {
            badge = 'Mon Only';
          } else if (m.completed) {
            const winName = byId.get(m.winnerId)?.name || m.winnerId;
            badge = `${winName} Won`;
            if (m.isPlayerMatch) {
              badgeCls = m.winnerId === 'player' ? 'win' : 'loss';
            }
          } else if (isCurrent && m.isPlayerMatch) {
            badge = 'Live Next';
          }
          return `
            <div class="tourney-match-row">
              <span>${pA?.avatar || ''} <b>${pA?.name || m.a}</b> vs. ${pB?.avatar || ''} <b>${pB?.name || m.b}</b></span>
              <span class="tourney-match-result ${badgeCls}">${badge}</span>
            </div>
          `;
        }).join('');

        return `
          <div class="tourney-round-card ${isCurrent ? 'active-round' : ''} ${isDone ? 'done-round' : ''}">
            <div class="tourney-round-header">
              <span>Round ${r.round}</span>
              <span>${isDone ? '✅ Complete' : (isCurrent ? '⚔️ Up Next' : '⏳ Pending')}</span>
            </div>
            ${matchesHtml}
          </div>
        `;
      }).join('');

      if (!isMon) {
        const daysLeft = 7 - this.getCurrentDayIndex();
        actionBtn.disabled = true;
        actionBtn.textContent = `🔒 Opens Monday (in ${daysLeft}d)`;
      } else if (tourney.completed || doneToday) {
        actionBtn.disabled = true;
        actionBtn.textContent = '✅ Completed Today (Next Monday)';
      } else if (nextOpp && nextRoundObj) {
        actionBtn.disabled = false;
        actionBtn.textContent = `⚔️ Play Round ${nextRoundObj.round} vs. ${nextOpp.name}`;
      } else {
        actionBtn.disabled = true;
        actionBtn.textContent = 'Completed';
      }
    }

    /** Launch the next playable Arena match in Monday's Oakhaven Central Park Round Robin. */
    startParkMondayNextMatch() {
      if (!this.isParkMondayTourneyAvailable()) {
        this.renderParkTournamentModal();
        return;
      }
      const tourney = this.getOrCreateParkMondayTourney('chloe');
      if (!tourney || tourney.completed) {
        this.renderParkTournamentModal();
        return;
      }
      const nextRoundObj = tourney.rounds.find(r => r.matches.some(m => m.isPlayerMatch && !m.completed));
      const nextPlayerMatch = nextRoundObj?.matches.find(m => m.isPlayerMatch);
      if (!nextRoundObj || !nextPlayerMatch) {
        this.renderParkTournamentModal();
        return;
      }

      const oppId = nextPlayerMatch.a === 'player' ? nextPlayerMatch.b : nextPlayerMatch.a;
      const participants = this.getParkTourneyParticipants();
      const oppMeta = participants.find(p => p.id === oppId);
      const npcRef = oppId === 'chloe' ? this.chloeNpc : (oppId === 'rowan' ? this.rowanNpc : this.jasperNpc);
      const challenger = {
        ...(npcRef || { id: oppId, name: oppMeta?.name || oppId }),
        id: oppId,
        name: oppMeta?.name || oppId,
        tournamentContext: {
          type: 'park_monday_rr',
          round: nextRoundObj.round,
          opponentId: oppId,
          dayNumber: tourney.dayNumber
        }
      };

      this.toggleParkTournamentModal(false);
      this.closeDialogue();
      this.triggerDuel(challenger, 'standard_10x8', null, oppMeta?.team || null);
    }

    /** Build the shared Monday Central Park tournament dialogue option for Chloe, Rowan, and Jasper. */
    getParkTourneyDialogueOption(npcId, npcName) {
      if (this.isMondayToday()) {
        if (this.isParkMondayTourneyCompletedToday()) {
          return {
            label: `1. 🏆 "View today's Monday Park Tournament results"`,
            primary: true,
            reply: `<b>${npcName}:</b> "That was a blast of a Monday Round Robin! Here are today's official Park standings — see you next Monday!"`,
            onSelect: (tEl) => {
              tEl.innerHTML = `<b>${npcName}:</b> "That was a blast of a Monday Round Robin! Here are today's official Park standings — see you next Monday!"`;
              this.toggleParkTournamentModal(true);
            }
          };
        }
        const inProgress = this.activeParkTourney && this.activeParkTourney.dayNumber === (this.dayNumber || 1) && !this.activeParkTourney.completed;
        const roundNum = inProgress ? (this.activeParkTourney.currentRound || 1) : 1;
        return {
          label: inProgress
            ? `1. 🏆 "Resume Monday Park Tournament (Round ${roundNum}/3)"`
            : `1. 🏆 "Start Monday Park Round Robin ($10 / $5 Prizes)"`,
          primary: true,
          onSelect: () => {
            this.openParkTournamentFromDialogue(npcId);
          }
        };
      }

      const daysLeft = 7 - this.getCurrentDayIndex();
      return {
        label: `4. 🏆 "Tell me about the Monday Park Tournament"`,
        onSelect: (tEl) => {
          tEl.innerHTML = `<b>${npcName}:</b> "Every <b>Monday</b> right here in Oakhaven Central Park, Rowan, Chloe, Jasper, and you play a casual 4-player <b>Round Robin</b>! Winner takes <b>$10.00</b> and 2nd place wins <b>$5.00</b> — redoable once every Monday! Come back in <b>${daysLeft} day${daysLeft > 1 ? 's' : ''}</b> (Monday) and talk to any of us to kick off!"`;
        }
      };
    }

    onReturnFromBattle(challenger) {
      if (challenger?.tournamentContext?.type === 'park_monday_rr') {
        this.syncParkNpcBubbles();
        this.updateFreeRoamPrompt();
        this.toggleParkTournamentModal(true);
        return;
      }
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

    consolidateBinderStacks() {
      if (!Array.isArray(this.binderSlots)) return false;
      const seenByKey = new Map();
      let changed = false;

      for (let i = 0; i < this.binderSlots.length; i++) {
        const slot = this.binderSlots[i];
        if (!slot) continue;
        const key = slot.beastId || slot.id;
        if (!key) continue;

        if (seenByKey.has(key)) {
          const targetSlot = seenByKey.get(key);
          targetSlot.qty = (targetSlot.qty || 1) + (slot.qty || 1);
          this.binderSlots[i] = null;
          changed = true;
        } else {
          if (!slot.qty || slot.qty < 1) {
            slot.qty = 1;
            changed = true;
          }
          seenByKey.set(key, slot);
        }
      }

      return changed;
    }

    renderBinderModal() {
      if (this.consolidateBinderStacks()) {
        this.saveWorldData(this.draftAppearance);
      }
      const gridEl = document.getElementById('binder-slots-grid');
      const counterPill = document.getElementById('binder-counter-pill');
      const binderBadgeEl = document.getElementById('binder-badge-count');
      const deckBadgeEl = document.getElementById('deck-badge-count');
      if (deckBadgeEl) {
        deckBadgeEl.textContent = String((this.playingDeck || []).length);
      }

      const slottedCount = this.getSlottedBinderCount();
      if (counterPill) {
        counterPill.textContent = `${slottedCount} / 9 Sleeves Filled`;
      }
      if (binderBadgeEl) {
        binderBadgeEl.textContent = String(slottedCount);
      }
      if (!gridEl) return;

      const sortMode = this.binderSortBy || 'default';
      document.querySelectorAll('#binder-sort-bar .binder-sort-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.sort || 'default') === sortMode);
      });

      const getSortMeta = (card) => {
        const cleanId = String(card.beastId || card.id || '').toLowerCase().replace('card_', '').trim();
        const gwentDef = window.MythosGwentCards?.CARDS?.[cleanId];
        const creatureDef = gwentDef ? null : this.getCreatureData?.(cleanId);
        const name = (card.shortName || card.name || '').toLowerCase();
        const type = String(gwentDef?.role || card.element || creatureDef?.element || 'zz').toLowerCase();
        const power = Number(
          gwentDef?.basePower ??
          (typeof creatureDef?.skills?.atk1?.dmg === 'number' ? creatureDef.skills.atk1.dmg : 0)
        ) || 0;
        const stars = Number(gwentDef?.stars ?? card.stars ?? creatureDef?.stars ?? 0) || 0;
        return { name, type, power, stars };
      };

      let entries = Array.from({ length: 9 }, (_, i) => ({
        slotIndex: i,
        card: this.binderSlots[i]
      }));

      if (sortMode !== 'default') {
        const filled = entries.filter(e => Boolean(e.card));
        const empty = entries.filter(e => !e.card);
        filled.sort((a, b) => {
          const ma = getSortMeta(a.card);
          const mb = getSortMeta(b.card);
          if (sortMode === 'alpha') return ma.name.localeCompare(mb.name);
          if (sortMode === 'type') return ma.type.localeCompare(mb.type) || ma.name.localeCompare(mb.name);
          if (sortMode === 'power') return (mb.power - ma.power) || ma.name.localeCompare(mb.name);
          if (sortMode === 'stars') return (mb.stars - ma.stars) || ma.name.localeCompare(mb.name);
          return a.slotIndex - b.slotIndex;
        });
        entries = [...filled, ...empty];
      }

      gridEl.innerHTML = '';

      entries.forEach(({ slotIndex: i, card }) => {
        const slotEl = document.createElement('div');

        if (card) {
          const qty = card.qty || 1;
          slotEl.className = 'binder-slot slotted';
          slotEl.innerHTML = `
            <div class="binder-card-thumb-wrap" style="position:relative;">
              <img src="${card.cardImg}" alt="${card.name}" class="binder-card-thumb-img">
              ${qty > 1 ? `<span class="binder-qty-badge">x${qty}</span>` : ''}
            </div>
            <div class="binder-card-info-row">
              <span class="binder-card-name">${card.shortName || card.name}${qty > 1 ? ` <b style="color:#fde68a;">(x${qty})</b>` : ''}</span>
              <span class="binder-card-element-pill ${card.element?.toLowerCase() || 'fire'}">${card.element || 'Beast'}</span>
            </div>
            <div class="binder-slot-hover-bar">
              <button type="button" class="binder-slot-btn add-deck" title="Quick add to Playing Deck">🃏 + Deck</button>
              <button type="button" class="binder-slot-btn inspect">🔍 Inspect</button>
              <button type="button" class="binder-slot-btn remove">📤 To Inventory</button>
            </div>
          `;

          // Clicking anywhere on the card or the inspect button opens Creature Inspect Mode!
          slotEl.addEventListener('click', (ev) => {
            if (ev.target.closest('.binder-slot-btn.remove') || ev.target.closest('.binder-slot-btn.add-deck')) return;
            if (window.sounds?.playClick) window.sounds.playClick();
            this.openCreatureInspect(card, i);
          });

          const addDeckBtn = slotEl.querySelector('.binder-slot-btn.add-deck');
          if (addDeckBtn) {
            addDeckBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const cardId = card.beastId || (card.id?.startsWith('card_') ? card.id.replace('card_', '') : null);
              if (cardId) {
                const res = this.addCardToPlayingDeck(cardId);
                const hintEl = document.querySelector('#binder-modal .binder-hint');
                if (hintEl && res?.message) {
                  hintEl.innerHTML = res.message;
                }
              }
            });
          }

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
      });
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

    // Insert a single card from Inventory into a designated binder slot (stacks identical cards)
    insertCardIntoBinder(cardId, targetSlotIndex = null) {
      const invIndex = this.inventory.findIndex(i => i.id === cardId && i.qty > 0);
      if (invIndex === -1) return;

      const item = this.inventory[invIndex];
      const existingSlotIndex = this.binderSlots.findIndex(
        s => s && (s.id === cardId || (item.beastId && s.beastId === item.beastId))
      );
      let destIndex = existingSlotIndex !== -1 ? existingSlotIndex : targetSlotIndex;
      if (destIndex === null || destIndex === undefined || destIndex < 0 || destIndex >= 9) {
        destIndex = this.binderSlots.findIndex(s => !s);
      }
      if (destIndex === -1) {
        alert('All 9 binder sleeves are full! Remove a card to make room.');
        return;
      }

      // Remove 1 quantity from inventory
      item.qty -= 1;
      if (item.qty <= 0) {
        this.inventory.splice(invIndex, 1);
      }

      // Stack into existing matching sleeve or slip into empty binder sleeve
      if (existingSlotIndex !== -1) {
        const existing = this.binderSlots[existingSlotIndex];
        existing.qty = (existing.qty || 1) + 1;
      } else {
        this.binderSlots[destIndex] = {
          id: item.id,
          beastId: item.beastId || item.id.replace('card_', ''),
          name: item.name,
          shortName: item.shortName || item.name,
          element: item.element || 'Fire',
          stars: item.stars || 4,
          qty: 1,
          cardImg: item.cardImg,
          desc: item.desc || ''
        };
      }

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

    // -------------------------------------------------------------------------
    // Playing Deck Builder (Deck Taken Into Battles)
    // -------------------------------------------------------------------------
    getOwnedMythosCardPool() {
      const reg = window.MythosGwentCards?.CARDS || {};
      const counts = {};
      const addCount = (cardId, qty = 1) => {
        if (!cardId || !reg[cardId] || reg[cardId].isToken) return;
        counts[cardId] = (counts[cardId] || 0) + qty;
      };
      (this.inventory || []).forEach(item => {
        if (item.type === 'mythos_card' || item.id?.startsWith('card_')) {
          const cid = item.beastId || item.id?.replace('card_', '');
          addCount(cid, item.qty || 1);
        }
      });
      (this.binderSlots || []).forEach(slot => {
        if (slot) {
          const cid = slot.beastId || slot.id?.replace('card_', '');
          addCount(cid, slot.qty || 1);
        }
      });
      return counts;
    }

    addCardToPlayingDeck(cardId) {
      const reg = window.MythosGwentCards?.CARDS || {};
      const cardDef = reg[cardId];
      if (!cardDef || cardDef.isToken) {
        if (window.sounds?.playClick) window.sounds.playClick();
        return { ok: false, message: '⚠️ Only Mythos battle cards can be added to the Playing Deck.' };
      }

      const inDeckCount = (this.playingDeck || []).filter(id => id === cardId).length;
      const maxPerDeck = cardDef?.maxDeckCopies ?? (cardId === 'manson_wolf_father' ? 1 : 3);
      if (inDeckCount >= maxPerDeck) {
        if (window.sounds?.playClick) window.sounds.playClick();
        return { ok: false, message: `⚠️ Limit reached: ${cardDef.name} is limited to ${maxPerDeck} copy/copies per deck.` };
      }

      this.playingDeck.push(cardId);
      if (window.sounds?.playCardFlipReveal) {
        window.sounds.playCardFlipReveal(cardDef.rarity === 'gold');
      } else if (window.sounds?.playClick) {
        window.sounds.playClick();
      }
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderPlayingDeckModal();
      return { ok: true, message: `✅ Added <b>${cardDef.name}</b> to your Playing Deck (${this.playingDeck.length} cards).` };
    }

    removeCardFromPlayingDeck(index) {
      if (index < 0 || index >= (this.playingDeck || []).length) return;
      const [removedId] = this.playingDeck.splice(index, 1);
      if (window.sounds?.playClick) window.sounds.playClick();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderPlayingDeckModal();
      const cardDef = window.MythosGwentCards?.CARDS?.[removedId];
      const statusEl = document.getElementById('playing-deck-status');
      if (statusEl && cardDef) {
        statusEl.textContent = `Removed ${cardDef.name} from Playing Deck.`;
      }
    }

    clearPlayingDeck() {
      this.playingDeck = [];
      if (window.sounds?.playClick) window.sounds.playClick();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderPlayingDeckModal();
      const statusEl = document.getElementById('playing-deck-status');
      if (statusEl) statusEl.textContent = 'Playing Deck cleared (battles will use the Standard Deck until cards are added).';
    }

    autoFillPlayingDeck() {
      const std = window.MythosGwentCards?.getDeckRecipe?.('standard') || [];
      this.playingDeck = [...std];
      if (window.sounds?.playCardFlipReveal) window.sounds.playCardFlipReveal(false);
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderPlayingDeckModal();
      const statusEl = document.getElementById('playing-deck-status');
      if (statusEl) statusEl.textContent = `Loaded Standard Deck (${this.playingDeck.length} cards).`;
    }

    togglePlayingDeckModal(forceOpen) {
      const modal = document.getElementById('playing-deck-modal');
      if (!modal) return;
      const shouldOpen = forceOpen !== undefined ? forceOpen : modal.classList.contains('hidden');
      if (window.sounds?.playClick) window.sounds.playClick();
      if (shouldOpen) {
        this.renderPlayingDeckModal();
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    renderPlayingDeckModal() {
      const countPill = document.getElementById('playing-deck-count-pill');
      const currentList = document.getElementById('playing-deck-current-list');
      const poolList = document.getElementById('playing-deck-pool-list');
      const statusEl = document.getElementById('playing-deck-status');
      const reg = window.MythosGwentCards?.CARDS || {};

      if (countPill) {
        countPill.textContent = `${(this.playingDeck || []).length} Cards`;
      }
      if (!currentList || !poolList) return;

      const attachThumbLongPress = (imgEl, cardDef) => {
        if (!imgEl || !cardDef) return;
        imgEl.title = 'Hold click (or right-click) for full card details';
        let holdTimer = null;
        const cancelHold = () => {
          if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
          }
        };
        imgEl.addEventListener('pointerdown', (e) => {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          cancelHold();
          holdTimer = setTimeout(() => {
            holdTimer = null;
            if (window.sounds?.playClick) window.sounds.playClick();
            window.game?.openCardModal?.(cardDef);
          }, 350);
        });
        imgEl.addEventListener('pointerup', cancelHold);
        imgEl.addEventListener('pointerleave', cancelHold);
        imgEl.addEventListener('pointercancel', cancelHold);
        imgEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          if (window.sounds?.playClick) window.sounds.playClick();
          window.game?.openCardModal?.(cardDef);
        });
      };

      currentList.innerHTML = '';
      if (!this.playingDeck || this.playingDeck.length === 0) {
        currentList.innerHTML = `<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">Your Playing Deck is empty. Add cards from the right (or from your Binder), or click <b>✨ Fill Standard</b>.</div>`;
      } else {
        const grouped = [];
        const groupMap = {};
        this.playingDeck.forEach((cid, idx) => {
          if (!groupMap[cid]) {
            groupMap[cid] = { cid, count: 0, lastIndex: idx };
            grouped.push(groupMap[cid]);
          }
          groupMap[cid].count += 1;
          groupMap[cid].lastIndex = idx;
        });

        grouped.forEach(entry => {
          const c = reg[entry.cid];
          if (!c) return;
          const row = document.createElement('div');
          row.className = 'playing-deck-row';
          row.innerHTML = `
            <img src="${c.cardImg}" alt="${c.name}" class="playing-deck-thumb">
            <div class="playing-deck-row-info">
              <div class="playing-deck-row-name">${c.name}${entry.count > 1 ? `<span class="playing-deck-qty-badge">x${entry.count}</span>` : ''}</div>
              <div class="playing-deck-row-meta">${'★'.repeat(c.stars || 1)} ${c.role || 'Unit'} • ${c.basePower} PWR${c.armor > 0 ? ` • 🛡️${c.armor}` : ''}</div>
            </div>
            <button type="button" class="ui-btn secondary" style="padding: 4px 8px; font-size: 11px;">➖ Remove</button>
          `;
          row.querySelector('button')?.addEventListener('click', () => this.removeCardFromPlayingDeck(entry.lastIndex));
          attachThumbLongPress(row.querySelector('.playing-deck-thumb'), c);
          currentList.appendChild(row);
        });
      }

      poolList.innerHTML = '';
      const ownedCounts = this.getOwnedMythosCardPool();
      const ownedIds = Object.keys(ownedCounts);
      if (ownedIds.length === 0) {
        poolList.innerHTML = `<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">No Mythos cards in your Backpack or Binder yet. Open Booster Packs at Leo's Card Shop!</div>`;
      } else {
        ownedIds.forEach(cid => {
          const c = reg[cid];
          if (!c) return;
          const inDeck = (this.playingDeck || []).filter(id => id === cid).length;
          const maxPerDeck = c?.maxDeckCopies ?? (cid === 'manson_wolf_father' ? 1 : 3);
          const row = document.createElement('div');
          row.className = 'playing-deck-row';
          row.innerHTML = `
            <img src="${c.cardImg}" alt="${c.name}" class="playing-deck-thumb">
            <div class="playing-deck-row-info">
              <div class="playing-deck-row-name">${c.name} <span style="color:#fbbf24;">(Owned: ${ownedCounts[cid]})</span></div>
              <div class="playing-deck-row-meta">${'★'.repeat(c.stars || 1)} ${c.role || 'Unit'} • ${c.basePower} PWR • In Deck: ${inDeck}/${maxPerDeck}</div>
            </div>
            <button type="button" class="ui-btn primary-btn" style="padding: 4px 8px; font-size: 11px;" ${inDeck >= maxPerDeck ? 'disabled' : ''}>➕ Add</button>
          `;
          row.querySelector('button')?.addEventListener('click', () => {
            const res = this.addCardToPlayingDeck(cid);
            if (statusEl && res?.message) statusEl.innerHTML = res.message;
          });
          attachThumbLongPress(row.querySelector('.playing-deck-thumb'), c);
          poolList.appendChild(row);
        });
      }
    }

    // Remove a single card from the binder and return it to backpack inventory
    removeCardFromBinder(slotIndex) {
      if (slotIndex < 0 || slotIndex >= 9) return;
      const card = this.binderSlots[slotIndex];
      if (!card) return;

      const remaining = (card.qty || 1) - 1;
      if (remaining > 0) {
        card.qty = remaining;
      } else {
        this.binderSlots[slotIndex] = null;
      }

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

      if (hpVal) hpVal.textContent = beast.isMythosCard ? `${beast.maxHp} PWR` : `${beast.maxHp} HP`;
      if (moveVal) moveVal.textContent = beast.isMythosCard ? `${beast.baseMove} Row` : `${beast.baseMove} Tiles / Turn`;
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
    // Theatrical & Suspenseful Booster Pack Opening Ritual (5 Cards Per Pack)
    // -------------------------------------------------------------------------
    rollFivePackCards() {
      const mythosPool = this.getMythosPackCatalog();
      const catalog = mythosPool.length > 0 ? mythosPool : this.getBaseSetCardCatalog();
      // Shuffle a copy of the Mythos catalog and draw 5 cards for this Booster Pack
      const pool = [...catalog];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const drawn = pool.slice(0, 5).map(c => ({ ...c }));
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

    rollThreePackCards() {
      return this.rollFivePackCards();
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
        pulledCards: this.rollFivePackCards(),
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
      if (titleEl) titleEl.textContent = '✨ ALL 5 CARDS PULLED! ✨';
      if (subEl) subEl.innerHTML = 'All 5 Mythos Cards unsealed! Collect them to add them to your backpack inventory:';

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
      this.phoneListingsBought = [];
      this.phoneListingsSold = [];
      this.scheduledMeetups = [];
      this.registeredTournaments = [];
      this.lastParkTourneyCompletedDay = 0;
      this.activeParkTourney = null;
      this.syncParkNpcBubbles?.();
      this.phoneChatHistories = {};
      this.activeNegotiation = null;
      this.phoneUnreadShop = true;
      this.updateMeetupBadgeCount?.();
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

    getFriendNpc() {
      return this.npcs.find(n => n.id === 'best_friend' || n.id === 'friend') || this.npcs[0];
    }

    clearPendingBattleResults() {
      this.plutoBattleResult = null;
      this.novaBattleResult = null;
      this.silasBattleResult = null;
      this.mayaBattleResult = null;
      this._leoRecentPackPurchase = false;
    }

    isNpc(interactable) {
      if (!interactable) return false;
      if (interactable.isMeetupVisitor) return true;
      const id = interactable.id;
      if (typeof id === 'string' && id.startsWith('meetup_')) return true;
      const friend = this.getFriendNpc();
      return id === 'friend' || id === 'best_friend' || id === 'friend_duel' || id === 'mom' || id === 'shopkeeper' || id === 'pluto' || id === 'nova' || id === 'silas' || id === 'maya' || id === 'chloe' || id === 'rowan' || id === 'jasper' || interactable === friend || interactable === this.shopkeeperNpc || interactable === this.plutoNpc || interactable === this.novaNpc || interactable === this.silasNpc || interactable === this.mayaNpc || interactable === this.chloeNpc || interactable === this.rowanNpc || interactable === this.jasperNpc;
    }

    startTalkingToNpc(npcId) {
      if (window.sounds?.playClick) window.sounds.playClick();
      this.clearClickMoveTarget();
      const friend = this.getFriendNpc();
      const actualId = (npcId === 'friend' || npcId === 'best_friend' || npcId === this.friendName || (friend && npcId === friend.id))
        ? (this.currentArea === 'friend_interior' ? 'friend_duel' : 'friend')
        : npcId;

      if (this.activeDialogueNpc && this.activeDialogueNpc !== actualId) {
        this.clearPendingBattleResults();
      }
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
      this._justCompletedMeetup = null;
      this.clearPendingBattleResults();
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
      const friendName = this.getFriendNpc()?.name || this.friendName || 'Mike';
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

    renderNpcChoicePrompt({
      npcId,
      altActiveIds = null,
      promptKey,
      speakerText,
      speakerClass = 'ow-speaker-tag friend',
      talkPromptHtml,
      greetingHtml,
      choices = [],
      challengeText = '👋 Leave (Space)',
      showChallenge = true,
      topPosition = false
    }) {
      const bar = document.getElementById('ow-dialog-bar');
      const speakerEl = document.getElementById('ow-speaker-tag');
      const textEl = document.getElementById('ow-dialog-text');
      const choicesEl = document.getElementById('ow-choices-container');
      const challengeBtn = document.getElementById('ow-btn-challenge');
      if (!bar || !speakerEl || !textEl || !choicesEl || !challengeBtn) return;

      bar.classList.remove('hidden', 'tv-broadcast');
      bar.classList.toggle('top-position', !!topPosition);
      speakerEl.textContent = speakerText;
      speakerEl.className = speakerClass;

      const isActive = this.activeDialogueNpc === npcId
        || (Array.isArray(altActiveIds) && altActiveIds.includes(this.activeDialogueNpc));

      if (isActive) {
        challengeBtn.classList.remove('ow-talk-btn');
        if (this.lastShopPromptKey !== promptKey) {
          this.lastShopPromptKey = promptKey;
          choicesEl.innerHTML = '';
          textEl.innerHTML = greetingHtml;
          choices.forEach((choice) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `ow-choice-btn${choice.primary ? ' primary' : ''}`;
            btn.innerHTML = choice.label;
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              if (!choice.silentClick && window.sounds?.playClick) {
                window.sounds.playClick();
              }
              if (choice.onSelect) choice.onSelect(textEl, btn);
            });
            choicesEl.appendChild(btn);
          });
        }
        choicesEl.classList.toggle('hidden', choicesEl.children.length === 0);
        challengeBtn.textContent = challengeText;
        challengeBtn.classList.toggle('hidden', !showChallenge);
      } else {
        this.lastShopPromptKey = null;
        choicesEl.classList.add('hidden');
        textEl.innerHTML = talkPromptHtml;
        challengeBtn.textContent = '💬 Talk (Space)';
        challengeBtn.classList.add('ow-talk-btn');
        challengeBtn.classList.remove('hidden');
      }
    }

    getMeetupChoiceObjectsForNpc(npcId, area, dialogueNpcId = npcId) {
      if (this.storyState !== 'free_roam') {
        return { choices: [], keySuffix: '', greetingOverride: null };
      }
      const curDay = this.dayNumber || 1;
      const todayMeetups = this.getScheduledMeetupsForNpc(npcId, area, curDay);
      const otherDayMeetups = (this.scheduledMeetups || []).filter(m =>
        m.status === 'scheduled' &&
        m.npcId === npcId &&
        m.area === area &&
        m.scheduledDay !== curDay
      );

      const justDone = this._justCompletedMeetup;
      const showDoneBanner = !!(
        justDone &&
        justDone.meetup.npcId === npcId &&
        justDone.meetup.area === area &&
        (this.activeDialogueNpc === dialogueNpcId || this.activeDialogueNpc === npcId)
      );

      const choices = todayMeetups.map(m => {
        const isBuy = m.type === 'buy';
        const priceTxt = `${isBuy ? '' : '+'}${this.formatMoney(m.agreedPrice)}`;
        return {
          label: `🤝 Meetup Trade: ${isBuy ? 'Buy' : 'Sell'} ${m.cardName} (${priceTxt})`,
          primary: true,
          onSelect: (el) => {
            const res = this.completeScheduledMeetup(m.id);
            if (res.ok) {
              this.lastShopPromptKey = null;
              this.updateFreeRoamPrompt();
            } else {
              el.innerHTML = `<b>${m.npcName}:</b> "${res.message}"`;
            }
          }
        };
      });

      otherDayMeetups.forEach(m => {
        const isFuture = m.scheduledDay > curDay;
        choices.push({
          label: `📅 Meetup Info: ${m.cardName} (${isFuture ? `Day ${m.scheduledDay}` : `Missed Day ${m.scheduledDay}`})`,
          onSelect: (el) => {
            el.innerHTML = isFuture
              ? `<b>${m.npcName}:</b> "Our meetup for <b>${m.cardName}</b> is set for <b>Day ${m.scheduledDay}</b>! Come back on Day ${m.scheduledDay} (or reschedule in Card Exchange)."`
              : `<b>${m.npcName}:</b> "Looks like Day ${m.scheduledDay} already passed! Open Card Exchange -> Meetups on your phone to reschedule our <b>${m.cardName}</b> trade."`;
          }
        });
      });

      const keySuffix = [
        todayMeetups.map(m => m.id).join(','),
        otherDayMeetups.map(m => `${m.id}:${m.scheduledDay}`).join(','),
        showDoneBanner ? `done_${justDone.meetup.id}` : ''
      ].filter(Boolean).join('|');

      return {
        choices,
        keySuffix: keySuffix ? `_${keySuffix}` : '',
        greetingOverride: showDoneBanner
          ? `<b>${justDone.meetup.npcName}:</b> "${justDone.message}"`
          : null
      };
    }

    tryRenderMeetupVisitorPrompt({ maxDist = 1.85, topPosition = false } = {}) {
      if (this.storyState !== 'free_roam') return false;
      const justDone = this._justCompletedMeetup;
      if (justDone && justDone.meetup.area === this.currentArea && justDone.meetup.venueType !== 'npc_house') {
        const jm = justDone.meetup;
        const pos = jm.meetupPos || this.getMeetupTargetDetails(jm.npcId, jm.venueType, jm.landmarkId).meetupPos;
        if (pos && Math.hypot(this.player.x - pos.x, this.player.y - pos.y) < maxDist + 0.4) {
          const visitorNpc = {
            id: `meetup_${jm.id}`,
            meetupId: jm.id,
            isMeetupVisitor: true,
            npcId: jm.npcId,
            name: jm.npcName,
            x: pos.x,
            y: pos.y
          };
          this.nearInteractable = visitorNpc;
          this.renderNpcChoicePrompt({
            npcId: visitorNpc.id,
            promptKey: `meetup_done_${jm.id}`,
            speakerText: `🤝 ${jm.npcName.toUpperCase()} — MEETUP COMPLETE`,
            talkPromptHtml: `<b>${jm.npcName}</b> finished trading with you.`,
            greetingHtml: `<b>${jm.npcName}:</b> "${justDone.message}"`,
            choices: [
              {
                label: `👋 "Thanks, ${jm.npcName}! See you around!"`,
                primary: true,
                onSelect: () => this.closeDialogue()
              }
            ],
            challengeText: '👋 Leave (Space)',
            topPosition
          });
          return true;
        }
        this._justCompletedMeetup = null;
      }

      const visitors = this.getActiveMeetupVisitorsForArea(this.currentArea);
      if (visitors.length === 0) return false;
      let nearest = null;
      let bestDist = Infinity;
      visitors.forEach(v => {
        const d = Math.hypot(this.player.x - v.x, this.player.y - v.y);
        if (d < bestDist) {
          bestDist = d;
          nearest = v;
        }
      });
      if (!nearest || bestDist >= maxDist) return false;

      const m = nearest.meetup;
      const isBuy = m.type === 'buy';
      const priceTxt = `${isBuy ? '' : '+'}${this.formatMoney(m.agreedPrice)}`;
      this.nearInteractable = nearest;

      const venueFlavor = m.venueType === 'player_house'
        ? `<b>${m.npcName}:</b> "Nice living room! Glad I could bring the meetup right to your house (+25% delivery rate)!"`
        : `<b>${m.npcName}:</b> "${m.shortVenueLabel} is such a clean meeting spot! Right on time for Day ${m.scheduledDay}."`;

      this.renderNpcChoicePrompt({
        npcId: nearest.id,
        promptKey: `meetup_vis_${m.id}_${this.gold}_${(this.inventory || []).length}`,
        speakerText: `🤝 ${m.npcName.toUpperCase()} — SCHEDULED MEETUP`,
        talkPromptHtml: `Press <b>Talk</b> to meet <b>${m.npcName}</b> for your <b>${m.cardName}</b> exchange (${priceTxt}).`,
        greetingHtml: `<b>${m.npcName}:</b> "Hey! Thanks for meeting at <b>${m.shortVenueLabel}</b> on Day ${m.scheduledDay}! Ready to ${isBuy ? 'buy' : 'sell'} <b>${m.cardName}</b> for <b>${priceTxt}</b>?"`,
        choices: [
          {
            label: `1. 🤝 Complete Exchange: ${isBuy ? 'Buy' : 'Sell'} ${m.cardName} (${priceTxt})`,
            primary: true,
            onSelect: (el) => {
              const res = this.completeScheduledMeetup(m.id);
              if (res.ok) {
                this.lastShopPromptKey = null;
                this.updateFreeRoamPrompt();
              } else {
                el.innerHTML = `<b>${m.npcName}:</b> "${res.message}"`;
              }
            }
          },
          {
            label: `2. 💬 "Appreciate you meeting at ${m.shortVenueLabel}!"`,
            onSelect: (el) => { el.innerHTML = venueFlavor; }
          },
          {
            label: `3. 👋 "Catch you in a sec! (Leave)"`,
            onSelect: () => this.closeDialogue()
          }
        ],
        challengeText: `🤝 Complete Trade (${priceTxt})`,
        topPosition
      });
      return true;
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
        const friend = this.getFriendNpc();
        const fName = friend?.name || this.friendName || 'Mike';
        const pName = this.draftAppearance?.name || 'Asher';
        const mom = this.npcs.find(n => n.id === 'mom');
        const distToMom = mom ? Math.hypot(this.player.x - mom.x, this.player.y - mom.y) : 999;
        const distToFriend = (friend && !this.friendWaitingAtHouse) ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;
        const distToTv = Math.hypot(this.player.x - 7.3, this.player.y - 4.3);
        const distToBed = Math.hypot(this.player.x - 3.2, this.player.y - 5.3);

        if (this.tryRenderMeetupVisitorPrompt({ maxDist: 1.85, topPosition: this.player.y >= 7.5 })) {
          // Handled player-house meetup visitor
        } else if (mom && distToMom < 1.85) {
          this.nearInteractable = mom;
          const momChoices = !this.hasMomBoosterMoney
            ? [
                {
                  label: `1. 💵 "Mom, could we get $25 for 2 MYTHOS Booster Packs?"`,
                  primary: true,
                  silentClick: true,
                  onSelect: () => this.askMomForBoosterMoney()
                },
                {
                  label: `2. 💼 "How was work today, Mom?"`,
                  onSelect: (el) => {
                    el.innerHTML = `<b>Mom:</b> "Busy as always, sweetheart! Coming home and seeing you and ${fName} so fired up makes it all worth it."`;
                  }
                },
                {
                  label: `3. 👋 "Talk to you in a sec, Mom! (Leave)"`,
                  onSelect: () => this.closeDialogue()
                }
              ]
            : [
                {
                  label: `1. 🗺️ "Which way is Leo's Card Shop again?"`,
                  primary: true,
                  onSelect: (el) => {
                    el.innerHTML = `<b>Mom:</b> "Step out the front door, walk south down the road, and head east past the town square to <b>Leo's Card Shop</b>! With $25 you'll still have $5 left over!"`;
                  }
                },
                {
                  label: `2. 🍳 "What's cooking in the kitchen?"`,
                  onSelect: (el) => {
                    el.innerHTML = `<b>Mom:</b> "Fresh dinner prep! Come back inside and get some rest in your bed upstairs whenever you finish card hunting."`;
                  }
                },
                {
                  label: `3. 👋 "Thanks again, Mom! (Leave)"`,
                  onSelect: () => this.closeDialogue()
                }
              ];

          this.renderNpcChoicePrompt({
            npcId: 'mom',
            promptKey: `mom_interior_${pName}_${fName}_${this.hasMomBoosterMoney}_${this.hasOpenedStarterPack}`,
            speakerText: '💼 MOM',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Mom</b>.`,
            greetingHtml: !this.hasMomBoosterMoney
              ? `<b>Mom:</b> "Hey sweetheart! You and ${fName} look like you're about to burst with excitement. Did you want to ask me something?"`
              : (this.hasOpenedStarterPack
                  ? `<b>Mom:</b> "You pulled 3 MYTHOS cards from Leo's Card Shop? Have fun battling ${fName} next door at his house!"`
                  : `<b>Mom:</b> "Have fun at Leo's Card Shop down the road! You'll still have $5 left over after buying both booster packs with that $25!"`),
            choices: momChoices,
            challengeText: !this.hasMomBoosterMoney ? '💵 Ask Mom for Booster Money ($25)' : '👋 Leave (Space)',
            topPosition: true
          });
        } else if (distToFriend < 1.8) {
          this.nearInteractable = friend;
          if (this.storyState === 'intro_waiting') {
            this.renderNpcChoicePrompt({
              npcId: 'friend',
              altActiveIds: [fName],
              promptKey: `friend_intro_wait_${fName}`,
              speakerText: fName.toUpperCase(),
              talkPromptHtml: `Press <b>Talk</b> to speak with <b>${fName}</b>.`,
              greetingHtml: '',
              choices: [],
              showChallenge: true,
              topPosition: this.player.y >= 7.5 || friend.y >= 7.5
            });
          } else {
            const friendInteriorChoices = !this.hasMomBoosterMoney
              ? [
                  {
                    label: `1. 💵 "Let's ask Mom for $25!"`,
                    primary: true,
                    onSelect: (el) => {
                      el.innerHTML = `<b>${fName}:</b> "Seriously! Walk right over to your Mom and tell her we saw the commercial for MYTHOS Packs!"`;
                    }
                  },
                  {
                    label: `2. 📺 "That Mythos TV commercial was hyped!"`,
                    onSelect: (el) => {
                      el.innerHTML = `<b>${fName}:</b> "Right?! Those Beasts battling across the grid looked unreal — we gotta grab our first packs today!"`;
                    }
                  },
                  {
                    label: `3. 👋 "Wait right here! (Leave)"`,
                    onSelect: () => this.closeDialogue()
                  }
                ]
              : [
                  {
                    label: `1. 🗺️ "Where to next, ${fName}?"`,
                    primary: true,
                    onSelect: (el) => {
                      el.innerHTML = this.hasOpenedStarterPack
                        ? `<b>${fName}:</b> "Head next door to my cottage right east of yours! I've got the Mythos Tabletop Arena waiting!"`
                        : `<b>${fName}:</b> "Step out the front door, head south past the plaza, and walk east along the road straight to <b>Leo's Card Shop</b>!"`;
                    }
                  },
                  {
                    label: `2. 👋 "Let's roll! (Leave)"`,
                    onSelect: () => this.closeDialogue()
                  }
                ];

            this.renderNpcChoicePrompt({
              npcId: 'friend',
              altActiveIds: [fName],
              promptKey: `friend_interior_${fName}_${this.hasMomBoosterMoney}_${this.hasOpenedStarterPack}`,
              speakerText: fName.toUpperCase(),
              talkPromptHtml: `Press <b>Talk</b> to speak with <b>${fName}</b>.`,
              greetingHtml: !this.hasMomBoosterMoney
                ? `<b>${fName}:</b> "Dude, your Mom just got home from work! Go ask her if we can get enough money to buy 2 MYTHOS Booster Packs at Leo's Card Shop!"`
                : (this.hasOpenedStarterPack
                    ? `<b>${fName}:</b> "We both pulled 3 awesome cards from Leo's Card Shop! Let's head next door to my house so we can battle!"`
                    : `<b>${fName}:</b> "YES!! Your Mom gave us $25! That's enough for both $10 packs plus $5 left over! Let's head out the front door to Leo's Card Shop!"`),
              choices: friendInteriorChoices,
              challengeText: '👋 Leave (Space)',
              topPosition: this.player.y >= 7.5 || friend.y >= 7.5
            });
          }
        } else if (distToTv < 1.6) {
          this.lastShopPromptKey = null;
          this.nearInteractable = { id: 'tv', name: 'TV' };
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.remove('hidden');
          bar.classList.add('tv-broadcast');
          speakerEl.textContent = '📺 LIVING ROOM TV';
          speakerEl.className = 'ow-speaker-tag tv';
          textEl.innerHTML = `<i>"🔥 MYTHOS BOOSTER PACKS: Just $5 a pack at Leo's Card Shop! Collect Goblin Soldier, Werewolf Pup, Minerva, Manson & more!"</i>`;
          challengeBtn.classList.add('hidden');
        } else if (distToBed < 1.7) {
          this.lastShopPromptKey = null;
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
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else if (this.currentArea === 'friend_interior') {
        const fName = this.friendName || 'Mike';
        const pName = this.draftAppearance?.name || 'Asher';
        const friend = this.getFriendNpc();
        const distToFriend = friend ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;
        const distToTable = Math.hypot(this.player.x - 5.5, this.player.y - 6.8);

        if (distToFriend < 2.2 || distToTable < 1.85) {
          this.nearInteractable = { id: 'friend_duel', name: fName };
          const friendDuelChoices = this.hasOldCardBinder
            ? [
                {
                  label: `1. ⚔️ "I'm ready for a rematch, ${fName}! Let's battle!"`,
                  primary: true,
                  silentClick: true,
                  onSelect: () => this.triggerDuel(friend)
                },
                {
                  label: `2. 📖 "Open the Old Card Binder (Press B)"`,
                  onSelect: () => this.toggleBinderModal(true)
                },
                {
                  label: `3. 🃏 "How's your deck holding up since our first match?"`,
                  onSelect: (el) => {
                    el.innerHTML = `<b>${fName}:</b> "I've been tweaking my opening placement! If you slot your pulled Beasts into your Old Card Binder, you can mix up your strategy anytime!"`;
                  }
                },
                {
                  label: `4. 👋 "Catch you later, ${fName}! (Leave)"`,
                  onSelect: () => this.closeDialogue()
                }
              ]
            : [
                {
                  label: `1. ⚔️ "I'm ready, ${fName}! Let's battle in MYTHOS!"`,
                  primary: true,
                  silentClick: true,
                  onSelect: () => this.triggerDuel(friend)
                },
                {
                  label: `2. 🃏 "Which Beasts are you bringing to the board?"`,
                  onSelect: (el) => {
                    el.innerHTML = `<b>${fName}:</b> "No peeking until draft phase! Pick your 3 Mythos Beasts wisely—whoever takes me down wins my brother's <b>Old Card Binder</b>!"`;
                  }
                },
                {
                  label: `3. 👋 "Let me get my cards ready first. (Leave)"`,
                  onSelect: () => this.closeDialogue()
                }
              ];

          const friendMeetup = this.getMeetupChoiceObjectsForNpc('friend', 'friend_interior', 'friend_duel');
          this.renderNpcChoicePrompt({
            npcId: 'friend_duel',
            promptKey: `friend_interior_duel_${fName}_${pName}_${this.hasOldCardBinder}${friendMeetup.keySuffix}`,
            speakerText: `⚔️ ${fName.toUpperCase()} — READY TO BATTLE AT ${fName.toUpperCase()}'S HOUSE!`,
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>${fName}</b> at the duel table.`,
            greetingHtml: friendMeetup.greetingOverride || (this.hasOldCardBinder
              ? `<b>${fName}:</b> "That was such an awesome match, ${pName}! How is that <b>Old Card Binder</b> working out for you? You can slot up to 9 cards into it, inspect their standalone art, and test new builds in battle! Want a rematch?!"`
              : `<b>${fName}:</b> "Welcome to my house, ${pName}!! I've got the <b>MYTHOS Tabletop Arena</b> set up right here on my table with the 3 cards I pulled from Leo's pack! Defeat me and I'll give you my brother's <b>Old Card Binder</b>! Ready to battle?!"`),
            choices: [...friendMeetup.choices, ...friendDuelChoices],
            challengeText: this.hasOldCardBinder ? `⚔️ Rematch ${fName}!` : `⚔️ Battle ${fName}!`
          });
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

        if (this.tryRenderMeetupVisitorPrompt({ maxDist: 1.75 })) {
          // Handled Leo's Card Shop landmark meetup visitor
        } else if (distToKeeper < 1.9) {
          this.nearInteractable = { id: 'shopkeeper', name: 'Shopkeeper Leo' };
          if (!this.hasBoughtCardShopPacks) {
            const hasMoney = (this.gold || 0) >= 20;
            this.renderNpcChoicePrompt({
              npcId: 'shopkeeper',
              promptKey: `keeper_intro_${hasMoney}_${pName}_${fName}`,
              speakerText: "🃏 SHOPKEEPER LEO — LEO'S CARD SHOP",
              speakerClass: 'ow-speaker-tag tv',
              talkPromptHtml: `Press <b>Talk</b> to speak with <b>Shopkeeper Leo</b> across the counter.`,
              greetingHtml: `"Welcome to <b>Leo's Card Shop</b>, ${pName} and ${fName}!! Have you seen the new <b>MYTHOS</b> game?! It's unbelievable — elemental Beasts, tactical grid movement, and high-impact abilities! Every duelist in town is losing their minds over the Base Set!"`,
              choices: [
                hasMoney
                  ? {
                      label: `1. 💬 "Buy 2 MYTHOS Base Set Booster Packs ($20)" — one for me and ${fName}!`,
                      primary: true,
                      silentClick: true,
                      onSelect: () => this.buyTwoBoosterPacks()
                    }
                  : {
                      label: `1. 💬 "We want to buy 2 Booster Packs ($20)!" <i>(Need $20)</i>`,
                      primary: true,
                      onSelect: (el) => {
                        el.innerHTML = `<b>Shopkeeper Leo:</b> "Two Base Set packs come to <b>$20</b>! Looks like your wallet has ${this.formatMoney(this.gold || 0)} right now—check in with your Mom back at home first!"`;
                      }
                    },
                {
                  label: `2. ✨ "What makes MYTHOS cards so special, Leo?"`,
                  onSelect: (el) => {
                    el.innerHTML = `<b>Shopkeeper Leo:</b> "Every 1st-Edition Booster Pack holds <b>3 Beast cards</b> — from blazing Phoenixes to soaring Pegasus and armored Golems! Rip them right here at the counter to build your first squad!"`;
                  }
                },
                {
                  label: `3. 👋 "We'll browse around a bit! (Leave)"`,
                  onSelect: () => this.closeDialogue()
                }
              ],
              challengeText: hasMoney ? '💵 Buy 2 Packs ($20)' : '👋 Leave (Space)'
            });
          } else {
            const activeEvent = this.getCurrentDayEvent();
            const packCost = activeEvent?.id === 'weekend_market' ? 8 : 10;
            const hasMoneyForPack = (this.gold || 0) >= packCost;
            const hasUnopenedPack = (this.inventory || []).some(i => i.id === 'unopened_base_pack' && i.qty > 0);
            const looseCardCount = (this.inventory || []).filter(i => i.type === 'mythos_card' && i.qty > 0).reduce((s, i) => s + (i.qty || 0), 0);

            const leoChoices = [
              {
                label: `1. 🛒 "Let's check out your Buy &amp; Sell Counter!"`,
                primary: true,
                onSelect: () => this.toggleShopModal(true)
              },
              hasMoneyForPack
                ? {
                    label: `2. 📦 "Buy a 1st-Edition Base Card Pack (${this.formatMoney(packCost)})!"`,
                    silentClick: true,
                    onSelect: (el) => {
                      if (this.buyBaseCardPack()) {
                        this._leoRecentPackPurchase = true;
                        el.innerHTML = `<b>Shopkeeper Leo:</b> "Added a sealed <b>1st-Edition Mythos Base Card Pack</b> (${this.formatMoney(packCost)}) to your backpack! Ready to rip it open?"`;
                      }
                    }
                  }
                : {
                    label: `2. 📦 "I'd like a Base Card Pack (${this.formatMoney(packCost)})..." <i>(Wallet: ${this.formatMoney(this.gold || 0)})</i>`,
                    onSelect: () => this.toggleShopModal(true, 'buy')
                  }
            ];
            let nextNum = 3;
            if (looseCardCount > 0) {
              leoChoices.push({
                label: `${nextNum++}. 💵 "Sell cards from my backpack (${looseCardCount} available)"`,
                onSelect: () => this.toggleShopModal(true, 'sell')
              });
            }
            if (hasUnopenedPack) {
              leoChoices.push({
                label: `${nextNum++}. ✨ "Rip open my Mythos Base Card Pack right here!"`,
                onSelect: () => this.startBoosterPackOpening('unopened_base_pack')
              });
            }
            leoChoices.push({
              label: `${nextNum}. 👋 "Thanks, Leo! (Leave)"`,
              onSelect: () => this.closeDialogue()
            });

            this.renderNpcChoicePrompt({
              npcId: 'shopkeeper',
              promptKey: `keeper_unlocked_${hasMoneyForPack}_${packCost}_${hasUnopenedPack}_${looseCardCount}_${this._leoRecentPackPurchase ? 1 : 0}_${pName}_${fName}`,
              speakerText: "🃏 SHOPKEEPER LEO — LEO'S CARD SHOP",
              speakerClass: 'ow-speaker-tag tv',
              talkPromptHtml: `Press <b>Talk</b> to speak with <b>Shopkeeper Leo</b> across the counter.`,
              greetingHtml: this._leoRecentPackPurchase
                ? `<b>Shopkeeper Leo:</b> "Added a sealed <b>1st-Edition Mythos Base Card Pack</b> (${this.formatMoney(packCost)}) to your backpack! Want to rip it open right here or grab another?"`
                : `"Welcome back to the counter, ${pName}! Now that you and ${fName} have your starter packs, feel free to use our <b>Buy &amp; Sell Counter</b>: grab more 1st-Edition <b>Mythos Base Card Packs for ${this.formatMoney(packCost)}</b>, or trade in extra cards from your backpack for cash (10¢ for 1★ up to 50¢ for 4★)!"`,
              choices: leoChoices,
              challengeText: '🛒 Buy & Sell Counter (Space)'
            });
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
          textEl.innerHTML = `Rows of gleaming foil <b>MYTHOS Base Set Booster Packs</b> ($5 each, 5 Cards per pack) and collector starter boxes line the shelves of <b>Leo's Card Shop</b>.`;
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
          this.clearPendingBattleResults();
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
          const hasDollar = (this.gold || 0) >= 1.00;
          const res = this.plutoBattleResult;
          const plutoChoices = [
            hasDollar
              ? {
                  label: `1. ⚔️ "You're on, Pluto! Let's battle in MYTHOS for $1.00!"`,
                  primary: true,
                  silentClick: true,
                  onSelect: () => this.triggerDuel(this.plutoNpc)
                }
              : {
                  label: `1. ⚔️ "Let's battle for $1.00!" <i>(Need $1.00 — Wallet: ${this.formatMoney(this.gold || 0)})</i>`,
                  primary: true,
                  onSelect: (el) => {
                    el.innerHTML = `<b>Pluto:</b> "Looks like you don't have $1.00 on you right now! <i>(Wallet: ${this.formatMoney(this.gold || 0)})</i> Go sell an extra card to Shopkeeper Leo down the road or ask Mom for allowance first, then come back!"`;
                  }
                }
          ];
          let optNum = 2;
          plutoChoices.push(
            {
              label: `${optNum++}. 💻 "What are you researching on your computer?"`,
              onSelect: (el) => {
                el.innerHTML = `<b>Pluto:</b> "I have Leo's Card Shop catalog open and a spreadsheet of Beast stats! Phoenix has 120 HP with 30-damage Flaming Talons, while Earth Golem has a massive 200 HP pool. Ready to test your deck against mine for $1.00?"`;
              }
            },
            {
              label: `${optNum++}. 🏠 "Your bedroom looks really cozy!"`,
              onSelect: (el) => {
                el.innerHTML = `<b>Pluto:</b> "Thanks! My bed is super comfortable, and I like having my computer desk set up right here in my room. Whenever you want to wager that dollar, let's battle!"`;
              }
            },
            {
              label: `${optNum}. 👋 "Talk later, Pluto! (Leave)"`,
              onSelect: () => this.closeDialogue()
            }
          );

          const plutoGreeting = res === 'won'
            ? `<b>Pluto:</b> "Whoa, amazing match, ${pName}! You completely outplayed my Beasts! Here is your <b>+$1.00</b> stake! Want a rematch for another dollar?"`
            : (res === 'lost'
                ? `<b>Pluto:</b> "Good game, ${pName}! My deck held strong this round! That'll be <b>-$1.00</b> for the wager! Ready to try again and win your dollar back?"`
                : `<b>Pluto:</b> "Hey ${pName}! Welcome to my room! I was just researching Mythos card deck strategies on my computer. How about a tabletop duel right now? Let's set the stakes to <b>$1.00</b> — if you win you get <b>$1.00</b>, and if you lose you lose <b>$1.00</b>! Ready?"`);

          const plutoMeetup = this.getMeetupChoiceObjectsForNpc('pluto', 'pluto_interior');
          this.renderNpcChoicePrompt({
            npcId: 'pluto',
            promptKey: `pluto_dialogue_${pName}_${hasDollar}_${res || 'none'}${plutoMeetup.keySuffix}`,
            speakerText: '💻 PLUTO — BEDROOM COMPUTER DESK',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Pluto</b> at his computer desk.`,
            greetingHtml: plutoMeetup.greetingOverride || plutoGreeting,
            choices: [...plutoMeetup.choices, ...plutoChoices],
            challengeText: hasDollar ? '⚔️ Battle Pluto ($1.00 Wager)' : '💵 Need $1.00 Wager'
          });
        } else if (distToBed < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          const nRes = this.novaBattleResult;
          const novaMeetup = this.getMeetupChoiceObjectsForNpc('nova', 'nova_interior');
          this.renderNpcChoicePrompt({
            npcId: 'nova',
            promptKey: `nova_dialogue_${pName}_${nRes || 'none'}${novaMeetup.keySuffix}`,
            speakerText: '✨ NOVA — STARGAZER OBSERVATORY',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Nova</b> by her brass telescope and star charts.`,
            greetingHtml: novaMeetup.greetingOverride || (nRes === 'won'
              ? `<b>Nova:</b> "Written in the constellations, ${pName}! What brilliant celestial synergy! Here is your <b>$2.00</b> stargazer prize and my <b>Pegasus (Holo)</b> card! Care for another match?"`
              : `<b>Nova:</b> "Greetings, ${pName}! Welcome to my observatory home! The celestial currents are shimmering today. Are you here to study constellation card affinities, or would you like to test your deck in a <b>MYTHOS Tabletop Battle</b>?"`),
            choices: [
              ...novaMeetup.choices,
              {
                label: `1. ⚔️ "Let's battle in MYTHOS, Nova!"`,
                primary: true,
                silentClick: true,
                onSelect: () => this.triggerDuel(this.novaNpc)
              },
              {
                label: `2. 🔭 "What constellations are you tracking today?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Nova:</b> "I am tracking the <b>Pegasus Star Cluster</b>! In MYTHOS lore, aerial beasts gain unmatched flight mobility when the wind stars align. If you pair Pegasus with high-speed tactical moves, your opponent won't be able to pin you down!"`;
                }
              },
              {
                label: `3. ✨ "What strategy do you recommend for deck building?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Nova:</b> "Synergy over brute force! Having both flying agility like <b>Pegasus</b> and raw tank power like <b>Dreadnaught</b> creates tactical balance. Don't be afraid to experiment with different beast pairings!"`;
                }
              },
              {
                label: `4. 👋 "See you under the stars, Nova! (Leave)"`,
                onSelect: () => this.closeDialogue()
              }
            ],
            challengeText: '⚔️ Battle Nova!'
          });
        } else if (distToBed < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          const sRes = this.silasBattleResult;
          const silasMeetup = this.getMeetupChoiceObjectsForNpc('silas', 'silas_interior');
          this.renderNpcChoicePrompt({
            npcId: 'silas',
            promptKey: `silas_dialogue_${pName}_${sRes || 'none'}${silasMeetup.keySuffix}`,
            speakerText: '🪵 SILAS — CRAFTSMAN WORKSHOP',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Silas</b> by his stone hearth and artisan woodworking bench.`,
            greetingHtml: silasMeetup.greetingOverride || (sRes === 'won'
              ? `<b>Silas:</b> "Fine craftsmanship in your maneuvering, ${pName}! Take this <b>$2.00</b> purse and my reinforced <b>Dwarf Warden (Holo)</b> card! Up for another round?"`
              : `<b>Silas:</b> "Welcome, ${pName}! Come warm yourself by the hearth. I've been hand-planing cedar deck boxes all morning. How's your collection looking? Up for a friendly <b>MYTHOS Tabletop Battle</b>?"`),
            choices: [
              ...silasMeetup.choices,
              {
                label: `1. ⚔️ "Let's battle in MYTHOS, Silas!"`,
                primary: true,
                silentClick: true,
                onSelect: () => this.triggerDuel(this.silasNpc)
              },
              {
                label: `2. 🪵 "What are you carving at your workbench?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Silas:</b> "I'm sculpting a miniature <b>Dreadnaught</b> out of heartwood oak! Centuries ago, ancient builders carved colossal stone Dreadnaughts to protect the mountain passes. Their ironclad armor plate remains unmatched!"`;
                }
              },
              {
                label: `3. 🛡️ "Any advice for battling with heavy Beasts?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Silas:</b> "Patience, lad! A heavy tank like Dreadnaught doesn't need to rush across the board. Position your fortress on high ground and let your opponent break their claws against your armor!"`;
                }
              },
              {
                label: `4. 👋 "Catch you by the hearth, Silas! (Leave)"`,
                onSelect: () => this.closeDialogue()
              }
            ],
            challengeText: '⚔️ Battle Silas!'
          });
        } else if (distToBench < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          const mRes = this.mayaBattleResult;
          const mayaMeetup = this.getMeetupChoiceObjectsForNpc('maya', 'maya_interior');
          this.renderNpcChoicePrompt({
            npcId: 'maya',
            promptKey: `maya_dialogue_${pName}_${mRes || 'none'}${mayaMeetup.keySuffix}`,
            speakerText: '🌿 MAYA — BOTANICAL CONSERVATORY',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Maya</b> in her sunlit greenhouse conservatory.`,
            greetingHtml: mayaMeetup.greetingOverride || (mRes === 'won'
              ? `<b>Maya:</b> "Breathtaking tactics, ${pName}! Your beasts flourished like a wild canopy! Come back to the greenhouse anytime for another friendly match!"`
              : `<b>Maya:</b> "Hey ${pName}! Take a deep breath—fresh sweet jasmine and fern moss! I've been cultivating botanicals that nourish earth Beasts. Are you ready for a spirited <b>MYTHOS Tabletop Battle</b>?"`),
            choices: [
              ...mayaMeetup.choices,
              {
                label: `1. ⚔️ "Let's battle in MYTHOS, Maya!"`,
                primary: true,
                silentClick: true,
                onSelect: () => this.triggerDuel(this.mayaNpc)
              },
              {
                label: `2. 🌿 "What species are you researching right now?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Maya:</b> "I am studying spore vitality from the <b>Verdant Guardian</b>'s grove! Earth and nature beasts possess tremendous regenerative stamina. If you anchor your defenses early, nature will outlast any aggressive push!"`;
                }
              },
              {
                label: `3. 🌸 "How do you preserve your foil cards from humidity?"`,
                onSelect: (el) => {
                  el.innerHTML = `<b>Maya:</b> "Double-sleeving in hard-shell matte sleeves! Silas made me airtight cedar cases so my rarest Mythos cards stay in gem-mint condition even in the greenhouse!"`;
                }
              },
              {
                label: `4. 👋 "Enjoy the conservatory, Maya! (Leave)"`,
                onSelect: () => this.closeDialogue()
              }
            ],
            challengeText: '⚔️ Battle Maya!'
          });
        } else if (distToBench < 1.5) {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
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
          this.clearPendingBattleResults();
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      } else {
        // Exterior Neighborhood & Far-East Block Leo's Card Shop Avenue Prompt (Zoomed-out view)
        const pName = this.draftAppearance?.name || 'Asher';
        const fName = this.friendName || 'Mike';
        const wName = this.draftAppearance?.worldName || 'Oakhaven';
        const friend = this.getFriendNpc();
        const distFriendExt = (friend && friend.following) ? Math.hypot(this.player.x - friend.x, this.player.y - friend.y) : 999;

        const distFriendMailbox = Math.hypot(this.player.x - 8.15, this.player.y - 3.95);
        const distPlayerMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 3.95);
        const distPlayerDoor = Math.hypot(this.player.x - 1.98, this.player.y - 2.85);
        const distFriendDoor = Math.hypot(this.player.x - 10.05, this.player.y - 2.95);
        const distPlutoDoor = Math.hypot(this.player.x - 1.98, this.player.y - 8.85);
        const distPlutoMailbox = Math.hypot(this.player.x - 4.75, this.player.y - 9.25);
        const distRoadSign = Math.hypot(this.player.x - 7.35, this.player.y - 5.45);
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
        const distNorthParkSign = (Math.abs(this.player.x - 21.1) < 2.2 && Math.abs(this.player.y - 4.9) < 0.95)
          ? Math.hypot((this.player.x - 21.1) * 0.45, this.player.y - 4.9)
          : 999;

        const renderExtFriend = () => {
          this.nearInteractable = friend;
          const greetingHtml = this.hasOpenedStarterPack
            ? `<b>${fName}:</b> "I can't wait to battle you at my house! Head north up the road to <b>${fName}'s House</b>!"`
            : (this.hasBoughtCardShopPacks
              ? `<b>${fName}:</b> "We got our packs! Let's open them or head inside my house to duel!"`
              : `<b>${fName}:</b> "We're on our way to <b>Leo's Card Shop</b>! Follow the road east to grab our 2 Booster Packs!"`);
          this.renderNpcChoicePrompt({
            npcId: 'friend',
            altActiveIds: [fName],
            promptKey: `ext_friend_${fName}_${this.hasOpenedStarterPack ? 2 : (this.hasBoughtCardShopPacks ? 1 : 0)}`,
            speakerText: fName.toUpperCase(),
            speakerClass: 'ow-speaker-tag friend',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>${fName}</b>.`,
            greetingHtml,
            choices: [
              {
                label: `1. 🧭 "Where are we heading right now, ${fName}?"`,
                primary: true,
                onSelect: (tEl) => {
                  tEl.innerHTML = this.hasOpenedStarterPack
                    ? `<b>${fName}:</b> "Head north up to <b>104 ${wName} Lane</b> and walk through my front door — I'll meet you at the duel table!"`
                    : (this.hasBoughtCardShopPacks
                      ? `<b>${fName}:</b> "Open our new packs first using the <b>Pack / Inventory</b> button, then meet me inside my house to battle!"`
                      : `<b>${fName}:</b> "Follow the road south and walk east past the crossroads to <b>Leo's Card Shop</b>! Let's grab 2 Base Set packs!"`);
                }
              },
              {
                label: `2. 👋 "Got it — lead the way!" (Leave)`,
                onSelect: () => this.closeDialogue()
              }
            ]
          });
        };

        const showStaticPrompt = (id, name, speakerText, bodyHtml, { speakerClass = 'ow-speaker-tag friend', challengeText = null } = {}) => {
          this.lastShopPromptKey = null;
          this.activeDialogueNpc = null;
          challengeBtn.classList.remove('ow-talk-btn');
          choicesEl.classList.add('hidden');
          this.nearInteractable = { id, name };
          bar.classList.remove('hidden', 'tv-broadcast');
          speakerEl.textContent = speakerText;
          speakerEl.className = speakerClass;
          textEl.innerHTML = bodyHtml;
          if (challengeText) {
            challengeBtn.textContent = challengeText;
            challengeBtn.classList.remove('hidden');
          } else {
            challengeBtn.classList.add('hidden');
          }
        };

        const isMon = this.isMondayToday();
        const buildParkOptions = (npcId, npcName, loreItems) => {
          const tourneyOpt = this.getParkTourneyDialogueOption(npcId, npcName);
          if (isMon) {
            return [
              tourneyOpt,
              ...loreItems.map((item, idx) => ({ ...item, label: item.label.replace(/^\d+\./, `${idx + 2}.`), primary: false }))
            ];
          }
          return [
            ...loreItems.map((item, idx) => ({ ...item, label: item.label.replace(/^\d+\./, `${idx + 1}.`), primary: idx === 0 })),
            tourneyOpt
          ];
        };
        const parkTourneyGreetingSuffix = isMon
          ? (this.isParkMondayTourneyCompletedToday()
            ? ` Great games in today's Monday Round Robin — feel free to check the final standings!`
            : ` Every <b>Monday</b> we run the casual Oakhaven Central Park <b>Round Robin</b> ($10 for 1st, $5 for 2nd) — ready to play?`)
          : ``;

        const parkNpcs = [
          {
            npc: this.chloeNpc,
            dist: distChloe,
            id: 'chloe',
            speakerText: '🧺 CHLOE — PARK COURTYARD PICNIC',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Chloe</b> at the picnic table.`,
            greeting: `<b>Chloe:</b> "Oh, hello ${pName}! It's such a gorgeous sunny afternoon in Central Park! I packed a whole basket of lemon bars and berry iced tea.${parkTourneyGreetingSuffix}"`,
            options: buildParkOptions('chloe', 'Chloe', [
              {
                label: `1. 🍋 "That picnic spread looks delicious, Chloe!"`,
                primary: true,
                reply: `<b>Chloe:</b> "Help yourself to a lemon bar! There's nothing better than fresh baked treats outdoors while watching the water fountain shimmer in the breeze."`
              },
              {
                label: `2. 🌳 "What brings you to Central Park today?"`,
                reply: `<b>Chloe:</b> "I love the fresh air and the peaceful courtyard! Rowan over at table two has been deep into his card binders, and Jasper's doing landscape sketches. It's the liveliest spot in town!"`
              },
              {
                label: `3. 🌸 "Do you collect Mythos cards too?"`,
                reply: `<b>Chloe:</b> "I love the Flora and Nature-type cards! Maya showed me some rare floral beast cards earlier this week. They have such gentle, beautiful foil art!"`
              }
            ]),
            leaveLabel: `5. 👋 "Enjoy your picnic, Chloe! (Leave)"`
          },
          {
            npc: this.rowanNpc,
            dist: distRowan,
            id: 'rowan',
            speakerText: '🃏 ROWAN — MYTHOS DECK THEORIST',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Rowan</b> by his card binder and deckboxes.`,
            greeting: `<b>Rowan:</b> "Hey ${pName}! Check out this spread — I'm organizing my tactical beast pairings in the park.${parkTourneyGreetingSuffix}"`,
            options: buildParkOptions('rowan', 'Rowan', [
              {
                label: `1. 🃏 "What cards are you sorting through?"`,
                primary: true,
                reply: `<b>Rowan:</b> "I'm testing an aerial mobility combo with <b>Pegasus</b> and frontline pressure with <b>Dreadnaught</b>. If you control the center tiles and protect your backline, you dictate the entire tempo of the match!"`
              },
              {
                label: `2. 🪙 "How do you decide who goes first in matches?"`,
                reply: `<b>Rowan:</b> "The official Mythos coin flip! Whoever calls the golden coin gets first strike advantage. But going second gives you defensive counter-positioning, so both sides have a strong gameplan!"`
              },
              {
                label: `3. 🏪 "Have you been to Leo's Card Shop today?"`,
                reply: `<b>Rowan:</b> "Leo's got fresh booster packs just west of here! If you haven't opened a Base Set pack yet, you definitely should. Nothing beats the thrill of peeling a rare foil card!"`
              }
            ]),
            leaveLabel: `5. 👋 "Good luck with your deck, Rowan! (Leave)"`
          },
          {
            npc: this.jasperNpc,
            dist: distJasper,
            id: 'jasper',
            speakerText: '🎨 JASPER — WILDLIFE SKETCHER',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Jasper</b> by his wildlife sketchpad.`,
            greeting: `<b>Jasper:</b> "Shh... look up through the maple and oak canopies! A flock of cedar waxwings just landed among the high boughs.${parkTourneyGreetingSuffix}"`,
            options: buildParkOptions('jasper', 'Jasper', [
              {
                label: `1. 🎨 "What are you sketching right now, Jasper?"`,
                primary: true,
                reply: `<b>Jasper:</b> "I'm drawing field studies of the park birds and imagining them as winged Mythos beasts! Look at those feathers and wing spans — nature gives the best inspiration for beast card artwork."`
              },
              {
                label: `2. 🔭 "Can I borrow your binoculars to scan the treetops?"`,
                reply: `<b>Jasper:</b> "Sure! Focus near the highest oak branches. If you look closely across the leaves, you can spot songbirds and golden dragonflies darting through the sunbeams."`
              },
              {
                label: `3. 🌳 "How long have you been in the park courtyard?"`,
                reply: `<b>Jasper:</b> "Since early morning! The morning light on the fountain stones was breathtaking. This courtyard is the heart of Oakhaven — everyone passes through sooner or later."`
              }
            ]),
            leaveLabel: `5. 👋 "Keep up the great sketching, Jasper! (Leave)"`
          }
        ];
        const nearParkNpc = parkNpcs.find(p => p.npc && p.dist < 1.6);

        if ((this.activeDialogueNpc === 'friend' || this.activeDialogueNpc === fName) && distFriendExt < 1.55) {
          renderExtFriend();
        } else if (this.tryRenderMeetupVisitorPrompt({ maxDist: 1.75 })) {
          // Handled landmark meetup visitor
        } else if (distCardShopDoor < 1.15) {
          showStaticPrompt(
            'card_shop',
            "Leo's Card Shop",
            `🃏 LEO'S CARD SHOP`,
            this.hasOpenedStarterPack
              ? `<b>Leo's Card Shop</b> — ${fName} already headed back to <b>${fName}'s House</b> on the north residential road to wait for your Mythos Battle!`
              : `<b>${fName}:</b> "We made it to <b>Leo's Card Shop</b> on the far east block!! Walk right up through the front doors to head inside!"`,
            { speakerClass: 'ow-speaker-tag tv' }
          );
        } else if (distFriendMailbox < 1.0) {
          showStaticPrompt(
            'friend_mailbox',
            `${fName}'s Mailbox`,
            `📬 MAILBOX — 104 ${wName.toUpperCase()} LANE`,
            `<b>"${fName}'s House"</b> — Hand-painted on the wooden post. ${this.hasOpenedStarterPack ? `<b>${fName}</b> is waiting inside his house for your Mythos Battle!` : `Inside is a flyer for the <b>MYTHOS Summer Launch Event at Leo's Card Shop</b>!`}`
          );
        } else if (distPlayerMailbox < 1.0) {
          showStaticPrompt(
            'player_mailbox',
            `${pName}'s Mailbox`,
            `📬 MAILBOX — 102 ${wName.toUpperCase()} LANE`,
            `<b>"${pName}'s House"</b> — Your family mailbox. No new mail since morning.`
          );
        } else if (distPlayerDoor < 1.15) {
          showStaticPrompt(
            'player_door',
            `${pName}'s Front Door`,
            `🚪 ${pName.toUpperCase()}'S HOUSE`,
            `<b>Your House</b> — Press Space or walk through the screen door to head inside (Auto-Saves game).`
          );
        } else if (distFriendDoor < 1.1) {
          if (this.hasOpenedStarterPack) {
            this.activeDialogueNpc = null;
            challengeBtn.classList.remove('ow-talk-btn');
            this.nearInteractable = { id: 'friend_door', name: `${fName}'s Front Door` };
            bar.classList.remove('hidden', 'tv-broadcast');
            speakerEl.textContent = `🚪 ${fName.toUpperCase()}'S HOUSE`;
            speakerEl.className = 'ow-speaker-tag friend';
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
                this.triggerDuel(this.getFriendNpc());
              });
              choicesEl.appendChild(battleDoorBtn);
            }
            choicesEl.classList.remove('hidden');
            challengeBtn.textContent = `⚔️ Battle ${fName}!`;
            challengeBtn.classList.remove('hidden');
          } else {
            showStaticPrompt(
              'friend_door',
              `${fName}'s Front Door`,
              `🚪 ${fName.toUpperCase()}'S HOUSE`,
              `${fName}: "We don't need anything from my house right now — let's follow the road south and walk two blocks east to Leo's Card Shop!"`
            );
          }
        } else if (distRoadSign < 1.05) {
          showStaticPrompt(
            'road_sign',
            'Crossroads Sign',
            `🪧 ${wName.toUpperCase()} CROSSROADS`,
            `<b>◄ West:</b> Player's House &nbsp;|&nbsp; <b>► East:</b> ${fName}'s Cottage & North Turn &nbsp;|&nbsp; <b>▼ South to East Market Block:</b> Leo's Card Shop`
          );
        } else if (distPlutoDoor < 1.15) {
          showStaticPrompt(
            'pluto_door',
            "Pluto's House",
            `🚪 PLUTO'S HOUSE`,
            `<b>Pluto's House</b> — A sleek craftsman cottage with deep cosmic-indigo shingles and glowing cyan windowpanes. Step through the front door to visit Pluto in his bedroom!`,
            { challengeText: "🚪 Enter Pluto's House (Space)" }
          );
        } else if (distPlutoMailbox < 1.0) {
          showStaticPrompt(
            'pluto_mailbox',
            "Pluto's Mailbox",
            `📬 MAILBOX — 201 SOUTH CONNECTOR AVE`,
            `<b>"Pluto's House"</b> — Sleek purple metallic mailbox with digital address readouts and tech decals.`
          );
        } else if (distNovaDoor < 1.15) {
          showStaticPrompt(
            'nova_door',
            "Nova's House",
            `🚪 NOVA'S HOUSE`,
            `<b>Nova's House</b> — A handsome celestial navy craftsman cottage with starlight-glowing windows. Step through the front door to visit Nova in her observatory!`,
            { challengeText: "🚪 Enter Nova's House (Space)" }
          );
        } else if (distNovaMailbox < 1.0) {
          showStaticPrompt(
            'nova_mailbox',
            "Nova's Mailbox",
            `📬 MAILBOX — 301 SOUTH COBBLESTONE WAY`,
            `<b>"Nova's House"</b> — Midnight-blue painted mailbox adorned with celestial constellation decals.`
          );
        } else if (distSilasDoor < 1.15) {
          showStaticPrompt(
            'silas_door',
            "Silas's House",
            `🚪 SILAS'S HOUSE`,
            `<b>Silas's House</b> — A warm cedar craftsman cottage with a stone hearth chimney and hand-carved gables. Step through the front door to visit Silas in his workshop!`,
            { challengeText: "🚪 Enter Silas's House (Space)" }
          );
        } else if (distSilasMailbox < 1.0) {
          showStaticPrompt(
            'silas_mailbox',
            "Silas's Mailbox",
            `📬 MAILBOX — 303 SOUTH COBBLESTONE WAY`,
            `<b>"Silas's House"</b> — Solid heartwood oak mailbox hand-carved with Dreadnaught and ancient beast motifs.`
          );
        } else if (distMayaDoor < 1.15) {
          showStaticPrompt(
            'maya_door',
            "Maya's House",
            `🚪 MAYA'S HOUSE`,
            `<b>Maya's House</b> — A vibrant sage cottage framed by blooming orchid flower boxes and a glass conservatory. Step through the front door to visit Maya!`,
            { challengeText: "🚪 Enter Maya's House (Space)" }
          );
        } else if (distMayaMailbox < 1.0) {
          showStaticPrompt(
            'maya_mailbox',
            "Maya's Mailbox",
            `📬 MAILBOX — 305 SOUTH COBBLESTONE WAY`,
            `<b>"Maya's House"</b> — Cheerful emerald mailbox twined with sweet-pea vines and miniature clay pots.`
          );
        } else if (distSouthSign < 1.0) {
          showStaticPrompt(
            'south_sign',
            'South Block Signpost',
            `🪧 COBBLESTONE WAY`,
            `<b>◄ West:</b> Nova's House &nbsp;|&nbsp; <b>▲ North:</b> Leo's Card Shop & Town Green &nbsp;|&nbsp; <b>► East:</b> Silas & Maya's Cottages & Cobblestone Way East End`
          );
        } else if (nearParkNpc) {
          this.nearInteractable = nearParkNpc.npc;
          const tourneyPromptTag = isMon
            ? (this.isParkMondayTourneyCompletedToday()
              ? `mon_done_d${this.dayNumber}`
              : `mon_open_r${this.activeParkTourney?.currentRound || 1}_d${this.dayNumber}`)
            : `off_d${this.dayNumber}`;
          this.renderNpcChoicePrompt({
            npcId: nearParkNpc.id,
            promptKey: `${nearParkNpc.id}_dialogue_${pName}_${tourneyPromptTag}`,
            speakerText: nearParkNpc.speakerText,
            speakerClass: 'ow-speaker-tag friend',
            talkPromptHtml: nearParkNpc.talkPrompt,
            greetingHtml: nearParkNpc.greeting,
            choices: [
              ...nearParkNpc.options.map(opt => ({
                label: opt.label,
                primary: !!opt.primary,
                onSelect: (tEl) => {
                  if (opt.onSelect) opt.onSelect(tEl);
                  else tEl.innerHTML = opt.reply;
                }
              })),
              {
                label: nearParkNpc.leaveLabel,
                onSelect: () => this.closeDialogue()
              }
            ]
          });
        } else if (distParkFountain < 1.45) {
          showStaticPrompt(
            'park_fountain',
            'Courtyard Fountain',
            `⛲ CENTRAL PARK WATER FOUNTAIN`,
            `<b>Courtyard Fountain</b> — A grand multi-tiered carved limestone fountain. Crystal-clear water cascades into the stone pool, bubbling cheerfully in the afternoon sunlight.`
          );
        } else if (distParkSign < 1.1) {
          showStaticPrompt(
            'park_sign',
            'Central Park Sign',
            `🪧 OAKHAVEN CENTRAL PARK`,
            `<b>◄ West:</b> Leo's Card Shop & Town Center &nbsp;|&nbsp; <b>► East:</b> Courtyard Picnic Tables & Central Fountain`
          );
        } else if (distNorthParkSign < 1.15) {
          showStaticPrompt(
            'north_park_sign',
            'Oakhaven Central Park Monument',
            `🌳 OAKHAVEN CENTRAL PARK`,
            `<b>Welcome to Oakhaven Central Park!</b> — Established in the valley green. Relax by the courtyard fountain south or join the <b>Monday Casual Round Robin</b> tournament!`
          );
        } else if (distFriendExt < 1.55) {
          renderExtFriend();
        } else {
          this.lastShopPromptKey = null;
          this.nearInteractable = null;
          this.activeDialogueNpc = null;
          this.clearPendingBattleResults();
          choicesEl.classList.add('hidden');
          challengeBtn.classList.remove('ow-talk-btn');
          bar.classList.add('hidden');
        }
      }
      if (bar.classList.contains('hidden')) {
        this._justCompletedMeetup = null;
      }
      this.updateMobileActionLabel();
    }

    // -------------------------------------------------------------------------
    // Mobile Touch Virtual Gamepad & Dynamic Context Action Logic
    // -------------------------------------------------------------------------
    enterArea(doorId) {
      const destinations = {
        player_door: { area: 'interior', x: 9.8, y: 9.4, saveToast: '💾 Game Saved — Home' },
        pluto_door: { area: 'pluto_interior', x: 9.8, y: 9.3 },
        nova_door: { area: 'nova_interior', x: 9.8, y: 9.3 },
        silas_door: { area: 'silas_interior', x: 9.8, y: 9.3 },
        maya_door: { area: 'maya_interior', x: 9.8, y: 9.3 }
      };
      const dest = destinations[doorId];
      if (!dest) return false;
      if (window.sounds?.playMove) window.sounds.playMove();
      this.currentArea = dest.area;
      this.player.x = dest.x;
      this.player.y = dest.y;
      this.player.dir = 'up';
      this.player.targetX = null;
      this.player.targetY = null;
      this.areaTransitionCooldown = 25;
      this.closeDialogue();
      this.updateHUDSaveInfo();
      if (dest.saveToast) {
        this.saveWorldData(this.draftAppearance);
        this.showAutosaveIndicator(dest.saveToast);
      }
      return true;
    }

    handleChallengeOrLeaveAction() {
      if (!this.nearInteractable && !this.activeDialogueNpc) return false;
      const id = this.nearInteractable?.id;
      const active = this.activeDialogueNpc;
      const friend = this.getFriendNpc();
      const friendName = friend?.name || this.friendName || 'Mike';

      if (this.nearInteractable && this.isNpc(this.nearInteractable) && !active) {
        this.startTalkingToNpc(id);
        return true;
      }

      if (active) {
        if (typeof active === 'string' && active.startsWith('meetup_')) {
          if (this._justCompletedMeetup && this._justCompletedMeetup.meetup.area === this.currentArea) {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.closeDialogue();
            return true;
          }
          const meetupId = active.slice('meetup_'.length);
          const res = this.completeScheduledMeetup(meetupId);
          if (res.ok) {
            this.lastShopPromptKey = null;
            this.updateFreeRoamPrompt();
          } else {
            const textEl = document.getElementById('ow-dialog-text');
            if (textEl) textEl.innerHTML = res.message;
          }
          return true;
        }
        if (active === 'chloe' || active === 'rowan' || active === 'jasper') {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.closeDialogue();
          return true;
        }
        if (active === 'friend' || active === friendName) {
          if (this.currentArea === 'friend_interior') {
            this.triggerDuel(friend);
          } else {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.closeDialogue();
          }
          return true;
        }
        if (active === 'friend_duel' || active === 'best_friend') {
          this.triggerDuel(friend);
          return true;
        }
        if (active === 'mom') {
          if (!this.hasMomBoosterMoney) {
            this.askMomForBoosterMoney();
          } else {
            if (window.sounds?.playClick) window.sounds.playClick();
            this.closeDialogue();
          }
          return true;
        }
        if (active === 'shopkeeper') {
          if (!this.hasBoughtCardShopPacks) {
            if ((this.gold || 0) >= 20) {
              this.buyTwoBoosterPacks();
            } else {
              if (window.sounds?.playClick) window.sounds.playClick();
              this.closeDialogue();
            }
          } else {
            this.toggleShopModal(true);
          }
          return true;
        }
        if (active === 'pluto') {
          if ((this.gold || 0) >= 1.00) {
            this.triggerDuel(this.plutoNpc);
          } else {
            if (window.sounds?.playClick) window.sounds.playClick();
            const textEl = document.getElementById('ow-dialog-text');
            if (textEl) {
              textEl.innerHTML = `<b>Pluto:</b> "Looks like you don't have $1.00 on you right now! <i>(Wallet: ${this.formatMoney(this.gold || 0)})</i> Go sell an extra card to Shopkeeper Leo down the road or ask Mom for allowance first, then come back!"`;
            }
          }
          return true;
        }
        if (active === 'nova') {
          this.triggerDuel(this.novaNpc);
          return true;
        }
        if (active === 'silas') {
          this.triggerDuel(this.silasNpc);
          return true;
        }
        if (active === 'maya') {
          this.triggerDuel(this.mayaNpc);
          return true;
        }
      }

      if (id === 'tv') {
        this.storyState = 'tv_commercial';
        this.renderDialogueUI();
        return true;
      }
      if (id === 'player_bed') {
        this.sleepInBed();
        return true;
      }
      if (id === 'friend_door' && this.hasOpenedStarterPack) {
        this.triggerDuel(friend);
        return true;
      }
      if (this.enterArea(id)) {
        return true;
      }
      if (window.sounds?.playClick) window.sounds.playClick();
      return false;
    }

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

      if (!this.nearInteractable && !this.activeDialogueNpc) {
        labelEl.textContent = 'TALK';
        btnA?.classList.remove('dialogue-mode');
        return;
      }

      if (this.nearInteractable && this.isNpc(this.nearInteractable) && !this.activeDialogueNpc) {
        labelEl.textContent = 'TALK 💬';
        btnA?.classList.remove('dialogue-mode');
        return;
      }

      if (this.activeDialogueNpc) {
        btnA?.classList.add('dialogue-mode');
        const active = this.activeDialogueNpc;
        const friendName = this.getFriendNpc()?.name || this.friendName || 'Mike';
        if (typeof active === 'string' && active.startsWith('meetup_')) {
          labelEl.textContent = (this._justCompletedMeetup && this._justCompletedMeetup.meetup.area === this.currentArea)
            ? 'LEAVE 👋'
            : 'TRADE 🤝';
        } else if (active === 'chloe' || active === 'rowan' || active === 'jasper' || ((active === 'friend' || active === friendName) && this.currentArea !== 'friend_interior')) {
          labelEl.textContent = 'LEAVE 👋';
        } else if (active === 'mom') {
          labelEl.textContent = this.hasMomBoosterMoney ? 'LEAVE 👋' : 'ASK 💵';
        } else if (active === 'shopkeeper') {
          labelEl.textContent = !this.hasBoughtCardShopPacks ? ((this.gold || 0) >= 20 ? 'BUY 🃏' : 'LEAVE 👋') : 'SHOP 🛒';
        } else {
          labelEl.textContent = 'DUEL ⚔️';
        }
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
      } else if (id === 'friend_door') {
        labelEl.textContent = this.hasOpenedStarterPack ? 'DUEL ⚔️' : 'DOOR 🚪';
      } else if (id === 'booster_display') {
        labelEl.textContent = 'VIEW ✨';
      } else if (id === 'card_shop' || id === 'pluto_door' || id === 'nova_door' || id === 'silas_door' || id === 'maya_door') {
        labelEl.textContent = 'ENTER 🚪';
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

      if (this.activeDialogueNpc) {
        this.handleChallengeOrLeaveAction();
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
        this.handleChallengeOrLeaveAction();
      }
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

        dpad.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        dpad.addEventListener('contextmenu', (e) => e.preventDefault());
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
        btnA.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        btnA.addEventListener('contextmenu', (e) => e.preventDefault());
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
        btnB.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        btnB.addEventListener('contextmenu', (e) => e.preventDefault());
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
        playingDeck: [...(this.playingDeck || [])],
        storyState: this.storyState,
        currentArea: this.currentArea,
        playerPos: {
          x: Math.round((this.player?.x ?? 9.8) * 100) / 100,
          y: Math.round((this.player?.y ?? 9.4) * 100) / 100,
          dir: this.player?.dir || 'down'
        },
        wins: this.worldSave?.wins ?? 0,
        phoneUnreadShop: this.phoneUnreadShop ?? true,
        phoneChatHistories: this.phoneChatHistories || {},
        phoneListingsBought: this.phoneListingsBought || [],
        phoneListingsSold: this.phoneListingsSold || [],
        scheduledMeetups: this.scheduledMeetups || [],
        registeredTournaments: this.registeredTournaments || [],
        lastParkTourneyCompletedDay: this.lastParkTourneyCompletedDay || 0,
        activeParkTourney: this.activeParkTourney || null,
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
      const deckBadgeEl = document.getElementById('deck-badge-count');
      if (deckBadgeEl) {
        deckBadgeEl.textContent = String((this.playingDeck || []).length);
      }
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

      // Sync Phone Alerts & Unread Dot
      const phoneBadge = document.getElementById('phone-alert-badge');
      const mobPhoneBadge = document.getElementById('mob-phone-badge');
      const hasPhoneAlert = !!this.phoneUnreadShop;
      if (phoneBadge) phoneBadge.classList.toggle('hidden', !hasPhoneAlert);
      if (mobPhoneBadge) mobPhoneBadge.classList.toggle('hidden', !hasPhoneAlert);

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

      // Phone Button Handlers
      const openPhoneBtn = document.getElementById('btn-open-phone');
      if (openPhoneBtn) {
        openPhoneBtn.addEventListener('click', () => this.togglePhoneModal(true));
      }
      const mobPhoneBtn = document.getElementById('btn-mob-phone');
      if (mobPhoneBtn) {
        mobPhoneBtn.addEventListener('click', () => this.togglePhoneModal(true));
      }
      const closePhoneBtn = document.getElementById('btn-close-phone');
      if (closePhoneBtn) {
        closePhoneBtn.addEventListener('click', () => this.togglePhoneModal(false));
      }
      const phoneHomePill = document.getElementById('btn-phone-home-pill');
      if (phoneHomePill) {
        phoneHomePill.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.activeChatContactId = null;
          this.openPhoneApp('home');
        });
      }

      // App Icon Triggers on Phone Home
      document.getElementById('app-btn-contacts')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeChatContactId = null;
        this.openPhoneApp('contacts');
      });
      document.getElementById('app-btn-market')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('market');
      });
      document.getElementById('app-btn-shopfeed')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('shopfeed');
      });
      document.getElementById('app-btn-tournaments')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('tournaments');
      });

      // App Back Buttons
      document.getElementById('btn-contacts-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeChatContactId = null;
        this.openPhoneApp('home');
      });
      document.getElementById('btn-chat-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeChatContactId = null;
        this.renderContactsApp();
      });
      document.getElementById('btn-market-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('home');
      });
      document.getElementById('btn-shopfeed-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('home');
      });
      document.getElementById('btn-tournaments-back')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.openPhoneApp('home');
      });

      // Market Tab Switches
      document.getElementById('tab-market-buy')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeNegotiation = null;
        this.marketTab = 'buy';
        this.renderMarketApp();
      });
      document.getElementById('tab-market-sell')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeNegotiation = null;
        this.marketTab = 'sell';
        this.renderMarketApp();
      });
      document.getElementById('tab-market-meetups')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.activeNegotiation = null;
        this.marketTab = 'meetups';
        this.renderMarketApp();
      });

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
      const closeParkTourneyBtn = document.getElementById('btn-close-park-tourney');
      if (closeParkTourneyBtn) {
        closeParkTourneyBtn.addEventListener('click', () => this.toggleParkTournamentModal(false));
      }
      const closeParkTourneyFooterBtn = document.getElementById('btn-close-park-tourney-footer');
      if (closeParkTourneyFooterBtn) {
        closeParkTourneyFooterBtn.addEventListener('click', () => this.toggleParkTournamentModal(false));
      }
      const startParkTourneyBtn = document.getElementById('btn-start-park-tourney-match');
      if (startParkTourneyBtn) {
        startParkTourneyBtn.addEventListener('click', () => this.startParkMondayNextMatch());
      }
      const parkTourneyModal = document.getElementById('park-tournament-modal');
      if (parkTourneyModal) {
        parkTourneyModal.addEventListener('click', (e) => {
          if (e.target === parkTourneyModal) this.toggleParkTournamentModal(false);
        });
      }
      const wakeUpBtn = document.getElementById('btn-wake-up');
      if (wakeUpBtn) {
        wakeUpBtn.addEventListener('click', () => this.closeMorningWakeModal());
      }

      const closeInvBtn = document.getElementById('btn-close-inventory');
      if (closeInvBtn) {
        closeInvBtn.addEventListener('click', () => this.toggleInventoryModal(false));
      }
      const invFilterTabs = document.getElementById('inv-filter-tabs');
      if (invFilterTabs) {
        invFilterTabs.addEventListener('click', (e) => {
          const tab = e.target.closest('.inv-filter-tab');
          if (!tab) return;
          if (window.sounds?.playClick) window.sounds.playClick();
          this.inventoryFilter = tab.dataset.filter || 'all';
          this.renderInventoryModal();
        });
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

      const binderToDeckBtn = document.getElementById('btn-binder-to-deck');
      if (binderToDeckBtn) {
        binderToDeckBtn.addEventListener('click', () => {
          this.toggleBinderModal(false);
          this.togglePlayingDeckModal(true);
        });
      }

      document.querySelectorAll('#binder-sort-bar .binder-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (window.sounds?.playClick) window.sounds.playClick();
          this.binderSortBy = btn.dataset.sort || 'default';
          this.renderBinderModal();
        });
      });

      // Playing Deck Modal Handlers
      document.getElementById('btn-open-playing-deck')?.addEventListener('click', () => this.togglePlayingDeckModal(true));
      document.getElementById('btn-close-playing-deck')?.addEventListener('click', () => this.togglePlayingDeckModal(false));
      document.getElementById('btn-playing-deck-done')?.addEventListener('click', () => this.togglePlayingDeckModal(false));
      document.getElementById('btn-deck-clear')?.addEventListener('click', () => this.clearPlayingDeck());
      document.getElementById('btn-deck-autofill')?.addEventListener('click', () => this.autoFillPlayingDeck());

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
      this.hasBoughtBase2v2Map = false;
      this.hasOpenedStarterPack = this.worldSave.hasOpenedStarterPack ?? false;
      this.friendWaitingAtHouse = this.worldSave.friendWaitingAtHouse ?? false;
      this.hasOldCardBinder = this.worldSave.hasOldCardBinder ?? false;
      this.dayNumber = this.worldSave.dayNumber || 1;
      this.lastParkTourneyCompletedDay = this.worldSave.lastParkTourneyCompletedDay ?? 0;
      this.activeParkTourney = this.worldSave.activeParkTourney
        ? JSON.parse(JSON.stringify(this.worldSave.activeParkTourney))
        : null;
      if (this.activeParkTourney && (!this.isMondayToday() || this.activeParkTourney.dayNumber !== this.dayNumber)) {
        this.activeParkTourney = null;
      }
      this.syncParkNpcBubbles();
      this.friendDefeatedRewardPending = false;
      this.initPhoneSystem();

      // Restore Inventory & Reactive Proxy
      const rawInv = Array.isArray(this.worldSave.inventory)
        ? this.worldSave.inventory.filter(i => i && i.id !== 'map_base2v2' && i.type !== 'battle_map')
        : [];
      this.inventory = this.wrapReactiveArray(rawInv.map(i => this.wrapReactiveItem(i)), 'inventory');
      this.selectedInventoryItemId = null;

      // Restore 9-Pocket Card Binder & Reactive Proxy
      const rawBinder = Array.isArray(this.worldSave.binderSlots)
        ? [...this.worldSave.binderSlots]
        : Array(9).fill(null);
      while (rawBinder.length < 9) rawBinder.push(null);
      this.binderSlots = this.wrapReactiveArray(rawBinder.map(s => s ? this.wrapReactiveItem(s) : null), 'binder');
      this.consolidateBinderStacks();

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
          mom.x = 12.5;
          mom.y = 6.2;
          mom.targetX = null;
          mom.targetY = null;
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
            friend.x = 4.1;
            friend.y = 6.8;
            friend.dir = 'right';
            friend.bubble = '⚔️';
            this.npcs = [friend, mom];
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
        if (k === 'p') {
          e.preventDefault();
          this.togglePhoneModal();
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
        const overlayModalCloseOrder = [
          { id: 'park-tournament-modal', close: () => this.toggleParkTournamentModal(false) },
          { id: 'phone-modal', close: () => this.togglePhoneModal(false) },
          { id: 'calendar-modal', close: () => this.toggleCalendarModal(false) },
          { id: 'creature-inspect-modal', close: () => this.closeCreatureInspect() },
          { id: 'binder-picker-modal', close: () => this.closeBinderCardPicker() },
          { id: 'binder-modal', close: () => this.toggleBinderModal(false) },
          { id: 'inventory-modal', close: () => this.toggleInventoryModal(false) },
          { id: 'shop-modal', close: () => this.toggleShopModal(false) }
        ];
        const openOverlayModal = overlayModalCloseOrder.find((m) => {
          const el = document.getElementById(m.id);
          return el && !el.classList.contains('hidden');
        });
        if (k === 'escape') {
          if (openOverlayModal) {
            e.preventDefault();
            openOverlayModal.close();
            return;
          }
          if (this.activeDialogueNpc) {
            e.preventDefault();
            this.closeDialogue();
            return;
          }
        }
        if (openOverlayModal) {
          return;
        }

        if (this.storyState === 'intro_bored' && ['1', '2', '3'].includes(k)) {
          e.preventDefault();
          this.handlePlayerResponse(Number(k) - 1);
          return;
        }

        // Active dialogue / prompt choice selection via keys 1..5
        const choicesEl = document.getElementById('ow-choices-container');
        if (choicesEl && !choicesEl.classList.contains('hidden') && ['1', '2', '3', '4', '5'].includes(k)) {
          const choices = choicesEl.querySelectorAll('.ow-choice-btn');
          const idx = Number(k) - 1;
          if (choices[idx]) {
            e.preventDefault();
            choices[idx].click();
            return;
          }
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

        if ((k === ' ' || k === 'enter' || k === 'e') && (this.storyState === 'free_roam' || this.storyState === 'intro_waiting') && (this.activeDialogueNpc || this.nearInteractable)) {
          e.preventDefault();
          this.handleChallengeOrLeaveAction();
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.key.toLowerCase()] = false;
      });

      window.addEventListener('blur', () => {
        this.keys = {};
      });

      const handleCanvasTap = (clientX, clientY) => {
        if (!this.active) return;
        if (this.storyState !== 'free_roam' && this.storyState !== 'intro_waiting') return;

        const rect = this.canvas.getBoundingClientRect();
        const fit = window.getComputedStyle(this.canvas).objectFit;
        let scaleX = this.canvas.width / rect.width;
        let scaleY = this.canvas.height / rect.height;
        let offsetX = 0;
        let offsetY = 0;
        if (fit === 'cover') {
          const uniformScale = Math.min(scaleX, scaleY);
          scaleX = uniformScale;
          scaleY = uniformScale;
          const renderedW = this.canvas.width / uniformScale;
          const renderedH = this.canvas.height / uniformScale;
          offsetX = (renderedW - rect.width) / 2;
          offsetY = (renderedH - rect.height) / 2;
        }
        const cx = (clientX - rect.left + offsetX) * scaleX;
        const cy = (clientY - rect.top + offsetY) * scaleY;
        const zoom = this.getAreaZoom();
        const tx = (cx / zoom + (this.cameraX || 0)) / this.TILE;
        const ty = (cy / zoom + (this.cameraY || 0)) / this.TILE;

        // Visual golden destination beacon on touch/click
        this.touchBeacon = { x: tx, y: ty, tick: 0 };

        const friend = this.getFriendNpc();
        const clickableNpcs = [
          {
            active: this.currentArea === 'interior',
            npc: this.npcs.find(n => n.id === 'mom'),
            talkId: 'mom',
            tapRadius: 1.4,
            reachRadius: 1.85,
            yOffset: 0
          },
          {
            active: this.currentArea === 'card_shop_interior',
            npc: this.shopkeeperNpc,
            talkId: 'shopkeeper',
            tapRadius: 1.6,
            reachRadius: 1.9,
            yOffset: 1.05
          },
          {
            active: this.currentArea === 'pluto_interior',
            npc: this.plutoNpc,
            talkId: 'pluto',
            tapRadius: 1.6,
            reachRadius: 1.95,
            yOffset: 0.85
          },
          {
            active: this.currentArea === 'nova_interior',
            npc: this.novaNpc,
            talkId: 'nova',
            tapRadius: 1.6,
            reachRadius: 1.95,
            yOffset: 0.85
          },
          {
            active: this.currentArea === 'silas_interior',
            npc: this.silasNpc,
            talkId: 'silas',
            tapRadius: 1.6,
            reachRadius: 1.95,
            yOffset: 0.85
          },
          {
            active: this.currentArea === 'maya_interior',
            npc: this.mayaNpc,
            talkId: 'maya',
            tapRadius: 1.6,
            reachRadius: 1.95,
            yOffset: 0.85
          },
          {
            active: this.currentArea === 'exterior',
            npc: this.chloeNpc,
            talkId: 'chloe',
            tapRadius: 1.6,
            reachRadius: 1.85,
            yOffset: 0
          },
          {
            active: this.currentArea === 'exterior',
            npc: this.rowanNpc,
            talkId: 'rowan',
            tapRadius: 1.6,
            reachRadius: 1.85,
            yOffset: 0
          },
          {
            active: this.currentArea === 'exterior',
            npc: this.jasperNpc,
            talkId: 'jasper',
            tapRadius: 1.6,
            reachRadius: 1.85,
            yOffset: 0
          },
          {
            active: !!friend && this.getActiveNpcsForArea().includes(friend),
            npc: friend,
            talkId: this.currentArea === 'friend_interior' ? 'friend_duel' : 'friend',
            tapRadius: 1.5,
            reachRadius: 2.0,
            yOffset: 0
          },
          ...this.getActiveMeetupVisitorsForArea().map(v => ({
            active: true,
            npc: v,
            talkId: v.id,
            tapRadius: 1.5,
            reachRadius: 2.0,
            yOffset: 0
          }))
        ];

        for (const entry of clickableNpcs) {
          if (!entry.active || !entry.npc) continue;
          if (Math.hypot(tx - entry.npc.x, ty - entry.npc.y) < entry.tapRadius
              && Math.hypot(this.player.x - entry.npc.x, this.player.y - (entry.npc.y + entry.yOffset)) < entry.reachRadius) {
            if (this.activeDialogueNpc !== entry.talkId) {
              this.startTalkingToNpc(entry.talkId);
              return;
            }
          }
        }

        const houseTarget = this.resolveExteriorHouseDoorTarget(tx, ty);
        const moveX = houseTarget ? houseTarget.x : tx;
        const moveY = houseTarget ? houseTarget.y : ty;
        if (houseTarget) {
          this.touchBeacon = { x: moveX, y: moveY, tick: 0 };
        }
        this.setClickMoveTarget(moveX, moveY);
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
          this.handleChallengeOrLeaveAction();
        });
      }
    }

    triggerDuel(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null, customOpponentTeam = null) {
      if (window.sounds?.playClick) window.sounds.playClick();
      this.storyState = 'free_roam';
      this.keys = {};
      this.player.targetX = null;
      this.player.targetY = null;
      const areaNpcMap = {
        pluto_interior: this.plutoNpc,
        nova_interior: this.novaNpc,
        silas_interior: this.silasNpc,
        maya_interior: this.mayaNpc
      };
      const target = challenger || areaNpcMap[this.currentArea] || this.getFriendNpc() || this.npcs[0];
      if (this.onStartDuel) {
        this.onStartDuel(target, mapId, customPlayerTeam, customOpponentTeam);
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
        // Wider Zoomed-Out Exterior World Bounds with Expanded South Block & Central Park East (Cols 0.5..25.6, Rows 0.5..17.8)
        // Allow Oakhaven Lane north road extension (x: 14.1..15.5) to reach top of screen (ty >= 0.1)
        const inOakhavenNorthRoad = (tx >= 14.1 && tx <= 15.5 && ty >= 0.1 && ty <= 5.25);
        if (!inOakhavenNorthRoad && (tx < 0.5 || tx > 25.6 || ty < 0.5 || ty > 17.8)) return true;

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
        if (Math.hypot(tx - 7.35, ty - 14.50) < 0.28) return true; // South Block Signpost

        // 7. Central Park Courtyard, Fountain, Picnic Tables & Signpost
        // Picnic Table 1 (NW / Chloe's Picnic Table: x: 18.8..20.2, y: 7.3..8.1)
        if (tx >= 18.8 && tx <= 20.2 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 2 (NE / Rowan's Card Table: x: 22.1..23.5, y: 7.3..8.1)
        if (tx >= 22.1 && tx <= 23.5 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 3 (S / Jasper's Sketchbook Table: x: 20.4..21.8, y: 10.1..10.9)
        if (tx >= 20.4 && tx <= 21.8 && ty >= 10.1 && ty <= 10.9) return true;
        // Park Welcome Signpost
        if (Math.hypot(tx - 16.6, ty - 9.25) < 0.28) return true;

        // 8. Tight base hitboxes for trees, standalone benches, picket fences, and fountains
        if (this.isBlockedExteriorProp(tx, ty)) return true;

        return false;
      }
    }

    /** Single-source wooden picket fence placements (x, y, width in tiles). */
    getExteriorFences() {
      return [
        [0.35, 3.84, 1.15],
        [2.35, 3.84, 1.90],
        [10.50, 3.84, 1.90],
        [0.35, 9.16, 1.15],
        [2.35, 9.16, 1.90],
        [0.35, 14.38, 1.15],
        [2.35, 14.38, 1.90],
        [8.05, 14.38, 1.75],
        [13.15, 14.38, 1.85]
      ];
    }

    /** Single-source exterior tree & shrub placements [tileX, tileY, radius, isAutumn, zone]. */
    getExteriorTreeClusters() {
      return [
        // North Block
        [6.0, 0.9, 24, true, 'town'],
        [6.0, 2.0, 22, false, 'town'],
        [6.0, 3.0, 20, false, 'town'],
        [0.45, 0.9, 23, false, 'town'],
        [0.55, 2.2, 22, true, 'town'],
        [11.8, 0.9, 24, false, 'town'],
        [12.3, 2.3, 22, true, 'town'],
        [13.1, 3.2, 20, false, 'town'],
        // Middle Block
        [0.45, 6.2, 22, false, 'town'],
        [0.50, 8.2, 22, true, 'town'],
        [2.2, 5.55, 18, false, 'town'],
        [3.8, 5.55, 18, true, 'town'],
        [4.9, 6.4, 22, false, 'town'],
        [4.95, 7.28, 19, false, 'town'],
        // South Block
        [0.45, 11.5, 24, false, 'town'],
        [0.50, 13.5, 23, true, 'town'],
        [2.2, 10.8, 18, false, 'town'],
        [3.8, 10.8, 18, true, 'town'],
        [4.9, 12.2, 20, false, 'town'],
        [10.2, 12.5, 20, true, 'town'],
        [15.2, 11.5, 24, false, 'town'],
        [15.2, 13.5, 23, true, 'town'],
        // Deep Southern Forest Border
        [1.5, 16.7, 26, false, 'town'],
        [4.5, 16.8, 24, true, 'town'],
        [7.5, 16.8, 26, false, 'town'],
        [10.8, 16.7, 24, true, 'town'],
        [13.8, 16.8, 26, false, 'town'],
        [17.2, 16.8, 26, false, 'town'],
        [20.5, 16.7, 26, true, 'town'],
        [23.8, 16.8, 26, false, 'town'],
        // North Central Park Shade Trees
        [21.8, 2.8, 24, false, 'park_north'],
        [23.6, 2.2, 26, true, 'park_north'],
        [25.0, 3.2, 22, false, 'park_north'],
        // Central Park Perimeter Trees
        [18.0, 1.2, 26, false, 'park_perim'],
        [19.8, 0.8, 24, true, 'park_perim'],
        [25.2, 1.2, 26, false, 'park_perim'],
        [25.5, 5.8, 26, true, 'park_perim'],
        [25.4, 8.5, 25, false, 'park_perim'],
        [25.5, 11.8, 26, true, 'park_perim'],
        [25.2, 13.5, 24, false, 'park_perim'],
        [18.0, 13.8, 24, false, 'park_perim'],
        [21.5, 13.8, 24, true, 'park_perim']
      ];
    }

    /** Compact ground-base hitboxes (boxes & ellipses in tiles) for fountains, benches, and plaza trunks. */
    getExteriorStaticPropShapes() {
      return {
        // Standalone plaza & park benches (tight seat/leg base adjusted for footY = y + 10px)
        boxes: [
          { minX: 7.06, maxX: 7.33, minY: 7.22, maxY: 7.68 },   // Middle plaza west bench
          { minX: 9.33, maxX: 9.60, minY: 7.22, maxY: 7.68 },   // Middle plaza east bench
          { minX: 7.98, maxX: 8.67, minY: 8.42, maxY: 8.68 },   // Middle plaza south bench
          { minX: 7.04, maxX: 7.68, minY: 16.22, maxY: 16.48 }, // South edge park bench
          { minX: 19.35, maxX: 22.85, minY: 4.66, maxY: 4.90 }  // North Central Park large welcome sign
        ],
        // Fountains & Middle Plaza corner tree trunks
        ellipses: [
          { cx: 21.1, cy: 9.12, rx: 0.72, ry: 0.56 },           // Central Park Fountain basin
          { cx: 8.33, cy: 7.70, rx: 0.50, ry: 0.27 },           // Middle Town Plaza Fountain basin
          { cx: 7.41, cy: 6.56, rx: 0.22, ry: 0.14 },           // Middle Plaza NW tree trunk
          { cx: 9.16, cy: 6.61, rx: 0.23, ry: 0.14 }            // Middle Plaza NE tree trunk
        ]
      };
    }

    /** Check tight base collision against exterior trees, benches, fences, and fountains. */
    isBlockedExteriorProp(tx, ty) {
      const shapes = this.getExteriorStaticPropShapes();
      for (const b of shapes.boxes) {
        if (tx >= b.minX && tx <= b.maxX && ty >= b.minY && ty <= b.maxY) return true;
      }
      for (const e of shapes.ellipses) {
        const dx = (tx - e.cx) / e.rx;
        const dy = (ty - e.cy) / e.ry;
        if (dx * dx + dy * dy <= 1) return true;
      }

      for (const [fx, fy, fw] of this.getExteriorFences()) {
        if (tx >= fx + 0.04 && tx <= fx + fw - 0.04 && ty >= fy - 0.13 && ty <= fy + 0.10) {
          return true;
        }
      }

      const S = this.TILE;
      for (const [x, y, r, isAutumn] of this.getExteriorTreeClusters()) {
        if (r < 20) continue; // Only trees (r >= 20); low flower shrubs stay non-blocking
        const dh = Math.round(108 * (r / 23));
        const trunkY = y + (dh * 0.24 - 10) / S;
        const rx = isAutumn ? 0.18 : 0.23;
        const ry = 0.14;
        const dx = (tx - x) / rx;
        const dy = (ty - trunkY) / ry;
        if (dx * dx + dy * dy <= 1) return true;
      }

      return false;
    }

    /** Declarative exterior building specs paired with their walkable front-door triggers. */
    getExteriorEnterableBuildings() {
      return [
        {
          id: 'player_house',
          spriteKey: 'cottage_player',
          hx: 1.1, hy: 0.45, hw: 3.2, maxY: 3.38,
          doorX: 1.98, doorY: 2.65
        },
        {
          id: 'friend_house',
          spriteKey: 'cottage_friend',
          hx: 7.7, hy: 0.45, hw: 3.2, maxY: 3.38,
          doorX: 10.02, doorY: 2.75
        },
        {
          id: 'card_shop',
          spriteKey: 'card_shop',
          isShop: true,
          hx: 11.8, hy: 5.95, hw: 3.55, sh: 3.30, maxY: 9.25,
          doorX: 13.65, doorY: 8.85
        },
        {
          id: 'pluto_house',
          spriteKey: 'cottage_pluto',
          hx: 1.1, hy: 5.95, hw: 3.2, maxY: 9.28,
          doorX: 1.98, doorY: 8.65
        },
        {
          id: 'nova_house',
          spriteKey: 'cottage_nova',
          hx: 1.1, hy: 11.20, hw: 3.2, maxY: 14.48,
          doorX: 1.98, doorY: 13.88
        },
        {
          id: 'silas_house',
          spriteKey: 'cottage_silas',
          hx: 6.85, hy: 11.20, hw: 3.0, maxY: 14.48,
          doorX: 7.60, doorY: 13.90
        },
        {
          id: 'maya_house',
          spriteKey: 'cottage_maya',
          hx: 11.8, hy: 11.20, hw: 3.2, maxY: 14.48,
          doorX: 12.68, doorY: 13.88
        }
      ];
    }

    /** Compute visual + footprint bounds in tiles for a clickable exterior building. */
    getExteriorBuildingBounds(b) {
      const S = this.TILE;
      const eavePad = 8 / S;
      let minX = b.hx - eavePad;
      let maxX = b.hx + b.hw + eavePad;
      let minY = b.hy - (b.isShop ? 0 : 8 / S);
      let maxY = b.maxY;

      if (b.spriteKey && this.isImgReady(b.spriteKey)) {
        const img = this.owSprites[b.spriteKey];
        if (b.isShop) {
          const sw = Math.round(b.hw * S);
          const sh = Math.round(b.sh * S);
          const dw = Math.round(sw + 18);
          const dh = Math.round(dw * (img.height / img.width));
          const dx = Math.round(b.hx * S - 9);
          const dy = Math.round(b.hy * S + sh - dh - 4);
          minX = Math.min(minX, dx / S);
          maxX = Math.max(maxX, (dx + dw) / S);
          minY = Math.min(minY, dy / S);
          maxY = Math.max(maxY, (dy + dh) / S);
        } else {
          const dw = Math.round(b.hw * S + 14);
          const dh = Math.round(dw * (img.height / img.width));
          const dx = Math.round(b.hx * S - 7);
          const dy = Math.round((b.hy + 2.95) * S - dh);
          minX = Math.min(minX, dx / S);
          maxX = Math.max(maxX, (dx + dw) / S);
          minY = Math.min(minY, dy / S);
          maxY = Math.max(maxY, (dy + dh) / S);
        }
      }
      return { minX, maxX, minY, maxY };
    }

    /** Redirect an exterior click anywhere on a house or shop to its front door entry point. */
    resolveExteriorHouseDoorTarget(tx, ty) {
      if (this.currentArea !== 'exterior') return null;
      for (const b of this.getExteriorEnterableBuildings()) {
        const bounds = this.getExteriorBuildingBounds(b);
        if (tx >= bounds.minX && tx <= bounds.maxX && ty >= bounds.minY && ty <= bounds.maxY) {
          return { id: b.id, x: b.doorX, y: b.doorY };
        }
      }
      return null;
    }

    /** Reset active click-to-move destination and cached waypoints. */
    clearClickMoveTarget() {
      if (!this.player) return;
      this.player.targetX = null;
      this.player.targetY = null;
      this.player.path = null;
      this.player._pathGoalX = null;
      this.player._pathGoalY = null;
      this.player._pathArea = null;
      this.player._stuckTicks = 0;
      this.player._replans = 0;
    }

    /** Return quarter-tile pathfinding grid dimensions for the current area. */
    getPathfindingGridSpec() {
      const step = 0.25;
      const isExt = this.currentArea === 'exterior';
      const minX = isExt ? 0.25 : 2.0;
      const minY = isExt ? 0.0 : 4.0;
      const maxX = isExt ? 25.75 : 14.0;
      const maxY = isExt ? 18.0 : 10.5;
      const cols = Math.round((maxX - minX) / step) + 1;
      const rows = Math.round((maxY - minY) / step) + 1;
      return { step, minX, minY, maxX, maxY, cols, rows };
    }

    /** Check whether a straight segment can be walked without clipping obstacles. */
    canWalkStraight(x1, y1, x2, y2) {
      const dist = Math.hypot(x2 - x1, y2 - y1);
      if (dist <= 0.001) return !this.isBlocked(x2, y2);
      const steps = Math.max(2, Math.ceil(dist / 0.06));
      let prevX = x1;
      let prevY = y1;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        if (this.isBlocked(px, py)) return false;
        // Match sequential axis collision guards in update()
        if (this.isBlocked(px, prevY) || this.isBlocked(prevX, py)) return false;
        prevX = px;
        prevY = py;
      }
      return true;
    }

    /** Pull string on raw grid waypoints to eliminate zig-zags while staying collision-free. */
    smoothOverworldPath(startX, startY, raw) {
      if (!raw || raw.length <= 1) return raw ? raw.slice() : [];
      const smoothed = [];
      let anchorX = startX;
      let anchorY = startY;
      let i = 0;
      while (i < raw.length) {
        let farthest = i;
        for (let j = raw.length - 1; j > i; j--) {
          if (this.canWalkStraight(anchorX, anchorY, raw[j].x, raw[j].y)) {
            farthest = j;
            break;
          }
        }
        const wp = raw[farthest];
        smoothed.push(wp);
        anchorX = wp.x;
        anchorY = wp.y;
        i = farthest + 1;
      }
      return smoothed;
    }

    /** Build quarter-tile walkability bitmap for the current area. */
    buildWalkabilityGrid() {
      const spec = this.getPathfindingGridSpec();
      const total = spec.cols * spec.rows;
      const walkable = new Uint8Array(total);
      for (let r = 0; r < spec.rows; r++) {
        const wy = spec.minY + r * spec.step;
        const rowOff = r * spec.cols;
        for (let c = 0; c < spec.cols; c++) {
          walkable[rowOff + c] = this.isBlocked(spec.minX + c * spec.step, wy) ? 0 : 1;
        }
      }
      return { ...spec, total, walkable };
    }

    /** Collect nearby walkable start grid cells reachable in a straight step from (startX, startY). */
    collectPathStarts(grid, startX, startY) {
      const { step, minX, minY, cols, rows, walkable } = grid;
      const sc0 = Math.max(0, Math.min(cols - 1, Math.round((startX - minX) / step)));
      const sr0 = Math.max(0, Math.min(rows - 1, Math.round((startY - minY) / step)));
      const collect = (radius, requireLos) => {
        const out = [];
        for (let dr = -radius; dr <= radius; dr++) {
          const r = sr0 + dr;
          if (r < 0 || r >= rows) continue;
          for (let dc = -radius; dc <= radius; dc++) {
            const c = sc0 + dc;
            if (c < 0 || c >= cols) continue;
            const idx = r * cols + c;
            if (!walkable[idx]) continue;
            const wx = minX + c * step;
            const wy = minY + r * step;
            if (!requireLos || this.canWalkStraight(startX, startY, wx, wy)) {
              out.push({ idx, g: Math.hypot(wx - startX, wy - startY) });
            }
          }
        }
        return out;
      };
      const starts = collect(2, true);
      if (starts.length > 0) return starts;
      const fallback = collect(4, false);
      if (fallback.length > 1) {
        fallback.sort((a, b) => a.g - b.g);
        fallback.length = 1;
      }
      return fallback;
    }

    /** Collect walkable cells immediately adjacent to an unblocked goal point. */
    collectGoalAnchors(grid, goalX, goalY) {
      const { step, minX, minY, cols, rows, walkable } = grid;
      const gc0 = Math.max(0, Math.min(cols - 1, Math.round((goalX - minX) / step)));
      const gr0 = Math.max(0, Math.min(rows - 1, Math.round((goalY - minY) / step)));
      const anchors = new Set();
      for (let dr = -2; dr <= 2; dr++) {
        const r = gr0 + dr;
        if (r < 0 || r >= rows) continue;
        for (let dc = -2; dc <= 2; dc++) {
          const c = gc0 + dc;
          if (c < 0 || c >= cols) continue;
          const idx = r * cols + c;
          if (!walkable[idx]) continue;
          const wx = minX + c * step;
          const wy = minY + r * step;
          if (this.canWalkStraight(wx, wy, goalX, goalY)) {
            anchors.add(idx);
          }
        }
      }
      return anchors;
    }

    /** Reconstruct, smooth, and append the continuous goal endpoint for a solved grid path. */
    reconstructGridPath(grid, parent, endIdx, startX, startY, goalX, goalY, appendExactGoal) {
      const { step, minX, minY, cols } = grid;
      const raw = [];
      let trace = endIdx;
      while (trace !== -1) {
        const tc = trace % cols;
        const tr = Math.floor(trace / cols);
        raw.push({ x: minX + tc * step, y: minY + tr * step });
        trace = parent[trace];
      }
      raw.reverse();
      if (appendExactGoal) {
        const last = raw[raw.length - 1];
        if (!last || Math.hypot(goalX - last.x, goalY - last.y) > 0.005) {
          raw.push({ x: goalX, y: goalY });
        }
      }
      if (raw.length > 1 && Math.hypot(raw[0].x - startX, raw[0].y - startY) < 0.02) {
        raw.shift();
      }
      const smoothed = this.smoothOverworldPath(startX, startY, raw);
      if (smoothed.length === 1 && Math.hypot(smoothed[0].x - startX, smoothed[0].y - startY) <= 0.03) {
        return [];
      }
      return smoothed;
    }

    /** Compute obstacle-avoiding waypoints on a quarter-tile grid, falling back to nearest reachable point. */
    findOverworldPath(startX, startY, goalX, goalY) {
      const goalWalkable = !this.isBlocked(goalX, goalY);
      if (goalWalkable && Math.hypot(goalX - startX, goalY - startY) <= 0.03) return [];
      if (goalWalkable && this.canWalkStraight(startX, startY, goalX, goalY)) {
        return [{ x: goalX, y: goalY }];
      }

      const grid = this.buildWalkabilityGrid();
      const { step, minX, minY, cols, rows, total, walkable } = grid;
      const starts = this.collectPathStarts(grid, startX, startY);
      if (starts.length === 0) return [];

      const goalAnchors = goalWalkable ? this.collectGoalAnchors(grid, goalX, goalY) : null;
      const seekExactGoal = !!(goalAnchors && goalAnchors.size > 0);

      const gScore = new Float32Array(total).fill(Infinity);
      const parent = new Int32Array(total).fill(-1);
      const closed = new Uint8Array(total);
      const visitedIndices = [];
      const heapIdx = [];
      const heapF = [];

      const heapSwap = (a, b) => {
        const ti = heapIdx[a]; heapIdx[a] = heapIdx[b]; heapIdx[b] = ti;
        const tf = heapF[a]; heapF[a] = heapF[b]; heapF[b] = tf;
      };
      const heapPush = (idx, f) => {
        let pos = heapIdx.length;
        heapIdx.push(idx);
        heapF.push(f);
        while (pos > 0) {
          const p = (pos - 1) >> 1;
          if (heapF[p] <= heapF[pos]) break;
          heapSwap(p, pos);
          pos = p;
        }
      };
      const heapPop = () => {
        const top = heapIdx[0];
        const lastIdx = heapIdx.pop();
        const lastF = heapF.pop();
        if (heapIdx.length > 0) {
          heapIdx[0] = lastIdx;
          heapF[0] = lastF;
          let pos = 0;
          const len = heapIdx.length;
          while (true) {
            const l = pos * 2 + 1;
            const r = l + 1;
            let best = pos;
            if (l < len && heapF[l] < heapF[best]) best = l;
            if (r < len && heapF[r] < heapF[best]) best = r;
            if (best === pos) break;
            heapSwap(pos, best);
            pos = best;
          }
        }
        return top;
      };

      for (const s of starts) {
        if (s.g >= gScore[s.idx]) continue;
        gScore[s.idx] = s.g;
        visitedIndices.push(s.idx);
        const h = seekExactGoal
          ? Math.hypot(goalX - (minX + (s.idx % cols) * step), goalY - (minY + Math.floor(s.idx / cols) * step))
          : 0;
        heapPush(s.idx, s.g + h);
      }

      const diagCost = step * Math.SQRT2;
      const dirs = [
        [1, 0, step], [-1, 0, step], [0, 1, step], [0, -1, step],
        [1, 1, diagCost], [1, -1, diagCost], [-1, 1, diagCost], [-1, -1, diagCost]
      ];

      let reachedIdx = -1;
      while (heapIdx.length > 0) {
        const curr = heapPop();
        if (closed[curr]) continue;
        closed[curr] = 1;
        if (seekExactGoal && goalAnchors.has(curr)) {
          reachedIdx = curr;
          break;
        }

        const cc = curr % cols;
        const cr = Math.floor(curr / cols);
        const currG = gScore[curr];
        for (let d = 0; d < dirs.length; d++) {
          const dc = dirs[d][0];
          const dr = dirs[d][1];
          const nc = cc + dc;
          const nr = cr + dr;
          if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
          const nIdx = nr * cols + nc;
          if (!walkable[nIdx] || closed[nIdx]) continue;
          if (dc !== 0 && dr !== 0 && (!walkable[cr * cols + nc] || !walkable[nr * cols + cc])) continue;
          const tentG = currG + dirs[d][2];
          if (tentG < gScore[nIdx]) {
            if (gScore[nIdx] === Infinity) visitedIndices.push(nIdx);
            gScore[nIdx] = tentG;
            parent[nIdx] = curr;
            const h = seekExactGoal
              ? Math.hypot(goalX - (minX + nc * step), goalY - (minY + nr * step))
              : 0;
            heapPush(nIdx, tentG + h);
          }
        }
      }

      let endIdx = reachedIdx;
      if (endIdx === -1) {
        let bestScore = Infinity;
        for (let k = 0; k < visitedIndices.length; k++) {
          const idx = visitedIndices[k];
          if (!closed[idx]) continue;
          const wx = minX + (idx % cols) * step;
          const wy = minY + Math.floor(idx / cols) * step;
          const score = Math.hypot(wx - goalX, wy - goalY) + 0.002 * gScore[idx];
          if (score < bestScore) {
            bestScore = score;
            endIdx = idx;
          }
        }
      }
      if (endIdx === -1) return [];
      return this.reconstructGridPath(grid, parent, endIdx, startX, startY, goalX, goalY, reachedIdx !== -1);
    }

    /** Plan and store a click-to-move path toward (tx, ty). */
    setClickMoveTarget(tx, ty) {
      const path = this.findOverworldPath(this.player.x, this.player.y, tx, ty);
      if (!path || path.length === 0) {
        this.clearClickMoveTarget();
        return;
      }
      this.player.targetX = tx;
      this.player.targetY = ty;
      this.player.path = path;
      this.player._pathGoalX = tx;
      this.player._pathGoalY = ty;
      this.player._pathArea = this.currentArea;
      this.player._stuckTicks = 0;
      this.player._replans = 0;
    }

    /** Advance player smoothly along planned click waypoints up to `speed` tiles. */
    stepAlongClickPath(speed) {
      if (!this.player.path || this.player.path.length === 0) return 0;
      const startFrameX = this.player.x;
      const startFrameY = this.player.y;
      let remaining = speed;
      let facingSet = false;

      while (remaining > 0.0001 && this.player.path.length > 0) {
        const wp = this.player.path[0];
        const wdx = wp.x - this.player.x;
        const wdy = wp.y - this.player.y;
        const dist = Math.hypot(wdx, wdy);

        if (dist <= 0.002) {
          this.player.path.shift();
          continue;
        }

        const move = Math.min(remaining, dist);
        if (!facingSet || move > speed * 0.35) {
          if (Math.abs(wdx) >= Math.abs(wdy)) {
            this.player.dir = wdx > 0 ? 'right' : 'left';
          } else {
            this.player.dir = wdy > 0 ? 'down' : 'up';
          }
          facingSet = true;
        }

        if (dist <= remaining) {
          if (!this.isBlocked(wp.x, this.player.y) && !this.isBlocked(wp.x, wp.y)) {
            this.player.x = wp.x;
            this.player.y = wp.y;
            this.player.path.shift();
            remaining -= dist;
            continue;
          } else if (!this.isBlocked(this.player.x, wp.y) && !this.isBlocked(wp.x, wp.y)) {
            this.player.y = wp.y;
            this.player.x = wp.x;
            this.player.path.shift();
            remaining -= dist;
            continue;
          }
        }

        const stepX = (wdx / dist) * move;
        const stepY = (wdy / dist) * move;
        const prevX = this.player.x;
        const prevY = this.player.y;
        if (!this.isBlocked(this.player.x + stepX, this.player.y)) this.player.x += stepX;
        if (!this.isBlocked(this.player.x, this.player.y + stepY)) this.player.y += stepY;
        const actualMove = Math.hypot(this.player.x - prevX, this.player.y - prevY);
        remaining -= move;
        if (actualMove < move * 0.25) {
          break;
        }
      }

      const movedThisTick = Math.hypot(this.player.x - startFrameX, this.player.y - startFrameY);
      if (this.player.path.length === 0) {
        this.clearClickMoveTarget();
      } else if (movedThisTick < speed * 0.2) {
        this.player._stuckTicks = (this.player._stuckTicks || 0) + 1;
        if (this.player._stuckTicks >= 4) {
          if ((this.player._replans || 0) < 3 && this.player.targetX !== null && this.player.targetY !== null) {
            const replanCount = (this.player._replans || 0) + 1;
            this.setClickMoveTarget(this.player.targetX, this.player.targetY);
            if (this.player.path) {
              this.player._replans = replanCount;
            }
          } else {
            this.clearClickMoveTarget();
          }
        }
      } else {
        this.player._stuckTicks = 0;
        if (movedThisTick >= speed * 0.5) {
          this.player._replans = 0;
        }
      }

      return movedThisTick;
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
      let moved = false;

      if (this.keys['w'] || this.keys['arrowup']) { dy = -1; this.player.dir = 'up'; this.clearClickMoveTarget(); }
      else if (this.keys['s'] || this.keys['arrowdown']) { dy = -1 * -1; this.player.dir = 'down'; this.clearClickMoveTarget(); }
      else if (this.keys['a'] || this.keys['arrowleft']) { dx = -1; this.player.dir = 'left'; this.clearClickMoveTarget(); }
      else if (this.keys['d'] || this.keys['arrowright']) { dx = 1; this.player.dir = 'right'; this.clearClickMoveTarget(); }
      else if (this.player.targetX !== null && this.player.targetY !== null) {
        const speed = this.currentArea === 'exterior' ? 0.042 : 0.046;
        if (!this.player.path || this.player._pathArea !== this.currentArea ||
            this.player._pathGoalX !== this.player.targetX || this.player._pathGoalY !== this.player.targetY) {
          this.setClickMoveTarget(this.player.targetX, this.player.targetY);
        }
        if (this.player.path && this.player.path.length > 0) {
          moved = this.stepAlongClickPath(speed) > 0.0005;
        } else {
          this.clearClickMoveTarget();
        }
      }

      if (dx !== 0 || dy !== 0) {
        const speed = this.currentArea === 'exterior' ? 0.042 : 0.046;
        const nx = this.player.x + dx * speed;
        const ny = this.player.y + dy * speed;
        if (!this.isBlocked(nx, this.player.y)) this.player.x = nx;
        if (!this.isBlocked(this.player.x, ny)) this.player.y = ny;
        moved = true;
      }

      if (moved) {
        this.player.moving = true;
        this.player.walkTick += 0.11;

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
          const fSpeed = this.currentArea === 'exterior' ? 0.039 : 0.043;
          friend.x += (fdx / fdist) * fSpeed;
          friend.y += (fdy / fdist) * fSpeed;
          friend.walkTick = (friend.walkTick || 0) + 0.11;
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

      // Smooth camera scroll for exterior & zoomed mobile interiors
      const zoom = this.getAreaZoom();
      const rect = this.canvas ? this.canvas.getBoundingClientRect() : null;
      const isCover = rect && rect.width > 0 && rect.height > 0 && window.getComputedStyle(this.canvas).objectFit === 'cover';
      const viewW = this.canvas.width / zoom;
      const viewH = this.canvas.height / zoom;
      const visibleW = isCover ? Math.min(viewW, viewH * (rect.width / rect.height)) : viewW;
      const visibleH = isCover ? Math.min(viewH, viewW * (rect.height / rect.width)) : viewH;

      if (this.currentArea === 'exterior') {
        const minCenterY = visibleH / 2;
        const maxCenterY = Math.max(minCenterY, this.EXT_ROWS * this.TILE - visibleH / 2);
        const targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, this.player.y * this.TILE));
        const targetCamY = targetCenterY - viewH / 2;
        this.cameraY += (targetCamY - this.cameraY) * 0.18;

        const minCenterX = visibleW / 2;
        const maxCenterX = Math.max(minCenterX, this.EXT_COLS * this.TILE - visibleW / 2);
        const targetCenterX = Math.max(minCenterX, Math.min(maxCenterX, this.player.x * this.TILE));
        const targetCamX = targetCenterX - viewW / 2;
        this.cameraX += (targetCamX - this.cameraX) * 0.18;

        const inPark = this.player.x >= 16.0;
        if (this._lastInPark !== inPark) {
          this._lastInPark = inPark;
          this.updateHUDSaveInfo();
        }
      } else if (zoom > 1) {
        const padX = 64;
        const minCenterX = Math.min(this.canvas.width / 2, padX + visibleW / 2);
        const maxCenterX = Math.max(minCenterX, this.canvas.width - padX - visibleW / 2);
        const targetCenterX = Math.max(minCenterX, Math.min(maxCenterX, this.player.x * this.TILE));
        const targetCamX = targetCenterX - viewW / 2;
        this.cameraX += (targetCamX - this.cameraX) * 0.18;

        const padTop = 36;
        const padBottom = 48;
        const minCenterY = Math.min(this.canvas.height / 2, padTop + visibleH / 2);
        const maxCenterY = Math.max(minCenterY, this.canvas.height - padBottom - visibleH / 2);
        const targetCenterY = Math.max(minCenterY, Math.min(maxCenterY, this.player.y * this.TILE));
        const targetCamY = targetCenterY - viewH / 2;
        this.cameraY += (targetCamY - this.cameraY) * 0.18;
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
      ctx.imageSmoothingEnabled = false;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;

      // 1. Warm Timber Cutaway Diorama Void
      this.initCobblestonePattern();
      ctx.fillStyle = '#1f1712';
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

      if (this.woodFloorPattern) {
        ctx.fillStyle = this.woodFloorPattern;
        ctx.fillRect(rx, floorTop - 30, rw, rh);
      } else {
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

      // Subtle cream wall plaster accent (well above furniture)
      ctx.strokeStyle = 'rgba(184, 179, 136, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx + 215, ry + 52, 24, 12);

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

      // 7. Furniture Piece 1: Wooden Bed in Top-Left Corner
      const bedX = rx + 62;
      const bedY = ry + 112;
      const bedW = 104;
      const bedH = 178;

      if (this.isImgReady('furniture_bed')) {
        const bImg = this.owSprites.furniture_bed;
        const bw = 128;
        const bh = Math.round(bw * (bImg.height / bImg.width));
        ctx.fillStyle = 'rgba(0,0,0,0.34)';
        ctx.beginPath(); ctx.ellipse(bedX + bedW / 2, bedY + bh - 8, 56, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(bImg, bedX - 10, bedY + 14, bw, bh);
      } else {
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
      }

      // 8. Furniture Piece 2: 4-Drawer Wooden Dresser next to Bed
      const drX = bedX + bedW + 18;
      const drY = ry + 112;
      const drW = 118;
      const drH = 98;
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(drX + 3, drY + 6, drW, drH);
      ctx.strokeStyle = '#29170a';
      ctx.lineWidth = 2.4;
      ctx.fillStyle = '#8b5e39';
      ctx.fillRect(drX, drY, drW, drH);
      ctx.strokeRect(drX, drY, drW, drH);
      ctx.fillStyle = '#a8764c';
      ctx.fillRect(drX - 2, drY, drW + 4, 24);
      ctx.strokeRect(drX - 2, drY, drW + 4, 24);

      // 4 Drawers with brass handles
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const dx = drX + 8 + c * 54;
          const dy = drY + 30 + r * 30;
          ctx.fillStyle = '#754d2d';
          ctx.fillRect(dx, dy, 48, 24);
          ctx.strokeRect(dx, dy, 48, 24);
          ctx.fillStyle = '#e2b857';
          ctx.fillRect(dx + 16, dy + 10, 16, 4);
        }
      }
      // Small carved Mythos Deck Box sitting cleanly on top of the dresser
      ctx.fillStyle = '#5c3b20';
      ctx.fillRect(drX + 12, drY - 8, 30, 22);
      ctx.strokeRect(drX + 12, drY - 8, 30, 22);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(drX + 23, drY + 1, 8, 5);

      // 9. Furniture Piece 3: Tall Carved Wooden TV Armoire
      const arX = drX + drW + 12;
      const arY = ry + 64;
      const arW = 132;
      const arH = 146;
      if (this.isImgReady('furniture_tv')) {
        const tvImg = this.owSprites.furniture_tv;
        const tw = 122;
        const th = Math.round(tw * (tvImg.height / tvImg.width));
        const txDraw = arX + Math.round((arW - tw) / 2);
        const tyDraw = arY + 14;
        ctx.fillStyle = 'rgba(0,0,0,0.34)';
        ctx.beginPath(); ctx.ellipse(arX + arW / 2, tyDraw + th - 6, 52, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(tvImg, txDraw, tyDraw, tw, th);
        if (this.tvOn) {
          const pulse = Math.sin(this.tick * 0.2) * 0.5 + 0.5;
          const scX = txDraw + 22;
          const scY = tyDraw + 10;
          const scW = tw - 44;
          const scH = Math.round(th * 0.34);
          ctx.fillStyle = pulse > 0.5 ? 'rgba(56, 189, 248, 0.32)' : 'rgba(250, 204, 21, 0.26)';
          ctx.fillRect(scX, scY, scW, scH);
          ctx.fillStyle = pulse > 0.5 ? '#fde047' : '#7dd3fc';
          ctx.font = 'bold 9.5px "Cinzel", serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ MYTHOS! ⚡', txDraw + tw / 2, scY + Math.round(scH * 0.66));
        }
      } else {
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
      if (this.isImgReady('furniture_bookshelf')) {
        const bsImg = this.owSprites.furniture_bookshelf;
        const bsh = 136;
        const bsw = Math.round(bsh * (bsImg.width / bsImg.height));
        ctx.drawImage(bsImg, bkX + Math.round((bkW - bsw) / 2), bkY + 2, bsw, bsh);
      } else {
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

      if (this.isImgReady('furniture_table_book')) {
        const tbImg = this.owSprites.furniture_table_book;
        const tw = 128;
        const th = Math.round(tw * (tbImg.height / tbImg.width));
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath(); ctx.ellipse(tbX, tbY + 24, 60, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(tbImg, Math.round(tbX - tw / 2), Math.round(tbY - th / 2 + 8), tw, th);
      } else {
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
    }

    // =========================================================================
    // FRIEND'S HOUSE INTERIOR (Illustrated 16/32-bit Pixel-Art Cutaway Diorama)
    // - Harmonizes directly with cottage_friend.png (warm cream walls, slate
    //   accents, cedar timber beams, stone chimney hearth) and OwSprites.
    // - Preserves all collision bounds, doorway (9.3*S), table (5.5*S, 6.8*S),
    //   and Mike (crimson/gold) vs AJ (emerald/gold) personalization.
    // =========================================================================
    renderFriendHouseInterior() {
      const ctx = this.ctx;
      ctx.imageSmoothingEnabled = false;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;
      const fName = this.friendName || 'Mike';
      const isAJ = fName === 'AJ';

      // 1. Ensure high-res Overworld tile patterns (wood planks, etc.) are built
      this.initCobblestonePattern();

      // Deep warm cutaway void around the architectural shell
      ctx.fillStyle = '#1b1411';
      ctx.fillRect(0, 0, W, H);

      // Room coordinates (matching collision & Player House diorama geometry)
      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4

      const INK = '#26130e';
      const accentDark = isAJ ? '#134e3a' : '#641b25';
      const accentMid = isAJ ? '#1b6d51' : '#8f2533';
      const accentHi = isAJ ? '#28966f' : '#b83546';
      const accentTrim = isAJ ? '#fbbf24' : '#f59e0b';

      const snap = (v) => Math.round(v / 2) * 2;

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

      // Helper: Chunky pixel-art filled + 2px dark-ink-outlined rectangle
      const pxBox = (x, y, w, h, fill, hi = null, shade = null, ink = INK, lw = 2) => {
        const sx = snap(x), sy = snap(y), sw = snap(w), sh = snap(h);
        ctx.fillStyle = fill;
        ctx.fillRect(sx, sy, sw, sh);
        if (hi) {
          ctx.fillStyle = hi;
          ctx.fillRect(sx + lw, sy + lw, sw - lw * 2, 4);
        }
        if (shade) {
          ctx.fillStyle = shade;
          ctx.fillRect(sx + lw, sy + sh - lw - 4, sw - lw * 2, 4);
        }
        if (ink) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = lw;
          ctx.strokeRect(sx, sy, sw, sh);
        }
      };

      // 2. Textured Warm Oak/Chestnut Wood Plank Floor + Soft Ambient Shadows
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

      if (this.woodFloorPattern) {
        ctx.fillStyle = this.woodFloorPattern;
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        // Subtle warm chestnut tone shift so Friend's home feels distinct yet unified
        ctx.fillStyle = 'rgba(90, 42, 16, 0.14)';
        ctx.fillRect(rx, floorTop - 30, rw, rh);
      } else {
        ctx.fillStyle = '#7e5638';
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        const plankH = 32;
        for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
          ctx.fillStyle = row % 2 === 0 ? '#855c3c' : '#785033';
          ctx.fillRect(rx, y, rw, plankH);
          ctx.fillStyle = '#5c3b22';
          ctx.fillRect(rx, y + plankH - 2, rw, 2);
        }
      }

      // Grounding ambient shadow cast by north baseboard onto floorboards
      const wallShadow = ctx.createLinearGradient(0, floorTop - 16, 0, floorTop + 28);
      wallShadow.addColorStop(0, 'rgba(20, 9, 4, 0.42)');
      wallShadow.addColorStop(1, 'rgba(20, 9, 4, 0)');
      ctx.fillStyle = wallShadow;
      ctx.fillRect(rx, floorTop - 16, rw, 44);

      // Subtle warm firelight pool spilling from the stone hearth onto floor & rug
      const hearthX = rx + 518;
      const hearthY = floorTop + 14;
      const fireFlicker = Math.sin(this.tick * 0.22) * 8 + Math.cos(this.tick * 0.37) * 4;
      const fireGlow = ctx.createRadialGradient(hearthX, hearthY, 10, hearthX, hearthY + 42, 175 + fireFlicker);
      fireGlow.addColorStop(0, 'rgba(255, 174, 52, 0.26)');
      fireGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.10)');
      fireGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(hearthX - 190, floorTop - 20, 380, 240);

      // Bottom Cutaway Timber Threshold Beam
      pxBox(rx, ry + rh - 18, rw, 18, '#5c3a22', '#7d5233', '#3b2212', INK, 2.5);

      // 3. Woven Chamfered Duelist Arena Rug (Left) + Fringed Border Pixels
      const rugX = snap(rx + 46);
      const rugY = snap(floorTop + 22);
      const rugW = 396;
      const rugH = 354;
      const ch = 26;

      // Ground shadow under rug
      ctx.fillStyle = 'rgba(20, 9, 4, 0.28)';
      drawChamferedRect(rugX + 2, rugY + 4, rugW, rugH, ch);
      ctx.fill();

      // Pixel-fringed golden cream rug tassels along left & right edges
      ctx.fillStyle = '#e7d5ad';
      for (let ty = rugY + ch + 8; ty < rugY + rugH - ch - 8; ty += 12) {
        ctx.fillRect(rugX - 6, ty, 6, 4);
        ctx.fillRect(rugX + rugW, ty, 6, 4);
        ctx.fillStyle = '#b99c68';
        ctx.fillRect(rugX - 6, ty + 4, 6, 2);
        ctx.fillRect(rugX + rugW, ty + 4, 6, 2);
        ctx.fillStyle = '#e7d5ad';
      }

      // Main deep woven cloth fill
      ctx.fillStyle = accentDark;
      drawChamferedRect(rugX, rugY, rugW, rugH, ch);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner lighter woven field + subtle horizontal loom weave lines
      ctx.fillStyle = accentMid;
      drawChamferedRect(rugX + 10, rugY + 10, rugW - 20, rugH - 20, ch - 4);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let wy = rugY + 16; wy < rugY + rugH - 16; wy += 8) {
        ctx.fillRect(rugX + 24, wy, rugW - 48, 2);
      }

      // Gold woven double border + corner diamond studs
      ctx.strokeStyle = accentTrim;
      ctx.lineWidth = 2.5;
      drawChamferedRect(rugX + 14, rugY + 14, rugW - 28, rugH - 28, ch - 6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(253, 224, 71, 0.26)';
      ctx.lineWidth = 2;
      drawChamferedRect(rugX + 24, rugY + 24, rugW - 48, rugH - 48, ch - 10);
      ctx.stroke();

      // Woven Mythos Duel Ring in center of Arena Rug
      const rcX = rugX + rugW / 2;
      const rcY = rugY + rugH / 2;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.34)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rcX, rcY, 76, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rcX, rcY, 64, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary Slate-Blue Bedside Runner Rug (Positioned cleanly below bed plant nook)
      const bRugX = snap(rx + rw - 242);
      const bRugY = snap(floorTop + 86);
      const bRugW = 176;
      const bRugH = 198;
      ctx.fillStyle = 'rgba(20, 9, 4, 0.26)';
      drawChamferedRect(bRugX + 2, bRugY + 4, bRugW, bRugH, 16);
      ctx.fill();

      ctx.fillStyle = '#e7d5ad';
      for (let tx = bRugX + 20; tx < bRugX + bRugW - 20; tx += 12) {
        ctx.fillRect(tx, bRugY - 5, 4, 5);
        ctx.fillRect(tx, bRugY + bRugH, 4, 5);
      }

      ctx.fillStyle = '#334c63';
      drawChamferedRect(bRugX, bRugY, bRugW, bRugH, 16);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#405f7b';
      drawChamferedRect(bRugX + 8, bRugY + 8, bRugW - 16, bRugH - 16, 12);
      ctx.fill();
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = 1.5;
      drawChamferedRect(bRugX + 16, bRugY + 16, bRugW - 32, bRugH - 32, 8);
      ctx.stroke();

      ctx.restore();

      // 4. Warm Cream Plaster & Slate-Trimmed North Wall (Matches cottage_friend.png!)
      ctx.fillStyle = '#ebe5cc';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Subtle warm horizontal cream clapboard / plaster courses on upper wall
      ctx.fillStyle = '#dcd4b6';
      for (let cy = ry + 48; cy < floorTop - 72; cy += 22) {
        ctx.fillRect(rx + 70, cy, rw - 140, 2);
      }

      // Upper shadow beneath timber wall crown molding
      ctx.fillStyle = 'rgba(60, 34, 18, 0.16)';
      ctx.fillRect(rx + 68, ry + 31, rw - 136, 10);

      // Slate-Blue Continuous Dado Rail following North & Angled Wing Walls
      const wainTop = floorTop - 68;
      ctx.fillStyle = '#486073';
      ctx.beginPath();
      ctx.moveTo(rx + 28, wainTop + 16);
      ctx.lineTo(rx + 68, wainTop - 10);
      ctx.lineTo(rx + rw - 68, wainTop - 10);
      ctx.lineTo(rx + rw - 28, wainTop + 16);
      ctx.lineTo(rx + rw - 28, wainTop + 26);
      ctx.lineTo(rx + rw - 68, wainTop);
      ctx.lineTo(rx + 68, wainTop);
      ctx.lineTo(rx + 28, wainTop + 26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Carved Cedar Wainscoting Paneling along Lower Half of North Wall
      ctx.fillStyle = '#6c452b';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top chair-rail bevel highlight across flat wall
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(rx + 68, wainTop + 1, rw - 136, 5);

      // Recessed Pixel Wainscoting Panels across North Wall
      for (let px = rx + 82; px < rx + rw - 98; px += 46) {
        pxBox(px, wainTop + 10, 34, 38, '#54331e', '#412514', '#7e5235', INK, 2);
      }

      // Angled Wing Wall vertical corner lines
      ctx.strokeStyle = '#bfb697';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // Deep Walnut Baseboard along North Wall and Wing Walls
      ctx.fillStyle = '#452817';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 5. Chunky Walnut Cutaway Wall Cap & Side-Wall Pillars
      ctx.fillStyle = '#6c452b';
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

      // Warm beveled highlight rim along top beam
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(rx + 38, ry + 3, rw - 76, 6);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
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
      ctx.stroke();

      // Lower Cream Plaster & Slate-Stone Side-Wall Cutaway Pillars
      [rx, rx + rw - 28].forEach(px => {
        pxBox(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18, '#ebe5cc', '#f6f1dd', '#cfc7a6', INK, 2.5);
        pxBox(px + 4, floorTop + 245, 20, 16, '#64748b', '#94a3b8', '#475569', INK, 2);
      });

      // 6. Cutaway Slate & Oak Entrance Doorstep Threshold (exit at 9.3 * S)
      const doorX = snap(9.3 * S);
      const doorY = snap(ry + rh - 22);
      // Warm interior woven welcome mat just inside the threshold
      pxBox(doorX + 4, doorY - 24, 78, 22, accentMid, accentHi, accentDark, INK, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(doorX + 10, doorY - 18, 66, 2);
      ctx.fillRect(doorX + 10, doorY - 8, 66, 2);
      // Chunky walnut door jamb posts
      pxBox(doorX - 18, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      pxBox(doorX + 86, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      // Beveled stone doorstep slabs
      pxBox(doorX, doorY + 4, 86, 22, '#64748b', '#94a3b8', '#475569', INK, 2.5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(doorX + 42, doorY + 6, 2, 16);

      // 7. Far-Left Corner Accent + Framed Mythos Phoenix Banner + Collector Bookshelf
      // Small Potted Plant in top-left wing corner (well above walkable floor)
      if (this.isImgReady('pot_small')) {
        const psImg = this.owSprites.pot_small;
        const psw = 34;
        const psh = Math.round(psw * (psImg.height / psImg.width));
        ctx.fillStyle = 'rgba(20, 9, 4, 0.34)';
        ctx.beginPath(); ctx.ellipse(rx + 50, floorTop - 6, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(psImg, snap(rx + 33), snap(floorTop - 6 - psh), psw, psh);
      }

      // Framed "SOLAR PHOENIX" Championship Banner Poster
      const pstX = snap(rx + 74);
      const pstY = snap(ry + 48);
      const pstW = 72;
      const pstH = 92;
      ctx.fillStyle = 'rgba(20, 9, 4, 0.28)';
      ctx.fillRect(pstX + 3, pstY + 5, pstW, pstH);
      pxBox(pstX, pstY, pstW, pstH, '#6c452b', '#a47247', '#452817', INK, 2.5);
      // Recessed Poster Artwork
      pxBox(pstX + 6, pstY + 6, pstW - 12, pstH - 12, accentDark, accentMid, '#1e1b4b', '#fbbf24', 2);
      // Crisp 2px pixel-art Phoenix Emblem inside poster
      const pxMid = pstX + 36;
      const pyTop = pstY + 16;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pxMid - 4, pyTop, 8, 28);       // body spine
      ctx.fillRect(pxMid - 20, pyTop + 6, 40, 8);  // upper wingspan
      ctx.fillRect(pxMid - 24, pyTop + 2, 10, 6);  // left wingtip
      ctx.fillRect(pxMid + 14, pyTop + 2, 10, 6);  // right wingtip
      ctx.fillRect(pxMid - 12, pyTop + 14, 24, 6); // mid plumage
      ctx.fillRect(pxMid - 6, pyTop + 28, 4, 10);  // left tail plume
      ctx.fillRect(pxMid + 2, pyTop + 28, 4, 10);  // right tail plume
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(pxMid - 2, pyTop + 4, 4, 12);   // chest highlight
      ctx.fillStyle = '#fde047';
      ctx.fillRect(pstX + 14, pstY + pstH - 16, pstW - 28, 4);

      // Illustrated Collector Shelf (uses OwSprites furniture_bookshelf + Gold Trophy!)
      const shX = snap(pstX + pstW + 18);
      const shY = snap(ry + 62);
      const shW = 148;
      const shH = 144;
      if (this.isImgReady('furniture_bookshelf')) {
        const bsImg = this.owSprites.furniture_bookshelf;
        const bsh = 140;
        const bsw = snap(bsh * (bsImg.width / bsImg.height));
        const bsDrawX = snap(shX + (shW - bsw) / 2);
        const bsDrawY = snap(shY + 4);
        ctx.fillStyle = 'rgba(20, 9, 4, 0.36)';
        ctx.beginPath(); ctx.ellipse(shX + shW / 2, bsDrawY + bsh - 2, bsw * 0.48, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(bsImg, bsDrawX, bsDrawY, bsw, bsh);

        // Championship Gold Cup sitting proudly on the top ledge of the bookshelf!
        const cupX = snap(shX + shW / 2);
        const cupY = snap(bsDrawY + 4);
        pxBox(cupX - 10, cupY - 6, 20, 6, '#5c3a22', '#8b5e3c', '#3b2212', INK, 2);
        pxBox(cupX - 4, cupY - 12, 8, 6, '#d97706', '#fbbf24', '#92400e', INK, 2);
        pxBox(cupX - 10, cupY - 24, 20, 12, '#f59e0b', '#fef08a', '#b45309', INK, 2);
        // Handles & glint
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cupX - 14, cupY - 22, 4, 8);
        ctx.fillRect(cupX + 10, cupY - 22, 4, 8);
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(cupX - 6, cupY - 20, 4, 6);
      } else {
        pxBox(shX, shY, shW, shH, '#6c452b', '#8b5e3c', '#452817', INK, 2.5);
        pxBox(shX - 4, shY, shW + 8, 18, '#8b5e3c', '#a47247', '#5c3a22', INK, 2);
      }

      // 8. Arched Slate-Trimmed Window + Animated Sunbeam / Moonlight Shaft
      const winX = snap(shX + shW + 22);
      const winY = snap(ry + 50);
      const winW = 70;
      const winH = 96;

      // Slate-blue shutter accents matching cottage_friend.png exterior windows!
      pxBox(winX - 12, winY + 28, 12, winH - 28, '#486073', '#6b859a', '#314352', INK, 2);
      pxBox(winX + winW, winY + 28, 12, winH - 28, '#486073', '#6b859a', '#314352', INK, 2);

      // Arched Oak Window Frame
      ctx.fillStyle = '#784d31';
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 34, winW / 2, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Window Glass Panes (warm amber glow at dusk/evening or crisp sky daylight)
      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + winW / 2, winY + 36, winW / 2 - 8, Math.PI, 0);
      ctx.lineTo(winX + winW - 8, winY + winH - 12);
      ctx.lineTo(winX + 8, winY + winH - 12);
      ctx.closePath();
      ctx.clip();

      const isNight = this.settings.timeOfDay === 'night';
      const winG = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      if (isNight) {
        winG.addColorStop(0, '#1e293b');
        winG.addColorStop(1, '#334155');
      } else {
        winG.addColorStop(0, '#bae6fd');
        winG.addColorStop(0.55, '#e0f2fe');
        winG.addColorStop(1, '#fef08a');
      }
      ctx.fillStyle = winG;
      ctx.fillRect(winX, winY, winW, winH);

      // Chunky Cross Mullions
      ctx.fillStyle = '#5c3a22';
      ctx.fillRect(winX + winW / 2 - 3, winY + 6, 6, winH - 16);
      ctx.fillRect(winX + 6, winY + 46, winW - 12, 6);
      ctx.restore();

      // Protruding Wooden Windowsill + Small Sill Terracotta Planter
      pxBox(winX - 6, winY + winH - 10, winW + 12, 12, '#8b5e3c', '#a47247', '#5c3a22', INK, 2);

      // Soft Window Light Beam across north wall and floor (sunlit daytime / cool moonlit night)
      ctx.save();
      const beamG = ctx.createLinearGradient(winX, winY + winH, winX - 70, floorTop + 170);
      if (isNight) {
        beamG.addColorStop(0, 'rgba(147, 197, 253, 0.14)');
        beamG.addColorStop(1, 'rgba(147, 197, 253, 0)');
      } else {
        beamG.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
        beamG.addColorStop(0.6, 'rgba(253, 224, 71, 0.08)');
        beamG.addColorStop(1, 'rgba(253, 224, 71, 0)');
      }
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.moveTo(winX + 8, winY + winH - 10);
      ctx.lineTo(winX + winW - 8, winY + winH - 10);
      ctx.lineTo(winX + winW - 58, floorTop + 176);
      ctx.lineTo(winX - 78, floorTop + 176);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 9. Hand-Pixelled Cobblestone Chimney & Crackling Hearth (Matches cottage_friend.png Chimney!)
      const fpX = snap(winX + winW + 26);
      const fpY = snap(ry + 30);
      const fpW = 148;
      const fpH = 186;

      // Ground shadow beside chimney
      ctx.fillStyle = 'rgba(20, 9, 4, 0.34)';
      ctx.fillRect(fpX - 4, fpY + 8, fpW + 8, fpH + 14);

      // Mortar backing
      pxBox(fpX, fpY, fpW, fpH, '#47423e', null, null, INK, 3);

      // Pixel-art Ashlar Masonry Courses (2px stepped stones matching cottage_friend.png chimney)
      const masonryCols = ['#7b746e', '#655f5a', '#8c857e', '#6f6963', '#968f88'];
      for (let sr = 0; sr < 8; sr++) {
        const sy = snap(fpY + 4 + sr * 22);
        const rowShift = (sr % 2) * 16;
        for (let sc = -1; sc < 5; sc++) {
          const bx = snap(fpX + 4 + rowShift + sc * 32);
          const bw = 28;
          const drawLeft = Math.max(fpX + 4, bx);
          const drawRight = Math.min(fpX + fpW - 4, bx + bw);
          if (drawRight - drawLeft >= 10) {
            const baseCol = masonryCols[(sr * 3 + sc + 5) % masonryCols.length];
            ctx.fillStyle = baseCol;
            ctx.fillRect(drawLeft, sy, drawRight - drawLeft, 18);
            ctx.fillStyle = '#a39c95';
            ctx.fillRect(drawLeft, sy, drawRight - drawLeft, 4);
            ctx.fillStyle = '#3a3531';
            ctx.fillRect(drawLeft, sy + 16, drawRight - drawLeft, 2);
            ctx.fillRect(drawRight - 2, sy, 2, 18);
          }
        }
      }
      // Re-stroke heavy outer chimney ink border cleanly
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeRect(fpX, fpY, fpW, fpH);

      // Carved Walnut Mantelpiece with Bevel & Decorative Braces
      pxBox(fpX - 10, fpY + 76, fpW + 20, 18, '#784d31', '#a47247', '#452817', INK, 2.5);
      pxBox(fpX + 6, fpY + 94, 14, 10, '#5c3a22', null, null, INK, 2);
      pxBox(fpX + fpW - 20, fpY + 94, 14, 10, '#5c3a22', null, null, INK, 2);

      // Above Mantel: Heraldic Mythos Shield + Candle Sconces / Vials
      const shCx = snap(fpX + fpW / 2);
      const shCy = snap(fpY + 42);
      ctx.fillStyle = accentDark;
      ctx.beginPath();
      ctx.moveTo(shCx - 18, shCy - 18);
      ctx.lineTo(shCx + 18, shCy - 18);
      ctx.lineTo(shCx + 18, shCy + 4);
      ctx.lineTo(shCx, shCy + 22);
      ctx.lineTo(shCx - 18, shCy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Inner shield emblem cross
      ctx.fillStyle = '#fde047';
      ctx.fillRect(shCx - 2, shCy - 12, 4, 24);
      ctx.fillRect(shCx - 10, shCy - 4, 20, 4);

      // Small Brass Candlesticks sitting on the Mantel Shelf
      [fpX + 12, fpX + fpW - 24].forEach((cx, ci) => {
        pxBox(cx, fpY + 62, 12, 14, '#d97706', '#fef08a', '#92400e', INK, 2);
        const fOff = Math.sin(this.tick * 0.25 + ci * 2) > 0 ? 0 : 2;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx + 4, fpY + 54 - fOff, 4, 8);
      });

      // Raised Stone Hearth Apron onto Floorboard
      pxBox(fpX - 12, fpY + fpH - 8, fpW + 24, 24, '#6b655f', '#968f88', '#47423e', INK, 2.5);
      ctx.fillStyle = '#3a3531';
      ctx.fillRect(fpX + 36, fpY + fpH - 6, 2, 20);
      ctx.fillRect(fpX + 104, fpY + fpH - 6, 2, 20);

      // Stepped Pixel Firebox Opening & Crackling Animated Pixel Flames
      const fbX = snap(fpX + 28);
      const fbY = snap(fpY + 102);
      const fbW = fpW - 56;
      const fbH = 76;
      pxBox(fbX - 4, fbY - 4, fbW + 8, fbH + 4, '#56514d', '#7b746e', '#3a3531', INK, 2.5);
      ctx.fillStyle = '#19110e';
      ctx.fillRect(fbX, fbY + 8, fbW, fbH - 8);
      ctx.fillRect(fbX + 8, fbY, fbW - 16, 10);

      // Charred firewood logs + glowing coal bed
      pxBox(fbX + 14, fbY + fbH - 18, fbW - 28, 10, '#5c2d16', '#7c4322', '#2d1206', INK, 2);
      pxBox(fbX + 20, fbY + fbH - 22, fbW - 40, 8, '#6e371b', '#8d4c2a', '#2d1206', INK, 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fbX + 20, fbY + fbH - 12, fbW - 40, 4);

      // Crisp 2px pixel-art flickering flame tongue columns
      const flA = Math.round(Math.sin(this.tick * 0.25) * 3) * 2;
      const flB = Math.round(Math.cos(this.tick * 0.34) * 2) * 2;
      ctx.fillStyle = '#ea580c'; // Deep flame orange
      ctx.fillRect(fbX + 20, fbY + 40 - flB, fbW - 40, 20 + flB);
      ctx.fillRect(fbX + 28, fbY + 26 - flA, fbW - 56, 20 + flA);
      ctx.fillRect(fbX + fbW / 2 - 8, fbY + 16 + flB, 16, 14);
      ctx.fillStyle = '#facc15'; // Inner golden flame
      ctx.fillRect(fbX + 28, fbY + 42, fbW - 56, 16);
      ctx.fillRect(fbX + fbW / 2 - 10, fbY + 28 - flA, 20, 18 + flA);
      ctx.fillStyle = '#fef9c3'; // White-hot flame core
      ctx.fillRect(fbX + fbW / 2 - 6, fbY + 44 - flB, 12, 12 + flB);

      // Cozy Iron Firewood Rack / Poker tucked safely beside hearth (inside tx <= 11.4, ty < 4.85)
      pxBox(fpX + fpW + 8, fpY + fpH - 36, 28, 34, '#334155', '#64748b', '#1e293b', INK, 2);
      pxBox(fpX + fpW + 12, fpY + fpH - 30, 20, 10, '#784d31', '#a47247', null, INK, 1.5);
      pxBox(fpX + fpW + 14, fpY + fpH - 22, 16, 10, '#6e371b', '#8d4c2a', null, INK, 1.5);

      // 10. Far-Right Bedroom Nook: Nightstand + Potted Plant + Illustrated Pixel-Art Bed!
      // Compact Carved Walnut Nightstand between Hearth & Bed (safely inside tx > 11.35 && ty < 6.6)
      const nsX = snap(rx + rw - 200);
      const nsY = snap(ry + 114);
      ctx.fillStyle = 'rgba(20, 9, 4, 0.32)';
      ctx.fillRect(nsX + 2, nsY + 6, 44, 52);
      pxBox(nsX, nsY, 44, 52, '#784d31', '#a47247', '#452817', INK, 2.5);
      pxBox(nsX + 6, nsY + 20, 32, 14, '#5c3a22', null, null, INK, 1.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(nsX + 18, nsY + 25, 8, 4);
      // Warm bedside brass lantern atop nightstand
      pxBox(nsX + 12, nsY - 14, 20, 16, '#f59e0b', '#fef08a', '#b45309', INK, 2);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(nsX + 16, nsY - 10, 12, 8);

      // Lush Illustrated Potted Plant resting cleanly on hardwood beside the Bed (tx ~ 11.6, ty ~ 4.4)
      if (this.isImgReady('pot_large')) {
        const plImg = this.owSprites.pot_large;
        const plw = 46;
        const plh = Math.round(plw * (plImg.height / plImg.width));
        const plX = snap(nsX - 2);
        const plY = snap(nsY + 66);
        ctx.fillStyle = 'rgba(20, 9, 4, 0.34)';
        ctx.beginPath(); ctx.ellipse(plX + plw / 2, plY + plh - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(plImg, plX, plY, plw, plh);
      }

      // Friend's Pixel-Art Cedar Bed (flush to right wall inside tx > 11.35 && ty < 6.6)
      const bedW = 112;
      const bedH = 180;
      const bedX = snap(rx + rw - bedW - 42);
      const bedY = snap(ry + 114);

      ctx.fillStyle = 'rgba(20, 9, 4, 0.36)';
      ctx.fillRect(bedX + 4, bedY + 10, bedW, bedH);

      // Carved Cedar Headboard & Corner Posts with lighter beveled end-grain caps
      pxBox(bedX, bedY, bedW, 34, '#784d31', '#a47247', '#452817', INK, 2.5);
      pxBox(bedX, bedY - 8, 18, 28, '#92623a', '#c99362', '#5c3a22', INK, 2.5);
      pxBox(bedX + bedW - 18, bedY - 8, 18, 28, '#92623a', '#c99362', '#5c3a22', INK, 2.5);

      // Crisp Layered Sheet & Soft-Shaded Pixel Pillow
      pxBox(bedX + 4, bedY + 26, bedW - 8, 38, '#e2e8f0', '#f8fafc', '#cbd5e1', INK, 2.5);
      pxBox(bedX + 18, bedY + 16, bedW - 36, 30, '#f8fafc', '#ffffff', '#cbd5e1', INK, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bedX + bedW / 2 - 12, bedY + 28, 24, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bedX + 20, bedY + 22, 6, 16);
      ctx.fillRect(bedX + bedW - 26, bedY + 22, 6, 16);

      // Signature Quilted Blanket (Crimson/Gold for Mike, Emerald/Gold for AJ!)
      pxBox(bedX + 4, bedY + 58, bedW - 8, 92, accentMid, accentHi, accentDark, INK, 2.5);
      // Side bolster fold highlights for pillowed blanket volume
      ctx.fillStyle = accentHi;
      ctx.fillRect(bedX + 10, bedY + 72, 10, 68);
      ctx.fillStyle = accentDark;
      ctx.fillRect(bedX + bedW - 20, bedY + 72, 10, 68);
      // Folded crisp cream turnover sheet top
      pxBox(bedX + 4, bedY + 54, bedW - 8, 14, '#f1f5f9', '#ffffff', '#cbd5e1', INK, 2);
      // Gold horizontal tournament sash + stitched diamond crest
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bedX + 6, bedY + 98, bedW - 12, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bedX + 6, bedY + 98, bedW - 12, 4);
      ctx.fillStyle = accentDark;
      ctx.fillRect(bedX + 14, bedY + 80, bedW - 28, 2);
      ctx.fillRect(bedX + 14, bedY + 124, bedW - 28, 2);

      // Cedar Footboard & Lower Posts with beveled wood end-grain caps
      pxBox(bedX, bedY + 144, bedW, 34, '#784d31', '#a47247', '#452817', INK, 2.5);
      pxBox(bedX, bedY + 136, 18, 44, '#92623a', '#c99362', '#5c3a22', INK, 2.5);
      pxBox(bedX + bedW - 18, bedY + 136, 18, 44, '#92623a', '#c99362', '#5c3a22', INK, 2.5);

      // 11. Center-Left Duel Zone: Chunky Pixel-Art Chairs & Round Plank Mythos Duel Table
      const tbX = 5.5 * S; // 352
      const tbY = 6.8 * S; // 435.2

      // Left & Right Upholstered Oak Chairs framing Friend (4.1, 6.8) and Player
      [tbX - 96, tbX + 62].forEach((chX, idx) => {
        const cx = snap(chX);
        const cy = snap(tbY - 22);
        // Ground shadow
        ctx.fillStyle = 'rgba(20, 9, 4, 0.34)';
        ctx.fillRect(cx + 2, cy + 8, 36, 46);
        // Chair seat frame
        pxBox(cx, cy + 16, 36, 32, '#784d31', '#92623a', '#452817', INK, 2.5);
        // Plush velvet duelist cushion + gold button stud
        pxBox(cx + 4, cy + 18, 28, 20, accentMid, accentHi, accentDark, INK, 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(cx + 16, cy + 26, 4, 4);
        // Stepped carved backrest on outer edge
        const backX = idx === 0 ? cx - 2 : cx + 28;
        pxBox(backX, cy - 12, 10, 56, '#92623a', '#c99362', '#5c3a22', INK, 2.5);
      });

      // Duel Table Drop Shadow & Thick Carved Pedestal Legs
      ctx.fillStyle = 'rgba(20, 9, 4, 0.42)';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 20, 74, 52, 0, 0, Math.PI * 2); ctx.fill();
      pxBox(tbX - 48, tbY + 24, 12, 28, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(tbX + 36, tbY + 24, 12, 28, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(tbX - 6, tbY + 30, 12, 24, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);

      // Beveled Round Oak Tabletop Rim + Wood-Plank Grain Surface (inspired by furniture_table_book!)
      ctx.fillStyle = '#5c3a22';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 7, 72, 52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();

      ctx.save();
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 72, 50, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#92623a';
      ctx.fill();
      ctx.clip();
      // Tabletop horizontal wood planks, staggered plank seams & top crescent bevel highlight
      ctx.fillStyle = '#a97448';
      ctx.fillRect(tbX - 72, tbY - 50, 144, 22);
      ctx.fillStyle = '#c48f60';
      ctx.fillRect(tbX - 54, tbY - 48, 108, 6);
      ctx.fillStyle = '#73482c';
      [-28, -10, 8, 26].forEach((pyOff, pi) => {
        ctx.fillRect(tbX - 72, tbY + pyOff, 144, 2);
        const jx = pi % 2 === 0 ? tbX - 24 : tbX + 20;
        ctx.fillRect(jx, tbY + pyOff - 18, 2, 18);
      });
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 72, 50, 0, 0, Math.PI * 2);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();

      // Official Mythos Two-Player Tabletop Battle Mat, Stacked Decks & Battle Tokens!
      pxBox(tbX - 44, tbY - 24, 88, 48, '#23314c', '#364b73', '#162033', '#fbbf24', 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tbX - 1, tbY - 22, 2, 44);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(tbX, tbY, 8, 0, Math.PI * 2); ctx.stroke();

      // 3 Friend Cards (Left) & 3 Player Cards (Right) + 3D Deck Piles + Gold Counters!
      const friendCol = isAJ ? '#22c55e' : '#ef4444';
      [-16, -4, 8].forEach((ryOff, ci) => {
        pxBox(tbX - 32, tbY + ryOff, 14, 10, friendCol, '#fef08a', null, INK, 1.5);
        pxBox(tbX + 18, tbY + ryOff, 14, 10, '#38bdf8', '#e0f2fe', null, INK, 1.5);
        if (ci === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(tbX - 28, tbY + ryOff + 3, 6, 3);
          ctx.fillRect(tbX + 22, tbY + ryOff + 3, 6, 3);
        }
      });
      // Deck piles & brass counters outside playmat
      pxBox(tbX - 58, tbY - 12, 12, 18, accentDark, accentHi, null, INK, 2);
      pxBox(tbX + 46, tbY - 6, 12, 18, '#1e40af', '#60a5fa', null, INK, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tbX - 54, tbY + 14, 6, 6);
      ctx.fillRect(tbX + 48, tbY - 18, 6, 6);

      // 12. Warm Ambient Lamp & Hearth Light Bloom Pass (softly unifies props under dusk/night!)
      const lampBloom = ctx.createRadialGradient(nsX + 22, nsY - 6, 4, nsX + 22, nsY - 6, 78);
      lampBloom.addColorStop(0, isNight ? 'rgba(254, 240, 138, 0.32)' : 'rgba(254, 240, 138, 0.14)');
      lampBloom.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lampBloom;
      ctx.fillRect(nsX - 56, nsY - 84, 156, 156);

      if (isNight) {
        const hearthBloom = ctx.createRadialGradient(hearthX, hearthY - 14, 12, hearthX, hearthY + 24, 150 + fireFlicker);
        hearthBloom.addColorStop(0, 'rgba(251, 146, 60, 0.24)');
        hearthBloom.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = hearthBloom;
        ctx.fillRect(hearthX - 160, hearthY - 150, 320, 300);
      }
    }

    // =========================================================================
    // CARD SHOP INTERIOR RENDERER ("LEO'S CARD SHOP" — 16-bit Pixel Diorama)
    // Harmonized with card_shop.png & shop_banner.png:
    //   Warm oak planks, royal plum/indigo dado & shopkeeper rug, backlit MYTHOS
    //   signboard, booster & gacha display racks, leaded arched window, collector
    //   binder vault + illuminated single-card showcase, and duel playmat table!
    // =========================================================================
    renderCardShopInterior() {
      const t = this.tick || 0;
      const royalDark = '#2d1c4d';
      const royalMid = '#4c2c69';
      const royalHi = '#7c49ad';
      const nearCase = this.nearInteractable?.id === 'booster_display';

      const g = this._drawCutawayRoomShell({
        voidColor: '#15111b',
        floorTint: 'rgba(82, 46, 20, 0.11)',
        floorFallbackEven: '#876645',
        floorFallbackOdd: '#7a593a',
        wallUpper: '#ebe4c6',        // Warm parchment plaster
        wallCourseColor: '#d9d0ae',
        dadoColor: royalMid,         // Royal indigo-plum dado matching shop_banner.png!
        wainscotColor: '#633d24',
        railHighlight: '#966540',
        panelFill: '#4d2e1a',
        panelTopShade: '#361f10',
        panelBottomHi: '#784b2e',
        cornerTrimColor: '#c3b893',
        baseboardColor: '#3d2213',
        pillarMain: '#ebe4c6',
        pillarHi: '#f7f3e4',
        pillarShade: '#cdc4a3',
        pillarAccent: royalMid,
        pillarAccentHi: royalHi,
        pillarAccentShade: royalDark,
        matMid: royalMid,
        matHi: royalHi,
        matDark: royalDark,
        matTrim: '#fbbf24',
        stepMid: '#64748b',
        stepHi: '#94a3b8',
        stepDark: '#475569',
        onMatCrest: (doorX, doorY, { ctx }) => {
          // Mini pixel crossed Mythos Beast card crest woven into shop mat
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(doorX + 37, doorY - 17, 6, 8);
          ctx.fillRect(doorX + 43, doorY - 15, 6, 8);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(doorX + 39, doorY - 15, 2, 4);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(doorX + 45, doorY - 13, 2, 4);
        },
        onFloorDraw: ({ ctx, rx, floorTop, snap, drawChamferedRect, INK }) => {
          // A. Grand Fringed Collector Showcase Rug under Counter & West Aisles
          const rugX = snap(rx + 44);
          const rugY = snap(floorTop + 20);
          const rugW = 396;
          const rugH = 356;

          // Cream cotton fringe along left & right vertical edges
          ctx.fillStyle = '#e7d5ad';
          for (let fy = rugY + 26; fy < rugY + rugH - 26; fy += 10) {
            ctx.fillRect(rugX - 6, fy, 6, 4);
            ctx.fillRect(rugX + rugW, fy, 6, 4);
          }

          ctx.fillStyle = 'rgba(20, 12, 16, 0.28)';
          drawChamferedRect(rugX + 2, rugY + 6, rugW, rugH, 18);
          ctx.fill();

          ctx.fillStyle = royalDark;
          drawChamferedRect(rugX, rugY, rugW, rugH, 18);
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#38245c';
          drawChamferedRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16, 14);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          for (let py = rugY + 22; py < rugY + rugH - 22; py += 16) {
            ctx.fillRect(rugX + 24, py, rugW - 48, 2);
          }

          ctx.strokeStyle = 'rgba(251, 191, 36, 0.36)';
          ctx.lineWidth = 1.5;
          drawChamferedRect(rugX + 18, rugY + 18, rugW - 36, rugH - 36, 10);
          ctx.stroke();

          // Gold filigree corner accents on Collector Showcase Rug
          ctx.fillStyle = '#fbbf24';
          [
            [rugX + 26, rugY + 26],
            [rugX + rugW - 32, rugY + 26],
            [rugX + 26, rugY + rugH - 32],
            [rugX + rugW - 32, rugY + rugH - 32]
          ].forEach(([cxp, cyp]) => {
            ctx.fillRect(cxp, cyp, 6, 6);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(cxp + 2, cyp + 2, 2, 2);
            ctx.fillStyle = '#fbbf24';
          });

          // Four-Element Compass Diamond Medallion in Center Walking Aisle
          const rcx = snap(rugX + rugW / 2);
          const rcy = snap(rugY + 226);
          ctx.fillStyle = royalDark;
          ctx.beginPath();
          ctx.moveTo(rcx, rcy - 38);
          ctx.lineTo(rcx + 48, rcy);
          ctx.lineTo(rcx, rcy + 38);
          ctx.lineTo(rcx - 48, rcy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Elemental quadrant pips (Fire / Tide / Flora / Volt)
          ctx.fillStyle = '#ef4444'; ctx.fillRect(rcx - 14, rcy - 14, 12, 12);
          ctx.fillStyle = '#38bdf8'; ctx.fillRect(rcx + 2, rcy - 14, 12, 12);
          ctx.fillStyle = '#22c55e'; ctx.fillRect(rcx - 14, rcy + 2, 12, 12);
          ctx.fillStyle = '#fbbf24'; ctx.fillRect(rcx + 2, rcy + 2, 12, 12);
          ctx.fillStyle = '#fef08a'; ctx.fillRect(rcx - 4, rcy - 4, 8, 8);

          // B. Burgundy-Indigo Woven Arena Mat beneath Right In-Store Duel Table
          const aRugW = 192;
          const aRugH = 136;
          const aRugX = snap(672 - aRugW / 2);
          const aRugY = snap(435 - aRugH / 2);
          ctx.fillStyle = 'rgba(20, 12, 16, 0.24)';
          drawChamferedRect(aRugX + 2, aRugY + 6, aRugW, aRugH, 12);
          ctx.fill();
          ctx.fillStyle = '#5c2036';
          drawChamferedRect(aRugX, aRugY, aRugW, aRugH, 12);
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          drawChamferedRect(aRugX + 8, aRugY + 8, aRugW - 16, aRugH - 16, 8);
          ctx.stroke();

          // C. Warm Daylight Beam from North-Right Leaded Shop Window
          const beam = ctx.createLinearGradient(588, floorTop - 16, 540, floorTop + 210);
          beam.addColorStop(0, 'rgba(254, 249, 195, 0.20)');
          beam.addColorStop(0.55, 'rgba(254, 240, 138, 0.08)');
          beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(552, floorTop - 16);
          ctx.lineTo(628, floorTop - 16);
          ctx.lineTo(582, floorTop + 190);
          ctx.lineTo(486, floorTop + 190);
          ctx.closePath();
          ctx.fill();
        }
      });

      const { ctx, S, rx, ry, floorTop, INK, snap, pxBox } = g;

      // Helper: Draw crisp 2px block pixel lettering cleanly without blurry canvas fonts
      const drawPixelWord = (text, cx, cy, col) => {
        const glyphs = {
          M: ['10001', '11011', '10101', '10001', '10001'],
          Y: ['10001', '01010', '00100', '00100', '00100'],
          T: ['11111', '00100', '00100', '00100', '00100'],
          H: ['10001', '10001', '11111', '10001', '10001'],
          O: ['01110', '10001', '10001', '10001', '01110'],
          S: ['01111', '10000', '01110', '00001', '11110']
        };
        const scale = 2;
        const charW = 5 * scale + 4;
        const startX = snap(cx - (text.length * charW - 4) / 2);
        ctx.fillStyle = col;
        for (let i = 0; i < text.length; i++) {
          const rows = glyphs[text[i]];
          if (!rows) continue;
          const gx = startX + i * charW;
          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              if (rows[r][c] === '1') {
                ctx.fillRect(gx + c * scale, snap(cy + r * scale), scale, scale);
              }
            }
          }
        }
      };

      // 1. North-Left Wall: Carved Mahogany Booster & Trophy Cabinet (x: 146..266, y: 100..246)
      const cabX = snap(146);
      const cabY = snap(ry + 50); // 102 -> bottom ~246
      const cabW = 120;
      const cabH = 144;
      ctx.fillStyle = 'rgba(20, 12, 16, 0.36)';
      ctx.fillRect(cabX + 3, cabY + 6, cabW, cabH);
      pxBox(cabX, cabY, cabW, cabH, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(cabX - 4, cabY, cabW + 8, 16, '#8b5e3c', '#b98556', '#5c3a22', INK, 2);

      // 3 Tiered Velvet Display Bays stocked with Foil 1st-Ed Booster Boxes & Trophy Cup
      const packCols = [
        ['#ef4444', '#fca5a5'],
        ['#38bdf8', '#bae6fd'],
        ['#a855f7', '#e9d5ff'],
        ['#22c55e', '#bbf7d0'],
        ['#f59e0b', '#fef08a']
      ];
      for (let s = 0; s < 3; s++) {
        const sy = cabY + 22 + s * 38;
        pxBox(cabX + 8, sy, cabW - 16, 32, '#2d1c4d', '#1c1130', '#4c2c69', INK, 2);
        for (let p = 0; p < 4; p++) {
          const px = cabX + 14 + p * 24;
          if (s === 0 && p === 3) {
            // Gold Collector Cup Trophy in top-right cubby
            pxBox(px + 2, sy + 20, 14, 6, '#78350f', '#d97706', null, INK, 1.5);
            pxBox(px + 4, sy + 6, 10, 14, '#f59e0b', '#fef08a', '#b45309', INK, 1.5);
          } else {
            const [fill, hi] = packCols[(p + s * 2) % packCols.length];
            pxBox(px, sy + 6, 18, 22, fill, hi, null, '#fef08a', 1.5);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 4, sy + 12, 10, 6);
          }
        }
      }

      // Left Floor Blocked Zone (tx < 4.3, ty < 5.8 -> x: 142..274, y: 250..366):
      // Stepped Booster & Deck Gondola Rack + Vintage Glass Gacha Capsule Spinner
      const gnX = snap(146);
      const gnY = snap(floorTop + 8); // 254..314
      const gnW = 122;
      const gnH = 58;
      ctx.fillStyle = 'rgba(20, 12, 16, 0.34)';
      ctx.fillRect(gnX + 3, gnY + 6, gnW, gnH);
      pxBox(gnX, gnY, gnW, gnH, '#784d31', '#a47247', '#452817', INK, 2.5);
      // Slanted display trays with Starter Boxes & Foil Promo Slabs
      pxBox(gnX + 8, gnY + 8, 46, 20, '#312e81', '#6366f1', '#1e1b4b', '#fbbf24', 1.5);
      pxBox(gnX + 64, gnY + 8, 48, 20, '#7f1d1d', '#ef4444', '#450a0a', '#fbbf24', 1.5);
      // Fanned loose foil promo singles along front lip
      ['#f59e0b', '#38bdf8', '#22c55e', '#a855f7', '#ec4899'].forEach((sc, idx) => {
        pxBox(gnX + 10 + idx * 21, gnY + 32, 16, 18, sc, '#ffffff', null, INK, 1.5);
      });

      // Below Gondola (y: 318..366 <= 371): Glass Gacha Card Capsule Dispenser & Supply Box
      const gchX = snap(150);
      const gchY = snap(318);
      ctx.fillStyle = 'rgba(20, 12, 16, 0.32)';
      ctx.fillRect(gchX + 2, gchY + 4, 42, 46);
      pxBox(gchX + 4, gchY + 20, 36, 26, '#b91c1c', '#ef4444', '#7f1d1d', INK, 2);
      pxBox(gchX, gchY, 44, 24, '#bae6fd', '#ffffff', '#38bdf8', '#f59e0b', 2);
      [[gchX + 8, gchY + 8, '#f59e0b'], [gchX + 20, gchY + 6, '#ec4899'], [gchX + 28, gchY + 10, '#22c55e']].forEach(([cx, cy, col]) => {
        pxBox(cx, cy, 8, 8, col, '#ffffff', null, INK, 1.5);
      });
      pxBox(gchX + 16, gchY + 30, 12, 10, '#cbd5e1', '#ffffff', '#64748b', INK, 1.5);

      // Stamped Oak Booster Supply Crate beside Gacha Machine (208..264, y: 322..364)
      pxBox(208, 322, 56, 42, '#8b5e3c', '#b98556', '#5c3a22', INK, 2);
      pxBox(214, 314, 18, 12, '#4c1d95', '#a855f7', null, '#fbbf24', 1.5);
      pxBox(236, 316, 18, 10, '#0284c7', '#7dd3fc', null, '#fbbf24', 1.5);

      // 2. North-Center Back Wall Behind Leo: Illuminated "MYTHOS" Signboard + Foil Beast Posters + Back Shelves
      const banX = snap(292);
      const banY = snap(ry + 36); // 88 -> bottom 152 (clear above Leo at y~220)
      const banW = 236;
      const banH = 64;
      ctx.fillStyle = 'rgba(20, 12, 16, 0.36)';
      ctx.fillRect(banX + 4, banY + 6, banW, banH);
      pxBox(banX, banY, banW, banH, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(banX + 6, banY + 6, banW - 12, banH - 12, '#181232', '#2d1c4d', '#0f0b22', '#fbbf24', 2);

      pxBox(banX + 16, banY + 16, 22, 32, '#b91c1c', '#fca5a5', '#7f1d1d', '#fbbf24', 1.5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(banX + 24, banY + 24, 6, 10);
      pxBox(banX + banW - 38, banY + 16, 22, 32, '#0369a1', '#7dd3fc', '#0c4a6e', '#fbbf24', 1.5);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(banX + banW - 30, banY + 24, 6, 10);

      drawPixelWord('MYTHOS', banX + banW / 2, banY + 16, '#fbbf24');
      drawPixelWord('MYTHOS', banX + banW / 2, banY + 14, '#fef08a');
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(banX + 56, banY + 34, banW - 112, 4);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(banX + 74, banY + 42, banW - 148, 2);
      // Twinkling marquee corner pips
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(banX + 46, banY + 16, 4, 4);
      ctx.fillRect(banX + banW - 50, banY + 16, 4, 4);

      // Flanking Royal Purple Shop Pennant Ribbons (echoing shop_banner.png)
      [272, 534].forEach((px) => {
        pxBox(px, ry + 38, 14, 52, royalMid, royalHi, royalDark, '#fbbf24', 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 4, ry + 78, 6, 6);
      });

      // Framed Mythos Beast Card Posters on Left & Right behind counter
      pxBox(298, ry + 114, 42, 52, '#6c452b', '#a47247', null, INK, 2);
      pxBox(304, ry + 120, 30, 40, '#991b1b', '#f87171', null, '#fbbf24', 1.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(314, ry + 132, 10, 12);

      pxBox(480, ry + 114, 42, 52, '#6c452b', '#a47247', null, INK, 2);
      pxBox(486, ry + 120, 30, 40, '#1e3a8a', '#60a5fa', null, '#fbbf24', 1.5);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(496, ry + 132, 10, 12);

      // Back-Counter Side Ledger Shelf & Shipping Parcel Cart behind Left & Right of Leo
      pxBox(286, floorTop + 2, 48, 42, '#6c452b', '#8b5e3c', '#452817', INK, 2);
      pxBox(292, floorTop + 14, 36, 10, '#54331e', null, '#361f10', INK, 1.5);
      pxBox(294, floorTop - 8, 20, 12, '#fef3c7', '#ffffff', '#d6c496', INK, 1.5); // shop order ledger
      pxBox(318, floorTop - 10, 12, 14, '#1e293b', '#475569', null, '#fbbf24', 1.5); // inkpot

      pxBox(476, floorTop + 2, 52, 42, '#6c452b', '#8b5e3c', '#452817', INK, 2);
      pxBox(482, floorTop + 14, 40, 10, '#54331e', null, '#361f10', INK, 1.5);
      // Banker's brass & emerald lamp casting soft counter light
      pxBox(490, floorTop - 14, 22, 12, '#15803d', '#4ade80', '#14532d', INK, 1.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(499, floorTop - 2, 4, 6);
      const lmpGlow = ctx.createRadialGradient(501, floorTop - 6, 4, 501, floorTop - 6, 44);
      lmpGlow.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
      lmpGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lmpGlow;
      ctx.fillRect(456, floorTop - 50, 90, 90);

      // 3. North-Right Wall: Arched Leaded Shop Window + Wall Clock + Foil Collector Poster
      const winX = snap(552);
      const winY = snap(ry + 38); // 90
      const winW = 76;
      const winH = 98;
      const archR = winW / 2;

      pxBox(winX - 14, winY + 26, 14, winH - 26, royalMid, royalHi, royalDark, INK, 2);
      pxBox(winX + winW, winY + 26, 14, winH - 26, royalMid, royalHi, royalDark, INK, 2);

      ctx.fillStyle = '#784d31';
      ctx.beginPath();
      ctx.arc(winX + archR, winY + archR, archR, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
      pxBox(winX + archR - 6, winY - 4, 12, 10, '#d97706', '#fef08a', '#92400e', INK, 1.5);

      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + archR, winY + archR + 2, archR - 8, Math.PI, 0);
      ctx.lineTo(winX + winW - 8, winY + winH - 10);
      ctx.lineTo(winX + 8, winY + winH - 10);
      ctx.closePath();
      ctx.clip();

      const wSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      if (this.settings.timeOfDay === 'night') {
        wSky.addColorStop(0, '#0f172a');
        wSky.addColorStop(1, '#312e81');
      } else {
        wSky.addColorStop(0, '#7dd3fc');
        wSky.addColorStop(0.65, '#bae6fd');
        wSky.addColorStop(1, '#fef9c3');
      }
      ctx.fillStyle = wSky;
      ctx.fillRect(winX, winY, winW, winH);
      ctx.strokeStyle = '#3f2e22';
      ctx.lineWidth = 2;
      for (let d = -winH; d < winW + winH; d += 18) {
        ctx.beginPath();
        ctx.moveTo(winX + d, winY);
        ctx.lineTo(winX + d + winH, winY + winH);
        ctx.moveTo(winX + d, winY + winH);
        ctx.lineTo(winX + d + winH, winY);
        ctx.stroke();
      }
      ctx.restore();
      pxBox(winX - 6, winY + winH - 10, winW + 12, 10, '#8b5e3c', '#a47247', '#5c3a22', INK, 2);

      // Wall Clock & Framed Holo Promo Plaque (648..708)
      const clkX = snap(648);
      const clkY = snap(ry + 44);
      pxBox(clkX, clkY, 44, 46, '#6c452b', '#a47247', '#452817', INK, 2);
      pxBox(clkX + 8, clkY + 9, 28, 28, '#fef3c7', '#ffffff', '#e5d3a3', INK, 2);
      ctx.fillStyle = '#26130e';
      ctx.fillRect(clkX + 21, clkY + 14, 2, 10);
      ctx.fillRect(clkX + 21, clkY + 22, 8, 2);

      const prX = snap(648);
      const prY = snap(ry + 104);
      pxBox(prX, prY, 44, 56, '#6c452b', '#a47247', '#452817', INK, 2);
      pxBox(prX + 6, prY + 6, 32, 44, '#0f172a', '#1e3a8a', '#312e81', '#fbbf24', 1.5);
      const holoShift = Math.sin(t * 0.08) > 0 ? '#7dd3fc' : '#fef08a';
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(prX + 14, prY + 16, 16, 22);
      ctx.fillStyle = holoShift;
      ctx.fillRect(prX + 18, prY + 20, 8, 10);

      // 4. East Wall: Collector Card Binder Vault & Single-Card Jewel Case (x >= 11.4, y < 4.85 = 310.4!)
      this._drawEastBookshelfCorner(g, (bkX, bkY, bkW) => {
        const tx = snap(bkX + bkW / 2);
        const ty = snap(bkY + 2);
        pxBox(tx - 10, ty - 6, 20, 6, '#5c3a22', '#8b5e3c', null, INK, 2);
        pxBox(tx - 8, ty - 20, 16, 14, '#f59e0b', '#fef08a', '#b45309', INK, 2);
      });

      // Illuminated Single-Card Glass Display Showcase in front along East Wall (x: 732..874, y: 248..304 <= 310)
      const scX = snap(11.44 * S);
      const scY = snap(floorTop + 2); // 248
      const scW = 142;
      const scH = 56; // bottom = 304 < 310.4
      ctx.fillStyle = 'rgba(20, 12, 16, 0.36)';
      ctx.fillRect(scX + 3, scY + 6, scW, scH);
      pxBox(scX, scY, scW, scH, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(
        scX + 8, scY + 6, scW - 16, 26,
        '#0f172a', '#1e293b', null,
        nearCase ? '#38bdf8' : '#7dd3fc', 2
      );
      ['#ef4444', '#38bdf8', '#22c55e', '#fbbf24', '#a855f7'].forEach((col, i) => {
        pxBox(scX + 14 + i * 24, scY + 10, 16, 18, col, '#ffffff', null, '#fbbf24', 1.5);
      });
      // Diagonal pixel glass reflection glint stripes across East showcase
      ctx.fillStyle = 'rgba(186, 230, 253, 0.34)';
      ctx.fillRect(scX + 26, scY + 8, 4, 20);
      ctx.fillRect(scX + 30, scY + 8, 4, 14);
      ctx.fillRect(scX + 86, scY + 10, 4, 18);
      pxBox(scX + 10, scY + 36, scW - 20, 14, '#4d2e1a', null, '#361f10', INK, 1.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(scX + 38, scY + 41, 8, 4);
      ctx.fillRect(scX + scW - 46, scY + 41, 8, 4);

      if (nearCase) {
        const cGlow = ctx.createRadialGradient(scX + scW / 2, scY + 20, 8, scX + scW / 2, scY + 20, 80);
        cGlow.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
        cGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = cGlow;
        ctx.fillRect(scX - 20, scY - 40, scW + 40, 120);
      }

      // 5. Right Floor: Pedestal In-Store Mythos Duel Table & Cushioned Chairs (center 10.5*S = 672, 6.8*S = 435.2)
      const tbX = snap(10.5 * S);
      const tbY = snap(6.8 * S);

      [tbX - 96, tbX + 62].forEach((chX, idx) => {
        const chY = snap(tbY - 22);
        ctx.fillStyle = 'rgba(20, 12, 16, 0.34)';
        ctx.fillRect(chX + 3, chY + 6, 34, 48);
        pxBox(chX, chY + 16, 34, 32, '#6c452b', '#8b5e3c', '#452817', INK, 2);
        pxBox(chX + 4, chY + 18, 26, 20, royalMid, royalHi, royalDark, INK, 1.5);
        const backX = idx === 0 ? chX : chX + 24;
        pxBox(backX, chY - 12, 10, 56, '#784d31', '#a47247', '#452817', INK, 2);
      });

      ctx.fillStyle = 'rgba(20, 12, 16, 0.40)';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 16, 68, 50, 0, 0, Math.PI * 2); ctx.fill();
      pxBox(tbX - 48, tbY + 24, 12, 28, '#5c3a22', '#784d31', '#3b2212', INK, 2);
      pxBox(tbX + 36, tbY + 24, 12, 28, '#5c3a22', '#784d31', '#3b2212', INK, 2);

      ctx.fillStyle = '#5c3a22';
      ctx.beginPath(); ctx.ellipse(tbX, tbY + 6, 68, 48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();

      ctx.fillStyle = '#966540';
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 68, 48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();

      ctx.strokeStyle = '#be8a58';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(tbX, tbY, 60, 42, 0, 0, Math.PI * 2); ctx.stroke();

      // Official Mythos Royal Indigo & Gold Playmat + Active Face-Up Cards & Deck Boxes
      pxBox(tbX - 40, tbY - 24, 80, 46, '#1e1b4b', '#312e81', '#0f172a', '#fbbf24', 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(tbX - 2, tbY - 20, 4, 38);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(tbX - 4, tbY - 5, 8, 8);
      pxBox(tbX - 30, tbY - 14, 16, 22, '#ef4444', '#fca5a5', '#991b1b', '#fef08a', 1.5);
      pxBox(tbX + 14, tbY - 14, 16, 22, '#38bdf8', '#bae6fd', '#0369a1', '#fef08a', 1.5);
      pxBox(tbX - 34, tbY + 12, 12, 6, '#f59e0b', null, null, INK, 1.5);
      pxBox(tbX + 22, tbY - 20, 12, 6, '#22c55e', null, null, INK, 1.5);

      // Soft Atmospheric Glow over Banker Lamp & MYTHOS Signboard
      const signGlow = ctx.createRadialGradient(banX + banW / 2, banY + banH / 2, 16, banX + banW / 2, banY + banH / 2, 130);
      signGlow.addColorStop(0, 'rgba(251, 191, 36, 0.14)');
      signGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = signGlow;
      ctx.fillRect(banX - 30, banY - 20, banW + 60, banH + 60);
    }

    // Renders the Carved Walnut & Glass Booster Counter in front of Shopkeeper Leo
    // so Leo stands behind the counter and the player walks up in front of it!
    renderShopCounterForeground() {
      const ctx = this.ctx;
      ctx.imageSmoothingEnabled = false;
      const S = this.TILE;
      const INK = '#26130e';
      const cntX = this._snap(4.55 * S);
      const cntY = this._snap(4.78 * S);
      const cntW = this._snap(3.65 * S); // 234px
      const cntH = 54;
      const nearKeeper = this.nearInteractable?.id === 'shopkeeper';

      ctx.fillStyle = 'rgba(20, 12, 16, 0.36)';
      ctx.fillRect(cntX + 3, cntY + 8, cntW, cntH);

      // Carved Walnut Counter Carcass & Heavy Oak Countertop
      this._pxBox(cntX, cntY, cntW, cntH, '#784d31', '#a47247', '#452817', INK, 2.5);
      this._pxBox(cntX - 4, cntY, cntW + 8, 22, '#966540', '#c99362', '#5c3a22', INK, 2.5);

      // Recessed Front Wainscoting Counter Panels with Gold Stud Trim
      this._pxBox(cntX + 10, cntY + 26, 98, 22, '#54331e', '#361f10', '#784d31', INK, 2);
      this._pxBox(cntX + 120, cntY + 26, 102, 22, '#54331e', '#361f10', '#784d31', INK, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(cntX + 56, cntY + 35, 6, 4);
      ctx.fillRect(cntX + 168, cntY + 35, 6, 4);

      // Illuminated Glass Display Case Inset on Left of Counter (4 Rare Foil Beasts)
      const glX = cntX + 12;
      const glY = cntY + 3;
      this._pxBox(glX, glY, 94, 16, '#0f172a', '#1e293b', null, nearKeeper ? '#38bdf8' : '#7dd3fc', 2);
      ['#ef4444', '#22c55e', '#38bdf8', '#f59e0b'].forEach((col, i) => {
        this._pxBox(glX + 6 + i * 22, glY + 3, 14, 10, col, '#ffffff', null, '#fbbf24', 1.5);
      });
      // Glass reflection streak across counter showcase
      ctx.fillStyle = 'rgba(186, 230, 253, 0.34)';
      ctx.fillRect(glX + 18, glY + 4, 4, 12);
      ctx.fillRect(glX + 62, glY + 4, 4, 12);

      // Open Royal-Purple & Gold MYTHOS Base Set Booster Counter Box
      const boxX = cntX + 122;
      const boxY = cntY - 10;
      this._pxBox(boxX, boxY, 48, 26, '#4c1d95', '#7c3aed', '#2e1065', '#fbbf24', 2);

      if (!this.hasBoughtCardShopPacks) {
        [boxX + 6, boxX + 26].forEach((px, idx) => {
          const bounce = this._snap(Math.sin((this.tick || 0) * 0.1 + idx) * 2);
          const col = idx === 0 ? '#f59e0b' : '#38bdf8';
          const hi = idx === 0 ? '#fef08a' : '#bae6fd';
          this._pxBox(px, boxY - 8 + bounce, 16, 22, col, hi, null, '#fef08a', 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 4, boxY - 1 + bounce, 8, 6);
        });
      }

      // Vintage Brass & Oak Cash Register on Right End of Counter
      const regX = cntX + cntW - 44;
      const regY = cntY - 14;
      this._pxBox(regX, regY, 32, 28, '#b45309', '#f59e0b', '#78350f', INK, 2);
      this._pxBox(regX + 5, regY + 4, 22, 8, '#fef08a', '#ffffff', '#d97706', INK, 1.5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(regX + 10, regY - 6, 12, 6);
      this._pxBox(regX + 4, regY + 16, 24, 8, '#78350f', '#92400e', null, INK, 1.5);
    }

    // =========================================================================
    // PLUTO'S HOUSE INTERIOR RENDERER (Warm Cozy Residential Home with Bedroom Desk)
    // =========================================================================
    renderPlutoHouseInterior() {
      const ctx = this.ctx;
      const S = this.TILE; // 64px
      const W = this.canvas.width;  // 1024
      const H = this.canvas.height; // 768

      // 1. Warm Timber Cutaway Diorama Void
      ctx.fillStyle = '#1f1712';
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
    // ILLUSTRATED OVERWORLD & INTERIOR PNG SPRITE SUITE LOADER
    // Preloads seamless tiles, beveled turf edges, cottages, Card Shop,
    // park fountain/trees, and interior furniture directly from Sprites/Overworld/
    // =========================================================================
    loadOverworldSprites() {
      const keys = [
        'tile_grass', 'tile_dirt', 'tile_flagstone', 'tile_wood_floor',
        'turf_edge_top', 'turf_edge_bot', 'turf_edge_left', 'turf_edge_right',
        'cottage_player', 'cottage_friend', 'cottage_pluto',
        'cottage_nova', 'cottage_silas', 'cottage_maya',
        'card_shop', 'shop_banner',
        'tree_green', 'tree_autumn', 'tree_autumn_small',
        'fountain', 'bush_round', 'bush_flower',
        'bench_left', 'bench_front', 'bench_right',
        'fence', 'pot_large', 'pot_small', 'signpost',
        'furniture_bed', 'furniture_bookshelf', 'furniture_tv',
        'furniture_table_book', 'furniture_card_counter'
      ];
      this.owSprites = this.owSprites || {};
      keys.forEach((k) => {
        const img = new Image();
        img.src = `Sprites/Overworld/${k}.png`;
        img.onload = () => {
          if (k === 'tile_grass' || k === 'tile_dirt' || k === 'tile_flagstone' || k === 'tile_wood_floor') {
            this._pixelArtVer = 0; // force pattern refresh once high-res PNG tiles finish decoding
          }
        };
        this.owSprites[k] = img;
      });
    }

    isImgReady(key) {
      const img = this.owSprites && this.owSprites[key];
      return Boolean(img && img.complete && img.naturalWidth > 0);
    }

    buildScaledPattern(img, targetW, targetH) {
      const c = document.createElement('canvas');
      c.width = targetW;
      c.height = targetH;
      const g = c.getContext('2d');
      if (g) {
        g.imageSmoothingEnabled = false;
        g.drawImage(img, 0, 0, targetW, targetH);
      }
      return this.ctx.createPattern(c, 'repeat');
    }

    initCobblestonePattern() {
      const pngTilesReady = this.isImgReady('tile_grass') && this.isImgReady('tile_dirt')
        && this.isImgReady('tile_flagstone') && this.isImgReady('tile_wood_floor');
      const targetVer = pngTilesReady ? 3 : 2;
      if (this._pixelArtVer === targetVer && this.cobblePattern && this.flagstonePattern && this.grassPattern && this.treeGreenStamp) return;
      this._pixelArtVer = targetVer;

      if (pngTilesReady) {
        this.cobblePattern = this.buildScaledPattern(this.owSprites.tile_dirt, 160, 160);
        this.flagstonePattern = this.buildScaledPattern(this.owSprites.tile_flagstone, 160, 160);
        this.grassPattern = this.buildScaledPattern(this.owSprites.tile_grass, 160, 160);
        this.woodFloorPattern = this.buildScaledPattern(this.owSprites.tile_wood_floor, 160, 80);
      } else {
        // Pre-load fallback textures for first few frames while PNGs decode

      // 1. Warm Ochre Packed-Dirt Path Pattern (128x128 @ 2x pixel scale)
      const pw = 128, ph = 128;
      const pCvs = document.createElement('canvas');
      pCvs.width = pw; pCvs.height = ph;
      const pctx = pCvs.getContext('2d');
      if (pctx) {
        pctx.fillStyle = '#b98a52';
        pctx.fillRect(0, 0, pw, ph);

        // Soft organic dirt mottling patches
        const tones = ['#c6975e', '#ad7e46', '#a2733c', '#cf9f66', '#b98a52'];
        for (let py = 0; py < ph; py += 2) {
          for (let px = 0; px < pw; px += 2) {
            const wave = Math.sin(px * 0.08 + py * 0.05) + Math.cos(py * 0.11 - px * 0.04);
            const n = this.hash(px * 0.4, py * 0.4, 7);
            if (wave > 0.65 || n > 0.78) {
              pctx.fillStyle = tones[Math.floor((n * 11 + wave * 3) % tones.length + tones.length) % tones.length];
              pctx.fillRect(px, py, 2, 2);
            }
          }
        }
        // Subtle scattered round pebbles & warm dirt specks
        for (let i = 0; i < 24; i++) {
          const sx = Math.floor(this.hash(i, 3) * (pw - 10) / 2) * 2 + 4;
          const sy = Math.floor(this.hash(i, 19) * (ph - 10) / 2) * 2 + 4;
          if (i % 3 === 0) {
            // Small embedded warm stone pebble
            pctx.fillStyle = '#6e5238';
            pctx.fillRect(sx, sy, 6, 4);
            pctx.fillStyle = '#9e8c78';
            pctx.fillRect(sx, sy, 4, 2);
            pctx.fillStyle = '#c4b4a0';
            pctx.fillRect(sx, sy, 2, 2);
          } else {
            pctx.fillStyle = i % 2 === 0 ? '#936634' : '#d6aa72';
            pctx.fillRect(sx, sy, 2, 2);
          }
        }
        this.cobblePattern = this.ctx.createPattern(pCvs, 'repeat');
      }

      // 2. Irregular Hand-Laid Flagstone Cobblestone Road Pattern (128x64 @ 2x pixel scale)
      const fw = 128, fh = 64;
      const fCvs = document.createElement('canvas');
      fCvs.width = fw; fCvs.height = fh;
      const fctx = fCvs.getContext('2d');
      if (fctx) {
        // Warm packed-dirt mortar showing organically between rounded cobblestones
        fctx.fillStyle = '#9e7444';
        fctx.fillRect(0, 0, fw, fh);
        fctx.fillStyle = '#ad8250';
        for (let i = 0; i < 110; i++) {
          const mx = Math.floor(this.hash(i, 31) * fw / 2) * 2;
          const my = Math.floor(this.hash(i, 47) * fh / 2) * 2;
          fctx.fillRect(mx, my, 4, 2);
        }

        // Non-grid, staggered multi-sized rounded cobblestones + small pebbles (eliminates horizontal row seams)
        const stones = [
          [2, 2, 16, 12],   [22, 4, 20, 14],  [46, 1, 14, 10],  [64, 3, 22, 16],  [90, 2, 16, 12], [110, 5, 16, 13],
          [4, 17, 14, 15],  [22, 21, 18, 12], [44, 14, 18, 16], [66, 22, 16, 12], [86, 17, 20, 14], [110, 21, 16, 12],
          [16, 35, 22, 13], [42, 33, 16, 14], [62, 37, 22, 13], [88, 34, 16, 15], [108, 36, 18, 13],
          [2, 36, 12, 14],  [4, 51, 18, 11],  [26, 50, 16, 12], [46, 49, 20, 13], [70, 52, 16, 10], [90, 50, 20, 12], [114, 51, 12, 11],
          // Infill small rounded pebbles
          [18, 14, 5, 5], [40, 10, 6, 4], [60, 18, 6, 5], [82, 14, 5, 4], [106, 15, 5, 5],
          [12, 31, 6, 4], [58, 31, 6, 5], [104, 31, 5, 5], [38, 47, 6, 4], [84, 48, 5, 4]
        ];
        const stoneCols = ['#9c8d7b', '#8e7f6d', '#a99b89', '#958674', '#a29482', '#897a68'];
        stones.forEach(([sx, sy, sw, sh], idx) => {
          const col = stoneCols[idx % stoneCols.length];
          // Soft warm brown mortar contour (not dark black grid!)
          fctx.fillStyle = '#75583a';
          fctx.fillRect(sx + 2, sy, sw - 4, sh);
          fctx.fillRect(sx, sy + 2, sw, sh - 4);
          // Rounded pebble stone body
          fctx.fillStyle = col;
          fctx.fillRect(sx + 2, sy + 1, sw - 4, sh - 2);
          fctx.fillRect(sx + 1, sy + 2, sw - 2, sh - 4);
          if (sw >= 10 && sh >= 8) {
            fctx.fillStyle = '#bfb19e';
            fctx.fillRect(sx + 3, sy + 2, sw - 7, 2);
            fctx.fillStyle = '#7a6c5a';
            fctx.fillRect(sx + 3, sy + sh - 3, sw - 6, 2);
          }
        });
        this.flagstonePattern = this.ctx.createPattern(fCvs, 'repeat');
      }

      // 3. Rich Velvety Meadow Pixel-Art Grass Pattern (128x128 @ 2x pixel scale)
      const gCvs = document.createElement('canvas');
      gCvs.width = 128; gCvs.height = 128;
      const gctx = gCvs.getContext('2d');
      if (gctx) {
        gctx.fillStyle = '#4e9134';
        gctx.fillRect(0, 0, 128, 128);

        const gTones = ['#589e3c', '#45832c', '#62aa44', '#3d7826'];
        for (let gy = 0; gy < 128; gy += 2) {
          for (let gx = 0; gx < 128; gx += 2) {
            const wave = Math.sin(gx * 0.06 + gy * 0.06) + Math.cos(gy * 0.08 - gx * 0.05);
            const n = this.hash(gx * 0.4, gy * 0.4, 9);
            if (wave > 0.6 || n > 0.72) {
              gctx.fillStyle = gTones[Math.floor((n * 17 + wave * 4) % gTones.length + gTones.length) % gTones.length];
              gctx.fillRect(gx, gy, 2, 2);
            }
          }
        }
        // Delicate pixel grass tufts & tiny meadow blossoms
        const tufts = [
          [10, 14], [46, 10], [92, 22], [26, 46], [70, 38],
          [112, 54], [16, 78], [56, 86], [98, 76], [36, 112], [82, 114], [116, 102]
        ];
        tufts.forEach(([tx, ty], i) => {
          gctx.fillStyle = '#34681e';
          gctx.fillRect(tx, ty + 2, 6, 2);
          gctx.fillStyle = '#6ec048';
          gctx.fillRect(tx, ty, 2, 2);
          gctx.fillRect(tx + 4, ty, 2, 2);
          gctx.fillStyle = '#84d458';
          gctx.fillRect(tx + 2, ty + 2, 2, 2);
          if (i % 4 === 0) {
            gctx.fillStyle = i % 8 === 0 ? '#fef08a' : '#f8fafc';
            gctx.fillRect(tx + 6, ty - 2, 2, 2);
          }
        });
        this.grassPattern = this.ctx.createPattern(gCvs, 'repeat');
      }
      }

      // 4. Lush Multi-Lobe 16-bit/32-bit Pixel-Art Oak & Maple Tree Stamps (56x64 logical -> 112x128px)
      const buildTreeStamp = (isAutumn) => {
        const tw = 56, th = 64;
        const buf = document.createElement('canvas');
        buf.width = tw; buf.height = th;
        const t = buf.getContext('2d');
        const INK = '#162812';
        const cDeep = isAutumn ? '#6e280a' : '#1e4a16';
        const cDark = isAutumn ? '#943c12' : '#2c6820';
        const cMid  = isAutumn ? '#c4561c' : '#408c2c';
        const cHi   = isAutumn ? '#e88228' : '#64b83c';
        const cTop  = isAutumn ? '#f8b84e' : '#8cd850';

        const dot = (x, y, col) => { t.fillStyle = col; t.fillRect(Math.round(x), Math.round(y), 1, 1); };
        const fillOval = (cx, cy, rx, ry, col) => {
          t.fillStyle = col;
          for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
              if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0) {
                t.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
              }
            }
          }
        };

        // Wide soft oval ground shadow
        fillOval(28, 56, 17, 6, 'rgba(14, 24, 10, 0.34)');

        // Flared sturdy bark trunk with roots
        t.fillStyle = '#22140c';
        t.fillRect(22, 36, 12, 20);
        t.fillRect(20, 52, 16, 4);
        t.fillStyle = '#4e2e18';
        t.fillRect(23, 36, 10, 19);
        t.fillRect(21, 53, 14, 2);
        t.fillStyle = '#6e4224';
        t.fillRect(24, 37, 6, 17);
        t.fillStyle = '#8c5832';
        t.fillRect(25, 38, 2, 14);
        dot(22, 54, '#6e4224'); dot(33, 54, '#4e2e18');

        // Multi-lobe organic foliage clusters (7 distinct overlapping lobes!)
        const lobes = [
          [28, 17, 14, 12],
          [16, 22, 11, 10],
          [40, 22, 11, 10],
          [14, 31, 10, 9],
          [42, 31, 10, 9],
          [28, 30, 14, 11],
          [22, 14, 9, 8],
          [34, 15, 9, 8]
        ];
        // Outline
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx + 1, ry + 1, INK));
        // Deep underside shadow
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx, ry, cDeep));
        // Dark foliage body
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y - 1, rx - 1, ry - 1, cDark));

        // Midtone sunlit lobes
        const midLobes = [
          [27, 15, 11, 9],
          [16, 20, 8, 7],
          [38, 20, 8, 7],
          [27, 27, 11, 8],
          [15, 29, 7, 6],
          [40, 29, 7, 6]
        ];
        midLobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx, ry, cMid));

        // Bright sunlit leaf crown domes
        const hiLobes = [
          [25, 11, 7, 5],
          [15, 18, 5, 4],
          [35, 17, 5, 4],
          [26, 23, 6, 4],
          [14, 26, 4, 3],
          [37, 26, 4, 3]
        ];
        hiLobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx, ry, cHi));

        // Crisp pixel leaf crown highlights & dithered speckles
        fillOval(23, 9, 4, 2, cTop);
        fillOval(14, 16, 3, 2, cTop);
        fillOval(34, 15, 3, 2, cTop);
        fillOval(25, 21, 3, 2, cTop);
        const sparkles = [[20, 11], [28, 10], [12, 19], [18, 22], [32, 18], [38, 21], [23, 25], [29, 24], [15, 27]];
        sparkles.forEach(([sx, sy]) => dot(sx, sy, cTop));

        const out = document.createElement('canvas');
        out.width = tw * 2; out.height = th * 2;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = false;
        octx.drawImage(buf, 0, 0, out.width, out.height);
        return out;
      };
      this.treeGreenStamp = buildTreeStamp(false);
      this.treeAutumnStamp = buildTreeStamp(true);

      // 5. Multi-Lobe Pixel-Art Bush Stamp (30x22 logical -> 60x44px)
      const buildBushStamp = () => {
        const bw = 30, bh = 22;
        const buf = document.createElement('canvas');
        buf.width = bw; buf.height = bh;
        const b = buf.getContext('2d');
        const fillOval = (cx, cy, rx, ry, col) => {
          b.fillStyle = col;
          for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
              if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0) {
                b.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
              }
            }
          }
        };
        fillOval(15, 18, 12, 3, 'rgba(14, 24, 10, 0.32)');
        const lobes = [[15, 10, 8, 6], [9, 12, 6, 5], [21, 12, 6, 5], [15, 13, 8, 5]];
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx + 1, ry + 1, '#162812'));
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y, rx, ry, '#1e4a16'));
        lobes.forEach(([x, y, rx, ry]) => fillOval(x, y - 1, rx - 1, ry - 1, '#2c6820'));
        fillOval(14, 8, 6, 4, '#408c2c');
        fillOval(9, 10, 4, 3, '#408c2c');
        fillOval(19, 10, 4, 3, '#408c2c');
        fillOval(13, 6, 4, 2, '#64b83c');
        fillOval(9, 9, 2, 2, '#64b83c');
        fillOval(18, 9, 2, 1, '#64b83c');
        b.fillStyle = '#8cd850';
        b.fillRect(11, 5, 3, 1);
        b.fillRect(15, 6, 2, 1);
        b.fillRect(8, 8, 2, 1);

        const out = document.createElement('canvas');
        out.width = bw * 2; out.height = bh * 2;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = false;
        octx.drawImage(buf, 0, 0, out.width, out.height);
        return out;
      };
      this.bushStamp = buildBushStamp();

      // 6. Terracotta Potted Plant Stamp (16x20 logical -> 32x40px)
      const buildPottedPlant = () => {
        const pw = 16, ph = 20;
        const buf = document.createElement('canvas');
        buf.width = pw; buf.height = ph;
        const p = buf.getContext('2d');
        const INK = '#24140e';
        p.fillStyle = 'rgba(14,24,10,0.28)'; p.fillRect(3, 17, 10, 2);
        // Clay pot
        p.fillStyle = INK; p.fillRect(4, 10, 8, 8); p.fillRect(3, 9, 10, 3);
        p.fillStyle = '#b45c38'; p.fillRect(5, 12, 6, 5);
        p.fillStyle = '#d4744a'; p.fillRect(4, 10, 8, 1); p.fillRect(5, 12, 2, 4);
        p.fillStyle = '#823c20'; p.fillRect(9, 12, 2, 5);
        // Foliage
        p.fillStyle = '#162812';
        p.fillRect(3, 3, 10, 7); p.fillRect(5, 1, 6, 3);
        p.fillStyle = '#2c6820'; p.fillRect(4, 4, 8, 5);
        p.fillStyle = '#4ea034'; p.fillRect(5, 2, 6, 5);
        p.fillStyle = '#7cd04c'; p.fillRect(5, 2, 3, 3); p.fillRect(9, 4, 2, 2);
        // Little flower bud
        p.fillStyle = '#f472b6'; p.fillRect(6, 4, 2, 2);
        p.fillStyle = '#fef08a'; p.fillRect(10, 3, 1, 1);

        const out = document.createElement('canvas');
        out.width = pw * 2; out.height = ph * 2;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = false;
        octx.drawImage(buf, 0, 0, out.width, out.height);
        return out;
      };
      this.pottedPlantStamp = buildPottedPlant();
    }

    // =========================================================================
    // NOVA'S HOUSE INTERIOR (Celestial Stargazer Observatory & Study)
    // - Matches the illustrated 16/32-bit cutaway style & cottage_nova.png
    //   (cream plaster trims, slate-indigo accents, warm walnut woodwork),
    //   using OwSprites wood plank floors, bookshelf & potted flora while
    //   preserving all collision boxes, Nova spawn (6.2, 5.35), and exit (9.8*S).
    // =========================================================================
    renderNovaHouseInterior() {
      const ctx = this.ctx;
      ctx.imageSmoothingEnabled = false;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;

      // 1. Ensure high-res Overworld patterns (wood floor planks, etc.) exist
      this.initCobblestonePattern();

      // Deep midnight diorama void framing the cutaway cottage
      ctx.fillStyle = '#151722';
      ctx.fillRect(0, 0, W, H);

      // Standard cutaway architectural bounds (matching collision geometry)
      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4

      const INK = '#26130e';
      const indigoDark = '#232052';
      const indigoMid = '#36327a';
      const indigoHi = '#524da8';

      const snap = (v) => Math.round(v / 2) * 2;

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

      const pxBox = (x, y, w, h, fill, hi = null, shade = null, ink = INK, lw = 2) => {
        const sx = snap(x), sy = snap(y), sw = snap(w), sh = snap(h);
        ctx.fillStyle = fill;
        ctx.fillRect(sx, sy, sw, sh);
        if (hi) {
          ctx.fillStyle = hi;
          ctx.fillRect(sx + lw, sy + lw, sw - lw * 2, 4);
        }
        if (shade) {
          ctx.fillStyle = shade;
          ctx.fillRect(sx + lw, sy + sh - lw - 4, sw - lw * 2, 4);
        }
        if (ink) {
          ctx.strokeStyle = ink;
          ctx.lineWidth = lw;
          ctx.strokeRect(sx, sy, sw, sh);
        }
      };

      // 2. Dark Observatory-Stained Wood Plank Floor + Soft Ambient Depth
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

      if (this.woodFloorPattern) {
        ctx.fillStyle = this.woodFloorPattern;
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        // Cool deep twilight-walnut floor stain harmonizing with midnight decor
        ctx.fillStyle = 'rgba(20, 26, 56, 0.34)';
        ctx.fillRect(rx, floorTop - 30, rw, rh);
      } else {
        ctx.fillStyle = '#473d3d';
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        const plankH = 32;
        for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
          ctx.fillStyle = row % 2 === 0 ? '#4e4347' : '#43383c';
          ctx.fillRect(rx, y, rw, plankH);
          ctx.fillStyle = '#2d2428';
          ctx.fillRect(rx, y + plankH - 2, rw, 2);
        }
      }

      // Grounding ambient shadow under north baseboard
      const wallShadow = ctx.createLinearGradient(0, floorTop - 16, 0, floorTop + 30);
      wallShadow.addColorStop(0, 'rgba(10, 12, 28, 0.50)');
      wallShadow.addColorStop(1, 'rgba(10, 12, 28, 0)');
      ctx.fillStyle = wallShadow;
      ctx.fillRect(rx, floorTop - 16, rw, 46);

      // Subtle cool cosmic skylight pool across floorboards & center rug
      const skyPool = ctx.createRadialGradient(rx + 402, floorTop + 120, 18, rx + 402, floorTop + 140, 210);
      skyPool.addColorStop(0, 'rgba(147, 197, 253, 0.16)');
      skyPool.addColorStop(0.6, 'rgba(99, 102, 241, 0.06)');
      skyPool.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = skyPool;
      ctx.fillRect(rx + 180, floorTop - 10, 460, 340);

      // Bottom Cutaway Walnut Threshold Beam
      pxBox(rx, ry + rh - 18, rw, 18, '#5c3a22', '#7d5233', '#3b2212', INK, 2.5);

      // 3. Woven Celestial Zodiac Circular Rug (Center Floor)
      const rugX = snap(rx + rw / 2 + 12);
      const rugY = snap(floorTop + 2.85 * S);
      const rugR = 114;

      // Ground drop shadow
      ctx.fillStyle = 'rgba(10, 12, 28, 0.36)';
      ctx.beginPath(); ctx.arc(rugX + 2, rugY + 5, rugR, 0, Math.PI * 2); ctx.fill();

      // Golden woven fringe tassels around outer circumference
      ctx.fillStyle = '#e7d5ad';
      for (let a = 0; a < 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        const fx = snap(rugX + Math.cos(ang) * (rugR + 3)) - 2;
        const fy = snap(rugY + Math.sin(ang) * (rugR + 3)) - 2;
        ctx.fillRect(fx, fy, 4, 4);
      }

      // Outer deep midnight-indigo rim
      ctx.fillStyle = '#18193d';
      ctx.beginPath(); ctx.arc(rugX, rugY, rugR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();

      // Inner sapphire-indigo field
      ctx.fillStyle = indigoDark;
      ctx.beginPath(); ctx.arc(rugX, rugY, rugR - 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5; ctx.stroke();

      // Pixelated cyan orbital track ring & cardinal brass compass pips
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rugX, rugY, 80, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rugX, rugY, 48, 0, Math.PI * 2); ctx.stroke();

      for (let c = 0; c < 8; c++) {
        const ang = (c * Math.PI) / 4;
        const dx = snap(rugX + Math.cos(ang) * 92) - 2;
        const dy = snap(rugY + Math.sin(ang) * 92) - 2;
        ctx.fillStyle = c % 2 === 0 ? '#fbbf24' : '#38bdf8';
        ctx.fillRect(dx, dy, 4, 4);
      }

      // 8-Point Golden Polar Star Medallion in Rug Center
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      for (let s = 0; s < 16; s++) {
        const ang = (s * Math.PI) / 8;
        const rr = s % 2 === 0 ? 28 : 11;
        const px = rugX + Math.cos(ang) * rr;
        const py = rugY + Math.sin(ang) * rr;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI) / 4;
        const rr = s % 2 === 0 ? 18 : 7;
        const px = rugX + Math.cos(ang) * rr;
        const py = rugY + Math.sin(ang) * rr;
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 4. Stargazer Indigo Plaster & Cream-Framed North Wall (Cottage Exterior Harmony)
      ctx.fillStyle = '#282b57';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Subtle golden wallpaper pinpoint starlight & upper plaster shadow
      for (let st = 0; st < 22; st++) {
        const sx = snap(rx + 78 + ((st * 97) % (rw - 160)));
        const sy = snap(ry + 38 + ((st * 43) % 108));
        ctx.fillStyle = st % 3 === 0 ? 'rgba(254, 240, 138, 0.48)' : 'rgba(186, 230, 253, 0.35)';
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.fillStyle = 'rgba(10, 12, 28, 0.25)';
      ctx.fillRect(rx + 68, ry + 31, rw - 136, 10);

      // Slate-Blue & Brass Dado Rail following North & Angled Wing Walls
      const wainTop = floorTop - 68;
      ctx.fillStyle = '#364966';
      ctx.beginPath();
      ctx.moveTo(rx + 28, wainTop + 16);
      ctx.lineTo(rx + 68, wainTop - 10);
      ctx.lineTo(rx + rw - 68, wainTop - 10);
      ctx.lineTo(rx + rw - 28, wainTop + 16);
      ctx.lineTo(rx + rw - 28, wainTop + 26);
      ctx.lineTo(rx + rw - 68, wainTop);
      ctx.lineTo(rx + 68, wainTop);
      ctx.lineTo(rx + 28, wainTop + 26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Carved Walnut Lower Wainscoting Paneling
      ctx.fillStyle = '#5c3a22';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Highlight top chair-rail bevel + recessed pixel wood panels
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(rx + 68, wainTop + 1, rw - 136, 5);
      for (let px = rx + 82; px < rx + rw - 98; px += 46) {
        pxBox(px, wainTop + 10, 34, 38, '#462a18', '#331c0e', '#6c452b', INK, 2);
      }

      // Angled Wing Wall vertical corner trim
      ctx.strokeStyle = '#3b4275';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // Deep Walnut Baseboard along North & Wing Walls
      ctx.fillStyle = '#3b2113';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 5. Chunky Walnut Cutaway Wall Cap & Side-Wall Cream Stone Pillars (matches cottage_nova.png!)
      ctx.fillStyle = '#6c452b';
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

      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(rx + 38, ry + 3, rw - 76, 6);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
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
      ctx.stroke();

      // Lower Cream Plaster & Slate Side-Wall Cutaway Pillars
      [rx, rx + rw - 28].forEach(px => {
        pxBox(px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18, '#eae4cf', '#f7f3e4', '#ccc4a8', INK, 2.5);
        pxBox(px + 4, floorTop + 245, 20, 16, '#486073', '#7c96ab', '#314352', INK, 2);
      });

      // 6. South Cutaway Doorstep Threshold & Midnight-Violet Welcome Mat (Exit at 9.8 * S)
      const doorX = snap(9.8 * S - 43); // centered cleanly on 9.8*S exit trigger
      const doorY = snap(ry + rh - 22);
      pxBox(doorX + 4, doorY - 24, 78, 22, '#4c1d95', '#7c3aed', '#2e1065', INK, 2);
      // Woven gold star crest pixels on doormat
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(doorX + 10, doorY - 19, 66, 2);
      ctx.fillRect(doorX + 10, doorY - 7, 66, 2);
      ctx.fillRect(doorX + 40, doorY - 15, 6, 4);
      ctx.fillRect(doorX + 42, doorY - 17, 2, 8);
      // Door jamb posts & slate doorstep
      pxBox(doorX - 18, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      pxBox(doorX + 86, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      pxBox(doorX, doorY + 4, 86, 22, '#486073', '#7c96ab', '#314352', INK, 2.5);
      ctx.fillStyle = '#263448';
      ctx.fillRect(doorX + 42, doorY + 6, 2, 16);

      // 7. North Wall: Pegasus Constellation Tapestry (Left) + Grand Observatory Window + Zodiac Clock (Mid-Right)
      // Framed Pegasus Constellation Star-Map Banner above Nova's Bed (clear above finials)
      const tapX = snap(rx + 72);
      const tapY = snap(ry + 34);
      const tapW = 96;
      const tapH = 58;
      ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
      ctx.fillRect(tapX + 3, tapY + 5, tapW, tapH);
      pxBox(tapX, tapY, tapW, tapH, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(tapX + 6, tapY + 6, tapW - 12, tapH - 12, '#0f172a', '#1e1b4b', null, '#fbbf24', 2);
      // Constellation lines + glowing star nodes (Pegasus pattern)
      const cPts = [
        [tapX + 20, tapY + 38],
        [tapX + 36, tapY + 26],
        [tapX + 56, tapY + 26],
        [tapX + 54, tapY + 42],
        [tapX + 72, tapY + 18],
        [tapX + 78, tapY + 34]
      ];
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cPts[0][0], cPts[0][1]);
      ctx.lineTo(cPts[1][0], cPts[1][1]);
      ctx.lineTo(cPts[2][0], cPts[2][1]);
      ctx.lineTo(cPts[3][0], cPts[3][1]);
      ctx.lineTo(cPts[1][0], cPts[1][1]);
      ctx.moveTo(cPts[2][0], cPts[2][1]);
      ctx.lineTo(cPts[4][0], cPts[4][1]);
      ctx.moveTo(cPts[3][0], cPts[3][1]);
      ctx.lineTo(cPts[5][0], cPts[5][1]);
      ctx.stroke();
      cPts.forEach(([sx, sy], si) => {
        ctx.fillStyle = si % 2 === 0 ? '#fef08a' : '#7dd3fc';
        ctx.fillRect(snap(sx) - 2, snap(sy) - 2, 4, 4);
      });

      // Grand Arched Cosmic Observatory Skylight Window (arch fits strictly under wall beam!)
      const winX = snap(rx + 228); // 324
      const winY = snap(ry + 38);  // 89 — keystone stays clear of ry+28 wall beam
      const winW = 148;
      const winH = 114;
      const archR = winW / 2;      // 74
      const archCY = winY + archR;

      // Slate-navy decorative shutters
      pxBox(winX - 16, winY + 42, 16, winH - 42, '#364966', '#5a7496', '#263448', INK, 2.5);
      pxBox(winX + winW, winY + 42, 16, winH - 42, '#364966', '#5a7496', '#263448', INK, 2.5);

      // Arched Cedar Frame with Brass Keystone
      ctx.fillStyle = '#784d31';
      ctx.beginPath();
      ctx.arc(winX + archR, archCY, archR, Math.PI, 0);
      ctx.lineTo(winX + winW, winY + winH);
      ctx.lineTo(winX, winY + winH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();

      // Gold keystone crest at apex of arch
      pxBox(winX + archR - 8, winY - 4, 16, 12, '#d97706', '#fef08a', '#92400e', INK, 2);

      // Cosmic Night-Sky Stargazer Window Panes
      ctx.save();
      ctx.beginPath();
      ctx.arc(winX + archR, archCY + 2, archR - 10, Math.PI, 0);
      ctx.lineTo(winX + winW - 10, winY + winH - 12);
      ctx.lineTo(winX + 10, winY + winH - 12);
      ctx.closePath();
      ctx.clip();

      const skyG = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      skyG.addColorStop(0, '#070b1e');
      skyG.addColorStop(0.55, '#191d4a');
      skyG.addColorStop(1, '#312e81');
      ctx.fillStyle = skyG;
      ctx.fillRect(winX, winY, winW, winH);

      // Nebula glow ribbon & twinkling pixel stars
      const nebG = ctx.createRadialGradient(winX + 46, winY + 62, 4, winX + 54, winY + 66, 54);
      nebG.addColorStop(0, 'rgba(139, 92, 246, 0.36)');
      nebG.addColorStop(0.6, 'rgba(56, 189, 248, 0.16)');
      nebG.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = nebG;
      ctx.fillRect(winX, winY, winW, winH);

      for (let i = 0; i < 20; i++) {
        const starX = snap(winX + 14 + ((i * 37) % (winW - 28)));
        const starY = snap(winY + 18 + ((i * 29) % (winH - 32)));
        const blink = Math.sin(this.tick * 0.1 + i * 1.3) > -0.2;
        if (blink) {
          ctx.fillStyle = i % 3 === 0 ? '#fef08a' : '#e0f2fe';
          ctx.fillRect(starX, starY, i % 5 === 0 ? 4 : 2, i % 5 === 0 ? 4 : 2);
        }
      }

      // Stepped 2px Pixel Crescent Moon in upper right pane
      const mx = snap(winX + winW - 44);
      const my = snap(winY + 34);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(mx + 2, my, 8, 2);
      ctx.fillRect(mx + 6, my + 2, 6, 2);
      ctx.fillRect(mx + 8, my + 4, 6, 8);
      ctx.fillRect(mx + 6, my + 12, 6, 2);
      ctx.fillRect(mx + 2, my + 14, 8, 2);

      // Chunky Cross Mullions framing the skylight
      ctx.fillStyle = '#5c3a22';
      ctx.fillRect(winX + archR - 4, winY + 10, 8, winH - 20);
      ctx.fillRect(winX + 8, winY + 64, winW - 16, 6);
      ctx.restore();

      // Protruding Wooden Sill under Observatory Skylight
      pxBox(winX - 8, winY + winH - 12, winW + 16, 12, '#8b5e3c', '#a47247', '#5c3a22', INK, 2.5);

      // Soft Starlight / Moonlight Beam streaming from Window onto Floor
      ctx.save();
      const moonBeam = ctx.createLinearGradient(winX + archR, winY + winH, winX + archR - 20, floorTop + 170);
      moonBeam.addColorStop(0, 'rgba(147, 197, 253, 0.18)');
      moonBeam.addColorStop(0.55, 'rgba(129, 140, 248, 0.07)');
      moonBeam.addColorStop(1, 'rgba(129, 140, 248, 0)');
      ctx.fillStyle = moonBeam;
      ctx.beginPath();
      ctx.moveTo(winX + 10, winY + winH);
      ctx.lineTo(winX + winW - 10, winY + winH);
      ctx.lineTo(winX + winW - 36, floorTop + 184);
      ctx.lineTo(winX - 16, floorTop + 184);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // North-Center Wall Zodiac Astrological Pendulum Clock + Lunaris Moon Chart Plaque
      const clkX = snap(rx + 458);
      const clkY = snap(ry + 46);
      ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
      ctx.fillRect(clkX + 3, clkY + 6, 52, 144);
      pxBox(clkX, clkY, 52, 144, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(clkX - 4, clkY, 60, 14, '#8b5e3c', '#b98556', '#5c3a22', INK, 2);
      // Astronomical moon-phase dial face
      pxBox(clkX + 8, clkY + 20, 36, 36, '#0f172a', '#1e1b4b', null, '#fbbf24', 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(clkX + 20, clkY + 26, 12, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(clkX + 20, clkY + 26, 6, 10);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(clkX + 24, clkY + 42, 4, 8);
      // Brass pendulum window & swaying weight
      pxBox(clkX + 12, clkY + 64, 28, 66, '#26150d', null, null, INK, 2);
      const pendSwing = Math.round(Math.sin(this.tick * 0.08) * 3) * 2;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(clkX + 25 + Math.round(pendSwing * 0.5), clkY + 70, 2, 36);
      pxBox(clkX + 20 + pendSwing, clkY + 104, 12, 12, '#f59e0b', '#fef08a', '#b45309', INK, 2);

      // Framed Lunar Cycle Reference Chart between Pendulum Clock & Bookshelf
      const lcX = snap(rx + 544);
      const lcY = snap(ry + 54);
      pxBox(lcX, lcY, 62, 46, '#6c452b', '#a47247', '#452817', INK, 2);
      pxBox(lcX + 4, lcY + 4, 54, 38, '#0f172a', '#1e1b4b', null, '#fbbf24', 1.5);
      [0, 1, 2, 3].forEach((pi) => {
        const px = lcX + 12 + pi * 12;
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px, lcY + 18, 6, 8);
        if (pi < 3) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px, lcY + 18, 4 - pi, 8);
        }
      });

      // 8. North Observatory Nook Props (Inside x: 4.7..7.7 / 300.8..492.8, y: 4.1..5.85 / 262..374)
      // Stacked Constellation Scroll Stand on Left side of Alcove (x = 304..342, y = 240..286)
      const scX = snap(4.78 * S); // 306
      const scY = snap(floorTop + 2);
      ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
      ctx.fillRect(scX + 2, scY + 6, 34, 40);
      pxBox(scX, scY + 8, 34, 34, '#6c452b', '#8b5e3c', '#452817', INK, 2.5);
      // Rolled cosmic scrolls sticking out
      pxBox(scX + 4, scY - 4, 10, 22, '#fef3c7', '#ffffff', '#d97706', INK, 2);
      pxBox(scX + 18, scY - 8, 10, 26, '#e0f2fe', '#ffffff', '#38bdf8', INK, 2);

      // Nova's Antique Brass Observatory Telescope on Carved Tripod (x = 6.2 * S = 397, above Nova at 5.35)
      const telX = snap(6.2 * S);
      const telY = snap(floorTop + 26); // 272 — legs finish cleanly above Nova's head!
      ctx.fillStyle = 'rgba(10, 12, 28, 0.38)';
      ctx.beginPath(); ctx.ellipse(telX, telY + 18, 28, 9, 0, 0, Math.PI * 2); ctx.fill();

      // Chunky Cedar Tripod Legs
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(telX, telY - 34); ctx.lineTo(telX - 24, telY + 16);
      ctx.moveTo(telX, telY - 34); ctx.lineTo(telX + 24, telY + 16);
      ctx.moveTo(telX, telY - 34); ctx.lineTo(telX, telY + 20);
      ctx.stroke();
      ctx.strokeStyle = '#784d31';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Brass Mount Hub
      pxBox(telX - 8, telY - 40, 16, 12, '#d97706', '#fef08a', '#92400e', INK, 2);

      // Angled Polished Brass Telescope Barrel aiming out the skylight
      ctx.save();
      ctx.translate(telX, telY - 36);
      ctx.rotate(-0.58);
      pxBox(-14, -7, 46, 14, '#d97706', '#fde047', '#92400e', INK, 2);
      pxBox(28, -9, 14, 18, '#f59e0b', '#fef08a', '#b45309', INK, 2);
      // Glowing sapphire objective lens glint
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(40, -6, 4, 12);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(40, -4, 4, 4);
      ctx.restore();

      // Open Star-Codex Reading Stand / Lectern to Right of Telescope (x = 450..490, y = 248..294)
      const lecX = snap(7.05 * S); // 452
      const lecY = snap(floorTop + 4);
      ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
      ctx.fillRect(lecX + 2, lecY + 6, 36, 42);
      pxBox(lecX + 12, lecY + 18, 12, 26, '#5c3a22', '#784d31', '#3b2212', INK, 2);
      pxBox(lecX + 6, lecY + 40, 24, 6, '#6c452b', '#8b5e3c', null, INK, 2);
      pxBox(lecX, lecY, 36, 20, '#784d31', '#a47247', '#452817', INK, 2.5);
      // Open glowing spellbook / chart pages on lectern
      pxBox(lecX + 4, lecY + 2, 13, 14, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      pxBox(lecX + 19, lecY + 2, 13, 14, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      ctx.fillStyle = '#4f46e5';
      ctx.fillRect(lecX + 8, lecY + 6, 6, 4);
      ctx.fillRect(lecX + 22, lecY + 8, 6, 2);

      // 9. West Wall: Celestial Four-Poster Bed & Footboard Lantern Stool (Inside x: 2.2..4.5, y: 4.1..6.6)
      const bedW = 124;
      const bedH = 190;
      const bedX = snap(2.35 * S);  // 150
      const bedY = snap(ry + 132); // 183 -> finial knobs sit cleanly below Pegasus tapestry!

      // Ground drop shadow
      ctx.fillStyle = 'rgba(10, 12, 28, 0.42)';
      ctx.fillRect(bedX + 4, bedY + 10, bedW, bedH);

      // Carved Walnut Headboard & Four Tall Canopy Corner Posts with Gold Finials
      pxBox(bedX + 8, bedY, bedW - 16, 34, '#6c452b', '#a47247', '#452817', INK, 2.5);
      // Scalloped Midnight-Indigo Canopy Valance Bar between Back Posts
      pxBox(bedX + 8, bedY - 12, bedW - 16, 14, indigoMid, indigoHi, indigoDark, INK, 2);
      for (let sc = bedX + 12; sc < bedX + bedW - 18; sc += 16) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sc + 4, bedY, 4, 3);
      }

      // Crisp Layered Sheet & Twin Velvet-Trimmed Pillows
      pxBox(bedX + 6, bedY + 26, bedW - 12, 40, '#e2e8f0', '#f8fafc', '#cbd5e1', INK, 2.5);
      pxBox(bedX + 14, bedY + 18, 42, 28, '#f8fafc', '#ffffff', '#cbd5e1', INK, 2);
      pxBox(bedX + bedW - 56, bedY + 18, 42, 28, '#f8fafc', '#ffffff', '#cbd5e1', INK, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(bedX + 26, bedY + 30, 18, 2);
      ctx.fillRect(bedX + bedW - 44, bedY + 30, 18, 2);

      // Plush Midnight Velvet Quilt with Gold Crescent & Star Embroidery
      pxBox(bedX + 6, bedY + 58, bedW - 12, 104, indigoMid, indigoHi, indigoDark, INK, 2.5);
      // Folded top sheet turnover
      pxBox(bedX + 6, bedY + 54, bedW - 12, 14, '#f1f5f9', '#ffffff', '#cbd5e1', INK, 2);
      // Side duvet fold volume
      ctx.fillStyle = indigoHi;
      ctx.fillRect(bedX + 12, bedY + 72, 12, 76);
      ctx.fillStyle = indigoDark;
      ctx.fillRect(bedX + bedW - 24, bedY + 72, 12, 76);
      // Center Gold Embroidered Moon Phase Emblem + Quilt Border Trim
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bedX + 10, bedY + 144, bedW - 20, 6);
      const qCx = snap(bedX + bedW / 2);
      const qCy = snap(bedY + 108);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(qCx - 8, qCy - 10, 16, 20);
      ctx.fillStyle = indigoMid;
      ctx.fillRect(qCx - 2, qCy - 8, 12, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(qCx - 16, qCy - 2, 4, 4);
      ctx.fillRect(qCx + 12, qCy - 2, 4, 4);

      // Carved Footboard & Four Brass-Capped Cedar Posts
      pxBox(bedX + 8, bedY + 158, bedW - 16, 30, '#6c452b', '#a47247', '#452817', INK, 2.5);
      [
        [bedX, bedY - 14, 18, 46],
        [bedX + bedW - 18, bedY - 14, 18, 46],
        [bedX, bedY + 142, 18, 52],
        [bedX + bedW - 18, bedY + 142, 18, 52]
      ].forEach(([px, py, pw, ph]) => {
        pxBox(px, py, pw, ph, '#855733', '#c99362', '#452817', INK, 2.5);
        // Brass spherical finial knob atop each four-poster spire
        pxBox(px + 3, py - 8, 12, 8, '#f59e0b', '#fef08a', '#b45309', INK, 2);
      });

      // Plush Bedside Bench & Warm Brass Moon-Lantern at Foot of Bed (inside y < 422.4!)
      const benX = snap(bedX + 16);
      const benY = snap(bedY + bedH + 10);
      ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
      ctx.fillRect(benX + 2, benY + 6, 92, 32);
      pxBox(benX, benY, 92, 32, '#6c452b', '#8b5e3c', '#452817', INK, 2.5);
      pxBox(benX + 6, benY + 4, 80, 18, '#4c1d95', '#7c3aed', '#2e1065', INK, 2);
      // Glowing Warm Crystal Lantern perched neatly inside bench corner
      pxBox(benX + 62, benY - 4, 16, 14, '#f59e0b', '#fef08a', '#b45309', INK, 2);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(benX + 66, benY, 8, 6);

      // 10. East Wall: Bookshelf + Potted Flora + Astronomy Desk & Animated Orrery (Inside x >= 11.2, y < 5.6 = 358.4!)
      // Cozy Corner Pot beside Bookshelf
      if (this.isImgReady('pot_small')) {
        const psImg = this.owSprites.pot_small;
        const psw = 38;
        const psh = Math.round(psw * (psImg.height / psImg.width));
        const psX = snap(11.35 * S); // 726
        const psY = snap(floorTop - 6 - psh);
        ctx.fillStyle = 'rgba(10, 12, 28, 0.34)';
        ctx.beginPath(); ctx.ellipse(psX + psw / 2, psY + psh - 2, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(psImg, psX, psY, psw, psh);
      }

      // Illustrated Celestial Library Bookshelf against East-North Wall (OwSprites furniture_bookshelf!)
      const bkW = 104;
      const bkH = 134;
      const bkX = snap(12.05 * S); // 772
      const bkY = snap(ry + 62);   // 113 -> bottom 247 right at baseboard!
      if (this.isImgReady('furniture_bookshelf')) {
        const bsImg = this.owSprites.furniture_bookshelf;
        ctx.fillStyle = 'rgba(10, 12, 28, 0.36)';
        ctx.beginPath(); ctx.ellipse(bkX + bkW / 2, bkY + bkH - 2, 48, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(bsImg, bkX, bkY, bkW, bkH);
        // Brass Astrolabe Globe perched proudly atop Nova's Bookshelf!
        const glX = snap(bkX + bkW / 2);
        const glY = snap(bkY + 2);
        pxBox(glX - 8, glY - 6, 16, 6, '#5c3a22', '#8b5e3c', null, INK, 2);
        pxBox(glX - 8, glY - 22, 16, 16, '#1d4ed8', '#60a5fa', '#1e3a8a', '#fbbf24', 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(glX - 4, glY - 18, 4, 4);
      } else {
        pxBox(bkX, bkY, bkW, bkH, '#6c452b', '#8b5e3c', '#452817', INK, 2.5);
      }

      // Solid Carved Mahogany Astronomy Desk & Brass Celestial Orrery (718..874, y: 254..348 <= 358!)
      const deskX = snap(11.24 * S); // 720
      const deskY = snap(floorTop + 8); // 254
      const deskW = 154;
      const deskH = 92; // bottom cleanly at 346px (< 358.4px collision box!)

      ctx.fillStyle = 'rgba(10, 12, 28, 0.40)';
      ctx.fillRect(deskX + 3, deskY + 8, deskW, deskH);

      // Desk front apron, drawers & sturdy carved legs
      pxBox(deskX + 6, deskY + deskH - 36, 16, 36, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(deskX + deskW - 22, deskY + deskH - 36, 16, 36, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(deskX + 20, deskY + deskH - 42, deskW - 40, 26, '#4a2b17', null, '#2e1a0c', INK, 2.5);
      pxBox(deskX + 28, deskY + deskH - 36, 40, 14, '#6c452b', null, null, INK, 1.5);
      pxBox(deskX + deskW - 68, deskY + deskH - 36, 40, 14, '#6c452b', null, null, INK, 1.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(deskX + 44, deskY + deskH - 31, 8, 4);
      ctx.fillRect(deskX + deskW - 52, deskY + deskH - 31, 8, 4);

      // Wide Desk Surface with Warm Top Wood Planks
      pxBox(deskX, deskY, deskW, 56, '#784d31', '#a97448', '#452817', INK, 2.5);
      ctx.fillStyle = '#5c3a22';
      ctx.fillRect(deskX + 4, deskY + 26, deskW - 8, 2);

      // Unrolled Celestial Star Chart Parchment + Ink Bottle on Left of Desk
      pxBox(deskX + 10, deskY + 10, 56, 36, '#fef3c7', '#ffffff', '#e5d3a3', '#78350f', 2);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(deskX + 18, deskY + 18, 28, 2);
      ctx.fillRect(deskX + 24, deskY + 26, 24, 2);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(deskX + 44, deskY + 16, 4, 4);
      ctx.fillRect(deskX + 18, deskY + 30, 4, 4);
      pxBox(deskX + 70, deskY + 12, 10, 12, '#1e293b', '#475569', null, INK, 1.5);

      // Animated Brass Celestial Orrery & Glowing Sapphire Crystal Prism on Right of Desk!
      const orX = snap(deskX + deskW - 40);
      const orY = snap(deskY + 28);
      // Brass base ring
      pxBox(orX - 16, orY + 8, 32, 8, '#b45309', '#fbbf24', '#78350f', INK, 2);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(orX, orY - 2, 22, 11, 0, 0, Math.PI * 2); ctx.stroke();

      // Orbiting Sapphire & Mint Moons around Central Glowing Sun Sphere
      const orbT = (this.tick || 0) * 0.05;
      const m1x = snap(orX + Math.cos(orbT) * 20) - 3;
      const m1y = snap(orY - 2 + Math.sin(orbT) * 10) - 3;
      const m2x = snap(orX + Math.cos(orbT + 2.4) * 13) - 2;
      const m2y = snap(orY - 2 + Math.sin(orbT + 2.4) * 6) - 2;
      // Central sun
      pxBox(orX - 6, orY - 8, 12, 12, '#f59e0b', '#fef08a', '#b45309', INK, 1.5);
      // Moons
      pxBox(m1x, m1y, 6, 6, '#38bdf8', '#e0f2fe', null, INK, 1.5);
      pxBox(m2x, m2y, 6, 6, '#a855f7', '#e9d5ff', null, INK, 1.5);

      // Plush Tucked Indigo Velvet Desk Chair in front center of desk (bottom <= 356!)
      const chX = snap(deskX + 54);
      const chY = snap(deskY + deskH - 28); // 318..354
      pxBox(chX, chY, 36, 26, '#784d31', '#a47247', '#452817', INK, 2);
      pxBox(chX + 4, chY + 2, 28, 16, '#4c1d95', '#7c3aed', '#2e1065', INK, 2);

      // 11. Warm & Cool Atmospheric Glow Blooms (Crystal Orrery + Footboard Lantern)
      const orrGlow = ctx.createRadialGradient(orX, orY - 4, 4, orX, orY - 4, 68);
      orrGlow.addColorStop(0, 'rgba(56, 189, 248, 0.24)');
      orrGlow.addColorStop(0.5, 'rgba(250, 204, 21, 0.10)');
      orrGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = orrGlow;
      ctx.fillRect(orX - 70, orY - 74, 140, 140);

      const lanGlow = ctx.createRadialGradient(benX + 75, benY - 2, 4, benX + 75, benY - 2, 62);
      lanGlow.addColorStop(0, 'rgba(254, 240, 138, 0.26)');
      lanGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lanGlow;
      ctx.fillRect(benX + 10, benY - 66, 130, 130);
    }

    // =========================================================================
    // SILAS'S HOUSE INTERIOR (Craftsman Woodworking Parlor & Hearth)
    // =========================================================================
    // =========================================================================
    // SHARED CUTAWAY PIXEL-ART INTERIOR SHELL (16-bit Diorama Architecture)
    // Used by Silas's & Maya's cottages to keep plank floors, dado/wainscoting,
    // walnut cutaway beams, cutaway pillars & threshold mats pixel-uniform.
    // =========================================================================
    _snap(v) {
      return Math.round(v / 2) * 2;
    }

    _pxBox(x, y, w, h, fill, hi = null, shade = null, ink = '#26130e', lw = 2) {
      const ctx = this.ctx;
      const sx = this._snap(x), sy = this._snap(y), sw = this._snap(w), sh = this._snap(h);
      ctx.fillStyle = fill;
      ctx.fillRect(sx, sy, sw, sh);
      if (hi) {
        ctx.fillStyle = hi;
        ctx.fillRect(sx + lw, sy + lw, Math.max(0, sw - lw * 2), 4);
      }
      if (shade) {
        ctx.fillStyle = shade;
        ctx.fillRect(sx + lw, sy + sh - lw - 4, Math.max(0, sw - lw * 2), 4);
      }
      if (ink) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = lw;
        ctx.strokeRect(sx, sy, sw, sh);
      }
    }

    _drawCutawayRoomShell(opts) {
      const ctx = this.ctx;
      ctx.imageSmoothingEnabled = false;
      const S = this.TILE; // 64px
      const W = this.canvas.width;
      const H = this.canvas.height;

      this.initCobblestonePattern();

      // Deep diorama void around cutaway room
      ctx.fillStyle = opts.voidColor || '#151722';
      ctx.fillRect(0, 0, W, H);

      const rx = 1.5 * S;        // 96
      const ry = 0.8 * S;        // 51.2
      const rw = 13.0 * S;       // 832
      const rh = 9.9 * S;        // 633.6
      const floorTop = 3.85 * S; // 246.4
      const INK = '#26130e';

      const snap = (v) => this._snap(v);
      const pxBox = (x, y, w, h, fill, hi = null, shade = null, ink = INK, lw = 2) => {
        this._pxBox(x, y, w, h, fill, hi, shade, ink, lw);
      };

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

      const g = { ctx, S, W, H, rx, ry, rw, rh, floorTop, INK, snap, drawChamferedRect, pxBox };

      // Room exterior drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawChamferedRect(rx + 14, ry + 14, rw, rh, 18);
      ctx.fill();

      // 1. Clipped Wood-Plank Floor + Optional Rug / Light Beams
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

      if (this.woodFloorPattern) {
        ctx.fillStyle = this.woodFloorPattern;
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        if (opts.floorTint) {
          ctx.fillStyle = opts.floorTint;
          ctx.fillRect(rx, floorTop - 30, rw, rh);
        }
      } else {
        ctx.fillStyle = opts.floorFallbackEven || '#7e5638';
        ctx.fillRect(rx, floorTop - 30, rw, rh);
        const plankH = 32;
        for (let y = floorTop - 20, row = 0; y < ry + rh; y += plankH, row++) {
          ctx.fillStyle = row % 2 === 0 ? (opts.floorFallbackEven || '#855c3c') : (opts.floorFallbackOdd || '#785033');
          ctx.fillRect(rx, y, rw, plankH);
          ctx.fillStyle = '#5c3b22';
          ctx.fillRect(rx, y + plankH - 2, rw, 2);
        }
      }

      // Grounding ambient shadow below north baseboard
      const wallShadow = ctx.createLinearGradient(0, floorTop - 16, 0, floorTop + 28);
      wallShadow.addColorStop(0, 'rgba(18, 10, 8, 0.36)');
      wallShadow.addColorStop(1, 'rgba(18, 10, 8, 0)');
      ctx.fillStyle = wallShadow;
      ctx.fillRect(rx, floorTop - 16, rw, 44);

      if (typeof opts.onFloorDraw === 'function') {
        opts.onFloorDraw(g);
      }

      ctx.restore();

      // 2. North & Angled Wing Plaster Wall + Clapboard Courses
      ctx.fillStyle = opts.wallUpper;
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (opts.wallCourseColor) {
        ctx.fillStyle = opts.wallCourseColor;
        for (let cy = ry + 48; cy < floorTop - 72; cy += 22) {
          ctx.fillRect(rx + 70, snap(cy), rw - 140, 2);
        }
      }

      // Upper shadow beneath timber wall crown molding
      ctx.fillStyle = 'rgba(20, 14, 12, 0.16)';
      ctx.fillRect(rx + 68, ry + 31, rw - 136, 10);

      // 3. Colored Dado Rail following North & Wing Walls
      const wainTop = floorTop - 68;
      ctx.fillStyle = opts.dadoColor;
      ctx.beginPath();
      ctx.moveTo(rx + 28, wainTop + 16);
      ctx.lineTo(rx + 68, wainTop - 10);
      ctx.lineTo(rx + rw - 68, wainTop - 10);
      ctx.lineTo(rx + rw - 28, wainTop + 16);
      ctx.lineTo(rx + rw - 28, wainTop + 26);
      ctx.lineTo(rx + rw - 68, wainTop);
      ctx.lineTo(rx + 68, wainTop);
      ctx.lineTo(rx + 28, wainTop + 26);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4. Lower Wainscoting Paneling & Recessed Pixel Panels
      ctx.fillStyle = opts.wainscotColor;
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = opts.railHighlight || '#8b5e3c';
      ctx.fillRect(rx + 68, snap(wainTop + 1), rw - 136, 5);
      for (let px = rx + 82; px < rx + rw - 98; px += 46) {
        pxBox(
          px, wainTop + 10, 34, 38,
          opts.panelFill, opts.panelTopShade, opts.panelBottomHi,
          INK, 2
        );
      }

      // Angled Wing Wall vertical corner lines
      ctx.strokeStyle = opts.cornerTrimColor || 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 68, ry + 30); ctx.lineTo(rx + 68, floorTop - 12);
      ctx.moveTo(rx + rw - 68, ry + 30); ctx.lineTo(rx + rw - 68, floorTop - 12);
      ctx.stroke();

      // 5. Baseboard along North & Wing Walls
      ctx.fillStyle = opts.baseboardColor || '#452817';
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
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 6. Chunky Walnut Cutaway Wall Cap & Side-Wall Pillars
      ctx.fillStyle = '#6c452b';
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

      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(rx + 38, ry + 3, rw - 76, 6);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
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
      ctx.stroke();

      // Lower Side-Wall Cutaway Pillars
      [rx, rx + rw - 28].forEach(px => {
        pxBox(
          px, floorTop + 180, 28, ry + rh - (floorTop + 180) - 18,
          opts.pillarMain, opts.pillarHi, opts.pillarShade, INK, 2.5
        );
        pxBox(
          px + 4, floorTop + 245, 20, 16,
          opts.pillarAccent, opts.pillarAccentHi, opts.pillarAccentShade, INK, 2
        );
      });

      // 7. South Cutaway Doorstep Threshold & Woven Welcome Mat (Exit at 9.8 * S)
      const doorX = snap(9.8 * S - 43);
      const doorY = snap(ry + rh - 22);
      pxBox(doorX + 4, doorY - 24, 78, 22, opts.matMid, opts.matHi, opts.matDark, INK, 2);
      ctx.fillStyle = opts.matTrim || '#fbbf24';
      ctx.fillRect(doorX + 10, doorY - 19, 66, 2);
      ctx.fillRect(doorX + 10, doorY - 7, 66, 2);
      if (typeof opts.onMatCrest === 'function') {
        opts.onMatCrest(doorX, doorY, g);
      }
      // Walnut door jamb posts & beveled stone step slabs
      pxBox(doorX - 18, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      pxBox(doorX + 86, doorY - 8, 18, 22, '#5c3a22', '#855733', '#3b2212', INK, 2.5);
      pxBox(doorX, doorY + 4, 86, 22, opts.stepMid || '#64748b', opts.stepHi || '#94a3b8', opts.stepDark || '#475569', INK, 2.5);
      ctx.fillStyle = opts.stepDark || '#475569';
      ctx.fillRect(doorX + 42, doorY + 6, 2, 16);

      return g;
    }

    // Shared East Wall Bookshelf + Small Potted Corner Plant (within x >= 11.2)
    _drawEastBookshelfCorner(g, topperFn) {
      const { ctx, S, ry, floorTop, INK, snap, pxBox } = g;
      if (this.isImgReady('pot_small')) {
        const psImg = this.owSprites.pot_small;
        const psw = 38;
        const psh = Math.round(psw * (psImg.height / psImg.width));
        const psX = snap(11.35 * S);
        const psY = snap(floorTop - 6 - psh);
        ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
        ctx.beginPath(); ctx.ellipse(psX + psw / 2, psY + psh - 2, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(psImg, psX, psY, psw, psh);
      }

      const bkW = 104;
      const bkH = 134;
      const bkX = snap(12.05 * S);
      const bkY = snap(ry + 62);
      if (this.isImgReady('furniture_bookshelf')) {
        const bsImg = this.owSprites.furniture_bookshelf;
        ctx.fillStyle = 'rgba(20, 12, 8, 0.36)';
        ctx.beginPath(); ctx.ellipse(bkX + bkW / 2, bkY + bkH - 2, 48, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(bsImg, bkX, bkY, bkW, bkH);
      } else {
        pxBox(bkX, bkY, bkW, bkH, '#6c452b', '#8b5e3c', '#452817', INK, 2.5);
      }
      if (typeof topperFn === 'function') {
        topperFn(bkX, bkY, bkW, bkH, g);
      }
    }

    // =========================================================================
    // SILAS'S HOUSE INTERIOR (Craftsman Woodworker's Hearth & Relic Study)
    // =========================================================================
    renderSilasHouseInterior() {
      const t = this.tick || 0;
      const pineMid = '#285e43';
      const pineHi = '#47916b';
      const pineDark = '#183c2b';

      const g = this._drawCutawayRoomShell({
        voidColor: '#17120e',
        floorTint: 'rgba(98, 46, 16, 0.16)',
        floorFallbackEven: '#7c5335',
        floorFallbackOdd: '#6f482c',
        wallUpper: '#eadcb8',        // Biscuit-wheat plaster matching cottage_silas.png
        wallCourseColor: '#d7c599',
        dadoColor: pineMid,          // Forest-pine dado matching Silas's emerald roof!
        wainscotColor: '#633d24',
        railHighlight: '#966540',
        panelFill: '#4d2e1a',
        panelTopShade: '#361f10',
        panelBottomHi: '#784b2e',
        cornerTrimColor: '#bfb088',
        baseboardColor: '#3d2213',
        pillarMain: '#eadcb8',
        pillarHi: '#f6ecd2',
        pillarShade: '#cbb992',
        pillarAccent: pineMid,
        pillarAccentHi: pineHi,
        pillarAccentShade: pineDark,
        matMid: pineMid,
        matHi: pineHi,
        matDark: pineDark,
        matTrim: '#fbbf24',
        stepMid: '#5c6670',
        stepHi: '#8a95a0',
        stepDark: '#3f4750',
        onMatCrest: (doorX, doorY, { ctx }) => {
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(doorX + 39, doorY - 15, 8, 4);
          ctx.fillRect(doorX + 41, doorY - 17, 4, 8);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(doorX + 20, doorY - 14, 4, 2);
          ctx.fillRect(doorX + 62, doorY - 14, 4, 2);
        },
        onFloorDraw: ({ ctx, rx, rw, floorTop, snap, drawChamferedRect, INK }) => {
          // Braided Pine-Forest & Amber Woven Center Rug with Cream Fringe
          const rugW = 296;
          const rugH = 190;
          const rugX = snap(rx + rw / 2 - rugW / 2);
          const rugY = snap(floorTop + 82);

          // Cream cotton fringe tassels along left & right edges
          ctx.fillStyle = '#e7dec5';
          for (let fy = rugY + 12; fy < rugY + rugH - 12; fy += 8) {
            ctx.fillRect(rugX - 6, fy, 6, 4);
            ctx.fillRect(rugX + rugW, fy, 6, 4);
          }

          ctx.fillStyle = 'rgba(20, 12, 8, 0.25)';
          drawChamferedRect(rugX + 2, rugY + 6, rugW, rugH, 14);
          ctx.fill();

          ctx.fillStyle = pineDark;
          drawChamferedRect(rugX, rugY, rugW, rugH, 14);
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = pineMid;
          drawChamferedRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16, 10);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Subtle woven horizontal bands + cream inner filigree border + corner oak pips
          ctx.fillStyle = 'rgba(254, 243, 199, 0.09)';
          for (let py = rugY + 24; py < rugY + rugH - 24; py += 20) {
            ctx.fillRect(rugX + 20, py, rugW - 40, 4);
          }
          ctx.strokeStyle = 'rgba(254, 243, 199, 0.42)';
          ctx.lineWidth = 1.5;
          drawChamferedRect(rugX + 20, rugY + 18, rugW - 40, rugH - 36, 6);
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          [
            [rugX + 32, rugY + 28],
            [rugX + rugW - 38, rugY + 28],
            [rugX + 32, rugY + rugH - 34],
            [rugX + rugW - 38, rugY + rugH - 34]
          ].forEach(([cxp, cyp]) => {
            ctx.fillRect(cxp, cyp, 6, 6);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(cxp + 2, cyp + 2, 2, 2);
            ctx.fillStyle = '#fef3c7';
          });
          const rcx = snap(rugX + rugW / 2);
          const rcy = snap(rugY + rugH / 2);
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.moveTo(rcx, rcy - 28);
          ctx.lineTo(rcx + 36, rcy);
          ctx.lineTo(rcx, rcy + 28);
          ctx.lineTo(rcx - 36, rcy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(rcx - 6, rcy - 6, 12, 12);

          // Warm Hearth Firelight Pool onto Oak Floorboards
          const pulse = 0.20 + Math.sin(t * 0.14) * 0.03;
          const hearthGlow = ctx.createRadialGradient(396, floorTop + 10, 12, 396, floorTop + 26, 200);
          hearthGlow.addColorStop(0, `rgba(251, 146, 60, ${pulse + 0.06})`);
          hearthGlow.addColorStop(0.55, `rgba(245, 158, 11, ${pulse * 0.45})`);
          hearthGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = hearthGlow;
          ctx.fillRect(rx, floorTop - 20, 520, 260);

          // Diagonal Morning Sunbeam from East-North Window
          const sunBeam = ctx.createLinearGradient(636, floorTop, 560, floorTop + 190);
          sunBeam.addColorStop(0, 'rgba(254, 240, 138, 0.20)');
          sunBeam.addColorStop(0.55, 'rgba(254, 240, 138, 0.07)');
          sunBeam.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = sunBeam;
          ctx.beginPath();
          ctx.moveTo(582, floorTop - 16);
          ctx.lineTo(692, floorTop - 16);
          ctx.lineTo(640, floorTop + 172);
          ctx.lineTo(524, floorTop + 172);
          ctx.closePath();
          ctx.fill();
        }
      });

      const { ctx, S, rx, ry, floorTop, INK, snap, pxBox } = g;

      // 1. North-Left Wall: Timber Frame Blueprint Plaque & Hanging Joiner's Tool Rack
      const bpX = snap(rx + 74);
      const bpY = snap(ry + 36);
      ctx.fillStyle = 'rgba(20, 12, 8, 0.32)';
      ctx.fillRect(bpX + 3, bpY + 5, 98, 56);
      pxBox(bpX, bpY, 98, 56, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(bpX + 6, bpY + 6, 86, 44, '#134e4a', '#115e59', null, '#fef3c7', 1.5);
      // Gable cottage joinery drafting lines in cream ink
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bpX + 20, bpY + 34);
      ctx.lineTo(bpX + 44, bpY + 14);
      ctx.lineTo(bpX + 68, bpY + 34);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#99f6e4';
      ctx.fillRect(bpX + 74, bpY + 14, 12, 4);
      ctx.fillRect(bpX + 74, bpY + 22, 10, 2);
      ctx.fillRect(bpX + 74, bpY + 28, 12, 2);

      // Wall Cedar Tool Rack with Hanging Steel Hand-Saw, Mallet & Calipers
      const trX = snap(rx + 78);
      const trY = snap(ry + 102);
      pxBox(trX, trY, 90, 10, '#6c452b', '#a47247', '#452817', INK, 2);
      // Hand-saw
      pxBox(trX + 10, trY + 10, 12, 10, '#8b5e3c', '#b98556', null, INK, 1.5);
      pxBox(trX + 12, trY + 20, 8, 28, '#94a3b8', '#e2e8f0', '#64748b', INK, 1.5);
      // Carpenter's square & wood mallet
      pxBox(trX + 36, trY + 10, 18, 12, '#92400e', '#d97706', null, INK, 1.5);
      pxBox(trX + 42, trY + 22, 6, 22, '#784d31', null, null, INK, 1.5);
      pxBox(trX + 66, trY + 10, 14, 6, '#f59e0b', '#fef08a', null, INK, 1.5);
      pxBox(trX + 74, trY + 16, 6, 26, '#cbd5e1', null, null, INK, 1.5);

      // 2. North-Center Stone Masonry Hearth Fireplace & Carved Mantle (behind Silas at 6.2, 5.35)
      const fpX = snap(334);
      const fpY = snap(ry + 30);
      const fpW = 126;
      const fpH = snap(floorTop - fpY - 8); // bottom ~238 right on baseboard!

      // Stone Chimney Breast & Staggered Pixel Cobblestones
      ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
      ctx.fillRect(fpX + 4, fpY + 4, fpW, fpH);
      pxBox(fpX, fpY, fpW, fpH, '#64748b', '#94a3b8', '#475569', INK, 2.5);
      const stoneGrid = [
        [8, 6, 34, 18, '#78716c'], [46, 6, 40, 18, '#57534e'], [90, 6, 28, 18, '#78716c'],
        [8, 28, 44, 18, '#57534e'], [56, 28, 32, 18, '#78716c'], [92, 28, 26, 18, '#57534e'],
        [8, 50, 28, 18, '#78716c'], [40, 50, 44, 18, '#6b7280'], [88, 50, 30, 18, '#57534e']
      ];
      stoneGrid.forEach(([sx, sy, sw, sh, col]) => {
        pxBox(fpX + sx, fpY + sy, sw, sh, col, '#a8a29e', '#44403c', INK, 1.5);
      });

      // Mounted Oak Shield Crest on Chimney Breast
      pxBox(fpX + 46, fpY + 16, 34, 34, '#784d31', '#a47247', '#452817', INK, 2);
      pxBox(fpX + 54, fpY + 24, 18, 18, '#fbbf24', '#fef08a', '#b45309', INK, 1.5);

      // Heavy Cedar Mantlepiece Shelf + Carved Owl Totem & Brass Candle
      pxBox(fpX - 8, fpY + 84, fpW + 16, 14, '#784d31', '#a47247', '#452817', INK, 2.5);
      // Small carved owl figurine left on mantle
      pxBox(fpX + 12, fpY + 64, 18, 20, '#9a3412', '#d97706', '#581c0c', INK, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fpX + 16, fpY + 70, 4, 4);
      ctx.fillRect(fpX + 22, fpY + 70, 4, 4);
      // Glowing candle on right of mantle
      pxBox(fpX + fpW - 26, fpY + 70, 10, 14, '#fef3c7', '#ffffff', '#d97706', INK, 1.5);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(fpX + fpW - 23, fpY + 62, 4, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fpX + fpW - 23, fpY + 64, 4, 4);

      // Hearth Firebox Arch, Logs & Animated Pixel Flame
      const boxX = fpX + 22;
      const boxY = fpY + 102;
      const boxW = fpW - 44;
      const boxH = fpH - 102;
      pxBox(boxX - 6, boxY - 4, boxW + 12, boxH + 4, '#44403c', '#78716c', null, INK, 2);
      pxBox(boxX, boxY, boxW, boxH, '#1a110e', null, null, INK, 2);

      // Split oak hearth logs
      pxBox(boxX + 12, boxY + boxH - 14, boxW - 24, 10, '#6c452b', '#8b5e3c', '#3b2212', INK, 1.5);
      pxBox(boxX + 20, boxY + boxH - 20, boxW - 40, 8, '#54331e', null, null, INK, 1.5);

      // Crisp stepped pixel-art crackling flame
      const fStep = Math.round(Math.sin(t * 0.22) * 2) * 2;
      const fx = snap(boxX + boxW / 2);
      const fy = snap(boxY + boxH - 14);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(fx - 16, fy - 12 - fStep, 32, 12 + fStep);
      ctx.fillRect(fx - 12, fy - 22 - fStep, 24, 12);
      ctx.fillRect(fx - 6, fy - 28 - Math.max(0, fStep), 12, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(fx - 10, fy - 14 - fStep, 20, 12 + fStep);
      ctx.fillRect(fx - 6, fy - 22 - fStep, 12, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fx - 6, fy - 10, 12, 8);
      ctx.fillRect(fx - 2, fy - 16 - Math.round(fStep * 0.5), 4, 8);

      // Cobblestone Floor Hearth Apron (strictly above Silas's 5.35*S = 342px sprite!)
      const apX = snap(326);
      const apY = snap(floorTop - 10);
      const apW = 142;
      const apH = 38; // ends y=274 inside 4.7..7.7, y < 5.85!
      ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
      ctx.fillRect(apX + 2, apY + 6, apW, apH);
      pxBox(apX, apY, apW, apH, '#64748b', '#94a3b8', '#475569', INK, 2.5);
      for (let sx = apX + 6; sx < apX + apW - 14; sx += 26) {
        pxBox(sx, apY + 6, 22, 12, '#78716c', '#a8a29e', null, INK, 1.5);
        pxBox(sx + 2, apY + 20, 20, 12, '#57534e', '#78716c', null, INK, 1.5);
      }

      // Flanking Alcove Props (inside 4.7..7.7 = 300.8..492.8, y < 374.4)
      // Left: Wrought-Iron Firewood Log Cradle (304..326, y: 244..294)
      const wrX = snap(302);
      const wrY = snap(floorTop + 2);
      pxBox(wrX, wrY, 24, 42, '#292524', null, '#1c1917', INK, 2);
      [[wrX + 4, wrY + 26], [wrX + 12, wrY + 26], [wrX + 8, wrY + 14], [wrX + 4, wrY + 4], [wrX + 12, wrY + 4]].forEach(([lx, ly]) => {
        pxBox(lx, ly, 10, 10, '#8b5e3c', '#fde68a', '#5c3a22', INK, 1.5);
      });
      // Right: Cast-Iron Poker Stand & Copper Ember Pail (468..492, y: 244..294)
      const pkX = snap(468);
      const pkY = snap(floorTop + 2);
      pxBox(pkX + 4, pkY + 34, 18, 8, '#334155', '#64748b', null, INK, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(pkX + 8, pkY + 4, 4, 30);
      ctx.fillRect(pkX + 16, pkY + 8, 4, 26);
      pxBox(pkX + 4, pkY - 2, 18, 6, '#b45309', '#fbbf24', null, INK, 1.5);

      // 3. North-Right Wall: Heirloom Grandfather Clock + Twin Pine-Shuttered Woodland Window + Wall Sconce
      const gcX = snap(498);
      const gcY = snap(ry + 44); // 95 -> bottom cleanly 245 at baseboard!
      ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
      ctx.fillRect(gcX + 3, gcY + 6, 54, 150);
      pxBox(gcX, gcY, 54, 150, '#6c452b', '#a47247', '#452817', INK, 2.5);
      pxBox(gcX - 4, gcY, 62, 14, '#8b5e3c', '#b98556', '#5c3a22', INK, 2);
      pxBox(gcX + 23, gcY - 8, 8, 8, '#f59e0b', '#fef08a', '#b45309', INK, 1.5);
      // Cream Enamel Clock Face, Hour Ticks & Crisp Hands
      pxBox(gcX + 9, gcY + 20, 36, 36, '#fef3c7', '#ffffff', '#e5d3a3', INK, 2);
      ctx.fillStyle = '#784d31';
      ctx.fillRect(gcX + 26, gcY + 22, 2, 2);
      ctx.fillRect(gcX + 26, gcY + 50, 2, 2);
      ctx.fillRect(gcX + 12, gcY + 36, 2, 2);
      ctx.fillRect(gcX + 40, gcY + 36, 2, 2);
      ctx.fillStyle = '#26130e';
      ctx.fillRect(gcX + 26, gcY + 26, 2, 12);
      ctx.fillRect(gcX + 26, gcY + 36, 10, 2);
      // Recessed Glass Case & Animated Brass Pendulum
      pxBox(gcX + 13, gcY + 62, 28, 70, '#26150d', null, null, INK, 2);
      const pSw = Math.round(Math.sin(t * 0.07) * 3) * 2;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(gcX + 26 + Math.round(pSw * 0.5), gcY + 68, 2, 40);
      pxBox(gcX + 21 + pSw, gcY + 108, 12, 12, '#f59e0b', '#fef08a', '#b45309', INK, 2);

      // Pine-Shuttered Woodland Window (576..696, y: 88..184)
      const winX = snap(576);
      const winY = snap(ry + 38);
      const winW = 118;
      const winH = 96;
      pxBox(winX - 16, winY + 10, 16, winH - 10, pineMid, pineHi, pineDark, INK, 2.5);
      pxBox(winX + winW, winY + 10, 16, winH - 10, pineMid, pineHi, pineDark, INK, 2.5);
      pxBox(winX, winY, winW, winH, '#784d31', '#a47247', '#452817', INK, 2.5);

      ctx.save();
      ctx.beginPath();
      ctx.rect(winX + 8, winY + 8, winW - 16, winH - 18);
      ctx.clip();
      const wSky = ctx.createLinearGradient(winX, winY, winX, winY + winH);
      wSky.addColorStop(0, '#7dd3fc');
      wSky.addColorStop(0.65, '#fef9c3');
      wSky.addColorStop(1, '#dcfce7');
      ctx.fillStyle = wSky;
      ctx.fillRect(winX, winY, winW, winH);
      // Emerald Oakhaven pines visible outside
      ctx.fillStyle = '#166534';
      ctx.fillRect(winX + 10, winY + 46, 36, 46);
      ctx.fillRect(winX + 20, winY + 34, 18, 14);
      ctx.fillRect(winX + 68, winY + 42, 42, 50);
      ctx.fillRect(winX + 78, winY + 30, 22, 14);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(winX + 22, winY + 38, 12, 10);
      ctx.fillRect(winX + 82, winY + 34, 14, 10);
      // Cross Mullions
      ctx.fillStyle = '#5c3a22';
      ctx.fillRect(winX + Math.floor(winW / 2) - 4, winY + 6, 8, winH - 14);
      ctx.fillRect(winX + 6, winY + 46, winW - 12, 6);
      ctx.restore();
      pxBox(winX - 6, winY + winH - 10, winW + 12, 10, '#8b5e3c', '#a47247', '#5c3a22', INK, 2.5);

      // 4. West Blocked Zone: Master Joiner's Workbench, Wood Carving & Artisan Stool (x: 140..286, y: 244..416)
      const wbX = snap(2.3 * S);  // 148
      const wbY = snap(floorTop + 2); // 248
      const wbW = 132;
      const wbH = 108; // bottom 356
      ctx.fillStyle = 'rgba(20, 12, 8, 0.38)';
      ctx.fillRect(wbX + 4, wbY + 8, wbW, wbH);

      // Heavy timber bench legs & bottom lumber shelf
      pxBox(wbX + 8, wbY + wbH - 42, 16, 42, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(wbX + wbW - 24, wbY + wbH - 42, 16, 42, '#5c3a22', '#784d31', '#3b2212', INK, 2.5);
      pxBox(wbX + 22, wbY + wbH - 28, wbW - 44, 14, '#4a2b17', '#6c452b', '#2e1a0c', INK, 2);
      // Stacked walnut stock planks on lower shelf
      pxBox(wbX + 28, wbY + wbH - 36, 76, 10, '#966540', '#b98556', null, INK, 1.5);

      // Thick butcher-block worktop
      pxBox(wbX, wbY, wbW, 60, '#8b5e3c', '#be8a58', '#5c3a22', INK, 2.5);
      ctx.fillStyle = '#6c452b';
      ctx.fillRect(wbX + 6, wbY + 20, wbW - 12, 2);
      ctx.fillRect(wbX + 6, wbY + 38, wbW - 12, 2);
      // Side Cast-Iron Woodworker's Vise Clamp
      pxBox(wbX - 8, wbY + 26, 14, 22, '#475569', '#94a3b8', '#334155', INK, 2);

      // In-progress Carved Wooden Dreadnaught Sculpture + Mallet & Varnished Card Box
      pxBox(wbX + 14, wbY + 14, 34, 22, '#9a3412', '#d97706', '#581c0c', INK, 2);
      pxBox(wbX + 20, wbY + 4, 18, 12, '#b45309', '#fbbf24', '#78350f', INK, 2); // carved beast crest
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(wbX + 24, wbY + 6, 4, 4);
      ctx.fillRect(wbX + 34, wbY + 6, 4, 4);
      // Small carpenter's wooden mallet on mid bench
      pxBox(wbX + 54, wbY + 10, 16, 10, '#a47247', '#d97706', '#5c3a22', INK, 1.5);
      ctx.fillStyle = '#784d31';
      ctx.fillRect(wbX + 60, wbY + 20, 4, 10);
      // Brass-inlaid Oak Mythos Card Storage Case on Right of Bench
      pxBox(wbX + 78, wbY + 10, 40, 24, '#5c3a22', '#a47247', '#3b2212', '#fbbf24', 2);
      ctx.fillStyle = pineHi;
      ctx.fillRect(wbX + 94, wbY + 20, 8, 6);
      // Scattered curled wood shavings + wood chisel
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(wbX + 54, wbY + 22, 6, 4);
      ctx.fillRect(wbX + 64, wbY + 34, 6, 4);
      ctx.fillRect(wbX + 36, wbY + 42, 8, 4);
      pxBox(wbX + 54, wbY + 40, 20, 6, '#94a3b8', '#e2e8f0', null, INK, 1.5);

      // Lower West Zone (y = 362..414 <= 422.4!): Scrap Timber Crate & Turned Craftsman Stool
      pxBox(wbX + 2, wbY + wbH + 8, 34, 42, '#6c452b', '#a47247', '#452817', INK, 2);
      pxBox(wbX + 8, wbY + wbH, 10, 14, '#8b5e3c', '#be8a58', null, INK, 1.5);
      pxBox(wbX + 20, wbY + wbH + 2, 10, 12, '#784d31', null, null, INK, 1.5);

      const stX = snap(wbX + 52);
      const stY = snap(wbY + wbH + 10);
      ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
      ctx.fillRect(stX + 2, stY + 6, 42, 36);
      pxBox(stX + 6, stY + 22, 8, 16, '#5c3a22', null, null, INK, 2);
      pxBox(stX + 28, stY + 22, 8, 16, '#5c3a22', null, null, INK, 2);
      pxBox(stX, stY, 42, 24, '#784d31', '#a47247', '#452817', INK, 2.5);
      pxBox(stX + 4, stY + 4, 34, 14, '#9a3412', '#c2410c', '#581c0c', INK, 1.5);

      // 5. East Blocked Zone: Bookshelf + Potted Fern + Tufted Leather Armchair & Tea Relic Table (x >= 11.2, y <= 354!)
      this._drawEastBookshelfCorner(g, (bkX, bkY, bkW) => {
        const cx = snap(bkX + bkW / 2);
        const cy = snap(bkY + 2);
        pxBox(cx - 12, cy - 8, 24, 8, '#784d31', '#a47247', null, INK, 2);
        pxBox(cx - 8, cy - 22, 16, 14, '#b45309', '#fbbf24', '#78350f', INK, 2);
      });

      // Round Walnut Relic Side Table with Tea Mug & Foil Card Tray (x: 722..782, y: 274..346 <= 354)
      const rtX = snap(11.3 * S);
      const rtY = snap(floorTop + 30); // 276
      ctx.fillStyle = 'rgba(20, 12, 8, 0.36)';
      ctx.fillRect(rtX + 4, rtY + 10, 56, 62);
      pxBox(rtX + 18, rtY + 38, 20, 26, '#5c3a22', '#784d31', '#3b2212', INK, 2);
      pxBox(rtX + 10, rtY + 58, 36, 8, '#4a2b17', null, null, INK, 2);
      pxBox(rtX, rtY, 56, 42, '#784d31', '#a97448', '#452817', INK, 2.5);
      // Warm mug + Mythos Card Case on side table
      pxBox(rtX + 10, rtY + 10, 14, 16, '#fef3c7', '#ffffff', '#d6d3d1', INK, 1.5);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(rtX + 12, rtY + 12, 10, 4);
      pxBox(rtX + 28, rtY + 12, 18, 20, '#1e293b', '#38bdf8', '#0f172a', '#fbbf24', 1.5);

      // Plush Cognac Leather Wingback Armchair (x: 792..876, y: 254..348 <= 354!)
      const chX = snap(12.38 * S); // 792
      const chY = snap(floorTop + 8); // 254
      const chW = 84;
      const chH = 94; // bottom = 348 <= 358!
      ctx.fillStyle = 'rgba(20, 12, 8, 0.40)';
      ctx.fillRect(chX + 4, chY + 8, chW, chH);
      // Turned walnut legs
      pxBox(chX + 8, chY + chH - 14, 12, 14, '#5c3a22', null, '#3b2212', INK, 2);
      pxBox(chX + chW - 20, chY + chH - 14, 12, 14, '#5c3a22', null, '#3b2212', INK, 2);
      // Rolled leather backrest & tufted buttons
      pxBox(chX + 6, chY, chW - 12, 54, '#9a3412', '#c2410c', '#581c0c', INK, 2.5);
      ctx.fillStyle = '#581c0c';
      ctx.fillRect(chX + 24, chY + 18, 4, 4);
      ctx.fillRect(chX + chW - 28, chY + 18, 4, 4);
      ctx.fillRect(chX + 38, chY + 32, 4, 4);
      // Deep Plush Seat Cushion
      pxBox(chX + 10, chY + 46, chW - 20, 36, '#b45309', '#ea580c', '#7c2d12', INK, 2.5);
      // Rolled Left & Right Armrests + Folded Pine Throw Blanket
      pxBox(chX, chY + 28, 18, 56, '#9a3412', '#c2410c', '#581c0c', INK, 2.5);
      pxBox(chX + chW - 18, chY + 28, 18, 56, '#9a3412', '#c2410c', '#581c0c', INK, 2.5);
      pxBox(chX + 2, chY + 50, 16, 28, pineMid, pineHi, pineDark, INK, 2);

      // 6. Subtle Brass Wall Sconce & Warm Glow Blooms
      const scX = snap(718);
      const scY = snap(ry + 92);
      pxBox(scX, scY, 16, 20, '#d97706', '#fef08a', '#92400e', INK, 2);
      const scGlow = ctx.createRadialGradient(scX + 8, scY + 10, 4, scX + 8, scY + 10, 58);
      scGlow.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
      scGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = scGlow;
      ctx.fillRect(scX - 50, scY - 48, 116, 116);
    }

    // =========================================================================
    // MAYA'S HOUSE INTERIOR (Sunlit Botanical Conservatory & Herbarium)
    // =========================================================================
    renderMayaHouseInterior() {
      const t = this.tick || 0;
      const greenMid = '#245940';
      const greenHi = '#3e8561';
      const greenDark = '#153827';
      const plumMid = '#7f333e';
      const plumHi = '#a84755';
      const plumDark = '#561f28';

      const g = this._drawCutawayRoomShell({
        voidColor: '#121a16',
        floorTint: 'rgba(248, 226, 178, 0.16)', // Bright sunlit birch glaze
        floorFallbackEven: '#c8ab86',
        floorFallbackOdd: '#b89b74',
        wallUpper: '#e5ead0',        // Soft sage-ivory siding matching cottage_maya.png
        wallCourseColor: '#cfd7b3',
        dadoColor: greenMid,         // Forest green dado matching Maya's front door!
        wainscotColor: '#8ba382',
        railHighlight: '#b7cca8',
        panelFill: '#728969',
        panelTopShade: '#5b6f53',
        panelBottomHi: '#a2b997',
        cornerTrimColor: '#bac49d',
        baseboardColor: '#452817',
        pillarMain: '#eae4cc',
        pillarHi: '#f7f3e4',
        pillarShade: '#c8bfa3',
        pillarAccent: plumMid,       // Burgundy accents matching Maya's shingle roof!
        pillarAccentHi: plumHi,
        pillarAccentShade: plumDark,
        matMid: plumMid,
        matHi: plumHi,
        matDark: plumDark,
        matTrim: '#86efac',
        stepMid: '#68737d',
        stepHi: '#97a3ad',
        stepDark: '#475058',
        onMatCrest: (doorX, doorY, { ctx }) => {
          // Botanical 4-leaf clover blossom woven into doormat
          ctx.fillStyle = '#dcfce7';
          ctx.fillRect(doorX + 39, doorY - 15, 8, 4);
          ctx.fillRect(doorX + 41, doorY - 17, 4, 8);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(doorX + 42, doorY - 14, 2, 2);
        },
        onFloorDraw: ({ ctx, rx, rw, floorTop, snap, drawChamferedRect, INK }) => {
          // Fringed Burgundy & Sage Botanical Center Rug
          const rugW = 296;
          const rugH = 190;
          const rugX = snap(rx + rw / 2 - rugW / 2);
          const rugY = snap(floorTop + 82);

          ctx.fillStyle = '#f5ebe0';
          for (let fy = rugY + 12; fy < rugY + rugH - 12; fy += 8) {
            ctx.fillRect(rugX - 6, fy, 6, 4);
            ctx.fillRect(rugX + rugW, fy, 6, 4);
          }

          ctx.fillStyle = 'rgba(20, 14, 10, 0.22)';
          drawChamferedRect(rugX + 2, rugY + 6, rugW, rugH, 14);
          ctx.fill();

          ctx.fillStyle = plumDark;
          drawChamferedRect(rugX, rugY, rugW, rugH, 14);
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = plumMid;
          drawChamferedRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16, 10);
          ctx.fill();
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Warm sage-emerald botanical center field & rose-gold blossom emblem
          ctx.fillStyle = '#296045';
          drawChamferedRect(rugX + 22, rugY + 20, rugW - 44, rugH - 40, 8);
          ctx.fill();
          ctx.strokeStyle = '#f5ebe0';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = 'rgba(245, 235, 224, 0.10)';
          for (let py = rugY + 32; py < rugY + rugH - 32; py += 18) {
            ctx.fillRect(rugX + 36, py, rugW - 72, 2);
          }

          ctx.fillStyle = '#f5ebe0';
          [
            [rugX + 36, rugY + 32],
            [rugX + rugW - 42, rugY + 32],
            [rugX + 36, rugY + rugH - 38],
            [rugX + rugW - 42, rugY + rugH - 38]
          ].forEach(([cxp, cyp]) => {
            ctx.fillRect(cxp, cyp, 6, 6);
            ctx.fillStyle = '#f472b6';
            ctx.fillRect(cxp + 2, cyp + 2, 2, 2);
            ctx.fillStyle = '#f5ebe0';
          });

          const rcx = snap(rugX + rugW / 2);
          const rcy = snap(rugY + rugH / 2);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(rcx - 24, rcy - 4, 48, 8);
          ctx.fillRect(rcx - 4, rcy - 24, 8, 48);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(rcx - 10, rcy - 10, 20, 20);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(rcx - 4, rcy - 4, 8, 8);

          // Three Morning Sunbeams streaming through Conservatory Bay Windows
          [
            [316, 404],
            [426, 574],
            [594, 686]
          ].forEach(([bx1, bx2]) => {
            const beam = ctx.createLinearGradient((bx1 + bx2) / 2, floorTop - 16, (bx1 + bx2) / 2 - 48, floorTop + 210);
            beam.addColorStop(0, 'rgba(254, 249, 195, 0.24)');
            beam.addColorStop(0.6, 'rgba(254, 240, 138, 0.09)');
            beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(bx1, floorTop - 16);
            ctx.lineTo(bx2, floorTop - 16);
            ctx.lineTo(bx2 - 64, floorTop + 206);
            ctx.lineTo(bx1 - 64, floorTop + 206);
            ctx.closePath();
            ctx.fill();
          });
        }
      });

      const { ctx, S, rx, ry, floorTop, INK, snap, pxBox } = g;

      // 1. North-Left Wall: Pressed Herbarium Plates & Seed Apothecary Shelf
      const hbX = snap(rx + 74);
      const hbY = snap(ry + 36);
      ctx.fillStyle = 'rgba(20, 12, 8, 0.26)';
      ctx.fillRect(hbX + 3, hbY + 5, 96, 56);
      pxBox(hbX, hbY, 96, 56, '#784d31', '#a47247', '#452817', INK, 2.5);
      // Twin cream specimen mount cards inside frame
      pxBox(hbX + 6, hbY + 6, 40, 44, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      pxBox(hbX + 50, hbY + 6, 40, 44, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      // Pressed emerald fern + crimson blossom specimen pixels
      ctx.fillStyle = '#15803d';
      ctx.fillRect(hbX + 24, hbY + 14, 4, 28);
      ctx.fillRect(hbX + 16, hbY + 18, 20, 4);
      ctx.fillRect(hbX + 14, hbY + 26, 24, 4);
      ctx.fillRect(hbX + 18, hbY + 34, 16, 4);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(hbX + 68, hbY + 26, 4, 16);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(hbX + 62, hbY + 14, 16, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(hbX + 68, hbY + 18, 4, 4);

      // Small Cedar Shelf with Seed Jars & Leaf Garland
      const shX = snap(rx + 78);
      const shY = snap(ry + 114);
      pxBox(shX, shY, 88, 10, '#784d31', '#a47247', '#452817', INK, 2);
      pxBox(shX + 10, shY - 14, 14, 14, '#86efac', '#dcfce7', '#22c55e', INK, 1.5);
      pxBox(shX + 36, shY - 16, 14, 16, '#fda4af', '#ffe4e6', '#e11d48', INK, 1.5);
      pxBox(shX + 62, shY - 12, 16, 12, '#fde047', '#fef9c3', '#d97706', INK, 1.5);

      // 2. North Wall Expansive Triple Conservatory Windows & Hanging Macrame Planters
      const drawConservatoryBay = (bx, by, bw, bh, arched, hasBloom) => {
        if (arched) {
          const ar = Math.floor(bw / 2);
          const acy = by + ar;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(bx + ar, acy, ar, Math.PI, 0);
          ctx.lineTo(bx + bw, by + bh);
          ctx.lineTo(bx, by + bh);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = INK;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          // Brass keystone crest atop central arch
          pxBox(bx + ar - 8, by - 4, 16, 10, '#d97706', '#fef08a', '#92400e', INK, 2);
        } else {
          pxBox(bx, by, bw, bh, '#f8fafc', '#ffffff', '#cbd5e1', INK, 2.5);
        }

        ctx.save();
        ctx.beginPath();
        if (arched) {
          const ar = Math.floor(bw / 2);
          ctx.arc(bx + ar, by + ar, ar - 8, Math.PI, 0);
          ctx.lineTo(bx + bw - 8, by + bh - 10);
          ctx.lineTo(bx + 8, by + bh - 10);
          ctx.closePath();
        } else {
          ctx.rect(bx + 6, by + 6, bw - 12, bh - 14);
        }
        ctx.clip();

        const sky = ctx.createLinearGradient(bx, by, bx, by + bh);
        sky.addColorStop(0, '#7dd3fc');
        sky.addColorStop(0.55, '#bae6fd');
        sky.addColorStop(1, '#fef9c3');
        ctx.fillStyle = sky;
        ctx.fillRect(bx, by, bw, bh);

        // Fluffy white cloud pixels + distant garden bushes outside
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 14, by + (arched ? 32 : 18), 28, 8);
        ctx.fillRect(bx + 20, by + (arched ? 28 : 14), 16, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(bx + 6, by + bh - 34, bw - 12, 26);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(bx + 16, by + bh - 40, 26, 10);
        ctx.fillRect(bx + bw - 44, by + bh - 38, 28, 10);
        if (hasBloom) {
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(bx + 26, by + bh - 34, 6, 6);
          ctx.fillRect(bx + bw - 34, by + bh - 30, 6, 6);
        }

        // Crisp dark-edged white mullions
        const midX = snap(bx + bw / 2 - 3);
        const midY = snap(by + Math.floor(bh * 0.54));
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(midX - 1, by + 6, 8, bh - 12);
        ctx.fillRect(bx + 6, midY - 1, bw - 12, 7);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(midX, by + 6, 6, bh - 12);
        ctx.fillRect(bx + 6, midY, bw - 12, 5);
        ctx.restore();

        // Crisp cream & cedar windowsill + tiny herb pots on side bays
        pxBox(bx - 6, by + bh - 10, bw + 12, 10, '#f1efe2', '#ffffff', '#cbbba2', INK, 2.5);
        if (!arched) {
          pxBox(bx + 12, by + bh - 20, 14, 10, '#c2410c', '#ea580c', null, INK, 1.5);
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(bx + 14, by + bh - 26, 10, 6);
        }
      };

      drawConservatoryBay(308, ry + 40, 96, 94, false, true);
      drawConservatoryBay(422, ry + 28, 152, 106, true, false);
      drawConservatoryBay(592, ry + 40, 96, 94, false, true);

      // Forest-Green painted shutter accents framing outer bays
      pxBox(294, ry + 48, 14, 80, greenMid, greenHi, greenDark, INK, 2);
      pxBox(688, ry + 48, 14, 80, greenMid, greenHi, greenDark, INK, 2);

      // 3 Hanging Swaying Macrame Terracotta Planters cleanly suspended inside panes
      [
        [334, ry + 46, ry + 72],
        [498, ry + 38, ry + 70],
        [662, ry + 46, ry + 72]
      ].forEach(([hx, topY, potY], idx) => {
        const sway = Math.round(Math.sin(t * 0.055 + idx * 1.4) * 2) * 2;
        const py = snap(potY);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, topY);
        ctx.lineTo(hx + sway, py);
        ctx.stroke();
        // Terracotta rimmed hanging pot & dark-edged cascading emerald vines
        pxBox(hx - 10 + sway, py, 20, 12, '#c2410c', '#ea580c', '#7c2d12', INK, 2);
        pxBox(hx - 14 + sway, py - 8, 28, 10, '#15803d', '#4ade80', '#14532d', INK, 1.5);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx - 12 + sway, py + 12, 6, 12);
        ctx.fillRect(hx + 6 + sway, py + 12, 6, 10);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(hx - 10 + sway, py + 12, 4, 8);
        ctx.fillRect(hx + 8 + sway, py + 12, 4, 6);
        ctx.fillStyle = idx === 1 ? '#fde047' : '#f472b6';
        ctx.fillRect(hx - 6 + sway, py - 6, 4, 4);
        ctx.fillRect(hx + 4 + sway, py - 6, 4, 4);
      });

      // 3. North-Center Blocked Zone: Stepped Nursery Bench & Twin Iron Plant Etageres (x: 302..490, y <= 288 behind Maya!)
      // Low central cedar propagation shelf (cleanly above Maya's 6.2, 5.35 sprite!)
      const nbX = snap(352);
      const nbY = snap(floorTop - 4); // 242..282
      ctx.fillStyle = 'rgba(20, 12, 8, 0.28)';
      ctx.fillRect(nbX + 2, nbY + 6, 90, 40);
      pxBox(nbX + 8, nbY + 22, 12, 18, '#5c3a22', null, '#3b2212', INK, 2);
      pxBox(nbX + 70, nbY + 22, 12, 18, '#5c3a22', null, '#3b2212', INK, 2);
      pxBox(nbX, nbY, 90, 24, '#8b5e3c', '#b98556', '#5c3a22', INK, 2.5);
      // Glowing Firebloom sprout bell-jar & amber specimen vials on nursery shelf
      pxBox(nbX + 10, nbY - 12, 18, 20, '#86efac', '#dcfce7', '#22c55e', INK, 1.5);
      pxBox(nbX + 38, nbY - 16, 20, 22, '#f9a8d4', '#fce7f3', '#ec4899', INK, 2);
      pxBox(nbX + 66, nbY - 10, 14, 16, '#fbbf24', '#fef08a', '#b45309', INK, 1.5);

      // Left & Right Wrought-Iron Two-Tier Plant Etageres (framing Maya nicely!)
      [304, 448].forEach((ex, sideIdx) => {
        const ey = snap(floorTop - 28); // 218..288
        ctx.fillStyle = 'rgba(20, 12, 8, 0.30)';
        ctx.fillRect(ex + 2, ey + 6, 42, 68);
        pxBox(ex, ey, 42, 70, '#334155', '#64748b', '#1e293b', INK, 2);
        // Cedar slats on tiers
        pxBox(ex + 2, ey + 28, 38, 8, '#8b5e3c', '#b98556', null, INK, 1.5);
        pxBox(ex + 2, ey + 58, 38, 8, '#8b5e3c', '#b98556', null, INK, 1.5);
        // Top lush flowering plant pot & lower cactus/fern pot
        pxBox(ex + 10, ey + 14, 22, 14, '#c2410c', '#ea580c', '#7c2d12', INK, 1.5);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(ex + 8, ey + 2, 26, 12);
        ctx.fillStyle = sideIdx === 0 ? '#ec4899' : '#f59e0b';
        ctx.fillRect(ex + 14, ey - 2, 6, 6);
        ctx.fillRect(ex + 24, ey, 6, 6);

        pxBox(ex + 12, ey + 44, 18, 14, '#b45309', '#f59e0b', null, INK, 1.5);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(ex + 12, ey + 34, 18, 10);
      });

      // North-Right Brass Sundial Barometer on Wall between Conservatory & Bookshelf
      const barX = snap(718);
      const barY = snap(ry + 78);
      pxBox(barX, barY, 28, 28, '#b45309', '#fef08a', '#78350f', INK, 2);
      pxBox(barX + 6, barY + 6, 16, 16, '#fef3c7', '#ffffff', null, INK, 1.5);
      ctx.fillStyle = plumMid;
      ctx.fillRect(barX + 13, barY + 9, 2, 7);

      // 4. West Blocked Zone: Slatted Cedar Potting Workbench, Sun-Orchids & Burlap Soil Sack (x: 140..286, y: 244..416)
      const pbX = snap(2.3 * S);
      const pbY = snap(floorTop + 2);
      const pbW = 132;
      const pbH = 108; // bottom = 356
      ctx.fillStyle = 'rgba(20, 12, 8, 0.34)';
      ctx.fillRect(pbX + 4, pbY + 8, pbW, pbH);

      pxBox(pbX + 8, pbY + pbH - 42, 16, 42, '#6c452b', '#8b5e3c', '#3b2212', INK, 2.5);
      pxBox(pbX + pbW - 24, pbY + pbH - 42, 16, 42, '#6c452b', '#8b5e3c', '#3b2212', INK, 2.5);
      pxBox(pbX + 22, pbY + pbH - 28, pbW - 44, 14, '#5c3a22', '#784d31', '#2e1a0c', INK, 2);
      // Nested spare clay pots on lower shelf
      pxBox(pbX + 34, pbY + pbH - 42, 22, 16, '#c2410c', '#ea580c', '#7c2d12', INK, 1.5);
      pxBox(pbX + 66, pbY + pbH - 40, 20, 14, '#c2410c', '#ea580c', '#7c2d12', INK, 1.5);

      // Slatted Cedar Potting Top & Recessed Peat Soil Bin
      pxBox(pbX, pbY, pbW, 60, '#8b5e3c', '#b98556', '#5c3a22', INK, 2.5);
      pxBox(pbX + 8, pbY + 10, 44, 36, '#3b2212', '#54331e', null, INK, 2);
      // Young emerald seedling sprouting from rich potting compost
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pbX + 26, pbY + 18, 4, 12);
      ctx.fillRect(pbX + 20, pbY + 16, 6, 4);
      ctx.fillRect(pbX + 30, pbY + 16, 6, 4);

      // Blooming Pink & Gold Sun-Orchids + Brass Watering Can on Right Half of Potting Bench
      pxBox(pbX + 58, pbY + 10, 22, 18, '#c2410c', '#ea580c', '#7c2d12', INK, 2);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(pbX + 58, pbY + 2, 22, 8);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(pbX + 62, pbY - 2, 14, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(pbX + 67, pbY, 4, 4);

      // Polished Copper Watering Can
      pxBox(pbX + 94, pbY + 20, 24, 22, '#d97706', '#fef08a', '#92400e', INK, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(pbX + 84, pbY + 20, 10, 4);
      ctx.fillRect(pbX + 80, pbY + 16, 6, 6);

      // Lower West Zone (y = 362..414 <= 422.4!): Soil Burlap Sack + pot_large Sprite + Harvest Herb Crate
      const skX = snap(pbX);
      const skY = snap(pbY + pbH + 8);
      ctx.fillStyle = 'rgba(20, 12, 8, 0.30)';
      ctx.fillRect(skX + 2, skY + 6, 42, 42);
      pxBox(skX, skY + 4, 42, 40, '#d6b68a', '#eed8b6', '#a8875b', INK, 2);
      pxBox(skX + 8, skY - 2, 26, 8, '#c4a273', null, null, INK, 2);
      ctx.fillStyle = greenMid;
      ctx.fillRect(skX + 16, skY + 18, 10, 10);

      if (this.isImgReady('pot_large')) {
        const plImg = this.owSprites.pot_large;
        const plw = 46;
        const plh = Math.round(plw * (plImg.height / plImg.width));
        const plX = snap(pbX + 48);
        const plY = snap(skY + 46 - plh);
        ctx.fillStyle = 'rgba(20, 12, 8, 0.30)';
        ctx.beginPath(); ctx.ellipse(plX + plw / 2, skY + 44, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(plImg, plX, plY, plw, plh);
      }

      pxBox(pbX + 100, skY + 6, 32, 36, '#784d31', '#a47247', '#452817', INK, 2);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pbX + 104, skY - 2, 24, 10);

      // 5. East Blocked Zone: Botanical Bookshelf + Glass Terrarium & Brass Microscope Research Desk (x >= 11.2, y <= 354!)
      this._drawEastBookshelfCorner(g, (bkX, bkY, bkW) => {
        const jx = snap(bkX + bkW / 2);
        const jy = snap(bkY + 2);
        pxBox(jx - 10, jy - 6, 20, 6, '#5c3a22', '#8b5e3c', null, INK, 2);
        pxBox(jx - 9, jy - 24, 18, 18, '#a7f3d0', '#ecfdf5', '#34d399', INK, 2);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(jx - 4, jy - 18, 8, 10);
      });

      // Oak & Forest-Green Herbarium Research Desk (x: 720..874, y: 254..346 <= 358!)
      const dkX = snap(11.24 * S); // 720
      const dkY = snap(floorTop + 8); // 254
      const dkW = 154;
      const dkH = 92; // bottom 346!
      ctx.fillStyle = 'rgba(20, 12, 8, 0.36)';
      ctx.fillRect(dkX + 3, dkY + 8, dkW, dkH);

      pxBox(dkX + 6, dkY + dkH - 36, 16, 36, '#6c452b', '#8b5e3c', '#3b2212', INK, 2.5);
      pxBox(dkX + dkW - 22, dkY + dkH - 36, 16, 36, '#6c452b', '#8b5e3c', '#3b2212', INK, 2.5);
      pxBox(dkX + 20, dkY + dkH - 42, dkW - 40, 26, '#5c3a22', null, '#3b2212', INK, 2.5);
      pxBox(dkX + 28, dkY + dkH - 36, 40, 14, greenMid, null, null, INK, 1.5);
      pxBox(dkX + dkW - 68, dkY + dkH - 36, 40, 14, greenMid, null, null, INK, 1.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(dkX + 44, dkY + dkH - 31, 8, 4);
      ctx.fillRect(dkX + dkW - 52, dkY + dkH - 31, 8, 4);

      // Sunlit oak desktop
      pxBox(dkX, dkY, dkW, 56, '#8b5e3c', '#be8a58', '#5c3a22', INK, 2.5);
      ctx.fillStyle = '#6c452b';
      ctx.fillRect(dkX + 4, dkY + 26, dkW - 8, 2);

      // Brass Compound Microscope + Glowing Stage Slide on Left
      const mcX = snap(dkX + 24);
      const mcY = snap(dkY + 26);
      pxBox(mcX - 10, mcY + 6, 22, 10, '#475569', '#94a3b8', '#1e293b', INK, 2);
      pxBox(mcX - 2, mcY - 12, 8, 18, '#d97706', '#fef08a', '#92400e', INK, 2);
      pxBox(mcX - 8, mcY - 16, 14, 10, '#f59e0b', '#fef08a', null, INK, 1.5);
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(mcX - 8, mcY + 2, 12, 4);

      // Open Herbarium Field Book in Center of Desk
      pxBox(dkX + 52, dkY + 12, 24, 30, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      pxBox(dkX + 76, dkY + 12, 24, 30, '#fef3c7', '#ffffff', '#e5d3a3', INK, 1.5);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(dkX + 58, dkY + 18, 12, 10);
      ctx.fillStyle = plumMid;
      ctx.fillRect(dkX + 82, dkY + 18, 12, 2);
      ctx.fillRect(dkX + 82, dkY + 24, 10, 2);
      ctx.fillRect(dkX + 82, dkY + 30, 12, 2);

      // Hexagonal Glass Moss & Bio-Fern Terrarium on Right of Desk
      const trrX = snap(dkX + dkW - 26);
      const trrY = snap(dkY + 24);
      pxBox(trrX - 14, trrY - 16, 28, 30, '#a7f3d0', '#ecfdf5', '#10b981', '#d97706', 2);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(trrX - 8, trrY - 6, 16, 14);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(trrX - 2, trrY - 10, 4, 4);

      // Cushioned Burgundy Velvet Study Chair tucked in front of desk (y <= 354!)
      const scX = snap(dkX + 54);
      const scY = snap(dkY + dkH - 28); // 318..354
      pxBox(scX, scY, 36, 26, '#784d31', '#a47247', '#452817', INK, 2);
      pxBox(scX + 4, scY + 2, 28, 16, plumMid, plumHi, plumDark, INK, 2);

      // Soft Botanical Emerald Glows around Microscope Stage & Biosphere Terrarium
      const bioGlow = ctx.createRadialGradient(trrX, trrY - 4, 4, trrX, trrY - 4, 64);
      bioGlow.addColorStop(0, 'rgba(52, 211, 153, 0.24)');
      bioGlow.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = bioGlow;
      ctx.fillRect(trrX - 66, trrY - 70, 132, 132);
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
      ctx.imageSmoothingEnabled = false;
      this._extDepthProps = [];
      const queueExtSprite = (img, dx, dy, dw, dh, sortY) => {
        const rx = Math.round(dx), ry = Math.round(dy), rw = Math.round(dw), rh = Math.round(dh);
        this._extDepthProps.push({
          sortY: Math.round(sortY),
          zBias: 0,
          draw: () => {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, rx, ry, rw, rh);
          }
        });
      };
      const S = this.TILE; // 64px
      const W = this.canvas.width;  // 1024
      const EXT_W = Math.round(this.EXT_COLS * S); // 1664px (Expanded East Central Park)
      const EXT_H = Math.round(this.EXT_ROWS * S); // 1184px (Expanded South Block)
      const pName = this.draftAppearance?.name || 'Asher';
      const fName = this.friendName || 'Mike';

      // 1. Lush Sunlit Meadow Pixel-Art Grass Base across the neighborhood & Central Park
      this.initCobblestonePattern();
      ctx.fillStyle = this.grassPattern || '#58aa3c';
      ctx.fillRect(0, 0, EXT_W, EXT_H);

      // Fallback meadow grass speckles only when PNG tile has not finished decoding
      if (this._pixelArtVer !== 3) {
        for (let i = 0; i < 160; i++) {
          const gx = Math.floor(this.hash(i, 11) * (EXT_W - 24) / 2) * 2 + 12;
          const gy = Math.floor(this.hash(i, 22) * (EXT_H - 24) / 2) * 2 + 12;
          if (i % 5 === 0) {
            ctx.fillStyle = '#3d8226';
            ctx.fillRect(gx, gy, 4, 2);
            ctx.fillStyle = i % 10 === 0 ? '#fef08a' : '#ffffff';
            ctx.fillRect(gx + 2, gy - 2, 2, 2);
          } else {
            ctx.fillStyle = i % 2 === 0 ? '#74cc4e' : '#428c2a';
            ctx.fillRect(gx, gy, 2, 2);
            ctx.fillRect(gx + 2, gy + 2, 2, 2);
          }
        }
      }

      // 2. WARM SANDY-TAN RPG TOWN PATH NETWORK WITH PIXEL STONE CURBS:
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
      const midConnH = (road2Y + road2H) - road1Y;

      const oakhavenTurnX = 14.25 * S;
      const oakhavenTurnW = 1.10 * S;
      const oakhavenRoad1W = (oakhavenTurnX + oakhavenTurnW);

      // Warm Ochre Packed-Dirt Path Surface (Upper, Lower, Connectors)
      ctx.fillStyle = this.cobblePattern || '#b98a52';
      ctx.fillRect(0, road1Y, oakhavenRoad1W, road1H);
      ctx.fillRect(oakhavenTurnX, 0, oakhavenTurnW, road1Y + road1H);
      ctx.fillRect(0, road3Y, EXT_W, road3H);
      ctx.fillRect(south1X, road1Y, south1W, midConnH);
      ctx.fillRect(south2X, road1Y, south2W, fullConnH);

      // Middle Commercial Road: Irregular Flagstone Cobblestone Street (matching reference!)
      ctx.fillStyle = this.flagstonePattern || '#988878';
      ctx.fillRect(0, road2Y, W, road2H);

      // Soft warm shadow cast by grass borders onto the dirt/stone roads
      const drawRoadVignette = (ry, rh, rw = W) => {
        const vGrad = ctx.createLinearGradient(0, ry, 0, ry + rh);
        vGrad.addColorStop(0, 'rgba(36, 22, 10, 0.28)');
        vGrad.addColorStop(0.18, 'rgba(36, 22, 10, 0.05)');
        vGrad.addColorStop(0.82, 'rgba(36, 22, 10, 0.02)');
        vGrad.addColorStop(1, 'rgba(36, 22, 10, 0.20)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, ry, rw, rh);
      };
      drawRoadVignette(road1Y, road1H, oakhavenRoad1W);
      const vGradNorth = ctx.createLinearGradient(oakhavenTurnX, 0, oakhavenTurnX + oakhavenTurnW, 0);
      vGradNorth.addColorStop(0, 'rgba(36, 22, 10, 0.25)');
      vGradNorth.addColorStop(0.2, 'rgba(36, 22, 10, 0.04)');
      vGradNorth.addColorStop(0.8, 'rgba(36, 22, 10, 0.04)');
      vGradNorth.addColorStop(1, 'rgba(36, 22, 10, 0.22)');
      ctx.fillStyle = vGradNorth;
      ctx.fillRect(oakhavenTurnX, 0, oakhavenTurnW, road1Y + road1H);
      drawRoadVignette(road2Y, road2H, W);
      drawRoadVignette(road3Y, road3H, EXT_W);

      // Walkways with Organic Rounded Stepping Stones (no rigid grey box)
      const drawDrivewayPath = (px, py, pw, ph) => {
        const x = Math.round(px), y = Math.round(py), w = Math.round(pw), h = Math.round(ph);
        // Subtle worn dirt trail under stepping stones
        ctx.fillStyle = 'rgba(166, 122, 70, 0.65)';
        ctx.fillRect(x + 2, y, w - 4, h);
        // Alternating irregular rounded flagstones
        let idx = 0;
        for (let sy = y + 4; sy < y + h - 8; sy += 13) {
          const sx = x + 3 + ((idx % 2 === 0) ? 0 : 4);
          const sw = Math.max(14, w - 10 - (idx % 2) * 2);
          ctx.fillStyle = '#382a1e';
          ctx.fillRect(sx, sy + 1, sw, 9);
          ctx.fillRect(sx + 2, sy, sw - 4, 11);
          ctx.fillStyle = idx % 2 === 0 ? '#a89886' : '#968674';
          ctx.fillRect(sx + 2, sy + 1, sw - 4, 8);
          ctx.fillStyle = '#c8baa8';
          ctx.fillRect(sx + 3, sy + 1, sw - 6, 3);
          idx++;
        }
      };

      drawDrivewayPath(1.71 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      drawDrivewayPath(9.79 * S, 3.22 * S, 0.50 * S, road1Y - 3.22 * S + 4);
      drawDrivewayPath(1.71 * S, 8.85 * S, 0.50 * S, road2Y - 8.85 * S + 4);
      drawDrivewayPath(13.25 * S, 9.05 * S, 0.80 * S, road2Y - 9.05 * S + 4);
      drawDrivewayPath(1.71 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);
      drawDrivewayPath(7.35 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);
      drawDrivewayPath(12.43 * S, 14.15 * S, 0.50 * S, road3Y - 14.15 * S + 4);

      // Organic Raised 3/4 Turf-Lip & Rounded Stone Curb Edges along Grass-to-Road Borders
      const drawStoneCurbH = (cx, cy, cw, side = 'bot') => {
        const x = Math.round(cx), y = Math.round(cy), w = Math.round(cw);
        if (w <= 0) return;
        const key = side === 'top' ? 'turf_edge_top' : 'turf_edge_bot';
        if (this.isImgReady(key)) {
          const img = this.owSprites[key];
          const drawH = side === 'top' ? 14 : 18;
          const drawY = side === 'top' ? (y - 6) : (y - 2);
          const spanW = 160;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, drawY - 2, w, drawH + 4);
          ctx.clip();
          for (let sx = x; sx < x + w; sx += spanW) {
            ctx.drawImage(img, sx, drawY, spanW, drawH);
          }
          ctx.restore();
          return;
        }
        ctx.fillStyle = '#223e16';
        ctx.fillRect(x, y + 4, w, 2);
        ctx.fillStyle = '#366822';
        ctx.fillRect(x, y, w, 4);
        ctx.fillStyle = '#6ec048';
        ctx.fillRect(x, y, w, 2);
      };
      const drawStoneCurbV = (cx, cy, ch, side = 'right') => {
        const x = Math.round(cx), y = Math.round(cy), h = Math.round(ch);
        if (h <= 0) return;
        const key = side === 'left' ? 'turf_edge_left' : 'turf_edge_right';
        if (this.isImgReady(key)) {
          const img = this.owSprites[key];
          const drawW = 14;
          const drawX = side === 'left' ? (x - 5) : (x - 2);
          const spanH = 160;
          ctx.save();
          ctx.beginPath();
          ctx.rect(drawX - 2, y, drawW + 4, h);
          ctx.clip();
          for (let sy = y; sy < y + h; sy += spanH) {
            ctx.drawImage(img, drawX, sy, drawW, spanH);
          }
          ctx.restore();
          return;
        }
        ctx.fillStyle = '#223e16';
        ctx.fillRect(x + 4, y, 2, h);
        ctx.fillStyle = '#366822';
        ctx.fillRect(x, y, 4, h);
        ctx.fillStyle = '#6ec048';
        ctx.fillRect(x + 1, y, 2, h);
      };

      // Upper Road Top Curbs (bottom overhang of north grass plots)
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: (9.79 - 2.21) * S },
        { x: 10.29 * S, w: oakhavenTurnX - 10.29 * S }
      ].forEach(c => drawStoneCurbH(c.x, road1Y - 6, c.w, 'bot'));
      drawStoneCurbV(oakhavenTurnX - 6, 0, road1Y, 'right');

      // Upper Road Bottom Curbs (top lip of middle grass plots)
      [
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: (oakhavenTurnX + oakhavenTurnW) - (south2X + south2W) }
      ].forEach(c => drawStoneCurbH(c.x, road1Y + road1H, c.w, 'top'));
      drawStoneCurbV(oakhavenTurnX + oakhavenTurnW, 0, road1Y + road1H + 6, 'left');

      // Middle Road Top Curbs
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: south1X - 2.21 * S },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: (13.25 * S) - (south2X + south2W) },
        { x: 14.05 * S, w: W - 14.05 * S }
      ].forEach(c => drawStoneCurbH(c.x, road2Y - 6, c.w, 'bot'));

      // Middle Road Bottom Curbs
      [
        { x: 0, w: south2X },
        { x: south2X + south2W, w: W - (south2X + south2W) }
      ].forEach(c => drawStoneCurbH(c.x, road2Y + road2H, c.w, 'top'));

      // Southern Avenue Top Curbs
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: (7.35 - 2.21) * S },
        { x: 7.85 * S, w: south2X - 7.85 * S },
        { x: south2X + south2W, w: (12.43 * S) - (south2X + south2W) },
        { x: 12.93 * S, w: EXT_W - 12.93 * S }
      ].forEach(c => drawStoneCurbH(c.x, road3Y - 6, c.w, 'bot'));

      // Southern Avenue Bottom Continuous Curb
      drawStoneCurbH(0, road3Y + road3H, EXT_W, 'top');

      // Vertical Curbs along North-South Connector Roads
      const connMidH = road2Y - (road1Y + road1H);
      const connSouthH = road3Y - (road2Y + road2H);
      [
        { x: south1X - 6, side: 'right', south: false },
        { x: south1X + south1W, side: 'left', south: false },
        { x: south2X - 6, side: 'right', south: true },
        { x: south2X + south2W, side: 'left', south: true }
      ].forEach(({ x: vx, side, south }) => {
        drawStoneCurbV(vx, road1Y + road1H, connMidH, side);
        if (south) drawStoneCurbV(vx, road2Y + road2H, connSouthH, side);
      });

      // Chunky Pixel Wooden Picket Fences (Sprites/Overworld/fence.png)
      const drawWoodFence = (fx, fy, fw) => {
        const x = Math.round(fx), y = Math.round(fy), w = Math.round(fw);
        if (this.isImgReady('fence')) {
          const img = this.owSprites.fence;
          const fh = 24;
          const segW = Math.max(24, Math.round(fh * (img.width / img.height)));
          ctx.fillStyle = 'rgba(18, 12, 8, 0.25)';
          ctx.fillRect(x + 2, y + 12, w - 4, 5);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y - 10, w, fh + 4);
          ctx.clip();
          for (let sx = x; sx < x + w; sx += segW) {
            ctx.drawImage(img, sx, y - 8, segW, fh);
          }
          ctx.restore();
          return;
        }
        ctx.fillStyle = 'rgba(14, 24, 10, 0.28)';
        ctx.fillRect(x, y + 12, w, 4);
        ctx.fillStyle = '#24160c';
        ctx.fillRect(x, y + 4, w, 4);
        ctx.fillRect(x, y + 9, w, 4);
        ctx.fillStyle = '#8c5a32';
        ctx.fillRect(x + 1, y + 5, w - 2, 2);
        ctx.fillRect(x + 1, y + 10, w - 2, 2);
        for (let px = x; px < x + w - 4; px += 12) {
          ctx.fillStyle = '#24160c';
          ctx.fillRect(px, y, 8, 15);
          ctx.fillStyle = '#9c663a';
          ctx.fillRect(px + 1, y + 1, 6, 13);
        }
      };
      for (const [fx, fy, fw] of this.getExteriorFences()) {
        drawWoodFence(fx * S, fy * S, fw * S);
      }

      // Terracotta Potted Plants beside Porches & Fences
      const pots = [
        [4.38 * S, 2.75 * S, true], [4.38 * S, 3.18 * S, false],
        [11.00 * S, 2.75 * S, true], [11.00 * S, 3.18 * S, false],
        [4.38 * S, 8.25 * S, true], [4.38 * S, 8.68 * S, false],
        [0.75 * S, 14.05 * S, false], [6.55 * S, 14.05 * S, true], [11.55 * S, 14.05 * S, false]
      ];
      pots.forEach(([px, py, isLarge]) => {
        const key = isLarge ? 'pot_large' : 'pot_small';
        if (this.isImgReady(key)) {
          const img = this.owSprites[key];
          const ph = isLarge ? 32 : 26;
          const pw = Math.round(ph * (img.width / img.height));
          ctx.drawImage(img, Math.round(px), Math.round(py), pw, ph);
        } else if (this.pottedPlantStamp) {
          ctx.drawImage(this.pottedPlantStamp, Math.round(px), Math.round(py), 26, 32);
        }
      });

      // 3. REUSABLE CRAFTSMAN / VICTORIAN GABLE COTTAGE RENDERER
      const drawNeighborhoodCottage = (cfg) => {
        const {
          hx, hy, hw,
          spriteKey,
          mirror = false,
          roofDark, roofMid, roofLight,
          sidingCol, sidingLineCol, trimCol,
          doorMatCol, hasChimney = false, glowWindows = false
        } = cfg;

        if (spriteKey && this.isImgReady(spriteKey)) {
          const img = this.owSprites[spriteKey];
          const dw = Math.round(hw + 14);
          const dh = Math.round(dw * (img.height / img.width));
          const dx = Math.round(hx - 7);
          const dy = Math.round(hy + 2.95 * S - dh);
          ctx.fillStyle = 'rgba(18, 12, 8, 0.30)';
          ctx.beginPath();
          ctx.ellipse(dx + dw / 2, dy + dh - 8, Math.round(dw * 0.46), 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.drawImage(img, dx, dy, dw, dh);
          return;
        }

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
          const chX = mirror ? Math.round(hx + hw - 24) : Math.round(hx + 10);
          const chY = Math.round(hy - 8);
          ctx.fillStyle = '#1e1814';
          ctx.fillRect(chX - 2, chY - 2, 18, 40);
          ctx.fillStyle = '#5c5852';
          ctx.fillRect(chX, chY, 14, 36);
          ctx.fillStyle = '#78726a';
          for (let cy = chY + 2; cy < chY + 34; cy += 6) {
            ctx.fillRect(chX + 1, cy, 6, 4);
            ctx.fillRect(chX + 8, cy + 2, 5, 4);
          }
          // Chimney crown cap
          ctx.fillStyle = '#1e1814';
          ctx.fillRect(chX - 3, chY - 3, 20, 6);
          ctx.fillStyle = '#928a80';
          ctx.fillRect(chX - 1, chY - 1, 16, 3);
          for (let s = 0; s < 3; s++) {
            const smokeY = chY - 6 - ((this.tick * 0.28 + s * 9) % 22);
            ctx.fillStyle = 'rgba(226, 232, 240, 0.34)';
            ctx.beginPath();
            ctx.arc(chX + 7 + Math.sin(this.tick * 0.05 + s) * 3, smokeY, 3.2 + s * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Brick Foundation Base
        ctx.fillStyle = '#24140e';
        ctx.fillRect(Math.round(hx) - 1, Math.round(brickY) - 1, Math.round(hw) + 2, Math.round(foundH) + 2);
        ctx.fillStyle = '#7c3f2c';
        ctx.fillRect(Math.round(hx), Math.round(brickY), Math.round(hw), Math.round(foundH));
        ctx.fillStyle = '#9c523b';
        for (let bx = Math.round(hx) + 2; bx < hx + hw - 6; bx += 12) {
          ctx.fillRect(bx, Math.round(brickY) + 1, 8, 3);
          ctx.fillRect(bx + 5, Math.round(brickY) + 5, 7, 3);
        }
        ctx.fillStyle = '#4e2418';
        ctx.fillRect(Math.round(hx), Math.round(brickY) + 4, Math.round(hw), 1);

        // Porch Deck (Warm timber floorboards + under-porch shadow)
        const porchH = Math.round(railY - deckY + 7);
        ctx.fillStyle = '#24160c';
        ctx.fillRect(Math.round(hx) - 1, Math.round(deckY) - 1, Math.round(hw) + 2, porchH + 2);
        ctx.fillStyle = '#6c4424';
        ctx.fillRect(Math.round(hx), Math.round(deckY), Math.round(hw), porchH);
        ctx.fillStyle = '#845430';
        for (let py = Math.round(deckY) + 2; py < deckY + porchH - 3; py += 5) {
          ctx.fillRect(Math.round(hx) + 1, py, Math.round(hw) - 2, 3);
        }
        ctx.fillStyle = '#422814';
        for (let px = Math.round(hx) + 6; px < hx + hw; px += 8) {
          ctx.fillRect(px, Math.round(deckY), 1, porchH);
        }
        ctx.fillStyle = 'rgba(18, 10, 6, 0.34)';
        ctx.fillRect(Math.round(hx), Math.round(deckY), Math.round(hw), 6);

        // Clapboard Siding Helper (crisp pixel boards + eave shadow)
        const drawWall = (wx, wy, ww, wh, shadeSide = false, eaveShadow = true) => {
          const x = Math.round(wx), y = Math.round(wy), w = Math.round(ww), h = Math.round(wh);
          ctx.fillStyle = '#221812';
          ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
          ctx.fillStyle = sidingCol;
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = sidingLineCol;
          for (let sy = y + 5; sy < y + h - 4; sy += 5) {
            ctx.fillRect(x, sy, w, 1);
          }
          if (shadeSide) {
            ctx.fillStyle = 'rgba(18, 12, 8, 0.16)';
            const sx = mirror ? (x + w - 13) : x;
            ctx.fillRect(sx, y, 13, h);
          }
          if (eaveShadow) {
            ctx.fillStyle = 'rgba(20, 12, 8, 0.24)';
            ctx.fillRect(x, y, w, 6);
          }
          // Corner trim boards & baseboard
          ctx.fillStyle = '#241a14';
          ctx.fillRect(x, y, 6, h);
          ctx.fillRect(x + w - 6, y, 6, h);
          ctx.fillRect(x, y + h - 5, w, 5);
          ctx.fillStyle = trimCol;
          ctx.fillRect(x + 1, y + 1, 4, h - 2);
          ctx.fillRect(x + w - 5, y + 1, 4, h - 2);
          ctx.fillRect(x + 1, y + h - 4, w - 2, 3);
        };

        const rwY = hy + 0.92 * S;
        const rwH = deckY - rwY + 3;
        drawWall(wingX - (mirror ? 0 : 2), rwY, wingW + 2, rwH, true, true);

        const lwY = hy + 1.32 * S;
        const lwH = deckY - lwY + 8;
        drawWall(gableX, lwY, gableW, lwH, false, true);

        // Window Helper (Warm Glowing Amber Panes, Dark Outlines & Lush Flower Boxes)
        const drawWin = (wx, wy, ww, wh, flowerBox = false) => {
          const x = Math.round(wx), y = Math.round(wy), w = Math.round(ww), h = Math.round(wh);
          ctx.fillStyle = '#20140e';
          ctx.fillRect(x - 3, y - 3, w + 6, 4);
          ctx.fillRect(x - 2, y, w + 4, h + 3);
          ctx.fillStyle = trimCol;
          ctx.fillRect(x - 2, y - 2, w + 4, 2);
          ctx.fillRect(x - 1, y, w + 2, h + 1);

          // Inner window recess
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = glowWindows ? '#f59e0b' : '#334155';
          ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
          if (glowWindows) {
            ctx.fillStyle = '#ffcf54';
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
            ctx.fillStyle = '#fff3b0';
            ctx.fillRect(x + 2, y + 2, w - 4, Math.floor((h - 4) * 0.48));
          } else {
            ctx.fillStyle = '#607894';
            ctx.fillRect(x + 2, y + 2, 3, h - 5);
          }

          // Window mullions
          ctx.fillStyle = '#20140e';
          ctx.fillRect(Math.round(x + w / 2 - 1), y, 2, h);
          ctx.fillRect(x, Math.round(y + h * 0.44), w, 2);
          ctx.fillStyle = trimCol;
          ctx.fillRect(Math.round(x + w / 2), y + 1, 1, h - 2);

          if (flowerBox) {
            ctx.fillStyle = '#20140e';
            ctx.fillRect(x - 4, y + h, w + 8, 7);
            ctx.fillStyle = '#7c4d26';
            ctx.fillRect(x - 3, y + h + 1, w + 6, 5);
            ctx.fillStyle = '#a46c3a';
            ctx.fillRect(x - 3, y + h + 1, w + 6, 2);
            for (let f = 0; f < 3; f++) {
              const fx = Math.round(x + 1 + f * ((w - 2) / 2));
              const fy = y + h;
              ctx.fillStyle = '#1c4814';
              ctx.fillRect(fx - 3, fy - 3, 6, 4);
              ctx.fillStyle = '#388624';
              ctx.fillRect(fx - 2, fy - 2, 4, 3);
              ctx.fillStyle = f === 0 ? '#f43f5e' : (f === 1 ? '#fde047' : '#60a5fa');
              ctx.fillRect(fx - 1, fy - 4, 2, 2);
            }
          }
        };

        const drawSconce = (sx, sy) => {
          const x = Math.round(sx), y = Math.round(sy);
          ctx.fillStyle = '#241812';
          ctx.fillRect(x - 2, y - 1, 4, 7);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(x - 1, y + 1, 2, 3);
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
        const doorW = 24;
        const doorH = 34;
        const doorX = Math.round(gableX + gableW / 2 - doorW / 2);
        const doorY = Math.round(lwY + 8);

        ctx.fillStyle = '#20140e';
        ctx.fillRect(doorX - 4, doorY - 5, doorW + 8, doorH + 5);
        ctx.fillStyle = trimCol;
        ctx.fillRect(doorX - 3, doorY - 4, doorW + 6, doorH + 4);
        ctx.fillStyle = '#20140e';
        ctx.fillRect(doorX - 1, doorY - 1, doorW + 2, doorH + 1);
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(doorX, doorY, doorW, doorH);
        // Door recessed panels + warm upper glass pane
        ctx.fillStyle = '#334155';
        ctx.fillRect(doorX + 3, doorY + 14, doorW - 6, 16);
        ctx.fillStyle = glowWindows ? '#fbbf24' : '#64748b';
        ctx.fillRect(doorX + 5, doorY + 4, doorW - 10, 7);
        ctx.fillStyle = '#e2c078';
        ctx.fillRect(doorX + doorW - 5, doorY + 18, 2, 3);

        // Welcome mat
        ctx.fillStyle = '#20140e';
        ctx.fillRect(doorX - 5, doorY + doorH + 1, doorW + 10, 9);
        ctx.fillStyle = doorMatCol;
        ctx.fillRect(doorX - 4, doorY + doorH + 2, doorW + 8, 7);

        // Patio Furniture
        const tbW = 36, tbH = 18;
        const tbX = Math.round(wingX + wingW / 2 - tbW / 2);
        const tbY = Math.round(deckY + 9);

        const drawMiniChair = (cx, cy) => {
          ctx.fillStyle = '#20140e';
          ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 12, 11);
          ctx.fillStyle = '#cfc5b0';
          ctx.fillRect(Math.round(cx), Math.round(cy), 10, 9);
        };
        drawMiniChair(tbX + 4, tbY - 6);
        drawMiniChair(tbX + tbW - 14, tbY - 6);

        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(tbX + 2, tbY + 3, tbW, tbH);
        ctx.fillStyle = '#20140e';
        ctx.fillRect(tbX - 1, tbY - 1, tbW + 2, tbH + 2);
        ctx.fillStyle = '#dfd6c3';
        ctx.fillRect(tbX, tbY, tbW, tbH);

        drawMiniChair(tbX + 4, tbY + tbH - 2);
        drawMiniChair(tbX + tbW - 14, tbY + tbH - 2);

        // Varied Staggered Pixel Roof Shingles Helper
        const drawShingles = (rx, ry, rw, rh) => {
          const x = Math.round(rx), y = Math.round(ry), w = Math.round(rw), h = Math.round(rh);
          ctx.fillStyle = '#181410';
          ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
          ctx.fillStyle = roofMid;
          ctx.fillRect(x, y, w, h);

          const tileH = 6;
          const tileW = 10;
          const shades = [roofDark, roofMid, roofLight, roofMid, roofDark];
          for (let row = 0, sy = y; sy < y + h - 2; sy += tileH, row++) {
            const offset = (row % 2) * 5;
            const rowH = Math.min(tileH - 1, y + h - sy);
            for (let col = -1, sx = x - offset; sx < x + w; sx += tileW, col++) {
              const drawX = Math.max(x, sx);
              const drawW = Math.min(sx + tileW - 1, x + w) - drawX;
              if (drawW <= 0) continue;
              const toneIdx = Math.abs(row * 7 + col * 13) % shades.length;
              ctx.fillStyle = shades[toneIdx];
              ctx.fillRect(drawX, sy, drawW, rowH);
              // Top course ridge highlight near roof peak
              if (row === 0) {
                ctx.fillStyle = roofLight;
                ctx.fillRect(drawX, sy, drawW, 2);
              }
            }
            // Horizontal dark shingle course shadow
            if (sy + tileH - 1 < y + h) {
              ctx.fillStyle = '#1a1612';
              ctx.fillRect(x, sy + tileH - 1, w, 1);
            }
          }
          // Vertical shingle mortar dividers
          ctx.fillStyle = 'rgba(18, 14, 12, 0.55)';
          for (let row = 0, sy = y; sy < y + h - 2; sy += tileH, row++) {
            const offset = (row % 2) * 5;
            for (let sx = x + tileW - offset; sx < x + w; sx += tileW) {
              ctx.fillRect(sx - 1, sy, 1, Math.min(tileH - 1, y + h - sy));
            }
          }
        };

        const drawEaveTrim = (sx, sy, sw) => {
          const x = Math.round(sx), y = Math.round(sy), w = Math.round(sw);
          ctx.fillStyle = '#1c1410';
          ctx.fillRect(x - 1, y - 1, w + 2, 5);
          ctx.fillStyle = trimCol;
          ctx.fillRect(x, y, w, 3);
        };

        const wingRoofX = mirror ? (wingX - 5) : (wingX - 6);
        drawShingles(wingRoofX, hy, wingW + 11, rwY - hy + 2);
        drawEaveTrim(wingRoofX, rwY + 1, wingW + 11);

        const porchRoofY = hy + 0.86 * S;
        drawShingles(gableX + 2, porchRoofY, gableW - 4, lwY - porchRoofY + 4);
        drawEaveTrim(gableX + 2, lwY + 1, gableW - 4);

        // Front Gable Attic Triangle & Warm Glowing Attic Window
        const peakX = Math.round(gableX + gableW / 2);
        const peakY = Math.round(hy - 2);
        const baseY = Math.round(porchRoofY + 11);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(peakX, peakY + 11);
        ctx.lineTo(gableX + gableW + 4, baseY);
        ctx.lineTo(gableX - 4, baseY);
        ctx.closePath();
        ctx.clip();

        drawWall(gableX + 3, peakY + 7, gableW - 6, baseY - peakY, false, false);
        drawWin(peakX - 11, peakY + 23, 22, 16, false);
        ctx.restore();

        // Clipped Shingled Overhanging Gable Roof Slopes
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(gableX - 8, hy);
        ctx.lineTo(peakX, hy);
        ctx.lineTo(peakX, peakY + 11);
        ctx.lineTo(gableX - 8, baseY + 11);
        ctx.closePath();
        ctx.moveTo(peakX, hy);
        ctx.lineTo(gableX + gableW + 8, hy);
        ctx.lineTo(gableX + gableW + 8, baseY + 11);
        ctx.lineTo(peakX, peakY + 11);
        ctx.closePath();
        ctx.clip();
        drawShingles(gableX - 8, hy, gableW + 16, baseY + 12 - hy);
        ctx.restore();

        // Dark outline + Cream Bargeboard Trim on Gable Roof
        ctx.strokeStyle = '#181410';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(gableX - 8, baseY + 11);
        ctx.lineTo(peakX, peakY + 10);
        ctx.lineTo(gableX + gableW + 8, baseY + 11);
        ctx.stroke();

        ctx.strokeStyle = trimCol;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(gableX - 7, baseY + 10);
        ctx.lineTo(peakX, peakY + 10);
        ctx.lineTo(gableX + gableW + 7, baseY + 10);
        ctx.stroke();

        // Front Porch Baluster Railings (with dark under-rail shadow)
        const railDrawY = Math.round(railY - 5);
        const stairL = Math.round(doorX - 7);
        const stairR = Math.round(doorX + doorW + 7);
        const drawRailingSegment = (rx1, rx2) => {
          if (rx2 - rx1 < 8) return;
          ctx.fillStyle = '#20140c';
          ctx.fillRect(rx1, railDrawY, rx2 - rx1, 3);
          ctx.fillStyle = '#9c6638';
          ctx.fillRect(rx1 + 1, railDrawY + 1, rx2 - rx1 - 2, 2);
          for (let bx = rx1 + 4; bx < rx2 - 3; bx += 6) {
            ctx.fillStyle = '#20140c';
            ctx.fillRect(bx - 1, railDrawY + 3, 4, 8);
            ctx.fillStyle = '#784c28';
            ctx.fillRect(bx, railDrawY + 3, 2, 7);
          }
          ctx.fillStyle = '#20140c';
          ctx.fillRect(rx1 - 1, railDrawY - 2, 5, 13);
          ctx.fillRect(rx2 - 4, railDrawY - 2, 5, 13);
          ctx.fillStyle = '#b07846';
          ctx.fillRect(rx1, railDrawY - 1, 3, 11);
          ctx.fillRect(rx2 - 3, railDrawY - 1, 3, 11);
        };
        drawRailingSegment(Math.round(hx) + 2, stairL - 1);
        drawRailingSegment(stairR + 1, Math.round(hx + hw) - 2);

        // Wide Wooden Porch Stairs
        const stW = stairR - stairL;
        const stY = Math.round(brickY - 7);
        const stH = 22;

        ctx.fillStyle = '#20140c';
        ctx.fillRect(stairL - 2, stY - 1, stW + 4, stH + 2);
        ctx.fillStyle = '#5c3c22';
        ctx.fillRect(stairL, stY, stW, stH);
        for (let s = 0; s < 3; s++) {
          const stepY = stY + 4 + s * 6;
          ctx.fillStyle = '#20140c';
          ctx.fillRect(stairL + 2, stepY - 1, stW - 4, 6);
          ctx.fillStyle = s % 2 === 0 ? '#926036' : '#7a4f2c';
          ctx.fillRect(stairL + 3, stepY, stW - 6, 4);
        }
      };

      // 4A. PLAYER'S COTTAGE (North-West Plot — Warm Golden-Cedar Roof & Cream Siding)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 0.45 * S,
        hw: 3.2 * S,
        spriteKey: 'cottage_player',
        mirror: false,
        roofDark: '#6e421e',
        roofMid: '#985c2c',
        roofLight: '#b8763e',
        sidingCol: '#d6c298',
        sidingLineCol: '#b0986c',
        trimCol: '#efe4cc',
        doorMatCol: '#388e26',
        hasChimney: true,
        glowWindows: true
      });

      // 4B. FRIEND'S (MIKE/AJ) COTTAGE (North-Central Plot — Slate Blue-Grey Roof)
      drawNeighborhoodCottage({
        hx: 7.7 * S,
        hy: 0.45 * S,
        hw: 3.2 * S,
        spriteKey: 'cottage_friend',
        mirror: true,
        roofDark: '#2a3848',
        roofMid: '#44586e',
        roofLight: '#5c7490',
        sidingCol: '#cdd6c8',
        sidingLineCol: '#9aa894',
        trimCol: '#f2eee4',
        doorMatCol: '#b45309',
        hasChimney: true,
        glowWindows: true
      });

      // 4C. PLUTO'S COTTAGE (Middle-West Plot — Plum-Violet Roof & Cream-Lavender Siding)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 5.95 * S,
        hw: 3.2 * S,
        spriteKey: 'cottage_pluto',
        mirror: false,
        roofDark: '#36264a',
        roofMid: '#563e72',
        roofLight: '#725690',
        sidingCol: '#dad4e4',
        sidingLineCol: '#a89eb8',
        trimCol: '#f8f5fc',
        doorMatCol: '#7c3aed',
        hasChimney: true,
        glowWindows: true
      });

      // 4D. MIDDLE BLOCK TOWN GREEN / PARK PLAZA & 2-TIERED PIXEL FOUNTAIN
      const drawMiddleTownBlock = () => {
        const bx = Math.round(6.95 * S);
        const by = Math.round(6.05 * S);
        const bw = Math.round(2.75 * S);
        const bh = Math.round(2.95 * S);
        const cx = Math.round(bx + bw / 2);
        const cy = Math.round(by + bh / 2) - 4;

        if (this.isImgReady('fountain')) {
          ctx.fillStyle = this.grassPattern || '#54aa36';
          ctx.fillRect(bx, by, bw, bh);
          drawStoneCurbH(bx, by - 4, bw, 'top');
          drawStoneCurbH(bx, by + bh - 6, bw, 'bot');
          drawStoneCurbV(bx - 5, by, bh, 'left');
          drawStoneCurbV(bx + bw - 3, by, bh, 'right');

          const fImg = this.owSprites.fountain;
          const fh = 96;
          const fw = Math.round(fh * (fImg.width / fImg.height));
          ctx.drawImage(fImg, Math.round(cx - fw / 2), Math.round(cy - fh / 2 - 4), fw, fh);

          // Live cascading turquoise water shimmer & splashing sparks on fountain bowls
          const animT = this.tick || 0;
          const ripple = (animT * 0.14) % 8;
          ctx.strokeStyle = 'rgba(205, 248, 255, 0.58)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 16, 16 + ripple * 1.4, 8 + ripple * 0.65, 0, 0, Math.PI * 2);
          ctx.stroke();
          const dropY = (animT * 0.25) % 4;
          ctx.fillStyle = '#e0f8ff';
          ctx.fillRect(cx - 2, cy - 42 - dropY, 4, 4);
          ctx.fillRect(cx - 10, cy - 12 + dropY, 2, 4);
          ctx.fillRect(cx + 8, cy - 12 + dropY, 2, 4);

          if (this.isImgReady('bench_left') && this.isImgReady('bench_right') && this.isImgReady('bench_front')) {
            ctx.drawImage(this.owSprites.bench_left, bx + 6, cy - 16, 20, 42);
            ctx.drawImage(this.owSprites.bench_right, bx + bw - 26, cy - 16, 20, 42);
            ctx.drawImage(this.owSprites.bench_front, cx - 24, by + bh - 34, 48, 24);
          }
          if (this.isImgReady('tree_green')) {
            const tg = this.owSprites.tree_green;
            queueExtSprite(tg, bx - 6, by - 30, 70, 78, by - 30 + 78 * 0.96);
            queueExtSprite(tg, bx + bw - 74, by - 34, 78, 86, by - 34 + 86 * 0.96);
          }
          if (this.isImgReady('bush_flower') && this.isImgReady('bush_round')) {
            queueExtSprite(this.owSprites.bush_flower, bx + 4, by + bh - 38, 38, 30, by + bh - 38 + 30 * 0.95);
            queueExtSprite(this.owSprites.bush_round, bx + bw - 42, by + bh - 38, 38, 30, by + bh - 38 + 30 * 0.95);
          }
          return;
        }

        // Organic Turf-Lip Grass Island (pre-load fallback)
        ctx.fillStyle = '#244616';
        ctx.beginPath();
        ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 14);
        ctx.fill();

        ctx.fillStyle = '#3c7622';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 12);
        ctx.fill();

        ctx.fillStyle = this.grassPattern || '#54aa36';
        ctx.beginPath();
        ctx.roundRect(bx + 3, by + 3, bw - 6, bh - 6, 10);
        ctx.fill();

        // Organic top & bottom turf overhangs matching the surrounding grass beds
        for (let tx = bx + 10; tx < bx + bw - 10; tx += 14) {
          const wob = ((tx * 7) % 5) - 2;
          ctx.fillStyle = '#244616';
          ctx.fillRect(tx - 1, by - 4 + wob, 12, 5);
          ctx.fillRect(tx - 1, by + bh - 1 + wob, 12, 5);
          ctx.fillStyle = '#4c9c2c';
          ctx.fillRect(tx, by - 2 + wob, 10, 4);
          ctx.fillRect(tx, by + bh - 3 + wob, 10, 4);
        }

        // Subtle flower/clover accents on the park lawn
        const patchDots = [
          [bx + 26, by + 64, '#fef08a'],
          [bx + bw - 28, by + 60, '#ffffff'],
          [bx + 36, by + bh - 38, '#fef08a'],
          [bx + bw - 42, by + bh - 36, '#fca5a5'],
        ];
        patchDots.forEach(([fx, fy, col]) => {
          ctx.fillStyle = '#2e621c';
          ctx.fillRect(fx - 3, fy - 1, 6, 3);
          ctx.fillStyle = col;
          ctx.fillRect(fx - 1, fy - 2, 2, 2);
        });

        // Ground shadow under 2-Tiered Carved Stone Fountain
        ctx.fillStyle = 'rgba(18, 36, 12, 0.34)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 40, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lower Outer Stone Rim (3/4 perspective oval)
        ctx.fillStyle = '#1c222a';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 38, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#68707c';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, 36, 23, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9aa4b2';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 36, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c8d0dc';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 34, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sparkling Turquoise Lower Pool Water
        ctx.fillStyle = '#1468a0';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 29, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ca4dc';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 26, 13.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animated pool ripples
        const animTick = this.tick || 0;
        const rippleR = ((animTick * 0.14) % 9);
        ctx.strokeStyle = 'rgba(186, 244, 255, 0.72)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 13 + rippleR * 1.4, 7 + rippleR * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Carved Stone Pedestal Column
        ctx.fillStyle = '#1c222a';
        ctx.fillRect(cx - 8, cy - 12, 16, 20);
        ctx.fillStyle = '#707886';
        ctx.fillRect(cx - 6, cy - 11, 12, 18);
        ctx.fillStyle = '#aeb6c4';
        ctx.fillRect(cx - 4, cy - 11, 5, 18);

        // Upper Carved Stone Bowl
        ctx.fillStyle = '#1c222a';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 13, 21, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#747c8a';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 12, 19, 10.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c8d0dc';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 15, 19, 9.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Turquoise Water in Upper Bowl
        ctx.fillStyle = '#2090cc';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 15, 15, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#68d8ff';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 15.5, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center Top Spout & Plume Spray
        ctx.fillStyle = '#1c222a';
        ctx.fillRect(cx - 4, cy - 26, 8, 12);
        ctx.fillStyle = '#b4bcc8';
        ctx.fillRect(cx - 3, cy - 25, 6, 10);

        const sprayShift = Math.floor((animTick * 0.18) % 3);
        // Falling curtains of blue-white water curving gently from upper bowl into lower pool
        const streamOffsets = [-12, -5, 5, 12];
        streamOffsets.forEach((ox, idx) => {
          const jitter = ((sprayShift + idx) % 2);
          const archShift = ox < 0 ? -1 : 1;
          ctx.fillStyle = '#40b8f0';
          ctx.fillRect(cx + ox - 2, cy - 11 + jitter, 3, 6);
          ctx.fillRect(cx + ox + archShift - 2, cy - 5 + jitter, 3, 10);
          ctx.fillStyle = '#d4f6ff';
          ctx.fillRect(cx + ox - 1, cy - 10 + jitter, 2, 5);
          ctx.fillRect(cx + ox + archShift - 1, cy - 4 + jitter, 2, 8);
          // Splash foam at waterline
          ctx.fillStyle = '#e0f8ff';
          ctx.fillRect(cx + ox + archShift - 3, cy + 4 + jitter, 5, 3);
        });

        // Symmetrical Top Fountain Spray Plume Arches
        ctx.fillStyle = '#60d0ff';
        ctx.fillRect(cx - 2, cy - 35 - sprayShift, 4, 11);
        ctx.fillRect(cx - 6, cy - 34 + sprayShift, 4, 3);
        ctx.fillRect(cx + 2, cy - 34 + sprayShift, 4, 3);
        ctx.fillRect(cx - 8, cy - 31 + sprayShift, 3, 6);
        ctx.fillRect(cx + 5, cy - 31 + sprayShift, 3, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 1, cy - 37 - sprayShift, 2, 5);
        ctx.fillRect(cx - 5, cy - 34 + sprayShift, 2, 2);
        ctx.fillRect(cx + 3, cy - 34 + sprayShift, 2, 2);

        // Detailed Slatted Wooden Park Benches (Left side-view, Right side-view, Bottom front-view)
        const drawParkBenchSide = (px, py, faceRight = true) => {
          const x = Math.round(px), y = Math.round(py);
          // Ground shadow
          ctx.fillStyle = 'rgba(18, 36, 12, 0.30)';
          ctx.fillRect(x, y + 3, 14, 28);
          // Dark outline
          ctx.fillStyle = '#20140c';
          ctx.fillRect(x - 1, y - 1, 14, 30);
          // Backrest plank on outer side
          const backX = faceRight ? x : (x + 8);
          const seatX = faceRight ? (x + 4) : x;
          ctx.fillStyle = '#683e1e';
          ctx.fillRect(backX, y, 4, 28);
          ctx.fillStyle = '#9c6434';
          ctx.fillRect(seatX, y + 1, 8, 26);
          // Seat plank highlight slats
          ctx.fillStyle = '#b47842';
          ctx.fillRect(seatX + 1, y + 3, 6, 22);
          // Armrest caps (top & bottom)
          ctx.fillStyle = '#20140c';
          ctx.fillRect(x - 1, y - 1, 14, 4);
          ctx.fillRect(x - 1, y + 25, 14, 4);
          ctx.fillStyle = '#b87e4a';
          ctx.fillRect(x, y, 12, 2);
          ctx.fillRect(x, y + 26, 12, 2);
        };
        drawParkBenchSide(bx + 12, cy - 11, true);
        drawParkBenchSide(bx + bw - 24, cy - 11, false);

        const drawParkBenchFront = (px, py) => {
          const x = Math.round(px), y = Math.round(py);
          ctx.fillStyle = 'rgba(18, 36, 12, 0.30)';
          ctx.fillRect(x + 1, y + 11, 38, 6);
          // Dark silhouette
          ctx.fillStyle = '#20140c';
          ctx.fillRect(x - 1, y - 5, 40, 19);
          // Legs
          ctx.fillStyle = '#523018';
          ctx.fillRect(x + 2, y + 9, 4, 5);
          ctx.fillRect(x + 32, y + 9, 4, 5);
          // Seat & twin slatted backrest boards
          ctx.fillStyle = '#784824';
          ctx.fillRect(x + 1, y - 4, 36, 3);
          ctx.fillRect(x + 1, y, 36, 3);
          ctx.fillStyle = '#a46a38';
          ctx.fillRect(x, y + 4, 38, 5);
          ctx.fillStyle = '#c0844c';
          ctx.fillRect(x + 1, y + 4, 36, 2);
          // Side arm posts
          ctx.fillStyle = '#4e2e16';
          ctx.fillRect(x + 1, y - 4, 3, 13);
          ctx.fillRect(x + 34, y - 4, 3, 13);
        };
        drawParkBenchFront(cx - 19, by + bh - 24);

        // Asymmetric Lush Pixel Trees at upper corners + Leafy Corner Bushes at lower corners
        if (this.treeGreenStamp) {
          queueExtSprite(this.treeGreenStamp, bx + 2, by - 18, 56, 66, by - 18 + 66 * 0.96);
          queueExtSprite(this.treeGreenStamp, bx + bw - 68, by - 22, 66, 76, by - 22 + 76 * 0.96);
        }
        if (this.bushStamp) {
          queueExtSprite(this.bushStamp, bx + 4, by + bh - 34, 34, 26, by + bh - 34 + 26 * 0.95);
          queueExtSprite(this.bushStamp, bx + bw - 40, by + bh - 34, 34, 26, by + bh - 34 + 26 * 0.95);
        }
      };
      drawMiddleTownBlock();

      // 5. LEO'S CARD SHOP (Middle-East Plot — Timber Roof, Hanging Banner & Glowing Display Windows)
      const drawMythosCardShop = () => {
        const sx = Math.round(11.8 * S);
        const sy = Math.round(5.95 * S);
        const sw = Math.round(3.55 * S);
        const sh = Math.round(3.30 * S);
        const roofH = Math.round(1.24 * S);
        const wallY = sy + roofH;
        const wallH = sh - roofH - 16;
        const deckY = sy + sh - 16;
        const nearShop = this.nearInteractable?.id === 'card_shop';

        if (this.isImgReady('card_shop')) {
          const shopImg = this.owSprites.card_shop;
          const dw = Math.round(sw + 18);
          const dh = Math.round(dw * (shopImg.height / shopImg.width));
          const dx = Math.round(sx - 9);
          const dy = Math.round(sy + sh - dh - 4);
          ctx.fillStyle = 'rgba(18, 12, 8, 0.34)';
          ctx.beginPath();
          ctx.ellipse(dx + dw / 2, dy + dh - 6, Math.round(dw * 0.48), 11, 0, 0, Math.PI * 2);
          ctx.fill();
          if (this.isImgReady('shop_banner')) {
            const bImg = this.owSprites.shop_banner;
            const bh = 64;
            const bw = Math.round(bh * (bImg.width / bImg.height));
            ctx.drawImage(bImg, Math.round(dx - bw - 4), Math.round(wallY + 2), bw, bh);
          }
          ctx.drawImage(shopImg, dx, dy, dw, dh);
          if (nearShop) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const glowAlpha = 0.14 + Math.sin((this.tick || 0) * 0.12) * 0.06;
            ctx.fillStyle = `rgba(56, 189, 248, ${glowAlpha})`;
            ctx.fillRect(dx + 16, dy + Math.round(dh * 0.56), Math.round(dw * 0.25), Math.round(dh * 0.30));
            ctx.fillRect(dx + dw - Math.round(dw * 0.36), dy + Math.round(dh * 0.56), Math.round(dw * 0.25), Math.round(dh * 0.30));
            ctx.restore();
          }
          return;
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(18, 12, 8, 0.34)';
        ctx.fillRect(sx - 4, wallY + 8, sw + 10, sh - roofH + 2);

        // Hanging Purple & Gold Card Shop Banner Post on Left
        const bPostX = sx - 24;
        const bPostY = wallY + 8;
        ctx.fillStyle = 'rgba(18, 12, 8, 0.28)';
        ctx.beginPath();
        ctx.ellipse(bPostX + 9, bPostY + 42, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#20140c';
        ctx.fillRect(bPostX + 6, bPostY - 4, 6, 48);
        ctx.fillRect(bPostX - 2, bPostY - 2, 22, 5);
        ctx.fillStyle = '#845430';
        ctx.fillRect(bPostX + 7, bPostY - 3, 4, 46);
        ctx.fillRect(bPostX - 1, bPostY - 1, 20, 3);
        // Purple & gold vertical banner
        ctx.fillStyle = '#1c1228';
        ctx.fillRect(bPostX + 1, bPostY + 3, 16, 26);
        ctx.fillStyle = '#5c3c8c';
        ctx.fillRect(bPostX + 2, bPostY + 4, 14, 23);
        ctx.fillStyle = '#d8a038';
        ctx.fillRect(bPostX + 3, bPostY + 5, 12, 2);
        ctx.fillRect(bPostX + 3, bPostY + 23, 12, 2);
        ctx.fillRect(bPostX + 7, bPostY + 10, 4, 9);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(bPostX + 8, bPostY + 12, 2, 5);

        // Stone foundation & entry platform
        ctx.fillStyle = '#20140e';
        ctx.fillRect(sx - 1, deckY, sw + 2, 17);
        ctx.fillStyle = '#786c60';
        ctx.fillRect(sx + 1, deckY + 2, sw - 2, 13);
        ctx.fillStyle = '#9a8e80';
        ctx.fillRect(sx + 2, deckY + 2, sw - 4, 4);

        // Warm Dark Timber & Plank Facade
        ctx.fillStyle = '#20140e';
        ctx.fillRect(sx - 1, wallY - 1, sw + 2, wallH + 2);
        ctx.fillStyle = '#68422a';
        ctx.fillRect(sx + 1, wallY, sw - 2, wallH);
        ctx.fillStyle = '#7e5236';
        for (let wy = wallY + 4; wy < wallY + wallH - 4; wy += 6) {
          ctx.fillRect(sx + 4, wy, sw - 8, 4);
        }
        // Eave shadow on shop walls
        ctx.fillStyle = 'rgba(18, 10, 6, 0.30)';
        ctx.fillRect(sx + 1, wallY, sw - 2, 7);

        // Vertical timber corner & divider beams
        [sx, sx + 1.18 * S, sx + 2.36 * S, sx + sw - 8].forEach(px => {
          const x = Math.round(px);
          ctx.fillStyle = '#20140e';
          ctx.fillRect(x, wallY, 8, wallH);
          ctx.fillStyle = '#4c2e1c';
          ctx.fillRect(x + 2, wallY + 2, 4, wallH - 4);
        });

        // Two Glowing Blue-Violet & Magenta Shop Display Windows (cards & diagonal glass gleams!)
        const drawDisplayWindow = (wx, wy, ww, wh) => {
          const x = Math.round(wx), y = Math.round(wy), w = Math.round(ww), h = Math.round(wh);
          ctx.fillStyle = '#18100c';
          ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
          ctx.fillStyle = '#b8844c';
          ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
          // Deep blue-indigo interior glass glow
          ctx.fillStyle = nearShop ? '#243c88' : '#182458';
          ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
          ctx.fillStyle = '#2e52a8';
          ctx.fillRect(x + 2, y + 2, w - 4, Math.floor(h * 0.55));
          // Glowing cyan & magenta pixel card displays inside glass
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x + 5, y + 6, 12, 16);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(x + 7, y + 8, 8, 9);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(x + 20, y + 8, 12, 16);
          ctx.fillStyle = '#f9a8d4';
          ctx.fillRect(x + 22, y + 10, 8, 9);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(x + 35, y + 7, 11, 15);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 37, y + 9, 7, 8);
          // Diagonal crisp pixel glass reflection streaks & sparkles
          ctx.fillStyle = 'rgba(200, 240, 255, 0.55)';
          ctx.fillRect(x + 6, y + 4, 8, 2);
          ctx.fillRect(x + 4, y + 6, 4, 2);
          ctx.fillRect(x + w - 16, y + 5, 6, 2);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(x + 16, y + 4, 2, 2);
          ctx.fillRect(x + w - 10, y + 10, 2, 2);
        };
        drawDisplayWindow(sx + 16, wallY + 13, 52, 34);
        drawDisplayWindow(sx + sw - 68, wallY + 13, 52, 34);

        // Double Timber & Glowing Glass Shop Doors
        const doorW = 40;
        const doorH = 44;
        const doorX = Math.round(13.58 * S - doorW / 2);
        const doorY = deckY - doorH + 2;

        ctx.fillStyle = '#1c120c';
        ctx.fillRect(doorX - 4, doorY - 4, doorW + 8, doorH + 4);
        ctx.fillStyle = '#c89650';
        ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
        ctx.fillStyle = '#382012';
        ctx.fillRect(doorX, doorY, doorW, doorH);

        ctx.fillStyle = nearShop ? '#7dd3fc' : '#3870c0';
        ctx.fillRect(doorX + 4, doorY + 4, 14, 24);
        ctx.fillRect(doorX + 22, doorY + 4, 14, 24);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(doorX + 6, doorY + 6, 4, 10);
        ctx.fillRect(doorX + 24, doorY + 6, 4, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(doorX + 16, doorY + 30, 2, 6);
        ctx.fillRect(doorX + 22, doorY + 30, 2, 6);

        // Stone front step
        ctx.fillStyle = '#20140e';
        ctx.fillRect(doorX - 8, deckY + 10, doorW + 16, 12);
        ctx.fillStyle = '#b4a490';
        ctx.fillRect(doorX - 6, deckY + 12, doorW + 12, 8);

        // Stepped Slate-Brown Timber Roof + Fascia Cornice
        ctx.fillStyle = '#181414';
        ctx.fillRect(sx - 7, sy - 1, sw + 14, roofH + 5);
        ctx.fillStyle = '#3c3234';
        ctx.fillRect(sx - 5, sy + 1, sw + 10, roofH - 8);
        ctx.fillStyle = '#56484c';
        for (let ry = sy + 6; ry < sy + roofH - 12; ry += 7) {
          ctx.fillRect(sx - 4, ry, sw + 8, 4);
        }
        // Horizontal wooden fascia beam supporting sign
        ctx.fillStyle = '#20140c';
        ctx.fillRect(sx - 7, wallY - 12, sw + 14, 13);
        ctx.fillStyle = '#9c6838';
        ctx.fillRect(sx - 5, wallY - 10, sw + 10, 9);
        ctx.fillStyle = '#be864e';
        ctx.fillRect(sx - 5, wallY - 10, sw + 10, 3);

        // Gold-Trimmed "LEO'S CARD SHOP" Signboard
        const signW = 198;
        const signH = 34;
        const signX = Math.round(sx + sw / 2 - signW / 2);
        const signY = wallY - 36;

        ctx.fillStyle = '#181214';
        ctx.fillRect(signX - 2, signY - 2, signW + 4, signH + 4);
        ctx.fillStyle = nearShop ? '#38bdf8' : '#d8a038';
        ctx.fillRect(signX, signY, signW, signH);
        ctx.fillStyle = '#1e161a';
        ctx.fillRect(signX + 3, signY + 3, signW - 6, signH - 6);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px Cinzel, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText("LEO'S CARD SHOP", signX + signW / 2, signY + 16);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 7.5px Inter, sans-serif';
        ctx.fillText('MYTHOS BOOSTER PACKS • DECKS', signX + signW / 2, signY + 26.5);
      };
      drawMythosCardShop();

      // =======================================================================
      // 4E, 4F, 4G: THE 3 NEW SOUTH BLOCK HOUSES
      // =======================================================================
      // NOVA'S COTTAGE (South-West Plot — Slate-Blue Shingles & Warm Cream-Stone Siding)
      drawNeighborhoodCottage({
        hx: 1.1 * S,
        hy: 11.20 * S,
        hw: 3.2 * S,
        spriteKey: 'cottage_nova',
        mirror: false,
        roofDark: '#263448',
        roofMid: '#3a4e68',
        roofLight: '#506884',
        sidingCol: '#cdd0d4',
        sidingLineCol: '#9ea4ac',
        trimCol: '#f4f0e8',
        doorMatCol: '#7c3aed',
        hasChimney: false,
        glowWindows: true
      });

      // SILAS'S COTTAGE (South-Center Plot — Lush Forest-Green Shingles & Warm Wheat Siding)
      drawNeighborhoodCottage({
        hx: 6.85 * S,
        hy: 11.20 * S,
        hw: 3.0 * S,
        spriteKey: 'cottage_silas',
        mirror: true,
        roofDark: '#1c4c24',
        roofMid: '#2a6e34',
        roofLight: '#3c8e46',
        sidingCol: '#d8be8a',
        sidingLineCol: '#b49864',
        trimCol: '#f6eedc',
        doorMatCol: '#9a3412',
        hasChimney: true,
        glowWindows: true
      });

      // MAYA'S COTTAGE (South-East Plot — Terracotta/Plum Shingles & Soft Warm Sage-Cream Siding)
      drawNeighborhoodCottage({
        hx: 11.8 * S,
        hy: 11.20 * S,
        hw: 3.2 * S,
        spriteKey: 'cottage_maya',
        mirror: false,
        roofDark: '#642428',
        roofMid: '#8c3438',
        roofLight: '#ac4a4c',
        sidingCol: '#d4dac6',
        sidingLineCol: '#a6b096',
        trimCol: '#f5efe0',
        doorMatCol: '#2e7d32',
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

        ctx.font = 'bold 9.5px "Georgia", serif';
        const cleanLabel = labelText.replace(/^📬\s*/, '');
        const plateW = Math.max(76, ctx.measureText(cleanLabel).width + 24);
        const plateX = mx - plateW / 2;
        const plateY = my - 49;

        ctx.fillStyle = 'rgba(20, 12, 6, 0.36)';
        ctx.beginPath();
        ctx.roundRect(plateX, plateY + 1.5, plateW, 15, 4);
        ctx.fill();

        ctx.fillStyle = isHighlighted ? '#fef08a' : '#f6ebd4';
        ctx.beginPath();
        ctx.roundRect(plateX, plateY, plateW, 15, 4);
        ctx.fill();
        ctx.fillStyle = isHighlighted ? '#fef9c3' : '#fffaf0';
        ctx.fillRect(plateX + 3, plateY + 1, plateW - 6, 2);
        ctx.strokeStyle = isHighlighted ? '#b45309' : '#3a2416';
        ctx.lineWidth = isHighlighted ? 1.8 : 1.4;
        ctx.beginPath();
        ctx.roundRect(plateX, plateY, plateW, 15, 4);
        ctx.stroke();

        // House color crest pip on left of parchment plaque (like picture!)
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.arc(plateX + 7, plateY + 7.5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#26170c';
        ctx.textAlign = 'center';
        ctx.fillText(cleanLabel, mx + 4, plateY + 11);
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

      // 7. DIRECTIONAL SIGNPOSTS (Sprites/Overworld/signpost.png)
      const drawSignpost = (sgX, sgY) => {
        if (this.isImgReady('signpost')) {
          const img = this.owSprites.signpost;
          const sh = 34;
          const sw = Math.round(sh * (img.width / img.height));
          ctx.fillStyle = 'rgba(18, 12, 8, 0.28)';
          ctx.beginPath(); ctx.ellipse(sgX, sgY + 2, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.drawImage(img, Math.round(sgX - sw / 2), Math.round(sgY - sh + 4), sw, sh);
          return;
        }
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
        { x: 3.95 * S, y: 8.55 * S, c: '#a855f7' },
        { x: 11.4 * S, y: 6.8 * S, c: '#f43f5e' },
        { x: 11.4 * S, y: 8.7 * S, c: '#eab308' },
        { x: 5.0 * S, y: 11.8 * S, c: '#38bdf8' },
        { x: 5.0 * S, y: 13.8 * S, c: '#a855f7' },
        { x: 10.2 * S, y: 11.8 * S, c: '#eab308' },
        { x: 10.2 * S, y: 13.8 * S, c: '#f43f5e' },
        { x: 15.2 * S, y: 12.2 * S, c: '#38bdf8' }
      ];
      flowerSpots.forEach(fl => {
        const fx = Math.round(fl.x), fy = Math.round(fl.y);
        ctx.fillStyle = '#24581b';
        ctx.fillRect(fx - 4, fy - 2, 8, 6);
        ctx.fillStyle = '#4ea034';
        ctx.fillRect(fx - 3, fy - 3, 6, 4);
        ctx.fillStyle = fl.c;
        ctx.fillRect(fx - 3, fy - 4, 2, 2);
        ctx.fillRect(fx + 1, fy - 3, 2, 2);
        ctx.fillRect(fx - 1, fy - 1, 2, 2);
      });

      // 9. Lush High-Detail Illustrated Trees & Shrubs framing the Full 3-Block Neighborhood
      const drawLushBushCluster = (bx, by, r, isAutumn = false) => {
        const x = Math.round(bx), y = Math.round(by);
        const isTree = r >= 20;
        const tKey = isTree
          ? (isAutumn ? (r <= 21 ? 'tree_autumn_small' : 'tree_autumn') : 'tree_green')
          : (((Math.round(bx + by)) % 2 === 0) ? 'bush_flower' : 'bush_round');
        const fallbackStamp = isTree ? (isAutumn ? this.treeAutumnStamp : this.treeGreenStamp) : this.bushStamp;

        if (this.isImgReady(tKey)) {
          const img = this.owSprites[tKey];
          const dh = isTree ? Math.round(108 * (r / 23)) : Math.round(r * 1.9);
          const dw = Math.round(dh * (img.width / img.height));
          const dy = Math.round(y - dh * (isTree ? 0.68 : 0.56));
          ctx.fillStyle = isTree ? 'rgba(18, 28, 10, 0.26)' : 'rgba(18, 28, 10, 0.24)';
          ctx.beginPath();
          ctx.ellipse(
            x,
            y + Math.round(dh * (isTree ? 0.24 : 0.28)),
            Math.round(dw * (isTree ? 0.34 : 0.42)),
            Math.round(dh * (isTree ? 0.09 : 0.16)),
            0, 0, Math.PI * 2
          );
          ctx.fill();
          queueExtSprite(img, x - dw / 2, dy, dw, dh, dy + dh * (isTree ? 0.96 : 0.95));
          return;
        }
        if (fallbackStamp) {
          const scale = r / 23;
          const dw = isTree ? Math.round(86 * scale) : Math.round(r * 2.1);
          const dh = isTree ? Math.round(98 * scale) : Math.round(r * 1.54);
          const dy = Math.round(y - dh * (isTree ? 0.68 : 0.56));
          queueExtSprite(fallbackStamp, x - dw / 2, dy, dw, dh, dy + dh * (isTree ? 0.96 : 0.95));
        }
      };

      // Trees & shrubs across Town Blocks + Deep Southern Forest Border (drawn from shared placements)
      for (const [tx, ty, r, isAutumn, zone] of this.getExteriorTreeClusters()) {
        if (zone === 'town') drawLushBushCluster(tx * S, ty * S, r, isAutumn);
      }

      // South Edge Park Bench
      const sBenchX = 7.35 * S - 22;
      const sBenchY = 16.38 * S;
      if (this.isImgReady('bench_front')) {
        ctx.drawImage(this.owSprites.bench_front, Math.round(sBenchX), Math.round(sBenchY - 4), 46, 22);
      } else {
        ctx.fillStyle = '#784f2d';
        ctx.strokeStyle = '#26170c';
        ctx.lineWidth = 1.3;
        ctx.fillRect(sBenchX, sBenchY, 40, 10);
        ctx.strokeRect(sBenchX, sBenchY, 40, 10);
        ctx.fillStyle = '#5c3c22';
        ctx.fillRect(sBenchX, sBenchY - 4, 40, 4);
        ctx.strokeRect(sBenchX, sBenchY - 4, 40, 4);
      }

      // -----------------------------------------------------------------------
      // 10. CENTRAL PARK & COURTYARD OF PICNIC TABLES (East Expansion: x = 16.0..26.0)
      // -----------------------------------------------------------------------
      const parkStartX = 16.0 * S;

      // Subtle manicured meadow lawn across East Park (keeping clear of roads & southern dirt avenue)
      for (let px = parkStartX; px < EXT_W; px += 44) {
        ctx.fillStyle = (Math.floor(px / 44) % 2 === 0) ? 'rgba(60, 148, 42, 0.07)' : 'rgba(42, 108, 28, 0.07)';
        ctx.fillRect(px, 0, 44, road3Y - 4);
      }

      // Warm Flagstone Promenade from Road into Courtyard (seamless stone street with beveled top/bottom turf curbs)
      const promY = road2Y;
      const promH = road2H;
      ctx.fillStyle = this.flagstonePattern || this.cobblePattern || '#988878';
      ctx.fillRect(parkStartX, promY, 2.5 * S, promH);
      drawStoneCurbH(parkStartX, promY - 6, 2.5 * S, 'bot');
      drawStoneCurbH(parkStartX, promY + promH, 2.5 * S, 'top');

      // Courtyard Flagstone & Warm Earth Plaza (x = 18.2*S .. 24.2*S, y = 6.4*S .. 11.8*S)
      const plazaX = Math.round(18.2 * S);
      const plazaY = Math.round(6.4 * S);
      const plazaW = Math.round(6.0 * S);
      const plazaH = Math.round(5.4 * S);

      // Organic dark-outlined turf & stone trim framing Courtyard
      ctx.fillStyle = '#20140c';
      ctx.beginPath();
      ctx.roundRect(plazaX - 6, plazaY - 6, plazaW + 12, plazaH + 12, 16);
      ctx.fill();

      ctx.fillStyle = '#a08c78';
      ctx.beginPath();
      ctx.roundRect(plazaX - 3, plazaY - 3, plazaW + 6, plazaH + 6, 14);
      ctx.fill();

      ctx.fillStyle = this.flagstonePattern || '#9a8c7c';
      ctx.beginPath();
      ctx.roundRect(plazaX, plazaY, plazaW, plazaH, 12);
      ctx.fill();

      // Subtle warm earth center medallion on courtyard
      ctx.fillStyle = 'rgba(130, 96, 62, 0.22)';
      ctx.beginPath();
      ctx.roundRect(plazaX + 24, plazaY + 24, plazaW - 48, plazaH - 48, 10);
      ctx.fill();

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
      drawHedge(plazaX, plazaY - 8, plazaW, 8);
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

      // Park Entrance Terracotta Planters at x = 16.0*S
      const gateTopY = road2Y - 16;
      const gateBotY = road2Y + road2H + 16;
      const drawGatePlanter = (gx, gy) => {
        const x = Math.round(gx), y = Math.round(gy);
        if (this.isImgReady('pot_large')) {
          ctx.drawImage(this.owSprites.pot_large, x - 4, y - 4, 30, 34);
        }
      };
      drawGatePlanter(parkStartX - 10, gateTopY - 26);
      drawGatePlanter(parkStartX - 10, gateBotY + 2);

      // Welcome Signpost near gate
      const signX = 16.6 * S;
      const signY = 9.25 * S;
      ctx.fillStyle = '#20140c';
      ctx.fillRect(signX - 3, signY - 14, 6, 20);
      ctx.fillStyle = '#5c3c22';
      ctx.fillRect(signX - 2, signY - 14, 4, 19);
      ctx.fillStyle = '#20140c';
      ctx.fillRect(signX - 19, signY - 27, 38, 16);
      ctx.fillStyle = '#8c5a30';
      ctx.fillRect(signX - 18, signY - 26, 36, 14);
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('PARK', signX, signY - 16);

      // -----------------------------------------------------------------------
      // NORTH CENTRAL PARK LAWN, GRAND MONUMENT SIGN & SHADE TREES
      // -----------------------------------------------------------------------
      const drawNorthParkMonumentSign = (cx, baseY) => {
        const scx = Math.round(cx);
        const sby = Math.round(baseY);
        // Ground contact shadow
        ctx.fillStyle = 'rgba(18, 32, 12, 0.30)';
        ctx.beginPath();
        ctx.ellipse(scx, sby + 3, 124, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        this._extDepthProps.push({
          sortY: sby,
          zBias: 0,
          draw: () => {
            const postSpan = 200;
            const leftPostX = scx - Math.round(postSpan / 2) - 7;
            const rightPostX = scx + Math.round(postSpan / 2) - 7;
            const boardW = 236;
            const boardH = 56;
            const boardX = scx - Math.round(boardW / 2);
            const boardY = sby - 80;

            // Connecting carved stone sill & mossy flower tufts between posts
            ctx.fillStyle = '#20140c';
            ctx.fillRect(leftPostX + 10, sby - 10, postSpan - 6, 10);
            ctx.fillStyle = '#68707c';
            ctx.fillRect(leftPostX + 11, sby - 9, postSpan - 8, 8);
            ctx.fillStyle = '#9aa4b2';
            ctx.fillRect(leftPostX + 11, sby - 9, postSpan - 8, 3);

            // Twin Heavy Oak Posts + Carved Stone Plinth Feet
            [leftPostX, rightPostX].forEach(px => {
              // Stone base block
              ctx.fillStyle = '#20140c';
              ctx.fillRect(px - 5, sby - 14, 24, 15);
              ctx.fillStyle = '#707884';
              ctx.fillRect(px - 4, sby - 13, 22, 13);
              ctx.fillStyle = '#aeb6c4';
              ctx.fillRect(px - 3, sby - 13, 20, 3);
              // Timber post
              ctx.fillStyle = '#20140c';
              ctx.fillRect(px - 1, boardY + 4, 16, sby - boardY - 16);
              ctx.fillStyle = '#6e421f';
              ctx.fillRect(px, boardY + 5, 14, sby - boardY - 18);
              ctx.fillStyle = '#965e30';
              ctx.fillRect(px + 2, boardY + 5, 5, sby - boardY - 18);
              // Iron anchor collars
              ctx.fillStyle = '#334155';
              ctx.fillRect(px - 1, sby - 19, 16, 4);
              ctx.fillRect(px - 1, boardY + boardH - 2, 16, 4);
            });

            // Wildflower & leaf accents beside stone plinths
            const paintPlinthTuft = (tx, ty, flowerCol) => {
              ctx.fillStyle = '#1e4a18';
              ctx.fillRect(tx - 6, ty - 4, 12, 6);
              ctx.fillStyle = '#3f8c2a';
              ctx.fillRect(tx - 5, ty - 6, 10, 5);
              ctx.fillStyle = flowerCol;
              ctx.fillRect(tx - 4, ty - 7, 3, 3);
              ctx.fillRect(tx + 2, ty - 5, 3, 3);
            };
            paintPlinthTuft(leftPostX - 9, sby + 1, '#f43f5e');
            paintPlinthTuft(rightPostX + 23, sby + 1, '#facc15');
            paintPlinthTuft(scx, sby - 2, '#fef08a');

            // Main Oak Signboard Frame
            ctx.fillStyle = '#20140c';
            ctx.fillRect(boardX - 2, boardY - 2, boardW + 4, boardH + 4);
            ctx.fillStyle = '#7c4b24';
            ctx.fillRect(boardX, boardY, boardW, boardH);
            ctx.fillStyle = '#a86e3c';
            ctx.fillRect(boardX + 2, boardY + 2, boardW - 4, 3);
            ctx.fillStyle = '#4f2e15';
            ctx.fillRect(boardX + 2, boardY + boardH - 5, boardW - 4, 3);

            // Deep Forest-Slate Marquee Face
            ctx.fillStyle = '#14261a';
            ctx.fillRect(boardX + 7, boardY + 7, boardW - 14, boardH - 14);
            ctx.fillStyle = '#1c3625';
            ctx.fillRect(boardX + 9, boardY + 9, boardW - 18, Math.floor((boardH - 18) / 2));
            ctx.strokeStyle = '#c8964c';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(boardX + 8.5, boardY + 8.5, boardW - 17, boardH - 17);

            // Brass Corner Studs
            const studs = [
              [boardX + 4, boardY + 4], [boardX + boardW - 7, boardY + 4],
              [boardX + 4, boardY + boardH - 7], [boardX + boardW - 7, boardY + boardH - 7]
            ];
            studs.forEach(([sx, sy]) => {
              ctx.fillStyle = '#20140c';
              ctx.fillRect(sx - 1, sy - 1, 5, 5);
              ctx.fillStyle = '#fbbf24';
              ctx.fillRect(sx, sy, 3, 3);
            });

            // Pitched Cedar-Shingle Hood & Center Brass Crest
            const hoodW = boardW + 16;
            const hoodX = scx - Math.round(hoodW / 2);
            const hoodY = boardY - 14;
            ctx.fillStyle = '#20140c';
            ctx.fillRect(hoodX - 2, hoodY + 4, hoodW + 4, 13);
            ctx.fillRect(scx - 86, hoodY - 2, 172, 9);
            ctx.fillStyle = '#5c381c';
            ctx.fillRect(hoodX, hoodY + 5, hoodW, 10);
            ctx.fillStyle = '#784a26';
            ctx.fillRect(scx - 84, hoodY, 168, 7);
            ctx.fillStyle = '#9c6638';
            ctx.fillRect(scx - 82, hoodY + 1, 164, 2);
            // Center Crest Jewel Emblem
            ctx.fillStyle = '#20140c';
            ctx.fillRect(scx - 11, hoodY - 5, 22, 12);
            ctx.fillStyle = '#d8a642';
            ctx.fillRect(scx - 9, hoodY - 3, 18, 8);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(scx - 3, hoodY - 1, 6, 4);

            // Large, Crisp Multi-Line Typography
            ctx.textAlign = 'center';
            ctx.font = 'bold 15px "Georgia", serif';
            ctx.fillStyle = '#09120c';
            ctx.fillText('OAKHAVEN', scx + 1, boardY + 26);
            ctx.fillStyle = '#fef08a';
            ctx.fillText('OAKHAVEN', scx, boardY + 25);

            // Gold Rule Filigree Between Title Lines
            ctx.fillStyle = '#c8964c';
            ctx.fillRect(scx - 62, boardY + 30, 124, 1.5);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(scx - 2, boardY + 29, 4, 3);

            ctx.font = 'bold 11.5px "Georgia", serif';
            ctx.fillStyle = '#09120c';
            ctx.fillText('CENTRAL PARK', scx + 1, boardY + 45);
            ctx.fillStyle = '#f6ebd4';
            ctx.fillText('CENTRAL PARK', scx, boardY + 44);
          }
        });
      };
      drawNorthParkMonumentSign(21.1 * S, 4.95 * S);

      for (const [tx, ty, r, isAutumn, zone] of this.getExteriorTreeClusters()) {
        if (zone === 'park_north') drawLushBushCluster(tx * S, ty * S, r, isAutumn);
      }

      // -----------------------------------------------------------------------
      // CENTRAL PARK 2-TIERED OVERFLOWING STONE FOUNTAIN (x = 21.1*S, y = 9.0*S)
      // -----------------------------------------------------------------------
      const ftx = Math.round(21.1 * S);
      const fty = Math.round(9.0 * S);

      if (this.isImgReady('fountain')) {
        const fImg = this.owSprites.fountain;
        const fh = 122;
        const fw = Math.round(fh * (fImg.width / fImg.height));
        ctx.drawImage(fImg, Math.round(ftx - fw / 2), Math.round(fty - fh / 2 - 4), fw, fh);
        const epRip = ((this.tick || 0) * 0.14) % 10;
        ctx.strokeStyle = 'rgba(205, 248, 255, 0.58)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(ftx, fty + 20, 18 + epRip * 1.4, 9 + epRip * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        const epDrop = ((this.tick || 0) * 0.24) % 5;
        ctx.fillStyle = '#e0f8ff';
        ctx.fillRect(ftx - 2, fty - 52 - epDrop, 4, 5);
        ctx.fillRect(ftx - 14, fty - 14 + epDrop, 3, 5);
        ctx.fillRect(ftx + 11, fty - 14 + epDrop, 3, 5);
      } else {
      // Ground shadow
      ctx.fillStyle = 'rgba(20, 14, 10, 0.30)';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 18, 48, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lower carved stone rim (3/4 perspective)
      ctx.fillStyle = '#1c222a';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 11, 46, 29, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#68707c';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 11, 43, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9aa4b2';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 7, 43, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c8d0dc';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 4, 40, 23, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling turquoise water pool
      ctx.fillStyle = '#1468a0';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 5, 34, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2ca4dc';
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 5, 31, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      const epRip = ((this.tick || 0) * 0.14) % 10;
      ctx.strokeStyle = 'rgba(186, 244, 255, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(ftx, fty + 5, 16 + epRip * 1.4, 8 + epRip * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pedestal + upper stone bowl + animated cascading water
      ctx.fillStyle = '#1c222a';
      ctx.fillRect(ftx - 9, fty - 14, 18, 22);
      ctx.fillStyle = '#707886';
      ctx.fillRect(ftx - 7, fty - 13, 14, 20);
      ctx.fillStyle = '#aeb6c4';
      ctx.fillRect(ftx - 5, fty - 13, 6, 20);

      ctx.fillStyle = '#1c222a';
      ctx.beginPath();
      ctx.ellipse(ftx, fty - 16, 25, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#747c8a';
      ctx.beginPath();
      ctx.ellipse(ftx, fty - 15, 23, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c8d0dc';
      ctx.beginPath();
      ctx.ellipse(ftx, fty - 18, 23, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2090cc';
      ctx.beginPath();
      ctx.ellipse(ftx, fty - 18, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#68d8ff';
      ctx.beginPath();
      ctx.ellipse(ftx, fty - 18.5, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c222a';
      ctx.fillRect(ftx - 4, fty - 30, 8, 13);
      ctx.fillStyle = '#b4bcc8';
      ctx.fillRect(ftx - 3, fty - 29, 6, 11);

      const epShift = Math.floor(((this.tick || 0) * 0.18) % 3);
      [-15, -8, 0, 8, 15].forEach((ox, idx) => {
        const j = (epShift + idx) % 2;
        ctx.fillStyle = '#5cd0ff';
        ctx.fillRect(ftx + ox - 2, fty - 13 + j, 4, 17);
        ctx.fillStyle = '#e0f8ff';
        ctx.fillRect(ftx + ox - 1, fty - 12 + j, 2, 15);
        ctx.fillStyle = '#d4f6ff';
        ctx.fillRect(ftx + ox - 3, fty + 4 + j, 6, 3);
      });

      ctx.fillStyle = '#7ce2ff';
      ctx.fillRect(ftx - 2, fty - 40 - epShift, 4, 12);
      ctx.fillRect(ftx - 7, fty - 39 + epShift, 3, 5);
      ctx.fillRect(ftx + 4, fty - 39 + epShift, 3, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ftx - 1, fty - 42 - epShift, 2, 4);
      for (let sp = 0; sp < 4; sp++) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ftx + ((sp % 2 === 0 ? -1 : 1) * (8 + sp * 3)), fty - 26 + ((epShift + sp) % 3) * 3, 2, 2);
      }
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
      for (const [tx, ty, r, isAutumn, zone] of this.getExteriorTreeClusters()) {
        if (zone === 'park_perim') drawLushBushCluster(tx * S, ty * S, r, isAutumn);
      }
    }
    drawEntity(entity) {
      if (!entity || !entity.sprite) return;
      const ctx = this.ctx;
      const S = this.TILE;
      const isExt = this.currentArea === 'exterior';
      const spriteScale = isExt ? 1.85 : 2.55;
      const cx = Math.round(entity.x * S);
      const footY = Math.round(entity.y * S + (isExt ? 10 : 18));

      entity.sprite.draw(ctx, cx, footY, entity.dir, entity.walkTick || 0, spriteScale);

      if (entity.name) {
        ctx.font = isExt ? 'bold 9px "Georgia", serif' : 'bold 11.5px "Georgia", serif';
        const textW = Math.max(isExt ? 40 : 56, ctx.measureText(entity.name).width + 14);
        const tagH = isExt ? 14 : 17;
        const tx = cx - textW / 2;
        const ty = footY + 3;
        ctx.fillStyle = 'rgba(20, 12, 6, 0.36)';
        ctx.beginPath();
        ctx.roundRect(tx, ty + 1.5, textW, tagH, 4);
        ctx.fill();
        ctx.fillStyle = '#f6ebd4';
        ctx.beginPath();
        ctx.roundRect(tx, ty, textW, tagH, 4);
        ctx.fill();
        ctx.fillStyle = '#fffaf0';
        ctx.fillRect(tx + 3, ty + 1, textW - 6, 2);
        ctx.strokeStyle = '#3a2416';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(tx, ty, textW, tagH, 4);
        ctx.stroke();
        ctx.fillStyle = '#26170c';
        ctx.textAlign = 'center';
        ctx.fillText(entity.name, cx, ty + (isExt ? 10.5 : 12.5));
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
        const by = footY - (isExt ? 68 : 96) - Math.sin(this.tick * 0.09) * 3.5;
        ctx.fillStyle = showTalkBubble ? '#fef08a' : '#fff8eb';
        ctx.beginPath();
        ctx.roundRect(cx - (showTalkBubble ? 16 : 14), by, (showTalkBubble ? 32 : 28), 22, 6);
        ctx.fill();
        ctx.strokeStyle = showTalkBubble ? '#b45309' : '#3a2416';
        ctx.lineWidth = showTalkBubble ? 2.2 : 1.6;
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
          if (mom.x > 13.4 || mom.x < 2.4 || mom.y < 4.5 || mom.y > 10.2) {
            mom.x = 12.5;
            mom.y = 6.2;
            mom.targetX = null;
            mom.targetY = null;
            mom.dir = 'left';
          }
          active.push(mom);
        } else if (this.hasMomBoosterMoney) {
          mom = this.createMomNpc();
          mom.x = 12.5;
          mom.y = 6.2;
          mom.targetX = null;
          mom.targetY = null;
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
        this.syncParkNpcBubbles();
        active.push(this.chloeNpc, this.rowanNpc, this.jasperNpc);
      }

      const curDay = this.dayNumber || 1;
      active.forEach(npc => {
        const homeId = (npc.id === 'best_friend' || npc.id === 'friend') ? 'friend' : npc.id;
        if (['friend', 'pluto', 'nova', 'silas', 'maya'].includes(homeId)) {
          if (npc._baseBubble === undefined) npc._baseBubble = npc.bubble;
          const hasMeetupToday = this.storyState === 'free_roam' && this.getScheduledMeetupsForNpc(homeId, area, curDay).length > 0;
          npc.bubble = hasMeetupToday ? '🤝' : npc._baseBubble;
        }
      });
      active.push(...this.getActiveMeetupVisitorsForArea(area));

      return active;
    }

    isMobileViewport() {
      return window.innerWidth <= 820 || (('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024);
    }

    getAreaZoom() {
      if (this.currentArea === 'exterior') {
        return this.EXT_ZOOM || 1.28;
      }
      return this.isMobileViewport() ? 1.30 : 1;
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const S = this.TILE;

      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.imageSmoothingEnabled = false;
      if (this.shakeTicks > 0) {
        const mag = (this.shakeTicks / 28) * 9;
        const sx = (Math.random() - 0.5) * mag * 2;
        const sy = (Math.random() - 0.5) * mag * 2;
        ctx.translate(sx, sy);
      }

      const isExt = this.currentArea === 'exterior';
      const zoom = this.getAreaZoom();
      const useCameraTransform = isExt || zoom !== 1;

      if (useCameraTransform) {
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-Math.round(this.cameraX || 0), -Math.round(this.cameraY || 0));
      }

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
        this.renderCraftsmanExterior();
      }

      const activeNpcs = this.getActiveNpcsForArea(this.currentArea);

      const entityItems = [
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
      ].map(e => ({
        sortY: Math.round(e.y * S + (isExt ? 10 : 18)),
        zBias: 1,
        draw: () => this.drawEntity(e)
      }));

      // Depth-sort exterior trees and shrubs with entities so characters walk behind canopies
      const renderList = isExt && Array.isArray(this._extDepthProps)
        ? [...entityItems, ...this._extDepthProps]
        : entityItems;

      renderList.sort((a, b) => (a.sortY - b.sortY) || (a.zBias - b.zBias));
      renderList.forEach(item => item.draw());

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

      if (useCameraTransform) {
        ctx.restore();
      }

      this.drawShaderPass();
      ctx.restore();
    }

    loop() {
      requestAnimationFrame(() => this.loop());
      this.tick++;
      try {
        this.update();
        if (this.active) {
          this.render();
        }
        this.renderCreatorPreview();
      } catch (err) {
        console.error('Overworld loop error:', err);
      }
    }
  }

  window.MythosOverworld = MythosOverworld;
})();
