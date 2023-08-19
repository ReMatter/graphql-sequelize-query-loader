import {
  Attributes,
  DataTypes,
  IncludeAsCallback,
  Model,
  ModelStatic,
  VirtualDataType,
} from "sequelize";
import { Literal } from "sequelize/types/utils";

type ComputedAttributes<M extends Model> = {
  [key in keyof Attributes<M>]: Literal;
};

/**
 * Allow to obtain the list of computed attributes, useful for (automatically) projecting, filtering, and
 * ordering based on virtual fields, which don't exist in the tables but whose value is calculated using
 * expressions (like SQL functions, sub SQL queries, among others).
 * ReMatter uses a custom version of Sequelize which allows to define virtual fields using a callback
 * This function uses 'reflect-metadata' under the hood.
 * @param model the sequelize entity class representing the table in the DB
 * @param includedAs name of the property where this model is included (defaults to model's name)
 * @returns list of computed attributes
 */
export function getComputedAttributes<M extends Model>(
  model?: ModelStatic<M>,
  includedAs = model?.name
): ComputedAttributes<M> {
  if (!model) {
    return {} as ComputedAttributes<M>;
  }

  const attributes = model.getAttributes();

  return Object.keys(attributes).reduce((acc, key: keyof Attributes<M>) => {
    const meta = attributes[key];
    if (meta.type instanceof DataTypes.VIRTUAL) {
      const callback = (meta.type as VirtualDataType<any>).fields;
      if (typeof callback === "function") {
        const [expression] = (callback as IncludeAsCallback)(
          includedAs as string
        );
        acc[key] = expression as Literal;
      }
    }
    return acc;
  }, {} as ComputedAttributes<M>);
}
