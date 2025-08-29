import { Router } from 'express';
import { list, create, getPermissions, setPermissions } from '../controllers/roles.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();
const SYS = 'sys.role.management';

router.get('/', requireAuth, permit(SYS, 'read'), list);
router.post('/', requireAuth, permit(SYS, 'create'), create);
router.get('/:id/permissions', requireAuth, permit(SYS, 'read'), getPermissions);
router.put('/:id/permissions', requireAuth, permit(SYS, 'update'), setPermissions);

export default router;
