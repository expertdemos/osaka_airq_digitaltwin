// Synthetic stand-in for every data service the collector calls. Used ONLY to build data/sample and for testing:
//   OUT_DIR=data/sample SAMPLE=1 SLEEP_MS=0 node --import ./scripts/sample-mock.mjs scripts/fetch-osaka.mjs
// Station names are marked (サンプル) and every value is invented.
const ST = [["北区（サンプル）", "大阪市北区", 34.705, 135.498, 1], ["中央区（サンプル）", "大阪市中央区", 34.681, 135.510, 0], ["此花区（サンプル）", "大阪市此花区", 34.683, 135.440, 0],
  ["港区（サンプル）", "大阪市港区", 34.664, 135.460, 0], ["大正区（サンプル）", "大阪市大正区", 34.651, 135.472, 0], ["住之江区（サンプル）", "大阪市住之江区", 34.610, 135.470, 0],
  ["西淀川区（サンプル）", "大阪市西淀川区", 34.710, 135.450, 1], ["淀川区（サンプル）", "大阪市淀川区", 34.720, 135.480, 0], ["東淀川区（サンプル）", "大阪市東淀川区", 34.740, 135.530, 0],
  ["城東区（サンプル）", "大阪市城東区", 34.700, 135.540, 0], ["生野区（サンプル）", "大阪市生野区", 34.655, 135.540, 0], ["平野区（サンプル）", "大阪市平野区", 34.620, 135.550, 1],
  ["阿倍野区（サンプル）", "大阪市阿倍野区", 34.640, 135.515, 0], ["住吉区（サンプル）", "大阪市住吉区", 34.610, 135.500, 0], ["鶴見区（サンプル）", "大阪市鶴見区", 34.705, 135.570, 0],
  ["西成区（サンプル）", "大阪市西成区", 34.635, 135.490, 1], ["堺区（サンプル）", "堺市堺区", 34.573, 135.483, 0], ["堺西区（サンプル）", "堺市西区", 34.540, 135.460, 0],
  ["堺北区（サンプル）", "堺市北区", 34.580, 135.510, 1], ["堺中区（サンプル）", "堺市中区", 34.530, 135.500, 0], ["堺南区（サンプル）", "堺市南区", 34.490, 135.490, 0],
  ["美原区（サンプル）", "堺市美原区", 34.540, 135.560, 0], ["豊中（サンプル）", "豊中市", 34.780, 135.470, 0], ["池田（サンプル）", "池田市", 34.820, 135.430, 0],
  ["吹田（サンプル）", "吹田市", 34.760, 135.520, 1], ["高槻（サンプル）", "高槻市", 34.850, 135.620, 0], ["茨木（サンプル）", "茨木市", 34.820, 135.570, 0],
  ["箕面（サンプル）", "箕面市", 34.830, 135.470, 0], ["摂津（サンプル）", "摂津市", 34.780, 135.560, 0], ["枚方（サンプル）", "枚方市", 34.810, 135.650, 0],
  ["寝屋川（サンプル）", "寝屋川市", 34.770, 135.630, 0], ["守口（サンプル）", "守口市", 34.740, 135.560, 1], ["門真（サンプル）", "門真市", 34.740, 135.590, 0],
  ["東大阪（サンプル）", "東大阪市", 34.680, 135.600, 0], ["八尾（サンプル）", "八尾市", 34.630, 135.600, 0], ["柏原（サンプル）", "柏原市", 34.580, 135.630, 0],
  ["松原（サンプル）", "松原市", 34.580, 135.550, 1], ["富田林（サンプル）", "富田林市", 34.500, 135.600, 0], ["河内長野（サンプル）", "河内長野市", 34.450, 135.560, 0],
  ["和泉（サンプル）", "和泉市", 34.480, 135.420, 0], ["岸和田（サンプル）", "岸和田市", 34.460, 135.370, 0], ["貝塚（サンプル）", "貝塚市", 34.440, 135.360, 0],
  ["泉佐野（サンプル）", "泉佐野市", 34.410, 135.320, 0], ["阪南（サンプル）", "阪南市", 34.360, 135.240, 0], ["高石（サンプル）", "高石市", 34.520, 135.440, 0], ["泉大津（サンプル）", "泉大津市", 34.500, 135.410, 0]];
