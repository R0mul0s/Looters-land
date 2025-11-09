# Supabase Setup Guide

This guide will help you set up Supabase for Looters Land game saves.

## Step 1: Create Supabase Account & Project

1. Go to https://supabase.com
2. Click **"Start your project"** and sign up (free tier is enough)
3. Create a new project:
   - **Name**: `looters-land`
   - **Database Password**: Choose a strong password and save it
   - **Region**: Select closest to you (e.g., Europe Central)
4. Wait ~2 minutes for the project to be created

## Step 2: Get Your Credentials

1. In your Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **API** under Project Settings
3. Copy these two values:
   - **Project URL** (under "Configuration")
   - **anon/public** key (under "Project API keys")

## Step 3: Add Credentials to Your App

1. In your project root, create a file called `.env`:
   ```bash
   # In: C:\Github\New-game\looters-land\.env
   ```

2. Paste your credentials (replace with your actual values):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Save the file

## Step 4: Run the Database Schema

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from your project
4. Copy the entire contents
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: "Success. No rows returned"

## Step 5: Verify Tables Were Created

1. Click **Table Editor** in the left sidebar
2. You should see 4 new tables:
   - `game_saves`
   - `heroes`
   - `inventory_items`
   - `equipment_slots`

## Step 6: Test It!

1. Start your dev server:
   ```bash
   cd looters-land
   npm run dev
   ```

2. Open http://localhost:5173

3. You should see a **"💾 Save / Load Game"** panel

4. Try saving your game:
   - Enter a save name (e.g., "Test Save 1")
   - Click **"💾 Save Game"**
   - You should see: "Game saved successfully"

5. Verify in Supabase:
   - Go to **Table Editor** → `game_saves`
   - You should see your save listed!

## Troubleshooting

### Error: "Supabase not configured"
- Make sure `.env` file exists in project root
- Check that `VITE_` prefix is included
- Restart your dev server (`npm run dev`)

### Error: "Failed to create save"
- Check that you ran the SQL schema
- Verify tables exist in Table Editor
- Check browser console for detailed errors

### Error: "relation does not exist"
- You didn't run the schema.sql file
- Go back to Step 4 and run it

## Security Notes (for Production)

Currently, the app uses:
- **No authentication** - anyone with the URL can access any save
- **User ID** stored in localStorage (not secure)

For production, you should:
1. Enable Supabase Authentication
2. Use Row Level Security (RLS) policies
3. Restrict API access

Example RLS policy (run in SQL Editor):
```sql
-- Enable RLS
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saves
CREATE POLICY "Users can only access own saves"
ON game_saves FOR ALL
USING (auth.uid()::text = user_id);
```

## What's Next?

- ✅ Saves are working!
- 🔄 Add auto-save every 30 seconds
- 🎮 Add "List Saves" UI
- 🗑️ Add "Delete Save" button
- 🔐 Add proper authentication

## Support

If you need help:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check browser console for error details
