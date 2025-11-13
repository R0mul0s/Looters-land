# Jak zobrazit logy Edge Function

## Problém
Po ručním zavolání Edge funkce `update-global-world-state` se logy nezobrazují v Supabase Dashboard.

## Důvody

### 1. Logy se zobrazují s malým zpožděním
Edge Function logy v Supabase Dashboard se nezobrazují okamžitě. Může trvat 10-30 sekund, než se logy objeví.

**Řešení:** Počkejte chvíli a obnovte stránku s logy.

### 2. Logy se zobrazují pouze v reálném čase
Pokud nejste na stránce s logy v době volání funkce, logy se nemusí načíst zpětně.

**Řešení:** Otevřete stránku s logy PŘED voláním funkce.

### 3. Používáte špatné místo v Dashboard
Logy Edge funkce nejsou v hlavním "Logs" menu, ale přímo u každé funkce.

**Kde najít logy:**
```
Supabase Dashboard → Edge Functions → update-global-world-state → Logs tab
```

### 4. Funkce nebyla správně nasazena
Pokud funkce není nasazená nebo má chybu v kódu, logy se nezobrazí.

**Ověření:**
```bash
# Zkontrolujte, jestli je funkce nasazená
supabase functions list

# Nasaďte funkci znovu
supabase functions deploy update-global-world-state
```

### 5. Chyba v autorizaci
Pokud používáte špatný Authorization header, funkce může selhat a nezalogovat nic.

**Test volání:**
```bash
# Použijte SERVICE_ROLE_KEY (ne ANON_KEY!) pro testing
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

## Jak správně sledovat logy

### Metoda 1: Supabase Dashboard (nejjednodušší)

1. Otevřete Supabase Dashboard
2. Přejděte na **Edge Functions**
3. Klikněte na **update-global-world-state**
4. Klikněte na **Logs** tab
5. TEPRVE PAK zavolejte funkci ručně
6. Logy by se měly zobrazit do 10-30 sekund

### Metoda 2: Supabase CLI (nejrychlejší)

```bash
# Spusťte watching logs v terminálu
supabase functions logs update-global-world-state --follow

# V druhém terminálu zavolejte funkci
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

# Logy se zobrazí OKAMŽITĚ v prvním terminálu
```

### Metoda 3: Realtime logs přes Dashboard

1. Dashboard → Edge Functions → update-global-world-state → Logs
2. Zapněte "Auto-refresh" (ikona refresh v pravém horním rohu)
3. Nastavte refresh interval na 5 sekund
4. Zavolejte funkci
5. Logy se automaticky aktualizují

## Co byste měli vidět v lozích

### Úspěšné volání s přechodem
```
🌦️ Weather transitioning from clear to rain
✅ Global world state updated successfully
```

### Úspěšné volání bez přechodu
```
⏭️ No transitions needed yet
```

### Chyba
```
❌ Error updating global world state: [error message]
```

## Troubleshooting

### Logy jsou prázdné i po 1 minutě

**Možná příčina:** Funkce se vůbec nespustila

**Ověření:**
1. Zkontrolujte response z curl - měli byste dostat JSON odpověď
2. Zkontrolujte HTTP status code - měl by být 200
3. Zkontrolujte cron job run details:

```sql
SELECT
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-global-world-state')
ORDER BY start_time DESC
LIMIT 1;
```

### Logy se zobrazují jen pro cron, ne pro manuální volání

**Možná příčina:** Dashboard filtruje logy podle zdroje

**Řešení:** V Dashboard logu zkuste odstranit všechny filtry (Source filter)

### Console.log se nezobrazují vůbec

**Možná příčina:** Edge Function má chybu a padá před console.log

**Řešení:**
1. Přidejte console.log hned na začátek serve funkce:
```typescript
serve(async (req) => {
  console.log('🚀 Function invoked!', new Date().toISOString());
  // ... rest of code
});
```

2. Nasaďte znovu:
```bash
supabase functions deploy update-global-world-state
```

3. Zavolejte funkci a hledejte "🚀 Function invoked!"

## Alternativa: Použití response body

Pokud logy stále nefungují, můžete si informace zobrazit v response body:

```bash
curl -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  | jq '.'
```

Response obsahuje vše důležité:
```json
{
  "success": true,
  "message": "Global world state updated",
  "weatherChanged": true,
  "timeChanged": false,
  "state": {
    "weather": "clear → rain (45min)",
    "time": "day → dusk (18min)"
  }
}
```

## Doporučený workflow pro debugging

1. **Otevřete 3 terminály:**
   - Terminal 1: `supabase functions logs update-global-world-state --follow`
   - Terminal 2: Pro curl volání
   - Terminal 3: Pro SQL dotazy

2. **V terminálu 2 zavolejte funkci:**
```bash
curl -v -X POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

3. **Sledujte výstup:**
   - Terminal 1: Console logy z funkce
   - Terminal 2: HTTP response (status code, body)
   - Terminal 3: Ověřte změny v DB:
```sql
SELECT * FROM global_world_state WHERE id = 1;
```

---

**Tip:** Nejrychlejší způsob, jak zjistit, jestli funkce funguje, je sledovat Terminal 1 s `--follow`. Pokud se tam nic nezobrazí, funkce se nespustila vůbec.
