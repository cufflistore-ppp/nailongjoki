/**
 * Nailong Admin Panel
 * Hanya email: raffliraffli649@gmail.com
 * Tanpa tambah pesanan manual. Semua data dari customer + laporan/jaspost/bukti.
 */
const ADMIN_EMAIL = "raffliraffli649@gmail.com";

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

window._adminPhotos = window._adminPhotos || {};

function showToast(msg) {
  const el = document.getElementById("toastAdmin");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function switchTab(name) {
  document.querySelectorAll(".admin-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  document.querySelectorAll(".admin-panel").forEach((p) => {
    p.classList.toggle("active", p.id === "panel-" + name);
  });
  // re-trigger animation
  const panel = document.getElementById("panel-" + name);
  if (panel) {
    panel.style.animation = "none";
    void panel.offsetWidth;
    panel.style.animation = "";
  }
}

function setBadge(id, n) {
  const el = document.getElementById(id);
  if (!el) return;
  if (n > 0) {
    el.style.display = "inline-block";
    el.textContent = n > 99 ? "99+" : String(n);
  } else {
    el.style.display = "none";
  }
}

function openLightbox(src) {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  if (!box || !img) return;
  img.src = src;
  box.classList.add("show");
}
function closeLightbox(e) {
  if (e && e.target && e.target.tagName === "IMG") return;
  document.getElementById("lightbox")?.classList.remove("show");
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text || "");
    if (btn) {
      const old = btn.innerHTML;
      btn.classList.add("copied");
      btn.innerHTML = '<img src="centang.gif" alt="✓" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"> Disalin';
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = old;
      }, 1600);
    }
    showToast("Teks berhasil disalin");
  } catch (e) {
    showToast("Gagal salin teks");
  }
}

function downloadDataUrl(dataUrl, filename) {
  try {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename || "foto.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Mengunduh foto...");
  } catch (e) {
    showToast("Gagal unduh foto");
  }
}

