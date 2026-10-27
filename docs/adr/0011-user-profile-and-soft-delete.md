# ADR 0011: Jaga keunikan email saat soft delete User

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 11

## Konteks

User memiliki profil yang dapat dibaca, diperbarui, dan dihapus secara logis. Registrasi paralel dengan email sama dan pembaruan email bersamaan harus mematuhi invariant yang sama meski validasi aplikasi sudah berjalan.

## Keputusan

- `User` menormalisasi nama dan email; email disimpan lowercase setelah trim. Constraint unique PostgreSQL pada seluruh tabel `users` menjadi otoritas keunikan, termasuk row yang soft-deleted.
- Sequelize `paranoid` memberi soft delete: `deleted_at` terisi, dan pembacaan normal tidak menampilkan row tersebut. Kredensial terkait tidak dihapus oleh operasi soft delete ini.
- `UserService` mengelola operasi profil, sedangkan `AuthService` mengelola pembuatan akun lengkap. Pembacaan dan write yang tidak menemukan user aktif menghasilkan `not_found` menurut kontrak.

## Batas keputusan

ADR ini mengatur invariant profil User dan keunikan email saat soft delete. Penyimpanan password dimiliki modul auth; bentuk request/response dan status HTTP ditetapkan OpenAPI serta [ADR 0019](0019-user-api-v1-behavior.md).

## Alasan

Validasi entity memberi umpan balik cepat, tetapi hanya constraint database dapat menolak dua write paralel secara otoritatif. Unique constraint penuh menghindari identitas email berpindah ke user lain setelah soft delete.

## Alternatif yang dipertimbangkan

- Hard delete. Lebih sederhana secara storage, tetapi kehilangan riwayat dan tidak sesuai baseline.
- Membebaskan email setelah soft delete. Memungkinkan pemakaian ulang alamat, tetapi mengubah aturan unik dan alur restore/auth yang belum menjadi kebutuhan baseline.

## Konsekuensi

Pembuatan atau perubahan email yang melanggar constraint menghasilkan conflict. Pemakaian ulang email, restore, atau hard delete membutuhkan keputusan perilaku dan migrasi terpisah. Login di masa depan harus memeriksa bahwa profil pemilik credential masih aktif.

## Kriteria penerapan

- Normalisasi email konsisten pada entity, model, dan migration; unique constraint database mencakup row yang soft-deleted.
- Query normal mengecualikan row soft-deleted, sementara konflik email dari write paralel tetap diterjemahkan sebagai conflict publik.

## Tinjau ulang ketika

Produk membutuhkan restore user, pemakaian ulang email setelah soft delete, penghapusan permanen, atau perubahan makna identitas email. Perubahan itu harus menilai constraint database dan credential yang masih tersimpan.

## Referensi

- [Arsitektur aspek 11](../architecture.md#11-implementasi-fitur-users)
- [Entity User](../../src/modules/users/entity/user.entity.ts)
- [Baseline migration users](../../migrations/202610270004-create-users.ts)
