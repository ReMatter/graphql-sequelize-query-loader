import { expect } from 'chai';

import { GraphQLResolveInfo } from 'graphql';
import { Op } from 'sequelize';
import ArticleModel from './__mocks__/models/Article';
import CommentModel from './__mocks__/models/Comment';
import UserModel from './__mocks__/models/User';
import CategoryModel from './__mocks__/models/Category';
import { IWhereConstraints } from './types';
import QueryLoader from './QueryLoader';


describe('queryLoader', () => {
  const includeModels = {
    ArticleModel,
    CommentModel,
    UserModel,
    CategoryModel,
  };
  const queryLoader = new QueryLoader(includeModels, {});

  describe('queryLoader.getFindOptions()', () => {
    it('returns empty "include" property, when graphql query lacks included selections', () => {
      /**
       * A mock of the structure of the info object produced when a query
       * like this is sent from graphql
       * ```js
       * articles {
       *   id
       *   title
       * }
       */
      // TODO generate this mock from the query
      const info = {
        fieldName: 'articles',
        fieldNodes: [{
          alias: undefined,
          arguments: [],
          directives: [],
          kind: 'Field',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
              selectionSet: undefined,
            },
            {
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'title',
              },
              selectionSet: undefined,
            }
            ],
          },
        }],
      };
      const options = queryLoader.getFindOptions({
        info: info as unknown as GraphQLResolveInfo,
        model: ArticleModel,
      });
      expect(options.include).to.eql([]);
    });

    it('returns non empty with "include" property, when graphql query has included selections', () => {
      /**
       * A mock of the structure of the info object produced when a query
       * like this is sent from graphql
       * ```js
       * articles {
       *   id
       *   owner {
       *     firstname
       *   }
       *   comments {
       *     body
       *   }
       * }
       */
      // TODO generate this mock from the query
      const info = {
        fieldName: 'articles',
        fieldNodes: [{
          alias: undefined,
          arguments: [],
          directives: [],
          kind: 'Field',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              arguments: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
              selectionSet: undefined,
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
                  selectionSet: undefined,
                },
                ],
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
                selections: [
                {
                  arguments: [],
                  kind: 'Field',
                  name: {
                    kind: 'Name',
                    value: 'body',
                  },
                  selectionSet: undefined,
                }
                ],
              },
            }
            ],
          },
        }],
      };
      const options = queryLoader.getFindOptions({
        info: info as unknown as GraphQLResolveInfo,
        model: ArticleModel,
      });
      expect(options.include).to.eql([
        {
          as: 'owner',
          model: UserModel,
          attributes: [ 'firstname', 'id' ],
          required: false
        },
        {
          as: 'comments',
          model: CommentModel,
          attributes: [ 'body', 'id' ],
          required: false
        }
      ]);
    });

    it('returns empty "where" when graphql query lacks "scope" argument', () => {
      /**
       * A mock of the structure of the info object produced when a query
       * like this is sent from graphql
       * ```js
       * articles {
       *   id
       *   title
       * }
       */
      // TODO generate this mock from the query
      const info = {
        fieldName: 'articles',
        fieldNodes: [{
          alias: undefined,
          arguments: [],
          directives: [],
          kind: 'Field',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
              selectionSet: undefined,
            },
            {
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'title',
              },
              selectionSet: undefined,
            }
            ],
          },
        }],
      };
      const options = queryLoader.getFindOptions({
        info: info as unknown as GraphQLResolveInfo,
        model: ArticleModel,
      });
      expect(options.where).to.be.empty;
    });

    it('returns "where" conditions, when graphql query has "scope" argument', () => {
      /**
       * A mock of the structure of the info object produced when a query
       * like this is sent from graphql
       * ```js
       * articles(scope: "id|gt|2") {
       *   id
       *   title
       * }
       */
      // TODO generate this mock from the query
      const info = {
        fieldName: 'articles',
        fieldNodes: [{
          alias: undefined,
          arguments: [{
            kind: 'Argument',
            name: {
              kind: 'Name',
              value: 'scope',
            },
            value: {
              block: false,
              kind: 'StringValue',
              value: 'id|gt|2',
            },
          }],
          directives: [],
          kind: 'Field',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
              selectionSet: undefined,
            },
            {
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'title',
              },
              selectionSet: undefined,
            }
            ],
          },
        }],
      };
      const options = queryLoader.getFindOptions({
        info: info as unknown as GraphQLResolveInfo,
        model: ArticleModel,
      });
      const expectedWhereConstraints: IWhereConstraints = {
        id: {
          [Op.gt]: '2'
        }
      };
      expect(options.where).to.eql(expectedWhereConstraints);
    });

    it.skip('implement tests passing filters');

    it('gets findOptions and whereConstraints for deeper shapes', () => {
      /**
       * A mock of the structure of the info object produced when a query
       * like this is sent from graphql
       * ```js
       * categories {
       *   id
       *   name
       *   articles(scope: 'id|gt|2 && body|like|%dummy%') {
       *     id
       *     title
       *     owner {
       *       firstname
       *       lastname
       *     }
       *     comments {
       *       id
       *       body
       *     }
       *   }
       * }
       */
      // TODO generate this mock from the query
      const info = {
        fieldName: 'categories',
        fieldNodes: [{
          alias: undefined,
          arguments: [],
          directives: [],
          kind: 'Field',
          selectionSet: {
            kind: 'SelectionSet',
            selections: [{
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'id',
              },
              selectionSet: undefined,
            },
            {
              alias: undefined,
              arguments: [],
              directives: [],
              kind: 'Field',
              name: {
                kind: 'Name',
                value: 'name',
              },
              selectionSet: undefined,
            },
            {
              alias: undefined,
              arguments: [{
                kind: 'Argument',
                name: {
                  kind: 'Name',
                  value: 'scope',
                },
                value: {
                  block: false,
                  kind: 'StringValue',
                  value: 'id|gt|2 && body|like|%dummy%',
                },
              }],
              directives: [],
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
                  selectionSet: undefined,
                },
                {
                  arguments: [],
                  kind: 'Field',
                  name: {
                    kind: 'Name',
                    value: 'title',
                  },
                  selectionSet: undefined,
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
                      selectionSet: undefined,
                    },
                    {
                      arguments: [],
                      kind: 'Field',
                      name: {
                        kind: 'Name',
                        value: 'lastname',
                      },
                      selectionSet: undefined,
                    }
                    ],
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
                      selectionSet: undefined,
                    },
                    {
                      arguments: [],
                      kind: 'Field',
                      name: {
                        kind: 'Name',
                        value: 'body',
                      },
                      selectionSet: undefined,
                    }
                    ],
                  },
                }
                ],
              },
            }
            ],
          },
        }],
      };
      const options = queryLoader.getFindOptions({
        info: info as unknown as GraphQLResolveInfo,
        model: CategoryModel,
      });

      //TODO make sorting by createdAt an option and not hardcoded always
      const expectedStructure = {
        attributes: ['id', 'name', 'createdAt'],
        include: [{
          as: 'articles',
          attributes: ['id', 'title'],
          include: [{
            as: 'owner',
            attributes: ['firstname', 'lastname', 'id'],
            model: UserModel,
            required: false,
          },
          {
            as: 'comments',
            attributes: ['id', 'body'],
            model: CommentModel,
            required: false,
          }],
          model: ArticleModel,
          required: false,
          where: {
            body: {
              [Op.like]: '%dummy%'
            },
            id: {
              [Op.gt]: '2'
            },
          },
        }],
        where: {},
        order: [['createdAt', 'DESC']],
      }

      expect(options).to.eql(expectedStructure);
    });
  });
});