import './env';
import { serve } from '@hono/node-server';
import { app } from './routes/app.route';
import { startCredentialExpirationListener } from './service/redis.service';

const PORT = Number(process.env.PORT) || 8080;

console.log(`[Server] Starting PureAdmin API server...`);
console.log(`[Server] OpenAPI docs: http://localhost:${PORT}/docs`);
console.log(`[Server] API base: http://localhost:${PORT}/api`);

void startCredentialExpirationListener();

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`[Server] Running on http://localhost:${info.port}`);
});
