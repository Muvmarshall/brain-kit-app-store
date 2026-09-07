/* Accessibility + offline packs. Not an afterthought. */
(function (global) {
  const KEY = "brainkit.a11y.v1";

  const I18N = {
    en: {
      parentHq: "Parent HQ",
      oneCard: "One card. One sentence.",
      deeper: "One tap deeper",
      weekly: "Send this week’s note",
      settings: "Settings",
      profiles: "Add or remove profiles",
      parentSignIn: "I'm the parent",
      speak: "Listen",
      stop: "Stop",
      offline: "Offline pack",
      downloaded: "Downloaded",
      localeName: "English",
      parentIntro: "Parent PIN opens Parent HQ, mastery, profiles, and billing.",
      weeklyTitle: "Same sentences. Nothing extra.",
      consentTitle: "One checkbox. Then a child.",
      newHousehold: "Start a new household",
      demoFamily: "Reload demo family"
    },
    es: {
      parentHq: "Central de padres",
      oneCard: "Una tarjeta. Una frase.",
      deeper: "Un toque más",
      weekly: "Enviar la nota de la semana",
      settings: "Ajustes",
      profiles: "Agregar o quitar perfiles",
      parentSignIn: "Soy el padre o la madre",
      speak: "Escuchar",
      stop: "Parar",
      offline: "Paquete sin conexión",
      downloaded: "Descargado",
      localeName: "Español",
      parentIntro: "El PIN de padres abre la Central, el dominio, los perfiles y la facturación.",
      weeklyTitle: "Las mismas frases. Nada más.",
      consentTitle: "Una casilla. Después, un niño.",
      newHousehold: "Crear un hogar nuevo",
      demoFamily: "Recargar la familia de demostración"
    }
  };

  function defaults() {
    return {
      locale: "en",
      dyslexia: false,
      quiet: false,
      contrast: "default",
      textScale: 1,
      lineHeight: 1.45,
      extendedTime: false,
      offlineOnly: false
    };
  }

  function load() {
    try {
      return { ...defaults(), ...(JSON.parse(localStorage.getItem(KEY) || "{}") || {}) };
    } catch {
      return defaults();
    }
  }

  const prefs = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function t(key) {
    const pack = I18N[prefs.locale] || I18N.en;
    return pack[key] || I18N.en[key] || key;
  }

  function apply() {
    const b = document.body;
    if (!b) return;
    b.classList.toggle("dyslexia", !!prefs.dyslexia);
    b.classList.toggle("low-stim", !!prefs.quiet);
    b.classList.toggle("contrast-high", prefs.contrast === "high");
    b.classList.toggle("locale-es", prefs.locale === "es");
    b.style.setProperty("--text-scale", String(prefs.textScale || 1));
    b.style.setProperty("--line-height", String(prefs.lineHeight || 1.45));
    b.setAttribute("lang", prefs.locale === "es" ? "es" : "en");
  }

  function speak(text) {
    if (!text || !global.speechSynthesis) return { ok: false, reason: "no-tts" };
    global.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = prefs.locale === "es" ? "es-US" : "en-US";
    u.rate = prefs.dyslexia ? 0.9 : 1;
    global.speechSynthesis.speak(u);
    return { ok: true };
  }

  function stopSpeak() {
    if (global.speechSynthesis) global.speechSynthesis.cancel();
  }

  function sessionMs(base) {
    return prefs.extendedTime ? base * 2 : base;
  }

  function buildPack(student) {
    const skills = (global.BKEngine.visibleSkills(student) || []).map((sk) => ({
      id: sk.id,
      subject: sk.subject,
      grade_band: sk.grade_band,
      skill_name: sk.skill_name,
      question_bank: sk.question_bank,
      teach_content: sk.teach_content,
      status: sk.status,
      standard_code: sk.standard_code,
      prerequisite_skills: sk.prerequisite_skills,
      strand: sk.strand,
      grade_or_course: sk.grade_or_course
    }));
    const pack = {
      studentId: student.id,
      grade: student.grade,
      at: Date.now(),
      skillIds: skills.map((s) => s.id),
      skills,
      pending: []
    };
    const hh = global.BKStore.state;
    if (!hh.offlinePacks) hh.offlinePacks = {};
    hh.offlinePacks[student.id] = pack;
    global.BKStore.persist();
    savePackIdb(pack);
    return pack;
  }

  function savePackIdb(pack) {
    if (!global.indexedDB) return;
    try {
      const req = global.indexedDB.open("brainkit-offline", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("packs");
      req.onsuccess = () => {
        const tx = req.result.transaction("packs", "readwrite");
        tx.objectStore("packs").put(pack, pack.studentId);
      };
    } catch (err) { /* localStorage pack already saved */ }
  }

  function packFor(studentId) {
    const hh = global.BKStore && global.BKStore.state;
    return hh && hh.offlinePacks ? hh.offlinePacks[studentId] : null;
  }

  function queueSync(studentId, event) {
    const pack = packFor(studentId);
    if (!pack) return;
    pack.pending.push({ ...event, at: Date.now() });
    global.BKStore.persist();
  }

  function syncNow(studentId) {
    const pack = packFor(studentId);
    if (!pack) return { ok: false, synced: 0 };
    const n = pack.pending.length;
    pack.pending = [];
    pack.lastSync = Date.now();
    global.BKStore.persist();
    return { ok: true, synced: n };
  }

  function inPack(studentId, skillId) {
    const pack = packFor(studentId);
    return !!(pack && pack.skillIds.indexOf(skillId) !== -1);
  }

  global.BKA11y = {
    prefs,
    I18N,
    t,
    apply,
    save,
    speak,
    stopSpeak,
    sessionMs,
    buildPack,
    packFor,
    queueSync,
    syncNow,
    inPack
  };
})(window);
