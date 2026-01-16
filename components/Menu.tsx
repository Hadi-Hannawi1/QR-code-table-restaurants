import React from 'react';
import { MenuCategory, MenuItem } from '../types';
import { useCartStore } from '../store/cartStore';
import { PricingSystem } from '../utils/core';
import { Button } from './Common';

export const MenuCategoryTabs: React.FC<{
  categories: MenuCategory[];
  activeCategory: string;
  onSelect: (id: string) => void;
}> = ({ categories, activeCategory, onSelect }) => (
  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
    <div className="flex space-x-2 px-4 py-3 overflow-x-auto no-scrollbar min-w-full">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === cat.id
              ? 'bg-primary text-white shadow-md transform scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
      {/* Spacer for right padding in scroll view */}
      <div className="w-2 flex-shrink-0" />
    </div>
  </div>
);

export const MenuItemCard: React.FC<{ item: MenuItem }> = ({ item }) => {
  const addItem = useCartStore((state) => state.addItem);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48 sm:h-56 bg-gray-200">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
            <span className="text-sm font-medium">No Image</span>
          </div>
        )}
        {item.dietary_tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {item.dietary_tags.map(tag => (
              <span key={tag} className="bg-white/95 backdrop-blur shadow-sm text-xs font-bold px-2 py-1 rounded text-green-700 capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
          <span className="font-bold text-primary whitespace-nowrap">{PricingSystem.formatPrice(item.price)}</span>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">{item.description}</p>
        
        <div className="mt-auto">
          {item.is_available ? (
            <Button 
              onClick={() => addItem(item)}
              variant="outline"
              className="w-full py-2 text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors active:bg-orange-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Order
            </Button>
          ) : (
            <div className="text-center text-sm text-red-500 font-medium py-2 bg-red-50 rounded-lg">
              Sold Out
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MenuGrid: React.FC<{ items: MenuItem[] }> = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
    {items.map((item) => (
      <MenuItemCard key={item.id} item={item} />
    ))}
  </div>
);