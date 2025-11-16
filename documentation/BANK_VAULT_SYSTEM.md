# 🏦 Bank Vault System - Design Document

**Version:** 1.1
**Target Release:** v0.9.0
**Author:** Roman Hlaváček - rhsoft.cz
**Last Updated:** 2025-11-16 (Dynamic energy calculation & immediate bonus implementation)

---

## 📋 Overview

The Bank Vault System is a **premium item storage feature** that allows players to expand their storage capacity beyond the standard inventory limit (30-100 slots). The bank provides **250 additional slots** at maximum tier, accessible only in towns.

### Primary Goals
1. ✅ Solve inventory overflow issues (especially with daily worldmap reset in v0.8.0)
2. ✅ Create significant endgame gold sink (775,000g total investment)
3. ✅ Enable long-term item storage for multiple equipment sets
4. ✅ Reward progression with quality-of-life improvements

---

## 🎯 Core Features

### 1. Item Storage Vault

**Mechanics:**
- **Deposit items** from inventory → bank (only in town)
- **Withdraw items** from bank → inventory (only in town, requires free inventory space)
- **Location restriction:** Bank access ONLY in towns with `bank: true` building
- **No remote access:** Cannot deposit/withdraw from worldmap or dungeons

**Storage Tiers:**

| Tier | Bank Slots | Upgrade Cost | Cumulative Cost | Energy Bonus |
|------|-----------|--------------|-----------------|--------------|
| **0** | 0 slots | - | **0g** | - |
| **1** | 50 slots | 25,000g | **25,000g** | +25 max energy |
| **2** | 100 slots | 50,000g | **75,000g** | +50 max energy |
| **3** | 150 slots | 100,000g | **175,000g** | +75 max energy |
| **4** | 200 slots | 200,000g | **375,000g** | +100 max energy |
| **5** | 250 slots | 400,000g | **775,000g** | +125 max energy |

**Total Gold Sink:** 775,000g for max capacity

---

### 2. Transaction Fees

**Deposit Fee:**
- **1% of item value** (gold sink mechanism)
- Example: Item worth 10,000g → Pay 100g deposit fee
- Fee goes to void (not recoverable)
- Shown in UI before confirmation

**Withdraw Fee:**
- **FREE** (no fee for withdrawals)
- Encourages players to use bank freely

**Example Transaction:**
```
Player deposits Epic Sword +7 (value: 50,000g)
├─ Deposit fee: 50,000g × 1% = 500g
├─ Item moved: Inventory → Bank
├─ Player gold: -500g
└─ Bank slots used: 123/150
```

---

### 3. Energy Bonuses (Passive Rewards)

**Permanent Max Energy Increase:**
- Each tier upgrade grants **permanent** max energy boost
- Bonuses stack cumulatively
- Applies immediately upon upgrade

**Energy Bonus Table:**
| Tier | Energy Bonus | Cumulative Total | New Max Energy |
|------|-------------|------------------|----------------|
| 0 | - | - | 240 (base) |
| 1 | +25 | +25 | 265 |
| 2 | +50 | +75 | 315 |
| 3 | +75 | +150 | 390 |
| 4 | +100 | +250 | 490 |
| 5 | +125 | +375 | **615** |

**Why Energy Bonuses?**
- Rewards investment with practical daily benefit
- Enables more dungeon runs per day
- Scales with player progression (endgame players farm more)
- Not pay-to-win (requires gold earned in-game)

---

## 🎮 Use Cases

### Early Game (Level 1-20)
- **Status:** Bank not needed yet
- **Reason:** Inventory (30-50 slots) sufficient for loot volume
- **Recommendation:** Save gold for gacha/enchanting

### Mid Game (Level 20-50)
- **Status:** Bank becomes useful
- **Scenario:** Inventory filling up (100 slots), found Epic items for future use
- **Recommendation:** Tier 1-2 (50-100 bank slots) @ 25k-75k gold
- **Benefits:** Store backup equipment sets, future-level gear

### Late Game (Level 50+)
- **Status:** Bank highly valuable
- **Scenario:** Multiple hero builds, enchanting experiments, collectibles
- **Recommendation:** Tier 3-4 (150-200 slots) @ 175k-375k gold
- **Benefits:** Store complete equipment sets per hero class

