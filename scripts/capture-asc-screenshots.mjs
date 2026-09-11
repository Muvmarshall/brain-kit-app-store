/**
 * Capture App Store Connect sized screenshots from the local web preview.
 * Uses system Google Chrome via puppeteer-core. Not device/TF recordings.
 *
 * Usage:
 *   npx --yes serve -l 8765 preview/brain-kit
 *   npm install --no-save puppeteer-core
 *   node scripts/capture-asc-screenshots.mjs http://127.0.0.1:8765
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "screenshots", "asc");
const BASE = process.argv[2] || "http://127.0.0.1:8765";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

const DEVICES = [
  { prefix: "iphone67", width: 1290, height: 2796 },
  { prefix: "ipad13", width: 2048, height: 2732 },
];

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function hideDebug(page) {
  await page.evaluate(() => {
    const bar = document.getElementById("debug-bar");
    if (bar) {
      bar.style.display = "none";
      bar.setAttribute("aria-hidden", "true");
    }
  });
}

async function dismissGate(page) {
  await page.evaluate(() => {
    const cancel = document.getElementById("gate-cancel");
    if (cancel) cancel.click();
    const el = document.getElementById("gate-overlay");
    if (el) el.classList.add("hidden");
  });
  await sleep(150);
}

async function shot(page, name) {
  await hideDebug(page);
  await sleep(250);
  await page.screenshot({ path: path.join(OUT, name), type: "png", fullPage: false });
  console.log("wrote", name);
}

async function waitView(page, name, timeout = 10000) {
  await page.waitForFunction(
    (n) => {
      const v = document.getElementById("view-" + n);
      return v && !v.classList.contains("hidden");
    },
    { timeout },
    name
  );
}

async function enterPin(page, pin) {
  await page.waitForSelector("#gate-pin", { visible: true, timeout: 8000 });
  await page.focus("#gate-pin");
  await page.evaluate(() => {
    const el = document.getElementById("gate-pin");
    if (el) el.value = "";
  });
  await page.type("#gate-pin", pin, { delay: 35 });
  await page.click("#gate-go");
  await sleep(450);
}

async function solveParentalIfPresent(page) {
  const words = await page.evaluate(() => {
    const overlay = document.getElementById("gate-overlay");
    if (!overlay || overlay.classList.contains("hidden")) return null;
    const ch = window.BKAccess?.session?.lastChallenge;
    return ch ? ch.displayAnswer : null;
  });
  if (!words) return false;
  await page.waitForSelector("#gate-words", { visible: true, timeout: 5000 });
  await page.focus("#gate-words");
  await page.evaluate(() => {
    const el = document.getElementById("gate-words");
    if (el) el.value = "";
  });
  await page.type("#gate-words", words, { delay: 20 });
  await page.click("#gate-go");
  await sleep(400);
  return true;
}

async function resetDemo(page) {
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch (_) {}
  });
  await page.reload({ waitUntil: "networkidle0", timeout: 45000 });
  await page.waitForSelector("#view-lock:not(.hidden)", { timeout: 15000 });
  await sleep(900);
  await hideDebug(page);
  const demo = await page.$("#lock-demo");
  if (demo) {
    await demo.click();
    await sleep(600);
    await page.waitForSelector("#view-lock:not(.hidden)");
  }
  await page.evaluate(() => {
    if (window.BK_MATH_SEED && window.BKStore && window.BKStore.getSkills().length < 4) {
      window.BKStore.upsertSkills(window.BK_MATH_SEED, "seed-math");
    }
    // Ensure practice is allowed for capture (free v1 / trial)
    if (window.BKStore?.state?.billing) {
      window.BKStore.state.billing.plan = "free";
      window.BKStore.state.plan = "free";
      window.BKStore.state.billing.trialEnds = Date.now() + 7 * 86400000;
      window.BKStore.persist?.() || window.BKStore.save?.(window.BKStore.state);
    }
  });
  await hideDebug(page);
}

/** Prefer skills that do not trip the ACT/SAT substring bug in canPractice. */
async function pickSafeSkill(page, studentId) {
  return page.evaluate((sid) => {
    const stu = BKStore.student(sid);
    const skills = BKEngine.visibleSkills(stu) || [];
    const bad = /SAT|ACT|CLT|HSPT|SSAT/i;
    const safe = skills.find(
      (s) =>
        !bad.test(s.skill_name || "") &&
        !bad.test(s.strand || "") &&
        s.strand !== "Test Prep" &&
        BKBilling.canPractice(stu, s)
    );
    return safe ? safe.id : skills[0]?.id || null;
  }, studentId);
}

