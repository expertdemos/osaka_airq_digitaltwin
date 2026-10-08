"use strict";
/* Osaka Air Quality Digital Twin - pages (v8) */
function stCell(s) { return "<b>" + esc(sName(s)) + '</b><div class="muted" style="font-size:11.5px">' + esc(tr(s.muni)) + " · " + typeLabel(s) + "</div>"; }
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function pctTxt(v, base) { const x = Math.round(((v - base) / base) * 100); return (x > 0 ? "+" : "") + (x === 0 ? 0 : x) + "%"; }
const dayLab = (t) => (t && jstHour(t) === 0 ? new Date(Date.parse(t) + 9 * 3600e3).toISOString().slice(5, 10).replace("-", "/") : null);
const PTS = () => (D.modelOnly ? tx("model points", "モデル点") : tx("stations", "測定局"));
function body() {
  if (!D.stations.length) return '<div class="card pad" style="margin-top:40px;text-align:center"><h2>' + tx("No data available", "データがありません") + '</h2><p class="muted">' + tx("Try Open-Meteo or Sample at the top.", "上部で「Open-Meteo」または「サンプル」を選択してください。") + "</p></div>";
  return ({ home: vHome, live: vLive, time: vTime, attrib: vAttrib, hotspot: vHotspot, exposure: vExposure, forecast: vForecast, episodes: vEpisodes, scen: vScen, compare: vCompare, zoom: vZoom, alerts: vAlerts, kpi: vKpi, brief: vBrief, method: vMethod }[state.screen] || vHome)();
}

/* ======================= OVERVIEW ======================= */
const VIEW_DETAIL = {
  live: { yes: [{ en: "Measured values at every official station", ja: "全公的測定局の実測値" }, { en: "Roadside vs neighbourhood split", ja: "沿道と一般環境の分離" }, { en: "Forecast checked against measurements", ja: "実測で検証した予測" }], no: [{ en: "Needs the site deployed on GitHub", ja: "GitHubへのデプロイが必要" }] },
  blend: { yes: [{ en: "Official measurements where stations exist", ja: "測定局のある場所は実測" }, { en: "Open-Meteo model fills gaps > 6 km", ja: "6km超の空白域はOpen-Meteoで補完" }, { en: "Fresh forecast, corrected by stations", ja: "測定局で補正した最新予測" }], no: [{ en: "On a desktop: Open-Meteo only", ja: "デスクトップではOpen-Meteoのみ" }] },
  om: { yes: [{ en: "Works anywhere, including a desktop file", ja: "デスクトップを含めどこでも動作" }, { en: "Past 7 days and next 3 days, live", ja: "過去7日・今後3日をライブで" }, { en: "European Copernicus model", ja: "欧州コペルニクスモデル" }], no: [{ en: "Model estimate, not Japanese measurement", ja: "日本の実測ではなくモデル推計" }, { en: "Smooths roadside and port peaks", ja: "沿道・港湾のピークは平準化" }] },
  sample: { yes: [{ en: "Works offline", ja: "オフラインで動作" }, { en: "Every page populated", ja: "全ページが表示可能" }], no: [{ en: "Every value is invented", ja: "値はすべて作成値" }] } };
function vHome() {
  const p = state.pol, P = POLS[p], ns = nodesFor(p).sort((a, b) => b.v - a.v), avg = mean(ns.map((x) => x.v)), b = bandOf(p, avg), w = D.wxOsaka, dt = decompTotals(p, null);
  const rows = AREAS.map((a) => { const l = D.stations.filter((s) => inArea(s, a.k) && s[p] != null); return { a, v: mean(l.map((s) => s[p])), n: l.length }; }).filter((x) => x.n).sort((x, y) => y.v - x.v);
  const nRoad = D.stations.filter((s) => s.road).length, nModel = D.stations.filter((s) => s.model).length, nOff = D.stations.length - nModel, vf = verify(p), pop = D.ctx && D.ctx.population;
  let h = '<div class="eyebrow">' + tx("Overview", "概要") + " · " + esc(areaName()) + '</div><h1 class="h-page">' + tx("Osaka's air, point by point", "大阪の大気を、地点ごとに") + '</h1><p class="sub" style="margin-bottom:14px">'
    + tx("Official station measurements, European model data and Japan Meteorological Agency weather, brought together for Osaka Prefecture.", "大阪府の公的測定局の実測、欧州モデルデータ、気象庁の気象データを統合しています。") + "</p>" + modeBanner();
  h += '<div class="mapbar no-print" style="margin-bottom:8px">' + baseSelect() + '</div><div class="homewrap">' + mapSlot("home", {}, "home") + '<div class="home-hud"><div class="hud-card"><div class="ht"><span class="livedot"></span>' + esc(areaName()) + "</div><h2>" + tx("Air Quality Digital Twin", "大気環境デジタルツイン") + '</h2><div class="hs">' + ns.length + " " + PTS() + " · " + fmtT(D.latest.observedAt) + "</div>"
    + '<div class="hud-val"><span class="n" style="color:' + b.hex + '">' + fmt(p, avg) + '</span><span class="u">' + U(p) + " " + P.label + pv("m") + "<br>" + b.name + '</span></div><div class="sweepbar" style="margin-top:10px"></div></div>';
  if (dt) h += '<div class="hud-card"><div class="ht">' + tx("What it is made of", "内訳") + pv("c") + '</div><div style="margin:8px 0 6px">' + stackBar([[tx("Regional", "広域"), dt.bg, PARTC.bg], [tx("Urban", "都市"), dt.urb, PARTC.urb], [tx("Roadside", "沿道"), dt.road, PARTC.road]], 14) + '</div><div class="muted" style="font-size:11.5px;line-height:1.5">'
    + tx("Regional ", "広域 ") + "<b>" + pct(dt.bg, dt.total) + "%</b> · " + tx("urban ", "都市 ") + "<b>" + pct(dt.urb, dt.total) + "%</b> · " + tx("roadside ", "沿道 ") + "<b>" + pct(dt.road, dt.total) + "%</b></div></div>";
  if (ns[0]) h += '<div class="hud-card"><div class="hud-row"><span>' + tx("Highest", "最高") + "</span><b>" + esc(sName(ns[0].st)) + '</b></div><div class="hud-row"><span>' + esc(tr(ns[0].st.muni)) + '</span><b style="color:' + bandOf(p, ns[0].v).hex + '">' + fmt(p, ns[0].v) + " " + U(p) + "</b></div>"
    + (w ? '<div class="hud-row" style="border-top:1px solid var(--line);margin-top:5px;padding-top:6px"><span>' + tx("Wind, Osaka", "風・大阪") + " (" + WXS() + ")</span><b>" + compass(w.wd) + " · " + w.ws + " m/s</b></div>" : "") + "</div>";
  h += '</div><div class="home-stats"><div class="hud-card" style="padding:9px 12px"><div class="ht">' + tx("Compare areas", "エリア比較") + " · " + P.label + '</div><div class="muted" style="font-size:10.5px;margin-top:2px">' + tx("Click to switch", "クリックで切替") + "</div></div>"
    + rows.map((r) => { const bb = bandOf(p, r.v); return '<div class="crow' + (r.a.k === state.area ? " on" : "") + '" data-act="areaset" data-v="' + r.a.k + '"><span class="cdot" style="background:' + bb.hex + '"></span><span class="cn">' + esc(tr(r.a)) + '<span class="cs">' + r.n + " " + PTS() + '</span></span><b style="font-size:12.5px;color:' + bb.hex + '">' + fmt(p, r.v) + "</b></div>"; }).join("") + "</div>"
    + '<div class="home-legend"><div style="font-weight:700;margin-bottom:2px">' + P.label + " (" + U(p) + ")</div>" + RAMP.map((c, i) => '<div><i style="background:' + c + '"></i>' + tr((p === "ox" ? BANDN_OX : BANDN)[i]) + "</div>").join("") + "</div></div>";
  h += '<div class="section-head"><h2>' + tx("Choose your data", "データの選択") + '</h2><div class="d">' + tx("Four options. Switch at the top of any page.", "4つの選択肢。どのページでも上部で切り替えられます。") + '</div></div><div class="mode4">'
    + VIEWS.map((v) => { const on = state.view === v.k, dd = VIEW_DETAIL[v.k]; return '<div class="mcard' + (on ? " on" : "") + '" data-act="view" data-v="' + v.k + '"><div class="mh">' + icon(v.ic) + '<div><div class="mt">' + tr(v.n) + '</div><div class="mlab">' + (on ? tx("Selected", "選択中") : tx("Click to switch", "クリックで切替")) + '</div></div></div><div class="mb"><div style="margin-bottom:8px">' + tr(v.d) + "</div>"
      + dd.yes.map((x) => '<div><span style="color:var(--green);font-weight:800">✓</span> ' + tr(x) + "</div>").join("") + dd.no.map((x) => '<div class="muted">— ' + tr(x) + "</div>").join("") + "</div></div>"; }).join("") + "</div>";
  h += '<div class="section-head"><h2>' + tx("What is real in this view", "この表示の「実データ」") + '</h2></div>';
  h += '<div class="real4"><div class="rtile" style="border-top:3px solid var(--green)"><div class="rh" style="color:#0b7a53">' + icon("gauge") + (D.modelOnly ? tx("Model (live)", "モデル（ライブ）") : tx("Measured", "実測")) + pv("m") + "</div><ul>"
    + (nOff && !D.modelOnly ? "<li><b>" + nOff + "</b> " + tx("official stations", "公的測定局") + " (" + nRoad + " " + tx("roadside", "自排局") + ")</li>" : "") + (nModel ? "<li><b>" + nModel + "</b> " + tx("Open-Meteo model points", "Open-Meteoモデル点") + "</li>" : "")
    + "<li>PM2.5 · NO₂ · Ox · SO₂ · CO · SPM</li><li><b>" + D.times.length + "</b> " + tx("hours of history", "時間分の履歴") + "</li><li><b>" + D.amedas.length + "</b> " + tx("weather points", "気象地点") + " (" + WXS() + ")</li></ul></div>"
    + '<div class="rtile" style="border-top:3px solid var(--violet)"><div class="rh" style="color:#5a2f8f">' + icon("trend") + tx("Forecast", "予測") + pv("f") + "</div><ul><li>" + tx("Copernicus model, 3 days ahead", "コペルニクスモデル（3日先）") + "</li>" + (D.latest.jmaForecast ? "<li>" + tx("JMA official forecast for Osaka", "気象庁 大阪府の天気予報") + "</li>" : "")
    + "<li>" + (vf ? tx("Checked against official measurements: typical error ", "公的実測で検証：平均誤差 ") + "<b>" + fmt(p, vf.mae) + " " + U(p) + "</b>" : tx("Verification needs official station data (Official or Blended when deployed)", "検証には公的測定局データが必要（デプロイ後の公式・ブレンド）")) + "</li></ul></div>"
    + '<div class="rtile" style="border-top:3px solid var(--ink-3)"><div class="rh" style="color:var(--ink-2)">' + icon("book") + tx("Reference", "参照") + pv("r") + "</div><ul><li>" + (pop ? "<b>" + D.munis.length + "</b> " + tx("municipalities, population ", "市区町村、人口 ") + "<b>" + ((pop.total || 0) / 1e6).toFixed(2) + tx("m", "百万人") + "</b>" + (D.ctx.builtin ? tx(" (rounded, built in)", "（概数・内蔵）") : "") : "–") + "</li><li><b>" + D.hosp.length + "</b> " + tx("hospitals", "病院") + (D.schools.length ? " · <b>" + D.schools.length + "</b> " + tx("schools", "学校") : "") + "</li><li>" + tx("Japan's legal air standards", "日本の環境基準") + "</li></ul></div>"
    + '<div class="rtile" style="border-top:3px solid var(--amber)"><div class="rh" style="color:#8a5212">' + icon("alert") + tx("Assumptions", "前提条件") + pv("a") + "</div><ul><li><b>" + ALL_ASM_COUNT() + "</b> " + tx("in total, all on Data & Method", "件（「データと手法」に記載）") + "</li><li>" + tx("Mostly in Scenario Analysis", "主にシナリオ分析") + "</li><li>" + tx("No invented stations or costs", "架空の測定局・費用なし") + "</li></ul></div></div>";
  h += '<div class="card pad" style="margin-top:14px"><b style="font-size:13px">' + tx("The small letters beside numbers", "数値の横の記号") + '</b><div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:8px;font-size:12.5px;color:var(--ink-2)"><span><span class="prov m">' + tx("M", "実") + "</span> " + tx("measured by an official station", "公的測定局の実測") + "</span><span>" + pv("c") + " " + tx("calculated", "計算値") + '</span><span><span class="prov f">' + tx("F", "予") + "</span> " + tx("model (Open-Meteo) or forecast", "モデル（Open-Meteo）・予測") + "</span><span>" + pv("r") + " " + tx("published reference", "公開参照データ") + "</span><span>" + pv("a") + " " + tx("assumption", "前提条件") + "</span></div></div>";
  const list = areaStations().slice().sort((x, y) => (y[p] || 0) - (x[p] || 0));
  h += '<div class="section-head"><h2>' + tx("Points in ", "地点一覧：") + esc(areaName()) + '</h2><div class="d">' + list.length + " · " + tx("latest hour", "最新1時間値") + "</div></div>"
    + '<div class="card scroll" style="max-height:520px"><table class="tbl"><thead><tr><th>' + tx("Point", "地点") + "</th><th>PM2.5<br><span class='muted'>µg/m³</span></th><th>NO₂<br><span class='muted'>ppb</span></th><th>Ox<br><span class='muted'>ppb</span></th><th>SO₂<br><span class='muted'>ppb</span></th><th>CO<br><span class='muted'>ppm</span></th><th>SPM<br><span class='muted'>mg/m³</span></th><th>" + tx("Time", "時刻") + "</th></tr></thead><tbody>"
    + list.map((s) => "<tr><td>" + stCell(s) + "</td>" + ["pm25", "no2", "ox", "so2", "co", "spm"].map((k) => '<td class="num" style="color:' + bandOf(k, s[k]).hex + '">' + fmt(k, s[k]) + "</td>").join("") + '<td class="muted" style="font-size:11.5px">' + fmtT(s.obsTime) + (s.model ? pv("f") : pv("m")) + "</td></tr>").join("") + "</tbody></table></div>";
  h += how([[tx("Pick the data at the top", "上部でデータを選択"), tx("Official needs the site on GitHub. Open-Meteo works anywhere, including when this file is opened from your desktop. Blended combines both.", "「公式」はGitHubへのデプロイが必要です。「Open-Meteo」はデスクトップで開いた場合を含めどこでも動作します。「ブレンド」は両方を組み合わせます。")],
    [tx("Pick an area and a pollutant", "エリアと物質を選択"), tx("They change every page.", "全ページの表示が切り替わります。")],
    [tx("Squares are roadside stations; dashed labels are model points", "四角は自排局、破線はモデル点"), tx("Roadside stations sit next to major roads; model points are Open-Meteo values at municipal centres.", "自排局は幹線道路沿い、モデル点は市区町村代表点のOpen-Meteo値です。")]])
    + assumptions([ASM.map(), ASM.prelim(), ASM.levels(), ASM.units()])
    + sources(["soramame", "amedas", "jmaFc", "cams", "wikidata", "osm", "eqs", "gsiGeo", "gsiTiles", "leaflet", "cad"]);
  return h;
}

