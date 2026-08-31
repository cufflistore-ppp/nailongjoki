const JOKI_CATALOG_VER = "5";

const paketJoki = [
  {
    id: 1,
    label: "20 JAM",
    judul: "Joki 20 Jam",
    deskripsi: "Layanan joki kontak selama 20 jam.",
    harga: 500,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 2,
    label: "1 HARI",
    judul: "Joki 1 Hari",
    deskripsi: "Layanan joki kontak selama 1 hari.",
    harga: 1000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 3,
    label: "2 HARI",
    judul: "Joki 2 Hari",
    deskripsi: "Layanan joki kontak selama 2 hari.",
    harga: 2000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 4,
    label: "3 HARI",
    judul: "Joki 3 Hari",
    deskripsi: "Layanan joki kontak selama 3 hari.",
    harga: 3000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 5,
    label: "4 HARI",
    judul: "Joki 4 Hari",
    deskripsi: "Layanan joki kontak selama 4 hari.",
    harga: 4000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 6,
    label: "5 HARI",
    judul: "Joki 5 Hari",
    deskripsi: "Layanan joki kontak selama 5 hari.",
    harga: 5000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 7,
    label: "PERMANEN",
    judul: "Joki Permanen",
    deskripsi: "Layanan joki kontak selamanya.",
    harga: 6000,
    fitur: [
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  }
];

function formatRp(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function renderPaketJoki() {
  const container = document.getElementById("paketList");
  if (!container) return;

  container.innerHTML = paketJoki.map(p => `
    <div class="paket-card">
      <div class="paket-label">${p.label}</div>
      <h3>${p.judul}</h3>
      <p>${p.deskripsi}</p>
      <ul>
        ${p.fitur.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join("")}
      </ul>
      <div class="harga">${formatRp(p.harga)}</div>
      <a href="detail.html?id=${p.id}" class="btn-pesan" style="display:block;text-align:center;text-decoration:none;">
        Pesan Sekarang
      </a>
    </div>
  `).join("");
}

function tambahPaket(data) {
  const id = paketJoki.length ? Math.max(...paketJoki.map(p => p.id)) + 1 : 1;
  paketJoki.push({
    id,
    label: data.label || "BARU",
    judul: data.judul || "Paket Baru",
    deskripsi: data.deskripsi || "",
    harga: data.harga || 1000,
    fitur: data.fitur || ["Order langsung di web", "Status dapat dipantau"]
  });
  renderPaketJoki();
  localStorage.setItem("voxyy_paket", JSON.stringify(paketJoki));
}

function loadPaketFromStorage() {
  try {
    if (localStorage.getItem("voxyy_paket_ver") !== JOKI_CATALOG_VER) {
      localStorage.removeItem("voxyy_paket");
      localStorage.setItem("voxyy_paket_ver", JOKI_CATALOG_VER);
    }
    const saved = localStorage.getItem("voxyy_paket");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) {
        paketJoki.length = 0;
        parsed.forEach(p => paketJoki.push(p));
      }
    }
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", function() {
  loadPaketFromStorage();
  renderPaketJoki();
});
