import { Router } from 'express';
import {
  getActiveCategories,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../controllers/category.controller.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { uploadProductImages } from '../utils/upload.js';

const router = Router();

router.get('/', getActiveCategories);

router.get('/admin', authenticateAdmin, adminGetCategories);
router.post('/admin', authenticateAdmin, uploadProductImages.single('image'), adminCreateCategory);
router.put('/admin/:id', authenticateAdmin, uploadProductImages.single('image'), adminUpdateCategory);
router.delete('/admin/:id', authenticateAdmin, adminDeleteCategory);

export default router;
