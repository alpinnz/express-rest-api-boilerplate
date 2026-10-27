# ADR 0010: Gunakan satu transaksi untuk registrasi

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 10

## Konteks

`AuthService.register` membuat satu profil User dan satu credential. Jika penulisan credential gagal setelah profil dibuat, tidak boleh tertinggal profil akun parsial dari operasi publik tersebut.

## Keputusan

- `AuthService.register` melakukan hash password sebelum membuka transaksi, lalu memanggil `UserService.create` dan credential repository dengan object `Transaction` yang sama.
- `TransactionManager.run` membuat transaksi managed bila belum ada, atau bergabung ke transaksi aktif yang diteruskan pemanggil. Pemilik transaksi terluar menentukan commit/rollback.
- Repository write memerlukan transaksi aktif. Jika write gagal, transaksi ditandai gagal agar operasi lanjutan tidak diam-diam melanjutkan transaksi yang harus dibatalkan.

## Batas keputusan

ADR ini menjamin atomicity write database dalam satu koneksi dan transaction object. Ia tidak menjanjikan atomicity untuk email, HTTP eksternal, atau side effect di luar PostgreSQL; operasi semacam itu membutuhkan desain recovery tersendiri.

## Alasan

Object transaksi yang tampak dalam signature memudahkan review operasi atomik lintas service tanpa state global/CLS. Hashing CPU dilakukan sebelum transaksi untuk tidak menahan koneksi database selama pekerjaan tersebut.

## Alternatif yang dipertimbangkan

- Transaksi implisit/global melalui CLS. Pemanggilan lebih ringkas, tetapi kepemilikan transaksi tersembunyi dan isolasi test lebih sulit.
- Transaksi terpisah di setiap service. Ditolak untuk registrasi karena profil dan credential harus atomik.

## Konsekuensi

Operasi dalam satu transaksi harus menggunakan object yang sama sampai selesai. Pemanggil yang membuat transaksi menanggung kegagalan seluruh unit kerja; repository tidak melakukan commit sendiri. Klaim atomicity memerlukan bukti integration dengan PostgreSQL, bukan hanya fake transaction.

## Kriteria penerapan

- Registrasi mengirim object transaksi yang sama ke write profil dan credential; kegagalan salah satu write membatalkan unit kerja.
- Operasi mahal di luar database dilakukan sebelum transaksi bila memungkinkan; tidak ada commit tersembunyi di repository.

## Tinjau ulang ketika

Registrasi menambah side effect di luar database, perlu menjangkau lebih dari satu database, atau transaksi panjang mulai menahan koneksi secara bermasalah.

## Referensi

- [Arsitektur aspek 10](../architecture.md#10-transaksi-sequelize-lintas-service)
- [AuthService](../../src/modules/auth/service/auth.service.ts)
- [Transaction manager](../../src/shared/database/transaction-manager.ts)
