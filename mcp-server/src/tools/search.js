import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import {
  booleanField,
  numberField,
  objectSchema,
  stringField,
} from '../schema.js';

export function registerSearchTools(server) {
  server.registerTool(
    'trekker_search',
    {
      title: 'Search',
      description:
        'Search tasks, epics, subtasks, and comments using FTS5 full-text search',
      inputSchema: objectSchema(
        {
          query: stringField('Search query (supports FTS5 syntax)'),
          type: stringField(
            'Filter by type: epic,task,subtask,comment (comma-separated)'
          ),
          status: stringField('Filter by status'),
          limit: numberField('Results per page (default: 20)'),
          page: numberField('Page number (default: 1)'),
          rebuildIndex: booleanField(
            'Rebuild the search index before searching'
          ),
        },
        ['query']
      ),
    },
    async ({ query, type, status, limit, page, rebuildIndex }) => {
      const args = ['search', query];
      if (type) args.push('--type', type);
      if (status) args.push('--status', status);
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));
      if (rebuildIndex) args.push('--rebuild-index');

      return jsonTextResult(await runTrekker(args));
    }
  );
}
