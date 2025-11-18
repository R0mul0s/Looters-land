/**
 * Bank Vault Service - Handles bank vault operations
 *
 * Manages item storage, vault upgrades, and deposit/withdraw transactions
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-11-16
 */

import { supabase } from '../lib/supabase';
import { Item } from '../engine/item/Item';
import type { ItemType, ItemSlot, ItemRarity } from '../types/item.types';
import {
  BANK_CONFIG,
  getBankVaultSlots,
  getBankUpgradeCost,
  getBankEnergyBonus,
  calculateDepositFee,
} from '../config/BALANCE_CONFIG';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BankVaultInfo {
  tier: number;
  maxSlots: number;
  usedSlots: number;
  energyBonus: number;
  upgradeCost: number;
  canUpgrade: boolean;
}

export interface DepositResult {
  success: boolean;
  message: string;
  fee?: number;
  newGold?: number;
  newBankCount?: number;
}

export interface WithdrawResult {
  success: boolean;
  message: string;
  newBankCount?: number;
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  newTier?: number;
  newMaxSlots?: number;
  newEnergyBonus?: number;
  newGold?: number;
  newEnergy?: number;
  newMaxEnergy?: number;
}

export interface BankInventoryItem {
  id: string;
  item_id: string;
  item_name: string;
  item_type: string;
  slot: string;
  icon: string;
  level: number;
  rarity: string;
  gold_value: number;
  enchant_level: number;
  base_stats: unknown;
  set_id?: string;
  set_name?: string;
  created_at: string;
}

// ============================================================================
// BANK SERVICE CLASS
// ============================================================================