/* ========== AUTH GATE ========== */
function isAdminUser(user) {
  if (!user || !user.email) return false;
  return String(user.email).trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function loginAdmin() {
  if (window.VoxyyAuth && typeof window.VoxyyAuth.loginGoogle === "function") {
    await window.VoxyyAuth.loginGoogle();
  } else if (typeof firebase !== "undefined") {
    try {
      if (window.VoxyyOrders) window.VoxyyOrders.initFirebase();
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      console.error(e);
      showToast("Gagal login");
    }
  }
}

function showLock(msg) {
  document.getElementById("adminLock").style.display = "flex";
  document.getElementById("adminApp").style.display = "none";
  if (msg) {
    const p = document.querySelector("#adminLock p");
    if (p) p.innerHTML = msg;
  }
}

function showApp() {
  document.getElementById("adminLock").style.display = "none";
  document.getElementById("adminApp").style.display = "block";
}

function gateAdmin() {
  const tryUser = () => {
    let user = null;
    try {
      if (typeof firebase !== "undefined" && firebase.auth) {
        user = firebase.auth().currentUser;
      }
    } catch (e) {}
    if (window.VoxyyAuth && typeof window.VoxyyAuth.currentUser === "function") {
      user = window.VoxyyAuth.currentUser() || user;
    }
    return user;
  };

  const apply = (user) => {
    if (!user) {
      showLock("Panel admin hanya tersedia untuk akun admin resmi.<br>Login dengan Google terlebih dahulu.");
      return;
    }
    if (!isAdminUser(user)) {
      showLock(
        "Akun <b style='color:#FFC107'>" +
          escapeHtml(user.email || "-") +
          "</b> tidak memiliki akses admin.<br>Hanya admin resmi yang bisa membuka panel ini."
      );
      return;
    }
    showApp();
    startAdminData();
  };

  // wait auth
  if (typeof firebase !== "undefined" && firebase.auth) {
    if (window.VoxyyOrders) window.VoxyyOrders.initFirebase();
    firebase.auth().onAuthStateChanged((user) => apply(user));
  } else {
    setTimeout(() => apply(tryUser()), 800);
  }
}

/* ========== ORDERS ========== */
async function loadOrders() {
  const list = document.getElementById("listOrders");
  if (!list) return;

  let orders = [];
  try {
    if (window.VoxyyOrders) orders = await window.VoxyyOrders.getOrders();
    else orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  } catch (e) {
    orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
  }

  // filter out pure jaspost-only if needed — still show all customer orders
  const customerOrders = orders.filter((o) => !o._adminOnly);
  setBadge("cntPesanan", customerOrders.length);

  if (customerOrders.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fa-solid fa-inbox"></i>Belum ada pesanan dari customer</div>';
    renderTeksJoki([]);
    return;
  }

  list.innerHTML = customerOrders
    .map((o, idx) => {
      let borderClass = "";
      if (o.status === "Sudah Bayar" || o.status === "Sukses") borderClass = "paid";
      else if (o.status === "Proses" || o.status === "Menunggu Verifikasi") borderClass = "proses";

      const st = o.status || "Belum Bayar";
      const bg =
        st === "Sukses" || st === "Sudah Bayar"
          ? "#004400"
          : st === "Proses" || st === "Menunggu Verifikasi"
          ? "#443300"
          : "#440000";
      const kodeSafe = String(o.kode || "").replace(/'/g, "\\'");
      const delay = Math.min(idx * 0.04, 0.4);

      return `
    <div class="order-card ${borderClass}" data-kode="${escapeHtmlAttr(o.kode || "")}" style="animation-delay:${delay}s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#FFC107;">${escapeHtml(o.kode || "-")}</strong>
        <span style="font-size:12px;padding:3px 8px;border-radius:6px;background:${bg};">
          ${escapeHtml(st)}
        </span>
      </div>
      <div class="meta-line">
        👤 <b>${escapeHtml(o.nama || "-")}</b><br>
        📱 ${escapeHtml(o.wa || "-")}<br>
        💰 ${escapeHtml(o.total || "-")}<br>
        📦 ${escapeHtml(o.paket || "Joki Kontak")}<br>
        📝 <small style="color:#aaa;">${escapeHtml((o.catatan || "-").substring(0, 80))}${(o.catatan || "").length > 80 ? "..." : ""}</small><br>
        ⏰ <small style="color:#888;">${escapeHtml(o.waktu || "-")}</small>
      </div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
        <button class="status-btn btn-proses" onclick="ubahStatusByKode('${kodeSafe}', 'Proses')">Proses</button>
        <button class="status-btn btn-paid" onclick="ubahStatusByKode('${kodeSafe}', 'Sukses')">Sukses</button>
        <button class="status-btn btn-unpaid" onclick="ubahStatusByKode('${kodeSafe}', 'Belum Bayar')">Belum Bayar</button>
        <button class="status-btn btn-delete" onclick="hapusOrderByKode('${kodeSafe}')">Hapus</button>
      </div>
    </div>`;
    })
    .join("");

  renderTeksJoki(customerOrders);
}

async function ubahStatusByKode(kode, status) {
  if (!kode) return;
  const card = document.querySelector('.order-card[data-kode="' + CSS.escape(kode) + '"]');
  if (card) card.classList.add("updating");

  const st = String(status || "");
  const isSukses = /sukses|selesai/i.test(st);

  try {
    if (window.VoxyyOrders) {
      if (isSukses && typeof window.VoxyyOrders.deleteOrderByKode === "function") {
        await window.VoxyyOrders.deleteOrderByKode(kode);
      } else {
        await window.VoxyyOrders.updateOrderByKode(kode, { status });
      }
    } else {
      let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
      const idx = orders.findIndex(
        (o) => String(o.kode || "").toUpperCase() === String(kode).toUpperCase()
      );
      if (idx >= 0) {
        if (isSukses) orders.splice(idx, 1);
        else orders[idx].status = status;
        localStorage.setItem("voxyy_orders", JSON.stringify(orders));
      }
    }
    showToast("Status diubah → " + status);
  } catch (e) {
    console.error(e);
    showToast("Gagal ubah status");
  }
  await loadOrders();
}

async function hapusOrderByKode(kode) {
  if (!kode) return;
  if (!confirm("Hapus pesanan " + kode + " dari antrian?")) return;

  const card = document.querySelector('.order-card[data-kode="' + CSS.escape(kode) + '"]');
  if (card) {
    card.classList.add("removing");
    await new Promise((r) => setTimeout(r, 280));
  }

  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.deleteOrderByKode === "function") {
      await window.VoxyyOrders.deleteOrderByKode(kode);
    } else {
      let orders = JSON.parse(localStorage.getItem("voxyy_orders") || "[]");
      orders = orders.filter(
        (o) => String(o.kode || "").toUpperCase() !== String(kode).toUpperCase()
      );
      localStorage.setItem("voxyy_orders", JSON.stringify(orders));
    }
    showToast("Pesanan dihapus");
  } catch (e) {
    showToast("Gagal hapus");
  }
  await loadOrders();
}

