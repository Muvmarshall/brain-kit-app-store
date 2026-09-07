import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logs = [];
const sandbox = {
  window: {},
  console,
  BK_gradeNumber(g) {
    return g === "K" ? 0 : Number(g);
  },
  BKStore: {
    logTutor(id, entry) {
      logs.push({ id, entry });
    }
  }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/tutor.js"), "utf8"), sandbox);
const T = sandbox.BKTutor;

function assert(c, m) {
  if (!c) throw new Error(m);
}

const blocked = T.start({ source: "idle", question: { prompt: "43-17" }, skill: { id: "x" } });
assert(!blocked.ok, "idle source blocked");

const ctx = {
  source: "teach",
  studentId: "stu_marcus",
  grade: 2,
  gradeBand: "K-2",
  skill: { id: "math-2-sub-1", skill_name: "regrouping" },
  question: { id: "q1", prompt: "43 − 17 =" },
  studentAnswer: "36",
  correctAnswer: "26"
};
const started = T.start(ctx);
assert(started.ok, "teach source allowed");
assert(started.session.band === "k5", "k5 voice");
assert(!T.containsAnswer(started.session.log[0].text, "26"), "open does not leak");

const beg = T.reply(started.session, "just tell me the answer");
assert(/cannot give|No answer|Asking for the answer/.test(beg.text), beg.text);
assert(!T.containsAnswer(beg.text, "26"), "beg does not leak 26");

const guess = T.reply(started.session, "is it 26?");
assert(!T.containsAnswer(guess.text, "26"), "does not confirm 26");
assert(/not say yes or no|not confirm|No verdict/.test(guess.text), guess.text);

T.reply(started.session, "I tried the ones place");
const last = T.reply(started.session, "what do I do");
assert(last.capped, "caps at 4");
const fifth = T.reply(started.session, "please");
assert(fifth.capped, "fifth refused");

assert(logs.length >= 4, "every turn logged");
assert(logs[0].entry.context.studentAnswer === "36", "context includes student answer");
assert(!("correctAnswer" in logs[0].entry.context), "parent log does not reprint the key as context.correctAnswer");

const hs = T.start({ ...ctx, grade: 10, studentId: "stu_jordan" });
assert(hs.session.band === "hs", "hs voice");
assert(/Scoped to this item/.test(hs.session.log[0].text), "peer register");

console.log("PHASE6_OK", { cap: T.TURN_CAP, logs: logs.length });
