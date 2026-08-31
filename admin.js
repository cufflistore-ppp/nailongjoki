async function loadOrders() {
  const list = document.getElementById("listOrders");
  if (!list) return;

  const prevScroll = list.scrollTop;
  const wasEmpty = !list.dataset.loaded;

  if (wasEmpty) {
    list.innerHTML = "<p style='color:#aaa;text-align:center;padding:20px;'>Memuat pesanan global...</p>";
  }

  let orders = [];
  try {
    if (window.VoxyyOrders) {
      orders = await window.VoxyyOrders.getOrders();
    } else {
      orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
    }
  } catch (e) {
    orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  }

  list.dataset.loaded = "1";

  const configured = window.VoxyyOrders && window.VoxyyOrders.isGlobalConfigured && window.VoxyyOrders.isGlobalConfigured();
  const modeHint = configured
    ? '<p style="color:#66bb6a;font-size:12px;margin-bottom:10px;">🌐 Admin Global (Realtime) — ubah status, semua HP ikut berubah otomatis</p>'
    : '<p style="color:#ffb74d;font-size:12px;margin-bottom:10px;">⚙️ Isi FIREBASE_CONFIG di global-orders.js supaya admin & antrian sinkron antar HP</p>';

  if (orders.length === 0) {
    list.innerHTML =
      modeHint +
      "<p style='color:#aaa;text-align:center;padding:20px;'>Belum ada pesanan</p>";
    return;
  }

  list.innerHTML =
    modeHint +
    orders
      .map((o, i) => {
        let borderClass = "";
        if (o.status === "Sudah Bayar" || o.status === "Sukses") borderClass = "paid";
        else if (o.status === "Proses" || o.status === "Menunggu Verifikasi")
          borderClass = "proses";

        const st = o.status || "Belum Bayar";
        const bg =
          st === "Sukses" || st === "Sudah Bayar"
            ? "#004400"
            : st === "Proses" || st === "Menunggu Verifikasi"
            ? "#443300"
            : "#440000";

        const kodeSafe = String(o.kode || "").replace(/'/g, "\\'");

        return `
    <div class="order-card ${borderClass}" data-kode="${escapeHtmlAttr(o.kode || "")}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#FFC107;">${escapeHtml(o.kode || "-")}</strong>
        <span style="font-size:12px;padding:3px 8px;border-radius:6px;background:${bg};">
          ${escapeHtml(st)}
        </span>
      </div>
      <div style="font-size:13px;line-height:1.6;">
        👤 <b>${escapeHtml(o.nama || "-")}</b><br>
        📱 ${escapeHtml(o.wa || "-")}<br>
        💰 ${escapeHtml(o.total || "-")}<br>
        📦 ${escapeHtml(o.paket || "Joki Kontak")}<br>
        📝 <small style="color:#aaa;">${escapeHtml((o.catatan || "-").substring(0, 60))}${(o.catatan || "").length > 60 ? "..." : ""}</small><br>
        ⏰ <small style="color:#888;">${escapeHtml(o.waktu || "-")}</small>
      </div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
        <button class="status-btn btn-proses" onclick="ubahStatusByKode('${kodeSafe}', 'Proses')">Proses</button>
        <button class="status-btn btn-paid" onclick="ubahStatusByKode('${kodeSafe}', 'Sukses')">Sukses</button>
        <button class="status-btn btn-unpaid" onclick="ubahStatusByKode('${kodeSafe}', 'Belum Bayar')">Belum Bayar</button>
        <button class="status-btn btn-delete" onclick="hapusOrderByKode('${kodeSafe}')">Hapus</button>
      </div>
    </div>
  `;
      })
      .join("");

  try {
    list.scrollTop = prevScroll;
  } catch (e) {}
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;");
}

async function tambahOrderAdmin() {
  const kode =
    document.getElementById("admKode").value.trim() ||
    "NJ-2026-" +
      Math.floor(1000 + Math.random() * 9000) +
      String(Date.now()).slice(-3);
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
    waktu: new Date().toLocaleString("id-ID"),
    createdAt: Date.now()
  };

  if (window.VoxyyOrders) {
    await window.VoxyyOrders.addOrder(order);
  } else {
    let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
    orders.unshift(order);
    localStorage.setItem("voxyy_orders", JSON.stringify(orders));
  }

  if (typeof kirimOrderKeTelegram === "function") {
    try {
      await kirimOrderKeTelegram(order);
    } catch (e) {}
  }

  alert(
    "✅ Pesanan berhasil ditambahkan" +
      (typeof kirimOrderKeTelegram === "function"
        ? " & dikirim ke Telegram!"
        : " (global)!")
  );
  loadOrders();

  document.getElementById("admKode").value = "";
  document.getElementById("admNama").value = "";
  document.getElementById("admWA").value = "";
  document.getElementById("admTotal").value = "";
}

