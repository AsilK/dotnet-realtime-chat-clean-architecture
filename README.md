# ChatApp

ChatApp is a production-oriented real-time messaging platform built on .NET 10. The solution combines clean architecture boundaries, CQRS/MediatR workflows, SignalR real-time channels, PostgreSQL persistence, and Redis-backed distributed messaging support.

License: [MIT](LICENSE)

## Features

- JWT-based authentication with refresh token rotation
- Email verification and password reset workflows
- Room-based messaging with edit/delete, search, and cursor pagination
- SignalR events for typing, read receipts, room join/leave, and user presence
- React web client with an optional QA diagnostics panel
- Unit, integration, functional, and end-to-end test layers

## Measurable Outcomes

- Backend test suites passing on .NET 10 (`dotnet test`)
- End-to-end coverage for core auth and chat flows (`npm run test:e2e`)
- Frontend code-splitting with a reduced largest entry chunk size (`226.65 kB`, gzip `74.51 kB`)

## Documentation Map

- [Architecture](docs/ARCHITECTURE.md)
- [Technology Stack](docs/TECHNOLOGY_STACK.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations Runbook](docs/OPERATIONS_RUNBOOK.md)
- [Security](docs/SECURITY.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Contributing](docs/CONTRIBUTING.md)
- [ADR Index](docs/adr)

## Quick Start

### 1) Start with Docker Compose

Copy `.env.example` to `.env` and replace placeholder secrets before startup.
`POSTGRES_PASSWORD` and `JWT_SECRET` are required for compose startup.

```bash
docker compose up -d --build
```

### 2) Validate service health

```bash
curl http://localhost:5000/health/live
curl http://localhost:5000/health/ready
```

### 3) Open services

- Web: `http://localhost:5173`
- API: `http://localhost:5000`
- Swagger (Development): `http://localhost:5000/swagger`

## Local Development

### API

```bash
dotnet restore ChatApp.sln
dotnet run --project src/ChatApp.API/ChatApp.API.csproj
```

### Web

```bash
cd src/ChatApp.Web
npm ci
npm run dev
```

## Environment Variables

### API-focused

- `ConnectionStrings__DefaultConnection`
- `Redis__ConnectionString`
- `JwtSettings__Secret`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__AccessTokenExpirationMinutes`
- `JwtSettings__RefreshTokenExpirationDays`
- `Smtp__Enabled`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__UseSsl`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`

### Web-focused

- `VITE_API_BASE_URL`
- `VITE_HUB_CHAT_URL`
- `VITE_HUB_NOTIFICATION_URL`
- `VITE_ENABLE_QA_CONSOLE`
- `VITE_TOKEN_STORAGE` (`session` or `local`)

Notes:

- `JwtSettings__Secret` must be at least 32 characters in production.
- QA tools are disabled by default (`VITE_ENABLE_QA_CONSOLE=false`).
- API startup is fail-fast if `ConnectionStrings__DefaultConnection` or `JwtSettings__Secret` is missing.

## Security and Public Repository Readiness

- CI includes automated secret scanning via the `security-scan` workflow (gitleaks).
- Repository files contain only non-production placeholder values.
- Before production deployment:
  - set strong values for `POSTGRES_PASSWORD` and `JWT_SECRET`
  - keep `VITE_ENABLE_QA_CONSOLE=false`

## Validation Commands

### Backend

```bash
dotnet build
dotnet test
```

### Frontend

```bash
cd src/ChatApp.Web
npm run build
```

### End-to-End (with Docker stack)

```bash
cd src/ChatApp.Web
npm run test:e2e
```

## Repository Structure

- `src/ChatApp.Domain`: entities, value objects, domain events, enums
- `src/ChatApp.Application`: command/query handlers, DTOs, pipeline behaviors
- `src/ChatApp.Infrastructure`: EF Core, repositories, JWT, Redis, SMTP, hosted services
- `src/ChatApp.API`: controllers, hubs, middleware, composition root
- `src/ChatApp.Web`: React application and QA tooling
- `tests/*`: unit, integration, and functional test projects
- `docs/*`: architecture, security, deployment, and operations documentation

## Operational Note

To stop the stack:

```bash
docker compose down
```
