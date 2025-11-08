import { Router } from 'itty-router';
import { withCache } from './utils/cache';
import { createDashboardHandler } from './routes/dashboard';
import { createTeamsHandler } from './routes/teams';
import { createHealthHandler } from './routes/health';
import type { Env } from './bindings';

const router = Router();

router.get('/api/v1/health', createHealthHandler());
router.get('/api/v1/dashboard', withCache('dashboard', 10, createDashboardHandler()));
router.get('/api/v1/teams/:id', withCache('team', 20, createTeamsHandler()));

router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return router.handle(request, env, ctx);
  }
};
