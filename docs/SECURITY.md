# Security

## Authentication

- JWT bearer tokens for API and SignalR.
- Rotating refresh token flow with token hash persistence.

## Password Policy

- Min 8 chars, uppercase, lowercase, number, special char.

## Token Design

- Access token: short-lived (default 15 minutes).
- Refresh token: longer-lived (default 7 days), hash stored server-side.

## Input Validation

- FluentValidation for command/query validation.

## Transport and Headers

- HTTPS recommended in production.
- CORS policy configured explicitly.

## OWASP Mitigations

- Validation layer for untrusted input.
- Central exception handling.
- Structured security logging with Serilog.

## Rate Limiting

- Auth: 5/min
- API: 100/min
- SignalR action limits documented and designed for policy extension.

## Audit Logging

- Request/response metadata logs and error logs via middleware.