const code = (i) => "279" + String(i + 1).padStart(5, "0");
const BAY = new Set(["大阪市此花区", "大阪市港区", "大阪市大正区", "大阪市住之江区", "大阪市西淀川区", "堺市西区", "高石市", "泉大津市"]);
const hash = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const p2 = (n) => String(n).padStart(2, "0");
function vals(i, endMs) {
  const [, city, lat, lon, road] = ST[i]; const j = new Date(endMs + 9 * 3600e3), h = (j.getUTCHours() + 23) % 24, dow = j.getUTCDay(), wk = dow === 0 ? 0.72 : dow === 6 ? 0.85 : 1;
  const T = [0.55, 0.45, 0.42, 0.45, 0.6, 0.85, 1.15, 1.4, 1.35, 1.1, 1.0, 1.0, 1.05, 1.0, 1.0, 1.1, 1.25, 1.4, 1.3, 1.1, 0.95, 0.85, 0.75, 0.65][h] * wk;
  const sun = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)), days = endMs / 864e5, ep = 1 + 0.45 * Math.sin(days / 1.7) + 0.25 * Math.sin(days / 0.55);
  const central = Math.hypot((lat - 34.69) * 111, (lon - 135.5) * 91) < 6 ? 1.35 : 1, bay = BAY.has(city) ? 1.3 : 1, n = hash(i, Math.floor(endMs / 3600e3));
  const pm25 = 8.5 * ep + 1.5 * n + (road ? 4.5 : 1.8) * T * central + (bay > 1 ? 2.2 : 0), no2 = (6 + 9 * T * central * bay + (road ? 14 * T : 0)) * (0.9 + 0.2 * n);
  const ox = Math.max(4, 22 + 38 * sun * (0.8 + 0.4 * ep / 1.5) - 0.45 * no2 + 5 * n), spm = (pm25 * 1.55 + 4 + 3 * n) / 1000;
  return { pm25: +pm25.toFixed(0), no2: +(no2 / 1000).toFixed(3), ox: +(ox / 1000).toFixed(3), spm: +spm.toFixed(3), so2: +((1 + 2 * n * bay) / 1000).toFixed(3), co: road ? +(0.2 + 0.2 * T).toFixed(1) : "", wd: sun > 0.3 ? 9 + Math.floor(n * 3) : 1 + Math.floor(n * 3), ws: +(1.2 + 3 * sun + n).toFixed(1) };
}
const H1 = "測定局コード,SO2,NO,NO2,NOX,CO,OX,NMHC,CH4,THC,SPM,PM2.5,SP,WD,WS,TEMP,HUM,測定局名称,住所,問い合わせ先,局種別,地域コード,都道府県コード,市区町村名";
function noudoAll(e) { return H1 + "\n" + ST.map((s, i) => { const v = vals(i, e); return [code(i), v.so2, "", v.no2, "", v.co, v.ox, "", "", "", v.spm, v.pm25, "", v.wd, v.ws, "", "", s[0], s[1] + "1-1", "大阪府", s[4] ? "自排局" : "一般局", "", "27", s[1]].join(","); }).join("\n") + "\n"; }
function sevenDay(i, last) { const rows = ["年,月,日,時,SO2,NO,NO2,NOX,CO,OX,NMHC,CH4,THC,SPM,PM2.5,SP,WD,WS,TEMP,HUM"];
  for (let k = 167; k >= 0; k--) { const e = last - k * 3600e3; let d = new Date(e + 9 * 3600e3), H = d.getUTCHours(); if (H === 0) { d = new Date(d.getTime() - 864e5); H = 24; }
    const v = vals(i, e); rows.push([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), H, v.so2, "", v.no2, "", v.co, v.ox, "", "", "", v.spm, v.pm25, "", v.wd, v.ws, "", ""].join(",")); }
  return rows.join("\n"); }
