import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../utilities/asynchandler.js";
import ApiError from "../utilities/ApiError.js";
import jwt from "jsonwebtoken";
import { prisma } from "../utilities/prisma.js";

declare global{
    namespace Express {
        interface Request{
            id?:number;
        }
    }
}

export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {

    console.log(req.cookies);
    const token = req.cookies.token;    
    console.log('token', token);

    if (!token) throw new ApiError(401, "Unauthorized access");
    if (!process.env.JWT_SECRET_KEY)
      throw new ApiError(400, "JWT secret key not found");
    const decodeToken = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    ) as { id: number };

    const user = await prisma.user.findFirst({
      where: {
        id: decodeToken?.id,
      },
      select: {
        id: true,
      },
    });
    if (!user) throw new ApiError(401, "Invalid token user not found");
    req.id = user.id
    next();
  }
);
