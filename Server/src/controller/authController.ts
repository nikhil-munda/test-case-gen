import axios, { type AxiosResponse } from "axios";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import ApiError from "../utilities/ApiError.js";
import ApiResponse from "../utilities/ApiResponse.js";
import asyncHandler from "../utilities/asynchandler.js";
import { prisma } from "../utilities/prisma.js";
import { sendEmail } from "../utilities/sendOTP.js";

dotenv.config();
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (email?.trim() === "" || !email || password?.trim() === "" || !password) {
    throw new ApiError(400, "Email and Password are Required");
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (!user) throw new ApiError(400, "User doesn't exist with this mail id");
  if (!user.password) throw new ApiError(400, "First make an password");
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) throw new ApiError(400, "Password is incorrect");
  const payload = {
    id: user.id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!);

  return res
    .cookie("token", token, {
      sameSite: "none",
      httpOnly: true,
      secure: true,
    })
    .status(200)
    .json(new ApiResponse(200, token, "successfully login"));
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (
    !email ||
    !name ||
    !password ||
    email.trim().length === "" ||
    password.trim().length === "" ||
    name.trim().length === ""
  )
    throw new ApiError(400, "Fields are missing");

  const existingUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  if (existingUser) throw new ApiError(403, "User already exists");
  const otp = Math.floor(10000 + Math.random() * 90000);

  await prisma.otp.create({
    data: {
      email,
      otp,
    },
  });
  const emailResult = await sendEmail(email, otp);
  if (!emailResult.success) throw new ApiError(500, "failed to send the mail");
  res.json(new ApiResponse(200, {}, "OTP Sent Successfully"));
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { otp, email, name, password } = req.body;
  const OTP = await prisma.otp.findFirst({
    where: {
      email,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (!name || !email || !password || !otp)
    throw new ApiError(400, "fields are missing");
  if (!OTP) throw new ApiError(400, "otp not matched");
  const time = Date.now() - new Date(OTP.createdAt).getTime();
  if (time > 180000) throw new ApiError(400, "time passed");
  if (OTP.otp !== parseInt(otp)) throw new ApiError(403, "OTP is incorrect");
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });
  const payload = {
    id: newUser.id,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!);
  res
    .status(200)
    .cookie("token", token, {
      sameSite: "none",
      httpOnly: true,
      secure: true,
    })
    .json(new ApiResponse(200, {}, "User successfully created"));
});

export const getGoogleAuthURL = asyncHandler(
  async (req: Request, res: Response) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    if (!process.env.SERVER_ROOT_URI || !process.env.GOOGLE_CLIENT_ID)
      throw new ApiError(400, "Some fields are missing");
    const options = {
      redirect_uri: `${process.env.SERVER_ROOT_URI}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: "offline",
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };

    const qs = new URLSearchParams(options);
    const authUrl = `${rootUrl}?${qs.toString()}`;

    res.json(new ApiResponse(200, { authUrl }, "Google auth URL generated"));
  }
);

export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code) {
      throw new ApiError(400, "Authorization code is required");
    }

    try {
      // Get tokens from Google
      const tokens = await getTokens({
        code: code as string,
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: `${process.env.SERVER_ROOT_URI}/api/auth/google/callback`,
      });

      // Get user info from Google
      const googleUser = await axios
        .get(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
          {
            headers: { Authorization: `Bearer ${tokens.id_token}` },
          }
        )
        .then((res) => res.data);

      // Check if user exists in database
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ email: googleUser.email }, { googleId: googleUser.id }],
        },
      });

      // If user doesn't exist, create new user
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            googleId: googleUser.id,
            picture: googleUser.picture,
            password: null, // No password for Google users
          },
        });
      } else if (!user.googleId || !user.picture) {
        // If user exists but doesn't have googleId, update it
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.id,
            picture: googleUser.picture || user.picture,
          },
        });
      }

      // Create JWT token
      const payload = {
        id: user.id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
        expiresIn: "1d",
      });

      // Set cookie and redirect
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 1 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "lax",
        })
        .redirect(`${process.env.CLIENT_URL}`);
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.redirect(`${process.env.CLIENT_URL}/signin?error=google_auth_failed`);
    }
  }
);

// Helper function for getting tokens
async function getTokens({
  code,
  clientId,
  clientSecret,
  redirectUri,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}) {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  try {
    const res = await axios.post(url, new URLSearchParams(values), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return res.data;
  } catch (error: any) {
    console.error("Failed to fetch auth tokens:", error.response?.data?.error);
    throw new Error(error.message);
  }
}

export const getGithubAuthURL = asyncHandler(
  async (req: Request, res: Response) => {
    const rootUrl = "https://github.com/login/oauth/authorize";

    if (!process.env.SERVER_ROOT_URI || !process.env.GITHUB_CLIENT_ID)
      throw new ApiError(400, "Some fields are missing");
    const options = {
      redirect_uri: `${process.env.SERVER_ROOT_URI}/api/auth/github/callback`,
      client_id: process.env.GITHUB_CLIENT_ID,
      scope: "user:email",
      state: Math.random().toString(36).substring(7),
    };

    const qs = new URLSearchParams(options);
    const authUrl = `${rootUrl}?${qs.toString()}`;

    res.json(new ApiResponse(200, { authUrl }, "GitHub auth URL generated"));
  }
);

export const githubCallback = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code) {
        throw new ApiError(400, "Authorization code is required");
      }
      let token: AxiosResponse<{ access_token: string }> = await axios.post(
        `https://github.com/login/oauth/access_token`,
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: `${process.env.SERVER_ROOT_URI}/api/auth/github/callback`,
        },
        {
          headers: {
            Accept: "application/json", // This makes GitHub return JSON instead of query string
          },
        }
      );

      const { access_token } = token.data;

      // console.log('acces_token', access_token);

      const response = await axios.get(`https://api.github.com/user`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      // Get user emails (separate API call)
      const emailResponse = await axios.get(
        `https://api.github.com/user/emails`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "User-Agent": "TestCaseExtension",
          },
        }
      );
      const { email, verified } = emailResponse.data[0];

      // ✅ Should find primary verified email
      const emails = emailResponse.data;
      const primaryEmail = emails.find(
        (email: any) => email.primary && email.verified
      );

      if (!primaryEmail) {
        throw new ApiError(400, "No verified email found");
      }
      let user = await prisma.user.findFirst({
        where: {
          email: primaryEmail.email,
        },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: primaryEmail.email,
            name: response.data.login,
            picture: response.data.avatar_url || "",
          },
        });
      } else {
        user = await prisma.user.update({
          where: {
            email: primaryEmail.email,
          },
          data: {
            picture: response.data.avatar_url || user.picture || "",
          },
        });
      }
      const jwttoken = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
        expiresIn: "1d",
      });

      return res
        .cookie("token", jwttoken, {
          sameSite: "lax",
          httpOnly: true,
          secure: true,
          maxAge: 1 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .redirect(`${process.env.CLIENT_URL}/`);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.redirect(`${process.env.CLIENT_URL}/signin?error=github_auth_failed`);
    }
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })
    .json(new ApiResponse(200, {}, "Logout successful"));
});
