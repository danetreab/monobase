import { AsyncLocalStorage } from "node:async_hooks";
import type { AuthPrincipal, AuthSession, AuthUser } from "@repo/auth-context";

// Ambient per-request identity. The transport controller seeds this once around
// the GraphQL execution (see runWithAuth); because AsyncLocalStorage propagates
// across awaits, any resolver OR service invoked during that execution can read
// the caller without threading it through every method signature.
const storage = new AsyncLocalStorage<AuthPrincipal>();

// Wrap a request's GraphQL execution so getCurrentUser()/getCurrentSession()
// resolve inside it. Returns whatever `fn` returns (here, a Promise).
export function runWithAuth<T>(principal: AuthPrincipal, fn: () => T): T {
  return storage.run(principal, fn);
}

// Null when called outside a request (e.g. the direct HTTP/WS path that the
// gateway does not populate, or a background job).
export function getCurrentUser(): AuthUser | null {
  return storage.getStore()?.user ?? null;
}

export function getCurrentSession(): AuthSession | null {
  return storage.getStore()?.session ?? null;
}

// Same as getCurrentUser but throws if absent — use when the operation requires
// an authenticated caller and you'd otherwise have to null-check by hand.
export function requireCurrentUser(): AuthUser {
  const user = getCurrentUser();
  if (!user) throw new Error("No authenticated user in context");
  return user;
}
