const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basic Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API with Swagger',
    version: '1.0.0',
    description: 'A simple Express API application',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Expense: {
        type: 'object',
        required: ['description', 'amount'],
        properties: {
          _id: {
            type: 'string',
            example: '60c72b2f9b1d8e2f8c4f91e9'
          },
          userId: {
            type: 'string',
            example: '60c72b2f9b1d8e2f8c4f91e9'
          },
          description: {
            type: 'string',
            example: 'Grocery Shopping'
          },
          amount: {
            type: 'number',
            example: 100
          },
          date: {
            type: 'string',
            format: 'date-time',
            example: '2024-07-04T10:00:00Z'
          }
        }
      },
      Budget: {
        type: 'object',
        required: ['category', 'amount', 'startDate', 'endDate'],
        properties: {
          _id: {
            type: 'string',
            example: '60c72b2f9b1d8e2f8c4f91e9'
          },
          userId: {
            type: 'string',
            example: '60c72b2f9b1d8e2f8c4f91e9'
          },
          category: {
            type: 'string',
            example: 'Food'
          },
          amount: {
            type: 'number',
            example: 500
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            example: '2024-07-01T00:00:00Z'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            example: '2024-07-31T23:59:59Z'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
