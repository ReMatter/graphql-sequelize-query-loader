import {
  AbstractDataType,
  AbstractDataTypeConstructor,
  Attributes,
  ColumnOptions,
  FindAttributeOptions,
  IncludeOptions,
  Model,
  ModelStatic,
  VirtualDataType,
  WhereAttributeHash,
  WhereOptions,
} from "sequelize";
import { Fn, Literal } from "sequelize/types/utils";

export type SequelizeDependency<M extends Model = Model> = {
  dependentAssociation: keyof M;
  paranoid: boolean;
  required?: boolean;
};

export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Date custom scalar type */
  Date: any;
  JSON: any;
};

export type WhereAttributeHashOnly<TAttributes> = Extract<
  WhereAttributeHash<TAttributes>,
  WhereOptions<TAttributes>
>;

export type SearchExpression = {
  readonly fields: ReadonlyArray<Scalars["String"]>;
  readonly searchTerm: Scalars["String"];
};

export type Sorter = {
  readonly field: Scalars["String"];
  readonly order: Scalars["String"];
};

export type ComputedAttributes<M extends Model> = {
  [key in keyof Attributes<M>]?: Literal;
};

export type IncludeAsCallback = (includeAs: string) => [Literal | Fn, string];

declare module "sequelize" {
  export interface ModelAttributeColumnOptions<M extends Model = Model>
    extends ColumnOptions {
    dependencies?: SequelizeDependency<M>[];
  }

  /**
   * Adds type-safety support to our extension for 'includeAs' in 'virtual columns'.
   */
  export interface VirtualDataTypeConstructor
    extends AbstractDataTypeConstructor {
    new <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback
    ): VirtualDataType<T>;
    <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback
    ): VirtualDataType<T>;
  }
}

export interface DependenciesByFieldNameByModelName {
  [modelName: string]: {
    [fieldName: string]: SequelizeDependency[];
  };
}

export interface ModelAssociationMap {
  [modelName: string]: {
    [associationName: string]: ModelStatic<Model>;
  };
}

export type BaseFindOptions<M extends Model> = {
  attributes: FindAttributeOptions;
  where: WhereOptions<M>;
  include: IncludeOptions[];
  paranoid?: boolean;
  required?: boolean;
};

export interface CustomFieldFilters {
  [modelName: string]: {
    [fieldName: string]: ({ ...args }) => WhereOptions;
  };
}

export type ComputedQueries<T, U> = {
  [key in keyof Partial<T>]: ({ ...args }: U) => Literal;
};
