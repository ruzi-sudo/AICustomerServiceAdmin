---
name: myhono
description: Hono + @hono/zod-openapi — web framework for HTTP APIs. Use when building route structures, middleware chains, OpenAPI documentation, or server-side applications with Hono. Triggers on Hono imports (`import { Hono }`, `import { OpenAPIHono }`, `import { createRoute }`), API route definitions, middleware configuration, or any Hono framework task.
---

# MyHono — Hono Framework Skill

## App Dir Structure

```shell
./src
├── common                # 公共工具（openapi, exception, schemas）
├── middlewares            # 全局中间件
├── bootstrap.ts           # 本地启动入口
├── routes
│   ├── app.route.ts       # 总路由：全局中间件 + 域级中间件 + route mount
│   └── demo               # feature 子路由
│       ├── demo.handlers.ts
│       ├── demo.routes.ts
│       └── demo.schemas.ts
├── service                # 从 handler 提取的重复逻辑
└── types
    └── index.d.ts         # 总类型定义
```

## Two-Level Route Architecture

Feature 级路由直接导出 `OpenAPIHono` 实例，domain handler 零前缀挂载聚合。

### Feature Level — 每个子路由目录

```ts
// demo.handlers.ts — 直接导出 route，不经过 register 闭包
import { OpenAPIHono } from '@hono/zod-openapi'
import { validatorParamsHook } from '@repo/shared/validator'
import * as routes from './demo.routes'

export const route = new OpenAPIHono({
    defaultHook: (result, c) => validatorParamsHook(result, c),
})

route.openapi(routes.ssoLogin, async (c) => {
    const body = c.req.valid('json')
    return c.json({ token, message: 'Log In Success.' })
})
```

```ts
// demo.routes.ts — 使用 * as 导入 schema
import { createRoute } from '@hono/zod-openapi'
import { LoginBodySchema } from './demo.schemas'

export const ssoLogin = createRoute({
    method: 'post',
    path: '/login/sso-login',
    tags: ['demo'],
    request: { body: { content: { 'application/json': { schema: LoginBodySchema } } } },
    responses: { '200': { description: 'success' } },
})
```

```ts
// demo.schemas.ts
import { z } from '@hono/zod-openapi'

export const LoginBodySchema = z.object({ merchantId: z.string() })
export type LoginBodyInput = z.infer<typeof LoginBodySchema>

// 共享的通用 schema（如分页）放在 common/
export const paginationSchema = z.object({
    pageNum: z.coerce.number().positive().int().default(1),
    pageSize: z.coerce.number().positive().int().default(10),
})
```

### Domain Level — 零前缀挂载聚合

当业务域包含多个 feature 时，domain handler 负责聚合：

```ts
// card/card.handlers.ts — domain 聚合
import { route as cardManagementRoute } from './card-management/card-management.handlers'
import { route as cardBalanceAuditRoute } from './card-balance-audit/card-balance-audit.handlers'
import { OpenAPIHono } from '@hono/zod-openapi'
import { validatorParamsHook } from '@repo/shared/validator'

export const route = new OpenAPIHono({
    defaultHook: (result, c) => validatorParamsHook(result, c),
})
route.route('/', cardManagementRoute)
route.route('/', cardBalanceAuditRoute)
```

Hono 的 `route.route('/', subRoute)` 以零前缀挂载，subRoute 中的路径保持不变。

### App Level — 域级中间件 + Mount

```ts
// app.route.ts
import { route as cardRoute } from './card/card.handlers'
import { route as userRoute } from './user/user.handlers'

export const app = new OpenAPIHono().basePath('/api')

// 1. 全局中间件
app.use('*', cors())
app.use(timeout(20000))

// 2. 域级中间件（在 mount 之前注册，Hono 按路径匹配）
app.use('/card/*', adminAuthMiddleware, shopMiddleware)
app.use('/user/*', adminAuthMiddleware, shopMiddleware)

// 3. Mount domain routes
app.route('/card', cardRoute)
app.route('/user', userRoute)

// 4. 404 + onError
app.notFound((c) => c.text('Route not found', 404))
app.onError((err, c) => { ... })
```

> **中间件路径匹配规则**：`app.use('/card/*', mw)` 绑定到 `/api/card/*`（basePath 自动拼接）。
> 域级中间件必须在 `app.route('/card', cardRoute)` 之前注册，Hono 按注册顺序匹配。

## Core Rules

