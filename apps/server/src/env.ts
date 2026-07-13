import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

function findWorkspaceEnv(startDir: string): string | null {
  let currentDir = startDir;
  const rootDir = parse(currentDir).root;

  while (true) {
    const envPath = join(currentDir, '.env');
    if (existsSync(envPath)) return envPath;
    if (currentDir === rootDir) return null;
    currentDir = dirname(currentDir);
  }
}

const envPath = findWorkspaceEnv(process.cwd());

if (envPath) {
  process.loadEnvFile(envPath);
}
