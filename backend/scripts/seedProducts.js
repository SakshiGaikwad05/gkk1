import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/product.model.js';

const products = [
  // Seeds & Subcategories
  { name: "Premium Wheat Seeds", price: 800, category: "seeds", image: "https://5.imimg.com/data5/SELLER/Default/2023/1/NX/YV/XV/15720077/wheat-seeds-500x500.jpg", description: "High-quality wheat seeds.", featured: true, status: 'published' },
  { name: "Hybrid Tomato Seeds", price: 150, category: "vegetable-seeds", image: "https://placehold.co/150x150?text=Tomato+Seeds", description: "Yield-heavy tomato seeds.", featured: true, status: 'published' },
  { name: "Green Chilli Seeds", price: 80, category: "vegetable-seeds", image: "https://placehold.co/150x150?text=Chilli+Seeds", description: "Spicy chilli seeds.", featured: false, status: 'published' },
  { name: "Papaya Hybrid Seeds", price: 450, category: "fruit-seeds", image: "https://placehold.co/150x150?text=Papaya+Seeds", description: "Sweet papaya seeds.", featured: false, status: 'published' },
  { name: "Marigold Orange Seeds", price: 120, category: "flower-seeds", image: "https://placehold.co/150x150?text=Marigold+Seeds", description: "Orange marigold seeds.", featured: false, status: 'published' },
  { name: "Italian Basil Seeds", price: 90, category: "herbs", image: "https://placehold.co/150x150?text=Basil+Seeds", description: "Aromatic basil seeds.", featured: false, status: 'published' },

  // Crop Nutrition (Fertilizers) & Subcategories
  { name: "NPK 19:19:19 Fertilizer", price: 450, category: "crop-nutrition", image: "https://5.imimg.com/data5/SELLER/Default/2022/11/QC/ZY/IP/13444498/19-19-19-npk-fertilizer-500x500.jpg", description: "Water soluble fertilizer.", featured: false, status: 'published' },
  { name: "NPK Special Blend", price: 500, category: "npk", image: "https://placehold.co/150x150?text=NPK", description: "Special NPK blend.", featured: false, status: 'published' },
  { name: "Premium Urea", price: 300, category: "urea", image: "https://placehold.co/150x150?text=Urea", description: "High nitrogen urea.", featured: true, status: 'published' },
  { name: "DAP Fertilizer", price: 600, category: "dap", image: "https://placehold.co/150x150?text=DAP", description: "Diammonium Phosphate.", featured: false, status: 'published' },
  { name: "Micronutrient Mix", price: 380, category: "micronutrients", image: "https://placehold.co/150x150?text=Micronutrients", description: "Essential minerals.", featured: false, status: 'published' },

  // Crop Protection & Subcategories
  { name: "Bayer Regent Insecticide", price: 950, category: "crop-protection", image: "https://5.imimg.com/data5/SELLER/Default/2021/3/PJ/JI/PV/78408449/bayer-regent-sc-insecticide-1000x1000.jpg", description: "Broad-spectrum insecticide.", featured: true, status: 'published' },
  { name: "Super Insecticide", price: 700, category: "insecticide", image: "https://placehold.co/150x150?text=Insecticide", description: "Effective pest control.", featured: false, status: 'published' },
  { name: "Amistar Top Fungicide", price: 2100, category: "fungicide", image: "https://placehold.co/150x150?text=Fungicide", description: "Systemic fungicide.", featured: false, status: 'published' },
  { name: "Strong Herbicide", price: 850, category: "herbicide", image: "https://placehold.co/150x150?text=Herbicide", description: "Weed killer.", featured: false, status: 'published' },
  { name: "Rat Control Rodenticide", price: 150, category: "rodenticide", image: "https://placehold.co/150x150?text=Rodenticide", description: "Effective rodent control.", featured: false, status: 'published' },

  // Equipment & Subcategories
  { name: "Battery Sprayer (16L)", price: 3500, category: "equipment", image: "https://5.imimg.com/data5/SELLER/Default/2022/8/ZE/UX/YV/13768228/battery-sprayer-pump-500x500.jpg", description: "Rechargeable sprayer.", featured: false, status: 'published' },
  { name: "Manual Sprayer", price: 1200, category: "sprayers", image: "https://placehold.co/150x150?text=Sprayer", description: "Hand-pump sprayer.", featured: false, status: 'published' },
  { name: "Sickle Tool", price: 200, category: "harvesting", image: "https://placehold.co/150x150?text=Sickle", description: "Sharp harvesting tool.", featured: false, status: 'published' },
  { name: "Pruning Shears", price: 450, category: "other-tools", image: "https://placehold.co/150x150?text=Shears", description: "Garden pruning tool.", featured: false, status: 'published' },

  // Organic & Subcategories
  { name: "Organic Neem Oil", price: 350, category: "organic", image: "https://5.imimg.com/data5/SELLER/Default/2023/9/343468925/WS/YI/XV/195982846/neem-oil-1000x1000.jpg", description: "Natural pest repellent.", featured: false, status: 'published' },
  { name: "Bio-Fertilizer", price: 400, category: "bio-fertilizer", image: "https://placehold.co/150x150?text=Bio-Fert", description: "Natural soil booster.", featured: true, status: 'published' },
  { name: "Neem Cake", price: 300, category: "neem-products", image: "https://placehold.co/150x150?text=Neem+Cake", description: "Organic neem soil additive.", featured: false, status: 'published' },
  { name: "Vermicompost Gold", price: 250, category: "vermicompost", image: "https://placehold.co/150x150?text=Vermicompost", description: "Earthworm cast manure.", featured: false, status: 'published' },
  { name: "Complete Organic Pack", price: 1200, category: "organic-pack", image: "https://placehold.co/150x150?text=Organic+Pack", description: "Set of organic inputs.", featured: false, status: 'published' },

  // Irrigation & Subcategories
  { name: "Drip Irrigation Kit", price: 5000, category: "irrigation", image: "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg", description: "Complete drip system.", featured: true, status: 'published' },
  { name: "Drip Pipes (100m)", price: 1500, category: "drip", image: "https://placehold.co/150x150?text=Drip+Pipes", description: "Flexible drip tubing.", featured: false, status: 'published' },
  { name: "Rain Sprinkler", price: 800, category: "sprinkler", image: "https://placehold.co/150x150?text=Sprinkler", description: "360-degree sprinkler.", featured: false, status: 'published' },
  { name: "Submersible Pump", price: 8500, category: "pumps", image: "https://placehold.co/150x150?text=Pump", description: "High-power water pump.", featured: false, status: 'published' },
  { name: "PVC Main Pipe", price: 2000, category: "pipes", image: "https://placehold.co/150x150?text=PVC+Pipe", description: "Strong PVC pipe.", featured: false, status: 'published' }
];

const seedDB = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing products...');
    await Product.deleteMany();
    console.log('🌱  Seeding products...');
    await Product.insertMany(products);
    console.log('✅  Database seeded successfully with ' + products.length + ' products!');
    process.exit();
  } catch (err) {
    console.error('❌  Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
