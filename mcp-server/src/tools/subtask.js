import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import {
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

export function registerSubtaskTools(server) {
  server.registerTool(
    'trekker_subtask_create',
    {
      title: 'Create Subtask',
      description: 'Create a subtask under an existing task',
      inputSchema: objectSchema(
        {
          parentTaskId: stringField('Parent task ID (e.g., TREK-1)'),
          title: stringField('Subtask title'),
          description: stringField('Subtask description'),
          priority: numberField('Priority (0=critical, 5=someday)', {
            minimum: 0,
            maximum: 5,
          }),
        },
        ['parentTaskId', 'title']
      ),
    },
    async ({ parentTaskId, title, description, priority }) => {
      const args = ['subtask', 'create', parentTaskId, '-t', title];
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_subtask_list',
    {
      title: 'List Subtasks',
      description:
        'List subtasks of a parent task. Returns paginated results (default: 50 per page, newest first). Use page parameter to get older results.',
      inputSchema: objectSchema(
        {
          parentTaskId: stringField('Parent task ID (e.g., TREK-1)'),
          limit: numberField('Results per page (default: 50)'),
          page: numberField('Page number (default: 1)'),
        },
        ['parentTaskId']
      ),
    },
    async ({ parentTaskId, limit, page }) => {
      const args = ['subtask', 'list', parentTaskId];
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_subtask_update',
    {
      title: 'Update Subtask',
      description: 'Update an existing subtask',
      inputSchema: objectSchema(
        {
          subtaskId: stringField('Subtask ID (e.g., TREK-2)'),
          title: stringField('New title'),
          description: stringField('New description'),
          priority: numberField('New priority', {
            minimum: 0,
            maximum: 5,
          }),
          status: enumField(TASK_STATUSES, 'New status'),
        },
        ['subtaskId']
      ),
    },
    async ({ subtaskId, title, description, priority, status }) => {
      const args = ['subtask', 'update', subtaskId];
      if (title) args.push('-t', title);
      if (description) args.push('-d', description);
      if (priority !== undefined) args.push('-p', String(priority));
      if (status) args.push('-s', status);

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_subtask_delete',
    {
      title: 'Delete Subtask',
      description: 'Delete a subtask',
      inputSchema: objectSchema(
        {
          subtaskId: stringField('Subtask ID (e.g., TREK-2)'),
        },
        ['subtaskId']
      ),
    },
    async ({ subtaskId }) =>
      jsonTextResult(await runTrekker(['subtask', 'delete', subtaskId]))
  );
}
