import { expect } from "chai";
import { describe, it } from "node:test";

import { FieldNode, Kind } from "graphql";
import { getSelectedIncludes } from "./getSelectedIncludes";
import ArticleModel from "../__mocks__/models/Article";
import CategoryModel from "../__mocks__/models/Category";
import CommentModel from "../__mocks__/models/Comment";
import UserModel from "../__mocks__/models/Author";

describe("getSelectedIncludes", () => {
  it("returns an empty array when query has no included models", () => {
    const selections: readonly FieldNode[] = [
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
    const includes = getSelectedIncludes({
      model: ArticleModel,
      selections,
      dependenciesByFieldNameByModelName: {},
      modelsByAssociationByModelName: {},
      customFieldFilters: {},
    });
    expect(includes).to.eql([]);
  });

  it("returns sequalize include when query has an included model", () => {
    const selections: readonly FieldNode[] = [
      {
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: "owner",
        },
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: [
            {
              kind: Kind.FIELD,
              name: {
                kind: Kind.NAME,
                value: "firstname",
              },
            },
          ],
        },
      },
    ];

    const includes = getSelectedIncludes({
      model: ArticleModel,
      selections,
      dependenciesByFieldNameByModelName: { Article: {} },
      modelsByAssociationByModelName: { Articles: { owner: UserModel } },
      customFieldFilters: {},
    });

    expect(includes).to.eql([
      {
        as: "owner",
        model: UserModel,
        attributes: ["firstname", "id"],
        required: false,
      },
    ]);
  });

  it("handles cases where included models next/include other related models", () => {
    const selections: readonly FieldNode[] = [
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
          value: "articles",
        },
        selectionSet: {
          kind: Kind.SELECTION_SET,
          selections: [
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
            {
              kind: Kind.FIELD,
              name: {
                kind: Kind.NAME,
                value: "owner",
              },
              selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [
                  {
                    kind: Kind.FIELD,
                    name: {
                      kind: Kind.NAME,
                      value: "firstname",
                    },
                  },
                ],
              },
            },
            {
              kind: Kind.FIELD,
              name: {
                kind: Kind.NAME,
                value: "comments",
              },
              selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: [
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
                      value: "body",
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ];

    const includes = getSelectedIncludes({
      model: CategoryModel,
      selections,
      dependenciesByFieldNameByModelName: {
        Article: {},
        User: {},
        Comment: {},
        Category: {},
      },
      modelsByAssociationByModelName: {
        Articles: { owner: UserModel, comments: CommentModel },
        Categories: { articles: ArticleModel },
        Comments: {},
        Users: {},
      },
      customFieldFilters: {},
    });

    expect(includes).to.eql([
      {
        model: ArticleModel,
        as: "articles",
        attributes: ["id", "title"],
        required: false,
        include: [
          {
            model: UserModel,
            as: "owner",
            attributes: ["firstname", "id"],
            required: false,
          },
          {
            model: CommentModel,
            as: "comments",
            attributes: ["id", "body"],
            required: false,
          },
        ],
      },
    ]);
  });
});
