/* API origin for Brain Kit cloud backend. Offline local store is unaffected. */
(function (global) {
  var STORAGE_KEY = "BK_API_ORIGIN";
  var DEFAULT_ORIGIN = "http://localhost:8787";

  function readOrigin() {
    try {
      var v = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (v && typeof v === "string" && v.trim()) return v.trim().replace(/\/$/, "");
    } catch (e) { /* private mode / blocked storage */ }
    return DEFAULT_ORIGIN;
  }

  var BKConfig = {
    apiOrigin: readOrigin(),
    /** Persist a custom origin (e.g. staging). Pass null/empty to reset to default. */
    setApiOrigin: function (origin) {
      try {
        if (!origin) {
          global.localStorage.removeItem(STORAGE_KEY);
        } else {
          global.localStorage.setItem(STORAGE_KEY, String(origin).trim().replace(/\/$/, ""));
        }
      } catch (e) { /* ignore */ }
      BKConfig.apiOrigin = readOrigin();
      return BKConfig.apiOrigin;
    },
    originKey: STORAGE_KEY,
    defaultOrigin: DEFAULT_ORIGIN
  };

  global.BKConfig = BKConfig;
})(window);
