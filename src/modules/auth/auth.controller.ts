import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import logger from '../../core/logger';

export class AuthController {
  
  // POST /auth/register
  static async register(req: Request, res: Response) {
    try {
      // 1. Validação de Input (Zod)
      const data = registerSchema.parse(req.body);
      
      // 2. Criar Usuário no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário no Auth");

      // 3. Gerar código de indicação único
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 4. Lógica de Pagamento
      let paymentLink = null;
      let initialStatus = 'inactive';
      const isPaymentEnabled = process.env.ENABLE_PAYMENTS === 'true';

      if (isPaymentEnabled) {
        paymentLink = "https://buy.stripe.com/test_link_plano_15"; 
        initialStatus = 'inactive';
      } else {
        logger.info('⚠️ Pagamentos desativados (Modo Dev). Usuário criado como active.');
        initialStatus = 'active';
      }

      // 5. Atualizar a tabela Profiles (UPSERT)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: data.fullName,
          phone: data.phone,
          // CORREÇÃO AQUI: Verifica se existe data antes de converter
          birth_date: data.birthDate ? new Date(data.birthDate) : null,
          referral_code: myReferralCode,
          subscription_status: initialStatus,
        })
        .select();

      if (profileError) {
        logger.error(`Erro ao atualizar profile: ${profileError.message}`);
        return res.status(500).json({ error: "Erro ao configurar perfil do usuário" });
      }

      logger.info(`Novo usuário registrado: ${data.email} | Status: ${initialStatus}`);
      
      return res.status(201).json({
        message: isPaymentEnabled 
          ? "Usuário criado. Realize o pagamento para liberar o acesso." 
          : "Usuário criado e ativado (Modo Dev).",
        paymentLink: paymentLink,
        user: { 
          id: authData.user.id, 
          email: data.email,
          status: initialStatus
        }
      });

    } catch (error: any) {
      logger.error(`Erro no Register: ${error.message}`);
      return res.status(400).json({ error: error.errors || error.message });
    }
  }

  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);

      const { data: sessionData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', sessionData.user.id)
        .single();

      logger.info(`Login efetuado: ${data.email}`);

      return res.json({
        session: sessionData.session,
        subscriptionStatus: profile?.subscription_status || 'inactive'
      });

    } catch (error: any) {
      logger.error(`Erro no Login: ${error.message}`);
      return res.status(401).json({ error: "Credenciais inválidas ou usuário não encontrado." });
    }
  }

  // POST /auth/refresh
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) throw error;
      if (!data.session) throw new Error("Não foi possível renovar a sessão");

      return res.json({ session: data.session });

    } catch (error: any) {
      logger.error(`Erro no Refresh Token: ${error.message}`);
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
  }
}