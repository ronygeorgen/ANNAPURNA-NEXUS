import React from 'react';
import { BarChart3, Users, ShoppingCart, Settings, LogOut, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function AdminAside({ handleLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "bg-teal-700 bg-opacity-75" : "";
  };

  return (
    <aside className="w-64 bg-teal-800 bg-opacity-50 text-white p-6 backdrop-blur-sm">
      <div className="flex items-center mb-8">
        <svg className="w-10 h-10 mr-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="#38B2AC" strokeWidth="10"/>
          <path d="M50 25L75 75H25L50 25Z" fill="#F6AD55"/>
        </svg>
        <h1 className="text-xl font-semibold">ANNAPURNA NEXUS</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link to="/admin-dashboard" className={`flex items-center p-2 rounded-lg hover:bg-teal-700 hover:bg-opacity-75 transition-all duration-200 ${isActive('/admin-dashboard')}`}>
              <BarChart3 className="mr-3 h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/sub-admin-management" className={`flex items-center p-2 rounded-lg hover:bg-teal-700 hover:bg-opacity-75 transition-all duration-200 ${isActive('/sub-admin-management')}`}>
              <Users className="mr-3 h-5 w-5" />
              <span>Sub-Admins</span>
            </Link>
          </li>
          <li>
            <Link to="/create-ration-shop" className={`flex items-center p-2 rounded-lg hover:bg-teal-700 hover:bg-opacity-75 transition-all duration-200 ${isActive('/create-ration-shop')}`}>
              <Store className="mr-3 h-5 w-5" />
              <span>Create Ration Shop</span>
            </Link>
          </li>
          <li>
            <Link to="/products" className={`flex items-center p-2 rounded-lg hover:bg-teal-700 hover:bg-opacity-75 transition-all duration-200 ${isActive('/products')}`}>
              <ShoppingCart className="mr-3 h-5 w-5" />
              <span>Products</span>
            </Link>
          </li>
          <li>
            <Link to="/settings" className={`flex items-center p-2 rounded-lg hover:bg-teal-700 hover:bg-opacity-75 transition-all duration-200 ${isActive('/settings')}`}>
              <Settings className="mr-3 h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      <button className="flex items-center p-2 mt-auto text-teal-300 hover:text-white transition-colors duration-200" onClick={handleLogout}>
        <LogOut className="mr-3 h-5 w-5" />
        Logout
      </button>
    </aside>
  );
}

export default AdminAside;