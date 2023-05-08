import { DataTypes, Model, literal } from "sequelize";
import { sequelize } from "../connection";

class Author extends Model { }

Author.init({
  id: { type: DataTypes.INTEGER, primaryKey: true },
  firstname: DataTypes.STRING,
  lastname: DataTypes.STRING,
  publishedQuantity: {type: DataTypes.VIRTUAL(DataTypes.NUMBER, (includeAs: string) => [
    literal(`(SELECT COUNT(*) FROM article WHERE article.authorId = ${includeAs}.id)`),
    'publishedQuantity',
  ])}
}, {
  sequelize,
  modelName: 'Author',
});

export default Author;
