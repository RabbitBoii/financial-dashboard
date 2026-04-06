import { Router } from 'express';
import { getAllUsers, updateUserRole, updateUserStatus, getCurrentUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/me', authenticate, getCurrentUser);
router.patch('/:id/role', authenticate, authorize('admin'), updateUserRole);
router.patch('/:id/status', authenticate, authorize('admin'), updateUserStatus);

export default router;