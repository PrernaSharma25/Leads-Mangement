# Lead Management Portal Backend API

A production-quality, modular RESTful backend API for managing sales leads and notes. Built from scratch with **Node.js**, **Express.js**, **TypeScript**, **SQLite**, **Prisma ORM**, and **Zod**.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Prerequisites](#prerequisites)
- [Tech Stack & Key Decisions](#tech-stack--key-decisions)
- [Project Directory Structure](#project-directory-structure)
- [Quick Start Guide](#quick-start-guide)
- [Environment Configuration](#environment-configuration)
- [Database Setup & Migrations](#database-setup--migrations)
- [Database Seeding](#database-seeding)
- [Prisma Studio (GUI Database Viewer)](#prisma-studio-gui-database-viewer)
- [Running Development & Production Servers](#running-development--production-servers)
- [API Documentation (Swagger UI)](#api-documentation-swagger-ui)
- [API Endpoints Reference](#api-endpoints-reference)
- [Testing & Test Isolation Strategy](#testing--test-isolation-strategy)
- [Linting & Code Formatting](#linting--code-formatting)
- [Docker Deployment & SQLite Persistence](#docker-deployment--sqlite-persistence)
- [Architecture Deep Dive: Request Flow](#architecture-deep-dive-request-flow)
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)

---

## Overview & Architecture

This backend implements a clean **layered architecture** designed for maintainability, testability, and separation of concerns:

```text
HTTP Request
     │
     ▼
[Express Routes]        ── Defines endpoints, HTTP verbs, attaches validation middleware
     │
     ▼
[Zod Validation]       ── Validates & sanitizes body, params, and query params before reaching controllers
     │
     ▼
[Controllers]          ── Extracts HTTP data, delegates to services, returns HTTP status & JSON
     │
     ▼
[Services]             ── Encapsulates core business rules, deduplication, conflict checks, 404/409 errors
     │
     ▼
[Repositories]         ── Database access layer; builds Prisma queries, pagination, where clauses
     │
     ▼
[Prisma Client]        ── Generates type-safe SQL queries
     │
     ▼
[SQLite Database]      ── File-based persistent relational storage (dev.db)
```

### Key Architectural Characteristics

1. **Decoupled Server & App (`app.ts` vs `server.ts`)**:
   `src/app.ts` configures Express middleware, routes, and error handling without binding to a network port. This enables Supertest to execute in-memory API tests rapidly without port collisions. `src/server.ts` handles network listening and graceful process shutdowns.
2. **Centralized Error Handling**:
   All operational errors extend `AppError`. The global `errorHandlerMiddleware` standardizes all error responses into a consistent JSON contract (`{ success: false, error: { code, message, details } }`).
3. **Database Cascade Relational Policy**:
   Notes reference leads via foreign keys with `onDelete: Cascade`. When a lead is deleted, all associated notes are safely deleted automatically by SQLite.
4. **Isolated Test Database**:
   Tests run against an isolated SQLite test database (`prisma/test.db`), completely protecting development data (`prisma/dev.db`) from mutation during testing.

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or newer
- **Git**

Verify your environment:

```bash
node -v
npm -v
```

---

## Tech Stack & Key Decisions

| Technology                 | Purpose         | Notes / Version Details                                          |
| :------------------------- | :-------------- | :--------------------------------------------------------------- |
| **Node.js**                | Runtime         | Fast, asynchronous JavaScript runtime                            |
| **Express 5**              | Web Framework   | Modern Express with built-in async error delegation              |
| **TypeScript**             | Type Safety     | Strict type checking and clean object-oriented architecture      |
| **SQLite**                 | Database        | Zero-config, single-file relational database engine              |
| **Prisma 6**               | ORM             | Declarative schema, automated migrations, and fully typed client |
| **Zod**                    | Validation      | Runtime type validation for bodies, queries, and route params    |
| **Swagger UI / OpenAPI 3** | Documentation   | Interactive API exploration served at `/api-docs`                |
| **Jest & Supertest**       | Testing         | Full-suite integration testing across all HTTP endpoints         |
| **SWC (`@swc/jest`)**      | Test Transpiler | Ultra-fast native compilation for TypeScript tests               |
| **ESLint & Prettier**      | Code Quality    | Consistent formatting and linting rules                          |

---

## Project Directory Structure

```text
lead-management-backend/
├── prisma/
│   ├── migrations/                 # Versioned SQL migration files
│   │   └── 20261025141310_init/
│   │       └── migration.sql       # Initial SQLite schema migration
│   ├── dev.db                      # Local SQLite database (ignored by git)
│   ├── schema.prisma               # Prisma relational data models
│   └── seed.ts                     # Database seed script with realistic records
├── src/
│   ├── config/
│   │   └── env.ts                  # Zod-validated typed environment configuration
│   ├── database/
│   │   └── prisma.ts               # Singleton PrismaClient instance
│   ├── docs/
│   │   ├── openapi.yaml            # OpenAPI 3.0 specification
│   │   └── swagger.ts              # Swagger UI Express integration
│   ├── errors/
│   │   └── app-error.ts            # Operational AppError hierarchy (400, 404, 409, 500)
│   ├── middlewares/
│   │   ├── error-handler.middleware.ts # Centralized JSON error response handler
│   │   ├── not-found.middleware.ts     # 404 handler for unmatched routes
│   │   └── validate.middleware.ts      # Reusable Zod validation middleware
│   ├── modules/
│   │   ├── leads/
│   │   │   ├── leads.controller.ts # Lead HTTP endpoints logic
│   │   │   ├── leads.repository.ts # Prisma queries for leads
│   │   │   ├── leads.routes.ts     # Lead Express routes
│   │   │   ├── leads.service.ts    # Lead business logic & conflict checks
│   │   │   ├── leads.types.ts      # TypeScript interfaces and DTOs
│   │   │   └── leads.validation.ts # Zod schemas for lead requests
│   │   └── notes/
│   │       ├── notes.controller.ts # Note HTTP endpoints logic
│   │       ├── notes.repository.ts # Prisma queries for notes
│   │       ├── notes.routes.ts     # Nested Express routes (/api/leads/:id/notes)
│   │       ├── notes.service.ts    # Note business logic
│   │       ├── notes.types.ts      # TypeScript interfaces and DTOs
│   │       └── notes.validation.ts # Zod schemas for note requests
│   ├── app.ts                      # Express application assembly (exported for testing)
│   └── server.ts                   # HTTP listener with graceful shutdown
├── tests/
│   ├── env.setup.ts                # Sets NODE_ENV=test and test DB URL before tests load
│   ├── setup.ts                    # Clones schema structure & resets tables between tests
│   ├── leads.test.ts               # Lead integration test suite (20 tests)
│   └── notes.test.ts               # Note integration test suite (8 tests)
├── .env                            # Local environment variables (not committed)
├── .env.example                    # Example template for environment variables
├── .gitignore                      # Git ignore rules (node_modules, db files, secrets)
├── .prettierrc                     # Prettier formatting rules
├── Dockerfile                      # Multi-stage container definition with volume support
├── eslint.config.js                # ESLint configuration
├── jest.config.ts                  # Jest test configuration
├── package.json                    # Project metadata and working npm scripts
├── tsconfig.json                   # TypeScript compiler configuration
└── README.md                       # Comprehensive project documentation
```

---

## Quick Start Guide

Clone the repository and run the following commands:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment file
# On Windows PowerShell:
Copy-Item .env.example .env
# On macOS/Linux:
cp .env.example .env

# 3. Create and apply the database migrations
npm run db:migrate

# 4. Populate realistic demo records
npm run db:seed

# 5. Start development server with hot-reload
npm run dev
```

The server will be running at `http://localhost:3000`.

---

## Environment Configuration

Environment variables are loaded via `dotenv` and validated at startup using Zod in [`src/config/env.ts`](file:///c:/Users/Dell/OneDrive/Desktop/Prerna%20Data/2026_skills/lead-management-backend/src/config/env.ts). If any required variable is missing or invalid, the server fails fast with a clear error description.

| Variable       | Description             | Default         | Example                             |
| :------------- | :---------------------- | :-------------- | :---------------------------------- |
| `NODE_ENV`     | Application environment | `development`   | `development`, `production`, `test` |
| `PORT`         | HTTP server port        | `3000`          | `3000`                              |
| `DATABASE_URL` | SQLite connection URL   | `file:./dev.db` | `file:./dev.db`                     |

### SQLite Database Location

In Prisma 6 with SQLite, relative paths specified in `DATABASE_URL` (such as `file:./dev.db`) are resolved relative to the location of `prisma/schema.prisma`.

Therefore:

- **Development Database**: Stored at `prisma/dev.db`
- **Test Database**: Created on demand at `prisma/test.db`
- Both `.db` files and their corresponding `-journal` files are ignored by git in `.gitignore`.

---

## Database Setup & Migrations

Prisma Migrate tracks your schema history using versioned SQL migration files:

```bash
# Apply pending migrations (or prompt to create a new one during development)
npm run db:migrate

# Generate Prisma Client TypeScript types (automatically executed during migrate)
npm run db:generate
```

To create a new migration after modifying `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_change_description
```

---

## Database Seeding

The seed script in [`prisma/seed.ts`](file:///c:/Users/Dell/OneDrive/Desktop/Prerna%20Data/2026_skills/lead-management-backend/prisma/seed.ts) populates 5 realistic leads covering all statuses (`new`, `contacted`, `qualified`, `lost`) along with follow-up notes:

```bash
npm run db:seed
```

> **Note**: The seed script is completely **idempotent**. It resets previous seed data and reapplies fresh test records safely.

---

## Prisma Studio (GUI Database Viewer)

Prisma Studio is a visual database browser included with Prisma:

```bash
npm run db:studio
```

Once started, open your browser at:
👉 **`http://localhost:5555`**

You can view, search, edit, create, and delete `Lead` and `Note` records interactively.

---

## Running Development & Production Servers

### Development (with hot reloading)

```bash
npm run dev
```

Powered by `tsx watch`, automatically reloading whenever you edit TypeScript files.

### Production Build & Run

```bash
# 1. Compile TypeScript into dist/
npm run build

# 2. Run compiled JavaScript
npm run start
```

---

## API Documentation (Swagger UI)

Interactive OpenAPI 3.0 documentation with live "Try it out" capabilities is served directly by the Express backend:

👉 **`http://localhost:3000/api-docs`**

The OpenAPI specification file is located at [`src/docs/openapi.yaml`](file:///c:/Users/Dell/OneDrive/Desktop/Prerna%20Data/2026_skills/lead-management-backend/src/docs/openapi.yaml) and describes all request bodies, query filters, schemas, and HTTP status codes.

---

## API Endpoints Reference

### 1. Health Check

- **`GET /health`**
  - **Status**: 200 OK
  - **Response**: `{ "status": "ok", "uptime": 12.4, "timestamp": "2026-10-25T14:49:16.314Z" }`

---

### 2. Leads Endpoints

#### `GET /api/leads`

Retrieve a paginated list of leads with optional filtering and search.

- **Query Parameters**:
  - `search` (optional string): Case-insensitive match against name or email
  - `status` (optional enum: `new`, `contacted`, `qualified`, `lost`): Filter by status
  - `page` (optional integer, default `1`, min `1`): Page number
  - `limit` (optional integer, default `10`, max `100`): Items per page
- **Status Code**: 200 OK
- **Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice.johnson@techcorp.io",
      "phone": "+1-202-555-0143",
      "status": "new",
      "createdAt": "2026-10-25T14:30:11.015Z",
      "_count": { "notes": 1 }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### `POST /api/leads`

Create a new lead.

- **Request Body**:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-0199",
  "status": "new"
}
```

- **Status Codes**:
  - `201 Created`: Successfully created
  - `400 Bad Request`: Validation error (e.g. invalid email format)
  - `409 Conflict`: A lead with this email already exists

#### `GET /api/leads/:id`

Retrieve a specific lead with its associated notes.

- **Status Codes**:
  - `200 OK`: Lead retrieved
  - `400 Bad Request`: Non-numeric lead ID
  - `404 Not Found`: Lead ID does not exist

#### `PATCH /api/leads/:id`

Partially update an existing lead's fields (`name`, `email`, `phone`, `status`).

- **Request Body**: (Must provide at least one field)

```json
{
  "status": "contacted",
  "phone": "+1-555-9999"
}
```

- **Status Codes**:
  - `200 OK`: Successfully updated
  - `400 Bad Request`: Validation error or empty request body
  - `404 Not Found`: Lead does not exist
  - `409 Conflict`: Email update conflicts with another lead

#### `DELETE /api/leads/:id`

Delete a lead and cascade delete all associated notes.

- **Status Codes**:
  - `204 No Content`: Successfully deleted
  - `404 Not Found`: Lead does not exist

---

### 3. Notes Endpoints (Nested Resource)

#### `GET /api/leads/:id/notes`

Retrieve all notes belonging to a specific lead ordered newest first.

- **Status Codes**:
  - `200 OK`: Notes list returned (or empty list if lead has no notes)
  - `404 Not Found`: Lead does not exist

#### `POST /api/leads/:id/notes`

Create a new note attached to a specific lead.

- **Request Body**:

```json
{
  "content": "Follow-up discussion scheduled for next Friday."
}
```

- **Status Codes**:
  - `201 Created`: Note created
  - `400 Bad Request`: Empty content or exceeding 2000 characters
  - `404 Not Found`: Lead does not exist

---

### Standard Error Response Contract

All errors follow a unified structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## Testing & Test Isolation Strategy

Testing is powered by **Jest**, **Supertest**, and **SWC**:

```bash
# Run all 28 automated integration tests
npm test
```

### Test Isolation Design

To ensure tests **never** delete, overwrite, or mutate your development data:

1. `tests/env.setup.ts` overrides `NODE_ENV=test` and `DATABASE_URL=file:./test.db` before any source modules load.
2. `tests/setup.ts` creates/synchronizes `prisma/test.db` instantly by copying the development schema structure.
3. Every test case runs inside an isolated table lifecycle (`beforeEach` resets `Note` and `Lead` records in `test.db`).
4. `prisma/dev.db` remains 100% untouched.

---

## Linting & Code Formatting

Ensure code standards and formatting consistency across the team:

```bash
# Check code with ESLint
npm run lint

# Verify code formatting with Prettier
npm run format

# Automatically format all files
npm run format:fix
```

---

## Docker Deployment & SQLite Persistence

A multi-stage [`Dockerfile`](file:///c:/Users/Dell/OneDrive/Desktop/Prerna%20Data/2026_skills/lead-management-backend/Dockerfile) is included to build and run the backend as a lightweight, containerized service:

```bash
# 1. Build the Docker container image
docker build -t lead-management-backend .

# 2. Run container with persistent SQLite volume mounting
docker run -d \
  -p 3000:3000 \
  -v lead_data:/app/prisma \
  --name lead-backend \
  lead-management-backend
```

### Volume Mounting Explained

SQLite is a disk-file database. The volume `-v lead_data:/app/prisma` ensures that `dev.db` persists across container restarts, stops, and deployments without data loss.

---

## Architecture Deep Dive: Request Flow

Here is a step-by-step trace of how a request flows through the codebase when creating a lead via `POST /api/leads`:

1. **HTTP Arrival**: The client sends a `POST /api/leads` with JSON body `{ "name": "Sarah", "email": "sarah@acme.com" }`.
2. **Global Middlewares (`src/app.ts`)**:
   - `cors()` sets cross-origin headers.
   - `express.json({ limit: '100kb' })` parses the body.
3. **Route & Validation Layer (`src/modules/leads/leads.routes.ts`)**:
   - The route matches `POST /`.
   - `validate({ body: createLeadSchema })` invokes Zod against `req.body`.
   - If invalid, Zod throws a `ValidationError` which skips controllers and goes straight to the error handler.
4. **Controller (`src/modules/leads/leads.controller.ts`)**:
   - Calls `leadsService.createLead(req.body)`.
5. **Service Layer (`src/modules/leads/leads.service.ts`)**:
   - Executes business rules: queries `leadsRepository.findByEmail(dto.email)`.
   - If an existing lead is found, throws `ConflictError('A lead with email already exists')` (mapped to HTTP 409).
   - If unique, calls `leadsRepository.create(dto)`.
6. **Repository Layer (`src/modules/leads/leads.repository.ts`)**:
   - Invokes `prisma.lead.create({ data: ... })`.
7. **Database Response**:
   - SQLite executes the parameterized `INSERT INTO Lead ...`.
   - Returns the created record with auto-incremented `id` and `createdAt` timestamp.
8. **Controller Response**:
   - Returns `res.status(201).json({ success: true, data: lead })`.

---

## Troubleshooting & Common Issues

### 1. `DATABASE_URL` Mismatch

- **Issue**: Prisma cannot find the database or creates a database at an unexpected location.
- **Explanation**: In Prisma 6 with SQLite, relative paths such as `file:./dev.db` are resolved relative to the directory containing `schema.prisma` (`prisma/dev.db`), not the root project folder. Keep `DATABASE_URL="file:./dev.db"` in `.env`.

### 2. Express 5 `req.query` Getter Restriction

- **Issue**: `TypeError: Cannot set property query of [object Object] which has only a getter`.
- **Explanation**: In Express 5, `req.query` has only a getter. In [`src/middlewares/validate.middleware.ts`](file:///c:/Users/Dell/OneDrive/Desktop/Prerna%20Data/2026_skills/lead-management-backend/src/middlewares/validate.middleware.ts), query parameters are updated via `Object.assign(req.query, validatedData)` rather than reassigning the property.

### 3. File Lock on Windows (`dev.db-journal` / EPERM)

- **Issue**: SQLite temporary journal files locked by another process during testing or migrations.
- **Fix**: Disconnect Prisma clients properly (`prisma.$disconnect()`). In `src/server.ts`, graceful shutdown listeners disconnect Prisma cleanly on `SIGINT` and `SIGTERM`.
