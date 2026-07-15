/** @module batchProcess tests */

import { setTimeout } from 'timers/promises';
import { describe, expect, it } from 'vitest';

import { batchProcess } from './batchProcess';

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

describe('batchProcess', () => {
  it('should process a single batch', async () => {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 0 },
      { maxRetries: 0 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      unprocessedItemExtractor,
    });

    expect(output).toHaveLength(1);
    expect(output).toEqual(
      expect.arrayContaining([{ processed: 3, unprocessed: [] }]),
    );
  });

  it('should process a single batch with retry', async () => {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 1 },
      { maxRetries: 0 },
    ];

    const output = await batchProcess(items, {
      batchHandler,
      unprocessedItemExtractor,
    });

    expect(output).toHaveLength(2);
    expect(output).toEqual(
      expect.arrayContaining([
        { processed: 2, unprocessed: [{ maxRetries: 1, retry: 1 }] },
        { processed: 1, unprocessed: [] },
      ]),
    );
  });

  it('should fail single batch exceeding max retries', async () => {
    const items: Item[] = [
      { maxRetries: 0 },
      { maxRetries: 4 },
      { maxRetries: 0 },
    ];

    await expect(
      batchProcess(items, {
        batchHandler,
        maxRetries: 3,
        unprocessedItemExtractor,
      }),
    ).rejects.toThrow();
  });

  it('should process many batches', async () => {
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

    expect(output).toHaveLength(2);
    expect(output).toEqual(
      expect.arrayContaining([
        { processed: 2, unprocessed: [] },
        { processed: 1, unprocessed: [] },
      ]),
    );
  });

  it('should process many batches with retry', async () => {
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

    expect(output).toHaveLength(3);
    expect(output).toEqual(
      expect.arrayContaining([
        { processed: 2, unprocessed: [] },
        { processed: 0, unprocessed: [{ maxRetries: 1, retry: 1 }] },
        { processed: 1, unprocessed: [] },
      ]),
    );
  });

  it('should process many batches with retry & throttling', async () => {
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

    expect(output).toHaveLength(3);
    expect(output).toEqual(
      expect.arrayContaining([
        { processed: 2, unprocessed: [] },
        { processed: 0, unprocessed: [{ maxRetries: 1, retry: 1 }] },
        { processed: 1, unprocessed: [] },
      ]),
    );
  });
});
