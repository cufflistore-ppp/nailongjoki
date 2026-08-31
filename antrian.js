const SAVED_KODE_KEY = "voxyy_saved_kode";

function isStatusSukses(status) {
  const s = String(status || "").toLowerCase();
  return s.includes("sukses") || s.includes("selesai");
}

function isStatusBelumSelesai(status) {
  return !isStatusSukses(status);
}

function saveTrackedKode(kode) {
  if (!kode) return;
  localStorage.setItem(SAVED_KODE_KEY, String(kode).trim());
}

function clearTrackedKode(kode) {
  const saved = localStorage.getItem(SAVED_KODE_KEY);
  if (!kode || !saved || saved.toUpperCase() === String(kode).toUpperCase()) {
    localStorage.removeItem(SAVED_KODE_KEY);
  }
}

function getTrackedKode() {
  return (localStorage.getItem(SAVED_KODE_KEY) || "").trim();
}

async function fetchOrders() {
  if (window.VoxyyOrders && typeof window.VoxyyOrders.getOrders === "function") {
    return await window.VoxyyOrders.getOrders();
  }
  try {
    return JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  } catch (e) {
    return [];
  }
}

function findOrderByKode(orders, kode) {
  if (!kode) return null;
  const target = String(kode).trim().toUpperCase();
  return (orders || []).find(
    (o) => String(o.kode || "").toUpperCase() === target
  ) || null;
}

function loadAntrianFromOrders(orders) {
  // Hanya tampilkan yang belum sukses/selesai (yang sukses sudah dihapus / disembunyikan)
  const active = (orders || []).filter((o) => isStatusBelumSelesai(o && o.status));
  return active.map((o, i) => ({
    no: i + 1,
    nama:
      (o.nama || "Anonim").length > 8
        ? (o.nama || "A").substring(0, 2) + "********"
        : o.nama || "Anonim",
    jenis: (o.paket || "Joki Kontak") + " · " + (o.status || "Belum Bayar"),
    status:
      o.status === "Proses" || o.status === "PROSES"
        ? "PROSES"
        : o.status === "Menunggu Verifikasi"
        ? "PROSES"
        : "MASUK ANTRIAN"
  }));
}

const ANTRIAN_PER_PAGE = 10;
let antrianPage = 1;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("sukses") || s.includes("selesai")) return "sukses";
  if (s.includes("proses") || s.includes("verifikasi")) return "proses";
  return "belum";
}

function statusIcon(cls) {
  if (cls === "sukses") return "✅";
  if (cls === "proses") return "⏳";
  return "🛒";
}

async function renderAntrian() {
  const list = document.getElementById("antrianList");
  if (!list) return;

  const globalOn =
    window.VoxyyOrders && window.VoxyyOrders.isGlobalConfigured();

  list.innerHTML = `
    <div class="antrian-empty">
      <div class="antrian-empty-icon">⏳</div>
      <strong>Memuat antrian...</strong>
      <small>Sinkron data...</small>
    </div>
  `;

  let orders = [];
  try {
    orders = await fetchOrders();
  } catch (e) {
    console.warn(e);
  }

  let modeBadge = document.getElementById("antrianModeBadge");
  if (!modeBadge) {
    modeBadge = document.createElement("div");
    modeBadge.id = "antrianModeBadge";
    modeBadge.style.cssText =
      "font-size:11px;color:#8aa0b8;margin:-8px 0 12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;";
    const searchBox = document.querySelector(".search-box");
    if (searchBox && searchBox.parentNode) {
      searchBox.parentNode.insertBefore(modeBadge, searchBox.nextSibling);
    }
  }
  const data = loadAntrianFromOrders(orders);
  const configured = window.VoxyyOrders && window.VoxyyOrders.isGlobalConfigured && window.VoxyyOrders.isGlobalConfigured();
  if (configured) {
    modeBadge.innerHTML =
      '<span style="background:#0d3d1a;color:#66bb6a;padding:3px 8px;border-radius:6px;font-weight:600;">🌐 Antrian Global (Realtime)</span> <span>' +
      (orders.length || 0) + ' pesanan · sinkron antar HP</span>';
  } else {
    modeBadge.innerHTML =
      '<span style="background:#3d2a0d;color:#ffb74d;padding:3px 8px;border-radius:6px;font-weight:600;">⚙️ Setup Firebase</span> <span>Isi FIREBASE_CONFIG di global-orders.js (gratis) agar antar-HP sinkron</span>';
  }

  if (data.length === 0) {
    list.innerHTML = `
      <div class="antrian-empty">
        <div class="antrian-empty-icon">🕒</div>
        <strong>Antrian masih kosong</strong>
        <small>Belum ada pesanan aktif. Buat order baru, lalu tarik refresh halaman ini.</small>
      </div>
    `;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(data.length / ANTRIAN_PER_PAGE));
  if (antrianPage > totalPages) antrianPage = totalPages;
  if (antrianPage < 1) antrianPage = 1;
  const start = (antrianPage - 1) * ANTRIAN_PER_PAGE;
  const pageData = data.slice(start, start + ANTRIAN_PER_PAGE);

  const itemsHtml = pageData
    .map(
      (item) => `
    <div class="antrian-item">
      <div style="display:flex;align-items:center;">
        <div class="num">#${item.no}</div>
        <div class="info">
          <strong>${escapeHtml(item.nama)}</strong>
          <small>${escapeHtml(item.jenis)}</small>
        </div>
      </div>
      <span class="status-badge">${escapeHtml(item.status)}</span>
    </div>
  `
    )
    .join("");

  const pagerHtml = totalPages > 1 ? `
    <div class="antrian-pager" style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap;">
      <button type="button" class="antrian-page-btn" ${antrianPage <= 1 ? "disabled" : ""} onclick="goAntrianPage(${antrianPage - 1})" style="background:#10182a;border:1px solid #1a2740;color:#FFC107;padding:8px 14px;border-radius:10px;font-size:13px;cursor:pointer;">‹ Prev</button>
      <span style="font-size:12px;color:#aaa;">Halaman <b style="color:#FFC107;">${antrianPage}</b> / ${totalPages} · ${data.length} antrian</span>
      <button type="button" class="antrian-page-btn" ${antrianPage >= totalPages ? "disabled" : ""} onclick="goAntrianPage(${antrianPage + 1})" style="background:#10182a;border:1px solid #1a2740;color:#FFC107;padding:8px 14px;border-radius:10px;font-size:13px;cursor:pointer;">Next ›</button>
    </div>
  ` : `<p style="text-align:center;font-size:12px;color:#8aa0b8;margin-top:12px;">${data.length} antrian aktif</p>`;

  list.innerHTML = itemsHtml + pagerHtml;
}

