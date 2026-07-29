import { FakeDecimal } from "./decimal";
import { RELATIONS, ENUM_ORDINALS, type RelationDef } from "./relations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Db = Record<string, Row[]>;

function unwrap(value: unknown): unknown {
  if (value instanceof FakeDecimal) return value.toNumber();
  if (value instanceof Date) return value.getTime();
  return value;
}

function matchFieldCondition(value: unknown, cond: unknown, fieldName?: string): boolean {
  if (cond === null) return value === null || value === undefined;
  if (cond instanceof Date || typeof cond !== "object") {
    if (fieldName && ENUM_ORDINALS[fieldName] && typeof cond === "string") {
      return value === cond;
    }
    return unwrap(value) === unwrap(cond as Date | string | number | boolean);
  }

  const ops = cond as Record<string, unknown>;
  return Object.entries(ops).every(([op, opVal]) => {
    switch (op) {
      case "contains": {
        const a = String(value ?? "");
        const b = String(opVal ?? "");
        return ops.mode === "insensitive" ? a.toLowerCase().includes(b.toLowerCase()) : a.includes(b);
      }
      case "mode":
        return true;
      case "in":
        return (opVal as unknown[]).some((v) => unwrap(v) === unwrap(value));
      case "notIn":
        return !(opVal as unknown[]).some((v) => unwrap(v) === unwrap(value));
      case "not":
        return opVal === null ? value !== null && value !== undefined : unwrap(value) !== unwrap(opVal);
      case "equals":
        return unwrap(value) === unwrap(opVal);
      case "gte":
        return (unwrap(value) as number) >= (unwrap(opVal) as number);
      case "gt":
        return (unwrap(value) as number) > (unwrap(opVal) as number);
      case "lte":
        return (unwrap(value) as number) <= (unwrap(opVal) as number);
      case "lt":
        return (unwrap(value) as number) < (unwrap(opVal) as number);
      default:
        return true;
    }
  });
}

export function matchWhere(row: Row, modelName: string, where: Row | undefined, db: Db): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, cond]) => {
    if (key === "AND") return (cond as Row[]).every((w) => matchWhere(row, modelName, w, db));
    if (key === "OR") return (cond as Row[]).some((w) => matchWhere(row, modelName, w, db));
    if (key === "NOT") return !matchWhere(row, modelName, cond as Row, db);

    const relDef: RelationDef | undefined = RELATIONS[modelName]?.[key];
    if (relDef && cond && typeof cond === "object") {
      const related = resolveRelation(row, modelName, key, true, db);
      if (relDef.type === "hasMany") {
        return (related as Row[]).some((r) => matchWhere(r, relDef.model, cond as Row, db));
      }
      return related ? matchWhere(related as Row, relDef.model, cond as Row, db) : false;
    }

    return matchFieldCondition(row[key], cond, key);
  });
}

export function applyOrderBy(items: Row[], orderBy: Row | Row[]): Row[] {
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const spec of specs) {
      const [field, dir] = Object.entries(spec)[0] as [string, "asc" | "desc"];
      const ordinals = ENUM_ORDINALS[field];
      const av = ordinals ? ordinals[a[field]] : unwrap(a[field]);
      const bv = ordinals ? ordinals[b[field]] : unwrap(b[field]);
      if ((av as number) < (bv as number)) return dir === "asc" ? -1 : 1;
      if ((av as number) > (bv as number)) return dir === "asc" ? 1 : -1;
    }
    return 0;
  });
}

