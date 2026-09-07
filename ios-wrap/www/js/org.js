/* District product. Separate stack from the family household.
   A signed DPA is required before a student id is copied into an org roster. */
(function (global) {
  function state() {
    const hh = global.BKStore.state;
    if (!hh.org) {
      hh.org = {
        name: "Pine Ridge District",
        dpaSigned: false,
        dpaAt: null,
        teachers: [{ name: "Ms. Reyes", email: "reyes@school.kit" }],
        roster: []
      };
    }
    return hh.org;
  }

  function signDpa() {
    const o = state();
    o.dpaSigned = true;
    o.dpaAt = Date.now();
    if (global.BKCompliance) global.BKCompliance.giveConsent("district");
    global.BKStore.persist();
    return o;
  }

  function importStudent(studentId) {
    const o = state();
    if (!o.dpaSigned) return { ok: false, reason: "Sign the DPA before a family profile enters the district roster." };
    const stu = global.BKStore.student(studentId);
    if (!stu) return { ok: false, reason: "No student." };
    if (o.roster.some((r) => r.studentId === studentId)) return { ok: true, already: true };
    o.roster.push({
      studentId,
      firstName: stu.firstName,
      grade: stu.grade,
      source: "family-link-after-dpa",
      at: Date.now()
    });
    global.BKStore.persist();
    return { ok: true };
  }

  function note() {
    const o = state();
    if (!o.dpaSigned) {
      return "District seats are a separate product. Do not copy family billing or Parent HQ into this roster.";
    }
    return "DPA on file. " + o.roster.length + " district roster rows. Family billing stays on the consumer stack.";
  }

  global.BKOrg = { state, signDpa, importStudent, note };
})(window);
