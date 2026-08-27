/* ==========================================================================
   FinGuard – API client
   Talks to the live backend documented at
   https://documenter.getpostman.com/view/2449601/2sBYAsyCFz

   Base URL : https://finguard-api-n71k.onrender.com/api
   Auth     : JWT bearer token from POST /users/login
   ==========================================================================

   Endpoints currently wired:
     POST   /users/register            { firstName, lastName, email, password }
     POST   /users/login               { email, password } -> { token, user }
     GET    /debts
     POST   /debts                     { lenderName, debtType,
                                         outstandingBalance, monthlyRepayment }
     PUT    /debts/:id
     DELETE /debts/:id
     POST   /financial-profile         { monthlyIncome, recurringExpenses,
                                         additionalIncome, accountBalance,
                                         currency }
     GET    /financial-profile/:id

   NOT wired yet (waiting on the backend team):
     - email / phone verification (no OTP endpoint exists)
     - a cashflow-buffer endpoint / official buffer formula
     - a "get my financial profile" route that doesn't need an id
   ========================================================================== */

(function (global) {
  "use strict";

  var BASE_URL = "https://finguard-api-n71k.onrender.com/api";

  var STORAGE = {
    token: "fg_token",
    user: "fg_user",
    profileId: "fg_profile_id",
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

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE.token);
      localStorage.removeItem(STORAGE.user);
      localStorage.removeItem(STORAGE.profileId);
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
      // backend uses a few different shapes
      var m =
        payload.message ||
        payload.error ||
        (Array.isArray(payload.errors) &&
          payload.errors[0] &&
          (payload.errors[0].msg || payload.errors[0].message)) ||
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
    if (status === 404)
      return "That feature isn't available on the server yet.";
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

  /* ----------------------------- resources ---------------------------- */

  var api = {
    baseUrl: BASE_URL,
    request: request,

    // auth
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

    // debts
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

    // financial profile
    createFinancialProfile: function (profile) {
      return request("/financial-profile", {
        method: "POST",
        body: profile,
      }).then(function (payload) {
        var data = unwrap(payload);
        if (data && data._id) setProfileId(data._id);
        return data;
      });
    },
    getFinancialProfile: function (id) {
      return request("/financial-profile/" + (id || getProfileId())).then(unwrap);
    },
  };

  // Controllers wrap results as { success, message, data }. Return `data`
  // when present, otherwise the raw payload.
  function unwrap(payload) {
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  }

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
