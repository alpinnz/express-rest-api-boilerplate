# ADR 0008: Pisahkan bentuk data sesuai pemiliknya

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 8

## Konteks

Request HTTP, input service, entity profil, row Sequelize, dan response publik mempunyai pemilik serta invariant berbeda. Menyamakan semuanya sebagai satu `User` akan membawa aturan persistence ke HTTP atau membuat field yang seharusnya privat dapat terserialisasi.

## Keputusan

- Gunakan tipe request/response dari OpenAPI untuk wire contract. Controller memetakan request menjadi command ketika input service berbeda, misalnya registrasi memiliki password sedangkan perintah membuat profil tidak.
- Pakai `User` sebagai entity profil yang memeriksa invariant; `UserModelRow` dan `UserModel` hanya mewakili Sequelize. Mapper persistence dan HTTP menangani perubahan bentuk pada batas masing-masing.
- Simpan semua file pada modul fitur pemilik. `auth_credentials` cukup memakai model/repository karena baseline belum mempunyai perilaku domain credential yang membutuhkan entity terpisah. Pakai interface service/repository ketika ada batas dependency yang nyata.

## Batas keputusan

ADR ini menentukan pemilik tipe dan tempat pemetaan antar batas. Bentuk JSON publik tetap ditetapkan OpenAPI; aturan penamaan tipe dan file ditetapkan [ADR 0002](0002-boundary-naming.md). Entity dibuat hanya bila ada invariant atau perilaku yang memang perlu dijaga di luar transport dan ORM.

## Alasan

Entity menjaga invariant saat dipanggil di luar HTTP; database menjaga constraint di bawah race. Mapper HTTP mengontrol field yang dikirim ke client. Tipe `UserListPagination` dipakai ulang oleh controller, service, dan repository karena bentuk serta maknanya sama setelah validasi, tanpa alias per lapisan.

## Alternatif yang dipertimbangkan

- Kirim Sequelize model langsung ke controller/client. Lebih sedikit file, tetapi mengikat kontrak publik pada persistence, menyulitkan filtering field sensitif, dan meningkatkan risiko kebocoran password/hash.

## Konsekuensi

Menambah field publik, invariant, atau kolom database dapat memerlukan perubahan pada boundary yang berbeda. Setiap perubahan ditelusuri dari [OpenAPI](../api/openapi.yaml), entity, model, migration, hingga mapper terkait; tidak semua fitur wajib mempunyai seluruh file tersebut. Rincian suffix ada di [ADR penamaan](0002-boundary-naming.md).

## Kriteria penerapan

- Controller memakai bentuk request/response publik dan mapper; service memakai input sesuai maknanya, sedangkan repository menangani ORM row.
- Entity yang dibuat menjaga invariant yang diperlukan; model Sequelize atau credential hash tidak diserialisasi langsung sebagai response User.

## Tinjau ulang ketika

Suatu fitur memiliki aturan domain baru yang tidak aman jika hanya berada di validator HTTP atau constraint database, atau bentuk transport dan persistence berubah sehingga mapper yang ada tidak lagi menjaga batas tersebut.

## Referensi

- [Arsitektur aspek 8](../architecture.md#8-requestresponse-types-entity-model-dan-mapper-dalam-modul-yang-sama)
- [Entity User](../../src/modules/users/entity/user.entity.ts)
- [Tipe pagination User](../../src/modules/users/types/user-pagination.type.ts)
