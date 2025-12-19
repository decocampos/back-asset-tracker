import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AssetTracker API',
      version: '1.0.0',
      description: 'API para gestão de ativos financeiros',
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Servidor Local' },
    ],
    // AQUI ESTÁ A MÁGICA: Definimos os schemas como objeto, sem perigo de YAML
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserRegister: {
          type: 'object',
          required: ['email', 'password', 'fullName', 'birthDate'],
          properties: {
            email: { type: 'string', example: 'eduardo@teste.com' },
            password: { type: 'string', example: '123456' },
            fullName: { type: 'string', example: 'Eduardo Silva' },
            birthDate: { type: 'string', format: 'date', example: '1990-01-01' },
            phone: { type: 'string', example: '11999999999' },
            referralCode: { type: 'string', example: 'COD123' }
          }
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'eduardo@teste.com' },
            password: { type: 'string', example: '123456' }
          }
        }
      }
    },
  },
  // Caminho absoluto para achar as rotas
  apis: [
    path.join(process.cwd(), 'src/modules/**/*.ts')
  ],
};

export const swaggerSpec = swaggerJsdoc(options);