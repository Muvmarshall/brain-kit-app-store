import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = {
  window: {},
  console,
  document: { createElement() { return { click() {} }; } },
  URL: { createObjectURL() { return "blob:x"; } },
  Blob: function () {},
  BKStore: {
    skillById(id) {
      if (id === "math-2-sub-1") return { skill_name: "Subtract with regrouping", subject: "Math", standard_code: "MA.2.NSO.2.3" };
      return { skill_name: id, subject: "Math", standard_code: "" };
    }
  }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/export.js"), "utf8"), sandbox);
const X = sandbox.BKExport;

function assert(c, m) {
  if (!c) throw new Error(m);
}

const student = {
  firstName: "Marcus",
  grade: 2,
  mastery: { "math-2-sub-1": { progress: 28, needsPractice: true, seen: 6 } },
  history: [
    { ts: Date.now(), skillId: "math-2-sub-1", subject: "Math", standard_code: "MA.2.NSO.2.3", result: "teach", progressBefore: 20, progressAfter: 20, timeTakenMs: 60000 }
  ]
};
const report = X.build(student, { parentName: "Alex" });
assert(report.disclaimer.indexOf("not a state-recognized student portfolio") !== -1, "disclaimer");
assert(report.disclaimer.indexOf("15-day") !== -1, "good-cause");
assert(report.disclaimer.indexOf("homeschool") !== -1, "homeschool");
assert(!/replaces your legal/.test(report.disclaimer), "does not claim to replace");
assert(report.skills[0].name.indexOf("regrouping") !== -1, "skill listed");
assert(report.standards[0].code === "MA.2.NSO.2.3", "standard listed");
const html = X.html(report);
assert(html.indexOf("not a state-recognized") !== -1, "html framed");
const pdf = X.toPDF(report);
assert(pdf.indexOf("%PDF-1.4") === 0, "pdf header");
assert(pdf.indexOf("state-recognized student portfolio") !== -1, "pdf disclaimer");
assert(pdf.indexOf("%%EOF") !== -1, "eof");

console.log("PHASE10_OK", { minutes: report.minutes, skills: report.skills.length });
