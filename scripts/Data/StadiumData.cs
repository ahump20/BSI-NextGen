using UnityEngine;

namespace SandlotSluggers.Data
{
    /// <summary>
    /// ScriptableObject defining a stadium/field with gameplay modifiers and visual settings
    /// </summary>
    [CreateAssetMenu(fileName = "NewStadium", menuName = "Sandlot/Stadium", order = 3)]
    public class StadiumData : ScriptableObject
    {
        [Header("Identity")]
        public string StadiumName = "New Stadium";

        [TextArea(2, 4)]
        public string Description = "A classic backyard baseball field.";

        [Tooltip("Preview image for stadium selection")]
        public Sprite PreviewImage;

        [Tooltip("Stadium scene prefab")]
        public GameObject StadiumPrefab;

        [Header("Dimensions")]
        [Tooltip("Distance to left field fence (feet)")]
        [Range(100, 300)]
        public float LeftFieldDistance = 180f;

        [Tooltip("Distance to center field fence (feet)")]
        [Range(100, 300)]
        public float CenterFieldDistance = 200f;

        [Tooltip("Distance to right field fence (feet)")]
        [Range(100, 300)]
        public float RightFieldDistance = 180f;

        [Tooltip("Fence height (feet) - affects home run difficulty")]
        [Range(5, 30)]
        public float FenceHeight = 10f;

        [Header("Environmental Modifiers")]
        [Tooltip("Wind strength affecting fly balls (0 = none, 1 = strong)")]
        [Range(0f, 1f)]
        public float WindStrength = 0.1f;

        [Tooltip("Wind direction (degrees, 0 = toward home, 180 = toward center)")]
        [Range(0f, 360f)]
        public float WindDirection = 0f;

        [Tooltip("Does wind direction change each inning?")]
        public bool VariableWind = false;

        [Tooltip("Terrain quality (1 = rough/errors, 10 = perfect)")]
        [Range(1, 10)]
        public int TerrainQuality = 8;

        [Tooltip("Field wetness (0 = dry, 1 = wet/slow)")]
        [Range(0f, 1f)]
        public float FieldWetness = 0f;

        [Header("Special Features")]
        [Tooltip("Unique gameplay modifiers for this stadium")]
        public StadiumModifier[] SpecialModifiers;

        [Header("Unlock Requirements")]
        public UnlockCondition UnlockType = UnlockCondition.StarterCharacter;

        [Tooltip("Number of games needed to unlock (if applicable)")]
        public int UnlockValue = 0;

        [Header("Visuals")]
        public Color SkyColor = new Color(0.5f, 0.7f, 1f);
        public Color GrassColor = new Color(0.2f, 0.6f, 0.2f);

        [Tooltip("Time of day")]
        public TimeOfDay TimeOfDay = TimeOfDay.Afternoon;

        [Tooltip("Weather condition")]
        public WeatherCondition Weather = WeatherCondition.Clear;

        #region Calculated Properties

        /// <summary>
        /// Get wind as Vector2 (x, z direction)
        /// </summary>
        public Vector2 CurrentWindVector
        {
            get
            {
                float radians = WindDirection * Mathf.Deg2Rad;
                return new Vector2(
                    Mathf.Sin(radians) * WindStrength,
                    Mathf.Cos(radians) * WindStrength
                );
            }
        }

        /// <summary>
        /// Calculate fielding error chance based on terrain quality
        /// </summary>
        public float FieldingErrorChance
        {
            get
            {
                // Perfect terrain (10) = 0% error chance
                // Worst terrain (1) = 15% error chance
                return (10 - TerrainQuality) * 0.015f;
            }
        }

        /// <summary>
        /// Speed multiplier for baserunning (1.0 = normal, <1.0 = slower)
        /// </summary>
        public float BaserunningSpeedMultiplier
        {
            get
            {
                // Wet fields slow down baserunners
                return 1.0f - (FieldWetness * 0.2f);
            }
        }

        #endregion

        #region Collision Detection

        /// <summary>
        /// Check if ball position results in a specific outcome
        /// </summary>
        public HitResult CheckCollision(Vector3 ballPosition)
        {
            // Convert 3D position to field coordinates
            float distanceFromHome = new Vector2(ballPosition.x, ballPosition.z).magnitude;
            float angle = Mathf.Atan2(ballPosition.x, ballPosition.z) * Mathf.Rad2Deg;

            // Normalize angle to 0-180 (left field = 0, center = 90, right = 180)
            if (angle < 0) angle += 360;
            if (angle > 180) angle = 360 - angle;

            // Check foul territory (beyond 1st/3rd base lines)
            if (angle < 45 || angle > 135)
            {
                return Core.HitResult.Foul;
            }

            // Determine fence distance at this angle
            float fenceDistance = GetFenceDistanceAtAngle(angle);

            // Check if ball cleared fence
            if (distanceFromHome >= fenceDistance && ballPosition.y >= FenceHeight)
            {
                return Core.HitResult.HomeRun;
            }

            // Ball still in flight
            if (ballPosition.y > 1f)
            {
                return Core.HitResult.InFlight;
            }

            // Ball on ground - determine type based on trajectory
            if (ballPosition.y < 5f)
            {
                return Core.HitResult.GroundBall;
            }
            else if (ballPosition.y < 15f)
            {
                return Core.HitResult.LineDrive;
            }
            else
            {
                return Core.HitResult.FlyBall;
            }
        }

