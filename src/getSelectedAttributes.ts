/**
 * Return an array of all the includes to be carried out
 * based on the schema sent in the request from graphql
 *
 * @remarks
 * This method is called `recursively` to prepare the included models
 * for all nodes with nested or associated resource(s)
 *
 * @param model - a specific model that should be checked for selected includes
 * @param selections - an array of the selection nodes for each field in the schema.
 * @returns the array that should contain all model and association-model includes
 */

import {
  FieldNode,
  GraphQLResolveInfo,
  SelectionNode,
  VariableNode,
} from "graphql";
import {
  FindAttributeOptions,
  Model,
  ModelStatic,
  ProjectionAlias,
} from "sequelize";
import { ComputedQueries } from "./types";

// TODO fix this, it fails if the computed query has arguments in place
// ie numJobs: numJobs(afterDate: $afterDate) works
// numJobs: numJobs(afterDate: "2021-01-01") fails
const getComputedQueryVariables = (fieldNode: FieldNode) =>
  fieldNode.arguments?.map((a) => [
    a.name.value,
    (a.value as VariableNode).name.value,
  ]) ?? [];

export function getSelectedAttributes<M extends Model>(args: {
  model: ModelStatic<M>;
  selections: ReadonlyArray<SelectionNode> | undefined;
  variables?: GraphQLResolveInfo["variableValues"];
  computedQueries?: ComputedQueries<unknown, unknown>;
}): FindAttributeOptions {
  const { model, selections, variables, computedQueries } = args;
  /**
   * Request schema can sometimes have fields that do not exist in the table for the Model requested.
   * Here, we get all model attributes and check the request schema for fields that exist as
   * attributes for that model.
   * Those are the attributes that should be passed to the sequelize "select" query
   */

  // Initialize the list of selected attributes. Use a set to avoid duplicates
  const selectedAttributes = new Set<string | ProjectionAlias>();

  // Get the field names for the model
  const modelAttributes = Object.keys(model.rawAttributes);

  // these attributes are not part of the model but there are queries to compute them
  const computedAttributes: FieldNode[] = [];

  const associations = Object.keys(model.associations);

  // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
  selections.forEach((item) => {
    const selection = item as FieldNode;
    const fieldName = selection.name.value;
    const isModelAttribute = modelAttributes.find((attr) => attr === fieldName);
    const hasSubSelection = selection.selectionSet !== undefined;

    if (isModelAttribute && !hasSubSelection) {
      selectedAttributes.add(fieldName);
    } else if (computedQueries?.[fieldName]) {
      // if it is not part of the model and we know how to compute it, let's do that
      computedAttributes.push(selection);
    } else if (associations.includes(fieldName)) {
      const { sourceKey } = model.associations[fieldName];
      if (sourceKey) {
        selectedAttributes.add(sourceKey);
      }
    }
  });

  computedAttributes.forEach((attribute) => {
    const computedQueryVars = getComputedQueryVariables(attribute);
    const {
      // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'NameNode ... Remove this comment to see the full error message
      alias: { value: computedAttributeName },
      name: { value: computedAttributeQueryName },
    } = attribute;
    // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
    const computedQuery = computedQueries[computedAttributeQueryName];
    const vars = computedQueryVars.map(([nameInMethod, nameInVariables]) => ({
      // @ts-expect-error TS(2532) FIXME: Object is possibly 'undefined'.
      [nameInMethod]: variables[nameInVariables],
    }));
    // we are pushing [query: literal(), attributeName: string]
    selectedAttributes.add([
      computedQuery(Object.assign({}, ...vars)),
      computedAttributeName,
    ]);
  });

  // Always include the primary key of the model
  selectedAttributes.add(model.primaryKeyAttribute);

  return [...selectedAttributes] as FindAttributeOptions;
}
