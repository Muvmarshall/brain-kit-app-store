import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { window: {}, console };
sandbox.window = sandbox;
sandbox.BKStore = {
  state: {
    parentEmail: "alex@home.kit",
    goals: { stu_jordan: "Geometry warm-up." },
    mailbox: [],
    weeklyNotes: [],
    students: []
  },
  persist() {},
  skillById(id) {
    if (id === "math-2-sub-1") return { id, skill_name: "Subtract two-digit numbers with regrouping" };
    return { id, skill_name: id };
  },
  student(id) {
    return this.state.students.find((s) => s.id === id);
  }
};
sandbox.BK_gradeNumber = (g) => (g === "K" ? 0 : Number(g));
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/hq.js"), "utf8"), sandbox);
const HQ = sandbox.BKHQ;

sandbox.BKStore.state.students = [
  {
    id: "stu_marcus",
    firstName: "Marcus",
    grade: 2,
    mastery: { "math-2-sub-1": { progress: 28, needsPractice: true } },
    history: [{ ts: Date.now(), skillId: "math-2-sub-1", timeTakenMs: 40000 }],
    sessionQueue: ["math-1-sub-1"],
    tutorLogs: [],
    streak: { count: 4 }
  },
  {
    id: "stu_jordan",
    firstName: "Jordan",
    grade: 10,
    mastery: { "math-geo-py-1": { progress: 82, needsPractice: false } },
    history: [],
    sessionQueue: [],
    tutorLogs: [],
    streak: { count: 2 }
  }
];

function assert(c, m) {
  if (!c) throw new Error(m);
}

const m = HQ.sentence(sandbox.BKStore.student("stu_marcus"));
assert(/stuck on regrouping/.test(m.line), m.line);
assert(/43 − 17/.test(m.ask), m.ask);
assert(!/dashboard/.test(m.line + m.ask), "front door stays one sentence");

const j = HQ.studentSentence(sandbox.BKStore.student("stu_jordan"));
assert(/You own/.test(j.line) || /owe yourself/.test(j.line), "9-12 student voice");

const note = HQ.sendWeekly(sandbox.BKStore.state);
assert(note.lines.length === 2, "one line per child");
assert(note.lines[0].indexOf("Marcus") === 0 || /Marcus/.test(note.lines[0]), "marcus in weekly");
assert(sandbox.BKStore.state.mailbox[0].kind === "weekly", "landed in mailbox");

const metrics = HQ.metrics(sandbox.BKStore.student("stu_marcus"));
assert(metrics.needing.length >= 1, "needs practice listed");
assert(metrics.gaps.length >= 1, "prereq gap listed");
assert(metrics.minutesWeek >= 0, "time on task present");

console.log("PHASE5_OK", { marcus: m.line, weekly: note.lines.length });
