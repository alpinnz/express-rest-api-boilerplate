# ADR 0031: Gunakan UUIDv7 untuk identifier baru

- **Status:** Accepted
- **Tanggal:** 2026-10-27

## Konteks

API menggunakan UUID sebagai identifier User, Role, auth session, dan request. Generator bawaan `crypto.randomUUID()` menghasilkan UUIDv4, sedangkan UUIDv7 menyertakan timestamp millisecond sehingga identifier baru lebih mudah diurutkan berdasarkan waktu.

## Keputusan

- Semua UUID baru yang dibuat server memakai UUIDv7 melalui helper lokal `randomUUIDv7`, yang mengambil randomness dari `node:crypto` tanpa dependency tambahan.
- UUIDv7 digunakan untuk ID User baru, Role custom baru, auth session baru, request ID, ID fixture/seeder, serta contoh kontrak yang menunjukkan identifier baru.
- Field UUID tetap menerima semua UUID valid. UUID lama tidak ditolak oleh path/body validation dan tidak direkey massal karena dapat dipakai foreign key, client, dan log eksternal.
- Seeder fresh-install menetapkan ID UUIDv7 bagi katalog role system dan akun demo. Seeder tidak merekey ID pada database lama; migrasi data yang mempertahankan referensi harus ditinjau terpisah.
- UUID kolom database tetap bertipe UUID tanpa check constraint versi; aplikasi membuat identifier baru dengan v7, sementara record lama tetap dapat dipakai.

## Batas keputusan

ADR ini menetapkan versi UUID untuk identifier baru yang dikeluarkan aplikasi. Rekey seluruh data User atau identifier pihak ketiga tidak termasuk; itu memerlukan inventarisasi consumer dan migrasi terpisah.

## Alasan

UUIDv7 mempertahankan uniqueness probabilistik UUID sambil mengurutkan identifier baru menurut waktu pembuatan. Memakai `node:crypto` menjaga generator tetap kriptografis dan menghindari dependency khusus. Membiarkan identifier lama tetap valid mencegah perubahan primary key yang memutus integrasi eksternal.

## Konsekuensi

- Runtime, seeder, contoh OpenAPI/Postman, dan dokumentasi menggunakan UUIDv7 untuk identifier baru.
- ID User, Role custom, session, role system, dan akun demo yang telah tersimpan sebelum baseline UUIDv7 tetap dapat menggunakan UUID versi lama. Seeder menolak konflik katalog alih-alih mengubah identifier dan assignment diam-diam.
- Mengganti ID pada database persisten memerlukan migration forward yang meninjau seluruh foreign key serta consumer eksternal. Versi UUID tidak menjadi authorization atau security token.

## Kriteria penerapan

- Generator menempatkan timestamp UUIDv7, nibble versi `7`, dan variant RFC di bit yang sesuai.
- Semua lokasi runtime yang membuat UUID menggunakan helper v7.
- Katalog system dan fixture baru memakai literal UUIDv7.
- OpenAPI, Postman, dan contoh dokumentasi tidak menampilkan UUIDv4 sebagai identifier baru.
- Seeder fresh-install dan contoh kontrak menggunakan UUIDv7; data existing tidak direkey otomatis.

## Tinjau ulang ketika

Produk membutuhkan strict monotonic sequencing, pembatasan UUID version pada boundary API, atau kebijakan untuk rekey data lama.

## Referensi

- [UUIDv7 helper](../../src/shared/uuid/uuid-v7.ts)
- [ADR katalog role](0030-default-role-catalog.md)
- [OpenAPI](../api/openapi.yaml)
