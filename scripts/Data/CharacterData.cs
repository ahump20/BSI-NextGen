using System.Collections.Generic;
using UnityEngine;

namespace SandlotSluggers.Data
{
    /// <summary>
    /// ScriptableObject defining a playable character with stats, abilities, and progression.
    /// Create instances via Assets > Create > Sandlot > Character
    /// </summary>
    [CreateAssetMenu(fileName = "NewCharacter", menuName = "Sandlot/Character", order = 1)]
    public class CharacterData : ScriptableObject
    {
        [Header("Identity")]
        [Tooltip("Character's full name (e.g., 'Casey Martinez')")]
        public string CharacterName = "New Character";

        [Tooltip("Nickname displayed in-game (e.g., 'Slugger')")]
        public string Nickname = "Rookie";

        [Tooltip("Character age (8-13)")]
        [Range(8, 13)]
        public int Age = 10;

        [Tooltip("Portrait image for UI")]
        public Sprite Portrait;

        [Tooltip("3D model prefab for in-game representation")]
        public GameObject ModelPrefab;

        [Header("Stats (1-10 scale)")]
        [Tooltip("Power: Home run potential and hit distance")]
        [Range(1, 10)]
        public int PowerStat = 5;

        [Tooltip("Contact: Batting average and swing accuracy")]
        [Range(1, 10)]
        public int ContactStat = 5;

        [Tooltip("Speed: Base running and fielding range")]
        [Range(1, 10)]
        public int SpeedStat = 5;

        [Tooltip("Fielding: Catch success rate and throw accuracy")]
        [Range(1, 10)]
        public int FieldingStat = 5;

        [Tooltip("Pitching: Pitch control and velocity")]
        [Range(1, 10)]
        public int PitchingStat = 5;

        [Header("Special Ability")]
        [Tooltip("Unique ability usable once per game")]
        public SpecialAbility Ability;

        [HideInInspector]
        public bool AbilityUsedThisGame = false;

        [Header("Personality & Lore")]
        [Tooltip("Character backstory and personality description")]
        [TextArea(3, 6)]
        public string Backstory = "Write character backstory here...";

        [Tooltip("Personality trait keywords (e.g., 'Confident', 'Clumsy', 'Strategic')")]
        public List<string> PersonalityTraits = new List<string> { "Determined" };

        [Header("Audio")]
        [Tooltip("Voice lines for game events")]
        public List<VoiceLine> VoiceLines = new List<VoiceLine>();

        [Header("Unlock Requirements")]
        public UnlockCondition UnlockType = UnlockCondition.StarterCharacter;

        [Tooltip("Value required for unlock (e.g., number of games won)")]
        public int UnlockValue = 0;

        [Tooltip("Achievement ID required for unlock (if applicable)")]
        public string RequiredAchievementID = "";

        [Header("Visual Customization")]
        public Color PrimaryColor = Color.red;
        public Color SecondaryColor = Color.white;

        #region Methods

        /// <summary>
        /// Calculate overall rating (1-100 scale) based on all stats
        /// </summary>
        public int OverallRating
        {
            get
            {
                float average = (PowerStat + ContactStat + SpeedStat + FieldingStat + PitchingStat) / 5f;
                return Mathf.RoundToInt(average * 10f);
            }
        }

        /// <summary>
        /// Reset ability for new game
        /// </summary>
        public void ResetAbility()
        {
            AbilityUsedThisGame = false;
        }

        /// <summary>
        /// Check if ability can be activated
        /// </summary>
        public bool CanUseAbility()
        {
            return !AbilityUsedThisGame && Ability != null;
        }

        /// <summary>
        /// Activate special ability (returns false if already used)
        /// </summary>
        public bool ActivateAbility()
        {
            if (!CanUseAbility())
            {
                Debug.LogWarning($"{CharacterName} ability already used this game");
                return false;
            }

            Ability.Activate(this);
            AbilityUsedThisGame = true;
            return true;
        }

        /// <summary>
        /// Get random voice line for specific event
        /// </summary>
        public AudioClip GetVoiceLineForEvent(VoiceLineEvent eventType)
        {
            List<VoiceLine> matchingLines = VoiceLines.FindAll(line => line.Event == eventType);
            if (matchingLines.Count == 0)
                return null;

            return matchingLines[Random.Range(0, matchingLines.Count)].AudioClip;
        }

