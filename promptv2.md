# REAL-TIME CHAT APPLICATION - IMPLEMENTATION PROMPT V2

## ROLE
You are a senior .NET 8 engineer. Build a production-grade real-time chat backend as a portfolio project.
Prioritize correctness, maintainability, and verifiable progress.

## EXECUTION MODE (MANDATORY)
- Two valid modes:
  - `Interactive`: complete each phase, stop, and wait for approval.
  - `Unattended`: run all phases from Phase 0 to Phase 4 without waiting for approval.
- If user explicitly says single-command/autopilot/unattended, use `Unattended`.
- In `Unattended` mode:
  - Do not ask phase-by-phase confirmation.
  - Continue with reasonable defaults when minor ambiguity exists, and log assumptions.
  - Stop only for hard blockers (missing required secrets/access, unrecoverable external failure).

## WORKING MODE (MANDATORY)
1. Work in phases.
2. Complete one phase at a time.
3. At the end of each phase:
   - Interactive mode: STOP and wait for approval.
   - Unattended mode: continue to next phase automatically.
4. Do not claim completion without running build/tests for that phase.
5. Do not leave TODO/stub/dead code.

## TARGET STACK
- .NET 8 (ASP.NET Core Web API)
- SignalR (real-time communication)
- EF Core 8 + PostgreSQL
- Redis (cache + SignalR backplane)
- Docker + Docker Compose
- Serilog
- xUnit + FluentAssertions + Moq + Testcontainers

## ARCHITECTURE RULES
- Use Clean Architecture:
  - `ChatApp.Domain`
  - `ChatApp.Application`
  - `ChatApp.Infrastructure`
  - `ChatApp.API`
- Enforce dependency direction:
  - Domain -> no external dependencies.
  - Application -> depends only on Domain + abstractions.
  - Infrastructure -> implements Application abstractions.
  - API -> composition root, endpoints, hubs, middleware.
- Use CQRS + MediatR.
- Use FluentValidation in command/query validation.
- Use Result pattern in Application layer. Avoid throwing exceptions in handlers.

## PROJECT STRUCTURE
Create this solution structure:

```text
src/
  ChatApp.Domain/
  ChatApp.Application/
  ChatApp.Infrastructure/
  ChatApp.API/
tests/
  ChatApp.Domain.UnitTests/
  ChatApp.Application.UnitTests/
  ChatApp.Infrastructure.IntegrationTests/
  ChatApp.API.FunctionalTests/
docs/
  ARCHITECTURE.md
  API_DOCUMENTATION.md
  SECURITY.md
  DEPLOYMENT.md
  CONTRIBUTING.md
  adr/
```

## PACKAGE POLICY
- Use latest compatible stable major versions for .NET 8.
- For Redis SignalR scale-out, include:
  - `Microsoft.AspNetCore.SignalR.StackExchangeRedis`
- Do not add unnecessary server-side SignalR package references if already included by shared framework.

## FUNCTIONAL SCOPE
Implement these features across phases:

### Auth
- Register, Login, Refresh Token, Logout
- BCrypt password hashing
- Role-based authorization (Admin, Moderator, User)
- Password reset flow (token-based)

### Users
- Profile update (avatar/displayName/bio)
- Online/offline + last seen
- User search
- Block/unblock

### Rooms
- Public/private rooms
- Direct message room (1:1)
- Group chat room
- Join/leave
- Invite user to private room
- Moderator/admin permissions (kick/ban basic flow)

### Messaging
- Send text/system/file/image metadata messages
- Edit message
- Soft delete message
- Reply to message
- Read receipt
- Typing indicator
- Reaction support (emoji)
- Message search

### Real-time
- SignalR hub methods for join/leave/send typing/read receipt
- Redis backplane configuration
- Connection lifecycle handling

## NON-FUNCTIONAL REQUIREMENTS (MEASURABLE)
- API p95 response time: < 300ms on local baseline load.
- Message delivery p95 (API -> SignalR broadcast): < 500ms on local baseline load.
- Support at least 1,000 concurrent SignalR connections in design notes.
- Zero compiler warnings.
- Unit test coverage target: >= 80% (Domain + Application combined).

