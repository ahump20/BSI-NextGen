import { useEffect, useState, useRef } from 'react';

interface LiveGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  inning?: number;
}

interface LiveScoreUpdate {
  type: 'connected' | 'score-update';
  timestamp: string;
  sport: string;
  games?: LiveGame[];
}

export function useLiveScores(sport: string = 'college-baseball') {
  const [isConnected, setIsConnected] = useState(false);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource(`/api/live-scores?sport=${sport}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: LiveScoreUpdate = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('Connected to live scores:', data.sport);
        } else if (data.type === 'score-update') {
          setLiveGames(data.games || []);
          setLastUpdate(data.timestamp);
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError('Connection lost. Reconnecting...');
      setIsConnected(false);

      // EventSource will automatically try to reconnect
    };

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sport]);

  return {
    isConnected,
    liveGames,
    lastUpdate,
    error,
  };
}
