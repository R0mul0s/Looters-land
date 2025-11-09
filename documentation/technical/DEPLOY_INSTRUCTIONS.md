# 🚀 Deployment Instructions - v0.8.0

**Datum:** 2025-11-08
**Verze:** 0.8.0 - Energy System & Daily Reset & Leaderboards

---

## ✅ Co už je hotovo (automaticky):

- ✅ Energy regeneration hook vytvořen
- ✅ Daily reset Edge Function vytvořena
- ✅ Leaderboard schema aplikováno v databázi
- ✅ LeaderboardScreen UI integrována
- ✅ Všechny TypeScript soubory připraveny

---

## 📝 Co musíš udělat manuálně:

### **Krok 1: Získej Supabase přihlašovací údaje**

1. Jdi na https://supabase.com/dashboard
2. Vyber svůj projekt "Looters Land"
3. Jdi do **Settings → API**

Zapiš si tyto hodnoty:

```
Project URL: https://[tvuj-project-id].supabase.co
Project Reference ID: [tvuj-project-id]
anon public key: [začíná eyJ...]
service_role key: [začíná eyJ...] (TAJNÉ!)
```

---

### **Krok 2: Deploy Edge Function**

Otevři terminál v: `C:\Github\New-game\looters-land`

```bash
# 1. Přihlas se do Supabase
npx supabase login

# Otevře se prohlížeč, přihlas se svým Supabase účtem
# Po úspěšném přihlášení pokračuj...

# 2. Link projekt (nahraď [tvuj-project-id])
npx supabase link --project-ref [tvuj-project-id]

# 3. Deploy Edge Function
npx supabase functions deploy daily-reset

# 4. Nastav environment variables (nahraď hodnoty)
npx supabase secrets set SUPABASE_URL=https://[tvuj-project-id].supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[tvuj-service-role-key]
```

**Očekávaný výstup:**
```
✓ Edge Function deployed successfully
Function URL: https://[tvuj-project-id].supabase.co/functions/v1/daily-reset
```

---

### **Krok 3: Nastav automatický denní reset (DOPORUČENO)**

Máš 2 možnosti:

#### **Možnost A: Supabase Cron (pokud je dostupný)**

V Supabase SQL Editoru spusť:

```sql
-- DŮLEŽITÉ: Nahraď [tvuj-project-id] a [tvuj-anon-key]
SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Každý den v půlnoci UTC
  $$
  SELECT net.http_post(
    url:='https://[tvuj-project-id].supabase.co/functions/v1/daily-reset',
    headers:='{"Authorization": "Bearer [tvuj-anon-key]"}'::jsonb
  )
  $$
);
```

**Ověř úspěch:**
```sql
-- Zkontroluj naplánované joby
SELECT * FROM cron.job;
```

#### **Možnost B: Externí cron služba (alternativa)**

Pokud Supabase cron nefunguje:

1. Jdi na https://cron-job.org
2. Vytvoř účet (zdarma)
3. Create new cron job:
   - **Title:** Daily Reset Looters Land
   - **URL:** `https://[tvuj-project-id].supabase.co/functions/v1/daily-reset`
   - **Schedule:** `0 0 * * *` (denně v půlnoci)
   - **Request method:** POST
   - **Headers:**
     - Name: `Authorization`
     - Value: `Bearer [tvuj-anon-key]`

---

### **Krok 4: Otestuj Edge Function manuálně**

V terminálu:

```bash
# Test 1: Zavolej Edge Function ručně
curl -X POST https://[tvuj-project-id].supabase.co/functions/v1/daily-reset ^
  -H "Authorization: Bearer [tvuj-anon-key]" ^
  -H "Content-Type: application/json"
```

**Očekávaný response:**
```json
{
  "success": true,
  "message": "Daily reset completed successfully",
  "log": {
    "timestamp": "2025-11-08T...",
    "action": "daily_reset",
    "details": {
      "energy_restored": true,
      "leaderboards_archived": false
    }
  }
}
```

**Pokud dostaneš chybu:**
- Zkontroluj, že anon key je správně
- Zkontroluj URL (včetně https://)
- Podívej se do Supabase → Functions → Logs

---

### **Krok 5: Test v aplikaci**

```bash
# Spusť dev server
npm run dev
```

**Co otestovat:**

✅ **Energy regenerace:**
1. Otevři hru v prohlížeči
2. Sleduj energy bar v headeru
3. Počkej 6 minut → mělo by přibýt +1 energie
4. Zkontroluj console.log (F12 → Console)

✅ **Leaderboards:**
1. Klikni na 🏆 **Leaderboards** v levém menu
2. Měl bys vidět 4 kategorie (zatím prázdné)
3. Countdown do dalšího resetu

✅ **Daily worldmap seed:**
1. Zkontroluj console log - měl by být: `daily-${YYYY-MM-DD}`
2. Každý den by měla být jiná mapa

---

## 🐛 Troubleshooting

### Edge Function se nedeployuje
```bash
# Zkontroluj přihlášení
npx supabase projects list

# Pokud je prázdné, znovu se přihlas
npx supabase login
```

### Energy se neregeneruje
- Zkontroluj console log - měly by být zprávy o regeneraci
- Ověř, že `useEnergyRegeneration` je enabled (není loading)
- Zkontroluj, že energy není už na maximu

### Leaderboards tab nefunguje
- Zkontroluj, že jsi aplikoval `leaderboards_schema.sql`
- Ověř v Supabase Dashboard → Database → Tables, že existují:
  - `daily_leaderboards`
  - `daily_leaderboards_archive`
  - `player_leaderboard_stats`

### Daily reset nefunguje
- Zkontroluj Supabase → Functions → daily-reset → Logs
- Ověř environment variables: `npx supabase secrets list`
- Test manuálně pomocí curl (viz Krok 4)

---

## ✅ Checklist dokončení

- [ ] Edge Function úspěšně deploynutá
- [ ] Environment variables nastaveny
- [ ] Cron job vytvořen (Supabase nebo cron-job.org)
- [ ] Manuální test Edge Function úspěšný (curl)
- [ ] Energy regenerace funguje v aplikaci
- [ ] Leaderboards tab se otevírá
- [ ] Countdown do resetu zobrazuje správný čas

---

## 🎉 Po dokončení

Budeš mít:
- ✅ Automatickou regeneraci 10 energie/hodinu
- ✅ Denní reset energie v půlnoci
- ✅ 4 leaderboard kategorie
- ✅ Novou mapu každý den

---

## 📞 Potřebuješ pomoc?

Pokud narazíš na problém:

1. **Zkontroluj Supabase Logs:**
   - Dashboard → Functions → daily-reset → Logs
   - Dashboard → Database → Query Performance

2. **Zkontroluj Browser Console:**
   - F12 → Console
   - Hledej error messages

3. **Pošli mi:**
   - Screenshot chyby
   - Co se snažíš udělat
   - Co se děje místo toho

Úspěch! 🚀
