import { SelectionNode, FieldNode, ArgumentNode, VariableNode } from 'graphql';
import { Op } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

const isFieldNode = (node: SelectionNode): node is FieldNode =>
  'name' in node && node.name.value === 'node';

/**
 * Dictionary of available query scope operators
 * and their equivalent sequelize operators
 */
export const sequelizeOperators: Record<string, symbol> = {
  eq: Op.eq,
  gt: Op.gt,
  gte: Op.gte,
  like: Op.like,
  lt: Op.lt,
  lte: Op.lte,
  ne: Op.ne,
  is: Op.is,
  not: Op.not,
} as const;

// Unwraps our paginated graphql request format
export function unwrapPaginatedSelections(field: FieldNode): readonly SelectionNode[] {
  const selections = (field.selectionSet?.selections ?? []) as FieldNode[];
  const edges = selections.find((selection) => selection.name.value === 'edges');

  if (!edges) {
    return selections;
  }

  const node = edges.selectionSet?.selections.find(isFieldNode);
  return node?.selectionSet?.selections ?? [];
}

export type ComputedQueries<T, U> = {
  [key in keyof Partial<T>]: ({ ...args }: U) => Literal;
};

export const extractComputedAttribute: <T extends Record<string, any>>(
  ...args: [T, unknown, unknown, { fieldNodes: FieldNode[] }]
) => number | string | Date = (...[entity, , , { fieldNodes }]) =>
    entity[fieldNodes[0].alias?.value as string];

export const getComputedQueryVariables = (fieldNode: FieldNode) =>
  fieldNode.arguments?.map((a) => [
    a.name.value,
    ((a as ArgumentNode).value as VariableNode).name.value,
  ]) ?? [];