### Endgame (Level 100)
- **Status:** Bank essential
- **Scenario:** Daily worldmap reset = massive loot influx, crafting materials
- **Recommendation:** Tier 5 (250 slots) @ 775k gold
- **Benefits:** Max energy (615), completionist collections, material storage

---

## 🗄️ Database Schema

### Player Profile Columns

```sql
ALTER TABLE player_profiles
ADD COLUMN bank_vault_tier INTEGER DEFAULT 0,
ADD COLUMN bank_vault_max_slots INTEGER DEFAULT 0,
ADD COLUMN bank_total_items INTEGER DEFAULT 0;
```

**Field Descriptions:**
- `bank_vault_tier` - Current tier (0-5)
- `bank_vault_max_slots` - Calculated max slots (0, 50, 100, 150, 200, 250)
- `bank_total_items` - Cached count of items in bank (for performance)

### Inventory Items Location

```sql
ALTER TABLE inventory_items
ADD COLUMN location TEXT DEFAULT 'inventory';

-- Possible values: 'inventory' | 'bank' | 'equipped'
-- Index for fast filtering
CREATE INDEX idx_inventory_location ON inventory_items(user_id, location);
```

**Migration Strategy:**
- Existing items default to `location = 'inventory'`
- Equipped items remain in `equipment_slots` table (no change)
- Bank items marked with `location = 'bank'`

---

## ⚙️ Configuration

### BALANCE_CONFIG.ts

```typescript
export const BANK_CONFIG = {
  /** Bank vault tier definitions */
  TIERS: [
    { tier: 0, slots: 0, cost: 0, energyBonus: 0 },
    { tier: 1, slots: 50, cost: 25000, energyBonus: 25 },
    { tier: 2, slots: 100, cost: 50000, energyBonus: 50 },
    { tier: 3, slots: 150, cost: 100000, energyBonus: 75 },
    { tier: 4, slots: 200, cost: 200000, energyBonus: 100 },
    { tier: 5, slots: 250, cost: 400000, energyBonus: 125 }
  ],

  /** Transaction fees */
  DEPOSIT_FEE_PERCENTAGE: 0.01, // 1% of item value
  WITHDRAW_FEE_PERCENTAGE: 0, // Free withdrawals

  /** Maximum tier */
  MAX_TIER: 5,

  /** Default tier for new players */
  DEFAULT_TIER: 0
};
```

---

## 🖥️ UI/UX Design

### Bank Building Interface

```
┌─────────────────────────────────────────────────────────────┐
│  🏦 BANK VAULT                              [X Close]        │
├────────────────────┬────────────────────────────────────────┤
│  YOUR INVENTORY    │  BANK STORAGE                          │
│  (67/100 items)    │  (123/150 items) - Tier 3              │
├────────────────────┼────────────────────────────────────────┤
│                    │                                        │
│  [Epic Sword +7] → │    ← [Rare Helmet +5]                  │
│  [Rare Ring +3] →  │    ← [Epic Boots +8]                   │
│  [Common Axe] →    │    ← [Legendary Staff +10]             │
│  [Epic Armor +6] → │    ← [Rare Shield +4]                  │
│  ...               │    ...                                 │
│                    │                                        │
│  🔍 [Search...]    │  🔍 [Search...]                        │
│  📊 [Filter ▾]     │  📊 [Filter ▾]                         │
│  🔄 [Sort ▾]       │  🔄 [Sort ▾]                           │
│                    │                                        │
├────────────────────┴────────────────────────────────────────┤
│  💎 VAULT CAPACITY UPGRADE                                  │
│  Current: Tier 3 (150 slots) - Energy Bonus: +75            │
│  Next: Tier 4 (200 slots) - Cost: 200,000g - Bonus: +100    │
│  [████████████████░░░░░░] 82% Full (123/150)                │
│  [Upgrade to Tier 4] ← Button (disabled if insufficient gold)│
└─────────────────────────────────────────────────────────────┘
```

### Interaction Methods

**Deposit:**
1. Click item in inventory → Shows tooltip with deposit fee
2. Confirm deposit → Item moves to bank, gold deducted
3. Success animation + sound effect

**Withdraw:**
1. Click item in bank → Check if inventory has space
2. If full: Show error "Inventory is full!"
3. If space: Item moves to inventory instantly (no fee)

