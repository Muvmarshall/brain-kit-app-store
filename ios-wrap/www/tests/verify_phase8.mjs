import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mem = {};
const sandbox = {
  window: {},
  console,
  document: { body: { classList: { toggle() {} }, style: { setProperty() {} }, setAttribute() {} } },
  localStorage: {
    getItem(k) { return mem[k] || null; },
    setItem(k, v) { mem[k] = String(v); }
  },
  speechSynthesis: { cancel() {}, speak() {} },
  SpeechSynthesisUtterance: function (t) { this.text = t; },
  BKStore: {
    state: { offlinePacks: {} },
    persist() {},
    publishedSkills() {
      return [{ id: "math-2-sub-1", status: "published", grade_band: "K-2", subject: "Math", question_bank: [] }];
    }
  },
  BKEngine: {
    visibleSkills(stu) {
      return sandbox.BKStore.publishedSkills().filter(() => stu.grade <= 2);
    }
  },
  BK_gradeNumber: (g) => Number(g)
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/a11y.js"), "utf8"), sandbox);
const A = sandbox.BKA11y;

function assert(c, m) {
  if (!c) throw new Error(m);
}

assert(A.t("parentHq") === "Parent HQ", "en default");
A.prefs.locale = "es";
assert(A.t("parentHq") === "Central de padres", "es parent UI");
A.prefs.extendedTime = true;
assert(A.sessionMs(10 * 60 * 1000) === 20 * 60 * 1000, "extended time doubles session");
A.prefs.extendedTime = false;
assert(A.sessionMs(600000) === 600000, "standard time");

const pack = A.buildPack({ id: "stu_marcus", grade: 2 });
assert(pack.skillIds[0] === "math-2-sub-1", "pack contains in-band skill");
A.queueSync("stu_marcus", { kind: "answer" });
assert(A.packFor("stu_marcus").pending.length === 1, "offline queue");
const sync = A.syncNow("stu_marcus");
assert(sync.synced === 1 && A.packFor("stu_marcus").pending.length === 0, "sync clears queue");

console.log("PHASE8_OK", { locale: A.t("oneCard"), pack: pack.skillIds.length });
