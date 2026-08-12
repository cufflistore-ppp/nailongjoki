function loadAntrianFromStorage() {
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  return orders.map((o, i) => ({
    no: i + 1,
    kode: o.kode,
    nama: o.nama.length > 8 ? o.nama.substring(0, 2) + "********" : o.nama,
    jenis: (o.paket || "Joki Kontak") + " - " + (o.status || "Belum Bayar"),
    status: o.status === "Sukses" ? "SELESAI" : (o.status === "Proses" ? "PROSES" : "MASUK ANTRIAN")
  }));
}

function renderAntrian() {
  const list = document.getElementById("antrianList");
  if (!list) return;

  let data = loadAntrianFromStorage();

  // Kalau kosong, tampilkan contoh
  if (data.length === 0) {
    data = [
      { no: 5, kode: "RJ-2026-4926", nama: "Ci*********", jenis: "Joki 1 Hari - Joki Kontak", status: "MASUK ANTRIAN" },
      { no: 6, kode: "RJ-2026-5011", nama: "Ga*", jenis: "Joki 2 Hari - Joki Kontak", status: "MASUK ANTRIAN" },
      { no: 7, kode: "RJ-2026-5066", nama: "Ar*********", jenis: "Joki 2 Hari - Joki Kontak", status: "PROSES" },
      { no: 8, kode: "RJ-2026-5155", nama: "Wj*********", jenis: "Joki 1 Hari - Joki Kontak", status: "MASUK ANTRIAN" }
    ];
  }

  list.innerHTML = data.map(item => `
    <div class="antrian-item">
      <div style="display:flex;align-items:center;">
        <div class="num">#${item.no}</div>
        <div class="info">
          <strong>${item.kode}</strong>
          <small>${item.nama} · ${item.jenis}</small>
        </div>
      </div>
      <span class="status-badge">${item.status}</span>
    </div>
  `).join("");
}

function cekStatus() {
  const input = document.getElementById("searchOrder");
  if (!input || !input.value.trim()) {
    alert("Masukkan nomor order terlebih dahulu");
    return;
  }

  const kode = input.value.trim().toUpperCase();
  const orders = JSON.parse(localStorage.getItem("nailong_orders") || "[]");
  const found = orders.find(o => o.kode.toUpperCase() === kode);

  if (found) {
    alert(`Status untuk ${found.kode}:\n\nNama: ${found.nama}\nStatus: ${found.status}\nTotal: ${found.total}\nWaktu: ${found.waktu}`);
  } else {
    alert("Nomor order tidak ditemukan.\nPastikan kode benar (contoh: RJ-2026-1234)");
  }
}

document.addEventListener("DOMContentLoaded", renderAntrian);
