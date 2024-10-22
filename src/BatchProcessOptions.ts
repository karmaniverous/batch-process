/**
 * Options for the {@link batchProcess | `batchProcess`} function.
 */
export interface BatchProcessOptions<Item, Output> {
  /** Async function to process an individual batch. */
  batchHandler: (items: Item[]) => Promise<Output>;

  /** Batch size. Default: `25` */
  batchSize?: number;

  /** Delay increment in ms for retry operations. Doubles on each retry. Default: `100` */
  delayIncrement?: number;

  /** Injected logger object. Must support `debug` method. Default: `console` */
  logger?: Pick<Console, 'debug'>;

  /** Max retries for retry operations. Default: `5` */
  maxRetries?: number;

  /** Throttle for parallel operations. Default: `10` */
  throttle?: number;

  /** Function to extract unprocessed items from an individual batch output. If `undefined` no retries will be attempted. */
  unprocessedItemExtractor?: (output: Output) => Item[] | undefined;
}
