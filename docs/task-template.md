# Tugas Development

## Tujuan dan scope

- Tujuan/perilaku yang diminta:
- Trigger/contoh input:
- Perilaku sebelum dan sesudah:
- Bagian yang termasuk scope:
- Batas scope:
- Asumsi atau keputusan yang diperlukan:

## Referensi

- Konvensi penamaan terkait: `docs/naming.md`.
- Operasi OpenAPI/baseline terkait:
- File fitur dan contoh implementasi terkait:
- Dependency tugas lain:

## Acceptance criteria

| Skenario          | Input/kondisi       | Hasil yang dapat diamati              | Bukti test    |
| ----------------- | ------------------- | ------------------------------------- | ------------- |
| Sukses            | Isi sesuai tugas    | Status/code/data atau perubahan state | Test/perintah |
| Input invalid     | Isi sesuai tugas    | Error boundary dan field yang tepat   | Test/perintah |
| Resource/konflik  | Isi sesuai tugas    | Tidak ada perubahan state yang salah  | Test/perintah |
| Failure transaksi | Jika relevan        | Seluruh write terkait rollback        | Real DB test  |
| Locale            | Jika ada pesan baru | id/en dan stable code                 | HTTP test     |

## Dampak dan verifikasi

- Kontrak HTTP berubah? Jelaskan dampak client/versi:
- Migration/backfill diperlukan? Jelaskan data existing dan pemulihan:
- Registrasi DI atau locale/generator berubah?
- Perintah wajib untuk tugas ini:
- Kebutuhan environment/database:

## Laporan hasil

- Status: implemented / verified / verification-blocked.
- Implementasi dan file penting:
- Acceptance criteria yang dibuktikan:
- Test/perintah dan hasil aktual:
- Gate yang belum dijalankan dan alasan:
- Risiko/keputusan yang masih terbuka:
