import { literal, Model, ModelStatic, Order, OrderItem } from "sequelize";
import { getComputedAttributes } from "./getComputedAttributes";
import { Sorter } from "./queryLoader";

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
  customSorters?: { [key: string]: Order }
): OrderItem[] {
  const computedAttributes = getComputedAttributes(model);

  return sorters.map((sorter) => {
    if (typeof sorter === "object" && "field" in sorter && "order" in sorter) {
      if (computedAttributes[sorter.field as keyof M]) {
        return [literal(sorter.field), sorter.order];
      }

      if (customSorters?.[sorter.field]) {
        return [customSorters[sorter.field], sorter.order] as OrderItem;
      }

      if (sorter.field.includes(".")) {
        return [...sorter.field.split("."), sorter.order] as OrderItem;
      }

      return [sorter.field, sorter.order];
    }
    return sorter as OrderItem;
  });
}

export const hasComputedAttributes = (order: OrderItem[]): boolean =>
  order.some(
    (item) =>
      Array.isArray(item) && typeof item[0] === "object" && "val" in item[0]
  );
