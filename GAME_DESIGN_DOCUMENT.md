# Sandlot Sluggers - Game Design Document

**Version:** 1.0.0
**Platform:** iOS 12+ / Android 8+
**Engine:** Unity (C#) with mobile optimization
**Target Audience:** Ages 8-14 (with adult appeal)
**Release Strategy:** Premium ($4.99) with optional cosmetic DLC

---

## Executive Summary

**Sandlot Sluggers** is a mobile-first arcade baseball game that brings neighborhood pick-up baseball to life. Players build teams of unique kid characters, each with distinct abilities, and compete across imaginative backyard stadiums. The game prioritizes **instant fun** over simulation realism while maintaining strategic depth through character matchups and special abilities.

---

## Core Gameplay Loop

### Primary Loop (Single Game)
1. **Team Selection** → Choose 9 characters from unlocked roster
2. **Stadium Selection** → Pick venue (affects gameplay modifiers)
3. **Batting Phase** → Timing-based swing mechanic
4. **Pitching Phase** → Gesture-based pitch selection
5. **Fielding Phase** → Auto-routing with manual catch timing
6. **Results** → Earn XP, unlock new characters/stadiums

### Secondary Loop (Season Mode)
- 20-game season against AI teams
- Playoff bracket (best-of-3 series)
- Championship game unlocks exclusive rewards
- Leaderboard integration for fastest season completions

---

## Game Mechanics

### Batting System

**Touch Controls:**
- **Tap Zone:** 3x3 grid overlay on strike zone
- **Timing Window:** Color-coded indicator (red = early, green = perfect, yellow = late)
- **Power Meter:** Hold duration determines swing power (0-100%)

**Swing Types:**
- **Normal Swing:** Balanced contact/power
- **Power Swing:** (Swipe up during hold) +50% power, -30% contact
- **Bunt:** (Tap without hold) Precision placement, no power

**Hit Outcomes:**
- Perfect timing + contact zone = line drive (highest success)
- Good timing + power = potential home run
- Poor timing = weak contact, pop-up, or strikeout
- Ball physics calculate trajectory based on swing angle + power

**Visual Feedback:**
- Bat trail effects (color indicates swing quality)
- Ball trajectory prediction arc
- Fielder icons show catch probability in real-time

---

### Pitching System

**Pitch Selection (Pre-Throw):**
- **Swipe Gestures:**
  - Up: Fastball (high speed, straight)
  - Down: Changeup (slow, drops)
  - Left/Right: Curveball (breaks horizontally)
  - Diagonal: Slider (combination movement)

**Aiming:**
- 9-zone target grid appears
- Drag finger to select zone
- Release to throw

**Accuracy System:**
- Pitcher's Control stat (1-10) determines variance
- Meter fills during windup (stop in green = perfect accuracy)
- Miss the green = pitch drifts toward red zone

**Pitch Count:**
- Each pitcher has stamina (50 pitches default)
- Effectiveness decreases after threshold
- Can switch pitchers between innings

---

### Fielding System

**Automated Routing:**
- AI calculates optimal fielder path to ball
- Player sees glowing trail showing movement

**Manual Catch Timing:**
- Circular catch zone appears when fielder nears ball
- Tap when ball enters zone (earlier = better throw velocity)
- Perfect catch = instant throw to base
- Late catch = slower throw, higher error chance

**Baserunning (Offense):**
- **Tap runner icon** to attempt steal or advance
- **Swipe toward base** for directed running
- **Double-tap** to send all runners

**Throwing (Defense):**
- After catch, tap base icon to throw
- Throw speed based on fielder's Arm Strength stat
- Lead runner highlighted by default

---

### Special Abilities

Each character has **one signature ability** usable once per game:

**Offensive Abilities:**
- **Lucky Charm:** Next hit automatically becomes fair (no foul balls)
- **Rocket Boost:** +100% bat speed for one swing
- **Eagle Eye:** Strike zone expands, all pitches easier to hit
- **Base Burglar:** Guaranteed stolen base (once)

**Pitching Abilities:**
- **Freeze Frame:** Batter's timing window reduced by 70%
- **Tornado Pitch:** Random pitch type (batter doesn't see selection)
- **Strike Magnet:** Next 3 pitches count as strikes if in zone
- **Curveball Chaos:** All pitches break unpredictably

**Fielding Abilities:**
- **Super Dive:** Teleport to ball location (auto-catch)
- **Cannon Arm:** Instant throw to any base
- **Wall Climb:** Catch home run balls at fence
- **Double Play Master:** Automatic double play on ground ball

---

## Characters (15 Original Kids)

### Tier 1: Starter Characters (Available Immediately)

#### 1. **Casey "Slugger" Martinez**
- **Age:** 12 | **Position:** 1B/RF
- **Appearance:** Stocky build, backwards red cap, freckles, missing front tooth
- **Personality:** Overconfident showboat who celebrates too early
- **Stats:** Power 9, Contact 5, Speed 3, Fielding 4, Pitching 2
- **Special Ability:** **Rocket Boost** (one mega-power swing)
- **Backstory:** Kid who always swings for the fences, strikes out a lot but when he connects, it's gone
- **Voice Lines:** "That's outta here!", "Did you see that?!", "I meant to do that..." (after strikeout)

#### 2. **Riley "Wheels" Thompson**
- **Age:** 10 | **Position:** CF/SS
- **Appearance:** Tall and skinny, oversized cleats, headband, always in motion
- **Personality:** Hyperactive speedster who can't stand still
- **Stats:** Power 2, Contact 7, Speed 10, Fielding 8, Pitching 3
- **Special Ability:** **Base Burglar** (guaranteed steal)
- **Backstory:** Fastest kid in the neighborhood, loves beating throws
- **Voice Lines:** "Catch me if you can!", "I'm already there!", "Too slow!"

#### 3. **Jordan "Professor" Kim**
- **Age:** 11 | **Position:** P/2B
- **Appearance:** Glasses, neatly combed hair, baseball glove that looks brand new
- **Personality:** Strategic thinker who calculates everything
- **Stats:** Power 4, Contact 6, Speed 5, Fielding 7, Pitching 9
- **Special Ability:** **Strike Magnet** (3 auto-strikes)
- **Backstory:** Studied YouTube pitching videos all winter, has perfect mechanics
- **Voice Lines:** "According to my calculations...", "I've analyzed your swing", "Science!"

#### 4. **Sam "Butterfingers" O'Reilly**
- **Age:** 9 | **Position:** LF/3B
- **Appearance:** Short, messy hair, band-aids on knees, untied shoes
- **Personality:** Clumsy but enthusiastic, never gives up
- **Stats:** Power 6, Contact 8, Speed 6, Fielding 3, Pitching 5
- **Special Ability:** **Lucky Charm** (next hit = guaranteed fair ball)
- **Backstory:** Drops easy catches but somehow makes miraculous plays when it matters
- **Voice Lines:** "I got it! I got it! ...I don't got it", "That was supposed to happen!", "Trust me!"

#### 5. **Alex "Cannon" Rodriguez**
- **Age:** 13 | **Position:** C/RF
- **Appearance:** Athletic build, catcher's gear tan lines, confident stance
- **Personality:** Team leader, vocal encourager
- **Stats:** Power 7, Contact 6, Speed 4, Fielding 6, Pitching 4
- **Special Ability:** **Cannon Arm** (instant throw to any base)
- **Backstory:** Dreams of MLB stardom, practices throws to second base every day
- **Voice Lines:** "No way you're stealing!", "I got your back!", "Easy out!"

---

### Tier 2: Unlock Characters (Win 5 Games)

#### 6. **Taylor "Southpaw" Jenkins**
- **Age:** 12 | **Position:** P/1B
- **Appearance:** Left-handed, wristbands, intense game face
- **Personality:** Quiet competitor who lets performance speak
- **Stats:** Power 5, Contact 5, Speed 4, Fielding 5, Pitching 10
- **Special Ability:** **Curveball Chaos** (unpredictable pitch breaks)
- **Backstory:** Lefty with naturally deceptive delivery, makes hitters look silly
- **Voice Lines:** "Watch this.", "You won't hit it.", "Strike three."

#### 7. **Morgan "Sparkplug" Davis**
- **Age:** 10 | **Position:** 2B/SS
- **Appearance:** Pigtails, colorful wristbands, biggest smile on the field
- **Personality:** Eternal optimist, cheers for everyone
- **Stats:** Power 3, Contact 9, Speed 8, Fielding 9, Pitching 2
- **Special Ability:** **Double Play Master** (auto-DP on ground ball)
- **Backstory:** Loves turning two, always in perfect position
- **Voice Lines:** "Great hit! ...I mean, for them", "I love this game!", "We got this!"

#### 8. **Jamie "Moonshot" Patel**
- **Age:** 11 | **Position:** CF/RF
- **Appearance:** Tall, long hair, sunglasses on hat brim
- **Personality:** Cool and collected power hitter
- **Stats:** Power 10, Contact 4, Speed 6, Fielding 6, Pitching 3
- **Special Ability:** **Eagle Eye** (expanded strike zone vision)
- **Backstory:** Hits towering fly balls, rumors say one landed on a roof three blocks away
- **Voice Lines:** "Going deep.", "Moon ball!", "Swing and a drive!"

---

### Tier 3: Unlock Characters (Win Championship)

#### 9. **Charlie "Glove Wizard" Chen**
- **Age:** 12 | **Position:** SS/CF
- **Appearance:** Always wears worn-in glove, baseball cap with lucky pin
- **Personality:** Makes impossible plays look routine
- **Stats:** Power 3, Contact 7, Speed 7, Fielding 10, Pitching 4
- **Special Ability:** **Super Dive** (teleport catch)
- **Backstory:** Has a sixth sense for where balls are hit, family legacy of great fielders
- **Voice Lines:** "I got range.", "Nothing gets by me.", "Easy."

#### 10. **Quinn "The Wall" Anderson**
- **Age:** 13 | **Position:** RF/LF
- **Appearance:** Strong build, football player arms, eye black
- **Personality:** Physical player who crashes into fences
- **Stats:** Power 8, Contact 5, Speed 5, Fielding 8, Pitching 2
- **Special Ability:** **Wall Climb** (rob home runs at fence)
- **Backstory:** Former football player who switched to baseball, plays outfield like a linebacker
- **Voice Lines:** "You shall not pass!", "Denied!", "That's my ball!"

---

### Tier 4: Secret Characters (Special Unlocks)

#### 11. **Frankie "Knuckleball" Foster**
- **Age:** 9 | **Position:** P
- **Appearance:** Oversized jersey (older sibling's), crooked glasses, messy hair
- **Personality:** Awkward kid who accidentally throws unhittable pitches
- **Stats:** Power 2, Contact 3, Speed 4, Fielding 3, Pitching 8
- **Special Ability:** **Tornado Pitch** (completely random movement)
- **Backstory:** Doesn't throw hard but ball moves so weirdly nobody can hit it
- **Unlock:** Pitch a shutout game
- **Voice Lines:** "Uh, here it comes?", "Did it work?", "I don't know how I do it either"

#### 12. **River "Ice" Nakamura**
- **Age:** 13 | **Position:** P/SS
- **Appearance:** Focused expression, athletic tape on fingers, pristine uniform
- **Personality:** Unshakeable composure, never shows emotion
- **Stats:** Power 5, Contact 8, Speed 6, Fielding 7, Pitching 9
- **Special Ability:** **Freeze Frame** (slow down batter timing)
- **Backstory:** Meditates before games, treats baseball like chess
- **Unlock:** Win 10 games without losing
- **Voice Lines:** "Breathe.", "Focus.", "Namaste." (after strikeout)

#### 13. **Skyler "Fireworks" Lopez**
- **Age:** 11 | **Position:** 3B/2B
- **Appearance:** Dyed hair tips, custom batting gloves, flashy cleats
- **Personality:** Showboater who backs up the talk
- **Stats:** Power 7, Contact 7, Speed 7, Fielding 7, Pitching 7
- **Special Ability:** **Lucky Streak** (all stats +2 for one inning)
- **Backstory:** All-around player who loves the spotlight
- **Unlock:** Hit for the cycle (single, double, triple, HR in one game)
- **Voice Lines:** "Style points!", "Watch the master!", "Too easy!"

#### 14. **Dakota "Scrappy" Williams**
- **Age:** 8 | **Position:** 2B/RF
- **Appearance:** Smallest player, dirt-covered uniform, determined eyes
- **Personality:** Heart of a lion, never intimidated
- **Stats:** Power 1, Contact 6, Speed 9, Fielding 5, Pitching 3
- **Special Ability:** **Underdog Power** (stats increase when team is losing)
- **Backstory:** Always picked last but proves doubters wrong
- **Unlock:** Win a game while trailing by 5+ runs
- **Voice Lines:** "I'll show you!", "Size doesn't matter!", "Never give up!"

#### 15. **Remy "The Collector" Dubois**
- **Age:** 12 | **Position:** All positions
- **Appearance:** Vintage uniform from 1950s, antique glove, retro cleats
- **Personality:** Baseball historian obsessed with old-school play
- **Stats:** Power 6, Contact 6, Speed 6, Fielding 6, Pitching 6
- **Special Ability:** **Vintage Magic** (random ability from any other character)
- **Backstory:** Grandparent taught them the old ways, plays with timeless fundamentals
- **Unlock:** Collect all achievements
- **Voice Lines:** "They played it better in the old days.", "Classic!", "Respect the game."

---

## Stadium Designs (8 Unique Venues)

### Tier 1: Starter Stadiums

#### 1. **Sunny Acres Backyard**
- **Setting:** Classic suburban backyard with wooden fence
- **Theme:** Nostalgia, summer BBQ atmosphere
- **Visual Elements:**
  - Dad grilling in background (occasionally distracts fielders)
  - Dog runs through outfield randomly
  - Sprinkler system activates 5th inning (wet grass = faster grounders)
  - Tree in left-center field (automatic ground-rule double if hit)
- **Dimensions:** 180ft to fences, symmetrical
- **Modifiers:**
  - Wind: Light (5% effect on fly balls)
  - Terrain: Flat
- **Unlock:** Available from start

#### 2. **Dusty Diamond Park**
- **Setting:** Sandy lot next to construction site
- **Theme:** Rough-and-tumble neighborhood feel
- **Visual Elements:**
  - Construction equipment in background
  - Dirt patches create bad hops
  - Chain-link fence with gaps (balls can roll through for inside-the-park HRs)
  - Porta-potty serves as dugout
- **Dimensions:** 200ft to fences, asymmetrical (short right field porch)
- **Modifiers:**
  - Wind: Moderate (10% effect)
  - Terrain: Uneven (5% fielding error chance)
- **Unlock:** Available from start

---

### Tier 2: Unlock Stadiums (Win 3 Games)

#### 3. **Treehouse Heights**
- **Setting:** Elaborate treehouse system serves as stands/foul territory
- **Theme:** Woodland adventure
- **Visual Elements:**
  - Rope bridges connect treehouses
  - Squirrels occasionally steal foul balls
  - Slide from treehouse to home plate
  - Fall leaves blow across field in autumn wind
- **Dimensions:** 190ft, circular (encourages gap hitting)
- **Modifiers:**
  - Wind: Variable (changes each inning, 0-20%)
  - Terrain: Roots create natural bunting zones
- **Unlock:** Win 3 games

#### 4. **Beachside Boardwalk**
- **Setting:** Sand lot next to pier and ocean
- **Theme:** Vacation vibes, seagull sounds
- **Visual Elements:**
  - Waves crash in background
  - Pier extends into outfield (can hit balls onto it for bonus)
  - Sand slows down ground balls
  - Ice cream truck parks near 3rd base (players distracted animation)
- **Dimensions:** 210ft but sand reduces HR distance by 10%
- **Modifiers:**
  - Wind: Strong offshore (20% pushback on fly balls)
  - Terrain: Sand (slower baserunning, -1 Speed for all)
- **Unlock:** Win 5 games

---

### Tier 3: Championship Stadiums (Win Season)

#### 5. **Junkyard Classic**
- **Setting:** Repurposed auto junkyard with stacked cars as fence
- **Theme:** Industrial creativity
- **Visual Elements:**
  - Stacked cars form irregular fence heights
  - Hit specific car models for bonus points
  - Oil slick in left field (fielders slip)
  - Crane occasionally swings wrecking ball (visual only, no gameplay impact)
- **Dimensions:** 195ft but variable heights (some cars only 8ft tall)
- **Modifiers:**
  - Wind: Swirling (unpredictable direction)
  - Terrain: Oil patches create speed bursts
- **Unlock:** Win Championship once

#### 6. **Rooftop Rumble**
- **Setting:** Flat rooftop in downtown area
- **Theme:** Urban sandlot
- **Visual Elements:**
  - City skyline backdrop
  - Rooftop AC units serve as bases
  - Hit ball off roof edge = automatic HR
  - Pigeons fly through occasionally
- **Dimensions:** 170ft but elevated (balls travel farther, +10% distance)
- **Modifiers:**
  - Wind: High-altitude gusts (25% fly ball effect)
  - Terrain: Perfect (no errors possible)
- **Unlock:** Win 2 Championships

---

### Tier 4: Secret Stadiums

#### 7. **Midnight Moon Field**
- **Setting:** Nighttime field under full moon
- **Theme:** Spooky/magical
- **Visual Elements:**
  - Fireflies illuminate basepaths
  - Bats (animal) fly overhead
  - Glow-in-the-dark bases
  - Mysterious fog in outfield reduces visibility
- **Dimensions:** 185ft, fog obscures exact fence location
- **Modifiers:**
  - Wind: Calm (no effect)
  - Terrain: Fog creates "lost ball" events (auto-triple)
- **Unlock:** Play 50 total games

#### 8. **Championship Stadium - "The Big Leagues"**
- **Setting:** Professional-style field with stands full of fans
- **Theme:** Dream come true, championship atmosphere
- **Visual Elements:**
  - Jumbo screen shows replays
  - Mascot entertains crowd
  - Fireworks after HRs
  - Press box with announcers
- **Dimensions:** 220ft, regulation-style
- **Modifiers:**
  - Wind: None (dome stadium)
  - Terrain: Perfect grass, no luck involved
- **Unlock:** Complete all achievements

---

## Progression & Unlockables

### XP System
- **Base XP per game:** 100
- **Bonus XP:**
  - Win: +50
  - Shutout: +25
  - Home run: +10 each
  - Perfect game: +200
  - Comeback win: +75

### Unlock Tiers
| Level | Unlocks |
|-------|---------|
| 1 | Tutorial complete, 5 starter characters |
| 3 | Dusty Diamond Park, 2 new characters |
| 5 | Treehouse Heights, 2 new characters |
| 8 | Beachside Boardwalk, 1 new character |
| 10 | Season Mode unlocked |
| 15 | Junkyard Classic |
| 20 | Rooftop Rumble, secret character |
| 25 | Championship Stadium |
| 30 | All achievements, final secret character |

### Achievements (30 Total)
**Batting:**
- First Hit, Home Run Derby (10 HRs), Grand Slam, Hit for Cycle

**Pitching:**
- First Strikeout, Perfect Game, No-Hitter, 10 K Game

**Fielding:**
- Robbery (rob HR), Triple Play, Error-Free Game

**Team:**
- First Win, 10-Game Win Streak, Championship, Undefeated Season

**Special:**
- Use all character abilities, Play on all stadiums, 100 total games

---

## Monetization Strategy

### Premium Model ($4.99 USD)
- **No ads**
- **No pay-to-win mechanics**
- **Full game access** including all unlockable characters

### Optional Cosmetic DLC ($0.99-$1.99 each)
- **Uniform packs:** Retro, futuristic, holiday themes
- **Bat skins:** Wooden, metal, glowing, etc.
- **Stadium decorations:** Banners, custom scoreboards
- **Announcer voice packs:** Different commentary styles

### COPPA Compliance
- No data collection from players under 13
- Parental gate for purchases
- No social features requiring account creation
- Privacy policy clearly visible

---

## Technical Architecture

### Engine Choice: **Unity (C#)**

**Why Unity?**
- Mature mobile optimization (iOS/Android build support)
- 2D physics engine ideal for baseball trajectories
- Asset Store for rapid prototyping (character models, UI)
- Strong community for baseball game development
- Good performance on low-end devices (target: iPhone 8, Galaxy S8)

---

### Project Structure

```
SandlotSluggers/
├── Assets/
│   ├── Scripts/
│   │   ├── Core/
│   │   │   ├── GameManager.cs          # Singleton game state
│   │   │   ├── InputManager.cs         # Touch input handling
│   │   │   └── AudioManager.cs         # Sound/music controller
│   │   ├── Gameplay/
│   │   │   ├── BattingSystem.cs        # Swing mechanics
│   │   │   ├── PitchingSystem.cs       # Pitch delivery
│   │   │   ├── FieldingSystem.cs       # Auto-route + catch timing
│   │   │   ├── BaserunningAI.cs        # Runner decision logic
│   │   │   └── PhysicsController.cs    # Ball trajectory
│   │   ├── Characters/
│   │   │   ├── CharacterData.cs        # ScriptableObject for stats
│   │   │   ├── SpecialAbility.cs       # Base ability class
│   │   │   └── AbilityEffects/         # Individual abilities
│   │   ├── UI/
│   │   │   ├── MainMenuController.cs
│   │   │   ├── TeamSelectionUI.cs
│   │   │   ├── HUDController.cs
│   │   │   └── PauseMenu.cs
│   │   ├── Progression/
│   │   │   ├── UnlockManager.cs        # Character/stadium unlocks
│   │   │   ├── AchievementSystem.cs
│   │   │   └── SaveDataManager.cs      # PlayerPrefs wrapper
│   │   └── AI/
│   │       ├── OpponentAI.cs           # Batting/pitching decisions
│   │       └── DifficultyScaler.cs     # Adaptive difficulty
│   ├── Prefabs/
│   │   ├── Characters/                  # Character models
│   │   ├── Stadiums/                    # Stadium prefabs
│   │   └── UI/                          # Reusable UI elements
│   ├── Materials/
│   ├── Animations/
│   ├── Audio/
│   │   ├── SFX/                         # Bat crack, crowd cheers
│   │   └── Music/                       # Menu, gameplay tracks
│   └── ScriptableObjects/
│       ├── Characters/                  # 15 character configs
│       └── Stadiums/                    # 8 stadium configs
└── ProjectSettings/
```

---

### State Management

**GameManager (Singleton Pattern)**

```csharp
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    // Game State
    public GameState CurrentState { get; private set; }
    public int CurrentInning { get; private set; }
    public bool IsTopInning { get; private set; }
    public int HomeScore { get; private set; }
    public int AwayScore { get; private set; }
    public int Outs { get; private set; }

    // Teams
    public TeamData HomeTeam { get; private set; }
    public TeamData AwayTeam { get; private set; }
    public CharacterData CurrentBatter { get; private set; }
    public CharacterData CurrentPitcher { get; private set; }

    // Bases
    public bool[] BasesOccupied { get; private set; } = new bool[3]; // 1st, 2nd, 3rd

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void StartGame(TeamData home, TeamData away, StadiumData stadium)
    {
        HomeTeam = home;
        AwayTeam = away;
        CurrentInning = 1;
        IsTopInning = true;
        HomeScore = 0;
        AwayScore = 0;
        Outs = 0;
        Array.Clear(BasesOccupied, 0, BasesOccupied.Length);

        ChangeState(GameState.Pitching);
    }

    public void RecordOut()
    {
        Outs++;
        if (Outs >= 3)
        {
            ChangeSides();
        }
    }

    public void RecordHit(HitType hitType)
    {
        // Advance runners based on hit type
        // Update score if runners cross home
        // Trigger animations/sounds
    }

    void ChangeSides()
    {
        Outs = 0;
        Array.Clear(BasesOccupied, 0, BasesOccupied.Length);

        if (IsTopInning)
        {
            IsTopInning = false;
        }
        else
        {
            CurrentInning++;
            IsTopInning = true;

            if (CurrentInning > 9 && HomeScore != AwayScore)
            {
                EndGame();
                return;
            }
        }

        ChangeState(GameState.Pitching);
    }

    public void ChangeState(GameState newState)
    {
        CurrentState = newState;
        OnStateChanged?.Invoke(newState);
    }

    public event Action<GameState> OnStateChanged;
}

public enum GameState
{
    MainMenu,
    TeamSelection,
    StadiumSelection,
    Pitching,
    Batting,
    Fielding,
    Baserunning,
    InningTransition,
    GameOver
}

public enum HitType
{
    Strikeout,
    Groundout,
    Flyout,
    Single,
    Double,
    Triple,
    HomeRun,
    FieldersChoice,
    Error
}
```

---

### Physics System

**Ball Trajectory Calculation**

```csharp
public class PhysicsController : MonoBehaviour
{
    [Header("Physics Constants")]
    [SerializeField] private float gravity = -9.81f;
    [SerializeField] private float airResistance = 0.02f;
    [SerializeField] private AnimationCurve launchAngleCurve; // Contact zone → angle

    public Vector3 CalculateBallTrajectory(
        Vector3 contactPoint,      // Where ball was hit in strike zone
        float swingPower,          // 0-100 from batting system
        float contactQuality,      // Timing accuracy (0-1)
        Vector2 windVector,        // Stadium wind effect
        CharacterData batter       // For power stat
    )
    {
        // Base exit velocity from power stat + swing power
        float exitVelocity = (batter.PowerStat * 10f + swingPower) * contactQuality;
        exitVelocity = Mathf.Clamp(exitVelocity, 20f, 120f); // mph equivalent

        // Launch angle based on contact point (low = groundball, high = flyball)
        float verticalContactPoint = contactPoint.y; // -1 to 1
        float launchAngle = launchAngleCurve.Evaluate(verticalContactPoint);

        // Horizontal angle based on contact point (pull vs opposite field)
        float horizontalContactPoint = contactPoint.x; // -1 to 1
        float horizontalAngle = horizontalContactPoint * 45f; // Max 45° pull/oppo

        // Convert to velocity vector
        Vector3 initialVelocity = new Vector3(
            Mathf.Sin(horizontalAngle * Mathf.Deg2Rad) * exitVelocity,
            Mathf.Sin(launchAngle * Mathf.Deg2Rad) * exitVelocity,
            Mathf.Cos(horizontalAngle * Mathf.Deg2Rad) * exitVelocity
        );

        // Apply wind
        initialVelocity.x += windVector.x;
        initialVelocity.z += windVector.y;

        return initialVelocity;
    }

    public IEnumerator SimulateBallFlight(
        Vector3 initialVelocity,
        Vector3 startPosition,
        StadiumData stadium
    )
    {
        Vector3 position = startPosition;
        Vector3 velocity = initialVelocity;
        float timeStep = 0.02f; // 50 FPS physics

        while (position.y > 0.1f) // Ball hasn't hit ground/fence
        {
            // Apply gravity
            velocity.y += gravity * timeStep;

            // Apply air resistance
            velocity *= (1 - airResistance * timeStep);

            // Update position
            position += velocity * timeStep;

            // Check stadium collisions
            HitResult result = stadium.CheckCollision(position);
            if (result != HitResult.InFlight)
            {
                OnBallLanded?.Invoke(result, position);
                yield break;
            }

            // Update ball visual position
            ballTransform.position = position;

            yield return new WaitForSeconds(timeStep);
        }

        // Ball hit ground
        OnBallLanded?.Invoke(HitResult.GroundBall, position);
    }

    public event Action<HitResult, Vector3> OnBallLanded;
}

public enum HitResult
{
    InFlight,
    GroundBall,
    FlyBall,
    LineDrive,
    HomeRun,
    Foul
}
```

---

### Character System (ScriptableObjects)

```csharp
[CreateAssetMenu(fileName = "NewCharacter", menuName = "Sandlot/Character")]
public class CharacterData : ScriptableObject
{
    [Header("Identity")]
    public string CharacterName;
    public string Nickname;
    public int Age;
    public Sprite Portrait;
    public GameObject ModelPrefab;

    [Header("Stats (1-10)")]
    [Range(1, 10)] public int PowerStat = 5;
    [Range(1, 10)] public int ContactStat = 5;
    [Range(1, 10)] public int SpeedStat = 5;
    [Range(1, 10)] public int FieldingStat = 5;
    [Range(1, 10)] public int PitchingStat = 5;

    [Header("Ability")]
    public SpecialAbility Ability;
    public bool AbilityUsedThisGame = false;

    [Header("Personality")]
    [TextArea] public string Backstory;
    public AudioClip[] VoiceLines;
    public List<string> SubtitlesForVoiceLines;

    [Header("Unlock Requirements")]
    public UnlockCondition UnlockType;
    public int UnlockValue; // e.g., "Win X games"

    public void ResetAbility()
    {
        AbilityUsedThisGame = false;
    }

    public bool CanUseAbility()
    {
        return !AbilityUsedThisGame && Ability != null;
    }
}

public enum UnlockCondition
{
    StarterCharacter,
    WinGames,
    CompleteAchievement,
    WinChampionship,
    SecretUnlock
}
```

**Special Ability Base Class**

```csharp
public abstract class SpecialAbility : ScriptableObject
{
    public string AbilityName;
    public string Description;
    public Sprite Icon;
    public AbilityType Type;

    public abstract void Activate(CharacterData character);
    public abstract void Deactivate();
}

public enum AbilityType
{
    Batting,
    Pitching,
    Fielding,
    Baserunning
}
```

**Example Ability Implementation**

```csharp
[CreateAssetMenu(fileName = "RocketBoost", menuName = "Sandlot/Abilities/Rocket Boost")]
public class RocketBoostAbility : SpecialAbility
{
    private BattingSystem battingSystem;

    public override void Activate(CharacterData character)
    {
        battingSystem = FindObjectOfType<BattingSystem>();
        if (battingSystem != null)
        {
            battingSystem.PowerMultiplier = 2.0f; // Double bat speed
            battingSystem.OnSwingComplete += Deactivate; // One-time use

            // Visual effects
            battingSystem.ShowAbilityEffect("ROCKET BOOST!", Color.yellow);
            AudioManager.Instance.PlaySFX("RocketBoostActivate");
        }

        character.AbilityUsedThisGame = true;
    }

    public override void Deactivate()
    {
        if (battingSystem != null)
        {
            battingSystem.PowerMultiplier = 1.0f;
            battingSystem.OnSwingComplete -= Deactivate;
        }
    }
}
```

---

### Batting System Implementation

```csharp
public class BattingSystem : MonoBehaviour
{
    [Header("Input Settings")]
    [SerializeField] private float maxHoldTime = 2.0f;
    [SerializeField] private RectTransform strikeZoneUI;

    [Header("Timing")]
    [SerializeField] private float perfectTimingWindow = 0.1f; // seconds
    [SerializeField] private float goodTimingWindow = 0.25f;

    private float holdStartTime;
    private bool isHolding = false;
    private Vector2 contactPoint;
    public float PowerMultiplier { get; set; } = 1.0f; // For abilities

    void Update()
    {
        if (GameManager.Instance.CurrentState != GameState.Batting)
            return;

        HandleTouchInput();
    }

    void HandleTouchInput()
    {
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    if (IsTouchInStrikeZone(touch.position))
                    {
                        holdStartTime = Time.time;
                        isHolding = true;
                        contactPoint = GetNormalizedStrikeZonePosition(touch.position);
                        ShowPowerMeter();
                    }
                    break;

                case TouchPhase.Ended:
                    if (isHolding)
                    {
                        ExecuteSwing();
                        isHolding = false;
                        HidePowerMeter();
                    }
                    break;
            }
        }
    }

    bool IsTouchInStrikeZone(Vector2 screenPos)
    {
        return RectTransformUtility.RectangleContainsScreenPoint(
            strikeZoneUI,
            screenPos,
            Camera.main
        );
    }

    Vector2 GetNormalizedStrikeZonePosition(Vector2 screenPos)
    {
        Vector2 localPoint;
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            strikeZoneUI,
            screenPos,
            Camera.main,
            out localPoint
        );

        // Normalize to -1 to 1
        Vector2 normalized = new Vector2(
            localPoint.x / (strikeZoneUI.rect.width / 2f),
            localPoint.y / (strikeZoneUI.rect.height / 2f)
        );

        return normalized;
    }

    void ExecuteSwing()
    {
        float holdDuration = Time.time - holdStartTime;
        float swingPower = Mathf.Clamp01(holdDuration / maxHoldTime) * 100f * PowerMultiplier;

        // Get pitch data from pitching system
        PitchData pitch = PitchingSystem.Instance.GetCurrentPitch();

        // Calculate timing quality
        float timingDifference = Mathf.Abs(pitch.ArrivalTime - Time.time);
        float contactQuality = CalculateContactQuality(timingDifference, contactPoint, pitch);

        if (contactQuality < 0.2f)
        {
            // Swing and miss
            HandleStrikeout();
            return;
        }

        // Successful contact - calculate trajectory
        Vector3 initialVelocity = PhysicsController.Instance.CalculateBallTrajectory(
            new Vector3(contactPoint.x, contactPoint.y, 0),
            swingPower,
            contactQuality,
            StadiumManager.Instance.CurrentWind,
            GameManager.Instance.CurrentBatter
        );

        // Start ball flight simulation
        StartCoroutine(PhysicsController.Instance.SimulateBallFlight(
            initialVelocity,
            transform.position,
            StadiumManager.Instance.CurrentStadium
        ));

        // Trigger animations
        AnimateSwing(contactQuality);
        ShowContactFeedback(contactQuality);

        OnSwingComplete?.Invoke();
    }

    float CalculateContactQuality(float timingDiff, Vector2 contactPt, PitchData pitch)
    {
        // Perfect timing bonus
        float timingScore = 1.0f;
        if (timingDiff < perfectTimingWindow)
        {
            timingScore = 1.0f;
        }
        else if (timingDiff < goodTimingWindow)
        {
            timingScore = 0.7f;
        }
        else
        {
            timingScore = 0.3f;
        }

        // Contact zone accuracy
        float distanceFromPitch = Vector2.Distance(contactPt, pitch.FinalLocation);
        float zoneScore = Mathf.Clamp01(1.0f - distanceFromPitch);

        // Batter's contact stat influences forgiveness
        float contactStatBonus = GameManager.Instance.CurrentBatter.ContactStat / 10f;

        float finalQuality = (timingScore * 0.6f + zoneScore * 0.4f) * (1 + contactStatBonus * 0.2f);
        return Mathf.Clamp01(finalQuality);
    }

    void ShowContactFeedback(float quality)
    {
        if (quality > 0.9f)
        {
            UIManager.Instance.ShowFeedback("PERFECT!", Color.green);
            AudioManager.Instance.PlaySFX("BatCrack_Perfect");
        }
        else if (quality > 0.7f)
        {
            UIManager.Instance.ShowFeedback("Good Contact", Color.yellow);
            AudioManager.Instance.PlaySFX("BatCrack_Good");
        }
        else
        {
            UIManager.Instance.ShowFeedback("Weak Contact", Color.red);
            AudioManager.Instance.PlaySFX("BatCrack_Weak");
        }
    }

    public event Action OnSwingComplete;
}
```

---

## MVP Development Roadmap

### Phase 1: Core Mechanics (Weeks 1-4)

**Goal:** Playable single at-bat with batting, pitching, fielding

**Deliverables:**
- Unity project setup with mobile build support
- Basic stadium environment (Sunny Acres Backyard)
- 3 starter characters with stats
- Batting system: touch input, swing timing, ball trajectory
- Pitching system: gesture selection, aiming, throw
- Fielding system: auto-routing, catch timing
- Ball physics with realistic trajectories
- Win/lose condition for single at-bat

**Testing:**
- Deploy to iOS TestFlight and Android Internal Testing
- Validate touch responsiveness on iPhone 8 / Galaxy S8
- Framerate target: 60 FPS stable

**Milestone:** Demo video showing full at-bat cycle

---

### Phase 2: Full Game Loop (Weeks 5-8)

**Goal:** Complete 9-inning games with all 15 characters

**Deliverables:**
- All 15 characters implemented with unique abilities
- 3 additional stadiums (Dusty Diamond, Treehouse, Beach)
- Baserunning logic (AI and player-controlled)
- Inning transitions and scoreboard UI
- Game state persistence (save/load mid-game)
- Basic AI opponent (batting and pitching decisions)
- Tutorial mode teaching core mechanics

**Testing:**
- Internal playtesting: Complete 10 full games
- Balance testing: Ensure no character is strictly dominant
- Performance: Test on iPhone 7 / Galaxy S7 (lower-end devices)

**Milestone:** Shippable demo with full games

---

### Phase 3: Progression & Content (Weeks 9-12)

**Goal:** Season mode, unlockables, achievements

**Deliverables:**
- Season mode: 20-game schedule, playoffs, championship
- Unlock system: Characters/stadiums unlocked by XP
- Achievement system (30 achievements)
- All 8 stadiums with unique modifiers
- Leaderboard integration (GameCenter/Google Play)
- Settings menu: difficulty, sound, controls customization
- Cloud save support

**Testing:**
- Beta testing with 20 external users
- Track unlock progression pacing
- Identify difficulty spikes in AI

**Milestone:** Feature-complete beta ready for App Store review

---

### Phase 4: Polish & Launch (Weeks 13-16)

**Goal:** App Store submission and launch

**Deliverables:**
- Visual polish: Character animations, particle effects
- Audio: Full soundtrack (3 music tracks), 50+ SFX, voice lines
- Localization: English, Spanish (initial)
- App Store assets: Icon, screenshots, promo video
- COPPA compliance review
- Bug fixes from beta feedback
- Performance optimization: <100MB install size, <5s load time

**Testing:**
- Final QA pass on 10 device models
- Load testing: 100 consecutive games without crash
- Accessibility: Test with VoiceOver/TalkBack

**Launch Checklist:**
- [ ] App Store Connect submission
- [ ] Google Play Console submission
- [ ] Press kit prepared
- [ ] Social media accounts created
- [ ] Launch trailer uploaded
- [ ] Support email configured

**Milestone:** Public release on iOS and Android

---

## Post-Launch Roadmap

### Version 1.1 (Month 2)
- **Multiplayer:** Local pass-and-play mode
- **New characters:** 3 additional secret unlocks
- **Balance patch:** Based on player data
- **Bug fixes**

### Version 1.2 (Month 4)
- **Online multiplayer:** Asynchronous turn-based games
- **New stadiums:** 2 additional venues
- **Cosmetic DLC:** First uniform pack
- **Replay system:** Save and share highlight clips

### Version 2.0 (Month 6)
- **Franchise mode:** Multi-season career with trades
- **Character creator:** Custom players with stat allocation
- **Tournament mode:** Bracket-style competitions
- **Major update marketing push**

---

## Accessibility Features

### Visual
- **High contrast mode:** Increase UI element visibility
- **Colorblind modes:** Deuteranopia, Protanopia, Tritanopia palettes
- **Text scaling:** 100%, 125%, 150% options
- **Ball trail:** Bright indicator showing pitch/hit trajectory

### Audio
- **Subtitles:** For all character voice lines
- **Audio cues:** Distinct sounds for strikes, balls, hits
- **Volume controls:** Separate sliders for music, SFX, voice
- **Haptic feedback:** Vibration on contact, outs, runs

### Controls
- **Button size scaling:** Adjust touch target sizes
- **Auto-run mode:** Baserunners advance automatically
- **Simplified pitching:** Remove gesture requirement, use buttons
- **Tutorial repeat:** Replay tutorial anytime from settings

---

## Performance Targets

### Device Compatibility
- **Minimum:** iOS 12 (iPhone 6s), Android 8.0 (2016 devices)
- **Recommended:** iOS 14+, Android 10+
- **Optimal:** iPhone 11+, Galaxy S10+

### Technical Benchmarks
| Metric | Target | Minimum Acceptable |
|--------|--------|-------------------|
| Framerate | 60 FPS | 30 FPS stable |
| Load time (cold start) | 3 seconds | 5 seconds |
| Install size | 80 MB | 150 MB |
| RAM usage | 200 MB | 350 MB |
| Battery drain (1 hour) | 10% | 15% |

### Network Requirements
- **Offline play:** Fully supported (core game)
- **Online features:** Leaderboards, multiplayer (optional)
- **Data usage:** <5 MB per season (cloud saves)

---

## Risk Mitigation

### IP Infringement Risk
**Mitigation:**
- Legal review of all character names/designs before launch
- Trademark search for "Sandlot Sluggers" (alternative names ready)
- No references to existing baseball franchises or players
- Original soundtrack with licensed music library

### Technical Risk: Performance on Low-End Devices
**Mitigation:**
- Quality settings: Low/Medium/High graphics presets
- Dynamic resolution scaling
- Object pooling for ball/character instances
- Profiling tools used continuously during development

### Market Risk: Monetization Acceptance
**Mitigation:**
- Premium model avoids predatory practices
- Demo version (free first 3 games) to reduce purchase friction
- No review-gating or pop-up prompts
- Transparent DLC pricing (cosmetic only)

### Scope Risk: Feature Creep
**Mitigation:**
- Strict MVP definition (Phases 1-4 only)
- Post-launch roadmap for additional features
- Weekly milestone reviews to prevent delays
- "Nice-to-have" features documented for Version 2.0

---

## Success Metrics

### Launch Goals (First Month)
- **Downloads:** 5,000 (organic + press coverage)
- **Retention:** 40% Day-7 retention
- **Revenue:** $15,000 gross (3,000 purchases @ $4.99)
- **Rating:** 4.5+ stars on App Store/Google Play
- **Reviews:** 100+ written reviews

### Year 1 Goals
- **Total downloads:** 50,000
- **Active players:** 10,000 monthly
- **Revenue:** $150,000 gross
- **DLC adoption:** 20% of players purchase cosmetics
- **Community:** 1,000 Discord/Reddit members

---

## Conclusion

**Sandlot Sluggers** is designed to capture the heart of classic backyard baseball games while respecting IP boundaries and optimizing for modern mobile platforms. By focusing on:

1. **Tight core mechanics** (batting, pitching, fielding)
2. **Original, memorable characters** with strategic depth
3. **Imaginative stadiums** that enhance replayability
4. **Premium monetization** that respects players
5. **Mobile-first UX** with accessibility built-in

...the game can succeed as both a nostalgic homage and a fresh experience for a new generation of players.

The phased development approach ensures a shippable MVP within 16 weeks, with clear post-launch content to maintain engagement. All technical architecture leverages Unity's strengths for mobile while maintaining performance targets even on older devices.

**Next Steps:**
1. Legal clearance for "Sandlot Sluggers" trademark
2. Unity project initialization with mobile build pipeline
3. Character artist commission for 5 starter characters
4. Prototype batting system (Week 1 deliverable)

This game will fill the void left by the absence of modern backyard baseball titles while building a foundation for future sports game development under the Blaze Sports Intelligence brand.
