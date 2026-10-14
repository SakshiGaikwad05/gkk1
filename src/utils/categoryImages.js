// Picks a picture for a category tile.
// Order: image uploaded in Admin → Categories, then a bundled photo/icon matched by
// the category's slug or name, then null (caller shows its own placeholder).
import seeds from '../assets/categories/photos/seeds.jpg';
import fertilizer from '../assets/categories/photos/fertilizer.jpg';
import pesticides from '../assets/categories/photos/pesticides.jpg';
import cropProtection from '../assets/categories/photos/crop-protection.jpg';
import tools from '../assets/categories/photos/tools.jpg';
import organic from '../assets/categories/photos/organic.jpg';
import irrigation from '../assets/categories/photos/irrigation.jpg';
import npk from '../assets/categories/npk.svg';
import urea from '../assets/categories/urea.svg';
import dap from '../assets/categories/dap.svg';
import micronutrients from '../assets/categories/micronutrients.svg';
import vegetableSeeds from '../assets/categories/vegetable-seeds.svg';
import fruitSeeds from '../assets/categories/fruit-seeds.svg';
import flowerSeeds from '../assets/categories/flower-seeds.svg';
import herbs from '../assets/categories/herbs.svg';
import fungicides from '../assets/categories/fungicides.svg';
import insecticides from '../assets/categories/insecticides.svg';
import rodenticides from '../assets/categories/rodenticides.svg';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gkk1.onrender.com';

// First matching keyword wins, so specific words come before general ones
// ("vegetable seed" before "seed", "bio-fertilizer" lands on organic).
const KEYWORDS = [
  // "herbicide" must come before "herb", or weed killers get the herb-seeds icon
  ['herbicide', pesticides],
  ['vegetable', vegetableSeeds], ['fruit', fruitSeeds], ['flower', flowerSeeds], ['herb', herbs],
  ['npk', npk], ['urea', urea], ['dap', dap], ['micronutrient', micronutrients],
  ['fungicide', fungicides], ['insecticide', insecticides], ['rodenticide', rodenticides],
  ['organic', organic], ['bio', organic], ['neem', organic], ['compost', organic],
  ['seed', seeds],
  ['fertili', fertilizer], ['nutrition', fertilizer],
  ['pesticide', pesticides], ['protection', cropProtection],
  ['irrigation', irrigation], ['drip', irrigation], ['sprinkler', irrigation], ['pump', irrigation], ['pipe', irrigation],
  ['tool', tools], ['equipment', tools], ['sprayer', tools], ['harvest', tools],
];

export const getCategoryImage = (cat) => {
  if (cat?.image) {
    return /^https?:\/\//.test(cat.image) ? cat.image : `${API_BASE}${cat.image}`;
  }
  const text = `${cat?.slug || ''} ${cat?.name || ''}`.toLowerCase();
  const hit = KEYWORDS.find(([kw]) => text.includes(kw));
  return hit ? hit[1] : null;
};
