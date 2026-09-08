/**
 * Nailong - Antrian & Admin Global (Firebase)
 * authDomain = firebaseapp.com (stabil). Login Google pakai GIS (tanpa redirect).
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDiAAbFjwGp-1YpW9IE_6Hc68pilFsoBrU",
  authDomain: "nailongjoki.firebaseapp.com",
  databaseURL: "https://nailongjoki-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nailongjoki",
  storageBucket: "nailongjoki.firebasestorage.app",
  messagingSenderId: "1045237813",
  appId: "1:1045237813:web:f4fde9fd6992c10762a17c",
  measurementId: "G-TTT02Y562L"
};

/**
 * Web Client ID dari Google Cloud (bukan apiKey).
 *
 * WAJIB di OAuth client (Google Cloud → Credentials → edit client):
 * Authorized JavaScript origins → Add:
 *   https://DOMAIN-VERCEL-KAMU.vercel.app
 * Authorized redirect URIs → Add:
 *   https://jualbelisewarumah-3de0b.firebaseapp.com/__/auth/handler
 *   https://DOMAIN-VERCEL-KAMU.vercel.app
 *
 * Firebase Authentication → Settings → Authorized domains:
 *   tambah DOMAIN-VERCEL-KAMU.vercel.app
 */
const GOOGLE_WEB_CLIENT_ID = "728120154992-eji5q980k5dbn6ucqri7op334uv7cj01.apps.googleusercontent.com";

const LOCAL_ORDERS_KEY = "voxyy_orders";
let _db = null;
let _ready = false;
let _listeners = [];
let _lastOrders = [];

function isGlobalConfigured() {
  return !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey.length > 10 &&
    FIREBASE_CONFIG.databaseURL &&
    String(FIREBASE_CONFIG.databaseURL).includes("http")
  );
}

function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function setLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders || []));
  } catch (e) {}
}

function stripMeta(order) {
  if (!order || typeof order !== "object") return order;
  const copy = { ...order };
  delete copy._id;
  return copy;
}

function statusScore(st) {
  const s = String(st || "").toLowerCase();
  if (s.includes("sukses") || s.includes("selesai")) return 3;
  if (s.includes("proses") || s.includes("verifikasi")) return 2;
  if (s.includes("belum")) return 1;
  return 0;
}

function mergeOrders(a, b) {
  const map = new Map();
  const absorb = (o) => {
    if (!o || !o.kode) return;
    const k = String(o.kode).toUpperCase();
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...o });
      return;
    }
    const m = { ...prev, ...o };
    if (statusScore(prev.status) > statusScore(o.status)) m.status = prev.status;
    const ca = Number(prev.createdAt) || 0;
    const cb = Number(o.createdAt) || 0;
    m.createdAt = ca && cb ? Math.min(ca, cb) : ca || cb || Date.now();
    map.set(k, m);
  };
  (a || []).forEach(absorb);
  (b || []).forEach(absorb);
  return Array.from(map.values()).sort(
    (x, y) => (Number(y.createdAt) || 0) - (Number(x.createdAt) || 0)
  );
}

