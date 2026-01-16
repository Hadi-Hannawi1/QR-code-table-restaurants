import React from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CustomerOrderScreen, OrderSuccessScreen } from './screens/CustomerScreens';
import { KitchenDashboard, QRGeneratorScreen } from './screens/StaffScreens';
import { SetupScreen } from './screens/SetupScreen';

// Landing page to simulate scanning or portal entry
const Landing: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
    <div className="max-w-md w-full text-center space-y-8">
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Urban Bites</h1>
      <p className="text-xl text-gray-400">Production Ready QR Ordering System</p>
      
      <div className="grid gap-4 mt-8">
        <Link to="/kitchen" className="block w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700">
          <span className="text-xl font-bold">Kitchen Display</span>
          <p className="text-sm text-gray-400">View incoming orders</p>
        </Link>
        
        <Link to="/admin/qr" className="block w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all border border-gray-700">
          <span className="text-xl font-bold">QR Generator</span>
          <p className="text-sm text-gray-400">Print table codes</p>
        </Link>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
          <div className="relative flex justify-center"><span className="px-2 bg-gray-900 text-gray-500 text-sm">Demo Links</span></div>
        </div>

        {/* Shortcut to table 1 */}
        <Link to="/order?token=token-1" className="block w-full py-3 bg-primary hover:bg-orange-600 rounded-xl font-bold text-white transition-all shadow-lg shadow-orange-900/20">
          Simulate "Scan Table 1"
        </Link>
        
        <Link to="/setup" className="inline-block text-gray-500 hover:text-gray-300 text-sm mt-4 underline">
          Configure Supabase (Backend)
        </Link>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/order" element={<CustomerOrderScreen />} />
        <Route path="/order-success" element={<OrderSuccessScreen />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/admin/qr" element={<QRGeneratorScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;