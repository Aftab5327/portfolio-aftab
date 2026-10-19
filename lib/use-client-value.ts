import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Reads a browser-only value without a mount effect. The server render and the
 * hydration render get `serverValue`; the client then re-renders with `read()`.
 * (Replaces the `useEffect(() => setX(...), [])` pattern that React 19's
 * react-hooks rules flag as cascading renders.) `read` must return a stable
 * primitive.
 */
export function useClientValue<T extends string | number | boolean>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}

/** false during SSR and hydration, true afterwards (the classic "mounted" flag). */
export const useHydrated = () => useClientValue(() => true, false);
