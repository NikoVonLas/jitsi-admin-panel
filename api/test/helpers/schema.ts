import type { Pool } from "@db/postgres";

// ---------------------------------------------------------------------------
// schemaFingerprint — one line per object of the public schema, sorted.
// Two databases with equal fingerprints have the same tables, columns,
// defaults, indexes, constraints, enums and functions. Column position is left
// out because ALTER TABLE ADD COLUMN appends.
// ---------------------------------------------------------------------------
const FINGERPRINT_SQL = `
  SELECT line FROM (
    SELECT 'relation ' || c.relkind::text || ' ' || c.relname AS line
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace

    UNION ALL
    SELECT 'column ' || c.relname || '.' || a.attname
        || ' ' || format_type(a.atttypid, a.atttypmod)
        || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
        || coalesce(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), '')
    FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped

    UNION ALL
    SELECT 'index ' || pg_get_indexdef(i.indexrelid)
    FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
    WHERE c.relnamespace = 'public'::regnamespace

    UNION ALL
    SELECT 'constraint ' || c.relname || ' ' || k.conname
        || ' ' || pg_get_constraintdef(k.oid)
    FROM pg_constraint k
      JOIN pg_class c ON c.oid = k.conrelid
    WHERE c.relnamespace = 'public'::regnamespace

    UNION ALL
    SELECT 'enum ' || t.typname || ' ('
        || string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) || ')'
    FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typnamespace = 'public'::regnamespace
    GROUP BY t.typname

    UNION ALL
    SELECT 'function ' || p.proname
        || '(' || pg_get_function_identity_arguments(p.oid) || ')'
        || ' RETURNS ' || format_type(p.prorettype, NULL)
        || ' ' || l.lanname || ' volatility=' || p.provolatile::text
        || ' body=' || md5(btrim(regexp_replace(p.prosrc, '\\s+', ' ', 'g')))
    FROM pg_proc p
      JOIN pg_language l ON l.oid = p.prolang
    WHERE p.pronamespace = 'public'::regnamespace
  ) fingerprint
  ORDER BY line COLLATE "C"`;

export async function schemaFingerprint(pool: Pool): Promise<string[]> {
  using client = await pool.connect();
  const result = await client.queryObject<{ line: string }>(FINGERPRINT_SQL);
  return result.rows.map((row) => row.line);
}
