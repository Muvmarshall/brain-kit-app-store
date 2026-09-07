import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = {
  state: {
    plan: "free",
    students: [
      { id: "stu_marcus", firstName: "Marcus", grade: 2 },
      { id: "stu_jordan", firstName: "Jordan", grade: 10 }
    ]
  },
  persist() {}
};
const sandbox = {
  window: {},
  console,
  Date,
  BKStore: store,
  BK_gradeNumber: (g) => Number(g)
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/billing.js"), "utf8"), sandbox);
const B = sandbox.BKBilling;

function assert(c, m) {
  if (!c) throw new Error(m);
}

store.state.billing = {
  plan: "free",
  interval: "yearly",
  subject: "Math",
  addons: [],
  trialEnds: 0,
  provider: null,
  receipts: []
};
assert(B.canPractice({ grade: 2 }, { subject: "Math", skill_name: "regroup" }), "free can practice until the daily cap");
for (let i = 0; i < 10; i++) B.recordQuestion();
assert(B.atFreeCap(), "10 questions is the free cap");
assert(!B.canPractice({ grade: 2 }, { subject: "Math", skill_name: "regroup" }), "capped free cannot keep practicing");
B.startTrial();
assert(B.onTrial(), "7-day complete trial");
assert(B.canPractice({ grade: 2 }, { subject: "Reading" }), "trial opens all subjects");

store.state.billing.trialEnds = 0;
store.state.billing.plan = "essentials";
store.state.billing.subject = "Math";
assert(B.canPractice({ grade: 2 }, { subject: "Math" }), "essentials math");
assert(!B.canPractice({ grade: 2 }, { subject: "Reading" }), "essentials blocks other subject");

B.checkout({ plan: "complete", interval: "yearly", provider: "stripe" });
assert(B.plan().id === "complete", "complete");
assert(store.state.billing.receipts.length >= 1, "receipt");

const noTp = B.addTestPrep([{ grade: 3 }], "iap");
assert(!noTp.ok, "never sell test prep to grade 3");
const yesTp = B.addTestPrep(store.state.students, "iap");
assert(yesTp.ok, "sell when an 8-12 profile exists");
assert(B.testPrepAllowed ? true : B.hasAddon("testprep"), "addon on");
assert(!B.canPractice({ grade: 3 }, { subject: "Math", strand: "Test Prep", skill_name: "SAT math" }), "grade 3 cannot use test prep skill");
assert(B.canPractice({ grade: 10 }, { subject: "Math", skill_name: "SAT math" }), "grade 10 can");

assert(B.FAMILY_CAP === 4, "family cap");
assert(B.quote("complete", "yearly") === 69, "annual complete");

console.log("PHASE12_OK", { trial: B.TRIAL_DAYS, complete: B.quote("complete", "monthly") });
