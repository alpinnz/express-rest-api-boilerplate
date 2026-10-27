# ADR 0020: Gunakan token opaque dengan rotasi sesi refresh

- **Status:** Accepted
- **Tanggal:** 2026-10-25

## Konteks

Auth menerbitkan access token dan refresh token untuk login. API memerlukan token yang dapat dicabut dan sesi yang tersimpan pada database; klaim mandiri atau validasi JWT tanpa database tidak menjadi kebutuhan. Lama sesi juga perlu mengikuti pilihan `remember_me` saat login.

## Keputusan

- Terbitkan access token dan refresh token sebagai nilai opaque acak 256-bit. Kirim nilai mentah hanya kepada client dan simpan SHA-256 hash pada `auth_sessions`.
- Access token memakai `AUTH_ACCESS_TOKEN_TTL_SECONDS`, default 900 detik (15 menit), rentang 60–3600 detik.
- Login menerima `remember_me` opsional dengan default `false`. Refresh token memakai `AUTH_REFRESH_TOKEN_TTL_SECONDS` saat `false` (default 86400 detik/1 hari), atau `AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS` saat `true` (default 604800 detik/7 hari). Keduanya memiliki rentang 60 detik sampai 90 hari.
- Simpan pilihan `remember_me` pada sesi dan pertahankan saat refresh. Setiap rotasi menerbitkan access token dan refresh token baru; masa berlaku refresh yang baru dihitung dari waktu rotasi menggunakan nilai environment saat itu.
- Environment menolak refresh TTL yang lebih pendek daripada access TTL dan remember-me TTL yang lebih pendek daripada refresh TTL standar.
- Refresh hanya dapat memakai token aktif satu kali. Dalam transaksi, kunci sesi, lalu rotasi kedua hash dan masa berlaku. Token lama tidak dapat dipakai ulang.
- Logout menerima refresh token, mencabut sesi yang cocok, dan tetap sukses bila sesi sudah tidak aktif.
- Endpoint profil sendiri dan pengelolaan akun memakai bearer access token aktif. Login menyimpan sesi pada database; refresh dan endpoint protected memeriksa sesi tersebut. Token bukan JWT.
- Response login dan refresh diberi `Cache-Control: no-store` serta `Pragma: no-cache`.
- Login memakai `422 validation_error` dengan pesan kredensial generik untuk email/password salah. Register dan login dibatasi 10 request per IP per 15 menit.

## Alasan

Token opaque tidak membawa data pengguna yang dapat dibaca client. Hash token membatasi dampak kebocoran database, sementara pencarian sesi memungkinkan token dicabut. Rotasi refresh mencegah penggunaan ulang token lama. Nilai TTL environment memungkinkan deployment mengubah durasi tanpa mengubah kode.

## Konsekuensi

- Refresh dan pemeriksaan access token memerlukan database. Durasi token yang diterbitkan sudah tersimpan pada sesi; perubahan environment memengaruhi token yang diterbitkan berikutnya, termasuk saat refresh.
- `remember_me: true` memperpanjang masa refresh setiap kali token dipakai dan dirotasi, selama sesi tetap aktif.
- Sesi kedaluwarsa tetap tersimpan sampai ada kebutuhan lifecycle cleanup.
- Rate limit login memakai store proses yang sama dengan konfigurasi Express saat ini; pada deployment multi-instance, batas per-IP tidak dibagi antar-instance.
- Kolom `remember_me` termasuk pada baseline migration [auth_sessions](../../migrations/202610270006-create-auth-sessions.ts). Database baru harus menerapkan baseline sebelum kode yang membacanya menerima trafik.

## Kriteria penerapan

- Token mentah tidak disimpan pada database; sesi hanya menyimpan hash token dan timestamp kedaluwarsa.
- TTL login dan refresh mengikuti environment serta pilihan `remember_me`; refresh mempertahankan pilihan sesi dan menolak token yang lama.
- Endpoint protected menolak access token yang hilang, tidak aktif, kedaluwarsa, dicabut, atau terkait User yang tidak tersedia.
- Logout dapat diulang tanpa mengungkapkan apakah token pernah valid.

## Tinjau ulang ketika

API membutuhkan validasi token tanpa database, deployment memerlukan rate limit terdistribusi, volume sesi membutuhkan cleanup terjadwal, atau produk mengubah kebijakan durasi sesi.

## Referensi

- [Kontrak API](../api/openapi.yaml)
- [Baseline API](../api/api-baseline.md)
- [Migration auth_sessions](../../migrations/202610270006-create-auth-sessions.ts)
- [AuthService](../../src/modules/auth/service/auth.service.ts)
