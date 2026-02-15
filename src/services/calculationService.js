const { readDb, writeDb, nextId } = require('../db');
const { getLatestConfiguration } = require('./configurationService');

function setCiInputs(values) {
  const db = readDb();
  db.ciInputs = values.map((value, index) => ({
    id: index + 1,
    ci_value: value,
    created_at: new Date().toISOString(),
  }));
  writeDb(db);
  return db.ciInputs;
}

function getCiInputs() {
  return readDb().ciInputs;
}

function calculateRun() {
  const config = getLatestConfiguration();
  if (!config) {
    throw new Error('No configuration found. Please save configuration first.');
  }

  const db = readDb();
  if (!db.ciInputs.length) {
    throw new Error('No CI inputs found. Add calculation input scores first.');
  }

  const globalMaxScore = Math.max(...db.ciInputs.map((row) => row.ci_value));
  const inflationRate = config.inflation_rate;
  const totalGrades = config.total_grades;

  const run = {
    id: nextId(db.runs),
    configuration_id: config.id,
    global_max_score: globalMaxScore,
    created_at: new Date().toISOString(),
  };
  db.runs.push(run);

  let previous = null;
  const grades = [];

  for (let grade = totalGrades; grade >= 1; grade -= 1) {
    const minScore = (grade / totalGrades) * globalMaxScore;

    let scoreDiff = 0;
    let avgScore = minScore;
    let maxScore = minScore;

    if (previous) {
      scoreDiff = previous.avg_score - minScore;
      avgScore = minScore + scoreDiff / 2;
      maxScore = avgScore + scoreDiff / 2;
    }

    const percentDiff = (avgScore * 0.30) / globalMaxScore;
    const finalPercent = percentDiff + inflationRate;

    let minSalary = config.base_salary;
    let salaryDiff = 0;
    let avgSalary = minSalary;
    let maxSalary = minSalary;

    if (previous) {
      minSalary = previous.min_salary + previous.min_salary * finalPercent;
      salaryDiff = previous.avg_salary - minSalary;
      avgSalary = minSalary + salaryDiff / 2;
      maxSalary = avgSalary + salaryDiff / 2;
    }

    const row = {
      id: nextId(db.gradeResults),
      run_id: run.id,
      grade,
      min_score: minScore,
      avg_score: avgScore,
      max_score: maxScore,
      score_diff: scoreDiff,
      percent_diff: percentDiff,
      final_percent: finalPercent,
      min_salary: minSalary,
      avg_salary: avgSalary,
      max_salary: maxSalary,
      salary_diff: salaryDiff,
    };

    db.gradeResults.push(row);
    grades.push(row);
    previous = row;
  }

  writeDb(db);
  return { runId: run.id, config, globalMaxScore, grades };
}

function getRuns() {
  return [...readDb().runs].sort((a, b) => b.id - a.id);
}

function getRunResults(runId) {
  const db = readDb();
  const run = db.runs.find((item) => item.id === Number(runId));
  if (!run) {
    return null;
  }
  const grades = db.gradeResults
    .filter((item) => item.run_id === run.id)
    .sort((a, b) => b.grade - a.grade);
  return { run, grades };
}

module.exports = {
  setCiInputs,
  getCiInputs,
  calculateRun,
  getRuns,
  getRunResults,
};
