// Chat room preview. The other members here are scripted samples so the room
// behaves like a real meeting. A live build would swap `Sim` for the chat server.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var user = SC.auth.current();
  if (!user) { $("gate").hidden = false; return; }
  $("shell").hidden = false;

  var F = SC.data.fellowships;
  var me = user.username;
  var ROOMS = [{ id: "lounge", name: "The Lounge", sub: "Open fellowship chat" }].concat(
    Object.keys(F).map(function (k) { return { id: k, name: F[k].room, sub: F[k].long }; }));

  var CHAIR = "Ruthie_12";
  var GREETER = "june_bug88";
  var MEMBERS = ["Marisol_42", "DesertRain7", "Hank_1959", "Tavish_603", GREETER];
  var TOPICS = ["one day at a time", "asking for help", "gratitude", "letting go of what we can't control"];
  var SHARES = [
    ["Thanks. I nearly skipped today ...", "but I logged in anyway, and I'm glad I did ...", "That's all I have. [done]"],
    ["Hi everyone. This week was a hard one ...", "I called someone instead of sitting alone with it ...", "and that made the difference. Thanks for listening. [done]"],
    ["I'm mostly here to listen today ...", "but I wanted to say it helps to see familiar names. [done]"],
    ["Something I heard here last week stuck with me ...", "I don't have to solve the whole year, only today ...", "Glad to be here. [done]"]
  ];
  var LOUNGE = [
    "Morning or evening, wherever you are. Coffee's on.",
    "Anyone heading to the next meeting?",
    "First time I logged in here I just read along for a week. Nobody minded.",
    "Checking in before work. Hope everybody's doing okay today.",
    "The calendar shows what's coming up if you're looking for a meeting."
  ];

  var state = { room: null, timers: [], floor: null, queue: [], pmTo: null, shareIdx: 0, greeted: false };

  function later(ms, fn) { state.timers.push(setTimeout(fn, ms)); }
  function clearTimers() { state.timers.forEach(clearTimeout); state.timers = []; }

  function mark(text) {
    // Highlights the three sharing signals. Built from text nodes, never innerHTML.
    var frag = document.createDocumentFragment();
    text.split(/(\[done\]|\.\.\.|^!$)/i).forEach(function (part) {
      if (!part) return;
      if (/^(\[done\]|\.\.\.|!)$/i.test(part)) frag.appendChild(SC.el("mark", { text: part }));
      else frag.appendChild(document.createTextNode(part));
    });
    return frag;
  }
  function post(who, text, kind) {
    var log = $("log");
    var nearEnd = log.scrollHeight - log.scrollTop - log.clientHeight < 120;
    var row = SC.el("div", { class: "msg" + (kind ? " " + kind : "") + (who === me ? " me" : "") });
    if (kind === "sys") row.textContent = text;
    else {
      row.appendChild(SC.el("span", { class: "who", text: who === me ? "You" : who + (who === CHAIR && state.room !== "lounge" ? " (chair)" : "") }));
      row.appendChild(SC.el("span", { class: "at", text: SC.fmtTime(new Date()) }));
      var body = SC.el("span", { class: "text" });
      body.appendChild(mark(text));
      row.appendChild(body);
    }
    log.appendChild(row);
    while (log.children.length > 200) log.removeChild(log.firstChild);
    if (nearEnd || who === me) log.scrollTop = log.scrollHeight;
  }

  // ---- Scripted room behaviour -------------------------------------------
  function nextSpeaker() {
    if (state.floor) return;
    if (state.queue.length) {
      var who = state.queue.shift();
      state.floor = who;
      post(CHAIR, "Go ahead, " + who + ".", "chair");
      if (who !== me) speak(who);
      return;
    }
    // Nobody waiting: a sample member raises a hand after a pause.
    later(9000, function () {
      if (state.floor || state.queue.length) return nextSpeaker();
      var m = MEMBERS[state.shareIdx % (MEMBERS.length - 1)];
      post(m, "!");
      state.queue.push(m);
      later(1800, nextSpeaker);
    });
  }
  function speak(who) {
    var lines = SHARES[state.shareIdx++ % SHARES.length];
    lines.forEach(function (line, i) {
      later(2600 * (i + 1), function () {
        post(who, line);
        if (i === lines.length - 1) finish(who);
      });
    });
  }
  function finish(who) {
    later(1600, function () {
      state.floor = null;
      post(CHAIR, "Thanks for sharing, " + who + ". Who's next?", "chair");
      nextSpeaker();
    });
  }
  function startMeeting(room) {
    var mtg = SC.upcoming().filter(function (m) { return m.f === room.id; })[0];
    var title = mtg ? mtg.name : room.name;
    $("room-sub").textContent = mtg && mtg.live ? title + ", in progress" : "Next: " + title + (mtg ? ", " + SC.DAYS[mtg.start.getDay()] + " " + SC.fmtTime(mtg.start) : "");
    post("", "You joined the " + room.name + ". Sample members are shown so you can try the meeting format.", "sys");
    later(900, function () { post(GREETER, "Welcome, " + me + ". Type ! if you'd like to share, or just read along. (private message from the greeter)", "pm"); });
    later(2200, function () { post(CHAIR, "Welcome to the " + title + ". I'm Ruthie, chairing today.", "chair"); });
    later(4600, function () { post(CHAIR, "We share one at a time. Type ! to raise your hand and I'll call on you.", "chair"); });
    later(7200, function () {
      post(CHAIR, "Today's topic is " + TOPICS[new Date().getDay() % TOPICS.length] + ". Who would like to start?", "chair");
      nextSpeaker();
    });
    if (mtg) {
      var now = new Date();
      SC.attendance.add(me, {
        name: title, f: room.id, joined: now.toISOString(),
        date: now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2)
      });
    }
  }
  function startLounge() {
    $("room-sub").textContent = "Open fellowship chat. Meetings are held in the other rooms.";
    post("", "You joined the Lounge. This is open chat, so there's no need to raise your hand.", "sys");
    var i = 0;
    (function chatter() {
      later(5000 + Math.random() * 6000, function () {
        post(MEMBERS[i % MEMBERS.length], LOUNGE[i % LOUNGE.length]);
        i++;
        if (i < 40) chatter();
      });
    })();
  }

  // ---- Rooms and people --------------------------------------------------
  function drawRooms() {
    var box = $("room-list");
    box.textContent = "";
    var up = SC.upcoming();
    ROOMS.forEach(function (r) {
      var b = SC.el("button", { type: "button", class: "room-btn" });
      if (state.room === r.id) b.setAttribute("aria-current", "true");
      b.appendChild(SC.el("strong", { text: r.name }));
      var mtg = up.filter(function (m) { return m.f === r.id; })[0];
      var sub = r.id === "lounge" ? "Open chat, always on"
        : mtg.live ? "Meeting now: " + mtg.name
        : "Next: " + SC.DAYS[mtg.start.getDay()].slice(0, 3) + " " + SC.fmtTime(mtg.start);
      b.appendChild(SC.el("span", { text: sub }));
      b.addEventListener("click", function () { enter(r.id); });
      box.appendChild(b);
    });
  }
  function drawPeople() {
    var box = $("people-list");
    box.textContent = "";
    var names = (state.room === "lounge" ? [] : [CHAIR]).concat(MEMBERS);
    $("people-title").textContent = "In this room (" + (names.length + 1) + ")";
    box.appendChild(SC.el("div", { class: "person-btn", text: me + " (you)" }));
    names.forEach(function (n) {
      var b = SC.el("button", { type: "button", class: "person-btn", text: n + (n === CHAIR ? " (chair)" : "") });
      b.addEventListener("click", function () { setPm(n); $("msg").focus(); });
      box.appendChild(b);
    });
  }
  function setPm(name) {
    state.pmTo = name;
    var tag = $("pm-to");
    tag.textContent = "";
    tag.hidden = !name;
    if (!name) return;
    tag.appendChild(document.createTextNode("Private message to " + name + ". "));
    var stop = SC.el("button", { type: "button", class: "linkish", text: "Back to the room" });
    stop.addEventListener("click", function () { setPm(null); });
    tag.appendChild(stop);
  }
  function enter(id) {
    var room = ROOMS.filter(function (r) { return r.id === id; })[0] || ROOMS[0];
    clearTimers();
    state.room = room.id;
    state.floor = null;
    state.queue = [];
    state.greeted = false;
    setPm(null);
    $("log").textContent = "";
    $("room-title").textContent = room.name;
    Array.prototype.forEach.call(document.querySelectorAll("#quick [data-send], #quick [data-append]"), function (b) {
      b.hidden = room.id === "lounge";
    });
    $("shell").classList.remove("show-rooms");
    $("rooms-toggle").setAttribute("aria-expanded", "false");
    drawRooms();
    drawPeople();
    if (room.id === "lounge") startLounge(); else startMeeting(room);
    history.replaceState(null, "", "chat.html?room=" + room.id);
  }

  // ---- Sending -----------------------------------------------------------
  function send(text) {
    text = text.trim();
    if (!text) return;
    if (state.pmTo) {
      post(me, text + " (private to " + state.pmTo + ")", "pm");
      return;
    }
    post(me, text);
    if (state.room === "lounge") {
      if (!state.greeted) {
        state.greeted = true;
        later(1800, function () { post(MEMBERS[1], "Welcome, " + me + ". Glad you're here."); });
      }
      return;
    }
    if (text === "!") {
      if (state.floor !== me && state.queue.indexOf(me) === -1) state.queue.push(me);
      if (!state.floor) later(1200, nextSpeaker);
      return;
    }
    if (state.floor === me && /\[done\]\s*$/i.test(text)) finish(me);
  }

  $("send-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    send($("msg").value);
    $("msg").value = "";
    $("msg").focus();
  });
  Array.prototype.forEach.call(document.querySelectorAll("#quick [data-send]"), function (b) {
    b.addEventListener("click", function () { send(b.dataset.send); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("#quick [data-append]"), function (b) {
    b.addEventListener("click", function () {
      var box = $("msg");
      box.value = box.value.replace(/\s+$/, "") + b.dataset.append;
      box.focus();
    });
  });
  $("rooms-toggle").addEventListener("click", function () {
    var open = $("shell").classList.toggle("show-rooms");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });

  var want = new URLSearchParams(location.search).get("room");
  enter(want || "lounge");
  setInterval(drawRooms, 60000);
})();
