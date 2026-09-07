/* Kit — scoped tutor. Not a chatbot.
   Context in: question, student answer, correct answer, skill, grade band.
   Context out: guidance. Never the answer. 4 student turns, then practice. */
(function (global) {
  const TURN_CAP = 4;
  const ALLOWED_SOURCES = { teach: true, homework: true };

  function voiceBand(grade) {
    const n = global.BK_gradeNumber ? global.BK_gradeNumber(grade) : Number(grade) || 0;
    if (n <= 5) return "k5";
    if (n <= 8) return "middles";
    return "hs";
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[“”"']/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokens(s) {
    return norm(s).split(/[^a-z0-9/%]+/).filter(Boolean);
  }

  function containsAnswer(text, answer) {
    const a = norm(answer);
    if (!a || a.length < 2) return false;
    const t = norm(text);
    if (t === a) return true;
    if (t.indexOf(a) !== -1 && a.length >= 3) return true;
    const at = tokens(answer);
    const tt = tokens(text);
    if (at.length && at.every((w) => tt.indexOf(w) !== -1)) {
      if (/^\d+$/.test(a) || a.length >= 2) return true;
    }
    return false;
  }

  function stripLeak(text, answer) {
    if (!containsAnswer(text, answer)) return text;
    return null;
  }

  const LINES = {
    k5: {
      open: "Let’s look at that one again. I will not tell you the answer. What part felt tricky?",
      ask: "What is the question asking you to find? Point at that part.",
      split: "Look at the worked example. Where does your path go a different way?",
      smaller: "Pretend this is an easier one. What would you do first?",
      close: "You have enough to try again on the practice card. I am out of turns.",
      refuse: "I cannot give the answer. Tell me the first small step you would try.",
      confirm: "I will not say yes or no on an answer. Check it against the example, then try the card."
    },
    middles: {
      open: "We stay on this problem. I will not hand you the answer. What did you try?",
      ask: "Name the quantity the question wants. That is the only target.",
      split: "Put your steps next to the worked example. Where do they split?",
      smaller: "Drop one layer of difficulty. What is the first operation?",
      close: "Turn cap. Go back to the easier check. I will not finish it for you.",
      refuse: "No answer from me. Give the next step, not the final number or choice.",
      confirm: "I will not confirm a guess. Compare it to the example and take the card."
    },
    hs: {
      open: "Scoped to this item. I will not give the key. What broke in your approach?",
      ask: "Isolate the unknown. What is actually being asked?",
      split: "Diff your work against the worked example. Find the first diverging step.",
      smaller: "Reduce the problem by one constraint. What is the opening move?",
      close: "Four turns. Back to practice. The key stays off this channel.",
      refuse: "Asking for the answer ends that turn. State a step instead.",
      confirm: "No verdict on a candidate answer. Validate it yourself on the card."
    }
  };

  function pickLine(band, key) {
    return (LINES[band] || LINES.k5)[key];
  }

  function ground(line, session) {
    const prompt = session.ctx.question && session.ctx.question.prompt;
    if (!prompt) return line;
    const clipped = String(prompt).replace(/\s+/g, " ").trim();
    const safe = clipped.length > 48 ? clipped.slice(0, 48) + "…" : clipped;
    if (containsAnswer(safe, session.ctx.correctAnswer)) return line;
    const skill = session.ctx.skill && session.ctx.skill.skill_name;
    const tail = session.band === "hs"
      ? " Stay on: “" + safe + ".”"
      : " Look at: “" + safe + ".”" + (skill ? " Skill: " + skill + "." : "");
    if (containsAnswer(line + tail, session.ctx.correctAnswer)) return line;
    return line + tail;
  }

  function classify(message) {
    const t = norm(message);
    if (!t) return "empty";
    if (/\b(tell me|just give|what's the answer|whats the answer|what is the answer|give me the answer|is it\b|the answer is)\b/.test(t)) {
      return "beg";
    }
    if (/\b(hint|help|stuck|idk|i don't know|dunno)\b/.test(t)) return "hint";
    if (/\b(first|step|start|begin)\b/.test(t)) return "step";
    return "talk";
  }

  function allowedContext(raw) {
    return {
      question: raw.question,
      studentAnswer: raw.studentAnswer,
      correctAnswer: raw.correctAnswer,
      skill: raw.skill,
      gradeBand: raw.gradeBand,
      source: raw.source
    };
  }

  function start(opts) {
    const source = opts && opts.source;
    if (!ALLOWED_SOURCES[source]) {
      return { ok: false, reason: "Kit only opens inside a teach sequence or Homework Rescue." };
    }
    if (!opts.question || !opts.skill) {
      return { ok: false, reason: "Kit needs a specific problem." };
    }
    const ctx = allowedContext(opts);
    const band = voiceBand(opts.grade);
    const session = {
      id: "kit_" + Date.now(),
      studentId: opts.studentId,
      source,
      ctx,
      band,
      grade: opts.grade,
      turns: 0,
      capped: false,
      log: [{ who: "kit", text: pickLine(band, "open"), at: Date.now() }]
    };
    return { ok: true, session };
  }

  function reply(session, userText) {
    if (!session || session.capped || session.turns >= TURN_CAP) {
      session.capped = true;
      return { ok: false, capped: true, text: pickLine(session.band, "close") };
    }
    const text = String(userText || "").trim();
    if (!text) return { ok: false, reason: "empty" };

    session.turns += 1;
    session.log.push({ who: "you", text, at: Date.now() });

    const kind = classify(text);
    let key = "ask";
    if (kind === "beg" || containsAnswer(text, session.ctx.correctAnswer)) key = text === "" ? "refuse" : containsAnswer(text, session.ctx.correctAnswer) ? "confirm" : "refuse";
    else if (kind === "refuse") key = "refuse";
    else if (kind === "beg") key = "refuse";
    else if (session.turns === 1) key = kind === "hint" ? "ask" : "ask";
    else if (session.turns === 2) key = "split";
    else if (session.turns === 3) key = "smaller";
    else key = "close";

    if (kind === "beg") key = "refuse";
    if (containsAnswer(text, session.ctx.correctAnswer)) key = "confirm";
    if (session.turns >= TURN_CAP) {
      key = "close";
      session.capped = true;
    }

    let out = pickLine(session.band, key);
    if (key !== "refuse" && key !== "confirm" && key !== "close") {
      out = ground(out, session);
    }
    if (stripLeak(out, session.ctx.correctAnswer) == null) {
      out = pickLine(session.band, "refuse");
    }
    session.log.push({ who: "kit", text: out, at: Date.now() });

    if (global.BKStore && session.studentId) {
      global.BKStore.logTutor(session.studentId, {
        tutorSessionId: session.id,
        skillId: session.ctx.skill && session.ctx.skill.id,
        questionId: session.ctx.question && session.ctx.question.id,
        source: session.source,
        turns: session.turns,
        capped: session.capped,
        band: session.band,
        context: {
          question: session.ctx.question && session.ctx.question.prompt,
          studentAnswer: session.ctx.studentAnswer,
          skill: session.ctx.skill && session.ctx.skill.skill_name,
          gradeBand: session.ctx.gradeBand
        },
        transcript: session.log.slice()
      });
    }

    return { ok: true, text: out, turns: session.turns, capped: session.capped };
  }

  global.BKTutor = {
    TURN_CAP,
    voiceBand,
    containsAnswer,
    start,
    reply,
    pickLine
  };
})(window);