function goAntrianPage(p) {
  antrianPage = Math.max(1, Number(p) || 1);
  renderAntrian();
  try {
    document.getElementById("antrianList")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {}
}

function ensureStatusModal() {
  if (document.getElementById("statusCheckModal")) return;

  const wrap = document.createElement("div");
  wrap.id = "statusCheckModal";
  wrap.innerHTML = `
    <div class="status-modal-backdrop" data-close="1"></div>
    <div class="status-modal-box" role="dialog" aria-modal="true" aria-labelledby="statusModalTitle">
      <div class="status-modal-icon" id="statusModalIcon">📋</div>
      <div class="status-modal-title" id="statusModalTitle">Status Pesanan</div>
      <div class="status-modal-body" id="statusModalBody"></div>
      <button type="button" class="status-modal-btn" data-close="1">Oke</button>
    </div>
  `;
  document.body.appendChild(wrap);

  wrap.addEventListener("click", function (e) {
    if (e.target && e.target.getAttribute("data-close") === "1") closeStatusModal();
  });

  if (!document.getElementById("statusCheckModalStyle")) {
    const style = document.createElement("style");
    style.id = "statusCheckModalStyle";
    style.textContent = `
      #statusCheckModal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 10000;
        align-items: center;
        justify-content: center;
        padding: 18px;
      }
      #statusCheckModal.show { display: flex; }
      .status-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.72);
        backdrop-filter: blur(5px);
      }
      .status-modal-box {
        position: relative;
        background: #10182a;
        border: 1px solid #1a2740;
        border-radius: 16px;
        padding: 22px 16px 16px;
        width: 100%;
        max-width: 340px;
        max-height: calc(100vh - 36px);
        overflow: auto;
        text-align: center;
        box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        animation: statusModalIn 0.22s ease;
      }
      @keyframes statusModalIn {
        from { opacity: 0; transform: scale(0.94) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .status-modal-icon { font-size: 30px; margin-bottom: 6px; line-height: 1; }
      .status-modal-title {
        font-size: 16px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 12px;
      }
      .status-modal-body {
        text-align: left;
        background: #0a0e18;
        border: 1px solid #1a2740;
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 14px;
        overflow: hidden;
      }
      .status-row {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 8px;
        align-items: start;
        padding: 7px 0;
        border-bottom: 1px solid #1a2740;
      }
      .status-row:last-child { border-bottom: none; }
      .status-row .k {
        color: #8aa0b8;
        font-size: 11px;
        padding-top: 2px;
      }
      .status-row .v {
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        word-break: break-word;
        overflow-wrap: anywhere;
        line-height: 1.4;
      }
      .status-row .v code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 12px;
        background: #10182a;
        border: 1px solid #1a2740;
        padding: 2px 6px;
        border-radius: 6px;
        color: #90caf9;
      }
      .status-row .v.sukses { color: #66bb6a; }
      .status-row .v.proses { color: #FFD54F; }
      .status-row .v.belum { color: #ffb74d; }
      .status-note {
        margin-top: 8px;
        font-size: 11px;
        color: #9bb0c4;
        line-height: 1.45;
      }
      .status-modal-btn {
        width: 100%;
        background: linear-gradient(135deg, #FFC107, #FF8F00);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 12px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      .antrian-empty {
        background: #10182a;
        border: 1px dashed #1a2740;
        border-radius: 14px;
        padding: 28px 16px;
        text-align: center;
      }
      .antrian-empty-icon { font-size: 28px; margin-bottom: 8px; }
      .antrian-empty strong { display: block; font-size: 14px; margin-bottom: 6px; }
      .antrian-empty small { display: block; color: #8aa0b8; font-size: 12px; line-height: 1.45; }
    `;
    document.head.appendChild(style);
  }
}

function showStatusModal(title, bodyHtml, icon) {
  ensureStatusModal();
  document.getElementById("statusModalTitle").textContent = title || "Status Pesanan";
  document.getElementById("statusModalBody").innerHTML = bodyHtml || "";
  document.getElementById("statusModalIcon").textContent = icon || "📋";
  document.getElementById("statusCheckModal").classList.add("show");
}

function closeStatusModal() {
  const el = document.getElementById("statusCheckModal");
  if (el) el.classList.remove("show");
}

function row(label, value, extraClass) {
  return (
    '<div class="status-row">' +
    '<div class="k">' +
    escapeHtml(label) +
    "</div>" +
    '<div class="v' +
    (extraClass ? " " + extraClass : "") +
    '">' +
    value +
    "</div>" +
    "</div>"
  );
}

function syncSearchInput(kode) {
  const input = document.getElementById("searchOrder");
  if (!input) return;
  input.value = kode || "";
}

async function restoreSavedKodeToInput() {
  const input = document.getElementById("searchOrder");
  if (!input) return;

  let kode = getTrackedKode();
  const orders = await fetchOrders();

  if (!kode) {
    const pending = orders.find(
      (o) => o && o.kode && isStatusBelumSelesai(o.status)
    );
    if (pending) {
      kode = pending.kode;
      saveTrackedKode(kode);
    }
  }

  if (!kode) {
    input.value = "";
    return;
  }

  const found = findOrderByKode(orders, kode);
  if (found && isStatusSukses(found.status)) {
    clearTrackedKode(kode);
    input.value = "";
    return;
  }

  input.value = kode;
}

async function cekStatus() {
  const input = document.getElementById("searchOrder");
  if (!input || !input.value.trim()) {
    showStatusModal(
      "Nomor Order Kosong",
      row("Info", "Masukkan nomor order terlebih dahulu.") +
        row("Contoh", "<code>VJ-2026-7129517</code>"),
      "⚠️"
    );
    return;
  }

  const kode = input.value.trim().toUpperCase();
  const orders = await fetchOrders();
  const found = findOrderByKode(orders, kode);

  if (found) {
    const st = found.status || "Belum Bayar";
    const cls = statusClass(st);
    const note = isStatusSukses(st)
      ? '<div class="status-note">Pesanan sudah sukses. Kode antrian di kolom pencarian dihapus otomatis.</div>'
      : '<div class="status-note">Kode antrian disimpan di kolom pencarian sampai status menjadi Sukses.</div>';

    showStatusModal(
      "Status Pesanan",
      row("Kode Antrian", "<code>" + escapeHtml(found.kode || kode) + "</code>") +
        row("Nama", escapeHtml(found.nama || "-")) +
        row("Paket", escapeHtml(found.paket || "-")) +
        row("Status", escapeHtml(st), cls) +
        row("Total", escapeHtml(found.total || "-")) +
        row("Waktu", escapeHtml(found.waktu || "-")) +
        note,
      statusIcon(cls)
    );

    if (isStatusSukses(st)) {
      clearTrackedKode(found.kode || kode);
      syncSearchInput("");
    } else {
      saveTrackedKode(found.kode || kode);
      syncSearchInput(found.kode || kode);
    }
  } else {
    showStatusModal(
      "Order Tidak Ditemukan",
      row("Kode yang dicari", "<code>" + escapeHtml(kode) + "</code>") +
        row("Info", "Nomor order tidak ditemukan di antrian global. Pastikan kode benar."),
      "❌"
    );
  }
}

document.addEventListener("DOMContentLoaded", function () {
  ensureStatusModal();
  renderAntrian();
  restoreSavedKodeToInput();

  const inp = document.getElementById("searchOrder");
  if (inp) {
    inp.placeholder = "VJ-2026-xxxx";
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        cekStatus();
      }
    });
  }

  // Realtime: order baru langsung muncul tanpa refresh
  if (window.VoxyyOrders && typeof window.VoxyyOrders.onOrdersChange === "function") {
    window.VoxyyOrders.onOrdersChange(function () {
      renderAntrian();
      restoreSavedKodeToInput();
    });
  } else {
    setInterval(function () {
      renderAntrian();
    }, 60000);
  }
});
