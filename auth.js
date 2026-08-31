/**
 * Nailong Auth - Google via Firebase Auth (popup + redirect)
 * Mobile: redirect. Desktop: popup, fallback redirect.
 */
(function () {
  var AUTH_PENDING_KEY = "nailong_auth_pending";

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
      // Firebase v9+ compat kadang punya authStateReady
      if (typeof auth.authStateReady === "function") {
        auth
          .authStateReady()
          .then(function () {
            resolve(auth.currentUser);
          })
          .catch(function () {
            resolve(auth.currentUser);
          });
        return;
      }
      var unsub = auth.onAuthStateChanged(function (user) {
        try {
          unsub();
        } catch (e) {}
        resolve(user || null);
      });
      setTimeout(function () {
        try {
          unsub();
        } catch (e) {}
        resolve(auth.currentUser || null);
      }, 4000);
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
          } catch (e) {}
          reject(err);
        });
      }

      if (isMobile()) {
        doRedirect();
        return;
      }

      auth
        .signInWithPopup(provider)
        .then(function (result) {
          resolve(result.user);
        })
        .catch(function (err) {
          var code = (err && err.code) || "";
          var msg = (err && err.message) || "";
          if (
            code.indexOf("popup") !== -1 ||
            code.indexOf("cancelled-popup") !== -1 ||
            /blocked|popup/i.test(msg)
          ) {
            doRedirect();
            return;
          }
          reject(err);
        });
    });
  }

  async function handleRedirectResult() {
    var auth = ensureAuth();
    if (!auth) return null;

    var pending = false;
    try {
      pending =
        sessionStorage.getItem(AUTH_PENDING_KEY) === "1" ||
        localStorage.getItem(AUTH_PENDING_KEY) === "1";
    } catch (e) {}

    try {
      var result = await auth.getRedirectResult();
      try {
        sessionStorage.removeItem(AUTH_PENDING_KEY);
        localStorage.removeItem(AUTH_PENDING_KEY);
      } catch (e) {}

      if (result && result.user) return result.user;

      // Kadang getRedirectResult null, tapi currentUser sudah ada
      if (auth.currentUser) return auth.currentUser;

      // Tunggu auth state (penting di HP)
      var user = await waitAuthReady(auth);
      if (user) return user;

      if (pending) {
        // Masih pending tapi user null → kemungkinan gagal diam-diam
        console.warn("[Nailong Auth] Redirect selesai tapi user null");
      }
      return null;
    } catch (err) {
      try {
        sessionStorage.setItem(
          "voxyy_auth_err",
          (err && (err.message || err.code)) || String(err)
        );
        sessionStorage.removeItem(AUTH_PENDING_KEY);
        localStorage.removeItem(AUTH_PENDING_KEY);
      } catch (e) {}
      console.error("[Nailong Auth] redirect error", err);
      throw err;
    }
  }

  async function logout() {
    var auth = ensureAuth();
    if (!auth) return;
    await auth.signOut();
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
