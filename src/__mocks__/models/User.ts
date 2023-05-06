import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection";

class User extends Model { }

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  firstname: DataTypes.STRING,
  lastname: DataTypes.INTEGER,
}, {
  sequelize,
  modelName: 'User',
});

export default User;
