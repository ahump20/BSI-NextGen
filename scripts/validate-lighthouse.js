#!/usr/bin/env node

const fs = require('fs');

const reportPath = process.argv[2] || './lighthouse-report.json';
const budgetPath = process.argv[3] || 'packages/web/lighthouse-budgets.json';

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const budgets = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));

const failures = [];

const scores = {
  performance: report.categories?.performance?.score ?? 0,
  accessibility: report.categories?.accessibility?.score ?? 0,
};

if (scores.performance < budgets.scores.performance) {
  failures.push(`Performance score ${scores.performance} below budget ${budgets.scores.performance}`);
}

if (scores.accessibility < budgets.scores.accessibility) {
  failures.push(`Accessibility score ${scores.accessibility} below budget ${budgets.scores.accessibility}`);
}

const metricMap = {
  'largest-contentful-paint': 'largest-contentful-paint',
  'cumulative-layout-shift': 'cumulative-layout-shift',
  'total-blocking-time': 'total-blocking-time',
  interactive: 'interactive',
};

Object.entries(metricMap).forEach(([budgetKey, auditId]) => {
  const budgetValue = budgets.metrics[budgetKey];
  const audit = report.audits?.[auditId];
  if (!audit || typeof audit.numericValue !== 'number') return;

  if (auditId === 'cumulative-layout-shift') {
    if (audit.numericValue > budgetValue) {
      failures.push(`CLS ${audit.numericValue} exceeds budget ${budgetValue}`);
    }
    return;
  }

  if (audit.numericValue > budgetValue) {
    failures.push(`${auditId} ${audit.numericValue}ms exceeds budget ${budgetValue}ms`);
  }
});

if (failures.length) {
  console.error('Lighthouse budget check failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('Lighthouse budgets satisfied.');
