# API Baseline

Dokumen ini menjelaskan kontrak HTTP untuk boilerplate Express REST API. Source API tersedia di checkout ini; keberadaan source tidak membuktikan endpoint telah dijalankan pada environment tertentu. Kontrak mencakup health check infrastruktur, User, Role, dan siklus sesi auth.

`docs/api/openapi.yaml` adalah source of truth untuk bentuk request, response, status, dan dokumentasi yang dihasilkan. Schema mengikuti suffix boundary yang dijelaskan dalam [`docs/naming.md`](../naming.md): `*Request` untuk input wire, `UserResponse` untuk payload resource, `*Response` untuk response body operasi, serta `ApiResponseBase`, `ApiSuccessResponse`, dan `ApiFailureResponse` untuk envelope dasar.

## Status dan cakupan

- Versi API: `v1`.
- Prefix endpoint: `/api/v1`.
- ID baru yang dibuat API, termasuk `meta.request_id`, menggunakan UUIDv7. Boundary menerima semua UUID valid. Seeder fresh-install memakai ID UUIDv7 untuk role system dan akun demo; data lama tidak direkey otomatis.
- Resource dalam baseline target: health, User, Role, credential, dan sesi auth.
- Format request dan response: JSON.
- Bahasa pesan: Indonesia (`id`) atau Inggris (`en`), dipilih melalui `Accept-Language`.
- `GET /api/v1/health` memeriksa konektivitas database dan melaporkan status dependency; database tidak tersedia menghasilkan `503 service_unavailable`.
- Endpoint `GET /api/v1/users` dan `GET /api/v1/users/{user_id}` memerlukan bearer access token aktif dan role level minimal 80 (`admin`). `PUT` dan `DELETE /api/v1/users/{user_id}` memerlukan level 100 (`owner`); owner tidak dapat menargetkan dirinya melalui ID dan harus memakai endpoint `/me`. Seluruh endpoint `/api/v1/users/me`, CRUD `/api/v1/roles`, dan `PATCH /api/v1/users/{user_id}/role` memerlukan bearer access token aktif. Auth register/login/logout/refresh memakai credential atau refresh token sesuai operasinya.
- `GET /api/v1/users/me` mengembalikan profil dan objek `role` (`id`, `name`, `level`) melalui relasi user-role.
- `PATCH /api/v1/users/me` hanya menerima perubahan nama dan nomor telepon; email tidak dapat diubah melalui endpoint profil maupun `PUT /api/v1/users/{user_id}`.
- `DELETE /api/v1/users/me` memerlukan password saat ini, melakukan soft delete User dan credential, mengosongkan hash password, serta mencabut seluruh sesi secara atomik. `DELETE /api/v1/users/{user_id}` menjalankan deaktivasi serupa untuk akun target oleh owner. Row User, credential, dan email tetap tersimpan sebagai tombstone; email tetap terpakai.
- Setiap User memiliki tepat satu `role_id` yang mengacu ke Role. Katalog role system adalah `owner` level 100, `admin` level 80, `staff` level 50, dan `user` level 10. Angka lebih besar memberi privilege lebih tinggi; registrasi baru mendapat `user`.
- `PATCH /api/v1/users/{user_id}/role` mengubah role user lain. Actor harus memiliki level lebih tinggi daripada role target saat ini dan role baru. Assignment ke role yang sama menghasilkan `409 conflict`; perubahan role sendiri atau perubahan lintas level yang tidak diizinkan menghasilkan `403 forbidden`.
- Role system `owner`, `admin`, `staff`, dan `user` berasal dari seeder dan dilindungi dari perubahan/penghapusan melalui API. CRUD katalog mengelola role custom; actor hanya boleh membuat, mengubah, atau soft-delete role dengan level lebih rendah dari levelnya. Soft delete ditolak selama role masih ditetapkan ke user aktif. Role yang dihapus tetap tersimpan dan namanya tetap reserved. Owner pertama perlu diprovisikan secara terkendali.
- Metadata kontrak OpenAPI target: `Express REST API`, versi `0.1.0`.

