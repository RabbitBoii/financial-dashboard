import { Router } from 'express';
import { createRecord, getRecords, getRecordById, updateRecord, deleteRecord } from '../controllers/recordsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('admin'), createRecord);
router.get('/', authenticate, authorize('viewer', 'analyst', 'admin'), getRecords);
router.get('/:id', authenticate, authorize('viewer', 'analyst', 'admin'), getRecordById);
router.patch('/:id', authenticate, authorize('admin'), updateRecord);
router.delete('/:id', authenticate, authorize('admin'), deleteRecord);

export default router;