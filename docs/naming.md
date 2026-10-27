# Konvensi Penamaan

Panduan ini menjadi katalog operasional penamaan proyek; [ADR 0002](adr/0002-boundary-naming.md) menjelaskan alasan dan batas keputusan. `docs/api/openapi.yaml` tetap menjadi sumber kontrak HTTP: nama field, schema, `operationId`, status, dan kode publik ditetapkan di sana. Tipe internal boleh berbeda; konversi dilakukan pada boundary melalui mapper yang sesuai.

## Prinsip umum

- Pilih nama yang menyatakan domain, tindakan, dan tanggung jawabnya.
- Gunakan suffix hanya untuk membedakan peran atau boundary yang nyata; jangan menambahkan suffix hanya untuk membuat nama terlihat seragam.
- Pertahankan pemisahan tipe ketika bentuk atau pemilik datanya berbeda. Jangan membuat alias duplikat jika tipe yang sama dapat dipakai tanpa mencampur boundary.
- `UserListPagination` dimiliki `user-pagination.type.ts` dan dipakai kembali setelah validasi HTTP karena isinya hanya `page` dan `limit` dengan makna sama pada controller, service, dan repository.
- `Request`, `Response`, `Command`, `Model`, dan `ModelRow` dipakai saat membedakan boundary nyata. Nama seperti `Pagination` menjelaskan isi; `Query` hanya dipakai bila tipe memang mewakili kriteria pencarian/baca yang lebih luas. `DTO` adalah istilah untuk pola pemindahan data, bukan suffix tambahan pada nama tipe.
- Gunakan nama domain langsung untuk entity. Tambahkan `Entity` hanya jika diperlukan untuk membedakannya dari tipe lain dengan nama dasar sama.
- Jangan memakai prefix `I` pada interface TypeScript.
- Perubahan nama publik OpenAPI harus diperiksa dampaknya pada client dan generator, sekalipun tidak mengubah bentuk JSON.

## Aturan suffix menurut boundary

Suffix menjelaskan bentuk dan pemilik data, bukan format serialisasi. Satu tipe boleh dipakai lintas file bila bentuk dan maknanya memang sama; buat tipe baru ketika boundary atau maknanya berbeda.

