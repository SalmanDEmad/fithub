const fs = require('fs');
const path = require('path');

const mobileRoot = path.join(process.cwd(), 'apps', 'mobile');
const patterns = [
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'left:',
  'right:',
];

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.expo') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const offenders = [];
for (const file of walk(mobileRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const pattern of patterns) {
    if (source.includes(pattern)) {
      offenders.push({ file, pattern });
    }
  }
}

if (offenders.length === 0) {
  console.log('RTL check passed: no physical direction style props found.');
  process.exit(0);
}

console.error('RTL check failed. Replace physical left/right props with logical start/end equivalents.');
for (const offender of offenders) {
  console.error(`- ${path.relative(process.cwd(), offender.file)} (${offender.pattern})`);
}
process.exit(1);
