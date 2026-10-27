# ADR 0003: Kelompokkan file fitur berdasarkan tanggung jawab

- **Status:** Accepted
- **Tanggal:** 2026-10-25
- **Aspek blueprint:** 3

## Konteks

Modul fitur tumbuh melampaui beberapa file. Menaruh semua route, controller, service, persistence, mapper, dan tipe langsung dalam satu folder membuat navigasi sulit, sedangkan empat lapisan Clean Architecture per fitur memberi kedalaman dan abstraksi yang belum dibutuhkan.

## Keputusan

- Pertahankan batas fitur di `src/modules/<fitur>/`, lalu kelompokkan implementasi pada subfolder tanggung jawab, misalnya `controller/`, `routes/`, `schema/`, `service/`, `repository/`, `model/`, `mapper/`, `entity/`, `errors/`, `security/`, dan `types/`.
- Buat hanya folder yang memiliki file. Fitur sederhana tidak wajib memiliki seluruh kategori.
- Letakkan kontrak dekat tanggung jawab yang memilikinya: service contract di `service/`, repository contract di `repository/`, dan model types di `model/`. Gunakan `types/` untuk tipe fitur yang tidak khusus dimiliki folder tanggung jawab lain.
- Pertahankan alur `route → controller → service → repository → model`. Adapter keamanan milik fitur (misalnya hashing password Auth) berada di modul fitur terkait. Shared tetap untuk mekanisme lintas fitur, bukan untuk memindahkan file demi simetri.
- Jaga dependency fitur satu arah: Auth boleh memakai kontrak profil Users dan kontrak role default; Roles boleh memakai kontrak assignment role milik Users; Users tidak mengimpor Auth atau Roles. Composition root merakit fitur.
- Jangan menambahkan folder `domain/application/infrastructure/presentation`, port, atau adapter tambahan tanpa kebutuhan isolasi yang nyata.

## Alasan

Struktur ini menjaga file tetap mudah ditemukan berdasarkan pekerjaan, tanpa mengaburkan kepemilikan fitur atau menambah lapisan abstraksi. `src/modules/auth/service/auth.service.ts` dan `src/modules/users/repository/user.repository.ts` menunjukkan bentuknya.

## Konsekuensi

Import relatif perlu mengikuti lokasi baru. Layout check membatasi subfolder fitur ke kategori yang dikenal dan satu tingkat kedalaman agar pengelompokan konsisten, tetapi tidak memaksa fitur membuat folder kosong.

## Kriteria penerapan

- File baru berada di subfolder tanggung jawab dalam modul pemiliknya dan dependency lintas fitur mengikuti arah yang ditetapkan.
- Subfolder hanya dibuat ketika berisi file yang memang memiliki tanggung jawab tersebut.
- Pemindahan file menjaga kontrak dan behavior; perubahan path dirapikan pada source, dokumentasi, dan link ADR.

## Tinjau ulang ketika

Modul memperoleh subfitur yang stabil dan butuh batas navigasi tersendiri, atau kategori yang ada mulai mencampur tanggung jawab yang berbeda.

## Referensi

- [Arsitektur aspek 3](../architecture.md#3-struktur-proyek)
- [Pemeriksaan struktur source](../../scripts/check-source-layout.ts)