function kodeKey(kode) {
  return String(kode || "")
    .trim()
    .toUpperCase()
    .replace(/[.#$\[\]]/g, "_");
}

function initFirebase() {
  if (_ready) return true;
  if (!isGlobalConfigured()) return false;
  if (typeof firebase === "undefined") return false;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.database();
    _ready = true;
    _db.ref("orders").on(
      "value",
      (snap) => {
        const val = snap.val() || {};
        const list = Object.keys(val).map((k) => ({
          ...val[k],
          _id: k,
          kode: val[k].kode || k
        }));
        list.sort(
          (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
        );
        _lastOrders = list;
        setLocalOrders(list.map(stripMeta));
        _listeners.forEach((fn) => {
          try {
            fn(list);
          } catch (e) {}
        });
      },
      (err) => console.error("[Voxyy] DB:", err)
    );
    return true;
  } catch (e) {
    console.error("[Voxyy] init:", e);
    return false;
  }
}

function onOrdersChange(fn) {
  if (typeof fn === "function") _listeners.push(fn);
  initFirebase();
  if (_lastOrders.length) {
    try {
      fn(_lastOrders);
    } catch (e) {}
  }
}

async function getOrders() {
  const local = getLocalOrders();
  if (!isGlobalConfigured()) return local;
  initFirebase();
  if (!_db) return local;
  if (_lastOrders.length) return mergeOrders(_lastOrders, local);
  try {
    const snap = await _db.ref("orders").once("value");
    const val = snap.val() || {};
    const list = Object.keys(val).map((k) => ({
      ...val[k],
      _id: k,
      kode: val[k].kode || k
    }));
    list.sort(
      (a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0)
    );
    _lastOrders = list;
    const merged = mergeOrders(list, local);
    setLocalOrders(merged.map(stripMeta));
    return merged;
  } catch (e) {
    return local;
  }
}

async function addOrder(order) {
  if (!order || !order.kode) return { ok: false };
  if (!order.createdAt) order.createdAt = Date.now();
  const local = getLocalOrders();
  const t = String(order.kode).toUpperCase();
  const li = local.findIndex(
    (o) => String(o.kode || "").toUpperCase() === t
  );
  if (li >= 0) local[li] = { ...local[li], ...stripMeta(order) };
  else local.unshift(stripMeta(order));
  setLocalOrders(local);
  if (!isGlobalConfigured()) return { ok: true, mode: "local" };
  initFirebase();
  if (!_db) return { ok: true, mode: "local" };
  try {
    await _db.ref("orders/" + kodeKey(order.kode)).set(stripMeta(order));
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: false, mode: "local", error: String(e) };
  }
}

async function updateOrderByKode(kode, patch) {
  if (!kode) return { ok: false };
  const t = String(kode).trim().toUpperCase();
  let local = getLocalOrders();
  const li = local.findIndex(
    (o) => String(o.kode || "").toUpperCase() === t
  );
  if (li >= 0) {
    local[li] = { ...local[li], ...patch };
    setLocalOrders(local);
  }
  if (!isGlobalConfigured()) return { ok: li >= 0, mode: "local" };
  initFirebase();
  if (!_db) return { ok: li >= 0, mode: "local" };
  try {
    const ref = _db.ref("orders/" + kodeKey(kode));
    const snap = await ref.once("value");
    if (!snap.exists()) {
      const src =
        li >= 0
          ? { ...local[li], ...patch }
          : { kode, createdAt: Date.now(), ...patch };
      await ref.set(stripMeta(src));
    } else {
      await ref.update(patch);
    }
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: li >= 0, mode: "local", error: String(e) };
  }
}

async function updateOrderByIndex(index, patch) {
  const orders = await getOrders();
  if (!orders[index]) return { ok: false, error: "not_found" };
  return updateOrderByKode(orders[index].kode, patch);
}

async function deleteOrderByKode(kode) {
  if (!kode) return { ok: false };
  const t = String(kode).trim().toUpperCase();
  setLocalOrders(
    getLocalOrders().filter((o) => String(o.kode || "").toUpperCase() !== t)
  );
  if (!isGlobalConfigured()) return { ok: true, mode: "local" };
  initFirebase();
  if (!_db) return { ok: true, mode: "local" };
  try {
    await _db.ref("orders/" + kodeKey(kode)).remove();
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: true, mode: "local", error: String(e) };
  }
}

async function deleteOrderByIndex(index) {
  const orders = await getOrders();
  if (!orders[index]) return { ok: false };
  return deleteOrderByKode(orders[index].kode);
}

async function saveOrders(orders) {
  const list = Array.isArray(orders) ? orders : [];
  setLocalOrders(list.map(stripMeta));
  for (const o of list) {
    if (o && o.kode) {
      try {
        await addOrder(o);
      } catch (e) {}
    }
  }
  return { ok: true };
}

function findOrderByKodeInList(orders, kode) {
  if (!kode) return null;
  const t = String(kode).trim().toUpperCase();
  return (
    (orders || []).find((o) => String(o.kode || "").toUpperCase() === t) ||
    null
  );
}

window.VoxyyOrders = {
  isGlobalConfigured,
  getOrders,
  saveOrders,
  addOrder,
  updateOrderByKode,
  updateOrderByIndex,
  deleteOrderByIndex,
  deleteOrderByKode,
  findOrderByKodeInList,
  getLocalOrders,
  setLocalOrders,
  onOrdersChange,
  initFirebase,
  FIREBASE_CONFIG,
  GOOGLE_WEB_CLIENT_ID
};

