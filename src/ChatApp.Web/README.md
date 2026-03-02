# ChatApp Web

React + TypeScript frontend for the ChatApp platform.

## Responsibilities

- Authentication UI flows (register, login, logout)
- Real-time chat UX on top of SignalR hubs
- Room management and message workflows
- Optional QA diagnostics panel for manual API/hub testing

## Local Development

```bash
cd src/ChatApp.Web
npm ci
npm run dev
```

Default local URL: `http://localhost:5173`

## Environment Variables

- `VITE_API_BASE_URL`
- `VITE_HUB_CHAT_URL`
- `VITE_HUB_NOTIFICATION_URL`
- `VITE_ENABLE_QA_CONSOLE`
- `VITE_TOKEN_STORAGE` (`session` or `local`)

## Build

```bash
npm run build
```

## End-to-End Testing

Run with full stack lifecycle (starts/stops Docker services):

```bash
npm run test:e2e
```

Run against an already-running local stack:

```bash
npm run test:e2e:local
```

## Security Notes

- Keep `VITE_ENABLE_QA_CONSOLE=false` outside controlled test environments.
- Prefer `session` token storage for lower persistence risk.
- Do not expose production secrets in frontend env files.
