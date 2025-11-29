import type { Request, Response } from "express";
import asyncHandler from "../utilities/asynchandler.js";
import ApiError from "../utilities/ApiError.js";
import { instance } from "../utilities/razorpay.js";
import { prisma } from "../utilities/prisma.js";
import { SubscriptionStatus } from "@prisma/client";
import ApiResponse from "../utilities/ApiResponse.js";


const price: number = 100;
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { month, currency } = req.body;
  console.log('createOrder')
  const { id } = req;
  if (!id || !month) throw new ApiError(400, "some fields are missing");
  const receipt = `receipt_${Date.now()}`;
  const tempSubscription = await prisma.subscription.create({
    data: {
      userId: Number(id),
      amount: Number(month) * Number(price),
      status: SubscriptionStatus.CREATED,
      currency,
    },
  });
  console.log('ankit')
  const order = await instance.orders.create({
    amount: Math.round(price * 100),
    currency: "INR",
    receipt,
    notes: {
      subscriptionId: tempSubscription.id,
      userId: id,
    },
  });
  console.log('temp');
  const updatedSubscription = await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: {
        id: tempSubscription.id,
      },
      data: {
        razorpayOrderId: order.id,
        status: SubscriptionStatus.PENDING,
      },
    });
    return updated;
  });
  console.log('upadted subscription', updatedSubscription);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        subscriptionId: updatedSubscription.id,
      },
      "Order created Successfully"
    )
  );
});