        /// <summary>
        /// Get fence distance at specific angle (interpolate between LF, CF, RF)
        /// </summary>
        private float GetFenceDistanceAtAngle(float angle)
        {
            // 0° = left field, 90° = center, 180° = right field
            if (angle <= 90)
            {
                // Interpolate between left and center
                float t = angle / 90f;
                return Mathf.Lerp(LeftFieldDistance, CenterFieldDistance, t);
            }
            else
            {
                // Interpolate between center and right
                float t = (angle - 90f) / 90f;
                return Mathf.Lerp(CenterFieldDistance, RightFieldDistance, t);
            }
        }

        #endregion

        #region Stadium Modifiers

        /// <summary>
        /// Apply all stadium modifiers at game start
        /// </summary>
        public void ApplyModifiers()
        {
            if (SpecialModifiers == null || SpecialModifiers.Length == 0)
                return;

            foreach (var modifier in SpecialModifiers)
            {
                modifier.Apply();
            }

            Debug.Log($"Applied {SpecialModifiers.Length} modifiers for {StadiumName}");
        }

        /// <summary>
        /// Refresh variable modifiers (called each inning if applicable)
        /// </summary>
        public void RefreshVariableModifiers()
        {
            if (VariableWind)
            {
                // Randomize wind direction
                WindDirection = Random.Range(0f, 360f);
                Debug.Log($"Wind direction changed to {WindDirection:F0}°");
            }
        }

        #endregion

        #region Validation

        private void OnValidate()
        {
            // Ensure name is set
            if (string.IsNullOrWhiteSpace(StadiumName))
                StadiumName = "Unnamed Stadium";

            // Validate dimensions are reasonable
            LeftFieldDistance = Mathf.Clamp(LeftFieldDistance, 100f, 300f);
            CenterFieldDistance = Mathf.Clamp(CenterFieldDistance, 100f, 300f);
            RightFieldDistance = Mathf.Clamp(RightFieldDistance, 100f, 300f);

            // Ensure center field is deepest (or equal)
            if (CenterFieldDistance < LeftFieldDistance || CenterFieldDistance < RightFieldDistance)
            {
                Debug.LogWarning($"{StadiumName}: Center field should be deepest part of stadium");
            }

            // Validate fence height
            FenceHeight = Mathf.Clamp(FenceHeight, 5f, 30f);
        }

        #endregion
    }

    #region Stadium Modifier System

    [System.Serializable]
    public class StadiumModifier
    {
        public string ModifierName;

        [TextArea(1, 3)]
        public string Description;

        public ModifierType Type;

        [Tooltip("Modifier strength (context-dependent)")]
        [Range(0f, 2f)]
        public float Strength = 1.0f;

        [Tooltip("Trigger condition (if applicable)")]
        public ModifierTrigger Trigger = ModifierTrigger.Always;

        public void Apply()
        {
            // Implementation depends on modifier type
            switch (Type)
            {
                case ModifierType.SpeedBoost:
                    Debug.Log($"Speed boost active: {Strength}x");
                    break;

                case ModifierType.HomeRunBonus:
                    Debug.Log($"Home run distance bonus: +{Strength * 10}%");
                    break;

                case ModifierType.FieldingPenalty:
                    Debug.Log($"Fielding difficulty increased: {Strength}x");
                    break;

                case ModifierType.PitchingBonus:
                    Debug.Log($"Pitching control bonus: +{Strength}");
                    break;
            }
        }
    }

    public enum ModifierType
    {
        SpeedBoost,         // Faster baserunning
        HomeRunBonus,       // Easier to hit home runs
        FieldingPenalty,    // More fielding errors
        PitchingBonus,      // Better pitch control
        BattingPenalty,     // Harder to make contact
        WindGust,           // Strong wind effects
        ObstacleCourse      // Special obstacles on field
    }

    public enum ModifierTrigger
    {
        Always,             // Active entire game
        RandomInning,       // Activates random inning
        After5thInning,     // Activates after 5th inning
        WhenWinning,        // Only when team is winning
        WhenLosing          // Only when team is losing
    }

    #endregion

    #region Enums

    public enum TimeOfDay
    {
        Morning,
        Afternoon,
        Evening,
        Night
    }

    public enum WeatherCondition
    {
        Clear,
        Cloudy,
        Rainy,
        Windy,
        Foggy
    }

    #endregion
}
