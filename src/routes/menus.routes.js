import { Router } from 'express';
import { getTree, list, create, update, remove_ } from '../controllers/menus.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();
const SYS = 'sys.menu.management';

router.get('/tree', requireAuth, getTree);
router.get('/', requireAuth, permit(SYS, 'read'), list);
router.post('/', requireAuth, permit(SYS, 'create'), create);
router.put('/:id', requireAuth, permit(SYS, 'update'), update);
router.delete('/:id', requireAuth, permit(SYS, 'delete'), remove_);

export default router;
