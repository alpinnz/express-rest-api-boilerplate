# ADR 0026: Squash migration menjadi baseline per table

- **Status:** Accepted
- **Tanggal:** 2026-10-27

## Konteks

Migration bertambah sebagai rangkaian create/alter untuk schema awal yang masih berkembang. Pemilik repository ingin satu file baseline per table dan workflow refresh untuk mengulang migration serta seed saat development.

## Keputusan

- Ganti migration awal dengan baseline final satu file per table: `roles`, `users`, `auth_credentials`, dan `auth_sessions`.
- Letakkan schema final langsung pada baseline: `phone_number`, `country_code`, `role_id`, `remember_me`, kolom soft delete Role/credential, dan constraint hash credential; tidak ada migration alter terpisah untuk schema tersebut pada instalasi baru.
- `db:refresh` hanya diizinkan pada `NODE_ENV=development` atau `test`. Command menghapus seluruh object schema PostgreSQL `public`, lalu menjalankan migration dan seeder di bawah advisory lock.
- `db:migrate` dan `db:undo` menolak history migration lama yang tidak dikenal oleh baseline agar perubahan riwayat tidak membuat create-table parsial.
- Database production atau database berisi data yang harus dipertahankan memakai migration forward yang direview, bukan refresh atau penghapusan history. Konsolidasi baseline berlaku untuk fresh install sebelum history baru dipakai bersama.
- Seed role dijalankan pada semua environment; demo User dan credential hanya development/test. Auth session tidak di-seed karena token harus dibuat lewat login.

## Batas keputusan

Squash berlaku untuk baseline repository dan database development/test yang boleh di-reset. ADR ini tidak menyediakan migrasi data lama ke baseline baru dan tidak mengizinkan reset database production.

## Alasan

Baseline per table lebih mudah dibaca dan menjalankan refresh dengan urutan dependency jelas. `db:refresh` memberi workflow ulang yang deterministik untuk fixture lokal, sementara guard environment dan history mengurangi risiko menjalankan create-table pada database lama.

## Konsekuensi

- Nama history migration lama, termasuk migration alter soft delete, tidak lagi cocok dengan file yang tersedia. Database development/test lama harus di-reset melalui `db:refresh`; database persisten memerlukan migration forward khusus.
- Refresh menghapus tabel, view, sequence, constraint, dan object lain pada schema `public`; proses ini tidak bisa dibatalkan.
- Migration berjalan sebelum seed. Jika seeder gagal, schema tetap termigrasi, tetapi transaksi batch seed rollback; jalankan ulang `db:seed` setelah konfigurasi diperbaiki.
- Contoh credential demo dibatasi pada `.env.example` dan `.env.test.example`, serta seeder tidak berjalan di production.

## Kriteria penerapan

- Satu file migration membuat satu table final; dependency table diurutkan sebelum foreign key pemakainya.
- Fresh migration lalu seed menghasilkan roles, demo user/credential nonproduction, dan tidak membuat session aktif.
- `db:refresh` menolak production dan migration normal menolak history lama yang tidak dikenal.
- Deployment production memakai forward migration untuk mempertahankan data.

## Tinjau ulang ketika

Repository mulai memiliki database production dengan data, membutuhkan upgrade path resmi dari history lama, atau schema aplikasi tidak lagi dapat diwakili oleh baseline fresh-install.

## Referensi

- [ADR migration](0013-database-migration-lifecycle.md)
- [ADR seeder](0025-idempotent-database-seeders.md)
- [Panduan development](../development.md#migration-dan-seeder)
- [Refresh CLI](../../bin/refresh.ts)
- [Migration baseline](../../migrations/)
