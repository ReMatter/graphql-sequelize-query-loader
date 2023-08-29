import { FieldNode, GraphQLResolveInfo } from "graphql";
import { IncludeOptions, Model, ModelStatic } from "sequelize";
import { getIncludeModel } from "./getIncludeModel";
import { getFindOptionsForModel } from "./getFindOptionsForModel";
import {
  CustomFieldFilters,
  DependenciesByFieldNameByModelName,
  ModelAssociationMap,
} from "../QueryLoader";

/**
 * Return an array of all the includes to be carried out
 * based on the schema sent in the request from graphql
 *
 * Paths for including models:
 * 1) a dependant selected field, eg payload.assetName needs to pull in Asset to get the asset's name.
 *   This is custom logic that we have specified in the columns decorator in model files (eg models/Payload)
 * 2) A regular graphql association, (eg, Job -> JobLocations), also specified in a column decorator
 *
 * Note: Sequelize does not care if an association is included twice
 *
 * @param args
 * @param args.selections - an array of the selection nodes for each field in the schema.
 * @param args.variables - queryVariables, relevant to the entire request
 *
 * @returns the array that should contain all model and association-model includes
 */
export function getSelectedIncludes<M extends Model>(args: {
  model: ModelStatic<M>;
  selections: readonly FieldNode[];
  dependenciesByFieldNameByModelName: DependenciesByFieldNameByModelName;
  modelsByAssociationByModelName: ModelAssociationMap;
  customFieldFilters: CustomFieldFilters;
  variables?: GraphQLResolveInfo["variableValues"];
  fragments?: GraphQLResolveInfo["fragments"];
}): IncludeOptions[] {
  const {
    model,
    selections,
    dependenciesByFieldNameByModelName,
    modelsByAssociationByModelName,
    customFieldFilters,
    variables,
    fragments,
  } = args;

  // Method 1: Include associations if dependent fields are requested
  const includesFromDependantSelectedFields: IncludeOptions[] = selections
    .filter(
      (selection) =>
        dependenciesByFieldNameByModelName[model.name]?.[selection.name.value],
    )
    .flatMap((selection) => {
      const fieldName = selection.name.value;

      return dependenciesByFieldNameByModelName[model.name]?.[fieldName].map(
        (dependency) => ({
          model: getIncludeModel(
            model,
            dependency.dependentAssociation as string,
            modelsByAssociationByModelName,
          ),
          as: dependency.dependentAssociation as string,
          paranoid: dependency.paranoid,
        }),
      );
    });

  // Method 2: Include all associations
  const includesFromAssociatedModels = selections
    .filter((selection: FieldNode) => {
      // Don't include fields that aren't objects (can't be associated)
      if (!selection.selectionSet?.selections) {
        return false;
      }

      // Make sure that we don't include undefined models
      const fieldName: string = selection.name.value;
      const includedModel = getIncludeModel(
        model,
        fieldName,
        modelsByAssociationByModelName,
      );
      if (!includedModel) {
        console.warn(
          `Graphql trying to include undefined model "${fieldName}" on base model "${model.tableName}"`,
        );
      }
      return !!includedModel;
    })
    .map((selection: FieldNode) => {
      const fieldName: string = selection.name.value;
      const includedModel = getIncludeModel(
        model,
        fieldName,
        modelsByAssociationByModelName,
      );

      const { attributes, include, where, paranoid, required } =
        getFindOptionsForModel({
          model: includedModel,
          selection,
          dependenciesByFieldNameByModelName,
          modelsByAssociationByModelName,
          customFieldFilters,
          variables,
          fragments,
        });

      const includeOption: IncludeOptions = {
        as: fieldName,
        model: includedModel,
        attributes,
        required: required ?? false,
        ...(paranoid != null ? { paranoid } : {}),
        ...(Object.entries(where).length ? { where } : {}),
        ...(include.length ? { include } : {}),
      };

      return includeOption;
    });

  return [
    ...includesFromDependantSelectedFields,
    ...includesFromAssociatedModels,
  ];
}
