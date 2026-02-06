import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import appError from "./appError";

interface AuthRequest extends Request {
  userId?: number;
}

interface AuthJwtPayload extends JwtPayload {
  userId: number;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  const token = req.cookies?.token

  if (!token) {
    throw new appError("You are not Authenticated", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJwtPayload;

    if (!decoded.userId) {
      throw new appError("Invalid token payload", 401);
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    throw new appError("Invalid or expired token", 401);
  }
}
