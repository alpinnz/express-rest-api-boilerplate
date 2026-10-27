# ADR 0007: Gunakan Awilix dengan lifetime eksplisit

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 7

## Konteks

Koneksi database, logger, model, dan repository hidup sepanjang proses; controller/service serta locale dan request ID dipakai selama satu request. Salah memilih lifetime dapat membuat state request bocor atau resource tidak ditutup.

## Keputusan

- Daftarkan dependency secara eksplisit pada `createDependencyContainer`. Token constructor CLASSIC harus sama dengan nama yang didaftarkan; service tidak mengambil dependency langsung dari container.
- Pakai singleton untuk konfigurasi, database, logger, transaction manager, password hasher, model, dan repository yang tidak menyimpan state request. Pakai scoped lifetime untuk service dan controller.
- Buat scope pada awal request, teruskan melalui request context, dan dispose satu kali pada `finish` atau `close`. Dispose root container saat proses berhenti agar database ditutup.

## Batas keputusan

ADR ini mengatur perakitan dependency dan masa hidup object. Service tetap memiliki aturan bisnisnya sendiri; container tidak menjadi tempat mengambil dependency secara tersembunyi. Data request tidak disimpan pada singleton.

## Alasan

Registrasi di satu composition root memperlihatkan graph dependency dan kegagalan konstruksi. Scope membatasi umur komponen request; penggunaan constructor biasa mempertahankan kemampuan menjalankan service tanpa Express atau container dalam pengujian terisolasi.

## Alternatif yang dipertimbangkan

- Wiring manual tanpa container. Mengurangi dependency dan cocok untuk graph kecil, tetapi baseline memiliki service lintas modul serta kebutuhan scope request/test yang eksplisit.
- Decorator/reflection-based DI. Tidak direkomendasikan karena menambah metadata/runtime indirection yang tidak dibutuhkan.

## Konsekuensi

Lifetimes menjadi bagian dari kontrak komposisi: dependency singleton tidak boleh bergantung pada state scoped. Penambahan service memerlukan registrasi dan keputusan lifetime yang eksplisit. Detail wiring saat ini dimiliki [container](../../src/container.ts), sementara disposal request dimiliki [middleware context](../../src/shared/http/request-context.middleware.ts).

## Kriteria penerapan

- Registrasi container menyatakan lifetime tiap dependency; singleton tidak menyimpan request ID, locale, atau state request.
- Request membuat scope sendiri yang ditutup sekali saat `finish` atau `close`; root container ditutup saat shutdown.

## Tinjau ulang ketika

Graph dependency menjadi cukup kecil untuk dirakit manual tanpa kehilangan kejelasan lifetime, atau muncul resource baru yang membutuhkan lifetime berbeda dari singleton dan request scope.

## Referensi

- [Arsitektur aspek 7](../architecture.md#7-awilix-pada-pola-controllerservicerepository)
- [Composition root](../../src/container.ts)
- [Request context](../../src/shared/http/request-context.middleware.ts)
