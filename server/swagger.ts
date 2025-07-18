import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MesaLista API',
      version: '1.0.0',
      description: 'Wedding Gift Registry API documentation',
      contact: {
        name: 'MesaLista Support',
        email: 'support@regalamor.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server/routes/*.ts', './server/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

export default specs;
