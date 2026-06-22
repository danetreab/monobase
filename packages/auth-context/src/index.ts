// Framework-agnostic contract for the authenticated identity that the gateway
// resolves (via better-auth) and forwards to downstream services over the TCP
// microservice channel. Keeping it in one shared package means every service
// agrees on the shape and the role-checking rules, instead of each redeclaring
// `{ id, email, role }` and reimplementing the admin check.

// better-auth's admin plugin lets a user hold one role or several. Depending on
// the call path the value arrives either as an array or as a comma-separated
// string, so all role logic goes through `rolesOf` to normalize it.
export type Role = string | string[] | null | undefined;

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

// The active session record as returned by better-auth's getSession().
export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

// The `{ user, session }` pair forwarded across the service boundary. Either
// field may be null when the request is unauthenticated.
export type AuthPrincipal = {
  user: AuthUser | null;
  session: AuthSession | null;
};

// Normalize a role value to a trimmed string[] regardless of source shape.
export function rolesOf(role: Role): string[] {
  if (!role) return [];
  return (Array.isArray(role) ? role : role.split(",")).map((r) => r.trim());
}

// Exact role membership — note this intentionally does NOT substring-match, so
// "superadmin" does not satisfy hasRole(role, "admin").
export function hasRole(role: Role, target: string): boolean {
  return rolesOf(role).includes(target);
}

// Convenience for the most common check.
export function isAdmin(role: Role): boolean {
  return hasRole(role, "admin");
}
