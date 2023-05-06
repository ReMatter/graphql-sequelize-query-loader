import { literal, Model, ModelCtor, Op, WhereOptions } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

import { SearchExpression } from './types';
import { getComputedAttributes } from './util';
import escapeString from 'escape-sql-string';

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
  model?: ModelCtor<M>,
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

              if (computedAttributes[field]) {
                const literalExpression = computedAttributes[field];
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
