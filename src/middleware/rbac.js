import { pool } from '../db.js';

/**
 * permit('MENU_MANAGEMENT','create'|'read'|'update'|'delete')
 */
export function permit(menuCode, action = 'read') {
  const col = { create:'can_create', read:'can_read', update:'can_update', delete:'can_delete' }[action];
  return async (req, res, next) => {
    try {
      const { role_id } = req.user || {};
      if (!role_id) return res.status(403).json({ message: 'No role in token' });
      const q = `
        SELECT rpm.${col}
        FROM menus m
        JOIN role_menu_permissions rpm ON rpm.menu_id = m.id
        WHERE m.code = $1 AND rpm.role_id = $2
      `;
      const r = await pool.query(q, [menuCode, role_id]);
      if (r.rowCount === 0 || r.rows[0][col] !== true) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  };
}
