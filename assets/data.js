// Meeting schedule copied from the current stepchat.com schedule pages.
// Times are U.S. Eastern. day: 0 = Sunday ... 6 = Saturday.
(function () {
  var F = {
    aa: { label: "A.A.", long: "Alcoholics Anonymous", room: "A.A. Meeting Room" },
    alanon: { label: "Al-Anon", long: "Al-Anon Family Groups", room: "Al-Anon Meeting Room" },
    aca: { label: "ACA", long: "Adult Children of Alcoholics", room: "ACA Meeting Room" },
    other: { label: "Other", long: "Combined and other fellowships", room: "Combined Meeting Room" }
  };
  var list = [];
  function add(f, days, h, m, name) {
    days.forEach(function (d) { list.push({ f: f, day: d, h: h, m: m, name: name }); });
  }
  var ALL = [0, 1, 2, 3, 4, 5, 6];

  // A.A.
  add("aa", [1, 3, 5], 6, 0, "Early Birds Open A.A. Meeting");
  add("aa", [1, 3, 5], 8, 30, "A.A. Big Book Study Meeting");
  add("aa", [1], 12, 0, "3rd Tradition A.A. Meeting");
  add("aa", [2], 12, 0, "Tuesday Nooners Open A.A. Meeting");
  add("aa", [0, 3, 4, 5, 6], 12, 0, "Noon A.A. Meeting");
  add("aa", [0, 1, 4, 5], 20, 0, "Open A.A. Meeting");
  add("aa", [2], 20, 0, "Living Sober Book Study A.A. Meeting");
  add("aa", [3], 20, 0, "Beginners A.A. Meeting");
  add("aa", [6], 20, 0, "3rd Tradition A.A. Meeting");
  add("aa", [1, 2, 3, 5], 22, 0, "Open A.A. Meeting");
  add("aa", [4], 22, 0, "You're In The Right Place A.A. Meeting");
  add("aa", [6], 22, 0, "Serenity By The Cybernet A.A. Meeting");
  add("aa", [0], 22, 0, "Fifth Tradition A.A. Meeting");

  // Al-Anon
  add("alanon", [3], 10, 0, "Paths to Recovery Study Al-Anon");
  add("alanon", ALL, 15, 0, "Keep Coming Back Al-Anon Family Group Meeting");
  add("alanon", [0, 1, 2, 3, 4, 6], 20, 0, "Serenity Seekers AFG Meeting");
  add("alanon", [5], 20, 0, "Al-Anon Beginners Meeting");

  // ACA
  add("aca", [0, 6], 11, 0, "The ACA Breakfast Club Open Meeting");
  add("aca", ALL, 14, 0, "ACA Afternoon Meeting");
  add("aca", ALL, 18, 0, "ACA Early Evening Meeting");
  add("aca", ALL, 21, 30, "ACA Nighttime Meeting");

  // Other
  add("other", [6], 10, 30, "Emotions Anonymous Meeting");

  window.SC_DATA = { fellowships: F, meetings: list };
})();
