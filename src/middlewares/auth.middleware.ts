import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import logger from '../core/logger';

// Extende a tipagem do Express para incluir o user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Valida o JWT no Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // 2. Verifica o status da assinatura (RF03)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.subscription_status !== 'active') {
        // Se estiver em modo DEV (ver AuthController), pode passar, mas pela regra de negócio estrita:
        return res.status(403).json({ 
            error: 'Acesso negado. Assinatura inativa.',
            code: 'SUBSCRIPTION_REQUIRED' 
        });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Erro no middleware de auth', err);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};