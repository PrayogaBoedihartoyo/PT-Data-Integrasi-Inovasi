import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub, username, role_id, role_name }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}

export function requireRolePickToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Missing token' });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'role_pick') throw new Error('Wrong token type');
    req.rolePick = payload; // { sub, username, type:'role_pick' }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}
