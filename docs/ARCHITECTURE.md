# Architecture

## System Overview

ChatApp is a layered real-time chat backend focused on maintainability and horizontal scalability.

## Layers

- Domain: Entities, value objects, domain rules, events.
- Application: CQRS handlers, validators, DTOs, interfaces.
- Infrastructure: EF Core persistence, repositories/UoW, JWT, Redis cache.
- API: Controllers, hubs, middleware, composition root.

## Dependency Flow

```mermaid
flowchart LR
  API --> Application
  API --> Infrastructure
  Infrastructure --> Application
  Application --> Domain
  Infrastructure --> Domain
```

## Component Interaction

```mermaid
sequenceDiagram
  participant Client
  participant API
  participant App as Application
  participant Infra as Infrastructure
  participant DB as PostgreSQL
  participant Hub as SignalR

  Client->>API: SendMessageCommand
  API->>App: MediatR Send
  App->>Infra: Repository/UoW
  Infra->>DB: Insert Message
  App-->>API: MessageDto
  API-->>Client: 200 OK
  API->>Hub: Broadcast to room group
```

## Scalability

- Stateless API nodes.
- Redis backplane for SignalR scale-out.
- PostgreSQL indexes for hot paths.

## Performance

- CQRS pipeline behaviors for logging and timing.
- Message and membership indexes.
- Health checks for operational visibility.