/* ========== BUKTI TF / JASPOST / LAPORAN (Realtime) ========== */
let _buktiListeners = [];
let _jaspostListeners = [];
let _laporanListeners = [];
let _lastBukti = [];
let _lastJaspost = [];
let _lastLaporan = [];

function _snapToList(snap) {
  const val = snap.val() || {};
  return Object.keys(val)
    .map((k) => ({ ...val[k], id: k }))
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}

function _ensureExtraListeners() {
  if (!isGlobalConfigured()) return false;
  initFirebase();
  if (!_db) return false;
  if (_ensureExtraListeners._done) return true;
  _ensureExtraListeners._done = true;

  _db.ref("bukti_tf").on(
    "value",
    (snap) => {
      _lastBukti = _snapToList(snap);
      _buktiListeners.forEach((fn) => {
        try {
          fn(_lastBukti);
        } catch (e) {}
      });
    },
    (err) => console.error("[Voxyy] bukti:", err)
  );

  _db.ref("jaspost").on(
    "value",
    (snap) => {
      _lastJaspost = _snapToList(snap);
      _jaspostListeners.forEach((fn) => {
        try {
          fn(_lastJaspost);
        } catch (e) {}
      });
    },
    (err) => console.error("[Voxyy] jaspost:", err)
  );

  _db.ref("laporan").on(
    "value",
    (snap) => {
      _lastLaporan = _snapToList(snap);
      _laporanListeners.forEach((fn) => {
        try {
          fn(_lastLaporan);
        } catch (e) {}
      });
    },
    (err) => console.error("[Voxyy] laporan:", err)
  );

  return true;
}

function onBuktiChange(fn) {
  if (typeof fn === "function") _buktiListeners.push(fn);
  _ensureExtraListeners();
  if (_lastBukti.length) {
    try {
      fn(_lastBukti);
    } catch (e) {}
  }
}
function onJaspostChange(fn) {
  if (typeof fn === "function") _jaspostListeners.push(fn);
  _ensureExtraListeners();
  if (_lastJaspost.length) {
    try {
      fn(_lastJaspost);
    } catch (e) {}
  }
}
function onLaporanChange(fn) {
  if (typeof fn === "function") _laporanListeners.push(fn);
  _ensureExtraListeners();
  if (_lastLaporan.length) {
    try {
      fn(_lastLaporan);
    } catch (e) {}
  }
}

async function getBukti() {
  _ensureExtraListeners();
  if (_lastBukti.length) return _lastBukti;
  if (!_db) return [];
  try {
    const snap = await _db.ref("bukti_tf").once("value");
    _lastBukti = _snapToList(snap);
    return _lastBukti;
  } catch (e) {
    return [];
  }
}
async function getJaspost() {
  _ensureExtraListeners();
  if (_lastJaspost.length) return _lastJaspost;
  if (!_db) return [];
  try {
    const snap = await _db.ref("jaspost").once("value");
    _lastJaspost = _snapToList(snap);
    return _lastJaspost;
  } catch (e) {
    return [];
  }
}
async function getLaporan() {
  _ensureExtraListeners();
  if (_lastLaporan.length) return _lastLaporan;
  if (!_db) return [];
  try {
    const snap = await _db.ref("laporan").once("value");
    _lastLaporan = _snapToList(snap);
    return _lastLaporan;
  } catch (e) {
    return [];
  }
}

/**
 * Kompres gambar ke dataURL (JPEG) agar RTDB tidak terlalu besar.
 * maxW default 900px, quality 0.7
 */
