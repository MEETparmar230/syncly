import { NextFunction, Request, Response } from "express";
import appError from "./appError";

const errorHandler = (err:unknown,req:Request,res:Response,next:NextFunction): void=>{

let statusCode = 500;
  let message = "Something went wrong";

 if (err instanceof appError) {
    statusCode = err.statusCode;
    message = err.message;
  }

    console.log(err)

    if(process.env.NODE_ENV=="production"){
        if(!(err instanceof appError)){
            message = "Internal Server Error"
        }
    }

    res.status(statusCode).json({success:false, message})
}

export default errorHandler;