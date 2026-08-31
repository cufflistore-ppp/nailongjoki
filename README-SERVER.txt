========================================
  VOXYY - Server Antrian Global
========================================

Ini server backend sendiri (mirip cara RoxyJoki).
Website (HTML) → panggil server ini → data order
tersimpan di server → semua HP bisa lihat.

----------------------------------------
CARA DEPLOY GRATIS (Render.com)
----------------------------------------

1. Buat akun di https://render.com (gratis, pakai GitHub)

2. Upload folder "server" ke GitHub repo
   (atau satu repo berisi folder server/)

3. Di Render:
   - New → Web Service
   - Connect repo GitHub
   - Root Directory: server
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Instance: Free

4. Setelah deploy, dapat URL contoh:
   https://voxyy-orders-xxxx.onrender.com

5. Buka file global-orders.js di website
   Tempel:
   const API_BASE = "https://voxyy-orders-xxxx.onrender.com";

6. Upload website ke Vercel
7. Tes order dari 2 HP

CATATAN Render free:
- Server "tidur" jika tidak dipakai ~15 menit
- Request pertama bisa lambat (cold start ~30 detik)
- Untuk joki kecil biasanya cukup

----------------------------------------
CARA JALANKAN LOKAL (tes)
----------------------------------------
cd server
npm install
npm start
→ http://localhost:3000/api/orders

----------------------------------------
ALTERNATIF HOSTING GRATIS
----------------------------------------
- Railway.app
- Fly.io
- Cyclic.sh
- Glitch.com

Semua sama: deploy folder server, dapat URL HTTPS,
tempel ke API_BASE di global-orders.js
========================================
