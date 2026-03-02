# Testing Guide

Bu dokuman, projedeki test katmanlarini, komutlarini ve kabul kriterlerini ozetler.

## 1. Test Piramidi

### Unit Tests

- Konum:
  - `tests/ChatApp.Domain.UnitTests`
  - `tests/ChatApp.Application.UnitTests`
- Hedef:
  - Domain kurallari
  - Validation ve handler davranislari

### Integration Tests

- Konum: `tests/ChatApp.Infrastructure.IntegrationTests`
- Hedef:
  - Infrastructure servisleri
  - Repository ve bagimli altyapi davranislari

### Functional Tests

- Konum: `tests/ChatApp.API.FunctionalTests`
- Hedef:
  - API smoke ve temel HTTP akis dogrulamalari

### E2E Tests (Web)

- Konum: `src/ChatApp.Web/tests/e2e`
- Hedef:
  - Register/Login/Logout
  - Room + message akislari
  - Realtime typing/presence/read
  - 401 -> refresh -> continue

## 2. Komut Seti

### Backend build + test

```bash
dotnet build
dotnet test
```

### Coverage script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-coverage.ps1
```

### Web build

```bash
cd src/ChatApp.Web
npm run build
```

### E2E (docker stack ile)

```bash
cd src/ChatApp.Web
npm run test:e2e
```

### E2E (stack zaten ayaktaysa)

```bash
cd src/ChatApp.Web
npm run test:e2e:local
```

## 3. CI Davranisi

CI pipeline sirasi:

1. .NET restore
2. .NET build
3. .NET test
4. Web dependency install
5. Playwright browser install
6. E2E test

Beklenti: PR merge oncesi tum adimlar yesil olmalidir.

## 4. Test Verisi ve Izolasyon

- Unit testler izole, deterministic olmalidir.
- Integration/functional testlerde test ortami bagimliliklari acik tanimli olmalidir.
- E2E testler kendine ait kullanici/oda verisi olusturup temizlemelidir.

## 5. Realtime Test Onerileri

- En az iki bagimsiz session ile event dogrulamasi yap
- `UserTyping`, `UserJoinedRoom`, `MessageRead` eventlerini ayrica izle
- Hub reconnect sonrasinda room membership davranisini kontrol et

## 6. Hata Yakalama Stratejisi

- E2E fail oldugunda screenshot + video artifactleri incelenmeli
- API seviyesinde donen `isSuccess/error` payloadu dogrudan assert edilmelidir
- Validation hatalari `details[]` listesiyle birlikte test edilmelidir

## 7. Test Kabul Kriterleri

- Yeni feature minimum bir test katmaninda kapsanmali
- Kritik auth/permission degisikligi unit + functional test icermeli
- UI akisi degisikligi en az bir E2E senaryosuna yansitilmali

## 8. Stabilite Ic in Oneriler

- Zaman bagimli testlerde sabit saat veya tolerans kullan
- Asenkron event testlerinde deterministic wait/condition stratejisi kullan
- Paralel testte paylasilan dosya ve port kilitlerini engelle
