import React, {useEffect} from 'react'
import { Home, CreditCard, ShoppingBag, Package, Store, Bell, Phone, User, Search, Settings, ChevronDown, LogOut } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import SubAdminAside from '../SubAdminAside/SubAdminAside';
import { toast } from 'sonner';
import { ProfileSchema } from '../../../utils/validationSchemas'
import { fetchProfile, updateProfile, uploadProfilePicture, uploadShopImage, deleteShopImage, resetStatus } from '../../../features/sub-admin-profile/profileSlice'




const data = [
  { name: 'Jan', Stock: 4000, Sales: 2400 },
  { name: 'Feb', Stock: 3000, Sales: 1398 },
  { name: 'Mar', Stock: 2000, Sales: 9800 },
  { name: 'Apr', Stock: 2780, Sales: 3908 },
  { name: 'May', Stock: 1890, Sales: 4800 },
  { name: 'Jun', Stock: 2390, Sales: 3800 },
]

const Chart = () => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="Stock" stroke="#eab308" strokeWidth={2} />
      <Line type="monotone" dataKey="Sales" stroke="#ef4444" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
)

const RecentOrders = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
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
        <tr className="border-t">
          <td className="py-2">#12345</td>
          <td>John Doe</td>
          <td><span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Completed</span></td>
          <td>₹500</td>
        </tr>
        <tr className="border-t">
          <td className="py-2">#12346</td>
          <td>Jane Smith</td>
          <td><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span></td>
          <td>₹750</td>
        </tr>
        <tr className="border-t">
          <td className="py-2">#12347</td>
          <td>Bob Johnson</td>
          <td><span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Cancelled</span></td>
          <td>₹250</td>
        </tr>
      </tbody>
    </table>
  </div>
)

function SubAdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await dispatch(logoutUser()).unwrap();
        navigate('/sub-admin-login');
        toast.success('Logout successful!')
    } catch (error) {
      const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
        toast.error(`Logout failed: ${errorMessage} `)
        console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-gray-100">
      <SubAdminAside handleLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <Settings className="text-gray-500 mr-4" />
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">Rony</span>
              {/* <span className="mr-2 text-xs text-gray-400">Sub-Admin</span> */}
              <img src="/api/placeholder/32/32" alt="Profile" className="w-8 h-8 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">INCOME</p>
              <p className="text-2xl font-bold">₹3900</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-orange-100 p-3 mr-4">
              <ShoppingBag className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Orders</p>
              <p className="text-2xl font-bold">75</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Sugar</p>
              <p className="text-2xl font-bold">400 kg</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <Store className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Ration Shops</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>

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
          <Chart />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <RecentOrders />

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
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
        </div>
      </main>
    </div>
  )
}

export default SubAdminDashboard;