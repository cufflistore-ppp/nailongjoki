========================================
   NAILONG JOKI - Website Package
   + QRIS Dinamis Otomatis + Biaya Admin + Expired
========================================

Cara pakai:
1. Extract semua file ke folder hosting / localhost
2. Ganti logo.png, nailong.png (opsional)
3. PENTING: Edit file qris-helper.js
   - Ganti nilai STATIC_QRIS dengan string QRIS STATIS merchant kamu
     (cara dapat: scan gambar QRIS kamu pakai tools online QR scanner, copy teksnya)
   - Atur ADMIN_FEE (default Rp 1.000)
   - Atur QRIS_EXPIRE_MINUTES (default 15 menit)
4. Buka index.html

Halaman:
- index.html       → Beranda
- joki.html        → Daftar paket joki (dinamis via joki-produk.js)
- detail.html      → Detail paket
- pesan.html       → Form pemesanan
- pembayaran.html  → QRIS DINAMIS otomatis + timer expired + konfirmasi bayar
- antrian.html     → Pantau antrian
- tentang.html     → Tentang
- laporan.html     → Kirim laporan
- admin.html       → Panel Admin (rahasia)

Alur order:
joki.html → detail.html → pesan.html → pembayaran.html

Fitur QRIS baru:
- Setiap order otomatis generate QRIS DINAMIS (nominal sudah terisi)
- Biaya admin ditambahkan otomatis ke total
- Timer countdown (default 15 menit)
- Setelah waktu habis → QRIS dianggap expired, tombol "Generate QRIS Baru" muncul
- Uang masuk langsung ke rekening/e-wallet QRIS merchant kamu (tanpa payment gateway)

Cara dapat string QRIS Statis:
1. Buka QRIS merchant kamu (dari bank / DANA Bisnis / GoBiz dll)
2. Screenshot / foto QR-nya
3. Buka situs seperti https://webqr.com atau QR Code Raptor
4. Upload gambar → copy teks yang muncul (dimulai 000201...)
5. Paste ke STATIC_QRIS di qris-helper.js

Tambah paket baru:
Edit file joki-produk.js (array paketJoki)
atau di console browser: tambahPaket({label:"7 HARI", judul:"Joki 7 Hari", harga:30000})

Peringatan marquee: "TIDAK DILAYANI" (bukan permanent ban)
Telegram sudah terkonfigurasi (token + chat id).

Catatan penting:
- QRIS hasil convert static→dynamic tidak di-enforce expired oleh bank.
  Sistem ini mengontrol expired di sisi website (timer + tidak auto-confirm setelah timeout).
- Ganti STATIC_QRIS dengan milik kamu sendiri agar uang masuk ke rekening kamu.
========================================
