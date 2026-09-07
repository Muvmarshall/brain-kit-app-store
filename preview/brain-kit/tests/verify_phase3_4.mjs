import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["js/taxonomy.js", "js/engine.js", "js/placement.js", "js/belt.js"];

const store = {
  state: { skills: [], students: [] },
  persist() {},
  publishedSkills() {
    return this.state.skills.filter((s) => s.status === "published");
  },
  skillById(id) {
    return this.state.skills.find((s) => s.id === id);
  },
  student(id) {
    return this.state.students.find((s) => s.id === id);
  },
  masteryOf() {
    return { progress: 0, difficulty: 2 };
  },
  savePlacement(id, subject, report) {
    const s = this.student(id);
    s.placement[subject] = report;
  },
  setGrade(id, g) {
    this.student(id).grade = g;
  },
  addRollover(id, ev) {
    this.student(id).rolloverEvents.push(ev);
  }
};

store.state.students = [
  {
    id: "stu_marcus",
    firstName: "Marcus",
    grade: 2,
    toolXP: { magnifier: 18, wrench: 22 },
    placement: {},
    rolloverEvents: []
  }
];

store.state.skills = [
  { id: "r1", subject: "Reading", grade_band: "K-2", grade_or_course: "2", strand: "Phonics", skill_name: "CVC", status: "published", question_bank: [{ id: "a", prompt: "cat", choices: ["cat"], answer: "cat", difficulty: 2 }] },
  { id: "r2", subject: "Reading", grade_band: "3-5", grade_or_course: "4", strand: "Theme", skill_name: "Theme", status: "published", question_bank: [{ id: "b", prompt: "t", choices: ["t"], answer: "t", difficulty: 3 }] },
  { id: "m7", subject: "Math", grade_band: "6-8", grade_or_course: "7", strand: "Grade 7", skill_name: "Percent", status: "published", question_bank: [{ id: "c", prompt: "p", choices: ["p"], answer: "p", difficulty: 2 }] },
  { id: "chem", subject: "Science", grade_band: "9-12", grade_or_course: "Chemistry", strand: "Chemistry", skill_name: "Moles", status: "published", question_bank: [{ id: "d", prompt: "d", choices: ["d"], answer: "d", difficulty: 4 }] },
  { id: "span", subject: "Spanish", grade_band: "6-8", grade_or_course: "6", strand: "Vocabulary", skill_name: "Hola", status: "published", question_bank: [{ id: "e", prompt: "e", choices: ["e"], answer: "e", difficulty: 1 }] }
];

const sandbox = {
  window: {},
  BKStore: store,
  console
};
sandbox.window = sandbox;
vm.createContext(sandbox);
files.forEach((f) => {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox);
});

const E = sandbox.BKEngine;
const P = sandbox.BKPlacement;
const B = sandbox.BKBelt;
const marcus = store.student("stu_marcus");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const visible = E.visibleSkills(marcus).map((s) => s.id);
assert(visible.includes("r1"), "G2 sees K-2 reading");
assert(!visible.includes("r2"), "G2 does not see 3-5");
assert(!visible.includes("m7"), "G2 does not see 6-8 math");
assert(!visible.includes("chem"), "G2 does not see chemistry");
assert(!visible.includes("span"), "G2 does not see Spanish");
assert(!E.canPresent(marcus, store.skillById("chem")), "canPresent blocks chemistry");
try {
  E.createSession("stu_marcus", "chem");
  throw new Error("session should have thrown");
} catch (err) {
  assert(/Grade-band lock/.test(err.message), "createSession locked");
}

const subj = P.subjectsFor(marcus);
assert(!subj.includes("Spanish") && !subj.includes("Test Prep"), "G2 placement subjects stay elementary");
const placeSkills = P.skillsForSubject(marcus, "Reading").map((s) => s.id);
assert.deep = null;
assert(placeSkills.every((id) => id !== "r2"), "placement pool has no 3-5");

const run = P.create("stu_marcus", "Reading");
P.next(run);
assert(run.current.skill.grade_band === "K-2", "placement item in band");
P.answer(run, run.current.q.answer);
assert(!String(JSON.stringify(run.items)).includes("test"), "internal items omit the word test");

const belt = B.beltFor(marcus);
assert(belt.filter((t) => t.unlocked).length === 5, "K-5 belt has five tools");
assert(belt.find((t) => t.id === "radio").slotCopy === "not unlocked yet", "radio not missing, not unlocked");
assert(B.maturityFor(2) === "k5", "g2 maturity");
assert(B.agencyFor(2).id === "parent-drives", "k5 agency");

const roll6 = [];
for (let i = 0; i < 4; i++) roll6.push(B.rollover("stu_marcus"));
assert(store.student("stu_marcus").grade === 6, "rolled to 6");
assert(B.maturityFor(6) === "middles", "maturity stepped");
assert(B.beltFor(store.student("stu_marcus")).filter((t) => t.unlocked).length === 6, "radio unlocks at 6");
assert(store.student("stu_marcus").rolloverEvents[0].masteryCarried, "mastery carried");

for (let i = 0; i < 3; i++) B.rollover("stu_marcus");
assert(store.student("stu_marcus").grade === 9, "rolled to 9");
assert(B.maturityFor(9) === "hs", "hs maturity");
assert(B.agencyFor(9).id === "student-owns", "hs agency");
assert(B.kitPresence("hs").size < B.kitPresence("k5").size, "kit shrinks");

console.log("PHASE3_4_OK", {
  g2Blocked: ["3-5", "6-8", "9-12", "Spanish", "Chemistry"],
  sameAccount: ["k5@2", "middles@6", "hs@9"]
});
