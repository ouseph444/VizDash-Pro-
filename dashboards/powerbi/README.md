# Power BI conversion of the VizDash Pro marketing dashboards

All six `dashboards/*.vizdash.json` documents, converted to Power BI. Same pages,
same visuals, same measures, same embedded data.

| File | Pages | Visuals | Tables | Rows | Measures |
|------|-------|---------|--------|------|----------|
| `01-marketing-performance.pbip` | 4 | 41 | 1 | 2,205 | 19 |
| `02-paid-media-analytics.pbip`  | 4 | 44 | 1 | 4,936 | 19 |
| `03-funnel-conversion.pbip`     | 4 | 39 | 1 | 3,024 | 19 |
| `04-acquisition-cac-ltv.pbip`   | 4 | 41 | 2 | 2,604 | 19 |
| `05-web-seo-content.pbip`       | 4 | 42 | 3 | 3,332 | 30 |
| `06-social-brand.pbip`          | 4 | 44 | 1 | 2,158 | 24 |

## How to open one

These are **Power BI Projects (PBIP)**. In Power BI Desktop: *File → Open report →
Browse reports*, set the file-type filter to **Power BI project files (\*.pbip)** and
pick one — or just double-click the `.pbip`. The data is embedded in the model's Power
Query as compressed inline tables, so it loads offline with nothing to connect to. Once
it is open, *File → Save as* gives you an ordinary `.pbix`.

If Desktop does not offer the `.pbip` filter, turn it on once: *File → Options and
settings → Options → Preview features → **Power BI Project (.pbip) save option***, then
restart Desktop. It has been on by default since the late-2024 builds.

Each project is three things sitting next to each other, and all three must travel
together:

```
01-marketing-performance.pbip                 <- open this one
01-marketing-performance.Report/              report definition (report.json)
01-marketing-performance.SemanticModel/       tables, measures, data (model.bim)
```

## What is in the folder

```
*.pbip + *.Report/ + *.SemanticModel/   the six dashboards
themes/*-theme.json                     each dashboard's VizDash palette as a report theme
data/<dashboard>/*.csv                  the embedded rows as CSV, one file per table
```

Report themes are **not** applied automatically — Power BI Desktop → *View → Themes →
Browse for themes* → pick the matching file. Page background colours, card backgrounds,
borders and title styling are baked into the report itself, so the reports already look
right without it; the theme file only swaps the categorical data colours to the VizDash
palette.

## Why PBIP and not .pbit or .pbix

A `.pbix` cannot be written by hand at all — its model is a compiled binary part.

A `.pbit` can in principle, but it needs a `DataMashup` part: a binary blob (MS-QDEFF)
holding a nested package with the Power Query section, a permissions document and a
metadata stream. Get any of it wrong and Power BI gives exactly the *"we couldn't open
your file — it may be encrypted or corrupted"* dialog, with nothing to diagnose from,
and none of it can be validated anywhere except inside Power BI Desktop, which does not
run on macOS.

PBIP has no such part: the M queries live in `model.bim` as text, and the report is
plain JSON. That is why it is the format Microsoft documents for generating reports from
code, and it is what these six are.

## How the conversion maps

| VizDash | Power BI visual |
|---|---|
| `text` | `textbox` (font size, weight, colour and band background preserved) |
| `dropdown` / `slicer` | `slicer` in Dropdown / List mode |
| `kpi` | `card` |
| `combo` | `lineClusteredColumnComboChart` (line series on the secondary axis) |
| `column` / `stackedcolumn` | `clusteredColumnChart` / `columnChart` |
| `bar` | `clusteredBarChart` |
| `line` / `area` | `lineChart` / `areaChart` |
| `donut` / `treemap` / `funnel` / `gauge` | `donutChart` / `treemap` / `funnel` / `gauge` |
| `bubble` | `scatterChart` (X, Y, Size, category as Details) |
| `table` / `matrix` | `tableEx` / `pivotTable` |
| `heatmap` | `pivotTable` with a conditional background colour scale on the value |

Pages stay 1280×720 and every visual keeps its exact pixel position, size and z-order.
Ranked visuals keep their `sort: {by:"measure"}` as an `OrderBy` on the visual's query,
so "top N" charts come out ranked rather than alphabetical.

### Measures

Every VizDash measure becomes a DAX measure on its table, with the number format carried
across (`cur` → `"$"#,0`, `pct` → `0.0%`, and so on). Division becomes `DIVIDE()` so an
empty filter selection gives a blank instead of an error, and operator precedence is
preserved:

