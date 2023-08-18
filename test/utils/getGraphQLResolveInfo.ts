import {
  parse,
  GraphQLField,
  FieldNode,
  GraphQLObjectType,
  GraphQLSchema,
} from "graphql";
import {
  buildResolveInfo,
  ExecutionContext,
  buildExecutionContext,
  getFieldDef,
} from "graphql/execution/execute";
import { addPath } from "graphql/jsutils/Path";
import { collectFields } from "graphql/execution/collectFields";

export const getGraphQLResolveInfo = (schema: GraphQLSchema, query: string) => {
  const document = parse(query);

  const executionContext = buildExecutionContext({
    schema,
    document,
  }) as ExecutionContext;

  const operation = executionContext.operation;

  const rootType = schema.getRootType(operation.operation) as GraphQLObjectType<
    unknown,
    unknown
  >;

  const fields = collectFields(
    executionContext.schema,
    executionContext.fragments,
    executionContext.variableValues,
    rootType,
    operation.selectionSet
  );

  const responseName = [...fields.keys()][0];
  const fieldNodes = fields.get(responseName) as FieldNode[];
  const fieldNode = fieldNodes[0];

  const path = addPath(undefined, responseName, rootType.name);

  const fieldDef = getFieldDef(schema, rootType, fieldNode) as GraphQLField<
    unknown,
    unknown
  >;

  return buildResolveInfo(
    executionContext,
    fieldDef,
    fieldNodes,
    rootType,
    path
  );
};