OpenAPI dan [Postman collection](postman-collection.json) memakai `base_url` dengan nilai default `http://localhost:3000`. Semua URL endpoint menggunakan pola `{{base_url}}/api/v1/...`; ubah `base_url` untuk memakai host lain. `GET /api/v1/health` memeriksa konektivitas database dan mengembalikan status keseluruhan serta status tiap dependency; status tidak sehat memakai HTTP 503.

Post-response script Postman dimiliki tiap endpoint: login dan refresh menyimpan `access_token` serta `refresh_token`; logout, ganti password, dan deaktivasi mengosongkan kedua token. Collection tidak menyimpan `user_id`; request user spesifik memakai path variable lokal. Create role menyimpan `role_id` untuk request role berikutnya.

Setiap request Postman mengirim `Accept-Language: {{accept_language}}`. Variable collection `accept_language` bernilai `id` secara default; ubah menjadi `en` untuk response berbahasa Inggris.

## Daftar endpoint

| Method   | Path                           | Tujuan                                                  | Sukses                 |
| -------- | ------------------------------ | ------------------------------------------------------- | ---------------------- |
| `GET`    | `/api/v1/health`               | Memeriksa kesehatan API dan database                    | `200 OK`, `503`        |
| `GET`    | `/api/v1/roles`                | Melihat katalog role (perlu login)                      | `200 OK`               |
| `POST`   | `/api/v1/roles`                | Membuat role custom sesuai hierarchy                    | `201 Created`          |
| `GET`    | `/api/v1/roles/{role_id}`      | Melihat detail role                                     | `200 OK`               |
| `PATCH`  | `/api/v1/roles/{role_id}`      | Mengubah role custom sesuai hierarchy                   | `200 OK`               |
| `DELETE` | `/api/v1/roles/{role_id}`      | Soft delete role custom yang tidak dipakai user aktif   | `200 OK`               |
| `POST`   | `/api/v1/users`                | Membuat User                                            | `201 Created`          |
| `POST`   | `/api/v1/auth/register`        | Mendaftarkan akun                                       | `201 Created`          |
| `POST`   | `/api/v1/auth/login`           | Membuat sesi dan token                                  | `200 OK`               |
| `POST`   | `/api/v1/auth/logout`          | Mencabut sesi berdasarkan refresh token                 | `200 OK`               |
| `POST`   | `/api/v1/auth/refresh-token`   | Merotasi refresh token dan access token                 | `200 OK`               |
| `GET`    | `/api/v1/users`                | Melihat daftar User (admin ke atas)                     | `200 OK`, `401`, `403` |
| `GET`    | `/api/v1/users/me`             | Melihat profil dan role saat ini                        | `200 OK`               |
| `PATCH`  | `/api/v1/users/me`             | Mengubah nama/telepon profil sendiri                    | `200 OK`               |
| `PUT`    | `/api/v1/users/me/password`    | Mengganti password dengan password lama                 | `200 OK`               |
| `DELETE` | `/api/v1/users/me`             | Menonaktifkan akun sendiri                              | `200 OK`               |
| `PATCH`  | `/api/v1/users/{user_id}/role` | Mengubah role user lain sesuai hierarchy                | `200 OK`               |
| `GET`    | `/api/v1/users/{user_id}`      | Melihat satu User (admin ke atas)                       | `200 OK`, `401`, `403` |
| `PUT`    | `/api/v1/users/{user_id}`      | Mengganti profil User (owner; tidak untuk diri sendiri) | `200 OK`, `401`, `403` |
| `DELETE` | `/api/v1/users/{user_id}`      | Menonaktifkan akun, credential, dan sesi (owner)        | `200 OK`, `401`, `403` |

`user_id` harus berupa UUID.

## Siklus token auth

