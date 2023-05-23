declare module "graphql/execution/collectFields" {
  export function collectFields(
    schema: GraphQLSchema,
    fragments: ObjMap<FragmentDefinitionNode>,
    variableValues: {
      [variable: string]: unknown;
    },
    runtimeType: GraphQLObjectType,
    selectionSet: SelectionSetNode
  ): Map<string, ReadonlyArray<FieldNode>>;
}

declare module "sequelize/lib/dialects/abstract/query-generator/operators" {
  type OpTypes = import("sequelize/types/operators");
  export const OperatorMap: {
    [x: OpTypes]: string;
  };
}
