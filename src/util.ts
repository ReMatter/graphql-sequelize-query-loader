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
  [key in keyof T]: ({ ...args }: U) => Literal;
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

/**
 * Allow to obtain the list of computed attributes, useful for (automatically) projecting, filtering, and
 * ordering based on virtual fields, which don't exist in the tables but whose value is calculated using
 * expressions (like SQL functions, sub SQL queries, among others).
 * This function uses 'reflect-metadata' under the hood.
 * @param model the sequelize entity class representing the table in the DB
 * @param includedAs name of the property where this model is included (defaults to model's name)
 * @returns list of computed attributes
 */
export function getComputedAttributes<M extends Model>(
  model?: ModelStatic<M>,
  includedAs = model?.name,
): ComputedAttributes<M> {
  if (!model) {
    return {};
  }

  // const attributes = getAttributes<M>(model.prototype);
  const attributes = model.getAttributes();

  return Object.keys(attributes).reduce((acc, key) => {
    const meta = attributes[key];
    if (meta.type instanceof DataTypes.VIRTUAL) {
      const callback: IncludeAsCallback = meta.type.fields;
      if (typeof callback === 'function') {
        const [expression] = callback(includedAs as string);
        acc[key] = expression;
      }
    }
    return acc;
  }, {} as ComputedAttributes<M>);
}