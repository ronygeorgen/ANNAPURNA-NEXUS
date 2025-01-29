import React, { useState, useEffect } from 'react'
import { Users, ShoppingCart, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../../services/api';
import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice';


function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();


  // State for dashboard data
  const [userCount, setUserCount] = useState({
    count: 0,
    loading: true,
    error: null
  });

  const [productCount, setProductCount] = useState({
    count: 0,
    loading: true,
    error: null
  });

  const [revenue, setRevenue] = useState({
    total: 0,
    loading: true,
    error: null
  });

  // const [recentActivities, setRecentActivities] = useState({
  //   activities: [],
  //   loading: true,
  //   error: null
  // });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // Fetch User Count
      const userCountResponse = await api.get('user/user-count/');
      setUserCount({
        count: userCountResponse.data.count,
        loading: false,
        error: null
      });

      // Fetch Product Count
      const productCountResponse = await api.get('order-management/ordered-products-count/');
      setProductCount({
        count: productCountResponse.data.count,
        loading: false,
        error: null
      });
      

      // Fetch Revenue
      const revenueResponse = await api.get('order-management/revenue/');
      setRevenue({
        total: revenueResponse.data.total,
        loading: false,
        error: null
      });

      // Fetch Recent Activities
      // const activitiesResponse = await api.get('dashboard/recent-activities/');
      // setRecentActivities({
      //   activities: activitiesResponse.data.activities,
      //   loading: false,
      //   error: null
      // });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      
      // Update states with error information
      setUserCount(prev => ({ ...prev, loading: false, error: error.message }));
      setProductCount(prev => ({ ...prev, loading: false, error: error.message }));
      setRevenue(prev => ({ ...prev, loading: false, error: error.message }));
      // setRecentActivities(prev => ({ ...prev, loading: false, error: error.message }));

      toast.error('Failed to load dashboard data');
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Logout handler
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

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IND'
    }).format(amount);
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
          {/* Total Users */}
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Users</h3>
            <p className="text-4xl text-orange-400 font-bold">
              {userCount.loading ? '...' : userCount.error ? 'Error' : userCount.count}
            </p>
            <p className="text-teal-300 text-sm mt-2">Registered Users</p>
          </div>

          {/* Total Products */}
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Products</h3>
            <p className="text-4xl text-orange-400 font-bold">
              {productCount.loading ? '...' : productCount.error ? 'Error' : productCount.count}
            </p>
            <p className="text-teal-300 text-sm mt-2">Ordered Products</p>
          </div>

          {/* Total Sales */}
          <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
            <h3 className="text-xl font-semibold text-white mb-2">Total Sales</h3>
            <p className="text-4xl text-orange-400 font-bold">
              {revenue.loading ? '...' : revenue.error ? 'Error' : formatCurrency(revenue.total)}
            </p>
            <p className="text-teal-300 text-sm mt-2">Total Revenue</p>
          </div>
        </div>

        {/* Recent activity */}
        {/* <div className="bg-teal-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-blur-sm border border-teal-700">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {recentActivities.loading ? (
              <li className="text-teal-300">Loading activities...</li>
            ) : recentActivities.error ? (
              <li className="text-red-400">Failed to load activities</li>
            ) : recentActivities.activities.length === 0 ? (
              <li className="text-teal-300">No recent activities</li>
            ) : (
              recentActivities.activities.map((activity, index) => (
                <li 
                  key={index} 
                  className="flex items-center text-teal-300 border-b border-teal-700 pb-2"
                >
                  {activity.type === 'user' && <Users className="mr-3 h-5 w-5" />}
                  {activity.type === 'order' && <ShoppingCart className="mr-3 h-5 w-5" />}
                  {activity.type === 'system' && <Settings className="mr-3 h-5 w-5" />}
                  
                  <div>
                    <span className="font-medium">{activity.description}</span>
                    <p className="text-sm text-teal-400">{activity.timestamp}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div> */}
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