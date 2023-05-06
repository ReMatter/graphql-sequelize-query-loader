import { ArgumentNode, GraphQLResolveInfo, SelectionNode } from 'graphql';
import { AbstractDataType, AbstractDataTypeConstructor, ColumnOptions, FindAttributeOptions, FindOptions, IncludeOptions, Model, ModelStatic, Model as SequelizeModel, VirtualDataType, WhereOptions } from "sequelize";
import { Fn, Literal } from 'sequelize/types/utils';

/**
 * Object containing all loaded models
 * from sequelize
 *
 * eg
 * ```js
 * {
 *   Article: SequelizeModel,
 *   Category: SequelizeModel,
 *   Comment: SequelizeModel,
 *   User: SequelizeModel,
 * }
 */
export interface IIncludeModels {
  [modelName: string]: SequelizeModel;
}

/**
 * model fields to be selected
 *
 * Example
 * ```js
 *  ['id', 'firstname', 'lastname'],
 */
export type SelectedAttributes = string[];

/**
 * Array of include options
 * for all models to be included
 *
 * Example
 * ```js
 * [
 *   {
 *     model: User,
 *     as: 'owner',
 *     attributes: ['firstname', 'lastname'],
 *     required: false,
 *   },
 *   {
 *     model: Comment,
 *     as: 'comments',
 *     attributes: ['id', 'content'],
 *     required: false,
 *   }
 * ]
 */
export type SelectedIncludes = IncludeOptions[];

/**
 * Object containing the selected fields and the
 * where constraints applied on them
 *
 * Example
 * ```js
 * { id: { [Symbol(gt)]: '5' } }
 */
export interface IWhereConstraints {
  [fieldName: string]: {
    [OperatorSymbol: string]: string
  }
}

export interface ISequelizeOperators {
  [operatorName: string]: symbol
}

export interface IQueryLoader {

  init: (object: {
    includeModels: IIncludeModels,
  }) => void;

  includeModels: IIncludeModels;

  getFindOptions: (object: {
    model: SequelizeModel,
    info: GraphQLResolveInfo
  }) => FindOptions;

  getSelectedAttributes: (object: {
    model: SequelizeModel | any,
    selections: ReadonlyArray<SelectionNode> | undefined
  }) => SelectedAttributes;

  getSelectedIncludes: (object: {
    model: SequelizeModel,
    selections: ReadonlyArray<SelectionNode> | undefined
  }) => SelectedIncludes;

  prepareIncludes: (object: {
    model: SequelizeModel,
    selections: ReadonlyArray<SelectionNode> | undefined
  }) => SelectedIncludes;

  getIncludeModel: (fieldName: string) => SequelizeModel

  turnArgsToWhere: (fieldArguments: ReadonlyArray<ArgumentNode>) => IWhereConstraints | {}

  getWhereConstraints: (fieldArguments: ReadonlyArray<ArgumentNode>) => IWhereConstraints | {}

  getValidScopeString: (fieldConditionString: string) => string[]
}

export type SequelizeDependency<M extends SequelizeModel = SequelizeModel> = {
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

export type SearchExpression = {
  readonly fields: ReadonlyArray<Scalars['String']>;
  readonly searchTerm: Scalars['String'];
};

export type Sorter = {
  readonly field?: Maybe<Scalars['String']>;
  readonly order?: Maybe<Scalars['String']>;
};

export type ComputedAttributes<M extends SequelizeModel> = {
  [key in keyof M]?: Literal;
};

export type IncludeAsCallback = (includeAs: string) => [Literal | Fn, string];

declare module 'sequelize' {

  export interface ModelAttributeColumnOptions<M extends SequelizeModel = SequelizeModel> extends ColumnOptions {
    dependencies?: SequelizeDependency<M>[];
  }

  /**
   * Adds type-safety support to our extension for 'includeAs' in 'virtual columns'.
   */
  export interface VirtualDataTypeConstructor extends AbstractDataTypeConstructor {
    new <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback,
    ): VirtualDataType<T>;
    <T extends AbstractDataTypeConstructor | AbstractDataType>(
      ReturnType: T,
      fields?: string[] | IncludeAsCallback,
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