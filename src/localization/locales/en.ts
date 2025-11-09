/**
 * English Localization
 *
 * Contains all game text strings in English.
 * Used as the default/fallback language for Looters Land.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
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
  // ERRORS & WARNINGS
  // ============================================================================
  errors: {
    generic: 'An error occurred',
    notFound: 'Not found',
    invalidAction: 'Invalid action',
    cooldownActive: 'Skill is on cooldown',
    notEnoughResources: 'Not enough resources',
    targetInvalid: 'Invalid target',
  },
} as const;

// Extract the structure type (not literal strings)
type LocaleStructure<T> = T extends object
  ? {
      [P in keyof T]: T[P] extends string ? string : LocaleStructure<T[P]>;
    }
  : T;

export type LocaleKeys = LocaleStructure<typeof en>;
