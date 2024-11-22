import React from 'react'
import { BarChart3, Users, ShoppingCart, Settings, LogOut, Bell, Search, ChevronDown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';
import { toast } from 'react-toastify';

function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await dispatch(logoutUser()).unwrap();
        navigate('/admin-login');
        toast.success('Admin logged out successfully')
    } catch (error) {
        console.error("Logout failed", error);
        toast.error('Log out failed')
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
      {/* Sidebar */}
      <AdminAside handleLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <AdminHeader/>

        <h2 className="text-3xl font-semibold text-white mb-6">Dashboard Overview</h2>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats cards */}
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Users</h3>
            <p className="text-4xl text-orange-400 font-bold">1,234</p>
            <p className="text-teal-300 text-sm mt-2">+5.2% from last week</p>
          </div>
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Products</h3>
            <p className="text-4xl text-orange-400 font-bold">567</p>
            <p className="text-teal-300 text-sm mt-2">+2.7% from last month</p>
          </div>
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Sales</h3>
            <p className="text-4xl text-orange-400 font-bold">$89,012</p>
            <p className="text-teal-300 text-sm mt-2">+10.3% from last quarter</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            <li className="flex items-center text-teal-300 border-b border-teal-700 pb-2">
              <Users className="mr-3 h-5 w-5" />
              <div>
                <span className="font-medium">New user registered:</span>
                <span className="ml-1 text-white">John Doe</span>
                <p className="text-sm text-teal-400">2 hours ago</p>
              </div>
            </li>
            <li className="flex items-center text-teal-300 border-b border-teal-700 pb-2">
              <ShoppingCart className="mr-3 h-5 w-5" />
              <div>
                <span className="font-medium">New order placed:</span>
                <span className="ml-1 text-white">#12345</span>
                <p className="text-sm text-teal-400">4 hours ago</p>
              </div>
            </li>
            <li className="flex items-center text-teal-300">
              <Settings className="mr-3 h-5 w-5" />
              <div>
                <span className="font-medium">System update completed</span>
                <p className="text-sm text-teal-400">1 day ago</p>
              </div>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard;