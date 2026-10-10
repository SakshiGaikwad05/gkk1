import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import {
  createRazorpayOrderService,
  verifyPaymentService,
} from '../services/payment.service.js';

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) throw new AppError('orderId is required.', 400);

  const payload = await createRazorpayOrderService({
    orderId,
    user: req.user,
  });

  res.json({
    success: true,
    message: 'Razorpay order created successfully.',
    data: payload,
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError(
      'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      400
    );
  }

  const result = await verifyPaymentService({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user: req.user,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature.',
      data: { order: result.order },
    });
  }

  res.json({
    success: true,
    message: 'Payment verified successfully.',
    data: { order: result.order },
  });
});
