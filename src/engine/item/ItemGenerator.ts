/**
 * Item Generator - Create items with proper stats
 * Migrated from vanilla JS to TypeScript
 */

import { Item } from './Item';
import type { ItemRarity, ItemSlot, ItemStats } from '../../types/item.types';

export class ItemGenerator {
  static generate(level: number, rarity: ItemRarity, slot: ItemSlot | null = null): Item {
    // Random slot if not specified
    if (!slot) {
      const slots: ItemSlot[] = ['helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory'];
      slot = slots[Math.floor(Math.random() * slots.length)];
    }

    // Generate base stats - REBALANCED
    // Level 1 items should be weak, higher level items should be significantly stronger
    // Progressive scaling: Level 1 = base 3, Level 6 = base 18 (6x stronger!)
    const rarityMultiplier = Item.getRarityMultiplier(rarity);
    const levelMultiplier = Math.pow(level, 1.2); // Exponential scaling for better progression
    const baseStat = Math.floor(3 * levelMultiplier * rarityMultiplier);

    // Different slots have different stat distributions
    const stats = this.generateStatsForSlot(slot, baseStat);

    // Generate name
    const name = this.generateName(rarity, slot);

    return new Item({
      name,
      rarity,
      level,
      slot,
      type: 'equipment', // Explicitly set type
      stats,
      description: this.generateDescription(slot)
    });
  }

  static generateStatsForSlot(slot: ItemSlot, baseStat: number): ItemStats {
    const templates: Record<ItemSlot, ItemStats> = {
      helmet: { HP: 3, DEF: 2, ATK: 0, SPD: 0, CRIT: 0 },
      weapon: { ATK: 3, CRIT: 0.5, HP: 0, DEF: 0, SPD: 0.5 },
      chest: { HP: 4, DEF: 3, ATK: 0, SPD: 0, CRIT: 0 },
      gloves: { ATK: 1, DEF: 1, SPD: 1, HP: 1, CRIT: 0.3 },
      legs: { HP: 2, DEF: 2, SPD: 0.5, ATK: 0, CRIT: 0 },
      boots: { SPD: 2, DEF: 1, HP: 1, ATK: 0, CRIT: 0 },
      accessory: { CRIT: 1, ATK: 1, HP: 1, DEF: 0.5, SPD: 0.5 }
    };

    const template = templates[slot];

    return {
      HP: Math.floor(baseStat * template.HP),
      ATK: Math.floor(baseStat * template.ATK),
      DEF: Math.floor(baseStat * template.DEF),
      SPD: Math.floor(baseStat * template.SPD),
      CRIT: parseFloat((baseStat * template.CRIT * 0.1).toFixed(2))
    };
  }

  static generateName(rarity: ItemRarity, slot: ItemSlot): string {
    const prefixes: Record<ItemRarity, string[]> = {
      mythic: ['Divine', 'Eternal', 'Celestial', 'Primordial'],
      legendary: ['Ancient', 'Mystic', 'Cursed', 'Holy'],
      epic: ['Superior', 'Enhanced', 'Reinforced', 'Blessed'],
      rare: ['Fine', 'Quality', 'Sturdy', 'Sharp'],
      uncommon: ['Decent', 'Good', 'Reliable'],
      common: ['Basic', 'Simple', 'Common']
    };

    const slotNames: Record<ItemSlot, string[]> = {
      helmet: ['Helmet', 'Helm', 'Crown', 'Circlet'],
      weapon: ['Sword', 'Blade', 'Axe', 'Mace'],
      chest: ['Armor', 'Breastplate', 'Chainmail', 'Tunic'],
      gloves: ['Gloves', 'Gauntlets', 'Handwraps'],
      legs: ['Greaves', 'Leggings', 'Pants'],
      boots: ['Boots', 'Shoes', 'Treads'],
      accessory: ['Ring', 'Amulet', 'Talisman', 'Charm']
    };

    const prefixList = prefixes[rarity];
    const slotList = slotNames[slot];

    const prefix = rarity === 'common' ? '' : prefixList[Math.floor(Math.random() * prefixList.length)] + ' ';
    const slotName = slotList[Math.floor(Math.random() * slotList.length)];

    return prefix + slotName;
  }

  static generateDescription(slot: ItemSlot, rarity: ItemRarity): string {
    const descriptions: Record<ItemSlot, string> = {
      helmet: 'Protects the head from enemy attacks.',
      weapon: 'A deadly weapon for combat.',
      chest: 'Sturdy armor for the torso.',
      gloves: 'Protective handwear.',
      legs: 'Armor for the lower body.',
      boots: 'Footwear for adventurers.',
      accessory: 'A magical trinket with special properties.'
    };

    return descriptions[slot] || 'A mysterious item.';
  }
}
