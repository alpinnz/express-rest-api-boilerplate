# ADR 0025: Jalankan seeder database yang idempotent

- **Status:** Accepted
- **Tanggal:** 2026-10-27

## Konteks

Database membutuhkan data referensi dan fixture untuk menjalankan alur aplikasi. Migration memiliki satu file per table; seed data disimpan terpisah agar dapat dipanggil ulang pada development, test, maupun deployment.

## Keputusan

- Simpan seeder berurutan pada `seeders/<timestamp>-<name>.seeder.ts`. Setiap file mengekspor daftar `environments` dan fungsi `seed`.
- Seeder dipanggil ulang pada setiap `npm run db:seed`; runner tidak menyimpan history. Setiap operasi seed harus idempotent dan tidak menghapus data yang tidak dimiliki seed tersebut.
- Runner memanggil seeder secara berurutan dalam satu transaksi. Seeder memakai transaksi yang diberikan dan tidak membuka transaksi lain.
- CLI source dan production memakai PostgreSQL advisory lock yang sama dengan migration. Jalankan migration sebelum seeder.
- Seeder role memastikan ID, nama, dan level katalog baseline sesuai di semua environment. Role hilang dapat diisi; role yang ada dengan nilai berbeda menghasilkan error, bukan ditimpa otomatis.
- Satu seeder akun demo membuat User dan credential terkait dalam satu transaksi; seeder ini hanya berjalan pada development/test. Password dibaca dari environment dan hash dibuat memakai password hasher aplikasi.
- Tidak ada seeder untuk `auth_sessions`; sesi harus diterbitkan melalui login, bukan ditanam sebagai token statis.
- Setiap seeder menyatakan environment. Akun/password demo dan provisioning owner pertama tidak menjadi bagian seeder production.

## Batas keputusan

Keputusan ini menetapkan pola pengisian data awal yang dapat diulang. Data yang memerlukan perubahan terurut, transformasi, atau penghapusan tetap ditangani melalui migration yang direview. Seeder tidak menggantikan API untuk pengelolaan data produk.

## Alasan

Seeder tanpa history mudah diulang setelah partial failure, tetapi hanya aman bila setiap operasi idempotent. Satu transaksi membuat semua seeder yang dijalankan berhasil atau seluruh batch rollback. Lock bersama mencegah seed dan migration berjalan bersamaan.

## Konsekuensi

- Tambahkan file baru dengan timestamp setelah seeder terakhir; jangan mengubah perilaku seed agar menghapus atau menimpa data secara diam-diam.
- `npm run db:seed` memerlukan tabel yang sudah dibuat migration. Deployment harus menjalankan migration, kemudian seeder, baru menjalankan API.
- Migration hanya membuat schema. Seeder membuat katalog role dan fixture akun sesuai environment.
- Seeder user/credential tidak menimpa baris yang sudah ada; reset lokal/test dilakukan dengan `db:refresh`, bukan seeder yang menghapus data.
- Koreksi data yang nilainya berbeda dari katalog memerlukan keputusan dan migration/manual repair yang direview.

## Kriteria penerapan

- Dua kali menjalankan seed pada database yang sama menghasilkan data akhir yang sama.
- Jika satu seeder gagal, tidak ada perubahan parsial dari batch transaksi.
- Environment yang tidak terdaftar tidak menjalankan seeder tersebut.
- Seeder tidak membuat akun production atau menyimpan password contoh.
- Runner source dan build menemukan file seed yang sama dan menggunakan advisory lock migration.

## Tinjau ulang ketika

Seed volume data besar, memerlukan progress/resume, perlu history per seeder, atau harus mengubah data yang sudah ada secara terurut.

## Referensi

- [ADR migration](0013-database-migration-lifecycle.md)
- [Panduan development](../development.md#migration-dan-seeder)
- [Seeder runner](../../src/shared/database/seeder-runner.ts)
- [CLI seeder](../../bin/seed.ts)
- [Default role seeder](../../seeders/202610270001-default-roles.seeder.ts)
- [Demo account seeder](../../seeders/202610270002-development-demo-account.seeder.ts)
