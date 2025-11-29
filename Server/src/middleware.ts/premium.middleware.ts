import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../utilities/asynchandler.js";
import ApiError from "../utilities/ApiError.js";
import { prisma } from "../utilities/prisma.js";

export const isPremiumUserMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.id;
    const {thinkingLevel} = req.body;
    
    if (!id) throw new ApiError(403, "unauthorized access");
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        isPremium: true,
        premiumExpiresAt: true,
      },
    });
    const now = new Date();
    if (user?.isPremium && user.premiumExpiresAt && user.premiumExpiresAt >= now) next();
    else if(thinkingLevel === 'Basic')next()
    else throw new ApiError(403, "unauthorized access");
  }
);
