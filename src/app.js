import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import menuRoutes from './routes/menus.routes.js';
import roleRoutes from './routes/roles.routes.js';
import userRoutes from './routes/users.routes.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => res.json({ ok: true, name: 'RBAC Menu API' }));

app.use('/auth', authRoutes);
app.use('/menus', menuRoutes);
app.use('/roles', roleRoutes);
app.use('/users', userRoutes);

export default app;
