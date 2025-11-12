import { useState, useEffect } from 'react'
import './App.css'
import { Hero } from './engine/hero/Hero'
import { Item } from './engine/item/Item'
import { ItemGenerator } from './engine/item/ItemGenerator'
import { Equipment } from './engine/equipment/Equipment'
import { Inventory } from './engine/item/Inventory'
import { InventoryHelper } from './engine/item/InventoryHelper'
import { GameSaveService } from './services/GameSaveService'
import { GameStateConverter } from './services/GameStateConverter'
import { loadFromLocalStorage, saveToLocalStorage } from './services/LocalStorageService'
import { restoreGameState } from './services/GameStateRestorer'
import * as AuthService from './services/AuthService'
import { LoginScreen } from './components/LoginScreen'
import { CLASS_ICONS } from './types/hero.types'
import type { HeroClass } from './types/hero.types'
import { CombatEngine } from './engine/combat/CombatEngine'
import { Enemy, generateRandomEnemy } from './engine/combat/Enemy'
import type { Combatant, CombatLogEntry } from './types/combat.types'
import { Dungeon } from './engine/dungeon/Dungeon'
import { DungeonExplorer } from './components/DungeonExplorer'
import { WorldMapDemo } from './components/WorldMapDemo'
import { WorldMapDemo2 } from './components/WorldMapDemo2'
import { t } from './localization/i18n'
import './config/DEBUG_CONFIG' // Load debug commands

