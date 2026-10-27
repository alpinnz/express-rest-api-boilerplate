# ADR 0013: Jalankan migration terpisah dari web

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 13

## Konteks

Model Sequelize menjelaskan akses runtime, tetapi tidak dapat menjadi sumber sejarah perubahan schema. Beberapa web replica dapat hidup bersamaan; migration perlu dijalankan sekali secara terkendali sebelum versi aplikasi yang membutuhkannya menerima trafik.

## Keputusan

- Simpan file migration TypeScript bernama timestamp urut dan tindakan di `migrations/`. Umzug memakai nama stabil tanpa ekstensi agar source `.ts` dan build `.js` menunjuk riwayat migration yang sama.
- Jalankan `up` melalui CLI terpisah dari startup web. CLI mengambil PostgreSQL advisory lock agar dua runner tidak memigrasikan schema bersamaan; tabel `schema_migrations` mencatat riwayat.
- Jangan memakai `sequelize.sync({ alter: true })` pada runtime. Migration yang sudah diterapkan tidak diedit; produksi memakai migration forward fix. Perintah `down` pada CLI ditolak di `NODE_ENV=production`.

## Batas keputusan

ADR ini mengatur sejarah schema dan cara CLI menjalankan migration. Urutan job pada platform produksi, strategi backup, serta rollout kompatibel antar versi aplikasi harus ditentukan pada rencana deployment; keberadaan CLI tidak membuktikan hal itu sudah dijalankan.

## Alasan

Migration eksplisit memungkinkan review constraint dan urutan perubahan, sementara model tetap fokus pada query aplikasi. Lock melindungi eksekusi antar runner; ia tidak menggantikan perencanaan compatibility ketika versi aplikasi lama dan baru berjalan bersamaan.

## Alternatif yang dipertimbangkan

- `sequelize.sync({ alter: true })` saat startup. Ditolak karena tiap replica dapat mengubah schema dan perubahan tidak memiliki urutan/review/history aman.
- SQL manual. Dapat dipilih bila tim mengutamakan SQL eksplisit, tetapi runner, typing, history, dan dokumentasi harus didesain ulang konsisten.

## Konsekuensi

Perubahan kolom atau constraint yang merusak kompatibilitas memerlukan tahapan deploy dan rollback yang ditinjau. Jika proses berhenti di antara commit DDL dan pencatatan riwayat migration, kondisi database diperiksa sebelum menjalankan ulang; sejarah tidak diasumsikan pulih otomatis. Status production migration hanya diketahui setelah job deployment benar-benar dijalankan.

## Kriteria penerapan

- Perubahan schema ditulis sebagai migration baru dengan nama stabil untuk source dan build; web startup tidak menjalankan `sync` atau migration otomatis.
- CLI migration dijalankan terpisah dengan advisory lock; rollout yang tidak kompatibel direncanakan sebelum web versi baru menerima trafik.

## Tinjau ulang ketika

Perubahan schema memerlukan DDL yang tidak dapat dijalankan dalam transaksi biasa, pemindahan data besar, atau beberapa versi aplikasi harus memakai schema berbeda selama rollout.

## Referensi

- [Arsitektur aspek 13](../architecture.md#13-migration-terpisah-bukan-sync-model)
- [CLI migration](../../bin/migrate.ts)
- [Migrator](../../src/shared/database/migrator.ts)
- [Squash baseline dan refresh development/test](0026-squashed-table-migrations-and-refresh.md)
