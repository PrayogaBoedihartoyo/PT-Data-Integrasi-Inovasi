import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function signAccess(user, role) {
  return jwt.sign(
    { sub: user.id, username: user.username, role_id: role.id, role_name: role.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1h' }
  );
}
function signRolePick(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, type: 'role_pick' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ROLE_PICK_EXPIRES || '2m' }
  );
}

export async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });

  const u = await pool.query(
    'SELECT id, username, password_hash, full_name, is_active FROM users WHERE username=$1',
    [username]
  );
  if (u.rowCount === 0) return res.status(401).json({ message: 'Invalid credentials' });
  const user = u.rows[0];
  if (!user.is_active) return res.status(403).json({ message: 'User disabled' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const roles = await pool.query(
    `SELECT r.id, r.name
     FROM roles r JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 ORDER BY r.name`,
    [user.id]
  );

  if (roles.rowCount === 1) {
    const token = signAccess(user, roles.rows[0]);
    return res.json({ token, role: roles.rows[0] });
  }
  const rolePickToken = signRolePick(user);
  return res.json({ rolePickToken, roles: roles.rows });
}

export async function selectRole(req, res) {
  const { role_id } = req.body || {};

  if (!role_id) return res.status(400).json({ message: 'role_id required' });
  
  const { sub: userId, username } = req.rolePick;

  const r = await pool.query(
    `SELECT r.id, r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 AND r.id = $2`,
    [userId, role_id]
  );
  
  if (r.rowCount === 0) return res.status(400).json({ message: 'Role not linked to user' });

  const token = jwt.sign(
    { sub: userId, username, role_id: r.rows[0].id, role_name: r.rows[0].name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '1h' }
  );
  res.json({ token, role: r.rows[0] });
}

export async function me(req, res) {
  const u = await pool.query(
    'SELECT id, username, full_name, is_active FROM users WHERE id=$1',
    [req.user.sub]
  );

  if (u.rowCount === 0) return res.status(401).json({ message: 'User not found' });
  const user = u.rows[0];
  if (!user.is_active) return res.status(403).json({ message: 'User disabled' });

  // user roles
  const roles = await pool.query(
    `SELECT r.id, r.name FROM roles r 
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1 ORDER BY r.name`,
    [user.id]
  );
  user.roles = roles.rows;
  return res.json(user);
}
