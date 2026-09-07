(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const ui = {
    view: "home",
    role: "parent",
    studentId: "stu_marcus",
    session: null,
    selectedChoice: null,
    diagnostic: null,
    maturityOverride: null
  };

  function currentStudent() {
    return BKStore.student(ui.studentId) || BKStore.state.students[0] || {
      id: "none",
      firstName: "Student",
      grade: 2,
      mastery: {},
      history: [],
      toolXP: {},
      streak: { count: 0 },
      sessionQueue: [],
      placement: {},
      enrolledCourses: []
    };
  }

  function maturity() {
    if (ui.maturityOverride) return ui.maturityOverride;
    const band = BK_bandForGrade(currentStudent().grade);
    return BK_TAXONOMY.maturity[band];
  }

  function applyChrome() {
    const m = maturity();
    document.body.classList.remove("maturity-k5", "maturity-middles", "maturity-hs");
    document.body.classList.add(m === "hs" ? "maturity-hs" : m === "middles" ? "maturity-middles" : "maturity-k5");
    const stu = currentStudent();
    if (stu) $("#active-student-label").textContent = stu.firstName + " · Grade " + stu.grade;
    const kit = document.querySelector(".brand img");
    if (kit && window.BKBelt) {
      const pres = BKBelt.kitPresence(m);
      kit.style.width = pres.size + "px";
      kit.style.height = pres.size + "px";
    }
  }

  function hideGate() {
    const el = $("#gate-overlay");
    if (el) {
      el.classList.add("hidden");
      el.innerHTML = "";
    }
  }

  function showGate(decision) {
    const el = $("#gate-overlay");
    if (!el) return;
    el.classList.remove("hidden");
    if (decision.missing === "deny") {
      el.innerHTML = `
        <div class="gate-card">
          <div class="kicker">Blocked at the router</div>
          <h2 id="gate-title">Not this profile</h2>
          <p class="deny">${decision.reason}</p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn primary" id="gate-lock">Sign in as parent</button>
            <button class="btn ghost" id="gate-cancel">Back</button>
          </div>
        </div>`;
      $("#gate-lock").onclick = () => { hideGate(); BKAccess.lockAll(); setView("lock"); };
      $("#gate-cancel").onclick = () => hideGate();
      return;
    }
    if (decision.missing === "parental-gate") {
      const ch = BKAccess.mintParentalChallenge();
      el.innerHTML = `
        <div class="gate-card">
          <div class="kicker">Parental gate · no password</div>
          <h2 id="gate-title">Ask a parent</h2>
          <p>${ch.prompt}</p>
          <p class="meta">Type the answer in words, not digits. This is the Kids Category gate in front of purchases, settings, and outbound links.</p>
          <input id="gate-words" type="text" autocomplete="off" autocapitalize="off" placeholder="sixty-four">
          <p class="meta" id="gate-err"></p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn primary" id="gate-go">Continue</button>
            <button class="btn ghost" id="gate-cancel">Cancel</button>
          </div>
        </div>`;
      const finish = () => {
        const res = BKAccess.solveParental($("#gate-words").value);
        if (!res.ok) {
          $("#gate-err").textContent = res.reason === "words-only"
            ? "Words only — digits do not pass this gate."
            : "That does not match. Ask a parent to try again.";
          return;
        }
        hideGate();
        setView(decision.route, { retry: true });
      };
      $("#gate-go").onclick = finish;
      $("#gate-words").onkeydown = (e) => { if (e.key === "Enter") finish(); };
      $("#gate-cancel").onclick = () => hideGate();
      setTimeout(() => $("#gate-words").focus(), 50);
      return;
    }
    if (decision.missing === "parent-pin" || decision.missing === "student-pin") {
      const studentPin = decision.missing === "student-pin";
      const stu = currentStudent();
      el.innerHTML = `
        <div class="gate-card">
          <div class="kicker">${studentPin ? "Student PIN · grades 6–8" : "Parent PIN"}</div>
          <h2 id="gate-title">${studentPin ? "Hi, " + (stu ? stu.firstName : "") : "Parent unlock"}</h2>
          <p>${decision.reason}</p>
          <input id="gate-pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off">
          <p class="meta" id="gate-err"></p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn primary" id="gate-go">Unlock</button>
            <button class="btn ghost" id="gate-cancel">Cancel</button>
            ${studentPin ? "" : '<button class="btn ghost" id="gate-recover">Forgot PIN</button>'}
          </div>
        </div>`;
      const finish = () => {
        const pin = $("#gate-pin").value;
        const res = studentPin
          ? BKAccess.verifyStudentPin(ui.studentId, pin)
          : BKAccess.verifyParentPin(pin);
        if (!res.ok) {
          $("#gate-err").textContent = "That PIN does not match.";
          return;
        }
        if (!studentPin && decision.route === "student" && stu && BKAccess.tierForGrade(stu.grade) === "k5") {
          BKAccess.grantStudent(stu.id);
        }
        hideGate();
        setView(decision.route, { retry: true });
      };
      $("#gate-go").onclick = finish;
      $("#gate-pin").onkeydown = (e) => { if (e.key === "Enter") finish(); };
      $("#gate-cancel").onclick = () => hideGate();
      const rec = $("#gate-recover");
      if (rec) rec.onclick = () => { hideGate(); setView("recover"); };
      setTimeout(() => $("#gate-pin").focus(), 50);
      return;
    }
    if (decision.missing === "teacher-session") {
      if (window.BKTeacher) BKTeacher.seedDemo();
      el.innerHTML = `
        <div class="gate-card">
          <div class="kicker">Teacher · separate surface</div>
          <h2 id="gate-title">Class sign-in</h2>
          <p>${decision.reason}</p>
          <input id="gate-pin" type="password" inputmode="numeric" maxlength="4" placeholder="7391" autocomplete="off">
          <p class="meta" id="gate-err"></p>
          <button class="btn primary" id="gate-go">Open class</button>
          <button class="btn ghost" id="gate-cancel">Cancel</button>
        </div>`;
      const finish = () => {
        const res = BKAccess.verifyTeacherPin($("#gate-pin").value);
        if (!res.ok) {
          $("#gate-err").textContent = "That is not the teacher PIN.";
          return;
        }
        hideGate();
        setView(decision.route, { retry: true });
      };
      $("#gate-go").onclick = finish;
      $("#gate-cancel").onclick = () => hideGate();
    }
  }

  function applyNavVisibility() {
    const ctx = BKAccess.context({ studentId: ui.studentId });
    const hideForK5Child = ctx.actor === "student" && ctx.tier === "k5";
    const hideForMiddleChild = ctx.actor === "student" && ctx.tier === "middles";
    $$(".nav-pills [data-view]").forEach((b) => {
      const route = b.dataset.view;
      let show = true;
      if (hideForK5Child && ["parent", "billing", "admin", "evidence", "settings", "profiles", "rollover", "teacher", "assign"].includes(route)) show = false;
      if (hideForMiddleChild && ["parent", "billing", "admin", "evidence", "rollover"].includes(route)) show = false;
      if (route === "goals" || route === "student-hq") show = ctx.actor === "student" && (ctx.tier === "middles" || ctx.tier === "hs");
      if (route === "weekly") show = ctx.actor === "parent";
      b.style.display = show ? "" : "none";
    });
    const bar = $("#debug-bar");
    if (bar) bar.style.display = hideForK5Child ? "none" : "";
  }

  function setView(name, opts) {
    if (name === "external-link") {
      const decision = BKAccess.authorize("external-link", { studentId: ui.studentId });
      if (!decision.ok) {
        ui.pendingExternal = opts && opts.href;
        showGate(decision);
        return;
      }
      const href = (opts && opts.href) || ui.pendingExternal;
      ui.pendingExternal = null;
      if (href) window.open(href, "_blank", "noopener");
      return;
    }

    const decision = BKAccess.authorize(name, { studentId: ui.studentId });
    if (!decision.ok) {
      showGate(decision);
      return;
    }
    hideGate();
    if (["student", "session", "goals", "diagnostic", "tutor", "student-hq", "homework", "summer"].includes(name)) {
      const stu = currentStudent();
      if (stu && BKAccess.tierForGrade(stu.grade) === "hs") BKAccess.grantStudent(stu.id);
    }
    if (name === "parent" && BKAccess.parentPinFresh()) BKAccess.session.actor = "parent";
    ui.view = name;
    $$(".view").forEach((v) => v.classList.toggle("hidden", v.id !== "view-" + name));
    $$(".nav-pills [data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    if (window.BKA11y) BKA11y.apply();
    applyChrome();
    applyNavVisibility();
    const renderers = {
      home: renderHome,
      parent: renderParent,
      student: renderStudent,
      session: renderSession,
      diagnostic: renderDiagnostic,
      admin: renderAdmin,
      tutor: renderTutor,
      evidence: renderEvidence,
      lock: renderLock,
      goals: renderGoals,
      settings: renderSettings,
      billing: renderBilling,
      recover: renderRecover,
      mailbox: renderMailbox,
      profiles: renderProfiles,
      report: renderReport,
      rollover: renderRollover,
      "student-hq": renderStudentHq,
      weekly: renderWeekly,
      homework: renderHomework,
      summer: renderSummer,
      teacher: renderTeacher,
      assign: renderAssign,
      "class-report": renderClassReport,
      privacy: renderPrivacy,
      listing: renderListing,
      consent: renderConsent,
      signup: renderSignup
    };
    (renderers[name] || renderHome)();
  }

  function sentenceFor(student) {
    const s = BKHQ.sentence(student);
    return s.line + " " + s.ask;
  }

  function renderHome() {
    $("#view-home").innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <div class="kicker">Brain Kit · Phase 4 access control</div>
          <h2>The student is the hero. Kit carries the tools.</h2>
          <p>A K–12 practice engine built to fix IXL’s worst habits: scores never drop, wrong answers teach, sessions end, and the parent gets one sentence.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
            <button class="btn primary" data-go="student">Open student belt</button>
            <button class="btn" data-go="parent">Parent HQ</button>
            <button class="btn leaf" data-go="admin">Coverage & import</button>
          </div>
        </div>
        <img src="assets/hero.jpg" alt="Kit helping a student">
      </section>
      <div class="grid cols-3">
        <div class="card"><div class="kicker">Rule 1</div><h3>Progress never goes backward</h3><p class="meta">A rough session slows the bar. It does not reverse it. There is no SmartScore cliff.</p></div>
        <div class="card"><div class="kicker">Rule 2</div><h3>Wrong answers teach</h3><p class="meta">First miss: a hint. Second miss: a teach sequence, then an easier retest.</p></div>
        <div class="card"><div class="kicker">Rule 3</div><h3>Sessions end</h3><p class="meta">12 questions or 10 minutes, finish line visible from the first tap.</p></div>
      </div>
    `;
    $$("#view-home [data-go]").forEach((b) => b.onclick = () => setView(b.dataset.go));
  }

  function renderParent() {
    if (window.BKHQ) BKHQ.seedDemoSignals();
    const cards = BKStore.state.students.map((s) => {
      const sen = BKHQ.sentence(s);
      const n = BK_gradeNumber(s.grade);
      const control = n >= 9 ? "Visibility only" : n >= 6 ? "Shared goals" : "You drive";
      return `
      <div class="card">
        <div class="kicker">Grade ${s.grade} · ${control}</div>
        <h3>${s.firstName}</h3>
        <p class="one-liner">${sen.line}</p>
        <p>${sen.ask}</p>
        <p class="meta">Streak ${s.streak && s.streak.count ? s.streak.count : 0} — pauses, never breaks.</p>
        <button class="btn ghost" data-report="${s.id}">${BKA11y.t("deeper")}</button>
        <button class="btn ghost" data-speak="${s.id}">${BKA11y.t("speak")}</button>
      </div>`;
    }).join("");
    $("#view-parent").innerHTML = `
      <div class="kicker">${BKA11y.t("parentHq")}</div>
      <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 16px">${BKA11y.t("oneCard")}</h2>
      <div class="grid cols-3">${cards}</div>
      <div class="notice" style="margin-top:16px">Metrics live one tap deeper. The weekly email uses this same sentence — not a dashboard dump.</div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" id="send-weekly">${BKA11y.t("weekly")}</button>
        <button class="btn" id="manage-profiles">${BKA11y.t("profiles")}</button>
        <button class="btn ghost" id="parent-settings">${BKA11y.t("settings")}</button>
      </div>
    `;
    $$("#view-parent [data-report]").forEach((b) => b.onclick = () => { ui.studentId = b.dataset.report; initSelects(); setView("evidence"); });
    $$("#view-parent [data-speak]").forEach((b) => b.onclick = () => {
      const stu = BKStore.student(b.dataset.speak);
      const sen = BKHQ.sentence(stu);
      BKA11y.speak(sen.line + " " + sen.ask);
    });
    $("#send-weekly").onclick = () => setView("weekly");
    $("#manage-profiles").onclick = () => setView("profiles");
    $("#parent-settings").onclick = () => setView("settings");
  }

  function renderStudent() {
    const stu = currentStudent();
    const gradeNum = BK_gradeNumber(stu.grade);
    const mat = maturity();
    const agency = BKBelt.agencyFor(stu.grade);
    const kit = BKBelt.kitPresence(mat);
    const belt = BKBelt.beltFor(stu).map((t) => `
        <div class="tool ${t.unlocked ? "stage-" + t.stage.id : "locked"}" title="${t.unlocked ? t.subject + " · " + t.slotCopy : "not unlocked yet"}">
          <div class="emoji">${t.icon}</div>
          <strong>${t.label}</strong>
          <span class="meta">${t.slotCopy}</span>
          ${t.unlocked ? `<div class="xp"><span style="width:${t.xp}%"></span></div>` : ""}
        </div>`).join("");
    const skills = window.BKSummer ? BKSummer.pool(stu) : BKEngine.visibleSkills(stu);
    const options = skills.map((s) => `<option value="${s.id}">${s.subject} · ${s.skill_name}</option>`).join("");
    const season = window.BKSummer ? BKSummer.mode() : "school";
    const streak = window.BKSummer ? BKSummer.streakAlive(stu) : { done: 0, needed: 1 };
    const queued = (stu.sessionQueue || []).map((id) => {
      const s = BKStore.skillById(id);
      return s ? `<li>${s.skill_name} <span class="meta">(prerequisite queued — next session)</span></li>` : "";
    }).join("");
    $("#view-student").innerHTML = `
      <div class="kicker">${mat === "hs" ? "Practice" : mat === "middles" ? "Your belt" : "Kit is ready"}</div>
      <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${mat === "k5" ? "Grab a tool, " + stu.firstName : stu.firstName + "’s belt"}</h2>
      <p class="meta" style="margin-bottom:14px">Grade ${stu.grade} · ${BK_toolsForGrade(stu.grade).length} tools · ${agency.label} ${kit.caption}</p>
      <div class="belt">${belt}</div>
      <div class="grid cols-2" style="margin-top:18px">
        <div class="card">
          <h3>Start a session</h3>
          <p class="meta">${season === "summer" ? "Summer: 6 questions or 5 minutes. Hold ground." : season === "bridge" ? "Bridge Week: a light preview of next year." : "Finish line: 12 questions or 10 minutes."} Streak ${streak.done}/${streak.needed} this week.</p>
          <select id="skill-pick" style="width:100%;margin:10px 0;padding:8px;border-radius:10px;border:1px solid var(--line)">${options || "<option value=''>No in-band skills published yet</option>"}</select>
          <button class="btn primary" id="start-session" ${options ? "" : "disabled"}>Start</button>
        </div>
        <div class="card kit-row">
          <img src="assets/kit-portrait.jpg" alt="Kit" style="width:${kit.size}px;height:${kit.size}px">
          <div>
            <h3>Placement, not a test</h3>
            <p class="meta">About 10 adaptive questions in one subject. Assigned work never jumps a band.</p>
            <select id="diag-subject" style="width:100%;margin:8px 0;padding:8px;border-radius:10px;border:1px solid var(--line)">
              ${BKPlacement.subjectsFor(stu).map((s) => `<option>${s}</option>`).join("")}
            </select>
            <button class="btn leaf" id="open-homework">I'm stuck on homework</button>
            <button class="btn ghost" id="open-summer">Summer Bridge</button>
            <button class="btn" id="start-diag">Free diagnostic report</button>
            ${gradeNum >= 6 ? `<button class="btn ghost" id="edit-goals" style="margin-top:8px">Tonight’s goal</button> <button class="btn ghost" id="open-myhq" style="margin-top:8px">My HQ</button>` : ""}
            <div style="margin-top:10px">${queued ? "<strong>Queued from last session</strong><ul>" + queued + "</ul>" : "<span class='meta'>No prerequisite gaps queued.</span>"}</div>
            <p class="meta" style="margin-top:12px">Class code: <input id="join-code" placeholder="MAPLE7" style="width:90px"> <button class="btn ghost" id="join-class">Join</button></p>
            <p class="meta" style="margin-top:12px">Help article (external): <a href="https://example.com/brain-kit-help" data-external="1">brain-kit help</a></p>
          </div>
        </div>
      </div>
    `;
    $("#start-session").onclick = () => startSession($("#skill-pick").value);
    $("#start-diag").onclick = () => startDiagnostic($("#diag-subject").value);
    $("#open-homework").onclick = () => setView("homework");
    const sumBtn = $("#open-summer");
    if (sumBtn) sumBtn.onclick = () => setView("summer");
    const goalsBtn = $("#edit-goals");
    if (goalsBtn) goalsBtn.onclick = () => setView("goals");
    const myhq = $("#open-myhq");
    if (myhq) myhq.onclick = () => setView("student-hq");
    bindExternalLinks($("#view-student"));
    const join = $("#join-class");
    if (join) join.onclick = () => {
      BKTeacher.seedDemo();
      const res = BKTeacher.join($("#join-code").value, stu.id);
      alert(res.ok ? "Linked to " + res.className : res.reason);
    };
  }

  function startSession(skillId) {
    try {
      ui.session = BKEngine.nextAsk(BKEngine.createSession(ui.studentId, skillId));
      ui.selectedChoice = null;
      setView("session");
    } catch (err) {
      if (/PAYWALL|FREE_CAP/.test(err.message)) {
        ui.paywallReason = err.message;
        setView("billing");
        return;
      }
      alert(err.message);
    }
  }

  function renderSession() {
    const s = ui.session;
    if (!s) { setView("student"); return; }
    const skill = BKStore.skillById(s.skillId);
    const stu = currentStudent();
    const mastery = BKStore.masteryOf(stu.id, skill.id);
    const remain = BKEngine.remainingMs(s);
    const mm = Math.floor(remain / 60000);
    const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");

    let body = "";
    if (s.phase === "done") {
      if (skill.summer_light && window.BKSummer) {
        const w = Number(skill.week || ui.summerWeek || 0);
        if (w) BKSummer.markWeek(stu.id, w);
      }
      body = `
        <div class="card">
          <div class="kicker">Session complete</div>
          <h3>That’s the finish line.</h3>
          <p>Asked ${s.asked} questions. Mastery on this skill is ${mastery.progress}% — it did not go down.</p>
          <p class="meta">Reason: ${s.finishReason}. Streaks pause; they do not break.</p>
          <button class="btn primary" id="back-student">Back to the belt</button>
        </div>`;
    } else if (s.phase === "teach") {
      body = `
        <div class="teach">
          <div class="kit-row">
            <img src="assets/kit-portrait.jpg" alt="Kit">
            <div>
              <div class="kicker">Let’s look at that one again</div>
              <p>${skill.teach_content.explanation}</p>
              <p><strong>Worked example.</strong> ${skill.teach_content.worked_example}</p>
              <button class="btn primary" id="after-teach">Try an easier one</button>
              <button class="btn ghost" id="open-tutor">Ask Kit (4 turns)</button>
            </div>
          </div>
        </div>`;
    } else if (s.phase === "hint") {
      body = questionBlock(s, skill, true);
    } else if (s.phase === "feedback") {
      const kind = s.lastVerdict;
      const copy =
        kind === "correct"
          ? "That’s it. The bar only moves forward."
          : kind === "practice"
            ? "We’ll park this as needs practice" + (s.queuedPrereq ? " and queue “" + s.queuedPrereq.skill_name + ".”" : ".")
            : "Ready for the next one.";
      body = `
        <div class="card">
          <div class="kicker">${kind === "correct" ? "Nice." : "Noted."}</div>
          <p class="one-liner">${copy}</p>
          <p class="meta">Skill progress ${mastery.progress}% · difficulty now ${s.currentDifficulty}</p>
          <button class="btn primary" id="next-q">Next</button>
        </div>`;
    } else {
      body = questionBlock(s, skill, false);
    }

    $("#view-session").innerHTML = `
      <div class="session-head">
        <div>
          <div class="kicker">${skill.subject} · ${BK_standardLabel(skill)}</div>
          <strong>${skill.skill_name}</strong>
        </div>
        <div class="meters">
          <span>${s.asked} / ${s.questionCap}</span>
          <div class="track"><i style="width:${(s.asked / s.questionCap) * 100}%"></i></div>
          <span>${mm}:${ss}</span>
        </div>
      </div>
      ${body}
    `;
    const next = $("#next-q");
    if (next) next.onclick = () => { ui.session = BKEngine.nextAsk(s); ui.selectedChoice = null; renderSession(); };
    const back = $("#back-student");
    if (back) back.onclick = () => setView("student");
    const after = $("#after-teach");
    if (after) after.onclick = () => { ui.session = BKEngine.afterTeach(s); ui.selectedChoice = null; renderSession(); };
    const tutor = $("#open-tutor");
    if (tutor) tutor.onclick = () => openTutorFromTeach();
    const speakQ = $("#speak-q");
    if (speakQ) speakQ.onclick = () => BKA11y.speak((s.currentQuestion && s.currentQuestion.prompt) || "");
    const live = $("#live-status");
    if (live && s.lastVerdict) live.textContent = s.lastVerdict === "correct" ? "That's it. Progress held." : "Let's look at that one again.";
    bindChoices(s);
  }

  function questionBlock(s, skill, showHint) {
    const q = s.currentQuestion;
    const choices = q.choices.map((c) => `<button class="choice ${ui.selectedChoice === c ? "selected" : ""}" data-c="${encodeURIComponent(c)}">${c}</button>`).join("");
    return `
      <div class="card">
        <div class="kicker">${s.phase === "retest" ? "Easier check" : "Your turn"}</div>
        <div class="question" id="q-prompt">${q.prompt}</div>
        <button class="btn ghost" id="speak-q" type="button">${window.BKA11y ? BKA11y.t("speak") : "Listen"}</button>
        ${showHint ? `<div class="notice">Hint: ${q.hint}</div>` : ""}
        <div class="choices" role="group" aria-label="Answer choices">${choices}</div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn primary" id="submit-ans">Check</button>
          <button class="btn ghost" id="end-now">End session</button>
        </div>
      </div>`;
  }

  function bindChoices(s) {
    $$(".choice").forEach((b, i) => {
      b.setAttribute("tabindex", "0");
      b.onclick = () => {
        ui.selectedChoice = decodeURIComponent(b.dataset.c);
        renderSession();
      };
      b.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.click(); }
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const all = $$(".choice");
          all[(i + 1) % all.length].focus();
        }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const all = $$(".choice");
          all[(i - 1 + all.length) % all.length].focus();
        }
      };
    });
    const submit = $("#submit-ans");
    if (submit) submit.onclick = () => {
      if (!ui.selectedChoice) return;
      const q = s.currentQuestion;
      const correct = ui.selectedChoice === q.answer;
      if (s.phase === "retest") {
        ui.session = BKEngine.applyRetest(s, correct);
      } else if (correct) {
        ui.session = BKEngine.applyCorrect(s);
      } else {
        s.lastStudentAnswer = ui.selectedChoice;
        ui.session = BKEngine.applyWrong(s);
      }
      ui.selectedChoice = null;
      renderSession();
    };
    const end = $("#end-now");
    if (end) end.onclick = () => { ui.session = BKEngine.finish(s, "student-ended"); renderSession(); };
  }

  function startDiagnostic(subject) {
    try {
      ui.diagnostic = BKPlacement.next(BKPlacement.create(ui.studentId, subject || "Reading"));
      setView("diagnostic");
    } catch (err) {
      alert(err.message);
    }
  }

  function renderDiagnostic() {
    const d = ui.diagnostic;
    if (!d) { setView("student"); return; }
    if (d.finished && d.report) {
      ui.lastReport = d.report;
      setView("report");
      return;
    }
    if (!d.current) {
      BKPlacement.next(d);
      if (d.finished) {
        if (!d.report) BKPlacement.finishEarly(d);
        ui.lastReport = d.report;
        setView("report");
        return;
      }
    }
    const it = d.current;
    $("#view-diagnostic").innerHTML = `
      <div class="card">
        <div class="kicker">Placement · not a test · ${d.asked + 1} / ${d.target} · ${d.subject}</div>
        <p class="meta">${it.skill.skill_name} · stays in ${it.skill.grade_band}</p>
        <div class="question">${it.q.prompt}</div>
        <div class="choices">${it.q.choices.map((c) => `<button class="choice" data-c="${encodeURIComponent(c)}">${c}</button>`).join("")}</div>
        <button class="btn ghost" id="diag-stop" style="margin-top:12px">Finish and see the report</button>
      </div>`;
    $$("#view-diagnostic .choice").forEach((b) => {
      b.onclick = () => {
        BKPlacement.answer(d, decodeURIComponent(b.dataset.c));
        renderDiagnostic();
      };
    });
    $("#diag-stop").onclick = () => {
      BKPlacement.finishEarly(d);
      ui.lastReport = d.report;
      setView("report");
    };
  }

  function renderReport() {
    const stu = currentStudent();
    const report = ui.lastReport || (stu.placement && (stu.placement.Reading || Object.values(stu.placement)[0]));
    if (!report) {
      $("#view-report").innerHTML = `<div class="card"><p>No placement report yet. Run the free diagnostic from the belt.</p></div>`;
      return;
    }
    $("#view-report").innerHTML = `
      <div class="card">
        <div class="kicker">Free diagnostic report · ${report.subject} · not a test</div>
        <p class="one-liner">${report.headline}</p>
        <p>${report.body}</p>
        <p><strong>Three skills to work on:</strong></p>
        <ul>${(report.skills || []).map((s) => `<li>${s}</li>`).join("")}</ul>
        <p class="meta">${report.correct} of ${report.asked} in this sample. Shareable with a teacher. Not a state-recognized portfolio. No card required.</p>
        <div class="notice" style="margin-top:14px">
          <strong>The report is free. Practice is Complete.</strong>
          ${BKBilling.onTrial() ? " You have " + BKBilling.trialDaysLeft() + " days left on the Complete trial." : " Seven days of Complete on signup — then Essentials or Complete."}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn primary" id="rep-buy">Start Complete · $7.99/mo or $69/yr</button>
          <button class="btn" id="rep-parent">Send to Parent HQ</button>
          <button class="btn ghost" id="rep-back">Back to the belt</button>
        </div>
      </div>`;
    $("#rep-parent").onclick = () => setView("parent");
    $("#rep-back").onclick = () => setView("student");
    $("#rep-buy").onclick = () => setView("billing");
  }

  function renderRollover() {
    const stu = currentStudent();
    const events = (stu.rolloverEvents || []).slice().reverse();
    const agency = BKBelt.agencyFor(stu.grade);
    $("#view-rollover").innerHTML = `
      <div class="card">
        <div class="kicker">August level-up</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${stu.firstName} is in grade ${stu.grade}</h2>
        <p>${agency.label}</p>
        <p class="meta">Mastery does not reset. New tools unlock. The interface matures one step. Same account — K–5, 6–8, then 9–12.</p>
        <button class="btn primary" id="do-roll">Simulate August level-up</button>
        <p class="meta" id="roll-msg" style="margin-top:10px"></p>
        <h3 style="margin-top:18px">Continuity of record</h3>
        ${events.length ? "<ul>" + events.map((e) => `<li>Grade ${e.fromGrade} → ${e.toGrade}${e.newTools.length ? " · unlocked " + e.newTools.join(", ") : ""} · mastery carried</li>`).join("") + "</ul>" : "<p class='meta'>No rollovers yet.</p>"}
      </div>`;
    $("#do-roll").onclick = () => {
      const res = BKBelt.rollover(stu.id);
      if (!res.ok) {
        $("#roll-msg").textContent = "Already at 12th grade.";
        return;
      }
      initSelects();
      applyChrome();
      $("#roll-msg").textContent = "Now grade " + res.event.toGrade + ". Mastery carried forward." + (res.event.newTools.length ? " Unlocked: " + res.event.newTools.join(", ") + "." : "");
      renderRollover();
    };
  }

  function openTutorFromTeach() {
    const s = ui.session;
    if (!s || s.phase !== "teach") {
      setView("session");
      return;
    }
    const skill = BKStore.skillById(s.skillId);
    const started = BKTutor.start({
      source: "teach",
      studentId: ui.studentId,
      grade: currentStudent().grade,
      gradeBand: skill.grade_band,
      skill: { id: skill.id, skill_name: skill.skill_name },
      question: { id: s.currentQuestion && s.currentQuestion.id, prompt: s.currentQuestion && s.currentQuestion.prompt },
      studentAnswer: s.lastStudentAnswer || "(missed twice)",
      correctAnswer: s.currentQuestion && s.currentQuestion.answer
    });
    if (!started.ok) {
      alert(started.reason);
      setView("session");
      return;
    }
    ui.kit = started.session;
    setView("tutor");
  }

  function renderTutor() {
    const homeworkKit = ui.kit && ui.kit.source === "homework";
    const s = ui.session;
    if (!homeworkKit && (!s || s.phase !== "teach")) {
      setView("session");
      return;
    }
    if (!ui.kit) {
      openTutorFromTeach();
      return;
    }
    const skill = (s && BKStore.skillById(s.skillId)) || (ui.kit.ctx && ui.kit.ctx.skill);
    const kit = ui.kit;
    const bubbles = kit.log.map((m) => `<div class="bubble ${m.who === "kit" ? "kit" : "you"}">${m.text}</div>`).join("");
    const kitImg = maturity() === "hs" ? "assets/kit-portrait.jpg" : "assets/kit-portrait.jpg";
    $("#view-tutor").innerHTML = `
      <div class="card">
        <div class="kit-row">
          <img src="${kitImg}" alt="Kit">
          <div>
            <div class="kicker">Kit · ${kit.turns} / ${BKTutor.TURN_CAP} · ${kit.band} voice · parent-visible</div>
            <p class="meta">${(skill && (skill.skill_name || skill.name)) || "This problem"} · ${kit.source} · answer withheld</p>
            <div class="chat">${bubbles}</div>
            ${kit.capped ? `<p class="notice">Four turns. Back to the easier check.</p><button class="btn primary" id="tutor-back">Return to practice</button>` : `
              <input id="tutor-in" placeholder="${kit.band === "hs" ? "What did you try?" : "Tell Kit what you tried"}" style="width:100%;margin:12px 0;padding:10px;border-radius:10px;border:1px solid var(--line)">
              <button class="btn primary" id="tutor-send">Send</button>
              <button class="btn ghost" id="tutor-back">Leave Kit</button>
            `}
          </div>
        </div>
      </div>`;
    const back = $("#tutor-back");
    if (back) back.onclick = () => {
      const dest = kit.source === "homework" ? "homework" : "session";
      ui.kit = null;
      setView(dest);
    };
    const send = $("#tutor-send");
    if (send) send.onclick = () => {
      const val = $("#tutor-in").value.trim();
      if (!val) return;
      BKTutor.reply(kit, val);
      renderTutor();
    };
    const box = $("#tutor-in");
    if (box) box.onkeydown = (e) => { if (e.key === "Enter") send && send.click(); };
  }

  function renderAdmin() {
    const skills = BKStore.getSkills();
    const rows = BKImport.coverage(skills, BK_TAXONOMY);
    const filled = rows.filter((r) => r.skills > 0);
    const table = filled.map((r) => `
      <tr>
        <td>${r.band}</td><td>${r.subject}</td><td>${r.strand}</td>
        <td>${r.skills}</td><td>${r.published}</td><td>${r.draft}</td><td>${r.questions}</td>
      </tr>`).join("");
    const skillRows = skills.map((s) => `
      <tr>
        <td>${s.id}</td>
        <td>${s.subject}<br><span class="meta">${s.grade_band} · ${s.grade_or_course}</span></td>
        <td>${s.skill_name}<br><span class="meta">${s.standard_code}</span></td>
        <td>${(s.question_bank || []).length}</td>
        <td>
          <span class="pill ${s.status === "published" ? "ok" : "draft"}">${s.status}</span>
          ${s.status === "draft" ? `<button class="btn ghost" data-pub="${s.id}">Publish</button>` : `<button class="btn ghost" data-draft="${s.id}">Unpublish</button>`}
        </td>
      </tr>`).join("");
    const log = (BKStore.state.importLog || []).map((l) => `<li>${new Date(l.at).toLocaleString()} · ${l.source} · +${l.added} / ${l.updated} updated</li>`).join("") || "<li>No imports yet.</li>";
    $("#view-admin").innerHTML = `
      <div class="kicker">Authoring pipeline</div>
      <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 12px">Coverage dashboard</h2>
      <p class="meta">Subjects, grades, and strands are data. Draft skills never surface to students.</p>
      <div class="grid cols-2" style="margin:16px 0">
        <div class="card">
          <h3>Import CSV</h3>
          <p class="meta">Expected columns match <code>data/reading-skills-sample.csv</code> (20 Reading skills).</p>
          <input type="file" id="csv-file" accept=".csv,text/csv">
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" id="load-sample">Load bundled 20 Reading skills</button>
            <button class="btn" id="load-math">Load math seed</button>
            <button class="btn" id="load-r35">Load Reading 3–5 drafts</button>
            <button class="btn ghost" id="reset-demo">Reset household</button>
          </div>
          <ul class="meta">${log}</ul>
        </div>
        <div class="card">
          <h3>Engine snapshot</h3>
          <p>${skills.length} skills in memory · ${skills.filter((s) => s.status === "published").length} published · ${skills.reduce((n, s) => n + (s.question_bank || []).length, 0)} questions</p>
          <p class="meta">Reading 3–5 charge bar: 150 published skills × 20 items. Draft never reaches a student.</p>
        </div>
      </div>
      <div class="card" style="overflow:auto">
        <h3>Strands with content</h3>
        <table><thead><tr><th>Band</th><th>Subject</th><th>Strand</th><th>Skills</th><th>Pub</th><th>Draft</th><th>Q</th></tr></thead><tbody>${table || "<tr><td colspan=7>Empty — import the sample CSV.</td></tr>"}</tbody></table>
      </div>
      <div class="card" style="overflow:auto;margin-top:16px">
        <h3>Skill register</h3>
        <table><thead><tr><th>ID</th><th>Where</th><th>Skill</th><th>Q</th><th>State</th></tr></thead><tbody>${skillRows}</tbody></table>
      </div>
    `;
    $("#load-sample").onclick = () => fetch("data/reading-skills-sample.csv").then((r) => r.text()).then((t) => {
      const skillsIn = BKImport.fromCSV(t);
      BKStore.upsertSkills(skillsIn, "reading-skills-sample.csv");
      renderAdmin();
    }).catch(() => alert("Open this app through the local server so the CSV can load."));
    $("#load-math").onclick = () => { BKStore.upsertSkills(window.BK_MATH_SEED, "seed-math"); renderAdmin(); };
    $("#load-r35").onclick = () => fetch("data/reading-3-5-draft.json").then((r) => r.json()).then((skills) => {
      BKStore.upsertSkills(skills, "reading-3-5-draft.json");
      renderAdmin();
    }).catch(() => alert("Serve the folder so the draft catalog can load."));
    $("#reset-demo").onclick = () => { BKStore.resetDemo(); seedIfEmpty(); renderAdmin(); };
    $$("#view-admin [data-pub]").forEach((b) => {
      b.onclick = () => { BKStore.setSkillStatus(b.dataset.pub, "published"); renderAdmin(); };
    });
    $$("#view-admin [data-draft]").forEach((b) => {
      b.onclick = () => { BKStore.setSkillStatus(b.dataset.draft, "draft"); renderAdmin(); };
    });
    $("#csv-file").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        BKStore.upsertSkills(BKImport.fromCSV(String(reader.result)), file.name);
        renderAdmin();
      };
      reader.readAsText(file);
    };
  }

  function deepMetricsHtml(stu, voice) {
    const m = BKHQ.metrics(stu);
    const rows = m.history.slice(0, 40).map((h) => {
      const sk = BKStore.skillById(h.skillId);
      return `<tr>
        <td>${new Date(h.ts).toLocaleString()}</td>
        <td>${h.subject}</td>
        <td>${sk ? sk.skill_name : h.skillId}<br><span class="meta">${h.standard_code || ""}</span></td>
        <td>${h.difficulty}</td>
        <td>${h.result}</td>
        <td>${h.progressBefore} → ${h.progressAfter}</td>
      </tr>`;
    }).join("");
    const transcripts = m.transcripts.slice(-5).map((t, i) => {
      const lines = (t.transcript || []).map((turn) => turn.who + ": " + turn.text).join(" / ");
      return `<li>Log ${i + 1}: ${t.turns || "?"} turns${lines ? " — " + lines : ""}</li>`;
    }).join("") || "<li>No Kit transcripts yet.</li>";
    return `
      <div class="grid cols-3" style="margin:16px 0">
        <div class="card"><div class="kicker">Time on task</div><h3>${m.minutesWeek} min this week</h3><p class="meta">${m.questionsWeek} questions · ${m.questionsAll} all-time</p></div>
        <div class="card"><div class="kicker">Mastered</div><h3>${m.mastered.length} skills ≥ 80</h3><p class="meta">${m.mastered.map((x) => x.name).slice(0, 3).join(", ") || "None yet"}</p></div>
        <div class="card"><div class="kicker">Needs practice</div><h3>${m.needing.length}</h3><p class="meta">${m.needing.map((x) => x.name).slice(0, 3).join(", ") || "Clear"}</p></div>
      </div>
      <div class="card">
        <h3>Prerequisite gaps</h3>
        ${m.gaps.length ? "<ul>" + m.gaps.map((g) => "<li>" + g.name + " — queued for the next session</li>").join("") + "</ul>" : "<p class='meta'>None queued.</p>"}
        ${m.goal ? "<p><strong>" + (voice === "student" ? "Your goal" : "Goal") + ":</strong> " + m.goal + "</p>" : ""}
      </div>
      <div class="card" style="overflow:auto;margin-top:16px">
        <h3>Session history</h3>
        <table>
          <thead><tr><th>When</th><th>Subject</th><th>Skill / standard</th><th>Diff</th><th>Result</th><th>Progress</th></tr></thead>
          <tbody>${rows || "<tr><td colspan=6>No questions yet.</td></tr>"}</tbody>
        </table>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Kit transcripts${voice === "parent" ? " (parent-visible)" : ""}</h3>
        <ul>${transcripts}</ul>
      </div>
      <p class="meta" style="margin-top:12px">This is practice history you can share with a teacher. It is not a state-recognized student portfolio.</p>`;
  }

  function renderEvidence() {
    const stu = currentStudent();
    if (window.BKHQ) BKHQ.seedDemoSignals();
    const sen = BKHQ.sentence(stu);
    $("#view-evidence").innerHTML = `
      <div class="kicker">One tap deeper</div>
      <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${stu.firstName}</h2>
      <p class="one-liner">${sen.line}</p>
      <p>${sen.ask}</p>
      ${deepMetricsHtml(stu, "parent")}
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="back-hq">Back to one sentence</button>
        <button class="btn primary" id="export-pdf">Download practice PDF</button>
        <button class="btn ghost" id="export-print">Print view</button>
      </div>
      <p class="meta" id="export-msg" style="margin-top:8px">${BKExport.DISCLAIMER}</p>
    `;
    $("#back-hq").onclick = () => setView("parent");
    $("#export-pdf").onclick = () => {
      BKExport.download(stu, BKStore.state);
      $("#export-msg").textContent = "Downloaded. Share with a teacher — not a legal file.";
    };
    $("#export-print").onclick = () => {
      const w = window.open("", "_blank");
      w.document.write(BKExport.html(BKExport.build(stu, BKStore.state)));
      w.document.close();
    };
  }

  function renderStudentHq() {
    const stu = currentStudent();
    const n = BK_gradeNumber(stu.grade);
    if (n <= 5) {
      $("#view-student-hq").innerHTML = `
        <div class="card">
          <div class="kicker">Not this age</div>
          <p>Grades K–5 don’t get a dashboard. Kit and the belt are the whole view. A parent keeps the one-sentence HQ.</p>
          <button class="btn primary" id="k5-belt">Back to the belt</button>
        </div>`;
      $("#k5-belt").onclick = () => setView("student");
      return;
    }
    if (window.BKHQ) BKHQ.seedDemoSignals();
    const voice = BKHQ.studentSentence(stu);
    const shared = n <= 8;
    $("#view-student-hq").innerHTML = `
      <div class="kicker">${shared ? "Your HQ · parent can see this" : "Your HQ · you own it"}</div>
      <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${stu.firstName}</h2>
      <p class="one-liner">${voice.line}</p>
      <p>${voice.ask}</p>
      ${deepMetricsHtml(stu, "student")}
      <div class="card" style="margin-top:16px">
        <h3>${shared ? "Set a goal your parent will see" : "Your goal"}</h3>
        <textarea id="hq-goal" rows="2">${(BKStore.state.goals && BKStore.state.goals[stu.id]) || ""}</textarea>
        <button class="btn primary" id="hq-save" style="margin-top:8px">Save goal</button>
      </div>
    `;
    $("#hq-save").onclick = () => {
      BKStore.setGoal(stu.id, $("#hq-goal").value);
      renderStudentHq();
    };
  }

  function renderWeekly() {
    const existing = (BKStore.state.weeklyNotes || []).map((n) => `
      <div class="mail">
        <strong>${n.subject}</strong>
        <div class="meta">${new Date(n.at).toLocaleString()} · ${n.to}</div>
        ${(n.lines || n.body.split("\n\n")).map((l) => "<p>" + l + "</p>").join("")}
      </div>`).join("") || "<p class='meta'>No weekly notes sent yet.</p>";
    const preview = BKHQ.weeklyNote(BKStore.state);
    $("#view-weekly").innerHTML = `
      <div class="card">
        <div class="kicker">Weekly email</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${BKA11y.t("weeklyTitle")}</h2>
        <p class="meta">To ${preview.to}. One line per child — not a chart.</p>
        ${preview.lines.map((l) => "<p class='one-liner' style='font-size:20px'>" + l + "</p>").join("")}
        <button class="btn primary" id="weekly-send">Send to ${preview.to}</button>
        <button class="btn ghost" id="weekly-box">Open inbox</button>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Sent notes</h3>
        ${existing}
      </div>`;
    $("#weekly-send").onclick = () => {
      BKHQ.sendWeekly(BKStore.state);
      renderWeekly();
    };
    $("#weekly-box").onclick = () => setView("mailbox");
  }

  function renderSummer() {
    const stu = currentStudent();
    BKSummer.ensureCatalog();
    const mode = BKSummer.mode();
    const line = BKSummer.parentLine(stu);
    const weeks = BKSummer.weeks(stu);
    const next = BKSummer.upcomingGrade(stu.grade);
    $("#view-summer").innerHTML = `
      <div class="card">
        <div class="kicker">Summer Bridge · optional</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Try this. You are not supposed to already know it.</h2>
        <p>Eight light skills from grade ${next}. June through August. Finishing them is not the ticket into August rollover.</p>
        <p>${line ? line.line + " " + line.ask : "Force summer below to preview the track. School-year rules are on."}</p>
        <label>Season
          <select id="season-pick">
            <option value="auto">Auto from calendar</option>
            <option value="school">School year</option>
            <option value="summer">Summer Bridge</option>
          </select>
        </label>
      </div>
      <div class="grid cols-2" style="margin-top:16px">
        ${weeks.map((w) => `
          <div class="card">
            <div class="kicker">Week ${w.week}${w.current ? " · this week" : ""}${w.complete ? " · tried" : ""}</div>
            <h3>${w.title}</h3>
            <p class="meta">${w.subject} · grade ${next}</p>
            <p>${w.framing}</p>
            <button class="btn ${w.current ? "primary" : ""}" data-week="${w.week}" data-skill="${w.skillId}">Try this</button>
          </div>`).join("")}
      </div>`;
    $("#season-pick").value = BKStore.state.season || "auto";
    $("#season-pick").onchange = (e) => {
      BKSummer.setMode(e.target.value);
      renderSummer();
    };
    $$("#view-summer [data-skill]").forEach((b) => {
      b.onclick = () => {
        if (BKSummer.mode() !== "summer") BKSummer.setMode("summer");
        ui.summerWeek = Number(b.dataset.week);
        startSession(b.dataset.skill);
      };
    });
  }

  function renderHomework() {
    const stu = currentStudent();
    const demos = BKHomework.DEMOS.filter((d) => {
      const fake = BKHomework.identify(stu, d.text, { filename: d.filename });
      return fake.ok;
    });
    const preview = ui.hwFilePreview
      ? `<p class="meta">Photo attached: ${ui.hwFilePreview}</p>`
      : "";
    const match = ui.hwMatch;
    const matchHtml = match && match.ok
      ? `<div class="card" style="margin-top:12px">
          <div class="kicker">Skill match · not an answer</div>
          <h3>${match.best.skill_name}</h3>
          <p class="meta">${match.best.subject} · ${match.best.standard_code} · in-band only</p>
          <ol>${match.matches.map((m) => "<li>" + m.name + "</li>").join("")}</ol>
          <p class="notice">Homework Rescue teaches the skill. It does not finish the worksheet.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" id="hw-practice">Practice this skill</button>
            <button class="btn" id="hw-kit">Ask Kit about this problem</button>
          </div>
        </div>`
      : (match && !match.ok ? `<p class="deny">${match.reason}</p>` : "");
    $("#view-homework").innerHTML = `
      <div class="card">
        <div class="kicker">Homework Rescue</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Stuck on one thing. Open this.</h2>
        <p>Photograph the page or type the problem. Kit names the skill and takes you into practice — not the answer key.</p>
        <input id="hw-photo" type="file" accept="image/*" capture="environment">
        ${preview}
        <textarea id="hw-text" rows="3" placeholder="Or type a line from the page: 43 − 17" style="width:100%;margin-top:10px">${ui.hwText || ""}</textarea>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn primary" id="hw-id">Find the skill</button>
        </div>
        <p class="meta" style="margin-top:10px">Demo pages (in-band for this grade):</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${demos.map((d) => `<button class="btn ghost" data-demo="${d.id}">${d.label}</button>`).join("") || "<span class='meta'>No demo items in this band.</span>"}
        </div>
      </div>
      ${matchHtml}
    `;
    $("#hw-photo").onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      const meta = BKHomework.fromPhoto(f);
      ui.hwFilePreview = meta.filename;
      if (meta.note && !$("#hw-text").value) ui.hwText = meta.note;
      if (meta.filename) runHomeworkIdentify(ui.hwText || meta.note, meta.filename);
      else renderHomework();
    };
    $("#hw-id").onclick = () => runHomeworkIdentify($("#hw-text").value, ui.hwFilePreview);
    $$("#view-homework [data-demo]").forEach((b) => {
      b.onclick = () => {
        const demo = BKHomework.DEMOS.find((d) => d.id === b.dataset.demo);
        ui.hwText = demo.text;
        ui.hwFilePreview = demo.filename;
        runHomeworkIdentify(demo.text, demo.filename);
      };
    });
    const prac = $("#hw-practice");
    if (prac) prac.onclick = () => {
      BKStore.logHomework(stu.id, { skillId: match.best.id, query: match.query, action: "practice" });
      startSession(match.best.id);
    };
    const kitBtn = $("#hw-kit");
    if (kitBtn) kitBtn.onclick = () => openTutorFromHomework(match);
  }

  function runHomeworkIdentify(text, filename) {
    const stu = currentStudent();
    ui.hwText = text;
    const result = BKHomework.identify(stu, text, { filename: filename || "" });
    ui.hwMatch = result;
    if (result.ok) {
      BKStore.logHomework(stu.id, {
        skillId: result.best.id,
        query: text,
        action: "identify",
        matches: result.matches.map((m) => m.id)
      });
    }
    renderHomework();
  }

  function openTutorFromHomework(match) {
    const skill = match.best;
    const started = BKTutor.start({
      source: "homework",
      studentId: ui.studentId,
      grade: currentStudent().grade,
      gradeBand: skill.grade_band,
      skill: { id: skill.id, skill_name: skill.skill_name },
      question: { id: "hw", prompt: match.query || skill.skill_name },
      studentAnswer: "(from homework page)",
      correctAnswer: (skill.question_bank && skill.question_bank[0] && skill.question_bank[0].answer) || "—"
    });
    if (!started.ok) {
      alert(started.reason);
      return;
    }
    ui.kit = started.session;
    setView("tutor");
  }

  function renderTeacher() {
    if (window.BKTeacher) BKTeacher.seedDemo();
    const cls = BKTeacher.classroom();
    const g = BKTeacher.gaps(cls);
    const rows = g.rows.map((r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.grade}</td>
        <td>${r.minutesWeek} min</td>
        <td>${r.needing[0] || "—"}</td>
        <td>${r.prereq[0] || "—"}</td>
      </tr>`).join("");
    $("#view-teacher").innerHTML = `
      <div class="card">
        <div class="kicker">Classroom · not parent HQ</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${cls.name}</h2>
        <p>Join code <strong>${cls.joinCode}</strong> · ${BKStore.state.teacher.name} · Teachers are free. Consumer product only in v1 — no district DPA.</p>
        <label>Class
          <select id="t-class">${BKTeacher.classrooms().map((c) => `<option value="${c.id}" ${c.id===cls.id?"selected":""}>${c.name} · ${c.joinCode}</option>`).join("")}</select>
        </label>
        <p class="notice">Class-wide gaps and time on task this week. Not a live “who’s online” board.</p>
        <table>
          <thead><tr><th>Student</th><th>Grade</th><th>This week</th><th>Needs practice</th><th>Prerequisite</th></tr></thead>
          <tbody>${rows || "<tr><td colspan=5>No linked students.</td></tr>"}</tbody>
        </table>
        <h3 style="margin-top:16px">Class gaps</h3>
        <ul>${g.classGaps.map((x) => "<li>" + x[0] + " · " + x[1] + " students</li>").join("") || "<li>No shared gaps yet.</li>"}</ul>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn primary" id="t-assign">Assign a skill</button>
          <button class="btn" id="t-report">Weekly class summary</button>
          <button class="btn ghost" id="t-new">New class</button>
          <button class="btn ghost" id="t-dpa">DPA (not in v1)</button>
        </div>
        <p class="meta" id="org-note"></p>
        <p class="meta" style="margin-top:10px">Link a household profile
          <select id="t-link">${BKStore.state.students.map((s) => `<option value="${s.id}">${s.firstName} · G${s.grade}</option>`).join("")}</select>
          <button class="btn ghost" id="t-link-go">Add to class</button>
        </p>
      </div>`;
    $("#t-class").onchange = (e) => { BKTeacher.selectClass(e.target.value); renderTeacher(); };
    $("#t-assign").onclick = () => setView("assign");
    $("#t-report").onclick = () => setView("class-report");
    $("#t-new").onclick = () => {
      const name = window.prompt("Class name", "Room 8 · Grade 7");
      if (!name) return;
      BKTeacher.createClass({ name, grade: 7 });
      renderTeacher();
    };
    $("#t-link-go").onclick = () => {
      const res = BKTeacher.linkHouseholdStudent(cls, $("#t-link").value);
      alert(res.ok ? "Linked to " + res.className : res.reason);
      renderTeacher();
    };
    const note = $("#org-note");
    if (note && window.BKOrg) note.textContent = BKOrg.note();
    const dpa = $("#t-dpa");
    if (dpa) dpa.onclick = () => {
      alert("v1 is consumer-only. A district DPA is a 9–18 month procurement cycle. Teachers stay free as a later distribution channel.");
    };
  }

  function renderAssign() {
    BKTeacher.seedDemo();
    const cls = BKTeacher.classroom();
    const skills = BKStore.publishedSkills();
    $("#view-assign").innerHTML = `
      <div class="card">
        <div class="kicker">Assign · band lock still applies</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Send work to the class</h2>
        <p class="meta">A grade-2 teacher can try to assign 8th-grade work. The engine will refuse it for those students.</p>
        <select id="asg-skill">${skills.map((s) => `<option value="${s.id}">${s.grade_band} · ${s.skill_name}</option>`).join("")}</select>
        <button class="btn primary" id="asg-go" style="margin-top:10px">Assign to Room 12</button>
        <p class="meta" id="asg-msg" style="margin-top:10px"></p>
        <button class="btn ghost" id="asg-back">Back to class</button>
      </div>`;
    $("#asg-go").onclick = () => {
      const res = BKTeacher.assign(cls, $("#asg-skill").value, cls.studentIds);
      $("#asg-msg").textContent = res.ok
        ? "Assigned “" + res.skill + ".” Accepted: " + (res.accepted.join(", ") || "none") + ". Blocked: " + (res.blocked.map((b) => b.name).join(", ") || "none") + "."
        : res.reason;
    };
    $("#asg-back").onclick = () => setView("teacher");
  }

  function renderClassReport() {
    BKTeacher.seedDemo();
    const cls = BKTeacher.classroom();
    const w = BKTeacher.weekly(cls);
    $("#view-class-report").innerHTML = `
      <div class="card">
        <div class="kicker">Weekly class summary</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${w.title}</h2>
        ${w.lines.map((l) => "<p class='one-liner' style='font-size:20px'>" + l + "</p>").join("")}
        <p class="notice">${w.disclaimer}</p>
        <button class="btn primary" id="cr-send">Send to teacher inbox</button>
        <button class="btn" id="cr-back">Back to class</button>
      </div>`;
    $("#cr-send").onclick = () => {
      if (window.BKMail) {
        BKMail.send({
          to: BKStore.state.teacher.email,
          subject: w.title,
          body: w.lines.join("\n"),
          lines: w.lines,
          kind: "class-weekly"
        });
      }
      setView("mailbox");
    };
    $("#cr-back").onclick = () => setView("teacher");
  }

  function seedIfEmpty() {
    const extra = [].concat(window.BK_MATH_SEED || [], window.BK_CATALOG_SEED || []);
    if (extra.length) BKStore.upsertSkills(extra, "catalog");
    if (window.BKHQ && BKStore.state.students.some((s) => s.id === "stu_marcus")) BKHQ.seedDemoSignals();
    if (window.BKTeacher && BKStore.state.students.some((s) => s.id === "stu_marcus")) BKTeacher.seedDemo();
    if (window.BKSummer) BKSummer.ensureCatalog();
    fetch("data/reading-skills-sample.csv")
      .then((r) => r.text())
      .then((t) => BKStore.upsertSkills(BKImport.fromCSV(t), "reading-skills-sample.csv"))
      .catch(() => {});
    fetch("data/reading-3-5-draft.json")
      .then((r) => r.json())
      .then((skills) => BKStore.upsertSkills(skills, "reading-3-5-draft.json"))
      .catch(() => {});
  }

  function bindExternalLinks(root) {
    $$(root ? "a[data-external]" : "a[data-external]", root).forEach((a) => {
      a.onclick = (e) => {
        e.preventDefault();
        setView("external-link", { href: a.getAttribute("href") });
      };
    });
  }

  function renderLock() {
    const students = BKStore.state.students.map((s) => {
      const tier = BKAccess.tierForGrade(s.grade);
      const how = tier === "k5" ? "Parent PIN, then this avatar" : tier === "middles" ? "Student PIN" : "Opens on their own";
      return `<button class="avatar-btn" data-id="${s.id}">
        <strong>${s.firstName}</strong>
        <div class="meta">Grade ${s.grade} · ${how}</div>
      </button>`;
    }).join("");
    $("#view-lock").innerHTML = `
      <div class="grid cols-2">
        <div class="card">
          <div class="kicker">Who is here?</div>
          <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 12px">Unlock the right way</h2>
          <div class="avatar-grid">${students}</div>
        </div>
        <div class="card">
          <h3>${BKA11y.t("parentSignIn")}</h3>
          <p class="meta">${BKA11y.t("parentIntro")} Demo PIN 4821. Email alex@home.kit.</p>
          <button class="btn primary" id="lock-parent">${BKA11y.t("parentSignIn")}</button>
          <button class="btn" id="lock-teacher">I'm a teacher</button>
          <button class="btn leaf" id="lock-signup">${BKA11y.t("newHousehold")}</button>
          <button class="btn ghost" id="lock-demo">${BKA11y.t("demoFamily")}</button>
          <button class="btn ghost" id="lock-recover">Forgot parent PIN</button>
          <button class="btn ghost" id="lock-out">Lock everyone</button>
          <p class="meta" style="margin-top:12px">Elena’s PIN is 2468. Jordan (grade 10) does not need a parent to study. Ms. Reyes’ class PIN is 7391.</p>
        </div>
      </div>`;
    $$("#view-lock [data-id]").forEach((b) => {
      b.onclick = () => {
        ui.studentId = b.dataset.id;
        initSelects();
        const stu = currentStudent();
        if (BKAccess.tierForGrade(stu.grade) === "hs") {
          BKAccess.grantStudent(stu.id);
        }
        setView("student");
      };
    });
    $("#lock-parent").onclick = () => {
      BKAccess.session.actor = "locked";
      setView("parent");
    };
    $("#lock-teacher").onclick = () => {
      BKTeacher.seedDemo();
      const pin = window.prompt("Teacher PIN (demo 7391)");
      const res = BKAccess.verifyTeacherPin(pin);
      if (!res.ok) return alert("Teacher PIN did not match.");
      setView("teacher");
    };
    $("#lock-signup").onclick = () => setView("signup");
    $("#lock-demo").onclick = () => {
      BKStore.resetDemo();
      seedIfEmpty();
      ui.studentId = "stu_marcus";
      initSelects();
      setView("lock");
    };
    $("#lock-recover").onclick = () => setView("recover");
    $("#lock-out").onclick = () => { BKAccess.lockAll(); setView("lock"); };
  }

  function renderGoals() {
    const stu = currentStudent();
    const tier = BKAccess.tierForGrade(stu.grade);
    const can = BKAccess.canChangeStudentRecord(BKAccess.context({ studentId: stu.id }), stu);
    const existing = (BKStore.state.goals && BKStore.state.goals[stu.id]) || "";
    $("#view-goals").innerHTML = `
      <div class="card">
        <div class="kicker">${tier === "hs" ? "You own this" : "Shared goal"}</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${stu.firstName}’s goal</h2>
        <p class="meta">${tier === "hs" ? "No parent credential required to change this." : "You set it; a parent can see it."}</p>
        <textarea id="goal-text" rows="3">${existing}</textarea>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn primary" id="save-goal" ${can.ok ? "" : "disabled"}>Save goal</button>
        </div>
        ${tier === "hs" ? `
          <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
          <h3>Enrolled courses</h3>
          <p class="meta">High school picks courses. Parent PIN is not required for this change.</p>
          <input id="course-text" value="${(stu.enrolledCourses || []).join(", ")}">
          <button class="btn" id="save-courses" style="margin-top:8px">Save courses</button>
        ` : ""}
      </div>`;
    $("#save-goal").onclick = () => {
      BKStore.setGoal(stu.id, $("#goal-text").value);
      setView("student");
    };
    const sc = $("#save-courses");
    if (sc) sc.onclick = () => {
      const list = $("#course-text").value.split(",").map((s) => s.trim()).filter(Boolean);
      BKStore.setCourses(stu.id, list);
      setView("student");
    };
  }

  function renderSettings() {
    const hh = BKStore.state;
    const p = BKA11y.prefs;
    const stu = currentStudent();
    const pack = BKA11y.packFor(stu.id);
    $("#view-settings").innerHTML = `
      <div class="card">
        <div class="kicker">${BKA11y.t("settings")} · parental gate already passed</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${p.locale === "es" ? "Ajustes del hogar" : "Household settings"}</h2>
        <p>Parent: ${hh.parentName} · ${hh.parentEmail}</p>
        <h3>Access</h3>
        <label style="display:block;margin:8px 0"><input type="checkbox" id="set-dyslexia"> Dyslexia-friendly font</label>
        <label style="display:block;margin:8px 0"><input type="checkbox" id="set-quiet"> Reduced-distraction layout</label>
        <label style="display:block;margin:8px 0"><input type="checkbox" id="set-contrast"> High contrast</label>
        <label style="display:block;margin:8px 0"><input type="checkbox" id="set-xtime"> Extended-time sessions (20 min)</label>
        <label style="display:block;margin:8px 0">Text size
          <select id="set-scale"><option value="1">100%</option><option value="1.15">115%</option><option value="1.3">130%</option></select>
        </label>
        <label style="display:block;margin:8px 0">Line spacing
          <select id="set-lh"><option value="1.45">Default</option><option value="1.7">Loose</option><option value="2">Extra</option></select>
        </label>
        <label style="display:block;margin:8px 0">Parent language
          <select id="set-locale"><option value="en">English</option><option value="es">Español</option></select>
        </label>
        <h3 style="margin-top:16px">${BKA11y.t("offline")}</h3>
        <p class="meta">${pack ? BKA11y.t("downloaded") + " · " + pack.skillIds.length + " skills · pending sync " + (pack.pending || []).length : "No pack on this device."}</p>
        <label style="display:block;margin:8px 0"><input type="checkbox" id="set-offline"> Use downloaded pack only</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn" id="dl-pack">Download session pack</button>
          <button class="btn ghost" id="sync-pack">Sync later activity</button>
        </div>
        <p class="meta" id="pack-msg"></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
          <button class="btn" id="set-profiles">${BKA11y.t("profiles")}</button>
          <button class="btn" id="set-billing">Subscription</button>
          <a class="btn" data-external="1" href="https://example.com/privacy">Privacy policy (external)</a>
        </div>
      </div>`;
    $("#set-dyslexia").checked = p.dyslexia;
    $("#set-quiet").checked = p.quiet;
    $("#set-contrast").checked = p.contrast === "high";
    $("#set-xtime").checked = p.extendedTime;
    $("#set-offline").checked = p.offlineOnly;
    $("#set-scale").value = String(p.textScale);
    $("#set-lh").value = String(p.lineHeight);
    $("#set-locale").value = p.locale;
    const persist = () => { BKA11y.save(); BKA11y.apply(); };
    $("#set-dyslexia").onchange = (e) => { p.dyslexia = e.target.checked; persist(); };
    $("#set-quiet").onchange = (e) => { p.quiet = e.target.checked; persist(); };
    $("#set-contrast").onchange = (e) => { p.contrast = e.target.checked ? "high" : "default"; persist(); };
    $("#set-xtime").onchange = (e) => { p.extendedTime = e.target.checked; persist(); };
    $("#set-offline").onchange = (e) => { p.offlineOnly = e.target.checked; persist(); };
    $("#set-scale").onchange = (e) => { p.textScale = Number(e.target.value); persist(); };
    $("#set-lh").onchange = (e) => { p.lineHeight = Number(e.target.value); persist(); };
    $("#set-locale").onchange = (e) => { p.locale = e.target.value; persist(); renderSettings(); };
    $("#dl-pack").onclick = () => {
      const built = BKA11y.buildPack(stu);
      $("#pack-msg").textContent = "Saved " + built.skillIds.length + " in-band skills for " + stu.firstName + ".";
    };
    $("#sync-pack").onclick = () => {
      const res = BKA11y.syncNow(stu.id);
      $("#pack-msg").textContent = res.ok ? "Synced " + res.synced + " queued events." : "Nothing to sync.";
    };
    $("#set-profiles").onclick = () => setView("profiles");
    $("#set-billing").onclick = () => setView("billing");
    bindExternalLinks($("#view-settings"));
  }

  function renderBilling() {
    const b = BKBilling.billing();
    const p = BKBilling.plan();
    const sellTp = BKBilling.canSellTestPrep(BKStore.state.students);
    const yearlyOn = b.interval !== "monthly";
    $("#view-billing").innerHTML = `
      <div class="card">
        <div class="kicker">Billing · parental gate + parent PIN</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Free tier, then the ladder.</h2>
        <p>Now: <strong>${p.name}</strong>${BKBilling.onTrial() ? " · " + BKBilling.trialDaysLeft() + "-day Complete trial on top of free" : ""} · ${b.interval} · ${b.provider || "no card yet"} · ${BKStore.state.students.length}/${BKBilling.profileCap()} profiles${p.id === "free" && !BKBilling.onTrial() ? " · " + BKBilling.questionsToday() + "/10 questions today" : ""}</p>
        ${ui.paywallReason ? `<p class="deny">${ui.paywallReason}</p>` : ""}
        <label><input type="checkbox" id="bill-year" ${yearlyOn ? "checked" : ""}> Annual (better margin after month one — default on)</label>
        <div class="grid cols-3" style="margin-top:14px">
          <div class="card"><div class="kicker">$0</div><h3>Free</h3><p class="meta">10 questions/day, 1 profile, full diagnostic. Permanent. Not a starter SKU.</p><button class="btn ghost" data-plan="free">Stay free</button></div>
          <div class="card"><div class="kicker">$4.99 / $39</div><h3>Essentials</h3><p class="meta">One subject.
            <select id="ess-subj"><option>Math</option><option>Reading</option></select></p>
            <button class="btn" data-plan="essentials">Choose Essentials</button></div>
          <div class="card"><div class="kicker">$7.99 / $69</div><h3>Complete</h3><p class="meta">All subjects. Default recommendation. Family of 4.</p><button class="btn primary" data-plan="complete">Start Complete</button></div>
        </div>
        <p class="meta" style="margin-top:12px">Web = Stripe. iOS subscriptions must be IAP (Apple rejection if you use Stripe in-app). Entitlements sync later. Money stays simulated in this build.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn" id="buy-iap">Pay with IAP</button>
          <button class="btn" id="buy-stripe">Pay with Stripe</button>
          <button class="btn" id="buy-testprep" ${sellTp ? "" : "disabled"}>Test Prep +$9.99${sellTp ? "" : " · not for grade 3"}</button>
          <button class="btn ghost" id="buy-restore">Restore purchases</button>
          <button class="btn ghost" id="buy-cancel">Cancel auto-renew</button>
          <button class="btn ghost" id="buy-delete">Delete household account</button>
        </div>
        <p class="meta" id="buy-msg" style="margin-top:10px"></p>
      </div>`;
    const interval = () => ($("#bill-year").checked ? "yearly" : "monthly");
    $$("#view-billing [data-plan]").forEach((btn) => {
      btn.onclick = () => {
        const d = BKAccess.authorize("purchase", { studentId: ui.studentId });
        if (!d.ok) { showGate(d); return; }
        const planId = btn.dataset.plan;
        if (planId === "free") {
          BKStore.state.billing.plan = "free";
          BKStore.state.plan = "free";
          BKStore.persist();
          renderBilling();
          return;
        }
        const res = BKBilling.checkout({
          plan: planId,
          interval: interval(),
          subject: $("#ess-subj") ? $("#ess-subj").value : "Math",
          provider: "stripe"
        });
        $("#buy-msg").textContent = res.ok ? res.plan.name + " via Stripe · $" + res.amount + " " + res.interval : res.reason;
      };
    });
    $("#buy-iap").onclick = () => {
      const d = BKAccess.authorize("purchase", { studentId: ui.studentId });
      if (!d.ok) { showGate(d); return; }
      const res = BKBilling.checkout({ plan: "complete", interval: interval(), provider: "iap" });
      $("#buy-msg").textContent = "IAP receipt · $" + res.amount + " " + res.interval + " (Apple 30%).";
    };
    $("#buy-stripe").onclick = () => {
      const d = BKAccess.authorize("purchase", { studentId: ui.studentId });
      if (!d.ok) { showGate(d); return; }
      const res = BKBilling.checkout({ plan: "complete", interval: interval(), provider: "stripe" });
      $("#buy-msg").textContent = "Stripe receipt · $" + res.amount + " " + res.interval + ".";
    };
    $("#buy-testprep").onclick = () => {
      const d = BKAccess.authorize("purchase", { studentId: ui.studentId });
      if (!d.ok) { showGate(d); return; }
      const res = BKBilling.addTestPrep(BKStore.state.students, "iap");
      $("#buy-msg").textContent = res.ok ? "Test Prep on. SAT/ACT/CLT/HSPT/SSAT for grades 8–12 only." : res.reason;
    };
    $("#buy-restore").onclick = () => {
      const res = BKBilling.restorePurchases();
      $("#buy-msg").textContent = res.ok ? "Restored " + res.plan + " from the last " + res.provider + " receipt." : res.reason;
      if (res.ok) renderBilling();
    };
    $("#buy-cancel").onclick = () => {
      BKBilling.cancelRenew();
      $("#buy-msg").textContent = "Auto-renew off. Practice continues through the paid window.";
    };
    $("#buy-delete").onclick = () => {
      const d = BKAccess.authorize("delete-account", { studentId: ui.studentId });
      if (!d.ok) { showGate(d); return; }
      $("#buy-msg").textContent = "Deletion would run here after both gates. Demo stops short of wiping the household.";
    };
  }

  function renderRecover() {
    $("#view-recover").innerHTML = `
      <div class="card">
        <div class="kicker">PIN recovery</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Verified email only</h2>
        <p class="meta">Built in from signup — not patched on later. We email a one-time code to the address on the household.</p>
        <input id="rec-email" type="email" placeholder="parent email" value="${BKStore.state.parentEmail || ""}">
        <button class="btn primary" id="rec-send" style="margin-top:10px">Send reset code</button>
        <p class="meta" id="rec-msg"></p>
        <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
        <input id="rec-code" placeholder="6-digit code">
        <input id="rec-pin" placeholder="new 4-digit PIN" inputmode="numeric" maxlength="4" style="margin-top:8px">
        <button class="btn" id="rec-go" style="margin-top:10px">Set new PIN</button>
        <p><button class="btn ghost" id="rec-mail">Open simulated inbox</button></p>
      </div>`;
    $("#rec-send").onclick = () => {
      const res = BKAccess.requestRecovery($("#rec-email").value);
      $("#rec-msg").textContent = res.ok
        ? "Code sent to " + res.sentTo + ". Open the inbox to read it (prototype)."
        : "That address is not the verified parent email.";
    };
    $("#rec-go").onclick = () => {
      const res = BKAccess.completeRecovery($("#rec-code").value, $("#rec-pin").value);
      $("#rec-msg").textContent = res.ok ? "Parent PIN updated. You are signed in as the parent." : "Code or PIN was not accepted (" + res.reason + ").";
      if (res.ok) setView("parent");
    };
    $("#rec-mail").onclick = () => setView("mailbox");
  }

  function renderMailbox() {
    const notes = (BKStore.state.mailbox || []).map((m) => `
      <div class="mail">
        <strong>${m.subject}</strong>
        <div class="meta">To ${m.to} · ${new Date(m.at).toLocaleString()}</div>
        <p>${m.body}</p>
      </div>`).join("") || "<p class='meta'>Inbox empty.</p>";
    $("#view-mailbox").innerHTML = `
      <div class="card">
        <div class="kicker">Prototype mailbox</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Verified parent email</h2>
        ${notes}
        <button class="btn" id="mail-back">Back to recovery</button>
      </div>`;
    $("#mail-back").onclick = () => setView("recover");
  }

  function renderProfiles() {
    const rows = BKStore.state.students.map((s) => `
      <tr>
        <td>${s.firstName}</td>
        <td>
          <select data-grade="${s.id}">
            ${["K",1,2,3,4,5,6,7,8,9,10,11,12].map((g) => `<option value="${g}" ${String(s.grade)===String(g)?"selected":""}>${g}</option>`).join("")}
          </select>
        </td>
        <td>${s.pin ? "Student PIN set" : "No student PIN"}</td>
        <td>
          <button class="btn ghost" data-export="${s.id}">Export</button>
          <button class="btn ghost" data-del="${s.id}">Delete data</button>
        </td>
      </tr>`).join("");
    $("#view-profiles").innerHTML = `
      <div class="card">
        <div class="kicker">Profiles · parent PIN</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Add, remove, change grade</h2>
        <table><thead><tr><th>Name</th><th>Grade</th><th>PIN</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <h3 style="margin-top:16px">Add a profile</h3>
        <div class="grid cols-2">
          <input id="new-name" placeholder="First name">
          <select id="new-grade">${["K",1,2,3,4,5,6,7,8,9,10,11,12].map((g)=>`<option>${g}</option>`).join("")}</select>
        </div>
        <button class="btn primary" id="add-kid" style="margin-top:10px">Add profile</button>
        <p class="meta" id="prof-msg"></p>
        <p class="notice">${BKCompliance.ferpaNote()}</p>
        <p class="meta">Collected on a child: ${BKCompliance.COLLECTED.join(", ")}. Nothing else.</p>
        <button class="btn ghost" id="open-privacy">Plain-language privacy</button>
      </div>`;
    $$("#view-profiles [data-grade]").forEach((sel) => {
      sel.onchange = () => {
        const id = sel.getAttribute("data-grade");
        const target = BKStore.student(id);
        const allowed = BKAccess.canChangeStudentRecord(BKAccess.context({ studentId: ui.studentId }), target);
        if (!allowed.ok || allowed.via !== "parent-pin") {
          $("#prof-msg").textContent = "Grade changes require the parent PIN.";
          return;
        }
        BKStore.setGrade(id, sel.value === "K" ? "K" : Number(sel.value));
        initSelects();
      };
    });
    $$("#view-profiles [data-export]").forEach((b) => {
      b.onclick = () => {
        const data = BKCompliance.exportChild(BKStore.student(b.dataset.export));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "brain-kit-child-export.json";
        a.click();
      };
    });
    $$("#view-profiles [data-del]").forEach((b) => {
      b.onclick = () => {
        BKCompliance.deleteChild(b.dataset.del);
        initSelects();
        renderProfiles();
      };
    });
    $("#open-privacy").onclick = () => setView("privacy");
    $("#add-kid").onclick = () => {
      try {
        const name = $("#new-name").value.trim();
        if (!name) return;
        const g = $("#new-grade").value;
        BKStore.addStudent({ firstName: name, grade: g === "K" ? "K" : Number(g) });
        initSelects();
        renderProfiles();
      } catch (err) {
        $("#prof-msg").textContent = err.message;
      }
    };
    $("#open-privacy").onclick = () => setView("privacy");
  }

  function renderPrivacy() {
    $("#view-privacy").innerHTML = `
      <div class="card">
        <div class="kicker">Privacy · written for a tired parent</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">What we keep. What we don’t.</h2>
        ${BKCompliance.privacyPlain().map((p) => "<p>" + p + "</p>").join("")}
        <h3>Apple Privacy Nutrition Label</h3>
        <p>Data Used to Track You = ${BKCompliance.NUTRITION.track}.</p>
        <p>Data Linked to You = ${BKCompliance.NUTRITION.linked.join(", ")}.</p>
        <p>Data Not Linked to You = ${BKCompliance.NUTRITION.notLinked.join(", ")}.</p>
        <p class="meta">${BKCompliance.NUTRITION.appleCategory} · age rating ${BKCompliance.NUTRITION.ageRating} · Kids-Category behavior kept · no ad SDKs · no social login.</p>
        <button class="btn" id="priv-list">Store listing</button>
      </div>`;
    $("#priv-list").onclick = () => setView("listing");
  }

  function renderListing() {
    const L = BKCompliance.LISTING;
    $("#view-listing").innerHTML = `
      <div class="card">
        <div class="kicker">App Store / Play</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">${L.title}</h2>
        <p class="one-liner">${L.subtitle}</p>
        <p>${L.lead}</p>
        <p class="meta">Keywords: ${L.keywords.join(", ")}</p>
        <p>Screenshots to shoot: Kit + belt (K–5), a hint on a miss, Parent HQ one-liner, the 9–12 interface, the diagnostic report.</p>
        <p>Preview video: 15 seconds. Wrong answer → Kit teaches → bar does not drop.</p>
        <p class="meta">List in Education, not Kids Category. Age 4+. Kids-Category behavior stays so the option is open later.</p>
        <p class="meta">Google Play: Designed for Families. Same data minimization.</p>
        <p><a href="landing.html">brainkitapp.com landing</a></p>
      </div>`;
  }

  function renderConsent() {
    const c = BKCompliance.consent();
    $("#view-consent").innerHTML = `
      <div class="card">
        <div class="kicker">Parental consent · before any profile</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">One checkbox. Then a child.</h2>
        <p>We will store a first name, a grade, and your email. No ads. No trackers. You can export or delete later from Parent HQ.</p>
        <p>Status: <strong>${c.given ? "consent on file · " + c.mode : "not yet"}</strong></p>
        <label><input type="checkbox" id="c-ok"> I am the parent or guardian and I agree.</label>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn primary" id="c-give">Give consent (family)</button>
          <button class="btn" id="c-dist">District DPA mode</button>
          <button class="btn ghost" id="c-rev">Revoke</button>
        </div>
        <p class="meta" id="c-msg"></p>
      </div>`;
    $("#c-give").onclick = () => {
      if (!$("#c-ok").checked) {
        $("#c-msg").textContent = "Check the box first.";
        return;
      }
      BKCompliance.giveConsent("consumer");
      renderConsent();
    };
    $("#c-dist").onclick = () => {
      if (!$("#c-ok").checked) {
        $("#c-msg").textContent = "Check the box first.";
        return;
      }
      BKCompliance.giveConsent("district");
      renderConsent();
    };
    $("#c-rev").onclick = () => { BKCompliance.revokeConsent(); renderConsent(); };
  }

  function renderSignup() {
    $("#view-signup").innerHTML = `
      <div class="card">
        <div class="kicker">First run</div>
        <h2 style="font-family:var(--font);font-size:32px;margin:6px 0 8px">Consent, then a PIN, then a child.</h2>
        <p class="meta">No student profile is created until the parent agrees. Complete trial starts after the first profile.</p>
        <label>Your first name <input id="su-parent" placeholder="Alex"></label>
        <label>Verified email <input id="su-email" type="email" placeholder="you@home.kit"></label>
        <label>4-digit parent PIN <input id="su-pin" inputmode="numeric" maxlength="4" placeholder="••••"></label>
        <label style="display:block;margin:10px 0"><input type="checkbox" id="su-ok"> I am the parent or guardian. Store only a first name, a grade, and this email.</label>
        <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
        <label>Child’s first name <input id="su-child" placeholder="Marcus"></label>
        <label>Grade
          <select id="su-grade">${["K",1,2,3,4,5,6,7,8,9,10,11,12].map((g)=>"<option>"+g+"</option>").join("")}</select>
        </label>
        <button class="btn primary" id="su-go" style="margin-top:12px">Create household</button>
        <p class="meta" id="su-msg"></p>
      </div>`;
    $("#su-go").onclick = () => {
      if (!$("#su-ok").checked) {
        $("#su-msg").textContent = "Consent comes first.";
        return;
      }
      const pin = $("#su-pin").value;
      const email = $("#su-email").value.trim();
      const parent = $("#su-parent").value.trim();
      const child = $("#su-child").value.trim();
      if (!parent || !email || !child) {
        $("#su-msg").textContent = "Parent name, email, and child name are required.";
        return;
      }
      BKStore.startFresh();
      seedIfEmpty();
      BKCompliance.giveConsent("consumer");
      const pinRes = BKAccess.setParentPinAtSignup(pin, email);
      if (!pinRes.ok) {
        $("#su-msg").textContent = "PIN must be four digits.";
        return;
      }
      BKStore.state.parentName = parent;
      const g = $("#su-grade").value;
      const stu = BKStore.addStudent({ firstName: child, grade: g === "K" ? "K" : Number(g) });
      BKBilling.startTrial();
      ui.studentId = stu.id;
      initSelects();
      BKAccess.grantParentPin();
      setView("diagnostic");
    };
  }

  function bindNav() {
    $$(".nav-pills [data-view]").forEach((b) => b.onclick = () => setView(b.dataset.view));
    $("#student-select").onchange = (e) => {
      ui.studentId = e.target.value;
      applyChrome();
      const stay = ["student", "goals", "session", "diagnostic"].includes(ui.view) ? "student" : ui.view;
      setView(stay);
    };
    $("#maturity-select").onchange = (e) => {
      ui.maturityOverride = e.target.value || null;
      applyChrome();
    };
    $("#a11y-dyslexia").onchange = (e) => {
      if (window.BKA11y) { BKA11y.prefs.dyslexia = e.target.checked; BKA11y.save(); BKA11y.apply(); }
      else document.body.classList.toggle("dyslexia", e.target.checked);
    };
    $("#a11y-quiet").onchange = (e) => {
      if (window.BKA11y) { BKA11y.prefs.quiet = e.target.checked; BKA11y.save(); BKA11y.apply(); }
      else document.body.classList.toggle("low-stim", e.target.checked);
    };
  }

  function initSelects() {
    $("#student-select").innerHTML = BKStore.state.students
      .map((s) => `<option value="${s.id}">${s.firstName} (G${s.grade})</option>`)
      .join("");
    $("#student-select").value = ui.studentId;
  }

  seedIfEmpty();
  initSelects();
  bindNav();
  if (window.BKA11y) BKA11y.apply();
  setView("lock");
  setTimeout(() => { if (!BKStore.getSkills().length && window.BK_MATH_SEED) { BKStore.upsertSkills(window.BK_MATH_SEED, "seed-math"); } }, 400);
})();
