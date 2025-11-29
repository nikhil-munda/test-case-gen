import type { Request, Response } from "express";
import fs from "fs";
import ApiError from "../utilities/ApiError.js";
import ApiResponse from "../utilities/ApiResponse.js";
import asyncHandler from "../utilities/asynchandler.js";
import cloudinary from "../utilities/cloudinary.js";
import { prisma } from "../utilities/prisma.js";

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.id;
    console.log('userId', userId);
    if (!userId) throw new ApiError(400, "User not found");

    // Get user with subscription information
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        picture: true,
        isPremium: true,
        premiumExpiresAt: true,
      },
    });

    return res.status(200).json(new ApiResponse(200, user, "user information"));
  }
);

export const updateUserDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { name } = req.body;
    const file = req.file;

    const userId = req.id as number;
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user) throw new ApiError(400, "User not found");
    let picture = user.picture;
    let oldPicture = picture;
    if (file) {
      const response = await cloudinary.uploader.upload(file.path, {
        folder: "profile_pictures",
      });
      picture = response.secure_url;
    }
    // Clean up local file after successful upload
    if (file)
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Local file cleaned up: ${file.path}`);
        }
      } catch (cleanupError) {
        console.error("Failed to delete local file:", cleanupError);
      }
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name || user.name,
        picture: picture,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "updated successfully"));
  }
);
