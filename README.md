# PT Data Integrasi Inovasi  
## RBAC Login & Menu Access Management (Node.js + PostgreSQL)

A simple, production-ready backend for Login + Role selection + Menu access (RBAC) using Node.js, Express, PostgreSQL, JWT.

### Features
- Karyawan login dengan username + password.
- Jika user punya banyak jabatan → pilih role setelah login.
- Menu yang tampil tergantung role + izin CRUD.
- Admin bisa manage Menu, Role + permissions, serta User + roles.

## Folder Structure
```
DATA_INTEGRASI INOVASI/
├─ docker-compose.yml
├─ db/
│  └─ initdb/
│     ├─ 01_schema.sql
│     └─ 02_seed.sql
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ db.js
│  ├─ middleware/
│  │  ├─ auth.js
│  │  └─ rbac.js
│  ├─ controllers/
│  │  ├─ auth.controller.js
│  │  ├─ menus.controller.js
│  │  ├─ roles.controller.js
│  │  └─ users.controller.js
│  └─ routes/
│     ├─ auth.routes.js
│     ├─ menus.routes.js
│     ├─ roles.routes.js
│     └─ users.routes.js
├─ .env
├─ package.json
└─ README.md

```



## 🚀 Quickstart (Docker)

1. Clone repo ini
2. Buat file `.env`
3. Jalankan:

```bash
docker-compose up -d
docker compose ps
docker logs rbacdb --tail=100   # pastikan ada "PostgreSQL init process complete"
```

## Set password user admin (seed memakai dummy hash)
```
docker exec -it rbacdb psql -U rbacuser -d rbacdb \
  -c "UPDATE users SET password_hash = crypt('Admin123!', gen_salt('bf',10)) WHERE username='admin';"

```

## ▶️ Menjalankan API
```npm install```
```npm run dev```
### Route API
http://localhost:4000/

## Database Schema (ERD)
```
erDiagram
  users {
    uuid id PK
    text username UK
    text password_hash
    text full_name
    text email
    boolean is_active
    timestamptz created_at
  }

  roles {
    uuid id PK
    text name UK
    text description
    timestamptz created_at
  }

  user_roles {
    uuid user_id FK
    uuid role_id FK
    timestamptz created_at
    PK {user_id, role_id}
  }

  menus {
    uuid id PK
    text code UK
    text name
    uuid parent_id FK "self"
    text url_path
    text icon
    int order_no
    boolean is_active
    timestamptz created_at
  }

  role_menu_permissions {
    uuid role_id FK
    uuid menu_id FK
    boolean can_create
    boolean can_read
    boolean can_update
    boolean can_delete
    timestamptz created_at
    PK {role_id, menu_id}
  }

  users ||--o{ user_roles : has
  roles ||--o{ user_roles : has
  menus ||--o{ menus : parent_of
  roles ||--o{ role_menu_permissions : grants
  menus ||--o{ role_menu_permissions : guarded_by
```


## Auth
| Method | Endpoint      | Description      |
| ------ | ------------- | ---------------- |
| POST   | /auth/login   | Login user       |
| POST   | /auth/select-role | select role if multi-role |
| GET    | /auth/me          | check user   |

### Contoh
```
POST /auth/login
Content-Type: application/json

{ "username": "admin", "password": "Admin123!" }

{
    "role_id": "c42f69e5-35fe-47ff-867d-36392acf4ce7"
}

```

### Respon (single-role):
```
{ "token":"<ACCESS_JWT>", "role": { "id":"...","name":"Admin" } }
```

## Respon (multi-role):
```
{ "rolePickToken":"<SHORT_JWT>", "roles":[{ "id":"...","name":"Staff"}] }
```

## Menus
| Method | Endpoint    | Description                           |
| ------ | ----------- | ------------------------------------- |
| GET    | /menus/tree | Get accessible menus by role (nested) |
| GET    | /menus/      | List all menus                        |
| POST   | /menus/      | Create menu                           |
| PUT    | /menus/\:id | Update menu                           |
| DELETE | /menus/\:id | Delete menu                           |

### Body contoh POST Menus
```
{
    "name": "",
    "parent_id" : "",
    "url_path" : "", 
    "icon" : "", 
    "order_no" : "", 
    "is_active" : ""
}
```

## Roles
| Method | Endpoint    | Description     |
| ------ | ----------- | --------------- |
| GET    | /roles      | List all roles  |
| POST   | /roles      | Create new role |
| PUT    | /roles/\:id/\permissions | Update role     |
| DELETE | /roles/\:id/\permissions | Delete role     |

### Contoh PUT /roles/:id/permissions
```
[
  {
    "menu_code": "1.1.1",      // kode unik menu yang ada di tabel menus
    "can_create": true,        // atau false
    "can_read": true,
    "can_update": false,
    "can_delete": false
  },
  {
    "menu_code": "2.2.2.1",
    "can_create": true,
    "can_read": true,
    "can_update": true,
    "can_delete": false
  }
]
```

## Users
| Method | Endpoint    | Description     |
| ------ | ----------- | --------------- |
| GET    | /users      | List all users  |
| POST   | /users      | Create new user |
| PUT    | /users/\:id | Update user     |
| DELETE | /users/\:id | Delete user     |

### Contoh POST /users
```
{
  "username": "jdoe",
  "password": "StrongP4ss!",
  "full_name": "John Doe",
  "email": "john@acme.com",
  "is_active": true
}
```



## 📋 ERD (Entity Relationship Diagram)
Lihat folder /docs/


## 💡 Frontend Usage (How FE calls it)
### Flow

1. Login dengan ```/auth/login``` → jika multi-role, lanjut ```/auth/select-role```. Simpan token (idealnya di memory/HttpOnly cookie).
2. Panggil ```/auth/me``` untuk verifikasi dan menampilkan nama/role di header.
3. Panggil ```/menus/tree``` → render sidebar (recursive).

4. Saat masuk halaman admin:
  - ```/menus``` untuk daftar semua menu.

  - ```/roles``` untuk daftar role, /roles/:id/permissions untuk matriks izin (Admin).

  - ```/users``` dan ```PUT /users/:id/roles``` untuk kelola user ↔ role.

5. Aksi (create/update/delete) → jika 403, berarti role aktif memang tak punya izin.

## Reset & Reseed
```
docker compose down -v
docker compose up -d
```

## Lisensi
LGTM! — bebas digunakan untuk belajar maupun pengembangan internal.