| Boundary/peran                   | Penamaan                                                                                    | Contoh dan batas penggunaan                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP request body                | aksi + resource + `Request`                                                                 | `CreateUserRequest`, `UpdateUserRequest`; merepresentasikan input wire, tidak membawa bentuk database. Bagikan schema field yang identik melalui `UserProfileRequest`. |
| HTTP query/path setelah validasi | nama sesuai isi; path memakai `PathParams` bila perlu membedakan boundary                   | `UserListPagination`, `UserPathParams`; nama tipe tidak wajib mengikuti lokasi HTTP.                                                                                   |
| HTTP resource payload            | resource + `Response`                                                                       | `UserResponse`; hanya bentuk resource di dalam `data`, bukan envelope.                                                                                                 |
| HTTP operation response          | aksi + resource + `Response`                                                                | `GetUserResponse`, `CreateUserResponse`; bentuk seluruh response body untuk operasi tersebut.                                                                          |
| Envelope OpenAPI                 | `ApiResponseBase`, `ApiSuccessResponse`, `ApiFailureResponse`                               | Base menyimpan field envelope umum satu kali; success/failure membatasi field yang berbeda.                                                                            |
| Envelope TypeScript              | `ApiSuccessResponse<TData, TMeta>` / `ApiFailureResponse<TErrors extends ApiErrors, TMeta>` | Sukses tidak memiliki field `errors`; failure menyertakan array `errors` hanya jika ada detail. Payload yang tidak ada juga dihilangkan.                               |
| Union response TypeScript        | `ApiResponse<TData, TMeta, TErrors extends ApiErrors>`                                      | Union reusable success/failure; `code` membedakan kedua cabang.                                                                                                        |
| DTO / transport type             | nama boundary yang sesuai, tanpa tambahan `Dto`                                             | Gunakan `CreateUserRequest` atau `UserResponse`. Istilah DTO boleh menjelaskan peran, bukan mengubahnya menjadi `CreateUserRequestDto`.                                |
| Service write input              | aksi + resource + `Command`                                                                 | `CreateUserCommand`; hanya bila service memiliki input internal yang berbeda dari request.                                                                             |
| Service read input               | nama sesuai isi dan makna                                                                   | `UserListPagination`; dapat dipakai lintas controller/service/repository jika bentuk dan maknanya sama.                                                                |
| Domain entity                    | nama domain                                                                                 | `User` di `user.entity.ts`; tambahkan suffix `Entity` hanya untuk mengatasi ambiguitas nama.                                                                           |
| Entity construction attributes   | domain + `Properties`                                                                       | `UserProperties`; hanya properti yang diperlukan untuk membentuk/memvalidasi entity.                                                                                   |
| ORM row/instance type            | resource + `ModelRow`                                                                       | `UserModelRow`; bentuk record/instance Sequelize, bukan entity atau response.                                                                                          |
| ORM model type                   | resource + `Model`                                                                          | `UserModel`; tipe static model Sequelize, bukan row atau entity.                                                                                                       |
| OpenAPI schema                   | PascalCase + suffix boundary jika schema mewakili boundary                                  | `CreateUserRequest`, `UserResponse`, `GetUserResponse`; schema dasar generik bernama sesuai amplopnya.                                                                 |
| Runtime validation schema        | operasi/isi + `Schema`                                                                      | `registerUserBodySchema`, `userListPaginationSchema`; berbeda dari komponen schema OpenAPI.                                                                            |
| Database table/column            | snake_case, tanpa suffix tipe aplikasi                                                      | `users`, `auth_credentials`, `created_at`; migration menjadi sumber perubahan struktur database.                                                                       |
| Migration file                   | timestamp urut + tindakan kebab-case                                                        | `202610270004-create-users.ts`; satu file baseline membuat satu table final.                                                                                           |
| Seeder file                      | timestamp urut + nama + `.seeder.ts`                                                        | `202610270001-default-roles.seeder.ts`; runner mengurutkan file dan memanggilnya ulang sehingga operasi harus idempotent.                                              |

`Schema` perlu dibaca sesuai konteks: `components/schemas` adalah definisi OpenAPI, variabel `*Schema` adalah validator runtime, dan struktur database dikelola oleh migration. Jangan menamai ORM model, entity, validator, dan kontrak HTTP dengan nama yang sama bila bentuknya berbeda.

## Format nama

| Area                                  | Aturan                                                                             | Contoh                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Direktori                             | lowercase; gunakan plural untuk kumpulan resource dan nama fitur untuk kapabilitas | `modules/users`, `modules/roles`, `modules/auth`, `modules/auth/security`, `shared/errors` |
| File sumber                           | nama kata kebab-case; pisahkan domain dan peran dengan titik                       | `user.controller.ts`, `user-request.type.ts`, `user-http.mapper.ts`                        |
| Type, interface, class, enum          | PascalCase; nama domain atau peran yang tepat                                      | `User`, `UserRepository`, `UserServiceApi`, `UserController`                               |
| Variabel, parameter, properti, fungsi | camelCase; fungsi dimulai dengan kata kerja spesifik                               | `userId`, `passwordHash`, `createUserModel`                                                |
| Boolean                               | nama yang terbaca sebagai kondisi                                                  | `isActive`, `hasNext`, `canRegister`, `shouldRetry`                                        |
| Collection                            | nama domain plural                                                                 | `users`, `items`, `errorDetails`                                                           |
| Generic parameter                     | `T` ditambah peran yang jelas pada kontrak publik                                  | `TData`, `TErrors`, `TMeta`, `TResult`, `TValidated`                                       |
| Konstanta TypeScript                  | camelCase, sama seperti variabel; gunakan nama yang menyatakan maknanya            | `defaultPageLimit`, `maximumPageSize`                                                      |
| Environment variable                  | UPPER_SNAKE_CASE dengan prefix domain bila diperlukan                              | `DATABASE_HOST`, `RATE_LIMIT_MAX`                                                          |
| Header HTTP                           | ikuti nama standar header dengan tanda hubung; header tidak case-sensitive         | `Content-Type`, `Accept-Language`, `X-Request-Id`                                          |
| Test file                             | nama area atau perilaku ditambah `.test.ts`; folder menunjukkan jenis test         | `tests/unit/transaction.test.ts`, `tests/http/api.test.ts`                                 |
| Generated file                        | ikuti nama yang ditetapkan generator                                               | `openapi.type.ts`, `localization.type.ts`                                                  |

