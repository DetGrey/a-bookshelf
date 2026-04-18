const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.join(__dirname, '..');
const envFilePath = path.join(projectRoot, '.env.local');
const targetPath = path.join(projectRoot, 'src', 'environments', 'environment.local.ts');

function parseDotEnv(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

let fileVars = {};
if (fs.existsSync(envFilePath)) {
  const fileContents = fs.readFileSync(envFilePath, 'utf8');
  fileVars = parseDotEnv(fileContents);
}

const environment = {
  production: false,
  supabaseUrl: process.env.SUPABASE_URL || fileVars.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || fileVars.SUPABASE_ANON_KEY || '',
  imageProxyUrl: process.env.IMAGE_PROXY_URL || fileVars.IMAGE_PROXY_URL || '',
};

const content = `export const environment = {
  production: ${environment.production},
  supabaseUrl: ${JSON.stringify(environment.supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(environment.supabaseAnonKey)},
  imageProxyUrl: ${JSON.stringify(environment.imageProxyUrl)},
};
`;

fs.writeFileSync(targetPath, content, 'utf8');
