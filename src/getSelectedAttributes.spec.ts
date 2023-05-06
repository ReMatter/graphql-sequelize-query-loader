import { assert } from 'chai';

import { SelectionNode } from 'graphql';
import ArticleModel from './__mocks__/models/Article';

import { getSelectedAttributes } from './getSelectedAttributes';

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

  it.skip('test ccid and refactor to make it parametrizable', () => {});

  describe.skip('computedAttributes', () => {
  });
});