import { expect } from "chai";
import ArticleModel from "../../src/__mocks__/models/Article";
import AuthorModel from "../../src/__mocks__/models/Author";
import CommentModel from "../../src/__mocks__/models/Comment";

describe("filter", () => {
  it("test", async () => {
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

    const count = await ArticleModel.count();

    expect(count).to.equal(2);
  });
});
