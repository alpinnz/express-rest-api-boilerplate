# ADR 0005: Gunakan TypeScript strict dan gate kualitas

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 5

## Konteks

Source TypeScript ESM, file generator, dan kontrak OpenAPI dapat menyimpang satu sama lain walau masing-masing file tampak benar. Pengembang memerlukan gate yang membedakan kesalahan tipe, lint, format, dan artefak turunan.

## Keputusan

- Gunakan TypeScript strict untuk source dan build; gunakan ESLint untuk aturan statis serta Prettier untuk format. `*.type.ts` menyimpan named type/interface sesuai [konvensi penamaan](../naming.md).
- Jalankan pemeriksaan drift untuk OpenAPI, localization, dan barrel melalui script masing-masing. Hook Husky/lint-staged memberi umpan balik lokal pada perubahan yang di-stage; CI tetap menjadi gate terpisah.
- Bedakan `npm run check` yang memuat pemeriksaan statis dan coverage dari `npm run build` yang menghasilkan artifact. Komposisi perintah aktual dimiliki [package.json](../../package.json).

## Batas keputusan

ADR ini menetapkan pemeriksaan source dan artefak generated; skenario unit, HTTP, dan integration serta target coverage dimiliki [ADR 0017](0017-testing-and-quality-gates.md). Hook lokal membantu umpan balik, tetapi hasil CI tetap perlu dijalankan pada lingkungan yang relevan.

## Alasan

Typecheck membuktikan kecocokan tipe, lint memeriksa aturan kode, formatter menjaga diff terbaca, dan drift check membuktikan output generator berasal dari inputnya. Tidak satu pun menggantikan test perilaku atau build artifact.

## Alternatif yang dipertimbangkan

- Lint dan typecheck hanya di CI tanpa pre-commit hooks. Feedback lokal berkurang cepat, tetapi friction saat commit lebih kecil; gate CI tetap wajib.

## Konsekuensi

Sebuah gate disebut lulus hanya setelah perintahnya dijalankan pada checkout yang relevan. Hasil gate statis tidak menjadi bukti test perilaku atau build. Status eksekusi dan hambatan saat ini dicatat di [catatan verifikasi](../verification.md), bukan dalam keputusan yang bersifat jangka panjang.

## Kriteria penerapan

- Konfigurasi TypeScript tetap strict; script typecheck, lint, format, serta pemeriksaan drift generated tersedia dan menunjuk input yang benar.
- Hasil pemeriksaan dilaporkan sesuai perintah yang benar-benar dijalankan; hasil hook lokal tidak menggantikan gate CI.

## Tinjau ulang ketika

Gate menjadi tidak relevan, menghasilkan kegagalan palsu yang terukur, atau tidak lagi memeriksa sumber perubahan yang menjadi tanggung jawabnya. Perubahan gate harus menjaga pembuktian yang hilang melalui pemeriksaan pengganti yang jelas.

## Referensi

- [Arsitektur aspek 5](../architecture.md#5-typescript-lint-eslint-format-dan-husky)
- [Script kualitas](../../package.json)
- [Konfigurasi TypeScript](../../tsconfig.json)
