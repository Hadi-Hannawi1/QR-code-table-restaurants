import React, { useState, useEffect } from 'react';
import { getAllOrdersFromIndexedDB, MOCK_TABLES, localChannel, Api, getOrderItemsFromIndexedDB } from '../utils/db';
import { Order, OrderItem, OrderStatus } from '../types';
import { LoadingSpinner, Button } from '../components/Common';
import { QRCodeSystem, getTimeDifference } from '../utils/core';
import toast from 'react-hot-toast';

// --- COMPONENTS ---

// 1. Single Order Ticket Component
const KitchenTicket: React.FC<{ 
  order: Order; 
  onAdvance: () => void;
  variant: 'pending' | 'preparing' | 'ready';
}> = ({ order, onAdvance, variant }) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [elapsed, setElapsed] = useState(getTimeDifference(order.created_at));

  useEffect(() => {
    // Fetch items for this order locally
    getOrderItemsFromIndexedDB(order.id).then(setItems);

    // Update timer every minute
    const timer = setInterval(() => {
      setElapsed(getTimeDifference(order.created_at));
    }, 60000);
    return () => clearInterval(timer);
  }, [order.id, order.created_at]);

  const config = {
    pending: { border: 'border-yellow-400', bg: 'bg-white', badge: 'bg-yellow-100 text-yellow-800', action: 'Start Cook' },
    preparing: { border: 'border-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', action: 'Done' },
    ready: { border: 'border-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', action: 'Delivered' },
  };

  const style = config[variant];
  const tableNum = MOCK_TABLES.find(t => t.id === order.table_id)?.table_number || '?';

  return (
    <div className={`rounded-xl shadow-sm border-l-4 ${style.border} ${style.bg} p-4 mb-4 flex flex-col animate-fade-in`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-black/5 pb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Table {tableNum}</h3>
          <span className="text-xs text-gray-500 font-mono">#{order.order_number}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-semibold text-gray-700">{elapsed}</div>
          <span className="text-xs text-gray-400">Time elapsed</span>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 space-y-2 mb-4">
        {items.length > 0 ? (
          items.map(item => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex gap-2">
                <span className="font-bold bg-gray-200 w-6 h-6 flex items-center justify-center rounded text-xs">
                  {item.quantity}x
                </span>
                <span className="text-gray-800 leading-tight">{item.menu_item_name}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Items loading...</p>
        )}
        {order.special_instructions && (
           <div className="mt-2 bg-red-50 text-red-800 text-xs p-2 rounded border border-red-100 font-medium">
             ⚠️ Note: {order.special_instructions}
           </div>
        )}
      </div>

      {/* Action */}
      <Button 
        onClick={onAdvance} 
        className={`w-full py-3 font-bold text-sm shadow-sm ${variant === 'ready' ? 'bg-green-600 hover:bg-green-700' : ''}`}
        variant={variant === 'preparing' ? 'secondary' : 'primary'}
      >
        {style.action}
      </Button>
    </div>
  );
};

// 2. Kanban Column Component
const KanbanColumn: React.FC<{
  title: string;
  count: number;
  orders: Order[];
  status: 'pending' | 'preparing' | 'ready';
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  color: string;
}> = ({ title, count, orders, status, onUpdateStatus, color }) => (
  <div className="flex flex-col h-full min-w-[300px] md:min-w-[320px] flex-1 bg-gray-100/50 rounded-xl p-2 md:p-4 border border-gray-200">
    <div className={`flex items-center justify-between mb-4 px-1 pb-2 border-b-2 ${color}`}>
      <h2 className="font-bold text-gray-700 uppercase tracking-wider text-sm">{title}</h2>
      <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{count}</span>
    </div>
    
    <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-2">
      {orders.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-lg">
          No orders
        </div>
      ) : (
        orders.map(order => {
           let nextStatus: OrderStatus = 'preparing';
           if (status === 'preparing') nextStatus = 'ready';
           if (status === 'ready') nextStatus = 'delivered';
           
           return (
             <KitchenTicket 
               key={order.id} 
               order={order} 
               variant={status}
               onAdvance={() => onUpdateStatus(order.id, nextStatus)}
             />
           );
        })
      )}
    </div>
  </div>
);

// --- MAIN KITCHEN DASHBOARD ---
export const KitchenDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const allOrders = await getAllOrdersFromIndexedDB();
    // Sort: Oldest first for kitchen (FIFO - First In First Out)
    setOrders(allOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    setLoading(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    await Api.updateOrderStatus(orderId, newStatus);
    toast.success(`Order moved to ${newStatus}`);
    fetchOrders();
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    const handleSync = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'NEW_ORDER' || event.data.type === 'ORDER_UPDATED')) {
        if (event.data.type === 'NEW_ORDER') {
           // Play sound here ideally
           toast("New Order Received!", { icon: '🔔', duration: 4000 });
        }
        fetchOrders();
      }
    };
    localChannel.onmessage = handleSync;
    return () => {
      clearInterval(interval);
      localChannel.onmessage = null;
    };
  }, []);

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) return <div className="p-8"><LoadingSpinner /></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display System</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </div>
          <div className="text-right text-xs text-gray-500">
             {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6">
        <div className="flex gap-4 md:gap-6 h-full min-w-max">
          
          {/* Column 1: New Orders */}
          <KanbanColumn 
            title="New Orders" 
            count={pendingOrders.length} 
            orders={pendingOrders} 
            status="pending"
            onUpdateStatus={handleStatusUpdate}
            color="border-yellow-400"
          />

          {/* Column 2: Preparing */}
          <KanbanColumn 
            title="Cooking" 
            count={preparingOrders.length} 
            orders={preparingOrders} 
            status="preparing"
            onUpdateStatus={handleStatusUpdate}
            color="border-blue-500"
          />

          {/* Column 3: Ready for Pickup */}
          <KanbanColumn 
            title="Ready for Service" 
            count={readyOrders.length} 
            orders={readyOrders} 
            status="ready"
            onUpdateStatus={handleStatusUpdate}
            color="border-green-500"
          />

        </div>
      </div>
    </div>
  );
};

// --- QR GENERATOR (Keep existing) ---
export const QRGeneratorScreen: React.FC = () => {
  const [codes, setCodes] = useState<{table: number, url: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const siteUrl = window.location.origin;

  const generate = async () => {
    setLoading(true);
    const newCodes = [];
    for (const table of MOCK_TABLES) {
      const url = await QRCodeSystem.generateQRCode(table.qr_token, siteUrl);
      newCodes.push({ table: table.table_number, url });
    }
    setCodes(newCodes);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div>
             <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
             <p className="text-gray-500 mt-1">Generate and print table codes for <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{siteUrl}</span></p>
          </div>
          <Button onClick={generate} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Generating...' : 'Generate All Codes'}
          </Button>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {codes.map((code) => (
            <div key={code.table} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
              <span className="font-bold text-lg mb-2 text-gray-900">Table {code.table}</span>
              <div className="bg-white p-2 rounded-lg border border-gray-100 mb-3">
                <img src={code.url} alt={`Table ${code.table}`} className="w-full aspect-square" />
              </div>
              <a 
                href={code.url} 
                download={`table-${code.table}-qr.png`}
                className="w-full text-center py-2 text-sm text-primary font-medium hover:bg-orange-50 rounded transition-colors"
              >
                Download PNG
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};