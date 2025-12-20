import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { z } from 'zod';
import logger from '../../core/logger';

// Schemas
const transactionSchema = z.object({
  ticker: z.string(),
  type: z.enum(['BUY', 'SELL']),
  value: z.number().positive(),
  quantity: z.number().positive(),
  date: z.string().datetime().optional(),
  assetType: z.string().optional(),
  sector: z.string().optional()
});

const bulkTransactionsSchema = z.array(transactionSchema);

export class TransactionsController {

  // GET /transactions (Com filtro de data e limite)
  static async list(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit } = req.query; // <--- ADICIONADO LIMIT

      let query = supabase
        .from('transactions')
        .select('*, asset:assets(ticker, type, sector)')
        .order('transaction_date', { ascending: false });

      if (startDate) {
        query = query.gte('transaction_date', new Date(String(startDate)).toISOString());
      }
      
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query = query.lte('transaction_date', end.toISOString());
      }

      // <--- ADICIONADO LIMIT
      if (limit) {
        query = query.limit(Number(limit));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtra para garantir consistência
      const formattedData = data.filter((tx: any) => tx.asset !== null);

      return res.json(formattedData);

    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // POST /transactions (Individual)
  static async create(req: Request, res: Response) {
    try {
      const txData = transactionSchema.parse(req.body);
      const userId = req.user.id;

      const result = await TransactionsController.processTransaction(userId, txData);

      if (result.status === 'error') {
        return res.status(400).json({ error: result.msg });
      }

      return res.status(201).json({ 
        message: 'Transação registrada com sucesso',
        asset: result.ticker,
        new_avg_price: result.new_avg
      });

    } catch (error: any) {
      return res.status(400).json({ error: error.errors || error.message });
    }
  }

  // POST /transactions/bulk (Lote)
  static async bulkCreate(req: Request, res: Response) {
    try {
      const transactions = bulkTransactionsSchema.parse(req.body);
      const userId = req.user.id;
      const results = [];

      for (const tx of transactions) {
        const res = await TransactionsController.processTransaction(userId, tx);
        results.push(res);
      }

      return res.status(201).json({ 
        message: 'Processamento em lote concluído', 
        details: results 
      });

    } catch (error: any) {
      logger.error('Erro bulk transactions', error);
      return res.status(400).json({ error: error.errors || error.message });
    }
  }

  // DELETE /transactions/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // --- Lógica de Negócio Centralizada ---
  private static async processTransaction(userId: string, tx: any) {
    try {
      let { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .eq('ticker', tx.ticker)
        .single();

      if (!asset) {
        if (tx.type === 'BUY') {
          const { data: newAsset, error: createError } = await supabase
            .from('assets')
            .insert({
              user_id: userId,
              ticker: tx.ticker,
              quantity: 0,
              avg_price: 0,
              type: tx.assetType || 'Ação',
              sector: tx.sector || null,
              currency: 'BRL'
            })
            .select()
            .single();
          
          if (createError) throw new Error(`Erro ao criar ativo: ${createError.message}`);
          asset = newAsset;
        } else {
          return { ticker: tx.ticker, status: 'error', msg: 'Venda de ativo inexistente' };
        }
      }

      let currentQty = Number(asset.quantity);
      let currentAvg = Number(asset.avg_price);
      const txQty = Number(tx.quantity);
      const txValue = Number(tx.value);

      if (tx.type === 'BUY') {
        const totalOld = currentQty * currentAvg;
        const totalNew = txQty * txValue;
        currentQty += txQty;
        currentAvg = (totalOld + totalNew) / currentQty;
      } else if (tx.type === 'SELL') {
        if (currentQty < txQty) {
          return { ticker: tx.ticker, status: 'error', msg: 'Saldo insuficiente para venda' };
        }
        currentQty -= txQty;
      }

      const { error: updateError } = await supabase
        .from('assets')
        .update({
          quantity: currentQty,
          avg_price: currentAvg,
          updated_at: new Date()
        })
        .eq('id', asset.id);

      if (updateError) throw new Error(updateError.message);

      await supabase.from('transactions').insert({
        asset_id: asset.id,
        type: tx.type,
        value: txValue,
        quantity: txQty,
        transaction_date: tx.date || new Date()
      });

      return { ticker: tx.ticker, status: 'success', new_avg: currentAvg };

    } catch (err: any) {
      return { ticker: tx.ticker, status: 'error', msg: err.message };
    }
  }
}