const lastEnd = () => Math.floor(Date.now() / 3600e3) * 3600e3 - 3600e3;
const AM = [["62078", "大阪", "Osaka", 34.6817, 135.5183], ["62001", "能勢", "Nose", 34.9917, 135.4283], ["62046", "豊中", "Toyonaka", 34.7817, 135.4383], ["62051", "枚方", "Hirakata", 34.8017, 135.6483],
  ["62091", "生駒山", "Ikomayama", 34.6783, 135.6783], ["62111", "堺", "Sakai", 34.5783, 135.4817], ["62131", "熊取", "Kumatori", 34.3917, 135.3583], ["62136", "関空島", "Kankujima", 34.4333, 135.2300]];
const R = (body, ct = "text/plain") => ({ ok: true, status: 200, headers: { get: () => ct }, arrayBuffer: async () => new TextEncoder().encode(typeof body === "string" ? body : JSON.stringify(body)).buffer });
const MUNIS = [["27100", "大阪市", "Osaka", 2752000, 34.6937, 135.5023], ["27140", "堺市", "Sakai", 826000, 34.5733, 135.4830], ["27203", "豊中市", "Toyonaka", 401000, 34.7813, 135.4697], ["27205", "吹田市", "Suita", 385000, 34.7595, 135.5168],
  ["27207", "高槻市", "Takatsuki", 348000, 34.8462, 135.6175], ["27211", "茨木市", "Ibaraki", 283000, 34.8164, 135.5686], ["27210", "枚方市", "Hirakata", 397000, 34.8144, 135.6511], ["27215", "寝屋川市", "Neyagawa", 229000, 34.7661, 135.6278],
  ["27227", "東大阪市", "Higashiosaka", 493000, 34.6794, 135.6008], ["27212", "八尾市", "Yao", 264000, 34.6269, 135.6011], ["27202", "岸和田市", "Kishiwada", 190000, 34.4606, 135.3714], ["27219", "和泉市", "Izumi", 184000, 34.4833, 135.4236],
  ["27204", "池田市", "Ikeda", 102000, 34.8219, 135.4286], ["27220", "箕面市", "Minoh", 136000, 34.8269, 135.4703], ["27213", "泉佐野市", "Izumisano", 98000, 34.4067, 135.3272], ["27217", "松原市", "Matsubara", 117000, 34.5778, 135.5519],
  ["27216", "河内長野市", "Kawachinagano", 101000, 34.4581, 135.5642], ["27214", "富田林市", "Tondabayashi", 108000, 34.4992, 135.5972], ["27206", "泉大津市", "Izumiotsu", 73000, 34.5047, 135.4106], ["27225", "高石市", "Takaishi", 56000, 34.5206, 135.4422],
  ["27209", "守口市", "Moriguchi", 143000, 34.7378, 135.5642], ["27223", "門真市", "Kadoma", 119000, 34.7392, 135.5872]];
const HOSP = [["大阪大学医学部附属病院（サンプル）", 34.8195, 135.5250], ["大阪公立大学医学部附属病院（サンプル）", 34.6441, 135.5117], ["大阪赤十字病院（サンプル）", 34.6604, 135.5238], ["大阪急性期・総合医療センター（サンプル）", 34.6076, 135.5046],
  ["関西医科大学附属病院（サンプル）", 34.8106, 135.6395], ["堺市立総合医療センター（サンプル）", 34.5557, 135.4640], ["りんくう総合医療センター（サンプル）", 34.4117, 135.3000]];
