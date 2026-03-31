import { runTrekker } from '../cli-runner.js';
import { jsonTextResult } from '../result.js';
import { numberField, objectSchema, stringField } from '../schema.js';

export function registerCommentTools(server) {
  server.registerTool(
    'trekker_comment_add',
    {
      title: 'Add Comment',
      description: 'Add a comment to a task',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
          agent: stringField('Agent name (who is adding the comment)'),
          content: stringField('Comment content'),
        },
        ['taskId', 'agent', 'content']
      ),
    },
    async ({ taskId, agent, content }) =>
      jsonTextResult(
        await runTrekker(['comment', 'add', taskId, '-a', agent, '-c', content])
      )
  );

  server.registerTool(
    'trekker_comment_list',
    {
      title: 'List Comments',
      description:
        'List comments on a task. Returns paginated results (default: 50 per page, newest first). Use page parameter to get older results.',
      inputSchema: objectSchema(
        {
          taskId: stringField('Task ID (e.g., TREK-1)'),
          limit: numberField('Results per page (default: 50)'),
          page: numberField('Page number (default: 1)'),
        },
        ['taskId']
      ),
    },
    async ({ taskId, limit, page }) => {
      const args = ['comment', 'list', taskId];
      if (limit !== undefined) args.push('--limit', String(limit));
      if (page !== undefined) args.push('--page', String(page));

      return jsonTextResult(await runTrekker(args));
    }
  );

  server.registerTool(
    'trekker_comment_update',
    {
      title: 'Update Comment',
      description: 'Update a comment',
      inputSchema: objectSchema(
        {
          commentId: stringField('Comment ID (e.g., CMT-1)'),
          content: stringField('New comment content'),
        },
        ['commentId', 'content']
      ),
    },
    async ({ commentId, content }) =>
      jsonTextResult(
        await runTrekker(['comment', 'update', commentId, '-c', content])
      )
  );

  server.registerTool(
    'trekker_comment_delete',
    {
      title: 'Delete Comment',
      description: 'Delete a comment',
      inputSchema: objectSchema(
        {
          commentId: stringField('Comment ID (e.g., CMT-1)'),
        },
        ['commentId']
      ),
    },
    async ({ commentId }) =>
      jsonTextResult(await runTrekker(['comment', 'delete', commentId]))
  );
}
