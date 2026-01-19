/**
 * Czech Localization
 *
 * Contains all game text strings in Czech.
 * Czech translation for Looters Land.
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-20
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
  // COMMON UI ELEMENTS
  // ============================================================================
  common: {
    ok: 'OK',
    cancel: 'Zrušit',
    close: 'Zavřít',
    confirm: 'Potvrdit',
    information: 'Informace',
  },

  // ============================================================================
  // RESOURCES
  // ============================================================================
  resources: {
    gold: 'Zlato',
    gems: 'Drahokamy',
    dust: 'Prach',
    crystals: 'Krystaly',
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
    crit: 'Kritický zásah',
    level: 'Úroveň',
  },

  // ============================================================================
  // EQUIPMENT SLOTS
  // ============================================================================
  equipmentSlots: {
    helmet: 'Helma',
    chest: 'Hrudní zbroj',
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
    modeAuto: 'Automatický boj',
    modeManual: 'Manuální boj',

    // Combat status
    victory: '🎉 VÍTĚZSTVÍ! Hrdinové zvítězili! 🎉',
    defeat: '💀 PORÁŽKA! Hrdinové padli... 💀',
    allHeroesDead: 'Všichni vaši hrdinové byli poraženi v boji!',

    // Turn info
    turnCounter: 'Kolo',
    turn: {
      now: 'TEĎ',
      position: '#{position}',
      wait: 'Čeká',
    },
    round: 'Kolo {number}',
    selectTargetFor: '{name} - Vyber cíl',
    turnOrder: 'Pořadí tahů',

    // Combat log
    combatInitialized: 'Boj zahájen!',
    heroes: 'Hrdinové',
    enemies: 'Nepřátelé',

    // Actions
    attacks: '{attacker} útočí na {target} za {damage} poškození',
    miss: '{attacker} útočí na {target}, ale mine!',
    critical: 'KRITICKÝ ZÁSAH!',
    defeated: '{name} byl poražen!',
    stunned: 'Omráčen!',
    combo: '{count}x KOMBO!',
    position: {
      front: 'Přední',
      middle: 'Střední',
      back: 'Zadní',
      empty: 'Prázdné',
    },
    partyFormation: 'Formace skupiny',
    enemyFormation: 'Formace nepřátel',
    comboLabel: 'KOMBO',

    // Skills
    usesSkill: '{attacker} použil {skill} na {target}',
    usesSkillDamage: '{attacker} použil {skill} na {target} za {damage} poškození',
    usesSkillDamageHeal: '{attacker} použil {skill} na {target} za {damage} poškození a uzdravil se o {heal} životů',
    usesSkillHeal: '{attacker} použil {skill} na {target}, uzdravil o {heal} životů',
    usesSkillBuff: '{attacker} použil {skill}: {effect}',
    usesSkillAoE: '{attacker} použil {skill} na všechny cíle!',
    usesSkillGroupHeal: '{attacker} použil {skill} na všechny spojence!',
    takeDamage: '{target} utrpěl {damage} poškození',
    healsFor: '{target} se uzdravil o {amount} životů',

    // Buttons
    startCombat: 'Zahájit boj',
    nextTurn: 'Další kolo',
    attack: 'Útok',
    useSkill: 'Použít schopnost',
    estDamage: 'Odhad poškození',
    cooldown: 'CD',

    // Status
    waitingForInput: 'Čekám na tvůj příkaz...',
    selectTarget: 'Vyber cíl',

    // Combat log component
    log: {
      title: 'Bojový protokol',
      autoScroll: 'Auto-scroll',
      export: 'Exportovat',
      total: 'Celkem',
      turns: 'Kola',
      empty: 'Bojový protokol je prázdný. Zahajte boj pro zobrazení akcí.',
      noEntries: 'Žádné {filter} záznamy k zobrazení.',
      filter: {
        all: 'Vše',
        attack: 'Útok',
        skill: 'Schopnost',
        heal: 'Léčení',
        death: 'Smrt',
      },
// Position System (Phase 3)    partyFormation: 'Formace týmu',    enemyFormation: 'Formace nepřátel',    position: {      front: 'Přední',      middle: 'Střední',      back: 'Zadní',      aggro: 'Aggro',      empty: 'Prázdné',      bonuses: 'Bonusy pozice',      frontBonus: 'Přední: +10% Fyz. poškození, -10% obrana, 3x Aggro',      middleBonus: 'Střední: Vyvážená, 2x Aggro',      backBonus: 'Zadní: +15% Magické poškození, +10% obrana, 1x Aggro',    },
    },
  },

  // ============================================================================
  // SKILLS
  // ============================================================================
  skills: {
    // Warrior
    heavySlash: {
      name: 'Těžký Sek',
      description: 'Způsobí 150% ATK poškození jednomu cíli',
    },
    shieldBash: {
      name: 'Úder Štítem',
      description: 'Způsobí 80% ATK poškození a omráčení na 1 kolo',
    },
    battleCry: {
      name: 'Válečný Pokřik',
      description: 'Zvýší ATK týmu o 30% na 3 kola',
      effect: '+30% ATK na 3 kola',
    },

    // Archer
    preciseShot: {
      name: 'Přesný Výstřel',
      description: 'Způsobí 180% ATK poškození se zaručeným kritickým zásahem',
    },
    multiShot: {
      name: 'Vícenásobný Výstřel',
      description: 'Způsobí 80% ATK poškození všem nepřátelům',
    },
    evasion: {
      name: 'Úhyb',
      description: 'Zvýší SPD o 50% na 2 kola',
      effect: '+50% SPD na 2 kola',
    },

    // Mage
    fireball: {
      name: 'Ohnivá Koule',
      description: 'Způsobí 200% ATK magické poškození jednomu cíli',
    },
    chainLightning: {
      name: 'Řetězový Blesk',
      description: 'Způsobí 120% ATK poškození všem nepřátelům',
    },
    manaShield: {
      name: 'Manový Štít',
      description: 'Sníží přijímané poškození o 40% na 3 kola',
      effect: '-40% poškození na 3 kola',
    },

    // Cleric
    heal: {
      name: 'Léčení',
      description: 'Obnoví 60% HP jednomu spojenci',
    },
    groupHeal: {
      name: 'Skupinové Léčení',
      description: 'Obnoví 30% HP všem spojencům',
    },
    holySmite: {
      name: 'Svaté Strestání',
      description: 'Způsobí 100% ATK světelné poškození',
    },

    // Paladin
    smite: {
      name: 'Strestání',
      description: 'Způsobí 130% ATK poškození a uzdraví se za 30% způsobeného poškození',
    },
    divineShield: {
      name: 'Božský Štít',
      description: 'Získej imunitu vůči poškození na 1 kolo',
      effect: 'Imunita na 1 kolo',
    },
    blessing: {
      name: 'Požehnání',
      description: 'Zvýší DEF spojence o 40% na 3 kola',
      effect: '+40% DEF na 3 kola',
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
    combo: '{count}x KOMBO!',
    position: {
      front: 'Přední',
      middle: 'Střední',
      back: 'Zadní',
      empty: 'Prázdné',
    },
    partyFormation: 'Formace skupiny',
    enemyFormation: 'Formace nepřátel',
    comboLabel: 'KOMBO',
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
    eliteEnemies: 'Elitní nepřátelé',
    gold: 'Zlato',
    items: 'Předměty',
    guaranteedRewards: 'Zaručené odměny',

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

    // Room action buttons
    combatCompleted: 'Boj dokončen',
    fightBoss: 'Bojovat s bossem',
    bossDefeated: 'Boss poražen',
    lootTreasure: 'Vzít poklad',
    treasureLooted: 'Sesbíráno',
    disarmTrap: 'Zneškodnit past',
    trapDisarmed: 'Past zneškodněna',
    rest: 'Odpočinek',
    alreadyRested: 'Již odpočato',
    useShrine: 'Použít svatyni',
    shrineUsed: 'Svatyně použita',
    investigate: 'Prozkoumat',
    mysteryResolved: 'Záhada vyřešena',
    eliteDefeated: 'Elita poražena',
    fightMiniBoss: 'Bojovat s mini-bossem',
    miniBossDefeated: 'Mini-boss poražen',
    proceedNextFloor: 'Postoupit na další patro',

    // Buttons
    exitDungeonKeepLoot: '✅ Opustit podzemí (Ponechat kořist)',
    abandonDungeon: '❌ Opustit podzemí',

    // Messages
    loading: 'Načítání podzemí...',
    abandonWarning: '⚠️ Varování: Opuštění podzemí nyní způsobí ztrátu veškeré sebrané kořisti a pokroku!\n\nOpravdu chcete podzemí opustit?',
    defeatAllEnemies: '⚠️ Poraž všechny nepřátele pro pokračování!',

    // Room completion messages (BUG-003 fix)
    mustDefeatEnemies: 'Musíš porazit všechny nepřátele před opuštěním místnosti!',
    mustDefeatBoss: 'Musíš porazit bosse před opuštěním místnosti!',
    mustDefeatMiniBoss: 'Musíš porazit mini-bosse před opuštěním místnosti!',
    mustLootTreasure: 'Musíš sebrat poklad před opuštěním místnosti!',
    mustDisarmTrap: 'Musíš zneškodnit past před opuštěním místnosti!',
    mustUseRest: 'Musíš odpočívat před opuštěním místnosti!',
    mustUseShrine: 'Musíš použít svatyni před opuštěním místnosti!',
    mustResolveMystery: 'Musíš prozkoumat záhadu před opuštěním místnosti!',

    // Statistics labels
    floor: 'Patro:',
    enemiesDefeated: 'Poražení nepřátelé:',
    goldEarned: 'Získané zlato:',
    itemsFound: 'Nalezené předměty:',

    // Shrine buffs
    activeShrineBufTitle: '✨ Aktivní Buff Svatyně:',
    damageBuff: '+10% Poškození',
    xpBuff: '+15% Zkušenosti',
    goldBuff: '+20% Zlato',
    allStatsBuff: '+10% Všechny Statistiky',

    // Room descriptions
    difficulty: 'Obtížnost:',
    healAmount: 'Množství léčení:',
    shrineDescription: 'Mystická svatyně vyzařuje sílu...',
    buffType: 'Typ buffu:',

    // Room types
    roomTypes: {
      start: 'Start',
      combat: 'Boj',
      treasure: 'Poklad',
      trap: 'Past',
      rest: 'Odpočinek',
      boss: 'Boss',
      exit: 'Východ',
      shrine: 'Svatyně',
      mystery: 'Záhada',
      elite: 'Elita',
      miniboss: 'Mini-Boss',
    },

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
      goldReward: 'Získané zlato',
      itemsReward: 'Nalezené předměty',
      instruction: 'Klikněte na předměty pro přidání do inventáře nebo prodej za zlato',
      collectAll: 'Sebrat vše',
      sellAll: 'Prodat vše',
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
    notEnoughEnergyPortal: 'Nedostatek energie pro použití portálu!',
    dungeonIntegration: 'Integrace podzemí dokončena',
    loading: 'Načítání...',
    error: 'Chyba při načítání světové mapy',
    position: 'Pozice',
    energy: 'Energie',
    gold: 'Zlato',
    dailyRank: 'Denní pořadí',
    inventory: 'Inventář',
    storedGold: 'Uložené zlato',
    energyRegen: 'Energie se regeneruje časem',
    todo: 'TODO',

    // Energy modal
    energyModal: {
      title: 'Nedostatek energie',
      required: 'Potřebujete:',
      youHave: 'Máte:',
      waitMessage: 'Počkejte na regeneraci energie nebo použijte energetický lektvar!',
    },

    // Combat encounter modal
    combatEncounter: {
      titleFallback: 'Setkání s nepřítelem',
      randomMessage: 'Skupina divokých nepřátel se objevila a blokuje vám cestu!',
      powerfulMessage: 'Narazili jste na mocného {{difficulty}} nepřítele na světové mapě!',
      enemy: 'Nepřítel:',
      level: 'Úroveň:',
      difficulty: 'Obtížnost:',
      enemyCount: 'Počet nepřátel:',
      yourParty: 'Vaše skupina:',
      chooseCombatMode: 'Vyberte si režim boje:',
      autoCombat: 'Automatický boj',
      manualCombat: 'Manuální boj',
      cancel: 'Zrušit',
    },

    // Unexplored area warning
    unexploredTitle: 'Neprozkoumaná oblast',
    unexploredMessage: 'Tato oblast je zahalena temnotou. Nemůžete cestovat do neprozkoumaných území!',
    unexploredTip: 'Nejprve prozkoumejte okolní oblasti, abyste odhalili více mapy. Pohyb je omezen pouze na objevená políčka.',

    // Teleport system
    teleportTitle: 'Teleport',
    teleportCost: 'Cena teleportu',
    teleportEnergy: 'Energie',
    availableEnergy: 'Dostupná energie',
    discoveredLocations: 'Objevená místa',
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

    // Worldmap object messages
    treasureChestAlreadyOpened: 'Tato truhla s pokladem již byla otevřena!',
    hiddenPathAlreadyDiscovered: 'Tato skrytá cesta již byla objevena!',
    hiddenPathLevelRequired: 'Tato skrytá cesta vyžaduje úroveň {{requiredLevel}}!\nVaše úroveň: {{playerLevel}}',
    portalNotConnected: 'Tento portál není připojen k ničemu!',
    portalNotFound: 'Propojený portál nebyl nalezen!',
    rareSpawnDefeated: 'Tento vzácný nepřítel již byl poražen!',
    monsterDefeated: 'Toto monstrum již bylo poraženo!\nPozději se znovu objeví.',
    observationTowerAlreadyUsed: 'Tuto rozhlednu jste již použili.',
    observationTowerRevealed: 'Rozhledna odhaluje obrovskou oblast! Objeveno {{tilesRevealed}} políček.',
    healingWellTitle: 'Léčivá studna',
    healingWellDiscovered: 'Objevili jste mystickou léčivou studnu!',
    healingWellWillRestore: 'Tato studna obnoví {{percent}}% HP celé vaší aktivní party.',
    healingWellAlreadyUsed: 'Tato léčivá studna již byla dnes použita. Vraťte se zítra!',
    healingWellActivePartyStatus: 'Stav aktivní party:',
    healingWellDailyWarning: '⚠️ Tuto léčivou studnu lze použít pouze jednou denně.',
    healingWellButtonHeal: '💚 Vyléčit partu',
    healingWellButtonCancel: 'Zrušit',
    encounterComingSoon: 'Systém střetnutí již brzy!',
    enchantSuccess: '✨ {{message}}\nŠance na úspěch byla {{chance}}%',
    enchantFailed: '❌ {{message}}\nŠance na úspěch byla {{chance}}%',
    notEnoughGold: 'Nedostatek zlata!\nPotřebné: {{required}}\nAktuální: {{current}}',
    merchantSoldOut: 'Obchodník vyprodal všechny své předměty!',
    randomEventComingSoon: 'Náhodná Událost: {{eventType}}\nFunkce připravujeme!',
    itemSold: '✅ Prodáno {{itemName}} za {{gold}} zlata!',
    cancelMovement: 'Zrušit',
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
    errorOccurred: 'Došlo k chybě',
    checkEmailConfirmation: 'Zkontrolujte prosím svůj email a potvrďte účet, poté se přihlaste.',
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
        clickInstructions: 'Levý klik pro zobrazení detailů',
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
        discardAllGrey: 'Zahodit Všechny Šedivé',
      },
      noGreyItems: 'Žádné šedivé předměty k zahození',
      confirmDiscardGrey: 'Zahodit {{count}} šedivých předmětů? Toto nelze vrátit zpět!',
      discardedGrey: '{{count}} šedivých předmětů zahozeno',
      confirmDestroyItem: 'Opravdu chcete trvale zničit {itemName}? Toto nelze vrátit zpět.',
      itemDetail: {
        stats: 'Statistiky:',
        enchant: 'Zesílení',
        set: 'Set',
        value: 'Hodnota:',
        gold: 'zlata',
        equipItem: 'Nasadit Předmět',
        destroyItem: 'Zničit Předmět',
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
    notLoggedIn: 'Nejste přihlášeni',
    avatarUpdateFailed: 'Nepodařilo se aktualizovat avatar',
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
    resetProgressSuccess: '✅ Progres byl úspěšně resetován! Budete odhlášeni...',
    resetProgressFailed: 'Resetování průběhu selhalo',
    deleteAccount: 'Smazat Účet',
    deleteAccountConfirm: 'VAROVÁNÍ: Tímto TRVALE SMAŽETE váš účet!\n\nVŠECHNA data budou ztracena navždy.\n\nTato akce je NEVRATNÁ!\n\nOpravdu chcete pokračovat?',
    deleteAccountSuccess: '❌ Účet byl úspěšně smazán. Budete odhlášeni...',
    deleteAccountFailed: 'Smazání účtu selhalo',
    languageSettings: 'Nastavení Jazyka',
    languageLabel: 'Jazyk',

    // Avatar section
    avatarSectionTitle: 'Výběr Avatara',
    avatarSelectedBadge: 'Vybráno',
    avatarSaving: 'Ukládání...',

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

    // Version 2.3.1
    v2_3_1: {
      features: {
        item1: '✅ Truhly s poklady - Nyní plně funkční! Otevírejte truhly pro zlato a předměty',
        item2: '✅ Skryté cesty - Objevujte tajné oblasti s level požadavky a vzácnou kořistí',
        item3: '✅ Portály - Teleportujte se mezi propojenými portály za energii',
        item4: '✅ Vzácní nepřátelé - Bojujte s mocnými nepřáteli s garantovaným rare/epic dropem',
        item5: '✅ Potulní příšery - Rychlé bojové setkání na světové mapě',
        item6: '✅ Putující obchodníci - Obchodní rozhraní s nakupitelnými předměty',
        item7: '✅ Zobrazení počasí a času - Vidíte aktuální počasí a denní dobu na mapě'
      },
      technical: {
        item1: 'LootGenerator - Přidány statické metody pro generování kořisti ze světové mapy',
        item2: 'WorldMapDemo2 - Všechny funkce světové mapy nyní plně implementovány'
      }
    },

    // Version 2.3.0
    v2_3_0: {
      features: {
        item1: '🌀 Portály - Rychlé cestování mezi objevenými portály (stojí energii)',
        item2: '🗝️ Skryté cesty - Tajné oblasti s vzácnou kořistí na odlehlých místech',
        item3: '📦 Truhly s poklady - Náhodné truhly na mapě se zlatem a předměty',
        item4: '👹 Vzácní nepřátelé - Silní nepřátelé s garantovaným rare/epic dropem',
        item5: '🐺 Potulní příšery - Klikatelní nepřátelé na mapě pro rychlý boj',
        item6: '🛒 Putující obchodníci - Náhodní obchodníci s unikátními předměty',
        item7: '⭐ Náhodné události - Speciální události (záchrana NPC, boss fight, hon za pokladem)',
        item8: '🌦️ Systém počasí - Počasí ovlivňuje spawn rate nepřátel',
        item9: '🌙 Cyklus dne a noci - Různí nepřátelé se objevují v různých denních dobách',
      },
      technical: {
        item1: 'Rozšířeny typy WorldMap o 6 nových statických a 3 dynamické objekty',
        item2: 'Přidána procedurální generace pro všechny nové mapové funkce',
        item3: 'Implementovány click handlery a vykreslování nových objektů',
      },
    },

    // Version 2.2.0
    v2_2_0: {
      features: {
        item1: '🌍 Kompletní česká lokalizace pro Hrdiny, Inventář a Žebříčky',
        item2: '📝 101 pevných textů nahrazeno překladovými klíči',
        item3: '🔧 Přidána komplexní JSDoc dokumentace ke všem komponentům',
      },
      fixes: {
        item1: '⚡ Opravena regenerace energie - energie se nyní správně doplňuje',
      },
      technical: {
        item1: 'Přidány překladové sekce heroCollection, inventoryScreen a leaderboard',
        item2: 'Všechny lokalizované komponenty zkontrolovány proti coding_rules.md standardům',
        item3: 'Aktualizovány @lastModified datumy a přidány explicitní TypeScript return types',
      },
    },

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

    // Version 2.3.5
    v2_3_5: {
      features: {
        item1: 'Středověký fantasy přihlašovací ekrán - Kompletně přepracovaný se zlatými dekoracemi, animovanými prvky a fontem Cinzel',
        item2: 'Vylepšený autentifikační systém - Zlepšené zpracování chyb a stavy načítání',
      },
      fixes: {
        item1: 'Opravena perzistence XP hrdinů - XP a úrovně hrdinů nyní správně přetrvávají po boji v dungeonu',
        item2: 'Opravena race condition ve správě stavu - Jediná sdílená instance useGameState zabraňuje zastaralým datům',
        item3: 'Opraven callback konce boje - Použití closure vzoru zabraňuje null odkazům na metadata',
        item4: 'Opraveno automatické ukládání hrdinů - Hrdinové uloženi před opuštěním dungeonu pro zachování veškerého pokroku',
      },
      technical: {
        item1: 'Implementován vzor sdíleného stavu - Router předává gameState do WorldMapDemo2 přes props',
        item2: 'Přidán closure vzor pro combat callbacky - Zachycuje metadata pro zamezení React state problémů',
        item3: 'Aktualizován Router s detailní JSDoc dokumentací pro všechny combat handlery',
        item4: 'Přidány 3 nové dokumentační soubory (STATE_MANAGEMENT_FIX, REACT_STATE_CLOSURE_FIX, COMPLIANCE_REPORT)',
        item5: 'Vytvořena nová RLS migrace pro tabulku game_saves (20251114_add_game_saves_rls.sql)',
        item6: 'Refaktorován GameSaveService se zlepšeným zpracováním chyb a type safety',
        item7: 'Aktualizována @lastModified data na 2025-11-15 v několika souborech',
        item8: 'Všechny změny ověřeny podle coding_rules.md standardů',
      },
    },

    // Version 2.3.6
    v2_3_6: {
      technical: {
        item1: '🎨 Kompletní CSS refactoring - Všech 37 komponent refaktorováno s design tokeny (100% hotovo)',
        item2: '📋 Design token systém - Vytvořeno 100+ tokenů (COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, atd.)',
        item3: '🔧 Reusable style utilities - 50+ společných stylových objektů v common.ts',
        item4: '🎯 695+ hardcoded barev nahrazeno COLORS tokeny',
        item5: '📏 1,232+ hardcoded spacing hodnot nahrazeno SPACING tokeny',
        item6: '✨ Vylepšená konzistence - Všechny design hodnoty z centralizovaného systému',
        item7: '🔄 Theme-ready - Základ pro budoucí dark/light theme switching',
        item8: '📚 Dokumentace - CSS_REFACTORING_PLAN.md s kompletním plánem a statistikami',
      },
    },

    // Version 2.3.4
    v2_3_4: {
      features: {
        item1: 'Kompletní lokalizace počasí a denní doby - Všechny texty počasí (Jasno, Déšť, Bouřka, Mlha, Sníh) a denní doby (Úsvit, Den, Soumrak, Noc) nyní přeloženy do češtiny',
        item2: 'Přeložené UI prvky - "Další:", "Brzy" a další texty ve widgetu počasí plně lokalizovány',
      },
      technical: {
        item1: 'Přidána sekce weather a timeOfDay do lokalizačních souborů (en.ts, cs.ts)',
        item2: 'Aktualizován WeatherSystem.getWeatherDisplay() s volitelným parametrem pro lokalizaci',
        item3: 'Aktualizován TimeOfDaySystem.getTimeDisplay() s volitelným parametrem pro lokalizaci',
        item4: 'WeatherTimeWidget nyní používá useTranslation() hook pro překlad všech textů',
        item5: 'WorldMapDemo2 helper funkce aktualizovány na použití WeatherSystem a TimeOfDaySystem s překlady',
        item6: 'Přidány JSDoc hlavičky do WeatherSystem.ts a TimeOfDaySystem.ts',
        item7: 'Aktualizována @lastModified data na 2025-11-15 ve všech upravených souborech',
        item8: 'Všechny změny ověřeny podle coding_rules.md standardů',
      },
    },

    // Version 2.3.3
    v2_3_3: {
      features: {
        item1: 'Globální systém počasí a času - Synchronizované počasí a denní doba napříč všemi hráči v reálném čase',
        item2: 'Systém pojmenovaných nepřátel - Speciální bossové (Prastarý golem, Stínový drak, Mrazivý obr, Fénix) a elitní monstra',
        item3: 'Systém rychlého boje - Rychlé boje na mapě světa s auto/manuálním režimem a sběrem kořisti',
        item4: 'Vylepšený systém modálů - Znovu použitelné stylované modální komponenty (ModalText, ModalButton, ModalInfoBox)',
        item5: 'Vizuální objekty na mapě - Obrázky skrytých cest a vizuální zobrazení tajemství',
        item6: 'Widget počasí a času - Živé odpočty do další změny počasí/času',
        item7: 'Vylepšený Gacha systém - Denní zdarma召唤 s 10% slevou na 10x召唤',
      },
      fixes: {
        item1: 'Opravena porážka v boji - Hrdinové nyní správně uloženi do databáze s 10% HP po porážce',
        item2: 'Opraven dungeon combat - Používání hrdinů z combat engine místo zastaralého gameState, aby se předešlo ztrátě XP/levelů',
        item3: 'Opraveno HP hrdinů po vítězství - Správná synchronizace mezi combat engine a game state',
      },
      technical: {
        item1: 'Přidán useGlobalWorldState hook pro Supabase realtime odběry',
        item2: 'Vytvořen GlobalWorldStateService pro správu dat počasí/času',
        item3: 'Přidána Supabase Edge funkce pro automatické aktualizace počasí/času přes cron',
        item4: 'Implementován NamedEnemies.ts s tematickými skupinami nepřátel a násobiteli statů',
        item5: 'Přidáno 5 nových dokumentačních souborů (GLOBAL_WORLD_STATE_SETUP, WORLDMAP_COMBAT_ARCHITECTURE, atd.)',
        item6: 'Vytvořena SQL migrace pro tabulku global_world_state s RLS politikami',
        item7: 'Přidány debug nástroje pro monitoring weather/time cron jobů',
        item8: 'Vylepšena správa herního stavu s lepší synchronizací party',
      },
    },

    // Version 2.3.2
    v2_3_2: {
      technical: {
        item1: 'Opraveny všechny hardcoded české/anglické texty v ProfileScreen - nahrazeny t() lokalizací',
        item2: 'Lokalizovány názvy avatarů pomocí funkce getAvatarDisplayName()',
        item3: 'Přidána kompletní JSDoc dokumentace k 6 helper funkcím ve WorldMapViewer',
        item4: 'Implementováno React.memo() pro optimalizaci výkonu komponenty WorldMapViewer',
        item5: 'Přidán useMemo() k výpočtu getHoverInfo pro lepší výkon',
        item6: 'Přidána JSDoc na úrovni komponenty ProfileScreen s plnou dokumentací rozhraní',
        item7: 'Odstraněna nepoužívaná property previewImage z AVATAR_CONFIG',
        item8: 'Aktualizována @lastModified data na 2025-11-12 ve všech upravených souborech',
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

  // ============================================================================
  // TOWN BUILDINGS
  // ============================================================================
  buildings: {
    // Common elements
    close: 'Zavřít',
    gold: 'Zlato',

    // Tavern
    tavern: {
      title: 'Taverna',
      tabs: {
        summon: 'Povolat Hrdiny',
        collection: 'Sbírka',
        party: 'Správa Družiny',
      },
    },

    // Smithy
    smithy: {
      title: 'Kovárna',
      selectItem: 'Vyber předmět k vylepšení',
      enchantingDetails: 'Detaily vylepšení',
      currentLevel: 'Současná úroveň:',
      nextLevel: 'Další úroveň:',
      successRate: 'Šance na úspěch:',
      cost: 'Cena:',
      enchantButton: 'Vylepšit předmět',
      maxEnchant: 'Maximální úroveň vylepšení',
      notEnoughGold: 'Nedostatek zlata',
      warning: {
        title: 'Varování:',
        message: 'Vylepšení může selhat! Zlato je utraceno i při neúspěchu.',
      },
      info: {
        title: 'Systém vylepšení',
        item1: 'Každá úroveň vylepšení přidává bonusové statistiky k vybavení',
        item2: 'Šance na úspěch se snižuje s rostoucí úrovní vylepšení',
        item3: 'Zlato je utraceno i když vylepšení selže',
        item4: 'Maximální úroveň vylepšení je +10',
      },
      empty: {
        title: 'Žádné vybavení',
        message: 'Nemáš žádné předměty k vylepšení. Zkus prozkoumávat dungeony a najít výbavu!',
      },
    },

    // Market
    market: {
      title: 'Trh',
      tabs: {
        buy: 'Koupit předměty',
        sell: 'Prodat předměty',
      },
      buttons: {
        buy: 'Koupit',
        sell: 'Prodat',
        notEnoughGold: 'Nedostatek zlata',
        selectAllGrey: 'Vybrat Všechny Šedivé',
        clearSelection: 'Zrušit Výběr',
        sellSelected: 'Prodat Vybrané',
      },
      sellPrice: 'Prodej:',
      empty: {
        message: 'Žádné předměty k prodeji. Prozkoumej dungeony a najdi kořist!',
      },
      noItemsSelected: 'Žádné předměty vybrány',
      confirmSellMultiple: 'Prodat {{count}} předmětů za {{gold}} zlata?',
      soldMultiple: 'Prodáno {{count}} předmětů za {{gold}} zlata!',
    },

    // Healer
    healer: {
      title: 'Léčitel',
      healParty: 'Vyléčit celou družinu',
      individual: 'Individuální léčení',
      fullHP: 'Plné HP',
      heal: 'Vyléčit',
      allAtFullHP: 'Všichni hrdinové mají plné HP',
      pricing: {
        title: 'Ceník',
        individual: 'Individuální léčení:',
        individualCost: '1z za HP',
        party: 'Léčení celé družiny:',
        partyCost: '50z paušál',
        partySaving: '(levnější pro více hrdinů)',
      },
    },

    // Bank
    bank: {
      title: 'Bankovní trezor',
      buttons: {
        selectAll: 'Vybrat Všechny',
        clearSelection: 'Zrušit Výběr',
        depositSelected: 'Vložit Vybrané',
        withdrawSelected: 'Vybrat Vybrané',
      },
      noItemsSelected: 'Žádné předměty vybrány',
      confirmDepositMultiple: 'Vložit {{count}} předmětů do banky? Celkový poplatek: {{fee}}z',
      depositedMultiple: 'Vloženo {{count}} předmětů za {{fee}}z',
      confirmWithdrawMultiple: 'Vybrat {{count}} předmětů z banky?',
      withdrawnMultiple: 'Vybráno {{count}} předmětů z banky',
    },

    // Guild Hall
    guildHall: {
      title: 'Guildovní síň',
      comingSoon: {
        title: 'Již brzy!',
        version: 'Systém guildů bude dostupný ve verzi v1.2.0',
        features: {
          item1: 'Vytvořit nebo vstoupit do guildy',
          item2: 'Guildovní chat a sociální funkce',
          item3: 'Guildovní války a kontrola území',
          item4: 'Guildovní výhody a bonusy',
        },
      },
    },
  },

  // ============================================================================
  // AVATARS
  // ============================================================================
  avatars: {
    hero1: 'Rytíř',
    hero2: 'Hraničář',
    hero3: 'Kouzelník',
    hero4: 'Štítonoš',
    hero5: 'Bard',
  },

  // ============================================================================
  // HEROES SCREEN
  // ============================================================================
  heroesScreen: {
    activePartyTitle: 'Aktivní družina',
    heroCollectionTitle: 'Sbírka hrdinů',
    emptySlot: 'Prázdný slot',
    inParty: 'V družině',
    addToParty: '+ Přidat do družiny',
    partyFull: 'Družina je plná! Maximálně {max} hrdinů povoleno.',
    townOnly: 'Družinu můžete změnit pouze ve městě (navštivte Tavern)!',
    all: 'Vše',
    class: 'Třída',
    xp: 'Zkušenosti',
    talentPoints: 'Body talentu',
    talentPointsAvailable: '{count} bodů k dispozici',
    talentTree: 'Strom talentů (Připravujeme)',
  },

  // ============================================================================
  // WEATHER & TIME OF DAY
  // ============================================================================
  weather: {
    clear: 'Jasno',
    rain: 'Déšť',
    storm: 'Bouřka',
    fog: 'Mlha',
    snow: 'Sníh',
    next: 'Další:',
    soon: 'Brzy',
  },

  timeOfDay: {
    dawn: 'Úsvit',
    day: 'Den',
    dusk: 'Soumrak',
    night: 'Noc',
  },
};
