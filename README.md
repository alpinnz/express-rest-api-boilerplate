# express-rest-api-boilerplate

Repository ini menyediakan REST API Express 5, TypeScript ESM, Sequelize 6, PostgreSQL, Awilix, dan Valfuse. Fitur Health, Auth, Users, dan Roles memakai modul berdasarkan domain dengan alur route, controller, service, repository, dan model. Kontrak endpoint ditentukan oleh [OpenAPI](docs/api/openapi.yaml) dan dijelaskan di [API baseline](docs/api/api-baseline.md).

> **Status repository:** checkout ini berisi source API Express 5 + TypeScript, package manifest/lockfile, migration/seeder, konfigurasi Compose/Docker, pipeline, dokumentasi, kontrak OpenAPI, serta unit/HTTP dan PostgreSQL integration tests. Status gate terakhir dicatat di [catatan verifikasi](docs/verification.md).

## Prasyarat

- Target runtime Node.js 24.19.x dan npm 12.0.0; versi ini tercatat dalam `.nvmrc` dan `package.json`.
- Docker Engine/Desktop dengan Compose v2 untuk database lokal, atau PostgreSQL 16 yang dikelola sendiri.
- Port API 3000, PostgreSQL development 5432, PostgreSQL test 5433.

## Menggunakan sebagai template

Sebelum mengembangkan service turunan, ikuti [panduan personalisasi boilerplate](docs/using-as-template.md). Compose sekarang menggunakan nama project berdasarkan direktori sehingga salinan dengan nama direktori berbeda tidak berbagi namespace container dan volume.

## Quickstart

Jalankan dari root repository hasil clone atau ekstraksi paket source. Jika memulai Git repository baru dari ZIP, jalankan `git init` sebelum npm ci agar prepare memasang hooks.

```bash
npm ci
npm run env:setup
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Seeder dapat dijalankan ulang setelah migration. Seeder role memverifikasi katalog tetap sesuai tanpa mengubah role yang berbeda diam-diam.

`npm run db:refresh` menghapus seluruh schema `public`, lalu migrate dan seed ulang; command ini hanya diizinkan untuk `NODE_ENV=development` atau `test`. Untuk database test gunakan `npm run db:refresh:test`. Development/test mendapat akun `demo-admin@example.test` dengan role `owner`; password-nya ada di `SEED_DEMO_USER_PASSWORD` pada env file. Seeder sesi auth sengaja tidak dibuat—login menerbitkan session baru.

`env:setup` membuat `.env` dan `.env.test` jika belum ada; file yang sudah ada dipertahankan. Credentials example hanya untuk development/test lokal. Compose memakai image PostgreSQL 16.15 yang sama dengan CI. Jika memakai server PostgreSQL sendiri, buat dua database terpisah dan sesuaikan kelima DATABASE_* pada masing-masing env.

Alamat lokal default `http://localhost:3000`; API base URL untuk request adalah `http://localhost:3000/api` dengan versi `v1`.

```bash
curl -H "Accept: application/json" -H "Accept-Language: id" http://127.0.0.1:3000/api/v1/health
```

Endpoint register, login, logout, dan refresh token tersedia pada `/api/v1/auth`. Token disimpan sebagai hash dalam sesi database; refresh token dirotasi saat dipakai. Endpoint `/api/v1/users/me`, CRUD `/api/v1/roles`, dan perubahan role memerlukan bearer access token. Daftar/detail User memerlukan role level minimal 80 (`admin`); perubahan profil dan deaktivasi User berdasarkan ID hanya untuk role `owner` level 100. Pemilik akun sendiri harus memakai endpoint `/me`, yang meminta password saat ini untuk deaktivasi. GET profil sendiri menyertakan role (`id`, `name`, `level`). Katalog role system adalah `owner` level 100, `admin` level 80, `staff` level 50, dan `user` level 10; registrasi baru mendapat `user`. Role CRUD mengelola role custom di bawah level actor; role system dilindungi, role yang masih dipakai user aktif tidak bisa di-soft-delete, dan nama role terhapus tetap reserved. Deaktivasi akun melakukan soft delete profil serta credential, mengosongkan hash password, dan mencabut sesi. Perubahan role user hanya dapat dilakukan ke user lain yang levelnya di bawah actor dan ke role yang levelnya lebih rendah daripada actor. Role permission umum dan tenant authorization belum termasuk cakupan.

