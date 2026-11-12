// Type stand-ins for the offline check (the real packages are used with npm).
declare module 'zustand' {
  type SetState<T> = (partial: Partial<T> | ((s: T) => Partial<T>), replace?: boolean) => void;
  type GetState<T> = () => T;
  type Api<T> = { getState: GetState<T>; setState: SetState<T>; subscribe: (l: (s: T, prev: T) => void) => () => void };
  type UseBound<T> = (<U = T>(selector?: (s: T) => U) => U) & Api<T>;
  export function create<T>(): (init: (set: SetState<T>, get: GetState<T>, api: Api<T>) => T) => UseBound<T>;
}
declare module 'vitest' {
  type M = {
    toBe(e: unknown): void; toEqual(e: unknown): void; toBeDefined(): void; toBeUndefined(): void; toBeNull(): void;
    toBeTruthy(): void; toBeFalsy(): void; toBeGreaterThan(n: number): void; toBeGreaterThanOrEqual(n: number): void;
    toBeLessThan(n: number): void; toBeLessThanOrEqual(n: number): void; toContain(e: unknown): void;
    toHaveLength(n: number): void; toMatch(r: RegExp | string): void; toThrow(): void;
  };
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => unknown): void;
  export const test: typeof it;
  export function expect(actual: unknown): M & { not: M };
}
declare module '*.svg' { const s: string; export default s; }
declare module '*.css';
