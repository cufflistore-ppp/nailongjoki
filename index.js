/**
 * VOXYY JOKI - Server Antrian Global
 * API sederhana, gratis, data tersimpan di server.
 *
 * Endpoint:
 *   GET    /api/orders
 *   POST   /api/orders          body: order object
 *   PUT    /api/orders/:kode    body: { status, ... }
 *   DELETE /api/orders/:kode
 *   GET    /health
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "orders.json");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readOrders() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function writeOrders(orders) {
  ensureDataFile();
  const list = Array.isArray(orders) ? orders : [];
  // batasi biar file tidak membengkak
  if (list.length > 500) list.length = 500;
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function sortOrders(list) {
  return list.slice().sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
}

function findIndexByKode(orders, kode) {
  const t = String(kode || "").trim().toUpperCase();
  return orders.findIndex((o) => String(o.kode || "").toUpperCase() === t);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "voxyy-orders-api", time: new Date().toISOString() });
});

app.get("/api/orders", (_req, res) => {
  const orders = sortOrders(readOrders());
  res.json({ ok: true, orders });
});

app.post("/api/orders", (req, res) => {
  const order = req.body || {};
  if (!order.kode) {
    return res.status(400).json({ ok: false, error: "kode_required" });
  }
  if (!order.createdAt) order.createdAt = Date.now();

  const orders = readOrders();
  const idx = findIndexByKode(orders, order.kode);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...order };
  } else {
    orders.unshift(order);
  }
  writeOrders(orders);
  res.json({ ok: true, orders: sortOrders(orders) });
});

app.put("/api/orders/:kode", (req, res) => {
  const kode = req.params.kode;
  const patch = req.body || {};
  const orders = readOrders();
  const idx = findIndexByKode(orders, kode);

  if (idx < 0) {
    const neu = { kode, createdAt: Date.now(), ...patch };
    orders.unshift(neu);
  } else {
    orders[idx] = { ...orders[idx], ...patch };
  }
  writeOrders(orders);
  res.json({ ok: true, orders: sortOrders(orders) });
});

app.delete("/api/orders/:kode", (req, res) => {
  const kode = req.params.kode;
  let orders = readOrders();
  orders = orders.filter(
    (o) => String(o.kode || "").toUpperCase() !== String(kode || "").toUpperCase()
  );
  writeOrders(orders);
  res.json({ ok: true, orders: sortOrders(orders) });
});

// root
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "Voxyy Orders API",
    endpoints: [
      "GET /api/orders",
      "POST /api/orders",
      "PUT /api/orders/:kode",
      "DELETE /api/orders/:kode",
      "GET /health"
    ]
  });
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log("Voxyy Orders API running on port " + PORT);
  console.log("Data file: " + DATA_FILE);
});
