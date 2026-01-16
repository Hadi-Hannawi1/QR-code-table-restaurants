import QRCode from 'qrcode';
import { CartItem, OrderSummary } from '../types';

// --- Validation ---
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function assertUUID(id: string, context: string): void {
  if (!isValidUUID(id)) {
    console.error(`❌ ${context}: Invalid UUID: ${id}`);
    throw new Error(`${context}: ID must be valid UUID`);
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  // French phone format: +33 X XX XX XX XX
  return /^\+33\s?[1-9](?:\s?\d{2}){4}$/.test(phone);
}

// --- Time Helpers ---
export function getTimeDifference(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m`;
}

// --- Pricing System ---
const FRENCH_VAT_RATE = 0.20; // 20% VAT in France

export const PricingSystem = {
  calculateSubtotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.menuItem.price * item.quantity);
    }, 0);
    return Math.round(subtotal * 100) / 100; // Round to 2 decimals
  },

  calculateTax(subtotal: number): number {
    const tax = subtotal * FRENCH_VAT_RATE;
    return Math.round(tax * 100) / 100;
  },

  calculateServiceCharge(subtotal: number, percentage: number = 0): number {
    if (percentage === 0) return 0;
    const charge = subtotal * (percentage / 100);
    return Math.round(charge * 100) / 100;
  },

  calculateTotal(subtotal: number, tax: number, serviceCharge: number = 0): number {
    const total = subtotal + tax + serviceCharge;
    return Math.round(total * 100) / 100;
  },

  getOrderSummary(items: CartItem[], serviceChargePercentage: number = 0): OrderSummary {
    const subtotal = this.calculateSubtotal(items);
    const tax = this.calculateTax(subtotal);
    const serviceCharge = this.calculateServiceCharge(subtotal, serviceChargePercentage);
    const total = this.calculateTotal(subtotal, tax, serviceCharge);

    return { subtotal, tax, serviceCharge, total };
  },

  formatPrice(price: number): string {
    return `€${price.toFixed(2)}`;
  }
};

// --- Event Bus ---
type EventCallback = (data: any) => void;

interface EventBus {
  events: Map<string, EventCallback[]>;
  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback: EventCallback) => void;
  emit: (event: string, data?: any) => void;
}

class EventBusImpl implements EventBus {
  events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
    // console.log('📢 Event listener added:', event);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        // console.log('📢 Event listener removed:', event);
      }
    }
  }

  emit(event: string, data?: any): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      console.log('📢 Event emitted:', event, data);
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBusImpl();

export const EVENT_TYPES = {
  ORDER_PLACED: 'ORDER_PLACED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  MENU_UPDATED: 'MENU_UPDATED',
  CART_UPDATED: 'CART_UPDATED',
  TABLE_STATUS_CHANGED: 'TABLE_STATUS_CHANGED',
} as const;

// --- QR Code System ---
export const QRCodeSystem = {
  /**
   * Generate QR code data URL for a table
   */
  async generateQRCode(tableToken: string, siteUrl: string): Promise<string> {
    const orderUrl = `${siteUrl}/#/order?token=${tableToken}`; // Added /# for HashRouter compatibility
    
    try {
      const qrDataUrl = await QRCode.toDataURL(orderUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      console.log('✅ QR code generated for token:', tableToken);
      return qrDataUrl;
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error);
      throw error;
    }
  },

  /**
   * Extract token from URL query parameter
   */
  getTokenFromUrl(url: string): string | null {
    // Handle hash router format
    const hashPart = url.split('#')[1] || '';
    const queryPart = hashPart.split('?')[1] || url.split('?')[1];
    
    if (!queryPart) return null;
    
    const urlParams = new URLSearchParams(queryPart);
    return urlParams.get('token');
  },

  /**
   * Validate QR token format (32-character hex string)
   */
  isValidToken(token: string): boolean {
    return /^[0-9a-f]{32}$/i.test(token);
  },
};