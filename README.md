# Step Chat redesign preview

A design preview of a new look for [stepchat.com](https://www.stepchat.com/), made for Brad to review.

**View it:** https://kirkvantine.github.io/stepchat-redesign/

## What's in it

| Page | What it covers from the current site |
| --- | --- |
| `index.html` | Home page, with the next meetings shown in the visitor's own time zone |
| `meetings.html` | Full weekly schedule (A.A., Al-Anon, ACA, combined/other), filter by fellowship and day |
| `account.html` | Register, log in, forgot password (security question), change password, attendance record |
| `chat.html` | The Lounge and four meeting rooms, room menu, member list, private messages, and the `!` / `...` / `[done]` sharing format |
| `certificate.html` | Meeting attendance confirmation that prints or saves as a PDF |
| `help.html` | How to log on, how meetings work, questions and answers, user agreement summary, tech support form |

## This is a front-end preview

Nothing here talks to the real Step Chat servers.

- Accounts, sessions and the attendance record are saved in the visitor's own browser (`localStorage`).
- The other people in the chat rooms are scripted samples, so the meeting format can be tried out.
- The tech support form does not send anything.
- The meeting schedule in `assets/data.js` was copied from the live schedule pages in October 2026.

Plain HTML, CSS and JavaScript. No build step: open `index.html` or serve the folder.