        /// <summary>
        /// Get subtitle text for specific event
        /// </summary>
        public string GetSubtitleForEvent(VoiceLineEvent eventType)
        {
            List<VoiceLine> matchingLines = VoiceLines.FindAll(line => line.Event == eventType);
            if (matchingLines.Count == 0)
                return "";

            return matchingLines[Random.Range(0, matchingLines.Count)].SubtitleText;
        }

        /// <summary>
        /// Validate character data (called in Unity Editor)
        /// </summary>
        private void OnValidate()
        {
            // Ensure name is not empty
            if (string.IsNullOrWhiteSpace(CharacterName))
                CharacterName = "Unnamed Character";

            // Ensure nickname is set
            if (string.IsNullOrWhiteSpace(Nickname))
                Nickname = CharacterName.Split(' ')[0]; // Use first name as default

            // Validate stats are within bounds
            PowerStat = Mathf.Clamp(PowerStat, 1, 10);
            ContactStat = Mathf.Clamp(ContactStat, 1, 10);
            SpeedStat = Mathf.Clamp(SpeedStat, 1, 10);
            FieldingStat = Mathf.Clamp(FieldingStat, 1, 10);
            PitchingStat = Mathf.Clamp(PitchingStat, 1, 10);

            // Warn if no portrait
            if (Portrait == null)
                Debug.LogWarning($"Character '{CharacterName}' has no portrait assigned");

            // Warn if no model
            if (ModelPrefab == null)
                Debug.LogWarning($"Character '{CharacterName}' has no model prefab assigned");
        }

        #endregion

        #region Stat Modifiers (for abilities)

        private Dictionary<string, StatModifier> activeModifiers = new Dictionary<string, StatModifier>();

        /// <summary>
        /// Apply temporary stat modifier
        /// </summary>
        public void AddStatModifier(string modifierID, StatType stat, float multiplier, float duration)
        {
            StatModifier modifier = new StatModifier
            {
                Stat = stat,
                Multiplier = multiplier,
                EndTime = Time.time + duration
            };

            activeModifiers[modifierID] = modifier;
        }

        /// <summary>
        /// Remove stat modifier
        /// </summary>
        public void RemoveStatModifier(string modifierID)
        {
            activeModifiers.Remove(modifierID);
        }

        /// <summary>
        /// Get modified stat value
        /// </summary>
        public float GetModifiedStat(StatType stat)
        {
            float baseValue = GetBaseStat(stat);
            float multiplier = 1.0f;

            // Remove expired modifiers
            List<string> expiredKeys = new List<string>();
            foreach (var kvp in activeModifiers)
            {
                if (Time.time > kvp.Value.EndTime)
                {
                    expiredKeys.Add(kvp.Key);
                }
                else if (kvp.Value.Stat == stat)
                {
                    multiplier *= kvp.Value.Multiplier;
                }
            }

            foreach (string key in expiredKeys)
            {
                activeModifiers.Remove(key);
            }

            return baseValue * multiplier;
        }

        private float GetBaseStat(StatType stat)
        {
            switch (stat)
            {
                case StatType.Power: return PowerStat;
                case StatType.Contact: return ContactStat;
                case StatType.Speed: return SpeedStat;
                case StatType.Fielding: return FieldingStat;
                case StatType.Pitching: return PitchingStat;
                default: return 0;
            }
        }

        #endregion
    }

    #region Supporting Classes

    [System.Serializable]
    public class VoiceLine
    {
        public VoiceLineEvent Event;
        public AudioClip AudioClip;
        [TextArea(1, 3)]
        public string SubtitleText;
    }

    public enum VoiceLineEvent
    {
        GameStart,
        BattingUp,
        HomeRun,
        Strike,
        Hit,
        Out,
        Win,
        Loss,
        AbilityActivate,
        Taunt,
        Encourage
    }

    [System.Serializable]
    public class StatModifier
    {
        public StatType Stat;
        public float Multiplier; // 1.0 = no change, 2.0 = double, 0.5 = half
        public float EndTime; // Time.time when modifier expires
    }

    public enum StatType
    {
        Power,
        Contact,
        Speed,
        Fielding,
        Pitching
    }

    public enum UnlockCondition
    {
        StarterCharacter,      // Available from start
        WinGames,              // Unlock after X wins
        CompleteAchievement,   // Unlock by completing specific achievement
        WinChampionship,       // Unlock by winning season
        SecretUnlock           // Special hidden unlock condition
    }

    #endregion
}