/* ========== TEKS JOKI (dari catatan order non-jaspost) ========== */
function renderTeksJoki(orders) {
  const list = document.getElementById("listTeksjoki");
  if (!list) return;

  const joki = (orders || []).filter((o) => {
    if (o.isJaspost) return false;
    const cat = String(o.catatan || "").trim();
    if (!cat || cat === "-" || cat.length < 5) return false;
    // skip pure digital short notes
    if (/bayar QRIS dulu/i.test(cat) && cat.length < 80) return false;
    return true;
  });

  setBadge("cntTeksjoki", joki.length);

  if (joki.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fa-solid fa-comment-slash"></i>Belum ada teks joki / format push</div>';
    return;
  }

  list.innerHTML = joki
    .map((o, idx) => {
      const teks = o.catatan || "";
      const id = "teksjoki-" + idx;
      return `
    <div class="admin-card" style="animation-delay:${Math.min(idx * 0.04, 0.4)}s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#FFC107;">${escapeHtml(o.kode || "-")}</strong>
        <small style="color:#888;">${escapeHtml(o.waktu || "")}</small>
      </div>
      <div class="meta-line">👤 <b>${escapeHtml(o.nama || "-")}</b> · 📱 ${escapeHtml(o.wa || "-")} · 📦 ${escapeHtml(o.paket || "Joki")}</div>
      <div class="copy-box" id="${id}">${escapeHtml(teks)}</div>
      <button class="btn-copy" type="button" onclick="copyText(document.getElementById('${id}').innerText, this)">
        <i class="fa-regular fa-copy"></i> Salin Teks
      </button>
    </div>`;
    })
    .join("");
}

/* ========== BUKTI TF ========== */
function renderBukti(items) {
  const list = document.getElementById("listBukti");
  if (!list) return;
  const arr = items || [];
  setBadge("cntBukti", arr.length);

  if (arr.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fa-solid fa-image"></i>Belum ada foto bukti transfer</div>';
    return;
  }

  list.innerHTML = arr
    .map((b, idx) => {
      const photos = Array.isArray(b.photos) ? b.photos : b.photo ? [b.photo] : [];
      const photoHtml =
        photos.length === 0
          ? "<small style='color:#888;'>Tidak ada foto</small>"
          : `<div class="photo-grid">${photos
              .map((src, i) => {
                const pid = "bukti_" + idx + "_" + i;
                window._adminPhotos[pid] = src;
                return `
          <div class="photo-item">
            <img src="${src}" alt="Bukti ${i + 1}" onclick="openLightbox(window._adminPhotos['${pid}'])" loading="lazy">
            <div class="photo-actions">
              <button class="btn-dl" type="button" onclick="downloadDataUrl(window._adminPhotos['${pid}'], 'bukti-${escapeHtmlAttr(String(b.kode || idx))}-${i + 1}.jpg')">
                <i class="fa-solid fa-download"></i>
              </button>
            </div>
          </div>`;
              })
              .join("")}</div>`;

      return `
    <div class="admin-card" style="animation-delay:${Math.min(idx * 0.04, 0.4)}s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#FFC107;">${escapeHtml(b.kode || "-")}</strong>
        <small style="color:#888;">${escapeHtml(b.waktu || "")}</small>
      </div>
      <div class="meta-line">
        👤 <b>${escapeHtml(b.nama || "-")}</b><br>
        📱 ${escapeHtml(b.wa || "-")}<br>
        💰 ${escapeHtml(b.total || "-")}<br>
        📦 ${escapeHtml(b.paket || "-")}
      </div>
      ${photoHtml}
      <div style="margin-top:10px;">
        <button class="status-btn btn-delete" type="button" onclick="hapusBukti('${escapeHtmlAttr(b.id || b.kode || "")}')">Hapus</button>
      </div>
    </div>`;
    })
    .join("");
}