async function startSafeSession(page, studentId) {
  const skillId = await pickSafeSkill(page, studentId);
  if (!skillId) return { ok: false, reason: "no-skill" };
  const result = await page.evaluate((sid, sk) => {
    try {
      const sel = document.getElementById("skill-pick");
      if (sel) sel.value = sk;
      window.ui.session = BKEngine.nextAsk(BKEngine.createSession(sid, sk));
      window.ui.selectedChoice = null;
      // Navigate without paywall path
      const decision = BKAccess.authorize("session", { studentId: sid });
      if (!decision.ok) return { ok: false, reason: "authorize", missing: decision.missing };
      // Use nav click path via internal setView — not global; click Student then Start after setting select
      return { ok: true, skillId: sk, phase: window.ui.session.phase, prompt: window.ui.session.currentQuestion?.prompt };
    } catch (e) {
      return { ok: false, reason: e.message, skillId: sk };
    }
  }, studentId, skillId);

  if (!result.ok) return result;

  // Force render session view by clicking a hidden bridge: set select + dispatch Start after authorizing
  await page.evaluate((sk) => {
    const sel = document.getElementById("skill-pick");
    if (sel) sel.value = sk;
  }, skillId);

  // Call Start which uses startSession — may hit paywall if skill still bad; prefer direct view swap
  await page.evaluate(() => {
    // Mirror setView("session") internals that are closed over — click Start after ensuring canPractice
    const btn = document.getElementById("start-session");
    if (btn && !btn.disabled) btn.click();
  });
  await sleep(500);

  // If still not on session (paywall/gate), inject session into DOM via Start path workaround:
  // reopen student and use evaluate to click only after setting safe skill, or manually show session
  let onSession = await page.evaluate(
    () => !document.getElementById("view-session")?.classList.contains("hidden")
  );

  if (!onSession) {
    await dismissGate(page);
    // Directly reveal session by synthesizing through student Start with safe option selected
    await page.evaluate((sk) => {
      // Patch: create session and flip views like setView would
      const stuId = window.ui.studentId;
      window.ui.session = BKEngine.nextAsk(BKEngine.createSession(stuId, sk));
      window.ui.selectedChoice = null;
      window.ui.view = "session";
      document.querySelectorAll(".view").forEach((v) =>
        v.classList.toggle("hidden", v.id !== "view-session")
      );
      document.querySelectorAll(".nav-pills [data-view]").forEach((b) =>
        b.classList.toggle("active", b.dataset.view === "session")
      );
      // Trigger render by clicking a noop — renderSession is closed; recreate via Start button path
    }, skillId);

    // Re-enter via Start after temporarily monkeypatching canPractice for the chosen skill only
    await page.evaluate((sk) => {
      const orig = BKBilling.canPractice;
      BKBilling.canPractice = () => true;
      try {
        const sel = document.getElementById("skill-pick");
        if (sel) {
          // ensure option exists
          if (![...sel.options].some((o) => o.value === sk)) {
            const opt = document.createElement("option");
            opt.value = sk;
            opt.textContent = sk;
            sel.appendChild(opt);
          }
          sel.value = sk;
        }
        document.getElementById("start-session")?.click();
      } finally {
        BKBilling.canPractice = orig;
      }
    }, skillId);
    await sleep(600);
    await dismissGate(page);
    onSession = await page.evaluate(
      () => !document.getElementById("view-session")?.classList.contains("hidden")
    );
  }

  return { ...result, onSession };
}

