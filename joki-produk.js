// Daftar paket Joki - bisa ditambah / diubah di sini
const paketJoki = [
  {
    id: 1,
    label: "1 HARI",
    judul: "Joki 1 hari",
    deskripsi: "Layanan joki kontak selama 1 hari.",
    harga: 5000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 2,
    label: "2 HARI",
    judul: "Joki 2 Hari",
    deskripsi: "Layanan joki kontak selama 2 hari.",
    harga: 10000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 3,
    label: "3 HARI",
    judul: "Joki 3 Hari",
    deskripsi: "Layanan joki kontak selama 3 hari.",
    harga: 15000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau",
      "Prioritas lebih tinggi"
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
        Lihat Detail
      </a>
    </div>
  `).join("");
}

// Untuk menambah produk dari console / admin (opsional)
function tambahPaket(data) {
  const id = paketJoki.length ? Math.max(...paketJoki.map(p => p.id)) + 1 : 1;
  paketJoki.push({
    id,
    label: data.label || "BARU",
    judul: data.judul || "Paket Baru",
    deskripsi: data.deskripsi || "",
    harga: data.harga || 5000,
    fitur: data.fitur || ["Order langsung dari website", "Status dapat dipantau"]
  });
  renderPaketJoki();
  // Simpan ke localStorage supaya persist
  localStorage.setItem("nailong_paket", JSON.stringify(paketJoki));
}

function loadPaketFromStorage() {
  try {
    const saved = localStorage.getItem("nailong_paket");
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
