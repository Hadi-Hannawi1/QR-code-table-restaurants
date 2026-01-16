import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MenuCategory, MenuItem, Restaurant, Table, Order, OrderItem } from '../types';
import { Api, MOCK_RESTAURANT } from '../utils/db';
import { Hero, LoadingSpinner, ErrorMessage } from '../components/Common';
import { MenuCategoryTabs, MenuGrid } from '../components/Menu';
import { CartButton, CartSidebar } from '../components/Cart';
import { useCartStore } from '../store/cartStore';
import { PricingSystem } from '../utils/core';
import toast from 'react-hot-toast';

export const CustomerOrderScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant>(MOCK_RESTAURANT);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { items: cartItems, clearCart } = useCartStore();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        if (!token) throw new Error("No table token provided. Please scan a valid QR code.");

        const tableData = await Api.getTableByToken(token);
        if (!tableData) throw new Error("Invalid table token.");
        
        setTable(tableData);
        setRestaurant(MOCK_RESTAURANT); // In real app, fetch via relation or ID

        const { categories: cats, items: menuItems } = await Api.getMenu();
        setCategories(cats);
        setItems(menuItems);
        if (cats.length > 0) setActiveCategory(cats[0].id);

      } catch (err: any) {
        setError(err.message || "Failed to load menu.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const handlePlaceOrder = async () => {
    if (!table) return;
    setIsSubmitting(true);
    
    try {
      const summary = PricingSystem.getOrderSummary(cartItems);
      const orderId = crypto.randomUUID();
      
      const order: Order = {
        id: orderId,
        table_id: table.id,
        order_number: Math.floor(Math.random() * 1000), // Mock order number
        customer_name: "Guest",
        status: 'pending',
        subtotal: summary.subtotal,
        tax: summary.tax,
        service_charge: summary.serviceCharge,
        total: summary.total,
        special_instructions: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const orderItems: OrderItem[] = cartItems.map(item => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: item.menuItem.id,
        menu_item_name: item.menuItem.name,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        special_instructions: item.special_instructions,
        created_at: new Date().toISOString()
      }));

      await Api.createOrder(order, orderItems);
      
      toast.success('Order placed successfully!');
      clearCart();
      setIsCartOpen(false);
      navigate('/order-success');
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 pt-20"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 p-6"><ErrorMessage message={error} /></div>;

  const filteredItems = items.filter(item => item.category_id === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Hero restaurant={restaurant} tableNumber={table?.table_number} />
      
      <MenuCategoryTabs 
        categories={categories} 
        activeCategory={activeCategory} 
        onSelect={setActiveCategory} 
      />
      
      <main className="max-w-7xl mx-auto">
        <MenuGrid items={filteredItems} />
      </main>

      <CartButton onClick={() => setIsCartOpen(true)} />
      
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        onCheckout={handlePlaceOrder}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export const OrderSuccessScreen: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Received!</h1>
    <p className="text-gray-600 mb-8 max-w-md">
      The kitchen has received your order and will begin preparing it shortly. Sit tight!
    </p>
    <button 
      onClick={() => window.history.back()}
      className="text-primary font-medium hover:underline"
    >
      Return to Menu
    </button>
  </div>
);
