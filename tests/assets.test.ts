import request from 'supertest';
import app from '../src/app';

// Mock do Supabase
jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      // CORREÇÃO CRÍTICA AQUI:
      // O 'then' precisa executar a função 'resolve' que o await passa para ele.
      then: jest.fn((resolve) => resolve({ data: [{ id: 1, ticker: 'PETR4', quantity: 10 }], error: null })),
    })),
  },
}));

import { supabase } from '../src/config/supabase';

describe('Assets Routes', () => {
  
  // Teste 1: Negativo
  it('should deny access without token', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.statusCode).toEqual(401);
  });

  // Teste 2: Positivo
  it('should list assets when authenticated', async () => {
    // 1. Mock da autenticação (Middleware)
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // 2. Mock específico para o 'single' do middleware (Profile Check)
    // Precisamos garantir que o middleware receba 'active'
    // Como a factory do jest.mock já define a estrutura, aqui refinamos o comportamento
    const mockFrom = supabase.from as jest.Mock;
    mockFrom.mockImplementation((table: string) => {
      // Retorno padrão do builder
      const builder: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { subscription_status: 'active' }, error: null }),
        // O then resolve os dados de Assets
        then: jest.fn((resolve) => resolve({ 
           data: [{ id: 1, ticker: 'TEST3', quantity: 10, current_price: 10, avg_price: 10 }], 
           error: null 
        }))
      };
      return builder;
    });

    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', 'Bearer fake-token');
      
    // Verifica se deu sucesso (200) e se retornou o JSON esperado
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('assets');
    expect(res.body.assets[0].ticker).toBe('TEST3');
  });
});