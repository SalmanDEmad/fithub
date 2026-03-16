const fs = require('fs');
const path = require('path');

function readTokens(fileName) {
  const filePath = path.join(__dirname, 'src', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function flattenTokens(groupName, tokens) {
  return Object.entries(tokens).flatMap(([section, values]) =>
    Object.entries(values).map(([name, value]) => ({
      key: `${section}-${name}`,
      value,
      section: groupName,
    })),
  );
}

function buildCss(tokens) {
  const lines = [':root {'];
  for (const token of tokens) {
    lines.push(`  --${token.key}: ${token.value};`);
  }
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function buildTs(colorTokens, spacingTokens, typeTokens) {
  return `const colorTokens = ${JSON.stringify(colorTokens, null, 2)};\n\nconst spacingTokens = ${JSON.stringify(spacingTokens, null, 2)};\n\nconst typographyTokens = ${JSON.stringify(typeTokens, null, 2)};\n\nmodule.exports = { colorTokens, spacingTokens, typographyTokens };\n`;
}

function buildDts() {
  return `export declare const colorTokens: Record<string, Record<string, string>>;\nexport declare const spacingTokens: Record<string, Record<string, string>>;\nexport declare const typographyTokens: Record<string, Record<string, string>>;\nexport type ColorTokenGroup = typeof colorTokens;\nexport type SpacingTokenGroup = typeof spacingTokens;\nexport type TypographyTokenGroup = typeof typographyTokens;\n`;
}

const colorTokens = readTokens('color.tokens.json');
const spacingTokens = readTokens('spacing.tokens.json');
const typographyTokens = readTokens('typography.tokens.json');

const allTokens = [
  ...flattenTokens('color', colorTokens),
  ...flattenTokens('spacing', spacingTokens),
  ...flattenTokens('type', typographyTokens),
];

const buildDir = path.join(__dirname, 'build');
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(path.join(buildDir, 'variables.css'), buildCss(allTokens));
fs.writeFileSync(
  path.join(buildDir, 'tokens.js'),
  buildTs(colorTokens, spacingTokens, typographyTokens),
);
fs.writeFileSync(path.join(buildDir, 'tokens.d.ts'), buildDts());
