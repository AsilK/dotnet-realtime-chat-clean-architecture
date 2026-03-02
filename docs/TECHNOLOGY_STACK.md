# Technology Stack

Bu dokuman, ChatApp projesinde kullanilan teknoloji kararlarini ve bu kararlarin etkilerini aciklar.

## Platform ve Dil

| Alan | Teknoloji | Surum | Neden |
| --- | --- | --- | --- |
| Runtime | .NET | 8.0 | LTS, performans, modern ASP.NET Core ozellikleri |
| Dil | C# | 12 | Guclu tip sistemi, async/await, olgun ekosistem |
| Frontend Runtime | Node.js | 20 | Vite ve Playwright ile uyumlu LTS surum |
| Frontend Dil | TypeScript | 5.9.x | Tip guvenligi, buyuk kod tabaninda bakim kolayligi |

## Backend Framework ve Kutuphaneler

| Katman | Teknoloji | Surum | Kullanim |
| --- | --- | --- | --- |
| API | ASP.NET Core | 8.0 | REST API, middleware pipeline, dependency injection |
| Realtime | SignalR | 8.0.12 | Oda tabanli event dagitimi, client reconnect destegi |
| CQRS | MediatR | 12.4.1 | Command/query ayrimi, handler tabanli is akislari |
| Validation | FluentValidation | 11.11.0 | Request dogrulama kurallari ve pipeline entegrasyonu |
| Mapping | AutoMapper | 12.0.1 | Domain-to-DTO donusumleri |
| Logging | Serilog | 8.0.3 + sinks | Yapilandirilmis loglama, console + Seq ciktisi |
| Auth | JwtBearer | 8.0.12 | JWT access token ve SignalR token dogrulama |

## Veri ve Altyapi

| Bilesen | Teknoloji | Surum | Kullanim |
| --- | --- | --- | --- |
| Iliskisel DB | PostgreSQL | 16 (docker) | Kalici veri, iliski modeli, indeksleme |
| ORM | EF Core + Npgsql | 8.0.11 | Migration, repository ve query altyapisi |
| Cache / Backplane | Redis + StackExchange.Redis | 7 / 2.8.16 | Kisa omurlu cache, SignalR backplane |
| Full-text benzeri arama | `pg_trgm` | PostgreSQL extension | Mesaj ve display name aramalari icin trigram indeks |
| Gozlemleme | Seq | latest (docker) | Merkezi log analizi |

## Frontend Teknolojileri

| Alan | Teknoloji | Surum | Kullanim |
| --- | --- | --- | --- |
| UI | React | 19.2 | Bilesen tabanli arayuz |
| Router | react-router-dom | 7.13 | Sayfa ve guard yonetimi |
| Data Fetch | axios | 1.13 | HTTP client, interceptor tabanli auth yenileme |
| State ve Data Cache | @tanstack/react-query | 5.90 | Server state yonetimi |
| Realtime Client | @microsoft/signalr | 10.0 | Hub baglantisi ve event abonelikleri |
| Validation | zod | 4.3 | Form validasyonu |
| Build Tool | Vite | 7.3 | Hizli gelistirme ve production bundling |

## Test ve CI Teknolojileri

| Alan | Teknoloji | Surum | Kullanim |
| --- | --- | --- | --- |
| Unit Test | xUnit | projelerde referansli | Domain ve application birim testleri |
| Integration Test | xUnit + EF/Npgsql | projelerde referansli | Repository ve servis entegrasyon testleri |
| Functional Test | Microsoft.AspNetCore.Mvc.Testing | 8.0.12 | API smoke/functional testleri |
| E2E | Playwright | 1.58 | Web UI kritik akis otomasyonu |
| CI | GitHub Actions | hosted | Build, test ve E2E pipeline |

## Mimari Secimlerin Pratik Sonuclari

### Clean Architecture + CQRS

- Is kurallari Application/Domain katmaninda merkezlenir.
- API sadece transport katmani gibi davranir.
- Test edilebilirlik artar, ancak dosya sayisi ve soyutlama maliyeti yukselir.

### SignalR + Redis

- Realtime event dagitimi node sayisi arttiginda da korunur.
- Redis baglantisi kritik bagimlilik haline gelir; operasyonel izleme gerektirir.

### EF Core + PostgreSQL

- Migration tabanli sema yonetimi kolaylasir.
- Performans, query pattern ve indeks disiplini gerektirir.

### React + Vite + Playwright

- Gelistirme dongusu hizlidir.
- Kritik kullanici akislarinin regression riski E2E ile azaltilir.

## Teknik Borc ve Gelisim Onerileri

- JWT secret ve CORS ayarlari ortama gore zorunlu policy ile sertlestirilmelidir.
- QA panelinin production buildde tamamen disable edilmesi icin compile-time flag kullanimi guclendirilebilir.
- Web tarafinda bundle budget kontrolu CI adimina eklenmelidir.
