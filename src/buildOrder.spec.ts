import { expect } from "chai";
import ArticleModel from "./__mocks__/models/Article";
import AuthorModel from "./__mocks__/models/Author";
import { buildOrder } from "./buildOrder";
import { literal } from "sequelize";

describe('buildOrder()', () => {
  it('returns an empty array when no sorters are provided', () => {
    const order = buildOrder(ArticleModel, []);
    expect(order).to.eql([]);
  });

  it('returns an array of order items when sorters are provided', () => {
    const order = buildOrder(ArticleModel, [{ field: 'releaseDate', order: 'ASC' }]);
    expect(order).to.eql([['releaseDate', 'ASC']]);
  })

  it('returns an array of order items when sorters are provided and the field has a path', () => {
    const order = buildOrder(ArticleModel, [{ field: 'owner.firstname', order: 'ASC' }]);
    expect(order).to.eql([['owner', 'firstname', 'ASC']]);
  })

  it('returns an array of order items when sorters are provided and the field is computed', () => {
    const order = buildOrder(AuthorModel, [{ field: 'publishedQuantity', order: 'ASC' }]);
    expect(order).to.eql([[literal('publishedQuantity'), 'ASC']]);
  })
});

