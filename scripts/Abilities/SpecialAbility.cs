using UnityEngine;
using SandlotSluggers.Data;

namespace SandlotSluggers.Abilities
{
    /// <summary>
    /// Base class for all special character abilities.
    /// Each ability can only be used once per game and provides a unique gameplay advantage.
    /// </summary>
    public abstract class SpecialAbility : ScriptableObject
    {
        [Header("Ability Info")]
        public string AbilityName = "New Ability";

        [TextArea(2, 4)]
        public string Description = "Describe what this ability does.";

        public Sprite Icon;

        [Tooltip("Ability category determines when it can be activated")]
        public AbilityType Type;

        [Header("Visual Effects")]
        public GameObject ActivationEffectPrefab;
        public AudioClip ActivationSound;
        public Color AbilityColor = Color.yellow;

        [Header("Balance")]
        [Tooltip("Duration in seconds (0 = instant effect)")]
        public float Duration = 0f;

        [Tooltip("Cooldown before ability can be used (typically 0 for one-use-per-game)")]
        public float Cooldown = 0f;

        /// <summary>
        /// Called when ability is activated by character
        /// </summary>
        /// <param name="character">Character using the ability</param>
        public void Activate(CharacterData character)
        {
            Debug.Log($"{character.CharacterName} activated {AbilityName}!");

            // Play visual and audio effects
            PlayActivationEffects(character);

            // Execute ability-specific logic
            OnActivate(character);

            // Mark as used
            character.AbilityUsedThisGame = true;
        }

        /// <summary>
        /// Deactivate ability (called after duration expires)
        /// </summary>
        public void Deactivate()
        {
            Debug.Log($"{AbilityName} deactivated");
            OnDeactivate();
        }

        /// <summary>
        /// Override this in derived classes to implement ability behavior
        /// </summary>
        protected abstract void OnActivate(CharacterData character);

        /// <summary>
        /// Override this in derived classes to clean up ability effects
        /// </summary>
        protected virtual void OnDeactivate()
        {
            // Default: no cleanup needed
        }

        /// <summary>
        /// Check if ability can be activated in current game state
        /// </summary>
        public virtual bool CanActivate(CharacterData character)
        {
            if (character.AbilityUsedThisGame)
            {
                Debug.LogWarning($"{character.CharacterName} has already used {AbilityName} this game");
                return false;
            }

            // Check if current game state matches ability type
            var currentState = Core.GameManager.Instance.CurrentState;

            switch (Type)
            {
                case AbilityType.Batting:
                    return currentState == Core.GameState.Batting;

                case AbilityType.Pitching:
                    return currentState == Core.GameState.Pitching;

                case AbilityType.Fielding:
                    return currentState == Core.GameState.Fielding;

                case AbilityType.Baserunning:
                    return currentState == Core.GameState.Baserunning;

                case AbilityType.Passive:
                    return true; // Passive abilities always available

                default:
                    return false;
            }
        }

        private void PlayActivationEffects(CharacterData character)
        {
            // Spawn visual effect
            if (ActivationEffectPrefab != null)
            {
                GameObject effect = Instantiate(ActivationEffectPrefab, Vector3.zero, Quaternion.identity);
                Destroy(effect, 3f);
            }

            // Play sound
            if (ActivationSound != null)
            {
                Core.AudioManager.Instance?.PlaySFX(ActivationSound);
            }

            // Show UI notification
            UI.UIManager.Instance?.ShowAbilityActivation(AbilityName, Icon, AbilityColor);

            // Play character voice line
            AudioClip voiceLine = character.GetVoiceLineForEvent(Data.VoiceLineEvent.AbilityActivate);
            if (voiceLine != null)
            {
                Core.AudioManager.Instance?.PlayVoiceLine(voiceLine);
            }
        }
    }

    public enum AbilityType
    {
        Batting,        // Activates during batting phase
        Pitching,       // Activates during pitching phase
        Fielding,       // Activates during fielding phase
        Baserunning,    // Activates during baserunning
        Passive         // Always active (no activation needed)
    }
}
