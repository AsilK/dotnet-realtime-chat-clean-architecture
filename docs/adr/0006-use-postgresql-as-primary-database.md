# ADR-0006: Use PostgreSQL as Primary Database

- Status: Accepted

## Context
Need strong relational integrity, indexing, and mature tooling.

## Decision
Use PostgreSQL with EF Core provider.

## Consequences
- Positive: robust SQL features and reliability.
- Negative: requires SQL tuning at scale.

## Alternatives
Document databases or SQL Server.
