# Indeks keputusan arsitektur (ADR)

Satu ADR memuat satu keputusan baseline beserta konteks, alasan, alternatif, dan konsekuensinya. ADR 0001-0018 mengikuti aspek arsitektur 1-18 pada [panduan arsitektur](../architecture.md); ADR 0019 mencatat perilaku API v1. Status **Accepted** menyatakan keputusan desain, bukan bukti bahwa implementasi, test, atau deployment telah terverifikasi; lihat [catatan verifikasi](../verification.md).

Gunakan [template ADR](TEMPLATE.md) untuk keputusan berikutnya. Setiap ADR mencatat metadata, batas keputusan, dan kriteria penerapan yang dapat diperiksa pada source atau kontrak. Bagian kriteria bukan laporan hasil pemeriksaan; hasil aktual tetap berada di [catatan verifikasi](../verification.md).

| Aspek | Keputusan                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------- |
| 1     | [Gunakan satu API modular berdasarkan fitur](0001-project-scope-and-architecture.md)           |
| 2     | [Namai tipe menurut isi dan perannya](0002-boundary-naming.md)                                 |
| 3     | [Kelompokkan file fitur berdasarkan tanggung jawab](0003-feature-module-structure.md)          |
| 4     | [Kelola dependency melalui manifest dan lockfile](0004-dependency-selection.md)                |
| 5     | [Gunakan TypeScript strict dan gate kualitas](0005-typescript-quality-tooling.md)              |
| 6     | [Validasi konfigurasi saat startup](0006-environment-database-and-cors.md)                     |
| 7     | [Gunakan Awilix dengan lifetime eksplisit](0007-dependency-injection-lifetimes.md)             |
| 8     | [Pisahkan bentuk data sesuai pemiliknya](0008-transport-domain-and-persistence-types.md)       |
| 9     | [Pusatkan pemetaan kegagalan HTTP](0009-application-error-mapping.md)                          |
| 10    | [Gunakan satu transaksi untuk registrasi](0010-shared-transaction-ownership.md)                |
| 11    | [Jaga keunikan email saat soft delete User](0011-user-profile-and-soft-delete.md)              |
| 12    | [Pisahkan registrasi credential dari profil User](0012-auth-registration-and-password.md)      |
| 13    | [Jalankan migration terpisah dari web](0013-database-migration-lifecycle.md)                   |
| 14    | [Jadikan OpenAPI sumber kontrak HTTP](0014-openapi-contract-ownership.md)                      |
| 15    | [Hasilkan artefak turunan dari sumbernya](0015-localization-and-generated-artifacts.md)        |
| 16    | [Kelola siklus request dan kesiapan server](0016-request-lifecycle-and-readiness.md)           |
| 17    | [Uji perilaku pada batas yang tepat](0017-testing-and-quality-gates.md)                        |
| 18    | [Pisahkan build, runtime, dan migration](0018-container-and-deployment.md)                     |
| 19    | [Pertahankan perilaku API User v1](0019-user-api-v1-behavior.md)                               |
| 20    | [Gunakan token opaque dengan rotasi sesi refresh](0020-auth-session-tokens.md)                 |
| 21    | [Pisahkan field nomor telepon User](0021-user-phone-fields.md)                                 |
| 22    | [Terapkan kebijakan password baru](0022-registration-password-policy.md)                       |
| 23    | [Lindungi endpoint pengelolaan akun sendiri](0023-authenticated-user-account-endpoints.md)     |
| 24    | [Terapkan assignment role berdasarkan level](0024-role-level-assignment.md)                    |
| 25    | [Jalankan seeder idempotent setelah migration](0025-idempotent-database-seeders.md)            |
| 26    | [Squash migration menjadi baseline per table](0026-squashed-table-migrations-and-refresh.md)   |
| 27    | [Sediakan CRUD katalog Role dan join profil](0027-role-catalog-management-and-profile-join.md) |
| 28    | [Pertahankan resource yang dihapus sebagai tombstone](0028-soft-delete-resource-lifecycle.md)  |
| 29    | [Hilangkan field response yang tidak memiliki nilai](0029-omit-null-response-fields.md)        |
| 30    | [Gunakan katalog role owner, admin, staff, dan user](0030-default-role-catalog.md)             |
| 31    | [Gunakan UUIDv7 untuk identifier baru](0031-uuid-v7-identifiers.md)                            |
| 32    | [Batasi pengelolaan User berdasarkan role](0032-user-management-authorization.md)              |

Untuk meninjau ulang pilihan, baca alasan dan alternatif dalam ADR terkait. Jika keputusan berubah, buat ADR baru yang menautkan keputusan sebelumnya dan tandai ADR lama **Superseded**; koreksi redaksional dapat dilakukan pada ADR yang ada. Selaraskan sumber yang terdampak: [OpenAPI](../api/openapi.yaml) untuk kontrak HTTP, [konvensi penamaan](../naming.md) untuk nama internal, [package.json](../../package.json) dan [lockfile](../../package-lock.json) untuk dependency, serta migration untuk schema database. Catat gate yang benar-benar dijalankan di [verifikasi](../verification.md).
