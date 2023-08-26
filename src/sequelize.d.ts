import {
  AbstractDataTypeConstructor,
  AbstractDataType,
  VirtualDataType,
} from "sequelize";
import { Literal, Fn } from "sequelize/types/utils";

declare module "sequelize" {
  export interface ModelAttributeColumnOptions<M extends Model = Model>
    extends ColumnOptions {
    dependencies?: SequelizeDependency<M>[];
  }

  export type IncludeAsCallback = (includeAs: string) => [Literal | Fn, string];
  /**
   * Adds type-safety support to our extension for 'includeAs' in 'virtual columns'.
   */
  export interface VirtualDataTypeConstructor
    extends AbstractDataTypeConstructor {
    new <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback,
    ): VirtualDataType<T>;
    <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback,
    ): VirtualDataType<T>;
  }
  export abstract class Association<
    S extends Model = Model,
    T extends Model = Model,
  > extends Association<S, T> {
    sourceKey?: string;
  }
}
