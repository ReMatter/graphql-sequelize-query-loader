import { BooleanValueNode, FieldNode, GraphQLResolveInfo } from "graphql";
import { Model, ModelStatic } from "sequelize";
import { ComputedQueries, unwrapPaginatedSelections } from "./util";
import { BaseFindOptions, CustomFieldFilters, DependenciesByFieldNameByModelName, ModelAssociationMap } from "./types";
import { getWhereOptions } from "./getWhereOptions";
import { getSelectedAttributes } from "./getSelectedAttributes";
import { getSelectedIncludes } from "./getSelectedIncludes";

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
  customFieldFilters: CustomFieldFilters,
  variables?: GraphQLResolveInfo['variableValues'];
  root?: boolean;
  fragments?: GraphQLResolveInfo['fragments'];
  computedQueries?: ComputedQueries<unknown, unknown>;
}): BaseFindOptions<M> {
  const { model, selection, dependenciesByFieldNameByModelName,  modelsByAssociationByModelName, customFieldFilters, variables, root, fragments, computedQueries } = args;

  // Downcasting from SelectionNode to FieldNode
  const selections = root
    ? unwrapPaginatedSelections(selection)
    : selection.selectionSet?.selections;

  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  const selectionsWithFragmentsReplaced = selections.flatMap((rawSelection) => {
    const isFragment = rawSelection.kind === 'FragmentSpread';
    return isFragment
      ? // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
        fragments[(rawSelection as FieldNode).name.value]?.selectionSet.selections
      : rawSelection;
  }) as readonly FieldNode[];

  const attributes = getSelectedAttributes({
    model,
    selections: selectionsWithFragmentsReplaced,
    variables,
    computedQueries,
  });

  const include = getSelectedIncludes({
    model,
    selections: selectionsWithFragmentsReplaced,
    dependenciesByFieldNameByModelName,
    modelsByAssociationByModelName,
    variables,
    fragments,
  });

  const where = getWhereOptions(model, selection, variables, customFieldFilters);

  const getBooleanArgumentByName = (name: string) => {
    // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
    const argument = selection.arguments.find((arg) => arg.name.value === name);
    return (argument?.value as BooleanValueNode | null)?.value;
  };

  const paranoid = getBooleanArgumentByName('paranoid');
  const required = getBooleanArgumentByName('required');

  return {
    attributes,
    include,
    where,
    paranoid,
    required,
  };
}