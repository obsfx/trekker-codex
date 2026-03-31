import { runTrekker, runTrekkerText } from '../cli-runner.js';
import { errorTextResult, jsonTextResult, textResult } from '../result.js';
import { booleanField, objectSchema } from '../schema.js';

export function registerSystemTools(server) {
  server.registerTool(
    'trekker_init',
    {
      title: 'Initialize Trekker',
      description: 'Initialize trekker in the current directory',
      inputSchema: objectSchema(),
    },
    async () => jsonTextResult(await runTrekker(['init']))
  );

  server.registerTool(
    'trekker_quickstart',
    {
      title: 'Quickstart Guide',
      description: 'Get trekker quickstart guide and workflow reference',
      inputSchema: objectSchema({
        toon: booleanField('Use token-efficient output format'),
      }),
    },
    async ({ toon }) => {
      const result = await runTrekkerText(['quickstart'], {
        toon: toon ?? true,
      });

      if (!result.success) {
        return errorTextResult(result.error ?? 'No output');
      }

      return textResult(result.data ?? 'No output');
    }
  );

  server.registerTool(
    'trekker_wipe',
    {
      title: 'Wipe Database',
      description: 'Remove all trekker data (use with caution)',
      inputSchema: objectSchema(
        {
          confirm: booleanField('Must be true to confirm deletion'),
        },
        ['confirm']
      ),
    },
    async ({ confirm }) => {
      if (!confirm) {
        return errorTextResult('Wipe cancelled: confirm must be true');
      }

      return jsonTextResult(await runTrekker(['wipe', '-y']));
    }
  );
}
