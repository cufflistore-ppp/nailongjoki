// ========== TOP NOTIF (hanya muncul jika ada order real) ==========
function formatRupiah(n) {
  if (typeof n === "string" && n.includes("Rp")) return n;
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function getRecentOrdersForNotif() {
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  return orders.slice(0, 5); // ambil 5 order terbaru
}

function generateNotifFromOrder(order) {
  if (!order) return "";
  const shortName = (order.nama || "A").substring(0, 1) + "****";
  const price = order.total || "Rp 5.000";
  const svc = order.paket || "Joki Kontak";
  // hitung menit lalu dari waktu order
  let timeText = "baru saja";
  try {
    // waktu disimpan sebagai string lokal, kita pakai "baru saja" saja
    timeText = "baru saja";
  } catch(e) {}
  return `<div class="notif-item">
    <span class="notif-icon">🛒</span>
    <span class="notif-text"><b>Beli</b> · ${shortName}. · <b>${price}</b> · ${svc} · <span class="time">${timeText}</span></span>
  </div>`;
}

function updateTopNotif() {
  const el = document.getElementById("topNotif");
  if (!el) return;

  const recent = getRecentOrdersForNotif();
  if (recent.length === 0) {
    // Tidak ada order → sembunyikan notif
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
  const nama = document.getElementById("nama")?.value?.trim() || "Anonim";
  const wa = document.getElementById("wa")?.value?.trim() || "-";
  let catatan = document.getElementById("catatan")?.value || "";

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
  const kode = `RJ-2026-${rand}${timePart}`;

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

  // Enrich dengan admin fee + expiresAt (jika qris-helper sudah load)
  if (typeof window.QRISHelper !== "undefined" && window.QRISHelper.createOrderWithExpiry) {
    order = window.QRISHelper.createOrderWithExpiry(order);
  } else {
    // Fallback manual
    const adminFee = 1000;
    const subtotal = Number(String(total).replace(/[^\d]/g, "")) || 0;
    order.adminFee = adminFee;
    order.finalAmount = subtotal + adminFee;
    order.createdAt = Date.now();
    order.expiresAt = Date.now() + (15 * 60 * 1000);
    order.qrisExpired = false;
  }

  // Simpan ke localStorage
  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  orders.unshift(order);
  localStorage.setItem("nailong_orders", JSON.stringify(orders));

  // Kirim ke Telegram
  if (typeof kirimOrderKeTelegram === "function") {
    await kirimOrderKeTelegram(order);
  }

  // Kirim foto TF
  const fileInput = document.getElementById("buktiTF");
  if (fileInput && fileInput.files[0] && typeof kirimFotoTelegram === "function") {
    await kirimFotoTelegram(
      fileInput.files[0],
      `Bukti TF - ${kode}\nNama: ${nama}\nTotal: ${total}`
    );
  }

  // Reset form fields
  document.getElementById("nama").value = "";
  document.getElementById("wa").value = "";
  if (fileInput) fileInput.value = "";

  // Redirect ke halaman pembayaran QRIS
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

  alert("✅ Laporan berhasil dikirim ke admin via Telegram!");
}
