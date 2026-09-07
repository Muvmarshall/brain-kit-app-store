import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = {
  publishedSkills() {
    return this.skills;
  },
  skills: [
    {
      id: "math-2-sub-1",
      subject: "Math",
      grade_band: "K-2",
      skill_name: "Subtract two-digit numbers with regrouping",
      strand: "Addition & subtraction within 100",
      standard_code: "MA.2.NSO.2.3",
      status: "published",
      question_bank: [{ prompt: "43 − 17 =", answer: "26", difficulty: 2 }],
      teach_content: { explanation: "trade a ten", worked_example: "43-17=26" }
    },
    {
      id: "math-7-prop-1",
      subject: "Math",
      grade_band: "6-8",
      skill_name: "Solve a one-step percent problem",
      strand: "Grade 7",
      status: "published",
      question_bank: [{ prompt: "20% of 40", answer: "8", difficulty: 2 }],
      teach_content: { explanation: "percent", worked_example: "8" }
    },
    {
      id: "math-geo-py-1",
      subject: "Math",
      grade_band: "9-12",
      skill_name: "Use the Pythagorean theorem on a right triangle",
      strand: "Geometry",
      status: "published",
      question_bank: [{ prompt: "legs 3 and 4", answer: "5", difficulty: 1 }],
      teach_content: { explanation: "a2+b2", worked_example: "5" }
    }
  ]
};
const sandbox = {
  window: {},
  console,
  BKStore: store,
  BK_gradeNumber: (g) => Number(g),
  BK_bandForGrade: (g) => (Number(g) <= 2 ? "K-2" : Number(g) <= 5 ? "3-5" : Number(g) <= 8 ? "6-8" : "9-12")
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/engine.js"), "utf8"), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/homework.js"), "utf8"), sandbox);
const H = sandbox.BKHomework;
const E = sandbox.BKEngine;

function assert(c, m) {
  if (!c) throw new Error(m);
}

const marcus = { id: "stu_marcus", grade: 2 };
const hit = H.identify(marcus, "Find 43 minus 17. Regroup if you need to.", { filename: "ws.jpg" });
assert(hit.ok, "marcus worksheet matches");
assert(hit.best.id === "math-2-sub-1", hit.best && hit.best.id);
assert(!JSON.stringify(hit.matches).includes("26"), "identify payload has no answer");
assert(!E.canPresent(marcus, store.skills[1]), "percent blocked for G2");
const pct = H.identify(marcus, "What is 20 percent of 40?");
assert(!pct.ok || pct.best.id !== "math-7-prop-1", "G2 cannot rescue into 7th grade percent");

const elena = { id: "e", grade: 7 };
const eHit = H.identify(elena, "What is 20 percent of 40?");
assert(eHit.ok && eHit.best.id === "math-7-prop-1", "percent routes for G7");
assert(H.forbiddenSolve("the answer is 8", eHit.best), "solve-guard sees leaked key");
assert(!H.forbiddenSolve("how do I start a percent problem", eHit.best), "guidance text allowed");

console.log("PHASE7_OK", { marcus: hit.best.id, elena: eHit.best.id });
