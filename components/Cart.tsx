import React from 'react';
import { useCartStore } from '../store/cartStore';
import { PricingSystem } from '../utils/core';
import { Button } from './Common';

export const CartButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const count = useCartStore((state) => state.getItemCount());
  
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-orange-600 hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-orange-200 active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
          {count}
        </span>
      </div>
    </button>
  );
};

export const CartSidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onCheckout: () => void;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onCheckout, isSubmitting }) => {
  const { items, updateQuantity, removeItem } = useCartStore();
  const summary = PricingSystem.getOrderSummary(items);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
          
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center safe-top">
            <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
            <button 
              onClick={onClose} 
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-400">Your cart is empty</p>
                <button onClick={onClose} className="mt-4 text-primary font-medium hover:underline">Browse Menu</button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.menuItem.id} className="flex gap-4 group">
                  <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                    {item.menuItem.image_url && (
                      <img src={item.menuItem.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-gray-900 leading-tight">{item.menuItem.name}</h3>
                      <p className="font-medium text-gray-900 whitespace-nowrap">{PricingSystem.formatPrice(item.menuItem.price * item.quantity)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button 
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.menuItem.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Safe Area Padding */}
          {items.length > 0 && (
            <div 
              className="bg-white border-t border-gray-200 p-6 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            >
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{PricingSystem.formatPrice(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (20%)</span>
                  <span>{PricingSystem.formatPrice(summary.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{PricingSystem.formatPrice(summary.total)}</span>
                </div>
              </div>
              
              <Button 
                onClick={onCheckout}
                disabled={isSubmitting}
                className="w-full py-3 text-lg shadow-lg active:scale-[0.98] transform transition-transform"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};