export class BankService {
  /**
   * Get bank vault information for a user
   */
  static async getVaultInfo(userId: string): Promise<BankVaultInfo | null> {
    try {
      // Get player profile with bank data
      const { data: profile, error: profileError } = await supabase
        .from('player_profiles')
        .select('bank_vault_tier, bank_vault_max_slots, bank_total_items, gold')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching bank vault info:', profileError.message, profileError);
        return null;
      }

      if (!profile) {
        console.warn('No player profile found for user:', userId);
        return null;
      }

      const tier = profile.bank_vault_tier ?? 0;
      const maxSlots = getBankVaultSlots(tier);
      const usedSlots = profile.bank_total_items ?? 0;
      const energyBonus = getBankEnergyBonus(tier);
      const upgradeCost = getBankUpgradeCost(tier);
      const canUpgrade = tier < BANK_CONFIG.MAX_TIER && profile.gold >= upgradeCost;

      return {
        tier,
        maxSlots,
        usedSlots,
        energyBonus,
        upgradeCost,
        canUpgrade,
      };
    } catch (error) {
      console.error('Error in getVaultInfo:', error);
      return null;
    }
  }

  /**
   * Get all items stored in bank vault
   */
  static async getBankInventory(userId: string): Promise<BankInventoryItem[]> {
    try {
      // Use the view that joins inventory_items with game_saves and player_profiles
      const { data: items, error: itemsError } = await supabase
        .from('bank_inventory_view')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('❌ Error fetching bank items:', itemsError.message, itemsError);
        return [];
      }

      return items ?? [];
    } catch (error) {
      console.error('❌ Error in getBankInventory:', error);
      return [];
    }
  }

  /**
   * Deposit an item into bank vault
   */
  static async depositItem(
    userId: string,
    itemId: string,
    playerGold: number
  ): Promise<DepositResult> {
    try {
      // Get vault info
      const vaultInfo = await this.getVaultInfo(userId);
      if (!vaultInfo) {
        return {
          success: false,
          message: 'Failed to load bank vault information',
        };
      }

      // Check if bank is full
      if (vaultInfo.usedSlots >= vaultInfo.maxSlots) {
        return {
          success: false,
          message: `Bank vault is full! (${vaultInfo.usedSlots}/${vaultInfo.maxSlots} slots used)`,
        };
      }

      // Get item from inventory directly (search by item_id, not by database id)
      // Note: There might be duplicates due to previous saves, so we use limit(1)
      const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('item_id', itemId)
        .eq('location', 'inventory')
        .limit(1);

      const item = items && items.length > 0 ? items[0] : null;

      if (itemError) {
        console.error('Error fetching item:', itemError.message, itemError);
        return {
          success: false,
          message: 'Error fetching item from inventory',
        };
      }

      if (!item) {
        console.error('❌ Item not found with item_id:', itemId);
        return {
          success: false,
          message: 'Item not found in inventory',
        };
      }

      // Calculate deposit fee
      const fee = calculateDepositFee(item.gold_value);

      // Check if player has enough gold for fee
      if (playerGold < fee) {
        return {
          success: false,
          message: `Not enough gold! Deposit fee: ${fee}g`,
        };
      }

      // Update item location to bank (use database id, not item_id)
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ location: 'bank' })
        .eq('id', item.id)
        .select();

      if (updateError) {
        console.error('❌ Error updating item location:', updateError.message, updateError);
        return {
          success: false,
          message: 'Failed to deposit item',
        };
      }

      // Deduct fee from player gold
      const newGold = playerGold - fee;
      const { error: goldError } = await supabase
        .from('player_profiles')
        .update({ gold: newGold })
        .eq('user_id', userId);

      if (goldError) {
        console.error('Error updating gold:', goldError);
        // Note: Item was moved, but gold deduction failed
        // You might want to rollback the item movement here
      }

      return {
        success: true,
        message: `${item.item_name} deposited to bank! Fee: ${fee}g`,
        fee,
        newGold,
        newBankCount: vaultInfo.usedSlots + 1,
      };
    } catch (error) {
      console.error('Error in depositItem:', error);
      return {
        success: false,
        message: 'An error occurred while depositing item',
      };
    }
  }

  /**
   * Withdraw an item from bank vault
   */
  static async withdrawItem(
    userId: string,
    itemId: string,
    currentInventoryCount: number,
    maxInventorySlots: number
  ): Promise<WithdrawResult> {
    try {
      // Check if inventory has space
      if (currentInventoryCount >= maxInventorySlots) {
        return {
          success: false,
          message: `Inventory is full! (${currentInventoryCount}/${maxInventorySlots} slots used)`,
        };
      }

      // Get item from bank directly (search by item_id)
      // Note: There might be duplicates due to previous saves, so we use limit(1)
      const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('item_id', itemId)
        .eq('location', 'bank')
        .limit(1);

      const item = items && items.length > 0 ? items[0] : null;

      if (itemError) {
        console.error('Error fetching item from bank:', itemError.message, itemError);
        return {
          success: false,
          message: 'Error fetching item from bank',
        };
      }

      if (!item) {
        return {
          success: false,
          message: 'Item not found in bank',
        };
      }

      // Update item location to inventory (use database id)
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ location: 'inventory' })
        .eq('id', item.id);

      if (updateError) {
        console.error('Error updating item location:', updateError);
        return {
          success: false,
          message: 'Failed to withdraw item',
        };
      }

      // Get updated bank count
      const vaultInfo = await this.getVaultInfo(userId);

      return {
        success: true,
        message: `${item.item_name} withdrawn from bank!`,
        newBankCount: vaultInfo?.usedSlots ?? 0,
      };
    } catch (error) {
      console.error('Error in withdrawItem:', error);
      return {
        success: false,
        message: 'An error occurred while withdrawing item',
      };
    }
  }

  /**
   * Upgrade bank vault to next tier
   */
  static async upgradeVault(
    userId: string,
    playerGold: number,
    currentMaxEnergy: number,
    currentEnergy: number
  ): Promise<UpgradeResult> {
    try {
      // Get current vault info
      const vaultInfo = await this.getVaultInfo(userId);
      if (!vaultInfo) {
        return {
          success: false,
          message: 'Failed to load bank vault information',
        };
      }

      const currentTier = vaultInfo.tier;

      // Check if already at max tier
      if (currentTier >= BANK_CONFIG.MAX_TIER) {
        return {
          success: false,
          message: 'Bank vault is already at maximum tier!',
        };
      }

      const upgradeCost = getBankUpgradeCost(currentTier);

      // Check if player has enough gold
      if (playerGold < upgradeCost) {
        return {
          success: false,
          message: `Not enough gold! Upgrade cost: ${upgradeCost.toLocaleString()}g`,
        };
      }

      const newTier = currentTier + 1;
      const newMaxSlots = getBankVaultSlots(newTier);
      const newEnergyBonus = getBankEnergyBonus(newTier);
      const oldEnergyBonus = getBankEnergyBonus(currentTier);
      const energyIncrease = newEnergyBonus - oldEnergyBonus;
      const newGold = playerGold - upgradeCost;
      const newMaxEnergy = currentMaxEnergy + energyIncrease;
      const newEnergy = currentEnergy + energyIncrease; // Add same bonus to current energy

      // Update player profile
      // NOTE: max_energy is NOT stored in database - it's calculated dynamically from bank_vault_tier
      // BONUS: Increase current energy by the same amount as max energy increase
      const { error: updateError } = await supabase
        .from('player_profiles')
        .update({
          bank_vault_tier: newTier,
          bank_vault_max_slots: newMaxSlots,
          gold: newGold,
          energy: newEnergy, // Increase current energy by bonus amount
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error upgrading vault:', updateError);
        return {
          success: false,
          message: 'Failed to upgrade vault',
        };
      }

      return {
        success: true,
        message: `Bank vault upgraded to Tier ${newTier}! +${energyIncrease} max energy`,
        newTier,
        newMaxSlots,
        newEnergyBonus,
        newGold,
        newEnergy,
        newMaxEnergy,
      };
    } catch (error) {
      console.error('Error in upgradeVault:', error);
      return {
        success: false,
        message: 'An error occurred while upgrading vault',
      };
    }
  }

  /**
   * Convert bank inventory items to Item instances
   */
  static convertBankItemToItem(bankItem: BankInventoryItem): Item {
    const item = new Item({
      id: bankItem.item_id,
      name: bankItem.item_name,
      type: bankItem.item_type as ItemType,
      slot: bankItem.slot as ItemSlot,
      icon: bankItem.icon,
      level: bankItem.level,
      rarity: bankItem.rarity as ItemRarity,
      goldValue: bankItem.gold_value,
      stats: bankItem.base_stats,
      enchantLevel: bankItem.enchant_level,
      setId: bankItem.set_id || undefined,
      setName: bankItem.set_name || undefined,
      location: 'inventory' // Item is being withdrawn, so set location to inventory
    });

    return item;
  }
}
