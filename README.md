# batch-process

**In the real world, most async operations against large data sets need to be batched and throttled.**

The [`batchProcess`](https://docs.karmanivero.us/batch-process/functions/batchProcess.html) function provides a simple, configurable utility for batching and throttling async operations.

`batchProcess` logs the progress of batch operations to `console` or to an injected logging dependency.

<!-- TYPEDOC_EXCLUDE -->

> [API Documentation](https://docs.karmanivero.us/batch-process/) • [CHANGELOG](https://github.com/karmaniverous/batch-process/tree/main/CHANGELOG.md)

<!-- /TYPEDOC_EXCLUDE -->

## Installation

```bash
npm i @karmaniverous/batch-process
```

## Default Use Case

```ts
import { batchProcess } from '@karmaniverous/batch-process';

type Item = Record<string, unknown>; // Your data type.

// Say you have a function processBatch that processes a batch of items, for
// example writing them to a database. Maybe not every item is processed
// successfully, so the function returns a count of processed items and an
// array of unprocessed ones.
interface AsyncResult {
  processed: number;
  unprocessed: Item[];
}

const processBatch = async (items: Item[]): AsyncResult =>
  doSomethingAsync(items);

// Let's write a function that extracts any unprocessed items from an
// AsyncResult.
const unprocessedItemExtractor = ({ unprocessed }: AsyncResult) => unprocessed;

// Here's a bunch of items to process.
const items: Item[] = [
  ... // Your items here.
];

// Now you can asynchronously process a bunch of items in throttled sets of
// parallel batches!

// batchProcess will...
// - break items into batches of no more than `batchSize` items, and
// - process up to `throttle` batches in parallel, and
// - write a debug log message for each batch attempted, and
// - wait `delayIncrement` ms with exponential backoff to retry failed batches, and
// - throw an exception after `maxRetries` failed retries, and
// - return an array of AsyncResults generated during batch processing.
const results = await batchProcess(items, {
  processBatch,
  unprocessedItemExtractor,
  // see other options below
});
```

## batchProcess Options

The `options` parameter has the following properties:

Default Batchable options are:

| Option                     | Type                                     | Default     | Description                                                                                                         |
| -------------------------- | ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `batchHandler`             | `(items: Item[]) => Promise<Output>`     | _required_  | Async function to process an individual batch.                                                                      |
| `batchSize`                | `number`                                 | `25`        | The number of items to process in each batch.                                                                       |
| `delayIncrement`           | `number`                                 | `100`       | The number of milliseconds to wait before retrying a failed batch, with 2x exponential backoff.                     |
| `logger`                   | `Pick<Console, 'debug'>`                 | `console`   | Injected logger object. Must support `debug` method.                                                                |
| `maxRetries`               | `number`                                 | `5`         | The number of times to retry a failed batch before throwing an exception.                                           |
| `throttle`                 | `number`                                 | `10`        | The number of batches to process in parallel.                                                                       |
| `unprocessedItemExtractor` | `(output: Output) => Item[] ⏐ undefined` | `undefined` | Function to extract unprocessed items from an individual batch output. If `undefined` no retries will be attempted. |

---

Built for you with ❤️ on Bali! Find more great tools & templates on [my GitHub Profile](https://github.com/karmaniverous).
