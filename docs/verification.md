# Verifikasi Development

Tanggal: 27 Oktober 2026.

## Pemeriksaan terbaru

`npm run ci` dijalankan setelah perubahan authorization User, kontrak OpenAPI/Postman, test suite, dan pengaman test runner. Hasil lokal saat ini:

| Gate                               | Status | Bukti atau batasan                                                                                                             |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Install dan audit dependency       | Lulus  | `npm ci` berhasil; audit menemukan 0 vulnerability. npm menampilkan deprecation notice untuk tiga dependency transitif.        |
| `npm run ci`                       | Lulus  | Layout, OpenAPI, localization, barrel, typecheck, lint, format, coverage, PostgreSQL readiness, integration, dan build lulus.  |
| Unit dan HTTP                      | Lulus  | 71 test lulus; seluruh empat service yang dimuat suite memiliki 100% line/function coverage dan 98.17% branch coverage.        |
| PostgreSQL integration             | Lulus  | Satu flow real DB mencakup health, register, login, role gate, deaktivasi owner, soft delete credential, dan pencabutan sesi.  |
| Database test                      | Lulus  | `postgres-test` sehat; suite mereset schema hanya setelah memastikan `NODE_ENV=test` dan nama database berakhiran `_test`.     |
| OpenAPI/localization/barrel        | Lulus  | `npm run generate` dan seluruh `api:check`, `i18n:check`, serta `barrel:check` cocok dengan source.                            |
| Postman collection                 | Lulus  | JSON valid; operasi list/detail/update/delete User memakai `{{access_token}}`; hak akses didokumentasikan per request.         |
| Build dan dokumentasi API          | Lulus  | `npm run build` di dalam `npm run ci`; OpenAPI bundle dan HTML docs terbuat.                                                   |
| Compose dan Docker image           | Lulus  | `docker compose config --quiet` dan build Docker multi-stage berhasil; tag image verifikasi sudah dihapus setelah pemeriksaan. |
| Remote Bitbucket CI dan deployment | Belum  | Hanya gate lokal yang dijalankan; pipeline remote, image deployment, secrets production, dan konfigurasi infra tidak disentuh. |

Test runner sekarang menolak test group kosong agar glob yang tidak menemukan file tidak lagi menghasilkan exit sukses tanpa menjalankan test. Integration suite hanya boleh mereset database khusus test dengan nama berakhiran `_test`.

Build lulus dengan exit code 0. Redocly mengeluarkan deprecation notice untuk perpindahan renderer ke Redoc 3 dan prerender mengeluarkan warning `styled-components` tentang prop `depth`/`html`; keduanya tidak menggagalkan artefak build.

Rate limiter saat ini memakai memory store per proses. Deployment dengan beberapa replica perlu shared rate-limit store atau pembatasan pada gateway/edge. Ini keputusan deployment, tidak diverifikasi oleh gate lokal.

## Riwayat pemeriksaan awal (22 Oktober 2026)

Catatan berikut merekam kondisi checkout dan hasil pada pemeriksaan awal. Statusnya historis dan tidak menggambarkan hasil terbaru di atas.

## Kondisi checkout

Checkout ini sekarang menyertakan source Express/TypeScript, manifest dan lockfile npm, migration Sequelize, Compose, Dockerfile, pipeline, dokumentasi, serta kontrak OpenAPI. Source aplikasi belum dijalankan dengan database pada environment ini.

