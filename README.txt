========================================
   NAILONG JOKI - Website Package
========================================

Cara pakai:
1. Extract semua file ke folder hosting / localhost
2. Ganti logo.png, nailong.png, qris.png
3. Buka index.html

Halaman:
- index.html       → Beranda
- joki.html        → Daftar paket joki (dinamis via joki-produk.js)
- detail.html      → Detail paket
- pesan.html       → Form pemesanan
- pembayaran.html  → QRIS + konfirmasi bayar
- antrian.html     → Pantau antrian
- tentang.html     → Tentang
- laporan.html     → Kirim laporan
- admin.html       → Panel Admin (rahasia)

Alur order:
joki.html → detail.html → pesan.html → pembayaran.html

Tambah paket baru:
Edit file joki-produk.js (array paketJoki)
atau di console browser: tambahPaket({label:"7 HARI", judul:"Joki 7 Hari", harga:30000})

Peringatan marquee: "TIDAK DILAYANI" (bukan permanent ban)
Video FS sudah dihapus dari menu.

Telegram sudah terkonfigurasi (token + chat id).
========================================
