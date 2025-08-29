-- Roles dasar
INSERT INTO roles(id,name,description) VALUES
  (gen_random_uuid(),'Admin','Full access'),
  (gen_random_uuid(),'Staff','Limited')
ON CONFLICT DO NOTHING;

-- Admin user (password diubah via API /users; hash dummy diisi dulu)
INSERT INTO users(id,username,password_hash,full_name,email)
VALUES (gen_random_uuid(),'admin','$2a$10$w2E7c6fKQw6S3Gk6x8s9mO2g8P0r1r0xKtfH5HkqXb2cI4mhw2nxa','System Admin','admin@example.com')
ON CONFLICT DO NOTHING;

-- Kaitkan admin -> Admin role
INSERT INTO user_roles(user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username='admin' AND r.name='Admin'
ON CONFLICT DO NOTHING;

-- Menu management/role/user management (system)
WITH sys AS (
  INSERT INTO menus(code,name,order_no) VALUES
   ('sys.menu.management','Menu Management',0),
   ('sys.role.management','Role Management',1),
   ('sys.user.management','User Management',2)
  ON CONFLICT DO NOTHING
  RETURNING id, code
) SELECT * FROM sys;

-- Pohon menu contoh (sesuai gambar)
WITH
m1 AS (INSERT INTO menus(code,name,order_no) VALUES ('menu.1','Menu 1',1) ON CONFLICT DO NOTHING RETURNING id),
m1_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.1','Menu 1.1',id,1 FROM m1 ON CONFLICT DO NOTHING RETURNING id),
m1_2 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.2','Menu 1.2',id,2 FROM m1 ON CONFLICT DO NOTHING RETURNING id),
m1_2_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.2.1','Menu 1.2.1',id,1 FROM m1_2 ON CONFLICT DO NOTHING RETURNING id),
m1_2_2 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.2.2','Menu 1.2.2',id,2 FROM m1_2 ON CONFLICT DO NOTHING RETURNING id),
m1_3 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.3','Menu 1.3',id,3 FROM m1 ON CONFLICT DO NOTHING RETURNING id),
m1_3_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.1.3.1','Menu 1.3.1',id,1 FROM m1_3 ON CONFLICT DO NOTHING RETURNING id),

m2 AS (INSERT INTO menus(code,name,order_no) VALUES ('menu.2','Menu 2',2) ON CONFLICT DO NOTHING RETURNING id),
m2_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.1','Menu 2.1',id,1 FROM m2 ON CONFLICT DO NOTHING RETURNING id),
m2_2 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.2','Menu 2.2',id,2 FROM m2 ON CONFLICT DO NOTHING RETURNING id),
m2_2_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.2.1','Menu 2.2.1',id,1 FROM m2_2 ON CONFLICT DO NOTHING RETURNING id),
m2_2_2 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.2.2','Menu 2.2.2',id,2 FROM m2_2 ON CONFLICT DO NOTHING RETURNING id),
m2_2_2_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.2.2.1','Menu 2.2.2.1',id,1 FROM m2_2_2 ON CONFLICT DO NOTHING RETURNING id),
m2_3 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.2.3','Menu 2.3',id,3 FROM m2 ON CONFLICT DO NOTHING RETURNING id),

m3 AS (INSERT INTO menus(code,name,order_no) VALUES ('menu.3','Menu 3',3) ON CONFLICT DO NOTHING RETURNING id),
m3_1 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.3.1','Menu 3.1',id,1 FROM m3 ON CONFLICT DO NOTHING RETURNING id),
m3_2 AS (INSERT INTO menus(code,name,parent_id,order_no) SELECT 'menu.3.2','Menu 3.2',id,2 FROM m3 ON CONFLICT DO NOTHING RETURNING id)
SELECT 1;

-- Beri Admin full access ke semua menu
INSERT INTO role_menu_permissions(role_id, menu_id, can_create, can_read, can_update, can_delete)
SELECT r.id, m.id, true,true,true,true
FROM roles r, menus m
WHERE r.name = 'Admin'
ON CONFLICT (role_id, menu_id) DO UPDATE SET
 can_create=EXCLUDED.can_create, can_read=EXCLUDED.can_read,
 can_update=EXCLUDED.can_update, can_delete=EXCLUDED.can_delete;

-- Staff hanya read semua contoh menu
INSERT INTO role_menu_permissions(role_id, menu_id, can_read)
SELECT r.id, m.id, true FROM roles r, menus m WHERE r.name='Staff'
ON CONFLICT (role_id, menu_id) DO UPDATE SET can_read=true;
