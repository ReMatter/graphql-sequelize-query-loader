import { FieldNode } from 'graphql';

export const extractComputedAttribute: <T extends Record<string, any>>(
  ...args: [T, unknown, unknown, { fieldNodes: FieldNode[] }]
) => number | string | Date = (...[entity, , , { fieldNodes }]) =>
    entity[fieldNodes[0].alias?.value as string];
