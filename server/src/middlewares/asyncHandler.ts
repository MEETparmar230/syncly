import { NextFunction, Request, Response } from "express";

type asyncHandler<T = unknown> = (
    req:Request,
    res:Response,
    next:NextFunction
 ) => Promise<T>

const asyncHandler = <T>(fn:asyncHandler<T>) =>async (req:Request,res:Response,next:NextFunction):Promise<void> => {
    try{
        await fn(req,res,next);
    }

    catch(err){
        next(err)
    }
}

export default asyncHandler;