const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');

const environment = {
  production: true,
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  imageProxyUrl: process.env.IMAGE_PROXY_URL || '',
};

const content = `export const environment = {
  production: ${environment.production},
  supabaseUrl: ${JSON.stringify(environment.supabaseUrl)},
  supabaseAnonKey: ${JSON.stringify(environment.supabaseAnonKey)},
  imageProxyUrl: ${JSON.stringify(environment.imageProxyUrl)},
};
`;

fs.writeFileSync(target, content, 'utf8');