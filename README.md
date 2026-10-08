# Osaka Air Quality Digital Twin — Art of the Possible (v12)

English / 日本語 · 16 pages · four data options · six pollutants (PM2.5, NO₂, Ox, SO₂, CO, SPM)

## Folder contents (upload ALL of these to the top level of the GitHub repository)
| File / folder | Purpose |
|---|---|
| `index.html` | The page |
| `app-core.js` | Data loading, calculations, maps |
| `app-pages.js` | The core pages |
| `app-advisory.js` | Public Advisory, auto-share simulation, alert ticker, data-freshness panel |
| `app-layers.js` | Three-layer diagram on "What Drives It" |
| `app-explain.js` | Floating M/C/F/R/A key, hover explanations, chart captions, glossary |
| `scripts/fetch-osaka.mjs` | Collector for official data (GitHub every 30 min, or locally) |
| `scripts/sample-mock.mjs` | Builds the offline sample only |
| `.github/workflows/osaka-twin.yml` | GitHub Action: collect + deploy |
| `data/latest.json` | Seed file, replaced on the first successful collection |
| `data/sample/` | Offline sample (every value invented) |
| `.nojekyll` | Required for GitHub Pages |

In Windows Explorer turn on **View → Show → Hidden items** so `.github` and `.nojekyll` are uploaded.

## Desktop
Open `index.html`. **Open-Meteo** and **Blended** fetch live European model data in the browser. **Official** falls back to Open-Meteo until official data has been collected. **Sample** works offline.

## Deploy on GitHub
1. Upload everything above; check that `data/`, `scripts/` and `.github/` appear in the repository.
2. Settings → Actions → General → Workflow permissions → **Read and write**.
3. Settings → Pages → Source: **GitHub Actions**.
4. Actions → **Osaka twin - collect live data and deploy** → **Run workflow**. The log ends with `RESULT mode=official stations=NN history=168h`.
5. Check `https://<site>/data/latest.json`, or Data & Method → **Run feed test**.

If the log shows `HTTP 403` / `fetch failed` for Soramame, the Ministry is refusing GitHub's servers: add a free AQICN key as the repository secret `WAQI_TOKEN`, or run the collector from a machine in Japan.

## Run the collector on your own computer (optional, Node.js 20+)
`node scripts/fetch-osaka.mjs` — writes `data/live.js`, which the page reads even when opened from a desktop.

## v12 changes
- Overview map: zoom buttons moved clear of the information panels (bottom right) and mouse-wheel zoom enabled; all maps have larger zoom buttons.
- Choosing an area (top drop-down or the area list on the Overview) now frames that area on every map.
- Collector writes `data/live.js` / `data/sample/sample.js` so desktop use can read collected data.
- Includes v10–v11: Official falls back to live Open-Meteo; Open-Meteo caching; only live official stations pulse; larger markers; full map key; floating key for the letters; hover explanations; glossary; three-layer diagram.

## Data use
Soramame: MOE, local governments, NIES. JMA: government standard terms. Open-Meteo CC BY 4.0 (CAMS, Copernicus licence). Wikidata CC0. OpenStreetMap ODbL. Maps: Esri (ArcGIS Online) and GSI tiles. No cadastral data.
