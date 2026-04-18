const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', 'src', 'app');
const TARGET_EXTENSIONS = new Set(['.ts', '.html']);
const offenders = [];

const patterns = [
  {
    regex: /href\s*=\s*"\//g,
    message: 'Avoid root-absolute href="/..." for internal navigation. Use routerLink instead.',
  },
  {
    regex: /\[attr\.href\]\s*=\s*"'\//g,
    message: 'Avoid [attr.href] with root-absolute paths. Use [routerLink] instead.',
  },
];

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!TARGET_EXTENSIONS.has(ext)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const relativePath = path.relative(path.resolve(__dirname, '..'), fullPath).replace(/\\/g, '/');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          offenders.push({
            file: relativePath,
            line: index + 1,
            message: pattern.message,
            source: line.trim(),
          });
          pattern.regex.lastIndex = 0;
        }
        pattern.regex.lastIndex = 0;
      }
    });
  }
}

walk(ROOT);

if (offenders.length > 0) {
  console.error('\nInternal link lint failed. Found root-absolute internal links:\n');

  for (const offender of offenders) {
    console.error(`- ${offender.file}:${offender.line}`);
    console.error(`  ${offender.message}`);
    console.error(`  ${offender.source}\n`);
  }

  process.exit(1);
}

console.log('Internal link lint passed.');
