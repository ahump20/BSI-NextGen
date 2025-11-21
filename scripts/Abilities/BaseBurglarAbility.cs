using UnityEngine;
using SandlotSluggers.Data;
using SandlotSluggers.Core;

namespace SandlotSluggers.Abilities
{
    /// <summary>
    /// Base Burglar: Guarantees successful stolen base
    /// Used by: Riley "Wheels" Thompson
    /// </summary>
    [CreateAssetMenu(fileName = "BaseBurglar", menuName = "Sandlot/Abilities/Base Burglar")]
    public class BaseBurglarAbility : SpecialAbility
    {
        protected override void OnActivate(CharacterData character)
        {
            // Find which base the character is on
            int currentBase = FindCharacterBase(character);

            if (currentBase < 0)
            {
                Debug.LogWarning($"{character.CharacterName} is not on base. Cannot steal.");
                return;
            }

            // Trigger guaranteed steal animation
            StartStealSequence(character, currentBase);
        }

        private int FindCharacterBase(CharacterData character)
        {
            var bases = GameManager.Instance.BasesOccupied;

            for (int i = 0; i < bases.Length; i++)
            {
                if (bases[i] == character)
                {
                    return i; // 0 = 1st, 1 = 2nd, 2 = 3rd
                }
            }

            return -1; // Not on base
        }

        private void StartStealSequence(CharacterData runner, int fromBase)
        {
            int toBase = fromBase + 1;

            // Prevent stealing home for balance
            if (toBase >= 3)
            {
                Debug.LogWarning("Cannot steal home with Base Burglar");
                return;
            }

            // Clear current base
            GameManager.Instance.BasesOccupied[fromBase] = null;

            // Move to next base
            GameManager.Instance.BasesOccupied[toBase] = runner;

            // Trigger animations and sounds
            UI.UIManager.Instance?.ShowStealSuccess(runner, toBase + 1);
            AudioManager.Instance?.PlaySFX("StolenBase");

            // Visual effect - speed trail
            ShowSpeedTrailEffect(runner);

            Debug.Log($"{runner.CharacterName} successfully stole {GetBaseName(toBase + 1)}!");
        }

        private void ShowSpeedTrailEffect(CharacterData runner)
        {
            // Create speed trail particle effect
            // Implementation depends on visual system
            Debug.Log($"Speed trail effect for {runner.CharacterName}");
        }

        private string GetBaseName(int baseNumber)
        {
            switch (baseNumber)
            {
                case 1: return "1st base";
                case 2: return "2nd base";
                case 3: return "3rd base";
                case 4: return "home";
                default: return "unknown base";
            }
        }
    }
}
