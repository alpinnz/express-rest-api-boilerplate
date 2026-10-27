# ADR 0032: Batasi pengelolaan User berdasarkan role

- **Status:** Accepted
- **Tanggal:** 2026-10-27
- **Aspek blueprint:** Tidak terkait langsung
- **Supersedes:** Kebijakan akses User CRUD berbasis ID pada [ADR 0019](0019-user-api-v1-behavior.md)

## Konteks

Kontrak v1 sebelumnya membiarkan daftar, detail, perubahan, dan penghapusan User berbasis ID tanpa autentikasi. Ini membuka data profil dan operasi lifecycle akun kepada pemanggil publik. Endpoint `/users/me` telah menyediakan flow terautentikasi untuk pengelolaan profil dan akun sendiri.

## Keputusan

- Daftar dan detail User memerlukan access token aktif dan role level minimal 80 (`admin`).
- Update dan deaktivasi User berbasis ID hanya untuk role level 100 (`owner`). Operasi berbasis ID menolak target diri sendiri agar perubahan profil dan penutupan akun sendiri memakai endpoint `/users/me`.
- Deaktivasi oleh owner menandai User dan credential aktif sebagai soft-deleted, mengosongkan hash password, dan mencabut seluruh sesi dalam transaksi yang sama.
- Registrasi tetap publik. Assignment role User tetap memakai aturan hierarchy pada [ADR 0024](0024-role-level-assignment.md).
- OpenAPI dan Postman collection mencantumkan autentikasi, kebutuhan level, dan respons 401/403 untuk operasi terkait.

## Batas keputusan

Ini menetapkan authorization untuk operasi User yang saat ini ada, bukan permission matrix umum, tenant authorization, atau model multi-role. `/users/me` tetap tunduk pada flow akun sendiri di [ADR 0023](0023-authenticated-user-account-endpoints.md).

## Alasan

Operasi administratif tidak boleh anonim. Ambang role sesuai katalog system yang telah ditetapkan; memisahkan akses baca admin dari perubahan sensitif owner mempertahankan hierarchy yang jelas. Melarang operasi self berbasis ID mempertahankan verifikasi password untuk deaktivasi sendiri dan mencegah flow credential yang berbeda.

## Alternatif yang dipertimbangkan

- Mengharuskan owner untuk semua operasi daftar/detail: tidak dipilih karena admin yang berada di bawah owner perlu membaca daftar untuk operasi administratif rutin.
- Mengizinkan pemilik akun memakai `PUT/DELETE /users/{user_id}`: tidak dipilih karena endpoint `/me` memiliki aturan dan verifikasi akun sendiri.

## Konsekuensi

- Perilaku API v1 berubah: client anonim atau role di bawah ambang sekarang menerima 401/403; client yang mengubah akun sendiri dengan ID harus berpindah ke `/users/me`.
- Deployment yang mengandalkan akses publik perlu memperbarui client dan izin pengguna. API version path tidak berubah, sehingga perubahan ini harus disampaikan sebagai breaking behavior dalam release notes.
- Penghapusan admin sekarang konsisten dengan deaktivasi diri: credential tidak bisa dipakai login dan semua sesi dicabut.

## Kriteria penerapan

- Router melindungi `GET /users` dan `GET /users/{user_id}` dengan level minimum admin, serta `PUT/DELETE /users/{user_id}` dengan owner.
- UserController menolak target diri sendiri dan mendelegasikan deaktivasi administratif kepada AuthService.
- OpenAPI, collection Postman, API baseline, README, dan panduan development menerangkan aturan yang sama.
- Unit/HTTP/integration tests membuktikan 401, role boundary, self-target rejection, serta revocation pada deaktivasi.

## Tinjau ulang ketika

Project memperkenalkan permission-based authorization, tenant boundary, role lain untuk pengelolaan User, atau versi API baru.

## Referensi

- [OpenAPI](../api/openapi.yaml)
- [User router](../../src/modules/users/routes/user.routes.ts)
- [Role-level middleware](../../src/modules/roles/middleware/require-minimum-role-level.middleware.ts)
- [AuthService](../../src/modules/auth/service/auth.service.ts)
