const reportData = window.PRODUCTION_REPORT_DATA;
const storageKey = "mepFanProductionEntries";
const monthOrder = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const modelHeaders = reportData.workbook.modelHeaders;
let records = [...reportData.records, ...loadSavedEntries()];

const elements = {
  reportProduct: document.querySelector("#reportProduct"),
  reportTitle: document.querySelector("#reportTitle"),
  yearFilter: document.querySelector("#yearFilter"),
  monthFilter: document.querySelector("#monthFilter"),
  searchFilter: document.querySelector("#searchFilter"),
  totalProduction: document.querySelector("#totalProduction"),
  totalTarget: document.querySelector("#totalTarget"),
  activeDays: document.querySelector("#activeDays"),
  achievementRate: document.querySelector("#achievementRate"),
  shortageTotal: document.querySelector("#shortageTotal"),
  lossProfit: document.querySelector("#lossProfit"),
  performanceLabel: document.querySelector("#performanceLabel"),
  trendChart: document.querySelector("#trendChart"),
  modelChart: document.querySelector("#modelChart"),
  insightList: document.querySelector("#insightList"),
  modelInputs: document.querySelector("#modelInputs"),
  entryForm: document.querySelector("#entryForm"),
  entryDate: document.querySelector("#entryDate"),
  entryTarget: document.querySelector("#entryTarget"),
  entryRemarks: document.querySelector("#entryRemarks"),
  entryStatus: document.querySelector("#entryStatus"),
  entryPreviewTotal: document.querySelector("#entryPreviewTotal"),
  entryTableHead: document.querySelector("#entryTableHead"),
  entryTableBody: document.querySelector("#entryTableBody"),
  recordCount: document.querySelector("#recordCount"),
  customEntryCount: document.querySelector("#customEntryCount"),
  customProductionTotal: document.querySelector("#customProductionTotal"),
  clearCustomEntries: document.querySelector("#clearCustomEntries"),
  customTableHead: document.querySelector("#customTableHead"),
  customTableBody: document.querySelector("#customTableBody"),
  printDashboard: document.querySelector("#printDashboard"),
  exportData: document.querySelector("#exportData"),
};

function loadSavedEntries() {
  try {
    const savedEntries = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(savedEntries) ? savedEntries : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(getCustomRecords()));
  } catch {
    if (elements.entryStatus) {
      elements.entryStatus.textContent = "Entry saved for this page, but browser storage is blocked.";
    }
  }
}

function getCustomRecords() {
  const originalRows = new Set(reportData.records.map((record) => record.row));
  return records.filter((record) => !originalRows.has(record.row));
}

