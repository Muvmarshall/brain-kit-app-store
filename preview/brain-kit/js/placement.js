/* Placement diagnostic + free parent report.
   Never called a test. Stays inside the student's grade-band ceiling. */
(function (global) {
  const TARGET = 10;

  function subjectsFor(student) {
    const n = global.BK_gradeNumber(student.grade);
    const list = ["Reading", "Writing & Grammar", "Math", "Science", "Social Studies"];
    if (n >= 6) list.push("ELA", "Spanish");
    if (n >= 8) list.push("Test Prep");
    return list.filter((subject) => skillsForSubject(student, subject).length);
  }

  function skillsForSubject(student, subject) {
    const aliases = subject === "Reading" ? ["Reading", "ELA"] : [subject];
    return global.BKEngine.visibleSkills(student).filter((sk) => aliases.includes(sk.subject) && (sk.question_bank || []).length);
  }

  function estimateLabel(student, subject, rate) {
    const n = global.BK_gradeNumber(student.grade);
    const names = ["kindergarten", "1st-grade", "2nd-grade", "3rd-grade", "4th-grade", "5th-grade", "6th-grade", "7th-grade", "8th-grade", "9th-grade", "10th-grade", "11th-grade", "12th-grade"];
    const here = names[n] || "current-grade";
    const down = names[Math.max(0, n - 1)];
    if (rate >= 0.8) return "a late-" + here + " level";
    if (rate >= 0.55) return "a mid-" + here + " level";
    if (rate >= 0.35) return "an early-" + here + " level, with " + down + " foundations still in play";
    return down + " foundations — assigned work stays in " + here + ", practice may reach down";
  }

  function buildReport(student, subject, items) {
    const scored = items.filter((it) => it.answer != null);
    const correct = scored.filter((it) => it.correct).length;
    const rate = scored.length ? correct / scored.length : 0;
    const byStrand = {};
    scored.forEach((it) => {
      const k = it.skill.strand;
      if (!byStrand[k]) byStrand[k] = { ok: 0, n: 0 };
      byStrand[k].n += 1;
      if (it.correct) byStrand[k].ok += 1;
    });
    const ranked = Object.keys(byStrand)
      .map((strand) => ({ strand, rate: byStrand[strand].ok / byStrand[strand].n, n: byStrand[strand].n }))
      .sort((a, b) => a.rate - b.rate);
    const weak = ranked.filter((r) => r.rate < 0.7);
    const strong = ranked.filter((r) => r.rate >= 0.7);
    const focusSkills = (weak.length ? items.filter((it) => !it.correct) : items)
      .map((it) => it.skill.skill_name)
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .slice(0, 3);
    while (focusSkills.length < 3 && ranked[focusSkills.length]) {
      focusSkills.push(ranked[focusSkills.length].strand);
    }
    const verb = subject === "Math" ? "does math at" : subject === "Reading" || subject === "ELA" ? "reads at" : "is working at";
    const headline = student.firstName + " " + verb + " " + estimateLabel(student, subject, rate) + ".";
    const strongTxt = strong.length
      ? strong.map((s) => s.strand).slice(0, 2).join(" and ") + " look solid."
      : "No strand was fully steady yet.";
    const weakTxt = weak.length
      ? weak[0].strand + " is where ground is being lost — the words or steps may be there, but the idea is not sticking."
      : "Misses were scattered, not a single hole.";
    const body = strongTxt + " " + weakTxt;
    return {
      headline,
      body,
      skills: focusSkills.slice(0, 3),
      subject,
      correct,
      asked: scored.length,
      rate,
      byStrand: ranked,
      label: estimateLabel(student, subject, rate),
      generatedAt: Date.now()
    };
  }

  function create(studentId, subject) {
    const student = global.BKStore.student(studentId);
    const skills = skillsForSubject(student, subject);
    if (!skills.length) throw new Error("No published skills in-band for this subject.");
    return {
      id: "place_" + Date.now(),
      studentId,
      subject,
      target: TARGET,
      asked: 0,
      difficulty: 2,
      items: [],
      current: null,
      used: {},
      finished: false,
      report: null
    };
  }

  function pick(run) {
    const student = global.BKStore.student(run.studentId);
    const skills = skillsForSubject(student, run.subject);
    const ordered = skills.slice().sort((a, b) => {
      const da = Math.abs((a.question_bank[0] && a.question_bank[0].difficulty) || 2 - run.difficulty);
      const db = Math.abs((b.question_bank[0] && b.question_bank[0].difficulty) || 2 - run.difficulty);
      return da - db;
    });
    for (let i = 0; i < ordered.length; i++) {
      const sk = ordered[i];
      if (!global.BKEngine.canPresent(student, sk)) continue;
      const q = (sk.question_bank || []).find((qq) => !run.used[qq.id] && Math.abs(qq.difficulty - run.difficulty) <= 1)
        || (sk.question_bank || []).find((qq) => !run.used[qq.id]);
      if (q) return { skill: sk, q };
    }
    return null;
  }

  function next(run) {
    if (run.asked >= run.target) {
      run.finished = true;
      return run;
    }
    const picked = pick(run);
    if (!picked) {
      run.finished = true;
      return run;
    }
    run.current = picked;
    return run;
  }

  function answer(run, choice) {
    const item = run.current;
    if (!item) return run;
    const correct = choice === item.q.answer;
    run.used[item.q.id] = true;
    run.items.push({ skill: item.skill, q: item.q, answer: choice, correct });
    run.asked += 1;
    if (correct) run.difficulty = Math.min(5, run.difficulty + 1);
    else run.difficulty = Math.max(1, run.difficulty - 1);
    run.current = null;
    if (run.asked >= run.target) {
      run.finished = true;
      const student = global.BKStore.student(run.studentId);
      run.report = buildReport(student, run.subject, run.items);
      global.BKStore.savePlacement(run.studentId, run.subject, run.report);
    }
    return run;
  }

  function finishEarly(run) {
    const student = global.BKStore.student(run.studentId);
    run.finished = true;
    run.report = buildReport(student, run.subject, run.items);
    global.BKStore.savePlacement(run.studentId, run.subject, run.report);
    return run;
  }

  global.BKPlacement = {
    TARGET,
    subjectsFor,
    skillsForSubject,
    create,
    next,
    answer,
    finishEarly,
    buildReport
  };
})(window);
