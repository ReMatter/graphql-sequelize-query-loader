import { literal, Model, ModelStatic, OrderItem } from 'sequelize';
import { Sorter } from './types';
import { getComputedAttributes } from './util';


/**
 * Allow to map the list of attributes to sort by, including these which are virtual/computed fields
 * (which don't exist in the tables but whose value is calculated using
 * expressions (like SQL functions, sub SQL queries, among others))
 * @param model the sequelize entity class representing the table in the DB
 * @param sorters list of fields to sort by
 * @returns list of fields (including mapped computed attributes)
 */
export function buildOrder<M extends Model>(
  model: ModelStatic<M>,
  sorters: readonly (OrderItem | Sorter)[],
): OrderItem[] {
  const computedAttributes = getComputedAttributes(model);

  // @ts-expect-error TS(2322) FIXME: Type '(string | Fn | Col | Literal | [OrderItemCol... Remove this comment to see the full error message
  return sorters.map((sorter) => {
    if (typeof sorter === 'object' && 'field' in sorter && 'order' in sorter) {
      // @ts-expect-error TS(2538) FIXME: Type 'null' cannot be used as an index type.
      if (computedAttributes[sorter.field]) {
        // @ts-expect-error TS(2345) FIXME: Argument of type 'Maybe<string> | undefined' is no... Remove this comment to see the full error message
        return [literal(sorter.field), sorter.order];
      }

      // @ts-expect-error TS(2533) FIXME: Object is possibly 'null' or 'undefined'.
      if (sorter.field.includes('.')) {
        // @ts-expect-error TS(2533) FIXME: Object is possibly 'null' or 'undefined'.
        return [...sorter.field.split('.'), sorter.order] as OrderItem;
      }

      return [sorter.field, sorter.order];
    }
    return sorter as OrderItem;
  });
}
