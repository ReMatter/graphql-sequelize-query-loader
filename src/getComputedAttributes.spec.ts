import { expect } from 'chai';
import { getComputedAttributes } from './getComputedAttributes';
import Author from './__mocks__/models/Author';
import { literal } from 'sequelize';
import Article from './__mocks__/models/Article';

describe('getComputedAttributes()', () => {
  it('return an object with the computed attributes present', () => {
    const computedAttributes = getComputedAttributes(Author);
    expect(computedAttributes).to.eql({publishedQuantity: literal(`(SELECT COUNT(*) FROM article WHERE article.authorId = Author.id)`)});
  });

  it('return an empty object if no computed attributes are present', () => {
    const computedAttributes = getComputedAttributes(Article);
    expect(computedAttributes).to.be.empty;
  });
});