| Gate                                         | Status                    | Bukti atau batasan                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation                      | Selesai dengan temuan     | `npm install` membuat lockfile dan memasang 317 package. `npm audit` menemukan 8 advisori (4 moderate, 4 high), termasuk transitive `braces` melalui Awilix dan `sprintf-js` melalui Umzug. Advisori saat ini belum mencantumkan patched release ([braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)); `npm audit fix --force` meminta downgrade major Awilix/Umzug, jadi tidak diterapkan. |
| Generated localization/barrel/API            | Lulus                     | `npm run generate` berhasil; `i18n:check`, `barrel:check`, dan `api:check` berhasil.                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenAPI lint dan docs build                  | Lulus                     | Redocly memvalidasi YAML, membuat bundle serta HTML; Markdown dan declaration generated cocok dengan YAML.                                                                                                                                                                                                                                                                                                                                                            |
| Source layout                                | Lulus                     | `npm run layout:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TypeScript                                   | Lulus                     | `npm run typecheck` dan kompilasi production di `npm run build`.                                                                                                                                                                                                                                                                                                                                                                                                      |
| ESLint                                       | Lulus                     | `npm run lint`.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Prettier                                     | Lulus                     | `npm run format:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Unit dan HTTP tests                          | Belum tersedia/dijalankan | File test belum dibuat pada penerapan ini; script test di `package.json` memerlukan file tersebut.                                                                                                                                                                                                                                                                                                                                                                    |
| PostgreSQL integration dan migration runtime | Belum dijalankan          | Tidak ada service PostgreSQL yang dijalankan untuk verifikasi ini.                                                                                                                                                                                                                                                                                                                                                                                                    |
| HTTP runtime smoke check                     | Belum dijalankan          | Server belum dijalankan untuk request end-to-end.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Docker dan remote CI                         | Belum dijalankan          | Compose/Dockerfile/pipeline tersedia, tetapi image dan pipeline remote belum diverifikasi.                                                                                                                                                                                                                                                                                                                                                                            |

Perintah build yang berhasil:

```sh
npm run build
```

Pada tanggal tersebut, `npm run check` dan `npm run ci` belum dapat dianggap lulus karena test files belum tersedia dan database integration tidak dijalankan. Jangan mengartikan konfigurasi gate sebagai bukti eksekusinya.

## Audit struktur source

Struktur modul fitur dikelompokkan menurut subfolder tanggung jawab. Input pagination daftar user dinamai `UserListPagination` dan didefinisikan sekali di `types/user-pagination.type.ts`; controller, service, serta repository memakainya bersama. Schema body user dibuat sekali pada saat modul dimuat; middleware validasi tetap menerjemahkan pesan error sesuai locale request. Contoh kode terkait pada blueprint diselaraskan dengan source.

Setelah perubahan ini, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run layout:check`, dan `npm run build` berhasil. Blok contoh source yang berubah pada blueprint juga dibandingkan dengan file source. Test unit/HTTP/integration dan pemeriksaan runtime dengan PostgreSQL tetap belum dijalankan; hasil static check tidak membuktikan perilaku tersebut.

## Gate setelah test dan database tersedia

```sh
npm run test:coverage
npm run db:test:up
npm run db:wait:test
npm run test:integration
npm run ci
```

Untuk perubahan migration/transaksi, gunakan database test khusus. Jangan jalankan migration test, reset data, atau test destruktif pada database produksi. Catat versi runtime, environment database, output aktual, dan gate yang belum berjalan.

## Pemeriksaan arsitektur dan dokumentasi

Tanggal: 27 Oktober 2026.

Setelah penambahan `remember_me` dan endpoint akun sendiri, pemeriksaan berikut berhasil:

```sh
npm run layout:check
npm run api:check
npm run i18n:check
npm run typecheck
npm run lint
npm run format:check
```

Dokumentasi ADR, baseline API, panduan development, README, dan blueprint diselaraskan dengan TTL env, alur akun sendiri, dan scope autentikasi. Catatan historis: pada saat pemeriksaan ini nama migration `202610270001-add-remember-me-to-auth-sessions.ts` masih digunakan. Migration tersebut kemudian digantikan baseline per tabel pada 27 Oktober; jangan menerapkan nama lama pada database baru.

## Verifikasi modul roles

Tanggal: 27 Oktober 2026.

Setelah menambahkan modul Role, hierarchy assignment, `role_id` pada User, dan pembaruan dokumentasi, gate statis berikut berhasil:

```sh
npm run layout:check
npm run api:check
npm run i18n:check
npm run barrel:check
npm run typecheck
npm run lint
npm run format:check
```

Pemeriksaan mencakup dependency antar modul, kontrak OpenAPI dan generated output, locale, TypeScript, lint, serta format. Catatan historis: saat pemeriksaan ini nama migration `202610270002-add-user-roles.ts` masih digunakan; migration itu kemudian digantikan baseline per tabel. Provisioning owner pertama dijelaskan pada [panduan development](development.md#akun-demo-dan-provisioning-owner-production).

## Verifikasi pola seeder

Tanggal: 27 Oktober 2026.

Setelah penambahan runner seeder, CLI source/production, default-role seeder, dan dokumentasi, pemeriksaan berhasil:

```sh
npm run typecheck
npm run layout:check
npm run api:check
npm run i18n:check
npm run barrel:check
npm run lint
npm run format:check
npm run build
```

Build sebelumnya menghasilkan `dist/bin/seed.js`, `dist/seeders/202610270001-default-roles.seeder.js`, dan `dist/src/shared/database/seeder-runner.js`. Redocly mengeluarkan warning `allOf` pada schema envelope OpenAPI yang sudah ada, tetapi build berakhir dengan exit code 0. Test dan koneksi database tidak dijalankan; migration maupun seeder tidak diterapkan pada database.

## Verifikasi squash migration dan refresh

Tanggal: 27 Oktober 2026.

Baseline fresh-install terdiri dari satu migration final untuk masing-masing tabel `roles`, `users`, `auth_credentials`, dan `auth_sessions`. Seeder mengisi katalog role untuk semua environment serta akun demo dan credential hanya pada development/test. Session tidak di-seed karena session valid diterbitkan oleh alur login.

Gate berikut lulus setelah squash migration dan penambahan seeder:

```sh
npm run layout:check
npm run api:check
npm run i18n:check
npm run barrel:check
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Pada pemeriksaan baseline sebelumnya, build menghasilkan empat file migration di `dist/migrations` dan tiga seeder di `dist/seeders`. Redocly tetap mengeluarkan diagnostic `allOf` pada schema envelope dan peringatan render/deprecation, tetapi build berakhir dengan exit code 0.

