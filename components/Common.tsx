import React from 'react';
import { OrderStatus, Restaurant } from '../types';

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-40">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-4 mx-4">
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);

export const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    paid: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full uppercase ${styles[status]}`}>
      {status}
    </span>
  );
};

export const Hero: React.FC<{ restaurant: Restaurant; tableNumber?: number }> = ({ restaurant, tableNumber }) => (
  <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 bg-gray-900 overflow-hidden transition-all duration-300">
    {restaurant.hero_image_url && (
      <img
        src={restaurant.hero_image_url}
        alt={restaurant.name}
        className="w-full h-full object-cover opacity-60"
      />
    )}
    <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 text-white">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 transition-all duration-300">{restaurant.name}</h1>
      {restaurant.tagline && <p className="text-lg sm:text-xl text-gray-200 opacity-90">{restaurant.tagline}</p>}
      {tableNumber && (
        <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 shadow-sm">
          <span className="font-semibold text-sm md:text-base">Table {tableNumber}</span>
        </div>
      )}
    </div>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }> = 
  ({ className = '', variant = 'primary', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation";
    const variants = {
      primary: "bg-primary text-white hover:bg-orange-600 focus:ring-primary shadow-sm",
      secondary: "bg-accent text-white hover:bg-blue-900 focus:ring-accent shadow-sm",
      outline: "border-2 border-primary text-primary hover:bg-orange-50 focus:ring-primary"
    };
    return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />;
  };