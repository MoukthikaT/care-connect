import express from 'express';
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  toggleCategoryActive 
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/rbacMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes (Operations Manager & Platform Admin)
router.use(protect);
router.use(authorize(ROLES.OPS_MANAGER, ROLES.ADMIN));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.patch('/:id/deactivate', toggleCategoryActive);

export default router;
