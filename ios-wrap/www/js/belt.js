/* Belt, tool upgrades, interface maturity, August rollover. */
(function (global) {
  const STAGES = [
    { min: 0, id: "starter", label: "starter" },
    { min: 15, id: "trusted", label: "trusted" },
    { min: 45, id: "upgraded", label: "upgraded" },
    { min: 80, id: "workshop", label: "workshop set" }
  ];

  const UPGRADE_COPY = {
    magnifier: { starter: "a simple lens", trusted: "a clearer lens", upgraded: "a field loupe", workshop: "a full reading kit" },
    pen: { starter: "a basic pen", trusted: "a steady pen", upgraded: "a fountain pen", workshop: "a writing set" },
    wrench: { starter: "a basic wrench", trusted: "a stronger wrench", upgraded: "a socket wrench", workshop: "a full socket set" },
    beaker: { starter: "a small cup", trusted: "a marked cup", upgraded: "a lab beaker", workshop: "a science kit" },
    compass: { starter: "a simple compass", trusted: "a working compass", upgraded: "a survey compass", workshop: "a map kit" },
    radio: { starter: "a hand radio", trusted: "a clearer radio", upgraded: "a shortwave", workshop: "a language kit" },
    stopwatch: { starter: "a timer", trusted: "a practice clock", upgraded: "a split watch", workshop: "a prep kit" }
  };

  const ICONS = {
    magnifier: "🔍",
    pen: "✒️",
    wrench: "🔧",
    beaker: "🧪",
    compass: "🧭",
    radio: "📻",
    stopwatch: "⏱️"
  };

  function stageFor(xp) {
    let s = STAGES[0];
    STAGES.forEach((st) => {
      if ((xp || 0) >= st.min) s = st;
    });
    return s;
  }

  function toolState(student, tool) {
    const n = global.BK_gradeNumber(student.grade);
    const unlocked = n >= tool.minGrade;
    const xp = (student.toolXP && student.toolXP[tool.id]) || 0;
    const stage = stageFor(xp);
    return {
      id: tool.id,
      label: tool.label,
      subject: tool.subject,
      unlocked,
      slotCopy: unlocked ? (UPGRADE_COPY[tool.id] || {})[stage.id] : "not unlocked yet",
      xp: unlocked ? xp : 0,
      stage,
      icon: ICONS[tool.id]
    };
  }

  function beltFor(student) {
    return global.BK_TAXONOMY.tools.map((t) => toolState(student, t));
  }

  function maturityFor(grade) {
    const band = global.BK_bandForGrade(grade);
    return global.BK_TAXONOMY.maturity[band];
  }

  function agencyFor(grade) {
    const n = global.BK_gradeNumber(grade);
    if (n <= 5) return { id: "parent-drives", label: "Parent sets the goal. The child taps the avatar." };
    if (n <= 8) return { id: "shared", label: "Shared. The student sets the goal; the parent can see it." };
    return { id: "student-owns", label: "The student owns the plan. Parent has visibility, not control." };
  }

  function kitPresence(maturity) {
    if (maturity === "hs") return { size: 36, caption: "Kit stays in the corner.", voice: "peer" };
    if (maturity === "middles") return { size: 52, caption: "Kit is smaller. Less decoration.", voice: "direct" };
    return { size: 72, caption: "Kit is present. Full illustration.", voice: "warm" };
  }

  function rollover(studentId) {
    const stu = global.BKStore.student(studentId);
    const from = stu.grade;
    const fromN = global.BK_gradeNumber(from);
    if (fromN >= 12) return { ok: false, reason: "already-12" };
    const to = fromN === 0 ? 1 : fromN + 1;
    const beforeTools = beltFor(stu).filter((t) => t.unlocked).map((t) => t.id);
    const beforeMat = maturityFor(from);
    global.BKStore.setGrade(studentId, to);
    const after = global.BKStore.student(studentId);
    const afterTools = beltFor(after).filter((t) => t.unlocked).map((t) => t.id);
    const unlocked = afterTools.filter((id) => beforeTools.indexOf(id) === -1);
    const event = {
      at: Date.now(),
      kind: "level-up",
      fromGrade: from,
      toGrade: to,
      masteryCarried: true,
      newTools: unlocked,
      maturityFrom: beforeMat,
      maturityTo: maturityFor(to)
    };
    global.BKStore.addRollover(studentId, event);
    return { ok: true, event, student: after };
  }

  global.BKBelt = {
    STAGES,
    stageFor,
    toolState,
    beltFor,
    maturityFor,
    agencyFor,
    kitPresence,
    rollover
  };
})(window);
