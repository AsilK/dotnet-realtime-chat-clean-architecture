# Security

This document summarizes implemented controls, security assumptions, and operational responsibilities for ChatApp.

## 1. Threat Model Summary

Protected assets:

- user credentials and token material
- message content and room membership data
- refresh token storage and email token workflows

Primary threats:

- unauthorized access
- token leakage or replay
- brute-force and abuse traffic
- real-time channel flooding
- CORS/transport misconfiguration

## 2. Authentication and Session Model

- API and hub access require JWT Bearer authentication.
- Access tokens are short-lived.
- Refresh tokens are longer-lived and stored hashed server-side.
- Refresh rotates token pairs and invalidates previous token state.
- Logout revokes refresh token server-side.

## 3. Token Security

- Access token claims: `NameIdentifier`, `Name`, `Email`, `Role`
- JWT validation includes issuer, audience, signature, and expiration checks
- `ClockSkew`: 30 seconds
- Hub authentication accepts `access_token` query string under `/hubs`

Important notes:

- Web default token storage is `sessionStorage`.
- `VITE_TOKEN_STORAGE=local` increases persistence but also XSS impact.

## 4. Validation and Error Handling

- FluentValidation enforces centralized request validation.
- Validation errors return HTTP 400 with structured detail list.
- Unhandled errors return HTTP 500 with sanitized response payload.
- Server-side details are logged; stack traces are not returned to clients.

## 5. Rate Limiting

- Auth endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- Hub-level memory-cache limits on `SendTypingIndicator` and `MarkMessageAsRead`

These controls reduce abuse impact but should be complemented by edge/WAF controls.

## 6. HTTP Security Headers

Current middleware headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `X-XSS-Protection: 1; mode=block`

Recommended hardening:

- add `Content-Security-Policy`
- add `Strict-Transport-Security` in production

## 7. CORS Status

Current CORS policy remains permissive for development productivity:

- `AllowAnyHeader`
- `AllowAnyMethod`
- `AllowCredentials`
- `SetIsOriginAllowed(_ => true)`

This is not acceptable for production. Use explicit origin allowlists.

## 8. Email and Secret Management

- SMTP settings are provided via environment/configuration.
- SMTP credentials must not be committed to source control.
- Queue-based email dispatch includes retries/backoff for transient failure.

## 9. Data Protection

- Refresh tokens are stored hashed.
- Chat and profile data persist in PostgreSQL.
- Redis stores transient runtime state.

Additional recommendations:

- storage-level encryption for persistent data
- encrypted backups
- auditable access logs for sensitive data domains

## 10. Operational Security Controls

- define JWT secret rotation procedure
- run dependency vulnerability scans regularly
- integrate logs with centralized SIEM where required
- keep incident response runbook tested and current

## 11. Known Gaps

- production CORS hardening is required
- container data-protection key persistence should be hardened
- QA panel exposure must remain release-gated

## 12. Security Testing Recommendations

- brute-force simulation on auth endpoints
- refresh token replay tests
- hub flood tests
- negative CORS configuration tests
- automated SCA and secret-scanning in CI
