/**
 * Nailong Account Widget — hamburger top-right + profile photo when logged in
 */
(function () {
  function ensureGsi() {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) return;
    var s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  }
  const G_ICON = `<svg class="g-icon" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureModal() {
    if (document.getElementById("akunModalOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "akunModalOverlay";
    overlay.className = "akun-modal-overlay";
    overlay.innerHTML = `
      <div class="akun-modal" role="dialog" aria-modal="true">
        <button type="button" class="akun-modal-close" id="akunModalClose" aria-label="Tutup">&times;</button>
        <div class="akun-status off" id="akunModalStatus">Memuat...</div>
        <div class="akun-card" id="akunModalBody">
          <div class="akun-avatar placeholder"><i class="fa-solid fa-user"></i></div>
          <div class="akun-name">Belum masuk</div>
          <div class="akun-email">Login Google untuk menyimpan profil di perangkat ini.</div>
          <button type="button" class="btn-google" id="akunModalGoogle">${G_ICON} Masuk dengan Google</button>
          <button type="button" class="btn-logout" id="akunModalLogout" style="display:none;">Keluar</button>
        </div>
        <div class="akun-hint">
          <b>Login dulu menggunakan akun Google kalian agar satu sama lain bisa melihat orderannya. Ga login juga gpp.</b>
        </div>
        <p style="margin-top:12px;font-size:12px;color:#8aa0b8;text-align:center;">
          Atau buka halaman penuh: <a href="akun.html" style="color:#FFC107;">Akun</a>
        </p>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("akunModalClose").addEventListener("click", closeModal);

    document.getElementById("akunModalGoogle").addEventListener("click", async function () {
      const btn = this;
      if (!window.VoxyyAuth) {
        alert("Auth belum siap. Pastikan Firebase dikonfigurasi.");
        return;
      }
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan...';
      try {
        for (let i = 0; i < 25; i++) {
          if (window.google && google.accounts && google.accounts.oauth2) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        const user = await window.VoxyyAuth.loginGoogle();
        if (user) renderModalUser(user);
      } catch (e) {
        alert((e && e.message) ? e.message : String(e));
      } finally {
        btn.disabled = false;
        btn.innerHTML = G_ICON + " Masuk dengan Google";
      }
    });

    document.getElementById("akunModalLogout").addEventListener("click", async function () {
      try {
        if (window.VoxyyAuth) await window.VoxyyAuth.logout();
        renderModalUser(null);
      } catch (e) {
        alert("Gagal keluar");
      }
    });
  }

  function openModal() {
    ensureModal();
    document.getElementById("akunModalOverlay").classList.add("open");
    if (window.VoxyyAuth) {
      try {
        const user = window.VoxyyAuth.getCurrentUser && window.VoxyyAuth.getCurrentUser();
        renderModalUser(user || null);
      } catch (e) {
        renderModalUser(null);
      }
    } else {
      renderModalUser(null);
    }
  }

  function closeModal() {
    const el = document.getElementById("akunModalOverlay");
    if (el) el.classList.remove("open");
  }

  function renderModalUser(user) {
    const status = document.getElementById("akunModalStatus");
    const body = document.getElementById("akunModalBody");
    const btnG = document.getElementById("akunModalGoogle");
    const btnL = document.getElementById("akunModalLogout");
    if (!status || !body) return;

    const configured = window.VoxyyOrders && window.VoxyyOrders.isGlobalConfigured && window.VoxyyOrders.isGlobalConfigured();
    if (!configured && !user) {
      status.className = "akun-status off";
      status.textContent = "Setup diperlukan";
      body.innerHTML =
        '<div class="akun-avatar placeholder"><i class="fa-solid fa-gear"></i></div>' +
        '<div class="akun-name">Setup diperlukan</div>' +
        '<div class="akun-email">Isi FIREBASE_CONFIG di global-orders.js + aktifkan Google Sign-In.</div>';
      if (btnG) btnG.style.display = "none";
      if (btnL) btnL.style.display = "none";
      return;
    }

    if (user) {
      status.className = "akun-status on";
      status.textContent = "Sudah masuk";
      const avatar = user.photoURL
        ? '<img class="akun-avatar" src="' + escapeHtml(user.photoURL) + '" alt="foto">'
        : '<div class="akun-avatar placeholder"><i class="fa-solid fa-user"></i></div>';
      body.innerHTML =
        avatar +
        '<div class="akun-name">' + escapeHtml(user.displayName || "Pengguna") + "</div>" +
        '<div class="akun-email">' + escapeHtml(user.email || "-") + "</div>";
      body.appendChild(btnG);
      body.appendChild(btnL);
      btnG.style.display = "none";
      btnL.style.display = "block";
    } else {
      status.className = "akun-status off";
      status.textContent = "Belum masuk";
      body.innerHTML =
        '<div class="akun-avatar placeholder"><i class="fa-solid fa-user"></i></div>' +
        '<div class="akun-name">Belum masuk</div>' +
        '<div class="akun-email">Login Google untuk menyimpan profil di perangkat ini.</div>';
      body.appendChild(btnG);
      body.appendChild(btnL);
      btnG.style.display = "flex";
      btnL.style.display = "none";
    }
  }

  function updateHeaderProfile(user) {
    const img = document.getElementById("headerProfileImg");
    if (!img) return;
    if (user && user.photoURL) {
      img.src = user.photoURL;
      img.classList.add("show");
      img.alt = user.displayName || "Profil";
    } else if (user) {
      img.src = "";
      img.classList.remove("show");
    } else {
      img.src = "";
      img.classList.remove("show");
    }
  }

  function injectHeaderControls() {
    const headers = document.querySelectorAll("header.header");
    headers.forEach(function (header) {
      if (header.querySelector(".header-right")) return;
      const right = document.createElement("div");
      right.className = "header-right";
      right.innerHTML =
        '<img id="headerProfileImg" class="header-profile" alt="Profil" title="Profil">' +
        '<button type="button" class="btn-hamburger" id="btnHamburger" aria-label="Menu Akun"><i class="fa-solid fa-bars"></i></button>';
      header.appendChild(right);
      // only one id set — if multiple headers, use class listeners
    });

    document.querySelectorAll(".btn-hamburger").forEach(function (btn) {
      btn.addEventListener("click", openModal);
    });
    document.querySelectorAll(".header-profile").forEach(function (img) {
      img.addEventListener("click", openModal);
    });
  }

  function init() {
    ensureGsi();
    injectHeaderControls();
    ensureModal();

    if (window.VoxyyAuth) {
      // Shared promise di auth.js → aman dipanggil dari mana saja
      try {
        if (window.VoxyyAuth.handleRedirectResult) {
          window.VoxyyAuth.handleRedirectResult().then(function (user) {
            if (user) {
              updateHeaderProfile(user);
              if (document.getElementById("akunModalOverlay") && document.getElementById("akunModalOverlay").classList.contains("open")) {
                renderModalUser(user);
              }
            }
          }).catch(function () {});
        }
      } catch (e) {}
      if (window.VoxyyAuth.onAuthChange) {
        window.VoxyyAuth.onAuthChange(function (user) {
          updateHeaderProfile(user);
          if (document.getElementById("akunModalOverlay") && document.getElementById("akunModalOverlay").classList.contains("open")) {
            renderModalUser(user);
          }
        });
      }
      try {
        const u = window.VoxyyAuth.getCurrentUser && window.VoxyyAuth.getCurrentUser();
        updateHeaderProfile(u || null);
      } catch (e) {}
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
