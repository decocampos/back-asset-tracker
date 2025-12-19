import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Importar Rotas
import authRoutes from './modules/auth/auth.routes';
import assetsRoutes from './modules/assets/assets.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);             // Agora funcional
app.use('/api/transactions', transactionsRoutes); // Agora funcional

// Rota de Health Check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

export default app;