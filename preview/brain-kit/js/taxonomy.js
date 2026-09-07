/* Brain Kit taxonomy shell — structure only. Subjects/grades/strands are data. */
window.BK_TAXONOMY = {
  tools: [
    { id: "magnifier", subject: "Reading", label: "Magnifier", grades: "K–12", minGrade: 0, bands: ["K-2", "3-5", "6-8", "9-12"] },
    { id: "pen", subject: "Writing & Grammar", label: "Pen", grades: "K–12", minGrade: 0, bands: ["K-2", "3-5", "6-8", "9-12"] },
    { id: "wrench", subject: "Math", label: "Wrench", grades: "K–12", minGrade: 0, bands: ["K-2", "3-5", "6-8", "9-12"] },
    { id: "beaker", subject: "Science", label: "Beaker", grades: "K–12", minGrade: 0, bands: ["K-2", "3-5", "6-8", "9-12"] },
    { id: "compass", subject: "Social Studies", label: "Compass", grades: "K–12", minGrade: 0, bands: ["K-2", "3-5", "6-8", "9-12"] },
    { id: "radio", subject: "World Languages (Spanish)", label: "Radio", grades: "6–12", minGrade: 6, bands: ["6-8", "9-12"] },
    { id: "stopwatch", subject: "Test Prep", label: "Stopwatch", grades: "8–12", minGrade: 8, bands: ["6-8", "9-12"] }
  ],
  bands: ["K-2", "3-5", "6-8", "9-12"],
  gradeToBand: {
    K: "K-2", 0: "K-2", 1: "K-2", 2: "K-2",
    3: "3-5", 4: "3-5", 5: "3-5",
    6: "6-8", 7: "6-8", 8: "6-8",
    9: "9-12", 10: "9-12", 11: "9-12", 12: "9-12"
  },
  maturity: {
    "K-2": "k5", "3-5": "k5", "6-8": "middles", "9-12": "hs"
  },
  subjects: {
    "K-2": {
      Reading: ["Phonological awareness", "Phonics & decoding", "Sight words", "Fluency", "Vocabulary", "Listening & reading comprehension"],
      "Writing & Grammar": ["Letter formation", "Sentence construction", "Capitalization & punctuation", "Spelling patterns", "Narrative basics"],
      Math: ["Counting & cardinality", "Number sense", "Addition & subtraction within 100", "Place value", "Measurement", "Time & money", "2D/3D shapes", "Simple data"],
      Science: ["Living vs. nonliving", "Plants & animals", "Weather & seasons", "Properties of matter", "Earth & sky", "Push & pull"],
      "Social Studies": ["Community & citizenship", "Rules & laws", "Maps & globes", "Past & present", "National symbols & holidays", "Wants & needs"]
    },
    "3-5": {
      Reading: ["Literary comprehension", "Informational comprehension", "Text structure", "Main idea & detail", "Author's purpose", "Vocabulary & word study", "Figurative language", "Fluency"],
      "Writing & Grammar": ["Paragraph & essay structure", "Parts of speech", "Sentence variety", "Opinion / informative / narrative writing", "Research & sources", "Revision & editing"],
      Math: ["Multiplication & division", "Fractions", "Decimals", "Place value to millions", "Factors & multiples", "Measurement & data", "Area & perimeter", "Geometry", "Patterns & algebraic thinking", "Word problems"],
      Science: ["Life science", "Earth & space science", "Physical science", "Scientific method"],
      "Social Studies": ["US & world geography", "Native peoples", "Exploration & colonization", "American Revolution", "State history", "Branches of government", "Civic responsibility", "Basic economics"]
    },
    "6-8": {
      ELA: ["Literary analysis", "Informational & argumentative text", "Theme & inference", "Rhetoric & evidence", "Vocabulary & etymology", "Poetry", "Media literacy"],
      "Writing & Grammar": ["Argumentative / expository / narrative essays", "Thesis & evidence", "Citation", "Advanced grammar & usage", "Revision"],
      Math: ["Grade 6", "Grade 7", "Grade 8 / Pre-Algebra", "Algebra 1"],
      Science: ["Earth & space science", "Life science", "Physical science", "Scientific inquiry & data analysis"],
      "Social Studies": ["World history", "US history", "Civics & government", "Geography", "Economics"],
      Spanish: ["Vocabulary", "Present tense", "Listening comprehension", "Basic conversation"],
      "Test Prep": ["FAST ELA & Math", "Study skills"]
    },
    "9-12": {
      ELA: ["English I–IV", "Literary analysis & criticism", "Rhetoric & argument", "Research writing", "SAT/ACT vocabulary"],
      "Writing & Grammar": ["Composition", "Research papers & citation", "College essay writing", "Advanced usage"],
      Math: ["Algebra 1", "Geometry", "Algebra 2", "Precalculus", "Calculus", "Statistics & Probability"],
      Science: ["Biology", "Chemistry", "Physics", "Environmental Science", "Anatomy & Physiology"],
      "Social Studies": ["World History", "US History", "US Government & Civics", "Economics", "Psychology", "Geography"],
      Spanish: ["Spanish I", "Spanish II", "Spanish III"],
      "Test Prep": ["SAT Math", "SAT Reading & Writing", "ACT", "Florida EOC"]
    }
  }
};

window.BK_normalizeSubject = function (s) {
  if (!s) return s;
  if (s === "ELA" || s === "Reading / ELA") return s === "ELA" ? "ELA" : "Reading";
  return s;
};

window.BK_bandForGrade = function (grade) {
  const g = grade === "K" || grade === "k" ? "K" : String(grade);
  return window.BK_TAXONOMY.gradeToBand[g] || window.BK_TAXONOMY.gradeToBand[Number(g)] || "K-2";
};

window.BK_gradeNumber = function (grade) {
  if (grade === "K" || grade === "k" || grade === 0) return 0;
  return Number(grade);
};

window.BK_toolsForGrade = function (grade) {
  const n = window.BK_gradeNumber(grade);
  return window.BK_TAXONOMY.tools.filter((t) => n >= t.minGrade);
};

/* B.E.S.T. is primary. Common Core is the second tag. Accept string or list. */
window.BK_standards = function (skill) {
  if (!skill) return [];
  if (Array.isArray(skill.standard_codes) && skill.standard_codes.length) return skill.standard_codes;
  if (Array.isArray(skill.standards) && skill.standards.length) return skill.standards;
  const raw = skill.standard_code || skill.standard_ccss || "";
  return String(raw).split("|").map((s) => s.trim()).filter(Boolean);
};

window.BK_standardLabel = function (skill) {
  return window.BK_standards(skill).join(" · ");
};

window.BK_normalizeSkill = function (sk) {
  if (!sk) return sk;
  const codes = window.BK_standards(sk);
  sk.standard_codes = codes;
  sk.standard_code = codes.join(" | ");
  return sk;
};
