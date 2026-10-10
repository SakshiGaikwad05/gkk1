import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseStrArr(val) {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [String(p)]; } catch { return [String(val)]; }
}

function parseBool(val) {
  if (val === undefined || val === null) return undefined;
  return val === true || val === 'true' || val === 1 || val === '1';
}

export const getProducts = asyncHandler(async (req, res) => {
  const {
    category, subcategory, brand, search,
    featured, bestSeller, newArrival, limitedOffer, showOnBanner,
    page, limit,
  } = req.query;

  const filter = {};
  if (category && category !== 'all') {
    // Admin-created products store the category *name* ("Vegetable Seeds") while
    // storefront links use the *slug* ("vegetable-seeds"), so match either.
    const cat = await Category.findOne({ $or: [{ slug: category }, { name: category }] }).lean();
    const candidates = [category, cat?.name, cat?.slug].filter(Boolean);
    // "-" in a slug matches "-" or a space, so "vegetable-seeds" also hits "Vegetable Seeds"
    const patterns = candidates.map((c) => new RegExp(`^${escapeRegex(c).replace(/-/g, '[-\\s]')}$`, 'i'));
    // also match subcategory, so links like /category/vegetable-seeds work for
    // products filed as category "Seeds" / subcategory "Vegetable Seeds"
    filter.$and = [{ $or: [{ category: { $in: patterns } }, { subcategory: { $in: patterns } }] }];
  }
  if (subcategory) filter.subcategory = subcategory;
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  // Public endpoint: never expose draft/hidden products to shoppers
  filter.status = 'published';
  if (featured === 'true') filter.featured = true;
  if (bestSeller === 'true') filter.bestSeller = true;
  if (newArrival === 'true') filter.newArrival = true;
  if (limitedOffer === 'true') filter.limitedOffer = true;
  if (showOnBanner === 'true') filter.showOnBanner = true;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },

    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const hasPagination = !isNaN(pageNum) && !isNaN(limitNum) && pageNum > 0 && limitNum > 0;

  let products;
  let pagination = undefined;

  if (hasPagination) {
    const skip = (pageNum - 1) * limitNum;
    const total = await Product.countDocuments(filter);
    products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    };
  } else {
    products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  }

  res.json({
    success: true,
    message: 'Products retrieved successfully.',
    data: { products, ...(pagination && { pagination }) },
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: 'published' }).lean();
  if (!product) throw new AppError('Product not found.', 404);
  res.json({ success: true, data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  const fields = req.body;

  if (!fields.name || typeof fields.name !== 'string' || fields.name.trim().length < 1) {
    throw new AppError('Valid name is required.', 400);
  }
  if (fields.price == null || isNaN(Number(fields.price)) || Number(fields.price) < 0) {
    throw new AppError('Valid price (non-negative number) is required.', 400);
  }
  if (!fields.category || typeof fields.category !== 'string' || fields.category.trim().length < 1) {
    throw new AppError('Valid category is required.', 400);
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((f) => f.path);
  }

  const product = await Product.create({
    name: String(fields.name).trim(),
    category: String(fields.category).trim(),
    subcategory: fields.subcategory ? String(fields.subcategory).trim() : '',
    brand: fields.brand ? String(fields.brand).trim() : '',
    expiryDate: fields.expiryDate ? new Date(fields.expiryDate) : null,
    shortDescription: fields.shortDescription ? String(fields.shortDescription).trim() : '',
    description: fields.description ? String(fields.description).trim() : '',
    mrp: fields.mrp != null ? Number(fields.mrp) : 0,
    price: Number(fields.price),
    discount: fields.discount != null ? Number(fields.discount) : 0,
    gst: fields.gst != null ? Number(fields.gst) : 0,
    stock: fields.stock != null ? Math.max(Number(fields.stock), 0) : 0,
    lowStockAlert: fields.lowStockAlert != null ? Number(fields.lowStockAlert) : 0,
    unit: fields.unit ? String(fields.unit).trim() : 'piece',
    weight: fields.weight ? String(fields.weight).trim() : '',
    image: images.length > 0 ? images[0] : '',
    images,
    suitableCrops: parseStrArr(fields.suitableCrops) || [],
    targetPests: parseStrArr(fields.targetPests) || [],
    dosage: fields.dosage ? String(fields.dosage).trim() : '',
    composition: fields.composition ? String(fields.composition).trim() : '',
    benefits: fields.benefits ? String(fields.benefits).trim() : '',
    safetyInstructions: fields.safetyInstructions ? String(fields.safetyInstructions).trim() : '',
    featured: parseBool(fields.featured) || false,
    bestSeller: parseBool(fields.bestSeller) || false,
    newArrival: parseBool(fields.newArrival) || false,
    limitedOffer: parseBool(fields.limitedOffer) || false,
    showOnBanner: parseBool(fields.showOnBanner) || false,
    bannerTitle: fields.bannerTitle ? String(fields.bannerTitle).trim() : '',
    bannerSubtitle: fields.bannerSubtitle ? String(fields.bannerSubtitle).trim() : '',
    bannerButtonText: fields.bannerButtonText ? String(fields.bannerButtonText).trim() : 'Shop Now',
    status: ['draft', 'published', 'hidden'].includes(fields.status) ? fields.status : 'draft',
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const fields = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);

  if (fields.name !== undefined) {
    if (typeof fields.name !== 'string' || fields.name.trim().length < 1) {
      throw new AppError('Valid name is required.', 400);
    }
    product.name = fields.name.trim();
  }
  if (fields.price !== undefined) {
    if (isNaN(Number(fields.price)) || Number(fields.price) < 0) {
      throw new AppError('Valid price (non-negative number) is required.', 400);
    }
    product.price = Number(fields.price);
  }
  if (fields.category !== undefined) {
    if (typeof fields.category !== 'string' || fields.category.trim().length < 1) {
      throw new AppError('Valid category is required.', 400);
    }
    product.category = fields.category.trim();
  }

  if (fields.subcategory !== undefined) product.subcategory = String(fields.subcategory).trim();
  if (fields.brand !== undefined) product.brand = String(fields.brand).trim();
  if (fields.expiryDate !== undefined) product.expiryDate = fields.expiryDate ? new Date(fields.expiryDate) : null;
  if (fields.shortDescription !== undefined) product.shortDescription = String(fields.shortDescription).trim();
  if (fields.description !== undefined) product.description = String(fields.description).trim();
  if (fields.mrp !== undefined) product.mrp = Number(fields.mrp);
  if (fields.discount !== undefined) product.discount = Number(fields.discount);
  if (fields.gst !== undefined) product.gst = Number(fields.gst);
  if (fields.stock !== undefined) product.stock = Math.max(Number(fields.stock), 0);
  if (fields.lowStockAlert !== undefined) product.lowStockAlert = Number(fields.lowStockAlert);
  if (fields.unit !== undefined) product.unit = String(fields.unit).trim();
  if (fields.weight !== undefined) product.weight = String(fields.weight).trim();
  if (fields.suitableCrops !== undefined) product.suitableCrops = parseStrArr(fields.suitableCrops) || [];
  if (fields.targetPests !== undefined) product.targetPests = parseStrArr(fields.targetPests) || [];
  if (fields.dosage !== undefined) product.dosage = String(fields.dosage).trim();
  if (fields.composition !== undefined) product.composition = String(fields.composition).trim();
  if (fields.benefits !== undefined) product.benefits = String(fields.benefits).trim();
  if (fields.safetyInstructions !== undefined) product.safetyInstructions = String(fields.safetyInstructions).trim();
  if (fields.featured !== undefined) product.featured = parseBool(fields.featured);
  if (fields.bestSeller !== undefined) product.bestSeller = parseBool(fields.bestSeller);
  if (fields.newArrival !== undefined) product.newArrival = parseBool(fields.newArrival);
  if (fields.limitedOffer !== undefined) product.limitedOffer = parseBool(fields.limitedOffer);
  if (fields.showOnBanner !== undefined) product.showOnBanner = parseBool(fields.showOnBanner);
  if (fields.bannerTitle !== undefined) product.bannerTitle = String(fields.bannerTitle).trim();
  if (fields.bannerSubtitle !== undefined) product.bannerSubtitle = String(fields.bannerSubtitle).trim();
  if (fields.bannerButtonText !== undefined) product.bannerButtonText = String(fields.bannerButtonText).trim() || 'Shop Now';
  if (fields.status !== undefined) {
    if (['draft', 'published', 'hidden'].includes(fields.status)) {
      product.status = fields.status;
    }
  }

  let currentImages = [...(product.images || [])];

  if (fields.removedImages) {
    const toRemove = Array.isArray(fields.removedImages) ? fields.removedImages : [fields.removedImages];
    currentImages = currentImages.filter((img) => !toRemove.includes(img));
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => f.path);
    currentImages = [...currentImages, ...newImages];
  }

  product.images = currentImages;
  product.image = currentImages.length > 0 ? currentImages[0] : '';

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully.',
    data: { product },
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError('Product not found.', 404);

  res.json({
    success: true,
    message: 'Product deleted successfully.',
    data: { product },
  });
});
