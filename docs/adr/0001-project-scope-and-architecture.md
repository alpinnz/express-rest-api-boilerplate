# ADR 0001: Gunakan satu API modular berdasarkan fitur

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 1

## Konteks

Baseline ini melayani satu REST API User dan registrasi credential. Perubahan profil, autentikasi, HTTP, dan PostgreSQL memiliki tanggung jawab berbeda, tetapi belum ada kebutuhan untuk deploy layanan-layanan tersebut secara independen.

## Keputusan

- Gunakan satu aplikasi Express 5 yang diorganisasi dalam modul fitur dan dapat dijalankan pada beberapa replica. Untuk operasi User, alur utama adalah route → controller → service → repository → Sequelize model → PostgreSQL.
- Tempatkan perilaku profil pada `users`, definisi dan assignment role pada `roles`, serta hash, credential, dan sesi pada `auth`. Fitur boleh memanggil kontrak service fitur lain ketika satu operasi memang melintasi batas tersebut.
- Tempatkan mekanisme HTTP, transaksi, logging, dan keamanan yang bersifat infrastruktur aplikasi pada `shared`. Infrastruktur tidak menentukan aturan profil; service tidak membuat response Express secara langsung.

## Batas keputusan

Keputusan ini mengatur bentuk aplikasi dan arah tanggung jawab, bukan jumlah replica, strategi hosting, atau kewajiban membuat semua jenis file pada tiap fitur. Registrasi dua tabel berada dalam satu database; kebutuhan komunikasi antarlayanan, kepemilikan database terpisah, dan konsistensi terdistribusi belum ada. Penempatan file rinci diputuskan pada [ADR 0003](0003-feature-module-structure.md).

## Alasan

Satu aplikasi dengan database bersama memungkinkan registrasi profil dan credential memakai satu transaksi. Modul fitur mempertahankan kepemilikan kode tanpa folder `domain/application/infrastructure/presentation` yang belum memberi isolasi tambahan. Boundary yang diperlukan tetap eksplisit melalui service, repository, mapper, dan kontrak HTTP yang sudah ada.

## Alternatif yang dipertimbangkan

- Clean Architecture berlapis per fitur memberi isolasi layer lebih kuat, tetapi menambah folder, interface, dan pemetaan tanpa kebutuhan nyata pada baseline ini.
- Microservices memerlukan kebutuhan deployment atau batas domain terpisah yang belum ada pada baseline ini.

## Konsekuensi

Penambahan fitur mengikuti modul pemiliknya dan membuat abstraksi baru hanya jika ada kebutuhan substitusi, isolasi, atau reuse yang nyata. Pemisahan menjadi layanan baru memerlukan keputusan tersendiri tentang kepemilikan data, transaksi, kegagalan jaringan, dan deployment. ADR ini menetapkan arah struktur; bukti implementasi dan gate ada pada source serta [catatan verifikasi](../verification.md).

## Kriteria penerapan

- Route User dan Role menuju controller/service modul masing-masing; registrasi dan role assignment melintasi modul melalui kontrak service, bukan akses tabel lintas modul di controller.
- Kode infrastruktur baru ditempatkan pada pemilik aplikasi yang sesuai; aturan profil dan credential tetap pada modulnya.

## Tinjau ulang ketika

Sebuah fitur membutuhkan deployment independen, database sendiri, atau batas organisasi yang tidak dapat dipenuhi modul dalam satu aplikasi. Ukur biaya transaksi, komunikasi, dan operasi sebelum memecah layanan.

## Referensi

- [Arsitektur aspek 1](../architecture.md#1-keputusan-proyek-dan-batas-perubahan)
- [Struktur modul](0003-feature-module-structure.md)
- [Komposisi aplikasi](../../src/app.ts)
