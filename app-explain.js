"use strict";
/* Osaka Air Quality Digital Twin — explanation layer (v12)
   Floating key for M / C / F / R / A, hover explanations, chart captions, glossary. Load last. */
const GLOSS = [
  ["PM2\\.5", "Fine particulate matter — particles 2.5 micrometres or smaller (smoke, exhaust, particles formed in the air). Unit µg/m³. Japan's standard: daily mean ≤ 35, annual ≤ 15.", "微小粒子状物質（粒径2.5µm以下：煙・排気・大気中で生成する粒子）。単位µg/m³。環境基準：日平均35以下・年平均15以下。"],
  ["PM10", "Particles 10 micrometres or smaller. Used by the European model; Japan measures SPM instead.", "粒径10µm以下の粒子。欧州モデルの指標で、日本ではSPMを測定。"],
  ["NO₂|NO2", "Nitrogen dioxide — mainly from road traffic and combustion. Unit ppb. Japan's standard: daily mean within or below 40–60 ppb.", "二酸化窒素 — 主に道路交通・燃焼由来。単位ppb。環境基準：日平均0.04〜0.06 ppmのゾーン内又はそれ以下。"],
  ["Ox", "Photochemical oxidants (primarily ozone) — formed when sunlight acts on pollution; the cause of photochemical smog. Unit ppb. Standard: hourly ≤ 60; advisory 120; warning 240.", "光化学オキシダント（主にオゾン）— 日射により生成し、光化学スモッグの原因。単位ppb。環境基準：1時間値60以下・注意報120・警報240。"],
  ["O₃", "Ozone — the main part of photochemical oxidants (Ox).", "オゾン — 光化学オキシダント（Ox）の主成分。"],
  ["SO₂|SO2", "Sulphur dioxide — from ships, the port and industry burning sulphur-containing fuel. Unit ppb. Standard: daily mean ≤ 40, hourly ≤ 100.", "二酸化硫黄 — 船舶・港湾・含硫燃料を使う工場由来。単位ppb。環境基準：日平均40以下・1時間値100以下。"],
  ["CO", "Carbon monoxide — from incomplete combustion, mostly vehicles. Unit ppm. Standard: daily mean ≤ 10, 8-hour mean ≤ 20.", "一酸化炭素 — 不完全燃焼（主に自動車）由来。単位ppm。環境基準：日平均10以下・8時間平均20以下。"],
  ["SPM", "Suspended particulate matter — particles 10 micrometres or smaller; Japan's coarse-particle measure, which rises sharply during Asian dust (kōsa). Unit mg/m³. Standard: daily mean ≤ 0.10, hourly ≤ 0.20.", "浮遊粒子状物質 — 粒径10µm以下。日本の粗大粒子の指標で、黄砂の際に大きく上昇。単位mg/m³。環境基準：日平均0.10以下・1時間値0.20以下。"],
  ["[Kk]ōsa|kosa|黄砂", "Asian dust (kōsa, 黄砂) — fine sand and soil blown from the deserts of China and Mongolia across Korea and Japan, mostly February to May. Raises SPM more than PM2.5. Reported by the Japan Meteorological Agency.", "黄砂（こうさ）— 中国・モンゴルの砂漠から舞い上がった砂や土が日本へ運ばれる現象。主に2〜5月。PM2.5よりSPMを大きく押し上げる。気象庁が情報を発表。"],
  ["Asian dust", "Asian dust (kōsa, 黄砂) — fine sand and soil blown from the deserts of China and Mongolia across Korea and Japan, mostly February to May.", "黄砂 — 中国・モンゴルの砂漠から飛来する砂じん。"],
  ["[Pp]hotochemical smog|光化学スモッグ", "Photochemical smog — haze formed when strong sunlight acts on traffic and industrial pollution; tracked through Ox. Mostly in summer afternoons.", "光化学スモッグ — 強い日射が交通・工場由来の汚染物質に作用して生じるもや。Oxで監視。主に夏の午後。"],
  ["[Pp]hotochemical oxidants?|光化学オキシダント", "Photochemical oxidants (Ox) — mostly ozone, formed in sunlight; the cause of photochemical smog.", "光化学オキシダント（Ox）— 主にオゾン。日射で生成し、光化学スモッグの原因。"],
  ["µg/m³", "Micrograms per cubic metre of air — the unit for PM2.5.", "マイクログラム毎立方メートル — PM2.5の単位。"],
  ["mg/m³", "Milligrams per cubic metre of air (1 mg = 1,000 µg) — the unit for SPM.", "ミリグラム毎立方メートル（1 mg = 1,000 µg）— SPMの単位。"],
  ["ppb", "Parts per billion — the unit used here for NO₂, Ox and SO₂ (Japan publishes ppm; 1 ppm = 1,000 ppb).", "10億分率 — 本ツインのNO₂・Ox・SO₂の単位（公表値はppm、1 ppm = 1,000 ppb）。"],
  ["ppm", "Parts per million — the unit for CO (1 ppm = 1,000 ppb).", "100万分率 — COの単位（1 ppm = 1,000 ppb）。"],
  ["m/s", "Metres per second — wind speed.", "メートル毎秒 — 風速。"],
  ["JST", "Japan Standard Time (UTC+9). All times on this page are JST.", "日本標準時（UTC+9）。"],
  ["AMeDAS|アメダス", "AMeDAS — the Japan Meteorological Agency's automated weather station network (wind, temperature, rain, sunshine).", "アメダス — 気象庁の地域気象観測システム（風・気温・降水・日照）。"],
  ["JMA", "JMA — Japan Meteorological Agency (気象庁), Japan's national weather service.", "JMA — 気象庁。"],
  ["CAMS", "CAMS — Copernicus Atmosphere Monitoring Service, the European Union's air-quality forecasting model (about 40 km grid over Japan).", "CAMS — 欧州連合コペルニクス大気監視サービス。大気質予測モデル（日本付近は約40kmメッシュ）。"],
  ["Copernicus|コペルニクス", "Copernicus — the European Union's Earth-observation programme; its CAMS model supplies the forecast and the Open-Meteo values.", "コペルニクス — 欧州連合の地球観測プログラム。CAMSモデルが予測とOpen-Meteoの値を提供。"],
  ["Open-Meteo", "Open-Meteo — a free service that publishes the European CAMS model and weather models. Its values are model estimates, not Japanese measurements.", "Open-Meteo — 欧州CAMSモデルや気象モデルを公開する無料サービス。値はモデル推計で、日本の実測ではない。"],
  ["AQICN", "AQICN — the World Air Quality Index project, which republishes official station data; used only as a backup.", "AQICN — 世界大気質指数プロジェクト。予備としてのみ使用。"],
  ["GSI|国土地理院", "GSI — Geospatial Information Authority of Japan, the national mapping agency (base maps and address search).", "国土地理院 — 日本の地図作成機関（背景地図・住所検索）。"],
  ["Esri", "Esri — the company behind ArcGIS; supplies the satellite, topographic, light grey and street background maps.", "Esri — ArcGISの提供企業。衛星画像・地形図などの背景地図を提供。"],
  ["Soramame", "Soramame-kun (そらまめくん) — the Ministry of the Environment's national air-pollution monitoring website (AEROS).", "そらまめくん — 環境省の大気汚染物質広域監視システム。"],
  ["WHO", "WHO — World Health Organization; its 2021 Air Quality Guidelines are stricter health-based values used for comparison.", "WHO — 世界保健機関。2021年大気質ガイドライン（健康ベースの比較値）。"],
  ["EQS", "EQS — Environmental Quality Standards, Japan's legal air-quality standards.", "EQS — 環境基準。"],
  ["COPD", "COPD — chronic obstructive pulmonary disease, a long-term lung condition sensitive to air pollution.", "COPD — 慢性閉塞性肺疾患。"],
  ["LEZ|[Ll]ow emission zone|低排出ゾーン", "Low emission zone (LEZ) — an area where older, higher-emitting vehicles are restricted. Here: the Umeda–Namba axis, effect up to 3 km.", "低排出ゾーン — 旧式・高排出車両の通行を制限する区域。本ツインでは梅田〜難波軸、効果は3kmまで。"],
  ["PLATEAU", "Project PLATEAU — the Ministry of Land, Infrastructure, Transport and Tourism's open 3D city models of Japan.", "PLATEAU — 国土交通省の3D都市モデル。"],
  ["MLIT", "MLIT — Ministry of Land, Infrastructure, Transport and Tourism (国土交通省).", "国土交通省。"],
  ["RMSE", "RMSE — root mean square error, a standard measure of typical forecast error.", "RMSE — 二乗平均平方根誤差。"],
  ["[Rr]egional background|広域バックグラウンド", "Regional background — pollution already in the air arriving from outside the area; measured at the cleanest tenth of general stations. Local measures cannot remove it.", "広域バックグラウンド — 域外から流入する汚染。一般局の最もきれいな1割の水準。地域の対策では除去できない。"],
  ["[Uu]rban increment|都市による上乗せ", "Urban increment — what the city itself adds on top of the regional background, measured at general stations.", "都市による上乗せ — 広域分に都市が加える分（一般局で測定）。"],
  ["[Rr]oadside increment|沿道の上乗せ", "Roadside increment — the extra right next to a busy road, compared with the two nearest general stations within 6 km.", "沿道の上乗せ — 自排局と6km以内の最寄り一般局2局との差。"],
  ["[Gg]eneral stations?|一般局", "General station (一般環境大気測定局) — measures neighbourhood air, away from busy roads. Rounded markers on the maps.", "一般局 — 幹線道路から離れた生活環境の大気を測定。地図では角の丸いマーカー。"],
  ["[Rr]oadside stations?|自排局", "Roadside station (自動車排出ガス測定局) — next to major roads; reads higher for traffic pollution. Square markers on the maps.", "自排局 — 幹線道路沿いの測定局。地図では四角のマーカー。"],
  ["[Mm]odel points?|モデル点", "Model point — an Open-Meteo European model value placed at a town or ward centre. Not a station. Dashed markers on the maps.", "モデル点 — 市区町村代表点に置いたOpen-Meteo欧州モデルの値（測定局ではない）。地図では破線マーカー。"],
  ["[Pp]ollution rose|汚染ローズ", "Pollution rose — each wedge shows the average level when the wind blew from that direction over the past week; longer and redder = higher. Centre = calm hours.", "汚染ローズ — 各扇形はその方向から風が吹いたときの平均値（過去1週間）。中央は静穏時。"],
  ["[Ss]tandard line|基準ライン", "Standard line — the colour-band boundary at Japan's standard for this pollutant (dashed orange line on charts).", "基準ライン — 環境基準に相当する境界（グラフの橙色破線）。"],
  ["[Aa]dvisory level|注意報レベル", "Advisory level — the national threshold for a photochemical smog advisory (Ox ≥ 120 ppb). Only Osaka Prefecture issues the official advisory.", "注意報レベル — 光化学スモッグ注意報の基準（Ox 120 ppb以上）。正式な発令は大阪府。"],
  ["[Ww]arning level|警報レベル", "Warning level — Ox ≥ 240 ppb, the prefectural photochemical smog warning threshold.", "警報レベル — Ox 240 ppb以上。"],
  ["[Ll]ikely range|予想範囲", "Likely range — where the value will probably fall (about 8 times in 10), based on past forecast error; it widens further ahead.", "予想範囲 — 過去の予測誤差に基づき、値が入る可能性が高い範囲（約8割）。"],
  ["[Pp]reliminary values?|速報値", "Preliminary values — hourly figures published immediately, which may be corrected later after quality checks.", "速報値 — 即時公表の1時間値。品質確認後に修正される場合がある。"],
  ["[Ss]ample data|サンプルデータ", "Sample data — a built-in snapshot for offline demonstration; every value is invented.", "サンプルデータ — オフラインデモ用の内蔵データ。値はすべて作成値。"],
];
const HEADS = {
  "24-hour mean": ["Average of the point's last 24 hourly values — the basis of Japan's daily standards.", ""], "24時間平均": ["", "直近24時間の1時間値の平均。"],
  "vs its own 24 h": ["How the latest hour compares with this point's own 24-hour average; red if more than 10% higher.", ""], "自地点24時間比": ["", "最新1時間値と自地点の24時間平均の比較。"],
  "Local share": ["Urban plus roadside parts as a share of the reading — the part local policy can influence.", ""], "地域由来": ["", "都市分＋沿道分の割合。"],
  "Share": ["Share of the area's total exposure burden (level × residents).", ""], "割合": ["", "エリア全体の負荷（濃度×人口）に占める割合。"],
  "Level": ["Colour band against Japan's standard: Good, Fair, Above standard, High, Very high (for Ox: Advisory, Warning).", ""], "レベル": ["", "環境基準に対する色区分。"],
  "Estimate": ["The forecast value for that time.", ""], "Confidence": ["How reliable the forecast is: high within 12 hours, moderate to 36 hours, lower beyond.", ""], "確からしさ": ["", "予測の確からしさ。"],
  "Ahead": ["Hours or days from now.", ""], "Nearest point": ["Distance to the nearest measurement or model point used for the estimate.", ""],
  "People": ["Residents (census-based population).", ""], "Error at a hidden point": ["Each point is hidden in turn and predicted from the others; this is the average miss — lower means the map is more reliable.", ""],
  "Typical spacing": ["Median distance from each point to its nearest neighbour.", ""], "Points above standard": ["Points above Japan's standard, assessed the way the standard is written (daily mean, or hourly for Ox).", ""],
  "Above the standard line": ["Points whose latest hour is above the standard-line colour boundary.", ""], "Controllable locally": ["Urban plus roadside parts — what local measures can reduce.", ""],
  "Average where people live": ["Population-weighted average: each municipality's level weighted by how many people live there.", ""], "People above the standard": ["Residents of municipalities whose estimated level is above Japan's standard.", ""],
  "Points reporting": ["Stations or model points with a value in the latest hour.", ""], "Observed": ["Time of the latest reading (JST).", ""],
};
const PILLS = [
  [".tag-live", "Live data from official stations.", "公的測定局のライブデータ。"], [".tag-violet", "Live values from the European Open-Meteo (CAMS) model — estimates, not measurements.", "欧州Open-Meteo（CAMS）モデルのライブ値（推計値）。"],
  [".tag-blue", "Live data combining official stations with the Open-Meteo model, or the AQICN backup.", "公的測定局とOpen-Meteoモデルの組み合わせ。"],
  [".tag-demo", "Sample data, or data that has not updated recently.", "サンプルデータ、または更新が遅れているデータ。"], [".tag-red", "Number of active items needing attention, or a failed check.", "対応が必要な件数、または失敗した確認。"],
  [".unc.hi", "Fairly confident — within 12 hours.", "比較的確か — 12時間以内。"], [".unc.md", "Moderately confident — 12 to 36 hours ahead.", "中程度 — 12〜36時間先。"], [".unc.lo", "Less confident — more than 36 hours ahead.", "不確か — 36時間超先。"],
  [".dpill", "Draft — must be reviewed and approved by an official before publication.", "下書き — 公開前に担当者の承認が必要。"], [".tpill", "Test or demonstration-only item.", "テスト・デモ専用。"],
  [".rank", "Rank position; colour shows the level.", "順位。色はレベル。"], [".sswatch", "Latest value; colour shows the level against Japan's standard.", "最新値。色は環境基準に対するレベル。"],
  [".lnum", "Zoom level number (1 = whole prefecture, 4 = street).", "空間スケール番号。"], [".atag", "This statement is an assumption, not a measured fact.", "測定事実ではなく前提条件。"],
  [".livedot", "Pulsing dot = data is live.", "点滅＝ライブデータ。"], [".crow .cdot", "Colour of the area's average level.", "エリア平均のレベルの色。"],
  [".al-sev", "Severity colour — purple: warning · orange: advisory · amber: above standard · violet: forecast · navy: JMA notice.", "重要度の色。"],
  [".fbar", "Event colour — orange: advisory · amber: above standard · green: all clear · navy: daily summary.", "事象の色。"],
  [".ubar", "Shaded bar = likely range; dark line = estimate.", "網掛け＝予想範囲、濃い線＝予測値。"], [".srcbar", "Grey = regional background · navy = urban increment · red = roadside increment.", "灰＝広域・紺＝都市・赤＝沿道。"],
  [".av", "The value or rule used for this assumption.", "この前提条件で用いた値・規則。"],
];
(function () { const st = document.createElement("style"); st.textContent = `
.gl{text-decoration:underline dotted rgba(27,54,93,.45);text-underline-offset:3px;cursor:help}.gl:hover{background:rgba(27,54,93,.06);border-radius:3px}
[data-tip]{cursor:help}
#tipbox{position:fixed;z-index:4000;max-width:330px;background:#0F2240;color:#fff;font-size:12px;line-height:1.55;padding:9px 12px;border-radius:9px;box-shadow:0 10px 28px rgba(15,34,64,.3);pointer-events:none;opacity:0;transition:opacity .12s}#tipbox.on{opacity:1}
#provkey{position:fixed;right:18px;bottom:18px;z-index:1300;background:#fff;border:1px solid var(--line-2);border-radius:14px;box-shadow:var(--sh-lg);padding:10px 14px 11px;font-size:12px;color:var(--ink-2);min-width:230px;max-width:290px;transform:translateY(12px);opacity:0;pointer-events:none;transition:.22s}
#provkey.on{transform:none;opacity:1;pointer-events:auto}
#provkey .pkh{display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);font-weight:800;margin-bottom:6px}
#provkey .pkh button{border:none;background:none;color:var(--ink-3);font-size:14px;line-height:1;padding:0 2px}
#provkey .pkr{display:flex;align-items:center;gap:8px;padding:3px 0}#provkey .pkr .prov{margin-left:0;min-width:18px;height:18px;font-size:10px}
#provkey.min .pkr{display:none}#provkey.min{min-width:0}
#glbtn{position:fixed;left:288px;bottom:18px;z-index:1300;border:1px solid var(--line-2);background:#fff;color:var(--ai-d);border-radius:100px;padding:7px 13px;font-size:12px;font-weight:700;box-shadow:var(--sh-md);display:flex;align-items:center;gap:6px}
#gldrawer{position:fixed;left:0;top:0;bottom:0;width:min(440px,92vw);z-index:3500;background:#fff;box-shadow:var(--sh-lg);transform:translateX(-102%);transition:.25s;display:flex;flex-direction:column}#gldrawer.on{transform:none}
#gldrawer .gdh{padding:16px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px}#gldrawer .gdh h3{flex:1;font-size:16px}#gldrawer .gdh input{border:1px solid var(--line-2);border-radius:8px;padding:6px 9px;width:150px}
#gldrawer .gdb{overflow:auto;padding:6px 18px 24px}#gldrawer .gdi{padding:9px 0;border-bottom:1px solid var(--line)}#gldrawer .gdi b{display:block;font-size:13px;color:var(--ai-d)}#gldrawer .gdi span{font-size:12.5px;color:var(--ink-2);line-height:1.55}
.glt td:first-child{white-space:nowrap;font-weight:700;color:var(--ai-d)}
.capline{font-size:11.5px;color:var(--ink-3);margin-top:6px;line-height:1.55}.capline i{display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:-1px;margin:0 4px 0 8px}
@media(max-width:860px){#glbtn{left:14px}}@media print{#provkey,#glbtn,#gldrawer,#tipbox{display:none!important}}
`; document.head.appendChild(st); })();
const GL_TERMS = GLOSS.map((g) => ({ re: new RegExp("^(?:" + g[0] + ")$"), en: g[1], ja: g[2] }));
const GL_RE = new RegExp("(?<![A-Za-z0-9_])(" + GLOSS.map((g) => g[0]).sort((a, b) => b.length - a.length).join("|") + ")(?![A-Za-z0-9_])", "g");
function glFind(t) { for (const g of GL_TERMS) if (g.re.test(t)) return g; return null; }
const glText = (g) => (state.lang === "ja" ? g.ja || g.en : g.en || g.ja);
const SKIP = "button,select,option,textarea,input,script,style,svg,.prov,.stn,.gl,.leaflet-control-container,.leaflet-tooltip,.ab,.mformula,.du,.polsel,.seg,#provkey,#gldrawer,.nav,.brand,a";
function annotate(root) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (!n.nodeValue.trim() || (n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach((n) => { const s = n.nodeValue; GL_RE.lastIndex = 0; if (!GL_RE.test(s)) return; GL_RE.lastIndex = 0;
    const f = document.createDocumentFragment(); let last = 0, m;
    while ((m = GL_RE.exec(s))) { const g = glFind(m[1]); if (!g) continue; if (m.index > last) f.appendChild(document.createTextNode(s.slice(last, m.index)));
      const sp = document.createElement("span"); sp.className = "gl"; sp.setAttribute("data-tip", glText(g)); sp.textContent = m[1]; f.appendChild(sp); last = m.index + m[1].length; }
    if (last === 0) return; if (last < s.length) f.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(f, n); });
}
function annotateHeads(root) {
  if (!root) return;
  root.querySelectorAll("th, .kpi .k, .sidecard .row > span, .fresh .row > span, .lvlcard td:first-child").forEach((el) => {
    if (el.hasAttribute("data-tip")) return; const t = (el.childNodes[0] && el.childNodes[0].nodeType === 3 ? el.childNodes[0].nodeValue : el.textContent).trim();
    const h = HEADS[t]; if (!h) return; const tip = state.lang === "ja" ? h[1] || h[0] : h[0] || h[1]; if (!tip) return;
    el.setAttribute("data-tip", tip); if (el.tagName === "TH" || el.matches(".kpi .k")) el.style.textDecoration = "underline dotted rgba(27,54,93,.4)"; });
  PILLS.forEach(([sel, en, ja]) => root.querySelectorAll(sel).forEach((el) => { if (!el.hasAttribute("data-tip")) el.setAttribute("data-tip", state.lang === "ja" ? ja : en); }));
  root.querySelectorAll("[title]").forEach((el) => { if (el.closest(".leaflet-container") && !el.closest(".mapkeywrap")) return; if (el.matches("select,option,input")) return; el.setAttribute("data-tip", el.title); el.removeAttribute("title"); });
}
const TIP = document.createElement("div"); TIP.id = "tipbox"; document.body.appendChild(TIP);
let tipEl = null;
document.addEventListener("mouseover", (e) => { const el = e.target.closest("[data-tip]"); if (!el || el === tipEl) return; tipEl = el; TIP.textContent = el.getAttribute("data-tip"); TIP.classList.add("on"); });
document.addEventListener("mousemove", (e) => { if (!tipEl) return; const r = TIP.getBoundingClientRect(); let x = e.clientX + 14, y = e.clientY + 16; if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 12; if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 12; TIP.style.left = x + "px"; TIP.style.top = y + "px"; });
document.addEventListener("mouseout", (e) => { if (!tipEl) return; const to = e.relatedTarget; if (to && tipEl.contains(to)) return; tipEl = null; TIP.classList.remove("on"); });
document.addEventListener("scroll", () => { tipEl = null; TIP.classList.remove("on"); }, true);
const PK = document.createElement("div"); PK.id = "provkey"; document.body.appendChild(PK);
let pkObs = null, pkSeen = new Map(), pkMin = false;
const PROV_DEF = () => [["m", tx("M", "実"), D.modelOnly ? tx("Model value (Open-Meteo)", "モデル値（Open-Meteo）") : tx("Measured by an official station", "公的測定局による実測値")], ["c", tx("C", "算"), tx("Calculated from the data", "データから計算")],
  ["f", tx("F", "予"), tx("Model (Open-Meteo) or forecast", "モデル（Open-Meteo）・予測")], ["r", tx("R", "参"), tx("Published reference data", "公開参照データ")], ["a", tx("A", "仮"), tx("Assumption", "前提条件")]];
function pkDraw() {
  const vis = new Set(); pkSeen.forEach((v, el) => { if (v && el.isConnected) vis.add(["m", "c", "f", "r", "a"].find((k) => el.classList.contains(k))); });
  if (!vis.size) { PK.classList.remove("on"); return; }
  PK.innerHTML = '<div class="pkh"><span>' + tx("Letters beside numbers", "数値横の記号") + '</span><button data-pk="min" aria-label="minimise">' + (pkMin ? "▴" : "▾") + "</button></div>"
    + PROV_DEF().filter((d) => vis.has(d[0])).map((d) => '<div class="pkr"><span class="prov ' + d[0] + '">' + d[1] + "</span>" + d[2] + "</div>").join("");
  PK.classList.toggle("min", pkMin); PK.classList.add("on");
}
PK.addEventListener("click", (e) => { if (e.target.closest("[data-pk]")) { pkMin = !pkMin; pkDraw(); } });
function pkWatch() {
  if (pkObs) pkObs.disconnect(); pkSeen = new Map(); if (!("IntersectionObserver" in window)) return;
  pkObs = new IntersectionObserver((ents) => { ents.forEach((en) => pkSeen.set(en.target, en.isIntersecting)); pkDraw(); }, { threshold: 0.5 });
  document.querySelectorAll(".main .prov, .sidebar .prov").forEach((el) => pkObs.observe(el)); pkDraw();
}
function glossList() {
  const seen = new Set(), out = [];
  GLOSS.forEach((g) => { const lab = g[0].split("|").map((x) => x.replace(/\\\./g, ".").replace(/\[([A-Za-z])[a-z]\]/g, "$1").replace(/s\?$/, "").replace(/\?/g, ""));
    const L = state.lang === "ja" ? lab.find((x) => /[^\x00-\x7F]/.test(x) && !/[ōµ³₂₃]/.test(x)) || lab[0] : lab.find((x) => /^[\x00-\x7Fōµ³₂₃]+$/.test(x)) || lab[0];
    if (seen.has(L)) return; seen.add(L); out.push([L, state.lang === "ja" ? g[2] : g[1]]); });
  Object.keys(HEADS).forEach((k) => { const t = state.lang === "ja" ? HEADS[k][1] : HEADS[k][0]; if (!t || seen.has(k)) return; seen.add(k); out.push([k, t]); });
  return out.sort((a, b) => a[0].localeCompare(b[0], state.lang === "ja" ? "ja" : "en", { sensitivity: "base" }));
}
const GB = document.createElement("button"); GB.id = "glbtn"; document.body.appendChild(GB);
const GD = document.createElement("div"); GD.id = "gldrawer"; document.body.appendChild(GD);
function gdDraw(q) {
  q = (q || "").toLowerCase(); GB.innerHTML = icon("book") + tx("Glossary", "用語集");
  const items = glossList().filter((x) => !q || x[0].toLowerCase().includes(q) || x[1].toLowerCase().includes(q));
  GD.innerHTML = '<div class="gdh">' + icon("book") + "<h3>" + tx("Glossary", "用語集") + '</h3><input data-gd="q" placeholder="' + tx("Search", "検索") + '" value="' + esc(q) + '"/><button class="btn sm" data-gd="x">' + icon("x") + "</button></div>"
    + '<div class="gdb">' + items.map((x) => '<div class="gdi"><b>' + esc(x[0]) + "</b><span>" + esc(x[1]) + "</span></div>").join("") + "</div>";
}
GB.addEventListener("click", () => { gdDraw(); GD.classList.add("on"); });
GD.addEventListener("click", (e) => { if (e.target.closest('[data-gd="x"]')) GD.classList.remove("on"); });
GD.addEventListener("input", (e) => { if (e.target.matches('[data-gd="q"]')) { const v = e.target.value; gdDraw(v); const i = GD.querySelector('[data-gd="q"]'); i.focus(); i.setSelectionRange(v.length, v.length); } });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") GD.classList.remove("on"); });
function glossTable() {
  return '<div class="section-head"><h2>' + icon("book") + " " + tx("Glossary A–Z", "用語集") + '</h2><div class="d">' + tx("Every abbreviation, unit and term used in the twin. The same explanations appear when you hover over a dotted-underlined word.", "本ツインのすべての略語・単位・用語。点線の下線付きの語にカーソルを合わせても表示されます。") + '</div></div><div class="card scroll" style="max-height:560px"><table class="tbl glt"><tbody>'
    + glossList().map((x) => "<tr><td>" + esc(x[0]) + "</td><td>" + esc(x[1]) + "</td></tr>").join("") + "</tbody></table></div>";
}
const caption = (html) => '<div class="capline">' + html + "</div>";
function addCaptions() {
  const main = document.querySelector(".main"); if (!main) return;
  main.querySelectorAll("svg").forEach((sv) => { if (sv.dataset.cap || !sv.querySelector('rect[fill="#BC002D"]') || sv.closest(".lmap") || sv.closest(".layers")) return; sv.dataset.cap = 1;
    sv.insertAdjacentHTML("afterend", caption(tx('Each bar is the average for that hour of day (JST). <i style="background:#BC002D"></i>Red = hour with the highest average; other colours = level against the standard.', '各棒は時刻別の平均（日本時間）。<i style="background:#BC002D"></i>赤＝平均が最も高い時刻、他の色＝基準に対するレベル。'))); });
  main.querySelectorAll('svg[viewBox="-12 -12 244 244"]').forEach((sv) => { const box = sv.parentElement; if (box.dataset.cap || /wedge|扇形/.test(box.textContent)) return; box.dataset.cap = 1;
    sv.insertAdjacentHTML("afterend", caption(tx("Each wedge = average level when the wind blew from that direction over the past week; longer and redder = higher. Centre = calm hours.", "各扇形＝その方向から風が吹いたときの平均（過去1週間）。中央＝静穏時。"))); });
  main.querySelectorAll(".srcbar").forEach((b) => { const p = b.parentElement; if (p.dataset.cap || p.closest(".srow") || p.closest("td") || p.closest(".layers") || /Regional|広域/.test(p.textContent)) return; p.dataset.cap = 1;
    b.insertAdjacentHTML("afterend", caption('<i style="background:#8C96A8;margin-left:0"></i>' + tx("regional", "広域") + '<i style="background:#1B365D"></i>' + tx("urban", "都市") + '<i style="background:#BC002D"></i>' + tx("roadside", "沿道"))); });
  const ub = main.querySelector(".ubar"); if (ub) { const t = ub.closest("table"); if (t && !t.dataset.cap) { t.dataset.cap = 1; t.insertAdjacentHTML("afterend", '<div class="capline" style="padding:0 12px 10px">' + tx("Range bar: shaded = likely range; dark line = estimate.", "範囲バー：網掛け＝予想範囲、濃い線＝予測値。") + "</div>"); } }
  main.querySelectorAll(".maplegend").forEach((lg) => { if (lg.dataset.cap || !/≤ -20%/.test(lg.textContent)) return; lg.dataset.cap = 1;
    lg.insertAdjacentHTML("afterbegin", '<span class="muted" style="font-weight:700">' + tx("Change vs baseline:", "ベースラインとの差：") + "</span>");
    lg.insertAdjacentHTML("beforeend", '<span><i style="background:#E5E7EB"></i>' + tx("little or no change (±1%)", "ほぼ変化なし（±1%）") + "</span>"); });
  const al = main.querySelector(".alertrow"); if (al && !al.parentElement.dataset.cap) { al.parentElement.dataset.cap = 1;
    al.parentElement.insertAdjacentHTML("beforeend", caption(tx("Bar colour:", "バーの色：") + '<i style="background:#8E2C8E"></i>' + tx("warning", "警報") + '<i style="background:#E0602A"></i>' + tx("advisory", "注意報") + '<i style="background:#E0A21B"></i>' + tx("above standard", "基準超過") + '<i style="background:#C77A12"></i>' + tx("dust / SPM", "黄砂・SPM") + '<i style="background:#6A3FA0"></i>' + tx("forecast", "予測") + '<i style="background:#1B365D"></i>' + tx("JMA notice", "気象庁"))); }
  main.querySelectorAll('svg[role="img"]').forEach((sv) => { const nx = sv.nextElementSibling; if (sv.closest(".layers") || sv.dataset.cap || (nx && nx.classList.contains("legend"))) return; sv.dataset.cap = 1;
    const dust = sv.querySelector('path[stroke="#C77A12"]');
    sv.insertAdjacentHTML("afterend", caption(dust ? tx("Model dust concentration (µg/m³), next 3 days, European CAMS model.", "欧州CAMSモデルによる今後3日のダスト濃度（µg/m³）。") : '<i style="background:#1B365D;margin-left:0"></i>' + tx("hourly value", "1時間値") + '<i style="background:#E0602A"></i>' + tx("dashed = standard line", "破線＝基準ライン"))); });
  main.querySelectorAll(".maplegend").forEach((lg) => { if (lg.dataset.cap2 || /≤ -20%/.test(lg.textContent)) return; lg.dataset.cap2 = 1; const sep = lg.querySelector(".sksep");
    if (sep) sep.insertAdjacentHTML("afterend", '<span class="muted" style="font-weight:700">' + tx("Colour = level:", "色＝レベル：") + "</span>"); });
}
const _exBody = body; body = function () { let h = _exBody(); if (state.screen === "method" && state.loaded) { const k = h.indexOf(tx("Test the feeds now", "データ接続を今すぐ確認")); const at = k > 0 ? h.lastIndexOf('<div class="section-head">', k) : -1; h = at > 0 ? h.slice(0, at) + glossTable() + h.slice(at) : h + glossTable(); } return h; };
const _exRender = render; render = function () {
  _exRender();
  try { const roots = [document.querySelector(".main"), document.querySelector(".sidecard"), document.querySelector(".fresh"), document.querySelector(".topbar .polfull")];
    addCaptions(); roots.forEach(annotate); roots.forEach(annotateHeads); document.querySelectorAll(".mapkeywrap,.maplegend").forEach(annotateHeads); pkWatch(); gdDraw(); } catch (e) { console.warn("explain layer", e); }
};
if (typeof updateScen === "function") { const _u = updateScen; updateScen = function () { _u(); try { ["impact", "scenres", "scenread"].forEach((id) => { const el = document.getElementById(id); annotate(el); annotateHeads(el); }); pkWatch(); } catch (e) {} }; }
if (typeof updateTime === "function") { const _t = updateTime; updateTime = function () { _t(); try { ["t-kpis", "t-list", "t-chart"].forEach((id) => { const el = document.getElementById(id); annotate(el); annotateHeads(el); }); pkWatch(); } catch (e) {} }; }
gdDraw();
