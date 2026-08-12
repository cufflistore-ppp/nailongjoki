// ========== TOP NOTIF ==========
const names = ["Roxy", "Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hadi", "Indra", "Joko", "Kartika", "Lina", "Mira", "Nina", "Putri", "Rizki", "Sari"];
const layanan = ["Joki Kontak", "Joki 1 Hari", "Joki 2 Hari", "Video FS", "Prioritas"];
const hargaList = [5000, 10000, 15000, 7000, 20000, 30000];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatRupiah(n) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function generateNotif() {
  const name = randomItem(names);
  const shortName = name.substring(0, 1) + "****";
  const price = randomItem(hargaList);
  const svc = randomItem(layanan);
  const mins = Math.floor(Math.random() * 55) + 1;
  const timeText = mins + " menit lalu";

  return `<div class="notif-item">
    <span class="notif-icon">🛒</span>
    <span class="notif-text"><b>Beli</b> · ${shortName}. · <b>${formatRupiah(price)}</b> · ${svc} · <span class="time">${timeText}</span></span>
  </div>`;
}

function updateTopNotif() {
  const el = document.getElementById("topNotif");
  if (el) el.innerHTML = generateNotif();
}

updateTopNotif();
setInterval(updateTopNotif, 9000);

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
  const kode = "RJ-2026-" + Math.floor(1000 + Math.random() * 9000);

  const order = {
    kode,
    nama,
    wa,
    catatan,
    total,
    paket: "Joki Kontak",
    status: "Belum Bayar",
    waktu: new Date().toLocaleString("id-ID")
  };

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

  alert(`✅ Pesanan berhasil dibuat!\n\nKode Antrian: ${kode}\nNama: ${nama}\nTotal: ${total}\n\nData sudah dikirim ke admin via Telegram.`);

  // Reset
  document.getElementById("nama").value = "";
  document.getElementById("wa").value = "";
  if (fileInput) fileInput.value = "";
  // catatan tetap dibiarkan berisi template
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
