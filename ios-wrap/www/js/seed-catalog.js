/* Extra published skills so every band has something to practice. */
window.BK_CATALOG_SEED = [
  {
    id: "sci-2-life-1",
    subject: "Science",
    grade_band: "K-2",
    grade_or_course: "2",
    strand: "Life science",
    skill_name: "Name what a plant needs to grow",
    standard_code: "SC.2.L.16.1",
    prerequisite_skills: [],
    teach_content: {
      explanation: "Plants need light, water, air, and space. Take one away and growth slows.",
      worked_example: "A bean in a dark closet stays pale. The missing piece is light."
    },
    question_bank: [
      { id: "sci-2-life-1-q1", prompt: "A plant kept in a dark closet is most missing…", choices: ["Light", "Soil jokes", "A name"], answer: "Light", difficulty: 1, hint: "Closets are dark." },
      { id: "sci-2-life-1-q2", prompt: "Which list are things a plant needs?", choices: ["Light, water, air", "Wi-Fi, juice, a backpack", "Wheels, paint, glue"], answer: "Light, water, air", difficulty: 2, hint: "Think garden, not classroom supplies." },
      { id: "sci-2-life-1-q3", prompt: "If you never water a seedling, it will…", choices: ["Wilt", "Turn into a rock", "Learn to swim"], answer: "Wilt", difficulty: 2, hint: "Water is not optional." }
    ],
    grade_band_lock: "K-2",
    status: "published"
  },
  {
    id: "ss-2-civ-1",
    subject: "Social Studies",
    grade_band: "K-2",
    grade_or_course: "2",
    strand: "Civics",
    skill_name: "Tell a rule from a choice",
    standard_code: "SS.2.CG.2.1",
    prerequisite_skills: [],
    teach_content: {
      explanation: "A rule keeps people safe or fair. A choice is something you may pick.",
      worked_example: "Stop at a stop sign is a rule. Red or blue lunchbox is a choice."
    },
    question_bank: [
      { id: "ss-2-civ-1-q1", prompt: "Which is a rule?", choices: ["Stop at the stop sign", "Pick apple slices", "Wear your lucky socks"], answer: "Stop at the stop sign", difficulty: 1, hint: "Rules keep people safe." },
      { id: "ss-2-civ-1-q2", prompt: "Which is a choice?", choices: ["Which book to read", "Do not hit", "Look both ways"], answer: "Which book to read", difficulty: 2, hint: "You get to pick." }
    ],
    grade_band_lock: "K-2",
    status: "published"
  },
  {
    id: "math-4-frac-1",
    subject: "Math",
    grade_band: "3-5",
    grade_or_course: "4",
    strand: "Fractions",
    skill_name: "Compare two fractions with the same denominator",
    standard_code: "MA.4.FR.1.3",
    prerequisite_skills: [],
    teach_content: {
      explanation: "Same denominator means the pieces are the same size. The larger numerator is the larger fraction.",
      worked_example: "3/8 vs 5/8. Eighths are equal pieces. 5 pieces beat 3 pieces."
    },
    question_bank: [
      { id: "math-4-frac-1-q1", prompt: "Which is greater, 3/8 or 5/8?", choices: ["3/8", "5/8", "They are equal"], answer: "5/8", difficulty: 1, hint: "Same size pieces." },
      { id: "math-4-frac-1-q2", prompt: "2/6 compared with 4/6 is…", choices: ["2/6 is greater", "4/6 is greater", "Equal"], answer: "4/6 is greater", difficulty: 2, hint: "Count the pieces." }
    ],
    grade_band_lock: "3-5",
    status: "published"
  },
  {
    id: "read-4-inf-1",
    subject: "Reading",
    grade_band: "3-5",
    grade_or_course: "4",
    strand: "Informational text",
    skill_name: "Find the main idea of a short paragraph",
    standard_code: "ELA.4.R.2.2",
    prerequisite_skills: [],
    teach_content: {
      explanation: "The main idea is what almost every sentence is doing. Details prove it; they are not the whole.",
      worked_example: "Bees visit flowers, carry pollen, and make honey. The paragraph is about how bees work — not about one flower."
    },
    question_bank: [
      { id: "read-4-inf-1-q1", prompt: "A paragraph about bees making honey is mostly about…", choices: ["Bees and honey", "Soccer scores", "A rainy day"], answer: "Bees and honey", difficulty: 1, hint: "What do most sentences mention?" },
      { id: "read-4-inf-1-q2", prompt: "Details in a paragraph are there to…", choices: ["Support the main idea", "Replace the title", "End the book"], answer: "Support the main idea", difficulty: 2, hint: "They prove the point." }
    ],
    grade_band_lock: "3-5",
    status: "published"
  },
  {
    id: "math-7-prop-1",
    subject: "Math",
    grade_band: "6-8",
    grade_or_course: "7",
    strand: "Ratios & percents",
    skill_name: "Solve a one-step percent problem",
    standard_code: "MA.7.AR.3.2",
    prerequisite_skills: [],
    teach_content: {
      explanation: "A percent is a hundredths view. 20% of 40 is 0.20 × 40.",
      worked_example: "20% of 40. 0.2 × 40 = 8."
    },
    question_bank: [
      { id: "math-7-prop-1-q1", prompt: "What is 20% of 40?", choices: ["8", "20", "4"], answer: "8", difficulty: 2, hint: "20% means 0.20." },
      { id: "math-7-prop-1-q2", prompt: "What is 10% of 90?", choices: ["9", "10", "19"], answer: "9", difficulty: 1, hint: "Move the decimal one place." },
      { id: "math-7-prop-1-q3", prompt: "What is 25% of 80?", choices: ["20", "25", "40"], answer: "20", difficulty: 2, hint: "25% is one fourth." }
    ],
    grade_band_lock: "6-8",
    status: "published"
  },
  {
    id: "ela-7-arg-1",
    subject: "ELA",
    grade_band: "6-8",
    grade_or_course: "7",
    strand: "Argument",
    skill_name: "Separate a claim from evidence",
    standard_code: "ELA.7.R.2.4",
    prerequisite_skills: [],
    teach_content: {
      explanation: "A claim is the point the writer wants you to accept. Evidence is the fact or example that supports it.",
      worked_example: "Claim: the library should stay open later. Evidence: 40 students stay after 4 p.m. for Wi-Fi."
    },
    question_bank: [
      { id: "ela-7-arg-1-q1", prompt: "“School should start later.” That sentence is a…", choices: ["Claim", "Piece of evidence", "Caption"], answer: "Claim", difficulty: 1, hint: "It is the point, not the proof." },
      { id: "ela-7-arg-1-q2", prompt: "“Bus ridership rose 12%.” That sentence is…", choices: ["Evidence", "A title", "A counterclaim"], answer: "Evidence", difficulty: 2, hint: "A number that could support a point." }
    ],
    grade_band_lock: "6-8",
    status: "published"
  },
  {
    id: "math-geo-py-1",
    subject: "Math",
    grade_band: "9-12",
    grade_or_course: "Geometry",
    strand: "Geometry",
    skill_name: "Use the Pythagorean theorem on a right triangle",
    standard_code: "MA.912.GR.1.3",
    prerequisite_skills: [],
    teach_content: {
      explanation: "In a right triangle, a² + b² = c². c is the hypotenuse, opposite the right angle.",
      worked_example: "Legs 3 and 4. 9 + 16 = 25. Hypotenuse is 5."
    },
    question_bank: [
      { id: "math-geo-py-1-q1", prompt: "Legs 3 and 4. The hypotenuse is…", choices: ["5", "7", "12"], answer: "5", difficulty: 1, hint: "3-4-5 triangle." },
      { id: "math-geo-py-1-q2", prompt: "Legs 6 and 8. The hypotenuse is…", choices: ["10", "14", "9"], answer: "10", difficulty: 2, hint: "Scale the 3-4-5." }
    ],
    grade_band_lock: "9-12",
    status: "published"
  },
  {
    id: "sci-bio-1",
    subject: "Science",
    grade_band: "9-12",
    grade_or_course: "Biology",
    strand: "Cells",
    skill_name: "Name the job of the mitochondrion",
    standard_code: "SC.912.L.14.3",
    prerequisite_skills: [],
    teach_content: {
      explanation: "Mitochondria release usable energy from food. They do not store DNA as their main job and they are not the cell wall.",
      worked_example: "Muscle cells are packed with mitochondria because muscles spend energy fast."
    },
    question_bank: [
      { id: "sci-bio-1-q1", prompt: "The mitochondrion’s main job is to…", choices: ["Release usable energy", "Make the cell wall", "Store waste only"], answer: "Release usable energy", difficulty: 2, hint: "Think energy, not structure." },
      { id: "sci-bio-1-q2", prompt: "Which cell would need many mitochondria?", choices: ["A muscle cell", "A dry cork cell", "A dead xylem tube"], answer: "A muscle cell", difficulty: 2, hint: "Who spends energy?" }
    ],
    grade_band_lock: "9-12",
    status: "published"
  },
  {
    id: "write-5-sent-1",
    subject: "Writing & Grammar",
    grade_band: "3-5",
    grade_or_course: "5",
    strand: "Conventions",
    skill_name: "Fix a run-on with a period or a conjunction",
    standard_code: "ELA.5.C.3.1",
    prerequisite_skills: [],
    teach_content: {
      explanation: "Two complete thoughts need a period, a semicolon, or a comma plus a conjunction. A comma alone is not enough.",
      worked_example: "The bell rang the class stood up. → The bell rang. The class stood up."
    },
    question_bank: [
      { id: "write-5-sent-1-q1", prompt: "Best fix for “The bell rang the class stood up.”", choices: ["The bell rang. The class stood up.", "The bell rang, the class stood up.", "The bell rang the class, stood up."], answer: "The bell rang. The class stood up.", difficulty: 2, hint: "Two sentences, or add and." },
      { id: "write-5-sent-1-q2", prompt: "Which is a run-on?", choices: ["We packed we left.", "We packed.", "We left after lunch."], answer: "We packed we left.", difficulty: 1, hint: "Two thoughts smashed together." }
    ],
    grade_band_lock: "3-5",
    status: "published"
  }
];
