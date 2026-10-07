// Shared helpers for the Step Chat redesign preview.
// Accounts, sessions and attendance are kept in this browser's localStorage only.
(function () {
  document.documentElement.classList.add("js");
  var D = window.SC_DATA;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var WEEK = 7 * 24 * 60;

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ }
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  // ---- Time -------------------------------------------------------------
  function easternMinuteOfWeek(date) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date);
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var d = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
    return d * 1440 + parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10);
  }
  // Adds .start (next or current occurrence as a local Date) and .live to each meeting.
  function upcoming() {
    var now = new Date();
    now.setSeconds(0, 0);
    var nowMow = easternMinuteOfWeek(now);
    return D.meetings.map(function (m) {
      var mow = m.day * 1440 + m.h * 60 + m.m;
      var since = ((nowMow - mow) % WEEK + WEEK) % WEEK;
      var live = since < 60;
      var diff = live ? -since : WEEK - since;
      return {
        f: m.f, day: m.day, h: m.h, m: m.m, name: m.name, live: live,
        start: new Date(now.getTime() + diff * 60000)
      };
    }).sort(function (a, b) { return a.start - b.start; });
  }
  function fmtTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  function fmtEastern(m) {
    var h = m.h % 12 || 12;
    return h + ":" + (m.m < 10 ? "0" : "") + m.m + (m.h < 12 ? " am" : " pm");
  }
  function zoneName() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "); } catch (e) { return "your time"; }
  }

  // ---- Accounts ---------------------------------------------------------
  function hash(username, value) {
    var data = new TextEncoder().encode(username.toLowerCase() + ":" + value);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  var auth = {
    users: function () { return read("sc_users", {}); },
    current: function () {
      var name = read("sc_session", null);
      var u = name && auth.users()[name.toLowerCase()];
      return u || null;
    },
    register: function (f) {
      var users = auth.users();
      var key = f.username.toLowerCase();
      if (users[key]) return Promise.reject(new Error("taken"));
      return Promise.all([hash(key, f.password), hash(key, f.answer.trim().toLowerCase())]).then(function (h) {
        users[key] = { username: f.username, email: f.email, question: f.question, pass: h[0], answer: h[1], joined: new Date().toISOString() };
        write("sc_users", users);
        return users[key];
      });
    },
    login: function (username, password) {
      var u = auth.users()[username.toLowerCase()];
      if (!u) return Promise.reject(new Error("nomatch"));
      return hash(username, password).then(function (h) {
        if (h !== u.pass) throw new Error("nomatch");
        write("sc_session", u.username);
        return u;
      });
    },
    logout: function () { localStorage.removeItem("sc_session"); },
    checkAnswer: function (username, answer) {
      var u = auth.users()[username.toLowerCase()];
      if (!u) return Promise.resolve(false);
      return hash(username, answer.trim().toLowerCase()).then(function (h) { return h === u.answer; });
    },
    setPassword: function (username, password) {
      var users = auth.users();
      var key = username.toLowerCase();
      return hash(key, password).then(function (h) { users[key].pass = h; write("sc_users", users); });
    }
  };

  // ---- Attendance log ---------------------------------------------------
  var attendance = {
    list: function (username) { return read("sc_attendance", {})[username.toLowerCase()] || []; },
    add: function (username, entry) {
      var all = read("sc_attendance", {});
      var key = username.toLowerCase();
      all[key] = all[key] || [];
      var dup = all[key].some(function (e) { return e.name === entry.name && e.date === entry.date; });
      if (!dup) { all[key].unshift(entry); write("sc_attendance", all); }
    }
  };

  // ---- Header and footer ------------------------------------------------
  var MARK = '<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor">' +
    '<circle cx="20" cy="5" r="4"/><circle cx="30.6" cy="9.4" r="4"/><circle cx="35" cy="20" r="4"/>' +
    '<circle cx="30.6" cy="30.6" r="4"/><circle cx="20" cy="35" r="4"/><circle cx="9.4" cy="30.6" r="4"/>' +
    '<circle cx="5" cy="20" r="4"/></g><circle cx="9.4" cy="9.4" r="4" fill="#f2b632"/></svg>';

  function renderChrome() {
    var page = document.body.getAttribute("data-page");
    var user = auth.current();
    var links = [["meetings.html", "Meetings", "meetings"], ["chat.html", "Chat", "chat"],
      ["certificate.html", "Attendance", "certificate"], ["help.html", "Help", "help"]];

    var header = document.getElementById("site-header");
    if (header) {
      var nav = links.map(function (l) {
        return '<a href="' + l[0] + '"' + (page === l[2] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
      }).join("");
      header.className = "site-header";
      header.innerHTML =
        '<a class="skip" href="#main">Skip to main content</a>' +
        '<div class="wrap">' +
        '<a class="brand" href="index.html">' + MARK + "<span>Step Chat</span></a>" +
        '<nav class="nav" aria-label="Main">' + nav + "</nav>" +
        '<div class="header-actions"></div>' +
        '<button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false"><i class="ph ph-list" aria-hidden="true"></i></button>' +
        "</div>";
      var actions = header.querySelector(".header-actions");
      if (user) {
        actions.appendChild(el("a", { href: "account.html", class: "btn ghost small", text: user.username }));
        var out = el("button", { type: "button", class: "linkish hide-sm", text: "Log out" });
        out.addEventListener("click", function () { auth.logout(); location.href = "index.html"; });
        actions.appendChild(out);
      } else {
        actions.appendChild(el("a", { href: "account.html", class: "hide-sm", text: "Log in" }));
        actions.appendChild(el("a", { href: "account.html?tab=register", class: "btn small", text: "Join Step Chat" }));
      }
      var menu = header.querySelector(".menu-btn");
      menu.addEventListener("click", function () {
        var open = header.classList.toggle("open");
        menu.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var note = document.getElementById("preview-note");
    if (note) {
      note.className = "preview-note no-print";
      note.innerHTML = '<div class="wrap"><p>Design preview for Brad. Accounts, chat members and certificates here are samples saved only in your browser. The live site is still <a href="https://www.stepchat.com/">stepchat.com</a>.</p></div>';
    }

    var footer = document.getElementById("site-footer");
    if (footer) {
      footer.className = "site-footer no-print";
      footer.innerHTML =
        '<div class="wrap"><div class="cols">' +
        '<div><a class="brand" href="index.html">' + MARK + "<span>Step Chat</span></a>" +
        '<p class="soft" style="margin-top:14px">12-step meetings and open fellowship chat. Meetings are conducted by volunteer service workers who are members of the fellowships listed.</p></div>' +
        "<div><h3>Get started</h3><ul>" +
        '<li><a href="help.html#logon">How to log on</a></li><li><a href="help.html#meetings">How meetings work</a></li>' +
        '<li><a href="help.html#faq">Questions and answers</a></li><li><a href="help.html#contact">Tech support</a></li></ul></div>' +
        "<div><h3>Meetings</h3><ul>" +
        '<li><a href="meetings.html?f=aa">A.A. meetings</a></li><li><a href="meetings.html?f=alanon">Al-Anon meetings</a></li>' +
        '<li><a href="meetings.html?f=aca">ACA meetings</a></li><li><a href="meetings.html?f=other">Combined and other</a></li></ul></div>' +
        "<div><h3>Learn more</h3><ul>" +
        '<li><a href="https://stepchat.com/about.htm">Alcoholism info</a></li>' +
        '<li><a href="http://aboutalcoholism.proboards.com/">Bulletin board</a></li>' +
        '<li><a href="http://alcoholismguide.com/medallions.htm">Cybriety medallions</a></li>' +
        '<li><a href="help.html#agreement">User agreement</a></li>' +
        '<li><a href="https://stepchat.com/privacy.htm">Privacy policy</a></li></ul></div>' +
        "</div>" +
        '<p class="fine">Step Chat is supported by member donations. This page is a redesign preview and does not collect or send any information.</p></div>';
    }
  }

  window.SC = {
    DAYS: DAYS, data: D, el: el, auth: auth, attendance: attendance,
    easternDay: function () { return Math.floor(easternMinuteOfWeek(new Date()) / 1440); },
    upcoming: upcoming, fmtTime: fmtTime, fmtEastern: fmtEastern, zoneName: zoneName
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderChrome);
  else renderChrome();
})();
