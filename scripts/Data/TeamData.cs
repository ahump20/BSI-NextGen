using System.Collections.Generic;
using UnityEngine;

namespace SandlotSluggers.Data
{
    /// <summary>
    /// ScriptableObject representing a team of 9 characters with lineup order
    /// </summary>
    [CreateAssetMenu(fileName = "NewTeam", menuName = "Sandlot/Team", order = 2)]
    public class TeamData : ScriptableObject
    {
        [Header("Team Identity")]
        public string TeamName = "New Team";

        [Tooltip("Team logo/emblem")]
        public Sprite TeamLogo;

        [Tooltip("Primary team color")]
        public Color PrimaryColor = Color.blue;

        [Tooltip("Secondary team color")]
        public Color SecondaryColor = Color.white;

        [Header("Lineup (9 Players)")]
        [Tooltip("Batting order (1st batter to 9th batter)")]
        [SerializeField]
        private List<CharacterData> lineup = new List<CharacterData>(9);

        [Header("Pitching Rotation")]
        [Tooltip("Starting pitcher for the game")]
        public CharacterData CurrentPitcher;

        [Tooltip("Available relief pitchers")]
        public List<CharacterData> ReliefPitchers = new List<CharacterData>();

        [Header("Team Stats")]
        [Tooltip("Is this a user-controlled team or AI team?")]
        public bool IsPlayerTeam = true;

        [Tooltip("AI difficulty if computer-controlled (0-10)")]
        [Range(0, 10)]
        public int AIDifficulty = 5;

        #region Properties

        public int LineupSize => lineup.Count;

        public List<CharacterData> Lineup => new List<CharacterData>(lineup);

        /// <summary>
        /// Calculate team overall rating (average of all player ratings)
        /// </summary>
        public int TeamOverallRating
        {
            get
            {
                if (lineup.Count == 0)
                    return 0;

                int total = 0;
                foreach (var player in lineup)
                {
                    if (player != null)
                        total += player.OverallRating;
                }

                return total / lineup.Count;
            }
        }

        #endregion

        #region Methods

        /// <summary>
        /// Get batter at specific position in lineup (0-8)
        /// </summary>
        public CharacterData GetBatterAtIndex(int index)
        {
            if (index < 0 || index >= lineup.Count)
            {
                Debug.LogError($"Invalid lineup index: {index}");
                return null;
            }

            return lineup[index];
        }

        /// <summary>
        /// Set batter at specific position in lineup
        /// </summary>
        public void SetBatterAtIndex(int index, CharacterData character)
        {
            if (index < 0 || index >= 9)
            {
                Debug.LogError($"Invalid lineup index: {index}. Must be 0-8.");
                return;
            }

            // Expand lineup if needed
            while (lineup.Count < 9)
            {
                lineup.Add(null);
            }

            lineup[index] = character;
        }

        /// <summary>
        /// Add character to first available lineup slot
        /// </summary>
        public bool AddToLineup(CharacterData character)
        {
            if (lineup.Count >= 9)
            {
                Debug.LogWarning("Lineup is full (9 players max)");
                return false;
            }

            if (lineup.Contains(character))
            {
                Debug.LogWarning($"{character.CharacterName} is already in the lineup");
                return false;
            }

            lineup.Add(character);
            return true;
        }

        /// <summary>
        /// Remove character from lineup
        /// </summary>
        public bool RemoveFromLineup(CharacterData character)
        {
            return lineup.Remove(character);
        }

        /// <summary>
        /// Clear entire lineup
        /// </summary>
        public void ClearLineup()
        {
            lineup.Clear();
        }

        /// <summary>
        /// Validate lineup has 9 unique characters
        /// </summary>
        public bool IsLineupValid()
        {
            if (lineup.Count != 9)
            {
                Debug.LogWarning($"Lineup must have exactly 9 players. Current: {lineup.Count}");
                return false;
            }

            // Check for nulls
            foreach (var player in lineup)
            {
                if (player == null)
                {
                    Debug.LogWarning("Lineup contains null player");
                    return false;
                }
            }

            // Check for duplicates
            HashSet<CharacterData> uniquePlayers = new HashSet<CharacterData>(lineup);
            if (uniquePlayers.Count != lineup.Count)
            {
                Debug.LogWarning("Lineup contains duplicate players");
                return false;
            }

            // Check pitcher is set
            if (CurrentPitcher == null)
            {
                Debug.LogWarning("No pitcher assigned");
                return false;
            }

            return true;
        }

