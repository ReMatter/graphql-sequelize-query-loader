import {
  BooleanValueNode,
  FieldNode,
  GraphQLResolveInfo,
  Kind,
  SelectionNode,
} from "graphql";
import {
  FindAttributeOptions,
  IncludeOptions,
  Model,
  ModelStatic,
  WhereOptions,
} from "sequelize";
import { getWhereOptions } from "./getWhereOptions";
import { getSelectedAttributes } from "./getSelectedAttributes";
import { getSelectedIncludes } from "./getSelectedIncludes";
import {
  ComputedQueries,
  CustomFieldFilters,
  DependenciesByFieldNameByModelName,
  ModelAssociationMap,
} from "../QueryLoader";

type BaseFindOptions<M extends Model> = {
  attributes: FindAttributeOptions;
  where: WhereOptions<M>;
  include: IncludeOptions[];
  paranoid?: boolean;
  required?: boolean;
};

/**
 * Helper function, called by both the root `getFindOptions` (called by client) and the
 * recursive `getSelectedIncludes` method (called internally)
 *
 * @returns BaseFindOptions for a model.
 */
export function getFindOptionsForModel<M extends Model>(args: {
  model: ModelStatic<M>;
  selection: FieldNode;
  dependenciesByFieldNameByModelName: DependenciesByFieldNameByModelName;
  modelsByAssociationByModelName: ModelAssociationMap;
  customFieldFilters: CustomFieldFilters;
  variables?: GraphQLResolveInfo["variableValues"];
  root?: boolean;
  fragments?: GraphQLResolveInfo["fragments"];
  computedQueries?: ComputedQueries<unknown, unknown>;
}): BaseFindOptions<M> {
  const {
    model,
    selection,
    dependenciesByFieldNameByModelName,
    modelsByAssociationByModelName,
    customFieldFilters,
    variables = {},
    root,
    fragments,
    computedQueries,
  } = args;

  // Downcasting from SelectionNode to FieldNode
  const selections = root
    ? unwrapPaginatedSelections(selection)
    : selection.selectionSet?.selections;

  const selectionsWithFragmentsReplaced = selections?.flatMap(
    (rawSelection) => {
      const isFragment = rawSelection.kind === Kind.FRAGMENT_SPREAD;
      return (
        isFragment
          ? fragments?.[rawSelection.name.value]?.selectionSet.selections
          : rawSelection
      ) as FieldNode;
    },
  );

  const attributes = getSelectedAttributes({
    model,
    selections: selectionsWithFragmentsReplaced,
    variables,
    computedQueries,
  });

  const include = getSelectedIncludes({
    model,
    selections: selectionsWithFragmentsReplaced as readonly FieldNode[],
    dependenciesByFieldNameByModelName,
    modelsByAssociationByModelName,
    customFieldFilters,
    variables,
    fragments,
  });

  const where = getWhereOptions(
    model,
    selection,
    variables,
    customFieldFilters,
  );

  const getBooleanArgumentByName = (name: string) => {
    const argument = selection.arguments?.find(
      (arg) => arg.name.value === name,
    );
    return (argument?.value as BooleanValueNode | null)?.value;
  };

  const paranoid = getBooleanArgumentByName("paranoid");
  const required = getBooleanArgumentByName("required");

  return {
    attributes,
    include,
    where,
    paranoid,
    required,
  };
}

const isFieldNode = (node: SelectionNode): node is FieldNode =>
  "name" in node && node.name.value === "node";

// Unwraps our paginated graphql request format
export function unwrapPaginatedSelections(
  field: FieldNode,
): readonly SelectionNode[] {
  const selections = (field.selectionSet?.selections ?? []) as FieldNode[];
  const edges = selections.find(
    (selection) => selection.name.value === "edges",
  );

  if (!edges) {
    return selections;
  }

  const node = edges.selectionSet?.selections.find(isFieldNode);
  return node?.selectionSet?.selections ?? [];
}
