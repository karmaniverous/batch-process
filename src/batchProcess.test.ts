import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { setTimeout } from 'timers/promises';

import { batchProcess } from './batchProcess';

use(chaiAsPromised);

interface Item {
  maxRetries: number;
  retry?: number;
}

interface BatchOutput {
  processed: number;
  unprocessed: Item[];
}

const batchHandler = async (items: Item[]): Promise<BatchOutput> => {
  await setTimeout(100);

  return items.reduce<BatchOutput>(
    (result, { maxRetries, retry = 0 }) => ({
      processed: retry === maxRetries ? result.processed + 1 : result.processed,
      unprocessed:
        retry === maxRetries
          ? result.unprocessed
          : [...result.unprocessed, { maxRetries, retry: retry + 1 }],
    }),
    { processed: 0, unprocessed: [] },
  );
};

const unprocessedItemExtractor = (output: BatchOutput): Item[] =>
  output.unprocessed;

describe('batchProcess', function () {
  it('should process a single batch', async function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 0 },
      { maxRetries: 0 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      unprocessedItemExtractor,
    });

    expect(output).to.have.length(1);
    expect(output).to.have.deep.members([{ processed: 3, unprocessed: [] }]);
  });

  it('should process a single batch with retry', async function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 1 },
      { maxRetries: 0 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      unprocessedItemExtractor,
    });

    expect(output).to.have.length(2);
    expect(output).to.have.deep.members([
      { processed: 2, unprocessed: [{ maxRetries: 1, retry: 1 }] },
      { processed: 1, unprocessed: [] },
    ]);
  });

  it('should fail single batch exceeding max retries', function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 4 },
      { maxRetries: 0 },
    ];

    expect(
      batchProcess(items, { batchHandler, unprocessedItemExtractor }),
    ).to.be.eventually.rejectedWith('max retries exceeded');
  });

  it('should process many batches', async function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 0 },
      { maxRetries: 0 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      batchSize: 2,
      unprocessedItemExtractor,
    });

    expect(output).to.have.length(2);
    expect(output).to.have.deep.members([
      { processed: 2, unprocessed: [] },
      { processed: 1, unprocessed: [] },
    ]);
  });

  it('should process many batches with retry', async function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 0 },
      { maxRetries: 1 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      batchSize: 2,
      unprocessedItemExtractor,
    });

    expect(output).to.have.length(3);
    expect(output).to.have.deep.members([
      { processed: 2, unprocessed: [] },
      { processed: 0, unprocessed: [{ maxRetries: 1, retry: 1 }] },
      { processed: 1, unprocessed: [] },
    ]);
  });

  it('should process many batches with retry & throttling', async function () {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 0 },
      { maxRetries: 1 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      batchSize: 2,
      throttle: 1,
      unprocessedItemExtractor,
    });

    expect(output).to.have.length(3);
    expect(output).to.have.deep.members([
      { processed: 2, unprocessed: [] },
      { processed: 0, unprocessed: [{ maxRetries: 1, retry: 1 }] },
      { processed: 1, unprocessed: [] },
    ]);
  });
});
