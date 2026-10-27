# Panduan Development dan AI Agent

## Status dan cara mulai

Checkout ini berisi source API, package scripts, panduan arsitektur, dan kontrak OpenAPI. Gunakan AGENTS.md dan README.md sebagai titik mulai, ikuti `docs/naming.md`, lalu baca kontrak dan file fitur yang relevan. Catat hasil verifikasi aktual dan gate yang belum terbukti di `docs/verification.md`; keberadaan file CI tidak membuktikan pipeline remote sudah pernah berjalan.

Arsitektur memakai modul fitur dengan file dikelompokkan pada subfolder tanggung jawab (`controller/`, `service/`, `repository/`, `model/`, dan kategori lain sesuai kebutuhan). Implementasi user merupakan contoh vertikal. Buat hanya folder yang berisi file; tidak semua fitur memerlukan setiap kategori.

## Sumber kebenaran dan perubahan

| Area                                                             | Sumber yang mengatur                                                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tujuan/scope perubahan                                           | Instruksi tugas dan acceptance criteria yang disepakati                                                                                                                   |
| Struktur dan workflow agent                                      | AGENTS.md dan panduan ini                                                                                                                                                 |
| Naming code, boundary, dan test                                  | docs/naming.md                                                                                                                                                            |
| Bentuk HTTP, field, status, operationId                          | docs/api/openapi.yaml                                                                                                                                                     |
| Request Postman dan script penyimpanan token                     | docs/api/postman-collection.json; script post-response tingkat collection berlaku ke semua request, jaga paths, payload, dan response script tetap sinkron dengan OpenAPI |
| Makna perilaku resource                                          | docs/api/api-baseline.md dan keputusan di bawah                                                                                                                           |
| Keputusan arsitektur dan trade-off                               | [Indeks ADR](adr/README.md)                                                                                                                                               |
| Implementasi persistence                                         | Model, migration untuk schema, dan seeder untuk data awal yang bisa diulang                                                                                               |
| Generated request/response types, Markdown, localization, barrel | Source generator; output tidak diedit manual; suffix boundary mengikuti [konvensi penamaan](naming.md)                                                                    |

Prioritas bukan izin menyembunyikan kontradiksi. Bila YAML dan baseline berbeda, tunjukkan perbedaannya, tetapkan perilaku sesuai scope tugas, lalu selaraskan keduanya dan test. Jika keputusan belum dapat ditentukan, lanjutkan pekerjaan independen dan laporkan bagian yang terblokir.

Perubahan kontrak wajib menyebut trigger, perilaku sebelum/sesudah, dampak client, dan kebutuhan perubahan versi API. `docs/api/openapi.yaml` menjadi sumber kontrak; source tree dan lockfile menjadi bukti implementasi. `docs/architecture.md` dan ADR mencatat keputusan dan rationale, bukan bukti gate runtime.

## Keputusan baseline yang mengikat

