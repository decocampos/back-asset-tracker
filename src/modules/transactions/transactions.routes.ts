import { Router } from 'express';
import { TransactionsController } from './transactions.controller';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';

const router = Router();

router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 * - name: Transactions
 * description: Lançamento de compras e vendas
 */

router.post('/', TransactionsController.create);
router.post('/bulk', TransactionsController.bulkCreate);

export default router;