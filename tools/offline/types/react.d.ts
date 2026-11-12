// Minimal React 19 type stand-in for the offline type check (the real @types/react is used with npm).
declare module 'react' {
  export type ReactNode = ReactElement | string | number | bigint | boolean | null | undefined | Iterable<ReactNode>;
  export interface ReactElement { type: unknown; props: unknown; key: string | null }
  export type Key = string | number;
  export type CSSProperties = { [k: string]: string | number | undefined };
  export type Dispatch<A> = (a: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export type RefObject<T> = { current: T };
  export type FC<P = object> = (props: P) => ReactNode;
  export type PropsWithChildren<P = object> = P & { children?: ReactNode };
  export type DependencyList = readonly unknown[];
  export function useState<S>(init: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useReducer<S, A>(r: (s: S, a: A) => S, init: S): [S, Dispatch<A>];
  export function useRef<T>(init: T): RefObject<T>;
  export function useRef<T>(init: T | null): RefObject<T | null>;
  export function useRef<T = undefined>(): RefObject<T | undefined>;
  export function useEffect(fn: () => void | (() => void), deps?: DependencyList): void;
  export function useLayoutEffect(fn: () => void | (() => void), deps?: DependencyList): void;
  export function useMemo<T>(fn: () => T, deps: DependencyList): T;
  export function useCallback<T extends (...a: never[]) => unknown>(fn: T, deps: DependencyList): T;
  export function useId(): string;
  export function useSyncExternalStore<T>(sub: (cb: () => void) => () => void, get: () => T, server?: () => T): T;
  export interface Context<T> { Provider: (p: { value: T; children?: ReactNode }) => ReactNode }
  export function createContext<T>(v: T): Context<T>;
  export function useContext<T>(c: Context<T>): T;
  export function memo<P>(c: (p: P) => ReactNode): (p: P) => ReactNode;
  export const Fragment: (props: { children?: ReactNode }) => ReactNode;
  export const StrictMode: (props: { children?: ReactNode }) => ReactNode;
  export const Suspense: (props: { children?: ReactNode; fallback?: ReactNode }) => ReactNode;
  export interface ErrorInfo { componentStack?: string | null }
  export class Component<P = object, S = object> {
    constructor(props: P);
    readonly props: Readonly<P> & { children?: ReactNode };
    state: Readonly<S>;
    setState(s: Partial<S> | ((prev: S) => Partial<S>)): void;
    render(): ReactNode;
  }
}
declare module 'react-dom/client' {
  export function createRoot(el: Element | DocumentFragment): { render(n: import('react').ReactNode): void; unmount(): void };
}
declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}
/** Any DOM event a handler receives: the element fields used by the game are loosely typed. */
type DomEvent = {
  currentTarget: any; target: any; key: string; code: string; clientX: number; clientY: number; deltaY: number;
  button: number; pointerId: number; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean;
  touches: any; changedTouches: any; dataTransfer: any; nativeEvent: any;
  preventDefault(): void; stopPropagation(): void;
};
type DomProps = {
  [k: `on${string}`]: ((e: DomEvent) => void) | undefined;
  [k: string]: any;
};
declare namespace JSX {
  type Element = import('react').ReactElement;
  type ElementType = string | ((props: any) => import('react').ReactNode) | (new (props: any) => import('react').Component<any, any>);
  interface ElementClass { render(): import('react').ReactNode }
  interface ElementAttributesProperty { props: object }
  interface ElementChildrenAttribute { children: object }
  interface IntrinsicAttributes { key?: import('react').Key | null }
  interface IntrinsicElements { [tag: string]: DomProps }
}
