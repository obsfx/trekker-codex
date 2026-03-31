import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import { objectSchema, stringField } from '../schema.js';

export function registerDependencyTools(server) {
  server.registerTool(
    'trekker_dep_add',
    {
      title: 'Add Dependency',
      description:
        'Add a dependency between tasks (taskId depends on dependsOnTaskId)',
      inputSchema: objectSchema(
        {
          taskId: stringField(
            'Task ID that has the dependency (e.g., TREK-2)'
          ),
          dependsOnTaskId: stringField(
            'Task ID that must be completed first (e.g., TREK-1)'
          ),
        },
        ['taskId', 'dependsOnTaskId']
      ),
    },
    async ({ taskId, dependsOnTaskId }) =>
      jsonTextResult(await runTrekker(['dep', 'add', taskId, dependsOnTaskId]))
  );

  server.registerTool(
    'trekker_dep_remove',
    {
      title: 'Remove Dependency',
      description: 'Remove a dependency between tasks',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-2)'),
          dependsOnTaskId: stringField(
            'Task ID to remove from dependencies (e.g., TREK-1)'
          ),
        },
        ['taskId', 'dependsOnTaskId']
      ),
    },
    async ({ taskId, dependsOnTaskId }) =>
      jsonTextResult(
        await runTrekker(['dep', 'remove', taskId, dependsOnTaskId])
      )
  );

  server.registerTool(
    'trekker_dep_list',
    {
      title: 'List Dependencies',
      description: 'List dependencies for a task',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
        },
        ['taskId']
      ),
    },
    async ({ taskId }) =>
      jsonTextResult(await runTrekker(['dep', 'list', taskId]))
  );
}
