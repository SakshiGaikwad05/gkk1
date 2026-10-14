import { Router } from 'express';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import { uploadProductImages } from '../utils/upload.js';
import {
  adminLogin,
  adminGetMe,
  adminGetAllOrders,
  adminUpdateOrderStatus,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetAllInvoices,
} from '../controllers/admin.controller.js';

import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../controllers/category.controller.js';

import {
  adminGetBrands,
  adminCreateBrand,
  adminUpdateBrand,
  adminDeleteBrand,
} from '../controllers/brand.controller.js';

import {
  adminGetBanners,
  adminCreateBanner,
  adminUpdateBanner,
  adminDeleteBanner,
} from '../controllers/banner.controller.js';

const router = Router();

// Auth
router.post('/login', adminLogin);
router.get('/me', authenticateAdmin, adminGetMe);

// Orders
router.get('/orders', authenticateAdmin, adminGetAllOrders);
router.put('/orders/:id/status', authenticateAdmin, adminUpdateOrderStatus);

// Products
router.get('/products', authenticateAdmin, adminGetProducts);
router.post('/products', authenticateAdmin, uploadProductImages.array('images', 10), adminCreateProduct);
router.put('/products/:id', authenticateAdmin, uploadProductImages.array('images', 10), adminUpdateProduct);
router.delete('/products/:id', authenticateAdmin, adminDeleteProduct);

// Categories
router.get('/categories', authenticateAdmin, adminGetCategories);
router.post('/categories', authenticateAdmin, uploadProductImages.single('image'), adminCreateCategory);
router.put('/categories/:id', authenticateAdmin, uploadProductImages.single('image'), adminUpdateCategory);
router.delete('/categories/:id', authenticateAdmin, adminDeleteCategory);

// Brands
router.get('/brands', authenticateAdmin, adminGetBrands);
router.post('/brands', authenticateAdmin, adminCreateBrand);
router.put('/brands/:id', authenticateAdmin, adminUpdateBrand);
router.delete('/brands/:id', authenticateAdmin, adminDeleteBrand);

// Banners
router.get('/banners/admin', authenticateAdmin, adminGetBanners);
router.post('/banners/admin', authenticateAdmin, uploadProductImages.single('image'), adminCreateBanner);
router.put('/banners/admin/:id', authenticateAdmin, uploadProductImages.single('image'), adminUpdateBanner);
router.delete('/banners/admin/:id', authenticateAdmin, adminDeleteBanner);

// Invoices
router.get('/invoices', authenticateAdmin, adminGetAllInvoices);

export default router;
