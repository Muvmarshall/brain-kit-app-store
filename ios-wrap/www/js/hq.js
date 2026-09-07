/* Parent HQ + 9–12 student HQ.
   Front door: one sentence. Metrics live one tap deeper. */
(function (global) {
  function skillName(id) {
    const sk = global.BKStore.skillById(id);
    return sk ? sk.skill_name : id;
  }

  function weekAgo() {
    return Date.now() - 7 * 24 * 60 * 60 * 1000;
  }

  function history(student) {
    return student.history || [];
  }

  function thisWeek(student) {
    const cut = weekAgo();
    return history(student).filter((h) => (h.ts || 0) >= cut);
  }

  function timeOnTaskMs(student, range) {
    const rows = range === "week" ? thisWeek(student) : history(student);
    return rows.reduce((n, h) => n + (h.timeTakenMs || 45000), 0);
  }

  function mastered(student) {
    return Object.entries(student.mastery || {})
      .filter(([, m]) => m.progress >= 80)
      .map(([id, m]) => ({ id, name: skillName(id), progress: m.progress }));
  }

  function needingPractice(student) {
    return Object.entries(student.mastery || {})
      .filter(([, m]) => m.needsPractice || (m.progress > 0 && m.progress < 50))
      .map(([id, m]) => ({ id, name: skillName(id), progress: m.progress, needsPractice: !!m.needsPractice }));
  }

  function prereqGaps(student) {
    return (student.sessionQueue || [])
      .map((id) => ({ id, name: skillName(id) }))
      .filter((x) => x.id);
  }

  function tonightAsk(student, skill) {
    if (skill && skill.id === "math-2-sub-1") {
      return "Tonight: ask " + student.firstName + " to show you 43 − 17 on paper.";
    }
    if (skill) return "Tonight: sit for one short practice on “" + skill.skill_name + ".”";
    const n = global.BK_gradeNumber(student.grade);
    if (n <= 5) return "Tonight: ten minutes is enough.";
    if (n <= 8) return "Tonight: " + student.firstName + " can set the goal. You just look.";
    return "No prompt from you required. Visibility only.";
  }

  function sentence(student) {
    if (global.BKSummer && global.BKSummer.isLight()) {
      const s = global.BKSummer.parentLine(student);
      if (s) return { ...s, kind: global.BKSummer.mode() };
    }
    const need = needingPractice(student)[0];
    if (need) {
      const skill = global.BKStore.skillById(need.id);
      if (skill && skill.id === "math-2-sub-1") {
        return {
          line: student.firstName + " is stuck on regrouping in subtraction.",
          ask: tonightAsk(student, skill),
          kind: "stuck"
        };
      }
      return {
        line: student.firstName + " needs another look at “" + need.name + ".”",
        ask: tonightAsk(student, skill),
        kind: "stuck"
      };
    }
    const placed = student.placement && (student.placement.Reading || student.placement.Math);
    if (placed && placed.headline) {
      return {
        line: placed.headline,
        ask: placed.skills && placed.skills[0] ? "Start with " + placed.skills[0] + "." : tonightAsk(student, null),
        kind: "placement"
      };
    }
    const week = thisWeek(student);
    if (week.length) {
      const last = week[week.length - 1];
      const sk = global.BKStore.skillById(last.skillId);
      return {
        line: student.firstName + " practiced " + (sk ? sk.skill_name : "this week") + " and progress held.",
        ask: tonightAsk(student, sk),
        kind: "held"
      };
    }
    const n = global.BK_gradeNumber(student.grade);
    if (n <= 5) {
      return { line: student.firstName + " is ready for a short reading or math session.", ask: tonightAsk(student, null), kind: "ready" };
    }
    if (n <= 8) {
      return { line: student.firstName + " can pick tonight’s goal. You will see it after.", ask: tonightAsk(student, null), kind: "shared" };
    }
    return { line: student.firstName + " owns the plan this week.", ask: tonightAsk(student, null), kind: "owns" };
  }

  function studentSentence(student) {
    const s = sentence(student);
    const n = global.BK_gradeNumber(student.grade);
    if (n >= 9) {
      return {
        line: s.kind === "stuck" ? "You still owe yourself another look at that skill." : "You own this week.",
        ask: (global.BKStore.state.goals && global.BKStore.state.goals[student.id]) || "Set a goal. Nobody else will."
      };
    }
    if (n >= 6) {
      return {
        line: s.line.replace(student.firstName, "You"),
        ask: (global.BKStore.state.goals && global.BKStore.state.goals[student.id]) || "Set tonight’s goal. Your parent will see it."
      };
    }
    return s;
  }

  function metrics(student) {
    const week = thisWeek(student);
    const all = history(student);
    const ms = timeOnTaskMs(student, "week");
    const minutes = Math.round(ms / 60000);
    return {
      sentence: sentence(student),
      studentSentence: studentSentence(student),
      minutesWeek: minutes,
      questionsWeek: week.length,
      questionsAll: all.length,
      mastered: mastered(student),
      needing: needingPractice(student),
      gaps: prereqGaps(student),
      goal: (global.BKStore.state.goals && global.BKStore.state.goals[student.id]) || "",
      streak: student.streak || { count: 0, paused: true },
      transcripts: student.tutorLogs || [],
      history: all.slice().reverse()
    };
  }

  function weeklyNote(household) {
    const lines = (household.students || []).map((stu) => {
      const s = sentence(stu);
      return s.line + " " + s.ask;
    });
    return {
      id: "week_" + Date.now(),
      to: household.parentEmail,
      subject: "This week at Brain Kit",
      at: Date.now(),
      lines,
      body: lines.join("\n\n")
    };
  }

  function sendWeekly(household) {
    const note = weeklyNote(household);
    if (global.BKMail) {
      global.BKMail.send({
        to: note.to,
        subject: note.subject,
        body: note.body,
        lines: note.lines,
        kind: "weekly"
      });
    } else {
      if (!household.mailbox) household.mailbox = [];
      household.mailbox.unshift({
        id: note.id,
        to: note.to,
        subject: note.subject,
        body: note.body,
        at: note.at,
        kind: "weekly"
      });
    }
    if (!household.weeklyNotes) household.weeklyNotes = [];
    household.weeklyNotes.unshift(note);
    if (global.BKStore && global.BKStore.persist) global.BKStore.persist();
    return note;
  }

  function seedDemoSignals() {
    const marcus = global.BKStore.student("stu_marcus");
    if (!marcus) return;
    if (!marcus.mastery) marcus.mastery = {};
    if (!marcus.mastery["math-2-sub-1"]) {
      marcus.mastery["math-2-sub-1"] = {
        progress: 28,
        difficulty: 2,
        seen: 6,
        correct: 2,
        needsPractice: true,
        lastResult: "look-again"
      };
    }
    if (!marcus.history.length) {
      const now = Date.now();
      marcus.history.push(
        { ts: now - 86400000, sessionId: "demo", skillId: "math-2-sub-1", standard_code: "MA.2.NSO.2.3", subject: "Math", questionId: "d1", difficulty: 2, result: "hint", progressBefore: 20, progressAfter: 20, timeTakenMs: 40000 },
        { ts: now - 86000000, sessionId: "demo", skillId: "math-2-sub-1", standard_code: "MA.2.NSO.2.3", subject: "Math", questionId: "d2", difficulty: 2, result: "teach", progressBefore: 20, progressAfter: 20, timeTakenMs: 55000 },
        { ts: now - 85000000, sessionId: "demo", skillId: "math-2-sub-1", standard_code: "MA.2.NSO.2.3", subject: "Math", questionId: "d3", difficulty: 1, result: "correct", progressBefore: 20, progressAfter: 28, timeTakenMs: 30000 }
      );
    }
    if (!marcus.sessionQueue.includes("math-1-sub-1")) marcus.sessionQueue.push("math-1-sub-1");
    const jordan = global.BKStore.student("stu_jordan");
    if (jordan && !jordan.mastery["math-geo-py-1"]) {
      jordan.mastery["math-geo-py-1"] = { progress: 62, difficulty: 3, seen: 8, correct: 5, needsPractice: false, lastResult: "correct" };
    }
    global.BKStore.persist();
  }

  global.BKHQ = {
    sentence,
    studentSentence,
    metrics,
    weeklyNote,
    sendWeekly,
    seedDemoSignals,
    timeOnTaskMs
  };
})(window);
