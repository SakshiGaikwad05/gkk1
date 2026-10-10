// Moves the demo products created by seedProducts.js (which use raw slugs like
// "drip", "npk", "vegetable-seeds" as their category) into a handful of real
// Category documents, keeping the old slug as a readable subcategory.
//
//   node scripts/groupSeedCategories.js           -> dry run, prints the plan
//   node scripts/groupSeedCategories.js --apply   -> writes to the database
//
// Products added through the admin panel use proper category names, so they
// never match the lowercase slugs below and are left untouched.
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';

const GROUPS = [
  { name: 'Seeds', order: 1, slugs: ['seeds', 'vegetable-seeds', 'fruit-seeds', 'flower-seeds', 'herbs'] },
  { name: 'Fertilizers', order: 2, slugs: ['crop-nutrition', 'npk', 'urea', 'dap', 'micronutrients'] },
  // "herbicide" is intentionally absent: it already matches the existing Herbicide category
  { name: 'Crop Protection', order: 3, slugs: ['crop-protection', 'insecticide', 'fungicide', 'rodenticide'] },
  { name: 'Tools & Equipment', order: 4, slugs: ['equipment', 'sprayers', 'harvesting', 'other-tools'] },
  { name: 'Organic', order: 5, slugs: ['organic', 'bio-fertilizer', 'neem-products', 'vermicompost', 'organic-pack'] },
  { name: 'Irrigation', order: 6, slugs: ['irrigation', 'drip', 'sprinkler', 'pumps', 'pipes'] },
];

const SUBCATEGORY_LABELS = {
  npk: 'NPK', dap: 'DAP', urea: 'Urea', 'crop-nutrition': 'General', 'crop-protection': 'General',
  seeds: 'General', equipment: 'General', organic: 'General', irrigation: 'General',
};

const label = (slug) =>
  SUBCATEGORY_LABELS[slug] ||
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const apply = process.argv.includes('--apply');

(async () => {
  const ok = await connectDB();
  if (!ok) process.exit(1);

  console.log(apply ? '\n=== APPLYING CHANGES ===\n' : '\n=== DRY RUN (pass --apply to write) ===\n');

  let moved = 0;
  for (const group of GROUPS) {
    const existing = await Category.findOne({ name: group.name });
    if (existing) {
      console.log(`Category "${group.name}" already exists`);
    } else {
      console.log(`Create category "${group.name}"`);
      if (apply) await Category.create({ name: group.name, order: group.order, active: true });
    }

    // exact, case-sensitive slug match so admin-named categories are never touched
    const products = await Product.find({ category: { $in: group.slugs } }).lean();
    for (const p of products) {
      const sub = p.subcategory || label(p.category);
      console.log(`  ${p.name.padEnd(28)} ${p.category.padEnd(16)} -> ${group.name} / ${sub}`);
      if (apply) {
        await Product.updateOne({ _id: p._id }, { $set: { category: group.name, subcategory: sub } });
      }
      moved++;
    }
  }

  console.log(`\n${moved} product(s) ${apply ? 'moved' : 'would be moved'}.`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
