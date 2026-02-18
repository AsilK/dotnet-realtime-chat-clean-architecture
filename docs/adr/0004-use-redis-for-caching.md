# ADR-0004: Use Redis for Caching and SignalR Backplane

- Status: Accepted

## Context
Need distributed cache and horizontal SignalR scale-out.

## Decision
Use Redis for cache and hub backplane integration.

## Consequences
- Positive: shared state and scale-out support.
- Negative: additional operational dependency.

## Alternatives
In-memory cache per node.
