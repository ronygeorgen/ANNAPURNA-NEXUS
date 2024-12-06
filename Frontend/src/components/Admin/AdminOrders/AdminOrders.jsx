import React, { useState, useEffect } from 'react'
import { ShoppingBag, Eye, X } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../../../features/auth/authSlice'
import AdminAside from '../AdminAside/AdminAside'
import AdminHeader from '../AdminHeader/AdminHeader'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from '../../../services/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

function AdminOrders() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [errors, setErrors] = useState()

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try{
        const response = await api.get('/order-management/order-list/', {withCredentials: true});
        setOrders(response.data);
        setErrors(null);
    } catch (error) {
        console.log('Error fetching orders: ', error);
        setErrors('Failed to fetch orders');
        toast.error('Failed to fetch orders');
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/admin-login')
      toast.success('Admin logged out successfully')
    } catch (error) {
      console.error("Logout failed", error)
      toast.error('Log out failed')
    }
  }


  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
      {/* Sidebar */}
      <AdminAside handleLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <AdminHeader />

        <h2 className="text-3xl font-semibold text-white mb-6">Orders</h2>

        {/* Orders list */}
        <div className="grid gap-6 mb-8">
          {orders.map((order) => (
            <Card key={order.id} className="bg-teal-800 bg-opacity-50 border-teal-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold text-white">Order #{order.id}</CardTitle>
                <ShoppingBag className="text-orange-400 h-8 w-8" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-teal-300">
                  <div>
                    <p className="font-medium">Customer</p>
                    <p>{order.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p>{order.date} {order.time}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p>${order.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Payment Status</p>
                    <Badge variant={order.status === 'Paid' ? 'success' : 'warning'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      className="mt-4 bg-orange-400 text-teal-900 hover:bg-orange-500"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-teal-800 text-white border-teal-700">
                    <DialogHeader>
                      <DialogTitle>Order Details </DialogTitle>
                      <p className='text-teal-300'>OrderID #{order.id}</p>
                      <DialogDescription className="text-teal-300">
                        Detailed information about the order
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 text-teal-300">
                      <div>
                        <p className="font-medium text-white">Customer Name</p>
                        <p>{order.name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">Date & Time</p>
                        <p>{order.date} {order.time}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">Total Amount</p>
                        <p>${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">Payment Status</p>
                        <Badge variant={order.status === 'Paid' ? 'success' : 'warning'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-white">Payment Mode</p>
                        <p>{order.mode}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white">Address</p>
                        <p>{order.address}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-xl font-semibold text-white mb-2">Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-white-300">Item</TableHead>
                            <TableHead className="text-white-300">Quantity</TableHead>
                            <TableHead className="text-white-300">Total Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-teal-300">{item.name}</TableCell>
                              <TableCell className="text-teal-300">{item.quantity}</TableCell>
                              <TableCell className="text-teal-300">${item.total_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

export default AdminOrders