function numberFormat(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

function percent(value) {
  return `${Number.isFinite(value) ? Math.round(value * 100) : 0}%`;
}

function getMonth(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return monthOrder[date.getMonth()];
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentFilters() {
  return {
    year: elements.yearFilter ? elements.yearFilter.value : "all",
    month: elements.monthFilter ? elements.monthFilter.value : "all",
    search: elements.searchFilter ? elements.searchFilter.value.trim().toLowerCase() : "",
  };
}

function getFilteredRecords() {
  const filters = getCurrentFilters();
  return records.filter((record) => {
    const matchesYear = filters.year === "all" || String(record.year) === filters.year;
    const matchesMonth = filters.month === "all" || record.month === filters.month;
    const searchText = `${record.date} ${record.month} ${record.year} ${record.remarks}`.toLowerCase();
    return matchesYear && matchesMonth && (!filters.search || searchText.includes(filters.search));
  });
}

function sum(recordsToSum, key) {
  return recordsToSum.reduce((total, record) => total + (Number(record[key]) || 0), 0);
}

function populateFilters() {
  if (!elements.yearFilter || !elements.monthFilter) {
    return;
  }

  const selectedYear = elements.yearFilter.value;
  const selectedMonth = elements.monthFilter.value;
  const years = [...new Set(records.map((record) => record.year))].sort();
  elements.yearFilter.innerHTML = [
    `<option value="all">All years</option>`,
    ...years.map((year) => `<option value="${year}">${year}</option>`),
  ].join("");

  const months = [...new Set(records.map((record) => record.month))]
    .filter(Boolean)
    .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  elements.monthFilter.innerHTML = [
    `<option value="all">All months</option>`,
    ...months.map((month) => `<option value="${month}">${month}</option>`),
  ].join("");

  if (selectedYear && [...years.map(String), "all"].includes(selectedYear)) {
    elements.yearFilter.value = selectedYear;
  } else if (years.includes(2026)) {
    elements.yearFilter.value = "2026";
  }
  if (selectedMonth && [...months, "all"].includes(selectedMonth)) {
    elements.monthFilter.value = selectedMonth;
  } else if (months.includes("April")) {
    elements.monthFilter.value = "April";
  }
}

function renderModelInputs() {
  if (!elements.modelInputs) {
    return;
  }

  elements.modelInputs.innerHTML = modelHeaders
    .map(
      (model) => `
        <label>
          ${model}
          <input type="number" min="0" step="1" value="0" data-model="${model}" />
        </label>
      `,
    )
    .join("");
}

function renderTableHeader() {
  if (!elements.entryTableHead) {
    return;
  }

  const headers = [
    "Date",
    "Month",
    ...modelHeaders,
    "Total",
    "Target",
    "Loss/Profit",
    "Remarks",
  ];
  elements.entryTableHead.innerHTML = headers.map((heading) => `<th>${heading}</th>`).join("");
}

function renderKpis(filteredRecords) {
  if (!elements.totalProduction) {
    return;
  }

  const production = sum(filteredRecords, "total");
  const target = sum(filteredRecords, "target");
  const lossProfit = sum(filteredRecords, "lossProfit");
  const activeDays = filteredRecords.filter((record) => record.total || record.target).length;
  const shortage = Math.max(target - production, 0);
  const achievement = target ? production / target : 0;

  elements.totalProduction.textContent = numberFormat(production);
  elements.totalTarget.textContent = numberFormat(target);
  elements.shortageTotal.textContent = numberFormat(shortage);
  elements.lossProfit.textContent = numberFormat(lossProfit);
  elements.lossProfit.className = lossProfit < 0 ? "negative" : "positive";
  elements.activeDays.textContent = `${numberFormat(activeDays)} active days`;
  elements.achievementRate.textContent = `${percent(achievement)} achieved`;
  elements.performanceLabel.textContent =
    lossProfit > 0 ? "under target" : lossProfit < 0 ? "above target" : "balanced";
}

function renderTrendChart(filteredRecords) {
  if (!elements.trendChart) {
    return;
  }

  const visible = filteredRecords
    .filter((record) => record.total || record.target)
    .slice(-35);
  const maxValue = Math.max(...visible.map((record) => Math.max(record.total, record.target)), 1);

  if (!visible.length) {
    elements.trendChart.innerHTML = `<p class="helper">No production entries match this filter.</p>`;
    return;
  }

  elements.trendChart.innerHTML = visible
    .map((record) => {
      const productionWidth = Math.min((record.total / maxValue) * 100, 100);
      const targetWidth = Math.min((record.target / maxValue) * 100, 100);
      return `
        <div class="bar-row" title="${record.date}: ${numberFormat(record.total)} / ${numberFormat(record.target)}">
          <div class="bar-label">${record.date.slice(5)}</div>
          <div class="bar-track">
            <div class="target-fill" style="width:${targetWidth}%"></div>
            <div class="bar-fill" style="width:${productionWidth}%"></div>
          </div>
          <div class="bar-value">${numberFormat(record.total)}</div>
        </div>
      `;
    })
    .join("");
}

function renderModelChart(filteredRecords) {
  if (!elements.modelChart) {
    return;
  }

  const totals = modelHeaders.map((model) => ({
    model,
    total: sum(filteredRecords, model),
  }));
  const maxValue = Math.max(...totals.map((item) => item.total), 1);

  elements.modelChart.innerHTML = totals
    .map(
      (item) => `
        <div class="model-row">
          <div class="model-row-top">
            <span>${item.model}</span>
            <span>${numberFormat(item.total)}</span>
          </div>
          <div class="model-track">
            <div class="model-fill" style="width:${(item.total / maxValue) * 100}%"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderInsights(filteredRecords) {
  if (!elements.insightList) {
    return;
  }

  const productionSummary = reportData.workbook.summary.production;
  const monthlyTarget = reportData.workbook.summary.monthlyTarget;
  const topModel = modelHeaders
    .map((model) => ({ model, total: productionSummary[model] }))
    .sort((a, b) => b.total - a.total)[0];
  const remarks = reportData.aggregate.remarks;
  const filteredProduction = sum(filteredRecords, "total");
  const filteredTarget = sum(filteredRecords, "target");

  const insights = [
    `April 2026 production is ${numberFormat(productionSummary.total)} against a monthly target of ${numberFormat(monthlyTarget.total)}.`,
    `${topModel.model} is the highest-producing model with ${numberFormat(topModel.total)} units.`,
    `Current filter shows ${numberFormat(filteredProduction)} production units and ${numberFormat(Math.max(filteredTarget - filteredProduction, 0))} remaining need.`,
    remarks.length
      ? `Remarks found: ${remarks.join("; ")}.`
      : "No remarks were found in the selected production records.",
  ];

  elements.insightList.innerHTML = insights.map((insight) => `<li>${insight}</li>`).join("");
}

function renderTable(filteredRecords) {
  if (!elements.entryTableBody || !elements.recordCount) {
    return;
  }

  const rows = filteredRecords
    .filter((record) => record.total || record.target || record.remarks)
    .slice(-120)
    .reverse();

  elements.recordCount.textContent = `${numberFormat(rows.length)} visible records`;

  if (!rows.length) {
    elements.entryTableBody.innerHTML = `<tr><td colspan="${modelHeaders.length + 6}">No records match this filter.</td></tr>`;
    return;
  }

  elements.entryTableBody.innerHTML = rows
    .map((record) => {
      const modelCells = modelHeaders
        .map((model) => `<td class="model-qty">${numberFormat(record[model])}</td>`)
        .join("");
      const lossClass = record.lossProfit < 0 ? "negative" : "positive";
      return `
        <tr>
          <td class="date-cell">${record.date}</td>
          <td class="month-cell">${record.month} ${record.year}</td>
          ${modelCells}
          <td class="total-cell"><strong>${numberFormat(record.total)}</strong></td>
          <td class="target-cell">${numberFormat(record.target)}</td>
          <td class="variance-cell ${lossClass}">${numberFormat(record.lossProfit)}</td>
          <td class="remarks-cell">${record.remarks || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function renderDashboard() {
  const filteredRecords = getFilteredRecords();
  renderKpis(filteredRecords);
  renderTrendChart(filteredRecords);
  renderModelChart(filteredRecords);
  renderInsights(filteredRecords);
  renderTable(filteredRecords);
}

function addEntry(event) {
  event.preventDefault();
  const date = elements.entryDate.value;
  const modelValues = {};
  let total = 0;

  document.querySelectorAll("[data-model]").forEach((input) => {
    const value = Number(input.value) || 0;
    modelValues[input.dataset.model] = value;
    total += value;
  });

  const target = Number(elements.entryTarget.value) || 0;
  const entry = {
    row: Date.now(),
    date,
    year: new Date(`${date}T00:00:00`).getFullYear(),
    month: getMonth(date),
    ...modelValues,
    total,
    target,
    lossProfit: target - total,
    remarks: elements.entryRemarks.value.trim(),
  };

  records.push(entry);
  saveEntries();
  populateFilters();
  if (elements.yearFilter && elements.monthFilter) {
    elements.yearFilter.value = String(entry.year);
    elements.monthFilter.value = entry.month;
  }
  elements.entryForm.reset();
  elements.entryTarget.value = target || 1600;
  document.querySelectorAll("[data-model]").forEach((input) => {
    input.value = 0;
  });
  if (elements.entryDate) {
    elements.entryDate.value = date;
  }
  if (elements.entryStatus) {
    elements.entryStatus.textContent = `Saved ${numberFormat(total)} units for ${date}.`;
  }
  updateEntryPreview();
  renderCustomEntries();
  renderDashboard();
}

function exportCurrentData() {
  const headers = [
    "date",
    "year",
    "month",
    ...modelHeaders,
    "total",
    "target",
    "lossProfit",
    "remarks",
  ];
  const rows = getFilteredRecords().map((record) =>
    headers.map((header) => JSON.stringify(record[header] === undefined ? "" : record[header])).join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mep-fan-production-dashboard.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function renderCustomTableHeader() {
  if (!elements.customTableHead) {
    return;
  }

  const headers = ["Date", ...modelHeaders, "Total", "Target", "Loss/Profit", "Remarks"];
  elements.customTableHead.innerHTML = headers.map((heading) => `<th>${heading}</th>`).join("");
}

function updateEntryPreview() {
  if (!elements.entryPreviewTotal) {
    return;
  }

  const total = [...document.querySelectorAll("[data-model]")].reduce(
    (entryTotal, input) => entryTotal + (Number(input.value) || 0),
    0,
  );
  elements.entryPreviewTotal.textContent = numberFormat(total);
}

function renderCustomEntries() {
  const customRecords = getCustomRecords();
  if (elements.customEntryCount) {
    elements.customEntryCount.textContent = numberFormat(customRecords.length);
  }
  if (elements.customProductionTotal) {
    elements.customProductionTotal.textContent = numberFormat(sum(customRecords, "total"));
  }
  if (!elements.customTableBody) {
    return;
  }

  if (!customRecords.length) {
    elements.customTableBody.innerHTML = `<tr><td colspan="${modelHeaders.length + 5}">No browser entries yet.</td></tr>`;
    return;
  }

  elements.customTableBody.innerHTML = customRecords
    .slice()
    .reverse()
    .map((record) => {
      const modelCells = modelHeaders.map((model) => `<td>${numberFormat(record[model])}</td>`).join("");
      const lossClass = record.lossProfit < 0 ? "negative" : "positive";
      return `
        <tr>
          <td>${record.date}</td>
          ${modelCells}
          <td><strong>${numberFormat(record.total)}</strong></td>
          <td>${numberFormat(record.target)}</td>
          <td class="${lossClass}">${numberFormat(record.lossProfit)}</td>
          <td>${record.remarks || "-"}</td>
        </tr>
      `;
    })
    .join("");
}

function clearCustomEntries() {
  records = [...reportData.records];
  saveEntries();
  if (elements.entryStatus) {
    elements.entryStatus.textContent = "Browser entries cleared.";
  }
  renderCustomEntries();
}

function bootDashboard() {
  populateFilters();
  renderTableHeader();
  renderCustomEntries();
  renderDashboard();

  elements.yearFilter.addEventListener("change", renderDashboard);
  elements.monthFilter.addEventListener("change", renderDashboard);
  elements.searchFilter.addEventListener("input", renderDashboard);
  elements.printDashboard.addEventListener("click", () => window.print());
  elements.exportData.addEventListener("click", exportCurrentData);
}

function bootEntry() {
  renderModelInputs();
  renderCustomTableHeader();
  renderCustomEntries();
  updateEntryPreview();

  elements.entryDate.value = getLocalDateInputValue();
  elements.entryForm.addEventListener("submit", addEntry);
  elements.modelInputs.addEventListener("input", updateEntryPreview);
  elements.clearCustomEntries.addEventListener("click", clearCustomEntries);
}

function boot() {
  if (elements.reportTitle) {
    elements.reportTitle.textContent = reportData.workbook.company;
  }
  if (elements.reportProduct) {
    elements.reportProduct.textContent = `${reportData.workbook.reportTitle} • ${reportData.workbook.product}`;
  }

  if (document.body.classList.contains("dashboard-page")) {
    bootDashboard();
  }
  if (document.body.classList.contains("entry-page")) {
    bootEntry();
  }
}

boot();
