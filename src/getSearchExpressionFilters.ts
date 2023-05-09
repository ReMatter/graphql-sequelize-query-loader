import { literal, Model, ModelStatic, Op, WhereOptions } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

import { SearchExpression } from './types';
import escapeString from 'escape-sql-string';
import { getComputedAttributes } from './getComputedAttributes';

export type CustomSearchExpressions = {
  [name: string]: (searchTerm: string) => Literal;
};

/**
 * DO NOT USE THIS FUNCTION DIRECTLY
 * SEND searchExpressions AND customExpressions TO queryLoader.getFindOptions
 */
export default function getSearchExpressionFilters<M extends Model>(
  searchExpressions: readonly SearchExpression[],
  customExpressions?: CustomSearchExpressions,
  model?: ModelStatic<M>,
): WhereOptions<M> {
  const computedAttributes = getComputedAttributes(model);
  // filter out search terms of `''`
  return searchExpressions?.filter((searchExpression) => searchExpression.searchTerm).length
    ? {
        [Op.and]: searchExpressions.map((searchExpression) => ({
          [Op.or]: [
            // {} needed because of https://github.com/sequelize/sequelize/issues/10142
            {},
            ...searchExpression.fields.map((field) => {
              const customExpression = customExpressions?.[field]?.(searchExpression.searchTerm);
              if (customExpression) {
                return [{}, customExpression];
              }

              const literalExpression = computedAttributes[field as keyof M];
              if (literalExpression) {
                const searchTerm = escapeString(`%${searchExpression.searchTerm}%`);
                return literal(`(${literalExpression.val}) LIKE ${searchTerm}`);
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
