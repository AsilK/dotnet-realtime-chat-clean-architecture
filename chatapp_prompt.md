# ChatApp UI + QA Console Prompt Paketi

Bu dosya, bana sirayla verecegin detayli promptlari icerir.
Kullanim: her adimi tek tek gonder. Bir adim bitmeden bir sonrakine gecme.

## Genel Kural (Her Promptun Basina Ekleyebilirsin)

```text
Bu adimda sadece istenen kapsamda calis.
Mevcut kodu gereksiz degistirme.
Her is sonunda:
1) Calisan kodu yaz
2) Gerekli testleri calistir
3) Degisen dosyalari listele
4) Kisa teknik ozet ver
Eger riskli/geri donusu zor bir islem gerekiyorsa once tek cümle ile onay iste.
```

---

## Prompt 1 - Frontend Iskeleti ve Altyapi

```text
chatapp_prompt.md icindeki "Prompt 1" adimini uygula.

Hedef:
- Chat API'yi test etmeye uygun bir web UI iskeleti kur.

Yapilacaklar:
1. `src/ChatApp.Web` adinda yeni bir React + TypeScript uygulamasi olustur (Vite).
2. Asagidaki kutuphaneleri ekle:
   - react-router-dom
   - @tanstack/react-query
   - @microsoft/signalr
   - zod
   - axios
3. Temel klasor yapisi kur:
   - src/app
   - src/features/auth
   - src/features/chat
   - src/features/qa
   - src/shared/api
   - src/shared/ui
   - src/shared/state
4. `docker-compose.yml` icine web servisini ekle (api ile konusacak sekilde).
5. `.env.example` dosyasi olustur:
   - VITE_API_BASE_URL
   - VITE_HUB_CHAT_URL
   - VITE_HUB_NOTIFICATION_URL
6. Baslangic rotalari:
   - /login
   - /register
   - /chat
   - /qa
7. Basit bir AppShell yap ve route guard (auth gerektiren sayfalar) ekle.

Kabul Kriterleri:
- `npm run build` basarili olmali.
- Uygulama acildiginda route'lar calismali.
- Docker compose ile web+api birlikte ayaga kalkmali.
```

---

## Prompt 2 - Auth Akisi (API ile Tam Entegrasyon)

```text
chatapp_prompt.md icindeki "Prompt 2" adimini uygula.

Hedef:
- Register/Login/Refresh/Logout akislarini UI'dan tam calistir.

Yapilacaklar:
1. Auth API client yaz:
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/refresh
   - POST /api/auth/logout
   - GET /api/auth/me
2. Access + refresh token yonetimi ekle.
3. Axios interceptor ile 401 durumunda otomatik refresh dene.
4. Login/Register sayfalarina form validasyonu ekle (zod).
5. Header'a aktif kullanici bilgisi koy (me endpointinden).
6. Logout ile local state ve tokenlar temizlensin.

Kabul Kriterleri:
- UI uzerinden register/login/logout calisiyor olmali.
- Expired access token senaryosunda refresh otomatik devreye girmeli.
- Token refresh basarisizsa kullanici login sayfasina donmeli.
```

---

## Prompt 3 - Temel Chat Ekrani

```text
chatapp_prompt.md icindeki "Prompt 3" adimini uygula.

Hedef:
- Oda listesi + mesaj listesi + mesaj gonderme/isleme islemleri calissin.

Yapilacaklar:
1. ChatRooms API:
   - GET /api/chatrooms
   - POST /api/chatrooms
   - GET /api/chatrooms/{roomId}
   - POST /api/chatrooms/{roomId}/join
   - POST /api/chatrooms/{roomId}/leave
2. Messages API:
   - GET /api/messages/room/{roomId}
   - GET /api/messages/room/{roomId}/search
   - POST /api/messages
   - PUT /api/messages/{messageId}
   - DELETE /api/messages/{messageId}
3. Sol panel: odalar
4. Orta panel: secili odanin mesajlari
5. Alt kisim: mesaj yazma/gonderme
6. Mesaj duzenle/sil aksiyonlari sadece uygun kullanicida gorunsun.
7. Cursor destekli mesaj cekme (`beforeMessageId`) icin UI kontrolu ekle.

Kabul Kriterleri:
- Oda secince mesajlar gelir.
- Mesaj gonder/duzenle/sil calisir.
- Cursor ile onceki mesajlari cekme calisir.
```

---

## Prompt 4 - SignalR Realtime Entegrasyonu

```text
chatapp_prompt.md icindeki "Prompt 4" adimini uygula.

Hedef:
- Realtime eventleri UI'da canli gor.

Yapilacaklar:
1. ChatHub baglantisi kur (JWT ile).
2. Hub methodlarini UI'dan kullan:
   - JoinRoom
   - LeaveRoom
   - SendTypingIndicator
   - MarkMessageAsRead(messageId, roomId)
3. Client eventlerini isle:
   - ReceiveMessage
   - UserStatusChanged
   - UserJoinedRoom
   - UserLeftRoom
   - UserTyping
   - MessageRead
4. Baglanti durumu gostergesi ekle (connecting/connected/reconnecting/disconnected).
5. Reconnect stratejisi ekle.

Kabul Kriterleri:
- Iki farkli tarayici oturumunda eventler karsilikli gorulmeli.
- Typing/presence/read eventleri calismali.
```

