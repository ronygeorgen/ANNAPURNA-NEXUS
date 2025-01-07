import React, { useState, useEffect } from 'react';
import { 
  Home, 
  CreditCard, 
  ShoppingBag, 
  Package, 
  Store, 
  Bell, 
  Phone, 
  User, 
  Search, 
  Settings, 
  ChevronDown, 
  LogOut, 
  MessageCircle 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import SubAdminAside from '../SubAdminAside/SubAdminAside';
import { toast } from 'sonner';
import { fetchProfile } from '../../../features/sub-admin-profile/profileSlice';
import { 
  fetchDashboardMetrics, 
  resetDashboard 
} from '../../../features/sub-admin-dashboard/dashboardSlice';
import ChatModal from '../../common/ChatModal';
import SubAdminVideoCall from '../SubAdminVideoCall/SubAdminVideoCall';

// Chart component
const Chart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="Orders" 
        stroke="#eab308" 
        strokeWidth={2} 
      />
      <Line 
        type="monotone" 
        dataKey="Sales" 
        stroke="#ef4444" 
        strokeWidth={2} 
      />
    </LineChart>
  </ResponsiveContainer>
);

// MetricsSection component
const MetricsSection = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
      <div className="rounded-full bg-blue-100 p-3 mr-4">
        <svg 
          className="w-6 h-6 text-blue-500" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-gray-500 text-sm">INCOME</p>
        <p className="text-2xl font-bold">
          ₹{metrics.revenue?.toLocaleString() || '0'}
        </p>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
      <div className="rounded-full bg-orange-100 p-3 mr-4">
        <ShoppingBag className="w-6 h-6 text-orange-500" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">Orders</p>
        <p className="text-2xl font-bold">{metrics.orders?.length || 0}</p>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
      <div className="rounded-full bg-green-100 p-3 mr-4">
        <Package className="w-6 h-6 text-green-500" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">Registered Cards</p>
        <p className="text-2xl font-bold">{metrics.registeredCards || 0}</p>
      </div>
    </div>
    
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
      <div className="rounded-full bg-purple-100 p-3 mr-4">
        <Store className="w-6 h-6 text-purple-500" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">Cards pending</p>
        <p className="text-2xl font-bold">{metrics.pendingCards || 0}</p>
      </div>
    </div>
  </div>
);

// RecentOrders component
const RecentOrders = ({ orders }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-2">Order ID</th>
            <th className="pb-2">Customer</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 5).map((order) => (
            <tr key={order.order_id} className="border-t">
              <td className="py-2">#{order.order_id.slice(-5)}</td>
              <td>{order.user}</td>
              <td>
                <span className={`
                  px-2 py-1 rounded-full text-xs
                  ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                  ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${order.status === 'PROCESSED' ? 'bg-blue-100 text-blue-800' : ''}
                `}>
                  {order.status}
                </span>
              </td>
              <td>₹{parseFloat(order.total_amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// QuickActions component
const QuickActions = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button className="bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center">
        <Package className="mr-2" /> New Stock Entry
      </button>
      <button className="bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center">
        <Bell className="mr-2" /> Send Announcement
      </button>
      <button className="bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center">
        <CreditCard className="mr-2" /> Register Card
      </button>
      <button className="bg-teal-500 text-white p-4 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center">
        <Store className="mr-2" /> Add Ration Shop
      </button>
    </div>
  </div>
);

// Main Dashboard Component
function SubAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux state
  const { 
    metrics, 
    loading: dashboardLoading, 
    error: dashboardError, 
    initialized: dashboardInitialized 
  } = useSelector((state) => state.dashboard);
  
  const { 
    data: profileData, 
    loading: profileLoading, 
    error: profileError 
  } = useSelector((state) => state.profile);
  
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (!profileData?.shopID && !profileLoading) {
      dispatch(fetchProfile());
    }
  }, [dispatch, profileData, profileLoading]);

  // Fetch dashboard metrics
  useEffect(() => {
    if (profileData?.shopID && !dashboardInitialized && !dashboardLoading) {
      dispatch(fetchDashboardMetrics());
    }
  }, [dispatch, profileData, dashboardInitialized, dashboardLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetDashboard());
    };
  }, [dispatch]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Dashboard State:', {
        profileLoading,
        dashboardLoading,
        dashboardInitialized,
        hasProfileData: !!profileData?.shopID,
        metrics
      });
    }
  }, [profileLoading, dashboardLoading, dashboardInitialized, profileData, metrics]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/sub-admin-login');
      toast.success('Logout successful!');
    } catch (error) {
      const errorMessage = error.non_field_errors?.[0] || 'An error occurred';
      toast.error(`Logout failed: ${errorMessage}`);
    }
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  // Modified loading logic
  const isLoading = 
  (!profileData?.shopID && profileLoading) || 
  (dashboardInitialized === undefined && dashboardLoading);

  const error = profileError || dashboardError;

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-red-500 text-center p-4">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SubAdminAside handleLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-auto">
        

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>

          <div className="flex items-center">
            {profileData?.shopID && (
              <SubAdminVideoCall shopId={profileData.shopID} />
            )}
            
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            
            <button
              onClick={toggleChat}
              className="mr-4 text-gray-500 hover:text-teal-500 transition-colors"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
            
            <Settings className="text-gray-500 mr-4" />
            
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">
                {profileData?.ownerName}
              </span>
              <img 
                src={profileData?.profilePicture || "/api/placeholder/32/32"} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            <MetricsSection metrics={metrics} />

            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Statistics</h3>
                <div className="flex items-center">
                  <span className="mr-2">Filter by:</span>
                  <div className="relative">
                    <select className="appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-teal-500">
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>This Year</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              <Chart data={metrics.monthlyStats || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentOrders orders={metrics.orders || []} />
              <QuickActions />
            </div>

            <ChatModal 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
            />
          </>
        )}
      </main>
    </div>
  );
}

export default SubAdminDashboard;