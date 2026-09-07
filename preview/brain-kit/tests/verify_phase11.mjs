import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = {
  state: { classrooms: [], teacher: null },
  persist() {},
  student(id) {
    return this.students[id];
  },
  skillById(id) {
    return this.skills.find((s) => s.id === id);
  },
  students: {
    stu_marcus: {
      id: "stu_marcus",
      firstName: "Marcus",
      grade: 2,
      mastery: { "math-2-sub-1": { progress: 28, needsPractice: true } },
      sessionQueue: [],
      history: [{ ts: Date.now(), timeTakenMs: 60000 }]
    }
  },
  skills: [
    { id: "math-2-sub-1", skill_name: "regrouping", grade_band: "K-2", status: "published" },
    { id: "math-7-prop-1", skill_name: "percent", grade_band: "6-8", status: "published" }
  ]
};
const sandbox = {
  window: {},
  console,
  BKStore: store,
  BK_bandForGrade: (g) => (Number(g) <= 2 ? "K-2" : Number(g) <= 5 ? "3-5" : Number(g) <= 8 ? "6-8" : "9-12"),
  BK_gradeNumber: (g) => Number(g)
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/engine.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/teacher.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/access.js"), "utf8"), sandbox);
const T = sandbox.BKTeacher;
const A = sandbox.BKAccess;

function assert(c, m) {
  if (!c) throw new Error(m);
}

T.seedDemo();
assert(T.classroom().joinCode === "MAPLE7", "demo class");
const g = T.gaps(T.classroom());
assert(g.rows[0].name === "Marcus", "roster");
assert(g.rows[0].minutesWeek >= 1, "time on task, not live presence");

const blocked = T.assign(T.classroom(), "math-7-prop-1", ["stu_marcus"]);
assert(blocked.blocked.length === 1, "8th grade work blocked for G2");
assert(store.students.stu_marcus.sessionQueue.indexOf("math-7-prop-1") === -1, "queue clean");

const ok = T.assign(T.classroom(), "math-2-sub-1", ["stu_marcus"]);
assert(ok.accepted[0] === "Marcus", "in-band assign works");
assert(store.students.stu_marcus.sessionQueue.indexOf("math-2-sub-1") !== -1, "queued");

A.lockAll();
const parentTry = A.authorize("parent", { studentId: "stu_marcus" });
assert(!parentTry.ok, "teacher not signed in, parent still gated");
A.verifyTeacherPin("7391");
assert(A.session.actor === "teacher", "teacher actor");
const teacherOk = A.authorize("teacher");
assert(teacherOk.ok, "teacher route open");
const noParent = A.authorize("parent", { studentId: "stu_marcus" });
assert(!noParent.ok, "teacher cannot open parent HQ");
assert(/separate interface|cannot open the parent/.test(noParent.reason), noParent.reason);

console.log("PHASE11_OK", { blocked: blocked.blocked[0].name, plan: T.PRICE_MONTH });
