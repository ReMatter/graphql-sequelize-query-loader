import { getSearchExpressionFilters } from "./getSearchExpressionFilters";
import ArticleModel from "../../test/models/Article";
import { expect } from "chai";
import { describe, it } from "node:test";

import { Op, literal } from "sequelize";

describe("getSearchExpressionFilters", () => {
  it("should handle empty search term", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title"], searchTerm: "" }],
        ArticleModel
      )
    ).to.eql({});
  });

  it("should make a simple search over one field", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title"], searchTerm: "dog" }],
        ArticleModel
      )
    ).to.eql({
      [Op.and]: [{ [Op.or]: [{}, { title: { [Op.like]: "%dog%" } }] }],
    });
  });

  it("should make a simple search over multiple string fields", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title", "description"], searchTerm: "dog" }],
        ArticleModel
      )
    ).to.eql({
      [Op.and]: [
        {
          [Op.or]: [
            {},
            { title: { [Op.like]: "%dog%" } },
            { description: { [Op.like]: "%dog%" } },
          ],
        },
      ],
    });
  });

  it("should use the custom expresion if defined overriding field using literal", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title"], searchTerm: "dog" }],
        ArticleModel,
        {
          title: (searchTerm) =>
            literal(
              `SELECT EXISTS( SELECT 1 FROM article WHERE title LIKE '%${searchTerm}%'`
            ),
        }
      )
    ).to.eql({
      [Op.and]: [
        {
          [Op.or]: [
            {},
            [
              {},
              literal(
                `SELECT EXISTS( SELECT 1 FROM article WHERE title LIKE '%dog%'`
              ),
            ],
          ],
        },
      ],
    });
  });

  it("should use the custom expresion if defined overriding field using literal and respect other fields", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title", "description"], searchTerm: "dog" }],
        ArticleModel,
        {
          title: (searchTerm) =>
            literal(
              `SELECT EXISTS( SELECT 1 FROM article WHERE article.id = article.id AND title LIKE '%${searchTerm}%'`
            ),
        }
      )
    ).to.eql({
      [Op.and]: [
        {
          [Op.or]: [
            {},
            [
              {},
              literal(
                `SELECT EXISTS( SELECT 1 FROM article WHERE article.id = article.id AND title LIKE '%dog%'`
              ),
            ],
            { description: { [Op.like]: "%dog%" } },
          ],
        },
      ],
    });
  });

  it("should use the custom expresion if defined overriding field", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["title"], searchTerm: "dog" }],
        ArticleModel,
        {
          // TODO if we allow navigation through $$ like $comments.body$ we should auto include that model.
          // Make integration tests for that.
          title: (searchTerm) => ({
            [Op.or]: [
              { title: { [Op.like]: `%${searchTerm}%` } },
              { description: { [Op.like]: `%${searchTerm}%` } },
            ],
          }),
        }
      )
    ).to.eql({
      [Op.and]: [
        {
          [Op.or]: [
            {},
            [
              {},
              {
                [Op.or]: [
                  { title: { [Op.like]: "%dog%" } },
                  { description: { [Op.like]: "%dog%" } },
                ],
              },
            ],
          ],
        },
      ],
    });
  });

  // TODO integration test for auto including navigation
  it("should allow aliasing $navigation.syntax$", () => {
    expect(
      getSearchExpressionFilters(
        [{ fields: ["ownerName"], searchTerm: "pete" }],
        ArticleModel,
        { ownerName: "$owner.name$" }
      )
    ).to.eql({
      [Op.and]: [
        {
          [Op.or]: [
            {},
            {
              "$owner.name$": "pete",
            },
          ],
        },
      ],
    });
  });
});
