import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webDir = resolve(__dirname, '..');
const composeFile = resolve(webDir, '..', '..', 'docker-compose.yml');

function commandForCurrentPlatform(command) {
  if (process.platform === 'win32') {
    if (command === 'npx') {
      return 'npx.cmd';
    }
    if (command === 'npm') {
      return 'npm.cmd';
    }
  }

  return command;
}

function run(command, args, options = {}) {
  const baseOptions = {
    cwd: webDir,
    stdio: 'inherit',
    ...options,
  };

  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', `${command} ${args.join(' ')}`], baseOptions)
      : spawnSync(commandForCurrentPlatform(command), args, baseOptions);

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function waitForHttp(url, timeoutMs = 180_000, intervalMs = 2_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep retrying until timeout.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  let playwrightExitCode = 1;
  const playwrightArgs = process.argv.slice(2);
  const shouldKeepStack = process.env.KEEP_E2E_STACK === '1';

  try {
    const upExitCode = run('docker', ['compose', '-f', composeFile, 'up', '-d', '--build', 'web', 'api'], { cwd: resolve(webDir, '..', '..') });
    if (upExitCode !== 0) {
      process.exit(upExitCode);
    }

    await waitForHttp('http://localhost:5000/health/live');
    await waitForHttp('http://localhost:5173');

    playwrightExitCode = run('npm', ['exec', '--', 'playwright', 'test', ...playwrightArgs]);
  } finally {
    if (!shouldKeepStack) {
      run('docker', ['compose', '-f', composeFile, 'down'], { cwd: resolve(webDir, '..', '..') });
    }
  }

  process.exit(playwrightExitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
