// A tiny stand-in for the few PHP features the original pages used
// (echo, $_GET/$_POST, mysqli, date(), header(), die() ...), so the ported
// files can stay as close to the PHP originals as possible.
const mysql = require('mysql2/promise');
const { AsyncLocalStorage } = require('async_hooks');

const requestStore = new AsyncLocalStorage();

class Exit extends Error {
  constructor(msg) { super('exit'); this.msg = msg; }
}

// ---- output ---------------------------------------------------------------
function echo(s) { requestStore.getStore().out.push(String(s)); }
function die(msg) { throw new Exit(msg === undefined ? '' : String(msg)); }
function header(h) {
  const store = requestStore.getStore();
  const m = /^Location:\s*(.*)$/i.exec(h);
  if (m) { store.status = 302; store.location = m[1]; }
}

// ---- small helpers --------------------------------------------------------
function isset(v) { return v !== undefined && v !== null; }
function empty(v) { return v === undefined || v === null || v === '' || v === 0 || v === '0' || v === false; }
function mt_rand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function date_default_timezone_set() { /* everything below is always Asia/Karachi (PKT) */ }

const TZ = 'Asia/Karachi';
const pad2 = (n) => String(n).padStart(2, '0');
function strtotime(str) {            // 'YYYY-MM-DD' -> timestamp (ms) at midnight PKT
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str || '')) return NaN;
  return Date.parse(str + 'T00:00:00+05:00');
}
function date(format, ts) {          // supports the format letters the project uses
  const t = ts === undefined ? Date.now() : ts;
  if (Number.isNaN(t)) return '';
  const p = {};
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(t).forEach((x) => { p[x.type] = x.value; });
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const H = parseInt(p.hour, 10);
  const map = {
    l: p.weekday, j: String(parseInt(p.day, 10)), d: pad2(p.day), F: p.month,
    m: pad2(MONTHS.indexOf(p.month) + 1), Y: p.year,
    g: String(H % 12 === 0 ? 12 : H % 12), i: p.minute, a: H >= 12 ? 'pm' : 'am', H: pad2(H),
  };
  return format.replace(/[a-zA-Z]/g, (c) => (c in map ? map[c] : c));
}

// ---- mysqli ---------------------------------------------------------------
class Result {
  constructor(rows) { this.rows = rows; this.num_rows = rows.length; this._i = 0; }
  fetch_assoc() { return this._i < this.rows.length ? this.rows[this._i++] : null; }
}

class Mysqli {
  constructor() { this.connect_error = null; this.error = ''; this._c = null; }
  async query(sql) {                 // SELECT -> result object, INSERT/UPDATE/DELETE -> true, error -> false
    try {
      const [r] = await this._c.query(sql);
      this.error = '';
      return Array.isArray(r) ? new Result(r) : true;
    } catch (e) { this.error = e.message; return false; }
  }
  async select_db(name) { return (await this.query('USE `' + name + '`')) === true; }
  async close() { try { await this._c.end(); } catch (e) { /* already closed */ } }
}

async function mysqli(host, user, password, database) {
  const m = new Mysqli();
  try {
    m._c = await mysql.createConnection({
      host, user, password, database,
      port: Number(process.env.DB_PORT || 4000),
      // TiDB Cloud needs an encrypted connection (XAMPP did not)
      ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      dateStrings: true,             // DATE columns come back as 'YYYY-MM-DD', like in PHP
    });
    requestStore.getStore().conns.push(m);
  } catch (e) { m.connect_error = e.message; }
  return m;
}

// ---- turns a ported page into a Vercel function ---------------------------
function bodyOf(req) {
  const b = req.body;
  if (b && typeof b === 'object' && !Buffer.isBuffer(b)) return b;
  if (typeof b === 'string' || Buffer.isBuffer(b)) return Object.fromEntries(new URLSearchParams(String(b)));
  return {};
}

function php(page) {
  return async (req, res) => {
    const store = { out: [], conns: [], status: 200, location: null };
    await requestStore.run(store, async () => {
      try {
        const { __page, ...query } = req.query || {};   // __page is added by vercel.json, not part of the original request
        await page(query, bodyOf(req), { REQUEST_METHOD: req.method });
      } catch (e) {
        if (e instanceof Exit) store.out.push(e.msg);
        else { console.error(e); store.status = 500; store.out.push('Server error. Check the Vercel function logs.'); }
      } finally {
        await Promise.all(store.conns.map((c) => c.close()));
      }
    });
    res.statusCode = store.status;
    if (store.location) res.setHeader('Location', store.location);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.end(store.location ? '' : store.out.join(''));
  };
}

module.exports = {
  php, echo, die, header, isset, empty, mt_rand, date, strtotime,
  date_default_timezone_set, mysqli,
};
