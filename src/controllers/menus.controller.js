import { pool } from '../db.js';

export async function getTree(req, res) {
  const { role_id } = req.user;
  if (!req.user?.role_id) {
    return res.status(401).json({ message: 'No role in token' });
  }

  const sql = `
    SELECT m.id, m.code, m.name, m.parent_id, m.url_path, m.icon, m.order_no
    FROM menus m
    JOIN role_menu_permissions p ON p.menu_id = m.id
    WHERE p.role_id = $1
      AND p.can_read = true
      AND m.is_active = true
    ORDER BY m.order_no, m.name
  `;
  const r = await pool.query(sql, [role_id]);

  // map id -> node
  const byId = new Map(r.rows.map(x => [x.id, { ...x, children: [] }]));

  // bentuk forest (anak yang parent-nya tidak ada di hasil = root)
  const roots = [];
  for (const n of byId.values()) {
    if (n.parent_id && byId.has(n.parent_id)) {
      byId.get(n.parent_id).children.push(n);
    } else {
      roots.push(n);
    }
  }

  // sort children per level (order_no, name)
  const sortNodes = nodes => {
    nodes.sort((a,b) => (a.order_no - b.order_no) || a.name.localeCompare(b.name));
    for (const c of nodes) if (c.children?.length) sortNodes(c.children);
  };
  sortNodes(roots);

  res.json({ items: roots });
}

export async function list(req, res) {
  const r = await pool.query('SELECT * FROM menus');
  res.json(r.rows);
}

export async function create(req, res) {
  const { code, name, parent_id, url_path, icon, order_no = 0, is_active = true } = req.body || {};
  if (!code || !name) return res.status(400).json({ message: 'code & name required' });

  const r = await pool.query(
    `INSERT INTO menus(id, code, name, parent_id, url_path, icon, order_no, is_active)
     VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [code, name, parent_id || null, url_path || null, icon || null, order_no, is_active]
  );
  
  res.status(201).json(r.rows[0]);
}
export async function update(req, res) {
  const { id } = req.params;
  const { name, parent_id, url_path, icon, order_no, is_active } = req.body || {};
  const r = await pool.query(
    `UPDATE menus SET
       name = COALESCE($2,name),
       parent_id = $3,
       url_path = $4,
       icon = $5,
       order_no = COALESCE($6,order_no),
       is_active = COALESCE($7,is_active)
     WHERE id=$1 RETURNING *`,
    [id, name || null, parent_id || null, url_path || null, icon || null, order_no, is_active]
  );
  if (r.rowCount === 0) return res.status(404).json({ message: 'Not found' });
  res.json(r.rows[0]);
}
export async function remove_(req, res) {
  const r = await pool.query('DELETE FROM menus WHERE id=$1', [req.params.id]);
  res.json({ deleted: r.rowCount });
}
