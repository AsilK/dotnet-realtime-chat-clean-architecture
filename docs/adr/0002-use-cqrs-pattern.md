# ADR-0002: Use CQRS Pattern with MediatR

- Status: Accepted

## Context
Command and query behaviors differ and need pipeline policies.

## Decision
Use MediatR requests/handlers with pipeline behaviors.

## Consequences
- Positive: clear use-case boundaries.
- Negative: extra indirection for simple flows.

## Alternatives
Service classes with direct controller calls.
