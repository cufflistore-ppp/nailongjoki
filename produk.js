const produk = [
  {
    judul: "Tutorial Buat Logo JB Instan",
    harga: "Rp 10.000",
    status: "AKTIF",
    img: "logo.png"
  },
  {
    judul: "Jasa Post Akun All Channel",
    harga: "Rp 15.000",
    status: "TERSEDIA",
    img: "logo.png"
  },
  {
    judul: "Paket Views + Kontak",
    harga: "Rp 25.000",
    status: "AKTIF",
    img: "logo.png"
  },
  {
    judul: "Video FS Cinematik",
    harga: "Rp 30.000",
    status: "TERSEDIA",
    img: "logo.png"
  }
];

function renderProduk() {
  const grid = document.getElementById("produkGrid");
  if (!grid) return;

  grid.innerHTML = produk.map(p => `
    <div class="produk-card">
      <img src="${p.img}" alt="${p.judul}" onerror="this.style.background='#3d3200'">
      <div class="produk-info">
        <small style="color:#ffd700;font-size:10px;">${p.status}</small>
        <h4>${p.judul}</h4>
        <div class="harga">${p.harga}</div>
        <a href="joki.html" class="btn">Buka Produk</a>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", renderProduk);
