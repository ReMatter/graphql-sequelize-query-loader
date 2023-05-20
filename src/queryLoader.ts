import { GraphQLResolveInfo } from "graphql";
import {
  Attributes,
  FindOptions,
  IncludeOptions,
  Model,
  ModelStatic,
  Op,
  Order,
  OrderItem,
  ProjectionAlias,
  WhereOptions,
} from "sequelize";

import {
  getSearchExpressionFilters,
  CustomSearchExpressions,
} from "./getSearchExpressionFilters";

import { buildFilter, mergeFilter } from "./buildFilter";
import { buildOrder } from "./buildOrder";
import {
  SearchExpression,
  Sorter,
  Maybe,
  DependenciesByFieldNameByModelName,
  ModelAssociationMap,
  CustomFieldFilters,
  ComputedQueries,
} from "./types";
import { getIncludeModel } from "./getIncludeModel";
import { getFindOptionsForModel } from "./getFindOptionsForModel";

interface ModelDict {
  [modelName: string]: ModelStatic<Model>;
}

type QueryLoaderFindOptions<M> = Omit<FindOptions<M>, "include"> & {
  include?: IncludeOptions[];
};

class QueryLoader {
  private readonly modelsByAssociationByModelName: ModelAssociationMap = {};

  private readonly customFieldFilters: CustomFieldFilters = {};

  private readonly dependenciesByFieldNameByModelName: DependenciesByFieldNameByModelName =
    {};

  private readonly defaultSorters: (Sorter | OrderItem)[] = [];

  /**
   * Initialize the queryLoader utility
   */
  constructor(
    private readonly models: ModelDict,
    options?: {
      defaultSorters?: readonly (Sorter | OrderItem)[];
      customFieldFilters?: CustomFieldFilters;
    }
  ) {
    const includeModels: ModelAssociationMap = Object.values(models).reduce(
      (acc, model) => ({
        [model.tableName]: {
          ...Object.values(model.associations).reduce(
            (associationAcc, association) => ({
              [association.as]: association.target,
              ...associationAcc,
            }),
            {}
          ),
        },
        ...acc,
      }),
      {}
    );

    const dependenciesByFieldNameByModelName = Object.values(models).reduce(
      (acc, model) => {
        const modelAttributes = model.getAttributes();
        const dependenciesByFieldName = Object.entries(modelAttributes)
          .filter(([, attributes]) => attributes.dependencies)
          .reduce(
            (dependencyAcc, [columnName, attributes]) => ({
              ...dependencyAcc,
              [columnName]: attributes.dependencies,
            }),
            {}
          );

        return {
          ...acc,
          [model.name]: dependenciesByFieldName,
        };
      },
      {}
    );

    this.modelsByAssociationByModelName = includeModels;
    this.customFieldFilters = options?.customFieldFilters ?? {};
    this.dependenciesByFieldNameByModelName =
      dependenciesByFieldNameByModelName;
    this.defaultSorters.push(...(options?.defaultSorters ?? []));
  }

