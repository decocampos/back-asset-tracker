import { Router } from 'express';
import { AssetsController } from './assets.controller';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';

const router = Router();

router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 *   - name: Assets
 *     description: Gerenciamento de Ativos (Ações, Cripto, etc)
 */

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Lista todos os ativos da carteira consolidada
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ativos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_consolidated:
 *                   type: number
 *                 assets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticker:
 *                         type: string
 *                       quantity:
 *                         type: number
 *                       current_price:
 *                         type: number
 *   post:
 *     summary: Adiciona um único ativo manualmente
 *     tags: [Assets]
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
 *               - quantity
 *               - avg_price
 *             properties:
 *               ticker:
 *                 type: string
 *                 example: PETR4
 *               type:
 *                 type: string
 *                 example: Ação
 *               quantity:
 *                 type: number
 *                 example: 100
 *               avg_price:
 *                 type: number
 *                 example: 28.50
 *     responses:
 *       201:
 *         description: Ativo criado
 */
router.get('/', AssetsController.list);
router.post('/', AssetsController.create);

/**
 * @swagger
 * /api/assets/bulk:
 *   post:
 *     summary: Importação em massa de ativos (Migração de carteira)
 *     tags: [Assets]
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
 *                   example: AAPL
 *                 quantity:
 *                   type: number
 *                   example: 10
 *                 avg_price:
 *                   type: number
 *                   example: 150.00
 *                 type:
 *                   type: string
 *                   example: Ação Americana
 *                 currency:
 *                   type: string
 *                   example: USD
 *     responses:
 *       201:
 *         description: Importação concluída
 */
router.post('/bulk', AssetsController.bulkCreate);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Remove um ativo da carteira
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Removido com sucesso
 */
router.delete('/:id', AssetsController.delete);

export default router;
