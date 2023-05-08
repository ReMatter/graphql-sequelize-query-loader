import { DataTypes, Model } from "sequelize";
import Comment from "./Comment";
import { sequelize } from "../connection";
import Author from "./Author";

class Article extends Model { }

Article.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  slug: DataTypes.STRING,
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  releaseDate: DataTypes.DATE,
  body: DataTypes.STRING,
  categoryId: DataTypes.INTEGER,
  authorId: DataTypes.INTEGER,
}, {
  sequelize,
  modelName: 'Article',
});

Article.belongsTo(Author, { foreignKey: 'authorId', as: 'owner' });
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });


export default Article;
