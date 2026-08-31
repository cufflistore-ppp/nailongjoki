/**
 * Nailong Auth - Google via Firebase Auth
 * getRedirectResult hanya dipanggil SEKALI (shared promise) agar sesi tidak hilang.
 */
(function () {
  var AUTH_PENDING_KEY = "nailong_auth_pending";
  var _redirectPromise = null;
  var _redirectDone = false;
  var _redirectUser = null;

  function ensureAuth() {
    if (typeof firebase === "undefined") return null;
    if (!window.VoxyyOrders || !window.VoxyyOrders.isGlobalConfigured()) return null;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.VoxyyOrders.FIREBASE_CONFIG || {});
      }
      if (window.VoxyyOrders.initFirebase) window.VoxyyOrders.initFirebase();
      var auth = firebase.auth();
      try {
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (e) {}
      return auth;
    } catch (e) {
      console.error("[Nailong Auth]", e);
      return null;
    }
  }

  function currentUser() {
    var auth = ensureAuth();
    return auth ? auth.currentUser : null;
  }

  function getClientId() {
    var fromOrders =
      (window.VoxyyOrders && window.VoxyyOrders.GOOGLE_WEB_CLIENT_ID) || "";
    var fromGlobal =
      typeof GOOGLE_WEB_CLIENT_ID !== "undefined" ? GOOGLE_WEB_CLIENT_ID : "";
    return String(fromOrders || fromGlobal || "").trim();
  }

  function isMobile() {
    try {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    } catch (e) {
      return true;
    }
  }

  function googleProvider() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    provider.addScope("email");
    provider.addScope("profile");
    return provider;
  }

  function waitAuthReady(auth) {
    return new Promise(function (resolve) {
      if (!auth) {
        resolve(null);
        return;
      }
      if (auth.currentUser) {
        resolve(auth.currentUser);
        return;
      }
      if (typeof auth.authStateReady === "function") {
        auth
          .authStateReady()
          .then(function () {
            resolve(auth.currentUser || null);
          })
          .catch(function () {
            resolve(auth.currentUser || null);
          });
        return;
      }
      var done = false;
      var unsub = auth.onAuthStateChanged(function (user) {
        if (done) return;
        done = true;
        try {
          unsub();
        } catch (e) {}
        resolve(user || null);
      });
      setTimeout(function () {
        if (done) return;
        done = true;
        try {
          unsub();
        } catch (e) {}
        resolve(auth.currentUser || null);
      }, 6000);
    });
  }

  function loginGoogle() {
    return new Promise(function (resolve, reject) {
      var auth = ensureAuth();
      if (!auth) {
        reject(
          new Error(
            "Firebase belum siap. Cek global-orders.js dan koneksi internet."
          )
        );
        return;
      }

      var provider = googleProvider();

      function doRedirect() {
        try {
          sessionStorage.setItem(AUTH_PENDING_KEY, "1");
          localStorage.setItem(AUTH_PENDING_KEY, "1");
        } catch (e) {}
        auth.signInWithRedirect(provider).catch(function (err) {
          try {
            sessionStorage.removeItem(AUTH_PENDING_KEY);
            localStorage.removeItem(AUTH_PENDING_KEY);
          } catch (e2) {}
          reject(err);
        });
      }

      // Coba popup dulu (lebih stabil sesinya). Kalau gagal → redirect.
      auth
        .signInWithPopup(provider)
        .then(function (result) {
          resolve(result.user);
        })
        .catch(function (err) {
          var code = (err && err.code) || "";
          var msg = (err && err.message) || "";
          // User tutup popup / diblokir → redirect
          if (
            code.indexOf("popup-closed") !== -1 ||
            code.indexOf("cancelled-popup") !== -1 ||
            code.indexOf("popup-blocked") !== -1 ||
            /popup|blocked/i.test(msg) ||
            isMobile()
          ) {
            doRedirect();
            return;
          }
          reject(err);
        });
    });
  }

  /**
   * HANYA SATU kali memanggil getRedirectResult di seluruh halaman.
   * Panggilan berikutnya memakai hasil yang sama.
   */
  function handleRedirectResult() {
    if (_redirectDone) {
      return Promise.resolve(_redirectUser);
    }
    if (_redirectPromise) return _redirectPromise;

    _redirectPromise = (async function () {
      var auth = ensureAuth();
      if (!auth) return null;

      try {
        var result = await auth.getRedirectResult();
        if (result && result.user) {
          _redirectUser = result.user;
          _redirectDone = true;
          try {
            sessionStorage.removeItem(AUTH_PENDING_KEY);
            localStorage.removeItem(AUTH_PENDING_KEY);
          } catch (e) {}
          return _redirectUser;
        }
      } catch (err) {
        try {
          sessionStorage.setItem(
            "voxyy_auth_err",
            (err && (err.message || err.code)) || String(err)
          );
        } catch (e) {}
        console.error("[Nailong Auth] getRedirectResult", err);
        _redirectDone = true;
        _redirectUser = null;
        throw err;
      }

      // Tunggu currentUser / auth state
      var user = auth.currentUser || (await waitAuthReady(auth));
      _redirectUser = user || null;
      _redirectDone = true;
      try {
        sessionStorage.removeItem(AUTH_PENDING_KEY);
        localStorage.removeItem(AUTH_PENDING_KEY);
      } catch (e) {}
      return _redirectUser;
    })();

    return _redirectPromise;
  }

  async function logout() {
    var auth = ensureAuth();
    if (!auth) return;
    await auth.signOut();
    _redirectUser = null;
  }

  function onAuthChange(fn) {
    var auth = ensureAuth();
    if (!auth) {
      fn(null);
      return function () {};
    }
    return auth.onAuthStateChanged(fn);
  }

  window.VoxyyAuth = {
    getCurrentUser: currentUser,
    ensureAuth: ensureAuth,
    currentUser: currentUser,
    loginGoogle: loginGoogle,
    logout: logout,
    onAuthChange: onAuthChange,
    handleRedirectResult: handleRedirectResult,
    getClientId: getClientId,
    waitAuthReady: function () {
      return waitAuthReady(ensureAuth());
    }
  };
})();
