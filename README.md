# AAA Airlines (Vercel edition)

Your original project, made deployable. The code is **your code**: same pages, same HTML, same raw SQL,
same variable names and comments. Only what Vercel forces was changed (see the end).

```
public/html, css, media   your original folders, untouched
api/*.js                  your php/*.php files, ported line by line (one function per file)
api/_lib/php.js           tiny helper that gives the ported code echo(), $_GET, mysqli, date() ...
api/_lib/bookingfunctions.js   your bookingfunctions.php
database.sql              your sql/*.sql files combined (+ 2 small fixes, explained inside)
sql/                      your original dumps, untouched (for reference)
vercel.json               keeps the /php/xxx.php URLs working and opens the site on html/home.html
```

## Deploy

### 1. Database (TiDB Cloud, free MySQL-compatible, no card)
1. Sign up at https://tidbcloud.com and create a **Starter** cluster (pick the region closest to you).
2. Click **Connect** and **Generate Password**. Copy the password. Note the **Host**, **Port** (4000) and **User** (like `abc123.root`).
3. Open the **SQL Editor**, paste all of `database.sql`, and run it. It creates the `project` database
   (the name your code uses) with all tables and data.

### 2. GitHub
Create a repository and upload everything in this folder (not `node_modules`).

### 3. Vercel
1. https://vercel.com, **Add New, Project**, import the repo. Framework Preset: **Other**. Leave build settings empty.
2. Environment Variables (see `.env.example`): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`.
3. **Deploy**. Opening your `.vercel.app` address takes you to the home page.

## What changed (only what Vercel / a cloud database forced)
1. **PHP became Node.js.** Vercel can't run PHP. Each `php/xxx.php` is now `api/xxx.js`, translated mechanically:
   `$vars` keep their names, `$conn->query()` is `$conn.query()`, the HTML is the same text, and the `.php` URLs still work
   through `vercel.json`.
2. **Database login.** `localhost` / `root` / empty password became environment variables
   (`DB_HOST`, `DB_USER`, `DB_PASSWORD`), because a cloud database needs a real host and password.
   The database name is still hard-coded as `"project"`, like before. The connection is encrypted (TiDB requires it).
3. **`database.sql`**: your dumps combined, with MyISAM and the MySQL-8-only collation removed, plus two fixes your dumps
   needed to work at all: `passenger.ticket_no` is `AUTO_INCREMENT` and `passenger.phone_number` is `BIGINT`.
4. **Not deployed:** the report, diagrams and `flight schedule.txt` (they're not part of the website).

## What is deliberately still the same (for later)
Raw SQL built by string concatenation, admin password checked in browser JavaScript, admin pages open to anyone,
plain-text passwords in `users`, `processpayment.php` not connected, bookings saved before payment, 3-digit booking
references, the broken links to `signup.html` / `custom.js` / `icon.png`, the `place5` test flight...
