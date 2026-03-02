# Deployment

Bu dokuman, ChatApp uygulamasinin docker tabanli ortamlarda guvenli ve tekrar edilebilir sekilde nasil yayina alinacagini aciklar.

## 1. Dagitim Topolojisi

Docker Compose konfigurasyonunda su servisler bulunur:

- `web` (Vite tabanli React UI)
- `api` (ASP.NET Core API + SignalR)
- `postgres` (kalici veri)
- `redis` (cache + SignalR backplane)
- `seq` (log izleme)

Portlar:

- `5173` -> web
- `5000` -> api
- `5432` -> postgres
- `6379` -> redis
- `5341` -> seq

## 2. Gereksinimler

- Docker Engine + Docker Compose
- En az 4 CPU / 8 GB RAM (gelistirme ortami icin onerilen)
- Uretim icin TLS terminate eden reverse proxy (Nginx, Traefik, cloud LB)

## 3. Hemen Calistirma

```bash
docker compose up -d --build
```

Dogrulama:

```bash
curl http://localhost:5000/health/live
curl http://localhost:5000/health/ready
```

Kapatma:

```bash
docker compose down
```

## 4. Konfigurasyon Matrisi

### API kritik env varlar

- `ASPNETCORE_ENVIRONMENT`
- `ConnectionStrings__DefaultConnection`
- `Redis__ConnectionString`
- `JwtSettings__Secret`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `JwtSettings__AccessTokenExpirationMinutes`
- `JwtSettings__RefreshTokenExpirationDays`
- `Serilog__SeqUrl`

### SMTP env varlar

- `Smtp__Enabled`
- `Smtp__Host`
- `Smtp__Port`
- `Smtp__UseSsl`
- `Smtp__Username`
- `Smtp__Password`
- `Smtp__FromEmail`
- `Smtp__FromName`

### Web env varlar

- `VITE_API_BASE_URL`
- `VITE_HUB_CHAT_URL`
- `VITE_HUB_NOTIFICATION_URL`
- `VITE_ENABLE_QA_CONSOLE`
- `VITE_TOKEN_STORAGE`

## 5. Uretim Oncesi Checklist

- JWT secret 32 byte ustu rastgele deger mi
- CORS policy belirli origin listesi ile sinirli mi
- HTTPS zorunlu ve HSTS aktif mi
- Postgres yedekleme jobsi tanimli mi
- Redis persistence veya managed service strategy belirli mi
- Seq veya APM cikislari merkezi izleme sistemine bagli mi
- SMTP credentiallari secret manager ile yonetiliyor mu
- QA panel uretim ortaminda kapali mi (`VITE_ENABLE_QA_CONSOLE=false`)

## 6. Migration ve Veri Yonetimi

- Migration dosyalari `src/ChatApp.Infrastructure/Persistence/Migrations` altindadir.
- API startup asamasinda seed islemi dener; DB ulasilamazsa uygulama warning logu ile devam eder.
- Uretimde migrationlarin deploy pipeline icinde kontrollu adimla uygulanmasi onerilir.

Ornek migration komutu (lokal):

```bash
dotnet ef database update --project src/ChatApp.Infrastructure --startup-project src/ChatApp.API
```

## 7. Rollback Stratejisi

- Uygulama image rollback: onceki tag'e donus
- DB rollback: migration geri alma yerine backup restore tercih edilmeli
- Konfig rollback: env var versiyonlama ile geri donus

## 8. CI/CD Beklentisi

CI pipeline asamalari:

1. `dotnet restore`
2. `dotnet build`
3. `dotnet test`
4. Web dependency install
5. Playwright browser install
6. `npm run test:e2e`

Uretim pipeline'ina eklenmesi onerilen adimlar:

- Container image vulnerability scan
- IaC policy check
- Smoke test (health + login + message send)
- Canary veya blue/green rollout

## 9. Gozlemleme ve Alarm

Temel izlenmesi gereken metrikler:

- API p95 latency
- HTTP 5xx ve 429 oranlari
- SignalR bagli client sayisi
- Redis baglanti hatalari
- DB baglanti pool doygunlugu
- SMTP dispatch fail orani

Minimum alarm seti:

- 5 dakika boyunca 5xx > %2
- `health/ready` cevap verememe
- Redis ulasilamazlik
- JWT validation hatalarinda ani artis

## 10. Guvenlik Uyarisi

Varsayilan compose ayarlari gelistirme odaklidir. Uretim ortamina ayni ayarlarla cikmak uygun degildir.
En kritik iki nokta:

- CORS kisitlamasi
- Secret yonetimi
