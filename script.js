// ========== TOP NOTIF (marquee bergeser, hanya jika ada order aktif) ==========
function formatRupiah(n) {
  if (typeof n === "string" && n.includes("Rp")) return n;
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function isNotifHidden() {
  return localStorage.getItem("voxyy_notif_hidden") === "1";
}

function hideAllNotif() {
  localStorage.setItem("voxyy_notif_hidden", "1");
  const el = document.getElementById("topNotif");
  if (el) {
    el.style.display = "none";
    el.innerHTML = "";
  }
}

function isOrderActiveForNotif(o) {
  if (!o || !o.kode) return false;
  const st = String(o.status || "").toLowerCase();
  if (st.includes("sukses") || st.includes("selesai")) return false;
  return true;
}

function getOrdersSyncForNotif() {
  try {
    return JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  } catch (e) {
    return [];
  }
}

async function getRecentOrdersForNotif() {
  let orders = [];
  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.getOrders === "function") {
      orders = await window.VoxyyOrders.getOrders();
    } else {
      orders = getOrdersSyncForNotif();
    }
  } catch (e) {
    orders = getOrdersSyncForNotif();
  }
  return (orders || []).filter(isOrderActiveForNotif).slice(0, 12);
}

function notifLineFromOrder(order) {
  if (!order) return "";
  const shortName = (order.nama || "A").substring(0, 1) + "****";
  const price = order.total || order.finalAmount || "Rp 0";
  const priceText = typeof price === "number" ? formatRupiah(price) : String(price);
  const svc = order.paket || "Order";
  let timeText = "baru saja";
  try {
    if (order.createdAt) {
      const diffMin = Math.floor((Date.now() - order.createdAt) / 60000);
      if (diffMin < 1) timeText = "baru saja";
      else if (diffMin < 60) timeText = diffMin + " mnt lalu";
      else timeText = Math.floor(diffMin / 60) + " jam lalu";
    }
  } catch (e) {}
  return `🛒 Beli · ${shortName}. · ${priceText} · ${svc} · ${timeText}`;
}

function updateTopNotif() {
  const el = document.getElementById("topNotif");
  if (!el) return;

  if (isNotifHidden()) {
    el.style.display = "none";
    el.innerHTML = "";
    return;
  }

  // async load
  Promise.resolve(getRecentOrdersForNotif()).then(function (recent) {
    if (!recent || recent.length === 0) {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }

    const lines = recent.map(notifLineFromOrder).filter(Boolean);
    // Duplikasi teks agar marquee mulus
    const track = lines.concat(lines).join("   ···   ");
    el.style.display = "block";
    el.innerHTML = `
      <div class="notif-marquee-wrap">
        <div class="notif-marquee-track">${track.replace(/</g, "&lt;")}</div>
        <button type="button" class="notif-close" onclick="hideAllNotif()" title="Tutup">×</button>
      </div>`;
  });
}

