using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace SandlotSluggers.Core
{
    /// <summary>
    /// Central singleton managing all game state and flow.
    /// Handles inning progression, scoring, team management, and state transitions.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        #region Singleton
        public static GameManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        #endregion

        #region Game State
        public GameState CurrentState { get; private set; }
        public int CurrentInning { get; private set; }
        public bool IsTopInning { get; private set; }
        public int HomeScore { get; private set; }
        public int AwayScore { get; private set; }
        public int Outs { get; private set; }
        public int Balls { get; private set; }
        public int Strikes { get; private set; }

        // Base runners (index 0 = 1st, 1 = 2nd, 2 = 3rd)
        public CharacterData[] BasesOccupied { get; private set; } = new CharacterData[3];
        #endregion

        #region Teams & Characters
        public TeamData HomeTeam { get; private set; }
        public TeamData AwayTeam { get; private set; }
        public StadiumData CurrentStadium { get; private set; }

        private int homeBattingOrder = 0;
        private int awayBattingOrder = 0;

        public CharacterData CurrentBatter
        {
            get
            {
                if (IsTopInning)
                    return AwayTeam.GetBatterAtIndex(awayBattingOrder);
                else
                    return HomeTeam.GetBatterAtIndex(homeBattingOrder);
            }
        }

        public CharacterData CurrentPitcher
        {
            get
            {
                if (IsTopInning)
                    return HomeTeam.CurrentPitcher;
                else
                    return AwayTeam.CurrentPitcher;
            }
        }
        #endregion

        #region Game Statistics
        public GameStats Statistics { get; private set; }
        #endregion

        #region Events
        public event Action<GameState> OnStateChanged;
        public event Action<int, bool> OnInningChanged; // inning number, isTop
        public event Action<int, int> OnScoreChanged; // home, away
        public event Action<int> OnOutRecorded; // total outs
        public event Action<int, int> OnCountChanged; // balls, strikes
        public event Action<CharacterData, int> OnRunnerAdvanced; // runner, base (1-4, 4=home)
        public event Action<HitResult, Vector3> OnBallResult;
        public event Action<TeamData> OnGameEnded; // winning team
        #endregion

        #region Initialization
        private void Initialize()
        {
            Statistics = new GameStats();
        }

        public void StartGame(TeamData home, TeamData away, StadiumData stadium)
        {
            if (home == null || away == null || stadium == null)
            {
                Debug.LogError("Cannot start game with null teams or stadium");
                return;
            }

            HomeTeam = home;
            AwayTeam = away;
            CurrentStadium = stadium;

            CurrentInning = 1;
            IsTopInning = true;
            HomeScore = 0;
            AwayScore = 0;
            Outs = 0;
            Balls = 0;
            Strikes = 0;

            homeBattingOrder = 0;
            awayBattingOrder = 0;

            Array.Clear(BasesOccupied, 0, BasesOccupied.Length);

            Statistics.Reset();
            home.ResetAllAbilities();
            away.ResetAllAbilities();

            ChangeState(GameState.InningStart);

            Debug.Log($"Game started: {away.TeamName} @ {home.TeamName} at {stadium.StadiumName}");
        }
        #endregion

        #region State Management
        public void ChangeState(GameState newState)
        {
            if (CurrentState == newState)
                return;

            Debug.Log($"State change: {CurrentState} → {newState}");
            CurrentState = newState;
            OnStateChanged?.Invoke(newState);

            HandleStateEntry(newState);
        }

        private void HandleStateEntry(GameState state)
        {
            switch (state)
            {
                case GameState.InningStart:
                    StartCoroutine(InningStartSequence());
                    break;

                case GameState.Pitching:
                    ResetCount();
                    PitchingSystem.Instance?.BeginPitchSequence(CurrentPitcher, CurrentBatter);
                    break;

                case GameState.Batting:
                    BattingSystem.Instance?.EnableBatting(CurrentBatter);
                    break;

                case GameState.Fielding:
                    FieldingSystem.Instance?.StartFieldingSequence();
                    break;

                case GameState.InningEnd:
                    StartCoroutine(InningEndSequence());
                    break;

                case GameState.GameOver:
                    EndGame();
                    break;
            }
        }
        #endregion

        #region Inning Management
        private IEnumerator InningStartSequence()
        {
            OnInningChanged?.Invoke(CurrentInning, IsTopInning);
            UIManager.Instance?.ShowInningTransition(CurrentInning, IsTopInning);

            yield return new WaitForSeconds(2.0f);

            ChangeState(GameState.Pitching);
        }

        private IEnumerator InningEndSequence()
        {
            UIManager.Instance?.ShowInningComplete(CurrentInning, IsTopInning, HomeScore, AwayScore);

            yield return new WaitForSeconds(1.5f);

            ChangeSides();
        }

        private void ChangeSides()
        {
            Outs = 0;
            Balls = 0;
            Strikes = 0;
            Array.Clear(BasesOccupied, 0, BasesOccupied.Length);

            if (IsTopInning)
            {
                // Switch to bottom of inning
                IsTopInning = false;
                ChangeState(GameState.InningStart);
            }
            else
            {
                // Move to next inning
                CurrentInning++;
                IsTopInning = true;

                // Check if game is over (9+ innings and not tied)
                if (CurrentInning > 9)
                {
                    if (HomeScore != AwayScore)
                    {
                        ChangeState(GameState.GameOver);
                        return;
                    }
                    // Extra innings - continue
                }

                ChangeState(GameState.InningStart);
            }
        }
        #endregion

        #region Count Management
        private void ResetCount()
        {
            Balls = 0;
            Strikes = 0;
            OnCountChanged?.Invoke(Balls, Strikes);
        }

        public void RecordBall()
        {
            Balls++;
            OnCountChanged?.Invoke(Balls, Strikes);

            if (Balls >= 4)
            {
                // Walk
                RecordWalk();
            }
        }

        public void RecordStrike()
        {
            Strikes++;
            OnCountChanged?.Invoke(Balls, Strikes);

            if (Strikes >= 3)
            {
                // Strikeout
                RecordOut(OutType.Strikeout);
                Statistics.RecordStrikeout(CurrentBatter, CurrentPitcher);
            }
        }

        public void RecordFoul()
        {
            // Foul balls count as strikes unless already at 2 strikes
            if (Strikes < 2)
            {
                RecordStrike();
            }
            AudioManager.Instance?.PlaySFX("FoulBall");
        }
        #endregion

        #region Out Management
        public void RecordOut(OutType outType = OutType.Generic)
        {
            Outs++;
            OnOutRecorded?.Invoke(Outs);

            Statistics.RecordOut(outType);

            Debug.Log($"Out recorded: {outType}. Total outs: {Outs}");

            if (Outs >= 3)
            {
                ChangeState(GameState.InningEnd);
            }
            else
            {
                AdvanceBattingOrder();
                ChangeState(GameState.Pitching);
            }
        }

        private void AdvanceBattingOrder()
        {
            if (IsTopInning)
            {
                awayBattingOrder = (awayBattingOrder + 1) % AwayTeam.LineupSize;
            }
            else
            {
                homeBattingOrder = (homeBattingOrder + 1) % HomeTeam.LineupSize;
            }
        }
        #endregion

        #region Hit & Base Running
        public void RecordHit(HitType hitType, Vector3 landingPosition)
        {
            Statistics.RecordHit(CurrentBatter, hitType);

            switch (hitType)
            {
                case HitType.Single:
                    AdvanceRunners(1);
                    PlaceRunnerOnBase(CurrentBatter, 0);
                    break;

                case HitType.Double:
                    AdvanceRunners(2);
                    PlaceRunnerOnBase(CurrentBatter, 1);
                    break;

                case HitType.Triple:
                    AdvanceRunners(3);
                    PlaceRunnerOnBase(CurrentBatter, 2);
                    break;

                case HitType.HomeRun:
                    int rbis = CountRunnersOnBase() + 1;
                    ScoreRuns(rbis);
                    ClearBases();
                    AudioManager.Instance?.PlaySFX("HomeRun");
                    UIManager.Instance?.ShowHomeRunEffect();
                    break;

                case HitType.Groundout:
                    RecordOut(OutType.Groundout);
                    return;

                case HitType.Flyout:
                    RecordOut(OutType.Flyout);
                    return;
            }

            AdvanceBattingOrder();
            ChangeState(GameState.Pitching);
        }

        private void RecordWalk()
        {
            Statistics.RecordWalk(CurrentBatter, CurrentPitcher);

            // Force advance runners if bases loaded
            if (BasesOccupied[0] != null)
            {
                if (BasesOccupied[1] != null)
                {
                    if (BasesOccupied[2] != null)
                    {
                        // Bases loaded - score a run
                        ScoreRuns(1);
                    }
                    BasesOccupied[2] = BasesOccupied[1];
                }
                BasesOccupied[1] = BasesOccupied[0];
            }

            PlaceRunnerOnBase(CurrentBatter, 0);
            AdvanceBattingOrder();
            ChangeState(GameState.Pitching);
        }

        private void PlaceRunnerOnBase(CharacterData runner, int baseIndex)
        {
            if (baseIndex < 0 || baseIndex > 2)
            {
                Debug.LogError($"Invalid base index: {baseIndex}");
                return;
            }

            BasesOccupied[baseIndex] = runner;
            OnRunnerAdvanced?.Invoke(runner, baseIndex + 1);
        }

        private void AdvanceRunners(int bases)
        {
            // Advance from 3rd to home
            if (BasesOccupied[2] != null && bases >= 1)
            {
                ScoreRuns(1);
                Statistics.RecordRBI(CurrentBatter);
                BasesOccupied[2] = null;
            }

            // Advance from 2nd
            if (BasesOccupied[1] != null)
            {
                if (bases >= 2)
                {
                    ScoreRuns(1);
                    Statistics.RecordRBI(CurrentBatter);
                    BasesOccupied[1] = null;
                }
                else if (bases == 1)
                {
                    BasesOccupied[2] = BasesOccupied[1];
                    BasesOccupied[1] = null;
                }
            }

            // Advance from 1st
            if (BasesOccupied[0] != null)
            {
                if (bases >= 3)
                {
                    ScoreRuns(1);
                    Statistics.RecordRBI(CurrentBatter);
                    BasesOccupied[0] = null;
                }
                else if (bases == 2)
                {
                    BasesOccupied[2] = BasesOccupied[0];
                    BasesOccupied[0] = null;
                }
                else if (bases == 1)
                {
                    BasesOccupied[1] = BasesOccupied[0];
                    BasesOccupied[0] = null;
                }
            }
        }

        private void ScoreRuns(int runs)
        {
            if (IsTopInning)
            {
                AwayScore += runs;
            }
            else
            {
                HomeScore += runs;
            }

            OnScoreChanged?.Invoke(HomeScore, AwayScore);
            Statistics.RecordRuns(runs);

            Debug.Log($"Runs scored: {runs}. Score: {AwayScore}-{HomeScore}");
        }

        private int CountRunnersOnBase()
        {
            int count = 0;
            foreach (var runner in BasesOccupied)
            {
                if (runner != null) count++;
            }
            return count;
        }

        private void ClearBases()
        {
            Array.Clear(BasesOccupied, 0, BasesOccupied.Length);
        }
        #endregion

        #region Game End
        private void EndGame()
        {
            TeamData winner = HomeScore > AwayScore ? HomeTeam : AwayTeam;
            OnGameEnded?.Invoke(winner);

            // Award XP and check unlocks
            int baseXP = 100;
            int bonusXP = 0;

            if (winner == HomeTeam) bonusXP += 50;
            if (HomeScore == 0 || AwayScore == 0) bonusXP += 25; // Shutout

            ProgressionManager.Instance?.AwardXP(baseXP + bonusXP);
            ProgressionManager.Instance?.CheckGameAchievements(Statistics);

            UIManager.Instance?.ShowGameOver(winner, HomeScore, AwayScore, Statistics);

            Debug.Log($"Game Over: {winner.TeamName} wins {Math.Max(HomeScore, AwayScore)}-{Math.Min(HomeScore, AwayScore)}");
        }

        public void ReturnToMainMenu()
        {
            // Reset state
            HomeTeam = null;
            AwayTeam = null;
            CurrentStadium = null;
            Statistics.Reset();

            ChangeState(GameState.MainMenu);
            UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu");
        }
        #endregion

        #region Debug
        [ContextMenu("Force Score Run (Home)")]
        private void DebugScoreHome()
        {
            if (!IsTopInning)
            {
                ScoreRuns(1);
            }
        }

        [ContextMenu("Force Score Run (Away)")]
        private void DebugScoreAway()
        {
            if (IsTopInning)
            {
                ScoreRuns(1);
            }
        }

        [ContextMenu("Force Out")]
        private void DebugForceOut()
        {
            RecordOut();
        }

        [ContextMenu("End Game")]
        private void DebugEndGame()
        {
            ChangeState(GameState.GameOver);
        }
        #endregion
    }

    #region Enums
    public enum GameState
    {
        MainMenu,
        TeamSelection,
        StadiumSelection,
        InningStart,
        Pitching,
        Batting,
        Fielding,
        Baserunning,
        InningEnd,
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

    public enum OutType
    {
        Generic,
        Strikeout,
        Groundout,
        Flyout,
        LineOut,
        DoublePlay,
        CaughtStealing
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
    #endregion

    #region Game Statistics
    [System.Serializable]
    public class GameStats
    {
        public int TotalHits;
        public int TotalRuns;
        public int TotalStrikeouts;
        public int TotalWalks;
        public int TotalHomeRuns;
        public int TotalErrors;

        public Dictionary<CharacterData, PlayerGameStats> PlayerStats = new Dictionary<CharacterData, PlayerGameStats>();

        public void Reset()
        {
            TotalHits = 0;
            TotalRuns = 0;
            TotalStrikeouts = 0;
            TotalWalks = 0;
            TotalHomeRuns = 0;
            TotalErrors = 0;
            PlayerStats.Clear();
        }

        public void RecordHit(CharacterData batter, HitType hitType)
        {
            if (!PlayerStats.ContainsKey(batter))
                PlayerStats[batter] = new PlayerGameStats();

            PlayerStats[batter].Hits++;
            TotalHits++;

            if (hitType == HitType.HomeRun)
            {
                PlayerStats[batter].HomeRuns++;
                TotalHomeRuns++;
            }
        }

        public void RecordOut(OutType outType)
        {
            if (outType == OutType.Strikeout)
                TotalStrikeouts++;
        }

        public void RecordStrikeout(CharacterData batter, CharacterData pitcher)
        {
            if (!PlayerStats.ContainsKey(pitcher))
                PlayerStats[pitcher] = new PlayerGameStats();

            PlayerStats[pitcher].StrikeoutsThrown++;
        }

        public void RecordWalk(CharacterData batter, CharacterData pitcher)
        {
            if (!PlayerStats.ContainsKey(batter))
                PlayerStats[batter] = new PlayerGameStats();

            PlayerStats[batter].Walks++;
            TotalWalks++;
        }

        public void RecordRuns(int runs)
        {
            TotalRuns += runs;
        }

        public void RecordRBI(CharacterData batter)
        {
            if (!PlayerStats.ContainsKey(batter))
                PlayerStats[batter] = new PlayerGameStats();

            PlayerStats[batter].RBIs++;
        }
    }

    [System.Serializable]
    public class PlayerGameStats
    {
        public int AtBats;
        public int Hits;
        public int HomeRuns;
        public int RBIs;
        public int Walks;
        public int StrikeoutsThrown;

        public float BattingAverage => AtBats > 0 ? (float)Hits / AtBats : 0f;
    }
    #endregion
}
