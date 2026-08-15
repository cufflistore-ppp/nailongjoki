function loadOrders() {
  const list = document.getElementById("listOrders");
  if (!list) return;

  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");

  if (orders.length === 0) {
    list.innerHTML = "<p style='color:#aaa;text-align:center;padding:20px;'>Belum ada pesanan</p>";
    return;
  }

  list.innerHTML = orders.map((o, i) => {
    let borderClass = "";
    if (o.status === "Sudah Bayar" || o.status === "Sukses") borderClass = "paid";
    else if (o.status === "Proses") borderClass = "proses";

    return `
    <div class="order-card ${borderClass}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#ffd700;">${o.kode}</strong>
        <span style="font-size:12px;padding:3px 8px;border-radius:6px;background:${
          o.status === "Sukses" || o.status === "Sudah Bayar" ? "#004400" :
          o.status === "Proses" ? "#443300" : "#440000"
        };">
          ${o.status}
        </span>
      </div>
      <div style="font-size:13px;line-height:1.6;">
        👤 <b>${o.nama}</b><br>
        📱 ${o.wa}<br>
        💰 ${o.total}<br>
        📦 ${o.paket || "Joki Kontak"}<br>
        📝 <small style="color:#aaa;">${(o.catatan || "-").substring(0, 60)}${(o.catatan || "").length > 60 ? "..." : ""}</small><br>
        ⏰ <small style="color:#888;">${o.waktu || "-"}</small>
      </div>
      <div style="margin-top:10px;">
        <button class="status-btn btn-proses" onclick="ubahStatus(${i}, 'Proses')">Proses</button>
        <button class="status-btn btn-paid" onclick="ubahStatus(${i}, 'Sukses')">Sukses</button>
        <button class="status-btn btn-unpaid" onclick="ubahStatus(${i}, 'Belum Bayar')">Belum Bayar</button>
        <button class="status-btn btn-delete" onclick="hapusOrder(${i})">Hapus</button>
      </div>
    </div>
  `}).join("");
}

function tambahOrderAdmin() {
  const kode = document.getElementById("admKode").value.trim() || ( "NJ-2026-" + Math.floor(1000 + Math.random() * 9000) + String(Date.now()).slice(-3) );
  const nama = document.getElementById("admNama").value.trim() || "Manual";
  const wa = document.getElementById("admWA").value.trim() || "-";
  const total = document.getElementById("admTotal").value.trim() || "Rp 0";
  const status = document.getElementById("admStatus").value;

  const order = {
    kode,
    nama,
    wa,
    total,
    status,
    catatan: "Ditambahkan manual oleh admin",
    paket: "Manual",
    waktu: new Date().toLocaleString("id-ID")
  };

  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  orders.unshift(order);
  localStorage.setItem("nailong_orders", JSON.stringify(orders));

  if (typeof kirimOrderKeTelegram === "function") {
    kirimOrderKeTelegram(order);
  }

  alert("✅ Pesanan berhasil ditambahkan & dikirim ke Telegram!");
  loadOrders();

  document.getElementById("admKode").value = "";
  document.getElementById("admNama").value = "";
  document.getElementById("admWA").value = "";
  document.getElementById("admTotal").value = "";
}

async function ubahStatus(index, status) {
  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  if (!orders[index]) return;

  orders[index].status = status;
  localStorage.setItem("nailong_orders", JSON.stringify(orders));

  // Kirim notifikasi ke Telegram
  if (typeof kirimStatusUpdate === "function") {
    await kirimStatusUpdate(orders[index].kode, status, orders[index].nama);
  }

  loadOrders();
}

function hapusOrder(index) {
  if (!confirm("Yakin hapus pesanan ini?")) return;
  let orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  orders.splice(index, 1);
  localStorage.setItem("nailong_orders", JSON.stringify(orders));
  loadOrders();
}

document.addEventListener("DOMContentLoaded", loadOrders);
