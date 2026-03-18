import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '5h' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    return cookies['sanjeevni_token'] || null;
  }
  return null;
}

import { getToken } from 'next-auth/jwt';

export async function getUserFromRequest(request) {
  // 1. Try custom token first
  const token = getTokenFromRequest(request);
  if (token) {
    const user = verifyToken(token);
    if (user) return user;
  }

  // 2. Fallback to Next-Auth session
  try {
    const nextAuthToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET 
    });
    
    if (nextAuthToken) {
      return {
        userId: nextAuthToken.id,
        role: nextAuthToken.role,
        name: nextAuthToken.name,
        email: nextAuthToken.email
      };
    }
  } catch (err) {
    console.error('Next-Auth session bridge error:', err);
  }

  return null;
}
