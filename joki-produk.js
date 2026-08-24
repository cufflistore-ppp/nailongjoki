// Daftar paket Joki - bisa ditambah / diubah di sini
const paketJoki = [
  {
    id: 1,
    label: "1 HARI",
    judul: "Joki 1 hari",
    deskripsi: "Layanan joki kontak selama 1 hari.",
    harga: 1500,
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
    harga: 3000,
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
    harga: 4500,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 4,
    label: "4 HARI",
    judul: "Joki 4 Hari",
    deskripsi: "Layanan joki kontak selama 4 hari.",
    harga: 6000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 5,
    label: "5 HARI",
    judul: "Joki 5 Hari",
    deskripsi: "Layanan joki kontak selama 5 hari.",
    harga: 7500,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 6,
    label: "6 HARI",
    judul: "Joki 6 Hari",
    deskripsi: "Layanan joki kontak selama 6 hari.",
    harga: 9000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
    {
    id: 7,
    label: "perminggu",
    judul: "Joki peinggu",
    deskripsi: "Layanan joki kontak selama 7 hari.",
    harga: 13000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 8,
    label: "perminggu vip",
    judul: "Joki perminggu vip",
    deskripsi: "Layanan joki kontak selama 1 minggu vip.",
    harga: 17000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau",
      "prioritas tertinggi"
    ]
  },
    {
    id: 9,
    label: "perbulan",
    judul: "Joki perbulan",
    deskripsi: "Layanan joki kontak selama 1 bulan.",
    harga: 21000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau"
    ]
  },
  {
    id: 10,
    label: "perbulan vip",
    judul: "Joki perminggu vip",
    deskripsi: "Layanan joki kontak selama 1 bulan vip.",
    harga: 28000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau",
      "prioritas tertinggi"
    ]
  },
    {
    id: 11,
    label: "Permanent",
    judul: "Joki Permanent",
    deskripsi: "Layanan joki kontak selama nya....",
    harga: 50000,
    fitur: [
      "Order langsung dari website",
      "Status dapat dipantau",
      "Prioritas tertinggi"
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
