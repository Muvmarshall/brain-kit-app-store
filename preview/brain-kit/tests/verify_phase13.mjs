import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = {
  state: {
    parentEmail: "alex@home.kit",
    students: [{ id: "stu_marcus", firstName: "Marcus", grade: 2, mastery: {}, history: [] }],
    goals: {},
    classrooms: [{ name: "Room 12", studentIds: ["stu_marcus"] }],
    consent: { given: false, at: null, version: "v1", mode: "consumer" }
  },
  persist() {},
  student(id) {
    return this.state.students.find((s) => s.id === id);
  }
};
const sandbox = { window: {}, console, BKStore: store };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "js/compliance.js"), "utf8"), sandbox);
const C = sandbox.BKCompliance;

function assert(c, m) {
  if (!c) throw new Error(m);
}

assert(C.COLLECTED.join() === "first name,grade,parent email", "minimization");
assert(C.NUTRITION.track === "No", "no tracking");
assert(C.NUTRITION.ads === false, "no ads");
assert(C.NUTRITION.analyticsSdks.length === 0, "no child-profiling SDKs");
assert(C.NUTRITION.socialLogins.length === 0, "no social login");
assert(!C.mayCreateProfile(), "no profile before consent");
C.giveConsent("consumer");
assert(C.mayCreateProfile(), "consent unlocks profiles");
assert(/not a school official/.test(C.ferpaNote()), "consumer FERPA");
C.giveConsent("district");
assert(/school official/.test(C.ferpaNote()), "district DPA");
const exp = C.exportChild(store.state.students[0]);
assert(exp.collected.parentEmail === "alex@home.kit", "export email");
C.deleteChild("stu_marcus");
assert(store.state.students.length === 0, "parent can delete");
assert(store.state.classrooms[0].studentIds.length === 0, "unlinked from class");
assert(C.LISTING.title.indexOf("Brain Kit") === 0, "store title");
assert(/never takes progress away/.test(C.LISTING.lead), "listing lead");

console.log("PHASE13_OK", { collected: C.COLLECTED, rating: C.NUTRITION.ageRating });
