const DIGITAL_CATALOG_VER = "5";

const produkDigital = [
  {
    id: 1,
    slug: "apk-badak-manen-no-wa",
    label: "APK",
    judul: "APK Badak Manen No WA",
    deskripsi: "Pilih paket, bayar QRIS, lalu konfirmasi ke admin WhatsApp.",
    harga: 500,
    status: "TERSEDIA",
    img: "logo.png",
    directPay: true,
    variants: [
      { nama: "Member", harga: 500 },
      { nama: "Vip", harga: 1000 },
      { nama: "Reseller", harga: 2000 },
      { nama: "Partner", harga: 3000 },
      { nama: "Admin", harga: 2500 },
      { nama: "Jasa badak no wa", harga: 300 }
    ],
    fitur: ["Pilih paket", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 2,
    slug: "apk-ps",
    label: "APK",
    judul: "APK PS",
    deskripsi: "Langsung bayar QRIS, setelah transfer konfirmasi via WhatsApp.",
    harga: 2500,
    status: "TERSEDIA",
    img: "logo.png",
    directPay: true,
    fitur: ["Harga Rp 2.500", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 3,
    slug: "apk-jb",
    label: "APK",
    judul: "APK JB",
    deskripsi: "Langsung bayar QRIS, setelah transfer konfirmasi via WhatsApp.",
    harga: 5000,
    status: "TERSEDIA",
    img: "logo.png",
    directPay: true,
    fitur: ["Harga Rp 5.000", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  },
  {
    id: 4,
    slug: "apk-bioskop",
    label: "APK",
    judul: "APK Bioskop",
    deskripsi: "Langsung bayar QRIS, setelah transfer konfirmasi via WhatsApp.",
    harga: 2500,
    status: "TERSEDIA",
    img: "logo.png",
    directPay: true,
    fitur: ["Harga Rp 2.500", "Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  }
];

function formatRpDigital(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function payUrl(judul, harga) {
  return "pembayaran.html?paket=" + encodeURIComponent(judul) + "&total=" + encodeURIComponent(String(harga));
}

function loadProdukDigital() {
  try {
    if (localStorage.getItem("voxyy_digital_ver") !== DIGITAL_CATALOG_VER) {
      localStorage.removeItem("voxyy_digital");
      localStorage.setItem("voxyy_digital_ver", DIGITAL_CATALOG_VER);
    }
    const saved = localStorage.getItem("voxyy_digital");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        produkDigital.length = 0;
        parsed.forEach(p => produkDigital.push(p));
      }
    }
  } catch (e) {}
}

function renderDigitalList() {
  const list = document.getElementById("digitalList");
  if (!list) return;
  loadProdukDigital();

  list.innerHTML = produkDigital.map(p => {
    const variants = Array.isArray(p.variants) && p.variants.length ? p.variants : null;
    const actions = variants
      ? `<div class="variant-grid">` + variants.map(v =>
          `<a href="${payUrl(p.judul + " · " + v.nama, v.harga)}" class="btn-pesan variant-btn">${v.nama}<small>${formatRpDigital(v.harga)}</small></a>`
        ).join("") + `</div>`
      : `<a href="${payUrl(p.judul, p.harga)}" class="btn-pesan">Bayar Sekarang</a>`;

    return `
    <div class="paket-card">
      <span class="paket-label">${p.label || "DIGITAL"}</span>
      <h3>${p.judul}</h3>
      <p>${p.deskripsi || ""}</p>
      <ul>
        ${(p.fitur || []).map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join("")}
      </ul>
      <div class="harga">${variants ? "Mulai " + formatRpDigital(p.harga) : formatRpDigital(p.harga)}</div>
      ${actions}
    </div>`;
  }).join("");
}

function tambahProdukDigital(data) {
  const id = produkDigital.length ? Math.max(...produkDigital.map(p => p.id)) + 1 : 1;
  produkDigital.push({
    id,
    label: data.label || "DIGITAL",
    judul: data.judul || "Produk Baru",
    deskripsi: data.deskripsi || "",
    harga: data.harga || 10000,
    status: data.status || "TERSEDIA",
    img: data.img || "logo.png",
    directPay: true,
    fitur: data.fitur || ["Bayar langsung QRIS", "Konfirmasi via WhatsApp"]
  });
  localStorage.setItem("voxyy_digital", JSON.stringify(produkDigital));
  renderDigitalList();
}

document.addEventListener("DOMContentLoaded", renderDigitalList);
