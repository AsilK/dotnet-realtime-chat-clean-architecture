# ADR-0001: Use Clean Architecture

- Status: Accepted

## Context
Need strict separation of concerns and long-term maintainability.

## Decision
Adopt Domain/Application/Infrastructure/API layering.

## Consequences
- Positive: testability, replaceable infrastructure.
- Negative: more initial boilerplate.

## Alternatives
Layered monolith without strict dependency control.
