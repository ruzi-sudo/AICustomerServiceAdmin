import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { route as authRoute } from './auth/auth.handlers';
import { route as userRoute } from './user/user.handlers';
import { route as roleRoute } from './role/role.handlers';
import { route as menuRoute } from './menu/menu.handlers';
import { route as monitorRoute } from './monitor/monitor.handlers';
import { route as dashboardRoute } from './dashboard/dashboard.handlers';
import { authMiddleware } from '../middlewares/auth';
import { errorHandler } from '../middlewares/error';
import { setupOpenapi } from '../common/openapi';

const app = new OpenAPIHono().basePath('/api');

// CORS
app.use('*', cors({
  origin: ['http://localhost:8848', 'http://127.0.0.1:8848'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Auth routes (no auth required)
app.route('/', authRoute);

// Protected routes - user
app.use('/user/*', authMiddleware);
app.use('/list-all-role', authMiddleware);
app.use('/list-role-ids', authMiddleware);
app.route('/', userRoute);

// Protected routes - role
app.use('/role/*', authMiddleware);
app.route('/', roleRoute);

// Protected routes - menu
app.use('/menu/*', authMiddleware);
app.use('/get-async-routes', authMiddleware);
app.route('/', menuRoute);

// Protected routes - monitor
app.use('/online-logs', authMiddleware);
app.use('/login-logs', authMiddleware);
app.use('/operation-logs', authMiddleware);
app.use('/system-logs*', authMiddleware);
app.route('/', monitorRoute);

// Protected routes - dashboard
app.use('/mine*', authMiddleware);
app.use('/get-card-list', authMiddleware);
app.use('/get-map-info', authMiddleware);
app.route('/', dashboardRoute);

// 404
app.notFound((c) => c.json({ code: 10004, message: '接口不存在', data: {} }, 404));

// Error handler
app.onError(errorHandler);

// OpenAPI docs
setupOpenapi(app, 'PureAdmin API', '7.0.0');

export { app };