  /**
   * This is the only method that clients should be calling. It does not call itself recursively.
   * Filter, searchExpressions, sorters, are only applied at the root level of the result, not in any of the includes.
   *
   * @param args
   * @param args.model - the root model of the query
   * @param args.info - received from graphql after parsing the JSON.
   *   It has a structure that we can parse or analyse, to determine the attributes to be selected from the database
   *   as well as the associated models to be included using sequelize include
   *
   * @returns the query options to be used in a Model.findAll({ ... }) method call
   */
  getFindOptions<M extends Model>(args: {
    model: ModelStatic<M>;
    info: GraphQLResolveInfo;
    filter?: WhereOptions<Attributes<M>>;
    searchExpressions?: Maybe<readonly SearchExpression[]>;
    sorters?: readonly (Sorter | OrderItem)[];
    customSorters?: { [key: string]: Order };
    computedQueries?: ComputedQueries<unknown, unknown>;
    customSearchExpressions?: CustomSearchExpressions;
    requiredIncludes?: IncludeOptions[];
  }): QueryLoaderFindOptions<M> {
    const {
      model: rootModel,
      info,
      filter,
      searchExpressions,
      sorters = this.defaultSorters,
      customSorters,
      computedQueries,
      customSearchExpressions,
      requiredIncludes,
    } = args;

    const rootSelection = info.fieldNodes[0];
    const { attributes, include, where, paranoid } = getFindOptionsForModel({
      model: rootModel,
      selection: rootSelection,
      dependenciesByFieldNameByModelName:
        this.dependenciesByFieldNameByModelName,
      modelsByAssociationByModelName: this.modelsByAssociationByModelName,
      customFieldFilters: this.customFieldFilters,
      variables: info.variableValues,
      root: true,
      fragments: info.fragments,
      computedQueries,
    });

    // TODO we should remove this in favor of computing which are the required includes
    // based on the fields that are being selected, filtering, sorting, etc.
    if (requiredIncludes?.length) {
      const associationNames = include.map(({ as }) => as);

      requiredIncludes.forEach((includeable) => {
        const associationName = includeable.as;

        if (!associationNames.includes(associationName)) {
          include.push(includeable);
        }
      });
    }

    const includesWithFilter: IncludeOptions[] = [];

    if (filter) {
      // Look up for filters meant for includes, assign them to the include and exclude them from the root filter
      include.forEach((includeable) => {
        const associationName = includeable.as as string;
        const associationFilter = filter[associationName];

        if (associationFilter) {
          const associationModel = getIncludeModel(
            rootModel,
            associationName,
            this.modelsByAssociationByModelName
          );

          includesWithFilter.push({
            ...includeable,
            where: {
              [Op.and]: buildFilter(
                associationModel,
                associationFilter,
                associationName
              ) as unknown as WhereOptions,
            },
          });

          delete filter[associationName];
        } else {
          includesWithFilter.push(includeable);
        }
      });
    }

    const conditions = buildFilter(rootModel, filter);

    const findOptions: QueryLoaderFindOptions<M> = {
      attributes,
      include: filter ? includesWithFilter : include,
      ...(paranoid ? { paranoid } : {}),
      where: filter ? { [Op.and]: conditions } : {},
    };

    // @ts-expect-error TS(2345) FIXME: Argument of type 'WhereOptions<M> | undefined' is ... Remove this comment to see the full error message
    findOptions.where = mergeFilter(findOptions.where, where);

    if (searchExpressions || customSearchExpressions) {
      const expressionFilters = getSearchExpressionFilters(
        // @ts-expect-error TS(2345) FIXME: Argument of type 'Maybe<readonly SearchExpression[... Remove this comment to see the full error message
        searchExpressions,
        customSearchExpressions,
        rootModel
      );
      findOptions.where = mergeFilter(findOptions.where, expressionFilters);
    }

    if (sorters?.length) {
      const order = buildOrder(rootModel, sorters, customSorters);
      findOptions.order = order;
      // allow sorting by fields of the entity that are not being requested
      if (Array.isArray(findOptions.attributes)) {
        findOptions.attributes.push(
          ...order
            // We're only interested in sorters that can be added as attributes of the root model
            // and those have the following pattern: ['fieldName', 'DESC | ASC'].
            // Some sorter arrays might have length > 2 and those are for more complex sorting,
            // such as sorting by nested fields, and we need to ignore them to not break the select.
            .filter(
              (o) =>
                Array.isArray(o) && o.length === 2 && typeof o[0] === "string"
            )
            .map((field: OrderItem) => (field as [string, any])[0])
            .filter(
              (fieldName) =>
                !(
                  findOptions.attributes as (string | ProjectionAlias)[]
                ).includes(fieldName)
            )
        );
      }
    }

    return findOptions;
  }
}

export default QueryLoader;
