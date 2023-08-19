import { expect } from "chai";
import { describe, it } from "node:test";

import { getComputedAttributes } from "./getComputedAttributes";
import AuthorModel from "./__mocks__/models/Author";
import { literal } from "sequelize";
import ArticleModel from "./__mocks__/models/Article";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";

const typeDefs = `
  type Author {
    id: ID!
    firstname: String!
    lastname: String!
    publishedQuantity: Int!
    #TODO use Date!
    publishedBetween(startDate: String!, endDate: String!): Int!
  }

  type RootQuery {
    authors: [Author!]!
  }

  schema {
    query: RootQuery
  }
  `;

const query = `
  query {
    authors {
      id
      published: publishedBetween(startDate: "2019-01-01", endDate: "2023-12-31")
    }
  }
`;

const resolvers = {
  RootQuery: {
    authors: () => {
      const author = new AuthorModel({ id: 1 });
      // publishedBeween does not belong to the model itself just as a graphql field
      Object.defineProperty(author, "publishedBetween", { value: 10 });
      return [author];
    },
  },
};

describe("getComputedAttributes", () => {
  it("return an object with the computed attributes present", () => {
    const computedAttributes = getComputedAttributes(AuthorModel);
    expect(computedAttributes).to.eql({
      publishedQuantity: literal(
        `(SELECT COUNT(*) FROM article WHERE article.authorId = Author.id)`
      ),
    });
  });

  it("return an empty object if no computed attributes are present", () => {
    const computedAttributes = getComputedAttributes(ArticleModel);
    expect(computedAttributes).to.be.empty;
  });

  it("returns the computed attribute with its alias", async () => {
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    const res = await graphql({ schema, source: query });
    expect(res.data).to.eql({ authors: [{ id: "1", published: 10 }] });
  });
});
