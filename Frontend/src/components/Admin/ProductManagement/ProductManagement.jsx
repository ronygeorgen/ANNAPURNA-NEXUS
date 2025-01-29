import React, { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShoppingCart } from 'lucide-react'
import AdminAside from '../AdminAside/AdminAside'
import AdminHeader from '../AdminHeader/AdminHeader'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { logoutUser } from '../../../features/auth/authSlice'
import { toast } from 'sonner';



const KERALA_CARD_TYPES = [
  { value: 'antyodaya', label: 'Antyodaya Anna Yojana (AAY)' },
  { value: 'priority_household', label: 'Priority Household (PHH)' },
  { value: 'non_priority_household', label: 'Non-Priority Household (NPHH)' },
  { value: 'antodaya_anna_scheme', label: 'Antodaya Anna Scheme' },
  { value: 'anna_poorana_scheme', label: 'Anna Poorana Scheme' }
]

const QUOTA_CATEGORIES = [
  { value: 'regular', label: 'Regular Quota' },
  { value: 'additional', label: 'Additional Quota' }
]

const UNIT_CHOICES = [
  { value: 'kg', label: 'Kilogram' },
  { value: 'litre', label: 'Litre' },
  { value: 'gm', label: 'gram' }
]

const ProductManagement = () => {
  const [formData, setFormData] = useState({
    cardType: '',
    shopId: '',
    itemName: '',
    itemCategory: '',
    itemUnit: 'kg',
    quotaMaxQuantity: 0,
    quotaPricePerUnit: 0,
    totalQuantity: 0
  })

    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

  const [familyCount, setFamilyCount] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchFamilyCount = async () => {
      if (formData.cardType && formData.shopId) {
        setIsLoading(true)
        try {
          
          // Temporary mock data for demonstration
          setFamilyCount(Math.floor(Math.random() * 50) + 1)
        } catch (error) {
          console.error('Error fetching family count:', error)
          setFamilyCount(null)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchFamilyCount()
  }, [formData.cardType, formData.shopId])


  useEffect(() => {
    fetchShops();
}, []);

const fetchShops = async () => {
    setLoading(true);
    try {
        const response = await api.get('/ration-shop/shops/', { withCredentials: true });
        setShops(response.data);
        console.log('response data of shopn card',response.data);
        
        console.log('response data of shopn card',response.data);
        
        setError(null);
    } catch (error) {
        console.error('Error fetching shops:', error);
        setError('Failed to fetch shops. Please try again later.');
        toast.error('Failed to fetch shops');
    } finally {
        setLoading(false);
    }
};

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    
    setIsSubmitting(true)

    try {
        const response = await api.post('product-management/create/',formData)
        console.log(response);
        
        if (response.data.status === 'success') {
          toast.success('Product Management Data Submitted Successfully')
          // Optional: Reset form or perform additional actions
          setFormData({
            cardType: '',
            shopId: '',
            itemName: '',
            itemCategory: '',
            itemUnit: 'kg',
            quotaMaxQuantity: 0,
            quotaPricePerUnit: 0,
            totalQuantity: 0
          })
        } else {
          toast.error('Submission Failed')
        }
      } catch (error) {
        toast.error('Error submitting data')
        console.error('Submission error:', error)
      } finally {
        setIsSubmitting(false)
      }


  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
      <AdminAside handleLogout={handleLogout} />

      <main className="flex-1 p-8">
      <AdminHeader/>

        <div className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <ShoppingCart className="mr-2" /> Product Management
          </h2>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Card Type</Label>
                <Select 
                  value={formData.cardType}
                  onValueChange={(value) => handleInputChange('cardType', value)}
                >
                  <SelectTrigger className="bg-teal-700 text-white border-teal-600">
                    <SelectValue placeholder="Select Ration Card Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {KERALA_CARD_TYPES.map((cardType) => (
                      <SelectItem key={cardType.value} value={cardType.value}>
                        {cardType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                  <Label className="text-white">Shop</Label>
                  <Select 
                    value={formData.shopId}
                    onValueChange={(value) => handleInputChange('shopId', value)}
                  >
                    <SelectTrigger className="bg-teal-700 text-white border-teal-600">
                      <SelectValue placeholder="Select Shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops.map((shop) => (
                        <SelectItem key={shop.shop_id} value={shop.shop_id.toString()}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            {/* {formData.cardType && formData.shopId && (
              <div className="bg-teal-700 p-4 rounded-lg shadow-inner">
                <Label className="text-white font-bold">Total Family Members</Label>
                <div className="text-3xl font-semibold text-orange-400 mt-2">
                  {isLoading 
                    ? <Loader2 className="animate-spin" />
                    : familyCount !== null 
                      ? familyCount 
                      : 'No data available'}
                </div>
              </div>
            )} */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Item Name</Label>
                <Input 
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  placeholder="Enter item name"
                  className="bg-teal-700 text-white border-teal-600 placeholder-teal-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Item Category</Label>
                <Select 
                  value={formData.itemCategory}
                  onValueChange={(value) => handleInputChange('itemCategory', value)}
                >
                  <SelectTrigger className="bg-teal-700 text-white border-teal-600">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTA_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Unit</Label>
                <Select 
                  value={formData.itemUnit}
                  onValueChange={(value) => handleInputChange('itemUnit', value)}
                >
                  <SelectTrigger className="bg-teal-700 text-white border-teal-600">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_CHOICES.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Quota Max Quantity Per Person</Label>
                <Input 
                  type="number"
                  value={formData.quotaMaxQuantity}
                  onChange={(e) => handleInputChange('quotaMaxQuantity', parseFloat(e.target.value))}
                  placeholder="Maximum allowed quantity"
                  className="bg-teal-700 text-white border-teal-600 placeholder-teal-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Price per Unit</Label>
                <Input 
                  type="number"
                  value={formData.quotaPricePerUnit}
                  onChange={(e) => handleInputChange('quotaPricePerUnit', parseFloat(e.target.value))}
                  placeholder="Price per unit"
                  step="0.01"
                  className="bg-teal-700 text-white border-teal-600 placeholder-teal-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Total Quantity for the shop</Label>
                <Input 
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) => handleInputChange('totalQuantity', parseFloat(e.target.value))}
                  placeholder="Total stock quantity"
                  className="bg-teal-700 text-white border-teal-600 placeholder-teal-300"
                />
              </div>
            </div>

            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit'}
            </Button>
          </form>
        </CardContent>
        </div>
      </main>
    </div>
  )
}

export default ProductManagement