// Runs database migrations for the test database.
// Usage: deno task migrate:test
import migrate from "../lib/adm/migration.ts";

console.log("Running test database migrations...");
await migrate();
console.log("Done.");
Deno.exit(0);
