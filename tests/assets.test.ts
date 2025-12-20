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

// Helper Builder
const createMockBuilder = (data: any = [], error: any = null) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: data[0] || data, error }),
  then: jest.fn((resolve) => resolve({ data, error })),
});

describe('Assets Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Padrão: Auth OK
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

    // Padrão: Banco retorna array vazio ou sucesso genérico
    mockSupabase.from.mockImplementation(() => createMockBuilder([]));
  });

  // Helper para simular retorno específico do banco para o Middleware E para a Rota
  const mockDbResponse = (middlewareData: any, routeData: any) => {
    mockSupabase.from.mockImplementationOnce(() => createMockBuilder(middlewareData)) // 1ª chamada: Middleware (Check Profile)
                     .mockImplementationOnce(() => createMockBuilder(routeData));    // 2ª chamada: Rota (List/Create Assets)
  };

  it('should deny access if not logged in (401)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'No token' });
    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(401);
  });

  it('should validate missing ticker on creation (400)', async () => {
    // Configura mock para passar pelo middleware
    mockDbResponse({ subscription_status: 'active' }, []); 

    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', 'Bearer token')
      .send({
        // ticker: FALTA
        quantity: 10,
        avg_price: 50
      });

    expect(res.status).toBe(400); 
  });

  it('should create an asset successfully', async () => {
    // 1. Middleware: Profile Active
    // 2. Insert: Retorna o asset criado
    const newAsset = { id: 'asset-1', ticker: 'PETR4', quantity: 10 };
    mockDbResponse({ subscription_status: 'active' }, newAsset);

    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', 'Bearer token')
      .send({
        ticker: 'PETR4',
        type: 'Ação',
        quantity: 10,
        avg_price: 30.50
      });

    expect(res.status).toBe(201);
    expect(res.body.ticker).toBe('PETR4');
  });
});