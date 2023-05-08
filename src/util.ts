import { SelectionNode, FieldNode, ArgumentNode, VariableNode } from 'graphql';
import {
  Op,
  Model,
  ModelStatic,
  DataTypes,
} from 'sequelize';
import { ComputedAttributes, IncludeAsCallback } from './types';
import { Literal } from 'sequelize/types/utils';

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
  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  const selections = field.selectionSet.selections as FieldNode[];
  const edges = selections.find((selection) => selection.name.value === 'edges');

  if (!edges) {
    return selections;
  }

  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  const node = edges.selectionSet.selections.find(
    (selection: FieldNode) => selection.name.value === 'node',
  ) as FieldNode;
  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  return node.selectionSet.selections;
}

export type ComputedQueries<T, U> = {
  [key in keyof Partial<T>]: ({ ...args }: U) => Literal;
};

export const extractComputedAttribute: <T>(
  ...args: [T, unknown, unknown, { fieldNodes: FieldNode[] }]
) => number | string | Date = (...[entity, , , { fieldNodes }]) =>
  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  entity[fieldNodes[0].alias.value];

export const getComputedQueryVariables = (fieldNode: FieldNode) =>
  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  fieldNode.arguments.map((a) => [
    a.name.value,
    ((a as ArgumentNode).value as VariableNode).name.value,
  ]);