import { FieldNode, GraphQLResolveInfo, StringValueNode } from "graphql";
import { Model, ModelStatic, WhereOptions } from "sequelize";
import { getValidScopeString } from "./getValidScopeString";
import { sequelizeOperators } from "./util";
import { CustomFieldFilters } from "./types";
import { getWhereOptionsFromCustomFieldFilters } from "./getWhereOptionsFromCustomFieldFilters";

/**
   * Populate the where field in the FindOptions.
   *
   * Paths for creating where variables:
   * 1) From the original library, use a scope, as outlined below. As of June 2, 2021, we do not use this path.
   * 2) Using the customFieldFilters, exported from various model files (see models/Truck or models/Trailer)
   *
   * @param model
   * @param selection
   * @param variables - query variables, these are relevant to the entire request
   *
   * @returns
   */
export function getWhereOptions<M extends Model>(
  model: ModelStatic<M>,
  selection: FieldNode,
  variables: GraphQLResolveInfo['variableValues'],
  customFieldFilters: CustomFieldFilters,
): WhereOptions<M> {
  const scopeArgument = selection.arguments?.find((arg) => arg.name.value === 'scope');

  /**
   * we split with `&&` because we can multiple constraints
   * for example we can the scope argument as a string like the following
   * `id|like|%introduction% && published|eq|true`
   *
   * This would be the case for a GraphQL query like the one below
   * ```js
   * articles(scope: "id|like|%introduction% && published|eq|true") {
   *   id
   *   body
   * }
   */
  const whereOptionsFromScopeArgument =
    (scopeArgument?.value as StringValueNode)?.value
      ?.split('&&')
      .reduce((acc, fieldConditionString) => {
        const splitString = getValidScopeString(fieldConditionString);
        let field = splitString[0].trim();
        if (field.includes('.')) {
          const [associationName, fieldName] = field.split('.');
          if (!model.associations[associationName]) {
            throw new Error(`Cannot navigate to non existent association ${associationName}`);
          }
          field = `$${selection.name.value}->${model.associations[associationName].target.tableName}.${fieldName}$`;
        }
        const operation = splitString[1].trim();
        const value = splitString[2].trim();
        const sequelizeOperator = sequelizeOperators[operation];

        return { ...acc, [field]: { [sequelizeOperator]: value === 'null' ? null : value } };
      }, {}) ?? {};

  const whereOptionsFromCustomFieldFilters = getWhereOptionsFromCustomFieldFilters(
    model,
    selection,
    variables,
    customFieldFilters,
  );

  return { ...whereOptionsFromScopeArgument, ...whereOptionsFromCustomFieldFilters };
}