/* ======================= LIVE MAP ======================= */
function wxStrip() {
  const w = D.wxOsaka; if (!w) return "";
  const ws = w.ws, word = ws == null ? "" : ws < 2 ? tx("Light wind: local emissions tend to build up near roads and the port.", "風が弱く、道路沿いや港湾周辺で滞留しやすい状況です。") : ws > 5 ? tx("Fresh wind: local emissions are dispersing well.", "風が強く、拡散しやすい状況です。") : tx("Moderate wind: some dispersion.", "中程度の風で、ある程度拡散しています。");
  return '<div class="card pad" style="margin-top:14px"><div style="display:flex;gap:20px;flex-wrap:wrap;align-items:center"><span style="font-size:12px;font-weight:800;color:var(--ink-3);letter-spacing:.07em;text-transform:uppercase">' + icon("wind") + " " + tx("Weather now", "現在の気象") + (D.wxSrc === "om" ? pv("f") : pv("m")) + "</span>"
    + "<span><b>" + compass(w.wd) + '</b> <span class="muted">' + tx("wind from", "の風") + "</span> <b>" + w.ws + " m/s</b></span>" + (w.temp != null ? "<span><b>" + w.temp + " °C</b></span>" : "") + (w.hum != null ? "<span><b>" + w.hum + '%</b> <span class="muted">' + tx("humidity", "湿度") + "</span></span>" : "") + (w.prec != null ? "<span><b>" + w.prec + ' mm</b> <span class="muted">' + tx("rain", "降水") + "</span></span>" : "")
    + '<span class="muted" style="font-size:11.5px">' + WXS() + " · " + esc(state.lang === "en" ? w.nameEn : w.name) + '</span></div><div class="muted" style="font-size:12.5px;margin-top:8px">' + word + "</div></div>";
}
function vLive() {
  const p = state.pol, ns = nodesFor(p).sort((a, b) => b.v - a.v), avg = mean(ns.map((x) => x.v)), b = bandOf(p, avg), dc = decomp(p, null), above = ns.filter((x) => x.v > POLS[p].th[1]).length;
  return head(tx("Air quality across ", "大気の状況：") + esc(areaName()), tx("Latest hourly value at every point. Shading between points is an estimate; squares are roadside stations, dashed labels are model points.", "各地点の最新1時間値。地点間の色は推計値、四角は自排局、破線はモデル点です。"))
    + '<div class="kpis" style="margin-bottom:16px">' + kpi(tx("Average", "平均") + pv("m"), fmt(p, avg) + " <small>" + U(p) + "</small>", b.name, b.hex)
    + kpi(tx("Highest", "最高") + pv("m"), ns[0] ? fmt(p, ns[0].v) + " <small>" + U(p) + "</small>" : "–", ns[0] ? esc(sName(ns[0].st)) : "", ns[0] && bandOf(p, ns[0].v).hex)
    + kpi(tx("Lowest", "最低") + pv("m"), ns.length ? fmt(p, ns[ns.length - 1].v) + " <small>" + U(p) + "</small>" : "–", ns.length ? esc(sName(ns[ns.length - 1].st)) : "", ns.length && bandOf(p, ns[ns.length - 1].v).hex)
    + kpi(tx("Above the standard line", "基準ライン超過"), above + " / " + ns.length, tx("this hour", "この1時間"), above ? "var(--red)" : "var(--green)") + "</div>"
    + '<div class="maplayout"><div><div class="card" style="padding:14px">' + mapBar() + mapSlot("main", {}) + mapLegend(p) + "</div>" + basePicker() + wxStrip() + "</div>"
    + '<div class="card pad"><h3 style="margin-bottom:4px">' + tx("Highest first", "高い順") + '</h3><div class="muted" style="font-size:12px;margin-bottom:8px">' + tx("Bar: regional · urban · roadside parts", "バー：広域・都市・沿道") + '</div><div class="stationside">'
    + ns.map((x) => { const q = dc.get(x.st.id); return '<div class="srow" data-act="pick" data-s="' + x.st.id + '" data-go="hotspot"><div class="sswatch" style="background:' + bandOf(p, x.v).hex + '">' + fmt(p, x.v) + '</div><div style="min-width:0;flex:1"><div class="sn">' + esc(sName(x.st)) + '</div><div class="sm">' + esc(tr(x.st.muni)) + " · " + typeLabel(x.st) + "</div>" + (q ? '<div style="margin-top:4px">' + stackBar([["bg", q.bg, PARTC.bg], ["urb", q.urb, PARTC.urb], ["road", q.road, PARTC.road]], 6) + "</div>" : "") + "</div></div>"; }).join("") + "</div></div></div>"
    + how([[tx("Values arrive for every point", "全地点の値を取得"), tx("Official: Ministry of the Environment hourly values, collected every 30 minutes. Open-Meteo: European model values fetched by your browser.", "公式：環境省の1時間値を30分ごとに収集。Open-Meteo：ブラウザが取得する欧州モデル値。")],
      [tx("Shading fills the gaps", "地点の間は推計で補間"), tx("Nearby points count more than distant ones. Areas more than 10 km from any point are left blank.", "近い地点ほど重く扱います。地点から10km以上離れた場所は空白にします。")],
      [tx("Wind arrows", "風の矢印"), tx("Point where the wind blows to, labelled with speed in m/s.", "風が吹いていく方向と風速（m/s）を示します。")]])
    + assumptions([ASM.map(), ASM.levels(), ASM.prelim()])
    + sources(["soramame", "amedas", "gsiGeo", "gsiTiles", "eqs", "leaflet", "cad"]);
}

/* ======================= THROUGH THE WEEK ======================= */
function areaAxisSeries(p) { const meas = prefSeries(p, true); const now = meas[meas.length - 1];
  return D.axis.map((a) => (a.kind === "m" ? meas[a.i] : now == null ? null : now * fcRatio(p, a.i))); }
function timeParts() {
  const p = state.pol, ax = state.tIdx, a = D.axis[ax]; if (!a) return {};
  const ns = nodesFor(p, { ax }).sort((x, y) => y.v - x.v), v = mean(ns.map((x) => x.v)), now = areaAvg(p), ser = areaAxisSeries(p), b = bandOf(p, v);
  const fcPart = ser.slice(D.times.length), pk = fcPart.reduce((m, x, i) => (x != null && (m == null || x > m.v) ? { v: x, i: i + D.times.length } : m), null);
  return { clock: fmtT(a.t) + ' <span class="pill ' + (a.kind === "m" ? "tag-live" : "tag-violet") + '" style="font-size:10.5px">' + (a.kind === "m" ? (D.modelOnly ? tx("model, past", "モデル・過去") : tx("measured", "実測")) : tx("forecast", "予測")) + "</span>",
    kpis: kpi(tx("Area average at this time", "この時刻のエリア平均"), fmt(p, v) + " <small>" + U(p) + "</small>", b.name + (a.kind === "m" ? pv("m") : pv("f")), b.hex)
      + kpi(tx("Compared with now", "現在との比較"), v != null && now ? pctTxt(v, now) : "–", fmt(p, v - now) + " " + U(p), v > now ? "var(--red)" : "var(--green)")
      + kpi(tx("Points above the standard line", "基準ライン超過"), ns.filter((x) => x.v > POLS[p].th[1]).length + " / " + ns.length, tx("at this time", "この時刻"))
      + kpi(tx("Highest ahead (3 days)", "今後3日の最高"), pk ? fmt(p, pk.v) + " <small>" + U(p) + "</small>" : "–", pk ? fmtDH(D.axis[pk.i].t) + pv("f") : "", pk ? bandOf(p, pk.v).hex : ""),
    list: ns.slice(0, 10).map((x) => '<div class="srow"><div class="sswatch" style="background:' + bandOf(p, x.v).hex + '">' + fmt(p, x.v) + '</div><div><div class="sn">' + esc(sName(x.st)) + '</div><div class="sm">' + esc(tr(x.st.muni)) + " · " + typeLabel(x.st) + "</div></div></div>").join(""),
    chart: lineChart({ n: ser.length, series: [{ vals: ser.map((x, i) => (i < D.times.length ? x : null)), c: "#1B365D" }, { vals: ser.map((x, i) => (i >= D.times.length - 1 ? x : null)), c: "#6A3FA0", dash: true }],
      refs: [{ v: POLS[p].th[1], label: tr({ en: "standard line", ja: "基準ライン" }), c: "#E0602A" }], nowI: D.nowAx, markI: ax, markV: v, labels: (i) => dayLab(D.axis[i].t),
      legend: [[D.modelOnly ? tx("Past 7 days (model)", "過去7日（モデル）") : tx("Measured (area average)", "実測（エリア平均）"), "#1B365D"], [tx("Forecast", "予測"), "#6A3FA0"]] }) };
}
function vTime() {
  const p = state.pol; if (!D.axis.length) return head(tx("Through the week", "1週間の推移"), "") + '<div class="card pad">' + tx("No history available in this view. Try Open-Meteo.", "この表示では履歴がありません。Open-Meteoをお試しください。") + "</div>";
  const t = timeParts(), prof = hourProfile(p), wk = weekSplit(p), pkh = prof.indexOf(Math.max(...prof.filter((x) => x != null)));
  MAPREG.time = { ax: state.tIdx };
  return head(tx("The past week — and where it is heading", "過去1週間の推移とこれから"), tx("Slide through the last 7 days, then 3 days of forecast. The map, figures and list move with the clock.", "過去7日間と今後3日間の予測をスライダーでたどれます。地図・数値・一覧が連動します。"))
    + '<div class="card pad no-print" style="margin-bottom:16px"><div class="tl"><button class="playbtn" data-act="play">' + icon(state.tPlaying ? "pause" : "play") + '</button><div><div class="tlclock" id="t-clock">' + t.clock + "</div></div>"
    + '<input type="range" min="0" max="' + (D.axis.length - 1) + '" value="' + state.tIdx + '" data-act="scrub"/><button class="btn sm" data-act="tnow">' + tx("Back to now", "現在に戻る") + '</button></div><div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--ink-3);margin-top:6px"><span>' + tx("7 days ago", "7日前") + "</span><span>" + tx("now", "現在") + "</span><span>" + tx("+3 days", "3日後") + "</span></div></div>"
    + '<div class="kpis" id="t-kpis" style="margin-bottom:16px">' + t.kpis + '</div><div class="card pad" style="margin-bottom:16px"><h3 style="font-size:15px;margin-bottom:6px">' + tx("Area average, hour by hour", "エリア平均の1時間ごとの推移") + '</h3><div id="t-chart">' + t.chart + "</div></div>"
    + '<div class="maplayout"><div class="card" style="padding:14px">' + mapBar() + mapSlot("time", MAPREG.time) + mapLegend(p) + '</div><div class="card pad"><h3 style="margin-bottom:8px">' + tx("Highest at this time", "この時刻の上位地点") + '</h3><div class="stationside" id="t-list" style="max-height:520px">' + t.list + "</div></div></div>"
    + '<div class="grid g2" style="margin-top:16px"><div class="card pad"><h3 style="font-size:15px;margin-bottom:3px">' + tx("Typical day this week", "今週の1日の典型パターン") + pv("c") + '</h3><div class="muted" style="font-size:12px;margin-bottom:6px">' + tx("Average by hour of day (JST)", "時刻別平均（日本時間）") + "</div>"
    + barsChart(prof, p, prof.map((x, i) => (i % 3 === 0 ? String(i) : "")), pkh) + '<div class="muted" style="font-size:12.5px">' + tx("Highest on average at ", "平均が最も高い時刻：") + "<b>" + pkh + ":00</b></div></div>"
    + '<div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("Weekdays against the weekend", "平日と週末") + pv("c") + "</h3>"
    + (wk.nwe ? '<div class="kpis" style="grid-template-columns:1fr 1fr">' + kpi(tx("Weekday average", "平日平均"), fmt(p, wk.wd) + " <small>" + U(p) + "</small>", "") + kpi(tx("Weekend average", "週末平均"), fmt(p, wk.we) + " <small>" + U(p) + "</small>", wk.wd ? pctTxt(wk.we, wk.wd) : "") + '</div><p class="muted" style="font-size:12.5px;margin-top:10px">' + tx("Lower weekend levels indicate how much weekday activity — mainly traffic — adds.", "週末の値が低いことは、平日の活動（主に交通）の寄与を示します。") + "</p>" : '<p class="muted">' + tx("The history does not yet include a weekend.", "履歴にまだ週末が含まれていません。") + "</p>") + "</div></div>"
    + how([[tx("Left of 'now' is the past week", "「現在」より左は過去1週間"), D.modelOnly ? tx("Open-Meteo's model values for the past 7 days.", "Open-Meteoの過去7日のモデル値です。") : tx("The official value each station reported.", "各測定局が報告した公式値です。")],
      [tx("Right of 'now' is the forecast", "「現在」より右は予測"), tx("Each point's latest value moved in line with the Copernicus model forecast" + (D.modelOnly ? "." : ", after correcting the model's bias measured over the past week."), "各地点の最新値をコペルニクスモデルの予測の増減に合わせて変化させています" + (D.modelOnly ? "。" : "（過去1週間で測定したモデルの偏りを補正）。"))]])
    + assumptions([ASM.map(), [tx("The forecast follows the area-average model change", "予測はモデルの平均変化に連動"), tx("Every point is scaled by the same ratio; local differences in the coming days are not modelled.", "全地点を同じ比率で変化させます。今後の地域差はモデル化していません。"), tx("1 ratio", "同一比率")]])
    + sources(["soramame", "cams", "amedas", "gsiTiles", "leaflet"]);
}

