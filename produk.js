const HOME_CATALOG_VER = "4";

const produk = [
  {
    id: 1,
    judul: "Jasa Bikin Website 1 html",
    harga: 5000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 5.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 2,
    judul: "Jasa Bikin Website 1 html + 1 js",
    harga: 10000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 10.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 3,
    judul: "Jasa Bikin Website 1 html + 1 js + 1 css",
    harga: 15000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 15.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
},
  {
    id: 4,
    judul: "Jasa Bikin Website 2 html + 2 js + 1 css",
    harga: 25000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 35.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 5,
    judul: "Jasa Bikin Website Jb",
    harga: 80000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 35.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 6,
    judul: "Jasa Bikin Website Seperti Nailong",
    harga: 70000,
    status: "TERSEDIA",
    img: "logo.png",
    deskripsi: "Bayar QRIS dulu. Setelah transfer, konfirmasi ke admin WhatsApp.",
    fitur: ["Harga Rp 70.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  }
];

function formatRpProduk(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function renderProduk() {
  const grid = document.getElementById("produkGrid");
  if (!grid) return;

  try {
    if (localStorage.getItem("voxyy_produk_ver") !== HOME_CATALOG_VER) {
      localStorage.removeItem("voxyy_produk");
      localStorage.setItem("voxyy_produk_ver", HOME_CATALOG_VER);
    }
    const saved = localStorage.getItem("voxyy_produk");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        produk.length = 0;
        parsed.forEach(p => produk.push(p));
      }
    }
  } catch (e) {}

  grid.innerHTML = produk.map(p => {
    const href = "pembayaran.html?paket=" + encodeURIComponent(p.judul) + "&total=" + encodeURIComponent(String(p.harga));
    return `
    <div class="produk-card">
      <img src="${p.img || "logo.png"}" alt="${p.judul}" onerror="this.src='logo.png'">
      <div class="produk-info">
        <small style="color:#FF6F00;font-size:10px;">${p.status || "TERSEDIA"}</small>
        <h4>${p.judul}</h4>
        <div class="harga">${formatRpProduk(p.harga)}</div>
        <a href="${href}" class="btn">Bayar Sekarang</a>
      </div>
    </div>`;
  }).join("");
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
    fitur: data.fitur || ["Bayar langsung QRIS"]
  });
  localStorage.setItem("voxyy_produk", JSON.stringify(produk));
  renderProduk();
}

document.addEventListener("DOMContentLoaded", renderProduk);
