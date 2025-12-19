import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Asset Tracker API',
      version: '1.0.0',
      description: 'API para gestão de ativos financeiros',
      contact: {
        name: 'André Campos'
      },
    },
    // Adiciona a configuração de autenticação
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Aplica a segurança globalmente (todas as rotas exigirão token, exceto as públicas explícitas)
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.ts'], 
};

export const swaggerSpec = swaggerJSDoc(options);