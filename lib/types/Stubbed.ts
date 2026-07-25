import type { Stub } from "./Stub.ts";
import type { MethodKeys } from "./MethodKeys.ts";

/**
 * type that represents a stubbed object.
 */
export type Stubbed<T> = {
  /**
   * Returns a shallow copy of the stub catalog.
   * Each entry contains arguments, output values, and call counters for individual methods.
   */
  readonly stub: Stub<T>;
  /**
   * Returns the instance itself, cast as the type that gets stubbed.
   */
  readonly this: T;
  /**
   * Resets the stubs' internal states.
   * True reset is needed if there is a permanent output.
   *
   * @param trueReset - Whether to perform a "true reset".
   */
  reset(trueReset?: true): void;
  /**
   * Registers an output for a stubbed method.
   * Each call to the method will return one of the registered outputs in order.
   * Methods can be marked as permanent, in which case the first output will persist indefinitely.
   * Once a method is marked as permanent, it will also get ignored by non-true resets.
   * If an output is an error, the default fakeProcess will throw it properly.
   * @param key - The method key for which the output is registered.
   * @param output - The output to register.
   * @param permanent - Whether the output is permanent.
   */
  registerOutput<K extends MethodKeys<T>, O>(
    key: K,
    output?: O,
    permanent?: true,
  ): void;
  /**
   * Returns the number of times a particular method has been called.
   *
   * @param key - The method key for which the counter is queried.
   * @returns The number of times the method has been called.
   */
  counter(key: MethodKeys<T>): number;
  /**
   * Retrieves the arguments passed on the last call to a particular method.
   *
   * @param key - The method key for which the last arguments are retrieved.
   * @returns An array of the arguments passed on the last call.
   */
  lastArgs<K extends MethodKeys<T>>(key: K): unknown[];
  /**
   * Overrides the implementation of a method with a custom function.
   * If no function is provided, a default behavior is generated that interacts with the stub catalog.
   * a standard fakeProcess
   * - adds the arguments to a list
   * - adds to the counter
   * - returns the first output and deletes it if the method is not marked permanent
   * @param key - The method key to override.
   * @param fn - The custom function to use as the method implementation.
   */
  overwriteMethod<K extends MethodKeys<T>>(
    key: K,
    fn?: (...args: unknown[]) => unknown,
  ): void;
};
