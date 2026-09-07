/* Summer Bridge. Optional 8-week track, June–August.
   Each week: one light skill from the upcoming grade.
   Framed as "try this." Never required to start the year. */
(function (global) {
  const SUMMER_MS = 5 * 60 * 1000;
  const SUMMER_Q = 6;
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const TRACKS = {
    2: [
      { title: "Round to the nearest ten", subject: "Math", prompt: "Round 47 to the nearest ten.", choices: ["40", "50", "47"], answer: "50", hint: "Look at the ones." },
      { title: "Main idea of a short paragraph", subject: "Reading", prompt: "A paragraph about bees making honey is mostly about…", choices: ["Bees and honey", "Soccer", "Rain"], answer: "Bees and honey", hint: "What is almost every sentence about?" },
      { title: "Equal groups of 2", subject: "Math", prompt: "2 + 2 + 2 = how many groups of 2?", choices: ["2", "3", "6"], answer: "3", hint: "Count the addends." },
      { title: "Character and setting", subject: "Reading", prompt: "In a story at a lake about Sam, the setting is…", choices: ["Sam", "The lake", "A car"], answer: "The lake", hint: "Setting is where." },
      { title: "Find the unknown in 8 + ? = 15", subject: "Math", prompt: "8 + ? = 15", choices: ["6", "7", "8"], answer: "7", hint: "What takes 8 to 15?" },
      { title: "Context clue for a new word", subject: "Reading", prompt: "The pup was tiny, very small. Tiny means…", choices: ["Very small", "Loud", "Fast"], answer: "Very small", hint: "The comma restates it." },
      { title: "Tell time to the half hour", subject: "Math", prompt: "The short hand is on 3, the long hand on 6. The time is…", choices: ["3:00", "3:30", "6:00"], answer: "3:30", hint: "Long hand on 6 is thirty." },
      { title: "Compare two short texts", subject: "Reading", prompt: "Two notes both thank a friend. They are alike because…", choices: ["Both thank someone", "Both are poems", "Both are about soccer"], answer: "Both thank someone", hint: "What do both do?" }
    ],
    7: [
      { title: "Unit rate from a table", subject: "Math", prompt: "8 miles in 2 hours. Miles per hour?", choices: ["2", "4", "16"], answer: "4", hint: "Divide miles by hours." },
      { title: "Central idea vs detail", subject: "ELA", prompt: "A piece argues schools should start later. That is the…", choices: ["Central idea", "Caption", "Setting"], answer: "Central idea", hint: "What is the whole piece driving at?" },
      { title: "Integer chip model", subject: "Math", prompt: "−3 + 5 is…", choices: ["−8", "2", "8"], answer: "2", hint: "Five positives cancel three negatives." },
      { title: "Author’s purpose: persuade", subject: "ELA", prompt: "An ad wants you to buy a bottle. Purpose?", choices: ["Persuade", "Entertain", "List"], answer: "Persuade", hint: "Ads push a choice." },
      { title: "Simple interest idea", subject: "Math", prompt: "Interest is money paid to…", choices: ["Use someone else’s money", "Draw a triangle", "Name a planet"], answer: "Use someone else’s money", hint: "Borrowing has a cost." },
      { title: "Claim and evidence", subject: "ELA", prompt: "“Recess helps focus” plus a study result. The study is…", choices: ["Evidence", "The claim", "A setting"], answer: "Evidence", hint: "Evidence supports." },
      { title: "Scale on a map", subject: "Math", prompt: "1 cm = 10 km. 3 cm is…", choices: ["3 km", "13 km", "30 km"], answer: "30 km", hint: "Multiply." },
      { title: "Tone in a letter", subject: "ELA", prompt: "A letter full of thanks feels…", choices: ["Grateful", "Angry", "Bored"], answer: "Grateful", hint: "Match the feeling." }
    ],
    10: [
      { title: "Function vs relation", subject: "Math", prompt: "A relation is a function when each input has…", choices: ["Exactly one output", "Two outputs", "No outputs"], answer: "Exactly one output", hint: "Vertical line test idea." },
      { title: "Thesis vs topic sentence", subject: "ELA", prompt: "The sentence that states the essay’s argument is the…", choices: ["Thesis", "Caption", "Heading"], answer: "Thesis", hint: "Whole-essay claim." },
      { title: "Slope from two points (idea)", subject: "Math", prompt: "Slope is rise over…", choices: ["Run", "Area", "Volume"], answer: "Run", hint: "Vertical change over horizontal." },
      { title: "Evaluate a source’s bias", subject: "ELA", prompt: "A company blog praising its own product may have…", choices: ["Bias", "No author", "A hypotenuse"], answer: "Bias", hint: "Who benefits?" },
      { title: "Right-triangle trig name", subject: "Math", prompt: "Opposite over hypotenuse is…", choices: ["Sine", "Area", "Mean"], answer: "Sine", hint: "SOH." },
      { title: "Counterclaim", subject: "ELA", prompt: "Naming the other side before you answer it is a…", choices: ["Counterclaim", "Metaphor", "Setting"], answer: "Counterclaim", hint: "The other side." },
      { title: "Exponential vs linear growth", subject: "Math", prompt: "Doubling each step is…", choices: ["Exponential", "Linear", "A constant"], answer: "Exponential", hint: "The change multiplies." },
      { title: "Integrate a quotation", subject: "ELA", prompt: "A quote needs a…", choices: ["Lead-in and citation", "Picture only", "New title"], answer: "Lead-in and citation", hint: "Don’t drop quotes in bare." }
    ]
  };

  function monthOf(ts) {
    return new Date(ts || Date.now()).getMonth();
  }

  function autoMode(ts) {
    const m = monthOf(ts);
    if (m === 5 || m === 6 || m === 7) return "summer";
    return "school";
  }

  function mode() {
    const hh = global.BKStore && global.BKStore.state;
    const forced = hh && hh.season;
    if (forced && forced !== "auto") return forced === "bridge" ? "summer" : forced;
    return autoMode(Date.now());
  }

  function setMode(next) {
    global.BKStore.state.season = next;
    global.BKStore.persist();
    return mode();
  }

  function isLight() {
    return mode() === "summer";
  }

  function sessionMs() {
    if (!isLight()) return null;
    const base = SUMMER_MS;
    return global.BKA11y ? global.BKA11y.sessionMs(base) : base;
  }

  function questionCap() {
    return isLight() ? SUMMER_Q : null;
  }

  function trackKey(grade) {
    const n = global.BK_gradeNumber(grade);
    if (n <= 5) return 2;
    if (n <= 8) return 7;
    return 10;
  }

  function upcomingGrade(grade) {
    const n = global.BK_gradeNumber(grade);
    return Math.min(12, n + 1);
  }

  function skillId(grade, week) {
    return "summer-" + trackKey(grade) + "-w" + (week + 1);
  }

  function lightSkill(grade, week) {
    const spec = TRACKS[trackKey(grade)][week];
    const next = upcomingGrade(grade);
    const band = global.BK_bandForGrade(next);
    return {
      id: skillId(grade, week),
      subject: spec.subject,
      grade_band: band,
      grade_or_course: "Grade " + next,
      strand: "Summer Bridge · try this",
      skill_name: spec.title,
      standard_code: "SUMMER.W" + (week + 1),
      prerequisite_skills: [],
      teach_content: {
        explanation: "This is a try-this from next year. You are not supposed to already know it.",
        worked_example: spec.prompt + " → " + spec.answer
      },
      question_bank: [
        { id: "s1", prompt: spec.prompt, choices: spec.choices, answer: spec.answer, hint: spec.hint, difficulty: 1 },
        { id: "s2", prompt: spec.prompt, choices: spec.choices, answer: spec.answer, hint: spec.hint, difficulty: 2 }
      ],
      status: "published",
      summer_light: true,
      week: week + 1
    };
  }

  function ensureCatalog() {
    if (!global.BKStore || !global.BKStore.upsertSkills) return [];
    const all = [];
    [2, 7, 10].forEach((g) => {
      TRACKS[g].forEach((_, w) => all.push(lightSkill(g, w)));
    });
    global.BKStore.upsertSkills(all, "summer-bridge");
    return all;
  }

  function weekIndex(ts) {
    const d = new Date(ts || Date.now());
    const start = new Date(d.getFullYear(), 5, 1).getTime();
    const w = Math.floor((d.getTime() - start) / WEEK_MS);
    if (w < 0) return 0;
    if (w > 7) return 7;
    return w;
  }

  function weeks(student) {
    ensureCatalog();
    const done = (student.summerWeeks || []).slice();
    return TRACKS[trackKey(student.grade)].map((spec, i) => ({
      week: i + 1,
      title: spec.title,
      subject: spec.subject,
      skillId: skillId(student.grade, i),
      framing: "Try this. You are not supposed to already know it.",
      current: i === weekIndex(Date.now()),
      complete: done.indexOf(i + 1) !== -1
    }));
  }

  function currentWeek(student) {
    return weeks(student)[weekIndex(Date.now())];
  }

  function markWeek(studentId, week) {
    const stu = global.BKStore.student(studentId);
    if (!stu.summerWeeks) stu.summerWeeks = [];
    if (stu.summerWeeks.indexOf(week) === -1) stu.summerWeeks.push(week);
    global.BKStore.persist();
  }

  function completeRequired(student) {
    return false;
  }

  function pool(student) {
    if (!isLight()) return global.BKEngine.visibleSkills(student);
    return weeks(student).map((w) => global.BKStore.skillById(w.skillId)).filter(Boolean);
  }

  function mayAssign(student, skill) {
    if (!isLight()) return global.BKEngine.canPresent(student, skill);
    if (skill.summer_light) {
      const allowed = weeks(student).some((w) => w.skillId === skill.id);
      return allowed;
    }
    return global.BKEngine.canPresent(student, skill);
  }

  function parentLine(student) {
    if (!isLight()) return null;
    const raw = new Date().getMonth();
    const month = raw === 5 ? "June" : raw === 6 ? "July" : raw === 7 ? "August" : "July";
    const held = heldSubject(student);
    return {
      line: student.firstName + " held " + held + " through " + month + ".",
      ask: "This week’s try-this is optional. The new year starts either way."
    };
  }

  function heldSubject(student) {
    const hist = student.history || [];
    if (hist.some((h) => h.subject === "Reading" || h.subject === "ELA")) return "a reading level";
    if (hist.some((h) => h.subject === "Math")) return "a math level";
    return "this year’s level";
  }

  function reviewSkills(student) {
    return global.BKEngine.visibleSkills(student);
  }

  function bridgeSkills(student) {
    return pool(student);
  }

  function streakAlive(student, now) {
    const start = (now || Date.now()) - WEEK_MS;
    const sessions = {};
    (student.history || []).forEach((h) => {
      if (h.ts >= start) sessions[h.sessionId || "x"] = true;
    });
    const n = Object.keys(sessions).length;
    if (!isLight()) return { alive: n >= 1, needed: 1, done: n };
    return { alive: n >= 1, needed: 1, done: n };
  }

  global.BKSummer = {
    SUMMER_MS,
    SUMMER_Q,
    TRACKS,
    autoMode,
    mode,
    setMode,
    isLight,
    sessionMs,
    questionCap,
    ensureCatalog,
    weekIndex,
    weeks,
    currentWeek,
    markWeek,
    completeRequired,
    pool,
    mayAssign,
    parentLine,
    reviewSkills,
    bridgeSkills,
    streakAlive,
    upcomingGrade
  };
})(window);
