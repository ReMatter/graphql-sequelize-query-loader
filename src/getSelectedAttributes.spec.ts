import { assert } from "chai";
import { describe, it } from "node:test";

import { Kind, SelectionNode } from "graphql";
import ArticleModel from "./__mocks__/models/Article";

import { getSelectedAttributes } from "./getSelectedAttributes";
import { Sequelize, literal } from "sequelize";
import AuthorModel from "./__mocks__/models/Author";
import { ComputedQueries, Scalars } from "./QueryLoader";

const selections: ReadonlyArray<SelectionNode> = [
  {
    kind: Kind.FIELD,
    name: {
      kind: Kind.NAME,
      value: "id",
    },
  },
  {
    kind: Kind.FIELD,
    name: {
      kind: Kind.NAME,
      value: "title",
    },
  },
];

type GqlAuthor = {
  readonly __typename?: "Author";
  readonly id: Scalars["String"];
  readonly firstname: Scalars["String"];
  readonly lastname: Scalars["String"];
  readonly publishedQuantity: Scalars["Int"];
  readonly publishedBetween: Scalars["Int"];
};

type AuthorPublishedBetweenArgs = {
  startDate: Scalars["Date"];
  endDate: Scalars["Date"];
};

describe("getSelectedAttributes", () => {
  it("returns the selected attributes", () => {
    const selectedAttributes = getSelectedAttributes({
      model: ArticleModel,
      selections,
    });
    const expectedAttributes = ["id", "title"];

    assert.sameMembers(selectedAttributes as string[], expectedAttributes);
  });

  it("returns the primary key at least", () => {
    const selectedAttributes = getSelectedAttributes({
      model: ArticleModel,
      selections: [],
    });
    const expectedAttributes = ["id"];

    assert.sameMembers(selectedAttributes as string[], expectedAttributes);
  });

  describe("computedAttributes", () => {
    const computedQueries: ComputedQueries<
      GqlAuthor,
      AuthorPublishedBetweenArgs
    > = {
      publishedBetween: ({ startDate, endDate }) =>
        Sequelize.literal(
          `(SELECT COUNT(*) FROM article WHERE article.authorId = author.id AND article.releaseDate BETWEEN '${startDate.toLocaleDateString()}' AND '${endDate.toLocaleDateString()}')`
        ),
    };

    it("returns the computed attribute literal", () => {
      const startDate = new Date("2020-01-01");
      const endDate = new Date("2020-01-31");
      const selectedAttributes = getSelectedAttributes({
        model: AuthorModel,
        selections: [
          {
            kind: Kind.FIELD,
            alias: { kind: Kind.NAME, value: "publishedBetween" },
            arguments: [
              {
                kind: Kind.ARGUMENT,
                name: { kind: Kind.NAME, value: "startDate" },
                value: {
                  kind: Kind.VARIABLE,
                  name: { kind: Kind.NAME, value: "startDate" },
                },
              },
              {
                kind: Kind.ARGUMENT,
                name: { kind: Kind.NAME, value: "endDate" },
                value: {
                  kind: Kind.VARIABLE,
                  name: { kind: Kind.NAME, value: "endDate" },
                },
              },
            ],
            name: {
              kind: Kind.NAME,
              value: "publishedBetween",
            },
          },
        ],
        variables: { startDate, endDate },
        computedQueries,
      });

      const expectedAttributes = [
        "id",
        [
          literal(
            `(SELECT COUNT(*) FROM article WHERE article.authorId = author.id AND article.releaseDate BETWEEN '${startDate.toLocaleDateString()}' AND '${endDate.toLocaleDateString()}')`
          ),
          "publishedBetween",
        ],
      ];

      assert.sameDeepMembers(
        selectedAttributes as unknown[],
        expectedAttributes
      );
    });
  });
});
