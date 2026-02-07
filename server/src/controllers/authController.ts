import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "../types/authSchema";
import { loginUser, registerUser,verifyToken } from "../services/authService";
import appError from "../middlewares/appError";

interface loginRequest extends Request{
  userId?:number
}

export async function register(req: Request, res: Response , next:NextFunction) {
 
  try{

  const body = registerSchema.parse(req.body);

  const user = await registerUser(
    body.name,
    body.email,
    body.password
  );

   res.status(201).json({ success: true, user });
  }
  catch(err){
    next(err)
  }

 
}

export async function login(req: Request, res: Response, next:NextFunction) {
  
  try{
    
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body.email, body.password);

  res.cookie("token",result.token,{
    httpOnly: true,
    sameSite: "none",
    path:"/",
    secure: process.env.NODE_ENV === "production",
  })

  res.json({ success: true, token:result.token });
  }
  catch(err){
    next(err)
  }
  

}

export async function me(req:loginRequest,res:Response){
  const token = req.cookies?.token
  await verifyToken(token)
  res.json({
    success:true,
    user:{
      id:req.userId,
      token
    }
  })
}

export function logout(req:Request,res:Response) {
  res.clearCookie("token");
  res.json({ success: true });
}