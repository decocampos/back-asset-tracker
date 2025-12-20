import request from 'supertest';

// 1. Mock Hoisted (Definição da estrutura)
jest.mock('../src/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(), // A implementação será injetada no beforeEach
  },
}));

import app from '../src/app';
import { supabase } from '../src/config/supabase';

const mockSupabase = supabase as any;

// Helper para criar um Builder novo a cada teste
const createMockBuilder = (data: any = {}, error: any = null) => {
  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    // Importante: 'then' permite que o await resolva os dados
    then: jest.fn((resolve) => resolve({ data, error })), 
  };
};

describe('Auth Module', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // Limpa chamadas anteriores
    
    // RESTAURA A IMPLEMENTAÇÃO PADRÃO AQUI
    mockSupabase.from.mockImplementation(() => createMockBuilder({}));
  });

  describe('POST /api/auth/register', () => {
    it('should register a user successfully', async () => {
      // Mock do Auth
      mockSupabase.auth.signUp.mockResolvedValue({ 
        data: { user: { id: 'user-123' } }, error: null 
      });
      
      // Mock do Profile (Upsert)
      // O beforeEach já configurou o padrão, mas aqui garantimos que não dê erro
      mockSupabase.from.mockImplementation(() => createMockBuilder({}, null));

      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Test User',
        email: 'test@email.com',
        password: 'password123',
        phone: '11999999999'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
    });

    it('should fail with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Test User',
        email: 'not-an-email', 
        password: '123'
      });

      expect(res.status).toBe(400); 
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { access_token: 'fake-jwt' }, user: { id: 'u1' } },
        error: null
      });

      // Mock específico: Login precisa verificar o status 'active' no banco
      const activeUserBuilder = createMockBuilder({ subscription_status: 'active' });
      mockSupabase.from.mockReturnValue(activeUserBuilder);

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@email.com',
        password: 'password123'
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('session');
    });

    it('should return 401 for wrong credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' }
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'test@email.com',
        password: 'wrongpass', 
      });

      expect(res.status).toBe(401);
    });
  });
});