        /// <summary>
        /// Auto-fill lineup with recommended batting order based on stats
        /// </summary>
        public void AutoGenerateLineup(List<CharacterData> availableCharacters)
        {
            if (availableCharacters == null || availableCharacters.Count < 9)
            {
                Debug.LogError("Need at least 9 characters to generate lineup");
                return;
            }

            ClearLineup();

            // Sort by overall rating
            List<CharacterData> sorted = new List<CharacterData>(availableCharacters);
            sorted.Sort((a, b) => b.OverallRating.CompareTo(a.OverallRating));

            // Traditional lineup construction:
            // 1. High contact leadoff hitter
            // 2. Contact + speed (table setter)
            // 3-5. Power hitters (heart of order)
            // 6-7. Balanced hitters
            // 8-9. Weakest hitters (traditionally pitcher spot)

            // Find best leadoff (high contact + speed)
            CharacterData leadoff = sorted.Find(c => c.SpeedStat >= 7 && c.ContactStat >= 7);
            if (leadoff == null) leadoff = sorted[0];
            lineup.Add(leadoff);
            sorted.Remove(leadoff);

            // Find best power hitters for 3-5
            List<CharacterData> powerHitters = sorted.FindAll(c => c.PowerStat >= 7);
            powerHitters.Sort((a, b) => b.PowerStat.CompareTo(a.PowerStat));

            // 2nd: Contact hitter
            CharacterData two = sorted.Find(c => c.ContactStat >= 7);
            if (two == null) two = sorted[0];
            lineup.Add(two);
            sorted.Remove(two);

            // 3rd-5th: Power hitters
            for (int i = 0; i < 3 && powerHitters.Count > 0; i++)
            {
                lineup.Add(powerHitters[0]);
                sorted.Remove(powerHitters[0]);
                powerHitters.RemoveAt(0);
            }

            // Fill remaining with best available
            while (lineup.Count < 9 && sorted.Count > 0)
            {
                lineup.Add(sorted[0]);
                sorted.RemoveAt(0);
            }

            // Set best pitcher
            List<CharacterData> pitchers = new List<CharacterData>(lineup);
            pitchers.Sort((a, b) => b.PitchingStat.CompareTo(a.PitchingStat));
            CurrentPitcher = pitchers[0];

            Debug.Log($"Auto-generated lineup for {TeamName}");
        }

        /// <summary>
        /// Swap two players in lineup
        /// </summary>
        public void SwapLineupPositions(int index1, int index2)
        {
            if (index1 < 0 || index1 >= lineup.Count || index2 < 0 || index2 >= lineup.Count)
            {
                Debug.LogError("Invalid lineup indices for swap");
                return;
            }

            CharacterData temp = lineup[index1];
            lineup[index1] = lineup[index2];
            lineup[index2] = temp;
        }

        /// <summary>
        /// Reset all character abilities for new game
        /// </summary>
        public void ResetAllAbilities()
        {
            foreach (var player in lineup)
            {
                if (player != null)
                {
                    player.ResetAbility();
                }
            }

            if (CurrentPitcher != null)
            {
                CurrentPitcher.ResetAbility();
            }

            foreach (var pitcher in ReliefPitchers)
            {
                if (pitcher != null)
                {
                    pitcher.ResetAbility();
                }
            }
        }

        /// <summary>
        /// Change pitcher (e.g., when fatigued)
        /// </summary>
        public bool ChangePitcher(CharacterData newPitcher)
        {
            if (newPitcher == null)
            {
                Debug.LogError("Cannot change to null pitcher");
                return false;
            }

            if (!lineup.Contains(newPitcher) && !ReliefPitchers.Contains(newPitcher))
            {
                Debug.LogError($"{newPitcher.CharacterName} is not on this team");
                return false;
            }

            CurrentPitcher = newPitcher;
            Debug.Log($"Pitcher changed to {newPitcher.CharacterName}");
            return true;
        }

        #endregion

        #region Validation

        private void OnValidate()
        {
            // Ensure team name is set
            if (string.IsNullOrWhiteSpace(TeamName))
                TeamName = "Unnamed Team";

            // Ensure lineup doesn't exceed 9
            while (lineup.Count > 9)
            {
                lineup.RemoveAt(lineup.Count - 1);
            }

            // Check for duplicate players
            HashSet<CharacterData> seen = new HashSet<CharacterData>();
            for (int i = lineup.Count - 1; i >= 0; i--)
            {
                if (lineup[i] == null)
                    continue;

                if (seen.Contains(lineup[i]))
                {
                    Debug.LogWarning($"Duplicate player detected: {lineup[i].CharacterName}. Removing...");
                    lineup.RemoveAt(i);
                }
                else
                {
                    seen.Add(lineup[i]);
                }
            }

            // Validate pitcher is in lineup or relief pitchers
            if (CurrentPitcher != null)
            {
                if (!lineup.Contains(CurrentPitcher) && !ReliefPitchers.Contains(CurrentPitcher))
                {
                    Debug.LogWarning($"Current pitcher {CurrentPitcher.CharacterName} is not in lineup or relief pitchers");
                }
            }
        }

        #endregion

        #region Editor Helpers

        [ContextMenu("Auto-Fill Demo Lineup")]
        private void AutoFillDemoLineup()
        {
            // For editor testing - would need actual character assets
            Debug.Log("Load characters from Resources/Characters folder and call AutoGenerateLineup()");
        }

        [ContextMenu("Print Lineup")]
        private void PrintLineup()
        {
            Debug.Log($"=== {TeamName} Lineup ===");
            for (int i = 0; i < lineup.Count; i++)
            {
                if (lineup[i] != null)
                {
                    Debug.Log($"{i + 1}. {lineup[i].CharacterName} ({lineup[i].Nickname}) - Overall: {lineup[i].OverallRating}");
                }
                else
                {
                    Debug.Log($"{i + 1}. [Empty]");
                }
            }
            Debug.Log($"Pitcher: {(CurrentPitcher != null ? CurrentPitcher.CharacterName : "[None]")}");
            Debug.Log($"Team Overall: {TeamOverallRating}");
        }

        #endregion
    }
}
