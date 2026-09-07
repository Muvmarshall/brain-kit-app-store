/* Outbox. Same sentences the rest of the app already wrote.
   No third-party ESP in the prototype — one queue, one inbox. */
(function (global) {
  function box() {
    const hh = global.BKStore.state;
    if (!hh.mailbox) hh.mailbox = [];
    return hh.mailbox;
  }

  function send(msg) {
    const item = {
      id: "mail_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      to: msg.to,
      subject: msg.subject,
      body: msg.body,
      lines: msg.lines || null,
      kind: msg.kind || "note",
      at: Date.now()
    };
    box().unshift(item);
    global.BKStore.persist();
    return item;
  }

  function unread() {
    return box().filter((m) => !m.read);
  }

  function markRead(id) {
    const m = box().find((x) => x.id === id);
    if (m) m.read = true;
    global.BKStore.persist();
  }

  global.BKMail = { send, unread, markRead, box };
})(window);
