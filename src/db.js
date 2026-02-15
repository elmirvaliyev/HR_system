const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'hr_system.json');

function ensureDb() {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify({ configurations: [], ciInputs: [], runs: [], gradeResults: [] }, null, 2),
    );
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDb(payload) {
  fs.writeFileSync(dbPath, JSON.stringify(payload, null, 2));
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

module.exports = {
  ensureDb,
  readDb,
  writeDb,
  nextId,
};
