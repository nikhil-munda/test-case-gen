import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";
import express, { urlencoded } from "express";

import { errorHandlingMiddleware } from "./middleware.ts/error.middleware.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import subsriptionRoute from "./routes/subscription.route.js";
import testRoute from "./routes/getTest.route.js";
import { handleRazorpayWebhook } from "./webhook/razorpay.webhook.js";

dotenv.config();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(
    cors({ 
        credentials: true, 
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, curl)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        }, 
        exposedHeaders: ["Set-Cookie"] 
    })
);
// Cookie parser MUST be before routes that use cookies
app.use(cookieParser());


// Body parsing middleware
app.use(urlencoded({ extended: true }));

// CORS configuration - allow credentials
// app.use(cors())

// app.post('api/subscription/verifyPayment', handleRazorpayWebhook);
// OPTIONS preflight
// app.options('*', cors({
//   origin: 'http://localhost:3000',
//   credentials: true
// }));
app.use( 
  // console.log(req.headers);
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it before Express parses the request body.
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
  // next();
// }
);
// app.use(express.json());

app.use("/api/subscription", subsriptionRoute);

// Routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);

// Error handling middleware should be last
app.use(errorHandlingMiddleware);

app.get("/", (req: Request, res: Response) => {
  return res.json({
    message: "Server is running fine",
  });
});

app.use("/test", testRoute);
app.listen(process.env.PORT, () => {
  console.log(`Server is listening on the ${process.env.PORT} PORT`);
});
