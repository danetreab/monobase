/**
 * Parse a redis:// URL into the discrete options shape that
 * @nestjs/microservices Redis transport (and ioredis option form) expect.
 *
 * Handles: host, port, username, password (URL-decoded), and the database
 * index encoded in the path (e.g., redis://host:6379/11 → db: 11).
 */
export function redisOptionsFromUrl(url: string): {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
} {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname && u.pathname !== "/" ? Number(u.pathname.slice(1)) : 0,
  };
}
