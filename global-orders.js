/**
 * Nailong - Antrian & Admin Global (Firebase)
 * authDomain = firebaseapp.com (stabil). Login Google pakai GIS (tanpa redirect).
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDYvXGHnYkNlkd-puzR4f8AyUtU-wrvyFk",
  authDomain: "jualbelisewarumah-3de0b.firebaseapp.com",
  databaseURL: "https://jualbelisewarumah-3de0b-default-rtdb.firebaseio.com",
  projectId: "jualbelisewarumah-3de0b",
  storageBucket: "jualbelisewarumah-3de0b.firebasestorage.app",
  messagingSenderId: "88220462362",
  appId: "1:88220462362:web:d2f824442c16ac9195d0a3",
  measurementId: "G-YTCFEX2VX8"
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
