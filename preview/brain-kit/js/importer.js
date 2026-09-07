/* CSV / JSON authoring pipeline. Draft vs published. */
(function (global) {
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      const next = src[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  }

  function splitChoices(raw) {
    if (!raw) return [];
    return String(raw)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function rowToSkill(header, values) {
    const rec = {};
    header.forEach((h, i) => {
      rec[h.trim()] = values[i] != null ? String(values[i]).trim() : "";
    });
    const questions = [];
    for (let n = 1; n <= 8; n++) {
      const prompt = rec["q" + n + "_prompt"];
      if (!prompt) continue;
      questions.push({
        id: rec.skill_id + "_q" + n,
        prompt,
        choices: splitChoices(rec["q" + n + "_choices"]),
        answer: rec["q" + n + "_answer"],
        difficulty: Number(rec["q" + n + "_diff"] || 2),
        hint: rec["q" + n + "_hint"] || "Look at the important words again."
      });
    }
    const prereq = rec.prerequisites
      ? rec.prerequisites
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    return {
      id: rec.skill_id,
      subject: rec.subject,
      grade_band: rec.grade_band,
      grade_or_course: rec.grade_or_course,
      strand: rec.strand,
      skill_name: rec.skill_name,
      standard_code: [rec.standard_code, rec.standard_ccss || rec.ccss].filter(Boolean).join(" | ") || rec.standard_code,
      standard_codes: [rec.standard_code, rec.standard_ccss || rec.ccss].filter(Boolean),
      prerequisite_skills: prereq,
      teach_content: {
        explanation: rec.teach_text,
        worked_example: rec.worked_example
      },
      question_bank: questions,
      grade_band_lock: rec.grade_band,
      status: rec.status || "draft"
    };
  }

  function fromCSV(text) {
    const rows = parseCSV(text);
    if (!rows.length) return [];
    const header = rows[0].map((h) => h.trim());
    return rows.slice(1).map((vals) => rowToSkill(header, vals)).filter((s) => s.id && s.skill_name);
  }

  function coverage(skills, taxonomy) {
    const out = [];
    Object.keys(taxonomy.subjects).forEach((band) => {
      const subjects = taxonomy.subjects[band];
      Object.keys(subjects).forEach((subject) => {
        subjects[subject].forEach((strand) => {
          const match = skills.filter(
            (s) =>
              s.grade_band === band &&
              (s.subject === subject || (subject === "ELA" && s.subject === "Reading") || (subject === "Reading" && s.subject === "ELA")) &&
              s.strand === strand
          );
          const published = match.filter((s) => s.status === "published");
          const questions = match.reduce((n, s) => n + (s.question_bank ? s.question_bank.length : 0), 0);
          out.push({
            band,
            subject,
            strand,
            skills: match.length,
            published: published.length,
            questions,
            draft: match.length - published.length
          });
        });
      });
    });
    return out;
  }

  global.BKImport = { parseCSV, fromCSV, coverage };
})(window);