- Login menerima `email` dan `password`. Payload yang tidak sesuai schema menghasilkan `400 bad_request`; kredensial salah menghasilkan `422 validation_error` dengan pesan generik yang dilokalkan. Login tidak menggunakan `401`.
- Login menerima `remember_me` opsional yang default-nya `false`. Access token opaque memakai `AUTH_ACCESS_TOKEN_TTL_SECONDS` (default 900 detik); refresh token opaque memakai `AUTH_REFRESH_TOKEN_TTL_SECONDS` (default 86400 detik) atau `AUTH_REMEMBER_ME_REFRESH_TOKEN_TTL_SECONDS` (default 604800 detik) saat `remember_me: true`. Nilai token mentah hanya dikirim kepada client; database menyimpan SHA-256 hash.
- Pilihan `remember_me` disimpan pada sesi dan dipertahankan saat refresh token dirotasi. Nilai TTL env yang aktif dipakai saat login dan setiap refresh token diterbitkan ulang.
- `GET /api/v1/users/me` memeriksa hash, masa berlaku, status pencabutan access token, dan keberadaan User sebelum mengirim profil.
- `GET /api/v1/roles` mengembalikan `data.items` berisi `id`, `name`, dan `level`, serta `data.count`; role diurutkan dari level tertinggi.
- `POST`, `GET /{role_id}`, `PATCH /{role_id}`, dan `DELETE /{role_id}` menyediakan CRUD role. System roles bawaan tidak dapat diubah/dihapus; actor hanya dapat mengelola role yang levelnya lebih rendah; soft delete ditolak jika role masih dipakai user aktif. Role yang di-soft-delete tetap tersimpan dan namanya reserved.
- `PATCH /api/v1/users/{user_id}/role` menerima `{ "role_id": "<uuid>" }`. Actor tidak boleh mengubah role sendiri, role target yang levelnya sama/lebih tinggi, atau memberi role dengan level sama/lebih tinggi dari level actor. Role yang sudah dimiliki target tidak dapat di-assign ulang.
- Response login dan refresh mengirim `Cache-Control: no-store` dan `Pragma: no-cache`.
- Refresh menerima `refresh_token`, mengunci sesi aktif, lalu mengganti kedua token secara atomik. Refresh token lama tidak dapat dipakai ulang; token tidak valid, kedaluwarsa, dicabut, atau milik User yang tidak tersedia menghasilkan `422 validation_error` dengan pesan generik yang dilokalkan.
- Logout menerima `refresh_token` dan mencabut sesi yang cocok. Permintaan dengan token yang sudah tidak aktif tetap sukses agar logout idempoten.
- Ganti password menerima `current_password`, `new_password`, dan `confirm_new_password`. Password baru mengikuti aturan register; setelah perubahan berhasil semua sesi dicabut dan client harus login lagi.
- Deaktivasi akun menerima `current_password`. Proses soft delete User dan credential (dengan hash password dikosongkan), serta pencabutan seluruh sesi dilakukan dalam satu transaksi.
- Password disimpan sebagai Argon2id melalui `node:crypto` bawaan Node.js, dengan salt acak 16 byte unik untuk setiap hash dan parameter 64 MiB, 3 iterasi, parallelism 1. Salt tersimpan bersama hash; secret environment/pepper tidak diperlukan. Jika pepper ditambahkan kelak, simpan di secret manager dan siapkan rotasi tanpa mengunci akun lama.
- Batas register dan login adalah 10 percobaan per alamat IP dalam 15 menit, ditambah rate limit API umum.
- Perubahan password dan deaktivasi akun dibatasi 10 percobaan per alamat IP dalam 15 menit, ditambah rate limit API umum.
- Endpoint profil sendiri, ganti password, deaktivasi akun, daftar role, dan perubahan role memakai access token. Daftar/detail User memerlukan role level minimal 80 (`admin`), sedangkan update/delete berbasis ID hanya untuk role `owner` level 100. Pengelolaan akun sendiri tetap memakai endpoint `/me`.

### Status endpoint auth dan profil terlindungi

