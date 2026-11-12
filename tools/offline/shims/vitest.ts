// Stand-in for vitest (offline test runs only): describe / it / expect with the matchers the suite uses.
type Test = { name: string; fn: () => unknown };
const tests: Test[] = [];
const stack: string[] = [];
export function describe(name: string, fn: () => void) {
  stack.push(name);
  try { fn(); } finally { stack.pop(); }
}
export function it(name: string, fn: () => unknown) {
  tests.push({ name: [...stack, name].join(' › '), fn });
}
export const test = it;
const show = (v: unknown) => {
  try { return typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v)?.slice(0, 200) ?? String(v); } catch { return String(v); }
};
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object).filter((k) => (a as any)[k] !== undefined);
  const kb = Object.keys(b as object).filter((k) => (b as any)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual((a as any)[k], (b as any)[k]));
}
function matchers(actual: any, negate: boolean) {
  const check = (pass: boolean, msg: string) => {
    if (pass === negate) throw new Error(negate ? `not: ${msg}` : msg);
  };
  return {
    toBe: (e: unknown) => check(Object.is(actual, e), `expected ${show(actual)} to be ${show(e)}`),
    toEqual: (e: unknown) => check(deepEqual(actual, e), `expected ${show(actual)} to equal ${show(e)}`),
    toBeDefined: () => check(actual !== undefined, `expected value to be defined`),
    toBeUndefined: () => check(actual === undefined, `expected ${show(actual)} to be undefined`),
    toBeNull: () => check(actual === null, `expected ${show(actual)} to be null`),
    toBeTruthy: () => check(!!actual, `expected ${show(actual)} to be truthy`),
    toBeFalsy: () => check(!actual, `expected ${show(actual)} to be falsy`),
    toBeGreaterThan: (n: number) => check(actual > n, `expected ${show(actual)} > ${n}`),
    toBeGreaterThanOrEqual: (n: number) => check(actual >= n, `expected ${show(actual)} >= ${n}`),
    toBeLessThan: (n: number) => check(actual < n, `expected ${show(actual)} < ${n}`),
    toBeLessThanOrEqual: (n: number) => check(actual <= n, `expected ${show(actual)} <= ${n}`),
    toContain: (e: unknown) => check(typeof actual === 'string' ? actual.includes(e as string) : Array.isArray(actual) && actual.some((x) => Object.is(x, e)), `expected ${show(actual)} to contain ${show(e)}`),
    toHaveLength: (n: number) => check(actual?.length === n, `expected length ${actual?.length} to be ${n}`),
    toMatch: (r: RegExp | string) => check(typeof r === 'string' ? String(actual).includes(r) : r.test(String(actual)), `expected ${show(actual)} to match ${r}`),
    toThrow: () => {
      let threw = false;
      try { actual(); } catch { threw = true; }
      check(threw, `expected function to throw`);
    },
  };
}
export function expect(actual: unknown) {
  return Object.assign(matchers(actual, false), { not: matchers(actual, true) });
}
export async function __run(file: string) {
  let pass = 0;
  const fails: string[] = [];
  for (const t of tests) {
    try { await t.fn(); pass++; } catch (e) { fails.push(`  ✗ ${t.name}\n    ${(e as Error).message ?? e}`); }
  }
  console.log(`${fails.length ? '✗' : '✓'} ${file}: ${pass}/${tests.length}`);
  for (const f of fails) console.log(f);
  return { pass, total: tests.length };
}
