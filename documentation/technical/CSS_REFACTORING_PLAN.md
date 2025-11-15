# CSS Styling Refactoring Plan - Looters Land

**Author:** Roman Hlaváček - rhsoft.cz
**Created:** 2025-11-15
**Status:** In Progress

---

## Overview

This document outlines the complete plan for refactoring CSS styling across the Looters Land project. The goal is to replace hardcoded inline styles with design tokens and reusable style utilities for consistency, maintainability, and easier theming.

---

## Current State Analysis

### Project Statistics
- **Total Files:** 37+ .tsx files
- **Hardcoded Colors:** 695+ occurrences
- **Hardcoded Spacing:** 1,232+ px values
- **Inline Style Objects:** 346+ occurrences
- **Style Constants:** 37+ `const styles` objects
- **Box Shadows:** 150+ definitions
- **Gradient Patterns:** 80+ definitions

### Most Common Hardcoded Values
- `#2dd4bf` (teal primary) - 100+ occurrences
- `10px`, `15px`, `20px` spacing - 700+ occurrences
- `rgba(0, 0, 0, 0.85)` overlay - 20+ occurrences
- `#f1f5f9`, `#e2e8f0` text colors - 130+ occurrences

---

## Design System Foundation

### ✅ Phase 1: Tokens & Common Styles (COMPLETED)

Created comprehensive design tokens system:

#### Files Created
1. **`src/styles/tokens.ts`** - Design tokens
   - COLORS (100+ color values)
   - SPACING (4px base grid + semantic aliases)
   - BORDER_RADIUS (sm to round)
   - FONT_SIZE (xs to 9xl)
   - FONT_WEIGHT (normal to bold)
   - SHADOWS (including glow effects)
   - Z_INDEX (base to notification)
   - TRANSITIONS (fast, base, slow)
   - BLUR (backdrop filter values)
   - WIDTHS & HEIGHTS (common dimensions)

2. **`src/styles/common.ts`** - Reusable style objects
   - Card styles (card, cardLight, cardHover)
   - Button styles (button, buttonDanger, buttonSuccess, buttonDisabled)
   - Flex utilities (flexCenter, flexRow, flexColumn, flexBetween, flexWrap)
   - Input styles
   - Modal styles (backdrop, content)
   - Badge styles (info, success, warning, danger)
   - Tooltip style
   - Progress bar styles (HP, Energy, Mana)
   - Tab navigation styles
   - Info box variants
   - Sidebar styles
   - Header style
   - Resource display style
   - Helper functions (getRarityColor, getRoomColor, getBadgeStyle, getInfoBoxStyle)

3. **`documentation/technical/coding_rules.md`** - Section 15.18
   - CSS and Styling Standards added
   - Usage examples
   - Best practices

---

## Refactoring Strategy

### Approach: Incremental Refactoring (Method A)

We will refactor components tier by tier, testing after each component to ensure no regressions.

**Benefits:**
- ✅ Lower risk of breaking changes
- ✅ Easier to test and validate
- ✅ Can pause/resume work easily
- ✅ Progressive improvement

---

## Refactoring Tiers

### 🔴 TIER 1 - Critical Components (Week 2)

**Priority:** Highest
**Reason:** Core UI used everywhere, highest visual impact

| # | Component | Complexity | Estimated Time |
|---|-----------|------------|----------------|
| 1 | GameLayout.tsx | HIGH | 2 hours |
| 2 | MainSidebar.tsx | HIGH | 2 hours |
| 3 | GameHeader.tsx | MEDIUM | 1.5 hours |
| 4 | BottomNavigation.tsx | MEDIUM | 1 hour |
| 5 | GameModal.tsx | MEDIUM | 1 hour |
| 6 | ProfileScreen.tsx | HIGH | 2 hours |
| 7 | LoginScreen.tsx | HIGH | 2 hours |

**Total Estimated Time:** 11.5 hours

**Key Changes:**
- Replace all hardcoded colors with COLORS tokens
- Replace all hardcoded spacing with SPACING tokens
- Use common style objects where applicable
- Keep dynamic values (from props/state) in inline styles

---

### 🟡 TIER 2 - High Priority (Weeks 3-4)

