# ADR-0007: Use Repository Pattern with Unit of Work

- Status: Accepted

## Context
Need explicit data access contracts in Application layer.

## Decision
Use repository abstractions + unit of work.

## Consequences
- Positive: persistence abstraction and test seam.
- Negative: added abstraction over EF Core.

## Alternatives
Direct DbContext usage in handlers.
