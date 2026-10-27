# ADR 0018: Pisahkan build, runtime, dan migration

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 18

## Konteks

Image runtime tidak memerlukan compiler dan dependency development. Migration mengubah state bersama sehingga tidak boleh dijalankan serentak oleh setiap replica web saat startup.

## Keputusan

- Bangun image multi-stage: stage build memasang dependency untuk kompilasi, stage runtime memasang production dependencies dan menjalankan proses sebagai user `node` non-root.
- Sertakan `dist/` yang berisi aplikasi, compiled migration, compiled seeder, serta YAML OpenAPI yang disajikan runtime. Jalankan CLI migration lalu CLI seeder sebagai deployment job sebelum versi web baru menerima trafik.
- Gunakan liveness/readiness dan shutdown sesuai [ADR lifecycle](0016-request-lifecycle-and-readiness.md). Konfigurasi produksi diberikan oleh platform; contoh Compose dan pipeline memakai PostgreSQL khusus development/test.

## Batas keputusan

ADR ini mengatur artifact image dan pemisahan proses web dari migration. Platform produksi, manifest deployment, secret store, jadwal rollout, backup, serta rollback operasional belum ditentukan oleh konfigurasi Compose dan pipeline di repository ini.

## Alasan

Pemisahan build/runtime mengurangi dependency yang tersedia saat API berjalan. Migration job terpisah membuat perubahan schema dapat dipantau dan dihentikan tanpa mengikatnya pada jumlah web replica.

## Alternatif yang dipertimbangkan

- Deploy Node process langsung pada platform. Layak jika platform sudah mengunci runtime, user, health checks, dan artifact; tetap pertahankan migration job dan shutdown behavior.
- Migration dijalankan setiap replica ketika startup. Ditolak karena dapat berlomba dan mencampur lifecycle schema dengan lifecycle server.

## Konsekuensi

Dockerfile dan pipeline adalah konfigurasi, bukan bukti bahwa image, CI remote, atau deployment berhasil. Review deployment menentukan patch PostgreSQL, role, backup, secret, compatibility migration, rollback, dan observability produksi sebelum rilis nyata.

## Kriteria penerapan

- Image runtime memuat artifact yang diperlukan dan production dependencies, berjalan sebagai user non-root, serta tidak memerlukan compiler development.
- Rencana deployment menjalankan migration sebagai job terpisah sebelum web baru; health probe dan shutdown dikonfigurasi sesuai perilaku proses.

## Tinjau ulang ketika

Target platform produksi ditetapkan, runtime tanpa container dipilih, atau rollout multi replica memerlukan strategi compatibility dan rollback yang lebih rinci.

## Referensi

- [Arsitektur aspek 18](../architecture.md#18-docker-deployment-dan-perluasan-fitur)
- [Catatan verifikasi](../verification.md)
- [Dockerfile](../../Dockerfile)
- [Compose development](../../compose.yaml)
- [Pipeline](../../bitbucket-pipelines.yml)
- [Pola seeder](0025-idempotent-database-seeders.md)
