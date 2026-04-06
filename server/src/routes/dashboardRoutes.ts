import { Router } from 'express';
import { getSummary } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, authorize('analyst', 'admin'), getSummary);

export default router;