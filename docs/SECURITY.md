# Security

Bu dokuman, ChatApp uygulamasinda uygulanan guvenlik kontrollerini ve operasyonel sorumluluklari ozetler.

## 1. Tehdit Modeli Ozeti

Korunmasi gereken varliklar:

- Kullanici kimlik bilgileri ve tokenlar
- Mesaj icerigi ve oda uyeligi bilgileri
- Refresh token store ve email token akislari

Temel tehditler:

- Yetkisiz erisim
- Token sizdirma veya replay
- Brute-force / abuse trafik
- Realtime kanalda flood
- Yanlis CORS/transport ayarlari

## 2. Kimlik Dogrulama ve Oturum

- API ve Hub erisimi JWT Bearer ile korunur.
- Access token kisa omurludur.
- Refresh token daha uzun omurlu ve server tarafinda hashlenmis saklanir.
- Refresh akisinda eski token invalid edilir ve yeni token cifti uretilir.
- Logout islemi refresh token iptali ile yapilir.

## 3. Token Guvenligi

- Access token claimleri: `NameIdentifier`, `Name`, `Email`, `Role`
- JWT dogrulama: issuer, audience, signature, expiration
- `ClockSkew`: 30 saniye
- Hub baglantisinda query string `access_token` kabul edilir (`/hubs` path'i)

Onemli not:

- Web tarafinda token saklama varsayilani `sessionStorage` olarak ayarlanmistir.
- `VITE_TOKEN_STORAGE=local` secenegi kalicilik saglar ancak XSS etkisini buyutur.

## 4. Validation ve Hata Yonetimi

- FluentValidation, request seviyesinde merkezi dogrulama uygular.
- Validation hatalari `400` ve detay listesi ile doner.
- Beklenmeyen hatalar `500` + genel mesaj ile sinirli bilgi aciga cikarir.
- Sunucu tarafi detaylar loglanir, clienta stack trace donulmez.

## 5. Rate Limiting

- Auth endpointleri: dakikada 5 istek
- Genel API: dakikada 100 istek
- Hub metotlari (`SendTypingIndicator`, `MarkMessageAsRead`) icin memory-cache tabanli limit

Bu kontroller, brute-force ve request flood etkisini azaltir fakat WAF/edge katmani ile desteklenmelidir.

## 6. HTTP Guvenlik Basliklari

Security middleware su basliklari ekler:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `X-XSS-Protection: 1; mode=block`

Gelistirme onerisi:

- `Content-Security-Policy` ve `Strict-Transport-Security` eklenmeli

## 7. CORS Politika Durumu

Kodda CORS policy su anda genis tanimli:

- `AllowAnyHeader`
- `AllowAnyMethod`
- `AllowCredentials`
- `SetIsOriginAllowed(_ => true)`

Bu konfigurasyon gelistirme hizini artirir ancak uretim icin uygun degildir.
Uretimde explicit origin whitelist zorunlu olmalidir.

## 8. E-posta ve Secret Yonetimi

- SMTP konfigleri env var veya appsettings ile verilir.
- SMTP credentials kod tabanina yazilmamali, secret manager ile yonetilmelidir.
- E-posta dispatch queue/backoff mekanizmasi gecici hatalarda tekrar deneme yapar.

## 9. Veri Guvenligi

- Refresh tokenlar hashlenmis saklanir.
- Mesaj ve profil verileri Postgres'te kalicidir.
- Redis gecici veri ve runtime state icin kullanilir.

Ek oneriler:

- Disk seviyesinde encryption (DB/storage)
- Yedeklerin sifreli saklanmasi
- PII alanlarina erisim logu

## 10. Operasyonel Guvenlik Kontrolleri

- JWT secret rotation proseduru belirlenmeli
- Kisa aralikli dependency update taramasi (SCA) yapilmali
- Audit log retention ve merkezi SIEM entegrasyonu dusunulmeli
- Incident response runbook'u hazir tutulmali

## 11. Bilinen Acik Alanlar

- CORS policy production hardening gerekiyor
- Container icinde DataProtection key persistence warning'i var
- QA panelinin productionda kesin kapali oldugu release gate ile garanti edilmeli

## 12. Guvenlik Test Onerisi

- Auth endpointlerine brute-force simulasyonu
- Refresh token replay testi
- Hub method flood testi
- CORS misconfiguration negatif testi
- Dependency vulnerability taramasi
