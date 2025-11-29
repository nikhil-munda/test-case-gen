import express from 'express'
import { handleRazorpayWebhook } from '../webhook/razorpay.webhook.js';
import { createOrder } from '../controller/subscriptionController.js';
import { authMiddleware } from '../middleware.ts/auth.middleware.js';
const router = express.Router();
router.post('/verifyPayment', handleRazorpayWebhook);
router.post('/createOrder',authMiddleware , createOrder)

export default router;