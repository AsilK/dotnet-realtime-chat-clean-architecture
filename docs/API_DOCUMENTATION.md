# API Documentation

Base URL: `http://localhost:5000`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Chat Rooms

- `POST /api/chatrooms`
- `POST /api/chatrooms/{roomId}/join`
- `POST /api/chatrooms/{roomId}/leave`
- `DELETE /api/chatrooms/{roomId}`
- `GET /api/chatrooms/{roomId}`
- `GET /api/chatrooms`
- `GET /api/chatrooms/{roomId}/members`

## Messages

- `POST /api/messages`
- `PUT /api/messages/{messageId}`
- `DELETE /api/messages/{messageId}`
- `GET /api/messages/room/{roomId}`
- `GET /api/messages/room/{roomId}/search`

## Users

- `GET /api/users/{userId}`
- `GET /api/users/search`
- `PUT /api/users/me/profile`
- `PUT /api/users/me/password`
- `POST /api/users/me/status`
- `POST /api/users/block/{targetUserId}`
- `DELETE /api/users/block/{targetUserId}`

## SignalR Hubs

- `/hubs/chat`
  - `JoinRoom(roomId)`
  - `LeaveRoom(roomId)`
  - `SendTypingIndicator(roomId)`
  - `MarkMessageAsRead(messageId)`
- `/hubs/notifications`

## Error Response

```json
{ "error": "Validation error", "details": ["..."] }
```

## Rate Limits

- Auth endpoints: 5 req/min
- API endpoints: 100 req/min
