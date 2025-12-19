import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { z } from 'zod';
import logger from '../../core/logger';

// Schemas
const assetSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().optional(),
  type: z.string().default('Ação'),
  currency: z.string().default('BRL'),
  quantity: z.number().default(0),
  avg_price: z.number().default(0),
});

const bulkAssetsSchema = z.array(assetSchema);

export class AssetsController {
  
  // GET /assets
  static async list(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', req.user.id);

      if (error) throw error;

      // Cálculo do total consolidado (Qtd * Preço Atual)
      // Nota: Se current_price for 0 (sem cotação), usa o avg_price como fallback visual
      const totalValue = data.reduce((acc, curr) => {
        const price = curr.current_price > 0 ? curr.current_price : curr.avg_price;
        return acc + (curr.quantity * price);
      }, 0);

      return res.json({
        total_consolidated: totalValue,
        count: data.length,
        assets: data
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /assets (Rota Individual)
  static async create(req: Request, res: Response) {
    try {
      const data = assetSchema.parse(req.body);
      
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          ...data,
          user_id: req.user.id,
          current_price: data.avg_price // Inicia com o preço pago
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(asset);
    } catch (error: any) {
      return res.status(400).json({ error: error.errors || error.message });
    }
  }

  // DELETE /assets/:id
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id); // Garante que só deleta o seu

      if (error) throw error;

      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // POST /assets/bulk
  static async bulkCreate(req: Request, res: Response) {
    try {
      const assets = bulkAssetsSchema.parse(req.body);
      
      const assetsToInsert = assets.map(asset => ({
        ...asset,
        user_id: req.user.id,
        current_price: asset.avg_price
      }));

      const { data, error } = await supabase
        .from('assets')
        .insert(assetsToInsert)
        .select();

      if (error) throw error;

      logger.info(`${data.length} ativos importados.`);
      return res.status(201).json({ message: 'Importação concluída', count: data.length });

    } catch (error: any) {
      return res.status(400).json({ error: error.errors || error.message });
    }
  }
}