async function hapusBukti(id) {
  if (!id || !confirm("Hapus bukti TF ini?")) return;
  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.deleteBukti === "function") {
      await window.VoxyyOrders.deleteBukti(id);
    }
    showToast("Bukti dihapus");
  } catch (e) {
    showToast("Gagal hapus");
  }
}

/* ========== JASA POST ========== */
function renderJaspost(items) {
  const list = document.getElementById("listJaspost");
  if (!list) return;
  const arr = items || [];
  setBadge("cntJaspost", arr.length);

  if (arr.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fa-solid fa-share-nodes"></i>Belum ada data jasa post</div>';
    return;
  }

  list.innerHTML = arr
    .map((j, idx) => {
      const teks = j.teks || j.catatan || "";
      const id = "jaspost-teks-" + idx;
      const photos = Array.isArray(j.photos) ? j.photos : j.photo ? [j.photo] : [];
      const photoHtml =
        photos.length === 0
          ? ""
          : `<div class="photo-grid">${photos
              .map((src, i) => {
                const pid = "jp_" + idx + "_" + i;
                window._adminPhotos[pid] = src;
                return `
          <div class="photo-item">
            <img src="${src}" alt="Jaspost ${i + 1}" onclick="openLightbox(window._adminPhotos['${pid}'])" loading="lazy">
            <div class="photo-actions">
              <button class="btn-dl" type="button" onclick="downloadDataUrl(window._adminPhotos['${pid}'], 'jaspost-${escapeHtmlAttr(String(j.kode || idx))}-${i + 1}.jpg')">
                <i class="fa-solid fa-download"></i> Unduh
              </button>
            </div>
          </div>`;
              })
              .join("")}</div>`;

      return `
    <div class="admin-card" style="animation-delay:${Math.min(idx * 0.04, 0.4)}s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#FFC107;">${escapeHtml(j.kode || "-")}</strong>
        <small style="color:#888;">${escapeHtml(j.waktu || "")}</small>
      </div>
      <div class="meta-line">
        👤 <b>${escapeHtml(j.nama || "-")}</b> · 📱 ${escapeHtml(j.wa || j.nomer || "-")}<br>
        📦 ${escapeHtml(j.item || j.paket || "Jasa Post")}
      </div>
      <div class="copy-box" id="${id}">${escapeHtml(teks)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <button class="btn-copy" type="button" onclick="copyText(document.getElementById('${id}').innerText, this)">
          <i class="fa-regular fa-copy"></i> Salin Teks
        </button>
        <button class="status-btn btn-delete" type="button" onclick="hapusJaspost('${escapeHtmlAttr(j.id || j.kode || "")}')">Hapus</button>
      </div>
      ${photoHtml}
    </div>`;
    })
    .join("");
}

async function hapusJaspost(id) {
  if (!id || !confirm("Hapus data jasa post ini?")) return;
  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.deleteJaspost === "function") {
      await window.VoxyyOrders.deleteJaspost(id);
    }
    showToast("Jasa post dihapus");
  } catch (e) {
    showToast("Gagal hapus");
  }
}