Identifier TypeScript internal memakai camelCase, termasuk properti `createdAt` dan `userId`. Field JSON dan kolom database memakai nama yang ditetapkan kontrak atau migration; pada baseline proyek ini field tersebut memakai snake_case (`confirm_password`, `user_id`, `created_at`). Query dan path parameter harus memakai nama persis dari OpenAPI. Nama header mengikuti standar HTTP. Properti tipe request/response boleh mempertahankan ejaan wire; mapper mengubahnya ketika data melewati boundary dan masuk ke entity/service/model.

## HTTP dan OpenAPI

| Peran                                | Bentuk nama                                                        | Contoh                                                           |
| ------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Request body                         | aksi + resource + `Request`                                        | `CreateUserRequest`, `UpdateUserRequest`                         |
| Pagination yang sudah divalidasi     | resource + operasi + `Pagination`                                  | `UserListPagination`                                             |
| Path parameter yang sudah divalidasi | resource + `PathParams`                                            | `UserPathParams`                                                 |
| Bentuk resource pada field `data`    | resource + `Response`                                              | `UserResponse`                                                   |
| Success envelope TypeScript          | `ApiSuccessResponse<TData, TMeta>`                                 | `ApiSuccessResponse<UserResponse>`                               |
| Failure envelope TypeScript          | `ApiFailureResponse<TErrors extends ApiErrors, TMeta>`             | `ApiFailureResponse<ErrorDetail[]>`                              |
| Union response TypeScript            | `ApiResponse<TData, TMeta, TErrors extends ApiErrors>`             | `ApiResponse<UserResponse, Meta, ErrorDetail[]>`                 |
| Detail error                         | nama domain                                                        | `ErrorDetail`, `ApiErrors`                                       |
| OpenAPI schema request/response      | PascalCase dan suffix sesuai peran                                 | `CreateUserRequest`, `GetUserResponse`                           |
| OpenAPI `operationId`                | lowerCamelCase, unik, kata kerja + resource                        | `createUser`, `listUsers`, `getUser`, `updateUser`, `deleteUser` |
| URL path                             | lowercase, nama collection plural; kata majemuk memakai kebab-case | `/api/v1/users`, `/business-units`                               |

`UserResponse` adalah payload resource di dalam `data`, bukan envelope. `ApiResponse<TData, TMeta, TErrors>` menggabungkan `ApiSuccessResponse<TData, TMeta>` dan `ApiFailureResponse<TErrors, TMeta>`. `TData` hanya berlaku pada success; failure tidak memiliki field `data`, sehingga generic data tidak dipakai sebagai generic errors. Sukses tanpa payload juga menghilangkan `data`. `ApiErrors` adalah alias `ErrorDetail[]`; `errors` bersifat opsional pada failure dan tidak dikirim saat tidak ada detail. `code` memakai union literal terpisah agar TypeScript dapat membedakan kedua cabang. Setiap `TMeta` harus memperluas `Meta`, dan `Meta` wajib memuat `request_id`; daftar memakai `PaginatedMeta`.

