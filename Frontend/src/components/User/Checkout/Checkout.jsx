import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, MapPin, Phone, ShoppingBag, User, ChevronRight, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import NavBar from '../NavBar/NavBar'
import { logoutUser } from '../../../features/auth/authSlice'
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../../../services/api';

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  
  const [addressDetails, setAddressDetails] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    address_line: '',
    landmark: '',
    state: '',
    country: '',
    pincode: ''
});

const [paymentMethod, setPaymentMethod] = useState('COD');

const userDetailsSerialized = localStorage.getItem('persist:auth');
const userDetails = userDetailsSerialized ? JSON.parse(JSON.parse(userDetailsSerialized).user) : {};

const shopDetails = location.state?.shop || {};
const cardDetails = location.state?.cardDetails || {};
const cartItems = location.state?.cartItems || [];

const steps = ['Order Summary', 'Shipping', 'Payment']

const calculateTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
};

const handleAddressInputChange = (e) => {
    const { id, value } = e.target;
    setAddressDetails(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['first_name', 'last_name', 'mobile_number', 'address_line', 'state', 'country', 'pincode'];
    const emptyFields = requiredFields.filter(field => !addressDetails[field]);
    
    if (emptyFields.length > 0) {
      toast.error(`Please fill in all required fields`);
      return false;
    }
    return true;
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

 const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity,
        total_price: item.price_per_unit * item.quantity
      }));

      // Prepare payment data
      const paymentData = {
        payment_method: paymentMethod,
        payment_status: 'PENDING',
        payment_id: paymentMethod === 'COD' ? 'COD' : null,
        transaction_id: null // Will be updated for PayPal/Razorpay
      };

      // Prepare complete order data
      const orderData = {
        user: userDetails.email,
        shop: shopDetails.shop_id,
        card_number: cardDetails?.card_number,
        address: addressDetails,
        order_items: orderItems,
        payment: paymentData,
        total_amount: calculateTotalAmount(),
        status: 'PENDING'
      };
        console.log('order data printing before api call ',orderData);
        
      // Submit order
      const response = await api.post('/order-management/order-create/', orderData);

      if (response.status === 201) {
        toast.success('Order placed successfully!');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('normalItems');
        localStorage.removeItem('additionalItems');
        // Navigate to order confirmation
        navigate('/home', { 
        //   state: { 
        //     orderId: response.data.order_id
        //   }
        });
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
    <NavBar handleLogout={handleLogout} />
    <div className="container mx-auto p-4 pt-24 space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardTitle className="text-2xl font-bold">Checkout</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index + 1 <= currentStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1 < currentStep ? <Check className="w-6 h-6" /> : index + 1}
                </div>
                <span className="mt-2 text-sm">{step}</span>
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-orange-700">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="flex justify-between items-center p-4">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity} {item.item_unit}</p>
                        <p className="text-sm text-gray-500">₹{item.price_per_unit}/{item.item_unit}</p>
                      </div>
                      <p className="font-semibold text-orange-600">₹{(item.price_per_unit * item.quantity).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-orange-600">₹{calculateTotalAmount()}</span>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-orange-700">Shipping Address</h2>
              <form className="grid gap-4 sm:grid-cols-2">
                {/* First Name */}
                <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" value={addressDetails.first_name} onChange={handleAddressInputChange} placeholder="First Name" className="focus:ring-orange-500" />
                </div>

                {/* Last Name */}
                <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" placeholder="Last Name" value={addressDetails.last_name} onChange={handleAddressInputChange} className="focus:ring-orange-500" />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 sm:col-span-2">
                    {/* Mobile Number */}
                    <div className="grid gap-2">
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input id="mobile_number" value={addressDetails.mobile_number} onChange={handleAddressInputChange} type="tel" placeholder="Mobile Number" className="focus:ring-orange-500" />
                    </div>

                    {/* Address */}
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address_line" value={addressDetails.address_line} onChange={handleAddressInputChange}  placeholder="Enter your address" className="focus:ring-orange-500" />
                    </div>
                </div>

                {/* Landmark and State on single line */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 sm:col-span-2">
                    {/* Landmark */}
                    <div className="grid gap-2">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input id="landmark" value={addressDetails.landmark} onChange={handleAddressInputChange} type="text" placeholder="Landmark" className="focus:ring-orange-500" />
                    </div>
                    {/* State */}
                    <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={addressDetails.state} onChange={handleAddressInputChange} type="text" placeholder="State" className="focus:ring-orange-500" />
                    </div>
                </div>

                {/* Country and Pincode on single line */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 sm:col-span-2">
                    {/* Country */}
                    <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={addressDetails.country} onChange={handleAddressInputChange} type="text" placeholder="Country" className="focus:ring-orange-500" />
                    </div>
                    {/* Pincode */}
                    <div className="grid gap-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" value={addressDetails.pincode} onChange={handleAddressInputChange} type="text" placeholder="Pincode" className="focus:ring-orange-500" />
                    </div>
                </div>
            </form>

            </motion.div>
          )}

    {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-orange-700">Payment Method</h2>
          <RadioGroup 
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <Card className="mb-3 hover:shadow-md transition-shadow duration-300">
              <CardContent className="flex items-center p-4">
                <RadioGroupItem value="COD" id="cod" className="mr-4" />
                <Label htmlFor="cod">Cash on Delivery</Label>
              </CardContent>
            </Card>
            <Card className="mb-3 hover:shadow-md transition-shadow duration-300">
              <CardContent className="flex items-center p-4">
                <RadioGroupItem value="PAYPAL" id="paypal" className="mr-4" />
                <Label htmlFor="paypal">PayPal</Label>
              </CardContent>
            </Card>
            <Card className="mb-3 hover:shadow-md transition-shadow duration-300">
              <CardContent className="flex items-center p-4">
                <RadioGroupItem value="RAZORPAY" id="razorpay" className="mr-4" />
                <Label htmlFor="razorpay">Razorpay</Label>
              </CardContent>
            </Card>
          </RadioGroup>
        </motion.div>
      )}
        </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 p-6">
            {currentStep > 1 && (
            <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
                className="hover:bg-orange-100 transition-colors duration-300"
            >
                Back
            </Button>
            )}
            <Button 
            onClick={currentStep === 3 ? handlePlaceOrder : () => setCurrentStep(currentStep + 1)}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-300"
            >
            {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Place Order' : 'Next'}
            {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
        </CardFooter>
      </Card>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-700">Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center space-x-2 text-orange-600">
            <ShoppingBag className="h-5 w-5" />
            <span>{shopDetails.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <Phone className="h-5 w-5" />
            <span>{shopDetails.mobile_number}</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <CreditCard className="h-5 w-5" />
            <span>{cardDetails.card_number}, {cardDetails.head_name}</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <User className="h-5 w-5" />
            <span>{userDetails.email}</span>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