| Endpoint                             | Status selain sukses                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register`         | `400`, `405`, `406`, `409`, `413`, `415`, `422`, `429`, `500`, `503`               |
| `POST /api/v1/auth/login`            | `400`, `405`, `406`, `413`, `415`, `422`, `429`, `500`, `503`                      |
| `POST /api/v1/auth/logout`           | `400`, `405`, `406`, `413`, `415`, `429`, `500`, `503`                             |
| `POST /api/v1/auth/refresh-token`    | `400`, `405`, `406`, `413`, `415`, `422`, `429`, `500`, `503`                      |
| `GET /api/v1/users/me`               | `401`, `405`, `406`, `429`, `500`, `503`                                           |
| `PATCH /api/v1/users/me`             | `400`, `401`, `405`, `406`, `413`, `415`, `422`, `429`, `500`, `503`               |
| `PUT /api/v1/users/me/password`      | `400`, `401`, `405`, `406`, `413`, `415`, `422`, `429`, `500`, `503`               |
| `DELETE /api/v1/users/me`            | `400`, `401`, `405`, `406`, `413`, `422`, `429`, `500`, `503`                      |
| `GET /api/v1/roles`                  | `401`, `405`, `406`, `429`, `500`, `503`                                           |
| `POST /api/v1/roles`                 | `400`, `401`, `403`, `405`, `406`, `409`, `413`, `415`, `429`, `500`, `503`        |
| `GET /api/v1/roles/{role_id}`        | `400`, `401`, `404`, `405`, `406`, `429`, `500`, `503`                             |
| `PATCH /api/v1/roles/{role_id}`      | `400`, `401`, `403`, `404`, `405`, `406`, `409`, `413`, `415`, `429`, `500`, `503` |
| `DELETE /api/v1/roles/{role_id}`     | `400`, `401`, `403`, `404`, `405`, `406`, `409`, `429`, `500`, `503`               |
| `PATCH /api/v1/users/{user_id}/role` | `400`, `401`, `403`, `404`, `405`, `406`, `409`, `413`, `415`, `429`, `500`, `503` |

Request validation di boundary menghasilkan `400`. `422` digunakan untuk validasi service/entity; pada register dapat terjadi saat membangun entity User, sedangkan login dan refresh menggunakannya untuk kredensial body yang tidak cocok.

## Aturan HTTP bersama

### Header

- Kirim `Accept: application/json` untuk meminta response JSON.
- Kirim `Content-Type: application/json` ketika request memiliki body.
- Kirim `Authorization: Bearer <access_token>` ke semua endpoint `/api/v1/users/me`, seluruh endpoint `/api/v1/roles`, dan `PATCH /api/v1/users/{user_id}/role`.
- `Accept-Language: id` atau `Accept-Language: en` memilih bahasa pesan response. Default saat tidak ada pilihan yang cocok adalah Indonesia.
- Request body dengan media type atau content encoding yang tidak didukung ditolak.
- Response menyertakan `Content-Language` dan bervariasi menurut `Accept-Language`.

### Envelope sukses

Semua response sukses menggunakan bentuk umum berikut:

```json
{
  "message": "Berhasil",
  "code": "success",
  "data": {},
  "meta": {
    "request_id": "01a17aa8-1c00-7009-8109-100000000009"
  }
}
```

`message` dilokalkan. `code` adalah kode stabil untuk logika client. `data` mengikuti operasi dan tidak dikirim bila operasi tidak menghasilkan payload. Field `errors` tidak disertakan pada response sukses. `meta.request_id` adalah UUIDv7 yang dapat dipakai untuk menghubungkan laporan client dengan log server.

### Envelope kegagalan

Kegagalan API yang ditangani server menggunakan bentuk berikut:

```json
{
  "message": "Data tidak ditemukan",
  "code": "not_found",
  "meta": {
    "request_id": "01a17aa8-1c00-7009-8109-100000000009"
  }
}
```

Jika error dapat dikaitkan dengan field, `errors` berisi `ErrorDetail[]` dengan `field`, `location`, `code`, dan `message`. Jika tidak ada field yang bisa ditunjuk, field `errors` tidak disertakan. Lokasi yang digunakan kontrak adalah `body`, `query`, `path`, `header`, atau `system` (`location` bukan bernilai `field`). Pesan dapat berubah mengikuti bahasa; client sebaiknya memakai `code` untuk branching.

`message` envelope memberi ringkasan umum, sedangkan `errors[].message` memberi alasan spesifik. Contoh konflik email: `field` adalah `email`, `location` adalah `body`, dan `code` detail adalah `email_already_used`. Kode envelope tetap `conflict` dan HTTP status tetap `409`.

```json
{
  "message": "Request gagal karena terjadi konflik.",
  "code": "conflict",
  "errors": [
    {
      "field": "email",
      "location": "body",
      "code": "email_already_used",
      "message": "Email sudah digunakan"
    }
  ],
  "meta": { "request_id": "01a17aa8-1c00-7009-8109-100000000009" }
}
```

Coverage lokasi detail field pada endpoint:

| Endpoint                                                      | Field yang dapat muncul di `errors[]`                                                                                                  |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register`, `POST /api/v1/users`            | Body: `name`, `email`, `phone_number`, `country_code`, `password`, `confirm_password`; email duplicate: `email` / `body`               |
| `POST /api/v1/auth/login`                                     | Body: `email`, `password`; kredensial salah memakai detail generik `credentials` / `body` agar tidak membocorkan field mana yang salah |
| `POST /api/v1/auth/refresh-token`, `POST /api/v1/auth/logout` | Body: `refresh_token`                                                                                                                  |
| `GET /api/v1/users`                                           | Query: `page`, `limit`                                                                                                                 |
| `GET /api/v1/users/me`                                        | Header: `Authorization` untuk token yang hilang atau tidak aktif                                                                       |
| `GET`, `PUT`, `DELETE /api/v1/users/{user_id}`                | Path: `user_id`; `PUT` juga memiliki field body profil dan konflik email pada `email` / `body`                                         |
| Negosiasi response/request media type pada seluruh API        | Header: `Accept`, `Content-Type`, atau `Content-Encoding`                                                                              |

