import { Model, ModelStatic } from "sequelize";
import { ModelAssociationMap } from "./types";

export function getIncludeModel(model: ModelStatic<Model>, fieldName: string, modelsByAssociationByModelName: ModelAssociationMap): ModelStatic<Model> {
  return modelsByAssociationByModelName[model.tableName][fieldName];
}