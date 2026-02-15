async function api(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    const body = contentType.includes('application/json') ? await response.json() : await response.text();
    throw new Error(body.error || body);
  }
  return contentType.includes('application/json') ? response.json() : response.blob();
}

function number(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

async function loadLatest() {
  const runs = await api('/api/runs');
  if (!runs.length) {
    return;
  }
  const latestRun = runs[0];
  document.getElementById('runIdInput').value = latestRun.id;
  const result = await api(`/api/runs/${latestRun.id}`);
  renderResult(result);
}

function renderResult(result) {
  const summary = document.getElementById('summary');
  summary.textContent = `Run #${result.run.id} | Global Max Score: ${number(result.run.global_max_score)} | Created: ${result.run.created_at}`;

  const tbody = document.querySelector('#resultTable tbody');
  tbody.innerHTML = '';

  const chart = document.getElementById('bandChart');
  chart.innerHTML = '';

  result.grades.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.grade}</td>
      <td>${number(row.min_score)}</td>
      <td>${number(row.avg_score)}</td>
      <td>${number(row.max_score)}</td>
      <td>${(row.final_percent * 100).toFixed(2)}%</td>
      <td>${number(row.min_salary)}</td>
      <td>${number(row.avg_salary)}</td>
      <td>${number(row.max_salary)}</td>
    `;
    tbody.appendChild(tr);

    const bar = document.createElement('div');
    bar.className = 'band-bar';
    bar.textContent = `G${row.grade}: ${number(row.min_salary)} - ${number(row.max_salary)}`;
    chart.appendChild(bar);
  });
}

document.getElementById('configForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const payload = {
    inflationRate: Number(form.get('inflationRate')),
    baseSalary: Number(form.get('baseSalary')),
    totalGrades: Number(form.get('totalGrades')),
  };
  await api('/api/configuration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  document.getElementById('configStatus').textContent = 'Configuration saved.';
});

document.getElementById('ciForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const raw = new FormData(event.target).get('values');
  const values = raw.split(',').map((v) => Number(v.trim())).filter((v) => !Number.isNaN(v));
  await api('/api/ci-inputs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
  document.getElementById('ciStatus').textContent = `Saved ${values.length} CI values.`;
});

document.getElementById('runCalculation').addEventListener('click', async () => {
  await api('/api/runs', { method: 'POST' });
  await loadLatest();
});

document.querySelectorAll('.export-actions button').forEach((button) => {
  button.addEventListener('click', async () => {
    const runId = document.getElementById('runIdInput').value;
    const format = button.dataset.format;
    if (!runId) {
      return;
    }
    window.open(`/api/runs/${runId}/export.${format}`, '_blank');
  });
});

loadLatest().catch((error) => {
  document.getElementById('summary').textContent = `Info: ${error.message}`;
});