globalThis.fetch = async (u) => { u = String(u); const le = lastEnd();
  if (u.includes("kyokuNoudo/metadata.json")) { const d = new Date(le + 9 * 3600e3); return R(`{"latest":"${d.getUTCFullYear()}/${p2(d.getUTCMonth() + 1)}/${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:00:00"}`); }
  let m = u.match(/noudoAll\/(\d{4})\/(\d{2})\/(\d{2})\/(\d{2})\.csv/); if (m) { const e = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9); return e > le ? R("<!DOCTYPE html>", "text/html") : R(noudoAll(e), "text/csv"); }
  m = u.match(/NoudoTime\/279(\d{5})\/7day\.csv/); if (m) return R(sevenDay(+m[1] - 1, le), "text/csv");
  if (u.includes("soramame")) return R("<!DOCTYPE html>", "text/html");
  if (u.includes("msearch.gsi")) { const q = decodeURIComponent(u.split("q=")[1]); const s = ST.find((x) => q.includes(x[1] + "1-1")); return R(s ? [{ geometry: { coordinates: [s[3], s[2]] } }] : []); }
  if (u.includes("amedastable")) return R(Object.fromEntries(AM.map((a) => [a[0], { kjName: a[1], enName: a[2], lat: [Math.floor(a[3]), (a[3] % 1) * 60], lon: [Math.floor(a[4]), (a[4] % 1) * 60] }])));
  if (u.includes("latest_time")) { const d = new Date(Date.now() - 10 * 60e3 + 9 * 3600e3); return R(`${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}T${p2(d.getUTCHours())}:${p2(Math.floor(d.getUTCMinutes() / 10) * 10)}:00+09:00`); }
  if (u.includes("amedas/data/map")) { const h = new Date(Date.now() + 9 * 3600e3).getUTCHours(), sun = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    return R(Object.fromEntries(AM.map((a, i) => [a[0], { temp: [+(22 + 6 * sun - i * 0.3).toFixed(1), 0], humidity: [70 - Math.round(15 * sun), 0], wind: [+(1.5 + 3 * sun + (i % 3) * 0.4).toFixed(1), 0], windDirection: [sun > 0.3 ? 10 + (i % 2) : 2 + (i % 2), 0], precipitation1h: [0, 0], sun1h: [+sun.toFixed(1), 0] }]))); }
  if (u.includes("forecast/data/forecast/270000")) { const t = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10) + "T00:00:00+09:00";
    return R([{ publishingOffice: "大阪管区気象台", reportDatetime: new Date().toISOString(), timeSeries: [{ timeDefines: [t(0), t(1), t(2)], areas: [{ area: { name: "大阪府" }, weatherCodes: ["101", "200", "300"], weathers: ["晴れ時々くもり（サンプル）", "くもり（サンプル）", "雨（サンプル）"], winds: ["北の風", "南西の風", "北の風"] }] }] }]); }
  if (u.includes("warning/270000")) return R({ reportDatetime: new Date().toISOString(), headlineText: "" });
  if (u.includes("air-quality-api.open-meteo")) { const start = Math.floor(Date.now() / 864e5) * 864e5 - 7 * 864e5 - 9 * 3600e3, time = [], pm = [], p10 = [], no2 = [], o3 = [], so2 = [], co = [], dust = [];
    for (let k = 0; k < 11 * 24; k++) { const e = start + k * 3600e3; let a = 0, b = 0, c = 0; for (let i = 0; i < ST.length; i += 3) { const v = vals(i, e); a += v.pm25; b += v.no2 * 1000; c += v.ox * 1000; } const n = Math.ceil(ST.length / 3);
      time.push(new Date(e + 9 * 3600e3).toISOString().slice(0, 16)); pm.push(+(a / n * 1.18).toFixed(1)); p10.push(+(a / n * 1.7).toFixed(1)); no2.push(+(b / n * 0.8 * 1.88).toFixed(1)); o3.push(+(Math.max(5, c / n - b / n * 0.8) * 1.96).toFixed(1)); so2.push(5); co.push(230); dust.push(+(2 + 6 * hash(k, 3)).toFixed(1)); }
    return R({ hourly: { time, pm2_5: pm, pm10: p10, nitrogen_dioxide: no2, ozone: o3, sulphur_dioxide: so2, carbon_monoxide: co, dust } }); }
  if (u.includes("query.wikidata.org")) return R({ results: { bindings: MUNIS.map((m) => ({ item: { value: "Q" + m[0] }, code: { value: m[0] + "0" }, ja: { value: m[1] }, en: { value: m[2] }, pop: { value: String(m[3]) }, date: { value: "2020-10-01T00:00:00Z" }, coord: { value: `Point(${m[5]} ${m[4]})` } })) } });
  if (u.includes("overpass")) return R({ elements: HOSP.map((h) => ({ type: "node", lat: h[1], lon: h[2], tags: { amenity: "hospital", name: h[0] } })) });
  return { ok: false, status: 404, headers: { get: () => "" }, arrayBuffer: async () => new ArrayBuffer(0) };
};
