"use strict";
/* Osaka Air Quality Digital Twin — v8 add-on
   Public Advisory page (bilingual drafts, Copy / Print / Edit / Share), auto-share mode with a simulated
   social feed, alert ticker in the header, and a data-freshness panel in the sidebar.
   Load after app-pages.js:  <script src="app-advisory.js"></script>  */

/* ---------- icons, screen, styles ---------- */
Object.assign(ICONS, {
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>' });
(function () { const i = SCREENS.findIndex((s) => s.id === "alerts"); SCREENS.splice(i + 1, 0, { id: "advisory", g: "act", n: { en: "Public Advisory", ja: "住民向け情報発信" }, ic: "megaphone" }); })();
(function () { const st = document.createElement("style"); st.textContent = `
#db-tick{display:inline-flex;align-items:center;gap:8px;margin-left:14px;max-width:min(52vw,640px);background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:100px;padding:3px 12px 3px 5px;cursor:pointer;font-weight:600;white-space:nowrap;overflow:hidden}
#db-tick:hover{background:rgba(255,255,255,.2)}#db-tick .tl{border-radius:100px;padding:1px 9px;font-size:10px;font-weight:800;letter-spacing:.08em;flex:none}
#db-tick .tt{overflow:hidden;text-overflow:ellipsis}#db-tick .tg{opacity:.75;font-weight:500;flex:none}#db-tick:empty{display:none}
.fresh{margin:0 12px 12px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r);background:#fff;font-size:11.5px}
.fresh .fh{display:flex;align-items:center;gap:6px;font-weight:700;color:var(--ink);margin-bottom:4px}.fresh .fd{width:8px;height:8px;border-radius:50%;flex:none}
.fresh .row{display:flex;justify-content:space-between;gap:8px;padding:2px 0;color:var(--ink-3)}.fresh .row b{color:var(--ink);font-weight:600;text-align:right}
.advtabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 12px}.advtab{border:1px solid var(--line-2);border-radius:100px;padding:7px 14px;font-size:12.5px;font-weight:700;color:var(--ink-2);background:#fff}
.advtab.on{background:var(--ai);border-color:var(--ai);color:#fff}
.advcard{border:1px solid var(--line);border-radius:var(--r-lg);background:#fff;box-shadow:var(--sh-sm);display:flex;flex-direction:column}
.advcard .ah{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 15px;background:var(--surface-2);border-bottom:1px solid var(--line);font-weight:700;font-size:13px;border-radius:var(--r-lg) var(--r-lg) 0 0}
.advcard .ab{padding:15px 17px;font-size:13.5px;line-height:1.7;color:var(--ink-2);flex:1;outline:none}
.advcard .ab[contenteditable=true]{background:#FFFDF5;box-shadow:inset 0 0 0 2px #F7D8B4}
.advcard .ab h3{font-size:16px;margin:0 0 8px;color:var(--ink)}.advcard .ab p{margin:0 0 9px}.advcard .ab .src{font-size:11.5px;color:var(--ink-3);margin-top:10px}
.advcard .af{display:flex;gap:8px;flex-wrap:wrap;padding:11px 15px;border-top:1px solid var(--line);position:relative}
.dpill{background:#FDF0E0;color:#8a5212;border:1px solid #F7D8B4;border-radius:100px;padding:2px 9px;font-size:10.5px;font-weight:700}
.tpill{background:var(--beni);color:#fff;border-radius:100px;padding:2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.06em}
.sharewrap{position:relative}.sharemenu{position:absolute;left:0;bottom:calc(100% + 6px);z-index:1500;background:#fff;border:1px solid var(--line-2);border-radius:12px;box-shadow:var(--sh-lg);padding:6px;min-width:250px;display:none}
.sharemenu.open{display:block}.shitem{display:flex;align-items:center;gap:10px;width:100%;border:none;background:none;text-align:left;padding:8px 10px;border-radius:8px;font-size:13px;font-weight:600;color:var(--ink-2)}
.shitem:hover{background:var(--surface-2)}.shitem small{display:block;font-size:10.5px;font-weight:500;color:var(--ink-3)}
.shico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800;flex:none}
.mstage.off{opacity:.38}.mstage.skip{opacity:.5;border-style:dashed}
.feedrow{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);align-items:flex-start}.feedrow:last-child{border-bottom:none}
.feedrow .fbar{flex:0 0 6px;align-self:stretch;border-radius:4px}.feedrow .ft{font-size:13px;font-weight:600}.feedrow .fm{font-size:11.5px;color:var(--ink-3);margin-top:2px}
.fstat{display:inline-block;border-radius:100px;padding:2px 9px;font-size:10.5px;font-weight:700;color:#fff;margin-top:5px}
.simbanner{background:repeating-linear-gradient(45deg,#FDF0E0,#FDF0E0 10px,#FEF6EA 10px,#FEF6EA 20px);border:1px solid #F7D8B4;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;color:#8a5212;margin-bottom:10px}
`; document.head.appendChild(st); })();

/* ---------- add-on state ---------- */
const ADV = { aud: "res", mode: "approve", test: false, posted: [], editing: {}, lastLoad: Date.now() };
try { const m = localStorage.getItem("osaka.twin.advmode"); if (["off", "draft", "approve", "auto"].includes(m)) ADV.mode = m; } catch (e) {}

/* ---------- situation from the live data ---------- */
function advSituation() {
  const L = areaStations();
  const oxs = L.filter((s) => s.ox != null).map((s) => ({ s, v: s.ox })).sort((a, b) => b.v - a.v);
  const pms = L.map((s) => ({ s, v: dayMean(s, "pm25") })).filter((x) => x.v != null).sort((a, b) => b.v - a.v);
  const dust = L.filter((s) => { const k = kosaFlag(s); return k && k.flag; });
  const peak = (pol, hrs) => { if (!D.fcIdx || !D.fcIdx.length) return null; const ser = areaAxisSeries(pol), nH = D.times.length; let pk = null;
    for (let i = nH; i < Math.min(ser.length, nH + hrs); i++) { const v = ser[i]; if (v != null && (!pk || v > pk.v)) pk = { v, t: D.axis[i].t }; } return pk; };
  const S = { oxTop: oxs[0] || null, oxAbove: oxs.filter((x) => x.v > 60), pmTop: pms[0] || null, pmAbove: pms.filter((x) => x.v > 35), dust,
    pmFc: peak("pm25", 24), oxFc: peak("ox", 24), pmFc3: peak("pm25", 72), oxFc3: peak("ox", 72), n: L.length, obs: D.latest && D.latest.observedAt, test: false };
  let k = "good";
  if (S.oxTop && S.oxTop.v >= 240) k = "oxwarn"; else if (S.oxTop && S.oxTop.v >= 120) k = "oxadv"; else if (S.pmTop && S.pmTop.v > 70) k = "pmalert";
  else if (dust.length) k = "dust"; else if (S.oxAbove.length) k = "oxcaution"; else if (S.pmAbove.length) k = "pmcaution";
  else if ((S.pmFc && S.pmFc.v > 35) || (S.oxFc && S.oxFc.v > 60)) k = "watch";
  S.kind = k;
  if (ADV.test) { const top = S.oxTop || (L[0] ? { s: L[0] } : null); if (top) { S.oxTop = { s: top.s, v: 125 }; S.kind = "oxadv"; S.test = true; } }
  return S;
}
const ADV_SEV = { oxwarn: { en: "Warning level", ja: "警報レベル", c: "#8E2C8E" }, oxadv: { en: "Advisory level", ja: "注意報レベル", c: "#E0602A" }, pmalert: { en: "Alert level", ja: "注意喚起レベル", c: "#E0602A" },
  dust: { en: "Asian dust (kōsa)", ja: "黄砂", c: "#C77A12" }, oxcaution: { en: "Above standard", ja: "基準超過", c: "#E0A21B" }, pmcaution: { en: "Above standard", ja: "基準超過", c: "#E0A21B" },
  watch: { en: "Watch", ja: "注意", c: "#6A3FA0" }, good: { en: "Good", ja: "良好", c: "#0F9D6B" } };
const URGENT = ["oxwarn", "oxadv", "pmalert"];

/* ---------- bilingual drafts ---------- */
function advDraft(aud, lang) {
  const S = advSituation(), J = lang === "ja", T = (e, j) => (J ? j : e), k = S.kind;
  const nm = (s) => (J ? s.name : s.model && s.nameEn ? s.nameEn : s.name);
  const place = (s) => { if (!s) return "–"; const m = s.muni && (J ? s.muni.ja : s.muni.en); return J ? nm(s) + (m && m !== nm(s) ? "（" + m + "）" : "") : m || nm(s); };
  const loc = J ? "ja-JP" : "en-GB";
  const tm = (iso) => (iso ? new Date(iso).toLocaleString(loc, { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }) : "–");
  const dh = (iso) => (iso ? new Date(iso).toLocaleString(loc, { timeZone: "Asia/Tokyo", weekday: "short", hour: "2-digit", minute: "2-digit" }) : "–");
  const f0 = (v) => (v == null ? "–" : String(Math.round(v))), f1 = (v) => (v == null ? "–" : v.toFixed(1));
  const ox = S.oxTop, pm = S.pmTop, nOx = S.oxAbove.length, nPm = S.pmAbove.length;
  let title, lead, advice = "", note = "";
  if (k === "oxwarn" || k === "oxadv") {
    const w = k === "oxwarn";
    title = w ? T("Photochemical smog: warning-level readings", "光化学スモッグ：警報レベルの測定値") : T("Photochemical smog: please take care today", "光化学スモッグ：本日はご注意ください");
    lead = T("Photochemical oxidant (ozone) levels reached " + f0(ox.v) + " ppb in " + place(ox.s) + " at " + tm(S.obs) + ", at the " + (w ? "warning (240 ppb)" : "advisory (120 ppb)") + " level.",
      tm(S.obs) + "に" + place(ox.s) + "で光化学オキシダント（オゾン）濃度が" + f0(ox.v) + " ppbとなり、" + (w ? "警報（240 ppb）" : "注意報（120 ppb）") + "の基準に達しました。");
    note = T("Official advisories are issued by Osaka Prefecture — please follow its announcements.", "正式な注意報等は大阪府が発令します。府の発表に従ってください。");
    advice = T("Children, older people and anyone with asthma or heart conditions should avoid strenuous outdoor activity. If your eyes or throat feel irritated, go indoors and rinse your eyes and throat. Levels usually fall after sunset.",
      "子ども・高齢者・ぜんそくや心疾患のある方は、屋外での激しい運動を控えてください。目やのどに刺激を感じたら屋内に入り、洗眼・うがいをしてください。通常、日没後に濃度は低下します。");
  } else if (k === "pmalert") {
    title = T("High fine-particle (PM2.5) levels today", "本日はPM2.5の濃度が高くなっています");
    lead = T("The 24-hour average of fine particles (PM2.5) reached " + f1(pm.v) + " µg/m³ in " + place(pm.s) + ", above the national alert guideline (70 µg/m³).", place(pm.s) + "で微小粒子状物質（PM2.5）の24時間平均が" + f1(pm.v) + " µg/m³となり、注意喚起の目安（70 µg/m³）を超えました。");
    note = T("Official alerts are issued by Osaka Prefecture — please follow its announcements.", "正式な注意喚起は大阪府が行います。府の発表に従ってください。");
    advice = T("Avoid unnecessary outings and strenuous outdoor exercise, and keep window opening to a minimum. Take extra care if you have heart or lung conditions.", "不要不急の外出や屋外での激しい運動を控え、換気や窓の開閉は最小限にしてください。呼吸器・循環器に疾患のある方は特にご注意ください。");
  } else if (k === "dust") {
    title = T("Signs of Asian dust (kōsa, 黄砂) in the air", "黄砂の兆候があります");
    lead = T("Coarse dust particles are elevated at " + S.dust.length + " monitoring point(s) — a typical sign of Asian dust (kōsa), the fine sand blown from the deserts of China and Mongolia.", S.dust.length + "地点で粗大粒子が多く、黄砂（中国・モンゴルの砂漠から飛来する砂じん）の典型的な兆候が見られます。");
    advice = T("Please check the Japan Meteorological Agency's kōsa information. People with respiratory conditions should limit time outdoors, and you may prefer to dry laundry indoors.", "気象庁の黄砂情報をご確認ください。呼吸器に疾患のある方は屋外での活動を控えめにし、洗濯物は室内干しをおすすめします。");
  } else if (k === "oxcaution") {
    title = T("Photochemical oxidants slightly above the standard", "光化学オキシダントが基準をやや上回っています");
    lead = T("Photochemical oxidant (ozone) levels are above Japan's hourly standard (60 ppb) at " + nOx + " monitoring point(s); the highest is " + f0(ox.v) + " ppb in " + place(ox.s) + ". This is below the advisory level (120 ppb).",
      nOx + "地点で光化学オキシダント（オゾン）が1時間値の環境基準（60 ppb）を上回っています。最高は" + place(ox.s) + "の" + f0(ox.v) + " ppbで、注意報の基準（120 ppb）は下回っています。");
    advice = T("Most people need not change their plans. Sensitive groups may wish to reduce long or strenuous outdoor activity in the afternoon.", "多くの方は普段どおり過ごせます。影響を受けやすい方は、午後の長時間・激しい屋外活動を控えめにしてください。");
  } else if (k === "pmcaution") {
    title = T("PM2.5 above the daily standard in places", "一部地域でPM2.5が日平均の基準を上回っています");
    lead = T("The 24-hour average of fine particles (PM2.5) is above Japan's daily standard (35 µg/m³) at " + nPm + " monitoring point(s); the highest is " + f1(pm.v) + " µg/m³ in " + place(pm.s) + ".",
      nPm + "地点で微小粒子状物質（PM2.5）の24時間平均が環境基準（35 µg/m³）を上回っています。最高は" + place(pm.s) + "の" + f1(pm.v) + " µg/m³です。");
    advice = T("Most people need not change their plans. Sensitive groups may wish to reduce strenuous outdoor activity.", "多くの方は普段どおり過ごせます。影響を受けやすい方は、屋外での激しい運動を控えめにしてください。");
  } else if (k === "watch") {
    title = T("Air quality may worsen in the next 24 hours", "今後24時間で大気質が悪化する可能性があります");
    lead = T("Levels are within Japan's standards now, but the forecast shows a rise.", "現在は環境基準内ですが、予測では上昇が見込まれます。");
    advice = T("No action is needed now. Please check for updates before planning long outdoor activities.", "現時点で対策は不要です。長時間の屋外活動を予定する際は最新情報をご確認ください。");
  } else {
    title = T("Air quality is good today", "本日の大気質は良好です");
    lead = T("All monitored pollutants are within Japan's standards at " + S.n + " monitoring points.", S.n + "地点すべてで、測定対象物質は環境基準内です。");
    advice = T("No special precautions are needed.", "特別な対策は必要ありません。");
  }
  const outlook = [];
  const pf = aud === "hosp" ? S.pmFc3 : S.pmFc, of = aud === "hosp" ? S.oxFc3 : S.oxFc, win = aud === "hosp" ? T("Next 3 days", "今後3日間") : T("Next 24 hours", "今後24時間");
  if (pf) outlook.push(T(win + ": PM2.5 expected to peak at about " + f0(pf.v) + " µg/m³ (" + dh(pf.t) + ").", win + "：PM2.5は" + dh(pf.t) + "頃に約" + f0(pf.v) + " µg/m³で最大となる見込みです。"));
  if (of && aud === "hosp") outlook.push(T("Photochemical oxidants expected to peak at about " + f0(of.v) + " ppb (" + dh(of.t) + ").", "光化学オキシダントは" + dh(of.t) + "頃に約" + f0(of.v) + " ppbで最大となる見込みです。"));
  const urgent = URGENT.includes(k), caution = ["oxcaution", "pmcaution"].includes(k);
  let paras;
  if (aud === "school") {
    title = T("Schools and care homes: ", "学校・福祉施設向け：") + title;
    const g = urgent ? T("Move PE lessons and outdoor play indoors while levels remain high. Keep children and residents with asthma indoors and watch for eye or throat irritation, coughing or breathing difficulty. Keep windows closed during the highest hours.",
      "濃度が高い間は、体育や屋外での遊びを屋内に切り替えてください。ぜんそくのある児童・入所者は屋内で過ごし、目やのどの刺激、せき、息苦しさに注意してください。濃度が高い時間帯は窓を閉めてください。")
      : k === "dust" ? T("Limit outdoor activity for children and residents with respiratory conditions, keep windows closed, and wipe dust off play equipment before use.", "呼吸器に疾患のある児童・入所者の屋外活動を控えめにし、窓を閉め、遊具の砂ぼこりを拭いてから使用してください。")
      : caution ? T("Outdoor activity can continue. Shorten strenuous outdoor exercise for pupils and residents with asthma, and keep inhalers to hand.", "屋外活動は継続できます。ぜんそくのある児童・入所者の激しい運動は短めにし、吸入薬を手元に用意してください。")
      : k === "watch" ? T("No changes are needed today. Please check the next update before planning outdoor events.", "本日は変更の必要はありません。屋外行事の計画前に次回の情報をご確認ください。")
      : T("Normal outdoor activities can go ahead.", "通常どおり屋外活動を行えます。");
    paras = [lead, g].concat(note ? [note] : []).concat(outlook);
  } else if (aud === "hosp") {
    title = T("Hospitals and clinics: ", "医療機関向け：") + title;
    const g = urgent || k === "dust" ? T("Expect a possible rise in asthma, COPD and cardiovascular presentations over the next 24–48 hours.", "今後24〜48時間、ぜんそく・COPD・循環器疾患の受診が増える可能性があります。")
      : caution || k === "watch" ? T("A small rise in respiratory presentations is possible among sensitive patients.", "影響を受けやすい患者で、呼吸器症状の受診がやや増える可能性があります。")
      : T("No elevated levels are expected; no change to usual preparedness.", "高濃度は見込まれていません。通常の体制で対応してください。");
    paras = [lead, g].concat(outlook);
  } else paras = [lead].concat(note ? [note] : []).concat([advice]).concat(outlook);
  const mk = modeKind();
  const src = mk === "om" ? T("Open-Meteo European model (CAMS) — model estimates, not station measurements", "Open-Meteo欧州モデル（CAMS）— 測定局の実測ではなくモデル推計")
    : mk === "sample" ? T("SAMPLE DATA — values are invented", "サンプルデータ — 値は作成値")
    : T("Ministry of the Environment monitoring stations (preliminary values)", "環境省 大気汚染常時監視測定局（速報値）") + (mk === "blend" ? T(" and Open-Meteo model", "・Open-Meteoモデル") : "");
  const basis = T("Based on: ", "根拠：") + src + " · " + tm(S.obs) + (pf || of ? T(" · forecast: EU Copernicus model", "・予測：欧州コペルニクスモデル") : "");
  return { title, paras, basis, kind: k, test: S.test };
}

/* ---------- feed (simulated, from the last 7 days) ---------- */
function advEvents() {
  const ev = [], L = areaStations(), Ts = D.times || []; if (!Ts.length || !L.length) return ev;
  const dayOf = (t) => new Date(Date.parse(t) + 9 * 3600e3).toISOString().slice(0, 10), days = {};
  Ts.forEach((t, i) => (days[dayOf(t)] = days[dayOf(t)] || []).push(i));
  Object.keys(days).sort().forEach((d) => {
    const idx = days[d]; let on = false, adv = false;
    idx.forEach((i) => { let mx = null, ms = null; L.forEach((s) => { const v = histAt(s, "ox", i); if (v != null && (mx == null || v > mx)) { mx = v; ms = s; } }); if (mx == null) return;
      if (mx > 60 && !on) { on = true; ev.push({ t: Ts[i], kind: mx >= 120 ? "oxadv" : "oxcaution", v: mx, s: ms, pol: "ox" }); adv = mx >= 120; }
      else if (on && mx >= 120 && !adv) { adv = true; ev.push({ t: Ts[i], kind: "oxadv", v: mx, s: ms, pol: "ox" }); }
      else if (on && mx <= 60) { on = false; adv = false; ev.push({ t: Ts[i], kind: "clear", pol: "ox" }); } });
    if (idx.length >= 18) { let mx = null, ms = null; L.forEach((s) => { const a = idx.map((i) => histAt(s, "pm25", i)).filter((v) => v != null); if (a.length >= 18) { const m = mean(a); if (mx == null || m > mx) { mx = m; ms = s; } } });
      if (mx != null && mx > 35) ev.push({ t: Ts[idx[idx.length - 1]], kind: mx > 70 ? "pmalert" : "pmcaution", v: mx, s: ms, pol: "pm25" }); }
    const i7 = idx.find((i) => jstHour(Ts[i]) === 7); if (i7 != null) ev.push({ t: Ts[i7], kind: "summary" });
  });
  return ev.sort((a, b) => (a.t < b.t ? -1 : 1));
}
function advEvTitle(e) {
  const p = e.s ? sName(e.s) : "";
  return ({ oxadv: tx("Smog advisory level — ", "光化学スモッグ注意報レベル — ") + p + " " + Math.round(e.v) + " ppb", oxcaution: tx("Oxidants above standard — ", "オキシダント基準超過 — ") + p + " " + Math.round(e.v) + " ppb",
    pmalert: tx("PM2.5 alert level — ", "PM2.5注意喚起レベル — ") + p + " " + (e.v || 0).toFixed(1) + " µg/m³", pmcaution: tx("PM2.5 daily mean above standard — ", "PM2.5日平均基準超過 — ") + p + " " + (e.v || 0).toFixed(1) + " µg/m³",
    clear: tx("All clear — oxidants back within the standard", "解除 — オキシダントが基準内に戻りました"), summary: tx("Daily air quality summary", "本日の大気質のお知らせ") })[e.kind];
}
const CH = { urgent: "LINE · X · Facebook · Email", caution: "LINE · X", clear: "LINE · X", summary: "X" };
function advStatus(e, n) {
  const urgent = URGENT.includes(e.kind), h = jstHour(e.t), quiet = h >= 22 || h < 7, m = ADV.mode;
  if (m === "off") return { c: "#9AA3B2", t: tx("Not shared — auto-share is off", "共有なし — 自動共有はオフ") };
  if (m === "draft") return { c: "#6B7282", t: tx("Draft sent to the duty officer to post manually", "担当者へ下書きを送付（手動で投稿）") };
  if (!urgent && n > 4) return { c: "#C77A12", t: tx("Skipped — daily limit of 4 posts reached", "見送り — 1日の上限（4件）に到達") };
  if (!urgent && quiet) return { c: "#C77A12", t: m === "auto" ? tx("Held for quiet hours — posted automatically at 07:00", "夜間のため保留 — 7:00に自動投稿") : tx("Held for quiet hours — approved and posted at 07:00", "夜間のため保留 — 承認後7:00に投稿") };
  if (m === "auto") return { c: "#6A3FA0", t: tx("Posted automatically to demo accounts", "デモ用アカウントへ自動投稿") };
  return { c: "#0F9D6B", t: urgent ? tx("Approved by the duty officer within 5 min — posted", "担当者が5分以内に承認 — 投稿済み") : tx("Approved by the duty officer — posted", "担当者が承認 — 投稿済み") };
}
function advFeedHtml() {
  const ev = advEvents(), perDay = {}, rows = [];
  ev.forEach((e) => { const d = new Date(Date.parse(e.t) + 9 * 3600e3).toISOString().slice(0, 10); perDay[d] = (perDay[d] || 0) + 1; rows.push({ e, st: advStatus(e, perDay[d]) }); });
  const sess = ADV.posted.map((p) => '<div class="feedrow"><div class="fbar" style="background:' + p.c + '"></div><div><div class="ft">' + esc(p.title) + '</div><div class="fm">' + fmtDH(p.t) + " · " + p.ch + '</div><span class="fstat" style="background:' + p.c + '">' + esc(p.st) + "</span></div></div>").join("");
  const list = rows.slice(-12).reverse().map((r) => { const ch = URGENT.includes(r.e.kind) ? CH.urgent : CH[r.e.kind] || CH.caution, sev = ADV_SEV[r.e.kind] || { c: r.e.kind === "clear" ? "#0F9D6B" : "#1B365D" };
    return '<div class="feedrow"><div class="fbar" style="background:' + sev.c + '"></div><div><div class="ft">' + esc(advEvTitle(r.e)) + '</div><div class="fm">' + fmtDH(r.e.t) + " · " + ch + '</div><span class="fstat" style="background:' + r.st.c + '">' + r.st.t + "</span></div></div>"; }).join("");
  return sess + list || '<p class="muted" style="margin:0">' + tx("No events in the last 7 days.", "過去7日間に該当する事象はありません。") + "</p>";
}

/* ---------- page ---------- */
const SHARE_CH = [["line", "LINE", "#06C755", "L", { en: "Messages & official accounts", ja: "メッセージ・公式アカウント" }], ["x", "X (Twitter)", "#000", "X", { en: "Post with text", ja: "テキスト付きで投稿" }],
  ["facebook", "Facebook", "#1877F2", "f", { en: "Shares the page link; text is copied", ja: "ページのリンクを共有（本文はコピー）" }], ["linkedin", "LinkedIn", "#0A66C2", "in", { en: "Shares the page link; text is copied", ja: "ページのリンクを共有（本文はコピー）" }],
  ["email", { en: "Email", ja: "メール" }, "#3C4250", "@", { en: "Schools, care homes, hospitals", ja: "学校・福祉施設・医療機関" }], ["teams", "Microsoft Teams", "#5059C9", "T", { en: "Share to a chat or channel", ja: "チャット・チャネルに共有" }],
  ["link", { en: "Copy link", ja: "リンクをコピー" }, "#6B7282", "⧉", { en: "Link to this twin", ja: "本ツインへのリンク" }], ["device", { en: "More (phone share)", ja: "その他（端末の共有）" }, "#00A3AF", "⋯", { en: "Instagram, WhatsApp and other apps", ja: "Instagram・WhatsAppなど" }]];
function advCard(lang, d) {
  const J = lang === "ja", ed = ADV.editing[lang];
  const menu = SHARE_CH.filter((c) => c[0] !== "device" || navigator.share).map((c) => '<button class="shitem" data-act="advshare" data-ch="' + c[0] + '" data-l="' + lang + '"><span class="shico" style="background:' + c[2] + '">' + c[3] + "</span><span>" + tr(c[1]) + "<small>" + tr(c[4]) + "</small></span></button>").join("");
  return '<div class="advcard"><div class="ah"><span>' + (J ? "日本語" : "English") + (d.test ? ' <span class="tpill">TEST</span>' : "") + '</span><span class="dpill">' + (J ? "承認待ちの下書き" : "Draft for approval") + "</span></div>"
    + '<div class="ab" id="adv-' + lang + '"' + (ed ? ' contenteditable="true"' : "") + "><h3>" + esc(d.title) + "</h3>" + d.paras.map((p) => "<p>" + esc(p) + "</p>").join("") + '<div class="src">' + esc(d.basis) + "</div></div>"
    + '<div class="af no-print"><button class="btn sm primary" data-act="advcopy" data-l="' + lang + '">' + icon("copy") + (J ? "コピー" : "Copy") + '</button><button class="btn sm" data-act="advprint" data-l="' + lang + '">' + icon("printer") + (J ? "印刷" : "Print") + "</button>"
    + '<button class="btn sm' + (ed ? " primary" : "") + '" data-act="advedit" data-l="' + lang + '">' + icon("edit") + (ed ? (J ? "完了" : "Done") : J ? "編集" : "Edit") + "</button>"
    + '<span class="sharewrap"><button class="btn sm" data-act="advsharemenu" data-l="' + lang + '">' + icon("share") + (J ? "共有 ▾" : "Share ▾") + '</button><div class="sharemenu" id="shm-' + lang + '">' + menu + "</div></span></div></div>";
}
function vAdvisory() {
  const S = advSituation(), sev = ADV_SEV[S.kind], aud = ADV.aud, m = ADV.mode;
  const auds = [["res", tx("Residents (web / social)", "住民（Web・SNS）")], ["school", tx("Schools & care homes", "学校・福祉施設")], ["hosp", tx("Hospitals & clinics", "医療機関")]];
  const MODES = [["off", tx("Off", "オフ"), tx("Manual sharing only, using the Share button.", "共有ボタンによる手動共有のみ。")],
    ["draft", tx("Draft only", "下書きのみ"), tx("The agent writes drafts and notifies staff; people post them.", "エージェントが下書きを作成して担当者に通知し、担当者が投稿。")],
    ["approve", tx("Approve then post", "承認後に投稿"), tx("Recommended. A person approves every post in Teams or email before it goes out.", "推奨。すべての投稿を担当者がTeamsまたはメールで承認してから配信。")],
    ["auto", tx("Fully automatic", "完全自動"), tx("Posts without approval. Demo with test accounts only.", "承認なしで投稿。テスト用アカウントでのデモ専用。")]];
  const act = { off: [], draft: [1, 2], approve: [1, 2, 3, 4, 5], auto: [1, 2, 4, 5] }[m];
  const STEPS = [[tx("Detect", "検知"), tx("The collector checks every new reading against official thresholds every 30 minutes.", "収集処理が30分ごとに新しい測定値を公式基準と照合。"), "GitHub Action"],
    [tx("Draft", "下書き"), tx("Writes the bilingual advisory shown on this page.", "本ページの日英の下書きを作成。"), tx("This page", "本ページ")],
    [tx("Approve", "承認"), tx("Sends it to the duty officer with Approve / Edit / Reject.", "承認・編集・却下ボタン付きで担当者に送付。"), "Teams · Power Automate"],
    [tx("Post", "投稿"), tx("Publishes through each platform's posting service.", "各プラットフォームの投稿サービスで配信。"), "LINE · X · Facebook · LinkedIn"],
    [tx("Log", "記録"), tx("Records time, data used and approver for every post.", "投稿ごとに時刻・使用データ・承認者を記録。"), tx("Audit trail", "監査ログ")]];
  const drafts = { en: advDraft(aud, "en"), ja: advDraft(aud, "ja") };
  const pending = m === "approve" || m === "draft"
    ? '<div class="card pad" style="border-left:4px solid ' + sev.c + ';margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><div><div class="eyebrow">' + (m === "approve" ? tx("Awaiting approval", "承認待ち") : tx("Draft ready for staff", "担当者向け下書き")) + (S.test ? ' <span class="tpill">TEST</span>' : "") + '</div><div style="font-weight:700;margin-top:3px">' + esc(drafts[state.lang === "ja" ? "ja" : "en"].title) + '</div><div class="muted" style="font-size:12px">' + tx("Channels: ", "配信先：") + (URGENT.includes(S.kind) ? CH.urgent : S.kind === "good" ? CH.summary : CH.caution) + "</div></div>"
      + (m === "approve" ? '<div class="btnrow"><button class="btn sm primary" data-act="advapprove">' + icon("check") + tx("Approve & post", "承認して投稿") + '</button><button class="btn sm" data-act="advedit" data-l="' + (state.lang === "ja" ? "ja" : "en") + '">' + icon("edit") + tx("Edit", "編集") + '</button><button class="btn sm" data-act="advreject">' + icon("x") + tx("Reject", "却下") + "</button></div>" : "") + "</div></div>"
    : m === "auto" ? '<div class="callout warn" style="margin-bottom:14px">' + icon("alert") + " " + tx("Fully automatic: the current draft would be posted without review. Use only with test accounts — official advisories are the responsibility of Osaka Prefecture and JMA.", "完全自動：現在の下書きは確認なしで投稿されます。テスト用アカウントでのみ使用してください。正式な注意報等は大阪府・気象庁の責務です。") + "</div>" : "";
  return head(tx("Public advisory drafts", "住民向け情報発信の下書き"), tx("Plain-language drafts written from the latest data, in English and Japanese. An official reviews and approves before anything is published.", "最新データから作成した、日英のわかりやすい下書きです。公開前に担当者が確認・承認します。"))
    + '<div class="callout warn">' + icon("alert") + " <b>" + tx("Draft for approval.", "承認待ちの下書き。") + "</b> " + tx("Official advisories are issued by Osaka Prefecture and the Japan Meteorological Agency. These drafts support, not replace, them.", "正式な注意報等は大阪府・気象庁が発表します。これらの下書きはそれを補完するもので、代替するものではありません。") + "</div>"
    + '<div class="kpis" style="margin-top:14px">' + kpi(tx("Situation now", "現在の状況"), '<span style="color:' + sev.c + '">' + tr(sev) + "</span>", S.test ? "TEST" : fmtT(S.obs)) + kpi(tx("Highest Ox now", "現在の最高Ox"), S.oxTop ? Math.round(S.oxTop.v) + " <small>ppb</small>" : "–", S.oxTop ? esc(sName(S.oxTop.s)) : "", S.oxTop && bandOf("ox", S.oxTop.v).hex)
    + kpi(tx("Highest PM2.5 (24 h)", "PM2.5最高（24時間）"), S.pmTop ? S.pmTop.v.toFixed(1) + " <small>µg/m³</small>" : "–", S.pmTop ? esc(sName(S.pmTop.s)) : "", S.pmTop && bandOf("pm25", S.pmTop.v).hex) + kpi(tx("Points reporting", "報告地点"), S.n, esc(areaName())) + "</div>"
    + '<div class="advtabs no-print">' + auds.map((a) => '<button class="advtab' + (aud === a[0] ? " on" : "") + '" data-act="advaud" data-v="' + a[0] + '">' + a[1] + "</button>").join("") + '<span style="flex:1"></span><button class="btn sm" data-act="advtest">' + icon("flask") + (ADV.test ? tx("End test event", "テストを終了") : tx("Simulate an advisory event", "注意報レベルを模擬")) + "</button></div>"
    + '<div class="grid g2">' + advCard("en", drafts.en) + advCard("ja", drafts.ja) + "</div>"
    + '<div class="section-head"><h2>' + icon("megaphone") + " " + tx("Auto-share", "自動共有") + '</h2><div class="d">' + tx("How an agent would publish approved advisories automatically. Simulated here — nothing is posted.", "承認済みの情報をエージェントが自動配信する仕組み。ここでは模擬のみで、実際には投稿されません。") + "</div></div>"
    + '<div class="mode4" style="margin-bottom:14px">' + MODES.map((x) => '<div class="mcard' + (m === x[0] ? " on" : "") + '" data-act="advmode" data-v="' + x[0] + '"><div class="mh"><div><div class="mt">' + x[1] + '</div><div class="mlab">' + (m === x[0] ? tx("Selected", "選択中") : tx("Click to select", "クリックで選択")) + "</div></div>" + (x[0] === "auto" ? '<span class="tpill" style="margin-left:auto">' + tx("DEMO ONLY", "デモ専用") + "</span>" : x[0] === "approve" ? '<span class="pill tag-live" style="margin-left:auto">' + tx("Recommended", "推奨") + "</span>" : "") + '</div><div class="mb">' + x[2] + "</div></div>").join("") + "</div>"
    + '<div class="mflow" style="margin-bottom:14px">' + STEPS.map((s, i) => '<div class="mstage' + (act.includes(i + 1) ? "" : m === "auto" && i === 2 ? " skip" : " off") + '"><div class="msn">' + (i + 1) + '</div><div class="mst">' + s[0] + (m === "auto" && i === 2 ? tx(" — skipped", " — 省略") : "") + '</div><div class="msd">' + s[1] + '</div><div class="msrc">' + s[2] + "</div></div>").join("") + "</div>"
    + pending
    + '<div class="grid g2"><div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("Simulated social feed", "模擬SNSフィード") + '</h3><div class="simbanner">' + tx("SIMULATION — built from the last 7 days of data. Nothing has been posted.", "模擬 — 過去7日間のデータから作成。実際の投稿はありません。") + '</div><div style="max-height:460px;overflow:auto">' + advFeedHtml() + "</div></div>"
    + '<div class="card pad"><h3 style="font-size:15px;margin-bottom:8px">' + tx("Safeguards", "安全対策") + '</h3><ul style="margin:0 0 14px;padding-left:18px;font-size:13px;line-height:1.7;color:var(--ink-2)"><li><b>' + tx("No repeats", "重複防止") + "</b> — " + tx("the same event is posted once.", "同じ事象は1回のみ投稿。") + "</li><li><b>" + tx("Quiet hours 22:00–07:00", "夜間 22:00〜7:00") + "</b> — " + tx("non-urgent posts wait until morning; advisory-level posts go out immediately.", "緊急でない投稿は朝まで保留、注意報レベルは即時配信。") + "</li><li><b>" + tx("Daily limit", "1日の上限") + "</b> — " + tx("at most 4 non-urgent posts per day.", "緊急でない投稿は1日4件まで。") + "</li><li><b>" + tx("All-clear", "解除のお知らせ") + "</b> — " + tx("a follow-up post when levels return to normal.", "濃度が戻ったら続報を投稿。") + "</li></ul>"
    + '<h3 style="font-size:15px;margin-bottom:8px">' + tx("What a real deployment needs", "実運用に必要なもの") + '</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:var(--ink-2)"><li>' + tx("Official accounts: LINE Official Account, X, Facebook Page, LinkedIn Page", "公式アカウント：LINE公式アカウント・X・Facebookページ・LinkedInページ") + "</li><li>" + tx("Access to each platform's posting service (X charges for this)", "各プラットフォームの投稿サービスの利用権（Xは有料）") + "</li><li>" + tx("Keys stored as GitHub secrets, never in the web page", "キーはGitHubのシークレットに保存（Webページには置かない）") + "</li><li>" + tx("A Power Automate flow, or a small agent, for the approval step", "承認ステップ用のPower Automateフローまたは小規模エージェント") + "</li><li>" + tx("Agreement with Osaka Prefecture on wording and responsibility", "文言と責任分担についての大阪府との合意") + "</li></ul></div></div>"
    + how([[tx("Drafts are written from the data", "下書きはデータから作成"), tx("The page checks the highest photochemical oxidant reading now, the highest 24-hour PM2.5 mean, Asian dust (kōsa) signs and the next 24 hours of forecast, then picks the matching wording.", "現在の光化学オキシダントの最高値、PM2.5の24時間平均の最高値、黄砂の兆候、今後24時間の予測を確認し、該当する文面を選びます。")],
      [tx("Share opens each platform with the text filled in", "共有で各サービスを本文入りで開く"), tx("You stay signed in to your own account and press Post yourself. Facebook and LinkedIn only accept a link, so the text is copied for you to paste. Link sharing needs the site published on GitHub.", "ご自身のアカウントでログインしたまま、ご自身で投稿します。FacebookとLinkedInはリンクのみ受け付けるため、本文はコピーされます。リンク共有にはGitHubでの公開が必要です。")],
      [tx("Auto-share is simulated", "自動共有は模擬"), tx("The feed shows what an agent would have posted over the past week under the selected mode, with the safeguards applied.", "選択したモードと安全対策のもとで、過去1週間にエージェントが投稿したであろう内容を表示します。")]])
    + assumptions([[tx("Wording is a template", "文面はテンプレート"), tx("Drafts follow common Japanese prefectural guidance; Osaka Prefecture's own wording should replace them.", "一般的な都道府県の案内に準じた文面です。大阪府の公式文面に置き換えてください。"), tx("template", "テンプレート")],
      [tx("Thresholds", "基準"), tx("Ox advisory 120 ppb / warning 240 ppb; PM2.5 alert guideline 70 µg/m³ daily mean; standards Ox 60 ppb hourly, PM2.5 35 µg/m³ daily.", "Ox注意報120 ppb・警報240 ppb、PM2.5注意喚起の目安 日平均70 µg/m³、環境基準 Ox 1時間値60 ppb・PM2.5 日平均35 µg/m³。"), "120 / 240 / 70"],
      [tx("Approver and timings are simulated", "承認者と時間は模擬"), tx("The duty officer, approval times and channels in the feed are illustrative.", "フィードの担当者・承認時間・配信先は例示です。"), tx("simulated", "模擬")],
      [tx("Quiet hours and limit", "夜間・上限"), tx("22:00–07:00 JST quiet hours and 4 non-urgent posts per day are suggested defaults.", "夜間22:00〜7:00（日本時間）と1日4件は推奨の初期値です。"), "22–07 · 4/day"]])
    + sources(["soramame", "cams", "alerts", "eqs", "jmaWarn"]);
}

/* ---------- actions ---------- */
function advText(lang) { const el = document.getElementById("adv-" + lang); return el ? el.innerText.replace(/\n{3,}/g, "\n\n").trim() : ""; }
function advURL() { return /^https?:$/.test(location.protocol) ? location.href.split("#")[0] : ""; }
function advCopy(s, msg) {
  const done = () => toast(msg || tx("Copied", "コピーしました"));
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, () => fallback()); else fallback();
  function fallback() { const ta = document.createElement("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast(tx("Copy failed — select the text manually", "コピーできませんでした。手動で選択してください")); } ta.remove(); }
}
function advShare(ch, lang) {
  const text = advText(lang), url = advURL(), title = text.split("\n")[0] || "", enc = encodeURIComponent, short = text.length > 250 ? text.slice(0, 247) + "…" : text;
  const needUrl = () => toast(tx("Link sharing needs the site published on GitHub. From a desktop file use Copy, LINE, X or Email.", "リンク共有にはGitHubでの公開が必要です。デスクトップではコピー・LINE・X・メールをご利用ください。"));
  const open = (u) => window.open(u, "_blank", "noopener,width=680,height=680");
  if (ch === "line") open("https://line.me/R/share?text=" + enc(text + (url ? "\n" + url : "")));
  else if (ch === "x") open("https://twitter.com/intent/tweet?text=" + enc(short) + (url ? "&url=" + enc(url) : ""));
  else if (ch === "facebook" || ch === "linkedin") { if (!url) return needUrl(); advCopy(text, tx("Text copied — paste it into your post (this platform only accepts a link)", "本文をコピーしました。投稿に貼り付けてください（リンクのみ対応）"));
    open(ch === "facebook" ? "https://www.facebook.com/sharer/sharer.php?u=" + enc(url) : "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(url)); }
  else if (ch === "email") location.href = "mailto:?subject=" + enc(title) + "&body=" + enc(text + (url ? "\n\n" + url : ""));
  else if (ch === "teams") { if (!url) { advCopy(text, tx("Text copied — paste it into a Teams chat", "本文をコピーしました。Teamsのチャットに貼り付けてください")); open("https://teams.microsoft.com/"); return; }
    open("https://teams.microsoft.com/share?href=" + enc(url) + "&msgText=" + enc(text)); }
  else if (ch === "link") { if (!url) return needUrl(); advCopy(url, tx("Link copied", "リンクをコピーしました")); }
  else if (ch === "device" && navigator.share) navigator.share({ title, text, url: url || undefined }).catch(() => {});
}
function advPrint(lang) {
  const el = document.getElementById("adv-" + lang); if (!el) return; const w = window.open("", "_blank"); if (!w) return toast(tx("Allow pop-ups to print", "印刷するにはポップアップを許可してください"));
  w.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + esc(advText(lang).split("\n")[0]) + "</title><style>body{font-family:'Segoe UI','Hiragino Sans','Yu Gothic UI','Meiryo',sans-serif;padding:32px;color:#161A22;line-height:1.7;max-width:760px}h3{font-size:20px}.tag{display:inline-block;background:#FDF0E0;color:#8a5212;border-radius:99px;padding:2px 10px;font-size:12px;font-weight:700;margin-bottom:12px}.src{font-size:12px;color:#6B7282;margin-top:14px}</style></head><body><div class='tag'>"
    + (lang === "ja" ? "承認待ちの下書き" : "Draft for approval") + "</div>" + el.innerHTML + "</body></html>");
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}
document.addEventListener("click", (e) => { if (!e.target.closest(".sharewrap")) document.querySelectorAll(".sharemenu.open").forEach((m) => m.classList.remove("open")); }, true);

/* ---------- ticker & freshness ---------- */
function advTicker() {
  let el = document.getElementById("db-tick");
  if (!el) { el = document.createElement("span"); el.id = "db-tick"; el.setAttribute("data-act", "ticker"); const t = document.getElementById("db-t"); t.parentNode.insertBefore(el, t.nextSibling); }
  if (!state.loaded || !D.stations.length) { el.innerHTML = ""; return; }
  let a = buildAlerts().slice(); const S = ADV.test ? advSituation() : null;
  if (S && S.test) a.unshift({ sev: "#E0602A", k: "smog", t: "TEST · " + tx("Ox at advisory level — ", "Oxが注意報レベル — ") + sName(S.oxTop.s), d: "125 ppb ≥ 120" });
  if (!a.length) { el.innerHTML = '<span class="tl" style="background:#0F9D6B">' + tx("OK", "正常") + '</span><span class="tt">' + tx("No active alerts · ", "アラートなし · ") + esc(areaName()) + "</span>"; el.title = ""; return; }
  const x = a[0], lab = x.k === "smog" ? (x.sev === "#8E2C8E" ? tx("WARNING", "警報") : tx("ADVISORY", "注意報")) : x.k === "fc" ? tx("FORECAST", "予測") : x.k === "jma" ? "JMA" : x.k === "dust" ? tx("KŌSA", "黄砂") : tx("ABOVE STANDARD", "基準超過");
  const d = String(x.d || "").replace(/<[^>]*>/g, "");
  el.innerHTML = '<span class="tl" style="background:' + x.sev + '">' + lab + '</span><span class="tt">' + esc(x.t) + (d ? " · " + esc(d) : "") + "</span>" + (a.length > 1 ? '<span class="tg">+' + (a.length - 1) + "</span>" : "") + '<span class="tg">→ ' + tx("Alerts", "アラート") + "</span>";
  el.title = a.map((y) => y.t).join("\n");
}
function advFresh() {
  const sb = document.querySelector(".sidebar"); if (!sb || !state.loaded) return;
  const mk = modeKind(), obs = D.latest && D.latest.observedAt, age = obs ? (Date.now() - Date.parse(obs)) / 3600e3 : null;
  const nOff = D.stations.filter((s) => !s.model).length, nMod = D.stations.filter((s) => s.model).length;
  const lab = { official: tx("Live · official stations", "ライブ・公的測定局"), aqicn: tx("Live · AQICN backup", "ライブ・AQICN予備"), blend: tx("Live · official + Open-Meteo", "ライブ・公式＋Open-Meteo"), om: tx("Live · Open-Meteo EU model", "ライブ・Open-Meteo欧州モデル"), sample: tx("Sample data — not live", "サンプル — ライブではありません") }[mk] || mk;
  const stale = mk !== "sample" && age != null && age > 2, col = mk === "sample" ? "#9AA3B2" : stale ? "#C77A12" : "#0F9D6B";
  const next = mk === "sample" ? "—" : mk === "official" || mk === "aqicn" ? (D.gen ? fmtT(new Date(Date.parse(D.gen) + 30 * 60e3).toISOString(), false) : "—") : fmtT(new Date(ADV.lastLoad + 10 * 60e3).toISOString(), false);
  const ago = age == null ? "" : age < 1 ? " (" + Math.max(0, Math.round(age * 60)) + tx(" min ago", "分前") + ")" : " (" + age.toFixed(1) + tx(" h ago", "時間前") + ")";
  const html = '<div class="fh"><span class="fd" style="background:' + col + '"></span>' + lab + (stale ? ' <span class="pill tag-demo" style="font-size:10px;padding:1px 7px">' + tx("stale", "更新遅延") + "</span>" : "") + "</div>"
    + (mk === "om" ? '<div class="row"><span>' + tx("Model points", "モデル点") + "</span><b>" + nMod + "</b></div>" : '<div class="row"><span>' + tx("Stations reporting", "報告局数") + "</span><b>" + nOff + (nMod ? " + " + nMod + tx(" model", " モデル") : "") + "</b></div>")
    + '<div class="row"><span>' + tx("Last reading", "最新の測定") + "</span><b>" + fmtT(obs, false) + ago + "</b></div>"
    + '<div class="row"><span>' + (mk === "official" || mk === "aqicn" ? tx("Next collection", "次回収集") : tx("Next refresh", "次回更新")) + "</span><b>" + next + "</b></div>";
  let el = sb.querySelector(".fresh"); if (!el) { el = document.createElement("div"); el.className = "fresh"; sb.appendChild(el); } el.innerHTML = html;
}

/* ---------- hook into the core ---------- */
const _advBody = body; body = function () { if (state.screen === "advisory" && D.stations.length) return vAdvisory(); return _advBody(); };
const _advRender = render; render = function () { _advRender(); try { advTicker(); advFresh(); } catch (e) { console.warn("advisory add-on", e); } };
const _advLoad = loadData; loadData = async function () { const r = await _advLoad.apply(this, arguments); ADV.lastLoad = Date.now(); return r; };
const _advClick = onPageClick; onPageClick = function (a, t, e) {
  if (a === "ticker") { state.screen = "alerts"; window.scrollTo(0, 0); render(); return; }
  if (a === "advaud") { ADV.aud = t.dataset.v; ADV.editing = {}; render(); return; }
  if (a === "advmode") { ADV.mode = t.dataset.v; try { localStorage.setItem("osaka.twin.advmode", ADV.mode); } catch (x) {} render(); return; }
  if (a === "advtest") { ADV.test = !ADV.test; render(); toast(ADV.test ? tx("Test event: advisory-level reading simulated", "テスト：注意報レベルを模擬しています") : tx("Test ended", "テストを終了しました")); return; }
  if (a === "advcopy") { advCopy(advText(t.dataset.l)); return; }
  if (a === "advprint") { advPrint(t.dataset.l); return; }
  if (a === "advedit") { const l = t.dataset.l; if (ADV.editing[l]) { const el = document.getElementById("adv-" + l); ADV.editing[l] = false; if (el) el.removeAttribute("contenteditable"); t.classList.remove("primary"); t.innerHTML = icon("edit") + (l === "ja" ? "編集" : "Edit"); }
    else { ADV.editing[l] = true; const el = document.getElementById("adv-" + l); if (el) { el.setAttribute("contenteditable", "true"); el.focus(); } t.classList.add("primary"); t.innerHTML = icon("check") + (l === "ja" ? "完了" : "Done"); } return; }
  if (a === "advsharemenu") { const mm = document.getElementById("shm-" + t.dataset.l), was = mm.classList.contains("open"); document.querySelectorAll(".sharemenu.open").forEach((x) => x.classList.remove("open")); if (!was) mm.classList.add("open"); return; }
  if (a === "advshare") { document.querySelectorAll(".sharemenu.open").forEach((x) => x.classList.remove("open")); advShare(t.dataset.ch, t.dataset.l); return; }
  if (a === "advapprove") { const S = advSituation(), l = state.lang === "ja" ? "ja" : "en";
    ADV.posted.unshift({ t: new Date().toISOString(), title: (S.test ? "TEST · " : "") + (advText(l).split("\n")[0] || ""), ch: URGENT.includes(S.kind) ? CH.urgent : S.kind === "good" ? CH.summary : CH.caution, c: "#0F9D6B", st: tx("Approved by you — posted (simulated)", "あなたが承認 — 投稿済み（模擬）") });
    render(); toast(tx("Approved — simulated post added to the feed", "承認しました — 模擬投稿をフィードに追加")); return; }
  if (a === "advreject") { ADV.posted.unshift({ t: new Date().toISOString(), title: advText(state.lang === "ja" ? "ja" : "en").split("\n")[0] || "", ch: "—", c: "#9AA3B2", st: tx("Rejected by you — not posted", "あなたが却下 — 投稿なし") }); render(); toast(tx("Rejected — nothing posted", "却下しました")); return; }
  return _advClick(a, t, e);
};
