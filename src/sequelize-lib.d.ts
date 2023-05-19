declare module "sequelize/lib/sql-string" {
  type Escapable = undefined | null | boolean | number | string | Date;

  export function escape(
    val: Escapable | Escapable[],
    timeZone?: string,
    dialect?: string,
    format?: boolean
  ): string;
}

declare module "sequelize/lib/dialects/abstract/query-generator/operators" {
  type OpTypes = import("sequelize/types/operators");
  export const OperatorMap: {
    [x: OpTypes]: string;
  };
}