/* ======================= WHAT DRIVES IT ======================= */
function vAttrib() {
  const p = state.pol === "ox" ? "no2" : state.pol, dc = decomp(p, null), list = areaStations().filter((s) => dc.get(s.id)), tot = decompTotals(p, null, list);
  if (!tot) return head(tx("What drives it", "汚染の要因"), "") + '<div class="card pad">' + tx("No data.", "データなし") + "</div>";
  const roads = list.filter((s) => s.road), rTot = roads.length ? decompTotals(p, null, roads) : null;
  const sel = D.byId[state.selected] && inArea(D.byId[state.selected]) ? D.byId[state.selected] : list.slice().sort((a, b) => (b[p] || 0) - (a[p] || 0))[0];
  const rs = sel ? rose(sel, p) : null, gW = weekSplit(p, list.filter((s) => !s.road)), rW = weekSplit(p, roads);
  const top = list.slice().sort((a, b) => (b[p] || 0) - (a[p] || 0)).slice(0, 14);
  const P = POLS[p], big = rs ? rs.bins.map((b, i) => ({ b, i })).filter((x) => x.b.v != null).sort((a, b) => b.b.v - a.b.v)[0] : null, dirN = [tx("north", "北"), tx("north-east", "北東"), tx("east", "東"), tx("south-east", "南東"), tx("south", "南"), tx("south-west", "南西"), tx("west", "西"), tx("north-west", "北西")];
  return head(tx("What is driving it?", "何が汚染をもたらしているか"), tx("Split using differences between points — not guessed shares: regional air from outside, the city's own increment, and the extra next to busy roads.", "地点間の差で分解します（推定比率ではありません）：域外からの広域分、都市による上乗せ、幹線道路沿いの上乗せ。"))
    + (state.pol === "ox" ? '<div class="callout info" style="margin-bottom:14px">' + icon("info") + " " + tx("Photochemical oxidants form in the air, so they cannot be split this way. This page shows NO₂, a main ingredient.", "光化学オキシダントは大気中で生成されるため、この方法では分解できません。主な原因物質のNO₂を表示します。") + "</div>" : "")
    + (D.modelOnly ? '<div class="callout warn" style="margin-bottom:14px">' + icon("alert") + " " + tx("With Open-Meteo only, there are no roadside stations and the model smooths local differences, so the urban and roadside parts are understated. Official or Blended data gives the real split.", "Open-Meteoのみでは自排局が無く、モデルが地域差を平準化するため、都市・沿道分は過小になります。実際の分解には公式またはブレンドデータが必要です。") + "</div>" : "")
    + '<div class="kpis" style="margin-bottom:16px">' + kpi(tx("Regional background", "広域バックグラウンド") + pv("c"), pct(tot.bg, tot.total) + "%", fmt(p, tot.bg) + " " + U(p), PARTC.bg)
    + kpi(tx("Urban increment", "都市による上乗せ") + pv("c"), pct(tot.urb, tot.total) + "%", fmt(p, tot.urb) + " " + U(p), PARTC.urb)
    + kpi(tx("Roadside increment", "沿道の上乗せ") + pv("c"), rTot ? pct(rTot.road, rTot.total) + "%" : "–", rTot ? roads.length + tx(" roadside stations", " 自排局") : tx("no roadside stations", "自排局なし"), PARTC.road)
    + kpi(tx("Controllable locally", "地域で対策可能") + pv("c"), pct(tot.urb + tot.road, tot.total) + "%", tx("urban + roadside", "都市＋沿道"), "var(--ai)") + "</div>"
    + '<div class="card pad" style="margin-bottom:16px"><h3 style="font-size:16px;margin-bottom:10px">' + P.label + " · " + esc(areaName()) + "</h3>" + stackBar([[tx("Regional", "広域"), tot.bg, PARTC.bg], [tx("Urban", "都市"), tot.urb, PARTC.urb], [tx("Roadside", "沿道"), tot.road, PARTC.road]], 30)
    + '<div class="legend" style="justify-content:flex-start"><span><i style="background:' + PARTC.bg + '"></i>' + tx("Regional — level of the cleanest points", "広域 — 最もきれいな地点の水準") + '</span><span><i style="background:' + PARTC.urb + '"></i>' + tx("Urban — extra at general points", "都市 — 一般地点の上乗せ") + '</span><span><i style="background:' + PARTC.road + '"></i>' + tx("Roadside — extra at roadside stations", "沿道 — 自排局の上乗せ") + "</span></div>"
    + '<div class="scroll" style="margin-top:12px"><table class="tbl"><thead><tr><th>' + tx("Point", "地点") + "</th><th>" + P.label + "</th><th style='width:40%'>" + tx("Regional · urban · roadside", "広域・都市・沿道") + "</th><th>" + tx("Local share", "地域由来") + "</th></tr></thead><tbody>"
    + top.map((s) => { const q = dc.get(s.id); return "<tr><td>" + stCell(s) + '</td><td class="num">' + fmt(p, q.v) + "</td><td>" + stackBar([["bg", q.bg, PARTC.bg], ["urb", q.urb, PARTC.urb], ["road", q.road, PARTC.road]], 14) + '</td><td class="num">' + pct(q.urb + q.road, q.v) + "%</td></tr>"; }).join("") + "</tbody></table></div></div>"
    + '<div class="grid g2"><div class="card pad"><h3 style="font-size:15px;margin-bottom:6px">' + tx("Where it comes from: 7-day pollution rose", "どの方向から来るか：7日間の汚染ローズ") + pv("c") + '</h3><select data-act="pickSel" style="border:1px solid var(--line-2);border-radius:8px;padding:6px 8px;margin-bottom:8px;max-width:100%">' + list.map((s) => '<option value="' + s.id + '"' + (sel && s.id === sel.id ? " selected" : "") + ">" + esc(sName(s)) + " — " + esc(tr(s.muni)) + "</option>").join("") + "</select>"
    + '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' + roseSvg(rs, p) + '<div style="flex:1;min-width:200px;font-size:12.5px;color:var(--ink-2);line-height:1.6">' + tx("Each wedge is the average ", "各扇形は、その方向から風が吹いたときの") + P.label + tx(" when the wind blew from that direction over the past week; the centre is calm hours.", "の平均値（過去1週間）です。中央は静穏時。") + (big ? "<br><br><b>" + tx("Highest with wind from the ", "最も高いのは ") + dirN[big.i] + tx("", " からの風のとき") + "</b> (" + fmt(p, big.b.v) + " " + U(p) + ")." : "") + "</div></div></div>"
    + '<div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("Weekday against weekend", "平日と週末") + pv("c") + "</h3>"
    + (gW.nwe ? '<table class="tbl"><thead><tr><th></th><th>' + tx("Weekday", "平日") + "</th><th>" + tx("Weekend", "週末") + "</th><th>" + tx("Change", "変化") + "</th></tr></thead><tbody>"
      + [[tx("General points", "一般地点"), gW], [tx("Roadside stations", "自排局"), rW]].filter((r) => r[1].wd != null).map((r) => "<tr><td><b>" + r[0] + '</b></td><td class="num">' + fmt(p, r[1].wd) + '</td><td class="num">' + fmt(p, r[1].we) + '</td><td class="num" style="color:' + (r[1].we < r[1].wd ? "var(--green)" : "var(--red)") + '">' + pctTxt(r[1].we, r[1].wd) + "</td></tr>").join("") + "</tbody></table>"
      + '<p class="muted" style="font-size:12.5px;margin-top:10px">' + tx("A bigger weekend drop at roadside stations is direct evidence that traffic drives the roadside increment.", "自排局で週末の低下が大きいことは、沿道の上乗せが交通由来である直接的な証拠です。") + "</p>" : '<p class="muted">' + tx("No weekend in the history yet.", "履歴にまだ週末がありません。") + "</p>") + "</div></div>"
    + '<div class="section-head"><h2>' + tx("Reading this", "読み方") + '</h2></div><div class="card pad">'
    + ins("globe", tx("Regional background sets a floor", "広域分は下限を決める"), tx("About ", "約") + pct(tot.bg, tot.total) + tx("% here is at the level of the cleanest points. Local measures cannot remove it.", "%は最もきれいな地点と同じ水準です。地域の対策では除去できません。"))
    + ins("car", tx("Roads add a measurable extra", "道路は測定可能な上乗せを生む"), rTot ? tx("Roadside stations read on average ", "自排局は平均で") + fmt(p, rTot.road) + " " + U(p) + tx(" more than nearby general stations.", "近隣の一般局より高くなっています。") : tx("No roadside stations in this view.", "この表示には自排局がありません。"), "var(--beni-050)", "var(--beni)")
    + ins("factory", tx("The urban part mixes several sources", "都市分は複数の発生源の合計"), tx("Traffic, factories, the port and buildings all contribute; Scenario Analysis states its assumptions for how they divide.", "交通・工場・港湾・建物などが寄与します。シナリオ分析では配分を前提条件として明示しています。")) + "</div>"
    + how([[tx("Regional level", "広域レベル"), tx("At each hour, the cleanest tenth of general points sets the regional level.", "各時刻、一般地点の最もきれいな1割の水準を広域レベルとします。")], [tx("Roadside increment", "沿道の上乗せ"), tx("Each roadside station minus the average of the two nearest general stations within 6 km.", "各自排局から6km以内の最寄り一般局2局の平均を引いた分。")], [tx("Pollution rose", "汚染ローズ"), tx("Pairs each hourly value with the wind direction at that point over the past 7 days.", "過去7日の各時刻の値とその地点の風向を組み合わせます。")]])
    + assumptions([ASM.bg(), ASM.road()])
    + sources(["soramame", "eqs"]);
}

/* ======================= HOTSPOTS ======================= */
function vHotspot() {
  const p = state.pol, ns = nodesFor(p).sort((a, b) => b.v - a.v), dc = decomp(p === "ox" ? "no2" : p, null);
  const sel = (state.selected && D.byId[state.selected]) || (ns[0] && ns[0].st);
  return head(tx("Where is it highest, and why?", "どこが高く、なぜか"), tx("Points ranked on the latest hour. Pick one for its profile: its week, wind, nearby hospitals, and what is expected next.", "最新1時間値の順位です。地点を選ぶと、1週間の推移・風・周辺の病院・今後の見通しを表示します。"))
    + '<div class="card scroll" style="margin-bottom:18px;max-height:440px"><table class="tbl"><thead><tr><th>#</th><th>' + tx("Point", "地点") + "</th><th>" + POLS[p].label + " " + U(p) + "</th><th>" + tx("Level", "レベル") + "</th><th>" + tx("24-hour mean", "24時間平均") + "</th><th>" + tx("vs its own 24 h", "自地点24時間比") + "</th><th></th></tr></thead><tbody>"
    + ns.map((x, i) => { const b = bandOf(p, x.v), dm = dayMean(x.st, p), on = sel && sel.id === x.st.id;
      return "<tr" + (on ? ' style="background:var(--ai-050)"' : "") + '><td><span class="rank" style="background:' + b.hex + '">' + (i + 1) + "</span></td><td>" + stCell(x.st) + '</td><td class="num">' + fmt(p, x.v) + '</td><td><span class="pill" style="color:' + b.hex + ';font-size:10.5px">' + b.name + '</span></td><td class="num">' + fmt(p, dm) + '</td><td class="num" style="color:' + (dm && x.v > dm * 1.1 ? "var(--red)" : "var(--ink-3)") + '">' + (dm ? pctTxt(x.v, dm) : "–") + '</td><td><button class="btn sm' + (on ? " primary" : "") + '" data-act="pick" data-s="' + x.st.id + '">' + (on ? tx("Selected", "選択中") : tx("Profile", "詳細")) + "</button></td></tr>"; }).join("") + "</tbody></table></div>"
    + (sel ? diagnose(sel, p) : "")
    + how([[tx("Ranked on the latest values", "最新値で順位付け"), tx("The latest hourly value at each point.", "各地点の最新1時間値です。")], [tx("The profile", "詳細"), tx("The week's values, pollution rose and wind come from the point itself and the nearest weather point.", "1週間の推移・汚染ローズ・風は当該地点と最寄りの気象地点のものです。")]])
    + assumptions([ASM.bg(), ASM.pop()])
    + sources(["soramame", "amedas", "osm", "wikidata", "cams", "eqs"]);
}
function diagnose(s, p) {
  const P = POLS[p], v = s[p], b = bandOf(p, v), dm = dayMean(s, p), hist = (D.H[s.id] && D.H[s.id][p]) || [], mx = Math.max(...hist.filter((x) => x != null), -1), dcp = p === "ox" ? "no2" : p, q = decomp(dcp, null).get(s.id);
  const w = nearestAmedas(s), hs = near(D.hosp, s, 2), sc = near(D.schools, s, 1), mu = D.munis.find((m) => m.muni && s.muni && s.muni.ja && s.muni.ja.startsWith(m.muni.ja)), r = rose(s, p);
  let next = null; if (D.fcIdx.length > 6 && v != null) next = v * fcRatio(p, D.fcIdx[5]);
  return '<div class="card pad" style="border-left:4px solid ' + b.hex + '"><div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:12px"><div><div class="eyebrow">' + tx("Point profile", "地点の詳細") + '</div><h2 style="font-size:22px;margin:4px 0 2px">' + esc(sName(s)) + '</h2><div class="muted" style="font-size:13px">' + esc(tr(s.muni)) + " · " + typeLabel(s) + "</div></div>"
    + '<div style="text-align:right"><div style="font-size:30px;font-weight:700;color:' + b.hex + ';line-height:1">' + fmt(p, v) + '</div><div class="muted" style="font-size:11.5px">' + U(p) + " · " + b.name + (s.model ? pv("f") : pv("m")) + '</div><div style="font-size:12px;margin-top:3px">' + tx("24 h mean ", "24時間平均 ") + "<b>" + fmt(p, dm) + "</b> · " + tx("7-day max ", "7日間最大 ") + "<b>" + (mx >= 0 ? fmt(p, mx) : "–") + "</b></div></div></div>"
    + '<h4 style="font-size:12.5px;margin-bottom:6px">' + tx("Its past week", "過去1週間") + "</h4>" + lineChart({ n: hist.length, H: 150, series: [{ vals: hist, c: "#1B365D", w: 1.8 }], refs: [{ v: P.th[1], label: tr({ en: "standard line", ja: "基準ライン" }), c: "#E0602A" }], labels: (i) => dayLab(D.times[i]) })
    + '<div class="grid g3" style="margin-top:12px"><div><h4 style="font-size:12.5px;margin-bottom:8px">' + tx("What it is made of", "内訳") + pv("c") + "</h4>" + (q ? stackBar([[tx("Regional", "広域"), q.bg, PARTC.bg], [tx("Urban", "都市"), q.urb, PARTC.urb], [tx("Roadside", "沿道"), q.road, PARTC.road]], 22) + '<table class="tbl" style="margin-top:6px"><tbody><tr><td>' + tx("Regional", "広域") + '</td><td class="num">' + fmt(dcp, q.bg) + "</td></tr><tr><td>" + tx("Urban", "都市") + '</td><td class="num">' + fmt(dcp, q.urb) + "</td></tr><tr><td>" + tx("Roadside", "沿道") + '</td><td class="num">' + fmt(dcp, q.road) + "</td></tr></tbody></table>" : "–") + "</div>"
    + '<div><h4 style="font-size:12.5px;margin-bottom:6px">' + tx("Where it comes from", "どの方向から") + pv("c") + "</h4>" + roseSvg(r, p) + "</div>"
    + '<div><h4 style="font-size:12.5px;margin-bottom:8px">' + tx("Around it", "周辺") + '</h4><table class="tbl"><tbody>'
    + (w ? "<tr><td>" + tx("Wind", "風") + "</td><td><b>" + compass(w.wd) + " · " + w.ws + ' m/s</b><div class="muted" style="font-size:11px">' + WXS() + " " + esc(state.lang === "en" ? w.nameEn : w.name) + ", " + w.dist.toFixed(1) + " km</div></td></tr>" : "")
    + "<tr><td>" + tx("Hospitals ≤ 2 km", "病院（2km以内）") + pv("r") + "</td><td><b>" + hs.length + "</b>" + (hs.length ? '<div class="muted" style="font-size:11px">' + hs.slice(0, 3).map((o) => esc(state.lang === "en" && o.x.ne ? o.x.ne : o.x.n || "–") + " (" + o.d.toFixed(1) + " km)").join("<br>") + "</div>" : "") + "</td></tr>"
    + (D.schools.length ? "<tr><td>" + tx("Schools ≤ 1 km", "学校（1km以内）") + pv("r") + "</td><td><b>" + sc.length + "</b></td></tr>" : "")
    + (mu ? "<tr><td>" + tx("Population of ", "人口：") + esc(tr(mu.muni)) + pv("r") + "</td><td><b>" + nf(mu.pop) + "</b></td></tr>" : "")
    + (next != null ? "<tr><td>" + tx("In about 6 hours", "約6時間後") + pv("f") + '</td><td><b style="color:' + bandOf(p, next).hex + '">' + fmt(p, next) + " " + U(p) + "</b></td></tr>" : "")
    + "</tbody></table></div></div></div>";
}

