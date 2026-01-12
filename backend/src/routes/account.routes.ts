import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
router.use(authMiddleware);

// TODO: Implementar CRUDs de contas
router.get('/', async (req, res) => {
    res.json({ message: 'List accounts' });
});

router.post('/', async (req, res) => {
    res.json({ message: 'Create account' });
});

export { router as accountRouter };