---

## Prompt 5 - QA Console (Manual Test Panel)

```text
chatapp_prompt.md icindeki "Prompt 5" adimini uygula.

Hedef:
- Tum API ve Hub metodlarini manuel tetikleyebilecegimiz bir QA paneli olustur.

Yapilacaklar:
1. `/qa` altinda ayri bir sayfa olustur.
2. API playground:
   - Method, URL, header, body gir
   - Istege gonder
   - Response status, response body, sure(ms) goster
3. Hub playground:
   - Hub method sec
   - Argumanlari JSON olarak gir
   - Invoke et
   - Sonuc/hatayi goster
4. Event monitor:
   - Gelen tum hub eventlerini zaman damgasi ile logla
5. Export:
   - QA loglarini JSON olarak disari aktar

Kabul Kriterleri:
- Kod yazmadan endpoint/hub testi yapilabilmeli.
- Sonuc ve hata goruntuleme net olmali.
```

---

## Prompt 6 - Multi Session Simulator

```text
chatapp_prompt.md icindeki "Prompt 6" adimini uygula.

Hedef:
- Tek UI icinde A/B/C kullanici oturumlarini paralel simule et.

Yapilacaklar:
1. QA sayfasina Session Manager ekle:
   - Session A
   - Session B
   - Session C
2. Her session icin ayri auth/token/hub connection state tut.
3. Her session farkli kullanici ile login olabilsin.
4. Bir sessiondan gonderilen eventlerin diger sessionlarda gorunumunu ayni ekranda goster.
5. Basit senaryo butonlari ekle:
   - "A mesaj atsin, B typing gondersin"
   - "A room'a girsin, B leave etsin"

Kabul Kriterleri:
- En az 2 session ayni anda canli calisiyor olmali.
- Realtime event farklari acikca gorulmeli.
```

---

## Prompt 7 - Rate Limit, Error, Retry Testleri

```text
chatapp_prompt.md icindeki "Prompt 7" adimini uygula.

Hedef:
- Performans ve dayaniklilik testleri icin UI kontrolleri ekle.

Yapilacaklar:
1. Auth endpointleri icin hizli tekrar (burst) testi ekle.
2. API endpointleri icin configurable concurrency testi ekle.
3. Hub methodlari icin mesaj flood testi ekle.
4. Sonuclar:
   - Basarili/Basarisiz istek sayisi
   - 429 sayisi
   - Ortalama/P95 sure
5. Retry + backoff davranisini goruntuleyen panel ekle.

Kabul Kriterleri:
- Rate limit davranisi gozlenebilir olmali.
- Basit load simulasyonu UI'dan yapilabilmeli.
```

---

## Prompt 8 - E2E Otomasyon (Playwright)

```text
chatapp_prompt.md icindeki "Prompt 8" adimini uygula.

Hedef:
- Kritik akislari otomatik test altina al.

Yapilacaklar:
1. Playwright kur ve konfigure et.
2. E2E testleri yaz:
   - register + login + logout
   - oda olustur + join + mesaj gonder
   - mesaj duzenle/sil
   - iki session realtime typing/presence/read
   - 401 -> refresh -> devam senaryosu
3. `npm run test:e2e` komutu ekle.
4. CI'da calisacak sekilde workflow guncelle.

Kabul Kriterleri:
- E2E testleri lokal ve CI'da calisabilir olmali.
- Kritik akislar otomatik dogrulanmali.
```

---

## Prompt 9 - Dokumantasyon ve Operasyon

```text
chatapp_prompt.md icindeki "Prompt 9" adimini uygula.

Hedef:
- Bu Test UI'yi ekipte herkesin hizli kullanabilmesi.

Yapilacaklar:
1. README'ye su bolumleri ekle:
   - UI nasil calistirilir
   - QA panel nasil kullanilir
   - Multi-session test nasil yapilir
   - E2E nasil calistirilir
2. Kisa "Test Senaryolari" dokumani yaz (happy path + failure path).
3. Ornek .env degerlerini dokumante et.

Kabul Kriterleri:
- Yeni gelen bir gelistirici 15-20 dk icinde ortami ayaga kaldirip test edebilmeli.
```

---

## Prompt 10 - Son Sertlestirme ve Final Audit

```text
chatapp_prompt.md icindeki "Prompt 10" adimini uygula.

Hedef:
- Production'a yakin kalite kapisi.

Yapilacaklar:
1. UI performans gozden gecirme (gereksiz rerender, buyuk bundle, lazy load).
2. Guvenlik gozden gecirme (token saklama, hassas veri loglama, QA panelin sadece dev/test ortaminda acilmasi).
3. Eriþilebilirlik temel kontrolu (klavye, kontrast, form hata mesajlari).
4. Teknik borc listesi ve sonraki sprint backlog onerisi cikar.

Beklenen cikti formati:
- Yapilanlar
- Kritik bulgular
- Kalan riskler
- Oncelikli sonraki adimlar
```

---

## Bonus Prompt - "Tek Seferde MVP"

```text
chatapp_prompt.md icindeki Prompt 1-6 kapsamini tek seferde MVP olarak uygula.
Oncelik: calisirlik > kozmetik.
Her faz sonunda build/test calistir.
Finalde degisen dosyalar + calisan senaryolar + bilinen limitler raporu ver.
```
