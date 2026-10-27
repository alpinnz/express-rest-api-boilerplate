# ADR 0021: Pisahkan field nomor telepon User

- **Status:** Accepted
- **Tanggal:** 2026-10-26
- **Aspek blueprint:** Tidak terkait langsung

## Konteks

Profil User menyimpan nomor telepon dalam satu field. Client registrasi perlu mengirimkan nomor lokal dan kode panggilan negara sebagai nilai terpisah.

## Keputusan

- Gunakan `phone_number` dan `country_code` pada request, response, entity, model, serta tabel `users`.
- Kedua field bersifat opsional dan nullable. Pada update, field yang tidak dikirim atau bernilai `null` dikosongkan.
- Baseline schema membuat `phone_number` dan `country_code` secara langsung.
- Upgrade database berisi data lama harus mempertahankan nilai `phone` tanpa menebak kode negara; pekerjaan itu memerlukan migration forward tersendiri.
- Pertahankan operasi User v1 dan perilaku selain kontrak field telepon dari ADR 0019.

## Batas keputusan

OpenAPI menentukan bentuk wire. Entity memvalidasi batas panjang, sedangkan migration memiliki schema persistence. Aturan autentikasi dan password tetap ditentukan ADR terkait.

## Alasan

Memisahkan kode panggilan dari nomor lokal membuat client mengirim komponen yang eksplisit. Format lama tidak menjamin adanya kode negara atau format E.164 sehingga migrasi tidak dapat memisahkannya secara andal.

## Alternatif yang dipertimbangkan

- Menebak kode negara dengan parsing prefix: ditolak karena format data lama tidak menetapkan format atau negara.
- Mempertahankan field `phone`: ditolak karena tidak menyediakan komponen terpisah yang dibutuhkan client.

## Konsekuensi

Perubahan request dan response bersifat breaking untuk client yang memakai field `phone`; client harus pindah ke `phone_number` dan `country_code`. Path tetap `/api/v1`. Schema baseline hanya mencakup format baru; data lama memerlukan migration upgrade terpisah.

## Kriteria penerapan

- Schema request dan response OpenAPI hanya menggunakan `phone_number` dan `country_code`.
- Controller, command, entity, mapper, model, repository, dan migration baseline memetakan kedua field.
- Migration upgrade data lama tidak menghapus nilai atau menebak kode negara.

## Tinjau ulang ketika

Produk menetapkan validasi format telepon atau perlu mengubah kompatibilitas API v1.

## Referensi

- [ADR perilaku API User v1 sebelumnya](0019-user-api-v1-behavior.md)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Baseline migration users](../../migrations/202610270004-create-users.ts)
- [ADR squash migration dan refresh](0026-squashed-table-migrations-and-refresh.md)
