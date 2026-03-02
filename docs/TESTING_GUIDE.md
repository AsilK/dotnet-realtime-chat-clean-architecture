# Testing Guide

This document describes the test layers, commands, and acceptance criteria for the project.

## 1. Test Pyramid

### Unit Tests

- Locations:
  - `tests/ChatApp.Domain.UnitTests`
  - `tests/ChatApp.Application.UnitTests`
- Scope:
  - domain rules
  - validation and handler behavior

### Integration Tests

- Location: `tests/ChatApp.Infrastructure.IntegrationTests`
- Scope:
  - infrastructure services
  - repository and dependent infrastructure behavior

### Functional Tests

- Location: `tests/ChatApp.API.FunctionalTests`
- Scope:
  - API smoke tests and baseline HTTP behavior

### End-to-End Tests (Web)

- Location: `src/ChatApp.Web/tests/e2e`
- Scope:
  - register/login/logout
  - room and message workflows
  - real-time typing/presence/read events
  - 401 -> refresh -> continue flow

## 2. Command Set

### Backend build and tests

```bash
dotnet build
dotnet test
```

### Coverage script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-coverage.ps1
```

### Frontend build

```bash
cd src/ChatApp.Web
npm run build
```

### E2E (with Docker stack lifecycle)

```bash
cd src/ChatApp.Web
npm run test:e2e
```

### E2E (stack already running)

```bash
cd src/ChatApp.Web
npm run test:e2e:local
```

## 3. CI Behavior

Pipeline order:

1. .NET restore
2. .NET build
3. .NET test
4. frontend dependency install
5. Playwright browser install
6. E2E tests

Expectation: all steps pass before PR merge.

## 4. Test Data and Isolation

- Unit tests should remain isolated and deterministic.
- Integration/functional tests should define external dependencies explicitly.
- E2E tests should create and clean up their own data where possible.

## 5. Realtime Test Recommendations

- Validate with at least two independent sessions.
- Observe `UserTyping`, `UserJoinedRoom`, and `MessageRead` events directly.
- Verify room membership behavior after reconnect.

## 6. Failure Diagnostics Strategy

- On E2E failure, inspect screenshots/videos/artifacts.
- Assert API-level `isSuccess/error` payloads directly.
- Validate `details[]` for expected validation failure content.

## 7. Test Acceptance Criteria

- Each new feature must be covered by at least one test layer.
- Critical auth/permission changes require unit + functional coverage.
- UI flow changes should be reflected in at least one E2E scenario.

## 8. Stability Recommendations

- For time-dependent tests, use fixed clock inputs or bounded tolerances.
- For async event tests, rely on deterministic wait conditions.
- Prevent shared file/port contention when running tests in parallel.
