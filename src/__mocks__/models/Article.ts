import { DataTypes, Model } from "sequelize";
import Comment from "./Comment";
import { sequelize } from "../connection";
import User from "./User";

class Article extends Model { }

Article.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  slug: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  body: DataTypes.STRING,
  categoryId: DataTypes.INTEGER,
  authorId: DataTypes.INTEGER,
}, {
  sequelize,
  modelName: 'Article',
});

Article.belongsTo(User, { foreignKey: 'authorId', as: 'owner' });
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });


export default Article;