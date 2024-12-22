import React, {useState, useEffect} from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Users, Package, Calendar, Plus, Store, MapPin, Phone, User, Loader2 } from 'lucide-react'
import { logoutUser } from '../../../features/auth/authSlice'
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../../services/api';
import NavBar from '../NavBar/NavBar'
import Cart from '../../common/Cart'
import { toast } from 'sonner';

export default function ChooseSubsidies() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [quotaInfo, setQuotaInfo] = useState({
        regular_quota: [],
        additional_quota: []
    });
    const [quotaLoading, setQuotaLoading] = useState(false);
    const [normalItems, setNormalItems] = useState([]);
    const [additionalItems, setAdditionalItems] = useState([]);

    const shop = location.state?.shop;
    const cardDetails = location.state?.cardDetails;

    const [cartItems, setCartItems] = useState(() => {
        const savedCartItems = localStorage.getItem('cartItems');
        return savedCartItems ? JSON.parse(savedCartItems) : [];
    });

    const cardData = {
        card_number: cardDetails?.card_number || 'N/A',
        card_type: {
            name: cardDetails?.card_type?.name || "Card not yet verified by Admin",
        },
        head_of_family: {
            name: cardDetails?.head_name || "Not Available",
            age: cardDetails?.head_age || 0
        },
        family_members: cardDetails?.family_members || [],
        last_transaction_date: cardDetails?.last_transaction_date || new Date().toISOString(),
        valid_until: cardDetails?.valid_until || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
    }

    useEffect(() => {
        const fetchQuotaInfo = async () => {
            // Check if there are items in cart - if yes, don't fetch from backend
            const existingCartItems = localStorage.getItem('cartItems');
            const existingNormalItems = localStorage.getItem('normalItems');
            
            if (existingCartItems && JSON.parse(existingCartItems).length > 0) {
                // If cart has items, load quota info from localStorage
                if (existingNormalItems) {
                    setNormalItems(JSON.parse(existingNormalItems));
                    setAdditionalItems(JSON.parse(localStorage.getItem('additionalItems') || '[]'));
                }
                return; // Don't fetch from backend
            }

            // Only fetch from backend if cart is empty
            if (cardDetails?.card_type?.name || 'antyodaya') {
                setQuotaLoading(true);
                try {
                    const response = await api.get('product-management/quota-info/', {
                        params: {
                            cardType: cardDetails?.card_type?.name,
                            shopId: shop?.shop_id,
                            cardNumber: cardDetails?.card_number
                        }
                    });

                    setQuotaInfo(response.data);
                    console.log(response.data);

                    // Transform and store items
                    const transformedNormalItems = response.data.regular_quota.map(item => ({
                        ...item,
                        name: item.item_name,
                        image: item?.image || null,
                        price: `₹${item.price_per_unit}/${item.item_unit}`,
                        quota: item.max_quantity,
                        remainingQuota: item.remaining_quantity,
                    }));

                    const transformedAdditionalItems = response.data.additional_quota.map(item => ({
                        ...item,
                        name: item.item_name,
                        image: item?.image || null,
                        price: `₹${item.price_per_unit}/${item.item_unit}`,
                        quota: item.max_quantity,
                        remainingQuota: item.remaining_quantity,
                    }));

                    // Store in localStorage and state
                    localStorage.setItem('normalItems', JSON.stringify(transformedNormalItems));
                    localStorage.setItem('additionalItems', JSON.stringify(transformedAdditionalItems));

                    setNormalItems(transformedNormalItems);
                    setAdditionalItems(transformedAdditionalItems);

                } catch (error) {
                    console.error('Error fetching quota information:', error);
                    toast.error('Failed to fetch quota information');
                    setQuotaInfo({ regular_quota: [], additional_quota: [] });
                } finally {
                    setQuotaLoading(false);
                }
            }
        };

        fetchQuotaInfo();
    }, [cardDetails?.card_type?.name, shop?.shop_id]);

    const handleAddToCart = (item) => {
        if (item.remainingQuota <= 0) {
            toast.error(`No quota remaining for ${item.name}`);
            return;
        }

        const newCartItems = [...cartItems];
        const existingCartItem = newCartItems.find(cartItem => cartItem.item_name === item.item_name);

        if (existingCartItem) {
            if (existingCartItem.quantity + item.remainingQuota > item.remaining_quantity) {
                toast.error(`Cannot exceed allocated quota of ${item.remaining_quantity}`);
                return;
            }
            existingCartItem.quantity += item.remainingQuota;
        } else {
            newCartItems.push({ ...item, quantity: item.remainingQuota });
        }

        // Update cart items
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));

        // Update normal items
        const updatedNormalItems = normalItems.map(prevItem =>
            prevItem.item_name === item.item_name
                ? { ...prevItem, remainingQuota: 0 }
                : prevItem
        );
        setNormalItems(updatedNormalItems);
        localStorage.setItem('normalItems', JSON.stringify(updatedNormalItems));

        toast.success(`${item.name} added to cart`);
    };
    const handleIncreaseQuantity = (item) => {
        // Find the original item to check allocated quantity
        const originalItem = normalItems.find(i => i.item_name === item.item_name);
        if (!originalItem) return;
    
        // Find the cart item
        const cartItem = cartItems.find(i => i.item_name === item.item_name);
        if (!cartItem) return;
    
        // Check if increasing would exceed allocated quota
        if (cartItem.quantity + 1 > originalItem.remaining_quantity) {
            toast.error(`Cannot exceed allocated quota of ${originalItem.remaining_quantity}`);
            return;
        }
    
        // Update cart
        const newCartItems = cartItems.map(i =>
            i.item_name === item.item_name
                ? { ...i, quantity: i.quantity + 1 }
                : i
        );
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
    
        // Update normal items
        const updatedNormalItems = normalItems.map(i =>
            i.item_name === item.item_name
                ? { 
                    ...i, 
                    remainingQuota: i.remainingQuota - 1,
                    // remaining_quantity: i.remaining_quantity - 1 
                  }
                : i
        );
        setNormalItems(updatedNormalItems);
        localStorage.setItem('normalItems', JSON.stringify(updatedNormalItems));
    };

    const handleRemoveFromCart = (item) => {
        // Find the item being removed
        const removedItem = cartItems.find(i => i.item_name === item.item_name);
        if (!removedItem) return;
    
        // Remove from cart
        const newCartItems = cartItems.filter(i => i.item_name !== item.item_name);
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));
    
        // If cart is now empty, clear cart from localStorage but keep items data
        if (newCartItems.length === 0) {
            localStorage.removeItem('cartItems');
        }
    
        // Check if item exists in normalItems
        const isNormalItem = normalItems.some(i => i.item_name === item.item_name);
        
        if (isNormalItem) {
            // Update normal items with restored quota
            const updatedNormalItems = normalItems.map(prevItem =>
                prevItem.item_name === item.item_name
                    ? {
                        ...prevItem,
                        remainingQuota: prevItem.remaining_quantity,
                        // remaining_quantity: prevItem.allocated_quantity
                    }
                    : prevItem
            );
            setNormalItems(updatedNormalItems);
            localStorage.setItem('normalItems', JSON.stringify(updatedNormalItems));
        } else {
            // Update additional items with restored quota
            const updatedAdditionalItems = additionalItems.map(prevItem =>
                prevItem.item_name === item.item_name
                    ? {
                        ...prevItem,
                        remainingQuota: prevItem.remaining_quantity,
                        // remaining_quantity: prevItem.allocated_quantity
                    }
                    : prevItem
            );
            setAdditionalItems(updatedAdditionalItems);
            localStorage.setItem('additionalItems', JSON.stringify(updatedAdditionalItems));
        }
    
        toast.success(`${item.name} removed from cart and quota restored.`);
    };

    const handleUpdateQuantity = (item, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(item);
            return;
        }

        const originalItem = normalItems.find(i => i.item_name === item.item_name);
        if (!originalItem) return;

        if (newQuantity > originalItem.remaining_quantity) {
            toast.error(`Cannot exceed allocated quota of ${originalItem.remaining_quantity} kg`);
            return;
        }

        // Update cart
        const newCartItems = cartItems.map(cartItem =>
            cartItem.item_name === item.item_name
                ? { ...cartItem, quantity: newQuantity }
                : cartItem
        );
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));

        // Update normal items
        const updatedNormalItems = normalItems.map(prevItem =>
            prevItem.item_name === item.item_name
                ? {
                    ...prevItem,
                    remainingQuota: prevItem.remaining_quantity - newQuantity,
                    // remaining_quantity: prevItem.allocated_quantity - newQuantity
                }
                : prevItem
        );
        setNormalItems(updatedNormalItems);
        localStorage.setItem('normalItems', JSON.stringify(updatedNormalItems));
    };

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
            toast.success('Logged out successfully!')
        } catch (error) {
            toast.error("Logout failed", error);
        }
    };

    const hasAdditionalItems = additionalItems.length > 0;

    return (
        <div className="min-h-screen bg-gray-100">
            <NavBar handleLogout={handleLogout} />
            <div className="min-h-screen bg-gradient-to-br from-orange-100 to-orange-50 pt-28 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left column - Shop Details */}
                        <div className="lg:col-span-1 flex flex-col items-center space-y-8">
                            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                                            {shop?.profile_image ? (
                                                <img 
                                                    src={shop?.profile_image} 
                                                    alt={shop?.name} 
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <Store className="w-16 h-16 text-orange-500" />
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-semibold mb-2">{shop?.name}</h2>
                                        <Badge 
                                            variant={shop?.is_open ? "success" : "destructive"}
                                            className={`mb-4 ${shop?.is_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                        >
                                            {shop?.is_open ? "Open" : "Closed"}
                                        </Badge>
                                        <div className="space-y-2 text-gray-500">
                                            <p className="flex items-center justify-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {shop?.location}
                                            </p>
                                            <p className="flex items-center justify-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                {shop?.mobile_number}
                                            </p>
                                            {shop?.owner_name && (
                                                <p className="flex items-center justify-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {shop?.owner_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className='flex pt-6 '>
                              <Cart 
                                  cartItems={cartItems} 
                                  onRemoveItem={handleRemoveFromCart}
                                  onUpdateQuantity={handleUpdateQuantity}
                                  onIncreaseQuantity={handleIncreaseQuantity}
                                  shop={shop} 
                                  cardDetails={cardDetails}
                              />
                            </div>
                        </div>

                        {/* Right column - Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Card Header */}
                            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                                <div className="bg-orange-500 p-4 text-white">
                                    <h1 className="text-2xl font-bold">{cardData.card_type.name}</h1>
                                    <p className="text-sm opacity-75">Card Number: {cardData.card_number}</p>
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-lg font-semibold">{cardData.head_of_family.name}</p>
                                            <p className="text-sm text-gray-500">Head of Family</p>
                                        </div>
                                        <Badge variant="outline" className="text-orange-500 border-orange-500">
                                            {cardData.family_members.length + 1} Members
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <p>Last Transaction: {new Date(cardData.last_transaction_date).toLocaleDateString()}</p>
                                        <p>Valid Until: {new Date(cardData.valid_until).toLocaleDateString()}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs Section */}
                            <Tabs defaultValue="quota" className="bg-white rounded-lg shadow-lg">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="quota"><Package className="w-4 h-4 mr-2" /> Quota</TabsTrigger>
                                    <TabsTrigger value="family"><Users className="w-4 h-4 mr-2" /> Family</TabsTrigger>
                                    <TabsTrigger value="shop"><ShoppingCart className="w-4 h-4 mr-2" /> Collect your quota</TabsTrigger>
                                </TabsList>

                                {/* Rest of your existing TabsContent sections */}
                                {/* Quota Tab */}
                                <TabsContent value="quota" className="p-6">
                                      {quotaLoading ? (
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
                                            </div>
                                        ) : (
                                        <>
                                            {normalItems.length === 0 ? ( // Check if no normal items
                                                <div className="flex justify-center items-center h-full">
                                                    <Card className="p-4 text-center">
                                                        <h2 className="text-xl font-semibold text-gray-500">Empty quota</h2>
                                                    </Card>
                                                </div>
                                            ) : (
                                        
                                        
                                            <>
                                                <h2 className="text-xl font-semibold mb-4">Monthly Quota</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {normalItems.map((item) => (
                                                        <Card key={item.name} className="flex items-center p-4 space-x-4">
                                                            {/* <img src={item.image} alt={item.name} className="w-16 h-16 rounded-full" /> */}
                                                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                                              {item.image || <Package className="w-16 h-16 text-orange-500" />} 
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold">{item.item_name}</h3>
                                                                <span>{'('}{((item.allocated_quantity) / (cardData.family_members.length + 1))} {'kg/head)'}</span>
                                                                <Progress value={(item.remaining_quantity / item.allocated_quantity) * 100} className="h-2 mt-2 "  />
                                                                <div className="flex justify-between mt-2 text-sm">
                                                                    <span>Remaining Quota: {item.remaining_quantity} {item.item_name === 'Kerosene' ? 'L' : 'kg'}  </span>
                                                                    <span className="text-orange-500">{item.price}</span>
                                                                </div>
                                                                    <span className='text-sm'>Allocated Quota: {item.allocated_quantity} {item.item_name === 'Kerosene' ? 'L' : 'kg'}  </span>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                                </>
                                                )}
                                                {hasAdditionalItems && (
                                                    <>
                                                        <h2 className="text-xl font-semibold mb-4 mt-8">Additional Items</h2>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {additionalItems.map((item) => (
                                                                <Card key={item.name} className="flex items-center p-4 space-x-4">
                                                                    {/* <img src={item.image} alt={item.name} className="w-16 h-16 rounded-full" /> */}
                                                                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                                                      {item.image}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="font-semibold">{item.item_name}</h3>
                                                                        <Progress value={(item.remaining_quantity / item.allocated_quantity) * 100} className="h-2 mt-2" />
                                                                        <div className="flex justify-between mt-2 text-sm">
                                                                            <span>{item.allocated_quantity} kg</span>
                                                                            <span className="text-orange-500">{item.price}</span>
                                                                        </div>
                                                                    </div>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="family" className="p-6">
                                      <h2 className="text-xl font-semibold mb-4">Family Members</h2>
                                      <div className="space-y-4 pb-4">
                                        <Card key={cardData.id} className="flex items-center p-4 space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                              <span className="text-2xl text-orange-500">{cardData.head_of_family.name[0]}</span>
                                            </div>
                                            <div>
                                              <p className="font-semibold">{cardData.head_of_family.name}</p>
                                              <p className="text-sm text-gray-500">Age: {cardData.head_of_family.age }</p>
                                            </div>
                                              <Badge className="ml-auto" variant="secondary">Head</Badge>
                                            
                                        </Card>
                                      </div>
                                      <div className="space-y-4">
                                        {(cardData.family_members).map((member, index) => (
                                          <Card key={index} className="flex items-center p-4 space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                              <span className="text-2xl text-orange-500">{member.name[0]}</span>
                                            </div>
                                            <div>
                                              <p className="font-semibold">{member.name}</p>
                                              <p className="text-sm text-gray-500">Age: {member.age }</p>
                                            </div>
                                          </Card>
                                        ))}
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="shop" className="p-6">
                                      <h2 className="text-xl font-semibold mb-4">Shop Now</h2>
                                      {quotaLoading ? (
                                          <div className="flex justify-center items-center h-full">
                                              <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
                                          </div>
                                      ) : (
                                          <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {normalItems
                                              .filter(item => item.remainingQuota > 0)
                                              .map((item) => (
                                                    <Card key={item.item_name} className="p-4">
                                                        {/* <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-md mb-4" /> */}
                                                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                                        {item.image || <Package className="w-16 h-16 text-orange-500" />} 
                                                        </div>
                                                        <h3 className="font-semibold">{item.item_name}</h3>
                                                        <p className="text-sm text-gray-500 mb-2">{item.price}</p>
                                                        <p className="text-sm text-gray-500">
                                                            Remaining Quota: {item.remainingQuota}
                                                        </p>
                                                        <Button className="w-full bg-orange-500 hover:bg-orange-600"
                                                            onClick={() => handleAddToCart(item)}
                                                            >
                                                            <ShoppingCart className="w-4 h-4 mr-2" />
                                                            Add to Cart
                                                        </Button>
                                                    </Card>
                                                ))}
                                            </div>

                                            {hasAdditionalItems && (
                                                <>
                                                    <h2 className="text-xl font-semibold mb-4 mt-8">Additional Items</h2>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                        {additionalItems.map((item) => (
                                                            <Card key={item.name} className="p-4">
                                                                {/* <img src={item.image} alt={item.name} className="w-full h-32 object-cover rounded-md mb-4" /> */}
                                                                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                                                  {item.image}
                                                                </div>
                                                                <h3 className="font-semibold">{item.name}</h3>
                                                                <p className="text-sm text-gray-500 mb-2">{item.price}</p>
                                                                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                                    Add to Cart
                                                                </Button>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                          </>
                                      )}
                                  </TabsContent>
                                  </Tabs>
                                  

                                  {/* Calendar for next refill */}
                                </div>
                              </div>
                              </div>
                              <div className='pt-6'>
                                  <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                                    <CardContent className="p-6">
                                      <div className="flex items-center space-x-4">
                                        <Calendar className="w-12 h-12 text-orange-500" />
                                        <div>
                                          <h2 className="text-xl font-semibold">Next Refill Date</h2>
                                          <p className="text-gray-500">Mark your calendar for the next ration collection</p>
                                        </div>
                                      </div>
                                      <div className="mt-4 p-4 bg-orange-100 rounded-lg text-center">
                                        <p className="text-3xl font-bold text-orange-500">
                                          {new Date(new Date().setDate(1)).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className="text-sm text-orange-700">Next month's ration available from this date</p>
                                      </div>
                                    </CardContent>
                        </Card>
                  </div>
            </div>
     </div>
    
   )
}
                       