**Priority:** High
**Reason:** Frequently used, visible in gameplay

| # | Component | Complexity | Estimated Time |
|---|-----------|------------|----------------|
| 8 | TownScreen.tsx | HIGH | 2 hours |
| 9 | InventoryScreen.tsx | HIGH | 2 hours |
| 10 | HeroesScreen.tsx | HIGH | 2.5 hours |
| 11 | LeaderboardScreen.tsx | HIGH | 2 hours |
| 12 | PartyManager.tsx | HIGH | 2 hours |
| 13 | TeleportMenu.tsx | MEDIUM | 1.5 hours |
| 14 | DungeonMinimap.tsx | HIGH | 2 hours |
| 15 | ComingSoon.tsx | LOW | 0.5 hours |

**Total Estimated Time:** 14.5 hours

---

### 🟢 TIER 3 - Medium Priority (Weeks 5-6)

**Priority:** Medium
**Reason:** Supporting components

| # | Component | Complexity | Estimated Time |
|---|-----------|------------|----------------|
| 16 | TavernBuilding.tsx | MEDIUM | 1 hour |
| 17 | SmithyBuilding.tsx | MEDIUM | 1 hour |
| 18 | HealerBuilding.tsx | MEDIUM | 1 hour |
| 19 | MarketBuilding.tsx | MEDIUM | 1 hour |
| 20 | BankBuilding.tsx | MEDIUM | 1 hour |
| 21 | GuildHallBuilding.tsx | MEDIUM | 1 hour |
| 22 | GachaSummon.tsx | MEDIUM | 1.5 hours |
| 23 | HeroCollection.tsx | HIGH | 2 hours |
| 24 | WeatherTimeWidget.tsx | LOW | 1 hour |
| 25 | LastUpdates.tsx | MEDIUM | 1 hour |
| 26 | ItemTooltip.tsx | MEDIUM | 1 hour |
| 27 | ItemDisplay.tsx | MEDIUM | 1 hour |
| 28 | SyncStatusIndicator.tsx | LOW | 0.5 hours |

**Total Estimated Time:** 14 hours

---

### ⚪ TIER 4 - Low Priority (Week 7)

**Priority:** Low
**Reason:** Demo components, less critical

| # | Component | Complexity | Estimated Time |
|---|-----------|------------|----------------|
| 29 | ChatBox.tsx | MEDIUM | 1 hour |
| 30 | ChatBubble.tsx | LOW | 0.5 hours |
| 31 | OtherPlayerMarker.tsx | LOW | 0.5 hours |
| 32 | ModalContent.tsx | LOW | 0.5 hours |
| 33 | WorldMapViewer.tsx | MEDIUM | 1.5 hours |
| 34 | DungeonExplorer.tsx | HIGH | 2 hours |
| 35 | WorldMapDemo.tsx | LOW | 0.5 hours (or delete) |
| 36 | WorldMapDemo2.tsx | LOW | 0.5 hours (or delete) |
| 37 | App.tsx | VERY HIGH | TBD (needs separate analysis) |

**Total Estimated Time:** 7 hours (excluding App.tsx)

---

## Total Project Scope

**Total Components:** 37 files
**Total Estimated Time:** 47 hours (excluding App.tsx)
**Timeline:** 5-6 weeks (1 developer, part-time)

---

## Refactoring Checklist (Per Component)

For each component, follow this checklist:

### 1. Preparation
- [ ] Read the component file
- [ ] Identify all hardcoded colors
- [ ] Identify all hardcoded spacing values
- [ ] Identify all hardcoded shadows/effects
- [ ] Note any dynamic styling (props/state dependent)

### 2. Refactoring
- [ ] Import design tokens (`COLORS`, `SPACING`, etc.)
- [ ] Import common styles if applicable
- [ ] Replace hardcoded colors with token equivalents
- [ ] Replace hardcoded spacing with token equivalents
- [ ] Replace hardcoded shadows with token equivalents
- [ ] Use common style objects where possible
- [ ] Keep dynamic values in inline styles with token composition

### 3. Testing
- [ ] Verify component renders correctly
- [ ] Check all color values match original
- [ ] Check all spacing values match original
- [ ] Test dynamic styling (hover, active, etc.)
- [ ] Test responsive behavior if applicable

