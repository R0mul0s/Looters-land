-- Kingdom of Idle Lords - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Saves Table
CREATE TABLE game_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    save_name TEXT NOT NULL DEFAULT 'Auto Save',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Game State
    gold INTEGER NOT NULL DEFAULT 0,
    inventory_max_slots INTEGER NOT NULL DEFAULT 50,

    UNIQUE(user_id, save_name)
);

-- Heroes Table
CREATE TABLE heroes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_save_id UUID NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,

    -- Hero Info
    hero_name TEXT NOT NULL,
    hero_class TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,

    -- Stats
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    atk INTEGER NOT NULL,
    def INTEGER NOT NULL,
    spd INTEGER NOT NULL,
    crit NUMERIC(5,2) NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Items Table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_save_id UUID NOT NULL REFERENCES game_saves(id) ON DELETE CASCADE,

    -- Item Identity
    item_id TEXT NOT NULL, -- Original item ID from game
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'equipment', 'consumable', etc.
    slot TEXT NOT NULL, -- 'helmet', 'weapon', etc.
    icon TEXT NOT NULL,

    -- Item Properties
    level INTEGER NOT NULL,
    rarity TEXT NOT NULL,
    gold_value INTEGER NOT NULL DEFAULT 0,
    enchant_level INTEGER NOT NULL DEFAULT 0,

    -- Stats (stored as JSONB for flexibility)
    base_stats JSONB NOT NULL DEFAULT '{}',

    -- Set Info
    set_id TEXT,
    set_name TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Slots Table
CREATE TABLE equipment_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hero_id UUID NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,

    -- Slot Name
    slot_name TEXT NOT NULL, -- 'helmet', 'weapon', 'chest', etc.

    -- Equipped Item (references inventory_items OR stores item data)
    item_id TEXT, -- Original item ID
    item_name TEXT,
    item_type TEXT,
    slot TEXT,
    icon TEXT,
    level INTEGER,
    rarity TEXT,
    gold_value INTEGER DEFAULT 0,
    enchant_level INTEGER DEFAULT 0,
    base_stats JSONB DEFAULT '{}',
    set_id TEXT,
    set_name TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(hero_id, slot_name)
);

-- Indexes for performance
CREATE INDEX idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX idx_heroes_game_save_id ON heroes(game_save_id);
CREATE INDEX idx_inventory_items_game_save_id ON inventory_items(game_save_id);
CREATE INDEX idx_equipment_slots_hero_id ON equipment_slots(hero_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_game_saves_updated_at BEFORE UPDATE ON game_saves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_heroes_updated_at BEFORE UPDATE ON heroes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_slots_updated_at BEFORE UPDATE ON equipment_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable later with auth
-- ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE equipment_slots ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add auth later)
-- When you add auth, uncomment these and add proper policies

COMMENT ON TABLE game_saves IS 'Main game save files';
COMMENT ON TABLE heroes IS 'Hero characters with stats';
COMMENT ON TABLE inventory_items IS 'Items in player inventory';
COMMENT ON TABLE equipment_slots IS 'Equipped items on heroes';
