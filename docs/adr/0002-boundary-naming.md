# ADR 0002: Namai tipe menurut isi dan perannya

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 2

## Konteks

Satu konsep User mempunyai bentuk berbeda pada HTTP, aturan aplikasi, dan database. Nama `User` saja tidak cukup untuk semua bentuk itu; sebaliknya, menambahkan suffix ke setiap nama menghasilkan tipe dan alias yang tidak membantu. Sebagai contoh, input daftar user hanya berisi `page` dan `limit`: ia datang dari query string, tetapi dipakai lagi oleh service dan repository sebagai pagination. Menamainya `ListUsersQuery` membuat lokasi HTTP seolah menjadi makna tipe di seluruh aplikasi.

Penamaan harus membantu pengembang mengetahui isi, pemilik, dan batas perubahan suatu tipe. File ditempatkan pada subfolder tanggung jawab di dalam modul fitur, tanpa memaksakan lapisan Clean Architecture.

## Keputusan

Gunakan **nama domain dan makna data terlebih dahulu**. Tambahkan suffix hanya ketika ia membedakan peran atau bentuk yang benar-benar berbeda. Tempat deklarasi mengikuti pemiliknya; satu bentuk dengan makna sama tidak perlu diberi alias baru hanya karena dipakai di file lain.

### Kontrak HTTP

| Peran                         | Aturan                                                         | Contoh dan batas                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Body masuk                    | Kata kerja + resource + `Request`                              | `CreateUserRequest`, `UpdateUserRequest`; mengikuti bentuk wire OpenAPI.                                                             |
| Parameter path tervalidasi    | Resource + `PathParams`                                        | `UserPathParams` berisi `user_id` seperti nama parameter publik.                                                                     |
| Isi `data` sukses             | Resource + `Response`                                          | `UserResponse` hanya profil yang dikirim ke client, bukan seluruh envelope.                                                          |
| Body response operasi OpenAPI | Kata kerja + resource + `Response`                             | `CreateUserResponse`, `ListUsersResponse`; dipakai ketika `code`, `data`, atau metadata operasi perlu dipersempit.                   |
| Envelope bersama              | Nama peran yang tepat                                          | `ApiResponseBase`, `ApiSuccessResponse`, `ApiFailureResponse`; TypeScript juga mempunyai union `ApiResponse<TData, TMeta, TErrors>`. |
| Field request yang sama       | Nama konsep bersama + `Request` bila masih milik wire contract | `UserProfileRequest` menjadi bagian bersama create dan update pada OpenAPI.                                                          |

`ApiResponseBase` adalah komponen dasar OpenAPI, bukan bentuk response operasi yang dikirim sendirian. `ApiSuccessResponse<TData, TMeta>` memakai `TData` untuk payload sukses; jika operasi tidak memiliki payload, field `data` dihilangkan. `ApiFailureResponse<TErrors, TMeta>` memakai `TErrors` untuk `errors` dan tidak memiliki field `data`. `ApiResponse` adalah union kedua cabang. Generic tersebut tidak diganti menjadi `ApiResponse<D, M>` tunggal yang mengaburkan bentuk sukses dan gagal. Nama field, schema, kode, status, dan `operationId` publik mengikuti [OpenAPI](../api/openapi.yaml), bukan contoh dalam ADR ini.

### Input dan model internal

| Peran                             | Aturan                                                                           | Contoh dan batas                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data dengan makna lintas boundary | Nama berdasarkan isi                                                             | `UserListPagination` berisi `page` dan `limit`; dipakai setelah validasi HTTP oleh controller, service, dan repository. `query` tetap nama lokasi input pada middleware, bukan suffix tipe. |
| Perintah write service            | Kata kerja + resource + `Command` bila bentuk atau maknanya berbeda dari request | `CreateUserCommand` membawa profil tanpa password; `RegisterUserCommand` membawa password untuk AuthService.                                                                                |
| Entity domain                     | Nama domain tanpa suffix otomatis                                                | `User` memegang invariant profil; `UserEntity` hanya diperlukan jika ada ambiguitas nyata.                                                                                                  |
| Properti pembentuk entity         | Domain + `Properties`                                                            | `UserProperties`, bukan ORM row atau response publik.                                                                                                                                       |
| Kontrak service/repository        | Nama kemampuan yang dimiliki                                                     | `UserServiceApi` untuk pemanggilan lintas modul, `UserRepository` untuk operasi persistence; buat interface hanya bila batas dependency memberi manfaat.                                    |
| File implementasi persistence     | Resource + `.repository.ts`                                                      | `user.repository.ts`, `auth-credential.repository.ts`.                                                                                                                                      |
| Class implementasi persistence    | Teknologi + resource + `Repository`                                              | `SequelizeUserRepository`.                                                                                                                                                                  |
| Tipe ORM                          | Resource + `ModelRow` untuk instance dan resource + `Model` untuk static model   | `UserModelRow` dan `UserModel` berbeda dari entity `User`.                                                                                                                                  |
| Hasil transformasi                | `to` + tujuan                                                                    | `toUserEntity` mengubah ORM row; `toUserResponse` mengubah entity ke wire payload.                                                                                                          |

