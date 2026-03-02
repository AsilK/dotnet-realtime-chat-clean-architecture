# Contributing

Bu dokuman, repoya katkida bulunurken takip edilmesi gereken teknik ve surec standartlarini tanimlar.

## 1. Gelistirme Prensipleri

- Islev dogrulugu birinci onceliktir.
- Mimari katman sinirlari korunur.
- Yeni kod test ve dokuman ile birlikte gelir.
- Gereksiz soyutlama ve gereksiz bagimlilik eklenmez.

## 2. Branch ve PR Akisi

- `main` daima deploy edilebilir kalitede tutulur.
- Her is icin ayri branch acilir.
- Onerilen branch adlari:
  - `feat/<kisa-aciklama>`
  - `fix/<kisa-aciklama>`
  - `chore/<kisa-aciklama>`

PR gereksinimleri:

- Ne degisti
- Neden degisti
- Risk ve geri donus plani
- Test kaniti (komut ciktilari veya ekran goruntusu)

## 3. Kod Standartlari

### Backend

- C# naming convention ve nullable disiplini korunur.
- Handler icinde is kurali disina cikilmamali, domain kurali domainde kalmali.
- Controllerlar thin tutulmali, business logic handlerlarda olmali.
- Pipeline behaviorlar bypass edilmemeli.

### Frontend

- Feature tabanli klasorleme korunmali.
- API call ve state mantigi UI render kodundan ayrilmali.
- Formlarda validation ve error state net olmalidir.
- QA panel degisiklikleri güvenlik etkisi acisindan degerlendirilmelidir.

## 4. Commit Mesaj Formati

Onerilen format:

```text
type(scope): short summary
```

Ornekler:

- `feat(chat): add cursor based message loading`
- `fix(auth): handle refresh token race condition`
- `docs(readme): rewrite setup and architecture sections`

## 5. Lokal Dogrulama Checklist

PR acmadan once minimum:

```bash
dotnet build
dotnet test
```

Web degisikliginde:

```bash
cd src/ChatApp.Web
npm run build
npm run test:e2e
```

## 6. Dokumantasyon Kurali

Su durumlarda dokuman guncellenmelidir:

- Yeni endpoint veya sozlesme degisikligi
- Config/env var degisikligi
- Mimari karar degisikligi
- Operasyonel davranis degisikligi

Guncellenmesi beklenen dosyalar:

- `README.md`
- ilgili `docs/*.md`
- gerekiyorsa `docs/adr/*`

## 7. Review Beklentileri

Code review'da su sorular cevaplanabilir olmalidir:

- Bu degisiklik hangi problemi cozuyor
- Mevcut davranisi nasil etkiliyor
- Olasi failure mode nedir
- Rollback nasil yapilacak

## 8. Yasakli Pratikler

- Secrets'i kod veya repo icine yazmak
- Test kaniti olmadan kritik davranis degisikligi merge etmek
- Katman bagimlilik yonunu bozmak
- Uretim guvenlik ayarlarini gecici diye acik birakmak

## 9. Iletisim ve Eskalasyon

Riskli degisikliklerde (auth, migration, rate limit, data silme):

- PR aciklamasinda etki analizi yaz
- En az bir ek reviewer iste
- Gerekirse rollout planini maddeli ver
