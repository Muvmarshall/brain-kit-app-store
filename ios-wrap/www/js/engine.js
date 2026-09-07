/* Adaptive loop. Progress never decreases. Sessions end. Teaching beats another question. */
(function (global) {
  const SESSION_QUESTION_CAP = 12;
  const SESSION_MS = 10 * 60 * 1000;

  function toolForSubject(subject) {
    const map = {
      Reading: "magnifier",
      ELA: "magnifier",
      "Writing & Grammar": "pen",
      Math: "wrench",
      Science: "beaker",
      "Social Studies": "compass",
      Spanish: "radio",
      "World Languages (Spanish)": "radio",
      "Test Prep": "stopwatch"
    };
    return map[subject] || "magnifier";
  }

  function allowedBand(studentGrade, skillBand) {
    const order = { "K-2": 0, "3-5": 1, "6-8": 2, "9-12": 3 };
    const studentBand = global.BK_bandForGrade(studentGrade);
    return order[skillBand] <= order[studentBand];
  }

  function isUpperBandContent(studentGrade, skill) {
    const n = global.BK_gradeNumber(studentGrade);
    const band = skill.grade_band;
    const course = String(skill.grade_or_course || "");
    if (n <= 5 && (band === "6-8" || band === "9-12")) return true;
    if (n <= 2 && band === "3-5") return true;
    if (n < 6 && (skill.subject === "Spanish" || /spanish/i.test(course))) return true;
    if (n < 8 && skill.subject === "Test Prep") return true;
    if (n <= 5 && /chemistry|physics|calculus|algebra 2|precalculus/i.test(course + " " + (skill.skill_name || ""))) return true;
    return false;
  }

  function canPresent(student, skill) {
    if (!student || !skill) return false;
    if (skill.status && skill.status !== "published") return false;
    if (!allowedBand(student.grade, skill.grade_band)) return false;
    if (isUpperBandContent(student.grade, skill)) return false;
    return true;
  }

  function visibleSkills(student) {
    let list = global.BKStore.publishedSkills().filter((sk) => canPresent(student, sk));
    if (global.BKA11y && global.BKA11y.prefs.offlineOnly) {
      const pack = global.BKA11y.packFor(student.id);
      if (!pack) return [];
      list = list.filter((sk) => pack.skillIds.indexOf(sk.id) !== -1);
    }
    return list;
  }

  function pickQuestion(skill, difficulty, usedIds) {
    const bank = (skill.question_bank || []).slice().sort((a, b) => Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty));
    const fresh = bank.filter((q) => !usedIds.has(q.id));
    const pool = fresh.length ? fresh : bank;
    const atLevel = pool.filter((q) => q.difficulty === difficulty);
    const chosen = (atLevel.length ? atLevel : pool)[0];
    return chosen || null;
  }

  function createSession(studentId, skillId) {
    const student = global.BKStore.student(studentId);
    const skill = global.BKStore.skillById(skillId);
    if (!student || !skill) throw new Error("Missing student or skill");
    const summerOk = global.BKSummer && global.BKSummer.isLight() && global.BKSummer.mayAssign(student, skill);
    if (!canPresent(student, skill) && !summerOk) {
      throw new Error("Grade-band lock: this skill is above the student's band.");
    }
    if (global.BKSummer && global.BKSummer.isLight() && !global.BKSummer.mayAssign(student, skill)) {
      throw new Error("Summer Bridge only opens this week's try-this — not the whole next grade.");
    }
    if (global.BKBilling && global.BKBilling.atFreeCap && global.BKBilling.atFreeCap()) {
      throw new Error("FREE_CAP: 10 practice questions today on the free tier. The diagnostic stays unlimited.");
    }
    if (global.BKBilling && !global.BKBilling.canPractice(student, skill)) {
      throw new Error("PAYWALL: this subject is not on the current plan. The diagnostic report stays free.");
    }
    const mastery = global.BKStore.masteryOf(studentId, skillId);
    const baseMs = global.BKSummer && global.BKSummer.isLight()
      ? global.BKSummer.sessionMs()
      : (global.BKA11y ? global.BKA11y.sessionMs(SESSION_MS) : SESSION_MS);
    const cap = global.BKSummer && global.BKSummer.questionCap();
    return {
      id: "ses_" + Date.now(),
      studentId,
      skillId,
      startedAt: Date.now(),
      endsAt: Date.now() + baseMs,
      extendedTime: !!(global.BKA11y && global.BKA11y.prefs.extendedTime),
      questionCap: cap || SESSION_QUESTION_CAP,
      summer: !!(global.BKSummer && global.BKSummer.isLight()),
      asked: 0,
      usedQuestionIds: new Set(),
      currentDifficulty: mastery.difficulty || 2,
      wrongOnThisQuestion: 0,
      currentQuestion: null,
      phase: "ask",
      lastVerdict: null,
      finished: false,
      finishReason: null,
      teach: null,
      tutorTurns: 0
    };
  }

  function nextAsk(session) {
    if (session.finished) return session;
    if (session.asked >= session.questionCap || Date.now() >= session.endsAt) {
      session.finished = true;
      session.finishReason = session.asked >= session.questionCap ? "question-cap" : "timer";
      session.phase = "done";
      return session;
    }
    const skill = global.BKStore.skillById(session.skillId);
    const q = pickQuestion(skill, session.currentDifficulty, session.usedQuestionIds);
    if (!q) {
      session.finished = true;
      session.finishReason = "bank-empty";
      session.phase = "done";
      return session;
    }
    session.currentQuestion = q;
    session.wrongOnThisQuestion = 0;
    session.phase = "ask";
    session.lastVerdict = null;
    return session;
  }

  function applyCorrect(session) {
    const before = global.BKStore.masteryOf(session.studentId, session.skillId).progress;
    const skill = global.BKStore.skillById(session.skillId);
    global.BKStore.addProgress(session.studentId, session.skillId, 8 + session.currentDifficulty);
    global.BKStore.addToolXP(session.studentId, toolForSubject(skill.subject), 3);
    const mastery = global.BKStore.masteryOf(session.studentId, session.skillId);
    mastery.seen += 1;
    mastery.correct += 1;
    mastery.lastResult = "correct";
    mastery.needsPractice = false;
    if (session.currentDifficulty < 5) session.currentDifficulty += 1;
    mastery.difficulty = session.currentDifficulty;
    global.BKStore.logQuestion(session.studentId, {
      sessionId: session.id,
      skillId: session.skillId,
      standard_code: skill.standard_code,
      subject: skill.subject,
      questionId: session.currentQuestion.id,
      difficulty: session.currentQuestion.difficulty,
      result: "correct",
      progressBefore: before,
      progressAfter: mastery.progress,
      timeTakenMs: 0
    });
    session.usedQuestionIds.add(session.currentQuestion.id);
    session.asked += 1;
    session.lastVerdict = "correct";
    session.phase = "feedback";
    global.BKStore.persist();
    return session;
  }

  function applyWrong(session) {
    const skill = global.BKStore.skillById(session.skillId);
    const mastery = global.BKStore.masteryOf(session.studentId, session.skillId);
    session.wrongOnThisQuestion += 1;
    mastery.seen += 1;
    mastery.lastResult = "look-again";

    global.BKStore.logQuestion(session.studentId, {
      sessionId: session.id,
      skillId: session.skillId,
      standard_code: skill.standard_code,
      subject: skill.subject,
      questionId: session.currentQuestion.id,
      difficulty: session.currentQuestion.difficulty,
      result: session.wrongOnThisQuestion === 1 ? "hint" : "teach",
      progressBefore: mastery.progress,
      progressAfter: mastery.progress,
      timeTakenMs: 0
    });

    if (session.wrongOnThisQuestion === 1) {
      session.phase = "hint";
      session.lastVerdict = "hint";
      return session;
    }

    session.phase = "teach";
    session.lastVerdict = "teach";
    session.teach = {
      explanation: skill.teach_content.explanation,
      worked_example: skill.teach_content.worked_example
    };
    if (session.currentDifficulty > 1) session.currentDifficulty -= 1;
    mastery.difficulty = session.currentDifficulty;
    session.usedQuestionIds.add(session.currentQuestion.id);
    session.asked += 1;
    global.BKStore.persist();
    return session;
  }

  function afterTeach(session) {
    const skill = global.BKStore.skillById(session.skillId);
    const retest = pickQuestion(skill, session.currentDifficulty, session.usedQuestionIds);
    session.phase = "retest";
    session.currentQuestion = retest;
    session.wrongOnThisQuestion = 0;
    session.lastVerdict = null;
    return session;
  }

  function applyRetest(session, correct) {
    const skill = global.BKStore.skillById(session.skillId);
    const mastery = global.BKStore.masteryOf(session.studentId, session.skillId);
    if (correct) {
      global.BKStore.addProgress(session.studentId, session.skillId, 5);
      global.BKStore.addToolXP(session.studentId, toolForSubject(skill.subject), 2);
      mastery.correct += 1;
      mastery.needsPractice = false;
      session.lastVerdict = "correct";
    } else {
      mastery.needsPractice = true;
      session.lastVerdict = "practice";
      const prereqs = skill.prerequisite_skills || [];
      let queued = null;
      for (const pid of prereqs) {
        const p = global.BKStore.skillById(pid);
        if (!p) continue;
        const pm = global.BKStore.masteryOf(session.studentId, pid);
        if (pm.progress < 60) {
          global.BKStore.queueSkill(session.studentId, pid);
          queued = p;
          break;
        }
      }
      session.queuedPrereq = queued;
    }
    if (session.currentQuestion) session.usedQuestionIds.add(session.currentQuestion.id);
    session.asked += 1;
    session.phase = "feedback";
    global.BKStore.persist();
    return session;
  }

  function finish(session, reason) {
    session.finished = true;
    session.finishReason = reason || "done";
    session.phase = "done";
    return session;
  }

  function remainingMs(session) {
    return Math.max(0, session.endsAt - Date.now());
  }

  global.BKEngine = {
    SESSION_QUESTION_CAP,
    SESSION_MS,
    toolForSubject,
    allowedBand,
    isUpperBandContent,
    canPresent,
    visibleSkills,
    createSession,
    nextAsk,
    applyCorrect,
    applyWrong,
    afterTeach,
    applyRetest,
    finish,
    remainingMs
  };
})(window);
