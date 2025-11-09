# 📋 Changelog

## v2.1.0 (2025-11-09)
### ✨ Nové funkce
- Přidána možnost editace uživatelského jména v profilu
- Přidáno tlačítko pro odhlášení v profilu
- Přidána sekce "Poslední změny" do hlavního menu

### 🐛 Opravy
- **Kritická oprava**: Vyřešen problém s mizením hrdinů při vstupu do dungeonů
- Opravena race condition v načítání dat ze hry
- Hrdové nyní správně persistují napříč dungeony a combaty

### 🔧 Technické změny
- Optimalizace `loadGameData` funkce
- Implementace správného lifecycle managementu pro game state
- Přidán `party_order` sloupec do databáze pro tracking aktivní party

## v2.0.0 (2025-11-08)
### ✨ Nové funkce
- Nový hlavní gameplay loop s World Map
- Dungeon exploration system
- Combat system s auto-battle režimem
- Hero gacha system
- Inventory management
- Equipment system
- Profile & settings screen

### 🎮 Gameplay
- Procedurálně generované dungeons
- Různé typy nepřátel (Easy, Normal, Hard, Elite)
- Loot system se zlatem a předměty
- Hero leveling a experience systém
- Active party management (4 hrdinové)

### 💾 Backend
- Supabase integrace pro multiplayer
- Row Level Security (RLS) policies
- Real-time updates
- Cloud saves

## v1.0.0 (2025-11-07)
### 🎉 Počáteční verze
- Základní hero systém
- Jednoduchý combat
- Local storage saves
