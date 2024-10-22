import { cluster, parallel } from 'radash';
import { setTimeout } from 'timers/promises';

import type { BatchProcessOptions } from './BatchProcessOptions';

/**
 * Processes items asynchronously in a throttled, batched operation. If `unprocessedItemExtractor` is provided, extracts & retries unprocessed items up to `maxRetries`.
 *
 * @param items - Items to process in batch.
 * @param options - {@link BatchProcessOptions | `BatchProcessOptions`} object.
 *
 * @typeParam Item - Input item type.
 * @typeParam Output - Output type.
 *
 * @returns Output array.
 */
export const batchProcess = async <Item, Output>(
  items: Item[],
  options: BatchProcessOptions<Item, Output>,
): Promise<Output[]> => {
  // Resolve batch options.
  const {
    batchHandler,
    batchSize = 25,
    delayIncrement = 100,
    logger = console,
    maxRetries = 5,
    throttle = 10,
    unprocessedItemExtractor,
  } = options;

  const batches = cluster(items, batchSize);
  const outputs: Output[] = [];

  await parallel(throttle, batches, async (batch) => {
    let delay = 0;
    let retry = 0;

    while (batch.length) {
      if (delay) await setTimeout(delay);

      const output = await batchHandler(batch);

      logger.debug('executed batch', {
        batch,
        delay,
        retry,
        output,
      });

      outputs.push(output);

      batch = unprocessedItemExtractor?.(output) ?? [];

      if (batch.length) {
        if (retry === maxRetries) throw new Error('max retries exceeded');

        delay = delay ? delay * 2 : delayIncrement;
        retry++;
      }
    }
  });

  return outputs;
};
