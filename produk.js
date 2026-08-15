// Daftar Produk Digital - berbeda dari paket Joki
const produk = [
  {
    id: 1,
    judul: "Jasa Post Akun 1 Channel",
    harga: 5000,
    status: "TERSEDIA",
    img: "nailong1.png",
    deskripsi: "Jasa post akun ke semua channel & grup terkait. Tingkatkan reach akun kamu.",
    fitur: [
      "Post di grup + 1 channel aktif",
      "Laporan hasil post",
      "Proses 1x24 jam"
    ]
  },
  {
    id: 2,
    judul: "Jasa Post Akun 3 Channel",
    harga: 15000,
    status: "TERSEDIA",
    img: "nailong2.png",
    deskripsi: "Jasa post akun ke semua channel & grup terkait. Tingkatkan reach akun kamu.",
    fitur: [
      "Post di 3 channel",
      "Post di grup + 3 channel aktif",
      "Laporan hasil post",
      "Proses 1x24 jam"
    ]
  },
  {
    id: 3,
    judul: "Jasa Post Akun All Channel",
    harga: 75000,
    status: "TERSEDIA",
    img: "nailong3.png",
    deskripsi: "Jasa post akun ke semua channel & grup terkait. Tingkatkan reach akun kamu.",
    fitur: [
      "Post di banyak channel + grup",
      "Post di all grup + all channel aktif",
      "Laporan hasil post",
      "Proses 1x24 jam"
    ]
  },
  {
    id: 4,
    judul: "Paket Views + Kontak",
    harga: 35000,
    status: "AKTIF",
    img: "nailong4.png",
    deskripsi: "Paket gabungan views story + push kontak untuk meningkatkan interaksi akun.",
    fitur: [
      "Tambah views story",
      "Push kontak targeted",
      "Cocok untuk seller",
      "Hasil terukur"
    ]
  },
  {
    id: 5,
    judul: "Paket Premium Kontak",
    harga: 500000,
    status: "TERSEDIA",
    img: "nailong5.png",
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
