import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import {
  enumField,
  numberField,
  objectSchema,
  stringField,
} from '../schema.js';

const EPIC_STATUSES = ['todo', 'in_progress', 'completed', 'archived'];

export function registerEpicTools(server) {
  server.registerTool(
    'trekker_epic_create',
    {
      title: 'Create Epic',
      description: 'Create a new epic in trekker',
      inputSchema: objectSchema(
        {
          title: stringField('Epic title'),
          description: stringField('Epic description'),
          priority: numberField('Priority (0=critical, 5=someday)', {
            minimum: 0,
            maximum: 5,
          }),
          parentEpicId: stringField('Parent epic ID for nested epics'),
        },
        ['title']
      ),
    },
    async ({ title, description, priority, parentEpicId }) => {
      const args = ['epic', 'create', '-t', title];
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));
      if (parentEpicId) args.push('-e', parentEpicId);

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_epic_list',
    {
      title: 'List Epics',
      description:
        'List epics with optional filters. Returns paginated results (default: 50 per page, newest first). Use page parameter to get older results.',
      inputSchema: objectSchema({
        status: enumField(EPIC_STATUSES, 'Filter by status'),
        limit: numberField('Results per page (default: 50)'),
        page: numberField('Page number (default: 1)'),
      }),
    },
    async ({ status, limit, page }) => {
      const args = ['epic', 'list'];
      if (status) args.push('--status', status);
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_epic_show',
    {
      title: 'Show Epic',
      description: 'Show details of a specific epic',
      inputSchema: objectSchema(
        {
          epicId: stringField('Epic ID (e.g., EPIC-1)'),
        },
        ['epicId']
      ),
    },
    async ({ epicId }) =>
      jsonTextResult(await runTrekker(['epic', 'show', epicId]))
  );

  server.registerTool(
    'trekker_epic_update',
    {
      title: 'Update Epic',
      description: 'Update an existing epic',
      inputSchema: objectSchema(
        {
          epicId: stringField('Epic ID (e.g., EPIC-1)'),
          title: stringField('New title'),
          description: stringField('New description'),
          priority: numberField('New priority', {
            minimum: 0,
            maximum: 5,
          }),
          status: enumField(EPIC_STATUSES, 'New status'),
        },
        ['epicId']
      ),
    },
    async ({ epicId, title, description, priority, status }) => {
      const args = ['epic', 'update', epicId];
      if (title) args.push('-t', title);
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));
      if (status) args.push('-s', status);

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_epic_delete',
    {
      title: 'Delete Epic',
      description: 'Delete an epic',
      inputSchema: objectSchema(
        {
          epicId: stringField('Epic ID (e.g., EPIC-1)'),
        },
        ['epicId']
      ),
    },
    async ({ epicId }) =>
      jsonTextResult(await runTrekker(['epic', 'delete', epicId]))
  );
}
