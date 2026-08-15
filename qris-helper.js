/**
 * QRIS Helper - Static to Dynamic converter (EMVCo / Bank Indonesia)
 * + Admin fee support + Expiration handling (client-side)
 * Compatible with pure frontend (no backend needed)
 */

// ============ CONFIG YANG HARUS DIGANTI USER ============
// Paste string QRIS STATIS kamu di sini (hasil scan QRIS merchant)
// Contoh format: 00020101021126....6304XXXX
const STATIC_QRIS = "00020101021126570011ID.DANA.WWW011893600915302418943202090241894320303UMI51440014ID.CO.QRIS.WWW0215ID10265111031560303UMI5204549953033605802ID5911TOKO CUFFLI6015Kota Jakarta Ti610513440630403C9";

// Biaya admin (Rp). Bisa diubah.
const ADMIN_FEE = 1000;

// Masa berlaku QRIS dalam menit
const QRIS_EXPIRE_MINUTES = 15;
// ========================================================

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Convert static QRIS → dynamic with amount
 * amount in number (IDR, no decimal)
 */
function makeDynamicQris(staticQris, amount) {
  if (!staticQris || typeof staticQris !== "string") {
    throw new Error("STATIC_QRIS belum diisi atau invalid");
  }
  // Remove existing CRC (last 4 chars after 6304)
  let qris = staticQris.replace(/6304[0-9A-F]{4}$/i, "");

  // Change Point of Initiation Method: 010211 (static) → 010212 (dynamic)
  qris = qris.replace("010211", "010212");

  // Remove existing amount tag 54 if any
  qris = qris.replace(/54\d{2}\d+(\.\d{2})?/g, "");

  // Format amount as integer string (no decimal for most Indonesian QRIS)
  const amountStr = String(Math.floor(Number(amount)));
  const amountTag = "54" + String(amountStr.length).padStart(2, "0") + amountStr;

  // Insert amount before country code 5802ID or before merchant name, safest before 5802
  if (qris.includes("5802ID")) {
    qris = qris.replace("5802ID", amountTag + "5802ID");
  } else {
    // fallback: insert before CRC position
    qris = qris + amountTag;
  }

  // Recalculate CRC
  const crc = crc16(qris + "6304");
  return qris + "6304" + crc;
}

/**
 * Parse total string "Rp 25.000" → number 25000
 */
function parseRupiah(str) {
  if (typeof str === "number") return str;
  return Number(String(str).replace(/[^\d]/g, "")) || 0;
}

/**
 * Generate final amount = order total + admin fee
 */
function getFinalAmount(orderTotal) {
  return parseRupiah(orderTotal) + ADMIN_FEE;
}

/**
 * Create order payload with expiration
 */
function createOrderWithExpiry(baseOrder) {
  const now = Date.now();
  const expiresAt = now + (QRIS_EXPIRE_MINUTES * 60 * 1000);
  return {
    ...baseOrder,
    adminFee: ADMIN_FEE,
    finalAmount: getFinalAmount(baseOrder.total),
    createdAt: now,
    expiresAt: expiresAt,
    qrisExpired: false
  };
}

/**
 * Check if order QRIS is still valid
 */
function isQrisValid(order) {
  if (!order || !order.expiresAt) return false;
  return Date.now() < order.expiresAt && !order.qrisExpired;
}

/**
 * Render QR code into a canvas or img using QRCode library (CDN)
 * Call after loading https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js
 */
async function renderQrisToElement(qrisString, elementId, size = 220) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Prefer QRCode library if available
  if (typeof QRCode !== "undefined") {
    // Clear previous
    el.innerHTML = "";
    const canvas = document.createElement("canvas");
    el.appendChild(canvas);
    await QRCode.toCanvas(canvas, qrisString, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" }
    });
    return;
  }

  // Fallback: use Google Chart API (online)
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrisString)}`;
  el.innerHTML = `<img src="${url}" alt="QRIS" width="${size}" height="${size}" style="display:block;border-radius:8px;">`;
}

// Export for browser
window.QRISHelper = {
  STATIC_QRIS,
  ADMIN_FEE,
  QRIS_EXPIRE_MINUTES,
  makeDynamicQris,
  parseRupiah,
  getFinalAmount,
  createOrderWithExpiry,
  isQrisValid,
  renderQrisToElement,
  crc16
};
