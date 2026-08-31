/**
 * Wajib login Google sebelum order.
 * Kalau belum login → animasi peringatan → redirect ke akun.html
 */
(function () {
  var REDIRECT_MS = 2200;
  var AUTH_WAIT_MS = 2500;

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureStyles() {
    if (document.getElementById("authGuardStyle")) return;
    var style = document.createElement("style");
    style.id = "authGuardStyle";
    style.textContent = [
      "#authGuardOverlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .28s ease;}",
      "#authGuardOverlay.show{opacity:1;}",
      "#authGuardCard{width:100%;max-width:340px;background:linear-gradient(160deg,#121a2b 0%,#0d1220 100%);border:1px solid #FFC10755;border-radius:18px;padding:22px 18px 18px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 0 1px rgba(255,193,7,.12);transform:scale(.86) translateY(18px);opacity:0;transition:transform .35s cubic-bezier(.22,1.2,.36,1),opacity .3s ease;}",
      "#authGuardOverlay.show #authGuardCard{transform:scale(1) translateY(0);opacity:1;}",
      "#authGuardIcon{width:64px;height:64px;margin:0 auto 12px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,193,7,.12);border:2px solid #FFC107;animation:authPulse 1.1s ease-in-out infinite;}",
      "#authGuardIcon i{font-size:28px;color:#FFC107;}",
      "@keyframes authPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,193,7,.45)}50%{transform:scale(1.06);box-shadow:0 0 0 12px rgba(255,193,7,0)}}",
      "#authGuardTitle{font-size:17px;font-weight:800;color:#fff;margin-bottom:6px;}",
      "#authGuardDesc{font-size:13px;color:#b0bec5;line-height:1.5;margin-bottom:14px;}",
      "#authGuardBar{height:4px;background:#1a2740;border-radius:4px;overflow:hidden;margin-bottom:12px;}",
      "#authGuardBar > span{display:block;height:100%;width:0;background:linear-gradient(90deg,#FFC107,#FF8F00);border-radius:4px;animation:authBar 2s linear forwards;}",
      "@keyframes authBar{from{width:0}to{width:100%}}",
      "#authGuardHint{font-size:11px;color:#8aa0b8;}"
    ].join("");
    document.head.appendChild(style);
  }

  function showLoginWarning(message) {
    ensureStyles();
    var existing = document.getElementById("authGuardOverlay");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "authGuardOverlay";
    overlay.innerHTML =
      '<div id="authGuardCard" role="alertdialog" aria-modal="true">' +
      '<div id="authGuardIcon"><i class="fa-solid fa-user-lock"></i></div>' +
      '<div id="authGuardTitle">Login dulu yuk!</div>' +
      '<div id="authGuardDesc">' +
      escapeHtml(message || "Sebelum order, kamu harus login pakai akun Google.") +
      "</div>" +
      '<div id="authGuardBar"><span></span></div>' +
      '<div id="authGuardHint">Mengalihkan ke halaman Akun…</div>' +
      "</div>";
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add("show");
    });
  }

  function redirectToAkun(returnUrl) {
    try {
      if (returnUrl) sessionStorage.setItem("nailong_return_after_login", returnUrl);
    } catch (e) {}
    window.location.href = "akun.html";
  }

  function waitForAuthUser() {
    return new Promise(function (resolve) {
      function done(user) {
        resolve(user || null);
      }

      if (!window.VoxyyAuth) {
        // tunggu sebentar auth.js load
        var tries = 0;
        var t = setInterval(function () {
          tries++;
          if (window.VoxyyAuth) {
            clearInterval(t);
            waitForAuthUser().then(resolve);
          } else if (tries > 15) {
            clearInterval(t);
            done(null);
          }
        }, 150);
        return;
      }

      try {
        var u = window.VoxyyAuth.getCurrentUser && window.VoxyyAuth.getCurrentUser();
        if (u) {
          done(u);
          return;
        }
      } catch (e) {}

      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        done(null);
      }, AUTH_WAIT_MS);

      try {
        if (window.VoxyyAuth.onAuthChange) {
          var unsub = window.VoxyyAuth.onAuthChange(function (user) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            try {
              if (typeof unsub === "function") unsub();
            } catch (e) {}
            done(user || null);
          });
        } else {
          settled = true;
          clearTimeout(timer);
          done(null);
        }
      } catch (e) {
        settled = true;
        clearTimeout(timer);
        done(null);
      }
    });
  }

  /**
   * @returns {Promise<boolean>} true jika sudah login
   */
  async function requireLogin(opts) {
    opts = opts || {};
    var user = await waitForAuthUser();
    if (user) return true;

    var msg =
      opts.message ||
      "Sebelum order, kamu wajib login dulu pakai akun Google.";
    var ret = opts.returnUrl || (location.pathname.split("/").pop() + location.search);
    showLoginWarning(msg);
    setTimeout(function () {
      redirectToAkun(ret);
    }, REDIRECT_MS);
    return false;
  }

  function isOrderLink(href) {
    if (!href) return false;
    var h = String(href).toLowerCase();
    return (
      h.indexOf("pembayaran.html") !== -1 ||
      h.indexOf("pesan.html") !== -1 ||
      h.indexOf("detail.html") !== -1 ||
      h.indexOf("detail-produk.html") !== -1
    );
  }

  function interceptOrderClicks() {
    document.addEventListener(
      "click",
      function (e) {
        var a = e.target && e.target.closest ? e.target.closest("a") : null;
        if (!a) return;
        var href = a.getAttribute("href") || "";
        if (!isOrderLink(href)) return;
        // biarkan jika sudah login (cek sync dulu; async block di bawah)
        e.preventDefault();
        e.stopPropagation();
        requireLogin({
          returnUrl: href,
          message: "Sebelum order, kamu wajib login dulu pakai akun Google."
        }).then(function (ok) {
          if (ok) window.location.href = href;
        });
      },
      true
    );
  }

  // Guard di halaman order/payment saat dibuka langsung via URL
  function guardOrderPages() {
    var page = (location.pathname.split("/").pop() || "").toLowerCase();
    var isOrderPage =
      page === "pembayaran.html" ||
      page === "pesan.html" ||
      page === "detail.html" ||
      page === "detail-produk.html";
    if (!isOrderPage) return;

    requireLogin({
      message: "Sebelum order, kamu wajib login dulu pakai akun Google.",
      returnUrl: page + location.search
    }).then(function (ok) {
      if (!ok) {
        // freeze interaksi form
        document.querySelectorAll("button, input, select, textarea, a.btn-pesan, a.btn").forEach(function (el) {
          try {
            el.style.pointerEvents = "none";
            el.setAttribute("disabled", "disabled");
          } catch (e) {}
        });
      }
    });
  }

  window.NailongAuthGuard = {
    requireLogin: requireLogin,
    waitForAuthUser: waitForAuthUser,
    showLoginWarning: showLoginWarning
  };

  function init() {
    interceptOrderClicks();
    guardOrderPages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
