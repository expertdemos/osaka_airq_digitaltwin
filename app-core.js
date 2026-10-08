"use strict";
/* Osaka Air Quality Digital Twin - Art of the Possible - core (v12)
   Four data options:
     Official  - Ministry of the Environment stations, collected every 30 min by the GitHub Action (needs deployment)
     Blended   - official stations + Open-Meteo model points in gaps and for the forecast (falls back to Open-Meteo on desktop)
     Open-Meteo- European Copernicus (CAMS) model, fetched live in the browser; works from a desktop file
     Sample    - built-in snapshot, works offline */

/* ================= STATE & LANGUAGE ================= */
const SC0 = { ev: 0, heavy: 0, shift: 0, lez: false, port: 0, green: 0, wx: "obs", kosa: 0 };
const IS_FILE = location.protocol === "file:";
const state = { lang: "en", view: "blend", autoSample: false, note: null, screen: "home", area: "all", pol: "pm25", basemap: "esrigray", surfaceOpacity: .38,
  showSurface: true, showStations: true, showWind: true, showHosp: false, selected: null, tIdx: null, tPlaying: false,
  sc: Object.assign({}, SC0), preset: null, scenView: "side", zoom: 1, loaded: false, mapViews: {}, liveFile: null };
try { const o = JSON.parse(localStorage.getItem("osaka.twin.v12") || "{}"); ["lang", "view", "pol", "area", "basemap", "scenView"].forEach((k) => { if (o[k] != null) state[k] = o[k]; }); if (o.sc) state.sc = Object.assign({}, SC0, o.sc); } catch (e) {}
if (!["live", "blend", "om", "sample"].includes(state.view)) state.view = "blend";
function save() { try { localStorage.setItem("osaka.twin.v12", JSON.stringify({ lang: state.lang, view: state.view, pol: state.pol, area: state.area, basemap: state.basemap, scenView: state.scenView, sc: state.sc })); } catch (e) {} }
const tx = (en, ja) => (state.lang === "ja" ? ja : en);
const tr = (o) => (o == null ? "" : typeof o === "string" ? o : state.lang === "ja" ? (o.ja != null ? o.ja : o.en) : (o.en != null ? o.en : o.ja));
function esc(s) { return (s == null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* ================= ICONS & LOGO ================= */
const ICONS = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  map: '<polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21"/><line x1="8" y1="3" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="21"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>', search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
  layers: '<polygon points="12 2 22 8.5 12 15 2 8.5"/><polyline points="2 15.5 12 22 22 15.5"/>',
  wind: '<path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/><path d="M17.7 7.5A2.5 2.5 0 1 1 19.5 12H2"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
  beaker: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><line x1="7" y1="15" x2="17" y2="15"/>',
  factory: '<path d="M3 21V9l6 4V9l6 4V5l6 3v13z"/><line x1="3" y1="21" x2="21" y2="21"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>', x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  trend: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>',
  school: '<path d="M3 10l9-5 9 5-9 5-9-5z"/><path d="M7 12.5V17c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5"/>', shield: '<path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5z"/>',
  car: '<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="16" r="1"/><circle cx="16.5" cy="16" r="1"/>',
  truck: '<rect x="1" y="6" width="14" height="10"/><path d="M15 9h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  dust: '<path d="M3 8h13a3 3 0 1 0-3-3"/><path d="M2 13h17a3 3 0 1 1-3 3"/><path d="M4 18h9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  play: '<polygon points="6 4 19 12 6 20"/>', pause: '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',
  ship: '<path d="M3 18l1.5-6h15L21 18a5 5 0 0 1-4 2H7a5 5 0 0 1-4-2z"/><path d="M12 12V5"/><path d="M8 8h8"/>',
  gauge: '<path d="M12 21a9 9 0 1 1 9-9"/><line x1="12" y1="12" x2="17" y2="8"/>', pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  scales: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7 2 14h6z"/><path d="M19 7l-3 7h6z"/><path d="M8 21h8"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  sat: '<path d="M12 9 9 12l-4-4 3-3z"/><path d="M15 12l3-3 3 3-3 3z"/><path d="M9 12l3 3-3 3-3-3z"/><path d="M14 14l4 4"/>',
  flask: '<path d="M10 2v7L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-10V2"/><line x1="8" y1="2" x2="16" y2="2"/>',
  merge: '<path d="M6 3v6a4 4 0 0 0 4 4h8"/><path d="M6 21v-6"/><polyline points="15 10 19 13 15 16"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  hosp: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>' };
function icon(n, c) { return '<svg class="ic ' + (c || "") + '" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[n] || "") + "</svg>"; }
/* Same composition as the Qatar twin, in Japanese colours: 藍 indigo wave, 浅葱 asagi wave, 日の丸 red sun */
const LOGO = '<svg class="glyph" viewBox="0 0 40 40" fill="none" aria-label="Osaka Air Quality Twin"><circle cx="20" cy="20" r="19" fill="#F3F5FA" stroke="#DCE4F0"/>'
  + '<path d="M5 26 Q13 17 20 24 Q27 31 35 19" stroke="#1B365D" stroke-width="2.7" fill="none" stroke-linecap="round"/>'
  + '<path d="M6 31 Q14 24 21 29 Q28 34 34 27" stroke="#00A3AF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".9"/>'
  + '<circle cx="28" cy="12" r="4" fill="#BC002D"/></svg>';

/* ================= POLLUTANTS, STANDARDS & LEVELS ================= */
const POLS = {
  pm25: { label: "PM2.5", unit: "µg/m³", dp: 1, th: [15, 35, 50, 70], std: 35, stdKind: "day", who: 15,
    name: { en: "Fine particles", ja: "微小粒子状物質" }, note: { en: "Standard: daily mean ≤ 35 µg/m³, annual ≤ 15", ja: "環境基準：日平均 35 µg/m³ 以下・年平均 15 以下" } },
  no2: { label: "NO₂", unit: "ppb", dp: 0, th: [20, 40, 60, 100], std: 60, stdKind: "day", who: 13.3,
    name: { en: "Nitrogen dioxide (traffic, combustion)", ja: "二酸化窒素（交通・燃焼）" }, note: { en: "Standard: daily mean within or below the 40–60 ppb zone", ja: "環境基準：日平均 0.04〜0.06 ppm のゾーン内又はそれ以下" } },
  ox: { label: "Ox", unit: "ppb", dp: 0, th: [40, 60, 120, 240], std: 60, stdKind: "hour", who: 51,
    name: { en: "Photochemical oxidants (mostly ozone)", ja: "光化学オキシダント（主にオゾン）" }, note: { en: "Standard: hourly ≤ 60 ppb · advisory 120 · warning 240", ja: "環境基準：1時間値 60 ppb 以下・注意報 120・警報 240" } },
  so2: { label: "SO₂", unit: "ppb", dp: 1, th: [10, 40, 100, 200], std: 40, stdKind: "day", who: 15.3,
    name: { en: "Sulphur dioxide (ships, industry)", ja: "二酸化硫黄（船舶・工場）" }, note: { en: "Standard: daily mean ≤ 40 ppb, hourly ≤ 100 ppb", ja: "環境基準：日平均 0.04 ppm 以下・1時間値 0.1 ppm 以下" } },
  co: { label: "CO", unit: "ppm", dp: 1, th: [1, 5, 10, 20], std: 10, stdKind: "day", who: 3.5,
    name: { en: "Carbon monoxide (combustion, traffic)", ja: "一酸化炭素（燃焼・交通）" }, note: { en: "Standard: daily mean ≤ 10 ppm, 8-hour mean ≤ 20 ppm", ja: "環境基準：日平均 10 ppm 以下・8時間平均 20 ppm 以下" } },
  spm: { label: "SPM", unit: "mg/m³", dp: 3, th: [0.05, 0.10, 0.20, 0.40], std: 0.10, stdKind: "day", who: null,
    name: { en: "Suspended particles (includes Asian dust, kōsa)", ja: "浮遊粒子状物質（黄砂を含む）" }, note: { en: "Standard: daily mean ≤ 0.10 mg/m³, hourly ≤ 0.20", ja: "環境基準：日平均 0.10 mg/m³ 以下・1時間値 0.20 以下" } } };
const POL_NAMES = {
  pm25: [{ en: "fine particles", ja: "微小粒子" }, { en: "Fine particulate matter, 2.5 micrometres or smaller (smoke, exhaust, secondary particles)", ja: "微小粒子状物質（粒径2.5µm以下：煙・排気・二次生成粒子）" }],
  no2: [{ en: "nitrogen dioxide", ja: "二酸化窒素" }, { en: "Nitrogen dioxide — mainly road traffic and combustion", ja: "二酸化窒素 — 主に道路交通・燃焼" }],
  ox: [{ en: "oxidants", ja: "オキシダント" }, { en: "Photochemical oxidants (primarily ozone) — formed in sunlight; cause of photochemical smog", ja: "光化学オキシダント（主にオゾン）— 日射により生成、光化学スモッグの原因" }],
  so2: [{ en: "sulphur dioxide", ja: "二酸化硫黄" }, { en: "Sulphur dioxide — ships, port and heavy industry burning sulphur-containing fuel", ja: "二酸化硫黄 — 船舶・港湾・重工業の含硫燃料燃焼" }],
  co: [{ en: "carbon monoxide", ja: "一酸化炭素" }, { en: "Carbon monoxide — incomplete combustion, mostly vehicles", ja: "一酸化炭素 — 不完全燃焼（主に自動車）" }],
  spm: [{ en: "suspended particles", ja: "浮遊粒子" }, { en: "Suspended particulate matter, 10 micrometres or smaller — Japan's coarse-particle measure; includes Asian dust (kōsa, 黄砂) blown from continental Asia", ja: "浮遊粒子状物質（粒径10µm以下）— 日本の粗大粒子指標、黄砂を含む" }] };
Object.keys(POL_NAMES).forEach((k) => { POLS[k].short = POL_NAMES[k][0]; POLS[k].full = POL_NAMES[k][1]; });
const RAMP = ["#0F9D6B", "#8DBF4A", "#E0A21B", "#E0602A", "#8E2C8E"];
const BANDN = [{ en: "Good", ja: "良好" }, { en: "Fair", ja: "やや高め" }, { en: "Above standard", ja: "基準超過" }, { en: "High", ja: "高い" }, { en: "Very high", ja: "非常に高い" }];
const BANDN_OX = [{ en: "Good", ja: "良好" }, { en: "Fair", ja: "やや高め" }, { en: "Above standard", ja: "基準超過" }, { en: "Advisory level", ja: "注意報レベル" }, { en: "Warning level", ja: "警報レベル" }];
function bandOf(pol, v) { if (v == null || !isFinite(v)) return { i: -1, hex: "#9AA3B2", name: "–" }; const t = POLS[pol].th; let i = 0; while (i < 4 && v > t[i]) i++; return { i, hex: RAMP[i], name: tr((pol === "ox" ? BANDN_OX : BANDN)[i]) }; }
function fmt(pol, v) { if (v == null || !isFinite(v)) return "–"; const d = POLS[pol].dp; return d ? v.toFixed(d) : String(Math.round(v)); }
const U = (pol) => POLS[pol].unit;

/* ================= REAL ADMINISTRATIVE NAMES ================= */
const MUNI = [["大阪狭山市", "Osakasayama"], ["河内長野市", "Kawachinagano"], ["千早赤阪村", "Chihayaakasaka"], ["東大阪市", "Higashiosaka"], ["四條畷市", "Shijonawate"], ["岸和田市", "Kishiwada"], ["豊中市", "Toyonaka"], ["池田市", "Ikeda"], ["吹田市", "Suita"], ["泉大津市", "Izumiotsu"], ["高槻市", "Takatsuki"], ["貝塚市", "Kaizuka"], ["守口市", "Moriguchi"], ["枚方市", "Hirakata"], ["茨木市", "Ibaraki"], ["八尾市", "Yao"], ["泉佐野市", "Izumisano"], ["富田林市", "Tondabayashi"], ["寝屋川市", "Neyagawa"], ["松原市", "Matsubara"], ["大東市", "Daito"], ["和泉市", "Izumi"], ["箕面市", "Minoh"], ["柏原市", "Kashiwara"], ["羽曳野市", "Habikino"], ["門真市", "Kadoma"], ["摂津市", "Settsu"], ["高石市", "Takaishi"], ["藤井寺市", "Fujiidera"], ["泉南市", "Sennan"], ["交野市", "Katano"], ["阪南市", "Hannan"], ["島本町", "Shimamoto"], ["豊能町", "Toyono"], ["能勢町", "Nose"], ["忠岡町", "Tadaoka"], ["熊取町", "Kumatori"], ["田尻町", "Tajiri"], ["岬町", "Misaki"], ["太子町", "Taishi"], ["河南町", "Kanan"]];
const OWARD = [["東住吉区", "Higashisumiyoshi"], ["西淀川区", "Nishiyodogawa"], ["東淀川区", "Higashiyodogawa"], ["住之江区", "Suminoe"], ["天王寺区", "Tennoji"], ["都島区", "Miyakojima"], ["福島区", "Fukushima"], ["此花区", "Konohana"], ["淀川区", "Yodogawa"], ["東成区", "Higashinari"], ["阿倍野区", "Abeno"], ["住吉区", "Sumiyoshi"], ["西成区", "Nishinari"], ["浪速区", "Naniwa"], ["大正区", "Taisho"], ["中央区", "Chuo"], ["生野区", "Ikuno"], ["城東区", "Joto"], ["鶴見区", "Tsurumi"], ["平野区", "Hirano"], ["西区", "Nishi"], ["港区", "Minato"], ["旭区", "Asahi"], ["北区", "Kita"]];
const SWARD = [["美原区", "Mihara"], ["堺区", "Sakai-ku"], ["中区", "Naka"], ["東区", "Higashi"], ["西区", "Nishi"], ["南区", "Minami"], ["北区", "Kita"]];
function muniOf(key) {
  key = key || "";
  if (key.includes("大阪市")) { for (const [j, e] of OWARD) if (key.includes(j)) return { ja: "大阪市" + j, en: e + ", Osaka City" }; return { ja: "大阪市", en: "Osaka City" }; }
  if (key.includes("堺市")) { for (const [j, e] of SWARD) if (key.includes(j)) return { ja: "堺市" + j, en: e + ", Sakai" }; return { ja: "堺市", en: "Sakai" }; }
  for (const [j, e] of MUNI) if (key.includes(j)) return { ja: j, en: e };
  return { ja: "", en: "" };
}
const AREAS = [
  { k: "all", en: "Osaka Prefecture", ja: "大阪府全域", m: null },
  { k: "osaka", en: "Osaka City", ja: "大阪市", m: ["大阪市"] },
  { k: "bay", en: "Bay coast & port", ja: "湾岸・港湾部", m: ["大阪市此花区", "大阪市港区", "大阪市大正区", "大阪市住之江区", "大阪市西淀川区", "堺市西区", "堺市堺区", "高石市", "泉大津市", "忠岡町"] },
  { k: "north", en: "Northern Osaka (Hokusetsu)", ja: "北大阪（北摂）", m: ["豊中市", "池田市", "吹田市", "高槻市", "茨木市", "箕面市", "摂津市", "島本町", "豊能町", "能勢町"] },
  { k: "east", en: "Eastern Osaka (Kawachi)", ja: "東部大阪（河内）", m: ["枚方市", "寝屋川市", "守口市", "門真市", "大東市", "四條畷市", "交野市", "東大阪市", "八尾市", "柏原市"] },
  { k: "sakai", en: "Sakai City", ja: "堺市", m: ["堺市"] },
  { k: "south", en: "Southern Kawachi", ja: "南河内", m: ["松原市", "羽曳野市", "藤井寺市", "富田林市", "河内長野市", "大阪狭山市", "太子町", "河南町", "千早赤阪村"] },
  { k: "senshu", en: "Senshu (southern coast)", ja: "泉州", m: ["和泉市", "岸和田市", "貝塚市", "泉佐野市", "泉南市", "阪南市", "熊取町", "田尻町", "岬町", "忠岡町", "泉大津市", "高石市"] }];
const AREA_BY = {}; AREAS.forEach((a) => (AREA_BY[a.k] = a));
function matchArea(muniJa, a) { if (!a.m) return true; return a.m.some((t) => muniJa === t || muniJa.startsWith(t)); }
const areaName = (k) => tr(AREA_BY[k || state.area] || AREAS[0]);

/* Open-Meteo model points: approximate municipal / ward centres (first = central Osaka) */
const OMPTS = [["大阪市北区", "Kita, Osaka City", 34.7055, 135.4983], ["大阪市中央区", "Chuo, Osaka City", 34.6813, 135.5100], ["大阪市此花区", "Konohana, Osaka City", 34.6828, 135.4526], ["大阪市港区", "Minato, Osaka City", 34.6640, 135.4610],
  ["大阪市住之江区", "Suminoe, Osaka City", 34.6100, 135.4830], ["大阪市西淀川区", "Nishiyodogawa, Osaka City", 34.7110, 135.4530], ["大阪市淀川区", "Yodogawa, Osaka City", 34.7210, 135.4850], ["大阪市天王寺区", "Tennoji, Osaka City", 34.6540, 135.5190],
  ["大阪市城東区", "Joto, Osaka City", 34.7010, 135.5450], ["大阪市平野区", "Hirano, Osaka City", 34.6210, 135.5460], ["大阪市住吉区", "Sumiyoshi, Osaka City", 34.6040, 135.5020], ["大阪市鶴見区", "Tsurumi, Osaka City", 34.7040, 135.5740],
  ["堺市堺区", "Sakai-ku, Sakai", 34.5733, 135.4830], ["堺市西区", "Nishi, Sakai", 34.5390, 135.4660], ["堺市南区", "Minami, Sakai", 34.4900, 135.4900], ["豊中市", "Toyonaka", 34.7813, 135.4697], ["吹田市", "Suita", 34.7595, 135.5168],
  ["高槻市", "Takatsuki", 34.8462, 135.6175], ["茨木市", "Ibaraki", 34.8164, 135.5686], ["枚方市", "Hirakata", 34.8144, 135.6511], ["寝屋川市", "Neyagawa", 34.7661, 135.6278], ["東大阪市", "Higashiosaka", 34.6794, 135.6008],
  ["八尾市", "Yao", 34.6269, 135.6011], ["岸和田市", "Kishiwada", 34.4606, 135.3714], ["和泉市", "Izumi", 34.4833, 135.4236], ["池田市", "Ikeda", 34.8219, 135.4286], ["箕面市", "Minoh", 34.8269, 135.4703],
  ["泉佐野市", "Izumisano", 34.4067, 135.3272], ["松原市", "Matsubara", 34.5778, 135.5519], ["河内長野市", "Kawachinagano", 34.4581, 135.5642], ["富田林市", "Tondabayashi", 34.4992, 135.5972], ["泉大津市", "Izumiotsu", 34.5047, 135.4106],
  ["高石市", "Takaishi", 34.5206, 135.4422], ["守口市", "Moriguchi", 34.7378, 135.5642], ["門真市", "Kadoma", 34.7392, 135.5872], ["柏原市", "Kashiwara", 34.5789, 135.6286], ["阪南市", "Hannan", 34.3597, 135.2394], ["能勢町", "Nose", 34.9717, 135.4144]];
/* Reference context built into the page, used when the collected context file is unavailable (e.g. opened from a desktop) */
const BUILTIN_CTX = { builtin: true, population: { total: 0, munis: [["27100", "大阪市", "Osaka City", 2752000, 34.6937, 135.5023], ["27140", "堺市", "Sakai", 826000, 34.5733, 135.4830], ["27203", "豊中市", "Toyonaka", 401000, 34.7813, 135.4697], ["27205", "吹田市", "Suita", 385000, 34.7595, 135.5168],
  ["27207", "高槻市", "Takatsuki", 348000, 34.8462, 135.6175], ["27211", "茨木市", "Ibaraki", 283000, 34.8164, 135.5686], ["27210", "枚方市", "Hirakata", 397000, 34.8144, 135.6511], ["27215", "寝屋川市", "Neyagawa", 229000, 34.7661, 135.6278],
  ["27227", "東大阪市", "Higashiosaka", 493000, 34.6794, 135.6008], ["27212", "八尾市", "Yao", 264000, 34.6269, 135.6011], ["27202", "岸和田市", "Kishiwada", 190000, 34.4606, 135.3714], ["27219", "和泉市", "Izumi", 184000, 34.4833, 135.4236],
  ["27204", "池田市", "Ikeda", 102000, 34.8219, 135.4286], ["27220", "箕面市", "Minoh", 136000, 34.8269, 135.4703], ["27213", "泉佐野市", "Izumisano", 98000, 34.4067, 135.3272], ["27217", "松原市", "Matsubara", 117000, 34.5778, 135.5519],
  ["27216", "河内長野市", "Kawachinagano", 101000, 34.4581, 135.5642], ["27214", "富田林市", "Tondabayashi", 108000, 34.4992, 135.5972], ["27206", "泉大津市", "Izumiotsu", 73000, 34.5047, 135.4106], ["27225", "高石市", "Takaishi", 56000, 34.5206, 135.4422],
  ["27209", "守口市", "Moriguchi", 143000, 34.7378, 135.5642], ["27223", "門真市", "Kadoma", 119000, 34.7392, 135.5872], ["27224", "摂津市", "Settsu", 87000, 34.7772, 135.5622], ["27221", "柏原市", "Kashiwara", 68000, 34.5789, 135.6286],
  ["27208", "貝塚市", "Kaizuka", 84000, 34.4378, 135.3589], ["27232", "阪南市", "Hannan", 52000, 34.3597, 135.2394]].map((m) => ({ code: m[0], name: m[1], nameEn: m[2], pop: m[3], lat: m[4], lon: m[5], date: "2020" })) },
  hospitals: [["大阪大学医学部附属病院", "Osaka University Hospital", 34.8195, 135.5250], ["大阪公立大学医学部附属病院", "Osaka Metropolitan University Hospital", 34.6441, 135.5117], ["大阪赤十字病院", "Osaka Red Cross Hospital", 34.6604, 135.5238],
    ["大阪急性期・総合医療センター", "Osaka General Medical Center", 34.6076, 135.5046], ["関西医科大学附属病院", "Kansai Medical University Hospital", 34.8106, 135.6395], ["堺市立総合医療センター", "Sakai City Medical Center", 34.5557, 135.4640], ["りんくう総合医療センター", "Rinku General Medical Center", 34.4117, 135.3000]].map((h) => ({ n: h[0], ne: h[1], lat: h[2], lon: h[3] })),
  schools: [] };

/* ================= NUMBERS & GEOMETRY ================= */
const mean = (a) => { const v = a.filter((x) => x != null && isFinite(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
function quantile(a, q) { const v = a.filter((x) => x != null).sort((x, y) => x - y); if (!v.length) return null; const p = (v.length - 1) * q, lo = Math.floor(p); return v[lo] + (v[Math.min(lo + 1, v.length - 1)] - v[lo]) * (p - lo); }
function km(a, b) { return Math.hypot((a.lat - b.lat) * 111.0, (a.lon - b.lon) * 91.3); }
const LEZ = [{ lat: 34.7025, lon: 135.4959 }, { lat: 34.6660, lon: 135.5010 }];
function distToLEZ(p) { const a = LEZ[0], b = LEZ[1]; const ax = (a.lon - p.lon) * 91.3, ay = (a.lat - p.lat) * 111, bx = (b.lon - p.lon) * 91.3, by = (b.lat - p.lat) * 111;
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))); return Math.hypot(ax + t * dx, ay + t * dy); }
function compass(d) { if (d == null) return "–"; if (d < 0) return tx("calm", "静穏"); const en = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"], ja = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"]; const i = Math.round(d / 22.5) % 16; return state.lang === "ja" ? ja[i] : en[i]; }
function fmtT(iso, withDate) { if (!iso) return "–"; const d = new Date(iso); const o = { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }; if (withDate !== false) { o.month = "short"; o.day = "numeric"; } return d.toLocaleString(state.lang === "ja" ? "ja-JP" : "en-GB", o) + " JST"; }
function fmtDH(iso) { if (!iso) return "–"; const d = new Date(iso); return d.toLocaleString(state.lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo", weekday: "short", hour: "2-digit", minute: "2-digit" }); }
const jstHour = (iso) => new Date(Date.parse(iso) + 9 * 3600e3).getUTCHours();
const jstDow = (iso) => new Date(Date.parse(iso) + 9 * 3600e3).getUTCDay();
const nf = (n) => (n == null ? "–" : Math.round(n).toLocaleString(state.lang === "ja" ? "ja-JP" : "en-GB"));
const r1 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 10) / 10);

/* ================= DATA LOADING ================= */
const D = { latest: null, hist: null, fc: null, ctx: null, stations: [], times: [], H: {}, axis: [], munis: [], hosp: [], schools: [], amedas: [], modelOnly: false, blend: false };
let CACHE = {};
async function getJ(u) { if (IS_FILE) return null; try { const r = await fetch(u + "?ts=" + Date.now(), { cache: "no-store" }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
function viaScript(src, key, fresh) { if (fresh) delete window[key]; if (window[key]) return Promise.resolve(window[key]);
  return new Promise((res) => { const s = document.createElement("script"); s.src = src + (fresh ? "?ts=" + Date.now() : ""); s.onload = () => res(window[key] || null); s.onerror = () => res(null); document.head.appendChild(s); }); }
async function loadBundle(dir, live) {
  let files = [null, null, null, null];
  if (!IS_FILE) files = await Promise.all(["latest", "history", "forecast", "context"].map((n) => getJ(dir + n + ".json")));
  if (!files[0]) { const b = await viaScript(dir + (live ? "live.js" : "sample.js"), live ? "__OSAKA_LIVE" : "__OSAKA_SAMPLE", live); if (b) files = [b.latest, b.history, b.forecast, b.context]; }
  return files;
}
function liveUsable(l) { if (!l || !Array.isArray(l.stations) || l.stations.filter((s) => s.lat != null).length < 5 || l.mode === "sample") return false; const t = Date.parse(l.observedAt || l.generatedAt || 0); return isFinite(t) && Date.now() - t < 6 * 3600e3; }

/* Open-Meteo (European CAMS model), fetched directly by the browser */
let OM_CACHE = null, OM_ERR = null;
async function fetchOM() {
  if (OM_CACHE && Date.now() - OM_CACHE.at < 25 * 60e3) return OM_CACHE.v;
  const v = await fetchOMRaw(); if (v) OM_CACHE = { at: Date.now(), v }; else if (OM_CACHE) return OM_CACHE.v; return v;
}
async function fetchOMRaw() {
  OM_ERR = null;
  try {
    const lat = OMPTS.map((p) => p[2]).join(","), lon = OMPTS.map((p) => p[3]).join(",");
    const [a, w] = await Promise.all([
      fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=" + lat + "&longitude=" + lon + "&hourly=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,dust&past_days=7&forecast_days=4&timezone=Asia%2FTokyo"),
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&hourly=wind_speed_10m,wind_direction_10m&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation&wind_speed_unit=ms&past_days=7&forecast_days=4&timezone=Asia%2FTokyo")]);
    if (!a.ok) { OM_ERR = a.status === 429 ? "rate" : "http"; throw new Error("Open-Meteo HTTP " + a.status); }
    let aq = await a.json(), wx = w.ok ? await w.json() : null; if (!Array.isArray(aq)) aq = [aq]; if (wx && !Array.isArray(wx)) wx = [wx];
    const times = aq[0].hourly.time.map((t) => new Date(t + ":00+09:00").toISOString()), now = Date.now();
    let nowI = 0; times.forEach((t, i) => { if (Date.parse(t) <= now) nowI = i; });
    const h0 = Math.max(0, nowI - 167), histT = times.slice(h0, nowI + 1), st = {}, stations = [], per = [];
    OMPTS.forEach((p, i) => { const h = aq[i] && aq[i].hourly; if (!h) return; const hw = wx && wx[i] && wx[i].hourly;
      const no2 = h.nitrogen_dioxide.map((x) => (x == null ? null : x / 1.88)), ox = h.ozone.map((x, k) => (x == null || no2[k] == null ? null : x / 1.96 + no2[k]));
      const so2 = (h.sulphur_dioxide || []).map((x) => (x == null ? null : r1(x / 2.62))), co = (h.carbon_monoxide || []).map((x) => (x == null ? null : Math.round(x / 114.5) / 10));
      const s = { pm25: h.pm2_5.map(r1), no2: no2.map(r1), ox: ox.map(r1), so2, co, spm: h.pm10.map((x) => (x == null ? null : Math.round(x) / 1000)), wd: hw ? hw.wind_direction_10m : null, ws: hw ? hw.wind_speed_10m.map(r1) : null };
      per.push({ p, s, h }); const id = "om-" + i;
      st[id] = { pm25: s.pm25.slice(h0, nowI + 1), no2: s.no2.slice(h0, nowI + 1), ox: s.ox.slice(h0, nowI + 1), so2: s.so2.slice(h0, nowI + 1), co: s.co.slice(h0, nowI + 1), spm: s.spm.slice(h0, nowI + 1) };
      if (s.wd) { st[id].wd = s.wd.slice(h0, nowI + 1); st[id].ws = s.ws.slice(h0, nowI + 1); }
      stations.push({ id, name: p[0], nameEn: p[1], city: p[0], address: p[0], type: "モデル点", model: true, lat: p[2], lon: p[3], pm25: s.pm25[nowI], no2: s.no2[nowI], ox: s.ox[nowI], so2: s.so2[nowI], co: s.co[nowI], spm: s.spm[nowI], wd: s.wd ? s.wd[nowI] : null, ws: s.ws ? s.ws[nowI] : null, obsTime: times[nowI] }); });
    if (stations.length < 5) throw new Error("too few Open-Meteo points");
    const avgT = (f) => times.map((_, k) => r1(mean(per.map((o) => f(o, k)))));
    const fc = { source: "Open-Meteo (CAMS)", times, pm25: avgT((o, k) => o.h.pm2_5[k]), pm10: avgT((o, k) => o.h.pm10[k]), dust: avgT((o, k) => o.h.dust[k]), no2ppb: avgT((o, k) => o.s.no2[k]), oxppb: avgT((o, k) => o.s.ox[k]), so2ppb: avgT((o, k) => o.s.so2[k]), coppm: times.map((_, k) => { const v = mean(per.map((o) => o.s.co[k])); return v == null ? null : Math.round(v * 100) / 100; }) };
    const wst = wx ? OMPTS.map((p, i) => { const c = wx[i] && wx[i].current; if (!c || i % 3) return null; return { code: i === 0 ? "om-c" : "om" + i, name: p[0], nameEn: p[1], lat: p[2], lon: p[3], temp: c.temperature_2m, hum: c.relative_humidity_2m, ws: r1(c.wind_speed_10m), wd: c.wind_direction_10m, prec: c.precipitation }; }).filter(Boolean) : [];
    return { latest: { generatedAt: new Date().toISOString(), mode: "openmeteo", observedAt: times[nowI], stations, weather: { time: new Date().toISOString(), src: "om", stations: wst }, jmaForecast: null, warnings: null, status: {} }, hist: { times: histT, st }, fc };
  } catch (e) { if (!OM_ERR) OM_ERR = "net"; console.warn("Open-Meteo", e); return null; }
}
function mergeBlend(files, om) {
  const [l, h] = files, off = l.stations.filter((s) => s.lat != null);
  const idx = {}; om.hist.times.forEach((t, i) => (idx[t] = i));
  om.latest.stations.forEach((p) => { if (off.some((s) => km(s, p) < 6)) return;
    l.stations.push(Object.assign({}, p, { obsTime: p.obsTime }));
    const src = om.hist.st[p.id], o = {}; ["pm25", "no2", "ox", "so2", "co", "spm", "wd", "ws"].forEach((k) => { if (src[k]) o[k] = h.times.map((t) => { const i = idx[t]; return i == null ? null : src[k][i]; }); }); h.st[p.id] = o; });
  files[2] = om.fc;
  if (!l.weather || !l.weather.stations || !l.weather.stations.length) l.weather = om.latest.weather;
}
async function loadData() {
  const v = state.view; let files = null, note = null, modelOnly = false, blend = false, auto = false;
  if (v === "live" || v === "blend") { files = await loadBundle("data/", true); state.liveFile = files[0]; if (!liveUsable(files[0])) files = null; }
  if (v === "live" && !files) note = "nolive";
  if (v === "om" || ((v === "blend" || v === "live") && !files)) { const om = await fetchOM(); if (om) { files = [om.latest, om.hist, om.fc, null]; modelOnly = true; if (v === "blend") note = "blend-om"; } else { note = v === "live" ? "nolive" : "omfail"; auto = true; } }
  else if (v === "blend" && files) { const om = await fetchOM(); files = files.map((x) => (x ? JSON.parse(JSON.stringify(x)) : x)); if (om) { mergeBlend(files, om); blend = true; } else note = "blend-noom"; }
  if (v === "sample" || auto) files = await loadBundle("data/sample/", false);
  if (!files || !files[3] || !files[3].population) { let ctx = null; if (!auto && v !== "sample") { const b = await loadBundle("data/", true); ctx = b[3]; } files = files || [null, null, null, null]; files[3] = ctx && ctx.population ? ctx : BUILTIN_CTX; }
  state.autoSample = auto; state.note = note; D.modelOnly = modelOnly; D.blend = blend;
  const [l, h, f, c] = files;
  D.latest = l || { stations: [] }; D.hist = h; D.fc = f; D.ctx = c; D.gen = (l && l.generatedAt) || null;
  prepare(); state.loaded = true;
}
function isSample() { return state.view === "sample" || state.autoSample; }
function prepare() {
  CACHE = {};
  D.stations = (D.latest.stations || []).filter((s) => s.lat != null && s.lon != null).map((s) => { const o = Object.assign({}, s); o.road = !o.model && /自排/.test(o.type || ""); o.muni = muniOf((o.city || "") + " " + (o.address || "")); o.areas = AREAS.filter((a) => matchArea(o.muni.ja, a)).map((a) => a.k); o.bay = o.areas.includes("bay"); if (o.model && state.lang === "en" && o.nameEn) o.dispName = o.nameEn; return o; });
  D.byId = {}; D.stations.forEach((s) => (D.byId[s.id] = s));
  D.times = (D.hist && D.hist.times) || []; D.H = (D.hist && D.hist.st) || {};
  const f = D.fc, lastT = D.times.length ? Date.parse(D.times[D.times.length - 1]) : Date.parse((D.latest && D.latest.observedAt) || Date.now());
  D.fcAt = {}; D.fcIdx = [];
  if (f && f.times) f.times.forEach((t, i) => { D.fcAt[t] = i; if (Date.parse(t) > lastT && D.fcIdx.length < 72) D.fcIdx.push(i); });
  D.camsNow = null; if (f && f.times) { let best = 1e15; f.times.forEach((t, i) => { const d = Math.abs(Date.parse(t) - lastT); if (d < best) { best = d; D.camsNow = i; } }); }
  D.axis = D.times.map((t, i) => ({ t, kind: "m", i })).concat(D.fcIdx.map((i) => ({ t: f.times[i], kind: "f", i })));
  D.nowAx = D.times.length ? D.times.length - 1 : null;
  const pop = D.ctx && D.ctx.population;
  D.munis = ((pop && pop.munis) || []).filter((m) => m.lat != null && m.pop > 0).map((m) => { const o = Object.assign({}, m); const k = +o.code; if (k >= 27102 && k <= 27128 && !o.name.startsWith("大阪市")) o.name = "大阪市" + o.name; o.muni = muniOf(o.name); if (!o.muni.ja) o.muni = { ja: o.name, en: o.nameEn || o.name }; o.areas = AREAS.filter((a) => matchArea(o.muni.ja, a)).map((a) => a.k); return o; });
  if (pop && !pop.total) pop.total = D.munis.reduce((a, m) => a + m.pop, 0);
  D.hosp = (D.ctx && D.ctx.hospitals) || []; D.schools = (D.ctx && D.ctx.schools) || [];
  D.amedas = (D.latest.weather && D.latest.weather.stations) || [];
  D.wxSrc = (D.latest.weather && D.latest.weather.src) || "amedas";
  D.wxOsaka = D.amedas.find((a) => a.code === "62078" || a.code === "om-c") || D.amedas[0] || null;
  if (state.tIdx == null || state.tIdx >= D.axis.length) state.tIdx = D.nowAx;
}
function modeKind() { if (isSample()) return "sample"; if (D.modelOnly) return "om"; if (D.blend) return "blend"; return (D.latest && D.latest.mode) || "official"; }
const WXS = () => (D.wxSrc === "om" ? "Open-Meteo" : "AMeDAS");
const sName = (s) => (s.model && state.lang === "en" && s.nameEn ? s.nameEn : s.name);

/* ================= VALUES ================= */
function inArea(s, k) { k = k || state.area; return k === "all" || (s.areas && s.areas.includes(k)); }
const areaStations = () => D.stations.filter((s) => inArea(s));
function camsVal(pol, i) { const f = D.fc; if (!f || i == null) return null; const a = pol === "pm25" ? f.pm25 : pol === "no2" ? f.no2ppb : pol === "ox" ? f.oxppb : pol === "so2" ? f.so2ppb : pol === "co" ? f.coppm : f.pm10; return a ? a[i] : null; }
function corrected(pol, i) { const v = camsVal(pol, i); if (v == null) return null; const vr = verify(pol); if (!vr) return v; if (pol === "spm") return Math.max(0, v * vr.k); return Math.max(0, v - vr.bias); }
function fcRatio(pol, i) { const a = corrected(pol, i), b = corrected(pol, D.camsNow); if (a == null || !b) return 1; return Math.max(0.2, Math.min(4, a / b)); }
function valueAt(st, pol, ax) {
  if (ax == null || ax === D.nowAx) return st[pol] != null ? st[pol] : histAt(st, pol, D.nowAx);
  const a = D.axis[ax]; if (!a) return null;
  if (a.kind === "m") return histAt(st, pol, a.i);
  const v = st[pol]; return v == null ? null : v * fcRatio(pol, a.i);
}
function histAt(st, pol, i) { const h = D.H[st.id]; return h && h[pol] && i != null ? h[pol][i] : null; }
function dayMean(st, pol) { const k = "dm|" + st.id + "|" + pol; if (k in CACHE) return CACHE[k]; const h = D.H[st.id]; let r = null;
  if (h && h[pol]) { const a = h[pol].slice(-24).filter((x) => x != null); if (a.length >= 18) r = mean(a); } return (CACHE[k] = r); }
function stdMetric(st, pol) { return POLS[pol].stdKind === "hour" ? st[pol] : dayMean(st, pol); }

/* Measured split: regional background / urban increment / roadside increment */
function decomp(pol, ax) {
  const key = "dc|" + pol + "|" + ax; if (CACHE[key]) return CACHE[key];
  const all = D.stations.map((s) => ({ s, v: valueAt(s, pol, ax) })).filter((x) => x.v != null);
  let gen = all.filter((x) => !x.s.road && !x.s.model); if (gen.length < 3) gen = all.filter((x) => !x.s.road);
  const bg = quantile(gen.map((x) => x.v), 0.1) || 0;
  const m = new Map();
  all.forEach((x) => {
    const v = x.v, b = Math.min(bg, v); let urb, road, g = null;
    if (x.s.road) { const nb = gen.map((y) => ({ y, d: km(x.s, y.s) })).filter((o) => o.d <= 6).sort((p, q) => p.d - q.d).slice(0, 2); g = nb.length ? mean(nb.map((o) => o.y.v)) : bg; urb = Math.min(Math.max(0, g - bg), v - b); road = Math.max(0, v - b - urb); }
    else { urb = v - b; road = 0; }
    m.set(x.s.id, { bg: b, urb, road, v, g });
  });
  m.bgLevel = bg; CACHE[key] = m; return m;
}
function decompTotals(pol, ax, list) { const dc = decomp(pol, ax); let b = 0, u = 0, r = 0, n = 0; (list || areaStations()).forEach((s) => { const p = dc.get(s.id); if (!p) return; b += p.bg; u += p.urb; r += p.road; n++; }); if (!n) return null; return { bg: b / n, urb: u / n, road: r / n, total: (b + u + r) / n, n }; }

/* ================= SCENARIO MODEL ================= */
const A_SC = { trafUrb: { no2: .55, pm25: .25, spm: .30 }, portBay: { no2: .35, pm25: .35, spm: .35 }, portElse: { no2: .10, pm25: .12, spm: .12 },
  heavy: { no2: .70, pm25: .60, spm: .60 }, exhaust: { no2: 1, pm25: .45, spm: .30 }, shiftEff: .9, lez: { no2: .30, pm25: .15, spm: .10 },
  green: { no2: .001, pm25: .0015, spm: .0015 }, calm: 1.25, windy: .8, kosa: { pm25: 30, spm: .20, no2: 0 } };
function scenParts(st, pol, sc, p) {
  let trafU = p.urb * A_SC.trafUrb[pol], port = p.urb * (st.bay ? A_SC.portBay[pol] : A_SC.portElse[pol]);
  if (trafU + port > p.urb) { const k = p.urb / (trafU + port); trafU *= k; port *= k; }
  const other = p.urb - trafU - port; let traffic = p.road + trafU;
  traffic *= 1 - (sc.shift / 100) * A_SC.shiftEff;
  const hv = A_SC.heavy[pol], ex = A_SC.exhaust[pol];
  traffic *= Math.max(0, 1 - (sc.ev / 100) * (1 - hv) * ex - (sc.heavy / 100) * hv * ex);
  if (sc.lez) { const d = distToLEZ(st), c = A_SC.lez[pol]; if (d <= 1.5) traffic *= 1 - c; else if (d <= 3) traffic *= 1 - c / 2; }
  port *= 1 - sc.port / 100;
  const wxk = sc.wx === "calm" ? A_SC.calm : sc.wx === "windy" ? A_SC.windy : 1;
  const g = 1 - sc.green * A_SC.green[pol];
  return { bg: (p.bg + (sc.kosa / 100) * A_SC.kosa[pol]) * g, traffic: traffic * wxk * g, port: port * wxk * g, other: other * wxk * g };
}
function scenVal(st, pol, sc, dc) { const base = st[pol]; if (base == null || !sc || !SCEN_POLS.includes(pol)) return base; const p = (dc || decomp(pol, null)).get(st.id); if (!p) return base; const r = scenParts(st, pol, sc, p); return Math.max(0, r.bg + r.traffic + r.port + r.other); }
const SCEN_POLS = ["pm25", "no2", "spm"];
const scPol = () => (SCEN_POLS.includes(state.pol) ? state.pol : "pm25");
const hasLevers = (sc) => { sc = sc || state.sc; return !!(sc.ev || sc.heavy || sc.shift || sc.lez || sc.port || sc.green || sc.kosa || sc.wx !== "obs"); };

/* ================= NODES, INTERPOLATION, EXPOSURE ================= */
function nodesFor(pol, o) { o = o || {}; const list = o.all ? D.stations : areaStations(); const dc = o.sc ? decomp(pol, null) : null;
  return list.map((s) => ({ st: s, v: o.sc ? scenVal(s, pol, o.sc, dc) : valueAt(s, pol, o.ax) })).filter((x) => x.v != null); }
function idw(ns, lat, lon) { let n = 0, d = 0, mn = 1e9; for (const x of ns) { const dd = Math.hypot((lat - x.st.lat) * 111, (lon - x.st.lon) * 91.3); if (dd < mn) mn = dd; if (dd > 30) continue; const w = 1 / Math.pow(Math.max(dd, 0.4), 2); n += w * x.v; d += w; } return { v: d ? n / d : null, dmin: mn }; }
function areaAvg(pol, o) { return mean(nodesFor(pol, o).map((x) => x.v)); }
function metricNodes(pol, sc) { const dc = sc ? decomp(pol, null) : null;
  return D.stations.map((s) => { let v = stdMetric(s, pol); if (v == null) v = s[pol]; if (v != null && sc && SCEN_POLS.includes(pol) && s[pol]) v *= scenVal(s, pol, sc, dc) / s[pol]; return { st: s, v }; }).filter((x) => x.v != null); }
function exposure(pol, sc) {
  if (!D.munis.length) return null; const ns = metricNodes(pol, sc); if (!ns.length) return null;
  const std = POLS[pol].std; let pop = 0, ex = 0, wsum = 0; const rows = [];
  D.munis.filter((m) => m.areas.includes(state.area) || state.area === "all").forEach((m) => { const r = idw(ns, m.lat, m.lon); if (r.v == null || r.dmin > 15) return; pop += m.pop; wsum += m.pop * r.v; if (r.v > std) ex += m.pop; rows.push({ m, v: r.v, dmin: r.dmin }); });
  if (!pop) return null; return { pop, exceed: ex, pct: (ex / pop) * 100, wavg: wsum / pop, rows, basis: POLS[pol].stdKind };
}
function looError(pol) {
  const k = "loo|" + pol + "|" + state.area; if (CACHE[k]) return CACHE[k];
  const all = nodesFor(pol, { all: true }), errs = [], obs = [];
  all.filter((x) => inArea(x.st)).forEach((x) => { const r = idw(all.filter((y) => y !== x), x.st.lat, x.st.lon); if (r.v != null) { errs.push(Math.abs(r.v - x.v)); obs.push(x.v); } });
  return (CACHE[k] = errs.length ? { mae: mean(errs), rel: mean(errs) / (mean(obs) || 1), n: errs.length } : null);
}
function spacing(list) { const d = list.map((s) => Math.min(...list.filter((t) => t !== s).map((t) => km(s, t)))).filter(isFinite); return d.length ? quantile(d, 0.5) : null; }

/* ================= FORECAST VERIFICATION (model vs measured) ================= */
function prefSeries(pol, areaOnly) { const k = "ps|" + pol + "|" + (areaOnly ? state.area : "all"); if (CACHE[k]) return CACHE[k];
  const list = (areaOnly ? areaStations() : D.stations).filter((s) => !s.model || D.modelOnly); return (CACHE[k] = D.times.map((t, i) => mean(list.map((s) => histAt(s, pol, i))))); }
function verify(pol) {
  const k = "vf|" + pol; if (k in CACHE) return CACHE[k];
  const f = D.fc; if (!f || !D.times.length || D.modelOnly) return (CACHE[k] = null);
  const meas = prefSeries(pol, false), pairs = [];
  D.times.forEach((t, i) => { const j = D.fcAt[t]; if (j == null || meas[i] == null) return; const m = camsVal(pol, j); if (m == null) return; pairs.push([m, pol === "spm" ? meas[i] * 1000 : meas[i]]); });
  if (pairs.length < 24) return (CACHE[k] = null);
  let r;
  if (pol === "spm") { const kk = mean(pairs.map((p) => p[1])) / (mean(pairs.map((p) => p[0])) || 1); const e = pairs.map((p) => p[0] * kk - p[1]); r = { k: kk / 1000, bias: 0, mae: mean(e.map(Math.abs)) / 1000, rmse: Math.sqrt(mean(e.map((x) => x * x))) / 1000, n: pairs.length, obsMean: mean(pairs.map((p) => p[1])) / 1000 }; }
  else { const bias = mean(pairs.map((p) => p[0] - p[1])); const e = pairs.map((p) => p[0] - bias - p[1]); r = { k: 1, bias, mae: mean(e.map(Math.abs)), rmse: Math.sqrt(mean(e.map((x) => x * x))), rawMae: mean(pairs.map((p) => Math.abs(p[0] - p[1]))), n: pairs.length, obsMean: mean(pairs.map((p) => p[1])) }; }
  return (CACHE[k] = r);
}
function fcRange(pol, v, leadH) { const vr = verify(pol); const base = vr ? vr.rmse : (v || 0) * 0.25; const w = 1.28 * base * Math.sqrt(1 + Math.max(0, leadH) / 24); return { lo: Math.max(0, v - w), hi: v + w, w, conf: leadH <= 12 ? "hi" : leadH <= 36 ? "md" : "lo" }; }

/* ================= PATTERNS ================= */
function hourProfile(pol, list) { const s = Array.from({ length: 24 }, () => []); D.times.forEach((t, i) => { const h = jstHour(t); (list || areaStations()).forEach((st) => { const v = histAt(st, pol, i); if (v != null) s[h].push(v); }); }); return s.map(mean); }
function weekSplit(pol, list) { const wd = [], we = []; D.times.forEach((t, i) => { const d = jstDow(t); (list || areaStations()).forEach((st) => { const v = histAt(st, pol, i); if (v != null) (d === 0 || d === 6 ? we : wd).push(v); }); }); return { wd: mean(wd), we: mean(we), nwe: we.length }; }
function rose(st, pol) { const h = D.H[st.id]; if (!h || !h.wd || !h[pol]) return null; const bins = Array.from({ length: 8 }, () => []), calm = [];
  h.wd.forEach((d, i) => { const v = h[pol][i]; if (d == null || v == null) return; if (d < 0) calm.push(v); else bins[Math.round(d / 45) % 8].push(v); });
  const n = bins.reduce((a, b) => a + b.length, 0) + calm.length; if (n < 24) return null; return { bins: bins.map((b) => ({ v: mean(b), n: b.length })), calm: { v: mean(calm), n: calm.length }, n }; }
function kosaFlag(st) { if (st.spm == null || st.pm25 == null) return null; const r = st.pm25 / (st.spm * 1000); return { ratio: r, flag: st.spm >= 0.05 && r < 0.35 }; }
function nearestAmedas(p) { let b = null, bd = 1e9; D.amedas.forEach((a) => { const d = km(p, a); if (d < bd && a.ws != null) { bd = d; b = a; } }); return b ? Object.assign({ dist: bd }, b) : null; }
function near(list, p, r) { return list.map((x) => ({ x, d: km(p, x) })).filter((o) => o.d <= r).sort((a, b) => a.d - b.d); }

/* ================= PROVENANCE, SOURCES & ASSUMPTION BLOCKS ================= */
function pv(k) { if (k === "m" && D.modelOnly) k = "f"; const t = { m: [tx("M", "実"), tx("Measured by an official station", "公的測定局による実測値")], c: [tx("C", "算"), tx("Calculated from the data", "データから計算")], f: [tx("F", "予"), tx("Model value (Open-Meteo / forecast)", "モデル値（Open-Meteo・予測）")], a: [tx("A", "仮"), tx("Assumption", "前提条件")], r: [tx("R", "参"), tx("Published reference data", "公開参照データ")] }[k]; return '<span class="prov ' + k + '" title="' + esc(t[1]) + '">' + t[0] + "</span>"; }
const SRC = {
  soramame: { k: "m", n: { en: "Ministry of the Environment — AEROS “Soramame-kun”", ja: "環境省 大気汚染物質広域監視システム（そらまめくん）" },
    what: { en: "Hourly preliminary values for every Osaka Prefecture station: PM2.5, NO₂, Ox, SPM, SO₂, CO, wind", ja: "大阪府内全測定局の1時間値（速報値）：PM2.5・NO₂・Ox・SPM・SO₂・CO・風向風速" },
    under: { en: "Continuous monitoring stations run by Osaka Prefecture and its cities; collected every 30 minutes by the GitHub Action", ja: "大阪府・府内各市が運営する常時監視測定局。GitHub Actionで30分ごとに収集" },
    url: "soramame.env.go.jp", who: { en: "Ministry of the Environment · data rights: MOE, local governments, NIES", ja: "環境省（著作権：環境省・各地方公共団体・国立環境研究所）" } },
  om: { k: "f", n: { en: "Open-Meteo Air Quality API — European model (Copernicus CAMS)", ja: "Open-Meteo 大気質API — 欧州モデル（コペルニクスCAMS）" }, what: { en: "Hourly model values at municipal centre points across Osaka: PM2.5, PM10, NO₂, ozone, dust — past 7 days and next 3 days. Fetched live by your browser, so it works even from a desktop file", ja: "大阪府内の市区町村代表点における1時間ごとのモデル値：PM2.5・PM10・NO₂・オゾン・ダスト（過去7日・今後3日）。ブラウザが直接取得するため、デスクトップ上のファイルでも動作" }, under: { en: "European Union Copernicus Atmosphere Monitoring Service global model (about 40 km grid over Japan). A model estimate, not a measurement by a Japanese station", ja: "欧州連合コペルニクス大気監視サービスの全球モデル（日本付近は約40kmメッシュ）。日本の測定局の実測ではなくモデル推計" }, url: "air-quality-api.open-meteo.com", who: { en: "ECMWF for the European Commission · Open-Meteo CC BY 4.0", ja: "欧州中期予報センター（欧州委員会）・Open-Meteo CC BY 4.0" } },
  omwx: { k: "f", n: { en: "Open-Meteo Weather API", ja: "Open-Meteo 気象API" }, what: { en: "Wind, temperature, humidity and rain at the same points (used when JMA AMeDAS data is not available)", ja: "同じ地点の風・気温・湿度・降水（気象庁アメダスが無い場合に使用）" }, under: { en: "Global and regional weather models, including JMA's model for Japan", ja: "全球・地域気象モデル（日本域は気象庁モデルを含む）" }, url: "api.open-meteo.com", who: { en: "Open-Meteo CC BY 4.0", ja: "Open-Meteo CC BY 4.0" } },
  osakaPref: { k: "r", n: { en: "Osaka Prefecture — Air Quality Information", ja: "大阪府の大気情報" }, what: { en: "Reference; the official place where photochemical smog advisories and PM2.5 alerts are issued", ja: "参照。光化学スモッグ注意報・PM2.5注意喚起の公式発表元" }, under: { en: "Osaka Prefecture continuous monitoring network", ja: "大阪府 常時監視" }, url: "taiki.kankyo.pref.osaka.jp", who: { en: "Osaka Prefecture", ja: "大阪府 環境農林水産部" } },
  amedas: { k: "m", n: { en: "Japan Meteorological Agency — AMeDAS", ja: "気象庁 アメダス" }, what: { en: "Latest wind, temperature, humidity, rain and sunshine at AMeDAS stations in and around Osaka Prefecture", ja: "大阪府内外のアメダス観測所の最新の風・気温・湿度・降水量・日照" }, under: { en: "bosai/amedas (10-minute updates)", ja: "bosai/amedas（10分更新）" }, url: "jma.go.jp/bosai/amedas", who: { en: "Japan Meteorological Agency", ja: "気象庁" } },
  jmaFc: { k: "f", n: { en: "Japan Meteorological Agency — official forecast for Osaka", ja: "気象庁 大阪府の天気予報" }, what: { en: "Weather, wind, rain probability and temperatures (area code 270000)", ja: "天気・風・降水確率・気温（地域コード270000）" }, under: { en: "Osaka Regional Headquarters", ja: "大阪管区気象台" }, url: "jma.go.jp/bosai/forecast", who: { en: "Japan Meteorological Agency", ja: "気象庁" } },
  jmaWarn: { k: "r", n: { en: "Japan Meteorological Agency — warnings and advisories", ja: "気象庁 警報・注意報" }, what: { en: "Current headline for Osaka Prefecture", ja: "大阪府の現在の見出し" }, under: { en: "area code 270000", ja: "地域コード270000" }, url: "jma.go.jp/bosai/warning", who: { en: "Japan Meteorological Agency", ja: "気象庁" } },
  cams: { k: "f", n: { en: "Copernicus CAMS forecast, via Open-Meteo", ja: "コペルニクスCAMS予測（Open-Meteo経由）" }, what: { en: "Model forecast used for the next 3 days; checked and corrected against official measurements when they are available", ja: "今後3日の予測に使用。公的測定値がある場合はそれで検証・補正" }, under: { en: "European model, about 40 km grid", ja: "欧州モデル（約40kmメッシュ）" }, url: "air-quality-api.open-meteo.com", who: { en: "ECMWF · Open-Meteo CC BY 4.0", ja: "ECMWF・Open-Meteo CC BY 4.0" } },
  gsiGeo: { k: "c", n: { en: "Geospatial Information Authority of Japan — address search", ja: "国土地理院 住所検索API" }, what: { en: "Map position of each official station from its address", ja: "公的測定局の住所から位置を取得" }, under: { en: "GSI address database", ja: "国土地理院 住所データ" }, url: "msearch.gsi.go.jp", who: { en: "GSI", ja: "国土地理院" } },
  esri: { k: "r", n: { en: "Esri basemaps (World Imagery, Topographic, Light Grey, Streets)", ja: "Esri 背景地図（衛星画像・地形図・ライトグレー・道路地図）" }, what: { en: "Background maps", ja: "背景地図" }, under: { en: "ArcGIS Online basemap services", ja: "ArcGIS Online 背景地図サービス" }, url: "server.arcgisonline.com", who: { en: "Esri and its data partners · Esri terms of use", ja: "Esri及びデータ提供者（Esri利用規約）" } },
  gsiTiles: { k: "r", n: { en: "GSI tiles (pale, standard, aerial photo)", ja: "地理院タイル（淡色・標準・写真）" }, what: { en: "Background maps", ja: "背景地図" }, under: { en: "Official national base maps", ja: "国の基本地図" }, url: "cyberjapandata.gsi.go.jp", who: { en: "Geospatial Information Authority of Japan", ja: "国土地理院" } },
  wikidata: { k: "r", n: { en: "Wikidata — population of each municipality and ward", ja: "Wikidata — 市区町村・区の人口" }, what: { en: "Population with its reference date and centre point", ja: "人口（時点付き）と代表点" }, under: { en: "National census and official estimates as cited in each entry", ja: "国勢調査・推計人口（各項目の出典）" }, url: "query.wikidata.org", who: { en: "Wikidata · CC0", ja: "Wikidata（CC0）" } },
  builtin: { k: "r", n: { en: "Reference figures built into the page", ja: "ページ内蔵の参照値" }, what: { en: "Rounded 2020 census population of 26 municipalities and 7 major hospitals at approximate locations. Used when the collected population and facility files are not available (for example, opened from a desktop)", ja: "26市の2020年国勢調査人口（概数）と主要7病院（概略位置）。収集済みファイルが使えない場合（デスクトップで開いた場合など）に使用" }, under: { en: "National census 2020 (rounded); hospital positions approximate", ja: "2020年国勢調査（概数）・病院位置は概略" }, url: "—", who: { en: "Compiled for this demonstration", ja: "本デモ用に整理" } },
  osm: { k: "r", n: { en: "OpenStreetMap — hospitals and schools", ja: "OpenStreetMap — 病院・学校" }, what: { en: "Location and name of hospitals and schools in Osaka Prefecture", ja: "大阪府内の病院・学校の位置と名称" }, under: { en: "Community-mapped, via the Overpass API; completeness varies", ja: "Overpass API経由のコミュニティデータ（網羅性は場所により異なる）" }, url: "overpass-api.de", who: { en: "© OpenStreetMap contributors, ODbL", ja: "© OpenStreetMap contributors（ODbL）" } },
  eqs: { k: "r", n: { en: "Environmental Quality Standards for air (Japan)", ja: "大気汚染に係る環境基準" }, what: { en: "The standards each reading is compared against", ja: "各測定値の比較基準" }, under: { en: "PM2.5 daily 35 / annual 15 µg/m³ · NO₂ daily 0.04–0.06 ppm zone · Ox hourly 0.06 ppm · SO₂ daily 0.04 / hourly 0.1 ppm · CO daily 10 / 8-hour 20 ppm · SPM daily 0.10 / hourly 0.20 mg/m³", ja: "PM2.5 日平均35・年平均15 µg/m³／NO₂ 日平均0.04〜0.06 ppm／Ox 1時間値0.06 ppm／SPM 日平均0.10・1時間値0.20 mg/m³" }, url: "env.go.jp/kijun/taiki.html", who: { en: "Ministry of the Environment", ja: "環境省" } },
  alerts: { k: "r", n: { en: "Alert thresholds in Japanese rules", ja: "注意報・注意喚起の基準" }, what: { en: "Photochemical smog advisory at Ox 0.12 ppm; PM2.5 alert guideline daily mean 70 µg/m³ (5–7 am average above 85)", ja: "光化学スモッグ注意報 Ox 0.12 ppm／PM2.5注意喚起 日平均70 µg/m³（午前5〜7時平均85超）" }, under: { en: "Warning level 0.24 ppm set by prefectures", ja: "警報0.24 ppmは都道府県が設定" }, url: "env.go.jp", who: { en: "Ministry of the Environment · Osaka Prefecture", ja: "環境省・大阪府" } },
  who: { k: "r", n: { en: "WHO Global Air Quality Guidelines 2021", ja: "WHO 大気質ガイドライン 2021" }, what: { en: "Health guideline values for comparison", ja: "比較用の健康ガイドライン値" }, under: { en: "PM2.5 24-hour 15 µg/m³ · NO₂ 24-hour 25 µg/m³ (≈13 ppb) · ozone 8-hour 100 µg/m³ (≈51 ppb)", ja: "PM2.5 24時間15 µg/m³／NO₂ 24時間25 µg/m³（約13 ppb）／オゾン8時間100 µg/m³（約51 ppb）" }, url: "who.int", who: { en: "World Health Organization", ja: "世界保健機関" } },
  leaflet: { k: "r", n: { en: "Leaflet 1.9.4", ja: "Leaflet 1.9.4" }, what: { en: "Draws the interactive maps", ja: "対話型地図の描画" }, under: { en: "Open-source mapping library", ja: "オープンソース地図ライブラリ" }, url: "unpkg.com/leaflet", who: { en: "BSD-2-Clause", ja: "BSD-2-Clause" } },
  sample: { k: "a", n: { en: "Sample snapshot built for offline demonstration", ja: "オフラインデモ用サンプル" }, what: { en: "Used only in Sample mode or as a last fallback. Every station name is marked (サンプル) and every value is invented", ja: "サンプル選択時または最終的な代替時のみ使用。局名に（サンプル）と表示し、値はすべて作成値" }, under: { en: "Produced by running the collector against synthetic sources", ja: "合成データに対して収集処理を実行して作成" }, url: "data/sample", who: { en: "Constructed for this demonstration", ja: "本デモ用に作成" } },
  cad: { k: "a", none: true, n: { en: "Cadastral / land parcel data — NOT USED", ja: "地籍・筆界データ — 不使用" }, what: { en: "No plot boundaries or ownership data appear anywhere", ja: "筆界・所有情報は一切使用していません" }, under: { en: "If needed: Ministry of Justice registry maps via the G-Space Information Center", ja: "必要な場合：法務省 登記所備付地図データ（G空間情報センター）" }, url: "—", who: { en: "Licence to be confirmed", ja: "利用条件の確認が必要" } } };
function srcRow(k) { const s = SRC[k]; if (!s) return ""; return '<tr' + (s.none ? ' class="dnone"' : "") + '><td style="min-width:200px"><span class="dn">' + tr(s.n) + pv(s.k) + '</span><span class="du">' + esc(s.url) + '</span></td><td>' + tr(s.what) + '</td><td class="muted">' + tr(s.under) + '</td><td class="dl">' + tr(s.who) + "</td></tr>"; }
function sources(keys, note) {
  keys = keys.slice();
  if (D.modelOnly) keys = keys.filter((k) => !["soramame", "amedas", "gsiGeo", "jmaFc", "jmaWarn"].includes(k));
  if ((D.modelOnly || D.blend) && !keys.includes("om")) keys.unshift("om");
  if (D.wxSrc === "om" && !keys.includes("omwx")) keys.push("omwx");
  if (keys.includes("gsiTiles") && state.basemap.startsWith("esri")) keys = keys.map((k) => (k === "gsiTiles" ? "esri" : k));
  if (D.ctx && D.ctx.builtin) { keys = keys.filter((k) => k !== "wikidata" && k !== "osm"); keys.push("builtin"); }
  if (isSample() && !keys.includes("sample")) keys.push("sample");
  return '<details class="dsrc"><summary>' + icon("database") + tx("Data sources used on this page", "このページのデータソース") + '</summary><div class="scroll"><table><thead><tr><th>' + tx("Source", "出典") + "</th><th>" + tx("What it provides here", "このページでの用途") + "</th><th>" + tx("Dataset underneath", "元データ") + "</th><th>" + tx("Publisher & terms", "提供者・利用条件") + "</th></tr></thead><tbody>" + keys.map(srcRow).join("") + "</tbody></table></div>"
    + (note ? '<div style="padding:12px 16px;font-size:12px;color:var(--ink-2);background:var(--surface);border-top:1px solid var(--line)">' + icon("info") + " " + note + "</div>" : "") + "</details>";
}
function assumptions(list, foot) {
  list = list.slice(); if (D.modelOnly || D.blend) list = ASM.om().concat(list);
  return '<details class="asmp" open><summary>' + icon("alert") + tx("Assumptions on this page", "このページの前提条件（Assumptions）") + " — " + list.length + '</summary><div class="abody">'
    + list.map((a) => '<div class="arow"><span class="atag">' + tx("Assumption", "前提条件") + '</span><div><div class="at">' + a[0] + '</div><div class="ad">' + a[1] + (a[2] ? ' <span class="av">' + a[2] + "</span>" : "") + "</div></div></div>").join("")
    + (foot ? '<div class="afoot">' + icon("info") + " " + foot + "</div>" : "") + "</div></details>";
}
function how(steps, note) {
  return '<details class="how"><summary>' + icon("info") + tx("How this page works", "このページの仕組み") + '</summary><div class="hbody">'
    + steps.map((s, i) => '<div class="hstep"><div class="hn">' + (i + 1) + '</div><div><div class="ht">' + s[0] + '</div><div class="hd">' + s[1] + "</div></div></div>").join("")
    + (note ? '<div class="afoot">' + icon("info") + " " + note + "</div>" : "") + "</div></details>";
}
const ASM = {
  om: () => [[tx("Open-Meteo values are a European model, not Japanese measurements", "Open-Meteoの値は欧州モデルであり日本の実測ではない"), tx("They come from the EU Copernicus model on a roughly 40 km grid, so they smooth out local peaks near roads and the port. Model points sit at approximate municipal centres.", "欧州連合コペルニクスの約40kmメッシュのモデル値のため、道路沿いや港湾付近の局所的なピークは平準化されます。モデル点は市区町村の概略中心に置いています。"), "CAMS ~40 km"],
    [tx("Model values are matched to Japanese indicators", "モデル値を日本の指標に対応付け"), tx("Ox is taken as model ozone plus NO₂ (in ppb); SPM is approximated by model PM10. Japanese SPM is a slightly smaller particle size, so this reads a little high.", "Oxはモデルのオゾン＋NO₂（ppb）、SPMはモデルのPM10で近似しています。日本のSPMはやや小さい粒径のため、やや高めになります。"), "Ox≈O₃+NO₂ · SPM≈PM10"]],
  map: () => [tx("The map between points is estimated", "地点間の地図は推計値"), tx("Between measurement points each location is a distance-weighted average of nearby points. Nothing is drawn more than 10 km from a point.", "地点の間の各場所は近隣地点の距離加重平均です。地点から10km以上離れた場所は表示しません。"), tx("inverse distance², ≤10 km", "距離の2乗逆数・10km以内")],
  prelim: () => [tx("Official values are preliminary", "公式値は速報値"), tx("Stations publish preliminary hourly values that may be corrected later.", "測定局の1時間値は速報値で、後日修正される場合があります。"), "速報値"],
  levels: () => [tx("Colour levels are anchored on the standards", "色分けは環境基準に準拠"), tx("For PM2.5, NO₂ and SPM the standard is a daily mean, so colouring a single hour against it is indicative only.", "PM2.5・NO₂・SPMの基準は日平均値のため、1時間値の色分けは目安です。"), "EQS"],
  units: () => [tx("Unit conversions", "単位換算"), tx("Official gases (ppm) are shown in ppb (×1,000). Model µg/m³ are converted at 25 °C (NO₂ ÷1.88, ozone ÷1.96, SO₂ ÷2.62 to ppb; CO ÷1145 to ppm).", "公式のガス濃度（ppm）はppb（×1,000）で表示。モデルのµg/m³は25℃換算でppbに変換（NO₂÷1.88、オゾン÷1.96）。"), "ppm→ppb"],
  bg: () => [tx("Regional background is the cleanest tenth of general points", "広域バックグラウンド＝一般地点の下位10%"), tx("The regional level is the 10th percentile of general (non-roadside) points at that hour.", "広域レベルはその時刻の一般（非沿道）地点の10パーセンタイル値です。"), tx("10th percentile", "10パーセンタイル")],
  road: () => [tx("Roadside increment uses the nearest general stations", "沿道寄与は最寄り一般局との差"), tx("A roadside station's extra over the two nearest general stations within 6 km is attributed to the road.", "自排局のうち6km以内の最寄り一般局2局の平均を上回る分を道路の寄与とみなします。"), tx("2 stations, ≤6 km", "2局・6km以内")],
  pop: () => [tx("People are counted where they live, at the municipal centre", "人口は常住地・代表点で集計"), tx("Daytime movement (commuting into central Osaka) is not modelled.", "昼間の人口移動は反映していません。"), tx("residence-based", "常住地ベース")] };

/* ================= MAPS ================= */
const ESRI_ATTR = 'Tiles &copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>';
const BASEMAPS = { esri: { en: "Esri satellite", ja: "Esri 衛星画像", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", max: 19, attr: ESRI_ATTR + " — Esri, Maxar, Earthstar Geographics, GIS User Community" },
  esritopo: { en: "Esri topographic", ja: "Esri 地形図", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", max: 19, attr: ESRI_ATTR + " — Esri, HERE, Garmin, OpenStreetMap contributors" },
  esrigray: { en: "Esri light grey", ja: "Esri ライトグレー", url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", max: 16, attr: ESRI_ATTR + " — Esri, HERE, Garmin" },
  esristreet: { en: "Esri streets", ja: "Esri 道路地図", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", max: 19, attr: ESRI_ATTR + " — Esri, HERE, Garmin, OpenStreetMap contributors" },
  pale: { en: "GSI pale", ja: "地理院 淡色", url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", max: 18 }, std: { en: "GSI standard", ja: "地理院 標準", url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", max: 18 },
  photo: { en: "GSI aerial photo", ja: "地理院 写真", url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", max: 18 }, carto: { en: "CARTO light", ja: "CARTO ライト", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", max: 19, attr: "© OpenStreetMap contributors © CARTO" } };
const GSI_ATTR = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>';
let MAPS = [], MAPREG = {};
const mapOK = () => !!(window.L && window.L.map);
function mapSlot(scope, cfg, cls) { MAPREG[scope] = cfg; return '<div class="lmap ' + (cls || "") + '" data-map="' + scope + '"></div>'; }
function destroyMaps() { MAPS.forEach((m) => { try { if (!state.refit) state.mapViews[m._scope] = { c: m.getCenter(), z: m.getZoom() }; m.remove(); } catch (e) {} }); MAPS = []; if (state.refit) state.mapViews = {}; }
const AREA_BOX = { all: [[34.26, 135.1], [35.05, 135.75]], osaka: [[34.57, 135.39], [34.77, 135.60]], bay: [[34.46, 135.36], [34.73, 135.50]], north: [[34.74, 135.38], [35.05, 135.68]], east: [[34.56, 135.53], [34.86, 135.72]], sakai: [[34.46, 135.42], [34.62, 135.58]], south: [[34.38, 135.50], [34.62, 135.68]], senshu: [[34.26, 135.10], [34.55, 135.47]] };
function areaBounds(k) { k = k || state.area; if (k === "all") return AREA_BOX.all; const s = D.stations.filter((x) => inArea(x, k)); if (s.length < 2) return AREA_BOX[k] || AREA_BOX.all;
  let a = 90, b = -90, c = 180, d = -180; s.forEach((x) => { a = Math.min(a, x.lat); b = Math.max(b, x.lat); c = Math.min(c, x.lon); d = Math.max(d, x.lon); }); const pa = Math.max(0.02, (b - a) * 0.15), po = Math.max(0.03, (d - c) * 0.15); return [[a - pa, c - po], [b + pa, d + po]]; }
function setBase(m) { const c = BASEMAPS[state.basemap] || BASEMAPS.pale; if (m._base) m.removeLayer(m._base); if (m._ref) { m.removeLayer(m._ref); m._ref = null; }
  if (state.basemap === "esri") m._ref = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, pane: "overlayPane", opacity: .9 }).addTo(m); m._base = L.tileLayer(c.url, { attribution: c.attr || GSI_ATTR, maxZoom: c.max, subdomains: "abcd" }).addTo(m);
  let sw = false; m._base.on("tileerror", () => { if (sw || state.basemap === "carto") return; sw = true; m.removeLayer(m._base); m._base = L.tileLayer(BASEMAPS.carto.url, { attribution: BASEMAPS.carto.attr, subdomains: "abcd" }).addTo(m); }); }
function deltaCol(p) { return p <= -20 ? "#0B6E4F" : p <= -10 ? "#2FA37A" : p <= -5 ? "#7FCBA8" : p <= -1 ? "#CFEBDD" : p >= 1 ? "#E0602A" : "#E5E7EB"; }
function surfaceLayer() {
  const S = L.Layer.extend({
    onAdd(m) { this._c = L.DomUtil.create("canvas", ""); this._c.style.pointerEvents = "none"; m.getPane("surf").appendChild(this._c); m.on("moveend zoomend resize", this._r, this); this._r(); },
    onRemove(m) { L.DomUtil.remove(this._c); m.off("moveend zoomend resize", this._r, this); },
    _r() { if (!this._c || !this._map) return; const s = this._map.getSize(); this._c.width = s.x; this._c.height = s.y; L.DomUtil.setPosition(this._c, this._map.containerPointToLayerPoint([0, 0])); this.draw(); },
    draw() { if (!this._c || !this._map) return; const m = this._map, ctx = this._c.getContext("2d"), sz = m.getSize(); ctx.clearRect(0, 0, sz.x, sz.y); if (!state.showSurface) return;
      const cfg = m._cfg || {}, pol = cfg.pol || state.pol; let ns, ns2;
      if (cfg.delta) { ns = nodesFor(pol, { all: true }); ns2 = nodesFor(pol, { all: true, sc: state.sc }); } else ns = cfg.metric ? metricNodes(pol, null) : nodesFor(pol, { all: true, ax: cfg.ax, sc: cfg.sc ? state.sc : null });
      if (!ns.length) return; const b = m.getBounds(), N = 60, s = Math.max(b.getSouth(), 34.2), n = Math.min(b.getNorth(), 35.1), w = Math.max(b.getWest(), 135.0), e = Math.min(b.getEast(), 135.85); if (n <= s || e <= w) return;
      const dLa = (n - s) / N, dLo = (e - w) / N, tl = m.latLngToContainerPoint([n, w]), br = m.latLngToContainerPoint([s, e]);
      const off = document.createElement("canvas"); off.width = N; off.height = N; const oc = off.getContext("2d"), img = oc.createImageData(N, N), px = img.data;
      const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const la = s + (i + .5) * dLa, lo = w + (j + .5) * dLo; const r = idw(ns, la, lo); if (r.v == null || r.dmin > 10) continue; let col, a;
        if (cfg.delta) { const r2 = idw(ns2, la, lo); const pct = r.v ? (r2.v - r.v) / r.v * 100 : 0; col = deltaCol(pct); a = pct < -0.5 || pct > 0.5 ? 0.62 : 0; }
        else { const bd = bandOf(pol, r.v); col = bd.hex; a = state.surfaceOpacity * [.55, .8, 1, 1, 1][bd.i] * (r.dmin > 6 ? .55 : 1); }
        if (!a) continue; const c = rgb(col), k = ((N - 1 - i) * N + j) * 4; px[k] = c[0]; px[k + 1] = c[1]; px[k + 2] = c[2]; px[k + 3] = Math.round(Math.min(1, a) * 255); }
      oc.putImageData(img, 0, 0); ctx.save(); ctx.imageSmoothingEnabled = true; try { ctx.filter = "blur(6px)"; } catch (err) {}
      ctx.drawImage(off, tl.x, tl.y, br.x - tl.x, br.y - tl.y); ctx.restore(); } });
  return new S();
}
function mountMaps() {
  const els = document.querySelectorAll("[data-map]"); if (!els.length) return;
  if (!mapOK()) { els.forEach((el) => (el.innerHTML = '<div class="mapfail">' + icon("alert") + " <b>" + tx("The map library could not load on this network.", "このネットワークでは地図ライブラリを読み込めませんでした。") + "</b><br>" + tx("Every table and figure on this page still works.", "表や数値はすべて引き続き利用できます。") + "</div>")); return; }
  const made = {};
  els.forEach((el) => { const scope = el.dataset.map, cfg = MAPREG[scope] || {};
    const m = L.map(el, { zoomControl: false, preferCanvas: true, minZoom: 8, maxZoom: 17, scrollWheelZoom: true, wheelPxPerZoomLevel: 120 });
    L.control.zoom({ position: scope === "home" ? "bottomright" : "topleft", zoomInTitle: tx("Zoom in", "拡大"), zoomOutTitle: tx("Zoom out", "縮小") }).addTo(m);
    m._scope = scope; m._cfg = cfg; m.createPane("surf").style.zIndex = 350; m.getPane("surf").style.pointerEvents = "none"; m.createPane("zone").style.zIndex = 420; m.createPane("pts").style.zIndex = 460;
    setBase(m); m._surf = surfaceLayer(); m._surf.addTo(m); m._lay = L.layerGroup().addTo(m);
    const v = state.mapViews[scope]; if (v && !cfg.refit && !state.refit) m.setView(v.c, v.z, { animate: false }); else m.fitBounds(cfg.bounds || areaBounds(), { padding: [24, 24], animate: false, maxZoom: 13 });
    { const k = document.createElement("div"); k.className = "mapkeywrap"; k.innerHTML = shapeKey(true, cfg); L.DomEvent && L.DomEvent.disableClickPropagation && L.DomEvent.disableClickPropagation(k); el.appendChild(k); }
    drawLayers(m); MAPS.push(m); made[scope] = m; setTimeout(() => { try { m.invalidateSize(); m._surf.draw(); } catch (e) {} }, 80); });
  state.refit = false;
  if (made.base && made.scen) { let lock = false; const sync = (a, b) => a.on("move", () => { if (lock) return; lock = true; b.setView(a.getCenter(), a.getZoom(), { animate: false }); lock = false; }); sync(made.base, made.scen); sync(made.scen, made.base); }
}
function redrawMaps(filter) { MAPS.forEach((m) => { if (!filter || filter(m)) { drawLayers(m); m._surf.draw(); } }); }
function drawLayers(m) {
  const cfg = m._cfg || {}, pol = cfg.pol || state.pol, g = m._lay; g.clearLayers();
  if (cfg.lez || ((cfg.sc || cfg.delta) && state.sc.lez)) { g.addLayer(L.polyline(LEZ.map((p) => [p.lat, p.lon]), { pane: "zone", color: "#BC002D", weight: 3, opacity: .7 }).bindTooltip(tx("Low emission zone axis (Umeda–Namba)", "低排出ゾーン（梅田〜難波）")));
    g.addLayer(L.circle([34.684, 135.498], { pane: "zone", radius: 3000, color: "#BC002D", weight: 1.2, dashArray: "6 5", fill: false })); }
  if (cfg.bounds && cfg.showBox) g.addLayer(L.rectangle(cfg.bounds, { pane: "zone", color: "#1B365D", weight: 1.5, dashArray: "6 5", fill: false }));
  if ((cfg.hosp || state.showHosp) && D.hosp.length) { const ns = cfg.metric ? metricNodes(pol, null) : nodesFor(pol, { all: true });
    D.hosp.forEach((h) => { const r = idw(ns, h.lat, h.lon); g.addLayer(L.marker([h.lat, h.lon], { pane: "pts", icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div style="position:absolute;transform:translate(-50%,-50%);width:13px;height:13px;border-radius:3px;background:#fff;border:2px solid #BC002D;box-sizing:border-box"></div>' }) })
      .bindTooltip("<b>" + esc(state.lang === "en" && h.ne ? h.ne : h.n || tx("Hospital", "病院")) + "</b><br>" + POLS[pol].label + ": " + fmt(pol, r.v) + " " + U(pol) + ' <i style="font-size:10px">' + tx("(estimated here)", "（推計値）") + "</i>")); }); }
  if ((cfg.wind != null ? cfg.wind : state.showWind) && !cfg.delta) D.amedas.forEach((a) => { if (a.ws == null || a.wd == null) return; const calm = a.wd < 0; const rot = calm ? 0 : (a.wd + 180) % 360;
    g.addLayer(L.marker([a.lat, a.lon], { pane: "pts", icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div class="warrow">' + (calm ? '<svg width="30" height="30"><circle cx="15" cy="15" r="5" fill="none" stroke="#0F2240" stroke-width="2"/></svg>' : '<svg width="30" height="30" viewBox="0 0 30 30" style="transform:rotate(' + rot + 'deg)"><line x1="15" y1="25" x2="15" y2="7" stroke="#0F2240" stroke-width="2.4" stroke-linecap="round"/><polygon points="15,3 10,11 20,11" fill="#0F2240"/></svg>') + "<b>" + a.ws + "</b></div>" }) })
      .bindTooltip("<b>" + esc(state.lang === "en" ? a.nameEn : a.name) + "</b> (" + WXS() + ")<br>" + tx("Wind from ", "風向 ") + compass(a.wd) + " · " + a.ws + " m/s" + (a.temp != null ? "<br>" + a.temp + " °C" : ""))); });
  if (!state.showStations) return;
  let ns; if (cfg.delta) { const b = nodesFor(pol, { all: true }), s = nodesFor(pol, { all: true, sc: state.sc }); const sm = new Map(s.map((x) => [x.st.id, x.v])); ns = b.map((x) => ({ st: x.st, v: x.v ? ((sm.get(x.st.id) - x.v) / x.v) * 100 : 0, d: true })); }
  else ns = cfg.metric ? metricNodes(pol, null) : nodesFor(pol, { all: true, ax: cfg.ax, sc: cfg.sc ? state.sc : null });
  ns.forEach((x, i) => { const s = x.st, col = x.d ? deltaCol(x.v) : bandOf(pol, x.v).hex, lab = x.d ? (x.v > 0 ? "+" : "") + x.v.toFixed(0) + "%" : fmt(pol, x.v);
    const cls = "stn" + (s.road ? " road" : "") + (s.model ? " model" : "") + (inArea(s) ? "" : " dim") + (state.selected === s.id ? " sel" : "");
    const html = '<div class="' + cls + '" style="--rc:' + col + ";--pd:" + ((i % 9) * .25).toFixed(2) + 's">' + (inArea(s) && !x.d && isLiveStn(s) ? '<span class="ring"></span><span class="ring r2"></span>' : "") + '<span class="core"><span class="lab"' + (x.d && Math.abs(x.v) < 1 ? ' style="color:#3C4250;text-shadow:none"' : "") + ">" + lab + "</span></span></div>";
    const mk = L.marker([s.lat, s.lon], { pane: "pts", icon: L.divIcon({ className: "", iconSize: [0, 0], html }) });
    mk.bindTooltip("<b>" + esc(sName(s)) + "</b><br>" + esc(tr(s.muni)) + " · " + typeLabel(s) + "<br>" + POLS[pol].label + ": <b>" + lab + (x.d ? "" : " " + U(pol)) + "</b>" + (s.obsTime ? "<br><span style='font-size:10px'>" + fmtT(s.obsTime) + "</span>" : ""));
    mk.on("click", () => { state.selected = s.id; state.screen = "hotspot"; render(); window.scrollTo(0, 0); }); g.addLayer(mk); });
}
function typeLabel(s) { return s.model ? tx("Model point (Open-Meteo)", "モデル点（Open-Meteo）") : s.road ? tx("Roadside", "自排局") : tx("General", "一般局"); }
function isLiveStn(s) { return !s.model && !isSample() && !D.modelOnly && !(D.latest && D.latest.stale); }
function shapeKey(onMap, cfg) {
  cfg = cfg || {};
  const hasRoad = D.stations.some((s) => s.road), hasModel = D.stations.some((s) => s.model), hasGen = D.stations.some((s) => !s.road && !s.model);
  const it = (cls, lab, tip) => '<span class="sk" title="' + esc(tip) + '"><i class="skm ' + cls + '"></i>' + lab + "</span>";
  const wind = onMap && !cfg.delta && (cfg.wind != null ? cfg.wind : state.showWind) && D.amedas.some((a) => a.ws != null);
  const hosp = onMap && (cfg.hosp || state.showHosp) && D.hosp.length;
  const lez = onMap && (cfg.lez || ((cfg.sc || cfg.delta) && state.sc.lez));
  return '<span class="shapekey' + (onMap ? " onmap" : "") + '">' + (onMap ? '<b class="skt">' + tx("Map key", "凡例") + "</b>" : "")
    + (hasGen ? it("gen", tx("General station", "一般局"), tx("Neighbourhood air, away from busy roads", "生活環境の大気（幹線道路から離れた地点）")) : "")
    + (hasRoad ? it("road", tx("Roadside station", "自排局"), tx("Next to major roads; reads higher for traffic pollution", "幹線道路沿い。交通由来の汚染が高めに出る")) : "")
    + (hasModel ? it("model", tx("Model point (Open-Meteo)", "モデル点（Open-Meteo）"), tx("European model estimate at a town or ward centre, not a station", "市区町村代表点の欧州モデル推計（測定局ではない）")) : "")
    + (D.stations.some(isLiveStn) ? it("live", tx("Pulsing = live measurement", "点滅＝ライブ実測"), tx("Official station reporting live readings", "ライブで報告中の公的測定局")) : "")
    + (wind ? it("wind", tx("Wind arrow (m/s)", "風向・風速（m/s）"), tx("Arrow points where the wind blows to; number is speed in metres per second; small circle = calm", "矢印は風が吹いていく方向、数字は風速（m/s）、小円は静穏")) : "")
    + (hosp ? it("hosp", tx("Hospital", "病院"), tx("Hospital location; hover for the estimated level there", "病院の位置。カーソルで推計値を表示")) : "")
    + (lez ? it("lez", tx("Low emission zone (LEZ)", "低排出ゾーン"), tx("Red line = Umeda–Namba axis; dashed circle = 3 km area where the LEZ effect applies", "赤線＝梅田〜難波軸、破線円＝効果が及ぶ3km圏")) : "")
    + (onMap && cfg.showBox ? it("box", tx("Selected zoom area", "選択中の範囲"), tx("Dashed box shows the area of the selected zoom level", "破線枠は選択中の空間スケールの範囲")) : "")
    + (onMap && cfg.delta ? "" : onMap ? '<span class="sk muted" title="' + esc(tx("Marker colour shows the level against Japan's standard; see the legend below the map", "マーカーの色は環境基準に対するレベル。地図下の凡例を参照")) + '">' + tx("Colour = level", "色＝濃度レベル") + "</span>" : "")
    + (onMap && state.showSurface && !cfg.delta ? '<span class="sk muted" title="' + esc(tx("Soft colour between markers is an estimate from nearby points (not measured)", "マーカー間の淡い色は近隣地点からの推計（実測ではない）")) + '">' + tx("Shading = estimate", "淡色＝推計") + "</span>" : "")
    + "</span>";
}
function mapLegend(pol, extra) { pol = pol || state.pol; const p = POLS[pol], t = p.th;
  const r = ["≤ " + t[0], t[0] + "–" + t[1], t[1] + "–" + t[2], t[2] + "–" + t[3], "> " + t[3]];
  return '<div class="maplegend">' + shapeKey(false) + '<span class="sksep"></span>' + RAMP.map((c, i) => '<span><i style="background:' + c + '"></i>' + tr((pol === "ox" ? BANDN_OX : BANDN)[i]) + " (" + r[i] + ")</span>").join("") + '<span class="muted">' + U(pol) + "</span>" + (extra || "") + '<span style="margin-left:auto" class="muted">' + tr(p.note) + "</span></div>"; }
const BASE_GROUPS = [{ n: { en: "Esri", ja: "Esri" }, k: ["esri", "esritopo", "esrigray", "esristreet"] }, { n: { en: "GSI (Japan)", ja: "国土地理院" }, k: ["pale", "std", "photo"] }, { n: { en: "Other", ja: "その他" }, k: ["carto"] }];
function baseSelect() { return '<span class="basesel">' + icon("layers") + '<select data-act="base" title="' + tx("Background map", "背景地図") + '">' + BASE_GROUPS.map((g) => '<optgroup label="' + tr(g.n) + '">' + g.k.map((k) => '<option value="' + k + '"' + (state.basemap === k ? " selected" : "") + ">" + tr(BASEMAPS[k]) + "</option>").join("") + "</optgroup>").join("") + "</select></span>"; }
function mapBar(opts) { opts = opts || {}; const chip = (k, l) => '<button class="mapchip' + (state[k] ? " on" : "") + '" data-act="tog" data-k="' + k + '">' + l + "</button>";
  return '<div class="mapbar no-print">' + chip("showSurface", tx("Shading between points", "地点間の推計")) + chip("showStations", D.modelOnly ? tx("Model points", "モデル点") : tx("Stations", "測定局")) + chip("showWind", tx("Wind", "風") + " (" + WXS() + ")") + (D.hosp.length ? chip("showHosp", tx("Hospitals", "病院")) : "") + (opts.extra || "") + baseSelect() + "</div>"; }
function basePicker() { return '<div class="card pad no-print" style="margin-top:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 18px"><label style="font-size:12.5px;font-weight:600;color:var(--ink-2)">' + icon("layers") + " " + tx("Background map", "背景地図") + "</label>"
  + baseSelect()
  + '<label style="font-size:12.5px;font-weight:600;color:var(--ink-2)">' + tx("Shading strength", "推計面の濃さ") + '</label><input type="range" min="0" max="70" value="' + Math.round(state.surfaceOpacity * 100) + '" data-act="haze" style="width:120px;accent-color:var(--ai)"/>'
  + '<span class="muted" style="font-size:11.5px;flex:1;min-width:220px">' + tx("Background maps: Esri or the Geospatial Information Authority of Japan. No cadastral or parcel data.", "背景地図：Esriまたは国土地理院。地籍・筆界データは使用していません。") + "</span></div>"; }

/* ================= CHARTS ================= */
function lineChart(o) {
  const W = 980, H = o.H || 250, pl = 50, pr = 16, pt = 16, pb = 32; const n = o.n;
  const all = []; o.series.forEach((s) => s.vals.forEach((v) => v != null && all.push(v))); if (o.band) o.band.hi.forEach((v) => v != null && all.push(v)); (o.refs || []).forEach((r) => all.push(r.v));
  if (!all.length || n < 2) return '<p class="muted">' + tx("Not enough data yet.", "まだデータが不足しています。") + "</p>";
  const mx = Math.max(...all) * 1.12 || 1, x = (i) => pl + (i / (n - 1)) * (W - pl - pr), y = (v) => H - pb - (v / mx) * (H - pt - pb);
  let s = ""; for (let k = 0; k <= 4; k++) { const vv = (mx * k) / 4, yy = y(vv); s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + yy + '" y2="' + yy + '" stroke="#EEF0F4"/><text x="' + (pl - 6) + '" y="' + (yy + 3) + '" font-size="9.5" fill="#6B7282" text-anchor="end">' + (mx < 1 ? vv.toFixed(2) : Math.round(vv)) + "</text>"; }
  (o.refs || []).forEach((r) => { if (r.v > mx) return; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(r.v) + '" y2="' + y(r.v) + '" stroke="' + r.c + '" stroke-dasharray="5 4" stroke-width="1.3"/><text x="' + (W - pr) + '" y="' + (y(r.v) - 4) + '" font-size="9.5" fill="' + r.c + '" text-anchor="end" font-weight="700">' + esc(r.label) + "</text>"; });
  if (o.band) { const up = [], dn = []; o.band.hi.forEach((v, i) => { if (v != null) { up.push(x(i) + "," + y(v)); dn.unshift(x(i) + "," + y(o.band.lo[i])); } }); if (up.length) s += '<polygon points="' + up.concat(dn).join(" ") + '" fill="#6A3FA0" opacity=".13"/>'; }
  o.series.forEach((se) => { let d = "", pen = false; se.vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1) + " "; pen = true; });
    s += '<path d="' + d + '" fill="none" stroke="' + se.c + '" stroke-width="' + (se.w || 2.2) + '"' + (se.dash ? ' stroke-dasharray="5 4"' : "") + "/>"; });
  if (o.labels) for (let i = 0; i < n; i++) { const l = o.labels(i); if (l) s += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="9.5" fill="#6B7282" text-anchor="middle">' + l + "</text>"; }
  if (o.nowI != null) s += '<line x1="' + x(o.nowI) + '" x2="' + x(o.nowI) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="#9AA3B2" stroke-dasharray="3 3"/><text x="' + x(o.nowI) + '" y="' + (pt + 9) + '" font-size="9.5" font-weight="700" fill="#3C4250" text-anchor="middle">' + tx("now", "現在") + "</text>";
  if (o.markI != null && o.markV != null) s += '<line x1="' + x(o.markI) + '" x2="' + x(o.markI) + '" y1="' + pt + '" y2="' + (H - pb) + '" stroke="#BC002D" stroke-width="1.5"/><circle cx="' + x(o.markI) + '" cy="' + y(o.markV) + '" r="5.5" fill="#BC002D" stroke="#fff" stroke-width="2"/>';
  return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img">' + s + "</svg>" + (o.legend ? '<div class="legend">' + o.legend.map((l) => '<span><i style="background:' + l[1] + ";" + (l[2] ? "opacity:.35" : "") + '"></i>' + l[0] + "</span>").join("") + "</div>" : "");
}
function barsChart(vals, pol, labels, hi) { const W = 980, H = 170, pl = 40, pb = 26, pt = 10, mx = Math.max(...vals.filter((v) => v != null), 0.0001) * 1.15, bw = (W - pl - 10) / vals.length;
  let s = ""; vals.forEach((v, i) => { if (v == null) return; const h = (v / mx) * (H - pt - pb); s += '<rect x="' + (pl + i * bw + 2) + '" y="' + (H - pb - h) + '" width="' + (bw - 4) + '" height="' + h + '" rx="3" fill="' + (i === hi ? "#BC002D" : bandOf(pol, v).hex) + '"/>'; if (labels[i]) s += '<text x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 8) + '" font-size="9.5" fill="#6B7282" text-anchor="middle">' + labels[i] + "</text>"; });
  s += '<text x="' + (pl - 6) + '" y="' + (pt + 8) + '" font-size="9.5" fill="#6B7282" text-anchor="end">' + fmt(pol, mx / 1.15) + "</text>"; return '<svg viewBox="0 0 ' + W + " " + H + '" width="100%">' + s + "</svg>"; }
function roseSvg(r, pol) { if (!r) return '<p class="muted" style="font-size:12.5px">' + tx("Not enough wind records at this point.", "この地点は風向データが不足しています。") + "</p>";
  const mx = Math.max(...r.bins.map((b) => b.v || 0), 0.0001), cx = 110, cy = 110, R = 88; let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#FAFBFD" stroke="#E6E9EF"/><circle cx="' + cx + '" cy="' + cy + '" r="' + R / 2 + '" fill="none" stroke="#EEF0F4"/>';
  r.bins.forEach((b, i) => { if (b.v == null) return; const a0 = ((i * 45 - 20) * Math.PI) / 180, a1 = ((i * 45 + 20) * Math.PI) / 180, rr = 14 + (b.v / mx) * (R - 14);
    s += '<path d="M' + cx + " " + cy + " L" + (cx + rr * Math.sin(a0)) + " " + (cy - rr * Math.cos(a0)) + " A" + rr + " " + rr + " 0 0 1 " + (cx + rr * Math.sin(a1)) + " " + (cy - rr * Math.cos(a1)) + ' Z" fill="' + bandOf(pol, b.v).hex + '" opacity=".85" stroke="#fff"><title>' + b.n + " h</title></path>"; });
  ["N", "E", "S", "W"].forEach((d, i) => { s += '<text x="' + (cx + (R + 11) * Math.sin((i * Math.PI) / 2)) + '" y="' + (cy - (R + 11) * Math.cos((i * Math.PI) / 2) + 4) + '" font-size="11" font-weight="700" fill="#3C4250" text-anchor="middle">' + (state.lang === "ja" ? "北東南西"[i] : d) + "</text>"; });
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="13" fill="#fff" stroke="#D6DBE4"/><text x="' + cx + '" y="' + (cy + 3.5) + '" font-size="9" text-anchor="middle" fill="#3C4250">' + (r.calm.v != null ? fmt(pol, r.calm.v) : "") + "</text>";
  return '<svg viewBox="-12 -12 244 244" width="230" height="230">' + s + "</svg>"; }
function stackBar(parts, h) { const tot = parts.reduce((a, p) => a + Math.max(0, p[1]), 0) || 1; return '<div class="srcbar" style="' + (h ? "height:" + h + "px" : "") + '">' + parts.map((p) => (p[1] / tot < 0.005 ? "" : '<div title="' + esc(p[0]) + " " + Math.round((p[1] / tot) * 100) + '%" style="width:' + ((p[1] / tot) * 100).toFixed(1) + "%;background:" + p[2] + '"></div>')).join("") + "</div>"; }
const PARTC = { bg: "#8C96A8", urb: "#1B365D", road: "#BC002D" };

/* ================= SHELL ================= */
const VIEWS = [{ k: "live", ic: "sat", n: { en: "Official", ja: "公式" }, d: { en: "Official Japanese station measurements (needs the site deployed on GitHub)", ja: "日本の公的測定局の実測（GitHubへのデプロイが必要）" } },
  { k: "blend", ic: "merge", n: { en: "Blended", ja: "ブレンド" }, d: { en: "Official stations, with Open-Meteo model points filling gaps and the forecast", ja: "公的測定局＋空白域と予測をOpen-Meteoモデルで補完" } },
  { k: "om", ic: "globe", n: { en: "Open-Meteo (EU model)", ja: "Open-Meteo（欧州モデル）" }, d: { en: "European Copernicus model, fetched live by the browser — works from a desktop file", ja: "欧州コペルニクスモデルをブラウザが直接取得（デスクトップでも動作）" } },
  { k: "sample", ic: "flask", n: { en: "Sample", ja: "サンプル" }, d: { en: "Built-in snapshot, works offline; every value invented", ja: "内蔵スナップショット（オフライン可・値は作成値）" } }];
const GROUPS = { see: [{ en: "See", ja: "見る" }, { en: "What the air is doing now", ja: "今の大気の状態" }], und: [{ en: "Understand", ja: "理解する" }, { en: "What drives it, who it affects", ja: "要因と影響" }],
  pre: [{ en: "Predict", ja: "予測する" }, { en: "What happens next", ja: "これから" }], test: [{ en: "Test", ja: "検証する" }, { en: "Try measures before acting", ja: "施策を事前に試す" }], act: [{ en: "Act", ja: "行動する" }, { en: "Decide, and show why", ja: "判断と説明" }] };
const SCREENS = [{ id: "home", g: "see", n: { en: "Overview", ja: "概要" }, ic: "globe" }, { id: "live", g: "see", n: { en: "Live Map", ja: "ライブマップ" }, ic: "map" }, { id: "time", g: "see", n: { en: "Through the Week", ja: "1週間の推移" }, ic: "clock" },
  { id: "attrib", g: "und", n: { en: "What Drives It", ja: "汚染の要因" }, ic: "search" }, { id: "hotspot", g: "und", n: { en: "Hotspots", ja: "ホットスポット" }, ic: "target" }, { id: "exposure", g: "und", n: { en: "Who Breathes It", ja: "影響を受ける人口" }, ic: "users" },
  { id: "forecast", g: "pre", n: { en: "Next 3 Days", ja: "3日間の見通し" }, ic: "trend" }, { id: "episodes", g: "pre", n: { en: "Smog & Asian Dust (Kōsa)", ja: "光化学スモッグ・黄砂" }, ic: "sun" },
  { id: "scen", g: "test", n: { en: "Scenario Analysis", ja: "シナリオ分析" }, ic: "beaker" }, { id: "compare", g: "test", n: { en: "Compare Packages", ja: "施策パッケージ比較" }, ic: "scales" }, { id: "zoom", g: "test", n: { en: "Zoom Levels", ja: "空間スケール" }, ic: "layers" },
  { id: "alerts", g: "act", n: { en: "Alerts", ja: "アラート" }, ic: "bell" }, { id: "kpi", g: "act", n: { en: "Measuring Success", ja: "成果の測り方" }, ic: "gauge" }, { id: "brief", g: "act", n: { en: "Executive Brief", ja: "エグゼクティブ・ブリーフ" }, ic: "file" }, { id: "method", g: "act", n: { en: "Data & Method", ja: "データと手法" }, ic: "database" }];
function badge() {
  const mk = modeKind(), t = fmtT(D.latest && D.latest.observedAt, false);
  if (mk === "sample") return '<span class="pill tag-demo">' + icon("flask") + tx("Sample data", "サンプルデータ") + "</span>";
  if (mk === "om") return '<span class="pill tag-violet"><span class="livedot"></span>' + tx("Live · Open-Meteo EU model", "ライブ・Open-Meteo欧州モデル") + " · " + t + "</span>";
  if (mk === "blend") return '<span class="pill tag-blue"><span class="livedot"></span>' + tx("Live · official + Open-Meteo", "ライブ・公式＋Open-Meteo") + " · " + t + "</span>";
  return '<span class="pill ' + (mk === "aqicn" ? "tag-blue" : "tag-live") + '"><span class="livedot"></span>' + (mk === "aqicn" ? tx("Live · AQICN backup", "ライブ・AQICN予備") : tx("Live · official stations", "ライブ・公的測定局")) + " · " + t + (D.latest.stale ? " · " + tx("stale", "更新停止中") : "") + "</span>";
}
function sideCard() {
  const p = state.pol, a = areaAvg(p), b = bandOf(p, a), n = nodesFor(p).length, w = D.wxOsaka, f = D.gen;
  return '<div class="sidecard"><div style="font-weight:700;font-size:13px">' + esc(areaName()) + '</div><div class="muted" style="font-size:10.5px;margin-bottom:6px">' + tr(VIEWS.find((v) => v.k === state.view).n) + (state.note ? " → " + tr(VIEWS.find((v) => v.k === (modeKind() === "om" ? "om" : "sample")).n) : "") + "</div>"
    + '<div class="row"><span>' + tx("Showing", "表示") + "</span><b>" + POLS[p].label + "</b></div>"
    + '<div class="row"><span>' + tx("Average", "平均") + "</span><b>" + fmt(p, a) + " " + U(p) + "</b></div>"
    + '<div class="row"><span>' + tx("Level", "レベル") + '</span><b style="color:' + b.hex + '">' + b.name + "</b></div>"
    + '<div class="row"><span>' + (D.modelOnly ? tx("Model points", "モデル点") : tx("Points reporting", "報告地点")) + "</span><b>" + n + "</b></div>"
    + '<div class="row"><span>' + tx("Observed", "観測時刻") + "</span><b>" + fmtT(D.latest.observedAt) + "</b></div>"
    + (w ? '<div class="row"><span>' + tx("Wind, Osaka", "風（大阪）") + "</span><b>" + compass(w.wd) + " " + w.ws + " m/s</b></div>" : "")
    + (modeKind() === "official" && f ? '<div class="row"><span>' + tx("Next collection", "次回収集") + "</span><b>" + fmtT(new Date(Date.parse(f) + 30 * 60e3).toISOString(), false) + "</b></div>" : "") + "</div>";
}
function render() {
  const app = document.getElementById("app"); destroyMaps(); MAPREG = {};
  document.documentElement.lang = state.lang;
  document.getElementById("db-chip").textContent = tx("Sample demo", "サンプルデモ"); document.getElementById("db-t").textContent = tx("Digital Twin — Art of the Possible", "デジタルツイン — Art of the Possible");
  document.getElementById("db-n").textContent = tx("Illustrative only · not an operational system", "例示目的 · 運用システムではありません");
  document.getElementById("db-lang").innerHTML = '<span class="seg lang" title="Language / 言語"><button class="' + (state.lang === "en" ? "on" : "") + '" data-act="lang" data-l="en">English</button><button class="' + (state.lang === "ja" ? "on" : "") + '" data-act="lang" data-l="ja">日本語</button></span>';
  if (!state.loaded) { app.innerHTML = '<div class="main"><div class="loadwrap">' + LOGO.replace('class="glyph"', 'style="width:64px;height:64px"') + '<div class="spinner"></div><h2>' + tx("Loading Osaka air quality data", "大阪の大気データを読み込み中") + '</h2><p class="muted">' + tr(VIEWS.find((v) => v.k === state.view).d) + "</p></div></div>"; return; }
  let nav = "", last = null;
  SCREENS.forEach((s) => { if (s.g !== last) { nav += '<div class="navgrp"><span class="dot"></span>' + tr(GROUPS[s.g][0]) + "</div>"; last = s.g; } nav += '<button class="nav-item' + (state.screen === s.id ? " active" : "") + '" data-act="nav" data-s="' + s.id + '">' + icon(s.ic) + "<span>" + tr(s.n) + "</span></button>"; });
  app.innerHTML = '<aside class="sidebar no-print"><div class="brand"><div class="mark">' + LOGO + '<div><div class="name">' + tx("Osaka Air Quality<br>Digital Twin", "大阪 大気環境<br>デジタルツイン") + '</div><div class="sub">' + tx("See · Understand · Act", "見る・理解する・行動する") + "</div></div></div></div><nav class=\"nav\">" + nav + "</nav>" + sideCard() + "</aside>"
    + '<div class="main-wrap"><header class="topbar no-print">'
    + '<div class="selwrap">' + icon("pin") + "<label>" + tx("Area", "エリア") + '</label><select data-act="area">' + AREAS.map((a) => '<option value="' + a.k + '"' + (state.area === a.k ? " selected" : "") + ">" + tr(a) + "</option>").join("") + "</select></div>"
    + '<div class="seg" title="' + tx("Which data the twin is using", "使用データ") + '">' + VIEWS.map((v) => '<button class="' + (state.view === v.k ? "on" : "") + '" data-act="view" data-v="' + v.k + '" title="' + esc(tr(v.d)) + '">' + icon(v.ic) + tr(v.n) + "</button>").join("") + "</div>"
    + badge() + '<div class="spacer"></div>'
    + '<div class="polwrap"><div class="polsel">' + Object.keys(POLS).map((k) => '<button class="' + (state.pol === k ? "on" : "") + '" data-act="pol" data-p="' + k + '" title="' + esc(tr(POLS[k].full)) + '">' + POLS[k].label + "<small>" + tr(POLS[k].short) + "</small></button>").join("") + '</div><div class="polfull"><b>' + POLS[state.pol].label + "</b> — " + tr(POLS[state.pol].full) + "</div></div>"
    + '<button class="btn sm" data-act="refresh">' + icon("refresh") + tx("Refresh", "更新") + "</button>"
    + '</header><main class="main">' + body() + "</main></div>";
  mountMaps();
}
function head(t, s) { const cur = SCREENS.find((x) => x.id === state.screen);
  return '<div class="chain no-print">' + Object.keys(GROUPS).map((g) => '<div class="st' + (g === cur.g ? " on" : "") + '"><div class="cn">' + tr(GROUPS[g][0]) + '</div><div class="cd">' + tr(GROUPS[g][1]) + "</div></div>").join("") + "</div>"
    + '<div class="eyebrow">' + tr(cur.n) + " · " + esc(areaName()) + '</div><h1 class="h-page">' + t + '</h1><p class="sub" style="margin-bottom:18px">' + s + "</p>" + modeBanner(); }
function modeBanner() {
  const n = state.note, desk = IS_FILE ? tx(" (the page is opened from a desktop file, so the collected official files cannot be read)", "（デスクトップ上のファイルとして開かれているため、収集済みの公式ファイルを読み込めません）") : tx(" (no recent collection run yet)", "（最近のデータ収集がまだありません）");
  if (n === "nolive") return '<div class="callout warn" style="margin-bottom:16px">' + icon("alert") + " <b>" + tx("Official station data is not available here", "ここでは公的測定局のデータを利用できません") + "</b>" + desk + (state.autoSample ? tx(". Open-Meteo could not be reached either, so the sample is shown.", "。Open-Meteoにも接続できないため、サンプルを表示しています。") : tx(". Showing live <b>Open-Meteo European model</b> data instead.", "。代わりに<b>Open-Meteo欧州モデル</b>のライブデータを表示しています。")) + " " + (IS_FILE ? tx("Japan's official readings need the collector to run — on GitHub, or on this computer.", "日本の公式測定値を表示するには、収集処理の実行（GitHubまたはこのPC上）が必要です。") : tx("Check the latest run on the GitHub <b>Actions</b> tab.", "GitHubの<b>Actions</b>タブで最新の実行結果を確認してください。")) + "</div>";
  if (n === "blend-om") return '<div class="callout info" style="margin-bottom:16px">' + icon("merge") + " <b>" + tx("Blended — official data not available here", "ブレンド — ここでは公式データを利用できません") + "</b>" + desk + (IS_FILE ? tx(", so this shows the Open-Meteo European model only. Deploy to GitHub to add Japan's official station measurements.", "。このためOpen-Meteo欧州モデルのみを表示しています。GitHubにデプロイすると日本の公的測定局の実測値が加わります。") : tx(", so this shows the Open-Meteo European model only. Official stations will be added automatically once the GitHub collection run succeeds (see the Actions tab).", "。このためOpen-Meteo欧州モデルのみを表示しています。GitHubのデータ収集が成功すると公的測定局が自動的に加わります（Actionsタブ参照）。")) + "</div>";
  if (n === "omfail") return '<div class="callout warn" style="margin-bottom:16px">' + icon("alert") + " " + (OM_ERR === "rate" ? tx("Open-Meteo's free daily limit has been reached for this network. Showing the sample; try again later.", "このネットワークでOpen-Meteoの無料利用上限に達しました。サンプルを表示中です。しばらくしてから再試行してください。") : tx("Open-Meteo could not be reached from this network. Showing the sample.", "このネットワークからOpen-Meteoに接続できませんでした。サンプルを表示中。")) + "</div>";
  if (n === "blend-noom") return '<div class="callout info" style="margin-bottom:16px">' + icon("info") + " " + tx("Open-Meteo could not be reached, so Blended shows official data only.", "Open-Meteoに接続できないため、ブレンドは公式データのみです。") + "</div>";
  const mk = modeKind();
  if (mk === "sample") return '<div class="callout" style="margin-bottom:16px">' + icon("flask") + " <b>" + tx("Sample snapshot — every value is invented.", "サンプル — すべての値は作成値です。") + "</b></div>";
  if (mk === "om") return '<div class="callout" style="margin-bottom:16px;border-color:var(--violet);background:#F6F2FB;color:#4a2a78">' + icon("globe") + " <b>" + tx("Open-Meteo — European model data.", "Open-Meteo — 欧州モデルデータ。") + "</b> " + tx("Live values from the EU Copernicus (CAMS) model at municipal centre points, not measurements by Japanese stations. Roadside peaks are smoothed out.", "欧州連合コペルニクス（CAMS）モデルによる市区町村代表点のライブ値で、日本の測定局の実測ではありません。沿道のピークは平準化されます。") + "</div>";
  if (mk === "blend") return '<div class="callout info" style="margin-bottom:16px">' + icon("merge") + " <b>" + tx("Blended.", "ブレンド。") + "</b> " + tx("Official Japanese station measurements, plus Open-Meteo European model points (dashed) where no station is within 6 km, and the Open-Meteo forecast corrected against the stations.", "日本の公的測定局の実測に、6km以内に測定局が無い場所のOpen-Meteo欧州モデル点（破線）と、測定局で補正したOpen-Meteo予測を加えています。") + "</div>";
  if (D.latest.stale) return '<div class="callout warn" style="margin-bottom:16px">' + icon("alert") + " " + tx("The latest collection failed; showing the most recent official data.", "直近の収集に失敗したため、最後に取得した公式データを表示しています。") + "</div>";
  return "";
}
function kpi(k, v, m, c) { return '<div class="kpi"><div class="k">' + k + '</div><div class="v"' + (c ? ' style="color:' + c + '"' : "") + ">" + v + '</div><div class="m">' + (m || "") + "</div></div>"; }
function ins(ic, t, b, bg, c) { return '<div class="insightbox"><div class="ib-ic" style="background:' + (bg || "var(--ai-050)") + ";color:" + (c || "var(--ai)") + '">' + icon(ic) + '</div><div><div class="ib-t">' + t + '</div><div class="ib-b">' + b + "</div></div></div>"; }
function toast(m) { const el = document.getElementById("toast"); el.textContent = m; el.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2300); }

/* ================= EVENTS ================= */
let _deb = null, _play = null;
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act]"); if (!t) return; const a = t.dataset.act;
  if (a === "nav") { stopPlay(); state.screen = t.dataset.s; window.scrollTo(0, 0); render(); }
  else if (a === "pol") { state.pol = t.dataset.p; save(); render(); }
  else if (a === "lang") { state.lang = t.dataset.l; save(); if (state.loaded) prepare(); render(); }
  else if (a === "view") { if (state.view === t.dataset.v) return; state.view = t.dataset.v; save(); state.loaded = false; state.tIdx = null; render(); loadData().then(() => { state.mapViews = {}; render(); }); }
  else if (a === "refresh") { OM_CACHE = null; loadData().then(() => { render(); toast(tx("Data refreshed", "データを更新しました")); }); }
  else if (a === "tog") { state[t.dataset.k] = !state[t.dataset.k]; render(); }
  else if (a === "areaset") { state.area = t.dataset.v; state.refit = true; save(); render(); }
  else if (a === "pick") { state.selected = t.dataset.s; if (t.dataset.go) state.screen = t.dataset.go; render(); if (t.dataset.go) window.scrollTo(0, 0); }
  else if (a === "print") window.print();
  else if (typeof onPageClick === "function") onPageClick(a, t, e);
});
document.addEventListener("change", (e) => { const t = e.target.closest("[data-act]"); if (!t) return;
  if (t.dataset.act === "area") { state.area = t.value; state.refit = true; save(); render(); }
  else if (t.dataset.act === "base") { state.basemap = t.value; save(); MAPS.forEach(setBase); document.querySelectorAll('[data-act="base"]').forEach((s) => (s.value = t.value)); }
  else if (t.dataset.act === "pickSel") { state.selected = t.value; render(); } });
document.addEventListener("input", (e) => { const t = e.target.closest("[data-act]"); if (!t) return;
  if (t.dataset.act === "haze") { state.surfaceOpacity = +t.value / 100; MAPS.forEach((m) => m._surf.draw()); }
  else if (typeof onPageInput === "function") onPageInput(t.dataset.act, t, e); });
function stopPlay() { state.tPlaying = false; if (_play) { clearInterval(_play); _play = null; } }

/* ================= START ================= */
async function boot() { render(); await loadData(); render(); setInterval(() => { if (isSample() || state.tPlaying) return; const g = D.latest && D.latest.observedAt; loadData().then(() => { if ((D.latest && D.latest.observedAt) !== g) { render(); toast(tx("New live data loaded", "新しいライブデータを読み込みました")); } }); }, 30 * 60e3); }
if (window.__leafletReady) boot(); else window.addEventListener("leaflet-done", boot, { once: true });
