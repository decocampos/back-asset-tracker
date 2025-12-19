import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './core/logger';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
});