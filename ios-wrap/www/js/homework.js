/* Homework Rescue.
   Identify the skill. Route into teaching/practice.
   Never solve the assignment and hand back an answer. */
(function (global) {
  const STOP = { the: 1, a: 1, an: 1, of: 1, and: 1, or: 1, to: 1, in: 1, is: 1, it: 1, on: 1, for: 1, what: 1, which: 1 };

  function tokens(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9%\s\-]/g, " ")
      .split(/\s+/)
      .filter((w) => w && !STOP[w] && (w.length > 1 || /^\d+$/.test(w)));
  }

  function skillText(sk) {
    const q = (sk.question_bank || []).map((x) => x.prompt).join(" ");
    const teach = sk.teach_content ? sk.teach_content.explanation + " " + sk.teach_content.worked_example : "";
    return [sk.skill_name, sk.strand, sk.subject, sk.standard_code, teach, q].join(" ");
  }

  function scoreSkill(sk, query) {
    const qTok = tokens(query);
    const hay = tokens(skillText(sk));
    if (!qTok.length || !hay.length) return 0;
    let hits = 0;
    qTok.forEach((w) => {
      if (hay.indexOf(w) !== -1) hits += 1;
      if ((sk.skill_name || "").toLowerCase().indexOf(w) !== -1) hits += 1.5;
    });
    if (/\b\d+\s*[−\-–]\s*\d+/.test(query) && /subtract|regroup/i.test(sk.skill_name + sk.strand)) hits += 4;
    if (/%|percent/i.test(query) && /percent/i.test(sk.skill_name + skillText(sk))) hits += 4;
    if (/hypotenuse|leg|triangle|pythag/i.test(query) && /pythag/i.test(sk.skill_name)) hits += 4;
    if (/\b(cvc|short a|mat|sat|cat)\b/i.test(query) && /cvc|short-a|phonics/i.test(sk.skill_name + sk.strand)) hits += 3;
    if (/main idea/i.test(query) && /main idea/i.test(sk.skill_name)) hits += 4;
    return hits;
  }

  function identify(student, query, extras) {
    const text = String(query || "").trim();
    if (!text && !(extras && extras.filename)) {
      return { ok: false, reason: "Need a photo or the words from the page." };
    }
    const blob = [text, extras && extras.filename, extras && extras.note].filter(Boolean).join(" ");
    const pool = (global.BKEngine.visibleSkills(student) || []).filter((sk) => (sk.question_bank || []).length);
    const ranked = pool
      .map((sk) => ({ skill: sk, score: scoreSkill(sk, blob) }))
      .sort((a, b) => b.score - a.score);
    const top = ranked.filter((r) => r.score > 0).slice(0, 3);
    if (!top.length) {
      return { ok: false, reason: "Could not match an in-band skill. Try typing one line from the page." };
    }
    return {
      ok: true,
      query: text,
      matches: top.map((r) => ({
        id: r.skill.id,
        name: r.skill.skill_name,
        subject: r.skill.subject,
        strand: r.skill.strand,
        standard: r.skill.standard_code,
        score: r.score
      })),
      best: top[0].skill
    };
  }

  function forbiddenSolve(text, skill) {
    const answers = (skill.question_bank || []).map((q) => String(q.answer));
    const low = String(text || "").toLowerCase();
    const tt = tokens(low);
    return answers.some((a) => {
      if (!a) return false;
      const al = String(a).toLowerCase();
      if (al.length >= 2 && low.indexOf(al) !== -1) return true;
      return tokens(al).length && tokens(al).every((w) => tt.indexOf(w) !== -1);
    });
  }

  function fromPhoto(file) {
    if (!file || !file.name) return { filename: "", note: "" };
    const name = String(file.name);
    const hint = name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    return { filename: name, note: hint, bytes: file.size || 0 };
  }

  const DEMOS = [
    { id: "demo-sub", label: "Worksheet: 43 − 17", text: "Find 43 minus 17. Regroup if you need to.", filename: "math-regrouping-ws.jpg" },
    { id: "demo-pct", label: "Textbook: 20% of 40", text: "What is 20 percent of 40?", filename: "grade7-percent.jpg" },
    { id: "demo-py", label: "Problem: legs 3 and 4", text: "Right triangle legs 3 and 4. Find the hypotenuse.", filename: "geometry-pythag.jpg" },
    { id: "demo-cvc", label: "Page: m-a-t", text: "Read the short-a CVC word m-a-t", filename: "phonics-cvc.jpg" }
  ];

  global.BKHomework = {
    tokens,
    scoreSkill,
    identify,
    forbiddenSolve,
    DEMOS,
    fromPhoto
  };
})(window);
