# ADR-0008: Use FluentValidation for Input Validation

- Status: Accepted

## Context
Need centralized and composable input validation.

## Decision
Use FluentValidation integrated into MediatR pipeline.

## Consequences
- Positive: consistent validation rules.
- Negative: additional dependency and setup.

## Alternatives
Data annotations only.
