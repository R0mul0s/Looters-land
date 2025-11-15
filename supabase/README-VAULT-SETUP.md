# Supabase API Keys Setup - Bezpečné uložení klíčů

## 📋 Přehled

Tento návod vás provede bezpečným nastavením API klíčů pro váš projekt. Používáme **vlastní secrets tabulku** místo Vault (který není dostupný ve všech Supabase plánech).

## 🔐 Proč používat vlastní secrets tabulku?

- **Dostupnost**: Funguje ve všech Supabase plánech
- **Bezpečnost**: Klíče nejsou hardcoded v SQL souborech, kontrolovaný přístup přes funkci
- **Rotace klíčů**: Snadná změna klíčů bez úpravy cron jobs
- **Jednoduchost**: Žádné speciální extension potřeba

## 🚀 Instalace (Krok za krokem)

### 1. Přechod na nové API Keys

1. Otevřete Supabase Dashboard
2. Jděte na **Settings → API**
3. Klikněte na **"Disable JWT-based API keys"**
4. Získejte nové klíče:
   - **Publishable key** (začíná `sb_publishable_...`)
   - **Secret key** (začíná `sb_secret_...`)

### 2. Nastavení secrets tabulky v databázi

1. Otevřete **SQL Editor** v Supabase Dashboard
2. Spusťte soubor `setup-vault-secrets.sql` (OPTION 2)

```sql
-- Tento soubor automaticky:
-- 1. Vytvoří app_secrets tabulku
-- 2. Vytvoří get_secret() funkci
-- 3. Uloží publishable_key a secret_key
-- 4. Nastaví bezpečnostní oprávnění
```

### 3. Nastavení Cron Jobs

Po nastavení secrets tabulky spusťte:

#### Pro Global World State (každých 15 minut)
```sql
-- Spusťte: setup-cron-job.sql
-- Tento job používá secret_key pro admin operace
```

#### Pro Daily Reset (každou půlnoc UTC)
```sql
-- Spusťte: setup_daily_reset_cron.sql
-- NEBO: MANUAL_SETUP_DAILY_RESET.sql
-- Tyto joby používají publishable_key
```

## 📁 Struktura souborů

```
supabase/
├── setup-vault-secrets.sql          # SPUSTIT PRVNÍ - nastaví Vault
├── setup-cron-job.sql              # Global world state cron
├── setup_daily_reset_cron.sql      # Daily reset cron (varianta 1)
├── MANUAL_SETUP_DAILY_RESET.sql    # Daily reset cron (varianta 2)
└── README-VAULT-SETUP.md           # Tento soubor
```

## 🔑 Typy klíčů a jejich použití

### Publishable Key (`sb_publishable_...`)
- **Použití**: Client-side kód, veřejné Edge Functions
- **Oprávnění**: Respektuje Row Level Security (RLS)
- **Uloženo jako**: `publishable_key` v `app_secrets` tabulce
- **Příklad**:
  ```sql
  get_secret('publishable_key')
  ```

### Secret Key (`sb_secret_...`)
- **Použití**: Server-side admin operace
- **Oprávnění**: Plný admin přístup (NEBEZPEČNÉ!)
- **Uloženo jako**: `secret_key` v `app_secrets` tabulce
- **⚠️ NIKDY** nepoužívejte v client-side kódu!
- **Příklad**:
  ```sql
  get_secret('secret_key')
  ```

## 🔄 Rotace klíčů

Když potřebujete změnit klíče:

1. Vygenerujte nové klíče v Supabase Dashboard
2. Aktualizujte secrets v tabulce:
   ```sql
   UPDATE app_secrets
   SET value = 'NOVÝ_PUBLISHABLE_KEY', updated_at = NOW()
   WHERE key = 'publishable_key';

   UPDATE app_secrets
   SET value = 'NOVÝ_SECRET_KEY', updated_at = NOW()
   WHERE key = 'secret_key';
   ```

## ✅ Ověření nastavení

### Kontrola secrets tabulky
```sql
SELECT key, created_at, updated_at
FROM app_secrets
ORDER BY key;

-- Test funkce
SELECT get_secret('publishable_key');
SELECT get_secret('secret_key');
```

### Kontrola Cron Jobs
```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('update-global-world-state', 'daily-reset-trigger');
```

## 🛡️ Bezpečnostní pravidla

1. ✅ **NIKDY** necommitujte klíče do Gitu
2. ✅ Používejte `.env` pro lokální vývoj
3. ✅ Používejte Vault pro databázové operace
4. ✅ Secret key pouze pro server-side operace
5. ✅ Publishable key pro client-side a Edge Functions
6. ❌ **NIKDY** nehardcodeujte klíče v SQL souborech

## 📝 Checklist

- [ ] Přešel/a jsem na nové API Keys v Supabase Dashboard
- [ ] Spustil/a jsem `setup-vault-secrets.sql` (OPTION 2)
- [ ] Ověřil/a jsem, že klíče jsou v app_secrets tabulce
- [ ] Nastavil/a jsem cron jobs (`setup-cron-job.sql`)
- [ ] Nastavil/a jsem daily reset (`setup_daily_reset_cron.sql`)
- [ ] Aktualizoval/a jsem `.env` soubor s novým publishable key
- [ ] Zkontroloval/a jsem, že `.env` je v `.gitignore`

## 🆘 Řešení problémů

### "Secret already exists"
```sql
-- Aktualizujte existující secret
UPDATE app_secrets
SET value = 'NOVÝ_KEY', updated_at = NOW()
WHERE key = 'publishable_key';
```

### "Permission denied"
Ujistěte se, že jste přihlášeni jako admin v SQL Editoru.

### "Function get_secret does not exist"
Ujistěte se, že jste nejdřív spustili `setup-vault-secrets.sql`, který vytváří get_secret() funkci.

## 📚 Další informace

- [PostgreSQL Configuration](https://www.postgresql.org/docs/current/runtime-config.html)
- [API Keys best practices](https://supabase.com/docs/guides/api/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

**Vytvořeno**: 2025-11-15
**Autor**: Roman Hlaváček - rhsoft.cz
**Verze**: 1.0