function resolveRelation(row: Row, modelName: string, relKey: string, spec: unknown, db: Db): unknown {
  const relDef = RELATIONS[modelName]?.[relKey];
  if (!relDef) return undefined;

  if (relDef.type === "hasMany") {
    let items = db[relDef.model].filter((r) => r[relDef.fk] === row.id);
    if (spec && typeof spec === "object") {
      const s = spec as Row;
      if (s.orderBy) items = applyOrderBy(items, s.orderBy);
      if (typeof s.skip === "number") items = items.slice(s.skip);
      if (typeof s.take === "number") items = items.slice(0, s.take);
      items = items.map((item) => (s.include || s.select ? project(item, relDef.model, s, db) : { ...item }));
    } else {
      items = items.map((item) => ({ ...item }));
    }
    return items;
  }

  const fkVal = relDef.type === "belongsTo" ? row[relDef.fk] : row.id;
  const found =
    relDef.type === "belongsTo"
      ? db[relDef.model].find((r) => r.id === fkVal) ?? null
      : db[relDef.model].find((r) => r[relDef.fk] === fkVal) ?? null;
  if (!found) return null;

  if (spec && typeof spec === "object" && (spec as Row).select) {
    const out: Row = {};
    for (const k of Object.keys((spec as Row).select)) out[k] = found[k];
    return out;
  }
  return { ...found };
}

export function project(row: Row, modelName: string, args: Row, db: Db): Row {
  if (args.include) {
    const result: Row = { ...row };
    for (const [key, spec] of Object.entries(args.include)) {
      result[key] = resolveRelation(row, modelName, key, spec, db);
    }
    return result;
  }
  if (args.select) {
    const out: Row = {};
    for (const [key, spec] of Object.entries(args.select)) {
      if (spec === true) out[key] = row[key];
      else if (spec && typeof spec === "object") out[key] = resolveRelation(row, modelName, key, spec, db);
    }
    return out;
  }
  return { ...row };
}

export function findMany(db: Db, modelName: string, args: Row = {}): Row[] {
  let result = db[modelName].filter((r) => matchWhere(r, modelName, args.where, db));
  if (args.orderBy) result = applyOrderBy(result, args.orderBy);
  if (args.distinct) {
    const seen = new Set<string>();
    result = result.filter((r) => {
      const key = (args.distinct as string[]).map((f) => r[f]).join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (typeof args.skip === "number") result = result.slice(args.skip);
  if (typeof args.take === "number") result = result.slice(0, args.take);
  return result.map((r) => project(r, modelName, args, db));
}

export function findFirst(db: Db, modelName: string, args: Row = {}): Row | null {
  let result = db[modelName].filter((r) => matchWhere(r, modelName, args.where, db));
  if (args.orderBy) result = applyOrderBy(result, args.orderBy);
  const row = result[0];
  return row ? project(row, modelName, args, db) : null;
}

export function findUnique(db: Db, modelName: string, args: Row): Row | null {
  const row = db[modelName].find((r) => matchWhere(r, modelName, args.where, db));
  return row ? project(row, modelName, args, db) : null;
}

export function count(db: Db, modelName: string, args: Row = {}): number {
  return db[modelName].filter((r) => matchWhere(r, modelName, args.where, db)).length;
}

export function groupBy(db: Db, modelName: string, args: Row): Row[] {
  const filtered = db[modelName].filter((r) => matchWhere(r, modelName, args.where, db));
  const groups = new Map<string, { byValues: Row; rows: Row[] }>();
  for (const row of filtered) {
    const byValues: Row = {};
    for (const f of args.by as string[]) byValues[f] = row[f];
    const key = JSON.stringify(byValues);
    if (!groups.has(key)) groups.set(key, { byValues, rows: [] });
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()].map(({ byValues, rows }) => {
    const result: Row = { ...byValues };
    if (args._count) result._count = rows.length;
    if (args._sum) {
      result._sum = {};
      for (const field of Object.keys(args._sum)) {
        result._sum[field] = rows.reduce((s, r) => s + (unwrap(r[field]) as number ?? 0), 0);
      }
    }
    return result;
  });
}

export function aggregate(db: Db, modelName: string, args: Row = {}): Row {
  const filtered = db[modelName].filter((r) => matchWhere(r, modelName, args.where, db));
  const result: Row = {};
  if (args._sum) {
    result._sum = {};
    for (const field of Object.keys(args._sum)) {
      result._sum[field] = filtered.reduce((s, r) => s + ((unwrap(r[field]) as number) ?? 0), 0);
    }
  }
  return result;
}
