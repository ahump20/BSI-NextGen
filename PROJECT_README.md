# Sandlot Sluggers - Mobile Backyard Baseball Game

**Version:** 1.0.0  
**Platform:** iOS 12+ / Android 8+  
**Engine:** Unity 2022.3 LTS  
**Status:** Architecture Complete - Ready for Development

---

## Executive Summary

**Sandlot Sluggers** is a mobile-first arcade baseball game capturing the nostalgic magic of Backyard Baseball 2001 with **100% original IP**. Features 15 unique kid characters, 8 imaginative stadiums, touch-optimized gameplay, and premium monetization ($4.99 with optional cosmetic DLC).

**Key Differentiators:**
- Completely original characters, designs, and abilities (no IP infringement)
- Mobile-first controls optimized for touchscreens
- Premium model with no predatory mechanics (COPPA compliant)
- Offline-first gameplay

---

## Project Files Created

### Core Architecture ✅

1. **GAME_DESIGN_DOCUMENT.md** - Complete game design with:
   - 15 original characters (stats, abilities, backstories)
   - 8 unique stadiums (modifiers, environments)
   - Detailed gameplay mechanics
   - Progression system
   - Monetization strategy

2. **Scripts/Core/GameManager.cs** - Central game state management:
   - Inning/scoring logic
   - Team/character management
   - Event system for UI updates
   - Statistics tracking

3. **Scripts/Data/CharacterData.cs** - Character ScriptableObject:
   - Stats (Power, Contact, Speed, Fielding, Pitching)
   - Special ability integration
   - Voice lines and personality
   - Unlock requirements

4. **Scripts/Data/TeamData.cs** - Team configuration:
   - 9-player lineup management
   - Batting order optimization
   - Pitcher rotation
   - Team validation

5. **Scripts/Data/StadiumData.cs** - Stadium definitions:
   - Field dimensions (LF, CF, RF distances)
   - Environmental modifiers (wind, terrain)
   - Collision detection for home runs
   - Special features per venue

6. **Scripts/Abilities/SpecialAbility.cs** - Ability framework:
   - Base class for all abilities
   - Activation/deactivation logic
   - Visual/audio effects integration

7. **Scripts/Abilities/RocketBoostAbility.cs** - Example batting ability
8. **Scripts/Abilities/BaseBurglarAbility.cs** - Example baserunning ability

---

## Character Roster (15 Original Characters)

### Starter Characters (Available Immediately)
1. **Casey "Slugger" Martinez** - Power hitter (9 Power, Rocket Boost ability)
2. **Riley "Wheels" Thompson** - Speedster (10 Speed, Base Burglar ability)
3. **Jordan "Professor" Kim** - Ace pitcher (9 Pitching, Strike Magnet ability)
4. **Sam "Butterfingers" O'Reilly** - Contact hitter (8 Contact, Lucky Charm ability)
5. **Alex "Cannon" Rodriguez** - Catcher (7 Power, Cannon Arm ability)

### Unlockable Characters (Win 5 Games)
6. **Taylor "Southpaw" Jenkins** - Lefty pitcher (10 Pitching, Curveball Chaos)
7. **Morgan "Sparkplug" Davis** - Double play specialist (9 Fielding)
8. **Jamie "Moonshot" Patel** - Home run threat (10 Power)

### Championship Characters (Win Season)
9. **Charlie "Glove Wizard" Chen** - Gold glove fielder (10 Fielding, Super Dive)
10. **Quinn "The Wall" Anderson** - Outfielder (8 Power/Fielding, Wall Climb)

### Secret Characters (Special Unlocks)
11. **Frankie "Knuckleball" Foster** - Unpredictable pitcher (Tornado Pitch)
12. **River "Ice" Nakamura** - Zen pitcher (9 Pitching, Freeze Frame)
13. **Skyler "Fireworks" Lopez** - All-around player (7 in all stats)
14. **Dakota "Scrappy" Williams** - Underdog (stats boost when losing)
15. **Remy "The Collector" Dubois** - Vintage player (random ability copy)

---

## Stadium Lineup (8 Unique Venues)

