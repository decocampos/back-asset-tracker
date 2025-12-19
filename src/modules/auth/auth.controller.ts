import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { registerSchema, loginSchema } from './auth.schema';
import logger from '../../core/logger';

export class AuthController {
  
  // POST /auth/register
  static async register(req: Request, res: Response) {
    try {
      // 1. Validação de Input (Zod)
      const data = registerSchema.parse(req.body);
      
      // 2. Criar Usuário no Auth do Supabase
      // Passamos o full_name nos metadados para a Trigger do SQL usar
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

      // 3. Gerar código de indicação único (Mock simples)
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 4. Lógica de Pagamento (Toggle via ENV)
      let paymentLink = null;
      let initialStatus = 'inactive';

      // Se ENABLE_PAYMENTS for falso (ou não existir), assumimos Modo Dev (active)
      // Se for string "true", ativamos o fluxo do Stripe
      const isPaymentEnabled = process.env.ENABLE_PAYMENTS === 'true';

      if (isPaymentEnabled) {
        // Lógica Real do Stripe (Mockada por enquanto)
        // paymentLink = await stripe.checkout.sessions.create(...)
        paymentLink = "https://buy.stripe.com/test_link_plano_15"; // Link fictício
        initialStatus = 'inactive';
      } else {
        logger.info('⚠️ Pagamentos desativados (Modo Dev). Usuário criado como active.');
        initialStatus = 'active';
      }

      // 5. Atualizar a tabela Profiles (UPSERT)
      // Usamos upsert porque a Trigger do banco já pode ter criado a linha com o ID e Nome.
      // Aqui completamos com Telefone, Data de Nascimento e Código.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: data.fullName, // Garante que atualiza se a trigger falhar
          phone: data.phone,
          birth_date: new Date(data.birthDate),
          referral_code: myReferralCode,
          subscription_status: initialStatus,
          // referred_by: logica_de_busca_do_codigo_aqui
        })
        .select();

      if (profileError) {
        logger.error(`Erro ao atualizar profile: ${profileError.message}`);
        // Nota: O usuário Auth foi criado, mas o perfil falhou. 
        // Em prod, faríamos um rollback (delete user) ou fila de retry.
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

      // Verificar status da assinatura no banco
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
}