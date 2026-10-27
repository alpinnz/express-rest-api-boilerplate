# ADR 0014: Jadikan OpenAPI sumber kontrak HTTP

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 14

## Konteks

Endpoint User dipakai oleh client melalui status, field JSON, kode error, dan bentuk response. Menyalin definisi itu ke controller, Markdown, dan tipe client akan membuat perubahan kecil mudah menyimpang antar tempat.

## Keputusan

- Jadikan `docs/api/openapi.yaml` sumber tunggal path, field, status, kode, dan schema publik. `docs/api/openapi.md` serta tipe generated berasal dari YAML; keduanya tidak diedit manual.
- Pakai `ApiResponseBase` untuk field envelope bersama. `ApiSuccessResponse` dan `ApiFailureResponse` mempersempit bentuk sukses/gagal; komponen response per operasi mempersempit `code` dan `data`. `UserResponse` hanya payload resource dalam `data`.
- Pakai `Meta` untuk `request_id` dan `PaginatedMeta` untuk tambahan pagination. Bagikan aturan profil create/update melalui `UserProfileRequest`; field password tetap khusus create.
- Pada TypeScript, gunakan `ApiSuccessResponse<TData, TMeta>`, `ApiFailureResponse<TErrors, TMeta>`, dan union `ApiResponse<TData, TMeta, TErrors>`. OpenAPI 3.0 memakai komposisi schema karena tidak mendukung generic TypeScript.

## Batas keputusan

ADR ini menetapkan sumber kontrak dan cara memakai schema bersama. Semantik operasi User ditetapkan [ADR 0019](0019-user-api-v1-behavior.md) serta baseline API; implementasi harus mengikuti YAML, bukan menjadikan tipe generated sebagai sumber perubahan kontrak.

## Alasan

Komponen bersama menghindari salinan envelope serta constraint yang dapat berbeda, tetapi response tiap status tetap terlihat oleh generator client. TypeScript memisahkan tipe `data` sukses dari `errors` gagal; satu generic untuk keduanya akan mengaburkan kontrak.

## Alternatif yang dipertimbangkan

- Code-first API dan generate OpenAPI. Mengurangi penulisan kontrak manual, tetapi mengubah sumber kebenaran dan workflow generator yang sekarang ditetapkan blueprint.
- Menyalin schema ke setiap operation atau Markdown. Ditolak karena constraint mudah berbeda dan perubahan memerlukan sinkronisasi manual.

## Konsekuensi

Perubahan wire contract mengharuskan YAML, [baseline perilaku](../api/api-baseline.md), implementasi, dan output generator selaras. Periksa kompatibilitas client dan kebutuhan versi API sebelum mengganti field, status, atau nama schema publik. Perubahan tipe internal saja tidak otomatis mengubah wire contract.

## Kriteria penerapan

- Perubahan field, status, kode, atau schema publik dimulai dari `docs/api/openapi.yaml`; Markdown dan tipe generated dibuat ulang dari YAML.
- Response operasi memakai komponen bersama tanpa menghilangkan `code`, `data`, atau metadata yang spesifik; implementasi HTTP mengikuti kontrak yang sama.

## Tinjau ulang ketika

Workflow code-first dipilih secara sadar, target generator baru tidak dapat membaca komposisi schema saat ini, atau kebutuhan kompatibilitas client menuntut versi kontrak baru.

## Referensi

- [Arsitektur aspek 14](../architecture.md#14-openapi-baseline-dan-gap-kontrak)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Baseline API](../api/api-baseline.md)
- [Tipe response HTTP](../../src/shared/http/http.type.ts)
