import { Model, WhereOptions } from "sequelize";

export function mergeFilter<M extends Model>(
  target: WhereOptions<M>,
  source: WhereOptions<M>
): WhereOptions<M> {
  const src = { ...source } as { [x: symbol]: unknown[] };

  const dest = Object.getOwnPropertySymbols(src).reduce(
    (acc, op) => {
      if (Array.isArray(acc[op]) && Array.isArray(src[op])) {
        acc[op].push(...src[op]);
        delete src[op];
      }
      return acc;
    },
    { ...target } as { [x: symbol]: unknown[] }
  );

  return { ...dest, ...src } as WhereOptions<M>;
}
