// ============ KONFIGURASI TELEGRAM ============
const TELEGRAM_BOT_TOKEN = "8957651122:AAEMVVIzLNj7pvlIeNVxTuDk0AsBwaFgTks";
const TELEGRAM_CHAT_ID   = "7701533150";
// ==============================================

async function kirimTelegram(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML"
      })
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data);
    return data;
  } catch (e) {
    console.error("Gagal kirim Telegram:", e);
  }
}

async function kirimFotoTelegram(file, caption = "") {
  try {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append("photo", file);
    if (caption) formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const res = await fetch(url, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram foto error:", data);
    return data;
  } catch (e) {
    console.error("Gagal kirim foto:", e);
  }
}

async function kirimOrderKeTelegram(data) {
  const pesan = `
🛒 <b>ORDER BARU - NAILONG JOKI</b>

🆔 Kode Antrian: <code>${data.kode}</code>
👤 Nama: <b>${data.nama}</b>
📱 WhatsApp: <b>${data.wa}</b>
📦 Paket: ${data.paket || "Joki Kontak"}
💰 Total: <b>${data.total}</b>
📊 Status: <b>${data.status || "Belum Bayar"}</b>

📝 Catatan Push:
<pre>${data.catatan || "-"}</pre>

⏰ Waktu: ${data.waktu || new Date().toLocaleString("id-ID")}
  `.trim();

  await kirimTelegram(pesan);
}

async function kirimLaporanKeTelegram(data, fotoFiles = []) {
  const pesan = `
🚨 <b>LAPORAN TRANSAKSI</b>

🆔 No Pesanan: <code>${data.noPesanan}</code>
📌 Judul: ${data.judul}
📄 Deskripsi:
${data.deskripsi}

⏰ ${new Date().toLocaleString("id-ID")}
  `.trim();

  await kirimTelegram(pesan);

  for (let i = 0; i < fotoFiles.length; i++) {
    await kirimFotoTelegram(fotoFiles[i], `Foto laporan ${i + 1} - ${data.noPesanan}`);
  }
}

async function kirimStatusUpdate(kode, status, nama) {
  const pesan = `
🔄 <b>STATUS DIUBAH - NAILONG JOKI</b>

🆔 Kode: <code>${kode}</code>
👤 Nama: ${nama || "-"}
📊 Status baru: <b>${status}</b>
⏰ ${new Date().toLocaleString("id-ID")}
  `.trim();
  await kirimTelegram(pesan);
}
