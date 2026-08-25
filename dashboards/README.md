# VizDash Pro marketing dashboards

Six ready-to-import dashboards for **https://ouseph444.github.io/VizDash-Pro-/**

| File | Pages | Visuals | Datasets | Rows | Measures | Size |
|------|-------|---------|----------|------|----------|------|
| `01-marketing-performance.vizdash.json` | 4 | 41 | 1 | 2,205 | 19 | 0.7 MB |
| `02-paid-media-analytics.vizdash.json`  | 4 | 44 | 1 | 4,936 | 19 | 1.6 MB |
| `03-funnel-conversion.vizdash.json`     | 4 | 39 | 1 | 3,024 | 19 | 1.0 MB |
| `04-acquisition-cac-ltv.vizdash.json`   | 4 | 41 | 2 | 2,604 | 19 | 0.6 MB |
| `05-web-seo-content.vizdash.json`       | 4 | 42 | 3 | 3,332 | 30 | 1.0 MB |
| `06-social-brand.vizdash.json`          | 4 | 44 | 1 | 2,158 | 24 | 0.9 MB |

## How to load one

1. Open https://ouseph444.github.io/VizDash-Pro-/
2. Go to the **Dashboard** tab.
3. Click the **Import dashboard** button in the toolbar (the downward-arrow-into-tray
   icon, next to New and Save).
4. Pick a `.vizdash.json` file.

The data is embedded in the file, so the dashboard renders immediately — nothing to
upload first. The **Save** button next to it exports your edited version back out in
the same format.

## What is in each file

Each document follows the app's own `vizdash-dashboard` schema (v3):

```
{ "_format": "vizdash-dashboard", "schemaVersion": 3, "appVersion": "2.0",
  "dashboard": { name, pages[ { size, background, visuals[…] } ], theme, settings },
  "slicers": {},
  "datasets": [ { id, name, columns, colTypes, measures[…], rows[…] } ] }
```

- **Pages** are 1280×720, laid out as a dark title band, a slicer strip, a KPI row
  and two content rows.
- **Visuals** are all native VizDash components — KPI cards, combo, line, area,
  stacked column, bar, donut, treemap, funnel, heatmap, gauge, bubble, matrix,
  table, and dropdown/list slicers.
- **Measures** are defined on the dataset in the app's expression language
  (`SUM([Revenue]) / SUM([Spend])`), so they appear in the Fields pane and can be
  reused, edited or dragged onto new visuals.
- **Data** is deterministic sample marketing data with seasonality, a growth trend
  and weekday effects, calibrated so the headline numbers are plausible: blended
  ROAS 2.98×, paid-media ROAS 2.74×, LTV:CAC 5.58 with 4.4-month payback,
  end-to-end funnel conversion 0.54%, bounce rate 48%, social engagement rate 6.1%.

## Grain, and why it matters

The browser has to parse and aggregate this data on every interaction, so facts are
pre-aggregated: **weekly** for dashboards 1, 2 and 6; **monthly** for 3, 4 and 5.
Every file also carries `Year`, `Quarter` and `Month` label columns, and the date
column is a real datetime so visuals can re-bin it by year / quarter / month / week.

Because the app's measure language has no filter-context functions, anything that
would need one is pre-pooled into a column instead:

- Funnel: one column per stage (`Visitors`, `Leads`, `MQLs`, …) populated only on
  that stage's rows, so `SUM([Leads]) / SUM([Visitors])` is a correct rate at any
  grouping.
- `Cycle Pool`, `Time Pool`, `Scroll Pool`, `Position Pool` hold value × weight, so
  averages are volume-weighted rather than averages-of-averages.
- Cohorts carry `Cohort Size` on every row, which makes
  `SUM([Customers Retained]) / SUM([Cohort Size])` a correct retention rate in any
  cell of the grid.

## Swapping in your own data

Two options:

1. **Keep the dashboards, replace the data.** Load your CSV/Excel in the **Data**
   tab, then in the Dashboard tab point each visual at your dataset. Easiest if you
   rename your columns to match the ones listed in `columns` for that file.
2. **Edit the JSON directly.** Replace `datasets[].rows` with your own array of
   row objects and update `columns` / `colTypes` to match. Keep the column names
   and every visual and measure keeps working.

`colTypes` values are `numeric`, `categorical` or `datetime`. Dates are ISO
`YYYY-MM-DD` strings.

## Rebuilding

```
cd vizdash
python3 vdbuild.py   # regenerate all six dashboards
python3 vdcheck.py   # evaluate all 111 measures the way the app does
```

| File | Role |
|------|------|
| `vizdash/vdlib.py`     | document writer, well registry, validator |
| `vizdash/vddata.py`    | sample-data generators |
| `vizdash/vdreports.py` | the six dashboard definitions |
| `vizdash/vdbuild.py`   | build runner |
| `vizdash/vdcheck.py`   | measure-expression evaluator / KPI check |

## Verification

Checked without opening the app (it is a browser app; these were generated against
its source):

- Document shape matches `DASH.serialize()` / `DASH.deserialize()` in the live app,
  schema version 3.
- Every visual type exists in the app's component registry, and every field sits in
  a well that type actually declares, within that well's `max`, and of the right
  kind (dimension vs measure).
- Every field reference resolves to a real column or a real dataset measure; every
  `colType` is declared; ids are unique; no visual falls outside its page.
- All 111 measure expressions were run through a re-implementation of the app's
  evaluator (`DASH_AGG_FN` → `dashAggregate` → arithmetic) and produce finite,
  realistic values.
- Ranked visuals carry `sort: {by:"measure"}` — without it the app's query layer
  sorts by dimension and "top N" charts come out alphabetical.

Not proven: pixel-level rendering. If any visual looks off when you import it, tell
me which one and I will adjust the generator.