### 4. Documentation
- [ ] Update file header `@lastModified` date
- [ ] Add comment if significant changes made
- [ ] Mark todo as completed

---

## Example Refactoring

### Before:
```typescript
const styles = {
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    border: '2px solid #20b2aa',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
  },
  button: {
    background: 'linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%)',
    border: '2px solid #4a9eff',
    borderRadius: '4px',
    padding: '10px 15px',
    color: '#ffffff',
    cursor: 'pointer'
  }
};
```

### After:
```typescript
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/tokens';
import { cardStyle, buttonStyle } from '../styles/common';

const styles = {
  container: cardStyle,  // Or customize if needed
  button: buttonStyle
};

// If customization needed:
const styles = {
  container: {
    ...cardStyle,
    borderColor: isActive ? COLORS.borderSuccess : COLORS.borderTeal
  }
};
```

---

## Progress Tracking

### ✅ Completed
- [x] Design tokens system created
- [x] Common styles library created
- [x] Coding rules updated
- [x] Refactoring plan documented
- [x] **TIER 1 refactoring (7/7 components)** ✅
  - [x] GameLayout.tsx
  - [x] MainSidebar.tsx
  - [x] GameHeader.tsx
  - [x] BottomNavigation.tsx
  - [x] GameModal.tsx
  - [x] ProfileScreen.tsx
  - [x] LoginScreen.tsx
- [x] **TIER 2 refactoring (8/8 components)** ✅
  - [x] TownScreen.tsx
  - [x] InventoryScreen.tsx
  - [x] HeroesScreen.tsx
  - [x] LeaderboardScreen.tsx
  - [x] PartyManager.tsx
  - [x] TeleportMenu.tsx
  - [x] DungeonMinimap.tsx
  - [x] ComingSoon.tsx
- [x] **TIER 3 refactoring (13/13 components)** ✅
  - [x] TavernBuilding.tsx
  - [x] SmithyBuilding.tsx
  - [x] HealerBuilding.tsx
  - [x] MarketBuilding.tsx
  - [x] BankBuilding.tsx
  - [x] GuildHallBuilding.tsx
  - [x] GachaSummon.tsx
  - [x] HeroCollection.tsx
  - [x] WeatherTimeWidget.tsx
  - [x] LastUpdates.tsx
  - [x] ItemTooltip.tsx
  - [x] ItemDisplay.tsx
  - [x] SyncStatusIndicator.tsx

- [x] **TIER 4 refactoring (9/9 components)** ✅
  - [x] ChatBox.tsx
  - [x] ChatBubble.tsx
  - [x] OtherPlayerMarker.tsx
  - [x] ModalContent.tsx
  - [x] WorldMapViewer.tsx
  - [x] DungeonExplorer.tsx
  - [x] WorldMapDemo.tsx
  - [x] WorldMapDemo2.tsx
  - [x] App.tsx

### 🔄 In Progress
- None

### 📋 Pending
- None - All refactoring complete! 🎉

---

## Refactoring Statistics

### Overall Progress: 100% Complete (37/37 components) ✅

**Completed:**
- TIER 1: 7/7 components (100%) ✅
- TIER 2: 8/8 components (100%) ✅
- TIER 3: 13/13 components (100%) ✅
- TIER 4: 9/9 components (100%) ✅

**Build Status:** All builds passing ✅

---

## Notes

- All refactored components must pass visual comparison test ✅
- Dev server must remain functional throughout refactoring ✅
- TypeScript compilation must pass after each component ✅
- Commit after each tier completion for easy rollback if needed ✅
- **All 37 components successfully refactored with design tokens** ✅
- Key patterns applied: COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, TRANSITIONS, SHADOWS, Z_INDEX, BLUR
- Common utilities used: flexColumn, flexCenter, flexBetween
- **TIER 4 additions:**
  - App.tsx refactored with 188+ style properties updated
  - Enhanced tokens.ts with structured color organization (COLORS.text.*, COLORS.background.*, etc.)
  - Added fractional spacing values (SPACING[2.5], SPACING[3.5])
  - Maintained backward compatibility with flat legacy properties

---

**Last Updated:** 2025-11-15