function compressImageFile(file, maxW, quality) {
  maxW = maxW || 900;
  quality = quality || 0.7;
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (ev) {
      const img = new Image();
      img.onload = function () {
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          resolve(ev.target.result);
        }
      };
      img.onerror = function () {
        resolve(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addBukti(data) {
  if (!data) return { ok: false };
  const payload = {
    kode: data.kode || "",
    nama: data.nama || "",
    wa: data.wa || "",
    total: data.total || "",
    paket: data.paket || "",
    photos: data.photos || (data.photo ? [data.photo] : []),
    waktu: data.waktu || new Date().toLocaleString("id-ID"),
    createdAt: data.createdAt || Date.now()
  };
  if (!isGlobalConfigured()) {
    // local fallback
    try {
      const arr = JSON.parse(localStorage.getItem("voxyy_bukti") || "[]");
      arr.unshift({ ...payload, id: "local_" + Date.now() });
      localStorage.setItem("voxyy_bukti", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  _ensureExtraListeners();
  if (!_db) return { ok: false };
  try {
    const key = kodeKey(payload.kode) + "_" + Date.now();
    await _db.ref("bukti_tf/" + key).set(payload);
    return { ok: true, mode: "global", id: key };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function addJaspost(data) {
  if (!data) return { ok: false };
  const payload = {
    kode: data.kode || "",
    nama: data.nama || "",
    wa: data.wa || data.nomer || "",
    nomer: data.nomer || data.wa || "",
    item: data.item || "",
    paket: data.paket || "Jasa Post Free by Nailong",
    teks: data.teks || data.catatan || "",
    catatan: data.catatan || data.teks || "",
    photos: data.photos || (data.photo ? [data.photo] : []),
    waktu: data.waktu || new Date().toLocaleString("id-ID"),
    createdAt: data.createdAt || Date.now()
  };
  if (!isGlobalConfigured()) {
    try {
      const arr = JSON.parse(localStorage.getItem("voxyy_jaspost") || "[]");
      arr.unshift({ ...payload, id: "local_" + Date.now() });
      localStorage.setItem("voxyy_jaspost", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  _ensureExtraListeners();
  if (!_db) return { ok: false };
  try {
    const key = kodeKey(payload.kode) || "JP_" + Date.now();
    await _db.ref("jaspost/" + key).set(payload);
    return { ok: true, mode: "global", id: key };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function addLaporan(data) {
  if (!data) return { ok: false };
  const payload = {
    noPesanan: data.noPesanan || "",
    judul: data.judul || "",
    deskripsi: data.deskripsi || "",
    photos: data.photos || [],
    waktu: data.waktu || new Date().toLocaleString("id-ID"),
    createdAt: data.createdAt || Date.now()
  };
  if (!isGlobalConfigured()) {
    try {
      const arr = JSON.parse(localStorage.getItem("voxyy_laporan") || "[]");
      arr.unshift({ ...payload, id: "local_" + Date.now() });
      localStorage.setItem("voxyy_laporan", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  _ensureExtraListeners();
  if (!_db) return { ok: false };
  try {
    const ref = _db.ref("laporan").push();
    await ref.set(payload);
    return { ok: true, mode: "global", id: ref.key };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function deleteBukti(id) {
  if (!id) return { ok: false };
  if (!isGlobalConfigured()) {
    try {
      let arr = JSON.parse(localStorage.getItem("voxyy_bukti") || "[]");
      arr = arr.filter((x) => x.id !== id && x.kode !== id);
      localStorage.setItem("voxyy_bukti", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  if (!_db) return { ok: false };
  try {
    await _db.ref("bukti_tf/" + id).remove();
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function deleteJaspost(id) {
  if (!id) return { ok: false };
  if (!isGlobalConfigured()) {
    try {
      let arr = JSON.parse(localStorage.getItem("voxyy_jaspost") || "[]");
      arr = arr.filter((x) => x.id !== id && x.kode !== id);
      localStorage.setItem("voxyy_jaspost", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  if (!_db) return { ok: false };
  try {
    await _db.ref("jaspost/" + id).remove();
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function deleteLaporan(id) {
  if (!id) return { ok: false };
  if (!isGlobalConfigured()) {
    try {
      let arr = JSON.parse(localStorage.getItem("voxyy_laporan") || "[]");
      arr = arr.filter((x) => x.id !== id);
      localStorage.setItem("voxyy_laporan", JSON.stringify(arr));
    } catch (e) {}
    return { ok: true, mode: "local" };
  }
  initFirebase();
  if (!_db) return { ok: false };
  try {
    await _db.ref("laporan/" + id).remove();
    return { ok: true, mode: "global" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// expose extra API
Object.assign(window.VoxyyOrders, {
  compressImageFile,
  addBukti,
  addJaspost,
  addLaporan,
  getBukti,
  getJaspost,
  getLaporan,
  onBuktiChange,
  onJaspostChange,
  onLaporanChange,
  deleteBukti,
  deleteJaspost,
  deleteLaporan
});