**Upgrade:**
1. Click "Upgrade to Tier X" button
2. Confirmation modal: "Upgrade vault? Cost: 200,000g, New capacity: 200 slots, Energy bonus: +100"
3. Confirm → Gold deducted, tier increased, max energy updated
4. Success notification: "Vault upgraded! New max energy: 490"

---

## 🔧 Technical Implementation

### Phase 1: Database & Backend (3-4 days) ✅ COMPLETED

**Tasks:**
1. ✅ Create migration SQL for `player_profiles` bank columns
2. ✅ Create migration SQL for `inventory_items` location column
3. ✅ Implement `BankService.ts`:
   - `depositItem(userId, itemId, playerGold): Promise<DepositResult>`
   - `withdrawItem(userId, itemId, currentInventoryCount, maxInventorySlots): Promise<WithdrawResult>`
   - `upgradeVault(userId, playerGold, currentMaxEnergy, currentEnergy): Promise<UpgradeResult>`
   - `getBankInventory(userId): Promise<BankInventoryItem[]>`
   - `getVaultInfo(userId): Promise<BankVaultInfo>`
   - `convertBankItemToItem(bankItem): Item`
4. ✅ Add BANK_CONFIG to BALANCE_CONFIG.ts
5. ✅ Update `useGameState` hook to include bank state
6. ✅ Update auto-save to include bank data

**Validation Rules:**
- Deposit: Must have item in inventory, must pay fee, bank not full
- Withdraw: Must have item in bank, must have inventory space
- Upgrade: Must have sufficient gold, not already max tier

### Critical Implementation Details

#### Dynamic Max Energy Calculation

**Architecture Decision:**
- Max energy is **NOT stored** in the database
- Max energy is **calculated dynamically** from `bank_vault_tier` in the application layer
- This allows flexible addition of other energy bonuses in the future without database migrations

**Implementation Pattern:**

```typescript
// In useGameState.ts - loadGame function
const bankEnergyBonus = getBankEnergyBonus(profile.bank_vault_tier || 0);
const calculatedMaxEnergy = ENERGY_CONFIG.MAX_ENERGY + bankEnergyBonus;

// In useGameState.ts - Realtime subscription handler
const bankEnergyBonus = getBankEnergyBonus(updatedProfile.bank_vault_tier || 0);
const calculatedMaxEnergy = ENERGY_CONFIG.MAX_ENERGY + bankEnergyBonus;
```

**Why This Approach:**
1. Single source of truth: `bank_vault_tier` is the only stored value
2. Extensible: Can add other energy bonus sources (equipment, skills, buffs) without database changes
3. Consistent: All max energy calculations use the same formula
4. Maintainable: Changes to energy bonus formulas don't require data migrations

**Critical Bug Fix (2025-11-16):**
- Fixed Realtime subscription handler that was resetting maxEnergy to base value (240)
- Now correctly recalculates maxEnergy from bank_vault_tier on every profile update
- Ensures UI stays in sync with database changes

#### Immediate Energy Bonus Application

**User Experience Enhancement:**
When upgrading vault, both current energy AND max energy increase by the bonus amount.

**Example:**
```
Before upgrade: 170/240 energy
Upgrade to Tier 1: +25 energy bonus
After upgrade: 195/265 energy (both +25)
```

**Implementation:**

```typescript
// In BankService.upgradeVault()
const energyIncrease = newEnergyBonus - oldEnergyBonus;
const newEnergy = currentEnergy + energyIncrease; // Bonus current energy
const newMaxEnergy = currentMaxEnergy + energyIncrease;

await supabase
  .from('player_profiles')
  .update({
    bank_vault_tier: newTier,
    bank_vault_max_slots: newMaxSlots,
    gold: newGold,
    energy: newEnergy, // Increase current energy by bonus amount
  })
  .eq('user_id', userId);
```

**Benefits:**
- Players immediately feel the reward of upgrading
- No need to wait for energy regeneration
- Encourages vault upgrades as a strategic energy boost

### Phase 2: UI Implementation (5-7 days)

