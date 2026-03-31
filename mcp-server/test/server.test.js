import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(__dirname, '../src/index.js');
const workspaceRoot = resolve(__dirname, '../..');

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function createFakeTrekker(tempDir) {
  const binDir = join(tempDir, 'bin');
  const logDir = join(tempDir, 'logs');
  const scriptPath = join(binDir, 'trekker');
  const logPath = join(logDir, 'last-call.json');

  await mkdir(binDir, { recursive: true });
  await mkdir(logDir, { recursive: true });

  await writeFile(
    scriptPath,
    `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const payload = JSON.stringify({
  argv: process.argv.slice(2),
  cwd: process.cwd(),
});
writeFileSync(process.env.TREKKER_LOG_PATH, payload);
if (process.argv.includes('quickstart')) {
  process.stdout.write('Quickstart output');
  process.exit(0);
}
process.stdout.write(payload);
`,
    'utf8'
  );

  await chmod(scriptPath, 0o755);

  return {
    binDir,
    logPath,
  };
}

async function startServer(env = {}) {
  const child = spawn(process.execPath, [serverEntry], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stdout = createInterface({
    input: child.stdout,
    crlfDelay: Infinity,
  });

  const stderr = createInterface({
    input: child.stderr,
    crlfDelay: Infinity,
  });

  const pending = [];
  const stderrLines = [];
  let waiter = null;

  stdout.on('line', (line) => {
    const message = JSON.parse(line);
    if (waiter) {
      const resolve = waiter;
      waiter = null;
      resolve(message);
      return;
    }
    pending.push(message);
  });

  stderr.on('line', (line) => {
    stderrLines.push(line);
  });

  return {
    async request(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
      if (pending.length > 0) {
        return pending.shift();
      }
      return withTimeout(
        new Promise((resolve) => {
          waiter = resolve;
        }),
        5000,
        `Timed out waiting for response. stderr: ${stderrLines.join('\n')}`
      );
    },
    notify(message) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    },
    async close() {
      child.stdin.end();
      await withTimeout(
        once(child, 'exit'),
        5000,
        `Timed out waiting for server exit. stderr: ${stderrLines.join('\n')}`
      );
    },
  };
}

test('server initializes and lists Trekker tools', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'trekker-codex-mcp-'));
  const { binDir } = await createFakeTrekker(tempDir);
  const server = await startServer({
    PATH: `${binDir}:${process.env.PATH}`,
  });

  try {
    const initResponse = await server.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });

    assert.equal(initResponse.result.protocolVersion, '2024-11-05');
    assert.deepEqual(initResponse.result.capabilities, { tools: {} });

    server.notify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });

    const listResponse = await server.request({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });

    assert.ok(Array.isArray(listResponse.result.tools));
    assert.ok(listResponse.result.tools.length >= 20);
    assert.ok(
      listResponse.result.tools.some((tool) => tool.name === 'trekker_task_create')
    );
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('tool calls execute the trekker CLI with the expected arguments', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'trekker-codex-mcp-'));
  const { binDir } = await createFakeTrekker(tempDir);
  const server = await startServer({
    PATH: `${binDir}:${process.env.PATH}`,
    TREKKER_LOG_PATH: join(tempDir, 'logs', 'last-call.json'),
  });

  try {
    await server.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });

    const response = await server.request({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'trekker_task_create',
        arguments: {
          title: 'Ship plugin',
          priority: 2,
          tags: 'mcp,codex',
        },
      },
    });

    assert.equal(response.result.isError, undefined);

    const payload = JSON.parse(response.result.content[0].text);
    const cliCall = JSON.parse(payload.data);

    assert.deepEqual(cliCall.argv, [
      '--toon',
      'task',
      'create',
      '-t',
      'Ship plugin',
      '-p',
      '2',
      '--tags',
      'mcp,codex',
    ]);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('tool argument validation returns an MCP tool error result', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'trekker-codex-mcp-'));
  const { binDir } = await createFakeTrekker(tempDir);
  const server = await startServer({
    PATH: `${binDir}:${process.env.PATH}`,
  });

  try {
    await server.request({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });

    const response = await server.request({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'trekker_task_create',
        arguments: {
          priority: 'high',
        },
      },
    });

    assert.equal(response.result.isError, true);
    assert.match(response.result.content[0].text, /Missing required argument: title/);
    assert.match(response.result.content[0].text, /priority must be a number/);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
