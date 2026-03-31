import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import { numberField, objectSchema } from '../schema.js';

export function registerReadyTools(server) {
  server.registerTool(
    'trekker_task_ready',
    {
      title: 'Ready Tasks',
      description:
        'Show tasks that are ready to work on (unblocked, todo) with their downstream dependents. Returns paginated results (default: 50 per page). Use page parameter to get older results.',
      inputSchema: objectSchema({
        limit: numberField('Results per page (default: 50)'),
        page: numberField('Page number (default: 1)'),
      }),
    },
    async ({ limit, page }) => {
      const args = ['ready'];
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));

      return jsonTextResult(await runTrekker(args));
    }
  );
}
