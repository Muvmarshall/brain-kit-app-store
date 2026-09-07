import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = [];
const sandbox = {
  window: {},
  console,
  BK_gradeNumber: (g) => Number(g),
  BK_bandForGrade: (g) => (Number(g) <= 2 ? "K-2" : Number(g) <= 5 ? "3-5" : Number(g) <= 8 ? "6-8" : "9-12"),
  BKEngine: {
    visibleSkills() { return []; },
    canPresent() { return false; }
  },
  BKStore: {
    state: { season: "summer" },
    persist() {},
    upsertSkills(list) {
      list.forEach((s) => {
        const i = skills.findIndex((x) => x.id === s.id);
        if (i >= 0) skills[i] = s;
        else skills.push(s);
      });
    },
    skillById(id) {
      return skills.find((s) => s.id === id);
    },
    student() {
      return this._stu;
    },
    _stu: { id: "stu_marcus", firstName: "Marcus", grade: 2, history: [{ subject: "Reading" }], summerWeeks: [] }
  }
};
sandbox.window = sandbox;
sandbox.BKStore.student = () => sandbox.BKStore._stu;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/summer.js"), "utf8"), sandbox);
const S = sandbox.BKSummer;

function assert(c, m) {
  if (!c) throw new Error(m);
}

assert(S.autoMode(new Date("2026-07-10").getTime()) === "summer", "july is summer");
assert(S.autoMode(new Date("2026-01-10").getTime()) === "school", "january is school");
S.ensureCatalog();
const weeks = S.weeks(sandbox.BKStore._stu);
assert(weeks.length === 8, "eight weeks");
assert(weeks.every((w) => /Try this/.test(w.framing)), "try-this framing");
assert(!S.completeRequired(sandbox.BKStore._stu), "not required for the year");
const skill = sandbox.BKStore.skillById(weeks[0].skillId);
assert(skill.grade_or_course === "Grade 3", skill.grade_or_course);
assert(S.mayAssign(sandbox.BKStore._stu, skill), "summer may assign upcoming light skill");
assert(!S.mayAssign(sandbox.BKStore._stu, { id: "math-geo-py-1", summer_light: false }), "not a free pass to geometry");
const line = S.parentLine(sandbox.BKStore._stu);
assert(/held a reading level through/.test(line.line), line.line);
assert(/optional/.test(line.ask), line.ask);

console.log("PHASE9_OK", { weeks: weeks.length, line: line.line });
