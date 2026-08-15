function loadAntrianFromStorage() {
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  return orders.map((o, i) => ({
    no: i + 1,
    nama: (o.nama || "Anonim").length > 8 ? (o.nama || "A").substring(0, 2) + "********" : (o.nama || "Anonim"),
    jenis: (o.paket || "Joki Kontak") + " · " + (o.status || "Belum Bayar"),
    status: o.status === "Sukses" || o.status === "SELESAI" ? "SELESAI"
          : (o.status === "Proses" || o.status === "PROSES" ? "PROSES"
          : (o.status === "Menunggu Verifikasi" ? "PROSES" : "MASUK ANTRIAN"))
  }));
}

function renderAntrian() {
  const list = document.getElementById("antrianList");
  if (!list) return;

  let data = loadAntrianFromStorage();

  if (data.length === 0) {
    data = [
      { no: 1, nama: "Ci*********", jenis: "Joki 1 Hari · Belum Bayar", status: "MASUK ANTRIAN" },
      { no: 2, nama: "Ga*", jenis: "Joki 2 Hari · Belum Bayar", status: "MASUK ANTRIAN" },
      { no: 3, nama: "Ar*********", jenis: "Joki 2 Hari · Proses", status: "PROSES" },
      { no: 4, nama: "Wj*********", jenis: "Joki 1 Hari · Belum Bayar", status: "MASUK ANTRIAN" }
    ];
  }

  list.innerHTML = data.map(item => `
    <div class="antrian-item">
      <div style="display:flex;align-items:center;">
        <div class="num">#${item.no}</div>
        <div class="info">
          <strong>${item.nama}</strong>
          <small>${item.jenis}</small>
        </div>
      </div>
      <span class="status-badge">${item.status}</span>
    </div>
  `).join("");
}

/* ========== NICE MODAL (ganti alert jelek) ========== */
function ensureModal() {
  if (document.getElementById("siteModal")) return;

  const wrap = document.createElement("div");
  wrap.id = "siteModal";
  wrap.innerHTML = `
    <div class="site-modal-backdrop" onclick="closeSiteModal()"></div>
    <div class="site-modal-box">
      <div class="site-modal-icon" id="siteModalIcon">📋</div>
      <div class="site-modal-title" id="siteModalTitle">Status Pesanan</div>
      <div class="site-modal-body" id="siteModalBody"></div>
      <button class="site-modal-btn" onclick="closeSiteModal()">Oke</button>
    </div>
  `;
  document.body.appendChild(wrap);

  if (!document.getElementById("siteModalStyle")) {
    const style = document.createElement("style");
    style.id = "siteModalStyle";
    style.textContent = `
      #siteModal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #siteModal.show { display: flex; }
      .site-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.72);
        backdrop-filter: blur(4px);
      }
      .site-modal-box {
        position: relative;
        background: #2a2200;
        border: 1px solid #ffd70055;
        border-radius: 16px;
        padding: 24px 20px 20px;
        width: 100%;
        max-width: 340px;
        text-align: center;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        animation: modalIn 0.25s ease;
      }
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.9) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .site-modal-icon { font-size: 36px; margin-bottom: 8px; }
      .site-modal-title {
        font-size: 17px;
        font-weight: 700;
        color: #ffd700;
        margin-bottom: 12px;
      }
      .site-modal-body {
        font-size: 13px;
        color: #ddd;
        line-height: 1.65;
        text-align: left;
        background: #1a1500;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 16px;
        word-break: break-word;
      }
      .site-modal-body .label {
        color: #888;
        font-size: 11px;
        display: block;
        margin-top: 8px;
      }
      .site-modal-body .label:first-child { margin-top: 0; }
      .site-modal-body .val { color: #fff; font-weight: 600; }
      .site-modal-body .val.sukses { color: #7fff00; }
      .site-modal-body .val.proses { color: #ffd700; }
      .site-modal-body .val.belum { color: #ff9800; }
      .site-modal-btn {
        width: 100%;
        background: linear-gradient(135deg, #ffd700, #e6b800);
        color: #1a1500;
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
}

function showSiteModal(title, bodyHtml, icon) {
  ensureModal();
  document.getElementById("siteModalTitle").textContent = title || "Info";
  document.getElementById("siteModalBody").innerHTML = bodyHtml || "";
  document.getElementById("siteModalIcon").textContent = icon || "📋";
  document.getElementById("siteModal").classList.add("show");
}

function closeSiteModal() {
  const el = document.getElementById("siteModal");
  if (el) el.classList.remove("show");
}

window.showSiteModal = showSiteModal;

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("sukses") || s.includes("selesai")) return "sukses";
  if (s.includes("proses") || s.includes("verifikasi")) return "proses";
  return "belum";
}

function cekStatus() {
  const input = document.getElementById("searchOrder");
  if (!input || !input.value.trim()) {
    showSiteModal(
      "Nomor Order Kosong",
      '<span class="label">Info</span><span class="val">Masukkan nomor order terlebih dahulu.<br>Contoh: <b>NJ-2026-7129517</b></span>',
      "⚠️"
    );
    return;
  }

  const kode = input.value.trim().toUpperCase();
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  const found = orders.find(o => (o.kode || "").toUpperCase() === kode);

  if (found) {
    const st = found.status || "Belum Bayar";
    const cls = statusClass(st);
    showSiteModal(
      "Status Pesanan",
      '<span class="label">Kode Antrian</span><span class="val"><code>' + found.kode + '</code></span>' +
      '<span class="label">Nama</span><span class="val">' + (found.nama || "-") + '</span>' +
      '<span class="label">Paket</span><span class="val">' + (found.paket || "-") + '</span>' +
      '<span class="label">Status</span><span class="val ' + cls + '">' + st + '</span>' +
      '<span class="label">Total</span><span class="val">' + (found.total || "-") + '</span>' +
      '<span class="label">Waktu</span><span class="val">' + (found.waktu || "-") + '</span>',
      cls === "sukses" ? "✅" : (cls === "proses" ? "⏳" : "🛒")
    );
  } else {
    showSiteModal(
      "Order Tidak Ditemukan",
      '<span class="label">Kode yang dicari</span><span class="val"><code>' + kode + '</code></span>' +
      '<span class="label">Info</span><span class="val">Nomor order tidak ditemukan di perangkat ini.<br>Pastikan kode benar (contoh: <b>NJ-2026-xxxx</b>) dan order dibuat dari browser yang sama.</span>',
      "❌"
    );
  }
}

document.addEventListener("DOMContentLoaded", function() {
  renderAntrian();
  const inp = document.getElementById("searchOrder");
  if (inp) inp.placeholder = "NJ-2026-xxxx";
});
