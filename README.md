# AICustomerServiceAdmin

A professional customer service administration system featuring AI-powered chat capabilities and comprehensive system management.

## Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: Element-Plus
- **State Management**: Pinia
- **Language**: TypeScript
- **Styling**: Tailwind CSS / SCSS

### Backend
- **Framework**: Hono
- **API Specification**: OpenAPI (via `@hono/zod-openapi`)
- **Validation**: Zod
- **ORM**: Drizzle ORM
- **Database**: MySQL 8.0
- **Authentication**: JWT (Access & Refresh tokens)

## Key Features

- **AI Chat**: Integrated AI chat interface for customer service.
- **RBAC System**: Robust Role-Based Access Control managing users, roles, and page permissions.
- **Dynamic Routing**: Menus and routes are dynamically loaded based on user permissions.
- **System Monitoring**: Comprehensive logging for logins, operations, and system events.
- **Dashboard**: Real-time statistics and overview of system health.

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- pnpm
- Docker (for MySQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ruzi-sudo/AICustomerServiceAdmin.git
   cd AICustomerServiceAdmin
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the Database**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Run in Development Mode**
   ```bash
   pnpm dev
   ```

The frontend will be available at `http://localhost:8848` and the backend API at `http://localhost:8080`.

## API Documentation

Once the server is running, you can access the interactive OpenAPI documentation at:
`http://localhost:8080/docs`

## Default Credentials
- **Admin**: `admin` / `admin123`
- **Common User**: `common` / `admin123`

## Project Structure

```
AICustomerServiceAdmin/
├── apps/
│   ├── web/            # Vue 3 frontend (port 8848)
│   └── server/         # Hono backend API (port 8080)
├── packages/
│   └── config/         # Shared ESLint & TypeScript configs
└── docker/             # MySQL Docker config + init.sql (schema + seed data)
```
