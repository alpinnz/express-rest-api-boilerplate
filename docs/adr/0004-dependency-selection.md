# ADR 0004: Kelola dependency melalui manifest dan lockfile

- **Status:** Accepted
- **Tanggal:** 2026-10-22
- **Aspek blueprint:** 4

## Konteks

Express, Sequelize/PostgreSQL, Valfuse, Awilix, Argon2, dan tooling build sudah dipilih. Menambah atau mengganti package memengaruhi kompatibilitas runtime, ukuran install, dan pekerjaan pemeliharaan.

## Keputusan

- Jadikan [package.json](../../package.json) sumber dependency yang diminta dan [package-lock.json](../../package-lock.json) sumber resolusi instalasinya. Gunakan `npm ci` untuk instalasi yang mengikuti lockfile.
- Pakai package yang sudah tersedia sebelum menambah library dengan fungsi tumpang tindih. Tambah dependency hanya untuk kebutuhan konkret yang tidak tertangani secara wajar oleh stack saat ini atau platform Node.
- Tinjau kompatibilitas versi, kondisi pemeliharaan, risiko keamanan, lisensi, dan biaya migrasi ketika dependency berubah. Perubahan manifest harus disertai lockfile dan penyesuaian source/gate terkait.

## Batas keputusan

ADR ini mengatur cara memilih dan memperbarui package, bukan menjamin dependency bebas advisori atau menentukan versi terbaru yang harus dipakai. Package yang berbeda boleh hidup berdampingan bila tanggung jawabnya berbeda. Kebutuhan API/library spesifik tetap dibuktikan dari versi yang terpasang sebelum implementasi.

## Alasan

Manifest menyatakan niat dependency, sedangkan lockfile mengunci graph yang dipasang. Keputusan ini menjaga satu implementasi utama untuk setiap kebutuhan dan menghindari dua library yang harus dirawat untuk masalah sama. Blueprint menjelaskan rancangan; file package di checkout menentukan keadaan aktual.

## Alternatif yang dipertimbangkan

- Upgrade seluruh dependency sekaligus mempercepat penyamaan versi, tetapi menyulitkan atribusi regresi dan review perubahan API yang tidak saling terkait.
- Menambah library kedua untuk fungsi yang sama mempercepat satu integrasi, tetapi menambah dua API, konfigurasi, dan jalur update dalam proyek kecil ini.

## Konsekuensi

Upgrade atau penggantian dependency menjadi perubahan yang dapat ditinjau tersendiri dan diikuti pembaruan lockfile. Advisori atau ketidakcocokan versi dicatat sebagai temuan aktual; statusnya tidak disimpulkan hanya dari daftar package di blueprint.

## Kriteria penerapan

- Perubahan package mengubah `package.json` dan `package-lock.json` bersama, dengan alasan kebutuhan dan tanggung jawab yang tidak tumpang tindih.
- Instalasi CI/runtime menggunakan lockfile; perubahan major dependency menilai source dan gate yang bergantung pada API package tersebut.

## Tinjau ulang ketika

Sebuah package tidak lagi kompatibel, tidak terpelihara, memiliki risiko yang perlu ditangani, atau kebutuhan baru tidak dapat dipenuhi stack yang ada dengan biaya wajar.

## Referensi

- [Arsitektur aspek 4](../architecture.md#4-dependency-final-dan-setup)
- [Manifest dependency](../../package.json)
- [Resolusi dependency](../../package-lock.json)
