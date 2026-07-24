# Construction Quotation Studio

A full-stack SaaS application for construction companies to create, manage, and share professional project quotations with clients. Built with React 19 and NestJS.

## Key Features

- **Cost Library** — Manage categories, items, brands, rate tiers, and units of measurement
- **Dynamic Quotations** — Build quotations with auto-calculated totals, tax, discounts, and multi-tier pricing
- **Client Portal** — Share quotations via secure links; clients can view, select options, and submit preferences
- **PDF Export** — Generate branded PDF quotations on the server
- **Analytics Dashboard** — Track quotation conversion rates, revenue trends, and item popularity
- **Audit Logs** — Full traceability of all data changes
- **Multi-currency Support** — PKR, USD, AED, SAR, GBP

---

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Frontend    | React 19, Vite, Material UI 9, TanStack Query, Zustand, React Hook Form + Zod |
| Backend     | NestJS 11, Prisma ORM 7, Passport JWT, PDFKit    |
| Database    | PostgreSQL 16                                     |
| DevOps      | Docker, Docker Compose, Nginx                     |

---

## Prerequisites

- **Node.js** 20+ (LTS)
- **PostgreSQL** 16+ (or use Docker)
- **npm** 10+
- **Docker & Docker Compose** (optional — for containerized deployment)

---

## Quick Start (Local Development)

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Dynamic Quotation Application"
```

### 2. Set up the backend

```bash
cd server
cp .env.example .env          # Configure your database URL and secrets
npm install
npm run prisma:generate       # Generate Prisma client
npm run prisma:migrate        # Run database migrations
npm run seed                  # Seed default data (admin user, categories, items, etc.)
npm run start:dev             # Start dev server on http://localhost:3000
```

### 3. Set up the frontend

```bash
cd client
cp .env.example .env          # Defaults to http://localhost:3000/api/v1
npm install
npm run dev                   # Start Vite dev server on http://localhost:5173
```

### 4. Open the app

- **Admin Panel:** http://localhost:5173
- **API:** http://localhost:3000/api/v1

---

## Docker Deployment

Deploy the entire stack (PostgreSQL + API + Client) with a single command:

```bash
# From the project root
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **API Server** on port 3000 (auto-runs migrations on first boot)
- **Client (Nginx)** on port 80

To run database seeding after first deployment:

```bash
docker-compose exec server npx ts-node src/seed.ts
```

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (wipes database):

```bash
docker-compose down -v
```

---

## Project Structure

```
├── client/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks (API calls)
│   │   ├── layouts/        # Admin, Auth, Client layouts
│   │   ├── lib/            # Axios instance, query client
│   │   ├── pages/          # Route pages
│   │   └── store/          # Zustand state stores
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── auth/           # JWT authentication (admin + client)
│   │   ├── brands/         # Brand management
│   │   ├── categories/     # Category CRUD
│   │   ├── customers/      # Customer management
│   │   ├── items/          # Cost library items
│   │   ├── quotations/     # Quotation builder + PDF
│   │   ├── analytics/      # Dashboard analytics
│   │   ├── audit-logs/     # Audit trail
│   │   ├── settings/       # Company settings
│   │   ├── common/         # Filters, interceptors, guards
│   │   └── seed.ts         # Database seeder
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # Migration history
│   └── Dockerfile
├── docs/                   # Business rules, DB schema, API contract
├── docker-compose.yml      # Full-stack Docker orchestration
└── .env.example            # Environment variable template
```

---

## Available Scripts

### Server (`cd server`)

| Script                | Description                          |
| --------------------- | ------------------------------------ |
| `npm run start:dev`   | Start in watch mode                  |
| `npm run build`       | Compile to `dist/`                   |
| `npm run start:prod`  | Run compiled production build        |
| `npm run seed`        | Seed the database with default data  |
| `npm run prisma:migrate` | Create and apply a new migration  |
| `npm run prisma:generate` | Regenerate Prisma client         |
| `npm run prisma:deploy` | Apply pending migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio GUI             |
| `npm run test`        | Run unit tests                       |

### Client (`cd client`)

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Vite dev server (port 5173)      |
| `npm run build`     | Production build to `dist/`            |
| `npm run preview`   | Preview production build locally       |
| `npm run lint`      | Run OxLint                             |

---

## API Documentation

Full API contract is available at [`docs/03-API-CONTRACT.md`](./docs/03-API-CONTRACT.md).

Base URL: `http://localhost:3000/api/v1`

### Core Endpoints

| Resource       | Endpoint                    |
| -------------- | --------------------------- |
| Auth           | `POST /auth/login`          |
| Categories     | `/categories`               |
| Items          | `/items`                    |
| Brands         | `/brands`                   |
| Rate Tiers     | `/rate-tiers`               |
| Units          | `/units`                    |
| Customers      | `/customers`                |
| Quotations     | `/quotations`               |
| Client Portal  | `/client/*`                 |
| Analytics      | `/analytics`                |
| Audit Logs     | `/audit-logs`               |
| Settings       | `/settings`                 |

---

## Default Credentials

| Role  | Email                         | Password  |
| ----- | ----------------------------- | --------- |
| Admin | `admin@quotationstudio.com`   | `admin123` |

> Change these immediately in production.

---

## Environment Variables

| Variable              | Description                         | Default                          |
| --------------------- | ----------------------------------- | -------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string         | `postgresql://postgres:postgres@localhost:5432/quotation_studio?schema=public` |
| `JWT_SECRET`          | Secret key for admin JWT tokens      | —                                |
| `JWT_EXPIRES_IN`      | Admin token expiry                   | `7d`                             |
| `CLIENT_JWT_SECRET`   | Secret key for client portal tokens  | —                                |
| `CLIENT_JWT_EXPIRES_IN` | Client token expiry                | `24h`                            |
| `PORT`                | API server port                      | `3000`                           |
| `NODE_ENV`            | Environment (`development`/`production`) | `development`               |
| `VITE_API_URL`        | API URL for the frontend (build-time) | `http://localhost:3000/api/v1`  |

---

## License

Private — All rights reserved.
