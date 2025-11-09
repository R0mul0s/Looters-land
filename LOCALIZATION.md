# Localization Guide - Looters Land

**Author:** Roman Hlaváček - rhsoft.cz
**Copyright:** 2025
**Last Modified:** 2025-01-07

---

## Overview

Looters Land uses a custom internationalization (i18n) system for managing game text in multiple languages. All user-facing text is stored in locale files, making it easy to add new languages and maintain consistent translations.

## Supported Languages

- **English** (`en`) - Default language
- **Czech** (`cs`) - Czech translation

## File Structure

```
src/localization/
├── locales/
│   ├── en.ts          # English translations
│   └── cs.ts          # Czech translations
└── i18n.ts            # Core i18n system
```

## Usage

### Basic Translation

```typescript
import { t } from './localization/i18n';

// Simple translation
const title = t('app.title'); // 'Looters Land'
const warrior = t('heroClasses.warrior'); // 'Warrior' or 'Válečník'
```

### Translation with Replacements

```typescript
// Text with placeholders
t('combat.attacks', {
  attacker: 'Warrior',
  target: 'Goblin',
  damage: '50'
});
// Result: 'Warrior attacks Goblin for 50 damage'
```

### In React Components

```typescript
import { t } from '../localization/i18n';

function CombatButton() {
  return <button>{t('combat.startCombat')}</button>;
}
```

### Using the React Hook

For components that need to re-render when language changes:

```typescript
import { useTranslation } from '../localization/i18n';

function LanguageSwitcher() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div>
      <p>{t('app.title')}</p>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('cs')}>Čeština</button>
      <p>Current: {language}</p>
    </div>
  );
}
```

## Adding New Text

### Step 1: Add to English locale

Edit [src/localization/locales/en.ts](src/localization/locales/en.ts):

```typescript
export const en = {
  // ... existing translations ...

  newFeature: {
    title: 'New Feature',
    description: 'This is a new feature description',
    button: 'Click Here',
  },
};
```

### Step 2: Add to Czech locale

Edit [src/localization/locales/cs.ts](src/localization/locales/cs.ts):

```typescript
export const cs: LocaleKeys = {
  // ... existing translations ...

  newFeature: {
    title: 'Nová Funkce',
    description: 'Toto je popis nové funkce',
    button: 'Klikni Zde',
  },
};
```

### Step 3: Use in code

```typescript
const title = t('newFeature.title');
const description = t('newFeature.description');
```

## Translation Categories

### App Header
```typescript
t('app.title')         // 'Looters Land'
t('app.subtitle')      // 'Idle RPG Adventure - Loot, Fight, Conquer!'
```

### Hero Classes
```typescript
t('heroClasses.warrior')   // 'Warrior' / 'Válečník'
t('heroClasses.archer')    // 'Archer' / 'Lučištník'
t('heroClasses.mage')      // 'Mage' / 'Mág'
t('heroClasses.cleric')    // 'Cleric' / 'Klerik'
t('heroClasses.paladin')   // 'Paladin' / 'Paladin'
```

### Stats
```typescript
t('stats.hp')       // 'HP' / 'Životy'
t('stats.atk')      // 'ATK' / 'Útok'
t('stats.def')      // 'DEF' / 'Obrana'
t('stats.spd')      // 'SPD' / 'Rychlost'
t('stats.crit')     // 'CRIT' / 'Kritický Zásah'
t('stats.level')    // 'Level' / 'Úroveň'
```

### Combat
```typescript
t('combat.startCombat')      // 'Start Combat' / 'Zahájit Boj'
t('combat.victory')          // '🎉 VICTORY! ...'
t('combat.defeat')           // '💀 DEFEAT! ...'
```

### Skills
```typescript
t('skills.heavySlash.name')         // 'Heavy Slash' / 'Těžký Sek'
t('skills.heavySlash.description')  // 'Deal 150% ATK damage...'
```

### UI Elements
```typescript
t('ui.confirm')    // 'Confirm' / 'Potvrdit'
t('ui.cancel')     // 'Cancel' / 'Zrušit'
t('ui.save')       // 'Save' / 'Uložit'
```

### Errors
```typescript
t('errors.generic')              // 'An error occurred'
t('errors.cooldownActive')       // 'Skill is on cooldown'
t('errors.notEnoughResources')   // 'Not enough resources'
```

## Language Management

### Get Current Language

```typescript
import { getLanguage } from './localization/i18n';

const currentLang = getLanguage(); // 'en' or 'cs'
```

### Change Language

