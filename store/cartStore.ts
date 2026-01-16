import { create } from 'zustand';
import { CartItem, MenuItem } from '../types';
import { eventBus, EVENT_TYPES } from '../utils/core';

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (menuItem, quantity = 1, specialInstructions = '') => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.menuItem.id === menuItem.id
      );

      let newItems: CartItem[];

      if (existingItem) {
        newItems = state.items.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        // console.log('🎯 Updated cart item quantity:', menuItem.name, existingItem.quantity + quantity);
      } else {
        newItems = [...state.items, { menuItem, quantity, special_instructions: specialInstructions }];
        // console.log('🎯 Added item to cart:', menuItem.name, quantity);
      }

      eventBus.emit(EVENT_TYPES.CART_UPDATED, newItems);
      return { items: newItems };
    });
  },

  removeItem: (menuItemId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.menuItem.id !== menuItemId);
      // console.log('🎯 Removed item from cart:', menuItemId);
      eventBus.emit(EVENT_TYPES.CART_UPDATED, newItems);
      return { items: newItems };
    });
  },

  updateQuantity: (menuItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.menuItem.id !== menuItemId) };
      }

      const newItems = state.items.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      );
      eventBus.emit(EVENT_TYPES.CART_UPDATED, newItems);
      return { items: newItems };
    });
  },

  updateInstructions: (menuItemId, instructions) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, special_instructions: instructions }
          : item
      );
      return { items: newItems };
    });
  },

  clearCart: () => {
    set({ items: [] });
    // console.log('🎯 Cart cleared');
    eventBus.emit(EVENT_TYPES.CART_UPDATED, []);
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
