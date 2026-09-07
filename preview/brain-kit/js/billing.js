/* Four plans, one engine. Diagnostic report is the sales page. */
(function (global) {
  const TRIAL_DAYS = 7;
  const FAMILY_CAP = 4;

  const PLANS = {
    free: {
      id: "free",
      name: "Free",
      monthly: 0,
      yearly: 0,
      subjects: "all",
      profiles: 1,
      practice: true,
      dailyQuestions: 10
    },
    essentials: {
      id: "essentials",
      name: "Essentials",
      monthly: 4.99,
      yearly: 39,
      subjects: "one",
      profiles: 4,
      practice: true
    },
    complete: {
      id: "complete",
      name: "Complete",
      monthly: 7.99,
      yearly: 69,
      subjects: "all",
      profiles: 4,
      practice: true,
      recommended: true
    }
  };

  const ADDONS = {
    testprep: {
      id: "testprep",
      name: "Test Prep",
      monthly: 9.99,
      minGrade: 8,
      exams: ["SAT", "ACT", "CLT", "HSPT", "SSAT"]
    }
  };

  function billing() {
    const hh = global.BKStore.state;
    if (!hh.billing) {
      hh.billing = {
        plan: hh.plan || "complete",
        interval: "yearly",
        subject: "Math",
        addons: [],
        trialEnds: Date.now() + TRIAL_DAYS * 86400000,
        trialStarted: Date.now(),
        provider: null,
        renew: true,
        receipts: []
      };
      global.BKStore.persist();
    }
    return hh.billing;
  }

  function plan() {
    return PLANS[billing().plan] || PLANS.free;
  }

  function onTrial() {
    const b = billing();
    return !!(b.trialEnds && Date.now() < b.trialEnds && !b.provider);
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function questionsToday() {
    const b = billing();
    if (!b.usage || b.usage.day !== todayKey()) return 0;
    return b.usage.count || 0;
  }

  function recordQuestion() {
    const b = billing();
    const day = todayKey();
    if (!b.usage || b.usage.day !== day) b.usage = { day, count: 0 };
    b.usage.count += 1;
    global.BKStore.persist();
    return b.usage.count;
  }

  function atFreeCap() {
    if (onTrial()) return false;
    if (plan().id !== "free") return false;
    return questionsToday() >= (PLANS.free.dailyQuestions || 10);
  }

  function profileCap() {
    if (onTrial() || plan().id !== "free") return FAMILY_CAP;
    return PLANS.free.profiles;
  }

  function trialDaysLeft() {
    const b = billing();
    if (!onTrial()) return 0;
    return Math.max(0, Math.ceil((b.trialEnds - Date.now()) / 86400000));
  }

  function hasAddon(id) {
    return (billing().addons || []).indexOf(id) !== -1;
  }

  function subjectAllowed(subject) {
    if (onTrial()) return true;
    const p = plan();
    if (p.id === "free") return true;
    if (!p.practice) return false;
    if (p.subjects === "all") return true;
    if (p.subjects === "one") return subject === billing().subject;
    return false;
  }

  function testPrepAllowed(student) {
    if (!hasAddon("testprep")) return false;
    const n = global.BK_gradeNumber(student.grade);
    return n >= ADDONS.testprep.minGrade;
  }

  function canPractice(student, skill) {
    if (skill && skill.strand === "Test Prep") return testPrepAllowed(student);
    if (skill && /SAT|ACT|CLT|HSPT|SSAT/i.test(skill.skill_name || "")) return testPrepAllowed(student);
    if (atFreeCap()) return false;
    return subjectAllowed(skill ? skill.subject : "Math");
  }

  function canSellTestPrep(students) {
    return (students || []).some((s) => global.BK_gradeNumber(s.grade) >= ADDONS.testprep.minGrade);
  }

  function quote(planId, interval) {
    const p = PLANS[planId];
    if (!p) return 0;
    return interval === "yearly" ? p.yearly : p.monthly;
  }

  function checkout(opts) {
    const b = billing();
    const planId = opts.plan;
    if (!PLANS[planId]) return { ok: false, reason: "Unknown plan." };
    if (planId === "essentials" && opts.subject) b.subject = opts.subject;
    const interval = opts.interval || b.interval || "yearly";
    const provider = opts.provider || "stripe";
    b.plan = planId;
    b.interval = interval;
    b.provider = provider;
    b.renew = true;
    b.receipts.push({
      at: Date.now(),
      plan: planId,
      interval,
      amount: quote(planId, interval),
      provider
    });
    global.BKStore.state.plan = planId;
    global.BKStore.persist();
    return { ok: true, plan: PLANS[planId], interval, provider, amount: quote(planId, interval) };
  }

  function addTestPrep(students, provider) {
    if (!canSellTestPrep(students)) {
      return { ok: false, reason: "Test Prep is grades 8–12. It is never sold onto a 3rd-grade profile." };
    }
    const b = billing();
    if (b.addons.indexOf("testprep") === -1) b.addons.push("testprep");
    b.receipts.push({ at: Date.now(), plan: "testprep", amount: ADDONS.testprep.monthly, provider: provider || "iap" });
    global.BKStore.persist();
    return { ok: true };
  }

  function cancelRenew() {
    billing().renew = false;
    global.BKStore.persist();
    return { ok: true };
  }

  function restorePurchases() {
    const b = billing();
    const last = (b.receipts || []).slice().reverse().find((r) => r.plan && r.plan !== "testprep");
    if (!last) return { ok: false, reason: "No receipt on this device." };
    b.plan = last.plan;
    b.interval = last.interval || b.interval;
    b.provider = last.provider || b.provider;
    global.BKStore.state.plan = last.plan;
    global.BKStore.persist();
    return { ok: true, plan: last.plan, provider: last.provider };
  }

  function startTrial() {
    const b = billing();
    if (!b.plan || b.plan === "complete" && !b.provider) b.plan = "free";
    b.trialStarted = Date.now();
    b.trialEnds = Date.now() + TRIAL_DAYS * 86400000;
    b.provider = null;
    global.BKStore.state.plan = b.plan || "free";
    global.BKStore.persist();
    return { ok: true, days: TRIAL_DAYS };
  }

  global.BKBilling = {
    TRIAL_DAYS,
    FAMILY_CAP,
    PLANS,
    ADDONS,
    billing,
    plan,
    onTrial,
    trialDaysLeft,
    subjectAllowed,
    canPractice,
    canSellTestPrep,
    quote,
    checkout,
    addTestPrep,
    cancelRenew,
    startTrial,
    restorePurchases,
    hasAddon,
    questionsToday,
    recordQuestion,
    atFreeCap,
    profileCap
  };
})(window);
