#!/usr/bin/env node

/**
 * Script to replace console.log/error/warn with logger utility
 * across all API route files
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const ROUTE_DIR = path.join(__dirname, '../packages/web/app/api');

// Map of file patterns to their logger names
const loggerNames = {
  'mlb/games': 'MLB-Games-API',
  'mlb/standings': 'MLB-Standings-API',
  'mlb/teams': 'MLB-Teams-API',
  'nfl/games': 'NFL-Games-API',
  'nfl/standings': 'NFL-Standings-API',
  'nfl/teams': 'NFL-Teams-API',
  'nba/games': 'NBA-Games-API',
  'nba/standings': 'NBA-Standings-API',
  'nba/teams': 'NBA-Teams-API',
  'college-baseball/games': 'CollegeBaseball-Games-API',
  'college-baseball/rankings': 'CollegeBaseball-Rankings-API',
  'college-baseball/standings': 'CollegeBaseball-Standings-API',
  'unified/games': 'Unified-Games-API',
  'unified/live': 'Unified-Live-API',
  'unified/search': 'Unified-Search-API',
  'unified/standings': 'Unified-Standings-API',
  'auth/callback': 'Auth-Callback-API',
  'auth/login': 'Auth-Login-API',
  'auth/logout': 'Auth-Logout-API',
  'auth/me': 'Auth-Me-API',
};

function getLoggerName(filePath) {
  for (const [pattern, name] of Object.entries(loggerNames)) {
    if (filePath.includes(pattern)) {
      return name;
    }
  }
  return 'API';
}

async function findRouteFiles(dir) {
  const files = [];
  
  async function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.name === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

async function fixFile(filePath) {
  let content = await readFile(filePath, 'utf8');
  let modified = false;
  
  // Check if already has logger import
  if (content.includes('createLogger') && content.includes('@bsi/shared')) {
    console.log(`✓ Skipping ${path.relative(process.cwd(), filePath)} - already uses logger`);
    return false;
  }
  
  const loggerName = getLoggerName(filePath);
  
  // Remove unused NextRequest import if GET function doesn't use it
  if (content.includes("import { NextRequest, NextResponse }") && 
      content.includes("export async function GET()")) {
    content = content.replace(
      "import { NextRequest, NextResponse } from 'next/server';",
      "import { NextResponse } from 'next/server';"
    );
    modified = true;
  }
  
  // Add logger import after the last import statement
  if (!content.includes('createLogger')) {
    const lastImportMatch = content.match(/import .* from .*;/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const importIndex = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, importIndex) + 
                `\nimport { createLogger } from '@bsi/shared';\n\nconst logger = createLogger('${loggerName}');` +
                content.slice(importIndex);
      modified = true;
    }
  }
  
  // Replace console.error statements
  const consoleErrorPattern = /console\.error\(['"](\[.*?\])?\s*(.*?)['"],\s*error\);/g;
  if (consoleErrorPattern.test(content)) {
    content = content.replace(consoleErrorPattern, "logger.error('$2', error);");
    modified = true;
  }
  
  // Replace other console.error statements
  content = content.replace(/console\.error\(/g, "logger.error(");
  
  // Replace console.log statements
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, "logger.info(");
    modified = true;
  }
  
  // Replace console.warn statements
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\(/g, "logger.warn(");
    modified = true;
  }
  
  if (modified) {
    await writeFile(filePath, content, 'utf8');
    console.log(`✓ Fixed ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('Finding API route files...');
  const files = await findRouteFiles(ROUTE_DIR);
  console.log(`Found ${files.length} route files\n`);
  
  let fixedCount = 0;
  for (const file of files) {
    if (await fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✓ Fixed ${fixedCount} files`);
}

main().catch(console.error);
