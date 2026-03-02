# Test Senaryolari

Bu dokuman, UI + API + Hub akislari icin hizli manuel/E2E kontrol listesi sunar.

## Happy Path

1. Register -> Login -> Logout
   - `/register` formu ile yeni kullanici olustur.
   - Otomatik `/chat` yonlendirmesi ve kullanici badge gorunsun.
   - `Sign Out` ile `/login` sayfasina donsun.

2. Oda olustur -> Odaya gir -> Mesaj gonder
   - `/chat` sayfasinda oda olustur.
   - Odayi secip `Join` yap.
   - Mesaj gonder, listede gorunsun.

3. Mesaj duzenle/sil
   - Kendi mesajinda `Edit` -> `Save`.
   - `Delete` sonrasinda mesaj `[deleted]` olarak gorunsun.

4. Realtime typing/presence/read (2 session)
   - A ve B sessionlari ayri kullanici ile baglansin.
   - B typing gonderdiginde A ekraninda typing indicator gorunsun.
   - B `Mark Read` yaptiginda A ekraninda `Read by` bilgisi guncellensin.

5. QA panel API/Hub invoke
   - `/qa` uzerinde API Playground ile en az 1 endpoint cagir.
   - Hub Playground ile en az 1 chat method invoke et.
   - Event Monitor uzerinde event logunu gor.

## Failure Path

1. Gecersiz login
   - Yanlis sifre ile login dene.
   - Hata mesaji gorunsun, session acilmasin.

2. Token refresh failure
   - Gecersiz/expired refresh token ile protected route ac.
   - Oturum temizlenip `/login` sayfasina yonlendirilsin.

3. Rate limit davranisi
   - `/qa` Rate/Load panelinden auth burst test calistir.
   - 429 olusursa sayim ekranda gorunsun.

4. Hub baglanti kopmasi
   - Session hub baglantisini kapat.
   - UI state `disconnected`/`reconnecting` olarak degissin.

5. Gezersiz API body
   - API Playground'da hatali JSON/body gonder.
   - Hata durum kodu ve response body gorunsun.

## Hedef Sure

Yeni gelen bir gelistirici bu senaryolari kullanarak 15-20 dakika icinde:
- Ortami ayaga kaldirabilmeli
- Temel akislarin calistigini dogrulayabilmeli
- Hata/rate-limit/retry davranisini gozlemleyebilmelidir
