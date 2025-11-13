/**
 * Dynamic Object Updater Service
 *
 * Handles time-based updates for dynamic objects on the world map:
 * - Wandering Monsters: Respawn after 30 minutes when defeated
 * - Traveling Merchants: Despawn after 4 hours, spawn new ones
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import type { WorldMap, WanderingMonster, TravelingMerchant, Tile } from '../types/worldmap.types';
import { WORLDMAP_CONFIG } from '../config/BALANCE_CONFIG';

export class DynamicObjectUpdaterService {
  /**
   * Update all dynamic objects based on current time
   * Returns updated world map if any changes were made
   */
  static updateDynamicObjects(worldMap: WorldMap): { updated: boolean; worldMap: WorldMap } {
    let hasChanges = false;
    const now = new Date();

    // Update wandering monsters
    const updatedMonsters = this.updateWanderingMonsters(worldMap.dynamicObjects.filter(obj => obj.type === 'wanderingMonster') as WanderingMonster[], now);
    if (updatedMonsters.hasChanges) {
      hasChanges = true;
    }

    // Update traveling merchants
    const updatedMerchants = this.updateTravelingMerchants(
      worldMap.dynamicObjects.filter(obj => obj.type === 'travelingMerchant') as TravelingMerchant[],
      worldMap.tiles,
      now
    );
    if (updatedMerchants.hasChanges) {
      hasChanges = true;
    }

    if (!hasChanges) {
      return { updated: false, worldMap };
    }

    // Combine updated dynamic objects
    const updatedDynamicObjects = [
      ...updatedMonsters.objects,
      ...updatedMerchants.objects
    ];

    // Return updated world map
    return {
      updated: true,
      worldMap: {
        ...worldMap,
        dynamicObjects: updatedDynamicObjects
      }
    };
  }

  /**
   * Update wandering monsters - respawn defeated ones after respawn time
   */
  private static updateWanderingMonsters(
    monsters: WanderingMonster[],
    now: Date
  ): { hasChanges: boolean; objects: WanderingMonster[] } {
    let hasChanges = false;

    const updatedMonsters = monsters.map(monster => {
      // Skip if not defeated or already active
      if (!monster.defeated || monster.isActive) {
        return monster;
      }

      // Check if respawn time has passed
      const spawnTime = new Date(monster.spawnTime);
      const respawnTime = new Date(spawnTime.getTime() + monster.respawnMinutes * 60 * 1000);

      if (now >= respawnTime) {
        console.log(`🔄 Respawning wandering monster: ${monster.enemyName} at (${monster.position.x}, ${monster.position.y})`);
        hasChanges = true;

        return {
          ...monster,
          defeated: false,
          isActive: true,
          spawnTime: now // Reset spawn time
        };
      }

      return monster;
    });

    return {
      hasChanges,
      objects: updatedMonsters
    };
  }

  /**
   * Update traveling merchants - despawn expired ones, spawn new ones
   */
  private static updateTravelingMerchants(
    merchants: TravelingMerchant[],
    tiles: Tile[][],
    now: Date
  ): { hasChanges: boolean; objects: TravelingMerchant[] } {
    let hasChanges = false;

    // First, deactivate expired merchants
    const updatedMerchants = merchants.map(merchant => {
      if (!merchant.isActive) {
        return merchant;
      }

      const staysUntil = new Date(merchant.staysUntil);
      if (now >= staysUntil) {
        console.log(`💨 Despawning traveling merchant: ${merchant.merchantName} at (${merchant.position.x}, ${merchant.position.y})`);
        hasChanges = true;

        return {
          ...merchant,
          isActive: false
        };
      }

      return merchant;
    });

    // Count active merchants
    const activeMerchantCount = updatedMerchants.filter(m => m.isActive).length;
    const targetCount = WORLDMAP_CONFIG.TRAVELING_MERCHANT_COUNT;

    // Spawn new merchants if needed
    if (activeMerchantCount < targetCount) {
      const merchantsToSpawn = targetCount - activeMerchantCount;
      console.log(`🧳 Spawning ${merchantsToSpawn} new traveling merchant(s)...`);

      for (let i = 0; i < merchantsToSpawn; i++) {
        const newMerchant = this.spawnNewTravelingMerchant(tiles, now, updatedMerchants);
        if (newMerchant) {
          updatedMerchants.push(newMerchant);
          hasChanges = true;
        }
      }
    }

    return {
      hasChanges,
      objects: updatedMerchants
    };
  }

  /**
   * Spawn a new traveling merchant at a random safe location
   */
  private static spawnNewTravelingMerchant(
    tiles: Tile[][],
    now: Date,
    existingMerchants: TravelingMerchant[]
  ): TravelingMerchant | null {
    const merchantNames = [
      'Wandering Trader Marcus',
      'Mysterious Merchant Aria',
      'Desert Vendor Khalid',
      'Forest Merchant Elena',
      'Mountain Trader Boris',
      'Coastal Vendor Luna'
    ];

    const itemTypes = [
      { type: 'Healing Potion', rarity: 'uncommon' as const, basePrice: 50 },
      { type: 'Mana Potion', rarity: 'uncommon' as const, basePrice: 50 },
      { type: 'Rare Gem', rarity: 'rare' as const, basePrice: 200 },
      { type: 'Ancient Scroll', rarity: 'rare' as const, basePrice: 300 },
      { type: 'Legendary Weapon Fragment', rarity: 'epic' as const, basePrice: 1000 },
      { type: 'Mystic Armor Piece', rarity: 'epic' as const, basePrice: 1200 }
    ];

    // Find a random safe location (not water, mountain, or lava)
    const maxAttempts = 100;
    let position = { x: 0, y: 0 };
    let foundSafeSpot = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * tiles[0].length);
      const y = Math.floor(Math.random() * tiles.length);
      const tile = tiles[y]?.[x];

      if (tile && tile.terrain !== 'water' && tile.terrain !== 'mountains') {
        // Check if position is not occupied by another merchant
        const occupied = existingMerchants.some(m => m.isActive && m.position.x === x && m.position.y === y);
        if (!occupied) {
          position = { x, y };
          foundSafeSpot = true;
          break;
        }
      }
    }

    if (!foundSafeSpot) {
      console.warn('⚠️ Could not find safe spot for traveling merchant');
      return null;
    }

    // Generate random inventory (2-5 items)
    const inventorySize = Math.floor(Math.random() * 4) + 2;
    const inventory = [];

    for (let i = 0; i < inventorySize; i++) {
      const item = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      inventory.push({
        itemType: item.type,
        price: item.basePrice + Math.floor(Math.random() * item.basePrice * 0.5),
        rarity: item.rarity
      });
    }

    const staysUntil = new Date(now.getTime() + WORLDMAP_CONFIG.TRAVELING_MERCHANT_DURATION * 60 * 60 * 1000);

    const newMerchant: TravelingMerchant = {
      id: `merchant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'travelingMerchant',
      position,
      merchantName: merchantNames[Math.floor(Math.random() * merchantNames.length)],
      inventory,
      staysUntil,
      spawnTime: now,
      isActive: true
    };

    console.log(`✅ Spawned new traveling merchant: ${newMerchant.merchantName} at (${position.x}, ${position.y})`);

    return newMerchant;
  }
}
