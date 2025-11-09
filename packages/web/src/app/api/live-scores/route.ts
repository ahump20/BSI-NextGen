import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Server-Sent Events endpoint for real-time score updates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sport = searchParams.get('sport') || 'college-baseball';

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', sport })}\n\n`)
      );

      // Function to send score updates
      const sendUpdate = () => {
        const update = {
          type: 'score-update',
          timestamp: new Date().toISOString(),
          sport,
          games: [
            {
              gameId: 'game-1',
              homeTeam: 'Texas',
              awayTeam: 'Oklahoma',
              homeScore: Math.floor(Math.random() * 10),
              awayScore: Math.floor(Math.random() * 10),
              status: 'LIVE',
              inning: Math.floor(Math.random() * 9) + 1,
            },
            {
              gameId: 'game-2',
              homeTeam: 'LSU',
              awayTeam: 'Arkansas',
              homeScore: Math.floor(Math.random() * 10),
              awayScore: Math.floor(Math.random() * 10),
              status: 'LIVE',
              inning: Math.floor(Math.random() * 9) + 1,
            },
          ],
        };

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
          );
        } catch (error) {
          console.error('Error sending update:', error);
        }
      };

      // Send updates every 5 seconds
      const interval = setInterval(sendUpdate, 5000);

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`: heartbeat\n\n`)
          );
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          clearInterval(interval);
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