/* ======================= WHO BREATHES IT ======================= */
function vExposure() {
  const p = state.pol, P = POLS[p], e = exposure(p);
  if (!e) return head(tx("Who is breathing it?", "誰が影響を受けているか"), "") + '<div class="callout warn">' + icon("alert") + " " + tx("Population data is not available.", "人口データがありません。") + "</div>";
  const rows = e.rows.map((r) => Object.assign(r, { load: r.v * r.m.pop })).sort((a, b) => b.load - a.load), totL = rows.reduce((s, r) => s + r.load, 0) || 1, ns = metricNodes(p, null);
  const hosp = D.hosp.map((h) => ({ h, v: idw(ns, h.lat, h.lon) })).filter((x) => x.v.v != null && x.v.dmin <= 10).sort((a, b) => b.v.v - a.v.v);
  const schAbove = D.schools.map((s) => idw(ns, s.lat, s.lon)).filter((r) => r.v != null && r.dmin <= 10 && r.v > P.std).length;
  const basis = e.basis === "day" ? tx("last-24-hour mean", "直近24時間平均") : tx("latest hour", "最新1時間値");
  return head(tx("Who is breathing it?", "誰が影響を受けているか"), tx("Population by municipality combined with air quality — compared against Japan's standard on the same basis the standard uses.", "市区町村の人口と大気質を組み合わせ、環境基準と同じ評価方法で比較します。"))
    + '<div class="kpis" style="margin-bottom:16px">' + kpi(tx("Average where people live", "居住地ベースの平均") + pv("c"), fmt(p, e.wavg) + " <small>" + U(p) + "</small>", tx("population-weighted · ", "人口加重・") + basis, bandOf(p, e.wavg).hex)
    + kpi(tx("People above the standard", "基準超過地域の人口") + pv("c"), nf(e.exceed), e.pct.toFixed(1) + "%", e.exceed ? "var(--red)" : "var(--green)")
    + kpi(tx("Population covered", "対象人口") + pv("r"), (e.pop / 1e6).toFixed(2) + tx("m", "百万人"), e.rows.length + tx(" municipalities", " 市区町村") + (D.ctx.builtin ? tx(" (rounded)", "（概数）") : ""))
    + (D.schools.length ? kpi(tx("Schools above the standard", "基準超過地点の学校") + pv("c"), schAbove, tx("of ", "全") + D.schools.length, schAbove ? "var(--red)" : "var(--green)") : kpi(tx("Hospitals tracked", "対象病院") + pv("r"), D.hosp.length, D.ctx.builtin ? tx("major hospitals", "主要病院") : "OSM")) + "</div>"
    + (e.exceed === 0 ? '<div class="callout ok" style="margin-bottom:16px">' + icon("check") + " " + tx("Nobody here currently lives where the ", "現在、") + P.label + tx(" standard is exceeded (", "の基準を超える場所に住む人はいません（") + basis + tx(").", "）。") + "</div>" : "")
    + '<div class="grid g2"><div class="card" style="padding:14px"><h3 style="font-size:15px;margin:2px 4px 8px">' + tx("On the standard's basis", "環境基準の評価方法による値") + " (" + basis + ")</h3>" + mapSlot("expo", { metric: true, hosp: true }, "mid") + mapLegend(p) + "</div>"
    + '<div class="card pad"><h3 style="font-size:15px;margin-bottom:4px">' + tx("Where the burden is greatest", "負荷が大きい地域") + '</h3><div class="muted" style="font-size:12px;margin-bottom:8px">' + tx("Level × residents", "濃度 × 居住人口") + '</div><div class="scroll" style="max-height:400px"><table class="tbl"><thead><tr><th>' + tx("Municipality", "市区町村") + "</th><th>" + tx("People", "人口") + "</th><th>" + P.label + "</th><th>" + tx("Share", "割合") + "</th></tr></thead><tbody>"
    + rows.slice(0, 25).map((r) => "<tr><td><b>" + esc(tr(r.m.muni)) + '</b></td><td class="num">' + nf(r.m.pop) + '</td><td class="num" style="color:' + bandOf(p, r.v).hex + '">' + fmt(p, r.v) + '</td><td class="num">' + ((r.load / totL) * 100).toFixed(1) + "%</td></tr>").join("") + "</tbody></table></div></div></div>"
    + (hosp.length ? '<div class="section-head"><h2>' + tx("Hospitals", "病院") + '</h2></div><div class="card scroll" style="max-height:360px"><table class="tbl"><thead><tr><th>' + tx("Hospital", "病院") + "</th><th>" + P.label + "</th><th>" + tx("Nearest point", "最寄り地点") + "</th></tr></thead><tbody>"
      + hosp.slice(0, 20).map((x) => "<tr><td><b>" + esc(state.lang === "en" && x.h.ne ? x.h.ne : x.h.n || "–") + '</b></td><td class="num" style="color:' + bandOf(p, x.v.v).hex + '">' + fmt(p, x.v.v) + '</td><td class="muted">' + x.v.dmin.toFixed(1) + " km</td></tr>").join("") + "</tbody></table></div>" : "")
    + how([[tx("Population is published data", "人口は公表データ"), D.ctx.builtin ? tx("Rounded 2020 census figures built into the page (the collected Wikidata file is used when deployed).", "ページ内蔵の2020年国勢調査の概数（デプロイ時は収集したWikidataファイルを使用）。") : tx("Collected weekly from Wikidata, citing the national census.", "国勢調査を出典とするWikidataから毎週取得。")],
      [tx("Compared the way the standard is written", "基準の定義どおりに比較"), tx("Daily standards use each point's last 24 hours; Ox uses the latest hour.", "日平均基準は各地点の直近24時間、Oxは最新1時間値を使います。")]])
    + assumptions([ASM.pop(), ASM.map(), [tx("Each municipality takes the level at its centre", "各市区町村は代表点の値"), tx("One value per municipality.", "市区町村ごとに1つの値です。"), tx("centroid", "代表点")]])
    + sources(["soramame", "wikidata", "osm", "eqs", "cad"]);
}

