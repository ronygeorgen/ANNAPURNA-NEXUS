import React from 'react';
import {Home, CreditCard, ShoppingBag, Package, Store, Bell, Phone, User, LogOut} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function SubAdminAside({ handleLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-teal-600 rounded' : '';
  };

  return (
    <>
      <aside className="w-64 bg-teal-500 text-white p-6 flex flex-col h-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 150" fill="none" className="mb-6">
          <circle cx="50" cy="53" r="40" stroke="#FFF" strokeWidth="10" />
          <path d="M50 25L75 75H25L50 25Z" fill="#F6AD55" />
          <text x="110" y="65" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#FFF">
            ANNAPURNA NEXUS
          </text>
        </svg>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/sub-admin-dashboard" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/sub-admin-dashboard')}`}>
                <Home className="mr-2" /> 
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/sub-admin-card-list" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/sub-admin-card-list')}`}>
                <CreditCard className="mr-2" /> Registered Cards
              </Link>
            </li>
            <li>
              <Link to="/orders" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/orders')}`}>
                <ShoppingBag className="mr-2" /> Orders
              </Link>
            </li>
            <li>
              <Link to="/stock-details" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/stock-details')}`}>
                <Package className="mr-2" /> Stock Details
              </Link>
            </li>
            <li>
              <Link to="/ration-shops" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/ration-shops')}`}>
                <Store className="mr-2" /> Ration Shops
              </Link>
            </li>
            <li>
              <Link to="/announcements" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/announcements')}`}>
                <Bell className="mr-2" /> Announcements
              </Link>
            </li>
            <li>
              <Link to="/contact-admin" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/contact-admin')}`}>
                <Phone className="mr-2" /> Contact Admin
              </Link>
            </li>
            <li>
              <Link to="/sub-admin-profile" className={`flex items-center p-2 hover:bg-teal-600 rounded ${isActive('/sub-admin-profile')}`}>
                <User className="mr-2" /> Profile
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto pt-4 border-t border-teal-400">
          <button onClick={handleLogout} className="flex items-center p-2 hover:bg-teal-600 rounded text-white w-full">
            <LogOut className="mr-2" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default SubAdminAside;
