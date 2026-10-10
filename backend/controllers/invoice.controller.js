import mongoose from 'mongoose';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';
import { invoiceService } from '../services/invoice.service.js';
import Order from '../models/order.model.js';
import Invoice from '../models/invoice.model.js';

// Invoices contain customer name/phone/address, so a customer may only touch
// invoices for their own orders. Admins can access everything.
const isAdmin = (user) => user?.role === 'admin';
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

const assertOrderAccess = async (orderId, user) => {
  if (!mongoose.isValidObjectId(orderId)) throw new AppError('Order not found.', 404);
  const order = await Order.findById(orderId).select('userId').lean();
  if (!order) throw new AppError('Order not found.', 404);
  if (!isAdmin(user) && !sameId(order.userId, user._id)) {
    throw new AppError('You do not have permission to access this order.', 403);
  }
};

const assertInvoiceAccess = async (invoiceId, user) => {
  if (!mongoose.isValidObjectId(invoiceId)) throw new AppError('Invoice not found.', 404);
  const invoice = await Invoice.findById(invoiceId).select('userId').lean();
  if (!invoice) throw new AppError('Invoice not found.', 404);
  if (!isAdmin(user) && !sameId(invoice.userId, user._id)) {
    throw new AppError('You do not have permission to access this invoice.', 403);
  }
};

export const createInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new AppError('orderId is required.', 400);
  }
  await assertOrderAccess(orderId, req.user);

  const result = await invoiceService.generateAndSendInvoice(orderId);

  res.status(201).json({
    success: true,
    message: result.success
      ? 'Invoice generated and sent successfully.'
      : 'Invoice generated but WhatsApp sending failed.',
    data: {
      invoice: result.invoice,
      pdfUrl: result.pdfUrl,
      whatsappSent: result.whatsappSent,
      whatsappMessageId: result.whatsappMessageId,
    },
  });
});

export const generateInvoicePDF = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw new AppError('orderId is required.', 400);
  }
  await assertOrderAccess(orderId, req.user);

  const result = await invoiceService.generateInvoice(orderId);

  if (!result.success) {
    throw new AppError(result.error || 'Failed to generate invoice.', 400);
  }

  res.status(201).json({
    success: true,
    message: 'Invoice PDF generated successfully.',
    data: {
      invoice: result.invoice,
      pdfUrl: result.pdfUrl,
    },
  });
});

export const sendInvoiceWhatsApp = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  await assertInvoiceAccess(invoiceId, req.user);

  const result = await invoiceService.sendInvoiceWhatsApp(invoiceId);

  res.json({
    success: result.success,
    message: result.success
      ? 'Invoice sent via WhatsApp.'
      : result.error || 'Failed to send invoice.',
    data: result.whatsappResult || {},
  });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  await assertInvoiceAccess(invoiceId, req.user);

  const invoice = await invoiceService.getInvoiceById(invoiceId);

  if (!invoice) {
    throw new AppError('Invoice not found.', 404);
  }

  res.json({
    success: true,
    message: 'Invoice retrieved successfully.',
    data: { invoice },
  });
});

export const getInvoiceByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  await assertOrderAccess(orderId, req.user);

  const invoice = await invoiceService.getInvoiceByOrderId(orderId);

  if (!invoice) {
    throw new AppError('Invoice not found for this order.', 404);
  }

  res.json({
    success: true,
    message: 'Invoice retrieved successfully.',
    data: { invoice },
  });
});

export const getUserInvoices = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getUserInvoices(req.user._id);

  res.json({
    success: true,
    message: 'Invoices retrieved successfully.',
    data: { invoices },
  });
});

export const getAllInvoices = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;

  const result = await invoiceService.getAllInvoices({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
  });

  res.json({
    success: true,
    message: 'Invoices retrieved successfully.',
    data: {
      invoices: result.invoices,
      pagination: result.pagination,
    },
  });
});

export const regenerateInvoicePDF = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const result = await invoiceService.regenerateInvoicePDF(invoiceId);

  res.json({
    success: true,
    message: 'Invoice PDF regenerated successfully.',
    data: {
      pdfPath: result.pdfPath,
      pdfUrl: result.pdfUrl,
    },
  });
});