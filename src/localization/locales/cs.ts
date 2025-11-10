/**
 * Czech Localization
 *
 * Contains all game text strings in Czech.
 * Czech translation for Looters Land.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

import type { LocaleKeys } from './en';

export const cs: LocaleKeys = {
  // ============================================================================
  // APP HEADER
  // ============================================================================
  app: {
    title: 'Looters Land',
    subtitle: 'Idle RPG Dobrodružství - Koř, Bojuj, Dobývej!',
  },

  // ============================================================================
  // HERO CLASSES
  // ============================================================================
  heroClasses: {
    warrior: 'Válečník',
    archer: 'Lučištník',
    mage: 'Mág',
    cleric: 'Klerik',
    paladin: 'Paladin',
  },

  // ============================================================================
  // HERO STATS
  // ============================================================================
  stats: {
    hp: 'Životy',
    maxHP: 'Max. Životy',
    atk: 'Útok',
    def: 'Obrana',
    spd: 'Rychlost',
    crit: 'Kritický Zásah',
    level: 'Úroveň',
  },

  // ============================================================================
  // EQUIPMENT SLOTS
  // ============================================================================
  equipmentSlots: {
    helmet: 'Helma',
    chest: 'Hrudní Zbroj',
    legs: 'Nohavice',
    boots: 'Boty',
    weapon: 'Zbraň',
    shield: 'Štít',
  },

  // ============================================================================
  // ITEM RARITIES
  // ============================================================================
  rarities: {
    common: 'Běžné',
    uncommon: 'Neobvyklé',
    rare: 'Vzácné',
    epic: 'Epické',
    legendary: 'Legendární',
  },

  // ============================================================================
  // COMBAT SYSTEM
  // ============================================================================
  combat: {
    // Combat modes
    modeAuto: 'Automatický Boj',
    modeManual: 'Manuální Boj',

    // Combat status
    victory: '🎉 VÍTĚZSTVÍ! Hrdinové zvítězili! 🎉',
    defeat: '💀 PORÁŽKA! Hrdinové padli... 💀',

    // Turn info
    turnCounter: 'Kolo',

    // Combat log
    combatInitialized: 'Boj zahájen!',
    heroes: 'Hrdinové',
    enemies: 'Nepřátelé',

    // Actions
    attacks: '{attacker} útočí na {target} za {damage} poškození',
    critical: 'KRITICKÝ ZÁSAH!',
    defeated: '{name} byl poražen!',

    // Skills
    usesSkill: '{attacker} použil {skill} na {target}',
    usesSkillAoE: '{attacker} použil {skill} na všechny cíle!',
    takeDamage: '{target} utrpěl {damage} poškození',
    healsFor: '{target} se uzdravil o {amount} životů',

    // Buttons
    startCombat: 'Zahájit Boj',
    nextTurn: 'Další Kolo',
    attack: 'Útok',
    useSkill: 'Použít Schopnost',

    // Status
    waitingForInput: 'Čekám na tvůj příkaz...',
    selectTarget: 'Vyber cíl',
  },

  // ============================================================================
  // SKILLS
  // ============================================================================
  skills: {
    // Warrior
    heavySlash: {
      name: 'Těžký Sek',
      description: 'Způsob 150% útoku poškození jednomu cíli',
    },
    shieldBash: {
      name: 'Úder Štítem',
      description: 'Způsob 80% útoku poškození a omráčení na 1 kolo',
    },
    battleCry: {
      name: 'Válečný Pokřik',
      description: 'Zvýší útok týmu o 30% na 3 kola',
    },

    // Archer
    preciseShot: {
      name: 'Přesný Výstřel',
      description: 'Způsob 180% útoku poškození se zaručeným kritickým zásahem',
    },
    multiShot: {
      name: 'Vícenásobný Výstřel',
      description: 'Způsob 80% útoku poškození všem nepřátelům',
    },
    evasion: {
      name: 'Úhyb',
      description: 'Zvýší rychlost o 50% na 2 kola',
    },

    // Mage
    fireball: {
      name: 'Ohnivá Koule',
      description: 'Způsob 200% útoku magické poškození jednomu cíli',
    },
    chainLightning: {
      name: 'Řetězový Blesk',
      description: 'Způsob 120% útoku poškození všem nepřátelům',
    },
    manaShield: {
      name: 'Manový Štít',
      description: 'Sníží přijímané poškození o 40% na 3 kola',
    },

    // Cleric
    heal: {
      name: 'Léčení',
      description: 'Obnoví 100 životů jednomu spojenci',
    },
    groupHeal: {
      name: 'Skupinové Léčení',
      description: 'Obnoví 60 životů všem spojencům',
    },
    holySmite: {
      name: 'Svaté Strestání',
      description: 'Způsob 100% útoku světelné poškození',
    },

    // Paladin
    smite: {
      name: 'Strestání',
      description: 'Způsob 130% útoku poškození a uzdrav se za 30% způsobeného poškození',
    },
    divineShield: {
      name: 'Božský Štít',
      description: 'Získej imunitu vůči poškození na 1 kolo',
    },
    blessing: {
      name: 'Požehnání',
      description: 'Zvýší obranu spojence o 40% na 3 kola',
    },
  },

  // ============================================================================
  // ENEMIES
  // ============================================================================
  enemies: {
    types: {
      normal: 'Běžný',
      elite: 'Elitní',
      boss: 'Boss',
    },
    names: {
      goblin: 'Goblin',
      orc: 'Ork',
      skeleton: 'Kostlivec',
      spider: 'Pavouk',
      wolf: 'Vlk',
      bandit: 'Bandita',
      darkKnight: 'Temný Rytíř',
      zombie: 'Zombie',
      imp: 'Ďáblík',
      slime: 'Sliz',
    },
  },

  // ============================================================================
  // STATUS EFFECTS
  // ============================================================================
  statusEffects: {
    stunned: 'Omráčen!',
    atkBuff: '+30% útoku na 3 kola',
    spdBuff: '+50% rychlosti na 2 kola',
    defBuff: '+40% obrany na 3 kola',
    damageReduction: '-40% přijímaného poškození na 3 kola',
    immunity: 'Imunita vůči poškození na 1 kolo',
  },

  // ============================================================================
  // INVENTORY & EQUIPMENT
  // ============================================================================
  inventory: {
    title: 'Inventář',
    empty: 'Žádné předměty v inventáři',
    filter: 'Filtr',
    sort: 'Seřadit',
    equip: 'Nasadit',
    unequip: 'Sundat',
    discard: 'Zahodit',
    enchant: 'Vylepšit',
    autoEquip: {
      skippedItems: 'Některé předměty nebylo možné nasadit:',
      requiresLevel: 'Vyžaduje úroveň hrdiny'
    },
    slots: {
      helmet: 'Helma',
      weapon: 'Zbraň',
      chest: 'Hrudník',
      gloves: 'Rukavice',
      legs: 'Nohavice',
      boots: 'Boty',
      accessory: 'Doplněk',
      all: 'Vše'
    },
    rarity: {
      common: 'Běžný',
      uncommon: 'Neobvyklý',
      rare: 'Vzácný',
      epic: 'Epický',
      legendary: 'Legendární',
      mythic: 'Mýtický'
    }
  },

  equipment: {
    levelRequirement: 'Nelze obléknout {{itemName}} - vyžaduje úroveň hrdiny {{requiredLevel}} (aktuální: {{currentLevel}})'
  },

  // ============================================================================
  // DUNGEON SYSTEM
  // ============================================================================
  dungeon: {
    // Room descriptions
    enemies: 'Nepřátelé',
    eliteEnemies: 'Elitní Nepřátelé',
    gold: 'Zlato',
    items: 'Předměty',
    guaranteedRewards: 'Zaručené Odměny',

    // Room encounters
    bossEncounter: 'SOUBOJ S BOSSEM!',
    eliteCombat: 'ELITNÍ SOUBOJ!',
    miniBossEncounter: 'SOUBOJ S MINI-BOSSEM!',

    // Trap system
    damageReport: 'Zpráva o Poškození',

    // Loot rewards
    lootRewards: 'Kořist',
    collectInstructions: 'Seberte nebo prodejte předměty a pokračujte v průzkumu podzemí',

    // Loot confirmation dialog
    lootWarningTitle: 'Varování: Máte nesebranou kořist!',
    lootWarningMessage: 'Pokud budete pokračovat v průzkumu, tyto předměty budou navždy ztraceny.\n\nOpravdu chcete pokračovat bez sebrání vší kořisti?',

    // Exit room dialog
    exitRoomTitle: 'Dosáhli jste východu!',
    exitRoomMessage: 'Stiskněte OK pro postup na další patro.\nStiskněte Zrušit pro opuštění podzemí (všechna kořist si necháte).',

    // Dungeon defeat screen
    defeat: {
      title: 'Porážka',
      message: 'Vaše skupina byla poražena!',
      allHeroesFallen: 'Všichni hrdinové padli v boji',
      reviveMessage: 'Své hrdiny můžete oživit u Léčitele ve městě',
      returnButton: 'Návrat na Světovou Mapu',
    },

    // Dungeon victory screen
    victory: {
      title: 'Vítězství!',
      goldReward: 'Získané Zlato',
      itemsReward: 'Nalezené Předměty',
      instruction: 'Klikněte na předměty pro přidání do inventáře nebo prodej za zlato',
      collectAll: 'Sebrat Vše',
      sellAll: 'Prodat Vše',
      allCollected: 'Veškerá kořist sebrána!',
      continueExploring: 'Pokračovat v Průzkumu',
      uncollectedWarning: 'Máte nesebrané předměty. Seberte nebo prodejte je před pokračováním.',
    },
  },

  // ============================================================================
  // WORLDMAP SYSTEM
  // ============================================================================
  worldmap: {
    notEnoughEnergy: 'Nedostatek energie',
    notEnoughEnergyDungeon: 'Nedostatek energie pro vstup do tohoto podzemí',
    dungeonIntegration: 'Integrace podzemí dokončena',
    loading: 'Načítání...',
    error: 'Chyba při načítání světové mapy',
    position: 'Pozice',
    energy: 'Energie',
    gold: 'Zlato',
    dailyRank: 'Denní Pořadí',
    inventory: 'Inventář',
    storedGold: 'Uložené Zlato',
    energyRegen: 'Energie se regeneruje časem',
    todo: 'TODO',

    // Unexplored area warning
    unexploredTitle: 'Neprozkoumaná Oblast',
    unexploredMessage: 'Tato oblast je zahalena temnotou. Nemůžete cestovat do neprozkoumaných území!',
    unexploredTip: 'Nejprve prozkoumejte okolní oblasti, abyste odhalili více mapy. Pohyb je omezen pouze na objevená políčka.',

    // Teleport system
    teleportTitle: 'Teleport',
    teleportCost: 'Cena Teleportu',
    teleportEnergy: 'Energie',
    availableEnergy: 'Dostupná Energie',
    discoveredLocations: 'Objevená Místa',
    allLocations: 'Vše',
    towns: 'Města',
    dungeons: 'Podzemí',
    noLocationsTitle: 'Žádná Místa Neobjevena',
    noLocationsMessage: 'Prozkoumejte světovou mapu a objevte města a podzemí, do kterých se můžete teleportovat!',
    teleportButton: 'Teleportovat',
    notEnoughEnergyButton: 'Nedostatek Energie',
    town: 'Město',
    dungeon: 'Podzemí',

    // Tooltip info
    terrain: 'Terén',
    distance: 'Vzdálenost',
    cost: 'Cena',
    tiles: 'dlaždic',
  },

  // ============================================================================
  // SAVE GAME SYSTEM
  // ============================================================================
  saveGame: {
    notConfigured: 'Supabase není nakonfigurován',
    saveFailed: 'Nepodařilo se uložit hru',
    heroSaveFailed: 'Nepodařilo se uložit hrdiny',
    equipmentSaveFailed: 'Nepodařilo se uložit vybavení',
    inventorySaveFailed: 'Nepodařilo se uložit inventář',
    saveSuccess: 'Hra úspěšně uložena',
    loadNotFound: 'Soubor se zálohou nenalezen',
    loadHeroesFailed: 'Nepodařilo se načíst hrdiny',
    loadEquipmentFailed: 'Nepodařilo se načíst vybavení',
    loadInventoryFailed: 'Nepodařilo se načíst inventář',
    loadSuccess: 'Hra úspěšně načtena',
    listFailed: 'Nepodařilo se načíst seznam záloh',
    deleteFailed: 'Nepodařilo se smazat zálohu',
    deleteSuccess: 'Záloha úspěšně smazána',
  },

  // Router section
  router: {
    backToMainGame: '← Zpět do Hlavní Hry',
    testUI: '🧪 Testovací UI',
    defeatAlert: '💀 PORÁŽKA! Všichni hrdinové padli...\n\nBudete vráceni na světovou mapu.',
    uncollectedItemsWarning: '⚠️ Nesebrané Předměty!\n\nMáte {{count}} nesebraných předmětů. Jste si jisti, že je chcete zanechat?',
    combatVictory: '🎉 VÍTĚZSTVÍ! 🎉',
    combatDefeat: '💀 PORÁŽKA 💀',
    combatTurn: '⚔️ SOUBOJ - KOLO {{turn}}',
    allHeroesFallen: '💀 Všichni Hrdinové Padli',
    defeatMessage: 'Vaše skupina byla poražena. Hrdinové budou oživeni, až se vrátíte do města.',
    returnToWorldMap: '🏠 Návrat na Světovou Mapu',
    lootRewards: '💰 Kořist',
    lootInstruction: '💡 Klikněte na předměty pro zobrazení detailů nebo použijte tlačítka "Prodat Vše" / "Sebrat Vše" níže',
    goldAmount: '{{amount}} Zlata',
    itemsCount: '{{count}} Předmětů',
    collectAll: '📦 Sebrat Vše',
    sellAll: '💰 Prodat Vše',
    allLootCollected: '✅ Všechna kořist sebrána!',
    continueExploring: '🗺️ Pokračovat v Průzkumu',
    heroes: '🛡️ Hrdinové',
    enemies: '👹 Nepřátelé',
    combatLog: '📜 Zápis ze Souboje',
  },

  // ============================================================================
  // COMMON UI
  // ============================================================================
  ui: {
    confirm: 'Potvrdit',
    cancel: 'Zrušit',
    close: 'Zavřít',
    save: 'Uložit',
    load: 'Načíst',
    delete: 'Smazat',
    back: 'Zpět',
    next: 'Další',
    continue: 'Pokračovat',
    yes: 'Ano',
    no: 'Ne',
  },

  // ============================================================================
  // SIDEBAR NAVIGATION
  // ============================================================================
  sidebar: {
    worldMap: 'Mapa světa',
    heroes: 'Hrdinové',
    inventory: 'Inventář',
    teleport: 'Teleport',
    leaderboards: 'Žebříčky',
    quests: 'Úkoly',
    guild: 'Cech',
    lastUpdates: 'Poslední změny',
    combatPower: 'Bojová Síla',
  },

  // ============================================================================
  // RESOURCES
  // ============================================================================
  resources: {
    gems: 'Drahokamy',
  },

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  auth: {
    login: 'Přihlásit se',
    register: 'Registrovat',
    logout: 'Odhlásit se',
    email: 'Email',
    password: 'Heslo',
    confirmPassword: 'Potvrdit heslo',
    loginButton: 'Přihlásit',
    registerButton: 'Registrovat',
    alreadyHaveAccount: 'Již máte účet?',
    dontHaveAccount: 'Nemáte účet?',
    loading: 'Načítání...',

    // Validation
    fillAllFields: 'Vyplňte prosím všechna pole',
    passwordTooShort: 'Heslo musí mít alespoň 6 znaků',
    passwordsDoNotMatch: 'Hesla se neshodují',

    // Success messages
    loginSuccess: 'Přihlášení úspěšné!',
    registerSuccess: 'Registrace úspěšná! Zkontrolujte prosím svůj email.',
    logoutSuccess: 'Odhlášení úspěšné',

    // Error messages
    loginFailed: 'Přihlášení selhalo',
    registerFailed: 'Registrace selhala',
    invalidCredentials: 'Neplatný email nebo heslo',
    emailAlreadyExists: 'Email již je registrován',
  },

  // ============================================================================
  // TOWN SYSTEM
  // ============================================================================
  town: {
    // Building names
    tavern: 'Taverna',
    smithy: 'Kovárna',
    healer: 'Léčitel',
    market: 'Trh',
    bank: 'Banka',
    guild: 'Cechovní Síň',

    // Building descriptions
    tavernDesc: 'Najímejte hrdiny a vyvolejte nové dobrodruhy',
    smithyDesc: 'Očarujte vybavení a opravujte předměty',
    healerDesc: 'Obnovte životy svých hrdinů',
    marketDesc: 'Kupujte a prodávejte předměty a zdroje',
    bankDesc: 'Ukládejte zlato a získávejte úroky',
    guildDesc: 'Spravujte cech a sociální funkce',

    // Common
    locked: 'Zamčeno',
    comingSoon: 'Již Brzy',
    yourHeroes: 'Vaši Hrdinové',
    heroRoster: 'Soupiska Hrdinů',
    activeParty: 'Aktivní Skupina',

    // Tavern - Gacha System
    summonHeroes: 'Vyvolat Hrdiny',
    collection: 'Sbírka',
    partyManager: 'Správce Skupiny',
    heroSummon: 'Vyvolání Hrdinů',
    heroCollection: 'Sbírka Hrdinů',
    heroCount: 'Aktuálně máte {count} hrdinů ve své sbírce.',

    // Gacha summon
    dropRates: 'Šance na Drop',
    freeDailySummon: 'Denní Bezplatné Vyvolání',
    availableNow: 'Dostupné Nyní!',
    comeBackTomorrow: 'Vraťte se zítra',
    singleSummon: 'Jednotlivé Vyvolání',
    tenSummon: '10x Vyvolání',
    discount: '{percent}% SLEVA!',
    guaranteedRare: 'Zaručeno Vzácné+',
    notEnoughGoldSummon: 'Nedostatek zlata',
    heroSummoned: 'Hrdina Vyvolán!',
    heroesSummoned: 'Hrdinové Vyvoláni!',
    summoning: 'Vyvolávání...',

    // Pity system
    pitySystem: 'Pity Systém',
    pityCounter: 'Pity: {current}/{max}',
    pityInfo1: 'Zaručený {rarity} hrdina po {count} vyvoláních bez Epického nebo Legendárního',
    pityInfo2: 'Aktuální pity počítadlo: {current}/{max}',
    pityInfo3: '10x vyvolání zaručuje alespoň 1 Vzácného nebo lepšího hrdinu',
    pityInfo4: 'Denní bezplatné vyvolání se obnovuje o půlnoci',

    // Hero roles
    tank: 'Tank',
    dps: 'DPS',
    support: 'Podpora',

    // Hero collection
    totalHeroes: 'Celkem Hrdinů: {count}',
    activePartyCount: 'Aktivní Skupina: {current}/{max}',
    filterRarity: 'Vzácnost',
    filterClass: 'Třída',
    sortBy: 'Seřadit podle',
    sortLevel: 'Úroveň',
    sortRarity: 'Vzácnost',
    sortName: 'Jméno',
    sortClass: 'Třída',
    allRarities: 'Vše',
    allClasses: 'Vše',
    noHeroesFound: 'Nenalezeni Žádní Hrdinové',
    adjustFilters: 'Zkuste upravit filtry nebo vyvolat další hrdiny!',
    specialAbility: 'Speciální Schopnost',
    description: 'Popis',
    statistics: 'Statistiky',

    // Party manager
    maxPartySize: 'Maximální velikost skupiny: {size} hrdinů',
    selectSlotFirst: 'Nejprve vyberte slot skupiny',
    heroAlreadyInParty: 'Tento hrdina je již ve skupině',
    heroAddedToParty: '{name} přidán do skupiny!',
    heroRemovedFromParty: 'Hrdina odebrán ze skupiny',
    clickSlotToSelect: 'Klikněte na slot skupiny pro výběr',
    clickHeroToAdd: 'Poté klikněte na dostupného hrdinu pro přidání do slotu',
    buildBalancedParty: 'Sestavte vyváženou skupinu s tanky, DPS, léčiteli a podporou',
    emptySlot: 'Prázdný Slot',
    slot: 'Slot {number}',
    availableHeroes: 'Dostupní Hrdinové ({count})',
    allHeroesInParty: 'Všichni hrdinové jsou v aktivní skupině!',
    selectHeroForSlot: 'Vyberte hrdinu pro Slot {number}',
    partyStatistics: 'Statistiky Skupiny',
    totalHP: 'Celkem HP',
    totalATK: 'Celkem ÚTO',
    totalDEF: 'Celkem OBR',
    avgLevel: 'Prům. Úroveň',
    individualHealing: 'Individuální Léčení',
    remove: 'Odstranit',

    // Talent System
    talentPoints: 'Body Talentu',
    talentPointsAvailable: 'Dostupné Body Talentu',
    talentPointsCount: '{count} Body Talentu',
    duplicateHeroObtained: 'Duplicitní hrdina! +1 Bod Talentu',
    talentTree: 'Strom Talentů',
    talentTreeComingSoon: 'Strom Talentů - Připravujeme',
    talentTreeDescription: 'Použijte body talentu k odemknutí silných schopností a pasivních bonusů',
    noTalentPoints: 'Žádné dostupné body talentu',
    unlockTalent: 'Odemknout Talent',
    talentLocked: 'Zamčeno',

    // Healer
    healSingleCost: 'Vyléčit - {cost}z',
    healPartyCost: 'Vyléčit Celou Skupinu - Cena: {cost}z',
    alreadyFullHP: '{name} už má plné životy!',
    healedSuccessfully: '{name} plně vyléčen!',
    partyHealedSuccessfully: 'Všichni hrdinové plně vyléčeni!',
    notEnoughGold: 'Nedostatek zlata!',

    // Smithy
    enchantingService: 'Služba Očarování',
    selectItemToEnchant: 'Vyberte předmět z vašeho vybavení k očarování',
    currentLevel: 'Aktuální Úroveň: +{level}',
    nextLevel: 'Další Úroveň: +{level}',
    successRate: 'Míra Úspěšnosti: {rate}%',
    enchantCost: 'Cena: {cost}z',
    enchantItem: 'Očarovat Předmět',
    enchantWarning: 'Varování: Očarování může selhat! Zlato je utraceno bez ohledu na úspěch.',
    enchantSuccessMessage: 'Úspěch! Předmět očarován na +{level}',
    enchantFailMessage: 'Očarování selhalo! Předmět zůstává na +{level}',
    maxEnchantLevel: 'Předmět je již na maximální úrovni očarování (+10)!',
    noEquipment: 'Nemáte žádné vybavení k očarování!',

    // Market (placeholder)
    marketComingSoon: 'Trh Již Brzy ve v0.9.0!',
    marketDescription: 'Tržní systém bude brzy dostupný',
    marketFeature1: 'Kupujte předměty, vybavení a zdroje',
    marketFeature2: 'Prodávejte svou kořist za zlato',
    marketFeature3: 'Denně se měnící nabídka',
    marketFeature4: 'Speciální obchodní nabídky',

    // Bank (placeholder)
    bankComingSoon: 'Banka Již Brzy ve v0.9.0!',
    bankDescription: 'Bankovní systém bude brzy dostupný',
    bankFeature1: 'Bezpečně ukládejte zlato',
    bankFeature2: 'Získávejte denní úroky z vkladů',
    bankFeature3: 'Vybírejte kdykoliv s malým poplatkem',
    bankFeature4: 'Odemykejte větší úložiště pomocí vylepšení',

    // Guild (placeholder)
    guildComingSoon: 'Cechovní Síň Již Brzy ve v1.2.0!',
    guildDescription: 'Systém cechů bude brzy dostupný',
    guildFeature1: 'Připojte se nebo vytvořte cechy s přáteli',
    guildFeature2: 'Cechovní bonusy a výhody',
    guildFeature3: 'Cechovní války a kontrola území',
    guildFeature4: 'Sdílené cechovní úložiště',
  },

  // ============================================================================
  // CHAT SYSTEM
  // ============================================================================
  chat: {
    placeholder: 'Napište zprávu...',
    send: 'Odeslat',
    enterToSend: 'Enter pro odeslání',
    escapeToCancel: 'Escape pro zrušení',
  },

  // ============================================================================
  // HERO COLLECTION SCREEN
  // ============================================================================
  heroCollection: {
    title: 'Sbírka Hrdinů',
    stats: {
      totalHeroes: 'Celkem Hrdinů:',
      activeParty: 'Aktivní Skupina:',
      partySlots: '/4',
      hp: 'Životy:',
      atk: 'Útok:',
      def: 'Obrana:',
      score: 'Skóre:',
    },
    filters: {
      rarity: 'Vzácnost:',
      class: 'Třída:',
      sortBy: 'Seřadit podle:',
      all: 'Vše',
    },
    rarities: {
      legendary: 'Legendární',
      epic: 'Epické',
      rare: 'Vzácné',
      common: 'Běžné',
    },
    classes: {
      warrior: 'Válečník',
      archer: 'Lučištník',
      mage: 'Mág',
      cleric: 'Klerik',
      paladin: 'Paladin',
    },
    sortOptions: {
      level: 'Úroveň',
      rarity: 'Vzácnost',
      name: 'Jméno',
      class: 'Třída',
    },
    badges: {
      activeParty: 'Aktivní Skupina',
    },
    labels: {
      level: 'Úroveň',
    },
    empty: {
      title: 'Nenalezeni Žádní Hrdinové',
      message: 'Zkuste upravit filtry nebo vyvolat další hrdiny!',
    },
    details: {
      class: 'Třída:',
      role: 'Role:',
      level: 'Úroveň:',
      xp: 'Zkušenosti:',
      statisticsTitle: 'Statistiky',
      description: 'Popis',
      specialAbility: 'Speciální Schopnost',
    },
    detailStats: {
      hp: 'Životy',
      attack: 'Útok',
      defense: 'Obrana',
      speed: 'Rychlost',
      heroScore: 'Skóre Hrdiny',
    },
    talent: {
      title: 'Body Talentu',
      pointsAvailable: 'Dostupné Body',
      description: 'Tento hrdina byl vyvolán vícekrát! Body talentu mohou být použity ve Stromě Talentů (Již Brzy).',
    },
  },

  // ============================================================================
  // INVENTORY SCREEN
  // ============================================================================
  inventoryScreen: {
    loading: 'Načítání hrdinů...',
    selectHero: 'Vybrat Hrdinu',
    levelFormat: '(Úr.',
    labels: {
      level: 'Úroveň',
      xp: 'Zkušenosti',
    },
    equipment: {
      title: 'Vybavení',
      empty: 'Prázdné',
      setBonuses: 'Set Bonusy',
      noSetBonuses: 'Žádné aktivní set bonusy',
      stats: {
        hp: 'Životy:',
        atk: 'Útok:',
        def: 'Obrana:',
        spd: 'Rychlost:',
        crit: 'Kritický Zásah:',
        power: 'Síla:',
      },
      buttons: {
        autoEquipBest: 'Auto-Nasadit Nejlepší',
      },
      warnings: {
        enchantingTownOnly: '⚠️ Očarování je dostupné pouze v městě (navštivte Kovárnu)!',
      },
      tooltip: {
        hp: 'Životy:',
        atk: 'Útok:',
        def: 'Obrana:',
        spd: 'Rychlost:',
        crit: 'Kritický Zásah:',
        value: '💰 Hodnota: {{value}} zlato',
        clickInstructions: 'Levý klik pro nasazení | Pravý klik pro očarování',
      },
    },
    inventoryPanel: {
      title: 'Inventář',
      slots: 'Sloty:',
      gold: 'Zlato:',
      emptyTitle: 'Inventář je prázdný',
      emptyMessage: 'Žádné dostupné předměty',
      buttons: {
        expand: 'Rozšířit (+10 slotů, 500z)',
        autoSellCommon: 'Auto-Prodat Běžné',
      },
    },
  },

  // ============================================================================
  // LEADERBOARD SCREEN
  // ============================================================================
  leaderboard: {
    title: 'Denní Žebříčky',
    resetIcon: '⏰',
    resetLabel: 'Resetuje se za:',
    categories: {
      deepestFloor: 'Nejhlubší Patro',
      totalGold: 'Celkem Zlata',
      heroesCollected: 'Sebraní Hrdinové',
      combatPower: 'Bojová Síla',
    },
    categoryDescriptions: {
      deepestFloor: 'Nejhlubší patro dungeonů dosažené dnes',
      totalGold: 'Celkem zlata získaného dnes',
      heroesCollected: 'Počet jedinečných vlastněných hrdinů',
      combatPower: 'Kombinovaná bojová síla skupiny',
    },
    noRank: {
      message: 'V této kategorii jste si dnes ještě nezískali pořadí.',
      hint: 'Začněte hrát, abyste se objevili na žebříčku!',
    },
    loading: 'Načítání žebříčku...',
    empty: {
      message: 'Zatím žádné záznamy dnes',
      hint: 'Buďte první, kdo se objeví na žebříčku!',
    },
    youBadge: 'VY',
    labels: {
      level: 'Úroveň',
    },
    anonymous: 'Anonymní',
  },

  // ============================================================================
  // ERRORS & WARNINGS
  // ============================================================================
  errors: {
    generic: 'Došlo k chybě',
    notFound: 'Nenalezeno',
    invalidAction: 'Neplatná akce',
    cooldownActive: 'Schopnost má aktivní prodlevu',
    notEnoughResources: 'Nedostatek zdrojů',
    targetInvalid: 'Neplatný cíl',
  },

  // ============================================================================
  // PROFILE SCREEN
  // ============================================================================
  profile: {
    title: 'Profil & Nastavení',
    logout: 'Odhlásit se',
    logoutConfirm: 'Opravdu se chcete odhlásit?',
    nameLabel: 'Jméno:',
    emailLabel: 'Email:',
    levelLabel: 'Úroveň:',
    goldLabel: 'Zlato:',
    gemsLabel: 'Drahokamy:',
    energyLabel: 'Energie:',
    experienceLabel: 'Zkušenosti:',
    editName: 'Upravit jméno',
    nameEmpty: 'Jméno nesmí být prázdné',
    notLoggedIn: 'Nejste přihlášeni',
    saveNameFailed: 'Nepodařilo se uložit jméno',
    saveNameError: 'Nastala chyba při ukládání jména',
    saving: 'Ukládám...',
    saveButton: 'Uložit',
    cancelButton: 'Zrušit',
    enterNewName: 'Zadejte nové jméno',
    resetProgress: 'Resetovat Průběh',
    resetProgressConfirm: 'VAROVÁNÍ: Tímto smažete VŠECHNA data ze hry!\n\nZůstane vám pouze účet a email.\n\nTato akce je NEVRATNÁ!\n\nOpravdu chcete pokračovat?',
    resetProgressSuccess: 'Průběh úspěšně resetován',
    resetProgressFailed: 'Resetování průběhu selhalo',
    deleteAccount: 'Smazat Účet',
    deleteAccountConfirm: 'VAROVÁNÍ: Tímto TRVALE SMAŽETE váš účet!\n\nVŠECHNA data budou ztracena navždy.\n\nTato akce je NEVRATNÁ!\n\nOpravdu chcete pokračovat?',
    deleteAccountSuccess: 'Účet úspěšně smazán',
    deleteAccountFailed: 'Smazání účtu selhalo',
    languageSettings: 'Nastavení Jazyka',
    languageLabel: 'Jazyk',

    // Dangerous Actions section
    dangerousActions: 'Nebezpečné akce',
    resetProgressTitle: 'Resetovat progres (DEBUG)',
    resetProgressDesc: 'Smaže všechny hrdiny, předměty a progres. Účet zůstane aktivní.',
    resetProgressButton: 'Resetovat progres',
    resetProgressConfirm1: 'Opravdu chcete smazat veškerý progres?',
    resetProgressConfirm2Warning: 'Tato akce je NEVRATNÁ! Ztratíte:',
    resetProgressConfirm2Heroes: 'hrdinů',
    resetProgressConfirm2Items: 'předmětů',
    resetProgressConfirm2AllProgress: 'Veškerý progres a zlato',
    resetProgressConfirm2Question: 'Pokračovat?',
    resetProgressConfirm3: 'POSLEDNÍ VAROVÁNÍ!\nToto NELZE vrátit zpět. Opravdu smazat vše?',
    deleteAccountTitle: 'Smazat účet',
    deleteAccountDesc: 'Trvale smaže váš účet a VŠECHNA data. Tuto akci NELZE vrátit zpět!',
    deleteAccountButton: 'Smazat účet',
    deleteAccountConfirm1: 'Opravdu chcete TRVALE smazat svůj účet?',
    deleteAccountConfirm2Warning: 'POSLEDNÍ VAROVÁNÍ!',
    deleteAccountConfirm2Text: 'Váš účet ({email}) bude TRVALE SMAZÁN.\nZtratíte přístup NAVŽDY. Pokračovat?',
    deleteAccountConfirm3: 'OPRAVDU POSLEDNÍ ŠANCE!\nToto NELZE vrátit zpět. Smazat účet NAVŽDY?',
    resetError: 'Nastala chyba při resetování progressu',
    deleteError: 'Nastala chyba při mazání účtu',
    processing: 'Probíhá...',
    yesReset: 'Ano, resetovat',
    yesSure: 'Ano, jsem si jistý',
    yesDeleteAll: 'ANO, SMAZAT VŠE',
    yesDeleteAccount: 'Ano, smazat účet',
    yesDeletePermanently: 'ANO, SMAZAT TRVALE',
    noCancel: 'Ne, zrušit',
    noKeepAccount: 'Ne, zachovat účet',
  },

  // ============================================================================
  // SYNC STATUS
  // ============================================================================
  sync: {
    saving: 'Ukládání...',
    saved: 'Uloženo',
    savedAt: 'Uloženo {{time}}',
    error: 'Chyba ukládání',
    connected: 'Připojeno',
    timeJustNow: 'právě teď',
    timeMinutesAgo: 'před {{minutes}}m',
    timeHoursAgo: 'před {{hours}}h',
  },

  // ============================================================================
  // LAST UPDATES / CHANGELOG
  // ============================================================================
  updates: {
    title: 'Poslední změny',
    features: 'Nové funkce',
    fixes: 'Opravy',
    gameplay: 'Gameplay',
    technical: 'Technické změny',
    footer: 'Více informací na',
    github: 'GitHub',

    // Version 2.1.0
    v2_1_0: {
      features: {
        item1: 'Přidána možnost editace uživatelského jména v profilu',
        item2: 'Přidáno tlačítko pro odhlášení v profilu',
        item3: 'Přidána sekce "Poslední změny" do hlavního menu',
      },
      fixes: {
        item1: '🔥 Kritická oprava: Vyřešen problém s mizením hrdinů při vstupu do dungeonů',
        item2: 'Opravena race condition v načítání dat ze hry',
        item3: 'Hrdové nyní správně persistují napříč dungeony a combaty',
        item4: 'Opraveno řazení auto-equip pro prioritizaci rarity nad úrovní a silou',
        item5: 'Přidáno CASCADE DELETE pro equipment_slots k prevenci konfliktů při ukládání',
        item6: 'Přidána kontrola level requirementu při ručním oblékání itemů',
        item7: 'Level požadavky na vybavení nyní zobrazeny v modal dialozích místo alertů',
        item8: 'Opraven denní reset mapy - mapy se nyní správně regenerují o půlnoci UTC',
      },
      technical: {
        item1: 'Optimalizace loadGameData funkce',
        item2: 'Implementace správného lifecycle managementu pro game state',
        item3: 'Přidán party_order sloupec do databáze',
        item4: 'Přidáno komplexní debug logování pro auto-equip systém',
      },
    },

    // Version 2.0.0
    v2_0_0: {
      features: {
        item1: 'Nový hlavní gameplay loop s World Map',
        item2: 'Dungeon exploration system',
        item3: 'Combat system s auto-battle režimem',
        item4: 'Hero gacha system',
        item5: 'Equipment system',
        item6: 'Profile & settings screen',
      },
      gameplay: {
        item1: 'Procedurálně generované dungeons',
        item2: 'Různé typy nepřátel (Easy, Normal, Hard, Elite)',
        item3: 'Loot system se zlatem a předměty',
        item4: 'Hero leveling a experience systém',
        item5: 'Active party management (4 hrdinové)',
      },
      technical: {
        item1: 'Supabase integrace pro multiplayer',
        item2: 'Row Level Security (RLS) policies',
        item3: 'Real-time updates',
        item4: 'Cloud saves',
      },
    },

    // Version 1.0.0
    v1_0_0: {
      features: {
        item1: 'Základní hero systém',
        item2: 'Jednoduchý combat',
        item3: 'Local storage saves',
      },
    },
  },
};
