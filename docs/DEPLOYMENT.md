# Deployment

This document explains how to deploy ChatApp reliably and securely in Docker-based environments.

## 1. Deployment Topology

The Docker Compose setup includes:

- `web` (Vite/React frontend)
- `api` (ASP.NET Core API + SignalR)
- `postgres` (primary relational database)
- `redis` (cache + SignalR backplane)
- `seq` (centralized log viewer)

Default port mapping:

- `5173` -> web
- `5000` -> api
- `5432` -> postgres
- `6379` -> redis
- `5341` -> seq

## 2. Prerequisites

- Docker Engine + Docker Compose
- Recommended local capacity: at least 4 CPU / 8 GB RAM
- For production: TLS termination at reverse proxy or load balancer

## 3. Quick Start

```bash
docker compose up -d --build
```

Validation:

```bash
curl http://localhost:5000/health/live
curl http://localhost:5000/health/ready
```

Shutdown:

```bash
docker compose down
```

## 4. Configuration Matrix

### Critical API environment variables

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `POSTGRES_PASSWORD` (used by both DB container and API connection string)
- `Redis__ConnectionString`
- `JwtSettings__Secret`
- `JWT_SECRET` (mapped to `JwtSettings__Secret` in compose)
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__AccessTokenExpirationMinutes`
- `JwtSettings__RefreshTokenExpirationDays`
- `Serilog__SeqUrl`

`POSTGRES_PASSWORD` and `JWT_SECRET` must be set before running `docker compose up`.

### SMTP environment variables

- `Smtp__Enabled`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__UseSsl`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`

### Web environment variables

- `VITE_API_BASE_URL`
- `VITE_HUB_CHAT_URL`
- `VITE_HUB_NOTIFICATION_URL`
- `VITE_ENABLE_QA_CONSOLE`
- `VITE_TOKEN_STORAGE`

## 5. Pre-Production Checklist

- JWT secret is random and at least 32 characters
- CORS is restricted to explicit trusted origins
- HTTPS and HSTS are enforced
- PostgreSQL backup job exists and is tested
- Redis persistence/managed strategy is defined
- Seq/APM outputs are integrated into central monitoring
- SMTP credentials are stored in a secret manager
- QA panel is disabled (`VITE_ENABLE_QA_CONSOLE=false`)

## 6. Migrations and Data Management

- Migrations are under `src/ChatApp.Infrastructure/Persistence/Migrations`.
- API startup attempts seed operations; if DB is unavailable, startup logs a warning.
- In production, run migrations as a controlled deploy step.

Example migration command (local):

```bash
dotnet ef database update --project src/ChatApp.Infrastructure --startup-project src/ChatApp.API
```

## 7. Rollback Strategy

- Application rollback: deploy previous image tag
- Database rollback: prefer backup restore over migration down in incident mode
- Configuration rollback: use versioned environment sets

## 8. CI/CD Baseline

Current CI pipeline:

1. `dotnet restore`
2. `dotnet build`
3. `dotnet test`
4. frontend dependency install
5. Playwright browser install
6. `npm run test:e2e`

Recommended production pipeline additions:

- Container vulnerability scan
- IaC policy checks
- Smoke tests (health + auth + send message)
- Progressive rollout (canary or blue/green)

## 9. Monitoring and Alerts

Core metrics:

- API p95 latency
- HTTP 5xx and 429 rates
- active SignalR connections
- Redis connection failures
- DB pool saturation
- SMTP dispatch failure rate

Minimum alert set:

- 5xx > 2% for 5 minutes
- readiness endpoint failing
- Redis unavailable
- sudden increase in JWT validation errors

## 10. Security Warning

The default compose profile is development-oriented. Do not promote it to production unchanged.

Two mandatory hardening actions:

- strict CORS policy
- managed secret handling