Health check tidak memiliki field request. Resource yang tidak ditemukan pada `user_id` valid juga tetap merupakan `not_found`, bukan kesalahan validasi field; keduanya tidak menyertakan field `errors`.

### Respons protokol

- `400 Bad Request`: JSON tidak valid atau request tidak valid menurut kontrak.
- `404 Not Found`: resource User tidak ditemukan atau tidak tersedia pada pembacaan normal.
- `401 Unauthorized`: access token yang dibutuhkan endpoint terlindungi tidak valid atau tidak tersedia. Endpoint auth saat ini tidak menggunakan `401`; login dan refresh menerima kredensial melalui body dan menggunakan `422` jika kredensial tersebut tidak valid.
- `405 Method Not Allowed`: method tidak tersedia pada path tersebut. Response menyertakan header `Allow`.
- `406 Not Acceptable`: client tidak menerima response JSON.
- `409 Conflict`: email yang diminta sudah digunakan.
- `413 Content Too Large`: ukuran body melewati batas server.
- `415 Unsupported Media Type`: media type atau content encoding request tidak didukung.
- `422 Unprocessable Entity`: kegagalan validasi aplikasi yang dinormalisasi sebagai `validation_error`.
- `429 Too Many Requests`: batas request terlampaui. Periksa header `RateLimit` dan `RateLimit-Policy` (draft 8); `Retry-After` tidak dikirim oleh konfigurasi saat ini.
- `500 Internal Server Error`: kegagalan internal yang tidak terduga.
- `503 Service Unavailable`: dependency sementara tidak tersedia atau operasi dibatalkan.

Rate limit baseline menargetkan 300 request per alamat IP dalam satu jendela 60 detik. Ini nilai target implementasi dan bukan jaminan bahwa kebijakan deployment lain sama.

Seluruh kegagalan boundary (400) menggunakan envelope API canonical. Raw Valfuse bukan format response yang didukung target repository. Validasi service/entity menggunakan 422 pada response POST/PUT. Error validasi field pada baseline dikirim sebagai `ErrorDetail[]`.

TypeScript memakai `ApiSuccessResponse<TData, TMeta extends Meta = Meta>` untuk sukses dan `ApiFailureResponse<TErrors extends ApiErrors = ApiErrors, TMeta extends Meta = Meta>` untuk failure. `ApiResponse<TData, TMeta extends Meta = Meta, TErrors extends ApiErrors = ApiErrors>` adalah union reusable keduanya. `TData` hanya mewakili field `data` pada sukses; failure tidak memiliki field `data` dan menggunakan `TErrors` untuk field `errors`. Operasi sukses tanpa payload juga menghilangkan `data`. `TMeta` selalu memuat `request_id`.

