import { DataTypes, Model } from "sequelize";
import Article from "./Article";
import { sequelize } from "../connection";


class Category extends Model { }

Category.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING,
}, {
  sequelize,
  modelName: 'Category',
});

Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });
Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articleArchive' });

export default Category;
