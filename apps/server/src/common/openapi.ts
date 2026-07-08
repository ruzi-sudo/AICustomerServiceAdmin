import type { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';

export function setupOpenapi(app: OpenAPIHono, title: string, version: string) {
  app.doc31('/docs/openapi.json', (c) => ({
    openapi: '3.1.0',
    info: {
      title,
      version,
      description: 'PureAdmin 管理后台 API',
    },
    servers: [{ url: '/api', description: 'API v1' }],
  }));

  app.get('/docs', apiReference({
    theme: 'solarized',
    url: '/docs/openapi.json',
    defaultHttpClient: 'fetch',
  }));
}
