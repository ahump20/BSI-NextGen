using UnityEngine;
using SandlotSluggers.Data;
using SandlotSluggers.Gameplay;

namespace SandlotSluggers.Abilities
{
    /// <summary>
    /// Rocket Boost: Doubles bat speed for one swing, dramatically increasing power
    /// Used by: Casey "Slugger" Martinez
    /// </summary>
    [CreateAssetMenu(fileName = "RocketBoost", menuName = "Sandlot/Abilities/Rocket Boost")]
    public class RocketBoostAbility : SpecialAbility
    {
        [Header("Rocket Boost Settings")]
        [Tooltip("Power multiplier for the boosted swing")]
        [Range(1.5f, 3f)]
        public float PowerMultiplier = 2.0f;

        private BattingSystem battingSystem;
        private bool isActive = false;

        protected override void OnActivate(CharacterData character)
        {
            battingSystem = BattingSystem.Instance;

            if (battingSystem == null)
            {
                Debug.LogError("BattingSystem not found! Cannot activate Rocket Boost.");
                return;
            }

            // Apply power boost
            battingSystem.PowerMultiplier *= PowerMultiplier;
            isActive = true;

            // Subscribe to swing event to deactivate after use
            battingSystem.OnSwingComplete += OnSwingCompleted;

            // Visual effects
            battingSystem.ShowBatTrailEffect(AbilityColor);
            Debug.Log($"Rocket Boost activated! Power: {PowerMultiplier}x");
        }

        protected override void OnDeactivate()
        {
            if (battingSystem != null && isActive)
            {
                // Remove power boost
                battingSystem.PowerMultiplier /= PowerMultiplier;
                battingSystem.HideBatTrailEffect();

                // Unsubscribe from events
                battingSystem.OnSwingComplete -= OnSwingCompleted;

                isActive = false;
                Debug.Log("Rocket Boost ended");
            }
        }

        private void OnSwingCompleted()
        {
            // Deactivate after one swing
            Deactivate();
        }
    }
}
