const { readDb, writeDb, nextId } = require('../db');

function saveConfiguration({ inflationRate, baseSalary, totalGrades = 20 }) {
  const db = readDb();
  const config = {
    id: nextId(db.configurations),
    inflation_rate: inflationRate,
    base_salary: baseSalary,
    total_grades: totalGrades,
    created_at: new Date().toISOString(),
  };
  db.configurations.push(config);
  writeDb(db);
  return config;
}

function getLatestConfiguration() {
  const db = readDb();
  return db.configurations[db.configurations.length - 1] || null;
}

module.exports = {
  saveConfiguration,
  getLatestConfiguration,
};