### Starter Stadiums
1. **Sunny Acres Backyard** - Classic suburban field (symmetrical, light wind)
2. **Dusty Diamond Park** - Sandy lot near construction site (short right field)

### Unlockable Stadiums
3. **Treehouse Heights** - Woodland arena (variable wind each inning)
4. **Beachside Boardwalk** - Ocean-side field (strong offshore wind, sand slows runners)

### Championship Stadiums
5. **Junkyard Classic** - Auto junkyard with car fences (irregular heights)
6. **Rooftop Rumble** - Downtown rooftop (elevated = more distance)

### Secret Stadiums
7. **Midnight Moon Field** - Nighttime field (fog creates mystery)
8. **Championship Stadium "The Big Leagues"** - Pro-style venue (perfect conditions)

---

## Technical Architecture

### Unity Project Structure

```
Assets/
├── Scripts/
│   ├── Core/ (GameManager, InputManager, AudioManager) ✅
│   ├── Data/ (CharacterData, TeamData, StadiumData) ✅
│   ├── Abilities/ (SpecialAbility base + 15 implementations) ⏳
│   ├── Gameplay/ (BattingSystem, PitchingSystem, FieldingSystem) TODO
│   ├── AI/ (OpponentAI, DifficultyScaler) TODO
│   ├── UI/ (Menus, HUD, transitions) TODO
│   └── Progression/ (UnlockManager, Achievements) TODO
├── Prefabs/
│   ├── Characters/ (15 character models) TODO
│   ├── Stadiums/ (8 stadium environments) TODO
│   └── UI/ (Reusable UI elements) TODO
├── ScriptableObjects/
│   ├── Characters/ (15 .asset files) TODO
│   ├── Teams/ (Starter teams) TODO
│   └── Stadiums/ (8 .asset files) TODO
```

### Core Systems Implemented

**GameManager (Complete)**
- State machine (MainMenu → TeamSelection → Pitching → Batting → Fielding → GameOver)
- Inning progression with automatic side changes
- Scoring and baserunning logic
- Statistics tracking per game
- Event system for UI updates

**Data Layer (Complete)**
- ScriptableObject architecture for easy content creation
- Character stats with modifier system (for temporary ability boosts)
- Team lineup validation and auto-generation
- Stadium collision detection for home runs
- Unlock requirement framework

**Ability System (Complete Framework)**
- Base class with activation/deactivation logic
- Type-based filtering (Batting, Pitching, Fielding, Baserunning, Passive)
- One-use-per-game enforcement
- Integration with visual/audio effects
- Example implementations (Rocket Boost, Base Burglar)

---

## Development Phases

### Phase 1: Core Mechanics (Weeks 1-4) ⏳ Current
- [ ] BattingSystem with touch input (strike zone grid, power meter)
- [ ] PitchingSystem with gesture controls (swipe for pitch type)
- [ ] PhysicsController for ball trajectory
- [ ] FieldingSystem with auto-routing + catch timing
- [ ] Basic UI (scoreboard, pitch count, bases)

**Milestone:** Demo video showing full at-bat

### Phase 2: Full Game (Weeks 5-8)
- [ ] All 15 characters with abilities implemented
- [ ] 3 stadiums playable
- [ ] AI opponent for batting/pitching
- [ ] Baserunning logic
- [ ] Tutorial mode

**Milestone:** Playable 9-inning games

### Phase 3: Content & Progression (Weeks 9-12)
- [ ] Season mode (20 games + playoffs)
- [ ] All 8 stadiums
- [ ] 30 achievements
- [ ] Unlock system
- [ ] Cloud saves

**Milestone:** Feature-complete beta

### Phase 4: Polish & Launch (Weeks 13-16)
- [ ] Character animations
- [ ] Full audio (music, SFX, voice lines)
- [ ] App Store assets
- [ ] Localization (English, Spanish)
- [ ] Bug fixes

**Milestone:** App Store submission

---

## Key Gameplay Mechanics

### Batting System
- **Touch Input:** Tap and hold in strike zone (3x3 grid)
- **Timing:** Color-coded indicator (green = perfect)
- **Power:** Hold duration determines swing power (0-100%)
- **Hit Types:** Perfect timing + good contact = line drive / home run

