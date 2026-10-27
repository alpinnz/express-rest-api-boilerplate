# ADR 0006: Validasi konfigurasi saat startup

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 6

## Konteks

Host, port, kredensial PostgreSQL, SSL, pool, CORS, log level, rate limit, dan trust proxy berubah menurut lingkungan. Nilai yang salah perlu gagal sebelum API menerima request, tanpa membuat service membaca `process.env` sendiri.

## Keputusan

- Parse dan validasi environment di `loadEnvironment`, lalu teruskan satu nilai `Environment` ke konstruksi database dan aplikasi. Service menerima dependency, bukan membaca env global.
- Gunakan field koneksi PostgreSQL terpisah (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASS`) sesuai contoh env dan Compose. Konfigurasi SSL, timeout, serta ukuran pool dimiliki pembuat database.
- Validasi origin CORS dari konfigurasi; jangan mengasumsikan CORS sebagai autentikasi atau otorisasi. File `.env.example` dan `.env.test.example` adalah contoh lokal, bukan tempat secret produksi.

## Batas keputusan

Parser environment memeriksa nilai yang didefinisikan di source, seperti port, SSL boolean, origin CORS, dan batas numerik; ADR ini tidak menyatakan setiap string env telah divalidasi secara semantik. CORS mengatur browser origin, bukan identitas pemanggil. Secret produksi tidak berasal dari file contoh repository.

## Alasan

Validasi startup memberi kegagalan yang dapat didiagnosis sebelum server listen. Injeksi konfigurasi menjaga perilaku service stabil antara development, test, dan deployment. Pemisahan field koneksi sesuai kebutuhan Compose/CI baseline; perubahan ke URL tunggal menjadi migrasi konfigurasi yang harus ditinjau.

## Alternatif yang dipertimbangkan

- Satu `DATABASE_URL`. Lebih ringkas untuk platform deployment tertentu, tetapi berbeda dari model konfigurasi baseline dan mengubah validasi/setup.
- Database selain PostgreSQL. Membutuhkan perubahan dialect, migration, test harness, dan CI sehingga merupakan perubahan platform, bukan sekadar konfigurasi.

## Konsekuensi

Perubahan format env memerlukan pembaruan parser, contoh env, Compose/CI, dan konfigurasi deployment pada perubahan yang sama. Nilai production tetap dimiliki platform deployment; keputusan ini tidak menetapkan kredensial atau origin produksi.

## Kriteria penerapan

- Environment dibaca dan divalidasi pada startup sebelum dipakai membuat database atau aplikasi; service memperoleh konfigurasi melalui dependency.
- Jika field env berubah, parser, contoh env, Compose/CI, dan konfigurasi deployment yang relevan diperbarui bersama.

## Tinjau ulang ketika

Platform deployment mewajibkan bentuk konfigurasi lain, misalnya URL koneksi tunggal, atau ditemukan env yang perlu validasi tambahan. Migrasi format mempertimbangkan kompatibilitas rollout dan dokumentasi operator.

## Referensi

- [Arsitektur aspek 6](../architecture.md#6-environment-postgresql-dan-cors)
- [Parser environment](../../src/config/environment.ts)
- [Konstruksi database](../../src/config/database.ts)