| Topik                         | Keputusan                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Response                      | Satu envelope canonical untuk seluruh resource response, termasuk 400; raw Valfuse dihapus dari schema target                                                                                                                                                                                                        |
| Status validasi               | Boundary request 400; invariant service/entity 422                                                                                                                                                                                                                                                                   |
| Registrasi public             | POST /api/v1/users dan POST /api/v1/auth/register memanggil AuthService.register                                                                                                                                                                                                                                     |
| UserService.create            | Boleh dipanggil internal untuk membuat profil tanpa credential. Profil tersebut belum merupakan akun login                                                                                                                                                                                                           |
| Kepemilikan hash              | AuthService dan credential repository; UserService tidak mengelola password                                                                                                                                                                                                                                          |
| Atomicity register            | Profil dan credential harus commit/rollback bersama pada object transaction yang sama                                                                                                                                                                                                                                |
| Email                         | Trim/lowercase dan unik termasuk user soft-deleted; constraint DB menjadi otoritas saat race                                                                                                                                                                                                                         |
| Soft delete                   | User, Role, dan credential ditandai melalui `deleted_at` dan tersembunyi dari pembacaan normal. Deaktivasi sendiri mengosongkan hash credential serta mencabut semua sesi dalam satu transaksi; sesi tetap tercatat melalui `revoked_at`                                                                             |
| PUT phone_number/country_code | Omitted atau null mengosongkan field tersebut                                                                                                                                                                                                                                                                        |
| Unknown field                 | Dibuang oleh boundary validator                                                                                                                                                                                                                                                                                      |
| Locale                        | Accept-Language id/en, default id; message diterjemahkan, code/data/field tetap stabil                                                                                                                                                                                                                               |
| Konflik update bersamaan      | Tidak ada version/ETag baseline; update valid terakhir dapat mengganti nilai sebelumnya. Optimistic locking memerlukan perubahan kontrak tersendiri                                                                                                                                                                  |
| Auth scope                    | `/users/me`, seluruh CRUD `/roles`, dan `PATCH /users/{user_id}/role` memerlukan bearer access token. Daftar/detail User mensyaratkan role level minimal 80 (`admin`); update/delete by ID mensyaratkan level 100 (`owner`) dan dilarang untuk akun sendiri. Permission umum dan tenant authorization belum tersedia |
| Token TTL                     | Access default 900 detik; refresh default 86400 detik, atau 604800 detik bila `remember_me: true`. Nilainya diatur lewat `AUTH_ACCESS_TOKEN_TTL_SECONDS`, `AUTH_REFRESH_TOKEN_TTL_SECONDS`, dan `AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS`                                                                         |
| Role hierarchy                | Role system: `owner` level 100, `admin` level 80, `staff` level 50, `user` level 10 (default). Level lebih tinggi memberi privilege lebih tinggi. Actor hanya dapat mengubah user/role dengan level di bawahnya; role system dilindungi                                                                              |
| Database                      | PostgreSQL 16.15 untuk Compose/CI; production menentukan release patch/role/backup melalui deployment review                                                                                                                                                                                                         |

## Migration dan seeder

ID baru untuk User, Role, sesi auth, dan `meta.request_id` menggunakan UUIDv7. Boundary tetap menerima semua versi UUID yang valid. Seeder katalog role dan akun demo memakai ID UUIDv7. Rekey ID data yang sudah tersimpan bukan bagian dari baseline.

Baseline migration terdiri dari satu file `CREATE TABLE` per table: `roles`, `users`, `auth_credentials`, dan `auth_sessions`. Setiap file langsung membuat schema final, termasuk `deleted_at` untuk role dan credential serta constraint bahwa credential aktif harus memiliki `password_hash` dan credential terhapus harus mengosongkannya. Kolom phone split, `remember_me`, dan `role_id` juga berada pada baseline table masing-masing. Tidak ada migration data atau migration alter untuk instalasi baru.

Data awal dibuat oleh dua seeder sesuai fungsinya: katalog role `owner`/100, `admin`/80, `staff`/50, `user`/10 berlaku untuk semua environment; akun demo `demo-admin@example.test` beserta credential hanya berjalan di development/test dan memakai role `owner`. Kedua seeder memakai ID UUIDv7. Seeder tidak mengubah data lama atau memetakan katalog role terdahulu; `auth_sessions` sengaja tidak di-seed karena sesi harus diterbitkan lewat login.

Database kosong memakai `npm run db:migrate`, kemudian `npm run db:seed`. History sebelum baseline ini, termasuk database yang pernah menjalankan migration data katalog role atau rekey ID fixture, tidak cocok dengan file migration sekarang. Database development/test yang seluruh datanya boleh dihapus harus memakai `npm run db:refresh` atau `npm run db:refresh:test`. Refresh menghapus semua object di schema `public`; CLI menolak environment production. Database persisten memerlukan migration forward yang direview untuk mempertahankan data dan assignment role; jangan menjalankan refresh di sana.

Seeder bernama `seeders/<timestamp>-<nama>.seeder.ts`, mengekspor `environments` dan `seed`, lalu dipanggil berurutan dalam satu transaksi tanpa tabel history. Semua seeder harus idempotent dan memakai transaction dari runner. Role seeder berlaku pada semua environment. Satu seeder akun demo membuat User beserta credential terkait dan hanya berjalan pada development/test; password dibaca dari `SEED_DEMO_USER_PASSWORD` dan credential yang sudah ada tidak ditimpa. `auth_sessions` sengaja tidak memiliki seed data karena session token harus diterbitkan lewat login.