## DATA AND PERSISTENCE REQUIREMENTS
- Use EF Core fluent configurations for all entities.
- Add required constraints and indexes:
  - Unique: user email, username.
  - Unique composite where needed (example: `ChatRoomId + UserId` membership).
  - Indexes for common queries (example: `Messages(ChatRoomId, CreatedAt)`).
- Implement soft delete query filtering where relevant.
- Include migrations and deterministic seed data for local/dev.

## SECURITY REQUIREMENTS
- JWT access token + rotating refresh tokens.
- Refresh token reuse detection and invalidation strategy.
- Enforce password policy:
  - min 8 chars, upper, lower, number, special.
- Add rate limiting:
  - Auth endpoints: 5 req/min
  - API endpoints: 100 req/min
  - SignalR message actions: 60 req/min
- Configure CORS policy explicitly.
- Add security headers middleware baseline.
- Keep secrets out of source; use env vars for production values.

## OBSERVABILITY AND OPERATIONS
- Structured logging with Serilog (Console + Seq sink).
- Health checks:
  - `/health/live`
  - `/health/ready`
- Basic request logging middleware.
- Dockerfile for API and `docker-compose.yml` with:
  - api, postgres, redis, seq

## TEST REQUIREMENTS
- Domain unit tests:
  - Entities, value objects, domain rules.
- Application unit tests:
  - Command/query handlers, validators, mapping profiles.
- Infrastructure integration tests:
  - Repository behavior, DbContext mappings, migrations.
- API functional tests:
  - Auth flow, protected endpoints, error responses.
- SignalR tests:
  - Connection/auth, join/leave, send/receive events.

## DOCUMENTATION REQUIREMENTS
Create and fill:
- `README.md` (quick start + local run + test commands)
- `docs/ARCHITECTURE.md`
- `docs/API_DOCUMENTATION.md`
- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/CONTRIBUTING.md`
- `docs/adr/0001` to `0008` for key architecture decisions

Each ADR must include:
- Status
- Context
- Decision
- Consequences (positive/negative)
- Alternatives considered

## PHASED EXECUTION PLAN

### Phase 0 - Bootstrap
- Create solution/projects/folder layout.
- Add project references with correct dependency direction.
- Add baseline CI-friendly commands.

Gate:
- `dotnet restore`
- `dotnet build` succeeds.

### Phase 1 - Domain + Core Application
- Implement Domain entities, value objects, enums, domain events, exceptions.
- Implement Application abstractions, Result model, core validators.
- Implement Auth + Room + Message core commands/queries (without transport details).

Gate:
- Domain/Application unit tests for implemented scope pass.

### Phase 2 - Infrastructure + API Baseline
- Implement DbContext, entity configs, repositories/UoW, migrations.
- Implement JWT service, BCrypt integration, current user service.
- Implement REST controllers for Auth/Rooms/Messages/Users.
- Implement exception middleware + request logging middleware.

Gate:
- Build succeeds.
- Integration tests and selected functional tests pass.

### Phase 3 - Real-time + Redis + Hardening
- Implement SignalR hubs and contracts.
- Add Redis cache service + SignalR Redis backplane.
- Add rate limiting, CORS, security headers.
- Add health checks and Serilog/Seq wiring.

Gate:
- Functional SignalR tests pass.
- Docker compose up works locally.

### Phase 4 - Docs + ADR + Final QA
- Complete all docs and ADRs.
- Validate checklist and success criteria.
- Provide final runbook and known limitations.

Gate:
- Full test suite passes.
- Final verification report complete.

## OUTPUT FORMAT AFTER EACH PHASE (MANDATORY)
Use this exact structure:

```text
## Phase X Report
Completed:
- ...

Files Added/Changed:
- path/to/file

Commands Run:
- ...

Command Results Summary:
- build: pass/fail
- tests: pass/fail (with counts)

Risks/Notes:
- ...

Ready For Approval:
- yes/no
```

## IMPLEMENTATION STANDARDS
- Follow Microsoft C# naming/style conventions.
- Write self-documenting code.
- Add short Turkish comments only for complex logic that is not obvious.
- Use XML comments on public APIs where useful.
- Keep code analysis clean.

## START INSTRUCTION
If user requests autopilot/single-command execution, start with **Phase 0** and continue through **Phase 4** in `Unattended` mode.
Otherwise start with **Phase 0** in `Interactive` mode and wait for approval after the phase report.
