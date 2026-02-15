# HR Grading & Salary Management System

Backend-first enterprise application that replaces Excel-based grading and salary band calculation with a maintainable full-stack system.

## Features
- Configuration service (inflation rate, base salary, total grades).
- Calculation service that reproduces ToRate-grade logic in code.
- Reporting service with exports to CSV, Excel, and PDF.
- Persistent embedded database (JSON file) for configuration, run history, and grade results.
- Dashboard UI with forms, read-only results table, and salary band visualization.

## Calculation Logic (Excel parity)
Inputs:
- `globalMaxScore = MAX(CI values)`
- `inflationRate` (config)
- `baseSalary` (config)
- `totalGrades` (default 20)

Generated per grade from top (`totalGrades`) to bottom (`1`):
- `minScore = (grade / totalGrades) * globalMaxScore`
- `scoreDiff = previous.avgScore - current.minScore`
- `avgScore = minScore + (scoreDiff / 2)`
- `maxScore = avgScore + (scoreDiff / 2)`
- `percentDiff = avgScore * 0.30 / globalMaxScore`
- `finalPercent = percentDiff + inflationRate`
- `minSalary = previous.minSalary + (previous.minSalary * finalPercent)`
- `salaryDiff = previous.avgSalary - current.minSalary`
- `avgSalary = minSalary + (salaryDiff / 2)`
- `maxSalary = avgSalary + (salaryDiff / 2)`

Top grade seed behavior:
- `avgScore = maxScore = minScore`
- `minSalary = avgSalary = maxSalary = baseSalary`

## Tech Stack
- Node.js HTTP API
- Embedded JSON database
- Vanilla JS/CSS frontend
- Native export generators for CSV, Excel-compatible XML (.xlsx), and PDF

## Setup
```bash
npm start
```
Open: `http://localhost:3000`

## Environment Variables
- `PORT` (default `3000`)
- `DB_PATH` (default `./data/hr_system.json`)

## API Endpoints
- `GET /api/configuration`
- `POST /api/configuration`
- `GET /api/ci-inputs`
- `POST /api/ci-inputs`
- `POST /api/runs`
- `GET /api/runs`
- `GET /api/runs/:id`
- `GET /api/runs/:id/export.csv`
- `GET /api/runs/:id/export.xlsx`
- `GET /api/runs/:id/export.pdf`

## Deployment
### Local server
1. Install Node 18+.
2. Run `npm start`.
3. Persist `data/` volume for the database file.

### Cloud deployment
- Works on container-based services (Render, Railway, Fly.io, ECS, Kubernetes).
- Provide `PORT` from platform.
- Mount persistent storage and set `DB_PATH` to mounted volume.
- Build command: none required
- Start command: `npm start`
