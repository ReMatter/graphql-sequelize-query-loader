import { expect } from "chai";
import ArticleModel from "../../src/__mocks__/models/Article";
import AuthorModel from "../../src/__mocks__/models/Author";
import CommentModel from "../../src/__mocks__/models/Comment";
import QueryLoader from "../../src/QueryLoader";
import { buildSchema } from "graphql";
import { getGraphQLResolveInfo } from "../utils/getGraphQLResolveInfo";
import { Op } from "sequelize";

describe("filter", () => {
  const schema = buildSchema(`
    type Query {
      articles: [Article]
    }

    type Article {
      id: ID!
      title: String!
    }
  `);

  const includeModels = {
    ArticleModel,
    CommentModel,
    AuthorModel,
  };

  const queryLoader = new QueryLoader(includeModels);

  it("should filter using a customSearchExpressions that is a function that returns a WhereAttributeHash", async () => {
    await ArticleModel.sync();
    await AuthorModel.sync();
    await CommentModel.sync();

    await ArticleModel.bulkCreate([
      {
        title: "first article",
      },
      {
        title: "second article",
      },
    ]);

    const query = `
        query {
          articles {
            id
            title
          }
        }
      `;
    const info = getGraphQLResolveInfo(schema, query);
    const options = queryLoader.getFindOptions({
      info,
      model: ArticleModel,
      searchExpressions: [{ fields: ["title"], searchTerm: "first" }],
      customSearchExpressions: {
        title: (searchTerm) => ({
          [Op.or]: [
            { title: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } },
          ],
        }),
      },
    });

    const count = await ArticleModel.count(options);

    expect(count).to.equal(1);
  });
});
