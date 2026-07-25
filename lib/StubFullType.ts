import type { Stub } from "./types/Stub.ts";
import type { FilterAndMapMethodsToUnknown } from "./types/FilterAndMapMethodsToUnknown.ts";
import type { Stubbed } from "./types/Stubbed.ts";
import type { MethodKeys } from "./types/MethodKeys.ts";
import type { AnyFunctions } from "./types/AnyFunctions.ts";

/**
 * Provides a full stub implementation for a given type.
 * It allows for overriding methods with custom functions and interacting with the stub catalog.
 *
 * 2 Primary Usage Patterns
 * 1. No Attributes
 * ```ts
 *    type A = {methodA: ()=>void}
 *    const stubA = new StubFullType<A>(["methodA"]), stubAToo = StubFullType.create<A>(["methodA"])
 * ```
 * 2. Attributes
 * ```ts
 *    type A = {methodA: ()=>void}
 *    type B = {b: A, methodB: ()=>void}
 *    class StubbedB extends StubFullType<B> {
 *      b: Stubbed<A>;
 *      constructor() {
 *        super(["methodB"]);
 *        this.b = StubFullType.create<A>(["methodA"]);
 *      }
 *    }
 *    const stubB = new StubbedB()
 * ```
 */
export class StubFullType<T> implements Stubbed<T> {
  /**
   * Returns a shallow copy of the stub catalog.
   * Each entry contains arguments, output values, and call counters for individual methods.
   */
  public get stub(): Stub<T> {
    return Object.fromEntries(
      Object.entries(this._stub).map(([key, value]) => {
        const stubValue = value as Stub<T>[keyof T];
        return [
          key,
          {
            ...stubValue,
            args: [...stubValue.args],
            outputs: [...stubValue.outputs],
          },
        ];
      }),
    ) as Stub<T>;
  }
  /**
   * Returns the instance itself, cast as the type that gets stubbed.
   */
  get this(): T {
    return this as unknown as T;
  }
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
    fn?: AnyFunctions,
  ): void {
    this[key] = fn as this[K] ?? ((...args: unknown[]) => {
      return this.fakeProcess(args, key);
    }) as this[K];
  }
  /**
   * Resets the stubs' internal states.
   * True reset is needed if there is a permanent output.
   *
   * @param trueReset - Whether to perform a "true reset".
   */
  reset(trueReset = false) {
    Object.keys(this._stub).forEach((key) => {
      const f = key as keyof T;
      if (this._stub[f].permanent && !trueReset) {
        return;
      }
      this._stub[f] = this.createInitialState();
    });
  }
  /**
   * Registers an output for a stubbed method.
   * Each call to the method will return one of the registered outputs in order.
   * Keys can be marked as permanent, in which case the first output will persist indefinitely.
   * Once a method is marked as permanent, it will also get ignored by non-true resets.
   * @param key - The method key for which the output is registered.
   * @param output - The output to register.
   * @param permanent - Whether the output is permanent.
   */
  registerOutput<K extends MethodKeys<T>, O>(
    key: K,
    output?: O,
    permanent = false,
  ) {
    const stub = this._stub[key] as Stub<T>[K];
    stub.outputs.push(output);
    this._stub[key].permanent = permanent;
  }
  /**
   * Returns the number of times a particular method has been called.
   *
   * @param key - The method key for which the counter is queried.
   * @returns The number of times the method has been called.
   */
  counter(key: keyof T): number {
    return this._stub[key].counter;
  }
  /**
   * Retrieves the arguments passed on the last call to a particular method.
   *
   * @param key - The method key for which the last arguments are retrieved.
   * @returns An array of the arguments passed on the last call.
   */
  lastArgs<K extends keyof T>(key: K): unknown[] {
    return [...this._stub[key].args[this._stub[key].counter - 1]];
  }
  /**
   * Protected constructor for initializing stubs with given method names.
   * Initializes stubs for the specified method keys and populates the stub catalog.
   *
   * @param _methodNames - Array of method keys to initialize stubs for.
   * @param _stub - Initial stub state, defaulting to an empty stub.
   */
  /**
   * Static factory method for creating an instance of `StubFullType`.
   *
   * Really useful if there are just methods to stub.
   *
   * If you need attributes, extend from StubFullType.
   * @param methodNames - Array of method names to create stub entries for.
   * @returns A new instance of `StubFullType`.
   */
  static _create<T>(
    methodNames?: (keyof FilterAndMapMethodsToUnknown<T>)[],
  ): Stubbed<T> {
    return new StubFullType(methodNames);
  }
  protected constructor(
    private readonly _methodNames: (MethodKeys<T>)[] = [],
    private readonly _stub: Stub<T> = {} as Stub<T>,
  ) {
    this._methodNames.forEach((e) => this.initializeStub(e));
  }
  /**
   * Initializes the stub entry for a given method key.
   * Can optionally set a custom function as the stub's behavior.
   *
   * @param key - The method key to initialize.
   * @param fn - Optional custom function for overriding the stub behavior.
   */
  protected initializeStub<K extends MethodKeys<T>>(
    key: K,
    fn?: AnyFunctions,
  ) {
    this._stub[key] = this.createInitialState<K>();
    this.overwriteMethod(key, fn);
  }
  /**
   * Simulates the behavior of a method, intercepting calls, saving arguments,
   * incrementing counters, and returning pre-registered outputs.
   *
   * Errors will be thrown properly.
   * @param args - The arguments passed to the method.
   * @param method - The stubbed method being invoked.
   * @returns The pre-registered output for the stubbed method.
   */
  protected fakeProcess(
    args: unknown[],
    method: keyof T,
  ): unknown {
    this.saveArgs(args, method);
    this.incrementCounter(method);
    const nextOutput = this.nextOutput(method);
    if (nextOutput instanceof Error) throw nextOutput;
    return nextOutput;
  }
  private nextOutput(
    key: keyof T,
  ): unknown {
    return this._stub[key].permanent
      ? this._stub[key].outputs[0]
      : this._stub[key].outputs.shift();
  }

  private incrementCounter(key: keyof T) {
    this._stub[key].counter = (this._stub[key].counter) + 1;
  }

  private saveArgs(
    args: unknown[],
    method: keyof T,
  ) {
    this._stub[method].args.push(args);
  }
  private createInitialState<K extends MethodKeys<T>>(): Stub<T>[K] {
    return {
      counter: 0,
      outputs: [],
      args: [],
      permanent: false,
    } as unknown as Stub<T>[K];
  }
}
