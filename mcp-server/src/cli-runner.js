import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 30000;

export async function runTrekker(args, options = {}) {
  const { cwd = process.cwd(), toon = true } = options;
  const fullArgs = toon ? ['--toon', ...args] : [...args];

  try {
    const { stdout, stderr } = await execFileAsync('trekker', fullArgs, {
      cwd,
      timeout: COMMAND_TIMEOUT_MS,
    });

    if (stderr) {
      console.error('trekker stderr:', stderr);
    }

    return {
      success: true,
      data: stdout,
    };
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr || '')
        : '';
    const message =
      stderr.trim() ||
      (error instanceof Error ? error.message : 'Unknown error');

    return {
      success: false,
      error: message,
    };
  }
}

export async function runTrekkerText(args, options = {}) {
  return runTrekker(args, options);
}
