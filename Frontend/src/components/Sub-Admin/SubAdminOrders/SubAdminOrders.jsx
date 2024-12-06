import React, { useState, useEffect } from 'react'
import { ShoppingBag, Eye, X } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { json, useNavigate } from 'react-router-dom'
import SubAdminAside from '../SubAdminAside/SubAdminAside'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from '../../../services/api'
import { logoutUser } from '../../../features/auth/authSlice'
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

function SubAdminOrders() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [errors, setErrors] = useState()


  const shopID = JSON.parse(JSON.parse(localStorage.getItem('persist:profile')).data).shopID
  
    useEffect(() => {
        fetchOrders();
    }, []);


    const fetchOrders = async () => {
        setLoading(true);
        try{
            const response = await api.get('/order-management/order-list-sub-admin/', {withCredentials: true,
                params: {
                    shop_id: shopID
                }
            });
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
          navigate('/sub-admin-login')
          toast.success('Logout successful!')
        } catch (error) {
          const errorMessage = error.non_field_errors ? error.non_field_errors[0] : 'An error occured';
          toast.error(`Logout failed: ${errorMessage} `)
          console.error("Logout failed", error)
        }
      }

  return (
    <div className="flex h-screen bg-gray-100 ">
      {/* Sidebar */}
      <SubAdminAside handleLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-3xl text-grey font-bold mb-6">Orders</h2>

        {/* Orders list */}
        <div className="grid gap-6 mb-8">
          {orders.map((order) => (
            <Card key={order.id} className="bg-white-800 bg-opacity-50 hover:shadow-lg transition-all duration-300 ">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold text-gray-600">Order #{order.id}</CardTitle>
                <ShoppingBag className="text-teal-400 h-8 w-8" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
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
                      className="mt-4 bg-teal-500 text-white hover:bg-teal-600"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className=" text-gray-800 border-teal-900">
                    <DialogHeader>
                      <DialogTitle>Order Details #{order.id}</DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Detailed information about the order
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 text-gray-900">
                      <div>
                        <p className="font-bold">Customer Name</p>
                        <p>{order.name}</p>
                      </div>
                      <div>
                        <p className="font-bold">Date & Time</p>
                        <p>{order.date} {order.time}</p>
                      </div>
                      <div>
                        <p className="font-bold">Total Amount</p>
                        <p>${order.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-bold">Payment Status</p>
                        <Badge variant={order.status === 'Paid' ? 'success' : 'warning'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-bold">Payment Mode</p>
                        <p>{order.mode}</p>
                      </div>
                      <div>
                        <p className="font-bold">Address</p>
                        <p>{order.address}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-xl font-semibold text-gray mb-2">Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-gray-700">Item</TableHead>
                            <TableHead className="text-gray-700">Quantity</TableHead>
                            <TableHead className="text-gray-700">Total Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-gray-700">{item.name}</TableCell>
                              <TableCell className="text-gray-700">{item.quantity} kg</TableCell>
                              <TableCell className="text-gray-700">₹ {item.total_price}</TableCell>
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

export default SubAdminOrders

