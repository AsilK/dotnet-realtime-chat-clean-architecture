# Technology Stack

This document summarizes the technology choices used in ChatApp and their operational implications.

## Platform and Language

| Area | Technology | Version | Rationale |
| --- | --- | --- | --- |
| Runtime | .NET | 10.0 | Current major runtime with latest platform features |
| Language | C# | 13 | Strong type safety and mature async ecosystem |
| Frontend Runtime | Node.js | 20 | Stable LTS for Vite and Playwright |
| Frontend Language | TypeScript | 5.9.x | Type safety and maintainability |

## Backend Frameworks and Libraries

| Layer | Technology | Version | Usage |
| --- | --- | --- | --- |
| API | ASP.NET Core | 10.0 | REST API, middleware pipeline, DI |
| Realtime | SignalR | 10.0.0 | Room-level real-time communication |
| CQRS | MediatR | 12.4.1 | Command/query separation |
| Validation | FluentValidation | 11.11.0 | Request validation rules |
| Mapping | AutoMapper | 12.0.1 | Domain/DTO mapping |
| Logging | Serilog | 8.0.3 + sinks | Structured logging to console and Seq |
| Auth | JwtBearer | 10.0.0 | JWT validation for API and hubs |

## Data and Infrastructure

| Component | Technology | Version | Usage |
| --- | --- | --- | --- |
| Relational DB | PostgreSQL | 16 (Docker image) | Durable data store |
| ORM | EF Core + Npgsql | 10.0.0 | Data access and migrations |
| Cache / Backplane | Redis + StackExchange.Redis | 7 / 2.8.16 | Caching and SignalR backplane |
| Search support | `pg_trgm` | PostgreSQL extension | Trigram indexes for message/user search |
| Observability | Seq | latest (Docker image) | Centralized log analysis |

## Frontend Technologies

| Area | Technology | Version | Usage |
| --- | --- | --- | --- |
| UI | React | 19.2 | Component-driven interface |
| Routing | react-router-dom | 7.13 | Route and guard management |
| HTTP Client | axios | 1.13 | API access with auth interceptors |
| Server State | @tanstack/react-query | 5.90 | Query caching and synchronization |
| Realtime Client | @microsoft/signalr | 10.0 | Hub communication |
| Validation | zod | 4.3 | Form payload validation |
| Build Tool | Vite | 7.3 | Fast dev/build workflow |

## Testing and CI Tooling

| Area | Technology | Version | Usage |
| --- | --- | --- | --- |
| Unit Tests | xUnit | 2.9.2 | Domain and application unit coverage |
| Functional Tests | Microsoft.AspNetCore.Mvc.Testing | 10.0.0 | API smoke and behavior tests |
| E2E | Playwright | 1.58 | Browser-level regression coverage |
| Test Host | Microsoft.NET.Test.Sdk | 17.12.0 | .NET test runner integration |
| CI | GitHub Actions | hosted | Build, test, E2E, and security scanning |

## Practical Effects of Architecture Choices

### Clean Architecture + CQRS

- Business logic remains isolated and testable.
- Change impact is easier to reason about.
- Trade-off: more files and abstraction overhead.

### SignalR + Redis

- Real-time delivery scales across multiple API instances.
- Trade-off: Redis becomes a critical runtime dependency.

### EF Core + PostgreSQL

- Migration-based schema management is straightforward.
- Trade-off: requires continuous query and index discipline.

### React + Vite + Playwright

- Fast development loop and strong regression protection.
- Trade-off: E2E suite maintenance cost grows with UI complexity.

## Technical Debt and Improvement Targets

- Harden CORS and secret management policies per environment.
- Keep QA tooling disabled in production builds by policy and release checks.
- Add bundle budget enforcement to CI.
