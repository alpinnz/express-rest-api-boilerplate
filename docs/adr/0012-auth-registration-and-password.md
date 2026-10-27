# ADR 0012: Pisahkan registrasi credential dari profil User

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 12

## Konteks

Endpoint publik `POST /api/v1/users` menerima password bersama data profil, tetapi modul User hanya mengelola profil. Penyimpanan password dan orkestrasi dua write mempunyai pemilik berbeda dari CRUD profil.

## Keputusan

- `AuthService.register` menerima password, membuat hash Argon2id melalui `PasswordHasher`, kemudian membuat profil dan credential dalam satu transaksi. Password mentah dan hash tidak masuk entity atau response User.
- `UserService.create` tetap tersedia untuk membuat profil internal tanpa credential; profil tersebut belum menjadi akun yang dapat login.
- `AuthController` dan `auth.routes.ts` menangani POST `/api/v1/users`; `UserController` dan `user.routes.ts` menangani operasi CRUD profil lainnya. `app.ts` memasang kedua router pada prefix yang sama, dengan router auth lebih dulu.
- Dependensi antarfitur berjalan satu arah: auth boleh memakai kontrak dan schema profil dari users, sedangkan users tidak mengimpor auth. Komposisi router dan dependency dilakukan di tepi aplikasi.
- Credential dimiliki modul auth dan disimpan pada `auth_credentials`. Login memverifikasi password dan menerbitkan sesi token; siklus token dijelaskan pada [ADR 0020](0020-auth-session-tokens.md).

## Batas keputusan

ADR ini menetapkan kepemilikan credential dan registrasi. Perilaku token dan sesi mengikuti [ADR 0020](0020-auth-session-tokens.md). Atomicity pembuatan profil dan credential dijelaskan di [ADR 0010](0010-shared-transaction-ownership.md).

## Alasan

Kepemilikan ini mencegah UserService bergantung pada kebijakan password dan mencegah controller User bergantung pada AuthService sementara AuthService bergantung pada UserService. Pemisahan profile-only dari registration membuat pemanggil memilih operasi sesuai hasil yang diperlukan; transaksi bersama menjaga operasi publik atomik.

## Alternatif yang dipertimbangkan

- `UserService` mengelola credential dan password. Lebih sedikit modul pada awalnya, tetapi mencampur lifecycle profil dan autentikasi.
- Menyimpan password mentah atau token mentah pada database. Ditolak karena kebocoran database tidak boleh langsung memberikan credential yang dapat dipakai.

## Konsekuensi

Hashing password berlangsung sebelum transaksi agar koneksi tidak ditahan oleh pekerjaan CPU. Login dan refresh menolak profil tanpa credential atau user soft-deleted. `POST /users` dan `/auth/register` membuat akun tetapi tidak otomatis membuat session.

## Kriteria penerapan

- Endpoint create publik ditangani AuthController dan memanggil registrasi auth, menyimpan hash melalui credential repository, serta tidak mengirim password atau hash dalam response.
- Operasi profil internal tanpa credential tetap dibedakan dari akun hasil registrasi.

## Tinjau ulang ketika

Reset password, rotasi hash, verifikasi email, atau akun tanpa credential menjadi kebutuhan produk yang nyata.

## Referensi

- [Arsitektur aspek 12](../architecture.md#12-fitur-auth-dan-password)
- [AuthService](../../src/modules/auth/service/auth.service.ts)
