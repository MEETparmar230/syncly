import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import db from "../db";
import appError from "../middlewares/appError";
import { AuthJwtPayload } from "../types/jwtSchema";
import { or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  try {


    const existingUser = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(or(eq(usersTable.email, email), eq(usersTable.name, name)))



    if (existingUser.length != 0) {
      const exists = existingUser[0]

      if (exists?.email === email && exists?.name === name) {
        throw new appError("Name and Email both already exists", 409)
      }

      if (exists?.email === email) {
        throw new appError("Email already exists", 409)
      }

      if (exists?.name === name) {
        throw new appError("UserName is Taken", 409)
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      });
    return user;
  } catch (err) {
    if (err instanceof appError) {
      throw err
    }

    console.log("Registration DB error:", err);
    throw new appError("Registration service temporarily unavailable", 503)
  }
}



export async function loginUser(email: string, password: string) {

  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((res) => res[0]);

    if (!user) throw new appError("Invalid credentials", 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new appError("Invalid credentials", 401);


    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token, userId: user.id };
  }
  catch (err) {
    if (err instanceof appError) {
      throw err
    }
    console.error("Login DB error:", err);
    throw new appError("Authentication service temporarily unavailable", 503)
  }
}




export const verifyToken = (t: string) => {

  if (!t) {
    throw new appError("Not Authenticated", 401);
  }

  try {
    const decoded = jwt.verify(t, JWT_SECRET) as AuthJwtPayload;

    if (!decoded.userId) {
      throw new appError("Invalid token payload", 401);
    }

  } catch (err) {
    throw new appError("Invalid or expired token", 401);
  }
}