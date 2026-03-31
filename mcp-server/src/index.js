#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MiniMcpServer } from './mcp-server.js';
import { registerCommentTools } from './tools/comment.js';
import { registerDependencyTools } from './tools/dependency.js';
import { registerEpicTools } from './tools/epic.js';
import { registerReadyTools } from './tools/ready.js';
import { registerSearchTools } from './tools/search.js';
import { registerSubtaskTools } from './tools/subtask.js';
import { registerSystemTools } from './tools/system.js';
import { registerTaskTools } from './tools/task.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

export function createServer() {
  const server = new MiniMcpServer({
    name: 'trekker-mcp',
    version: pkg.version,
  });

  registerTaskTools(server);
  registerEpicTools(server);
  registerSubtaskTools(server);
  registerCommentTools(server);
  registerDependencyTools(server);
  registerSystemTools(server);
  registerSearchTools(server);
  registerReadyTools(server);

  return server;
}

async function main() {
  const server = createServer();
  await server.listen();
}

const isEntryPoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error('Failed to start trekker-mcp server:', error);
    process.exit(1);
  });
}
