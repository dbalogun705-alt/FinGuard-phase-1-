/* ==========================================================================
   FinGuard – API client
   Talks to the live backend documented at
   https://documenter.getpostman.com/view/2449601/2sBYAsyCFz

   Base URL : https://finguard-api-n71k.onrender.com/api
   Auth     : JWT bearer token from POST /users/login
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
      if (data && data.token) {
        localStorage.setItem(STORAGE.token, data.token);
      }

      if (data && data.user) {
        localStorage.setItem(
          STORAGE.user,
          JSON.stringify(data.user)
        );
      }
    } catch (e) {
      /* storage unavailable – nothing we can do */
    }
  }

  function setProfileId(id) {
    try {
      if (id) {
        localStorage.setItem(STORAGE.profileId, id);
      }
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
    this.message =
      message ||
      "Something went wrong. Please try again.";
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
          (payload.errors[0].msg ||
            payload.errors[0].message)) ||
        null;

      if (m) return m;
    } else if (typeof payload === "string") {
      var s = payload.trim();

      var isHtml =
        /^<(!doctype|html|pre)/i.test(s) ||
        s.indexOf("<pre>") !== -1;

      if (s && !isHtml && s.length < 200) {
        return s;
      }
    }

    if (status === 0) {
      return "Cannot reach the server. Check your connection.";
    }

    if (status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (status === 404) {
      return "That feature isn't available on the server yet.";
    }

    if (status >= 500) {
      return "The server had a problem with that request. Please try again later.";
    }

    return "Request failed (" + status + ").";
  }

  /* ---------------------------- core fetch ----------------------------- */

  function request(path, options) {
    options = options || {};

    var url = BASE_URL + path;

    var headers = {
      Accept: "application/json",
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false) {
      var token = getToken();

      if (token) {
        headers.Authorization = "Bearer " + token;
      }
    }

    return fetch(url, {
      method: options.method || "GET",
      headers: headers,
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    })
      .then(function (res) {
        var isJson =
          (res.headers.get("content-type") || "").indexOf(
            "application/json"
          ) !== -1;

        return (isJson ? res.json() : res.text())
          .catch(function () {
            return null;
          })
          .then(function (payload) {
            if (!res.ok) {
              if (res.status === 401) {
                clearSession();
              }

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
        if (err instanceof ApiError) {
          throw err;
        }

        throw new ApiError(
          messageFrom(null, 0),
          0,
          null
        );
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

    sendOtp: function (data) {
      return request("/auth/send-otp", {
        method: "POST",
        auth: false,
        body: {
          email: data.email,
        },
      }).then(unwrap);
    },

    verifyOtp: function (data) {
      return request("/auth/verify-otp", {
        method: "POST",
        auth: false,
        body: {
          email: data.email,
          otp: data.otp,
        },
      }).then(function (payload) {
        var result = unwrap(payload);

        if (result && result.token) {
          setSession(result);
        }

        return result;
      });
    },

    login: function (data) {
      return request("/users/login", {
        method: "POST",
        auth: false,
        body: {
          email: data.email,
          password: data.password,
        },
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
      return request("/debts", {
        method: "POST",
        body: debt,
      }).then(unwrap);
    },

    updateDebt: function (id, debt) {
      return request("/debts/" + id, {
        method: "PUT",
        body: debt,
      }).then(unwrap);
    },

    deleteDebt: function (id) {
      return request("/debts/" + id, {
        method: "DELETE",
      });
    },

    // financial profile
    createFinancialProfile: function (profile) {
      return request("/financial-profile", {
        method: "POST",
        body: profile,
      }).then(function (payload) {
        var data = unwrap(payload);

        if (data && data._id) {
          setProfileId(data._id);
        }

        return data;
      });
    },

    /*
     * ADDED FOR ASSESSMENT EXPENSES
     *
     * The Postman documentation shows:
     * POST /api/financial-profiles
     *
     * This is kept separate from the original teammate function above.
     */
    createAssessmentFinancialProfile: function (profile) {
      return request("/financial-profiles", {
        method: "POST",
        body: profile,
      }).then(function (payload) {
        var data = unwrap(payload);

        if (data && data._id) {
          setProfileId(data._id);
        }

        return data;
      });
    },

    getFinancialProfile: function (id) {
      return request(
        "/financial-profile/" +
          (id || getProfileId())
      ).then(unwrap);
    },

    updateFinancialProfile: function (id, profile) {
      return request(
        "/financial-profile/" +
          (id || getProfileId()),
        {
          method: "PUT",
          body: profile,
        }
      ).then(unwrap);
    },

    deleteFinancialProfile: function (id) {
      return request(
        "/financial-profile/" +
          (id || getProfileId()),
        {
          method: "DELETE",
        }
      ).then(unwrap);
    },

    // analyses
    calculateDebtToIncomeRatio: function (profileId) {
      return request(
        "/analyses/debt-to-income-ratio/" +
          (profileId || getProfileId())
      ).then(unwrap);
    },

    calculateCashflowBuffer: function (profileId) {
      return request(
        "/analyses/cashflow-buffer/" +
          (profileId || getProfileId())
      ).then(unwrap);
    },

    analyzeRiskLevel: function (profileId) {
      return request(
        "/analyses/risk-level/" +
          (profileId || getProfileId())
      ).then(unwrap);
    },

    getFinancialHealthScore: function (profileId) {
      return request(
        "/analyses/health-score/" +
          (profileId || getProfileId())
      ).then(unwrap);
    },

    getShortfallForecast: function (profileId, months) {
      var path =
        "/analyses/shortfall-forecast/" +
        (profileId || getProfileId());

      if (months) {
        path += "?months=" + months;
      }

      return request(path).then(unwrap);
    },

    getRecommendations: function (profileId) {
      return request(
        "/analyses/recommendations/" +
          (profileId || getProfileId())
      ).then(unwrap);
    },
  };

  // Controllers wrap results as:
  // { success, message, data }
  function unwrap(payload) {
    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload
    ) {
      return payload.data;
    }

    return payload;
  }

  /* -------------------------- route guards ---------------------------- */

  function requireAuth(loginPath) {
    if (!isAuthed()) {
      window.location.replace(
        loginPath || "signin.html"
      );

      return false;
    }

    return true;
  }

  function redirectIfAuthed(target) {
    if (isAuthed()) {
      window.location.replace(
        target || "cashflow-buffer.html"
      );

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