Kontrak profil berubah atas permintaan: field `phone` diganti menjadi `phone_number` dan `country_code` pada request serta response User. Klien yang memakai `/api/v1` harus memperbarui payload dan pembacaan response; path API tetap `/v1`. Registrasi kini menolak password di bawah 8 karakter atau yang tidak memiliki huruf besar, angka, simbol non-whitespace, dan nilai `confirm_password` yang tidak sama.

Pemanggil yang membutuhkan akun lengkap harus memakai AuthService.register. Login menolak profil tanpa credential dan user soft-deleted. Field `remember_me` pada login opsional, default `false`, tersimpan pada sesi, dan tetap berlaku saat refresh token dirotasi. Seeder membuat katalog role; operator tepercaya perlu menetapkan owner pertama sebelum endpoint perubahan role dapat digunakan.

Semua operasi penghapusan resource mempertahankan row: User dan Role memakai `deleted_at`; deaktivasi sendiri juga menandai credential terhapus dan mengosongkan hash password. Sesi tetap tercatat dengan `revoked_at`. Pembacaan normal mengecualikan User, Role, dan credential yang terhapus. Tidak ada endpoint restore atau hard delete. Penghapusan Role ditolak jika masih ditetapkan pada user aktif; nama Role yang di-soft-delete tetap reserved oleh constraint unik global.

### Akun demo dan provisioning owner production

Development/test menyediakan `demo-admin@example.test` dengan role `owner`; password dibaca dari `SEED_DEMO_USER_PASSWORD` pada env file. Seeder ini tidak berjalan di production. Untuk production, registrasikan akun melalui endpoint register, verifikasi identitasnya, lalu operator tepercaya dapat menetapkan role `owner` melalui akses database deployment yang dibatasi. Jangan menerima ID/email dari request publik sebagai mekanisme bootstrap.

```sql
SELECT id, email
FROM users
WHERE email = 'owner-terverifikasi@example.com'
  AND deleted_at IS NULL;

UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'owner'),
    updated_at = NOW()
WHERE id = '<verified-user-uuid>'
  AND deleted_at IS NULL
RETURNING id, email, role_id;
```

Pastikan `UPDATE` mengembalikan tepat satu row sebelum memakai akun tersebut untuk assignment role. Catat provisioning sesuai prosedur audit akses database organisasi.

## Workflow perubahan fitur

1. Baca acceptance criteria, source YAML, schema, dan contoh user yang relevan. Tulis asumsi yang memengaruhi hasil.
2. Tentukan file dan dependency yang diperlukan. Pertahankan pola fitur; hindari refactor area lain tanpa hubungan dengan tugas.
3. Jika kontrak berubah, selaraskan YAML/baseline dan jalankan api:generate. Untuk schema DB, tambah migration baru.
4. Implementasikan controller/service/repository pada tanggung jawab masing-masing; registrasikan dependency di container.
5. Tambahkan test perilaku yang bermakna untuk sukses, input invalid, dan failure yang dapat mengubah data.
6. Perbarui locale id/en, generated files, dan dokumentasi yang terpengaruh.
7. Jalankan gate relevan lalu review diff. Laporkan hasil dan gate terblokir secara eksplisit.

## Matriks acceptance dan bukti

