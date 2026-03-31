import { createInterface } from 'node:readline';
import { errorTextResult } from './result.js';
import { validateArguments } from './validator.js';

const JSONRPC_VERSION = '2.0';
const SERVER_NOT_INITIALIZED = -32002;

export const SUPPORTED_PROTOCOL_VERSIONS = [
  '2025-11-25',
  '2025-06-18',
  '2024-11-05',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidId(value) {
  return typeof value === 'string' || typeof value === 'number' || value === null;
}

function successResponse(id, result) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    result,
  };
}

function errorResponse(id, code, message, data) {
  const error = { code, message };

  if (data !== undefined) {
    error.data = data;
  }

  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error,
  };
}

function normalizeToolResult(result) {
  if (
    isPlainObject(result) &&
    Array.isArray(result.content) &&
    result.content.every(
      (item) => isPlainObject(item) && typeof item.type === 'string'
    )
  ) {
    return result;
  }

  if (typeof result === 'string') {
    return {
      content: [{ type: 'text', text: result }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
}

export class MiniMcpServer {
  #name;
  #version;
  #instructions;
  #tools = new Map();
  #initialized = false;

  constructor({ name, version, instructions }) {
    this.#name = name;
    this.#version = version;
    this.#instructions = instructions;
  }

  registerTool(name, definition, handler) {
    if (this.#tools.has(name)) {
      throw new Error(`Tool already registered: ${name}`);
    }

    this.#tools.set(name, {
      name,
      definition,
      handler,
    });
  }

  async listen({ input = process.stdin, output = process.stdout } = {}) {
    const lines = createInterface({
      input,
      crlfDelay: Infinity,
    });

    for await (const line of lines) {
      const payload = line.trim();
      if (!payload) {
        continue;
      }

      let message;
      try {
        message = JSON.parse(payload);
      } catch {
        this.#write(output, errorResponse(null, -32700, 'Parse error'));
        continue;
      }

      const response = await this.handleMessage(message);
      if (response !== null) {
        this.#write(output, response);
      }
    }
  }

  async handleMessage(message) {
    if (Array.isArray(message)) {
      if (message.length === 0) {
        return [errorResponse(null, -32600, 'Invalid Request')];
      }

      const responses = [];
      for (const entry of message) {
        const response = await this.#handleSingleMessage(entry);
        if (response !== null) {
          responses.push(response);
        }
      }

      return responses.length > 0 ? responses : null;
    }

    return this.#handleSingleMessage(message);
  }

  async #handleSingleMessage(message) {
    if (!isPlainObject(message) || message.jsonrpc !== JSONRPC_VERSION) {
      return errorResponse(null, -32600, 'Invalid Request');
    }

    if (typeof message.method !== 'string') {
      return errorResponse(
        isValidId(message.id) ? message.id : null,
        -32600,
        'Invalid Request'
      );
    }

    const isRequest = Object.prototype.hasOwnProperty.call(message, 'id');
    if (!isRequest) {
      this.#handleNotification(message.method);
      return null;
    }

    if (!isValidId(message.id)) {
      return errorResponse(null, -32600, 'Invalid Request');
    }

    return this.#handleRequest(message.id, message.method, message.params);
  }

  #handleNotification(method) {
    if (method === 'notifications/initialized') {
      return;
    }
  }

  async #handleRequest(id, method, params) {
    switch (method) {
      case 'initialize':
        return this.#handleInitialize(id, params);
      case 'ping':
        return successResponse(id, {});
      case 'tools/list':
        return this.#handleToolsList(id);
      case 'tools/call':
        return this.#handleToolCall(id, params);
      default:
        if (!this.#initialized) {
          return errorResponse(
            id,
            SERVER_NOT_INITIALIZED,
            'Server not initialized'
          );
        }
        return errorResponse(id, -32601, 'Method not found');
    }
  }

  #handleInitialize(id, params) {
    if (!isPlainObject(params) || typeof params.protocolVersion !== 'string') {
      return errorResponse(id, -32602, 'Invalid initialize params');
    }

    const requestedVersion = params.protocolVersion;
    const negotiatedVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : SUPPORTED_PROTOCOL_VERSIONS[0];

    this.#initialized = true;

    const result = {
      protocolVersion: negotiatedVersion,
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: this.#name,
        version: this.#version,
      },
    };

    if (this.#instructions) {
      result.instructions = this.#instructions;
    }

    return successResponse(id, result);
  }

  #handleToolsList(id) {
    if (!this.#initialized) {
      return errorResponse(id, SERVER_NOT_INITIALIZED, 'Server not initialized');
    }

    const tools = Array.from(this.#tools.values()).map(({ name, definition }) => ({
      name,
      ...definition,
    }));

    return successResponse(id, { tools });
  }

  async #handleToolCall(id, params) {
    if (!this.#initialized) {
      return errorResponse(id, SERVER_NOT_INITIALIZED, 'Server not initialized');
    }

    if (!isPlainObject(params) || typeof params.name !== 'string') {
      return errorResponse(id, -32602, 'Invalid tool call params');
    }

    if (
      params.arguments !== undefined &&
      !isPlainObject(params.arguments)
    ) {
      return errorResponse(id, -32602, 'Tool arguments must be an object');
    }

    const tool = this.#tools.get(params.name);
    if (!tool) {
      return errorResponse(id, -32602, 'Unknown tool', { name: params.name });
    }

    const validation = validateArguments(tool.definition.inputSchema, params.arguments);
    if (!validation.ok) {
      return successResponse(
        id,
        errorTextResult(validation.errors.join('\n'))
      );
    }

    try {
      const result = await tool.handler(validation.value);
      return successResponse(id, normalizeToolResult(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tool call failed';
      return successResponse(id, errorTextResult(message));
    }
  }

  #write(output, message) {
    output.write(`${JSON.stringify(message)}\n`);
  }
}
