import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *         - phone
 *         - birthDate
 *       properties:
 *         fullName:
 *           type: string
 *           description: Nome completo do usuário
 *           example: Eduardo Investidor
 *         email:
 *           type: string
 *           format: email
 *           description: E-mail para login
 *           example: eduardo@email.com
 *         password:
 *           type: string
 *           format: password
 *           description: Senha segura (min 6 caracteres)
 *           example: 123456
 *         phone:
 *           type: string
 *           description: Telefone celular
 *           example: 11999999999
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Data de nascimento (YYYY-MM-DD)
 *           example: 1990-01-01
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: eduardo@email.com
 *         password:
 *           type: string
 *           format: password
 *           example: 123456
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Token de atualização recebido no login
 *           example: "rO0ABXNyABFqYXZ..."
 */

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticação e Registro de Usuários
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro de validação
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna o Token JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   description: Objeto de sessão do Supabase (contém access_token)
 *                 subscriptionStatus:
 *                   type: string
 *                   example: active
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renova o Access Token usando o Refresh Token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Sessão renovada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   description: Nova sessão com novos tokens
 *       401:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', AuthController.refreshToken);

export default router;