`Query` bukan suffix wajib untuk operasi baca. Gunakan nama yang lebih tepat seperti `Pagination` ketika isi hanya pagination; gunakan `Query` hanya jika sebuah tipe memang mewakili kriteria baca/pencarian yang berbeda dari satu konsep spesifik. Jangan membuat pasangan tipe HTTP dan service yang identik hanya untuk memberi nama boundary berbeda. Pisahkan tipe ketika bentuk, validasi, kepemilikan, atau maknanya benar-benar berbeda.

### Schema, file, dan format identifier

- `*.schema.ts` adalah validator runtime, misalnya `auth/schema/auth.schema.ts` dengan `registerUserBodySchema` dan `users/schema/user.schema.ts` dengan `userListPaginationSchema`. Komponen `components/schemas` OpenAPI adalah kontrak publik; migration adalah perubahan struktur database. Ketiganya tidak berbagi nama hanya karena disebut schema.
- Named type/interface berada dekat pemiliknya di `*.type.ts`, misalnya `users/types/user-request.type.ts` dan `users/types/user-pagination.type.ts`. Class dan fungsi runtime tetap di folder tanggung jawabnya seperti `users/entity/user.entity.ts`, `users/service/user.service.ts`, dan `users/model/user.model.ts`. Buat file baru hanya untuk tanggung jawab yang ada.
- Type, interface, dan class memakai PascalCase; fungsi dan identifier internal memakai camelCase; file memakai kebab-case dengan penanda peran (`user-http.mapper.ts`, `user.controller.ts`). Jangan memakai prefix `I` atau suffix `Dto` secara otomatis.
- Field JSON publik mengikuti OpenAPI dan kolom database mengikuti migration; pada baseline keduanya memakai snake_case. Properti internal boleh camelCase. Mapper melakukan konversi ketika bentuk melintasi boundary, misalnya `createdAt` menjadi `created_at`.
- Error code publik memakai lowercase snake_case dan stabil antar bahasa; locale key dan log event memakai nama bertitik. Nama migration mengikuti timestamp urut serta tindakan kebab-case. Rincian contoh dan format lainnya ada di [katalog penamaan](../naming.md).

## Batas keputusan

ADR ini menentukan cara memilih nama, bukan daftar field dan kode publik. [Katalog penamaan](../naming.md) memuat ejaan dan contoh operasional; [OpenAPI](../api/openapi.yaml) memiliki nama wire yang dipublikasikan. Tidak ada kewajiban memakai suffix `Query`, `Dto`, `Entity`, atau membuat satu file tipe untuk setiap konsep.

## Alasan

Peran dan isi data menentukan risiko perubahan. Suffix HTTP melindungi kontrak publik dari bentuk internal, sementara suffix ORM mencegah row database diperlakukan sebagai entity atau response. Nama berdasarkan isi untuk `UserListPagination` tetap akurat pada tiga pemanggil tanpa tiga alias yang harus disinkronkan. Aturan ini menjaga navigasi source jelas tanpa menambah abstraksi seremonial.

## Alternatif yang dipertimbangkan

- Memberi suffix `Dto` atau `Entity` pada semua tipe membuat bentuk yang berbeda tampak seragam, tetapi tidak menjelaskan siapa pemilik data dan menambah nama redundan.
- Menamai semua input GET dengan `Query` mengikuti metode HTTP, tetapi menjadi menyesatkan saat objek hanya berisi pagination dan dipakai di luar HTTP.
- Menggunakan satu tipe `User` untuk request, entity, ORM, dan response mengurangi jumlah deklarasi, tetapi mengikat kontrak publik pada persistence serta membuka risiko field sensitif ikut terserialisasi.

## Konsekuensi

- Perubahan nama internal mencakup seluruh pemanggil dan contoh dokumentasi terkait; tidak perlu mengubah wire contract bila field dan schema publik tetap sama.
- Perubahan nama atau bentuk publik diperiksa dampaknya pada client, OpenAPI, generated types, dan versi API. Output generated diperbarui dari sumbernya, bukan diedit manual.
- Penambahan suffix, alias, interface, atau mapper baru harus mempunyai alasan berupa perbedaan bentuk, makna, kepemilikan, atau kebutuhan isolasi yang nyata.

## Kriteria penerapan

- Nama tipe baru menggambarkan isi dan pemiliknya; suffix dipakai hanya ketika bentuk atau perannya berbeda dari tipe yang sudah ada.
- Perubahan nama wire diperbarui pada OpenAPI dan hasil generator; rename internal tidak mengubah field publik tanpa keputusan kontrak.

## Tinjau ulang ketika

Dua bentuk yang semula sama berkembang menjadi kontrak berbeda, atau satu nama tidak lagi menjelaskan isi dan pemiliknya. Perubahan hanya pada lokasi pemanggilan bukan alasan membuat alias baru.

## Referensi

- [Arsitektur aspek 2](../architecture.md#2-standar-naming)
- [Konvensi penamaan lengkap](../naming.md)
- [Kontrak OpenAPI](../api/openapi.yaml)
- [Keputusan komposisi response](0014-openapi-contract-ownership.md)
- [Tipe pagination aktual](../../src/modules/users/types/user-pagination.type.ts)
