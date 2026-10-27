# ADR 0016: Kelola siklus request dan kesiapan server

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 16

## Konteks

Request dapat selesai normal, gagal di tengah middleware, atau kehilangan koneksi client. Proses server juga perlu membedakan "hidup" dari "siap" dan berhenti dengan menutup koneksi serta resource dalam batas waktu.

## Keputusan

- Buat request ID dan Awilix scope pada awal request, sebelum localization dan parsing body. Pasang protocol/security middleware, validasi, route/controller, not-found, lalu error middleware sesuai urutan di `src/app.ts`.
- Dispose request scope sekali pada `finish` atau `close`. Sertakan request ID, method, path, status, dan durasi pada log request; jangan log body, SQL, password, atau credential.
- Pisahkan `/health/live` dari `/health/ready`; readiness memeriksa database dan menjadi tidak siap setelah shutdown dimulai. Pada sinyal berhenti, tutup koneksi HTTP lalu root container dengan deadline.

## Batas keputusan

ADR ini mengatur urutan middleware dan lifecycle proses HTTP. Ia tidak menentukan nilai timeout atau probe pada platform deployment tertentu; konfigurasi tersebut harus cocok dengan deadline shutdown dan kebutuhan traffic nyata.

## Alasan

Urutan middleware memastikan error dan log memiliki request ID serta locale. Dua event penyelesaian request memerlukan disposal idempotent agar scope tidak ditutup dua kali. Liveness dan readiness memberi sinyal operasional yang berbeda kepada platform.

## Alternatif yang dipertimbangkan

- Hanya health endpoint gabungan. Lebih mudah, tetapi orchestrator tidak dapat membedakan proses hidup dari proses siap melayani request.
- Request scope di-dispose hanya pada event `finish`. Tidak memadai untuk koneksi yang putus; baseline juga menutup pada `close` dengan disposal satu kali.

## Konsekuensi

Error setelah header terkirim diteruskan ke Express; response kedua tidak dibuat. Shutdown yang melewati deadline menutup koneksi tersisa. Endpoint health adalah endpoint infrastruktur; kontrak User tetap dimiliki OpenAPI. Runtime behavior perlu dibuktikan dengan eksekusi, bukan hanya keberadaan handler di source.

## Kriteria penerapan

- Request ID dan scope tersedia sebelum middleware yang dapat gagal; scope ditutup sekali pada `finish` atau `close`.
- Readiness memeriksa database dan berubah saat shutdown; proses menutup server serta root container dalam batas waktu.

## Tinjau ulang ketika

Server menambah koneksi panjang seperti streaming/WebSocket, health check perlu dependency lain, atau deadline shutdown yang sekarang tidak cukup untuk request yang sah.

## Referensi

- [Arsitektur aspek 16](../architecture.md#16-flow-end-to-end-dan-lifecycle)
- [Perakitan aplikasi HTTP](../../src/app.ts)
- [Startup dan shutdown](../../bin/www.ts)
- [Request context](../../src/shared/http/request-context.middleware.ts)
