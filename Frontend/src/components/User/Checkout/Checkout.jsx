import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, MapPin, Phone, ShoppingBag, User, ChevronRight, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NavBar from '../NavBar/NavBar';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../services/api';
import { toast } from 'sonner';

const AddressModal = ({ isOpen, onClose, addresses, onSelectAddress, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-orange-700 flex items-center justify-between">
            Select Previous Address
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading addresses...</p>
            </div>
          ) : addresses.length > 0 ? (
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    onSelectAddress(address);
                    onClose();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="font-medium">{address.first_name} {address.last_name}</p>
                        <p className="text-sm text-gray-600">{address.address_line}</p>
                        <p className="text-sm text-gray-600">{address.state}, {address.country} - {address.pincode}</p>
                        <p className="text-sm text-gray-600">{address.mobile_number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No previous addresses found. Please enter a new address.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Checkout({stripePromise}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousAddresses, setPreviousAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user email from Redux store
  const userId = useSelector(state => state.auth.user?.id);
  const userEmail = useSelector(state => state.auth.user?.email);
  console.log('User email:', userEmail);
  
  
  const shopDetails = location.state?.shop || {};
  const cardDetails = location.state?.cardDetails || {};
  const cartItems = location.state?.cartItems || [];
  
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

  const steps = ['Order Summary', 'Shipping', 'Payment'];

  // Fetch previous addresses when component mounts
  useEffect(() => {
    const fetchPreviousAddresses = async () => {
      if (userEmail) {
        setIsLoadingAddresses(true);
        try {
          const response = await api.get(`/order-management/user-addresses/${userEmail}/`);
          setPreviousAddresses(response.data);
        } catch (error) {
          console.error('Error fetching addresses:', error);
          toast.error('Failed to fetch previous addresses');
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    fetchPreviousAddresses();
  }, [userEmail]);

  const handleSelectAddress = (address) => {
    setAddressDetails({
      first_name: address.first_name,
      last_name: address.last_name,
      mobile_number: address.mobile_number,
      address_line: address.address_line,
      landmark: address.landmark || '',
      state: address.state,
      country: address.country,
      pincode: address.pincode
    });
  };

  const handleAddressInputChange = (e) => {
    const { id, value } = e.target;
    setAddressDetails(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const calculateTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price_per_unit * item.quantity), 0);
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

  const handleCODOrder = async (orderData) => {
    try {
      const response = await api.post('/order-management/order-create/', orderData);
  
      if (response.status === 201) {
        toast.success('Order placed successfully!');
        // Clear cart items from localStorage
        localStorage.removeItem('cartItems');
        localStorage.removeItem('normalItems');
        localStorage.removeItem('additionalItems');
        navigate('/home/selected-shop/choose-subsidies/checkout-page/COD-success');
      }
    } catch (error) {
      console.error('COD Order placement failed:', error);
      throw error;
    }
  };

  const handleStripePayment = async (orderData) => {
    try {
      const response = await api.post('/order-management/create-checkout-session/', orderData);
      window.location.href = response.data.stripe_session_url;
    } catch (error) {
      console.error('Stripe payment initialization failed:', error);
      throw error;
    }
  };

  const handlePlaceOrderOrPayment = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const orderItems = cartItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity,
        total_price: item.price_per_unit * item.quantity,
        unit_amount: item.price_per_unit
      }));

      const paymentData = {
        payment_method: paymentMethod,
        payment_status: 'PENDING',
        payment_id: paymentMethod === 'COD' ? 'COD' : null,
        transaction_id: null
      };

      const orderData = {
        userId: userId,
        user: userEmail,
        shop: shopDetails.shop_id,
        card_number: cardDetails?.card_number,
        address: addressDetails,
        order_items: orderItems,
        payment: paymentData,
        total_amount: calculateTotalAmount(),
        status: 'PENDING'
      };

      switch (paymentMethod) {
        case 'COD':
          await handleCODOrder(orderData);
          break;
        case 'STRIPE':
          await handleStripePayment(orderData);
          break;
        case 'PAYPAL':
          toast.error('PayPal payment not implemented yet');
          break;
        default:
          toast.error('Invalid payment method');
      }
        
    } catch (error) {
      console.error('Order placement failed:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PreviousAddresses = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-orange-700">Previous Addresses</h3>
        <Button 
          variant="outline" 
          className="hover:bg-orange-100"
          onClick={() => setIsAddressModalOpen(true)}
        >
          View All Addresses
        </Button>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={previousAddresses}
        onSelectAddress={handleSelectAddress}
        isLoading={isLoadingAddresses}
      />
    </div>
  );

  return (
    <div>
      <NavBar handleLogout={handleLogout} />
      <div className="container mx-auto p-4 pt-24 space-y-8">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardTitle className="text-2xl font-bold">Checkout</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step Indicators */}
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

            {/* Step Content */}
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
                
                {/* Previous Addresses Section */}
                <PreviousAddresses />
                
                <Separator className="my-6" />
                
                <h3 className="text-lg font-semibold mb-4 text-orange-700">
                  {previousAddresses.length > 0 ? 'Edit Address' : 'New Address'}
                </h3>

                {/* Address Form */}
                <form className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input 
                      id="first_name" 
                      value={addressDetails.first_name} 
                      onChange={handleAddressInputChange} 
                      placeholder="First Name" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input 
                      id="last_name" 
                      value={addressDetails.last_name} 
                      onChange={handleAddressInputChange} 
                      placeholder="Last Name" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input 
                      id="mobile_number" 
                      value={addressDetails.mobile_number} 
                      onChange={handleAddressInputChange} 
                      placeholder="Mobile Number" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address_line">Address</Label>
                    <Textarea 
                      id="address_line" 
                      value={addressDetails.address_line} 
                      onChange={handleAddressInputChange} 
                      placeholder="Enter your address" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input 
                      id="landmark" 
                      value={addressDetails.landmark} 
                      onChange={handleAddressInputChange} 
                      placeholder="Landmark (Optional)" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      value={addressDetails.state} 
                      onChange={handleAddressInputChange}
                      placeholder="State" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      value={addressDetails.country} 
                      onChange={handleAddressInputChange} 
                      placeholder="Country" 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input 
                      id="pincode" 
                      value={addressDetails.pincode} 
                      onChange={handleAddressInputChange} 
                      placeholder="Pincode" 
                    />
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
                      <RadioGroupItem value="STRIPE" id="stripe" className="mr-4" />
                      <Label htmlFor="stripe">Stripe Payment</Label>
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
              onClick={currentStep === 3 ? handlePlaceOrderOrPayment : () => setCurrentStep(currentStep + 1)}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white transition-colors duration-300"
            >
              {isSubmitting ? 'Processing...' : currentStep === 3 ? 'Place Order' : 'Next'}
              {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>

        {/* Order Details Card */}
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
              <span>{userEmail}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}