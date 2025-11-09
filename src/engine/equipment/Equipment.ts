/**
 * Equipment Manager - Manages hero equipment and stat calculations
 * Migrated from vanilla JS to TypeScript
 */

import type { Hero } from '../hero/Hero';
import type { Item } from '../item/Item';
import type { ItemStats } from '../../types/item.types';
import type {
  EquipmentSlotName,
  EquipmentSlots,
  EquipResult,
  ActiveSetInfo
} from '../../types/equipment.types';
import { SetBonusManager } from './SetBonusManager';
import { t } from '../../localization/i18n';

export class Equipment {
  hero: Hero;
  slots: EquipmentSlots;
  equippedSets: Map<string, number>;

  constructor(hero: Hero) {
    this.hero = hero;
    this.slots = {
      helmet: null,
      weapon: null,
      chest: null,
      gloves: null,
      legs: null,
      boots: null,
      accessory1: null,
      accessory2: null
    };
    this.equippedSets = new Map();
  }

  equip(item: Item): EquipResult {
    if (!item || item.type !== 'equipment') {
      return {
        success: false,
        message: 'Invalid item or not equipment type'
      };
    }

    // Check level requirement
    if (item.level > this.hero.level) {
      return {
        success: false,
        message: t('equipment.levelRequirement', {
          itemName: item.getDisplayName(),
          requiredLevel: item.level.toString(),
          currentLevel: this.hero.level.toString()
        })
      };
    }

    let targetSlot: EquipmentSlotName = item.slot as EquipmentSlotName;

    // Handle accessories (2 slots)
    if (item.slot === 'accessory') {
      if (!this.slots.accessory1) {
        targetSlot = 'accessory1';
      } else if (!this.slots.accessory2) {
        targetSlot = 'accessory2';
      } else {
        targetSlot = 'accessory1';
      }
    }

    const unequippedItem = this.slots[targetSlot];
    this.slots[targetSlot] = item;
    this.updateSetTracking();
    this.recalculateStats();

    return {
      success: true,
      message: `Equipped ${item.getDisplayName()}`,
      unequippedItem: unequippedItem,
      slot: targetSlot
    };
  }

  unequip(slotName: EquipmentSlotName): EquipResult {
    const item = this.slots[slotName];
    if (!item) {
      return {
        success: false,
        message: 'No item equipped in that slot'
      };
    }

    this.slots[slotName] = null;
    this.updateSetTracking();
    this.recalculateStats();

    return {
      success: true,
      message: `Unequipped ${item.getDisplayName()}`,
      item: item
    };
  }

  getAllEquipped(): Array<{ slot: string; item: Item }> {
    return Object.entries(this.slots)
      .filter(([slot, item]) => item !== null)
      .map(([slot, item]) => ({ slot, item: item as Item }));
  }

  getEquipped(slotName: EquipmentSlotName): Item | null {
    return this.slots[slotName] || null;
  }

  isSlotEmpty(slotName: EquipmentSlotName): boolean {
    return this.slots[slotName] === null;
  }

  getTotalEquipmentStats(): ItemStats {
    const totalStats: ItemStats = {
      HP: 0,
      ATK: 0,
      DEF: 0,
      SPD: 0,
      CRIT: 0
    };

    Object.values(this.slots).forEach(item => {
      if (item) {
        const itemStats = item.getEffectiveStats();
        totalStats.HP += itemStats.HP;
        totalStats.ATK += itemStats.ATK;
        totalStats.DEF += itemStats.DEF;
        totalStats.SPD += itemStats.SPD;
        totalStats.CRIT += itemStats.CRIT;
      }
    });

    const setBonuses = this.getSetBonuses();
    if (setBonuses) {
      totalStats.HP += setBonuses.HP || 0;
      totalStats.ATK += setBonuses.ATK || 0;
      totalStats.DEF += setBonuses.DEF || 0;
      totalStats.SPD += setBonuses.SPD || 0;
      totalStats.CRIT += setBonuses.CRIT || 0;
    }

    return totalStats;
  }

  updateSetTracking(): void {
    this.equippedSets.clear();

    Object.values(this.slots).forEach(item => {
      if (item && item.setId) {
        const currentCount = this.equippedSets.get(item.setId) || 0;
        this.equippedSets.set(item.setId, currentCount + 1);
      }
    });
  }

  getSetBonuses(): ItemStats {
    const bonuses: ItemStats = {
      HP: 0,
      ATK: 0,
      DEF: 0,
      SPD: 0,
      CRIT: 0
    };

    this.equippedSets.forEach((count, setId) => {
      const setBonus = SetBonusManager.getBonus(setId, count);
      if (setBonus) {
        bonuses.HP += setBonus.HP || 0;
        bonuses.ATK += setBonus.ATK || 0;
        bonuses.DEF += setBonus.DEF || 0;
        bonuses.SPD += setBonus.SPD || 0;
        bonuses.CRIT += setBonus.CRIT || 0;
      }
    });

    return bonuses;
  }

  getActiveSetBonuses(): ActiveSetInfo[] {
    const activeSets: ActiveSetInfo[] = [];

    this.equippedSets.forEach((count, setId) => {
      const setInfo = SetBonusManager.getSetInfo(setId);
      if (setInfo) {
        activeSets.push({
          setName: setInfo.name,
          setId: setId,
          pieces: count,
          bonuses: SetBonusManager.getAllBonusesForSet(setId, count)
        });
      }
    });

    return activeSets;
  }

  recalculateStats(): void {
    if (!this.hero) return;

    const equipStats = this.getTotalEquipmentStats();

    this.hero.maxHP = this.hero.baseMaxHP + equipStats.HP;
    this.hero.ATK = this.hero.baseATK + equipStats.ATK;
    this.hero.DEF = this.hero.baseDEF + equipStats.DEF;
    this.hero.SPD = this.hero.baseSPD + equipStats.SPD;
    this.hero.CRIT = parseFloat((this.hero.baseCRIT + equipStats.CRIT).toFixed(2));

    if (this.hero.currentHP > this.hero.maxHP) {
      this.hero.currentHP = this.hero.maxHP;
    }
  }

  getPowerScore(): number {
    const stats = this.getTotalEquipmentStats();
    return stats.HP + (stats.ATK * 2) + (stats.DEF * 1.5) + stats.SPD + (stats.CRIT * 10);
  }

  toJSON(): { slots: Record<string, any> } {
    const slotsData: Record<string, any> = {};
    Object.keys(this.slots).forEach(slotName => {
      const slot = slotName as EquipmentSlotName;
      slotsData[slotName] = this.slots[slot] ? this.slots[slot]!.toJSON() : null;
    });

    return { slots: slotsData };
  }

  static fromJSON(data: { slots: Record<string, any> }, hero: Hero): Equipment {
    const equipment = new Equipment(hero);

    Object.keys(data.slots).forEach(slotName => {
      if (data.slots[slotName]) {
        const slot = slotName as EquipmentSlotName;
        // Note: Item.fromJSON will be imported when used
        equipment.slots[slot] = data.slots[slotName] as any; // Will be Item after parsing
      }
    });

    equipment.updateSetTracking();
    equipment.recalculateStats();

    return equipment;
  }
}
