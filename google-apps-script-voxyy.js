/**
 * ================================================
 *  VOXYY JOKI - Backend Antrian Global (GRATIS)
 *  File ini di-paste ke Google Apps Script
 *  BUKAN dijalankan di website
 * ================================================
 *
 * CARA PAKAI:
 * 1. Buka https://script.google.com
 * 2. New project
 * 3. Hapus kode default, paste SEMUA isi file ini
 * 4. Save (Ctrl+S) → nama: Voxyy Antrian
 * 5. Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Deploy → copy URL (https://script.google.com/macros/s/..../exec)
 * 7. Tempel URL itu ke global-orders.js → APPS_SCRIPT_URL
 */

var PROP_KEY = "voxyy_orders";

function getOrders_() {
  var raw = PropertiesService.getScriptProperties().getProperty(PROP_KEY);
  if (!raw) return [];
  try {
    var arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function saveOrders_(arr) {
  if (!Array.isArray(arr)) arr = [];
  if (arr.length > 400) arr = arr.slice(0, 400);
  PropertiesService.getScriptProperties().setProperty(
    PROP_KEY,
    JSON.stringify(arr)
  );
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** GET = ambil semua order */
function doGet(e) {
  try {
    var orders = getOrders_();
    orders.sort(function (a, b) {
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    });
    return jsonOut_({ ok: true, orders: orders });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err), orders: [] });
  }
}

/**
 * POST body (text/plain JSON):
 * { "action": "add", "order": { kode, nama, ... } }
 * { "action": "update", "kode": "...", "patch": { status: "Proses" } }
 * { "action": "delete", "kode": "..." }
 * { "action": "list" }
 */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = (body.action || "list").toLowerCase();
    var orders = getOrders_();

    if (action === "list") {
      orders.sort(function (a, b) {
        return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      });
      return jsonOut_({ ok: true, orders: orders });
    }

    if (action === "add" && body.order && body.order.kode) {
      var order = body.order;
      if (!order.createdAt) order.createdAt = Date.now();
      var key = String(order.kode).toUpperCase();
      var found = -1;
      for (var i = 0; i < orders.length; i++) {
        if (String(orders[i].kode || "").toUpperCase() === key) {
          found = i;
          break;
        }
      }
      if (found >= 0) {
        orders[found] = Object.assign({}, orders[found], order);
      } else {
        orders.unshift(order);
      }
      saveOrders_(orders);
      return jsonOut_({ ok: true, orders: orders });
    }

    if (action === "update" && body.kode) {
      var k = String(body.kode).toUpperCase();
      var patch = body.patch || {};
      var idx = -1;
      for (var j = 0; j < orders.length; j++) {
        if (String(orders[j].kode || "").toUpperCase() === k) {
          idx = j;
          break;
        }
      }
      if (idx >= 0) {
        orders[idx] = Object.assign({}, orders[idx], patch);
      } else {
        orders.unshift(
          Object.assign({ kode: body.kode, createdAt: Date.now() }, patch)
        );
      }
      saveOrders_(orders);
      return jsonOut_({ ok: true, orders: orders });
    }

    if (action === "delete" && body.kode) {
      var dk = String(body.kode).toUpperCase();
      orders = orders.filter(function (o) {
        return String(o.kode || "").toUpperCase() !== dk;
      });
      saveOrders_(orders);
      return jsonOut_({ ok: true, orders: orders });
    }

    return jsonOut_({ ok: false, error: "unknown_action", orders: orders });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err), orders: [] });
  }
}
