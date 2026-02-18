# ADR-0005: Use JWT for Authentication

- Status: Accepted

## Context
Need stateless authentication for API and hub connections.

## Decision
Use JWT access tokens with rotating refresh tokens.

## Consequences
- Positive: stateless auth for distributed APIs.
- Negative: token revocation complexity.

## Alternatives
Cookie/session-based auth.