| VizDash | DAX |
|---|---|
| `SUM([Revenue]) / SUM([Spend])` | `DIVIDE(SUM('Marketing performance'[Revenue]), SUM('Marketing performance'[Spend]))` |
| `SUM([Spend]) / SUM([Impressions]) * 1000` | `DIVIDE(SUM(…[Spend]), SUM(…[Impressions])) * 1000` |
| `(SUM([Revenue]) - SUM([Spend])) / SUM([Spend])` | `DIVIDE((SUM(…[Revenue]) - SUM(…[Spend])), SUM(…[Spend]))` |
| `AVG([Difficulty])` | `AVERAGE('Keywords'[Difficulty])` |
| `DISTINCTCOUNT([Campaign])` | `DISTINCTCOUNT('Paid media'[Campaign])` |

Because the pre-pooled columns (`Cycle Pool`, `Time Pool`, `Scroll Pool`, `Position Pool`,
the per-stage funnel columns, `Cohort Size` on every cohort row) came across unchanged,
the weighted averages and stage rates stay correct at any grouping — the same reason they
were built that way for VizDash.

### Two Power BI rules the conversion has to work around

**Measures and columns share one namespace.** A measure cannot be called `Revenue` while a
column called `Revenue` exists. The measures keep the clean names, so the colliding source
columns are renamed with a ` (raw)` suffix — `Revenue` → `Revenue (raw)`. Only the model
name changes; the CSVs, the Power Query step and the DAX all still line up.

**Raw fact columns are hidden.** Numeric columns that no visual uses directly are marked
hidden, so the field list shows dimensions and measures rather than the 13 raw counters
behind them. Right-click → *Unhide* in the model view to get them back.

### Date grain

VizDash re-bins a date column per visual (`{field: "Week", part: "month"}`). Power BI has
no equivalent per-visual setting that survives a file round-trip, so each binned reference
is pointed at the label column that already exists in the data — `Month` / `Month Label`
(`2024-01`), `Quarter` (`2024-Q1`), `Year`. Those sort correctly as text. `part: "week"`
uses the real date column, which gives a continuous date axis. No calculated columns were
needed in any of the six.

## Known differences from the VizDash originals

- **KPI cards lose the sparkline and the "vs previous period" delta.** Power BI's `card`
  shows the number only. The trend column each KPI used is still in the model, so swapping
  a card for the built-in KPI visual is one drag.
- **Number formats set per visual** (`compact`, custom prefix/suffix such as the `x` on
  ROAS bars) are applied through the measure's format string instead, which is model-wide.
  Set display units per visual in the formatting pane if you want `1.2M` style labels.
- **No relationships between tables.** Dashboards 04 and 05 have 2 and 3 tables; the source
  documents define no relationships either, so the tables stay independent and a slicer
  filters only visuals built on its own table. Every page except `04 / LTV Detail` uses a
  single table, and that page carries no slicers, so nothing silently stops filtering.
- **Row-level interactions** (`onClick: filter`) become Power BI's standard cross-filtering,
  which is close but not identical.

## Verification

Power BI Desktop does not run on macOS, so none of this was opened in the product. What
was checked, by `pbiconv/vdverify.py`:

- Each project has every file Desktop expects, and the references between them resolve:
  the `.pbip` points at a `.Report` folder that exists, whose `definition.pbir` points at
  the matching `.SemanticModel`, and each `.platform` declares the right item type.
- The embedded Power Query payload inflates back to the original rows — row counts match
  the source datasets exactly, and no row is ragged.
- Every visual's `projections` reference a `queryRef` that exists in its `prototypeQuery`,
  every selected field resolves to a real column or measure on a real table, every sort key
  exists, no well is empty, no selected field is left unprojected, and no visual falls
  outside its page.
- No duplicate measure names, no duplicate column names, no measure/column name collision.
- All 130 DAX measures were evaluated against the embedded rows by a re-implementation of
  the aggregation, and all are finite. The headline numbers reproduce the originals:
  blended ROAS 2.98×, paid-media ROAS 2.74×, LTV:CAC 5.58 with 4.4-month payback,
  end-to-end funnel conversion 0.54%, bounce rate 48%, social engagement rate 6.1%.

Not proven: that Power BI Desktop opens and renders them. If one fails to open, or a visual
looks wrong, tell me which and what it says and I will fix the generator.

## Rebuilding

```
cd pbiconv
python3 vd2pbi.py      # regenerate all six, into ../powerbi
python3 vdverify.py    # re-run every check above
```

| File | Role |
|------|------|
| `pbiconv/vd2pbi.py`   | driver: visual mapping, table planning, themes |
| `pbiconv/pbimodel.py` | expression → DAX, format strings, inline-data M, TMSL model |
| `pbiconv/pbireport.py`| report layout, prototype queries, visual containers |
| `pbiconv/pbipack.py`  | PBIP project writer |
| `pbiconv/vdverify.py` | static verification and measure evaluation |
