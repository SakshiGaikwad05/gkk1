import Brand from '../models/brand.model.js';
import Product from '../models/product.model.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';

export const getActiveBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find({ active: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: { brands } });
});

export const adminGetBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 }).lean();
  const withCount = await Promise.all(
    brands.map(async (brand) => {
      const count = await Product.countDocuments({ brand: brand.name });
      return { ...brand, productCount: count };
    })
  );
  res.json({ success: true, data: { brands: withCount } });
});

export const adminCreateBrand = asyncHandler(async (req, res) => {
  const { name, description, active } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    throw new AppError('Brand name is required.', 400);
  }
  const existing = await Brand.findOne({ name: name.trim() });
  if (existing) throw new AppError('Brand with this name already exists.', 409);

  const brand = await Brand.create({
    name: name.trim(),
    description: description ? String(description).trim() : '',
    active: active === true || active === 'true',
  });
  res.status(201).json({ success: true, message: 'Brand created.', data: { brand } });
});

export const adminUpdateBrand = asyncHandler(async (req, res) => {
  const { name, description, active } = req.body;
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new AppError('Brand not found.', 404);

  const oldName = brand.name;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1) throw new AppError('Name is required.', 400);
    const dup = await Brand.findOne({ name: name.trim(), _id: { $ne: brand._id } });
    if (dup) throw new AppError('Brand with this name already exists.', 409);
    brand.name = name.trim();
    brand.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (description !== undefined) brand.description = String(description).trim();
  if (active !== undefined) brand.active = active === true || active === 'true';

  await brand.save();
  // products store the brand by name; keep them attached after a rename
  if (brand.name !== oldName) {
    await Product.updateMany({ brand: oldName }, { $set: { brand: brand.name } });
  }
  res.json({ success: true, message: 'Brand updated.', data: { brand } });
});

export const adminDeleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw new AppError('Brand not found.', 404);
  res.json({ success: true, message: 'Brand deleted.' });
});
