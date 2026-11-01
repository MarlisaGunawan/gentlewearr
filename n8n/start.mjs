// Starts n8n for Gentle Wear with the settings in ./.env and its data in ./.n8n-data.
//   npm start         → run n8n on http://localhost:5678
//   npm run import    → import the workflows in ./workflows (run once, n8n must be stopped)
//   npm run activate  → switch all imported workflows on (importing leaves them off)

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Minimal .env reader: KEY=value lines, # comments. */
function readEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^"|"$/g, '')];
      })
  );
}

const env = {
  ...process.env,
  N8N_USER_FOLDER: join(here, '.n8n-data'), // keep n8n's database inside this project
  N8N_PORT: '5678',
  GENERIC_TIMEZONE: 'Asia/Jakarta', // the daily recap runs at 21:00 Jakarta time
  TZ: 'Asia/Jakarta',
  N8N_BLOCK_ENV_ACCESS_IN_NODE: 'false', // workflows read GW_API_URL, TELEGRAM_CHAT_ID… from .env
  N8N_DIAGNOSTICS_ENABLED: 'false',
  N8N_PERSONALIZATION_ENABLED: 'false',
  ...readEnv(join(here, '.env')),
};

const bin = join(here, 'node_modules', 'n8n', 'bin', 'n8n');
const run = (args) =>
  new Promise((resolve) => spawn(process.execPath, [bin, ...args], { env, stdio: 'inherit' }).on('exit', resolve));

const mode = process.argv[2];
if (mode === 'import') {
  process.exit(await run(['import:workflow', '--separate', '--input=' + join(here, 'workflows')]));
} else if (mode === 'activate') {
  // Publish (= activate) every workflow file in ./workflows by its id.
  for (const file of readdirSync(join(here, 'workflows')).filter((f) => f.endsWith('.json'))) {
    const { id } = JSON.parse(readFileSync(join(here, 'workflows', file), 'utf8'));
    await run(['publish:workflow', '--id=' + id]);
  }
} else {
  process.exit(await run(['start']));
}
