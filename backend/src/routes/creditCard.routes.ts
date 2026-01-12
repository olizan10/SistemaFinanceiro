import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
router.use(authMiddleware);

// TODO: Implementar CRUDs de cartões de crédito
router.get('/', async (req, res) => {
    res.json({ message: 'List credit cards' });
});

router.post('/', async (req, res) => {
    res.json({ message: 'Create credit card' });
});

export { router as creditCardRouter };
