/**
 * Nailong Auth - Google via Identity Services (tanpa redirect/popup blank)
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
      console.error("[Voxyy Auth]", e);
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

  /** Login pakai Google Identity Services (ID token → Firebase) */
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
      const clientId = getClientId();
      if (!clientId || clientId.length < 20) {
        reject(
          new Error(
            "GOOGLE_WEB_CLIENT_ID masih kosong.\n\nAmbil di:\nconsole.cloud.google.com → APIs & Services → Credentials\n→ Web client (auto created by Google Service)\n→ copy Client ID\n→ tempel di global-orders.js"
          )
        );
        return;
      }
      if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
        reject(
          new Error(
            "Google script belum termuat. Refresh halaman lalu coba lagi."
          )
        );
        return;
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: function (tokenResponse) {
          if (!tokenResponse || tokenResponse.error) {
            reject(
              new Error(
                (tokenResponse && tokenResponse.error) ||
                  "Login Google dibatalkan"
              )
            );
            return;
          }
          const credential = firebase.auth.GoogleAuthProvider.credential(
            null,
            tokenResponse.access_token
          );
          auth
            .signInWithCredential(credential)
            .then(function (result) {
              resolve(result.user);
            })
            .catch(function (err) {
              reject(err);
            });
        },
        error_callback: function (err) {
          reject(err || new Error("Gagal membuka Google login"));
        }
      });

      try {
        tokenClient.requestAccessToken({ prompt: "select_account" });
      } catch (e) {
        reject(e);
      }
    });
  }

  async function handleRedirectResult() {
    // GIS tidak pakai redirect
    return null;
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
    ensureAuth,
    currentUser,
    loginGoogle,
    logout,
    onAuthChange,
    handleRedirectResult,
    getClientId
  };
})();
