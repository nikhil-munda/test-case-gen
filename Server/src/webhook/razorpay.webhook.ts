import type { Request, Response } from "express";
import asyncHandler from "../utilities/asynchandler.js";
import crypto from "crypto";
import ApiError from "../utilities/ApiError.js";
import { prisma } from "../utilities/prisma.js";
import { SubscriptionStatus } from "@prisma/client";
import ApiResponse from "../utilities/ApiResponse.js";



export const handleRazorpayWebhook = asyncHandler(
  async (req: any, res: Response) => {

    console.log('ankit is greate');
    const signature = req.headers["x-razorpay-signature"] as string;
   const webhookBody = req.rawBody; 
   console.log('ankit',webhookBody);
    // if (!signature) {
    //   return res
    //     .status(200)
    //     .json(new ApiResponse(200, {}, "duplicate webhook"));
    // }
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(webhookBody, "utf8")
      .digest("hex");
    console.log(`signature -> ${signature}`);
    console.log(`expectedSignature -> ${expectedSignature}`);
    if (signature !== expectedSignature)
      throw new ApiError(400, "Invalid signature");
    const { event, payload } = req.body;
    if (event === "payment.captured") {
      await handlePaymentCaptured(payload);
    } else {
      await handlePaymentFailed(payload);
    }
    console.log("everhting all good");

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Webhook processed successfully"));
  }
);

const handlePaymentCaptured = async (payload: any) => {
  const payment = payload.payment.entity;
  //   console.log("payload-payment", payload.payment);
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const amount = payment.amount / 100;

  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { razorpayOrderId: orderId },
      select: {
        userId: true,
        id: true,
        amount: true,
      },
    });

    if (!subscription) {
      console.log("Subscription not found for order:", orderId);
      return;
    }
    const updatedSubscription = await tx.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        razorpayPaymentId: paymentId,
        status: SubscriptionStatus.PAID,
        expiresAt: calculateExpiryDate(subscription.amount),
      },
    });
    await tx.user.update({
      where: {
        id: subscription.userId,
      },
      data: {
        isPremium: true,
        premiumExpiresAt: updatedSubscription.expiresAt,
      },
    });
  });
  console.log("verification done");
};
const handlePaymentFailed = async (payload: any) => {
  const payment = payload.payment.entity;
  const orderId = payment.order_id;

  await prisma.subscription.updateMany({
    where: { razorpayOrderId: orderId },
    data: {
      status: SubscriptionStatus.FAILED,
    },
  });
};

const calculateExpiryDate = (amount: number): Date => {
  const expiresAt = new Date();
  const months = amount / 100;
  expiresAt.setMonth(expiresAt.getMonth() + months);
  return expiresAt;
};