**Components:**
1. `BankBuilding.tsx` - Main bank interface (replace placeholder)
2. `BankInventoryPanel.tsx` - Shows bank items with filters/sort
3. `BankUpgradePanel.tsx` - Vault tier upgrade interface
4. `BankTransferModal.tsx` - Confirmation modal for deposit/withdraw
5. Update `TownScreen.tsx` - Enable bank building interaction

**Features:**
- Drag & drop item transfer (optional - Phase 2.5)
- Click-to-transfer (primary method)
- Real-time capacity bar updates
- Search & filter functionality
- Sort options (same as inventory)
- Loading states & error handling

### Phase 3: Testing & Polish (2-3 days)

**Test Cases:**
- ✅ Deposit item with sufficient gold
- ✅ Deposit item with insufficient gold (should fail)
- ✅ Deposit when bank full (should fail)
- ✅ Withdraw item with inventory space
- ✅ Withdraw item with full inventory (should fail)
- ✅ Upgrade vault with sufficient gold
- ✅ Upgrade vault with insufficient gold (should fail)
- ✅ Upgrade from tier 4→5 (max tier, button should disappear)
- ✅ Energy bonus correctly applied after upgrade
- ✅ Auto-save persists bank state
- ✅ Multiple deposits/withdrawals in same session

**Balance Testing:**
- Monitor average deposit fees collected
- Track tier upgrade adoption rates
- Measure impact on inventory management satisfaction

**Localization:**
- Update Czech translations in `locales/cs.json`
- Add bank-specific UI strings
- Test all error messages in Czech

---

## 📊 Economic Balance

### Gold Sink Analysis

**Total Investment:**
```
Tier upgrades: 775,000g
Average deposit fees (250 items @ 10k avg value): ~25,000g
─────────────────────────────────
Total gold sink: ~800,000g
```

**Comparison to Other Sinks:**
- Gacha 10x summon: 9,000g (repeatable)
- Enchanting +0→+10: ~15,000g (with failures, repeatable)
- Inventory expansion (30→100): ~50,000g (one-time)
- **Bank vault (0→250): ~800,000g (one-time, massive sink)** ✅

**ROI Analysis (Energy Bonus):**
- +125 max energy = ~12 extra dungeon floors/day
- 12 floors × ~80g avg loot = ~960g/day extra income
- ROI period: 775,000g ÷ 960g/day = **~807 days** (purely from energy)
- **Conclusion:** Not OP, balanced long-term investment

### Player Progression Curve

| Player Level | Expected Gold | Recommended Tier | Investment |
|--------------|---------------|------------------|------------|
| 1-20 | 10k-50k | Tier 0 | 0g (not needed) |
| 20-40 | 50k-150k | Tier 1-2 | 25k-75k |
| 40-60 | 150k-400k | Tier 2-3 | 75k-175k |
| 60-80 | 400k-1M | Tier 3-4 | 175k-375k |
| 80-100 | 1M+ | Tier 4-5 | 375k-775k |

**Adoption Prediction:**
- Early game: 10% (not needed)
- Mid game: 50% (useful QoL)
- Late game: 80% (highly valuable)
- Endgame: 95% (essential)

---

## 🚀 Future Enhancements (Post-v1.0)

### Item Vault v2.0 (v1.1+)
- **Item Sets:** Save entire equipment sets with 1-click swap
- **Favorites:** Mark items as favorite (cannot accidentally sell)
- **Quick Filters:** "Show Legendary only", "Show +10 enchanted"
- **Bulk Actions:** "Deposit all unequipped items", "Withdraw entire set"

### Bank Cosmetics (v1.2+)
- **Vault Themes:** Gold vault, Crystal vault, Dragon hoard (cosmetic only)
- **Purchase:** 50,000g or 500 gems per theme
- **Additional Gold Sink:** ~200,000g for all themes

### Material Storage (v1.5+)
- **Separate Tab:** Crafting materials (Dust, Crystals, Gems)
- **Stacking:** Materials stack to 999 (unlike equipment)
- **Capacity:** Shared with item vault or separate slots

### Guild Bank (v2.0+)
- **Shared Storage:** Guild members can deposit/withdraw
- **Permissions:** Guild leader sets access levels
- **Guild Vault Tiers:** Upgraded with guild gold
- **Collaboration:** Share equipment sets for guild wars

---

## 📝 Localization Keys

### Czech Translations Required

