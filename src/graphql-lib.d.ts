declare module "sequelize/lib/dialects/abstract/query-generator/operators" {
  type OpTypes = import("sequelize/types/operators");
  export const OperatorMap: {
    [x: OpTypes]: string;
  };
}
