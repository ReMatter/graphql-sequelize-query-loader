import { expect } from "chai";
import ArticleModel from "./__mocks__/models/Article";
import AuthorModel from "./__mocks__/models/Author";
import { buildFilter } from "./buildFilter";
import { Op, literal } from "sequelize";

describe("buildFilter", () => {
  it("returns an empty array when no filters are provided", () => {
    const filter = buildFilter(ArticleModel, undefined);
    expect(filter).to.eql([]);
  });

  it("returns an empty array when filters are empty object", () => {
    const filter = buildFilter(ArticleModel, {});
    expect(filter).to.eql([]);
  });

  it("returns a filter for scalar value", () => {
    const filter = buildFilter(ArticleModel, { id: 5 });
    expect(filter).to.eql([{ id: 5 }]);
  });

  it("returns a filter for Op.ne", () => {
    const filter = buildFilter(ArticleModel, {
      authorId: { [Op.ne]: 4 },
    });
    expect(filter).to.eql([{ authorId: { [Op.ne]: 4 } }]);
  });

  it("returns a filter for $syntax$", () => {
    const filter = buildFilter(ArticleModel, {
      "$comments.articledId$": 5,
    });
    expect(filter).to.eql([{ "$comments.articledId$": 5 }]);
  });

  it("returns a filter for computed attribute", () => {
    const filter = buildFilter(AuthorModel, {
      publishedQuantity: { [Op.gt]: 5 },
    });
    expect(filter).to.eql([
      literal(
        "((SELECT COUNT(*) FROM article WHERE article.authorId = Author.id)) > 5"
      ),
    ]);
  });

  it("returns a filter for literal", () => {
    const lit = literal(
      `EXISTS (
          SELECT 1
          FROM comment
          WHERE comment.articleId = 5
        )`
    );

    const filter = buildFilter(ArticleModel, {
      "": lit,
    });
    expect(filter).to.eql([{ "": lit }]);
  });
});