```json
{
  "buildings.bank.title": "Bankovní trezor",
  "buildings.bank.inventory_tab": "Váš inventář",
  "buildings.bank.vault_tab": "Bankovní úložiště",
  "buildings.bank.capacity": "Kapacita",
  "buildings.bank.upgrade_title": "Vylepšení kapacity trezoru",
  "buildings.bank.current_tier": "Aktuální úroveň",
  "buildings.bank.next_tier": "Další úroveň",
  "buildings.bank.upgrade_button": "Vylepšit na úroveň {tier}",
  "buildings.bank.upgrade_cost": "Cena",
  "buildings.bank.energy_bonus": "Bonus k energii",
  "buildings.bank.deposit_fee": "Poplatek za uložení",
  "buildings.bank.withdraw_fee": "Poplatek za výběr",
  "buildings.bank.deposit_confirm": "Uložit předmět? Poplatek: {fee}g",
  "buildings.bank.withdraw_confirm": "Vybrat předmět?",
  "buildings.bank.upgrade_confirm": "Vylepšit trezor? Cena: {cost}g, Nová kapacita: {slots} slotů, Bonus k energii: +{energy}",
  "buildings.bank.error_full": "Bankovní trezor je plný!",
  "buildings.bank.error_no_space": "Inventář je plný!",
  "buildings.bank.error_no_gold": "Nedostatek zlata!",
  "buildings.bank.error_max_tier": "Již máte maximální úroveň trezoru!",
  "buildings.bank.success_deposit": "Předmět uložen do banky!",
  "buildings.bank.success_withdraw": "Předmět vybrán z banky!",
  "buildings.bank.success_upgrade": "Trezor vylepšen! Nová maximální energie: {maxEnergy}"
}
```

---

## ✅ Acceptance Criteria

### Must-Have (v1.0)
- ✅ 5 vault tiers (50/100/150/200/250 slots)
- ✅ Deposit items with 1% fee
- ✅ Withdraw items for free
- ✅ Vault upgrades cost gold (25k/50k/100k/200k/400k)
- ✅ Energy bonuses (+25/+50/+75/+100/+125)
- ✅ Only accessible in towns with bank building
- ✅ Items persist across sessions (auto-save)
- ✅ Database migrations run successfully
- ✅ Czech localization complete

### Nice-to-Have (v1.1)
- ⚠️ Drag & drop item transfer
- ⚠️ Transaction history log
- ⚠️ Item set saving/loading
- ⚠️ Bulk deposit/withdraw actions

### Future Scope (v2.0+)
- ⏰ Material storage tab
- ⏰ Guild bank sharing
- ⏰ Cosmetic vault themes
- ⏰ Leaderboard "Richest Vault" category

---

## 📅 Development Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Backend** | 3-4 days | Database schema, BankService, BALANCE_CONFIG |
| **Phase 2: UI** | 5-7 days | BankBuilding component, transfer logic, upgrade panel |
| **Phase 3: Testing** | 2-3 days | Unit tests, integration tests, balance validation |
| **Phase 4: Polish** | 1-2 days | Animations, sounds, Czech localization |

**Total Estimated Time:** 11-16 days (~2-3 weeks)

---

## 🎯 Success Metrics

**Launch Targets (30 days post-release):**
- 60%+ of active players unlock Tier 1
- 30%+ of active players reach Tier 3
- 10%+ of active players reach Tier 5
- 500,000g+ total gold sunk via upgrades
- 50,000g+ total gold sunk via deposit fees
- <1% bug reports related to bank functionality

**Player Satisfaction:**
- "Inventory management improved" - 80%+ positive feedback
- "Bank is worth the investment" - 70%+ positive feedback
- "Energy bonuses are valuable" - 60%+ positive feedback

---

## 📞 Support & Documentation

**Known Issues:**
- None (pre-launch)

**FAQ:**
- Q: Can I access bank from worldmap? **A: No, only in towns.**
- Q: Do I lose items if I don't pay deposit fee? **A: No, transaction cancels.**
- Q: Can I downgrade vault tier? **A: No, upgrades are permanent.**
- Q: What happens if bank is full? **A: Cannot deposit until space available.**

**Contact:**
- Developer: Roman Hlaváček - rhsoft.cz
- Issues: GitHub Issues
- Feedback: In-game feedback form (planned)

---

**End of Document**
