# ADR 0029: Hilangkan field response yang tidak memiliki nilai

- **Status:** Accepted
- **Tanggal:** 2026-10-27
- **Aspek blueprint:** 9
- **Supersedes:** Bentuk field `errors` pada response di [ADR 0009](0009-application-error-mapping.md)

## Konteks

Envelope API sebelumnya mengirim `errors: null` pada semua response sukses dan pada kegagalan tanpa detail field. Nilai null tidak membawa informasi tambahan dan memaksa client menangani dua representasi untuk kondisi yang sama.

## Keputusan

- Response sukses tidak menyertakan properti `errors`.
- Response gagal menyertakan `errors: ErrorDetail[]` hanya bila ada detail field. Jika detail tidak ada atau array kosong, properti `errors` dihilangkan.
- `errors` tidak pernah bernilai `null`. Field `data` tetap dihilangkan pada operasi sukses tanpa payload dan pada seluruh response gagal.
- `ApiSuccessResponse`, `ApiFailureResponse`, helper HTTP, OpenAPI, contoh Postman, dan dokumentasi mengikuti bentuk yang sama.

## Batas keputusan

Keputusan ini hanya mengubah serialisasi properti opsional envelope. Status HTTP, `message`, `code`, detail error non-null, dan `meta.request_id` tidak berubah.

## Alasan

Menghilangkan field tanpa nilai menghindari redundansi dan membuat keberadaan `errors` menunjukkan bahwa client memang memiliki detail field untuk ditampilkan atau diproses.

## Alternatif yang dipertimbangkan

- Selalu mengirim `errors: null`: ditolak karena client tidak memperoleh informasi dari nilai null dan perlu membedakan null dari array.
- Mengirim `errors: []` saat tidak ada detail: ditolak karena hasilnya tetap field tanpa isi dan berbeda dari aturan omission properti opsional.

## Konsekuensi

- Client yang mengharuskan `errors` hadir pada setiap response harus memperlakukan field ini sebagai opsional. Perubahan bentuk ini berlaku untuk semua endpoint v1.
- Field error validasi/conflict tetap berisi array detail dengan bentuk yang sama.
- Tipe generated dan schema OpenAPI perlu diperbarui dari source of truth.

## Kriteria penerapan

- `sendSuccess` tidak mengirim `errors`.
- `sendFailure` mengirim array `errors` hanya saat array detail tidak kosong.
- OpenAPI tidak menandai `errors` sebagai nullable atau required pada envelope umum; schema validasi field mewajibkannya.
- Dokumen dan contoh tidak menampilkan properti `errors: null`.

## Tinjau ulang ketika

API memerlukan representasi eksplisit untuk kondisi “detail error diketahui kosong” yang berbeda dari “detail tidak disediakan”.

## Referensi

- [ADR pemetaan kegagalan HTTP](0009-application-error-mapping.md)
- [Baseline API](../api/api-baseline.md)
- [OpenAPI](../api/openapi.yaml)
- [Response helper](../../src/shared/http/response.ts)
