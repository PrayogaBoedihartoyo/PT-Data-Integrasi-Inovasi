import { Router } from 'express';
import { list, create, setRoles } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { permit } from '../middleware/rbac.js';

const router = Router();
const SYS = 'sys.user.management';

router.get('/', requireAuth, permit(SYS, 'read'), list);
router.post('/', requireAuth, permit(SYS, 'create'), create);
router.put('/:id/roles', requireAuth, permit(SYS, 'update'), setRoles);

export default router;
