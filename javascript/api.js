/* ==========================================================================
   FinGuard – API client
   Talks to the live backend documented at
   https://documenter.getpostman.com/view/2449601/2sBYAsyCFz

   Base URL : https://finguard-api-n71k.onrender.com/api
   Auth     : JWT bearer token from POST /users/login

   Verified against the live server on 2026-09-19. Endpoints below are the
   ones that actually exist and respond on production:

     POST   /users/register             { firstName, lastName, email, password }
     POST   /auth/send-otp              { email }
     POST   /auth/verify-otp            { email, otp }
     POST   /auth/resend-otp            { email }
     POST   /auth/forgot-password       { email }
     POST   /auth/reset-password        { email, otp, newPassword }  (newPassword >= 12 chars)
     POST   /users/login                { email, password } -> { token, user }

     GET    /debts
     POST   /debts                      { lenderName, debtType, outstandingBalance, monthlyRepayment }
     PUT    /debts/:id
     DELETE /debts/:id

     POST   /financial-profiles         { monthlyIncome, recurringExpenses, additionalIncome, accountBalance, currency }
     -- GET/PUT/DELETE /financial-profiles are NOT deployed yet (404). Use the
        POST response directly, or read the profile back off an analysis
        (an analysis embeds the full financialProfileId object).

     POST   /analyses                   generate a fresh analysis from the
                                         user's current profile + debts
     GET    /analyses                   list past analyses (newest last)
     GET    /analyses/:id
     PUT    /analyses/:id               { riskLevel } etc.
     DELETE /analyses/:id

     GET    /notifications
   ========================================================================== */

