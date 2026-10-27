# ADR 0015: Hasilkan artefak turunan dari sumbernya

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 15

## Konteks

Pesan API tersedia dalam Indonesia dan Inggris. Tipe localization, Markdown OpenAPI, tipe client, dan barrel security dihasilkan dari input berbeda; mengedit hasil generator secara langsung membuat build berikutnya menimpa perubahan.

## Keputusan

- Simpan teks lokal pada source locale, hasilkan runtime TypeScript, dan pilih bahasa melalui `Accept-Language` (`id`/`en`, default `id`). Terjemahkan `message` pada HTTP boundary; `code`, nama field, dan bentuk `data` tetap sama antar bahasa.
- Hasilkan `src/generated/openapi.type.ts` dan `docs/api/openapi.md` dari YAML; hasilkan localization runtime dari source locale; hasilkan `src/modules/auth/security/index.ts` dari allowlist security.
- Sediakan mode check yang gagal saat output generated berbeda dari inputnya. Ubah input atau generator, lalu regenerasi output; jangan menambal output secara manual.

## Batas keputusan

ADR ini mengatur sumber dan hasil generator serta pemilihan bahasa pesan HTTP. Makna kode error, status, dan bentuk response dimiliki OpenAPI serta [ADR 0009](0009-application-error-mapping.md); penerjemahan tidak mengubahnya.

## Alasan

Setiap artefak mempunyai satu input otoritatif. Ini mencegah Markdown API, tipe TypeScript, dan pesan runtime berbeda dari kontrak atau locale yang dipilih. Allowlist barrel menghindari export otomatis dari seluruh isi direktori keamanan.

## Alternatif yang dipertimbangkan

- Runtime locale JSON dan export barrel manual. Lebih sederhana untuk proyek kecil, tetapi mengubah strategi tipe/build dan tidak memberi pemeriksaan drift yang sama.
- Mengedit output generated secara manual terlihat cepat untuk satu perubahan, tetapi akan hilang saat generator dijalankan dan membuat source serta output berbeda.

## Konsekuensi

Perubahan source locale, YAML, atau allowlist memerlukan output generator yang sesuai dan pemeriksaan drift. Menambah generator atau library dokumentasi lain memerlukan kebutuhan nyata karena setiap jalur generation menambah pekerjaan pemeliharaan.

## Kriteria penerapan

- Perubahan pesan dilakukan pada source locale lalu runtime dihasilkan ulang; perubahan YAML dan allowlist barrel mengikuti generator masing-masing.
- Mode check generator mendeteksi drift; `code` dan bentuk payload tetap sama untuk locale `id` dan `en`.

## Tinjau ulang ketika

Ada bahasa baru, target output baru, atau generator yang ada tidak lagi dapat menjaga satu sumber input tanpa penyalinan manual.

## Referensi

- [Arsitektur aspek 15](../architecture.md#15-localization-barrel-dan-generator)
- [Generator localization](../../scripts/generate-localization.ts)
- [Generator OpenAPI](../../scripts/generate-api-docs.ts)
- [Generator barrel](../../scripts/generate-barrel.ts)
