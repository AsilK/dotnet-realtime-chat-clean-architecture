# Operations Runbook

Bu runbook, ChatApp sisteminin gunluk operasyonunda izleme, sorun giderme ve mudahele adimlarini tanimlar.

## 1. Hizli Komutlar

### Stack baslat

```bash
docker compose up -d --build
```

### Stack durdur

```bash
docker compose down
```

### Servis durumlari

```bash
docker compose ps
```

### API loglari

```bash
docker compose logs api --tail 200
```

### Web loglari

```bash
docker compose logs web --tail 200
```

## 2. Health Kontrolleri

- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

Beklenen durum:

- HTTP 200
- Readiness hatalarinda DB/Redis baglantilari kontrol edilmelidir.

## 3. Kritik Gozlem Noktalari

### API

- 5xx oraninda ani artis
- 429 oraninda artis
- Auth endpoint hata orani

### Realtime

- Hub connect/negotiate hatalari
- Reconnect dongulerinin artmasi

### Veri

- PostgreSQL baglanti gecikmesi
- Redis connection drop

### Background servisler

- Email dispatch fail ve retry sayisi
- Refresh token cleanup calisma araligi

## 4. Sik Karsilasilan Sorunlar

### Sorun: `POST /api/chatrooms` 400

Kontrol:

- Request body'si `roomType` enum degeri dogru mu (1/2/3)
- `memberIds` alaninda gecerli GUID formatinda degerler var mi
- Response body'sinde `error` veya `details[]` mesaji ne donuyor

### Sorun: SignalR `stopped during negotiation`

Kontrol:

- API ayakta mi (`/health/live`)
- Token suresi dolmus mu
- Tarayici gelistirme modunda cift mount etkisi var mi
- Reverse proxy websocket upgrade headerlari dogru mu

### Sorun: 401 artis

Kontrol:

- `JwtSettings__Secret`, `Issuer`, `Audience` uyumu
- Saat senkronizasyonu (clock skew disi drift)
- Refresh token store temizligi

### Sorun: 429 artis

Kontrol:

- Auth brute-force veya test trafi gi var mi
- API rate limit partition key kaynaklari (user/ip) incelenmeli

## 5. Loglama ve Inceleme

- Serilog console ve Seq sink aktif
- Seq default adresi compose ortaminda `http://localhost:5341`

Operasyonel olarak aranacak log patternleri:

- `Unhandled exception`
- `Long running request`
- `Rate limit exceeded`
- `Database migration/seed skipped`

## 6. Incident Mudahele Akisi

1. Etkiyi sinirla: hatali deploy varsa onceki image tag'e don
2. Saglik kontrolu: live/ready endpointleri
3. Veri durumu: DB ve Redis baglanti durumu
4. Koken neden analizi: log + son deploy farki
5. Gecici onlem: trafik kisma veya feature disable
6. Kalici cozum: patch + test + dokuman guncellemesi

## 7. Backup ve Recovery

Minimum beklenti:

- PostgreSQL periyodik backup
- Backup dogrulama (restore test)
- Recovery RTO/RPO hedeflerinin tanimli olmasi

## 8. Kapasite Planlama Baslangic Metrikleri

- API p95 latency
- Dakikadaki request sayisi
- Hub active connection sayisi
- Mesaj yazma/okuma throughput'u
- Redis memory kullanimi

## 9. Uretim Ortami Ek Kontroller

- CORS explicit whitelist
- TLS zorunlulugu
- Secret manager entegrasyonu
- Alert routing (on-call)
- Runbook sahibi ve guncelleme periyodu