### 1. 禁止 register 闭包模式

```ts
// ❌ 不要用 register 函数传递 route
export const registerXxxHandlers = (route: OpenAPIHono) => {
    route.openapi(routes.xxx, handler)
}

// ✅ 直接导出 route
export const route = new OpenAPIHono({ defaultHook })
route.openapi(routes.xxx, handler)
```

### 2. 禁止 barrel/index 文件

```ts
// ❌ 不要 index.ts
export * from './xxx.handlers'

// ✅ 直接 import
import { route as demoRoute } from './demo/demo.handlers'
```

### 3. 域级中间件不进 domain handler

```ts
// ❌ 中间件写在 domain handler 里
route.use(adminAuthMiddleware, shopMiddleware)

// ✅ 写在 app.route.ts
app.use('/card/*', adminAuthMiddleware, shopMiddleware)
```

### 4. 跨域引用使用 `@/routes/` 别名

```ts
// ❌ 深层相对路径
import { helper } from '../../../user/shared/handler-utils'

// ✅ 使用 @/
import { helper } from '@/routes/user/shared/handler-utils'
```

### 5. schema 不按 request/response 拆分

统一放在 `feature-name.schemas.ts` 中。只有当共享类型过多时才单独拆分。

### 6. handler 参数禁止 `c: any`

```ts
// ❌ c: any 破坏所有类型推断
route.openapi(routes.xxx, async (c: any) => {

// ✅ 让 Hono 自动推断（route.openapi 从 createRoute 推导类型）
route.openapi(routes.xxx, async (c) => {
```

### 7. handler 使用 `import * as routes` 导入路由定义

```ts
import * as routes from './demo.routes'
// 然后用 routes.xxxRoute 引用
route.openapi(routes.ssoLogin, handler)
```

## 命名规范

| 文件 | 规则 | 示例 |
|------|------|------|
| Feature handler | `{name}.handlers.ts` | `demo.handlers.ts` |
| Feature route | `{name}.routes.ts` | `demo.routes.ts` |
| Feature schema | `{name}.schemas.ts` | `demo.schemas.ts` |
| Domain handler | `{domain}.handlers.ts` | `card.handlers.ts` |
| App route | `app.route.ts` | — |
| Shared utils | `shared/handler-utils.ts` | `card/shared/handler-utils.ts` |

目录名与文件名前缀一致：`card/card-management/card-management.handlers.ts`。

## 重复逻辑提取到 service/

当 handler 中出现重复的 DB 查询或业务逻辑：

```ts
// src/service/card.service.ts — 纯逻辑，不依赖 Hono Context
import { db, schemas } from '@repo/db'
import { eq } from 'drizzle-orm'

export const getMerchantWallet = async (merchantId: number) => {
    return db.query.creditMerchantWallet.findFirst({
        where: (row, { eq }) => eq(row.merchantId, merchantId),
    })
}
```

handler 中直接调用 service，不混合 DB 查询和路由逻辑。

## Per-domain Shared Utils

每个 domain 可以有 `domain/shared/handler-utils.ts`，存放内部共享辅助函数（如 `getLoginUserId`、`getTenantCode`）。跨 domain 共享使用 `@/routes/domain/shared/handler-utils` 路径。

## 特殊路径参数

Hono 的 `app.route('/prefix', subApp)` 路径拼接规则：

| app.route prefix | subApp path | 最终路径 |
|-----------------|-------------|---------|
| `/api/card` | `/list` | `/api/card/list` |
| `/api/card` | `/detail/:id` | `/api/card/detail/:id` |
| `/` (零前缀) | `/card/list` | `/card/list` |

domain handler 中的 `route.route('/', subRoute)` 使用零前缀，保持子路由原始路径。

## Exception

```ts
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class ParamsException extends HTTPException {
    constructor(status: ContentfulStatusCode, options?: { res?: Response; message?: string; cause?: unknown }) {
        super(status, options)
        this.name = 'ParamsException'
    }
}
```

## OpenAPI Docs

```ts
// common/openapi.ts
import type { OpenAPIHono } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'

export const adminDocs = (app: OpenAPIHono) => {
    app.doc31('/docs/openapi.json', (c) => ({
        openapi: '3.1.0',
        info: { title: 'API Docs', version: '1.0.0' },
    }))
    app.get('/docs', Scalar({ url: '/docs/openapi.json', theme: 'solarized' }))
}
```