/** Ubah status by kode — sinkron ke antrian global semua HP.
 *  Status Sukses/Selesai → order dihapus dari antrian. */
async function ubahStatusByKode(kode, status) {
  if (!kode) return;

  const card = document.querySelector(
    '.order-card[data-kode="' + CSS.escape(kode) + '"]'
  );
  if (card) {
    card.style.opacity = "0.55";
    card.style.pointerEvents = "none";
  }

  const st = String(status || "");
  const isSukses = /sukses|selesai/i.test(st);
  let nama = "-";
  try {
    if (window.VoxyyOrders) {
      const orders = await window.VoxyyOrders.getOrders();
      const found = orders.find(
        (o) => String(o.kode || "").toUpperCase() === String(kode).toUpperCase()
      );
      if (found) nama = found.nama || "-";

      if (isSukses) {
        // Sukses = hapus dari antrian (global + lokal)
        if (typeof window.VoxyyOrders.deleteOrderByKode === "function") {
          await window.VoxyyOrders.deleteOrderByKode(kode);
        } else {
          await window.VoxyyOrders.updateOrderByKode(kode, { status: "Sukses" });
        }
      } else {
        await window.VoxyyOrders.updateOrderByKode(kode, { status });
      }
    } else {
      let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
      const idx = orders.findIndex(
        (o) => String(o.kode || "").toUpperCase() === String(kode).toUpperCase()
      );
      if (idx < 0) {
        alert("Order tidak ditemukan");
        return;
      }
      nama = orders[idx].nama || "-";
      if (isSukses) {
        orders.splice(idx, 1);
      } else {
        orders[idx].status = status;
      }
      localStorage.setItem("voxyy_orders", JSON.stringify(orders));
    }

    if (typeof kirimStatusUpdate === "function") {
      try {
        await kirimStatusUpdate(kode, status, nama);
      } catch (e) {}
    }
  } catch (e) {
    console.error(e);
    alert("Gagal ubah status. Coba lagi.");
  }

  await loadOrders();
}

/** Kompatibel tombol lama (kalau ada) */
async function ubahStatus(index, status) {
  let orders = [];
  if (window.VoxyyOrders) {
    orders = await window.VoxyyOrders.getOrders();
  } else {
    orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  }
  if (!orders[index]) return;
  await ubahStatusByKode(orders[index].kode, status);
}

async function hapusOrderByKode(kode) {
  if (!kode) return;
  if (!confirm("Hapus pesanan " + kode + " dari antrian global?")) return;

  try {
    if (window.VoxyyOrders) {
      if (typeof window.VoxyyOrders.deleteOrderByKode === "function") {
        const r = await window.VoxyyOrders.deleteOrderByKode(kode);
        if (r && r.error === "not_found") {
          alert("Order tidak ditemukan");
          return;
        }
      } else {
        const orders = await window.VoxyyOrders.getOrders();
        const idx = orders.findIndex(
          (o) => String(o.kode || "").toUpperCase() === String(kode).toUpperCase()
        );
        if (idx < 0) {
          alert("Order tidak ditemukan");
          return;
        }
        await window.VoxyyOrders.deleteOrderByIndex(idx);
      }
    } else {
      let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
      const idx = orders.findIndex(
        (o) => String(o.kode || "").toUpperCase() === String(kode).toUpperCase()
      );
      if (idx >= 0) {
        orders.splice(idx, 1);
        localStorage.setItem("voxyy_orders", JSON.stringify(orders));
      }
    }
  } catch (e) {
    console.error(e);
    alert("Gagal hapus. Coba lagi.");
  }

  await loadOrders();
}

async function hapusOrder(index) {
  let orders = [];
  if (window.VoxyyOrders) {
    orders = await window.VoxyyOrders.getOrders();
  } else {
    orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  }
  if (!orders[index]) return;
  await hapusOrderByKode(orders[index].kode);
}

document.addEventListener("DOMContentLoaded", function () {
  loadOrders();
  if (window.VoxyyOrders && typeof window.VoxyyOrders.onOrdersChange === "function") {
    window.VoxyyOrders.onOrdersChange(function () {
      loadOrders();
    });
  } else {
    setInterval(loadOrders, 60000);
  }
});
