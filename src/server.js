const fs = require('fs');
const path = require('path');
const http = require('http');
const { ensureDb } = require('./db');
const { saveConfiguration, getLatestConfiguration } = require('./services/configurationService');
const {
  setCiInputs,
  getCiInputs,
  calculateRun,
  getRuns,
  getRunResults,
} = require('./services/calculationService');
const { asCsv, asExcel, asPdf } = require('./services/reportingService');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function serveStatic(req, res) {
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const absolute = path.join(publicDir, filePath);
  if (!absolute.startsWith(publicDir) || !fs.existsSync(absolute)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(absolute);
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
  };
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(absolute));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/configuration') {
      sendJson(res, 200, getLatestConfiguration());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/configuration') {
      const body = await readBody(req);
      const { inflationRate, baseSalary, totalGrades = 20 } = body;
      if ([inflationRate, baseSalary].some((value) => typeof value !== 'number')) {
        sendJson(res, 400, { error: 'inflationRate and baseSalary must be numbers.' });
        return;
      }
      sendJson(res, 201, saveConfiguration({ inflationRate, baseSalary, totalGrades }));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/ci-inputs') {
      sendJson(res, 200, getCiInputs());
      return;
    }

    if (req.method === 'POST' && req.url === '/api/ci-inputs') {
      const body = await readBody(req);
      const values = body.values || [];
      if (!Array.isArray(values) || values.length === 0 || values.some((item) => typeof item !== 'number')) {
        sendJson(res, 400, { error: 'values must be a non-empty number array.' });
        return;
      }
      sendJson(res, 201, setCiInputs(values));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/runs') {
      sendJson(res, 201, calculateRun());
      return;
    }

    if (req.method === 'GET' && req.url === '/api/runs') {
      sendJson(res, 200, getRuns());
      return;
    }

    if (req.method === 'GET' && req.url.match(/^\/api\/runs\/\d+$/)) {
      const runId = req.url.split('/')[3];
      const result = getRunResults(runId);
      if (!result) {
        sendJson(res, 404, { error: 'Run not found' });
        return;
      }
      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'GET' && req.url.match(/^\/api\/runs\/\d+\/export\.(csv|xlsx|pdf)$/)) {
      const parts = req.url.split('/');
      const runId = parts[3];
      const format = parts[4].split('.')[1];
      const result = getRunResults(runId);
      if (!result) {
        sendJson(res, 404, { error: 'Run not found' });
        return;
      }

      if (format === 'csv') {
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="run-${runId}.csv"`,
        });
        res.end(asCsv(result));
        return;
      }

      if (format === 'xlsx') {
        res.writeHead(200, {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="run-${runId}.xlsx"`,
        });
        res.end(asExcel(result));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="run-${runId}.pdf"`,
      });
      res.end(asPdf(result));
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
});

ensureDb();
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`HR grading system running on http://localhost:${PORT}`);
});
