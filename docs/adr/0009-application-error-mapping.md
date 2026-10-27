# ADR 0009: Pusatkan pemetaan kegagalan HTTP

- **Status:** Accepted (response omission superseded in part by [ADR 0029](0029-omit-null-response-fields.md))
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 9

## Konteks

Input tidak dipercaya, constraint database dapat gagal, dan dependency dapat tidak tersedia. Client memerlukan kode serta status stabil, sedangkan log server perlu konteks diagnosis tanpa membocorkan SQL, stack trace, atau credential.

## Keputusan

- Validasi bentuk request pada HTTP boundary. Input yang gagal schema menghasilkan 400 dengan `ErrorDetail[]`; kegagalan invariant entity/service menghasilkan `validation_error` 422.
- `ValidationError` adalah base abstrak yang hanya membawa field dan issue code. Setiap modul memiliki subclass error domain sendiri; HTTP adapter memetakan issue code ke pesan locale dan lokasi response. Domain tidak bergantung pada Express atau localization.
- Gunakan `ApplicationError` untuk kegagalan yang dikenal. Status HTTP dan translation key untuk setiap kode terdaftar sekali pada `application-error.definition.ts`; `sendFailure` memakai definisi itu untuk status dan pesan.
- Serialisasi semua kegagalan terkelola melalui `sendFailure`: `errors` berisi detail field bila ada, dan `meta.request_id`; field `data` tidak dikirim pada failure. Error tak dikenal dilog sebagai kegagalan internal lalu dikirim sebagai 500 tanpa detail internal. Bentuk omission field `errors` ditetapkan lebih lanjut di [ADR 0029](0029-omit-null-response-fields.md).

## Batas keputusan

ADR ini mengatur klasifikasi kegagalan internal dan pemetaan ke HTTP. Status, kode, serta schema yang terlihat client dimiliki OpenAPI; service tidak membentuk response HTTP. Diagnostik internal hanya masuk log yang aman.

## Alasan

Controller dan service tidak perlu menyalin format error per endpoint. Kode dan lokasi field tetap stabil antar locale; hanya pesan yang diterjemahkan. Pemetaan error database terjadi sebelum respons HTTP, sehingga detail driver tidak menjadi kontrak publik.

## Alternatif yang dipertimbangkan

- Response error dibentuk per controller. Implementasi awal lebih langsung, tetapi memecah status, format, lokalisasi, dan sanitasi di banyak tempat.
- Melempar error driver langsung ke client. Ditolak karena dapat membocorkan detail database/internal.

## Konsekuensi

Status dan bentuk payload publik dimiliki [OpenAPI](../api/openapi.yaml). Saat menambahkan kode error baru, tambahkan satu entri pada definisi error, terjemahan locale, dan kontrak OpenAPI. Tipe `ApplicationErrorCode`, response helper, dan middleware menggunakan definisi tersebut sehingga tidak memerlukan pemetaan duplikat. Endpoint baru yang memakai kode yang sudah ada tidak memerlukan perubahan middleware. Setelah header terkirim, middleware meneruskan error ke Express; ia tidak menulis response kedua.

## Kriteria penerapan

- Kegagalan yang dikenal memakai status dan message key dari katalog bersama; controller tidak membuat format failure tersendiri.
- Error tak dikenal menghasilkan 500 tanpa detail internal; log mempertahankan konteks diagnostik yang aman dan response tidak ditulis dua kali.

## Tinjau ulang ketika

Ada kategori kegagalan baru yang membutuhkan status atau kode publik baru, atau transport selain HTTP perlu menerjemahkan `ApplicationError` dengan aturan berbeda.

## Referensi

- [Arsitektur aspek 9](../architecture.md#9-errorfailure-berada-di-mana)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Baseline API](../api/api-baseline.md)
- [Middleware error HTTP](../../src/shared/http/error.middleware.ts)