document.addEventListener("DOMContentLoaded", function () {
  updateTopNotif();
  setInterval(updateTopNotif, 10000);
  // Realtime refresh notif saat order berubah
  if (window.VoxyyOrders && typeof window.VoxyyOrders.onOrdersChange === "function") {
    window.VoxyyOrders.onOrdersChange(function () {
      try { localStorage.removeItem("voxyy_notif_hidden"); } catch (e) {}
      updateTopNotif();
    });
  }
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
  if (window.NailongAuthGuard && typeof window.NailongAuthGuard.requireLogin === "function") {
    const ok = await window.NailongAuthGuard.requireLogin({
      message: "Sebelum order, kamu wajib login dulu pakai akun Google."
    });
    if (!ok) return;
  }

  let catatan = document.getElementById("catatan")?.value || "";
  const isJoki = !!window.isJokiOrder || (window.orderType === "Joki Kontak");

  // Pastikan durasi di teks sesuai paket (jika masih placeholder lama)
  if (isJoki && window.jokiDurasi) {
    catatan = catatan.replace(/\[\s*\d+\s*(jam|hari)\s*\]/gi, "[" + window.jokiDurasi + "]");
    catatan = catatan.replace(/\[\s*permanen\s*\]/gi, "[" + window.jokiDurasi + "]");
    if (!/\[.*?\]/.test(catatan)) {
      // sisipkan setelah baris pertama jika belum ada
      const lines = catatan.split("\n");
      if (lines.length >= 1) {
        lines.splice(1, 0, "", "[" + window.jokiDurasi + "]");
        catatan = lines.join("\n");
      }
    }
  }

  // Ambil nama & WA dari teks joki (customer isi di format)
  function parseNamaFromTeks(t) {
    const m = String(t).match(/SV\s*;\s*(.+)/i);
    if (m) {
      const n = m[1].trim().split("\n")[0].trim();
      if (n && !/^NAMA\s*STORE$/i.test(n)) return n;
    }
    return "";
  }
  function parseWaFromTeks(t) {
    const m = String(t).match(/Wa\.me\/([0-9]+)/i) || String(t).match(/wa\.me\/([0-9]+)/i);
    if (m && m[1] && m[1].length >= 9) return m[1];
    const m2 = String(t).match(/(?:\+?62|0)8[0-9]{8,13}/);
    if (m2) return m2[0].replace(/\D/g, "");
    return "";
  }

  let nama = document.getElementById("nama")?.value?.trim() || "";
  let wa = document.getElementById("wa")?.value?.trim() || "";

  if (isJoki) {
    // Joki: hanya teks wajib, nama/WA diambil dari format teks
    if (!catatan.trim() || /NAMA\s*STORE/i.test(catatan)) {
      // masih boleh lanjut, tapi warning jika placeholder belum diganti
      if (!catatan.trim()) {
        showSiteModal("Isi teks joki terlebih dahulu.", "warning");
        return;
      }
    }
    const parsedNama = parseNamaFromTeks(catatan);
    const parsedWa = parseWaFromTeks(catatan);
    if (parsedNama) nama = parsedNama;
    if (parsedWa) wa = parsedWa;
    if (!nama) nama = "Customer";
    if (!wa) wa = "-";
  } else {
    // Produk digital / non-joki: tetap wajib nama & WA jika field tampil
    if (!nama || !wa) {
      showSiteModal("Lengkapi field wajib: Nama (Store/JB) dan Nomor WhatsApp.", "warning");
      return;
    }
    if (wa.replace(/\D/g, "").length < 10) {
      showSiteModal("Nomor WhatsApp tidak valid. Masukkan minimal 10 digit.", "warning");
      return;
    }
    if (catatan.includes("NAMA STORE")) {
      catatan = catatan.replace(/NAMA STORE/g, nama);
    }
    if (catatan.includes("628…") || catatan.includes("628...")) {
      let nomor = wa.replace(/^0/, "62").replace(/\D/g, "");
      if (nomor.length < 10) nomor = "628xxxxxxxxxx";
      catatan = catatan.replace(/628…|628\.\.\./g, nomor);
    }
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

  order.createdAt = Date.now();
  order.finalAmount = Number(String(total).replace(/[^\d]/g, "")) || 0;
  if (window.jokiDurasi) order.durasi = window.jokiDurasi;

  if (window.VoxyyOrders && typeof window.VoxyyOrders.addOrder === "function") {
    await window.VoxyyOrders.addOrder(order);
  } else {
    let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
    orders.unshift(order);
    localStorage.setItem("voxyy_orders", JSON.stringify(orders));
  }
  if (kode) localStorage.setItem("voxyy_saved_kode", kode);

  const namaEl = document.getElementById("nama");
  const waEl = document.getElementById("wa");
  if (namaEl) namaEl.value = "";
  if (waEl) waEl.value = "";

  window.location.href = `pembayaran.html?kode=${encodeURIComponent(kode)}&total=${encodeURIComponent(total)}`;
}

// ========== LAPORAN ==========
async function kirimLaporan() {
  const noPesanan = document.getElementById("noPesanan")?.value?.trim() || "-";
  const judul = document.getElementById("judulLaporan")?.value?.trim() || "-";
  const deskripsi = document.getElementById("deskripsiLaporan")?.value?.trim() || "-";
  const fileInput = document.getElementById("fotoLaporan");

  if (!judul || judul === "-" || !deskripsi || deskripsi === "-") {
    showSiteModal("Isi judul dan deskripsi laporan terlebih dahulu.", "warning");
    return;
  }

  const files = fileInput ? Array.from(fileInput.files).slice(0, 3) : [];
  const photos = [];
  for (const f of files) {
    try {
      if (window.VoxyyOrders && typeof window.VoxyyOrders.compressImageFile === "function") {
        const d = await window.VoxyyOrders.compressImageFile(f, 900, 0.72);
        if (d) photos.push(d);
      } else {
        const d = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(f);
        });
        if (d) photos.push(d);
      }
    } catch (e) {
      console.warn("Gagal baca foto laporan:", e);
    }
  }

  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.addLaporan === "function") {
      await window.VoxyyOrders.addLaporan({
        noPesanan,
        judul,
        deskripsi,
        photos,
        waktu: new Date().toLocaleString("id-ID"),
        createdAt: Date.now()
      });
    }
  } catch (e) {
    console.warn("Gagal simpan laporan:", e);
  }

  showSiteModal("Laporan berhasil dikirim ke panel admin!", "success");
  // reset form
  try {
    const a = document.getElementById("noPesanan"); if (a) a.value = "";
    const b = document.getElementById("judulLaporan"); if (b) b.value = "";
    const c = document.getElementById("deskripsiLaporan"); if (c) c.value = "";
    const d = document.getElementById("fotoLaporan"); if (d) d.value = "";
  } catch (e) {}
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
