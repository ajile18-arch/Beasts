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
    // Mythos Mobile Smartphone System (Apps: Contacts, Card Exchange, Shop Alerts, Tournaments)
    // -------------------------------------------------------------------------
    initPhoneSystem() {
      this.currentPhoneApp = 'home';
      this.activeChatContactId = null;
      this.marketTab = 'buy'; // 'buy' or 'sell'
      this.phoneUnreadShop = this.worldSave?.phoneUnreadShop ?? true;
      this.phoneChatHistories = this.worldSave?.phoneChatHistories || {};
      this.phoneListingsBought = this.worldSave?.phoneListingsBought || [];
      this.phoneListingsSold = this.worldSave?.phoneListingsSold || [];
      this.registeredTournaments = this.worldSave?.registeredTournaments || [];
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
            { text: `📦 "Do you have any foil packs left in stock?"`, reply: `Always! Base Set boosters are $10.00 each, and remember that Mondays have a +25% Foil Holo surge rate!` },
            { text: `🗺️ "Tell me about the Base2v2 Tactical Battle Map."`, reply: `It's Silas's handcrafted arena! On Wednesdays Silas runs a woodcraft promo with 50% off the map!` },
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
            { text: `🤝 "Got any good card listings on the exchange?"`, reply: `Check the Card Exchange app on your phone right now! I posted a few single offers looking for meetups in the park.` }
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
      return [
        {
          id: 'mkt_buy_1',
          type: 'buy',
          beastId: 'werewolf',
          cardName: 'Werewolf',
          element: '🌑 Dark • 140 HP',
          price: 5.50,
          seller: 'Rowan',
          avatar: '🃏',
          location: 'Central Park Picnic Table 2',
          note: 'Mint condition duplicate from base pack. Ready for a quick park courtyard meetup!',
          img: 'Cards/Werewolf_Card.png'
        },
        {
          id: 'mkt_buy_2',
          type: 'buy',
          beastId: 'earth_golem',
          cardName: 'Earth Golem',
          element: '🪨 Earth • 200 HP',
          price: 6.00,
          seller: 'Silas',
          avatar: '⚒️',
          location: "Silas's Workshop (303 Cobblestone Way)",
          note: 'Rock Barrier defense single. Guaranteed authentic heartwood-certified sleeve.',
          img: 'Cards/Earth_Golem_Card.png'
        },
        {
          id: 'mkt_buy_3',
          type: 'buy',
          beastId: 'hydra',
          cardName: 'Hydra',
          element: '💧 Water • 160 HP',
          price: 7.00,
          seller: 'Pluto',
          avatar: '💻',
          location: "Pluto's House (201 South Connector Ave)",
          note: 'Multi-target Venom Strike beast. Tested in 25 benchmark matches.',
          img: 'Cards/Hydra_Card.png'
        },
        {
          id: 'mkt_buy_4',
          type: 'buy',
          beastId: 'phoenix',
          cardName: 'Phoenix (Holo)',
          element: '🔥 Fire • 120 HP',
          price: 12.00,
          seller: 'Nova',
          avatar: '✨',
          location: "Nova's Observatory (301 Cobblestone Way)",
          note: 'Flaming Talons & Rebirth burst! Looking for cash for telescope optics.',
          img: 'Cards/Phoenix_Card.png'
        },
        {
          id: 'mkt_sell_1',
          type: 'sell',
          beastId: 'phoenix',
          cardName: 'Phoenix',
          element: '🔥 Fire Beast',
          payout: 8.50,
          buyer: 'Rowan',
          avatar: '🃏',
          location: 'Central Park Courtyard',
          note: 'Looking to buy 1x Phoenix to round out my aggressive fire burn deck!'
        },
        {
          id: 'mkt_sell_2',
          type: 'sell',
          beastId: 'earth_golem',
          cardName: 'Earth Golem',
          element: '🪨 Earth Beast',
          payout: 5.00,
          buyer: 'Pluto',
          avatar: '💻',
          location: "Pluto's Bedroom Desk",
          note: 'Need an Earth tank card for damage-mitigation calculation tests.'
        },
        {
          id: 'mkt_sell_3',
          type: 'sell',
          beastId: 'werewolf',
          cardName: 'Werewolf',
          element: '🌑 Dark Beast',
          payout: 4.50,
          buyer: 'Maya',
          avatar: '🌿',
          location: "Maya's Greenhouse",
          note: 'Looking for a Werewolf card to trade to a visiting collector!'
        }
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
          text: 'Factory-sealed 1st-Edition foil booster packs ($10.00 each) are fully stocked on our showcase racks. Every pack guarantees 3 collectible beast cards with chances at rare foils!'
        },
        {
          id: 'feed_map',
          title: 'Base2v2 Tactical Arena Available',
          tag: 'STORE GEAR',
          time: 'Store Feature',
          icon: '⚔️',
          highlight: false,
          text: 'Upgrade from 1v1 duels to fast-paced 2v2 tactical tabletop combat! Purchase the official 6×6 Base2v2 Battle Map from Leo for $15.00 (or $7.50 during Wednesday Woodcraft).'
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
          format: '1v1 / 2v2 Tabletop Duels',
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
          format: 'Best-of-3 Base2v2 Elimination',
          location: 'Central Park Courtyard & Promenade',
          desc: 'The premier summer tournament attracting all master duelists across Oakhaven. Silas, Nova, Pluto, and Maya compete for the championship banner!'
        },
        {
          id: 'tourney_park',
          name: 'Courtyard Rookie Invitational',
          badge: 'CASUAL OPEN',
          badgeClass: 'blue',
          dayText: 'Daily • Continuous Matchups',
          fee: 'Free Entry',
          prize: 'Card Trades & Stamina Buffs',
          format: 'Casual Pickup Matches',
          location: 'Central Park Picnic Tables',
          desc: 'A friendly gathering in the park courtyard hosted by Chloe, Rowan, and Jasper. Perfect for playtesting new deck synergy before entering the Friday League.'
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

    renderMarketApp() {
      const container = document.getElementById('phone-listings-container');
      const tabBuy = document.getElementById('tab-market-buy');
      const tabSell = document.getElementById('tab-market-sell');
      if (!container) return;

      if (tabBuy && tabSell) {
        if (this.marketTab === 'buy') {
          tabBuy.classList.add('active');
          tabSell.classList.remove('active');
        } else {
          tabBuy.classList.remove('active');
          tabSell.classList.add('active');
        }
      }

      const allListings = this.getMarketplaceListings();
      const currentListings = allListings.filter(l => l.type === this.marketTab);
      container.innerHTML = '';

      if (this.marketTab === 'buy') {
        currentListings.forEach(item => {
          const isBought = this.phoneListingsBought.includes(item.id);
          const cardEl = document.createElement('div');
          cardEl.className = 'phone-listing-card';
          cardEl.innerHTML = `
            <div class="phone-listing-top">
              <div>
                <span class="phone-listing-card-title">${item.cardName}</span>
                <div style="font-size: 10px; color: #94a3b8;">${item.element}</div>
              </div>
              <span class="phone-listing-price">${this.formatMoney(item.price)}</span>
            </div>
            <div class="phone-listing-seller">
              ${item.avatar} Seller: <strong>${item.seller}</strong>
            </div>
            <div class="phone-listing-meetup">
              📍 Meetup Location: <b>${item.location}</b>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; font-style: italic;">"${item.note}"</div>
            <button class="phone-listing-btn" id="btn-buy-${item.id}" ${isBought ? 'disabled style="background: #334155; border-color: #475569; cursor: default;"' : ''}>
              ${isBought ? '✅ Purchased & Collected' : `🤝 Meet & Buy (${this.formatMoney(item.price)})`}
            </button>
          `;
          const buyBtn = cardEl.querySelector(`#btn-buy-${item.id}`);
          if (buyBtn && !isBought) {
            buyBtn.addEventListener('click', () => {
              this.buyMarketListing(item);
            });
          }
          container.appendChild(cardEl);
        });
      } else {
        // Player Sell Offers
        currentListings.forEach(item => {
          const isSold = this.phoneListingsSold.includes(item.id);
          // Check if player has this card in inventory
          const playerHasCard = (this.inventory || []).some(i => i.beastId === item.beastId && (i.qty || 1) > 0);

          const cardEl = document.createElement('div');
          cardEl.className = 'phone-listing-card';
          cardEl.innerHTML = `
            <div class="phone-listing-top">
              <div>
                <span class="phone-listing-card-title">${item.cardName}</span>
                <div style="font-size: 10px; color: #94a3b8;">Wanted by ${item.buyer}</div>
              </div>
              <span class="phone-listing-price">+${this.formatMoney(item.payout)} Payout</span>
            </div>
            <div class="phone-listing-seller">
              ${item.avatar} Buyer: <strong>${item.buyer}</strong>
            </div>
            <div class="phone-listing-meetup">
              📍 Meetup Location: <b>${item.location}</b>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; font-style: italic;">"${item.note}"</div>
            <button class="phone-listing-btn" id="btn-sell-${item.id}" ${isSold || !playerHasCard ? 'disabled style="background: #334155; border-color: #475569; cursor: default;"' : 'style="background: linear-gradient(135deg, #059669, #10b981); border-color: #34d399;"'}>
              ${isSold ? '✅ Fulfilled & Paid' : (playerHasCard ? `💰 Sell to ${item.buyer} (+${this.formatMoney(item.payout)})` : '❌ Card Not in Backpack')}
            </button>
          `;
          const sellBtn = cardEl.querySelector(`#btn-sell-${item.id}`);
          if (sellBtn && !isSold && playerHasCard) {
            sellBtn.addEventListener('click', () => {
              this.sellMarketListing(item);
            });
          }
          container.appendChild(cardEl);
        });
      }
    }

    buyMarketListing(item) {
      if ((this.gold || 0) < item.price) {
        if (window.sounds?.playError) window.sounds.playError();
        alert(`You don't have enough cash! (Wallet: ${this.formatMoney(this.gold || 0)}). Earn cash from Mom, duel Pluto, or sell extra cards first.`);
        return;
      }
      this.gold = Math.round(((this.gold || 0) - item.price) * 100) / 100;
      this.phoneListingsBought.push(item.id);

      // Add purchased card to inventory
      const cardDef = this.getBaseSetCardCatalog().find(c => c.beastId === item.beastId);
      if (cardDef) {
        this.addCardToInventory(cardDef);
      }

      if (window.sounds?.playCollect) window.sounds.playCollect();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderMarketApp();
      this.showAutosaveIndicator(`🤝 Meetup Complete: Received ${item.cardName} from ${item.seller}!`);
    }

    sellMarketListing(item) {
      const idx = (this.inventory || []).findIndex(i => i.beastId === item.beastId && (i.qty || 1) > 0);
      if (idx === -1) {
        if (window.sounds?.playError) window.sounds.playError();
        alert(`You don't have a ${item.cardName} in your backpack to sell!`);
        return;
      }

      // Remove 1 card or decrement quantity
      const invItem = this.inventory[idx];
      if (invItem.qty && invItem.qty > 1) {
        invItem.qty--;
      } else {
        this.inventory.splice(idx, 1);
      }

      this.gold = Math.round(((this.gold || 0) + item.payout) * 100) / 100;
      this.phoneListingsSold.push(item.id);

      if (window.sounds?.playCoins) window.sounds.playCoins();
      this.saveWorldData(this.draftAppearance);
      this.updateHUDSaveInfo();
      this.renderMarketApp();
      this.showAutosaveIndicator(`💰 Sold ${item.cardName} to ${item.buyer} for +${this.formatMoney(item.payout)}!`);
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
        const card = document.createElement('div');
        card.className = `phone-tourney-card${t.id === 'tourney_fri' ? ' live-today' : ''}`;
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
      const id = interactable.id;
      const friend = this.getFriendNpc();
      return id === 'friend' || id === 'best_friend' || id === 'friend_duel' || id === 'mom' || id === 'shopkeeper' || id === 'pluto' || id === 'nova' || id === 'silas' || id === 'maya' || id === 'chloe' || id === 'rowan' || id === 'jasper' || interactable === friend || interactable === this.shopkeeperNpc || interactable === this.plutoNpc || interactable === this.novaNpc || interactable === this.silasNpc || interactable === this.mayaNpc || interactable === this.chloeNpc || interactable === this.rowanNpc || interactable === this.jasperNpc;
    }

    startTalkingToNpc(npcId) {
      if (window.sounds?.playClick) window.sounds.playClick();
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

        if (mom && distToMom < 1.85) {
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
          textEl.innerHTML = `<i>"🔥 MYTHOS BOOSTER PACKS: Just $10 a pack at Leo's Card Shop! Collect Phoenix, Earth Golem, Hydra, Werewolf & more!"</i>`;
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

          this.renderNpcChoicePrompt({
            npcId: 'friend_duel',
            promptKey: `friend_interior_duel_${fName}_${pName}_${this.hasOldCardBinder}`,
            speakerText: `⚔️ ${fName.toUpperCase()} — READY TO BATTLE AT ${fName.toUpperCase()}'S HOUSE!`,
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>${fName}</b> at the duel table.`,
            greetingHtml: this.hasOldCardBinder
              ? `<b>${fName}:</b> "That was such an awesome match, ${pName}! How is that <b>Old Card Binder</b> working out for you? You can slot up to 9 cards into it, inspect their standalone art, and test new builds in battle! Want a rematch?!"`
              : `<b>${fName}:</b> "Welcome to my house, ${pName}!! I've got the <b>MYTHOS Tabletop Arena</b> set up right here on my table with the 3 cards I pulled from Leo's pack! Defeat me and I'll give you my brother's <b>Old Card Binder</b>! Ready to battle?!"`,
            choices: friendDuelChoices,
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

        if (distToKeeper < 1.9) {
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
          if (this.hasBoughtBase2v2Map) {
            plutoChoices.push(
              hasDollar
                ? {
                    label: `${optNum++}. 🏟️ "Let's duel on Base2v2 for $1.00 (Select 2 Beasts)!"`,
                    primary: true,
                    silentClick: true,
                    onSelect: () => this.open2v2BeastSelect(this.plutoNpc)
                  }
                : {
                    label: `${optNum++}. 🏟️ "Let's duel on Base2v2 for $1.00!" <i>(Need $1.00)</i>`,
                    onSelect: (el) => {
                      el.innerHTML = `<b>Pluto:</b> "We need at least $1.00 each for the wager! Go sell an extra card to Shopkeeper Leo or earn some cash, then let's play Base2v2!"`;
                    }
                  }
            );
          }
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

          this.renderNpcChoicePrompt({
            npcId: 'pluto',
            promptKey: `pluto_dialogue_${pName}_${hasDollar}_${this.hasBoughtBase2v2Map}_${res || 'none'}`,
            speakerText: '💻 PLUTO — BEDROOM COMPUTER DESK',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Pluto</b> at his computer desk.`,
            greetingHtml: plutoGreeting,
            choices: plutoChoices,
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
          this.renderNpcChoicePrompt({
            npcId: 'nova',
            promptKey: `nova_dialogue_${pName}_${nRes || 'none'}`,
            speakerText: '✨ NOVA — STARGAZER OBSERVATORY',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Nova</b> by her brass telescope and star charts.`,
            greetingHtml: nRes === 'won'
              ? `<b>Nova:</b> "Written in the constellations, ${pName}! What brilliant celestial synergy! Here is your <b>$2.00</b> stargazer prize and my <b>Pegasus (Holo)</b> card! Care for another match?"`
              : `<b>Nova:</b> "Greetings, ${pName}! Welcome to my observatory home! The celestial currents are shimmering today. Are you here to study constellation card affinities, or would you like to test your deck in a <b>MYTHOS Tabletop Battle</b>?"`,
            choices: [
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
          this.renderNpcChoicePrompt({
            npcId: 'silas',
            promptKey: `silas_dialogue_${pName}_${sRes || 'none'}`,
            speakerText: '🪵 SILAS — CRAFTSMAN WORKSHOP',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Silas</b> by his stone hearth and artisan woodworking bench.`,
            greetingHtml: sRes === 'won'
              ? `<b>Silas:</b> "Fine craftsmanship in your maneuvering, ${pName}! Take this <b>$2.00</b> purse and my reinforced <b>Dwarf Warden (Holo)</b> card! Up for another round?"`
              : `<b>Silas:</b> "Welcome, ${pName}! Come warm yourself by the hearth. I've been hand-planing cedar deck boxes all morning. How's your collection looking? Up for a friendly <b>MYTHOS Tabletop Battle</b>?"`,
            choices: [
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
          this.renderNpcChoicePrompt({
            npcId: 'maya',
            promptKey: `maya_dialogue_${pName}_${mRes || 'none'}`,
            speakerText: '🌿 MAYA — BOTANICAL CONSERVATORY',
            talkPromptHtml: `Press <b>Talk</b> to speak with <b>Maya</b> in her sunlit greenhouse conservatory.`,
            greetingHtml: mRes === 'won'
              ? `<b>Maya:</b> "Breathtaking tactics, ${pName}! Your beasts flourished like a wild canopy! Come back to the greenhouse anytime for another friendly match!"`
              : `<b>Maya:</b> "Hey ${pName}! Take a deep breath—fresh sweet jasmine and fern moss! I've been cultivating botanicals that nourish earth Beasts. Are you ready for a spirited <b>MYTHOS Tabletop Battle</b>?"`,
            choices: [
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

        const parkNpcs = [
          {
            npc: this.chloeNpc,
            dist: distChloe,
            id: 'chloe',
            speakerText: '🧺 CHLOE — PARK COURTYARD PICNIC',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Chloe</b> at the picnic table.`,
            greeting: `<b>Chloe:</b> "Oh, hello ${pName}! It's such a gorgeous sunny afternoon in Central Park! I packed a whole basket of lemon bars and berry iced tea. Are you out exploring the town?"`,
            options: [
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
            ],
            leaveLabel: `4. 👋 "Enjoy your picnic, Chloe! (Leave)"`
          },
          {
            npc: this.rowanNpc,
            dist: distRowan,
            id: 'rowan',
            speakerText: '🃏 ROWAN — MYTHOS DECK THEORIST',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Rowan</b> by his card binder and deckboxes.`,
            greeting: `<b>Rowan:</b> "Hey ${pName}! Check out this spread — I'm organizing my tactical beast pairings for the upcoming Oakhaven tournament. What kind of deck archetype are you running?"`,
            options: [
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
            ],
            leaveLabel: `4. 👋 "Good luck with your deck, Rowan! (Leave)"`
          },
          {
            npc: this.jasperNpc,
            dist: distJasper,
            id: 'jasper',
            speakerText: '🎨 JASPER — WILDLIFE SKETCHER',
            talkPrompt: `Press <b>Talk</b> to speak with <b>Jasper</b> by his wildlife sketchpad.`,
            greeting: `<b>Jasper:</b> "Shh... look up through the maple and oak canopies! A flock of cedar waxwings just landed among the high boughs. I'm finishing up a wildlife sketch. Want to see?"`,
            options: [
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
            ],
            leaveLabel: `4. 👋 "Keep up the great sketching, Jasper! (Leave)"`
          }
        ];
        const nearParkNpc = parkNpcs.find(p => p.npc && p.dist < 1.6);

        if ((this.activeDialogueNpc === 'friend' || this.activeDialogueNpc === fName) && distFriendExt < 1.55) {
          renderExtFriend();
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
          this.renderNpcChoicePrompt({
            npcId: nearParkNpc.id,
            promptKey: `${nearParkNpc.id}_dialogue_${pName}`,
            speakerText: nearParkNpc.speakerText,
            speakerClass: 'ow-speaker-tag friend',
            talkPromptHtml: nearParkNpc.talkPrompt,
            greetingHtml: nearParkNpc.greeting,
            choices: [
              ...nearParkNpc.options.map(opt => ({
                label: opt.label,
                primary: !!opt.primary,
                onSelect: (tEl) => { tEl.innerHTML = opt.reply; }
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
        if (active === 'chloe' || active === 'rowan' || active === 'jasper' || ((active === 'friend' || active === friendName) && this.currentArea !== 'friend_interior')) {
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
        phoneUnreadShop: this.phoneUnreadShop ?? true,
        phoneChatHistories: this.phoneChatHistories || {},
        phoneListingsBought: this.phoneListingsBought || [],
        phoneListingsSold: this.phoneListingsSold || [],
        registeredTournaments: this.registeredTournaments || [],
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
        this.marketTab = 'buy';
        this.renderMarketApp();
      });
      document.getElementById('tab-market-sell')?.addEventListener('click', () => {
        if (window.sounds?.playClick) window.sounds.playClick();
        this.marketTab = 'sell';
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
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const cx = (clientX - rect.left) * scaleX;
        const cy = (clientY - rect.top) * scaleY;
        const zoom = this.currentArea === 'exterior' ? (this.EXT_ZOOM || 1.28) : 1;
        const tx = (cx / zoom + (this.currentArea === 'exterior' ? (this.cameraX || 0) : 0)) / this.TILE;
        const ty = (cy / zoom + (this.currentArea === 'exterior' ? (this.cameraY || 0) : 0)) / this.TILE;

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
          }
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
          this.handleChallengeOrLeaveAction();
        });
      }
    }

    triggerDuel(challenger = null, mapId = 'standard_10x8', customPlayerTeam = null) {
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
        // Central Stone Tiered Water Fountain (center at x: 21.1, y: 9.0)
        if (Math.hypot(tx - 21.1, ty - 9.0) < 0.85) return true;
        // Picnic Table 1 (NW / Chloe's Picnic Table: x: 18.8..20.2, y: 7.3..8.1)
        if (tx >= 18.8 && tx <= 20.2 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 2 (NE / Rowan's Card Table: x: 22.1..23.5, y: 7.3..8.1)
        if (tx >= 22.1 && tx <= 23.5 && ty >= 7.3 && ty <= 8.1) return true;
        // Picnic Table 3 (S / Jasper's Sketchbook Table: x: 20.4..21.8, y: 10.1..10.9)
        if (tx >= 20.4 && tx <= 21.8 && ty >= 10.1 && ty <= 10.9) return true;
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
        this.player.walkTick += 0.11;
        const speed = this.currentArea === 'exterior' ? 0.042 : 0.046;
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

      // Smooth camera scroll for the expanded exterior world (zoomed cozy RPG framing)
      if (this.currentArea === 'exterior') {
        const zoom = this.EXT_ZOOM || 1.28;
        const viewW = this.canvas.width / zoom;
        const viewH = this.canvas.height / zoom;
        const maxCamY = Math.max(0, this.EXT_ROWS * this.TILE - viewH);
        const targetCamY = Math.max(0, Math.min(maxCamY, this.player.y * this.TILE - viewH / 2));
        this.cameraY += (targetCamY - this.cameraY) * 0.18;

        const maxCamX = Math.max(0, this.EXT_COLS * this.TILE - viewW);
        const targetCamX = Math.max(0, Math.min(maxCamX, this.player.x * this.TILE - viewW / 2));
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

      // 1. Warm Timber Cutaway Diorama Void
      this.initCobblestonePattern();
      ctx.fillStyle = '#1f1712';
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

      if (this.woodFloorPattern) {
        ctx.fillStyle = this.woodFloorPattern;
        ctx.fillRect(rx, floorTop - 30, rw, rh);
      } else {
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
      const cntY = 4.78 * S;
      const cntW = 3.65 * S; // 233.6 px
      const cntH = 54;
      const nearKeeper = this.nearInteractable?.id === 'shopkeeper';

      // Counter drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(cntX + 3, cntY + 8, cntW, cntH);

      // Carved Warm Wood Counter Base (#8b5e39) with thick pixel walnut ink (#29170a)
      ctx.fillStyle = '#8b5e39';
      ctx.strokeStyle = '#29170a';
      ctx.lineWidth = 2.4;
      ctx.fillRect(cntX, cntY, cntW, cntH);
      ctx.strokeRect(cntX, cntY, cntW, cntH);

      // Top Polished Wood Trim
      ctx.fillStyle = '#aa784e';
      ctx.fillRect(cntX - 3, cntY, cntW + 6, 20);
      ctx.strokeRect(cntX - 3, cntY, cntW + 6, 20);

      // Recessed Front Wood Panels
      ctx.fillStyle = '#704929';
      ctx.fillRect(cntX + 10, cntY + 24, 98, 22);
      ctx.strokeRect(cntX + 10, cntY + 24, 98, 22);
      ctx.fillRect(cntX + 120, cntY + 24, 102, 22);
      ctx.strokeRect(cntX + 120, cntY + 24, 102, 22);

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

      const oakhavenTurnX = 14.25 * S;
      const oakhavenTurnW = 1.10 * S;
      const oakhavenRoad1W = (oakhavenTurnX + oakhavenTurnW);

      // Warm Ochre Packed-Dirt Path Surface (Upper, Lower, Connectors)
      ctx.fillStyle = this.cobblePattern || '#b98a52';
      ctx.fillRect(0, road1Y, oakhavenRoad1W, road1H);
      ctx.fillRect(oakhavenTurnX, 0, oakhavenTurnW, road1Y + road1H);
      ctx.fillRect(0, road3Y, EXT_W, road3H);
      ctx.fillRect(south1X, road1Y, south1W, fullConnH);
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
        { x: 0, w: south1X },
        { x: south1X + south1W, w: south2X - (south1X + south1W) },
        { x: south2X + south2W, w: W - (south2X + south2W) }
      ].forEach(c => drawStoneCurbH(c.x, road2Y + road2H, c.w, 'top'));

      // Southern Avenue Top Curbs
      [
        { x: 0, w: 1.71 * S },
        { x: 2.21 * S, w: south1X - 2.21 * S },
        { x: south1X + south1W, w: (7.35 * S) - (south1X + south1W) },
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
        { x: south1X - 6, side: 'right' },
        { x: south1X + south1W, side: 'left' },
        { x: south2X - 6, side: 'right' },
        { x: south2X + south2W, side: 'left' }
      ].forEach(({ x: vx, side }) => {
        drawStoneCurbV(vx, road1Y + road1H, connMidH, side);
        drawStoneCurbV(vx, road2Y + road2H, connSouthH, side);
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
      drawWoodFence(0.35 * S, 3.84 * S, 1.15 * S);
      drawWoodFence(2.35 * S, 3.84 * S, 1.9 * S);
      drawWoodFence(10.5 * S, 3.84 * S, 1.9 * S);
      drawWoodFence(0.35 * S, 9.16 * S, 1.15 * S);
      drawWoodFence(2.35 * S, 9.16 * S, 1.9 * S);
      drawWoodFence(0.35 * S, 14.38 * S, 1.15 * S);
      drawWoodFence(2.35 * S, 14.38 * S, 1.9 * S);
      drawWoodFence(8.05 * S, 14.38 * S, 1.75 * S);
      drawWoodFence(13.15 * S, 14.38 * S, 1.85 * S);

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

      // Trees in North Block (framing cottages; shifted away from Oakhaven Lane north road extension)
      drawLushBushCluster(6.0 * S, 0.9 * S, 24, true);
      drawLushBushCluster(6.0 * S, 2.0 * S, 22, false);
      drawLushBushCluster(6.0 * S, 3.0 * S, 20, false);
      drawLushBushCluster(0.45 * S, 0.9 * S, 23, false);
      drawLushBushCluster(0.55 * S, 2.2 * S, 22, true);
      drawLushBushCluster(11.8 * S, 0.9 * S, 24, false);
      drawLushBushCluster(12.3 * S, 2.3 * S, 22, true);
      drawLushBushCluster(13.1 * S, 3.2 * S, 20, false);

      // Trees in Middle Block (framing Pluto's House; kept clear of Pluto's mailbox label)
      drawLushBushCluster(0.45 * S, 6.2 * S, 22, false);
      drawLushBushCluster(0.50 * S, 8.2 * S, 22, true);
      drawLushBushCluster(2.2 * S, 5.55 * S, 18, false);
      drawLushBushCluster(3.8 * S, 5.55 * S, 18, true);
      drawLushBushCluster(4.9 * S, 6.4 * S, 22, false);
      drawLushBushCluster(4.95 * S, 7.28 * S, 19, false);

      // Trees in South Block (framing Nova, Silas, and Maya's houses)
      drawLushBushCluster(0.45 * S, 11.5 * S, 24, false);
      drawLushBushCluster(0.50 * S, 13.5 * S, 23, true);
      drawLushBushCluster(2.2 * S, 10.8 * S, 18, false);
      drawLushBushCluster(3.8 * S, 10.8 * S, 18, true);
      drawLushBushCluster(4.9 * S, 12.2 * S, 20, false);
      drawLushBushCluster(10.2 * S, 12.5 * S, 20, true);
      drawLushBushCluster(15.2 * S, 11.5 * S, 24, false);
      drawLushBushCluster(15.2 * S, 13.5 * S, 23, true);

      // Deep Southern Forest Border below Cobblestone Way (extending across full neighborhood width)
      drawLushBushCluster(1.5 * S, 16.7 * S, 26, false);
      drawLushBushCluster(4.5 * S, 16.8 * S, 24, true);
      drawLushBushCluster(7.5 * S, 16.8 * S, 26, false);
      drawLushBushCluster(10.8 * S, 16.7 * S, 24, true);
      drawLushBushCluster(13.8 * S, 16.8 * S, 26, false);
      drawLushBushCluster(17.2 * S, 16.8 * S, 26, false);
      drawLushBushCluster(20.5 * S, 16.7 * S, 26, true);
      drawLushBushCluster(23.8 * S, 16.8 * S, 26, false);

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

      // Suspended Timber Welcome Banner Sign above North Gate Pillar (clear of PARK signpost)
      const archSignX = parkStartX + 4;
      const archSignY = gateTopY - 46;
      ctx.fillStyle = '#20140c';
      ctx.fillRect(archSignX - 2, archSignY - 12, 160, 22);
      ctx.fillStyle = '#6c4424';
      ctx.fillRect(archSignX, archSignY - 10, 156, 18);
      ctx.fillStyle = '#c8964c';
      ctx.fillRect(archSignX + 2, archSignY - 8, 152, 2);
      ctx.font = 'bold 9.5px Inter, sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('OAKHAVEN CENTRAL PARK', archSignX + 78, archSignY + 3);

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
      // NORTH CENTRAL PARK LAWN & SHADE TREES
      // -----------------------------------------------------------------------
      drawLushBushCluster(21.8 * S, 2.8 * S, 24, false);
      drawLushBushCluster(23.6 * S, 2.2 * S, 26, true);
      drawLushBushCluster(25.0 * S, 3.2 * S, 22, false);

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
      drawLushBushCluster(18.0 * S, 1.2 * S, 26, false);
      drawLushBushCluster(19.8 * S, 0.8 * S, 24, true);
      drawLushBushCluster(25.2 * S, 1.2 * S, 26, false);
      drawLushBushCluster(25.5 * S, 5.8 * S, 26, true);
      drawLushBushCluster(25.4 * S, 8.5 * S, 25, false);
      drawLushBushCluster(25.5 * S, 11.8 * S, 26, true);
      drawLushBushCluster(25.2 * S, 13.5 * S, 24, false);
      drawLushBushCluster(18.0 * S, 13.8 * S, 24, false);
      drawLushBushCluster(21.5 * S, 13.8 * S, 24, true);
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

      ctx.imageSmoothingEnabled = false;
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
        const zoom = this.EXT_ZOOM || 1.28;
        ctx.scale(zoom, zoom);
        ctx.translate(-Math.round(this.cameraX || 0), -Math.round(this.cameraY || 0));
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
