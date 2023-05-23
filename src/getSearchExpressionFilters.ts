import {
  Attributes,
  literal,
  Model,
  ModelStatic,
  Op,
  WhereOptions,
} from "sequelize";

import { getComputedAttributes } from "./getComputedAttributes";
import { escape } from "sequelize/lib/sql-string";
import { SearchExpression } from "./queryLoader";

export type CustomSearchExpressions<M extends Model> = {
  [name: string]: (searchTerm: string) => WhereOptions<M>;
};

/**
 * DO NOT USE THIS FUNCTION DIRECTLY
 * SEND searchExpressions AND customExpressions TO queryLoader.getFindOptions
 */
export function getSearchExpressionFilters<M extends Model>(
  searchExpressions: readonly SearchExpression[],
  model: ModelStatic<M>,
  customExpressions?: CustomSearchExpressions<Attributes<M>>
): WhereOptions<Attributes<M>> {
  const computedAttributes = getComputedAttributes(model);
  // filter out search terms of `''`
  return searchExpressions.filter(
    (searchExpression) => searchExpression.searchTerm
  ).length
    ? {
        [Op.and]: searchExpressions.map((searchExpression) => ({
          [Op.or]: [
            // {} needed because of https://github.com/sequelize/sequelize/issues/10142
            {},
            ...searchExpression.fields.map((field) => {
              const customExpression = customExpressions?.[field]?.(
                searchExpression.searchTerm
              );
              if (customExpression) {
                return [{}, customExpression];
              }

              const literalExpression = computedAttributes[field];
              if (literalExpression) {
                const searchTerm = escape(`%${searchExpression.searchTerm}%`);
                return literal(
                  `(${literalExpression.val as string}) LIKE ${searchTerm}`
                );
              }

              return {
                [field]: {
                  [Op.like]: `%${searchExpression.searchTerm}%`,
                },
              };
            }),
          ],
        })),
      }
    : {};
}
