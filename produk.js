// Daftar Produk Digital - berbeda dari paket Joki
const produk = [
  {
    id: 1,
    judul: "Tutorial Buat Logo JB Instan",
    harga: 10000,
    status: "AKTIF",
    img: "logo.png",
    deskripsi: "Tutorial lengkap membuat logo JB dalam hitungan menit. File digital langsung dikirim setelah pembayaran.",
    fitur: [
      "File tutorial siap pakai",
      "Bisa dipelajari offline",
      "Update gratis jika ada revisi",
      "Dikirim via WhatsApp"
    ]
  },
  {
    id: 2,
    judul: "Jasa Post Akun All Channel",
    harga: 15000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Jasa post akun ke semua channel & grup terkait. Tingkatkan reach akun kamu.",
    fitur: [
      "Post di banyak channel",
      "Post di grup aktif",
      "Laporan hasil post",
      "Proses 1x24 jam"
    ]
  },
  {
    id: 3,
    judul: "Paket Views + Kontak",
    harga: 25000,
    status: "AKTIF",
    img: "logo.png",
    deskripsi: "Paket gabungan views story + push kontak untuk meningkatkan interaksi akun.",
    fitur: [
      "Tambah views story",
      "Push kontak targeted",
      "Cocok untuk seller",
      "Hasil terukur"
    ]
  },
  {
    id: 4,
    judul: "Paket Premium Kontak",
    harga: 30000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Paket premium untuk push kontak lebih agresif dan prioritas antrian.",
    fitur: [
      "Prioritas antrian",
      "Push kontak lebih banyak",
      "Support via WA",
      "Garansi proses"
    ]
  }
];

function formatRpProduk(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function renderProduk() {
  const grid = document.getElementById("produkGrid");
  if (!grid) return;

  try {
    const saved = localStorage.getItem("nailong_produk");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        produk.length = 0;
        parsed.forEach(p => produk.push(p));
      }
    }
  } catch (e) {}

  grid.innerHTML = produk.map(p => `
    <div class="produk-card">
      <img src="${p.img}" alt="${p.judul}" onerror="this.style.background='#3d3200'">
      <div class="produk-info">
        <small style="color:#ffd700;font-size:10px;">${p.status}</small>
        <h4>${p.judul}</h4>
        <div class="harga">${formatRpProduk(p.harga)}</div>
        <a href="detail-produk.html?id=${p.id}" class="btn">Lihat Detail</a>
      </div>
    </div>
  `).join("");
}

function tambahProduk(data) {
  const id = produk.length ? Math.max(...produk.map(p => p.id)) + 1 : 1;
  produk.push({
    id,
    judul: data.judul || "Produk Baru",
    harga: data.harga || 10000,
    status: data.status || "TERSEDIA",
    img: data.img || "logo.png",
    deskripsi: data.deskripsi || "",
    fitur: data.fitur || ["File digital", "Dikirim via WA"]
  });
  localStorage.setItem("nailong_produk", JSON.stringify(produk));
  renderProduk();
}

document.addEventListener("DOMContentLoaded", renderProduk);
