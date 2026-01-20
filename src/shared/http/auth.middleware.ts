import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "../../models/user.model.js";
import { AuthTokenInvalidError } from "../../modules/auth/errors/index.js";
import { AuthRepository } from "../../modules/auth/auth.repository.js";

const repository = new AuthRepository();

const publicPaths = [
  '/health',
  '/api/health',
  '/auth/check-email',
  '/auth/login'
];

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  
  if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath))) {
    console.log(`[AUTH] Rota pública ignorada: ${path}`);
    return next();
  }
  
  console.log(`[AUTH] Middleware chamado para ${req.method} ${req.path}`);
  
  const authorization = req.headers.authorization;
  console.log('[AUTH] Authorization header:', authorization ? 'presente' : 'ausente');
  
  if (!authorization || !authorization.startsWith("Bearer ")) {
    console.log('[AUTH] Token não encontrado ou formato inválido');
    return next(new AuthTokenInvalidError());
  }
  
  const token = authorization.replace("Bearer ", "");
  console.log('[AUTH] Token extraído, tamanho:', token.length);
  
  try {
    console.log('[AUTH] Verificando token JWT...');
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    console.log('[AUTH] Token JWT válido, payload:', { userId: payload.userId, role: payload.role });
    
    if (
      typeof payload !== "object" ||
      payload.userId === undefined ||
      payload.role === undefined ||
      payload.email === undefined
    ) {
      console.log('[AUTH] Payload do token inválido');
      return next(new AuthTokenInvalidError());
    }
    
    console.log('[AUTH] Verificando token ativo no banco...');
    const activeToken = await repository.findActiveToken(
      token,
      Number(payload.userId)
    );
    
    if (!activeToken) {
      console.log('[AUTH] Token não encontrado no banco ou inativo');
      return next(new AuthTokenInvalidError());
    }
    
    console.log('[AUTH] Token válido e ativo');
    req.user = {
      userId: Number(payload.userId),
      role: payload.role as UserRole,
      email: String(payload.email),
      token
    };
    return next();
  } catch (error) {
    console.error('[AUTH] Erro ao verificar token:', error);
    return next(new AuthTokenInvalidError());
  }
};

export { authMiddleware };