`ApiErrors` adalah `ErrorDetail[]`: setiap field error memakai satu detail per field, sedangkan kegagalan tanpa detail tidak menyertakan field `errors`. Properti `errors` pada failure bersifat opsional dan tidak pernah bernilai `null`; success tidak memiliki properti tersebut. `JsonValue` mencakup object dan array rekursif untuk properti metadata. `Meta` selalu memiliki `request_id: string` dan boleh memuat properti tambahan bertipe JSON. `PaginatedMeta` memperluas `Meta` dengan `pagination: Pagination`; karena itu metadata list tetap membawa request ID.

OpenAPI 3.0 tidak memiliki parameter generic atau union yang melintasi status HTTP. `ApiResponseBase` menyimpan field envelope bersama. `ApiSuccessResponse` dan `ApiFailureResponse` membatasi kontrak sukses/gagal; schema sukses per operasi hanya membatasi `code` dan `data`, dengan override metadata untuk list. Status gagal mereferensikan komponen response bersama. `PaginatedMeta` memperluas `Meta` dan hanya menambahkan `pagination`.

## Kontrak resource User

### Field User yang dikembalikan

| Field          | Tipe               | Ketentuan                                              |
| -------------- | ------------------ | ------------------------------------------------------ |
| `id`           | string             | UUID User.                                             |
| `role_id`      | string             | UUID Role tunggal milik User.                          |
| `name`         | string             | Nama User.                                             |
| `email`        | string             | Email User.                                            |
| `phone_number` | string atau `null` | Nomor telepon tanpa kode negara, maksimum 20 karakter. |
| `country_code` | string atau `null` | Kode panggilan negara, maksimum 5 karakter.            |
| `created_at`   | string             | Waktu ISO 8601.                                        |
| `updated_at`   | string             | Waktu ISO 8601.                                        |

Password dan hash password tidak pernah disertakan dalam response User.

Migrasi mempertahankan nilai `phone` lama di `phone_number`. Karena field lama tidak memisahkan kode negara, `country_code` untuk record tersebut tetap `null`.

### Aturan input

| Field              | Wajib                     | Aturan                                                                                                             |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `name`             | Ya pada create dan update | String 1–100 karakter. Tidak boleh kosong.                                                                         |
| `email`            | Ya pada create dan update | String dengan format email, maksimum 254 karakter. Harus unik untuk operasi yang membuat atau mengganti email.     |
| `password`         | Ya pada create            | String 8–72 karakter, minimum satu huruf besar, satu angka, dan satu simbol non-whitespace. Disimpan sebagai hash. |
| `confirm_password` | Ya pada create            | String 8–72 karakter dan harus sama dengan `password`.                                                             |
| `phone_number`     | Tidak                     | String maksimum 20 karakter atau `null`; saat update, bila tidak dikirim, nilainya dikosongkan.                    |
| `country_code`     | Tidak                     | String maksimum 5 karakter atau `null`; saat update, bila tidak dikirim, nilainya dikosongkan.                     |

Field yang tidak dikenal dibuang oleh validasi Valfuse. Client tetap sebaiknya hanya mengirim field yang tercantum di kontrak.

## Endpoint

### Buat User

`POST /api/v1/users`

Request:

```json
{
  "name": "Alfin Noviaji",
  "email": "alpinnz@gmail.com",
  "phone_number": "81234567890",
  "country_code": "+62",
  "password": "!Password123",
  "confirm_password": "!Password123"
}
```

Response `201 Created`:

```json
{
  "message": "Data berhasil dibuat",
  "code": "created",
  "data": {
    "id": "01a17aa8-1c00-700b-810b-10000000000b"
  },
  "meta": {
    "request_id": "01a17aa8-1c00-7009-8109-100000000009"
  }
}
```

Kemungkinan response error yang dicatat kontrak: `400`, `405`, `406`, `409`, `413`, `415`, `422`, `429`, `500`, dan `503`.

### Daftar User

`GET /api/v1/users?page=1&limit=20`

Query:

- `page`: nomor halaman mulai dari `1`, rentang `1`–`10000`, default `1`.
- `limit`: jumlah maksimum User dalam halaman, rentang `1`–`100`, default `20`.
- Kedua parameter harus berupa bilangan bulat yang aman.

Response `200 OK`:

