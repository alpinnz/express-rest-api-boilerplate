# ADR 0017: Uji perilaku pada batas yang tepat

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 17

## Konteks

Typecheck dan build dapat lulus walau validasi HTTP, rollback registrasi, atau constraint PostgreSQL salah. Gate kualitas harus membedakan bukti statis dari bukti perilaku dan menyatakan secara jujur apa yang belum dijalankan.

## Keputusan

- Gunakan unit test untuk aturan service/domain yang dapat dijalankan terisolasi; HTTP test untuk status, envelope, validasi, locale, serta field yang keluar; dan PostgreSQL integration untuk transaksi, constraint, soft delete, serta migration.
- Targetkan minimal 90% line dan function coverage pada service, disertai assertion perilaku yang bermakna. Coverage bukan bukti seluruh cabang dan invariant benar.
- `npm run check` mencakup layout, drift generator, typecheck, lint, format, dan coverage unit/HTTP. `npm run ci` menambah wait database test, integration, lalu build. Script aktual dimiliki [package.json](../../package.json).

## Batas keputusan

ADR ini menentukan jenis bukti yang dibutuhkan dan pembagian gate lokal/CI. Script aktual dimiliki `package.json`; hasil eksekusi dan kekurangan test dicatat di [verifikasi](../verification.md), bukan dianggap selesai hanya karena keputusan telah diterima.

## Alasan

Unit dan HTTP checks memberi feedback cepat pada boundary yang berbeda. Fake transaction dapat memeriksa orkestrasi, tetapi hanya database PostgreSQL nyata yang membuktikan perilaku unique constraint, rollback, dan migration pada dialect yang dipakai.

## Alternatif yang dipertimbangkan

- Hanya unit test dengan fake database. Cepat, tetapi tidak membuktikan atomicity, constraint, atau perilaku dialect PostgreSQL.
- E2E untuk semua kasus. Lebih dekat ke runtime, tetapi lebih lambat dan rapuh; gunakan untuk flow kritis, bukan mengganti seluruh pyramid.

## Konsekuensi

Test database harus terpisah dari data development/production. Kegagalan gate dilaporkan apa adanya; keberadaan pipeline Bitbucket atau script npm tidak berarti ia pernah lulus. Perubahan berisiko tinggi memerlukan skenario regresi pada boundary yang relevan. Status gate saat ini dicatat di [verifikasi](../verification.md).

## Kriteria penerapan

- Aturan domain/service diperiksa pada unit boundary, kontrak publik pada HTTP boundary, dan transaksi serta constraint pada PostgreSQL integration boundary.
- Target coverage dan perintah `check`/`ci` tetap terdefinisi di `package.json`; status lulus hanya dicatat setelah perintah terkait benar-benar dijalankan.

## Tinjau ulang ketika

Jenis risiko baru muncul, biaya atau ketidakstabilan suite meningkat, atau target coverage tidak lagi berkorelasi dengan skenario penting yang harus dibuktikan.

## Referensi

- [Arsitektur aspek 17](../architecture.md#17-testing-dan-quality-gate)
- [Catatan verifikasi](../verification.md)
- [Script kualitas](../../package.json)
