# ADR 0019: Pertahankan perilaku API User v1

- **Status:** Partially superseded by [ADR 0021](0021-user-phone-fields.md) for phone fields, [ADR 0023](0023-authenticated-user-account-endpoints.md) for authenticated account endpoints, and [ADR 0032](0032-user-management-authorization.md) for User CRUD authorization
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 19

## Konteks

Client membutuhkan perilaku yang tetap untuk lima operasi User. Menambah autentikasi, mengubah status, atau mengizinkan email digunakan ulang akan mengubah asumsi client meskipun nama endpoint tetap sama.

## Keputusan

- Pertahankan `POST /api/v1/users`, `GET /api/v1/users`, `GET /api/v1/users/{user_id}`, `PUT /api/v1/users/{user_id}`, dan `DELETE /api/v1/users/{user_id}`. Create berhasil dengan 201; operasi sukses lainnya memakai 200 sesuai YAML.
- Baseline awal tidak memasang auth middleware pada endpoint User. Keputusan scope autentikasi tersebut diperbarui oleh ADR 0023. `POST` mendaftarkan profil dan credential; response User tidak memuat password atau hash. Delete memakai soft delete.
- Input boundary yang tidak valid menghasilkan 400, invariant service/entity yang gagal menghasilkan 422, dan unknown field dibuang oleh validator. Pada `PUT`, `phone` yang tidak dikirim atau `null` mengosongkan nilainya. Email dinormalisasi dan tetap unik termasuk milik user soft-deleted.
- Daftar user memakai pagination `page`/`limit` dan metadata pagination; update bersamaan belum memakai version atau ETag, sehingga write valid terakhir dapat mengganti nilai sebelumnya.

## Batas keputusan

ADR ini menetapkan semantik lima operasi User v1 sebelum field telepon dipisah dan sebelum endpoint akun sendiri ditambahkan. Keputusan field telepon digantikan ADR 0021; keputusan autentikasi digantikan ADR 0023. Semantik resource lain tetap berlaku. YAML OpenAPI tetap menjadi sumber path, schema, status, dan contoh wire.

## Alasan

Aturan ini membuat client dapat mengandalkan status, envelope, dan makna operasi yang sama. OpenAPI memegang fakta wire; [baseline API](../api/api-baseline.md) menjelaskan semantik, sementara source menunjukkan implementasi yang harus diverifikasi.

## Alternatif yang dipertimbangkan

- Optimistic locking/ETag untuk konflik update bersamaan. Lebih baik bila kehilangan update harus dicegah, tetapi memerlukan field/version atau header dan perubahan kontrak client.
- Menambah autentikasi ke operasi User berdasarkan ID. Membutuhkan keputusan kompatibilitas terpisah; endpoint tersebut masih public pada kontrak v1 saat ini.

## Konsekuensi

Mengubah autentikasi operasi User berdasarkan ID, status/payload, locking, atau aturan reuse email memerlukan review kompatibilitas serta perubahan OpenAPI/baseline yang sesuai. Bukti HTTP dan integration dicatat terpisah di [verifikasi](../verification.md).

## Kriteria penerapan

- Kelima operasi User, status sukses, request, response, dan error publik cocok dengan OpenAPI serta baseline API.
- Perubahan auth, reuse email, locking, atau makna `phone` dinilai sebagai perubahan kontrak dan dibahas sebelum diterapkan pada v1.

## Tinjau ulang ketika

Produk membutuhkan authorization pada operasi User berdasarkan ID, optimistic locking, reuse email, perubahan status atau field response, atau operasi baru dengan dampak pada asumsi client v1.

## Referensi

- [API baseline](../api/api-baseline.md)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Baseline API](../api/api-baseline.md)
- [User controller](../../src/modules/users/controller/user.controller.ts)
