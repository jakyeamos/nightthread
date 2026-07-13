export async function purgeExpiredTombstones(env: CloudflareEnv, now = new Date()): Promise<number> {
  const expired = await env.DB.prepare(
    `select id, target_kind as targetKind, target_id as targetId
     from deletion_tombstones
     where purge_after <= ?1 and undone_at is null and purged_at is null
     limit 100`,
  )
    .bind(now.getTime())
    .all<{ id: string; targetKind: string; targetId: string }>();

  const tableByKind: Record<string, string> = {
    itinerary_item: "itinerary_items",
    saved_idea: "saved_ideas",
    city: "cities",
    trip: "trips",
    asset: "assets",
  };
  const statements: D1PreparedStatement[] = [];
  for (const row of expired.results) {
    const table = tableByKind[row.targetKind];
    if (!table) continue;
    statements.push(env.DB.prepare(`delete from ${table} where id = ?1`).bind(row.targetId));
    statements.push(
      env.DB.prepare("update deletion_tombstones set purged_at = ?1 where id = ?2").bind(
        now.getTime(),
        row.id,
      ),
    );
  }
  if (statements.length > 0) await env.DB.batch(statements);
  return statements.length / 2;
}
