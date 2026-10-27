# ADR 0030: Gunakan katalog role owner, admin, staff, dan user

- **Status:** Accepted
- **Tanggal:** 2026-10-27
- **Supersedes:** katalog role system pada [ADR 0024](0024-role-level-assignment.md) dan [ADR 0027](0027-role-catalog-management-and-profile-join.md)

## Konteks

Katalog role awal perlu memakai nama yang sesuai dengan kebutuhan produk. Setiap User tetap memiliki satu role dan aturan hierarchy berbasis level tetap berlaku.

## Keputusan

- Role system adalah `owner` level 100, `admin` level 80, `staff` level 50, dan `user` level 10. Level lebih besar berarti privilege lebih tinggi.
- Registrasi baru mendapat role `user`. Role system berasal dari seeder dan tidak dapat dibuat ulang, diubah, atau dihapus melalui API role.
- CRUD role tetap berlaku untuk role custom di bawah level actor. Perubahan role User hanya dapat dilakukan untuk target dan role tujuan yang levelnya lebih rendah daripada actor; actor tidak dapat mengubah role sendiri atau memilih role yang sama.
- Owner pertama diprovisikan operator tepercaya melalui proses database terkontrol. Tidak ada bootstrap owner publik.
- Fresh install mendapatkan katalog final langsung dari seeder: `owner`, `admin`, `staff`, dan `user`. Tidak ada migration data untuk mengubah nama role atau assignment lama; database lama yang perlu mempertahankan data memerlukan migration forward yang ditinjau. ID fixture pada seeder menggunakan UUIDv7 sesuai [ADR 0031](0031-uuid-v7-identifiers.md).
- Akun demo development/test tetap menggunakan role `owner`; akun demo tidak dibuat pada production.

## Batas keputusan

ADR ini mengatur katalog role bawaan dan provisioning owner pertama. Permission per endpoint dan tenant authorization tetap di luar cakupan.

## Alasan

Katalog empat tingkat memberi pemisahan jelas antara pemilik sistem, administrator, staf operasional, dan pengguna biasa. Seeder memverifikasi katalog tanpa mengubah assignment yang sudah ada; data lama dengan nama atau ID berbeda membutuhkan migration forward yang menjaga foreign key.

## Konsekuensi

- API, OpenAPI, Postman, dan panduan development menyatakan nama, level, dan default role yang sama.
- Seeder memvalidasi ID, nama, dan level katalog. Jika database lama memiliki katalog yang berbeda, seeder gagal tanpa menimpa assignment atau nilai yang ada.
- Database persisten dengan katalog atau ID fixture lama memerlukan migration forward yang direview; baseline fresh-install tidak mengubah data tersebut.
- Database dengan migration history sebelum baseline per tabel tidak dapat memakai history baru secara langsung. Refresh hanya untuk development/test yang datanya boleh dihapus; database persisten memerlukan migration forward yang ditinjau untuk history tersebut.

## Kriteria penerapan

- Seeder memastikan empat role system dan menolak nilai yang menyimpang.
- User baru mendapatkan `user`; akun demo development/test mendapatkan `owner`.
- Fresh install memiliki empat role system dengan ID UUIDv7 dan assignment registrasi ke `user`.
- API menolak perubahan/hapus role system dan tetap menegakkan aturan level pada role custom serta assignment user.

## Tinjau ulang ketika

Produk mengubah tingkat privilege, menambah permission per endpoint, memerlukan beberapa role per User, atau mendukung provisioning owner otomatis yang terkontrol.

## Referensi

- [ADR assignment role berdasarkan level](0024-role-level-assignment.md)
- [ADR CRUD katalog Role](0027-role-catalog-management-and-profile-join.md)
- [ADR migration baseline](0026-squashed-table-migrations-and-refresh.md)
- [Katalog role system](../../src/modules/roles/entity/system-role-catalog.ts)
- [Seeder katalog role](../../seeders/202610270001-default-roles.seeder.ts)
- [Kontrak API](../api/api-baseline.md)
