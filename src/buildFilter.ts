import {
  literal,
  Model,
  ModelCtor,
  Op,
  WhereAttributeHash,
  WhereOptions,
  WhereValue,
} from "sequelize";
import { Literal } from "sequelize/types/utils";

import escapeString from "escape-sql-string";
import { getComputedAttributes } from "./getComputedAttributes";

const OperatorMap = {
  [Op.eq]: "=",
  [Op.ne]: "!=",
  [Op.gte]: ">=",
  [Op.gt]: ">",
  [Op.lte]: "<=",
  [Op.lt]: "<",
  [Op.not]: "IS NOT",
  [Op.is]: "IS",
  [Op.in]: "IN",
  [Op.notIn]: "NOT IN",
  [Op.like]: "LIKE",
  [Op.notLike]: "NOT LIKE",
  [Op.iLike]: "ILIKE",
  [Op.notILike]: "NOT ILIKE",
  [Op.startsWith]: "LIKE",
  [Op.endsWith]: "LIKE",
  [Op.substring]: "LIKE",
  [Op.regexp]: "~",
  [Op.notRegexp]: "!~",
  [Op.iRegexp]: "~*",
  [Op.notIRegexp]: "!~*",
  [Op.between]: "BETWEEN",
  [Op.notBetween]: "NOT BETWEEN",
  [Op.overlap]: "&&",
  [Op.contains]: "@>",
  [Op.contained]: "<@",
  [Op.adjacent]: "-|-",
  [Op.strictLeft]: "<<",
  [Op.strictRight]: ">>",
  [Op.noExtendRight]: "&<",
  [Op.noExtendLeft]: "&>",
  [Op.any]: "ANY",
  [Op.all]: "ALL",
  [Op.and]: " AND ",
  [Op.or]: " OR ",
  [Op.col]: "COL",
  [Op.placeholder]: "$$PLACEHOLDER$$",
  [Op.match]: "@@",
};

/**
 * Parses virtual/computed fields into Literal
 * @param literalExpression a computed attribute resolved
 * @param rawValue the original filter value
 * @returns a Literal
 */
const buildLiteralFilter = (
  literalExpression: Literal,
  rawValue: WhereValue
): Literal => {
  const expression = `(${literalExpression.val})`;

  if (typeof rawValue === "object") {
    const operator = Object.getOwnPropertySymbols(rawValue)[0];
    const operatorLiteral = OperatorMap[operator];
    if (operatorLiteral) {
      // @ts-expect-error TS(2531) FIXME: Object is possibly 'null'.
      const escapedValue = escapeString(rawValue[operator]);
      return literal(`${expression} ${operatorLiteral} ${escapedValue}`);
    }
  }

  // @ts-expect-error TS(2345) FIXME: Argument of type 'WhereValue<any>' is not assignab... Remove this comment to see the full error message
  const escapedValue = escapeString(rawValue);

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
  model: ModelCtor<M>,
  filter?: WhereOptions<M>,
  includeAs: string = model.name
): WhereOptions<M> {
  if (!filter) return [];

  const computedAttributes = getComputedAttributes(model, includeAs);
  const keys = [
    ...Object.keys(filter),
    ...Object.getOwnPropertySymbols(filter),
  ];

  return keys.map((key) => {
    const rawValue = filter[key];
    if (computedAttributes[key])
      return buildLiteralFilter(computedAttributes[key], rawValue);

    if ((key === Op.or || key === Op.and) && Array.isArray(rawValue)) {
      return {
        [key]: [
          {}, // Without this element, Sequelize will throw an error. See more: https://github.com/sequelize/sequelize/issues/10142
          ...rawValue.map((object) => [
            {}, // Without this element, Sequelize will throw an error. See more: https://github.com/sequelize/sequelize/issues/10142
            ...Object.entries(object).map(([innerKey, innerValue]) => {
              const literalMapping = computedAttributes[innerKey];
              // @ts-expect-error TS(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
              if (literalMapping)
                return buildLiteralFilter(literalMapping, innerValue);
              return { [innerKey]: innerValue } as WhereAttributeHash<M>;
            }),
          ]),
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
  const src = { ...source };

  const dest = Object.getOwnPropertySymbols(src).reduce(
    (acc, op) => {
      if (acc[op] && Array.isArray(src[op])) {
        acc[op] = acc[op].concat(src[op]);
        delete src[op];
      }
      return acc;
    },
    { ...target }
  );

  return { ...dest, ...src };
}
