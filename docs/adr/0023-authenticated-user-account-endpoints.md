# ADR 0023: Lindungi endpoint pengelolaan akun sendiri

- **Status:** Accepted (deactivation retention superseded in part by [ADR 0028](0028-soft-delete-resource-lifecycle.md); User ID access scope superseded by [ADR 0032](0032-user-management-authorization.md))
- **Tanggal:** 2026-10-27
- **Aspek blueprint:** 19

## Konteks

API membutuhkan alur agar pengguna yang sudah login dapat membaca dan mengubah profil, mengganti password, serta menonaktifkan akunnya. Profil dimiliki modul `users`; credential, sesi, dan operasi password dimiliki modul `auth`.

## Keputusan

- Lindungi `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `PUT /api/v1/users/me/password`, dan `DELETE /api/v1/users/me` dengan bearer access token aktif.
- Pengguna boleh mengubah nama, `phone_number`, dan `country_code` miliknya. Email tidak dapat diubah melalui endpoint profil sendiri maupun `PUT /api/v1/users/{user_id}`.
- Ganti password memerlukan `current_password`, `new_password`, dan `confirm_new_password`. Password baru mengikuti aturan password kuat yang sama dengan registrasi; setelah berhasil, cabut semua sesi agar pengguna login kembali.
- Deaktivasi akun memerlukan `current_password`, melakukan soft delete profil dan credential, mengosongkan hash password, dan mencabut semua sesi dalam satu transaksi. Row dan email tetap tersimpan sehingga email tetap reserved. Detail retensi credential mengikuti [ADR 0028](0028-soft-delete-resource-lifecycle.md).
- Modul `users` memiliki route, controller profil, dan kontrak account-service yang dipakai controllernya. Modul `auth` tetap memiliki operasi credential/sesi dan mengimplementasikan kontrak account-service tersebut. Middleware auth disuntikkan ke router User dari composition root; modul `users` tidak mengimpor implementasi `auth`.
- Operasi User berdasarkan ID dari kontrak lama ADR 0019 tetap public pada v1 untuk kompatibilitas. Implementasi ini masih mengizinkan pembacaan daftar/detail dan perubahan/penghapusan profil tanpa autentikasi; akses tersebut perlu dibatasi sebelum API memproses data pengguna nyata.
- Assignment role berbasis level ditetapkan terpisah pada [ADR 0024](0024-role-level-assignment.md). Permission umum dan tenant authorization belum termasuk cakupan.

## Batas keputusan

ADR ini menetapkan autentikasi endpoint akun sendiri dan kepemilikan tanggung jawab antar modul. Bentuk request/response tetap ditentukan [OpenAPI](../api/openapi.yaml). Perilaku lima operasi User berdasarkan ID yang tidak diganti ADR ini mengikuti [ADR 0019](0019-user-api-v1-behavior.md).

## Alasan

Endpoint `me` mengambil identitas dari access token sehingga client tidak dapat memilih `user_id` untuk mengubah akunnya. Pemisahan kontrak menjaga credential dan sesi di modul `auth`, sementara modul `users` menangani HTTP profil. Komposisi middleware di tepi aplikasi menghindari import fitur terbalik.

## Alternatif yang dipertimbangkan

- Menaruh pemeriksaan password dan perubahan session langsung pada UserService. Ditolak karena mencampur lifecycle credential dengan aturan profil.
- Mengubah seluruh endpoint User berbasis ID menjadi authenticated pada perubahan ini. Ditunda karena mengubah kontrak v1 yang masih public; risiko endpoint tersebut dicatat sebagai batasan keamanan.

## Konsekuensi

Perubahan password atau deaktivasi membatalkan seluruh sesi, termasuk sesi perangkat lain. Deaktivasi tidak melepas email untuk registrasi baru. Endpoint User berbasis ID tetap menjadi risiko keamanan sampai autentikasi dan authorization diterapkan melalui keputusan kompatibilitas tersendiri.

## Kriteria penerapan

- Keempat endpoint `/users/me` menolak request tanpa bearer token aktif.
- Perubahan profil tidak menerima email sebagai field yang dapat ditulis.
- Ganti password memverifikasi password lama, memvalidasi kecocokan password baru, dan mencabut semua sesi.
- Deaktivasi mengubah profil, credential, dan sesi secara atomik.
- Dependensi antarmodul melewati kontrak yang eksplisit dan komposisi aplikasi.

## Tinjau ulang ketika

API akan dipakai dengan data pengguna nyata, memerlukan role/admin atau tenant authorization, atau kontrak v1 dapat mengubah proteksi endpoint User berbasis ID.

## Referensi

- [ADR perilaku User v1](0019-user-api-v1-behavior.md)
- [ADR registrasi dan credential](0012-auth-registration-and-password.md)
- [ADR token dan sesi](0020-auth-session-tokens.md)
- [ADR hierarchy role](0024-role-level-assignment.md)
- [Baseline API](../api/api-baseline.md)
- [Komposisi aplikasi](../../src/app.ts)
- [User router](../../src/modules/users/routes/user.routes.ts)
