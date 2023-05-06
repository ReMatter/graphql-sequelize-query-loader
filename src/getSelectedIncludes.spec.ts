import { expect } from 'chai';

import { FieldNode } from "graphql";
import { getSelectedIncludes } from "./getSelectedIncludes";
import ArticleModel from './__mocks__/models/Article';
import CategoryModel from './__mocks__/models/Category';
import CommentModel from './__mocks__/models/Comment';
import UserModel from './__mocks__/models/User';


describe('getSelectedIncludes()', () => {
  it('returns an empty array when query has no included models', () => {
    const selections: readonly FieldNode[] = [{
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
    const includes = getSelectedIncludes({
      model: ArticleModel,
      selections,
      dependenciesByFieldNameByModelName: {},
      modelsByAssociationByModelName: {},
    });
    expect(includes).to.eql([]);
  });

  it('returns sequalize include when query has an included model', () => {
    const selections: readonly FieldNode[] = [
      {
        arguments: [],
        kind: 'Field',
        name: {
          kind: 'Name',
          value: 'owner',
        },
        selectionSet: {
          kind: 'SelectionSet',
          selections: [{
            arguments: [],
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'firstname',
            },
          },],
        },
      }];

    const includes = getSelectedIncludes({
      model: ArticleModel,
      selections,
      dependenciesByFieldNameByModelName: { Article: {} },
      modelsByAssociationByModelName: { Articles: { owner: UserModel } },
    });

    expect(includes).to.eql([{
      as: 'owner',
      model: UserModel,
      attributes: ['firstname', 'id'],
      required: false
    }]);
  });

  it('handles cases where included models next/include other related models', () => {
    const selections: readonly FieldNode[] = [{
      arguments: [],
      kind: 'Field',
      name: {
        kind: 'Name',
        value: 'id',
      },
    },
    {
      arguments: [],
      kind: 'Field',
      name: {
        kind: 'Name',
        value: 'articles',
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [{
          arguments: [],
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'id',
          },
        },
        {
          arguments: [],
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'title',
          },
        },
        {
          arguments: [],
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'owner',
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              arguments: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'firstname',
              },
            }],
          },
        },
        {
          arguments: [],
          kind: 'Field',
          name: {
            kind: 'Name',
            value: 'comments',
          },
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              arguments: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
            },
            {
              arguments: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'body',
              },
            }
            ],
          },
        }
        ],
      },
    }];

    const includes = getSelectedIncludes({
      model: CategoryModel,
      selections,
      dependenciesByFieldNameByModelName: { Article: {}, User: {}, Comment: {}, Category: {} },
      modelsByAssociationByModelName: { Articles: { owner: UserModel, comments: CommentModel }, Categories: { articles: ArticleModel }, Comments: {}, Users: {} },
    });

    expect(includes).to.eql([{
      model: ArticleModel,
      as: 'articles',
      attributes: ['id', 'title'],
      required: false,
      include: [{
        model: UserModel,
        as: 'owner',
        attributes: ['firstname', 'id'],
        required: false,
      },
      {
        model: CommentModel,
        as: 'comments',
        attributes: ['id', 'body'],
        required: false,
      }]
    }]);
  });
});