import { FieldNode, GraphQLResolveInfo, ValueNode, VariableNode } from "graphql";
import { Model, ModelStatic, WhereOptions } from "sequelize";
import { CustomFieldFilters } from "./types";


// This type is needed because ValueNode is a Union type and not all of its members have a 'value' property
type MaterializedValueNode = ValueNode & { value: number | boolean | string };

/**
  * Helper method for getWhereOptions to deal exclusively with customFieldFilters
  */
export function getWhereOptionsFromCustomFieldFilters<M extends Model>(
  model: ModelStatic<M>,
  selection: FieldNode,
  variables: GraphQLResolveInfo['variableValues'],
  customFieldFilters: CustomFieldFilters,
): WhereOptions {
  const hasCustomFieldFilters = customFieldFilters[model.tableName]?.[selection.name.value];
  if (!hasCustomFieldFilters) return {};

  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  const customFieldFilterArguments = selection.arguments.reduce(
    (acc, arg) => ({
      ...acc,
      [arg.name.value]:
        (arg.value as MaterializedValueNode).value ??
        variables[(arg.value as VariableNode).name.value],
    }),
    {},
  );

  return customFieldFilters[model.tableName]?.[selection.name.value](
    customFieldFilterArguments,
  );
}