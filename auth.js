/**
 * Nailong Auth - Google via Firebase Auth (popup + redirect fallback)
 * Tidak bergantung OAuth Client ID project lain → hindari origin_mismatch
 */
(function () {
  function ensureAuth() {
    if (typeof firebase === "undefined") return null;
    if (!window.VoxyyOrders || !window.VoxyyOrders.isGlobalConfigured()) return null;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(window.VoxyyOrders.FIREBASE_CONFIG || {});
      }
      if (window.VoxyyOrders.initFirebase) window.VoxyyOrders.initFirebase();
      const auth = firebase.auth();
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
    const auth = ensureAuth();
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
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    provider.addScope("email");
    provider.addScope("profile");
    return provider;
  }

  /** Login Google: mobile → redirect, desktop → popup dulu */
  function loginGoogle() {
    return new Promise(function (resolve, reject) {
      const auth = ensureAuth();
      if (!auth) {
        reject(
          new Error(
            "Firebase belum siap. Cek global-orders.js dan koneksi internet."
          )
        );
        return;
      }

      const provider = googleProvider();

      function doRedirect() {
        try {
          sessionStorage.setItem("nailong_auth_pending", "1");
        } catch (e) {}
        auth.signInWithRedirect(provider).catch(function (err) {
          reject(err);
        });
        // redirect akan pindah halaman; resolve lewat handleRedirectResult
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
          // Popup diblokir / gagal → fallback redirect
          if (
            code.indexOf("popup") !== -1 ||
            code.indexOf("cancelled") !== -1 ||
            code.indexOf("blocked") !== -1
          ) {
            doRedirect();
            return;
          }
          reject(err);
        });
    });
  }

  async function handleRedirectResult() {
    const auth = ensureAuth();
    if (!auth) return null;
    try {
      const result = await auth.getRedirectResult();
      try {
        sessionStorage.removeItem("nailong_auth_pending");
      } catch (e) {}
      if (result && result.user) return result.user;
      return null;
    } catch (err) {
      try {
        sessionStorage.setItem(
          "voxyy_auth_err",
          (err && (err.message || err.code)) || String(err)
        );
      } catch (e) {}
      throw err;
    }
  }

  async function logout() {
    const auth = ensureAuth();
    if (!auth) return;
    await auth.signOut();
  }

  function onAuthChange(fn) {
    const auth = ensureAuth();
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
    getClientId: getClientId
  };
})();
