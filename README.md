# hono-elplus-admin

`hono-elplus-admin` 是一个基于 **Pure Admin** 体系重构的全栈后台管理系统。项目保留了 Pure Admin 在前端工程、动态路由、权限菜单和管理后台交互上的成熟设计，同时将后端替换为基于 **Hono** 的 TypeScript API 服务，使前后端都以 TypeScript 作为主要开发语言。

项目目标是提供一个更轻量、更清晰、更容易二次开发的管理后台基础工程，适合用作 RBAC 后台、系统监控后台、业务运营后台或中小型 SaaS 管理端。

## 核心特点

- **基于 Pure Admin 重构**：沿用 Vue Pure Admin 的后台布局、权限菜单、动态路由和 Element Plus 组件体系，并清理演示功能，保留更贴近业务系统的骨架。
- **前后端全 TypeScript**：前端 Vue 3 + TypeScript，后端 Hono + TypeScript，接口 schema、业务服务、数据库 schema 都统一在 TS 生态内维护。
- **Hono 后端架构**：使用 Hono 构建轻量 API 服务，结合 `@hono/zod-openapi` 和 Zod 做接口定义、参数校验和 OpenAPI 文档生成。
- **Element Plus 管理端**：前端基于 Vue 3、Vite、Pinia、Element Plus 和 Pure Admin 组件体系构建。
- **RBAC 权限模型**：内置用户、角色、菜单、按钮权限、动态路由和角色菜单授权。
- **Redis 登录态管理**：登录凭证写入 Redis，支持在线用户管理、强制下线和凭证过期清理。
- **MySQL + Drizzle**：使用 Drizzle ORM 维护数据库 schema 与类型，数据库使用 MySQL。
- **Docker 本地环境**：提供 MySQL、Redis 和初始化 SQL，便于快速启动本地开发环境。

## 技术架构

### 前端

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Pure Admin 组件体系
- Axios 请求封装
- SCSS / Tailwind CSS

### 后端

- Hono
- TypeScript
- `@hono/zod-openapi`
- Zod
- Drizzle ORM
- MySQL
- Redis
- JWT Access Token / Refresh Token
- OpenAPI / Scalar API Reference

### 工程结构

```text
hono-elplus-admin/
├── apps/
│   ├── web/              # 前端管理端，Vue 3 + Element Plus + Pure Admin
│   └── server/           # 后端 API 服务，Hono + Drizzle + Redis
├── packages/
│   └── config/           # 共享 ESLint / TypeScript 配置
├── docker/
│   ├── docker-compose.yml
│   └── init.sql          # MySQL 初始化表结构和基础数据
├── TODO.md               # 项目功能完成度和后续计划
└── README.md
```

## 已实现功能

- 用户名密码登录
- 用户注册
- JWT 登录认证和刷新
- Redis 凭证存储与过期处理
- 在线用户列表和强制下线
- 用户管理 CRUD
- 角色管理 CRUD
- 菜单管理 CRUD
- 多级动态菜单路由
- 菜单启用/停用
- 角色菜单授权
- 登录日志
- 系统操作日志
- 个人信息编辑
- 头像上传
- 个人密码重置
- Docker 初始化数据库和 Redis

## 快速开始

### 环境要求

- Node.js LTS
- pnpm
- Docker / Docker Compose

### 安装依赖

```bash
pnpm install
```

### 启动基础服务

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 启动开发环境

```bash
pnpm dev
```

默认访问地址：

- 前端：`http://localhost:8848`
- 后端：`http://localhost:8080`
- OpenAPI 文档：`http://localhost:8080/docs`

## 默认账号

```text
管理员：admin / admin123
普通用户：common / admin123
```

## 环境配置

项目使用根目录 `.env` 作为统一环境配置入口，后端会从该文件读取数据库、Redis、JWT 等配置。

本地开发时需要确认 MySQL 和 Redis 配置与 `docker/docker-compose.yml` 保持一致。

## 数据库与初始化

初始化 SQL 位于：

```text
docker/init.sql
```

该文件包含：

- 用户表
- 角色表
- 用户角色关联表
- 菜单表
- 角色菜单关联表
- 在线用户表
- 登录日志表
- 系统日志表
- 基础 admin / common 账号
- 基础菜单和权限数据

## API 文档

后端启动后访问：

```text
http://localhost:8080/docs
```

接口由 Hono + Zod OpenAPI 定义生成，便于调试和后续前后端协作。

## 项目定位

这个项目不是单纯的 Pure Admin 模板拷贝，而是在其前端管理端基础上做了业务化整理：

- 删除演示性质较强的模块
- 补齐真实后端 API
- 加入 Redis 登录态管理
- 用 Hono 重建后端服务
- 用 Drizzle 维护数据库类型
- 统一前后端 TypeScript 开发体验

适合作为一个可继续扩展的现代 TypeScript 全栈后台管理系统。
