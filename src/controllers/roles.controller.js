import { pool } from '../db.js';

export async function list(req, res) {
  const r = await pool.query('SELECT * FROM roles ORDER BY name');
  res.json(r.rows);
}

export async function create(req, res) {
  const { name, description } = req.body || {};
  const r = await pool.query(
    `INSERT INTO roles(id,name,description) VALUES (gen_random_uuid(),$1,$2) RETURNING *`,
    [name, description || null]
  );
  res.status(201).json(r.rows[0]);
}

export async function getPermissions(req, res) {
  const r = await pool.query(
    `SELECT rpm.menu_id, m.code AS menu_code, m.name AS menu_name,
            rpm.can_create, rpm.can_read, rpm.can_update, rpm.can_delete
            FROM role_menu_permissions rpm
     JOIN menus m ON m.id=rpm.menu_id
     WHERE rpm.role_id=$1
     ORDER BY m.code`,
    [req.params.id]
  );
  res.json(r.rows);
}

export async function setPermissions(req, res) {
  const items = Array.isArray(req.body) ? req.body : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const it of items) {
      const m = await client.query('SELECT id FROM menus WHERE code=$1', [it.menu_code]);
      if (m.rowCount === 0) continue;
      const mid = m.rows[0].id;
      await client.query(
        `INSERT INTO role_menu_permissions(role_id, menu_id, can_create, can_read, can_update, can_delete)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (role_id, menu_id)
         DO UPDATE SET can_create=$3, can_read=$4, can_update=$5, can_delete=$6`,
        [req.params.id, mid, !!it.can_create, !!it.can_read, !!it.can_update, !!it.can_delete]
      );
    }
    await client.query('COMMIT');
    res.json({ updated: items.length });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
}
