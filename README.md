# Production-Report-MEP-FAN-

A static production reporting dashboard for MEP FAN LTD, built from the supplied
`Book1.xlsx` workbook.

## What it includes

- Dashboard KPI cards for total production, target, shortage, and loss/profit.
- Year/month/search filters for the analyzed Excel rows.
- Daily production vs target trend chart.
- Model-wise production analysis for each ceiling fan body model.
- Separate production entry page for adding new daily production records in the browser.
- CSV export and print actions.

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Use `index.html` for the dashboard and `entry.html` for the production entry sheet.