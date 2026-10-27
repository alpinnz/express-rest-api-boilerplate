# Menggunakan Repository sebagai Template

Gunakan checklist ini setelah membuat repository turunan. Nilai example ditujukan untuk development/test lokal, bukan untuk production.

## Personalisasi project

1. Pilih slug project lowercase dan ganti `name` di `package.json`. Setelah mengubah manifest, perbarui lockfile dengan `npm install --package-lock-only` menggunakan versi npm yang dipatok repository.
2. Ganti identitas `express-rest-api-boilerplate` pada judul README, logger, namespace debug, dan `application_name` PostgreSQL. Cari string lama dengan `rg -n "express[-_]rest[-_]api[-_]boilerplate"`.
3. Ubah nama database pada `.env.example`, `.env.test.example`, dan service PostgreSQL di `compose.yaml` serta `bitbucket-pipelines.yml`. Sesuaikan port jika beberapa project dijalankan bersamaan.
4. Perbarui metadata API di `docs/api/openapi.yaml` seperti judul, deskripsi, kontak, lisensi, dan server. Regenerasi output dengan `npm run api:generate`; edit Postman collection agar sesuai kontrak baru.
5. Tinjau modul contoh Health, Auth, Users, dan Roles. Hapus fitur hanya setelah migration, seeder, OpenAPI, Postman, test, locale, dan dokumentasi terkait ikut diselaraskan.
6. Pilih dan tambahkan file lisensi sebelum mendistribusikan repository secara publik. Repository ini tidak menetapkan lisensi untuk turunan.

## Sebelum production

- Buat environment production dari secret manager/platform. Jangan menyalin password dari file `.env.example` atau `.env.test.example`.
- Hapus atau batasi seeder akun demo. Seeder tersebut hanya untuk development/test dan menggunakan `SEED_DEMO_USER_PASSWORD`.
- Provision owner pertama melalui prosedur database terkontrol yang dijelaskan di README; endpoint registrasi publik selalu memberi role `user`.
- Tinjau CORS, trusted proxy CIDR, rate limit, TLS, database SSL, pool, token TTL, log redaction, backup, dan kebijakan retensi soft-delete terhadap kebutuhan deployment.
- Rate limiter bawaan menyimpan hitungan per proses. Gunakan pembatasan pada gateway/edge atau store bersama jika deployment menjalankan beberapa replica.
- Pipeline yang tersedia adalah Bitbucket Pipelines. Aktifkan pada repository tujuan dan jalankan gate remote; keberadaan file pipeline tidak membuktikan konfigurasi remote sudah aktif.
- Baseline migration dan `db:refresh` ditujukan untuk database baru atau data development/test. Jika turunan sudah menyimpan data, rancang migration forward yang mempertahankan data; jangan mengganti migration yang sudah diterapkan.
- `package.json` ditandai `private`. Pertahankan bila repository hanya dipakai sebagai source/template; ubah dengan sengaja jika turunan memang akan dipublikasikan ke npm.

## Bootstrap dan verifikasi

```sh
npm ci
npm run env:setup
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Untuk gate lengkap, jalankan PostgreSQL test lalu CI lokal:

```sh
npm run db:test:up
npm run ci
```

`npm run ci` menjalankan layout/API/localization/barrel checks, typecheck, lint, format, unit/HTTP coverage, PostgreSQL integration, dan build. Periksa hasil aktual pada `docs/verification.md`; hasil lokal tidak menggantikan pipeline remote atau pemeriksaan deployment.
