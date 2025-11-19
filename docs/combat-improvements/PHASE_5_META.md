# Phase 5: Meta Features & Quality of Life

**Celkový čas**: 12-17 hodin
**Závislosti**: Vyžaduje dokončené Phase 1-4
**Cíl**: Přidání meta herních funkcí, které zvýší replayabilitu a zlepší celkovou herní zkušenost

---

## Krok 1: Combat Challenges & Achievements System (4-5h)

### 1.1 Vytvoření systému výzev a achievementů

**Soubor**: `src/types/challenges.types.ts`
```typescript
export enum ChallengeType {
  COMBAT_WINS = 'combat_wins',
  PERFECT_VICTORY = 'perfect_victory', // No hero deaths
  SPEED_KILL = 'speed_kill',           // Win within X turns
  COMBO_MASTER = 'combo_master',       // Reach combo X
  ELEMENT_MASTER = 'element_master',   // Deal X elemental damage
  BOSS_SLAYER = 'boss_slayer',         // Defeat X bosses
  SURVIVAL = 'survival',                // Survive with <10% HP
  NO_DAMAGE = 'no_damage'              // Take no damage in fight
}

export interface ChallengeCondition {
  type: ChallengeType;
  requirement: number;
  current: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditions: ChallengeCondition[];
  rewards: {
    gold?: number;
    xp?: number;
    item?: string;
  };
  isCompleted: boolean;
  completedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  condition: ChallengeCondition;
  isUnlocked: boolean;
  unlockedAt?: Date;
  reward?: {
    title?: string;
    cosmetic?: string;
  };
}

export interface ChallengeProgress {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  achievements: Achievement[];
  totalPoints: number;
}
```

**Commit**: `git commit -m "feat: Add challenge and achievement type definitions"`

---

### 1.2 Challenge Manager pro sledování a vyhodnocování

**Soubor**: `src/engine/combat/ChallengeManager.ts`
```typescript
import { Challenge, Achievement, ChallengeType, ChallengeCondition } from '@/types/challenges.types';
import { CombatResult } from '@/types/combat.types';

export class ChallengeManager {
  private challenges: Challenge[] = [];
  private achievements: Achievement[] = [];
  private listeners: Array<(challenge: Challenge) => void> = [];

  constructor() {
    this.initializeDefaultChallenges();
    this.initializeAchievements();
  }

  private initializeDefaultChallenges(): void {
    this.challenges = [
      {
        id: 'first_victory',
        name: 'První vítězství',
        description: 'Vyhraj svůj první boj',
        icon: '🎯',
        conditions: [
          { type: ChallengeType.COMBAT_WINS, requirement: 1, current: 0 }
        ],
        rewards: { gold: 100, xp: 50 },
        isCompleted: false
      },
      {
        id: 'perfect_10',
        name: 'Perfektní desítka',
        description: 'Vyhraj 10 bojů bez ztráty hrdiny',
        icon: '💎',
        conditions: [
          { type: ChallengeType.PERFECT_VICTORY, requirement: 10, current: 0 }
        ],
        rewards: { gold: 500, xp: 250 },
        isCompleted: false
      },
      {
        id: 'speed_demon',
        name: 'Rychlý jako blesk',
        description: 'Vyhraj boj do 5 kol',
        icon: '⚡',
        conditions: [
          { type: ChallengeType.SPEED_KILL, requirement: 5, current: 0 }
        ],
        rewards: { gold: 200, xp: 100 },
        isCompleted: false
      },
      {
        id: 'combo_king',
        name: 'Král combo',
        description: 'Dosáhni 5x combo',
        icon: '🔥',
        conditions: [
          { type: ChallengeType.COMBO_MASTER, requirement: 5, current: 0 }
        ],
        rewards: { gold: 300, xp: 150 },
        isCompleted: false
      },
      {
        id: 'boss_hunter',
        name: 'Lovec bossů',
        description: 'Poraz 5 bossů',
        icon: '👑',
        conditions: [
          { type: ChallengeType.BOSS_SLAYER, requirement: 5, current: 0 }
        ],
        rewards: { gold: 1000, xp: 500, item: 'legendary_sword' },
        isCompleted: false
      },
      {
        id: 'last_stand',
        name: 'Poslední vzdor',
        description: 'Vyhraj boj s méně než 10% HP',
        icon: '🛡️',
        conditions: [
          { type: ChallengeType.SURVIVAL, requirement: 1, current: 0 }
        ],
        rewards: { gold: 400, xp: 200 },
        isCompleted: false
      },
      {
        id: 'untouchable',
        name: 'Nedotknutelný',
        description: 'Vyhraj boj bez obdržení poškození',
        icon: '✨',
        conditions: [
          { type: ChallengeType.NO_DAMAGE, requirement: 1, current: 0 }
        ],
        rewards: { gold: 600, xp: 300 },
        isCompleted: false
      }
    ];
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'veteran_fighter',
        name: 'Válečný veterán',
        description: 'Vyhraj 100 bojů',
        icon: '⚔️',
        tier: 'bronze',
        condition: { type: ChallengeType.COMBAT_WINS, requirement: 100, current: 0 },
        isUnlocked: false
      },
      {
        id: 'combat_master',
        name: 'Mistr boje',
        description: 'Vyhraj 500 bojů',
        icon: '⚔️',
        tier: 'silver',
        condition: { type: ChallengeType.COMBAT_WINS, requirement: 500, current: 0 },
        isUnlocked: false
      },
      {
        id: 'legend',
        name: 'Legenda',
        description: 'Vyhraj 1000 bojů',
        icon: '⚔️',
        tier: 'gold',
        condition: { type: ChallengeType.COMBAT_WINS, requirement: 1000, current: 0 },
        isUnlocked: false
      },
      {
        id: 'god_of_war',
        name: 'Bůh války',
        description: 'Vyhraj 5000 bojů',
        icon: '⚔️',
        tier: 'platinum',
        condition: { type: ChallengeType.COMBAT_WINS, requirement: 5000, current: 0 },
        isUnlocked: false,
        reward: { title: 'God of War', cosmetic: 'golden_aura' }
      }
    ];
  }

  /**
   * Zkontroluje a aktualizuje výzvy na základě výsledku boje
   */
  checkCombatResult(result: CombatResult): Challenge[] {
    const completedChallenges: Challenge[] = [];

    for (const challenge of this.challenges) {
      if (challenge.isCompleted) continue;

      let shouldUpdate = false;

      for (const condition of challenge.conditions) {
        switch (condition.type) {
          case ChallengeType.COMBAT_WINS:
            if (result.victory) {
              condition.current++;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.PERFECT_VICTORY:
            if (result.victory && !result.hadDeaths) {
              condition.current++;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.SPEED_KILL:
            if (result.victory && result.turnCount <= condition.requirement) {
              condition.current = condition.requirement;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.COMBO_MASTER:
            if (result.maxCombo >= condition.requirement) {
              condition.current = result.maxCombo;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.BOSS_SLAYER:
            if (result.victory && result.wasBossFight) {
              condition.current++;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.SURVIVAL:
            if (result.victory && result.lowestHPPercent < 10) {
              condition.current++;
              shouldUpdate = true;
            }
            break;

          case ChallengeType.NO_DAMAGE:
            if (result.victory && result.totalDamageTaken === 0) {
              condition.current++;
              shouldUpdate = true;
            }
            break;
        }
      }

      // Zkontroluj, jestli jsou všechny podmínky splněné
      if (shouldUpdate) {
        const allConditionsMet = challenge.conditions.every(
          c => c.current >= c.requirement
        );

        if (allConditionsMet && !challenge.isCompleted) {
          challenge.isCompleted = true;
          challenge.completedAt = new Date();
          completedChallenges.push(challenge);
          this.notifyListeners(challenge);
        }
      }
    }

    // Zkontroluj achievementy
    this.checkAchievements(result);

    return completedChallenges;
  }

  private checkAchievements(result: CombatResult): void {
    for (const achievement of this.achievements) {
      if (achievement.isUnlocked) continue;

      const condition = achievement.condition;

      switch (condition.type) {
        case ChallengeType.COMBAT_WINS:
          if (result.victory) {
            condition.current++;
          }
          break;
      }

      if (condition.current >= condition.requirement) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
      }
    }
  }

  /**
   * Přidá listener pro notifikace o dokončených výzvách
   */
  addCompletionListener(callback: (challenge: Challenge) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(challenge: Challenge): void {
    this.listeners.forEach(listener => listener(challenge));
  }

  /**
   * Vrátí všechny aktivní výzvy
   */
  getActiveChallenges(): Challenge[] {
    return this.challenges.filter(c => !c.isCompleted);
  }

  /**
   * Vrátí všechny dokončené výzvy
   */
  getCompletedChallenges(): Challenge[] {
    return this.challenges.filter(c => c.isCompleted);
  }

  /**
   * Vrátí všechny odemčené achievementy
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isUnlocked);
  }

  /**
   * Vrátí všechny achievementy
   */
  getAllAchievements(): Achievement[] {
    return this.achievements;
  }

  /**
   * Vrátí celkový počet bodů (z dokončených výzev)
   */
  getTotalPoints(): number {
    return this.challenges
      .filter(c => c.isCompleted)
      .reduce((sum, c) => sum + (c.rewards.xp || 0), 0);
  }

  /**
   * Serializace pro uložení
   */
  serialize(): string {
    return JSON.stringify({
      challenges: this.challenges,
      achievements: this.achievements
    });
  }

  /**
   * Načtení uloženého stavu
   */
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.challenges = parsed.challenges;
    this.achievements = parsed.achievements;
  }
}
```