OpenAPI 3.0 tidak mendukung generic atau tipe union lintas status seperti TypeScript. `ApiResponseBase` mendefinisikan field bersama sekali. `ApiSuccessResponse` dan `ApiFailureResponse` mempersempit field yang berbeda; schema sukses konkret (`CreateUserResponse`, `ListUsersResponse`, `GetUserResponse`, `UpdateUserResponse`, `DeleteUserResponse`) hanya menetapkan bentuk `data` dan `code`. Status error memakai komponen response bersama yang mereferensikan `ApiFailureResponse`. `PaginatedMeta` memperluas `Meta` dan hanya menambah `pagination`. Request create dan update memakai `UserProfileRequest` untuk aturan profil yang sama; hanya password tetap khusus create. Struktur ini menjaga tipe client tetap spesifik tanpa mengulang envelope, metadata, atau constraint input yang sama. Bentuk JSON tetap mengikuti YAML, termasuk snake_case pada field publik.

## Domain, service, dan persistence

| Peran                             | Bentuk nama                               | Contoh                                                                     |
| --------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| Domain entity                     | nama domain; file berakhiran `.entity.ts` | `User` di `user.entity.ts`; bukan `UserEntity` kecuali ada ambiguitas nama |
| Nilai pembentuk entity            | domain + `Properties`                     | `UserProperties`                                                           |
| Input write service               | kata kerja + resource + `Command`         | `CreateUserCommand`, `UpdateUserCommand`, `RegisterUserCommand`            |
| Input read service                | nama berdasarkan isi                      | `UserListPagination`                                                       |
| Service contract                  | resource/kapabilitas + `ServiceApi`       | `UserServiceApi`, `AuthServiceApi`                                         |
| Service implementation            | resource/kapabilitas + `Service`          | `UserService`, `AuthService`                                               |
| Repository contract               | resource + `Repository`                   | `UserRepository`, `AuthCredentialRepository`                               |
| Repository adapter file           | resource + `.repository.ts`               | `user.repository.ts`, `auth-credential.repository.ts`                      |
| Repository adapter class          | teknologi + resource + `Repository`       | `SequelizeUserRepository`, `SequelizeAuthCredentialRepository`             |
| ORM instance/row type             | resource + `ModelRow`                     | `UserModelRow`, `AuthCredentialModelRow`                                   |
| ORM static model type             | resource + `Model`                        | `UserModel`, `AuthCredentialModel`                                         |
| Domain error class                | domain/sebab + `Error`                    | `AuthValidationError`, `UserValidationError`, `ApplicationError`           |
| Password hashing contract/adapter | kapabilitas / teknologi + kapabilitas     | `PasswordHasher`, `Argon2PasswordHasher`                                   |
| Factory                           | `create` + hasil                          | `createApp`, `createUserModel`, `createDependencyContainer`                |

HTTP request bukan command secara otomatis. Controller memetakan input HTTP menjadi command ketika service membutuhkan bentuk atau makna berbeda. Nilai query HTTP yang sudah divalidasi boleh memakai tipe internal yang sama jika bentuk dan maknanya sama; buat tipe terpisah jika kebutuhan internalnya berbeda. Jangan membuat pasangan tipe yang identik hanya karena lokasinya berbeda.

Nama method boleh singkat jika nama contract sudah memberi konteks: `UserRepository.findById` mengembalikan `User | null`, sedangkan `UserService.get` menjamin User atau melempar `not_found`. Fungsi top-level menyebut tindakan dan objek dengan jelas, misalnya `toUserEntity`, `toUserResponse`, dan `translateDatabaseError`.

Row Sequelize bukan entity atau response. `ModelRow` adalah tipe instance ORM; `Model` adalah tipe static model. Suffix `Entity` tidak diperlukan untuk class `User` selama tidak ada tipe `User` lain yang membuat nama ambigu. Transaction manager, logger, dan dependency container dinamai berdasarkan peran konkretnya; hindari nama payung seperti `Manager`, `Helper`, `Utils`, atau `Data` tanpa objek domain yang jelas.

