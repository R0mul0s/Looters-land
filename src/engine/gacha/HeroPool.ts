/**
 * Hero Pool - Database of all summonable heroes
 *
 * Contains 50+ unique heroes across all rarities and classes.
 * Heroes are organized by:
 * - Rarity: Common (60%), Rare (25%), Epic (12%), Legendary (3%)
 * - Class: Warrior, Archer, Mage, Cleric, Paladin
 * - Role: Tank, DPS, Healer, Support
 *
 * @author Roman Hlaváček - rhsoft.cz
 * @copyright 2025
 */

import type { HeroTemplate } from '../../types/hero.types';

export const HERO_POOL: HeroTemplate[] = [
  // ============================================================================
  // LEGENDARY HEROES (3% - 5 heroes)
  // ============================================================================
  {
    id: 'legendary_arthur',
    name: 'King Arthur',
    class: 'warrior',
    role: 'tank',
    rarity: 'legendary',
    description: 'The legendary king who united the realm with Excalibur',
    icon: '👑',
    faction: 'Kingdom',
    specialAbility: 'Excalibur Strike - Deals 300% damage and heals all allies for 20% max HP'
  },
  {
    id: 'legendary_merlin',
    name: 'Merlin the Archmage',
    class: 'mage',
    role: 'dps',
    rarity: 'legendary',
    description: 'The most powerful wizard in history',
    icon: '🧙',
    faction: 'Kingdom',
    specialAbility: 'Time Stop - Freezes all enemies for 2 turns, deals 200% damage'
  },
  {
    id: 'legendary_valkyrie',
    name: 'Valkyrie',
    class: 'paladin',
    role: 'support',
    rarity: 'legendary',
    description: 'Divine warrior from the heavens',
    icon: '👼',
    faction: 'Divine',
    specialAbility: 'Divine Resurrection - Revives all dead allies with 50% HP'
  },
  {
    id: 'legendary_phoenix',
    name: 'Phoenix Archer',
    class: 'archer',
    role: 'dps',
    rarity: 'legendary',
    description: 'Reborn from flames, wielding the Eternal Bow',
    icon: '🔥',
    faction: 'Elementals',
    specialAbility: 'Phoenix Storm - Deals 250% damage to all enemies, burns for 3 turns'
  },
  {
    id: 'legendary_sage',
    name: 'Ancient Sage',
    class: 'cleric',
    role: 'healer',
    rarity: 'legendary',
    description: 'Immortal healer with millennium of wisdom',
    icon: '🕉️',
    faction: 'Monastery',
    specialAbility: 'Eternal Blessing - Full heal all allies, immunity for 2 turns'
  },

  // ============================================================================
  // EPIC HEROES (12% - 15 heroes)
  // ============================================================================
  {
    id: 'epic_dragonslayer',
    name: 'Dragonslayer',
    class: 'warrior',
    role: 'tank',
    rarity: 'epic',
    description: 'Legendary warrior who defeated the Fire Dragon',
    icon: '🐉',
    faction: 'Mountain',
    specialAbility: 'Dragon Roar - Stuns all enemies, +50% DEF'
  },
  {
    id: 'epic_shadowblade',
    name: 'Shadow Blade',
    class: 'warrior',
    role: 'dps',
    rarity: 'epic',
    description: 'Master assassin from the Shadow Guild',
    icon: '🗡️',
    faction: 'Shadows',
    specialAbility: 'Shadow Strike - 200% crit damage, guaranteed critical'
  },
  {
    id: 'epic_huntmaster',
    name: 'Hunt Master',
    class: 'archer',
    role: 'dps',
    rarity: 'epic',
    description: 'Elite hunter from the Forest Kingdom',
    icon: '🎯',
    faction: 'Forest',
    specialAbility: 'Multi-Shot Barrage - Hits all enemies 3 times'
  },
  {
    id: 'epic_stormcaller',
    name: 'Storm Caller',
    class: 'mage',
    role: 'dps',
    rarity: 'epic',
    description: 'Weather mage who commands lightning',
    icon: '⚡',
    faction: 'Elementals',
    specialAbility: 'Lightning Storm - Chain lightning to all enemies'
  },
  {
    id: 'epic_frostqueen',
    name: 'Frost Queen',
    class: 'mage',
    role: 'support',
    rarity: 'epic',
    description: 'Ice sorceress from the Frozen North',
    icon: '❄️',
    faction: 'North',
    specialAbility: 'Frozen Prison - Freezes all enemies for 1 turn'
  },
  {
    id: 'epic_holypriest',
    name: 'High Priest',
    class: 'cleric',
    role: 'healer',
    rarity: 'epic',
    description: 'Leader of the Sacred Church',
    icon: '✝️',
    faction: 'Church',
    specialAbility: 'Mass Heal - Heals all allies for 100 HP'
  },
  {
    id: 'epic_warden',
    name: 'Nature Warden',
    class: 'cleric',
    role: 'support',
    rarity: 'epic',
    description: 'Guardian of the ancient forest',
    icon: '🌳',
    faction: 'Forest',
    specialAbility: 'Nature\'s Blessing - Heals over time, +30% HP regen'
  },
  {
    id: 'epic_champion',
    name: 'Divine Champion',
    class: 'paladin',
    role: 'tank',
    rarity: 'epic',
    description: 'Holy warrior blessed by the gods',
    icon: '⚔️',
    faction: 'Divine',
    specialAbility: 'Holy Aegis - Blocks all damage for 1 turn'
  },
  {
    id: 'epic_dreadknight',
    name: 'Dread Knight',
    class: 'paladin',
    role: 'dps',
    rarity: 'epic',
    description: 'Corrupted paladin with dark powers',
    icon: '💀',
    faction: 'Undead',
    specialAbility: 'Life Drain - Deals damage and heals self'
  },
  {
    id: 'epic_berserker',
    name: 'Berserker Chief',
    class: 'warrior',
    role: 'dps',
    rarity: 'epic',
    description: 'Fierce warrior from the Savage Lands',
    icon: '🪓',
    faction: 'Barbarian',
    specialAbility: 'Rage Mode - +100% ATK but -50% DEF'
  },
  {
    id: 'epic_sniper',
    name: 'Elite Sniper',
    class: 'archer',
    role: 'dps',
    rarity: 'epic',
    description: 'Precision marksman with deadly accuracy',
    icon: '🎯',
    faction: 'Kingdom',
    specialAbility: 'Headshot - 300% damage single target'
  },
  {
    id: 'epic_necromancer',
    name: 'Necromancer',
    class: 'mage',
    role: 'support',
    rarity: 'epic',
    description: 'Master of death and undead magic',
    icon: '☠️',
    faction: 'Undead',
    specialAbility: 'Raise Dead - Summons skeleton warrior'
  },
  {
    id: 'epic_oracle',
    name: 'Oracle',
    class: 'cleric',
    role: 'support',
    rarity: 'epic',
    description: 'Seer who glimpses the future',
    icon: '🔮',
    faction: 'Mystic',
    specialAbility: 'Foresight - Reveals enemy next move, +20% dodge'
  },
  {
    id: 'epic_crusader',
    name: 'Crusader',
    class: 'paladin',
    role: 'tank',
    rarity: 'epic',
    description: 'Holy warrior on a righteous quest',
    icon: '🛡️',
    faction: 'Church',
    specialAbility: 'Holy Smite - Damage + heal combo'
  },
  {
    id: 'epic_bladedancer',
    name: 'Blade Dancer',
    class: 'warrior',
    role: 'dps',
    rarity: 'epic',
    description: 'Agile swordmaster with twin blades',
    icon: '⚔️',
    faction: 'Desert',
    specialAbility: 'Blade Whirlwind - Hits all enemies twice'
  },

  // ============================================================================
  // RARE HEROES (25% - 15 heroes)
  // ============================================================================
  {
    id: 'rare_knight',
    name: 'Royal Knight',
    class: 'warrior',
    role: 'tank',
    rarity: 'rare',
    description: 'Elite knight from the King\'s Guard',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'rare_swordsman',
    name: 'Master Swordsman',
    class: 'warrior',
    role: 'dps',
    rarity: 'rare',
    description: 'Skilled blade master',
    icon: '⚔️',
    faction: 'Kingdom'
  },
  {
    id: 'rare_ranger',
    name: 'Forest Ranger',
    class: 'archer',
    role: 'dps',
    rarity: 'rare',
    description: 'Expert tracker and hunter',
    icon: '🏹',
    faction: 'Forest'
  },
  {
    id: 'rare_crossbow',
    name: 'Crossbow Expert',
    class: 'archer',
    role: 'dps',
    rarity: 'rare',
    description: 'Deadly accurate with heavy crossbow',
    icon: '🎯',
    faction: 'Mountain'
  },
  {
    id: 'rare_battlemage',
    name: 'Battle Mage',
    class: 'mage',
    role: 'dps',
    rarity: 'rare',
    description: 'Warrior trained in combat magic',
    icon: '🔥',
    faction: 'Kingdom'
  },
  {
    id: 'rare_illusionist',
    name: 'Illusionist',
    class: 'mage',
    role: 'support',
    rarity: 'rare',
    description: 'Master of deception and trickery',
    icon: '✨',
    faction: 'Mystic'
  },
  {
    id: 'rare_priest',
    name: 'War Priest',
    class: 'cleric',
    role: 'healer',
    rarity: 'rare',
    description: 'Healer trained for battlefield',
    icon: '⚕️',
    faction: 'Church'
  },
  {
    id: 'rare_monk',
    name: 'Monk',
    class: 'cleric',
    role: 'support',
    rarity: 'rare',
    description: 'Spiritual warrior from monastery',
    icon: '🙏',
    faction: 'Monastery'
  },
  {
    id: 'rare_templar',
    name: 'Templar',
    class: 'paladin',
    role: 'tank',
    rarity: 'rare',
    description: 'Holy defender of the faith',
    icon: '⚔️',
    faction: 'Church'
  },
  {
    id: 'rare_guardian',
    name: 'Guardian',
    class: 'paladin',
    role: 'tank',
    rarity: 'rare',
    description: 'Protector of the innocent',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'rare_gladiator',
    name: 'Gladiator',
    class: 'warrior',
    role: 'dps',
    rarity: 'rare',
    description: 'Arena champion with countless victories',
    icon: '⚔️',
    faction: 'Desert'
  },
  {
    id: 'rare_scout',
    name: 'Scout',
    class: 'archer',
    role: 'support',
    rarity: 'rare',
    description: 'Fast and stealthy reconnaissance expert',
    icon: '🏃',
    faction: 'Forest'
  },
  {
    id: 'rare_elementalist',
    name: 'Elementalist',
    class: 'mage',
    role: 'dps',
    rarity: 'rare',
    description: 'Mage who wields all elements',
    icon: '🌊',
    faction: 'Elementals'
  },
  {
    id: 'rare_druid',
    name: 'Druid',
    class: 'cleric',
    role: 'healer',
    rarity: 'rare',
    description: 'Nature magic practitioner',
    icon: '🌿',
    faction: 'Forest'
  },
  {
    id: 'rare_inquisitor',
    name: 'Inquisitor',
    class: 'paladin',
    role: 'dps',
    rarity: 'rare',
    description: 'Hunter of evil and corruption',
    icon: '🔱',
    faction: 'Church'
  },

  // ============================================================================
  // COMMON HEROES (60% - 20 heroes)
  // ============================================================================
  {
    id: 'common_soldier',
    name: 'Soldier',
    class: 'warrior',
    role: 'tank',
    rarity: 'common',
    description: 'Regular army infantry',
    icon: '⚔️',
    faction: 'Kingdom'
  },
  {
    id: 'common_guard',
    name: 'Guard',
    class: 'warrior',
    role: 'tank',
    rarity: 'common',
    description: 'Town guard with basic training',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'common_militia',
    name: 'Militia',
    class: 'warrior',
    role: 'dps',
    rarity: 'common',
    description: 'Village defender',
    icon: '⚔️',
    faction: 'Kingdom'
  },
  {
    id: 'common_footman',
    name: 'Footman',
    class: 'warrior',
    role: 'tank',
    rarity: 'common',
    description: 'Basic infantry unit',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'common_hunter',
    name: 'Hunter',
    class: 'archer',
    role: 'dps',
    rarity: 'common',
    description: 'Simple hunter from the woods',
    icon: '🏹',
    faction: 'Forest'
  },
  {
    id: 'common_bowman',
    name: 'Bowman',
    class: 'archer',
    role: 'dps',
    rarity: 'common',
    description: 'Trained archer',
    icon: '🏹',
    faction: 'Kingdom'
  },
  {
    id: 'common_marksman',
    name: 'Marksman',
    class: 'archer',
    role: 'dps',
    rarity: 'common',
    description: 'Skilled shooter',
    icon: '🎯',
    faction: 'Kingdom'
  },
  {
    id: 'common_skirmisher',
    name: 'Skirmisher',
    class: 'archer',
    role: 'dps',
    rarity: 'common',
    description: 'Light ranged fighter',
    icon: '🏹',
    faction: 'Desert'
  },
  {
    id: 'common_apprentice',
    name: 'Apprentice Mage',
    class: 'mage',
    role: 'dps',
    rarity: 'common',
    description: 'Student of the arcane arts',
    icon: '🔮',
    faction: 'Kingdom'
  },
  {
    id: 'common_wizard',
    name: 'Wizard',
    class: 'mage',
    role: 'dps',
    rarity: 'common',
    description: 'Basic magic user',
    icon: '🧙',
    faction: 'Kingdom'
  },
  {
    id: 'common_sorcerer',
    name: 'Sorcerer',
    class: 'mage',
    role: 'dps',
    rarity: 'common',
    description: 'Self-taught mage',
    icon: '🔮',
    faction: 'Mystic'
  },
  {
    id: 'common_warlock',
    name: 'Warlock',
    class: 'mage',
    role: 'dps',
    rarity: 'common',
    description: 'Dark magic practitioner',
    icon: '🌑',
    faction: 'Shadows'
  },
  {
    id: 'common_acolyte',
    name: 'Acolyte',
    class: 'cleric',
    role: 'healer',
    rarity: 'common',
    description: 'Novice healer',
    icon: '⚕️',
    faction: 'Church'
  },
  {
    id: 'common_healer',
    name: 'Healer',
    class: 'cleric',
    role: 'healer',
    rarity: 'common',
    description: 'Basic healing magic user',
    icon: '💚',
    faction: 'Church'
  },
  {
    id: 'common_medic',
    name: 'Field Medic',
    class: 'cleric',
    role: 'healer',
    rarity: 'common',
    description: 'Combat medic',
    icon: '⚕️',
    faction: 'Kingdom'
  },
  {
    id: 'common_initiate',
    name: 'Initiate',
    class: 'cleric',
    role: 'support',
    rarity: 'common',
    description: 'Religious trainee',
    icon: '🙏',
    faction: 'Church'
  },
  {
    id: 'common_squire',
    name: 'Squire',
    class: 'paladin',
    role: 'tank',
    rarity: 'common',
    description: 'Knight in training',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'common_sentinel',
    name: 'Sentinel',
    class: 'paladin',
    role: 'tank',
    rarity: 'common',
    description: 'Basic holy defender',
    icon: '🛡️',
    faction: 'Church'
  },
  {
    id: 'common_defender',
    name: 'Defender',
    class: 'paladin',
    role: 'tank',
    rarity: 'common',
    description: 'Shield bearer',
    icon: '🛡️',
    faction: 'Kingdom'
  },
  {
    id: 'common_protector',
    name: 'Protector',
    class: 'paladin',
    role: 'support',
    rarity: 'common',
    description: 'Basic support warrior',
    icon: '⚔️',
    faction: 'Kingdom'
  }
];