```typescript
import { setLanguage } from './localization/i18n';

setLanguage('cs'); // Switch to Czech
setLanguage('en'); // Switch to English
```

Language preference is automatically saved to `localStorage` and restored on page reload.

### Get Available Languages

```typescript
import { getAvailableLanguages } from './localization/i18n';

const languages = getAvailableLanguages(); // ['en', 'cs']
```

## Adding a New Language

### 1. Create locale file

Create `src/localization/locales/de.ts` (example for German):

```typescript
/**
 * German Localization
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 * @lastModified 2025-01-07
 */

import type { LocaleKeys } from './en';

export const de: LocaleKeys = {
  app: {
    title: 'Looters Land',
    subtitle: 'Idle-RPG-Abenteuer - Plündern, Kämpfen, Erobern!',
  },
  // ... rest of translations
};
```

### 2. Register in i18n.ts

Edit [src/localization/i18n.ts](src/localization/i18n.ts):

```typescript
import { de } from './locales/de';

export type Language = 'en' | 'cs' | 'de';

const locales: Record<Language, LocaleKeys> = {
  en,
  cs,
  de,  // Add new language
};
```

### 3. Test the translation

```typescript
setLanguage('de');
console.log(t('app.title')); // Should work!
```

## Best Practices

### 1. Always Use Translation Keys

❌ **BAD:**
```typescript
<button>Start Combat</button>
```

✅ **GOOD:**
```typescript
<button>{t('combat.startCombat')}</button>
```

### 2. Use Descriptive Keys

❌ **BAD:**
```typescript
t('text1')
t('button2')
```

✅ **GOOD:**
```typescript
t('combat.startCombat')
t('inventory.equipItem')
```

### 3. Group Related Translations

✅ **GOOD:**
```typescript
combat: {
  startCombat: 'Start Combat',
  nextTurn: 'Next Turn',
  victory: 'Victory!',
}
```

### 4. Use Placeholders for Dynamic Content

✅ **GOOD:**
```typescript
// In locale file:
attacks: '{attacker} attacks {target} for {damage} damage'

// In code:
t('combat.attacks', {
  attacker: hero.name,
  target: enemy.name,
  damage: damage.toString()
})
```

### 5. Keep Keys Consistent Across Languages

Both `en.ts` and `cs.ts` must have the exact same structure and keys.

## Type Safety

The localization system is fully type-safe. TypeScript will warn you if:
- You use a key that doesn't exist
- The structure doesn't match between languages
- You forget required placeholders

```typescript
// TypeScript will error on non-existent keys
t('nonExistent.key'); // ❌ Error

// TypeScript ensures all languages have same structure
export const cs: LocaleKeys = { // ✅ Type-safe
  // Must match en.ts structure
};
```

## Debugging

### Missing Translation Warning

If a translation key is not found, the system will:
1. Log a warning to console: `Translation key not found: some.key`
2. Return the key itself as fallback

### Language Not Saved

Language preference is saved to `localStorage` with key `game-language`. Check browser DevTools → Application → Local Storage.

### Component Not Re-rendering

Use the `useTranslation()` hook instead of direct `t()` calls if you need the component to re-render when language changes:

```typescript
// Will NOT re-render on language change
function MyComponent() {
  return <h1>{t('app.title')}</h1>;
}

// WILL re-render on language change
function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('app.title')}</h1>;
}
```

## Examples

### Combat Log with Translations

```typescript
import { t } from './localization/i18n';

function logCombatAction(attacker: string, target: string, damage: number) {
  const message = t('combat.attacks', {
    attacker,
    target,
    damage: damage.toString()
  });
  console.log(message);
  // EN: "Warrior attacks Goblin for 50 damage"
  // CS: "Válečník útočí na Goblin za 50 poškození"
}
```

### Dynamic Skill Descriptions

```typescript
function SkillTooltip({ skillKey }: { skillKey: string }) {
  return (
    <div className="tooltip">
      <h3>{t(`skills.${skillKey}.name`)}</h3>
      <p>{t(`skills.${skillKey}.description`)}</p>
    </div>
  );
}

// Usage:
<SkillTooltip skillKey="heavySlash" />
```

### Error Messages

```typescript
try {
  equipItem(item);
} catch (error) {
  alert(t('errors.invalidAction'));
  console.error(error);
}
```

---

## Reference

For complete list of all available translation keys, see:
- [English translations](src/localization/locales/en.ts)
- [Czech translations](src/localization/locales/cs.ts)
- [i18n system](src/localization/i18n.ts)

For coding standards, see [CODING_RULES.md](CODING_RULES.md)
