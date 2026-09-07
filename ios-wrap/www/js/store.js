/* Persistence + household model. One engine. Content is data. */
(function (global) {
  const KEY = "brainkit.v3";

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 9);
  }

  function defaultHousehold() {
    return {
      householdId: uid("hh"),
      parentName: "Alex",
      parentPinHash: "566b467e",
      parentEmail: "alex@home.kit",
      parentEmailVerified: true,
      consent: { given: true, at: Date.now(), version: "v1", mode: "consumer" },
      recovery: null,
      mailbox: [],
      locale: "en",
      plan: "complete",
      season: "auto",
      billing: {
        plan: "complete",
        interval: "yearly",
        subject: "Math",
        addons: [],
        trialEnds: Date.now() + 7 * 86400000,
        trialStarted: Date.now(),
        provider: null,
        renew: true,
        receipts: []
      },
      goals: {
        stu_marcus: "Ten minutes of reading or math.",
        stu_elena: "Finish the percent skill this week.",
        stu_jordan: "Geometry warm-up before Thursday's quiz."
      },
      students: [
        {
          id: "stu_marcus",
          firstName: "Marcus",
          grade: 2,
          pin: null,
          avatar: "fox-orange",
          enrolledCourses: [],
          placement: {},
          mastery: {},
          toolXP: { magnifier: 18, pen: 6, wrench: 22, beaker: 4, compass: 8 },
          streak: { count: 4, paused: false, lastDate: null },
          history: [],
          tutorLogs: [],
          sessionQueue: [],
          rolloverEvents: []
        },
        {
          id: "stu_elena",
          firstName: "Elena",
          grade: 7,
          pin: "2468",
          avatar: "fox-teal",
          enrolledCourses: ["Grade 7"],
          placement: {},
          mastery: {},
          toolXP: { magnifier: 40, pen: 28, wrench: 55, beaker: 31, compass: 22, radio: 10 },
          streak: { count: 11, paused: false, lastDate: null },
          history: [],
          tutorLogs: [],
          sessionQueue: [],
          rolloverEvents: []
        },
        {
          id: "stu_jordan",
          firstName: "Jordan",
          grade: 10,
          pin: "1010",
          avatar: "fox-slate",
          enrolledCourses: ["Geometry", "Biology", "English II"],
          placement: {},
          mastery: {},
          toolXP: { magnifier: 70, pen: 62, wrench: 80, beaker: 58, compass: 44, radio: 20, stopwatch: 12 },
          streak: { count: 2, paused: false, lastDate: null },
          history: [],
          tutorLogs: [],
          sessionQueue: [],
          rolloverEvents: []
        }
      ],
      skills: [],
      importLog: [],
      createdAt: Date.now()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultHousehold();
      const data = JSON.parse(raw);
      if (!data.skills) data.skills = [];
      if (!data.students) data.students = defaultHousehold().students;
      const fresh = defaultHousehold();
      if (!data.parentPinHash) data.parentPinHash = fresh.parentPinHash;
      if (!data.parentEmail) data.parentEmail = fresh.parentEmail;
      if (data.parentEmailVerified == null) data.parentEmailVerified = true;
      if (!data.mailbox) data.mailbox = [];
      if (!data.goals) data.goals = fresh.goals;
      if (!data.plan) data.plan = "complete";
      if (!data.season) data.season = "auto";
      if (!data.classrooms) data.classrooms = [];
      if (!data.weeklyNotes) data.weeklyNotes = [];
      return data;
    } catch {
      return defaultHousehold();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  const api = {
    state: load(),
    persist() {
      save(this.state);
    },
    resetDemo() {
      this.state = defaultHousehold();
      this.persist();
    },
    startFresh() {
      const hh = defaultHousehold();
      hh.students = [];
      hh.goals = {};
      hh.consent = { given: false, at: null, version: "v1", mode: "consumer" };
      hh.plan = "free";
      hh.billing = {
        plan: "free",
        interval: "yearly",
        subject: "Math",
        addons: [],
        trialEnds: 0,
        trialStarted: null,
        provider: null,
        renew: true,
        receipts: []
      };
      hh.parentPinHash = null;
      hh.parentName = "";
      hh.parentEmail = "";
      hh.parentEmailVerified = false;
      hh.classrooms = [];
      hh.teacher = null;
      hh.mailbox = [];
      this.state = hh;
      this.persist();
    },
    getSkills() {
      return this.state.skills;
    },
    upsertSkills(incoming, source) {
      const byId = new Map(this.state.skills.map((s) => [s.id, s]));
      let added = 0;
      let updated = 0;
      incoming.forEach((sk) => {
        const next = global.BK_normalizeSkill ? global.BK_normalizeSkill({ ...sk }) : sk;
        if (byId.has(sk.id)) {
          byId.set(sk.id, { ...byId.get(sk.id), ...next });
          updated += 1;
        } else {
          byId.set(sk.id, next);
          added += 1;
        }
      });
      this.state.skills = Array.from(byId.values());
      this.state.importLog.unshift({
        at: Date.now(),
        source: source || "import",
        added,
        updated,
        total: incoming.length
      });
      this.persist();
      return { added, updated };
    },
    publishedSkills() {
      return this.state.skills.filter((s) => s.status === "published");
    },
    setSkillStatus(id, status) {
      const sk = this.skillById(id);
      if (!sk) return null;
      if (status !== "published" && status !== "draft") return sk;
      if (status === "published" && !(sk.question_bank && sk.question_bank.length)) return sk;
      sk.status = status;
      this.persist();
      return sk;
    },
    skillById(id) {
      return this.state.skills.find((s) => s.id === id);
    },
    student(id) {
      return this.state.students.find((s) => s.id === id);
    },
    masteryOf(studentId, skillId) {
      const stu = this.student(studentId);
      if (!stu.mastery[skillId]) {
        stu.mastery[skillId] = {
          progress: 0,
          difficulty: 2,
          seen: 0,
          correct: 0,
          needsPractice: false,
          lastResult: null
        };
      }
      return stu.mastery[skillId];
    },
    addProgress(studentId, skillId, delta) {
      const m = this.masteryOf(studentId, skillId);
      const next = Math.min(100, m.progress + Math.max(0, delta));
      m.progress = next;
      this.persist();
      return m.progress;
    },
    logQuestion(studentId, entry) {
      const stu = this.student(studentId);
      stu.history.push({ ...entry, ts: Date.now() });
      if (global.BKBilling && global.BKBilling.recordQuestion) global.BKBilling.recordQuestion();
      if (global.BKA11y && global.BKA11y.prefs.offlineOnly) {
        global.BKA11y.queueSync(studentId, { kind: "question", skillId: entry.skillId, result: entry.result });
      }
      this.persist();
    },
    logTutor(studentId, entry) {
      const stu = this.student(studentId);
      stu.tutorLogs.push({ ...entry, ts: Date.now() });
      this.persist();
    },
    addToolXP(studentId, toolId, amount) {
      const stu = this.student(studentId);
      stu.toolXP[toolId] = Math.min(100, (stu.toolXP[toolId] || 0) + Math.max(0, amount));
      this.persist();
      return stu.toolXP[toolId];
    },
    queueSkill(studentId, skillId) {
      const stu = this.student(studentId);
      if (!stu.sessionQueue.includes(skillId)) stu.sessionQueue.push(skillId);
      this.persist();
    },
    setGoal(studentId, text) {
      if (!this.state.goals) this.state.goals = {};
      this.state.goals[studentId] = String(text || "").slice(0, 180);
      this.persist();
    },
    setGrade(studentId, grade) {
      const stu = this.student(studentId);
      stu.grade = grade === "K" ? "K" : Number(grade);
      this.persist();
    },
    setCourses(studentId, courses) {
      const stu = this.student(studentId);
      stu.enrolledCourses = courses;
      this.persist();
    },
    addStudent(fields) {
      if (global.BKCompliance && !global.BKCompliance.mayCreateProfile()) {
        throw new Error("COPPA: parental consent comes before any student profile.");
      }
      const cap = global.BKBilling && global.BKBilling.profileCap ? global.BKBilling.profileCap() : 4;
      if (this.state.students.length >= cap) {
        throw new Error(cap === 1
          ? "Free tier includes one profile. Complete includes four."
          : "Four profiles are included. That is the cap on this plan.");
      }
      const stu = {
        id: uid("stu"),
        firstName: fields.firstName,
        grade: fields.grade,
        pin: fields.pin || null,
        avatar: "fox-orange",
        enrolledCourses: fields.enrolledCourses || [],
        placement: {},
        mastery: {},
        toolXP: {},
        streak: { count: 0, paused: false, lastDate: null },
        history: [],
        tutorLogs: [],
        sessionQueue: []
      };
      this.state.students.push(stu);
      this.persist();
      return stu;
    },
    removeStudent(studentId) {
      this.state.students = this.state.students.filter((s) => s.id !== studentId);
      this.persist();
    },
    savePlacement(studentId, subject, report) {
      const stu = this.student(studentId);
      if (!stu.placement) stu.placement = {};
      stu.placement[subject] = report;
      this.persist();
    },
    addRollover(studentId, event) {
      const stu = this.student(studentId);
      if (!stu.rolloverEvents) stu.rolloverEvents = [];
      stu.rolloverEvents.push(event);
      this.persist();
    },
    logHomework(studentId, entry) {
      const stu = this.student(studentId);
      if (!stu.homeworkLog) stu.homeworkLog = [];
      stu.homeworkLog.push({ ...entry, ts: Date.now() });
      this.persist();
    }
  };

  global.BKStore = api;
})(window);
