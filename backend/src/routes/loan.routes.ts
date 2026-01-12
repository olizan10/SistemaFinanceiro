import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
    res.json({ message: 'List loans' });
});

export { router as loanRouter };
