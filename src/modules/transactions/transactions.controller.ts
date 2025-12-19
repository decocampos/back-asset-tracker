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
  date: z.string().datetime().optional() // Opcional, se não vier usa NOW
});

const bulkTransactionsSchema = z.array(transactionSchema);

export class TransactionsController {

  // POST /transactions (Individual)
  static async create(req: Request, res: Response) {
    try {
      const txData = transactionSchema.parse(req.body);
      const userId = req.user.id;

      // Reutiliza a lógica centralizada
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
        // Processa um por um
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

  // --- Lógica de Negócio Centralizada ---
  private static async processTransaction(userId: string, tx: any) {
    try {
      // 1. Busca o Ativo pelo Ticker
      let { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .eq('ticker', tx.ticker)
        .single();

      // 2. Cria se não existir (apenas COMPRA)
      if (!asset) {
        if (tx.type === 'BUY') {
          const { data: newAsset, error: createError } = await supabase
            .from('assets')
            .insert({
              user_id: userId,
              ticker: tx.ticker,
              quantity: 0,
              avg_price: 0,
              type: 'Ação', // Default
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

      // 3. Cálculo Matemático (Preço Médio)
      let currentQty = Number(asset.quantity);
      let currentAvg = Number(asset.avg_price);
      
      const txQty = Number(tx.quantity);
      const txValue = Number(tx.value);

      if (tx.type === 'BUY') {
        // PM = ((QtdAtual * PMAtual) + (QtdCompra * $Compra)) / NovaQtdTotal
        const totalOld = currentQty * currentAvg;
        const totalNew = txQty * txValue;
        
        currentQty += txQty;
        currentAvg = (totalOld + totalNew) / currentQty;

      } else if (tx.type === 'SELL') {
        // Venda não altera preço médio, só quantidade
        if (currentQty < txQty) {
          return { ticker: tx.ticker, status: 'error', msg: 'Saldo insuficiente para venda' };
        }
        currentQty -= txQty;
      }

      // 4. Atualiza Ativo no Banco
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          quantity: currentQty,
          avg_price: currentAvg,
          updated_at: new Date()
        })
        .eq('id', asset.id);

      if (updateError) throw new Error(updateError.message);

      // 5. Salva Histórico da Transação
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