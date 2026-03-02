# AGENTS.md

## Must-follow constraints
- Keep all backend and test projects on .NET 10 (`net10.0`) and keep `global.json` pinned to `10.0.103`.
- Do not commit real secrets. Only placeholders are allowed in `.env.example`, `docker-compose.yml`, and `appsettings*.json`.
- Preserve fail-fast config guards in `src/ChatApp.Infrastructure/DependencyInjection.cs`:
  - `ConnectionStrings:DefaultConnection` is required.
  - `JwtSettings:Secret` is required and must be at least 32 characters.
- Keep API response contract backward-compatible (`isSuccess`, `error`, optional `value`) unless explicitly asked to change it.
- Keep QA tooling disabled by default (`VITE_ENABLE_QA_CONSOLE=false`).

## Validation before finishing
- `dotnet restore ChatApp.sln`
- `dotnet build ChatApp.sln`
- `dotnet test ChatApp.sln`
- `cd src/ChatApp.Web && npm ci && npm run build`
- If API/web/auth/chat/realtime/docker files changed: `cd src/ChatApp.Web && npm run test:e2e`

## Repo-specific conventions
- `src/ChatApp.Web/scripts/run-e2e.mjs` intentionally runs `docker compose down -v --remove-orphans` before/after E2E. This wipes local compose volumes.
- API migration/seed is executed on startup with retry in `src/ChatApp.API/Program.cs`; keep this retry behavior.
- Compose uses env-driven secrets (`POSTGRES_PASSWORD`, `JWT_SECRET`). Keep docs and examples aligned when changing compose.

## Important locations
- `src/ChatApp.API/Program.cs`
- `src/ChatApp.Infrastructure/DependencyInjection.cs`
- `src/ChatApp.Web/scripts/run-e2e.mjs`
- `.github/workflows/ci.yml`
- `.github/workflows/security-scan.yml`

## Change safety rules
- Do not change migrations/schema or token lifecycle semantics unless explicitly requested.
- Keep SignalR routes/method contracts backward-compatible (`/hubs/chat`, `/hubs/notifications`).
- Do not broaden production exposure defaults (CORS/QA/security flags).
