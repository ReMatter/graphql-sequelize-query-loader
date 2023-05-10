import { expect } from 'chai';

import { parse, buildSchema, GraphQLField } from 'graphql';
import { Op, WhereAttributeHashValue } from 'sequelize';
import ArticleModel from './__mocks__/models/Article';
import CommentModel from './__mocks__/models/Comment';
import AuthorModel from './__mocks__/models/Author';
import CategoryModel from './__mocks__/models/Category';
import QueryLoader from './QueryLoader';
import { GraphQLSchema } from 'graphql';
import { buildResolveInfo, collectFields, ExecutionContext, buildExecutionContext, getFieldDef } from 'graphql/execution/execute';
import { getOperationRootType } from 'graphql';
import { addPath } from 'graphql/jsutils/Path';


const getGraphQLResolveInfo = (schema: GraphQLSchema, query: string) => {
  const rootValue = {};
  const contextValue = {};
  const rawVariablesValue = {};

  const ast = parse(query);

  const executionContext = buildExecutionContext(
    schema,
    ast,
    rootValue,
    contextValue,
    rawVariablesValue,
    null,
    null,
  ) as ExecutionContext;

  const operationRootType = getOperationRootType(schema, executionContext.operation)
  const fields = collectFields(executionContext, operationRootType, executionContext.operation.selectionSet, Object.create(null), Object.create(null));

  const responseName = Object.keys(fields)[0];
  const fieldNodes = fields[responseName];
  const fieldNode = fieldNodes[0];
  const fieldName = fieldNode.name.value;

  const path = addPath(undefined, responseName, operationRootType.name)

  const fieldDef = getFieldDef(schema, operationRootType, fieldName) as GraphQLField<any, any>;

  return buildResolveInfo(
    executionContext,
    fieldDef,
    fieldNodes,
    operationRootType,
    path,
  );
}

describe('queryLoader', () => {
  const includeModels = {
    ArticleModel,
    CommentModel,
    AuthorModel,
    CategoryModel,
  };
  const queryLoader = new QueryLoader(includeModels, {});

  const schema = buildSchema(`
    type Query {
      articles: [Article]
      categories: [Category]
      authors: [Author]
    }

    type Author {
      id: ID!
      firstname: String!
      lastname: String!
      publishedQuantity: Int!
    }

    type Article {
      id: ID!
      title: String!
    }

    type Category {
      id: ID!
      name: String!
    }
  `);


  describe('queryLoader.getFindOptions()', () => {
    it('returns attributes property for the queried fields', async () => {
      const query = `
        query {
          articles {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      //TODO make created at optional
      expect(options.attributes).to.eql(['id', 'title', 'createdAt']);
    });

    it('returns attributes property for the queried fields with computed queries', async () => {
      const query = `
        query {
          authors {
            id
            firstname
            lastname
            publishedQuantity
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: AuthorModel,
      });
      //TODO make created at optional
      expect(options.attributes).to.eql(['id', 'firstname', 'lastname', 'publishedQuantity', 'createdAt']);
    });

    it('returns empty "include" property, when graphql query lacks included selections', async () => {
      const query = `
        query {
          articles {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      expect(options.include).to.eql([]);
    });

    it('returns non empty with "include" property, when graphql query has included selections', () => {
      const query = `
        query {
          articles {
            id
            owner {
              firstname
            }
            comments {
              body
            }
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      expect(options.include).to.eql([
        {
          as: 'owner',
          model: AuthorModel,
          attributes: ['firstname', 'id'],
          required: false
        },
        {
          as: 'comments',
          model: CommentModel,
          attributes: ['body', 'id'],
          required: false
        }
      ]);
    });

    it('returns empty "where" when graphql query lacks "scope" argument', () => {
      const query = `
        query {
          articles {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      expect(options.where).to.be.empty;
    });

    it('returns "where" conditions, when graphql query has "scope" argument', () => {
      const query = `
        query {
          articles(scope: "id|gt|2") {
            id
            title
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
        model: ArticleModel,
      });
      const expectedWhereConstraints: WhereAttributeHashValue<any> = {
        id: {
          [Op.gt]: '2'
        },
      };
      expect(options.where).to.eql(expectedWhereConstraints);
    });

    it.skip('implement tests passing filters');

    it('gets findOptions and whereConstraints for deeper shapes', () => {
      const query = `
        query {
          categories {
            id
            name
            articles(scope: "id|gt|2 && body|like|%dummy%") {
              id
              title
              owner {
                firstname
                lastname
              }
              comments {
                id
                body
              }
            }
          }
        }
      `;
      const info = getGraphQLResolveInfo(schema, query);
      const options = queryLoader.getFindOptions({
        info,
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
            model: AuthorModel,
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