```json
{
  "message": "Berhasil",
  "code": "success",
  "data": {
    "items": [
      {
        "id": "01a17aa8-1c00-700b-810b-10000000000b",
        "name": "Ayu Pratama",
        "email": "ayu@example.com",
        "phone_number": "8123456789",
        "country_code": "+62",
        "created_at": "2026-10-21T08:30:00.000Z",
        "updated_at": "2026-10-21T08:30:00.000Z"
      }
    ],
    "count": 1
  },
  "meta": {
    "request_id": "01a17aa8-1c00-7009-8109-100000000009",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_page": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

`data.count` adalah jumlah item pada halaman. `meta.pagination.total` adalah total record yang memenuhi query. Jika tidak ada record, `total_page` bernilai `0`.

Kemungkinan response error yang dicatat kontrak: `400`, `405`, `406`, `429`, `500`, dan `503`.

### Profil User yang sedang login

`GET /api/v1/users/me`

Endpoint ini mengambil profil berdasarkan access token aktif. Kirim header `Authorization: Bearer <access_token>`; token yang hilang, tidak valid, kedaluwarsa, atau dicabut menghasilkan `401 unauthorized` dengan detail pada field `Authorization` / `header`.

Response sukses memakai schema `GetUserResponse` dan mengembalikan profil pada `data`. Response error tidak menyertakan field `data`.

### Ambil satu User

`GET /api/v1/users/{user_id}`

Response target `200 OK` memakai envelope sukses dengan satu object User pada `data`. Jika UUID tidak valid, request ditolak. Jika User tidak ditemukan atau sudah di-soft-delete, response `404 Not Found`.

Kemungkinan response error yang dicatat kontrak: `400`, `404`, `405`, `406`, `429`, `500`, dan `503`.

### Perbarui profil User

`PUT /api/v1/users/{user_id}`

Body wajib memuat `name` dan `email`. `phone_number` dan `country_code` boleh berupa string atau `null`; bila tidak dicantumkan, masing-masing nilai tersimpan dikosongkan. Password tidak dapat diubah melalui endpoint ini.

```json
{
  "name": "Ayu P. Pratama",
  "email": "ayu@example.com",
  "phone_number": null,
  "country_code": null
}
```

Response `200 OK` memakai envelope sukses dengan object User yang sudah diperbarui pada `data`.

Kemungkinan response error yang dicatat kontrak: `400`, `404`, `405`, `406`, `409`, `413`, `415`, `422`, `429`, `500`, dan `503`.

### Hapus User

`DELETE /api/v1/users/{user_id}`

Operasi ini menandai User sebagai terhapus. Data row tetap tersimpan; User tidak ditampilkan pada pembacaan biasa.

Response `200 OK`:

```json
{
  "message": "Berhasil",
  "code": "deleted",
  "meta": {
    "request_id": "01a17aa8-1c00-7009-8109-100000000009"
  }
}
```

Kemungkinan response error yang dicatat kontrak: `400`, `404`, `405`, `406`, `429`, `500`, dan `503`.

## Endpoint dokumentasi

- `GET /openapi.yaml` menyajikan spesifikasi OpenAPI yang digunakan sebagai source of truth.
- UI dokumentasi dibangun oleh Redocly ke `dist/docs/index.html` untuk hosting terpisah.

Kontrak OpenAPI lengkap juga disalin sebagai dokumen Markdown pada `docs/api/openapi.md`. Source YAML tetap berada pada `docs/api/openapi.yaml`; perubahan API harus memperbarui source tersebut dan implementasi route secara bersamaan. TypeScript declaration dihasilkan oleh script `npm run api:generate`.

## Contoh pemanggilan

```sh
curl --request GET \
  --url http://localhost:3000/api/v1/users?page=1\&limit=20 \
  --header 'Accept: application/json' \
  --header 'Accept-Language: id'
```

## Batas cakupan saat ini

Dokumen ini belum mendefinisikan permission umum per operasi, tenant authorization, reset password, verifikasi email, upload file, filter pencarian, atau operasi batch. CRUD katalog role tersedia dengan pembatasan level pada ADR 0027. Operasi User administratif memerlukan role level sesuai [ADR 0032](../adr/0032-user-management-authorization.md).
