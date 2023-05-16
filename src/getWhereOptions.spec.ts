import { FieldNode } from "graphql";
import ArticleModel from "./__mocks__/models/Article";
import { getWhereOptions } from "./getWhereOptions";
import { Op } from "sequelize";
import { expect } from "chai";

describe("getWhereOptions()", () => {
  it("uses custom filters if provided", () => {
    const selection: FieldNode = {
      kind: "Field",
      name: {
        kind: "Name",
        value: "articleArchive",
      },
      arguments: [
        {
          kind: "Argument",
          name: {
            kind: "Name",
            value: "from",
          },
          value: {
            kind: "StringValue",
            value: "2014-01-01",
            block: false,
          },
        },
        {
          kind: "Argument",
          name: {
            kind: "Name",
            value: "to",
          },
          value: {
            kind: "StringValue",
            value: "2014-12-31",
            block: false,
          },
        },
      ],
    };

    const options = getWhereOptions(
      ArticleModel,
      selection,
      {},
      {
        Articles: {
          articleArchive: ({ from, to }) => ({
            releaseDate: { [Op.between]: [from, to] },
          }),
        },
      }
    );

    expect(options).to.eql({
      releaseDate: { [Op.between]: ["2014-01-01", "2014-12-31"] },
    });
  });

  describe("scope argument", () => {
    it("simple scope", () => {
      const selection: FieldNode = {
        kind: "Field",
        name: {
          kind: "Name",
          value: "articles",
        },
        arguments: [
          {
            kind: "Argument",
            name: {
              kind: "Name",
              value: "scope",
            },
            value: {
              kind: "StringValue",
              value: "id|gt|2",
              block: false,
            },
          },
        ],
      };

      const options = getWhereOptions(ArticleModel, selection, {}, {});

      expect(options).to.eql({
        id: { [Op.gt]: "2" },
      });
    });

    it.skip("operator not supported");

    it.skip("navigation");

    it("using && with two conditions", () => {
      const selection: FieldNode = {
        kind: "Field",
        name: {
          kind: "Name",
          value: "articles",
        },
        arguments: [
          {
            kind: "Argument",
            name: {
              kind: "Name",
              value: "scope",
            },
            value: {
              kind: "StringValue",
              value: "id|gt|2 && title|like|dog",
              block: false,
            },
          },
        ],
      };

      const options = getWhereOptions(ArticleModel, selection, {}, {});

      expect(options).to.eql({
        id: { [Op.gt]: "2" },
        title: { [Op.like]: "dog" },
      });
    });
  });
});
