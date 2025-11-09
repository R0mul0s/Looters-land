/**
 * Set Bonus Manager - Manages equipment set bonuses
 * Migrated from vanilla JS to TypeScript
 */

import type { SetDefinition, SetBonus, SetBonusInfo, SetInfo } from '../../types/equipment.types';

export class SetBonusManager {
  static sets: Record<string, SetDefinition> = {
    'warrior_set': {
      name: "Warrior's Valor",
      bonuses: {
        2: { HP: 50, DEF: 10 },
        3: { HP: 100, DEF: 20, ATK: 10 },
        4: { HP: 200, DEF: 40, ATK: 20 },
        5: { HP: 350, DEF: 70, ATK: 35, special: 'Battle Rage' }
      }
    },
    'archer_set': {
      name: "Hunter's Focus",
      bonuses: {
        2: { SPD: 5, CRIT: 2 },
        3: { SPD: 10, CRIT: 5, ATK: 10 },
        4: { SPD: 20, CRIT: 10, ATK: 20 },
        5: { SPD: 35, CRIT: 18, ATK: 35, special: 'Perfect Shot' }
      }
    },
    'mage_set': {
      name: "Arcane Wisdom",
      bonuses: {
        2: { ATK: 15, HP: 20 },
        3: { ATK: 30, HP: 50, SPD: 5 },
        4: { ATK: 50, HP: 100, SPD: 10 },
        5: { ATK: 80, HP: 200, SPD: 20, special: 'Mana Surge' }
      }
    },
    'cleric_set': {
      name: "Divine Grace",
      bonuses: {
        2: { HP: 80, DEF: 15 },
        3: { HP: 150, DEF: 30 },
        4: { HP: 250, DEF: 50, SPD: 10 },
        5: { HP: 400, DEF: 80, SPD: 20, special: 'Holy Aura' }
      }
    },
    'paladin_set': {
      name: "Righteous Protector",
      bonuses: {
        2: { HP: 60, ATK: 10, DEF: 10 },
        3: { HP: 120, ATK: 20, DEF: 20 },
        4: { HP: 200, ATK: 35, DEF: 35, SPD: 10 },
        5: { HP: 350, ATK: 60, DEF: 60, SPD: 20, special: 'Divine Shield' }
      }
    }
  };

  static getBonus(setId: string, pieceCount: number): SetBonus | null {
    const set = this.sets[setId];
    if (!set) return null;

    return set.bonuses[pieceCount] || null;
  }

  static getAllBonusesForSet(setId: string, pieceCount: number): SetBonusInfo[] {
    const set = this.sets[setId];
    if (!set) return [];

    const bonuses: SetBonusInfo[] = [];
    for (let i = 2; i <= pieceCount; i++) {
      if (set.bonuses[i]) {
        bonuses.push({
          pieces: i,
          bonus: set.bonuses[i],
          active: i <= pieceCount
        });
      }
    }

    return bonuses;
  }

  static getSetInfo(setId: string): SetInfo | null {
    const set = this.sets[setId];
    if (!set) return null;

    return {
      id: setId,
      name: set.name,
      bonuses: set.bonuses
    };
  }

  static getAllSets(): SetInfo[] {
    return Object.keys(this.sets).map(setId => this.getSetInfo(setId)!).filter(Boolean);
  }
}
