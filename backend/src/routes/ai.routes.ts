import { Router, Request, Response } from 'express';
import AIService from '../services/ai.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de IA precisam autenticação
router.use(authMiddleware);

/**
 * POST /api/ai/chat
 * Processa mensagens de chat com IA
 */
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const userId = (req as any).userId;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await AIService.processChat(userId, message);
        res.json(response);
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/process-receipt
 * Processa comprovante com OCR
 */
router.post('/process-receipt', async (req: Request, res: Response) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const extractedData = await AIService.processReceipt(imageBase64);
        res.json(extractedData);
    } catch (error: any) {
        console.error('OCR error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/financial-health
 * Analisa saúde financeira
 */
router.get('/financial-health', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const analysis = await AIService.analyzeFinancialHealth(userId);
        res.json(analysis);
    } catch (error: any) {
        console.error('Financial health error:', error);
        res.status(500).json({ error: error.message });
    }
});

export { router as aiRouter };
