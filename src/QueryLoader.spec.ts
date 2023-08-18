import { expect } from "chai";

import { buildSchema } from "graphql";
import { Op, WhereAttributeHashValue, literal } from "sequelize";
import ArticleModel from "./__mocks__/models/Article";
import CommentModel from "./__mocks__/models/Comment";
import AuthorModel from "./__mocks__/models/Author";
import CategoryModel from "./__mocks__/models/Category";
import QueryLoader from "./QueryLoader";
import { getGraphQLResolveInfo } from "../test/utils/getGraphQLResolveInfo";

describe("QueryLoader", () => {
  const includeModels = {
    ArticleModel,
    CommentModel,
    AuthorModel,
    CategoryModel,
  };
  const queryLoader = new QueryLoader(includeModels);

  const schema = buildSchema(`
    type Query {
      articles: [Article]
      categories: [Category]
      authors: [Author]
    }

    type Author {
      id: ID!
      firstname: String!
      lastname: String!
      publishedQuantity: Int!
    }

    type Article {
      id: ID!
      title: String!
    }

    type Category {
      id: ID!
      name: String!
      articles(from: String, to: String): [Article]
    }
  `);

  describe("getFindOptions", () => {
    it("returns attributes property for the queried fields", () => {
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
      });
      expect(options.attributes).to.eql(["id", "title"]);
    });

    it("returns attributes property for the queried fields with computed queries", () => {
      const query = `
        query {
          authors {
            id
            firstname
            lastname
            publishedQuantity
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: AuthorModel,
      });
      expect(options.attributes).to.eql([
        "id",
        "firstname",
        "lastname",
        "publishedQuantity",
      ]);
    });

    it('returns empty "include" property, when graphql query lacks included selections', () => {
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
      });
      expect(options.include).to.eql([]);
    });

    it('returns non empty with "include" property, when graphql query has included selections', () => {
      const query = `
        query {
          articles {
            id
            owner {
              firstname
            }
            comments {
              body
            }
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      expect(options.include).to.eql([
        {
          as: "owner",
          model: AuthorModel,
          attributes: ["firstname", "id"],
          required: false,
        },
        {
          as: "comments",
          model: CommentModel,
          attributes: ["body", "id"],
          required: false,
        },
      ]);
    });

    it('returns empty "where" when graphql query lacks "scope" argument', () => {
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
      });
      expect(options.where).to.be.empty;
    });

    it('returns "where" conditions, when graphql query has "scope" argument', () => {
      const query = `
        query {
          articles(scope: "id|gt|2") {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      const expectedWhereConstraints: WhereAttributeHashValue<unknown> = {
        id: {
          [Op.gt]: "2",
        },
      };
      expect(options.where).to.eql(expectedWhereConstraints);
    });

    it("uses custom filters if provided", () => {
      const query = `
        query {
          categories {
            id
            name
            articleArchive(from: "2014-01-01" to: "2014-12-31") {
              id
              title
            }
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = new QueryLoader(includeModels, {
        customFieldFilters: {
          Articles: {
            articleArchive: ({ from, to }) => ({
              releaseDate: { [Op.between]: [from, to] },
            }),
          },
        },
      }).getFindOptions({
        info,
        model: CategoryModel,
      });
      expect(options).to.eql({
        attributes: ["id", "name"],
        include: [
          {
            as: "articleArchive",
            attributes: ["id", "title"],
            model: ArticleModel,
            required: false,
            where: {
              releaseDate: { [Op.between]: ["2014-01-01", "2014-12-31"] },
            },
          },
        ],
        where: {},
      });
    });

    it("uses a custom sorter if provided", () => {
      const query = `
        query {
          categories {
            id
            name
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: CategoryModel,
        sorters: [{ field: "size", order: "DESC" }],
        customSorters: {
          size: literal(`(SELECT COUNT(*) FROM articles
        WHERE articler.categoryId = category.id)`),
        },
      });
      expect(options).to.eql({
        attributes: ["id", "name"],
        include: [],
        where: {},
        order: [
          [
            literal(`(SELECT COUNT(*) FROM articles
        WHERE articler.categoryId = category.id)`),
            "DESC",
          ],
        ],
      });
    });

    it("uses the defalt sorter if provided", () => {
      const query = `
        query {
          articles {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = new QueryLoader(includeModels, {
        defaultSorters: [{ field: "createdAt", order: "DESC" }],
      }).getFindOptions({
        info,
        model: ArticleModel,
      });
      expect(options).to.eql({
        attributes: ["id", "title", "createdAt"],
        include: [],
        where: {},
        order: [["createdAt", "DESC"]],
      });
    });

    it("gets findOptions and whereConstraints for deeper shapes", () => {
      const query = `
        query {
          categories {
            id
            name
            articles(scope: "id|gt|2 && body|like|%dummy%") {
              id
              title
              owner {
                firstname
                lastname
              }
              comments {
                id
                body
              }
            }
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: CategoryModel,
      });
      const expectedStructure = {
        attributes: ["id", "name"],
        include: [
          {
            as: "articles",
            attributes: ["id", "title"],
            include: [
              {
                as: "owner",
                attributes: ["firstname", "lastname", "id"],
                model: AuthorModel,
                required: false,
              },
              {
                as: "comments",
                attributes: ["id", "body"],
                model: CommentModel,
                required: false,
              },
            ],
            model: ArticleModel,
            required: false,
            where: {
              body: {
                [Op.like]: "%dummy%",
              },
              id: {
                [Op.gt]: "2",
              },
            },
          },
        ],
        where: {},
      };

      expect(options).to.eql(expectedStructure);
    });
  });
});
