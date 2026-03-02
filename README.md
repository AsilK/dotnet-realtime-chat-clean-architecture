# ChatApp

ChatApp, .NET 8 uzerinde gelistirilmis gercek zamanli mesajlasma platformudur.
Proje; Domain merkezli tasarim, CQRS/MediatR pipeline, SignalR realtime ile PostgreSQL ve Redis altyapisini bir araya getirir.

## Neler Var

- JWT tabanli kimlik dogrulama ve refresh token rotasyonu
- E-posta dogrulama ve sifre sifirlama akisleri
- Oda bazli mesajlasma, mesaj duzenleme/silme, arama ve cursor pagination
- SignalR ile typing, read receipt, room join/leave ve presence eventleri
- React tabanli test UI ve QA paneli
- Unit, integration, functional ve E2E test katmanlari

## Olculebilir Sonuclar

- Backend testleri: `12/12` gecti (`dotnet test`)
- E2E senaryolari: `4/4` gecti (`npm run test:e2e`)
- Frontend bundle iyilestirmesi:
  - Onceki tek chunk: `~510.86 kB`
  - Sonraki en buyuk entry chunk: `226.65 kB` (gzip `74.51 kB`)

## Hedef Kitle

- Realtime chat altyapisini referans almak isteyen ekipler
- Clean Architecture ve CQRS yaklasimini pratikte gormek isteyen gelistiriciler
- API + Web + test otomasyonu tek repoda yonetmek isteyen urun ekipleri

## Dokuman Haritasi

- [Architecture](docs/ARCHITECTURE.md)
- [Technology Stack](docs/TECHNOLOGY_STACK.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations Runbook](docs/OPERATIONS_RUNBOOK.md)
- [Security](docs/SECURITY.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Contributing](docs/CONTRIBUTING.md)
- [ADR Dizini](docs/adr)

## Hizli Baslangic

### 1) Docker ile calistir

```bash
docker compose up -d --build
```

### 2) Servisleri dogrula

```bash
curl http://localhost:5000/health/live
curl http://localhost:5000/health/ready
```

### 3) UI adresleri

- Web: `http://localhost:5173`
- API: `http://localhost:5000`
- Swagger (Development modunda): `http://localhost:5000/swagger`

## Lokal Gelistirme

### API

```bash
dotnet restore ChatApp.sln
dotnet run --project src/ChatApp.API/ChatApp.API.csproj
```

### Web

```bash
cd src/ChatApp.Web
npm ci
npm run dev
```

## Ortam Degiskenleri

### API odakli

- `ConnectionStrings__DefaultConnection`
- `Redis__ConnectionString`
- `JwtSettings__Secret`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__AccessTokenExpirationMinutes`
- `JwtSettings__RefreshTokenExpirationDays`
- `Smtp__Enabled`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__UseSsl`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`

### Web odakli

- `VITE_API_BASE_URL`
- `VITE_HUB_CHAT_URL`
- `VITE_HUB_NOTIFICATION_URL`
- `VITE_ENABLE_QA_CONSOLE`
- `VITE_TOKEN_STORAGE` (`session` veya `local`)

Not: Uretim ortaminda `JwtSettings__Secret` en az 32 byte ve rastgele uretilmis olmalidir.

## Test Komutlari

### Backend

```bash
dotnet build
dotnet test
```

### Frontend

```bash
cd src/ChatApp.Web
npm run build
```

### E2E (Docker stack ile)

```bash
cd src/ChatApp.Web
npm run test:e2e
```

## Dizin Yapisi

- `src/ChatApp.Domain`: Entity, enum, domain event ve value object katmani
- `src/ChatApp.Application`: Use-case odakli command/query handler ve pipeline behavior katmani
- `src/ChatApp.Infrastructure`: EF Core, repository, JWT, Redis, SMTP ve hosted service katmani
- `src/ChatApp.API`: Controller, hub, middleware ve composition root
- `src/ChatApp.Web`: React tabanli web istemcisi ve QA paneli
- `tests/*`: Unit, integration ve functional test projeleri
- `docs/*`: Mimari, guvenlik, deploy ve operasyon dokumanlari

## Operasyonel Not

Stack'i kapatmak icin:

```bash
docker compose down
```