| Area               | Acceptance criteria                                                                                                                                                                    | Bukti yang diperlukan                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| HTTP CRUD          | Lima operasi, status/envelope/field sesuai OpenAPI, password/hash tidak keluar                                                                                                         | HTTP tests                                         |
| Boundary           | Unknown fields dibuang, tipe salah ditolak, pecahan pagination ditolak, phone fields PUT jelas                                                                                         | HTTP tests                                         |
| Error              | Status/code stabil, details terstruktur, 500 tidak membocorkan error internal                                                                                                          | HTTP failure assertions                            |
| Bahasa             | id/en/default, Content-Language/Vary, request paralel tidak bertukar locale                                                                                                            | HTTP locale tests                                  |
| DI                 | CLASSIC tokens cocok, repository singleton/service scoped, strict lifetime aktif                                                                                                       | Container tests                                    |
| Registrasi         | Satu commit dua tabel; credential gagal membatalkan keduanya                                                                                                                           | Unit orchestration dan real PostgreSQL integration |
| Profile-only       | Internal create menghasilkan profil tanpa credential                                                                                                                                   | Unit dan real DB integration                       |
| Concurrency email  | Dua register email sama: satu sukses, satu conflict, hanya satu pasangan row                                                                                                           | Real DB integration                                |
| Update/soft delete | Konflik update tidak mengubah row; email terhapus tetap reserved                                                                                                                       | Real DB integration                                |
| Migration          | Database kosong bisa up; pending kosong; source/build memakai nama stabil                                                                                                              | Integration, migration unit, build smoke           |
| Tooling            | Typecheck/lint/format/generator/layout lulus                                                                                                                                           | npm run check                                      |
| Coverage           | Setiap service yang dimuat suite minimal 90% line/function coverage; test group kosong membuat script gagal. Request/response type-only diperiksa dengan typecheck dan HTTP assertions | npm run test:coverage                              |

Tambahkan acceptance khusus fitur pada task-template.md, bukan menganggap tabel ini mencakup seluruh kebutuhan produk. Check menjalankan test ber-coverage sekali; CI memakai check tersebut sehingga unit/HTTP tidak diulang sebagai gate kedua. Coverage mengukur eksekusi, bukan bukti bahwa semua aturan bisnis sudah benar. Branch coverage dilaporkan tanpa threshold baseline; perubahan dengan cabang baru tetap harus memiliki skenario relevan.

## Kriteria selesai

- Scope dan acceptance tugas terpenuhi; perubahan kontrak/schema dijelaskan.
- Source/generated/locale/docs sesuai; dependency dan lockfile konsisten.
- Check dan coverage service lulus. Perubahan DB/transaction/migration menjalankan integration pada database khusus test.
- Build berhasil. Perubahan Docker/CI diverifikasi pada runner yang mendukungnya atau ditandai belum terverifikasi.
- Tidak ada secrets/log SQL/body/password atau perubahan file yang tidak terkait.
- Laporan mencakup hasil, test/perintah, kegagalan atau gate yang belum berjalan, dan risiko yang tersisa.

Status tugas dapat berupa implemented, verified, atau verification-blocked. Jangan menyebut fully verified jika integration/CI yang wajib belum berjalan. Hindari mengarang persentase kesiapan atau menyamakan unit fake transaction dengan PostgreSQL nyata.

## CI Bitbucket dan database

bitbucket-pipelines.yml menjalankan gate pada setiap push, menggunakan Node/npm baseline dan service PostgreSQL terpisah. Cache adalah cache unduhan npm dengan key lockfile; node_modules tidak di-cache. CI menonaktifkan hooks, menyiapkan env contoh, mengubah port test ke 5432 milik service, lalu menjalankan npm run ci.

Wait script melakukan query SELECT 1 dengan deadline 30 detik. Tidak menggunakan sleep tanpa batas atau menganggap container started berarti database ready. Service credentials hanya fixture CI. Tidak ada deployment atau production secret di pipeline ini.

Aktifkan Pipelines pada repository Bitbucket dan jadikan build sukses sebagai merge check sesuai kebijakan tim. Paket ini menyiapkan file konfigurasi; aktivasi remote dan hasil eksekusi remote perlu dicatat oleh pemilik repository.

## Pelaporan dan referensi

Gunakan format laporan: hasil perubahan; test yang dijalankan; hasil test; gate terblokir; keputusan/dampak kontrak. Agent tidak membuat commit, push, atau deployment kecuali diminta tugas.

- [AGENTS.md](https://agents.md/)
- [Atlassian service containers](https://support.atlassian.com/bitbucket-cloud/docs/databases-and-service-containers/)
- [Docker Compose readiness](https://docs.docker.com/compose/how-tos/startup-order/)
- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)
