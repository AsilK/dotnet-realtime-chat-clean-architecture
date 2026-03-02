# Operations Runbook

This runbook defines daily operations, troubleshooting, and incident response for ChatApp.

## 1. Quick Commands

### Start stack

```bash
docker compose up -d --build
```

### Stop stack

```bash
docker compose down
```

### Service status

```bash
docker compose ps
```

### API logs

```bash
docker compose logs api --tail 200
```

### Web logs

```bash
docker compose logs web --tail 200
```

## 2. Health Checks

- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

Expected behavior:

- HTTP 200 for both
- On readiness failure, check DB/Redis dependencies first

## 3. Key Observability Signals

### API

- sudden increase in 5xx rates
- sudden increase in 429 rates
- auth endpoint error spikes

### Realtime

- hub negotiate/connect failures
- reconnection loops increasing

### Data

- PostgreSQL latency or connection exhaustion
- Redis disconnects/timeouts

### Background Services

- email dispatch retries/failures
- refresh-token cleanup execution gaps

## 4. Common Failure Scenarios

### Issue: `POST /api/chatrooms` returns 400

Checks:

- verify `roomType` enum value (1/2/3)
- validate GUID format in `memberIds`
- inspect response `error` or `details[]`

### Issue: SignalR `stopped during negotiation`

Checks:

- API health (`/health/live`)
- token validity and expiration
- development double-mount side effects in frontend
- reverse proxy websocket upgrade headers

### Issue: increase in 401 responses

Checks:

- `JwtSettings__Secret`, issuer, and audience consistency
- host clock drift beyond configured skew
- refresh token storage/cleanup state

### Issue: increase in 429 responses

Checks:

- brute-force or synthetic test traffic
- rate limit partition behavior (user/IP)

## 5. Logging and Investigation

- Serilog console and Seq sinks are enabled
- default Seq URL in compose: `http://localhost:5341`

Useful log patterns:

- `Unhandled exception`
- `Long running request`
- `Rate limit exceeded`
- `Database migration/seed skipped`

## 6. Incident Response Flow

1. Contain impact (rollback or traffic shaping)
2. Verify live/readiness endpoints
3. Check DB and Redis health
4. Run root-cause analysis from logs and recent changes
5. Apply temporary mitigation
6. Ship permanent fix with tests and doc updates

## 7. Backup and Recovery

Minimum baseline:

- periodic PostgreSQL backups
- backup restore drill validation
- documented RTO/RPO targets

## 8. Capacity Planning Baseline Metrics

- API p95 latency
- request throughput per minute
- active SignalR connections
- message write/read throughput
- Redis memory utilization

## 9. Production Environment Controls

- explicit CORS allowlist
- enforced TLS
- managed secret integration
- on-call alert routing
- named runbook ownership and review cadence
