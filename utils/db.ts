import { createClient } from '@supabase/supabase-js';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Order, OrderItem, Restaurant, MenuCategory, MenuItem, Table, OrderStatus } from '../types';

// --- LOCAL SYNC (BROADCAST CHANNEL) ---
// This allows tabs to talk to each other instantly without a server
export const localChannel = new BroadcastChannel('urban_bites_local_sync');

// --- MOCK DATA ---
export const MOCK_RESTAURANT: Restaurant = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Urban Bites',
  slug: 'urban-bites',
  cuisine_type: 'Modern Casual',
  tagline: 'Fast. Fresh. Delicious.',
  address: '42 Rue de Rivoli, 75004 Paris, France',
  phone: '+33 1 23 45 67 89',
  email: 'hello@urbanbites.fr',
  logo_url: null,
  hero_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
  theme_primary_color: '#FF6B35',
  theme_accent_color: '#004E89',
  theme_background_color: '#FFFFFF',
  theme_font: 'Inter',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurant_id: MOCK_RESTAURANT.id, name: 'Starters', description: 'Begin your meal', display_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-2', restaurant_id: MOCK_RESTAURANT.id, name: 'Mains', description: 'Hearty meals', display_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-4', restaurant_id: MOCK_RESTAURANT.id, name: 'Desserts', description: 'Sweet treats', display_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: 'cat-3', restaurant_id: MOCK_RESTAURANT.id, name: 'Drinks', description: 'Beverages', display_order: 4, is_active: true, created_at: new Date().toISOString() },
];

