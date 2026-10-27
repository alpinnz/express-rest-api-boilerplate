# ADR 0024: Terapkan assignment role berdasarkan level

- **Status:** Accepted (public User CRUD exclusion superseded in part by [ADR 0032](0032-user-management-authorization.md))
- **Tanggal:** 2026-10-27

## Konteks

User memerlukan tepat satu Role. Role memiliki level numerik untuk membatasi actor yang dapat mengubah role user lain. Perubahan perlu melindungi assignment dari eskalasi privilege dan request bersamaan.

## Keputusan

- Tambahkan modul `roles` dengan `Role` entity, Sequelize model, repository, service, controller, routes, dan kontrak service.
- Simpan satu `role_id` wajib pada setiap User dengan foreign key ke `roles.id`. Migrasi mengisi user lama ke role default sebelum menjadikan field non-null.
- Katalog awal pada keputusan ini adalah `member` level 10, `manager` level 50, dan `admin` level 100. Katalog terkini (`owner`, `admin`, `staff`, `user`) dan default registrasi `user` ditetapkan oleh [ADR 0030](0030-default-role-catalog.md). Angka lebih besar berarti privilege lebih tinggi.
- Lindungi `GET /api/v1/roles` dengan access token. `PATCH /api/v1/users/{user_id}/role` mengganti role user lain dan memerlukan access token aktif.
- Actor hanya boleh mengubah target yang role saat ini berada di bawah level actor, dan role baru harus memiliki level yang lebih rendah daripada actor. Actor tidak boleh mengubah role sendiri.
- Menetapkan role yang sama dengan role target menghasilkan `409 conflict` dengan detail `role_id` / `role_unchanged`. Self-assignment atau pelanggaran hierarchy menghasilkan `403 forbidden` dengan field detail yang sesuai.
- Kunci row actor dan target dalam satu transaksi dengan urutan ID stabil sebelum membaca level dan menulis role baru. Foreign key dan constraint database menjaga integritas assignment.
- User memiliki kontrak `UserRoleAssignmentServiceApi`; modul `roles` memakainya untuk membaca/menulis role id. Auth hanya memakai kontrak `RoleServiceApi` untuk mendapatkan role default. Composition root merakit semua modul; `users` tidak mengimpor `roles` atau `auth`.
- Operator harus menetapkan owner pertama melalui proses database terkontrol setelah memastikan akun target. Tidak ada endpoint bootstrap owner publik.

## Batas keputusan

ADR ini menetapkan katalog awal dan aturan assignment role. Permission per endpoint, tenant authorization, pengelolaan katalog role melalui API, dan autentikasi pada CRUD User berdasarkan ID tetap di luar keputusan ini.

## Alasan

Satu foreign key memberi setiap user tepat satu role dan menjaga konsistensi referensial. Pemeriksaan actor terhadap role target saat ini serta role yang diminta mencegah actor mengubah peer/atasan atau memberikan privilege setara/lebih tinggi. Row lock melindungi aturan tersebut ketika assignment berjalan bersamaan.

## Alternatif yang dipertimbangkan

- Menyimpan daftar role pada array/JSON di User. Ditolak karena kebutuhan menyatakan satu role dan foreign key memberi integritas sederhana.
- Mengizinkan update role tanpa membandingkan level actor. Ditolak karena memungkinkan perubahan privilege lintas hierarchy.
- Menyediakan bootstrap owner publik atau otomatis menjadikan pendaftar pertama owner. Ditolak karena siapa pun dapat merebut privilege awal pada deployment baru.

## Konsekuensi

- Baseline migration [roles](../../migrations/202610270003-create-roles.ts) dan [users](../../migrations/202610270004-create-users.ts) membuat tabel terpisah; default role disediakan oleh [seeder](../../seeders/202610270001-default-roles.seeder.ts). Data legacy memerlukan migration forward tersendiri.
- Deployment wajib menerapkan migration sebelum aplikasi versi ini menerima trafik. Down migration menghapus katalog dan assignment, sehingga seluruh perubahan role hilang saat rollback.
- Provisioning owner pertama memerlukan operator tepercaya. Setelah tersedia, actor level lebih tinggi dapat menurunkan atau mengganti role user di bawahnya sesuai katalog.
- CRUD User berdasarkan ID yang lama masih public dan tetap perlu dibatasi sebelum API menangani data nyata.

## Kriteria penerapan

- Setiap User lama dan baru memiliki satu `role_id` yang merujuk role valid.
- Role list mengembalikan `id`, `name`, dan `level`; level tertinggi tampil lebih dulu.
- Assignment tanpa autentikasi, self-assignment, role sama, target setara/lebih tinggi, dan role baru setara/lebih tinggi ditolak dengan status/code yang didokumentasikan.
- Assignment valid hanya mengubah role target dalam transaksi dan mengembalikan `user_id` serta `role_id`.
- Dependency antar modul mengikuti kontrak yang diperiksa source layout.

## Tinjau ulang ketika

Produk menetapkan permission spesifik, tenant boundary, katalog role dinamis, banyak assignment per user, atau kebijakan bootstrap administrator.

## Referensi

- [ADR struktur modul](0003-feature-module-structure.md)
- [ADR endpoint akun sendiri](0023-authenticated-user-account-endpoints.md)
- [Baseline API](../api/api-baseline.md)
- [OpenAPI](../api/openapi.yaml)
- [Migration roles](../../migrations/202610270003-create-roles.ts)
- [Migration users](../../migrations/202610270004-create-users.ts)
