# AuthN API

Authentication management API service. Built with [better-auth](https://www.better-auth.com/) + [Hono](https://hono.dev/) + [Drizzle ORM](https://orm.drizzle.team/).

## Getting Started

Start the development server:

```bash
pnpm dev
```

The server runs at [http://localhost:10000](http://localhost:10000).

## Environment Variables

The following environment variables are required (loaded from `.env` in root directory):

```bash
DATABASE_URL_AUTH=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:10000
INTERNAL_API_SECRET=internal_shared_secret_key
```

## Database

### Generate migrations

```bash
pnpm db:generate
```

### Run migrations

```bash
pnpm db:migrate
```

### Seed data

```bash
pnpm db:seed
```

### Drizzle Studio

```bash
pnpm db:studio
```

## API Endpoints

### Better Auth Endpoints

Authentication endpoints provided by better-auth:

- `POST /api/auth/sign-up/email` - User registration with email
- `POST /api/auth/sign-in/email` - Login with email
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get session information
- `GET /api/auth/jwks` - JWT public key (JWKS) endpoint

### Admin Endpoints (Internal API)

- `GET /api/admin/users` - Get user list (authenticated via X-Internal-Secret header)

## Authentication & Authorization

### JWT Authentication

JWT tokens signed with EdDSA algorithm are issued via better-auth's JWT plugin.
Other services can retrieve the public key from the `/api/auth/jwks` endpoint for verification.

### Internal API Authentication

Admin endpoints use internal authentication via the `X-Internal-Secret` header.

## Tech Stack

- [Hono](https://hono.dev/) - Web framework
- [better-auth](https://www.better-auth.com/) - Authentication library
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
- [PostgreSQL](https://www.postgresql.org/) - Database (Port 6000)
- [jose](https://github.com/panva/jose) - JWT processing

## Directory Structure

```
src/
├── index.ts           # Entry point
├── auth.ts            # better-auth configuration
├── db/
│   ├── index.ts       # Database connection
│   └── schema.ts      # Drizzle schema
├── middleware/
│   └── internal-auth.ts  # Internal API auth middleware
└── routes/
    └── admin.ts       # Admin API
```
