"use strict";
/* Osaka Air Quality Digital Twin — v12 add-on: "Three layers" diagram on the What Drives It page.
   Shows, with live values, what you breathe in a quiet park, a residential street and next to a busy road,
   split into regional / urban / roadside layers.
   Load after app-pages.js (and before app-explain.js if present):  <script src="app-layers.js"></script>  */

(function () { const st = document.createElement("style"); st.textContent = `
.layers{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:22px;align-items:center}
@media(max-width:1000px){.layers{grid-template-columns:1fr}}
.layers svg text{font-family:var(--font)}
.lyrnote{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}.lyrnote:last-child{border-bottom:none}
.lyrnote .sw{flex:0 0 16px;height:16px;border-radius:4px;margin-top:2px}
.lyrnote b{display:block;font-size:13.5px;color:var(--ink)}.lyrnote span{font-size:12.5px;color:var(--ink-2);line-height:1.55}
.lyrnote .tag{display:inline-block;margin-top:4px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;border-radius:100px;padding:2px 8px}
.lyrnote .tag.no{background:#EEF1F5;color:#3C4250}.lyrnote .tag.yes{background:#E7F6EF;color:#0b7a53}
`; document.head.appendChild(st); })();

function layersDiagram() {
  const p = state.pol === "ox" ? "no2" : state.pol, P = POLS[p];
  const list = areaStations();
  const gen = decompTotals(p, null, list.filter((s) => !s.road)), road = decompTotals(p, null, list.filter((s) => s.road));
  if (!gen) return "";
  const cols = [
    { k: "park", t: tx("Quiet park", "郊外の公園"), s: tx("edge of the prefecture", "府の外縁部"), bg: gen.bg, urb: 0, rd: 0, ok: true },
    { k: "home", t: tx("Residential street", "住宅街"), s: tx("inside the city", "市街地"), bg: gen.bg, urb: gen.urb, rd: 0, ok: true },
    { k: "road", t: tx("Next to a busy road", "幹線道路沿い"), s: tx("main road or junction", "幹線道路・交差点"), bg: road ? road.bg : 0, urb: road ? road.urb : 0, rd: road ? road.road : 0, ok: !!road }];
  const mx = Math.max(...cols.map((c) => c.bg + c.urb + c.rd)) * 1.12 || 1;
  const W = 600, H = 330, base = 262, top = 46, colW = 120, gap = (W - 3 * colW) / 4, sc = (v) => (v / mx) * (base - top);
  const ICON = {
    park: '<g fill="#2E8B57"><circle cx="0" cy="-14" r="11"/><circle cx="-9" cy="-6" r="8"/><circle cx="9" cy="-6" r="8"/></g><rect x="-2" y="-2" width="4" height="12" fill="#7A5A3A"/>',
    home: '<g fill="#6B7282"><rect x="-17" y="-6" width="14" height="16" rx="1"/><polygon points="-19,-6 -10,-15 -1,-6"/><rect x="3" y="-12" width="15" height="22" rx="1"/><rect x="6" y="-8" width="3" height="3" fill="#fff"/><rect x="12" y="-8" width="3" height="3" fill="#fff"/><rect x="6" y="-2" width="3" height="3" fill="#fff"/><rect x="12" y="-2" width="3" height="3" fill="#fff"/></g>',
    road: '<g><rect x="-22" y="2" width="44" height="8" rx="1" fill="#4A5160"/><rect x="-18" y="5" width="7" height="2" fill="#fff"/><rect x="-3" y="5" width="7" height="2" fill="#fff"/><rect x="12" y="5" width="7" height="2" fill="#fff"/><rect x="-13" y="-9" width="22" height="9" rx="3" fill="#BC002D"/><rect x="-9" y="-13" width="12" height="5" rx="2" fill="#BC002D"/><circle cx="-8" cy="1" r="2.6" fill="#161A22"/><circle cx="4" cy="1" r="2.6" fill="#161A22"/></g>' };
  let s = '<line x1="10" x2="' + (W - 10) + '" y1="' + base + '" y2="' + base + '" stroke="#D6DBE4"/>';
  cols.forEach((c, i) => {
    const x = gap + i * (colW + gap), cx = x + colW / 2, tot = c.bg + c.urb + c.rd;
    let y = base;
    const seg = (v, col, lab) => { if (v <= 0) return; const h = sc(v); y -= h; s += '<rect x="' + x + '" y="' + y + '" width="' + colW + '" height="' + h + '" fill="' + col + '" rx="3"/>';
      if (h >= 17) s += '<text x="' + cx + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">' + lab + " " + fmt(p, v) + "</text>"; };
    if (c.ok) {
      seg(c.bg, PARTC.bg, tx("Regional", "広域")); seg(c.urb, PARTC.urb, tx("Urban", "都市")); seg(c.rd, PARTC.road, tx("Road", "沿道"));
      s += '<text x="' + cx + '" y="' + (y - 8) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#161A22">' + fmt(p, tot) + ' <tspan font-size="10.5" font-weight="600" fill="#6B7282">' + U(p) + "</tspan></text>";
    } else {
      s += '<rect x="' + x + '" y="' + (base - 70) + '" width="' + colW + '" height="70" rx="3" fill="#F3F5F9" stroke="#D6DBE4" stroke-dasharray="5 4"/><text x="' + cx + '" y="' + (base - 38) + '" text-anchor="middle" font-size="10.5" fill="#6B7282">' + tx("No roadside stations", "自排局なし") + '</text><text x="' + cx + '" y="' + (base - 24) + '" text-anchor="middle" font-size="10.5" fill="#6B7282">' + tx("in this data", "（このデータ）") + "</text>";
    }
    s += '<g transform="translate(' + cx + "," + (base + 22) + ')">' + ICON[c.k] + "</g>";
    s += '<text x="' + cx + '" y="' + (base + 48) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#161A22">' + c.t + '</text><text x="' + cx + '" y="' + (base + 62) + '" text-anchor="middle" font-size="10.5" fill="#6B7282">' + c.s + "</text>";
  });
  s += '<text x="10" y="18" font-size="11" font-weight="800" letter-spacing="1" fill="#BC002D">' + tx("WHAT YOU BREATHE", "呼吸している空気") + " · " + P.label + " · " + esc(areaName()) + "</text>";
  const bgPct = cols[2].ok ? Math.round((cols[2].bg / (cols[2].bg + cols[2].urb + cols[2].rd)) * 100) : Math.round((cols[1].bg / (cols[1].bg + cols[1].urb || 1)) * 100);
  const note = (col, t, d, yes) => '<div class="lyrnote"><span class="sw" style="background:' + col + '"></span><div><b>' + t + "</b><span>" + d + '</span><br><span class="tag ' + (yes ? "yes" : "no") + '">' + (yes ? tx("Local policy can reduce this", "地域の施策で削減可能") : tx("Local policy cannot reduce this", "地域の施策では削減不可")) + "</span></div></div>";
  return '<div class="card pad" style="margin-bottom:16px"><h3 style="font-size:16px;margin-bottom:4px">' + tx("Three layers of pollution", "汚染の3つの層") + '</h3><div class="muted" style="font-size:12.5px;margin-bottom:12px">'
    + tx("The same air seen in three places. Each step closer to traffic adds a layer on top of the one before.", "同じ空気を3つの場所で見たもの。交通に近づくほど、前の層の上に新たな層が重なります。") + (state.pol === "ox" ? " " + tx("Shown for NO₂, because photochemical oxidants form in the air and cannot be split this way.", "光化学オキシダントは大気中で生成されるため、NO₂で表示しています。") : "") + "</div>"
    + '<div class="layers"><svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + esc(tx("Three layers of pollution", "汚染の3つの層")) + '">' + s + "</svg><div>"
    + note(PARTC.bg, tx("Regional — already in the air", "広域 — すでに大気中にある分"), tx("Drifts in from elsewhere: other Kansai cities, shipping, Asian dust (kōsa). Everyone in the prefecture breathes it.", "他の関西都市・船舶・黄砂など域外から流入。府内の誰もが吸っている分。"), false)
    + note(PARTC.urb, tx("Urban — what the city adds", "都市 — 都市が加える分"), tx("Cars across the city, factories, the port and buildings.", "市内全体の自動車・工場・港湾・建物。"), true)
    + note(PARTC.road, tx("Roadside — what a busy road adds", "沿道 — 幹線道路が加える分"), tx("Exhaust, brakes and tyres from the traffic right next to you. Mainly reduced by transport measures.", "すぐそばの交通の排気・ブレーキ・タイヤ。主に交通施策で削減。"), true)
    + '<div class="callout" style="margin-top:10px;font-size:12.5px">' + icon("info") + " " + (cols[2].ok ? tx("Next to a busy road here, about ", "ここでは幹線道路沿いでも約") : tx("On a residential street here, about ", "ここでは住宅街で約")) + "<b>" + bgPct + "%</b>" + tx(" of the air is the regional layer. That sets the ceiling on what any local policy package can achieve.", "が広域の層です。これが地域の施策パッケージで達成できる効果の上限を決めます。") + "</div>"
    + "</div></div></div>";
}

const _lyBody = body;
body = function () {
  const h = _lyBody();
  if (state.screen !== "attrib" || !state.loaded || !D.stations.length) return h;
  const i = h.indexOf('<div class="kpis"'); if (i < 0) return h;
  let d = ""; try { d = layersDiagram(); } catch (e) { console.warn("layers diagram", e); }
  return h.slice(0, i) + d + h.slice(i);
};
