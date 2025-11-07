/**
 * game-session.ts
 * Cloudflare Durable Object for real-time multiplayer game sessions
 *
 * Features:
 * - WebSocket-based real-time communication
 * - Game state synchronization
 * - Player matchmaking
 * - Turn-based pitch/bat mechanics
 * - Automatic session cleanup
 */

import { DurableObject } from "cloudflare:workers";

interface Env {
  GAME_SESSIONS: DurableObjectNamespace;
  DB: D1Database;
  KV: KVNamespace;
}

export interface GameSession {
  id: string;
  players: {
    home: PlayerInfo | null;
    away: PlayerInfo | null;
  };
  gameState: {
    inning: number;
    outs: number;
    homeScore: number;
    awayScore: number;
    isTopOfInning: boolean;
    bases: [boolean, boolean, boolean];
    balls: number;
    strikes: number;
    currentBatter: string | null;
    currentPitcher: string | null;
  };
  status: "waiting" | "active" | "completed";
  createdAt: number;
  lastActivity: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  team: any; // Player roster
  connection: WebSocket | null;
}

export interface GameAction {
  type: "pitch" | "swing" | "steal" | "substitution" | "chat";
  playerId: string;
  timestamp: number;
  data: any;
}

export class GameSessionDurableObject extends DurableObject {
  private session: GameSession | null = null;
  private connections: Map<string, WebSocket> = new Map();
  private actionHistory: GameAction[] = [];

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  /**
   * Initialize or restore session state
   */
  async initialize(sessionId: string): Promise<void> {
    // Try to restore from storage
    const stored = await this.ctx.storage.get<GameSession>("session");

    if (stored) {
      this.session = stored;
    } else {
      // Create new session
      this.session = {
        id: sessionId,
        players: {
          home: null,
          away: null
        },
        gameState: {
          inning: 1,
          outs: 0,
          homeScore: 0,
          awayScore: 0,
          isTopOfInning: true,
          bases: [false, false, false],
          balls: 0,
          strikes: 0,
          currentBatter: null,
          currentPitcher: null
        },
        status: "waiting",
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      await this.persistSession();
    }
  }

  /**
   * Handle WebSocket connections
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Accept connection
      await this.handleWebSocket(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // REST API endpoints
    if (url.pathname === "/join") {
      return this.handleJoinRequest(request);
    }

    if (url.pathname === "/state") {
      return this.handleGetState();
    }

    if (url.pathname === "/action") {
      return this.handleAction(request);
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Handle WebSocket connection
   */
  private async handleWebSocket(ws: WebSocket, request: Request): Promise<void> {
    this.ctx.acceptWebSocket(ws);

    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");

    if (!playerId) {
      ws.close(1008, "Missing playerId");
      return;
    }

    // Store connection
    this.connections.set(playerId, ws);

    // Send initial game state
    this.sendToPlayer(playerId, {
      type: "state_sync",
      data: this.session
    });

    // Handle messages
    ws.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data as string);
        await this.handleMessage(playerId, message);
      } catch (error) {
        console.error("Error handling message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    });

    // Handle disconnection
    ws.addEventListener("close", () => {
      this.connections.delete(playerId);
      this.handlePlayerDisconnect(playerId);
    });
  }

  /**
   * Handle player join request
   */
  private async handleJoinRequest(request: Request): Promise<Response> {
    if (!this.session) {
      return new Response("Session not initialized", { status: 500 });
    }

    const { playerId, playerName, team, side } = await request.json<{
      playerId: string;
      playerName: string;
      team: any;
      side: "home" | "away";
    }>();

    // Check if slot is available
    if (this.session.players[side]) {
      return new Response("Slot already taken", { status: 409 });
    }

    // Add player
    this.session.players[side] = {
      id: playerId,
      name: playerName,
      team,
      connection: null
    };

    // Start game if both players joined
    if (this.session.players.home && this.session.players.away) {
      this.session.status = "active";
      this.broadcastToAll({
        type: "game_start",
        data: this.session
      });
    }

    await this.persistSession();

    return new Response(JSON.stringify({
      success: true,
      session: this.session
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Handle get state request
   */
  private handleGetState(): Response {
    return new Response(JSON.stringify(this.session), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Handle game action
   */
  private async handleAction(request: Request): Promise<Response> {
    const action = await request.json<GameAction>();

    // Validate action
    if (!this.validateAction(action)) {
      return new Response("Invalid action", { status: 400 });
    }

    // Process action
    await this.processAction(action);

    // Broadcast to all players
    this.broadcastToAll({
      type: "action",
      data: action
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(playerId: string, message: any): Promise<void> {
    switch (message.type) {
      case "action":
        await this.processAction({
          ...message.data,
          playerId,
          timestamp: Date.now()
        });
        break;

      case "chat":
        this.broadcastToAll({
          type: "chat",
          playerId,
          message: message.text,
          timestamp: Date.now()
        });
        break;

      case "ping":
        this.sendToPlayer(playerId, {
          type: "pong",
          timestamp: Date.now()
        });
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  /**
   * Validate game action
   */
  private validateAction(action: GameAction): boolean {
    if (!this.session) return false;

    const { type, playerId } = action;

    // Check if it's player's turn
    const isTopInning = this.session.gameState.isTopOfInning;
    const activePlayer = isTopInning
      ? this.session.players.away?.id
      : this.session.players.home?.id;

    if (type === "pitch") {
      // Pitcher is the defensive team (opposite of batting team)
      const defensivePlayer = isTopInning
        ? this.session.players.home?.id
        : this.session.players.away?.id;

      return playerId === defensivePlayer;
    }

    if (type === "swing") {
      return playerId === activePlayer;
    }

    return true; // Allow other actions
  }

  /**
   * Process game action
   */
  private async processAction(action: GameAction): Promise<void> {
    if (!this.session) return;

    this.actionHistory.push(action);
    this.session.lastActivity = Date.now();

    switch (action.type) {
      case "pitch":
        await this.processPitch(action);
        break;

      case "swing":
        await this.processSwing(action);
        break;

      case "steal":
        await this.processSteal(action);
        break;

      case "substitution":
        await this.processSubstitution(action);
        break;
    }

    await this.persistSession();

    // Broadcast updated state
    this.broadcastToAll({
      type: "state_update",
      data: this.session.gameState
    });
  }

  /**
   * Process pitch action
   */
  private async processPitch(action: GameAction): Promise<void> {
    // Pitch logic is handled client-side with physics
    // Server just validates and broadcasts
    this.broadcastToAll({
      type: "pitch_thrown",
      data: action.data
    });
  }

  /**
   * Process swing action
   */
  private async processSwing(action: GameAction): Promise<void> {
    if (!this.session) return;

    const { result } = action.data;

    // Update game state based on result
    switch (result) {
      case "strike":
        this.session.gameState.strikes++;
        if (this.session.gameState.strikes >= 3) {
          await this.recordOut("strikeout");
        }
        break;

      case "ball":
        this.session.gameState.balls++;
        if (this.session.gameState.balls >= 4) {
          await this.recordWalk();
        }
        break;

      case "hit":
        await this.recordHit(action.data.bases);
        break;

      case "out":
        await this.recordOut(action.data.outType);
        break;
    }
  }

  /**
   * Process steal attempt
   */
  private async processSteal(action: GameAction): Promise<void> {
    // Steal logic handled client-side
    this.broadcastToAll({
      type: "steal_attempt",
      data: action.data
    });
  }

  /**
   * Process player substitution
   */
  private async processSubstitution(action: GameAction): Promise<void> {
    // Update team roster
    this.broadcastToAll({
      type: "substitution",
      data: action.data
    });
  }

  /**
   * Record an out
   */
  private async recordOut(outType: string): Promise<void> {
    if (!this.session) return;

    this.session.gameState.outs++;
    this.session.gameState.balls = 0;
    this.session.gameState.strikes = 0;

    if (this.session.gameState.outs >= 3) {
      await this.endInning();
    }
  }

  /**
   * Record a walk
   */
  private async recordWalk(): Promise<void> {
    if (!this.session) return;

    // Advance runners
    this.session.gameState.bases[0] = true;

    this.session.gameState.balls = 0;
    this.session.gameState.strikes = 0;
  }

  /**
   * Record a hit
   */
  private async recordHit(bases: number): Promise<void> {
    if (!this.session) return;

    // Advance runners and score runs
    let runsScored = 0;

    // Simple base advancement logic
    for (let i = 2; i >= 0; i--) {
      if (this.session.gameState.bases[i]) {
        const newBase = i + bases;
        if (newBase >= 3) {
          runsScored++;
          this.session.gameState.bases[i] = false;
        } else {
          this.session.gameState.bases[newBase] = true;
          this.session.gameState.bases[i] = false;
        }
      }
    }

    // Batter advances
    if (bases === 4) {
      runsScored++; // Home run
    } else if (bases <= 3) {
      this.session.gameState.bases[bases - 1] = true;
    }

    // Update score
    if (this.session.gameState.isTopOfInning) {
      this.session.gameState.awayScore += runsScored;
    } else {
      this.session.gameState.homeScore += runsScored;
    }

    this.session.gameState.balls = 0;
    this.session.gameState.strikes = 0;
  }

  /**
   * End current inning
   */
  private async endInning(): Promise<void> {
    if (!this.session) return;

    this.session.gameState.outs = 0;
    this.session.gameState.bases = [false, false, false];

    if (this.session.gameState.isTopOfInning) {
      this.session.gameState.isTopOfInning = false;
    } else {
      this.session.gameState.isTopOfInning = true;
      this.session.gameState.inning++;
    }

    // Check if game is over (9 innings)
    if (this.session.gameState.inning > 9) {
      if (this.session.gameState.homeScore !== this.session.gameState.awayScore) {
        await this.endGame();
      }
    }

    this.broadcastToAll({
      type: "inning_change",
      data: this.session.gameState
    });
  }

  /**
   * End game
   */
  private async endGame(): Promise<void> {
    if (!this.session) return;

    this.session.status = "completed";

    this.broadcastToAll({
      type: "game_end",
      data: {
        winner: this.session.gameState.homeScore > this.session.gameState.awayScore
          ? "home"
          : "away",
        finalScore: {
          home: this.session.gameState.homeScore,
          away: this.session.gameState.awayScore
        }
      }
    });

    await this.persistSession();

    // Schedule cleanup after 1 hour
    await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }

  /**
   * Handle player disconnect
   */
  private handlePlayerDisconnect(playerId: string): void {
    // Notify other player
    this.broadcastToAll({
      type: "player_disconnected",
      playerId,
      timestamp: Date.now()
    });

    // Pause game or forfeit after timeout
    setTimeout(() => {
      if (!this.connections.has(playerId) && this.session) {
        // Player didn't reconnect, forfeit
        this.session.status = "completed";
        this.broadcastToAll({
          type: "game_end",
          data: { reason: "forfeit", playerId }
        });
      }
    }, 60000); // 1 minute grace period
  }

  /**
   * Send message to specific player
   */
  private sendToPlayer(playerId: string, message: any): void {
    const connection = this.connections.get(playerId);
    if (connection) {
      connection.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected players
   */
  private broadcastToAll(message: any): void {
    const serialized = JSON.stringify(message);
    this.connections.forEach(connection => {
      connection.send(serialized);
    });
  }

  /**
   * Persist session to durable storage
   */
  private async persistSession(): Promise<void> {
    if (this.session) {
      await this.ctx.storage.put("session", this.session);
    }
  }

  /**
   * Alarm handler for cleanup
   */
  async alarm(): Promise<void> {
    // Close all connections
    this.connections.forEach(ws => ws.close());
    this.connections.clear();

    // Delete session data
    await this.ctx.storage.deleteAll();
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Create or get Durable Object
    if (url.pathname.startsWith("/game/")) {
      const sessionId = url.pathname.split("/")[2];
      const id = env.GAME_SESSIONS.idFromName(sessionId);
      const stub = env.GAME_SESSIONS.get(id);

      // Forward request to Durable Object
      return stub.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  }
};
