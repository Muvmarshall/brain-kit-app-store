/* Minimal fetch client for Brain Kit household API. Does not replace BKStore offline. */
(function (global) {
  var SESSION_KEY = "BK_API_SESSION";

  function origin() {
    return (global.BKConfig && global.BKConfig.apiOrigin) || "http://localhost:8787";
  }

  function getSession() {
    try {
      var raw = global.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    try {
      if (!session) {
        global.localStorage.removeItem(SESSION_KEY);
      } else {
        global.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } catch (e) { /* ignore */ }
    return session;
  }

  function clearSession() {
    return setSession(null);
  }

  function accessToken() {
    var s = getSession();
    return s && s.accessToken ? s.accessToken : null;
  }

  function rememberTokens(data) {
    if (!data || !data.accessToken) return data;
    var prev = getSession() || {};
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken != null ? data.refreshToken : prev.refreshToken,
      expiresIn: data.expiresIn,
      tokenType: data.tokenType || "Bearer",
      user: data.user != null ? data.user : prev.user,
      householdId: data.householdId != null ? data.householdId : prev.householdId
    });
    return data;
  }

  function ApiError(status, body) {
    var err = new Error((body && (body.message || body.error)) || ("HTTP " + status));
    err.name = "BKApiError";
    err.status = status;
    err.body = body;
    err.code = body && body.error;
    return err;
  }

  async function request(method, path, opts) {
    opts = opts || {};
    var headers = Object.assign({ Accept: "application/json" }, opts.headers || {});
    var body = opts.body;
    if (body != null && typeof body !== "string") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    if (opts.auth !== false) {
      var token = accessToken();
      if (token) headers.Authorization = "Bearer " + token;
    }
    var res = await fetch(origin() + path, {
      method: method,
      headers: headers,
      body: body
    });
    var text = await res.text();
    var parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = { raw: text };
      }
    }
    if (!res.ok) throw ApiError(res.status, parsed || { error: "http_error", message: res.statusText });
    return parsed;
  }

  async function signup(email, password, pin) {
    var data = await request("POST", "/auth/signup", {
      auth: false,
      body: { email: email, password: password, pin: pin }
    });
    return rememberTokens(data);
  }

  async function login(email, password) {
    var data = await request("POST", "/auth/login", {
      auth: false,
      body: { email: email, password: password }
    });
    return rememberTokens(data);
  }

  async function refresh() {
    var s = getSession();
    if (!s || !s.refreshToken) throw ApiError(401, { error: "no_refresh", message: "No refresh token in session" });
    var data = await request("POST", "/auth/refresh", {
      auth: false,
      body: { refreshToken: s.refreshToken }
    });
    return rememberTokens(data);
  }

  async function pinVerify(pin) {
    return request("POST", "/auth/pin/verify", { body: { pin: pin } });
  }

  async function giveConsent(mode) {
    return request("POST", "/consent", { body: { mode: mode || "consumer" } });
  }

  async function getConsent() {
    return request("GET", "/consent");
  }

  async function listStudents() {
    return request("GET", "/students");
  }

  async function createStudent(name, grade) {
    return request("POST", "/students", { body: { name: name, grade: grade } });
  }

  async function patchStudent(id, patch) {
    return request("PATCH", "/students/" + encodeURIComponent(id), { body: patch || {} });
  }

  async function deleteStudent(id) {
    return request("DELETE", "/students/" + encodeURIComponent(id));
  }

  /** Progress upsert: { studentId, idempotencyKey, progressScore, payload } */
  async function sync(body) {
    return request("POST", "/sync", { body: body });
  }

  async function health() {
    return request("GET", "/health", { auth: false });
  }

  var BKApi = {
    sessionKey: SESSION_KEY,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    accessToken: accessToken,
    request: request,
    signup: signup,
    login: login,
    refresh: refresh,
    pinVerify: pinVerify,
    giveConsent: giveConsent,
    getConsent: getConsent,
    listStudents: listStudents,
    createStudent: createStudent,
    patchStudent: patchStudent,
    deleteStudent: deleteStudent,
    sync: sync,
    health: health
  };

  global.BKApi = BKApi;
})(window);