**Commit**: `git commit -m "feat: Implement ChallengeManager for tracking combat challenges"`

---

### 1.3 Rozšíření CombatResult o potřebné metriky

**Soubor**: `src/types/combat.types.ts`
```typescript
// Přidej do existujícího souboru:

export interface CombatResult {
  victory: boolean;
  turnCount: number;
  experienceGained: number;
  goldGained: number;
  itemsLooted: any[];

  // Nové metriky pro challenges:
  hadDeaths: boolean;
  totalDamageTaken: number;
  totalDamageDealt: number;
  maxCombo: number;
  wasBossFight: boolean;
  lowestHPPercent: number;
  perfectVictory: boolean; // Alias pro !hadDeaths
}
```

**Commit**: `git commit -m "feat: Extend CombatResult with challenge tracking metrics"`

---

### 1.4 Integrace ChallengeManager do CombatEngine

**Soubor**: `src/engine/combat/CombatEngine.ts`
```typescript
import { ChallengeManager } from './ChallengeManager';
import { CombatResult } from '@/types/combat.types';

export class CombatEngine {
  // ... existující properties

  private challengeManager: ChallengeManager;
  private combatMetrics = {
    totalDamageTaken: 0,
    totalDamageDealt: 0,
    maxCombo: 0,
    hadDeaths: false,
    lowestHPPercent: 100
  };

  constructor(challengeManager?: ChallengeManager) {
    this.challengeManager = challengeManager || new ChallengeManager();
  }

  // Modify existing executeTurn to track metrics
  executeTurn(): void {
    // ... existing turn logic

    // Track metrics during combat
    if (action.type === 'attack' && action.result) {
      const damage = action.result.damage || 0;

      if (action.source.isHero) {
        this.combatMetrics.totalDamageDealt += damage;
      } else {
        this.combatMetrics.totalDamageTaken += damage;
      }

      // Track combo
      if (this.comboCounter > this.combatMetrics.maxCombo) {
        this.combatMetrics.maxCombo = this.comboCounter;
      }

      // Track lowest HP
      const hpPercent = (action.target.stats.HP / action.target.stats.maxHP) * 100;
      if (hpPercent < this.combatMetrics.lowestHPPercent) {
        this.combatMetrics.lowestHPPercent = hpPercent;
      }
    }

    // Track deaths
    if (action.result?.defeated && action.target.isHero) {
      this.combatMetrics.hadDeaths = true;
    }
  }

  // Modify existing endCombat
  endCombat(victory: boolean): CombatResult {
    const result: CombatResult = {
      victory,
      turnCount: this.turnCounter,
      experienceGained: this.calculateExperience(),
      goldGained: this.calculateGold(),
      itemsLooted: this.calculateLoot(),

      // Metrics for challenges
      hadDeaths: this.combatMetrics.hadDeaths,
      totalDamageTaken: this.combatMetrics.totalDamageTaken,
      totalDamageDealt: this.combatMetrics.totalDamageDealt,
      maxCombo: this.combatMetrics.maxCombo,
      wasBossFight: this.enemies.some(e => e.type === 'boss'),
      lowestHPPercent: this.combatMetrics.lowestHPPercent,
      perfectVictory: !this.combatMetrics.hadDeaths
    };

    // Check challenges
    const completedChallenges = this.challengeManager.checkCombatResult(result);

    // Log completed challenges
    completedChallenges.forEach(challenge => {
      console.log(`✅ Challenge Completed: ${challenge.name}`);
      this.combatLog.push({
        type: 'system',
        message: `Challenge dokončena: ${challenge.name}! Odměna: ${challenge.rewards.gold}g, ${challenge.rewards.xp}xp`,
        timestamp: Date.now()
      });
    });

    return result;
  }

  getChallengeManager(): ChallengeManager {
    return this.challengeManager;
  }

  // Reset metrics at combat start
  initialize(heroes: Combatant[], enemies: Combatant[]): void {
    // ... existing initialization

    this.combatMetrics = {
      totalDamageTaken: 0,
      totalDamageDealt: 0,
      maxCombo: 0,
      hadDeaths: false,
      lowestHPPercent: 100
    };
  }
}
```

**Commit**: `git commit -m "feat: Integrate ChallengeManager into CombatEngine"`

---

### 1.5 UI komponenta pro zobrazení výzev

**Soubor**: `src/components/combat/ChallengeTracker.tsx`
```typescript
import React from 'react';
import { Challenge, Achievement } from '@/types/challenges.types';

interface ChallengeTrackerProps {
  challenges: Challenge[];
  achievements: Achievement[];
  onChallengeClick?: (challenge: Challenge) => void;
}

export const ChallengeTracker: React.FC<ChallengeTrackerProps> = ({
  challenges,
  achievements,
  onChallengeClick
}) => {
  const activeChallenges = challenges.filter(c => !c.isCompleted);
  const recentlyUnlocked = achievements
    .filter(a => a.isUnlocked)
    .sort((a, b) =>
      (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0)
    )
    .slice(0, 3);

  return (
    <div className="challenge-tracker">
      {/* Active Challenges */}
      <div className="active-challenges">
        <h3>Aktivní výzvy</h3>
        <div className="challenge-list">
          {activeChallenges.slice(0, 3).map(challenge => (
            <div
              key={challenge.id}
              className="challenge-card"
              onClick={() => onChallengeClick?.(challenge)}
            >
              <div className="challenge-icon">{challenge.icon}</div>
              <div className="challenge-info">
                <div className="challenge-name">{challenge.name}</div>
                <div className="challenge-progress">
                  {challenge.conditions.map((condition, idx) => (
                    <div key={idx} className="progress-bar-container">
                      <div className="progress-text">
                        {condition.current} / {condition.requirement}
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, (condition.current / condition.requirement) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="challenge-reward">
                {challenge.rewards.gold && `${challenge.rewards.gold}g`}
                {challenge.rewards.xp && ` +${challenge.rewards.xp}xp`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Achievements */}
      {recentlyUnlocked.length > 0 && (
        <div className="recent-achievements">
          <h3>Nedávné achievementy</h3>
          <div className="achievement-list">
            {recentlyUnlocked.map(achievement => (
              <div
                key={achievement.id}
                className={`achievement-badge tier-${achievement.tier}`}
              >
                <span className="achievement-icon">{achievement.icon}</span>
                <span className="achievement-name">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Soubor**: `src/components/combat/ChallengeTracker.css`
```css
.challenge-tracker {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-family: 'Press Start 2P', cursive;
  font-size: 10px;
  z-index: 100;
}

