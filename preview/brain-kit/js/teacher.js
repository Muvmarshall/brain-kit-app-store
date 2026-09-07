/* Teacher surface. Shares the engine, not the parent interface.
   No live "who's online." Assignments still hit canPresent. */
(function (global) {
  const PRICE_MONTH = 0;
  const PRICE_YEAR = 0;
  const TEACHERS_FREE = true;

  function code() {
    const words = ["MAPLE", "CEDAR", "PINE", "RIVER", "OAK"];
    return words[Math.floor(Math.random() * words.length)] + Math.floor(10 + Math.random() * 89);
  }

  function classrooms() {
    const hh = global.BKStore.state;
    if (!hh.classrooms) hh.classrooms = [];
    return hh.classrooms;
  }

  function seedDemo() {
    const hh = global.BKStore.state;
    if (!hh.teacher) {
      hh.teacher = {
        name: "Ms. Reyes",
        email: "reyes@school.kit",
        pin: "7391",
        classroomPlan: "monthly"
      };
    }
    if (!hh.classrooms || !hh.classrooms.length) {
      hh.classrooms = [{
        id: "cls_maple",
        name: "Room 12 · Grade 2",
        grade: 2,
        joinCode: "MAPLE7",
        teacher: "Ms. Reyes",
        studentIds: ["stu_marcus"],
        assignments: []
      }];
    }
    global.BKStore.persist();
  }

  function classroom(id) {
    const hh = global.BKStore.state;
    const want = id || hh.activeClassId;
    return classrooms().find((c) => c.id === want) || classrooms()[0] || null;
  }

  function createClass(fields) {
    const cls = {
      id: "cls_" + Math.random().toString(36).slice(2, 8),
      name: fields.name || "New class",
      grade: fields.grade == null ? 2 : fields.grade,
      joinCode: code(),
      teacher: (global.BKStore.state.teacher && global.BKStore.state.teacher.name) || "Teacher",
      studentIds: [],
      assignments: []
    };
    classrooms().push(cls);
    global.BKStore.state.activeClassId = cls.id;
    global.BKStore.persist();
    return cls;
  }

  function selectClass(id) {
    global.BKStore.state.activeClassId = id;
    global.BKStore.persist();
    return classroom(id);
  }

  function linkHouseholdStudent(cls, studentId) {
    return join(cls.joinCode, studentId);
  }

  function roster(cls) {
    return (cls.studentIds || []).map((id) => global.BKStore.student(id)).filter(Boolean);
  }

  function gaps(cls) {
    const rows = [];
    roster(cls).forEach((stu) => {
      const need = Object.entries(stu.mastery || {}).filter(([, m]) => m.needsPractice || (m.progress > 0 && m.progress < 50));
      const queued = stu.sessionQueue || [];
      const week = (stu.history || []).filter((h) => h.ts > Date.now() - 7 * 86400000);
      const minutes = Math.round(week.reduce((n, h) => n + (h.timeTakenMs || 45000), 0) / 60000);
      rows.push({
        id: stu.id,
        name: stu.firstName,
        grade: stu.grade,
        needing: need.map(([id]) => {
          const sk = global.BKStore.skillById(id);
          return sk ? sk.skill_name : id;
        }),
        prereq: queued.map((id) => {
          const sk = global.BKStore.skillById(id);
          return sk ? sk.skill_name : id;
        }),
        minutesWeek: minutes,
        questionsWeek: week.length
      });
    });
    const skillCounts = {};
    rows.forEach((r) => r.needing.forEach((n) => { skillCounts[n] = (skillCounts[n] || 0) + 1; }));
    const classGaps = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
    return { rows, classGaps };
  }

  function assign(cls, skillId, studentIds) {
    const skill = global.BKStore.skillById(skillId);
    if (!skill) return { ok: false, reason: "Unknown skill." };
    const targets = (studentIds && studentIds.length ? studentIds : cls.studentIds).slice();
    const accepted = [];
    const blocked = [];
    targets.forEach((id) => {
      const stu = global.BKStore.student(id);
      if (!stu) return;
      if (!global.BKEngine.canPresent(stu, skill)) {
        blocked.push({ id, name: stu.firstName, reason: "grade-band lock" });
        return;
      }
      if (!stu.sessionQueue) stu.sessionQueue = [];
      if (stu.sessionQueue.indexOf(skillId) === -1) stu.sessionQueue.push(skillId);
      accepted.push(stu.firstName);
    });
    cls.assignments = cls.assignments || [];
    cls.assignments.push({
      skillId,
      skillName: skill.skill_name,
      at: Date.now(),
      accepted,
      blocked: blocked.map((b) => b.name)
    });
    global.BKStore.persist();
    return { ok: true, skill: skill.skill_name, accepted, blocked };
  }

  function join(codeStr, studentId) {
    const cls = classrooms().find((c) => c.joinCode.toLowerCase() === String(codeStr || "").toLowerCase());
    if (!cls) return { ok: false, reason: "No class with that code." };
    const stu = global.BKStore.student(studentId);
    if (!stu) return { ok: false, reason: "No student." };
    if (cls.studentIds.indexOf(studentId) === -1) cls.studentIds.push(studentId);
    global.BKStore.persist();
    return { ok: true, className: cls.name };
  }

  function weekly(cls) {
    const g = gaps(cls);
    const lines = g.rows.map((r) => {
      if (r.needing[0]) return r.name + " needs another look at “" + r.needing[0] + ".”";
      return r.name + " practiced " + r.minutesWeek + " minutes this week.";
    });
    return {
      title: cls.name + " · weekly summary",
      lines,
      gaps: g.classGaps,
      disclaimer: "Class practice summary. Not attendance. Not a live roster."
    };
  }

  global.BKTeacher = {
    PRICE_MONTH,
    PRICE_YEAR,
    TEACHERS_FREE,
    seedDemo,
    classrooms,
    classroom,
    roster,
    gaps,
    assign,
    join,
    weekly,
    code,
    createClass,
    selectClass,
    linkHouseholdStudent
  };
})(window);
