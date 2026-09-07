window.BK_MATH_SEED = [
  {
    id: "math-2-sub-1",
    subject: "Math",
    grade_band: "K-2",
    grade_or_course: "2",
    strand: "Addition & subtraction within 100",
    skill_name: "Subtract two-digit numbers with regrouping",
    standard_code: "MA.2.NSO.2.3",
    prerequisite_skills: ["math-1-sub-1"],
    teach_content: {
      explanation: "When the ones digit on top is too small, trade 1 ten for 10 ones. Then subtract ones, then tens.",
      worked_example: "43 − 17. 3 ones is smaller than 7, so trade a ten: 13 − 7 = 6 ones, 3 tens − 1 ten = 2 tens. Answer 26."
    },
    question_bank: [
      { id: "math-2-sub-1-q1", prompt: "43 − 17 =", choices: ["36", "26", "16"], answer: "26", difficulty: 2, hint: "Can you subtract 7 ones from 3 ones without a trade?" },
      { id: "math-2-sub-1-q2", prompt: "50 − 18 =", choices: ["42", "32", "38"], answer: "32", difficulty: 2, hint: "Zero ones means you must trade a ten first." },
      { id: "math-2-sub-1-q3", prompt: "64 − 29 =", choices: ["45", "35", "55"], answer: "35", difficulty: 3, hint: "Trade so you have 14 ones, then subtract 9." },
      { id: "math-2-sub-1-q4", prompt: "31 − 14 =", choices: ["17", "27", "23"], answer: "17", difficulty: 1, hint: "1 one is smaller than 4 ones." },
      { id: "math-2-sub-1-q5", prompt: "80 − 36 =", choices: ["54", "44", "56"], answer: "44", difficulty: 4, hint: "Trade a ten so ones become 10." }
    ],
    grade_band_lock: "K-2",
    status: "published"
  },
  {
    id: "math-1-sub-1",
    subject: "Math",
    grade_band: "K-2",
    grade_or_course: "1",
    strand: "Addition & subtraction within 100",
    skill_name: "Subtract within 20 using a ten",
    standard_code: "MA.1.NSO.2.2",
    prerequisite_skills: [],
    teach_content: {
      explanation: "Make a ten, then subtract what is left. 13 − 5 is 10 − 2 because 5 = 3 + 2.",
      worked_example: "13 − 5. From 13 down to 10 is 3. You still need to subtract 2. 10 − 2 = 8."
    },
    question_bank: [
      { id: "math-1-sub-1-q1", prompt: "13 − 5 =", choices: ["8", "9", "7"], answer: "8", difficulty: 2, hint: "Hop down to 10 first." },
      { id: "math-1-sub-1-q2", prompt: "15 − 7 =", choices: ["9", "8", "7"], answer: "8", difficulty: 2, hint: "15 to 10 is 5, then 2 more." },
      { id: "math-1-sub-1-q3", prompt: "12 − 4 =", choices: ["8", "9", "6"], answer: "8", difficulty: 1, hint: "12 − 2 = 10, then 2 more." },
      { id: "math-1-sub-1-q4", prompt: "11 − 6 =", choices: ["5", "4", "6"], answer: "5", difficulty: 3, hint: "11 to 10 is 1, then subtract 5." }
    ],
    grade_band_lock: "K-2",
    status: "published"
  },
  {
    id: "math-7-prop-1",
    subject: "Math",
    grade_band: "6-8",
    grade_or_course: "7",
    strand: "Grade 7",
    skill_name: "Solve a one-step percent problem",
    standard_code: "MA.7.AR.3.2",
    prerequisite_skills: [],
    teach_content: {
      explanation: "A percent is a hundredths amount. 20% of a number is 0.20 times the number.",
      worked_example: "20% of 40 = 0.20 × 40 = 8."
    },
    question_bank: [
      { id: "math-7-prop-1-q1", prompt: "What is 20% of 40?", choices: ["8", "10", "20"], answer: "8", difficulty: 2, hint: "20% means 20 per 100, or 1/5." },
      { id: "math-7-prop-1-q2", prompt: "What is 10% of 90?", choices: ["9", "10", "19"], answer: "9", difficulty: 1, hint: "10% is one tenth." },
      { id: "math-7-prop-1-q3", prompt: "What is 25% of 80?", choices: ["20", "25", "16"], answer: "20", difficulty: 3, hint: "25% is one fourth." }
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
      explanation: "In a right triangle, a² + b² = c² where c is the hypotenuse.",
      worked_example: "Legs 3 and 4. 9 + 16 = 25. Hypotenuse is 5."
    },
    question_bank: [
      { id: "math-geo-py-1-q1", prompt: "Legs 3 and 4. Hypotenuse?", choices: ["5", "7", "6"], answer: "5", difficulty: 1, hint: "3-4-5 is a family you can trust." },
      { id: "math-geo-py-1-q2", prompt: "Legs 6 and 8. Hypotenuse?", choices: ["10", "14", "9"], answer: "10", difficulty: 2, hint: "This is a scaled 3-4-5." },
      { id: "math-geo-py-1-q3", prompt: "Hypotenuse 13, one leg 5. Other leg?", choices: ["12", "8", "18"], answer: "12", difficulty: 3, hint: "c² − a² = b²." }
    ],
    grade_band_lock: "9-12",
    status: "published"
  }
];