(function (global) {
  "use strict";

  var BASE_URL = "https://finguard-api-n71k.onrender.com/api";

  var STORAGE = {
    token: "fg_token",
    user: "fg_user",
    profileId: "fg_profile_id",
    profile: "fg_profile_cache",
  };

  /* ----------------------------- session ------------------------------- */

  function getToken() {
    try {
      return localStorage.getItem(STORAGE.token) || "";
    } catch (e) {
      return "";
    }
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.user) || "null");
    } catch (e) {
      return null;
    }
  }

  function getProfileId() {
    try {
      return localStorage.getItem(STORAGE.profileId) || "";
    } catch (e) {
      return "";
    }
  }

  function setSession(data) {
    try {
      if (data && data.token) localStorage.setItem(STORAGE.token, data.token);
      if (data && data.user)
        localStorage.setItem(STORAGE.user, JSON.stringify(data.user));
    } catch (e) {
      /* storage unavailable – nothing we can do */
    }
  }

  function setProfileId(id) {
    try {
      if (id) localStorage.setItem(STORAGE.profileId, id);
    } catch (e) {}
  }

  // The server has no "get my financial profile" route, so we keep the most
  // recent copy we were handed (from creating it, or from an analysis, which
  // embeds the full profile) around locally as a best-effort cache.
  function cacheProfile(profile) {
    try {
      if (profile && typeof profile === "object") {
        localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
        if (profile._id) setProfileId(profile._id);
      }
    } catch (e) {}
  }

  function getCachedProfile() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.profile) || "null");
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE.token);
      localStorage.removeItem(STORAGE.user);
      localStorage.removeItem(STORAGE.profileId);
      localStorage.removeItem(STORAGE.profile);
    } catch (e) {}
  }

  function isAuthed() {
    return !!getToken();
  }

  /* ------------------------------ errors ------------------------------- */

  function ApiError(message, status, payload) {
    this.name = "ApiError";
    this.message = message || "Something went wrong. Please try again.";
    this.status = status || 0;
    this.payload = payload || null;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function messageFrom(payload, status) {
    if (payload && typeof payload === "object") {
      var m =
        payload.message ||
        payload.error ||
        (Array.isArray(payload.errors) &&
          payload.errors[0] &&
          (payload.errors[0].msg || payload.errors[0].message)) ||
        (Array.isArray(payload.error) && payload.error[0]) ||
        null;
      if (m) return m;
    } else if (typeof payload === "string") {
      var s = payload.trim();
      // Ignore Express' default HTML error pages – never show raw markup.
      var isHtml = /^<(!doctype|html|pre)/i.test(s) || s.indexOf("<pre>") !== -1;
      if (s && !isHtml && s.length < 200) return s;
    }

    if (status === 0) return "Cannot reach the server. Check your connection.";
    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 404) return "That feature isn't available on the server yet.";
    if (status >= 500)
      return "The server had a problem with that request. Please try again later.";
    return "Request failed (" + status + ").";
  }

  /* ---------------------------- core fetch ----------------------------- */

  function request(path, options) {
    options = options || {};
    var url = BASE_URL + path;
    var headers = { Accept: "application/json" };

    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    if (options.auth !== false) {
      var token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
    }

    return fetch(url, {
      method: options.method || "GET",
      headers: headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
      .then(function (res) {
        var isJson = (res.headers.get("content-type") || "").indexOf(
          "application/json"
        ) !== -1;
        return (isJson ? res.json() : res.text())
          .catch(function () {
            return null;
          })
          .then(function (payload) {
            if (!res.ok) {
              if (res.status === 401) clearSession();
              throw new ApiError(
                messageFrom(payload, res.status),
                res.status,
                payload
              );
            }
            return payload;
          });
      })
      .catch(function (err) {
        if (err instanceof ApiError) throw err;
        // network / CORS / DNS failure
        throw new ApiError(messageFrom(null, 0), 0, null);
      });
  }

  // Controllers wrap results as { success, message, data }. Return `data`
  // when present, otherwise the raw payload.
  function unwrap(payload) {
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  }

  /* ----------------------------- resources ---------------------------- */

  var api = {
    baseUrl: BASE_URL,
    request: request,

    // ---- auth --------------------------------------------------------
    register: function (data) {
      return request("/users/register", {
        method: "POST",
        auth: false,
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        },
      });
    },

    sendOtp: function (data) {
      return request("/auth/send-otp", {
        method: "POST",
        auth: false,
        body: { email: data.email },
      }).then(unwrap);
    },

    resendOtp: function (data) {
      return request("/auth/resend-otp", {
        method: "POST",
        auth: false,
        body: { email: data.email },
      }).then(unwrap);
    },

    verifyOtp: function (data) {
      return request("/auth/verify-otp", {
        method: "POST",
        auth: false,
        body: { email: data.email, otp: data.otp },
      }).then(function (payload) {
        var result = unwrap(payload);
        if (result && result.token) setSession(result);
        return result;
      });
    },

    forgotPassword: function (data) {
      return request("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email: data.email },
      }).then(unwrap);
    },

    resetPassword: function (data) {
      return request("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: {
          email: data.email,
          otp: data.otp,
          newPassword: data.newPassword,
        },
      }).then(unwrap);
    },

    login: function (data) {
      return request("/users/login", {
        method: "POST",
        auth: false,
        body: { email: data.email, password: data.password },
      }).then(function (payload) {
        setSession(payload);
        return payload;
      });
    },

    // ---- debts ---------------------------------------------------------
    getDebts: function () {
      return request("/debts").then(unwrap);
    },
    createDebt: function (debt) {
      return request("/debts", { method: "POST", body: debt }).then(unwrap);
    },
    updateDebt: function (id, debt) {
      return request("/debts/" + id, { method: "PUT", body: debt }).then(unwrap);
    },
    deleteDebt: function (id) {
      return request("/debts/" + id, { method: "DELETE" });
    },

    // ---- financial profile ---------------------------------------------
    // NOTE: there is no working "get my profile" route on the server yet
    // (GET /financial-profiles 404s). createFinancialProfile caches the
    // full object it gets back so the rest of the app can read it locally;
    // getFinancialProfile() falls back to that cache.
    createFinancialProfile: function (profile) {
      return request("/financial-profiles", {
        method: "POST",
        body: profile,
      }).then(function (payload) {
        var data = unwrap(payload);
        cacheProfile(data);
        return data;
      });
    },

    getFinancialProfile: function () {
      var cached = getCachedProfile();
      if (cached) return Promise.resolve(cached);
      return Promise.reject(
        new ApiError(
          "No financial profile on file yet. Complete the assessment first.",
          404,
          null
        )
      );
    },

    // ---- analyses (DTI, cashflow buffer, risk level, recommendations) --
    // POST regenerates a fresh analysis from the user's current profile +
    // debts. It 404s with a clear message if there is no financial profile.
    generateAnalysis: function () {
      return request("/analyses", { method: "POST", body: {} }).then(
        function (payload) {
          var data = unwrap(payload);
          if (data && data.financialProfileId) cacheProfile(data.financialProfileId);
          return data;
        }
      );
    },
    getAnalyses: function () {
      return request("/analyses").then(unwrap);
    },
    getLatestAnalysis: function () {
      return api.getAnalyses().then(function (list) {
        if (!list || !list.length) return null;
        // Sort defensively – don't assume the server's ordering.
        var sorted = list.slice().sort(function (a, b) {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        var latest = sorted[0];
        if (latest && latest.financialProfileId) {
          cacheProfile(latest.financialProfileId);
        }
        return latest;
      });
    },
    getAnalysis: function (id) {
      return request("/analyses/" + id).then(unwrap);
    },
    updateAnalysis: function (id, patch) {
      return request("/analyses/" + id, { method: "PUT", body: patch }).then(
        unwrap
      );
    },
    deleteAnalysis: function (id) {
      return request("/analyses/" + id, { method: "DELETE" });
    },

    // ---- notifications ---------------------------------------------------
    getNotifications: function () {
      return request("/notifications").then(unwrap);
    },
  };

  /* -------------------------- route guards ---------------------------- */

  function requireAuth(loginPath) {
    if (!isAuthed()) {
      window.location.replace(loginPath || "signin.html");
      return false;
    }
    return true;
  }

  function redirectIfAuthed(target) {
    if (isAuthed()) {
      window.location.replace(target || "cashflow-buffer.html");
      return true;
    }
    return false;
  }

  /* ----------------------------- exports ------------------------------ */

  global.FinGuard = {
    api: api,
    ApiError: ApiError,
    session: {
      getToken: getToken,
      getUser: getUser,
      getProfileId: getProfileId,
      setProfileId: setProfileId,
      isAuthed: isAuthed,
      clear: clearSession,
    },
    requireAuth: requireAuth,
    redirectIfAuthed: redirectIfAuthed,
  };
})(window);
