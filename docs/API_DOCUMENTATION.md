# API Documentation

This document describes REST endpoints and SignalR hub contracts for operational and integration use.

## 1. General Information

- Base URL: `http://localhost:5000`
- Authentication: `Bearer <access_token>`
- Content-Type: `application/json`

## 2. Standard Response Shape

### Success (value-returning endpoint)

```json
{
  "isSuccess": true,
  "error": null,
  "value": {}
}
```

### Success (no value payload)

```json
{
  "isSuccess": true,
  "error": null
}
```

### Business/application error

```json
{
  "isSuccess": false,
  "error": "Room name is required.",
  "value": null
}
```

### Validation error (middleware)

```json
{
  "error": "Validation error",
  "details": [
    "Password must be at least 8 characters."
  ]
}
```

## 3. Authentication Endpoints (`/api/auth`)

| Method | Path | Auth | Rate Limit | Description |
| --- | --- | --- | --- | --- |
| POST | `/register` | No | `auth` | Register a new user |
| POST | `/login` | No | `auth` | Login via email or username |
| POST | `/refresh` | No | `auth` | Rotate token pair using refresh token |
| POST | `/logout` | Yes | `api` | Revoke refresh token |
| GET | `/me` | Yes | `api` | Get current authenticated user |
| POST | `/email-verification/request` | No | `auth` | Request verification email |
| POST | `/email-verification/confirm` | No | `auth` | Confirm email verification |
| POST | `/password-reset/request` | No | `auth` | Request password reset |
| POST | `/password-reset/confirm` | No | `auth` | Confirm password reset |

### Example Register Request

```json
{
  "email": "user@example.com",
  "username": "user1",
  "password": "StrongP@ssw0rd",
  "displayName": "User One"
}
```

### Example `AuthResponseDto` (`value`)

```json
{
  "userId": "00000000-0000-0000-0000-000000000000",
  "email": "user@example.com",
  "username": "user1",
  "displayName": "User One",
  "accessToken": "...",
  "refreshToken": "...",
  "accessTokenExpiresAtUtc": "2026-03-02T10:00:00Z",
  "refreshTokenExpiresAtUtc": "2026-03-09T10:00:00Z"
}
```

## 4. Chat Room Endpoints (`/api/chatrooms`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | Yes | Create room |
| GET | `/` | Yes | List current user rooms (paginated) |
| GET | `/{roomId}` | Yes | Get room detail |
| GET | `/{roomId}/members` | Yes | List room members |
| POST | `/{roomId}/join` | Yes | Join room |
| POST | `/{roomId}/leave` | Yes | Leave room |
| DELETE | `/{roomId}` | Yes | Delete room |

### Create Room Request

```json
{
  "name": "backend-team",
  "description": "Backend planning room",
  "roomType": 2,
  "memberIds": [
    "11111111-1111-1111-1111-111111111111"
  ]
}
```

`roomType` values:

- `1`: Public
- `2`: Private
- `3`: Direct

## 5. Message Endpoints (`/api/messages`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/` | Yes | Send message |
| PUT | `/{messageId}` | Yes | Edit message |
| DELETE | `/{messageId}` | Yes | Delete message |
| GET | `/room/{roomId}` | Yes | List room messages |
| GET | `/room/{roomId}/search` | Yes | Search messages in room |

### Send Message Request

```json
{
  "chatRoomId": "00000000-0000-0000-0000-000000000000",
  "content": "Hello team",
  "type": 1,
  "replyToMessageId": null
}
```

`type` values follow the `MessageType` enum.

### Pagination Query Parameters

- `pageNumber` (default: 1)
- `pageSize` (endpoint defaults: 20 or 50)
- `beforeMessageId` (cursor for backward message loading)

## 6. User Endpoints (`/api/users`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/{userId}` | Yes | Get user profile |
| GET | `/search` | Yes | Search users |
| PUT | `/me/profile` | Yes | Update profile |
| PUT | `/me/password` | Yes | Change password |
| POST | `/me/status` | Yes | Update online/offline status |
| POST | `/block/{targetUserId}` | Yes | Block user |
| DELETE | `/block/{targetUserId}` | Yes | Unblock user |

## 7. SignalR Hub Contracts

### Chat Hub: `/hubs/chat`

JWT can be supplied during negotiation via query string `access_token`.

#### Client -> Server methods

- `JoinRoom(roomId)`
- `LeaveRoom(roomId)`
- `SendTypingIndicator(roomId)`
- `MarkMessageAsRead(messageId, roomId?)`

#### Server -> Client events

- `ReceiveMessage(message)`
- `UserStatusChanged(userId, status)`
- `UserJoinedRoom(userId, roomId)`
- `UserLeftRoom(userId, roomId)`
- `UserTyping(userId, roomId)`
- `MessageRead(messageId, userId)`

### Notification Hub: `/hubs/notifications`

- `JoinNotifications()`

## 8. Health Endpoints

- `GET /health/live`
- `GET /health/ready`

## 9. Rate Limit Policy

- `auth` policy: 5 requests/minute
- `api` policy: 100 requests/minute
- Additional per-minute hub limits for `SendTypingIndicator` and `MarkMessageAsRead`

## 10. Integration Notes

- For business endpoints, always inspect `isSuccess` before consuming `value`.
- On `401`, client-side refresh logic should run before forcing logout.
- Validation responses can be rendered directly from `details[]`.
- Prefer cursor-based loading (`beforeMessageId`) for message history scrolling.
