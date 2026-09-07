/* Routing-layer access control.
   Two mechanisms, never merged:
     1. Parental gate — ephemeral word-number challenge. No stored secret.
     2. Parent PIN — 4-digit household code set at signup.
   Age tier only changes WHICH routes ask for WHICH gate. */
(function (global) {
  const PARENTAL_TTL_MS = 8 * 60 * 1000;
  const PARENT_PIN_TTL_MS = 20 * 60 * 1000;
  const RECOVERY_TTL_MS = 15 * 60 * 1000;

  const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

  function wordsFor(n) {
    n = Number(n);
    if (n < 20) return ONES[n];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o ? TENS[t] + "-" + ONES[o] : TENS[t];
    }
    if (n === 100) return "one hundred";
    return String(n);
  }

  function normalizeWords(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z\s-]/g, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pinHash(pin) {
    const s = "brainkit.pin.v1:" + String(pin);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }

  function isFourDigit(pin) {
    return /^\d{4}$/.test(String(pin || ""));
  }

  function tierForGrade(grade) {
    const n = global.BK_gradeNumber ? global.BK_gradeNumber(grade) : Number(grade) || 0;
    if (n <= 5) return "k5";
    if (n <= 8) return "middles";
    return "hs";
  }

  /* Session only — never written to disk. */
  const session = {
    actor: "locked",
    studentId: null,
    parentPinUntil: 0,
    studentUnlock: {},
    parentalUntil: 0,
    parentalPurpose: null,
    lastChallenge: null,
    teacherUntil: 0
  };

  function now() {
    return Date.now();
  }

  function parentPinFresh() {
    return now() < session.parentPinUntil;
  }

  function parentalFresh(purpose) {
    if (now() >= session.parentalUntil) return false;
    if (!purpose) return true;
    return !session.parentalPurpose || session.parentalPurpose === purpose || session.parentalPurpose === "*";
  }

  function studentUnlocked(id) {
    return !!session.studentUnlock[id];
  }

  function mintParentalChallenge() {
    const catalog = [
      { kind: "spell", n: 64 },
      { kind: "spell", n: 47 },
      { kind: "spell", n: 81 },
      { kind: "spell", n: 53 },
      { kind: "sum", a: 19, b: 12 },
      { kind: "sum", a: 27, b: 14 },
      { kind: "minus", a: 90, b: 18 }
    ];
    const item = catalog[Math.floor(Math.random() * catalog.length)];
    let n;
    let prompt;
    if (item.kind === "spell") {
      n = item.n;
      prompt = "Ask a parent to type " + wordsFor(n) + ".";
    } else if (item.kind === "sum") {
      n = item.a + item.b;
      prompt = "Ask a parent to type " + wordsFor(item.a) + " plus " + wordsFor(item.b) + " as words.";
    } else {
      n = item.a - item.b;
      prompt = "Ask a parent to type " + wordsFor(item.a) + " minus " + wordsFor(item.b) + " as words.";
    }
    const challenge = {
      id: "pg_" + now(),
      prompt,
      accept: normalizeWords(wordsFor(n)),
      displayAnswer: wordsFor(n)
    };
    session.lastChallenge = challenge;
    return challenge;
  }

  function solveParental(typed) {
    const ch = session.lastChallenge;
    if (!ch) return { ok: false, reason: "no-challenge" };
    const got = normalizeWords(typed);
    if (!got || /\d/.test(String(typed))) {
      return { ok: false, reason: "words-only" };
    }
    if (got !== ch.accept) return { ok: false, reason: "mismatch" };
    session.parentalUntil = now() + PARENTAL_TTL_MS;
    session.parentalPurpose = "*";
    return { ok: true };
  }

  function grantParentPin() {
    session.parentPinUntil = now() + PARENT_PIN_TTL_MS;
    session.actor = "parent";
  }

  function grantStudent(studentId) {
    session.studentUnlock[studentId] = true;
    session.actor = "student";
    session.studentId = studentId;
  }

  function teacherFresh() {
    return now() < session.teacherUntil;
  }

  function grantTeacher() {
    session.teacherUntil = now() + PARENT_PIN_TTL_MS;
    session.actor = "teacher";
  }

  function verifyTeacherPin(pin) {
    const hh = global.BKStore && global.BKStore.state;
    if (!hh || !hh.teacher) return { ok: false, reason: "no-teacher" };
    if (String(pin) !== String(hh.teacher.pin)) return { ok: false, reason: "mismatch" };
    grantTeacher();
    return { ok: true };
  }

  function lockAll() {
    session.actor = "locked";
    session.studentId = null;
    session.parentPinUntil = 0;
    session.studentUnlock = {};
    session.parentalUntil = 0;
    session.parentalPurpose = null;
    session.lastChallenge = null;
    session.teacherUntil = 0;
  }

  function dropParentPin() {
    session.parentPinUntil = 0;
    if (session.actor === "parent") session.actor = "locked";
  }

  /**
   * Route policy. New screens register here — they do not implement their own gates.
   * Gates:
   *   app-unlock     age-tiered entry to the student app
   *   parent-pin     household PIN
   *   parental-gate  word-number challenge (Kids Category)
   *   forbid-k5-child  hard deny when the actor is a K–5 student
   */
  const ROUTES = {
    home: { gates: [] },
    lock: { gates: [] },
    recover: { gates: [] },
    mailbox: { gates: [] },
    privacy: { gates: [] },
    listing: { gates: [] },
    consent: { gates: ["parental-gate"] },
    signup: { gates: [] },
    student: { gates: ["app-unlock"] },
    homework: { gates: ["app-unlock"] },
    summer: { gates: ["app-unlock"] },
    session: { gates: ["app-unlock"] },
    diagnostic: { gates: ["app-unlock"] },
    report: { gates: [] },
    rollover: { gates: ["parent-pin"] },
    tutor: { gates: ["app-unlock"] },
    goals: { gates: ["app-unlock"] },
    evidence: { gates: ["mastery"] },
    export: { gates: ["mastery"] },
    parent: { gates: ["forbid-teacher", "parent-pin", "forbid-k5-child"] },
    teacher: { gates: ["teacher-session"] },
    assign: { gates: ["teacher-session"] },
    "class-report": { gates: ["teacher-session"] },
    "student-hq": { gates: ["app-unlock"] },
    weekly: { gates: ["parent-pin"] },
    profiles: { gates: ["parent-pin"] },
    admin: { gates: ["parent-pin"] },
    settings: { gates: ["parental-gate"] },
    billing: { gates: ["forbid-teacher", "parental-gate", "parent-pin"] },
    purchase: { gates: ["parental-gate", "parent-pin"] },
    "delete-account": { gates: ["parental-gate", "parent-pin"] },
    "external-link": { gates: ["parental-gate"] }
  };

  function context(extra) {
    const studentId = extra && extra.studentId != null ? extra.studentId : session.studentId;
    const student = studentId && global.BKStore ? global.BKStore.student(studentId) : null;
    const grade = student ? student.grade : extra && extra.grade;
    return {
      actor: session.actor,
      studentId,
      student,
      grade,
      tier: grade == null ? null : tierForGrade(grade),
      parentPin: parentPinFresh(),
      parental: parentalFresh(),
      studentOk: studentId ? studentUnlocked(studentId) : false,
      teacherOk: teacherFresh()
    };
  }

  function gatesFor(route) {
    const spec = ROUTES[route];
    if (!spec) return ["parent-pin"];
    return spec.gates.slice();
  }

  function evaluateGate(gate, ctx) {
    if (gate === "parental-gate") {
      return ctx.parental ? { ok: true } : { ok: false, gate: "parental-gate", reason: "Kids Category: a parent must type the number-words." };
    }
    if (gate === "parent-pin") {
      return ctx.parentPin ? { ok: true } : { ok: false, gate: "parent-pin", reason: "Parent PIN required." };
    }
    if (gate === "teacher-session") {
      return ctx.teacherOk || ctx.actor === "teacher"
        ? { ok: true }
        : { ok: false, gate: "teacher-session", reason: "Teacher sign-in required. This is not the parent app." };
    }
    if (gate === "forbid-teacher") {
      if (ctx.actor === "teacher") {
        return { ok: false, gate: "deny", reason: "Teachers cannot open the parent view or billing. Shared engine, separate interface." };
      }
      return { ok: true };
    }
    if (gate === "forbid-k5-child") {
      if (ctx.actor === "student" && ctx.tier === "k5") {
        return { ok: false, gate: "deny", reason: "A K–5 profile cannot open Parent HQ. Ask a parent to sign in as the parent." };
      }
      return { ok: true };
    }
    if (gate === "app-unlock") {
      if (!ctx.student) return { ok: false, gate: "app-unlock", reason: "Pick a student." };
      if (ctx.tier === "k5") {
        if (ctx.parentPin || ctx.studentOk) return { ok: true };
        return { ok: false, gate: "parent-pin", reason: "K–5: a parent unlocks the app, then the child taps their avatar." };
      }
      if (ctx.tier === "middles") {
        if (ctx.studentOk) return { ok: true };
        return { ok: false, gate: "student-pin", reason: "Grades 6–8 open the app with their own PIN." };
      }
      return { ok: true };
    }
    if (gate === "mastery") {
      if (ctx.tier === "hs" && ctx.actor === "student") return { ok: true };
      if (ctx.parentPin) return { ok: true };
      if (ctx.actor === "student" && ctx.tier === "k5") {
        return { ok: false, gate: "deny", reason: "Mastery data is a parent view for K–5." };
      }
      if (ctx.actor === "student" && ctx.tier === "middles") {
        return { ok: false, gate: "parent-pin", reason: "Parent HQ and mastery stay behind the parent PIN in grades 6–8." };
      }
      return { ok: false, gate: "parent-pin", reason: "Parent PIN required for mastery data." };
    }
    return { ok: false, gate: "deny", reason: "Unknown gate." };
  }

  function authorize(route, extra) {
    const ctx = context(extra);
    const gates = gatesFor(route);
    for (let i = 0; i < gates.length; i++) {
      const result = evaluateGate(gates[i], ctx);
      if (!result.ok) {
        return { ok: false, route, ctx, missing: result.gate, reason: result.reason, gates };
      }
    }
    return { ok: true, route, ctx, gates };
  }

  function verifyParentPin(pin) {
    const hh = global.BKStore && global.BKStore.state;
    if (!hh || !hh.parentPinHash) return { ok: false, reason: "no-pin-set" };
    if (!isFourDigit(pin)) return { ok: false, reason: "format" };
    if (pinHash(pin) !== hh.parentPinHash) return { ok: false, reason: "mismatch" };
    grantParentPin();
    return { ok: true };
  }

  function verifyStudentPin(studentId, pin) {
    const stu = global.BKStore.student(studentId);
    if (!stu) return { ok: false, reason: "missing" };
    const tier = tierForGrade(stu.grade);
    if (tier === "hs") {
      grantStudent(studentId);
      return { ok: true };
    }
    if (tier === "k5") {
      const parent = verifyParentPin(pin);
      if (!parent.ok) return parent;
      grantStudent(studentId);
      return { ok: true };
    }
    if (!stu.pin) return { ok: false, reason: "no-student-pin" };
    if (String(pin) !== String(stu.pin)) return { ok: false, reason: "mismatch" };
    grantStudent(studentId);
    return { ok: true };
  }

  function requestRecovery(email) {
    const hh = global.BKStore.state;
    const want = String(email || "").trim().toLowerCase();
    const have = String(hh.parentEmail || "").trim().toLowerCase();
    if (!hh.parentEmailVerified || !have) return { ok: false, reason: "unverified" };
    if (want !== have) return { ok: false, reason: "unknown-email" };
    const code = String(100000 + Math.floor(Math.random() * 900000));
    hh.recovery = {
      codeHash: pinHash("rec:" + code),
      expires: now() + RECOVERY_TTL_MS,
      sentTo: hh.parentEmail,
      createdAt: now()
    };
    const mail = global.BKMail
      ? global.BKMail.send({
          to: hh.parentEmail,
          subject: "Brain Kit parent PIN reset",
          body: "Your reset code is " + code + ". It expires in 15 minutes.",
          kind: "recovery"
        })
      : null;
    if (mail) mail.code = code;
    else {
      if (!hh.mailbox) hh.mailbox = [];
      hh.mailbox.unshift({
        id: "mail_" + now(),
        to: hh.parentEmail,
        subject: "Brain Kit parent PIN reset",
        body: "Your reset code is " + code + ". It expires in 15 minutes.",
        code,
        at: now()
      });
    }
    global.BKStore.persist();
    return { ok: true, sentTo: hh.parentEmail };
  }

  function completeRecovery(code, newPin) {
    const hh = global.BKStore.state;
    const rec = hh.recovery;
    if (!rec) return { ok: false, reason: "none" };
    if (now() > rec.expires) return { ok: false, reason: "expired" };
    if (pinHash("rec:" + String(code).trim()) !== rec.codeHash) return { ok: false, reason: "bad-code" };
    if (!isFourDigit(newPin)) return { ok: false, reason: "format" };
    hh.parentPinHash = pinHash(newPin);
    hh.recovery = null;
    global.BKStore.persist();
    grantParentPin();
    return { ok: true };
  }

  function setParentPinAtSignup(pin, email) {
    if (!isFourDigit(pin)) return { ok: false, reason: "format" };
    const hh = global.BKStore.state;
    hh.parentPinHash = pinHash(pin);
    hh.parentEmail = String(email || "").trim().toLowerCase();
    hh.parentEmailVerified = !!hh.parentEmail;
    global.BKStore.persist();
    grantParentPin();
    return { ok: true };
  }

  function canChangeStudentRecord(actorCtx, targetStudent) {
    if (parentPinFresh()) return { ok: true, via: "parent-pin" };
    const tier = tierForGrade(targetStudent.grade);
    if (actorCtx.actor === "student" && actorCtx.studentId === targetStudent.id && tier === "hs") {
      return { ok: true, via: "self", limited: "goals-and-courses" };
    }
    return { ok: false, gate: "parent-pin" };
  }

  global.BKAccess = {
    PARENTAL_TTL_MS,
    PARENT_PIN_TTL_MS,
    wordsFor,
    normalizeWords,
    pinHash,
    isFourDigit,
    tierForGrade,
    session,
    mintParentalChallenge,
    solveParental,
    grantParentPin,
    grantStudent,
    grantTeacher,
    verifyTeacherPin,
    teacherFresh,
    lockAll,
    dropParentPin,
    parentPinFresh,
    parentalFresh,
    ROUTES,
    gatesFor,
    authorize,
    verifyParentPin,
    verifyStudentPin,
    requestRecovery,
    completeRecovery,
    setParentPinAtSignup,
    canChangeStudentRecord,
    context
  };
})(window);