## Schema, error, locale, database, dan log

| Area                  | Aturan                                                   | Contoh                                                                                               |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| File validasi runtime | resource + `.schema.ts`                                  | `user.schema.ts`, `auth.schema.ts`; jangan disamakan dengan schema OpenAPI atau schema database      |
| Variabel schema       | operasi/parameter + boundary + `Schema`                  | `registerUserBodySchema`, `updateUserBodySchema`, `userPathParamsSchema`, `userListPaginationSchema` |
| Route file            | domain/fitur + `.routes.ts`                              | `user.routes.ts` (router untuk collection User)                                                      |
| Controller file       | resource singular + `.controller.ts`                     | `user.controller.ts`                                                                                 |
| Mapper file           | domain + boundary + `.mapper.ts`                         | `user-http.mapper.ts`, `user-persistence.mapper.ts`                                                  |
| Error code publik     | lowercase snake_case, stabil antar locale                | `not_found`, `validation_error`                                                                      |
| Locale key            | namespace lowercase bertitik; key camelCase              | `common.notFound`, `common.validationError`                                                          |
| Log event             | domain.action.outcome lowercase bertitik                 | `http.request.completed`                                                                             |
| Database table        | nama collection plural snake_case                        | `users`, `auth_credentials`                                                                          |
| Database column       | snake_case; properti Sequelize internal camelCase        | `created_at` ↔ `createdAt`                                                                           |
| Constraint database   | nama stabil dan deskriptif sesuai migration yang berlaku | `users_email_key`, `users_name_check`, `users_email_normalized_check`                                |
| Migration file        | timestamp urut + tindakan kebab-case                     | `202610270004-create-users.ts`                                                                       |
| Seeder file           | timestamp urut + nama + `.seeder.ts`                     | `202610270001-default-roles.seeder.ts`                                                               |
| DI token              | camelCase dan sama dengan parameter constructor CLASSIC  | `userRepository`, `database`                                                                         |

Error message boleh diterjemahkan; error code dan field error tidak berubah menurut locale. Log event memakai nama peristiwa yang stabil dan tidak menyertakan secret, password, token, atau payload sensitif.

## Struktur file dan tanggung jawab

- Named type/interface berada dekat pemiliknya pada file `*.type.ts`, misalnya `user-service.type.ts` dan `user-request.type.ts`. Hindari satu `shared/types.ts` untuk seluruh proyek.
- Class runtime tetap berada pada file `.ts`, misalnya `application-error.ts` dan `user.entity.ts`.
- Route, controller, service, repository contract/adapter, model, schema, mapper, entity, error, dan types dikelompokkan di subfolder tanggung jawab dalam modul fitur; buat hanya folder dan file yang benar-benar diperlukan.
- Mapper menyebut arah boundary pada nama file. Fungsi `to<Target>` menyebut hasil konversi, misalnya `toUserEntity` atau `toUserResponse`.
- Test menjelaskan perilaku yang diamati, bukan nama method privat. Unit, HTTP, dan integration test dikelompokkan dalam folder masing-masing.
- Generated types, OpenAPI Markdown, locale output, dan barrel mengikuti generator. Ubah sumber lalu jalankan generator; jangan mengedit output manual.

## Prioritas ketika aturan berbeda

1. Untuk field wire, schema, status, `operationId`, dan kode API, ikuti `docs/api/openapi.yaml`.
2. Untuk makna operasi dan aturan perilaku, ikuti `docs/api/api-baseline.md`.
3. Untuk identifier internal, file, tipe, persistence, log, dan test, ikuti panduan ini.
4. `AGENTS.md` dan `docs/development.md` mengatur workflow, bukan menduplikasi katalog nama.

Jika sumber-sumber tersebut bertentangan, catat konflik, selaraskan sumber yang berwenang, lalu perbarui output generated dan dokumentasi terkait. Jangan menyelesaikan konflik dengan alias kompatibilitas yang tidak dibutuhkan.