Konsolidasi katalog role dan UUIDv7 (27 Oktober 2026): migration data `202610270009` dan `202610270010` dihapus; nilai final katalog serta ID UUIDv7 tersedia langsung lewat dua seeder yang tersisa. `npm run layout:check`, `npm run api:check`, `npm run barrel:check`, `npm run typecheck`, `npm run lint`, dan `npm run format:check` lulus setelah perubahan. Test, build, dan refresh database tidak dijalankan pada pemeriksaan ini.

## Verifikasi script package dan database

Tanggal: 27 Oktober 2026.

Semua command database dijalankan berurutan pada database PostgreSQL test yang terisolasi, lalu container dihentikan dengan `npm run db:down`. `db:refresh` juga diuji dengan `NODE_ENV=test` dan konfigurasi database test; database development pada port 5432 tidak disentuh.

```sh
npm run env:setup
npm run db:test:up
npm run db:wait:test
npm run db:refresh:test
npm run db:pending
npm run db:migrate
npm run db:seed
npm run db:undo
npm run db:migrate
npm run db:migrate:production
npm run db:seed:production
# NODE_ENV dan DATABASE_* diarahkan ke konfigurasi .env.test untuk command ini.
npm run db:refresh
npm run db:wait:test
npm run db:pending
npm run db:down
```

Seluruh command tersebut berhasil. Refresh membuat empat tabel dan ketiga seeder. `db:pending` kosong setelah migrate; undo menghapus migration terakhir dan migrate membuatnya kembali. CLI compiled production juga berhasil dijalankan terhadap database test. `dev` dan `start` merespons `GET /api/v1/health` dengan HTTP 200 dan status database `ok`.

Default port test sebelumnya `55433`, yang masuk rentang port TCP excluded di Windows pada mesin pemeriksaan (`55410–55509`), sehingga Docker tidak dapat bind. Port test sekarang mengikuti `DATABASE_PORT` dari `.env.test`, default `5433`; script `db:test:up` membaca file env test tersebut.

Catatan pada pemeriksaan itu: script `test`, `test:coverage`, `test:integration`, `check`, dan `ci` berakhir dengan exit code 0, tetapi runner menemukan nol test dan coverage menampilkan 100% tanpa file yang diuji. Pemeriksaan terbaru di atas menambahkan suite test dan guard untuk mencegah kondisi tersebut. `lint:fix`, `format`, `prepare`, dan `lint:staged` juga berhasil pada pemeriksaan terdahulu. Script `db:up` tidak dijalankan karena port development 5432 sudah dipetakan container Docker lain.

`db:refresh` dan `db:refresh:test` menghapus semua object pada schema `public` database target. Database dengan history migration lama hanya boleh di-refresh jika datanya memang boleh dihapus; database persisten memerlukan migration forward yang direview.
