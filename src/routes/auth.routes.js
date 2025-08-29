import { Router } from 'express';
import { login, selectRole, me } from '../controllers/auth.controller.js';
import { requireAuth, requireRolePickToken } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.post('/select-role', requireRolePickToken, selectRole);
router.get('/me', requireAuth, me);

export default router;