### Pitching System
- **Gesture Selection:**
  - Swipe Up: Fastball
  - Swipe Down: Changeup
  - Swipe Left/Right: Curveball
  - Diagonal: Slider
- **Aiming:** 9-zone grid, drag to select
- **Accuracy:** Stop meter in green zone for perfect control

### Fielding System
- **Auto-Routing:** AI calculates optimal path to ball
- **Catch Timing:** Tap when ball enters catch zone
- **Throwing:** Tap base icon after catch

### Special Abilities (Once Per Game)
- **Offensive:** Rocket Boost, Lucky Charm, Eagle Eye, Base Burglar
- **Pitching:** Freeze Frame, Tornado Pitch, Strike Magnet, Curveball Chaos
- **Fielding:** Super Dive, Cannon Arm, Wall Climb, Double Play Master

---

## Performance Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Framerate | 60 FPS | 30 FPS |
| Load time | 3s | 5s |
| Install size | 80 MB | 150 MB |
| RAM usage | 200 MB | 350 MB |
| Battery drain (1hr) | 10% | 15% |

**Device Compatibility:**
- **Minimum:** iOS 12 (iPhone 6s), Android 8.0
- **Recommended:** iOS 14+, Android 10+

---

## Monetization

### Premium Purchase ($4.99)
- No ads
- Full game access (all characters, stadiums, season mode)
- No pay-to-win mechanics

### Optional Cosmetic DLC ($0.99-$1.99)
- Uniform packs (retro, futuristic, holiday)
- Bat skins (wooden, metal, glowing)
- Stadium decorations
- Announcer voice packs

**Projected Revenue (Year 1):** $150,000 gross
- 30,000 purchases @ $4.99 = $149,700
- 20% DLC adoption (~6,000 × $1.49 avg) = $8,940
- **Total:** ~$158,000 gross

---

## Next Steps

### Immediate Actions (This Week)
1. **Legal Clearance:**
   - Trademark search for "Sandlot Sluggers"
   - Verify character names have no conflicts
   - Consult IP attorney ($500-$1,000)

2. **Unity Setup:**
   - Initialize project with Unity 2022.3 LTS
   - Import required packages (Input System, TextMeshPro)
   - Configure iOS/Android build settings

3. **Character Art:**
   - Commission 5 starter character designs
   - Create 3D models or 2D sprites
   - Animate: Idle, Swing, Pitch, Catch, Run

4. **Prototype:**
   - Implement BattingSystem (Week 1 deliverable)
   - Build touch input for strike zone
   - Test on physical device (iPhone/Android)

### Month 1 Goals
- Functional batting mechanics
- Ball physics with realistic trajectories
- 1 playable stadium (Sunny Acres)
- 3 characters (Casey, Riley, Jordan)
- UI: Strike zone overlay, power meter

### Month 2 Goals
- Full pitching system with gestures
- Fielding with auto-routing
- AI opponent (basic difficulty)
- 5 characters total
- Tutorial sequence

### Month 3 Goals
- 9-inning games functional
- Season mode framework
- 10 characters
- 5 stadiums
- Achievement system

### Month 4 Goals
- Polish and bug fixes
- All 15 characters
- All 8 stadiums
- Beta testing (50 external users)
- App Store preparation

---

## Contact

**Developer:** Austin Humphrey  
**Company:** Blaze Sports Intelligence  
**Email:** ahump20@outlook.com  
**Website:** https://blazesportsintel.com

**Repository:** `/Users/AustinHumphrey/Sandlot-Sluggers`

---

## License

**Proprietary Software** - All rights reserved.

This game is the intellectual property of Austin Humphrey / Blaze Sports Intelligence. Unauthorized copying or distribution is prohibited.

---

## Acknowledgments

**Inspired by:** Backyard Baseball 2001 (Humongous Entertainment)  
**Special Thanks:** Classic sports game community for keeping the nostalgia alive

**Legal Note:** This project uses 100% original IP. No characters, names, designs, or mechanics are copied from existing franchises. All content is legally distinct.

---

**Last Updated:** January 2025  
**Architecture Status:** Complete and ready for implementation
