import { JwtPayload } from "jsonwebtoken";

export interface AuthJwtPayload extends JwtPayload {
  userId: number;
}
