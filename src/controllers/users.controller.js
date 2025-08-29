import { pool } from '../db.js';
import bcrypt from 'bcryptjs';

export async function list(req, res) {
  const r = await pool.query(
    `SELECT id, username, full_name, email, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json(r.rows);
}
export async function create(req, res) {
  const { username, password, full_name, email, is_active = true } = req.body || {};
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    `INSERT INTO users(id, username, password_hash, full_name, email, is_active)
     VALUES (gen_random_uuid(),$1,$2,$3,$4,$5)
     RETURNING id, username, full_name, email, is_active`,
    [username, hash, full_name || null, email || null, is_active]
  );
  res.status(201).json(r.rows[0]);
}
export async function setRoles(req, res) {
  const { role_ids = [] } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_roles WHERE user_id=$1', [req.params.id]);
    for (const rid of role_ids) {
      await client.query(
        'INSERT INTO user_roles(user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.params.id, rid]
      );
    }
    await client.query('COMMIT');
    res.json({ assigned: role_ids.length });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: e.message });
  } finally {
    client.release();
  }
}