function App() {
  // ============================================================================
  // ALL HOOKS - MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // ============================================================================

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('demo-user-id');
  const [userEmail, setUserEmail] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // Main game UI - Initialize 5 heroes (one of each class) - with auto-restore from localStorage
  const [heroes] = useState<Hero[]>(() => {
    // Try to restore from localStorage first
    const savedState = loadFromLocalStorage();
    if (savedState) {
      console.log('🔄 Restoring game from auto-save...');
      const restored = restoreGameState(savedState);
      return restored.heroes;
    }

    // No save found, create new heroes
    console.log('🆕 Creating new game...');
    const heroClasses: HeroClass[] = ['warrior', 'archer', 'mage', 'cleric', 'paladin'];
    return heroClasses.map((heroClass, index) => {
      const hero = new Hero(
        `${heroClass.charAt(0).toUpperCase() + heroClass.slice(1)} ${index + 1}`,
        heroClass,
        10
      );
      hero.equipment = new Equipment(hero);
      return hero;
    });
  });

  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [inventory] = useState<Inventory>(() => {
    // Try to restore from localStorage first
    const savedState = loadFromLocalStorage();
    if (savedState) {
      const restored = restoreGameState(savedState);
      const inv = new Inventory(restored.maxSlots);
      inv.items = restored.inventory;
      inv.gold = restored.gold;
      return inv;
    }

    // No save found, create new inventory
    const inv = new Inventory(50);
    inv.gold = 5000;
    return inv;
  });
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [tooltip, setTooltip] = useState<{ item: Item; x: number; y: number } | null>(null);
  const [skillTooltip, setSkillTooltip] = useState<{ skill: any; x: number; y: number } | null>(null);
  const [statusTooltip, setStatusTooltip] = useState<{ character: any; x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [enchantingItem, setEnchantingItem] = useState<Item | null>(null);
  const [enchantResult, setEnchantResult] = useState<{ success: boolean; message: string } | null>(null);
  const [lootItemModal, setLootItemModal] = useState<Item | null>(null);

  const selectedHero = heroes[selectedHeroIndex];

  // Force re-render
  const forceUpdate = () => setUpdateTrigger(prev => prev + 1);

  // Auto-save to localStorage on inventory/hero changes
  useEffect(() => {
    // Debounce saves to avoid excessive writes
    const timeoutId = setTimeout(() => {
      saveToLocalStorage(heroes, inventory.items, inventory.gold, inventory.maxSlots);
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [heroes, inventory.items, inventory.gold, inventory.maxSlots, updateTrigger]);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tooltip handlers
  const showTooltip = (item: Item, e: React.MouseEvent) => {
    setTooltip({ item, x: e.clientX, y: e.clientY });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const updateTooltipPosition = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
    }
  };

  // Skill tooltip handlers
  const showSkillTooltip = (skill: any, e: React.MouseEvent) => {
    // On mobile, center the tooltip
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setSkillTooltip({
        skill,
        x: window.innerWidth / 2 - 175, // center (tooltip is ~350px wide)
        y: window.innerHeight / 2 - 100
      });
    } else {
      setSkillTooltip({ skill, x: e.clientX, y: e.clientY });
    }
  };

  const hideSkillTooltip = () => {
    setSkillTooltip(null);
  };

  const updateSkillTooltipPosition = (e: React.MouseEvent) => {
    if (skillTooltip) {
      setSkillTooltip({ ...skillTooltip, x: e.clientX, y: e.clientY });
    }
  };

  // Status tooltip handlers
  const showStatusTooltip = (character: any, e: React.MouseEvent) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setStatusTooltip({
        character,
        x: window.innerWidth / 2 - 175,
        y: window.innerHeight / 2 - 100
      });
    } else {
      setStatusTooltip({ character, x: e.clientX, y: e.clientY });
    }
  };

  const hideStatusTooltip = () => {
    setStatusTooltip(null);
  };

  // Enchanting handlers
  const openEnchantPanel = (item: Item) => {
    setEnchantingItem(item);
    setEnchantResult(null);
    hideTooltip();
  };

  const closeEnchantPanel = () => {
    setEnchantingItem(null);
    setEnchantResult(null);
  };

  const attemptEnchant = (guaranteed: boolean = false) => {
    if (!enchantingItem) return;

    const cost = (enchantingItem.enchantLevel + 1) * 100;
    const gemCost = 50;

    if (guaranteed) {
      if (inventory.gold < gemCost) {
        setEnchantResult({ success: false, message: 'Not enough gold for guaranteed enchant!' });
        return;
      }
      inventory.removeGold(gemCost);
    } else {
      if (inventory.gold < cost) {
        setEnchantResult({ success: false, message: 'Not enough gold!' });
        return;
      }
      inventory.removeGold(cost);
    }

    const result = enchantingItem.enchant(guaranteed);
    setEnchantResult(result);

    // Update hero stats if item is equipped
    if (selectedHero.equipment) {
      const equippedItem = Object.values(selectedHero.equipment.slots).find(i => i?.id === enchantingItem.id);
      if (equippedItem) {
        selectedHero.equipment.recalculateStats();
      }
    }

    forceUpdate();
  };

  const sellEnchantingItem = () => {
    if (!enchantingItem) return;

    const result = inventory.sellItem(enchantingItem.id);
    if (result.success) {
      console.log(result.message);
      closeEnchantPanel();
      forceUpdate();
    }
  };

  // Equipment actions
  const equipItem = (item: Item) => {
    if (!selectedHero.equipment) return;

    const result = selectedHero.equipment.equip(item);
    if (result.success) {
      inventory.removeItem(item.id);
      if (result.unequippedItem) {
        inventory.addItem(result.unequippedItem);
      }
      hideTooltip();
      forceUpdate();
    }
  };

  const unequipItem = (slotName: string) => {
    if (!selectedHero.equipment) return;

    const result = selectedHero.equipment.unequip(slotName as any);
    if (result.success && result.item) {
      inventory.addItem(result.item);
      hideTooltip();
      forceUpdate();
    }
  };

  const autoEquipBest = () => {
    if (!selectedHero.equipment) return;

    const result = InventoryHelper.autoEquipBest(inventory, selectedHero.equipment, selectedHero.level);
    if (result.success) {
      console.log(result.message);
      forceUpdate();
    }
  };

  // Inventory actions
  const generateRandomItems = () => {
    const rarities: any[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (let i = 0; i < 10; i++) {
      const level = Math.floor(Math.random() * 20) + 1;
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      const item = ItemGenerator.generate(level, rarity, null);
      inventory.addItem(item);
    }
    forceUpdate();
  };

  const generateLegendary = () => {
    const item = ItemGenerator.generate(15, 'legendary', null);
    inventory.addItem(item);
    forceUpdate();
  };

  const addGold = () => {
    inventory.addGold(1000);
    forceUpdate();
  };

  const clearInventory = () => {
    inventory.clear();
    forceUpdate();
  };

  // Save/Load game state
  const [saveName, setSaveName] = useState('Auto Save');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveGame = async () => {
    setIsSaving(true);
    try {
      const result = await GameSaveService.saveGame(
        userId,
        saveName,
        heroes,
        inventory
      );

      alert(result.message);
      console.log('Save result:', result);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const loadGame = async () => {
    if (!confirm(`Load save "${saveName}"? Current progress will be lost!`)) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await GameSaveService.loadGame(userId, saveName);

      if (!result.success || !result.data) {
        alert(result.message);
        return;
      }

      // Restore heroes
      const loadedHeroes = result.data.heroes.map(dbHero =>
        GameStateConverter.dbHeroToHero(
          dbHero,
          result.data!.equipmentSlots
        )
      );

      // Replace current heroes
      heroes.length = 0;
      heroes.push(...loadedHeroes);

      // Restore inventory
      const loadedInventory = GameStateConverter.restoreInventory(
        result.data.gameSave.inventory_max_slots,
        result.data.gameSave.gold,
        result.data.inventoryItems
      );

      inventory.maxSlots = loadedInventory.maxSlots;
      inventory.gold = loadedInventory.gold;
      inventory.items = loadedInventory.items;

      // Reset selected hero to first
      setSelectedHeroIndex(0);

      alert(result.message);
      forceUpdate();
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load game');
    } finally {
      setIsLoading(false);
    }
  };

  const expandInventory = () => {
    const result = inventory.expandInventory(10, 500);
    if (result.success) {
      console.log(result.message);
    } else {
      console.log(result.message);
    }
    forceUpdate();
  };

  const autoSellCommon = () => {
    const result = InventoryHelper.autoSellByRarity(inventory, 'common');
    console.log(result.message);
    forceUpdate();
  };

  // Combat System State
  const [combatEngine] = useState(() => new CombatEngine());
  const [combatActive, setCombatActive] = useState(false);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [enemyLevel] = useState(10);
  const [enemyCount, setEnemyCount] = useState(3);
  const [enemyType] = useState<'normal' | 'elite' | 'boss'>('normal');
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<Combatant | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Combatant | null>(null);

  // Dungeon System State
  const [currentDungeon, setCurrentDungeon] = useState<Dungeon | null>(null);
  const [dungeonUpdateKey, setDungeonUpdateKey] = useState<number>(0);
  const [uiMode, setUiMode] = useState<'normal' | 'dungeon' | 'worldmap' | 'worldmap2'>('worldmap2'); // Start on new worldmap v2
  const [showDungeonVictory, setShowDungeonVictory] = useState<boolean>(false);

  // ============================================================================
  // AUTH EFFECTS - Check authentication on mount
  // ============================================================================
  useEffect(() => {
    const checkAuth = async () => {
      const session = await AuthService.getCurrentSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        console.log('✅ User authenticated:', session.user.email);
      } else {
        console.log('ℹ️ No active session, showing login screen');
      }
      setAuthLoading(false);
    };

    checkAuth();

    // Subscribe to auth state changes
    const unsubscribe = AuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserId('');
        setUserEmail('');
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle successful login
  const handleLoginSuccess = (id: string) => {
    setUserId(id);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      const result = await AuthService.logout();
      if (result.success) {
        console.log('✅ Logged out');
      }
    }
  };

  // Combat handlers
  // const startCombat = () => {
    // Validate enemy count
    if (enemyCount > 10) {
      alert('⚠️ Maximum 10 enemies allowed! Setting to 10.');
      setEnemyCount(10);
      return;
    }

    // Generate enemies with selected type
    const enemies: Enemy[] = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(generateRandomEnemy(enemyLevel, enemyType));
    }
    setCurrentEnemies(enemies);

    // Initialize combat
    combatEngine.initialize(heroes as Combatant[], enemies as Combatant[]);
    combatEngine.setManualMode(isManualMode);

    // Set up callbacks
    combatEngine.onUpdate = () => {
      setCombatLog([...combatEngine.combatLog]);
      setWaitingForInput(combatEngine.waitingForPlayerInput);
      setActiveCharacter(combatEngine.currentCharacter);
      forceUpdate();
    };

    combatEngine.onWaitForInput = (character) => {
      setWaitingForInput(true);
      setActiveCharacter(character);
      setSelectedTarget(null);
      forceUpdate();
    };

    combatEngine.onCombatEnd = (result) => {
      setCombatActive(true); // Keep combat screen visible
      setCombatLog([...combatEngine.combatLog]);
      setWaitingForInput(false);
      setActiveCharacter(null);
      forceUpdate();

      // Show alert after combat ends
      setTimeout(() => {
        alert(result === 'victory' ? '🎉 VICTORY! Heroes win!' : '💀 DEFEAT! Heroes have fallen...');
      }, 100);
    };

    setCombatActive(true);
    setCombatLog([...combatEngine.combatLog]);
    setWaitingForInput(false);
    setActiveCharacter(null);
    forceUpdate();
  // };

  const executeTurn = () => {
    if (combatActive) {
      // Execute turns until we reach a player character or combat ends
      while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        combatEngine.executeTurn();
        setCombatLog([...combatEngine.combatLog]);
      }
      forceUpdate();
    }
  };

  const runAutoCombat = async () => {
    if (combatActive) {
      // Switch to auto mode
      combatEngine.isManualMode = false;
      combatEngine.waitingForPlayerInput = false;
      setIsManualMode(false);
      setWaitingForInput(false);

      // Run auto combat loop with UI updates
      while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        combatEngine.executeTurn();
        setCombatLog([...combatEngine.combatLog]);
        forceUpdate();

        // Wait between turns for visibility
        if (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  const resetCombat = () => {
    setCombatActive(false);
    setCombatLog([]);
    setCurrentEnemies([]);
    setWaitingForInput(false);
    setActiveCharacter(null);
    setSelectedTarget(null);
    heroes.forEach(h => h.reset());
    forceUpdate();
  };

  // Manual combat handlers
  const useBasicAttack = () => {
    console.log('🎯 useBasicAttack called', {
      activeCharacter: activeCharacter?.name,
      selectedTarget: selectedTarget?.name,
      waitingForInput: combatEngine.waitingForPlayerInput,
      isManualMode: combatEngine.isManualMode
    });

    if (!activeCharacter || !selectedTarget || !('attack' in activeCharacter)) {
      console.log('❌ Missing requirements');
      return;
    }

    // CRITICAL: Check if this character is actually the current active character
    if (combatEngine.currentCharacter !== activeCharacter) {
      alert('It is not this character\'s turn!');
      return;
    }

    // Check if target is an enemy
    const isEnemy = 'isEnemy' in selectedTarget && selectedTarget.isEnemy;
    if (!isEnemy) {
      alert('You can only attack enemies!');
      return;
    }

    const action = (activeCharacter as any).attack(selectedTarget);
    console.log('⚔️ Attack action:', action);

    if (action) {
      combatEngine.executeManualAction(action);
      setCombatLog([...combatEngine.combatLog]);
      setSelectedTarget(null);
      setActiveCharacter(null); // Clear active character after action
      setWaitingForInput(false); // Clear waiting state
      forceUpdate();
    }
  };

  const useSkill = (skillIndex: number) => {
    if (!activeCharacter || !('useSkill' in activeCharacter)) return;

    // CRITICAL: Check if this character is actually the current active character
    if (combatEngine.currentCharacter !== activeCharacter) {
      alert('It is not this character\'s turn!');
      return;
    }

    const skill = (activeCharacter as any).getSkills()[skillIndex];
    if (!skill) return;

    // Determine targets based on skill type and name
    let targets: Combatant[] = [];

    // AOE damage skills (Multi-Shot, Chain Lightning, Meteor)
    if (skill.name === 'Multi-Shot' || skill.name === 'Chain Lightning' || skill.name === 'Meteor') {
      targets = currentEnemies.filter(e => e.isAlive);
    }
    // AOE buff skills (Battle Cry, Group Heal)
    else if (skill.name === 'Battle Cry' || skill.name === 'Group Heal') {
      targets = heroes.filter(h => h.isAlive);
    }
    // Single-target damage skills
    else if (skill.type === 'damage') {
      if (!selectedTarget) {
        alert('Please select an enemy target first!');
        return;
      }

      const isEnemy = 'isEnemy' in selectedTarget && selectedTarget.isEnemy;
      if (!isEnemy) {
        alert('Damage skills can only target enemies!');
        return;
      }

      targets = [selectedTarget];
    }
    // Heal skills (single target)
    else if (skill.type === 'heal') {
      if (!selectedTarget) {
        alert('Please select an ally to heal!');
        return;
      }

      const isEnemy = 'isEnemy' in selectedTarget && selectedTarget.isEnemy;
      if (isEnemy) {
        alert('Heal skills can only target allies!');
        return;
      }

      targets = [selectedTarget];
    }
    // Single-target buff skills (Blessing, Evasion, Mana Shield, Divine Shield)
    else if (skill.type === 'buff') {
      // Self-buffs (Evasion, Mana Shield, Divine Shield)
      if (skill.name === 'Evasion' || skill.name === 'Mana Shield' || skill.name === 'Divine Shield') {
        targets = [activeCharacter];
      }
      // Ally-target buffs (Blessing)
      else if (skill.name === 'Blessing') {
        if (!selectedTarget) {
          alert('Please select an ally to buff!');
          return;
        }

        const isEnemy = 'isEnemy' in selectedTarget && selectedTarget.isEnemy;
        if (isEnemy) {
          alert('Buff skills can only target allies!');
          return;
        }

        targets = [selectedTarget];
      }
      // Default: all allies (Battle Cry, Group Heal already handled above)
      else {
        targets = heroes.filter(h => h.isAlive);
      }
    }

    const action = (activeCharacter as any).useSkill(skillIndex, targets);
    if (action) {
      combatEngine.executeManualAction(action);
      setCombatLog([...combatEngine.combatLog]);
      setSelectedTarget(null);
      setActiveCharacter(null); // Clear active character after action
      setWaitingForInput(false); // Clear waiting state
      setSkillTooltip(null); // Close tooltip after using skill
      forceUpdate();
    } else {
      alert('Skill is on cooldown!');
    }
  };

  // Get enchant cost and chance
  const getEnchantInfo = (item: Item) => {
    const cost = (item.enchantLevel + 1) * 100;
    const chances: Record<number, number> = {
      0: 90, 1: 85, 2: 80, 3: 70, 4: 60,
      5: 50, 6: 40, 7: 35, 8: 32, 9: 30
    };
    const chance = chances[item.enchantLevel] || 30;
    return { cost, chance };
  };

  // ============================================================================
  // DUNGEON FUNCTIONS
  // ============================================================================

  const startDungeon = () => {
    console.log('🏰 Starting dungeon...');

    // Calculate average hero level
    const aliveHeroes = heroes.filter(h => h.isAlive);
    const averageHeroLevel = aliveHeroes.length > 0
      ? Math.floor(aliveHeroes.reduce((sum, h) => sum + h.level, 0) / aliveHeroes.length)
      : 1;

    const newDungeon = new Dungeon({
      name: 'The Forgotten Depths',
      startingFloor: 1,
      roomsPerFloor: { min: 5, max: 8 }, // Menší dungeon pro testování
      heroLevel: averageHeroLevel // Use hero level for loot scaling
    });
    newDungeon.start();
    console.log('🏰 Dungeon created:', newDungeon);
    console.log('🏰 Hero level for loot:', averageHeroLevel);
    console.log('🏰 Current floor:', newDungeon.getCurrentFloor());
    console.log('🏰 Current room:', newDungeon.getCurrentRoom());
    setCurrentDungeon(newDungeon);
    setUiMode('dungeon');
    forceUpdate();
  };

  const exitDungeon = () => {
    if (currentDungeon) {
      currentDungeon.end();
    }
    setCurrentDungeon(null);
    setUiMode('normal');
    forceUpdate();
  };

  const handleDungeonCombatStart = (enemies: Enemy[]) => {
    setCurrentEnemies(enemies);
    setCombatActive(true);

    // Initialize combat
    combatEngine.initialize(heroes, enemies);
    combatEngine.isManualMode = isManualMode;
    setCombatLog([...combatEngine.combatLog]);

    // Set callback for combat end (for both manual and auto modes)
    combatEngine.onCombatEnd = handleDungeonCombatEnd;

    if (isManualMode) {
      // Execute enemy turns until we reach first hero
      while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        combatEngine.executeTurn();
        setCombatLog([...combatEngine.combatLog]);
      }

      // Now set up for player input
      setWaitingForInput(true);
      setActiveCharacter(combatEngine.currentCharacter);
      forceUpdate();
    } else {
      // Run auto combat with visual updates
      runDungeonAutoCombat();
    }
  };

  const runDungeonAutoCombat = async () => {
    // Run auto combat loop with UI updates
    while (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
      combatEngine.executeTurn();
      setCombatLog([...combatEngine.combatLog]);
      forceUpdate();

      // Wait between turns for visibility
      if (combatEngine.isActive && !combatEngine.waitingForPlayerInput) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handleDungeonCombatEnd = () => {
    if (!currentDungeon) return;

    const result = currentDungeon.completeCombat(heroes);
    console.log('✅ Combat completed:', result.message);
    console.log('✅ Current room after combat:', currentDungeon.getCurrentRoom());

    // Show victory screen instead of immediately closing combat
    setCombatActive(true); // Explicitly keep combat screen visible
    setShowDungeonVictory(true);
    setWaitingForInput(false);
    setActiveCharacter(null);
    setSelectedTarget(null);
    forceUpdate();
  };

  /**
   * Handle continuing dungeon exploration after combat victory
   *
   * Checks if there are uncollected items and warns the player before proceeding.
   * Awards any remaining loot and closes the victory screen.
   */
  const handleDungeonVictoryContinue = () => {
    // Check if there are uncollected items
    const currentRoom = currentDungeon?.getCurrentRoom();
    const isEliteRoom = currentRoom && (currentRoom.type === 'elite' || currentRoom.type === 'miniboss');
    const actualLoot = isEliteRoom && currentRoom.eliteRewards
      ? currentRoom.eliteRewards
      : combatEngine.lootReward;

    const hasUncollectedItems = actualLoot && actualLoot.items && actualLoot.items.length > 0;

    // If there are uncollected items, ask for confirmation
    if (hasUncollectedItems) {
      const confirmMessage = `⚠️ ${t('dungeon.lootWarningTitle')}\n\n${t('dungeon.lootWarningMessage')}`;
      const confirm = window.confirm(confirmMessage);

      if (!confirm) {
        return; // Don't continue if user cancels
      }
    }

    // Award remaining loot to player (gold is always auto-collected)
    if (combatEngine.lootReward) {
      inventory.gold += combatEngine.lootReward.gold;
      combatEngine.lootReward.items.forEach(item => {
        inventory.addItem(item);
      });
    }

    // Close combat and victory screen
    setShowDungeonVictory(false);
    setCombatActive(false);

    // Increment update key to force DungeonExplorer to re-render
    setDungeonUpdateKey(prev => prev + 1);
    forceUpdate();
  };

  const handleDungeonTreasureLoot = (gold: number, items: Item[]) => {
    inventory.gold += gold;
    items.forEach(item => {
      inventory.addItem(item);
    });
    forceUpdate();
  };

  const handleDungeonFloorComplete = () => {
    console.log('Floor completed!');
    forceUpdate();
  };

  // ============================================================================
  // CONDITIONAL RENDERING
  // ============================================================================

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ============================================================================
  // MAIN GAME UI (only shown when authenticated)
  // ============================================================================
  return (
    <>
      <div className="container">
        <header>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>⚔️ Looters Land</h1>
              <h2>Idle RPG Adventure - Loot, Fight, Conquer!</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#888' }}>{userEmail}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

      {/* Worldmap Mode v2.0 UI (NEW GAME LOOP) */}
      {uiMode === 'worldmap2' && (
        <WorldMapDemo2
          userEmail={userEmail}
          onEnterDungeon={(dungeonEntrance) => {
            console.log('🏰 Entering dungeon from worldmap:', dungeonEntrance);

            // Calculate average hero level
            const aliveHeroes = heroes.filter(h => h.isAlive);
            const averageHeroLevel = aliveHeroes.length > 0
              ? Math.floor(aliveHeroes.reduce((sum, h) => sum + h.level, 0) / aliveHeroes.length)
              : 1;

            // Calculate dungeon difficulty multiplier based on entrance difficulty
            const difficultyMap = {
              'Easy': 0.8,
              'Medium': 1.0,
              'Hard': 1.3,
              'Nightmare': 1.6
            };
            const difficultyMultiplier = difficultyMap[dungeonEntrance.difficulty];

            // Adjust hero level based on difficulty and recommended level
            const adjustedHeroLevel = Math.max(
              dungeonEntrance.recommendedLevel,
              Math.floor(averageHeroLevel * difficultyMultiplier)
            );

            // Rooms per floor based on dungeon difficulty
            const roomsConfig = {
              'Easy': { min: 4, max: 6 },
              'Medium': { min: 5, max: 8 },
              'Hard': { min: 6, max: 10 },
              'Nightmare': { min: 8, max: 12 }
            };

            // Create unique dungeon based on the entrance data
            const newDungeon = new Dungeon({
              name: dungeonEntrance.name,
              startingFloor: 1,
              roomsPerFloor: roomsConfig[dungeonEntrance.difficulty],
              heroLevel: adjustedHeroLevel
            });

            // Override ID with dungeon entrance ID for consistent generation
            newDungeon.id = dungeonEntrance.id;
            newDungeon.start();

            // Set dungeon and switch to dungeon mode
            setCurrentDungeon(newDungeon);
            setUiMode('dungeon');
            forceUpdate();
          }}
        />
      )}

      {/* Worldmap Mode v1.0 UI (OLD) */}
      {uiMode === 'worldmap' && (
        <>
          <div style={{ textAlign: 'center', padding: '20px', background: '#2a2a2a', borderRadius: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setUiMode('worldmap2')}
              style={{
                padding: '12px 24px',
                background: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              🆕 Try New UI (v2.0)
            </button>
            <button
              onClick={() => setUiMode('normal')}
              style={{
                padding: '12px 24px',
                background: '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              ← Back to Game
            </button>
            <button
              onClick={startDungeon}
              style={{
                padding: '12px 24px',
                background: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🕳️ Enter Dungeon (Test)
            </button>
          </div>
          <WorldMapDemo />
        </>
      )}

      {/* Dungeon Mode UI */}
      {uiMode === 'dungeon' && currentDungeon && (
        <DungeonExplorer
          dungeon={currentDungeon}
          dungeonUpdateKey={dungeonUpdateKey}
          heroes={heroes}
          onCombatStart={handleDungeonCombatStart}
          onTreasureLooted={handleDungeonTreasureLoot}
          onDungeonExit={exitDungeon}
          onFloorComplete={handleDungeonFloorComplete}
        />
      )}

      {/* Normal Mode UI */}
      {uiMode === 'normal' && !combatActive && (
        <>
      {/* Hero Selector */}
      <div className="hero-selector">
        <h3>Select Hero</h3>
        <div className="hero-buttons">
          {heroes.map((hero, index) => (
            <button
              key={hero.id}
              className={`hero-btn ${index === selectedHeroIndex ? 'active' : ''}`}
              onClick={() => setSelectedHeroIndex(index)}
            >
              {CLASS_ICONS[hero.class]} {hero.name} (Lv.{hero.level})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="equipment-grid">
        {/* Equipment Panel */}
        <div className="equipment-panel">
          <h3>⚔️ Equipment</h3>

          {/* Hero Info */}
          <div className="hero-info">
            <h2 style={{ margin: 0, marginBottom: '10px' }}>
              {CLASS_ICONS[selectedHero.class]} {selectedHero.name}
            </h2>

            {/* XP Progress Bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px',
                fontSize: '0.9em',
                color: '#ccc'
              }}>
                <span>Level {selectedHero.level}</span>
                <span>{selectedHero.experience}/{selectedHero.requiredXP} XP</span>
              </div>
              <div style={{
                width: '100%',
                height: '20px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  width: `${(selectedHero.experience / selectedHero.requiredXP) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #4a90e2, #63b3ed)',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75em',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {((selectedHero.experience / selectedHero.requiredXP) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div id="hero-stats">
              <div className="stat-item">
                <strong>HP:</strong>
                <span>{selectedHero.currentHP}/{selectedHero.maxHP}</span>
              </div>
              <div className="stat-item">
                <strong>ATK:</strong>
                <span>{selectedHero.ATK}</span>
              </div>
              <div className="stat-item">
                <strong>DEF:</strong>
                <span>{selectedHero.DEF}</span>
              </div>
              <div className="stat-item">
                <strong>SPD:</strong>
                <span>{selectedHero.SPD}</span>
              </div>
              <div className="stat-item">
                <strong>CRIT:</strong>
                <span>{selectedHero.CRIT}%</span>
              </div>
              <div className="stat-item">
                <strong>Power:</strong>
                <span>{selectedHero.equipment?.getPowerScore().toFixed(0) || 0}</span>
              </div>
            </div>
          </div>

          {/* Equipment Slots */}
          <div className="equipment-slots">
            {Object.entries(selectedHero.equipment?.slots || {}).map(([slotName, item]) => (
              <div
                key={slotName}
                className={`equipment-slot ${item ? 'has-item' : 'empty'}`}
                onMouseEnter={(e) => item && showTooltip(item, e)}
                onMouseMove={(e) => item && updateTooltipPosition(e)}
                onMouseLeave={hideTooltip}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (item) openEnchantPanel(item);
                }}
              >
                <div className="slot-label">{slotName}</div>
                {item ? (
                  <div className="equipped-item">
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-name" style={{ color: item.getRarityColor() }}>
                      {item.getDisplayName()}
                    </div>
                    <div className="item-stats-preview" style={{ fontSize: '0.75em' }}>
                      {item.getRarityDisplayName()}
                    </div>
                    <button
                      className="unequip-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        unequipItem(slotName);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="empty-slot">Empty</div>
                )}
              </div>
            ))}
          </div>

          {/* Set Bonuses */}
          <div className="set-bonuses">
            <h4>Set Bonuses</h4>
            {selectedHero.equipment?.getActiveSetBonuses().length === 0 ? (
              <p style={{ color: '#999', fontSize: '0.9em' }}>No active set bonuses</p>
            ) : (
              selectedHero.equipment?.getActiveSetBonuses().map((setInfo, index) => (
                <div key={index} className="set-bonus-item">
                  <h5>{setInfo.setName} ({setInfo.pieces} pieces)</h5>
                  {setInfo.bonuses.map((bonus, bIndex) => (
                    <div key={bIndex} className={`bonus-line ${bonus.active ? 'active' : 'inactive'}`}>
                      {bonus.pieces} pieces: {Object.entries(bonus.bonus)
                        .filter(([key]) => key !== 'special')
                        .map(([stat, value]) => `${stat} +${value}`)
                        .join(', ')}
                      {bonus.bonus.special && ` (${bonus.bonus.special})`}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Equipment Actions */}
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={autoEquipBest}>
              Auto-Equip Best
            </button>
          </div>
        </div>

        {/* Inventory Panel */}
        <div className="inventory-panel">
          <h3>🎒 Inventory</h3>

          {/* Inventory Info */}
          <div className="inventory-info">
            <div className="info-row">
              <span><strong>Slots:</strong> {inventory.items.length}/{inventory.maxSlots}</span>
              <span><strong>Gold:</strong> 💰 {inventory.gold}</span>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="inventory-grid">
            {inventory.getFilteredItems().length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#999' }}>
                <p>Inventory is empty</p>
                <p style={{ fontSize: '0.9em' }}>Generate some items below!</p>
              </div>
            ) : (
              inventory.getFilteredItems().map((item) => (
                <div
                  key={item.id}
                  className={`inventory-item rarity-${item.rarity}`}
                  onClick={() => equipItem(item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    openEnchantPanel(item);
                  }}
                  onMouseEnter={(e) => showTooltip(item, e)}
                  onMouseMove={updateTooltipPosition}
                  onMouseLeave={hideTooltip}
                >
                  <div className="item-icon">{item.icon}</div>
                  <div className="item-name">{item.getDisplayName()}</div>
                  <div className="item-level">Lv.{item.level}</div>
                </div>
              ))
            )}
          </div>

          {/* Inventory Actions */}
          <div className="inventory-actions">
            <button className="btn btn-primary" onClick={expandInventory}>
              Expand (+10 slots, 500g)
            </button>
            <button className="btn btn-warning" onClick={autoSellCommon}>
              Auto-Sell Common
            </button>
          </div>
        </div>
      </div>

      {/* Save/Load Panel */}
      <div className="testing-panel" style={{ marginBottom: '20px' }}>
        <h3>💾 Save / Load Game</h3>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="saveName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Save Name:
          </label>
          <input
            id="saveName"
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '5px',
              border: '2px solid #2a5298',
              fontSize: '1em'
            }}
            placeholder="Enter save name..."
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={saveGame}
            disabled={isSaving}
            style={{ flex: 1, minWidth: '120px' }}
          >
            {isSaving ? 'Saving...' : '💾 Save Game'}
          </button>
          <button
            className="btn btn-success"
            onClick={loadGame}
            disabled={isLoading}
            style={{ flex: 1, minWidth: '120px' }}
          >
            {isLoading ? 'Loading...' : '📂 Load Game'}
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#666', fontStyle: 'italic' }}>
          User ID: {userId.substring(0, 20)}...
        </div>
      </div>

      {/* Testing Panel */}
      <div className="testing-panel">
        <h3>🧪 Testing Tools</h3>
        <button className="btn btn-primary" onClick={generateRandomItems}>
          Generate 10 Random Items
        </button>
        <button className="btn btn-warning" onClick={generateLegendary}>
          Generate Legendary Item
        </button>
        <button className="btn btn-success" onClick={addGold}>
          Add 1000 Gold
        </button>
        <button className="btn btn-danger" onClick={clearInventory}>
          Clear Inventory
        </button>
      </div>

      {/* Dungeon Entry */}
      <div className="testing-panel" style={{ marginBottom: '20px' }}>
        <h3>🏰 Dungeon System</h3>

        {/* Combat Mode Toggle */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isManualMode}
              onChange={(e) => setIsManualMode(e.target.checked)}
              style={{ cursor: 'pointer', width: '20px', height: '20px' }}
            />
            <span style={{ fontSize: '16px' }}>
              🎮 Manual Combat Mode {isManualMode ? '(Choose actions)' : '(Auto combat)'}
            </span>
          </label>
        </div>

        <button
          className="btn btn-primary"
          onClick={startDungeon}
          style={{
            fontSize: '18px',
            padding: '15px 30px',
            backgroundColor: '#8b4513',
            border: '2px solid #654321',
            width: '100%',
            marginBottom: '15px'
          }}
        >
          🗝️ Enter Dungeon
        </button>

        <button
          className="btn btn-primary"
          onClick={() => setUiMode('worldmap')}
          style={{
            fontSize: '18px',
            padding: '15px 30px',
            backgroundColor: '#2d5016',
            border: '2px solid #1a3010',
            width: '100%'
          }}
        >
          🗺️ Open Worldmap (NEW!)
        </button>

        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
          Explore procedurally generated dungeons with combat, treasure, traps, and bosses!
        </p>
      </div>
        </>
      )}

      </div>

      {/* Combat Display - Global (works in both Normal and Dungeon mode) */}
      {combatActive && (
        <div className="combat-container" style={{ marginTop: '20px' }}>
          <div className="combat-grid">
            {/* Combat Arena */}
            <div className="combat-arena">
              {/* Combat Status */}
              <div
                className={`combat-status ${
                  combatEngine.combatResult === 'victory'
                    ? 'victory'
                    : combatEngine.combatResult === 'defeat'
                    ? 'defeat'
                    : ''
                }`}
              >
                {combatEngine.combatResult
                  ? combatEngine.combatResult === 'victory'
                    ? '🎉 VICTORY! 🎉'
                    : '💀 DEFEAT 💀'
                  : `⚔️ COMBAT IN PROGRESS - TURN ${combatEngine.turnCounter}`}
              </div>

              {/* Loot Rewards Display */}
              {combatEngine.combatResult === 'victory' && combatEngine.lootReward && (() => {
                // Determine actual loot to display (elite rewards or standard combat loot)
                const currentRoom = currentDungeon?.getCurrentRoom();
                const isEliteRoom = currentRoom && (currentRoom.type === 'elite' || currentRoom.type === 'miniboss');
                const actualLoot = isEliteRoom && currentRoom.eliteRewards
                  ? currentRoom.eliteRewards
                  : combatEngine.lootReward;

                return (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    borderRadius: '12px',
                    border: '3px solid #f0c000',
                    boxShadow: '0 4px 8px rgba(255, 215, 0, 0.3)'
                  }}>
                    <h3 style={{
                      color: '#8b6914',
                      marginBottom: '15px',
                      textAlign: 'center',
                      fontSize: '1.5em',
                      fontWeight: 'bold'
                    }}>
                      💰 {t('dungeon.lootRewards')}
                    </h3>

                    {/* Dungeon mode instruction */}
                    {uiMode === 'dungeon' && showDungeonVictory && (
                      <div style={{
                        padding: '10px',
                        background: 'rgba(139, 105, 20, 0.1)',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        textAlign: 'center',
                        color: '#8b6914',
                        fontSize: '0.9em'
                      }}>
                        💡 {t('dungeon.collectInstructions')}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      marginBottom: '15px'
                    }}>
                      {/* Gold Reward */}
                      <div style={{
                        flex: 1,
                        padding: '15px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '2px solid #f0c000'
                      }}>
                        <div style={{ fontSize: '2em', marginBottom: '5px' }}>💰</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#8b6914' }}>
                          {actualLoot.gold} {t('dungeon.gold')}
                        </div>
                      </div>

                      {/* Items Count */}
                      <div style={{
                        flex: 1,
                        padding: '15px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '2px solid #f0c000'
                      }}>
                        <div style={{ fontSize: '2em', marginBottom: '5px' }}>🎁</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#8b6914' }}>
                          {actualLoot.items.length} {actualLoot.items.length !== 1 ? t('dungeon.items') : t('dungeon.items').slice(0, -1)}
                        </div>
                      </div>
                    </div>

                    {/* Loot Items */}
                    {actualLoot.items.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '10px',
                      padding: '15px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '8px'
                    }}>
                      {actualLoot.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          style={{
                            padding: '10px',
                            background: '#fff',
                            borderRadius: '6px',
                            border: `2px solid ${item.getRarityColor()}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => {
                            setLootItemModal(item);
                          }}
                        >
                          <div style={{ fontSize: '2em', marginBottom: '5px' }}>{item.icon}</div>
                          <div style={{
                            fontSize: '0.9em',
                            fontWeight: 'bold',
                            color: item.getRarityColor(),
                            marginBottom: '3px'
                          }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.75em', color: '#666' }}>
                            {item.getRarityDisplayName()} | Lv.{item.level}
                          </div>
                          <div style={{
                            fontSize: '0.75em',
                            color: '#007bff',
                            marginTop: '5px',
                            fontWeight: 'bold'
                          }}>
                            Click for options
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                    {/* Collect All / Sell All Buttons */}
                    {actualLoot.items.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            // Check if there's enough space
                            const availableSlots = inventory.maxSlots - inventory.items.length;
                            const itemsToCollect = actualLoot.items.length;

                            if (itemsToCollect > availableSlots) {
                              alert(`Not enough space! You have ${availableSlots} slots available but ${itemsToCollect} items to collect. Sell some items first.`);
                              return;
                            }

                            actualLoot.items.forEach((item: any) => {
                              inventory.addItem(item);
                            });
                            inventory.gold += actualLoot.gold;

                            // Clear the actual source
                            if (isEliteRoom && currentRoom?.eliteRewards) {
                              currentRoom.eliteRewards.items = [];
                              currentRoom.eliteRewards.gold = 0;
                            } else if (combatEngine.lootReward) {
                              combatEngine.lootReward.items = [];
                              combatEngine.lootReward.gold = 0;
                            }
                            forceUpdate();
                          }}
                          style={{
                            flex: 1,
                            fontSize: '1.1em',
                            padding: '12px'
                          }}
                        >
                          ✨ Collect All
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => {
                            // Add gold from loot
                            inventory.gold += actualLoot.gold;

                            // Sell all items for their gold value
                            let itemsSoldGold = 0;
                            actualLoot.items.forEach((item: any) => {
                              itemsSoldGold += item.goldValue;
                            });
                            inventory.gold += itemsSoldGold;

                            // Clear the actual source
                            if (isEliteRoom && currentRoom?.eliteRewards) {
                              currentRoom.eliteRewards.items = [];
                              currentRoom.eliteRewards.gold = 0;
                            } else if (combatEngine.lootReward) {
                              combatEngine.lootReward.items = [];
                              combatEngine.lootReward.gold = 0;
                            }
                            forceUpdate();
                          }}
                          style={{
                            flex: 1,
                            fontSize: '1.1em',
                            padding: '12px'
                          }}
                        >
                          💰 Sell All
                        </button>
                      </div>
                    )}

                    {actualLoot.items.length === 0 && actualLoot.gold === 0 && (
                      <div style={{
                        padding: '15px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        ✅ All loot collected!
                      </div>
                    )}

                    {/* Continue Exploring Button (Dungeon Mode Only) - Show always in dungeon victory */}
                    {uiMode === 'dungeon' && showDungeonVictory && (
                      <button
                        className="btn btn-primary"
                        onClick={handleDungeonVictoryContinue}
                        style={{
                          width: '100%',
                          fontSize: '1.3em',
                          padding: '15px',
                          marginTop: '20px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }}
                      >
                        🗺️ Continue Exploring
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Combat Mode Toggle - Hidden during dungeon victory screen */}
              {!combatEngine.combatResult && !(uiMode === 'dungeon' && showDungeonVictory) && (
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '15px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <button
                    className={`btn ${!isManualMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setIsManualMode(false);
                      combatEngine.setManualMode(false);
                      combatEngine.waitingForPlayerInput = false;
                      setWaitingForInput(false);
                      setActiveCharacter(null);
                      setSelectedTarget(null);

                      // If in dungeon and combat is still active, restart auto-combat loop
                      if (uiMode === 'dungeon' && combatEngine.isActive) {
                        runDungeonAutoCombat();
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    🤖 Auto Combat
                  </button>
                  <button
                    className={`btn ${isManualMode ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setIsManualMode(true);
                      combatEngine.setManualMode(true);

                      // Check if current character in turn order is a hero
                      if (combatEngine.turnOrder.length > 0) {
                        const currentChar = combatEngine.turnOrder[0];
                        const isHero = !('isEnemy' in currentChar && currentChar.isEnemy);

                        if (isHero && currentChar.isAlive) {
                          // Activate manual input mode for this hero
                          combatEngine.waitingForPlayerInput = true;
                          combatEngine.currentCharacter = currentChar;
                          setWaitingForInput(true);
                          setActiveCharacter(currentChar);
                          setSelectedTarget(null);

                          if (combatEngine.onWaitForInput) {
                            combatEngine.onWaitForInput(currentChar);
                          }
                        }
                      }

                      forceUpdate();
                    }}
                    style={{ flex: 1 }}
                  >
                    🎮 Manual Control
                  </button>
                </div>
              )}

              {/* Combat Teams */}
              <div className="combat-teams">
                {/* Heroes */}
                <div className="combat-team heroes">
                  <h4>🛡️ Heroes</h4>
                  {heroes.map((hero) => (
                    <div
                      key={hero.id}
                      className={`character-card ${!hero.isAlive ? 'dead' : ''} ${
                        selectedTarget?.id === hero.id ? 'active' : ''
                      }`}
                      onClick={() => waitingForInput && setSelectedTarget(hero)}
                      style={{ cursor: waitingForInput ? 'pointer' : 'default' }}
                    >
                      <div className="character-header">
                        <span className="character-name">
                          {CLASS_ICONS[hero.class]} {hero.name}
                          {hero.statusEffects && hero.statusEffects.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showStatusTooltip(hero, e);
                              }}
                              style={{
                                marginLeft: '5px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                padding: '0 4px'
                              }}
                              title="View status effects"
                            >
                              ℹ️
                            </button>
                          )}
                        </span>
                        <span className="character-level">Lv.{hero.level}</span>
                      </div>

                      <div className="character-hp-bar">
                        <div
                          className={`character-hp-fill ${
                            hero.currentHP / hero.maxHP < 0.3
                              ? 'critical'
                              : hero.currentHP / hero.maxHP < 0.6
                              ? 'low'
                              : ''
                          }`}
                          style={{ width: `${(hero.currentHP / hero.maxHP) * 100}%` }}
                        />
                        <span className="character-hp-text">
                          {hero.currentHP}/{hero.maxHP}
                        </span>
                      </div>

                      {/* XP Bar */}
                      <div style={{
                        width: '100%',
                        height: '12px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginTop: '5px',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}>
                        <div style={{
                          width: `${(hero.experience / hero.requiredXP) * 100}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #4a90e2, #63b3ed)',
                          transition: 'width 0.3s ease'
                        }} title={`XP: ${hero.experience}/${hero.requiredXP}`} />
                      </div>

                      <div className="character-stats">
                        <span className="character-stat">⚔️ {hero.ATK}</span>
                        <span className="character-stat">🛡️ {hero.DEF}</span>
                        <span className="character-stat">⚡ {hero.SPD}</span>
                        <span className="character-stat">🎯 {hero.CRIT}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enemies */}
                <div className="combat-team enemies">
                  <h4>👹 Enemies</h4>
                  {currentEnemies.map((enemy) => {
                    // Get enemy type styling
                    const getEnemyTypeStyle = () => {
                      const baseStyle: React.CSSProperties = {
                        cursor: waitingForInput ? 'pointer' : 'default'
                      };

                      if (enemy.type === 'boss') {
                        return {
                          ...baseStyle,
                          border: '3px solid #ff4444',
                          background: 'linear-gradient(135deg, #5a1515 0%, #3a1010 100%)',
                          boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
                          color: '#ffffff'
                        };
                      } else if (enemy.type === 'elite') {
                        return {
                          ...baseStyle,
                          border: '3px solid #ffaa00',
                          background: 'linear-gradient(135deg, #5a3a10 0%, #3a2510 100%)',
                          boxShadow: '0 0 15px rgba(255, 170, 0, 0.4)',
                          color: '#ffffff'
                        };
                      }
                      return baseStyle;
                    };

                    return (
                    <div
                      key={enemy.id}
                      className={`character-card ${!enemy.isAlive ? 'dead' : ''} ${
                        selectedTarget?.id === enemy.id ? 'active' : ''
                      }`}
                      onClick={() => waitingForInput && setSelectedTarget(enemy)}
                      style={getEnemyTypeStyle()}
                    >
                      <div className="character-header">
                        <span
                          className="character-name"
                          style={enemy.type !== 'normal' ? { color: '#ffffff' } : {}}
                        >
                          {enemy.type === 'boss' && '💀 '}
                          {enemy.type === 'elite' && '⭐ '}
                          {enemy.name}
                          {enemy.statusEffects && enemy.statusEffects.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showStatusTooltip(enemy, e);
                              }}
                              style={{
                                marginLeft: '5px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                padding: '0 4px'
                              }}
                              title="View status effects"
                            >
                              ℹ️
                            </button>
                          )}
                        </span>
                        <span className="character-level">Lv.{enemy.level}</span>
                      </div>

                      <div className="character-hp-bar">
                        <div
                          className={`character-hp-fill ${
                            enemy.currentHP / enemy.maxHP < 0.3
                              ? 'critical'
                              : enemy.currentHP / enemy.maxHP < 0.6
                              ? 'low'
                              : ''
                          }`}
                          style={{ width: `${(enemy.currentHP / enemy.maxHP) * 100}%` }}
                        />
                        <span
                          className="character-hp-text"
                          style={enemy.type !== 'normal' ? { color: '#ffffff' } : {}}
                        >
                          {enemy.currentHP}/{enemy.maxHP}
                        </span>
                      </div>

                      <div className="character-stats">
                        <span
                          className="character-stat"
                          style={enemy.type !== 'normal' ? { color: '#ffffff' } : {}}
                        >
                          ⚔️ {enemy.ATK}
                        </span>
                        <span
                          className="character-stat"
                          style={enemy.type !== 'normal' ? { color: '#ffffff' } : {}}
                        >
                          🛡️ {enemy.DEF}
                        </span>
                        <span
                          className="character-stat"
                          style={enemy.type !== 'normal' ? { color: '#ffffff' } : {}}
                        >
                          ⚡ {enemy.SPD}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Combat Log */}
              <div className="combat-log-container">
                <h4>📜 Combat Log</h4>
                <div className="combat-log">
                  {combatLog.map((entry, index) => (
                    <div key={index} className={`combat-log-entry ${entry.type}`}>
                      {entry.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Combat Controls */}
            <div className="combat-controls">
              <h4>⚙️ Controls</h4>

              {/* Manual Control UI - shown when waiting for player input */}
              {waitingForInput && activeCharacter && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                    🎯 {activeCharacter.name}'s Turn
                  </h5>

                  {/* Skills */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9em' }}>Skills:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {('getSkills' in activeCharacter) && (activeCharacter as any).getSkills().map((skill: any, index: number) => {
                        const cd = activeCharacter.cooldowns.get(skill.name) || 0;
                        return (
                          <div key={index} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => useSkill(index)}
                              onMouseEnter={!isMobile ? (e) => showSkillTooltip(skill, e) : undefined}
                              onMouseMove={!isMobile ? updateSkillTooltipPosition : undefined}
                              onMouseLeave={!isMobile ? hideSkillTooltip : undefined}
                              disabled={cd > 0}
                              style={{
                                fontSize: '0.85em',
                                padding: '6px 10px',
                                opacity: cd > 0 ? 0.5 : 1,
                                flex: 1
                              }}
                            >
                              {skill.name} {cd > 0 && `(CD: ${cd})`}
                            </button>
                            {isMobile && (
                              <button
                                className="btn btn-sm btn-info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showSkillTooltip(skill, e);
                                }}
                                style={{
                                  fontSize: '0.9em',
                                  padding: '4px 8px',
                                  minWidth: '32px'
                                }}
                                title="Show skill info"
                              >
                                ℹ️
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Basic Attack */}
                  <button
                    className="btn btn-success"
                    onClick={useBasicAttack}
                    disabled={!selectedTarget}
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    ⚔️ Basic Attack {selectedTarget && `→ ${selectedTarget.name}`}
                  </button>

                  {/* Target Selection Help */}
                  <div style={{ fontSize: '0.85em', color: '#856404', textAlign: 'center' }}>
                    {selectedTarget
                      ? `Target: ${selectedTarget.name}`
                      : '👆 Click on a character to select target'}
                  </div>
                </div>
              )}

              <div className="combat-buttons">
                <button
                  className="btn btn-primary"
                  onClick={executeTurn}
                  disabled={!combatActive || combatEngine.combatResult !== null}
                >
                  ▶️ Next Turn
                </button>

                <button
                  className="btn btn-warning"
                  onClick={runAutoCombat}
                  disabled={!combatActive || combatEngine.combatResult !== null}
                >
                  🤖 Auto Combat
                </button>

                <button className="btn btn-danger" onClick={resetCombat}>
                  🔄 Reset Combat
                </button>
              </div>

              <div className="combat-stats">
                <div className="stat-box">
                  <div className="stat-label">Turn</div>
                  <div className="stat-value">{combatEngine.turnCounter}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Heroes Alive</div>
                  <div className="stat-value">
                    {heroes.filter((h) => h.isAlive).length}/{heroes.length}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Enemies Alive</div>
                  <div className="stat-value">
                    {currentEnemies.filter((e) => e.isAlive).length}/{currentEnemies.length}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Status</div>
                  <div className="stat-value" style={{ fontSize: '1em' }}>
                    {combatEngine.combatResult
                      ? combatEngine.combatResult === 'victory'
                        ? '✅ Won'
                        : '❌ Lost'
                      : '⚔️ Active'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip - outside container */}
      {tooltip && (
        <div
          className="item-tooltip"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          <div className="tooltip-header">
            <div className="tooltip-name" style={{ color: tooltip.item.getRarityColor() }}>
              {tooltip.item.icon} {tooltip.item.getDisplayName()}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              {tooltip.item.getRarityDisplayName()} {tooltip.item.slot.charAt(0).toUpperCase() + tooltip.item.slot.slice(1)} | Lv.{tooltip.item.level}
            </div>
            {tooltip.item.enchantLevel > 0 && (
              <div style={{ fontSize: '0.9em', color: '#9c27b0', fontWeight: 'bold' }}>
                +{tooltip.item.enchantLevel} Enchant
              </div>
            )}
            {tooltip.item.setName && (
              <div style={{ fontSize: '0.9em', color: '#2196f3', fontWeight: 'bold' }}>
                {tooltip.item.setName} Set
              </div>
            )}
          </div>

          <div className="tooltip-stats">
            {(() => {
              const stats = tooltip.item.getEffectiveStats();
              return (
                <>
                  {stats.HP > 0 && (
                    <div className="tooltip-stat">
                      <span>HP:</span>
                      <span className="stat-positive">+{stats.HP}</span>
                    </div>
                  )}
                  {stats.ATK > 0 && (
                    <div className="tooltip-stat">
                      <span>ATK:</span>
                      <span className="stat-positive">+{stats.ATK}</span>
                    </div>
                  )}
                  {stats.DEF > 0 && (
                    <div className="tooltip-stat">
                      <span>DEF:</span>
                      <span className="stat-positive">+{stats.DEF}</span>
                    </div>
                  )}
                  {stats.SPD > 0 && (
                    <div className="tooltip-stat">
                      <span>SPD:</span>
                      <span className="stat-positive">+{stats.SPD}</span>
                    </div>
                  )}
                  {stats.CRIT > 0 && (
                    <div className="tooltip-stat">
                      <span>CRIT:</span>
                      <span className="stat-positive">+{stats.CRIT}%</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="tooltip-actions">
            <div>💰 Value: {tooltip.item.goldValue} gold</div>
            <div style={{ marginTop: '5px', fontSize: '0.85em', fontStyle: 'italic' }}>
              Left-click to equip | Right-click to enchant
            </div>
          </div>
        </div>
      )}

      {/* Enchanting Panel - outside container */}
      {enchantingItem && (
        <div className="enchanting-panel" onClick={closeEnchantPanel}>
          <div className="enchanting-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#2a5298', marginBottom: '20px' }}>✨ Enchant Item</h2>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3em', marginBottom: '10px' }}>{enchantingItem.icon}</div>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: enchantingItem.getRarityColor(), marginBottom: '5px' }}>
                {enchantingItem.getDisplayName()}
              </div>
              <div style={{ color: '#666' }}>
                {enchantingItem.getRarityDisplayName()} {enchantingItem.slot.charAt(0).toUpperCase() + enchantingItem.slot.slice(1)} | Lv.{enchantingItem.level}
              </div>
            </div>

            <div className="enchant-details">
              <p><strong>Current Level:</strong> +{enchantingItem.enchantLevel}</p>
              <p><strong>Next Level:</strong> +{enchantingItem.enchantLevel + 1}</p>
              <p><strong>Success Chance:</strong> {getEnchantInfo(enchantingItem).chance}%</p>
              <p><strong>Cost:</strong> {getEnchantInfo(enchantingItem).cost} gold</p>
            </div>

            {enchantResult && (
              <div className={`enchant-result ${enchantResult.success ? 'success' : 'failure'}`}>
                {enchantResult.message}
              </div>
            )}

            <div className="enchant-buttons">
              <button className="btn btn-primary" onClick={() => attemptEnchant(false)}>
                Attempt Enchant ({getEnchantInfo(enchantingItem).cost}g)
              </button>
              <button className="btn btn-warning" onClick={() => attemptEnchant(true)}>
                Guarantee (50g)
              </button>
              <button className="btn btn-danger" onClick={sellEnchantingItem}>
                Sell ({enchantingItem.goldValue}g)
              </button>
              <button className="btn btn-secondary" onClick={closeEnchantPanel}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loot Item Modal - outside container */}
      {lootItemModal && (
        <div className="enchanting-panel" onClick={() => setLootItemModal(null)}>
          <div className="enchanting-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#d4af37', marginBottom: '20px' }}>💰 Loot Item</h2>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3em', marginBottom: '10px' }}>{lootItemModal.icon}</div>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: lootItemModal.getRarityColor(), marginBottom: '5px' }}>
                {lootItemModal.name}
              </div>
              <div style={{ color: '#666' }}>
                {lootItemModal.getRarityDisplayName()} {lootItemModal.slot.charAt(0).toUpperCase() + lootItemModal.slot.slice(1)} | Lv.{lootItemModal.level}
              </div>
            </div>

            <div className="enchant-details">
              <p><strong>Stats:</strong></p>
              {(() => {
                const stats = lootItemModal.getEffectiveStats();
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    {stats.HP > 0 && <div>HP: +{stats.HP}</div>}
                    {stats.ATK > 0 && <div>ATK: +{stats.ATK}</div>}
                    {stats.DEF > 0 && <div>DEF: +{stats.DEF}</div>}
                    {stats.SPD > 0 && <div>SPD: +{stats.SPD}</div>}
                    {stats.CRIT > 0 && <div>CRIT: +{stats.CRIT}%</div>}
                  </div>
                );
              })()}
              <p style={{ marginTop: '10px' }}><strong>Value:</strong> {lootItemModal.goldValue} gold</p>
            </div>

            <div className="enchant-buttons">
              <button
                className="btn btn-success"
                onClick={() => {
                  // Check if there's space
                  if (inventory.items.length >= inventory.maxSlots) {
                    alert(`Inventory full! (${inventory.items.length}/${inventory.maxSlots}). Sell some items first.`);
                    return;
                  }

                  if (combatEngine.lootReward) {
                    inventory.addItem(lootItemModal);
                    inventory.gold += combatEngine.lootReward.gold;

                    // Remove item from loot
                    const itemIndex = combatEngine.lootReward.items.indexOf(lootItemModal);
                    if (itemIndex > -1) {
                      combatEngine.lootReward.items.splice(itemIndex, 1);
                    }

                    // Clear gold after first collection
                    combatEngine.lootReward.gold = 0;

                    setLootItemModal(null);
                    forceUpdate();
                  }
                }}
              >
                ✨ Collect
              </button>
              <button
                className="btn btn-warning"
                onClick={() => {
                  if (combatEngine.lootReward) {
                    inventory.gold += lootItemModal.goldValue + combatEngine.lootReward.gold;

                    // Remove item from loot
                    const itemIndex = combatEngine.lootReward.items.indexOf(lootItemModal);
                    if (itemIndex > -1) {
                      combatEngine.lootReward.items.splice(itemIndex, 1);
                    }

                    // Clear gold
                    combatEngine.lootReward.gold = 0;

                    setLootItemModal(null);
                    forceUpdate();
                  }
                }}
              >
                💰 Sell ({lootItemModal.goldValue}g)
              </button>
              <button className="btn btn-secondary" onClick={() => setLootItemModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Tooltip */}
      {skillTooltip && (
        <>
          {/* Overlay for mobile only - click to close */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              onClick={hideSkillTooltip}
            />
          )}
          {/* Tooltip */}
          <div
            className="tooltip-container"
            style={{
              left: skillTooltip.x + 10,
              top: skillTooltip.y + 10,
              zIndex: 999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tooltip-header">
              <span className="tooltip-name">{skillTooltip.skill.name}</span>
              <span className="tooltip-cooldown">CD: {skillTooltip.skill.cooldown} turns</span>
            </div>
            <div className="tooltip-type">
              {skillTooltip.skill.type === 'damage' && '⚔️ Damage'}
              {skillTooltip.skill.type === 'heal' && '💚 Heal'}
              {skillTooltip.skill.type === 'buff' && '✨ Buff'}
              {skillTooltip.skill.type === 'debuff' && '💀 Debuff'}
            </div>
            <div className="tooltip-description">{skillTooltip.skill.description}</div>
            {/* Close button for mobile only */}
            {isMobile && (
              <button
                onClick={hideSkillTooltip}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '6px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '0.85em',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            )}
          </div>
        </>
      )}

      {/* Status Effects Tooltip */}
      {statusTooltip && (
        <>
          {/* Overlay - click to close (transparent on desktop, visible on mobile) */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
              background: isMobile ? 'rgba(0, 0, 0, 0.3)' : 'transparent'
            }}
            onClick={hideStatusTooltip}
          />
          {/* Tooltip */}
          <div
            className="tooltip-container"
            style={{
              left: statusTooltip.x + 10,
              top: statusTooltip.y + 10,
              zIndex: 999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tooltip-header">
              <span className="tooltip-name">{statusTooltip.character.name}</span>
              <span style={{ fontSize: '0.9em', color: '#666' }}>Status Effects</span>
            </div>

            {statusTooltip.character.statusEffects && statusTooltip.character.statusEffects.length > 0 ? (
              <div style={{ marginTop: '10px' }}>
                {statusTooltip.character.statusEffects.map((effect: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px',
                      marginBottom: '5px',
                      background: effect.type === 'buff' ? '#d4edda' : '#f8d7da',
                      border: `1px solid ${effect.type === 'buff' ? '#c3e6cb' : '#f5c6cb'}`,
                      borderRadius: '5px'
                    }}
                  >
                    <div style={{
                      fontWeight: 'bold',
                      color: effect.type === 'buff' ? '#155724' : '#721c24',
                      marginBottom: '3px'
                    }}>
                      {effect.type === 'buff' ? '✨' : '💀'} {effect.name}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      Duration: {effect.duration} turns
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '10px', color: '#666', textAlign: 'center' }}>
                No active status effects
              </div>
            )}

            {/* Close button for mobile only */}
            {isMobile && (
              <button
                onClick={hideStatusTooltip}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '6px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '0.85em',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

export default App
