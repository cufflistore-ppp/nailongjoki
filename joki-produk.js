const JOKI_CATALOG_VER = "7";

const paketJoki = [
  {
    id: 1,
    label: "15 JAM",
    badge: "Paling Laris",
    judul: "Joki 15 Jam",
    deskripsi: "500p · 15 jam + SW + share all GB",
    harga: 500,
    fitur: [
      "15 jam + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 2,
    label: "1 HARI",
    judul: "Joki 1 Hari",
    deskripsi: "1.000 · 1 hari + SW + share all GB",
    harga: 1000,
    fitur: [
      "1 hari + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 3,
    label: "2 HARI",
    judul: "Joki 2 Hari",
    deskripsi: "2.000 · 2 hari + SW + share all GB",
    harga: 2000,
    fitur: [
      "2 hari + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 4,
    label: "3 HARI",
    judul: "Joki 3 Hari",
    deskripsi: "3.000 · 3 hari + SW + share all GB",
    harga: 3000,
    fitur: [
      "3 hari + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 5,
    label: "5 HARI",
    judul: "Joki 5 Hari",
    deskripsi: "5.000 · 5 hari + SW + share all GB",
    harga: 5000,
    fitur: [
      "5 hari + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 6,
    label: "6 HARI",
    judul: "Joki 6 Hari",
    deskripsi: "6.000 · 6 hari + SW + share all GB",
    harga: 6000,
    fitur: [
      "6 hari + SW + share all GB",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 7,
    label: "1 MINGGU",
    judul: "Joki 1 Minggu",
    deskripsi: "7.000 · 1 minggu + SW + share all GB + tempel link website khusus buyer mingguan",
    harga: 7000,
    fitur: [
      "1 minggu + SW + share all GB",
      "Tempel link website khusus buyer mingguan",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 8,
    label: "1 BULAN",
    badge: "Hot",
    judul: "Joki 1 Bulan",
    deskripsi: "15.000 · 1 bulan + SW + share all GB + tempel link website khusus buyer bulanan + story Instagram",
    harga: 15000,
    fitur: [
      "1 bulan + SW + share all GB",
      "Tempel link website khusus buyer bulanan",
      "Story Instagram",
      "Order langsung di web",
      "Status dapat dipantau"
    ]
  },
  {
    id: 9,
    label: "PERMANEN",
    judul: "Joki Permanen",
    deskripsi: "30.000 · permanen + tempel link website khusus buyer permanen + story TikTok + story Instagram + SW tebar sampai pensi JB",
    harga: 30000,
    fitur: [
      "Permanen + tempel link website khusus buyer permanen",
      "Story TikTok + Story Instagram",
      "SW tebar sampai pensi JB",
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

  container.innerHTML = paketJoki.map(p => {
    const badgeHtml = p.badge
      ? `<span class="paket-badge ${p.badge === "Hot" ? "badge-hot" : "badge-laris"}">${p.badge}</span>`
      : "";
    return `
    <div class="paket-card">
      <div class="paket-label-row">
        <div class="paket-label">${p.label}</div>
        ${badgeHtml}
      </div>
      <h3>${p.judul}</h3>
      <p>${p.deskripsi}</p>
      <ul>
        ${p.fitur.map(f => `<li><img src="secure.gif" alt="✓" class="check-img" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"> ${f}</li>`).join("")}
      </ul>
      <div class="harga">${formatRp(p.harga)}</div>
      <a href="detail.html?id=${p.id}" class="btn-pesan" style="display:block;text-align:center;text-decoration:none;">
        Pesan Sekarang
      </a>
    </div>
  `;
  }).join("");
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
