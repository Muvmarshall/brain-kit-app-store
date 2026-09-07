/* COPPA / FERPA / store. Minimize. Separate consumer from district. */
(function (global) {
  const COLLECTED = ["first name", "grade", "parent email"];

  const NUTRITION = {
    track: "No",
    linked: ["Contact Info", "User Content"],
    notLinked: ["Product Interaction", "Diagnostics"],
    ads: false,
    analyticsSdks: [],
    socialLogins: [],
    ageRating: "4+",
    appleCategory: "Education",
    kidsBehavior: true,
    play: "Designed for Families"
  };

  const LISTING = {
    title: "Brain Kit — Reading & Math Practice, K–12",
    subtitle: "Practice that doesn't punish mistakes.",
    lead: "Brain Kit is a K–12 practice app that never takes progress away. Wrong answers teach. Sessions end. Parents get one sentence, not a dashboard.",
    keywords: ["homework help", "K-12", "math practice", "reading practice", "IXL alternative", "homeschool"]
  };

  function household() {
    return global.BKStore.state;
  }

  function consent() {
    const hh = household();
    if (!hh.consent) {
      hh.consent = { given: false, at: null, version: "v1", mode: "consumer" };
    }
    return hh.consent;
  }

  function giveConsent(mode) {
    const c = consent();
    c.given = true;
    c.at = Date.now();
    c.version = "v1";
    c.mode = mode === "district" ? "district" : "consumer";
    global.BKStore.persist();
    return c;
  }

  function revokeConsent() {
    const c = consent();
    c.given = false;
    c.revokedAt = Date.now();
    global.BKStore.persist();
    return c;
  }

  function mayCreateProfile() {
    return !!consent().given;
  }

  function inventory(student) {
    return {
      collected: COLLECTED.slice(),
      firstName: student && student.firstName,
      grade: student && student.grade,
      parentEmail: household().parentEmail,
      notCollected: [
        "last name",
        "precise location",
        "photos of the child",
        "contacts",
        "behavioral ad identifiers"
      ],
      mode: consent().mode
    };
  }

  function exportChild(student) {
    return {
      disclaimer: "Parent-requested export of this child's Brain Kit data. Consumer household — not a FERPA education record unless a district DPA is in force.",
      collected: inventory(student),
      mastery: student.mastery || {},
      history: student.history || [],
      goals: household().goals && household().goals[student.id],
      classroomLinks: (household().classrooms || [])
        .filter((c) => (c.studentIds || []).indexOf(student.id) !== -1)
        .map((c) => c.name)
    };
  }

  function deleteChild(studentId) {
    const hh = household();
    hh.students = (hh.students || []).filter((s) => s.id !== studentId);
    if (hh.goals) delete hh.goals[studentId];
    (hh.classrooms || []).forEach((c) => {
      c.studentIds = (c.studentIds || []).filter((id) => id !== studentId);
    });
    global.BKStore.persist();
    return { ok: true };
  }

  function ferpaNote() {
    const mode = consent().mode;
    if (mode === "district") {
      return "District classroom seats: Brain Kit acts as a school official for those accounts under a signed DPA. Do not mix with consumer household data.";
    }
    return "Brain Kit is sold to families. It is not a school official under FERPA. A district license is a separate product with a separate DPA.";
  }

  function privacyPlain() {
    return [
      "We keep three things about a child: a first name, a grade, and the parent email that unlocked the account.",
      "We do not run ads. We do not drop profiling analytics. There is no social feed and no social login.",
      "A parent has to agree before any student profile is created.",
      "From Parent HQ a parent can read that data, download it, or delete the child’s profile.",
      ferpaNote(),
      "Apple listing: Education, age rating 4+. Built to Kids Category standards (parental gate, no ads, no child-side outbound links) so that option stays open. Data Used to Track You: No."
    ];
  }

  global.BKCompliance = {
    COLLECTED,
    NUTRITION,
    LISTING,
    consent,
    giveConsent,
    revokeConsent,
    mayCreateProfile,
    inventory,
    exportChild,
    deleteChild,
    ferpaNote,
    privacyPlain
  };
})(window);