.challenge-tracker h3 {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #FFD700;
}

.challenge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.challenge-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.challenge-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.challenge-icon {
  font-size: 20px;
}

.challenge-info {
  flex: 1;
}

.challenge-name {
  font-size: 9px;
  margin-bottom: 4px;
}

.progress-bar-container {
  margin-top: 4px;
}

.progress-text {
  font-size: 8px;
  color: #aaa;
  margin-bottom: 2px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.challenge-reward {
  font-size: 8px;
  color: #FFD700;
  white-space: nowrap;
}

/* Recent Achievements */
.recent-achievements {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.achievement-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 8px;
  animation: achievementPop 0.5s ease;
}

@keyframes achievementPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.achievement-badge.tier-bronze {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
}

.achievement-badge.tier-silver {
  background: linear-gradient(135deg, #C0C0C0, #808080);
}

.achievement-badge.tier-gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
}

.achievement-badge.tier-platinum {
  background: linear-gradient(135deg, #E5E4E2, #B9F2FF);
  animation: platinumGlow 2s infinite;
}

@keyframes platinumGlow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(185, 242, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(185, 242, 255, 0.8);
  }
}

.achievement-icon {
  font-size: 16px;
}

.achievement-name {
  flex: 1;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .challenge-tracker {
    width: 250px;
    font-size: 8px;
    padding: 8px;
  }

  .challenge-icon {
    font-size: 16px;
  }

  .achievement-icon {
    font-size: 14px;
  }
}
```

**Commit**: `git commit -m "feat: Add ChallengeTracker UI component with CSS"`

---

### 1.6 Testing checklist

- [ ] ChallengeManager správně sleduje COMBAT_WINS
- [ ] PERFECT_VICTORY se aktivuje pouze když nikdo nezemřel
- [ ] SPEED_KILL se aktivuje při vítězství do X kol
- [ ] COMBO_MASTER sleduje nejvyšší combo v boji
- [ ] BOSS_SLAYER se počítá pouze při boss bojích
- [ ] SURVIVAL se aktivuje při HP < 10%
- [ ] NO_DAMAGE se aktivuje při 0 damage taken
- [ ] Achievementy se odemykají při dosažení požadovaného počtu
- [ ] ChallengeTracker zobrazuje správný progress bar
- [ ] UI animace při dokončení výzvy fungují
- [ ] Notifikace o dokončení se zobrazí v combat logu
- [ ] Rewards se správně přidají po dokončení výzvy
- [ ] Serializace a deserializace funguje správně

---

## Krok 2: Post-Combat Statistics Screen (2-3h)

### 2.1 Vytvoření komponent pro statistiky

**Soubor**: `src/components/combat/CombatStatistics.tsx`
```typescript
import React from 'react';
import { CombatResult, CombatLogEntry } from '@/types/combat.types';
import { Combatant } from '@/types/combat.types';

interface CombatStatisticsProps {
  result: CombatResult;
  combatLog: CombatLogEntry[];
  heroes: Combatant[];
  onContinue: () => void;
}

export const CombatStatistics: React.FC<CombatStatisticsProps> = ({
  result,
  combatLog,
  heroes,
  onContinue
}) => {
  // Vypočítej MVP (Most Valuable Player)
  const mvp = calculateMVP(heroes, combatLog);

  // Vypočítej statistiky pro každého hrdinu
  const heroStats = heroes.map(hero => calculateHeroStats(hero, combatLog));

  return (
    <div className="combat-statistics-screen">
      <div className="statistics-header">
        <h2>{result.victory ? '🎉 VÍTĚZSTVÍ!' : '💀 PORÁŽKA'}</h2>
        <div className="combat-duration">
          <span>Počet kol: {result.turnCount}</span>
        </div>
      </div>

      {/* MVP Section */}
      {mvp && (
        <div className="mvp-section">
          <div className="mvp-badge">⭐ MVP ⭐</div>
          <div className="mvp-hero">
            <div className="hero-avatar">{mvp.hero.name}</div>
            <div className="mvp-stats">
              <div>💥 Damage: {mvp.totalDamage}</div>
              <div>🎯 Útoky: {mvp.attacks}</div>
              <div>🛡️ Přežil: {mvp.survived ? 'Ano' : 'Ne'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      <div className="overall-stats">
        <h3>Celkové statistiky</h3>
        <div className="stats-grid">
          <StatCard
            icon="💥"
            label="Celkový damage"
            value={result.totalDamageDealt}
          />
          <StatCard
            icon="🛡️"
            label="Obdržený damage"
            value={result.totalDamageTaken}
          />
          <StatCard
            icon="🔥"
            label="Max combo"
            value={`${result.maxCombo}x`}
          />
          <StatCard
            icon="💀"
            label="Smrti"
            value={result.hadDeaths ? 'Ano' : 'Ne'}
            highlight={!result.hadDeaths}
          />
        </div>
      </div>

      {/* Hero Performance */}
      <div className="hero-performance">
        <h3>Výkon hrdinů</h3>
        <div className="hero-list">
          {heroStats.map((stats, idx) => (
            <HeroStatCard key={idx} stats={stats} />
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div className="rewards-section">
        <h3>Odměny</h3>
        <div className="rewards-grid">
          <div className="reward-item">
            <span className="reward-icon">💰</span>
            <span className="reward-value">+{result.goldGained}g</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">⭐</span>
            <span className="reward-value">+{result.experienceGained}xp</span>
          </div>
          {result.itemsLooted.length > 0 && (
            <div className="reward-item">
              <span className="reward-icon">🎁</span>
              <span className="reward-value">
                {result.itemsLooted.length} items
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Continue Button */}
      <button className="continue-button" onClick={onContinue}>
        Pokračovat
      </button>
    </div>
  );
};

// Helper component
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);

// Hero stat card component
const HeroStatCard: React.FC<{ stats: HeroStats }> = ({ stats }) => (
  <div className="hero-stat-card">
    <div className="hero-name">{stats.hero.name}</div>
    <div className="hero-stats-grid">
      <div className="stat-item">
        <span className="stat-label">Damage:</span>
        <span className="stat-value">{stats.damageDealt}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Útoky:</span>
        <span className="stat-value">{stats.attackCount}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Trefnost:</span>
        <span className="stat-value">
          {stats.attackCount > 0
            ? `${Math.round((stats.hits / stats.attackCount) * 100)}%`
            : '0%'}
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Přežil:</span>
        <span className="stat-value">{stats.survived ? '✅' : '❌'}</span>
      </div>
    </div>
  </div>
);

// Types
interface MVPData {
  hero: Combatant;
  totalDamage: number;
  attacks: number;
  survived: boolean;
}

interface HeroStats {
  hero: Combatant;
  damageDealt: number;
  damageTaken: number;
  attackCount: number;
  hits: number;
  survived: boolean;
}

// Helper functions
function calculateMVP(heroes: Combatant[], log: CombatLogEntry[]): MVPData | null {
  if (heroes.length === 0) return null;

  const heroScores = heroes.map(hero => {
    const stats = calculateHeroStats(hero, log);
    // Score: damage * 1.0 + hits * 10 + survived * 100
    const score =
      stats.damageDealt * 1.0 +
      stats.hits * 10 +
      (stats.survived ? 100 : 0);

    return {
      hero,
      totalDamage: stats.damageDealt,
      attacks: stats.attackCount,
      survived: stats.survived,
      score
    };
  });

  // Najdi hrdinu s nejvyšším score
  const mvp = heroScores.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  return mvp;
}

function calculateHeroStats(hero: Combatant, log: CombatLogEntry[]): HeroStats {
  let damageDealt = 0;
  let damageTaken = 0;
  let attackCount = 0;
  let hits = 0;

  log.forEach(entry => {
    if (entry.type === 'attack') {
      if (entry.source?.id === hero.id) {
        attackCount++;
        if (entry.hit) {
          hits++;
          damageDealt += entry.damage || 0;
        }
      }
      if (entry.target?.id === hero.id && entry.hit) {
        damageTaken += entry.damage || 0;
      }
    }
  });

  return {
    hero,
    damageDealt,
    damageTaken,
    attackCount,
    hits,
    survived: hero.stats.HP > 0
  };
}
```

**Commit**: `git commit -m "feat: Add CombatStatistics screen with MVP calculation"`

---

### 2.2 Styling pro statistiky

**Soubor**: `src/components/combat/CombatStatistics.css`
```css
.combat-statistics-screen {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  font-family: 'Press Start 2P', cursive;
  padding: 20px;
  overflow-y: auto;
  z-index: 1000;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.statistics-header {
  text-align: center;
  margin-bottom: 30px;
}

.statistics-header h2 {
  font-size: 24px;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.combat-duration {
  font-size: 10px;
  color: #aaa;
}

/* MVP Section */
.mvp-section {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  animation: mvpPulse 2s infinite;
}

@keyframes mvpPulse {
  0%, 100% {
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.6);
  }
}

.mvp-badge {
  font-size: 14px;
  color: #000;
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.mvp-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.hero-avatar {
  font-size: 16px;
  color: #000;
  font-weight: bold;
}

.mvp-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 9px;
  color: #000;
  text-align: left;
}

/* Overall Statistics */
.overall-stats {
  margin-bottom: 20px;
}

.overall-stats h3 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 15px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: #FFD700;
  transform: translateY(-2px);
}

.stat-card.highlight {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 9px;
  color: #aaa;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 12px;
  color: #FFD700;
  font-weight: bold;
}

/* Hero Performance */
.hero-performance {
  margin-bottom: 20px;
}

.hero-performance h3 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 15px;
  text-align: center;
}

.hero-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-stat-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.hero-stat-card:hover {
  border-color: #FFD700;
}

.hero-name {
  font-size: 11px;
  color: #FFD700;
  margin-bottom: 10px;
  text-align: center;
}

.hero-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
}

.stat-item .stat-label {
  color: #aaa;
}

.stat-item .stat-value {
  color: white;
  font-weight: bold;
}

/* Rewards Section */
.rewards-section {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.rewards-section h3 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 15px;
  text-align: center;
}

.rewards-grid {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.reward-icon {
  font-size: 24px;
}

.reward-value {
  font-size: 10px;
  color: #FFD700;
}

/* Continue Button */
.continue-button {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 15px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 8px;
  color: white;
  font-family: 'Press Start 2P', cursive;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.continue-button:hover {
  background: linear-gradient(135deg, #45a049, #4CAF50);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.continue-button:active {
  transform: translateY(0);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .combat-statistics-screen {
    padding: 10px;
  }

  .statistics-header h2 {
    font-size: 16px;
  }

  .mvp-badge {
    font-size: 11px;
  }

  .hero-avatar {
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-stats-grid {
    grid-template-columns: 1fr;
  }

  .continue-button {
    font-size: 10px;
    padding: 12px;
  }
}
```

**Commit**: `git commit -m "style: Add CombatStatistics screen styling with animations"`

---

### 2.3 Testing checklist

- [ ] MVP se správně vypočítá (nejvyšší damage + accuracy + survived)
- [ ] Celkové statistiky zobrazují správné hodnoty
- [ ] Hero performance cards ukazují správné údaje pro každého hrdinu
- [ ] Trefnost (accuracy %) se správně počítá z hits/attacks
- [ ] Rewards section zobrazuje gold, XP a items
- [ ] Continue button správně zavře statistiky
- [ ] Animace fadeIn funguje při otevření
- [ ] MVP sekce má pulsující animaci
- [ ] Hover efekty na kartách fungují
- [ ] Mobile responsive layout funguje

---

## Krok 3: Combat Replay/Timeline (3-4h)

### 3.1 Combat Recorder pro záznam akcí

**Soubor**: `src/engine/combat/CombatRecorder.ts`
```typescript
import { Combatant, CombatLogEntry } from '@/types/combat.types';

export interface RecordedFrame {
  turnNumber: number;
  timestamp: number;
  action: CombatLogEntry;
  heroesState: CombatantSnapshot[];
  enemiesState: CombatantSnapshot[];
}

export interface CombatantSnapshot {
  id: string;
  name: string;
  HP: number;
  maxHP: number;
  position?: string;
  buffs: any[];
  debuffs: any[];
}

export class CombatRecorder {
  private frames: RecordedFrame[] = [];
  private isRecording: boolean = false;
  private currentTurn: number = 0;

  /**
   * Začne nahrávat boj
   */
  startRecording(): void {
    this.frames = [];
    this.isRecording = true;
    this.currentTurn = 0;
  }

  /**
   * Zastaví nahrávání
   */
  stopRecording(): void {
    this.isRecording = false;
  }

  /**
   * Nahraje frame (akci v boji)
   */
  recordFrame(
    action: CombatLogEntry,
    heroes: Combatant[],
    enemies: Combatant[]
  ): void {
    if (!this.isRecording) return;

    const frame: RecordedFrame = {
      turnNumber: this.currentTurn,
      timestamp: Date.now(),
      action,
      heroesState: heroes.map(h => this.createSnapshot(h)),
      enemiesState: enemies.map(e => this.createSnapshot(e))
    };

    this.frames.push(frame);
  }

  /**
   * Vytvoří snapshot stavu combatanta
   */
  private createSnapshot(combatant: Combatant): CombatantSnapshot {
    return {
      id: combatant.id,
      name: combatant.name,
      HP: combatant.stats.HP,
      maxHP: combatant.stats.maxHP,
      position: combatant.position,
      buffs: combatant.buffs ? [...combatant.buffs] : [],
      debuffs: combatant.debuffs ? [...combatant.debuffs] : []
    };
  }

  /**
   * Označí konec kola
   */
  incrementTurn(): void {
    this.currentTurn++;
  }

  /**
   * Vrátí všechny nahrané frames
   */
  getFrames(): RecordedFrame[] {
    return this.frames;
  }

  /**
   * Vrátí frame podle indexu
   */
  getFrame(index: number): RecordedFrame | undefined {
    return this.frames[index];
  }

  /**
   * Vrátí celkový počet frames
   */
  getFrameCount(): number {
    return this.frames.length;
  }

  /**
   * Export do JSON
   */
  export(): string {
    return JSON.stringify({
      frames: this.frames,
      totalTurns: this.currentTurn,
      recordedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import ze JSON
   */
  import(data: string): void {
    const parsed = JSON.parse(data);
    this.frames = parsed.frames;
    this.currentTurn = parsed.totalTurns;
  }

  /**
   * Vymaže všechny frames
   */
  clear(): void {
    this.frames = [];
    this.currentTurn = 0;
    this.isRecording = false;
  }
}
```

**Commit**: `git commit -m "feat: Add CombatRecorder for replay functionality"`

---

### 3.2 Integrace CombatRecorder do CombatEngine

**Soubor**: `src/engine/combat/CombatEngine.ts`
```typescript
import { CombatRecorder } from './CombatRecorder';

export class CombatEngine {
  // ... existující properties
  private recorder: CombatRecorder;
  private enableRecording: boolean = true;

  constructor(challengeManager?: ChallengeManager, enableRecording: boolean = true) {
    // ... existing code
    this.recorder = new CombatRecorder();
    this.enableRecording = enableRecording;
  }

  initialize(heroes: Combatant[], enemies: Combatant[]): void {
    // ... existing initialization

    if (this.enableRecording) {
      this.recorder.startRecording();
    }
  }

  executeTurn(): void {
    // ... existing turn logic

    // Record frame after action
    if (this.enableRecording && action) {
      this.recorder.recordFrame(
        {
          type: action.type,
          source: action.source,
          target: action.target,
          damage: action.result?.damage,
          hit: action.result?.hit,
          message: action.result?.message,
          timestamp: Date.now()
        },
        this.heroes,
        this.enemies
      );
    }

    // Check for end of turn
    if (this.turnOrder.length === 0) {
      this.recorder.incrementTurn();
    }
  }

  endCombat(victory: boolean): CombatResult {
    // ... existing endCombat logic

    if (this.enableRecording) {
      this.recorder.stopRecording();
    }

    return result;
  }

  getRecorder(): CombatRecorder {
    return this.recorder;
  }

  exportRecording(): string {
    return this.recorder.export();
  }
}
```

**Commit**: `git commit -m "feat: Integrate CombatRecorder into CombatEngine"`

---

### 3.3 Combat Replay Player UI

**Soubor**: `src/components/combat/CombatReplayPlayer.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { RecordedFrame, CombatRecorder } from '@/engine/combat/CombatRecorder';

interface CombatReplayPlayerProps {
  recorder: CombatRecorder;
  onClose: () => void;
}

export const CombatReplayPlayer: React.FC<CombatReplayPlayerProps> = ({
  recorder,
  onClose
}) => {
  const frames = recorder.getFrames();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  const currentFrame = frames[currentFrameIndex];

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, frames.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentFrameIndex(prev => Math.min(prev + 1, frames.length - 1));
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    setCurrentFrameIndex(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 2, 4];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const handleExport = () => {
    const data = recorder.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat-replay-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentFrame) {
    return (
      <div className="replay-player">
        <div className="no-replay">Žádné záznamy k přehrání</div>
        <button onClick={onClose}>Zavřít</button>
      </div>
    );
  }

  return (
    <div className="replay-player">
      <div className="replay-header">
        <h2>🎬 Replay boje</h2>
        <button className="close-button" onClick={onClose}>
          ✖
        </button>
      </div>

      {/* Timeline */}
      <div className="replay-timeline">
        <div className="timeline-info">
          <span>Kolo: {currentFrame.turnNumber + 1}</span>
          <span>
            Frame: {currentFrameIndex + 1} / {frames.length}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={frames.length - 1}
          value={currentFrameIndex}
          onChange={e => {
            setCurrentFrameIndex(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="timeline-slider"
        />
      </div>

      {/* Combat State Display */}
      <div className="replay-state">
        {/* Heroes */}
        <div className="replay-heroes">
          <h3>Hrdinové</h3>
          <div className="combatants-list">
            {currentFrame.heroesState.map(hero => (
              <div key={hero.id} className="combatant-card">
                <div className="combatant-name">{hero.name}</div>
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{
                      width: `${(hero.HP / hero.maxHP) * 100}%`,
                      background:
                        hero.HP / hero.maxHP > 0.5
                          ? '#4CAF50'
                          : hero.HP / hero.maxHP > 0.25
                          ? '#FFA500'
                          : '#F44336'
                    }}
                  />
                </div>
                <div className="hp-text">
                  {hero.HP} / {hero.maxHP}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Display */}
        <div className="replay-action">
          <div className="action-box">
            <div className="action-icon">⚔️</div>
            <div className="action-text">{currentFrame.action.message}</div>
          </div>
        </div>

        {/* Enemies */}
        <div className="replay-enemies">
          <h3>Nepřátelé</h3>
          <div className="combatants-list">
            {currentFrame.enemiesState.map(enemy => (
              <div key={enemy.id} className="combatant-card">
                <div className="combatant-name">{enemy.name}</div>
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{
                      width: `${(enemy.HP / enemy.maxHP) * 100}%`,
                      background:
                        enemy.HP / enemy.maxHP > 0.5
                          ? '#4CAF50'
                          : enemy.HP / enemy.maxHP > 0.25
                          ? '#FFA500'
                          : '#F44336'
                    }}
                  />
                </div>
                <div className="hp-text">
                  {enemy.HP} / {enemy.maxHP}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="replay-controls">
        <button onClick={handleReset} title="Restart">
          ⏮
        </button>
        <button onClick={handlePrevious} title="Předchozí">
          ⏪
        </button>
        <button onClick={handlePlayPause} title="Přehrát/Pauza">
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button onClick={handleNext} title="Další">
          ⏩
        </button>
        <button onClick={handleSpeedChange} title="Rychlost">
          {playbackSpeed}x
        </button>
        <button onClick={handleExport} title="Export">
          💾
        </button>
      </div>
    </div>
  );
};
```

**Soubor**: `src/components/combat/CombatReplayPlayer.css`
```css
.replay-player {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  font-family: 'Press Start 2P', cursive;
  padding: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.replay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.replay-header h2 {
  font-size: 16px;
  color: #FFD700;
}

.close-button {
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-button:hover {
  color: #F44336;
}

/* Timeline */
.replay-timeline {
  margin-bottom: 20px;
}

.timeline-info {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #aaa;
  margin-bottom: 8px;
}

.timeline-slider {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #FFD700;
  border-radius: 50%;
  cursor: pointer;
}

/* Combat State Display */
.replay-state {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  margin-bottom: 20px;
  overflow-y: auto;
}

.replay-heroes,
.replay-enemies {
  display: flex;
  flex-direction: column;
}

.replay-heroes h3,
.replay-enemies h3 {
  font-size: 12px;
  color: #FFD700;
  margin-bottom: 10px;
  text-align: center;
}

.combatants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.combatant-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.combatant-name {
  font-size: 10px;
  margin-bottom: 8px;
  text-align: center;
}

.hp-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.hp-fill {
  height: 100%;
  transition: width 0.3s, background 0.3s;
}

.hp-text {
  font-size: 8px;
  color: #aaa;
  text-align: center;
}

/* Action Display */
.replay-action {
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-box {
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #FFD700;
  border-radius: 8px;
  padding: 20px;
  max-width: 300px;
  text-align: center;
}

.action-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.action-text {
  font-size: 9px;
  line-height: 1.4;
  color: white;
}

/* Controls */
.replay-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.replay-controls button {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.replay-controls button:hover {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.2);
  transform: translateY(-2px);
}

.replay-controls button:active {
  transform: translateY(0);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .replay-player {
    padding: 10px;
  }

  .replay-header h2 {
    font-size: 12px;
  }

  .replay-state {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .replay-action {
    order: -1;
    margin-bottom: 20px;
  }

  .action-box {
    padding: 15px;
  }

  .action-icon {
    font-size: 30px;
  }

  .action-text {
    font-size: 8px;
  }

  .replay-controls button {
    padding: 10px 12px;
    font-size: 14px;
  }
}
```

**Commit**: `git commit -m "feat: Add CombatReplayPlayer UI with timeline controls"`

---

### 3.4 Testing checklist

- [ ] CombatRecorder správně nahrává každý frame
- [ ] Snapshots obsahují správné HP, buffs, debuffs
- [ ] Turn counter se správně inkrementuje
- [ ] Export do JSON funguje
- [ ] Import ze JSON funguje
- [ ] Replay Player správně zobrazuje aktuální frame
- [ ] Timeline slider funguje pro přesun mezi frames
- [ ] Play/Pause funguje
- [ ] Next/Previous buttons fungují
- [ ] Speed control (1x/2x/4x) funguje
- [ ] Reset button vrátí replay na začátek
- [ ] Export button stáhne JSON soubor
- [ ] HP bary se animují při přepínání frames
- [ ] Akce se zobrazuje v prostřední sekci
- [ ] Mobile layout funguje

---

## Krok 4: Keyboard Shortcuts (1-2h)

### 4.1 Keyboard Manager

**Soubor**: `src/utils/KeyboardManager.ts`
```typescript
export type KeyBinding = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
};

export class KeyboardManager {
  private bindings: Map<string, KeyBinding> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.setupDefaultBindings();
    this.attachListener();
  }

  private setupDefaultBindings(): void {
    // Combat shortcuts
    this.register({
      key: 'space',
      description: 'Přehrát/Pozastavit auto-combat',
      action: () => console.log('Toggle auto-combat')
    });

    this.register({
      key: '1',
      description: 'Normální rychlost (1x)',
      action: () => console.log('Speed: 1x')
    });

    this.register({
      key: '2',
      description: 'Dvojnásobná rychlost (2x)',
      action: () => console.log('Speed: 2x')
    });

    this.register({
      key: '4',
      description: 'Čtyřnásobná rychlost (4x)',
      action: () => console.log('Speed: 4x')
    });

    this.register({
      key: 'r',
      description: 'Otevřít replay',
      action: () => console.log('Open replay')
    });

    this.register({
      key: 'c',
      description: 'Zobrazit výzvy',
      action: () => console.log('Show challenges')
    });

    this.register({
      key: 's',
      description: 'Zobrazit statistiky',
      action: () => console.log('Show statistics')
    });

    this.register({
      key: 'escape',
      description: 'Zavřít překryv/menu',
      action: () => console.log('Close overlay')
    });

    // Target selection (in manual mode)
    this.register({
      key: '1',
      ctrl: true,
      description: 'Vybrat cíl 1',
      action: () => console.log('Select target 1')
    });

    this.register({
      key: '2',
      ctrl: true,
      description: 'Vybrat cíl 2',
      action: () => console.log('Select target 2')
    });

    this.register({
      key: '3',
      ctrl: true,
      description: 'Vybrat cíl 3',
      action: () => console.log('Select target 3')
    });

    // Help
    this.register({
      key: 'h',
      shift: true,
      description: 'Zobrazit nápovědu (klávesové zkratky)',
      action: () => console.log('Show help')
    });
  }

  /**
   * Registruje novou klávesovou zkratku
   */
  register(binding: KeyBinding): void {
    const key = this.getBindingKey(binding);
    this.bindings.set(key, binding);
  }

  /**
   * Odregistruje klávesovou zkratku
   */
  unregister(binding: KeyBinding): void {
    const key = this.getBindingKey(binding);
    this.bindings.delete(key);
  }

  /**
   * Vytvoří unikátní klíč pro binding
   */
  private getBindingKey(binding: KeyBinding): string {
    const parts = [];
    if (binding.ctrl) parts.push('ctrl');
    if (binding.shift) parts.push('shift');
    if (binding.alt) parts.push('alt');
    parts.push(binding.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Připojí event listener
   */
  private attachListener(): void {
    window.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  /**
   * Odpojí event listener
   */
  detach(): void {
    window.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  /**
   * Handler pro stisk klávesy
   */
  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Ignoruj zkratky když je focus v input fieldu
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    const key = this.getEventKey(event);
    const binding = this.bindings.get(key);

    if (binding) {
      event.preventDefault();
      binding.action();
    }
  }

  /**
   * Získá klíč z event objektu
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Povolí zkratky
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Zakáže zkratky
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Vrátí všechny registrované zkratky
   */
  getAllBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Přenastaví akci pro existující binding
   */
  updateAction(key: string, action: () => void): void {
    const binding = this.bindings.get(key);
    if (binding) {
      binding.action = action;
    }
  }
}

// Singleton instance
let keyboardManagerInstance: KeyboardManager | null = null;

export function getKeyboardManager(): KeyboardManager {
  if (!keyboardManagerInstance) {
    keyboardManagerInstance = new KeyboardManager();
  }
  return keyboardManagerInstance;
}
```

**Commit**: `git commit -m "feat: Add KeyboardManager for keyboard shortcuts"`

---

### 4.2 Keyboard Help Overlay

**Soubor**: `src/components/combat/KeyboardHelpOverlay.tsx`
```typescript
import React from 'react';
import { KeyBinding } from '@/utils/KeyboardManager';

interface KeyboardHelpOverlayProps {
  bindings: KeyBinding[];
  onClose: () => void;
}

export const KeyboardHelpOverlay: React.FC<KeyboardHelpOverlayProps> = ({
  bindings,
  onClose
}) => {
  // Seskup bindings podle kategorie
  const categories = {
    combat: bindings.filter(b =>
      ['space', '1', '2', '4'].includes(b.key) && !b.ctrl
    ),
    targets: bindings.filter(b => b.ctrl),
    views: bindings.filter(b => ['r', 'c', 's'].includes(b.key)),
    other: bindings.filter(
      b => b.key === 'escape' || (b.key === 'h' && b.shift)
    )
  };

  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="help-content" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <h2>⌨️ Klávesové zkratky</h2>
          <button className="close-button" onClick={onClose}>
            ✖
          </button>
        </div>

        <div className="help-sections">
          {/* Combat Controls */}
          <div className="help-section">
            <h3>Ovládání boje</h3>
            <div className="bindings-list">
              {categories.combat.map((binding, idx) => (
                <BindingRow key={idx} binding={binding} />
              ))}
            </div>
          </div>

          {/* Target Selection */}
          <div className="help-section">
            <h3>Výběr cíle</h3>
            <div className="bindings-list">
              {categories.targets.map((binding, idx) => (
                <BindingRow key={idx} binding={binding} />
              ))}
            </div>
          </div>

          {/* Views */}
          <div className="help-section">
            <h3>Pohledy</h3>
            <div className="bindings-list">
              {categories.views.map((binding, idx) => (
                <BindingRow key={idx} binding={binding} />
              ))}
            </div>
          </div>

          {/* Other */}
          <div className="help-section">
            <h3>Ostatní</h3>
            <div className="bindings-list">
              {categories.other.map((binding, idx) => (
                <BindingRow key={idx} binding={binding} />
              ))}
            </div>
          </div>
        </div>

        <div className="help-footer">
          <p>Stiskni ESC nebo klikni mimo pro zavření</p>
        </div>
      </div>
    </div>
  );
};

const BindingRow: React.FC<{ binding: KeyBinding }> = ({ binding }) => {
  const keys = [];
  if (binding.ctrl) keys.push('Ctrl');
  if (binding.shift) keys.push('Shift');
  if (binding.alt) keys.push('Alt');
  keys.push(binding.key.toUpperCase());

  return (
    <div className="binding-row">
      <div className="key-combo">
        {keys.map((key, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="plus">+</span>}
            <kbd className="key">{key}</kbd>
          </React.Fragment>
        ))}
      </div>
      <div className="description">{binding.description}</div>
    </div>
  );
};
```

**Soubor**: `src/components/combat/KeyboardHelpOverlay.css`
```css
.keyboard-help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.help-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid #FFD700;
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: white;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
}

.help-header h2 {
  font-size: 14px;
  color: #FFD700;
  margin: 0;
}

.close-button {
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.close-button:hover {
  color: #F44336;
}

.help-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.help-section h3 {
  font-size: 11px;
  color: #FFD700;
  margin-bottom: 10px;
}

.bindings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.binding-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: background 0.2s;
}

.binding-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.key-combo {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 150px;
}

.key {
  background: linear-gradient(135deg, #2d2d44, #1a1a2e);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 9px;
  color: white;
  font-family: 'Press Start 2P', cursive;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.plus {
  font-size: 10px;
  color: #aaa;
}

.description {
  flex: 1;
  font-size: 9px;
  color: #ccc;
}

.help-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  text-align: center;
}

.help-footer p {
  font-size: 8px;
  color: #aaa;
  margin: 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .help-content {
    padding: 15px;
  }

  .help-header h2 {
    font-size: 11px;
  }

  .help-section h3 {
    font-size: 9px;
  }

  .key-combo {
    min-width: 100px;
  }

  .key {
    font-size: 7px;
    padding: 3px 6px;
  }

  .description {
    font-size: 7px;
  }
}
```

**Commit**: `git commit -m "feat: Add KeyboardHelpOverlay UI component"`

---

### 4.3 Testing checklist

- [ ] Space toggles auto-combat
- [ ] Čísla 1, 2, 4 přepínají rychlost
- [ ] R otevře replay
- [ ] C zobrazí výzvy
- [ ] S zobrazí statistiky
- [ ] ESC zavře overlay
- [ ] Ctrl+1/2/3 vybírá cíle v manuálním režimu
- [ ] Shift+H zobrazí help overlay
- [ ] Zkratky nefungují když je focus v input fieldu
- [ ] Help overlay zobrazuje všechny zkratky
- [ ] Help overlay je možné zavřít ESC nebo kliknutím mimo

---

## Krok 5: Difficulty Modifiers (2-3h)

### 5.1 Difficulty systém

**Soubor**: `src/types/difficulty.types.ts`
```typescript
export enum DifficultyLevel {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  NIGHTMARE = 'nightmare',
  HELL = 'hell'
}

export interface DifficultyModifier {
  level: DifficultyLevel;
  name: string;
  description: string;
  icon: string;

  // Multipliers
  enemyHPMultiplier: number;
  enemyAttackMultiplier: number;
  enemyDefenseMultiplier: number;
  enemySpeedMultiplier: number;

  goldRewardMultiplier: number;
  xpRewardMultiplier: number;
  dropRateMultiplier: number;

  // Special modifiers
  eliteChance: number;        // % šance že enemy bude elite
  bossBuffs: number;          // Počet extra buffs pro bossy
  startingEnemyBuffs: number; // Počet buffs pro všechny enemies na začátku

  // Penalties
  heroDamagePenalty: number;  // % snížení damage
  heroHealingPenalty: number; // % snížení healing

  // Unlock requirement
  requiredLevel?: number;
  requiredAchievement?: string;
}

export const DIFFICULTY_MODIFIERS: Record<DifficultyLevel, DifficultyModifier> = {
  [DifficultyLevel.EASY]: {
    level: DifficultyLevel.EASY,
    name: 'Snadná',
    description: 'Pro začátečníky. Nepřátelé jsou slabší, odměny nižší.',
    icon: '😊',
    enemyHPMultiplier: 0.7,
    enemyAttackMultiplier: 0.7,
    enemyDefenseMultiplier: 0.8,
    enemySpeedMultiplier: 0.9,
    goldRewardMultiplier: 0.7,
    xpRewardMultiplier: 0.7,
    dropRateMultiplier: 0.8,
    eliteChance: 5,
    bossBuffs: 0,
    startingEnemyBuffs: 0,
    heroDamagePenalty: 0,
    heroHealingPenalty: 0
  },

  [DifficultyLevel.NORMAL]: {
    level: DifficultyLevel.NORMAL,
    name: 'Normální',
    description: 'Standardní obtížnost. Vyvážený zážitek.',
    icon: '😐',
    enemyHPMultiplier: 1.0,
    enemyAttackMultiplier: 1.0,
    enemyDefenseMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    goldRewardMultiplier: 1.0,
    xpRewardMultiplier: 1.0,
    dropRateMultiplier: 1.0,
    eliteChance: 10,
    bossBuffs: 1,
    startingEnemyBuffs: 0,
    heroDamagePenalty: 0,
    heroHealingPenalty: 0
  },

  [DifficultyLevel.HARD]: {
    level: DifficultyLevel.HARD,
    name: 'Těžká',
    description: 'Pro zkušené hráče. Vyšší odměny, těžší nepřátelé.',
    icon: '😰',
    enemyHPMultiplier: 1.5,
    enemyAttackMultiplier: 1.3,
    enemyDefenseMultiplier: 1.2,
    enemySpeedMultiplier: 1.1,
    goldRewardMultiplier: 1.5,
    xpRewardMultiplier: 1.5,
    dropRateMultiplier: 1.3,
    eliteChance: 20,
    bossBuffs: 2,
    startingEnemyBuffs: 1,
    heroDamagePenalty: 0,
    heroHealingPenalty: 0,
    requiredLevel: 10
  },

  [DifficultyLevel.NIGHTMARE]: {
    level: DifficultyLevel.NIGHTMARE,
    name: 'Noční můra',
    description: 'Extrémně náročné. Pouze pro veterány.',
    icon: '😱',
    enemyHPMultiplier: 2.0,
    enemyAttackMultiplier: 1.7,
    enemyDefenseMultiplier: 1.5,
    enemySpeedMultiplier: 1.2,
    goldRewardMultiplier: 2.0,
    xpRewardMultiplier: 2.0,
    dropRateMultiplier: 1.8,
    eliteChance: 35,
    bossBuffs: 3,
    startingEnemyBuffs: 2,
    heroDamagePenalty: 10,
    heroHealingPenalty: 20,
    requiredLevel: 25,
    requiredAchievement: 'veteran_fighter'
  },

  [DifficultyLevel.HELL]: {
    level: DifficultyLevel.HELL,
    name: 'Peklo',
    description: 'Nepřežitelné. Pro legendy.',
    icon: '💀',
    enemyHPMultiplier: 3.0,
    enemyAttackMultiplier: 2.5,
    enemyDefenseMultiplier: 2.0,
    enemySpeedMultiplier: 1.5,
    goldRewardMultiplier: 3.0,
    xpRewardMultiplier: 3.0,
    dropRateMultiplier: 2.5,
    eliteChance: 50,
    bossBuffs: 5,
    startingEnemyBuffs: 3,
    heroDamagePenalty: 20,
    heroHealingPenalty: 30,
    requiredLevel: 50,
    requiredAchievement: 'legend'
  }
};
```

**Commit**: `git commit -m "feat: Add difficulty modifier system with 5 levels"`

---

### 5.2 Aplikace difficulty modifierů

**Soubor**: `src/engine/combat/DifficultyManager.ts`
```typescript
import { DifficultyLevel, DifficultyModifier, DIFFICULTY_MODIFIERS } from '@/types/difficulty.types';
import { Combatant } from '@/types/combat.types';

export class DifficultyManager {
  private currentDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;

  setDifficulty(level: DifficultyLevel): void {
    this.currentDifficulty = level;
  }

  getDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }

  getModifier(): DifficultyModifier {
    return DIFFICULTY_MODIFIERS[this.currentDifficulty];
  }

  /**
   * Aplikuj difficulty modifiery na enemies
   */
  applyToEnemies(enemies: Combatant[]): Combatant[] {
    const modifier = this.getModifier();

    return enemies.map(enemy => {
      const modified = { ...enemy };

      // Apply stat multipliers
      modified.stats.maxHP = Math.round(enemy.stats.maxHP * modifier.enemyHPMultiplier);
      modified.stats.HP = modified.stats.maxHP;
      modified.stats.ATK = Math.round(enemy.stats.ATK * modifier.enemyAttackMultiplier);
      modified.stats.DEF = Math.round(enemy.stats.DEF * modifier.enemyDefenseMultiplier);
      modified.stats.SPD = Math.round(enemy.stats.SPD * modifier.enemySpeedMultiplier);

      // Starting buffs
      if (modifier.startingEnemyBuffs > 0) {
        modified.buffs = modified.buffs || [];
        for (let i = 0; i < modifier.startingEnemyBuffs; i++) {
          modified.buffs.push({
            type: this.getRandomBuff(),
            duration: 3,
            value: 20
          });
        }
      }

      // Elite chance
      if (Math.random() * 100 < modifier.eliteChance && modified.type !== 'boss') {
        modified.type = 'elite';
        modified.stats.maxHP = Math.round(modified.stats.maxHP * 1.5);
        modified.stats.HP = modified.stats.maxHP;
        modified.stats.ATK = Math.round(modified.stats.ATK * 1.3);
      }

      // Boss buffs
      if (modified.type === 'boss' && modifier.bossBuffs > 0) {
        modified.buffs = modified.buffs || [];
        for (let i = 0; i < modifier.bossBuffs; i++) {
          modified.buffs.push({
            type: this.getRandomBuff(),
            duration: 999, // Permanent
            value: 30
          });
        }
      }

      return modified;
    });
  }

  /**
   * Aplikuj penalty na hrdiny
   */
  applyToHeroes(heroes: Combatant[]): Combatant[] {
    const modifier = this.getModifier();

    if (modifier.heroDamagePenalty === 0 && modifier.heroHealingPenalty === 0) {
      return heroes;
    }

    return heroes.map(hero => {
      const modified = { ...hero };

      if (modifier.heroDamagePenalty > 0) {
        modified.stats.ATK = Math.round(
          hero.stats.ATK * (1 - modifier.heroDamagePenalty / 100)
        );
      }

      return modified;
    });
  }

  /**
   * Aplikuj multiplier na rewards
   */
  applyToRewards(baseGold: number, baseXP: number): { gold: number; xp: number } {
    const modifier = this.getModifier();

    return {
      gold: Math.round(baseGold * modifier.goldRewardMultiplier),
      xp: Math.round(baseXP * modifier.xpRewardMultiplier)
    };
  }

  /**
   * Aplikuj multiplier na drop rate
   */
  applyToDropRate(baseDropRate: number): number {
    const modifier = this.getModifier();
    return Math.min(1.0, baseDropRate * modifier.dropRateMultiplier);
  }

  /**
   * Zjisti jestli je difficulty odemčená
   */
  isDifficultyUnlocked(
    level: DifficultyLevel,
    playerLevel: number,
    unlockedAchievements: string[]
  ): boolean {
    const modifier = DIFFICULTY_MODIFIERS[level];

    if (modifier.requiredLevel && playerLevel < modifier.requiredLevel) {
      return false;
    }

    if (
      modifier.requiredAchievement &&
      !unlockedAchievements.includes(modifier.requiredAchievement)
    ) {
      return false;
    }

    return true;
  }

  private getRandomBuff(): string {
    const buffs = ['attack_up', 'defense_up', 'speed_up', 'regen'];
    return buffs[Math.floor(Math.random() * buffs.length)];
  }
}
```

**Commit**: `git commit -m "feat: Implement DifficultyManager with stat multipliers"`

---

### 5.3 Difficulty Selector UI

**Soubor**: `src/components/combat/DifficultySelector.tsx`
```typescript
import React from 'react';
import { DifficultyLevel, DIFFICULTY_MODIFIERS, DifficultyModifier } from '@/types/difficulty.types';

interface DifficultySelectorProps {
  current: DifficultyLevel;
  playerLevel: number;
  unlockedAchievements: string[];
  onChange: (level: DifficultyLevel) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  current,
  playerLevel,
  unlockedAchievements,
  onChange
}) => {
  const levels = Object.values(DifficultyLevel);

  const isUnlocked = (level: DifficultyLevel): boolean => {
    const modifier = DIFFICULTY_MODIFIERS[level];

    if (modifier.requiredLevel && playerLevel < modifier.requiredLevel) {
      return false;
    }

    if (
      modifier.requiredAchievement &&
      !unlockedAchievements.includes(modifier.requiredAchievement)
    ) {
      return false;
    }

    return true;
  };

  return (
    <div className="difficulty-selector">
      <h3>Obtížnost</h3>
      <div className="difficulty-list">
        {levels.map(level => {
          const modifier = DIFFICULTY_MODIFIERS[level];
          const unlocked = isUnlocked(level);
          const selected = current === level;

          return (
            <div
              key={level}
              className={`difficulty-card ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
              onClick={() => unlocked && onChange(level)}
            >
              <div className="difficulty-header">
                <span className="difficulty-icon">{modifier.icon}</span>
                <span className="difficulty-name">{modifier.name}</span>
                {!unlocked && <span className="lock-icon">🔒</span>}
              </div>

              <div className="difficulty-description">{modifier.description}</div>

              {unlocked ? (
                <div className="difficulty-stats">
                  <div className="stat-row">
                    <span className="stat-label">Enemy HP:</span>
                    <span className={`stat-value ${modifier.enemyHPMultiplier > 1 ? 'negative' : 'positive'}`}>
                      {modifier.enemyHPMultiplier}x
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Enemy ATK:</span>
                    <span className={`stat-value ${modifier.enemyAttackMultiplier > 1 ? 'negative' : 'positive'}`}>
                      {modifier.enemyAttackMultiplier}x
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Odměny:</span>
                    <span className={`stat-value ${modifier.goldRewardMultiplier >= 1 ? 'positive' : 'negative'}`}>
                      {modifier.goldRewardMultiplier}x
                    </span>
                  </div>
                </div>
              ) : (
                <div className="unlock-requirements">
                  {modifier.requiredLevel && (
                    <div className="requirement">Level {modifier.requiredLevel}</div>
                  )}
                  {modifier.requiredAchievement && (
                    <div className="requirement">
                      Achievement: {modifier.requiredAchievement}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**Soubor**: `src/components/combat/DifficultySelector.css`
```css
.difficulty-selector {
  padding: 20px;
  color: white;
  font-family: 'Press Start 2P', cursive;
}

.difficulty-selector h3 {
  font-size: 14px;
  color: #FFD700;
  margin-bottom: 15px;
  text-align: center;
}

.difficulty-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.difficulty-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.difficulty-card:not(.locked):hover {
  border-color: #FFD700;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.difficulty-card.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.2);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
}

.difficulty-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.difficulty-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.difficulty-icon {
  font-size: 20px;
}

.difficulty-name {
  flex: 1;
  font-size: 11px;
  color: #FFD700;
}

.lock-icon {
  font-size: 16px;
}

.difficulty-description {
  font-size: 8px;
  color: #aaa;
  line-height: 1.4;
  margin-bottom: 12px;
}

.difficulty-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
}

.stat-label {
  color: #ccc;
}

.stat-value {
  font-weight: bold;
}

.stat-value.positive {
  color: #4CAF50;
}

.stat-value.negative {
  color: #F44336;
}

.unlock-requirements {
  font-size: 8px;
  color: #aaa;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.requirement {
  margin: 4px 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .difficulty-list {
    grid-template-columns: 1fr;
  }

  .difficulty-selector h3 {
    font-size: 11px;
  }

  .difficulty-name {
    font-size: 9px;
  }

  .difficulty-description {
    font-size: 7px;
  }
}
```

**Commit**: `git commit -m "feat: Add DifficultySelector UI component"`

---

### 5.4 Testing checklist

- [ ] Difficulty modifiers správně aplikují HP multipliery
- [ ] Attack a Defense multipliery fungují
- [ ] Speed multiplier ovlivňuje initiative
- [ ] Elite chance správně zvyšuje pravděpodobnost elite enemies
- [ ] Boss buffs se přidávají na začátku boje
- [ ] Starting enemy buffs fungují
- [ ] Hero damage penalty snižuje ATK hrdinů
- [ ] Reward multipliery správně zvyšují gold a XP
- [ ] Drop rate multiplier ovlivňuje loot
- [ ] Difficulty unlock requirements fungují (level + achievement)
- [ ] DifficultySelector zobrazuje zamčené obtížnosti
- [ ] Selected difficulty má zvýrazněný border
- [ ] Klik na zamčenou obtížnost nic neudělá

---

## Závěr Phase 5

Po dokončení Phase 5 budeš mít kompletní meta-game features:

✅ **Challenge System** - Dynamické výzvy a achievementy
✅ **Post-Combat Statistics** - Detailní statistiky s MVP
✅ **Combat Replay** - Timeline replay s exportem
✅ **Keyboard Shortcuts** - Rychlé ovládání klávesnicí
✅ **Difficulty Modifiers** - 5 úrovní obtížnosti s multipliery

### Celkový commit po Phase 5:
```bash
git add .
git commit -m "feat(phase-5): Complete meta features - challenges, statistics, replay, shortcuts, difficulty

- Implemented challenge system with 7+ challenges and progressive achievements
- Added post-combat statistics screen with MVP calculation
- Created combat replay system with timeline playback
- Integrated keyboard shortcut manager with help overlay
- Built 5-tier difficulty system with stat multipliers and unlock requirements

Phase 5 completion adds significant replayability and QoL improvements."
```

### Testing celé Phase 5:
```bash
npm run test -- ChallengeManager
npm run test -- CombatStatistics
npm run test -- CombatRecorder
npm run test -- KeyboardManager
npm run test -- DifficultyManager
```

---

## Další kroky

Po dokončení všech 5 fází budete mít plně funkční pokročilý combat systém. Další možná vylepšení:

- **Phase 6 (Volitelná)**: PvP combat, multiplayer
- **Phase 7 (Volitelná)**: Boss raids, special events
- **Phase 8 (Volitelná)**: Combat AI improvements, behavior trees

**Gratulujeme! 🎉**
