import request from 'supertest';

// 1. Mock Hoisted
jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

import app from '../src/app';
import { supabase } from '../src/config/supabase';

const mockSupabase = supabase as any;

const createMockBuilder = (data: any = [], error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error }),
  then: jest.fn((resolve) => resolve({ data, error })),
});

describe('Transactions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    
    // Configuração base: Passa pelo middleware e retorna vazio nas queries
    // O mockImplementation aqui trata qualquer chamada .from() genérica
    mockSupabase.from.mockImplementation(() => createMockBuilder(null));
  });

  // Helper para encadear mocks (Middleware -> Lógica da Rota)
  const mockChain = (responses: any[]) => {
    let i = 0;
    mockSupabase.from.mockImplementation(() => {
      const resp = responses[i++] || null; // Pega a resposta da vez ou null
      return createMockBuilder(resp);
    });
  };

  it('should FAIL to create transaction with negative value', async () => {
    // Middleware passa, resto não importa pois para na validação Zod
    mockChain([{ subscription_status: 'active' }]); 

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', 'Bearer token')
      .send({
        ticker: 'VALE3',
        type: 'BUY',
        quantity: -10, // Inválido
        value: 50
      });

    expect(res.status).toBe(400); 
  });

  it('should FAIL to SELL an asset that does not exist', async () => {
    mockChain([
      { subscription_status: 'active' }, // 1. Middleware
      null // 2. Busca do Ativo (Retorna null = Não existe)
    ]);

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', 'Bearer token')
      .send({
        ticker: 'UNKNOWN',
        type: 'SELL', 
        quantity: 10,
        value: 10
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Venda de ativo inexistente');
  });

  it('should BUY and CREATE asset if not exists', async () => {
    mockChain([
      { subscription_status: 'active' }, // 1. Middleware
      null, // 2. Busca do Ativo (Retorna null = Não existe)
      { id: 'new-asset', quantity: 0, avg_price: 0 }, // 3. Insert do Ativo Novo
      null, // 4. Update Asset
      null  // 5. Insert Transaction
    ]);

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', 'Bearer token')
      .send({
        ticker: 'WEGE3',
        type: 'BUY',
        quantity: 100,
        value: 25.00
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('sucesso');
    expect(res.body.new_avg_price).toBe(25);
  });
});