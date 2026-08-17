// ========== TOP NOTIF (hanya muncul jika ada order real) ==========
function formatRupiah(n) {
  if (typeof n === "string" && n.includes("Rp")) return n;
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function isNotifHidden() {
  return localStorage.getItem("nailong_notif_hidden") === "1";
}

function hideAllNotif() {
  localStorage.setItem("nailong_notif_hidden", "1");
  const el = document.getElementById("topNotif");
  if (el) {
    el.style.display = "none";
    el.innerHTML = "";
  }
}

function getRecentOrdersForNotif() {
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  // Hanya order real (punya kode NJ)
  return orders.filter(o => o && o.kode && String(o.kode).startsWith("NJ-")).slice(0, 5);
}

function generateNotifFromOrder(order) {
  if (!order) return "";
  const shortName = (order.nama || "A").substring(0, 1) + "****";
  const price = order.total || order.finalAmount || "Rp 5.000";
  const priceText = typeof price === "number" ? formatRupiah(price) : price;
  const svc = order.paket || "Joki Kontak";
  let timeText = "baru saja";
  try {
    if (order.createdAt) {
      const diffMin = Math.floor((Date.now() - order.createdAt) / 60000);
      if (diffMin < 1) timeText = "baru saja";
      else if (diffMin < 60) timeText = diffMin + " mnt lalu";
      else timeText = Math.floor(diffMin / 60) + " jam lalu";
    }
  } catch(e) {}
  return `<div class="notif-item">
    <span class="notif-icon">🛒</span>
    <span class="notif-text"><b>Beli</b> · ${shortName}. · <b>${priceText}</b> · ${svc} · <span class="time">${timeText}</span></span>
    <button type="button" class="notif-close" onclick="hideAllNotif()" title="Tutup notifikasi">×</button>
  </div>`;
}

function updateTopNotif() {
  const el = document.getElementById("topNotif");
  if (!el) return;

  // Kalau user sudah tutup notif, jangan tampilkan lagi
  if (isNotifHidden()) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  const recent = getRecentOrdersForNotif();
  if (recent.length === 0) {
    // Tidak ada order real → sembunyikan notif
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  el.style.display = "block";
  // Tampilkan order terbaru, berganti setiap beberapa detik
  const idx = Math.floor(Date.now() / 8000) % recent.length;
  el.innerHTML = generateNotifFromOrder(recent[idx]);
}

// Jalankan saat load & setiap 8 detik
document.addEventListener("DOMContentLoaded", function() {
  updateTopNotif();
  setInterval(updateTopNotif, 8000);
});

// ========== ORDER FORM ==========
// ========== ORDER FORM ==========
let baseHarga = 5000;
let addonTotal = 0;

function openOrder(hari) {
  baseHarga = hari === 1 ? 5000 : 10000;
  const form = document.getElementById("orderForm");
  if (form) {
    form.classList.remove("hidden");
    const hargaEl = document.getElementById("hargaPaket");
    if (hargaEl) hargaEl.textContent = formatRupiah(baseHarga);
    updateTotal();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function toggleAddon(el, price) {
  el.classList.toggle("selected");
  if (el.classList.contains("selected")) {
    addonTotal += price;
    el.querySelector(".btn-pilih").textContent = "Dipilih";
  } else {
    addonTotal -= price;
    el.querySelector(".btn-pilih").textContent = "Pilih";
  }
  updateTotal();
}

function updateTotal() {
  const total = baseHarga + addonTotal;
  const el = document.getElementById("totalHarga");
  if (el) el.textContent = formatRupiah(total);
}

async function buatPesanan() {
  const nama = document.getElementById("nama")?.value?.trim() || "";
  const wa = document.getElementById("wa")?.value?.trim() || "";
  let catatan = document.getElementById("catatan")?.value || "";

  // Validasi field wajib untuk Joki Kontak
  if (!nama || !wa) {
    showSiteModal("Lengkapi field wajib: Nama (Store/JB) dan Nomor WhatsApp.", "warning");
    return;
  }
  if (wa.replace(/\D/g, "").length < 10) {
    showSiteModal("Nomor WhatsApp tidak valid. Masukkan minimal 10 digit.", "warning");
    return;
  }

  // Auto replace placeholder
  if (catatan.includes("NAMA STORE")) {
    catatan = catatan.replace(/NAMA STORE/g, nama);
  }
  if (catatan.includes("628…") || catatan.includes("628...")) {
    let nomor = wa.replace(/^0/, "62").replace(/\D/g, "");
    if (nomor.length < 10) nomor = "628xxxxxxxxxx";
    catatan = catatan.replace(/628…|628\.\.\./g, nomor);
  }

  const total = document.getElementById("totalHarga")?.textContent || "Rp 5.000";
  const rand = Math.floor(1000 + Math.random() * 9000);
  const timePart = String(Date.now()).slice(-3);
  const kode = `NJ-2026-${rand}${timePart}`;

  let order = {
    kode,
    nama,
    wa,
    catatan,
    total,
    paket: (window.orderPaketName || window.orderType || "Joki Kontak"),
    status: "Belum Bayar",
    waktu: new Date().toLocaleString("id-ID")
  };

  // Simpan waktu order
  order.createdAt = Date.now();
  order.finalAmount = Number(String(total).replace(/[^\d]/g, "")) || 0;

  // Simpan ke localStorage saja (belum kirim Telegram)
  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  orders.unshift(order);
  localStorage.setItem("nailong_orders", JSON.stringify(orders));

  // Reset form fields
  const namaEl = document.getElementById("nama");
  const waEl = document.getElementById("wa");
  if (namaEl) namaEl.value = "";
  if (waEl) waEl.value = "";

  // Redirect ke halaman pembayaran QRIS (Telegram dikirim saat customer klik "Saya Sudah Bayar")
  window.location.href = `pembayaran.html?kode=${encodeURIComponent(kode)}&total=${encodeURIComponent(total)}`;
}

// ========== LAPORAN ==========
async function kirimLaporan() {
  const noPesanan = document.getElementById("noPesanan")?.value || "-";
  const judul = document.getElementById("judulLaporan")?.value || "-";
  const deskripsi = document.getElementById("deskripsiLaporan")?.value || "-";
  const fileInput = document.getElementById("fotoLaporan");

  const data = { noPesanan, judul, deskripsi };
  const files = fileInput ? Array.from(fileInput.files).slice(0, 3) : [];

  if (typeof kirimLaporanKeTelegram === "function") {
    await kirimLaporanKeTelegram(data, files);
  }

  showSiteModal("Laporan berhasil dikirim ke admin via Telegram!", "success");
}

// ========== Custom Animated Modal ==========
function showSiteModal(message, type = "warning") {
  // Hapus modal lama jika ada
  const old = document.querySelector(".site-modal-overlay");
  if (old) old.remove();

  const icons = {
    warning: '<i class="fa-solid fa-exclamation"></i>',
    success: '<i class="fa-solid fa-check"></i>',
    info: '<i class="fa-solid fa-info"></i>'
  };
  const titles = {
    warning: "Perhatian",
    success: "Berhasil",
    info: "Informasi"
  };

  const overlay = document.createElement("div");
  overlay.className = "site-modal-overlay";
  overlay.innerHTML = `
    <div class="site-modal">
      <div class="site-modal-icon ${type}">${icons[type] || icons.warning}</div>
      <div class="site-modal-title">${titles[type] || "Perhatian"}</div>
      <div class="site-modal-msg">${message}</div>
      <button type="button" class="site-modal-btn ${type === "warning" ? "danger" : ""}">Oke</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Trigger animation
  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  const close = () => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 280);
  };

  overlay.querySelector(".site-modal-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

// Alias biar kompatibel dengan kode lama
window.showSiteModal = showSiteModal;
window.showNiceAlert = function(msg) {
  showSiteModal(msg, "warning");
};
