import {
  Attributes,
  literal,
  Model,
  ModelStatic,
  Op,
  WhereAttributeHash,
  WhereAttributeHashValue,
  WhereOptions,
} from "sequelize";
import { Literal } from "sequelize/types/utils";
import { Escapable, escape } from "sequelize/lib/sql-string";

import { getComputedAttributes } from "./getComputedAttributes";

import { OperatorMap } from "sequelize/lib/dialects/abstract/query-generator/operators";

type WhereAttributeHashOnly<TAttributes> = Extract<
  WhereAttributeHash<TAttributes>,
  WhereOptions<TAttributes>
>;

/**
 * Parses virtual/computed fields into Literal
 * @param literalExpression a computed attribute resolved
 * @param rawValue the original filter value
 * @returns a Literal
 */
const buildLiteralFilter = <T>(
  literalExpression: Literal,
  rawValue: NonNullable<WhereAttributeHashValue<T>>
): Literal => {
  const expression = `(${literalExpression.val as string})`;

  if (typeof rawValue === "object") {
    const operator = Object.getOwnPropertySymbols(
      rawValue
    )[0] as unknown as typeof Op; // getOwnPropertySymbols does not preserve the type
    // Need to type better the OperatorMap
    // @ts-expect-error Type 'OpTypes' cannot be used as an index type.
    const operatorLiteral = OperatorMap[operator] as string;
    if (operatorLiteral) {
      const escapedValue = escape(
        // @ts-expect-error Type 'OpTypes' cannot be used as an index type.
        rawValue[operator] as Escapable | Escapable[]
      );
      return literal(`${expression} ${operatorLiteral} ${escapedValue}`);
    }
  }

  const escapedValue = escape(rawValue as Escapable | Escapable[]);

  if (Array.isArray(rawValue))
    return literal(`${expression} IN (${escapedValue})`);

  return literal(`${expression} = ${escapedValue}`);
};

/**
 * Allow to filter by fields, including these which are virtual/computed fields
 * (which don't exist in the tables but whose value is calculated using
 * expressions (like SQL functions, sub SQL queries, among others))
 * @param model the sequelize entity class representing the table in the DB
 * @param filter criteria object
 * @param includeAs name used as alias for the model in the database query
 * @returns list of conditions
 */
export function buildFilter<M extends Model>(
  model: ModelStatic<M>,
  filter?: WhereAttributeHashOnly<Attributes<M>>,
  includeAs: string = model.name
): WhereOptions<M> {
  if (!filter) return [];

  const computedAttributes = getComputedAttributes(model, includeAs);
  const keys = [
    ...Object.keys(filter),
    ...Object.getOwnPropertySymbols(filter),
  ];

  return keys.map((key) => {
    const rawValue = filter[key as string] as WhereAttributeHashValue<
      Attributes<M>
    >;
    if (typeof key === "string" && computedAttributes[key])
      return buildLiteralFilter(computedAttributes[key], rawValue);

    if ((key === Op.or || key === Op.and) && Array.isArray(rawValue)) {
      return {
        [key]: [
          {}, // Without this element, Sequelize will throw an error. See more: https://github.com/sequelize/sequelize/issues/10142
          // TODO next casting should not be necessary with the isArray type guard
          ...(rawValue as WhereAttributeHashValue<Attributes<M>>[]).map(
            (object) => [
              {}, // Without this element, Sequelize will throw an error. See more: https://github.com/sequelize/sequelize/issues/10142
              ...Object.entries(object).map(([innerKey, innerValue]) => {
                const literalMapping = computedAttributes[innerKey];
                if (literalMapping)
                  return buildLiteralFilter(literalMapping, innerValue);
                return { [innerKey]: innerValue as unknown };
              }),
            ]
          ),
        ],
      } as WhereAttributeHash<M>;
    }

    return { [key]: rawValue } as WhereAttributeHash<M>;
  });
}

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