async function captureDevice(browser, device) {
  const { prefix, width, height } = device;
  const page = await browser.newPage();
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: 1,
    isMobile: prefix.startsWith("iphone"),
    hasTouch: true,
  });
  page.setDefaultTimeout(20000);
  const notes = [];

  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 45000 });
  await resetDemo(page);

  // --- 04 Parent gate / Sign-in PIN UI ---
  await page.click("#lock-parent");
  await page.waitForSelector("#gate-overlay:not(.hidden) #gate-pin", { visible: true });
  await hideDebug(page);
  await shot(page, `${prefix}-04-parent-gate.png`);

  // Unlock parent
  await enterPin(page, "4821");
  await waitView(page, "parent").catch(() => notes.push("parent HQ after PIN failed"));

  // --- 01 Home ---
  await dismissGate(page);
  await page.click('button[data-view="home"]');
  await waitView(page, "home");
  await sleep(400);
  await shot(page, `${prefix}-01-home.png`);

  // --- Student: Jordan (HS, no PIN) ---
  await page.click('button[data-view="lock"]');
  await waitView(page, "lock");
  await hideDebug(page);
  await page.evaluate(() => {
    const jordan = [...document.querySelectorAll("#view-lock [data-id]")].find((b) =>
      /Jordan/i.test(b.textContent || "")
    );
    if (jordan) jordan.click();
  });
  await sleep(500);
  // If gate, dismiss/handle
  if (await page.$("#gate-overlay:not(.hidden) #gate-pin")) {
    await enterPin(page, "4821");
  }
  await waitView(page, "student", 12000).catch(() => notes.push("student view failed"));
  await dismissGate(page);
  await hideDebug(page);

  const studentId = await page.evaluate(() => window.ui?.studentId || "stu_jordan");

  // Pick safe skill in dropdown then start
  const skillId = await pickSafeSkill(page, studentId);
  console.log(prefix, "safe skill", skillId, "student", studentId);
  if (!skillId) notes.push("no safe skill");

  await page.evaluate((sk) => {
    const sel = document.getElementById("skill-pick");
    if (sel && sk) {
      if (![...sel.options].some((o) => o.value === sk)) {
        const opt = document.createElement("option");
        opt.value = sk;
        opt.textContent = sk;
        sel.appendChild(opt);
      }
      sel.value = sk;
    }
  }, skillId);

  // Bypass ACT-substring billing false positive for capture only
  await page.evaluate(() => {
    window.__origCanPractice = BKBilling.canPractice.bind(BKBilling);
    BKBilling.canPractice = function (student, skill) {
      if (skill && skill.strand === "Test Prep") return window.__origCanPractice(student, skill);
      if (BKBilling.atFreeCap()) return false;
      return true;
    };
  });

  await page.click("#start-session");
  await sleep(700);
  await solveParentalIfPresent(page);
  await dismissGate(page);

  let onSession = await page.evaluate(
    () => !document.getElementById("view-session")?.classList.contains("hidden")
  );
  if (!onSession) {
    // Fallback: invoke startSession logic via patched billing
    await page.evaluate((sk) => {
      const sel = document.getElementById("skill-pick");
      if (sel) sel.value = sk;
      document.getElementById("start-session")?.click();
    }, skillId);
    await sleep(700);
    await dismissGate(page);
    onSession = await page.evaluate(
      () => !document.getElementById("view-session")?.classList.contains("hidden")
    );
  }

  if (!onSession) {
    notes.push("session view not reached");
  } else {
    // Wrong-answer teach path (look up answer from skill.question_bank; ui is not global)
    for (let i = 0; i < 4; i++) {
      const state = await page.evaluate((sk) => {
        if (document.querySelector(".teach")) return { kind: "teach" };
        const prompt = document.getElementById("q-prompt")?.textContent?.trim();
        const choices = [...document.querySelectorAll(".choice")];
        if (!choices.length) return { kind: "no-choices" };
        const skill = BKStore.skillById(sk);
        const bank = skill?.question_bank || [];
        const q = bank.find((x) => x.prompt === prompt);
        const answer = q ? String(q.answer) : null;
        const wrongBtn = choices.find((c) => decodeURIComponent(c.dataset.c) !== answer);
        // If answer unknown, prefer last choice (often distractor)
        (wrongBtn || choices[choices.length - 1]).click();
        return { kind: "picked", prompt, answer };
      }, skillId);
      if (state.kind === "teach") break;
      if (state.kind === "picked") {
        await sleep(150);
        const submit = await page.$("#submit-ans");
        if (submit) await submit.click();
        await sleep(450);
        if (await page.$(".teach")) break;
        const next = await page.$("#next-q");
        if (next) {
          await next.click();
          await sleep(350);
        }
      } else break;
    }
  }

  await hideDebug(page);
  await shot(page, `${prefix}-02-practice.png`);

  // --- 03 Session end / progress ---
  const endBtn = await page.$("#end-now");
  if (endBtn) {
    await endBtn.click();
    await sleep(500);
  } else {
    // From teach, try after-teach then end; else force finish
    await page.evaluate(() => {
      if (window.ui?.session && window.BKEngine) {
        window.ui.session = BKEngine.finish(window.ui.session, "student-ended");
      }
    });
    // Need re-render — click Start path won't help; use End if present after after-teach
    const after = await page.$("#after-teach");
    if (after) {
      await after.click();
      await sleep(400);
      const end2 = await page.$("#end-now");
      if (end2) await end2.click();
      else {
        await page.evaluate(() => {
          if (window.ui?.session && window.BKEngine) {
            window.ui.session = BKEngine.finish(window.ui.session, "student-ended");
          }
        });
      }
    }
    // Force show done by re-clicking nothing — trigger renderSession via End on retest
    await sleep(300);
    // Navigate by finishing and manually calling startSession render: click student Start is messy
    // Instead open Parent HQ for one-liner progress if session done UI missing
  }

  // Re-render session done state if we finished via evaluate
  await page.evaluate(() => {
    if (window.ui?.session?.phase === "done") {
      // Nudge: toggle view classes and dispatch a fake render by clicking back-student absence
      const s = window.ui.session;
      // Re-invoke startSession's setView by using nav — session isn't a nav item
      document.querySelectorAll(".view").forEach((v) =>
        v.classList.toggle("hidden", v.id !== "view-session")
      );
    }
  });

  // If session is done but not rendered, click End again won't work — go through student start finish via evaluate render
  // Simplest reliable path: use Parent HQ progress sentence (after PIN)
  let progressCaptured = false;
  const sessionDoneVisible = await page.evaluate(() => {
    const v = document.getElementById("view-session");
    return (
      v &&
      !v.classList.contains("hidden") &&
      /finish line|Session complete/i.test(v.textContent || "")
    );
  });

  if (sessionDoneVisible) {
    await shot(page, `${prefix}-03-progress.png`);
    progressCaptured = true;
  } else if (onSession && (await page.$("#end-now"))) {
    await page.click("#end-now");
    await sleep(500);
    await shot(page, `${prefix}-03-progress.png`);
    progressCaptured = true;
  } else {
    // Finish + re-enter session render by calling Start's finish UI through a small page helper
    const rendered = await page.evaluate((sk) => {
      try {
        if (!window.ui.session) {
          window.ui.session = BKEngine.nextAsk(BKEngine.createSession(window.ui.studentId, sk));
        }
        window.ui.session = BKEngine.finish(window.ui.session, "student-ended");
        // Click student then we need renderSession — expose via clicking a custom event
        // Hack: temporarily replace setView by clicking Start after monkeypatch createSession to return finished
        return window.ui.session.phase;
      } catch (e) {
        return "err:" + e.message;
      }
    }, skillId);
    console.log(prefix, "force finish phase", rendered);

    // Use Parent HQ as progress/report shot
    await dismissGate(page);
    await page.click('button[data-view="parent"]');
    await sleep(400);
    if (await page.$("#gate-overlay:not(.hidden) #gate-pin")) {
      await enterPin(page, "4821");
    }
    await solveParentalIfPresent(page);
    await waitView(page, "parent", 8000).catch(() => {});
    await hideDebug(page);
    const parentOk = await page.evaluate(
      () => !document.getElementById("view-parent")?.classList.contains("hidden")
    );
    if (parentOk) {
      await shot(page, `${prefix}-03-progress.png`);
      progressCaptured = true;
      notes.push("progress shot = Parent HQ (session-done UI not rendered)");
    } else {
      await page.click('button[data-view="evidence"]').catch(() => {});
      await sleep(400);
      if (await page.$("#gate-overlay:not(.hidden) #gate-pin")) await enterPin(page, "4821");
      await shot(page, `${prefix}-03-progress.png`);
      progressCaptured = true;
      notes.push("progress shot = evidence fallback");
    }
  }

  if (!progressCaptured) notes.push("progress not captured");

  // --- 05 Privacy ---
  await dismissGate(page);
  await page.click('button[data-view="privacy"]');
  await sleep(400);
  await solveParentalIfPresent(page);
  await dismissGate(page);
  const priv = await page.evaluate(
    () => !document.getElementById("view-privacy")?.classList.contains("hidden")
  );
  if (priv) {
    await hideDebug(page);
    await shot(page, `${prefix}-05-privacy.png`);
  } else {
    // Privacy has no gates — try again from lock
    await page.click('button[data-view="lock"]');
    await sleep(300);
    await dismissGate(page);
    await page.click('button[data-view="privacy"]');
    await sleep(400);
    const priv2 = await page.evaluate(
      () => !document.getElementById("view-privacy")?.classList.contains("hidden")
    );
    if (priv2) {
      await hideDebug(page);
      await shot(page, `${prefix}-05-privacy.png`);
    } else notes.push("privacy not reached");
  }

  await page.close();
  return notes;
}

async function main() {
  console.log("base", BASE);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
      "--hide-scrollbars",
    ],
    defaultViewport: null,
  });

  const allNotes = [];
  for (const d of DEVICES) {
    console.log("\n===", d.prefix, `${d.width}x${d.height}`, "===");
    try {
      const notes = await captureDevice(browser, d);
      if (notes.length) {
        console.log("notes:", notes.join("; "));
        allNotes.push({ device: d.prefix, notes });
      }
    } catch (err) {
      console.error("FAILED", d.prefix, err);
      allNotes.push({ device: d.prefix, notes: [String(err)] });
    }
  }
  await browser.close();

  const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).sort();
  fs.writeFileSync(
    path.join(OUT, "capture-log.json"),
    JSON.stringify({ base: BASE, out: OUT, files, notes: allNotes }, null, 2)
  );
  console.log("\nDone. Files:", files.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
