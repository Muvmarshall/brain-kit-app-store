/* Practice-history export. Shareable with a teacher.
   Not a portfolio. Not a 15-day good-cause file. */
(function (global) {
  const DISCLAIMER =
    "This is practice history you can share with your child's teacher. " +
    "It is not a state-recognized student portfolio. " +
    "It does not satisfy Florida's 15-day good-cause exemption file. " +
    "It does not replace homeschool legal documentation.";

  function minutesFrom(history) {
    return Math.round(history.reduce((n, h) => n + (h.timeTakenMs || 45000), 0) / 60000);
  }

  function standards(history) {
    const set = {};
    history.forEach((h) => {
      if (h.standard_code) set[h.standard_code] = (set[h.standard_code] || 0) + 1;
    });
    return Object.entries(set).map(([code, n]) => ({ code, n })).sort((a, b) => b.n - a.n);
  }

  function skillsTouched(student) {
    const map = {};
    (student.history || []).forEach((h) => {
      if (!map[h.skillId]) {
        const sk = global.BKStore.skillById(h.skillId);
        map[h.skillId] = {
          id: h.skillId,
          name: sk ? sk.skill_name : h.skillId,
          subject: h.subject,
          standard: h.standard_code || (sk && sk.standard_code) || "",
          attempts: 0,
          last: h.ts
        };
      }
      map[h.skillId].attempts += 1;
      map[h.skillId].last = Math.max(map[h.skillId].last, h.ts);
    });
    Object.entries(student.mastery || {}).forEach(([id, m]) => {
      if (!map[id]) {
        const sk = global.BKStore.skillById(id);
        map[id] = {
          id,
          name: sk ? sk.skill_name : id,
          subject: sk ? sk.subject : "",
          standard: sk ? sk.standard_code : "",
          attempts: m.seen || 0,
          last: 0
        };
      }
      map[id].progress = m.progress;
      map[id].needsPractice = !!m.needsPractice;
    });
    return Object.values(map);
  }

  function build(student, household) {
    const history = (student.history || []).slice().sort((a, b) => a.ts - b.ts);
    return {
      title: "Brain Kit practice history",
      student: student.firstName,
      grade: student.grade,
      household: household && household.parentName,
      generatedAt: Date.now(),
      minutes: minutesFrom(history),
      questions: history.length,
      skills: skillsTouched(student),
      standards: standards(history),
      history: history.slice(-80),
      disclaimer: DISCLAIMER
    };
  }

  function html(report) {
    const rows = report.skills.map((s) =>
      "<tr><td>" + s.name + "</td><td>" + (s.subject || "") + "</td><td>" + (s.standard || "") +
      "</td><td>" + s.attempts + "</td><td>" + (s.progress != null ? s.progress + "%" : "—") + "</td></tr>"
    ).join("");
    const std = report.standards.map((s) => "<li>" + s.code + " · " + s.n + " items</li>").join("");
    const hist = report.history.slice(-25).reverse().map((h) => {
      const when = new Date(h.ts).toLocaleDateString();
      return "<tr><td>" + when + "</td><td>" + (h.subject || "") + "</td><td>" + (h.standard_code || "") +
        "</td><td>" + h.result + "</td><td>" + h.progressBefore + "→" + h.progressAfter + "</td></tr>";
    }).join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title>
<style>body{font-family:Georgia,serif;max-width:740px;margin:32px auto;color:#2a2118}
h1{font-size:26px}table{width:100%;border-collapse:collapse;font-size:13px}
td,th{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
.notice{border-left:4px solid #c45c26;padding:10px 12px;background:#f7efe6;margin:18px 0}
.meta{color:#6b5e51}</style></head><body>
<p class="meta">Brain Kit · practice history</p>
<h1>${report.student}, grade ${report.grade}</h1>
<p>${report.questions} logged questions · ${report.minutes} minutes on task · generated ${new Date(report.generatedAt).toLocaleString()}</p>
<div class="notice">${report.disclaimer}</div>
<h2>Skills attempted</h2>
<table><thead><tr><th>Skill</th><th>Subject</th><th>Standard</th><th>Items</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Standards touched</h2>
<ul>${std || "<li>None logged.</li>"}</ul>
<h2>Recent practice</h2>
<table><thead><tr><th>Date</th><th>Subject</th><th>Standard</th><th>Result</th><th>Progress</th></tr></thead><tbody>${hist}</tbody></table>
</body></html>`;
  }

  function pdfEscape(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function wrap(text, width) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      if ((cur + " " + w).trim().length > width) {
        if (cur) lines.push(cur);
        cur = w;
      } else cur = (cur + " " + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function toPDF(report) {
    const lines = [];
    const push = (t, size) => wrap(t, size === 18 ? 42 : 86).forEach((ln) => lines.push({ t: ln, size: size || 11 }));
    push(report.title, 18);
    push(report.student + ", grade " + report.grade, 14);
    push(report.questions + " questions · " + report.minutes + " minutes · " + new Date(report.generatedAt).toLocaleDateString());
    push("");
    wrap(report.disclaimer, 86).forEach((ln) => lines.push({ t: ln, size: 9 }));
    push("");
    push("Skills attempted", 13);
    report.skills.forEach((s) => push("- " + s.name + " · " + (s.standard || "") + " · " + s.attempts + " items"));
    push("");
    push("Standards touched", 13);
    (report.standards.length ? report.standards : [{ code: "None logged", n: "" }]).forEach((s) =>
      push("- " + s.code + (s.n ? " · " + s.n : ""))
    );

    const pages = [];
    const per = 48;
    for (let i = 0; i < lines.length; i += per) pages.push(lines.slice(i, i + per));

    const objs = [];
    objs.push("<< /Type /Catalog /Pages 2 0 R >>");
    const pageIds = [];
    const kids = [];
    let nextId = 3;
    pages.forEach(() => {
      pageIds.push(nextId);
      kids.push(nextId + " 0 R");
      nextId += 2;
    });
    objs.push("<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + pages.length + " >>");

    const contents = [];
    pages.forEach((page) => {
      let stream = "BT /F1 11 Tf 48 760 Td\n";
      page.forEach((ln, i) => {
        const sz = ln.size || 11;
        if (i === 0) stream += "/F1 " + sz + " Tf\n";
        else if (page[i - 1].size !== sz) stream += "/F1 " + sz + " Tf\n";
        stream += "(" + pdfEscape(ln.t) + ") Tj\n0 -16 Td\n";
      });
      stream += "ET";
      contents.push(stream);
    });

    const head = "%PDF-1.4\n";
    let body = "";
    const offsets = [0];
    function addObj(n, raw, stream) {
      offsets[n] = head.length + body.length;
      if (stream != null) {
        body += n + " 0 obj\n<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream\nendobj\n";
      } else {
        body += n + " 0 obj\n" + raw + "\nendobj\n";
      }
    }
    addObj(1, objs[0]);
    addObj(2, objs[1]);
    pages.forEach((page, i) => {
      const pageId = pageIds[i];
      const contentId = pageId + 1;
      addObj(pageId, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents " + contentId + " 0 R /Resources << /Font << /F1 " + (pageIds[pages.length - 1] + 2) + " 0 R >> >> >>");
      addObj(contentId, null, contents[i]);
    });
    const fontId = pageIds[pages.length - 1] + 2;
    addObj(fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");

    const xrefPos = head.length + body.length;
    let xref = "xref\n0 " + (fontId + 1) + "\n0000000000 65535 f \n";
    for (let i = 1; i <= fontId; i++) {
      xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    const pdf = head + body + xref + "trailer\n<< /Size " + (fontId + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF";
    return pdf;
  }

  function download(student, household) {
    const report = build(student, household);
    const pdf = toPDF(report);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brain-kit-practice-" + student.firstName.toLowerCase() + ".pdf";
    a.click();
    return report;
  }

  global.BKExport = { DISCLAIMER, build, html, toPDF, download };
})(window);
