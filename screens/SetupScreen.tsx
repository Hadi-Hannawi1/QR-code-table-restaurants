import React, { useState, useEffect } from 'react';
import { Button } from '../components/Common';
import toast from 'react-hot-toast';

const SQL_SCHEMA = `
-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cuisine_type TEXT NOT NULL,
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  hero_image_url TEXT,
  theme_primary_color TEXT DEFAULT '#FF6B35',
  theme_accent_color TEXT DEFAULT '#004E89',
  theme_background_color TEXT DEFAULT '#FFFFFF',
  theme_font TEXT DEFAULT 'Inter',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  allergens TEXT[] DEFAULT '{}',
  dietary_tags TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  prep_time_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  qr_token TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_number SERIAL,
  customer_name TEXT,
  status TEXT DEFAULT 'pending',
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DATA (Optional - Run only once)
WITH new_restaurant AS (
  INSERT INTO restaurants (name, slug, cuisine_type, tagline, hero_image_url) 
  VALUES ('Urban Bites', 'urban-bites', 'Modern Casual', 'Fast. Fresh. Delicious.', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600')
  RETURNING id
),
new_categories AS (
  INSERT INTO menu_categories (restaurant_id, name, display_order)
  SELECT id, 'Starters', 1 FROM new_restaurant
  UNION ALL
  SELECT id, 'Mains', 2 FROM new_restaurant
  UNION ALL
  SELECT id, 'Drinks', 3 FROM new_restaurant
  RETURNING id, name
)
INSERT INTO tables (restaurant_id, table_number, qr_token)
SELECT r.id, t.num, 'token-' || t.num
FROM new_restaurant r
CROSS JOIN generate_series(1, 10) as t(num);
`;

export const SetupScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setUrl(localStorage.getItem('urban_bites_sb_url') || '');
    setKey(localStorage.getItem('urban_bites_sb_key') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('urban_bites_sb_url', url.trim());
    localStorage.setItem('urban_bites_sb_key', key.trim());
    setIsSaved(true);
    toast.success('Credentials saved! Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleClear = () => {
    localStorage.removeItem('urban_bites_sb_url');
    localStorage.removeItem('urban_bites_sb_key');
    setUrl('');
    setKey('');
    toast.success('Credentials cleared. Reverting to Mock Mode.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    toast.success('SQL Schema copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supabase Setup</h1>
          <p className="text-gray-600 mt-2">Connect your real backend to replace the Mock Data.</p>
        </header>

        {/* Step 1: SQL Schema */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">1. Database Schema</h2>
            <Button onClick={copySQL} variant="secondary" className="text-sm">Copy SQL</Button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Paste this into your Supabase <strong>SQL Editor</strong> to create the necessary tables and seed data.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre">{SQL_SCHEMA}</pre>
          </div>
        </div>

        {/* Step 2: Credentials */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">2. Connection Details</h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter your Project URL and Anon Key found in Supabase Settings {'>'} API.
            These will be saved to your browser's LocalStorage.
          </p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anon API Key</label>
              <input 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <Button onClick={handleSave} disabled={isSaved}>
                {isSaved ? 'Saved' : 'Save & Reload'}
              </Button>
              {(url || key) && (
                <Button onClick={handleClear} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                  Reset / Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
