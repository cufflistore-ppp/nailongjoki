/**
 * Nailong Account Widget — hamburger + modal login normal
 */
(function () {
  function ensureGsi() {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) return;
    var s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  }

  const G_ICON =
    '<svg class="g-icon" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  const ADMIN_EMAIL = "raffliraffli649@gmail.com";

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isAdminEmail(email) {
    return String(email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  function ensureModalStyles() {
    if (document.getElementById("akunWidgetStyles")) return;
    var st = document.createElement("style");
    st.id = "akunWidgetStyles";
    st.textContent =
      ".akun-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9000;display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;pointer-events:none;transition:opacity .25s ease;}" +
      ".akun-modal-overlay.open{opacity:1;pointer-events:auto;}" +
      ".akun-modal{background:#0f1628;border:1px solid #1a2740;border-radius:18px;padding:20px 18px 16px;width:100%;max-width:360px;position:relative;box-shadow:0 16px 48px rgba(0,0,0,.5);transform:translateY(12px);transition:transform .25s ease;}" +
      ".akun-modal-overlay.open .akun-modal{transform:translateY(0);}" +
      ".akun-modal-close{position:absolute;top:10px;right:12px;background:transparent;border:none;color:#8aa0b8;font-size:22px;cursor:pointer;line-height:1;}" +
      ".akun-modal-status{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:12px;}" +
      ".akun-modal-status.on{background:#0d3d1a;color:#66bb6a;}" +
      ".akun-modal-status.off{background:#1a2740;color:#8aa0b8;}" +
      ".akun-modal-body{text-align:center;}" +
      ".akun-modal-avatar{width:68px;height:68px;border-radius:50%;object-fit:cover;border:2.5px solid #FFC107;margin:0 auto 10px;display:block;background:#0a0e18;}" +
      ".akun-modal-avatar.ph{display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#FFC107;background:linear-gradient(145deg,#1a2740,#0a0e18);margin:0 auto 10px;}" +
      ".akun-modal-name{font-size:17px;font-weight:800;color:#fff;margin-bottom:2px;}" +
      ".akun-modal-email{font-size:12px;color:#FFC107;margin-bottom:12px;word-break:break-all;}" +
      ".akun-modal-sub{font-size:12px;color:#8aa0b8;margin-bottom:14px;line-height:1.45;}" +
      ".akun-modal .btn-google{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#3c4043;border:none;border-radius:12px;padding:12px 14px;font-size:14px;font-weight:600;cursor:pointer;}" +
      ".akun-modal .btn-google:disabled{opacity:.65;cursor:wait;}" +
      ".akun-modal .btn-logout{width:100%;margin-top:8px;background:transparent;border:1px solid #3d2222;color:#ef9a9a;border-radius:12px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;}" +
      ".akun-modal-links{margin-top:12px;display:flex;flex-direction:column;gap:6px;}" +
      ".akun-modal-links a{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#10182a;border:1px solid #1a2740;border-radius:12px;color:#e8eef7;text-decoration:none;font-size:13px;font-weight:600;}" +
      ".akun-modal-links a i.fa-chevron-right{color:#4a5a70;font-size:11px;}" +
      ".akun-modal-links a.admin{border-color:#FFC10744;}" +
      ".akun-modal-footer{margin-top:12px;font-size:12px;color:#6b7c93;text-align:center;}" +
      ".akun-modal-footer a{color:#FFC107;}";
    document.head.appendChild(st);
  }

  function ensureModal() {
    ensureModalStyles();
    if (document.getElementById("akunModalOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "akunModalOverlay";
    overlay.className = "akun-modal-overlay";
    overlay.innerHTML =
      '<div class="akun-modal" role="dialog" aria-modal="true">' +
      '<button type="button" class="akun-modal-close" id="akunModalClose" aria-label="Tutup">&times;</button>' +
      '<div class="akun-modal-status off" id="akunModalStatus">Memuat...</div>' +
      '<div class="akun-modal-body" id="akunModalBody"></div>' +
      '<div class="akun-modal-links" id="akunModalLinks" style="display:none;"></div>' +
      '<div class="akun-modal-footer">Halaman penuh: <a href="akun.html">Akun</a></div>' +
      "</div>";
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("akunModalClose").addEventListener("click", closeModal);
  }

  function openModal() {
    ensureModal();
    document.getElementById("akunModalOverlay").classList.add("open");
    refreshModal();
  }

  function closeModal() {
    var el = document.getElementById("akunModalOverlay");
    if (el) el.classList.remove("open");
  }

  function getUser() {
    try {
      if (window.VoxyyAuth) {
        if (typeof window.VoxyyAuth.getCurrentUser === "function") {
          return window.VoxyyAuth.getCurrentUser();
        }
        if (typeof window.VoxyyAuth.currentUser === "function") {
          return window.VoxyyAuth.currentUser();
        }
      }
      if (typeof firebase !== "undefined" && firebase.auth) {
        return firebase.auth().currentUser;
      }
    } catch (e) {}
    return null;
  }

  function renderGuest() {
    var status = document.getElementById("akunModalStatus");
    var body = document.getElementById("akunModalBody");
    var links = document.getElementById("akunModalLinks");
    if (!status || !body) return;

    status.className = "akun-modal-status off";
    status.textContent = "Belum masuk";
    body.innerHTML =
      '<div class="akun-modal-avatar ph"><i class="fa-solid fa-user"></i></div>' +
      '<div class="akun-modal-name">Masuk ke Nailong</div>' +
      '<div class="akun-modal-sub">Login Google untuk order, pantau antrian, dan akses akun.</div>' +
      '<button type="button" class="btn-google" id="akunModalGoogle">' +
      G_ICON +
      " Masuk dengan Google</button>";

    if (links) {
      links.style.display = "none";
      links.innerHTML = "";
    }

    var btn = document.getElementById("akunModalGoogle");
    if (btn) {
      btn.addEventListener("click", onLoginClick);
    }
  }

  function renderUser(user) {
    var status = document.getElementById("akunModalStatus");
    var body = document.getElementById("akunModalBody");
    var links = document.getElementById("akunModalLinks");
    if (!status || !body) return;

    status.className = "akun-modal-status on";
    status.textContent = "Sudah masuk";

    var name = user.displayName || "Pengguna";
    var email = user.email || "-";
    var photo = user.photoURL || "";
    var avatarHtml = photo
      ? '<img class="akun-modal-avatar" src="' + escapeHtml(photo) + '" alt="foto" referrerpolicy="no-referrer">'
      : '<div class="akun-modal-avatar ph">' + escapeHtml((name.charAt(0) || "?").toUpperCase()) + "</div>";

    body.innerHTML =
      avatarHtml +
      '<div class="akun-modal-name">' +
      escapeHtml(name) +
      "</div>" +
      '<div class="akun-modal-email">' +
      escapeHtml(email) +
      "</div>" +
      '<button type="button" class="btn-logout" id="akunModalLogout"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>';

    if (links) {
      var items =
        '<a href="antrian.html"><span><i class="fa-solid fa-clock" style="color:#FFC107;margin-right:8px;"></i>Antrian</span><i class="fa-solid fa-chevron-right"></i></a>' +
        '<a href="laporan.html"><span><i class="fa-solid fa-flag" style="color:#FFC107;margin-right:8px;"></i>Laporan</span><i class="fa-solid fa-chevron-right"></i></a>' +
        '<a href="akun.html"><span><i class="fa-solid fa-user" style="color:#FFC107;margin-right:8px;"></i>Halaman Akun</span><i class="fa-solid fa-chevron-right"></i></a>';
      if (isAdminEmail(email)) {
        items +=
          '<a class="admin" href="admin.html"><span><i class="fa-solid fa-user-shield" style="color:#FFC107;margin-right:8px;"></i>Panel Admin</span><i class="fa-solid fa-chevron-right"></i></a>';
      }
      links.innerHTML = items;
      links.style.display = "flex";
    }

    var btnL = document.getElementById("akunModalLogout");
    if (btnL) {
      btnL.addEventListener("click", async function () {
        try {
          if (window.VoxyyAuth) await window.VoxyyAuth.logout();
          renderGuest();
          updateHeaderProfile(null);
        } catch (e) {
          alert("Gagal keluar");
        }
      });
    }
  }

  async function onLoginClick() {
    var btn = document.getElementById("akunModalGoogle");
    if (!btn) return;
    if (!window.VoxyyAuth) {
      alert("Auth belum siap. Coba refresh halaman.");
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan...';
    try {
      for (var i = 0; i < 25; i++) {
        if (window.google && google.accounts && google.accounts.oauth2) break;
        await new Promise(function (r) {
          setTimeout(r, 200);
        });
      }
      var user = await window.VoxyyAuth.loginGoogle();
      if (user) {
        renderUser(user);
        updateHeaderProfile(user);
      }
    } catch (e) {
      alert((e && e.message) ? e.message : String(e));
    } finally {
      btn.disabled = false;
      btn.innerHTML = G_ICON + " Masuk dengan Google";
    }
  }

  function refreshModal() {
    var user = getUser();
    if (user) renderUser(user);
    else renderGuest();
  }

  function updateHeaderProfile(user) {
    document.querySelectorAll(".header-profile").forEach(function (img) {
      if (user && user.photoURL) {
        img.src = user.photoURL;
        img.classList.add("show");
        img.alt = user.displayName || "Profil";
      } else {
        img.removeAttribute("src");
        img.classList.remove("show");
      }
    });
  }

  function injectHeaderControls() {
    document.querySelectorAll("header.header").forEach(function (header) {
      if (header.querySelector(".header-right")) return;
      var right = document.createElement("div");
      right.className = "header-right";
      right.innerHTML =
        '<img class="header-profile" alt="Profil" title="Profil" referrerpolicy="no-referrer">' +
        '<button type="button" class="btn-hamburger" aria-label="Menu Akun"><i class="fa-solid fa-bars"></i></button>';
      header.appendChild(right);
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

    function bindAuth() {
      if (!window.VoxyyAuth) return false;
      try {
        if (window.VoxyyAuth.handleRedirectResult) {
          window.VoxyyAuth.handleRedirectResult().then(function (user) {
            if (user) updateHeaderProfile(user);
          }).catch(function () {});
        }
        if (window.VoxyyAuth.onAuthChange) {
          window.VoxyyAuth.onAuthChange(function (user) {
            updateHeaderProfile(user || null);
            var overlay = document.getElementById("akunModalOverlay");
            if (overlay && overlay.classList.contains("open")) {
              if (user) renderUser(user);
              else renderGuest();
            }
          });
        } else {
          updateHeaderProfile(getUser());
        }
      } catch (e) {}
      return true;
    }

    if (!bindAuth()) {
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (bindAuth() || tries > 25) clearInterval(t);
      }, 200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.NailongAccountWidget = { open: openModal, close: closeModal };
})();
