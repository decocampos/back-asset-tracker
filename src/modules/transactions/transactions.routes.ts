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
 *   get:
 *     summary: Lista histórico de transações com filtro de data
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   value:
 *                     type: number
 *                   quantity:
 *                     type: number
 *                   transaction_date:
 *                     type: string
 *                   asset:
 *                     type: object
 *                     properties:
 *                       ticker:
 *                         type: string
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
router.get('/', TransactionsController.list);
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

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Remove uma transação (Estorno)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Removido com sucesso
 */
router.delete('/:id', TransactionsController.delete);

export default router;
