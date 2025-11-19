# 🎮 Combat System Improvements - Development Manual

> **Kompletní manuál pro vylepšení bojového systému v Looters Land**
>
> Autor: Roman Hlaváček - rhsoft.cz
> Datum: 2025-11-19
> Verze: 1.0

---

## 📋 Obsah

1. [Přehled projektu](#přehled-projektu)
2. [Fázování implementace](#fázování-implementace)
3. [Technické požadavky](#technické-požadavky)
4. [Jak začít](#jak-začít)
5. [Testing strategie](#testing-strategie)

---

## 🎯 Přehled projektu

Tento manuál popisuje kompletní upgrade stávajícího bojového systému. Celková implementace je rozdělena do **5 fází**, které je možné implementovat postupně bez narušení funkcionality.

### Současný stav
- ✅ Základní turn-based combat s iniciativou
- ✅ Auto combat režim
- ✅ Skill systém (damage/heal/buff/AOE)
- ✅ Status effects a cooldowns
- ✅ Integration s dungeonem a worldmap

### Cílový stav
- 🎯 Moderní, responsivní Combat UI
- 🎯 Tactical depth (elements, accuracy, positioning)
- 🎯 Intelligent AI (boss phases, group tactics)
- 🎯 Rich player experience (tooltips, animations, stats)
- 🎯 Replayability (challenges, achievements)

---

## 🗓️ Fázování implementace

### **PHASE 1: UI/UX Improvements** ⏱️ 8-12h
*Quick wins - immediate visual impact*

**Soubory:**
- [`PHASE_1_UI_UX.md`](./PHASE_1_UI_UX.md)

**Obsahuje:**
- Combat speed controls (1x/2x/4x)
- Initiative order bar
- Active character highlighting
- Responsive layout fixes
- Skill/Enemy tooltips

**Závislosti:** Žádné
**Priority:** 🔴 HIGH

---

### **PHASE 2: Combat Mechanics Depth** ⏱️ 12-16h
*Core gameplay improvements*

**Soubory:**
- [`PHASE_2_MECHANICS.md`](./PHASE_2_MECHANICS.md)

**Obsahuje:**
- Accuracy/Evasion system
- Elemental damage types
- Damage number animations
- Status effect visual indicators
- Enhanced combat log

**Závislosti:** PHASE 1 (tooltips nutné pro zobrazení resistances)
**Priority:** 🔴 HIGH

---

### **PHASE 3: Advanced Combat Features** ⏱️ 16-24h
*Strategic depth*

**Soubory:**
- [`PHASE_3_ADVANCED.md`](./PHASE_3_ADVANCED.md)

**Obsahuje:**
- Formation/Positioning system
- Combo mechanics
- Resource system (mana/energy)
- Counter-attacks & blocking
- Enhanced AI (boss phases)

**Závislosti:** PHASE 2 (elemental system pro combo bonusy)
**Priority:** 🟡 MEDIUM

---

### **PHASE 4: Component Refactoring** ⏱️ 8-12h
*Code quality & maintainability*

**Soubory:**
- [`PHASE_4_REFACTORING.md`](./PHASE_4_REFACTORING.md)

**Obsahuje:**
- Dedicated CombatScreen component
- Combat state management cleanup
- Separate DungeonCombat vs QuickCombat
- Performance optimizations
- Unit tests

**Závislosti:** PHASE 1-3 (refactor po implementaci features)
**Priority:** 🟢 LOW (ale důležité pro maintenance)

---

### **PHASE 5: Meta Features** ⏱️ 12-16h
*Replayability & polish*

**Soubory:**
- [`PHASE_5_META.md`](./PHASE_5_META.md)

**Obsahuje:**
- Combat challenges & achievements
- Post-combat statistics screen
- Combat replay/timeline
- Keyboard shortcuts
- Difficulty modifiers

**Závislості:** PHASE 4 (vyžaduje clean architecture)
**Priority:** 🟢 LOW

---

## 📊 Celkový Timeline

```
PHASE 1: UI/UX           ████████░░ (1-2 týdny)
PHASE 2: Mechanics       ████████████░░ (2-3 týdny)
PHASE 3: Advanced        ████████████████░░ (3-4 týdny)
PHASE 4: Refactoring     ████████░░ (1-2 týdny)
PHASE 5: Meta            ████████████░░ (2-3 týdny)

TOTAL: 9-14 týdnů (part-time) nebo 5-7 týdnů (full-time)
```

---

## 🛠️ Technické požadavky

### Vývojové prostředí
- Node.js 18+
- TypeScript 5+
- React 18+
- Vite
- ESLint + Prettier

### Nové dependencies
```json
{
  "framer-motion": "^11.0.0",        // Animace
  "react-tooltip": "^5.25.0",        // Tooltips
  "@dnd-kit/core": "^6.1.0",         // Drag & drop (PHASE 3)
  "zustand": "^4.4.0"                // State management (PHASE 4)
}
```

### Testing stack
```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.5.0"
}
```

---

## 🚀 Jak začít

### 1. Příprava projektu

```bash
cd looters-land

# Install new dependencies
npm install framer-motion react-tooltip

# Create branch
git checkout -b feature/combat-improvements

# Create directory structure
mkdir -p src/components/combat
mkdir -p src/hooks/combat
mkdir -p src/utils/combat
mkdir -p src/types/combat
```

### 2. Přečti si PHASE 1 manuál

```bash
# Otevři první fázi
code docs/combat-improvements/PHASE_1_UI_UX.md
```

### 3. Implementuj postupně

- ✅ Každá fáze má **step-by-step instrukce**
- ✅ Každý krok má **testovací checklist**
- ✅ Po každém kroku **commit changes**
- ✅ Na konci fáze **full testing**

### 4. Code review checklist

Po každé fázi zkontroluj:
- [ ] Všechny TypeScript errors vyřešeny
- [ ] ESLint warnings vyřešeny
- [ ] Komponenty jsou responsive
- [ ] Performance není degradovaná
- [ ] Backwards compatibility zachována
- [ ] Documentation aktualizována

---

## 🧪 Testing strategie

### Manual testing
Každá fáze má vlastní **Testing Checklist** na konci manuálu.

### Automated testing
```bash
# Run unit tests
npm run test

# Run e2e tests (PHASE 4+)
npm run test:e2e

# Check coverage
npm run test:coverage
```

### Performance testing
```bash
# Check bundle size
npm run build
npm run analyze

# Profile combat rendering
# Use React DevTools Profiler during combat
```

---

## 📞 Support & Questions

- **GitHub Issues:** [looters-land/issues](https://github.com/your-repo/issues)
- **Discord:** #combat-dev channel
- **Email:** roman@rhsoft.cz

---

## 📚 Další dokumentace

- [Combat Engine API](../api/CombatEngine.md)
- [Hero System](../api/Hero.md)
- [Enemy AI](../api/Enemy.md)
- [Status Effects](../api/StatusEffects.md)

---

## 🎉 Začínáme!

**Připraven?** Otevři [`PHASE_1_UI_UX.md`](./PHASE_1_UI_UX.md) a začni implementovat! 🚀
