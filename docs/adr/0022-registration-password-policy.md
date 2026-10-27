# ADR 0022: Terapkan kebijakan password baru

- **Status:** Accepted
- **Tanggal:** 2026-10-26
- **Aspek blueprint:** 12

## Konteks

Registrasi sebelumnya hanya membatasi password pada panjang 8–72 karakter dan mencocokkan konfirmasi. Password baru perlu syarat komposisi yang sama pada registrasi dan saat pengguna mengganti password.

## Keputusan

- Password baru harus 8–72 karakter dan memiliki setidaknya satu huruf besar, satu angka, dan satu simbol non-whitespace.
- Pada registrasi, `confirm_password` harus sama persis dengan `password`. Pada ganti password, `confirm_new_password` harus sama persis dengan `new_password`.
- Terapkan kebijakan pada `/api/v1/auth/register`, alias `/api/v1/users`, dan `PUT /api/v1/users/me/password`.
- Jangan menerapkan syarat komposisi ke password login atau `current_password`, agar credential lama yang masih valid tetap dapat digunakan untuk login dan konfirmasi identitas.

## Batas keputusan

Schema Valfuse menegakkan validasi runtime. OpenAPI mendokumentasikan aturan dan pattern untuk client. Password tetap di-hash oleh AuthService sesuai ADR 0012.

## Alasan

Aturan harus konsisten pada semua alur yang membuat password baru dan dapat diperiksa client sebelum request dikirim. Login dan password lama hanya memverifikasi credential.

## Alternatif yang dipertimbangkan

- Menerapkan komposisi pada password login dan password saat ini: ditolak karena dapat mengunci akun dengan password lama yang sebelumnya valid.
- Memeriksa kecocokan hanya di client: ditolak karena client tidak menjadi batas validasi yang berwenang.

## Konsekuensi

Password lemah tidak dapat dipakai saat membuat akun atau password baru. Password lama tetap dapat dipakai untuk login dan verifikasi selama masih valid.

## Kriteria penerapan

- Schema register dan ganti password memeriksa panjang, huruf besar, angka, simbol non-whitespace, dan kecocokan konfirmasi.
- OpenAPI dan contoh request mematuhi aturan tersebut.
- Login dan verifikasi password saat ini tidak memakai aturan komposisi password baru.

## Tinjau ulang ketika

Produk mengubah aturan password, menambah alur reset password, atau perlu mengubah kebijakan untuk credential lama.

## Referensi

- [ADR pemisahan registrasi credential dari profil](0012-auth-registration-and-password.md)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Schema autentikasi](../../src/modules/auth/schema/auth.schema.ts)
