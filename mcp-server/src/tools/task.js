import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import {
  booleanField,
  enumField,
  numberField,
  objectSchema,
  stringField,
} from '../schema.js';

const TASK_STATUSES = [
  'todo',
  'in_progress',
  'completed',
  'wont_fix',
  'archived',
];

export function registerTaskTools(server) {
  server.registerTool(
    'trekker_task_create',
    {
      title: 'Create Task',
      description: 'Create a new task in trekker',
      inputSchema: objectSchema(
        {
          title: stringField('Task title'),
          description: stringField('Task description'),
          priority: numberField('Priority (0=critical, 5=someday)', {
            minimum: 0,
            maximum: 5,
          }),
          epicId: stringField('Epic ID to assign task to (e.g., EPIC-1)'),
          tags: stringField('Comma-separated tags'),
        },
        ['title']
      ),
    },
    async ({ title, description, priority, epicId, tags }) => {
      const args = ['task', 'create', '-t', title];
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));
      if (epicId) args.push('-e', epicId);
      if (tags) args.push('--tags', tags);

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_task_list',
    {
      title: 'List Tasks',
      description:
        'List tasks with optional filters. Returns paginated results (default: 50 per page, newest first). Use page parameter to get older results.',
      inputSchema: objectSchema({
        status: enumField(TASK_STATUSES, 'Filter by status'),
        epicId: stringField('Filter by epic ID'),
        limit: numberField('Results per page (default: 50)'),
        page: numberField('Page number (default: 1)'),
      }),
    },
    async ({ status, epicId, limit, page }) => {
      const args = ['task', 'list'];
      if (status) args.push('--status', status);
      if (epicId) args.push('--epic', epicId);
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_task_show',
    {
      title: 'Show Task',
      description: 'Show details of a specific task',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
        },
        ['taskId']
      ),
    },
    async ({ taskId }) =>
      jsonTextResult(await runTrekker(['task', 'show', taskId]))
  );

  server.registerTool(
    'trekker_task_update',
    {
      title: 'Update Task',
      description: 'Update an existing task',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
          title: stringField('New title'),
          description: stringField('New description'),
          priority: numberField('New priority', {
            minimum: 0,
            maximum: 5,
          }),
          status: enumField(TASK_STATUSES, 'New status'),
          epicId: stringField('New epic ID'),
          tags: stringField('New tags (comma-separated)'),
          removeEpic: booleanField('Remove task from epic'),
        },
        ['taskId']
      ),
    },
    async ({
      taskId,
      title,
      description,
      priority,
      status,
      epicId,
      tags,
      removeEpic,
    }) => {
      const args = ['task', 'update', taskId];
      if (title) args.push('-t', title);
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));
      if (status) args.push('-s', status);
      if (epicId) args.push('-e', epicId);
      if (tags) args.push('--tags', tags);
      if (removeEpic) args.push('--no-epic');

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_task_delete',
    {
      title: 'Delete Task',
      description: 'Delete a task',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
        },
        ['taskId']
      ),
    },
    async ({ taskId }) =>
      jsonTextResult(await runTrekker(['task', 'delete', taskId]))
  );
}
