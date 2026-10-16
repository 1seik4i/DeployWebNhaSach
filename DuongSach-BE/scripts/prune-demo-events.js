import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma } from '../src/config/database.js';

const keepIds = [
  'daa1f312-395e-43a2-a91c-00f3a3d50bbb',
  '7e579f11-c470-4788-a0ef-3cc29525e16e',
  'bde2daf8-061d-4ae1-adeb-db8dd283e9c9',
  '89c22dc5-645b-4528-a081-8dc42a29b834',
  '849259d6-ccfe-47fb-a90a-8a6f0c7aba9b',
  '8e98d3f6-859c-45ca-ab9f-508d54e8f932',
];
const quote = value => `"${value.replaceAll('"', '""')}"`;
const tableName = name => `"public".${quote(name)}`;
const json = value => JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2);

async function prune(apply) {
  return prisma.$transaction(async tx => {
    // The catalogue metadata limits traversal to foreign-key descendants.
    const primaryKeys = await tx.$queryRaw`
      SELECT c.relname::text AS name, array_agg(a.attname::text ORDER BY k.ordinality) AS columns
      FROM pg_constraint p JOIN pg_class c ON c.oid = p.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      CROSS JOIN LATERAL unnest(p.conkey) WITH ORDINALITY k(attnum, ordinality)
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
      WHERE p.contype = 'p' AND n.nspname = 'public' GROUP BY c.relname`;
    const foreignKeys = await tx.$queryRaw`
      SELECT f.conname::text AS name, child.relname::text AS child, parent.relname::text AS parent,
        array_agg(ca.attname::text ORDER BY k.ordinality) AS child_columns,
        array_agg(pa.attname::text ORDER BY k.ordinality) AS parent_columns,
        array_agg(NOT ca.attnotnull ORDER BY k.ordinality) AS nullable
      FROM pg_constraint f JOIN pg_class child ON child.oid = f.conrelid
      JOIN pg_class parent ON parent.oid = f.confrelid
      JOIN pg_namespace ns ON ns.oid = child.relnamespace
      CROSS JOIN LATERAL unnest(f.conkey, f.confkey) WITH ORDINALITY k(child_num, parent_num, ordinality)
      JOIN pg_attribute ca ON ca.attrelid = child.oid AND ca.attnum = k.child_num
      JOIN pg_attribute pa ON pa.attrelid = parent.oid AND pa.attnum = k.parent_num
      WHERE f.contype = 'f' AND ns.nspname = 'public'
      GROUP BY f.conname, child.relname, parent.relname`;
    const columns = await tx.$queryRaw`
      SELECT c.relname::text AS name, a.attname::text AS column, format_type(a.atttypid, a.atttypmod)::text AS type
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped`;
    const pks = new Map(primaryKeys.map(row => [row.name, row.columns]));
    const types = new Map(columns.map(row => [`${row.name}.${row.column}`, row.type]));
    const selected = new Map();
    const identity = (name, row) => json(pks.get(name).map(column => row[column]));
    const add = (name, rows) => {
      if (!pks.has(name)) throw new Error(`Missing primary key for ${name}`);
      const records = selected.get(name) || new Map();
      let added = 0;
      for (const row of rows) { const key = identity(name, row); if (!records.has(key)) { records.set(key, row); added++; } }
      if (records.size) selected.set(name, records);
      return added;
    };
    const matching = (name, cols, rows, refCols = cols) => {
      const parameters = [];
      const clauses = rows.map(row => `(${cols.map((column, index) => {
        const value = row[refCols[index]];
        if (value === null || value === undefined) return 'FALSE';
        parameters.push(value);
        return `${quote(column)} = $${parameters.length}::${types.get(`${name}.${column}`)}`;
      }).join(' AND ')})`);
      return { where: clauses.join(' OR ') || 'FALSE', parameters };
    };

    const kept = await tx.event.findMany({ where: { id: { in: keepIds }, isDeleted: false } });
    if (kept.length !== 6) throw new Error('Cannot find all six selected demo events; nothing was deleted.');
    add('events', await tx.event.findMany({ where: { id: { notIn: keepIds } } }));
    const activities = await tx.activity.findMany({ where: { eventId: { in: keepIds } } });
    const linked = activities.map(row => row.proposalId).filter(Boolean);
    const staleProposals = await tx.activityProposal.findMany({ where: {
      id: { notIn: linked },
      OR: [{ publishedActivityId: null }, { publishedActivityId: { notIn: activities.map(row => row.id) } }],
    } });
    add('activity_proposals', staleProposals);
    // Find all dependent records, including attendance, requests and reviews.
    let changed = true;
    while (changed) {
      changed = false;
      for (const fk of foreignKeys) {
        const parents = [...(selected.get(fk.parent)?.values() || [])];
        if (!parents.length) continue;
        const match = matching(fk.child, fk.child_columns, parents, fk.parent_columns);
        const rows = await tx.$queryRawUnsafe(`SELECT * FROM ${tableName(fk.child)} WHERE ${match.where}`, ...match.parameters);
        if (add(fk.child, rows)) changed = true;
      }
    }
    if ([...selected.get('events').values()].some(row => keepIds.includes(row.id))) throw new Error('Deletion would affect a kept event; aborting.');
    if ([...selected.get('activities')?.values() || []].some(row => keepIds.includes(row.event_id || row.eventId))) throw new Error('Deletion would affect a kept activity; aborting.');
    // Prisma roots use camelCase; descendants and snapshots use SQL column names.
    // Reload roots by primary key so every snapshot has the database row shape.
    for (const [name, records] of selected) {
      if (!['events', 'activity_proposals'].includes(name)) continue;
      const match = matching(name, ['id'], [...records.values()]);
      const rows = await tx.$queryRawUnsafe(`SELECT * FROM ${tableName(name)} WHERE ${match.where}`, ...match.parameters);
      selected.set(name, new Map(rows.map(row => [identity(name, row), row])));
    }
    const summary = Object.fromEntries([...selected].map(([name, rows]) => [name, rows.size]));
    if (!apply) return { keep: kept.map(row => ({ id: row.id, title: row.title })), delete: summary };

    const backupPath = resolve('../reports/backups', `demo-events-${new Date().toISOString().replaceAll(':', '-')}.json`);
    await mkdir(resolve('../reports/backups'), { recursive: true });
    await writeFile(backupPath, json({ createdAt: new Date().toISOString(), keep: kept, schema: columns, primaryKeys, foreignKeys, rows: Object.fromEntries([...selected].map(([name, rows]) => [name, [...rows.values()]])) }));

    // Break nullable links (such as proposal <-> activity) only inside the removal set.
    const broken = new Set();
    for (const fk of foreignKeys) {
      if (!selected.has(fk.child) || !selected.has(fk.parent) || !fk.nullable.every(Boolean)) continue;
      const match = matching(fk.child, pks.get(fk.child), [...selected.get(fk.child).values()]);
      await tx.$executeRawUnsafe(`UPDATE ${tableName(fk.child)} SET ${fk.child_columns.map(column => `${quote(column)} = NULL`).join(', ')} WHERE ${match.where}`, ...match.parameters);
      broken.add(fk.name);
    }
    const remaining = new Set(selected.keys());
    while (remaining.size) {
      const leaves = [...remaining].filter(parent => !foreignKeys.some(fk => !broken.has(fk.name) && fk.parent === parent && remaining.has(fk.child)));
      if (!leaves.length) throw new Error('Non-nullable foreign-key cycle; transaction rolled back.');
      for (const name of leaves) {
        const match = matching(name, pks.get(name), [...selected.get(name).values()]);
        await tx.$executeRawUnsafe(`DELETE FROM ${tableName(name)} WHERE ${match.where}`, ...match.parameters);
        remaining.delete(name);
      }
    }
    const count = await tx.event.count();
    if (count !== 6) throw new Error(`Expected six events, found ${count}; rolling back.`);
    return { backupPath, deleted: summary, remaining: count, keep: kept.map(row => ({ id: row.id, title: row.title })) };
  }, { isolationLevel: 'Serializable', maxWait: 10000, timeout: 60000 });
}

try { console.log(json(await prune(process.argv.includes('--apply')))); }
finally { await prisma.$disconnect(); }
