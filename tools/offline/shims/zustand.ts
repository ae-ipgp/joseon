// Stand-in for zustand 5 `create` (offline build only): a store with getState/setState/subscribe and a hook.
import { useSyncExternalStore } from 'react';

type Listener<T> = (s: T, prev: T) => void;
function createStore<T>(init: (set: any, get: () => T, api: any) => T) {
  let state: T;
  const listeners = new Set<Listener<T>>();
  const getState = () => state;
  const setState = (partial: any, replace?: boolean) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    if (Object.is(next, state)) return;
    const prev = state;
    state = replace || typeof next !== 'object' || next === null ? next : Object.assign({}, state, next);
    listeners.forEach((l) => l(state, prev));
  };
  const subscribe = (l: Listener<T>) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const api = { getState, setState, subscribe, getInitialState: () => initial };
  const initial = (state = init(setState, getState, api));
  return api;
}
function bind<T>(init: (set: any, get: () => T, api: any) => T) {
  const api = createStore(init);
  const useBound: any = (selector: (s: T) => unknown = (s) => s) =>
    useSyncExternalStore(api.subscribe, () => selector(api.getState()), () => selector(api.getInitialState()));
  Object.assign(useBound, api);
  return useBound;
}
export function create(init?: any): any {
  return init ? bind(init) : bind;
}
