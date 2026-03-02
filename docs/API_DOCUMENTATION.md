# API Documentation

Bu dokuman, REST endpointlerini ve SignalR hub sozlesmelerini operasyonel kullanim odagi ile aciklar.

## 1. Genel Bilgiler

- Base URL: `http://localhost:5000`
- Auth tipi: `Bearer <access_token>`
- Content-Type: `application/json`

## 2. Standart Response Formati

### Basarili cevap (value donen endpoint)

```json
{
  "isSuccess": true,
  "error": null,
  "value": {}
}
```

### Basarili cevap (value donmeyen endpoint)

```json
{
  "isSuccess": true,
  "error": null
}
```

### Is kurali / uygulama hatasi

```json
{
  "isSuccess": false,
  "error": "Room name is required.",
  "value": null
}
```

### Validation hatasi (middleware)

```json
{
  "error": "Validation error",
  "details": [
    "Password must be at least 8 characters."
  ]
}
```

## 3. Kimlik Dogrulama Endpointleri (`/api/auth`)

| Method | Path | Auth | Rate Limit | Aciklama |
| --- | --- | --- | --- | --- |
| POST | `/register` | Hayir | `auth` | Yeni kullanici kaydi |
| POST | `/login` | Hayir | `auth` | Email/username ile giris |
| POST | `/refresh` | Hayir | `auth` | Refresh token ile yeni token cifti |
| POST | `/logout` | Evet | API policy | Refresh token iptali |
| GET | `/me` | Evet | API policy | Oturumdaki kullanici bilgisi |
| POST | `/email-verification/request` | Hayir | `auth` | Dogrulama emaili talebi |
| POST | `/email-verification/confirm` | Hayir | `auth` | E-posta dogrulama |
| POST | `/password-reset/request` | Hayir | `auth` | Sifre reset talebi |
| POST | `/password-reset/confirm` | Hayir | `auth` | Sifre reset onayi |

### Ornek: Register Request

```json
{
  "email": "user@example.com",
  "username": "user1",
  "password": "StrongP@ssw0rd",
  "displayName": "User One"
}
```

### Ornek: AuthResponseDto (`value`)

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

## 4. Chat Room Endpointleri (`/api/chatrooms`)

| Method | Path | Auth | Aciklama |
| --- | --- | --- | --- |
| POST | `/` | Evet | Oda olustur |
| GET | `/` | Evet | Kullanicinin odalari (pagination) |
| GET | `/{roomId}` | Evet | Oda detayini getir |
| GET | `/{roomId}/members` | Evet | Oda uyelerini getir |
| POST | `/{roomId}/join` | Evet | Odaya katil |
| POST | `/{roomId}/leave` | Evet | Odadan ayril |
| DELETE | `/{roomId}` | Evet | Odayi sil |

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

`roomType` degerleri:

- `1`: Public
- `2`: Private
- `3`: Direct

## 5. Message Endpointleri (`/api/messages`)

| Method | Path | Auth | Aciklama |
| --- | --- | --- | --- |
| POST | `/` | Evet | Mesaj gonder |
| PUT | `/{messageId}` | Evet | Mesaj duzenle |
| DELETE | `/{messageId}` | Evet | Mesaj sil |
| GET | `/room/{roomId}` | Evet | Oda mesajlarini getir |
| GET | `/room/{roomId}/search` | Evet | Oda icinde mesaj ara |

### Send Message Request

```json
{
  "chatRoomId": "00000000-0000-0000-0000-000000000000",
  "content": "Hello team",
  "type": 1,
  "replyToMessageId": null
}
```

`type` degerleri `MessageType` enum'una gore belirlenir.

### Pagination Query Parametreleri

- `pageNumber` (default: 1)
- `pageSize` (default endpoint bazli 20/50)
- `beforeMessageId` (cursor tabanli eski mesaj cekimi)

## 6. User Endpointleri (`/api/users`)

| Method | Path | Auth | Aciklama |
| --- | --- | --- | --- |
| GET | `/{userId}` | Evet | Kullanici profilini getir |
| GET | `/search` | Evet | Kullanici ara |
| PUT | `/me/profile` | Evet | Profil guncelle |
| PUT | `/me/password` | Evet | Sifre degistir |
| POST | `/me/status` | Evet | Online/offline durum guncelle |
| POST | `/block/{targetUserId}` | Evet | Kullanici engelle |
| DELETE | `/block/{targetUserId}` | Evet | Engeli kaldir |

## 7. SignalR Hub Sozlesmeleri

### Chat Hub: `/hubs/chat`

JWT token, SignalR negotiate asamasinda query string `access_token` ile iletilebilir.

#### Client -> Server metodlari

- `JoinRoom(roomId)`
- `LeaveRoom(roomId)`
- `SendTypingIndicator(roomId)`
- `MarkMessageAsRead(messageId, roomId?)`

#### Server -> Client eventleri

- `ReceiveMessage(message)`
- `UserStatusChanged(userId, status)`
- `UserJoinedRoom(userId, roomId)`
- `UserLeftRoom(userId, roomId)`
- `UserTyping(userId, roomId)`
- `MessageRead(messageId, userId)`

### Notification Hub: `/hubs/notifications`

- `JoinNotifications()`

## 8. Health Endpointleri

- `GET /health/live`
- `GET /health/ready`

## 9. Rate Limit Politikasi

- `auth` policy: 5 istek / dakika
- `api` policy: 100 istek / dakika
- Hub seviyesinde `SendTypingIndicator` ve `MarkMessageAsRead` icin memory-cache tabanli dakikalik limit

## 10. Pratik Tuketim Notlari

- Tum business endpointleri `isSuccess` kontrolu ile okunmalidir.
- 401 durumunda token refresh mekanizmasi client tarafinda uygulanmalidir.
- Validation hatalarinda `details[]` mesaji UI'da oldugu gibi kullaniciya yansitilabilir.
- Message listelemede cursor (`beforeMessageId`) tercih etmek gecmisi kaydirarak yuklerken daha uygundur.
