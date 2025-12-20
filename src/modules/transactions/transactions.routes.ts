import { Router } from 'express';
import { TransactionsController } from './transactions.controller';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';

const router = Router();

router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Registro de Compras e Vendas (Recalcula PM)
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Registra uma nova transação (Compra/Venda)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *               - type
 *               - value
 *               - quantity
 *             properties:
 *               ticker:
 *                 type: string
 *                 example: VALE3
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL]
 *                 example: BUY
 *               value:
 *                 type: number
 *                 description: Preço unitário pago/vendido
 *                 example: 65.40
 *               quantity:
 *                 type: number
 *                 example: 50
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Data da operação (opcional)
 *     responses:
 *       201:
 *         description: Transação registrada e PM atualizado
 */
router.post('/', TransactionsController.create);

/**
 * @swagger
 * /api/transactions/bulk:
 *   post:
 *     summary: Lança múltiplas transações de uma vez
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 ticker:
 *                   type: string
 *                   example: ITUB4
 *                 type:
 *                   type: string
 *                   enum: [BUY, SELL]
 *                 value:
 *                   type: number
 *                 quantity:
 *                   type: number
 *     responses:
 *       201:
 *         description: Processamento em lote concluído
 */
router.post('/bulk', TransactionsController.bulkCreate);

export default router;
