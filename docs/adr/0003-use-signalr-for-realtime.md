# ADR-0003: Use SignalR for Real-Time Communication

- Status: Accepted

## Context
Need bi-directional low-latency messaging and presence updates.

## Decision
Use SignalR hubs for chat and notifications.

## Consequences
- Positive: native .NET realtime model.
- Negative: websocket infra scaling complexity.

## Alternatives
Polling or SSE only.
