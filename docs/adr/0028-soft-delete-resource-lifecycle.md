# ADR 0028: Pertahankan resource yang dihapus sebagai tombstone

- **Status:** Accepted (User ID deletion flow clarified by [ADR 0032](0032-user-management-authorization.md))
- **Tanggal:** 2026-10-27
- **Aspek blueprint:** 19
- **Supersedes:** Kebijakan penghapusan role pada [ADR 0027](0027-role-catalog-management-and-profile-join.md) dan penghapusan credential saat deaktivasi pada [ADR 0023](0023-authenticated-user-account-endpoints.md)

## Konteks

User sudah memakai `deleted_at`, tetapi Role dan credential belum menyimpan status penghapusan. Penghapusan role dan credential secara fisik membuat lifecycle data tidak konsisten. Credential juga menyimpan hash password yang tidak diperlukan lagi setelah akun dinonaktifkan.

## Keputusan

- Semua endpoint DELETE mempertahankan row resource. User dan Role memakai `deleted_at`; pembacaan normal mengecualikan row tersebut.
- `DELETE /api/v1/roles/{role_id}` melakukan soft delete hanya untuk role custom di bawah level actor dan tanpa assignment ke user aktif. System role tetap terlindungi. Row dan nama role yang dihapus tetap reserved oleh unique constraint.
- Deaktivasi akun sendiri menandai User dan credential terhapus, mengosongkan `password_hash`, dan mencabut semua sesi dalam transaksi yang sama. Constraint database memastikan credential aktif memiliki hash dan credential terhapus tidak menyimpan hash.
- Sesi tetap disimpan sebagai riwayat dan memakai `revoked_at`; pencabutan sesi tidak menghapus row.
- Tidak ada endpoint restore atau hard delete pada baseline API.
- Untuk fresh install, kolom tombstone dan constraint credential menjadi bagian dari migration baseline `create-*` per tabel. Database persisten yang memakai history sebelumnya memerlukan migration forward yang direview; baseline tidak boleh dipaksakan ke history tersebut.

## Batas keputusan

Keputusan ini mengatur persistence ketika API menghapus resource. Kebijakan role hierarchy tetap mengikuti [ADR 0024](0024-role-level-assignment.md); bentuk HTTP tetap ditetapkan [OpenAPI](../api/openapi.yaml). Deaktivasi melalui `/users/me` atau operasi owner pada `/users/{user_id}` menonaktifkan profil dan credential serta mencabut sesi.

## Alasan

Tombstone mempertahankan referensi dan riwayat tanpa membuat resource tersedia untuk pembacaan atau autentikasi normal. Mengosongkan hash credential mengurangi data rahasia yang tersimpan setelah akun ditutup. `revoked_at` sudah menjadi state pencabutan sesi, sehingga tidak perlu menambah state soft-delete kedua.

## Alternatif yang dipertimbangkan

- Hard delete Role dan credential: ditolak karena membuat kebijakan resource berbeda dan menghilangkan jejak referensi.
- Menyimpan hash password setelah deaktivasi: ditolak karena autentikasi tidak lagi memerlukan hash tersebut.
- Membebaskan nama Role setelah penghapusan: ditolak untuk mempertahankan unique constraint global dan mencegah ambiguitas identitas saat restore yang belum didukung.

## Konsekuensi

- Nama role custom yang di-soft-delete tidak dapat dipakai ulang. Role yang dirujuk user terhapus dapat di-soft-delete karena tidak ada flow restore User.
- Pada fresh install, migration `create-roles` dan `create-auth-credentials` membuat kolom serta constraint lifecycle sejak awal. Database persisten dari history lama perlu migration forward yang direview sebelum aplikasi baru dijalankan. Versi aplikasi lama yang masih melakukan physical delete tidak boleh tetap menerima write selama rollout.
- Rollback aplikasi tidak menghapus tombstone. Meng-undo baseline akan menghapus tabel beserta datanya, sehingga hanya boleh dilakukan pada database yang aman untuk di-reset.

## Kriteria penerapan

- Model Role menyaring `deleted_at` pada query normal dan repository menggunakan soft delete.
- Credential repository hanya membaca credential aktif; deaktivasi mengosongkan hash serta menulis `deleted_at`.
- User tetap memakai Sequelize paranoid. Session repository menyimpan `revoked_at` tanpa menghapus row.
- OpenAPI, Postman, localization, baseline API, dan panduan migration menyatakan perilaku retensi yang sama.

## Tinjau ulang ketika

Produk memerlukan restore, pemakaian ulang nama role/email, retensi data berbatas waktu, penghapusan permanen untuk privasi, atau hard-delete job yang terkontrol.

## Referensi

- [ADR keunikan email dan soft delete User](0011-user-profile-and-soft-delete.md)
- [ADR endpoint akun sendiri](0023-authenticated-user-account-endpoints.md)
- [ADR CRUD Role](0027-role-catalog-management-and-profile-join.md)
- [Baseline API](../api/api-baseline.md)
- [Migration Role baseline](../../migrations/202610270003-create-roles.ts)
- [Migration credential baseline](../../migrations/202610270005-create-auth-credentials.ts)
