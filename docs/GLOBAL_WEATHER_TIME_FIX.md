# Fix: Weather & Time Auto-Update

## 🐛 Problém

Počasí a denní doba se automaticky měnily v databázi (díky cron jobu), ale **frontend nezobrazoval aktualizace**:

1. Countdown timer se neodpočítával každou sekundu
2. Když countdown došel k 0, zobrazoval "Soon", ale nové počasí/čas se nezobrazilo
3. Realtime updates fungovaly, ale s malým zpožděním

## ✅ Řešení

### 1. Přidán timer pro countdown widget

**Soubor:** `src/components/WeatherTimeWidget.tsx`

```typescript
// Force re-render every second to update countdown
const [, forceUpdate] = React.useReducer(x => x + 1, 0);

React.useEffect(() => {
  const interval = setInterval(() => {
    forceUpdate();
  }, 1000); // Update every second

  return () => clearInterval(interval);
}, []);
```

**Co to dělá:**
- Každou sekundu přepočítá zbývající čas
- Countdown se nyní plynule snižuje (59m → 58m → 57m...)
- Bez tohoto by se countdown aktualizoval jen při překreslení komponenty

### 2. Přidán polling jako fallback

**Soubor:** `src/hooks/useGlobalWorldState.ts`

```typescript
// Poll for updates every 30 seconds as fallback (in case Realtime is slow)
const pollInterval = setInterval(async () => {
  const result = await GlobalWorldStateService.getGlobalWorldState();
  if (result.success && result.state) {
    const newWeather = GlobalWorldStateService.convertToWeatherState(result.state);
    const newTime = GlobalWorldStateService.convertToTimeState(result.state);

    // Only update if state actually changed (to avoid unnecessary re-renders)
    setWeather(prev => {
      if (!prev || prev.current !== newWeather.current) {
        console.log('🔄 Weather state changed via polling:', newWeather.current);
        return newWeather;
      }
      // Update changesAt even if current hasn't changed (for countdown)
      return { ...prev, changesAt: newWeather.changesAt, next: newWeather.next };
    });

    setTimeOfDay(prev => {
      if (!prev || prev.current !== newTime.current) {
        console.log('🔄 Time state changed via polling:', newTime.current);
        return newTime;
      }
      // Update changesAt even if current hasn't changed (for countdown)
      return { ...prev, changesAt: newTime.changesAt, next: newTime.next };
    });
  }
}, 30000); // Poll every 30 seconds
```

**Co to dělá:**
- Každých 30 sekund ověří stav v databázi
- Pokud se počasí/čas změnilo, aktualizuje ho
- Funguje i kdyby Realtime selhal nebo měl zpoždění
- Optimalizované - neaktualizuje, pokud se nic nezměnilo

## 🔄 Jak to nyní funguje

```
1. Edge Function běží každých 15 minut (cron job)
   ↓
2. Kontroluje, jestli uplynula doba pro přechod
   ↓
3. Pokud ano, aktualizuje databázi
   ↓
4. Realtime push notifikace → všichni hráči dostanou update
   ↓
5. FALLBACK: Polling každých 30 sekund → ověří změny
   ↓
6. Frontend aktualizuje počasí/čas
   ↓
7. WeatherTimeWidget se překresluje každou sekundu → countdown se snižuje
```

## 📊 Timeline příkladu

**11:30:00** - Čas by měl změnit z `day` na `dusk` za 19 minut
**11:49:00** - Čas expiruje, čeká na další cron run
**11:50:00** - Cron job běží → Edge Function → Databáze aktualizována na `dusk`
**11:50:01** - Realtime push → Frontend aktualizován
**11:50:02** - WeatherTimeWidget zobrazuje `dusk` s novým countdownem

**Pokud Realtime selže:**
**11:50:30** - Polling detekuje změnu → Frontend aktualizován

## ✅ Verifikace

Po implementaci byste měli vidět:

1. **Countdown se snižuje každou sekundu**
   - V konzoli: žádné logy (countdown běží tiše)
   - Na obrazovce: "15m" → "14m 59s" → "14m 58s"...

2. **Když countdown dojde k 0**
   - Zobrazí "Soon"
   - V konzoli: `⏰ Weather/Time Debug:` s detaily

3. **Když cron job aktualizuje databázi (každých 15 minut)**
   - V konzoli: `🌍 Global world state updated in real-time:` (Realtime)
   - NEBO: `🔄 Weather state changed via polling:` (fallback)
   - Počasí/čas se okamžitě změní
   - Countdown začne znovu

4. **V Edge Function logs** (Supabase Dashboard)
   - Vidíte `"✅ Global world state updated successfully"`
   - Vidíte `"Weather transitioning from X to Y"`
   - Vidíte `"Time transitioning from X to Y"`

## 🐛 Troubleshooting

### Countdown se stále neodpočítává

**Příčina:** Timer není aktivní

**Řešení:** Zkontrolujte konzoli prohlížeče - měli byste vidět countdown debug logy když dosáhne "Soon"

### Počasí/čas se nezmění ani po "Soon"

**Příčina:** Edge Function neaktualizovala databázi

**Řešení:**
1. Zkontrolujte Edge Function logs v Supabase Dashboard
2. Spusťte diagnostiku: `supabase/debug/diagnose-weather-time-cron.sql`
3. Ověřte, že cron job běží: Query #2 by měl ukazovat `status: succeeded`

### Realtime nefunguje

**Příčina:** Tabulka není v Realtime publication

**Řešení:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE global_world_state;
```

**Ověření:** Polling by měl fungovat jako fallback - zkontrolujte logy:
```
🔄 Weather state changed via polling: rain
```

## 📝 Soubory změněny

1. ✅ `src/components/WeatherTimeWidget.tsx` - Timer pro countdown
2. ✅ `src/hooks/useGlobalWorldState.ts` - Polling fallback

## 📚 Související dokumentace

- [GLOBAL_WORLD_STATE_SETUP.md](./GLOBAL_WORLD_STATE_SETUP.md) - Kompletní setup guide
- [DEBUG_WEATHER_TIME_UPDATES.md](./DEBUG_WEATHER_TIME_UPDATES.md) - Debugging guide
- [diagnose-weather-time-cron.sql](../supabase/debug/diagnose-weather-time-cron.sql) - Diagnostické dotazy

---

**Autor:** Claude Code Assistant
**Vytvořeno:** 2025-11-13
**Status:** ✅ Implementováno a testováno
