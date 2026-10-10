import crypto from 'crypto';
import Razorpay from 'razorpay';

import { ENV } from '../config/env.js';
import Order from '../models/order.model.js';
import { AppError } from '../utils/asyncHandler.js';
import { invoiceService } from './invoice.service.js';

const getRazorpayClient = () => {
  if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay is not configured on this server.', 500);
  }

  return new Razorpay({
    key_id: ENV.RAZORPAY_KEY_ID,
    key_secret: ENV.RAZORPAY_KEY_SECRET,
  });
};

export const createRazorpayOrderService = async ({ orderId, user }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.paymentMethod === 'COD') {
    throw new AppError('Cannot process Razorpay payment for COD orders.', 400);
  }

  const isOwner = String(order.userId) === String(user._id);
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw new AppError('You do not have permission to pay for this order.', 403);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order has already been paid.', 400);
  }
  if (order.orderStatus === 'cancelled') {
    throw new AppError('This order has been cancelled.', 400);
  }

  const amount = order.amountInPaise || Math.round(Number(order.totalAmount || 0) * 100);
  if (!amount || amount < 0) {
    throw new AppError('Invalid order amount.', 400);
  }

  const razorpay = getRazorpayClient();
  const razorpayOrder = await razorpay.orders.create({
    amount,
    currency: order.currency || 'INR',
    receipt: order.orderId,
    notes: { internalOrderId: String(order._id) },
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    keyId: ENV.RAZORPAY_KEY_ID,
  };
};

export const verifyPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  user,
}) => {
  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
  if (!order) throw new AppError('Order not found for this Razorpay order.', 404);

  if (user && String(order.userId) !== String(user._id) && user.role !== 'admin') {
    throw new AppError('You do not have permission to verify this payment.', 403);
  }

  // Already settled: don't let a second (possibly forged) call flip a paid order to failed
  if (order.paymentStatus === 'paid') {
    return { success: true, order };
  }

  const expectedSignature = crypto
    .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const signature = String(razorpay_signature);
  const isSignatureValid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

  // An invalid signature proves nothing about the real payment, so leave the
  // order untouched rather than recording attacker-supplied ids or marking it failed.
  if (!isSignatureValid) {
    return { success: false, order };
  }

  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = signature;
  order.paymentStatus = 'paid';
  order.paymentMethod = 'UPI';
  if (order.orderStatus === 'placed') {
    order.orderStatus = 'confirmed';
    order.statusHistory.push({ status: 'confirmed' });
  }

  await order.save();

  // ENV.AUTO_GENERATE_INVOICE is already a boolean (comparing to 'false' was always true)
  if (ENV.AUTO_GENERATE_INVOICE) {
    try {
      console.log(`[PAYMENT_SERVICE] Auto-generating invoice for order: ${order._id}`);
      const invoiceResult = await invoiceService.generateAndSendInvoice(order._id);
      console.log(`[PAYMENT_SERVICE] Invoice generated: ${invoiceResult.invoice?.invoiceNumber}, WhatsApp: ${invoiceResult.whatsappSent}`);
    } catch (invoiceError) {
      console.error(`[PAYMENT_SERVICE] Error generating invoice:`, invoiceError.message);
    }
  }

  return {
    success: isSignatureValid,
    order,
  };
};
