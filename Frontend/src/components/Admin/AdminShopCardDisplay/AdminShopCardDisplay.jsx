import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User } from 'lucide-react';
import api from '../../../services/api';
import { logoutUser } from '../../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import AdminAside from '../AdminAside/AdminAside';
import AdminHeader from '../AdminHeader/AdminHeader';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';



const AdminShopcardDisplay = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleShopSelect = (shop) => {
        navigate('/shop-display/single-shop-details',{state: {shop}})
    }
    
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

    useEffect(() => {
        fetchShops();
    }, []);
    
    const fetchShops = async () => {
        setLoading(true);
        try {
            const response = await api.get('/ration-shop/shops/', { withCredentials: true });
            setShops(response.data);
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

    const ShopCard = ({ shop }) => {
        const hasImage = shop.profile_image !== null;
        

        return (
            <>
            
            <div 
            className="bg-teal-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer backdrop-blur-sm border border-teal-700"
            onClick={() => handleShopSelect(shop)}
            >
                
                <div className="relative h-48" >
                    {hasImage ? (
                        <img
                            src={shop.profile_image}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-teal-700 via-teal-600 to-teal-700 relative overflow-hidden" >
                            <div className="absolute inset-0" >
                                <div className="absolute w-16 h-16 -left-8 -top-8 bg-orange-300 rounded-full opacity-20 animate-float-slow" />
                                <div className="absolute w-12 h-12 right-4 top-8 bg-teal-300 rounded-full opacity-20 animate-float-medium" />
                                <div className="absolute w-10 h-10 left-12 bottom-4 bg-teal-400 rounded-full opacity-20 animate-float-fast" />
                            </div>
                            
                            <div className="flex items-center justify-center h-full relative z-10">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="p-3 bg-teal-600/80 rounded-full shadow-lg animate-bounce-gentle">
                                        <svg 
                                            className="w-10 h-10 text-orange-400" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth="2" 
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                                            />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <span className="px-4 py-2 rounded-lg bg-teal-600/80 text-white font-medium shadow-md animate-pulse-subtle">
                                            No image available
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="absolute top-0 left-0 w-16 h-16 animate-spin-slow opacity-10">
                                <div className="absolute inset-0 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 animate-spin-slow opacity-10">
                                <div className="absolute inset-0 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                            </div>
                        </div>
                    )}
                    <span 
                        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-sm font-medium
                            ${shop.is_open 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}
                    >
                        {shop.is_open ? 'Open' : 'Closed'}
                    </span>
                </div>
                
                <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-white">{shop.name}</h3>
                    {shop.description && (
                        <p className="text-teal-300 text-sm mb-3">
                            {shop.description}
                        </p>
                    )}
                    
                    <div className="space-y-2">
                        <div className="flex items-center text-teal-300">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="text-sm">{shop.location}</span>
                        </div>
                        
                        <div className="flex items-center text-teal-300">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="text-sm">{shop.mobile_number}</span>
                        </div>
                        
                        {shop.owner_name && (
                            <div className="flex items-center text-teal-300">
                                <User className="w-4 h-4 mr-2" />
                                <span className="text-sm">{shop.owner_name}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-4">
                
            </div>
            </div>
            </>

        );
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-teal-900 to-teal-800">
            {/* Sidebar */}
                <AdminAside handleLogout={handleLogout} />
            
            {/* Main Content */}
            <div className="flex-1 p-8 overflow-auto">
        <AdminHeader/>

                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center p-4">
                        {error}
                    </div>
                ) : (
                    <div >
                        <div className='font-bold text-3xl text-white pb-4'>

                        Shops Available
                        </div>
                        <div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
                        {shops.map((shop) => (
                            <ShopCard key={shop.shop_id} shop={shop} />
                        ))}
                    </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminShopcardDisplay;