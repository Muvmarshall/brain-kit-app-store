// Phase 2 invariants without a browser.
const progress = [12];
function addProgress(delta) {
  const next = Math.min(100, progress[0] + Math.max(0, delta));
  if (next < progress[0]) throw new Error("progress decreased");
  progress[0] = next;
}

let wrong = 0;
let phase = "ask";
function miss() {
  wrong += 1;
  if (wrong === 1) phase = "hint";
  else phase = "teach";
}
function hit() {
  addProgress(10);
  phase = "feedback";
  wrong = 0;
}

miss();
if (phase !== "hint") throw new Error("first miss must hint");
miss();
if (phase !== "teach") throw new Error("second miss must teach");
hit();
hit();
if (progress[0] !== 32) throw new Error("unexpected progress " + progress[0]);
addProgress(-50);
if (progress[0] !== 32) throw new Error("negative delta must be ignored");
console.log("PHASE2_OK", { progress: progress[0], rule: "progress never decreases; 2 misses -> teach" });
