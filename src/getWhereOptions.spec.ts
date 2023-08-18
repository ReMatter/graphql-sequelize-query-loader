import { FieldNode, Kind } from "graphql";
import ArticleModel from "./__mocks__/models/Article";
import { getWhereOptions } from "./getWhereOptions";
import { Op } from "sequelize";
import { expect } from "chai";

describe("getWhereOptions", () => {
  it("uses custom filters if provided", () => {
    const selection: FieldNode = {
      kind: Kind.FIELD,
      name: {
        kind: Kind.NAME,
        value: "articleArchive",
      },
      arguments: [
        {
          kind: Kind.ARGUMENT,
          name: {
            kind: Kind.NAME,
            value: "from",
          },
          value: {
            kind: Kind.STRING,
            value: "2014-01-01",
            block: false,
          },
        },
        {
          kind: Kind.ARGUMENT,
          name: {
            kind: Kind.NAME,
            value: "to",
          },
          value: {
            kind: Kind.STRING,
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
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: "articles",
        },
        arguments: [
          {
            kind: Kind.ARGUMENT,
            name: {
              kind: Kind.NAME,
              value: "scope",
            },
            value: {
              kind: Kind.STRING,
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
        kind: Kind.FIELD,
        name: {
          kind: Kind.NAME,
          value: "articles",
        },
        arguments: [
          {
            kind: Kind.ARGUMENT,
            name: {
              kind: Kind.NAME,
              value: "scope",
            },
            value: {
              kind: Kind.STRING,
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