const MOCK_ITEMS: MenuItem[] = [
  // --- STARTERS ---
  { id: 'item-1', category_id: 'cat-1', name: 'Truffle Fries', description: 'Crispy fries with parmesan & white truffle oil', price: 6.50, image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80', allergens: ['dairy'], dietary_tags: ['vegetarian'], is_available: true, prep_time_minutes: 10, created_at: new Date().toISOString() },
  { id: 'item-2', category_id: 'cat-1', name: 'Crispy Calamari', description: 'Tender squid rings served with lemon garlic aioli', price: 8.90, image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80', allergens: ['seafood', 'gluten', 'eggs'], dietary_tags: [], is_available: true, prep_time_minutes: 12, created_at: new Date().toISOString() },
  { id: 'item-10', category_id: 'cat-1', name: 'Burrata Salad', description: 'Fresh burrata, heirloom tomatoes, pesto, balsamic glaze', price: 11.50, image_url: 'https://images.unsplash.com/photo-1608032077018-c9aad9565d29?auto=format&fit=crop&w=800&q=80', allergens: ['dairy', 'nuts'], dietary_tags: ['vegetarian', 'gluten-free'], is_available: true, prep_time_minutes: 8, created_at: new Date().toISOString() },
  { id: 'item-11', category_id: 'cat-1', name: 'Spicy Buffalo Wings', description: '6pcs wings tossed in house hot sauce with blue cheese dip', price: 9.50, image_url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=800&q=80', allergens: ['dairy'], dietary_tags: ['spicy'], is_available: true, prep_time_minutes: 15, created_at: new Date().toISOString() },
  
  // --- MAINS ---
  { id: 'item-3', category_id: 'cat-2', name: 'Classic Burger', description: 'Angus beef patty, cheddar, lettuce, tomato, secret sauce', price: 12.50, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', allergens: ['gluten', 'dairy', 'eggs'], dietary_tags: [], is_available: true, prep_time_minutes: 18, created_at: new Date().toISOString() },
  { id: 'item-4', category_id: 'cat-2', name: 'Veggie Burger', description: 'Plant-based patty, avocado, pickled onions, vegan mayo', price: 13.50, image_url: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=800&q=80', allergens: ['soy', 'gluten'], dietary_tags: ['vegan'], is_available: true, prep_time_minutes: 16, created_at: new Date().toISOString() },
  { id: 'item-12', category_id: 'cat-2', name: 'Steak Frites', description: '200g Sirloin steak with herb butter and french fries', price: 24.00, image_url: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80', allergens: ['dairy'], dietary_tags: ['gluten-free'], is_available: true, prep_time_minutes: 20, created_at: new Date().toISOString() },
  { id: 'item-13', category_id: 'cat-2', name: 'Grilled Salmon Bowl', description: 'Quinoa, roasted veggies, avocado, lemon dressing', price: 18.50, image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?auto=format&fit=crop&w=800&q=80', allergens: ['seafood'], dietary_tags: ['gluten-free', 'healthy'], is_available: true, prep_time_minutes: 18, created_at: new Date().toISOString() },
  { id: 'item-14', category_id: 'cat-2', name: 'Mushroom Risotto', description: 'Creamy arborio rice with wild mushrooms and parmesan', price: 16.00, image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80', allergens: ['dairy'], dietary_tags: ['vegetarian'], is_available: true, prep_time_minutes: 22, created_at: new Date().toISOString() },

  // --- DESSERTS ---
  { id: 'item-19', category_id: 'cat-4', name: 'Lava Cake', description: 'Warm chocolate cake with a molten center and vanilla ice cream', price: 8.00, image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80', allergens: ['dairy', 'gluten', 'eggs'], dietary_tags: ['vegetarian'], is_available: true, prep_time_minutes: 10, created_at: new Date().toISOString() },
  { id: 'item-20', category_id: 'cat-4', name: 'Cheesecake', description: 'New York style cheesecake with berry compote', price: 7.50, image_url: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=800&q=80', allergens: ['dairy', 'gluten'], dietary_tags: ['vegetarian'], is_available: true, prep_time_minutes: 5, created_at: new Date().toISOString() },
  { id: 'item-21', category_id: 'cat-4', name: 'Fruit Sorbet', description: 'Trio of seasonal fruit sorbets (Mango, Raspberry, Lemon)', price: 6.00, image_url: 'https://images.unsplash.com/photo-1560963805-6c35fa021c1c?auto=format&fit=crop&w=800&q=80', allergens: [], dietary_tags: ['vegan', 'gluten-free'], is_available: true, prep_time_minutes: 5, created_at: new Date().toISOString() },

  // --- DRINKS ---
  { id: 'item-5', category_id: 'cat-3', name: 'Fresh Lemonade', description: 'Homemade with fresh lemons and mint', price: 4.50, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', allergens: [], dietary_tags: ['vegan'], is_available: true, prep_time_minutes: 3, created_at: new Date().toISOString() },
  { id: 'item-15', category_id: 'cat-3', name: 'Craft Cola', description: 'Artisanal organic cola', price: 4.00, image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80', allergens: [], dietary_tags: ['vegan'], is_available: true, prep_time_minutes: 2, created_at: new Date().toISOString() },
  { id: 'item-16', category_id: 'cat-3', name: 'Iced Latte', description: 'Double espresso shot with cold milk over ice', price: 5.00, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', allergens: ['dairy'], dietary_tags: ['vegetarian'], is_available: true, prep_time_minutes: 4, created_at: new Date().toISOString() },
  { id: 'item-17', category_id: 'cat-3', name: 'Craft IPA', description: 'Local hazy IPA (5.5% ABV)', price: 7.00, image_url: 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=800&q=80', allergens: ['gluten'], dietary_tags: [], is_available: true, prep_time_minutes: 2, created_at: new Date().toISOString() },
  { id: 'item-18', category_id: 'cat-3', name: 'Sparkling Water', description: 'San Pellegrino 500ml', price: 3.50, image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80', allergens: [], dietary_tags: ['vegan'], is_available: true, prep_time_minutes: 1, created_at: new Date().toISOString() },
];

export const MOCK_TABLES: Table[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `table-${i + 1}`,
  restaurant_id: MOCK_RESTAURANT.id,
  table_number: i + 1,
  qr_token: `token-${i + 1}`,
  capacity: 4,
  status: 'available',
  created_at: new Date().toISOString(),
}));

// --- SUPABASE CLIENT ---
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
const localUrl = localStorage.getItem('urban_bites_sb_url');
const localKey = localStorage.getItem('urban_bites_sb_key');

const supabaseUrl = envUrl || localUrl || '';
const supabaseAnonKey = envKey || localKey || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } }) 
  : null;

if (!supabase) {
  console.log('ℹ️ Running in LOCAL MODE (No Supabase).');
}

// --- INDEXED DB ---
interface UrbanBitesDB extends DBSchema {
  orders: {
    key: string;
    value: Order;
    indexes: { 'by-status': string; 'by-created': string };
  };
  orderItems: {
    key: string;
    value: OrderItem;
    indexes: { 'by-order': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'order' | 'orderItem';
      action: 'create' | 'update';
      data: any;
      retryCount: number;
      createdAt: string;
    };
  };
}

let db: IDBPDatabase<UrbanBitesDB> | null = null;

export async function initDatabase(): Promise<void> {
  if (db) return;

  try {
    db = await openDB<UrbanBitesDB>('urban-bites-db', 1, {
      upgrade(database) {
        const ordersStore = database.createObjectStore('orders', { keyPath: 'id' });
        ordersStore.createIndex('by-status', 'status');
        ordersStore.createIndex('by-created', 'created_at');

        const orderItemsStore = database.createObjectStore('orderItems', { keyPath: 'id' });
        orderItemsStore.createIndex('by-order', 'order_id');

        database.createObjectStore('syncQueue', { keyPath: 'id' });
        console.log('✅ IndexedDB initialized');
      },
    });
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    throw error;
  }
}

// Data Fetching Abstraction (Mock vs Real)
export const Api = {
  async getRestaurant(): Promise<Restaurant> {
    if (supabase) {
      const { data, error } = await supabase.from('restaurants').select('*').single();
      if (!error && data) return data;
    }
    return MOCK_RESTAURANT;
  },

  async getMenu(): Promise<{ categories: MenuCategory[], items: MenuItem[] }> {
    if (supabase) {
      const { data: categories, error: catError } = await supabase.from('menu_categories').select('*').order('display_order');
      const { data: items, error: itemError } = await supabase.from('menu_items').select('*').eq('is_available', true);
      
      if (!catError && !itemError && categories && items) {
        return { categories, items };
      }
    }
    return { categories: MOCK_CATEGORIES, items: MOCK_ITEMS };
  },

  async getTableByToken(token: string): Promise<Table | null> {
    if (supabase) {
      const { data, error } = await supabase.from('tables').select('*').eq('qr_token', token).single();
      if (!error && data) return data;
    }
    // Fallback Mock Logic
    return MOCK_TABLES.find(t => t.qr_token === token || token.includes('demo') || token.includes('token')) || MOCK_TABLES[0];
  },
  
  async createOrder(order: Order, items: OrderItem[]) {
    await saveOrderToIndexedDB(order);
    await saveOrderItemsToIndexedDB(items);
    
    // Notify other tabs immediately
    localChannel.postMessage({ type: 'NEW_ORDER', order });

    if (supabase) {
      const { error: oErr } = await supabase.from('orders').insert(order);
      const { error: iErr } = await supabase.from('order_items').insert(items);
      if (!oErr && !iErr) return true;
    }
    return true;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!db) await initDatabase();
    
    // Update IDB
    const tx = db!.transaction('orders', 'readwrite');
    const order = await tx.store.get(orderId);
    
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      if (status === 'delivered' || status === 'cancelled') {
        order.completed_at = new Date().toISOString();
      }
      await tx.store.put(order);
      
      // Notify other tabs
      localChannel.postMessage({ type: 'ORDER_UPDATED', order });
    }
    await tx.done;

    // Update Supabase
    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          completed_at: (status === 'delivered' || status === 'cancelled') ? new Date().toISOString() : null
        })
        .eq('id', orderId);
        
      if (error) console.error("Supabase Update Failed:", error);
    }
    return true;
  }
};

// Orders - IDB
export async function saveOrderToIndexedDB(order: Order): Promise<void> {
  if (!db) await initDatabase();
  await db!.put('orders', order);
}

export async function getAllOrdersFromIndexedDB(): Promise<Order[]> {
  if (!db) await initDatabase();
  return await db!.getAll('orders');
}

export async function saveOrderItemsToIndexedDB(items: OrderItem[]): Promise<void> {
  if (!db) await initDatabase();
  const tx = db!.transaction('orderItems', 'readwrite');
  await Promise.all(items.map(item => tx.store.put(item)));
  await tx.done;
}

export async function getOrderItemsFromIndexedDB(orderId: string): Promise<OrderItem[]> {
  if (!db) await initDatabase();
  return await db!.getAllFromIndex('orderItems', 'by-order', orderId);
}