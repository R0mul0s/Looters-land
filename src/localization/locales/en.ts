/**
 * English Localization
 *
 * Contains all game text strings in English.
 * Used as the default/fallback language for Looters Land.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-12
 */

export const en = {
  // ============================================================================
  // APP HEADER
  // ============================================================================
  app: {
    title: 'Looters Land',
    subtitle: 'Idle RPG Adventure - Loot, Fight, Conquer!',
  },

  // ============================================================================
  // COMMON UI ELEMENTS
  // ============================================================================
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    information: 'Information',
  },

  // ============================================================================
  // HERO CLASSES
  // ============================================================================
  heroClasses: {
    warrior: 'Warrior',
    archer: 'Archer',
    mage: 'Mage',
    cleric: 'Cleric',
    paladin: 'Paladin',
  },

  // ============================================================================
  // HERO STATS
  // ============================================================================
  stats: {
    hp: 'HP',
    maxHP: 'Max HP',
    atk: 'ATK',
    def: 'DEF',
    spd: 'SPD',
    crit: 'CRIT',
    level: 'Level',
  },

  // ============================================================================
  // EQUIPMENT SLOTS
  // ============================================================================
  equipmentSlots: {
    helmet: 'Helmet',
    chest: 'Chest Armor',
    legs: 'Leg Armor',
    boots: 'Boots',
    weapon: 'Weapon',
    shield: 'Shield',
  },

  // ============================================================================
  // ITEM RARITIES
  // ============================================================================
  rarities: {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  },

  // ============================================================================
  // COMBAT SYSTEM
  // ============================================================================
  combat: {
    // Combat modes
    modeAuto: 'Auto Combat',
    modeManual: 'Manual Combat',

    // Combat status
    victory: '🎉 VICTORY! Heroes win! 🎉',
    defeat: '💀 DEFEAT! Heroes have fallen... 💀',
    allHeroesDead: 'All your heroes have been defeated in battle!',

    // Turn info
    turnCounter: 'Turn',

    // Combat log
    combatInitialized: 'Combat initialized!',
    heroes: 'Heroes',
    enemies: 'Enemies',

    // Actions
    attacks: '{attacker} attacks {target} for {damage} damage',
    critical: 'CRIT!',
    defeated: '{name} has been defeated!',

    // Skills
    usesSkill: '{attacker} uses {skill} on {target}',
    usesSkillAoE: '{attacker} uses {skill} on all targets!',
    takeDamage: '{target} takes {damage} damage',
    healsFor: '{target} heals for {amount} HP',

    // Buttons
    startCombat: 'Start Combat',
    nextTurn: 'Next Turn',
    attack: 'Attack',
    useSkill: 'Use Skill',

    // Status
    waitingForInput: 'Waiting for your action...',
    selectTarget: 'Select a target',
  },

  // ============================================================================
  // SKILLS
  // ============================================================================
  skills: {
    // Warrior
    heavySlash: {
      name: 'Heavy Slash',
      description: 'Deal 150% ATK damage to single target',
    },
    shieldBash: {
      name: 'Shield Bash',
      description: 'Deal 80% ATK damage and stun for 1 turn',
    },
    battleCry: {
      name: 'Battle Cry',
      description: 'Increase team ATK by 30% for 3 turns',
    },

    // Archer
    preciseShot: {
      name: 'Precise Shot',
      description: 'Deal 180% ATK damage with guaranteed crit',
    },
    multiShot: {
      name: 'Multi-Shot',
      description: 'Deal 80% ATK damage to all enemies',
    },
    evasion: {
      name: 'Evasion',
      description: 'Increase SPD by 50% for 2 turns',
    },

    // Mage
    fireball: {
      name: 'Fireball',
      description: 'Deal 200% ATK magic damage to single target',
    },
    chainLightning: {
      name: 'Chain Lightning',
      description: 'Deal 120% ATK damage to all enemies',
    },
    manaShield: {
      name: 'Mana Shield',
      description: 'Reduce incoming damage by 40% for 3 turns',
    },

    // Cleric
    heal: {
      name: 'Heal',
      description: 'Restore 100 HP to single ally',
    },
    groupHeal: {
      name: 'Group Heal',
      description: 'Restore 60 HP to all allies',
    },
    holySmite: {
      name: 'Holy Smite',
      description: 'Deal 100% ATK holy damage',
    },

    // Paladin
    smite: {
      name: 'Smite',
      description: 'Deal 130% ATK damage and heal self for 30% damage dealt',
    },
    divineShield: {
      name: 'Divine Shield',
      description: 'Become immune to damage for 1 turn',
    },
    blessing: {
      name: 'Blessing',
      description: 'Increase ally DEF by 40% for 3 turns',
    },
  },

  // ============================================================================
  // ENEMIES
  // ============================================================================
  enemies: {
    types: {
      normal: 'Normal',
      elite: 'Elite',
      boss: 'Boss',
    },
    names: {
      goblin: 'Goblin',
      orc: 'Orc',
      skeleton: 'Skeleton',
      spider: 'Spider',
      wolf: 'Wolf',
      bandit: 'Bandit',
      darkKnight: 'Dark Knight',
      zombie: 'Zombie',
      imp: 'Imp',
      slime: 'Slime',
    },
  },

  // ============================================================================
  // STATUS EFFECTS
  // ============================================================================
  statusEffects: {
    stunned: 'Stunned!',
    atkBuff: '+30% ATK for 3 turns',
    spdBuff: '+50% SPD for 2 turns',
    defBuff: '+40% DEF for 3 turns',
    damageReduction: '-40% damage taken for 3 turns',
    immunity: 'Immune to damage for 1 turn',
  },

  // ============================================================================
  // INVENTORY & EQUIPMENT
  // ============================================================================
  inventory: {
    title: 'Inventory',
    empty: 'No items in inventory',
    filter: 'Filter',
    sort: 'Sort',
    equip: 'Equip',
    unequip: 'Unequip',
    discard: 'Discard',
    enchant: 'Enchant',
    autoEquip: {
      skippedItems: 'Some items could not be equipped:',
      requiresLevel: 'Requires hero level'
    },
    slots: {
      helmet: 'Helmet',
      weapon: 'Weapon',
      chest: 'Chest',
      gloves: 'Gloves',
      legs: 'Legs',
      boots: 'Boots',
      accessory: 'Accessory',
      all: 'All'
    },
    rarity: {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
      mythic: 'Mythic'
    }
  },

  equipment: {
    levelRequirement: 'Cannot equip {{itemName}} - requires hero level {{requiredLevel}} (current: {{currentLevel}})'
  },

  // ============================================================================
  // DUNGEON SYSTEM
  // ============================================================================
  dungeon: {
    // Room descriptions
    enemies: 'Enemies',
    eliteEnemies: 'Elite Enemies',
    gold: 'Gold',
    items: 'Items',
    guaranteedRewards: 'Guaranteed Rewards',

    // Room encounters
    bossEncounter: 'BOSS ENCOUNTER!',
    eliteCombat: 'ELITE COMBAT!',
    miniBossEncounter: 'MINI-BOSS ENCOUNTER!',

    // Trap system
    damageReport: 'Damage Report',

    // Loot rewards
    lootRewards: 'Loot Rewards',
    collectInstructions: 'Collect or sell items, then continue exploring the dungeon',

    // Loot confirmation dialog
    lootWarningTitle: 'Warning: You have uncollected items!',
    lootWarningMessage: 'If you continue exploring now, these items will be lost forever.\n\nAre you sure you want to continue without collecting all loot?',

    // Exit room dialog
    exitRoomTitle: 'You have reached the exit!',
    exitRoomMessage: 'Click OK to proceed to the next floor.\nClick Cancel to leave the dungeon (you will keep all loot).',

    // Dungeon defeat screen
    defeat: {
      title: 'Defeat',
      message: 'Your party has been defeated!',
      allHeroesFallen: 'All heroes have fallen in battle',
      reviveMessage: 'You can revive your heroes at the Healer in town',
      returnButton: 'Return to Worldmap',
    },

    // Dungeon victory screen
    victory: {
      title: 'Victory!',
      goldReward: 'Gold Earned',
      itemsReward: 'Items Found',
      instruction: 'Click items to add to inventory or sell for gold',
      collectAll: 'Collect All',
      sellAll: 'Sell All',
      allCollected: 'All loot collected!',
      continueExploring: 'Continue Exploring',
      uncollectedWarning: 'You have uncollected items. Collect or sell them before continuing.',
    },
  },

  // ============================================================================
  // WORLDMAP SYSTEM
  // ============================================================================
  worldmap: {
    notEnoughEnergy: 'Not enough energy',
    notEnoughEnergyDungeon: 'Not enough energy to enter this dungeon',
    dungeonIntegration: 'Dungeon integration complete',
    loading: 'Loading...',
    error: 'Error loading worldmap',
    position: 'Position',
    energy: 'Energy',
    gold: 'Gold',
    dailyRank: 'Daily Rank',
    inventory: 'Inventory',
    storedGold: 'Stored Gold',
    energyRegen: 'Energy regenerates over time',
    todo: 'TODO',

    // Unexplored area warning
    unexploredTitle: 'Unexplored Territory',
    unexploredMessage: 'This area is shrouded in darkness. You cannot travel to unexplored territories!',
    unexploredTip: 'Explore nearby areas first to reveal more of the map. Movement is restricted to discovered tiles only.',

    // Teleport system
    teleportTitle: 'Teleport',
    teleportCost: 'Teleport Cost',
    teleportEnergy: 'Energy',
    availableEnergy: 'Available Energy',
    discoveredLocations: 'Discovered Locations',
    allLocations: 'All',
    towns: 'Towns',
    dungeons: 'Dungeons',
    noLocationsTitle: 'No Locations Discovered',
    noLocationsMessage: 'Explore the world map to discover towns and dungeons that you can teleport to!',
    teleportButton: 'Teleport',
    notEnoughEnergyButton: 'Not Enough Energy',
    town: 'Town',
    dungeon: 'Dungeon',

    // Tooltip info
    terrain: 'Terrain',
    distance: 'Distance',
    cost: 'Cost',
    tiles: 'tiles',

    // Worldmap object messages
    treasureChestAlreadyOpened: 'This treasure chest has already been opened!',
    hiddenPathAlreadyDiscovered: 'This hidden path has already been discovered!',
    hiddenPathLevelRequired: 'This hidden path requires level {{requiredLevel}}!\nYour level: {{playerLevel}}',
    portalNotConnected: 'This portal is not connected to anything!',
    portalNotFound: 'The linked portal could not be found!',
    rareSpawnDefeated: 'This rare enemy has already been defeated!',
    monsterDefeated: 'This monster has already been defeated!\nIt will respawn later.',
    notEnoughGold: 'Not enough gold!\nRequired: {{required}}\nCurrent: {{current}}',
    merchantSoldOut: 'The merchant has sold all their items!',
    randomEventComingSoon: 'Random Event: {{eventType}}\nFeature coming soon!',
    itemSold: '✅ Sold {{itemName}} for {{gold}} gold!',
  },

  // ============================================================================
  // SAVE GAME SYSTEM
  // ============================================================================
  saveGame: {
    notConfigured: 'Supabase is not configured',
    saveFailed: 'Failed to save game',
    heroSaveFailed: 'Failed to save heroes',
    equipmentSaveFailed: 'Failed to save equipment',
    inventorySaveFailed: 'Failed to save inventory',
    saveSuccess: 'Game saved successfully',
    loadNotFound: 'Save file not found',
    loadHeroesFailed: 'Failed to load heroes',
    loadEquipmentFailed: 'Failed to load equipment',
    loadInventoryFailed: 'Failed to load inventory',
    loadSuccess: 'Game loaded successfully',
    listFailed: 'Failed to list saves',
    deleteFailed: 'Failed to delete save',
    deleteSuccess: 'Save deleted successfully',
  },

  // Router section
  router: {
    backToMainGame: '← Back to Main Game',
    testUI: '🧪 Test UI',
    defeatAlert: '💀 DEFEAT! All heroes have fallen...\n\nYou will be returned to the world map.',
    uncollectedItemsWarning: '⚠️ Uncollected Items!\n\nYou have {{count}} uncollected items. Are you sure you want to leave them behind?',
    combatVictory: '🎉 VICTORY! 🎉',
    combatDefeat: '💀 DEFEAT 💀',
    combatTurn: '⚔️ COMBAT - TURN {{turn}}',
    allHeroesFallen: '💀 All Heroes Have Fallen',
    defeatMessage: 'Your party has been defeated. Heroes will be revived when you return to town.',
    returnToWorldMap: '🏠 Return to World Map',
    lootRewards: '💰 Loot Rewards',
    lootInstruction: '💡 Click on items to view details or use "Sell All" / "Collect All" buttons below',
    goldAmount: '{{amount}} Gold',
    itemsCount: '{{count}} Items',
    collectAll: '📦 Collect All',
    sellAll: '💰 Sell All',
    allLootCollected: '✅ All loot collected!',
    continueExploring: '🗺️ Continue Exploring',
    heroes: '🛡️ Heroes',
    enemies: '👹 Enemies',
    combatLog: '📜 Combat Log',
  },

  // ============================================================================
  // COMMON UI
  // ============================================================================
  ui: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    load: 'Load',
    delete: 'Delete',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    yes: 'Yes',
    no: 'No',
  },

  // ============================================================================
  // SIDEBAR NAVIGATION
  // ============================================================================
  sidebar: {
    worldMap: 'World Map',
    heroes: 'Heroes',
    inventory: 'Inventory',
    teleport: 'Teleport',
    leaderboards: 'Leaderboards',
    quests: 'Quests',
    guild: 'Guild',
    lastUpdates: 'Last Updates',
    combatPower: 'Combat Power',
  },

  // ============================================================================
  // RESOURCES
  // ============================================================================
  resources: {
    gems: 'Gems',
  },

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    loginButton: 'Login',
    registerButton: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loading: 'Loading...',

    // Validation
    fillAllFields: 'Please fill in all fields',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsDoNotMatch: 'Passwords do not match',

    // Success messages
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful! Please check your email.',
    logoutSuccess: 'Logged out successfully',

    // Error messages
    loginFailed: 'Login failed',
    registerFailed: 'Registration failed',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyExists: 'Email already registered',
  },

  // ============================================================================
  // TOWN SYSTEM
  // ============================================================================
  town: {
    // Building names
    tavern: 'Tavern',
    smithy: 'Smithy',
    healer: 'Healer',
    market: 'Market',
    bank: 'Bank',
    guild: 'Guild Hall',

    // Building descriptions
    tavernDesc: 'Recruit heroes and summon new adventurers',
    smithyDesc: 'Enchant equipment and repair items',
    healerDesc: 'Restore HP for your heroes',
    marketDesc: 'Buy and sell items and resources',
    bankDesc: 'Store gold and earn interest',
    guildDesc: 'Manage guild and social features',

    // Common
    locked: 'Locked',
    comingSoon: 'Coming Soon',
    yourHeroes: 'Your Heroes',
    heroRoster: 'Hero Roster',
    activeParty: 'Active Party',

    // Tavern - Gacha System
    summonHeroes: 'Summon Heroes',
    collection: 'Collection',
    partyManager: 'Party Manager',
    heroSummon: 'Hero Summon',
    heroCollection: 'Hero Collection',
    heroCount: 'You currently have {count} heroes in your collection.',

    // Gacha summon
    dropRates: 'Drop Rates',
    freeDailySummon: 'Free Daily Summon',
    availableNow: 'Available Now!',
    comeBackTomorrow: 'Come back tomorrow',
    singleSummon: 'Single Summon',
    tenSummon: '10x Summon',
    discount: '{percent}% OFF!',
    guaranteedRare: 'Guaranteed Rare+',
    notEnoughGoldSummon: 'Not enough gold',
    heroSummoned: 'Hero Summoned!',
    heroesSummoned: 'Heroes Summoned!',
    summoning: 'Summoning...',

    // Pity system
    pitySystem: 'Pity System',
    pityCounter: 'Pity: {current}/{max}',
    pityInfo1: 'Guaranteed {rarity} hero after {count} summons without Epic or Legendary',
    pityInfo2: 'Current pity counter: {current}/{max}',
    pityInfo3: '10x summon guarantees at least 1 Rare or better hero',
    pityInfo4: 'Free daily summon resets at midnight',

    // Hero roles
    tank: 'Tank',
    dps: 'DPS',
    support: 'Support',

    // Hero collection
    totalHeroes: 'Total Heroes: {count}',
    activePartyCount: 'Active Party: {current}/{max}',
    filterRarity: 'Rarity',
    filterClass: 'Class',
    sortBy: 'Sort by',
    sortLevel: 'Level',
    sortRarity: 'Rarity',
    sortName: 'Name',
    sortClass: 'Class',
    allRarities: 'All',
    allClasses: 'All',
    noHeroesFound: 'No Heroes Found',
    adjustFilters: 'Try adjusting your filters or summon more heroes!',
    specialAbility: 'Special Ability',
    description: 'Description',
    statistics: 'Statistics',

    // Party manager
    maxPartySize: 'Maximum party size: {size} heroes',
    selectSlotFirst: 'Please select a party slot first',
    heroAlreadyInParty: 'This hero is already in the party',
    heroAddedToParty: '{name} added to party!',
    heroRemovedFromParty: 'Hero removed from party',
    clickSlotToSelect: 'Click on a party slot to select it',
    clickHeroToAdd: 'Then click on an available hero to add them to that slot',
    buildBalancedParty: 'Build a balanced party with tanks, DPS, healers, and support',
    emptySlot: 'Empty Slot',
    slot: 'Slot {number}',
    availableHeroes: 'Available Heroes ({count})',
    allHeroesInParty: 'All heroes are in the active party!',
    selectHeroForSlot: 'Select hero for Slot {number}',
    partyStatistics: 'Party Statistics',
    totalHP: 'Total HP',
    totalATK: 'Total ATK',
    totalDEF: 'Total DEF',
    avgLevel: 'Avg Level',
    individualHealing: 'Individual Healing',
    remove: 'Remove',

    // Talent System
    talentPoints: 'Talent Points',
    talentPointsAvailable: 'Talent Points Available',
    talentPointsCount: '{count} Talent Points',
    duplicateHeroObtained: 'Duplicate hero! +1 Talent Point',
    talentTree: 'Talent Tree',
    talentTreeComingSoon: 'Talent Tree - Coming Soon',
    talentTreeDescription: 'Use talent points to unlock powerful abilities and passive bonuses',
    noTalentPoints: 'No talent points available',
    unlockTalent: 'Unlock Talent',
    talentLocked: 'Locked',

    // Healer
    healSingleCost: 'Heal - {cost}g',
    healPartyCost: 'Heal Entire Party - Cost: {cost}g',
    alreadyFullHP: '{name} is already at full HP!',
    healedSuccessfully: '{name} fully healed!',
    partyHealedSuccessfully: 'All heroes fully healed!',
    notEnoughGold: 'Not enough gold!',

    // Smithy
    enchantingService: 'Enchanting Service',
    selectItemToEnchant: 'Select an item from your equipment to enchant',
    currentLevel: 'Current Level: +{level}',
    nextLevel: 'Next Level: +{level}',
    successRate: 'Success Rate: {rate}%',
    enchantCost: 'Cost: {cost}g',
    enchantItem: 'Enchant Item',
    enchantWarning: 'Warning: Enchanting can fail! Gold is spent regardless of success.',
    enchantSuccessMessage: 'Success! Item enchanted to +{level}',
    enchantFailMessage: 'Enchanting failed! Item remains at +{level}',
    maxEnchantLevel: 'Item is already at max enchant level (+10)!',
    noEquipment: 'You have no equipment to enchant!',

    // Market (placeholder)
    marketComingSoon: 'Market Coming Soon in v0.9.0!',
    marketDescription: 'The market system will be available soon',
    marketFeature1: 'Buy items, equipment, and resources',
    marketFeature2: 'Sell your loot for gold',
    marketFeature3: 'Daily rotating stock',
    marketFeature4: 'Special merchant deals',

    // Bank (placeholder)
    bankComingSoon: 'Bank Coming Soon in v0.9.0!',
    bankDescription: 'The banking system will be available soon',
    bankFeature1: 'Store gold safely',
    bankFeature2: 'Earn daily interest on deposits',
    bankFeature3: 'Withdraw anytime with small fee',
    bankFeature4: 'Unlock larger storage with upgrades',

    // Guild (placeholder)
    guildComingSoon: 'Guild Hall Coming Soon in v1.2.0!',
    guildDescription: 'The guild system will be available soon',
    guildFeature1: 'Join or create guilds with friends',
    guildFeature2: 'Guild-wide buffs and perks',
    guildFeature3: 'Guild wars and territory control',
    guildFeature4: 'Shared guild storage',
  },

  // ============================================================================
  // CHAT SYSTEM
  // ============================================================================
  chat: {
    placeholder: 'Type a message...',
    send: 'Send',
    enterToSend: 'Press Enter to send',
    escapeToCancel: 'Press Escape to cancel',
  },

  // ============================================================================
  // HERO COLLECTION SCREEN
  // ============================================================================
  heroCollection: {
    title: 'Hero Collection',
    stats: {
      totalHeroes: 'Total Heroes:',
      activeParty: 'Active Party:',
      partySlots: '/4',
      hp: 'HP:',
      atk: 'ATK:',
      def: 'DEF:',
      score: 'Score:',
    },
    filters: {
      rarity: 'Rarity:',
      class: 'Class:',
      sortBy: 'Sort by:',
      all: 'All',
    },
    rarities: {
      legendary: 'Legendary',
      epic: 'Epic',
      rare: 'Rare',
      common: 'Common',
    },
    classes: {
      warrior: 'Warrior',
      archer: 'Archer',
      mage: 'Mage',
      cleric: 'Cleric',
      paladin: 'Paladin',
    },
    sortOptions: {
      level: 'Level',
      rarity: 'Rarity',
      name: 'Name',
      class: 'Class',
    },
    badges: {
      activeParty: 'Active Party',
    },
    labels: {
      level: 'Level',
    },
    empty: {
      title: 'No Heroes Found',
      message: 'Try adjusting your filters or summon more heroes!',
    },
    details: {
      class: 'Class:',
      role: 'Role:',
      level: 'Level:',
      xp: 'XP:',
      statisticsTitle: 'Statistics',
      description: 'Description',
      specialAbility: 'Special Ability',
    },
    detailStats: {
      hp: 'HP',
      attack: 'Attack',
      defense: 'Defense',
      speed: 'Speed',
      heroScore: 'Hero Score',
    },
    talent: {
      title: 'Talent Points',
      pointsAvailable: 'Points Available',
      description: 'This hero was summoned multiple times! Talent points can be used in the Talent Tree (Coming Soon).',
    },
  },

  // ============================================================================
  // INVENTORY SCREEN
  // ============================================================================
  inventoryScreen: {
    loading: 'Loading heroes...',
    selectHero: 'Select Hero',
    levelFormat: '(Lv.',
    labels: {
      level: 'Level',
      xp: 'XP',
    },
    equipment: {
      title: 'Equipment',
      empty: 'Empty',
      setBonuses: 'Set Bonuses',
      noSetBonuses: 'No active set bonuses',
      stats: {
        hp: 'HP:',
        atk: 'ATK:',
        def: 'DEF:',
        spd: 'SPD:',
        crit: 'CRIT:',
        power: 'Power:',
      },
      buttons: {
        autoEquipBest: 'Auto-Equip Best',
      },
      warnings: {
        enchantingTownOnly: '⚠️ Enchanting is only available in town (visit the Smithy)!',
      },
      tooltip: {
        hp: 'HP:',
        atk: 'ATK:',
        def: 'DEF:',
        spd: 'SPD:',
        crit: 'CRIT:',
        value: '💰 Value: {{value}} gold',
        clickInstructions: 'Left-click to equip | Right-click to enchant',
      },
    },
    inventoryPanel: {
      title: 'Inventory',
      slots: 'Slots:',
      gold: 'Gold:',
      emptyTitle: 'Inventory is empty',
      emptyMessage: 'No items available',
      buttons: {
        expand: 'Expand (+10 slots, 500g)',
        autoSellCommon: 'Auto-Sell Common',
      },
    },
  },

  // ============================================================================
  // LEADERBOARD SCREEN
  // ============================================================================
  leaderboard: {
    title: 'Daily Leaderboards',
    resetIcon: '⏰',
    resetLabel: 'Resets in:',
    categories: {
      deepestFloor: 'Deepest Floor',
      totalGold: 'Total Gold',
      heroesCollected: 'Heroes Collected',
      combatPower: 'Combat Power',
    },
    categoryDescriptions: {
      deepestFloor: 'Deepest dungeon floor reached today',
      totalGold: 'Total gold earned today',
      heroesCollected: 'Number of unique heroes owned',
      combatPower: 'Combined party combat power',
    },
    noRank: {
      message: "You haven't earned a rank in this category yet today.",
      hint: 'Start playing to appear on the leaderboard!',
    },
    loading: 'Loading leaderboard...',
    empty: {
      message: 'No entries yet today',
      hint: 'Be the first to appear on the leaderboard!',
    },
    youBadge: 'YOU',
    labels: {
      level: 'Level',
    },
    anonymous: 'Anonymous',
  },

  // ============================================================================
  // ERRORS & WARNINGS
  // ============================================================================
  errors: {
    generic: 'An error occurred',
    notFound: 'Not found',
    invalidAction: 'Invalid action',
    cooldownActive: 'Skill is on cooldown',
    notEnoughResources: 'Not enough resources',
    targetInvalid: 'Invalid target',
    notLoggedIn: 'Not logged in',
    avatarUpdateFailed: 'Failed to update avatar',
  },

  // ============================================================================
  // PROFILE SCREEN
  // ============================================================================
  profile: {
    title: 'Profile & Settings',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?',
    nameLabel: 'Name:',
    emailLabel: 'Email:',
    levelLabel: 'Level:',
    goldLabel: 'Gold:',
    gemsLabel: 'Gems:',
    energyLabel: 'Energy:',
    experienceLabel: 'Experience:',
    editName: 'Edit name',
    nameEmpty: 'Name cannot be empty',
    notLoggedIn: 'You are not logged in',
    saveNameFailed: 'Failed to save name',
    saveNameError: 'An error occurred while saving name',
    saving: 'Saving...',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    enterNewName: 'Enter new name',
    resetProgress: 'Reset Progress',
    resetProgressConfirm: 'WARNING: This will delete ALL game data!\n\nOnly your account and email will remain.\n\nThis action is IRREVERSIBLE!\n\nDo you really want to continue?',
    resetProgressSuccess: '✅ Progress successfully reset! You will be logged out...',
    resetProgressFailed: 'Failed to reset progress',
    deleteAccount: 'Delete Account',
    deleteAccountConfirm: 'WARNING: This will PERMANENTLY DELETE your account!\n\nALL data will be lost forever.\n\nThis action is IRREVERSIBLE!\n\nDo you really want to continue?',
    deleteAccountSuccess: '❌ Account successfully deleted. You will be logged out...',
    deleteAccountFailed: 'Failed to delete account',
    languageSettings: 'Language Settings',
    languageLabel: 'Language',

    // Avatar section
    avatarSectionTitle: 'Avatar Selection',
    avatarSelectedBadge: 'Selected',
    avatarSaving: 'Saving...',

    // Dangerous Actions section
    dangerousActions: 'Dangerous Actions',
    resetProgressTitle: 'Reset Progress (DEBUG)',
    resetProgressDesc: 'Deletes all heroes, items, and progress. Account remains active.',
    resetProgressButton: 'Reset Progress',
    resetProgressConfirm1: 'Do you really want to delete all progress?',
    resetProgressConfirm2Warning: 'This action is IRREVERSIBLE! You will lose:',
    resetProgressConfirm2Heroes: 'heroes',
    resetProgressConfirm2Items: 'items',
    resetProgressConfirm2AllProgress: 'All progress and gold',
    resetProgressConfirm2Question: 'Continue?',
    resetProgressConfirm3: 'LAST WARNING!\nThis CANNOT be undone. Really delete everything?',
    deleteAccountTitle: 'Delete Account',
    deleteAccountDesc: 'Permanently deletes your account and ALL data. This action CANNOT be undone!',
    deleteAccountButton: 'Delete Account',
    deleteAccountConfirm1: 'Do you really want to PERMANENTLY delete your account?',
    deleteAccountConfirm2Warning: 'LAST WARNING!',
    deleteAccountConfirm2Text: 'Your account ({email}) will be PERMANENTLY DELETED.\nYou will lose access FOREVER. Continue?',
    deleteAccountConfirm3: 'REALLY THE LAST CHANCE!\nThis CANNOT be undone. Delete account FOREVER?',
    resetError: 'An error occurred while resetting progress',
    deleteError: 'An error occurred while deleting account',
    processing: 'Processing...',
    yesReset: 'Yes, reset',
    yesSure: 'Yes, I\'m sure',
    yesDeleteAll: 'YES, DELETE EVERYTHING',
    yesDeleteAccount: 'Yes, delete account',
    yesDeletePermanently: 'YES, DELETE PERMANENTLY',
    noCancel: 'No, cancel',
    noKeepAccount: 'No, keep account',
  },

  // ============================================================================
  // SYNC STATUS
  // ============================================================================
  sync: {
    saving: 'Saving...',
    saved: 'Saved',
    savedAt: 'Saved {{time}}',
    error: 'Save Error',
    connected: 'Connected',
    timeJustNow: 'just now',
    timeMinutesAgo: '{{minutes}}m ago',
    timeHoursAgo: '{{hours}}h ago',
  },

  // ============================================================================
  // LAST UPDATES / CHANGELOG
  // ============================================================================
  updates: {
    title: 'Last Updates',
    features: 'New Features',
    fixes: 'Fixes',
    gameplay: 'Gameplay',
    technical: 'Technical Changes',
    footer: 'More information at',
    github: 'GitHub',

    // Version 2.3.1
    v2_3_1: {
      features: {
        item1: '✅ Treasure Chests - Now fully functional! Open chests for gold and items',
        item2: '✅ Hidden Paths - Discover secret areas with level requirements and rare loot',
        item3: '✅ Portals - Teleport between linked portals with energy cost',
        item4: '✅ Rare Spawns - Fight powerful enemies with guaranteed rare/epic drops',
        item5: '✅ Wandering Monsters - Fast combat encounters on the worldmap',
        item6: '✅ Traveling Merchants - Shop interface with purchasable items',
        item7: '✅ Weather & Time Display - See current weather and time of day on map'
      },
      technical: {
        item1: 'LootGenerator - Added static methods for worldmap loot generation',
        item2: 'WorldMapDemo2 - All worldmap features now fully implemented'
      }
    },

    // Version 2.3.0
    v2_3_0: {
      features: {
        item1: '🌀 Portals - Fast travel between discovered portals (costs energy)',
        item2: '🗝️ Hidden Paths - Secret areas with rare loot in remote locations',
        item3: '📦 Treasure Chests - Random chests spawn on map with gold and items',
        item4: '👹 Rare Spawns - Powerful enemies with guaranteed rare/epic drops',
        item5: '🐺 Wandering Monsters - Clickable enemies on map for fast combat',
        item6: '🛒 Traveling Merchants - Random merchants with unique items',
        item7: '⭐ Random Events - Special events (rescue NPC, boss fight, treasure hunt)',
        item8: '🌦️ Weather System - Weather affects enemy spawn rates',
        item9: '🌙 Day/Night Cycle - Different enemies spawn at different times',
      },
      technical: {
        item1: 'Extended WorldMap types with 6 new static objects and 3 dynamic objects',
        item2: 'Added procedural generation for all new map features',
        item3: 'Implemented click handlers and rendering for new objects',
      },
    },

    // Version 2.2.0
    v2_2_0: {
      features: {
        item1: '🌍 Complete Czech localization for Heroes, Inventory, and Leaderboards',
        item2: '📝 101 hardcoded strings replaced with translation keys',
        item3: '🔧 Comprehensive JSDoc documentation added to all components',
      },
      fixes: {
        item1: '⚡ Fixed energy regeneration system - energy now properly regenerates',
      },
      technical: {
        item1: 'Added heroCollection, inventoryScreen, and leaderboard translation sections',
        item2: 'All localized components checked against coding_rules.md standards',
        item3: 'Updated @lastModified dates and added explicit TypeScript return types',
      },
    },

    // Version 2.1.0
    v2_1_0: {
      features: {
        item1: 'Added username editing in profile',
        item2: 'Added logout button in profile',
        item3: 'Added "Last Updates" section to main menu',
      },
      fixes: {
        item1: '🔥 Critical fix: Resolved issue with heroes disappearing when entering dungeons',
        item2: 'Fixed race condition in game data loading',
        item3: 'Heroes now properly persist across dungeons and combats',
        item4: 'Fixed auto-equip sorting to prioritize rarity over level and power score',
        item5: 'Added CASCADE DELETE for equipment_slots to prevent save conflicts',
        item6: 'Added level requirement check when manually equipping items',
        item7: 'Equipment level requirements now shown in modal dialogs instead of alerts',
        item8: 'Fixed daily world map reset - maps now properly regenerate at midnight UTC',
      },
      technical: {
        item1: 'Optimized loadGameData function',
        item2: 'Implemented proper lifecycle management for game state',
        item3: 'Added party_order column to database',
        item4: 'Added comprehensive debug logging for auto-equip system',
      },
    },

    // Version 2.0.0
    v2_0_0: {
      features: {
        item1: 'New main gameplay loop with World Map',
        item2: 'Dungeon exploration system',
        item3: 'Combat system with auto-battle mode',
        item4: 'Hero gacha system',
        item5: 'Equipment system',
        item6: 'Profile & settings screen',
      },
      gameplay: {
        item1: 'Procedurally generated dungeons',
        item2: 'Various enemy types (Easy, Normal, Hard, Elite)',
        item3: 'Loot system with gold and items',
        item4: 'Hero leveling and experience system',
        item5: 'Active party management (4 heroes)',
      },
      technical: {
        item1: 'Supabase integration for multiplayer',
        item2: 'Row Level Security (RLS) policies',
        item3: 'Real-time updates',
        item4: 'Cloud saves',
      },
    },

    // Version 2.3.2
    v2_3_2: {
      technical: {
        item1: 'Fixed all hardcoded Czech/English strings in ProfileScreen - replaced with t() localization',
        item2: 'Localized avatar display names with getAvatarDisplayName() function',
        item3: 'Added comprehensive JSDoc documentation to 6 helper functions in WorldMapViewer',
        item4: 'Implemented React.memo() for WorldMapViewer component performance optimization',
        item5: 'Added useMemo() to getHoverInfo calculation for better performance',
        item6: 'Added component-level JSDoc to ProfileScreen with full interface documentation',
        item7: 'Removed unused previewImage property from AVATAR_CONFIG',
        item8: 'Updated @lastModified dates to 2025-11-12 in all modified files',
      },
    },

    // Version 1.0.0
    v1_0_0: {
      features: {
        item1: 'Basic hero system',
        item2: 'Simple combat',
        item3: 'Local storage saves',
      },
    },
  },

  // ============================================================================
  // AVATARS
  // ============================================================================
  avatars: {
    hero1: 'Knight',
    hero2: 'Ranger',
    hero3: 'Mage',
    hero4: 'Shieldbearer',
    hero5: 'Bard',
  },
} as const;

// Extract the structure type (not literal strings)
type LocaleStructure<T> = T extends object
  ? {
      [P in keyof T]: T[P] extends string ? string : LocaleStructure<T[P]>;
    }
  : T;

export type LocaleKeys = LocaleStructure<typeof en>;