ID baru yang dibuat API, termasuk `meta.request_id`, menggunakan UUIDv7. API tetap menerima semua versi UUID valid. Seeder role system dan akun demo memakai ID UUIDv7; data lama tidak direkey otomatis.

## Development dan verifikasi

```bash
npm run check
npm run db:test:up
npm run db:wait:test
npm run test:integration
npm run build
```

`npm run check` mencakup static checks dan coverage tests; `npm run ci` juga menjalankan PostgreSQL integration dan build. Pipeline Bitbucket sudah dikonfigurasi tetapi belum dijalankan remote. Detail keputusan dan status gate ada di [panduan development](docs/development.md) dan [catatan verifikasi](docs/verification.md).

Tooling mencakup Husky, ESLint, Prettier, dan generator. Source generated dikomit bersama generator; jangan edit output generated secara manual.

## Menjalankan hasil build

```bash
npm run build
node --env-file=.env --enable-source-maps dist/bin/www.js
```

Pada deployment, environment diberikan oleh platform. Untuk database fresh dengan schema kosong, jalankan `npm run db:migrate:production`, lalu `npm run db:seed:production` sebagai deployment job sebelum API dimulai. Database yang masih memakai history migration sebelum squash akan ditolak; siapkan migration forward/compatibility yang mempertahankan datanya sebelum deploy baseline ini. Jangan jalankan `db:refresh` pada data production. Dockerfile menyiapkan compiled migration dan seeder, runtime OpenAPI, dan HTML dokumentasi.

## Database lokal dan troubleshooting

- `npm run db:down` menghentikan service Compose; volume development tetap tersimpan.
- Database test memakai tmpfs dan dapat hilang saat container dihentikan; test menjalankan migration sebelum fixture.
- Connection refused: pastikan service healthy dan host/port env sesuai. Native PostgreSQL memakai port pilihannya sendiri; ubah DATABASE_PORT di `.env.test` bila tidak memakai port 5433.
- Port digunakan aplikasi lain: ubah DATABASE_PORT untuk development, atau mapping test dan `.env.test` bersama.
- Password contoh berubah tetapi database lama menolak: volume menyimpan credentials awal. Perbarui role melalui PostgreSQL; jangan menghapus volume berisi data penting untuk mengatasi konfigurasi.
- Engine npm tidak cocok: pasang npm 12 sebelum npm ci.
- Generator drift: jalankan generator terkait, review diff, lalu ulangi check.

## Dokumentasi

- [Panduan arsitektur](docs/architecture.md): keputusan desain dan pola implementasi rinci.
- [Instruksi agent](AGENTS.md): aturan umum dan batasan khusus repository.
- [Konvensi penamaan](docs/naming.md): aturan konsisten untuk identifier, tipe, file, API, dan test.
- [Panduan development](docs/development.md): sumber kebenaran, keputusan baseline, workflow, dan acceptance criteria.
- [Template tugas](docs/task-template.md): scope, acceptance criteria, verifikasi, dan format laporan.
- [API baseline](docs/api/api-baseline.md): makna perilaku endpoint dan aturan response.
- [OpenAPI YAML](docs/api/openapi.yaml): kontrak HTTP canonical.
- [OpenAPI Markdown](docs/api/openapi.md): salinan generated dari kontrak YAML.
- [Postman collection](docs/api/postman-collection.json): import sebagai collection untuk memakai base variables dan script post-response bersama pada semua request.
- [Status verifikasi](docs/verification.md): gate yang sudah dan belum dapat dijalankan pada checkout ini.
