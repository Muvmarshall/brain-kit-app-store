import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "js/access.js"), "utf8");

const store = {
  state: {
    parentPinHash: null,
    parentEmail: "alex@home.kit",
    parentEmailVerified: true,
    recovery: null,
    mailbox: []
  },
  students: [
    { id: "stu_marcus", firstName: "Marcus", grade: 2, pin: null },
    { id: "stu_elena", firstName: "Elena", grade: 7, pin: "2468" },
    { id: "stu_jordan", firstName: "Jordan", grade: 10, pin: "1010" }
  ],
  persist() {},
  student(id) {
    return this.students.find((s) => s.id === id);
  }
};

function pinHash(pin) {
  const s = "brainkit.pin.v1:" + String(pin);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}
store.state.parentPinHash = pinHash("4821");

const sandbox = {
  window: {},
  BKStore: store,
  BK_gradeNumber(grade) {
    if (grade === "K" || grade === "k") return 0;
    return Number(grade);
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const A = sandbox.BKAccess;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(A.wordsFor(64) === "sixty-four", "words 64");
assert(A.normalizeWords("Sixty Four") === "sixty four", "normalize");

A.lockAll();
let d = A.authorize("purchase", { studentId: "stu_jordan" });
assert(!d.ok && d.missing === "parental-gate", "purchase starts with parental gate");

A.mintParentalChallenge();
sandbox.BKAccess.session.lastChallenge.accept = "sixty four";
assert(!A.solveParental("64").ok, "digits fail parental gate");
assert(A.solveParental("sixty-four").ok, "words pass parental gate");

d = A.authorize("purchase", { studentId: "stu_jordan" });
assert(!d.ok && d.missing === "parent-pin", "purchase then parent PIN");
assert(A.verifyParentPin("4821").ok, "parent pin 4821");
d = A.authorize("purchase", { studentId: "stu_jordan" });
assert(d.ok, "purchase allowed after both gates");

d = A.authorize("settings", { studentId: "stu_marcus" });
assert(d.ok, "settings after parental ttl still fresh");

d = A.authorize("external-link", { studentId: "stu_elena" });
assert(d.ok, "external link shares parental freshness");

A.lockAll();
A.session.actor = "student";
A.session.studentId = "stu_marcus";
A.grantStudent("stu_marcus");
d = A.authorize("parent", { studentId: "stu_marcus" });
assert(!d.ok, "k5 child cannot open Parent HQ");
assert(d.missing === "parent-pin" || d.missing === "deny", "k5 hq blocked");

A.lockAll();
d = A.authorize("student", { studentId: "stu_marcus" });
assert(!d.ok && d.missing === "parent-pin", "k5 app unlock is parent PIN");

d = A.authorize("student", { studentId: "stu_elena" });
assert(!d.ok && d.missing === "student-pin", "6-8 uses student PIN");
assert(A.verifyStudentPin("stu_elena", "2468").ok, "elena pin");
d = A.authorize("student", { studentId: "stu_elena" });
assert(d.ok, "elena can open app");
d = A.authorize("parent", { studentId: "stu_elena" });
assert(!d.ok, "elena still blocked from HQ without parent pin");

A.lockAll();
d = A.authorize("student", { studentId: "stu_jordan" });
assert(d.ok, "9-12 opens app with no parent credential");
A.grantStudent("stu_jordan");
d = A.authorize("goals", { studentId: "stu_jordan" });
assert(d.ok, "9-12 goals with no parent credential");
d = A.authorize("billing", { studentId: "stu_jordan" });
assert(!d.ok, "9-12 billing still gated");

A.lockAll();
const rec = A.requestRecovery("alex@home.kit");
assert(rec.ok, "recovery emails verified address");
assert(store.state.mailbox[0].code, "mailbox has code");
const bad = A.requestRecovery("kid@example.com");
assert(!bad.ok, "unknown email rejected");
const done = A.completeRecovery(store.state.mailbox[0].code, "7391");
assert(done.ok, "recovery sets new pin");
assert(A.verifyParentPin("7391").ok, "new pin works");
assert(!A.verifyParentPin("4821").ok, "old pin dead");

const routes = Object.keys(A.ROUTES);
["purchase", "billing", "settings", "external-link"].forEach((r) => {
  assert(A.gatesFor(r).includes("parental-gate"), r + " inherits parental gate");
});
["parent", "profiles", "billing", "purchase", "delete-account"].forEach((r) => {
  assert(A.gatesFor(r).includes("parent-pin"), r + " inherits parent pin where required");
});

console.log("PHASE4_OK", { routes: routes.length, mechanisms: ["parental-gate", "parent-pin"] });
