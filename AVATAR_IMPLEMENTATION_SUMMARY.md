# Avatar System Implementation Summary

**Date:** 2025-11-12
**Status:** ✅ 90% Complete - Requires Database Migration & Final Integration

## ✅ Completed Changes

### 1. Database Schema Updates
- **PlayerProfile Interface** updated in:
  - `src/services/PlayerProfileService.ts` (line 15)
  - `src/services/ProfileService.ts` (line 23)
- Added `avatar: string` field with default `'hero1.png'`

### 2. Avatar Configuration
- **Created:** `src/config/AVATAR_CONFIG.ts`
- Defines available avatars: hero1.png (Knight), hero2.png (Warrior)
- Export `DEFAULT_AVATAR = 'hero1.png'`

### 3. Profile Service Updates
- **Added:** `updateAvatar()` function in `src/services/ProfileService.ts` (line 175)
- **Updated:** `createProfile()` sets default avatar in `PlayerProfileService.ts` (line 125)

### 4. ProfileScreen UI
- **File:** `src/components/ProfileScreen.tsx`
- Added avatar selection section with preview images
- Grid layout showing both avatar options
- Click to select, auto-saves to database
- Shows "✓ Selected" badge on current avatar
- Added prop: `playerAvatar?: string`

### 5. WorldMapViewer Image Imports
- **File:** `src/components/WorldMapViewer.tsx`
- Already imports `hero1Img` and `hero2Img`
- Currently hardcoded to use `hero1Img` only

### 6. SQL Migration
- **File:** `supabase/migrations/20251112_add_avatar_field.sql`
- Adds `avatar` column to `player_profiles` table
- Sets default value to `'hero1.png'`
- Updates existing profiles
- Creates index for performance

## 🔧 Required Steps to Complete

### Step 1: Run Database Migration

```bash
cd looters-land
# Option A: Using Supabase CLI
supabase db push

# Option B: Run SQL manually in Supabase Dashboard
# Go to SQL Editor and run the migration file
```

### Step 2: Update GameLayout Component

**File:** `src/components/GameLayout.tsx`

Find where `useGameState` is used and pass avatar to components:

```typescript
// In GameLayout.tsx, update ProfileScreen call:
<ProfileScreen
  playerName={playerProfile?.nickname || 'Player'}
  playerEmail={user?.email}
  playerLevel={playerProfile?.player_level}
  playerAvatar={playerProfile?.avatar || 'hero1.png'} // ADD THIS LINE
  gold={gold}
  gems={gems}
  heroCount={heroes.length}
  itemCount={items.length}
  onClose={() => setCurrentScreen('town')}
  onResetProgress={handleResetProgress}
  onAccountDeleted={handleAccountDeleted}
/>

// Also find WorldMapViewer and pass avatar:
<WorldMapViewer
  worldMap={worldMap}
  playerPosition={playerPosition}
  playerAvatar={playerProfile?.avatar || 'hero1.png'} // ADD THIS LINE
  otherPlayers={otherPlayers}
  // ... other props
/>
```

### Step 3: Update WorldMapViewer to Use Dynamic Avatar

**File:** `src/components/WorldMapViewer.tsx`

1. Add prop to interface (around line 39):
```typescript
interface WorldMapViewerProps {
  worldMap: WorldMap;
  playerPosition: { x: number; y: number };
  playerAvatar?: string; // ADD THIS
  otherPlayers?: OtherPlayer[];
  // ...
}
```

2. Update component destructuring (around line 54):
```typescript
export function WorldMapViewer({
  worldMap,
  playerPosition,
  playerAvatar = 'hero1.png', // ADD THIS
  otherPlayers = [],
  // ...
}: WorldMapViewerProps) {
```

3. Update hero image loading (around line 95-103):
```typescript
// Load hero avatar image
useEffect(() => {
  const img = new Image();
  // Dynamically select image based on avatar prop
  img.src = playerAvatar === 'hero2.png' ? hero2Img : hero1Img;
  img.onload = () => {
    setHeroImage(img);
    console.log(`✅ Hero avatar ${playerAvatar} loaded successfully`);
  };
  img.onerror = () => console.error(`Failed to load ${playerAvatar}`);
}, [playerAvatar]); // Add playerAvatar to dependencies
```

## 📋 Testing Checklist

After completing the steps above:

- [ ] Database migration ran successfully
- [ ] Can see avatar selection in Profile screen
- [ ] Can click and select different avatars
- [ ] Avatar saves to database (check Supabase dashboard)
- [ ] Page reloads after selecting avatar
- [ ] Selected avatar appears on worldmap
- [ ] Selected avatar persists after logout/login
- [ ] New players get default hero1.png avatar

## 🎨 Available Avatars

| ID | Filename | Display Name | Location |
|----|----------|--------------|----------|
| hero1 | hero1.png | Knight | `src/assets/images/hero/hero1.png` |
| hero2 | hero2.png | Warrior | `src/assets/images/hero/hero2.png` |

## 🔮 Future Enhancements

- Add more hero avatars (hero3.png, hero4.png, etc.)
- Update `AVAILABLE_AVATARS` in `src/config/AVATAR_CONFIG.ts`
- Import new images in `ProfileScreen.tsx`
- No other code changes needed!

## 📝 Files Modified

1. ✅ `src/services/PlayerProfileService.ts`
2. ✅ `src/services/ProfileService.ts`
3. ✅ `src/config/AVATAR_CONFIG.ts` (NEW)
4. ✅ `src/components/ProfileScreen.tsx`
5. ✅ `src/components/WorldMapViewer.tsx` (partial)
6. ✅ `supabase/migrations/20251112_add_avatar_field.sql` (NEW)
7. ⏳ `src/components/GameLayout.tsx` (TODO - pass props)

---

**Next Action:** Run database migration, then update GameLayout.tsx to pass avatar props!
