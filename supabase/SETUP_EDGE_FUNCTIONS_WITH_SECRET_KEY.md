# Setup Edge Functions with New Secret Key

Since Supabase moved Service Role Key to Legacy, we now use the new **Secret Key** for Edge Functions.

## 📋 Steps to Setup

### 1. Get Your Secret Key

1. Open **Supabase Dashboard** → Settings → API
2. Find **Secret key** (NOT the Publishable key!)
3. Copy the Secret key (starts with `eyJ...`)

### 2. Set Environment Variable for Production

Run this command in your terminal (replace `<your-secret-key>` with actual key):

```bash
supabase secrets set SUPABASE_SECRET_KEY=<your-secret-key>
```

Example:
```bash
supabase secrets set SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Deploy Edge Functions

Deploy both Edge Functions:

```bash
supabase functions deploy daily-reset
supabase functions deploy update-global-world-state
```

### 4. Verify Deployment

Check that environment variables are set:

```bash
supabase secrets list
```

You should see `SUPABASE_SECRET_KEY` in the list.

### 5. Test Edge Functions

Test manually in Supabase Dashboard → Edge Functions:

- Go to **daily-reset** → Click "Invoke function"
- Go to **update-global-world-state** → Click "Invoke function"

Check the logs to verify no "Unregistered API key" errors.

## 🔧 For Local Development

Create a `.env` file in `supabase/` directory:

```env
SUPABASE_URL=https://ykkjdsciiztoeqycxmtg.supabase.co
SUPABASE_SECRET_KEY=your-secret-key-here
```

**Important:** Never commit `.env` file to git!

## 🎯 What Changed

Edge Functions now support both:
- Legacy `SUPABASE_SERVICE_ROLE_KEY` (for old projects)
- New `SUPABASE_SECRET_KEY` (for new projects)

The code automatically tries both:

```typescript
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
```

## ✅ Verification

After setup, cron jobs should work without 401 errors:

```sql
-- Check cron job status
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('update-global-world-state', 'daily-reset-trigger');
```

## 🐛 Troubleshooting

### Still getting "Unregistered API key" error?

1. Verify you copied the **Secret key**, not Publishable key
2. Run `supabase secrets list` to confirm `SUPABASE_SECRET_KEY` is set
3. Redeploy Edge Functions after setting the secret
4. Check Edge Function logs for detailed error messages

### How to update the secret key?

```bash
supabase secrets set SUPABASE_SECRET_KEY=<new-key>
supabase functions deploy daily-reset
supabase functions deploy update-global-world-state
```

---

**Created:** 2025-11-16
**Author:** Roman Hlaváček - rhsoft.cz
