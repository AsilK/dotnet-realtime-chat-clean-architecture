# Contributing

This guide defines technical and process expectations for contributions.

## 1. Engineering Principles

- Correctness is the first priority.
- Respect architecture boundaries.
- Deliver tests and documentation with code changes.
- Avoid unnecessary abstraction and dependency sprawl.

## 2. Branching and Pull Request Flow

- Keep `main` in deployable condition.
- Use a dedicated branch per change.
- Recommended branch naming:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `chore/<short-description>`

PR requirements:

- what changed
- why it changed
- risk and rollback notes
- test evidence (command output or screenshots)

## 3. Code Standards

### Backend

- Follow C# naming conventions and nullable discipline.
- Keep business rules in domain/application layers.
- Keep controllers thin; business logic belongs in handlers.
- Do not bypass pipeline behaviors.

### Frontend

- Preserve feature-based folder structure.
- Keep API/state logic separate from render-only components.
- Keep form validation and error states explicit.
- Review QA panel changes for security exposure.

## 4. Commit Message Format

Recommended format:

```text
type(scope): short summary
```

Examples:

- `feat(chat): add cursor based message loading`
- `fix(auth): handle refresh token race condition`
- `docs(readme): rewrite setup and architecture sections`

## 5. Local Validation Checklist

Before opening a PR, at minimum run:

```bash
dotnet build
dotnet test
```

For frontend changes, also run:

```bash
cd src/ChatApp.Web
npm run build
npm run test:e2e
```

## 6. Documentation Rules

Update documentation for the following changes:

- new endpoints or contract updates
- environment/config changes
- architecture decision updates
- operational behavior changes

Expected files to update where relevant:

- `README.md`
- corresponding `docs/*.md`
- `docs/adr/*` when decisions change

## 7. Review Expectations

A reviewer should be able to answer:

- What problem does this change solve?
- How does it affect current behavior?
- What are likely failure modes?
- How can this be rolled back?

## 8. Disallowed Practices

- committing secrets to source control
- merging critical behavior changes without test evidence
- breaking dependency direction between layers
- leaving production security settings permissive

## 9. Escalation Guidance

For risk-sensitive changes (auth, migrations, rate limits, destructive data paths):

- add impact analysis in PR description
- request at least one additional reviewer
- include rollout/rollback plan
