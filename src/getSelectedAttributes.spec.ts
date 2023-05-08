import { assert } from 'chai';

import { SelectionNode } from 'graphql';
import ArticleModel from './__mocks__/models/Article';

import { getSelectedAttributes } from './getSelectedAttributes';
import { Scalars } from './types';
import { ComputedQueries } from './util';
import { Sequelize, literal } from 'sequelize';

const selections: ReadonlyArray<SelectionNode> = [{
  kind: 'Field',
  name: {
    kind: 'Name',
    value: 'id',
  },
},
{
  kind: 'Field',
  name: {
    kind: 'Name',
    value: 'title',
  },
}
];

// TODO use this with graphql-code-generator to generate GqlAuthor and AuthorPublishedBetweenArgs
const schema = `
type Author {
  id: ID!
  firstname: String!
  lastname: String!
  publishedQuantity: Int!
  publishedBetween(startDate: Date!, endDate: Date!): Int!
}
`

type GqlAuthor = {
  readonly __typename?: 'Author';
  readonly id: Scalars['String'];
  readonly firstname: Scalars['String'];
  readonly lastname: Scalars['String'];
  readonly publishedQuantity: Scalars['Int'];
  readonly publishedBetween: Scalars['Int'];
};

type AuthorPublishedBetweenArgs = {
  startDate: Scalars['Date'];
  endDate: Scalars['Date'];
};

describe('getSelectedAttributes()', () => {
  it('returns the selected attributes', () => {
    const selectedAttributes = getSelectedAttributes({
      model: ArticleModel,
      selections
    });
    const expectedAttributes = ['id', 'title'];

    assert.sameMembers(selectedAttributes as string[], expectedAttributes);
  });

  it('returns the primary key at least', () => {
    const selectedAttributes = getSelectedAttributes({
      model: ArticleModel,
      selections: [],
    });
    const expectedAttributes = ['id'];

    assert.sameMembers(selectedAttributes as string[], expectedAttributes);
  });

  it.skip('test ccid and refactor to make it parametrizable', () => { });

  describe('computedAttributes', () => {
    const computedQueries: ComputedQueries<GqlAuthor, AuthorPublishedBetweenArgs> = {
      publishedBetween: ({ startDate, endDate }) =>
        Sequelize.literal(
          `(SELECT COUNT(*) FROM article WHERE article.authorId = author.id AND article.releaseDate BETWEEN '${startDate}' AND '${endDate}')`
        ),
    };

    it('returns the computed attribute literal', () => {
      const startDate = new Date('2020-01-01');
      const endDate = new Date('2020-01-31');
      const selectedAttributes = getSelectedAttributes({
        model: ArticleModel,
        selections: [{
          kind: 'Field',
          alias: { kind: 'Name', value: 'publishedBetween' },
          arguments: [
            { kind: 'Argument', name: { kind: 'Name', value: 'startDate' }, value: { kind: 'Variable', name: { kind: 'Name', value: 'startDate' } } },
            { kind: 'Argument', name: { kind: 'Name', value: 'endDate' }, value: { kind: 'Variable', name: { kind: 'Name', value: 'endDate' } } }],
          name: {
            kind: 'Name',
            value: 'publishedBetween',
          },
        }],
        variables: { startDate, endDate },
        computedQueries
      });

      const expectedAttributes = ['id', [literal(`(SELECT COUNT(*) FROM article WHERE article.authorId = author.id AND article.releaseDate BETWEEN '${startDate}' AND '${endDate}')`), 'publishedBetween']]

      assert.sameDeepMembers(selectedAttributes as unknown[], expectedAttributes);
    });
  });
});