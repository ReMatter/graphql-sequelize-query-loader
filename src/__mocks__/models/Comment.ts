import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection";

class Comment extends Model {}

Comment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    body: DataTypes.STRING,
    articleId: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: "Comment",
  }
);

export default Comment;