/* ========== LAPORAN ========== */
function renderLaporan(items) {
  const list = document.getElementById("listLaporan");
  if (!list) return;
  const arr = items || [];
  setBadge("cntLaporan", arr.length);

  if (arr.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fa-solid fa-flag"></i>Belum ada laporan</div>';
    return;
  }

  list.innerHTML = arr
    .map((l, idx) => {
      const teks = `No: ${l.noPesanan || "-"}\nJudul: ${l.judul || "-"}\n\n${l.deskripsi || "-"}`;
      const id = "laporan-teks-" + idx;
      const photos = Array.isArray(l.photos) ? l.photos : [];
      const photoHtml =
        photos.length === 0
          ? ""
          : `<div class="photo-grid">${photos
              .map((src, i) => {
                const pid = "lp_" + idx + "_" + i;
                window._adminPhotos[pid] = src;
                return `
          <div class="photo-item">
            <img src="${src}" alt="Laporan ${i + 1}" onclick="openLightbox(window._adminPhotos['${pid}'])" loading="lazy">
            <div class="photo-actions">
              <button class="btn-dl" type="button" onclick="downloadDataUrl(window._adminPhotos['${pid}'], 'laporan-${escapeHtmlAttr(String(l.noPesanan || idx))}-${i + 1}.jpg')">
                <i class="fa-solid fa-download"></i>
              </button>
            </div>
          </div>`;
              })
              .join("")}</div>`;

      return `
    <div class="admin-card" style="animation-delay:${Math.min(idx * 0.04, 0.4)}s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong style="color:#FFC107;">${escapeHtml(l.judul || "Laporan")}</strong>
        <small style="color:#888;">${escapeHtml(l.waktu || "")}</small>
      </div>
      <div class="meta-line">🆔 No Pesanan: <b>${escapeHtml(l.noPesanan || "-")}</b></div>
      <div class="copy-box" id="${id}">${escapeHtml(teks)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <button class="btn-copy" type="button" onclick="copyText(document.getElementById('${id}').innerText, this)">
          <i class="fa-regular fa-copy"></i> Salin Teks
        </button>
        <button class="status-btn btn-delete" type="button" onclick="hapusLaporan('${escapeHtmlAttr(l.id || "")}')">Hapus</button>
      </div>
      ${photoHtml}
    </div>`;
    })
    .join("");
}

async function hapusLaporan(id) {
  if (!id || !confirm("Hapus laporan ini?")) return;
  try {
    if (window.VoxyyOrders && typeof window.VoxyyOrders.deleteLaporan === "function") {
      await window.VoxyyOrders.deleteLaporan(id);
    }
    showToast("Laporan dihapus");
  } catch (e) {
    showToast("Gagal hapus");
  }
}

/* ========== START LISTENERS ========== */
let _adminStarted = false;
function startAdminData() {
  if (_adminStarted) return;
  _adminStarted = true;

  loadOrders();
  if (window.VoxyyOrders && typeof window.VoxyyOrders.onOrdersChange === "function") {
    window.VoxyyOrders.onOrdersChange(() => loadOrders());
  } else {
    setInterval(loadOrders, 30000);
  }

  if (window.VoxyyOrders) {
    if (typeof window.VoxyyOrders.onBuktiChange === "function") {
      window.VoxyyOrders.onBuktiChange(renderBukti);
    }
    if (typeof window.VoxyyOrders.onJaspostChange === "function") {
      window.VoxyyOrders.onJaspostChange(renderJaspost);
    }
    if (typeof window.VoxyyOrders.onLaporanChange === "function") {
      window.VoxyyOrders.onLaporanChange(renderLaporan);
    }
    // initial fetch
    if (typeof window.VoxyyOrders.getBukti === "function") {
      window.VoxyyOrders.getBukti().then(renderBukti);
    }
    if (typeof window.VoxyyOrders.getJaspost === "function") {
      window.VoxyyOrders.getJaspost().then(renderJaspost);
    }
    if (typeof window.VoxyyOrders.getLaporan === "function") {
      window.VoxyyOrders.getLaporan().then(renderLaporan);
    }
  } else {
    renderBukti([]);
    renderJaspost([]);
    renderLaporan([]);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  gateAdmin();
});

// expose
window.switchTab = switchTab;
window.ubahStatusByKode = ubahStatusByKode;
window.hapusOrderByKode = hapusOrderByKode;
window.copyText = copyText;
window.downloadDataUrl = downloadDataUrl;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.loginAdmin = loginAdmin;
window.hapusBukti = hapusBukti;
window.hapusJaspost = hapusJaspost;
window.hapusLaporan = hapusLaporan;
