import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, CloudSun, BookOpen, Lightbulb, Award } from 'lucide-react';

const menuItems = [
  { id: 'all', label: 'All Categories' },
  { id: 'seeds', label: 'Seeds', href: '/category/seeds' },
  { id: 'cropProtection', label: 'Crop Protection', href: '/category/crop-protection' },
  { id: 'cropNutrition', label: 'Crop Nutrition', href: '/category/fertilizers' },
  { id: 'equipment', label: 'Farming Equipment', href: '/category/tools-equipment' },
  { id: 'organic', label: 'Organic', href: '/category/organic' },
  { id: 'gallery', label: 'Gallery', href: '/gallery' },
  { id: 'resources', label: 'Resources' },
];

const dropdownContent = {
  all: [
    { label: 'Seeds', href: '/category/seeds' },
    { label: 'Crop Protection', href: '/category/crop-protection' },
    { label: 'Crop Nutrition', href: '/category/fertilizers' },
    { label: 'Farming Equipment', href: '/category/tools-equipment' },
    { label: 'Organic Products', href: '/category/organic' },
    { label: 'Irrigation', href: '/category/irrigation' },
  ],
  seeds: [
    { label: 'Vegetable Seeds', href: '/category/vegetable-seeds' },
    { label: 'Fruit Seeds', href: '/category/fruit-seeds' },
    { label: 'Flower Seeds', href: '/category/flower-seeds' },
    { label: 'Herbs', href: '/category/herbs' },
  ],
  cropProtection: [
    { label: 'Pesticides', href: '/category/crop-protection' },
    { label: 'Insecticides', href: '/category/insecticide' },
    { label: 'Fungicides', href: '/category/fungicide' },
    { label: 'Herbicides', href: '/category/herbicide' },
  ],
  cropNutrition: [
    { label: 'Fertilizers', href: '/category/fertilizers' },
    { label: 'NPK', href: '/category/npk' },
    { label: 'Urea', href: '/category/urea' },
    { label: 'DAP', href: '/category/dap' },
    { label: 'Micronutrients', href: '/category/micronutrients' },
  ],
  equipment: [
    { label: 'Sprayers', href: '/category/sprayers' },
    { label: 'Farming Equipment', href: '/category/tools-equipment' },
    { label: 'Irrigation', href: '/category/irrigation' },
    { label: 'Harvesting Tools', href: '/category/harvesting' },
  ],
  organic: [
    { label: 'Organic Seeds', href: '/category/organic' },
    { label: 'Organic Fertilizers', href: '/category/organic' },
    { label: 'Organic Pesticides', href: '/category/organic' },
    { label: 'Organic Manure', href: '/category/organic' },
  ],
  resources: [
    { label: 'Weather Updates', href: '/weather', icon: CloudSun },
    { label: 'Crop Advisory Blog', href: '/blog', icon: BookOpen },
    { label: 'Seasonal Crop Tips', href: '/tips', icon: Lightbulb },
    { label: 'Government Schemes', href: '/schemes', icon: Award },
  ],
  services: [
    { label: 'Soil Testing', href: '/services/soil-testing' },
    { label: 'Crop Consulting', href: '/services/consulting' },
    { label: 'Farm Setup', href: '/services/farm-setup' },
    { label: 'Delivery Services', href: '/services/delivery' },
  ],
};

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const navbarRef = useRef(null);

  const handleMouseEnter = (menuId) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setActiveMenu(menuId);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false);
      setActiveMenu(null);
    }, 200);
    setCloseTimeout(timeout);
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false);
      setActiveMenu(null);
    }, 200);
    setCloseTimeout(timeout);
  };

  const handleClick = (menuId) => {
    if (activeMenu === menuId && isDropdownOpen) {
      setIsDropdownOpen(false);
      setActiveMenu(null);
    } else {
      setActiveMenu(menuId);
      setIsDropdownOpen(true);
    }
  };

  return (
    <nav 
      className="border-t border-gray-100 bg-white hidden lg:block shadow-sm"
      ref={navbarRef}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <ul className="flex items-center justify-center gap-4 md:gap-8 py-3 text-[13px] font-bold text-gray-700 whitespace-nowrap uppercase tracking-wide">
          {menuItems.map((item) => (
            <li 
              key={item.id}
              className="relative px-3 py-2"
              onMouseEnter={() => handleMouseEnter(item.id)}
              onClick={() => handleClick(item.id)}
            >
              {item.href ? (
                <Link 
                  to={item.href}
                  className="flex items-center gap-1 cursor-pointer transition-colors duration-300 hover:text-green-700"
                >
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className={`flex items-center gap-1 cursor-pointer transition-colors duration-300 ${
                  activeMenu === item.id ? 'text-green-700 font-semibold' : 'hover:text-green-700'
                }`}>
                  <span>{item.label}</span>
                  {dropdownContent[item.id] && (
                    <ChevronDown size={12} className={`transition-transform duration-300 ${
                      activeMenu === item.id && isDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>
              )}
              {dropdownContent[item.id] && isDropdownOpen && activeMenu === item.id && (
                <div 
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[220px] bg-white border border-gray-200 shadow-lg rounded-lg py-2 opacity-100 visible transition-all duration-300 z-50"
                  onMouseEnter={handleDropdownMouseEnter}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  {dropdownContent[item.id].map((subItem, index) => {
                    const IconComponent = subItem.icon;
                    return (
                      <Link
                        key={index}
                        to={subItem.href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                      >
                        {IconComponent && <IconComponent size={16} className="text-green-600" />}
                        {subItem.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;