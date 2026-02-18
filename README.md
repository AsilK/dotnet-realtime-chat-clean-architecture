# ChatApp

Real-time chat backend built with .NET 8, Clean Architecture, CQRS, SignalR, PostgreSQL, and Redis.

## Quick Start

1. Start full stack (API + PostgreSQL + Redis + Seq):
```bash
docker compose up -d --build
```
2. Health checks:
```bash
curl http://localhost:5000/health/live
curl http://localhost:5000/health/ready
```
3. Optional local run without Docker:
```bash
dotnet run --project src/ChatApp.API/ChatApp.API.csproj
```

## Test Commands

```bash
dotnet test ChatApp.sln
```

## Coverage

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-coverage.ps1
```

Coverage output:
- `coverage-report/Summary.txt`
- `coverage-report/index.html`

## Solution Structure

- `src/ChatApp.Domain`
- `src/ChatApp.Application`
- `src/ChatApp.Infrastructure`
- `src/ChatApp.API`
- `tests/*`
- `docs/*`
