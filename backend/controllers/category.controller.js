import Category from '../models/category.model.js';
import Product from '../models/product.model.js';
import { AppError, asyncHandler } from '../utils/asyncHandler.js';

export const getActiveCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ active: true }).sort({ order: 1 }).lean();
  res.json({ success: true, data: { categories } });
});

export const adminGetCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  const withCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat.name });
      return { ...cat, productCount: count };
    })
  );
  res.json({ success: true, data: { categories: withCount } });
});

export const adminCreateCategory = asyncHandler(async (req, res) => {
  const { name, description, active, order } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    throw new AppError('Category name is required.', 400);
  }
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) throw new AppError('Category with this name already exists.', 409);

  const category = await Category.create({
    name: name.trim(),
    description: description ? String(description).trim() : '',
    active: active === true || active === 'true',
    order: order != null ? Number(order) : 0,
  });
  res.status(201).json({ success: true, message: 'Category created.', data: { category } });
});

export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const { name, description, active, order } = req.body;
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found.', 404);

  const oldName = category.name;
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 1) throw new AppError('Name is required.', 400);
    const dup = await Category.findOne({ name: name.trim(), _id: { $ne: category._id } });
    if (dup) throw new AppError('Category with this name already exists.', 409);
    category.name = name.trim();
    category.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (description !== undefined) category.description = String(description).trim();
  if (active !== undefined) category.active = active === true || active === 'true';
  if (order !== undefined) category.order = Number(order);

  await category.save();
  // products store the category by name; without this a rename orphans them
  if (category.name !== oldName) {
    await Product.updateMany({ category: oldName }, { $set: { category: category.name } });
  }
  res.json({ success: true, message: 'Category updated.', data: { category } });
});

export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found.', 404);
  res.json({ success: true, message: 'Category deleted.' });
});
