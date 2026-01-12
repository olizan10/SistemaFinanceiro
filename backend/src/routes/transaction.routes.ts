import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
router.use(authMiddleware);

// TODO: Implementar CRUDs de transações
router.get('/', async (req, res) => {
    res.json({ message: 'List transactions' });
});

router.post('/', async (req, res) => {
    res.json({ message: 'Create transaction' });
});

export { router as transactionRouter };
