import { Router } from 'express';
import { AssetsController } from './assets.controller';
import { ensureAuthenticated } from '../../middlewares/auth.middleware';

const router = Router();

router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 * - name: Assets
 * description: Gerenciamento de Ativos
 */

router.get('/', AssetsController.list);
router.post('/', AssetsController.create);
router.post('/bulk', AssetsController.bulkCreate);
router.delete('/:id', AssetsController.delete);

export default router;