/* ======================= NEXT 3 DAYS ======================= */
function vForecast() {
  const p = state.pol, P = POLS[p], vf = verify(p), ser = areaAxisSeries(p), nH = D.times.length, jf = D.latest.jmaForecast;
  if (!D.fcIdx.length) return head(tx("The next 3 days", "今後3日間"), "") + '<div class="card pad">' + tx("The forecast is not available in this view.", "この表示では予測がありません。") + "</div>" + jmaBlock(jf) + sources(["cams", "jmaFc"]);
  const from = Math.max(0, nH - 48), s2 = ser.slice(from), now = ser[nH - 1];
  const band = { lo: s2.map((v, i) => (from + i >= nH - 1 && v != null ? fcRange(p, v, from + i - nH + 1).lo : null)), hi: s2.map((v, i) => (from + i >= nH - 1 && v != null ? fcRange(p, v, from + i - nH + 1).hi : null)) };
  const picks = [6, 12, 24, 48, 72].map((h) => { const i = nH - 1 + h; if (i >= ser.length || ser[i] == null) return null; return { h, i, v: ser[i], r: fcRange(p, ser[i], h) }; }).filter(Boolean);
  const t24 = picks.find((x) => x.h === 24) || picks[0], fut = ser.slice(nH), pk = fut.reduce((m, v, i) => (v != null && (!m || v > m.v) ? { v, i: nH + i } : m), null), dir = t24 && now ? (t24.v - now) / now : 0;
  const word = Math.abs(dir) < 0.08 ? tx("stay about the same", "ほぼ横ばい") : dir > 0 ? tx("rise", "上昇") : tx("fall", "低下"), mx = Math.max(...picks.map((x) => x.r.hi)) * 1.1;
  const conf = { hi: tx("Fairly confident", "比較的確か"), md: tx("Moderately confident", "中程度"), lo: tx("Less confident", "不確か") };
  return head(tx("What happens over the next 3 days", "今後3日間の見通し"), tx("A model forecast shown with a range, not a single number" + (vf ? " — corrected and checked against Osaka's own measurements." : "."), "幅付きのモデル予測" + (vf ? "（大阪の実測値で補正・検証済み）。" : "。")))
    + (t24 ? '<div class="bigread" style="margin-bottom:16px"><div class="brl">' + tx("In plain terms", "要点") + '</div><div class="brv">' + tx("Over the next 24 hours, ", "今後24時間で、") + esc(areaName()) + tx("'s ", "の") + P.label + tx(" is expected to ", "は") + "<b>" + word + "</b>" + tx("", "する見込みです") + (Math.abs(dir) >= 0.08 ? tx(" — by roughly ", "（約") + Math.round(Math.abs(dir) * 100) + tx("%", "%）") : "") + '.</div><div class="brm">' + tx("This time tomorrow: ", "明日の同時刻：") + "<b>" + fmt(p, t24.v) + " " + U(p) + "</b> (" + bandOf(p, t24.v).name + "). " + tx("Likely range ", "予想範囲 ") + "<b>" + fmt(p, t24.r.lo) + "–" + fmt(p, t24.r.hi) + '</b>. <span class="unc ' + t24.r.conf + '">' + conf[t24.r.conf] + "</span>" + (pk ? " " + tx("Highest expected: ", "最高値：") + "<b>" + fmt(p, pk.v) + "</b> " + fmtDH(D.axis[pk.i].t) + "." : "") + "</div></div>" : "")
    + '<div class="card pad" style="margin-bottom:16px"><h3 style="font-size:15px;margin-bottom:6px">' + tx("Last 2 days and next 3 days", "直近2日と今後3日") + "</h3>"
    + lineChart({ n: s2.length, series: [{ vals: s2.map((v, i) => (from + i < nH ? v : null)), c: "#1B365D" }, { vals: s2.map((v, i) => (from + i >= nH - 1 ? v : null)), c: "#6A3FA0", dash: true }], band, nowI: nH - 1 - from,
      refs: [{ v: P.th[1], label: tr({ en: "standard line", ja: "基準ライン" }), c: "#E0602A" }].concat(p === "ox" ? [{ v: 120, label: tr({ en: "advisory 120", ja: "注意報 120" }), c: "#8E2C8E" }] : []),
      labels: (i) => dayLab(D.axis[from + i] && D.axis[from + i].t),
      legend: [[D.modelOnly ? tx("Past (model)", "過去（モデル）") : tx("Measured", "実測"), "#1B365D"], [tx("Forecast", "予測"), "#6A3FA0"], [tx("Likely range", "予想範囲"), "#6A3FA0", 1]] }) + "</div>"
    + '<div class="grid g2"><div class="card scroll"><table class="tbl"><thead><tr><th>' + tx("Ahead", "先") + "</th><th>" + tx("When", "日時") + "</th><th>" + tx("Estimate", "予測値") + "</th><th style='min-width:150px'>" + tx("Likely range", "予想範囲") + "</th><th>" + tx("Confidence", "確からしさ") + "</th></tr></thead><tbody>"
    + picks.map((x) => "<tr><td><b>" + (x.h < 24 ? x.h + tx(" h", "時間") : x.h / 24 + tx(" day", "日") + (x.h > 24 ? tx("s", "") : "")) + '</b></td><td class="muted">' + fmtDH(D.axis[x.i].t) + '</td><td class="num" style="color:' + bandOf(p, x.v).hex + '">' + fmt(p, x.v) + '</td><td><div style="font-size:11.5px">' + fmt(p, x.r.lo) + "–" + fmt(p, x.r.hi) + '</div><div class="ubar"><div class="rng" style="left:' + (x.r.lo / mx * 100) + "%;width:" + ((x.r.hi - x.r.lo) / mx * 100) + '%"></div><div class="cen" style="left:' + (x.v / mx * 100) + '%"></div></div></td><td><span class="unc ' + x.r.conf + '">' + conf[x.r.conf] + "</span></td></tr>").join("") + "</tbody></table></div>"
    + '<div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("How good is this forecast?", "予測の精度") + pv("c") + "</h3>"
    + (vf ? '<table class="tbl"><tbody><tr><td>' + tx("Hours compared with official measurements", "公的実測と比較した時間数") + '</td><td class="num">' + vf.n + "</td></tr>" + (vf.rawMae != null ? "<tr><td>" + tx("Model error before correction", "補正前の誤差") + '</td><td class="num">' + fmt(p, vf.rawMae) + "</td></tr><tr><td>" + tx("Model bias", "モデルの偏り") + '</td><td class="num">' + (vf.bias > 0 ? "+" : "") + fmt(p, vf.bias) + "</td></tr>" : "") + "<tr><td>" + tx("Error after correction", "補正後の誤差") + '</td><td class="num">' + fmt(p, vf.mae) + " " + U(p) + "</td></tr></tbody></table>"
      : '<p class="muted" style="font-size:13px">' + tx("Checking the forecast needs official station measurements (Official or Blended, once deployed). In this view the range uses a rule of thumb of ±25%.", "予測の検証には公的測定局の実測が必要です（デプロイ後の公式・ブレンド）。この表示では予想範囲に±25%の目安を使っています。") + "</p>") + "</div></div>"
    + jmaBlock(jf)
    + how([[tx("The model", "モデル"), tx("The European Copernicus Atmosphere Monitoring Service models the whole region, including pollution arriving from continental Asia.", "欧州のコペルニクス大気監視サービスは、大陸からの越境汚染を含め広域をモデル化しています。")],
      [tx("Correcting it with Osaka's measurements", "大阪の実測による補正"), tx("When official data is available, the model's past week is compared with measurements and its average bias removed.", "公式データがある場合、モデルの過去1週間を実測と比較し、平均的な偏りを除きます。")]])
    + assumptions([[tx("Past model error represents future error", "過去の誤差が将来も同程度と仮定"), tx("The measured error (or ±25% without measurements) is used for the next 3 days, widening with lead time.", "実測誤差（実測が無い場合は±25%）を今後3日にも使い、先ほど広げます。"), "±1.28 × RMSE × √(1+h/24)"], ASM.units()])
    + sources(["cams", "soramame", "jmaFc", "eqs"]);
}
function wxWord(code) { const c = String(code || "")[0]; return { 1: tx("Sunny", "晴れ"), 2: tx("Cloudy", "くもり"), 3: tx("Rain", "雨"), 4: tx("Snow", "雪") }[c] || "–"; }
function jmaBlock(jf) {
  if (!jf || !jf.short) return "";
  const s = jf.short;
  return '<div class="section-head"><h2>' + tx("Official weather forecast — Japan Meteorological Agency", "気象庁の天気予報") + pv("f") + '</h2><div class="d">' + esc(jf.office || "") + " · " + fmtT(jf.reportDatetime) + '</div></div><div class="card scroll"><table class="tbl"><thead><tr><th>' + tx("Day", "日") + "</th><th>" + tx("Weather", "天気") + "</th><th>" + tx("Wind", "風") + "</th></tr></thead><tbody>"
    + (s.times || []).map((t, i) => "<tr><td><b>" + new Date(t).toLocaleDateString(state.lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo", weekday: "short", month: "short", day: "numeric" }) + "</b></td><td><b>" + wxWord(s.codes && s.codes[i]) + '</b><div class="muted" style="font-size:12px">' + esc((s.weathers && s.weathers[i]) || "") + '</div></td><td class="muted" style="font-size:12px">' + esc((s.winds && s.winds[i]) || "") + "</td></tr>").join("") + "</tbody></table></div>";
}

/* ======================= SMOG & ASIAN DUST ======================= */
function vEpisodes() {
  const ox = nodesFor("ox").sort((a, b) => b.v - a.v), oxMax = ox[0], adv = ox.filter((x) => x.v >= 120), abv = ox.filter((x) => x.v > 60);
  const oxWeek = areaStations().map((s) => ({ s, m: Math.max(...((D.H[s.id] && D.H[s.id].ox) || []).filter((x) => x != null), -1) })).filter((x) => x.m >= 0).sort((a, b) => b.m - a.m);
  const ks = areaStations().map((s) => ({ s, k: kosaFlag(s) })).filter((x) => x.k), kFlag = ks.filter((x) => x.k.flag), prof = hourProfile("ox"), w = D.wxOsaka, warn = D.latest.warnings;
  const f = D.fc, dust = f && f.dust ? D.fcIdx.map((i) => f.dust[i]) : [], dustMax = dust.filter((x) => x != null).length ? Math.max(...dust.filter((x) => x != null)) : null;
  MAPREG.epi = { pol: state.pol === "spm" ? "spm" : "ox" };
  return head(tx("Photochemical smog and Asian dust (kōsa, 黄砂)", "光化学スモッグと黄砂"), tx("Osaka's two recurring episodes: summer smog from sunlight acting on pollution, and spring dust from continental Asia — tracked against official thresholds.", "大阪で繰り返し起こる2つの現象：夏の光化学スモッグと春の黄砂。公式基準と照合して監視します。"))
    + (warn && warn.headline ? '<div class="callout warn" style="margin-bottom:14px">' + icon("bell") + " <b>" + tx("JMA headline for Osaka", "気象庁 大阪府の見出し") + ":</b> " + esc(warn.headline) + "</div>" : "")
    + '<div class="grid g2"><div class="card pad" style="border-top:3px solid #8E2C8E"><h3 style="font-size:16px;margin-bottom:10px">' + icon("sun") + " " + tx("Photochemical smog", "光化学スモッグ") + "</h3>"
    + '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">' + kpi(tx("Highest Ox now", "現在の最高Ox") + pv("m"), oxMax ? fmt("ox", oxMax.v) + " <small>ppb</small>" : "–", oxMax ? esc(sName(oxMax.st)) : "", oxMax && bandOf("ox", oxMax.v).hex)
    + kpi(tx("Above hourly standard", "1時間値基準超過"), abv.length, "> 60 ppb", abv.length ? "var(--amber)" : "var(--green)") + kpi(tx("At advisory level", "注意報レベル"), adv.length, "≥ 120 ppb", adv.length ? "var(--red)" : "var(--green)") + "</div>"
    + (adv.length ? '<div class="callout red" style="margin-top:10px">' + icon("alert") + " " + tx("At the advisory threshold. Only Osaka Prefecture issues the official advisory.", "注意報の基準に達しています。正式な注意報は大阪府が発令します。") + "</div>" : "")
    + '<h4 style="font-size:12.5px;margin:14px 0 4px">' + tx("Typical day this week (Ox)", "今週の1日の典型（Ox）") + pv("c") + "</h4>" + barsChart(prof, "ox", prof.map((x, i) => (i % 3 === 0 ? String(i) : "")), prof.indexOf(Math.max(...prof.filter((x) => x != null))))
    + '<h4 style="font-size:12.5px;margin:10px 0 4px">' + tx("Highest hourly Ox in the past 7 days", "過去7日間の最高Ox") + '</h4><table class="tbl"><tbody>' + oxWeek.slice(0, 5).map((x) => "<tr><td>" + stCell(x.s) + '</td><td class="num" style="color:' + bandOf("ox", x.m).hex + '">' + fmt("ox", x.m) + " ppb</td></tr>").join("") + "</tbody></table>"
    + '<p class="muted" style="font-size:12px;margin-top:8px">' + tx("Smog rises with strong sun, heat and light wind. Now: ", "スモッグは強い日射・高温・弱風で高まります。現在：") + (w ? (w.temp != null ? w.temp + " °C, " : "") + tx("wind ", "風 ") + w.ws + " m/s" : "–") + "</p></div>"
    + '<div class="card pad" style="border-top:3px solid #C77A12"><h3 style="font-size:16px;margin-bottom:10px">' + icon("dust") + " " + tx("Asian dust (kōsa, 黄砂)", "黄砂") + "</h3>"
    + '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr">' + kpi(tx("Points showing coarse dust", "粗大粒子優勢の地点") + pv("c"), kFlag.length + " / " + ks.length, tx("SPM high, PM2.5 share low", "SPM高・PM2.5比率低"), kFlag.length ? "var(--amber)" : "var(--green)")
    + kpi(tx("Highest SPM now", "現在の最高SPM") + pv("m"), fmt("spm", Math.max(...areaStations().map((s) => s.spm || 0))) + " <small>mg/m³</small>", tx("hourly standard 0.20", "1時間値基準 0.20"))
    + kpi(tx("Model dust, next 3 days", "モデルのダスト（3日）") + pv("f"), dustMax != null ? Math.round(dustMax) + " <small>µg/m³</small>" : "–", tx("peak", "最大"), dustMax > 50 ? "var(--amber)" : "var(--ink)") + "</div>"
    + (kFlag.length ? '<div class="callout warn" style="margin-top:10px">' + icon("dust") + " " + tx("Coarse particles dominate at some points — a typical Asian dust (kōsa) signature. Check the Japan Meteorological Agency's kōsa information.", "一部の地点で粗大粒子が優勢です。黄砂の典型的な兆候です。気象庁の黄砂情報を確認してください。") + "</div>" : '<div class="callout ok" style="margin-top:10px">' + icon("check") + " " + tx("No coarse-dust signature in the latest hour.", "最新1時間値に黄砂の兆候はありません。") + "</div>")
    + (dust.length ? '<h4 style="font-size:12.5px;margin:14px 0 4px">' + tx("Model dust forecast", "ダスト予測（モデル）") + pv("f") + "</h4>" + lineChart({ n: dust.length, H: 140, series: [{ vals: dust, c: "#C77A12" }], labels: (i) => dayLab(D.axis[D.times.length + i] && D.axis[D.times.length + i].t) }) : "") + "</div></div>"
    + '<div class="card" style="padding:14px;margin-top:16px">' + mapBar() + mapSlot("epi", MAPREG.epi) + mapLegend(MAPREG.epi.pol) + "</div>"
    + how([[tx("Smog is tracked on Ox", "スモッグはOxで監視"), tx("The hourly standard is 60 ppb; 120 ppb is the national advisory threshold.", "環境基準（1時間値）は60 ppb、注意報の全国基準は120 ppbです。")], [tx("Dust is spotted from the particle mix", "黄砂は粒子の構成で検知"), tx("When SPM is high but PM2.5 is a small share of it, coarse dust is the likely cause.", "SPMが高くPM2.5の割合が小さい場合、黄砂の可能性が高くなります。")]], tx("Official advisories come from Osaka Prefecture; kōsa (Asian dust) information from the Japan Meteorological Agency.", "正式な注意報は大阪府、黄砂情報は気象庁が発表します。"))
    + assumptions([[tx("Coarse-dust signature threshold", "黄砂判定のしきい値"), tx("Flagged when SPM ≥ 0.05 mg/m³ and PM2.5 < 35% of SPM. A screening rule, not an official definition.", "SPMが0.05 mg/m³以上かつPM2.5がSPMの35%未満。スクリーニング用の目安です。"), "0.05 / 35%"], ASM.prelim()])
    + sources(["soramame", "amedas", "cams", "jmaWarn", "alerts", "eqs"]);
}

/* ======================= SCENARIO ANALYSIS ======================= */
const PRESETS = { base: { n: { en: "Baseline", ja: "ベースライン" }, s: Object.assign({}, SC0) }, clean: { n: { en: "Clean transport 2030", ja: "クリーン交通2030" }, s: Object.assign({}, SC0, { ev: 40, heavy: 30, shift: 10, lez: true }) },
  port: { n: { en: "Green port & industry", ja: "グリーン港湾・産業" }, s: Object.assign({}, SC0, { port: 40, green: 5 }) }, all: { n: { en: "Combined package", ja: "統合パッケージ" }, s: Object.assign({}, SC0, { ev: 40, heavy: 30, shift: 10, lez: true, port: 40, green: 8 }) } };
const LIBRARY = [{ id: "lez", ic: "car", n: { en: "Low emission zone, Umeda–Namba", ja: "低排出ゾーン（梅田〜難波）" }, d: { en: "Restrict older, higher-emitting vehicles along the central axis", ja: "都心軸で旧式・高排出車両を制限" }, s: { lez: true } },
  { id: "trucks", ic: "truck", n: { en: "Half of buses and trucks zero-emission", ja: "バス・トラックの半数をゼロエミッション化" }, d: { en: "Heavy vehicles produce most road NO₂", ja: "道路由来NO₂の大半は大型車" }, s: { heavy: 50 } },
  { id: "portsc", ic: "ship", n: { en: "Shore power and port controls", ja: "陸上電力供給と港湾対策" }, d: { en: "Cut port and bay-industry emissions by 40%", ja: "港湾・臨海産業の排出を40%削減" }, s: { port: 40 } },
  { id: "kosa", ic: "dust", n: { en: "Stress test: strong Asian dust (kōsa) day", ja: "ストレステスト：強い黄砂の日" }, d: { en: "Not controllable — does the plan still hold?", ja: "制御不能な事象で計画を検証" }, s: { kosa: 80 } }];
function scenStats(sc) {
  const p = scPol(), base = nodesFor(p), sN = nodesFor(p, { sc }), bA = mean(base.map((x) => x.v)), sA = mean(sN.map((x) => x.v));
  const std = POLS[p].std, bM = metricNodes(p, null).filter((x) => inArea(x.st)), sM = metricNodes(p, sc).filter((x) => inArea(x.st));
  const eB = exposure(p, null), eS = exposure(p, sc);
  let best = null; base.forEach((x) => { const y = sN.find((z) => z.st.id === x.st.id); if (!y || !x.v) return; const d = (y.v - x.v) / x.v; if (!best || d < best.d) best = { st: x.st, d }; });
  return { p, bA, sA, pct: bA ? ((sA - bA) / bA) * 100 : 0, bAbove: bM.filter((x) => x.v > std).length, sAbove: sM.filter((x) => x.v > std).length, eB, eS, best };
}
function impactHtml(st) { const p = st.p, col = st.pct < -0.05 ? "var(--green)" : st.pct > 0.05 ? "var(--red)" : "var(--ink-3)";
  return kpi(tx("Baseline average", "ベースライン平均") + pv("m"), fmt(p, st.bA) + " <small>" + U(p) + "</small>", POLS[p].label + " · " + tx("latest hour", "最新1時間値"))
    + kpi(tx("Scenario average", "シナリオ平均") + pv("a"), fmt(p, st.sA) + " <small>" + U(p) + "</small>", POLS[p].label, col)
    + kpi(tx("Change", "変化"), (st.pct > 0 ? "+" : "") + st.pct.toFixed(1) + "%", tx("area average", "エリア平均"), col)
    + kpi(tx("Points above standard", "基準超過地点"), st.bAbove + " → " + st.sAbove, tx("on the standard's own basis", "基準の評価方法で")); }
function scenReadHtml(st) { const sc = state.sc, p = st.p, P = POLS[p], act = [];
  if (sc.ev) act.push(tx("electric cars and vans ", "電動乗用車・小型商用車 ") + sc.ev + "%"); if (sc.heavy) act.push(tx("zero-emission buses and trucks ", "ゼロエミッションのバス・トラック ") + sc.heavy + "%"); if (sc.shift) act.push(tx("shift to rail and bus ", "鉄道・バスへの転換 ") + sc.shift + "%");
  if (sc.lez) act.push(tx("low emission zone", "低排出ゾーン")); if (sc.port) act.push(tx("port and industry controls ", "港湾・産業対策 ") + sc.port + "%"); if (sc.green) act.push(tx("tree canopy +", "樹冠 +") + sc.green + " pt"); if (sc.kosa) act.push(tx("Asian dust (kōsa) stress ", "黄砂ストレス ") + sc.kosa + "%"); if (sc.wx !== "obs") act.push(sc.wx === "calm" ? tx("calm weather", "静穏") : tx("windy weather", "強風"));
  if (!act.length) return '<p class="muted" style="margin:0">' + tx("Choose a scenario from the library or move a control below.", "シナリオライブラリから選ぶか、下の設定を動かしてください。") + "</p>";
  const dt = decompTotals(p, null), loc = dt ? pct(dt.urb + dt.road, dt.total) : null;
  return ins("trend", tx("Net effect", "全体の効果"), tx("With ", "") + act.join(", ") + tx(", the area's ", "により、エリアの") + P.label + tx(" changes by an estimated ", "は推定 ") + "<b>" + (st.pct > 0 ? "+" : "") + st.pct.toFixed(1) + "%</b>" + tx(".", " 変化します。"))
    + (st.best ? ins("target", tx("Largest improvement", "最も改善する地点"), "<b>" + esc(sName(st.best.st)) + "</b> (" + (st.best.d * 100).toFixed(1) + "%).", "#E9F7F0", "var(--green)") : "")
    + (st.eB && st.eS ? ins("users", tx("People above the standard", "基準超過地域の人口"), nf(st.eB.exceed) + " → <b>" + nf(st.eS.exceed) + "</b>") : "")
    + (loc != null ? ins("globe", tx("Why the effect has a ceiling", "効果に上限がある理由"), tx("Only the urban and roadside parts — about ", "地域の対策が作用するのは都市・沿道分（約") + loc + tx("% here — respond to local measures.", "%）のみです。"), "var(--surface-2)", "var(--ink-2)") : ""); }
function scenResHtml() { const sc = state.sc; return '<table class="tbl"><thead><tr><th>' + tx("Pollutant", "物質") + "</th><th>" + tx("Now", "現在") + "</th><th>" + tx("Scenario", "シナリオ") + pv("a") + "</th><th>" + tx("Change", "変化") + "</th><th>" + tx("Above standard", "基準超過") + "</th></tr></thead><tbody>"
  + ["no2", "pm25", "spm"].map((k) => { const b = mean(nodesFor(k).map((x) => x.v)), s = mean(nodesFor(k, { sc }).map((x) => x.v)), c = b ? ((s - b) / b) * 100 : 0, std = POLS[k].std, ab = metricNodes(k, null).filter((x) => inArea(x.st) && x.v > std).length, as = metricNodes(k, sc).filter((x) => inArea(x.st) && x.v > std).length;
    return "<tr><td><b>" + POLS[k].label + '</b> <span class="muted">' + U(k) + '</span></td><td class="num">' + fmt(k, b) + '</td><td class="num" style="color:' + bandOf(k, s).hex + '">' + fmt(k, s) + '</td><td class="num" style="color:' + (c < -0.05 ? "var(--green)" : c > 0.05 ? "var(--red)" : "var(--ink-3)") + '">' + (c > 0 ? "+" : "") + c.toFixed(1) + '%</td><td class="num">' + ab + " → " + as + "</td></tr>"; }).join("")
  + '<tr><td><b>Ox</b></td><td colspan="4" class="muted" style="font-size:12px">' + tx("Not modelled — cutting NO₂ can raise ozone locally, so a chemistry model is needed.", "モデル化していません。NO₂の削減は局所的にオゾンを増やすことがあるため、化学反応モデルが必要です。") + "</td></tr></tbody></table>"; }
function vScen() {
  const sc = state.sc, st = scenStats(sc), p = st.p;
  const sl = (k, max, unit, lab, hint) => '<div class="slider-field"><div class="sl-top"><label>' + lab + '</label><span class="sl-val" id="sv-' + k + '">' + sc[k] + unit + '</span></div><input type="range" min="0" max="' + max + '" value="' + sc[k] + '" data-act="sc" data-k="' + k + '" data-u="' + unit + '"/><div class="sl-hint">' + hint + "</div></div>";
  MAPREG.base = { pol: p, wind: false }; MAPREG.scen = { pol: p, sc: true, wind: false }; MAPREG.delta = { pol: p, delta: true };
  return head(tx("Scenario Analysis", "シナリオ分析"), tx("Assess the impact of transport, port and greening interventions on Osaka's air quality against today's baseline.", "交通・港湾・緑化の施策が大阪の大気質に与える影響を、現在のベースラインと比較して評価します。"))
    + (!SCEN_POLS.includes(state.pol) ? '<div class="callout info" style="margin-bottom:14px">' + icon("info") + " " + tx("Scenarios apply to PM2.5, NO₂ and SPM. Maps show PM2.5 while ", "シナリオはPM2.5・NO₂・SPMに適用します。") + POLS[state.pol].label + tx(" is selected.", "選択時、地図はPM2.5を表示します。") + "</div>" : "")
    + '<div class="section-head" style="margin-top:0"><h2>' + tx("Scenario library", "シナリオライブラリ") + '</h2></div><div class="grid g4" style="margin-bottom:16px">'
    + LIBRARY.map((l) => '<button class="libcard' + (state.preset === l.id ? " on" : "") + '" data-act="lib" data-k="' + l.id + '"><span class="li">' + icon(l.ic) + "</span><span><b>" + tr(l.n) + "</b><span>" + tr(l.d) + "</span></span></button>").join("") + "</div>"
    + '<div class="card pad"><div class="dm-title"><span>' + POLS[p].label + " · " + tx("Packages", "パッケージ") + ': <span class="btnrow" style="display:inline-flex;margin-left:6px">' + Object.keys(PRESETS).map((k) => '<button class="btn sm' + (state.preset === k ? " primary" : "") + '" data-act="preset" data-k="' + k + '">' + tr(PRESETS[k].n) + "</button>").join("") + "</span></span>"
    + baseSelect() + ' <span class="seg"><button class="' + (state.scenView === "side" ? "on" : "") + '" data-act="sview" data-v="side">' + tx("Side by side", "並べて比較") + '</button><button class="' + (state.scenView === "delta" ? "on" : "") + '" data-act="sview" data-v="delta">' + tx("Change map", "変化量マップ") + "</button></span></div>"
    + (state.scenView === "side" ? '<div class="scen-maps"><div><div class="dm-title"><span>' + tx("Baseline — now", "ベースライン — 現在") + pv("m") + "</span></div>" + mapSlot("base", MAPREG.base, "half") + '</div><div><div class="dm-title"><span>' + tx("Scenario outcome", "シナリオ結果") + pv("a") + "</span></div>" + mapSlot("scen", MAPREG.scen, "half") + "</div></div>" + mapLegend(p)
      : '<div class="dm-title"><span>' + tx("Change from baseline", "ベースラインからの変化") + " (" + POLS[p].label + ", %)</span></div>" + mapSlot("delta", MAPREG.delta, "half") + '<div class="maplegend">' + [[-20, "#0B6E4F"], [-10, "#2FA37A"], [-5, "#7FCBA8"], [-1, "#CFEBDD"]].map((x) => '<span><i style="background:' + x[1] + '"></i>≤ ' + x[0] + "%</span>").join("") + '<span><i style="background:#E0602A"></i>' + tx("increase", "増加") + "</span></div>") + "</div>"
    + '<div class="kpis" id="impact" style="margin:16px 0">' + impactHtml(st) + "</div>"
    + '<div class="card pad no-print"><div class="controls">'
    + '<div class="ctrl-group">' + icon("car") + tx("Transport", "交通") + "</div>" + sl("ev", 100, "%", tx("Electric cars and vans", "電動の乗用車・小型商用車"), tx("Share of cars and light vans that are electric", "乗用車・小型商用車に占める電動車の割合")) + sl("heavy", 100, "%", tx("Zero-emission buses and trucks", "ゼロエミッションのバス・トラック"), tx("Share of buses and heavy trucks that are zero-emission", "バス・大型トラックに占めるゼロエミッション車の割合")) + sl("shift", 30, "%", tx("Shift from car to rail and bus", "自動車から鉄道・バスへの転換"), tx("Share of road trips moved to public transport", "公共交通に転換される道路移動の割合"))
    + '<div class="slider-field"><label style="display:flex;gap:10px;align-items:center;cursor:pointer"><input type="checkbox" data-act="lez" ' + (sc.lez ? "checked" : "") + ' style="width:18px;height:18px;accent-color:var(--ai)"/>' + tx("Low emission zone (Umeda–Namba)", "低排出ゾーン（梅田〜難波）") + '</label><div class="sl-hint">' + tx("Restricts older, higher-emitting vehicles in the central area", "都心部で旧式・高排出車両の通行を制限") + "</div></div>"
    + '<div class="ctrl-group">' + icon("ship") + tx("Port, industry and greening", "港湾・産業・緑化") + "</div>" + sl("port", 60, "%", tx("Port and industrial emission controls", "港湾・産業の排出対策"), tx("Cut in emissions from Osaka Bay port and Sakai–Senboku industry", "大阪湾の港湾・堺泉北臨海工業地帯からの排出削減率")) + sl("green", 20, " pt", tx("Additional tree canopy", "樹冠被覆の追加"), tx("Percentage-point increase in urban tree cover", "都市の樹冠被覆率の増加（ポイント）")) + "<div></div>"
    + '<div class="ctrl-group">' + icon("wind") + tx("Conditions (not controllable)", "条件（制御不能）") + '</div><div class="slider-field"><label>' + tx("Weather", "気象") + '</label><div class="seg" style="margin-top:6px">' + [["obs", tx("As observed", "観測どおり")], ["calm", tx("Calm, stagnant", "静穏・滞留")], ["windy", tx("Windy", "強風")]].map((x) => '<button class="' + (sc.wx === x[0] ? "on" : "") + '" data-act="wx" data-v="' + x[0] + '">' + x[1] + "</button>").join("") + "</div></div>"
    + sl("kosa", 100, "%", tx("Asian dust (kōsa, 黄砂) strength", "黄砂の強さ"), tx("Stress test: does the plan still hold on a dust day?", "ストレステスト：黄砂の日にも計画は有効か")) + '<div style="align-self:end;text-align:right"><button class="btn" data-act="reset">' + tx("Reset", "リセット") + "</button></div></div></div>"
    + '<div class="grid g2" style="margin-top:16px"><div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("Results by pollutant", "物質別の結果") + '</h3><div id="scenres">' + scenResHtml() + '</div></div><div class="card pad"><h3 style="font-size:15px;margin-bottom:4px">' + tx("What the scenario shows", "シナリオから見えること") + '</h3><div id="scenread">' + scenReadHtml(st) + "</div></div></div>"
    + how([[tx("Start from the baseline", "ベースラインから出発"), tx("Each point's current value is split into regional, urban and roadside parts (see What Drives It).", "各地点の現在値を広域・都市・沿道に分解します（「汚染の要因」参照）。")],
      [tx("Measures act on the parts they affect", "施策は該当する要素にだけ作用"), tx("Transport measures reduce roadside and the traffic share of urban; port measures reduce the port share. Nothing local changes regional background.", "交通施策は沿道分と都市分の交通割合を、港湾施策は港湾割合を減らします。広域分は変わりません。")]])
    + assumptions([[tx("Traffic share of the urban increment", "都市分に占める交通の割合"), tx("NO₂ 55%, PM2.5 25%, SPM 30%.", "NO₂ 55%・PM2.5 25%・SPM 30%。"), "0.55 / 0.25 / 0.30"],
      [tx("Port and industry share", "港湾・産業の割合"), tx("35% at bay-coast points, 10–12% elsewhere.", "湾岸の地点で35%、その他で10〜12%。"), "0.35 / 0.10–0.12"],
      [tx("Heavy vehicles' share of traffic pollution", "交通由来に占める大型車の割合"), tx("70% of traffic NO₂, 60% of traffic particles.", "交通由来NO₂の70%、粒子の60%。"), "0.70 / 0.60"],
      [tx("Exhaust share of traffic particles", "交通由来粒子のうち排気の割合"), tx("45% of traffic PM2.5 and 30% of SPM; brake, tyre and road dust are not removed by electric vehicles.", "交通由来PM2.5の45%、SPMの30%。ブレーキ・タイヤ・路面粉じんは電動化で減りません。"), "0.45 / 0.30"],
      [tx("Low emission zone effect", "低排出ゾーンの効果"), tx("Traffic NO₂ −30%, PM2.5 −15%, SPM −10% within 1.5 km of the axis; half up to 3 km.", "軸から1.5km以内で交通由来 NO₂ −30%・PM2.5 −15%・SPM −10%、3kmまで半分。"), "1.5 / 3 km"],
      [tx("Shift, greening, weather and dust", "転換・緑化・気象・黄砂"), tx("1% shifted removes 0.9% of traffic pollution; each canopy point −0.1–0.15%; calm ×1.25, windy ×0.8 on local parts; full dust +30 µg/m³ PM2.5, +0.20 mg/m³ SPM.", "転換1%で交通由来0.9%減；樹冠1ptで0.1〜0.15%減；静穏×1.25・強風×0.8；黄砂100%でPM2.5 +30・SPM +0.20。"), "—"],
      [tx("Instant, settled effect", "即時・定常の効果"), tx("End state only; no traffic diversion.", "最終状態のみ。交通の迂回は考慮しません。"), tx("no lag", "時間差なし")], ASM.bg()],
      tx("These response factors are the main assumptions in the twin. Osaka's emissions inventory and traffic census would replace them.", "これらの応答係数が本ツインの主な前提条件です。大阪府の排出インベントリと道路交通センサスで置き換えられます。"))
    + sources(["soramame", "eqs", "gsiTiles", "leaflet"]);
}
function updateScen() { save(); const st = scenStats(state.sc); const i = document.getElementById("impact"); if (i) i.innerHTML = impactHtml(st); const r = document.getElementById("scenres"); if (r) r.innerHTML = scenResHtml(); const d = document.getElementById("scenread"); if (d) d.innerHTML = scenReadHtml(st); redrawMaps((m) => m._scope === "scen" || m._scope === "delta"); }

/* ======================= COMPARE PACKAGES ======================= */
function vCompare() {
  const keys = ["base", "clean", "port", "all"], res = keys.map((k) => { const s = PRESETS[k].s; const out = { k, s }; ["no2", "pm25", "spm"].forEach((p) => { const b = mean(nodesFor(p).map((x) => x.v)), v = mean(nodesFor(p, { sc: s }).map((x) => x.v)); out[p] = { c: b ? ((v - b) / b) * 100 : 0, ab: metricNodes(p, s).filter((x) => inArea(x.st) && x.v > POLS[p].std).length }; }); out.e = exposure(scPol(), s); return out; });
  const row = (label, f, col) => "<tr><td><b>" + label + "</b></td>" + res.map((r) => '<td class="num" style="text-align:center' + (col ? ";color:" + col(r) : "") + '">' + f(r) + "</td>").join("") + "</tr>";
  const cc = (c) => (c < -0.05 ? "var(--green)" : c > 0.05 ? "var(--red)" : "var(--ink-3)");
  return head(tx("Compare the packages side by side", "施策パッケージの比較"), tx("Same baseline and method for every package, so the comparison is like for like.", "すべて同じベースラインと手法で比較します。"))
    + '<div class="card scroll"><table class="tbl"><thead><tr><th></th>' + res.map((r) => '<th style="text-align:center">' + tr(PRESETS[r.k].n) + "</th>").join("") + "</tr></thead><tbody>"
    + ["no2", "pm25", "spm"].map((p) => row(POLS[p].label + " " + tx("change", "変化"), (r) => (r[p].c > 0 ? "+" : "") + r[p].c.toFixed(1) + "%", (r) => cc(r[p].c)) + row(POLS[p].label + " " + tx("points above standard", "基準超過地点"), (r) => r[p].ab)).join("")
    + (res[0].e ? row(tx("People above the ", "基準超過地域の人口（") + POLS[scPol()].label + tx(" standard", "）"), (r) => (r.e ? nf(r.e.exceed) : "–")) : "")
    + "<tr><td></td>" + res.map((r) => '<td style="text-align:center"><button class="btn sm" data-act="preset" data-k="' + r.k + '" data-go="scen">' + tx("Open", "開く") + "</button></td>").join("") + "</tr></tbody></table></div>"
    + '<div class="callout warn" style="margin-top:16px">' + icon("alert") + " " + tx("No costs are shown: there are no reliable public unit costs for these measures in Osaka.", "費用は表示していません。大阪におけるこれらの施策の信頼できる公開単価がないためです。") + "</div>"
    + assumptions([[tx("Same assumptions as Scenario Analysis", "シナリオ分析と同じ前提条件"), tx("All response factors apply to every column.", "応答係数を全列に適用しています。"), "—"], [tx("Packages are illustrative", "パッケージは例示"), tx("Not from any adopted Osaka plan.", "大阪の採択済み計画に基づくものではありません。"), "4"]])
    + sources(["soramame", "wikidata", "eqs"]);
}

/* ======================= ZOOM LEVELS ======================= */
const ZL = [{ n: 1, t: { en: "Prefecture", ja: "府全域" }, b: [[34.26, 135.1], [35.05, 135.75]], q: { en: "Regional episodes, transboundary pollution", ja: "広域的な事象・越境汚染" } },
  { n: 2, t: { en: "Osaka City", ja: "大阪市" }, b: [[34.57, 135.39], [34.77, 135.60]], q: { en: "Ward comparisons, port and traffic measures", ja: "区の比較・港湾と交通施策" } },
  { n: 3, t: { en: "City centre (Umeda–Namba)", ja: "都心（梅田〜難波）" }, b: [[34.655, 135.47], [34.715, 135.53]], q: { en: "Low emission zone design", ja: "低排出ゾーンの設計" } },
  { n: 4, t: { en: "Street / building", ja: "街路・建物" }, b: null, q: { en: "Street canyons, a single junction, a school site", ja: "ストリートキャニオン・交差点・学校敷地" } }];
function vZoom() {
  const lv = ZL.find((z) => z.n === state.zoom) || ZL[0], p = state.pol;
  const inB = (s, b) => s.lat >= b[0][0] && s.lat <= b[1][0] && s.lon >= b[0][1] && s.lon <= b[1][1];
  const stat = (z) => { if (!z.b) return null; const l = D.stations.filter((s) => inB(s, z.b)); const all = nodesFor(p, { all: true }); const errs = l.filter((s) => s[p] != null).map((s) => { const r = idw(all.filter((x) => x.st !== s), s.lat, s.lon); return r.v != null ? Math.abs(r.v - s[p]) : null; }).filter((x) => x != null);
    return { n: l.length, road: l.filter((s) => s.road).length, sp: spacing(l), mae: mean(errs), obs: mean(l.map((s) => s[p])) }; };
  const S = ZL.map(stat);
  MAPREG.zoom = { bounds: lv.b || ZL[2].b, refit: true, showBox: true };
  return head(tx("How much detail can the data support?", "データはどこまで細かく表せるか"), tx("The real test is point spacing — and how well the map predicts a point it cannot see.", "重要なのは地点の間隔と、見えない地点をどれだけ正しく推計できるかです。"))
    + '<div class="lvl" style="margin-bottom:16px">' + ZL.map((z, i) => { const s = S[i];
      return '<div class="lvlcard' + (z.n === lv.n ? " on" : "") + '" data-act="zl" data-n="' + z.n + '"><div class="lh"><span class="lnum">' + z.n + '</span><b style="font-size:13.5px">' + tr(z.t) + '</b></div><div class="lb"><div style="margin-bottom:8px">' + tr(z.q) + "</div>"
        + (s ? '<table class="tbl"><tbody><tr><td>' + tx("Points", "地点") + '</td><td class="num">' + s.n + "</td></tr><tr><td>" + tx("Typical spacing", "典型的な間隔") + '</td><td class="num">' + (s.sp ? s.sp.toFixed(1) + " km" : "–") + "</td></tr><tr><td>" + tx("Error at a hidden point", "隠した地点の誤差") + pv("c") + '</td><td class="num">' + (s.mae != null ? fmt(p, s.mae) + " " + U(p) : "–") + "</td></tr></tbody></table>"
          : '<div class="callout warn" style="font-size:12px">' + tx("Needs street-scale modelling with 3D buildings (MLIT Project PLATEAU) and traffic counts.", "3D建物（国土交通省PLATEAU）と交通量を用いた街区スケールのモデルが必要です。") + "</div>") + "</div></div>"; }).join("") + "</div>"
    + '<div class="card" style="padding:14px">' + mapBar() + mapSlot("zoom", MAPREG.zoom) + mapLegend(p) + "</div>"
    + assumptions([ASM.map(), [tx("Zoom boundaries are rectangles", "範囲は矩形"), tx("Not administrative boundaries.", "行政界ではありません。"), tx("boxes", "矩形")]])
    + sources(["soramame", "gsiTiles", "cad"]);
}

/* ======================= ALERTS ======================= */
function buildAlerts() {
  const out = [], L = areaStations();
  L.filter((s) => s.ox >= 240).forEach((s) => out.push({ sev: "#8E2C8E", k: "smog", t: tx("Ox at warning level — ", "Oxが警報レベル — ") + sName(s), d: fmt("ox", s.ox) + " ppb ≥ 240" }));
  L.filter((s) => s.ox >= 120 && s.ox < 240).forEach((s) => out.push({ sev: "#E0602A", k: "smog", t: tx("Ox at advisory level — ", "Oxが注意報レベル — ") + sName(s), d: fmt("ox", s.ox) + " ppb ≥ 120" }));
  L.forEach((s) => { const dm = dayMean(s, "pm25"); if (dm != null && dm > 35) out.push({ sev: "#E0A21B", k: "pm", t: tx("PM2.5 24-hour mean above standard — ", "PM2.5の24時間平均が基準超過 — ") + sName(s), d: fmt("pm25", dm) + " µg/m³ > 35" }); });
  L.forEach((s) => { const dm = dayMean(s, "no2"); if (dm != null && dm > 60) out.push({ sev: "#E0A21B", k: "road", t: tx("NO₂ 24-hour mean above the standard zone — ", "NO₂の24時間平均が基準超過 — ") + sName(s), d: fmt("no2", dm) + " ppb > 60" }); });
  L.filter((s) => s.spm > 0.2).forEach((s) => { const k = kosaFlag(s); out.push({ sev: "#C77A12", k: "dust", t: tx("SPM above hourly standard — ", "SPMが1時間値基準超過 — ") + sName(s), d: fmt("spm", s.spm) + " mg/m³ > 0.20" + (k && k.flag ? tx(" · possible Asian dust (kōsa)", "・黄砂の可能性") : "") }); });
  if (D.fcIdx.length > 6) { const now = areaAvg("pm25"), s6 = now * fcRatio("pm25", D.fcIdx[5]); if (now && s6 > now * 1.3 && s6 > 25) out.push({ sev: "#6A3FA0", k: "fc", t: tx("PM2.5 forecast to rise sharply", "PM2.5の急上昇が予測されています"), d: "+" + Math.round((s6 / now - 1) * 100) + "% / 6 h" }); }
  const w = D.latest.warnings; if (w && w.headline) out.push({ sev: "#1B365D", k: "jma", t: tx("JMA warnings and advisories", "気象庁の警報・注意報"), d: esc(w.headline) });
  return out;
}
function vAlerts() {
  const a = buildAlerts();
  const PB = [{ k: "smog", ic: "sun", t: { en: "Photochemical smog advisory", ja: "光化学スモッグ注意報" }, o: { en: "Osaka Prefecture", ja: "大阪府" }, s: [{ en: "Announced through prefecture channels", ja: "府の広報等で周知" }, { en: "Schools reduce strenuous outdoor activity", ja: "学校は屋外での激しい運動を控える" }, { en: "Designated factories reduce emissions", ja: "指定工場は排出を削減" }] },
    { k: "pm", ic: "alert", t: { en: "PM2.5 public alert", ja: "PM2.5 注意喚起" }, o: { en: "Osaka Prefecture", ja: "大阪府" }, s: [{ en: "Avoid unnecessary outings and strenuous exercise", ja: "不要不急の外出や激しい運動を控える" }, { en: "Extra care for children, older people, heart or lung conditions", ja: "子ども・高齢者・呼吸器や循環器に疾患のある方は特に注意" }] },
    { k: "dust", ic: "dust", t: { en: "Asian dust (kōsa) episode", ja: "黄砂の飛来" }, o: { en: "JMA (information); public health", ja: "気象庁（情報）・保健部局" }, s: [{ en: "Share the Japan Meteorological Agency's kōsa information", ja: "気象庁の黄砂情報を周知" }, { en: "Hospitals prepared for more respiratory cases", ja: "医療機関は呼吸器症状の増加に備える" }] },
    { k: "road", ic: "car", t: { en: "Roadside NO₂", ja: "沿道のNO₂" }, o: { en: "Road administrators, police, city", ja: "道路管理者・警察・市" }, s: [{ en: "Review signal timing and congestion", ja: "信号制御・渋滞を確認" }, { en: "Route heavy freight away from homes and schools", ja: "大型貨物を住宅・学校から離れた経路へ" }] }];
  const cnt = {}; a.forEach((x) => (cnt[x.k] = (cnt[x.k] || 0) + 1));
  return head(tx("Alerts", "アラート"), tx("Raised automatically against Japan's official standards and alert thresholds — each with the body that would act.", "日本の公式基準・注意報基準と照合して自動表示し、対応機関も示します。"))
    + '<div class="card pad" style="margin-bottom:16px"><h3 style="font-size:16px;margin-bottom:8px">' + tx("Now in ", "現在：") + esc(areaName()) + "</h3>" + (a.length ? a.slice(0, 20).map((x) => '<div class="alertrow"><div class="al-sev" style="background:' + x.sev + '"></div><div><div class="al-t">' + esc(x.t) + '</div><div class="al-d">' + x.d + "</div></div></div>").join("") : '<div class="callout ok">' + icon("check") + " " + tx("No alerts. All points are within the standards.", "アラートはありません。全地点が基準内です。") + "</div>") + "</div>"
    + '<div class="section-head"><h2>' + tx("Who acts, and how", "誰がどう対応するか") + '</h2></div><div class="grid g2">'
    + PB.map((b) => '<div class="card pad" style="border-left:4px solid ' + (cnt[b.k] ? "var(--red)" : "var(--line-2)") + '"><div style="display:flex;align-items:center;gap:9px;margin-bottom:6px"><span style="color:var(--ai)">' + icon(b.ic) + '</span><b style="flex:1">' + tr(b.t) + "</b>" + (cnt[b.k] ? '<span class="pill tag-red">' + cnt[b.k] + "</span>" : '<span class="pill">' + tx("standing by", "待機") + "</span>") + '</div><div class="muted" style="font-size:12px;margin-bottom:6px">' + tx("Who acts: ", "対応：") + "<b>" + tr(b.o) + '</b></div><ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--ink-2);line-height:1.6">' + b.s.map((x) => "<li>" + tr(x) + "</li>").join("") + "</ul></div>").join("") + "</div>"
    + assumptions([[tx("Response steps are summarised", "対応手順は要約"), tx("Confirm Osaka's current procedures before use.", "利用前に大阪府の現行手順を確認してください。"), "—"], [tx("Forecast alert trigger", "予測アラート条件"), "+30% / 6 h, > 25 µg/m³", "—"]])
    + sources(["soramame", "alerts", "eqs", "jmaWarn", "cams"]);
}

/* ======================= MEASURING SUCCESS ======================= */
function vKpi() {
  const rows = ["pm25", "no2", "ox", "so2", "co", "spm"].map((p) => { const ms = areaStations().map((s) => ({ s, v: stdMetric(s, p) })).filter((x) => x.v != null), P = POLS[p]; return { p, n: ms.length, ok: ms.filter((x) => x.v <= P.std).length, whoOk: P.who ? ms.filter((x) => x.v <= P.who).length : null, avg: mean(ms.map((x) => x.v)) }; });
  const vf = ["pm25", "no2", "ox"].map((p) => [p, verify(p)]), loo = ["pm25", "no2", "ox"].map((p) => [p, looError(p)]);
  return head(tx("How you would know this is working", "成果をどう測るか"), tx("Three questions — the first two answered here with real numbers.", "3つの問い。最初の2つはここで実数値で答えられます。"))
    + '<div class="grid g3" style="margin-bottom:18px"><div class="kbox"><div class="kh"><div class="kq">1. ' + tx("Is it accurate?", "正確か？") + '</div></div><div class="kb">'
    + loo.map(([p, r]) => '<div class="kitem"><div class="kn"><span>' + tx("Map between points, ", "地点間の地図・") + POLS[p].label + "</span><b>" + (r ? "±" + fmt(p, r.mae) + " " + U(p) : "–") + '</b></div><div class="kd">' + tx("Each point hidden and predicted from the others", "各地点を隠して他から推計した誤差") + "</div></div>").join("")
    + vf.map(([p, r]) => '<div class="kitem"><div class="kn"><span>' + tx("Forecast, ", "予測・") + POLS[p].label + "</span><b>" + (r ? "±" + fmt(p, r.mae) + " " + U(p) : "–") + '</b></div><div class="kd">' + (r ? r.n + tx(" hours checked against official data", "時間を公的データで検証") : tx("needs official station data", "公的測定局データが必要")) + "</div></div>").join("") + "</div></div>"
    + '<div class="kbox"><div class="kh"><div class="kq">2. ' + tx("Is the air meeting the standards?", "基準を満たしているか？") + '</div></div><div class="kb">'
    + rows.map((r) => '<div class="kitem"><div class="kn"><span>' + POLS[r.p].label + '</span><b style="color:' + (r.ok === r.n ? "var(--green)" : "var(--red)") + '">' + r.ok + " / " + r.n + '</b></div><div class="kd">' + tr(POLS[r.p].note) + (r.whoOk != null ? " · WHO: " + r.whoOk + " / " + r.n : "") + "</div></div>").join("") + "</div></div>"
    + '<div class="kbox"><div class="kh"><div class="kq">3. ' + tx("Is anyone using it?", "使われているか？") + '</div></div><div class="kb">'
    + [[tx("Decisions tested before adoption", "採択前に検証された施策数")], [tx("Warning time before episodes", "事象前の警告時間")], [tx("Time to answer a question", "問いへの回答時間")], [tx("Schools and hospitals notified", "通知した学校・病院数")]].map((x) => '<div class="kitem"><div class="kn"><span>' + x[0] + "</span></div></div>").join("") + "</div></div></div>"
    + '<div class="section-head"><h2>' + tx("How you would get there", "導入の進め方") + '</h2></div><div class="card pad">'
    + [[tx("Step 1 · 4–6 weeks", "ステップ1・4〜6週"), tx("Confirm users and questions", "利用者と問いの確認")], [tx("Step 2 · 2–3 months", "ステップ2・2〜3か月"), tx("Direct feed from Osaka Prefecture's monitoring system", "大阪府の常時監視システムから直接取得")], [tx("Step 3 · 3–6 months", "ステップ3・3〜6か月"), tx("Replace scenario assumptions with the emissions inventory and traffic census", "排出インベントリ・道路交通センサスで前提条件を置換")], [tx("Step 4 · 6+ months", "ステップ4・6か月〜"), tx("Chemistry model for ozone; PLATEAU street modelling", "オゾン用化学モデル・PLATEAU街区モデル")]]
      .map((x, i, a) => '<div style="display:flex;gap:14px;padding:11px 0' + (i < a.length - 1 ? ";border-bottom:1px solid var(--line)" : "") + '"><div style="flex:0 0 150px;font-size:11.5px;font-weight:800;color:var(--beni)">' + x[0] + '</div><div style="font-weight:600">' + x[1] + "</div></div>").join("") + "</div>"
    + assumptions([[tx("WHO comparison for Ox uses the ozone guideline", "OxのWHO比較はオゾンの指針値"), tx("Indicative only.", "目安です。"), "51 ppb"]])
    + sources(["soramame", "eqs", "who", "cams"]);
}

/* ======================= EXECUTIVE BRIEF ======================= */
function vBrief() {
  const p = state.pol, P = POLS[p], ns = nodesFor(p).sort((a, b) => b.v - a.v), avg = mean(ns.map((x) => x.v)), b = bandOf(p, avg), dt = decompTotals(p === "ox" ? "no2" : p, null), e = exposure(p), st = hasLevers() ? scenStats(state.sc) : null;
  const ser = areaAxisSeries(p), fut = ser.slice(D.times.length), pk = fut.reduce((m, v, i) => (v != null && (!m || v > m.v) ? { v, i: D.times.length + i } : m), null), al = buildAlerts();
  const li = (x) => '<li style="font-size:13px;color:var(--ink-2);line-height:1.65;margin-bottom:6px">' + x + "</li>";
  const dataName = tr(VIEWS.find((v) => v.k === (modeKind() === "om" ? "om" : modeKind() === "sample" ? "sample" : modeKind() === "blend" ? "blend" : "live")).n);
  return '<div class="btnrow no-print" style="justify-content:flex-end;margin-bottom:14px"><button class="btn" data-act="print">' + icon("file") + tx("Print or save as PDF", "印刷・PDF保存") + "</button></div>"
    + '<div class="card pad" style="padding:30px 34px"><div style="display:flex;justify-content:space-between;gap:20px;padding-bottom:14px;border-bottom:2px solid var(--ai);margin-bottom:18px"><div><div class="eyebrow">' + tx("Air quality executive brief · Art of the Possible", "大気環境エグゼクティブ・ブリーフ · Art of the Possible") + '</div><h1 style="font-size:28px;margin:5px 0 4px">' + esc(areaName()) + '</h1><div class="muted" style="font-size:12px">' + fmtT(D.latest.observedAt) + " · " + P.label + " · " + dataName + "</div></div><div>" + LOGO + "</div></div>"
    + '<div class="kpis" style="margin-bottom:18px">' + kpi(tx("Air quality now", "現在の大気質"), fmt(p, avg) + " <small>" + U(p) + "</small>", b.name, b.hex) + kpi(tx("Local share", "地域由来"), dt ? pct(dt.urb + dt.road, dt.total) + "%" : "–", tx("urban + roadside", "都市＋沿道")) + kpi(tx("People above standard", "基準超過地域の人口"), e ? nf(e.exceed) : "–", e ? e.pct.toFixed(1) + "%" : "") + kpi(tx("3-day peak", "3日間の最高"), pk ? fmt(p, pk.v) : "–", pk ? fmtDH(D.axis[pk.i].t) : "", pk && bandOf(p, pk.v).hex) + "</div>"
    + "<h3 style='font-size:16px;margin-bottom:6px'>" + tx("The situation", "現状") + "</h3><ul style='padding-left:18px;margin:0 0 16px'>"
    + li(tx("Average ", "平均 ") + P.label + tx(" across ", "（") + ns.length + " " + PTS() + tx(" is ", "）は ") + "<b>" + fmt(p, avg) + " " + U(p) + "</b> — " + b.name.toLowerCase() + ".")
    + (dt ? li(tx("About ", "約") + "<b>" + pct(dt.bg, dt.total) + "%</b>" + tx(" is regional background; ", "は広域分、") + "<b>" + pct(dt.urb + dt.road, dt.total) + "%</b>" + tx(" is local and can be influenced by local policy.", "は地域由来で、地域の施策で変えられます。")) : "")
    + (ns[0] ? li(tx("Highest now: ", "現在最も高い地点：") + ns.slice(0, 3).map((x) => "<b>" + esc(sName(x.st)) + "</b> (" + fmt(p, x.v) + ")").join(", ") + ".") : "")
    + (al.length ? li("<b>" + al.length + "</b>" + tx(" active alerts.", " 件のアラート。")) : li(tx("No active alerts.", "アラートはありません。"))) + "</ul>"
    + "<h3 style='font-size:16px;margin-bottom:6px'>" + tx("Scenario tested", "検証したシナリオ") + "</h3>" + (st ? "<ul style='padding-left:18px;margin:0 0 16px'>" + li(tx("Estimated change in ", "推定変化 ") + POLS[st.p].label + ": <b>" + (st.pct > 0 ? "+" : "") + st.pct.toFixed(1) + "%</b>; " + tx("points above standard ", "基準超過地点 ") + st.bAbove + " → " + st.sAbove + ".") + li(tx("Directional, based on stated assumptions.", "明示した前提条件に基づく方向性の評価です。")) + "</ul>" : '<p class="muted" style="font-size:13px">' + tx("No scenario set. Use Scenario Analysis; this brief updates automatically.", "シナリオ未設定。シナリオ分析で設定すると自動反映されます。") + "</p>")
    + "<h3 style='font-size:16px;margin-bottom:6px'>" + tx("Suggested next steps", "次のステップ（案）") + "</h3><ul style='padding-left:18px;margin:0 0 12px'>" + li(tx("Confirm priority hotspots with prefecture and city monitoring teams.", "府・市の監視担当と優先ホットスポットを確認する。")) + li(tx("Replace scenario assumptions with Osaka's emissions inventory and traffic census.", "シナリオの前提条件を排出インベントリ・交通センサスで置き換える。")) + li(tx("Set ambition against WHO 2021 guidelines as well as national standards.", "国の基準に加えWHO 2021に対する目標を設定する。")) + "</ul>"
    + '<div style="border-top:2px solid var(--ai);padding-top:10px;font-size:10.5px;color:var(--ink-3);line-height:1.6"><b>' + tx("Art of the Possible — sample demonstration, not for official use.", "Art of the Possible — サンプルデモ。公式用途不可。") + "</b> " + tx("Data: ", "データ：") + dataName + (D.modelOnly || D.blend ? tx(" · Open-Meteo values are a European (Copernicus) model, not Japanese measurements.", " · Open-Meteoの値は欧州（コペルニクス）モデルであり日本の実測ではありません。") : "") + "</div></div>"
    + sources(["soramame", "amedas", "cams", "wikidata", "osm", "eqs", "who"]);
}

/* ======================= DATA & METHOD ======================= */
function ALL_ASM() { return [
  [tx("Open-Meteo data", "Open-Meteoデータ"), ASM.om()],
  [tx("Measurement and mapping", "測定と地図"), [ASM.prelim(), ASM.map(), ASM.levels(), ASM.units()]],
  [tx("Splitting readings into parts", "測定値の分解"), [ASM.bg(), ASM.road()]],
  [tx("People and places", "人口と施設"), [ASM.pop(), [tx("Municipal centre represents the municipality", "代表点で市区町村を代表"), tx("One value per municipality.", "市区町村ごとに1つの値。"), "centroid"]]],
  [tx("Forecasting", "予測"), [[tx("Past error represents future error", "過去の誤差が将来も同程度"), tx("Measured error, or ±25% without official data.", "実測誤差（公式データが無い場合は±25%）。"), "RMSE"], [tx("One area ratio", "エリア共通の比率"), tx("All points follow the average model change.", "全地点がモデルの平均変化に連動。"), "—"]]],
  [tx("Scenario Analysis", "シナリオ分析"), [[tx("Traffic share of urban increment", "都市分の交通割合"), "NO₂ 55% · PM2.5 25% · SPM 30%", "—"], [tx("Port and industry share", "港湾・産業の割合"), "35% / 10–12%", "—"], [tx("Heavy vehicle share", "大型車の割合"), "70% / 60%", "—"], [tx("Exhaust share", "排気の割合"), "45% / 30%", "—"], [tx("Low emission zone effect", "低排出ゾーンの効果"), "−30% / −15% / −10%", "—"], [tx("Shift, greening, weather, dust", "転換・緑化・気象・黄砂"), "0.9 · 0.15% · ×1.25/×0.8 · +30", "—"], [tx("Instant settled effect", "即時定常"), "—", "—"]]],
  [tx("Episodes and alerts", "事象とアラート"), [[tx("Coarse-dust signature", "黄砂の兆候"), "SPM ≥ 0.05 · PM2.5/SPM < 35%", "—"], [tx("Response owners summarised", "対応機関は要約"), "—", "—"], [tx("Forecast alert trigger", "予測アラート条件"), "+30% / 6 h", "—"]]]]; }
function ALL_ASM_COUNT() { return ALL_ASM().reduce((a, g) => a + g[1].length, 0); }
function vMethod() {
  const st = (state.liveFile && state.liveFile.status) || {};
  const chip = (k) => { const s = st[k]; if (!s) return '<span class="pill">' + tx("not run", "未実行") + "</span>"; return s.ok ? '<span class="pill tag-live">' + tx("working", "取得成功") + "</span>" : '<span class="pill tag-red" title="' + esc(s.msg || "") + '">' + tx("failed", "失敗") + "</span>"; };
  const feeds = [["soramame", tx("Official stations", "公的測定局")], ["history", tx("Station history (7 days)", "測定局の履歴")], ["amedas", "AMeDAS"], ["jmaForecast", tx("JMA forecast", "気象庁予報")], ["cams", tx("CAMS model", "CAMSモデル")], ["population", tx("Population", "人口")], ["facilities", tx("Hospitals & schools", "病院・学校")]];
  return head(tx("Data and method", "データと手法"), tx("Where every number comes from, the four data options, and every assumption.", "各数値の出典、4つのデータ選択肢、すべての前提条件。"))
    + '<div class="section-head" style="margin-top:0"><h2>' + tx("The four data options", "4つのデータ選択肢") + '</h2></div><div class="card scroll"><table class="tbl"><thead><tr><th></th>' + VIEWS.map((v) => "<th>" + tr(v.n) + "</th>").join("") + "</tr></thead><tbody>"
    + [[tx("Source of current values", "現在値の出典"), [tx("Japanese official stations", "日本の公的測定局"), tx("Official stations + EU model in gaps", "公的測定局＋空白域はEUモデル"), tx("EU Copernicus model", "EUコペルニクスモデル"), tx("Invented", "作成値")]],
      [tx("Works from a desktop file", "デスクトップで動作"), ["—", tx("Yes (model part only)", "可（モデル部分のみ）"), "✓", "✓"]], [tx("Needs internet", "インターネット"), ["✓", "✓", "✓", "—"]], [tx("Needs GitHub deployment", "GitHubデプロイ"), ["✓", tx("for official part", "公式部分に必要"), "—", "—"]], [tx("Roadside detail", "沿道の詳細"), ["✓", "✓", "—", tx("illustrative", "例示")]], [tx("Forecast verified", "予測の検証"), ["✓", "✓", "—", tx("illustrative", "例示")]]]
      .map((r) => "<tr><td><b>" + r[0] + "</b></td>" + r[1].map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>"
    + '<div class="section-head"><h2>' + tx("Pollutants in this twin", "本ツインの対象物質") + '</h2></div><div class="card scroll"><table class="tbl"><thead><tr><th>' + tx("Short name", "略称") + "</th><th>" + tx("Full name", "名称") + "</th><th>" + tx("Unit", "単位") + "</th><th>" + tx("Japan standard", "環境基準") + "</th></tr></thead><tbody>" + Object.keys(POLS).map((k) => "<tr><td><b>" + POLS[k].label + "</b></td><td>" + tr(POLS[k].full) + '</td><td class="muted">' + U(k) + '</td><td class="muted" style="font-size:12px">' + tr(POLS[k].note) + "</td></tr>").join("") + "</tbody></table></div>"
    + '<div class="callout" style="margin-top:12px">' + icon("dust") + " <b>" + tx("Asian dust (kōsa, 黄砂)", "黄砂（こうさ）") + "</b> — " + tx("fine sand and soil blown from the deserts of China and Mongolia across Korea and Japan, mostly February to May. It raises coarse particles (SPM) more than fine particles (PM2.5). Forecasts and observations are issued by the Japan Meteorological Agency.", "中国・モンゴルの砂漠から舞い上がった砂や土が、偏西風で朝鮮半島や日本へ運ばれる現象。主に2〜5月。PM2.5より粗大粒子（SPM）を大きく押し上げます。予報・観測は気象庁が発表します。") + "</div>"
    + '<div class="section-head"><h2>' + icon("refresh") + " " + tx("Test the feeds now", "データ接続を今すぐ確認") + '</h2><div class="d">' + tx("Checks each source from this browser, right now.", "このブラウザから各データソースへの接続を今すぐ確認します。") + '</div></div><div class="card pad"><button class="btn primary" data-act="feedtest">' + icon("refresh") + tx("Run feed test", "接続テストを実行") + '</button><div id="feedres" style="margin-top:12px"></div></div>'
    + '<div class="section-head"><h2>' + tx("Collection status (official feed)", "収集状況（公式データ）") + '</h2><div class="d">' + (state.liveFile ? tx("Last collection: ", "前回収集：") + fmtT(state.liveFile.generatedAt) : IS_FILE ? tx("Opened from a desktop file — the collected files cannot be read here.", "デスクトップ上のファイルとして開かれているため、収集済みファイルを読み込めません。") : tx("No collection run yet.", "収集はまだ実行されていません。")) + '</div></div><div class="card scroll"><table class="tbl"><tbody>' + feeds.map((f) => "<tr><td><b>" + f[1] + "</b></td><td>" + chip(f[0]) + '</td><td class="muted" style="font-size:11.5px">' + esc((st[f[0]] && st[f[0]].msg) || "") + "</td></tr>").join("") + "</tbody></table></div>"
    + '<div class="section-head"><h2>' + tx("The calculations", "計算方法") + '</h2></div><div class="mcalc">'
    + [[tx("Map between points", "地点間の地図"), '<span class="mformula">v = Σ(vᵢ / dᵢ²) ÷ Σ(1 / dᵢ²)</span> · ≤ 10 km'], [tx("Regional / urban / roadside", "広域・都市・沿道"), '<span class="mformula">bg = P10(general) · urban = general − bg · road = roadside − mean(2 nearest general ≤ 6 km)</span>'], [tx("Forecast correction", "予測の補正"), '<span class="mformula">forecast = model − mean(model − measured, 7 days)</span>'], [tx("Open-Meteo to Japanese indicators", "Open-Meteoから日本の指標へ"), '<span class="mformula">Ox ≈ O₃/1.96 + NO₂/1.88 (ppb) · SPM ≈ PM10</span>']]
      .map((c) => '<div class="mline"><div class="mlb">' + c[0] + '</div><div class="mlc">' + c[1] + "</div></div>").join("") + "</div>"
    + '<div class="section-head"><h2>' + icon("database") + " " + tx("Every data source", "すべてのデータソース") + '</h2></div><details class="dsrc" open style="margin-top:0"><summary>' + tx("Sources", "出典") + '</summary><div class="scroll"><table><thead><tr><th>' + tx("Source", "出典") + "</th><th>" + tx("What it provides", "提供内容") + "</th><th>" + tx("Dataset underneath", "元データ") + "</th><th>" + tx("Publisher & terms", "提供者・利用条件") + "</th></tr></thead><tbody>" + ["soramame", "om", "omwx", "osakaPref", "amedas", "jmaFc", "jmaWarn", "cams", "wikidata", "osm", "builtin", "eqs", "alerts", "who", "gsiGeo", "gsiTiles", "leaflet", "sample", "cad"].map(srcRow).join("") + "</tbody></table></div></details>"
    + '<div class="section-head"><h2>' + icon("alert") + " " + tx("Every assumption — ", "すべての前提条件 — ") + ALL_ASM_COUNT() + "</h2></div>"
    + ALL_ASM().map((g) => '<details class="asmp" open><summary>' + icon("alert") + g[0] + " — " + g[1].length + '</summary><div class="abody">' + g[1].map((a) => '<div class="arow"><span class="atag">' + tx("Assumption", "前提条件") + '</span><div><div class="at">' + a[0] + '</div><div class="ad">' + a[1] + (a[2] && a[2] !== "—" ? ' <span class="av">' + a[2] + "</span>" : "") + "</div></div></div>").join("") + "</div></details>").join("");
}

/* ======================= PAGE EVENTS ======================= */
async function feedTest() {
  const el = document.getElementById("feedres"); if (!el) return;
  const rows = [], put = () => (el.innerHTML = '<table class="tbl"><thead><tr><th>' + tx("Source", "出典") + "</th><th>" + tx("Result", "結果") + "</th><th>" + tx("Detail", "詳細") + "</th></tr></thead><tbody>" + rows.map((r) => "<tr><td><b>" + r[0] + "</b></td><td>" + (r[1] === null ? '<span class="pill">' + tx("testing…", "確認中…") + "</span>" : r[1] ? '<span class="pill tag-live">' + tx("working", "接続成功") + "</span>" : '<span class="pill tag-red">' + tx("failed", "失敗") + "</span>") + '</td><td class="muted" style="font-size:12px">' + esc(r[2] || "") + "</td></tr>").join("") + "</tbody></table>");
  const run = async (name, fn) => { const r = [name, null, ""]; rows.push(r); put(); try { r[2] = await fn(); r[1] = true; } catch (e) { r[1] = false; r[2] = String(e.message || e); } put(); };
  const tm = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
  const img = (u) => Promise.race([new Promise((res, rej) => { const i = new Image(); i.onload = () => res(tx("tile loaded", "タイル読込成功")); i.onerror = () => rej(new Error(tx("blocked or unreachable", "ブロックまたは接続不可"))); i.src = u + "?ts=" + Date.now(); }), tm(12000)]);
  await Promise.all([
    run("Open-Meteo air quality (EU CAMS)", async () => { const r = await Promise.race([fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=34.69&longitude=135.5&current=pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide&timezone=Asia%2FTokyo"), tm(12000)]); if (!r.ok) throw new Error("HTTP " + r.status); const c = (await r.json()).current || {}; return "PM2.5 " + c.pm2_5 + " · NO₂ " + c.nitrogen_dioxide + " · O₃ " + c.ozone + " · SO₂ " + c.sulphur_dioxide + " · CO " + c.carbon_monoxide + " µg/m³ · " + (c.time || ""); }),
    run("Open-Meteo weather", async () => { const r = await Promise.race([fetch("https://api.open-meteo.com/v1/forecast?latitude=34.69&longitude=135.5&current=temperature_2m,wind_speed_10m&wind_speed_unit=ms"), tm(12000)]); if (!r.ok) throw new Error("HTTP " + r.status); const c = (await r.json()).current || {}; return c.temperature_2m + " °C · wind " + c.wind_speed_10m + " m/s"; }),
    run("Esri basemap tiles", () => img("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/403/898")),
    run("GSI basemap tiles", () => img("https://cyberjapandata.gsi.go.jp/xyz/pale/10/898/403.png")),
    run(tx("Official stations (collected file on this site)", "公的測定局（本サイトの収集ファイル）"), async () => { let l = null; if (!IS_FILE) { try { const r = await fetch("data/latest.json?ts=" + Date.now(), { cache: "no-store" }); if (r.ok) l = await r.json(); } catch (e) {} } if (!l) { const b = await viaScript("data/live.js", "__OSAKA_LIVE", true); l = b && b.latest; }
      if (!l) throw new Error(IS_FILE ? tx("not readable from a desktop file", "デスクトップのファイルからは読み込めません") : tx("data file not found", "データファイルがありません"));
      const n = (l.stations || []).filter((s) => s.lat != null).length, age = l.observedAt ? (Date.now() - Date.parse(l.observedAt)) / 3600e3 : null, st = l.status && l.status.soramame;
      if (l.mode === "sample" || n < 5) throw new Error(tx("no official data yet — collector message: ", "公式データ未取得 — 収集処理のメッセージ：") + ((st && st.msg) || (l.status && l.status.note) || "–"));
      if (age > 6) throw new Error(n + tx(" stations, but last reading is ", " 局、ただし最新値は ") + age.toFixed(1) + tx(" h old", " 時間前"));
      return n + tx(" stations · observed ", " 局 · 観測 ") + fmtT(l.observedAt) + " (" + age.toFixed(1) + " h)"; })]);
}
function onPageClick(a, t) {
  if (a === "feedtest") { feedTest(); return; }
  if (a === "preset") { state.sc = Object.assign({}, PRESETS[t.dataset.k].s); state.preset = t.dataset.k; save(); if (t.dataset.go) { state.screen = t.dataset.go; window.scrollTo(0, 0); } render(); toast(tr(PRESETS[t.dataset.k].n)); }
  else if (a === "lib") { const l = LIBRARY.find((x) => x.id === t.dataset.k); state.sc = Object.assign({}, SC0, l.s); state.preset = l.id; save(); render(); toast(tr(l.n)); }
  else if (a === "reset") { state.sc = Object.assign({}, SC0); state.preset = null; save(); render(); }
  else if (a === "wx") { state.sc.wx = t.dataset.v; state.preset = null; t.parentNode.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === t)); updateScen(); }
  else if (a === "lez") { state.sc.lez = t.checked; state.preset = null; updateScen(); redrawMaps(); }
  else if (a === "sview") { state.scenView = t.dataset.v; save(); render(); }
  else if (a === "zl") { state.zoom = +t.dataset.n; delete state.mapViews.zoom; render(); }
  else if (a === "tnow") { state.tIdx = D.nowAx; stopPlay(); render(); }
  else if (a === "play") { if (state.tPlaying) { stopPlay(); render(); return; } state.tPlaying = true; render();
    _play = setInterval(() => { state.tIdx = (state.tIdx + 1) % D.axis.length; updateTime(); }, 650); }
}
function updateTime() { if (state.screen !== "time") return; const t = timeParts(); ["clock", "kpis", "chart", "list"].forEach((k) => { const el = document.getElementById("t-" + k); if (el) el.innerHTML = t[k]; }); const r = document.querySelector('[data-act="scrub"]'); if (r) r.value = state.tIdx; MAPS.forEach((m) => { if (m._scope === "time") { m._cfg.ax = state.tIdx; drawLayers(m); m._surf.draw(); } }); }
function onPageInput(a, t) {
  if (a === "sc") { state.sc[t.dataset.k] = +t.value; state.preset = null; const l = document.getElementById("sv-" + t.dataset.k); if (l) l.textContent = t.value + t.dataset.u; clearTimeout(_deb); _deb = setTimeout(updateScen, 120); }
  else if (a === "scrub") { state.tIdx = +t.value; clearTimeout(_deb); _deb = setTimeout(updateTime, 60); }
}
