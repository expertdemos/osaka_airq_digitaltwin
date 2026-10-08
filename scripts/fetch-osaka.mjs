// Osaka Air Quality Twin - live data collector (v12). Runs every 30 minutes in GitHub Actions. Node 20+, no packages.
// Writes in OUT_DIR (default "data"): latest.json, history.json, forecast.json, context.json
// plus live.js (or sample.js when SAMPLE=1) so the page can read the data even when opened from a desktop file.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const DIR = process.env.OUT_DIR || "data", SAMPLE = process.env.SAMPLE === "1", PREF = "27";
const HIST_H = 168, TREND_H = 720, WEEK = 7 * 864e5, PAUSE = +(process.env.SLEEP_MS ?? 250);
const BUA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const BOT = "OsakaAirTwinDemo/3.0 (GitHub Actions data collector)";
const HV = ["pm25", "no2", "ox", "spm", "so2", "co", "wd", "ws"];
const log = (...a) => console.log("[fetch]", ...a), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), p2 = (n) => String(n).padStart(2, "0"), F = (n) => `${DIR}/${n}`;
async function readJ(n) { try { return JSON.parse(await readFile(F(n), "utf8")); } catch { return null; } }
async function writeJ(n, o) { await writeFile(F(n), JSON.stringify(o)); }
async function getRaw(url, { timeout = 30000, ua = BUA } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try { const r = await fetch(url, { headers: { "User-Agent": ua, Accept: "*/*", "Accept-Language": "ja,en;q=0.8", Referer: "https://soramame.env.go.jp/" }, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`); const buf = Buffer.from(await r.arrayBuffer()); const ct = (r.headers.get && r.headers.get("content-type")) || "";
    let txt = new TextDecoder("utf-8").decode(buf); if (/sjis|shift_jis|cp932/i.test(ct) || txt.includes("\uFFFD")) txt = new TextDecoder("shift_jis").decode(buf); return txt; } finally { clearTimeout(t); }
}
const isHtml = (t) => /^\s*<(!doctype|html)/i.test(t);
async function getCSV(url, o) { const t = await getRaw(url, o); if (isHtml(t)) throw new Error("got HTML, not CSV"); return parseCSV(t); }
async function getJSON(url, o) { const t = await getRaw(url, o); if (isHtml(t)) throw new Error("got HTML, not JSON"); return JSON.parse(t); }
function parseCSV(text) { const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; } else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (c !== "\r") cur += c; }
  if (cur.length || row.length) { row.push(cur); rows.push(row); } return rows.filter((r) => r.some((x) => x.trim() !== "")); }
function polKey(name) { const n = String(name).toUpperCase().replace(/[\s（）()]/g, ""); if (n === "PM2.5" || n === "PM2_5" || n === "PM25") return "pm25"; return { SPM: "spm", NO2: "no2", OX: "ox", SO2: "so2", CO: "co", WS: "ws", WD: "wd" }[n] || null; }
const KANJI16 = ["北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西", "北"];
const EN16 = ["NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW", "N"];
function parseWD(v) { const s = String(v ?? "").trim(); if (!s || s === "-") return null; if (/静穏|calm|^C$/i.test(s)) return -1;
  let i = KANJI16.indexOf(s); if (i >= 0) return ((i + 1) * 22.5) % 360; i = EN16.indexOf(s.toUpperCase()); if (i >= 0) return ((i + 1) * 22.5) % 360;
  const n = parseInt(s, 10); if (isFinite(n)) { if (n === 0 || n === 17) return -1; if (n >= 1 && n <= 16) return (n * 22.5) % 360; } return null; }
function clean(key, v) { if (key === "wd") return parseWD(v); if (v == null) return null; const s = String(v).trim(); if (!s || s === "-") return null;
  const x = parseFloat(s); if (!isFinite(x) || x < 0 || x >= 8888) return null; if (key === "no2" || key === "ox" || key === "so2") return Math.round(x * 1000 * 10) / 10; return x; }
const endIso = (Y, M, D, H) => new Date(Date.UTC(+Y, +M - 1, +D, +H - 9)).toISOString();
function labelOf(endMs) { let d = new Date(endMs + 9 * 3600e3), H = d.getUTCHours(); if (H === 0) { d = new Date(d.getTime() - 864e5); H = 24; } return [d.getUTCFullYear(), p2(d.getUTCMonth() + 1), p2(d.getUTCDate()), p2(H)]; }
function histToMap(h) { const m = new Map(); if (!h || !h.times) return m;
  h.times.forEach((t, i) => { const row = new Map(); for (const [c, o] of Object.entries(h.st || {})) { const r = {}; let any = false; for (const k of HV) { const v = o[k] ? o[k][i] : null; if (v != null) { r[k] = v; any = true; } } if (any) row.set(c, r); } m.set(t, row); }); return m; }
function putHist(m, t, code, vals) { if (!m.has(t)) m.set(t, new Map()); const r = {}; let any = false; for (const k of HV) if (vals[k] != null) { r[k] = vals[k]; any = true; } if (any) m.get(t).set(code, r); }
function mapToHist(m, newestIso) { const lim = Date.parse(newestIso) - (HIST_H - 1) * 3600e3;
  const times = [...m.keys()].filter((t) => Date.parse(t) >= lim && Date.parse(t) <= Date.parse(newestIso)).sort();
  const codes = new Set(); times.forEach((t) => m.get(t).forEach((_, c) => codes.add(c)));
  const st = {}; for (const c of codes) { const o = {}; for (const k of HV) { const a = times.map((t) => { const r = m.get(t).get(c); return r && r[k] != null ? r[k] : null; }); if (a.some((x) => x != null)) o[k] = a; } st[c] = o; }
  return { times, st }; }
async function latestEnds() { const out = [];
  try { const t = await getRaw("https://soramame.env.go.jp/data/map/kyokuNoudo/metadata.json"); const m = t.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})[ T](\d{2})/); if (m) out.push(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9)); } catch (e) { log("metadata.json:", e.message); }
  const now = Math.floor(Date.now() / 3600e3) * 3600e3; for (let k = 0; k < 6; k++) out.push(now - k * 3600e3); return [...new Set(out)].sort((a, b) => b - a); }
async function noudoAll(endMs) { const [Y, M, D, H] = labelOf(endMs);
  const rows = await getCSV(`https://soramame.env.go.jp/data/sokutei/noudoAll/${Y}/${M}/${D}/${H}.csv`); const h = rows[0].map((x) => x.trim()); const ix = (f) => h.findIndex(f);
  const iCode = ix((x) => x.includes("測定局コード")), iName = ix((x) => x.includes("測定局名称")), iAddr = ix((x) => x.includes("住所")), iType = ix((x) => x.includes("局種別")), iPref = ix((x) => x.includes("都道府県コード")), iCity = ix((x) => x.includes("市区町村名"));
  if (iCode < 0) throw new Error("unexpected header"); const cols = h.map((x, i) => [polKey(x), i]).filter(([k]) => k); const out = [];
  for (const r of rows.slice(1)) { const code = (r[iCode] || "").trim().padStart(8, "0"); const pref = iPref >= 0 ? String(r[iPref] || "").trim().padStart(2, "0") : code.slice(0, 2); if (pref !== PREF) continue;
    const vals = {}; for (const [k, i] of cols) { const v = clean(k, r[i]); if (v != null) vals[k] = v; }
    out.push({ id: code, name: (r[iName] || code).trim(), address: iAddr >= 0 ? (r[iAddr] || "").trim() : "", city: iCity >= 0 ? (r[iCity] || "").trim() : "", type: iType >= 0 ? (r[iType] || "").trim() : "", vals }); }
  return out; }
function parse7day(rows) { const h = rows[0].map((x) => x.trim()); const iY = h.indexOf("年"), iM = h.indexOf("月"), iD = h.indexOf("日"), iH = h.indexOf("時");
  if (iY < 0 || iH < 0) throw new Error("unexpected 7day header"); const cols = h.map((x, i) => [polKey(x), i]).filter(([k]) => k);
  return rows.slice(1).map((r) => { const vals = {}; for (const [k, i] of cols) { const v = clean(k, r[i]); if (v != null) vals[k] = v; } return [endIso(r[iY], r[iM], r[iD], r[iH]), vals]; }); }
async function addCoords(meta) { let cache = (await readJ("stations-geo.json")) || {}; let added = 0;
  for (const s of Object.values(meta)) { if (cache[s.id]) continue; let q = s.address || ""; if (q && !q.startsWith("大阪府")) q = "大阪府" + q; if (!q) continue;
    try { const res = await getJSON("https://msearch.gsi.go.jp/address-search/AddressSearch?q=" + encodeURIComponent(q)); const c = Array.isArray(res) && res[0] && res[0].geometry && res[0].geometry.coordinates;
      if (c && c[1] > 34.2 && c[1] < 35.1 && c[0] > 135.0 && c[0] < 135.8) { cache[s.id] = { lat: c[1], lon: c[0], q }; added++; } } catch (e) { log("geocode", s.id, e.message); }
    await sleep(PAUSE); }
  if (added) await writeJ("stations-geo.json", cache); for (const s of Object.values(meta)) { const g = cache[s.id]; if (g) { s.lat = g.lat; s.lon = g.lon; } } return added; }
async function amedasTable() { let c = await readJ("cache-amedas.json"); if (c && Date.now() - Date.parse(c.fetchedAt) < WEEK) return c.stations;
  const t = await getJSON("https://www.jma.go.jp/bosai/amedas/const/amedastable.json"); const st = {};
  for (const [code, o] of Object.entries(t)) { const lat = o.lat[0] + o.lat[1] / 60, lon = o.lon[0] + o.lon[1] / 60; if (lat > 34.2 && lat < 35.1 && lon > 135.05 && lon < 135.8) st[code] = { name: o.kjName, nameEn: o.enName, lat: +lat.toFixed(4), lon: +lon.toFixed(4) }; }
  await writeJ("cache-amedas.json", { fetchedAt: new Date().toISOString(), stations: st }); return st; }
const JDIR = [null, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5, 0];
async function fromAmedas() { const tbl = await amedasTable(); const latest = (await getRaw("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt")).trim();
  const stamp = latest.slice(0, 16).replace(/\D/g, "") + "00"; const map = await getJSON(`https://www.jma.go.jp/bosai/amedas/data/map/${stamp}.json`);
  const v = (o, k) => (o && Array.isArray(o[k]) && o[k][1] === 0 ? o[k][0] : null);
  const stations = Object.entries(tbl).map(([code, s]) => { const o = map[code]; if (!o) return null; const wdc = v(o, "windDirection");
    return { code, name: s.name, nameEn: s.nameEn, lat: s.lat, lon: s.lon, temp: v(o, "temp"), hum: v(o, "humidity"), ws: v(o, "wind"), wd: wdc === 0 ? -1 : wdc != null ? JDIR[wdc] : null, prec: v(o, "precipitation1h"), sun: v(o, "sun1h") }; }).filter(Boolean);
  if (!stations.length) throw new Error("no AMeDAS stations in area"); return { time: latest, stations }; }
async function fromJmaForecast() { const f = await getJSON("https://www.jma.go.jp/bosai/forecast/data/forecast/270000.json"); const s = f[0], ts = s.timeSeries || []; const a0 = ts[0] && ts[0].areas && ts[0].areas[0];
  const out = { office: s.publishingOffice, reportDatetime: s.reportDatetime, short: a0 ? { area: a0.area && a0.area.name, times: ts[0].timeDefines, weathers: a0.weathers, winds: a0.winds, codes: a0.weatherCodes } : null,
    pops: ts[1] && ts[1].areas ? { times: ts[1].timeDefines, values: ts[1].areas[0].pops } : null, temps: ts[2] && ts[2].areas ? { times: ts[2].timeDefines, values: ts[2].areas[0].temps } : null };
  return out; }
async function fromJmaWarnings() { const w = await getJSON("https://www.jma.go.jp/bosai/warning/data/warning/270000.json"); return { reportDatetime: w.reportDatetime || null, headline: w.headlineText || "" }; }
async function fromCams() { const url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=34.69&longitude=135.50&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust&past_days=7&forecast_days=4&timezone=Asia%2FTokyo";
  const j = await getJSON(url, { ua: BOT }); const h = j.hourly; if (!h || !h.time) throw new Error("no hourly data"); const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  const no2 = h.nitrogen_dioxide.map((x) => (x == null ? null : x / 1.88)), o3 = h.ozone.map((x) => (x == null ? null : x / 1.96));
  return { source: "Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo", times: h.time.map((t) => new Date(t + ":00+09:00").toISOString()), pm25: h.pm2_5.map(r1), pm10: h.pm10.map(r1), dust: h.dust.map(r1),
    no2ppb: no2.map(r1), oxppb: o3.map((x, i) => (x == null || no2[i] == null ? null : r1(x + no2[i]))), so2ppb: (h.sulphur_dioxide || []).map((x) => (x == null ? null : r1(x / 2.62))), coppm: (h.carbon_monoxide || []).map((x) => (x == null ? null : Math.round(x / 11.45) / 100)) }; }
async function fromWikidata() {
  const q = `SELECT ?item ?code ?ja ?en ?pop ?date ?coord WHERE { ?item wdt:P429 ?code . FILTER(STRSTARTS(STR(?code), "27")) FILTER NOT EXISTS { ?item wdt:P576 ?d }
  ?item p:P1082 ?ps . ?ps ps:P1082 ?pop . OPTIONAL { ?ps pq:P585 ?date } OPTIONAL { ?item wdt:P625 ?coord } OPTIONAL { ?item rdfs:label ?ja FILTER(LANG(?ja)="ja") } OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en)="en") } }`;
  const j = await getJSON("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(q), { ua: BOT, timeout: 90000 }); const by = new Map();
  for (const b of j.results.bindings) { const code = String(b.code.value).replace(/\D/g, "").slice(0, 5); if (code.length < 5) continue; const date = b.date ? b.date.value.slice(0, 10) : null; if (date && +date.slice(0, 4) < 2010) continue;
    const m = b.coord && b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    const rec = { code, name: b.ja ? b.ja.value : "", nameEn: b.en ? b.en.value : "", pop: Math.round(+b.pop.value), date, lat: m ? +m[2] : null, lon: m ? +m[1] : null };
    const o = by.get(code); if (!o || (rec.date || "") > (o.date || "")) by.set(code, rec); }
  let munis = [...by.values()].filter((m) => m.lat != null && m.pop > 0); const n = (m) => +m.code;
  const ow = munis.some((m) => n(m) >= 27102 && n(m) <= 27128), sw = munis.some((m) => n(m) >= 27141 && n(m) <= 27147);
  munis = munis.filter((m) => m.code !== "27000" && !(ow && m.code === "27100") && !(sw && m.code === "27140"));
  munis.forEach((m) => { if (n(m) >= 27102 && n(m) <= 27128 && !m.name.startsWith("大阪市")) m.name = "大阪市" + m.name; if (n(m) >= 27141 && n(m) <= 27147 && !m.name.startsWith("堺市")) m.name = "堺市" + m.name; });
  if (munis.length < 20) throw new Error(`only ${munis.length} municipalities`); return { source: "Wikidata", total: munis.reduce((a, m) => a + m.pop, 0), munis }; }
async function fromOverpass() { const q = `[out:json][timeout:120];area["ISO3166-2"="JP-27"][admin_level=4]->.a;(nwr["amenity"="hospital"](area.a);nwr["amenity"="school"](area.a););out center tags;`;
  let j = null, last = null; for (const ep of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) { try { j = await getJSON(ep + "?data=" + encodeURIComponent(q), { ua: BOT, timeout: 150000 }); break; } catch (e) { last = e; } }
  if (!j) throw last || new Error("Overpass failed"); const hospitals = [], schools = [];
  for (const e of j.elements || []) { const lat = e.lat ?? (e.center && e.center.lat), lon = e.lon ?? (e.center && e.center.lon); if (lat == null) continue; const t = e.tags || {};
    (t.amenity === "hospital" ? hospitals : schools).push({ n: t.name || "", ne: t["name:en"] || "", lat: +lat.toFixed(5), lon: +lon.toFixed(5) }); }
  if (hospitals.length < 5) throw new Error("too few hospitals"); return { hospitals, schools }; }
const US_PM25 = [[0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500]];
function aqiToPm25(a) { if (a == null || !isFinite(a)) return null; for (const [cl, ch, il, ih] of US_PM25) if (a >= il && a <= ih) return Math.round(((ch - cl) / (ih - il) * (a - il) + cl) * 10) / 10; return null; }
async function fromAqicn() { const token = process.env.WAQI_TOKEN; if (!token) throw new Error("WAQI_TOKEN secret not set");
  const res = await getJSON(`https://api.waqi.info/v2/map/bounds?latlng=34.27,135.09,35.05,135.75&networks=all&token=${token}`); if (res.status !== "ok") throw new Error("AQICN: " + JSON.stringify(res.data));
  const list = []; for (const s of res.data.slice(0, 40)) { try { const f = await getJSON(`https://api.waqi.info/feed/@${s.uid}/?token=${token}`); if (f.status !== "ok") continue; const iq = f.data.iaqi || {};
      list.push({ id: "waqi-" + s.uid, name: (f.data.city && f.data.city.name) || String(s.uid), address: "", city: "", type: "", lat: s.lat, lon: s.lon, obsTime: f.data.time && f.data.time.iso ? new Date(f.data.time.iso).toISOString() : null, pm25: aqiToPm25(iq.pm25 && iq.pm25.v) }); await sleep(200); } catch {} }
  if (list.filter((s) => s.pm25 != null).length < 3) throw new Error("AQICN: too few stations"); return list; }
const avg = (a) => { const v = a.filter((x) => x != null); return v.length ? Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 1000) / 1000 : null; };
async function main() {
  await mkdir(DIR, { recursive: true }); const prev = await readJ("latest.json"); const status = {};
  const hm = histToMap(await readJ("history.json")); const prevLast = [...hm.keys()].sort().pop() || null;
  const meta = {}; for (const s of (prev && prev.stations) || []) if (!String(s.id).startsWith("waqi")) meta[s.id] = { id: s.id, name: s.name, address: s.address, city: s.city, type: s.type };
  let newest = null;
  function ingest(rows, endMs) { const iso = new Date(endMs).toISOString(); for (const r of rows) { meta[r.id] = { ...(meta[r.id] || {}), id: r.id, name: r.name, address: r.address, city: r.city, type: r.type }; putHist(hm, iso, r.id, r.vals); } }
  try { for (const e of await latestEnds()) { try { const rows = await noudoAll(e); if (rows.length >= 5) { newest = e; ingest(rows, e); status.soramame = { ok: true, stations: rows.length }; break; } } catch (err) { log("noudoAll", new Date(e).toISOString(), err.message); } }
    if (!newest) throw new Error("no recent Soramame file found"); for (let k = 1; k <= 2; k++) { try { ingest(await noudoAll(newest - k * 3600e3), newest - k * 3600e3); } catch {} }
  } catch (e) { status.soramame = { ok: false, msg: e.message }; log(e.message); }
  if (newest) { const gapH = prevLast ? (newest - Date.parse(prevLast)) / 3600e3 : 999; const count = (c) => { let n = 0; hm.forEach((row) => { if (row.has(c)) n++; }); return n; };
    const codes = Object.keys(meta), full = process.env.FORCE_BOOTSTRAP === "1" || hm.size < 72 || gapH > 3, list = full ? codes : codes.filter((c) => count(c) < 48).slice(0, 15); let ok = 0;
    for (const c of list) { try { parse7day(await getCSV(`https://soramame.env.go.jp/data/sokutei/NoudoTime/${c}/7day.csv`)).forEach(([iso, v]) => { if (Date.parse(iso) <= newest) putHist(hm, iso, c, v); }); ok++; } catch (e) { log("7day", c, e.message); } await sleep(PAUSE); }
    status.history = { ok: ok > 0 || !list.length, bootstrap: full, stationsFetched: ok, requested: list.length }; }
  try { const n = await addCoords(meta); status.geocode = { ok: true, newlyLocated: n, located: Object.values(meta).filter((s) => s.lat != null).length, of: Object.keys(meta).length }; } catch (e) { status.geocode = { ok: false, msg: e.message }; }
  let stations = [], mode = "official", stale = false, observedAt = null;
  if (newest) { observedAt = new Date(newest).toISOString(); const times = [...hm.keys()].filter((t) => Date.parse(t) <= newest && Date.parse(t) > newest - 3 * 3600e3).sort().reverse();
    for (const s of Object.values(meta)) { if (s.lat == null) continue; const cur = {}; let t0 = null;
      for (const t of times) { const r = hm.get(t).get(s.id); if (!r) continue; for (const k of HV) if (cur[k] == null && r[k] != null) { cur[k] = r[k]; if (!t0) t0 = t; } }
      if (!Object.keys(cur).length) continue; stations.push({ ...s, ...cur, obsTime: t0 }); } }
  if (stations.length < 5 && !SAMPLE) { try { stations = await fromAqicn(); mode = "aqicn"; observedAt = stations.map((s) => s.obsTime).filter(Boolean).sort().pop() || null; status.aqicn = { ok: true, stations: stations.length }; } catch (e) { status.aqicn = { ok: false, msg: e.message }; } }
  if (stations.length < 5 && prev && prev.stations && prev.stations.length) { stations = prev.stations; mode = prev.mode; observedAt = prev.observedAt; stale = true; }
  if (SAMPLE) mode = "sample";
  let weather = prev ? prev.weather : null, jmaForecast = prev ? prev.jmaForecast : null, warnings = prev ? prev.warnings : null;
  try { weather = await fromAmedas(); status.amedas = { ok: true, stations: weather.stations.length }; } catch (e) { status.amedas = { ok: false, msg: e.message }; }
  try { jmaForecast = await fromJmaForecast(); status.jmaForecast = { ok: true }; } catch (e) { status.jmaForecast = { ok: false, msg: e.message }; }
  try { warnings = await fromJmaWarnings(); status.jmaWarnings = { ok: true }; } catch (e) { status.jmaWarnings = { ok: false, msg: e.message }; }
  let forecast = await readJ("forecast.json"); try { forecast = await fromCams(); await writeJ("forecast.json", forecast); status.cams = { ok: true }; } catch (e) { status.cams = { ok: false, msg: e.message }; }
  const ctx = (await readJ("context.json")) || {}; const due = (t) => !t || Date.now() - Date.parse(t) > WEEK;
  if (due(ctx.populationAt) || !ctx.population) { try { ctx.population = await fromWikidata(); ctx.populationAt = new Date().toISOString(); status.population = { ok: true, munis: ctx.population.munis.length }; } catch (e) { status.population = { ok: false, msg: e.message }; } }
  else status.population = { ok: true, cached: true };
  if (due(ctx.facilitiesAt) || !ctx.hospitals) { try { Object.assign(ctx, await fromOverpass()); ctx.facilitiesAt = new Date().toISOString(); status.facilities = { ok: true, hospitals: ctx.hospitals.length }; } catch (e) { status.facilities = { ok: false, msg: e.message }; } }
  else status.facilities = { ok: true, cached: true };
  await writeJ("context.json", ctx);
  let history = await readJ("history.json"); if (newest) { history = mapToHist(hm, new Date(newest).toISOString()); await writeJ("history.json", history); }
  const trend = new Map(((prev && prev.trend) || []).map((p) => [p.t, p]));
  hm.forEach((row, t) => { const vals = [...row.values()]; const p = { t }; for (const k of ["pm25", "no2", "ox", "spm"]) p[k] = avg(vals.map((v) => v[k])); trend.set(t, p); });
  const out = { generatedAt: new Date().toISOString(), mode: stations.length ? mode : "sample", stale, observedAt, status, stations, weather, jmaForecast, warnings, trend: [...trend.values()].sort((a, b) => (a.t < b.t ? -1 : 1)).slice(-TREND_H) };
  await writeJ("latest.json", out);
  const key = SAMPLE ? "__OSAKA_SAMPLE" : "__OSAKA_LIVE";
  await writeFile(F(SAMPLE ? "sample.js" : "live.js"), "window." + key + "=" + JSON.stringify({ latest: out, history, forecast, context: ctx }) + ";\n");
  log(`RESULT mode=${out.mode} stations=${stations.length} history=${hm.size}h stale=${stale} observedAt=${observedAt}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
