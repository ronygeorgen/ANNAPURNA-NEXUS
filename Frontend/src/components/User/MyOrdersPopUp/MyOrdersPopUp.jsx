import { useState, useEffect } from 'react'
import { Search, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '../../../services/api'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useSelector } from 'react-redux';


export function MyOrdersPopUp() {
    const [cardNumber, setCardNumber] = useState('')
    const [searchedOrders, setSearchedOrders] = useState(null)
    const [userOrders, setUserOrders] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [shopNames, setShopNames] = useState({})
    const userEmail = useSelector((state) => state.auth.user?.email);


    const downloadOrderAsPDF = async (order, pdfWidth = 500, pdfHeight = 490) => {
      const input = document.getElementById(`order-card-${order.id}`);
    
      try {
        const canvas = await html2canvas(input, { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          windowWidth: pdfWidth, // Use the actual content width
          windowHeight: pdfHeight, // Use the actual content height
          height: pdfHeight,
          width: pdfWidth
        });
        const imgData = canvas.toDataURL('image/png');
    
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight] // Use actual card dimensions
        });
    
        // Add image at full resolution
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
        doc.save(`Order_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.error('Failed to download order details');
      }
    };

    const fetchAllShops = async () => {
      try {
        const response = await api.get('/ration-shop/fetch-all-shops/')

        const shopMapping = response.data.reduce((acc, shop) => {
          acc[shop.shop_id] = shop.name
          return acc
        }, {})
        localStorage.setItem('shopNames', JSON.stringify(shopMapping))
        return shopMapping
      } catch (error) {
        console.log('error fetching shops: ', error);
        toast.error('Failed to fetch shop information')
        return {}
      }
    }

    

    const fetchUserOrders = async () => {

        if (!userEmail) {
          toast.error('User email not found')
          return
        }
    
        setIsLoading(true)
        try {
          let shopMapping = JSON.parse(localStorage.getItem('shopNames')) || {}

          if (Object.keys(shopMapping).length === 0) {
            shopMapping = await fetchAllShops()
          }

          const response = await api.get(`/order-management/order-list-user/`, {
            params: { user_email: userEmail },
            withCredentials: true 
          })

          const orderWithShopNames = response.data.map(order => ({
            ...order,
            shopName: shopMapping[order.shop] || 'Unknown Shop'
          }))
    
          setUserOrders(orderWithShopNames)
          setShopNames(shopMapping)
        } catch (error) {
          console.error('Error fetching orders:', error)
          toast.error('Failed to fetch orders')
        } finally {
          setIsLoading(false)
        }
    }
    
    const handleCardSearch = async (e) => {
        e.preventDefault()
        if (!cardNumber) {
          toast.error('Please enter a card number')
          return
        }
    
        setIsLoading(true)
        try {

          let shopMapping = JSON.parse(localStorage.getItem('shopNames')) || {}

          if (Object.keys(shopMapping).length === 0) {
            shopMapping = await fetchAllShops()
          }

          const response = await api.get(`/order-management/order-list-cardbased/`, {
            params: { card_number: cardNumber },
            withCredentials: true
          })

          const orderWithShopNames = response.data.map(order => ({
            ...order,
            shopName: shopMapping[order.shop] || 'Unknown Shop'
          }))
    
          setSearchedOrders(orderWithShopNames)
          setShopNames(shopMapping)
        } catch (error) {
          console.error('Error searching orders:', error)
          toast.error('Failed to search orders')
        } finally {
          setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUserOrders()
    }, [])

    const OrderCard = ({ order, showOrderedUser, showOrderedCard }) => (
        <Card 
        id={`order-card-${order.id}`}
        className="bg-white shadow-md hover:shadow-lg transition-all duration-300 w-full">

          <CardHeader className="flex flex-col items-start pb-2 space-y-2">
          <div className="flex items-center w-full">
              <svg className="w-10 h-10 mr-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" stroke="#38B2AC" strokeWidth="10"/>
                  <path d="M50 25L75 75H25L50 25Z" fill="#F6AD55"/>
              </svg>
              <span className="text-xl font-bold text-gray-800">ANNAPURNA NEXUS</span>
          </div>
          <div className="flex items-center w-full justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">
                  Order #{order.id}
              </CardTitle>
              <Badge variant={order.status === 'DELIVERED' ? 'success' : 'warning'}>
                  {order.status}
              </Badge>
          </div>
            
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span>{order.date} {order.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ordered From:</span>
                <span>{order.shopName || 'Loading...'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Grand Total:</span>
                <span className="font-semibold">₹{order.total}</span>
              </div>
              {showOrderedUser && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ordered User:</span>
                  <span>{order.name}</span>
                </div>
              )}
              {showOrderedCard && order.card_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ordered Card:</span>
                  <span>{order.card_number}</span>
                </div>
              )}
              <div className="mt-2">
                <span className="text-sm text-gray-600 font-semibold">Order Items:</span>
                <table className="w-full mt-1 text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1 text-left">Item</th>
                      <th className="border p-1 text-right">Quantity</th>
                      <th className="border p-1 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border p-1 text-gray-700">{item.name}</td>
                        <td className="border p-1 text-right">{item.quantity} Kg</td>
                        <td className="border p-1 text-right">₹{item.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end p-4">
          <Button 
              onClick={() => downloadOrderAsPDF(order)}
              variant="outline" 
              className="hover:bg-gray-100"
          >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
          </Button>
      </div>
        </Card>
    )
    
    return (
        <Dialog>
          <DialogTrigger asChild>
          <button className="w-full text-left text-gray-600 hover:text-orange-500 md:hover:bg-transparent hover:bg-orange-500  md:font-medium transition-colors duration-200 md:w-auto md:p-0 rounded-md">
              My Orders
            </button>
          </DialogTrigger>
          <DialogContent 
            className="sm:max-w-[600px] max-h-[80vh] flex flex-col"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">My Orders</DialogTitle>
            </DialogHeader>
    
            <Tabs defaultValue="user" className="w-full flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">My Orders</TabsTrigger>
                <TabsTrigger value="card">Search by Card</TabsTrigger>
              </TabsList>
    
              <TabsContent value="user" className="flex-1 overflow-auto">
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                  {isLoading ? (
                    <div className="text-center text-gray-500">Loading orders...</div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center text-gray-500">No orders found</div>
                  ) : (
                    userOrders.map(order => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        showOrderedUser={false} 
                        showOrderedCard={true}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
    
              <TabsContent value="card" className="flex-1">
                <form onSubmit={handleCardSearch} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter card number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-[#ff6b00] hover:bg-[#ff6b00]/90"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
    
                  <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-2">
                    {isLoading ? (
                      <div className="text-center text-gray-500">Searching...</div>
                    ) : searchedOrders && searchedOrders.length > 0 ? (
                      searchedOrders.map(order => (
                        <OrderCard 
                          key={order.id} 
                          order={order} 
                          showOrderedUser={true} 
                          showOrderedCard={false} 
                        />
                      ))
                    ) : searchedOrders && searchedOrders.length === 0 ? (
                      <div className="text-center text-gray-500">No orders found for this card</div>
                    ) : null}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
    )
}